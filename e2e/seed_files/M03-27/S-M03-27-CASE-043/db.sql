-- S-M03-27-CASE-043（5009行取込データ(043)）
-- 流す時点: 投入方法の「②商品一覧の詳細検索「コード」に「LIMIT-0001-043」「LIMIT-5009-043」を1…」を終えたあと、次の「③グッズ商品CSV取込履歴の0件は画面で作れないためDBへ直接設定する（取込履歴…」より前。手順書（S-M03-27-CASE-043.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 前回の実行で登録された商品が残っているときは、最大5009件を画面で1件ずつ選んで消すのは現実的でないため、商品コードがLIMIT-0001-043〜LIMIT-5009-043の商品をDBへ直接削除する。
--     備考: 該当が無ければ何も消えない
-- 商品コード LIMIT-0001-043〜LIMIT-5009-043 の商品だけを消す
DROP TABLE IF EXISTS zz_seed_del_1;
CREATE TEMP TABLE zz_seed_del_1 ON COMMIT DROP AS SELECT DISTINCT product_id AS id FROM dtb_product_class WHERE product_code ~ '^LIMIT-[0-9]{4}-043$' AND substring(product_code from 7 for 4)::int BETWEEN 1 AND 5009;
DELETE FROM dtb_application_price WHERE buy_main_card_id IN (SELECT id FROM dtb_buy_main_card WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_buy_main_card WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_customer_favorite_product WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_favorite_product WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_order_item WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_product_category WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_buy_order_cart WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_buy_order_stock_history WHERE buy_order_stock_id IN (SELECT id FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_cart_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_category_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_otc_buy_order_detail WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_otc_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_otc_buy_order_stock_history WHERE otc_buy_order_stock_id IN (SELECT id FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_price_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_product_class_image WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_product_request WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_inventory_plan_detail_edit_history WHERE inventory_plan_detail_id IN (SELECT id FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)))));
DELETE FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_stock_edit_approval_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_from_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_to_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_stock_split_join_detail WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)))));
DELETE FROM dtb_stock_split_join_status_history WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)))));
DELETE FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_stock_split_join_detail WHERE subject_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_weekly_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_weekly_stock_history_temp WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1))));
DELETE FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_sales_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_stock_up_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_stockout_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_tag_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_tax_rule WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_product_class WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_product_class_image WHERE product_image_id IN (SELECT id FROM dtb_product_image WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1)));
DELETE FROM dtb_product_image WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_product_request WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_product_tag WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_product_tag_sales_analysis WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_tax_rule WHERE product_id IN (SELECT id FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1));
DELETE FROM dtb_product WHERE id IN (SELECT id FROM zz_seed_del_1);

COMMIT;
