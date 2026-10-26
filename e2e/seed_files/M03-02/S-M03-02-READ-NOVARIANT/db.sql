-- S-M03-02-READ-NOVARIANT（読み取り専用規格未登録商品）
-- 流す時点: 投入方法の「商品マスター(検索結果)でその行の商品名を押して商品編集画面を開き、割引率に「割引率A」を選んで「商…」を終えたあと。手順書（S-M03-02-READ-NOVARIANT.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 商品規格を0件にすることは画面で指定できないためDBへ直接設定する（グッズ商品CSV登録で作られた商品規格1件を削除する）。
-- 商品 〔商品ID-M0302-共有B〕 の規格だけを消す
DELETE FROM dtb_buy_order_cart WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_buy_order_stock_history WHERE buy_order_stock_id IN (SELECT id FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_cart_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_category_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_otc_buy_order_detail WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_otc_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_otc_buy_order_stock_history WHERE otc_buy_order_stock_id IN (SELECT id FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_price_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_product_class_image WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_product_request WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_inventory_plan_detail_edit_history WHERE inventory_plan_detail_id IN (SELECT id FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕)));
DELETE FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_stock_edit_approval_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_from_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_to_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_stock_split_join_detail WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕)));
DELETE FROM dtb_stock_split_join_status_history WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕)));
DELETE FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_stock_split_join_detail WHERE subject_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_weekly_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_weekly_stock_history_temp WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕));
DELETE FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_sales_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_stock_up_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_stockout_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_tag_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DELETE FROM dtb_tax_rule WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕);
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product WHERE id = 〔商品ID-M0302-共有B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品ID-M0302-共有B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_product_class WHERE product_id = 〔商品ID-M0302-共有B〕;

COMMIT;
