-- S-M03-35-CASE-003（正常取込・履歴確認データ(003)）
-- 流す時点: 画面で登録する前に流す（やり直しのときの後始末。前回の残りだけを消す。登録のあとに流すと、作った行まで消えるので流さない）。手順書（S-M03-35-CASE-003.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 「m0335_normal-003.csv」と同名の部門更新取込履歴が残っているときは、取込履歴を消す画面が無く0件を画面で指定できないためDBへ直接設定する（該当の履歴を削除する）
--     備考: 文に書かれたファイル名（m0335_normal-003.csv）の取込履歴だけを消す（取込種別「部門更新CSV（番号11）」に限る）。同名の履歴が無ければ何も消えない。履歴に紐づくスマレジ連携ジョブの対応記録は先に消す
--     備考: 消す前後で件数を確かめない（前回の残りが無ければ0件で正しい）。ファイル名はシード表の文の語「m0335_normal-003.csv」をそのまま使う
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE file_name = 'm0335_normal-003.csv' AND csv_import_type_id = 11);
DELETE FROM dtb_csv_import_history WHERE file_name = 'm0335_normal-003.csv' AND csv_import_type_id = 11;

COMMIT;
