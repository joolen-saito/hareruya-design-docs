/** M10-16 追加システム設定画面（メニューからの開き方） */
import { expect, Page } from "@playwright/test";

const PATH = "/setting/shop/additional_system";

export class AddSystemPage {
  constructor(private page: Page) {}

  /** メニューの大項目（設定）を開く（手順1の「データ管理」にあたる） */
  async 大項目を開く(): Promise<void> {
    const group = this.page.locator('.c-mainNavArea a.c-mainNavArea__navItemTitle[href="#nav-setting"]');
    await expect(group, "メニューの「設定」").toBeVisible();
    if ((await group.getAttribute("aria-expanded")) !== "true") await group.click();
    await expect(this.page.locator("#nav-setting"), "「設定」の下のメニュー").toBeVisible();
  }

  /** 「基本設定」を開き、「追加システム設定」を押す */
  async 追加システム設定を押す(): Promise<void> {
    const sub = this.page.locator('#nav-setting a.c-mainNavArea__navItemSubTitle[href="#nav-basic_info"]');
    if ((await sub.count()) > 0 && (await sub.getAttribute("aria-expanded")) === "false") await sub.click();
    const link = this.page.locator("#nav-setting").getByRole("link", { name: "追加システム設定", exact: true });
    await expect(link, "メニューの「追加システム設定」").toBeVisible();
    await Promise.all([this.page.waitForURL((u) => u.pathname.endsWith(PATH), { waitUntil: "load" }), link.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 追加システム設定画面が開いているか */
  async 開いているか(): Promise<boolean> {
    return new URL(this.page.url()).pathname.endsWith(PATH) && (await this.page.locator("form#point_form").count()) > 0;
  }
}
