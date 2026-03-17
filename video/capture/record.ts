/**
 * Playwright screen-recording capture script.
 *
 * Creates test users via the dev test-harness API, authenticates,
 * and records navigation clips of the real app for the Remotion promo video.
 *
 * Prerequisites:
 *   1. Web app running locally: cd web && npm run dev
 *   2. NODE_ENV = "development"
 *
 * Usage:  cd video && npm run capture
 */

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Cookie,
} from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";
const CLIPS_DIR = path.resolve(__dirname, "../public/clips");
const VIEWPORT = { width: 1920, height: 1080 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseSetCookies(
  headers: Record<string, string>,
  url: string
): Cookie[] {
  const raw = headers["set-cookie"];
  if (!raw) return [];
  const host = new URL(url).hostname;
  return raw.split(/,(?=\s*\w+=)/).map((c) => {
    const [pair, ...attrs] = c.split(";").map((s) => s.trim());
    const [name, ...vp] = pair.split("=");
    const value = vp.join("=");
    let cookiePath = "/";
    let secure = false;
    let httpOnly = false;
    let sameSite: "Strict" | "Lax" | "None" = "Lax";
    for (const attr of attrs) {
      const lo = attr.toLowerCase();
      if (lo.startsWith("path=")) cookiePath = attr.split("=")[1];
      if (lo === "secure") secure = true;
      if (lo === "httponly") httpOnly = true;
      if (lo.startsWith("samesite=")) {
        const v = attr.split("=")[1].toLowerCase();
        sameSite = v === "strict" ? "Strict" : v === "none" ? "None" : "Lax";
      }
    }
    return { name, value, domain: host, path: cookiePath, secure, httpOnly, sameSite, expires: -1 };
  });
}

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

type JourneyPreset = "fresh" | "planning_done" | "diagnostic_done" | "active";
type SeedState =
  | "mastery_atoms_18" | "mastery_atoms_30" | "full_test_completed"
  | "sr_review_due" | "streak_5" | "mission_complete"
  | "multiple_history_points";

async function createTestUser(preset: JourneyPreset) {
  const res = await fetch(`${BASE_URL}/api/dev/test-harness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create_user",
      payload: { journeyPreset: preset, firstName: "Demo", lastName: "Student" },
    }),
  });
  if (!res.ok) throw new Error(`Test harness (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const cookies = parseSetCookies(Object.fromEntries(res.headers.entries()), BASE_URL);
  console.log(`  Created: ${data.data.email} (${preset})`);
  return { userId: data.data.userId as string, cookies };
}

async function seedState(userId: string, seed: SeedState) {
  const res = await fetch(`${BASE_URL}/api/dev/test-harness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "seed_state", payload: { userId, seed } }),
  });
  if (!res.ok) console.warn(`  Seed ${seed} failed: ${await res.text()}`);
  else console.log(`  Seeded: ${seed}`);
}

async function cleanupUser(userId: string) {
  await fetch(`${BASE_URL}/api/dev/test-harness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cleanup", payload: { userId } }),
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Recording helpers
// ---------------------------------------------------------------------------

async function prewarm(browser: Browser, cookies: Cookie[], urls: string[]) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, colorScheme: "light" });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await sleep(1000);
    } catch { console.warn(`  Prewarm timeout: ${url}`); }
  }
  await page.close();
  await ctx.close();
}

async function waitForContent(page: Page, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const count = await page
      .locator('[class*="skeleton"], [class*="animate-pulse"], [class*="Skeleton"]')
      .count();
    if (count === 0) return;
    await sleep(300);
  }
}

async function startRec(browser: Browser, cookies: Cookie[]) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: CLIPS_DIR, size: VIEWPORT },
    colorScheme: "light",
  });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  return { ctx, page };
}

async function saveClip(ctx: BrowserContext, page: Page, name: string) {
  const video = page.video();
  await ctx.close();
  if (!video) return;
  const src = await video.path();
  const dest = path.join(CLIPS_DIR, `${name}${path.extname(src)}`);
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(src, dest);
  console.log(`  Saved: ${name}${path.extname(dest)}`);
}

async function smoothScroll(page: Page, totalPx: number, steps = 10, pauseMs = 350) {
  const per = Math.ceil(totalPx / steps);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, per);
    await sleep(pauseMs);
  }
}

/**
 * Click a question option button by letter (A/B/C/D).
 * Handles both diagnostic (aria-label) and portal (aria-pressed) buttons.
 */
async function clickOption(page: Page, letter: string): Promise<boolean> {
  // Diagnostic pages: buttons have aria-label="Opción X: ..."
  const diagBtn = page.locator(`button[aria-label^="Opción ${letter}"]`);
  if (await diagBtn.first().isVisible().catch(() => false)) {
    await diagBtn.first().click();
    return true;
  }

  // Portal pages: buttons with aria-pressed attribute
  const portalBtns = page.locator('button[aria-pressed]');
  const count = await portalBtns.count();
  if (count > 0) {
    const idx = letter.charCodeAt(0) - "A".charCodeAt(0);
    if (idx < count) {
      await portalBtns.nth(idx).click();
      return true;
    }
  }

  // Full test: options are buttons with a circle span containing the letter
  const ftBtns = page.locator('button').filter({
    has: page.locator(`span:text-is("${letter}")`)
  });
  if (await ftBtns.first().isVisible().catch(() => false)) {
    await ftBtns.first().click();
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// CLIP RECORDERS
// ---------------------------------------------------------------------------

async function recordPlanning(browser: Browser, cookies: Cookie[]) {
  console.log("\n[01] Planning");
  await prewarm(browser, cookies, [`${BASE_URL}/portal/goals?mode=planning`]);

  const { ctx, page } = await startRec(browser, cookies);
  await page.goto(`${BASE_URL}/portal/goals?mode=planning`, {
    waitUntil: "networkidle",
  });
  await waitForContent(page);
  await sleep(1800);

  // University field — type slowly for visual effect
  const uniInput = page.locator(
    'input[placeholder*="universidad" i], input[placeholder*="Buscar" i]'
  ).first();
  if (await uniInput.isVisible().catch(() => false)) {
    await uniInput.click();
    await sleep(600);

    // Type "Pont" one character at a time with realistic delays
    for (const ch of "Pont") {
      await uniInput.press(ch);
      await sleep(250);
    }
    // Let the autocomplete render
    await sleep(2000);

    // Select "Pontificia Universidad Católica de Chile"
    const opt = page.locator(
      '[role="option"], [role="listbox"] li, li[class*="cursor"]'
    ).first();
    if (await opt.isVisible().catch(() => false)) {
      await opt.click();
      // Long pause so the university name appears in the field
      await sleep(2000);

      // Click the career field
      const careerInput = page.locator(
        'input[placeholder*="carrera" i], input[placeholder*="Elige" i]'
      ).first();
      if (await careerInput.isVisible().catch(() => false)) {
        await careerInput.click();
        await sleep(1200);
        // Select the first career option
        const careerOpt = page.locator(
          '[role="option"], [role="listbox"] li, li[class*="cursor"]'
        ).first();
        if (await careerOpt.isVisible().catch(() => false)) {
          await careerOpt.click();
          // Let the selection register and "Continuar" button appear
          await sleep(2500);
        }
      }
    }
  }
  await sleep(1500);
  await saveClip(ctx, page, "01-planning");
}

async function recordDiagnostic(browser: Browser, cookies: Cookie[]) {
  console.log("\n[02] Diagnostic");
  await prewarm(browser, cookies, [`${BASE_URL}/diagnostico`]);

  const { ctx, page } = await startRec(browser, cookies);
  await page.goto(`${BASE_URL}/diagnostico`, { waitUntil: "networkidle" });

  // Wait for option buttons via aria-label
  try {
    await page.locator('button[aria-label^="Opción"]').first()
      .waitFor({ state: "visible", timeout: 12000 });
  } catch { /* continue */ }
  await sleep(1500);

  // Answer 3 questions
  for (let q = 0; q < 3; q++) {
    const clicked = await clickOption(page, "B");
    if (!clicked) {
      console.warn(`  Could not click option for question ${q + 1}`);
      break;
    }
    await sleep(800);

    // Click Siguiente via aria-label
    const nextBtn = page.locator('button[aria-label*="siguiente" i]').or(
      page.locator('button').filter({ hasText: /siguiente/i })
    ).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await sleep(2200);
    }
  }
  await sleep(1500);
  await saveClip(ctx, page, "02-diagnostic");
}

async function recordDashboard(browser: Browser, cookies: Cookie[]) {
  console.log("\n[03] Dashboard");
  await prewarm(browser, cookies, [`${BASE_URL}/portal`]);

  const { ctx, page } = await startRec(browser, cookies);
  await page.goto(`${BASE_URL}/portal`, { waitUntil: "networkidle" });
  await waitForContent(page);
  await sleep(2000);

  await smoothScroll(page, 400, 8, 400);
  await sleep(2000);
  await smoothScroll(page, 500, 10, 350);
  await sleep(2000);

  await saveClip(ctx, page, "03-dashboard");
}

async function recordStudyLesson(browser: Browser, cookies: Cookie[]) {
  console.log("\n[04] Study lesson");

  await prewarm(browser, cookies, [`${BASE_URL}/portal`]);
  const scoutCtx = await browser.newContext({ viewport: VIEWPORT, colorScheme: "light" });
  await scoutCtx.addCookies(cookies);
  const scoutPage = await scoutCtx.newPage();
  await scoutPage.goto(`${BASE_URL}/portal`, { waitUntil: "networkidle" });
  await waitForContent(scoutPage);

  const link = scoutPage.locator('a[href*="/portal/study?atom="]');
  let href: string | null = null;
  if (await link.first().isVisible().catch(() => false)) {
    href = await link.first().getAttribute("href");
  }
  await scoutPage.close();
  await scoutCtx.close();

  if (!href) {
    console.warn("  No study link found on dashboard, skipping");
    return;
  }

  const studyUrl = `${BASE_URL}${href}`;
  console.log(`  URL: ${studyUrl}`);
  await prewarm(browser, cookies, [studyUrl]);

  const { ctx, page } = await startRec(browser, cookies);
  await page.goto(studyUrl, { waitUntil: "networkidle" });
  await sleep(3000);
  await waitForContent(page);
  await sleep(1500);

  // Scroll through lesson content
  const lesson = page.locator('[class*="lesson" i], [class*="Lesson"], article, [class*="prose"]').first();
  if (await lesson.isVisible().catch(() => false)) {
    await smoothScroll(page, 400, 6, 500);
    await sleep(1500);
    const nextBtn = page.locator('button').filter({ hasText: /siguiente|continuar/i }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await sleep(2000);
    }
  }

  // If a question is shown, answer it
  if (await clickOption(page, "A")) {
    await sleep(600);
    const submit = page.locator('button').filter({ hasText: /responder|enviar/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await sleep(2500);
    }
  }

  await sleep(1500);
  await saveClip(ctx, page, "04-study-lesson");
}

async function recordFullTest(browser: Browser, cookies: Cookie[]) {
  console.log("\n[05] Full test");
  await prewarm(browser, cookies, [`${BASE_URL}/portal/test`]);

  const { ctx, page } = await startRec(browser, cookies);
  await page.goto(`${BASE_URL}/portal/test`, { waitUntil: "networkidle" });
  await waitForContent(page);
  await sleep(1500);

  const startBtn = page.locator('button').filter({ hasText: /comenzar test/i }).first();
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();

    // Wait for question options to appear
    try {
      await page.locator('button').filter({
        has: page.locator('span:text-is("A")')
      }).first().waitFor({ state: "visible", timeout: 15000 });
    } catch { /* continue */ }
    await sleep(2000);

    // Answer 3 questions — navigator grid cells turn green
    for (let q = 0; q < 3; q++) {
      const letters = ["B", "A", "C"];
      await clickOption(page, letters[q]);
      await sleep(600);

      const nextBtn = page.locator('button').filter({ hasText: /siguiente/i }).first();
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await sleep(1500);
      }
    }

    // Jump to question 10 via navigator grid
    const navBtns = page.locator('aside button');
    const navCount = await navBtns.count();
    if (navCount > 10) {
      await navBtns.nth(9).click();
      await sleep(1500);
      await clickOption(page, "C");
      await sleep(800);
    }
  } else {
    console.warn("  Comenzar Test button not found or test not eligible");
    await sleep(4000);
  }

  await sleep(2000);
  await saveClip(ctx, page, "05-full-test");
}

async function recordReview(browser: Browser, cookies: Cookie[]) {
  console.log("\n[07] Review");
  await prewarm(browser, cookies, [`${BASE_URL}/portal/study?mode=review`]);

  const { ctx, page } = await startRec(browser, cookies);
  await page.goto(`${BASE_URL}/portal/study?mode=review`, { waitUntil: "networkidle" });
  await sleep(3000);
  await waitForContent(page);
  await sleep(1500);

  if (await clickOption(page, "A")) {
    await sleep(800);
    const submit = page.locator('button').filter({ hasText: /responder/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await sleep(2500);
    }
  }
  await sleep(1500);
  await saveClip(ctx, page, "07-review");
}

async function recordProgress(browser: Browser, cookies: Cookie[]) {
  console.log("\n[08] Progress");
  await prewarm(browser, cookies, [`${BASE_URL}/portal/progress`]);

  const { ctx, page } = await startRec(browser, cookies);
  await page.goto(`${BASE_URL}/portal/progress`, { waitUntil: "networkidle" });
  await waitForContent(page);
  await sleep(2000);

  await smoothScroll(page, 350, 7, 400);
  await sleep(2000);
  await smoothScroll(page, 400, 8, 350);
  await sleep(2000);
  await smoothScroll(page, 400, 8, 350);
  await sleep(2000);

  await saveClip(ctx, page, "08-progress");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  ensureDir(CLIPS_DIR);
  console.log(`Capturing from ${BASE_URL}`);
  console.log(`Output: ${CLIPS_DIR}\n`);

  const headless = process.env.HEADED !== "1";
  const browser = await chromium.launch({ headless });
  const userIds: string[] = [];

  try {
    // ── Active user ──
    // NO full_test_completed yet — so full test page is eligible (first test)
    console.log("--- Active test user ---");
    const active = await createTestUser("active");
    userIds.push(active.userId);
    await seedState(active.userId, "mastery_atoms_18");
    await seedState(active.userId, "sr_review_due");
    await seedState(active.userId, "streak_5");
    await seedState(active.userId, "multiple_history_points");

    // Record clips that DON'T need full test data
    await recordDashboard(browser, active.cookies);
    await recordStudyLesson(browser, active.cookies);
    await recordFullTest(browser, active.cookies);
    await recordReview(browser, active.cookies);

    // NOW seed full_test_completed so progress page shows the trajectory
    await seedState(active.userId, "full_test_completed");
    await recordProgress(browser, active.cookies);

    // ── Fresh user (planning) ──
    console.log("\n--- Fresh test user ---");
    const fresh = await createTestUser("fresh");
    userIds.push(fresh.userId);
    await recordPlanning(browser, fresh.cookies);

    // ── Planning-done user (diagnostic) ──
    console.log("\n--- Planning-done test user ---");
    const planDone = await createTestUser("planning_done");
    userIds.push(planDone.userId);
    await recordDiagnostic(browser, planDone.cookies);
  } finally {
    await browser.close();
    console.log("\n--- Cleanup ---");
    for (const id of userIds) {
      await cleanupUser(id);
      console.log(`  Cleaned: ${id}`);
    }
  }

  console.log("\nDone. All clips in public/clips/");
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
