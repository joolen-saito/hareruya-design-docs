-- S-M04-31-CBNTFNOCHG-168（TC東京2Fの在庫0から増える入荷通知（計画後に在庫変動なし））
-- 流す時点: 画面で登録する前に流す（やり直しのときの後始末。前回の残りだけを消す。登録のあとに流すと、作った行まで消えるので流さない）。手順書（S-M04-31-CBNTFNOCHG-168.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [3] 文（投入方法）: やり直しのときに棚卸名が「M0431-CB168-」で始まる棚卸計画が残っている場合は、削除する画面が無いため、その棚卸計画と棚卸詳細をDBへ直接削除してから作り直す。
--     備考: 何度流しても同じ。該当が無ければ何も消えない
-- 棚卸名が「M0431-CB168-」で始まる棚卸計画とその棚卸詳細(と詳細の編集履歴)だけを消す。ほかの棚卸計画は消さない
DELETE FROM dtb_inventory_plan_detail_edit_history WHERE inventory_plan_detail_id IN (SELECT id FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name LIKE 'M0431-CB168-%' ESCAPE '\'));
DELETE FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name LIKE 'M0431-CB168-%' ESCAPE '\');
DELETE FROM dtb_inventory_plan WHERE name LIKE 'M0431-CB168-%' ESCAPE '\';

COMMIT;
