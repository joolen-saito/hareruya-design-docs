/**
 * A14-03 カード情報1件の取得のシードが使う、管理画面の操作（カード詳細の画像の言語を日本語へ変える）。セレクタはここだけに置く。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

/** カード編集画面で、「カード詳細ID: <詳細ID>」の詳細情報の画像の言語を「日本語」に変えて「登録」を押す */
export async function 画像の言語を日本語へ変える(page: Page, カードID: string, 詳細ID: string): Promise<void> {
  await page.goto(adminUrl(`/card/${カードID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, "カード詳細（編集）画面").toBeVisible();
  const 詳細 = form.locator(".detail-card").filter({ hasText: new RegExp(`カード詳細ID:\\s*${詳細ID}\\b`) });
  await expect(詳細, `詳細情報（カード詳細ID: ${詳細ID}）`).toHaveCount(1);
  const 言語 = 詳細.locator('select[name$="[language]"]').first();
  await 言語.selectOption({ label: "日本語" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click({ noWaitAfter: true }),
  ]);
  await expectSaved(page, `カード ${カードID} の画像の言語の変更`);
}
