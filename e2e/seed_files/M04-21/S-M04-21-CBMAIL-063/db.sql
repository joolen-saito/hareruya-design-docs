-- S-M04-21-CBMAIL-063（入荷通知判定データ(063)）
-- 流す時点: 投入方法の「在庫変更CSV登録画面の在庫変更CSV登録履歴に、同じファイル名の行が無いことを確かめる。」を終えたあと、次の「試験用メール受信環境でcbm0421-063@example.test宛の受信メ…」より前。手順書（S-M04-21-CBMAIL-063.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 本会員（利用可能）のメールアドレスcbm0421-063@example.testの会員と、M0421-CB063-Aの商品規格に対する入荷通知依頼（通知待ち）は、記載の状態を画面で作れると確かめられていないためDBへ直接登録する。
--     備考: cbm0421-063@example.test: 本会員（利用可能）(顧客状態 2)・依頼の対象は商品コード M0421-CB063-A・通知待ち1件
--     備考: 会員の氏名・パスワードは文に無いので、ログインできない仮の値にした。同じ会員・規格の依頼は先に消してから作り直す（ほかの会員・規格の依頼は消さない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M0421-CB063-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0421-CB063-Aが1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO dtb_customer (customer_status_id, name01, name02, email, password, secret_key, create_date, update_date) SELECT 2, '試験', '会員', 'cbm0421-063@example.test', 'NO-LOGIN', md5('cbm0421-063@example.test'), now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_customer WHERE email = 'cbm0421-063@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_customer WHERE email = 'cbm0421-063@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス cbm0421-063@example.test)が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_customer SET customer_status_id = 2 WHERE email = 'cbm0421-063@example.test';
INSERT INTO dtb_player (customer_id, email, create_date, update_date) SELECT (SELECT id FROM dtb_customer WHERE email = 'cbm0421-063@example.test'), 'cbm0421-063@example.test', now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_player WHERE email = 'cbm0421-063@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_player WHERE email = 'cbm0421-063@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス cbm0421-063@example.test)のプレイヤーが1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_product_request WHERE player_id = (SELECT id FROM dtb_player WHERE email = 'cbm0421-063@example.test') AND product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0421-CB063-A');
INSERT INTO dtb_product_request (product_class_id, product_id, language_id, player_id, create_date, deleted_at) SELECT c.id, c.product_id, c.language_id, (SELECT id FROM dtb_player WHERE email = 'cbm0421-063@example.test'), now(), NULL FROM dtb_product_class c, generate_series(1, 1) AS g WHERE c.product_code = 'M0421-CB063-A';

COMMIT;
