/**
 * F06-21 退会の画面シード。正本: cases/F06-21_seed_data.tsv
 * - 日本語会員（MEMBER-JA。共有可）: 仮会員機能（共有の設定）を登録のあいだだけ有効にして仮会員として登録し、本登録のメールのURLは開かずに管理画面で本会員にする。
 *   仮会員機能は登録後すぐ元の値へ戻し、DBの参照で確かめる（ケースごとに戻す必要がない）。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 *   選手データIDは、シード表はイベント申込登録のプレイヤー検索で控えると定めるが、DBの参照で読んで控える（書き込みはしない）。
 * - 認証値（AUTH）: 会員の登録で決まるパスワードの取り決めだけ（作り方は無い）。
 * - 退会そのものを行うシード（MEMBER-JA-026 など）・メール・スマレジ・環境設定の書き換えを要するシードは、このセッションでは実装しない。
 */
import { プレイヤーID } from "../db/f03_07";
import { available } from "../lib/db";
import { defineSeed } from "../lib/seeds";
import { markedMail, 仮登録から本会員にする } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);
export const PW = "Passw0rd!F0621Ja";

defineSeed("S-F06-21-AUTH", async () => { /* 認証値の取り決め。会員の登録で入れる */ });
defineSeed("S-F06-21-MEMBER-JA", async ({ browser, notes }) => {
  const id = await 仮登録から本会員にする(browser, { 姓: "退会試験", 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: "f0621-ja", パスワード: PW, 電話番号: "0300000000" });
  notes.set("〔会員データID-F0621-共有〕", id);
  const pid = available ? プレイヤーID(id) : "（DB確認なし）";
  if (!pid) throw new Error("会員の選手情報が見つからない");
  notes.set("〔選手データID-F0621-共有〕", pid);
});

// 退会確認の入力エラーを試すケース専用の会員（036・037）。氏名は「退会試験036 太郎」「退会試験037 太郎」
for (const n of ["036", "037"]) {
  defineSeed(`S-F06-21-MEMBER-JA-${n}`, async ({ browser, notes }) => {
    const id = await 仮登録から本会員にする(browser, { 姓: `退会試験${n}`, 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: `f0621-${n}-ja`, パスワード: PW, 電話番号: "0300000000" });
    notes.set(`〔会員データID-F0621-${n}〕`, id);
    const pid = available ? プレイヤーID(id) : "（DB確認なし）";
    if (!pid) throw new Error("会員の選手情報が見つからない");
    notes.set(`〔選手データID-F0621-${n}〕`, pid);
  });
}
