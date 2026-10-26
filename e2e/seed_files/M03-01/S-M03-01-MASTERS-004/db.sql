-- S-M03-01-MASTERS-004（複数選択マスタ(004)）
-- 流す時点: 投入方法の「登録の前に、各画面の一覧で名称に「商品検索」を含む行が他に無いことを確かめる。」を終えたあと。手順書（S-M03-01-MASTERS-004.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚番号の名称「商品検索棚甲004」「商品検索棚乙004」は画面で指定できないためDBへ直接設定する（棚番号ID 90301413・90301414）。
--     備考: 並び順は文に無いので0にした。同じ番号があれば名称を上書きする
INSERT INTO dtb_shelf_number (id, name, sort_no) VALUES (90301413, '商品検索棚甲004', 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO dtb_shelf_number (id, name, sort_no) VALUES (90301414, '商品検索棚乙004', 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

COMMIT;
