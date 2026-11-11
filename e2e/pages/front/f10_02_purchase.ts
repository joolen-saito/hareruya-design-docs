/**
 * F10-02 購入完了の売上連携（フロント アクセス解析）が使う、フロントの操作。セレクタ・アドレスはここだけに書く。
 * - ご注文方法指定画面（/shopping）と購入完了画面（/shopping/complete）は、日本語サイト（/ja）と英語サイト（/en）にある。
 * - 配送方法・支払方法を選ぶと画面が再読み込みされる（F04-02 の部品と同じ作り）。
 * 画面の作りはアプリのテンプレート（Shopping/index.twig・complete.twig）で確かめた。期待値はここに書かない。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { ShoppingPointArea } from "./f04_02_point";
import { ShoppingPage } from "./f04_shopping";

const PAYMENT = 'input[name="_shopping_order[Payment]"]';
const T = 30_000;

export const 入口 = { 日本語: "/ja", 英語: "/en" } as const;
export type 入口 = (typeof 入口)[keyof typeof 入口];

/** ご注文方法指定画面をアドレスで開く（手順「ご注文方法指定画面を開く」） */
export async function ご注文方法指定を開く(page: Page, 店: 入口 = 入口.日本語): Promise<void> {
  await page.goto(`${BASE_URL}${店}/shopping`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("load");
}

/** 購入完了画面をアドレスで開く（購入処理中の受注の控えが無いときは TOP 画面へ移る） */
export async function 購入完了画面を開く(page: Page, 店: 入口 = 入口.日本語): Promise<void> {
  await page.goto(`${BASE_URL}${店}/shopping/complete`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("load");
}

/** いまの画面が購入完了画面か */
export function 購入完了画面か(page: Page): boolean { return /\/shopping\/complete\/?(\?.*)?$/.test(new URL(page.url()).pathname + new URL(page.url()).search); }
/** いまの画面が TOP 画面か（日本語・英語のどちらでも） */
export function TOP画面か(page: Page): boolean { return /^\/(ja|en)?\/?$/.test(new URL(page.url()).pathname); }

async function 選んで読み直す(page: Page, radio: Locator): Promise<void> {
  if (await radio.isChecked()) return;
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), radio.check({ force: true, timeout: T })]);
  await page.waitForLoadState("load");
}

/** 配送方法の欄で、名前を含む選択肢を選ぶ（すでに選ばれていれば何もしない） */
export async function 配送方法を選ぶ(page: Page, 名前: string, what: string): Promise<void> {
  const sp = new ShoppingPage(page);
  const row = sp.配送方法の選択肢.locator("xpath=ancestor::label[1]").filter({ hasText: 名前 });
  if ((await row.count()) !== 1) throw new Error(`${what}: 配送方法の選択肢に「${名前}」が ${await row.count()} 件ある（ある選択肢: ${(await sp.配送方法の名前()).join("、")}）`);
  await 選んで読み直す(page, row.locator("input"));
}

/** 支払方法の欄で、名前の選択肢を選ぶ（すでに選ばれていれば何もしない） */
export async function 支払方法を選ぶ(page: Page, 名前: string, what: string): Promise<void> {
  const labels = await page.locator(PAYMENT).evaluateAll((ns) => ns.map((n) => ({
    value: (n as HTMLInputElement).value,
    label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
  })));
  const pick = labels.find((c) => c.label === 名前) ?? labels.find((c) => c.label.includes(名前));
  if (!pick) throw new Error(`${what}: 支払方法に「${名前}」が無い（ある選択肢: ${labels.map((c) => c.label).join("、")}）`);
  await 選んで読み直す(page, page.locator(`${PAYMENT}[value="${pick.value}"]`));
}

/** 「注文する」を押す前の確定のチェック（「この内容で注文を確定します。」）を入れる */
async function 確定のチェックを入れる(page: Page, what: string): Promise<Locator> {
  const accept = page.locator('input[name="_shopping_order[accept_order]"]');
  await expect(accept, `${what}: 「この内容で注文を確定します。」`).toHaveCount(1, { timeout: T });
  await accept.check({ force: true, timeout: T });
  const submit = page.locator("button[data-js-payment-submit]");
  await expect(submit, `${what}: 確定のチェックで注文のボタンが押せる`).toBeEnabled({ timeout: T });
  return submit;
}

/** ご注文方法指定画面の使用ポイントの欄で「使う」を選び、ポイントを入れる */
export async function 使用ポイントを入れる(page: Page, ポイント: number, what: string): Promise<void> {
  const area = new ShoppingPointArea(page);
  await expect(area.欄, `${what}: ポイントの欄`).toBeVisible({ timeout: T });
  await area.選ぶ("使う");
  await area.使用ポイント.fill(String(ポイント), { timeout: T });
  await area.使用ポイント.blur();
}

/** 「注文する」ボタンを押す。購入完了画面へ移らなければ、画面のエラーの文つきで落とす */
export async function 注文するを押す(page: Page, what: string): Promise<void> {
  const submit = await 確定のチェックを入れる(page, what);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), submit.click({ timeout: T })]);
  await page.waitForLoadState("load");
  if (!購入完了画面か(page)) {
    const errors = (await page.locator(".p-hareruya-message-box--error, .ec-alert-warning, .error, .c-hareruya-form-input__field-error--server").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    throw new Error(`${what}: 注文が確定しない（${page.url()}）: ${errors.join(" / ") || "画面にエラーの表示なし"}`);
  }
}

/** ページ先頭部（head）のHTMLの文（開発者ツールのコンソールで表示する代わりに、ページの中で読み出す） */
export async function 先頭部のHTML(page: Page): Promise<string> {
  await page.waitForLoadState("load");
  return page.evaluate(() => document.head.innerHTML);
}

/**
 * 購入完了画面を読み込む前に、ページ内の受け渡し領域（dataLayer）へ項目名・値の要素を1件だけ入れておく。
 * 購入完了画面（/shopping/complete）の文書が作られる前に入れる（それ以外の画面には入れない）。
 */
export async function 購入完了画面の読み込み前に受け渡し領域へ積む(page: Page, 項目名: string, 値: string): Promise<void> {
  await page.addInitScript(([k, v]) => {
    if (!/\/shopping\/complete\/?$/.test(location.pathname)) return;
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ [k]: v });
  }, [項目名, 値] as [string, string]);
}

/** ご注文方法指定画面の商品の行数（上から商品名・数量） */
export async function 注文の商品(page: Page): Promise<{ 商品名: string; 数量: string }[]> {
  return (await new ShoppingPage(page).商品の行()).map((r) => ({ 商品名: r.商品名, 数量: r.数量 }));
}
