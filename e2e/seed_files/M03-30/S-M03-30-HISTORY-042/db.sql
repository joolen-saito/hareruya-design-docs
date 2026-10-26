-- S-M03-30-HISTORY-042（ページング網羅データ(042)）
-- 流す時点: 投入方法の最初（画面の操作より前）。手順書（S-M03-30-HISTORY-042.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: DBシードで本機能の既存取込履歴を削除して11件を登録し、退会済担当者と他取込種別の履歴1件を登録する
--     備考: 取込種別「基準価格変更CSV（番号5。マスタの名前は「セール用価格変更登録」）」の履歴 11 件（番号 33004201〜）を作る
--     備考: 日時は日本時間(+09)で、2026-09-04 10:00:00 から 2026-09-04 10:10:00 まで等間隔（0:01:00 間隔）
--     備考: 10:10の履歴の作業者は管理者ID=33004299・退会済担当 太郎（番号と名前の両方が合う管理者が1件あることを確かめる）
--     備考: ほかの履歴の作業者は文に無いので空にした
--     備考: 取込種別の番号は画面(コントローラ)が使う定数で決めた。マスタの名前は番号5〜8で画面と食い違う（5=基準価格変更CSVの画面が使うがマスタの名前は「セール用価格変更登録」、6=セール用価格変更CSV／「価格変更登録」、7=高額商品価格変更CSV／「セール用高額商品価格変更登録」、8=セール用高額商品価格変更CSV／「高額商品価格変更登録」）。設計と実装の差の候補として記録した
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
--     作れない部分（SQLに入れていない）: 作業者の管理者（管理者ID=33004299・退会済担当 太郎・退会済）の登録: 管理者の行には所属・店舗・メールアドレス・ログインID・パスワードが要るが文に無く（パスワードは書かない決まり）、退会済の表し方も文に無いため作れない。画面では管理者の番号を指定できない。この管理者が無いと、このSQLは確認で止まる
--     作れない部分（SQLに入れていない）: 全件削除: 渡したダンプを戻した直後の取込種別「基準価格変更CSV（番号5。マスタの名前は「セール用価格変更登録」）」のほかの取込履歴は1件。この状態にするには既存の行を消す必要がある（全件削除のため SQL は用意していない）
--     作れない部分（SQLに入れていない）: ほかの取込種別の履歴の登録: どの取込種別か文に書かれていないため作っていない
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_member WHERE id = 33004299 AND name = '退会済担当 太郎') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '作業者の管理者（番号33004299・名前「退会済担当 太郎」）が1件に決まらない（%件）', n; END IF; END $$;
-- このシードの履歴(同じ番号、または同じ取込種別・同じファイル名の行)だけを先に消してから作る。ほかの履歴は消さない
DELETE FROM dtb_csv_import_smaregi_job_link WHERE csv_import_history_id IN (SELECT id FROM dtb_csv_import_history WHERE id BETWEEN 33004201 AND 33004211 OR (csv_import_type_id = 5 AND file_name ~ '^price_[0-9]{2}\-042\.tsv$'));
DELETE FROM dtb_csv_import_history WHERE id BETWEEN 33004201 AND 33004211 OR (csv_import_type_id = 5 AND file_name ~ '^price_[0-9]{2}\-042\.tsv$');
INSERT INTO dtb_csv_import_history (id, csv_import_type_id, member_id, file_name, create_date) SELECT 33004201 + g, 5, CASE WHEN g = 10 THEN (SELECT id FROM dtb_member WHERE id = 33004299) ELSE NULL END, 'price_' || lpad((1 + g)::text, 2, '0') || '-042.tsv', (ARRAY[TIMESTAMPTZ '2026-09-04 10:00:00+09',TIMESTAMPTZ '2026-09-04 10:01:00+09',TIMESTAMPTZ '2026-09-04 10:02:00+09',TIMESTAMPTZ '2026-09-04 10:03:00+09',TIMESTAMPTZ '2026-09-04 10:04:00+09',TIMESTAMPTZ '2026-09-04 10:05:00+09',TIMESTAMPTZ '2026-09-04 10:06:00+09',TIMESTAMPTZ '2026-09-04 10:07:00+09',TIMESTAMPTZ '2026-09-04 10:08:00+09',TIMESTAMPTZ '2026-09-04 10:09:00+09',TIMESTAMPTZ '2026-09-04 10:10:00+09'])[g + 1] FROM generate_series(0, 10) AS g;

COMMIT;
