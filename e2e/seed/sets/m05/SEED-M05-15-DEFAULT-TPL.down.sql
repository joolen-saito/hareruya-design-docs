-- 撤去: SEED-M05-15-DEFAULT-TPL
BEGIN;
DELETE FROM dtb_mail_template WHERE id = 900000602;
SELECT seed_resync('dtb_mail_template', 'id', 0);
COMMIT;
