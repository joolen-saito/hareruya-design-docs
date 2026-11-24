/**
 * A14-03 カード情報1件の取得（GET /card?name=&lang=）の DB の参照。参照だけ（lib/db.ts は読み取り専用）。
 * 物理名はこのファイルの SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる。
 */
import { query } from "../lib/db";

/** 英語名のカードの番号（無ければ null。2件以上あれば投げる） */
export function 英語名のカードの番号(名英: string): string | null {
  const r = query(`select id::text as id from mtb_card where name_en = $1 order by id`, [名英]);
  if (r.length > 1) throw new Error(`カード（英語名「${名英}」）が ${r.length} 件ある（1件のはず）`);
  return r.length ? String(r[0].id) : null;
}

/** 英語名のカードセットの番号（無ければ null） */
export function 英語名のカードセットの番号(名英: string): string | null {
  const r = query(`select id::text as id from mtb_cardset where name_en = $1 order by id`, [名英]);
  if (r.length > 1) throw new Error(`カードセット（英語名「${名英}」）が ${r.length} 件ある（1件のはず）`);
  return r.length ? String(r[0].id) : null;
}

/** カードのカード詳細の番号（詳細が無ければ空。複数あれば全部） */
export function カード詳細の番号(カードID: string): string[] {
  return query(`select id::text as id from mtb_card_detail where card_id = $1::int order by id`, [カードID]).map((r) => String(r.id));
}

/** アドレスが一致するカード画像の番号と言語（そのカードのもの）。無ければ null */
export function 画像の番号(カードID: string, アドレス: string): { 番号: string; 言語: string } | null {
  const r = query(
    `select i.id::text as id, i.language_id::text as l from mtb_card_image i join mtb_card_detail d on d.id = i.card_detail_id
      where d.card_id = $1::int and i.url = $2 order by i.id`, [カードID, アドレス]);
  return r.length ? { 番号: String(r[0].id), 言語: String(r[0].l) } : null;
}

/** プロモ種別の英語名のうち、ノンプロモ以外の1つ */
export function プロモ種別の英語名(): string {
  const r = query(`select name_en from mtb_promotion where id <> 1 order by id limit 1`);
  if (!r.length) throw new Error("プロモ種別にノンプロモ以外が無い");
  return String(r[0].name_en);
}
