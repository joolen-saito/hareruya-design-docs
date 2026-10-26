-- S-M04-31-RFLOCK-141（在庫反映の開始時にロックを取れない棚卸計画）
-- 流す時点: 画面で登録する前に流す（やり直しのときの後始末。前回の残りだけを消す。登録のあとに流すと、作った行まで消えるので流さない）。手順書（S-M04-31-RFLOCK-141.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [3] 文（投入方法）: 【やり直し時の片付け（DBへ直接）】棚卸名がM0431-141-で始まる棚卸計画が残っているときは、その棚卸計画と棚卸詳細をDBで直接削除してから作り直す（棚卸計画を削除する画面が無いため）。
--     備考: 何度流しても同じ。該当が無ければ何も消えない
-- 棚卸名が「M0431-141-」で始まる棚卸計画とその棚卸詳細(と詳細の編集履歴)だけを消す。ほかの棚卸計画は消さない
DELETE FROM dtb_inventory_plan_detail_edit_history WHERE inventory_plan_detail_id IN (SELECT id FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name LIKE 'M0431-141-%' ESCAPE '\'));
DELETE FROM dtb_inventory_plan_detail WHERE inventory_plan_id IN (SELECT id FROM dtb_inventory_plan WHERE name LIKE 'M0431-141-%' ESCAPE '\');
DELETE FROM dtb_inventory_plan WHERE name LIKE 'M0431-141-%' ESCAPE '\';

COMMIT;
