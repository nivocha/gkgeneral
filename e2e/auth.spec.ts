import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test("shows validation errors on empty form", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByText(/required/i)).toBeVisible()
  })
})
