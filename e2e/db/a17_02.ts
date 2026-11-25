/**
 * A17-02 関連記事取得API の記事・関連付けの用意（外部の投稿の連携が作る行で画面からは作れないため、DB へ書く）。
 * 依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」の範囲。物理名はこのファイルの SQL の中にだけ書く。
 *
 * - 足す記事は、記事のURLの欄に実行の印つきの目印（e2e-a1702-<ケース番号>-<実行の印>-<連番>）を入れ、E2E の行と分かるようにする。
 * - 関連付けの行は、持ち主を「目印つきの記事」で確かめて足す・消す。関連付ける先（デッキ・アーキタイプ・カード・イベント詳細）の行は読むだけで、書き換えない。
 * - 関連付ける先は、目印つき以外の記事に1つも関連付けられていない、削除されていない既存の行から選ぶ（ほかの記事と共通の関連が混ざらない）。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertMarkedRows, insertOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

export type 対象 = "デッキ" | "アーキタイプ" | "カード" | "イベント詳細";
const 目印の前 = "e2e-a1702-";
const 持ち主: { sql: string } = { sql: `select a.id from dtb_article a where a.url like 'e2e-a1702-%'` };

const 表: Record<対象, { 関連: string; 列: string; 親: string; 削除条件: string }> = {
  デッキ: { 関連: "dtb_article_deck", 列: "deck_id", 親: "dtb_deck", 削除条件: "and p.deleted_at is null" },
  アーキタイプ: { 関連: "dtb_article_archetype", 列: "archetype_id", 親: "dtb_archetype", 削除条件: "and p.deleted_at is null" },
  カード: { 関連: "dtb_article_card", 列: "card_id", 親: "mtb_card", 削除条件: "" },
  イベント詳細: { 関連: "dtb_article_event_detail", 列: "event_detail_id", 親: "dtb_event_detail", 削除条件: "and p.deleted_at is null" },
};

/** 偽りのない形の WP投稿ID（正本の値に 8億 を足し、実在の記事の投稿IDとぶつからない値にする） */
export const 投稿ID = (正本の値: number): number => 800_000_000 + 正本の値;

/** 目印つきの記事の番号（ケース番号の記事）。古い順 */
function 記事の番号(ケース: string): string[] {
  return query(`select a.id::text as id from dtb_article a where a.url like $1 order by a.id`, [`${目印の前}${ケース}-%`]).map((r) => String(r.id));
}

/** 前の実行が残した、このケースの記事と関連付けを消す（目印つきの行だけ） */
export function 前の記事を片づける(ケース: string): void {
  const ids = 記事の番号(ケース);
  if (ids.length === 0) return;
  for (const t of Object.values(表)) {
    const 行 = query(`select x.article_id::text as id from ${t.関連} x where x.article_id = any(string_to_array($1, ',')::int[])`, [ids.join(",")]).map((r) => String(r.id));
    if (行.length === 0) continue;
    if (new Set(行).size !== 行.length) throw new Error("記事1件に同じ対象の関連付けが2行ある（1行のはず）");
    deleteOwnRows(`A17-02 ケース${ケース}: 前の関連付けを片づける`, { table: t.関連, key: "article_id", ids: 行, owner: 持ち主 });
  }
  deleteOwnRows(`A17-02 ケース${ケース}: 前の記事を片づける`, { table: "dtb_article", key: "id", ids, owner: 持ち主 });
}

/** このケースの記事以外の、どの記事にも関連付けられていない対象の行の番号（順番 番目）。足りなければ投げる */
export function 空いている対象(種類: 対象, 順番: number, ケース: string): string {
  const t = 表[種類];
  const r = query(
    `select p.id::text as id from ${t.親} p
      where true ${t.削除条件}
        and not exists (select 1 from ${t.関連} x join dtb_article a on a.id = x.article_id where x.${t.列} = p.id and a.url not like $1)
      order by p.id desc offset ${Number(順番)} limit 1`,
    [`${目印の前}${ケース}-%`]);
  if (r.length !== 1) throw new Error(`${種類}の、ほかの記事に関連付けられていない既存の行が足りない`);
  return String(r[0].id);
}

export type 記事の組 = { 基準の投稿ID: number; 関連の投稿ID: number; 関連の行数: number; 対象: { 種類: 対象; 行: string }[]; 種別ID?: number };

/** 基準記事と関連記事（行数分。同じ投稿IDで行数が複数なら、同じ投稿IDの記事を行数分）を足し、対象へ関連付ける */
export function 記事を足して関連付ける(ケース: string, 組: 記事の組): void {
  const 種別 = 組.種別ID ?? 1;
  const 今 = new Date().toISOString();
  const rows: Record<string, string | null>[] = [
    { wp_post_id: String(組.基準の投稿ID), wp_type_id: String(種別), url: `${目印の前}${ケース}-${RUN_MARK}-0`, update_date: 今, create_date: 今 },
    ...Array.from({ length: 組.関連の行数 }, (_, i) => ({ wp_post_id: String(組.関連の投稿ID), wp_type_id: String(種別), url: `${目印の前}${ケース}-${RUN_MARK}-${i + 1}`, update_date: 今, create_date: 今 })),
  ];
  insertMarkedRows(`A17-02 ケース${ケース}: 記事を足す`, { table: "dtb_article", key: "id", markColumn: "url", rows });
  const ids = 記事の番号(ケース);
  if (ids.length !== rows.length) throw new Error(`足した記事が ${ids.length} 件（${rows.length} 件のはず）`);
  for (const 対 of 組.対象) {
    const t = 表[対.種類];
    insertOwnRows(`A17-02 ケース${ケース}: ${対.種類}へ関連付ける`, {
      table: t.関連, parentColumn: "article_id", rows: ids.map((id) => ({ article_id: id, [t.列]: 対.行 })), owner: 持ち主,
    });
  }
}

/** 21件の関連記事の用意（007）。基準 + 関連を同じ対象へ */
export function 多数の記事を足す(ケース: string, 基準: number, 関連の最初: number, 関連の数: number, 対象: { 種類: 対象; 行: string }): void {
  const 今 = new Date().toISOString();
  const rows: Record<string, string | null>[] = [
    { wp_post_id: String(基準), wp_type_id: "1", url: `${目印の前}${ケース}-${RUN_MARK}-0`, update_date: 今, create_date: 今 },
    ...Array.from({ length: 関連の数 }, (_, i) => ({ wp_post_id: String(関連の最初 + i), wp_type_id: "1", url: `${目印の前}${ケース}-${RUN_MARK}-${i + 1}`, update_date: 今, create_date: 今 })),
  ];
  insertMarkedRows(`A17-02 ケース${ケース}: 記事を足す`, { table: "dtb_article", key: "id", markColumn: "url", rows });
  const ids = 記事の番号(ケース);
  if (ids.length !== rows.length) throw new Error(`足した記事が ${ids.length} 件（${rows.length} 件のはず）`);
  const t = 表[対象.種類];
  insertOwnRows(`A17-02 ケース${ケース}: ${対象.種類}へ関連付ける`, {
    table: t.関連, parentColumn: "article_id", rows: ids.map((id) => ({ article_id: id, [t.列]: 対象.行 })), owner: 持ち主,
  });
}

/** 基準記事に共通の対象で結ばれた、削除されていない関連記事の投稿IDの数（応答の件数の前提の確かめ） */
export function 関連の投稿IDの数(ケース: string): number {
  return Number(query(`select count(distinct a.wp_post_id)::text as n from dtb_article a where a.url like $1 and a.url not like $2`, [`${目印の前}${ケース}-%`, `${目印の前}${ケース}-%-0`])[0]?.n ?? "0");
}
