/**
 * M04-30 バーコード貼替リストCSV出力のシードの、E2E が作った商品規格・在庫・価格変更履歴への書き足し（2026-11-23 依頼者
 * 「DB の直接の設定は E2E の行だけなら流してよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * - 書くのは、実行の印つきの商品コードの商品・商品規格と、その在庫・価格変更履歴だけ（lib/db_write.ts の窓口を通す）。
 * - 前の実行の残り（このファイルが作る商品コードに、別の実行の印が付き、30分より前に作られたもの）は、スマレジ連携を外して
 *   スマレジ商品コードを空にする（同じ日付の価格変更履歴を持つ前の実行の商品が CSV に出る・スマレジ商品コードは重ねられないため。
 *   E2E が作った行だけ）。同じ流しのほかのワーカー（印が違う）が作ったばかりの行は外さない。
 * 照会は参照だけ（lib/db.ts）。
 */
import { query } from "../lib/db";
import { deleteOwnRows, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const SMAREGI = 2;
const 状態 = { 公開: 1, 非公開: 2, 廃止: 3 } as const;
export type 公開状態 = keyof typeof 状態;

const 自分の商品規格 = { sql: `select pc.id from dtb_product_class pc where pc.product_code like '%-' || $1`, params: [RUN_MARK] };
const 自分の商品 = { sql: `select pc.product_id from dtb_product_class pc where pc.product_code like '%-' || $1`, params: [RUN_MARK] };
const 自分の在庫 = {
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
};
const 自分の価格変更履歴 = {
  sql: `select ph.id from dtb_price_history ph join dtb_product_class pc on pc.id = ph.product_class_id where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
};

/** 印つきの商品コードの商品ID・商品規格ID（1件であること） */
export function 規格(code: string): { 商品ID: string; 規格ID: string } {
  const r = query(`select pc.product_id::text as pid, pc.id::text as cid from dtb_product_class pc where pc.product_code = $1`, [code]);
  if (r.length !== 1) throw new Error(`商品コード「${code}」の商品規格が ${r.length} 件（1件のはず）`);
  return { 商品ID: String(r[0].pid), 規格ID: String(r[0].cid) };
}

/** 商品規格の、店舗・スマレジの在庫の行の在庫ID（無ければ空） */
export function スマレジの在庫ID(規格ID: string, 店舗ID: string): string {
  const r = query(`select ps.id::text as id from dtb_product_stock ps where ps.product_class_id = $1::int and ps.base_info_id = $2::int and ps.stock_location_id = $3::int`,
    [規格ID, 店舗ID, SMAREGI]);
  return r.length ? String(r[0].id) : "";
}

/** 商品規格の価格変更履歴のID（登録の順） */
export function 価格変更履歴のID(規格ID: string): string[] {
  return query(`select ph.id::text as id from dtb_price_history ph where ph.product_class_id = $1::int order by ph.id`, [規格ID]).map((r) => String(r.id));
}

/** スマレジ商品ID・スマレジ連携フラグを書く（連携フラグを画面で「連携する」にして保存すると、外部のスマレジへ送られるため） */
export function スマレジの値を整える(what: string, 規格ID: string, v: { スマレジ商品ID: string | null; 連携: boolean }): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { smaregi_product_id: v.スマレジ商品ID, smaregi_alignment_flg: v.連携 }, owner: 自分の商品規格 });
}

/** スマレジ商品コードを書く（カード指定のある商品は画面から入力できない。シード表の値を E2E の商品規格の行だけに書く） */
export function スマレジ商品コードを書く(what: string, 規格ID: string, コード: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID], set: { smaregi_product_code: コード }, owner: 自分の商品規格 });
}

/** 商品規格のすべての価格変更履歴の日時を書く（シード表「価格変更日時は画面で指定できないためDBへ直接設定する」） */
export function 価格変更日時を整える(what: string, 規格ID: string, 日時: string): string[] {
  const ids = 価格変更履歴のID(規格ID);
  if (!ids.length) throw new Error(`${what}: 商品規格 ${規格ID} に価格変更履歴が無い`);
  updateOwnRows(what, { table: "dtb_price_history", key: "id", ids, set: { create_date: 日時 }, owner: 自分の価格変更履歴 });
  return ids;
}

/** 在庫数を書く（シード表「在庫数-1は画面で指定できないためDBへ直接設定する」） */
export function 在庫数を整える(what: string, 在庫ID: string, 在庫数: number): void {
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID], set: { stock: 在庫数 }, owner: 自分の在庫 });
}

/** 在庫の行を消す（シード表「店舗Aの在庫情報なし」。取り込みで作られた在庫数0の行。在庫変動履歴は無い） */
export function 在庫の行を消す(what: string, 在庫ID: string): void {
  deleteOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID], owner: 自分の在庫 });
}

/** 商品・商品規格の公開状態を書く（シード表「在庫を持ったままの廃止・非公開は画面で指定できないためDBへ直接設定する」） */
export function 公開状態を整える(what: string, v: { 商品ID?: string; 規格ID?: string; 状態: 公開状態 }): void {
  if (v.商品ID) updateOwnRows(what, { table: "dtb_product", key: "id", ids: [v.商品ID], set: { product_status_id: 状態[v.状態] }, owner: 自分の商品 });
  if (v.規格ID) updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [v.規格ID], set: { product_status_id: 状態[v.状態] }, owner: 自分の商品規格 });
}

const 印の形 = (codes: string[]): string => `^(${codes.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})-[0-9A-Z]{6,12}$`;
const 前の実行の条件 = `pc.product_code not like '%-' || $3
   and (pc.product_code ~ $1 or (pc.product_code ~ $2 and pc.create_date < now() - interval '30 minutes'))`;

/**
 * 前の実行の残り（正本の商品コードに別の実行の印が付いた商品規格）のスマレジ連携を外し、スマレジ商品コードを空にする（E2E が作った行だけ。
 * 持ち主の確かめは、正本の商品コードと実行の印の形）。自分のシードの商品コードは作った時を問わず、ほかのシードの商品コードは30分より前に
 * 作ったものだけ（同じ流しのほかのワーカーが作ったばかりの行は外さない）。外した商品規格の数を返す。
 */
export function 前の実行の残りを外す(what: string, 自分の商品コード: string[], ほかの商品コード: string[]): number {
  const params = [印の形(自分の商品コード), 印の形(ほかの商品コード.length ? ほかの商品コード : 自分の商品コード), RUN_MARK];
  const ids = query(
    `select pc.id::text as id from dtb_product_class pc where ${前の実行の条件}
        and (pc.smaregi_alignment_flg = true or coalesce(pc.smaregi_product_code, '') <> '')`, params,
  ).map((r) => String(r.id));
  if (!ids.length) return 0;
  updateOwnRows(what, {
    table: "dtb_product_class", key: "id", ids, set: { smaregi_alignment_flg: false, smaregi_product_code: null },
    owner: { sql: `select pc.id from dtb_product_class pc where ${前の実行の条件}`, params },
  });
  return ids.length;
}

/** 記録用: 商品規格のスマレジの値・公開状態・店舗のスマレジ在庫・価格変更日時 */
export function 規格の今(規格ID: string, 店舗ID: string): Record<string, unknown> | undefined {
  return query(
    `select pc.product_code as 商品コード, pc.smaregi_product_id as スマレジ商品ID, pc.smaregi_product_code as スマレジ商品コード,
            pc.smaregi_alignment_flg as 連携, pc.standard_price as 基準価格, ps1.name as 規格の状態, ps2.name as 商品の状態,
            (select s.stock from dtb_product_stock s where s.product_class_id = pc.id and s.base_info_id = $2::int and s.stock_location_id = 2) as 店舗のスマレジ在庫,
            (select string_agg(to_char(h.create_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS'), ',' order by h.id) from dtb_price_history h where h.product_class_id = pc.id) as 価格変更日時
       from dtb_product_class pc
       join dtb_product p on p.id = pc.product_id
       join mtb_product_status ps1 on ps1.id = pc.product_status_id
       join mtb_product_status ps2 on ps2.id = p.product_status_id
      where pc.id = $1::int`, [規格ID, 店舗ID])[0];
}
