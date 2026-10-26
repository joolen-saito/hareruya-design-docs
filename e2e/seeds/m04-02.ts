/**
 * M04-02 在庫編集の画面シード。正本: cases/M04-02_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（073・074。在庫編集の結果が在庫履歴検索一覧・商品規格一覧へ届くことを見るもの）が使うシードだけ。
 * 同じ形のシードを M04-03 在庫一括編集の063も使うので、作り方の関数をここに置いて seeds/m04-03.ts からも呼ぶ。
 *
 * - 申請者と承認者（RC-ORG-*）: メンバー管理で2人を登録する。所属店舗・デフォルト検索表示店舗・編集可能店舗をその店舗にし、所属は同じ（所属の選択肢の先頭）にする。
 *   権限グループは「在庫管理を操作できるもの（承認者は権限管理で承認権限の列にチェックのある権限）」で、どちらもシステム管理者にした
 *   （在庫編集の承認通知先・在庫編集承認一覧の承認は、システム管理者の承認する管理者で通ることを M04-17・M03-01 の057 で確かめている）。
 *   デフォルト検索表示店舗はシード表に無いが、メンバー登録画面で必須で、所属店舗と同じ店舗しか選べない。
 * - 支店（RC-ORG-073）: 店舗登録で「RC0402-001支店」（支店URL rc0402s001・支店・公開・開店）を登録する。あれば内容を確かめて使う。
 * - 本店（RC-ORG-074 など）: 既存の店舗「本店」を使う。手元の環境の本店は店舗ID 1（アプリの設定の親店舗）で、店名は環境で違う（手元は「Hareruya」）。
 *   在庫検索一覧の検索欄「店舗」の選択肢から店舗ID 1 の店名を読んで使う（HANDOFF の M03-01 の057 と同じ）。
 * - 商品・在庫（RC-STOCK-*）: グッズ商品CSV登録で1行を取り込み、商品規格一覧から取り込みで作られた規格を開いて公開にし、
 *   申請者が在庫編集で入庫/その他・10・仕入単価100を登録して、承認者が在庫編集承認一覧で承認する。在庫検索一覧で在庫が10になったことを確かめる。
 *   商品コードは正本の固定の値で、正本に清掃の手順が無い。前の実行の商品が残っていれば作らずに止める（流し直すかは依頼者が決める）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { openClassListFromProductEdit } from "../pages/admin/m03_01_product_class";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { expectNoProductCodes, readSupplyGoodsCategoryId, uploadGoodsLines } from "../pages/admin/m04_17_seed_ops";
import {
  approveOne, chooseHistoryShopAndZone, fillStockEdit, publishImportedClass, searchApprovals, searchStockByCode, stockInRow, submitStockEdit,
} from "../pages/admin/m04_02_rc_stock";
import { numberOf, StockHistoryPage } from "../pages/admin/m04_17_stock_history";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { ensureStore, M0424StoreInput } from "../pages/admin/m04_24_store";
import { StockListPage } from "../pages/admin/stock_edit";

/** 本店（店舗ID 1。アプリの設定の親店舗）の店名を、在庫検索一覧の検索欄「店舗」の選択肢から読む */
export async function mainShopName(page: Page): Promise<string> {
  return new StockListPage(page).shopNameById("1");
}

/** 申請者と承認者 */
export type RcOrg = {
  申請者: { 名前: string; account: Account; email: string };
  承認者: { 名前: string; account: Account; email: string };
};

/** 申請者・承認者のセット（ログインIDの接頭辞・番号から作る。例: rc0402-001） */
export function rcOrg(prefix: string, label: string, password: string): RcOrg {
  return {
    申請者: { 名前: `${label}申請者`, account: { loginId: `${prefix}-ap`, password }, email: `${prefix}-ap@example.test` },
    承認者: { 名前: `${label}承認者`, account: { loginId: `${prefix}-ar`, password }, email: `${prefix}-ar@example.test` },
  };
}

/** 店舗の決め方: 本店（店舗ID 1）か、店舗登録で用意する支店 */
export type RcStore = { 本店: true } | { 支店: M0424StoreInput };

/** 店舗IDと店名（在庫検索一覧の選択肢の表示名）。シードの中で決め、ケースはシードと同じ関数で読み直す */
async function resolveStore(page: Page, store: RcStore, onIssue: (m: string) => void): Promise<{ id: string; 店名: string }> {
  if ("本店" in store) return { id: "1", 店名: await mainShopName(page) };
  const id = await ensureStore(page, store.支店, onIssue);
  return { id, 店名: store.支店.店名 };
}

/** 申請者と承認者を登録する（あれば内容を確かめて使う）。2人ともログインできることを確かめる */
export function defineRcOrg(seedId: string, org: RcOrg, store: RcStore): void {
  defineSeed(seedId, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const s = await resolveStore(page, store, issue);
      for (const who of [org.申請者, org.承認者]) {
        await ensureMemberByStoreIds(page, {
          名前: who.名前, ログインID: who.account.loginId, メールアドレス: who.email, パスワード: who.account.password,
          権限: "システム管理者", 所属店舗ID: s.id, デフォルト検索表示店舗ID: s.id, 編集可能店舗ID: [s.id],
        });
      }
    });
    for (const who of [org.申請者, org.承認者]) await withAdminSession(browser, who.account, async () => undefined);
  });
}

export type RcProduct = { 商品コード: string; 商品名: string };

/** 店舗の店名（本店は在庫検索一覧の選択肢から読む） */
export async function storeNameOf(browser: Browser, account: Account, store: RcStore): Promise<string> {
  if (!("本店" in store)) return store.支店.店名;
  return withAdminSession(browser, account, (page) => mainShopName(page));
}

/**
 * 商品「…-NAME」をグッズ商品CSV登録で作り、規格を公開にして、申請者の在庫編集（入庫/その他・試験データ・10・仕入単価100）を承認者が承認する。
 * 在庫検索一覧で、その店舗・EC-CUBE の在庫が10になったことを確かめる。
 */
export function defineRcStock(seedId: string, orgSeedId: string, org: RcOrg, store: RcStore, product: RcProduct,
  options: { 前回の残りを使う?: string } = {}): void {
  defineSeed(seedId, { needs: [orgSeedId] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const shop = await storeNameOf(browser, org.申請者.account, store);
    if (options.前回の残りを使う) {
      const left = await withAdminSession(browser, SETUP_ADMIN, async (page) =>
        expectNoProductCodes(page, [product.商品コード], seedId).then(() => false, () => true));
      if (left) {
        await expectLeftoverIsSeedState(browser, org, shop, product, seedId);
        issue(`前回の実行（${options.前回の残りを使う}）がこのシードで作った商品 ${product.商品コード} が残っていたので、作り直さずに使った。` +
          `${shop}・EC-CUBE の在庫10・スマレジの在庫0・在庫履歴は承認済みの在庫増減数10の1行だけ、であることを画面で確かめた（記録の注記）`);
        return;
      }
    }
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await expectNoProductCodes(page, [product.商品コード], seedId);
      const categoryId = await readSupplyGoodsCategoryId(page);
      await uploadGoodsLines(page, {
        what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId, onIssue: issue,
        lines: [{ 商品コード: product.商品コード, 商品名: product.商品名, 基準価格: "1", 販売価格: "1", 買取価格: "1" }],
      });
      const productId = await readGoodsProductId(page, product.商品コード, product.商品名);
      await page.goto(adminUrl(`/product/product/${productId}/edit`));
      await openClassListFromProductEdit(page, productId);
      await publishImportedClass(page, product.商品コード, `${seedId} の商品規格の登録`, issue);
    });
    await withAdminSession(browser, org.申請者.account, async (page) => {
      const list = await searchStockByCode(page, { 商品コード: product.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      const row = list.row(product.商品コード, shop, "EC-CUBE");
      expect(await stockInRow(row), `${seedId}: 入庫の前の ${shop}・EC-CUBE の在庫`).toBe(0);
      await list.openEdit(row);
      await fillStockEdit(page, { 在庫変動区分: "入庫/その他", 在庫変動理由: "試験データ", 在庫増減数: "10", 仕入単価: "100", 承認通知先: org.承認者.名前 });
      await submitStockEdit(page, `${seedId} の在庫編集（入庫10）`, issue);
    });
    await withAdminSession(browser, org.承認者.account, async (page) => {
      await searchApprovals(page, { 店舗: shop, 登録者: org.申請者.名前 });
      await approveOne(page, "在庫編集", `${seedId} の在庫編集の承認`, issue);
      const list = await searchStockByCode(page, { 商品コード: product.商品コード, 店舗: shop, 在庫区分: "EC-CUBE" });
      expect(await stockInRow(list.row(product.商品コード, shop, "EC-CUBE")), `${seedId}: 承認のあとの ${shop}・EC-CUBE の在庫は10`).toBe(10);
    });
  });
}

/**
 * 前回の実行で作った商品が、シード表の状態（店舗・EC-CUBE の在庫10、スマレジの在庫0、在庫履歴は承認済みの在庫増減数10の1行だけ）であることを画面で確かめる。
 * 違えば止める（別の状態の商品を黙って使わない）。
 */
async function expectLeftoverIsSeedState(browser: Browser, org: RcOrg, shop: string, product: RcProduct, seedId: string): Promise<void> {
  await withAdminSession(browser, org.申請者.account, async (page) => {
    for (const [zone, want] of [["EC-CUBE", 10], ["スマレジ", 0]] as const) {
      const list = await searchStockByCode(page, { 商品コード: product.商品コード, 店舗: shop, 在庫区分: zone });
      expect(await stockInRow(list.row(product.商品コード, shop, zone)), `${seedId}: 残っていた商品の ${shop}・${zone} の在庫`).toBe(want);
    }
    const h = new StockHistoryPage(page);
    await h.open();
    await h.clearConditions();
    await h.fillKeyword(product.商品コード);
    await chooseHistoryShopAndZone(page, { 店舗: shop, 在庫区分: "EC-CUBE" });
    await h.form.locator('input[name="admin_stock_history[stock_location_id][]"]').and(page.getByLabel("スマレジ", { exact: true })).check();
    expect(await h.submit(), `${seedId}: 在庫履歴検索一覧の応答`).toBe(200);
    const rows = (await h.rows()).filter((r) => r["商品コード"] === product.商品コード);
    expect(rows.map((r) => ({ 在庫変動数: numberOf(r["在庫変動数"] ?? ""), 承認待ち: r["承認者"] === "承認待ち" })),
      `${seedId}: 残っていた商品の在庫履歴は、承認済みの在庫増減数10の1行だけ`).toEqual([{ 在庫変動数: 10, 承認待ち: false }]);
  });
}

// ---- M04-02 のシード ----

export const RC073 = rcOrg("rc0402-001", "RC0402-001", "Passw0rd-RC0402001");
export const RC074 = rcOrg("rc0402-002", "RC0402-002", "Passw0rd-RC0402002");

/** 073 の支店。店名・支店URL・支店・公開・開店はシード表の値。そのほかの必須項目は「任意の有効な値」 */
export const RC073_BRANCH_NAME = "RC0402-001支店";
export const RC073_BRANCH: RcStore = {
  支店: {
    店名: RC073_BRANCH_NAME, 店名カナ: "アールシーシテン", 店名英語: "RC Branch", 支店URL: "rc0402s001", 店名略称3文字: "R21", ショップ名略称: "RC0402-001支店",
    会社名: "株式会社晴れる屋", 会社名カナ: "カブシキガイシャハレルヤ", 郵便番号: "160-0022", 都道府県: "東京都", 住所1: "新宿区新宿2-2-2",
    住所2: "晴ビル21F", 電話番号: "03-0402-0001",
  },
};
export const MAIN_STORE: RcStore = { 本店: true };

defineRcOrg("S-M04-02-RC-ORG-073", RC073, RC073_BRANCH);
defineRcOrg("S-M04-02-RC-ORG-074", RC074, MAIN_STORE);
defineRcStock("S-M04-02-RC-STOCK-073", "S-M04-02-RC-ORG-073", RC073, RC073_BRANCH, { 商品コード: "RC0402001CODE", 商品名: "RC0402-001-NAME" });
defineRcStock("S-M04-02-RC-STOCK-074", "S-M04-02-RC-ORG-074", RC074, MAIN_STORE, { 商品コード: "RC0402002CODE", 商品名: "RC0402-002-NAME" });

