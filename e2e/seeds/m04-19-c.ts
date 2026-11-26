/**
 * M04-19 欠品履歴検索一覧の続き（038・039）のシード S-M04-19-CBLIST-038・039。正本: cases/M04-19_seed_data.tsv
 * 既存の seeds/m04-19.ts は変えず、同じ作り方（seeds/m04-19.ts の 受注の欠品の履歴を作る と同じ手順）を、このファイルに写して使う
 * （元の部品は非公開で、公開すると既存ケースの判定が変わるため）。
 * 手順: グッズ商品CSV登録で商品（価格1980）→ 在庫変更CSV登録で本店・EC-CUBE に3入庫して承認 → フロントで3注文 → 受注情報編集で欠品数量2。
 * 039 はさらに、本店・EC-CUBE の在庫変更CSV登録（在庫増減数1・承認しない）で入庫承認待ち在庫情報を1件作る。
 * 正本の外の補い: 購入する会員・登録者は seeds/m04-19.ts と同じ（会員は無ければフロントの会員登録で作る）。商品コードには実行の印を付ける。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, ENV_NAME, MAIL_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { customerStateByEmail } from "../pages/admin/customer";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { goodsCategoryIdForCsv, idsByExactCode, productRowsByCode } from "../pages/admin/m04_19_masters";
import { addToCart, checkoutWithDeliveryChoice, clearCart, frontLogin, openOrderEditByProductCode, registerShortages } from "../pages/admin/m04_19_order_shortage";
import { registerStockChangeCsv } from "../pages/admin/m04_19_stock_change_csv";
import { StockApprovalListPage } from "../pages/admin/stock_edit";
import { FrontMember, registerFrontMember } from "../pages/front/member_entry";
import { M0419_ADMIN, M0419_ADMIN_NAME, mainShopName } from "./m04-19";
import "./m04-19";

const REGISTRANT: Account = { loginId: "m0419_registrant", password: "Passw0rd!M0419R" };
const REGISTRANT_NAME = "M04-19登録者";
const BUYER: FrontMember = {
  姓: "試験会員", 名: "欠品購入", セイ: "シケンカイイン", メイ: "ケッピンコウニュウ",
  メール: "e2e-m0419-buyer@example.test", パスワード: "Passw0rd!E2EM0419",
};
const PAYMENTS = ["代金引換", "郵便振替", "現金書留"];
const STOCK_IN = { 在庫変動区分: "入庫/その他", 在庫変動理由: "M04-19試験データ", 仕入単価: "100" };
const issueOf = (seedId: string) => (m: string) => reportSeedIssue(seedId, m);
let fileSeq = 0;
const csvName = (seedId: string) => `${seedId.toLowerCase()}-c-${Date.now()}-${++fileSeq}.csv`;

async function 購入会員を用意する(browser: Browser): Promise<void> {
  const state = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, BUYER.メール));
  if (state === "仮会員") throw new Error(`購入する試験会員 ${BUYER.メール} が仮会員のまま。本登録のメールのURLを開いて本会員にしてから流す`);
  if (state === null) {
    if (!MAIL_URL) throw new Error(`E2E_ENV=${ENV_NAME} では購入する試験会員を登録できない（本登録のメールを読めない。E2E_MAIL_URL を与える）`);
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try { await hideDebugToolbar(context); await registerFrontMember(await context.newPage(), BUYER); } finally { await context.close(); }
    const after = await withAdminSession(browser, SETUP_ADMIN, (page) => customerStateByEmail(page, BUYER.メール));
    if (after !== "本会員") throw new Error(`購入する試験会員 ${BUYER.メール} を登録したが、会員一覧で本会員にならない（${after ?? "見つからない"}）`);
  }
}

/** 受注の欠品の履歴（価格1980・入庫3・注文3・欠品2）を作る。受注IDと注文番号を返す */
async function 欠品の受注を作る(browser: Browser, seedId: string, code: string, 名: string): Promise<{ 受注ID: string; 注文番号: string }> {
  const issue = issueOf(seedId);
  await 購入会員を用意する(browser);
  const rows = await withAdminSession(browser, REGISTRANT, (page) => productRowsByCode(page, code));
  if (rows.length) throw new Error(`${seedId}: 商品コード「${code}」の商品が残っている（正本に清掃の手順が無いので、同じDBでは流し直さない）`);
  const ids = await withAdminSession(browser, REGISTRANT, async (page) => {
    const categoryId = await goodsCategoryIdForCsv(page, issue);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-goods.csv`, categoryId,
      lines: [{ code, nameJp: 名, nameEn: 名, values: { "基準価格": "1980", "販売価格": "1980" } }], onWarning: issue, uploadWaitMs: 600_000,
    });
    return idsByExactCode(await productRowsByCode(page, code), [code]);
  });
  const shop = await mainShopName(browser);
  await withAdminSession(browser, REGISTRANT, (page) => registerStockChangeCsv(page, {
    店舗: shop, 在庫区分: "EC-CUBE", 在庫変動区分: STOCK_IN.在庫変動区分, 在庫変動理由: STOCK_IN.在庫変動理由, 承認者: M0419_ADMIN_NAME,
    行: [{ 商品コード: code, 在庫増減数: "3", 仕入単価: STOCK_IN.仕入単価 }], ファイル名: csvName(seedId),
  }, `${seedId} の在庫変更CSV登録（入庫3）`, issue));
  await withAdminSession(browser, M0419_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const hit = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === REGISTRANT_NAME && r.shop.startsWith(shop) && r.changeType.endsWith(STOCK_IN.在庫変動区分) && r.quantity === "3");
    if (hit.length === 0) throw new Error(`${seedId}: 在庫編集承認一覧に、M04-19登録者の在庫変更CSV登録（合計 3）の未承認の行が無い`);
    if (hit.length > 1) issue(`在庫編集承認一覧に、合計 3 の未承認の行が ${hit.length} 件あり、一覧の先頭を承認した`);
    await list.approve([hit[0].id], `${seedId} の在庫変更CSV登録の承認`, issue);
  });
  // フロントで3注文
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 注文番号 = "";
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    await frontLogin(page, { メール: BUYER.メール, パスワード: BUYER.パスワード });
    await clearCart(page, (m) => issue(`カートに前の実行の商品が残っていたので、カート一括削除のダイアログを受け入れた: ${m}`));
    await addToCart(page, ids.get(code)!, 3, `${seedId} の「${code}」をカートに入れる`);
    const r = await checkoutWithDeliveryChoice(page, PAYMENTS, `${seedId} の注文`);
    if (r.支払方法 !== PAYMENTS[0]) issue(`支払方法に「${PAYMENTS[0]}」が無く、「${r.支払方法}」を選んだ`);
    注文番号 = r.注文番号;
  } finally { await context.close(); }
  return withAdminSession(browser, REGISTRANT, async (page) => {
    const o = await openOrderEditByProductCode(page, code, shop, `${seedId} の受注`);
    if (o.注文番号 !== 注文番号) throw new Error(`${seedId}: 受注情報検索で開いた受注の注文番号 ${o.注文番号} が、フロントで確定した注文番号 ${注文番号} と違う`);
    await registerShortages(page, [{ 商品コード: code, 欠品数量: 2 }], `${seedId} の欠品登録`, issue);
    return o;
  });
}

const NEEDS = ["S-M04-19-ADM", "S-M04-19-MASTER"];

defineSeed("S-M04-19-CBLIST-038", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const o = await 欠品の受注を作る(browser, seed.シードID, rc("M0419-CB038-A"), "M04-19試験商品(038)");
  notes.set("〔受注ID-M0419-038〕", o.受注ID);
  notes.set("〔注文番号-M0419-038〕", o.注文番号);
  reportSeedIssue(seed.シードID, "入庫承認待ち在庫情報は作っていない。商品コードには実行の印を付けた");
});

defineSeed("S-M04-19-CBLIST-039", { needs: NEEDS }, async ({ browser, notes, seed }) => {
  const code = rc("M0419-CB039-A");
  const o = await 欠品の受注を作る(browser, seed.シードID, code, "M04-19試験商品(039)");
  notes.set("〔受注ID-M0419-039〕", o.受注ID);
  notes.set("〔注文番号-M0419-039〕", o.注文番号);
  const shop = await mainShopName(browser);
  await withAdminSession(browser, REGISTRANT, (page) => registerStockChangeCsv(page, {
    店舗: shop, 在庫区分: "EC-CUBE", 在庫変動区分: STOCK_IN.在庫変動区分, 在庫変動理由: STOCK_IN.在庫変動理由, 承認者: M0419_ADMIN_NAME,
    行: [{ 商品コード: code, 在庫増減数: "1", 仕入単価: STOCK_IN.仕入単価 }], ファイル名: csvName(seed.シードID),
  }, `${seed.シードID} の入庫承認待ち（在庫増減数1・承認しない）`, issueOf(seed.シードID)));
  await withAdminSession(browser, M0419_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const n = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === REGISTRANT_NAME && r.shop.startsWith(shop) && r.quantity === "1").length;
    expect(n, `${seed.シードID}: 在庫編集承認一覧に、在庫増減数1の未承認の行がある`).toBeGreaterThan(0);
  });
  reportSeedIssue(seed.シードID, "商品コードには実行の印を付けた。入庫承認待ち在庫情報は、在庫変更CSV登録（在庫増減数1）を承認せずに残して作った");
});
