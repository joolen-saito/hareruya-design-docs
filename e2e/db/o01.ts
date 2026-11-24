/**
 * 試験端末（MTGバイヤー）の手動試験用データ（O01-01・O01-02）のDB操作。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 書くのは、画面で作れない値（査定番号・申込日時・フリーコメントの自動入力の取り消し・本人確認の種別・登録番号の確認・
 * 査定担当者・ステータスの戻し）だけ。書く相手は、この手順書用に画面で作った受注（申込者の姓が「査定O0101-」で始まる）に限る
 * （db/write_adapter.ts の書き込みが、対象の行が印「査定O0101-」を含むことを確かめる）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

/** 書き込みの印。手順書用の受注の申込者の姓の頭（シード表のお客様名「査定O0101-N 太郎」） */
export const 印 = "査定O0101-";

const 親の確かめ = "select o.id, o.last_name from dtb_otc_buy_order o where o.id = $1::int";

export const 店頭買取ステータスID: Record<string, number> = { 買取成立: 1, 買取キャンセル: 2, 査定前: 5, 査定中: 6, 査定中断: 8, 査定再開: 9, 経理払い出し待ち: 10, 入庫待ち: 13 };
export const 身分証種別ID: Record<string, number> = { 自動運転免許証: 1, 自動車運転免許証: 1, パスポート: 2, 健康保険被保険者証: 3 };

/** 申込者の姓（と名）で受注IDを探す。無ければ null、2件以上なら止める */
export function 姓で受注IDを探す(姓: string, 名: string): string | null {
  const r = query("select id::text as id from dtb_otc_buy_order where last_name = $1 and first_name = $2 order by id", [姓, 名]);
  if (r.length > 1) throw new Error(`申込者「${姓} ${名}」の店頭買取の受注が ${r.length} 件ある（1件のはず）`);
  return r[0]?.id ?? null;
}

export type 受注の記載値 = {
  査定番号: string;
  /** 例: 2026-10-01 10:00:00（日本時間） */
  申込日時: string;
  ステータス: string;
  担当の管理者ID: string | null;
  フリーコメント: string | null;
  本人確認の種別: string | null;
  適格請求書発行事業者: boolean;
  /** 登録番号の確認の値。null（値なし）は false（画面の既定。空は入れられない） */
  登録番号の確認: boolean | null;
  電話連絡: boolean;
  大会参加: boolean;
  返却サプライ: string | null;
};

/** 受注を、シード表の記載の値にする（作った直後と、手順書の実施で変わったあとの戻しの両方で使う）。書いた行数は1行 */
export function 受注を記載の値にする(理由: string, 受注ID: string, v: 受注の記載値): void {
  if (!/^\d+$/.test(受注ID)) throw new Error(`受注IDが数字でない（${受注ID}）`);
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v.申込日時)) throw new Error(`申込日時の形が違う（${v.申込日時}）`);
  const st = 店頭買取ステータスID[v.ステータス];
  if (!st) throw new Error(`ステータス「${v.ステータス}」が表に無い`);
  const idn = v.本人確認の種別 === null ? "" : String(身分証種別ID[v.本人確認の種別] ?? "");
  if (v.本人確認の種別 !== null && !idn) throw new Error(`本人確認の種別「${v.本人確認の種別}」が表に無い`);
  const n = writeTestData({
    理由,
    sql: `update dtb_otc_buy_order set assessment_id = $2, apply_date = $3::timestamptz, otc_buy_order_status_id = $4::int,
            member_id = nullif($5, '')::int, free_comment = nullif($6, ''), identification_id = nullif($7, '')::int,
            qualified_invoice_issuer_flg = $8::boolean, qualified_invoice_issuer_confirmation_flg = $9::boolean,
            call_flg = $10::boolean, playing_flg = $11::boolean, return_supply = nullif($12, '')
          where id = $1::int`,
    params: [受注ID, v.査定番号, `${v.申込日時}+09`, st, v.担当の管理者ID ?? "", v.フリーコメント ?? "", idn,
      String(v.適格請求書発行事業者), String(v.登録番号の確認 ?? false), String(v.電話連絡), String(v.大会参加), v.返却サプライ ?? ""],
    対象の確かめ: 親の確かめ, 確かめのparams: [受注ID], 印, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`${理由}: 書いた行が ${n} 行（1行のはず）`);
}

/** 受注の今の査定番号・ステータス（作り直しの要否の確かめ） */
export function 受注の今(受注ID: string): { 査定番号: string; ステータスID: string; 姓: string } | null {
  const r = query("select assessment_id, otc_buy_order_status_id::text as s, last_name from dtb_otc_buy_order where id = $1::int", [受注ID])[0];
  return r ? { 査定番号: String(r.assessment_id ?? ""), ステータスID: String(r.s ?? ""), 姓: String(r.last_name ?? "") } : null;
}

/** 商品名の商品ID（無ければ null。2件以上なら止める） */
export function 商品名で商品IDを探す(名前: string): string | null {
  const r = query("select id::text as id from dtb_product where name = $1 order by id", [名前]);
  if (r.length > 1) throw new Error(`商品名「${名前}」の商品が ${r.length} 件ある（1件のはず）`);
  return r[0]?.id ?? null;
}

/** 商品コードの商品規格ID（無ければ null。2件以上なら止める） */
export function 商品コードで規格IDを探す(コード: string): string | null {
  const r = query("select id::text as id from dtb_product_class where product_code = $1 order by id", [コード]);
  if (r.length > 1) throw new Error(`商品コード「${コード}」の商品規格が ${r.length} 件ある（1件のはず）`);
  return r[0]?.id ?? null;
}

/** 部門名の部門ID（無ければ null） */
export function 部門名で部門IDを探す(名前: string): string | null {
  const r = query("select id::text as id from mtb_section where name = $1 order by id", [名前]);
  return r[0]?.id ?? null;
}

/** ログインIDの管理者ID（無ければ null） */
export function ログインIDで管理者IDを探す(ログインID: string): string | null {
  return query("select id::text as id from dtb_member where login_id = $1", [ログインID])[0]?.id ?? null;
}

/** 言語「日本語」の言語ID */
export function 日本語の言語ID(): string {
  const r = query("select id::text as id from mtb_language where name_jp = '日本語'");
  if (r.length !== 1) throw new Error(`言語「日本語」が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 商品の、日本語・NM の商品規格ID（無い・2件以上なら止める。CSV の取り込みが終わるまで待つのは呼ぶ側） */
export function 商品の日本語NM規格ID(商品ID: string): string | null {
  const r = query(`select c.id::text as id from dtb_product_class c join mtb_card_condition k on k.id = c.card_condition_id
    where c.product_id = $1::int and c.language_id = 1 and k.code = 'NM' order by c.id`, [商品ID]);
  if (r.length > 1) throw new Error(`商品ID ${商品ID} の日本語・NM の規格が ${r.length} 件ある（1件のはず）`);
  return r[0]?.id ?? null;
}
