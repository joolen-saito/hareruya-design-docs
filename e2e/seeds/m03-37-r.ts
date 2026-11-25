/**
 * M03-37 略称タグ更新CSVの追加分のシード（024）。正本: cases/M03-37_seed_data.tsv
 * - S-M03-37-DATA-024: 商品ID 999999024 は「未登録」。正本は DB で商品を削除して不存在を確かめるが、商品は作らないので消す操作は無い（ケースが DB の参照で不存在を確かめる）。
 *   取込ファイル m0337_missing_product-024.csv はデータ「999999024,POR」。取込履歴0件は、履歴を DB で消さず、ケースが前後の件数を比べて確かめる。
 */
import { defineDataSeed, 見出し, utf8 } from "./m03-37";

defineDataSeed("S-M03-37-DATA-024", {
  items: [], words: ["m0337_missing_product-024.csv", "999999024,POR"],
  files: () => [["m0337_missing_product-024.csv", utf8([見出し, "999999024,POR"])]],
});
