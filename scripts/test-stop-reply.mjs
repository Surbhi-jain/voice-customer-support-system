/**
 * One-round integration tests for stop-reply behavior.
 * Run: node scripts/test-stop-reply.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:3002";

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function fetchChat(body, signal) {
  const response = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}

async function testPageUi() {
  const html = await fetch(BASE).then((r) => r.text());
  if (html.includes("Start conversation")) {
    pass('UI contains "Start conversation"');
  } else {
    fail('UI contains "Start conversation"');
  }

  // Client component — labels ship in JS chunks, not always in first HTML paint.
  const chunkUrls = [...html.matchAll(/\/_next\/static\/chunks\/[^"']+page[^"']*\.js/g)].map(
    (m) => m[0],
  );
  const uniqueChunks = [...new Set(chunkUrls)];
  let bundleText = html;
  for (const path of uniqueChunks.slice(0, 3)) {
    try {
      bundleText += await fetch(`${BASE}${path}`).then((r) => r.text());
    } catch {
      // ignore missing chunk
    }
  }

  const bundleChecks = [
    "Stop reply",
    "End session",
    "Click Stop reply to interrupt",
  ];
  for (const label of bundleChecks) {
    if (bundleText.includes(label)) {
      pass(`Client bundle contains "${label}"`);
    } else {
      fail(`Client bundle contains "${label}"`);
    }
  }
}

async function testChatWorks() {
  const { response, data } = await fetchChat({
    messages: [{ role: "user", content: "Say hello in one short sentence." }],
    language: "en-US",
  });
  if (!response.ok) {
    fail("Chat API returns 200", `status ${response.status}`);
    return;
  }
  if (!data.reply || typeof data.reply !== "string") {
    fail("Chat API returns reply string");
    return;
  }
  pass("Chat API returns 200 with reply", `${data.reply.length} chars`);
}

async function testAbortDuringThinking() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5);

  try {
    await fetchChat(
      {
        messages: [
          { role: "user", content: "Write a very long essay about customer support." },
        ],
        language: "en-US",
      },
      controller.signal,
    );
    fail("Abort during thinking", "fetch completed instead of aborting");
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      pass("Abort during thinking", "fetch aborted with AbortError");
    } else {
      fail("Abort during thinking", err?.message ?? String(err));
    }
  }
}

async function testFollowUpAfterAbort() {
  // Simulates: user aborted first question, then asks another in same conversation.
  const history = [{ role: "user", content: "What is 2 plus 2?" }];
  const { response, data } = await fetchChat({
    messages: history,
    language: "en-US",
  });
  if (!response.ok || !data.reply) {
    fail("Follow-up chat after abort simulation");
    return;
  }

  const followUp = await fetchChat({
    messages: [
      ...history,
      { role: "assistant", content: data.reply },
      { role: "user", content: "What is 3 plus 3?" },
    ],
    language: "en-US",
  });

  if (followUp.response.ok && followUp.data.reply) {
    pass(
      "Follow-up question in same conversation",
      `${followUp.data.reply.slice(0, 60)}…`,
    );
  } else {
    fail("Follow-up question in same conversation");
  }
}

async function testBuildArtifacts() {
  const { execSync } = await import("node:child_process");
  try {
    execSync("npm run build", {
      cwd: new URL("..", import.meta.url).pathname,
      stdio: "pipe",
    });
    pass("Production build");
  } catch (err) {
    fail("Production build", err.stderr?.toString()?.slice(0, 200) ?? "failed");
  }
}

console.log(`\nTesting stop-reply flow at ${BASE}\n`);

try {
  await testPageUi();
  await testChatWorks();
  await testAbortDuringThinking();
  await testFollowUpAfterAbort();
} catch (err) {
  fail("Test runner", err?.message ?? String(err));
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);

if (failed.length) {
  process.exit(1);
}
