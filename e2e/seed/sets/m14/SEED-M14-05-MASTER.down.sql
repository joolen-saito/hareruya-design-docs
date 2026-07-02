-- 撤去: SEED-M14-05-MASTER。
-- 基盤fixture由来のコアマスタ(Common/Normal/Creature/White/Blue)は他機能も使うため削除しない。
-- E2E専用に追加した帯IDのカードセットのみ撤去する。
-- なお valid.csv 取込で作られたテストカードは、取込テスト側の後始末で英語名 'E2E Test Card%' により撤去する。
BEGIN;
DELETE FROM mtb_cardset WHERE id = 900000701;
SELECT seed_resync('mtb_cardset', 'id', 0);
COMMIT;
