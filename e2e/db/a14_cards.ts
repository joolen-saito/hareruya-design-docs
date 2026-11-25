/**
 * A14-01（カードIDからカード情報を取得）・A14-02（カード詳細IDからカード詳細情報を取得）の DB の照会と、画面で作れない状態の書き足し。
 * 物理名はこのファイルの SQL の中にだけ書く。書くのは E2E がこの実行で作ったカード・カード詳細（カード名が実行の印で終わる）と、
 * E2E が決まった印で作ったカードセット（名前が決まった印で終わる）の行だけ（lib/db_write.ts の持ち主の確かめ）。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";
import { FIXED_MARK, RUN_MARK } from "../lib/run_marker";

/** この実行で作ったカード（カード名(日)か(英)が実行の印で終わる） */
const 自分のカード = (): Owner => ({ sql: "select id from mtb_card where name_jp like '%-' || $1 or name_en like '%-' || $1", params: [RUN_MARK] });
/** この実行で作ったカードのカード詳細 */
const 自分のカード詳細 = (): Owner => ({
  sql: "select d.id from mtb_card_detail d join mtb_card c on c.id = d.card_id where c.name_jp like '%-' || $1 or c.name_en like '%-' || $1", params: [RUN_MARK],
});
/** E2E が決まった印で作ったカードセット */
const 決まった印のカードセット = (): Owner => ({ sql: "select id from mtb_cardset where name_en like '%-' || $1", params: [FIXED_MARK] });

type 行 = Record<string, string | null>;
const 一行 = (sql: string, params: (string | number)[]): 行 | undefined => query(sql, params)[0] as 行 | undefined;

// ---- 書き足し（E2E の行だけ） ----

/** カードの作成日時・更新日時（画面で指定できない） */
export function カードの日時を書く(what: string, カードID: string, 日時: string): void {
  updateOwnRows(what, { table: "mtb_card", key: "id", ids: [カードID], set: { create_date: 日時, update_date: 日時 }, owner: 自分のカード() });
}
/** カード詳細の作成日時・更新日時（画面で指定できない） */
export function カード詳細の日時を書く(what: string, カード詳細IDs: string[], 日時: string): void {
  updateOwnRows(what, { table: "mtb_card_detail", key: "id", ids: カード詳細IDs, set: { create_date: 日時, update_date: 日時 }, owner: 自分のカード詳細() });
}
/** カード名(英)を値なしにする（画面では必須） */
export function カード名英を値なしにする(what: string, カードID: string): void {
  updateOwnRows(what, { table: "mtb_card", key: "id", ids: [カードID], set: { name_en: null }, owner: 自分のカード() });
}
/** カード詳細の関連（レアリティ・レイアウト・プロモ種別は画面で必須）を値なしにする */
export function カード詳細の関連を値なしにする(what: string, カード詳細ID: string, 関連: ("レアリティ" | "レイアウト" | "プロモ種別" | "カードセット" | "イラストレーター")[]): void {
  const 列: Record<string, string> = { レアリティ: "rarity_id", レイアウト: "card_layout_id", プロモ種別: "promotion_id", カードセット: "cardset_id", イラストレーター: "illustrator_id" };
  updateOwnRows(what, { table: "mtb_card_detail", key: "id", ids: [カード詳細ID], set: Object.fromEntries(関連.map((k) => [列[k], null])), owner: 自分のカード詳細() });
}
/** カードセットのシンボル画像のファイル名（画面ではファイルを置くので、決まったファイル名にできない） */
export function カードセットのシンボル画像を書く(what: string, カードセットID: string, ファイル名: string): void {
  updateOwnRows(what, { table: "mtb_cardset", key: "id", ids: [カードセットID], set: { symbol_image: ファイル名 }, owner: 決まった印のカードセット() });
}

// ---- 照会 ----

/** カードの値（文字は DB の値のまま。値なしは null） */
export function カードの値(カードID: string): 行 {
  const r = 一行(`select id::text as id, name_jp, name_en, arena_format_name_jp, arena_format_name_en, text_jp, text_en, mana_cost, cmc::text as cmc,
      power, toughness, loyalty, old_product_id, old_en_product_id, color_sequence_id::text as color_sequence_id, create_date::text as create_date, update_date::text as update_date
    from mtb_card where id = $1::int`, [カードID]);
  if (!r) throw new Error(`カードID ${カードID} のカードが DB に無い`);
  return r;
}

export type 関連の行 = { id: string; name_jp: string | null; name_en: string | null; product_search_flg?: string | null };
/** カードに紐づくカードタイプ・サブタイプ・特殊タイプ・カラー・固有色（ID の順） */
export function カードの関連(カードID: string): Record<"cardtypes" | "subtypes" | "specialtypes" | "colors" | "color_identities", 関連の行[]> {
  const q = (sql: string) => query(sql, [カードID]) as 関連の行[];
  return {
    cardtypes: q(`select t.id::text as id, t.name_jp, t.name_en, t.product_search_flg::text as product_search_flg from dtb_card_cardtype x join mtb_cardtype t on t.id = x.cardtype_id where x.card_id = $1::int order by t.id`),
    subtypes: q(`select t.id::text as id, t.name_jp, t.name_en from dtb_card_subtype x join mtb_subtype t on t.id = x.subtype_id where x.card_id = $1::int order by t.id`),
    specialtypes: q(`select t.id::text as id, t.name_jp, t.name_en from dtb_card_specialtype x join mtb_specialtype t on t.id = x.specialtype_id where x.card_id = $1::int order by t.id`),
    colors: q(`select t.id::text as id, t.name_jp, t.name_en from dtb_card_color x join mtb_color t on t.id = x.color_id where x.card_id = $1::int order by t.id`),
    color_identities: q(`select t.id::text as id, t.name_jp, t.name_en from dtb_card_color_identity x join mtb_color t on t.id = x.color_id where x.card_id = $1::int order by t.id`),
  };
}

/** マスターの行（ID・日本語名・英語名）。名前で引く（S-A14-01-MASTER の読み替えに使う） */
export function マスターの行(種別: "カードタイプ" | "サブタイプ" | "特殊タイプ" | "カラー", 日本語名: string): 関連の行 | undefined {
  const t = { カードタイプ: "mtb_cardtype", サブタイプ: "mtb_subtype", 特殊タイプ: "mtb_specialtype", カラー: "mtb_color" }[種別];
  const flg = 種別 === "カードタイプ" ? ", product_search_flg::text as product_search_flg" : "";
  return query(`select id::text as id, name_jp, name_en${flg} from ${t} where name_jp = $1 order by id limit 1`, [日本語名])[0] as 関連の行 | undefined;
}
/** マスターの行を ID で引く */
export function マスターの行をIDで(種別: "カードタイプ" | "サブタイプ" | "特殊タイプ" | "カラー", id: string): 関連の行 | undefined {
  const t = { カードタイプ: "mtb_cardtype", サブタイプ: "mtb_subtype", 特殊タイプ: "mtb_specialtype", カラー: "mtb_color" }[種別];
  const flg = 種別 === "カードタイプ" ? ", product_search_flg::text as product_search_flg" : "";
  return query(`select id::text as id, name_jp, name_en${flg} from ${t} where id = $1::int`, [id])[0] as 関連の行 | undefined;
}

/** カードに紐づくカード詳細の数・カードフォーマットの数 */
export function カードの件数(カードID: string): { カード詳細: number; カードフォーマット: number } {
  const r = 一行(`select (select count(*) from mtb_card_detail where card_id = $1::int)::text as d, (select count(*) from dtb_card_format where card_id = $1::int)::text as f`, [カードID]);
  return { カード詳細: Number(r?.d ?? "0"), カードフォーマット: Number(r?.f ?? "0") };
}

/** 色順（ID・名称・並び順） */
export function 色順の行(色順ID: string): { id: string; name: string; sort_no: string } | undefined {
  return query("select id::text as id, name, sort_no::text as sort_no from mtb_color_sequence where id = $1::int", [色順ID])[0] as { id: string; name: string; sort_no: string } | undefined;
}

/** カード詳細の値（文字は DB の値のまま。値なしは null） */
export function カード詳細の値(カード詳細ID: string): 行 {
  const r = 一行(`select id::text as id, card_id::text as card_id, back_card_detail_id::text as back_card_detail_id, cardset_id::text as cardset_id, rarity_id::text as rarity_id,
      illustrator_id::text as illustrator_id, card_layout_id::text as card_layout_id, promotion_id::text as promotion_id, flavor_jp, flavor_en, text_jp, text_en,
      power::text as power, toughness::text as toughness, card_no, foil_flg::text as foil, frame_flg::text as frame
    from mtb_card_detail where id = $1::int`, [カード詳細ID]);
  if (!r) throw new Error(`カード詳細ID ${カード詳細ID} のカード詳細が DB に無い`);
  return r;
}
/** カード詳細に紐づくカード画像の数 */
export function カード画像の数(カード詳細ID: string): number {
  return Number(一行("select count(*)::text as n from mtb_card_image where card_detail_id = $1::int", [カード詳細ID])?.n ?? "0");
}

// ---- A14-02 のマスター・カードセット（参照） ----

const MTGの表 = { レイアウト: "mtb_card_layout", レアリティ: "mtb_rarity", プロモ種別: "mtb_promotion", イラストレーター: "mtb_illustrator", カードセットブロック: "mtb_cardsetblock" } as const;
export type MTGの種別 = keyof typeof MTGの表;

/** MTGマスターの、日本語名が一致する行の ID（いちばん小さいもの） */
export function MTGマスターのID(種別: MTGの種別, 日本語名: string): string | undefined {
  return query(`select id::text as id from ${MTGの表[種別]} where name_jp = $1 order by id limit 1`, [日本語名])[0]?.id as string | undefined;
}
/** MTGマスターの行の値（コードの無い表は code が null） */
export function MTGマスターの値(種別: MTGの種別, id: string): 行 | undefined {
  const code = 種別 === "レアリティ" || 種別 === "プロモ種別" ? "code" : "null::text as code";
  return 一行(`select id::text as id, name_jp, name_en, ${code} from ${MTGの表[種別]} where id = $1::int`, [id]);
}
/** カードセットの英語名が一致する行の ID */
export function カードセットのID(名英: string): string | undefined {
  return query("select id::text as id from mtb_cardset where name_en = $1 order by id limit 1", [名英])[0]?.id as string | undefined;
}
/** カードセットの値 */
export function カードセットの値(id: string): 行 | undefined {
  return 一行(`select id::text as id, name_jp, name_en, code, symbol_image, cardsetblock_id::text as cardsetblock_id, to_char(release_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as release_date
    from mtb_cardset where id = $1::int`, [id]);
}
