-- S-M04-30-CBORDC-010（出力順を決める段が色の並び順のとき(CB010)）
-- 流す時点: 投入方法の「その在庫編集画面で在庫変動区分に入庫の区分を選び、在庫変動理由に任意の文言、在庫増減数に「1」を入れ…」を終えたあと、次の「カード新規登録画面でカード名(英)に「M0430-CB010-B」、点数で見たマ…」より前。手順書（S-M04-30-CBORDC-010.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: スマレジ商品IDは画面で指定できないためDBへ直接設定する（「M0430-CB010-A」）。
--     備考: スマレジ商品IDの値は文の「M0430-CB010-A」
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M0430-CB010-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「M0430-CB010-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0430-CB010-A')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードM0430-CB010-A）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_id = 'M0430-CB010-A' WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0430-CB010-A');

-- [2] 文（投入方法）: スマレジ商品コードは画面で指定できないためDBへ直接設定する（「710430」）。
--     備考: スマレジ商品コードの値は文の「710430」
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'M0430-CB010-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「M0430-CB010-A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0430-CB010-A')) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードM0430-CB010-A）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_code = '710430' WHERE id = (SELECT id FROM dtb_product_class WHERE product_code = 'M0430-CB010-A');

-- [3] 文（投入方法）: 価格変更日時は画面で指定できないためDBへ直接設定する（商品規格の登録時に作られた価格変更履歴1件を「2026-09-01 12:00:00」にし、その価格変更履歴IDを控える。〔価格変更履歴ID-M0430-CB010-A〕）。
--     備考: 履歴の呼び名 〔価格変更履歴ID-M0430-CB010-A〕 の番号は、このSQLを流したあとで画面から控える(流す前は決まらない)。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0430-CB010-A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔価格変更履歴ID-M0430-CB010-A〕 の価格履歴が1件に決まらない(登録時にできた1件だけのはず)（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-CB010-A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0430-CB010-A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-09-01 12:00:00+09' WHERE product_class_id = 〔商品規格ID-M0430-CB010-A〕;

COMMIT;
