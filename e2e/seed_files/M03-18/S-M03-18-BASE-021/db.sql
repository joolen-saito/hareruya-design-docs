-- S-M03-18-BASE-021（部門コード128更新対象(021)）
-- 流す時点: 投入方法の「遷移後の部門一覧で部門名「編集前部門-021」の行のID列に表示された番号を控える（〔部門ID-M0…」を終えたあと、次の「登録時にスマレジへ部門が連携されるため、スマレジ試験環境へ接続できる状態で行う。」より前。手順書（S-M03-18-BASE-021.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: スマレジ連携先部門IDは登録時の連携で自動的に入り、画面で指定できないためDBへ直接設定する（〔部門ID-M0318-021〕の部門のスマレジ連携先部門IDを空にする）。
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_section WHERE id = 〔部門ID-M0318-021〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔部門ID-M0318-021〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE mtb_section SET smaregi_category_id = NULL WHERE id = 〔部門ID-M0318-021〕;

COMMIT;
