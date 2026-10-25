import { test, expect } from "@playwright/test";
test("clearing history while AI is pending does not resurrect old records", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Your words").fill("Hello");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await page.getByRole("button", { name: "Your collection" }).click();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let started!: () => void;
  const requested = new Promise<void>((resolve) => (started = resolve));
  await page.route("**/api/translate", async (route) => {
    started();
    await gate;
    await route.fulfill({
      json: { translation: "Good morrow", note: "A greeting." },
    });
  });
  await page.getByRole("button", { name: "AI enhanced" }).click();
  await page.getByLabel("Your words").fill("Good morning");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await requested;
  await page
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  release();
  await expect(page.getByTestId("translation")).toHaveText("Good morrow");
  await expect(
    page.getByRole("button", { name: "Open translation: Hello", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Open translation: Good morning",
      exact: true,
    }),
  ).toBeVisible();
});
test("corrupt storage and blocked storage do not prevent translation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("bards-quill-history-v1", "{corrupt"),
  );
  await page.goto("/");
  await page.getByLabel("Your words").fill("Hello");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByTestId("translation")).toHaveText("Hail");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Blocked");
    };
  });
  await page.getByLabel("Your words").fill("Good morning");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByTestId("translation")).toHaveText("Good morrow");
  await expect(
    page.getByText("History could not be saved on this device."),
  ).toBeVisible();
});
test("translate, copy, persist and delete history", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your words").fill("I love you.");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByTestId("translation")).toHaveText("I love thee.");
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  await page.getByRole("button", { name: "Copy translation" }).click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Your collection" }).click();
  await page
    .getByRole("button", { name: "Open translation: I love you." })
    .click();
  await expect(page.getByTestId("translation")).toHaveText("I love thee.");
  await page
    .getByRole("button", { name: "Delete translation: I love you." })
    .click();
  await expect(page.getByText("Your story starts here.")).toBeVisible();
  await page.getByRole('button',{name:'Clear',exact:true}).click();
  await expect(page.getByLabel('Your words')).toHaveValue('');
  await expect(page.getByTestId('translation')).toHaveCount(0);
});
test("examples, styles, keyboard and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "How are you?" }).click();
  await expect(page.getByLabel("Your words")).toHaveValue("How are you?");
  await page.getByRole("button", { name: "Dramatic", exact: true }).click();
  await page.getByRole("button", { name: "Translate", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("translation")).toContainText(
    "How dost thou fare",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
});
test('retains only the latest twenty successful translations',async({page})=>{
 await page.goto('/');for(let i=0;i<21;i++){await page.getByLabel('Your words').fill(`Hello ${i}`);await page.getByRole('button',{name:'Translate',exact:true}).click();await expect(page.getByTestId('translation')).toHaveText(`Hello ${i}`);}
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bards-quill-history-v1')||'[]'));expect(saved).toHaveLength(20);expect(saved[0].source).toBe('Hello 20');expect(saved[19].source).toBe('Hello 1');
});
test("works offline after first visit and reload", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
  });
  await expect(page.getByText("Ready for offline use")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel("Your words").fill("Hello!");
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByTestId("translation")).toHaveText("Hail!");
  await page.getByRole("button", { name: "AI enhanced" }).click();
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "internet" }),
  ).toBeVisible();
  await context.setOffline(false);
});
test("AI failure preserves input and offers local mode", async ({ page }) => {
  await page.goto("/");
  await page.route("**/api/translate", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "AI is not configured. Try offline mode." },
    }),
  );
  await page.getByLabel("Your words").fill("Good morning");
  await page.getByRole("button", { name: "AI enhanced" }).click();
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "not configured" }),
  ).toBeVisible();
  await expect(page.getByLabel("Your words")).toHaveValue("Good morning");
  await page.getByRole("button", { name: "Use offline mode" }).click();
  await page.getByRole("button", { name: "Translate", exact: true }).click();
  await expect(page.getByTestId("translation")).toHaveText("Good morrow");
});
