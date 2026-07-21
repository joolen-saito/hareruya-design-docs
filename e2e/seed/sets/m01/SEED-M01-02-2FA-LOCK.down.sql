-- 撤去: SEED-M01-02-2FA-LOCK
BEGIN;
DELETE FROM dtb_login_history WHERE member_id = 900000911 OR user_name = 'e2e_2fa_lock';
DELETE FROM dtb_member WHERE id = 900000911 AND login_id = 'e2e_2fa_lock';
SELECT seed_resync('dtb_login_history', 'id', 0);
SELECT seed_resync('dtb_member', 'id', 0);
COMMIT;
