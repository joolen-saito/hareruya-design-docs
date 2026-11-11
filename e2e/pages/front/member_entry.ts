/** フロントの新規会員登録（会員情報登録画面 → 確認画面 → 登録。仮会員なら本登録のメールのURLを開いて本会員にする） */
import { Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { mailIds, waitForMailTo } from "../../lib/mail";

export type FrontMember = { 姓: string; 名: string; セイ: string; メイ: string; メール: string; パスワード: string; 住所3?: string;
  /** 省略すると会社名は入れない */
  会社名?: string;
  /** MTG Companion登録名（姓・名）。省略すると入れない */
  MTG姓?: string; MTG名?: string;
  /** 省略すると登録できる任意の値（東京都千代田区・生年月日1990/1/1・電話03-0000-0000）を入れる */
  詳細?: { 郵便番号1: string; 郵便番号2: string; 都道府県: string; 住所1: string; 住所2: string; 電話: [string, string, string] } };

/**
 * 会員情報登録画面で登録する。お名前・フリガナ・メールアドレス・パスワードは渡した値、
 * そのほかの必須項目（生年月日・住所・電話番号）は登録できる任意の値を入れる。
 */
export async function registerFrontMember(page: Page, v: FrontMember): Promise<void> {
  await page.goto(`${BASE_URL}/ja/entry`);
  await page.waitForLoadState("load");
  const form = page.locator("form#entry_form");
  const f = (name: string) => form.locator(`[name="entry[${name}]"]`);
  await f("name][name01").fill(v.姓);
  await f("name][name02").fill(v.名);
  await f("kana][kana01").fill(v.セイ);
  await f("kana][kana02").fill(v.メイ);
  await f("birth][year").selectOption("1990");
  await f("birth][month").selectOption("1");
  await f("birth][day").selectOption("1");
  await f("email][first").fill(v.メール);
  await f("email][second").fill(v.メール);
  await f("plain_password][first").fill(v.パスワード);
  await f("plain_password][second").fill(v.パスワード);
  const d = v.詳細 ?? { 郵便番号1: "100", 郵便番号2: "0001", 都道府県: "東京都", 住所1: "千代田区千代田", 住所2: "1-1", 電話: ["03", "0000", "0000"] as [string, string, string] };
  await f("postalCode][postalCode01").fill(d.郵便番号1);
  await f("postalCode][postalCode02").fill(d.郵便番号2);
  await f("address][pref").selectOption({ label: d.都道府県 });
  await f("address][addr01").fill(d.住所1);
  await f("address][addr02").fill(d.住所2);
  if (v.会社名 !== undefined) await f("company_name").fill(v.会社名);
  if (v.住所3 !== undefined && (await f("address][addr03").count()) > 0) await f("address][addr03").fill(v.住所3);
  await f("tel][tel01").fill(d.電話[0]);
  await f("tel][tel02").fill(d.電話[1]);
  await f("tel][tel03").fill(d.電話[2]);
  if (v.MTG姓 !== undefined) await f("Player][lastNameEn").fill(v.MTG姓);
  if (v.MTG名 !== undefined) await f("Player][firstNameEn").fill(v.MTG名);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.getByRole("button", { name: "同意して確認画面へ" }).click()]);
  await page.waitForLoadState("load");
  const errors = (await page.locator(".ec-errorMessage, .form-error-message, .invalid-feedback, .c-hareruya-form__error").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  if (errors.length) throw new Error(`会員「${v.姓} ${v.名}」の会員情報登録で入力エラー: ${errors.join(" / ")}`);
  const before = await mailIds();
  const register = page.locator('button[name="mode"][value="complete"]');
  await expect(register, "確認画面の「登録する」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), register.click()]);
  await page.waitForLoadState("load");
  if (/\/entry\/complete/.test(page.url())) {
    // 仮会員になった。届いた本登録のメールのURLを開く
    const mail = await waitForMailTo(v.メール, before);
    const url = /https?:\/\/[^\s"'<>]+\/entry\/activate\/[^\s"'<>]+/.exec(mail.text)?.[0];
    if (!url) throw new Error(`会員「${v.姓} ${v.名}」の本登録のメール（${mail.subject}）に本登録のURLが無い`);
    await page.goto(url.replace(/&amp;/g, "&"));
    await page.waitForLoadState("load");
  }
  await expect(page.locator(".p-hareruya-entry-complete__message-text").first(), `会員「${v.姓} ${v.名}」の本登録の完了の表示`).toBeVisible();
  if (/\/entry\/(complete|regist_error)/.test(page.url())) throw new Error(`会員「${v.姓} ${v.名}」が本会員にならない（${page.url()}）`);
}
