-- S-M03-02-L-SALE-049（支店SALE中商品の公開切替データ(003)）
-- 流す時点: 投入方法の最初（画面の操作より前）、次の「店舗登録画面で支店URLに「m0302l3」、店舗種別に「支店」、公開に「公開」…」より前。手順書（S-M03-02-L-SALE-049.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 固定セールタグ「連携セールタグ003」（タグID 9302371）と販売割引率（ID 9302341「連携割引率003AM0302n049」）は画面で指定できないためDBへ直接設定する（固定セールタグは決まったタグIDで判定され、タグ登録画面では登録時に画面がIDを振る。販売割引率は登録する画面が無
--     備考: 「連携割引率003AM0302n049」: 文が率を書かないため、マスタの行だけ作った(カード状態ごとの率は作っていない)
INSERT INTO mtb_discount (id, name) VALUES (9302341, '連携割引率003AM0302n049') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_discount WHERE name = '連携割引率003AM0302n049') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '販売割引率「連携割引率003AM0302n049」が1件に決まらない（%件）', n; END IF; END $$;

COMMIT;
