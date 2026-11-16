/**
 * M10-09 メール設定のDB確認と、E2E が画面で作ったメールテンプレートへの書き足し・後始末。物理名はこのファイルの SQL・列名にだけ書く。
 * 書き込みは lib/db_write.ts の窓口だけを通す。持ち主の確かめは「テンプレート名に実行の印を含む」（画面で作るとき名前に印を付ける）。
 */
import { query } from "../lib/db";
import { deleteOwnRows, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 印のテンプレート = { sql: `select id from dtb_mail_template where name like '%' || $1 || '%'`, params: [RUN_MARK] };

export type 保存されたテンプレート = { 名称: string; 件名: string; ヘッダー: string; フッター: string; 雛形: string; 更新者名: string; 更新者の記録名: string; 更新日時: string; 自動送信: boolean };

export function テンプレートを読む(id: string | number): 保存されたテンプレート | null {
  const r = query(
    `select t.name, t.mail_subject, coalesce(t.header, '') as header, coalesce(t.footer, '') as footer, coalesce(t.file_name, '') as file_name,
       coalesce(m.name, '') as creator, coalesce(t.creator_name, '') as creator_name,
       coalesce(to_char(t.update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS'), '') as update_date, t.is_auto_send::text as auto
     from dtb_mail_template t left join dtb_member m on m.id = t.creator_id where t.id = $1::int`, [String(id)]);
  if (!r.length) return null;
  const x = r[0];
  return {
    名称: x.name ?? "", 件名: x.mail_subject ?? "", ヘッダー: (x.header ?? "").replace(/\r\n/g, "\n"), フッター: (x.footer ?? "").replace(/\r\n/g, "\n"), 雛形: x.file_name ?? "",
    更新者名: x.creator ?? "", 更新者の記録名: x.creator_name ?? "", 更新日時: x.update_date ?? "", 自動送信: x.auto === "true",
  };
}
export function テンプレートがある(id: string | number): boolean {
  return query(`select 1 as x from dtb_mail_template where id = $1::int`, [String(id)]).length > 0;
}
/** メールテンプレートの全件数（モール共有の一覧。店舗ごとに分かれていない） */
export function テンプレートの全件数(): number {
  return Number(query(`select count(*) as n from dtb_mail_template`)[0].n);
}
/** 会員の、テンプレートを使った件名のメール配信履歴の件数 */
export function 配信履歴の件数(会員ID: string, テンプレートID: string, 件名: string): number {
  return Number(query(`select count(*) as n from dtb_mail_history where customer_id = $1::int and template_id = $2::int and mail_subject = $3`, [会員ID, テンプレートID, 件名])[0].n);
}
/**
 * 会員への手動メール通知で送った配信履歴（id と件名）。アプリは送信時の件名の前に「[店名] 」を付けて履歴に残す
 * （ec-cube-enterprise origin/develop の MailService::sendCustomerManualMail・MailHistoryEntityManager::save）ので、件名はその形も拾う
 */
export function 手動メールの配信履歴(会員ID: string, テンプレートID: string, 件名: string): { id: string; 件名: string }[] {
  return query(
    `select id::text as id, mail_subject from dtb_mail_history
     where customer_id = $1::int and template_id = $2::int and (mail_subject = $3 or mail_subject like '[%] ' || $3) order by id`,
    [会員ID, テンプレートID, 件名]).map((r) => ({ id: r.id ?? "", 件名: r.mail_subject ?? "" }));
}
/** E2E が作った会員（メールアドレスに実行の印）の配信履歴の件名を書き換える（シード表は送信時の件名をそのまま DB へ入れると定める） */
export function 配信履歴の件名を書く(理由: string, id: string, 件名: string): void {
  updateOwnRows(理由, {
    table: "dtb_mail_history", key: "id", ids: [id], set: { mail_subject: 件名 },
    owner: { sql: `select h.id from dtb_mail_history h join dtb_customer c on c.id = h.customer_id where c.email like '%' || $1 || '%'`, params: [RUN_MARK] },
  });
}
/** 日本時間の今と、日時（YYYY-MM-DD HH:MM:SS）との差（秒。絶対値） */
export function 今との差(日時: string): number {
  return Math.abs(Number(query(`select extract(epoch from (now() - ($1::timestamp at time zone 'Asia/Tokyo'))) as s`, [日時])[0].s));
}

/** E2E が作ったテンプレートの最終更新日時を書き換える（画面では過去の日時にできない） */
export function 更新日時を書く(理由: string, id: string, 日時: string): void {
  updateOwnRows(理由, { table: "dtb_mail_template", key: "id", ids: [id], set: { update_date: 日時 }, owner: 印のテンプレート });
}
/** E2E が作ったテンプレートの最終更新者を未設定にする（画面で保存すると必ず操作した担当者が入る） */
export function 更新者を外す(理由: string, id: string): void {
  updateOwnRows(理由, { table: "dtb_mail_template", key: "id", ids: [id], set: { creator_id: null, creator_name: null }, owner: 印のテンプレート });
}

/**
 * E2E が作ったテンプレートを消す（画面で作ったテンプレートは画面から削除できない作り）。
 * そのテンプレートを使って E2E の試験会員へ送ったメールの配信履歴があれば、先に履歴からテンプレートの参照を外す（履歴の行は残す）。
 */
export function 作ったテンプレートを消す(理由: string, ids: string[]): void {
  const ある = ids.filter(テンプレートがある);
  if (!ある.length) return;
  const 履歴 = query(
    `select h.id::text as id from dtb_mail_history h join dtb_customer c on c.id = h.customer_id
     where h.template_id = any(string_to_array($1, ',')::int[]) and c.email like '%' || $2 || '%'`, [ある.join(","), RUN_MARK]).map((r) => r.id as string);
  const 他の履歴 = Number(query(`select count(*) as n from dtb_mail_history where template_id = any(string_to_array($1, ',')::int[])`, [ある.join(",")])[0].n) - 履歴.length;
  if (他の履歴 > 0) throw new Error(`${理由}: 作ったテンプレート（ID ${ある.join("・")}）を、E2E の試験会員以外への配信履歴 ${他の履歴} 件が使っている。ほかの方の履歴は書き換えないので消せない`);
  if (履歴.length) {
    updateOwnRows(`${理由}（配信履歴の参照を外す）`, {
      table: "dtb_mail_history", key: "id", ids: 履歴, set: { template_id: null },
      owner: { sql: `select h.id from dtb_mail_history h join dtb_customer c on c.id = h.customer_id where c.email like '%' || $1 || '%'`, params: [RUN_MARK] },
    });
  }
  deleteOwnRows(理由, { table: "dtb_mail_template", key: "id", ids: ある, owner: 印のテンプレート });
}
