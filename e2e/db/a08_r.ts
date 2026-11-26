/**
 * A08-01（トップバナーIDのトップバナー情報を取得）・A08-02（指定言語の設定済みトップバナー一覧を取得）の 002・006・007 のための DB（-r。2026-11-25）。
 * 書くのは、画像URLに実行の印（または a08 専用の目印）を入れて足した E2E のトップバナーの行と、その言語の紐づけの行だけ（lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertMarkedRows, insertOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

export type バナーの行 = { id: string; 画像URL: string; リンク: string; 表示タイプ: string };

export function バナーが無い(id: string): boolean {
  return query("select 1 from mtb_top_banner where id = $1::int", [id]).length === 0;
}
export function バナーを読む(id: string): バナーの行 | null {
  const r = query("select id::text as id, image_url, link, disp_type::text as 表示 from mtb_top_banner where id = $1::int", [id])[0];
  return r ? { id: String(r.id), 画像URL: String(r.image_url), リンク: String(r.link), 表示タイプ: String(r.表示) } : null;
}
export function 紐づく言語の数(id: string): number {
  return Number(query("select count(*)::int as n from dtb_top_banner_language where top_banner_id = $1::int", [id])[0]?.n ?? 0);
}

/** 画像URLの末尾に実行の印を付けて、E2E のトップバナーを1行足す（返すのは振られた番号） */
export function バナーを足す(what: string, a: { 画像URL: string; リンク: string; 表示タイプ: number; 代替: string; 並び順: number }): { id: string; 画像URL: string } {
  const 画像URL = `${a.画像URL}?e2e=${RUN_MARK}`;
  const [id] = insertMarkedRows(what, { table: "mtb_top_banner", key: "id", markColumn: "image_url", rows: [{ image_url: 画像URL, link: a.リンク, disp_type: a.表示タイプ, image_alt: a.代替, sort_no: a.並び順 }] });
  return { id, 画像URL };
}
const 印のバナー = (接頭: string) => ({ sql: "select id from mtb_top_banner where image_url like $1", params: [`${接頭}%?e2e=%`] });

export function バナーを言語へ紐づける(what: string, バナーID: string, 言語ID: string, 目印の接頭: string): void {
  insertOwnRows(what, { table: "dtb_top_banner_language", parentColumn: "top_banner_id", owner: 印のバナー(目印の接頭), rows: [{ top_banner_id: バナーID, language_id: 言語ID }] });
}

/** 前の実行が残した、同じ目印の E2E のバナー（と言語の紐づけ）を片づける。返すのは片づけた数 */
export function 前の実行のバナーを片づける(what: string, 目印の接頭: string): number {
  const ids = query("select id::text as id from mtb_top_banner where image_url like $1", [`${目印の接頭}%?e2e=%`]).map((r) => String(r.id));
  if (ids.length === 0) return 0;
  const 紐づき = query("select count(*)::int as n from dtb_top_banner_language where top_banner_id = any(string_to_array($1, ',')::int[])", [ids.join(",")]);
  if (Number(紐づき[0]?.n ?? 0) > 0) {
    // 言語の紐づけは1バナーにつき1行のものだけ片づける（E2E が足したのは1行ずつ）
    deleteOwnRows(`${what}: 言語の紐づけ`, { table: "dtb_top_banner_language", key: "top_banner_id", ids, owner: 印のバナー(目印の接頭) });
  }
  deleteOwnRows(`${what}: バナー`, { table: "mtb_top_banner", key: "id", ids, owner: 印のバナー(目印の接頭) });
  return ids.length;
}
