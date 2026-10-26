-- S-M04-12-BASE（基本検索・一覧データ）
-- 流す時点: 投入方法の「分割承認者でログインし直し、在庫分割の編集画面で分割先商品登録ボタンを押し、商品検索モーダルで分割先…」を終えたあと、次の「各参照商品の在庫数は分割・結合の登録や承認で画面が自動で増減させ、登録後の値を画…」より前。手順書（S-M04-12-BASE.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: （DBへ直接設定する部分）登録日は画面では現在日時になり指定できないため、〔在庫分割結合ID-M0412-共有基本A〕=2026/08/10 10:00、〔在庫分割結合ID-M0412-共有基本B〕=2026/08/09 09:00、〔在庫分割結合ID-M0412-共有基本C〕=2026/08/08
--     備考: 登録日だけを変える。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-共有基本A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-共有基本A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET create_date = TIMESTAMPTZ '2026-08-10 10:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-共有基本A〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-共有基本B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-共有基本B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET create_date = TIMESTAMPTZ '2026-08-09 09:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-共有基本B〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-共有基本C〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-共有基本C〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET create_date = TIMESTAMPTZ '2026-08-08 00:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-共有基本C〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-共有基本D〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-共有基本D〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET create_date = TIMESTAMPTZ '2026-08-07 00:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-共有基本D〕;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-共有基本E〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-共有基本E〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET create_date = TIMESTAMPTZ '2026-08-06 00:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-共有基本E〕;

-- [2] 文（投入方法）: 承認日は画面では承認申請を押した日時になり指定できないため、〔在庫分割結合ID-M0412-共有基本A〕の承認日2026/08/11をDBへ直接設定する。
--     備考: 承認日は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-共有基本A〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-共有基本A〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET move_to_approval_at = TIMESTAMPTZ '2026-08-11 00:00:00+09' WHERE id = 〔在庫分割結合ID-M0412-共有基本A〕;

-- [3] 文（投入方法）: 〔在庫分割結合ID-M0412-共有基本B〕の承認者=結合承認者と承認日2026/08/12は、画面では承認申請を押すと結合承認待ちへ進み、結合元登録のままでは入らないため、DBへ直接設定する。
--     備考: 承認日は日本時間(+09)
--     備考: 承認者は管理者の名前「結合承認者」で引く
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE name = '結合承認者') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '管理者「結合承認者」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_split_join WHERE id = 〔在庫分割結合ID-M0412-共有基本B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫分割結合ID-M0412-共有基本B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_split_join SET move_to_approval_at = TIMESTAMPTZ '2026-08-12 00:00:00+09', move_to_approval_member_id = (SELECT id FROM dtb_member WHERE name = '結合承認者') WHERE id = 〔在庫分割結合ID-M0412-共有基本B〕;

COMMIT;
