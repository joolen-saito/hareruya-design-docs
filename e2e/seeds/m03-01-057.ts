/**
 * S-M03-01-GROUP-057: 日本語のNM・SP・MP・HPの規格を1件ずつ持つグッズ商品を作り、在庫数(通販+TC東京)を
 * NM・SP・MP・HPの順に1・2・3・4にする。在庫は在庫編集で登録し、登録者とは別の管理者が承認する。
 */
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { adminUrl, withAdminSession } from "../lib/session";
import { goodsCategoryFromSharedMaster, registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsProductId, removeProductsMatchingName } from "../pages/admin/m03_01_goods_list_seed";
import { openClassListFromProductEdit } from "../pages/admin/m03_01_product_class";
import {
  StockApprovalListPage, StockListPage, addClassFromList, loggedInMemberName, registerStockEdit,
} from "../pages/admin/stock_edit";
import { M0301_ADMIN } from "./m03-01";

const NAME = "状態別表示商品-057";
/**
 * 在庫数(通販+TC東京)に数えられる店舗（本店）。アプリは店舗ID 1 の店舗を TC東京として数える。
 * 店名は環境で違う（作り直す前のDBは「トーナメントセンター 東京」、ダンプに戻したDBは「Hareruya」）ので、在庫検索一覧の検索欄「店舗」から読む。
 */
const TC_TOKYO_ID = "1";
const classes = [
  { condition: "NM", code: "M0301S-057-NM", stock: "1" },
  { condition: "SP", code: "M0301S-057-SP", stock: "2" },
  { condition: "MP", code: "M0301S-057-MP", stock: "3" },
  { condition: "HP", code: "M0301S-057-HP", stock: "4" },
] as const;

defineSeed("S-M03-01-GROUP-057", { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const categoryId = goodsCategoryFromSharedMaster(notes, seed.シードID);
  const sectionId = notes.get("〔部門ID-M0301-共有〕");
  // 承認する管理者（登録者の M03-01試験管理者 とは別の、承認権限を持つ管理者）の名前を画面から読む
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const MAIN_SHOP = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById(TC_TOKYO_ID));
  const registeredBy = await withAdminSession(browser, M0301_ADMIN, async (page) => {
    const registrant = await loggedInMemberName(page);
    if (registrant === approverName) throw new Error(`${seed.シードID}: 登録者と承認者が同じ管理者になっている`);
    await removeProductsMatchingName(page, NAME, true);
    const { japaneseLanguageId } = await registerGoodsCsv(page, {
      what: `${seed.シードID} の1行グッズ商品CSV登録`, fileName: "m03-01-057-goods.csv", categoryId,
      lines: [{ code: classes[0].code, nameJp: NAME, nameEn: NAME }], onWarning: issue,
    });
    const productId = await readGoodsProductId(page, classes[0].code, NAME);
    notes.set("〔商品ID-M0301-057〕", productId);

    // 規格設定で SP・MP・HP の規格を追加する（部門は「任意の部門」として共有シードの M03部門A）
    await page.goto(adminUrl(`/product/product/${productId}/edit`));
    await openClassListFromProductEdit(page, productId);
    for (const c of classes.slice(1))
      await addClassFromList(page, { conditionCode: c.condition, code: c.code, japaneseLanguageId, sectionName: "M03部門A", sectionId }, issue);

    // 在庫検索一覧で規格ごとに、本店・在庫区分 EC-CUBE の行から在庫編集を開いて入庫する
    const stock = new StockListPage(page);
    for (const c of classes) {
      await stock.searchByProductCode(c.code);
      await stock.openEdit(stock.row(c.code, MAIN_SHOP, "EC-CUBE"));
      await registerStockEdit(page, {
        changeType: "入庫/その他", reason: "テストデータ", quantity: c.stock, purchasePrice: "1", approverName,
      }, `${c.code} の在庫編集（${c.stock}）`, issue);
    }
    return registrant;
  });

  // 登録した管理者とは別の、承認権限を持つ管理者で、上の未承認の行をすべて承認する
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(MAIN_SHOP);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registeredBy
      && r.shop.startsWith(MAIN_SHOP) && r.changeType.endsWith("入庫/その他"));
    const ids: string[] = [];
    for (const c of classes) {
      const hit = rows.filter((r) => r.quantity === c.stock && !ids.includes(r.id));
      if (hit.length === 0) throw new Error(`${seed.シードID}: ${c.code} の在庫編集（${c.stock}）の未承認の行が一覧に無い`);
      // 同じ数量の未承認の行が複数あれば、一覧の先頭（新しいもの）を取る
      ids.push(hit[0].id);
      if (hit.length > 1) issue(`${c.code} と同じ数量（${c.stock}）の未承認の行が${hit.length}件あり、一覧の先頭を承認した`);
    }
    await list.approve(ids, `${seed.シードID} の在庫編集の承認（${ids.length}件）`, issue);
  });
});
