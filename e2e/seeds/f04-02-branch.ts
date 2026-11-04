/**
 * F04-02 支店のシード（020・051・053・068）。正本: cases/F04-02_seed_data.tsv
 * 支店「TC大阪」は、手元に既にある店舗「トーナメントセンター 大阪」（店舗ID 5・フロントの店舗ページ /ja/osaka/）を使う（作らない）。
 * 在庫は在庫変更CSV登録で大阪の EC-CUBE 在庫に入れ、本店と大阪を編集できる別のメンバーが承認する。
 * シードでの解釈:
 * - 051: 「支払方法設定の一覧に『試験スマレジ決済-051』が無いことを確かめる（あれば削除する）」は、DBの参照で無いことだけ確かめる（あれば止めて判断待ち）。
 */
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { query } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { F04大阪承認者, F04大阪登録者, 会員を登録して待つ, 商品を作って入庫する, 大阪の店名, 大阪の店舗ページ, 大阪の管理者を用意する, 処理中の受注IDを読む, 本店の店名 } from "../pages/admin/f04_setup";
import { clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { 会員IDを一覧から読む, ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { ShoppingPage, カートに入れる } from "../pages/front/f04_shopping";
import { FrontMember } from "../pages/front/member_entry";

export type 支店の状態 = { 会員: FrontMember; 会員ID: string; 受注ID?: string };
const built = new Map<string, 支店の状態>();
export function 支店の状態の(seedId: string): 支店の状態 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

async function 作る({ browser, seed, notes }: SeedCtx, a: { メール: string; 商品: { 商品コード: string; 店舗: "本店" | "大阪" }[]; ポイント?: number; 開く?: boolean }): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 大阪の管理者を用意する(browser);
  const 本店 = await 本店の店名(browser);
  const m: FrontMember = { 姓: "試験", 名: "太郎", セイ: "シケン", メイ: "タロウ", メール: `${rc(a.メール)}@example.com`, パスワード: "Passw0rd!F0402" };
  await 会員を登録して待つ(browser, m);
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 会員IDを一覧から読む(page, m.メール));
  if (a.ポイント) await withAdminSession(browser, SETUP_ADMIN, (page) => ポイントを付与する(page, 会員ID, a.ポイント!));
  const made: { id: string; 店舗: "本店" | "大阪" }[] = [];
  for (const p of a.商品) {
    const [x] = await 商品を作って入庫する(browser, seed.シードID, [{ 商品コード: rc(p.商品コード), 商品名: rc(`${p.商品コード}-商品`), 価格: "1000" }], issue,
      { 店舗名: p.店舗 === "大阪" ? 大阪の店名 : 本店, 登録者: F04大阪登録者, 承認者: F04大阪承認者 });
    made.push({ id: x.productId, 店舗: p.店舗 });
  }
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 受注ID: string | undefined;
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, m);
    await clearCart(page, () => undefined);
    for (const x of made) await カートに入れる(page, x.店舗 === "大阪" ? 大阪の店舗ページ : "", x.id, 1, `${seed.シードID}: カートに入れる`);
    if (a.開く) await new ShoppingPage(page).買い物かごから開く(大阪の店舗ページ);
  } finally {
    await context.close();
  }
  if (a.開く) 受注ID = await withAdminSession(browser, SETUP_ADMIN, (page) => 処理中の受注IDを読む(page, m.メール, 大阪の店名, seed.シードID));
  for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (l.includes("…")) continue;
    if (l.includes("会員ID")) notes.set(l, 会員ID);
    else if (l.includes("受注ID")) { if (!受注ID) throw new Error(`${l} を控える受注が無い`); notes.set(l, 受注ID); }
  }
  built.set(seed.シードID, { 会員: m, 会員ID, 受注ID });
}

defineSeed("S-F04-02-STORE-CARTS-020", (c) => 作る(c, { メール: "f0402-020", 商品: [{ 商品コード: "F0402-TOKYO-020", 店舗: "本店" }, { 商品コード: "F0402-OSAKA-020", 店舗: "大阪" }] }));
defineSeed("S-F04-02-SMAREGI-051", async (c) => {
  const hit = query(`select id from dtb_payment where payment_method = $1`, ["試験スマレジ決済-051"]);
  if (hit.length) throw new Error("支払方法に「試験スマレジ決済-051」が既にある（正本は削除する。削除は判断待ち）");
  await 作る(c, { メール: "f0402-051", 商品: [{ 商品コード: "F0402-SMAREGI-P-051", 店舗: "大阪" }], 開く: true });
});
defineSeed("S-F04-02-BRANCH-053", (c) => 作る(c, { メール: "f0402-053", 商品: [{ 商品コード: "F0402-BRANCH-P-053", 店舗: "大阪" }], ポイント: 1000, 開く: true }));
defineSeed("S-F04-02-BRANCH-068", (c) => 作る(c, { メール: "f0402-068", 商品: [{ 商品コード: "F0402-BRANCH-P-068", 店舗: "大阪" }], ポイント: 1000, 開く: true }));
