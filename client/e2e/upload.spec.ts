import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Project Integration', () => {
    test('Uploading a zip automatically creates a Kanban project', async ({ page }) => {
        // 1. Register a fresh account
        await page.goto('/login');
        await page.locator('button', { hasText: 'Create Account' }).first().click();
        
        await expect(page.locator('#nameInput')).toBeVisible();
        await page.fill('#nameInput', 'Integration Tester');
        await page.fill('#emailInput', `tester_${Date.now()}@example.com`);
        await page.fill('#passwordInput', 'password123');
        await page.locator('button.login-submit').click();
        
        // 2. Dashboard Loads
        await expect(page).toHaveURL(/.*\/app/);
        
        // Wait for the Dashboard to fully load projects
        await expect(page.locator('.dash-title')).toHaveText('Dashboard');
        // Initial state should have 0 projects for a new user
        const initialCount = await page.locator('.stat-card:has-text("Total Projects") .stat-value').textContent();
        expect(initialCount).toBe('0');
        
        // 3. Navigate to Import Project via sidebar
        await page.locator('a', { hasText: 'Import Project' }).click();
        await expect(page.locator('h1')).toHaveText('Upload Project');
        
        // 4. Upload the test zip file
        const fileInput = page.locator('#projectFileInput');
        const zipPath = path.resolve(process.cwd(), 'e2e', 'fixtures', 'test_project.zip');
        await fileInput.setInputFiles(zipPath);
        
        // 5. Wait for success
        const successAlert = page.locator('.upload-alert-success');
        await expect(successAlert).toBeVisible({ timeout: 10000 });
        await expect(successAlert).toContainText('uploaded successfully');
        
        // 6. Navigate back to Dashboard via sidebar
        await page.locator('a', { hasText: 'Home' }).click();
        await expect(page.locator('.dash-title')).toHaveText('Dashboard');
        
        // 7. Verify the count increased and the project card exists
        await expect(page.locator('.stat-card:has-text("Total Projects") .stat-value')).toHaveText('1');
        
        const projectCard = page.locator('.project-card', { hasText: 'test_project' });
        await expect(projectCard).toBeVisible();
    });
});
