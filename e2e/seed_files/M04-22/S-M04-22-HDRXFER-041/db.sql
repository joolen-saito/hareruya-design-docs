-- S-M04-22-HDRXFER-041（振替CSV不正ヘッダー表示確認データ(041)）
-- 流す時点: 投入方法の「UTF-8のCSVファイル「M0422-041-HDR.csv」（ヘッダー「振替元商品コード,振替先…」を終えたあと。手順書（S-M04-22-HDRXFER-041.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 同名CSV取込履歴=0件は画面で指定できない（取込履歴を削除する画面が無い）ためDBへ直接設定する（ファイル名「M0422-041-HDR.csv」の取込履歴を削除する）。
--     備考: 文に書かれたファイル名（M0422-041-HDR.csv）の取込履歴だけを消す（取込種別「在庫振替CSV（番号18）」に限る）。同名の履歴が無ければ何も消えない。履歴に紐づくスマレジ連携ジョブの対応記録は先に消す
--     備考: 消す前後で件数を確かめない（前回の残りが無ければ0件で正しい）。ファイル名はシード表の文の語「M0422-041-HDR.csv」をそのまま使う
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE file_name = 'M0422-041-HDR.csv' AND csv_import_type_id = 18);
DELETE FROM dtb_csv_import_history WHERE file_name = 'M0422-041-HDR.csv' AND csv_import_type_id = 18;

COMMIT;
