import { test, expect } from '@playwright/test';

test.describe('App basic flows', () => {
  test('Home page has Get Started that links to login', async ({ page }) => {
    await page.goto('/');
    
    // Check main title
    await expect(page.locator('h1')).toHaveText('Project Nexus');
    
    // Check 'Get Started' button
    const getStartedBtn = page.locator('a', { hasText: 'Get Started' });
    await expect(getStartedBtn).toBeVisible();
    await expect(getStartedBtn).toHaveAttribute('href', '/login');
    
    // Click and navigate
    await getStartedBtn.click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Login page has inputs and Sign In button linking to dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Inputs should be present
    await expect(page.locator('#emailInput')).toBeVisible();
    await expect(page.locator('#passwordInput')).toBeVisible();
    
    // Sign In button should link to /app
    const signInBtn = page.locator('a.login-submit');
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toHaveAttribute('href', '/app');
    
    await signInBtn.click();
    await expect(page).toHaveURL(/.*\/app/);
  });

  test('Dashboard loads and can open Create Project modal', async ({ page }) => {
    await page.goto('/app');
    
    await expect(page.locator('.dash-title')).toHaveText('Dashboard');
    
    // Verify Create Project button opens modal
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
  
  test('Dashboard filters projects based on search input', async ({ page }) => {
    await page.goto('/app');
    
    // Type in search bar
    const searchInput = page.locator('#projectSearch');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Nonexistent Project XYZ');
    
    // Verify clear button appears
    const clearBtn = page.locator('.dash-search-clear');
    await expect(clearBtn).toBeVisible();
    
    // Clear search
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
  });
});
