/**
 * F02-01 PC版ナビゲーション（本店）の画面シード（016・018・020・067・069・070）。正本: cases/F02-01_seed_data.tsv
 *
 * - S-F02-01-ENV: 環境のシード。開発環境に既にある前提で、作り方は無い（最初の手順の画面が確かめる）。
 * - 会員（MEMBER-016・018・020・067・069、CART-070）: フロントの会員登録で登録し、本登録のメールのURLを開いて本会員にする（seeds/f06-member.ts の 本会員を作る）。
 *   メールの前半に実行の印を付ける。016・018 は管理画面のポイント付与で +125（登録したばかりの残高は0）。
 * - BROWSER-016〜070: 「専用ブラウザでその会員としてログインする」は、ケースのブラウザで手順1の前にログインする（spec）。
 *
 * シードでの解釈（記録にも書く）:
 * - 姓・名: 「F0201会員-016」と読める値として、姓「F0201会員」・名「016」（067 は姓「お気に入り0件会員」、069 は「ポイント0会員」、070 は「空カート確認会員」、名は番号）。
 * - ポイント付与の種類・備考: 既存の部品（m05_11_order_edit の ポイントを付与する）のとおり、種類は選択肢の先頭、備考は先頭の次の選択肢。
 * - 067 のお気に入り0件・070 の空カート・069 の残高0: 登録したばかりの会員で、商品をお気に入り・カートに入れず、ポイントも付与しない。067 と 070 はケースの開始時の画面で確かめる。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { markedMail, 本会員を作る } from "./f06-member";

export type F0201会員 = { メール: string; パスワード: string };
export const 会員の = (k: string): F0201会員 => ({ メール: markedMail(`f0201-${k}`), パスワード: `Pw-F0201-${k}` });
const 姓 = (k: string) => (k === "067" ? "お気に入り0件会員" : k === "069" ? "ポイント0会員" : k === "070" ? "空カート確認会員" : "F0201会員");

defineSeed("S-F02-01-ENV", async () => { /* 環境。開発環境に既にある前提（最初の手順の画面が確かめる） */ });

for (const k of ["016", "018", "020", "067", "069", "070"]) {
  const seedId = k === "070" ? "S-F02-01-CART-070" : `S-F02-01-MEMBER-${k}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const m = 会員の(k);
    const id = await 本会員を作る(browser, { 姓: 姓(k), 名: k, セイ: "シケン", メイ: "カイイン", 前半: `f0201-${k}`, パスワード: m.パスワード });
    if (["016", "018", "020"].includes(k)) notes.set(`〔会員ID-F0201-${k}〕`, id);
    if (k === "016" || k === "018") {
      await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, id, 125); });
    }
  });
  defineSeed(`S-F02-01-BROWSER-${k}`, async () => { /* ケースのブラウザで手順1の前にログインする（spec） */ });
}
