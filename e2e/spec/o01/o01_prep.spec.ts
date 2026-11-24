/**
 * 試験端末（MTGバイヤー）の手動試験用データの準備（O01-01・O01-02）。ケースを流すテストではなく、ケースごとのデータを作る（または記載の状態へ戻す）だけ。
 * 結果（作れたか・控えた番号）は review/mtgbuyer_manual/data/準備結果.tsv へ。手順書（review/mtgbuyer_manual/）がこの表を読む。
 *
 *   tools/pw_run.sh O01-01 spec/o01/o01_prep.spec.ts 003 004      （番号は機能IDの後ろの3桁。実行区分は PW_SLOTS=3 PW_BATCH=2）
 * テストの題は「準備 …」で、エビデンスの対象にならない（lib/evidence_reporter.ts はテストIDで始まる題だけを読む）。タグ @IT-… で選ぶ。
 */
import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { casesOf, seedIdsOf, seedsOf } from "../../lib/catalog";
import { Notes } from "../../lib/notes";
import { buildSeeds, seedIssues } from "../../lib/seeds";
import { o01_01のシードを登録する } from "../../seeds/o01-01";

const FID = "O01-01";
const 結果のファイル = path.resolve(__dirname, "..", "..", "review", "mtgbuyer_manual", "data", "準備結果.tsv");

function 結果を書く(テストID: string, 結果: string, 注記: string, 番号: [string, string][]): void {
  const rows: string[][] = [];
  if (fs.existsSync(結果のファイル)) for (const l of fs.readFileSync(結果のファイル, "utf-8").split("\n").slice(1)) if (l) rows.push(l.split("\t"));
  const one = (s: string) => s.replace(/[\t\r\n]+/g, " ");
  const row = [テストID, 結果, one(注記), one(番号.map(([k, v]) => `${k}=${v}`).join("；")), new Date().toISOString()];
  const i = rows.findIndex((r) => r[0] === テストID);
  if (i >= 0) rows[i] = row; else rows.push(row);
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  fs.mkdirSync(path.dirname(結果のファイル), { recursive: true });
  fs.writeFileSync(結果のファイル, ["テストID\t結果\t注記\t控えた番号\t記録日時", ...rows.map((r) => r.join("\t"))].join("\n") + "\n");
}

o01_01のシードを登録する([...seedsOf(FID).keys()]);

for (const [id, c] of casesOf(FID)) {
  test(`準備 ${id.slice(3)}`, { tag: [`@${id}`] }, async ({ browser }) => {
    const notes = new Notes();
    const 使ったシード = seedIdsOf(c);
    try {
      const used = await buildSeeds(browser, 使ったシード, notes);
      const 注記 = used.flatMap((s) => (seedIssues.get(s) ?? []).map((m) => `${s}: ${m}`)).filter((m) => !/^S-O01-01-(ENV|STORE|MASTER|ADM-TC):/.test(m)).join(" ／ ");
      結果を書く(id, "作成済み", 注記, notes.entries());
    } catch (e) {
      結果を書く(id, "作れなかった", (e as Error).message.split("\n")[0], notes.entries());
      throw e;
    }
  });
}
