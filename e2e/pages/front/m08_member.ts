/**
 * M08（会員管理）のシードが使う、フロントの新規会員登録（会員情報登録画面 → 確認画面 → 登録。仮会員なら本登録のメールのURLを開いて本会員にする）。
 * 画面の操作は F06-01 の会員登録の部品（pages/front/f06_01_entry.ts）を使い、本登録のメールは手元の受け口で読む（依頼者決定 2026-10-31）。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { mailIds, waitForMailTo } from "../../lib/mail";
import { hideDebugToolbar } from "../../lib/session";
import { EntryPage, 入力値 } from "./f06_01_entry";

export type M08登録値 = Omit<入力値, "国" | "郵便番号" | "住所1" | "住所2" | "電話番号"> & Partial<Pick<入力値, "郵便番号" | "住所1" | "住所2" | "電話番号" | "国">>;

/** 状態・属性に指定の無い必須項目の既定（シード表に書かれた値: 郵便番号100-0001・東京都・電話番号03-1234-5678・国は初期値の日本） */
const 既定 = { 国: "Japan" as const, 郵便番号: "100-0001", 住所1: "旧住所1", 住所2: "旧住所2", 電話番号: "0312345678" };

export async function フロントで会員登録する(browser: Browser, v: M08登録値, 本登録しない = false): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const entry = new EntryPage(page);
    await entry.open();
    await entry.fill({ ...既定, ...v });
    const r = await entry.同意する();
    if (!r.sent) throw new Error(`会員「${v.姓} ${v.名}」の会員情報登録: ブラウザの入力チェックが送信を止めた`);
    const errors = await entry.エラー文();
    if (errors.length) throw new Error(`会員「${v.姓} ${v.名}」の会員情報登録で入力エラー: ${errors.join(" / ")}`);
    const before = await mailIds();
    await entry.登録する();
    if (本登録しない) {
      if (!entry.完了画面か) throw new Error(`会員「${v.姓} ${v.名}」が仮会員にならない（${page.url()}）。仮会員機能が無効の恐れ`);
      return;
    }
    if (entry.完了画面か) {
      const mail = await waitForMailTo(v.メール, before);
      const url = /https?:\/\/[^\s"'<>]+\/entry\/activate\/[^\s"'<>]+/.exec(mail.text)?.[0];
      if (!url) throw new Error(`会員「${v.姓} ${v.名}」の本登録のメール（${mail.subject}）に本登録のURLが無い`);
      await page.goto(url.replace(/&amp;/g, "&"));
      await page.waitForLoadState("load");
    }
    await expect(page.locator(".p-hareruya-entry-complete__message-text").first(), `会員「${v.姓} ${v.名}」の本登録の完了の表示`).toBeVisible({ timeout: 30_000 });
    if (/\/entry\/(complete|regist_error)/.test(page.url())) throw new Error(`会員「${v.姓} ${v.名}」が本会員にならない（${page.url()}）`);
  } finally {
    await context.close();
  }
}
