/**
 * M03-03 カード商品CSV出力（商品一覧の「カード商品CSV出力」ボタン）の画面操作。セレクタはここにだけ書く。正本: cases/M03-03_test_cases.tsv
 * 商品一覧の部品は ProductSearchPage（検索）・m03_04_goods_csv_export（一覧のフォームの読み方）を使う。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { csvRecords, decodeCsvBytes } from "../../lib/csv";

const T = 30_000;

/** 商品一覧の「カード商品CSV出力」ボタン（一覧のフォームの中） */
export const カード商品CSV出力ボタン = (page: Page): Locator =>
  page.locator("#form_bulk button[type=submit]").filter({ hasText: /^\s*カード商品CSV出力\s*$/ });

/** 検索結果の行（商品ID） */
export const 商品の行 = (page: Page, 商品ID: string): Locator => page.locator(`tr#ex-product-${商品ID}`);

/** 商品IDの行を選ぶ（チェックを付ける） */
export async function 商品を選ぶ(page: Page, 商品ID: string): Promise<void> {
  const box = 商品の行(page, 商品ID).locator('input[name="ids[]"]');
  await expect(box, `商品ID ${商品ID} の選択欄`).toHaveCount(1, { timeout: T });
  await box.check({ timeout: T });
}

/** 一覧のフォームで選ばれている商品IDの値 */
export async function 選択中の商品ID(page: Page): Promise<string[]> {
  return page.locator('#form_bulk input[name="ids[]"]:checked').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
}

/** 開発者ツールの操作の代わりに、一覧のフォームの選択済み商品IDを書き換える（チェックの付いた欄の値を置き換える） */
export async function 選択済み商品IDを置き換える(page: Page, 新しい値: string): Promise<number> {
  return page.locator('#form_bulk input[name="ids[]"]:checked').evaluateAll((els, v) => { els.forEach((e) => { (e as HTMLInputElement).value = v as string; }); return els.length; }, 新しい値);
}

/** 開発者ツールの操作の代わりに、一覧のフォームへ選択済み商品IDを1つ足す（隠し項目） */
export async function 選択済み商品IDを足す(page: Page, 値: string): Promise<void> {
  await page.locator("#form_bulk").evaluate((f, v) => {
    const i = document.createElement("input");
    i.type = "hidden"; i.name = "ids[]"; i.value = v as string;
    f.appendChild(i);
  }, 値);
}

export type 出力の結果 = {
  ダウンロード: { ファイル名: string; 先頭バイト: number[]; 本文: string; 行: Record<string, string>[]; 応答の種類: string } | null;
  押したあとのアドレス: string;
};

/**
 * 「カード商品CSV出力」ボタンを押す。ダウンロードが始まればファイルを読んで返し、始まらなければ（画面が移る・変わらない）ダウンロード無しで返す。
 * ダウンロードの応答の種類（Content-Type）も控える。
 */
export async function カード商品CSV出力を押す(page: Page, 待つ秒 = 20): Promise<出力の結果> {
  const button = カード商品CSV出力ボタン(page);
  await expect(button, "カード商品CSV出力ボタン").toHaveCount(1, { timeout: T });
  let 応答の種類 = "";
  const onResponse = (r: import("@playwright/test").Response) => {
    if (r.request().method() === "POST" && /product_card_csv_export/.test(r.url())) 応答の種類 = r.headers()["content-type"] ?? "";
  };
  page.on("response", onResponse);
  try {
    const download = page.waitForEvent("download", { timeout: 待つ秒 * 1000 }).catch(() => null);
    await button.click({ timeout: T, noWaitAfter: true });
    const got = await download;
    if (!got) {
      await page.waitForLoadState("load");
      return { ダウンロード: null, 押したあとのアドレス: page.url() };
    }
    const stream = await got.createReadStream();
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    const bytes = Buffer.concat(chunks);
    const 本文 = decodeCsvBytes(bytes);
    return { ダウンロード: { ファイル名: got.suggestedFilename(), 先頭バイト: [...bytes.subarray(0, 3)], 本文, 行: csvRecords(本文), 応答の種類 }, 押したあとのアドレス: page.url() };
  } finally { page.off("response", onResponse); }
}

/** 商品一覧の結果の表示件数の選択欄で、指定の件数（例 10）を選ぶ。選ぶと画面が開き直る */
export async function 表示件数を選ぶ(page: Page, 件数: number): Promise<void> {
  const sel = page.locator("#page_count_pulldown");
  await sel.scrollIntoViewIfNeeded();
  const label = await sel.locator("option").evaluateAll((os, n) => (os as HTMLOptionElement[]).map((o) => (o.textContent ?? "").trim()).find((t) => new RegExp(`^${n}\\D*$`).test(t)) ?? "", 件数);
  if (!label) throw new Error(`表示件数の選択欄に ${件数} 件が無い`);
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), sel.selectOption({ label })]);
}

/** 結果のページ送りで、ページ番号のリンクを押す */
export async function ページを開く(page: Page, 番号: number): Promise<void> {
  const link = page.locator(".pagination a, ul.pagination a").filter({ hasText: new RegExp(`^\\s*${番号}\\s*$`) }).first();
  await expect(link, `${番号}ページ目へのリンク`).toBeVisible({ timeout: T });
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), link.click()]);
}

export const 商品一覧のパス = (): string => new URL(adminUrl("/product")).pathname;
