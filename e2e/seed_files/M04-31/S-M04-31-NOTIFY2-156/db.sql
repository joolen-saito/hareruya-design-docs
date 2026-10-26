-- S-M04-31-NOTIFY2-156（同一商品に入荷通知依頼を持つ会員2人）
-- 流す時点: 投入方法の「棚卸計画「M0431-156-A」の棚卸計画編集の一覧で、M0431156P1の商品コードのリンクを…」を終えたあと、次の「やり直しのときに棚卸名が「M0431-156-」で始まる棚卸計画が残っている場合…」より前。手順書（S-M04-31-NOTIFY2-156.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚卸計画の作成日（2026/10/10）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-156-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-156-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-156-A';

-- [2] 文（投入方法）: 会員2件（m0431-156-a@example.test・m0431-156-b@example.test）と、それぞれの入荷通知依頼（通知待ち）は、記載の状態を画面で作れると確かめられていないためDBへ直接登録する。
--     備考: m0431-156-a@example.test: 本会員（利用可能）(顧客状態 2)・依頼の対象は商品コード M0431156P1・通知待ち1件
--     備考: m0431-156-b@example.test: 本会員（利用可能）(顧客状態 2)・依頼の対象は商品コード M0431156P1・通知待ち1件
--     備考: 会員の氏名・パスワードは文に無いので、ログインできない仮の値にした。同じ会員・規格の依頼は先に消してから作り直す（ほかの会員・規格の依頼は消さない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M0431156P1') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0431156P1が1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO dtb_customer (customer_status_id, name01, name02, email, password, secret_key, create_date, update_date) SELECT 2, '試験', '会員', 'm0431-156-a@example.test', 'NO-LOGIN', md5('m0431-156-a@example.test'), now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_customer WHERE email = 'm0431-156-a@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_customer WHERE email = 'm0431-156-a@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス m0431-156-a@example.test)が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_customer SET customer_status_id = 2 WHERE email = 'm0431-156-a@example.test';
INSERT INTO dtb_player (customer_id, email, create_date, update_date) SELECT (SELECT id FROM dtb_customer WHERE email = 'm0431-156-a@example.test'), 'm0431-156-a@example.test', now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_player WHERE email = 'm0431-156-a@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_player WHERE email = 'm0431-156-a@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス m0431-156-a@example.test)のプレイヤーが1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_product_request WHERE player_id = (SELECT id FROM dtb_player WHERE email = 'm0431-156-a@example.test') AND product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0431156P1');
INSERT INTO dtb_product_request (product_class_id, product_id, language_id, player_id, create_date, deleted_at) SELECT c.id, c.product_id, c.language_id, (SELECT id FROM dtb_player WHERE email = 'm0431-156-a@example.test'), now(), NULL FROM dtb_product_class c, generate_series(1, 1) AS g WHERE c.product_code = 'M0431156P1';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M0431156P1') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードM0431156P1が1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO dtb_customer (customer_status_id, name01, name02, email, password, secret_key, create_date, update_date) SELECT 2, '試験', '会員', 'm0431-156-b@example.test', 'NO-LOGIN', md5('m0431-156-b@example.test'), now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_customer WHERE email = 'm0431-156-b@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_customer WHERE email = 'm0431-156-b@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス m0431-156-b@example.test)が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_customer SET customer_status_id = 2 WHERE email = 'm0431-156-b@example.test';
INSERT INTO dtb_player (customer_id, email, create_date, update_date) SELECT (SELECT id FROM dtb_customer WHERE email = 'm0431-156-b@example.test'), 'm0431-156-b@example.test', now(), now() WHERE NOT EXISTS (SELECT 1 FROM dtb_player WHERE email = 'm0431-156-b@example.test');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_player WHERE email = 'm0431-156-b@example.test') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '会員(メールアドレス m0431-156-b@example.test)のプレイヤーが1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_product_request WHERE player_id = (SELECT id FROM dtb_player WHERE email = 'm0431-156-b@example.test') AND product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0431156P1');
INSERT INTO dtb_product_request (product_class_id, product_id, language_id, player_id, create_date, deleted_at) SELECT c.id, c.product_id, c.language_id, (SELECT id FROM dtb_player WHERE email = 'm0431-156-b@example.test'), now(), NULL FROM dtb_product_class c, generate_series(1, 1) AS g WHERE c.product_code = 'M0431156P1';

COMMIT;
