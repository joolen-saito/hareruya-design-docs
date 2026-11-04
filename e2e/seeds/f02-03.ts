/**
 * F02-03（支店のグローバルナビ・PC版）の画面シード。正本: cases/F02-03_seed_data.tsv
 *
 * 作るシード:
 * - S-F02-03-ENV: 試験環境（支店サイトの公開・画面幅）。作る操作が無い。画面幅1280pxは試験の基盤の既定。
 * - S-F02-03-STORE: 試験支店A・試験支店B。店舗登録画面で、郵便番号・住所・Google map埋め込みURL・電話番号・店舗営業時間・ご当地晴れる屋くんの画像を入れて登録する。
 *   店舗一覧に同じ店名があれば内容を確かめて使う。支店URLは f0203a・f0203b（正本が決めていない）。画像は e2e/fixtures/f02-03/（正本の外の補い。中身が決まっていない入力ファイル）。
 * - S-F02-03-MEMBER: フロントの会員情報登録で登録し本会員にする（依頼者決定 2026-10-31）。管理画面の会員のポイント履歴追加で+1200。メールの前半に実行の印。
 * - S-F02-03-MEMBER-055: 保有ポイント0の会員。
 * - S-F02-03-STORE-056: 試験支店B-056（Google map埋め込みURLが違う店舗）。
 * - S-F02-03-CART-EMPTY-052: カートに触れない（作る操作が無い）。
 *
 * 作らないシード: カテゴリ（最新セットなど、手元の本来のカテゴリの子を足す）、検索対象のカード、画面幅390pxのブラウザ。
 */
import path from "node:path";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { ensureBranch, 支店の入力 } from "../pages/admin/f02_03_store";
import { ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { 本会員を作る, markedMail } from "./f06-member";

export const FIXTURES = path.resolve(__dirname, "../fixtures/f02-03");
export const 支店A: 支店の入力 = {
  店名: "試験支店A", 店名カナ: "シケンシテンエー", 店名英語: "Test Branch A", 支店URL: "f0203a", 店名略称3文字: "F2A", ショップ名略称: "試験支店A",
  郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区試験", 住所2: "1-1", 電話番号: "03-0000-0001",
  地図URL: "https://replace-dev.hareruyamtg.com:8443/maps/branch-a", 営業時間: "10:00～20:00", 画像: path.join(FIXTURES, "branch-a.png"),
};
export const 支店B: 支店の入力 = {
  店名: "試験支店B", 店名カナ: "シケンシテンビー", 店名英語: "Test Branch B", 支店URL: "f0203b", 店名略称3文字: "F2B", ショップ名略称: "試験支店B",
  郵便番号: "530-0001", 都道府県: "大阪府", 住所1: "大阪市試験", 住所2: "2-2", 電話番号: "06-0000-0002",
  地図URL: "https://replace-dev.hareruyamtg.com:8443/maps/branch-b", 営業時間: "11:00～21:00", 画像: path.join(FIXTURES, "branch-b.png"),
};
export const 支店B056: 支店の入力 = {
  店名: "試験支店B-056", 店名カナ: "シケンシテンビーゼロゴロク", 店名英語: "Test Branch B Extra", 支店URL: "f0203b056", 店名略称3文字: "F2C", ショップ名略称: "試験支店B-056",
  郵便番号: "530-0001", 都道府県: "大阪府", 住所1: "大阪市試験", 住所2: "2-2", 電話番号: "06-0000-0002",
  地図URL: "https://replace-dev.hareruyamtg.com:8443/f0203-056/map",
};

export const 会員メール = () => markedMail("f02-03-member");
export const 会員パスワード = "F0203Member!";
export const 会員055メール = () => markedMail("dpf0203-055");
export const 会員055パスワード = "Passw0rd-F0203055";

// 試験環境「支店Aと支店Bの支店ECTOP画面へアクセス可能」は、試験支店A・Bを登録して整える
defineSeed("S-F02-03-ENV", { needs: ["S-F02-03-STORE"] }, async () => { /* 画面幅1280pxは基盤の既定 */ });
defineSeed("S-F02-03-CART-EMPTY-052", async () => { /* カートに触れない */ });

defineSeed("S-F02-03-STORE", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-F0203-共有A〕", await ensureBranch(page, 支店A, (m) => reportSeedIssue(seed.シードID, m)));
    notes.set("〔店舗ID-F0203-共有B〕", await ensureBranch(page, 支店B, (m) => reportSeedIssue(seed.シードID, m)));
  });
});

defineSeed("S-F02-03-STORE-056", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔店舗ID-F0203-056〕", await ensureBranch(page, 支店B056, (m) => reportSeedIssue(seed.シードID, m)));
  });
});

defineSeed("S-F02-03-MEMBER", async ({ browser, notes }) => {
  const id = await 本会員を作る(browser, { 姓: "F0203試験", 名: "会員", セイ: "シケン", メイ: "カイイン", 前半: "f02-03-member", パスワード: 会員パスワード });
  notes.set("〔会員ID-F0203-共有〕", id);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, id, 1200); });
});

defineSeed("S-F02-03-MEMBER-055", async ({ browser, notes }) => {
  notes.set("〔会員ID-F0203-055〕", await 本会員を作る(browser, { 姓: "F0203試験", 名: "ゼロ", セイ: "シケン", メイ: "ゼロ", 前半: "dpf0203-055", パスワード: 会員055パスワード }));
});
