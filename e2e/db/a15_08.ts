/**
 * A15-08 カード検索（デッキビルダーの API）の DB の参照と、E2E が作ったカードへの書き足し
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通し、持ち主（実行の印つきのカード名のカード）を確かめてから書く。
 */
import { query } from "../lib/db";
import { insertOwnRows, Owner, updateOwnRows } from "../lib/db_write";

export type マスター = "カード種別" | "サブタイプ" | "色" | "レアリティ";
const 表: Record<マスター, string> = { カード種別: "mtb_cardtype", サブタイプ: "mtb_subtype", 色: "mtb_color", レアリティ: "mtb_rarity" };

/** マスターの日本語名の行の番号（1件でなければ投げる） */
export function マスターの番号(種別: マスター, 日本語名: string): string {
  const rows = query(`select id::text as id from ${表[種別]} where name_jp = $1 order by id`, [日本語名]);
  if (rows.length !== 1) throw new Error(`${種別}「${日本語名}」の行が1件でない（${rows.length}件）`);
  return String(rows[0].id);
}

/** フォーマット名(日)の、削除されていないフォーマットの番号（1件でなければ投げる） */
export function フォーマットの番号(名日: string): string {
  const rows = query(`select id::text as id from mtb_format where name_jp = $1 and deleted_at is null order by id`, [名日]);
  if (rows.length !== 1) throw new Error(`フォーマット「${名日}」が1件でない（${rows.length}件）`);
  return String(rows[0].id);
}

/** カード名(英)のカードの番号（1件でなければ投げる） */
export function カードの番号(名英: string): string {
  const rows = query(`select id::text as id from mtb_card where name_en = $1 order by id`, [名英]);
  if (rows.length !== 1) throw new Error(`カード名(英)「${名英}」のカードが1件でない（${rows.length}件）`);
  return String(rows[0].id);
}

/** カードのカード詳細の番号（古い順） */
export function カード詳細の番号(カードID: string): string[] {
  return query(`select id::text as id from mtb_card_detail where card_id = $1::int order by id`, [カードID]).map((r) => String(r.id));
}

/** カード詳細が、実行の印を含むカード名(英)のカードのものか */
const 詳細の持ち主 = (印: string): Owner => ({
  sql: `select d.id from mtb_card_detail d join mtb_card c on c.id = d.card_id where c.name_en like '%' || $1 || '%'`,
  params: [印],
});
/** カードが、実行の印を含むカード名(英)のカードか */
const カードの持ち主 = (印: string): Owner => ({ sql: `select c.id from mtb_card c where c.name_en like '%' || $1 || '%'`, params: [印] });

/** 画面で指定できない「日本語のカード画像URL」を、E2E が作ったカード詳細に足す（シード表の「DBへ直接設定する」） */
export function 日本語の画像を足す(what: string, 詳細ID: string, url: string, 印: string): void {
  insertOwnRows(what, {
    table: "mtb_card_image", parentColumn: "card_detail_id",
    rows: [{ card_detail_id: 詳細ID, language_id: 1, back_flg: false, url, dead_link_flg: false, create_date: new Date().toISOString() }],
    owner: 詳細の持ち主(印),
  });
}

/** 画面で指定できない「更新日時」を、E2E が作ったカードに書く（日本時間の値で書く） */
export function カードの更新日時を書く(what: string, カードIDs: string[], 日本時間: string, 印: string): void {
  updateOwnRows(what, { table: "mtb_card", key: "id", ids: カードIDs, set: { update_date: `${日本時間}+09` }, owner: カードの持ち主(印) });
}

/** カード全体の登録件数 */
export function カードの件数(): number {
  return Number(query(`select count(*)::text as n from mtb_card`)[0].n);
}

/** カードの更新日時（日本時間の「YYYY-MM-DD HH24:MI:SS」） */
export function カードの更新日時(カードID: string): string {
  const rows = query(`select to_char(update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as d from mtb_card where id = $1::int`, [カードID]);
  return rows.length ? String(rows[0].d) : "（カードが無い）";
}
