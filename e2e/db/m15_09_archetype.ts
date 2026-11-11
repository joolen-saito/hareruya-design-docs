/** M15-09 アーキタイプ登録/編集/削除のDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { count, query } from "../lib/db";

export type アーキタイプの保存内容 = {
  ID: string; 名日: string; 名英: string; 解説日: string; 解説英: string;
  /** 代表カードの画像ID（無ければ空） */
  代表カード画像ID: string;
  /** 公開状態の名前（無ければ空） */
  公開状態: string;
  フォーマット: string;
  /** 削除日時（無ければ空） */
  削除日時: string;
  カラー: string[];
  タグ: string[];
};

/** アーキタイプIDの保存内容（行が無ければ null） */
export function アーキタイプの保存内容(id: string): アーキタイプの保存内容 | null {
  const r = query(
    `select a.id::text as id, coalesce(a.name_jp,'') as nj, coalesce(a.name_en,'') as ne, coalesce(a.comment_jp,'') as cj, coalesce(a.comment_en,'') as ce,
            coalesce(a.card_image_id::text,'') as ci, coalesce(d.name,'') as dn, coalesce(f.name_jp,'') as fn, coalesce(a.deleted_at::text,'') as da
       from dtb_archetype a left join mtb_disp d on d.id = a.disp_id left join mtb_format f on f.id = a.format_id
      where a.id = $1`,
    [id],
  );
  if (r.length === 0) return null;
  const カラー = query("select c.name_jp as n from dtb_archetype_color ac join mtb_color c on c.id = ac.color_id where ac.archetype_id = $1 order by c.id", [id]).map((x) => x.n ?? "");
  const タグ = query("select t.name_jp as n from dtb_archetype_deck_tag adt join mtb_deck_tag t on t.id = adt.deck_tag_id where adt.archetype_id = $1 order by t.id", [id]).map((x) => x.n ?? "");
  const x = r[0];
  return {
    ID: x.id!, 名日: x.nj!, 名英: x.ne!, 解説日: x.cj!, 解説英: x.ce!, 代表カード画像ID: x.ci!, 公開状態: x.dn!, フォーマット: x.fn!, 削除日時: x.da!, カラー, タグ,
  };
}

/** アーキタイプ名(日)がちょうど一致するアーキタイプのID（削除済みを含む。番号の順） */
export function アーキタイプ名日のID(名日: string): string[] {
  return query("select id::text as id from dtb_archetype where name_jp = $1 order by id", [名日]).map((x) => x.id!);
}

/** アーキタイプ名(日)または(英)がちょうど一致するアーキタイプの件数（削除済みを含む） */
export function 名前の一致するアーキタイプの件数(名日: string, 名英: string): number {
  return count("select 1 from dtb_archetype where name_jp = $1 or name_en = $2", [名日, 名英]);
}

/** 名称(日)・(英)・解説(日)・(英)の4項目がそろって一致するアーキタイプのID（削除済みを含む） */
export function 四項目の一致するアーキタイプのID(名日: string, 名英: string, 解説日: string, 解説英: string): string[] {
  return query("select id::text as id from dtb_archetype where name_jp = $1 and name_en = $2 and comment_jp = $3 and comment_en = $4 order by id", [名日, 名英, 解説日, 解説英]).map((x) => x.id!);
}

/** 番号のアーキタイプの件数（削除済みを含む） */
export function 番号のアーキタイプの件数(id: number): number {
  return count("select 1 from dtb_archetype where id = $1", [id]);
}

/** 番号の代表カード画像（カード画像）の件数 */
export function 番号のカード画像の件数(id: number): number {
  return count("select 1 from mtb_card_image where id = $1", [id]);
}
