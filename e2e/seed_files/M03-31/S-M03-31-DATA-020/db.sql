-- S-M03-31-DATA-020（成功時取込履歴データ）
-- 流す時点: 投入方法の「その商品規格登録編集画面で、セールフラグにチェックを入れ、販売価格に1500を入れ、部門が未選択なら…」を終えたあと、次の「状態・属性に書いた値（番号は控えた番号）で history-success-02…」より前。手順書（S-M03-31-DATA-020.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: ファイル名 history-success-020.csv のセール用価格変更CSV取込履歴0件は画面で指定できないためDBへ直接設定する（該当の履歴があれば削除する）。
--     備考: 文に書かれたファイル名（history-success-020.csv）の取込履歴だけを消す（取込種別「セール用価格変更CSV（番号6。マスタの名前は「価格変更登録」）」に限る）。同名の履歴が無ければ何も消えない。履歴に紐づくスマレジ連携ジョブの対応記録は先に消す
--     備考: 消す前後で件数を確かめない（前回の残りが無ければ0件で正しい）。ファイル名はシード表の文の語「history-success-020.csv」をそのまま使う
--     備考: 取込種別の番号は画面(コントローラ)が使う定数で決めた。マスタの名前は番号5〜8で画面と食い違う（5=基準価格変更CSVの画面が使うがマスタの名前は「セール用価格変更登録」、6=セール用価格変更CSV／「価格変更登録」、7=高額商品価格変更CSV／「セール用高額商品価格変更登録」、8=セール用高額商品価格変更CSV／「高額商品価格変更登録」）。設計と実装の差の候補として記録した
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE file_name = 'history-success-020.csv' AND csv_import_type_id = 6);
DELETE FROM dtb_csv_import_history WHERE file_name = 'history-success-020.csv' AND csv_import_type_id = 6;

COMMIT;
