#!/usr/bin/env node
/**
 * ケースの正本と、テストコード・シードの作り方の対応を数え、テストコードの形を検査する。
 *   node tools/coverage.mjs [機能ID...]
 * テストコードは TypeScript の構文として読む（コメントや文字列の中のIDは数えない）。次のものは誤りとして終了コード1で終わる。
 *   - 同じテストID・同じシードIDの二重定義／正本に無いID
 *   - テストIDが文字列でその場に書かれていない
 *   - 手順（step）の中身が空／期待結果（expected）が無い、または中に expect が1つも無い
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const casesDir = path.resolve(root, "..", "integration_test", "casegen", "cases");
const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const sources = (dir) => walk(path.join(root, dir)).filter((f) => f.endsWith(".ts")).map((f) => ts.createSourceFile(f, fs.readFileSync(f, "utf-8"), ts.ScriptTarget.Latest, true));
const errors = [];
const where = (sf, n) => `${path.relative(root, sf.fileName)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
const calleeName = (n) => ts.isIdentifier(n.expression) ? n.expression.text : ts.isPropertyAccessExpression(n.expression) ? n.expression.name.text : "";
const rootName = (e) => { while (ts.isPropertyAccessExpression(e) || ts.isCallExpression(e)) e = e.expression; return ts.isIdentifier(e) ? e.text : ""; };
const callsIn = (node, pred) => { const out = []; const v = (n) => { if (ts.isCallExpression(n) && pred(n)) out.push(n); ts.forEachChild(n, v); }; v(node); return out; };
const isFn = (n) => n && (ts.isArrowFunction(n) || ts.isFunctionExpression(n));
const isEmpty = (fn) => ts.isBlock(fn.body) && fn.body.statements.length === 0;
const add = (map, id, at) => { if (map.has(id)) errors.push(`${id} が二重に定義されている（${map.get(id)} と ${at}）`); else map.set(id, at); };

const tested = new Map();
for (const sf of sources("spec")) {
  for (const call of callsIn(sf, (n) => calleeName(n) === "caseTest")) {
    const [idArg, bodyArg] = call.arguments;
    const at = where(sf, call);
    // 処理は、その場の関数か、同じファイルの関数（同じ形のケースに共通の処理を返すもの）の呼び出し
    let body = bodyArg;
    if (body && ts.isCallExpression(body) && ts.isIdentifier(body.expression)) {
      const name = body.expression.text;
      body = sf.statements.find((st) => ts.isFunctionDeclaration(st) && st.name?.text === name);
    }
    if (!idArg || !ts.isStringLiteral(idArg) || !body || !(isFn(body) || ts.isFunctionDeclaration(body))) { errors.push(`${at}: caseTest は、テストIDの文字列をその場に書き、処理はその場か同じファイルの関数に書く`); continue; }
    const id = idArg.text;
    add(tested, id, at);
    for (const s of callsIn(body, (n) => calleeName(n) === "step")) {
      if (!isFn(s.arguments[1]) || isEmpty(s.arguments[1])) errors.push(`${id}（${where(sf, s)}）: 手順の中身が空`);
    }
    const exp = callsIn(body, (n) => calleeName(n) === "expected");
    if (exp.length === 0) errors.push(`${id}（${at}）: 期待結果（expected）を確かめていない`);
    for (const e of exp) {
      if (!isFn(e.arguments[0]) || callsIn(e.arguments[0], (n) => rootName(n) === "expect" && calleeName(n) !== "expect").length === 0) {
        errors.push(`${id}（${where(sf, e)}）: 期待結果の中に、確かめ（expect）が1つも無い`);
      }
    }
  }
}
// シードの作り方: defineSeed と、それを包んだ define…Seed（例: defineEventSeed）の第1引数
const built = new Map();
for (const sf of sources("seeds")) {
  for (const call of callsIn(sf, (n) => /^define\w*Seed$/.test(calleeName(n)))) {
    const a = call.arguments[0];
    if (a && ts.isStringLiteral(a)) add(built, a.text, where(sf, call));
  }
}

const rows = (file) => fs.readFileSync(file, "utf-8").split("\n").slice(1).filter(Boolean).map((l) => l.split("\t"));
const want = process.argv.slice(2);
const known = new Set(), knownSeeds = new Set();
let tc = 0, tt = 0;
console.log("機能ID\tケース\tテストあり\tうちDB確認つき\tシード\t作り方あり");
for (const f of fs.readdirSync(casesDir).filter((n) => n.endsWith("_test_cases.tsv")).sort()) {
  const fid = f.split("_")[0];
  const C = rows(path.join(casesDir, f));
  const S = rows(path.join(casesDir, `${fid}_seed_data.tsv`));
  C.forEach((r) => known.add(r[0])); S.forEach((r) => knownSeeds.add(r[0]));
  if (want.length && !want.includes(fid)) continue;
  const t = C.filter((r) => tested.has(r[0]));
  tc += C.length; tt += t.length;
  if (!want.length && t.length === 0) continue;
  console.log([fid, C.length, t.length, t.filter((r) => r[5].includes("DB確認")).length, S.length, S.filter((r) => built.has(r[0])).length].join("\t"));
}
console.log(`\n正本のケース ${tc}件のうち、テストがあるのは ${tt}件`);
for (const [id, at] of tested) if (!known.has(id)) errors.push(`${id}（${at}）は正本に無い`);
for (const [id, at] of built) if (!knownSeeds.has(id)) errors.push(`${id}（${at}）はシード表に無い`);
if (errors.length) { console.log(`\n誤り ${errors.length}件`); errors.forEach((e) => console.log(`  ${e}`)); process.exit(1); }
