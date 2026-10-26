-- S-M03-13-PRIORITY-CODES（優先表示入力用規格）
-- 流す時点: 画面で登録する前に流す（消すのは 商品コードUNKNOWN-999の規格 だけ。状態・属性が「存在しない」と書く行で、このシードは画面で作らない。そのため登録のあとに流しても、このシードが作った行は消えない）。手順書（S-M03-13-PRIORITY-CODES.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 規格コードUNKNOWN-999の規格が登録されているときは、DBへ直接操作して削除する。
--     備考: 該当が無ければ何も消えない
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
-- 商品コード UNKNOWN-999 の規格だけを消す(依存する行を先に消す)
DELETE FROM dtb_buy_order_cart WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_buy_order_stock_history WHERE buy_order_stock_id IN (SELECT id FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_cart_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_category_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_otc_buy_order_detail WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_otc_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_otc_buy_order_stock_history WHERE otc_buy_order_stock_id IN (SELECT id FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_price_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_product_class_image WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_product_request WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_inventory_plan_detail_edit_history WHERE inventory_plan_detail_id IN (SELECT id FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999')));
DELETE FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_stock_edit_approval_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_from_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_to_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_stock_split_join_detail WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999')));
DELETE FROM dtb_stock_split_join_status_history WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999')));
DELETE FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_stock_split_join_detail WHERE subject_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_weekly_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_weekly_stock_history_temp WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999'));
DELETE FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_sales_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_stock_up_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_stockout_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_tag_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_tax_rule WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_code = 'UNKNOWN-999');
DELETE FROM dtb_product_class WHERE product_code = 'UNKNOWN-999';

COMMIT;
