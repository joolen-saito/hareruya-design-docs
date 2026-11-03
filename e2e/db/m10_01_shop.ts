/** 店舗基本情報（本店＝店舗ID 1）のDB確認（参照だけ）。物理名はSQLの中にだけ書く */
import { query } from "../lib/db";

export type 店舗基本情報 = Record<string, string | null>;

export function 店舗基本情報を読む(): 店舗基本情報 {
  const r = query(`select company_name as "会社名", company_kana as "会社名(フリガナ)", shop_name as "店名", shop_kana as "店名(フリガナ)", shop_name_eng as "店名(英語表記)",
    postal_code as "郵便番号", pref_id as "都道府県ID", addr01 as "市区町村名", addr02 as "番地・ビル名", address_en as "住所(英語表記)",
    phone_number as "電話番号", fax_number as "FAX番号", business_hour as "店舗営業時間",
    email01 as "送信元メールアドレス", email03 as "返信先メールアドレス", email04 as "送信エラー通知メールアドレス", email02 as "問い合わせ専用メールアドレス",
    good_traded as "取扱商品", message as "メッセージ", x_account_url as "X公式アカウントURL", short_name_en as "ショップ名略称(英語表記)",
    smaregi_shop_id as "スマレジ店舗ID", smaregi_shop_code as "スマレジ店舗コード",
    delivery_free_amount as "送料無料条件(金額)", delivery_free_quantity as "送料無料条件(数量)",
    option_product_delivery_fee as "商品ごとの送料設定", option_multiple_shipping as "複数配送", option_customer_activate as "仮会員",
    option_mypage_order_status_display as "マイページの注文状況表示", option_favorite_product as "お気に入り商品", option_remember_me as "自動ログイン",
    option_nostock_hidden as "在庫切れ商品の非表示"
    from dtb_base_info where id = 1`);
  if (r.length !== 1) throw new Error("本店の店舗基本情報が読めない");
  return r[0];
}
