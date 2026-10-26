-- S-M03-41-CASE-011（2ページ目確認データ(011)）
-- 流す時点: 投入方法の最初（画面の操作より前）。手順書（S-M03-41-CASE-011.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: ケース開始時にカテゴリCSV種別の既存インポート履歴をDB操作で削除して0件にし、DBシードで記載ID・ファイル名・日時の11件を登録する
--     備考: 取込種別「カテゴリCSV（番号16）」の履歴 11 件（番号 341901101〜）を作る
--     備考: 日時は日本時間(+09)で、2099-11-11 10:11:00 から 2099-11-11 10:01:00 まで等間隔（0:01:00 間隔）
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「カテゴリCSV（番号16）」のほかの取込履歴は3件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id BETWEEN 341901101 AND 341901111 OR (csv_import_type_id = 16 AND file_name ~ '^m0341\-history\-011\-[0-9]{2}\.csv$'));
DELETE FROM dtb_csv_import_history WHERE id BETWEEN 341901101 AND 341901111 OR (csv_import_type_id = 16 AND file_name ~ '^m0341\-history\-011\-[0-9]{2}\.csv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT 341901101 + g, 16, NULL, 'm0341-history-011-' || lpad((1 + g)::text, 2, '0') || '.csv', (ARRAY[TIMESTAMPTZ '2099-11-11 10:11:00+09',TIMESTAMPTZ '2099-11-11 10:10:00+09',TIMESTAMPTZ '2099-11-11 10:09:00+09',TIMESTAMPTZ '2099-11-11 10:08:00+09',TIMESTAMPTZ '2099-11-11 10:07:00+09',TIMESTAMPTZ '2099-11-11 10:06:00+09',TIMESTAMPTZ '2099-11-11 10:05:00+09',TIMESTAMPTZ '2099-11-11 10:04:00+09',TIMESTAMPTZ '2099-11-11 10:03:00+09',TIMESTAMPTZ '2099-11-11 10:02:00+09',TIMESTAMPTZ '2099-11-11 10:01:00+09'])[g + 1] FROM generate_series(0, 10) AS g;

COMMIT;
