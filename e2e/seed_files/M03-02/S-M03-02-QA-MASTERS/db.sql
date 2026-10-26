-- S-M03-02-QA-MASTERS（M03-02連携試験マスタ(QA群)）
-- 流す時点: 投入方法の「購入グループ管理で名称（日）に「QA群購入グループ0302」、名称（英）に任意の半角文字を入れて「登…」を終えたあと。手順書（S-M03-02-QA-MASTERS.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 販売割引率「QA群割引率0302」は登録する画面が無いためDBへ直接設定する。
--     備考: 「QA群割引率0302」: 文が率を書かないため、マスタの行だけ作った(カード状態ごとの率は作っていない)
INSERT INTO mtb_discount (name) SELECT 'QA群割引率0302' WHERE NOT EXISTS (SELECT 1 FROM mtb_discount WHERE name = 'QA群割引率0302');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_discount WHERE name = 'QA群割引率0302') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '販売割引率「QA群割引率0302」が1件に決まらない（%件）', n; END IF; END $$;

COMMIT;
