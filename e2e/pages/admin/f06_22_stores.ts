/**
 * F06-22 お問い合わせの店舗選択に出す試験店舗を、店舗登録画面（メニュー「店舗設定」）で作る部品。
 * 店名とショップ名略称は同じ値、公開／非公開・開店／閉店・表示順・問い合わせ専用メールアドレスはシード表の値。
 * ほかの必須項目（会社名・住所・電話番号・各メールアドレス・店名略称3文字・支店URL）は、任意の有効な値を入れる。
 */
import { expect, Page } from "@playwright/test";
import { query } from "../../lib/db";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { findTenantId } from "./tenant";
import { guardStoreCreate } from "./store_once";

export type 店舗の定め = { 店名: string; 店名英語: string; 公開: boolean; 営業中: boolean; 表示順: string; 受付アドレス: string; 店名略称3文字: string; 支店URL: string };

const f = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);

async function 登録する(page: Page, v: 店舗の定め): Promise<void> {
  await guardStoreCreate(page, v.店名, "試験用会社", "f06_22_stores.登録する");
  await page.goto(adminUrl("/mall/tenant/create"));
  await page.waitForLoadState("load");
  await f(page, "company_name").fill("試験用会社");
  await f(page, "company_kana").fill("シケンヨウガイシャ");
  await f(page, "shop_name").fill(v.店名);
  await f(page, "shop_kana").fill("シケンテンポ");
  await f(page, "shop_name_eng").fill(v.店名英語);
  await f(page, "html_class_name").fill(v.支店URL);
  await page.getByLabel("支店", { exact: true }).check();
  await page.getByLabel(v.公開 ? "公開" : "非公開", { exact: true }).check();
  await page.getByLabel(v.営業中 ? "開店" : "閉店", { exact: true }).check();
  await page.getByLabel("表示する", { exact: true }).check();
  await f(page, "postal_code").fill("1600023");
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), "東京都");
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill("新宿区西新宿");
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill("1-1-1");
  await f(page, "phone_number").fill("0312345678");
  for (const m of ["email01", "email03", "email04"]) await f(page, m).fill(`${v.支店URL}@example.test`);
  await f(page, "email02").fill(v.受付アドレス);
  await f(page, "shop_digit").fill(v.店名略称3文字);
  await f(page, "short_name_jp").fill(v.店名);
  await f(page, "rank").fill(v.表示順);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${v.店名}」の登録`);
}

/** DBの参照で、店舗の内容がシード表の値であることを確かめる（違えば文を返す） */
export function 店舗の食い違い(id: string, v: 店舗の定め): string {
  const r = query(`select shop_name, short_name_jp, is_public_shop, is_open_shop, rank, email02 from dtb_base_info where id = $1`, [id])[0];
  if (!r) return `店舗ID ${id} が無い`;
  const d: string[] = [];
  if (r.shop_name !== v.店名) d.push(`店名「${r.shop_name}」`);
  if (r.short_name_jp !== v.店名) d.push(`ショップ名略称「${r.short_name_jp}」`);
  if ((r.is_public_shop === "true") !== v.公開) d.push("公開／非公開");
  if ((r.is_open_shop === "true") !== v.営業中) d.push("開店／閉店");
  if (r.rank !== v.表示順) d.push(`表示順「${r.rank}」`);
  if (r.email02 !== v.受付アドレス) d.push(`問い合わせ専用メールアドレス「${r.email02}」`);
  return d.join("・");
}

/** あれば使い、無ければ作る。店舗IDを返す */
export async function ensureStore(page: Page, v: 店舗の定め, 確かめる: boolean): Promise<string> {
  const found = await findTenantId(page, v.店名);
  if (found) return found;
  let failure = "";
  try { await 登録する(page, v); } catch (e) { failure = (e as Error).message.split("\n")[0]; }
  const id = await findTenantId(page, v.店名);
  if (!id) throw new Error(`店舗「${v.店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
  void expect; void 確かめる;
  return id;
}
