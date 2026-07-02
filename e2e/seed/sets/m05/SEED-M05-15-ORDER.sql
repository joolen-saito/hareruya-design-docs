-- SEED-M05-15-ORDER : 受注メール通知(m05-15)用の「非破壊・参照専用」受注1件。
--   email あり / 会員紐付き / 明細1件以上 / 対応状況設定済み。ORDER_ID として spec に env で渡す。
-- 対象: dtb_customer(共有会員), dtb_order(ORDER_ID=900000301), dtb_order_item, dtb_shipping。base_info_id=2。
-- べき等: 固定ID + UPSERT + seed_resync。撤去: .down.sql（id指定）。
-- 使用E2EケースID: 001,002,003,004,005,010,020,021,040,050（表示・遷移・必須。非破壊参照）
BEGIN;

-- 共有会員（M05受注用）。secret_key は UNIQUE。
INSERT INTO dtb_customer (id, name01, name02, kana01, kana02, email, password, salt, secret_key,
                          point, del_flg, customer_status_id, create_date, update_date)
VALUES (900000201, 'E2E', '注文者', 'イーツーイー', 'チュウモンシャ', 'e2e-seed-customer@example.test',
        'e2e_seed_dummy_password_hash', NULL, 'e2e_seed_secret_key_201',
        0, 0, 2, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name01 = EXCLUDED.name01, name02 = EXCLUDED.name02, email = EXCLUDED.email,
  secret_key = EXCLUDED.secret_key, del_flg = 0, update_date = now();

-- 受注本体（ORDER_ID=900000301）。order_status_id=4(対応中)、email あり。
INSERT INTO dtb_order (id, base_info_id, customer_id, order_status_id, order_no,
                       name01, name02, kana01, kana02, email,
                       subtotal, discount, delivery_fee_total, charge, tax, total, payment_total,
                       add_point, use_point, order_date, create_date, update_date)
VALUES (900000301, 2, 900000201, 4, 'E2E-SEED-15-ORDER',
        'E2E', '注文者', 'イーツーイー', 'チュウモンシャ', 'e2e-seed-order15@example.test',
        1000, 0, 0, 0, 0, 1000, 1000,
        0, 0, now(), now(), now())
ON CONFLICT (id) DO UPDATE SET
  base_info_id = 2, customer_id = 900000201, order_status_id = 4,
  order_no = EXCLUDED.order_no, email = EXCLUDED.email,
  subtotal = EXCLUDED.subtotal, total = EXCLUDED.total, payment_total = EXCLUDED.payment_total,
  update_date = now();

-- 配送（受注編集・メール画面の参照用）。
-- 注: admin受注検索は innerJoin(s.Country) / innerJoin(s.Pref) を持つため country_id/pref_id 必須。
INSERT INTO dtb_shipping (id, order_id, base_info_id, country_id, pref_id, name01, name02, kana01, kana02, create_date, update_date)
VALUES (900000501, 900000301, 2, 392, 13, 'E2E', '注文者', 'イーツーイー', 'チュウモンシャ', now(), now())
ON CONFLICT (id) DO UPDATE SET order_id = 900000301, base_info_id = 2, country_id = 392, pref_id = 13, update_date = now();

-- 明細1件（購入商品カード表示・メール本文描画・受注編集画面用）。
-- 注: 受注編集(getOrderItemList)は innerJoin(oi.Product)/innerJoin(oi.ProductClass) を持つため
--     product_id / product_class_id は既存商品(1)/規格(1)を参照必須（NULLだと編集画面が404）。
--     order_item_type_id=1(商品明細) を設定。
INSERT INTO dtb_order_item (id, order_id, shipping_id, base_info_id, product_id, product_class_id,
                            order_item_type_id, product_name,
                            price, quantity, tax, tax_rate, tax_adjust, total_cost)
VALUES (900000401, 900000301, 900000501, 2, 1, 1, 1, 'E2Eシード商品',
        1000, 1, 0, 10, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  order_id = 900000301, shipping_id = 900000501, base_info_id = 2,
  product_id = 1, product_class_id = 1, order_item_type_id = 1,
  product_name = EXCLUDED.product_name, price = EXCLUDED.price, quantity = EXCLUDED.quantity;

SELECT seed_resync('dtb_customer',   'id', 900000999);
SELECT seed_resync('dtb_order',      'id', 900000999);
SELECT seed_resync('dtb_shipping',   'id', 900000999);
SELECT seed_resync('dtb_order_item', 'id', 900000999);
COMMIT;
