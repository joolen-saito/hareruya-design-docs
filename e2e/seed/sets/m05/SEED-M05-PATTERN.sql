-- SEED-M05-PATTERN : 受注検索の「保存済み検索パターン」1件（E2E-M05-01-081/082/083 用）。
--
-- ★保留(deferred)★
-- dtb_search_pattern.pattern は bytea で、SearchOrder フォームの viewData を PHP シリアライズした値。
-- 手書きの bytea を投入しても復号時に壊れる恐れが高いため、確実な手順は下記の「採取→凍結」方式:
--   1) 管理画面(base_info=2 の admin)で受注検索を実行し、任意条件で検索パターンを1件保存する。
--   2) 下記で採取:  SELECT encode(pattern,'hex') FROM dtb_search_pattern WHERE name='<保存名>';
--   3) 得た hex を下の decode(...,'hex') に貼り、id を 900000801 固定にして本ファイルを完成させる。
-- それまで E2E-M05-01-081/082/083 は spec 側の test.fixme を維持する（抜け漏れは可視化済み）。
--
-- 以下はテンプレート（採取後に <HEX_PATTERN> を置換して有効化する）。今は実行されないよう \q で終了する。
\echo 'SEED-M05-PATTERN は deferred です。README の採取手順に従って有効化してください。'
\q

BEGIN;
INSERT INTO dtb_search_pattern (id, base_info_id, name, pattern, display_key)
VALUES (900000801, 2, 'E2E受注検索パターン', decode('<HEX_PATTERN>', 'hex'), 'order')
ON CONFLICT (id) DO UPDATE SET
  base_info_id = 2, name = EXCLUDED.name, pattern = EXCLUDED.pattern, display_key = 'order';
SELECT seed_resync('dtb_search_pattern', 'id', 900000999);
COMMIT;
