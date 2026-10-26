-- S-M04-25-DISPLAY-001（詳細遷移データ001）
-- 流す時点: 投入方法の「⑨在庫移動指示IDを押して在庫移動指示詳細画面を開き、備考に「表示確認メモ」を入れて登録ボタンを押す…」を終えたあと。手順書（S-M04-25-DISPLAY-001.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: ⑩在庫移動指示の登録日2026/09/01と更新日2026/09/02は画面で指定できないためDBへ直接設定する。
--     備考: 在庫移動指示の登録日と更新日。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_move_instruction WHERE id = 〔在庫移動指示ID-M0425-001〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔在庫移動指示ID-M0425-001〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_move_instruction SET create_date = TIMESTAMPTZ '2026-09-01 00:00:00+09', update_date = TIMESTAMPTZ '2026-09-02 00:00:00+09' WHERE id = 〔在庫移動指示ID-M0425-001〕;

COMMIT;
