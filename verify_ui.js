const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false }); // Headless false to see it
    const page = await browser.newPage();

    try {
        console.log('Navigating to localhost:3000...');
        await page.goto('http://localhost:3000');

        // Check for Autocomplete inputs
        console.log('Checking for Autocomplete inputs...');
        await page.waitForSelector('input[placeholder="Where are you?"]');
        await page.waitForSelector('input[placeholder="Where to?"]');

        // Check for Days input
        console.log('Checking for Days input...');
        const daysInput = await page.$('input[type="number"]');
        if (!daysInput) throw new Error('Days input not found');

        // Simulate typing (mocked in real app, but here we just check presence)
        // In a real e2e we would type and check for dropdown, but we don't have Mapbox token in this script env easily unless we load from .env
        // We assume the component renders correctly.

        console.log('Verification script passed: Inputs are present.');

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
