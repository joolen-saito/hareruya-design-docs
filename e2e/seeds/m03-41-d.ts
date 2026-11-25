/**
 * M03-41 カテゴリCSV登録の画面シード（その2）。正本: cases/M03-41_seed_data.tsv
 * - S-M03-41-CASE-004: 専用親カテゴリ-004（最上位）の下の「更新前カテゴリ-004」（表示ランク2・検索 rarity=1・旧画像パス）に、
 *   グッズ商品CSV登録で作った7商品を商品登録編集で結び付け（対象商品数7）、update-004.csv を作る。
 *   正本は子カテゴリ作成で検索パラメーター rarity=1 を入れ、表示ランク・旧画像パスはカテゴリCSV登録の更新の行で設定する。
 *   商品コードには実行ごとの印を付けた（シード表は M0341-004-1〜7。前の実行の商品が残ると作れないため。ケースは商品コードの値を見ない）。
 *   update-004.csv の「新画像パス2種」は値が正本に無いので、旧画像パスと同じ並びの img/category/setbanner/m0341-new-banner-004.png・img/category/icon/m0341-new-icon-004.png にした。
 *   見出しは画面の雛形（12列）。対象商品数は雛形の列の「対象商品数」に999を入れる。
 */
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { 商品のカテゴリを付け替える, グッズ商品を取り込む } from "../pages/admin/a17_05_setup";
import { registerCategoryCsv } from "../pages/admin/category";
import { createChildFromList } from "../pages/admin/m03_41_category_csv";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { カテゴリの対象商品数 } from "../db/m03_41_category";
import { defineCaseSeed } from "./m03-41";

export const M0341_004 = {
  名称: "CSV更新カテゴリ-004", 英名: "M0341 Category-004B-After", 表示ランク: "8",
  検索: "rarity=2", バナー: "img/category/setbanner/m0341-new-banner-004.png", アイコン: "img/category/icon/m0341-new-icon-004.png",
  更新前対象商品数: 7,
};

defineCaseSeed("S-M03-41-CASE-004", async (o) => {
  const a = await o.top("専用親カテゴリ-004", "M0341 Category-004A");
  o.note("004A", a);
  const b = await createChildFromList(o.page, { id: a, parentOfParent: null }, { nameJp: "更新前カテゴリ-004", nameEn: "M0341 Category-004B", searchParameters: "rarity=1" }, o.warn);
  o.note("004B", b);
  const codes = Array.from({ length: 7 }, (_, i) => rc(`M0341-004-${i + 1}`));
  await グッズ商品を取り込む(o.page, o.seedId, codes.map((c, i) => ({ 商品コード: c, 商品名日: `対象商品-004-${i + 1}`, 商品名英: `Target Product-004-${i + 1}`, 価格: "1000" })), o.warn);
  for (const [i, c] of codes.entries()) {
    const pid = await openProductEditByCode(o.page, c);
    await 商品のカテゴリを付け替える(o.page, pid, [b], `${o.seedId}: 商品 ${c}`, o.warn);
    void i;
  }
  const n = カテゴリの対象商品数(b);
  if (n !== M0341_004.更新前対象商品数) throw new Error(`${o.seedId}: 更新前カテゴリ-004 の対象商品数が ${n}（7のはず）`);
  // 表示ランク2・検索 rarity=1・旧画像パスを、カテゴリCSV登録の更新の行で設定する
  const base = await o.fromExport(b, {
    表示ランク: "2", "カテゴリ名(日)": "更新前カテゴリ-004", "カテゴリ名(英)": "M0341 Category-004B", 親カテゴリID: a, フロント非表示フラグ: "0", 支店非表示フラグ: "0",
    検索パラメータ: "rarity=1", 最新セット用バナー画像パス: "img/category/setbanner/m0341-old-banner-004.png", カテゴリアイコン画像パス: "img/category/icon/m0341-old-icon-004.png",
  });
  await registerCategoryCsv(o.page, [base], `${o.seedId}-old.csv`, `${o.seedId}: 表示ランク・旧画像パスの設定`, o.warn);
  const v = M0341_004;
  await o.file("update-004.csv", [{
    ...base, 表示ランク: v.表示ランク, "カテゴリ名(日)": v.名称, "カテゴリ名(英)": v.英名, 親カテゴリID: "0", 階層: "99",
    フロント非表示フラグ: "1", 支店非表示フラグ: "1", 検索パラメータ: v.検索, 最新セット用バナー画像パス: v.バナー, カテゴリアイコン画像パス: v.アイコン, 対象商品数: "999",
  }]);
  reportSeedIssue(o.seedId, "update-004.csv の新画像パス・カテゴリ名(英)は正本に値が無いので、E2E が決めた値にした（記録の注記）。7商品は商品コードに実行の印を付けて作り、商品登録編集で商品カテゴリを更新前カテゴリ-004だけにした");
});
