/**
 * F09-05 その他デッキ一覧 の DB での準備・確認。物理名はこのファイルの SQL の中だけに書く。
 *
 * - 書き込み（準備）は db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを使う。対象は「画面で登録した、実行の印つきのデッキ」だけ
 *   （プレイヤー名に実行の印が入っているデッキ。対象の確かめで、印を含まない行があれば書かない）。依頼者の承認 2026-11-10「印つきデータは何でも」。
 * - アーキタイプの未設定・更新日時は F09-02 と同じ書き込み（db/f09_02.ts）を使う。ここには開催日時（秒）だけを置く。
 * - 確認は参照（SELECT）だけ。
 */
import { writeTestData } from "./write_adapter";
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";

function 印つきか(プレイヤー名: string): void {
  if (!プレイヤー名.includes(RUN_MARK)) throw new Error(`プレイヤー名「${プレイヤー名}」に実行の印が無い（共有のデッキには書かない）`);
}

/** 日本時間の「yyyy/mm/dd hh:mm:ss」の日時を、印つきのデッキの開催日時にする（デッキ編集画面の開催日の欄は分までで、秒を指定できないため） */
export function デッキの開催日時を設定する(プレイヤー名: string, 日時: string): number {
  印つきか(プレイヤー名);
  if (!/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(日時)) throw new Error(`開催日時「${日時}」が「yyyy/mm/dd hh:mm:ss」でない`);
  return writeTestData({
    理由: `プレイヤー名「${プレイヤー名}」のデッキの開催日時を ${日時}（日本時間）にする（画面の開催日の欄は分までで秒を指定できない）`,
    sql: "update dtb_deck set event_date = (to_timestamp($2, 'YYYY/MM/DD HH24:MI:SS')::timestamp at time zone 'Asia/Tokyo') where player_name = $1 and deleted_at is null",
    params: [プレイヤー名, 日時],
    対象の確かめ: "select id, player_name from dtb_deck where player_name = $1 and deleted_at is null",
    確かめのparams: [プレイヤー名],
    印: プレイヤー名,
    最大行数: 1,
  });
}

/** イベント名(日)が一致する（削除されていない）デッキの登録件数 */
export function イベント名のデッキの件数(イベント名: string): number {
  return Number(query("select count(*) as n from dtb_deck where event_name_jp = $1 and deleted_at is null", [イベント名])[0].n);
}

/** プレイヤー名のデッキの開催日時（日本時間の「yyyy/mm/dd hh:mm:ss」。無ければ空） */
export function デッキの開催日時(プレイヤー名: string): string {
  return query(
    "select min(to_char(event_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS')) as tt from dtb_deck where player_name = $1 and deleted_at is null",
    [プレイヤー名],
  )[0]?.tt ?? "";
}
