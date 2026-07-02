-- SEED-M05-15-TEMPLATE : 受注メール通知(m05-15)で選択可能な「正常テンプレ」1件。
-- 対象: dtb_mail_template  / base_info_id=2（admin=login_id 'admin' が属するテナント）。
-- 既存テンプレは全件 base_info_id=1（mall層）でテナント2には無いため、テナント2に専用テンプレを用意する。
-- 件名(mail_subject)と実在する本文ファイル(file_name)を持つ。E2E-M05-15-010（テンプレ選択で件名/本文読込）で使用。
-- 使用E2EケースID: 010 / 001,002,003,004,020,050（画面上の選択肢として存在）
BEGIN;
INSERT INTO dtb_mail_template (id, base_info_id, mail_key, name, file_name, mail_subject, create_date, update_date, deletable, is_auto_send)
VALUES (900000601, 2, 'e2e_seed_order_mail', 'E2E受注メールテンプレ', 'Mail/order_cvs.twig', '【E2E】ご注文ありがとうございます', now(), now(), true, false)
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
