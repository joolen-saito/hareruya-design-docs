/**
 * F06-21 退会の続き（-c）の画面シード。正本: cases/F06-21_seed_data.tsv
 * 既存の seeds/f06-21.ts は変えない。ここは「退会を完了する」ケース専用の試験会員（026・027・028・032・033・034）。
 *
 * - 会員は seeds/f06-21.ts と同じ作り方（仮会員機能の共有の設定は書き換えず、本会員として登録し、スマレジ会員番号が付けばDBで外す）。
 *   メールの前半に実行の印を付ける。選手データIDは会員の選手情報を DB の参照で控える（書き込みはしない）。
 * - 退会完了メールの試験設定（S-F06-21-MAIL）は、運営アドレスを店舗基本設定の送信元に書き換える共有の設定。メールの設定の書き換えは行わないので、
 *   作り方は無い（確かめるだけ）。退会完了メールの送信元を確かめないケースだけで、送信元は既定のまま退会する。ケースの注記に残す。
 */
import { プレイヤーID } from "../db/f03_07";
import { available } from "../lib/db";
import { defineSeed } from "../lib/seeds";
import { スマレジ会員番号なしの本会員を作る, スマレジ番号を外した注記 } from "./f06-member";
import { reportCurrentSeedIssue } from "./current_seed";

const PW2 = "Passw0rd!F0621Ja2";
const PW = "Passw0rd!F0621Ja";

defineSeed("S-F06-21-MAIL", async () => { /* 運営アドレスの書き換えはしない（共有の設定）。退会完了メールのテンプレートは導入時から登録済み */ });

let 選手データID028 = "";
for (const n of ["026", "027", "028", "032", "033", "034"]) {
  defineSeed(`S-F06-21-MEMBER-JA-${n}`, async ({ browser, notes }) => {
    const 氏名の姓 = n === "027" ? "退会試験027A" : `退会試験${n}`;
    const { 会員ID: id, 外した } = await スマレジ会員番号なしの本会員を作る(browser, { 姓: 氏名の姓, 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: `f0621-ja-${n}`, パスワード: PW, 電話番号: "0300000000" });
    if (外した) reportCurrentSeedIssue(スマレジ番号を外した注記);
    const key = n === "027" ? "027A" : n;
    notes.set(`〔会員データID-F0621-${key}〕`, id);
    const pid = available ? プレイヤーID(id) : "（DB確認なし）";
    if (!pid) throw new Error("会員の選手情報が見つからない");
    // 028 の選手データIDは、シード表のとおり選手情報のシード（S-F06-21-PLAYER-028）で控える
    if (n === "028") 選手データID028 = pid; else notes.set(`〔選手データID-F0621-${key}〕`, pid);
  });
}

defineSeed("S-F06-21-MEMBER-JA2-027", async ({ browser, notes }) => {
  const { 会員ID: id, 外した } = await スマレジ会員番号なしの本会員を作る(browser, { 姓: "退会試験F0621027B", 名: "花子", セイ: "タイカイシケン", メイ: "ハナコ", 前半: "f0621-ja2-027", パスワード: PW2, 電話番号: "0300000000" });
  if (外した) reportCurrentSeedIssue(スマレジ番号を外した注記);
  notes.set("〔会員データID-F0621-027B〕", id);
  const pid = available ? プレイヤーID(id) : "（DB確認なし）";
  if (!pid) throw new Error("会員の選手情報が見つからない");
  notes.set("〔選手データID-F0621-027B〕", pid);
});

// 選手情報は、会員の登録と同時に作られる（会員を二重には登録しない）。会員の作成を先に行う
defineSeed("S-F06-21-PLAYER-028", { needs: ["S-F06-21-MEMBER-JA-028"] }, async ({ notes }) => {
  if (!選手データID028) throw new Error("会員（S-F06-21-MEMBER-JA-028）の選手情報を読めていない");
  notes.set("〔選手データID-F0621-028〕", 選手データID028);
});
