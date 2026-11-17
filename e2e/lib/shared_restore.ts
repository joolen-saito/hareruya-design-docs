/**
 * 共有の設定・共有のデータを書き換えるケースの「必ず元に戻す」仕組み（手元だけ・栗野。依頼者 2026-11-11「ちゃんと元に戻してね」）。
 *
 * 使い方（シードやテストの中で、書き換える「前に」呼ぶ）:
 *   const before = await 今の値を読む();
 *   registerRestore("タグ1000の対象商品", { before }, async () => { await 元の値に戻す(before); }, async () => 今の値と before が同じ);
 *   await 書き換える();
 *
 * - 書き換える前に、元の値を .runs/shared_restore/journal.tsv に書く（落ちても、手で戻すときに元の値が分かる）。
 * - ケースの終わり（成否によらず）に、登録の逆順で戻す → 戻ったかを確かめる（verify）。
 * - 戻せなかったら journal に「戻せない」と書き、.runs/shared_restore/STOP を作り（共有の書き換えの流しを止める）、通知を出し、ケースを落とす。
 * - 戻すことを登録したシードは、ワーカーの中で使い回さない（seeds.ts）。
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DIR = path.resolve(__dirname, "..", ".runs", "shared_restore");
const JOURNAL = path.join(DIR, "journal.tsv");
export const STOP_FILE = path.join(DIR, "STOP");

type Entry = { label: string; restore: () => Promise<void>; verify?: () => Promise<boolean> };
let pending: Entry[] = [];
let testId = "";

function journal(state: string, label: string, detail: unknown): void {
  fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(JOURNAL)) fs.writeFileSync(JOURNAL, "時刻\tテストID\t状態\t対象\t元の値・詳細\n");
  const d = typeof detail === "string" ? detail : JSON.stringify(detail);
  fs.appendFileSync(JOURNAL, [new Date().toISOString(), testId, state, label, (d ?? "").replace(/[\t\n]/g, " ")].join("\t") + "\n");
}

export function beginCase(id: string): void {
  testId = id;
  pending = [];
}

/** 前の回で戻せなかった共有の書き換えがあるか（STOP のファイルがあるか）。あれば、その中身の先頭の行 */
export function 共有の書き換えの止め(): string | null {
  try { return fs.readFileSync(STOP_FILE, "utf-8").split("\n").find((l) => l.trim() !== "") ?? null; } catch { return null; }
}

/**
 * 共有のものを書き換える前に呼ぶ。before は元の値（journal に残す。戻すのは restore の中で）。
 * 前の回で戻せなかった書き換えがあれば（STOP のファイルがあれば）、書き換えずに止める（2026-11-17。STOP を作るだけで、読んで止める処理が無かった）。
 * 手で戻して確かめたら、.runs/shared_restore/STOP を消すと流せるようになる。
 */
export function registerRestore(label: string, before: unknown, restore: () => Promise<void>, verify?: () => Promise<boolean>): void {
  const 止め = 共有の書き換えの止め();
  if (止め) throw new Error(`共有の書き換えを止めている（前の回で戻せなかった: ${止め.replace(/\t/g, " ").slice(0, 200)}）。${label} は書き換えない。手で戻して確かめてから ${STOP_FILE} を消す`);
  journal("書き換える前", label, before);
  pending.push({ label, restore, verify });
}

export function pendingCount(): number {
  return pending.length;
}

/** ケースの終わりに呼ぶ。戻せなかった対象の一覧を返す（空なら全部戻った） */
export async function runRestores(): Promise<string[]> {
  const failed: string[] = [];
  for (const e of pending.reverse()) {
    let ok = false;
    let why = "";
    for (let i = 0; i < 3 && !ok; i++) {
      try {
        await e.restore();
        ok = e.verify ? await e.verify() : true;
        if (!ok) why = "戻したあとの値が元と違う";
      } catch (err) {
        why = String((err as Error)?.message ?? err).slice(0, 300);
      }
    }
    journal(ok ? "戻した" : "戻せない", e.label, ok ? "" : why);
    if (!ok) failed.push(`${e.label}（${why}）`);
  }
  pending = [];
  if (failed.length) {
    fs.mkdirSync(DIR, { recursive: true });
    fs.appendFileSync(STOP_FILE, `${new Date().toISOString()}\t${testId}\t${failed.join("、")}\n`);
    try {
      execFileSync("osascript", ["-e", `display notification "${testId}: 共有の設定を元に戻せなかった" with title "E2E 開発環境"`]);
    } catch { /* 通知が出せなくても続ける */ }
  }
  return failed;
}
