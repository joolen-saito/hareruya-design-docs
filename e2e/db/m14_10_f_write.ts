/**
 * M14-10 のシードが、画面で作った「実行の印つき」のカードセットを ARENA 対応にするための DB 書き込み。
 * 依頼者の承認（2026-11-10）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す）だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印つきの名前を持つカードセット1件だけ（対象の確かめの SELECT が返す行は、どれも印を含む）。
 *  - 既存（人が作った）のカードセットは書き換えない。
 *  - 物理名はこのファイルの SQL の中にだけ書く。
 *
 * 理由: カードセットを ARENA 対応にする入力欄は、管理画面のカードセット詳細に無い。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

/** カードセットを ARENA 対応にする（カードセット名(英)に実行の印を含むカードセットだけ） */
export function カードセットをARENA対応にする(カードセットID: string | number, 理由: string): number {
  return writeTestData({
    理由,
    sql: `update mtb_cardset set arena_legal_flg = true where id = $1::int`,
    params: [String(カードセットID)],
    対象の確かめ: `select id as カードセットID, name_en as カードセット名 from mtb_cardset where id = $1::int`,
    確かめのparams: [String(カードセットID)],
    印: `-${RUN_MARK}`,
    最大行数: 1,
  });
}
