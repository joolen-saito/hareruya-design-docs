-- SEED-M02-SALES-DASHBOARD : M02-02/M02-03 売上状況の集計観点用受注群。
-- 対象: dtb_customer(900000021), dtb_order(900000021..900000042),
--       dtb_shipping(900000021..900000043), dtb_order_item(900000021..900000044)。
-- マーカー: order_no LIKE 'E2E-M02-SALES-%'。撤去はマーカー＋帯ID。
-- 含む観点:
--   - INCLUDE: 売上集計対象ステータス（注文受領/入金待ち/対応中/出荷完了/入金済み/出荷指示/ピック中/店頭予約/ピック完了/引渡し済み）
--   - EXCLUDE: 売上対象外ステータス（キャンセル/決済処理中/購入処理中/返品）
--   - ZERO: payment_total=0
--   - MULTILINE: 複数配送/複数明細を持つ受注1件
--   - BOUNDARY: 今日/昨日/月初/月末の境界判定用 order_date
BEGIN;

INSERT INTO dtb_customer (id, name01, name02, kana01, kana02, email, password, salt, secret_key,
                          point, del_flg, customer_status_id, create_date, update_date)
VALUES (900000021, 'E2E', 'M02売上', 'イーツーイー', 'エムゼロニ', 'e2e-m02-sales@example.test',
        'e2e_seed_dummy_password_hash', NULL, 'e2e_m02_sales_secret_key',
        0, 0, 2, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name01 = EXCLUDED.name01, name02 = EXCLUDED.name02, email = EXCLUDED.email,
  secret_key = EXCLUDED.secret_key, del_flg = 0, update_date = now();

WITH rows(id, status_id, amount, label, order_at) AS (
  VALUES
    -- 売上集計に含めるステータス。今日/今月の集計に入る。
    (900000021,  1, 1000, 'INCLUDE-ORDER-RECEIVED', date_trunc('day', now()) + interval '10 hours'),
    (900000022,  2, 2000, 'INCLUDE-PAYMENT-WAIT',   date_trunc('day', now()) + interval '10 hours 10 minutes'),
    (900000023,  4, 3000, 'INCLUDE-IN-PROGRESS',    date_trunc('day', now()) + interval '10 hours 20 minutes'),
    (900000024,  5, 4000, 'INCLUDE-DELIVERED',      date_trunc('day', now()) + interval '10 hours 30 minutes'),
    (900000025,  6, 5000, 'INCLUDE-PAID',           date_trunc('day', now()) + interval '10 hours 40 minutes'),
    (900000026,  9, 6000, 'INCLUDE-SHIPPING-INST',  date_trunc('day', now()) + interval '10 hours 50 minutes'),
    (900000027, 10, 7000, 'INCLUDE-PICKING',        date_trunc('day', now()) + interval '11 hours'),
    (900000028, 12, 8000, 'INCLUDE-STORE-RESERVE',  date_trunc('day', now()) + interval '11 hours 10 minutes'),
    (900000029, 13, 9000, 'INCLUDE-PICK-FINISH',    date_trunc('day', now()) + interval '11 hours 20 minutes'),
    (900000030, 14,10000, 'INCLUDE-HANDOVER',       date_trunc('day', now()) + interval '11 hours 30 minutes'),
    -- 売上対象外ステータス。今日/今月の期間内だが集計から除外される想定。
    (900000031,  3, 3100, 'EXCLUDE-CANCEL',         date_trunc('day', now()) + interval '12 hours'),
    (900000032,  7, 3200, 'EXCLUDE-PAYMENT-PROC',   date_trunc('day', now()) + interval '12 hours 10 minutes'),
    (900000033,  8, 3300, 'EXCLUDE-PURCHASE-PROC',  date_trunc('day', now()) + interval '12 hours 20 minutes'),
    (900000034, 15, 3400, 'EXCLUDE-RETURN',         date_trunc('day', now()) + interval '12 hours 30 minutes'),
    -- payment_total=0。件数には入るが金額は0。
    (900000035,  1,    0, 'ZERO-PAYMENT',           date_trunc('day', now()) + interval '13 hours'),
    -- 複数配送/複数明細。売上件数は受注1件として数える想定。
    (900000036,  1, 1234, 'MULTILINE',              date_trunc('day', now()) + interval '13 hours 10 minutes'),
    -- 境界。開始以上/終了未満の確認用。
    (900000037,  1,  100, 'BOUNDARY-TODAY-START',   date_trunc('day', now())),
    (900000038,  1,  200, 'BOUNDARY-TOMORROW-MINUS',date_trunc('day', now()) + interval '1 day' - interval '1 second'),
    (900000039,  1,  300, 'BOUNDARY-TOMORROW-START',date_trunc('day', now()) + interval '1 day'),
    (900000040,  1,  400, 'BOUNDARY-YESTERDAY-START',date_trunc('day', now()) - interval '1 day'),
    (900000041,  1,  500, 'BOUNDARY-MONTH-START',   date_trunc('month', now())),
    (900000042,  1,  600, 'BOUNDARY-NEXT-MONTH',    date_trunc('month', now()) + interval '1 month')
)
INSERT INTO dtb_order (id, base_info_id, customer_id, order_status_id, order_no,
                       name01, name02, kana01, kana02, email,
                       subtotal, discount, delivery_fee_total, charge, tax, total, payment_total,
                       add_point, use_point, order_date, create_date, update_date)
SELECT id, 2, 900000021, status_id, 'E2E-M02-SALES-' || label,
       'E2E', 'M02売上', 'イーツーイー', 'エムゼロニ', 'e2e-m02-sales@example.test',
       amount, 0, 0, 0, 0, amount, amount,
       0, 0, order_at, now(), now()
FROM rows
ON CONFLICT (id) DO UPDATE SET
  base_info_id = 2, customer_id = 900000021,
  order_status_id = EXCLUDED.order_status_id, order_no = EXCLUDED.order_no,
  subtotal = EXCLUDED.subtotal, total = EXCLUDED.total, payment_total = EXCLUDED.payment_total,
  order_date = EXCLUDED.order_date, update_date = now();

-- 既定の1受注1配送。
INSERT INTO dtb_shipping (id, order_id, base_info_id, country_id, pref_id,
                          name01, name02, kana01, kana02, create_date, update_date)
SELECT id, id, 2, 392, 13, 'E2E', 'M02売上', 'イーツーイー', 'エムゼロニ', now(), now()
FROM generate_series(900000021, 900000042) AS id
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id, base_info_id = 2, country_id = 392, pref_id = 13, update_date = now();

-- MULTILINE用の2つ目の配送。
INSERT INTO dtb_shipping (id, order_id, base_info_id, country_id, pref_id,
                          name01, name02, kana01, kana02, create_date, update_date)
VALUES (900000043, 900000036, 2, 392, 13, 'E2E', 'M02売上2', 'イーツーイー', 'エムゼロニ', now(), now())
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id, base_info_id = 2, country_id = 392, pref_id = 13, update_date = now();

-- 既定の1受注1明細。
INSERT INTO dtb_order_item (id, order_id, shipping_id, base_info_id, product_id, product_class_id,
                            order_item_type_id, product_name,
                            price, quantity, tax, tax_rate, tax_adjust, total_cost)
SELECT id, id, id, 2, 1, 1, 1, 'E2E M02売上商品',
       payment_total, 1, 0, 10, 0, 0
FROM dtb_order
WHERE id BETWEEN 900000021 AND 900000042
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id, shipping_id = EXCLUDED.shipping_id,
  base_info_id = 2, product_id = 1, product_class_id = 1, order_item_type_id = 1,
  product_name = EXCLUDED.product_name, price = EXCLUDED.price, quantity = EXCLUDED.quantity;

-- MULTILINE用の2つ目/3つ目の明細。受注1件に複数明細・複数配送を持たせる。
INSERT INTO dtb_order_item (id, order_id, shipping_id, base_info_id, product_id, product_class_id,
                            order_item_type_id, product_name,
                            price, quantity, tax, tax_rate, tax_adjust, total_cost)
VALUES
  (900000043, 900000036, 900000036, 2, 1, 1, 1, 'E2E M02売上商品 複数明細A', 600, 1, 0, 10, 0, 0),
  (900000044, 900000036, 900000043, 2, 1, 1, 1, 'E2E M02売上商品 複数明細B', 634, 1, 0, 10, 0, 0)
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id, shipping_id = EXCLUDED.shipping_id,
  base_info_id = 2, product_id = 1, product_class_id = 1, order_item_type_id = 1,
  product_name = EXCLUDED.product_name, price = EXCLUDED.price, quantity = EXCLUDED.quantity;

SELECT seed_resync('dtb_customer',   'id', 900000999);
SELECT seed_resync('dtb_order',      'id', 900000999);
SELECT seed_resync('dtb_shipping',   'id', 900000999);
SELECT seed_resync('dtb_order_item', 'id', 900000999);
COMMIT;
