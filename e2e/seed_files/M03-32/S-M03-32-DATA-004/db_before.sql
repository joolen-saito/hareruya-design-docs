-- S-M03-32-DATA-004（通常商品価格更新データ）
-- 流す時点: 画面で登録する前に流す（やり直しのときの後始末。前回の残りだけを消す。登録のあとに流すと、作った行まで消えるので流さない）。手順書（S-M03-32-DATA-004.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 同名取込履歴0件は、取込履歴を削除する画面が無いため、高額商品価格変更CSVアップロード画面のCSVインポート履歴にファイル名normal-004.csvの行が残っているときはDBへ直接削除して0件にする。
--     備考: 文に書かれたファイル名（normal-004.csv）の取込履歴だけを消す（取込種別「高額商品価格変更CSV（番号7。マスタの名前は「セール用高額商品価格変更登録」）」に限る）。同名の履歴が無ければ何も消えない。履歴に紐づくスマレジ連携ジョブの対応記録は先に消す
--     備考: 消す前後で件数を確かめない（前回の残りが無ければ0件で正しい）。ファイル名はシード表の文の語「normal-004.csv」をそのまま使う
--     備考: 取込種別の番号は画面(コントローラ)が使う定数で決めた。マスタの名前は番号5〜8で画面と食い違う（5=基準価格変更CSVの画面が使うがマスタの名前は「セール用価格変更登録」、6=セール用価格変更CSV／「価格変更登録」、7=高額商品価格変更CSV／「セール用高額商品価格変更登録」、8=セール用高額商品価格変更CSV／「高額商品価格変更登録」）。設計と実装の差の候補として記録した
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE file_name = 'normal-004.csv' AND csv_import_type_id = 7);
DELETE FROM dtb_csv_import_history WHERE file_name = 'normal-004.csv' AND csv_import_type_id = 7;

COMMIT;
