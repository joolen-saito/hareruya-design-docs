/**
 * F02-02 のシードの、画面で作れない部分を DB で整える書き込み（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口）を通す。書く先は、この実行で作った印つきのカードセットだけ。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** カードセットの表示用HTML（フリーエリア(日)）を設定し、書いた値になったことを読んで確かめる */
export function カードセットの表示用HTMLを設定する(カードセットID: string, html: string): void {
  const n = writeTestData({
    理由: `カードセット ${カードセットID} の表示用HTMLを「${html}」にする（画面に入力欄が無い）`,
    sql: "update mtb_cardset set free_area_jp = $2 where id = $1::int",
    params: [カードセットID, html],
    対象の確かめ: "select id, name_jp from mtb_cardset where id = $1::int and name_jp like $2",
    確かめのparams: [カードセットID, `%${RUN_MARK}%`],
    印: RUN_MARK,
    最大行数: 1,
  });
  if (n !== 1) throw new Error(`カードセットの表示用HTML: 書き換えた行が ${n} 行（1行のはず）`);
  const r = query("select free_area_jp from mtb_cardset where id = $1::int", [カードセットID]);
  if (r[0]?.free_area_jp !== html) throw new Error(`カードセット ${カードセットID} の表示用HTMLが書いた値になっていない`);
}
