/**
 * A06-08 カード名検索の 010（店舗ごとの EC 在庫）のシード（S-A06-08-ADM-B・S-A06-08-STOCK-010）。既存の seeds/a06-08.ts は変えず、そこの共通のシードを needs で使う。
 * 作り方は A06-07 の 009（seeds/a06-07.ts）と同じ。店舗B は試験支店に読み替えた（seeds/a06-08.ts の S-A06-08-SHOPS と同じ）。
 * 本店の EC 在庫7は入庫と承認で入れ、本店の EC 以外（スマレジ）の在庫70と、試験支店の EC 在庫9は、入庫の部品が本店・EC にしか入れられないので、
 * E2E の商品規格の在庫の行にだけ DB で書いた（依頼者決定 2026-11-10）。部門は「A06-08部門」（決まった印つき）を使い回す。商品名は「A06-08在庫商品」に実行の印を付けた値。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 在庫数を書く, 在庫場所 } from "../db/a06_rel";
import { 本店ID, 試験支店ID } from "../pages/admin/test_store";
import { 試験支店の管理者を用意する } from "./a06-branch";
import { カード商品を作る, 試験部門を用意する, 買取の管理者の } from "./a06-buying";
import "./a06-08";

export const A0608_ADM_B = 買取の管理者の("a0608_admin_b", "Passw0rd!A0608B", "A0608管理者B");

defineSeed("S-A06-08-ADM-B", { needs: ["S-A06-08-SHOPS"] }, async ({ browser, seed }) => {
  await 試験支店の管理者を用意する(browser, seed.シードID, A0608_ADM_B, "店舗B（店舗ID 608502）");
});

defineSeed("S-A06-08-STOCK-010", { needs: ["S-A06-08-ADM-A", "S-A06-08-ADM-B"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 部門ID = await 試験部門を用意する(browser, seed.シードID, "A06-08部門");
  const p = await カード商品を作る(browser, seed.シードID, {
    商品コード: "A0608-010", 商品名日: "A06-08在庫商品", 商品名英: "A06-08 STOCK Product 010", カード名日: "A06-08在庫010", カード名英: "A06-08 STOCK 010",
    基準価格: "2381", 販売価格: "2381", 買取価格: "1081", 在庫: 7, 画像: "a0608-010.jpg", 部門ID,
  });
  在庫数を書く(`${seed.シードID}: 本店の EC 以外の在庫`, p.規格ID, 本店ID, 在庫場所.EC以外, 70);
  在庫数を書く(`${seed.シードID}: 試験支店の EC 在庫`, p.規格ID, 試験支店ID, 在庫場所.EC, 9);
  issue("本店の EC 在庫7は入庫と承認で入れた。本店の EC 以外（スマレジ）の在庫70と、試験支店の EC 在庫9は、入庫の部品が本店・EC にしか入れられないので、E2E の商品規格の在庫の行にだけ DB で書いた（依頼者決定 2026-11-10）");
  notes.set("〔部門ID-A0608-010〕", 部門ID);
  notes.set("〔商品ID-A0608-010〕", p.商品ID);
  notes.set("〔商品規格ID-A0608-010〕", p.規格ID);
  if (p.カードID) notes.set("〔カードID-A0608-010〕", p.カードID);
  if (p.カード詳細ID) notes.set("〔カード詳細ID-A0608-010〕", p.カード詳細ID);
});
