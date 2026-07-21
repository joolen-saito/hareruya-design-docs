-- SEED-M01-CUSTOMER : 一般フロント会員は管理保護画面を利用できない確認用。
-- 対象: dtb_customer(id=900000904)。平文パスワードは "password"。
BEGIN;

INSERT INTO dtb_customer (id, customer_status_id, country_id, pref_id,
                          name01, name02, kana01, kana02, postal_code, addr01, addr02,
                          email, password, salt, secret_key, point, create_date, update_date,
                          tel01, tel02, tel03, del_flg)
VALUES (900000904, 2, 392, 13,
        'E2E管理不可', '会員', 'イーツーイーカンリフカ', 'カイイン',
        '1000001', '東京都千代田区', 'E2Eビル2F',
        'e2e-m01-customer@example.test',
        '$2y$10$IUU2BnAX5eNJvx5FnALXIuLAT//wMJWBW2Kl0wi/K0KLl6f89UnUO',
        NULL, 'e2e_m01_customer_secret_key_904', 0, now(), now(),
        '03', '0000', '0904', 0)
ON CONFLICT (id) DO UPDATE SET
  customer_status_id = 2,
  country_id = 392,
  pref_id = 13,
  name01 = EXCLUDED.name01,
  name02 = EXCLUDED.name02,
  kana01 = EXCLUDED.kana01,
  kana02 = EXCLUDED.kana02,
  postal_code = EXCLUDED.postal_code,
  addr01 = EXCLUDED.addr01,
  addr02 = EXCLUDED.addr02,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  salt = NULL,
  secret_key = EXCLUDED.secret_key,
  point = 0,
  update_date = now(),
  tel01 = EXCLUDED.tel01,
  tel02 = EXCLUDED.tel02,
  tel03 = EXCLUDED.tel03,
  del_flg = 0;

SELECT seed_resync('dtb_customer', 'id', 900000999);
COMMIT;
