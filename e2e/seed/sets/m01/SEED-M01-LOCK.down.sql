-- 撤去: SEED-M01-LOCK
BEGIN;
DELETE FROM dtb_login_history WHERE member_id = 900000905 OR user_name = 'e2e_lock';
DELETE FROM dtb_member WHERE id = 900000905 AND login_id = 'e2e_lock';
SELECT seed_resync('dtb_login_history', 'id', 0);
SELECT seed_resync('dtb_member', 'id', 0);
COMMIT;
