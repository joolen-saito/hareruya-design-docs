-- e2e/seed/lib/_helpers.sql
-- シード共通ヘルパ。apply.sh / teardown.sh が最初に流す（CREATE OR REPLACE でべき等）。
--
-- seed_resync(table, col, floor):
--   IDENTITY/serial 列に固定IDを流し込んだ後のシーケンス再同期。
--   next の採番が「既存max」または floor のどちらか大きい方の直後になるよう setval する。
--   これによりアプリ側の自動採番が予約IDバンド(900000000〜900000999)の値を再利用して衝突するのを防ぐ。
--   投入後は floor=900000999 を渡す（→ 次の自動採番は 900001000 以降）。
--   撤去後は floor=0 を渡す（→ 自然maxへ戻す）。
CREATE OR REPLACE FUNCTION seed_resync(p_table regclass, p_col text, p_floor bigint)
RETURNS void AS $$
DECLARE
  seqname text;
  curmax  bigint;
  newval  bigint;
BEGIN
  seqname := pg_get_serial_sequence(p_table::text, p_col);
  IF seqname IS NULL THEN
    RAISE NOTICE 'seed_resync: % has no owned sequence on %, skipped', p_table, p_col;
    RETURN;
  END IF;
  EXECUTE format('SELECT COALESCE(max(%I), 0) FROM %s', p_col, p_table) INTO curmax;
  newval := GREATEST(curmax, p_floor);
  IF newval < 1 THEN
    -- 空テーブル＋floor=0 の撤去後など。setval(...,0,true) は範囲外エラーになるため
    -- is_called=false で次回 nextval が 1 を返すようにする。
    PERFORM setval(seqname, 1, false);
  ELSE
    PERFORM setval(seqname, newval, true);
  END IF;
END;
$$ LANGUAGE plpgsql;
