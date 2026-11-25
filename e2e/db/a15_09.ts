/**
 * A15-09 デッキ情報登録（デッキビルダーの API の POST /api/deck）の DB の参照。
 * 参照だけ（lib/db.ts は読み取り専用）。物理名はこのファイルの SQL の中にだけ書く。A15-17・A15-18 の参照はそのまま使う。
 */
import { query } from "../lib/db";

export { デッキの内容を読む, 区分別に読む, 区分別の文字列 } from "./a15_18";

const 数 = (sql: string, p: (string | number)[] = []): number => Number(query(sql, p)[0]?.n ?? "0");

/** デッキ本体の件数（削除済みも含む全件。追加されないことの確かめ） */
export function デッキ本体の件数(): number { return 数(`select count(*)::text as n from dtb_deck`); }

/** 採用カードの件数（メイン・サイド・統率・メイビー・アトラクション・ステッカーの全件） */
export function 採用カードの件数(): number {
  return 数(`select ((select count(*) from dtb_deck_card) + (select count(*) from dtb_maybe_card) + (select count(*) from dtb_attraction_card) + (select count(*) from dtb_sticker_card))::text as n`);
}

/** プレイヤーが持つデッキの件数（削除済みも含む） */
export function プレイヤーのデッキ件数(プレイヤーID: string): number {
  return 数(`select count(*)::text as n from dtb_deck where player_id = $1::int`, [プレイヤーID]);
}

export type 保存されたデッキ = { 存在: boolean; 名前なし: boolean; 持ち主: string; 閲覧用トークン: string; レギュレーション違反: boolean };

/** デッキ本体の保存内容（持ち主・閲覧用トークン・レギュレーション違反フラグ・デッキ名が空か） */
export function 保存されたデッキを読む(デッキID: string): 保存されたデッキ {
  const r = query(
    `select (deck_name is null or deck_name = '') as noname, coalesce(player_id::text, '') as pid, coalesce(display_token, '') as tok,
            regulation_violation_flg as v from dtb_deck where id = $1::int`, [デッキID]);
  if (!r.length) return { 存在: false, 名前なし: false, 持ち主: "", 閲覧用トークン: "", レギュレーション違反: false };
  const t = (v: unknown) => v === true || v === "true" || v === "t" || v === "1";
  return { 存在: true, 名前なし: t(r[0].noname), 持ち主: String(r[0].pid), 閲覧用トークン: String(r[0].tok), レギュレーション違反: t(r[0].v) };
}

/** デッキのカードの採用枚数（カードの番号で。メイン・サイド・統率の領域） */
export function カードの採用枚数(デッキID: string, カードID: string): number[] {
  return query(`select count::text as n from dtb_deck_card where deck_id = $1::int and card_id = $2::int order by board_id`, [デッキID, カードID]).map((r) => Number(r.n));
}

/** カードの番号が登録されていないこと（0件の数。あれば呼び出し側で止める） */
export function カード番号の数(カードID: string): number { return 数(`select count(*)::text as n from mtb_card where id = $1::int`, [カードID]); }

/** 公開範囲の番号の数 */
export function 公開範囲の数(番号: string): number { return 数(`select count(*)::text as n from mtb_disp where id = $1::int`, [番号]); }

/** 配置ボードの番号の数 */
export function 配置ボードの数(番号: string): number { return 数(`select count(*)::text as n from mtb_board where id = $1::int`, [番号]); }
