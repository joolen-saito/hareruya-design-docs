-- S-M03-22-DELETED-019（削除済み編集確認データ(019)）
-- 流す時点: 投入方法の「購入グループ管理画面の一覧で名称（日）「削除済み購入グループ-019」の行の削除ボタンを押し、削除確…」を終えたあと。手順書（S-M03-22-DELETED-019.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 名称（日）「削除済み購入グループ-019」の削除日時（2026-01-02 00:00:00）は画面で指定できないためDBへ直接設定する。
--     備考: 日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_sell_group WHERE name = '削除済み購入グループ-019') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '購入グループ「削除済み購入グループ-019」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE mtb_sell_group SET deleted_at = TIMESTAMPTZ '2026-01-02 00:00:00+09' WHERE name = '削除済み購入グループ-019';

COMMIT;
