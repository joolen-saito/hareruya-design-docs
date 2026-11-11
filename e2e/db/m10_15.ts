/** M10-15 店舗登録のDB確認（参照だけ）。物理名はSQLの中にだけ書き、呼び出す側には業務の言葉で返す */
import { query } from "../lib/db";

/** 業務の項目名 → SQL の式（店舗の行 b・都道府県 p） */
const 列: Record<string, string> = {
  会社名: "b.company_name", "会社名(カナ)": "b.company_kana", 店名: "b.shop_name", "店名(カナ)": "b.shop_kana", "店名(英語表記)": "b.shop_name_eng",
  支店URL: "b.html_class_name", 郵便番号: "b.postal_code", 都道府県: "p.name", 都道府県の番号: "b.pref_id", 住所: "b.addr01", 番地: "b.addr02",
  "住所(英語表記)": "b.address_en", "Google map埋め込みURL": "b.google_map_url", 電話番号: "b.phone_number",
  店舗営業時間: "b.business_hour", "店舗営業時間(英語表記)": "b.business_hour_en",
  送信元メールアドレス: "b.email01", 問い合わせ専用メールアドレス: "b.email02", 返信先メールアドレス: "b.email03", 送信エラー通知メールアドレス: "b.email04",
  高額商品閾値1: "b.expensive_threshold1", 高額商品閾値2: "b.expensive_threshold2", 高額商品閾値3: "b.expensive_threshold3",
  スマレジ店舗ID: "b.smaregi_shop_id", スマレジ店舗コード: "b.smaregi_shop_code", 取り扱い商品説明文: "b.good_traded", 店舗からのメッセージ: "b.message",
  "店名略称（3文字）": "b.shop_digit", ショップ名略称: "b.short_name_jp", "ショップ名略称（英語表記）": "b.short_name_en", 表示順: "b.\"rank\"", 席数: "b.max_capacity",
  ピッキングリスト分割しきい値価格: "b.picking_list_threshold", スタック用紙高額商品しきい値価格: "b.stack_paper_threshold",
  X公式アカウントURL: "b.x_account_url", 店頭用アカウントIPアドレス: "b.global_ip_address",
  "送料無料条件（金額）": "b.delivery_free_amount", "送料無料条件（数量）": "b.delivery_free_quantity", 適格請求書発行事業者登録番号: "b.invoice_registration_number",
  ショップカラー: "b.shop_color", ショップアイコン: "b.shop_icon", ご当地晴れる屋くん: "b.local_hareruyakun_image",
  店舗種別: "case when b.is_main_shop then '本店' else '支店' end", 公開: "case when b.is_public_shop then '公開' else '非公開' end",
  開店: "case when b.is_open_shop then '開店' else '閉店' end", 売上集計の検索項目: "case when b.is_summary_target then '表示する' else '表示しない' end",
  最終更新日時: "b.update_date::text",
};

export type 店舗の保存値 = Record<string, string | null>;

/** 店舗IDの店舗の保存値（業務の項目名で返す）。無ければ null */
export function 店舗の保存値(店舗ID: string): 店舗の保存値 | null {
  const sel = Object.entries(列).map(([k, e], i) => `(${e})::text as c${i}`).join(", ");
  const r = query(`select ${sel} from dtb_base_info b left join mtb_pref p on p.id = b.pref_id where b.id = $1::int`, [店舗ID]);
  if (r.length === 0) return null;
  return Object.fromEntries(Object.keys(列).map((k, i) => [k, r[0][`c${i}`]]));
}

/** 店名がちょうど一致する店舗の店舗ID */
export function 店名の店舗(店名: string): string[] {
  return query(`select id::text as id from dtb_base_info where shop_name = $1 order by id`, [店名]).map((r) => r.id ?? "");
}

/** 店舗の注文番号・店頭注文番号の採番（行ごとの値） */
export function 採番(店舗ID: string): { 注文番号: string[]; 店頭注文番号: string[] } {
  return {
    注文番号: query(`select value::text as v from dtb_order_no where base_info_id = $1::int order by id`, [店舗ID]).map((r) => r.v ?? ""),
    店頭注文番号: query(`select value::text as v from dtb_order_number where base_info_id = $1::int order by id`, [店舗ID]).map((r) => r.v ?? ""),
  };
}

/** 店舗に紐づく在庫の件数・数量の合計・在庫の行の指紋（作り直されると変わる） */
export function 在庫の様子(店舗ID: string): { 件数: number; 合計: string; 指紋: string } {
  const r = query(`select count(*)::text as n, coalesce(sum(stock), 0)::text as s,
    md5(coalesce(string_agg(id::text || ':' || coalesce(stock::text, '') || ':' || create_date::text, ',' order by id), '')) as f
    from dtb_product_stock where base_info_id = $1::int`, [店舗ID]);
  return { 件数: Number(r[0].n), 合計: r[0].s ?? "0", 指紋: r[0].f ?? "" };
}

/** ログインIDのメンバーの所属店舗の店舗ID（いなければ null） */
export function メンバーの所属店舗(ログインID: string): string | null {
  const r = query(`select base_info_id::text as b from dtb_member where login_id = $1`, [ログインID]);
  return r[0]?.b ?? null;
}

/** 都道府県の名前の番号 */
export function 都道府県の番号(名前: string): string | null {
  return query(`select id::text as id from mtb_pref where name = $1`, [名前])[0]?.id ?? null;
}
