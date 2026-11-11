// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/** F06-16 大会デッキ登録編集のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 大会デッキ = {
  デッキID: string; プレイヤー名: string | null; 内容メイン: string; 内容サイド: string; 内容統率: string;
  フォーマット: string; 公開設定: string; デッキタイプ: string; デッキ編集者: string | null; 旧デッキID: string | null;
  イベント名日: string | null; イベント名英: string | null; 開催日時: string | null; イベント詳細ID: string | null;
};

/** 日程（イベント詳細）と選手の、削除されていない大会デッキ（フォーマットを指定すればそのフォーマットだけ）。デッキIDの順 */
export function 大会デッキ一覧(イベント詳細ID: string, 選手ID: string, フォーマットID?: string): 大会デッキ[] {
  const base = `select d.id, d.player_name, coalesce(d.text_main, '') as text_main, coalesce(d.text_side, '') as text_side,
      coalesce(d.text_command, '') as text_command, f.name_jp as format_name, p.name as disp_name, t.name as deck_type_name,
      d.member_id, d.old_deck_id, d.event_name_jp, d.event_name_en, to_char(d.event_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') as event_date,
      d.event_detail_id
    from dtb_deck d
    left join mtb_format f on f.id = d.format_id
    left join mtb_disp p on p.id = d.disp_id
    left join mtb_deck_type t on t.id = d.deck_type_id
   where d.event_detail_id = $1::int and d.player_id = $2::int and d.deleted_at is null`;
  const rows = フォーマットID
    ? query(`${base} and d.format_id = $3::int order by d.id`, [イベント詳細ID, 選手ID, フォーマットID])
    : query(`${base} order by d.id`, [イベント詳細ID, 選手ID]);
  return rows.map((r) => ({
    デッキID: r.id ?? "", プレイヤー名: r.player_name, 内容メイン: (r.text_main ?? "").replace(/\r\n/g, "\n"), 内容サイド: (r.text_side ?? "").replace(/\r\n/g, "\n"),
    内容統率: (r.text_command ?? "").replace(/\r\n/g, "\n"), フォーマット: r.format_name ?? "", 公開設定: r.disp_name ?? "", デッキタイプ: r.deck_type_name ?? "",
    デッキ編集者: r.member_id, 旧デッキID: r.old_deck_id, イベント名日: r.event_name_jp, イベント名英: r.event_name_en, 開催日時: r.event_date, イベント詳細ID: r.event_detail_id,
  }));
}

/** 番号（イベントID・イベント詳細IDのどちらでも）の日程（イベント詳細）の件数。削除済みの日程も数える */
export function 番号の日程の件数(番号: string): number {
  return Number(query(`select count(*) as n from dtb_event_detail where event_id = $1::int or id = $1::int`, [番号])[0].n);
}

export type デッキのカード ={ カード名英: string; 枚数: number; ボード: string };

/** デッキを構成するカード情報の控え（番号・ボード・カード名(英)・枚数。番号順）。「更新されない」「削除された」の確かめに使う */
export function カード情報の控え(デッキID: string): string[] {
  return query(
    `select dc.id as i, dc.board_id as b, c.name_en as n, dc.count as k
       from dtb_deck_card dc left join mtb_card c on c.id = dc.card_id where dc.deck_id = $1::int order by dc.id`, [デッキID],
  ).map((r) => `${r.i}:${r.b}:${r.n ?? ""}:${r.k}`);
}

/** デッキに保存されているプレイヤー名（マイデッキの一覧の「プレイヤー」と比べる）。デッキが無ければ null */
export function デッキのプレイヤー名(デッキID: string): string | null {
  return query(`select player_name from dtb_deck where id = $1::int`, [デッキID])[0]?.player_name ?? null;
}

/** デッキを構成するカード情報（カード名(英)・枚数・ボード名(日)）。明細の順 */
export function デッキのカード一覧(デッキID: string): デッキのカード[] {
  return query(
    `select c.name_en as n, dc.count as k, b.name_jp as board
       from dtb_deck_card dc left join mtb_card c on c.id = dc.card_id left join mtb_board b on b.id = dc.board_id
      where dc.deck_id = $1::int order by dc.id`, [デッキID],
  ).map((r) => ({ カード名英: r.n ?? "", 枚数: Number(r.k), ボード: r.board ?? "" }));
}
