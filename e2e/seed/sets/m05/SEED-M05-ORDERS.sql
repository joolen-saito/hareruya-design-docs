-- SEED-M05-ORDERS : 受注一覧/ページング/並び替え/一括操作(m05-01 ほか)用の受注群。
--   40件を投入（既定表示件数を超えて2ページ以上になる規模）。対応状況・受注日を分散。全件 base_info_id=2。
-- 対象: dtb_customer(共有 900000201), dtb_order(900000311..900000350),
--       dtb_shipping(900000511..900000550), dtb_order_item(900000411..900000450)。
-- マーカー: order_no LIKE 'E2E-SEED-%'。撤去はマーカー＋帯ID。
-- 使用E2EケースID: M05-01 の 010,011,012,050,060,070,071,013 等（一覧が0件だと skip されるデータ依存ケース）
BEGIN;

-- 共有会員（SEED-M05-15-ORDER と同一。単独適用でも成立するよう UPSERT）。
INSERT INTO dtb_customer (id, name01, name02, kana01, kana02, email, password, salt, secret_key,
                          point, del_flg, customer_status_id, create_date, update_date)
VALUES (900000201, 'E2E', '注文者', 'イーツーイー', 'チュウモンシャ', 'e2e-seed-customer@example.test',
        'e2e_seed_dummy_password_hash', NULL, 'e2e_seed_secret_key_201',
        0, 0, 2, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name01 = EXCLUDED.name01, name02 = EXCLUDED.name02, email = EXCLUDED.email,
  secret_key = EXCLUDED.secret_key, del_flg = 0, update_date = now();

-- 受注 40件。id=900000310+n、status は既定検索で可視のステータスのみ {1,2,4,5,6}（3=CANCEL/14=PASSED を除外）
-- を循環させ、可視件数を決定的(=40)にする。受注日を n 日ずつ過去へ分散。
INSERT INTO dtb_order (id, base_info_id, customer_id, order_status_id, order_no,
                       name01, name02, kana01, kana02, email,
                       subtotal, discount, delivery_fee_total, charge, tax, total, payment_total,
                       add_point, use_point, order_date, create_date, update_date)
SELECT 900000310 + n, 2, 900000201, (ARRAY[1, 2, 4, 5, 6])[((n - 1) % 5) + 1],
       'E2E-SEED-' || lpad(n::text, 3, '0'),
       'E2Eテスト', '太郎' || n, 'イーツーイー', 'タロウ',
       'e2e-order' || n || '@example.test',
       n * 100, 0, 0, 0, 0, n * 100, n * 100,
       0, 0, now() - (n || ' days')::interval, now(), now()
FROM generate_series(1, 40) AS n
ON CONFLICT (id) DO UPDATE SET
  base_info_id = 2, customer_id = 900000201,
  order_status_id = EXCLUDED.order_status_id, order_no = EXCLUDED.order_no,
  total = EXCLUDED.total, payment_total = EXCLUDED.payment_total,
  order_date = EXCLUDED.order_date, update_date = now();

-- 配送 40件（受注と1:1）。
-- 注: admin受注検索は innerJoin(s.Country) / innerJoin(s.Pref) を持つため country_id/pref_id 必須（NULLだと一覧に出ない）。
INSERT INTO dtb_shipping (id, order_id, base_info_id, country_id, pref_id, name01, name02, kana01, kana02, create_date, update_date)
SELECT 900000510 + n, 900000310 + n, 2, 392, 13, 'E2Eテスト', '太郎' || n, 'イーツーイー', 'タロウ', now(), now()
FROM generate_series(1, 40) AS n
ON CONFLICT (id) DO UPDATE SET order_id = EXCLUDED.order_id, base_info_id = 2, country_id = 392, pref_id = 13, update_date = now();

-- 明細 40件（受注と1:1、配送に紐付け）。
-- 注: 受注編集画面(getOrderItemList)の innerJoin(oi.Product)/innerJoin(oi.ProductClass) のため
--     既存商品(1)/規格(1)を参照必須。order_item_type_id=1(商品明細)。
INSERT INTO dtb_order_item (id, order_id, shipping_id, base_info_id, product_id, product_class_id,
                            order_item_type_id, product_name,
                            price, quantity, tax, tax_rate, tax_adjust, total_cost)
SELECT 900000410 + n, 900000310 + n, 900000510 + n, 2, 1, 1, 1, 'E2Eシード商品' || n,
       n * 100, 1, 0, 10, 0, 0
FROM generate_series(1, 40) AS n
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id, shipping_id = EXCLUDED.shipping_id,
  base_info_id = 2, product_id = 1, product_class_id = 1, order_item_type_id = 1,
  product_name = EXCLUDED.product_name, price = EXCLUDED.price;

SELECT seed_resync('dtb_customer',   'id', 900000999);
SELECT seed_resync('dtb_order',      'id', 900000999);
SELECT seed_resync('dtb_shipping',   'id', 900000999);
SELECT seed_resync('dtb_order_item', 'id', 900000999);
COMMIT;
