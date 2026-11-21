/**
 * M01-01 パスワード認証（管理画面のログイン）の連携ケースの画面操作。セレクタはここにだけ書く。
 * - 管理ログイン画面でログインを試みる（成否は、ホーム画面以降の画面へ移ったかで見る）。
 * - ログイン履歴画面（メニュー「システム設定」→「メンバー管理」→「ログイン履歴」）で、詳細検索のログインIDで絞り込み、行を読む。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 管理ログイン画面で、ログインID・パスワードを入れて「ログイン」を押す。押したあとの画面のアドレスを返す */
export async function ログインを試みる(page: Page, ログインID: string, パスワード: string): Promise<{ アドレス: string; ログイン画面に留まった: boolean; エラー文: string }> {
  await page.goto(adminUrl("/login"));
  await page.locator("#login_id").fill(ログインID, { timeout: 60_000 });
  await page.locator("#password").fill(パスワード, { timeout: 60_000 });
  // 成功すると、アプリはホーム画面（ダッシュボード）へ移す。ダッシュボードは売上の集計などで重く、共有の開発環境では返らないことがあるので、
  // 送信の応答（転送の指示）までで見切り、ダッシュボード自体の表示は待たない
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && r.url().split("?")[0] === adminUrl("/login"), { timeout: 120_000 }),
    page.getByRole("button", { name: "ログイン" }).click(),
  ]);
  const 転送先 = res.headers()["location"] ?? "";
  if (res.status() >= 300 && res.status() < 400) {
    const 画面 = new URL(転送先, adminUrl("/login")).pathname;
    return { アドレス: 転送先, ログイン画面に留まった: /\/login\/?$/.test(画面), エラー文: "" };
  }
  await page.waitForLoadState("domcontentloaded");
  const エラー文 = ((await page.locator(".alert-danger, .c-formError, .invalid-feedback, [class*=error]").allInnerTexts().catch(() => [])) as string[]).map((t) => t.trim()).filter(Boolean).join(" / ");
  return { アドレス: page.url(), ログイン画面に留まった: /\/login/.test(page.url()), エラー文 };
}

/** ログイン履歴画面を開く */
export async function ログイン履歴を開く(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/setting/system/login_history"), { timeout: 120_000 });
  expect(res?.status(), "ログイン履歴画面の応答").toBe(200);
  await page.waitForLoadState("load");
  await expect(page.locator("form#search_form"), "ログイン履歴の検索欄").toBeVisible();
}

/** 詳細検索を開き、ログインIDを入れて「検索」を押す */
export async function 詳細検索でログインIDを検索する(page: Page, ログインID: string): Promise<void> {
  const 欄 = page.locator('[name="admin_search_login_history[user_name]"]');
  if (!(await 欄.isVisible())) {
    await page.locator('div[href="#searchDetail"]').click({ timeout: 20_000 });
    await expect(欄, "詳細検索のログインIDの欄").toBeVisible();
  }
  await 欄.fill(ログインID);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    page.locator("form#search_form button[type=submit]").first().click({ noWaitAfter: true }),
  ]);
}

export type 履歴の行 = { 番号: number; ログインID: string; 接続元: string; 日時: string; ステータス: string };

/** 検索結果の行（画面の表示順。初期の表示件数の範囲） */
export async function 履歴の行を読む(page: Page): Promise<履歴の行[]> {
  const rows = await page.locator("table tbody tr").evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim())));
  return rows.filter((r) => r.length >= 5).map((r) => ({ 番号: Number(r[0]), ログインID: r[1], 接続元: r[2], 日時: r[3], ステータス: r[4] }));
}

/** ログイン履歴画面でログインIDを検索し、そのログインIDのいちばん新しい履歴の番号を返す（履歴が無ければ 0）。ログインの前の状態を控えるのに使う（画面の読み取りだけ） */
export async function 最新の履歴の番号を読む(page: Page, ログインID: string): Promise<number> {
  await ログイン履歴を開く(page);
  await 詳細検索でログインIDを検索する(page, ログインID);
  const 行 = (await 履歴の行を読む(page)).filter((r) => r.ログインID === ログインID);
  return 行.length ? Math.max(...行.map((r) => r.番号)) : 0; // 一覧は新しい順なので、表示の範囲に最新の行がある
}
