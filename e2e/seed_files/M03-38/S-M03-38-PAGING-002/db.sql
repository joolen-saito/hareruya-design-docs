-- S-M03-38-PAGING-002（ページング確認履歴(002)）
-- 流す時点: 投入方法の最初（画面の操作より前）。手順書（S-M03-38-PAGING-002.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: DBシードで商品公開CSV履歴を0件にしてから12001件を登録する
--     備考: 取込種別「商品公開変更CSV（番号14）」の履歴 12001 件（番号 338100001〜）を作る
--     備考: 日時は日本時間(+09)で、2026-08-01 00:00:00 から1分ずつ新しくなる
--     備考: 作業者は管理者の名前「M03-38試験管理者」で引く（1件に決まることを確かめる）
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「商品公開変更CSV（番号14）」のほかの取込履歴は1件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE name = 'M03-38試験管理者') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '作業者の管理者「M03-38試験管理者」が1件に決まらない（%件）', n; END IF; END $$;
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id BETWEEN 338100001 AND 338112001 OR (csv_import_type_id = 14 AND file_name ~ '^m03\-38\-page\-[0-9]{5}\-002\.csv$'));
DELETE FROM dtb_csv_import_history WHERE id BETWEEN 338100001 AND 338112001 OR (csv_import_type_id = 14 AND file_name ~ '^m03\-38\-page\-[0-9]{5}\-002\.csv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT 338100001 + g, 14, (SELECT id FROM dtb_member WHERE name = 'M03-38試験管理者'), 'm03-38-page-' || lpad((1 + g)::text, 5, '0') || '-002.csv', TIMESTAMPTZ '2026-08-01 00:00:00+09' + g * interval '60 seconds' FROM generate_series(0, 12000) AS g;

COMMIT;
