-- 撤去: SEED-M05-15-ORDER（自セットの帯IDのみ、子→親順）。
-- 共有会員 900000201 は、参照する受注が残っていない場合に限り削除する（SEED-M05-ORDERS 併用時の破壊を防ぐ）。
BEGIN;
DELETE FROM dtb_order_item WHERE id = 900000401;
DELETE FROM dtb_shipping   WHERE id = 900000501;
DELETE FROM dtb_order      WHERE id = 900000301;

DELETE FROM dtb_customer c
 WHERE c.id = 900000201
   AND NOT EXISTS (SELECT 1 FROM dtb_order o WHERE o.customer_id = 900000201);

SELECT seed_resync('dtb_order_item', 'id', 0);
SELECT seed_resync('dtb_shipping',   'id', 0);
SELECT seed_resync('dtb_order',      'id', 0);
SELECT seed_resync('dtb_customer',   'id', 0);
COMMIT;
