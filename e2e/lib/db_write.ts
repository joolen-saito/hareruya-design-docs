/**
 * E2E が作った行だけを DB で書き換える窓口（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 *
 * テストデータは画面から作るのが決まり。画面で作れない状態（過去の日時・画面の入力チェックを通らない値・画面に無い項目・
 * 履歴の行など）だけ、画面で作った E2E の行に、ここから書き足す・書き換える。ほかの方のデータには触れない。
 *
 * 守り:
 * - E2E_DB_WRITE=1 のときだけ動く（.env.dev で与える）。無ければ投げる。
 * - 書く相手の行は、呼ぶ側が「持ち主の確かめ」（owner: その行が E2E のものだと分かる SELECT。実行の印・控えた番号など）で示す。
 *   書き換えは「指定の番号」かつ「持ち主の確かめに当たる」行だけに絞った1つの命令で行い、件数が指定と違えば取り消す（rollback）。
 * - 行を足すときは、親の番号（会員・商品・受注など）が持ち主の確かめに当たることを先に照会し、外れたら書かない。
 * - 表・列の名前は英小文字・数字・下線だけ。値は psql の変数（:'p1'）で渡す（文字列の連結で SQL を組み立てない）。
 * - 書いたものは .runs/db_writes.log に1件ずつ残す（日時・何のため・命令・値・件数）。
 * - 物理名は SQL の中にだけ書き、呼び出す側には業務の言葉の関数名で見せる（db/<機能>.ts に包む）。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { DB_CONTAINER, DB_MODE, DB_URL, ENV_NAME } from "../config/env";

type Val = string | number | boolean | null;
export type Owner = { sql: string; params?: (string | number)[] };

const IDENT = /^[a-z_][a-z0-9_]*$/;
const LOG = path.resolve(__dirname, "..", ".runs", "db_writes.log");

function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`DBへの書き込み: 名前「${name}」は使えない（英小文字・数字・下線だけ）`);
  return name;
}

function assertEnabled(what: string): void {
  if (process.env.E2E_DB_WRITE !== "1") throw new Error(`${what}: DBへの書き込みは E2E_DB_WRITE=1 のときだけ（依頼者決定 2026-11-10・E2E が作った行だけ）`);
  if (DB_MODE === "none") throw new Error(`${what}: E2E_ENV=${ENV_NAME} はDBの接続先が無い`);
}

function ownerSelect(owner: Owner, offset: number): { sql: string; vars: string[] } {
  const s = owner.sql.trim().replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(s) || /;/.test(s)) throw new Error("持ち主の確かめは SELECT 1文");
  const sql = s.replace(/\$(\d+)/g, (_, n) => `:'p${Number(n) + offset}'`);
  const vars = (owner.params ?? []).flatMap((p, i) => ["-v", `p${i + 1 + offset}=${String(p)}`]);
  return { sql, vars };
}

/** psql で1つの書き込みのトランザクションを流す。最後の select の ok が真なら commit、偽なら rollback して投げる */
function runTx(what: string, body: string, vars: string[], logLine: string): string {
  const input = `begin;\n${body}\n\\if :ok\ncommit;\n\\echo E2E_WRITE_OK :n\n\\else\nrollback;\n\\echo E2E_WRITE_NG :n\n\\endif\n`;
  const args = ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-At", ...vars, "-f", "-"];
  // 読み取り専用の既定（PGOPTIONS）を、この接続だけ外す
  const env = { ...process.env, PGOPTIONS: "-c default_transaction_read_only=off" };
  const opt = { input, encoding: "utf-8" as const, env, maxBuffer: 16 * 1024 * 1024 };
  const out = DB_MODE === "url"
    ? execFileSync("psql", [DB_URL, ...args], opt)
    : execFileSync("docker", ["exec", "-i", DB_CONTAINER, "sh", "-c",
      'PGPASSWORD="$POSTGRES_PASSWORD" exec psql -U "$POSTGRES_USER" -d "${POSTGRES_DB:-eccubedb}" "$@"', "psql", ...args], opt);
  const m = /E2E_WRITE_(OK|NG) (\d+)/.exec(out);
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, [new Date().toISOString(), ENV_NAME, what, m ? m[1] : "?", m ? m[2] : "?", logLine].join("\t") + "\n");
  if (!m || m[1] !== "OK") throw new Error(`${what}: DBへの書き込みを取り消した（E2E のものと確かめられない行が含まれる、または件数が違う）。${out.trim()}`);
  return m[2];
}

/**
 * E2E が作った行の列を書き換える。ids（主キーの値）のうち、owner の SELECT が返す行だけを書き換え、件数が ids と同じなら確定する。
 * @param what 何のためか（シードID など。記録に残す）
 */
export function updateOwnRows(what: string, a: { table: string; key: string; ids: (string | number)[]; set: Record<string, Val>; owner: Owner }): void {
  assertEnabled(what);
  if (a.ids.length === 0) throw new Error(`${what}: 書き換える行が無い`);
  const cols = Object.keys(a.set).map(ident);
  const vars: string[] = ["-v", `ids=${a.ids.map(String).join(",")}`];
  const sets = cols.map((c, i) => {
    const v = a.set[c];
    if (v === null) return `${c} = null`;
    vars.push("-v", `s${i}=${String(v)}`);
    return `${c} = :'s${i}'`;
  });
  const o = ownerSelect(a.owner, 0);
  vars.push(...o.vars);
  const t = ident(a.table), k = ident(a.key);
  const body = `with u as (update ${t} set ${sets.join(", ")} where ${k}::text = any(string_to_array(:'ids', ',')) and ${k}::text in (select o.k::text from (${o.sql}) o(k)) returning 1)\n` +
    `select count(*) as n, count(*) = ${a.ids.length} as ok from u \\gset`;
  runTx(what, body, vars, JSON.stringify({ table: t, key: k, ids: a.ids, set: a.set, owner: a.owner }));
}

/**
 * E2E が作った親（会員・商品・受注など）にぶら下がる行を足す。rows の各行の parentColumn の値が、owner の SELECT が返す親に当たるときだけ足す。
 */
export function insertOwnRows(what: string, a: { table: string; parentColumn: string; rows: Record<string, Val>[]; owner: Owner }): void {
  assertEnabled(what);
  if (a.rows.length === 0) throw new Error(`${what}: 足す行が無い`);
  const t = ident(a.table), pc = ident(a.parentColumn);
  const cols = Object.keys(a.rows[0]).map(ident);
  if (!cols.includes(pc)) throw new Error(`${what}: 足す行に親の列 ${pc} が無い`);
  const vars: string[] = [];
  const values = a.rows.map((r, ri) => "(" + cols.map((c, ci) => {
    if (Object.keys(r).length !== cols.length || !(c in r)) throw new Error(`${what}: 行ごとに列がそろっていない`);
    const v = r[c];
    if (v === null) return "null";
    vars.push("-v", `r${ri}_${ci}=${String(v)}`);
    return `:'r${ri}_${ci}'`;
  }).join(", ") + ")");
  const o = ownerSelect(a.owner, 0);
  vars.push(...o.vars);
  const body = `with v(${cols.join(", ")}) as (values ${values.join(", ")}),\n` +
    `ok_rows as (select v.* from v where v.${pc}::text in (select o.k::text from (${o.sql}) o(k))),\n` +
    `ins as (insert into ${t} (${cols.join(", ")}) select * from ok_rows where (select count(*) from ok_rows) = ${a.rows.length} returning 1)\n` +
    `select count(*) as n, count(*) = ${a.rows.length} as ok from ins \\gset`;
  runTx(what, body, vars, JSON.stringify({ table: t, parentColumn: pc, rows: a.rows, owner: a.owner }));
}

/** E2E が作った行を消す。updateOwnRows と同じく、owner に当たる行だけ・件数が合うときだけ確定する */
export function deleteOwnRows(what: string, a: { table: string; key: string; ids: (string | number)[]; owner: Owner }): void {
  assertEnabled(what);
  if (a.ids.length === 0) throw new Error(`${what}: 消す行が無い`);
  const t = ident(a.table), k = ident(a.key);
  const o = ownerSelect(a.owner, 0);
  const vars = ["-v", `ids=${a.ids.map(String).join(",")}`, ...o.vars];
  const body = `with d as (delete from ${t} where ${k}::text = any(string_to_array(:'ids', ',')) and ${k}::text in (select o.k::text from (${o.sql}) o(k)) returning 1)\n` +
    `select count(*) as n, count(*) = ${a.ids.length} as ok from d \\gset`;
  runTx(what, body, vars, JSON.stringify({ table: t, key: k, ids: a.ids, owner: a.owner }));
}
