-- 撤去: SEED-F06-CUSTOMER
BEGIN;
DELETE FROM dtb_customer WHERE id = 900000101;
SELECT seed_resync('dtb_customer', 'id', 0);
COMMIT;
