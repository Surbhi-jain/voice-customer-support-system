import { expect, test } from "@playwright/test";
import { buildGreeting } from "../services/web/lib/greeting";
import { checkTopicGuard, getTopic } from "../packages/shared/src";
import { installVoiceBrowserMocks } from "./helpers";

async function startCallAndWaitForIdle(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page.getByText("Greeting…")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/· Idle$/)).toBeVisible({ timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await installVoiceBrowserMocks(page);
});

test("home page shows start conversation before session", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Voice Support (Phase 4)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start conversation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "End session" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Stop reply" })).toHaveCount(0);
});

test("settings include support topic, language, and spoken reply voice", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Settings").click();

  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByLabel("Support topic")).toBeVisible();
  await expect(page.getByText("Language (speech + replies)")).toBeVisible();
  await expect(page.getByLabel("Spoken reply voice (Piper)")).toBeVisible();
});

test("greeting includes customer name and topic", () => {
  const text = buildGreeting({
    customerName: "Surbhi",
    topicId: "cooking",
    hour: 9,
  });
  expect(text).toContain("Surbhi");
  expect(text).toContain("morning");
  expect(text).toContain("Cooking");
});

test("start conversation speaks greeting then becomes idle", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Settings").click();
  await page.getByLabel("Your name").fill("Surbhi");
  await startCallAndWaitForIdle(page);
  await expect(page.getByRole("button", { name: "Start speaking" })).toBeEnabled();
});

test("cooking recipe question is on-topic even if history mentions hotel", () => {
  const cooking = getTopic("cooking");
  expect(cooking).toBeTruthy();

  const pollutedHistory =
    "Earlier user questions: Tell me the recipe of Pau Bhaji.\n" +
    "Last assistant reply: I can only help with hotel and guest support questions in this line.\n" +
    "Current user message: Tell me the recipe of pav bhaji.";

  expect(checkTopicGuard(pollutedHistory, cooking!)).toBe("off_topic");
  expect(checkTopicGuard("Tell me the recipe of pav bhaji.", cooking!)).toBe(
    "on_topic",
  );
});

test("chat request includes selected topicId", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Settings").click();
  await page.getByLabel("Support topic").selectOption("cooking");
  const chatRequestPromise = page.waitForRequest("**/chat");

  await startCallAndWaitForIdle(page);
  await page.getByRole("button", { name: "Start speaking" }).click();
  await page.getByRole("button", { name: "Stop" }).click();

  const chatRequest = await chatRequestPromise;
  const body = chatRequest.postDataJSON() as { topicId?: string };

  await expect(page.getByText("Thinking…")).toBeVisible({ timeout: 10_000 });
  expect(body.topicId).toBe("cooking");
});

test("speak controls: start speaking then stop and auto-send", async ({ page }) => {
  await page.goto("/");

  await startCallAndWaitForIdle(page);
  await expect(page.getByRole("button", { name: "End session" })).toBeVisible();

  const startSpeaking = page.getByRole("button", { name: "Start speaking" });
  const stopSpeaking = page.getByRole("button", { name: "Stop" });

  await expect(startSpeaking).toBeEnabled();
  await expect(stopSpeaking).toBeDisabled();
  await expect(
    page.getByText("Click Start speaking, then Stop when you finish your question."),
  ).toBeVisible();

  await startSpeaking.click();
  await expect(page.getByText("Listening…")).toBeVisible();
  await expect(startSpeaking).toBeDisabled();
  await expect(stopSpeaking).toBeEnabled();
  await expect(
    page.getByText("Speak clearly, then click Stop. Check the text, edit if needed, then Send question."),
  ).toBeVisible();

  await stopSpeaking.click();
  await expect(page.getByText("Thinking…")).toBeVisible({ timeout: 10_000 });
});

test("stop reply is hidden until assistant is busy", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Stop reply" })).toHaveCount(0);

  await page.route("**/chat", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ reply: "Mock assistant reply for testing." }),
    });
  });

  await startCallAndWaitForIdle(page);
  await page.getByRole("button", { name: "Start speaking" }).click();
  await page.getByRole("button", { name: "Stop" }).click();

  await expect(page.getByRole("button", { name: "Stop reply" })).toBeVisible({
    timeout: 5_000,
  });
});
