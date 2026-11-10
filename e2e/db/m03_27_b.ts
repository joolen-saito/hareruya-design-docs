/**
 * M03-27 グッズ商品CSV登録の続き（-b）の DB 確認（参照）と、画面で作れない状態だけの書き足し（E2E の行だけ。依頼者決定 2026-11-10）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足しは lib/db_write.ts を通し、持ち主の確かめ（実行の印つきの規格コード）で E2E の行と示す。
 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { updateOwnRows } from "../lib/db_write";

/** 持ち主の確かめ: 実行の印つきの規格コードを持つ規格の行（この回の E2E が作ったもの） */
const 規格の持ち主 = { sql: `select id from dtb_product_class where product_code like '%-' || $1`, params: [RUN_MARK] };

export type グッズの行 = {
  商品ID: string; 商品名日: string; 商品名英: string; 重量: string | null; 地域別販売制限: string | null;
  規格ID: string; 規格コード: string | null; 基準価格: number | null; 販売価格: number | null; 買取価格: number | null;
  セール: boolean; 発送日目安: string | null; スマレジ連携: number | null; スマレジ商品コード: string | null; 部門: string | null;
};

const 行の照会 = `select p.id, p.name, p.name_en, p.weight, p.region_restriction_id,
         pc.id as class_id, pc.product_code, pc.standard_price, pc.price02, pc.buy_price, pc.sale_flg,
         pc.delivery_duration_id, pc.smaregi_alignment_flg, pc.smaregi_product_code, pc.section_id
    from dtb_product p join dtb_product_class pc on pc.product_id = p.id`;
const 行に = (r: Record<string, string | null>): グッズの行 => ({
  商品ID: String(r.id), 商品名日: String(r.name ?? ""), 商品名英: String(r.name_en ?? ""), 重量: r.weight, 地域別販売制限: r.region_restriction_id,
  規格ID: String(r.class_id), 規格コード: r.product_code, 基準価格: r.standard_price === null ? null : Number(r.standard_price),
  販売価格: r.price02 === null ? null : Number(r.price02), 買取価格: r.buy_price === null ? null : Number(r.buy_price),
  セール: r.sale_flg === "true" || r.sale_flg === "t" || r.sale_flg === "1", 発送日目安: r.delivery_duration_id,
  スマレジ連携: r.smaregi_alignment_flg === null ? null : Number(r.smaregi_alignment_flg), スマレジ商品コード: r.smaregi_product_code, 部門: r.section_id,
});

/** 商品名(日)がちょうど一致する商品とその規格 */
export function 商品名のグッズ(商品名: string): グッズの行[] {
  return query(`${行の照会} where p.name = $1 order by p.id, pc.id`, [商品名]).map(行に);
}
/** 商品名(英)がちょうど一致する商品とその規格 */
export function 英名のグッズ(商品名英: string): グッズの行[] {
  return query(`${行の照会} where p.name_en = $1 order by p.id, pc.id`, [商品名英]).map(行に);
}
/** 規格コードがちょうど一致する規格とその商品 */
export function 規格コードのグッズ(規格コード: string): グッズの行[] {
  return query(`${行の照会} where pc.product_code = $1 order by p.id, pc.id`, [規格コード]).map(行に);
}
/** 商品IDの商品とその規格 */
export function 商品IDのグッズ(商品ID: string): グッズの行[] {
  return query(`${行の照会} where p.id = $1::int order by pc.id`, [商品ID]).map(行に);
}

/** そのファイル名のグッズ商品CSVの取込履歴の件数（ほかの方の取込を数えないよう、この回の印つきのファイル名で数える） */
export function グッズの取込履歴(ファイル名: string): number {
  return Number(query(
    `select count(*) n from dtb_csv_import_history h join mtb_csv_import_type t on t.id = h.csv_import_type_id
      where t.name = 'グッズ商品登録' and h.file_name = $1`, [ファイル名])[0].n);
}

/** 商品の規格画像のファイル名（並び順） */
export function 規格画像(商品ID: string): string[] {
  return query(
    `select i.file_name from dtb_product_class_image ci join dtb_product_image i on i.id = ci.product_image_id
       join dtb_product_class pc on pc.id = ci.product_class_id where pc.product_id = $1::int order by ci.rank, i.id`, [商品ID],
  ).map((r) => String(r.file_name));
}

/** 共通の正常値が使うマスタが開発環境にあるか（DB シードで登録しない。あるものを使う） */
export function 正常値のマスタがあるか(カテゴリ: string[], 部門: string): Record<string, boolean> {
  const r = query(
    `select
       exists (select 1 from mtb_language where id = 1) as "言語1",
       (select count(*) from dtb_category where id = any($1::int[])) = cardinality($1::int[]) as "商品カテゴリ",
       exists (select 1 from mtb_sell_group where name = '通常商品') as "購入グループ通常商品",
       exists (select 1 from mtb_storage_code where id = 1098) as "略称タグ1098",
       (select count(*) from mtb_tag_sales_analysis where id in (8, 9)) = 2 as "売上分析タグ8・9",
       (select count(*) from dtb_tag where id in (8, 18)) = 2 as "タグ8・18",
       exists (select 1 from mtb_cardset where id = 23) as "カードセット23",
       exists (select 1 from mtb_section where id = $2::int) as "部門"`,
    [`{${カテゴリ.join(",")}}`, 部門],
  )[0];
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v) === "true" || String(v) === "t"]));
}

/** カテゴリがグッズの親（番号 2・4・5）の子孫か（グッズ商品CSVが受け付けるか） */
/** グッズの親（番号 2）の子のカテゴリを n 件（共通の正常値の「対象カテゴリ」の読み替えに使う） */
export function グッズの子カテゴリ(n: number): string[] {
  return query(`select id from dtb_category where parent_category_id = 2 order by id limit $1`, [n]).map((r) => String(r.id));
}
/** グッズの親（番号 2・4・5）の子孫でないカテゴリを1件（「対象外カテゴリ」の読み替えに使う） */
export function グッズでないカテゴリ(): string {
  const r = query(
    `with recursive g(id) as (select id from dtb_category where id in (2, 4, 5)
       union all select c.id from dtb_category c join g on c.parent_category_id = g.id)
     select id from dtb_category where parent_category_id is not null and id not in (select id from g) order by id limit 1`);
  if (!r.length) throw new Error("グッズの親の子孫でないカテゴリが開発環境に無い");
  return String(r[0].id);
}

export function グッズのカテゴリか(カテゴリID: string): boolean {
  const r = query(
    `with recursive a(id, parent) as (select id, parent_category_id from dtb_category where id = $1::int
       union all select c.id, c.parent_category_id from dtb_category c join a on c.id = a.parent)
     select count(*) filter (where id in (2, 4, 5)) n from a`, [カテゴリID]);
  return Number(r[0].n) > 0;
}

/** 開発環境にある発送日目安の番号（小さい順） */
export function 発送日目安の番号(): string[] {
  return query(`select id from dtb_delivery_duration order by id`).map((r) => String(r.id));
}

// ---- 画面で作れない状態の書き足し（E2E の行だけ） ----

/** 規格の発送日目安（画面で指定できない） */
export function 発送日目安にする(what: string, 規格ID: string, 番号: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { delivery_duration_id: 番号 }, owner: 規格の持ち主 });
}
