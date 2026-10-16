/** S-M03-01-DELETE-040・041: 完全削除の確認用に、規格1件のグッズ商品を1件ずつ CSV 登録する。 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { goodsCategoryFromSharedMaster, registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { M0301_ADMIN } from "./m03-01";

function defineDeleteTargetSeed(seedId: string, product: { code: string; name: string; idNote: string }): void {
  defineSeed(seedId, { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
    const categoryId = goodsCategoryFromSharedMaster(notes, seed.シードID);
    await withAdminSession(browser, M0301_ADMIN, async (page) => {
      await registerGoodsCsv(page, {
        what: `${seed.シードID} の1行グッズ商品CSV登録`,
        fileName: `m03-01-${product.code.slice(-3)}-goods.csv`,
        categoryId,
        lines: [{ code: product.code, nameJp: product.name, nameEn: product.name }],
        onWarning: (warning) => reportSeedIssue(seed.シードID, warning),
      });
      // 登録後は、受注・在庫の登録など削除を妨げる操作をしない（正本）
      notes.set(product.idNote, await readGoodsProductId(page, product.code, product.name));
    });
  });
}

defineDeleteTargetSeed("S-M03-01-DELETE-040", { code: "M0301S-040", name: "削除完了商品-040", idNote: "〔商品ID-M0301-040〕" });
defineDeleteTargetSeed("S-M03-01-DELETE-041", { code: "M0301S-041", name: "削除取消商品-041", idNote: "〔商品ID-M0301-041〕" });
