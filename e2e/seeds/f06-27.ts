/**
 * F06-27 パスワード設定（ポリシー違反用）の画面シード。正本: cases/F06-27_seed_data.tsv
 * 会員（COMPLIANT-003・NOLOGIN-021）: フロントの会員情報登録で登録し本会員にする。管理画面の会員一覧で会員IDを控える。ログインを失敗させない。
 */
import { defineSeed } from "../lib/seeds";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);

for (const [id, n] of [["S-F06-27-COMPLIANT-003", "003"], ["S-F06-27-NOLOGIN-021", "021"]] as const) {
  defineSeed(id, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0627-${n}〕`, await 本会員を作る(browser, { 姓: `F0627-${n}-会員`, 名: "試験", セイ: "テスト", メイ: "カイイン", 前半: `f0627-${n}`, パスワード: `F0627-Cmp-${n}!ab` }));
  });
}
