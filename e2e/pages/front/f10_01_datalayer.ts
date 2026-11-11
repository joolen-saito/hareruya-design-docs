/**
 * F10-01 会員IDの連携（フロント）の画面操作。セレクタ・アドレスはここだけに書く。正本: cases/F10-01_test_cases.tsv
 * - 受け渡し領域（ページの dataLayer）は、開発者ツールのコンソールで表示する代わりに、ページの中でその値を読み出す。
 * - ログイン・ログアウトは F06-03 の部品（pages/front/f06_03_login.ts）を使う。商品詳細・買い物かごは F03-02 の部品を使う。
 * 画面の作りはアプリのテンプレート（Mypage/online_identification.twig ほか）で確かめた。期待値はここに書かない。
 */
import { expect, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** 受け渡し領域の要素1つ（項目名の並び・uid の型と値・中身の文） */
export type 受け渡しの要素 = { 項目名: string[]; uidあり: boolean; uidの型: string; uidの値: string; 文: string };
export type 受け渡し領域 = { 型: string; 配列か: boolean; 要素: 受け渡しの要素[] };

/** ページの受け渡し領域（dataLayer）の中身を読む。用意されていなければ、要素は空で型だけを返す */
export async function 受け渡し領域を読む(page: Page): Promise<受け渡し領域> {
  await page.waitForLoadState("load");
  return page.evaluate(() => {
    const dl = (window as unknown as { dataLayer?: unknown }).dataLayer;
    const 型 = typeof dl;
    if (!Array.isArray(dl)) return { 型, 配列か: false, 要素: [] };
    const 文にする = (e: unknown): string => {
      try {
        const s = JSON.stringify(e, (_k, v) => (typeof v === "function" ? "[関数]" : v));
        return s === undefined ? String(e) : s;
      } catch { return String(e); }
    };
    return {
      型, 配列か: true,
      要素: dl.map((e: unknown) => {
        const obj = e !== null && typeof e === "object" ? (e as Record<string, unknown>) : null;
        const 項目名 = obj ? Object.keys(obj) : [];
        const uidあり = !!obj && Object.prototype.hasOwnProperty.call(obj, "uid");
        const v = uidあり ? obj!.uid : undefined;
        return { 項目名, uidあり, uidの型: uidあり ? typeof v : "", uidの値: uidあり ? String(v) : "", 文: 文にする(e) };
      }),
    };
  });
}

/** コンソールで `typeof dataLayer` を実行した結果に当たる文 */
export async function 受け渡し領域の型(page: Page): Promise<string> {
  await page.waitForLoadState("load");
  return page.evaluate(() => typeof (window as unknown as { dataLayer?: unknown }).dataLayer);
}

/** 公開側の画面を開く（言語の入口＋パス） */
async function 開く(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`, { timeout: 60_000, waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
}
export const 本店ECTOPを開く = (page: Page, 言語: "ja" | "en" = "ja") => 開く(page, `/${言語}/`);
export const 商品一覧を開く = (page: Page) => 開く(page, "/ja/products/search");
export const マイページを開く = (page: Page) => 開く(page, "/ja/mypage");
export const 英語のログイン画面を開く = (page: Page) => 開く(page, "/en/mypage/login");
/** 追加ページの公開URL（シードが控えたもの）を開く */
export async function 公開URLを開く(page: Page, url: string): Promise<number> {
  const res = await page.goto(url, { timeout: 60_000, waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}

// ---- オンライン本人確認（スマートフォン版） ----
export async function オンライン本人確認を開く(page: Page): Promise<void> { await 開く(page, "/ja/mypage/identification"); }
/** 撮影する身分証の種類を選んで「撮影画面へ」を押し、撮影画面へ移るのを待つ */
export async function 身分証を選んで撮影画面へ(page: Page, 種類: string): Promise<void> {
  const form = page.locator('form[action$="/mypage/identification/photograph"]');
  await expect(form, "オンライン本人確認の身分証の選択欄").toHaveCount(1, { timeout: 30_000 });
  await form.locator('select[name="identification_select[Identification]"]').selectOption({ label: 種類 }, { timeout: 30_000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
    form.locator("button[type=submit]").filter({ hasText: "撮影画面へ" }).click({ timeout: 30_000 }),
  ]);
  await page.waitForLoadState("load");
}
