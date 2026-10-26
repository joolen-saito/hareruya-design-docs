-- S-M03-40-CBSHELF-040（稼働中の規格が2件ある商品データ）
-- 流す時点: 投入方法の最初（画面の操作より前）、次の「商品一覧で商品コードにM0340-CB040-Pを入れて検索し、該当が無ければ、…」より前。手順書（S-M03-40-CBSHELF-040.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 棚番号（名称S-M0340-CB040-OLD、S-M0340-CB040-NEW）は、名称が棚番号登録/編集画面の名称の形式チェック（大文字英字1字・ハイフン・数字3桁の形だけを通す）を通らず画面で指定できないためDBへ直接設定する。
--     備考: 棚番号は名前で作る(同じ名前があれば作らない)。並び順は文に無いので0
INSERT INTO dtb_shelf_number (name, sort_no) SELECT 'S-M0340-CB040-OLD', 0 WHERE NOT EXISTS (SELECT 1 FROM dtb_shelf_number WHERE name = 'S-M0340-CB040-OLD');
INSERT INTO dtb_shelf_number (name, sort_no) SELECT 'S-M0340-CB040-NEW', 0 WHERE NOT EXISTS (SELECT 1 FROM dtb_shelf_number WHERE name = 'S-M0340-CB040-NEW');

COMMIT;
