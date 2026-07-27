/**
 * 到達強制フィクスチャ。
 *
 * `helpers/navigation.ts` は enter()/reachVia()/directAccess() を経由した到達しか検査できず、
 * spec や Page Object が生の `page.goto()` を呼べばすり抜ける。本フィクスチャは `context` を
 * 差し替え、そのコンテキストで生まれる**すべての Page**（fixture の page・`context.newPage()`・
 * ポップアップ）の `page.goto()` を到達台帳（e2e/config/screen-reachability.tsv）に照らして検査する。
 *
 * 使い方（navigate する spec はこちらを import する）:
 *   import { test, expect } from "../../fixtures/reachability.fixture";
 *
 * テスト内で `browser.newContext()` を自分で作る場合は、このフィクスチャの外になるため
 * `guardPage(page)` / `guardContext(context)` を明示的に呼ぶこと（静的監査でも検出する）。
 *
 * ヘルパー経由の到達（enter / reachVia / directAccess）は検査済みのため素通しする。
 * 強制レベルは E2E_REACHABILITY_ENFORCE（既定 error、warn で警告のみ）。
 *
 * 対象外（明文化）:
 *   - APIRequestContext（`request.get()` 等）は画面到達ではないため検査しない。
 *     UI到達の代替として使ってはならない（画面遷移の検証にならない）。
 */
import { test as base, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { lookupReachability } from "../helpers/navigation";

const ENFORCE = (process.env.E2E_REACHABILITY_ENFORCE || "error").toLowerCase();

function reject(message: string): void {
  if (ENFORCE === "warn") {
    // eslint-disable-next-line no-console
    console.warn(`[reachability] ${message}`);
    return;
  }
  throw new Error(`[reachability] ${message}`);
}

/** 1つの Page の goto を台帳照合つきに差し替える（多重適用は無視する）。 */
export function guardPage(page: Page): Page {
  const holder = page as unknown as {
    goto: Page["goto"];
    __rawGoto?: Page["goto"];
    __reachabilityGuarded?: boolean;
  };
  if (holder.__reachabilityGuarded) return page;
  holder.__reachabilityGuarded = true;

  const original = holder.goto.bind(page);
  holder.__rawGoto = original;

  holder.goto = (async (url: string, options?: Parameters<Page["goto"]>[1]) => {
    const entry = lookupReachability(url);
    if (entry?.klass === "transition-only") {
      reject(
        `${url} は遷移必須画面（${entry.fid}）。page.goto では開けない。` +
          `reachVia() で起点から遷移するか、直アクセスが観点なら directAccess() を使う／` +
          `正規経路=${entry.route}／根拠=${entry.evidence}`
      );
    } else if (entry?.klass === "action-endpoint") {
      reject(
        `${url} は送信系エンドポイントで画面ではない（${entry.fid}）。` +
          `画面上の操作で発火させる／根拠=${entry.evidence}`
      );
    } else if (entry?.klass === "要確認") {
      reject(
        `${url} は到達クラス未確定（${entry.fid}）。URL直打ちが必要なら` +
          ` directAccess(page, url, 理由) を使う／根拠=${entry.evidence}`
      );
    }
    return original(url, options);
  }) as Page["goto"];

  return page;
}

/** コンテキスト配下の既存・将来すべての Page を守る（ポップアップ・newPage を含む）。 */
export function guardContext(context: BrowserContext): BrowserContext {
  for (const p of context.pages()) guardPage(p);
  context.on("page", (p) => guardPage(p));
  return context;
}

export const test = base.extend<{ context: BrowserContext; page: Page }>({
  context: async ({ context }, use) => {
    guardContext(context);
    await use(context);
  },
  page: async ({ page }, use) => {
    guardPage(page);
    await use(page);
  },
});

export { expect };
