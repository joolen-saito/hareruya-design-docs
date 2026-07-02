-- 撤去: SEED-M05-PATTERN（未投入でも安全）
BEGIN;
DELETE FROM dtb_search_pattern WHERE id = 900000801;
SELECT seed_resync('dtb_search_pattern', 'id', 0);
COMMIT;
