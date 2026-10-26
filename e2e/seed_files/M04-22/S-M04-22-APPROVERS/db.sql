-- S-M04-22-APPROVERS（共通承認通知先候補）
-- 流す時点: 投入方法の「店舗Aは店舗登録画面で新しく作った店舗（店舗IDは店舗一覧で控えた〔店舗ID-M0422-共有A〕、…」を終えたあと。手順書（S-M04-22-APPROVERS.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 手順書: e2e/.runs/seed_files_private/M04-22/S-M04-22-APPROVERS.md（シード表の文にパスワードを含むため非公開側に置いてある。git に入れない）
BEGIN;

-- [1] 文（投入方法）: 所属A・所属B・所属Cの並び順10・20・30は画面で指定できないためDBへ直接設定する。
--     備考: 所属は名前で引く（1件に決まることを確かめる）
--     備考: 状態・属性の所属ID 42211・42212・42213 は、現行のDBの所属の番号の型（smallint、上限32767）を超えるため、その番号では作れない（設計と実装の差の候補: 番号の型の上限を超える）。このSQLは所属を名前で引くので、番号が違っても動く
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_department WHERE name = '所属A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '所属「所属A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE mtb_department SET sort_no = 10 WHERE name = '所属A';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_department WHERE name = '所属B') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '所属「所属B」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE mtb_department SET sort_no = 20 WHERE name = '所属B';
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_department WHERE name = '所属C') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '所属「所属C」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE mtb_department SET sort_no = 30 WHERE name = '所属C';

COMMIT;
