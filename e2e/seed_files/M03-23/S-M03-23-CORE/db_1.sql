-- S-M03-23-CORE（一覧表示基本データ）
-- 流す時点: 投入方法の「HIST-DISPLAY-001: 商品名「履歴表示商品」、言語=日本語で、取り込んだあと規格の画面…」を終えたあと、次の「HIST-BUY-ONLY-001: 買取価格300で登録する。」より前。手順書（S-M03-23-CORE.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 取り込みでできた価格履歴（変更前価格が空のもの）はDBから直接削除し、規格の編集でできた価格履歴を1件だけ残して、その履歴の変更後基準価格を1000、変更後販売価格を1200、変更後買取価格を600にDBで直接設定する。
--     備考: 対象は、この文が書かれた節の見出しが指す商品（HIST-DISPLAY-001）
--     備考: 「変更前価格が空」の履歴(取り込みでできたもの)だけを消す。取り込みは変更前の価格を0で書くため、0と空(NULL)のどちらも「空」として扱う
--     備考: 残った履歴(規格の編集でできた1件)の変更後の3つの価格を文の値にする
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'HIST-DISPLAY-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「HIST-DISPLAY-001」が1件に決まらない（%件）', n; END IF; END $$;
DELETE FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIST-DISPLAY-001') AND COALESCE(old_sell_price, 0) = 0 AND COALESCE(old_buy_price, 0) = 0 AND COALESCE(old_standard_price, 0) = 0;
DO $$ DECLARE c bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIST-DISPLAY-001')) INTO c; IF c IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'HIST-DISPLAY-001 の、規格の編集でできた価格履歴が1件に決まらない（%件）', c; END IF; END $$;
UPDATE dtb_price_history SET standard_price = 1000, sell_price = 1200, buy_price = 600 WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIST-DISPLAY-001');

-- [2] 文（投入方法）: この履歴の変更前基準価格900・変更前販売価格1100・変更前買取価格500と登録日時2026-08-31 12:34:00は画面で指定できないためDBへ直接設定する。
--     備考: 対象は、この文が書かれた節の見出しが指す商品（HIST-DISPLAY-001）
--     備考: 「この履歴」は直前の文で残した、この規格の価格履歴1件。日時は日本時間(+09)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'HIST-DISPLAY-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「HIST-DISPLAY-001」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE c bigint; BEGIN SELECT (SELECT count(*) FROM dtb_price_history WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIST-DISPLAY-001')) INTO c; IF c IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'HIST-DISPLAY-001 の価格履歴が1件に決まらない(直前の文で1件だけ残したはず)（%件）', c; END IF; END $$;
UPDATE dtb_price_history SET old_standard_price = 900, old_sell_price = 1100, old_buy_price = 500, create_date = TIMESTAMPTZ '2026-08-31 12:34:00+09' WHERE product_class_id = (SELECT id FROM dtb_product_class WHERE product_code = 'HIST-DISPLAY-001');

COMMIT;
