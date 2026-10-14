/** 店舗一覧・店舗登録（メニュー「店舗設定」） */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

export type TenantInput = {
  店名: string; 店名カナ: string; 店名英語: string; 支店URL: string; 店名略称3文字: string; ショップ名略称: string;
};

/** 店舗一覧で、店名の行に表示されたIDを読む。無ければ null */
export async function findTenantId(page: Page, 店名: string): Promise<string | null> {
  await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"));
  const row = page.locator("table.table tbody tr").filter({ has: page.getByRole("link", { name: 店名, exact: true }) });
  if ((await row.count()) === 0) return null;
  if ((await row.count()) > 1) throw new Error(`店名「${店名}」の店舗が複数ある。どれを使うか決められない`);
  return (await row.locator("td").nth(1).innerText()).trim();
}

export async function createTenant(page: Page, v: TenantInput): Promise<void> {
  await page.goto(adminUrl("/mall/tenant/create"));
  const f = (name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);
  await f("company_name").fill("試験用会社");
  await f("company_kana").fill("シケンヨウガイシャ");
  await f("shop_name").fill(v.店名);
  await f("shop_kana").fill(v.店名カナ);
  await f("shop_name_eng").fill(v.店名英語);
  await f("html_class_name").fill(v.支店URL);
  await page.getByLabel("支店", { exact: true }).check();
  await page.getByLabel("公開", { exact: true }).check();
  await page.getByLabel("開店", { exact: true }).check();
  await page.getByLabel("表示する", { exact: true }).check();
  await f("postal_code").fill("1600023");
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), "東京都");
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill("新宿区西新宿");
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill("1-1-1");
  await f("phone_number").fill("0312345678");
  for (const m of ["email01", "email02", "email03", "email04"]) await f(m).fill(`${v.支店URL}@example.test`);
  await f("shop_digit").fill(v.店名略称3文字);
  await f("short_name_jp").fill(v.ショップ名略称);
  await f("rank").fill("0");
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${v.店名}」の登録`);
}

/**
 * あれば使い、無ければ登録する。店舗一覧に表示された店舗IDを返す。
 * 登録の送信がエラー画面になっても、店舗一覧に出ていれば先へ進み、onIssue で問題を知らせる（握りつぶさない）。
 */
export async function ensureTenant(page: Page, v: TenantInput, onIssue: (message: string) => void): Promise<string> {
  const found = await findTenantId(page, v.店名);
  if (found) return found;
  let failure = "";
  try {
    await createTenant(page, v);
  } catch (e) {
    failure = (e as Error).message.split("\n")[0];
  }
  const id = await findTenantId(page, v.店名);
  if (!id) throw new Error(`店舗「${v.店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
  if (failure) onIssue(`店舗登録画面で「${v.店名}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
  return id;
}
