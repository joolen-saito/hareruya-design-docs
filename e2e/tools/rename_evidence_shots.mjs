#!/usr/bin/env node
/**
 * これまでのエビデンスの画面の画像を、「<一覧のテストID>_<連番>.png」の名前に付け直す（依頼者の指定 2026-11-02）。
 *   node tools/rename_evidence_shots.mjs [--dry-run] [機能ID…]
 *
 * - 連番は1から、開始時（前提条件）→ 手順1..n → 期待結果 の順（result.json の「場面」の並び、場面の中は撮った順）。
 * - 一覧のテストID は integration_test/casegen/all_test_cases_id_map.tsv で引く（無ければ result.json の値、それも無ければ正本のテストID）。
 * - 画像のファイルの名前と result.json の「画像.file」を直し、そのあと evidence_index.mjs で evidence.md・evidence.html・一覧を作り直す。
 * - 落ちたときに Playwright が撮った画面（Playwrightの画面_N.png）と trace.zip は手順の画面でないので、名前を変えない。
 * - 書き出しの途中（.tmp- の付いたフォルダ）と、2分以内に書かれたケースは飛ばす（流している最中の回とぶつからないように）。
 *   何度流してもよい（付け直し済みのケースは変えない）。
 * これからの実行の名前は lib/evidence_reporter.ts が同じ形で付ける。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const E2E = path.resolve(here, "..");
const REPO = path.resolve(E2E, "..");
const ROOT = process.env.E2E_EVIDENCE_DIR || path.join(E2E, "evidence");
const MAP = path.join(REPO, "integration_test", "casegen", "all_test_cases_id_map.tsv");
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const only = new Set(args.filter((a) => !a.startsWith("--")));

const listIdOf = new Map();
for (const line of fs.readFileSync(MAP, "utf-8").split(/\r?\n/).slice(1)) {
  const [listId, caseId] = line.split("\t");
  if (listId && caseId) listIdOf.set(caseId, listId);
}
const safe = (s) => s.replace(/[\\/:*?"<>|#\s]+/g, "_").slice(0, 60);

let renamed = 0, already = 0, skipped = 0;
const touched = new Set();
for (const fid of fs.readdirSync(ROOT).sort()) {
  if (only.size && !only.has(fid)) continue;
  const fdir = path.join(ROOT, fid);
  if (!fs.statSync(fdir).isDirectory()) continue;
  for (const id of fs.readdirSync(fdir).sort()) {
    const dir = path.join(fdir, id);
    const rj = path.join(dir, "result.json");
    if (id.includes(".tmp-") || !fs.existsSync(rj)) continue;
    if (Date.now() - fs.statSync(rj).mtimeMs < 120_000) { skipped++; console.log(`飛ばした（2分以内に書かれた）: ${fid}/${id}`); continue; }
    const rec = JSON.parse(fs.readFileSync(rj, "utf-8"));
    const shotId = safe(listIdOf.get(rec.テストID) || rec.一覧のテストID || rec.テストID);
    const plan = [];
    let n = 0;
    for (const s of rec.場面) for (const im of s.画像) {
      n += 1;
      const want = `${shotId}_${n}${path.extname(im.file)}`;
      plan.push({ im, from: im.file, to: want });
    }
    if (plan.every((p) => p.from === p.to)) { already++; continue; }
    const missing = plan.filter((p) => !fs.existsSync(path.join(dir, p.from)));
    if (missing.length) { skipped++; console.log(`飛ばした（画像が無い ${missing.map((p) => p.from).join("・")}）: ${fid}/${id}`); continue; }
    if (DRY) { renamed++; touched.add(fid); continue; }
    // ぶつからないよう、いったん仮の名前へ移してから、付け直す
    for (const p of plan) fs.renameSync(path.join(dir, p.from), path.join(dir, `${p.from}.renaming`));
    for (const p of plan) { fs.renameSync(path.join(dir, `${p.from}.renaming`), path.join(dir, p.to)); p.im.file = p.to; }
    if (!rec.一覧のテストID && listIdOf.get(rec.テストID)) rec.一覧のテストID = listIdOf.get(rec.テストID);
    const tmp = `${rj}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(rec, null, 2) + "\n");
    fs.renameSync(tmp, rj);
    renamed++; touched.add(fid);
  }
}
console.log(`${DRY ? "付け直す予定" : "付け直した"}: ${renamed}件・付け直し済み: ${already}件・飛ばした: ${skipped}件（${touched.size}機能）`);
if (!DRY && touched.size) {
  execFileSync(process.execPath, [path.join(here, "evidence_index.mjs"), "--quiet", ...touched], { stdio: "inherit", env: { ...process.env, E2E_EVIDENCE_DIR: ROOT } });
  console.log(`エビデンスの MD・HTML・一覧を作り直した（${[...touched].join("・")}）`);
}
