/**
 * F02-01 PC版ナビゲーション（本店）の続き（-b）。商品を作るケース（021・022・026・032〜034・036〜038・058・068・071・074）の画面シード。
 * 正本: cases/F02-01_seed_data.tsv。依頼者の決定（2026-11-10）「商品を作っていいよ」。
 *
 * - 会員: seeds/f02-01.ts と同じ作り方（フロントの会員登録＋本登録のメール）。メールは f0201-<番号>@example.test の前半に実行の印、
 *   パスワードは Pw-F0201-<番号>（シード表が「このケース専用の値」とするものも同じ形にした）。
 * - お気に入りの商品（MEMBER-021・022・068）: グッズ商品CSV登録で取り込み、商品規格を公開にする（seeds/f03-07.ts の createProducts）。在庫は登録しない。
 *   そのあと会員でログインし、商品詳細の「お気に入りに追加する」を押す。
 * - カートの商品（CART-026〜074）: グッズ商品CSV登録で取り込み、在庫検索一覧から在庫編集で入庫し、別のメンバーが在庫編集承認一覧で承認する
 *   （pages/admin/f04_setup.ts の 商品を作って入庫する・入庫方法「在庫編集」）。そのあと会員でログインし、商品詳細で数量を入れてカートに入れる。
 * - CART-074 の「在庫なし商品-074」: 在庫1で作ってカートに入れたあと、在庫編集で「廃棄/廃棄(その他)」・-1 を登録して承認し、在庫を0にする（シード表の⑦）。
 * - 商品コード・商品名には実行の印を付ける（依頼者決定 2026-10-28）。ケースの文の商品名も同じ印をつけて読む。
 *
 * シードでの解釈（記録にも書く）:
 * - 商品コードの無い商品（数量操作商品-032 など）の商品コードは F0201-<番号>-A（・-B）に印を付けた値。
 * - 価格の定めの無い商品は 1000円（CSVの基準価格・販売価格）。お気に入りの商品の名前は商品コードと同じ（「任意の名称」）。
 * - 「そのほかの必須項目は環境に登録済みの値」は、既存の部品のとおり（カテゴリはグッズの下の既存のカテゴリ、購入グループは「通常商品」など）。
 * - BROWSER-<番号> の「専用ブラウザをその会員でログイン済みにする」は、ケースのブラウザで手順1の前にログインする（spec）。
 *
 * 作らないシード: CART-072・073（カード詳細＝カードのマスタを共有の開発環境に新しく登録してからカード商品を作る作り。カードのマスタを増やすことは
 * 依頼者の決定（商品を作ってよい）に含まれるか分からないので、判断待ち）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 会員のカートの明細ID } from "../db/f02_01_cart";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { F04承認者, F04登録者, 本店の店名, 商品を作って入庫する, 管理者を用意する } from "../pages/admin/f04_setup";
import { addToCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage } from "../pages/admin/stock_edit";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { createProducts } from "./f03-07";
import { 会員の } from "./f02-01";
import { 本会員を作る } from "./f06-member";

export { 会員の };
/** ケースの文の商品名（正本の値）を、作った商品の名前（印つき）にする */
export const 商品名の = (正本の名前: string): string => rc(正本の名前);

const 姓の: Record<string, string> = {
  "021": "F0201会員", "022": "F0201会員", "068": "お気に入り1件会員",
  "026": "販売カート確認会員", "038": "販売カート確認会員", "058": "販売カート確認会員", "071": "販売カート確認会員",
  "032": "数量操作確認会員", "033": "数量操作確認会員", "034": "数量操作確認会員", "036": "数量操作確認会員", "037": "数量操作確認会員", "074": "数量操作確認会員",
};
async function 会員を作る(browser: Browser, k: string): Promise<string> {
  const m = 会員の(k);
  return 本会員を作る(browser, { 姓: 姓の[k], 名: k, セイ: "シケン", メイ: "カイイン", 前半: `f0201-${k}`, パスワード: m.パスワード });
}

// ---- お気に入り ----
const お気に入りの商品: Record<string, string[]> = { "021": ["FAV-001-021", "FAV-002-021"], "022": ["FAV-001-022", "FAV-002-022"], "068": ["FAV-001-068"] };
for (const [k, codes] of Object.entries(お気に入りの商品)) {
  const seedId = `S-F02-01-MEMBER-${k}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const id = await 会員を作る(browser, k);
    if (k !== "068") notes.set(`〔会員ID-F0201-${k}〕`, id);
    const made = await createProducts(browser, `${seedId} のお気に入りの商品`, codes.map((c) => ({ name: c, classes: [{ code: c }] })), issue);
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const page = await ctx.newPage();
      const fav = new FrontFavorite(page);
      await fav.login(会員の(k).メール, 会員の(k).パスワード);
      for (const [i, p] of made.entries()) {
        await fav.openDetail(p.productId);
        const r = await fav.押す();
        if (!r.通知が出た || r.ログインモーダルが開いた) throw new Error(`${seedId}: ${rc(codes[i])} の「お気に入りに追加する」を押しても登録の通知が出ない（${JSON.stringify(r)}）`);
        await fav.通知を閉じる().catch(() => undefined);
      }
    } finally { await ctx.close(); }
  });
  defineSeed(`S-F02-01-BROWSER-${k}`, async () => { /* ケースのブラウザで手順1の前にログインする（spec） */ });
}

// ---- カート ----
type カートの定め = { 名前: string; 価格?: number; 在庫: number; 数量: number; 在庫を0にする?: boolean };
const カートの商品: Record<string, カートの定め[]> = {
  "026": [{ 名前: "カート商品A-026", 価格: 1000, 在庫: 5, 数量: 2 }, { 名前: "カート商品B-026", 価格: 1500, 在庫: 5, 数量: 1 }],
  "032": [{ 名前: "数量操作商品-032", 在庫: 5, 数量: 2 }],
  "033": [{ 名前: "数量操作商品-033", 在庫: 5, 数量: 2 }],
  "034": [{ 名前: "最小数量商品-034", 在庫: 5, 数量: 1 }],
  "036": [{ 名前: "数量操作商品-036", 在庫: 5, 数量: 2 }],
  "037": [{ 名前: "在庫上限商品-037", 在庫: 5, 数量: 5 }],
  "038": [{ 名前: "カート商品A-038", 在庫: 5, 数量: 2 }, { 名前: "カート商品B-038", 在庫: 5, 数量: 1 }],
  "058": [{ 名前: "カート商品A-058", 在庫: 5, 数量: 2 }, { 名前: "カート商品B-058", 在庫: 5, 数量: 1 }],
  "071": [{ 名前: "カート商品A-071", 価格: 1000, 在庫: 5, 数量: 1 }],
  "074": [{ 名前: "在庫なし商品-074", 価格: 1000, 在庫: 1, 数量: 1, 在庫を0にする: true }, { 名前: "在庫あり商品-074", 価格: 1000, 在庫: 5, 数量: 2 }],
};
/** シード表が定める商品コード（無いものは F0201-<番号>-A・-B） */
const 商品コード: Record<string, string[]> = {
  "026": ["CART-F0201-026-A", "CART-F0201-026-B"], "038": ["CART-F0201-038-A", "CART-F0201-038-B"],
  "071": ["CART-F0201-071-A"], "074": ["CART-F0201-074-A", "CART-F0201-074-B"],
};

for (const [k, defs] of Object.entries(カートの商品)) {
  const seedId = `S-F02-01-CART-${k}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await 会員を作る(browser, k);
    const codes = (商品コード[k] ?? defs.map((_, i) => `F0201-${k}-${"AB"[i]}`)).map(rc);
    const made = await 商品を作って入庫する(browser, seedId, defs.map((d, i) => ({
      商品コード: codes[i], 商品名: rc(d.名前), 価格: String(d.価格 ?? 1000), 入庫数: d.在庫, 入庫方法: "在庫編集" as const,
    })), issue);
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const page = await ctx.newPage();
      await frontLogin(page, 会員の(k));
      for (const [i, d] of defs.entries()) await addToCart(page, made[i].productId, d.数量, `${seedId}: ${rc(d.名前)} をカートへ`);
    } finally { await ctx.close(); }
    for (const [i, d] of defs.entries()) if (d.在庫を0にする) await 在庫を0にする(browser, seedId, codes[i], d.在庫, issue);
    // シード表が呼び名〔明細ID-F0201-<番号>〕を定めるもの（数量操作の 032〜037）は、カートの明細のIDを DB の参照で読んで控える（画面に出ないため）
    if (["032", "033", "034", "036", "037"].includes(k)) {
      const ids = 会員のカートの明細ID(会員の(k).メール, rc(defs[0].名前));
      if (ids.length !== 1) throw new Error(`${seedId}: 会員のカートに ${rc(defs[0].名前)} の明細が ${ids.length} 件（1件のはず）`);
      notes.set(`〔明細ID-F0201-${k}〕`, ids[0]);
    }
  });
  defineSeed(`S-F02-01-BROWSER-${k}`, async () => { /* ケースのブラウザで手順1の前にログインする（spec） */ });
}

/** 在庫編集で「廃棄/廃棄(その他)」・-在庫数を登録し、別のメンバーが承認して、在庫を0にする（CART-074 の⑦） */
async function 在庫を0にする(browser: Browser, seedId: string, code: string, 在庫: number, issue: (m: string) => void): Promise<void> {
  await 管理者を用意する(browser);
  const shop = await 本店の店名(browser);
  let registrant = "";
  await withAdminSession(browser, F04登録者.account, async (page) => {
    const stock = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
    await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
    await registerStockEdit(page, { changeType: "廃棄/廃棄(その他)", reason: "試験用", quantity: String(-在庫), purchasePrice: "0", approverName: F04承認者.名前 }, `${seedId}: ${code} の廃棄の在庫編集`, issue);
    registrant = await loggedInMemberName(page);
  });
  await withAdminSession(browser, F04承認者.account, async (ap) => {
    const list = new StockApprovalListPage(ap);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registrant && r.quantity === String(-在庫));
    if (rows.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に ${code} の廃棄（${-在庫}）の未承認の行が無い`);
    await list.approve([rows[0].id], `${seedId}: ${code} の廃棄の承認`, issue);
  });
}
