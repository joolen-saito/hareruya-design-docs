-- S-M03-30-CBPRICE-101（HP・割引率あり・買取減額率あり・Foil有効・両方変更(101)）
-- 流す時点: 投入方法の「商品マスター画面で商品名(日/英)に「M0330CB101試験商品」を入れて検索し、該当商品の商品登…」を終えたあと、次の「商品マスター画面で商品名を検索して商品登録編集画面を開き、割引率に「割引率M03…」より前。手順書（S-M03-30-CBPRICE-101.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 販売割引率「割引率M0330-CB101」（HPの率80%）は、登録する画面が無く画面で指定できないためDBへ直接設定する。
--     備考: 「割引率M0330-CB101」: 書かれたカード状態(HP)の率だけを作った。率は%を100で割った値(95%→0.95)。書かれていない状態の率は作っていない
INSERT INTO mtb_discount (name) SELECT '割引率M0330-CB101' WHERE NOT EXISTS (SELECT 1 FROM mtb_discount WHERE name = '割引率M0330-CB101');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_discount WHERE name = '割引率M0330-CB101') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '販売割引率「割引率M0330-CB101」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_discount_card_condition WHERE discount_id = (SELECT id FROM mtb_discount WHERE name = '割引率M0330-CB101');
INSERT INTO dtb_discount_card_condition (discount_id, card_condition_id, rate) SELECT d.id, c.id, 0.80 FROM mtb_discount d, mtb_card_condition c WHERE d.name = '割引率M0330-CB101' AND c.code = 'HP';

COMMIT;
