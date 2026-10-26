-- S-M03-31-MASTERS（CSV取込用参照マスタ）
-- 流す時点: 投入方法の「タグ登録画面の一覧で名称(日)が「更新前タグ」「更新後タグA」「更新後タグB」の行のID欄に表示され…」を終えたあと。手順書（S-M03-31-MASTERS.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [1] 文（投入方法）: 言語ID=1（日本語）の登録は画面で指定できないためDBへ直接設定する。
--     備考: 値は現在のDBの言語表の「日本語」の行(言語ID 1)と同じにした(DBから読んだ値)。既にあれば何もしない
INSERT INTO mtb_language (id, name_jp, name_en, code, sort_no) VALUES (1, '日本語', 'Japanease', 'JP', 1) ON CONFLICT (id) DO NOTHING;

COMMIT;
