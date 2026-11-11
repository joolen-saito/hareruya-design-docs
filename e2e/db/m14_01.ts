/**
 * M14-01 カード検索のシード・DB確認。物理名はこのファイルの SQL の中にだけ書く。
 *  - カードの更新日時を設定する: 依頼者の承認（2026-11-10）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す。
 *    書き換えるのは、画面で作った「実行の印つき」のカードの更新日時だけ（対象の確かめの SELECT が返す行は、どれも印を含む）。
 *  - カードの値を読む: 参照だけ。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

/** 画面で作ったカード（実行の印つき）の更新日時を、日時（例 "2026-09-01 00:00:00+09"）に設定する */
export function カードの更新日時を設定する(カードIDs: string[], 日時: string, 理由: string): number {
  const ids = カードIDs.join(",");
  return writeTestData({
    理由,
    sql: `update mtb_card set update_date = $2::timestamptz where id = any(string_to_array($1, ',')::int[])`,
    params: [ids, 日時],
    対象の確かめ: `select id, name_en, text_en from mtb_card where id = any(string_to_array($1, ',')::int[])`,
    確かめのparams: [ids],
    印: RUN_MARK,
    最大行数: カードIDs.length,
  });
}

export type カードの記録 = { カードID: string; カード名日: string | null; カード名英: string; ルールテキスト英: string | null; 更新日時: string; 詳細の数: string };

/** カードの値・件数・更新日時（検索の前後で比べる） */
export function カードの記録(カードIDs: string[]): カードの記録[] {
  return query(`select c.id, c.name_jp, c.name_en, c.text_en, c.update_date::text as upd, (select count(*) from mtb_card_detail d where d.card_id = c.id)::text as n
    from mtb_card c where c.id = any(string_to_array($1, ',')::int[]) order by c.id`, [カードIDs.join(",")])
    .map((r) => ({ カードID: String(r.id), カード名日: r.name_jp, カード名英: String(r.name_en), ルールテキスト英: r.text_en, 更新日時: String(r.upd), 詳細の数: String(r.n) }));
}
