/**
 * いま作り方を実行しているシードに注記を残す取り次ぎ（lib/seeds.ts の defineSeed を包むだけ。lib は変えない）。
 * 共通の部品（会員の作り方など）が、シードIDを受け取らずに「環境によって作り方を切り替えた」ことを残すのに使う。
 * defineSeed は lib/seeds.ts のものと同じ形で、作り方の実行の間だけ「いまのシード」を覚える。
 */
import { defineSeed as baseDefineSeed, reportSeedIssue, SeedBuilder, SeedOptions } from "../lib/seeds";
import { MAIN_DEFINED } from "./main_defined";

let current: string | null = null;
const reported = new Map<string, Set<string>>();

/** いま作っているシードの注記に残す（同じ文は1回だけ）。シードの作り方の外で呼ばれたときは何もしない */
export function reportCurrentSeedIssue(message: string): void {
  if (current === null) return;
  const set = reported.get(current) ?? new Set<string>();
  if (set.has(message)) return;
  set.add(message);
  reported.set(current, set);
  reportSeedIssue(current, message);
}

export function defineSeed(seedId: string, build: SeedBuilder): void;
export function defineSeed(seedId: string, options: SeedOptions, build: SeedBuilder): void;
export function defineSeed(seedId: string, a: SeedOptions | SeedBuilder, b?: SeedBuilder): void {
  if (MAIN_DEFINED.has(seedId)) return; // main の作り方を使う（seeds/main_defined.ts）
  const [options, build] = typeof a === "function" ? [{}, a] : [a, b!];
  baseDefineSeed(seedId, options, async (ctx) => {
    const outer = current;
    current = seedId;
    try { await build(ctx); } finally { current = outer; }
  });
}
