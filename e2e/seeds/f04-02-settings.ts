/**
 * F04-02 共有の設定（配送方法・支払方法の表示）を前提にするシード（021・022・031・034・037・061・063・064・065）。
 * シード表は「配送方法設定・支払方法設定で◯◯を表示にする」と定める共有の設定だが、必要な配送方法・支払方法は手元で既に表示中（有効）なので、
 * 設定は書き換えない。DBの参照で必要な名称が表示中であることだけ確かめ、そうでなければシードを止める（書き換えないので、元へ戻す操作は無い）。
 * 手数料・利用条件・件数を前提にするケースは、手元に他機能の試験用の支払方法・配送方法が残るため、ここでは扱わない（判断待ち）。
 */
import { Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 表示中の支払方法名, 表示中の配送方法名, 処理中受注ID一覧 } from "../db/f04_02";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して待つ, 商品を作って入庫する, 処理中の受注IDを読む, 本店の店名 } from "../pages/admin/f04_setup";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む } from "../pages/admin/m05_11_order_edit";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { FrontMember } from "../pages/front/member_entry";

export type 設定ありの状態 = { 会員: FrontMember; 会員ID: string; 受注ID: string };
const built = new Map<string, 設定ありの状態>();
export function 設定ありの状態の(seedId: string): 設定ありの状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

async function 選ぶ(page: Page, sel: string, label: string): Promise<void> {
  const items = await page.locator(sel).evaluateAll((ns) => ns.map((n) => ({ v: (n as HTMLInputElement).value, checked: (n as HTMLInputElement).checked, t: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim() })));
  const hit = items.find((i) => i.t === label);
  if (!hit) throw new Error(`「${label}」の選択肢が無い（${items.map((i) => i.t).join("、")}）`);
  if (hit.checked) return;
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.locator(`${sel}[value="${hit.v}"]`).check({ force: true })]);
  await page.waitForLoadState("load");
}

async function 作る({ browser, seed, notes }: SeedCtx, a: { メール: string; 商品コード: string; 配送?: string; 支払?: string; 前提配送: string[]; 前提支払: string[] }): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 配送 = 表示中の配送方法名(); const 支払 = 表示中の支払方法名();
  for (const n of a.前提配送) if (!配送.includes(n)) throw new Error(`配送方法「${n}」が表示中でない。シード表は表示にする（共有の設定の書き換え）と定めるが、書き換えていない`);
  for (const n of a.前提支払) if (!支払.includes(n)) throw new Error(`支払方法「${n}」が表示中でない。シード表は表示にする（共有の設定の書き換え）と定めるが、書き換えていない`);
  issue("共有の設定（配送方法・支払方法の表示）は、必要な名称がすでに表示中であることをDBの参照で確かめ、書き換えていない");
  const shop = await 本店の店名(browser);
  const m: FrontMember = { 姓: "試験", 名: "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(a.メール)}@example.com`, パスワード: "Passw0rd!F0402" };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  const [商品] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: rc(a.商品コード), 商品名: rc(`${a.商品コード}-商品`), 価格: "1000" }], issue);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    await clearCart(page, () => undefined);
    await addToCart(page, 商品.productId, 1, `${seed.シードID}: カートに入れる`);
    await new ShoppingPage(page).買い物かごから開く();
    if (a.配送) await 選ぶ(page, 'input[name="_shopping_order[Shippings][0][Delivery]"]', a.配送);
    if (a.支払) await 選ぶ(page, 'input[name="_shopping_order[Payment]"]', a.支払);
  } finally {
    await context.close();
  }
  const 受注ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 処理中の受注IDを読む(page, m.メール, shop, seed.シードID));
  if (!処理中受注ID一覧(会員ID).includes(受注ID)) throw new Error(`${seed.シードID}: 見つけた受注が会員の購入処理中の受注に無い`);
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("…")) continue;
    if (l.includes("会員ID")) notes.set(l, 会員ID);
    else if (l.includes("受注ID")) notes.set(l, 受注ID);
  }
  built.set(seed.シードID, { 会員: m, 会員ID, 受注ID });
}

defineSeed("S-F04-02-PICKUP-021", (c) => 作る(c, { メール: "f0402-021", 商品コード: "F0402-PICKUP-P-021", 前提配送: ["店頭受取", "スムーズ店頭受取"], 前提支払: [] }));
defineSeed("S-F04-02-EC-022", (c) => 作る(c, { メール: "f0402-022", 商品コード: "F0402-A-022", 配送: "ゆうパケット", 前提配送: ["ゆうパケット", "ゆうパック"], 前提支払: [] }));
defineSeed("S-F04-02-EC-031", (c) => 作る(c, { メール: "f0402-031", 商品コード: "F0402-A-031", 配送: "ゆうパケット", 前提配送: ["ゆうパケット", "ゆうパック"], 前提支払: [] }));
defineSeed("S-F04-02-EC-034", (c) => 作る(c, { メール: "f0402-034", 商品コード: "F0402-A-034", 前提配送: ["ゆうパケット"], 前提支払: [] }));
defineSeed("S-F04-02-EC-037", (c) => 作る(c, { メール: "f0402-037", 商品コード: "F0402-A-037", 配送: "ゆうパケット", 支払: "銀行振込", 前提配送: ["ゆうパケット"], 前提支払: ["銀行振込"] }));
defineSeed("S-F04-02-EC-061", (c) => 作る(c, { メール: "f0402-061", 商品コード: "F0402-A-061", 支払: "銀行振込", 前提配送: [], 前提支払: ["銀行振込", "郵便振替"] }));
defineSeed("S-F04-02-EC-063", (c) => 作る(c, { メール: "f0402-063", 商品コード: "F0402-A-063", 支払: "銀行振込", 前提配送: [], 前提支払: ["銀行振込", "郵便振替"] }));
defineSeed("S-F04-02-EC-064", (c) => 作る(c, { メール: "f0402-064", 商品コード: "F0402-A-064", 支払: "銀行振込", 前提配送: [], 前提支払: ["銀行振込"] }));
defineSeed("S-F04-02-EC-065", (c) => 作る(c, { メール: "f0402-065", 商品コード: "F0402-A-065", 前提配送: [], 前提支払: ["クレジットカード決済", "銀行振込"] }));
