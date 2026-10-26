/**
 * M04-09 在庫移動・振替登録/編集（と M04-08）のシード S-M04-09-MASTER の画面操作と、試験用の権限（承認権限なし）の用意。
 * セレクタはここにだけ書く。
 *
 * - 店舗: 正本の MASTER は、試験店舗A（店舗種別 本店）・試験店舗B（支店）を「この機能のシードとして」店舗登録画面で登録し、
 *   ほかの機能が同じ店名で作った店舗は使わないとする。共通の部品（tenant.ts・m04_24_store.ts）は店舗種別を「支店」に決め打ちしているので、
 *   店舗種別・公開・開店・売上集計の検索項目を選べる局所の部品にした。
 *   この機能が作った店舗は、店名と会社名（この機能の値）で見分ける。同じ店名でほかの会社名の店舗があれば、画面の選択肢で見分けられないので止める。
 *   新しい店舗の登録は、保存されたうえでシステムエラーの画面になる（M04-24 と同じ）。店舗一覧に出ていれば先へ進み、知らせる。
 * - 権限: 正本の「承認権限なし」の管理者（M04-09作業者・M04-09権限なしユーザー）に使う権限。M04-22 の部品
 *   （マスタデータ管理で権限のマスターに1行足し、権限管理でその行の「承認権限」のチェックを外す）を使う。
 *   新しい権限は、承認権限のほかはすべて許可（権限管理の表のほかの列は商品管理の画面だけ）なので、在庫の画面は操作できる。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { denyApprovalForAuthority, ensureAuthorityMasterRow } from "./m04_22_move_transfer_csv";

export type M0409Store = {
  店名: string; 店舗種別: "本店" | "支店"; 店名カナ: string; 店名英語: string; 支店URL: string; 店名略称3文字: string;
};

/** この機能が登録する店舗の会社名（店名が同じほかの機能の店舗と見分ける） */
export const M0409_COMPANY = "M04-09試験会社";

type Listed = { id: string; 店名: string; 会社名: string; 開店: string };

async function listedStores(page: Page): Promise<Listed[]> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"), { timeout: 120_000 });
  if (!res || !res.ok()) throw new Error(`店舗一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  return page.locator('table.table tbody tr[id^="ex-tenant-"]').evaluateAll((trs) => trs.map((tr) => {
    const td = (i: number) => (tr.querySelectorAll("td")[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { id: td(1), 店名: td(2), 会社名: td(3), 開店: td(5) };
  }));
}

/** 店名の店舗のうち、この機能の会社名のものの店舗ID。無ければ null。同じ店名のほかの店舗があれば止める */
async function findOwnStore(page: Page, 店名: string): Promise<string | null> {
  const same = (await listedStores(page)).filter((s) => s.店名 === 店名);
  const own = same.filter((s) => s.会社名 === M0409_COMPANY);
  const others = same.filter((s) => s.会社名 !== M0409_COMPANY);
  if (others.length) {
    throw new Error(`店名「${店名}」の店舗が、ほかの会社名で${others.length}件ある（ID ${others.map((o) => `${o.id}・${o.会社名}`).join("、")}）。`
      + "正本はほかの機能の同じ店名の店舗を使わないとし、画面の店舗の選択肢で見分けられないので止めた");
  }
  if (own.length > 1) throw new Error(`店名「${店名}」・会社名「${M0409_COMPANY}」の店舗が${own.length}件ある（ID ${own.map((o) => o.id).join("・")}）`);
  return own[0]?.id ?? null;
}

const field = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);

/** 店舗登録画面で、正本の値（店舗種別・公開・開店・売上集計の検索項目）と、任意の有効な値で登録する */
async function createStore(page: Page, v: M0409Store): Promise<void> {
  await page.goto(adminUrl("/mall/tenant/create"), { timeout: 120_000 });
  await page.waitForLoadState("load");
  await field(page, "company_name").fill(M0409_COMPANY);
  await field(page, "company_kana").fill("シケンガイシャ");
  await field(page, "shop_name").fill(v.店名);
  await field(page, "shop_kana").fill(v.店名カナ);
  await field(page, "shop_name_eng").fill(v.店名英語);
  await field(page, "html_class_name").fill(v.支店URL);
  await page.getByLabel(v.店舗種別, { exact: true }).check();
  await page.getByLabel("公開", { exact: true }).check();
  await page.getByLabel("開店", { exact: true }).check();
  await page.getByLabel("表示する", { exact: true }).check();
  await field(page, "postal_code").fill("1600023");
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), "東京都");
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill("新宿区西新宿");
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill("4-9-1");
  await field(page, "phone_number").fill("0304090001");
  for (const m of ["email01", "email02", "email03", "email04"]) await field(page, m).fill(`${v.支店URL}@example.test`);
  await field(page, "shop_digit").fill(v.店名略称3文字);
  await field(page, "short_name_jp").fill(v.店名);
  await field(page, "rank").fill("0");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }),
    page.getByRole("button", { name: "登録", exact: true }).click(),
  ]);
  await expectSaved(page, `店舗「${v.店名}」の登録`);
}

/** 店舗編集画面で、正本が定めた選択（店舗種別・公開・開店・売上集計の検索項目）になっていること */
async function expectStoreChoices(page: Page, id: string, v: M0409Store): Promise<void> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${id}`), { timeout: 120_000 });
  if (!res || !res.ok()) throw new Error(`店舗ID ${id} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  await expect(field(page, "shop_name"), `店舗ID ${id} の店名の欄`).toBeVisible({ timeout: 60_000 });
  const checked = async (label: string) => page.getByLabel(label, { exact: true }).isChecked();
  const got = {
    店名: (await field(page, "shop_name").inputValue()).trim(),
    店舗種別: (await checked("本店")) ? "本店" : (await checked("支店")) ? "支店" : "",
    公開: (await checked("公開")) ? "公開" : "",
    開店: (await checked("開店")) ? "開店" : "",
    売上集計の検索項目: (await checked("表示する")) ? "表示する" : "",
  };
  const want = { 店名: v.店名, 店舗種別: v.店舗種別, 公開: "公開", 開店: "開店", 売上集計の検索項目: "表示する" };
  const diff = (Object.keys(want) as (keyof typeof want)[]).filter((k) => got[k] !== want[k]).map((k) => `${k}: 「${got[k]}」（求めるのは「${want[k]}」）`);
  if (diff.length) throw new Error(`店舗「${v.店名}」（店舗ID ${id}）の内容が正本と違う: ${diff.join(" / ")}`);
}

/** この機能の店舗を、あれば内容を確かめて使い、無ければ店舗登録画面で登録する。店舗IDを返す */
export async function ensureM0409Store(page: Page, v: M0409Store, onIssue: (m: string) => void): Promise<string> {
  let id = await findOwnStore(page, v.店名);
  if (!id) {
    let failure = "";
    try {
      await createStore(page, v);
    } catch (e) {
      failure = (e as Error).message.split("\n")[0];
    }
    id = await findOwnStore(page, v.店名);
    if (!id) throw new Error(`店舗「${v.店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
    if (failure) onIssue(`店舗登録画面で「${v.店名}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
  }
  await expectStoreChoices(page, id, v);
  return id;
}

/** 正本の「承認権限なし」の管理者に使う権限の名前（正本は名前を決めていない） */
export const M0409_NO_APPROVAL_AUTHORITY = "M04-09試験権限（承認なし）";

/** 権限のマスターに試験用の権限を足し、権限管理でその権限の「承認権限」のチェックを外す（済んでいれば何もしない） */
export async function ensureNoApprovalAuthority(page: Page): Promise<void> {
  page.setDefaultTimeout(120_000);
  await ensureAuthorityMasterRow(page, M0409_NO_APPROVAL_AUTHORITY);
  await denyApprovalForAuthority(page, M0409_NO_APPROVAL_AUTHORITY);
}
