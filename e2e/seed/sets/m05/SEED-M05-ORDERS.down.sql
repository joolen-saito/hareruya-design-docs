-- 撤去: SEED-M05-ORDERS（自セットの帯IDのみ。他セット SEED-M05-15-ORDER(9000003 01/401/501) は壊さない）。
-- 共有会員 900000201 は、参照する受注が残っていない場合に限り削除する（15-ORDER 併用時の破壊を防ぐ）。
BEGIN;
DELETE FROM dtb_order_item WHERE id BETWEEN 900000411 AND 900000450;
DELETE FROM dtb_shipping   WHERE id BETWEEN 900000511 AND 900000550;
DELETE FROM dtb_order      WHERE id BETWEEN 900000311 AND 900000350;

-- 共有会員は他に参照受注が無ければ撤去（15-ORDER の 900000301 が残っていれば残す）。
DELETE FROM dtb_customer c
 WHERE c.id = 900000201
   AND NOT EXISTS (SELECT 1 FROM dtb_order o WHERE o.customer_id = 900000201);

SELECT seed_resync('dtb_order_item', 'id', 0);
SELECT seed_resync('dtb_shipping',   'id', 0);
SELECT seed_resync('dtb_order',      'id', 0);
SELECT seed_resync('dtb_customer',   'id', 0);
COMMIT;
