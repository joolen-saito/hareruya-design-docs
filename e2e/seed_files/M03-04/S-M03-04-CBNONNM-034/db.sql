-- S-M03-04-CBNONNM-034（カード詳細なしでNM規格のない商品と対照商品(034)）
-- 流す時点: 投入方法の「商品規格一覧で「新規作成」を押し、商品規格登録画面で状態にスライトリープレイドを選び、商品コードに「…」を終えたあと、次の「【商品B】グッズ商品CSV登録で「雛形ファイルダウンロード」から得た見出し行に次…」より前。手順書（S-M03-04-CBNONNM-034.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 状態NMの規格0件は画面で指定できないためDBへ直接設定する（取込で作られた状態NMの規格と、その規格の在庫を消す）。
--     備考: 状態NM以外の規格は消さない
--     備考: 対象の商品は節の見出し【商品A】の商品
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product WHERE id = 〔商品ID-M0304-034A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品 〔商品ID-M0304-034A〕 が1件に決まらない（%件）', n; END IF; END $$;
-- 商品 〔商品ID-M0304-034A〕 の状態NMの規格と、その規格の在庫などだけを消す
DELETE FROM dtb_buy_order_cart WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_buy_order_stock_history WHERE buy_order_stock_id IN (SELECT id FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_cart_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_category_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_otc_buy_order_detail WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_otc_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_otc_buy_order_stock_history WHERE otc_buy_order_stock_id IN (SELECT id FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_price_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_product_class_image WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_product_request WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_inventory_plan_detail_edit_history WHERE inventory_plan_detail_id IN (SELECT id FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'))));
DELETE FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_stock_edit_approval_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_from_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_to_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_stock_split_join_detail WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'))));
DELETE FROM dtb_stock_split_join_status_history WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'))));
DELETE FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_stock_split_join_detail WHERE subject_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_weekly_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_weekly_stock_history_temp WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM')));
DELETE FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_sales_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_stock_up_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_stockout_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_tag_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_tax_rule WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM'));
DELETE FROM dtb_product_class WHERE product_id = 〔商品ID-M0304-034A〕 AND card_condition_id = (SELECT id FROM mtb_card_condition WHERE code = 'NM');

COMMIT;
