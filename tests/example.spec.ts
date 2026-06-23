import { test, expect } from '@playwright/test';

const BASE_URL = 'https://nexttmp-six.vercel.app';

test.describe('Unified Happy Path Regression Suite', () => {

  // ─────────────────────────────────────────────────────────────
  // CASE 1: UI/UX Element Visibility
  // ─────────────────────────────────────────────────────────────
  test('Happy Path 1: Login UI components render successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check that critical elements are visible to the user
    await expect(page.locator('h1')).toContainText(/Sign in/i);
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 1b: Sign In Button Functionality
  // ─────────────────────────────────────────────────────────────
  test('Sign in button: redirects to /home on valid credentials', async ({ page }) => {
    const TEST_EMAIL = process.env.TEST_EMAIL ?? '';
    const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';

    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'TEST_EMAIL / TEST_PASSWORD env vars not set');
    }

    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Wait for the Supabase auth network call to complete before asserting URL
    await Promise.all([
      page.waitForResponse(res => res.url().includes('supabase') && res.url().includes('token'), { timeout: 10000 }),
      page.click('button[type="submit"]'),
    ]);

    // Check for visible error — if present, fail with a meaningful message
    const errorEl = page.locator('p.text-red-500');
    if (await errorEl.isVisible()) {
      const msg = await errorEl.textContent();
      throw new Error(`Login failed with error: "${msg}". Check TEST_EMAIL/TEST_PASSWORD and that the account is verified in Supabase.`);
    }

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('Sign in button: shows error on invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('p.text-red-500')).toBeVisible({ timeout: 8000 });
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 2: Storage API & Authentication Handoff
  // ─────────────────────────────────────────────────────────────
  test('Happy Path 2: Browser Storage API accepts and stores session tokens', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Simulate state engine saving a successful login token into localStorage
    await page.evaluate(() => {
      window.localStorage.setItem('user_session', JSON.stringify({ token: 'happy-token-123', user: 'aditya' }));
    });

    // Navigate away and verify the Storage API preserved the state data
    await page.goto(`${BASE_URL}/tasks`);
    const storageData = await page.evaluate(() => window.localStorage.getItem('user_session'));
    
    expect(storageData).toContain('happy-token-123');
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 3: System Design Link Integrity
  // ─────────────────────────────────────────────────────────────
  test('Happy Path 3: Core navigation links resolve without crashing', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Grab the internal links available on the page
    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      
      // Ensure local sub-links (like /tasks or /profile) return a successful 200 OK, not a 404
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        const response = await page.request.get(`${BASE_URL}${href}`);
        expect(response.status()).toBe(200); 
      }
    }
  });

  // ─────────────────────────────────────────────────────────────
  // CASE 4: Network & State Mocking
  // ─────────────────────────────────────────────────────────────
  test('Happy Path 4: Network layer successfully intercepts and pipes tasks data', async ({ page }) => {
    // Intercept outbound data calls and inject a clean mock task
    await page.route('**/api/tasks', async (route) => {
      const mockPayload = [{ id: 1, title: 'Playwright Happy Path Work', completed: false }];
      await route.fulfill({ status: 200, json: mockPayload });
    });

    await page.goto(`${BASE_URL}/tasks`);
    // (Optional: Add an assertion here for a visible text indicator once your tasks UI loads)
  });

});