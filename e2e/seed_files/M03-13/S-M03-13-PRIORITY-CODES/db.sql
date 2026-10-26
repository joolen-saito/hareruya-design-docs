-- S-M03-13-PRIORITY-CODES（優先表示入力用規格）
-- 流す時点: 投入方法の「商品マスターでコードに各規格コードを入れて検索し（公開状態の条件はCSVに入れた商品公開ステータスに…」を終えたあと、次の「規格コードUNKNOWN-999の規格が登録されているときは、DBへ直接操作して…」より前。手順書（S-M03-13-PRIORITY-CODES.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 規格コードDEL-001の規格の削除済み状態は画面で指定できない（商品の有効な規格が1件だけのとき、画面は規格の削除を受け付けない）ため、商品IDを控えたあとでDBへ直接設定する。
--     備考: アプリの商品規格の削除は論理削除（公開状態を廃止(3)にし、表示しないにする。行は残る）。同じ形にする。スマレジ連携の削除の呼び出しはしない
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE product_code = 'DEL-001') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '商品コードDEL-001の規格が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET product_status_id = 3, visible = false WHERE product_code = 'DEL-001';

COMMIT;
