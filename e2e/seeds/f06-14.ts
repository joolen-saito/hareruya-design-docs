/**
 * F06-14 マイイベント・デッキ登録の画面シード。正本: cases/F06-14_seed_data.tsv
 * 会員（MEMBER。共有可）: フロントの会員登録で登録し本会員にする。お名前は「試験 F0614-共有」。管理画面の会員一覧で会員IDを控える。
 * プレイヤーIDは、シード表はイベント新規申込登録のプレイヤー検索で控えると定めるが、DBの参照で読んで控える（書き込みはしない）。
 * メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 */
import { プレイヤーID } from "../db/f03_07";
import { available } from "../lib/db";
import { defineSeed } from "../lib/seeds";
import { 本会員を作る, markedMail } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);
export const PW = "Passw0rd!F0614";

defineSeed("S-F06-14-MEMBER", async ({ browser, notes }) => {
  const id = await 本会員を作る(browser, { 姓: "試験", 名: "F0614-共有", セイ: "シケン", メイ: "キョウユウ", 前半: "f0614_member", パスワード: PW });
  notes.set("〔会員ID-F0614-共有〕", id);
  const pid = available ? プレイヤーID(id) : "（DB確認なし）";
  if (!pid) throw new Error("会員のプレイヤーが見つからない");
  notes.set("〔プレイヤーID-F0614-共有〕", pid);
});
