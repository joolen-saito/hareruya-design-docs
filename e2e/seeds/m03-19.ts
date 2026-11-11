/**
 * M03-19 部門CSV出力の画面シード。正本: cases/M03-19_seed_data.tsv
 *
 * シードでの解釈（正本の外の補い。記録 review/M03-19_progress_2026-11-11_dev.md にも書く）:
 * - 部門のマスタは全員が使う（商品規格・店頭買取が参照し、登録・更新・削除のたびにスマレジへ連携される）ので、行を足さず、書き換えない。
 *   ケースの部門（〔部門ID-M0319-003A〕など3件）は、開発環境に既にある部門から、免税区分が1・2・0のものを1件ずつ（無ければ先頭から）選んで読み替えた。
 *   期待結果の値（M0319-003一般部門／M0319-C030-003／1／1 など）は、その部門の DB の値で読み替える。
 * - CSV出力の文字コード・区切り文字（S-M03-19-FORMAT-DEFAULT）は、アプリの設定ファイルの値（UTF-8・カンマ）で、画面から変えられない（M03-04 の記録と同じ）。
 *   UTF-8・カンマを前提とするケースは、そのまま流す。
 */
import { 部門の一覧, 部門の値 } from "../db/m03_19";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account } from "../lib/session";
import { ensureM05Admin } from "../pages/admin/m05_admin_member";

/** 開発環境に手動テスト用の同じログインIDのメンバーがあることがある（M03-26・M03-27 で起きた）ので、実行の印つきで作る */
export const M0319_ADMIN: Account = { loginId: rcFixed("m0319_admin").toLowerCase(), password: "Passw0rd!M0319" };

defineSeed("S-M03-19-ADM", async ({ browser, seed }) => {
  await ensureM05Admin(browser, { 名前: rcFixed("M03-19試験管理者"), account: M0319_ADMIN, メール: `${M0319_ADMIN.loginId}@example.test` });
  reportSeedIssue(seed.シードID, "商品管理を操作できる「システム管理者」で作った（所属店舗は本店）。ログインID・名前に実行の印を付けた（開発環境に同じログインIDのメンバーがありうるため）");
});

defineSeed("S-M03-19-FORMAT-DEFAULT", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "CSV出力の文字コード・区切り文字はアプリの設定ファイルの値（UTF-8・カンマ）で、画面から変えられない。設定の操作はしていない（そのままの値で流す）");
});

/** ケースの部門として読み替える、既にある部門3件（免税区分 1・2・0 の順に1件ずつ） */
export function 読み替える部門(): 部門の値[] {
  const all = 部門の一覧();
  if (all.length < 3) throw new Error(`開発環境の部門が ${all.length} 件しかない（3件要る。部門のマスタは共有なので足さない）`);
  const picked: 部門の値[] = [];
  for (const tf of ["1", "2", "0"]) {
    const x = all.find((d) => d.免税区分 === tf && !picked.includes(d));
    if (x) picked.push(x);
  }
  for (const d of all) { if (picked.length >= 3) break; if (!picked.includes(d)) picked.push(d); }
  return picked.slice(0, 3);
}

for (const 番号 of ["003", "007", "008", "010"]) {
  const seedId = `S-M03-19-BASE-${番号}`;
  defineSeed(seedId, async ({ notes }) => {
    const ds = 読み替える部門();
    ds.forEach((d, i) => notes.set(`〔部門ID-M0319-${番号}${"ABC"[i]}〕`, d.ID));
    reportSeedIssue(seedId, `部門は作らず、開発環境に既にある部門で読み替えた: ${ds.map((d, i) => `${"ABC"[i]}＝ID ${d.ID}（${d.部門名}／${d.部門コード}／${d.免税区分}／${d.MTGBuyer表示フラグ}）`).join("・")}`
      + (番号 === "010" ? "。部門のマスタに更新日時の列が無いので、更新日時（2026-09-29 00:00:00）は用意できない" : ""));
  });
}
