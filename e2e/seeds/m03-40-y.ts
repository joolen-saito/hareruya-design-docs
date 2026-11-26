/**
 * M03-40 棚番号更新CSV登録の続き（-y）のシード。正本: cases/M03-40_seed_data.tsv
 * 033: 形式の誤り（見出しの誤り・見出しだけ・3列）の取込ファイルを試験端末に作る。ファイル名は拡張子の前に実行の印を付ける。
 */
import fs from "node:fs";
import path from "node:path";
import { STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { RUN_MARK } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { CsvFile } from "../pages/admin/m03_38_product_status_csv";
import { SHELF_CSV_HEADERS } from "./m03-40";

const RUNTIME_DIR = path.join(STATE_DIR, "m03-40-y");
const files = new Map<string, CsvFile & { 内容の要約: string }>();

export function m0340yFile(正本の名前: string): CsvFile & { 内容の要約: string } {
  const f = files.get(正本の名前);
  if (!f) throw new Error(`${正本の名前} は M03-40 の -y のシードがまだ作っていない`);
  return f;
}

function 置く(正本の名前: string, text: string, 内容の要約: string): void {
  const dot = 正本の名前.lastIndexOf(".");
  const name = `${正本の名前.slice(0, dot)}-${RUN_MARK}${正本の名前.slice(dot)}`;
  const bytes = Buffer.from(text, "utf-8");
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const file = path.join(RUNTIME_DIR, name);
  fs.writeFileSync(file, bytes);
  if (!fs.readFileSync(file).equals(bytes)) throw new Error(`${file} を書いた中身と読み戻した中身が違う`);
  files.set(正本の名前, { name, bytes, mimeType: "text/csv", 内容の要約: `${内容の要約}（${bytes.length}バイト）` });
}

defineSeed("S-M03-40-DATA-033", async ({ seed }) => {
  const id = seed.シードID;
  const s = getSeed(id);
  const text = s["状態・属性"] + s.投入方法;
  for (const w of ["m0340-bad-header-033.csv", "商品番号,棚番号名称", "34003301,S-002-033", "m0340-header-only-033.csv", "m0340-three-columns-033.csv"]) {
    if (!text.includes(w)) throw new Error(`${id}: シード表に「${w}」が無い（書き写しの誤り）`);
  }
  const head = SHELF_CSV_HEADERS.join(",");
  置く("m0340-bad-header-033.csv", "商品番号,棚番号名称\n34003301,S-002-033\n", "見出し「商品番号,棚番号名称」＋データ「34003301,S-002-033」");
  置く("m0340-header-only-033.csv", `${head}\n`, `正規の見出し「${head}」だけ`);
  置く("m0340-three-columns-033.csv", `${head},追加列\n34003302,S-002-033,追加\n`, `正規の2列＋追加の列の3列（見出し＋データ1行）`);
});
