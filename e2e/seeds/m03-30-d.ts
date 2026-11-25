/**
 * M03-30 基準価格変更CSV登録（その2）の画面シード。正本: cases/M03-30_seed_data.tsv
 * - S-M03-30-DATA-025: rows_5010-025.tsv（引用符外の改行が5010個）。見出し行（設計の5列）＋数値のデータ行5009行で、末尾に改行1個（合計5010個）。
 *   正本は「数値のデータ行」としか書かず値が決まらないので、データ行は 014 と同じく商品ID 999999999（開発環境に無い商品）・言語ID 1・基準価格1200・買取価格500・原価単価350の同じ行にした
 *   （商品を書き換えない。シード表に無い値の補い。記録の注記）。ファイルは実行のたびに e2e/.state/m03-30/025/ に作る。
 */
import fs from "node:fs";
import path from "node:path";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { M0330_COLUMNS, m0330FilePath } from "./m03-30";

defineSeed("S-M03-30-DATA-025", { needs: ["S-M03-30-ADM"] }, async ({ seed }) => {
  const file = "rows_5010-025.tsv";
  if (!getSeed(seed.シードID)["状態・属性"].includes(file)) throw new Error(`${seed.シードID}: シード表の状態・属性にファイル名 ${file} が無い`);
  const header = M0330_COLUMNS.join("\t");
  const row = ["999999999", "1", "1200", "500", "350"].join("\t");
  const text = [header, ...Array.from({ length: 5009 }, () => row)].join("\n") + "\n";
  const newlines = (text.match(/\n/g) ?? []).length;
  if (newlines !== 5010) throw new Error(`${seed.シードID}: 改行の数が5010でない（${newlines}）`);
  const p = m0330FilePath("025", file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, "utf-8");
  reportSeedIssue(seed.シードID, `${file}: UTF-8・タブ区切り・LF。見出し行（設計の5列）＋同じデータ行5009行（商品ID 999999999・言語ID 1・基準価格1200・買取価格500・原価単価350。正本は値を書いていないので、014 と同じ行にした）。改行は5010個`);
});
