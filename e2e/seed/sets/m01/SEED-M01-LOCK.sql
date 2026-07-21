-- SEED-M01-LOCK : 試行制限系の専用管理者データ。
-- 実際のロック状態は Symfony RateLimiter の保存先(Redis/cache)に依存するため、
-- このSQLは専用IDの準備と履歴初期化のみ行う。ロック状態はspec/setupで連続失敗を発生させる。
BEGIN;

INSERT INTO dtb_member (id, department_id, default_search_base_info_id, work_id, authority_id,
                        creator_id, base_info_id, name, email, is_auto_logout, login_id,
                        password, salt, sort_no, two_factor_auth_key, two_factor_auth_enabled,
                        create_date, update_date, login_date, smaregi_member_flg)
VALUES (900000905, 1, NULL, 1, 1,
        NULL, 2, 'E2E M01 Lock', 'e2e-m01-lock@example.test', false, 'e2e_lock',
        '$2y$13$g1bx.6zJQ7x/YaX6griJRu7Nqkz/gusAp49cJcL2gasuARDMhrjQa',
        NULL, 905, NULL, false, now(), now(), NULL, false)
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
  sort_no = 905,
  two_factor_auth_key = NULL,
  two_factor_auth_enabled = false,
  update_date = now(),
  smaregi_member_flg = false;

DELETE FROM dtb_login_history WHERE member_id = 900000905 OR user_name = 'e2e_lock';

SELECT seed_resync('dtb_member', 'id', 900000999);
SELECT seed_resync('dtb_login_history', 'id', 900000999);
COMMIT;
