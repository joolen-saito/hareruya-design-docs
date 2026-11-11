/**
 * F06-05 のシードで使う、管理画面の会員のポイント付与（キャンペーン、特別対応）。ポイント発行日・備考を指定して付与する。
 * セレクタはここだけに書く（発行日を指定しない付与は pages/admin/m05_11_order_edit.ts の ポイントを付与する）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const T = 20_000;

/** 会員のポイント付与（キャンペーン、特別対応）画面で、増減量・備考・ポイント発行日（YYYY-MM-DD）を入れて保存する */
export async function 発行日を指定してポイントを付与する(page: Page, 会員ID: string, v: { 増減量: number; 備考: string; 発行日: string }): Promise<void> {
  await page.goto(adminUrl(`/customer/point/${会員ID}/select`));
  await page.waitForLoadState("load");
  const 付与 = page.locator("a.point-type-select").filter({ hasText: /キャンペーン/ }).first();
  await expect(付与, "「ポイント付与（キャンペーン、特別対応）」の選択").toHaveCount(1, { timeout: T });
  await Promise.all([page.waitForURL(/\/customer\/point\/\d+\/granted/), 付与.click({ timeout: T })]);
  await page.waitForLoadState("load");
  await page.locator("#admin_customer_point_pointChange").fill(String(v.増減量), { timeout: T });
  await page.locator("#admin_customer_point_note").selectOption({ label: v.備考 }, { timeout: T });
  const d = page.locator("#admin_customer_point_issueDate");
  await d.fill(v.発行日, { timeout: T });
  await d.press("Escape").catch(() => undefined); // 日付の選び窓を閉じる
  await expect(d, "ポイント発行日").toHaveValue(v.発行日);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }),
    page.locator("form[name=customer_point_form] button[type=submit]").click({ timeout: T }),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, "ポイント履歴の保存");
}
