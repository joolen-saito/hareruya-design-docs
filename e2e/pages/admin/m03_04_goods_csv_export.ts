/**
 * M03-04 グッズ商品CSV出力のケースで使う画面操作。
 * 「グッズ商品CSV出力」ボタンは、商品マスター(検索結果)の一覧のフォーム（選んだ商品IDを送る）にある。
 */
import { expect, Locator, Page, Request } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { ProductSearchPage } from "./product_search";

/** 商品一覧の「グッズ商品CSV出力」ボタン（一覧のフォームの中） */
export const goodsCsvExportButton = (page: Page): Locator =>
  page.locator("#form_bulk button[type=submit]").filter({ hasText: /^\s*グッズ商品CSV出力\s*$/ });

/** 商品一覧の一覧のフォームで選ばれている商品の数 */
export const checkedProductCount = (page: Page): Promise<number> =>
  page.locator('#form_bulk input[name="ids[]"]:checked').count();

/** 既定の検索条件のまま「検索する >」を押し、商品マスター(検索結果)を出す */
export async function searchWithInitialConditions(page: Page): Promise<void> {
  await new ProductSearchPage(page).submitAndWaitForResult();
}

/** 管理画面上部のエラーの帯の文 */
export async function topErrors(page: Page): Promise<string[]> {
  return (await page.locator(".alert-danger").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** 一覧のフォームの送信先（グッズ商品CSV出力ボタンの送信先）と送信項目の名前を、画面の要素から読む（開発者ツールで見るのと同じもの） */
export async function readExportForm(page: Page): Promise<{ 送信先: string; 方式: string; 送信項目: string[] }> {
  const button = goodsCsvExportButton(page);
  await expect(button, "グッズ商品CSV出力ボタン").toHaveCount(1);
  const 送信先 = (await button.evaluate((b) => (b as HTMLButtonElement).formAction)) ?? "";
  const 方式 = await page.locator("#form_bulk").evaluate((f) => (f as HTMLFormElement).method);
  const 送信項目 = await page.locator("#form_bulk").evaluate((f) => [...new Set([...(f as HTMLFormElement).elements]
    .map((e) => (e as HTMLInputElement).name).filter(Boolean))]);
  return { 送信先, 方式, 送信項目 };
}

/**
 * 画面の中に送信用のフォームを作り、Referer を付けない指定（参照元を送らない）にして、送信先へ ids[] を送る。
 * 送った要求の Referer の有無を返す。送信のあと移った画面の読み込みまで待つ。
 */
export async function postIdsWithoutReferer(page: Page, action: string, ids: string[]): Promise<{ referer: string | undefined; 応答: number }> {
  const sent = page.waitForRequest((r) => r.method() === "POST" && r.url() === action);
  const nav = page.waitForNavigation({ waitUntil: "load" });
  await page.evaluate(([to, values]) => {
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    const form = document.createElement("form");
    form.method = "post";
    form.action = to as string;
    form.setAttribute("rel", "noreferrer");
    for (const v of values as string[]) {
      const i = document.createElement("input");
      i.type = "hidden"; i.name = "ids[]"; i.value = v;
      form.appendChild(i);
    }
    document.body.appendChild(form);
    form.submit();
  }, [action, ids] as const);
  const req: Request = await sent;
  const res = await req.response();
  await nav;
  return { referer: (await req.allHeaders())["referer"], 応答: res?.status() ?? 0 };
}

/** 商品一覧（商品マスター）画面の検索欄のフォームが表示されていること */
export async function expectProductListScreen(page: Page, what: string): Promise<void> {
  await expect.soft(page.locator("form#search_form"), `${what}: 商品一覧画面の検索欄`).toBeVisible();
}

export const productListPath = (pageNo?: number) => adminUrl(pageNo === undefined ? "/product" : `/product/page/${pageNo}`);
