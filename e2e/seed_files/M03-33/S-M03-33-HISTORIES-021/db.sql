-- S-M03-33-HISTORIES-021（ページング確認履歴）
-- 流す時点: 投入方法の最初（画面の操作より前）。手順書（S-M03-33-HISTORIES-021.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: DBシードで同じ取込種別の履歴を削除後、指定IDの12件を登録する
--     備考: 取込種別「セール用高額商品価格変更CSV（番号8。マスタの名前は「高額商品価格変更登録」）」の履歴 12 件（番号 332021001〜）を作る
--     備考: 日時は日本時間(+09)で、2026-08-01 10:01:00 から 2026-08-01 10:12:00 まで等間隔（0:01:00 間隔）
--     備考: 作業者の管理者ID=33033 は、管理者シード S-M03-33-ADM が画面で登録する管理者（画面では番号を指定できない）。同じ管理者をログインID m0333_admin で引く
--     備考: 取込種別の番号は画面(コントローラ)が使う定数で決めた。マスタの名前は番号5〜8で画面と食い違う（5=基準価格変更CSVの画面が使うがマスタの名前は「セール用価格変更登録」、6=セール用価格変更CSV／「価格変更登録」、7=高額商品価格変更CSV／「セール用高額商品価格変更登録」、8=セール用高額商品価格変更CSV／「高額商品価格変更登録」）。設計と実装の差の候補として記録した
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「セール用高額商品価格変更CSV（番号8。マスタの名前は「高額商品価格変更登録」）」のほかの取込履歴は0件なので、消す操作は要らない（全件削除のため SQL は用意していない。ほかのケースなどで増えていれば、その行を消す必要がある）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE login_id = 'm0333_admin') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '作業者の管理者（ログインID m0333_admin）が1件に決まらない（%件）', n; END IF; END $$;
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id BETWEEN 332021001 AND 332021012 OR (csv_import_type_id = 8 AND file_name IN ('M0333-H01-021.csv','M0333-H02-021.csv','M0333-H03-021.csv','M0333-H04-021.csv','M0333-H05-021.csv','M0333-H06-021.csv','M0333-H07-021.csv','M0333-H08-021.csv','M0333-H09-021.csv','M0333-H10-021.csv','M0333-H11-021.csv','M0333-H12-021.csv')));
DELETE FROM dtb_csv_import_history WHERE id BETWEEN 332021001 AND 332021012 OR (csv_import_type_id = 8 AND file_name IN ('M0333-H01-021.csv','M0333-H02-021.csv','M0333-H03-021.csv','M0333-H04-021.csv','M0333-H05-021.csv','M0333-H06-021.csv','M0333-H07-021.csv','M0333-H08-021.csv','M0333-H09-021.csv','M0333-H10-021.csv','M0333-H11-021.csv','M0333-H12-021.csv'));
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT 332021001 + g, 8, (SELECT id FROM dtb_member WHERE login_id = 'm0333_admin'), (ARRAY['M0333-H01-021.csv','M0333-H02-021.csv','M0333-H03-021.csv','M0333-H04-021.csv','M0333-H05-021.csv','M0333-H06-021.csv','M0333-H07-021.csv','M0333-H08-021.csv','M0333-H09-021.csv','M0333-H10-021.csv','M0333-H11-021.csv','M0333-H12-021.csv'])[g + 1], (ARRAY[TIMESTAMPTZ '2026-08-01 10:01:00+09',TIMESTAMPTZ '2026-08-01 10:02:00+09',TIMESTAMPTZ '2026-08-01 10:03:00+09',TIMESTAMPTZ '2026-08-01 10:04:00+09',TIMESTAMPTZ '2026-08-01 10:05:00+09',TIMESTAMPTZ '2026-08-01 10:06:00+09',TIMESTAMPTZ '2026-08-01 10:07:00+09',TIMESTAMPTZ '2026-08-01 10:08:00+09',TIMESTAMPTZ '2026-08-01 10:09:00+09',TIMESTAMPTZ '2026-08-01 10:10:00+09',TIMESTAMPTZ '2026-08-01 10:11:00+09',TIMESTAMPTZ '2026-08-01 10:12:00+09'])[g + 1] FROM generate_series(0, 11) AS g;

COMMIT;
