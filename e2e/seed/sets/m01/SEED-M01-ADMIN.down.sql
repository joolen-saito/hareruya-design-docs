-- 撤去: SEED-M01-ADMIN
BEGIN;
DELETE FROM dtb_login_history WHERE member_id = 900000901 OR user_name = 'e2e_admin';
DELETE FROM dtb_member WHERE id = 900000901 AND login_id = 'e2e_admin';
SELECT seed_resync('dtb_login_history', 'id', 0);
SELECT seed_resync('dtb_member', 'id', 0);
COMMIT;
