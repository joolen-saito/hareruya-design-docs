-- S-M03-26-SMART-024（スマレジ部門024）
-- 流す時点: 投入方法の「商品規格一覧で言語が言語ID1に当たる言語・状態NMの規格（取り込みで作られた規格。商品コード「M0…」を終えたあと、次の「【保留中処理0件】システム管理者の権限を持つ管理者で管理画面の非同期処理のジョブ…」より前。手順書（S-M03-26-SMART-024.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 【DB 部門未設定】部門を未設定にすることは画面で指定できないためDBへ直接設定する（登録した商品規格の部門を空にする）。
--     備考: 節の手順で、〔商品ID-M0326-024〕の商品の、取り込みで作られた規格は「商品規格を削除」で論理削除され（行と商品コードは残る）、新規作成の規格だけが残る。そのため〔商品ID-M0326-024〕の商品の、削除されていない（公開状態が廃止でない・表示する）規格を対象にし、それが1件に決まることを確かめる
--     備考: 文の状態「EX」は、アプリの状態の選択肢（NM・SP・MP・HP・OT。試し用DBの状態の表を SELECT で確かめた）に無い。画面ではその状態を選べない（設計と実装の差の候補として記録した）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class c WHERE c.product_id IN (〔商品ID-M0326-024〕) AND c.visible AND c.product_status_id IS DISTINCT FROM 3) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品規格「〔商品ID-M0326-024〕の商品の削除されていない規格」が1件に決まらない（%件）', n; END IF; END $$;
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = (SELECT c.id FROM dtb_product_class c WHERE c.product_id IN (〔商品ID-M0326-024〕) AND c.visible AND c.product_status_id IS DISTINCT FROM 3)) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '更新する商品規格（〔商品ID-M0326-024〕の規格）が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET section_id = NULL WHERE id = (SELECT c.id FROM dtb_product_class c WHERE c.product_id IN (〔商品ID-M0326-024〕) AND c.visible AND c.product_status_id IS DISTINCT FROM 3);

COMMIT;
