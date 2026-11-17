/**
 * A06-10 買取用カード一覧取得（商品IDリストが空）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 */
import { defineSeed } from "../lib/seeds";
import { カード商品を作る, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";

export const A0610_ADM = 買取の管理者の("a0610_admin_a", "Passw0rd-A0610A", "A0610管理者A");

defineSeed("S-A06-10-FGADM-A", async ({ browser, notes, seed }) => {
  const r = await 本店の管理者を用意する(browser, seed.シードID, A0610_ADM, "A0610店舗A");
  notes.set("〔店舗ID-A0610-共有A〕", r.店舗ID);
});

defineSeed("S-A06-10-FGEMPTY-001", { needs: ["S-A06-10-FGADM-A"] }, async ({ browser, notes, seed }) => {
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0610-FG001-REF", 商品名日: "A0610FG001参照商品", 商品名英: "A0610 FG001 REF Product", カード名日: "A0610FG001参照", カード名英: "A0610 FG001 REF",
    基準価格: "100", 販売価格: "100", 買取価格: "10", 在庫: 7, 画像: "a0610-fg001.jpg",
  });
  notes.set("〔商品ID-A0610-001〕", p.商品ID);
});
