-- 撤去: SEED-M02-SALES-DASHBOARD
BEGIN;
DELETE FROM dtb_order_item WHERE id BETWEEN 900000021 AND 900000044;
DELETE FROM dtb_shipping   WHERE id BETWEEN 900000021 AND 900000043;
DELETE FROM dtb_order      WHERE id BETWEEN 900000021 AND 900000042;
DELETE FROM dtb_customer   WHERE id = 900000021;

SELECT seed_resync('dtb_order_item', 'id', 0);
SELECT seed_resync('dtb_shipping',   'id', 0);
SELECT seed_resync('dtb_order',      'id', 0);
SELECT seed_resync('dtb_customer',   'id', 0);
COMMIT;
