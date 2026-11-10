/** M03-09 商品規格登録/編集の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 商品規格の記録 = {
  販売価格: number; 基準価格: number; 買取価格: number; セール: boolean; 公開ステータス: string; 削除されていない: boolean;
  状態: string; 状態名: string; 商品コード: string; スマレジ連携: boolean; スマレジ商品コード: string; 更新日時: string; 状態別称: string;
};

/** 商品規格IDの商品規格の記録（無ければ null） */
export function 商品規格の記録(商品規格ID: string): 商品規格の記録 | null {
  const r = query(
    `select pc.price02, pc.standard_price, pc.buy_price, pc.sale_flg, ps.name as status, pc.visible,
            coalesce(cc.name_jp, '') as condition, coalesce(pc.card_condition_name, '') as condition_name, coalesce(pc.product_code, '') as code,
            pc.smaregi_alignment_flg, coalesce(pc.smaregi_product_code, '') as smaregi_code, coalesce(pc.memo, '') as memo,
            to_char(pc.update_date, 'YYYY-MM-DD"T"HH24:MI:SS.US TZH') as updated
       from dtb_product_class pc
       left join mtb_product_status ps on ps.id = pc.product_status_id
       left join mtb_card_condition cc on cc.id = pc.card_condition_id
      where pc.id = $1`,
    [商品規格ID],
  )[0];
  if (!r) return null;
  const b = (v: unknown) => v === true || v === "t" || v === "true";
  return {
    販売価格: Number(r.price02), 基準価格: Number(r.standard_price), 買取価格: Number(r.buy_price), セール: b(r.sale_flg),
    公開ステータス: String(r.status), 削除されていない: b(r.visible), 状態: String(r.condition), 状態名: String(r.condition_name),
    商品コード: String(r.code), スマレジ連携: b(r.smaregi_alignment_flg), スマレジ商品コード: String(r.smaregi_code), 更新日時: String(r.updated), 状態別称: String(r.memo),
  };
}

/** 商品IDの商品規格のうち、商品コードがちょうど一致するものの商品規格ID */
export function 商品コードの商品規格ID(商品ID: string, 商品コード: string): string[] {
  return query(`select id from dtb_product_class where product_id = $1 and product_code = $2 order by id`, [商品ID, 商品コード]).map((r) => String(r.id));
}

/** 商品規格に紐づく画像のファイル名（並び順） */
export function 商品規格の画像(商品規格ID: string): string[] {
  return query(
    `select pi.file_name from dtb_product_class_image ci join dtb_product_image pi on pi.id = ci.product_image_id
      where ci.product_class_id = $1 order by ci.rank, ci.product_image_id`,
    [商品規格ID],
  ).map((r) => String(r.file_name));
}

/** 商品規格の価格履歴の件数 */
export function 価格履歴の件数(商品規格ID: string): number {
  return Number(query(`select count(*) as n from dtb_price_history where product_class_id = $1`, [商品規格ID])[0]?.n ?? 0);
}

/** 商品コードの商品規格（ほかの人のも含む）の件数。シードの「その商品コードの規格が無い状態にする」を確かめる */
export function 商品コードの規格の数(商品コード: string): number {
  return Number(query(`select count(*) as n from dtb_product_class where product_code = $1`, [商品コード])[0]?.n ?? 0);
}

/** 部門ID が有効か */
export function 部門が有効か(部門ID: string): boolean {
  const r = query(`select visible from mtb_section where id = $1`, [部門ID])[0];
  return !!r && ["t", "true", "1"].includes(String(r.visible));
}

/** 状態のマスタの名前（並び順） */
export function 状態の名前(): string[] {
  return query(`select name_jp as name from mtb_card_condition order by sort_no, id`).map((r) => String(r.name));
}

/** 言語のマスタのうち、名前が渡したものに一致する名前 */
export function ある言語(名前: string[]): string[] {
  return query(`select name_jp as name from mtb_language where name_jp = any(string_to_array($1, ','))`, [名前.join(",")]).map((r) => String(r.name));
}
