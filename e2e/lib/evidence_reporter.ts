/**
 * エビデンスの書き出し（Playwright のレポーター）。
 *
 * ケース1件（テストIDが IT-… のテスト）が終わるたびに、次の形で書き出す。
 *   evidence/<機能ID>/<テストID>/result.json   機械が読む記録（evidence_index.mjs が MD・HTML・TSV を作る元）
 *   evidence/<機能ID>/<テストID>/NN_<場面>.png   手順ごとの画面（lib/evidence.ts が撮ったもの）
 *   evidence/<機能ID>/<テストID>/Playwrightの画面_N.png・trace.zip   落ちたときだけ（Playwright が撮ったもの）
 *   evidence/<機能ID>/history.tsv                実施の履歴（1件1行。追記するだけ）
 * ケースのディレクトリは最新の実施だけを持つ（同じケースを流し直すと置き換わる）。履歴は history.tsv に残る。
 * 全部終わったら、触った機能について tools/evidence_index.mjs を流して、MD・HTML・TSV を作り直す。
 *
 * 置き場所は E2E_EVIDENCE_DIR で変えられる（既定は e2e/evidence）。
 * ここは記録するだけで、合否を変えない。合否は Playwright の結果のまま。
 */
import type { FullConfig, Reporter, Suite, TestCase, TestResult, TestStep } from "@playwright/test/reporter";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getCase, functionIdOf, stepsOf } from "./catalog";
import { BASE_URL, ENV_NAME, REPO_ROOT } from "../config/env";
import { EVIDENCE_PREFIX } from "./evidence";

const E2E_DIR = path.resolve(__dirname, "..");
export const EVIDENCE_ROOT = path.resolve(process.env.E2E_EVIDENCE_DIR || path.join(E2E_DIR, "evidence"));
const SUT_DIR = process.env.E2E_SUT_DIR || path.resolve(REPO_ROOT, "..", "ec-cube-enterprise");
const ID_RE = /^(IT-[A-Z]\d\d-\d\d-\d{3,})(\s|$)/;
const ANSI = /\u001b\[[0-9;]*m/g;

/** 正本の指紋。ケースの中身（使用シード・事前準備・手順・期待結果・実行区分）が変わったら、エビデンスは古い */
export function caseFingerprint(c: { 実行区分: string; 使用シード: string; 事前準備: string; 手順: string; 期待結果: string }): string {
  return createHash("sha256").update([c.実行区分, c.使用シード, c.事前準備, c.手順, c.期待結果].join("\u0000")).digest("hex").slice(0, 16);
}

function git(dir: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", dir, ...args], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function revisionOf(dir: string, sub?: string): string {
  if (!fs.existsSync(dir)) return "不明";
  const head = git(dir, ["rev-parse", "--short", "HEAD"]);
  if (!head) return "不明";
  const dirty = git(dir, ["status", "--porcelain", ...(sub ? ["--", sub] : [])]);
  return dirty ? `${head}（未コミットの変更あり）` : head;
}

function idMap(): Map<string, string> {
  const m = new Map<string, string>();
  const f = path.join(REPO_ROOT, "integration_test", "casegen", "all_test_cases_id_map.tsv");
  if (!fs.existsSync(f)) return m;
  for (const line of fs.readFileSync(f, "utf-8").split(/\r?\n/).slice(1)) {
    const [listId, caseId] = line.split("\t");
    if (listId && caseId) m.set(caseId, listId);
  }
  return m;
}

const resolveLabels = (text: string, notes: Map<string, string>) => text.replace(/〔[^〕]+〕/g, (l) => (notes.has(l) ? `${l}=${notes.get(l)}` : l));
const clean = (s: string | undefined) => (s ?? "").replace(ANSI, "").trimEnd();
const safe = (s: string) => s.replace(/[\\/:*?"<>|#\s]+/g, "_").slice(0, 60);

type Shot = { file: string; 場面: string; URL?: string; 注記?: string };
type Scene = { 種類: "開始時" | "手順" | "期待結果"; 番号?: number; 文: string; 状態: "済" | "失敗" | "未実行"; 秒?: number; 画像: Shot[]; 撮れなかった: string[]; エラー?: string; 確かめ?: Check[] };
type Check = { 項目: string; 結果: "合格" | "不合格"; 期待?: string; 実際?: string; エラー?: string };

/** 落ちた確かめのエラー出力から、期待と実際を拾う（記録の無い確かめのため） */
function fromError(msg: string): { 期待?: string; 実際?: string } {
  const pick = (re: RegExp) => re.exec(msg)?.[1]?.trim();
  const 期待 = pick(/^\s*Expected[^:\n]*:\s*(.+)$/m);
  const 実際 = pick(/^\s*Received[^:\n]*:\s*(.+)$/m);
  return { ...(期待 ? { 期待 } : {}), ...(実際 ? { 実際 } : {}) };
}

/** caseTest は lib/case.ts の中で test() を呼ぶので、テストの位置はファイルの単位から取り、行はテストIDの文字列で探す */
function specLocation(test: TestCase, testId: string): string {
  let s: Suite | undefined = test.parent;
  while (s && s.type !== "file") s = s.parent;
  const file = s?.location?.file;
  if (!file) return "";
  let line = 0;
  try {
    line = fs.readFileSync(file, "utf-8").split("\n").findIndex((l) => l.includes(`"${testId}"`)) + 1;
  } catch { /* 読めなければ行なし */ }
  return `${path.relative(REPO_ROOT, file)}${line ? `:${line}` : ""}`;
}

/**
 * テストコード（spec ファイル）の指紋。spec を直したあとの古いエビデンスを「要再実行」と出すため。
 * 画面の部品（pages/）・シード（seeds/）の変更は含まない（全ケースが古くなるので）。それらを直したら --failed などで流し直す
 */
export function specFingerprint(test: TestCase): string {
  let s: Suite | undefined = test.parent;
  while (s && s.type !== "file") s = s.parent;
  const file = s?.location?.file;
  if (!file || !fs.existsSync(file)) return "";
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 16);
}

/** 実施日時は日本時間で秒まで（判定の表の「対象の実施日時」と突き合わせるので、形を変えない） */
function jst(d: Date): string {
  const t = new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 19);
  return `${t}+09:00`;
}

/**
 * 手順（または期待結果）が落ちたか。手順そのものが例外で終わったか、中の確かめ（expect。soft を含む）が落ちたときだけ。
 * 手順の中で受け止めて済ませた操作の失敗（待ちの時間切れを捕まえて別の道を行く など）は数えない。
 */
function hasError(step: TestStep): boolean {
  let e = !!step.error;
  walkChecks(step, (s) => { if (s.error) e = true; });
  return e;
}

/**
 * 中の確かめ（expect の step）を順に渡す。確かめの中へは降りない: expect.poll・toPass は、通るまでの空振りを
 * 子の step（落ちた確かめ）として持つので、降りると、最後に通った確かめを落ちたと数えてしまう（M03-01 の038）。
 */
function walkChecks(step: TestStep, fn: (s: TestStep) => void): void {
  for (const c of step.steps) {
    if (c.category === "expect") fn(c);
    else walkChecks(c, fn);
  }
}

/** テストの注記と、実行中に足された注記は重なって届くことがある。同じものは多い方の数だけ残す */
function mergeAnnotations(a: { type: string; description?: string }[], b: { type: string; description?: string }[]) {
  const key = (x: { type: string; description?: string }) => `${x.type}\u0000${x.description ?? ""}`;
  const counts = (xs: typeof a) => xs.reduce((m, x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1), new Map<string, number>());
  const ca = counts(a), cb = counts(b);
  const out: typeof a = [];
  const seen = new Map<string, number>();
  for (const x of [...a, ...b]) {
    const k = key(x);
    const n = seen.get(k) ?? 0;
    if (n < Math.max(ca.get(k) ?? 0, cb.get(k) ?? 0)) { out.push(x); seen.set(k, n + 1); }
  }
  return out;
}

const firstLineOf = (s: string) => s.split("\n").map((x) => x.trim()).find((x) => x && !/^Error:\s*$/.test(x))?.replace(/^Error:\s*/, "") ?? "";
function pick0(result: TestResult): string {
  return result.annotations.filter((a) => a.type === "skip").map((a) => a.description ?? "").join(" / ");
}

/** 期待結果に対して、実際はどういう状態だったかを文にする（エビデンスの先頭と一覧に出す） */
function summarize(判定: string, 場面: string, checks: Check[], scenes: Scene[], errors: string[], skip: string): string {
  const line = (k: Check) => `「${k.項目}」は${k.期待 ? `${k.期待}を期待したのに対し、` : ""}実際は${k.実際 ?? "（記録なし）"}`;
  if (判定 === "スキップ") return `流していない（${skip || "スキップ"}）。`;
  const ng = checks.filter((k) => k.結果 === "不合格");
  const exp = scenes[scenes.length - 1];
  if (exp.状態 !== "未実行" && (判定 === "合格" || 場面 === "期待結果" || ng.length)) {
    if (!ng.length) {
      const shown = checks.filter((k) => k.実際).slice(0, 6).map((k) => `${k.項目}: ${k.実際}`);
      const stepN = scenes.reduce((n, s) => n + (s.確かめ?.filter((k) => k.結果 === "合格").length ?? 0), 0);
      return `期待結果のとおり。確かめた${checks.length}項目すべてが期待どおりだった${shown.length ? `（${shown.join("／")}${checks.length > shown.length ? "／…" : ""}）` : ""}。`
        + (stepN ? `手順の中でも${stepN}項目を確かめた（手順と画面の表）。` : "");
    }
    const okN = checks.length - ng.length;
    return `期待結果と違う。${ng.map(line).join("。")}。${okN ? `ほかの${okN}項目は期待どおり。` : ""}`;
  }
  // 手順の中の確かめで落ちたなら、その期待と実際の状態を書く
  const stopped = scenes.find((s) => s.種類 === "手順" && s.状態 === "失敗");
  const stepNg = (stopped?.確かめ ?? []).filter((k) => k.結果 === "不合格");
  if (stepNg.length) return `${場面 || "途中"}で止まり、期待結果を確かめていない。${stepNg.map(line).join("。")}。`;
  const why = firstLineOf(errors[0] ?? "");
  return `${場面 || "途中"}で止まり、期待結果を確かめていない${why ? `（${why.slice(0, 200)}）` : ""}。`;
}

export default class EvidenceReporter implements Reporter {
  private touched = new Set<string>();
  private ids = idMap();
  private e2eRev = "";
  private sutRev = "";

  printsToStdio(): boolean {
    return false;
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.e2eRev = revisionOf(REPO_ROOT, "e2e");
    this.sutRev = ENV_NAME === "local" ? revisionOf(SUT_DIR) : "不明（手元以外の環境）";
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const m = ID_RE.exec(test.title);
    if (!m) return; // シードだけを作る実行など、ケースでないテスト
    if (result.retry < test.retries && result.status !== "passed" && result.status !== "skipped") return; // 再試行の途中
    try {
      this.write(m[1], test, result);
    } catch (e) {
      // 記録の失敗で実行を止めない。標準エラーに出す
      process.stderr.write(`エビデンスを書き出せなかった（${m[1]}）: ${(e as Error).message}\n`);
    }
  }

  onEnd(): void {
    if (this.touched.size === 0) return;
    try {
      execFileSync(process.execPath, [path.join(E2E_DIR, "tools", "evidence_index.mjs"), "--quiet", ...this.touched], {
        stdio: ["ignore", "inherit", "inherit"],
        env: { ...process.env, E2E_EVIDENCE_DIR: EVIDENCE_ROOT },
      });
    } catch (e) {
      process.stderr.write(`エビデンスの一覧を作れなかった: ${(e as Error).message}\n`);
    }
    process.stdout.write(`エビデンス: ${path.relative(process.cwd(), EVIDENCE_ROOT) || "."}/<機能ID>/index.html（${[...this.touched].join("・")}）\n`);
  }

  private write(testId: string, test: TestCase, result: TestResult): void {
    const fid = functionIdOf(testId);
    const c = getCase(testId);
    const steps = stepsOf(c);
    const fnDir = path.join(EVIDENCE_ROOT, fid);
    const dir = path.join(fnDir, testId);
    const tmp = `${dir}.tmp-${process.pid}`;
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });

    // 控えた番号（事前準備のあとに添付される）
    const notesAtt = result.attachments.find((a) => a.name === `${EVIDENCE_PREFIX}控えた番号` && a.body);
    const notes = new Map<string, string>(notesAtt ? (JSON.parse(notesAtt.body!.toString("utf-8")) as [string, string][]) : []);

    // 場面の枠: 開始時・手順1..n・期待結果
    const scenes: Scene[] = [
      { 種類: "開始時", 文: "手順1の前の画面", 状態: "未実行", 画像: [], 撮れなかった: [] },
      ...steps.map((s, i): Scene => ({ 種類: "手順", 番号: i + 1, 文: resolveLabels(s, notes), 状態: "未実行", 画像: [], 撮れなかった: [] })),
      { 種類: "期待結果", 文: resolveLabels(c.期待結果, notes), 状態: "未実行", 画像: [], 撮れなかった: [] },
    ];
    const sceneOf = (name: string): Scene | undefined => {
      const head = name.split(/[:#]/)[0];
      if (head === "開始時") return scenes[0];
      if (head === "期待結果") return scenes[scenes.length - 1];
      const n = /^手順(\d+)$/.exec(head);
      return n ? scenes[Number(n[1])] : undefined;
    };

    // 実行した手順・期待結果の状態（caseTest は手順を test.step に、正本の文（控えた番号つき）を題にして包む）
    // caseTest は正本の手順1つを test.step 1つで包み、題を正本の文に控えた番号を当てたものにする（事前準備は正本の文のまま）。
    // 題が完全に一致するものだけを採る（テストの中でほかの test.step が呼ばれても、手順・期待結果と取り違えない）
    const top = result.steps.filter((s) => s.category === "test.step");
    let precondition: TestStep | undefined;
    const expectedSteps: TestStep[] = [];
    let cursor = 0;
    const titleMismatch: string[] = [];
    for (const s of top) {
      // 事前準備・期待結果も、caseTest が付けた題（正本の文）と一致するものだけを採る
      if (!precondition && s.title === `事前準備: ${c.事前準備}`) { precondition = s; continue; }
      if (s.title === `期待結果: ${resolveLabels(c.期待結果, notes)}`) { expectedSteps.push(s); continue; }
      const sc = scenes[cursor + 1];
      if (!sc || sc.種類 !== "手順" || s.title !== sc.文) {
        titleMismatch.push(`手順として数えなかった処理「${s.title.slice(0, 80)}」`);
        continue;
      }
      sc.状態 = hasError(s) ? "失敗" : "済";
      sc.秒 = Math.round(s.duration / 100) / 10;
      if (s.error) sc.エラー = clean(s.error.message);
      cursor += 1;
    }
    const expectedStep = expectedSteps[expectedSteps.length - 1];
    const checks: Check[] = [];
    const stepChecks: Check[] = [];
    if (expectedSteps.length) {
      const exp = scenes[scenes.length - 1];
      exp.状態 = expectedSteps.some(hasError) ? "失敗" : "済";
      exp.秒 = Math.round(expectedSteps.reduce((n, e) => n + e.duration, 0) / 100) / 10;
      const err = expectedSteps.find((e) => e.error)?.error;
      if (err) exp.エラー = clean(err.message);
      for (const e of expectedSteps) {
        walkChecks(e, (s) => {
          const err = s.error ? clean(s.error.message) : "";
          stepChecks.push({ 項目: s.title, 結果: s.error ? "不合格" : "合格", ...(s.error ? { ...fromError(err), エラー: err.split("\n").slice(0, 12).join("\n") } : {}) });
        });
      }
    }

    // 確かめ: caseTest が記録した期待と実際の状態（lib/evidence_expect.ts）を正とし、記録に無い確かめ（画面の部品の中の確かめなど）は
    // 実行の記録（step）から足す。記録が無い古い形では、実行の記録だけを使う
    // 手順の中の確かめ（caseTest が手順ごとに記録する）
    for (const sc of scenes) {
      if (sc.種類 !== "手順") continue;
      const att = [...result.attachments].reverse().find((a) => a.name === `${EVIDENCE_PREFIX}手順${sc.番号}:確かめの記録` && a.body);
      if (att) sc.確かめ = JSON.parse(att.body!.toString("utf-8")) as Check[];
    }
    const recAtt = [...result.attachments].reverse().find((a) => a.name === `${EVIDENCE_PREFIX}確かめの記録` && a.body);
    const recorded: Check[] = recAtt ? (JSON.parse(recAtt.body!.toString("utf-8")) as Check[]) : [];
    const used = new Set<number>();
    for (const r of recorded) {
      const i = stepChecks.findIndex((k, j) => !used.has(j) && k.項目 === r.項目);
      if (i >= 0) used.add(i);
      checks.push({ ...r, ...(i >= 0 && stepChecks[i].エラー ? { エラー: stepChecks[i].エラー } : {}) });
    }
    stepChecks.forEach((k, j) => { if (!used.has(j) && (!recorded.length || k.結果 === "不合格")) checks.push(k); });

    // 画像の写し
    let seq = 0;
    const copied = new Set<string>();
    for (const a of result.attachments) {
      if (!a.name.startsWith(EVIDENCE_PREFIX) || !a.path || !a.contentType.startsWith("image/")) continue;
      const name = a.name.slice(EVIDENCE_PREFIX.length);
      const sc = sceneOf(name);
      if (!sc || !fs.existsSync(a.path)) continue;
      seq += 1;
      const file = `${String(seq).padStart(2, "0")}_${safe(name)}${path.extname(a.path)}`;
      fs.copyFileSync(a.path, path.join(tmp, file));
      copied.add(a.path);
      const text = (suffix: string) => result.attachments.find((x) => x.name === `${a.name}:${suffix}` && x.body)?.body?.toString("utf-8");
      sc.画像.push({ file, 場面: name, URL: text("URL"), 注記: text("注記") });
      if (sc === scenes[0]) sc.状態 = "済";
    }
    for (const a of result.attachments) {
      if (!a.name.startsWith(EVIDENCE_PREFIX) || !a.name.endsWith(":撮れなかった") || !a.body) continue;
      const name = a.name.slice(EVIDENCE_PREFIX.length).replace(/:撮れなかった$/, "");
      sceneOf(name)?.撮れなかった.push(`${name}: ${a.body.toString("utf-8")}`);
    }
    // Playwright 自体が落ちたときに撮る画面と、操作の記録（trace）
    const failureShots: string[] = [];
    const shotHashes = new Set<string>();
    let trace: string | undefined;
    for (const a of result.attachments) {
      if (!a.path || copied.has(a.path) || !fs.existsSync(a.path)) continue;
      if (a.name === "screenshot" && a.contentType.startsWith("image/")) {
        const h = createHash("sha256").update(fs.readFileSync(a.path)).digest("hex");
        if (shotHashes.has(h)) continue; // 同じ画面が何枚も付くことがある
        shotHashes.add(h);
        // ケースの画面のほか、シードを作った別のブラウザセッションの最後の画面も付く（シードで止まったときの手がかり）
        const file = `Playwrightの画面_${failureShots.length + 1}${path.extname(a.path)}`;
        fs.copyFileSync(a.path, path.join(tmp, file));
        failureShots.push(file);
      } else if (a.name === "trace") {
        trace = "trace.zip";
        fs.copyFileSync(a.path, path.join(tmp, trace));
      }
    }

    // 落ちた場面と自動の判定。手順か期待結果で落ちたものだけを「不合格」とし、それより前（事前準備・ログインなど）で
    // 止まったものは「未判定」にする（シードや環境で止まったものを、アプリの不合格として数えない）
    const failedScene = scenes.find((s) => s.状態 === "失敗");
    const preconditionFailed = precondition ? hasError(precondition) : false;
    let 自動判定: string;
    let 落ちた場面 = "";
    if (result.status === "passed") 自動判定 = "合格";
    else if (result.status === "skipped") 自動判定 = "スキップ";
    else if (result.status === "interrupted") { 自動判定 = "未判定"; 落ちた場面 = "実行の中断"; }
    else if (preconditionFailed) { 自動判定 = "未判定"; 落ちた場面 = "事前準備（シードの作成）"; }
    else if (failedScene) {
      自動判定 = "不合格";
      落ちた場面 = failedScene.種類 === "手順" ? `手順${failedScene.番号}` : failedScene.種類;
    } else if (expectedStep && scenes.slice(1, -1).every((s) => s.状態 === "済") && checks.some((k) => k.結果 === "不合格")) {
      自動判定 = "不合格"; 落ちた場面 = "期待結果";
    } else { 自動判定 = "未判定"; 落ちた場面 = cursor === 0 ? "手順1の前（ログイン・画面を開く など）" : `手順${cursor}のあと`; }
    if (result.status === "timedOut" && 自動判定 === "不合格") 自動判定 = "未判定"; // 時間切れは環境の遅さのことが多い。人が判定する
    const 時間切れ = result.status === "timedOut";

    const 実際の状態 = summarize(自動判定, 落ちた場面, checks, scenes, result.errors.map((e) => clean(e.message ?? e.value ?? "")), pick0(result));
    const annotations = mergeAnnotations(test.annotations, result.annotations ?? []);
    const pick = (t: string) => annotations.filter((a) => a.type === t).map((a) => a.description ?? "");
    const notesOut = annotations.filter((a) => !["観点ID", "優先度", "実行区分", "出典", "skip"].includes(a.type)).map((a) => ({ 種類: a.type, 内容: a.description ?? "" }));
    for (const t of titleMismatch) notesOut.push({ 種類: "記録の注意", 内容: `${t}（題が正本の手順の文と合わない。エビデンスの手順の文は正本から出している）` });
    const record = {
      形式: 1,
      テストID: testId,
      一覧のテストID: this.ids.get(testId) ?? "",
      機能ID: fid,
      観点ID: c.観点ID,
      優先度: c.優先度,
      実行区分: c.実行区分,
      使用シード: c.使用シード,
      事前準備: resolveLabels(c.事前準備, notes),
      期待結果: resolveLabels(c.期待結果, notes),
      出典: c.出典,
      正本の指紋: caseFingerprint(c),
      結果: 自動判定,
      Playwrightの結果: result.status,
      時間切れ,
      落ちた場面,
      実際の状態,
      スキップの理由: pick("skip").join(" / "),
      実施日時: jst(result.startTime),
      所要秒: Math.round(result.duration / 100) / 10,
      環境: { E2E_ENV: ENV_NAME, 接続先: BASE_URL, 実行の形: process.env.E2E_RUN_MODE || "単独" },
      キャプチャ: (process.env.E2E_EVIDENCE || "full").toLowerCase(),
      E2Eのコミット: this.e2eRev,
      アプリのコミット: this.sutRev,
      テストコード: specLocation(test, testId),
      テストコードの指紋: specFingerprint(test),
      控えた番号: [...notes.entries()],
      注記: notesOut,
      場面: scenes,
      確かめ: checks,
      エラー: result.errors.map((e) => clean(e.message ?? e.value ?? "")).filter(Boolean),
      失敗時の画面: failureShots,
      trace,
    };
    fs.writeFileSync(path.join(tmp, "result.json"), JSON.stringify(record, null, 2) + "\n");

    // 置き換え（最新の実施だけを持つ）
    fs.rmSync(dir, { recursive: true, force: true });
    fs.renameSync(tmp, dir);
    const hist = path.join(fnDir, "history.tsv");
    if (!fs.existsSync(hist)) fs.writeFileSync(hist, ["テストID", "実施日時", "結果", "Playwrightの結果", "落ちた場面", "所要秒", "正本の指紋", "E2Eのコミット", "アプリのコミット", "環境"].join("\t") + "\n");
    fs.appendFileSync(hist, [testId, record.実施日時, 自動判定, result.status, 落ちた場面, record.所要秒, record.正本の指紋, this.e2eRev, this.sutRev, ENV_NAME].join("\t") + "\n");
    this.touched.add(fid);
  }
}
