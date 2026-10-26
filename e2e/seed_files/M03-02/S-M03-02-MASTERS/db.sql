-- S-M03-02-MASTERS（商品編集選択肢マスタ）
-- 流す時点: 投入方法の「タグ登録で名称(日)に「タグA」「タグB」「旧タグ」をそれぞれ入れ、名称(英)に任意の半角文字、並び…」を終えたあと。手順書（S-M03-02-MASTERS.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 販売割引率（ID 302441「割引率A」）と買取減額率（ID 302451「買取減額率A」）は、登録する画面が無く画面で指定できないためDBへ直接設定する。
--     備考: 「割引率A」: 文が率を書かないため、マスタの行だけ作った(カード状態ごとの率は作っていない)
--     備考: 「買取減額率A」: 文が率を書かないため、マスタの行だけ作った(カード状態ごとの率は作っていない)
INSERT INTO mtb_discount (id, name) VALUES (302441, '割引率A') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_discount WHERE name = '割引率A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '販売割引率「割引率A」が1件に決まらない（%件）', n; END IF; END $$;
INSERT INTO mtb_buy_discount (id, name) VALUES (302451, '買取減額率A') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_buy_discount WHERE name = '買取減額率A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '買取減額率「買取減額率A」が1件に決まらない（%件）', n; END IF; END $$;

COMMIT;
