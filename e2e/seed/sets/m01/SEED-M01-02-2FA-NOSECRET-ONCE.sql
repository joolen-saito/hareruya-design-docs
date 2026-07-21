-- SEED-M01-02-2FA-NOSECRET-ONCE : 初回設定成功で秘密鍵が確定する使い捨て管理者。
-- 対象: dtb_member(id=900000909, login_id=e2e_2fa_nosecret_once)。平文パスワードは "password"。
BEGIN;

INSERT INTO dtb_member (id, department_id, default_search_base_info_id, work_id, authority_id,
                        creator_id, base_info_id, name, email, is_auto_logout, login_id,
                        password, salt, sort_no, two_factor_auth_key, two_factor_auth_enabled,
                        create_date, update_date, login_date, smaregi_member_flg)
VALUES (900000909, 1, NULL, 1, 1,
        NULL, 2, 'E2E M01-02 2FA No Secret Once', 'e2e-m01-02-2fa-nosecret-once@example.test', false, 'e2e_2fa_nosecret_once',
        '$2y$13$g1bx.6zJQ7x/YaX6griJRu7Nqkz/gusAp49cJcL2gasuARDMhrjQa',
        NULL, 909, NULL, true, now(), now(), NULL, false)
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
  sort_no = 909,
  two_factor_auth_key = NULL,
  two_factor_auth_enabled = true,
  update_date = now(),
  login_date = NULL,
  smaregi_member_flg = false;

SELECT seed_resync('dtb_member', 'id', 900000999);
COMMIT;
