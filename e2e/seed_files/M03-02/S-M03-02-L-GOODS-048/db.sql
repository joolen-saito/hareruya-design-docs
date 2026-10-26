-- S-M03-02-L-GOODS-048（グッズ商品属性更新データ(001)）
-- 流す時点: 投入方法の最初（画面の操作より前）、次の「カテゴリ登録の最上位でカテゴリ名(日)に「連携カテゴリ001AM0302n048…」より前。手順書（S-M03-02-L-GOODS-048.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 販売割引率（ID 9302041「連携割引率001AM0302n048」）は、登録する画面が無く画面で指定できないためDBへ直接設定する。
--     備考: 「連携割引率001AM0302n048」: 文が率を書かないため、マスタの行だけ作った(カード状態ごとの率は作っていない)
INSERT INTO mtb_discount (id, name) VALUES (9302041, '連携割引率001AM0302n048') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_discount WHERE name = '連携割引率001AM0302n048') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '販売割引率「連携割引率001AM0302n048」が1件に決まらない（%件）', n; END IF; END $$;

COMMIT;
