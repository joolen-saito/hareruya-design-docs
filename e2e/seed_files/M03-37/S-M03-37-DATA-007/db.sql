-- S-M03-37-DATA-007（ページング履歴(007)）
-- 流す時点: 投入方法の最初（画面の操作より前）。手順書（S-M03-37-DATA-007.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 略称タグ更新CSVの既存履歴を削除し、DBシードで指定ID・ファイル名・日時の12001件を登録する
--     備考: 取込種別「略称タグ更新（番号12）」の履歴 12001 件（番号は表の連番）を作る
--     備考: 日時の値は文に無い（「番号順に1分ずつ昇順」「全件異なる」とだけ書く）ので、2026-08-01 00:00（日本時間）から番号順に1分ずつにした（文に無い値）
--     備考: 取込種別「略称タグ更新（番号12）」の取込履歴は、アプリのどの画面も書かず、一覧にも出さない（この番号を使うコントローラが無い。略称タグCSVの画面 csv_product_storage_code.twig に取込履歴の一覧が無く、取込でも履歴を書かない）。このSQLで入れた履歴は画面に出ない。設計と実装の差の候補として記録した
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 状態・属性の履歴の番号（33700700001〜）は、現行のDBの取込履歴の番号の型（integer、上限2147483647）を超えるため、その番号では作れない（番号の型の上限を超える。設計と実装の差の候補）。番号は表の連番にした
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「略称タグ更新（番号12）」のほかの取込履歴は0件なので、消す操作は要らない（全件削除のため SQL は用意していない。ほかのケースなどで増えていれば、その行を消す必要がある）
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE (csv_import_type_id = 12 AND file_name ~ '^m0337_history_[0-9]{5}\-007\.csv$'));
DELETE FROM dtb_csv_import_history WHERE (csv_import_type_id = 12 AND file_name ~ '^m0337_history_[0-9]{5}\-007\.csv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT nextval(pg_get_serial_sequence('dtb_csv_import_history', 'id')), 12, NULL, 'm0337_history_' || lpad((1 + g)::text, 5, '0') || '-007.csv', TIMESTAMPTZ '2026-08-01 00:00:00+09' + g * interval '60 seconds' FROM generate_series(0, 12000) AS g;

COMMIT;
