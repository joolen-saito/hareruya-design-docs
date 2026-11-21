/**
 * M03-01 商品マスターの検索: 表示データ切り替え（販売数（支店））のシード（S-M03-01-STATS-028）。正本: cases/M03-01_seed_data.tsv
 * 商品はグッズ商品CSV登録（正本どおり）で作り、画面で指定できない期間別販売数だけ、E2E が作った規格へ DB で書き足す
 * （依頼者決定 2026-11-10。seeds/m03-01-sales.ts と同じ作り）。商品コード・商品名は決め打ちなので実行の印を付ける（依頼者決定 2026-10-28）。
 * 販売数(通販+TC東京)は本店（店舗ID 1）の行、販売数(支店)は試験支店（店舗ID 1574）の行として書く。
 * 入庫数（21〜26）は書き足さない（E2E が書ける部品が無く、ケースの期待結果は販売数（支店）の表示だけを見る）。
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
import { 販売数を足す } from "../db/m03_01_w";
import { M0301_ADMIN } from "./m03-01";

defineSeed("S-M03-01-STATS-028", { needs: ["S-M03-01-ADM", "S-M03-01-MASTERS-READ"] }, async ({ browser, notes, seed }) => {
  const categoryId = notes.get("〔カテゴリID-M0301-共有A〕");
  if (!/^\d+$/.test(categoryId)) throw new Error(`${seed.シードID}: 共有カテゴリ A の採番 ID を画面から控えていない`);
  const name = rc("統計商品-028");
  const code = rc("M0301S-028");
  await withAdminSession(browser, M0301_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const template = await downloadGoodsCsvTemplate(page);
    const row = {
      "商品ID": "", "言語(ID)": await readJapaneseLanguageId(page),
      "商品公開ステータス": publishedValue(template, "商品公開ステータス"), "支店の商品公開ステータス": publishedValue(template, "支店の商品公開ステータス"),
      "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": categoryId, "購入グループ名称": await readExistingSellGroupName(page),
      "基準価格": "100", "販売価格": "100", "買取価格": "10", "原価単価": "10", "商品名(日)": name, "商品名(英)": name, "部門ID": "", "商品コード": code,
    };
    await uploadGoodsCsv(page, buildGoodsCsv(template, [row]), "s-m03-01-stats-028-goods.csv");
    for (const w of await expectSaved(page, `${seed.シードID} のグッズ商品CSV登録`)) reportSeedIssue(seed.シードID, w);
    notes.set("〔商品ID-M0301-028〕", await readGoodsProductId(page, code, name));
  });
  販売数を足す(`${seed.シードID}: ${code} の販売数(通販+TC東京)`, code, "1", [1, 2, 3, 4, 5, 6]);
  販売数を足す(`${seed.シードID}: ${code} の販売数(支店)`, code, 試験支店の店舗ID(), [11, 12, 13, 14, 15, 16]);
  reportSeedIssue(seed.シードID, "商品名・商品コードに実行の印を付けた。期間別販売数は画面で指定できないので、E2E が作った規格へ DB で書き足した（販売数(通販+TC東京)は本店、販売数(支店)は試験支店の行）。入庫数（21〜26）は書き足していない（期待結果は販売数（支店）の表示だけを見る）");
});
