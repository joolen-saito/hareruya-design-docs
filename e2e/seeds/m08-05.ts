/**
 * M08-05 ポイント付与のシード。流せる見込みのケース（実施不可でないもの＋仕分け直し recheck2）。正本: cases/M08-05_seed_data.tsv
 *
 * 型: 会員はフロントの新規会員登録（seeds/m08-05-07-common.ts の 会員を作る。メールの前半に実行の印）→ 管理画面の会員一覧で会員IDを控える →
 * ポイント履歴は管理画面のポイント付与（キャンペーン、特別対応／返金）の画面で付与する。画面で作れない状態（ポイント残高・設定日・選手情報なし）だけ、
 * E2E の会員の行に DB で書く（db/m08_05_07.ts・lib/db_write.ts）。選手情報IDは画面に出ないので DB の参照で控える。
 *
 * シードでの解釈（正本の外の補い。記録 review/M08-05_progress_2026-11-11_dev.md にも書く）:
 * - 会員のメールアドレスは、シード表の例の @ の前に実行の印を付けた（前の実行の会員と重ならないように）。
 * - S-M08-05-ADM: 試験管理者のログインID・名前に実行の印を付けた（権限はシステム管理者）。
 * - ポイント付与の画面で保存すると、会員にスマレジの会員番号があるときだけスマレジ連携のジョブが積まれる（アプリの作り）。新しく作る試験会員では番号が空のことが多い。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { ポイント履歴, ポイント履歴の設定日を設定する, ポイント残高, ポイント残高を設定する, 会員があるか, 選手情報ID, 選手情報を消す } from "../db/m08_05_07";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { PointPage } from "../pages/admin/m08_05_07";
import { 会員が1点注文する, 会員を作る, 作った会員, 控える, 試験管理者を用意する } from "./m08-05-07-common";

export const M0805_ADMIN: Account = { loginId: rc("m0805_admin").toLowerCase(), password: "Passw0rd!M0805" };

defineSeed("S-M08-05-ADM", async ({ browser }) => { await 試験管理者を用意する(browser, rc("M08-05試験管理者"), M0805_ADMIN); });

const 会員の定め = (n: string) => ({ 前半: `m0805-${n}`, 姓: "結合", 名: "花子", セイ: "ケツゴウ", メイ: "ハナコ", パスワード: `Passw0rd!M0805-${n}` });

/** 会員を作り、会員ID・選手情報IDを控える */
async function 会員を作って控える(browser: Browser, notes: Notes, seedId: string, n: string): Promise<作った会員> {
  const m = await 会員を作る(browser, 会員の定め(n));
  控える(notes, seedId, `〔会員ID-M0805-${n}〕`, m.会員ID);
  const pid = 選手情報ID(m.会員ID);
  if (!pid) throw new Error(`${seedId}: 会員ID ${m.会員ID} の選手情報が DB に無い（会員登録で作られるはず）`);
  控える(notes, seedId, `〔選手情報ID-M0805-${n}〕`, pid);
  return m;
}
function 残高をそろえる(seedId: string, 会員ID: string, 値: number): void {
  if (ポイント残高(会員ID) !== 値) ポイント残高を設定する(`${seedId}: 会員ID ${会員ID} のポイント残高を ${値} にする`, 会員ID, 値);
}
function 履歴が無いこと(seedId: string, 会員ID: string): void {
  const h = ポイント履歴(会員ID);
  if (h.length) throw new Error(`${seedId}: 会員ID ${会員ID} のポイント履歴が ${h.length} 件ある（0件のはず）`);
}

for (const n of ["001", "002", "003", "004", "005", "006", "007", "008", "009", "011", "012", "041", "042"]) {
  defineSeed(`S-M08-05-BASE-${n}`, async ({ browser, notes, seed }) => {
    const m = await 会員を作って控える(browser, notes, seed.シードID, n);
    残高をそろえる(seed.シードID, m.会員ID, 1000);
    履歴が無いこと(seed.シードID, m.会員ID);
    if ((n === "011" || n === "012") && 会員があるか("99999999")) throw new Error(`${seed.シードID}: 会員ID 99999999 の会員がある（ほかの方のデータなので消さずに止める）`);
    reportSeedIssue(seed.シードID, "ポイント残高1000は画面で指定できないので、E2E の会員の選手情報に DB で書いた（正本の作り方どおり）。会員のメールアドレスの前半に実行の印を付けた");
  });
}

defineSeed("S-M08-05-NOPLAYER-013", async ({ browser, notes, seed }) => {
  const m = await 会員を作る(browser, 会員の定め("013"));
  控える(notes, seed.シードID, "〔会員ID-M0805-013〕", m.会員ID);
  選手情報を消す(`${seed.シードID}: 会員ID ${m.会員ID} の選手情報を消す`, m.会員ID);
  if (選手情報ID(m.会員ID)) throw new Error(`${seed.シードID}: 選手情報を消したが残っている`);
  履歴が無いこと(seed.シードID, m.会員ID);
  reportSeedIssue(seed.シードID, "選手情報なしは画面で作れないので、E2E の会員の選手情報を DB で消した（正本の作り方どおり）");
});

/** ポイント付与の画面（キャンペーン＝granted・返金＝purchase）で付与し、足された履歴のIDを返す */
async function 画面で付与する(browser: Browser, 会員ID: string, 画面: "granted" | "purchase", v: { 注文番号?: string; 増減量: number; 備考: string; 発行日: string }, what: string): Promise<string> {
  const before = new Set(ポイント履歴(会員ID).map((h) => h.履歴ID));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new PointPage(page);
    const res = await p.開く(会員ID, 画面);
    if (res?.status() !== 200) throw new Error(`${what}: ポイント付与の画面の応答が ${res?.status()}`);
    await p.付与する(v, what);
  });
  const added = ポイント履歴(会員ID).filter((h) => !before.has(h.履歴ID));
  if (added.length !== 1) throw new Error(`${what}: 足されたポイント履歴が ${added.length} 件（1件のはず）`);
  return added[0].履歴ID;
}

defineSeed("S-M08-05-HISTORY-010", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const m = await 会員を作って控える(browser, notes, id, "010");
  const start = ポイント残高(m.会員ID);
  if (start !== 0) 残高をそろえる(id, m.会員ID, 0);
  履歴が無いこと(id, m.会員ID);
  const a = await 画面で付与する(browser, m.会員ID, "granted", { 増減量: 100, 備考: "キャンペーン", 発行日: "2026-09-01" }, `${id}: 1件目の付与`);
  控える(notes, id, "〔履歴ID-M0805-010A〕", a);
  const b = await 画面で付与する(browser, m.会員ID, "purchase", { 増減量: 200, 備考: "余剰入金へのご返金", 発行日: "2026-09-02" }, `${id}: 2件目の付与`);
  控える(notes, id, "〔履歴ID-M0805-010B〕", b);
  const c = await 画面で付与する(browser, m.会員ID, "granted", { 増減量: 700, 備考: "特別対応", 発行日: "2026-09-03" }, `${id}: 3件目の付与`);
  控える(notes, id, "〔履歴ID-M0805-010C〕", c);
  const end = ポイント残高(m.会員ID);
  if (end !== 1000) throw new Error(`${id}: 3件の付与のあとのポイント残高が ${end}（1000のはず）`);
  if (start !== 0) reportSeedIssue(id, `登録直後のポイント残高が ${start} だったので、付与の前に DB で0にした（正本は登録直後0から始める）`);
});

/** 044・045: 会員の受注を1件作り、その注文番号でポイントを付与して、設定日と残高を DB でそろえる */
async function 表示値の会員(browser: Browser, notes: Notes, seedId: string, n: string, 画面: "granted" | "purchase",
  v: { 増減量: number; 備考: string; 発行日: string; 設定日: string; 残高: number }): Promise<void> {
  const m = await 会員を作って控える(browser, notes, seedId, n);
  const o = await 会員が1点注文する(browser, seedId, m);
  控える(notes, seedId, `〔注文番号-M0805-${n}〕`, o.注文番号);
  控える(notes, seedId, `〔受注ID-M0805-${n}〕`, o.受注ID);
  const h = await 画面で付与する(browser, m.会員ID, 画面, { 注文番号: o.注文番号, 増減量: v.増減量, 備考: v.備考, 発行日: v.発行日 }, `${seedId}: 付与`);
  控える(notes, seedId, `〔履歴ID-M0805-${n}〕`, h);
  ポイント履歴の設定日を設定する(`${seedId}: 履歴ID ${h} の設定日を ${v.設定日} にする`, h, v.設定日);
  残高をそろえる(seedId, m.会員ID, v.残高);
  const all = ポイント履歴(m.会員ID);
  if (all.length !== 1) throw new Error(`${seedId}: ポイント履歴が ${all.length} 件（1件のはず）`);
  reportSeedIssue(seedId, `設定日（${v.設定日}）とポイント残高（${v.残高}）は画面で指定できないので、E2E の会員の行に DB で書いた（正本の作り方どおり）`);
}
defineSeed("S-M08-05-LABELS-044", async ({ browser, notes, seed }) => {
  await 表示値の会員(browser, notes, seed.シードID, "044", "granted", { 増減量: 150, 備考: "特別対応", 発行日: "2026-09-01", 設定日: "2026-09-05", 残高: 730 });
});
defineSeed("S-M08-05-LABELS-045", async ({ browser, notes, seed }) => {
  await 表示値の会員(browser, notes, seed.シードID, "045", "purchase", { 増減量: -80, 備考: "注文金額変更によるご返金", 発行日: "2026-08-10", 設定日: "2026-08-12", 残高: 940 });
});
