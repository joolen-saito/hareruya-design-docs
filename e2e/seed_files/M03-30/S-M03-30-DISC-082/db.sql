-- S-M03-30-DISC-082（割引率が設定された商品の公開側表示データ(082)）
-- 流す時点: 投入方法の「承認者（m0330qc-approver）で管理画面にログインし直して在庫編集承認一覧(検索結果)を…」を終えたあと、次の「同じ商品の商品登録編集画面を開き、割引率に「割引率M0330-082」を選んで商…」より前。手順書（S-M03-30-DISC-082.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 販売割引率「割引率M0330-082」（カード状態NMの率=95%）は、登録する画面が無く画面で指定できないためDBへ直接設定する。
--     備考: 「割引率M0330-082」: 書かれたカード状態(NM)の率だけを作った。率は%を100で割った値(95%→0.95)。書かれていない状態の率は作っていない
INSERT INTO mtb_discount (name) SELECT '割引率M0330-082' WHERE NOT EXISTS (SELECT 1 FROM mtb_discount WHERE name = '割引率M0330-082');
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM mtb_discount WHERE name = '割引率M0330-082') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '販売割引率「割引率M0330-082」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_discount_card_condition WHERE discount_id = (SELECT id FROM mtb_discount WHERE name = '割引率M0330-082');
INSERT INTO dtb_discount_card_condition (discount_id, card_condition_id, rate) SELECT d.id, c.id, 0.95 FROM mtb_discount d, mtb_card_condition c WHERE d.name = '割引率M0330-082' AND c.code = 'NM';

COMMIT;
