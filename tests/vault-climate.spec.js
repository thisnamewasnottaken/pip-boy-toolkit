const { test, expect } = require('@playwright/test');

test.describe('Vault Climate Module Tests', () => {

    test('should fallback to London when geolocation is denied', async ({ page, context }) => {
        // Deny geolocation
        await context.grantPermissions([]);

        await page.goto('/tools/vault-climate/index.html');

        // Wait for fetch to complete (or fail gracefully)
        await page.waitForTimeout(1000);

        const locName = await page.locator('#location-name').innerText();
        expect(locName).toBe('VAULT X44 (LONDON)');

        const coords = await page.locator('#coordinates').innerText();
        expect(coords).toContain('51.5074');
        expect(coords).toContain('-0.1278');
    });

    test('should respect temperature unit setting', async ({ page }) => {
        // 1. Set to Celsius
        await page.goto('/tools/settings/index.html');
        await page.click('[data-unit="C"]');
        await page.click('#btn-save');

        await page.goto('/tools/vault-climate/index.html');
        await page.waitForTimeout(1000);

        const unitC = await page.locator('#temp-unit').innerText();
        expect(unitC).toContain('C');

        const tempC = parseInt(await page.locator('#temperature').innerText());

        // 2. Switch to Fahrenheit
        await page.goto('/tools/settings/index.html');
        await page.click('[data-unit="F"]');
        await page.click('#btn-save');

        await page.goto('/tools/vault-climate/index.html');
        await page.waitForTimeout(1000);

        const unitF = await page.locator('#temp-unit').innerText();
        expect(unitF).toContain('F');

        const tempF = parseInt(await page.locator('#temperature').innerText());

        // Verify conversion (approximate due to rounding)
        // (C * 9/5) + 32 = F
        const expectedF = Math.round((tempC * 9 / 5) + 32);
        expect(Math.abs(tempF - expectedF)).toBeLessThanOrEqual(2);
    });

    test('should display Fallout-flavored weather info', async ({ page }) => {
        await page.goto('/tools/vault-climate/index.html');
        await page.waitForTimeout(1000);

        const condition = await page.locator('#weather-condition').innerText();
        const validConditions = ['HIGH VISIBILITY', 'SMOG/DUST', 'RAD-STORM', 'UNKNOWN ANOMALY'];
        expect(validConditions).toContain(condition);

        const radLevel = await page.locator('#radiation-level').innerText();
        const validRadLevels = ['ZERO', 'LOW', 'MEDIUM', 'HIGH', 'DEADLY'];
        expect(validRadLevels).toContain(radLevel);
    });

});
