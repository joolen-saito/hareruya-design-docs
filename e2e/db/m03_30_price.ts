/**
 * M03-30 基準価格変更CSV登録・M03-31 セール用価格変更CSV登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { count, query } from "../lib/db";

export type 商品規格の状態 = {
  商品ID: string; 言語ID: string; 基準価格: string; 販売価格: string; 買取価格: string;
  セールフラグ: boolean; 帯URL: string | null; スマレジ連携フラグ: boolean; 表示: boolean; 高額商品コード: string | null;
};

/** 商品規格IDの商品規格の価格・フラグ（無ければ null） */
export function 商品規格(商品規格ID: string): 商品規格の状態 | null {
  const rows = query(
    `select product_id, language_id, standard_price, price02, buy_price, sale_flg, belt_url, smaregi_alignment_flg, visible, high_price_code
       from dtb_product_class where id = $1`, [商品規格ID]);
  if (rows.length === 0) return null;
  const r = rows[0];
  const num = (v: string | null) => (v === null ? "" : String(Number(v)));
  return {
    商品ID: r.product_id ?? "", 言語ID: r.language_id ?? "",
    基準価格: num(r.standard_price), 販売価格: num(r.price02), 買取価格: num(r.buy_price),
    セールフラグ: r.sale_flg === "true", 帯URL: r.belt_url, スマレジ連携フラグ: r.smaregi_alignment_flg === "true",
    表示: r.visible === "true", 高額商品コード: r.high_price_code,
  };
}

/** 商品に登録されている商品タグのタグID（昇順） */
export function 商品タグのID(商品ID: string): string[] {
  return query("select tag_id from dtb_product_tag where product_id = $1 order by tag_id", [商品ID]).map((r) => r.tag_id ?? "");
}

/** 取込種別（基準価格変更・セール用価格変更）の取込履歴のうち、ファイル名がちょうど fileName の件数 */
export function 取込履歴の件数(種別: "基準価格変更" | "セール用価格変更", fileName: string): number {
  // 取込種別の番号は、アプリの取込種別の定数（基準価格変更CSV=5・セール用価格変更CSV=6）
  const typeId = 種別 === "基準価格変更" ? 5 : 6;
  return count("select id from dtb_csv_import_history where csv_import_type_id = $1 and file_name = $2", [typeId, fileName]);
}
