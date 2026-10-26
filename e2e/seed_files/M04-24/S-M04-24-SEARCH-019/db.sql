-- S-M04-24-SEARCH-019（一覧全項目表示データ019）
-- 流す時点: 投入方法の「在庫移動・振替検索一覧画面で〔移動ID-M0424-019A〕の行に表示された移動指示IDを控える（…」を終えたあと、次の「基準価格合計3000・移動原価合計2000は画面で指定できないためDBへ直接設定…」より前。手順書（S-M04-24-SEARCH-019.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 登録日2026/01/10・更新日2026/01/15は画面で指定できないためDBへ直接設定する。
--     備考: 在庫移動指示の登録日と更新日。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_move_instruction WHERE id = 〔移動指示ID-M0424-019〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔移動指示ID-M0424-019〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_move_instruction SET create_date = TIMESTAMPTZ '2026-01-10 00:00:00+09', update_date = TIMESTAMPTZ '2026-01-15 00:00:00+09' WHERE id = 〔移動指示ID-M0424-019〕;

COMMIT;
