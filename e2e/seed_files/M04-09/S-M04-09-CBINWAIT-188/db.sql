-- S-M04-09-CBINWAIT-188（入庫承認待ちの在庫移動（店舗間・入荷通知あり））
-- 流す時点: 投入方法の「m0409cbtcap（申請した本人は承認できない）でログインし、在庫編集承認一覧画面でこれらの申請…」を終えたあと、次の「【在庫移動の登録】M04-09入庫担当者でログインし、在庫検索一覧画面でM040…」より前。手順書（S-M04-09-CBINWAIT-188.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 【会員と入荷通知依頼】仮会員（本会員でない）のメールアドレスcbm0409-188-a@example.testの会員と、商品M0409-CB188-Aの規格に対するその会員の入荷通知依頼（通知済み（通知待ちではない））1件は、記載の状態を画面で作れると確かめられていないためDBへ直接登録する。
--     備考: cbm0409-188-a@example.test: 仮会員(顧客状態 1)・依頼の対象は商品コード M0409-CB188-A・通知済み1件
--     備考: 会員の氏名・パスワードは文に無いので、ログインできない仮の値にした。同じ会員・規格の依頼は先に消してから作り直す（ほかの会員・規格の依頼は消さない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M0409-CB188-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0409-CB188-Aが1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO dtb_customer (customer_status_id, name01, name02, email, password, secret_key, create_date, update_date) SELECT 1, '試験', '会員', 'cbm0409-188-a@example.test', 'NO-LOGIN', md5('cbm0409-188-a@example.test'), now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_customer WHERE email = 'cbm0409-188-a@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_customer WHERE email = 'cbm0409-188-a@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス cbm0409-188-a@example.test)が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_customer SET customer_status_id = 1 WHERE email = 'cbm0409-188-a@example.test';
INSERT INTO dtb_player (customer_id, email, create_date, update_date) SELECT (SELECT id FROM dtb_customer WHERE email = 'cbm0409-188-a@example.test'), 'cbm0409-188-a@example.test', now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_player WHERE email = 'cbm0409-188-a@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_player WHERE email = 'cbm0409-188-a@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス cbm0409-188-a@example.test)のプレイヤーが1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_product_request WHERE player_id = (SELECT id FROM dtb_player WHERE email = 'cbm0409-188-a@example.test') AND product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0409-CB188-A');
INSERT INTO dtb_product_request (product_class_id, product_id, language_id, player_id, create_date, deleted_at) SELECT c.id, c.product_id, c.language_id, (SELECT id FROM dtb_player WHERE email = 'cbm0409-188-a@example.test'), now(), now() FROM dtb_product_class c, generate_series(1, 1) AS g WHERE c.product_code = 'M0409-CB188-A';

COMMIT;
