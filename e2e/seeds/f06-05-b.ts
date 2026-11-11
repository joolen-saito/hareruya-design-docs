/**
 * F06-05 マイページの続き（-b）のシード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。
 * 正本: cases/F06-05_seed_data.tsv。記録 review/F06-05_progress_2026-11-11_dev.md
 *
 * - S-F06-05-ENV: 店舗基本設定（バーコード接頭番号・全体桁数・店頭受取連携）とスマレジ試験環境の接続は、共有の開発環境で全員が使う設定。
 *   書き換えずに、開発環境に今ある値を使う（作る操作は無い）。
 * - S-F06-05-BASIC: 会員はフロントの会員登録で作る（seeds/f06-member.ts の 本会員を作る。メールアドレスの前半に実行の印）。
 *   本登録で振られるスマレジ側の会員番号とプレイヤーIDは DB の参照で控える（プレイヤー検索の画面の代わり）。
 *   ポイントは管理画面のポイント付与（キャンペーン、特別対応）で 100・150・300 をシード表の発行日で付与し、
 *   保有ポイント500（画面で指定できない）だけを、作った会員のプレイヤーの行へ DB で書く（db/f06_05_b.ts。E2E_DB_WRITE=1 が要る）。
 */
import { 会員のプレイヤー, 会員のポイント履歴, 保有ポイントを書く } from "../db/f06_05_b";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { 発行日を指定してポイントを付与する } from "../pages/admin/f06_05_point";
import { markedMail, 本会員を作る } from "./f06-member";

export const 基本会員の姓 = "結合試験";
export const 基本会員 = { メール: markedMail("f0605"), パスワード: "Passw0rd!F0605" };
export const 基本会員の控え = { 会員ID: "", プレイヤーID: "", スマレジID: "" };

function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

defineSeed("S-F06-05-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "店舗基本設定（バーコード接頭番号・全体桁数・店頭受取連携）とスマレジ試験環境の接続・非同期処理は、共有の開発環境で全員が使う設定なので書き換えず、開発環境に今ある値を使った（正本の外の補い）");
});

/** 本登録のあと、スマレジ側の会員番号が振られるのを待つ（振られなければ空） */
async function スマレジの会員番号を待つ(会員ID: string, 待つ秒: number): Promise<string> {
  const 期限 = Date.now() + 待つ秒 * 1000;
  for (;;) {
    const p = 会員のプレイヤー(会員ID);
    if (p?.スマレジID) return p.スマレジID;
    if (Date.now() > 期限) return "";
    await new Promise((r) => setTimeout(r, 5_000));
  }
}

defineSeed("S-F06-05-BASIC", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const 会員ID = await 本会員を作る(browser, { 姓: 基本会員の姓, 名: "マイページ", セイ: "ケツゴウシケン", メイ: "マイページ", 前半: "f0605", パスワード: 基本会員.パスワード });
  const スマレジID = await スマレジの会員番号を待つ(会員ID, 120);
  if (!スマレジID) throw new Error(`会員ID ${会員ID} に、本登録のあと120秒待ってもスマレジ側の会員番号が振られない（スマレジ連携の状態。事前準備の会員番号を控えられない）`);
  const p = 会員のプレイヤー(会員ID);
  if (!p) throw new Error(`会員ID ${会員ID} のプレイヤーが1件に定まらない`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const v of [{ 増減量: 100, 発行日: "2026-03-31" }, { 増減量: 150, 発行日: "2026-03-31" }, { 増減量: 300, 発行日: "2026-05-01" }]) {
      await 発行日を指定してポイントを付与する(page, 会員ID, { ...v, 備考: "キャンペーン" });
    }
  });
  const 履歴 = 会員のポイント履歴(会員ID);
  if (履歴.length !== 3) throw new Error(`会員ID ${会員ID} のポイント履歴が ${履歴.length} 件（付与した3件だけのはず）`);
  保有ポイントを書く(id, p.プレイヤーID, 500);
  if (会員のプレイヤー(会員ID)?.保有ポイント !== 500) throw new Error(`会員ID ${会員ID} の保有ポイントが500にならない`);
  reportSeedIssue(id, "保有ポイント500は画面で指定できないので、付与した3件（合計550）のあと、作った会員のプレイヤーの行へ DB で書いた。プレイヤーID・スマレジ側の会員番号は DB の参照で控えた（プレイヤー検索の画面の代わり）");
  控える(notes, id, "〔会員ID-F0605-共有-BASIC〕", 会員ID);
  控える(notes, id, "〔プレイヤーID-F0605-共有-BASIC〕", p.プレイヤーID);
  控える(notes, id, "〔スマレジ側会員番号-F0605-共有-BASIC〕", スマレジID);
  for (const [i, k] of ["A", "B", "C"].entries()) 控える(notes, id, `〔ポイント履歴ID-F0605-共有-BASIC-${k}〕`, 履歴[i].ID);
  Object.assign(基本会員の控え, { 会員ID, プレイヤーID: p.プレイヤーID, スマレジID });
});
