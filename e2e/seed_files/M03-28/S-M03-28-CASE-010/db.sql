-- S-M03-28-CASE-010（廃止商品更新データ(010)）
-- 流す時点: 投入方法の「商品タグ更新CSV登録画面のCSVインポート履歴にファイル名discontinued-010.csv…」を終えたあと。手順書（S-M03-28-CASE-010.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 行があるとき、同名取込履歴0件は画面で指定できない（取込履歴を削除する画面が無い）ためDBへ直接設定する
--     備考: 状態・属性に書かれたこのシードの取込ファイル名（discontinued-010.csv）の取込履歴だけを消す（取込種別「商品タグ更新CSV（番号3）」に限る）。同名の履歴が無ければ何も消えない。履歴に紐づくスマレジ連携ジョブの対応記録は先に消す
--     備考: 消す前後で件数を確かめない（前回の残りが無ければ0件で正しい）。ファイル名はシード表の文の語「discontinued-010.csv」をそのまま使う
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE file_name = 'discontinued-010.csv' AND csv_import_type_id = 3);
DELETE FROM dtb_csv_import_history WHERE file_name = 'discontinued-010.csv' AND csv_import_type_id = 3;

COMMIT;
