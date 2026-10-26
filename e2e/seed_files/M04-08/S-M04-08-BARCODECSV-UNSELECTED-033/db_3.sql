-- S-M04-08-BARCODECSV-UNSELECTED-033（バーコード印刷用CSV出力値確認データ(033)）
-- 流す時点: 投入方法の「続けて、商品規格一覧で取り込みで作られた状態NMの規格の行を開き、商品規格登録編集画面の「商品規格を…」を終えたあと、次の「M04-09作業者（S-M04-08-OP-A）でログインし、在庫一覧画面で店舗…」より前。手順書（S-M04-08-BARCODECSV-UNSELECTED-033.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [3] 文（投入方法）: この商品規格のスマレジ商品ID 4083399と、試験店舗A・EC-CUBEの在庫（在庫数1以上）は画面で指定できないためDBへ直接設定する。
--     備考: 対象は、この文が書かれた節の見出しが指す商品（M0408-033-B）
--     備考: 新規作成の規格の商品コードは文に無いが画面で必須のため、「M0408-033-B-EX」を入れる（手順書で決めた値。SQLはこのコードでは引かない）
--     備考: 節の手順で、商品コードM0408-033-Bの規格（取り込みで作られた規格）は「商品規格を削除」で論理削除され（行と商品コードは残る）、新規作成の規格だけが残る。そのため商品コードM0408-033-Bの規格の商品の、削除されていない（公開状態が廃止でない・表示する）規格を対象にし、それが1件に決まることを確かめる
--     備考: 文の状態「EX」は、アプリの状態の選択肢（NM・SP・MP・HP・OT。試し用DBの状態の表を SELECT で確かめた）に無い。画面ではその状態を選べない（設計と実装の差の候補として記録した）
--     備考: 在庫数は、1未満のときだけ1にする(1以上ならそのまま)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class c WHERE c.product_id IN (SELECT product_id FROM dtb_product_class WHERE product_code = 'M0408-033-B') AND c.visible AND c.product_status_id IS DISTINCT FROM 3) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「商品コードM0408-033-Bの商品の削除されていない規格」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT c.id FROM dtb_product_class c WHERE c.product_id IN (SELECT product_id FROM dtb_product_class WHERE product_code = 'M0408-033-B') AND c.visible AND c.product_status_id IS DISTINCT FROM 3)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（商品コードM0408-033-B）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET smaregi_product_id = '4083399' WHERE id = (SELECT c.id FROM dtb_product_class c WHERE c.product_id IN (SELECT product_id FROM dtb_product_class WHERE product_code = 'M0408-033-B') AND c.visible AND c.product_status_id IS DISTINCT FROM 3);
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_base_info WHERE shop_name = '試験店舗A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '店舗「試験店舗A」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock s WHERE s.product_class_id = (SELECT c.id FROM dtb_product_class c WHERE c.product_id IN (SELECT product_id FROM dtb_product_class WHERE product_code = 'M0408-033-B') AND c.visible AND c.product_status_id IS DISTINCT FROM 3) AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格商品コードM0408-033-Bの商品の削除されていない規格・店舗試験店舗A・在庫区分1の在庫が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_stock WHERE id = (SELECT s.id FROM dtb_product_stock s WHERE s.product_class_id = (SELECT c.id FROM dtb_product_class c WHERE c.product_id IN (SELECT product_id FROM dtb_product_class WHERE product_code = 'M0408-033-B') AND c.visible AND c.product_status_id IS DISTINCT FROM 3) AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する在庫（商品コードM0408-033-B・店舗「試験店舗A」・EC-CUBE）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_stock SET stock = GREATEST(stock, 1) WHERE id = (SELECT s.id FROM dtb_product_stock s WHERE s.product_class_id = (SELECT c.id FROM dtb_product_class c WHERE c.product_id IN (SELECT product_id FROM dtb_product_class WHERE product_code = 'M0408-033-B') AND c.visible AND c.product_status_id IS DISTINCT FROM 3) AND s.base_info_id = (SELECT id FROM dtb_base_info WHERE shop_name = '試験店舗A') AND s.stock_location_id = 1);

COMMIT;
