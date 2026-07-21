-- 撤去: SEED-M01-2FA-ON
BEGIN;
DELETE FROM dtb_login_history WHERE member_id = 900000903 OR user_name = 'e2e_2fa';
DELETE FROM dtb_member WHERE id = 900000903 AND login_id = 'e2e_2fa';
SELECT seed_resync('dtb_login_history', 'id', 0);
SELECT seed_resync('dtb_member', 'id', 0);
COMMIT;
