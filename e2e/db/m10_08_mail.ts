/**
 * メールテンプレートのDB確認と、E2E が作る行の追加・削除（M10-08・M07-04）。物理名はこのファイルの SQL・列名にだけ書く。
 * 書き込みは lib/db_write.ts の窓口だけを通す: 足す行は「メール識別キー」に実行の印を含める。消すのも印を含む行だけ。
 * 画面に新規作成の手段が無いテンプレートだけをここで足す（決まった番号は、空いていなければ足さない）。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertMarkedRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

export type 足すテンプレート = {
  id: number; 名称: string; 件名: string; 雛形: string; 自動送信: boolean;
  本文上部?: string; 本文下部?: string; 更新者ID?: string | null; 更新日時?: string;
};
export type 保存テンプレート = { 名称: string; 件名: string; 本文上部: string; 本文下部: string; 更新者ID: string; 更新日時: string; 自動送信: boolean };

/** 番号が1つでも使われていれば、その番号の一覧を返す（空なら全部空いている） */
export function 使われている番号(ids: number[]): string[] {
  return query(`select id::text as id from dtb_mail_template where id = any(string_to_array($1, ',')::int[])`, [ids.join(",")]).map((r) => r.id as string);
}
/** 自動送信メールの共有のテンプレートが属する店舗の番号と、その本文の雛形（画面の自動送信メールテンプレートと同じ側に足すため） */
export function 自動送信の既存(): { 店舗: string; 雛形: string } {
  const r = query(`select base_info_id::text as b, file_name as f from dtb_mail_template where is_auto_send = true and file_name is not null order by id limit 1`);
  if (!r.length) throw new Error("自動送信メールの既存のテンプレートが無く、足す側の店舗と雛形が決められない");
  return { 店舗: r[0].b as string, 雛形: r[0].f as string };
}
/** 手動送信の（買取向けの雛形を使う）既存のテンプレートが属する店舗の番号 */
export function 手動送信の店舗(): string {
  const r = query(`select base_info_id::text as b from dtb_mail_template where is_auto_send = false and file_name like 'Mail/buy_order%' order by id limit 1`);
  if (!r.length) throw new Error("買取向けの手動送信テンプレートが既存に無く、足す側の店舗が決められない");
  return r[0].b as string;
}
export function 管理者の番号(ログインID: string): string {
  const r = query(`select id::text as id from dtb_member where login_id = $1`, [ログインID]);
  if (!r.length) throw new Error(`管理者 ${ログインID} がDBに無い`);
  return r[0].id as string;
}
export function 名前の管理者の番号(名前: string): string {
  const r = query(`select id::text as id from dtb_member where name = $1 order by id limit 1`, [名前]);
  if (!r.length) throw new Error(`管理者 ${名前} がDBに無い`);
  return r[0].id as string;
}

const 印のあるキー = `mail_key like '%${RUN_MARK}%'`;

/** テンプレートを足す（メール識別キーに実行の印を付ける）。店舗は足す側の店舗の番号 */
export function テンプレートを足す(理由: string, 店舗: string, 行: 足すテンプレート[]): void {
  const 使用 = 使われている番号(行.map((r) => r.id));
  if (使用.length) throw new Error(`${理由}: メールテンプレートの番号 ${使用.join("・")} が既に使われているので足さない（既存の行は上書きしない）`);
  insertMarkedRows(理由, {
    table: "dtb_mail_template", key: "id", markColumn: "mail_key",
    rows: 行.map((r) => ({
      id: r.id, base_info_id: 店舗, creator_id: r.更新者ID ?? null, mail_key: `e2e.mail.${RUN_MARK}.${r.id}`, name: r.名称, file_name: r.雛形, mail_subject: r.件名,
      create_date: r.更新日時 ?? "2026-08-01 09:10:11+09", update_date: r.更新日時 ?? "2026-08-01 09:10:11+09", deletable: "false",
      header: r.本文上部 ?? "", footer: r.本文下部 ?? "", is_auto_send: r.自動送信 ? "true" : "false", creator_name: null,
    })),
  });
}
/** 足したテンプレートを消す（印のある行だけ） */
export function テンプレートを消す(理由: string, ids: number[]): void {
  const あるもの = query(`select id::text as id from dtb_mail_template where id = any(string_to_array($1, ',')::int[])`, [ids.join(",")]).map((r) => r.id as string);
  if (あるもの.length === 0) return;
  deleteOwnRows(理由, { table: "dtb_mail_template", key: "id", ids: あるもの, owner: { sql: `select id from dtb_mail_template where ${印のあるキー}` } });
}
export function テンプレートがあるか(id: number): boolean {
  return query(`select 1 as x from dtb_mail_template where id = $1::int`, [id]).length > 0;
}
export function テンプレートを読む(id: number): 保存テンプレート | null {
  const r = query(`select name, mail_subject, coalesce(header, '') as header, coalesce(footer, '') as footer, coalesce(creator_id::text, '') as creator_id,
    to_char(update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as update_date, is_auto_send from dtb_mail_template where id = $1::int`, [id]);
  if (!r.length) return null;
  const x = r[0];
  return { 名称: x.name ?? "", 件名: x.mail_subject ?? "", 本文上部: x.header ?? "", 本文下部: x.footer ?? "", 更新者ID: x.creator_id ?? "", 更新日時: x.update_date ?? "", 自動送信: x.is_auto_send === "true" };
}
export function テンプレートの総数(): number {
  return Number(query(`select count(*) as n from dtb_mail_template`)[0].n);
}
/** 日本時間の今の日時と、引数の日時（YYYY-MM-DD HH:MM:SS）との差（秒）。絶対値 */
export function 今との差(日時: string): number {
  return Math.abs(Number(query(`select extract(epoch from (now() - ($1::timestamp at time zone 'Asia/Tokyo'))) as s`, [日時])[0].s));
}
