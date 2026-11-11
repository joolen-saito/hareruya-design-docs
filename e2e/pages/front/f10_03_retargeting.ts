/**
 * F10-03 閲覧商品の連携（フロント アクセス解析）の画面操作。セレクタ・アドレスはここだけに書く。正本: cases/F10-03_test_cases.tsv
 * - 受け渡し領域（ページの dataLayer）は F10-01 の部品（pages/front/f10_01_datalayer.ts）で読み、要素ごとの値を読み直す。
 * - 商品詳細・買い物かごの画面は F03-02 の部品（pages/front/f03_02_detail.ts）を使う。
 * 画面の作りはアプリのテンプレート（Product/detail.twig・Cart/index.twig・Mypage/index.twig）で確かめた。期待値はここに書かない。
 * - 商品詳細の言語の切替（言語のボタン）と、状態の欄の商品規格の切替（状態の欄のリンク）は、カードの商品にだけ出る作り。
 *   出ていなければ「画面で切り替えられない」として落とす（操作をせずに先へ進めない）。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { FrontCart, FrontDetail } from "./f03_02_detail";
import { 受け渡し領域を読む } from "./f10_01_datalayer";

/** 店の入口（本店の日本語サイト・英語サイト） */
export const 入口 = { 日本語: "/ja", 英語: "/en" } as const;
export type 入口 = (typeof 入口)[keyof typeof 入口];

// ---------------------------------------------------------------------------
// 受け渡し領域
// ---------------------------------------------------------------------------

/** 受け渡し領域の要素1つ（積まれた順の番号・項目名・値） */
export type 積まれた要素 = { 番号: number; 項目名: string[]; 値: Record<string, unknown>; 文: string };
export type 読んだ領域 = { 型: string; 配列か: boolean; 要素: 積まれた要素[] };

/** ページの受け渡し領域を読み、要素ごとの項目の値を返す（読めない要素は値を空にする） */
export async function 受け渡し領域の要素(page: Page): Promise<読んだ領域> {
  const d = await 受け渡し領域を読む(page);
  return {
    型: d.型, 配列か: d.配列か,
    要素: d.要素.map((e, i) => {
      let 値: Record<string, unknown> = {};
      try {
        const v = JSON.parse(e.文) as unknown;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) 値 = v as Record<string, unknown>;
      } catch { /* 文にできない要素は値を空にする */ }
      return { 番号: i, 項目名: e.項目名, 値, 文: e.文 };
    }),
  };
}

/** 項目名を持つ要素（積まれた順） */
export function 項目を持つ要素(d: 読んだ領域, 項目名: string): 積まれた要素[] {
  return d.要素.filter((e) => e.項目名.includes(項目名));
}

// ---------------------------------------------------------------------------
// 商品詳細
// ---------------------------------------------------------------------------

/** 商品IDで商品詳細画面を開く（言語 lang・商品規格 class の指定は query）。応答を返す */
export async function 商品詳細を開く(page: Page, 店: 入口, 商品ID: string, query: { lang?: string; class?: string } = {}): Promise<Response | null> {
  const q: Record<string, string> = {};
  if (query.lang) q.lang = query.lang;
  if (query.class) q.class = query.class;
  return new FrontDetail(page).open(店, 商品ID, q);
}

/** 表示中の価格・在庫の表で、商品規格IDの行（送信用の数量の欄の名前で引く） */
function 規格の行(page: Page, 規格ID: string): Locator {
  return page.locator('table.p-hareruya-product-detail__table[id^="priceTable-"]:visible tbody tr')
    .filter({ has: page.locator(`input.qty-input[name="quantity_${規格ID}"], input.qty-input[name$="[quantity_${規格ID}]"]`) });
}

/**
 * 開いている商品詳細画面で、数量を入れて「カートに入れる」を押す。規格IDを指定すると、その商品規格の行に数量を入れ、
 * ほかの行の数量は0にする（グッズの商品は状態の欄が出ないので、行は商品規格IDで選ぶ）。規格IDが無ければ、表の行が1行であること。
 */
export async function 数量を入れてカートに入れる(page: Page, 商品ID: string, a: { 数量: number; 規格ID?: string }, what: string): Promise<void> {
  await page.waitForLoadState("load");
  const form = page.locator(`form#productForm${商品ID}`);
  await expect(form, `${what}: 商品詳細の画面（商品ID ${商品ID}）`).toHaveCount(1, { timeout: 30_000 });
  const rows = form.locator('table.p-hareruya-product-detail__table[id^="priceTable-"]:visible tbody tr');
  let target: Locator;
  if (a.規格ID) {
    target = 規格の行(page, a.規格ID);
    await expect(target, `${what}: 商品規格ID ${a.規格ID} の行（数量を入れられる行）`).toHaveCount(1, { timeout: 30_000 });
  } else {
    await expect(rows, `${what}: 数量を入れられる商品規格の行は1行`).toHaveCount(1, { timeout: 30_000 });
    target = rows.first();
  }
  const n = await rows.count();
  for (let i = 0; i < n; i++) {
    const r = rows.nth(i);
    const qty = r.locator(".qty-label");
    if ((await qty.count()) === 0) continue;
    const isTarget = await r.evaluate((el, t) => el === t, await target.elementHandle());
    await qty.fill(isTarget ? String(a.数量) : "0", { timeout: 20_000 });
    await qty.blur();
  }
  await expect(target.locator(".qty-input"), `${what}: 入れた数量が送信用の欄へ写る`).toHaveValue(String(a.数量));
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/products/add_cart/${商品ID}`) && r.request().method() === "POST", { timeout: 60_000 }),
    form.locator("button.add-cart").dispatchEvent("click"),
  ]);
  if (res.status() >= 400) throw new Error(`${what}: カートへの追加の応答が ${res.status()}`);
  const body = await res.json().catch(() => null) as { done?: boolean; messages?: string[] } | null;
  if (body && body.done === false) throw new Error(`${what}: カートに入れられない: ${(body.messages ?? []).join(" / ")}`);
}

/** 画面上の商品規格の切替（状態の欄のリンク）を押す。リンクが無ければ落とす */
export async function 画面で商品規格を切り替える(page: Page, 規格ID: string): Promise<void> {
  const link = page.locator(`table.p-hareruya-product-detail__table:visible a.productClassChange[data-classid="${規格ID}"]`);
  if ((await link.count()) === 0) {
    throw new Error(`商品詳細画面に、商品規格（商品規格ID ${規格ID}）へ切り替える操作（状態の欄のリンク）が無い。画面で商品規格を切り替えられない`);
  }
  await link.first().click({ timeout: 30_000 });
  await page.waitForLoadState("load");
  await page.waitForTimeout(1000);
}

/** 画面上の商品の表示言語の切替（言語のボタン。言語コード JP・EN）を押す。ボタンが無ければ落とす */
export async function 画面で言語を切り替える(page: Page, 言語コード: string): Promise<void> {
  const btn = page.locator(`.p-hareruya-product-detail__lang-tabs button.c-hareruya-lang-btn[data-language="${言語コード}"]`);
  if ((await btn.count()) === 0) {
    throw new Error(`商品詳細画面に、表示言語を ${言語コード} へ切り替える操作（言語のボタン）が無い。画面で表示言語を切り替えられない`);
  }
  await btn.first().click({ timeout: 30_000 });
  await page.waitForLoadState("load");
  await page.waitForTimeout(1000);
}

// ---------------------------------------------------------------------------
// 買い物かご
// ---------------------------------------------------------------------------

export async function 買い物かごを開く(page: Page, 店: 入口 = 入口.日本語): Promise<Response | null> {
  return new FrontCart(page).open(店);
}
/** 買い物かごの明細（上から順。商品名の文・数量） */
export async function 買い物かごの明細(page: Page): Promise<{ 商品名: string; 数量: string }[]> {
  return new FrontCart(page).行();
}

/** 買い物かごの明細のうち、商品名の行の数量の加算ボタンを押し、数量の更新の応答を待つ */
export async function 数量の加算を押す(page: Page, 商品名: string, what: string): Promise<void> {
  const item = page.locator(".p-hareruya-cart-item").filter({ has: page.locator(".p-hareruya-cart-item__name-text", { hasText: 商品名 }) });
  await expect(item, `${what}: 買い物かごの「${商品名}」の明細`).toHaveCount(1, { timeout: 30_000 });
  const up = item.locator('button.c-hareruya-btn-quantity[data-operation="up"]');
  await expect(up, `${what}: 数量の加算ボタン`).toBeEnabled({ timeout: 30_000 });
  const [res] = await Promise.all([
    page.waitForResponse((r) => /\/cart\/up\/\d+/.test(r.url()), { timeout: 60_000 }),
    up.click({ timeout: 30_000 }),
  ]);
  if (res.status() >= 400) throw new Error(`${what}: 数量の加算の応答が ${res.status()}`);
  await page.waitForTimeout(500);
}

/** 買い物かご画面の「再計算」ボタン（名前が「再計算」のボタン） */
export function 再計算ボタン(page: Page): Locator {
  return page.getByRole("button", { name: "再計算", exact: true });
}

// ---------------------------------------------------------------------------
// そのほかの画面
// ---------------------------------------------------------------------------

export async function ご利用規約を開く(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/ja/help/agreement`, { timeout: 60_000, waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
}

/** マイページの「入荷待ち商品一覧」のリンク（マイページのメニュー） */
export function 入荷待ち商品一覧のリンク(page: Page): Locator {
  return page.locator('a.p-hareruya-mypage__menu-link[href$="/mypage/notifylist"]');
}
