-- カードCSV取込テストで作られたカード（name_en LIKE 'E2E Test Card%'）と、
-- mtb_card を参照する全子テーブルの該当行を撤去する。取込は非べき等（英名キーで上書き）なので、
-- テスト後にこれを流して次回を決定的にする。FK列名は pg_constraint から動的に解決する。
DO $$
DECLARE
  ids int[];
  r record;
BEGIN
  SELECT array_agg(id) INTO ids FROM mtb_card WHERE name_en LIKE 'E2E Test Card%';
  IF ids IS NULL THEN RETURN; END IF;

  -- 孫: mtb_card_image は mtb_card_detail を参照するため先に削除する。
  DELETE FROM mtb_card_image
   WHERE card_detail_id IN (SELECT id FROM mtb_card_detail WHERE card_id = ANY(ids));

  -- mtb_card を参照する全FKについて、その参照元テーブル・列で該当行を削除。
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, a.attname AS col
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.confrelid = 'mtb_card'::regclass AND c.contype = 'f'
  LOOP
    EXECUTE format('DELETE FROM %s WHERE %I = ANY($1)', r.tbl, r.col) USING ids;
  END LOOP;

  DELETE FROM mtb_card WHERE id = ANY(ids);
END $$;
