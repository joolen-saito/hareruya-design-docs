#!/usr/bin/env node
/**
 * エビデンスの検査。
 *   node tools/evidence_check.mjs [--strict] [機能ID...]      機能IDを省くと evidence/ にある全機能
 *
 * 誤り（終了コード1）
 *   - result.json が読めない・必要な項目が無い
 *   - 「合格」なのに、実行していない手順がある／期待結果を確かめていない／確かめが1つも無い／落ちた確かめがある
 *   - 撮る設定（E2E_EVIDENCE が off 以外）なのに、実行した手順・期待結果に画面が1枚も無く、撮れなかった理由も無い
 *   - 判定の表（e2e/review/judgements/<機能ID>.tsv）の判定・区分が決まりの値でない、エビデンスに無い実施への判定
 * 注意（--strict のときは誤り）
 *   - 正本が変わった（要再実行）・正本から消えた
 *   - 要判定（不合格・未判定で、判定の表に無い）・判定が古い（流し直したあとに判定していない）
 *   - テストコードがあるのにエビデンスが無いケース
 *   - 合否の一覧（integration_test/casegen/playwright_cases.tsv）の結果と、判定済みの結果が違う
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const E2E = path.resolve(here, "..");
const REPO = path.resolve(E2E, "..");
const ROOT = path.resolve(process.env.E2E_EVIDENCE_DIR || path.join(E2E, "evidence"));
const JUDGE = path.join(E2E, "review", "judgements");
const PWC = path.join(REPO, "integration_test", "casegen", "playwright_cases.tsv");
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const want = args.filter((a) => !a.startsWith("--"));

// 判定の表の決まり（.codex/skills/hareruya-e2e-case-evidence/references/JUDGEMENT.md）
export const 区分の決まり = {
  合格: ["", "条件付き"],
  不合格: ["実装差異", "設計と実装の差異", "設計書の中の食い違い", "正本の問題", "条件付き"],
  未判定: ["環境", "ハーネス不良", "開発用データ", "正本の問題", "シード"],
};

function readTsv(file) {
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf-8").split(/\r?\n/).filter((l) => l.length > 0);
  const head = lines[0].split("\t");
  return lines.slice(1).map((l) => Object.fromEntries(l.split("\t").map((c, i) => [head[i], c])));
}

const errors = [];
const warns = [];
if (!fs.existsSync(ROOT)) { console.log(`エビデンスが無い: ${ROOT}`); process.exit(0); }
const fids = (want.length ? want : fs.readdirSync(ROOT).filter((d) => /^[A-Z]\d\d-\d\d$/.test(d))).sort();
const pwc = new Map(readTsv(PWC).map((r) => [r.テストID, r]));
let total = 0;
for (const fid of fids) {
  const fdir = path.join(ROOT, fid);
  // 一覧を作り直してから見る（正本との一致・判定の状態は evidence_index.mjs が決める）
  execFileSync(process.execPath, [path.join(here, "evidence_index.mjs"), "--quiet", fid], { stdio: "inherit" });
  const rows = new Map(readTsv(path.join(fdir, "results.tsv")).map((r) => [r.テストID, r]));
  for (const id of fs.existsSync(fdir) ? fs.readdirSync(fdir).filter((d) => /^IT-/.test(d) && !d.includes(".tmp-")) : []) {
    const f = path.join(fdir, id, "result.json");
    let rec;
    try { rec = JSON.parse(fs.readFileSync(f, "utf-8")); }
    catch (e) { errors.push(`${id}: result.json が読めない（${e.message}）`); continue; }
    total += 1;
    for (const k of ["テストID", "結果", "場面", "確かめ", "実施日時", "正本の指紋"]) if (!(k in rec)) errors.push(`${id}: result.json に ${k} が無い`);
    if (!Array.isArray(rec.場面)) continue;
    const steps = rec.場面.filter((s) => s.種類 === "手順");
    const exp = rec.場面.find((s) => s.種類 === "期待結果");
    if (rec.結果 === "合格") {
      const notRun = steps.filter((s) => s.状態 !== "済").map((s) => `手順${s.番号}`);
      if (notRun.length) errors.push(`${id}: 合格なのに ${notRun.join("・")} が「済」でない`);
      if (!exp || exp.状態 !== "済") errors.push(`${id}: 合格なのに期待結果を確かめていない`);
      if (rec.確かめ.length === 0) errors.push(`${id}: 合格なのに確かめ（expect）が記録されていない`);
      if (rec.確かめ.some((k) => k.結果 !== "合格")) errors.push(`${id}: 合格なのに落ちた確かめがある`);
    }
    // 記録にある画像・落ちたときの画面・操作の記録が、ファイルとして在ること
    const files = [...rec.場面.flatMap((s) => s.画像.map((im) => im.file)), ...(rec.失敗時の画面 ?? []), ...(rec.trace ? [rec.trace] : [])];
    for (const f of files) {
      const p = path.join(fdir, id, f);
      if (!fs.existsSync(p) || fs.statSync(p).size === 0) errors.push(`${id}: 記録にある ${f} が無いか空`);
    }
    if ((rec.キャプチャ ?? "full") !== "off") {
      for (const s of [...steps, ...(exp ? [exp] : [])]) {
        if (s.状態 === "未実行") continue;
        if (s.画像.length === 0 && s.撮れなかった.length === 0) errors.push(`${id}: ${s.種類 === "手順" ? `手順${s.番号}` : "期待結果"}の画面が無い（撮れなかった理由も無い）`);
      }
    } else warns.push(`${id}: 画面を撮らない設定（E2E_EVIDENCE=off）で流した`);
    const row = rows.get(id);
    if (row) {
      if (row.正本との一致 !== "一致") warns.push(`${id}: ${row.正本との一致}`);
      if (row.判定の状態 && row.判定の状態 !== "判定済み") warns.push(`${id}: ${row.判定の状態}（自動判定 ${rec.結果}${row.落ちた場面 ? `・${row.落ちた場面}で停止` : ""}）`);
      const p = pwc.get(id);
      if (p && row.判定の状態 === "判定済み" && (row.結果 === "合格" || row.結果 === "不合格") && p.結果 !== row.結果) {
        warns.push(`${id}: 合否の一覧は「${p.結果}」、エビデンスの判定は「${row.結果}」（tools/evidence_judgements.py sync で揃える）`);
      }
    }
  }
  // 判定の表
  const jfile = path.join(JUDGE, `${fid}.tsv`);
  if (fs.existsSync(jfile)) {
    const head = fs.readFileSync(jfile, "utf-8").split(/\r?\n/)[0];
    const want = ["テストID", "判定", "区分", "理由", "対象の実施日時", "判定日", "記録"].join("\t");
    if (head !== want) errors.push(`${path.relative(REPO, jfile)}: 見出しが違う（${want}）`);
    const seen = new Set();
    for (const j of readTsv(jfile)) {
      if (seen.has(j.テストID)) errors.push(`${path.relative(REPO, jfile)}: ${j.テストID} が2行ある（1ケース1行。流し直したら書き換える）`);
      seen.add(j.テストID);
      const allowed = 区分の決まり[j.判定];
      if (!allowed) errors.push(`${path.relative(REPO, jfile)}: ${j.テストID} の判定「${j.判定}」は決まりの値でない（合格／不合格／未判定）`);
      else if (!allowed.includes(j.区分 ?? "")) errors.push(`${path.relative(REPO, jfile)}: ${j.テストID} の区分「${j.区分}」は判定「${j.判定}」に使えない（${allowed.map((x) => x || "空").join("／")}）`);
      if ((j.判定 === "不合格" || j.区分) && !(j.理由 ?? "").trim()) errors.push(`${path.relative(REPO, jfile)}: ${j.テストID} に理由が無い`);
      if (!(j.記録 ?? "").trim()) errors.push(`${path.relative(REPO, jfile)}: ${j.テストID} に記録（e2e/review の記録のパス）が無い`);
      else if (!fs.existsSync(path.join(REPO, j.記録))) errors.push(`${path.relative(REPO, jfile)}: ${j.テストID} の記録 ${j.記録} が無い`);
      const rf = path.join(fdir, j.テストID, "result.json");
      if (!fs.existsSync(rf)) warns.push(`${j.テストID}: 判定の表にあるが、エビデンスが無い`);
      else {
        const r = JSON.parse(fs.readFileSync(rf, "utf-8"));
        if (j.対象の実施日時 === r.実施日時 && j.判定 !== "未判定" && j.判定 !== r.結果) {
          errors.push(`${path.relative(REPO, jfile)}: ${j.テストID} の判定「${j.判定}」は自動判定「${r.結果}」を覆している（合格・不合格は自動判定と同じときだけ。直して流し直す）`);
        }
      }
    }
  }
  // テストコードがあるのにエビデンスが無い
  try {
    const listed = execFileSync(process.execPath, [path.join(here, "coverage.mjs"), "--list", fid], { encoding: "utf-8" });
    const missing = listed.split("\n").filter(Boolean).map((l) => l.split("\t")[0]).filter((id) => !rows.has(id));
    if (missing.length) warns.push(`${fid}: テストコードがあるのにエビデンスが無いケース ${missing.length}件（${missing.slice(0, 8).join("・")}${missing.length > 8 ? " …" : ""}）`);
  } catch { /* テストコードの形の誤りは coverage.mjs が報告する */ }
}
console.log(`エビデンスの検査: ${fids.join("・")}（${total}件）— 誤り ${errors.length}・注意 ${warns.length}`);
for (const e of errors) console.log(`  誤り: ${e}`);
for (const w of warns) console.log(`  注意: ${w}`);
process.exit(errors.length || (strict && warns.length) ? 1 : 0);
