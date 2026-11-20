/**
 * M03-01 商品マスターの検索: 販売数の範囲・規格更新日のシード（RANGE-SALES・RANGE-022・RANGE-054・CAL-055）。正本: cases/M03-01_seed_data.tsv
 * 商品はグッズ商品CSV登録（正本どおり）で作り、画面で指定できない値（期間別販売数・規格の更新日時）だけ、E2E が作った規格へ DB で書き足す
 * （依頼者決定 2026-11-10）。商品コード・商品名は決め打ちなので実行の印を付ける（依頼者決定 2026-10-28）。ケースの検索も同じ印つきの商品名で行う。
 * 販売数(通販+TC東京)は本店（店舗ID 1）の行、販売数(支店)は試験支店（店舗ID 1574）の行として書く。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { rc } from "../lib/run_marker";
import { expectSaved } from "../pages/admin/common";
import {
  buildGoodsCsv, downloadGoodsCsvTemplate, publishedValue, readExistingSellGroupName, readJapaneseLanguageId, uploadGoodsCsv,
} from "../pages/admin/m03_01_goods_csv";
import { readGoodsProductId } from "../pages/admin/m03_01_goods_list_seed";
import { 試験支店の店舗ID } from "../pages/admin/reuse_store";
import { 規格の更新日時を書き足す, 販売数を足す, 期間別販売数 } from "../db/m03_01_w";
import { M0301_ADMIN } from "./m03-01";

type 商品 = { 枝: string; ラベル: string; 本店販売数?: 期間別販売数; 支店販売数?: 期間別販売数; 更新日時?: string };
const 週 = (n: number): 期間別販売数 => [0, 0, 0, n, 0, 0];

function defineGoods(seedId: string, tag: string, 商品名: string, items: 商品[]): void {
  defineSeed(seedId, { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
    const categoryId = notes.get("〔カテゴリID-M0301-共有A〕");
    if (!/^\d+$/.test(categoryId)) throw new Error(`${seed.シードID}: 共有カテゴリ A の採番 ID を画面から控えていない`);
    const name = rc(商品名);
    const codes = items.map((it) => rc(`M0301S-${tag}${it.枝}`));
    await withAdminSession(browser, M0301_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const template = await downloadGoodsCsvTemplate(page);
      const common = {
        "商品ID": "", "言語(ID)": await readJapaneseLanguageId(page),
        "商品公開ステータス": publishedValue(template, "商品公開ステータス"), "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
        "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId, "購入グループ名称": await readExistingSellGroupName(page),
        "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10", "商品名(日)": name, "商品名(英)": name, "部門ID": "",
      };
      await uploadGoodsCsv(page, buildGoodsCsv(template, items.map((_, i) => ({ ...common, "商品コード": codes[i] }))), `${seedId.toLowerCase()}-goods.csv`);
      for (const w of await expectSaved(page, `${seedId} のグッズ商品CSV登録`)) reportSeedIssue(seed.シードID, w);
      for (const [i, it] of items.entries()) notes.set(it.ラベル, await readGoodsProductId(page, codes[i], name));
    });
    for (const [i, it] of items.entries()) {
      if (it.本店販売数) { 販売数を足す(`${seedId}: ${codes[i]} の販売数(通販+TC東京)`, codes[i], "1", it.本店販売数); }
      if (it.支店販売数) { 販売数を足す(`${seedId}: ${codes[i]} の販売数(支店)`, codes[i], 試験支店の店舗ID(), it.支店販売数); }
      if (it.更新日時) 規格の更新日時を書き足す(`${seedId}: ${codes[i]} の規格更新日時`, codes[i], it.更新日時);
    }
    reportSeedIssue(seed.シードID, "商品名・商品コードに実行の印を付けた。期間別販売数・規格の更新日時は画面で指定できないので、E2E が作った規格へ DB で書き足した（販売数(通販+TC東京)＝本店の行、販売数(支店)＝試験支店の行）");
  });
}

defineGoods("S-M03-01-RANGE-SALES", "SALES-", "販売期間商品", [
  { 枝: "A", ラベル: "〔商品ID-M0301-共有A〕", 本店販売数: 週(3) }, { 枝: "B", ラベル: "〔商品ID-M0301-共有B〕", 本店販売数: 週(5) }, { 枝: "C", ラベル: "〔商品ID-M0301-共有C〕", 本店販売数: 週(7) },
]);
defineGoods("S-M03-01-RANGE-022", "022", "更新日境界商品-022", [
  { 枝: "A", ラベル: "〔商品ID-M0301-022A〕", 更新日時: "2026-09-03 00:00:00+09" }, { 枝: "B", ラベル: "〔商品ID-M0301-022B〕", 更新日時: "2026-09-03 23:59:59+09" },
  { 枝: "C", ラベル: "〔商品ID-M0301-022C〕", 更新日時: "2026-09-04 00:00:00+09" },
]);
defineGoods("S-M03-01-RANGE-054", "054", "販売数対象商品-054", [
  { 枝: "A", ラベル: "〔商品ID-M0301-054A〕", 本店販売数: 週(5), 支店販売数: 週(50) }, { 枝: "B", ラベル: "〔商品ID-M0301-054B〕", 本店販売数: 週(50), 支店販売数: 週(5) },
]);
defineGoods("S-M03-01-CAL-055", "055", "カレンダー選択商品-055", [{ 枝: "", ラベル: "〔商品ID-M0301-055〕", 更新日時: "2026-09-03 12:00:00+09" }]);
