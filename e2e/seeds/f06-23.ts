/**
 * F06-23 お問い合わせ履歴の画面シード。正本: cases/F06-23_seed_data.tsv
 * 会員（CASE-…。お問い合わせの送信なし）: フロントの会員情報登録で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧で会員IDを控える。
 * メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。お問い合わせ件名のマスタ（SUBJECT）と、お問い合わせを送るシードは、このセッションでは実装しない。
 */
import { defineSeed } from "../lib/seeds";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);

for (const [n, 区分, 文字] of [["001", "a", "A"], ["002", "a", "A"], ["003", "a", "A"], ["004", "a", "A"], ["010", "c", "C"], ["011", "c", "C"], ["022", "d", "D"], ["023", "d", "D"], ["024", "d", "D"]] as const) {
  defineSeed(`S-F06-23-CASE-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0623-${n}〕`, await 本会員を作る(browser, { 姓: "F06-23", 名: `会員${文字}${n}`, セイ: "シケン", メイ: "カイイン", 前半: `f0623_member_${区分}-${n}`, パスワード: `F0623Pass${文字}${n}` }));
  });
}
