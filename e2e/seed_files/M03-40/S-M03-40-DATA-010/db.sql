-- S-M03-40-DATA-010（改行形式別データ）
-- 流す時点: 投入方法の最初（画面の操作より前）、次の「商品一覧で商品コードに4012を入れて検索し、該当が無ければ、グッズ商品CSV登…」より前。手順書（S-M03-40-DATA-010.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚番号（棚番号ID=34001021・名称=S-001-010、棚番号ID=34001022・名称=S-002-010）は、名称が棚番号登録/編集画面の名称の形式チェック（大文字英字1字・ハイフン・数字3桁の形だけを通す）を通らず画面で指定できないためDBへ直接設定する。
--     備考: 並び順は文に無いので0にした。同じIDがあれば名称を上書きする(流し直しても壊れない)
INSERT INTO dtb_shelf_number (id, name, sort_no) VALUES (34001021, 'S-001-010', 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO dtb_shelf_number (id, name, sort_no) VALUES (34001022, 'S-002-010', 0) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

COMMIT;
