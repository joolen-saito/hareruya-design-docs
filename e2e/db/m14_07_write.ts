/**
 * M14-07 のシードが、画面（カードCSVの取り込み）で作った「実行の印つき」のカード詳細の画像を整えるための DB 書き込み。
 * 依頼者の承認（2026-11-10）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印つきのカード名(英)を持つカード詳細の画像だけ。対象の確かめの SELECT が返す行は、どれも印を含む。
 *  - マスタ（言語・プロモーション・レアリティなど）・既存のカードの画像は書き換えない。
 *  - 物理名はこのファイルの SQL の中にだけ書く。
 *
 * 理由: カードCSVは画像URL(英語)が必須で、画像を持たないカード詳細・日本語だけの画像・デッドリンクが真の画像は、画面からは作れない。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = `-${RUN_MARK}`;

function 確かめ(詳細ID: string | number) {
  return {
    対象の確かめ: `select d.id as 詳細ID, c.name_en as カード名 from mtb_card_detail d join mtb_card c on c.id = d.card_id where d.id = $1::int`,
    確かめのparams: [String(詳細ID)],
    印,
  };
}

/** 指定した言語の画像のレコードを消す（画像0件・日本語だけ、にするため） */
export function 画像を消す(詳細ID: string | number, 言語ID: number, 理由: string): number {
  return writeTestData({
    理由,
    sql: `delete from mtb_card_image where card_detail_id = $1::int and language_id = $2::int`,
    params: [String(詳細ID), 言語ID],
    ...確かめ(詳細ID),
    最大行数: 2,
  });
}

/** 指定した言語の画像のデッドリンクを設定する */
export function デッドリンクを設定する(詳細ID: string | number, 言語ID: number, 真: boolean, 理由: string): number {
  return writeTestData({
    理由,
    sql: `update mtb_card_image set dead_link_flg = ${真 ? "true" : "false"} where card_detail_id = $1::int and language_id = $2::int`,
    params: [String(詳細ID), 言語ID],
    ...確かめ(詳細ID),
    最大行数: 2,
  });
}
