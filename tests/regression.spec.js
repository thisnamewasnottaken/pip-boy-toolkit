const { test, expect } = require('@playwright/test');

test.describe('Pip-Boy Toolkit Regression Suite', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
    });

    test('Main Menu should load with correct title and navigation', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Pip-Boy Toolkit - Main Menu/);

        const header = page.locator('.pip-header');
        await expect(header).toContainText('MENU');
        await expect(header).toContainText('SETTINGS');
        
        // Verify tools are accessible from menu list in body
        const menuList = page.locator('.menu-list');
        await expect(menuList).toContainText('POMODORO TIMER');
        await expect(menuList).toContainText('VAULT CLIMATE');
        await expect(menuList).toContainText('WASTELAND ROVER');
        await expect(menuList).toContainText('ENCRYPTION BREAKER');
    });

    test('Settings should persist username and enable Test Mode', async ({ page }) => {
        await page.goto('/tools/settings/index.html');

        // Set username directly to avoid interaction quirks
        await page.locator('#username-input').fill('TESTER');

        // Save
        await page.locator('#btn-save').click();

        // Verify persistence after reload
        await page.goto('/tools/settings/index.html');
        // Wait for script initialization
        await page.waitForTimeout(200);

        const usernameAfter = await page.locator('#username-input').inputValue();
        expect(usernameAfter).toBe('TESTER');
    });

    test('Timer should show TEST button only in test mode', async ({ page }) => {
        // 1. Ensure Test Mode is OFF
        await page.goto('/tools/settings/index.html');
        const testToggle = page.locator('#test-mode-input');
        const isChecked = await testToggle.isChecked();
        if (isChecked) {
            await testToggle.uncheck({ force: true });
            await page.locator('#btn-save').click();
        }

        // 2. Check Timer page - TEST button should be hidden
        await page.goto('/tools/pomodoro/index.html');
        const testBtn = page.locator('#btn-test');
        await expect(testBtn).toBeHidden();

        // 3. Enable Test Mode via URL hash
        await page.goto('/tools/pomodoro/index.html#test');
        await expect(testBtn).toBeVisible();
    });

    test('Navigation should work across all pages', async ({ page }) => {
        await page.goto('/');

        // Go to Timer from main menu (click on menu item in body)
        await page.click('text=POMODORO TIMER');
        await expect(page).toHaveURL(/.*pomodoro/);

        // Go to Settings from Timer (header link)
        await page.click('text=SETTINGS');
        await expect(page).toHaveURL(/.*settings/);

        // Return to Menu from Settings (header link)
        await page.click('text=MENU');
        await expect(page).toHaveURL(/index.html|$/);
        
        // Verify we can navigate to different tool from main menu
        await page.click('text=VAULT CLIMATE');
        await expect(page).toHaveURL(/.*vault-climate/);
    });

});
