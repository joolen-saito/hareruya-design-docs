/**
 * F06-03 ログインの画面シード。正本: cases/F06-03_seed_data.tsv
 *
 * - 会員（AUTH・POLICY）: フロント本店の新規会員登録画面で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧で会員IDを控える。
 *   メールアドレスの前半には実行の印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。パスワードには付けない。
 * - ログイン状態の保持（REMEMBER。共有の設定）: 書き換える前の値を控え、ケースが終わるたびに戻す。ケースの事前準備が定める有効／無効は、ケースの最初に設定する。
 * - 環境（ENV）: 作り方は無い（最初の手順の画面が確かめる）。
 * 正本の外で補ったこと（記録にも書く）: シード表は、登録直後のログイン試行回数制限状態が無いことを「試験開始までログインに失敗しない」ことで成り立たせると定めるので、そのとおりにした（消去はしない）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { ログイン状態の保持が有効か } from "../db/f06_03";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { readRememberMe, setRememberMe } from "../pages/admin/f06_masters";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { registerFrontMember } from "../pages/front/member_entry";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;
export const PW = "ValidPass!603";

async function 会員を作る(browser: Browser, notes: { set: (k: string, v: string) => void }, 前半: string, パスワード: string, 会員IDの呼び名: string, 姓 = "試験", 名 = "ログイン"): Promise<void> {
  const メール = mailOf(前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓, 名, セイ: "シケン", メイ: "ログイン", メール, パスワード });
  } finally { await context.close(); }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, メール);
    return resultCustomerId(page, メール);
  });
  if (!id) throw new Error(`登録した会員 ${メール} を会員一覧で探せない`);
  notes.set(会員IDの呼び名, id);
}

defineSeed("S-F06-03-ENV", async () => { /* 環境。最初の手順の画面が確かめる */ });

for (const k of ["008", "013", "014", "016", "017", "019", "042", "046", "047", "048", "049"]) {
  defineSeed(`S-F06-03-AUTH-${k}`, async ({ browser, notes }) => { await 会員を作る(browser, notes, `f0603-base-${k}`, PW, `〔会員ID-F0603-${k}〕`); });
}
defineSeed("S-F06-03-POLICY-12-032", async ({ browser, notes }) => { await 会員を作る(browser, notes, "f0603-policy12-032", "Aa1!abcdefgh", "〔会員ID-F0603-032〕"); });
defineSeed("S-F06-03-POLICY-50-033", async ({ browser, notes }) => { await 会員を作る(browser, notes, "f0603-policy50-033", "Aa1!" + "x".repeat(46), "〔会員ID-F0603-033〕"); });

// ---- 共有の設定: ログイン状態の保持 ----
let 前の保持: boolean | null = null;
defineSeed("S-F06-03-REMEMBER", async ({ browser }) => {
  if (前の保持 !== null) return;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); 前の保持 = await readRememberMe(page); });
});
/** 事前準備が定める有効／無効にする（元の値は REMEMBER シードが控えている） */
export async function 保持を設定する(browser: Browser, 有効: boolean): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await setRememberMe(page, 有効); });
}
/** 控えた値へ戻し、戻った値をDBで確かめた結果を返す（戻せなかったときは文を返す） */
export async function 保持を戻す(browser: Browser): Promise<string> {
  if (前の保持 === null) return "";
  const 値 = 前の保持;
  await 保持を設定する(browser, 値);
  if (!available) return "";
  const now = ログイン状態の保持が有効か();
  return now === 値 ? "" : `ログイン状態の保持を ${値 ? "有効" : "無効"} に戻したが、DBの値は ${now ? "有効" : "無効"}`;
}
