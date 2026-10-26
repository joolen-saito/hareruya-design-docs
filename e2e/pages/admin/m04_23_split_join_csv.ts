/**
 * M04-23 在庫分割結合CSV登録の画面操作。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - 在庫分割結合検索/一覧の上部の「在庫分割結合」の枠に「在庫分割CSV登録」「在庫結合CSV登録」のボタンがあり、
 *   押すとそれぞれのモーダルが開く（Bootstrap のモーダル。画面のスクリプトの読み込みを待ってから押す）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type SplitJoinCsvKind = "在庫分割CSV登録" | "在庫結合CSV登録";
const MODAL_ID: Record<SplitJoinCsvKind, string> = { 在庫分割CSV登録: "#modalSplitCsv", 在庫結合CSV登録: "#modalJoinCsv" };

/** 在庫分割結合検索/一覧を開く（メニューから開くのと同じ画面） */
export async function openSplitJoinList(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/split-join"));
  expect(res?.status(), "在庫分割結合検索/一覧の応答").toBe(200);
  await expect(page.getByRole("button", { name: "在庫分割CSV登録", exact: true }), "在庫分割結合検索/一覧の画面").toBeVisible();
  await page.waitForLoadState("load");
}

/** 「在庫分割CSV登録」「在庫結合CSV登録」のボタンを押す */
export async function pressSplitJoinCsvButton(page: Page, kind: SplitJoinCsvKind): Promise<void> {
  const button = page.getByRole("button", { name: kind, exact: true });
  await expect(button, `「${kind}」ボタンは1つ`).toHaveCount(1);
  await button.click();
}

/** モーダルと、その見出し */
export function splitJoinCsvModal(page: Page, kind: SplitJoinCsvKind): { modal: Locator; title: Locator } {
  const modal = page.locator(MODAL_ID[kind]);
  return { modal, title: modal.locator(".modal-title") };
}
