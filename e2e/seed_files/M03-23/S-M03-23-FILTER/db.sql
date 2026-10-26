-- S-M03-23-FILTER（選択条件検索データ）
-- 流す時点: 投入方法の「どの商品も商品規格は1件だけ登録し、登録後に価格を変えない（履歴を各1件に保つ）状態がその他の3件（…」を終えたあと。手順書（S-M03-23-FILTER.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: そのあと、取り込みで作られたニアミントの規格（商品コードは識別子に「-CSV」を付けた値）の行から商品規格登録編集画面を開き、「商品規格を削除」ボタンを押し、その規格の価格履歴（変更前価格が空のもの）はDBから直接削除する。
--     備考: 対象の商品コードは、文の前の「3件（CUSTOM-OK-001・CUSTOM-STATUS-DIFF-001・CUSTOM-RARITY-DIFF-001）」の識別子に「-CSV」を付けた CUSTOM-OK-001-CSV・CUSTOM-STATUS-DIFF-001-CSV・CUSTOM-RARITY-DIFF-001-CSV（グッズ商品CSVの商品コード欄に入れる値）
--     備考: 「変更前価格が空」の履歴(取り込みでできたもの)だけを消す。取り込みは変更前の価格を0で書くため、0と空(NULL)のどちらも「空」として扱う
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'CUSTOM-OK-001-CSV') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「CUSTOM-OK-001-CSV」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'CUSTOM-OK-001-CSV') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'CUSTOM-STATUS-DIFF-001-CSV') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「CUSTOM-STATUS-DIFF-001-CSV」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'CUSTOM-STATUS-DIFF-001-CSV') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'CUSTOM-RARITY-DIFF-001-CSV') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「CUSTOM-RARITY-DIFF-001-CSV」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'CUSTOM-RARITY-DIFF-001-CSV') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;

COMMIT;
