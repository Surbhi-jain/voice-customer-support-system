/**
 * Browser smoke test: Stop reply button visibility rules.
 * Run: node e2e/test-stop-reply-browser.mjs [webBaseUrl]
 *
 * Default: http://localhost:3000 (requires dev server + mocked or live backends)
 */
import { chromium } from "playwright";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

let failed = 0;

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function bad(msg) {
  console.error(`✗ ${msg}`);
  failed += 1;
}

try {
  await page.goto(BASE, { waitUntil: "networkidle" });

  const stopReply = page.getByRole("button", { name: "Stop reply" });
  const endSession = page.getByRole("button", { name: "End session" });

  if (await stopReply.isVisible()) {
    bad("Stop reply visible before session starts");
  } else {
    ok("Stop reply hidden before session starts");
  }

  if (await endSession.isVisible()) {
    bad("End session visible before session starts");
  } else {
    ok("End session hidden before session starts");
  }

  const stopReplyCount = await page.getByRole("button", { name: "Stop reply" }).count();
  if (stopReplyCount === 0) {
    ok("Stop reply not mounted before session is busy");
  } else {
    bad("Stop reply mounted before session is busy");
  }

  const scripts = await page.locator('script[src*="/_next/static/chunks"]').all();
  let bundle = "";
  for (const script of scripts.slice(0, 5)) {
    const src = await script.getAttribute("src");
    if (src?.includes("page")) {
      bundle += await fetch(`${BASE}${src}`).then((r) => r.text());
    }
  }
  if (bundle.includes("Stop reply") && bundle.includes("Click Stop reply to interrupt")) {
    ok("Stop reply UI strings present in client bundle");
  } else {
    bad("Stop reply UI strings missing from client bundle");
  }

  if (bundle.includes("Stopping current reply")) {
    ok("stopReply handler present in client bundle");
  } else {
    bad("stopReply handler missing from client bundle");
  }
} catch (err) {
  bad(`Browser test error: ${err.message}`);
} finally {
  await browser.close();
}

if (failed) {
  console.error(`\n${failed} browser check(s) failed`);
  process.exit(1);
}

console.log("\nBrowser smoke checks passed");
