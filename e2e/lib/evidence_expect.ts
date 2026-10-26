/**
 * 期待結果の確かめ（expect）を、期待と実際の状態の組として記録する。
 *
 * spec は expect を "@playwright/test" でなくここ（lib/case.ts が出し直す）から使う。ふるまいは Playwright の expect と同じで、
 * caseTest の expected() の中で呼ばれた確かめだけを記録する（手順の中・画面の部品の中の確かめは記録しない）。
 *
 * 記録するもの（1つの確かめにつき1つ）
 *   項目: 確かめのメッセージ（expect の第2引数。業務の言葉）
 *   期待: 照合の種類と期待値（「＝ 403」「表示されている」「3件」など）
 *   実際: 確かめたときに見えていた状態。値ならその値、画面の要素なら件数・文字・入力値・表示の有無など、ページなら URL
 *   結果: 合格／不合格（soft の落ちも数える）
 * 実際の状態を読むのは確かめのあと（合否が決まってから）で、読み取りだけ。読めなければ「読めなかった」と書き、合否は変えない。
 */
import { expect as pwExpect, Locator, Page, test } from "@playwright/test";

export type Check = { 項目: string; 期待: string; 実際: string; 結果: "合格" | "不合格" };

let sink: Check[] | null = null;

/** expected() の始めと終わりに caseTest が呼ぶ */
export function startRecording(): void {
  sink = [];
}
export function stopRecording(): Check[] {
  const out = sink ?? [];
  sink = null;
  return out;
}

const MAX = 300;
const cut = (s: string) => (s.length > MAX ? `${s.slice(0, MAX)}…` : s);

function fmt(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return `「${cut(v)}」`;
  if (v instanceof RegExp) return String(v);
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
  try {
    return cut(JSON.stringify(v));
  } catch {
    return cut(String(v));
  }
}

const isLocator = (v: unknown): v is Locator => !!v && typeof v === "object" && typeof (v as Locator).evaluateAll === "function" && typeof (v as Locator).count === "function";
const isPage = (v: unknown): v is Page => !!v && typeof v === "object" && typeof (v as Page).goto === "function" && typeof (v as Page).url === "function";

/** 照合の種類と期待値を、読める言葉にする */
function describe(matcher: string, args: unknown[], negated: boolean): string {
  const a = args.map(fmt);
  const not = (yes: string, no: string) => (negated ? no : yes);
  switch (matcher) {
    case "toBe": case "toEqual": case "toStrictEqual": return `${not("＝", "≠")} ${a[0]}`;
    case "toContain": return not(`${a[0]} を含む`, `${a[0]} を含まない`);
    case "toContainEqual": return not(`${a[0]} と同じ要素を含む`, `${a[0]} と同じ要素を含まない`);
    case "toMatch": return not(`${a[0]} に合う`, `${a[0]} に合わない`);
    case "toHaveLength": return not(`長さ ${a[0]}`, `長さが ${a[0]} でない`);
    case "toHaveCount": return not(`${a[0]}件`, `${a[0]}件でない`);
    case "toBeVisible": return not("表示されている", "表示されていない");
    case "toBeHidden": return not("表示されていない", "表示されている");
    case "toBeEnabled": return not("操作できる", "操作できない");
    case "toBeDisabled": return not("操作できない", "操作できる");
    case "toBeChecked": return not("チェックが入っている", "チェックが入っていない");
    case "toBeEditable": return not("入力できる", "入力できない");
    case "toBeAttached": return not("画面にある", "画面に無い");
    case "toBeEmpty": return not("空", "空でない");
    case "toHaveText": return not(`文字が ${a[0]}`, `文字が ${a[0]} でない`);
    case "toContainText": return not(`文字に ${a[0]} を含む`, `文字に ${a[0]} を含まない`);
    case "toHaveValue": return not(`入力値が ${a[0]}`, `入力値が ${a[0]} でない`);
    case "toHaveValues": return not(`選んだ値が ${a[0]}`, `選んだ値が ${a[0]} でない`);
    case "toHaveAttribute": return not(`属性 ${a[0]}${args.length > 1 ? ` が ${a[1]}` : " がある"}`, `属性 ${a[0]}${args.length > 1 ? ` が ${a[1]} でない` : " が無い"}`);
    case "toHaveClass": return not(`class が ${a[0]}`, `class が ${a[0]} でない`);
    case "toHaveJSProperty": return not(`${a[0]} が ${a[1]}`, `${a[0]} が ${a[1]} でない`);
    case "toHaveURL": return not(`URL が ${a[0]}`, `URL が ${a[0]} でない`);
    case "toHaveTitle": return not(`題が ${a[0]}`, `題が ${a[0]} でない`);
    case "toBeNull": return not("空（null）", "空（null）でない");
    case "toBeUndefined": return not("未定義", "未定義でない");
    case "toBeDefined": return not("定義されている", "定義されていない");
    case "toBeTruthy": return not("真", "偽");
    case "toBeFalsy": return not("偽", "真");
    case "toBeNaN": return not("数でない（NaN）", "数");
    case "toBeGreaterThan": return `${not(">", "≦")} ${a[0]}`;
    case "toBeGreaterThanOrEqual": return `${not("≧", "<")} ${a[0]}`;
    case "toBeLessThan": return `${not("<", "≧")} ${a[0]}`;
    case "toBeLessThanOrEqual": return `${not("≦", ">")} ${a[0]}`;
    case "toBeCloseTo": return `${not("≒", "≠")} ${a[0]}`;
    case "toThrow": return not("例外になる", "例外にならない");
    default: return `${negated ? "not." : ""}${matcher}(${a.join(", ")})`;
  }
}

/** 確かめたときの実際の状態（読み取りだけ） */
async function observe(actual: unknown, matcher: string, args: unknown[]): Promise<string> {
  try {
    if (isPage(actual)) return matcher === "toHaveTitle" ? `題「${cut(await actual.title())}」` : `URL ${actual.url()}`;
    if (isLocator(actual)) {
      const st = await actual.evaluateAll((els, attr) => els.slice(0, 5).map((e) => {
        const el = e as HTMLElement & { value?: string; checked?: boolean; disabled?: boolean };
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          text: (el.innerText ?? el.textContent ?? "").replace(/\s+/g, " ").trim(),
          value: typeof el.value === "string" ? el.value : null,
          checked: typeof el.checked === "boolean" ? el.checked : null,
          disabled: !!el.disabled,
          visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none",
          attr: attr ? el.getAttribute(attr) : null,
          cls: el.getAttribute("class"),
        };
      }), matcher === "toHaveAttribute" ? String(args[0]) : null);
      const n = await actual.count();
      if (n === 0) return "0件（画面に無い）";
      const s = st[0];
      const many = n > 1 ? `${n}件。1件目は` : "";
      switch (matcher) {
        case "toHaveCount": return `${n}件${st.length ? `（${st.map((x) => `「${cut(x.text)}」`).slice(0, 3).join("・")}${n > 3 ? " ほか" : ""}）` : ""}`;
        case "toBeVisible": case "toBeHidden": return `${many}${s.visible ? "表示されている" : "表示されていない"}`;
        case "toBeEnabled": case "toBeDisabled": case "toBeEditable": return `${many}${s.disabled ? "操作できない" : "操作できる"}`;
        case "toBeChecked": return `${many}${s.checked ? "チェックが入っている" : "チェックが入っていない"}`;
        case "toHaveValue": case "toHaveValues": return `${many}入力値「${cut(s.value ?? "")}」`;
        case "toHaveAttribute": return `${many}属性 ${String(args[0])} ${s.attr === null ? "なし" : `「${cut(s.attr)}」`}`;
        case "toHaveClass": return `${many}class「${cut(s.cls ?? "")}」`;
        default: return `${many}文字「${cut(s.text)}」${s.value !== null ? `・入力値「${cut(s.value)}」` : ""}`;
      }
    }
    if (typeof actual === "function") return "（関数の結果を確かめた。値は記録していない）";
    if (matcher === "toContain" || matcher === "toContainEqual") return containment(actual, args[0]);
    return fmt(actual);
  } catch (e) {
    return `読めなかった（${(e as Error).message.split("\n")[0].slice(0, 120)}）`;
  }
}

/** 含むかの確かめは、長い一覧・文字が途中で切れて肝心の値が見えなくなるので、どこにあったかを書く */
function containment(actual: unknown, want: unknown): string {
  const same = (x: unknown) => x === want || (typeof x === "object" && JSON.stringify(x) === JSON.stringify(want));
  if (Array.isArray(actual)) {
    const at = actual.map((x, i) => (same(x) ? i + 1 : 0)).filter((i) => i > 0);
    const head = cut(actual.slice(0, 5).map(fmt).join("・")) + (actual.length > 5 ? " ほか" : "");
    return at.length
      ? `${actual.length}件。${fmt(want)} は ${at.slice(0, 5).join("・")}件目にある（先頭: ${head}）`
      : `${actual.length}件。${fmt(want)} は無い（先頭: ${head}）`;
  }
  if (typeof actual === "string" && typeof want === "string") {
    const i = actual.indexOf(want);
    if (i < 0) return `${actual.length}文字。${fmt(want)} は無い（先頭: ${fmt(actual.slice(0, 120))}）`;
    if (actual.length <= MAX) return fmt(actual);
    return `${actual.length}文字。${fmt(want)} は ${i + 1}文字目から（前後: 「…${actual.slice(Math.max(0, i - 40), i + want.length + 40)}…」）`;
  }
  return fmt(actual);
}

type Opts = { message?: string; soft?: boolean; poll?: boolean };

function messageOf(m: unknown): string | undefined {
  if (typeof m === "string") return m;
  if (m && typeof m === "object" && typeof (m as { message?: unknown }).message === "string") return (m as { message: string }).message;
  return undefined;
}

/** expect(...) が返す照合の集まりを包む。照合を呼ぶたびに記録する */
function wrap(target: object, actual: unknown, opts: Opts, negated: boolean): object {
  return new Proxy(target, {
    get(t, prop, receiver) {
      const v = Reflect.get(t, prop, receiver);
      if (prop === "not") return wrap(v as object, actual, opts, !negated);
      if (prop === "resolves" || prop === "rejects") return wrap(v as object, actual, opts, negated);
      if (typeof v !== "function" || typeof prop !== "string" || !prop.startsWith("to")) return v;
      return (...args: unknown[]) => {
        const rec = sink;
        if (!rec) return (v as (...a: unknown[]) => unknown).apply(t, args);
        const errorsBefore = test.info().errors.length;
        const entry = (ok: boolean, 実際: string): Check => ({
          項目: opts.message ?? "（メッセージの無い確かめ）",
          期待: describe(prop, args, negated),
          実際: opts.poll ? `${実際}（繰り返し確かめた）` : 実際,
          結果: ok ? "合格" : "不合格",
        });
        let r: unknown;
        try {
          r = (v as (...a: unknown[]) => unknown).apply(t, args);
        } catch (e) {
          rec.push(entry(false, isLocator(actual) || isPage(actual) ? "（読めなかった）" : fmt(actual)));
          throw e;
        }
        if (r && typeof (r as Promise<unknown>).then === "function") {
          return (r as Promise<unknown>).then(
            async (x) => { rec.push(entry(test.info().errors.length === errorsBefore, await observe(actual, prop, args))); return x; },
            async (e) => { rec.push(entry(false, await observe(actual, prop, args))); throw e; },
          );
        }
        rec.push(entry(test.info().errors.length === errorsBefore, isLocator(actual) || isPage(actual) ? "（同期の確かめ）" : fmt(actual)));
        return r;
      };
    },
  });
}

/** Playwright の expect と同じに使える。expected() の中では、期待と実際の状態を記録する */
export const expect: typeof pwExpect = new Proxy(pwExpect, {
  apply(t, _this, args: unknown[]) {
    const m = (t as unknown as (...a: unknown[]) => object)(...args);
    return wrap(m, args[0], { message: messageOf(args[1]) }, false);
  },
  get(t, prop, receiver) {
    const v = Reflect.get(t, prop, receiver);
    if (prop === "soft") {
      return (...args: unknown[]) => wrap((v as (...a: unknown[]) => object)(...args), args[0], { message: messageOf(args[1]), soft: true }, false);
    }
    if (prop === "poll") {
      return (...args: unknown[]) => wrap((v as (...a: unknown[]) => object)(...args), args[0], { message: messageOf(args[1]), poll: true }, false);
    }
    return v;
  },
}) as typeof pwExpect;
