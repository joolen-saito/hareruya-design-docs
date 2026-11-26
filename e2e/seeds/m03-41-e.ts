/**
 * M03-41 カテゴリCSV登録の画面シード（その3）。正本: cases/M03-41_seed_data.tsv。既存の seeds/m03-41.ts は変えない。
 * 032: 商品が紐付く最上位カテゴリの削除フラグ1 / 061: 商品が紐付く階層2のカテゴリの削除フラグ1。
 * 作り方は 004（seeds/m03-41-d.ts）と同じ。グッズ商品CSV登録で1商品を作り、商品登録編集でカテゴリをこのカテゴリだけにする。
 * 商品コードには実行ごとの印を付けた（シード表は SKU-M0341-001-032・SKU-M0341-CB061。前の実行の商品が残ると作れないため。ケースは商品コードの値を見ない）。
 * 削除フラグの列が雛形の見出しに無いあいだは、ほかの削除のケース（031・060 など）と同じく、データを作らずに合否未判定（スキップ）で止める。
 */
import { test } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { 商品のカテゴリを付け替える, グッズ商品を取り込む } from "../pages/admin/a17_05_setup";
import { openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { カテゴリの対象商品数 } from "../db/m03_41_category";
import { DELETE_FLAG, defineCaseSeed, SeedOps } from "./m03-41";

async function 削除フラグの列を確かめる(o: SeedOps, what: string): Promise<void> {
  const columns = await o.columns();
  if (columns.includes(DELETE_FLAG)) return;
  test.skip(true, `合否未判定（正本の前提を作れない。記録の裁定案1の判断待ち）。${o.seedId}: シード表はカテゴリCSVの列の最後に「${DELETE_FLAG}」を挙げるが、` +
    `カテゴリCSV登録画面の雛形ファイルの見出し（${columns.join("・")}）に無い。この列を足したファイルは、取込が列の数の違いで値を見ずに止めるので、${what}を確かめられない。カテゴリは作っていない`);
}

async function 商品を1件つなぐ(o: SeedOps, categoryId: string, code: string, nameJp: string, nameEn: string): Promise<void> {
  await グッズ商品を取り込む(o.page, o.seedId, [{ 商品コード: code, 商品名日: nameJp, 商品名英: nameEn, 価格: "100" }], o.warn);
  const pid = await openProductEditByCode(o.page, code);
  await 商品のカテゴリを付け替える(o.page, pid, [categoryId], `${o.seedId}: 商品 ${code}`, o.warn);
  const n = カテゴリの対象商品数(categoryId);
  if (n !== 1) throw new Error(`${o.seedId}: カテゴリID ${categoryId} に紐付く商品が ${n} 件（1件のはず）`);
}

defineCaseSeed("S-M03-41-CASE-032", async (o) => {
  await 削除フラグの列を確かめる(o, "商品が紐付くカテゴリの削除の指定（削除フラグ1）で、カテゴリが削除済みにならないこと");
  const c = await o.top("専用カテゴリ-032", "M0341 Category-032");
  o.note("032", c);
  await 商品を1件つなぐ(o, c, rc("SKU-M0341-001-032"), "カテゴリ関連商品-032", "Category Product-032");
  await o.file("delete_with_product-032.csv", [await o.fromExport(c, { [DELETE_FLAG]: "1" })], { 削除フラグ: true });
});

defineCaseSeed("S-M03-41-CBDELPRODDEP2-061", async (o) => {
  await 削除フラグの列を確かめる(o, "商品が紐付く階層2のカテゴリの削除の指定（削除フラグ1）で、カテゴリが削除済みにならないこと");
  const a = await o.top("削除親M0341-CB061A", "M0341 Category-CB061A");
  o.note("061A", a);
  const b = await o.child(a, null, "削除子M0341-CB061B", "M0341 Category-CB061B");
  o.note("061B", b);
  await 商品を1件つなぐ(o, b, rc("SKU-M0341-CB061"), "関連商品M0341-CB061", "Related Product M0341-CB061");
  await o.file("delete_product_depth2-M0341-CB061.csv", [await o.fromExport(b, {
    "カテゴリ名(日)": "削除子M0341-CB061B", "カテゴリ名(英)": "M0341-CB061-B", 親カテゴリID: a, フロント非表示フラグ: "0", 支店非表示フラグ: "0", [DELETE_FLAG]: "1",
  })], { 削除フラグ: true });
});
