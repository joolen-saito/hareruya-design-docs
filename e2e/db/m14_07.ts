/** M14-07 カードセット管理(画像ダウンロード)のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 言語ID（日本語=1・英語=2。シード「画像ダウンロード参照マスタ」の値） */
export const 日本語 = 1;
export const 英語 = 2;

export type 画像の状態 = { 言語: number; URL: string; デッドリンク: boolean };

/** 画像（裏面を除く）の言語・URL・デッドリンク */
export function 詳細の画像の状態(詳細ID: string | number): 画像の状態[] {
  return query(`select language_id as l, url, dead_link_flg as d from mtb_card_image where card_detail_id = $1 and back_flg = false order by language_id, id`, [詳細ID])
    .map((r) => ({ 言語: Number(r.l), URL: String(r.url), デッドリンク: r.d === "true" }));
}

export function 画像のデッドリンク(詳細ID: string | number, 言語: number): boolean | null {
  const r = 詳細の画像の状態(詳細ID).find((x) => x.言語 === 言語);
  return r ? r.デッドリンク : null;
}

/** 言語・プロモーションの参照マスタ（シード「画像ダウンロード参照マスタ」の確認） */
export function 言語のコード(言語ID: number): string | null {
  return query(`select code from mtb_language where id = $1`, [言語ID])[0]?.code ?? null;
}
export function プロモの英語名(プロモID: number): string | null {
  return query(`select name_en from mtb_promotion where id = $1`, [プロモID])[0]?.name_en ?? null;
}

/** カードCSVで使う、既存のレアリティ・レイアウトの英語名（共有のマスタは読むだけ） */
export function 既存のレアリティ英名(): string | null { return query(`select name_en from mtb_rarity order by id limit 1`)[0]?.name_en ?? null; }
export function 既存のレイアウト英名(): string | null { return query(`select name_en from mtb_card_layout order by id limit 1`)[0]?.name_en ?? null; }

/**
 * 取得できる（デッドリンクが偽で登録済みの）既存の画像URL。S3 にある画像の実体への読み替えに使う。
 * 画像の実体は画面から置けないので、既存のカードが使っている画像URLを、試験用のカード詳細の画像URLとして登録する。
 */
export function 既存の画像URL(言語ID: number): string | null {
  return query(`select url from mtb_card_image where language_id = $1 and back_flg = false and dead_link_flg = false and url is not null and url <> '' and length(url) < 120 order by id limit 1`, [言語ID])[0]?.url ?? null;
}

export function カード名英の詳細IDs(カード名英: string): string[] {
  return query(`select d.id from mtb_card_detail d join mtb_card c on c.id = d.card_id where c.name_en = $1 order by d.id`, [カード名英]).map((r) => String(r.id));
}

/** カード詳細の、言語ごとの画像ID（裏面を除く） */
export function 画像ID(詳細ID: string | number, 言語: number): string | null {
  return query(`select id from mtb_card_image where card_detail_id = $1 and language_id = $2 and back_flg = false order by id limit 1`, [詳細ID, 言語])[0]?.id ?? null;
}

/** リリース日がこのカードセットより新しいカードセットの数（リリース日降順の一覧での位置） */
export function より新しいセットの数(カードセットID: string | number): number {
  return Number(query(`select count(*) as n from mtb_cardset where release_date > (select release_date from mtb_cardset where id = $1)`, [カードセットID])[0].n);
}
