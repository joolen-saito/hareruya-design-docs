/** F06-04 パスワード再発行のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type リセット = { 会員ID: string; リセットキー: string | null; 有効までの時間: number | null };

/**
 * メールアドレスの会員のリセットキーと、有効期限までの時間（時間単位）。会員が1件でなければ null。
 * 有効期限は、アプリの時刻（日本時間）の壁時計の値がそのまま保存されている（DBの時刻帯は協定世界時で、保存値は実時刻より9時間先の時刻になる）。
 * そのため「発行時刻の24時間後」は、保存値の壁時計（協定世界時として読む）と、現在の日本時間の壁時計の差で測る（正本の外の補い）。
 */
export function リセットの状態(メール: string): リセット | null {
  const r = query(
    `select id, reset_key,
            extract(epoch from ((reset_expire at time zone 'UTC') - (now() at time zone 'Asia/Tokyo'))) / 3600 as hours
       from dtb_customer where email = $1 and del_flg = 0 order by id`, [メール]);
  if (r.length !== 1) return null;
  return { 会員ID: r[0].id!, リセットキー: r[0].reset_key ?? null, 有効までの時間: r[0].hours === null ? null : Number(r[0].hours) };
}

/** メールアドレスの会員（削除済み・退会済みも含む）のパスワードの保存値。会員が1件でなければ null */
export function パスワードの保存値(メール: string): string | null {
  const r = query("select password from dtb_customer where email = $1 order by id", [メール]);
  return r.length === 1 ? (r[0].password ?? "") : null;
}

/** メールアドレスの会員（削除済み・退会済みも含む）のリセットキー。会員が1件でなければ undefined、キーが無ければ null */
export function リセットキーの保存値(メール: string): string | null | undefined {
  const r = query("select reset_key from dtb_customer where email = $1 order by id", [メール]);
  return r.length === 1 ? (r[0].reset_key ?? null) : undefined;
}

/** このリセットキーを持つ会員の数 */
export function リセットキーを持つ会員数(キー: string): number {
  return Number(query("select count(*) as n from dtb_customer where reset_key = $1", [キー])[0]?.n ?? 0);
}
