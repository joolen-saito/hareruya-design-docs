/**
 * F02-03（支店のグローバルナビ）の試験店舗を、店舗登録画面で作る・内容を確かめる部品。
 * 店名・郵便番号・住所・Google map埋め込みURL・電話番号・店舗営業時間・ご当地晴れる屋くんの画像を入れる。
 * 画像は、正本が「branch-a.png」「branch-b.png」とだけ定める入力ファイルで、中身は決まっていない。e2e/fixtures/f02-03/ に、色の違う小さな画像を置いた（正本の外の補い）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { findTenantId } from "./tenant";
import { guardStoreCreate } from "./store_once";

export type 支店の入力 = {
  店名: string; 店名カナ: string; 店名英語: string; 支店URL: string; 店名略称3文字: string; ショップ名略称: string;
  郵便番号: string; 都道府県: string; 住所1: string; 住所2: string; 電話番号: string; 地図URL: string; 営業時間?: string; 画像?: string;
};

const f = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);
const digits = (v: string) => v.replace(/-/g, "");

async function create(page: Page, v: 支店の入力): Promise<void> {
  await guardStoreCreate(page, v.店名, "試験用会社", "f02_03_store.create");
  await page.goto(adminUrl("/mall/tenant/create"));
  await page.waitForLoadState("load");
  await f(page, "company_name").fill("試験用会社");
  await f(page, "company_kana").fill("シケンヨウガイシャ");
  await f(page, "shop_name").fill(v.店名);
  await f(page, "shop_kana").fill(v.店名カナ);
  await f(page, "shop_name_eng").fill(v.店名英語);
  await f(page, "html_class_name").fill(v.支店URL);
  await page.getByLabel("支店", { exact: true }).check();
  await page.getByLabel("公開", { exact: true }).check();
  await page.getByLabel("開店", { exact: true }).check();
  await page.getByLabel("表示する", { exact: true }).check();
  await f(page, "postal_code").fill(digits(v.郵便番号));
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), v.都道府県);
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill(v.住所1);
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill(v.住所2);
  await f(page, "google_map_url").fill(v.地図URL);
  await f(page, "phone_number").fill(digits(v.電話番号));
  if (v.営業時間) await f(page, "business_hour").fill(v.営業時間);
  for (const m of ["email01", "email02", "email03", "email04"]) await f(page, m).fill(`${v.支店URL}@example.test`);
  await f(page, "shop_digit").fill(v.店名略称3文字);
  await f(page, "short_name_jp").fill(v.ショップ名略称);
  await f(page, "rank").fill("0");
  if (v.画像) {
    await page.locator("div.col:has(#hareruyakun-upload-zone) input[type=file]").first().setInputFiles(v.画像);
    // 画像の送信が済むと、画面の仕掛けが隠し項目へファイル名を入れる
    await expect(page.locator("#mall_tenant_shop_master_add_local_hareruyakun_image"), `店舗「${v.店名}」の画像の送信`).not.toHaveValue("", { timeout: 60_000 });
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${v.店名}」の登録`);
}

/** 店舗編集画面で、シード表が定めた項目が求める値であることを確かめる（違えば止める。別の内容の店舗を黙って使わない） */
async function expectStore(page: Page, id: string, v: 支店の入力): Promise<void> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${id}`));
  if (!res || !res.ok()) throw new Error(`店舗ID ${id} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  await expect(f(page, "shop_name"), `店舗ID ${id} の店名の欄`).toBeVisible();
  const val = async (n: string) => (await f(page, n).inputValue()).trim();
  const got: Record<string, string> = {
    店名: await val("shop_name"), 支店URL: await val("html_class_name"), 郵便番号: digits(await val("postal_code")), 地図URL: await val("google_map_url"),
    電話番号: digits(await val("phone_number")), 営業時間: await val("business_hour"),
    住所1: (await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').inputValue()).trim(),
  };
  const want: Record<string, string> = { 店名: v.店名, 支店URL: v.支店URL, 郵便番号: digits(v.郵便番号), 地図URL: v.地図URL, 電話番号: digits(v.電話番号), 営業時間: v.営業時間 ?? "", 住所1: v.住所1 };
  const diff = Object.keys(want).filter((k) => got[k] !== want[k]);
  if (diff.length) throw new Error(`店舗ID ${id}（${v.店名}）の内容がシード表と違う: ${diff.map((k) => `${k}=「${got[k]}」（求める値「${want[k]}」）`).join("、")}`);
}

/** あれば使い（内容を確かめる）、無ければ作る。店舗IDを返す */
export async function ensureBranch(page: Page, v: 支店の入力, onIssue: (m: string) => void = () => undefined): Promise<string> {
  const found = await findTenantId(page, v.店名);
  if (found) { await expectStore(page, found, v); return found; }
  let failure = "";
  try { await create(page, v); } catch (e) { failure = (e as Error).message.split("\n")[0]; }
  const id = await findTenantId(page, v.店名);
  if (!id) throw new Error(`店舗「${v.店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
  if (failure) onIssue(`店舗「${v.店名}」の登録は行われたが、画面は成功を表示しなかった（${failure}）`);
  return id;
}
