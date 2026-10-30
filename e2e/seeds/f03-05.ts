/**
 * F03-05 商品リコメンドの画面シード。正本: cases/F03-05_seed_data.tsv
 *
 * 作り方（実装したシードだけ。CASE-012・CASE-013 の投入方法の順）:
 * 1. グッズ商品CSV登録で、1行のCSV（商品コード・商品名はBASE-ZERO-012/013、日本語・公開・支店も公開、地域別販売制限は012が日本語サイト・013が日英両サイト）を取り込む。
 * 2. 商品マスターで商品コードを検索して商品IDを控える。
 * 3. 在庫検索一覧の本店・EC-CUBEの行から在庫編集を開き、入庫で5を登録する。登録者とは別の管理者が在庫編集承認一覧で一括承認する。
 * 4. 注文はしない（同時購入された他商品は0件のまま）。
 * 共有の設定（CONFIG）: 追加システム設定のレコメンド検索期間（日数）を30にする。今の値を控え、ケースが終わるたびに控えた値へ戻す（restoreRecommendDays）。
 *
 * 作らないシード（記録 e2e/review/F03-05_progress_2026-10-30.md）:
 * - CASE-012・013 以外は、投入方法に「DBへ直接」（注文・受注の投入）や外部の試験環境（決済・メール）が含まれる。
 *
 * 決め打ちの識別の値（商品コード・商品名）には実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 承認一覧の最大番号 } from "../db/f03_05";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { readRecommendDays, setRecommendDays } from "../pages/admin/f03_05_settings";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { ensureStockAdmin, STOCK_ADMIN } from "../pages/admin/f03_08_masters";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { searchStockByCode, stockInRow } from "../pages/admin/m04_02_rc_stock";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "../pages/admin/stock_edit";

// ---- 共有の設定 ----

/** シードを作る前のレコメンド検索期間（ケースが終わるたびに戻す） */
let daysBefore: string | null = null;

defineSeed("S-F03-05-CONFIG", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if (daysBefore === null) daysBefore = await readRecommendDays(page);
    reportSeedIssue("S-F03-05-CONFIG", `レコメンド検索期間（日数）のいまの値は ${daysBefore}。ケースが終わったら戻す`);
    if (daysBefore !== "30") await setRecommendDays(page, "30");
  });
});

/** ケースの開始時に、レコメンド検索期間を30にする（前のケースが終わるたびに戻しているため） */
export async function 開始時に検索期間を30にする(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if ((await readRecommendDays(page)) !== "30") await setRecommendDays(page, "30");
  });
}

/** ケースが終わるたびに、控えた値へ戻す（正本: このシードを使うケースが終わるたびに控えた値へ戻す） */
export async function restoreRecommendDays(browser: Browser): Promise<void> {
  if (daysBefore === null) return;
  const before = daysBefore;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if ((await readRecommendDays(page)) !== before) await setRecommendDays(page, before);
  });
}

// ---- 商品（在庫5） ----

export type 作った商品 = { productId: string; classId: string };
const built = new Map<string, 作った商品>();
/** ケースの文の商品コード（正本の値）から、シードが作った商品を引く */
export function productOf(正本の商品コード: string): 作った商品 {
  const p = built.get(rc(正本の商品コード));
  if (!p) throw new Error(`商品 ${正本の商品コード} はまだ作っていない`);
  return p;
}

/** 本店・EC-CUBE在庫を5にする（登録者とは別の管理者が承認する。F03-08 の在庫の入れ方と同じ） */
async function stockToFive(browser: Browser, code: string, tag: string, issue: (m: string) => void): Promise<void> {
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const shop = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById("1"));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStockAdmin(page));
  const baseline = 承認一覧の最大番号();
  const registeredBy = await withAdminSession(browser, STOCK_ADMIN, async (page) => {
    const registrant = await loggedInMemberName(page);
    if (registrant === approverName) throw new Error(`${tag}: 登録者と承認者が同じ管理者になっている`);
    const stock = new StockListPage(page);
    await stock.searchByProductCode(code);
    await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
    await registerStockEdit(page, { changeType: "入庫/その他", reason: "F03-05試験データ", quantity: "5", purchasePrice: "0", approverName }, `${tag}: ${code} の在庫編集（5）`, issue);
    return registrant;
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registeredBy && r.shop.startsWith(shop)
      && r.changeType.endsWith("入庫/その他") && r.quantity === "5" && Number(r.id) > baseline);
    if (rows.length < 1) throw new Error(`${tag}: 在庫編集の未承認の行が見つからない`);
    await list.approve(rows.slice(0, 1).map((r) => r.id), `${tag}: 在庫編集の承認`, issue);
    const after = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
    const n = await stockInRow(after.row(code, shop, "EC-CUBE"));
    if (n !== 5) throw new Error(`${tag}: ${code} の在庫が ${n}（5のはず）`);
  });
}

async function baseZeroSeed(browser: Browser, notes: Notes, no: "012" | "013", region: "1" | "0"): Promise<void> {
  const seedId = `S-F03-05-CASE-${no}`;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const code = `BASE-ZERO-${no}`;
  const { productId, classId } = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}.csv`, categoryId,
      lines: [{ code: rc(code), nameJp: rc(code), nameEn: rc(code), values: { "地域別販売制限": region } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const id = await openProductEditByCode(page, rc(code));
    const rows = await classRowsFromProductEdit(page, id);
    if (rows.length !== 1 || rows[0].商品コード !== rc(code)) throw new Error(`${seedId}: ${rc(code)} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
    if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId: id, classId: rows[0].商品規格ID }, `${seedId}: ${rc(code)}`, issue);
    return { productId: id, classId: rows[0].商品規格ID };
  });
  await stockToFive(browser, rc(code), seedId, issue);
  built.set(rc(code), { productId, classId });
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (label === `〔商品レコードID-F0305-${no}〕`) notes.set(label, productId);
    else throw new Error(`${seedId}: 呼び名 ${label} が未対応`);
  }
}
defineSeed("S-F03-05-CASE-012", { needs: ["S-F03-05-CONFIG"] }, ({ browser, notes }) => baseZeroSeed(browser, notes, "012", "1"));
defineSeed("S-F03-05-CASE-013", { needs: ["S-F03-05-CONFIG"] }, ({ browser, notes }) => baseZeroSeed(browser, notes, "013", "0"));
