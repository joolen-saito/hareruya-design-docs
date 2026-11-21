/**
 * A15-17 デッキ登録インポート（デッキビルダーの API）の DB の参照。
 * 参照だけ（lib/db.ts は読み取り専用）。物理名はこのファイルの SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる。
 */
import { query } from "../lib/db";

export type フォーマットの行 = { 番号: string; 統率を使う: boolean; デッキビルダーで利用: boolean };
export type デッキの行 = { 番号: string; 名前: string; 公開区分: string; フォーマット: string; アーキタイプ: string; プレイヤー: string };
export type 採用カード = { カード名: string; 領域: "メインボード" | "サイドボード" | "統率領域" | string; 枚数: number };

const 領域名: Record<string, string> = { "1": "メインボード", "2": "サイドボード", "3": "統率領域" };

/** カード名(日)のカードの番号（無ければ空。2件以上あれば投げる） */
export function カードの番号(名日: string): string | null {
  const r = query(`select id::text as id from mtb_card where name_jp = $1 order by id`, [名日]);
  if (r.length > 1) throw new Error(`カード名(日)「${名日}」のカードが ${r.length} 件ある（1件のはず）`);
  return r.length ? String(r[0].id) : null;
}

/** カード名(日)が前方一致するカードの数 */
export function カードの数(前方一致: string): number {
  return Number(query(`select count(*)::text as n from mtb_card where name_jp like $1 || '%'`, [前方一致])[0]?.n ?? "0");
}

/** カード名(日)・(英)のどちらかが一致するカードの数（「存在しないカード」が無いことの確かめ） */
export function 名前のカードの数(名: string): number {
  return Number(query(`select count(*)::text as n from mtb_card where name_jp = $1 or name_en = $1`, [名])[0]?.n ?? "0");
}

/** カードが持つカード画像（カードCSVの画像URL(英語)）の数 */
export function カード画像の数(カードID: string): number {
  return Number(query(`select count(*)::text as n from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id where d.card_id = $1::int`, [カードID])[0]?.n ?? "0");
}

/** フォーマット名(日)の、削除されていないフォーマット（無ければ null。2件以上あれば投げる） */
export function フォーマットを探す(名日: string): フォーマットの行 | null {
  const r = query(`select id::text as id, use_command_flg::text as c, deckbuilder_flg::text as d from mtb_format where name_jp = $1 and deleted_at is null order by id`, [名日]);
  if (r.length > 1) throw new Error(`フォーマット「${名日}」が ${r.length} 件ある（1件のはず）`);
  if (!r.length) return null;
  const t = (v: unknown) => v === "true" || v === "t" || v === "1";
  return { 番号: String(r[0].id), 統率を使う: t(r[0].c), デッキビルダーで利用: t(r[0].d) };
}

/** アーキタイプ名(日)の、そのフォーマットの削除されていないアーキタイプの番号（無ければ空） */
export function アーキタイプの番号(名日: string, フォーマット番号: string): string | null {
  const r = query(`select id::text as id from dtb_archetype where name_jp = $1 and format_id = $2::int and deleted_at is null order by id`, [名日, フォーマット番号]);
  if (r.length > 1) throw new Error(`アーキタイプ「${名日}」が ${r.length} 件ある（1件のはず）`);
  return r.length ? String(r[0].id) : null;
}

/** キャンペーンタグ名(日)の番号（無ければ空） */
export function キャンペーンタグの番号(名日: string): string | null {
  const r = query(`select id::text as id from mtb_campaign_tag where name_jp = $1 order by id`, [名日]);
  if (r.length > 1) throw new Error(`キャンペーンタグ「${名日}」が ${r.length} 件ある（1件のはず）`);
  return r.length ? String(r[0].id) : null;
}

/** 公開区分（公開・非公開・限定公開）・ユーザーデッキ種別・採用領域（メインボード・サイドボード・統率領域）のうち、登録されていないもの */
export function 参照マスタの不足(): string[] {
  const 不足: string[] = [];
  const disp = query(`select id::text as id from mtb_disp where id in (1, 2, 3)`).length;
  if (disp !== 3) 不足.push(`公開区分（公開・非公開・限定公開）が ${disp}/3 件`);
  const board = query(`select id::text as id from mtb_board where id in (1, 2, 3)`).length;
  if (board !== 3) 不足.push(`採用領域（メインボード・サイドボード・統率領域）が ${board}/3 件`);
  const type = query(`select id::text as id from mtb_deck_type where id = 2`).length;
  if (type !== 1) 不足.push("ユーザーデッキの種別が無い");
  return 不足;
}

/** プレイヤーが持つ、削除されていないデッキ（デッキ名で絞る。新しい順） */
export function プレイヤーのデッキ(プレイヤーID: string, デッキ名: string): デッキの行[] {
  return query(
    `select id::text as id, deck_name as name, coalesce(disp_id::text, '') as disp, coalesce(format_id::text, '') as fmt,
            coalesce(archetype_id::text, '') as arch, coalesce(player_id::text, '') as pid
       from dtb_deck where player_id = $1::int and deck_name = $2 and deleted_at is null order by id desc`,
    [プレイヤーID, デッキ名]).map((r) => ({ 番号: String(r.id), 名前: String(r.name), 公開区分: String(r.disp), フォーマット: String(r.fmt), アーキタイプ: String(r.arch), プレイヤー: String(r.pid) }));
}

/** デッキの番号の行（削除されていないもの。無ければ null） */
export function デッキを読む(デッキID: string): デッキの行 | null {
  const r = query(
    `select id::text as id, coalesce(deck_name, '') as name, coalesce(disp_id::text, '') as disp, coalesce(format_id::text, '') as fmt,
            coalesce(archetype_id::text, '') as arch, coalesce(player_id::text, '') as pid
       from dtb_deck where id = $1::int and deleted_at is null`, [デッキID]);
  return r.length ? { 番号: String(r[0].id), 名前: String(r[0].name), 公開区分: String(r[0].disp), フォーマット: String(r[0].fmt), アーキタイプ: String(r[0].arch), プレイヤー: String(r[0].pid) } : null;
}

/** デッキ名のデッキの数（持ち主を問わない。削除されていないもの） */
export function デッキ名の数(デッキ名: string): number {
  return Number(query(`select count(*)::text as n from dtb_deck where deck_name = $1 and deleted_at is null`, [デッキ名])[0]?.n ?? "0");
}

/** デッキの採用カード（カード名・領域・枚数。カード名と領域の順） */
export function デッキの採用カード(デッキID: string): 採用カード[] {
  return query(
    `select c.name_jp as name, dc.board_id::text as board, dc.count::text as cnt
       from dtb_deck_card dc join mtb_card c on c.id = dc.card_id where dc.deck_id = $1::int order by dc.board_id, c.name_jp`, [デッキID])
    .map((r) => ({ カード名: String(r.name), 領域: 領域名[String(r.board)] ?? `領域${r.board}`, 枚数: Number(r.cnt) }));
}

/** デッキに紐付くキャンペーンタグ名(日)（名前順） */
export function デッキのキャンペーンタグ(デッキID: string): string[] {
  return query(`select t.name_jp as name from dtb_deck_campaign_tag dt join mtb_campaign_tag t on t.id = dt.campaign_tag_id where dt.deck_id = $1::int order by t.name_jp`, [デッキID]).map((r) => String(r.name));
}

/** デッキのデッキ画像用カードのカード名(日)（無ければ空） */
export function デッキ画像のカード名(デッキID: string): string {
  const r = query(
    `select c.name_jp as name from dtb_deck d join mtb_card_image i on i.id = d.card_image_id
       join mtb_card_detail cd on cd.id = i.card_detail_id join mtb_card c on c.id = cd.card_id where d.id = $1::int`, [デッキID]);
  return r.length ? String(r[0].name) : "";
}

/** 公開区分の名前（公開・非公開・限定公開）の識別子 */
export function 公開区分の番号(名: string): string {
  const r = query(`select id::text as id from mtb_disp where name = $1`, [名]);
  if (r.length !== 1) throw new Error(`公開区分「${名}」が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}
