/**
 * M03-05 セール用価格変更CSV出力のケースで使う画面操作。
 * 「セール用価格変更CSV出力」ボタンは、商品マスター(検索結果)の一覧のフォーム（選んだ商品IDを送る）にある（グッズ商品CSV出力ボタンの隣）。
 * 検索・一覧の選択・ページ移動・選択済み商品IDの書き換えは、M03-04 の部品（pages/admin/m03_04_x.ts）をそのまま使う。
 */
import { Download, Locator, Page } from "@playwright/test";
import { topErrors } from "./m03_04_goods_csv_export";
import type { 出力の結果 } from "./m03_04_x";

/** 商品一覧の「セール用価格変更CSV出力」ボタン（一覧のフォームの中） */
export const 価格CSV出力ボタン = (page: Page): Locator =>
  page.locator("#form_bulk button[type=submit]").filter({ hasText: /^\s*セール用価格変更CSV出力\s*$/ });

async function 中身(d: Download): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of await d.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return Buffer.concat(chunks);
}

/** 上部のエラーの帯を読む。読む途中で画面が移ったら、読み込みを待って1度だけ読み直す */
async function 誤りを読む(page: Page): Promise<string[]> {
  try { return await topErrors(page); } catch (e) {
    if (!/Execution context was destroyed|navigation/i.test(String(e))) throw e;
    await page.waitForLoadState("load");
    return topErrors(page);
  }
}

/** 「セール用価格変更CSV出力」を押し、ダウンロードと応答を受け取る（ダウンロードにならなければ、移った画面まで待つ） */
export async function 価格CSV出力を押す(page: Page): Promise<出力の結果> {
  const resP = page.waitForResponse((r) => r.request().method() === "POST" && /product_price_csv_export/.test(r.url()), { timeout: 120_000 }).catch(() => null);
  const dlP = page.waitForEvent("download", { timeout: 120_000 }).catch(() => null);
  await 価格CSV出力ボタン(page).click();
  const res = await resP;
  const 状態 = res?.status() ?? 0;
  const headers = res ? await res.allHeaders() : {};
  const 型 = headers["content-type"] ?? "";
  let ファイル: 出力の結果["ファイル"] = null;
  if (状態 === 200 && /attachment|csv/i.test(`${headers["content-disposition"] ?? ""} ${型}`)) {
    const d = await dlP;
    if (d) ファイル = { 名前: d.suggestedFilename(), 中身: await 中身(d) };
  } else {
    // 誤りのときアプリは参照元へリダイレクトする。応答（3xx）を受けた時点ではまだ元の画面なので、移った先の読み込みを待つ
    const location = headers["location"] ?? "";
    if (状態 >= 300 && 状態 < 400 && location) {
      const to = new URL(location, page.url()).toString();
      await page.waitForURL((u) => u.toString() === to, { waitUntil: "load", timeout: 60_000 }).catch(() => undefined);
    }
    await page.waitForLoadState("load");
  }
  return { ファイル, 状態, 型, 移った先: page.url(), 誤り: await 誤りを読む(page) };
}
