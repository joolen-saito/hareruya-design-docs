-- SEED-F06-CUSTOMER : 会員情報変更(f06-18)等で使う「既存の有効会員」1件。
--   登録(f06-01)の正常系は毎回ユニークemailを合成して使う（このシードは使わない）ため、
--   ここは「編集・変更・退会前提」の参照会員を固定IDで用意する。
--   ログインが必要な front テストは ECCUBE_FRONT_USER/PASS を使う（本シードのemail/パスワードを環境変数に合わせる運用）。
-- 対象: dtb_customer(id=900000101)。del_flg=0(有効)、customer_status_id=2(本会員)。
-- 使用E2EケースID: f06-18 の会員情報変更・表示系（要ログイン会員）
BEGIN;
INSERT INTO dtb_customer (id, name01, name02, kana01, kana02, email, password, salt, secret_key,
                          postal_code, addr01, addr02, tel01, tel02, tel03,
                          point, del_flg, customer_status_id, create_date, update_date)
VALUES (900000101, 'E2E会員', '花子', 'イーツーイーカイイン', 'ハナコ',
        'e2e-f06-member@example.test',
        -- password は実bcryptハッシュ（平文 "password"）。security.yaml の Customer hasher は algorithm:auto で
        -- bcrypt($2y$)を検証可能。salt は null（近代ハッシャはハッシュ内に埋め込む）。
        -- front ログインは ECCUBE_FRONT_USER=e2e-f06-member@example.test / ECCUBE_FRONT_PASS=password を使う。
        '$2y$10$IUU2BnAX5eNJvx5FnALXIuLAT//wMJWBW2Kl0wi/K0KLl6f89UnUO', NULL, 'e2e_seed_secret_key_101',
        '1000001', '東京都千代田区', 'E2Eビル1F', '03', '0000', '0001',
        0, 0, 2, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name01 = EXCLUDED.name01, name02 = EXCLUDED.name02,
  email = EXCLUDED.email, password = EXCLUDED.password, secret_key = EXCLUDED.secret_key,
  del_flg = 0, customer_status_id = 2, update_date = now();
SELECT seed_resync('dtb_customer', 'id', 900000999);
COMMIT;
