-- S-M04-21-VALIDATION-026（商品相関検証データ(026)）
-- 流す時点: 投入方法の「在庫一覧画面で商品コードDUP-M421-026を検索し、店舗試験店舗A（M04-21）・在庫区分E…」を終えたあと、次の「商品マスター画面で商品コードUNKNOWN-M421-026を検索し、該当が無い…」より前。手順書（S-M04-21-VALIDATION-026.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 削除済みの商品ID 142102610とその商品規格ID 142102611（商品コードDEL-P-M421-026）、商品ID 142102612と削除済みの商品規格ID 142102613（商品コードDEL-C-M421-026）は画面で指定できないためDBへ直接設定する。
--     備考: 商品ID 142102612（削除されていない商品）と、その削除済みの商品規格ID 142102613（商品コードDEL-C-M421-026）を文の番号で作る。アプリの商品規格の削除は論理削除（公開状態を廃止(3)にし、表示しないにする。行は残る）。同じ形にする。スマレジ連携の削除の呼び出しはしない
--     備考: 文に無い値を決めた: 商品の名前=商品コードと同じ「DEL-C-M421-026」・商品の公開状態=公開(1)・店舗=本店・規格の販売価格=0。言語・状態・在庫などは作らない（空のまま）
--     作れない部分（SQLに入れていない）: 削除済みの商品ID 142102610 とその商品規格ID 142102611（商品コードDEL-P-M421-026）: 商品本体の削除済み: アプリの商品削除は行そのものを消す動作で、「削除済みとして行が残る」状態を表す列が商品の表に無いため作れない（現行のDBに設定先の表・列が無い。設計と実装の差の候補）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE is_main_shop AND is_public_shop) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '本店（本店かつ公開の店舗）が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE c bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'DEL-C-M421-026' AND id <> 142102613) INTO c; IF c IS DISTINCT FROM 0 THEN RAISE EXCEPTION '商品コードDEL-C-M421-026の規格がほかの番号で既にある（%件）', c; END IF; END $$;
INSERT INTO dtb_product (id, base_info_id, name, product_status_id, create_date, update_date) VALUES (142102612, (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop), 'DEL-C-M421-026', 1, now(), now()) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, product_status_id = EXCLUDED.product_status_id;
INSERT INTO dtb_product_class (id, product_id, base_info_id, product_code, price02, product_status_id, visible, create_date, update_date) VALUES (142102613, 142102612, (SELECT id FROM dtb_base_info WHERE is_main_shop AND is_public_shop), 'DEL-C-M421-026', 0, 3, false, now(), now()) ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, product_code = EXCLUDED.product_code, product_status_id = 3, visible = false;

COMMIT;
