-- S-M04-30-STOCK-003（店舗在庫抽出データ(003)）
-- 流す時点: 投入方法の「在庫検索一覧で商品名「STK-N1-003」・店舗「店舗A」・在庫区分「スマレジ」の在庫を検索して在…」を終えたあと、次の「「STK-OTHER-003」は、グッズ商品CSV登録で雛形ファイルをダウンロー…」より前。手順書（S-M04-30-STOCK-003.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [3] 文（投入方法）: スマレジ商品IDは画面で指定できないためDBへ直接設定する（「STK-N1-003」）。
--     備考: スマレジ商品IDの値は文の「STK-N1-003」
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-003B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0430-003B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_id = 'STK-N1-003' WHERE id = 〔商品規格ID-M0430-003B〕;

-- [4] 文（投入方法）: 価格変更日時は画面で指定できないためDBへ直接設定する（商品規格の登録時に作られた価格変更履歴1件を「2026-08-11 12:00:00」にし、その価格変更履歴IDを控える。〔価格変更履歴ID-M0430-003B〕）。
--     備考: 履歴の呼び名 〔価格変更履歴ID-M0430-003B〕 の番号は、このSQLを流したあとで画面から控える(流す前は決まらない)。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0430-003B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔価格変更履歴ID-M0430-003B〕 の価格履歴が1件に決まらない(登録時にできた1件だけのはず)（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-003B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0430-003B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-08-11 12:00:00+09' WHERE product_class_id = 〔商品規格ID-M0430-003B〕;

-- [5] 文（投入方法）: 在庫数-1は画面で指定できないためDBへ直接設定する（店舗Aの在庫場所スマレジの在庫数を-1にする）。
--     備考: 対象の在庫は、前の文までに控えた最後の在庫の呼び名 〔在庫ID-M0430-003B〕
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = 〔在庫ID-M0430-003B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫ID-M0430-003B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = -1 WHERE id = 〔在庫ID-M0430-003B〕;

COMMIT;
