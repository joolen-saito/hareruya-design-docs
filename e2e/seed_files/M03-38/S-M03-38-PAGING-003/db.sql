-- S-M03-38-PAGING-003（ページ遷移確認履歴(003)）
-- 流す時点: 投入方法の最初（画面の操作より前）。手順書（S-M03-38-PAGING-003.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: DBシードで商品公開CSV履歴を0件にしてから11件を登録する
--     備考: 取込種別「商品公開変更CSV（番号14）」の履歴 11 件（番号 338003001〜）を作る
--     備考: 日時は日本時間(+09)で、2026-08-03 10:01:00 から1分ずつ新しくなる
--     備考: 作業者は管理者の名前「M03-38試験管理者」で引く（1件に決まることを確かめる）
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「商品公開変更CSV（番号14）」のほかの取込履歴は1件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE name = 'M03-38試験管理者') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '作業者の管理者「M03-38試験管理者」が1件に決まらない（%件）', n; END IF; END $$;
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id BETWEEN 338003001 AND 338003011 OR (csv_import_type_id = 14 AND file_name ~ '^m03\-38\-page\-[0-9]{2}\-003\.csv$'));
DELETE FROM dtb_csv_import_history WHERE id BETWEEN 338003001 AND 338003011 OR (csv_import_type_id = 14 AND file_name ~ '^m03\-38\-page\-[0-9]{2}\-003\.csv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT 338003001 + g, 14, (SELECT id FROM dtb_member WHERE name = 'M03-38試験管理者'), 'm03-38-page-' || lpad((1 + g)::text, 2, '0') || '-003.csv', (ARRAY[TIMESTAMPTZ '2026-08-03 10:01:00+09',TIMESTAMPTZ '2026-08-03 10:02:00+09',TIMESTAMPTZ '2026-08-03 10:03:00+09',TIMESTAMPTZ '2026-08-03 10:04:00+09',TIMESTAMPTZ '2026-08-03 10:05:00+09',TIMESTAMPTZ '2026-08-03 10:06:00+09',TIMESTAMPTZ '2026-08-03 10:07:00+09',TIMESTAMPTZ '2026-08-03 10:08:00+09',TIMESTAMPTZ '2026-08-03 10:09:00+09',TIMESTAMPTZ '2026-08-03 10:10:00+09',TIMESTAMPTZ '2026-08-03 10:11:00+09'])[g + 1] FROM generate_series(0, 10) AS g;

COMMIT;
