import { test, expect } from '@playwright/test';

test.describe('App basic flows', () => {
  test('Complete user flow: Home -> Login -> Dashboard', async ({ page }) => {
    // 1. Home Page
    await page.goto('/');
    
    // Check main title (updated to match current UI)
    await expect(page.locator('h1')).toContainText('Operations for teams that need');
    await expect(page.locator('h1')).toContainText('clarity, not clutter');
    
    // Check 'Get Started Free' button
    const getStartedBtn = page.locator('a', { hasText: 'Get Started Free' });
    await expect(getStartedBtn).toBeVisible();
    await expect(getStartedBtn).toHaveAttribute('href', '/login');
    
    // Click and navigate
    await getStartedBtn.click();
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Login Page
    await expect(page.locator('#emailInput')).toBeVisible();
    await expect(page.locator('#passwordInput')).toBeVisible();
    
    // Switch to Register mode to ensure we have a valid account
    await page.locator('.login-switch-btn').nth(1).click();
    
    // Ensure name input is visible now
    await expect(page.locator('#nameInput')).toBeVisible();
    await page.fill('#nameInput', 'E2E Test User');
    await page.fill('#emailInput', `test_${Date.now()}@example.com`);
    await page.fill('#passwordInput', 'password123');
    
    // Submit form
    const signInBtn = page.locator('button.login-submit');
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();
    
    // 3. Dashboard Loads
    await expect(page).toHaveURL(/.*\/app/);
    await expect(page.locator('.dash-title')).toHaveText('Dashboard');
    
    // 4. Dashboard Search Filtering
    const searchInput = page.locator('#projectSearch');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Nonexistent Project XYZ');
    
    // Verify clear button appears
    const clearBtn = page.locator('.dash-search-clear');
    await expect(clearBtn).toBeVisible();
    
    // Clear search
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');

    // 5. Dashboard Create Project Modal
    const newProjectBtn = page.locator('#newProjectBtn');
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();
    
    // Modal should be visible
    const modalTitle = page.locator('.modal-title');
    await expect(modalTitle).toHaveText('Create New Project');
    
    // Input should be present
    const projNameInput = page.locator('#projName');
    await expect(projNameInput).toBeVisible();
    
    // Close modal
    await page.locator('.modal-close').click();
    await expect(modalTitle).toBeHidden();
  });
});
