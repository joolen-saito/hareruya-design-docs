/**
 * 会員を本会員にする、メールを使わない作り方（管理画面の会員一覧 → 会員登録/編集で会員ステータスを本会員にして保存）。
 *
 * - 手元の環境（メールの受け口がある）では、フロントの会員登録の部品は本登録のメールのURLを開いて本会員にする（これまでどおり）。
 * - 共有の開発環境のようにメールを読めない環境では、その部品が仮会員になった会員を、ここの作り方で本会員にする。
 *   そのときは、いま作っているシードの注記に「本登録のメールを読めない環境なので、管理画面で本会員にした（条件付き）」を残す。
 * - F02-02 のシードは、シード表の投入方法のとおり、環境によらずここの作り方で本会員にする（会員を登録して本会員にする）。
 */
import { Browser, BrowserContext, Page } from "@playwright/test";
import { BASE_URL, MAIL_URL, SETUP_ADMIN } from "../../config/env";
import { reportCurrentSeedIssue } from "../../seeds/current_seed";
import { hideDebugToolbar, withAdminSession } from "../../lib/session";
import { EntryPage } from "../front/f06_01_entry";
import { openEditFromResult, resultCustomerId, searchCustomer } from "./f06_customer";
import { M08CustomerEditPage } from "./m08_customer_edit";

type Issue = (m: string) => void;

/** 本登録のメールを読めるか（手元のメールの受け口が与えられているか） */
export function 本登録のメールを読める(): boolean {
  return !!MAIL_URL;
}

/** 切り替えたときにシードの注記に残す文 */
export const 管理画面で本会員にした注記 = "本登録のメールを読めない環境なので、管理画面で本会員にした（条件付き）";

/**
 * 管理画面の会員一覧でメールアドレスを検索して会員IDを読み、会員登録/編集で会員ステータスを本会員にして「会員情報を登録」を押す。
 * 会員IDと、保存の前の会員ステータスを返す。
 */
export async function 管理画面で本会員にする(browser: Browser, メール: string): Promise<{ 会員ID: string; 前の状態: string }> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 共有の開発環境では、フロントで登録した直後の会員が会員一覧の検索にすぐ出ないことがある（2026-11-10 の開発環境の実行）。
    // 見つからないときは間をおいて検索し直す（最大で約1分）
    let id: string | null = null;
    for (let i = 0; ; i++) {
      await searchCustomer(page, メール);
      id = await resultCustomerId(page, メール);
      if (id || i >= 5) break;
      await page.waitForTimeout(10_000);
    }
    if (!id) throw new Error(`会員 ${メール} が管理画面の会員一覧で1件に定まらない（約1分おいて検索し直しても同じ）`);
    await openEditFromResult(page, メール);
    const ed = new M08CustomerEditPage(page);
    const before = await ed.選択中("status");
    await ed.選ぶ("status", "本会員");
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${メール} を本会員にする保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
    return { 会員ID: id, 前の状態: before };
  });
}

/**
 * フロントの会員登録の部品が、仮会員になった会員を本登録のメールの代わりに管理画面で本会員にする（メールを読めない環境だけ）。
 * いま作っているシードの注記に残す。
 */
export async function メールの代わりに管理画面で本会員にする(page: Page, メール: string): Promise<void> {
  const browser = page.context().browser();
  if (!browser) throw new Error(`会員 ${メール} を管理画面で本会員にするブラウザが無い`);
  const r = await 管理画面で本会員にする(browser, メール);
  reportCurrentSeedIssue(`${管理画面で本会員にした注記}。会員 ${メール}（会員ID ${r.会員ID}。登録直後の会員ステータス「${r.前の状態}」）`);
}

// ---- F02-02 などが使う、メールを使わない会員の作り方（フロントで登録 → 管理画面で本会員にする） ----

export type 登録する会員 = { 姓: string; 名: string; セイ: string; メイ: string; メール: string; パスワード: string };

async function frontContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return context;
}

let telSeq = 0;
/** 会員ごとに違う電話番号（携帯の形の11桁） */
const 試験の電話番号 = (): string => `090${String((Date.now() + telSeq++) % 100_000_000).padStart(8, "0")}`;

/**
 * 本店の新規会員登録画面で登録し（仮会員になっても本登録のメールは読まない）、管理画面の会員一覧でメールアドレスを検索して会員IDを読み、
 * 会員登録/編集で会員ステータスを本会員にして「会員情報を登録」を押す。会員IDを返す。
 */
export async function 会員を登録して本会員にする(browser: Browser, m: 登録する会員, issue: Issue): Promise<string> {
  const context = await frontContext(browser);
  try {
    const e = new EntryPage(await context.newPage());
    await e.open();
    await e.fill({
      姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, 生年月日: ["1990", "1", "1"], メール: m.メール, パスワード: m.パスワード,
      国: "Japan", 郵便番号: "1000001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話番号: 試験の電話番号(),
    });
    if (!(await e.同意する()).sent) throw new Error(`会員 ${m.メール} の登録: 「同意する」を押しても確認画面へ進めない`);
    await e.登録する();
    if (e.登録エラー画面か) throw new Error(`会員 ${m.メール} の登録が登録エラーの画面になった（${e.path}）`);
  } finally { await context.close(); }
  const r = await 管理画面で本会員にする(browser, m.メール);
  issue(`会員 ${m.メール} を登録した（会員ID ${r.会員ID}。登録直後の会員ステータス「${r.前の状態}」を本会員にして保存した）`);
  return r.会員ID;
}
