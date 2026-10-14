/**
 * ケース1件＝テスト1件。
 *
 *   caseTest("IT-M13-02-001", async ({ page, notes, step, expected }) => {
 *     await step(1, async () => { … });        // 正本の手順1
 *     await expected(async () => { … });       // 正本の期待結果
 *   });
 *
 * - テストIDで正本（cases/）を引く。手順・期待結果の文はコードに写さず、正本の文をそのまま報告に出す。
 * - 使用シードは正本の「使用シード」列どおりに、ケースの直前に画面から作る。
 * - 正本の手順をすべて実行し、期待結果を確かめたことを、終わりに検査する（手順の飛ばし・期待結果の確かめ忘れを落とす）。
 * - DB確認は、実行区分が「ブラウザ+DB確認」のケースでだけ使える。
 */
import { test, expect, Browser, Page } from "@playwright/test";
import { CaseRow, getCase, seedIdsOf, stepsOf } from "./catalog";
import { Notes } from "./notes";
import { buildSeeds, destructiveSeeds, seedIssues } from "./seeds";
import * as dbm from "./db";
import { assertRunnable, ENV_NAME, SHARED_ENV } from "../config/env";
import { hideDebugToolbar } from "./session";

export type CaseCtx = {
  page: Page;
  browser: Browser;
  /** 正本の行 */
  c: CaseRow;
  notes: Notes;
  /** 正本の手順 n（1始まり）を実行する */
  step: (n: number, body: () => Promise<void>) => Promise<void>;
  /** 正本の期待結果を確かめる */
  expected: (body: () => Promise<void>) => Promise<void>;
  /** DB確認（参照だけ）。実行区分が「ブラウザ+DB確認」のケースでだけ使える */
  db: typeof dbm;
};

export type CaseBody = (ctx: CaseCtx) => Promise<void>;

export function caseTest(testId: string, body: CaseBody): void {
  const c = getCase(testId); // 正本に無い・除外されたIDは、ここで読み込み時に落ちる
  const steps = stepsOf(c);
  test(`${testId} ${c.期待結果}`, {
    annotation: [
      { type: "観点ID", description: c.観点ID },
      { type: "優先度", description: c.優先度 },
      { type: "実行区分", description: c.実行区分 },
      { type: "出典", description: c.出典 },
    ],
  }, async ({ page, browser }) => {
    assertRunnable();
    const withDb = c.実行区分.includes("DB確認");
    test.skip(withDb && !dbm.available, `E2E_ENV=${ENV_NAME} はDB確認の接続先が無いので、「ブラウザ+DB確認」のケースは実行しない`);
    const destructive = SHARED_ENV ? destructiveSeeds(seedIdsOf(c)) : [];
    test.skip(destructive.length > 0, `E2E_ENV=${ENV_NAME} は複数人が使う環境。データを消すシード（${destructive.join("、")}）を使うケースは実行しない`);
    await hideDebugToolbar(page.context());
    const notes = new Notes();
    await test.step(`事前準備: ${c.事前準備}`, async () => {
      await buildSeeds(browser, seedIdsOf(c), notes);
      for (const id of seedIdsOf(c)) {
        for (const m of seedIssues.get(id) ?? []) test.info().annotations.push({ type: "シード作成時の問題", description: `${id}: ${m}` });
      }
      // ケースの文に出てくる呼び名が、すべて控えてあること
      for (const l of Notes.labelsIn(c.事前準備 + c.手順 + c.期待結果)) notes.get(l);
    });
    const done = new Set<number>();
    let checked = 0;
    const ctx: CaseCtx = {
      page, browser, c, notes,
      step: async (n, fn) => {
        if (n < 1 || n > steps.length) throw new Error(`${testId} の手順は ${steps.length} 個。手順 ${n} は無い`);
        if (done.has(n)) throw new Error(`${testId} の手順 ${n} を二度実行している`);
        if (n !== done.size + 1) throw new Error(`${testId} の手順は順に実行する（次は手順 ${done.size + 1}）`);
        await test.step(notes.resolve(steps[n - 1]), fn);
        done.add(n);
      },
      expected: async (fn) => {
        if (done.size !== steps.length) throw new Error(`${testId}: 期待結果は、正本の手順 ${steps.length} 個をすべて実行してから確かめる（いま ${done.size} 個）`);
        await test.step(`期待結果: ${notes.resolve(c.期待結果)}`, fn);
        checked += 1;
      },
      db: new Proxy(dbm, {
        get(target, prop, receiver) {
          if (!withDb) throw new Error(`${testId} の実行区分は「${c.実行区分}」。DB確認は使えない`);
          return Reflect.get(target, prop, receiver);
        },
      }),
    };
    await body(ctx);
    expect(done.size, `${testId}: 正本の手順 ${steps.length} 個のうち ${done.size} 個しか実行していない`).toBe(steps.length);
    expect(checked, `${testId}: 期待結果を確かめていない`).toBeGreaterThan(0);
  });
}
