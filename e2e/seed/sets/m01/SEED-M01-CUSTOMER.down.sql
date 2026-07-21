-- 撤去: SEED-M01-CUSTOMER
BEGIN;
DELETE FROM dtb_customer WHERE id = 900000904 AND email = 'e2e-m01-customer@example.test';
SELECT seed_resync('dtb_customer', 'id', 0);
COMMIT;
