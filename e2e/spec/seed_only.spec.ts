/**
 * シードの数と、作り方の依存（needs）を数える。DB・アプリには触らない（シードは作らない）。
 *   SEED_ONLY_MODE=count npx playwright test spec/seed_only.spec.ts   （tools/seed_only.sh count）
 * 出力（.runs/seed_only/、git に入れない）:
 *   counts.tsv  機能ごとのシード数・作り方のある数
 *   needs.tsv   シードごとの「作り方の有無」と依存先（tools/seed_order.py が登録順の一覧に使う）
 * 分け方（マスタ／ケースで登録）は review/seed_split.tsv（tools/seed_split.mjs の規則）。
 */
import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { hasSeed, seedNeeds } from "../lib/seeds";

const ROOT = path.resolve(__dirname, "..");
const MODE = process.env.SEED_ONLY_MODE ?? "";
const OUT = path.join(ROOT, ".runs", "seed_only");

type Split = { fid: string; id: string; name: string; cls: string; form: string };
const loadSplit = (): Split[] => fs.readFileSync(path.join(ROOT, "review", "seed_split.tsv"), "utf-8").split("\n").slice(1).filter(Boolean).map((l) => {
  const c = l.split("\t");
  return { fid: c[0], id: c[1], name: c[2], cls: c[5], form: c[6] };
});

/** 機能の作り方（e2e/seeds/<機能ID>*.ts）を読み込む。読み込めないファイルは理由を返す */
function loadSeedFiles(fid: string): string[] {
  const prefix = fid.toLowerCase();
  const problems: string[] = [];
  for (const f of fs.readdirSync(path.join(ROOT, "seeds")).sort()) {
    if (!f.endsWith(".ts") || !(f === `${prefix}.ts` || f.startsWith(`${prefix}-`))) continue;
    try { require(path.join(ROOT, "seeds", f)); } catch (e) { problems.push(`${f}: ${(e as Error).message.split("\n")[0]}`); }
  }
  return problems;
}

test.describe("seed_only", () => {
  test.skip(MODE !== "count", "SEED_ONLY_MODE=count のときだけ流す");

  test("count: シードの数と依存（DB・アプリに触らない）", async () => {
    const split = loadSplit();
    const fids = [...new Set(split.map((r) => r.fid))];
    const problems: string[] = [];
    const rows: string[][] = [];
    for (const fid of fids) {
      problems.push(...loadSeedFiles(fid));
      const mine = split.filter((r) => r.fid === fid);
      const n = (cls: string) => mine.filter((r) => r.cls === cls).length;
      rows.push([fid, mine.length, n("マスタ"), n("ケースで登録"), n("要確認"), mine.filter((r) => hasSeed(r.id)).length, mine.filter((r) => r.form.startsWith("CSV")).length].map(String));
    }
    fs.mkdirSync(OUT, { recursive: true });
    const w = (f: string, head: string[], body: string[][]) => fs.writeFileSync(path.join(OUT, f), [head, ...body].map((r) => r.join("\t")).join("\n") + "\n");
    w("counts.tsv", ["機能ID", "シード数", "マスタ", "ケースで登録", "要確認", "作り方あり", "CSV等候補"], rows);
    w("needs.tsv", ["機能ID", "シードID", "作り方", "依存先"], split.map((r) => [r.fid, r.id, hasSeed(r.id) ? "あり" : "なし", (seedNeeds(r.id) ?? []).join(",")]));
    if (problems.length) fs.writeFileSync(path.join(OUT, "counts_import_problems.txt"), problems.join("\n") + "\n");
  });
});
