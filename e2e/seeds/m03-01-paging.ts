/** S-M03-01-PAGING-035〜038・042: 表示件数・ページ送りの確認用に、連番のグッズ商品を CSV 登録する。 */
import { expect } from "@playwright/test";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { GoodsLine, goodsCategoryFromSharedMaster, registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { countGoodsByName, readGoodsProductIdByName, removeProductsMatchingName } from "../pages/admin/m03_01_goods_list_seed";
import { M0301_ADMIN } from "./m03-01";

type PagingSeed = {
  /** 登録前に商品名(日/英)で検索し、あれば完全に削除する語 */
  cleanupName: string;
  /** 商品コードは「M0301S-0xx-」に行番号を続けた値 */
  codePrefix: string;
  /** n 行目（1始まり）の商品名(日)・商品名(英) */
  nameOf: (n: number) => string;
  rows: number;
  /** 商品名で検索して控える商品ID（正本の「控える」）。行番号と呼び名 */
  notes?: { row: number; label: string }[];
  /** アップロード後に、この語で検索した該当件数を確かめる（正本の「該当件数がN件であることを確かめる」） */
  verifyCountBy?: string;
};

function definePagingSeed(seedId: string, s: PagingSeed): void {
  defineSeed(seedId, { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
    const categoryId = goodsCategoryFromSharedMaster(notes, seed.シードID);
    await withAdminSession(browser, M0301_ADMIN, async (page) => {
      await removeProductsMatchingName(page, s.cleanupName, true);
      const lines: GoodsLine[] = [];
      for (let n = 1; n <= s.rows; n++) lines.push({ code: `${s.codePrefix}${n}`, nameJp: s.nameOf(n), nameEn: s.nameOf(n) });
      await registerGoodsCsv(page, {
        what: `${seed.シードID} の${s.rows}行グッズ商品CSV登録`,
        fileName: `${seedId.toLowerCase()}-goods.csv`,
        categoryId,
        lines,
        onWarning: (warning) => reportSeedIssue(seed.シードID, warning),
      });
      for (const n of s.notes ?? [])
        notes.set(n.label, await readGoodsProductIdByName(page, s.nameOf(n.row), `${s.codePrefix}${n.row}`));
      if (s.verifyCountBy)
        expect(await countGoodsByName(page, s.verifyCountBy), `${seed.シードID}: 「${s.verifyCountBy}」の該当件数`).toBe(s.rows);
    });
  });
}

const two = (n: number) => String(n).padStart(2, "0");

definePagingSeed("S-M03-01-PAGING-035", {
  cleanupName: "終端商品", codePrefix: "M0301S-035-", nameOf: (n) => `終端商品${two(n)}`, rows: 11,
  notes: [{ row: 1, label: "〔商品ID-M0301-035A〕" }, { row: 11, label: "〔商品ID-M0301-035K〕" }],
});
definePagingSeed("S-M03-01-PAGING-036", {
  cleanupName: "保持商品-036", codePrefix: "M0301S-036-", nameOf: (n) => `保持商品-036-${two(n)}`, rows: 51,
  verifyCountBy: "保持商品-036",
});
definePagingSeed("S-M03-01-PAGING-037", {
  cleanupName: "保持商品-037", codePrefix: "M0301S-037-", nameOf: (n) => `保持商品-037-${two(n)}`, rows: 51,
  verifyCountBy: "保持商品-037",
});
// 登録後は「終端商品-038-11」に受注・在庫の登録など削除を妨げる操作をしない（正本）
definePagingSeed("S-M03-01-PAGING-038", {
  cleanupName: "終端商品-038", codePrefix: "M0301S-038-", nameOf: (n) => `終端商品-038-${two(n)}`, rows: 11,
  notes: [{ row: 1, label: "〔商品ID-M0301-038A〕" }, { row: 11, label: "〔商品ID-M0301-038K〕" }],
});
definePagingSeed("S-M03-01-PAGING-042", {
  cleanupName: "保持商品-042", codePrefix: "M0301S-042-", nameOf: (n) => `保持商品-042-${two(n)}`, rows: 51,
  verifyCountBy: "保持商品-042",
});
