/**
 * M08-05 ポイント付与・M08-06 ポイント履歴・M08-07 メール送信履歴の DB の照会と、E2E の会員の行だけへの書き足し（lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足すのは画面で作れない状態だけ（ポイント残高・ポイント履歴の設定日と行・選手情報なし・メール履歴の処理日とテンプレート）。
 * 持ち主の確かめは「メールアドレスがこの実行の印で終わる会員（とその選手情報・ポイント履歴・メール履歴）」。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertOwnRows, Owner, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 印のメール = (): string => `%-${RUN_MARK}@example.test`;
const 会員の持ち主 = (): Owner => ({ sql: `select c.id from dtb_customer c where c.email like $1`, params: [印のメール()] });
const 選手情報の持ち主 = (): Owner => ({ sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where c.email like $1`, params: [印のメール()] });
const ポイント履歴の持ち主 = (): Owner => ({ sql: `select h.id from dtb_point_history h join dtb_customer c on c.id = h.customer_id where c.email like $1`, params: [印のメール()] });
const メール履歴の持ち主 = (): Owner => ({ sql: `select h.id from dtb_mail_history h join dtb_customer c on c.id = h.customer_id where c.email like $1`, params: [印のメール()] });

// ---- 照会 ----

/** 会員の選手情報ID（無ければ空） */
export function 選手情報ID(会員ID: string): string {
  return String(query(`select p.id from dtb_player p where p.customer_id = $1::int and p.deleted_at is null order by p.id`, [会員ID])[0]?.id ?? "");
}
export function ポイント残高(会員ID: string): number | null {
  const r = query(`select p.point from dtb_player p where p.customer_id = $1::int and p.deleted_at is null`, [会員ID])[0];
  return r ? Number(r.point) : null;
}
/** メールアドレスの会員の会員ID（無ければ空） */
export function 会員IDをメールで(メール: string): string {
  return String(query(`select c.id from dtb_customer c where lower(c.email) = lower($1) order by c.id`, [メール])[0]?.id ?? "");
}
export function 会員があるか(会員ID: string): boolean {
  return Number(query(`select count(*) as n from dtb_customer where id = $1::int`, [会員ID])[0]?.n ?? 0) > 0;
}
/** ポイント種別のマスタ（ID → 名前） */
export function ポイント種別(): Record<string, string> {
  return Object.fromEntries(query(`select t.id::text as id, t.name as name from mtb_point_type t order by t.id`).map((r) => [String(r.id), String(r.name)]));
}
export function 受注ID(注文番号: string): string {
  return String(query(`select o.id from dtb_order o where o.order_no = $1`, [注文番号])[0]?.id ?? "");
}

export type ポイント履歴の行 = { 履歴ID: string; 受注ID: string | null; 種別: string | null; 増減量: number; 備考: string | null; 発行日: string; 設定日: string | null };
/** 会員のポイント履歴（履歴IDの昇順） */
export function ポイント履歴(会員ID: string): ポイント履歴の行[] {
  return query(
    `select h.id::text as "履歴ID", h.order_id::text as "受注ID", h.point_type_id::text as "種別", h.point_change::text as "増減量", h.note as "備考",
            to_char(h.issue_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD') as "発行日", to_char(h.create_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD') as "設定日"
       from dtb_point_history h where h.customer_id = $1::int order by h.id`, [会員ID],
  ).map((r) => ({ 履歴ID: String(r["履歴ID"]), 受注ID: r["受注ID"], 種別: r["種別"], 増減量: Number(r["増減量"]), 備考: r["備考"], 発行日: String(r["発行日"]), 設定日: r["設定日"] }));
}

export type メール履歴の行 = { 履歴ID: string; 会員ID: string; テンプレートID: string | null; 処理日: string; 件名: string | null; 本文: string | null };
/** 会員のメール履歴（履歴IDの昇順） */
export function メール履歴(会員ID: string): メール履歴の行[] {
  return query(
    `select h.id::text as "履歴ID", h.customer_id::text as "会員ID", h.template_id::text as "テンプレートID",
            to_char(h.send_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS') as "処理日", h.mail_subject as "件名", h.mail_body as "本文"
       from dtb_mail_history h where h.customer_id = $1::int order by h.id`, [会員ID],
  ).map((r) => ({ 履歴ID: String(r["履歴ID"]), 会員ID: String(r["会員ID"]), テンプレートID: r["テンプレートID"], 処理日: String(r["処理日"]), 件名: r["件名"], 本文: r["本文"] }));
}
export function メール履歴の数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_mail_history where customer_id = $1::int`, [会員ID])[0]?.n ?? 0);
}

export type メールテンプレート = { ID: string; 名前: string; 件名: string };
/** 開発環境に既にあるメールテンプレート（ID の昇順の先頭 n 件。メール配信履歴画面の「テンプレートで絞り込む」の並びと同じ） */
export function 既存のメールテンプレート(n: number): メールテンプレート[] {
  return query(`select m.id::text as "ID", m.name as "名前", coalesce(m.mail_subject, '') as "件名" from dtb_mail_template m order by m.id limit $1::int`, [n])
    .map((r) => ({ ID: String(r["ID"]), 名前: String(r["名前"]), 件名: String(r["件名"]) }));
}
export function メールテンプレートの件名(ID: string): string {
  return String(query(`select coalesce(m.mail_subject, '') as s from dtb_mail_template m where m.id = $1::int`, [ID])[0]?.s ?? "");
}

// ---- 書き足し（E2E の会員の行だけ） ----

/** 選手情報のポイント残高を書き換える（ポイント付与の画面は履歴と同時に残高を増減するので、履歴と合わない残高は画面で作れない） */
export function ポイント残高を設定する(what: string, 会員ID: string, ポイント: number): void {
  const id = 選手情報ID(会員ID);
  if (!id) throw new Error(`${what}: 会員ID ${会員ID} の選手情報が無い`);
  updateOwnRows(what, { table: "dtb_player", key: "id", ids: [id], set: { point: ポイント }, owner: 選手情報の持ち主() });
}

/** 会員の選手情報を消す（正本の作り方: 当該会員の選手情報を DB で削除） */
export function 選手情報を消す(what: string, 会員ID: string): void {
  const id = 選手情報ID(会員ID);
  if (!id) return;
  deleteOwnRows(what, { table: "dtb_player", key: "id", ids: [id], owner: 選手情報の持ち主() });
}

/** ポイント履歴の設定日（作成日時）を書き換える（画面で指定できない） */
export function ポイント履歴の設定日を設定する(what: string, 履歴ID: string, 設定日: string): void {
  updateOwnRows(what, { table: "dtb_point_history", key: "id", ids: [履歴ID], set: { create_date: `${設定日} 12:00:00+09` }, owner: ポイント履歴の持ち主() });
}

export type 足す履歴 = { 受注ID?: string; 種別: "付与型" | "購入型"; 増減量: number; 備考: string; 発行日: string; 設定日: string };
/** ポイント履歴を足す（備考の文言と設定日を画面で指定できない）。履歴IDは DB が振る */
export function ポイント履歴を足す(what: string, 会員ID: string, rows: 足す履歴[]): void {
  insertOwnRows(what, {
    table: "dtb_point_history", parentColumn: "customer_id", owner: 会員の持ち主(),
    rows: rows.map((r) => ({
      customer_id: 会員ID, order_id: r.受注ID ?? null, point_type_id: r.種別 === "付与型" ? 1 : 2, point_change: r.増減量, note: r.備考,
      issue_date: `${r.発行日} 00:00:00+09`, create_date: `${r.設定日} 12:00:00+09`,
    })),
  });
}

/** メール履歴の処理日（送信日時）とテンプレートを書き換える（画面で指定できない） */
export function メール履歴を設定する(what: string, 履歴ID: string, v: { 処理日: string; テンプレートID?: string | null }): void {
  const set: Record<string, string | null> = { send_date: `${v.処理日} 12:00:00+09` };
  if (v.テンプレートID !== undefined) set.template_id = v.テンプレートID;
  updateOwnRows(what, { table: "dtb_mail_history", key: "id", ids: [履歴ID], set, owner: メール履歴の持ち主() });
}
