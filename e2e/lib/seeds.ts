/**
 * シード（テストデータ）を画面から作る仕組み。
 *
 * シード表（integration_test/casegen/cases/<機能ID>_seed_data.tsv）の1行＝シードID に、作り方（画面操作）を1つ登録する。
 * - 共有可のシード: 同じ状態を複数のケースが使う。あれば使い、無ければ作る（何度呼んでも同じ状態になるように書く）。
 * - ケース専用のシード: そのケースのためだけに、ケースの直前に毎回作る。
 * 画面が振る番号は notes に控える。呼び名はシード表の状態・属性に書いてある〔…〕と同じにする。
 */
import { Browser } from "@playwright/test";
import { getSeed, SeedRow } from "./catalog";
import { Notes } from "./notes";

export type SeedCtx = {
  browser: Browser;
  /** このシードの正本の行 */
  seed: SeedRow;
  /** 控えた番号。共有シードが控えたものも入っている */
  notes: Notes;
};
/**
 * シードを作る途中で見つけた、環境・アプリ側の問題（作れはしたが、画面がエラーを出した など）。
 * 握りつぶさず、そのシードを使ったケースの報告に出す。
 */
export const seedIssues = new Map<string, string[]>();
export function reportSeedIssue(seedId: string, message: string): void {
  seedIssues.set(seedId, [...(seedIssues.get(seedId) ?? []), message]);
}

export type SeedBuilder = (ctx: SeedCtx) => Promise<void>;
/** needs: 先に出来ていなければならないシード（例: 管理者の編集権限を付ける店舗）。ケースの使用シードの並び順に頼らない */
export type SeedOptions = { needs?: string[] };

const registry = new Map<string, { build: SeedBuilder; needs: string[] }>();
/** 共有シードは、ワーカーごとに1回だけ作り方を実行する（控えた番号を持ち回す） */
const sharedDone = new Map<string, [string, string][]>();

export function defineSeed(seedId: string, build: SeedBuilder): void;
export function defineSeed(seedId: string, options: SeedOptions, build: SeedBuilder): void;
export function defineSeed(seedId: string, a: SeedOptions | SeedBuilder, b?: SeedBuilder): void {
  getSeed(seedId); // シード表に無いIDは登録できない
  if (registry.has(seedId)) throw new Error(`${seedId} の作り方が二重に登録されている`);
  const [options, build] = typeof a === "function" ? [{}, a] : [a, b!];
  for (const n of options.needs ?? []) getSeed(n);
  registry.set(seedId, { build, needs: options.needs ?? [] });
}

export function hasSeed(seedId: string): boolean {
  return registry.has(seedId);
}

/** 依存先（needs）を先に、同じシードは一度だけ */
function order(seedIds: string[]): string[] {
  const out: string[] = [];
  const visit = (id: string, path: string[]) => {
    if (path.includes(id)) throw new Error(`シードの依存が循環している: ${[...path, id].join(" → ")}`);
    if (out.includes(id)) return;
    const def = registry.get(id);
    if (!def) throw new Error(`${id} の作り方（画面操作）が e2e/seeds に登録されていない`);
    for (const n of def.needs) visit(n, [...path, id]);
    out.push(id);
  };
  for (const id of seedIds) visit(id, []);
  return out;
}

/** ケースが利用した全シードIDを返す（依存先と共有シードの再利用も含む）。 */
export async function buildSeeds(browser: Browser, seedIds: string[], notes: Notes): Promise<string[]> {
  const usedIds = order(seedIds);
  for (const id of usedIds) {
    const seed = getSeed(id);
    const shared = seed.共有.trim() === "共有可";
    if (shared && sharedDone.has(id)) {
      notes.merge(sharedDone.get(id)!);
      continue;
    }
    const before = new Set(notes.entries().map(([k]) => k));
    await registry.get(id)!.build({ browser, seed, notes });
    const added = notes.entries().filter(([k]) => !before.has(k));
    // シード表が「控える」と書いた呼び名を、作り方が実際に控えたか／シード表に無い呼び名を勝手に控えていないか
    const promised = Notes.labelsIn(seed["状態・属性"] + seed.投入方法);
    for (const l of promised) {
      if (!notes.has(l)) throw new Error(`${id} はシード表で ${l} を控えると定めているが、作り方が控えていない`);
    }
    for (const [l] of added) {
      if (!promised.includes(l)) throw new Error(`${id} の作り方が、シード表に無い呼び名 ${l} を控えた`);
    }
    if (shared) sharedDone.set(id, added);
  }
  return usedIds;
}

/** ケースが使うシード（依存先を含む）に、データを消す作り方のものがあるか。共有環境では、そのケースを実行しない */
export function destructiveSeeds(seedIds: string[]): string[] {
  return order(seedIds).filter((id) => /削除|消す|消して|0件にする/.test(getSeed(id).投入方法));
}
