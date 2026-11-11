// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/** M15-10 アーキタイプ登録CSVのDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { query, Row } from "../lib/db";

export type アーキタイプの記録 = {
  ID: string; 名日: string; 名英: string; フォーマット英: string; 公開状態: string;
  /** 代表カード画像の番号（未設定は空） */
  代表カード画像ID: string;
  削除済み: boolean;
  /** カラーの日本語名（名前の順） */
  カラー: string[];
};

const 列 = `a.id as id, a.name_jp as nj, a.name_en as ne, f.name_en as fmt, d.name as disp,
  coalesce(a.card_image_id::text, '') as img, (a.deleted_at is not null) as del,
  coalesce((select string_agg(c.name_jp, '|' order by c.name_jp) from dtb_archetype_color ac join mtb_color c on c.id = ac.color_id where ac.archetype_id = a.id), '') as colors`;
const 元 = `from dtb_archetype a join mtb_format f on f.id = a.format_id join mtb_disp d on d.id = a.disp_id`;

const 読む = (r: Row): アーキタイプの記録 => ({
  ID: r.id ?? "", 名日: r.nj ?? "", 名英: r.ne ?? "", フォーマット英: r.fmt ?? "", 公開状態: r.disp ?? "",
  代表カード画像ID: r.img ?? "", 削除済み: r.del === "t" || r.del === "true",
  カラー: (r.colors ?? "").split("|").filter(Boolean),
});

/** アーキタイプIDの記録（無ければ null） */
export function アーキタイプ(id: string): アーキタイプの記録 | null {
  const rows = query(`select ${列} ${元} where a.id = $1::int`, [id]);
  return rows.length ? 読む(rows[0]) : null;
}

/** 日本語名・英語名・フォーマット(英)が一致するアーキタイプ（削除済みを含めるかを選ぶ）。ID の昇順 */
export function キーのアーキタイプ(名日: string, 名英: string, フォーマット英: string, 削除済みを含む = false): アーキタイプの記録[] {
  return query(
    `select ${列} ${元} where a.name_jp = $1 and a.name_en = $2 and f.name_en = $3 ${削除済みを含む ? "" : "and a.deleted_at is null"} order by a.id`,
    [名日, 名英, フォーマット英],
  ).map(読む);
}

/** 日本語名が一致するアーキタイプ（削除済みを含めるかを選ぶ）。ID の昇順 */
export function 日本語名のアーキタイプ(名日: string, 削除済みを含む = false): アーキタイプの記録[] {
  return query(`select ${列} ${元} where a.name_jp = $1 ${削除済みを含む ? "" : "and a.deleted_at is null"} order by a.id`, [名日]).map(読む);
}

/**
 * 日本語名に語を含み、英語名が一致する、削除されていないアーキタイプの日本語名（文字の並びを確かめるため、目に見えない文字も含めて返す）
 */
export function 語を含む日本語名(語: string, 名英: string): { ID: string; 名日: string; 符号: string }[] {
  return query(
    `select a.id as id, a.name_jp as nj, encode(convert_to(a.name_jp, 'UTF8'), 'hex') as hex
       from dtb_archetype a where a.deleted_at is null and a.name_en = $2 and strpos(a.name_jp, $1) > 0 order by a.id`, [語, 名英],
  ).map((r) => ({ ID: r.id ?? "", 名日: r.nj ?? "", 符号: r.hex ?? "" }));
}
