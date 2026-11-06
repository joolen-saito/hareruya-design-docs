/** M15-10 アーキタイプ登録CSVのDB確認（参照だけ）。画面に出ない保存結果を、業務の言葉の関数名で返す。 */
import { query } from "../lib/db";

export type アーキタイプ行 = { ID: string; 公開状態: string; 代表カード画像あり: boolean; 削除済み: boolean; カラー: string[]; フォーマット英名: string };

/** 日本語名（と、指定があれば英語名・フォーマット英名）が一致するアーキタイプ（削除済みを含む）。ID の昇順 */
export function アーキタイプを探す(日本語名: string, 英語名?: string, フォーマット英名?: string): アーキタイプ行[] {
  const rows = query(
    `select a.id as id, coalesce(d.name, '') as disp, (a.card_image_id is not null) as has_img, (a.deleted_at is not null) as del, f.name_en as fmt,
            coalesce((select string_agg(c.name_jp, ',' order by c.id) from dtb_archetype_color ac join mtb_color c on c.id = ac.color_id where ac.archetype_id = a.id), '') as colors
       from dtb_archetype a join mtb_format f on f.id = a.format_id left join mtb_disp d on d.id = a.disp_id
      where a.name_jp = $1 and ($2 = '' or a.name_en = $2) and ($3 = '' or f.name_en = $3)
      order by a.id`, [日本語名, 英語名 ?? "", フォーマット英名 ?? ""]);
  return rows.map((r) => ({
    ID: r.id!, 公開状態: r.disp!, 代表カード画像あり: r.has_img === "true", 削除済み: r.del === "true", フォーマット英名: r.fmt!,
    カラー: r.colors ? r.colors.split(",") : [],
  }));
}

/** フォーマット（英名）の日本語名。無ければ null */
export function フォーマットの日本語名(英名: string): string | null {
  return query("select name_jp as n from mtb_format where name_en = $1 and deleted_at is null order by id limit 1", [英名])[0]?.n ?? null;
}
/** 英名のフォーマットが（削除済みを除いて）あるか */
export function フォーマットがある(英名: string): boolean { return フォーマットの日本語名(英名) !== null; }
/** 日本語名のカラーがあるか */
export function カラーがある(日本語名: string): boolean {
  return query("select 1 as x from mtb_color where name_jp = $1 limit 1", [日本語名]).length > 0;
}
