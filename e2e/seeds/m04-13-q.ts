/**
 * M04-13 在庫分割結合登録編集（分割）の「公開側の商品詳細へ届く」ケース（097）のシード。正本: cases/M04-13_seed_data.tsv
 *  - S-M04-13-QE-ENV: 公開側のブラウザの環境。検索サービス（ユニサーチ）の接続の設定は書き換えない（共有の設定）。公開側のブラウザはケースの新しいブラウザで代える
 *  - S-M04-13-QE-DETAIL-097: 本店の商品（本店公開・販売価格100円・販売制限なし）の EC-CUBE 在庫10（入庫の申請を承認済み）と、申請者・承認者
 * 読み替え: 所属は所属のマスタの既存「試験所属A」・権限はシステム管理者（承認権限あり）・編集可能店舗は本店。商品コード・商品名には実行の印を付ける。
 * 申請者・承認者は正本の名前・ログインIDで「あれば使い、無ければ作る」。
 */
import { rc } from "../lib/run_marker";
import { 所属がある } from "../db/m04_21_x";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { expectNoProductCodes, readSupplyGoodsCategoryId, uploadGoodsLines } from "../pages/admin/m04_17_seed_ops";
import { StockListPage } from "../pages/admin/stock_edit";
import { 管理者を用意する, 人の, 入庫して承認する, 試験所属 } from "./m04-21-q";

export type M0413QE097 = { 本店名: string; 申請者: ReturnType<typeof 人の>; 承認者: ReturnType<typeof 人の>; 商品ID: string; 商品コード: string; 商品名: string };
let qe097: M0413QE097 | null = null;
export function m0413QE097(): M0413QE097 {
  if (!qe097) throw new Error("S-M04-13-QE-DETAIL-097 をまだ作っていない");
  return qe097;
}

defineSeed("S-M04-13-QE-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "検索サービス（ユニサーチ）の接続の設定は書き換えない（共有の設定）。公開側のブラウザはケースの新しいブラウザ（日本語・PC・ログアウト）で代える");
});

defineSeed("S-M04-13-QE-DETAIL-097", async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  if (!所属がある(試験所属)) throw new Error(`所属のマスタに「${試験所属}」が無い（所属のマスタは足さない）`);
  const code = rc("QE0413-001-CODE"), name = rc("QE0413-001-NAME");
  const ap = 人の("qe0413-001-ap", "QE0413-001申請者", "Passw0rd-QE0413001");
  const ar = 人の("qe0413-001-ar", "QE0413-001承認者", "Passw0rd-QE0413001");
  let 本店名 = "", 商品ID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    本店名 = await new StockListPage(page).shopNameById("1");
    for (const p of [ap, ar]) await 管理者を用意する(page, p, "1");
    await expectNoProductCodes(page, [code], seed.シードID);
    await uploadGoodsLines(page, {
      what: `${seed.シードID} のグッズ商品CSV登録`, fileName: `${seed.シードID.toLowerCase()}-${Date.now()}.csv`, categoryId: await readSupplyGoodsCategoryId(page), onIssue: issue,
      lines: [{ 商品コード: code, 商品名: name, 基準価格: "100", 販売価格: "100", 買取価格: "1" }],
    });
    商品ID = await openProductEditByCode(page, code);
    const rows = await classRowsFromProductEdit(page, 商品ID);
    if (rows.length !== 1) throw new Error(`${code} の取込直後の商品規格が1件でない`);
    await savePublishedClass(page, { productId: 商品ID, classId: rows[0].商品規格ID }, `${name} の取り込みで作られた規格`, issue);
  });
  notes.set("〔商品ID-M0413-001〕", 商品ID);
  for (const p of [ap, ar]) await withAdminSession(browser, p.account, async () => undefined);
  await 入庫して承認する(browser, seed.シードID, { 店名: 本店名, code, 数: 10, 単価: 100, 申請者: ap, 承認者: ar }, issue);
  qe097 = { 本店名, 申請者: ap, 承認者: ar, 商品ID, 商品コード: code, 商品名: name };
  issue(`店舗は本店（${本店名}）。申請者「${ap.名前}」・承認者「${ar.名前}」は所属「${試験所属}」・システム管理者（承認権限あり）・編集可能店舗は本店（あれば使う）`);
  issue(`商品コード ${code}・商品名 ${name} は正本の値に実行の印を付けた。取り込みで作られた規格を公開で登録し、本店のEC-CUBE在庫へ10を入庫（在庫変動理由「試験データ」・仕入単価100）して承認者が承認した`);
});
