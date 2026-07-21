-- SEED-M01-2FA-ON : 2FA有効管理者の追加認証誘導確認用。
-- 対象: dtb_member(id=900000903, login_id=e2e_2fa)。平文パスワードは "password"。
-- two_factor_auth_key はテスト専用の固定base32値。
BEGIN;

INSERT INTO dtb_member (id, department_id, default_search_base_info_id, work_id, authority_id,
                        creator_id, base_info_id, name, email, is_auto_logout, login_id,
                        password, salt, sort_no, two_factor_auth_key, two_factor_auth_enabled,
                        create_date, update_date, login_date, smaregi_member_flg)
VALUES (900000903, 1, NULL, 1, 1,
        NULL, 2, 'E2E M01 2FA', 'e2e-m01-2fa@example.test', false, 'e2e_2fa',
        '$2y$13$g1bx.6zJQ7x/YaX6griJRu7Nqkz/gusAp49cJcL2gasuARDMhrjQa',
        NULL, 903, 'JBSWY3DPEHPK3PXP', true, now(), now(), NULL, false)
ON CONFLICT (id) DO UPDATE SET
  department_id = 1,
  default_search_base_info_id = NULL,
  work_id = 1,
  authority_id = 1,
  creator_id = NULL,
  base_info_id = 2,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  is_auto_logout = false,
  login_id = EXCLUDED.login_id,
  password = EXCLUDED.password,
  salt = NULL,
  sort_no = 903,
  two_factor_auth_key = EXCLUDED.two_factor_auth_key,
  two_factor_auth_enabled = true,
  update_date = now(),
  smaregi_member_flg = false;

SELECT seed_resync('dtb_member', 'id', 900000999);
COMMIT;
