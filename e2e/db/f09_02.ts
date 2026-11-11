/**
 * F09-02 デッキ検索結果 の DB での準備。物理名はこのファイルの SQL の中だけに書く。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを使い、対象は「画面で登録した、実行の印つきのデッキ」だけ
 * （プレイヤー名に実行の印が入っているデッキ。印を含まない行があれば書かない）。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";
import { デッキの更新日時を設定する as 更新日時を設定する } from "./f09_01";

function 印つきか(プレイヤー名: string): void {
  if (!プレイヤー名.includes(RUN_MARK)) throw new Error(`プレイヤー名「${プレイヤー名}」に実行の印が無い（共有のデッキには書かない）`);
}

/** 画面で登録した印つきのデッキのアーキタイプを未設定にする（デッキの登録・編集画面はアーキタイプが必須のため） */
export function デッキのアーキタイプを未設定にする(プレイヤー名: string): number {
  印つきか(プレイヤー名);
  return writeTestData({
    理由: `プレイヤー名「${プレイヤー名}」のデッキのアーキタイプを未設定にする（画面でアーキタイプを未設定にできない）`,
    sql: "update dtb_deck set archetype_id = null where player_name = $1 and deleted_at is null",
    params: [プレイヤー名],
    対象の確かめ: "select id, player_name from dtb_deck where player_name = $1 and deleted_at is null",
    確かめのparams: [プレイヤー名],
    印: プレイヤー名,
    最大行数: 1,
  });
}

/** 日本時間の「2025/01/05 10:00:00」形式の日時を、印つきのデッキの更新日時にする（F09-01 と同じ書き方） */
export function デッキの更新日時を設定する(プレイヤー名: string, 日時: string): number {
  印つきか(プレイヤー名);
  return 更新日時を設定する(プレイヤー名, 日時);
}
