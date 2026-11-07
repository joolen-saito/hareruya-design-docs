/** F06-16 大会デッキ登録編集・F06-17 のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 大会デッキ = {
  デッキID: string; フォーマットID: string; フォーマット名: string; プレイヤー名: string; メイン: string; サイド: string; 統率: string;
  公開設定: string; デッキタイプ: string; 編集者あり: boolean; 旧デッキID: string; 大会名: string; 開催日時: string; 選手ID: string;
};

const s = (v: string | null): string => v ?? "";

/** 日程・選手の大会デッキ（削除されていないもの）を、古い順に */
export function 大会デッキ一覧(日程ID: string, 選手ID: string): 大会デッキ[] {
  return query(
    `select d.id, d.format_id, f.name_jp as fname, d.player_name, d.text_main, d.text_side, d.text_command, disp.name as disp, d.deck_type_id as dt,
            d.member_id, d.old_deck_id, d.event_name_jp, to_char(d.event_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') as edate, d.player_id
       from dtb_deck d join mtb_format f on f.id = d.format_id left join mtb_disp disp on disp.id = d.disp_id
      where d.event_detail_id = $1::int and d.player_id = $2::int and d.deleted_at is null order by d.id`, [日程ID, 選手ID],
  ).map((r) => ({
    デッキID: s(r.id), フォーマットID: s(r.format_id), フォーマット名: s(r.fname), プレイヤー名: s(r.player_name), メイン: s(r.text_main), サイド: s(r.text_side), 統率: s(r.text_command),
    公開設定: s(r.disp), デッキタイプ: r.dt === "1" ? "イベント" : r.dt === "2" ? "ユーザー" : s(r.dt), 編集者あり: r.member_id !== null, 旧デッキID: s(r.old_deck_id),
    大会名: s(r.event_name_jp), 開催日時: s(r.edate), 選手ID: s(r.player_id),
  }));
}

export type デッキのカード = { カード名: string; ボード: string; 枚数: number };

/** デッキを構成するカード情報 */
export function デッキのカード情報(デッキID: string): デッキのカード[] {
  return query(
    `select c.name_en, b.name_en as board, dc.count from dtb_deck_card dc join mtb_card c on c.id = dc.card_id join mtb_board b on b.id = dc.board_id
      where dc.deck_id = $1::int order by dc.board_id, c.name_en`, [デッキID],
  ).map((r) => ({ カード名: s(r.name_en), ボード: s(r.board), 枚数: Number(r.count) }));
}

/** 会員の選手ID（会員ごとに1つ。無ければ null） */
export function 会員の選手ID(会員ID: string): string | null {
  return query(`select id from dtb_player where customer_id = $1::int and deleted_at is null`, [会員ID])[0]?.id ?? null;
}

/** 指定した番号のイベント詳細がある件数 */
export function イベント詳細の件数(日程ID: string): number {
  return Number(query(`select count(*) as n from dtb_event_detail where id = $1::int`, [日程ID])[0].n);
}

/** カード名（英語名）が一致する現行カード情報の件数 */
export function カードの件数(名: string): number {
  return Number(query(`select count(*) as n from mtb_card where name_en = $1`, [名])[0].n);
}

/** カード名（英語名）が一致する現行カード情報のうち、いちばん小さい番号 */
export function カードID(名: string): string {
  const r = query(`select min(id) as id from mtb_card where name_en = $1`, [名])[0]?.id;
  if (!r) throw new Error(`カード「${名}」が無い`);
  return r;
}

/** 画像つきのカード画像の行がある現行カード情報かどうか（カードの詳細に画像が1件以上） */
export function カードの画像件数(カードID: string): number {
  return Number(query(
    `select count(*) as n from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id where d.card_id = $1::int`, [カードID],
  )[0].n);
}

/** デッキIDのデッキ（大会デッキ）の保存項目 */
export function デッキ(デッキID: string): 大会デッキ | undefined {
  return query(
    `select d.id, d.format_id, f.name_jp as fname, d.player_name, d.text_main, d.text_side, d.text_command, disp.name as disp, d.deck_type_id as dt,
            d.member_id, d.old_deck_id, d.event_name_jp, to_char(d.event_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') as edate, d.player_id
       from dtb_deck d join mtb_format f on f.id = d.format_id left join mtb_disp disp on disp.id = d.disp_id
      where d.id = $1::int and d.deleted_at is null`, [デッキID],
  ).map((r) => ({
    デッキID: s(r.id), フォーマットID: s(r.format_id), フォーマット名: s(r.fname), プレイヤー名: s(r.player_name), メイン: s(r.text_main), サイド: s(r.text_side), 統率: s(r.text_command),
    公開設定: s(r.disp), デッキタイプ: r.dt === "1" ? "イベント" : r.dt === "2" ? "ユーザー" : s(r.dt), 編集者あり: r.member_id !== null, 旧デッキID: s(r.old_deck_id),
    大会名: s(r.event_name_jp), 開催日時: s(r.edate), 選手ID: s(r.player_id),
  }))[0];
}

/** 日程の大会デッキ（選手を問わない）の件数 */
export function 日程の大会デッキ件数(日程ID: string): number {
  return Number(query(`select count(*) as n from dtb_deck where event_detail_id = $1::int and deleted_at is null`, [日程ID])[0].n);
}

/** デッキを最後に編集した管理者（メンバー）の番号。編集者がいなければ空 */
export function 編集者ID(デッキID: string): string {
  return s(query(`select member_id from dtb_deck where id = $1::int`, [デッキID])[0]?.member_id ?? null);
}
