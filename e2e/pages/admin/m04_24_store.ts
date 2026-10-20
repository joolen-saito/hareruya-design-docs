/**
 * M04-24 の試験店舗（本店・大阪店・名古屋店・福岡店・札幌店・仙台店）の店舗一覧・店舗登録・店舗編集（メニュー「店舗設定」）。
 * 共通の部品（tenant.ts の createTenant）は会社名・住所・電話番号を決め打ちしているので、シード表の値を入れられるようにした局所の部品。
 * - 手元のDBには、同じ店名の閉店の店舗（福岡店・札幌店・名古屋店・仙台店。会社名は「株式会社 晴れる屋」）がある。
 *   店名だけでは決まらないので、店名・会社名が一致し、開店の行だけを試験店舗とみなす。
 * - 郵便番号・電話番号は、画面がハイフンを除いて保存する。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

export type M0424StoreInput = {
  店名: string; 店名カナ: string; 店名英語: string; 支店URL: string; 店名略称3文字: string; ショップ名略称: string;
  会社名: string; 会社名カナ: string; 郵便番号: string; 都道府県: string; 住所1: string; 住所2: string; 電話番号: string;
};

type ListedStore = { id: string; 店名: string; 会社名: string; 開店: string };

/** 店舗一覧の全行（ID・店名・会社名・開店/閉店） */
async function listedStores(page: Page): Promise<ListedStore[]> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"));
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  return page.locator('table.table tbody tr[id^="ex-tenant-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { id: td(1), 店名: td(2), 会社名: td(3), 開店: td(5) };
  }));
}

/** 店舗一覧で、店名・会社名が一致し、開店の行の店舗ID。無ければ null。2件以上あれば、どれを使うか決められないので止める */
export async function findOpenStoreId(page: Page, 店名: string, 会社名: string): Promise<string | null> {
  const hits = (await listedStores(page)).filter((s) => s.店名 === 店名 && s.会社名 === 会社名 && s.開店 === "開店");
  if (hits.length > 1) throw new Error(`店名「${店名}」・会社名「${会社名}」の開店の店舗が${hits.length}件ある（ID ${hits.map((h) => h.id).join("・")}）。どれを使うか決められない`);
  return hits[0]?.id ?? null;
}

const field = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);
const digits = (v: string) => v.replace(/-/g, "");

/** 店舗登録画面で登録する（そのほかの必須項目は、正本の「任意の有効な値」として固定の値を入れる） */
export async function createStore(page: Page, v: M0424StoreInput): Promise<void> {
  await page.goto(adminUrl("/mall/tenant/create"));
  await page.waitForLoadState("load");
  await field(page, "company_name").fill(v.会社名);
  await field(page, "company_kana").fill(v.会社名カナ);
  await field(page, "shop_name").fill(v.店名);
  await field(page, "shop_kana").fill(v.店名カナ);
  await field(page, "shop_name_eng").fill(v.店名英語);
  await field(page, "html_class_name").fill(v.支店URL);
  await page.getByLabel("支店", { exact: true }).check();
  await page.getByLabel("公開", { exact: true }).check();
  await page.getByLabel("開店", { exact: true }).check();
  await page.getByLabel("表示する", { exact: true }).check();
  await field(page, "postal_code").fill(v.郵便番号);
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), v.都道府県);
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill(v.住所1);
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill(v.住所2);
  await field(page, "phone_number").fill(v.電話番号);
  for (const m of ["email01", "email02", "email03", "email04"]) await field(page, m).fill(`${v.支店URL}@example.test`);
  await field(page, "shop_digit").fill(v.店名略称3文字);
  await field(page, "short_name_jp").fill(v.ショップ名略称);
  await field(page, "rank").fill("0");
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${v.店名}」の登録`);
}

/** 店舗編集画面で、シード表が定めた項目が求める値であることを確かめる。違えば、違う項目を挙げて止める（別の店舗を黙って使わない） */
export async function expectStore(page: Page, id: string, v: M0424StoreInput): Promise<void> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${id}`));
  if (!res || !res.ok()) throw new Error(`店舗ID ${id} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  await expect(field(page, "shop_name"), `店舗ID ${id} の店名の欄`).toBeVisible();
  const value = async (selector: string) => (await page.locator(selector).inputValue()).trim();
  const got: Record<string, string> = {
    店名: await value('[name="mall_tenant_shop_master[shop_name]"]'),
    店名カナ: await value('[name="mall_tenant_shop_master[shop_kana]"]'),
    会社名: await value('[name="mall_tenant_shop_master[company_name]"]'),
    会社名カナ: await value('[name="mall_tenant_shop_master[company_kana]"]'),
    郵便番号: digits(await value('[name="mall_tenant_shop_master[postal_code]"]')),
    都道府県: ((await page.locator('[name="mall_tenant_shop_master[address][pref]"] option:checked').textContent()) ?? "").trim(),
    住所1: await value('[name="mall_tenant_shop_master[address][addr01]"]'),
    住所2: await value('[name="mall_tenant_shop_master[address][addr02]"]'),
    電話番号: digits(await value('[name="mall_tenant_shop_master[phone_number]"]')),
    開店: (await page.getByLabel("開店", { exact: true }).isChecked()) ? "開店" : "閉店",
  };
  const want: Record<string, string> = {
    店名: v.店名, 店名カナ: v.店名カナ, 会社名: v.会社名, 会社名カナ: v.会社名カナ, 郵便番号: digits(v.郵便番号), 都道府県: v.都道府県,
    住所1: v.住所1, 住所2: v.住所2, 電話番号: digits(v.電話番号), 開店: "開店",
  };
  const diff = Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k}: 「${got[k]}」（求めるのは「${want[k]}」）`);
  if (diff.length) throw new Error(`店舗「${v.店名}」（店舗ID ${id}）は登録済みだが、内容が違う: ${diff.join(" / ")}`);
}

/**
 * あれば内容を確かめて使い、無ければ登録する。店舗一覧の行に表示された店舗IDを返す。
 * 登録の送信がエラー画面になっても、店舗一覧に出ていれば内容を確かめて先へ進み、onIssue で知らせる（握りつぶさない）。
 */
export async function ensureStore(page: Page, v: M0424StoreInput, onIssue: (message: string) => void): Promise<string> {
  let id = await findOpenStoreId(page, v.店名, v.会社名);
  if (!id) {
    let failure = "";
    try {
      await createStore(page, v);
    } catch (e) {
      failure = (e as Error).message.split("\n")[0];
    }
    id = await findOpenStoreId(page, v.店名, v.会社名);
    if (!id) throw new Error(`店舗「${v.店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
    if (failure) onIssue(`店舗登録画面で「${v.店名}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
  }
  await expectStore(page, id, v);
  return id;
}
