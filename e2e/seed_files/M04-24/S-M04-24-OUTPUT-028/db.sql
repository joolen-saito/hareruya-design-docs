-- S-M04-24-OUTPUT-028（送り状CSV出力データ028）
-- 流す時点: 投入方法の「在庫移動・振替検索一覧画面で〔移動ID-M0424-028〕の行に表示された移動指示IDを控える（〔…」を終えたあと、次の「送料・送料税抜・手数料・手数料税抜の0、郵便種別の0、発送方法のゆうパックは送り…」より前。手順書（S-M04-24-OUTPUT-028.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 基準価格合計3000は画面で指定できないためDBへ直接設定する。
--     備考: 基準価格合計だけを設定する
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_stock_move_instruction WHERE id = 〔移動指示ID-M0424-028〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔移動指示ID-M0424-028〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_stock_move_instruction SET standard_total_price = 3000 WHERE id = 〔移動指示ID-M0424-028〕;

COMMIT;
