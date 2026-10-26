-- S-M04-31-RFLOCK-141（在庫反映の開始時にロックを取れない棚卸計画）
-- 流す時点: 投入方法の「同じ商品の棚卸在庫確認をもう一度開き、「差異確認完了＆更新」を押す（差異確認済みになる。作業者と最終…」を終えたあと、次の「【やり直し時の片付け（DBへ直接）】棚卸名がM0431-141-で始まる棚卸計画…」より前。手順書（S-M04-31-RFLOCK-141.md）の「DBへ直接設定する部分（SQL）」と同じ。
BEGIN;

-- [2] 文（投入方法）: 【作成日（DBへ直接）】棚卸計画「M0431-141-A」の作成日を2026/10/10へDBで直接書き換える（作成日は登録時に自動で入り、棚卸計画新規作成にも棚卸計画編集にも入力欄が無いため）。
--     備考: 日時は日本時間(+09)として書いた。何度流しても同じ
--     備考: 画面でできない理由が文に書かれていない（文の言うとおりに作った。理由は文から読めない）
DO $$ DECLARE n bigint; BEGIN SELECT (SELECT count(*) FROM dtb_inventory_plan WHERE name = 'M0431-141-A') INTO n; IF n IS DISTINCT FROM 1 THEN RAISE EXCEPTION '棚卸計画「M0431-141-A」が1件に決まらない（%件）', n; END IF; END $$;
UPDATE dtb_inventory_plan SET create_date = TIMESTAMPTZ '2026-10-10 00:00:00+09' WHERE name = 'M0431-141-A';

COMMIT;
