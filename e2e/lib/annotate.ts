/**
 * エビデンスの画像に、何を確かめたかを書き込む（赤い枠と赤い文字）。撮る直前に画面を整え、撮ったら元に戻す。
 *
 * 流れ（lib/evidence.ts の EvidenceCamera.shoot から呼ぶ）
 *   1. 確かめ（expect）のたびに、lib/evidence_expect.ts が noteCheck で印の元を積む（手順・期待結果の記録中だけ）。
 *   2. 撮る直前（prepareShot）
 *      - 画面が落ち着くのを上限つきで待つ（通信が止む・「読込中」の表示が消える・画像が読み終わる）。
 *      - デバッグの表示（管理画面上部の「デバッグモードが有効になっています。」の帯・画面下の Symfony のツールバー）を隠す。
 *      - フロントの詳細検索のパネル（開いていないのに、全体を撮ると半透明で写る）を写さない。本当に開いたパネルはそのまま写す。
 *      - 全体を撮るときは、固定の表示（ヘッダー・メニュー・画面下の操作バー）をページの頭・終わりに置き直す
 *        （撮る間だけ。途中に貼り付いて値を隠さない）。画面を覆うモーダルが開いているときは、見えている範囲を撮る。
 *      - 見えている範囲を撮るとき（E2E_EVIDENCE=viewport・縦に長すぎる画面）は、確かめた要素がすべて写る範囲を決める（fit）。
 *        見えている範囲に入る大きさなら画面を動かし（要素が1つなら scrollIntoView と同じ）、縦に散らばっていれば全部が入る範囲を撮る（clip）。
 *      - 確かめた要素の位置を測る。
 *   3. 撮ったあと（finishShot）: 画面を必ず元に戻し（動かしたスクロールの位置も）、撮った画像に印を重ねて、同じファイルに書き直す。
 *      印は別の作業用の画面（同じブラウザの別のコンテキスト）で描く。ケースの画面には描かない。
 *
 * 画像に書くもの
 *   - 合格: 確かめた要素を赤い枠で囲み、近くの空いている所に「期待結果：…」。
 *   - 不合格: 「期待結果：…／実行結果：…」。要素が画面に無ければ、上の帯に書く。
 *     手順が確かめ（expect）以外で止まったとき（押す要素が見つからない・画面が移らない など）も、止まった画面に書く（failedStepMark）。
 *   - 画面の要素でない確かめ（DB・メール・URL・Cookie・HTTP の応答・新しいタブ・ダウンロード）:
 *     上の帯に「期待結果：…（DB で確認：照会の要約 → 読み取った値：…）」。値が画面の中のただ1つの要素に出ていれば、その要素を囲む。
 *   - 画面から読んだ値の確かめは、値を作った行で読んだ要素を囲む（同じ手順で読んだほかの要素と取り違えない）。
 *   - 確かめのあとに画面を変える操作（押す など）をしてから撮ったときは「（操作の前に確認）」と添える。
 *   - 選択欄（select）を確かめたときは、選んでいる値だけを札に添える（選択肢の一覧は書かない）。
 *   - 正規表現・class の名前・セレクタは書かない（lib/annotate_text.ts）。
 *   - ブラウザの確認ダイアログ（confirm・alert・prompt）の文言と押したボタン。
 *   - 画面の URL と「手順N：正本の手順の文」（確かめがあっても書く）。
 *
 * 環境変数
 *   E2E_ANNOTATE=0   書き込みも画面を整えることもしない（これまでと全く同じ撮り方）。既定は書き込む。
 *
 * 書き込み・整えに失敗しても、テストの合否は変えない（素の画像を残し、理由を添付に書く）。
 */
import fs from "node:fs";
import type { BrowserContext, Locator, Page, TestInfo } from "@playwright/test";
import type { Check } from "./evidence_expect";
import { actualText, CheckInfo, decodePct, expectationText, Origin, originOf, subjectOfLocator, valueText } from "./annotate_text";
import {
  BandLine, ElementInfo, findByValue, findNotice, FramePlan, prepareInPage, PrepareResult, Rect, rectsOfElements, renderComposite,
  restoreInPage, scrollInPage, settledInPage, ValuePred,
} from "./annotate_draw";

/** 撮ったあとの戻しを確実に行う（重い画面では5秒で終わらないことがあった。2026-11-13）。戻しきれなければ例外にする */
async function restoreSurely(page: Page): Promise<void> {
  for (let k = 0; k < 3; k++) {
    await withTimeout(page.evaluate(restoreInPage), 20_000).catch(() => undefined);
    const left = await withTimeout(page.evaluate(() => !!(window as unknown as { __e2eShot?: unknown }).__e2eShot), 20_000).catch(() => true);
    if (!left) return;
  }
  throw new Error("エビデンスを撮ったあとの画面の戻しが終わらない（撮るために付けた表示の指定が残っている）");
}

export const ANNOTATE = !/^(0|off|false|no)$/i.test((process.env.E2E_ANNOTATE ?? "").trim());

/**
 * デバッグの表示。試験の対象でないので、撮る間だけ隠す。
 * - 画面下の Symfony の web debug toolbar。lib/session.ts の hideDebugToolbar は「/_wdt/」の要求を止めるので、ツールバーの
 *   スタイル（/_wdt/styles）も読めず、最初から HTML にある「Loading the web debug toolbar… Attempt #1 Cancel」が
 *   スタイル無しで本文の末尾に残る（要求を止めるだけでは消えない）。
 * - フロントの左上の「DEBUG」の札。
 */
export const DEBUG_SELECTORS = [
  "[id^='sfwdt']", ".sf-toolbar", ".sf-minitoolbar", "[id^='sfToolbar']", "[id^='sfMiniToolbar']", "[id^='sfLoadCounter']", ".ec-debugModeIndicator",
];
/** 管理画面上部の「デバッグモードが有効になっています。」の帯（admin/notice_debug_mode.twig）。エラーの帯と同じ作りなので文言で決める */
export const DEBUG_TEXTS = [{ selector: ".alert.alert-danger", text: "デバッグモードが有効になっています" }];
/** サーバーの内部の情報の目印（例外の画面・サーバーのパス）。隠しても画面に見えていれば、その画面は撮らない（お客様への提出物に載せない） */
export const LEAK_PATTERNS = ["/var/ec-cube/", "Symfony Exception", "Stack Trace", "Stack Traces", "BadMethodCallException", "vendor/symfony/"];
/** ツールバーより後ろに書き足された例外の画面の目印（その位置にあるときだけ隠す。正面の画面がエラーの画面のときは隠さない） */
export const AFTER_TOOLBAR_TEXTS = ["システムエラーが発生しました", "Internal Server Error", "Exception"];
/**
 * 撮る間だけ当てる CSS。フロントの詳細検索のパネル（商品・デッキ・イベント・買取。.p-hareruya-search-modal）は、
 * 開いていない（.is-visible が無い）のに、全体を撮ると半透明で写る（lib/annotate_draw.ts の prepareInPage の説明）。
 * 開いていないものだけを止める（.is-visible のもの＝本当に開いたパネルは、そのまま写す）。
 */
export const SHOT_CSS = `
.p-hareruya-search-modal:not(.is-visible), .p-hareruya-search-modal__overlay:not(.is-visible) {
  transition: none !important; opacity: 0 !important; visibility: hidden !important;
}`;
/**
 * 撮る前に消えるのを待つ「読込中」の表示（文言「読込中」「読み込み中」「Loading」だけの表示は別に探す）
 * - 管理画面の画像のアップロード（FilePond。読込中・送信中）
 * - フロントの商品詳細の画像・一覧の検索・同名商品・デッキ一括の読み込み
 */
export const LOADING_SELECTORS = [
  "[aria-busy='true']",
  ".filepond--item[data-filepond-item-state~='busy']", ".filepond--item[data-filepond-item-state='loading']", ".filepond--item[data-filepond-item-state~='processing']",
  "[data-js-target='product-detail-gallery-loading']:not(.is-hidden)",
  ".product-list-unisearch-loading", ".purchase-list-unisearch-loading", ".purchase-same-name-loading",
  "#submit_filter_form .loading-indicator", ".bg-load-overlay",
];

const WAIT_NETWORK_MS = Number(process.env.E2E_ANNOTATE_WAIT_MS || 3000);
const WAIT_LOADING_MS = Number(process.env.E2E_ANNOTATE_WAIT_LOADING_MS || 5000);
/** 全体を撮る高さの上限（lib/evidence.ts と同じ）。確かめた所が縦に散らばっているときに撮る範囲（clip）も、この高さまで */
const MAX_HEIGHT = Number(process.env.E2E_EVIDENCE_MAX_HEIGHT || 8000);
/** 確かめた所のまわりに残す余白（px） */
const FIT_MARGIN = 80;

// ---------------------------------------------------------------------------------------------
// 確かめの記録（lib/evidence_expect.ts から）
// ---------------------------------------------------------------------------------------------

type Target =
  | { kind: "locator"; locator: Locator; page: Page; negativeExistence: boolean }
  | { kind: "page"; page: Page; what: "URL" | "画面の題" }
  | { kind: "value"; preds: ValuePred[]; origin?: Origin; how?: string };
/**
 * at: 確かめた時点（serial）。あとに画面を変える操作があれば「操作の前の画面で確認」と添える。
 * generic: 要素の呼び名が分からない文（「表示されている」だけ）。撮るときに要素の文字で主語を補う。
 * hint: 確かめた文字（大きな要素を確かめたとき、その文字の所だけを囲むため）。
 */
type Mark = { ok: boolean; expect: string; actual?: string; target: Target; at?: number; generic?: (s: string) => string; hint?: string; want?: string };

/** stack: 照会を呼んだ関数の名前を確かめるための呼び出し元（照会の要約に、確かめた値を読んだ関数の照会だけを書くため） */
type DbNote = { serial: number; params: unknown[]; rows: number; stack?: string };
type DialogNote = { type: string; message: string; result: unknown };

let marks: Mark[] = [];
let dialogs: DialogNote[] = [];
let dbNotes: DbNote[] = [];
let serial = 0;
let lastCheckEnd = 0;
let mainPage: Page | undefined;

const isLocator = (v: unknown): v is Locator => !!v && typeof v === "object" && typeof (v as Locator).evaluateAll === "function" && typeof (v as Locator).count === "function";
const isPage = (v: unknown): v is Page => !!v && typeof v === "object" && typeof (v as Page).goto === "function" && typeof (v as Page).url === "function";
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** ケースの始めに（EvidenceCamera を作るときに）呼ぶ。前のケースの印を持ち越さない */
export function resetForCase(page: Page): void {
  marks = [];
  dialogs = [];
  dbNotes = [];
  reads = [];
  mainPage = page;
  hookReads(page);
}

// ---------------------------------------------------------------------------------------------
// 画面の要素から読んだ値の確かめ（expect(await locator.inputValue()) など）の、読んだ要素
// ---------------------------------------------------------------------------------------------

/** Playwright の要素を読む操作（Frame の呼び出しの名前）と、spec に書く名前 */
const READ_METHODS: Record<string, string[]> = {
  inputValue: ["inputValue"], textContent: ["textContent"], innerText: ["innerText"], innerHTML: ["innerHTML"], getAttribute: ["getAttribute"],
  isVisible: ["isVisible"], isHidden: ["isHidden"], isChecked: ["isChecked"], isEnabled: ["isEnabled"], isDisabled: ["isDisabled"], isEditable: ["isEditable"],
  queryCount: ["count"], evalOnSelectorAll: ["allInnerTexts", "allTextContents", "evaluateAll"],
  // locator.evaluate は、要素を待つ呼び出し（waitForSelector）として記録される
  waitForSelector: ["evaluate", "waitForSelector"],
};
/** sites: 読んだ操作を呼んだ行（spec・画面の部品のファイルと行。node_modules は除く） */
type ReadNote = { serial: number; selector: string; method: string; sites: string[] };
let reads: ReadNote[] = [];
const hookedInstr = new WeakSet<object>();
/** 画面を変える操作（押す・入れる・開く など）。確かめのあとに操作があれば、その確かめは「操作の前の画面で確認」 */
const ACTION_METHODS = new Set(["click", "dblclick", "tap", "fill", "type", "press", "check", "uncheck", "setChecked", "selectOption", "setInputFiles", "hover", "dragAndDrop", "dispatchEvent", "goto", "reload", "goBack", "goForward"]);
let lastAction = 0;

/**
 * 要素を読む操作（inputValue・textContent・count など）の、要素の指定（selector）と呼んだ行を控える。画面を変える操作の時点も控える。
 * Playwright の操作の記録の受け口（client の instrumentation）に聞くだけで、操作そのもの・スタック（失敗したときの行の表示）は変えない。
 */
function hookReads(page: Page): void {
  if (!ANNOTATE) return;
  const ins = (page as unknown as { _instrumentation?: { addListener?: (l: object) => void } })._instrumentation;
  if (!ins || typeof ins.addListener !== "function" || hookedInstr.has(ins)) return;
  hookedInstr.add(ins);
  ins.addListener({
    onApiCallBegin(zone: { frames?: { file?: string; line?: number }[] } | undefined, call?: { type?: string; method?: string; params?: { selector?: unknown } }) {
      try {
        if (!call?.method) return;
        if (ACTION_METHODS.has(call.method) && (call.type === "Frame" || call.type === "ElementHandle" || call.type === "Page")) {
          // パスワードの欄に入れた値は控えて、画像に書く文から伏せる（maskSecrets）
          const p = call.params as { selector?: unknown; value?: unknown; text?: unknown } | undefined;
          const v = typeof p?.value === "string" ? p.value : typeof p?.text === "string" ? p.text : undefined;
          if (v && v.length >= 4 && /pass|pwd|パスワード/i.test(String(p?.selector ?? ""))) secrets.add(v);
          lastAction = ++serial;
          return;
        }
        if (call.type !== "Frame" || !(call.method in READ_METHODS) || typeof call.params?.selector !== "string") return;
        const sites = (zone?.frames ?? []).filter((f) => f.file && !/node_modules/.test(f.file)).slice(0, 12).map((f) => `${f.file}:${f.line}`);
        reads.push({ serial: ++serial, selector: call.params.selector, method: call.method, sites });
        if (reads.length > 400) reads.shift();
      } catch { /* 控えられなくても動きは変えない */ }
    },
  });
}

/**
 * 値の確かめの元になった、画面から読んだ要素。
 * 1. 確かめの式・値を作った右辺の行（originOf の sites）から呼んだ読み取りがあれば、それだけ（同じ手順でいくつも読んだとき、取り違えない）。
 * 2. 無ければ、spec の書き方（originOf の readCalls）で、読んだ操作の名前が合うもの。
 */
function readLocatorFor(start: CheckStart, readCalls: string[], sites: { file: string; from: number; to: number }[] = []): Locator | undefined {
  if (!mainPage) return undefined;
  let sels: string[] = [];
  if (sites.length) {
    const hitSite = (r: ReadNote) => r.sites.some((s) => {
      const i = s.lastIndexOf(":");
      const file = s.slice(0, i), line = Number(s.slice(i + 1));
      return sites.some((x) => x.file === file && line >= x.from && line <= x.to);
    });
    const hits = reads.filter((r) => r.serial < start.serial && hitSite(r));
    sels = [...new Set(hits.map((r) => r.selector))].slice(-30);
  }
  if (!sels.length && readCalls.length) {
    const ok = (r: ReadNote) => READ_METHODS[r.method].some((n) => readCalls.includes(n));
    // 前の確かめのあとに読んだもの。無ければ、同じ名前の操作で最後に読んだもの（値を変数に入れてから確かめる書き方）
    const recent = reads.filter((r) => r.serial > lastCheckEnd && r.serial < start.serial && ok(r));
    const last = [...reads].reverse().find((r) => r.serial < start.serial && ok(r));
    // 前の確かめのあとに読んだ要素がいくつかあれば全部（5つまで）。無ければ最後に読んだもの
    sels = [...new Set((recent.length ? recent : last ? [last] : []).map((r) => r.selector))].slice(-5);
  }
  if (!sels.length) return undefined;
  try {
    const page = mainPage;
    return sels.slice(1).reduce((acc, sel) => acc.or(page.locator(sel)), page.locator(sels[0]));
  } catch { return undefined; }
}

export type CheckStart = { serial: number; stack?: string };

/** 確かめの照合を呼ぶ直前に呼ぶ（呼んだ場所と、照合の間に DB を読んだかを知るため） */
export function checkStarted(): CheckStart | undefined {
  if (!ANNOTATE) return undefined;
  return { serial: ++serial, stack: new Error().stack };
}

/** DB の照会（lib/db.ts の query）のたびに呼ぶ。SQL は控えない（照会の条件の値と件数だけ） */
export function noteDbQuery(params: unknown[], rows: number): void {
  if (!ANNOTATE) return;
  dbNotes.push({ serial: ++serial, params: [...params], rows, stack: new Error().stack });
  if (dbNotes.length > 200) dbNotes.shift();
}

export type CheckCall = { actual: unknown; matcher: string; args: unknown[]; negated: boolean; message?: string; check: Check };

/**
 * 確かめの照合が終わったら呼ぶ。画像に書く印を積み、画面の要素でない確かめなら、確かめ方の要約（Check.確認方法 に入れる）を返す。
 * 失敗しても投げない（合否に関わらせない）。
 */
export function noteCheck(start: CheckStart | undefined, c: CheckCall): string | undefined {
  if (!ANNOTATE || !start) return undefined;
  try {
    const end = ++serial;
    const ok = c.check.結果 === "合格";
    const loc = isLocator(c.actual) ? c.actual : undefined;
    const pg = isPage(c.actual) ? c.actual : undefined;
    const ci: CheckInfo = {
      matcher: c.matcher, args: c.args, negated: c.negated, message: c.message,
      value: loc || pg || typeof c.actual === "function" ? undefined : c.actual,
      isValue: !loc && !pg,
      locatorDesc: loc ? safe(() => String(loc)) : undefined,
      isPage: !!pg,
    };
    // 値の確かめは、先に出どころを決める（画面から読んだ値なら、0件を「表示されないこと」と書く）
    const o = !loc && !pg ? originOf(start.stack, c.message) : undefined;
    const readLoc = o && !o.origin ? readLocatorFor(start, o.readCalls ?? [], o.sites) : undefined;
    ci.screen = !!readLoc;
    const { text, boolForm, generic } = expectationText(ci, c.check.期待);
    const actual = ok ? undefined : actualText(ci, c.check.実際, boolForm);
    let how: string | undefined;
    let target: Target;
    const hint = (c.matcher === "toContainText" || c.matcher === "toHaveText") && typeof c.args[0] === "string" ? c.args[0] : undefined;
    if (loc) {
      const m = c.matcher, neg = c.negated;
      const negativeExistence = (m === "toBeHidden" && !neg) || (m === "toBeVisible" && neg) || (m === "toBeAttached" && neg) || (m === "toHaveCount" && !neg && Number(c.args[0]) === 0);
      target = { kind: "locator", locator: loc, page: loc.page(), negativeExistence };
    } else if (pg) {
      target = { kind: "page", page: pg, what: c.matcher === "toHaveTitle" ? "画面の題" : "URL" };
      how = c.matcher === "toHaveTitle" ? "画面の題で確認" : `URL で確認（開いていた画面：${urlText(safe(() => pg.url()))}）`;
    } else {
      how = howOf(o!, start, end, ci.value, ok);
      // 画面の要素から読んだ値なら、その要素を囲む（DB などで確かめた値は帯に書く）。数が 0・偽の確かめは「画面に無い」側
      const zeroOrFalse = (typeof ci.value === "number" && ci.value === 0) || ci.value === false;
      target = readLoc
        ? { kind: "locator", locator: readLoc, page: readLoc.page(), negativeExistence: ok && zeroOrFalse }
        : { kind: "value", preds: ok && (!o!.origin || o!.origin === "DB") ? predsOf(ci) : [], origin: o!.origin, how };
    }
    // 読んだ要素がいくつもあるとき、確かめた値を表示している要素だけを囲むための値
    const wv = c.matcher === "toContain" && typeof c.args[0] === "string" ? c.args[0] : ci.value;
    const want = readLoc && ((typeof wv === "string" && wv.trim() && wv.length <= 120) || (typeof wv === "number" && Number.isFinite(wv))) ? String(wv) : undefined;
    lastCheckEnd = end;
    marks.push({ ok, expect: text, actual, target, at: end, generic, hint, want });
    if (marks.length > 300) marks.shift();
    return how;
  } catch {
    return undefined;
  }
}

/** パスワードの欄に入れた値（伏せる） */
const secrets = new Set<string>();

/**
 * 画像に書く文から、パスワードらしい値を「********」に伏せる（正本の手順の文・期待結果の文に試験のパスワードが書かれていることがある）。
 * - パスワードの欄に入れた値（hookReads で控えた値）
 * - 「パスワード」「password」の語の後ろの値（「パスワード Passw0rd-1」「パスワード：…」「パスワードが「…」」「パスワード（確認）に「…」」）
 */
export function maskSecrets(s: string): string {
  let out = s;
  // 「パスワード」の語が前に無い「「値」」は、何の値か読めるよう「（パスワード）」を添える（「「********」でログインでき」だけでは意味が読めない）
  for (const v of secrets) if (v) out = out.replace(new RegExp(`(?<!パスワード[^「」]{0,8})「${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}」`, "g"), "「********」（パスワード）");
  for (const v of secrets) if (v) out = out.split(v).join("********");
  // 語の後ろの値（かぎかっこの中、または空白・記号で区切った英数記号の並び）
  const SEP_JA = String.raw`(?:（確認）|\(確認\)|欄)?(?:\s+|\s*(?:は|が|に|を|：|:|=)\s*(?:「|『|")?|\s*(?:「|『|"))`;
  const SEP_EN = String.raw`\s*(?::|=|：)\s*(?:"|「)?`;
  const VAL = String.raw`([!-~]{4,}?)(?=$|[」』"\s、。，,）)]|で|を|に|と|の|が)`;
  const mask = (m0: string, head: string, val: string) => (/^\*+$/.test(val) ? m0 : `${head}********`);
  out = out.replace(new RegExp(`(パスワード${SEP_JA})${VAL}`, "g"), mask);
  out = out.replace(new RegExp(`((?:password|passwd)${SEP_EN})${VAL}`, "gi"), mask);
  // 試験のパスワードの決まった形（Passw0rd…）
  out = out.replace(/Passw0rd[!-~]*/g, (m0) => (/[」』）)]$/.test(m0) ? `********${m0.slice(-1)}` : "********"));
  return out;
}

/** URL を読める形に（%E3… を文字に戻す） */
function urlText(u: string | undefined): string {
  if (!u) return "不明";
  try { return decodeURI(u); } catch { return u; }
}

function safe<T>(f: () => T): T | undefined {
  try { return f(); } catch { return undefined; }
}

/** 画面の要素でない確かめの、確かめ方の要約 */
function howOf(o: ReturnType<typeof originOf>, start: CheckStart, end: number, value?: unknown, ok = true): string | undefined {
  const fn = o.fn ? `「${o.fn}」` : "";
  // 画面に写らない値は、読み取った値を帯に書く（DB の件数など。画像だけで確かめた値が分かるように）
  // 真偽は「はい／いいえ」と書かない（否定の文の後ろだと逆の意味に読める）。期待どおりなら「確認できた」
  const got = value === undefined || typeof value === "function" ? "" : typeof value === "boolean" ? (ok ? " → 確認できた" : " → そうなっていなかった")
    // 合格した行・一覧の値は期待結果の文と同じなので繰り返さない（帯が長くなる）
    : ok && value !== null && typeof value === "object" && !(value instanceof Date) ? " → 確認できた" : ` → 読み取った値：${valueText(value, 80)}`;
  switch (o.origin) {
    case "DB": {
      // 照合の間か、前の確かめのあとに読んだ照会の条件
      // 確かめた値を読んだ関数が分かっているときは、その関数の中の照会だけを見る。
      // 分からない照会（シードの準備で会員を名前で引いた など）の条件を、別の照会の名前と合わせて書いていた（2026-11-13 の IT-M05-01-038 の「「受注の状態」の照会（条件：M05-01在庫登録者）」）
      const byFn = (d: DbNote) => !o.fn || (d.stack !== undefined && new RegExp(`(?<![\\p{L}\\p{N}_$])${o.fn.replace(/[$]/g, "\\$")}(?![\\p{L}\\p{N}_$])`, "u").test(d.stack));
      const q = dbNotes.filter((d) => d.serial > start.serial && d.serial < end && byFn(d)).pop() ?? dbNotes.filter((d) => d.serial > lastCheckEnd && d.serial < start.serial && byFn(d)).pop();
      const cond = q && q.params.length ? `（条件：${q.params.map((p) => cut(String(p), 40)).join("・")}）` : "";
      return `DB で確認${fn || cond ? `：${fn ? `${fn}の照会` : "照会"}${cond}` : ""}${got}`;
    }
    case "メール": return `メールで確認${fn ? `：${fn}` : ""}${got}`;
    // ダウンロードが始まったか（真偽）の確かめは、ファイルの中身を見ていない。「ダウンロードしたファイルで確認」と書かない（2026-11-14 IT-M05-01-033 の「ダウンロードされないこと」）
    case "ダウンロードしたファイル": if (typeof value === "boolean") return `ダウンロードが始まったかで確認${ok ? (value ? " → 始まった" : " → 始まらなかった") : got}`;
      // 値が無い（null）のは、ファイルが落ちてこなかった・ウィンドウが開かなかったとき。ファイルの中身を読んではいない（2026-11-16 M06-01 の戻しリストの「ダウンロードしたファイルで確認 → 空（null）」）
      if (value === null) return /popup|ウィンドウ|タブ/.test(o.expr ?? "") ? "新しいウィンドウが開いたかで確認 → 開かなかった" : "ダウンロードが始まったかで確認 → 始まらなかった";
      return `${o.origin}で確認${got}`;
    case "Cookie": case "HTTP の応答": return `${o.origin}${/[A-Za-z]$/.test(o.origin) ? " " : ""}で確認${got}`;
    case "URL": return `URL で確認（開いていた画面：${urlText(safe(() => mainPage?.url()))}）`;
    case undefined: return undefined;
    default: return `${o.origin}${/[A-Za-z]$/.test(o.origin) ? " " : ""}で確認`;
  }
}

/** 値を表示している要素を画面から探すための条件（合格の確かめだけ。数だけの値は取り違えやすいので探さない） */
function predsOf(ci: CheckInfo): ValuePred[] {
  if (ci.negated) return [];
  const v = ci.value, a = ci.args[0];
  const plain = (s: string) => s.trim().length >= 2 && s.trim().length <= 200 && !/^[\d,.\s+\-−円%件:/年月日時分秒()（）]*$/.test(s.trim());
  const strs = (x: unknown) => Array.isArray(x) && x.length > 0 && x.every((i) => typeof i === "string") ? (x as string[]) : undefined;
  switch (ci.matcher) {
    case "toBe": case "toEqual": case "toStrictEqual":
      if (typeof v === "string" && plain(v)) return [{ kind: "eq", s: v }];
      if (strs(v) && strs(v)!.length >= 2) return [{ kind: "options", items: strs(v)! }];
      return [];
    case "toContain":
      if (typeof v === "string" && typeof a === "string" && plain(a)) return [{ kind: "inc", s: a }];
      if (strs(v) && typeof a === "string" && /選択肢|プルダウン|セレクト/.test(ci.message ?? "")) return [{ kind: "options", items: [a] }];
      return [];
    case "toMatch":
      if (typeof v === "string" && v.length <= 200 && plain(v)) return [{ kind: "eq", s: v }];
      return [];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------------------------
// ダイアログ（confirm・alert・prompt）の文言と押したボタン
// ---------------------------------------------------------------------------------------------

const hooked = new WeakSet<BrowserContext>();
const BINDING = "__e2eEvidenceDialog";

/**
 * ダイアログの受け口（page.on("dialog")）は足さない（足すと自動で閉じなくなり、動きが変わる）。
 * 代わりに、画面の中の window.confirm などを包み、呼ばれた文言と戻り値（OK/キャンセル）を知らせてもらう。
 * ダイアログそのものの出方・閉じ方は変えない。
 */
export async function installDialogHook(page: Page): Promise<void> {
  if (!ANNOTATE) return;
  const ctx = page.context();
  if (hooked.has(ctx)) return;
  hooked.add(ctx);
  try {
    await ctx.exposeBinding(BINDING, (_src, d: DialogNote) => { dialogs.push(d); if (dialogs.length > 50) dialogs.shift(); });
    const script = (name: string) => {
      const w = window as unknown as Record<string, unknown> & { __e2eDialogHooked?: boolean };
      if (w.__e2eDialogHooked) return;
      w.__e2eDialogHooked = true;
      const note = (type: string, message: unknown, result: unknown) => {
        try { (w[name] as (d: unknown) => Promise<void>)?.({ type, message: String(message ?? ""), result })?.catch?.(() => {}); } catch { /* 知らせられなくても動きは変えない */ }
      };
      const oc = window.confirm, oa = window.alert, op = window.prompt;
      window.confirm = function (m?: string) { const r = oc.call(window, m); note("confirm", m, r); return r; };
      window.alert = function (m?: unknown) { const r = oa.call(window, m as string); note("alert", m, undefined); return r; };
      window.prompt = function (m?: string, d?: string) { const r = op.call(window, m, d); note("prompt", m, r); return r; };
    };
    await ctx.addInitScript(script, BINDING);
    for (const p of ctx.pages()) await p.evaluate(script, BINDING).catch(() => {});
  } catch { /* 包めなくても撮影は続ける */ }
}

function dialogLine(d: DialogNote): string {
  const msg = `『${cut(d.message.replace(/\s+/g, " "), 120)}』`;
  if (d.type === "confirm") return `確認ダイアログ：${msg} → ${d.result ? "OK" : "キャンセル"}を押した`;
  if (d.type === "prompt") return `入力ダイアログ：${msg} → ${d.result === null ? "キャンセルを押した" : `「${cut(String(d.result), 40)}」を入れて OK を押した`}`;
  return `お知らせのダイアログ：${msg} → 閉じた`;
}

// ---------------------------------------------------------------------------------------------
// 撮る直前・直後（lib/evidence.ts から）
// ---------------------------------------------------------------------------------------------

/** 1回の撮影で書くもの（ケースの画面のうち、どのタブにも共通） */
export type ShotMarks = { marks: Mark[]; dialogs: DialogNote[]; scene: string; sceneText?: string };

/** 撮影のはじめに、たまった印を受け取る（以後の確かめは次の撮影に回る） */
export function takeMarks(sceneName: string, info: TestInfo): ShotMarks | undefined {
  if (!ANNOTATE) return undefined;
  // 手順・期待結果が確かめ（expect）以外で止まった（押す要素が見つからない・画面が移らない など）なら、止まった画面に期待結果／実行結果を書く
  const failed = failedStepMark(sceneName, info, marks);
  if (failed) marks.push(failed);
  const out: ShotMarks = { marks, dialogs, scene: sceneName, sceneText: sceneTextOf(sceneName, info) };
  marks = [];
  dialogs = [];
  return out;
}

/**
 * 別のブラウザセッションの画面（ケースの画面と別のセッション。lib/evidence_other.ts）を撮るときに、その画面の要素を確かめた印だけを受け取る（足した部品）。
 * ほかの画面の印・値の確かめ・ダイアログは残す（ケースの画面の次の撮影で書く）。ケースの画面の撮影（takeMarks）のふるまいは変えない。
 */
export function takeMarksOfPage(page: Page, sceneName: string, info: TestInfo): ShotMarks | undefined {
  if (!ANNOTATE) return undefined;
  const mine = marks.filter((m) => m.target.kind !== "value" && m.target.page === page);
  marks = marks.filter((m) => !mine.includes(m));
  return { marks: mine, dialogs: [], scene: sceneName, sceneText: sceneTextOf(sceneName, info) };
}

type StepLike = { category?: string; title?: string; error?: { message?: string }; endWallTime?: number; steps?: StepLike[] };
const reportedSteps = new WeakSet<object>();

/**
 * いま終わった手順（caseTest の test.step）が失敗していて、その失敗を確かめ（expect）の印で書いていなければ、失敗の印を作る。
 * Playwright の手順の記録（TestInfo の _steps。読むだけ）から、最後の test.step の失敗を読む。
 */
function failedStepMark(sceneName: string, info: TestInfo, current: Mark[]): Mark | undefined {
  try {
    const sm = sceneName.match(/^手順(\d+)$/);
    if (!sm && sceneName !== "期待結果") return undefined;
    const steps = (info as unknown as { _steps?: StepLike[] })._steps ?? [];
    const st = [...steps].reverse().find((s) => s.category === "test.step");
    if (!st || !st.endWallTime || !st.error || reportedSteps.has(st)) return undefined;
    reportedSteps.add(st);
    if (current.some((m) => !m.ok)) return undefined; // 確かめの不合格として書いてある
    const e = errorText(st.error.message ?? "");
    const what = sm ? `手順${sm[1]}の操作が最後までできる` : "期待結果の確かめが最後までできる";
    return { ok: false, expect: e.expect ?? `${what}${e.subject ? `（${e.subject}）` : ""}`, actual: e.actual, target: { kind: "value", preds: [], how: undefined }, at: ++serial };
  } catch {
    return undefined;
  }
}

/** Playwright のエラーの文を、お客様に読める「実行結果」の文にする（セレクタ・正規表現・英語の文はそのまま出さない） */
export function errorText(raw: string): { expect?: string; subject?: string; actual: string } {
  // eslint-disable-next-line no-control-regex
  const msg = raw.replace(/\u001b\[[0-9;]*m/g, "").replace(/^Error:\s*/, "");
  const first = msg.split("\n")[0] ?? "";
  const sec = Number(msg.match(/Timeout (\d+)ms exceeded/)?.[1] ?? msg.match(/Timeout:\s*(\d+)ms/)?.[1] ?? NaN);
  const wait = Number.isFinite(sec) ? `${Math.round(sec / 1000)}秒待っても` : "";
  // 要素の呼び名（getByRole('link', { name: 'ホーム' }) など）。読めなければ「画面の要素」
  const locLine = msg.match(/(?:waiting for|Locator:)\s*(.+)/)?.[1] ?? "";
  const sub = locLine ? subjectOfLocator(locLine)?.subject : undefined;
  const thing = sub ?? "画面の要素";
  // expect（画面の部品の中の確かめ）のメッセージ: 「<メッセージ>\n\nexpect(...)」の形
  const custom = msg.match(/^(.+?)\n\s*\nexpect\(/s)?.[1]?.trim();
  if (/expect\(.+\)\.\w+\(.*\) failed|expect\(received\)/.test(msg) || custom) {
    const received = msg.match(/Received(?: string| value)?:\s*(.+)/)?.[1]?.trim();
    const notFound = /element\(s\) not found|not found/.test(msg);
    const actual = notFound ? `${wait}${thing}が画面に出なかった` : received ? `実際は ${cut(decodePct(received.replace(/^"|"$/g, "")), 80)}` : `${wait}期待どおりにならなかった`;
    return { expect: custom && !/^expect\(/.test(custom) ? custom : undefined, subject: sub, actual };
  }
  const verbs: [RegExp, string][] = [
    [/\.(click|dblclick|tap)\b/, "押せなかった"], [/\.(fill|type|pressSequentially)\b/, "入力できなかった"], [/\.press\b/, "キーを押せなかった"],
    [/\.(check|uncheck|setChecked)\b/, "チェックを変えられなかった"], [/\.selectOption\b/, "選べなかった"], [/\.hover\b/, "マウスを乗せられなかった"],
    [/\.setInputFiles\b/, "ファイルを選べなかった"], [/\.(textContent|innerText|inputValue|getAttribute|waitFor|evaluate|boundingBox)\b/, "読めなかった"],
  ];
  if (/waitForURL|waiting for navigation|waitForNavigation|waiting for URL/i.test(msg)) return { subject: sub, actual: `${wait}次の画面に移らなかった` };
  if (/waitForResponse|waitForRequest/.test(msg)) return { subject: sub, actual: `${wait}サーバーの応答が来なかった` };
  if (/waitForLoadState/.test(msg)) return { subject: sub, actual: `${wait}画面の読み込みが終わらなかった` };
  if (/net::ERR_|ECONNREFUSED|ECONNRESET/.test(msg)) return { subject: sub, actual: "画面を開けなかった（通信のエラー）" };
  if (/\b50[234]\b|Gateway Time-?out|Bad Gateway/i.test(msg)) return { subject: sub, actual: "サーバーが時間内に応答しなかった（開発環境のエラー）" };
  if (/has been closed|Target closed/.test(msg)) return { subject: sub, actual: "画面が閉じられて続けられなかった" };
  if (/strict mode violation/.test(msg)) return { subject: sub, actual: `${thing}が画面に複数あり、1つに決められなかった` };
  if (/intercepts pointer events/.test(msg)) return { subject: sub, actual: `${thing}がほかの表示に覆われていて${wait ? `、${wait}` : ""}押せなかった` };
  for (const [re, v] of verbs) {
    if (re.test(first)) {
      const notVisible = /not visible|element is not attached|not stable|outside of the viewport/.test(msg);
      return { subject: sub, actual: `${wait}${thing}を${v}${notVisible ? "（見えない・動いている状態のまま）" : !/waiting for/.test(msg) ? "" : "（画面に見つからなかった）"}` };
    }
  }
  if (Number.isFinite(sec)) return { subject: sub, actual: `${wait}次の操作に進めなかった（時間切れ）` };
  // そのほか: 英語・セレクタを含む文は出さず、日本語の文（spec が投げたエラー）だけ出す
  const ja = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(first) && !/locator\(|getBy|=>/.test(first);
  return { subject: sub, actual: ja ? cut(first, 160) : "手順の途中でエラーになった（詳しくはエビデンスの記録）" };
}

/** 正本の手順の文（確かめの無い手順の画像に書く）。手順の中で控えた呼び名は、控えた値に置き換える */
function sceneTextOf(sceneName: string, info: TestInfo): string | undefined {
  try {
    const m = sceneName.match(/^手順(\d+)(?::(.+))?$/);
    const e = sceneName.match(/^期待結果(?::(.+))?$/);
    if (!m && !e) return undefined;
    const id = info.tags.map((t) => t.replace(/^@/, "")).find((t) => /^IT-/.test(t));
    if (!id) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cat = require("./catalog") as typeof import("./catalog");
    const c = cat.getCase(id);
    let text = m ? cat.stepsOf(c)[Number(m[1]) - 1] : c.期待結果;
    if (!text) return undefined;
    const att = [...info.attachments].reverse().find((a) => a.name === "証跡:控えた番号" && a.body);
    if (att) for (const [k, v] of JSON.parse(att.body!.toString("utf-8")) as [string, string][]) if (k.startsWith("〔")) text = text.split(k).join(`${k}（${v}）`);
    const label = m?.[2] ?? e?.[1];
    return `${m ? `手順${m[1]}` : "正本の期待結果"}${label ? `（${label}）` : ""}：${text.replace(/\s+/g, " ").replace(/^\s*\d+[.．、]\s*/, "")}`;
  } catch {
    return undefined;
  }
}

export type Prepared = {
  page: Page;
  /** 全体を撮ってよいか（画面を覆うモーダルがあれば false） */
  full: boolean;
  /** 撮る範囲（文書の座標）。確かめた所が縦に散らばっていて見えている範囲に入らないとき。あれば fullPage と一緒に渡す */
  clip?: { x: number; y: number; width: number; height: number };
  /** 確かめた所を写すために画面を動かした（撮ったら restoreInPage で戻す） */
  scrolled?: boolean;
  frames: FramePlan[];
  band: BandLine[];
  dpr: number;
  restored: boolean;
  notes: string[];
  /** 撮らない理由（サーバーの内部の情報が見えている）。あれば撮らずに「撮れなかった」とする */
  refuse?: string;
};

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: NodeJS.Timeout | undefined;
  const late = new Promise<undefined>((r) => { timer = setTimeout(() => r(undefined), ms); });
  try {
    return await Promise.race([p.catch(() => undefined), late]);
  } finally {
    clearTimeout(timer);
  }
}

const inflight = new WeakMap<Page, { n: number; last: number }>();
/** 通信の出入りを数える（見るだけ。要求には手を出さない） */
function watchNetwork(page: Page): void {
  if (inflight.has(page)) return;
  const st = { n: 0, last: Date.now() };
  inflight.set(page, st);
  const done = () => { st.n = Math.max(0, st.n - 1); st.last = Date.now(); };
  page.on("request", () => { st.n += 1; st.last = Date.now(); });
  page.on("requestfinished", done);
  page.on("requestfailed", done);
}

/** 画面が落ち着くのを上限つきで待つ（通信が 0.5 秒止む・「読込中」が消える・画像が読み終わる） */
async function settle(page: Page): Promise<string | undefined> {
  watchNetwork(page);
  const t0 = Date.now();
  const st = inflight.get(page)!;
  while (Date.now() - t0 < WAIT_NETWORK_MS && !(st.n === 0 && Date.now() - st.last >= 500)) await new Promise((r) => setTimeout(r, 100));
  const ok = await withTimeout(page.waitForFunction(settledInPage, { loading: LOADING_SELECTORS, ignore: DEBUG_SELECTORS }, { timeout: WAIT_LOADING_MS, polling: 200 }).then(() => true), WAIT_LOADING_MS + 1000);
  return ok ? undefined : `読み込み中の表示が ${WAIT_LOADING_MS / 1000} 秒で消えなかった（そのまま撮った）`;
}

/**
 * 撮る直前に呼ぶ。画面を整え、印の位置を測る。full は「全体を撮るつもりか」。
 * 戻り値の full が false なら、見えている範囲を撮る（画面を覆うモーダルが開いている）。
 * 必ず finishShot を呼ぶこと（画面を元に戻す）。
 */
export async function prepareShot(page: Page, sm: ShotMarks, isMain: boolean, full: boolean): Promise<Prepared> {
  const pr: Prepared = { page, full, frames: [], band: [], dpr: 1, restored: false, notes: [] };
  const why = await settle(page);
  if (why) pr.notes.push(why);
  const env = await withTimeout(page.evaluate(prepareInPage, { full, debugSelectors: DEBUG_SELECTORS, debugTexts: DEBUG_TEXTS, css: SHOT_CSS, leakPatterns: LEAK_PATTERNS, afterToolbarTexts: AFTER_TOOLBAR_TEXTS }), 5000) as PrepareResult | undefined;
  if (!env) { pr.notes.push("画面を整えられなかった（そのまま撮った）"); return pr; }
  if (env.leak) {
    pr.refuse = `サーバーの内部の情報（「${env.leak}」を含む例外の画面）が画面に出ているので撮らなかった（お客様への提出物に載せない）`;
    return pr;
  }
  try {
    if (env.forceViewport) pr.full = false;
    // 見えている範囲を撮るときは、確かめた所がすべて写る範囲を先に決める（画面を動かす、または撮る範囲を決める）
    const fitted = pr.full ? env : await fit(pr, page, sm, isMain, env);
    await measure(pr, page, sm, isMain, fitted);
  } catch (e) {
    // 測れなくても、画面は finishShot で必ず元に戻す（ここで投げると戻せない）
    pr.frames = [];
    pr.band = [];
    pr.notes.push(`確かめた所の位置を測れなかった（${(e as Error).message.split("\n")[0].slice(0, 100)}）`);
  }
  return pr;
}

/** この画面で書く印 */
function marksOf(page: Page, sm: ShotMarks, isMain: boolean): Mark[] {
  return sm.marks.filter((m) => (m.target.kind === "value" ? isMain : m.target.page === page || (isMain && m.target.page.isClosed())));
}

type ValueMark = Mark & { target: { kind: "value"; preds: ValuePred[] } };

/** 確かめた要素と、値を表示している要素の位置（いまの画面の座標） */
async function locate(page: Page, mine: Mark[]): Promise<{ infos: Map<Mark, ElementInfo | undefined>; valueMarks: ValueMark[]; found: ({ rect: Rect; options?: { texts: string[]; selected: string[] } } | null)[] }> {
  const infos = new Map<Mark, ElementInfo | undefined>();
  for (const m of mine) {
    if (m.target.kind === "locator" && m.target.page === page) {
      let info = await withTimeout(m.target.locator.evaluateAll(rectsOfElements, { hint: m.hint, want: m.want }), 3000);
      if (info?.cross) {
        // 別の出どころの iframe の中: Playwright の位置（外の画面の座標）を使う
        const n = Math.min(await withTimeout(m.target.locator.count(), 2000) ?? 0, 30);
        const rects: (Rect | null)[] = [];
        for (let i = 0; i < n; i++) {
          const b = await withTimeout(m.target.locator.nth(i).boundingBox({ timeout: 1000 }), 1500);
          rects.push(b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null);
        }
        info = { ...info, rects };
      }
      infos.set(m, info);
    }
  }
  const valueMarks = mine.filter((m) => m.target.kind === "value" && m.target.preds.length) as ValueMark[];
  const found = valueMarks.length ? (await withTimeout(page.evaluate(findByValue, valueMarks.map((m) => m.target.preds[0])), 5000)) ?? [] : [];
  return { infos, valueMarks, found };
}

/**
 * 見えている範囲を撮るとき（E2E_EVIDENCE=viewport・縦に長すぎる画面）に、確かめた所がすべて写るようにする。
 * - 見えている範囲に入る大きさなら、その真ん中に来るように画面を動かす（要素が1つなら scrollIntoView と同じ）。
 * - 縦に散らばっていて入らなければ、全部が入る範囲（上限 MAX_HEIGHT）を撮る（fullPage と clip。固定の表示は全体を撮るときと同じに整える）。
 * - 画面を覆うモーダルが開いているときは動かさない（確かめた所はモーダルの中にあり、裏の画面を動かしても変わらない）。
 * 動かした位置は finishShot（restoreInPage）で戻す。戻り値は、測り直すときに使う画面の様子。
 */
async function fit(pr: Prepared, page: Page, sm: ShotMarks, isMain: boolean, env: PrepareResult): Promise<PrepareResult> {
  if (env.forceViewport) return env;
  const mine = marksOf(page, sm, isMain).filter((m) => m.target.kind !== "page" && (m.target.kind === "value" || m.target.page === page));
  if (!mine.length) return env;
  const { infos, valueMarks, found } = await locate(page, mine);
  // 画面を動かすと位置が変わる要素だけ（固定の表示の中の要素は、いつも見えている）
  const rects: Rect[] = [];
  for (const info of infos.values()) (info?.rects ?? []).forEach((r, i) => { if (r && !info?.fixed?.[i]) rects.push(r); });
  valueMarks.forEach((_, i) => { const h = found[i]; if (h) rects.push(h.rect); });
  if (!rects.length) return env;
  const inView = (r: Rect) => r.y >= 0 && r.y + r.h <= env.vh && r.x + r.w > 0 && r.x < env.vw;
  if (rects.every(inView)) return env;
  // 文書の座標での、全部を囲む範囲
  const top = Math.min(...rects.map((r) => r.y)) + env.sy, bottom = Math.max(...rects.map((r) => r.y + r.h)) + env.sy;
  const left = Math.min(...rects.map((r) => r.x)) + env.sx, right = Math.max(...rects.map((r) => r.x + r.w)) + env.sx;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  if (bottom - top + FIT_MARGIN * 2 <= env.vh) {
    const y = clamp(Math.round((top + bottom) / 2 - env.vh / 2), 0, Math.max(0, env.docH - env.vh));
    const x = right - left <= env.vw && (left < env.sx || right > env.sx + env.vw) ? clamp(Math.round((left + right) / 2 - env.vw / 2), 0, Math.max(0, env.docW - env.vw)) : env.sx;
    const moved = await withTimeout(page.evaluate(scrollInPage, { x, y }), 3000);
    if (!moved) { pr.notes.push("確かめた所まで画面を動かせなかった（そのまま撮った）"); return env; }
    if (moved.sx === env.sx && moved.sy === env.sy) { pr.notes.push("確かめた所まで画面を動かせなかった（画面の中の枠でスクロールする作り など。そのまま撮った）"); return env; }
    pr.scrolled = true;
    pr.notes.push("確かめた所が見えている範囲の外にあったので、画面を動かして撮った（撮ったあと元の位置に戻した）");
    // 動かして見えた画像（遅れて読む画像 など）を、上限つきで待つ
    await withTimeout(page.waitForFunction(settledInPage, { loading: LOADING_SELECTORS, ignore: DEBUG_SELECTORS }, { timeout: 2000, polling: 200 }), 2500);
    return { ...env, sx: moved.sx, sy: moved.sy };
  }
  // 縦に散らばっている: 全体を撮るときと同じに画面を整え直して、全部が入る範囲を撮る
  await restoreSurely(page);
  const env2 = await withTimeout(page.evaluate(prepareInPage, { full: true, debugSelectors: DEBUG_SELECTORS, debugTexts: DEBUG_TEXTS, css: SHOT_CSS, leakPatterns: LEAK_PATTERNS, afterToolbarTexts: AFTER_TOOLBAR_TEXTS }), 5000) as PrepareResult | undefined;
  if (!env2 || env2.forceViewport || env2.leak) {
    // 整え直せない・モーダルが開いている: 見えている範囲を撮る形に戻す
    await restoreSurely(page);
    const env3 = await withTimeout(page.evaluate(prepareInPage, { full: false, debugSelectors: DEBUG_SELECTORS, debugTexts: DEBUG_TEXTS, css: SHOT_CSS, leakPatterns: LEAK_PATTERNS, afterToolbarTexts: AFTER_TOOLBAR_TEXTS }), 5000) as PrepareResult | undefined;
    if (!env3) throw new Error("画面を整え直せなかった");
    if (env3.leak) pr.refuse = `サーバーの内部の情報（「${env3.leak}」を含む例外の画面）が画面に出ているので撮らなかった（お客様への提出物に載せない）`;
    return env3;
  }
  // 固定の表示を置き直したので、測り直して範囲を決める（sticky を外すと位置がずれることがある）
  const again = await locate(page, mine);
  const r2: Rect[] = [];
  for (const info of again.infos.values()) (info?.rects ?? []).forEach((r, i) => { if (r && !info?.fixed?.[i]) r2.push(r); });
  again.valueMarks.forEach((_, i) => { const h = again.found[i]; if (h) r2.push(h.rect); });
  const all = r2.length ? r2 : rects;
  const t2 = Math.min(...all.map((r) => r.y)) + env2.sy, b2 = Math.max(...all.map((r) => r.y + r.h)) + env2.sy;
  const y0 = clamp(Math.floor(t2 - FIT_MARGIN), 0, env2.docH);
  const y1 = clamp(Math.ceil(b2 + FIT_MARGIN), y0 + 1, Math.min(env2.docH, y0 + MAX_HEIGHT));
  pr.clip = { x: 0, y: y0, width: Math.max(1, env2.vw), height: Math.max(1, y1 - y0) };
  pr.notes.push(`確かめた所が縦に散らばっていたので、全部が入る範囲（縦 ${y1 - y0}px）を撮った`);
  return env2;
}

async function measure(pr: Prepared, page: Page, sm: ShotMarks, isMain: boolean, env: PrepareResult): Promise<void> {
  const mine = marksOf(page, sm, isMain);
  pr.dpr = env.dpr;
  // 位置は、撮る画像の座標（全体なら文書の頭から、範囲を決めたならその範囲の左上から、見えている範囲なら画面の左上から）
  const c = pr.clip;
  const ox = c ? env.sx - c.x : pr.full ? env.sx : 0, oy = c ? env.sy - c.y : pr.full ? env.sy : 0;
  const inShot = (r: Rect) => c
    ? r.x + ox + r.w > 0 && r.y + oy + r.h > 0 && r.x + ox < c.width && r.y + oy < c.height
    : pr.full || (r.x + r.w > 0 && r.y + r.h > 0 && r.x < env.vw && r.y < env.vh);
  const { infos, valueMarks, found } = await locate(page, mine);
  const byKey = new Map<string, FramePlan>();
  const addFrame = (rects: Rect[], line: { text: string; fail: boolean }, sub?: string[]) => {
    const key = rects.map((r) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`).join("|");
    const f = byKey.get(key);
    if (f) { f.lines.push(line); if (sub && !f.sub) f.sub = sub; return; }
    const nf: FramePlan = { rects, lines: [line], sub };
    byKey.set(key, nf);
    pr.frames.push(nf);
  };
  // 確かめのあとに画面を変える操作（押す・入れる など）をしてから撮った: この画像は確かめた時点の画面ではない
  const beforeOp = (m: Mark) => m.at !== undefined && lastAction > m.at;
  const lineOf = (m: Mark, info?: ElementInfo) => {
    // 要素の呼び名が分からない文（「表示されている」だけ）は、要素の文字で主語を補う
    const exp = m.generic && info?.label ? m.generic(`「${cut(info.label, 30)}」`) : m.expect;
    const op = beforeOp(m) ? "（操作の前に確認）" : "";
    return { text: m.ok ? `期待結果：${exp}${op}` : `期待結果：${exp}${op}／実行結果：${m.actual ?? "期待と違った"}`, fail: !m.ok };
  };
  // 選択欄は、選んでいる値だけを書く（選択肢の一覧は札が大きくなって入力欄を隠すので書かない）
  const optionsLine = (o?: { texts: string[]; selected: string[] }) => o && o.selected.length
    ? [`選んでいる値：${o.selected.map((t) => cut(t, 30) || "（空）").join("／")}`]
    : undefined;
  // 画面のほとんど全部（本文の全体）を囲む枠は、何を示すか分からないので描かない（上の帯に書く）。
  // 全体を撮った画像では画面の高さより短い本文もあるので、幅がほぼ全部で高さが画面の3分の1を超える枠・面積が画面の半分を超える枠も含める
  const wholeScreen = (rs: Rect[]) => {
    const x1 = Math.min(...rs.map((r) => r.x)), y1 = Math.min(...rs.map((r) => r.y));
    const x2 = Math.max(...rs.map((r) => r.x + r.w)), y2 = Math.max(...rs.map((r) => r.y + r.h));
    const w = x2 - x1, h = y2 - y1;
    if (rs.length === 1 && w * h > env.vw * env.vh * 0.5) return true;
    return (w >= env.vw * 0.9 && h >= env.vh * 0.33) || (w >= env.vw * 0.95 && h >= env.vh * 0.9);
  };
  // 「無い」ことの確かめ・エラーの画面: 画面に出ている案内の文言（「〜はありません。」「404 Page Not Found」など）を囲む
  let notice: { rect: Rect; text: string } | null | undefined;
  const noticeRect = async () => {
    if (notice === undefined) notice = (await withTimeout(page.evaluate(findNotice), 3000)) ?? null;
    if (!notice) return undefined;
    const r = notice.rect;
    return inShot(r) ? { x: r.x + ox, y: r.y + oy, w: r.w, h: r.h } : undefined;
  };
  // この画像より前の画面（操作の前）で確かめたこと: この画像の画面のことと混ぜず、分けて書く
  const prior: string[] = [];
  for (const m of mine) {
    const t = m.target;
    const info = t.kind === "locator" ? infos.get(m) : undefined;
    const bandOf = (tag?: string) => pr.band.push({ text: `${lineOf(m, info).text}${tag ? `（${tag}）` : ""}`, kind: m.ok ? "check" : "fail" });
    const priorOf = () => prior.push(lineOf(m, info).text.replace(/（操作の前に確認）/, ""));
    if (t.kind === "locator") {
      if (t.page !== page) { bandOf("別の画面で確認"); continue; }
      const rects = (info?.rects ?? []).filter((r): r is Rect => !!r).filter(inShot).map((r) => ({ x: r.x + ox, y: r.y + oy, w: r.w, h: r.h }));
      // 「表示されない」ことを確かめたあとに操作して、いまは表示されている: 確かめた時点の画面ではないので、枠は描かない
      if (rects.length && !(t.negativeExistence && beforeOp(m))) {
        if (wholeScreen(rects)) { bandOf(); continue; }
        addFrame(rects, lineOf(m, info), optionsLine(info?.options));
        continue;
      }
      if (!m.ok) { bandOf(); continue; }
      if (t.negativeExistence && !beforeOp(m)) {
        const nr = await noticeRect();
        if (nr) addFrame([nr], lineOf(m, info));
        else bandOf();
        continue;
      }
      if ((info?.rects ?? []).some((r) => r && !inShot(r))) bandOf("撮った範囲の外");
      else priorOf();
      const o = optionsLine(info?.options);
      if (o) o.forEach((s) => pr.band.push({ text: `　${s}`, kind: "meta" }));
      continue;
    }
    if (t.kind === "page") { bandOf(t.what === "URL" ? "URL で確認" : "画面の題で確認"); continue; }
    const i = valueMarks.indexOf(m as never);
    const hit = i >= 0 ? found[i] : null;
    // 開いていた画面の URL は、この画像の URL と同じなら書かない（下の「画面の URL」と重ねない）
    const shotUrl = urlText(safe(() => page.url()));
    const how = t.how?.replace(`（開いていた画面：${shotUrl}）`, "");
    if (hit && inShot(hit.rect)) {
      // DB で確かめた値が画面にも出ている: その要素を囲み、確かめ方（照会）は札の下に小さく添える
      const sub = [...(optionsLine(hit.options) ?? []), ...(t.origin && how ? [how] : [])];
      addFrame([{ x: hit.rect.x + ox, y: hit.rect.y + oy, w: hit.rect.w, h: hit.rect.h }], lineOf(m), sub.length ? sub : undefined);
      continue;
    }
    // 画面から読んだ値で「無い」ことの確かめ: 画面の案内の文言があれば囲む
    if (!t.origin && m.ok && !how && /無い|ない|ありません/.test(m.expect)) {
      const nr = await noticeRect();
      if (nr) { addFrame([nr], lineOf(m)); continue; }
    }
    bandOf(how || undefined);
  }
  if (prior.length) {
    pr.band.push({ text: "この画像の前の画面（操作の前）で確かめたこと：", kind: "prior" });
    for (const l of prior) pr.band.push({ text: `　${l}`, kind: "prior" });
  }
  if (isMain) {
    for (const d of sm.dialogs) pr.band.unshift({ text: dialogLine(d), kind: "dialog" });
    // 手順・期待結果の見出し（正本の文）は、確かめがあってもいつも書く（どの手順の画像かが分かるように）
    if (sm.sceneText) pr.band.unshift({ text: cut(sm.sceneText, 400), kind: "scene" });
  }
  pr.band.push({ text: `画面の URL：${cut(urlText(safe(() => page.url())), 300)}`, kind: "meta" });
  // パスワードらしい値は伏せる（正本の手順の文・期待結果の文・入力値の札）
  for (const b of pr.band) b.text = maskSecrets(b.text);
  for (const f of pr.frames) { for (const l of f.lines) l.text = maskSecrets(l.text); if (f.sub) f.sub = f.sub.map(maskSecrets); }
}

/** 撮ったら必ず呼ぶ。画面を元に戻し、画像に印を重ねて書き直す。失敗しても投げない（理由を返す） */
export async function finishShot(pr: Prepared, file: string | undefined, format: "png" | "jpeg"): Promise<string | undefined> {
  if (!pr.restored) {
    pr.restored = true;
    await restoreSurely(pr.page);
  }
  if (!file || (!pr.frames.length && !pr.band.length)) return pr.notes.join("／") || undefined;
  try {
    await compose(pr, file, format);
    return pr.notes.join("／") || undefined;
  } catch (e) {
    return [...pr.notes, `画像に印を書けなかった（${(e as Error).message.split("\n")[0].slice(0, 120)}）`].join("／");
  }
}

async function compose(pr: Prepared, file: string, format: "png" | "jpeg"): Promise<void> {
  const browser = pr.page.context().browser();
  if (!browser) throw new Error("ブラウザを取れない");
  const buf = fs.readFileSync(file);
  const ctx = await browser.newContext({ deviceScaleFactor: pr.dpr, viewport: { width: 800, height: 600 }, locale: "ja-JP" });
  try {
    const hp = await ctx.newPage();
    const size = await hp.evaluate(renderComposite, {
      src: `data:image/${format};base64,${buf.toString("base64")}`, dpr: pr.dpr, frames: pr.frames, band: pr.band,
    });
    await hp.setViewportSize({ width: Math.ceil(size.w), height: Math.min(Math.ceil(size.h), 4000) });
    const out = await hp.screenshot({ fullPage: true, type: format, quality: format === "jpeg" ? 80 : undefined, timeout: 30_000 });
    fs.writeFileSync(file, out);
  } finally {
    await ctx.close().catch(() => {});
  }
}

export { valueText };
