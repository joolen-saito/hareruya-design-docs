/**
 * A15-12 デッキ情報参照（デッキビルダーの API）の DB の参照と、E2E が作った行への書き足し
 * （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通し、持ち主（実行の印つきの試験会員が所有するデッキ・名前が A1512 で始まる試験カード）を確かめてから書く。
 */
import { query } from "../lib/db";
import { Owner, insertOwnRows, updateOwnRows } from "../lib/db_write";

/** デッキが、実行の印つきの試験会員（@example.test）の選手が所有するものか */
const デッキの持ち主 = (デッキID: string, メール: string): Owner => ({
  sql: `select d.id from dtb_deck d join dtb_player p on p.id = d.player_id join dtb_customer c on c.id = p.customer_id
         where d.id = $1::int and c.email = $2 and c.email like '%@example.test'`,
  params: [デッキID, メール],
});

/** 選手が、実行の印つきの試験会員（@example.test）のものか */
const 選手の持ち主 = (選手ID: string, メール: string): Owner => ({
  sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where p.id = $1::int and c.email = $2 and c.email like '%@example.test'`,
  params: [選手ID, メール],
});

/** E2E の試験カード（英語名が A1512 で始まる）か */
const 試験カードの持ち主 = (カードID: string): Owner => ({
  sql: `select c.id from mtb_card c where c.id = $1::int and c.name_en like 'A1512%'`,
  params: [カードID],
});

/** 選手のニックネームを書く（画面で指定できない項目） */
export function ニックネームを設定する(what: string, 選手ID: string, メール: string, ニックネーム: string): void {
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: [選手ID], set: { nickname: ニックネーム }, owner: 選手の持ち主(選手ID, メール) });
}

/** デッキの限定公開トークンを書く（画面で指定できない項目） */
export function 限定公開トークンを設定する(what: string, デッキID: string, メール: string, トークン: string): void {
  updateOwnRows(what, { table: "dtb_deck", key: "id", ids: [デッキID], set: { display_token: トークン }, owner: デッキの持ち主(デッキID, メール) });
}

/** デッキの作成日時・更新日時を書く（画面で指定できない項目。日時は「2026-06-01 10:20:30+09」の形） */
export function 作成日時と更新日時を設定する(what: string, デッキID: string, メール: string, 作成: string | null, 更新: string): void {
  updateOwnRows(what, { table: "dtb_deck", key: "id", ids: [デッキID], set: { ...(作成 ? { create_date: 作成 } : {}), update_date: 更新 }, owner: デッキの持ち主(デッキID, メール) });
}

/** デッキの保存済みアーキタイプを無し（空）にする（画面で指定できない状態） */
export function アーキタイプを空にする(what: string, デッキID: string, メール: string): void {
  updateOwnRows(what, { table: "dtb_deck", key: "id", ids: [デッキID], set: { archetype_id: null }, owner: デッキの持ち主(デッキID, メール) });
}

/** デッキにキャンペーンタグを付ける（画面で指定できない関連） */
export function キャンペーンタグを付ける(what: string, デッキID: string, メール: string, タグID: string[]): void {
  insertOwnRows(what, { table: "dtb_deck_campaign_tag", parentColumn: "deck_id", rows: タグID.map((t) => ({ deck_id: デッキID, campaign_tag_id: t })), owner: デッキの持ち主(デッキID, メール) });
}

/** 試験カードのステッカー可否を書く（カードCSVに無い項目） */
export function カードのステッカー可否を設定する(what: string, カードID: string, 可: boolean): void {
  updateOwnRows(what, { table: "mtb_card", key: "id", ids: [カードID], set: { is_sticker: 可 }, owner: 試験カードの持ち主(カードID) });
}

// --- 参照 ---

/** 英語名のカードの番号（無ければ空。2件以上あれば投げる） */
export function 英語名のカード(名英: string): { 番号: string; ステッカー: boolean } | null {
  const r = query(`select id::text as id, coalesce(is_sticker, false)::text as s from mtb_card where name_en = $1 order by id`, [名英]);
  if (r.length > 1) throw new Error(`カード（英語名「${名英}」）が ${r.length} 件ある（1件のはず）`);
  return r.length ? { 番号: String(r[0].id), ステッカー: r[0].s === "true" } : null;
}

/** カードが持つカード画像のアドレス（言語の番号つき。1 日本語・2 英語） */
export function カード画像のアドレス(カードID: string): { 言語: string; アドレス: string }[] {
  return query(`select i.language_id::text as l, i.url from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id where d.card_id = $1::int order by i.id`, [カードID])
    .map((r) => ({ 言語: String(r.l), アドレス: String(r.url) }));
}

/** カードのカードタイプ・色・点数で見たマナ・サブタイプ（名前） */
export function カードの属性(カードID: string): { カードタイプ: string[]; 色: string[]; マナ: string; アトラクション: boolean } {
  const t = query(`select t.name_jp from dtb_card_cardtype cc join mtb_cardtype t on t.id = cc.cardtype_id where cc.card_id = $1::int order by t.id`, [カードID]).map((r) => String(r.name_jp));
  const c = query(`select t.name_jp from dtb_card_color cc join mtb_color t on t.id = cc.color_id where cc.card_id = $1::int order by t.id`, [カードID]).map((r) => String(r.name_jp));
  const m = query(`select cmc::text as cmc from mtb_card where id = $1::int`, [カードID])[0]?.cmc ?? "";
  const a = query(`select count(*)::text as n from dtb_card_subtype s join mtb_subtype st on st.id = s.subtype_id where s.card_id = $1::int and st.name_en = 'Attraction'`, [カードID])[0]?.n ?? "0";
  return { カードタイプ: t, 色: c, マナ: String(m), アトラクション: Number(a) > 0 };
}

/** カードタイプの番号（日本語名） */
export function カードタイプの番号(名日: string): string | null {
  const r = query(`select id::text as id from mtb_cardtype where name_jp = $1 order by id`, [名日]);
  return r.length ? String(r[0].id) : null;
}

/** 色の番号（日本語名） */
export function 色の番号(名日: string): string | null {
  const r = query(`select id::text as id from mtb_color where name_jp = $1 order by id`, [名日]);
  return r.length ? String(r[0].id) : null;
}

/** デッキタグの番号（日本語名） */
export function デッキタグの番号(名日: string): string | null {
  const r = query(`select id::text as id from mtb_deck_tag where name_jp = $1 order by id`, [名日]);
  if (r.length > 1) throw new Error(`デッキタグ「${名日}」が ${r.length} 件ある（1件のはず）`);
  return r.length ? String(r[0].id) : null;
}

/** そのデッキID（削除済みも含む）のデッキの件数 */
export function デッキの数(デッキID: string): number {
  return Number(query(`select count(*)::text as n from dtb_deck where id = $1::int`, [デッキID])[0]?.n ?? "0");
}

/** 選手のデッキ利用者ID・ニックネーム */
export function 選手の公開情報(選手ID: string): { デッキ利用者ID: string; ニックネーム: string } | null {
  const r = query(`select coalesce(deck_user_id, '') as d, coalesce(nickname, '') as n from dtb_player where id = $1::int`, [選手ID]);
  return r.length ? { デッキ利用者ID: String(r[0].d), ニックネーム: String(r[0].n) } : null;
}

export type 保存済みデッキ = { デッキ名: string; 更新日時: string; 採用カード件数: number };

/** 保存済みデッキの名前・更新日時（秒まで。日本時間）・採用カード件数 */
export function 保存済みデッキを読む(デッキID: string): 保存済みデッキ | null {
  const r = query(
    `select d.deck_name, to_char(d.update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as u,
            (select count(*) from dtb_deck_card c where c.deck_id = d.id)::text as n
       from dtb_deck d where d.id = $1::int and d.deleted_at is null`, [デッキID]);
  return r.length ? { デッキ名: String(r[0].deck_name ?? ""), 更新日時: String(r[0].u), 採用カード件数: Number(r[0].n) } : null;
}
