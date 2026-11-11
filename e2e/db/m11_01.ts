/**
 * M11-01 メンバー管理一覧の DB 確認（参照）と、E2E が作ったメンバーの行への書き足し（lib/db_write.ts を通す）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 *
 * 一覧は全メンバーを表示順の降順で出し、上へ・下へは「表示順が1つ違うメンバー」と入れ替え、削除はそのメンバーより表示順が上の全員を1つ繰り下げる作り。
 * 開発環境にはほかの方のメンバーが多い（表示順の重複もある）ので、押す前に、入れ替え・繰り下げの相手が E2E のメンバーだけであることを確かめる。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** E2E が作ったメンバー（ログインIDかメールアドレスに、この実行の印を含む） */
const メンバーの持ち主 = { sql: `select id from dtb_member where lower(login_id) like '%' || lower($1) || '%' or lower(email) like '%' || lower($1) || '%'`, params: [RUN_MARK] };
const 印つきか = (login: string | null, mail: string | null): boolean =>
  (login ?? "").toLowerCase().includes(RUN_MARK.toLowerCase()) || (mail ?? "").toLowerCase().includes(RUN_MARK.toLowerCase());

/** 全メンバーの表示順の最大 */
export function 表示順の最大(): number {
  return Number(query(`select coalesce(max(sort_no), 0)::text as mx from dtb_member`)[0].mx);
}

/** メンバーの表示順（いなければ null） */
export function 表示順(ID: string): number | null {
  const r = query(`select sort_no::text as s from dtb_member where id = $1::int`, [ID]);
  return r.length ? Number(r[0].s) : null;
}

/** メンバーIDの行があるか */
export function いるか(ID: string): boolean {
  return query(`select id::text as i from dtb_member where id = $1::int`, [ID]).length > 0;
}

/** ログインIDのメンバーの数 */
export function ログインIDの数(ログインID: string): number {
  return query(`select id::text as i from dtb_member where login_id = $1`, [ログインID]).length;
}

/** 稼働の名前（mtb の名前。いなければ null） */
export function 稼働(ID: string): string | null {
  const r = query(`select coalesce(w.name, '') as w from dtb_member m left join mtb_work w on w.id = m.work_id where m.id = $1::int`, [ID]);
  return r.length ? (r[0].w ?? "") : null;
}

type 行 = { ID: string; 表示順: number; E2E: boolean };
const 行へ = (r: Record<string, string | null>): 行 => ({ ID: r.i ?? "", 表示順: Number(r.s), E2E: 印つきか(r.l, r.e) });

/** 表示順がちょうど n のメンバー（重複があれば複数） */
export function 表示順のメンバー(n: number): 行[] {
  return query(`select id::text as i, sort_no::text as s, login_id as l, email as e from dtb_member where sort_no = $1::int order by id`, [n]).map(行へ);
}

/** 表示順が n より大きいメンバー（削除で繰り下がる相手） */
export function 表示順より上のメンバー(n: number): 行[] {
  return query(`select id::text as i, sort_no::text as s, login_id as l, email as e from dtb_member where sort_no > $1::int order by sort_no desc, id`, [n]).map(行へ);
}

/**
 * 上へ・下へを押す前の確かめ。入れ替えの相手（表示順 ±1）が、want で示した E2E のメンバー1人だけであること。
 * want が null のときは、相手がいないこと（欠番の試験）。
 */
export function 入れ替えの相手を確かめる(ID: string, 向き: "上へ" | "下へ", want: string | null): void {
  const s = 表示順(ID);
  if (s === null) throw new Error(`メンバーID ${ID} が DB に無い`);
  const hit = 表示順のメンバー(向き === "上へ" ? s + 1 : s - 1);
  if (want === null) {
    if (hit.length) throw new Error(`表示順 ${向き === "上へ" ? s + 1 : s - 1} にメンバー（${hit.map((h) => h.ID).join("・")}）がいる（欠番の前提が崩れた。ほかの方のメンバーと入れ替わるので押さない）`);
    return;
  }
  if (hit.length !== 1 || hit[0].ID !== want || !hit[0].E2E) {
    throw new Error(`${向き}の入れ替えの相手が E2E のメンバー ${want} だけでない（表示順 ${向き === "上へ" ? s + 1 : s - 1}: ${hit.map((h) => `${h.ID}${h.E2E ? "" : "（ほかの方）"}`).join("・") || "なし"}）。ほかの方のメンバーの表示順を変えるので押さない`);
  }
}

/** 削除を押す前の確かめ。削除で表示順が繰り下がる相手（表示順が上のメンバー）が、E2E のメンバーだけであること */
export function 繰り下がる相手を確かめる(ID: string): string[] {
  const s = 表示順(ID);
  if (s === null) throw new Error(`メンバーID ${ID} が DB に無い`);
  const up = 表示順より上のメンバー(s);
  const others = up.filter((u) => !u.E2E);
  if (others.length) throw new Error(`削除で表示順が繰り下がるメンバーに、ほかの方のメンバーがいる（${others.slice(0, 5).map((o) => o.ID).join("・")} など ${others.length} 人）。ほかの方のメンバーの表示順を変えるので押さない`);
  return up.map((u) => u.ID);
}

/** 所属・権限・稼働のマスタの登録内容（変わっていないかを比べるための文字列） */
export function マスタの登録内容(): string {
  const j = (sql: string) => query(sql).map((r) => JSON.stringify(r)).join("\n");
  return [
    j(`select id::text as i, name as n, sort_no::text as s from mtb_department order by id`),
    j(`select id::text as i, name as n, sort_no::text as s from mtb_authority order by id`),
    j(`select id::text as i, name as n, sort_no::text as s from mtb_work order by id`),
  ].join("\n--\n");
}

/** E2E が作ったメンバーの表示順を指定の値にする（画面で指定できない） */
export function 表示順にする(what: string, ID: string, 値: number): void {
  updateOwnRows(what, { table: "dtb_member", key: "id", ids: [ID], set: { sort_no: 値 }, owner: メンバーの持ち主 });
}

/**
 * E2E が作ったメンバーの2段階認証を「設定済み」にする（画面では、そのメンバー本人が認証アプリで設定したときだけ鍵が入る）。
 * 入れる鍵は試験用の固定の文字列（だれの秘密でもない）。このメンバーではログインしない。
 */
export function 二段階認証を設定済みにする(what: string, ID: string): void {
  updateOwnRows(what, { table: "dtb_member", key: "id", ids: [ID], set: { two_factor_auth_key: `E2ETESTKEY${RUN_MARK}`.slice(0, 32) }, owner: メンバーの持ち主 });
}
