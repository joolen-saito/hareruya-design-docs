import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../config/default.config";

/**
 * 管理ログイン Page Object（ec-cube-enterprise/e2e-tests/pages/admin/login.page.ts を踏襲）。
 * セレクタは admin/login.twig 由来・実機(/admin/login)で id="login_id" / _csrf_token を確認済み。
 */
export class AdminLoginPage {
  readonly page: Page;
  readonly url: string;
  readonly loginId: Locator;   // login.twig:26 id=login_id
  readonly password: Locator;  // login.twig:29 (render: #password)
  readonly loginButton: Locator; // login.twig:37 trans admin.login.login
  readonly error: Locator;     // login.twig:33 .text-danger

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/login`;
    this.loginId = page.locator("#login_id");
    this.password = page.locator("#password");
    this.loginButton = page.locator('button:has-text("ログイン")');
    this.error = page.locator(".text-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async login(loginId: string, password: string) {
    await this.loginId.fill(loginId);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async seeLoginForm() {
    await expect(this.loginId).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}
