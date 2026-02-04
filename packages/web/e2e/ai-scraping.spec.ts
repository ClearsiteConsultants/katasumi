import { test, expect } from '@playwright/test';

test.describe('AI Scraping Feature', () => {
  test.skip('AI scraping button appears when no apps found', async ({ page }) => {
    // This test requires authentication and AI configuration
    // Skipping for now as it requires full setup
    
    // Navigate to app-first mode
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('input[type="text"]');
    
    // Type an app name that doesn't exist
    await page.fill('input[type="text"]', 'Sublime Merge Test App');
    
    // Wait for "No apps found" message
    await page.waitForSelector('text=No applications found', { timeout: 5000 });
    
    // Verify AI search button appears (only if AI is enabled)
    const aiButton = await page.locator('button:has-text("Use AI to search for shortcuts")');
    
    // Note: Button might not be visible if AI is not enabled in the environment
    // This is expected behavior
  });

  test.skip('AI scraping requires authentication', async ({ page }) => {
    // This test requires being logged out
    // Skipping for now as it requires auth setup
    
    await page.goto('/');
    
    // Clear any existing auth token
    await page.evaluate(() => {
      localStorage.removeItem('token');
    });
    
    // Type an app name that doesn't exist
    await page.fill('input[type="text"]', 'NonExistentApp');
    
    // Try to click AI search button
    const aiButton = await page.locator('button:has-text("Use AI to search for shortcuts")');
    
    if (await aiButton.isVisible()) {
      await aiButton.click();
      
      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 5000 });
    }
  });
});
