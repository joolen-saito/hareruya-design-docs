/** M15-06 デッキ登録CSVのDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { count, query } from "../lib/db";

export type 保存されたデッキ = {
  デッキID: string; プレイヤー名: string; フォーマット英名: string; アーキタイプ名日: string; アーキタイプ名英: string; アーキタイプのフォーマット英名: string;
  日程ID: string; デッキ名: string; 順位: string; 成績: string; イベント名英: string; イベント名日: string;
  /** 「2025-09-01 10:00:00」の形（日本時間） */
  開催日: string;
  参照元: string; 参加人数: string;
  /** 表示の区分（公開状態）: 「表示」「非表示」「限定公開」 */
  表示の区分: string;
  /** true＝非公開 */
  デッキリスト非公開: boolean;
  メインリスト本文: string; サイドリスト本文: string; 統率本文: string;
  代表画像ID: string; デッキ種別ID: string;
};

const 列 = `
  d.id as id, coalesce(d.player_name,'') as player, coalesce(f.name_en,'') as fmt, coalesce(a.name_jp,'') as arch_jp, coalesce(a.name_en,'') as arch_en,
  coalesce(af.name_en,'') as arch_fmt, coalesce(d.event_detail_id::text,'') as detail, coalesce(d.deck_name,'') as deck_name,
  coalesce(d.ranking::text,'') as ranking, coalesce(d.result,'') as result, coalesce(d.event_name_en,'') as en, coalesce(d.event_name_jp,'') as jp,
  coalesce(to_char(d.event_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS'),'') as event_date, coalesce(d.source_url,'') as url,
  coalesce(d.participants::text,'') as participants, case d.disp_id when 1 then '表示' when 2 then '非表示' when 3 then '限定公開' else '' end as disp, d.private_flg::text as private_flg,
  coalesce(d.text_main,'') as text_main, coalesce(d.text_side,'') as text_side, coalesce(d.text_command,'') as text_command,
  coalesce(d.card_image_id::text,'') as image, coalesce(d.deck_type_id::text,'') as deck_type`;
const 結合 = `
  from dtb_deck d
  left join mtb_format f on f.id = d.format_id
  left join dtb_archetype a on a.id = d.archetype_id
  left join mtb_format af on af.id = a.format_id`;

function 変換(r: Record<string, string | null>): 保存されたデッキ {
  return {
    デッキID: r.id!, プレイヤー名: r.player!, フォーマット英名: r.fmt!, アーキタイプ名日: r.arch_jp!, アーキタイプ名英: r.arch_en!, アーキタイプのフォーマット英名: r.arch_fmt!,
    日程ID: r.detail!, デッキ名: r.deck_name!, 順位: r.ranking!, 成績: r.result!, イベント名英: r.en!, イベント名日: r.jp!, 開催日: r.event_date!,
    参照元: r.url!, 参加人数: r.participants!, 表示の区分: r.disp!, デッキリスト非公開: r.private_flg === "true",
    メインリスト本文: r.text_main!, サイドリスト本文: r.text_side!, 統率本文: r.text_command!, 代表画像ID: r.image!, デッキ種別ID: r.deck_type!,
  };
}

/** プレイヤー名がちょうど一致する、削除されていないデッキ（デッキIDの順） */
export function プレイヤー名のデッキ(プレイヤー名: string): 保存されたデッキ[] {
  return query(`select ${列} ${結合} where d.player_name = $1 and d.deleted_at is null order by d.id`, [プレイヤー名]).map(変換);
}

/** デッキIDのデッキ（削除されていないもの。無ければ null） */
export function デッキ(デッキID: string): 保存されたデッキ | null {
  const r = query(`select ${列} ${結合} where d.id = $1 and d.deleted_at is null`, [デッキID]);
  return r.length ? 変換(r[0]) : null;
}

/** 削除されていないデッキの件数（全体） */
export function デッキの件数(): number {
  return count("select 1 from dtb_deck where deleted_at is null");
}

/** いちばん大きいデッキID（削除されたものを含む） */
export function 最大のデッキID(): number {
  const r = query("select coalesce(max(id),0) as m from dtb_deck");
  return Number(r[0]?.m ?? 0);
}

/** デッキ明細（ボードの名前・カード名(英)・枚数）。ボード・明細の順 */
export function デッキ明細(デッキID: string): { ボード: string; カード名英: string; 枚数: number }[] {
  return query(
    `select case dc.board_id when 1 then 'メインボード' when 2 then 'サイドボード' when 3 then '統率者ボード' else 'その他' end as b,
            coalesce(c.name_en,'') as n, dc.count as k
       from dtb_deck_card dc left join mtb_card c on c.id = dc.card_id
      where dc.deck_id = $1 order by dc.board_id, dc.id`,
    [デッキID],
  ).map((r) => ({ ボード: r.b!, カード名英: r.n!, 枚数: Number(r.k) }));
}

/** デッキに関連付いたデッキタグの日本語名（名前の順） */
export function デッキのタグ(デッキID: string): string[] {
  return query("select t.name_jp as n from dtb_deck_deck_tag x join mtb_deck_tag t on t.id = x.deck_tag_id where x.deck_id = $1 order by t.name_jp", [デッキID]).map((r) => r.n!);
}

/** 代表画像（カード画像）が属するカードのカード名(英)。画像が無ければ空 */
export function 代表画像のカード(代表画像ID: string): string {
  if (!代表画像ID) return "";
  const r = query(
    "select coalesce(c.name_en,'') as n from mtb_card_image i join mtb_card_detail cd on cd.id = i.card_detail_id join mtb_card c on c.id = cd.card_id where i.id = $1",
    [代表画像ID],
  );
  return r[0]?.n ?? "";
}

/** アーキタイプ（名(英)とフォーマット名(英)で決まるもの）の既定の代表画像ID。無ければ空 */
export function アーキタイプの代表画像ID(名英: string, フォーマット英名: string): string {
  const r = query(
    "select coalesce(a.card_image_id::text,'') as i from dtb_archetype a join mtb_format f on f.id = a.format_id where a.name_en = $1 and f.name_en = $2 and a.deleted_at is null order by a.id",
    [名英, フォーマット英名],
  );
  if (r.length !== 1) throw new Error(`アーキタイプ「${名英}」（フォーマット ${フォーマット英名}）が1件に決まらない（${r.length}件）`);
  return r[0].i!;
}

/** イベントの日程（日程ID）があるか */
export function 日程がある(日程ID: string): boolean {
  return count("select 1 from dtb_event_detail where id = $1", [日程ID]) > 0;
}
