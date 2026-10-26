-- S-M04-30-ATTR-004（スマレジ属性抽出データ(004)）
-- 流す時点: 投入方法の「スマレジ商品IDは画面で指定できないためDBへ直接設定する（空欄にする）。」を終えたあと、次の「「ATTR-OFF-004」は、グッズ商品CSV登録で雛形ファイルをダウンロード…」より前。手順書（S-M04-30-ATTR-004.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [4] 文（投入方法）: 価格変更日時は画面で指定できないためDBへ直接設定する（商品規格の登録時に作られた価格変更履歴1件を「2026-08-12 12:00:00」にし、その価格変更履歴IDを控える。〔価格変更履歴ID-M0430-004B〕）。
--     備考: 履歴の呼び名 〔価格変更履歴ID-M0430-004B〕 の番号は、このSQLを流したあとで画面から控える(流す前は決まらない)。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0430-004B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔価格変更履歴ID-M0430-004B〕 の価格履歴が1件に決まらない(登録時にできた1件だけのはず)（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0430-004B〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0430-004B〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_price_history SET create_date = TIMESTAMPTZ '2026-08-12 12:00:00+09' WHERE product_class_id = 〔商品規格ID-M0430-004B〕;

COMMIT;
