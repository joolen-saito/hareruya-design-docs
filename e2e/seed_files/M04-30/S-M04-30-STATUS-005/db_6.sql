-- S-M04-30-STATUS-005（ステータス抽出データ(005)）
-- 流す時点: 投入方法の「その在庫編集画面で在庫変動区分に入庫の区分を選び、在庫変動理由に任意の文言、在庫増減数に「1」を入れ…」を終えたあと、次の「「STAT-CLASS-RETIRED-005」は、グッズ商品CSV登録で雛形フ…」より前。手順書（S-M04-30-STATUS-005.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [6] 文（投入方法）: スマレジ商品IDは画面で指定できないためDBへ直接設定する（「STAT-PRODUCT-RETIRED-005」）。
--     備考: スマレジ商品IDの値は文の「STAT-PRODUCT-RETIRED-005」
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-005C〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0430-005C〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_id = 'STAT-PRODUCT-RETIRED-005' WHERE id = 〔商品規格ID-M0430-005C〕;

-- [7] 文（投入方法）: 価格変更日時は画面で指定できないためDBへ直接設定する（商品規格の登録時に作られた価格変更履歴1件を「2026-08-13 12:00:00」にし、その価格変更履歴IDを控える。〔価格変更履歴ID-M0430-005C〕）。
--     備考: 履歴の呼び名 〔価格変更履歴ID-M0430-005C〕 の番号は、このSQLを流したあとで画面から控える(流す前は決まらない)。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0430-005C〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔価格変更履歴ID-M0430-005C〕 の価格履歴が1件に決まらない(登録時にできた1件だけのはず)（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-005C〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0430-005C〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-08-13 12:00:00+09' WHERE product_class_id = 〔商品規格ID-M0430-005C〕;

-- [8] 文（投入方法）: 在庫を持ったままの廃止は画面で指定できないためDBへ直接設定する（商品の公開状態を廃止にする。商品規格は公開のまま）。
--     備考: 公開状態の値: 公開=1・非公開=2・廃止=3（アプリの定義）。商品の状態だけを変える
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-005C〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0430-005C〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product WHERE id = (SELECT product_id FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-005C〕)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品（〔商品規格ID-M0430-005C〕）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product SET product_status_id = 3 WHERE id = (SELECT product_id FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-005C〕);

COMMIT;
