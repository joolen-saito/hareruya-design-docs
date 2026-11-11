/**
 * F06-05 マイページのシードが使う、管理画面の操作（会員のポイント付与・ポイント履歴の読み取り）。セレクタはここだけに書く。
 * ポイント付与の画面は M05-11 の部品（ポイントを付与する）と同じ画面。こちらはポイント発行日を指定できる。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const T = 20_000;

/** 日付を「YYYY-MM-DD」にする */
export function 日付の文字列(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
/** 今日から日数ぶん動かした日 */
export function 今日から(日数: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + 日数);
  return d;
}
/** 日付の文字列（「2027/05/12」「2027-5-12」など）を「YYYY-MM-DD」にそろえる。読めなければそのまま返す */
export function 日付をそろえる(s: string): string {
  const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : s;
}

/** 会員のポイント管理・履歴一覧から「ポイント付与（キャンペーン、特別対応）」を開き、増減量・ポイント発行日・備考「キャンペーン」を入れて保存する */
export async function ポイントを付与する(page: Page, 会員ID: string, 増減量: number, 発行日: string): Promise<void> {
  await page.goto(adminUrl(`/customer/point/${会員ID}/select`));
  await page.waitForLoadState("load");
  await Promise.all([page.waitForURL(/\/customer\/point\/\d+\/granted/), page.locator("a.point-type-select").first().click({ timeout: T })]);
  await page.waitForLoadState("load");
  await page.locator("#admin_customer_point_pointChange").fill(String(増減量), { timeout: T });
  await page.locator("#admin_customer_point_note").selectOption({ label: "キャンペーン" }, { timeout: T });
  await page.locator("#admin_customer_point_issueDate").fill(発行日, { timeout: T });
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 180_000 }), page.locator("form[name=customer_point_form] button[type=submit]").click({ timeout: T })]);
  await page.waitForLoadState("load");
  await expectSaved(page, `会員ID ${会員ID} のポイント付与（${増減量}・発行日 ${発行日}）の保存`);
}

export type ポイント履歴の行 = { ID: string; 増減量: number; 備考: string; 発行日: string; 有効期限: string };

/** 会員のポイント付与画面の履歴一覧（ID・増減量・備考・発行日・有効期限）を上から読む */
export async function ポイント履歴を読む(page: Page, 会員ID: string): Promise<ポイント履歴の行[]> {
  await page.goto(adminUrl(`/customer/point/${会員ID}/granted`));
  await page.waitForLoadState("load");
  const rows = page.locator("#pointHistory table tbody tr");
  const out: ポイント履歴の行[] = [];
  for (const r of await rows.all()) {
    const c = (await r.locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    if (c.length < 8) continue;
    out.push({ ID: c[0], 増減量: Number(c[3]), 備考: c[4], 発行日: c[5], 有効期限: c[7] });
  }
  return out;
}
