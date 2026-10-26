-- S-M03-40-HISTORY-002（ページング確認履歴）
-- 流す時点: 投入方法の最初（画面の操作より前）。手順書（S-M03-40-HISTORY-002.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 対象種別の既存履歴を削除し、DBシードで指定ID・ファイル名・取込日時の11件を登録する
--     備考: 取込種別「棚番号更新CSV（番号15）」の履歴 11 件（番号 34000221〜）を作る
--     備考: 日時は日本時間(+09)で、2026-09-01 12:10:00 から1分ずつ古くなる
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「棚番号更新CSV（番号15）」のほかの取込履歴は3件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id BETWEEN 34000221 AND 34000231 OR (csv_import_type_id = 15 AND file_name ~ '^m0340\-page[0-9]{2}\-002\.csv$'));
DELETE FROM dtb_csv_import_history WHERE id BETWEEN 34000221 AND 34000231 OR (csv_import_type_id = 15 AND file_name ~ '^m0340\-page[0-9]{2}\-002\.csv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT 34000221 + g, 15, NULL, 'm0340-page' || lpad((1 + g)::text, 2, '0') || '-002.csv', (ARRAY[TIMESTAMPTZ '2026-09-01 12:10:00+09',TIMESTAMPTZ '2026-09-01 12:09:00+09',TIMESTAMPTZ '2026-09-01 12:08:00+09',TIMESTAMPTZ '2026-09-01 12:07:00+09',TIMESTAMPTZ '2026-09-01 12:06:00+09',TIMESTAMPTZ '2026-09-01 12:05:00+09',TIMESTAMPTZ '2026-09-01 12:04:00+09',TIMESTAMPTZ '2026-09-01 12:03:00+09',TIMESTAMPTZ '2026-09-01 12:02:00+09',TIMESTAMPTZ '2026-09-01 12:01:00+09',TIMESTAMPTZ '2026-09-01 12:00:00+09'])[g + 1] FROM generate_series(0, 10) AS g;

COMMIT;
