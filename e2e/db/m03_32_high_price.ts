/**
 * 高額商品価格変更CSV登録（M03-32）・セール用高額商品価格変更CSV登録（M03-33）のDB確認（参照だけ）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/** 取込履歴の種別（CSV取込種別のマスタの番号） */
export const 取込種別 = { 高額商品価格変更: 8, セール用高額商品価格変更: 7 } as const;

export type 商品規格の状態 = {
  商品規格ID: string;
  商品コード: string;
  基準価格: string;
  販売価格: string;
  買取価格: string;
  セール: boolean;
  帯URL: string | null;
  高額商品コード: string | null;
  スマレジ連携: string | null;
  更新日時: string;
  /** 商品規格の全項目（取込の前後で「変わらない」を見るための比較用。中身は見せない） */
  全項目: string;
};

const num = (v: string | null) => (v === null ? "" : String(Number(v)));

/** 商品規格IDの商品規格。無ければ null */
export function 商品規格の状態(商品規格ID: string): 商品規格の状態 | null {
  const rows = query(`select pc.id as "商品規格ID", pc.product_code as "商品コード", pc.standard_price as "基準価格", pc.price02 as "販売価格",
      pc.buy_price as "買取価格", pc.sale_flg as "セール", pc.belt_url as "帯URL", pc.high_price_code as "高額商品コード",
      pc.smaregi_alignment_flg as "スマレジ連携", to_char(pc.update_date, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "更新日時",
      row_to_json(pc)::text as "全項目"
    from dtb_product_class pc where pc.id = $1`, [商品規格ID]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    商品規格ID: r.商品規格ID ?? "", 商品コード: r.商品コード ?? "", 基準価格: num(r.基準価格), 販売価格: num(r.販売価格), 買取価格: num(r.買取価格),
    セール: r.セール === "true", 帯URL: r.帯URL, 高額商品コード: r.高額商品コード, スマレジ連携: r.スマレジ連携, 更新日時: r.更新日時 ?? "",
    全項目: r.全項目 ?? "",
  };
}

/** 種別の取込履歴の件数（ファイル名を渡せば、そのファイル名のものだけ） */
export function 取込履歴の件数(種別: number, ファイル名?: string): number {
  const rows = ファイル名 === undefined
    ? query(`select count(*) as "件数" from dtb_csv_import_history where csv_import_type_id = $1`, [種別])
    : query(`select count(*) as "件数" from dtb_csv_import_history where csv_import_type_id = $1 and file_name = $2`, [種別, ファイル名]);
  return Number(rows[0].件数 ?? "0");
}
