-- 撤去: SEED-M01-DISABLED
BEGIN;
DELETE FROM dtb_login_history WHERE member_id = 900000902 OR user_name = 'e2e_disabled';
DELETE FROM dtb_member WHERE id = 900000902 AND login_id = 'e2e_disabled';
SELECT seed_resync('dtb_login_history', 'id', 0);
SELECT seed_resync('dtb_member', 'id', 0);
COMMIT;
