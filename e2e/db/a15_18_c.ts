/**
 * A15-18 続き（030・034・045・048・049）の DB の参照・書き足し。
 * 参照は lib/db.ts（読み取り専用）。書き足しは lib/db_write.ts 経由で、E2E が作ったカードの画像の行だけ。
 * 既存の db/a15_18.ts は変えず、必要な部品はここに足す。
 */
import { query } from "../lib/db";
import { insertOwnRows, updateOwnRows } from "../lib/db_write";

export { アーキタイプの番号, カード画像の数, カードの番号, カードの最新の画像の番号 } from "./a15_18";

/** デッキのデッキ画像の番号（無ければ空） */
export function デッキ画像の番号(デッキID: string): string {
  const r = query(`select coalesce(card_image_id::text, '') as i from dtb_deck where id = $1::int`, [デッキID]);
  return r.length ? String(r[0].i) : "";
}

/** アーキタイプの画像（代表カード画像）の番号（無ければ空） */
export function アーキタイプの画像の番号(アーキタイプID: string): string {
  const r = query(`select coalesce(card_image_id::text, '') as i from dtb_archetype where id = $1::int`, [アーキタイプID]);
  return r.length ? String(r[0].i) : "";
}

/** カード画像の番号が属するカードの名前（日本語。無ければ空） */
export function 画像のカード名(カード画像ID: string): string {
  const r = query(
    `select c.name_jp as n from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id join mtb_card c on c.id = d.card_id where i.id = $1::int`, [カード画像ID]);
  return r.length ? String(r[0].n) : "";
}

export type カード画像の行 = { 番号: string; 登録日時: string };

/** カードのカード画像（表面）を、登録日時の古い順に */
export function カードの画像を登録日時の順に読む(カードID: string): カード画像の行[] {
  return query(
    `select i.id::text as id, i.create_date::text as t from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id
      where d.card_id = $1::int and i.back_flg = false order by i.create_date, i.id`, [カードID]).map((r) => ({ 番号: String(r.id), 登録日時: String(r.t) }));
}

/**
 * 同じカードに、登録日時の違うカード画像を2件そろえる（034）。E2E が作ったカード（持ち主の確かめ=呼び出し側が示すカードの番号）の画像の行だけ書く。
 * 画像が1件なら、その登録日時を古い日時にし、同じカード詳細へ新しい登録日時の行を1件足す。すでに2件以上あれば何もしない。
 * 戻り値: 登録日時が古い画像の番号・新しい画像の番号
 */
export function 登録日時の違う画像を2件にする(カードID: string): { 古い: string; 新しい: string } {
  const 名 = query(`select name_jp as n from mtb_card where id = $1::int`, [カードID])[0]?.n;
  if (!String(名 ?? "").startsWith("A1518-034-")) throw new Error(`カード ${カードID}（${String(名)}）は A15-18 034 のシードが作ったカードでない。書かずに止める`);
  const owner = { sql: `select i.id from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id join mtb_card c on c.id = d.card_id where d.card_id = $1::int and c.name_jp like 'A1518-034-%'`, params: [カードID] };
  const 既存 = カードの画像を登録日時の順に読む(カードID);
  if (既存.length >= 2) return { 古い: 既存[0].番号, 新しい: 既存[既存.length - 1].番号 };
  if (既存.length !== 1) throw new Error(`カード ${カードID} のカード画像が ${既存.length} 件（1件のはず）`);
  const 元 = query(
    `select i.card_detail_id::text as d, coalesce(i.language_id::text, '') as l, i.url as u from mtb_card_image i where i.id = $1::int`, [既存[0].番号])[0];
  updateOwnRows("A15-18 034: 既存のカード画像の登録日時を古くする", {
    table: "mtb_card_image", key: "id", ids: [既存[0].番号], set: { create_date: "2020-01-01 00:00:00+09" }, owner,
  });
  const ownerDetail = { sql: `select d.id from mtb_card_detail d join mtb_card c on c.id = d.card_id where d.card_id = $1::int and c.name_jp like 'A1518-034-%'`, params: [カードID] };
  insertOwnRows("A15-18 034: 登録日時の新しいカード画像を足す", {
    table: "mtb_card_image", parentColumn: "card_detail_id",
    rows: [{ card_detail_id: String(元.d), ...(String(元.l) ? { language_id: String(元.l) } : {}), back_flg: false, url: `${String(元.u)}?a1518-034-new`, dead_link_flg: false, create_date: "2026-11-01 00:00:00+09" }],
    owner: ownerDetail,
  });
  const 後 = カードの画像を登録日時の順に読む(カードID);
  if (後.length !== 2) throw new Error(`カード ${カードID} のカード画像を2件にしたが ${後.length} 件`);
  return { 古い: 後[0].番号, 新しい: 後[1].番号 };
}
