/**
 * M09-07 ブロック管理のシード・手順の、画面で指定できない設定を DB で行う書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す。書く先は、画面で作った、ブロック名に実行の印が入っているブロックだけ。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { writeTestData } from "./write_adapter";

const 対象の確かめ = "select b.block_name as 印つきの名前 from dtb_block b where b.id = $1::int";

/** 印つきのブロックを削除不可にする（画面には削除不可を指定する欄が無い） */
export function ブロックを削除不可にする(ブロックID: string, 印: string): void {
  if (!/^\d+$/.test(ブロックID)) throw new Error(`ブロックIDが数字でない（${ブロックID}）`);
  const n = writeTestData({
    理由: `実行の印つきのブロック ${ブロックID} を削除不可にする（画面には削除不可を指定する欄が無い）`,
    sql: "update dtb_block set deletable = false where id = $1::int",
    params: [ブロックID], 対象の確かめ, 確かめのparams: [ブロックID], 印, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`ブロック ${ブロックID} を削除不可にした行が ${n} 行（1行のはず）`);
}

/** 印つきのブロックをSP向けにする（画面には端末種別を指定する欄が無い） */
export function ブロックをSP向けにする(ブロックID: string, 印: string): void {
  if (!/^\d+$/.test(ブロックID)) throw new Error(`ブロックIDが数字でない（${ブロックID}）`);
  const n = writeTestData({
    理由: `実行の印つきのブロック ${ブロックID} をSP向けにする（画面には端末種別を指定する欄が無い）`,
    sql: "update dtb_block set device_type_id = 2 where id = $1::int",
    params: [ブロックID], 対象の確かめ, 確かめのparams: [ブロックID], 印, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`ブロック ${ブロックID} をSP向けにした行が ${n} 行（1行のはず）`);
}
