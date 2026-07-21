-- 撤去: SEED-M01-02-2FA-RESET
BEGIN;
DELETE FROM dtb_login_history WHERE member_id = 900000907 OR user_name = 'e2e_2fa_reset';
DELETE FROM dtb_member WHERE id = 900000907 AND login_id = 'e2e_2fa_reset';
SELECT seed_resync('dtb_login_history', 'id', 0);
SELECT seed_resync('dtb_member', 'id', 0);
COMMIT;
