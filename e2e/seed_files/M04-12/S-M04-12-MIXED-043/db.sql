-- S-M04-12-MIXED-043（分割と結合の混在一覧データ(043)）
-- 流す時点: 投入方法の「在庫結合の編集画面で結合元商品登録ボタンを押し、商品検索モーダルで商品コードM0412-043-JS…」を終えたあと、次の「各参照商品の在庫数は分割・結合の登録や承認で画面が自動で増減させ、登録後の値を画…」より前。手順書（S-M04-12-MIXED-043.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: （DBへ直接設定する部分）登録日は画面では現在日時になり指定できないため、〔在庫分割結合ID-M0412-043A〕の登録日2026/08/22 10:00、〔在庫分割結合ID-M0412-043B〕の登録日2026/08/22 09:00をDBへ直接設定する。
--     備考: 登録日だけを変える。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-043A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-043A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET create_date = TIMESTAMPTZ '2026-08-22 10:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-043A〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-043B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-043B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET create_date = TIMESTAMPTZ '2026-08-22 09:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-043B〕;

COMMIT;
