-- S-M03-31-DATA-045（未登録言語データ）
-- 流す時点: 投入方法の「その行の商品名を押して商品登録編集画面を開き、規格設定を押して商品規格一覧を開き、行の編集を押して商…」を終えたあと、次の「状態・属性に書いた値（番号は控えた番号）で unknown-language-0…」より前。手順書（S-M03-31-DATA-045.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 言語ID 933045が未登録である状態は画面で指定できないためDBへ直接設定する（登録があれば削除する）。
--     備考: 該当が無ければ何も消えない
-- 言語ID 933045 の行だけを消す(依存する行を先に消す)
DELETE FROM dtb_banner_language WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045);
DELETE FROM dtb_application_price WHERE buy_main_card_id IN (SELECT id FROM dtb_buy_main_card WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_buy_main_card WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045);
DELETE FROM dtb_favorite_product WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045);
DELETE FROM dtb_buy_order_cart WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_buy_order_stock_history WHERE buy_order_stock_id IN (SELECT id FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_cart_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_category_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_order_item_tag_sales_analysis WHERE order_item_id IN (SELECT id FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_order_item WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_otc_buy_order_detail WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_otc_buy_order_indivisual_input_product WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_otc_buy_order_stock_history WHERE otc_buy_order_stock_id IN (SELECT id FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_otc_buy_order_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_price_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_product_class_image WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_product_request WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_inventory_plan_detail_edit_history WHERE inventory_plan_detail_id IN (SELECT id FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_inventory_plan_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_stock_edit_approval_detail WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_from_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_stock_move_transfer_detail WHERE move_to_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_stock_split_join_detail WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_stock_split_join_status_history WHERE stock_split_join_id IN (SELECT id FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_stock_split_join WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_stock_split_join_detail WHERE subject_product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_weekly_stock_history WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_weekly_stock_history_temp WHERE product_stock_id IN (SELECT id FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_product_stock WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_sales_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_stock_up_quantity WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_stockout_history WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_tag_sort WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_tax_rule WHERE product_class_id IN (SELECT id FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_product_class WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045);
DELETE FROM dtb_product_request WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045);
DELETE FROM dtb_top_banner_language WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045);
DELETE FROM dtb_archetype_color WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_archetype_deck_tag WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_article_archetype WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_article_deck WHERE deck_id IN (SELECT id FROM dtb_deck WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_attraction_card WHERE deck_id IN (SELECT id FROM dtb_deck WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_deck_campaign_tag WHERE deck_id IN (SELECT id FROM dtb_deck WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_deck_card WHERE deck_id IN (SELECT id FROM dtb_deck WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_deck_deck_tag WHERE deck_id IN (SELECT id FROM dtb_deck WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_maybe_card WHERE deck_id IN (SELECT id FROM dtb_deck WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045))));
DELETE FROM dtb_deck WHERE archetype_id IN (SELECT id FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_archetype WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM dtb_article_deck WHERE deck_id IN (SELECT id FROM dtb_deck WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_attraction_card WHERE deck_id IN (SELECT id FROM dtb_deck WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_deck_campaign_tag WHERE deck_id IN (SELECT id FROM dtb_deck WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_deck_card WHERE deck_id IN (SELECT id FROM dtb_deck WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_deck_deck_tag WHERE deck_id IN (SELECT id FROM dtb_deck WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_maybe_card WHERE deck_id IN (SELECT id FROM dtb_deck WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045)));
DELETE FROM dtb_deck WHERE card_image_id IN (SELECT id FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045));
DELETE FROM mtb_card_image WHERE language_id IN (SELECT id FROM mtb_language WHERE id = 933045);
DELETE FROM mtb_language WHERE id = 933045;

COMMIT;
