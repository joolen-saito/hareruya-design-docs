/** F06-07 購入履歴詳細の試験注文を、管理画面の受注情報編集で整える部品（支払方法・受注ステータス・単価・住所3） */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { OrderEditPage } from "./m05_11_order_edit";

/** 支払方法の選択肢の値（受注情報編集の支払方法の選択欄） */
export const 支払方法の値: Record<string, string> = { 郵便振替: "1", 銀行振込: "3", 代金引換: "4", "クレジットカード決済（GMO）": "8" };

export async function 受注を開く(page: Page, 注文番号: string, 本店: string): Promise<{ p: OrderEditPage; 注文ID: string }> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(注文番号, 本店);
  const 注文ID = /\/order\/(\d+)\/edit/.exec(page.url())?.[1] ?? "";
  if (!注文ID) throw new Error(`注文番号 ${注文番号} の受注情報編集画面のアドレスから注文IDを読めない（${page.url()}）`);
  return { p, 注文ID };
}
export async function 受注を開き直す(page: Page, 注文ID: string): Promise<OrderEditPage> {
  await page.goto(adminUrl(`/order/${注文ID}/edit`));
  await page.waitForLoadState("load");
  return new OrderEditPage(page);
}
export async function 支払方法を変える(page: Page, p: OrderEditPage, 支払方法: string): Promise<void> {
  const v = 支払方法の値[支払方法];
  if (!v) throw new Error(`支払方法「${支払方法}」の選択肢の値を知らない`);
  await p.お支払情報を開く();
  await page.locator("#order_Payment").selectOption({ value: v }, { timeout: 20_000 });
  await p.受注情報を登録する(() => undefined);
}
/** 変更後のステータスを選んで「変更」を押す（入金済みにすると入金日が入る） */
export async function ステータスを変える(page: Page, 注文ID: string, ステータス: string): Promise<void> {
  const p = await 受注を開き直す(page, 注文ID);
  await p.ステータスを選ぶ(ステータス);
  await p.ステータスを変更する(() => undefined);
}
/** 入金日が入っていれば「クリア」を押す。押したかを返す */
export async function 入金日をクリアする(page: Page, 注文ID: string): Promise<boolean> {
  await 受注を開き直す(page, 注文ID);
  const clear = page.locator('button.clear-date[data-target="payment_date"]');
  if ((await clear.count()) === 0) return false;
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => undefined), clear.first().click({ timeout: 20_000 })]);
  await page.waitForLoadState("load");
  return true;
}
/** 先頭明細の単価を、いまの値と違う値にして登録する。変えた単価を返す */
export async function 先頭明細の単価を変える(page: Page, 注文ID: string): Promise<{ 前: string; 後: string }> {
  const p = await 受注を開き直す(page, 注文ID);
  const price = page.locator('#table-form-field tr.item_box input[name$="[price]"]').first();
  const 前 = await price.inputValue({ timeout: 20_000 });
  const 後 = String(Math.round(Number(前.replace(/,/g, "")) + 100));
  await p.先頭明細の価格(後);
  await p.受注情報を登録する(() => undefined);
  return { 前, 後 };
}
export async function 住所3を入れる(page: Page, 注文ID: string, 送り主: string, お届け先: string): Promise<void> {
  const p = await 受注を開き直す(page, 注文ID);
  await p.注文者情報を開く();
  await p.注文者住所3.fill(送り主, { timeout: 20_000 });
  await p.お届け先情報を開く();
  await p.お届け先住所3.fill(お届け先, { timeout: 20_000 });
  await p.受注情報を登録する(() => undefined);
}
