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
 * - エビデンスとして、手順1の前・各手順のあと・期待結果を確かめたあとの画面を自動で撮る（lib/evidence.ts）。
 *   期待結果の中の確かめ（expect）は、期待と実際の状態の組として記録する（lib/evidence_expect.ts。expect はこのファイルから使う）。
 *   手順の途中の画面も残したいときは capture("ラベル") を呼ぶ。撮れても撮れなくても合否は変わらない。
 */
import { test, expect, Browser, Page } from "@playwright/test";
import { CaseRow, getCase, getSeed, seedIdsOf, stepsOf } from "./catalog";
import { markedIn } from "./run_marker";
import { Notes } from "./notes";
import { buildSeeds, destructiveSeeds, seedIssues } from "./seeds";
import * as dbm from "./db";
import { assertRunnable, ENV_NAME, SHARED_ENV } from "../config/env";
import { hideDebugToolbar } from "./session";
import { EVIDENCE_PREFIX, EvidenceCamera, scene } from "./evidence";
import { Check, startRecording, stopRecording } from "./evidence_expect";

/** spec はこの expect を使う（Playwright の expect と同じ。期待結果の確かめでは、期待と実際の状態を記録する） */
export { expect } from "./evidence_expect";

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
  /** いまの画面をエビデンスとして撮る（手順・期待結果の自動のキャプチャに加えて残したいとき）。ラベルは業務の言葉で書く */
  capture: (label: string) => Promise<void>;
};

export type CaseBody = (ctx: CaseCtx) => Promise<void>;

export function caseTest(testId: string, body: CaseBody): void {
  const c = getCase(testId); // 正本に無い・除外されたIDは、ここで読み込み時に落ちる
  const steps = stepsOf(c);
  test(`${testId} ${c.期待結果}`, {
    // tools/pw_run.sh はこのタグでケースを1件だけ選ぶ（期待結果の文に別のテストIDが出てきても混ざらない）
    tag: [`@${testId}`],
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
    const camera = new EvidenceCamera(page, test.info());
    await test.step(`事前準備: ${c.事前準備}`, async () => {
      const usedSeedIds = await buildSeeds(browser, seedIdsOf(c), notes);
      for (const id of usedSeedIds) {
        for (const m of seedIssues.get(id) ?? []) test.info().annotations.push({ type: "シード作成時の問題", description: `${id}: ${m}` });
      }
      // ケースの文に出てくる呼び名が、すべて控えてあること
      for (const l of Notes.labelsIn(c.事前準備 + c.手順 + c.期待結果)) notes.get(l);
      // 決め打ちの値に付けた実行の印（依頼者決定 2026-10-28）も、正本の値と実際の値の対応として残す
      const seedText = usedSeedIds.map((id) => { const s = getSeed(id); return s["状態・属性"] + s.投入方法; }).join(" ");
      const marked = markedIn(c.事前準備 + c.手順 + c.期待結果 + seedText).map(([v, a]) => [`実行の印: ${v}`, a] as [string, string]);
      await test.info().attach(`${EVIDENCE_PREFIX}控えた番号`, { body: JSON.stringify([...notes.entries(), ...marked]), contentType: "application/json" });
    });
    const done = new Set<number>();
    let checked = 0;
    /** いま実行している手順（期待結果は "expected"）。capture のラベルを場面に振り分ける */
    let current: number | "expected" | undefined;
    let lastStep = 0;
    /** 期待結果の確かめの記録（期待と実際の状態）。expected() が何度呼ばれても足していく */
    const checks: Check[] = [];
    let startShot = false;
    const ctx: CaseCtx = {
      page, browser, c, notes,
      step: async (n, fn) => {
        if (n < 1 || n > steps.length) throw new Error(`${testId} の手順は ${steps.length} 個。手順 ${n} は無い`);
        if (done.has(n)) throw new Error(`${testId} の手順 ${n} を二度実行している`);
        if (n !== done.size + 1) throw new Error(`${testId} の手順は順に実行する（次は手順 ${done.size + 1}）`);
        if (!startShot) { startShot = true; await camera.shoot(scene.start); }
        current = n;
        // 手順の中の確かめも、期待と実際の状態の組として残す（期待結果の一部を手順の中で確かめるケースがある）
        startRecording();
        try {
          await test.step(notes.resolve(steps[n - 1]), fn);
        } finally {
          current = undefined;
          const stepChecks = stopRecording();
          if (stepChecks.length) {
            await test.info().attach(`${EVIDENCE_PREFIX}手順${n}:確かめの記録`, { body: JSON.stringify(stepChecks), contentType: "application/json" }).catch(() => {});
          }
          await camera.shoot(scene.step(n)); // 手順が落ちたときも、落ちた時点の画面を残す
        }
        done.add(n);
        lastStep = n;
      },
      expected: async (fn) => {
        if (done.size !== steps.length) throw new Error(`${testId}: 期待結果は、正本の手順 ${steps.length} 個をすべて実行してから確かめる（いま ${done.size} 個）`);
        current = "expected";
        startRecording();
        try {
          await test.step(`期待結果: ${notes.resolve(c.期待結果)}`, fn);
        } finally {
          current = undefined;
          checks.push(...stopRecording());
          await test.info().attach(`${EVIDENCE_PREFIX}確かめの記録`, { body: JSON.stringify(checks), contentType: "application/json" }).catch(() => {});
          await camera.shoot(scene.expected);
        }
        checked += 1;
      },
      capture: async (label) => {
        const l = label.replace(/[:#]/g, "・").trim();
        if (!l) throw new Error(`${testId}: capture のラベルが空`);
        // 手順の外で呼ばれたら、直前に終えた手順のあとの画面として記録する（手順1の前なら開始時）
        const at = current ?? (lastStep || undefined);
        await camera.shoot(at === undefined ? `${scene.start}:${l}` : at === "expected" ? scene.expectedLabel(l) : scene.stepLabel(at, l));
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
