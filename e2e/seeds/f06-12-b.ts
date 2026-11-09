/**
 * F06-12 ネット買取の一括買取確認 の続き（-b）のシード（画面操作）。正本: cases/F06-12_seed_data.tsv
 * 既存の seeds/f06-12.ts（006・007）は変えない。
 *
 * - 会員は、フロントの会員登録で作る（依頼者決定 2026-10-31）。メールの前半に実行の印を付ける。
 * - ネット買取の依頼は、会員でフロントにログインして申込む（手元の環境の買取できる商品を使う）。店頭買取の依頼は、店舗を用意して会員として申込む。
 * - まとめて買取の明細（通常・個別入力）は、画面で作れない（外部のMTGバイヤーアプリの更新でしか作られない）ので作らない。
 *   依頼の持ち主・依頼の有無・ログインの有無だけで決まる応答を確かめるケース（008〜011）だけ、明細の無い依頼で実装する（条件付き）。
 */
import { Browser } from "@playwright/test";
import { 会員の最新のネット買取依頼ID, 会員の最新の店頭買取依頼ID } from "../db/f06_12";
import { available } from "../lib/db";
import { defineSeed } from "../lib/seeds";
import { 店舗を用意する, 店頭買取を申込む, ネット買取を申込む, OWNERS_STORE, OWNERS_URL } from "./f06-11-b";
import { 本会員を作る } from "./f06-member";

export type 依頼 = { 持ち主のメール前半: string; 買取依頼ID: string };
/** ケース番号 → 作った依頼 */
export const 依頼一覧 = new Map<string, 依頼>();
export const 参照会員のパスワード = (n: string): string => `F0612Case${n}Pwd!`;

async function 会員を作る(browser: Browser, 前半: string, パスワード: string, 名: string): Promise<string> {
  return 本会員を作る(browser, { 姓: "F06試験", 名, セイ: "シケン", メイ: "カイイン", 前半, パスワード });
}

function ネット依頼を作る(browser: Browser, 前半: string, パスワード: string, 会員ID: string): Promise<string> {
  return ネット買取を申込む(browser, 前半, パスワード, [null]).then(() => {
    if (!available) throw new Error("この環境はDB確認ができないため、作った買取依頼のIDを読めない");
    const id = 会員の最新のネット買取依頼ID(会員ID);
    if (!id) throw new Error(`会員 ${前半} のネット買取依頼が作られていない`);
    return id;
  });
}

for (const n of ["009", "011"]) {
  defineSeed(`S-F06-12-BASE-${n}`, async ({ browser }) => {
    const 前半 = `f0612_member-${n}`;
    const 会員ID = await 会員を作る(browser, 前半, 参照会員のパスワード(n), `会員${n}`);
    依頼一覧.set(n, { 持ち主のメール前半: 前半, 買取依頼ID: await ネット依頼を作る(browser, 前半, 参照会員のパスワード(n), 会員ID) });
  });
}

defineSeed("S-F06-12-OTHER-008", async ({ browser }) => {
  // 参照会員（008）と、依頼の持ち主になる他会員
  await 会員を作る(browser, "f0612_member-008", 参照会員のパスワード("008"), "参照会員008");
  const 他前半 = "f0612_other-008";
  const 他ID = await 会員を作る(browser, 他前半, 参照会員のパスワード("008b"), "他会員008");
  依頼一覧.set("008", { 持ち主のメール前半: 他前半, 買取依頼ID: await ネット依頼を作る(browser, 他前半, 参照会員のパスワード("008b"), 他ID) });
});

defineSeed("S-F06-12-OTC-010", async ({ browser, seed }) => {
  const 前半 = "f0612_member-010";
  const 会員ID = await 会員を作る(browser, 前半, 参照会員のパスワード("010"), "会員010");
  await 店舗を用意する(browser, OWNERS_STORE, seed.シードID);
  await 店頭買取を申込む(browser, OWNERS_URL, 前半, 参照会員のパスワード("010"), 1);
  if (!available) throw new Error("この環境はDB確認ができないため、作った店頭買取依頼のIDを読めない");
  const id = 会員の最新の店頭買取依頼ID(会員ID);
  if (!id) throw new Error(`会員 ${前半} の店頭買取依頼が作られていない`);
  依頼一覧.set("010", { 持ち主のメール前半: 前半, 買取依頼ID: id });
});
