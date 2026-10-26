-- S-M03-29-HISTORY-PAGING-005（既定10件確認履歴）
-- 流す時点: 投入方法の最初（画面の操作より前）、次の「ケース終了後に退避分を復元する」より前。手順書（S-M03-29-HISTORY-PAGING-005.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 結合試験用DB投入スクリプトで既存の売上分析タグ更新CSV履歴を退避して一覧対象から除外し、指定した10件を登録する。
--     備考: 取込種別「売上分析タグ更新CSV（番号4）」の履歴 10 件（番号 329017001〜）を作る
--     備考: 日時は日本時間(+09)で、2026-08-05 10:00:00 から 2026-08-05 10:00:09 まで等間隔（0:00:01 間隔）
--     備考: 作業者は管理者の名前「M03-29試験管理者」で引く（1件に決まることを確かめる）
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「売上分析タグ更新CSV（番号4）」のほかの取込履歴は1件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE name = 'M03-29試験管理者') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '作業者の管理者「M03-29試験管理者」が1件に決まらない（%件）', n; END IF; END $$;
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id BETWEEN 329017001 AND 329017010 OR (csv_import_type_id = 4 AND file_name ~ '^paging\-M0329\-005\-[0-9]{3}\.csv$'));
DELETE FROM dtb_csv_import_history WHERE id BETWEEN 329017001 AND 329017010 OR (csv_import_type_id = 4 AND file_name ~ '^paging\-M0329\-005\-[0-9]{3}\.csv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT 329017001 + g, 4, (SELECT id FROM dtb_member WHERE name = 'M03-29試験管理者'), 'paging-M0329-005-' || lpad((1 + g)::text, 3, '0') || '.csv', (ARRAY[TIMESTAMPTZ '2026-08-05 10:00:00+09',TIMESTAMPTZ '2026-08-05 10:00:01+09',TIMESTAMPTZ '2026-08-05 10:00:02+09',TIMESTAMPTZ '2026-08-05 10:00:03+09',TIMESTAMPTZ '2026-08-05 10:00:04+09',TIMESTAMPTZ '2026-08-05 10:00:05+09',TIMESTAMPTZ '2026-08-05 10:00:06+09',TIMESTAMPTZ '2026-08-05 10:00:07+09',TIMESTAMPTZ '2026-08-05 10:00:08+09',TIMESTAMPTZ '2026-08-05 10:00:09+09'])[g + 1] FROM generate_series(0, 9) AS g;

COMMIT;
