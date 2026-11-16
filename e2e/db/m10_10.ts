/**
 * M10-10 CSV出力項目設定 の DB 準備と DB 確認。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 足すもの（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」・2026-11-11「ちゃんと元に戻してね」）:
 *  - 専用の CSV 種別（名称に実行の印を付ける）と、その種別に属する出力項目。どちらも印つきの新しい行だけ。
 *  - 足す前に registerRestore で「消す」ことを登録する。ケースの終わりに（成否によらず）基盤が逆順に消し、消せたかを DB の参照で確かめる。
 *  - 既存の行（標準の CSV 種別・標準の出力項目）は DB で書き換えない。
 * 種別の番号:
 *  - 種別の番号の列は 16 ビットの整数（最大 32767）。シード表の 91023 は入らないので、空いている番号に代える（画面では番号を使わない）。
 *  - シード表の番号が空いていればそれを使い、塞がっていれば次の空きを使う（既存の行を上書きしない）。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertMarkedRows, insertOwnRows } from "../lib/db_write";
import { registerRestore } from "../lib/shared_restore";
import { RUN_MARK } from "../lib/run_marker";

export type 出力項目の定義 = { 表示名: string; 有効: boolean; 並び順: number };
export type 専用の種別 = { 種別ID: string; 名称: string; 項目ID: string[] };

/** 種別の名称に実行の印が入っていることを持ち主の確かめにする（名称は1つに絞る） */
const 種別の持ち主 = (名称: string) => ({
  sql: `select id from mtb_csv_type where name = $1 and position($2 in name) > 0`,
  params: [名称, RUN_MARK] as (string | number)[],
});
const 項目の持ち主 = (名称: string) => ({
  sql: `select c.id from dtb_csv c join mtb_csv_type t on t.id = c.csv_type_id where t.name = $1 and position($2 in t.name) > 0`,
  params: [名称, RUN_MARK] as (string | number)[],
});

function 空いている種別ID(希望: number): number {
  for (let id = 希望; id < 32000; id++) {
    if (query(`select 1 as x from mtb_csv_type where id = $1::int`, [id]).length === 0) return id;
  }
  throw new Error("CSV種別の空いている番号が無い");
}

function 種別の件数(名称: string): number {
  return Number(query(`select count(*) as n from mtb_csv_type where name = $1`, [名称])[0].n);
}
function 項目の件数(名称: string): number {
  return Number(query(`select count(*) as n from dtb_csv c join mtb_csv_type t on t.id = c.csv_type_id where t.name = $1`, [名称])[0].n);
}

/** 名称の種別と、その項目を消す（無ければ何もしない）。消したあとは件数を呼び出し側が確かめる */
export function 専用の種別を消す(what: string, 名称: string): void {
  const ids = query(`select c.id from dtb_csv c join mtb_csv_type t on t.id = c.csv_type_id where t.name = $1 order by c.id`, [名称]).map((r) => String(r.id));
  if (ids.length) deleteOwnRows(what, { table: "dtb_csv", key: "id", ids, owner: 項目の持ち主(名称) });
  const types = query(`select id from mtb_csv_type where name = $1`, [名称]).map((r) => String(r.id));
  if (types.length) deleteOwnRows(what, { table: "mtb_csv_type", key: "id", ids: types, owner: 種別の持ち主(名称) });
}

/**
 * 専用の CSV 種別と出力項目を足す。足す前に「消す」ことを登録する（ケースの終わりに消し、消えたことを DB の参照で確かめる）。
 * 名称は rc() で実行の印を付けたものを渡す。同じ名称が既にあれば（前の実行の残り）足さずに止める。
 */
export function 専用の種別を足す(what: string, v: { 希望ID: number; 名称: string; 表示順: number; 項目: 出力項目の定義[] }): 専用の種別 {
  if (!v.名称.includes(RUN_MARK)) throw new Error(`${what}: 名称に実行の印が無い`);
  if (種別の件数(v.名称) > 0) throw new Error(`${what}: 名称「${v.名称}」の CSV 種別が既にある（前の実行の残り）。既存の行は上書きしない`);
  registerRestore(
    `専用のCSV種別「${v.名称}」と出力項目`,
    { 足した種別: v.名称 },
    async () => { 専用の種別を消す(`${what} の後始末`, v.名称); },
    async () => 種別の件数(v.名称) === 0 && 項目の件数(v.名称) === 0,
  );
  const id = 空いている種別ID(v.希望ID);
  insertMarkedRows(what, { table: "mtb_csv_type", key: "id", markColumn: "name", rows: [{ id, name: v.名称, sort_no: v.表示順 }] });
  const now = new Date().toISOString();
  insertOwnRows(what, {
    table: "dtb_csv", parentColumn: "csv_type_id", owner: 種別の持ち主(v.名称),
    rows: v.項目.map((x) => ({
      csv_type_id: id, entity_name: "Eccube\\Entity\\Order", field_name: "id", reference_field_name: null, disp_name: x.表示名,
      sort_no: x.並び順, enabled: x.有効, create_date: now, update_date: now, creator_id: null, column_name: null,
    })),
  });
  const 項目ID = query(`select id from dtb_csv where csv_type_id = $1::int order by id`, [id]).map((r) => String(r.id));
  if (項目ID.length !== v.項目.length) throw new Error(`${what}: 足した出力項目が ${項目ID.length} 件（${v.項目.length} 件のはず）`);
  return { 種別ID: String(id), 名称: v.名称, 項目ID };
}

export type 項目の状態 = { 表示名: string; 有効: boolean; 並び順: number };

/** 名称の CSV 種別に属する全出力項目の、有効・無効と並び順（表示名の順） */
export function 出力項目の状態(種別名: string): 項目の状態[] {
  return query(
    `select c.disp_name as "表示名", c.enabled as "有効", c.sort_no as "並び順"
       from dtb_csv c join mtb_csv_type t on t.id = c.csv_type_id where t.name = $1 order by c.disp_name`,
    [種別名],
  ).map((r) => ({ 表示名: r.表示名 ?? "", 有効: r.有効 === "true", 並び順: Number(r.並び順) }));
}

/** 標準の CSV 種別（番号で引く）の名称と表示順。無ければ null */
export function 標準の種別(種別ID: number): { 名称: string; 表示順: number } | null {
  const r = query(`select name as "名称", sort_no as "表示順" from mtb_csv_type where id = $1::int`, [種別ID])[0];
  return r ? { 名称: r.名称 ?? "", 表示順: Number(r.表示順) } : null;
}
