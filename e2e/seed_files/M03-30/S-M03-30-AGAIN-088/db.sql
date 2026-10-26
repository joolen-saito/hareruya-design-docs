-- S-M03-30-AGAIN-088（同じCSVを続けて2回取り込むデータ(088)）
-- 流す時点: 投入方法の「商品マスター画面で商品名(日/英)に「M0330試験商品088」を入れて検索し、該当商品の商品登録編…」を終えたあと、次の「設計の5列を持つUTF-8・タブ区切りファイルを試験端末へ配置する（ファイルの商…」より前。手順書（S-M03-30-AGAIN-088.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 販売価格=900は画面で指定できないためDBへ直接設定する。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-088〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-088〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = 〔商品規格ID-M0330-088〕;

-- [2] 文（投入方法）: 価格履歴=0件は画面で指定できないためDBへ直接設定する（登録時にできた価格履歴を削除する）。
--     備考: この規格の価格履歴だけを消す
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-088〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-088〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = 〔商品規格ID-M0330-088〕;

-- [3] 文（投入方法）: dp-m0330-088.tsvの取込履歴0件は画面で指定できないためDBへ直接設定する（同名の取込履歴を削除する）。
--     備考: 文に書かれたファイル名（dp-m0330-088.tsv）の取込履歴だけを消す（取込種別「基準価格変更CSV（番号5。マスタの名前は「セール用価格変更登録」）」に限る）。同名の履歴が無ければ何も消えない。履歴に紐づくスマレジ連携ジョブの対応記録は先に消す
--     備考: 消す前後で件数を確かめない（前回の残りが無ければ0件で正しい）。ファイル名はシード表の文の語「dp-m0330-088.tsv」をそのまま使う
--     備考: 取込種別の番号は画面(コントローラ)が使う定数で決めた。マスタの名前は番号5〜8で画面と食い違う（5=基準価格変更CSVの画面が使うがマスタの名前は「セール用価格変更登録」、6=セール用価格変更CSV／「価格変更登録」、7=高額商品価格変更CSV／「セール用高額商品価格変更登録」、8=セール用高額商品価格変更CSV／「高額商品価格変更登録」）。設計と実装の差の候補として記録した
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE file_name = 'dp-m0330-088.tsv' AND csv_import_type_id = 5);
DELETE FROM dtb_csv_import_history WHERE file_name = 'dp-m0330-088.tsv' AND csv_import_type_id = 5;

COMMIT;
