/**
 * F08-05 の確かめで使う管理画面の操作（会員検索一覧・会員登録編集・メール配信履歴・自動送信メールのテンプレートの選択肢）。
 * セレクタはここにだけ書く。会員検索と会員登録編集の読み取りは pages/admin/f06_customer.ts を使い、足りない項目（フリガナ）だけ読む。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { readEdit, resultRow } from "./f06_customer";

const T = 30_000;

/** 会員検索一覧の検索結果の、メールアドレスが一致する行の会員名の文 */
export async function 検索結果の会員名(page: Page, メール: string): Promise<string> {
  const row = resultRow(page, メール);
  await expect(row, `検索結果にメールアドレス ${メール} の行が1つある`).toHaveCount(1, { timeout: T });
  return (await row.locator('a[href*="/customer/"]').first().innerText({ timeout: T })).replace(/\s+/g, " ").trim();
}

/** 会員登録編集画面に表示されている値（f06_customer の読み取りに、お名前(カナ)を足したもの） */
export async function 会員登録編集の値(page: Page): Promise<Record<string, string>> {
  const v = await readEdit(page);
  const kana = (n: string) => page.locator(`[name="admin_customer[kana][${n}]"]`).inputValue({ timeout: T });
  return { ...v, フリガナ姓: await kana("kana01"), フリガナ名: await kana("kana02") };
}

/** 会員登録編集画面の「送信履歴」ボタンを押して、メール配信履歴の画面を開く */
export async function 送信履歴を開く(page: Page): Promise<void> {
  const btn = page.locator('a[href*="/customer/mail/"][href$="/history"]').first();
  await expect(btn, "会員登録編集画面の「送信履歴」ボタン").toBeVisible({ timeout: T });
  await Promise.all([page.waitForURL(/\/customer\/mail\/\d+\/history/, { timeout: 60_000 }), btn.click({ timeout: T })]);
  await page.waitForLoadState("load");
  await expect(page.locator("#mail-history-form"), "メール配信履歴の画面").toBeVisible({ timeout: T });
}

/** メール配信履歴の一覧の行 */
export const 配信履歴の行 = (page: Page) => page.locator("#pointHistory table tbody tr");

/** メール配信履歴の一覧の、先頭の行の件名リンクを押し、表示されたポップアップの件名と本文を返す */
export async function 先頭の件名を開く(page: Page): Promise<{ 件名: string; 本文: string }> {
  const link = 配信履歴の行(page).first().locator("a.btn-link[data-bs-target]");
  await expect(link, "メール配信履歴の一覧の件名リンク").toBeVisible({ timeout: T });
  await link.click({ timeout: T });
  const modal = page.locator(".modal.show");
  await expect(modal, "件名リンクを押して出るポップアップ").toBeVisible({ timeout: T });
  return {
    件名: (await modal.locator(".modal-title").innerText({ timeout: T })).trim(),
    本文: (await modal.locator(".modal-body p").innerText({ timeout: T })).trim(),
  };
}

/** メール配信履歴の一覧の、先頭の行の送信日（画面の表示は「YYYY/MM/DD」の日付だけ） */
export async function 先頭の送信日(page: Page): Promise<string> {
  const cell = 配信履歴の行(page).first().locator("td").first();
  await expect(cell, "メール配信履歴の一覧の先頭の行の送信日").toBeVisible({ timeout: T });
  return (await cell.innerText({ timeout: T })).trim();
}

/** 自動送信メールのテンプレートの編集欄（名前・件名・ヘッダー・フッターなど）。名前は「mail[…]」で、確認用の本文（読み取り専用）と選択欄・トークンは含めない */
export type テンプレートの控え = { id: string; 欄: Record<string, string> };

/** 名称が完全に一致するテンプレートの編集画面を開く。一致が1つでなければ止まる。テンプレートの識別番号を返す */
export async function テンプレートを開く(page: Page, 名称: string): Promise<string> {
  const res = await page.goto(adminUrl("/mall/auto_mail"), { timeout: 60_000 });
  if (!res || !res.ok()) throw new Error(`自動送信メールの設定画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  const select = page.locator('[name="mail[template]"]');
  await expect(select, "自動送信メールの設定画面のテンプレートの選択欄").toBeVisible({ timeout: T });
  const hit = await select.locator("option").evaluateAll((os, n) => os.map((o) => o as HTMLOptionElement)
    .filter((o) => (o.textContent ?? "").trim() === n).map((o) => o.value), 名称);
  if (hit.length !== 1) throw new Error(`自動送信メールのテンプレート「${名称}」が${hit.length}件ある（1件でないので決められない）`);
  await page.goto(adminUrl(`/mall/auto_mail/${hit[0]}`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await expect(page.locator('[name="mail[mail_subject]"]'), `テンプレート「${名称}」の件名の欄`).toBeVisible({ timeout: T });
  return hit[0];
}

/** 開いているテンプレートの編集欄の値を全部読む（戻すための控え） */
export async function テンプレートの欄を読む(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const e of Array.from(document.querySelectorAll<HTMLInputElement>("#form1 input, #form1 select, #form1 textarea"))) {
      if (!e.name || e.type === "hidden" || e.name.endsWith("[_token]") || e.name === "mail[template]" || e.name === "mail[tpl_data]") continue;
      out[e.name] = e.value;
    }
    return out;
  });
}

/** 開いているテンプレートの編集欄に値を入れて、登録を押し、保存の完了を確かめる */
export async function テンプレートの欄を保存する(page: Page, 欄: Record<string, string>, what: string): Promise<void> {
  for (const [name, v] of Object.entries(欄)) await page.locator(`#form1 [name="${name}"]`).fill(v, { timeout: 60_000 });
  await Promise.all([page.waitForLoadState("load"), page.locator("#form1 button[type=submit]").click({ timeout: T })]);
  await page.waitForLoadState("load");
  await expectSaved(page, what);
}

/** 自動送信メールの設定画面のテンプレートの選択肢の名前（書き換えない。読むだけ） */
export async function 自動送信メールのテンプレート名(page: Page): Promise<string[]> {
  const res = await page.goto(adminUrl("/mall/auto_mail"), { timeout: 60_000 });
  if (!res || !res.ok()) throw new Error(`自動送信メールの設定画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  const select = page.locator('[name="mail[template]"]');
  await expect(select, "自動送信メールの設定画面のテンプレートの選択欄").toBeVisible({ timeout: T });
  return (await select.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
}
