/**
 * A06-07 買取用カード一覧取得（商品ID指定）の 003・007 のシード。既存の seeds/a06-07.ts は変えず、そこの管理者（S-A06-07-ADM-A）を使う。
 * 読み替えは seeds/a06-buying.ts・seeds/a06-disp.ts に書いた。
 * - 003: カードセット「A06-07セット」・プロモ「A06-07プロモ」・略称タグ「A06-07棚」は決まった印つきのマスタを使い回す（応答の値も印つきで読む）。
 *   部門名は「A0607部門003」（決まった印つき）。シード表の「状態NM以外の商品規格を廃止にする」は、取込で状態NMの1規格だけを作るので行わない。
 * - 007: 同じ商品の言語JP・状態NMに2件目の商品規格を、商品規格一覧の「新規作成」で足す（シード表の手順どおり）。
 *   商品規格Aは取込の1件（在庫1を入庫）、Bは新規作成の1件（在庫1を入庫）。部門は選択肢の先頭。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { 決まった入庫の管理者, 入庫して承認する } from "../pages/admin/a17_05_setup";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { カード商品を作る, 試験部門を用意する, 試験用のカードを用意する } from "./a06-buying";
import { 保管コードつきの商品を作る, 指定つきのカードを作る, 表示の関連を用意する } from "./a06-disp";
import "./a06-07";

export const 関連003 = { セット名日: "A06-07セット", セット名英: "A06-07 Set", セット略称: "A607-003", プロモ名日: "A06-07プロモ", プロモ名英: "A06-07 Promo", プロモコード: "A6P", 棚名: "A06-07棚" };

defineSeed("S-A06-07-BASE-003", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  const 関連 = await 表示の関連を用意する(browser, seed.シードID, 関連003);
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A0607部門003");
  const card = await 指定つきのカードを作る(browser, seed.シードID, { カード名日: "A06-07カード", カード名英: "A06-07 Card", 関連, カード番号: "007" });
  const p = await 保管コードつきの商品を作る(browser, seed.シードID, {
    商品コード: "A0607-BASE-003", 商品名日: "A06-07商品", 商品名英: "A06-07 Product", カード: card,
    基準価格: "2345", 販売価格: "2345", 買取価格: "1234", 在庫: 7, 画像: "a0607-003.jpg", 部門ID,
  }, 関連.棚名);
  notes.set("〔商品ID-A0607-003〕", p.商品ID);
  notes.set("〔カードID-A0607-003〕", card.カードID);
  notes.set("〔カード詳細ID-A0607-003〕", card.カード詳細ID);
  notes.set("〔商品規格ID-A0607-003〕", p.規格ID);
  notes.set("〔部門ID-A0607-003〕", 部門ID);
});

defineSeed("S-A06-07-DUPLICATE-007", { needs: ["S-A06-07-ADM-A"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A0607部門007");
  const card = await 試験用のカードを用意する(browser, seed.シードID, { カード名日: "A0607重複007", カード名英: "A0607 DUP 007", 詳細数: 1 });
  const a = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0607-DUP-1-007", 商品名日: "A0607重複商品007", 商品名英: "A0607 DUP Product 007",
    カード: { カードID: card.カードID, カード詳細ID: card.カード詳細IDs[0], カード名: card.カード名 },
    基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 1, 画像: "a0607-007.jpg", 部門ID,
  });
  const コード = rc("A0607-DUP-2-007");
  let bID = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await openClassList(page, a.商品ID);
    bID = await addClass(page, a.商品ID, { 言語: "日本語", 状態: "ニアミント", 商品コード: コード, 基準価格: "100", 販売価格: "100", 買取価格: "10" }, `${seed.シードID}: ${コード}`, issue);
  });
  await 入庫して承認する(browser, seed.シードID, [{ 商品コード: コード, 数量: 1 }], issue, 決まった入庫の管理者);
  issue("同じ商品の言語JP・状態NMに、商品規格一覧の「新規作成」で2件目の商品規格を足し（部門は選択肢の先頭）、本店・EC-CUBE へ1入庫して承認した");
  notes.set("〔商品ID-A0607-007〕", a.商品ID);
  notes.set("〔カードID-A0607-007〕", card.カードID);
  notes.set("〔カード詳細ID-A0607-007〕", card.カード詳細IDs[0]);
  notes.set("〔商品規格ID-A0607-007A〕", a.規格ID);
  notes.set("〔商品規格ID-A0607-007B〕", bID);
});
