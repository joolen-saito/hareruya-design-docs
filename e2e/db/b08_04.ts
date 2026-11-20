/**
 * B08-04 必須項目が空欄の会員発生通知バッチのシードと確かめのための DB の参照と書き込み。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 読むのは lib/db.ts の query（参照だけ）。書くのは、E2E がフロントの会員登録で作った会員（メールアドレスに実行の印）の行の、
 * 画面で作れない状態（必須項目の空欄・退会者フラグ）とシード表の値だけ（依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）。
 * 通知先のメールアドレス（追加システム設定。全員が使う1件だけの設定）は読むだけで、書き換えない。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";

/** 追加システム設定の「必須項目が空欄である会員送信メールアドレス」。未設定なら null */
export function 通知先のメールアドレス(): string | null {
  const r = query("select option_value as v from mtb_option where option_key = $1", ["check_bric_mail_address"]);
  const v = r[0]?.v;
  return v ? String(v) : null;
}

/** マスタの国・都道府県の番号（名称で引く。開発環境の国の「日本」は英語の名称「Japan」で入っている） */
export function 国の番号(名称: string[]): string {
  const r = query("select id::text as id, name from mtb_country where name = any($1::text[]) order by id", [`{${名称.join(",")}}`]);
  if (r.length === 0) throw new Error(`国のマスタに ${名称.join("・")} が無い`);
  return String(r[0].id);
}
export function 都道府県の番号(名称: string): string {
  const r = query("select id::text as id from mtb_pref where name = $1", [名称]);
  if (r.length !== 1) throw new Error(`都道府県のマスタの「${名称}」が ${r.length} 件`);
  return String(r[0].id);
}

export type 会員の項目 = {
  country_id: string | null; pref_id: string | null; name01: string | null; name02: string | null;
  tel01: string | null; tel02: string | null; tel03: string | null; addr01: string | null; addr02: string | null; addr03: string | null;
  postal_code: string | null; del_flg?: boolean;
};

/** E2E の会員（メールアドレスに実行の印）の項目を、シード表の値（空欄は NULL）にする */
export function 会員の項目を書く(what: string, 会員ID: string, 印つきのメール: string, v: 会員の項目): void {
  updateOwnRows(what, {
    table: "dtb_customer", key: "id", ids: [会員ID],
    set: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined)) as Record<string, string | boolean | null>,
    owner: { sql: "select c.id from dtb_customer c where c.email = $1", params: [印つきのメール] },
  });
}

/** 会員の住所3と名前(姓)（014 の「書き換えない」の確かめ） */
export function 会員の住所3と姓(会員ID: string): { 住所3: string | null; 姓: string | null } | null {
  const r = query("select addr03 as a, name01 as n from dtb_customer where id = $1::int", [会員ID]);
  if (!r[0]) return null;
  return { 住所3: (r[0].a ?? null) as string | null, 姓: (r[0].n ?? null) as string | null };
}

/** 会員がいるか（確かめの回で控えを使い回すとき） */
export function 会員がいる(会員ID: string, メール: string): boolean {
  return Number(query("select count(*)::text as n from dtb_customer where id = $1::int and email = $2", [会員ID, メール])[0]?.n ?? 0) === 1;
}
