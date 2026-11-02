/**
 * M07-07 買取商品一覧（キャンセル）CSV出力 の画面シード。正本: cases/M07-07_seed_data.tsv
 *
 * 作るシード: 管理者（ADM）と、買取番号 7077111 の買取情報が無いこと（BUY-011）。
 * 買取明細（カード商品・売却しない明細）を作るシード（BUY-005 ほか）は、カード商品CSV登録・商品規格の登録・ネット買取の申込を含むため、ここでは作っていない。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { BuyListPage } from "../pages/admin/m07_buy";
import { 試験管理者を用意する } from "./m07-common";

export const M0707_ADMIN: Account = { loginId: "m0707_admin", password: "Passw0rd!M0707" };

defineSeed("S-M07-07-ADM", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0707_ADMIN, "M07-07試験管理者");
});

defineSeed("S-M07-07-BUY-011", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    await l.買取番号を入れる("7077111");
    await l.検索する();
    const rows = await l.行();
    if (rows.length) {
      for (const r of rows) await l.削除する(r.番号, "OK");
      reportSeedIssue(seed.シードID, `買取番号 7077111 の行が ${rows.length} 件あったので、一覧から削除した`);
    }
  });
});
