/** M03-01-050（検索結果→商品詳細/編集の連携）の画面シード。正本: cases/M03-01_seed_data.tsv */
import { expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { goodsCategoryFromSharedMaster, registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsProductId, removeProductsMatchingName } from "../pages/admin/m03_01_goods_list_seed";
// 共有マスタ S-M03-01-MASTERS-READ の作り方
import "./m03-01";

export const M0301L_ADMIN: Account = { loginId: "m0301l_admin", password: "Passw0rd!M0301L" };

defineSeed("S-M03-01-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 正本は所属店舗を指定しない。S-M03-01-ADM と同じく、管理画面で利用可能な店舗を1つ選び、
    // 商品管理を操作できるシステム管理者の権限を付ける。
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
      .map((option) => option as HTMLOptionElement)
      .filter((option) => option.value !== "")
      .map((option) => option.textContent?.trim() ?? "")
      .filter(Boolean));
    if (stores.length === 0) throw new Error("S-M03-01-L-ADM: メンバーに割り当てられる店舗が画面に無い");
    const store = stores[0];
    await ensureMember(page, {
      名前: "M03-01連携試験管理者", 所属店舗: store,
      ログインID: M0301L_ADMIN.loginId, メールアドレス: "m0301l_admin@example.test",
      パスワード: M0301L_ADMIN.password, 権限: "システム管理者",
      デフォルト検索表示店舗: store, 編集可能店舗: [store],
    });
  });
  // ログインでき、商品管理を操作できることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0301L_ADMIN, async (page) => {
    await page.goto(adminUrl("/product"));
    await expect(page.locator("form#search_form")).toBeVisible();
  });
});

const products = [
  { code: "LNK0301-001A", name: "連携遷移商品-001A", idNote: "〔商品ID-M0301-050A〕" },
  { code: "LNK0301-001B", name: "連携遷移商品-001B", idNote: "〔商品ID-M0301-050B〕" },
] as const;

defineSeed("S-M03-01-L-PROD-050", { needs: ["S-M03-01-L-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
  const categoryId = goodsCategoryFromSharedMaster(notes, seed.シードID);
  await withAdminSession(browser, M0301L_ADMIN, async (page) => {
    // 正本: 登録の前に商品名(日/英)で「連携遷移商品-001」を検索し、あれば完全に削除する
    await removeProductsMatchingName(page, "連携遷移商品-001", true);
    await registerGoodsCsv(page, {
      what: `${seed.シードID} の2行グッズ商品CSV登録`,
      fileName: "m03-01-050-goods.csv",
      categoryId,
      lines: products.map((p) => ({ code: p.code, nameJp: p.name, nameEn: p.name })),
      onWarning: (warning) => reportSeedIssue(seed.シードID, warning),
    });
    for (const p of products) notes.set(p.idNote, await readGoodsProductId(page, p.code, p.name));
  });
});
