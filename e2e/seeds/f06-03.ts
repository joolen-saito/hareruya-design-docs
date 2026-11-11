/**
 * F06-03 ログインの画面シード。正本: cases/F06-03_seed_data.tsv
 *
 * - 会員（AUTH・POLICY）: フロント本店の新規会員登録画面で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧で会員IDを控える。
 *   メールアドレスの前半には実行の印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。パスワードには付けない。
 * - ログイン状態の保持（REMEMBER。共有の設定）: 書き換える前の値を控え、ケースが終わるたびに戻す。ケースの事前準備が定める有効／無効は、ケースの最初に設定する。
 * - 環境（ENV）: 作り方は無い（最初の手順の画面が確かめる）。
 * 正本の外で補ったこと（記録にも書く）: シード表は、登録直後のログイン試行回数制限状態が無いことを「試験開始までログインに失敗しない」ことで成り立たせると定めるので、そのとおりにした（消去はしない）。
 */
import { Browser, Cookie } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { ログイン状態の保持が有効か } from "../db/f06_03";
import * as prep from "../db/f06_03_prep";
import * as prep04 from "../db/f06_04_prep";
import { available } from "../lib/db";
import { rc } from "../lib/run_marker";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { readRememberMe, setRememberMe } from "../pages/admin/f06_masters";
import { resultCustomerId, searchCustomer } from "../pages/admin/f06_customer";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { M08CustomerListPage } from "../pages/admin/m08_customer_list";
import { LoginPage } from "../pages/front/f06_03_login";
import { registerFrontMember } from "../pages/front/member_entry";
import { classOf as 商品規格, createProducts } from "./f03-07";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;
export const PW = "ValidPass!603";

export async function 会員を作る(browser: Browser, notes: { set: (k: string, v: string) => void }, 前半: string, パスワード: string, 会員IDの呼び名: string, 姓 = "試験", 名 = "ログイン"): Promise<string> {
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
  return id;
}

defineSeed("S-F06-03-ENV", async () => { /* 環境。最初の手順の画面が確かめる */ });

for (const k of ["005", "006", "008", "013", "014", "016", "017", "019", "042", "046", "047", "048", "049"]) {
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

// ---------------------------------------------------------------------------
// 以下は 2026-11-10 の方針（画面で作れない部分は、実行の印つきのデータに限りDBへ書く）で足したシード
// ---------------------------------------------------------------------------
const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);

// ---- 商品（005・006）: 商品コード F0603-NOTIFY（在庫なし）・F0603-FAVORITE ----
export function 商品の場所(正本の商品コード: "F0603-NOTIFY" | "F0603-FAVORITE"): { productId: string; classId: string } { return 商品規格(正本の商品コード); }

// ---- 送信元IP（027〜030・054） ----
defineSeed("S-F06-03-IP", async () => {
  記す("送信元IPアドレスを固定する試験用のリバースプロキシが無いので、IPアドレスの指定（192.0.2.10 など）は、実行機の送信元IPアドレスのままに読み替えた（IPアドレスごとの区別を確かめるケースは実装していない）");
});
defineSeed("S-F06-03-NOMEMBER-054", async () => { /* 会員を作らない。実行の印つきの存在しないメールアドレスを使う */ });

// ---- ログイン試行回数の制限 ----
defineSeed("S-F06-03-THROTTLE-027", async ({ browser, notes }) => { await 会員を作る(browser, notes, "f0603-throttle-a-027", "ThrottleA!603", "〔会員ID-F0603-027〕"); });
defineSeed("S-F06-03-THROTTLE-028", async ({ browser, notes }) => { await 会員を作る(browser, notes, "f0603-throttle-a-028", "ThrottleA!603", "〔会員ID-F0603-028〕"); });
defineSeed("S-F06-03-THROTTLE-030", async ({ browser, notes }) => {
  await 会員を作る(browser, notes, "f0603-throttle-a-030", "ThrottleA!603", "〔会員ID-F0603-030A〕");
  await 会員を作る(browser, notes, "f0603-throttle-b-030", "ThrottleB!603", "〔会員ID-F0603-030B〕");
});

// ---- 仮会員・退会済み・削除済み（015） ----
defineSeed("S-F06-03-STATUS-015", async ({ browser, notes }) => {
  const 仮 = await 会員を作る(browser, notes, "f0603-temp-015", "TempPass!603", "〔会員ID-F0603-015A〕");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ed = new M08CustomerEditPage(page);
    if ((await ed.open(仮)) !== 200) throw new Error(`会員 ${仮} の会員登録/編集画面を開けない`);
    await ed.選ぶ("status", "仮会員");
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${仮} を仮会員にする保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
  });
  記す("仮会員機能（共有の設定）を書き換えず、本会員として登録したあと、管理画面の会員登録/編集で会員ステータスを仮会員にして作った（本登録のメールのURLを開かない状態と同じ）");

  await 会員を作る(browser, notes, "f0603-withdrawn-015", "Withdrawn!603", "〔会員ID-F0603-015B〕");
  prep04.退会済みにする(mailOf("f0603-withdrawn-015"));
  記す("DBで退会済み会員のステータスを退会、削除フラグを有効に設定した（メールアドレスを保ったままの退会は画面で指定できないため）");

  const 削除 = await 会員を作る(browser, notes, "f0603-deleted-015", "DeletedPass!603", "〔会員ID-F0603-015C〕");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const list = new M08CustomerListPage(page);
    await list.open();
    await list.searchMulti(mailOf("f0603-deleted-015"));
    await list.削除リンクを押す(削除);
    await list.確認モーダルで削除する(削除);
  });
  記す("削除済み会員は、管理画面の会員一覧の削除で作った");
});

// ---- パスワードのポリシーに合わない会員（034〜039） ----
const 十一文字 = "Aa1!abcdefg";
const 五十一文字 = "Aa1!" + "x".repeat(47);
const 全角入り = "Ａa1!abcdefgh";
const 規則外 = "画面の入力規則（12文字以上・50文字以下・半角）に合わないパスワードは画面で指定できないので、本会員を画面で作ったあと、DBで保存パスワードをその値に設定した（実行の印つきの会員だけ）";
function ポリシー違反(seedId: string, 前半: string, パスワード: string, 呼び名: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    await 会員を作る(browser, notes, 前半, "TempValid!603", 呼び名);
    prep.パスワードを設定する(mailOf(前半), パスワード);
    記す(規則外);
  });
}
ポリシー違反("S-F06-03-POLICY-11-034", "f0603-policy11-034", 十一文字, "〔会員ID-F0603-034〕");
ポリシー違反("S-F06-03-POLICY-51-035", "f0603-policy51-035", 五十一文字, "〔会員ID-F0603-035〕");
ポリシー違反("S-F06-03-POLICY-FULLWIDTH-036", "f0603-policy-full-036", 全角入り, "〔会員ID-F0603-036〕");
ポリシー違反("S-F06-03-POLICY-11-038", "f0603-policy11-038", 十一文字, "〔会員ID-F0603-038〕");
ポリシー違反("S-F06-03-POLICY-11-039", "f0603-policy11-039", 十一文字, "〔会員ID-F0603-039〕");
export const 十一文字のパスワード = 十一文字;
export const 五十一文字のパスワード = 五十一文字;
export const 全角入りのパスワード = 全角入り;
defineSeed("S-F06-03-POLICY-EQ-EMAIL-037", async ({ browser, notes }) => {
  const 最終 = mailOf("f0603-policy-eq-037");
  const id = await 会員を作る(browser, notes, "f0603-policy-eq-037-pre", 最終, "〔会員ID-F0603-037〕");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ed = new M08CustomerEditPage(page);
    if ((await ed.open(id)) !== 200) throw new Error(`会員 ${id} の会員登録/編集画面を開けない`);
    await ed.set("email", 最終);
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${id} のメールアドレス変更が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
  });
  記す("メールアドレスと同じパスワードは登録で拒まれるので、別のメールアドレスで登録し（パスワードは最終のメールアドレスと同じ文字列）、管理画面の会員編集でメールアドレスだけをその文字列に替えて作った（DBは使わない）");
});

// ---- ログイン状態の保持が有効な店舗で、保持のCookieだけを持つブラウザ（043〜045） ----
/** 保持の設定（共有の設定）は書き換えない。いまの値を読み、有効でなければ止める */
export async function 保持が有効であること(browser: Browser): Promise<void> {
  const 値 = await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); return readRememberMe(page); });
  if (!値) throw new Error("本店のログイン状態の保持（共有の設定）が無効なので止めた。このケースの前提は有効（共有の設定は書き換えない）");
}
const 保持のCookie = new Map<string, Cookie[]>();
/** 保持のCookieだけを持つブラウザのCookie（ブラウザを終了すると消える Cookie は除いたもの） */
export function 保持状態のCookie(番号: string): Cookie[] {
  const c = 保持のCookie.get(番号);
  if (!c) throw new Error(`保持状態のブラウザ（${番号}）をまだ作っていない`);
  return c;
}
for (const n of ["043", "044", "045"]) {
  defineSeed(`S-F06-03-REMEMBERED-${n}`, async ({ browser, notes }) => {
    await 保持が有効であること(browser);
    await 会員を作る(browser, notes, `f0603-base-${n}`, PW, `〔会員ID-F0603-${n}〕`);
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const l = new LoginPage(await context.newPage());
      await l.ログイン画面を開く();
      await l.ログインする(mailOf(`f0603-base-${n}`), PW);
      const 残る = (await context.cookies()).filter((c) => c.expires > 0);
      if (!残る.some((c) => /REMEMBERME/i.test(c.name))) throw new Error(`会員 ${mailOf(`f0603-base-${n}`)} でログインしても、ログイン状態を保持するCookieが発行されない`);
      保持のCookie.set(n, 残る);
    } finally { await context.close(); }
    記す("ブラウザの終了・再起動は、ログイン後のCookieのうち、ブラウザを終了しても残るもの（有効期限のあるもの）だけを取り出し、ケースの新しいブラウザへ入れて再現した（ログインの時点のセッションは含まない）");
  });
}
