-- S-M03-30-CBPRICE-099（SP・割引率の対応なし・買取減額率あり・Foil有効・販売のみ変更(099)）
-- 流す時点: 投入方法の「商品マスター画面で商品名を検索して商品登録編集画面を開き、割引率に「割引率M0330-CB099」を…」を終えたあと、次の「商品マスター画面で商品名を検索して商品登録編集画面を開き、買取減額率に「買取減額…」より前。手順書（S-M03-30-CBPRICE-099.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [3] 文（投入方法）: 買取減額率「買取減額率M0330-CB099」（SPの率85%）は、登録する画面が無く画面で指定できないためDBへ直接設定する。
--     備考: 「買取減額率M0330-CB099」: 書かれたカード状態(SP)の率だけを作った。率は%を100で割った値(95%→0.95)。書かれていない状態の率は作っていない
INSERT INTO mtb_buy_discount (name) SELECT '買取減額率M0330-CB099' WHERE NOT EXISTS (SELECT 1 FROM mtb_buy_discount WHERE name = '買取減額率M0330-CB099');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_buy_discount WHERE name = '買取減額率M0330-CB099') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '買取減額率「買取減額率M0330-CB099」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_buy_discount_card_condition WHERE buy_discount_id = (SELECT id FROM mtb_buy_discount WHERE name = '買取減額率M0330-CB099');
INSERT INTO dtb_buy_discount_card_condition (buy_discount_id, card_condition_id, rate) SELECT d.id, c.id, 0.85 FROM mtb_buy_discount d, mtb_card_condition c WHERE d.name = '買取減額率M0330-CB099' AND c.code = 'SP';

COMMIT;
