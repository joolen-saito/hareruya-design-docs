-- SEED-M05-15-MISSING-TPL : file_name が実ファイル未存在のテンプレ（本文読込失敗の再現）。
-- 対象: dtb_mail_template / base_info_id=2。file_name は disk に存在しない twig を指す。
-- 使用E2EケースID: 052(fixme・本文テンプレ読込失敗→エラー表示・本文空)
BEGIN;
INSERT INTO dtb_mail_template (id, base_info_id, mail_key, name, file_name, mail_subject, create_date, update_date, deletable, is_auto_send)
VALUES (900000603, 2, 'e2e_seed_missing_tpl', 'E2E本文欠落テンプレ', 'Mail/__e2e_missing__.twig', '【E2E】本文欠落', now(), now(), true, false)
ON CONFLICT (id) DO UPDATE SET
  base_info_id = EXCLUDED.base_info_id,
  mail_key     = EXCLUDED.mail_key,
  name         = EXCLUDED.name,
  file_name    = EXCLUDED.file_name,
  mail_subject = EXCLUDED.mail_subject,
  deletable    = true,
  update_date  = now();
SELECT seed_resync('dtb_mail_template', 'id', 900000999);
COMMIT;
