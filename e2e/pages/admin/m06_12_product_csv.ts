/**
 * M06-12 買取商品一覧CSV出力（買取一覧(検索結果) の「ダウンロード」→「買取商品一覧CSV」）。
 * 画面の部品は pages/admin/m06_otc_list.ts の OtcListPage を使い、ここではダウンロードしたCSVを見出しつきの行にする部品だけを足す。
 *
 * CSVの列（アプリの出力の定義で確かめた。OtcBuyOrderCsvExportService）: 商品コード・在庫増減数・商品名・基準価格・買取価格・言語ID・略称タグ・レアリティ・状態
 */
import { Download } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { OtcListPage } from "./m06_otc_list";

export type 商品一覧CSV = { 見出し: string[]; 行: Record<string, string>[] };

/** ダウンロードしたCSVを、見出しを列名にした行（出力の順）にする */
export async function 商品一覧CSVを読む(file: Download): Promise<商品一覧CSV> {
  const chunks: Buffer[] = [];
  for await (const c of await file.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const [見出し = [], ...body] = parseCsv(decodeCsvBytes(Buffer.concat(chunks)));
  return { 見出し, 行: body.map((cells) => Object.fromEntries(見出し.map((h, i) => [h, cells[i] ?? ""]))) };
}

/** 買取一覧(検索入力)を開き、査定IDを入れて検索する（査定申込日時・買取日時の初期値は空にする） */
export async function 査定IDで検索する(list: OtcListPage, 査定ID: string): Promise<void> {
  await list.open();
  await list.日時を空にする();
  await list.査定IDを入れる(査定ID);
  await list.検索する();
}
