/**
 * F06-16 のシードが使う、住所地が海外の会員のフロントの新規会員登録（会員情報登録画面 → 確認画面 → 登録 → 本登録のメールのURL）。
 * 入力欄の操作は F06-01 の部品（EntryPage）を使う。国内の会員は front/member_entry.ts の registerFrontMember を使う。
 * 本登録のメールを読めない環境では、仮会員になった会員を管理画面で本会員にする（pages/admin/member_activate.ts）。
 */
import { expect, Page } from "@playwright/test";
import { mailIds, waitForMailTo } from "../../lib/mail";
import { メールの代わりに管理画面で本会員にする, 本登録のメールを読める } from "../admin/member_activate";
import { EntryPage } from "./f06_01_entry";

export type 海外会員 = { 姓: string; 名: string; セイ: string; メイ: string; メール: string; パスワード: string; MTG姓?: string; MTG名?: string };

/** 国「United States」で会員を登録し、仮会員なら本登録のメールのURLを開いて本会員にする */
export async function 海外の会員を登録する(page: Page, v: 海外会員): Promise<void> {
  const e = new EntryPage(page);
  await e.open();
  await e.fill({
    姓: v.姓, 名: v.名, セイ: v.セイ, メイ: v.メイ, 生年月日: ["1990", "1", "1"], メール: v.メール, パスワード: v.パスワード,
    国: "United States", 郵便番号: "10001", 住所1: "New York", 住所2: "1 Main Street", 電話番号: "2125550100",
    MTG姓: v.MTG姓, MTG名: v.MTG名,
  });
  if (!(await e.同意する()).sent) throw new Error(`会員 ${v.メール} の登録: 「同意して確認画面へ」を押しても確認画面へ進めない`);
  const errors = await e.エラー文();
  if (errors.length && !(await e.確認画面である())) throw new Error(`会員 ${v.メール} の会員情報登録で入力エラー: ${errors.join(" / ")}`);
  const mailReadable = 本登録のメールを読める();
  const before = mailReadable ? await mailIds() : new Set<number>();
  await e.登録する();
  if (e.完了画面か && !mailReadable) {
    // 仮会員になったが、本登録のメールを読めない環境。管理画面で本会員にする
    await メールの代わりに管理画面で本会員にする(page, v.メール);
    return;
  }
  if (e.完了画面か) {
    const mail = await waitForMailTo(v.メール, before);
    const url = /https?:\/\/[^\s"'<>]+\/entry\/activate\/[^\s"'<>]+/.exec(mail.text)?.[0];
    if (!url) throw new Error(`会員 ${v.メール} の本登録のメール（${mail.subject}）に本登録のURLが無い`);
    await page.goto(url.replace(/&amp;/g, "&"));
    await page.waitForLoadState("load");
  }
  await expect(page.locator(".p-hareruya-entry-complete__message-text").first(), `会員 ${v.メール} の本登録の完了の表示`).toBeVisible();
  if (/\/entry\/(complete|regist_error)/.test(page.url())) throw new Error(`会員 ${v.メール} が本会員にならない（${page.url()}）`);
}
