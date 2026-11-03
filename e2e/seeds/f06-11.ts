/**
 * F06-11 買取履歴一覧の画面シード。正本: cases/F06-11_seed_data.tsv
 * 会員（CASE-003・004・018・019・022。ネット買取・店頭買取の申込みなし）: フロントの会員情報登録で登録し本会員にする。管理画面の会員一覧で会員IDを控える。
 * メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * 表示件数のマスタ（PAGE-MASTER）: 初期データが正本の9行のままなら変更は要らない、と定めるので、作り方は無い（参照のみ）。
 * ネット買取を11件作るシード（PAGELINK・ITEM・CBORD など）は、ネット買取の申込みを繰り返す作り方のため、このセッションでは実装しない。
 */
import { defineSeed } from "../lib/seeds";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);

for (const [n, 前半] of [["003", "f0611-a-003"], ["004", "f0611-a-004"], ["018", "none-f0611-018"], ["019", "none-f0611-019"], ["022", "f0611-a-022"]] as const) {
  defineSeed(`S-F06-11-CASE-${n}`, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0611-${n}〕`, await 本会員を作る(browser, { 姓: "F06-11", 名: `会員${n}`, セイ: "シケン", メイ: "カイイン", 前半, パスワード: `F0611PwdCase${n}` }));
  });
}
