/**
 * F06-21 退会の画面シード。正本: cases/F06-21_seed_data.tsv
 * - 日本語会員（MEMBER-JA。共有可）: 仮会員機能（共有の設定）は書き換えず、本会員として登録し、スマレジ会員番号が付けばDBで外す。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 *   選手データIDは、シード表はイベント申込登録のプレイヤー検索で控えると定めるが、DBの参照で読んで控える（書き込みはしない）。
 * - 認証値（AUTH）: 会員の登録で決まるパスワードの取り決めだけ（作り方は無い）。
 * - 退会そのものを行うシード（MEMBER-JA-026 など）・メール・スマレジ・環境設定の書き換えを要するシードは、このセッションでは実装しない。
 */
import { Browser } from "@playwright/test";
import { プレイヤーID } from "../db/f03_07";
import { 退会メールのテンプレート数, 選手のスマレジ連携 } from "../db/f06_21";
import { スマレジ連携を外す } from "../db/f06_21_prep";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { markedMail, スマレジ会員番号なしの本会員を作る, スマレジ番号を外した注記, 本会員を作る } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);
export const PW = "Passw0rd!F0621Ja";

defineSeed("S-F06-21-AUTH", async () => { /* 認証値の取り決め。会員の登録で入れる */ });
defineSeed("S-F06-21-MEMBER-JA", async ({ browser, notes }) => {
  const { 会員ID: id, 外した } = await スマレジ会員番号なしの本会員を作る(browser, { 姓: "退会試験", 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: "f0621-ja", パスワード: PW, 電話番号: "0300000000" });
  if (外した) reportCurrentSeedIssue(スマレジ番号を外した注記);
  notes.set("〔会員データID-F0621-共有〕", id);
  const pid = available ? プレイヤーID(id) : "（DB確認なし）";
  if (!pid) throw new Error("会員の選手情報が見つからない");
  notes.set("〔選手データID-F0621-共有〕", pid);
});

// 退会確認の入力エラーを試すケース専用の会員（036・037）。氏名は「退会試験036 太郎」「退会試験037 太郎」
for (const n of ["036", "037"]) {
  defineSeed(`S-F06-21-MEMBER-JA-${n}`, async ({ browser, notes }) => {
    const { 会員ID: id, 外した } = await スマレジ会員番号なしの本会員を作る(browser, { 姓: `退会試験${n}`, 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: `f0621-${n}-ja`, パスワード: PW, 電話番号: "0300000000" });
    if (外した) reportCurrentSeedIssue(スマレジ番号を外した注記);
    notes.set(`〔会員データID-F0621-${n}〕`, id);
    const pid = available ? プレイヤーID(id) : "（DB確認なし）";
    if (!pid) throw new Error("会員の選手情報が見つからない");
    notes.set(`〔選手データID-F0621-${n}〕`, pid);
  });
}

// ---- 退会を完了するケース用の会員（本会員として登録する。仮会員機能の共有の設定は書き換えない） ----
const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);
export const PW2 = "Passw0rd!F0621Ja2";

/** 本会員を画面で登録し、会員データID・選手データIDを控える。スマレジ会員番号が付いていればDBで外す（シード表は「未設定」） */
async function 退会する会員(
  ctx: { browser: Browser; notes: Notes },
  m: { 姓: string; 名: string; セイ: string; メイ: string; 前半: string; パスワード: string; 会員: string; 選手?: string },
): Promise<string> {
  const id = await 本会員を作る(ctx.browser, { 姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, 前半: m.前半, パスワード: m.パスワード });
  ctx.notes.set(m.会員, id);
  if (available) {
    const mail = mailOf(m.前半);
    const s = 選手のスマレジ連携(mail);
    if (!s) throw new Error(`会員 ${mail} の選手情報が見つからない`);
    if (s.番号 !== "" || s.存在フラグ === "t") {
      スマレジ連携を外す(mail);
      記す("本会員として登録するとスマレジ会員番号が付くため、DBで実行の印つきの会員の選手情報のスマレジ会員番号を未設定に設定した（シード表は「スマレジ会員番号未設定」。退会でスマレジへ通信しない）");
    }
    if (m.選手) {
      const pid = プレイヤーID(id);
      if (!pid) throw new Error("会員の選手情報が見つからない");
      ctx.notes.set(m.選手, pid);
    }
  } else if (m.選手) ctx.notes.set(m.選手, "（DB確認なし）");
  記す("仮会員機能（共有の設定）を書き換えず、本会員として登録して作った（シード表の「仮会員機能を有効にして」は読み替え）。メールアドレスの前半に実行の印を付けた");
  return id;
}

for (const n of ["026", "032", "033", "034"]) {
  defineSeed(`S-F06-21-MEMBER-JA-${n}`, async (ctx) => {
    await 退会する会員(ctx, { 姓: `退会試験${n}`, 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: `f0621-ja-${n}`, パスワード: PW, 会員: `〔会員データID-F0621-${n}〕`, 選手: `〔選手データID-F0621-${n}〕` });
  });
}
defineSeed("S-F06-21-MEMBER-JA-027", async (ctx) => {
  await 退会する会員(ctx, { 姓: "退会試験027A", 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: "f0621-ja-027", パスワード: PW, 会員: "〔会員データID-F0621-027A〕", 選手: "〔選手データID-F0621-027A〕" });
});
defineSeed("S-F06-21-MEMBER-JA-028", async (ctx) => {
  await 退会する会員(ctx, { 姓: "退会試験028", 名: "太郎", セイ: "タイカイシケン", メイ: "タロウ", 前半: "f0621-ja-028", パスワード: PW, 会員: "〔会員データID-F0621-028〕" });
});
