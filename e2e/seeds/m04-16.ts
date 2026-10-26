/**
 * M04-16 在庫リコメンドCSV出力の画面シード。正本: cases/M04-16_seed_data.tsv
 *
 * 作るのは、画面だけで準備できるケース（001・002・007・010）が使うシードだけ。
 * - S-M04-16-ADM: 試験管理者 m0416_admin。権限はシステム管理者（在庫管理を操作できる。M04-02・M04-17 などと同じ）。
 *   所属店舗・デフォルト検索表示店舗・編集可能店舗は TC東京（店舗ID 1）。所属は選択肢の先頭。
 * - S-M04-16-STORE-TC: 正本は「店舗ID 1 の店名を TC東京 にして開店で登録する」。店舗ID 1 は親店舗で、手元の環境の店名は「Hareruya」。
 *   ほかの担当のシード・ケースが店舗ID 1 の店名を画面から読んで同時に使っているので、店名は変えない（共有の店舗の名前を書き換えない）。
 *   店舗ID 1 の店舗編集画面で、開店になっていることだけを確かめる（記録の裁定案）。
 * - 商品・在庫（FILTER-*・LANGUAGE-007）: グッズ商品CSV登録で取り込み、試験管理者が在庫検索一覧から在庫編集で
 *   入庫/その他・試験データ作成・10・仕入単価0 を登録し、登録した管理者とは別の承認権限のある管理者が在庫編集承認一覧で承認する。
 *   承認する管理者は、正本が名前を定めていないので「M04-16試験承認者」（システム管理者・TC東京を編集可能）を、あれば使い無ければ登録する。
 *   在庫編集の承認通知先（メンバー選択）は正本に書かれていないが画面で必須なので、その承認する管理者を選ぶ。
 *   承認は、正本の「該当の行をそれぞれ開いて「承認する」」を、在庫編集承認一覧の一括承認でまとめて行う（承認の結果は同じ）。
 *   どの行が今回の登録かは、登録の前後の未承認の行の差で決める（一覧に商品コードの列が無い）。
 *   商品IDは、在庫検索一覧の検索結果から在庫編集画面を開き、表示された商品IDを控える。
 * - 商品コードは正本の固定の値で、正本に清掃の手順が無い。前の実行の商品が残っていれば作らずに止める（流し直すかは依頼者が決める）。
 * - 003〜006・008 のシード（一週前在庫などを「DBへ直接設定する」）は作らない。
 */
import { Browser, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { approveRows, expectNoProductCodes, pendingApprovalRows, readSupplyGoodsCategoryId } from "../pages/admin/m04_17_seed_ops";
import { stockEditValue } from "../pages/admin/m04_19_masters";
import { fillStockEdit, stockInRow, submitStockEdit } from "../pages/admin/m04_02_rc_stock";
import { ensureMemberByStoreIds } from "../pages/admin/m04_24_member";
import { openStockList, readLanguageId, searchByCode, uploadGoods } from "../pages/admin/m04_16_recommend_csv";
import { StockListPage } from "../pages/admin/stock_edit";

export const M0416_ADMIN: Account = { loginId: "m0416_admin", password: "Passw0rd!M0416" };
const ADMIN_NAME = "M04-16試験管理者";
const APPROVER: Account = { loginId: "m0416_approver", password: "Passw0rd!M0416R" };
const APPROVER_NAME = "M04-16試験承認者";
/** 正本の「TC東京」 */
export const TC_STORE_ID = "1";

const storeOneMember = (名前: string, account: Account, メールアドレス: string) => ({
  名前, ログインID: account.loginId, メールアドレス, パスワード: account.password, 権限: "システム管理者",
  所属店舗ID: TC_STORE_ID, デフォルト検索表示店舗ID: TC_STORE_ID, 編集可能店舗ID: [TC_STORE_ID],
});

defineSeed("S-M04-16-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, storeOneMember(ADMIN_NAME, M0416_ADMIN, "m0416_admin@example.test")));
  await withAdminSession(browser, M0416_ADMIN, async () => undefined);
});

defineSeed("S-M04-16-STORE-TC", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const res = await page.goto(adminUrl(`/mall/tenant/detail/${TC_STORE_ID}`));
    expect(res?.status(), "店舗ID 1 の店舗編集画面の応答").toBe(200);
    const name = (await page.locator('[name="mall_tenant_shop_master[shop_name]"]').inputValue()).trim();
    await expect(page.getByLabel("開店", { exact: true }), "店舗ID 1 は開店").toBeChecked();
    issue(`店舗ID 1 の店名は「${name}」。正本の「TC東京」には変えていない（ほかの担当が同時に使う親店舗の名前を書き換えない）。開店であることを確かめた`);
  });
});

/** 承認する管理者は、ワーカーの中で1回だけ用意する */
let approverReady = false;
async function ensureApprover(browser: Browser): Promise<void> {
  if (approverReady) return;
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberByStoreIds(page, storeOneMember(APPROVER_NAME, APPROVER, "m0416_approver@example.test")));
  approverReady = true;
}

type Product = { 商品コード: string; 商品名: string; 言語: "日本語" | "英語"; 控え: string };

/** 正本の言語(ID)（日本語「1」・英語「2」）。画面の言語の選択肢で、その表示名の言語IDが正本の値と同じことを確かめて使う */
const CANON_LANGUAGE_ID: Record<Product["言語"], string> = { 日本語: "1", 英語: "2" };

function defineProductSeed(seedId: string, products: Product[]): void {
  defineSeed(seedId, { needs: ["S-M04-16-ADM", "S-M04-16-STORE-TC"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const codes = products.map((p) => p.商品コード);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await expectNoProductCodes(page, codes, seedId);
      const categoryId = await readSupplyGoodsCategoryId(page);
      const ids: Record<string, string> = {};
      for (const lang of new Set(products.map((p) => p.言語))) {
        ids[lang] = await readLanguageId(page, lang);
        expect(ids[lang], `${seedId}: 言語「${lang}」の言語IDは正本の値`).toBe(CANON_LANGUAGE_ID[lang]);
      }
      await uploadGoods(page, {
        what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId, onIssue: issue,
        lines: products.map((p) => ({ 商品コード: p.商品コード, 商品名: p.商品名, 言語ID: ids[p.言語] })),
      });
    });
    await ensureApprover(browser);
    const shop = await withAdminSession(browser, M0416_ADMIN, (page) => new StockListPage(page).shopNameById(TC_STORE_ID));
    const pendingIds = async () => withAdminSession(browser, APPROVER, async (page) =>
      (await pendingApprovalRows(page, shop)).filter((r) => r.registrant === ADMIN_NAME).map((r) => r.id));
    const before = new Set(await pendingIds());
    await withAdminSession(browser, M0416_ADMIN, async (page) => {
      for (const p of products) {
        const list = await openStockList(page);
        await searchByCode(page, p.商品コード);
        const row = list.row(p.商品コード, shop, "EC-CUBE");
        expect(await stockInRow(row), `${seedId}: 入庫の前の ${p.商品コード}（${shop}・EC-CUBE）の在庫`).toBe(0);
        await list.openEdit(row);
        await fillStockEdit(page, { 在庫変動区分: "入庫/その他", 在庫変動理由: "試験データ作成", 在庫増減数: "10", 仕入単価: "0", 承認通知先: APPROVER_NAME });
        await submitStockEdit(page, `${seedId} の ${p.商品コード} の在庫編集（入庫10）`, issue);
      }
    });
    await withAdminSession(browser, APPROVER, async (page) => {
      const added = (await pendingApprovalRows(page, shop)).filter((r) => r.registrant === ADMIN_NAME && !before.has(r.id));
      expect(added.length, `${seedId}: 在庫編集承認一覧に今回の未承認の行が ${products.length} 件増えた`).toBe(products.length);
      await approveRows(page, added.map((r) => r.id), `${seedId} の在庫編集の承認（${added.length}件）`, issue);
    });
    await withAdminSession(browser, M0416_ADMIN, async (page) => {
      for (const p of products) {
        const list = await openStockList(page);
        await searchByCode(page, p.商品コード);
        const row = list.row(p.商品コード, shop, "EC-CUBE");
        expect(await stockInRow(row), `${seedId}: 承認のあとの ${p.商品コード}（${shop}・EC-CUBE）の在庫は10`).toBe(10);
        await list.openEdit(row);
        const id = await stockEditValue(page, "商品ID");
        if (!/^\d+$/.test(id)) throw new Error(`${seedId}: ${p.商品コード} の在庫編集画面の商品IDを読めない: 「${id}」`);
        notes.set(p.控え, id);
      }
    });
    issue("在庫編集の承認通知先（メンバー選択）は正本に書かれていないが画面で必須なので、承認する管理者「M04-16試験承認者」を選んだ。承認は在庫編集承認一覧の一括承認でまとめて行った");
  });
}

defineProductSeed("S-M04-16-FILTER-001", [
  { 商品コード: "REC-M04-16-A-001", 商品名: "検索対象商品A(001)", 言語: "日本語", 控え: "〔商品ID-M0416-001〕" },
]);
defineProductSeed("S-M04-16-FILTER-002", [
  { 商品コード: "REC-M04-16-A-002-1", 商品名: "検索対象商品A1", 言語: "日本語", 控え: "〔商品ID-M0416-002A〕" },
  { 商品コード: "REC-M04-16-A-002-2", 商品名: "検索対象商品A2", 言語: "日本語", 控え: "〔商品ID-M0416-002B〕" },
  { 商品コード: "REC-M04-16-B-002-1", 商品名: "検索除外商品B1", 言語: "日本語", 控え: "〔商品ID-M0416-002C〕" },
]);
defineProductSeed("S-M04-16-LANGUAGE-007", [
  { 商品コード: "REC-M04-16-LANG-007-JP", 商品名: "言語ID確認商品JP", 言語: "日本語", 控え: "〔商品ID-M0416-007A〕" },
  { 商品コード: "REC-M04-16-LANG-007-EN", 商品名: "言語ID確認商品EN", 言語: "英語", 控え: "〔商品ID-M0416-007B〕" },
]);
defineProductSeed("S-M04-16-FILTER-010", [
  { 商品コード: "REC-M04-16-A-010-1", 商品名: "検索対象商品A1", 言語: "日本語", 控え: "〔商品ID-M0416-010A〕" },
  { 商品コード: "REC-M04-16-A-010-2", 商品名: "検索対象商品A2", 言語: "日本語", 控え: "〔商品ID-M0416-010B〕" },
  { 商品コード: "REC-M04-16-B-010-1", 商品名: "検索除外商品B1", 言語: "日本語", 控え: "〔商品ID-M0416-010C〕" },
]);
