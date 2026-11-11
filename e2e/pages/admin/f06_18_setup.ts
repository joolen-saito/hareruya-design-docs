/**
 * F06-18 会員情報変更のシード・ケースが使う、管理画面の操作（会員登録/編集の配送先一覧・お届け先の追加・スマレジID・オンライン本人確認のポップアップ）。
 * セレクタはここだけに書く。会員登録/編集の画面の操作そのものは M08 の部品（m08_customer_edit.ts）を使う。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { M08CustomerEditPage } from "./m08_customer_edit";

const T = 30_000;

/** 会員登録/編集画面の配送先一覧の、配送先編集へのリンクにある配送先の番号（上から順） */
export async function 配送先の番号(page: Page, 会員ID: string): Promise<string[]> {
  const ed = new M08CustomerEditPage(page);
  const st = await ed.open(会員ID);
  if (st !== 200) throw new Error(`会員ID ${会員ID} の会員登録/編集画面を開けない（応答 ${st}）`);
  const hrefs = await page.locator(`#delivery a[href*="/customer/${会員ID}/delivery/"][href$="/edit"]`).evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""));
  return [...new Set(hrefs.map((h) => /\/delivery\/(\d+)\/edit/.exec(h)?.[1] ?? "").filter(Boolean))];
}

/** 会員登録/編集画面のスマレジIDの欄の値 */
export async function スマレジIDを読む(page: Page, 会員ID: string): Promise<string> {
  const ed = new M08CustomerEditPage(page);
  const st = await ed.open(会員ID);
  if (st !== 200) throw new Error(`会員ID ${会員ID} の会員登録/編集画面を開けない（応答 ${st}）`);
  return (await ed.get("Player][smaregiId")).trim();
}

export type お届け先 = {
  配送先名称: string; 姓: string; 名: string; セイ: string; メイ: string; 郵便番号: string; 都道府県: string;
  住所1: string; 住所2: string; 会社名: string; 電話: string;
};

/** 会員の配送先編集画面（新規）で、国が日本のお届け先を足す */
export async function お届け先を足す(page: Page, 会員ID: string, v: お届け先, what: string): Promise<void> {
  await page.goto(adminUrl(`/customer/${会員ID}/delivery/new`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="customer_address[${name}]"]`);
  await expect(f("address_name"), `${what}: 配送先編集の配送先名称欄`).toBeVisible({ timeout: T });
  await f("address_name").fill(v.配送先名称);
  await f("name][name01").fill(v.姓);
  await f("name][name02").fill(v.名);
  await f("kana][kana01").fill(v.セイ);
  await f("kana][kana02").fill(v.メイ);
  if ((await f("company_name").count()) > 0) await f("company_name").fill(v.会社名);
  const zip = v.郵便番号.replace(/\D/g, "");
  await f("postalCode][postalCode01").fill(zip.slice(0, 3));
  await f("postalCode][postalCode02").fill(zip.slice(3));
  await chooseByLabel(f("address][pref"), v.都道府県);
  await f("address][addr01").fill(v.住所1);
  await f("address][addr02").fill(v.住所2);
  const tel = v.電話.replace(/\D/g, "");
  await f("tel][tel01").fill(tel.slice(0, 2));
  await f("tel][tel02").fill(tel.slice(2, 6));
  await f("tel][tel03").fill(tel.slice(6));
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }),
    page.locator("form button[type=submit]").filter({ hasText: /登録/ }).first().click({ timeout: T }),
  ]);
  await expectSaved(page, `${what}: お届け先の登録`);
}

/** 会員登録/編集画面で、オンライン本人確認ボタンを押してポップアップを開き、表示の行（見出しと値）を読む */
export async function オンライン本人確認のポップアップを読む(page: Page): Promise<[string, string][]> {
  const ed = new M08CustomerEditPage(page);
  await ed.オンライン本人確認ボタン.click({ timeout: T });
  const pop = ed.オンライン本人確認ポップアップ;
  await expect(pop, "オンライン本人確認のポップアップ").toBeVisible({ timeout: T });
  const rows = pop.locator("#online_identification_info .row.mb-2");
  const out: [string, string][] = [];
  for (const r of await rows.all()) {
    const label = ((await r.locator(":scope > .col-3").first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    const value = ((await r.locator(":scope > .col").first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    out.push([label, value]);
  }
  return out;
}
