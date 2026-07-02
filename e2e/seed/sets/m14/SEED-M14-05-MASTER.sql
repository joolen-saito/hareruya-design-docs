-- SEED-M14-05-MASTER : カードCSV取込(m14-05)の valid.csv が参照する参照マスタを保証する。
--   取込はカード本体を作るため、ここではカードは作らず「参照される英語名マスタ」だけを冪等に用意する。
--   照合は英語名(name_en)。既存の基盤fixtureに Common/Normal/Creature/White 等は存在するが、
--   E2Eの決定性のため「無ければ作る」防御的UPSERTにする（name_en は実測で一意）。
--   カードセット(mtb_cardset)は基盤fixtureが0件のため、`set`列テスト用に1件だけ固定IDで用意する。
-- 使用: fixtures/csv/card_csv_import/valid.csv, multivalue.csv（成功系）／ master_not_found.csv は「存在しない名」を使う異常系
BEGIN;

-- rarity=Common / layout=Normal / cardtype=Creature / color=White を保証（無ければ作成）。
INSERT INTO mtb_rarity (name_jp, name_en, code, sort_no)
SELECT 'コモン', 'Common', 'C', 4
WHERE NOT EXISTS (SELECT 1 FROM mtb_rarity WHERE name_en = 'Common');

INSERT INTO mtb_card_layout (name_jp, name_en, sort_no)
SELECT '通常', 'Normal', 0
WHERE NOT EXISTS (SELECT 1 FROM mtb_card_layout WHERE name_en = 'Normal');

INSERT INTO mtb_cardtype (name_jp, name_en, product_search_flg, sort_no)
SELECT 'クリーチャー', 'Creature', true, 0
WHERE NOT EXISTS (SELECT 1 FROM mtb_cardtype WHERE name_en = 'Creature');

INSERT INTO mtb_color (name_jp, name_en, sort_no)
SELECT '白', 'White', 0
WHERE NOT EXISTS (SELECT 1 FROM mtb_color WHERE name_en = 'White');

INSERT INTO mtb_color (name_jp, name_en, sort_no)
SELECT '青', 'Blue', 0
WHERE NOT EXISTS (SELECT 1 FROM mtb_color WHERE name_en = 'Blue');

-- `set` 列テスト用カードセット（固定ID・帯内）。基盤fixtureは0件。
INSERT INTO mtb_cardset (id, name_jp, name_en, release_date, special_flg, rank,
                         display_side_menu_flg, arena_legal_flg, rarity_display_flg,
                         branch_display_flg, single_and_packbox_display_flg)
VALUES (900000701, 'E2Eテストセット', 'E2E Test Set', now(), false, 0,
        false, false, true, true, true)
ON CONFLICT (id) DO UPDATE SET name_en = EXCLUDED.name_en, name_jp = EXCLUDED.name_jp;

SELECT seed_resync('mtb_rarity',      'id', 900000999);
SELECT seed_resync('mtb_card_layout', 'id', 900000999);
SELECT seed_resync('mtb_cardtype',    'id', 900000999);
SELECT seed_resync('mtb_color',       'id', 900000999);
SELECT seed_resync('mtb_cardset',     'id', 900000999);
COMMIT;
