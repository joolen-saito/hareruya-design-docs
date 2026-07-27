/**
 * 画面到達ヘルパー（結合テストの到達要件を実行時に強制する）。
 *
 * 結合テストは「その画面に正規の手順で到達できること」までを含めて検証する。
 * 確認画面・完了画面・ウィザード中間画面のように、直URLでは正規表示されない画面
 * （到達クラス = transition-only）を `page.goto()` で開くと、遷移そのものの欠陥を
 * 見逃すうえ、直アクセス時のガード（トップへ戻す等）を踏んで無関係な失敗になる。
 *
 * 到達クラスの正は `e2e/config/screen-reachability.tsv`（根拠 file:line 付き確定台帳）。
 * 台帳は設計書の「利用者視点の入口」「画面遷移」「遷移時に引き継ぐ状態」から確定する。
 *
 *   enter()        起点画面（entry-direct）へ直接入る。transition-only なら throw。
 *   step()         遷移を1段進める（画面上の操作で発火させ、到達URLを検証する）。
 *   reachVia()     起点 + 遷移列で目的画面へ到達する。結合テストの既定形。
 *   directAccess() 直アクセスそのものが観点のときだけ使う（理由必須・記録される）。
 *
 * 静的監査は audit_transition_paths.py が spec/page の `page.goto()` を検査する。
 * 本ヘルパー経由の到達は実行時にも検査されるため、両輪で守る。
 *
 * 強制レベルは E2E_REACHABILITY_ENFORCE で切り替える。
 *   error（既定）: 台帳違反で throw
 *   warn         : 警告のみ（移行期間用）
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../config/default.config";

export type ReachabilityClass =
  | "entry-direct"
  | "transition-only"
  | "action-endpoint"
  | "要確認"
  | "非画面(API/バッチ)";

export interface ReachabilityEntry {
  fid: string;
  path: string;
  klass: ReachabilityClass;
  route: string;
  directExpect: string;
  evidence: string;
  status: string;
  matcher: RegExp;
}

const ENFORCE = (process.env.E2E_REACHABILITY_ENFORCE || "error").toLowerCase();

let registryCache: ReachabilityEntry[] | null = null;

function toMatcher(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{[^}]*\\\}/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

/** URLをサイトルート相対の比較形に正規化する（ロケール/店舗プレフィックスと末尾スラッシュを落とす）。 */
export function normalizePath(raw: string): string {
  let p = raw.trim();
  p = p.replace(/^https?:\/\/[^/]+/, "");
  p = p.split("?")[0].split("#")[0];
  p = p.replace(/\/\{_locale\}/g, "").replace(/\/\{locale\}/g, "");
  p = p.replace(/\/$/, "");
  return p || "/";
}

/**
 * 実URLから**設定済みの**プレフィックスだけを剥がした候補を返す。
 *
 * 先頭セグメントを無条件に剥がすと `/x/y/shopping/complete` を `/shopping/complete` と
 * 同一視してしまう（別画面の誤マッチ）。剥がしてよいのは環境設定で分かっている
 * ロケール・店舗・管理画面ルートに限る。
 */
function knownPrefixes(): string[] {
  const locale = ECCUBE_FRONT_LOCALE ? `/${ECCUBE_FRONT_LOCALE}` : "";
  const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
  const admin = ECCUBE_ADMIN_ROUTE ? `/${ECCUBE_ADMIN_ROUTE}` : "";
  const out = new Set<string>();
  for (const p of [locale, admin, locale + shop, shop]) {
    if (p) out.add(p);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

function candidates(path: string): string[] {
  const out = [path];
  for (const prefix of knownPrefixes()) {
    if (path === prefix) {
      out.push("/");
    } else if (path.startsWith(prefix + "/")) {
      out.push(path.slice(prefix.length));
    }
  }
  return [...new Set(out)];
}

export function loadReachability(): ReachabilityEntry[] {
  if (registryCache) return registryCache;
  const file = join(__dirname, "..", "config", "screen-reachability.tsv");
  const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim() !== "");
  const header = lines[0].split("\t");
  const idx = (name: string) => header.indexOf(name);
  const entries: ReachabilityEntry[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split("\t");
    const path = normalizePath(c[idx("パス")] ?? "");
    if (!path) continue;
    entries.push({
      fid: c[idx("機能ID")] ?? "",
      path,
      klass: (c[idx("到達クラス")] ?? "") as ReachabilityClass,
      route: c[idx("正規到達経路")] ?? "",
      directExpect: c[idx("直アクセス時の期待")] ?? "",
      evidence: c[idx("根拠(file:line)")] ?? "",
      status: c[idx("確定状態")] ?? "",
      matcher: toMatcher(path),
    });
  }
  // 長いパスを先に評価する（/shopping より /shopping/complete を優先）。
  entries.sort((a, b) => b.path.length - a.path.length);
  registryCache = entries;
  return entries;
}

export function lookupReachability(path: string): ReachabilityEntry | undefined {
  const registry = loadReachability();
  const hits: ReachabilityEntry[] = [];
  for (const cand of candidates(normalizePath(path))) {
    const hit = registry.find((e) => e.matcher.test(cand));
    if (hit && !hits.includes(hit)) hits.push(hit);
  }
  if (hits.length > 1) {
    // プレフィックス剥離の前後で別々の台帳行に当たった＝どちらの画面か決められない。
    // 黙って片方を採ると誤判定になるため止める。
    throw new Error(
      `[reachability] ${path} が複数の台帳行に一致して曖昧: ` +
        hits.map((h) => `${h.fid} ${h.path}`).join(" / ")
    );
  }
  return hits[0];
}

function violate(message: string): void {
  if (ENFORCE === "warn") {
    // eslint-disable-next-line no-console
    console.warn(`[reachability] ${message}`);
    return;
  }
  throw new Error(`[reachability] ${message}`);
}

function annotate(type: string, description: string): void {
  try {
    test.info().annotations.push({ type, description });
  } catch {
    // test コンテキスト外（Page Object の単体利用等）では記録をスキップする。
  }
}

/**
 * 起点画面へ直接入る。到達クラスが entry-direct の画面にのみ使える。
 * transition-only の画面に使うと台帳違反として弾く（結合テストの到達要件）。
 */
export async function enter(page: Page, path: string): Promise<void> {
  const entry = lookupReachability(path);
  if (!entry) {
    // eslint-disable-next-line no-console
    console.warn(
      `[reachability] 未登録パス ${path}。e2e/config/screen-reachability.tsv へ根拠付きで登録するまで到達妥当性を判定できない`
    );
  } else if (entry.klass === "transition-only") {
    violate(
      `${path} は遷移必須画面（${entry.fid}）。enter() で直接開けない。` +
        `正規経路=${entry.route}／根拠=${entry.evidence}。` +
        `直アクセスそのものが観点なら directAccess(page, path, 理由) を使う`
    );
  } else if (entry.klass === "action-endpoint") {
    violate(
      `${path} は送信系エンドポイントで画面ではない（${entry.fid}）。` +
        `画面上の操作で発火させる／根拠=${entry.evidence}`
    );
  } else if (entry.klass === "要確認") {
    // 未確定の画面をURL直打ちで開くのは「直アクセス試験」であって通常到達ではない。
    // enter() を通すと未確定であることが記録に残らないため、directAccess() を要求する。
    violate(
      `${path} は到達クラス未確定（${entry.fid}／${entry.evidence}）。` +
        `enter() では開けない。URL直打ちが必要なら directAccess(page, path, 理由) を使い、` +
        `到達クラスは実機確認等で確定させる`
    );
  }
  await rawGoto(page, path);
}

/**
 * ヘルパー内部からの唯一の遷移実行口。
 *
 * enter()/directAccess() は呼ぶ前に台帳照合を済ませているため、フィクスチャの
 * `page.goto` ガード（二重判定）を避けて素の goto を使う。素の goto は
 * フィクスチャが `__rawGoto` に退避している。
 */
async function rawGoto(page: Page, path: string): Promise<void> {
  const original = (page as unknown as { __rawGoto?: Page["goto"] }).__rawGoto;
  await (original ? original.call(page, path) : page.goto(path));
}

/**
 * `action` の実行中だけ page.goto を封鎖する。
 * 遷移は画面上の操作で起きなければならず、action 内の goto は「遷移ではなく直アクセス」。
 *
 * 復元するのは**封鎖前に載っていた goto そのもの**。`__rawGoto`（素の goto）を復元すると
 * フィクスチャのガードを剥がしてしまい、step() を1回通しただけで以後の生 goto が
 * 素通りする（実際にその不具合があった）。
 */
async function withGotoBlocked<T>(page: Page, label: string, fn: () => Promise<T>): Promise<T> {
  const holder = page as unknown as { goto: Page["goto"] };
  const previous = holder.goto;
  holder.goto = (async (url: string) => {
    throw new Error(
      `[reachability] 遷移「${label}」の中で page.goto(${url}) が呼ばれた。` +
        `遷移は画面上の操作（クリック・送信）で起こすこと。直アクセスが目的なら directAccess() を使う`
    );
  }) as Page["goto"];
  try {
    return await fn();
  } finally {
    holder.goto = previous;
  }
}

/**
 * 遷移を1段進める。画面上の操作（クリック・送信）で発火させ、到達URLを検証する。
 * `action` の中で page.goto を呼ぶと実行時に失敗する（封鎖される）。
 */
export async function step(
  page: Page,
  label: string,
  action: () => Promise<unknown>,
  expectUrl?: RegExp
): Promise<void> {
  annotate("transition", label);
  await withGotoBlocked(page, label, action);
  if (expectUrl) {
    await expect(page).toHaveURL(expectUrl);
  }
}

export interface TransitionStep {
  /** 「購入手続きへ」など、設計書の遷移条件に対応する操作名。 */
  label: string;
  /** 画面上の操作。page.goto は使わない。 */
  action: () => Promise<unknown>;
  /** 遷移後に到達しているべきURL。 */
  expectUrl?: RegExp;
}

/**
 * 起点画面から遷移列をたどって目的画面へ到達する（結合テストの既定形）。
 * 目的画面の到達クラスが transition-only であることを台帳で確認し、
 * 実際に遷移してから到達URLを検証する。
 */
export async function reachVia(
  page: Page,
  originPath: string,
  steps: TransitionStep[],
  targetUrl: RegExp
): Promise<void> {
  if (steps.length === 0) {
    throw new Error("[reachability] reachVia には最低1つの遷移が必要（0段なら直アクセス）");
  }
  await enter(page, originPath);
  for (const s of steps) {
    await step(page, s.label, s.action, s.expectUrl);
  }
  await expect(page).toHaveURL(targetUrl);
}

/**
 * 直アクセスそのものが観点のときだけ使う（未認証直アクセス・状態欠落時のガード検証・
 * URL契約の検証など）。理由は必須で、Playwright の annotation（`direct-access`）として
 * 実行結果に残る（静的監査レポートはこの annotation を読まない）。
 */
export async function directAccess(page: Page, path: string, reason: string): Promise<void> {
  if (!reason || reason.trim().length < 4) {
    throw new Error("[reachability] directAccess には具体的な理由が必要（直アクセスが観点である根拠）");
  }
  const entry = lookupReachability(path);
  if (entry?.klass === "entry-direct") {
    // 起点画面に directAccess を使うと「直アクセス観点」の注記が氾濫し、
    // 本当に検証したい直アクセス試験が埋もれる。
    violate(
      `${path} は起点画面（${entry.fid}）。通常到達は enter() を使う` +
        `（直アクセスが観点になるのは transition-only / action-endpoint / 未確定の画面）`
    );
  }
  annotate(
    "direct-access",
    `${path}: ${reason}${entry?.directExpect ? `／台帳の直アクセス時の期待: ${entry.directExpect}` : ""}`
  );
  await rawGoto(page, path);
}

/** 台帳が定める「直アクセス時の期待」を取得する（期待値の直書きを避けるため）。 */
export function directAccessExpectation(path: string): string[] {
  const entry = lookupReachability(path);
  if (!entry || !entry.directExpect || entry.directExpect.startsWith("未確定")) return [];
  return entry.directExpect.split(";").map((s) => s.trim()).filter(Boolean);
}
