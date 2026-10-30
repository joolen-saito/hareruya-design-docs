/**
 * F03-01 商品一覧の画面シード。正本: cases/F03-01_seed_data.tsv
 *
 * 作ったシード: 共通試験環境（ENV）、存在しないカテゴリ（NOCATEGORY-019）。
 * 作らないシード（記録 e2e/review/F03-01_progress_2026-10-30.md）:
 * - 商品を作って検索サービスの索引へ反映（ユニサーチフィードの送信）するまでを定めるシード全般。手元の環境には送信先へ入る鍵が無く、外部の試験環境が要る。
 * - 投入方法に「DBへ直接」を含むシード（MASTER・STORE-001・HTML-006・RECENT-007・STORE-014・FILTER-016・VIEW-032・PAGING-054・WEEKSALES-082/083）。
 */
import { expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { CategoryPage, purgeCategories } from "../pages/admin/category";
import { 店舗の入口 } from "../pages/front/f03_01_product_list";

defineSeed("S-F03-01-ENV", async ({ browser }) => {
  // 参照だけで成り立つ範囲を確かめる: 本店 /ja/ と TC大阪支店 /ja/osaka/ が日本語で公開され、商品一覧が開ける。
  // 商品一覧の1ページ最大件数・ユニサーチ一覧上限・他の状態の価格下限は、管理画面に設定欄が無い（記録の「シードでの解釈」）ため、書き換えない
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    for (const [店, path] of Object.entries(店舗の入口)) {
      for (const 画面 of ["/", "/products/search"]) {
        const res = await page.goto(`${BASE_URL}${path}${画面}`, { waitUntil: "domcontentloaded" });
        expect(res?.status() ?? 0, `${店}の公開側（${path}${画面}）が開けない`).toBeLessThan(400);
      }
    }
  } finally {
    await context.close();
  }
  reportSeedIssue("S-F03-01-ENV", "商品一覧の1ページ最大件数・ユニサーチ一覧上限・他の状態の価格下限・ユニサーチ接続先は、管理画面に設定欄が無いため書き換えていない（本店とTC大阪支店が開けることだけを確かめた）");
});

defineSeed("S-F03-01-NOCATEGORY-019", async ({ browser }) => {
  // カテゴリ登録画面の「CSVダウンロード」で出力したCSVに、カテゴリIDが999の行が無いことを確かめる。あれば画面から削除する
  await withAdminSession(browser, SETUP_ADMIN as Account, async (page) => {
    page.setDefaultTimeout(60_000);
    const 消した = await purgeCategories(page, (r) => r["カテゴリID"] === "999", "S-F03-01-NOCATEGORY-019", (w) => reportSeedIssue("S-F03-01-NOCATEGORY-019", w));
    void 消した;
    // 削除したあとにCSVを出力し直して、行が無いことを確かめる
    const cat = new CategoryPage(page);
    await cat.openTop();
    const 残り = (await cat.downloadCsv()).filter((r) => r["カテゴリID"] === "999");
    expect(残り.length, "カテゴリID 999 の行が残っている").toBe(0);
  });
});
