-- S-M03-22-BASE-008（最大文字数更新対象(008)）
-- 流す時点: 投入方法の「登録後に開いた編集状態の画面のアドレス末尾に表示された購入グループIDを控える（〔購入グループID-…」を終えたあと。手順書（S-M03-22-BASE-008.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 作成日時・更新日時（2026-01-01 00:00:00）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_sell_group WHERE id = 〔購入グループID-M0322-008〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔購入グループID-M0322-008〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE mtb_sell_group SET create_date = TIMESTAMPTZ '2026-01-01 00:00:00+09', update_date = TIMESTAMPTZ '2026-01-01 00:00:00+09' WHERE id = 〔購入グループID-M0322-008〕;

COMMIT;
