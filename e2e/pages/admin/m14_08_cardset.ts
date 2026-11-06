/** M14-08 カードセット詳細（登録・編集・削除）画面の操作。既存の m14-08.spec.ts の局所関数と同じ作りを、後続の spec・シードから使えるようにしたもの */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export const 欄 = (page: Page, n: string) => page.locator(`[name="admin_cardset[${n}]"]`);

export async function 登録画面を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/cardset/new"));
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), "カードセット詳細（登録）画面").toBeVisible();
}

export async function 編集画面を開く(page: Page, id: string): Promise<void> {
  const res = await page.goto(adminUrl(`/cardset/${id}/edit`));
  await page.waitForLoadState("load");
  if (!res || !res.ok()) throw new Error(`カードセット詳細（編集・削除）画面を開けない（ID ${id}、応答 ${res?.status() ?? "なし"}）`);
  await expect(page.locator("form#form1"), "カードセット詳細（編集・削除）画面").toBeVisible();
}

/** 「登録」ボタンを押す。ブラウザの入力チェックが送信を止めたら sent=false */
export async function 登録を押す(page: Page): Promise<{ sent: boolean; url: string }> {
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).then(() => true, () => false);
  await page.locator("form#form1 button[type=submit]").filter({ hasText: /^\s*登録\s*$/ }).click({ timeout: 20_000, noWaitAfter: true });
  const sent = await nav;
  return { sent, url: page.url() };
}

export type カードセット入力 = { 名日: string; 名英: string; 略称: string; リリース日?: string; ブロック?: string; 特殊?: boolean };

/** 入力欄に値を入れる（リリース日は入力欄の形式 yyyy-mm-dd） */
export async function 入力する(page: Page, v: Partial<カードセット入力>): Promise<void> {
  if (v.名日 !== undefined) await 欄(page, "nameJp").fill(v.名日);
  if (v.名英 !== undefined) await 欄(page, "nameEn").fill(v.名英);
  if (v.略称 !== undefined) await 欄(page, "code").fill(v.略称);
  if (v.リリース日 !== undefined) await 欄(page, "releaseDate").fill(v.リリース日);
  if (v.ブロック !== undefined) await 欄(page, "Cardsetblock").selectOption({ label: v.ブロック });
  if (v.特殊 !== undefined) await 欄(page, "specialFlg").setChecked(v.特殊);
}

/** 画面でカードセットを登録し、カードセットID（登録後の編集画面のアドレス）を返す */
export async function カードセットを登録する(page: Page, v: カードセット入力, what: string): Promise<string> {
  await 登録画面を開く(page);
  await 入力する(page, { リリース日: "2025-09-18", ...v });
  const r = await 登録を押す(page);
  const id = /\/cardset\/(\d+)\/edit/.exec(r.url)?.[1];
  if (!r.sent || !id) throw new Error(`${what}: カードセット「${v.名日}」を登録できない（${r.url}）`);
  return id;
}

/** 削除ボタン → ポップアップの「実行」 */
export async function 削除を実行する(page: Page): Promise<void> {
  await page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]').click({ timeout: 20_000 });
  const modal = page.locator("#DeleteModal");
  await expect(modal, "削除の確認ポップアップ").toBeVisible();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }),
    modal.locator('[data-method="delete"]').click({ timeout: 20_000 }),
  ]);
}

/** 画面の削除ボタンでカードセットを1件消す（試験で作ったカードセットだけに使う） */
export async function 画面でカードセットを消す(page: Page, id: string): Promise<void> {
  await 編集画面を開く(page, id);
  await 削除を実行する(page);
}
