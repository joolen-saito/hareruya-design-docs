/** M03-01 商品マスター（検索入力）の画面シード。正本: cases/M03-01_seed_data.tsv */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import {
  ensureCardset, ensureGoodsChildCategory, ensureProductSection, expectReadMasterScope,
} from "../pages/admin/product_masters";

export const M0301_ADMIN: Account = { loginId: "m0301_admin", password: "Passw0rd!M0301" };

defineSeed("S-M03-01-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 正本は所属店舗を指定しない。管理画面で利用可能な店舗を1つ選び、
    // 商品管理を操作できるシステム管理者の権限を付ける。
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
      .map((option) => option as HTMLOptionElement)
      .filter((option) => option.value !== "")
      .map((option) => option.textContent?.trim() ?? "")
      .filter(Boolean));
    if (stores.length === 0) throw new Error("S-M03-01-ADM: メンバーに割り当てられる店舗が画面に無い");
    const store = stores[0];
    await ensureMember(page, {
      名前: "M03-01試験管理者", 所属店舗: store,
      ログインID: M0301_ADMIN.loginId, メールアドレス: "m0301_admin@example.test",
      パスワード: M0301_ADMIN.password, 権限: "システム管理者",
      デフォルト検索表示店舗: store, 編集可能店舗: [store],
    });
  });
  // ログイン・商品管理権限・ロックなし・複数セッション利用を、ケースとは別に確認する。
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    await withAdminSession(browser, M0301_ADMIN, async (otherPage) => {
      await page.goto(adminUrl("/product"));
      await otherPage.goto(adminUrl("/product"));
      await expect(page.locator("form#search_form")).toBeVisible();
      await expect(otherPage.locator("form#search_form")).toBeVisible();
    });
  });
});

defineSeed("S-M03-01-MASTERS-READ", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const issue = (message: string) => reportSeedIssue(seed.シードID, message);
    notes.set("〔カテゴリID-M0301-共有A〕", await ensureGoodsChildCategory(page, "M03カテゴリA", "M03 Category A", issue));
    notes.set("〔カテゴリID-M0301-共有B〕", await ensureGoodsChildCategory(page, "M03カテゴリB", "M03 Category B", issue));
    notes.set("〔カードセットID-M0301-共有A〕", await ensureCardset(page, "M03セットA", "M03 Set A", "M3A", issue));
    notes.set("〔カードセットID-M0301-共有B〕", await ensureCardset(page, "M03セットB", "M03 Set B", "M3B", issue));
    notes.set("〔部門ID-M0301-共有〕", await ensureProductSection(page, "M03部門A", issue));
    await expectReadMasterScope(page);
  });
});
