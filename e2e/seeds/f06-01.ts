/**
 * F06-01 会員登録の画面シード。正本: cases/F06-01_seed_data.tsv
 *
 * - 入力値のシード（JP-INPUT・OVERSEAS-INPUT など「試験実行時にブラウザから入力する」もの）は、値をテストコード側（spec の入力値）で持つ。作り方は無い。
 * - 環境のシード（ENV など「試験環境の初期データ」）は、画面が開けるかを確かめるだけ（ケースの最初の手順が確かめる）。作り方は無い。
 * - 職業・ブラックリスト・管理者・仮会員機能は管理画面から作る（あれば使う）。
 * - 「DB用テストフィクスチャで対象メールアドレスの会員と関連データを削除し、各0件を確認する」シード（RESET・TARGET・REG・L-REG・PC-INPUT・CB…）は、
 *   DBへの書き込みをしない決まりのため実装しない代わりに、メールアドレスの前半に実行ごとの印を付けた新しいメールアドレスを使い、
 *   開始時に会員・住所・選手が各0件であることをDBの参照で確かめる（正本の外の補い。ケースの注記と判定の区分「条件付き」で残す）。
 *
 * 決め打ちの識別の値（メールアドレスの前半）には、実行ごとの印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。パスワードには付けない。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 仮会員機能が有効か, 関連データの件数 } from "../db/f06_01";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { available } from "../lib/db";
import { withAdminSession } from "../lib/session";
import { ensureBlacklist, ensureJob, ensureMemberAdmin, readTempMember, removeBlacklist, setTempMember } from "../pages/admin/f06_masters";

/** メールアドレス（前半に実行の印を付ける） */
export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

export const L_ADMIN = { loginId: "f0601l_admin", password: "Passw0rd!L0601" };
export const PC_ADMIN = { loginId: "f0601pc-admin", password: "Passw0rd-PC0601" };

// ---- 共有の設定: 仮会員機能（店舗基本設定。共有の開発環境で1件だけの設定。書き換える前の値を控え、ケースが終わるたびに戻す） ----
let 前の仮会員機能: boolean | null = null;

async function 仮会員機能を有効にする(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (前の仮会員機能 === null) 前の仮会員機能 = await readTempMember(page);
    await setTempMember(page, true);
  });
}
/** 控えた値へ戻し、戻った値をDBで確かめた結果を返す（戻せなかったときは文を返す。書き換えていなければ空） */
export async function 仮会員機能を戻す(browser: Browser): Promise<string> {
  if (前の仮会員機能 === null) return "";
  const 値 = 前の仮会員機能;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await setTempMember(page, 値);
  });
  if (!available) return "";
  const now = 仮会員機能が有効か();
  return now === 値 ? "" : `仮会員機能を ${値 ? "有効" : "無効"} に戻したが、DBの値は ${now ? "有効" : "無効"}`;
}
for (const id of ["S-F06-01-TEMP-ON", "S-F06-01-L-TEMP-ON", "S-F06-01-PC-TEMP-ON"]) defineSeed(id, async ({ browser }) => { await 仮会員機能を有効にする(browser); });

// ---- 環境・入力値（作り方は無い。値は spec が持つ） ----
for (const id of [
  "S-F06-01-ENV", "S-F06-01-L-ENV", "S-F06-01-PC-ENV",
  "S-F06-01-JP-INPUT", "S-F06-01-OVERSEAS-INPUT", "S-F06-01-MAX-OK", "S-F06-01-VIEW-057", "S-F06-01-VIEW-058",
  "S-F06-01-JP-INPUT-036", "S-F06-01-OVERSEAS-INPUT-037", "S-F06-01-JP-INPUT-038", "S-F06-01-JP-INPUT-039", "S-F06-01-OVERSEAS-INPUT-040",
  "S-F06-01-OVERSEAS-INPUT-041", "S-F06-01-JP-INPUT-042", "S-F06-01-JP-INPUT-046", "S-F06-01-JP-INPUT-047", "S-F06-01-JP-INPUT-048", "S-F06-01-JP-INPUT-049",
  "S-F06-01-CBINPUT-068", "S-F06-01-PC-INPUT-067",
]) defineSeed(id, async () => { /* 入力値はテストが各入力欄へ入力する。環境は最初の手順の画面が確かめる */ });

// ---- 職業・管理者・ブラックリスト（管理画面から作る） ----
defineSeed("S-F06-01-OCCUPATIONS", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureJob(page, "会社員");
    await ensureJob(page, "学生");
  });
});
defineSeed("S-F06-01-L-OCC", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ensureJob(page, "会社員"); });
});
defineSeed("S-F06-01-L-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberAdmin(page, "F06-01連携試験管理者", L_ADMIN.loginId, L_ADMIN.password));
});
defineSeed("S-F06-01-PC-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberAdmin(page, "F06-01会員登録の管理者", PC_ADMIN.loginId, PC_ADMIN.password));
});
defineSeed("S-F06-01-BLACK-NAME", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ensureBlacklist(page, "氏名", "拒否太郎"); });
});
defineSeed("S-F06-01-BLACK-ADDRESS", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ensureBlacklist(page, "住所", "東京都千代田区千代田9-9"); });
});
defineSeed("S-F06-01-BLACK-PHONE", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ensureBlacklist(page, "電話番号", "0399999999"); });
});

// ---- 開始時に会員・住所・選手が0件の対象（印を付けた新しいメールアドレスで成り立たせ、DBの参照で確かめる） ----
function 対象(seedId: string, 前半s: string[], 先に?: (browser: Browser, seedId: string) => Promise<void>): void {
  defineSeed(seedId, async ({ browser }) => {
    if (先に) await 先に(browser, seedId);
    if (!available) { reportSeedIssue(seedId, "この環境はDB確認ができないため、開始時に会員・住所・選手が0件であることを確かめていない"); return; }
    for (const 前半 of 前半s) {
      const n = 関連データの件数(mailOf(前半));
      if (n.会員 + n.住所 + n.選手 !== 0) throw new Error(`メールアドレス ${mailOf(前半)} の会員が開始時に残っている（会員 ${n.会員}・住所 ${n.住所}・選手 ${n.選手}）`);
    }
  });
}
対象("S-F06-01-RESET", ["it-f0601-jp", "black-all"]);
for (const [k, 前半s] of Object.entries({
  "013": ["it-f0601-max"], "036": ["it-f0601-jp-036"], "037": ["it-f0601-us-037"], "038": ["it-f0601-jp-038"], "039": ["it-f0601-jp-039"],
  "040": ["it-f0601-us-040"], "041": ["it-f0601-us-041"], "042": ["it-f0601-jp-042"], "046": ["it-f0601-jp-046"], "047": ["it-f0601-jp-047"],
  "048": ["it-f0601-jp-048"], "049": ["it-f0601-jp-049"],
})) 対象(`S-F06-01-TARGET-${k}`, 前半s);
対象("S-F06-01-CBTARGET-068", ["it-f0601-cb-068"]);
for (const [k, 前半] of Object.entries({ "059": "f0601-059-reg", "061": "f0601-061-reg", "062": "f0601-062-reg", "063": "f0601-063-reg", "064": "f0601-064-reg" })) 対象(`S-F06-01-REG-${k}`, [前半]);

// 連携（管理画面で会員を探す）の登録入力: ブラックリストの行（氏名・住所・電話番号）が無いことを管理画面で確かめ、あれば消す（正本のとおり）
for (const [k, 前半] of Object.entries({ "053": "it-f0601-l-001", "054": "it-f0601-l-002", "055": "it-f0601-l-003", "056": "it-f0601-l-004" })) {
  対象(`S-F06-01-L-REG-${k}`, [前半], async (browser) => {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await removeBlacklist(page, "氏名", "晴太郎");
      await removeBlacklist(page, "住所", "東京都千代田区千代田1-1");
      await removeBlacklist(page, "電話番号", "0312345678");
    });
  });
}
