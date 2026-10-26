-- S-M03-27-RB-MASTER（CSV取込と検索の参照マスタ）
-- 流す時点: 投入方法の最初（画面の操作より前）、次の「CSV取込の区切り文字・囲み文字・アップロードサイズ上限は、試験環境のCSV基本…」より前。手順書（S-M03-27-RB-MASTER.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 言語ID=1（日本語）の登録は画面で指定できないためDBシードで登録する。
--     備考: 値は現在のDBの言語表の「日本語」の行(言語ID 1)と同じにした(DBから読んだ値)。既にあれば何もしない
INSERT INTO mtb_language (id, name_jp, name_en, code, sort_no) VALUES (1, '日本語', 'Japanease', 'JP', 1) ON CONFLICT (id) DO NOTHING;

COMMIT;
