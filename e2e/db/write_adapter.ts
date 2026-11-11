/**
 * テスト側の DB 書き込みの取り次ぎ（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」の範囲）。
 *
 * 書き込みは必ず lib/db_write.ts の窓口（updateOwnRows・insertOwnRows・deleteOwnRows）を通す。このファイルは窓口を呼ぶ前の下ごしらえだけをする:
 *  - 書く文（insert / update / delete の1文）を読み取り、書き換える行の番号・足す行の値を、参照だけの SELECT（lib/db.ts）で先に求める。
 *  - 持ち主の確かめ（owner）は、「対象の確かめ」の行がすべて「印」を含み、かつ空でないことを、窓口の書き込みと同じ命令の中で確かめる SELECT にする。
 *    印を含まない行が1つでもあれば、書き換え・削除の対象は0行になり、窓口が取り消す。
 *  - 書く行数が「最大行数」を超えるときは、書く前に止める。
 * 物理名は、呼ぶ側の SQL の中にだけある。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertOwnRows, updateOwnRows } from "../lib/db_write";

type P = string | number;
type Val = string | null;
export type 書き込み = {
  理由: string;
  sql: string;
  params?: P[];
  /** 書き換える行（insert なら紐づく親の行）を返す SELECT。どの行も「印」を含むこと */
  対象の確かめ: string;
  確かめのparams?: P[];
  /** 対象の確かめの行がすべて含むべき文字列（実行の印・印つきの名前・メールなど） */
  印: string;
  最大行数: number;
};

/** 主キーが id でない表 */
const 主キー: Record<string, string> = {};

function 先頭(s: string): string { return s.trim().replace(/;\s*$/, ""); }

/** 引用符・括弧の外にある文字の位置と深さを返しながら走る */
function* 走査(s: string): Generator<{ i: number; depth: number }> {
  let depth = 0; let q = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) { if (s[i + 1] === q) i++; else q = ""; } continue; }
    if (c === "'" || c === '"') { q = c; continue; }
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else yield { i, depth };
  }
}

/** 最上位（括弧・引用符の外）のキーワードの位置。無ければ -1 */
function 最上位の(s: string, kw: string, from = 0): number {
  const re = new RegExp(`^${kw}(?![A-Za-z0-9_])`, "i");
  for (const { i, depth } of 走査(s)) {
    if (i < from || depth !== 0) continue;
    if (i > 0 && /[A-Za-z0-9_]/.test(s[i - 1])) continue;
    if (re.test(s.slice(i))) return i;
  }
  return -1;
}

function 最上位で分ける(s: string, sep: string): string[] {
  const out: string[] = []; let last = 0;
  for (const { i, depth } of 走査(s)) if (depth === 0 && s[i] === sep) { out.push(s.slice(last, i)); last = i + 1; }
  out.push(s.slice(last));
  return out.map((x) => x.trim());
}

export type 解析結果 =
  | { 種類: "update"; 表: string; 別名: string; 代入: { 列: string; 式: string }[]; 追加の表: string; 条件: string }
  | { 種類: "delete"; 表: string; 別名: string; 追加の表: string; 条件: string }
  | { 種類: "insert"; 表: string; 列: string[]; 値のSELECT: string };

/** 書く文を読み取る（読み取れない形は投げる） */
export function 解析(sqlText: string): 解析結果 {
  const s = 先頭(sqlText).replace(/\s+/g, " ");
  let m = /^update (\w+)(?: (?:as )?(?!set\b)(\w+))? set /i.exec(s);
  if (m) {
    const rest = s.slice(m[0].length);
    const w = 最上位の(rest, "where");
    if (w < 0) throw new Error("update に where が無い");
    const head = rest.slice(0, w).trim();
    const f = 最上位の(head, "from");
    const setText = f < 0 ? head : head.slice(0, f);
    const 追加の表 = f < 0 ? "" : head.slice(f + 4).trim();
    const 代入 = 最上位で分ける(setText, ",").map((a) => {
      const eq = /^(\w+)\s*=\s*([\s\S]+)$/.exec(a);
      if (!eq) throw new Error(`代入が読めない: ${a}`);
      return { 列: eq[1], 式: eq[2] };
    });
    return { 種類: "update", 表: m[1], 別名: m[2] ?? "", 代入, 追加の表, 条件: rest.slice(w + 5).trim() };
  }
  m = /^delete from (\w+)(?: (?:as )?(?!using\b|where\b)(\w+))?(?= using | where )/i.exec(s);
  if (m) {
    let rest = s.slice(m[0].length).trim();
    let 追加の表 = "";
    if (/^using /i.test(rest)) {
      const w0 = 最上位の(rest, "where");
      if (w0 < 0) throw new Error("delete に where が無い");
      追加の表 = rest.slice(6, w0).trim(); rest = rest.slice(w0);
    }
    if (!/^where /i.test(rest)) throw new Error("delete に where が無い");
    return { 種類: "delete", 表: m[1], 別名: m[2] ?? "", 追加の表, 条件: rest.slice(6).trim() };
  }
  m = /^insert into (\w+) ?\(([^)]*)\) ?/i.exec(s);
  if (m) {
    const rest = s.slice(m[0].length);
    if (!/^(values|select|with)\b/i.test(rest)) throw new Error("insert の値が読めない");
    if (最上位の(rest, "returning") >= 0 || /\bon conflict\b/i.test(rest)) throw new Error("returning・on conflict は使えない");
    const 列 = m[2].split(",").map((c) => c.trim());
    const 値のSELECT = /^values/i.test(rest) ? `select * from (${rest}) v(${列.join(", ")})` : rest;
    return { 種類: "insert", 表: m[1], 列, 値のSELECT };
  }
  throw new Error("insert / update / delete のどれにも読めない");
}

function 番号をずらす(sql: string, n: number): string { return sql.replace(/\$(\d+)/g, (_, k) => `$${Number(k) + n}`); }

/** 印を含まない行・0行なら書かない（書く前の確認） */
function 確かめる(w: 書き込み): void {
  const rows = query(w.対象の確かめ, w.確かめのparams ?? []);
  if (rows.length === 0) throw new Error(`書き込みの対象の確かめが0行（${w.理由}）`);
  const bad = rows.filter((r) => !JSON.stringify(r).includes(w.印));
  if (bad.length) throw new Error(`印「${w.印}」を含まない行が対象にある（${bad.length}行）。共有のデータには書かない（${w.理由}）`);
}

/** 「対象の確かめの行がすべて印を含み、空でない」の条件（SQL）と、その値（params の後ろに足す） */
function 確かめの条件(w: 書き込み, params: P[]): { 条件: string; params: P[] } {
  const own = params.length;
  const cp = w.確かめのparams ?? [];
  const chk = 番号をずらす(先頭(w.対象の確かめ), own);
  const markIdx = own + cp.length + 1;
  return {
    条件: `exists (select 1 from (${chk}) z0) and not exists (select 1 from (${chk}) z1 where position($${markIdx} in z1::text) = 0)`,
    params: [...params, ...cp, w.印],
  };
}

function 表と別名(r: { 表: string; 別名: string }): string { return `${r.表}${r.別名 ? ` ${r.別名}` : ""}`; }
function 行の名(r: { 表: string; 別名: string }): string { return r.別名 || r.表; }

/** 書く。書いた行数を返す（書く先の窓口は lib/db_write.ts） */
export function writeTestData(w: 書き込み): number {
  const s = 先頭(w.sql);
  if (!/^(insert|update|delete)\b/i.test(s) || /;/.test(s) || /\b(truncate|alter|drop|create|grant|revoke|copy)\b/i.test(s)) {
    throw new Error("DB への書き込みは insert / update / delete の1文だけ");
  }
  if (!w.印 || w.印.length < 4) throw new Error("印（4文字以上）が要る");
  if (!(w.最大行数 >= 1 && w.最大行数 <= 500)) throw new Error("最大行数は1〜500");
  確かめる(w);
  const params = w.params ?? [];
  const what = w.理由;
  const a = 解析(s);

  if (a.種類 === "insert") {
    const cols = a.列.map((_, i) => `c${i}`).join(", ");
    const outs = a.列.map((_, i) => `r.c${i}::text as c${i}`).join(", ");
    const sel = query(`select ${outs} from (${a.値のSELECT}) r(${cols})`, params);
    if (sel.length === 0) return 0;
    if (sel.length > w.最大行数) throw new Error(`足す行が ${sel.length} 行で最大 ${w.最大行数} 行を超える（${what}）`);
    const rows = sel.map((r) => Object.fromEntries(a.列.map((c, i) => [c, r[`c${i}`] as Val])));
    // 親の列: 足す行のその列の値が、対象の確かめの行のどれかの列の値に当たるもの
    const chk = query(w.対象の確かめ, w.確かめのparams ?? []);
    const chkCols = Object.keys(chk[0]);
    let pc = ""; let ci = -1;
    for (const c of a.列) {
      const vals = rows.map((r) => r[c]);
      if (vals.some((v) => v === null)) continue;
      const j = chkCols.findIndex((k) => vals.every((v) => chk.some((r) => r[k] === v)));
      if (j >= 0) { pc = c; ci = j; break; }
    }
    if (!pc) throw new Error(`足す行の親の列が、対象の確かめの行に見つからない（${what}）`);
    const cp = w.確かめのparams ?? [];
    const owner = {
      sql: `select c.a${ci} from (${先頭(w.対象の確かめ)}) c(${chkCols.map((_, i) => `a${i}`).join(", ")}) where position($${cp.length + 1} in c::text) > 0`,
      params: [...cp, w.印],
    };
    insertOwnRows(what, { table: a.表, parentColumn: pc, rows, owner });
    return rows.length;
  }

  const key = 主キー[a.表] ?? "id";
  const from = 表と別名(a) + (a.追加の表 ? `, ${a.追加の表}` : "");
  const k = `${行の名(a)}.${key}`;
  const exprs = a.種類 === "update" ? a.代入.map((x, i) => `(${x.式})::text as v${i}`).join(", ") : "";
  const found = query(`select ${k}::text as k${exprs ? ", " + exprs : ""} from ${from} where ${a.条件}`, params);
  if (found.length === 0) return 0;
  if (found.length > w.最大行数) throw new Error(`書き換える行が ${found.length} 行で最大 ${w.最大行数} 行を超える（${what}）`);
  const c = 確かめの条件(w, params);
  const owner = { sql: `select ${k} from ${from} where (${a.条件}) and ${c.条件}`, params: c.params };

  if (a.種類 === "delete") {
    deleteOwnRows(what, { table: a.表, key, ids: found.map((r) => r.k as string), owner });
    return found.length;
  }
  // update: 行ごとの値が同じものを1回の書き込みにまとめる
  const groups = new Map<string, { ids: string[]; set: Record<string, Val> }>();
  for (const r of found) {
    const set = Object.fromEntries(a.代入.map((x, i) => [x.列, r[`v${i}`] as Val]));
    const g = JSON.stringify(set);
    if (!groups.has(g)) groups.set(g, { ids: [], set });
    groups.get(g)!.ids.push(r.k as string);
  }
  for (const g of groups.values()) updateOwnRows(what, { table: a.表, key, ids: g.ids, set: g.set, owner });
  return found.length;
}
