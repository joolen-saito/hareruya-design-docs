/** M15 デッキ管理のDB確認（参照だけ）。画面に出ない保存結果を、業務の言葉の関数名で返す。 */
import { query } from "../lib/db";

/** デッキの最終更新者の名前 */
export function 最終更新者の名前(デッキID: string): string | null {
  const r = query("select m.name as n from dtb_deck d join dtb_member m on m.id = d.member_id where d.id = $1", [デッキID]);
  return r[0]?.n ?? null;
}

/** デッキの文字項目（イベント名・成績・プレイヤー名・引用元URL） */
export function デッキの文字項目(デッキID: string): { イベント名日: string; イベント名英: string; 成績: string; プレイヤー名: string; 引用元URL: string } {
  const r = query("select coalesce(event_name_jp,'') as a, coalesce(event_name_en,'') as b, coalesce(result,'') as c, coalesce(player_name,'') as d, coalesce(source_url,'') as e from dtb_deck where id = $1", [デッキID]);
  if (r.length !== 1) throw new Error(`デッキID ${デッキID} が1件に決まらない（${r.length}件）`);
  return { イベント名日: r[0].a!, イベント名英: r[0].b!, 成績: r[0].c!, プレイヤー名: r[0].d!, 引用元URL: r[0].e! };
}

/** デッキの保存内容（一括編集の確かめ用）。日時は日本時間の「yyyy-MM-dd HH:mm」、タグは名前の昇順 */
export type デッキの保存内容 = {
  フォーマット: string | null; アーキタイプ: string | null; 公開状態: string; デッキリスト非公開: boolean;
  イベント名日: string; イベント名英: string; 開催日: string; 順位: string; 成績: string; プレイヤー名: string; 引用元URL: string; タグ: string[];
};
export function デッキの保存内容を読む(デッキID: string): デッキの保存内容 {
  const r = query(
    `select f.name_jp as fmt, a.name_jp as arc, ds.name as disp, d.private_flg as pf,
            coalesce(d.event_name_jp,'') as enj, coalesce(d.event_name_en,'') as ene,
            coalesce(to_char(d.event_date at time zone 'Asia/Tokyo','YYYY-MM-DD HH24:MI'),'') as edt,
            coalesce(d.ranking::text,'') as rk, coalesce(d.result,'') as rs, coalesce(d.player_name,'') as pn, coalesce(d.source_url,'') as su,
            coalesce((select string_agg(t.name_jp, ',' order by t.name_jp) from dtb_deck_deck_tag x join mtb_deck_tag t on t.id = x.deck_tag_id where x.deck_id = d.id),'') as tags
       from dtb_deck d
       left join mtb_format f on f.id = d.format_id
       left join dtb_archetype a on a.id = d.archetype_id
       join mtb_disp ds on ds.id = d.disp_id
      where d.id = $1::int`, [デッキID]);
  if (r.length !== 1) throw new Error(`デッキID ${デッキID} が1件に決まらない（${r.length}件）`);
  const x = r[0];
  return {
    フォーマット: x.fmt, アーキタイプ: x.arc, 公開状態: x.disp!, デッキリスト非公開: x.pf === "true",
    イベント名日: x.enj!, イベント名英: x.ene!, 開催日: x.edt!, 順位: x.rk!, 成績: x.rs!, プレイヤー名: x.pn!, 引用元URL: x.su!,
    タグ: x.tags ? x.tags.split(",") : [],
  };
}

/** 開催店舗の並び（表示順。店舗名） */
export function 店舗の表示順(): { 店舗名: string; 順: number }[] {
  return query('select shop_name as n, "rank" as k from dtb_base_info order by "rank", id').map((r) => ({ 店舗名: r.n ?? "", 順: Number(r.k) }));
}

/** メインボード（ボード番号1）のカードリスト（カード名(英)と枚数。明細の順） */
export function メインボードのカード(デッキID: string): { カード名英: string; 枚数: number }[] {
  return query("select c.name_en as n, dc.count as k from dtb_deck_card dc join mtb_card c on c.id = dc.card_id where dc.deck_id = $1 and dc.board_id = 1 order by dc.id", [デッキID])
    .map((r) => ({ カード名英: r.n!, 枚数: Number(r.k) }));
}
