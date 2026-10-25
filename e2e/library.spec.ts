import { test, expect } from "@playwright/test";
test("changed language survives sharing and closing returns focus", async ({
  page,
}) => {
  await page.goto("/library?language=hi");
  await page.getByLabel("Language").selectOption("de");
  const opener = page.getByRole("button", {
    name: "Read Theory and the tree of life",
    exact: true,
  });
  await opener.click();
  await expect(page).toHaveURL(/language=de/);
  await page.getByRole("button", { name: "Close reading view" }).click();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.reload();
  await expect(page.getByLabel("Language")).toHaveValue("de");
  await expect(
    page.getByRole("region", { name: "Reading: Theory and the tree of life" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close reading view" }).click();
  await expect(page.getByLabel("Search the library")).toBeFocused();
});
test("searches original text and English translations with matching author", async ({
  page,
}) => {
  await page.goto("/library");
  await page.getByLabel("Search the library").fill("âme impossible");
  await expect(
    page.getByText("No passages match these filters."),
  ).toBeVisible();
  await page.getByLabel("Search the library").fill("manger pour vivre");
  await page.getByLabel("Writer").selectOption("Molière");
  await page
    .getByRole("button", { name: "Read Eat to live", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "English translation", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("One must eat to live, not live to eat.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search the library").fill("Grey, dear friend");
  await page.getByLabel("Writer").selectOption("Johann Wolfgang von Goethe");
  await expect(page.getByTestId("library-card")).toHaveCount(1);
  await page.screenshot({
    path: "test-results/library-desktop.png",
    fullPage: true,
  });
});
test("featured library, reader, search and filters", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Explore the library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Words that outlive the stage." }),
  ).toBeVisible();
  await expect(page.getByTestId("library-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Show more" }).click();
  expect(await page.getByTestId("library-card").count()).toBeGreaterThan(12);
  await page.getByLabel("Search the library").fill("To be");
  await page.getByLabel("Format").selectOption("speech");
  await page
    .getByRole("button", { name: "Read To be, or not to be", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Reading: To be, or not to be" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/entry=hamlet-to-be/);
  await page.getByRole("button", { name: "Copy passage" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Passage copied" }),
  ).toBeVisible();
  await page.getByLabel("Language").selectOption("hi");
  await expect(
    page.getByText("No passages match these filters."),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Reading: To be, or not to be" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByTestId("library-card")).toHaveCount(12);
});
test("direct links, mobile keyboard and history navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/library?entry=hamlet-to-be");
  await expect(
    page.getByRole("region", { name: "Reading: To be, or not to be" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close reading view" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).not.toHaveURL(/entry=/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/library-mobile.png",
    fullPage: true,
  });
});
test("both pages and direct library entries reload offline; API stays uncached", async ({
  page,
  context,
}) => {
  await page.goto("/library");
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
  await context.setOffline(true);
  await page.goto("/library?entry=hamlet-to-be");
  await expect(
    page.getByRole("region", { name: "Reading: To be, or not to be" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Search the library")).toBeVisible();
  await page.goto("/");
  await expect(page.getByLabel("Your words")).toBeVisible();
  await page
    .getByRole("link", { name: "Explore the library", exact: true })
    .click();
  await expect(page.getByLabel("Search the library")).toBeVisible();
  const paths = await page.evaluate(async () => {
    const paths: string[] = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys())
        paths.push(new URL(request.url).pathname);
    }
    return paths;
  });
  expect(paths).not.toContain("/api/translate");
  await context.setOffline(false);
});
