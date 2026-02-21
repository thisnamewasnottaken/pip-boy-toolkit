const { test, expect } = require('@playwright/test');

test.describe('Mobile Viewport Tests', () => {
  test('Main page should fit in mobile viewport without scrolling (portrait)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if body height matches viewport
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    console.log(`Body scroll height: ${bodyHeight}, Viewport height: ${viewportHeight}`);
    
    // Body should not exceed viewport significantly
    expect(bodyHeight).toBeLessThanOrEqual(viewportHeight + 10); // Allow 10px tolerance
  });

  test('Main page should fit in mobile viewport without scrolling (landscape)', async ({ page }) => {
    // Set mobile landscape viewport
    await page.setViewportSize({ width: 667, height: 375 }); // iPhone SE landscape
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if body height matches viewport
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    
    console.log(`Body scroll height: ${bodyHeight}, Viewport height: ${viewportHeight}`);
    
    // Body should not exceed viewport significantly
    expect(bodyHeight).toBeLessThanOrEqual(viewportHeight + 10); // Allow 10px tolerance
  });

  test('Container should not overflow viewport on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get container dimensions
    const container = page.locator('.pip-boy-container');
    const box = await container.boundingBox();
    
    expect(box.height).toBeLessThanOrEqual(667);
  });

  test('CSS custom property --vh should be set for viewport fallback', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for page to load and JS to execute
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Give time for JS to set custom property

    // Check if --vh custom property is set
    const vhValue = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--vh');
    });
    
    console.log(`--vh custom property: ${vhValue}`);
    expect(vhValue).toBeTruthy();
    expect(vhValue).toContain('px');
  });
});
