/**
 * M11-03 権限管理のシード（開発環境で作れる 036 の会員だけ）。正本: cases/M11-03_seed_data.tsv
 *
 * - S-M11-03-FRONT-MEMBER-036: フロントの会員登録で本会員を作る（seeds/f06-member.ts の 本会員を作る。本登録のメールの URL を開く）。
 *   メールアドレスの前半に実行の印を付ける（正本は m1103-036-member@example.test。同じアドレスの会員が開発環境にあると作れないため。依頼者決定 2026-10-28）。
 *   お名前は「結合」「太郎」、パスワードは正本どおり。会員IDは管理画面の会員一覧で控える（〔会員ID-M1103-036〕）。
 *
 * ほかのシード（権限URLマスターの置き換え・権限グループ・拒否設定・身分証画像など）は、全員が使う権限のマスタを消す・足す・書き換える前提なので作らない
 * （review/recheck_not_buildable_M11-03.tsv・review/M11-03_progress_2026-11-11_dev.md）。
 */
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed } from "../lib/seeds";
import { markedMail, 本会員を作る } from "./f06-member";

export const M1103_036 = { 前半: "m1103-036-member", パスワード: "Pw-M1103-036!" };
export const M1103_036のメール = (): string => markedMail(M1103_036.前半);

defineSeed("S-M11-03-FRONT-MEMBER-036", async ({ browser, notes, seed }) => {
  const id = await 本会員を作る(browser, { 姓: "結合", 名: "太郎", セイ: "ケツゴウ", メイ: "タロウ", 前半: M1103_036.前半, パスワード: M1103_036.パスワード });
  const s = getSeed(seed.シードID);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes("〔会員ID-M1103-036〕")) notes.set("〔会員ID-M1103-036〕", id);
});
