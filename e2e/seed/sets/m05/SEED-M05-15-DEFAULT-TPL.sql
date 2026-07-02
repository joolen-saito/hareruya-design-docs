-- SEED-M05-15-DEFAULT-TPL : file_name が空のテンプレ（既定の受注メールテンプレで本文描画させる）。
-- 対象: dtb_mail_template / base_info_id=2。file_name='' が判定条件。
-- 使用E2EケースID: 011（手動・file_name空→既定テンプレで描画）
BEGIN;
INSERT INTO dtb_mail_template (id, base_info_id, mail_key, name, file_name, mail_subject, create_date, update_date, deletable, is_auto_send)
VALUES (900000602, 2, 'e2e_seed_default_tpl', 'E2E既定テンプレ(file_name空)', '', '【E2E】既定テンプレ', now(), now(), true, false)
ON CONFLICT (id) DO UPDATE SET
  base_info_id = EXCLUDED.base_info_id,
  mail_key     = EXCLUDED.mail_key,
  name         = EXCLUDED.name,
  file_name    = '',
  mail_subject = EXCLUDED.mail_subject,
  deletable    = true,
  update_date  = now();
SELECT seed_resync('dtb_mail_template', 'id', 900000999);
COMMIT;
