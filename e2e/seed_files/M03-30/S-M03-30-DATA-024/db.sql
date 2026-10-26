-- S-M03-30-DATA-024（改行数5010データ(024)）
-- 流す時点: 投入方法の「商品マスター画面で商品名(日/英)に「M0330試験商品024」を入れて検索し、該当商品の商品登録編…」を終えたあと、次の「試験データ生成処理で改行数を5010個に固定したタブ区切りファイルを配置する（フ…」より前。手順書（S-M03-30-DATA-024.md）の「DBへ直接設定する部分（SQL）」と同じ。
-- 流す前に、下の〔…〕（画面で控えた番号の呼び名）を、控えた番号に置き換える。呼び名が残ったまま流すと、そこで構文エラーになって止まる（何も変わらない）。
BEGIN;

-- [1] 文（投入方法）: 販売価格=900は画面で指定できないためDBへ直接設定する。
--     備考: 販売価格だけを変える(基準価格は変えない)
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_product_class WHERE id = 〔商品規格ID-M0330-024〕) INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '〔商品規格ID-M0330-024〕 の行が1件に決まらない（番号の置き換えを確かめる）（%件）', n; END IF; END $$;
UPDATE dtb_product_class SET price02 = 900 WHERE id = 〔商品規格ID-M0330-024〕;

COMMIT;
