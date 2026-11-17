/**
 * A06-18 買取用カード一覧取得の読み取り専用（価格・在庫を書き換えない）のシード。作り方は seeds/a06-buying.ts（読み替えはそこに書いた）。
 */
import { defineSeed } from "../lib/seeds";
import { カード商品を作る, 本店の管理者を用意する, 買取の管理者の } from "./a06-buying";

export const A0618_ADM = 買取の管理者の("a0618_admin_a", "Passw0rd-FGA0618S", "A0618管理者A");
/** 本店の店名（在庫検索の店舗の選択肢）。S-A06-18-FGADM-A が読む */
export const A0618の店 = { 店名: "" };

defineSeed("S-A06-18-FGADM-A", async ({ browser, notes, seed }) => {
  const r = await 本店の管理者を用意する(browser, seed.シードID, A0618_ADM, "A0618店舗A");
  notes.set("〔店舗ID-A0618-共有A〕", r.店舗ID);
  A0618の店.店名 = r.店名;
});

defineSeed("S-A06-18-FGREAD-002", { needs: ["S-A06-18-FGADM-A"] }, async ({ browser, notes, seed }) => {
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0618-FG002-P", 商品名日: "A0618-FG002-商品", 商品名英: "A0618-FG002-Product", カード名日: "A0618-FG002-カード", カード名英: "A0618-FG002-Card",
    基準価格: "2345", 販売価格: "3456", 買取価格: "1234", 在庫: 6, 画像: "a0618-fg002.jpg",
  });
  notes.set("〔商品ID-A0618-FG002〕", p.商品ID);
  notes.set("〔商品規格ID-A0618-FG002〕", p.規格ID);
});
