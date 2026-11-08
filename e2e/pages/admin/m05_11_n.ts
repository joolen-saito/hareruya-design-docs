/** M05-11 受注情報編集（連携・価格差異・店頭販売用整理番号）の確かめで使う画面操作。セレクタはここにだけ書く */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 会員情報編集画面の「累計注文金額」「累計注文回数」の表示（数字だけにして返す） */
export async function 会員の累計(page: Page, 会員ID: string): Promise<{ 金額: number; 回数: number }> {
  await page.goto(adminUrl(`/customer/${会員ID}/edit`));
  await page.waitForLoadState("load");
  const read = async (label: string): Promise<number> => {
    const col = page.locator(`div.row:has(> div.col-3 > span:text-is("${label}")) > div.col`).first();
    await expect(col, `会員情報編集画面の「${label}」`).toBeVisible({ timeout: 30_000 });
    return Number(((await col.innerText()) ?? "").replace(/[^\d]/g, ""));
  };
  return { 金額: await read("累計注文金額"), 回数: await read("累計注文回数") };
}

/** 会員検索一覧で会員ID（呼び名で控えた番号）を検索し、結果の会員名を押して会員情報編集画面を開く */
export async function 会員検索から会員編集を開く(page: Page, 会員ID: string): Promise<void> {
  await page.goto(adminUrl("/customer"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_customer[multi]"]').fill(会員ID, { timeout: 20_000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click({ timeout: 20_000 }),
  ]);
  await page.waitForLoadState("load");
  const row = page.locator(`tr#ex-customer-${会員ID}`);
  await expect(row, `会員検索一覧の会員ID ${会員ID} の行`).toHaveCount(1);
  await Promise.all([
    page.waitForURL(new RegExp(`/customer/${会員ID}/edit`)),
    row.locator(`a[href$="/customer/${会員ID}/edit"]`).first().click({ timeout: 20_000 }),
  ]);
  await page.waitForLoadState("load");
}

/** 会員情報編集画面の「ポイント確認」を押してポイント履歴確認画面を開く */
export async function ポイント確認を開く(page: Page): Promise<void> {
  await Promise.all([
    page.waitForURL(/\/customer\/point\/\d+\/history/),
    page.getByRole("link", { name: "ポイント確認" }).first().click({ timeout: 20_000 }),
  ]);
  await page.waitForLoadState("load");
}

/** ポイント履歴確認画面の、注文番号の列が一致する行の「ポイント増減量」（行ごと） */
export async function ポイント履歴の増減量(page: Page, 注文番号: string): Promise<string[]> {
  const heads = await page.locator("table thead th").evaluateAll((ths) => ths.map((th) => ((th as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim()));
  const no = heads.findIndex((h) => h.includes("注文番号"));
  const pt = heads.findIndex((h) => h.includes("ポイント") && h !== "");
  const ch = heads.findIndex((h) => h.includes("増減"));
  const col = ch >= 0 ? ch : pt;
  if (no < 0 || col < 0) throw new Error(`ポイント履歴確認画面の見出しを読めない（${heads.join(" / ")}）`);
  const rows = await page.locator("table tbody tr").evaluateAll((trs) => trs.map((tr) => Array.from(tr.querySelectorAll(":scope > td")).map((td) => ((td as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim())));
  return rows.filter((r) => r[no] === 注文番号).map((r) => r[col]);
}

/** 受注情報編集画面の「店頭販売用整理番号」の表示（文字とリンクか）。出ていなければ null */
export async function 整理番号の表示(page: Page): Promise<{ 文字: string; リンク: boolean } | null> {
  const col = page.locator('div.row:has(> div.col-3:has-text("店頭販売用整理番号")) > div.col').first();
  if ((await col.count()) === 0) return null;
  return { 文字: ((await col.innerText()) ?? "").replace(/\s+/g, " ").trim(), リンク: (await col.locator("a").count()) > 0 };
}
