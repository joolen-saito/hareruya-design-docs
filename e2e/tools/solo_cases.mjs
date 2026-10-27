#!/usr/bin/env node
/**
 * 並べて流さず、単独で流すケースを出す。 node tools/solo_cases.mjs <機能ID> [--why]
 *
 * 並べて流す（tools/pw_run.sh の枠）のは、ほかの実行とデータがぶつからないケースだけ（依頼者の承認 2026-10-26）。
 * 単独にするのは次のどれかに当たるケース。
 *   1. 使用シード（依存先は数えない）の状態・属性・投入方法に目印「≪共有の設定≫」がある（正本の作り方が共有の設定を書き換える）。
 *      ただし config/parallel_ok_seeds.tsv のシード（E2E の作りが書き換えず確かめるだけのもの。理由つき）は数えない。
 *      確かめるだけのシードは、書き換える側のケースを単独で流す限り、並べても値は変わらない。
 *   2. config/solo_cases.tsv の「対象」がテストIDか機能IDに一致する（全件を数える・次に振られるIDを見る など。理由を書く）
 * 出力は1行1件の「テストID」（--why なら「テストID<TAB>理由」）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const casesDir = path.resolve(root, "..", "integration_test", "casegen", "cases");
const fid = process.argv[2];
const why = process.argv.includes("--why");
if (!/^[A-Z][0-9]{2}-[0-9]{2}$/.test(fid ?? "")) { console.error("使い方: node tools/solo_cases.mjs <機能ID> [--why]"); process.exit(2); }

const readTsv = (f) => {
  if (!fs.existsSync(f)) return [];
  const [head, ...rows] = fs.readFileSync(f, "utf-8").split("\n").filter((l) => l.length).map((l) => l.split("\t"));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
};
const MARK = "≪共有の設定≫";
const seedFiles = new Map();
const seedOf = (id) => {
  const m = id.match(/^S-([A-Z][0-9]{2}-[0-9]{2})-/);
  if (!m) return undefined;
  if (!seedFiles.has(m[1])) seedFiles.set(m[1], new Map(readTsv(path.join(casesDir, `${m[1]}_seed_data.tsv`)).map((s) => [s["シードID"], s])));
  return seedFiles.get(m[1]).get(id);
};
const listed = readTsv(path.join(root, "config", "solo_cases.tsv"));
const readOnly = new Set(readTsv(path.join(root, "config", "parallel_ok_seeds.tsv")).map((r) => r["シードID"]));

for (const c of readTsv(path.join(casesDir, `${fid}_test_cases.tsv`))) {
  const id = c["テストID"];
  const reasons = [];
  for (const s of c["使用シード"].split(/[,、]/).map((x) => x.trim()).filter(Boolean)) {
    const seed = seedOf(s);
    if (seed && !readOnly.has(s) && `${seed["状態・属性"]}${seed["投入方法"]}`.includes(MARK)) reasons.push(`${s} が${MARK}`);
  }
  for (const l of listed) if (l["対象"] === id || l["対象"] === fid) reasons.push(l["理由"] || "config/solo_cases.tsv");
  if (reasons.length) console.log(why ? `${id}\t${reasons.join("／")}` : id);
}
