/**
 * F09-01 デッキ検索TOP の DB での準備・確認。物理名はこのファイルの SQL の中だけに書く。
 *
 * - 書き込み（準備）は db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを使う。対象は「画面で登録した、実行の印つきのデッキ」だけ
 *   （プレイヤー名に実行の印が入っているデッキ。対象の確かめで、印を含まない行があれば書かない）。
 * - 確認は参照（SELECT）だけ。
 */
import { writeTestData } from "./write_adapter";
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";

function 印つきか(プレイヤー名: string): void {
  if (!プレイヤー名.includes(RUN_MARK)) throw new Error(`プレイヤー名「${プレイヤー名}」に実行の印が無い（共有のデッキには書かない）`);
}

/** 画面で登録した印つきのデッキの登録日を、いまから N 日前にする（デッキの新規登録画面に登録日の欄が無いため） */
export function デッキの登録日を設定する(プレイヤー名: string, 日前: number): number {
  印つきか(プレイヤー名);
  return writeTestData({
    理由: `プレイヤー名「${プレイヤー名}」のデッキの登録日を当日の${日前}日前にする（画面に登録日の入力欄が無い）`,
    sql: "update dtb_deck set create_date = now() - make_interval(days => $2::int) where player_name = $1 and deleted_at is null",
    params: [プレイヤー名, 日前],
    対象の確かめ: "select id, player_name from dtb_deck where player_name = $1 and deleted_at is null",
    確かめのparams: [プレイヤー名],
    印: プレイヤー名,
    最大行数: 1,
  });
}

/** 日本時間の「2026/01/01 10:00:00」形式の日時を、更新日時として設定する（デッキの新規登録画面に更新日時の欄が無いため） */
export function デッキの更新日時を設定する(プレイヤー名: string, 日時: string): number {
  印つきか(プレイヤー名);
  return writeTestData({
    理由: `プレイヤー名「${プレイヤー名}」のデッキの更新日時を ${日時} にする（画面に更新日時の入力欄が無い）`,
    sql: "update dtb_deck set update_date = (to_timestamp($2, 'YYYY/MM/DD HH24:MI:SS')::timestamp at time zone 'Asia/Tokyo') where player_name = $1 and deleted_at is null",
    params: [プレイヤー名, 日時],
    対象の確かめ: "select id, player_name from dtb_deck where player_name = $1 and deleted_at is null",
    確かめのparams: [プレイヤー名],
    印: プレイヤー名,
    最大行数: 1,
  });
}

export type デッキの行 = { 件数: number[]; 更新日時: string[] };

/** プレイヤー名ごとのデッキの件数と更新日時（日本時間の「yyyy/mm/dd hh:mm:ss」。渡した名前の順） */
export function プレイヤー名のデッキの更新日時(プレイヤー名: string[]): デッキの行 {
  const rows = プレイヤー名.map((n) => query(
    "select count(*) as n, min(to_char(update_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS')) as t from dtb_deck where player_name = $1 and deleted_at is null",
    [n],
  )[0]);
  return { 件数: rows.map((r) => Number(r.n)), 更新日時: rows.map((r) => r.t ?? "") };
}
