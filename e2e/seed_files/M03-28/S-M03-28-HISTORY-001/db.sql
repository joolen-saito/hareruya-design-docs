-- S-M03-28-HISTORY-001（履歴一覧確認データ(001)）
-- 流す時点: 投入方法の最初（画面の操作より前）、次の「試験用ブラウザの表示件数とページ番号を設定する」より前。手順書（S-M03-28-HISTORY-001.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 対象種別の既存履歴を退避して0件にし、指定IDの履歴をDBシードで登録する。
--     備考: 取込種別「商品タグ更新CSV（番号3）」の履歴 11 件（番号 328101001〜）を作る
--     備考: 日時は日本時間(+09)で、2026-09-01 10:00:00 から 2026-09-01 10:10:00 まで等間隔（0:01:00 間隔）
--     備考: 作業者は管理者の番号328000001で引く（その番号の管理者が無ければ止まる）
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 作業者の管理者（番号328000001）を作るシードが無く、画面では管理者の番号を指定できないため、その番号の管理者がいる状態を作れない（このSQLはその管理者が無いと確認で止まる）
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「商品タグ更新CSV（番号3）」のほかの取込履歴は1件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）
--     作れない部分（SQLに入れていない）: ほかの取込種別の履歴の登録: どの取込種別か文に書かれていないため作っていない
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE id = 328000001) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '作業者の管理者（番号328000001）が1件に決まらない（%件）', n; END IF; END $$;
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id IN (328101001,328102001,328103001,328104001,328105001,328106001,328107001,328108001,328109001,328110001,328111001) OR (csv_import_type_id = 3 AND file_name ~ '^product_tag_[0-9]{2}\-001\.csv$'));
DELETE FROM dtb_csv_import_history WHERE id IN (328101001,328102001,328103001,328104001,328105001,328106001,328107001,328108001,328109001,328110001,328111001) OR (csv_import_type_id = 3 AND file_name ~ '^product_tag_[0-9]{2}\-001\.csv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT (ARRAY[328101001,328102001,328103001,328104001,328105001,328106001,328107001,328108001,328109001,328110001,328111001])[g + 1], 3, (SELECT id FROM dtb_member WHERE id = 328000001), 'product_tag_' || lpad((1 + g)::text, 2, '0') || '-001.csv', (ARRAY[TIMESTAMPTZ '2026-09-01 10:00:00+09',TIMESTAMPTZ '2026-09-01 10:01:00+09',TIMESTAMPTZ '2026-09-01 10:02:00+09',TIMESTAMPTZ '2026-09-01 10:03:00+09',TIMESTAMPTZ '2026-09-01 10:04:00+09',TIMESTAMPTZ '2026-09-01 10:05:00+09',TIMESTAMPTZ '2026-09-01 10:06:00+09',TIMESTAMPTZ '2026-09-01 10:07:00+09',TIMESTAMPTZ '2026-09-01 10:08:00+09',TIMESTAMPTZ '2026-09-01 10:09:00+09',TIMESTAMPTZ '2026-09-01 10:10:00+09'])[g + 1] FROM generate_series(0, 10) AS g;

COMMIT;
