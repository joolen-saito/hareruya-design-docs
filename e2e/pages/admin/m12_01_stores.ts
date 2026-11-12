/**
 * M12-01 の印つきの店舗（大阪店・TC東京・休業店・非集計店・非公開店）を店舗登録画面で作る。
 * 依頼者決定 2026-11-11「店舗は新しく作って実行の印をつけてよい」。店名・ショップ名略称は、正本の店名に実行の印を付けた値（rc）。
 * 開発環境の店舗は変えない（足すだけ）。店舗一覧は店名の完全一致で探す。
 */
import { Page } from "@playwright/test";
import { rc, RUN_MARK } from "../../lib/run_marker";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { findTenantId } from "./tenant";

export type 店舗の定め = { 名前: string; 表示順: number; 公開: "公開" | "非公開"; 開店: "開店" | "閉店"; 売上集計: "表示する" | "表示しない"; カナ: string; 英語: string };

export const 店舗の定め一覧: 店舗の定め[] = [
  { 名前: "大阪店", 表示順: 10, 公開: "公開", 開店: "開店", 売上集計: "表示する", カナ: "オオサカテン", 英語: "Osaka" },
  { 名前: "TC東京", 表示順: 20, 公開: "公開", 開店: "開店", 売上集計: "表示する", カナ: "ティーシートウキョウ", 英語: "Tokyo" },
  { 名前: "休業店", 表示順: 30, 公開: "公開", 開店: "閉店", 売上集計: "表示する", カナ: "キュウギョウテン", 英語: "Closed" },
  { 名前: "非集計店", 表示順: 40, 公開: "公開", 開店: "開店", 売上集計: "表示しない", カナ: "ヒシュウケイテン", 英語: "Nosummary" },
  { 名前: "非公開店", 表示順: 50, 公開: "非公開", 開店: "開店", 売上集計: "表示する", カナ: "ヒコウカイテン", 英語: "Private" },
];

const 略称候補 = () => {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 3 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

async function 登録する(page: Page, d: 店舗の定め, 店名: string, 略称: string): Promise<void> {
  await page.goto(adminUrl("/mall/tenant/create"));
  const f = (name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);
  const url = `m1201${RUN_MARK.toLowerCase()}${d.表示順}`;
  await f("company_name").fill("試験用会社");
  await f("company_kana").fill("シケンヨウガイシャ");
  await f("shop_name").fill(店名);
  await f("shop_kana").fill(d.カナ);
  await f("shop_name_eng").fill(d.英語);
  await f("html_class_name").fill(url);
  await page.getByLabel("支店", { exact: true }).check();
  await page.getByLabel(d.公開, { exact: true }).check();
  await page.getByLabel(d.開店, { exact: true }).check();
  await page.getByLabel(d.売上集計, { exact: true }).check();
  await f("postal_code").fill("1600023");
  await chooseByLabel(page.locator('[name="mall_tenant_shop_master[address][pref]"]'), "東京都");
  await page.locator('[name="mall_tenant_shop_master[address][addr01]"]').fill("新宿区西新宿");
  await page.locator('[name="mall_tenant_shop_master[address][addr02]"]').fill("1-1-1");
  await f("phone_number").fill("0312345678");
  for (const m of ["email01", "email02", "email03", "email04"]) await f(m).fill(`${url}@example.test`);
  await f("shop_digit").fill(略称);
  await f("short_name_jp").fill(店名);
  await f("rank").fill(String(d.表示順));
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${店名}」の登録`);
}

/** 印つきの店舗があれば使い、無ければ店舗登録画面で作る。店舗ID・印つきの店名を返す */
export async function ensureM1201Store(page: Page, d: 店舗の定め, onIssue: (m: string) => void): Promise<{ id: string; 店名: string }> {
  const 店名 = rc(d.名前);
  const exist = await findTenantId(page, 店名);
  if (exist) return { id: exist, 店名 };
  let failure = "";
  for (let i = 0; i < 6; i++) {
    try { await 登録する(page, d, 店名, 略称候補()); } catch (e) { failure = (e as Error).message.split("\n")[0]; }
    const id = await findTenantId(page, 店名);
    if (id) {
      if (failure) onIssue(`店舗登録画面で「${店名}」を登録したとき、登録は行われたが画面は成功を表示しなかった（${failure}）`);
      onIssue(`読み替え: 正本の店舗「${d.名前}」は、実行の印つきの店舗「${店名}」（店舗ID ${id}・表示順${d.表示順}・${d.公開}・${d.開店}・売上集計の検索項目「${d.売上集計}」）を新しく作って使った`);
      return { id, 店名 };
    }
  }
  throw new Error(`店舗「${店名}」を登録できない: ${failure || "店舗一覧に出ない"}`);
}
