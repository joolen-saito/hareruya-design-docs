/**
 * エビデンスの画像に書く文（lib/annotate.ts から使う）。
 *
 * - 「期待結果：…」の文を、確かめ（expect）のメッセージ・照合の種類・期待値から組み立てる。
 *   メッセージが「〜が表示される」のような文なら、そのまま使う（値が文に無ければ、かっこで添える）。
 *   メッセージが「ステータス」のような名詞なら、「ステータスが「新規登録」」のように述語を足す。
 *   メッセージが無ければ、確かめた要素（getByText('…') など）と照合の種類から組み立てる。
 * - 不合格のときの「実行結果：…」の文を、記録した実際の状態（lib/evidence_expect.ts の Check.実際）から作る。
 * - 画面の要素でない確かめ（DB・メール・URL・Cookie・HTTP の応答・ダウンロード など）の出どころを、
 *   確かめを書いた行（spec の expect の第1引数）と、その手前で値を作った行から判定する（読むだけ。動きは変えない）。
 */
import fs from "node:fs";
import path from "node:path";

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);
const isAsym = (v: unknown): v is { asymmetricMatch: unknown; sample?: unknown; toString(): string } =>
  !!v && typeof v === "object" && typeof (v as { asymmetricMatch?: unknown }).asymmetricMatch === "function";

/** 正規表現が、ただの文字（前後の空白の読み飛ばしを含む）か。そうなら、その文字と「一致/含む」を返す */
export function regexLiteral(re: RegExp): { mode: "eq" | "inc"; s: string } | undefined {
  let src = re.source;
  let head = false, tail = false;
  const h = src.match(/^\^(\\s\*|\\s\+|\s\*)?/);
  if (h) { head = true; src = src.slice(h[0].length); }
  const t = src.match(/(\\s\*|\\s\+)?\$$/);
  if (t && !src.endsWith("\\$")) { tail = true; src = src.slice(0, src.length - t[0].length); }
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\\") {
      const nx = src[i + 1];
      if (nx === undefined || /[A-Za-z0-9]/.test(nx)) return undefined; // \s \d \b など
      out += nx; i++; continue;
    }
    if (".*+?()[]{}|^$".includes(ch)) return undefined;
    out += ch;
  }
  if (!out) return undefined;
  return { mode: head && tail ? "eq" : "inc", s: out };
}

/**
 * URL の道筋のような、ただの文字に近い正規表現（/^\/en\/?$/、/\/events\/123\/detail\/?$/ など）を読める文字にする。
 * 末尾の「/ が有っても無くてもよい」「? 以降は何でもよい」、先頭・末尾の「.*」は読み飛ばす。読めない形なら undefined。
 */
export function regexReadable(re: RegExp): { mode: "eq" | "inc"; s: string } | undefined {
  let src = re.source;
  const head = src.startsWith("^");
  if (head) src = src.slice(1);
  if (src.startsWith(".*")) src = src.slice(2);
  let tail = false;
  const TAILS = ["$", "\\/?", "/?", "(\\?.*)?", "(?:\\?.*)?", "(\\/)?", "(?:\\/)?", ".*"];
  for (let changed = true; changed;) {
    changed = false;
    for (const t of TAILS) {
      if (src.length > t.length && src.endsWith(t) && !src.endsWith(`\\${t}`)) {
        if (t === "$") tail = true;
        src = src.slice(0, src.length - t.length);
        changed = true;
      }
    }
  }
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\\") {
      const nx = src[i + 1];
      if (nx === undefined || /[A-Za-z0-9]/.test(nx)) return undefined;
      out += nx; i++; continue;
    }
    if (".*+?()[]{}|^$".includes(ch)) return undefined;
    out += ch;
  }
  if (!out) return undefined;
  return { mode: head && tail ? "eq" : "inc", s: out };
}

/**
 * URL の道筋のような正規表現（/^\/admin\/cardset\/\d+\/edit$/、/\/event\/entry(\/page\/\d+)?\/?$/ など）を、期待の形として読める文字にする。
 * 有っても無くてもよい部分（(…)?）は落とし、数字の並び（\d+）は〔番号〕、区切りまでの任意の文字（[^/]+）は〔値〕と書く。
 * mode: eq＝この形そのもの・end＝この形で終わる・start＝この形で始まる・inc＝この形を含む。読めない形なら undefined。
 */
export function regexShape(re: RegExp): { mode: "eq" | "end" | "start" | "inc"; s: string } | undefined {
  let src = re.source;
  const head = src.startsWith("^");
  if (head) src = src.slice(1);
  let tail = false;
  const TAILS = ["$", "\\/?", "/?", "(\\?.*)?", "(?:\\?.*)?", "(\\/)?", "(?:\\/)?"];
  for (let changed = true; changed;) {
    changed = false;
    for (const t of TAILS) {
      if (src.length > t.length && src.endsWith(t) && !src.endsWith(`\\${t}`)) {
        if (t === "$") tail = true;
        src = src.slice(0, src.length - t.length);
        changed = true;
      }
    }
  }
  // 有っても無くてもよい部分（入れ子の無いかっこ）を落とす
  for (let prev = ""; prev !== src;) { prev = src; src = src.replace(/\((?:\?:)?(?:\\.|[^()\\])*\)\?/g, ""); }
  src = src.replace(/(?:\\d|\[0-9\])\{(\d+)\}/g, "\u0000$1桁の数字\u0000").replace(/\\d\+|\[0-9\]\+/g, "\u0000番号\u0000").replace(/\[\^\\?\/\]\+/g, "\u0000値\u0000");
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\u0000") { const j = src.indexOf("\u0000", i + 1); out += `〔${src.slice(i + 1, j)}〕`; i = j; continue; }
    if (ch === "\\") {
      const nx = src[i + 1];
      if (nx === undefined || /[A-Za-z0-9]/.test(nx)) return undefined;
      out += nx; i++; continue;
    }
    if (".*+?()[]{}|^$".includes(ch)) return undefined;
    out += ch;
  }
  if (!out.replace(/〔(番号|値)〕|\//g, "")) return undefined;
  return { mode: head && tail ? "eq" : tail ? "end" : head ? "start" : "inc", s: out };
}

/** パーセント符号で書いた文字（%E5%A4%A7…）を読める文字に戻す（URL など）。戻せなければそのまま */
export function decodePct(s: string): string {
  if (!/%[0-9A-Fa-f]{2}/.test(s)) return s;
  try { return decodeURI(s).replace(/%(2[0-9A-F]|3[A-F]|40)/gi, (m) => { try { return decodeURIComponent(m); } catch { return m; } }); } catch { return s; }
}

/** 値を、読める言葉にする（文の中に埋める形） */
export function valueText(v: unknown, n = 60): string {
  if (typeof v === "string") return v === "" ? "空" : `「${cut(decodePct(v).replace(/\s+/g, " "), n)}」`;
  if (typeof v === "number" || typeof v === "bigint" || typeof v === "boolean") return String(v);
  if (v === null) return "空（null）";
  if (v === undefined) return "未定義";
  if (v instanceof RegExp) {
    // 正規表現の書き方（/^\/en\/?$/ など）は、お客様への提出物に出さない。読める文字にできなければ「決まった形」とだけ書く
    const lit = regexLiteral(v) ?? regexReadable(v);
    return lit ? `「${cut(lit.s, n)}」${lit.mode === "inc" ? "を含む文字" : ""}` : "決まった形の値";
  }
  if (v instanceof Date) return v.toLocaleString("ja-JP");
  if (Array.isArray(v)) {
    if (!v.length) return "無し（0件）";
    const objs = v.some((x) => !!x && typeof x === "object" && !(x instanceof RegExp) && !(x instanceof Date) && !isAsym(x));
    const head = v.slice(0, 6).map((x) => valueText(x, 30)).join(objs ? "／" : "・");
    return v.length > 6 ? `${head} ほか（全${v.length}件）` : head;
  }
  if (isAsym(v)) {
    const name = String(v.toString());
    if (/Containing/.test(name)) return `${valueText(v.sample, n)}を含むもの`;
    if (/StringMatching/.test(name)) return v.sample instanceof RegExp ? valueText(v.sample, n) : `${valueText(v.sample, n)}を含む文字`;
    if (/Any/.test(name)) return "何らかの値";
    return "条件に合う値";
  }
  // DB の行など（{"商品コード":"…","数量":1}）: JSON の書き方のまま出さず「商品コード「…」・数量 1」の形にする
  if (v && typeof v === "object") {
    const ents = Object.entries(v as Record<string, unknown>);
    if (!ents.length) return "空";
    const one = ([k, x]: [string, unknown]) => {
      const t = x && typeof x === "object" && !(x instanceof Date) && !(x instanceof RegExp) ? "（項目の組）" : valueText(x, 30);
      return `${k}${/^[「（]/.test(t) ? "" : " "}${t}`;
    };
    const parts = ents.slice(0, 10).map(one);
    return cut(`${parts.join("・")}${ents.length > 10 ? ` ほか（全${ents.length}項目）` : ""}`, Math.max(n, 160));
  }
  return cut(String(v), n);
}

/** 値そのものの文字（メッセージにもう書いてあるかを調べるため） */
function keyOf(v: unknown): string | undefined {
  if (typeof v === "string" && v) return v;
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (v instanceof RegExp) return regexLiteral(v)?.s;
  return undefined;
}

/** 末尾のかっこ書き（「（表示されない）」など）を分ける */
function splitTail(msg: string): { core: string; tail: string } {
  const m = msg.match(/^(.*?)((?:（[^（）]*）|\([^()]*\))+)$/s);
  return m && m[1].trim() ? { core: m[1].trim(), tail: m[2] } : { core: msg, tail: "" };
}

const STATEMENT_END = /(る|た|い|ず|だ|ぬ|ん|く|ぐ|す|つ|ぶ|む|う|こと|まま|だけ|のみ|通り|とおり|済み|非活性|未登録|しない|できない)$/;
const NEGATIVE_END = /(ない|無い|ず|ぬ|ません|未登録|非活性|非表示|オフ|偽|失敗|ないこと|無いこと)$/;
const NEGATIVE_HINT = /(ない|無い|ず|オフ|偽|はず|失敗|非)/;

/** メッセージが、それだけで期待の状態を言い切っている文か（名詞なら false）。「検索店舗が試験本店」のように「が」で言い切る形も文とみなす */
export function isStatement(msg: string): boolean {
  const { core } = splitTail(msg.replace(/[。．.\s]+$/, ""));
  return STATEMENT_END.test(core) || (/」$/.test(core) && /[がにはをも]/.test(core));
}

/** 否定の確かめの文は「〜ないこと」の形にそろえる（「表示されない」→「表示されないこと」） */
function withKoto(s: string): string {
  const { core, tail } = splitTail(s);
  return /(ない|無い)$/.test(core) ? `${core}こと${tail}` : s;
}

/** 肯定の文を否定の文にする（「開いている」→「開いていないこと」）。言い換えられなければ undefined */
export function negateStatement(core: string): string | undefined {
  const rules: [RegExp, string][] = [
    [/表示されている$/, "表示されないこと"], [/表示される$/, "表示されないこと"], [/出ている$/, "出ていないこと"], [/出る$/, "出ないこと"],
    [/ている$/, "ていないこと"], [/てある$/, "ていないこと"], [/がある$/, "が無いこと"], [/にある$/, "に無いこと"], [/ある$/, "無いこと"],
    [/できる$/, "できないこと"], [/される$/, "されないこと"], [/れる$/, "れないこと"], [/する$/, "しないこと"], [/いる$/, "いないこと"],
    [/開く$/, "開かないこと"], [/付く$/, "付かないこと"], [/届く$/, "届かないこと"], [/残る$/, "残らないこと"], [/変わる$/, "変わらないこと"],
    [/移る$/, "移らないこと"], [/戻る$/, "戻らないこと"], [/入る$/, "入らないこと"], [/なる$/, "ならないこと"],
    // 過去の形（「経由した」「表示された」「開いた」「残った」）
    [/された$/, "されていないこと"], [/した$/, "していないこと"], [/れた$/, "れていないこと"], [/いた$/, "いていないこと"], [/った$/, "っていないこと"],
    [/んだ$/, "んでいないこと"], [/きた$/, "きていないこと"],
  ];
  for (const [re, to] of rules) if (re.test(core)) return core.replace(re, to);
  return undefined;
}

/** 「〜の数」「〜の件数」の名詞から、数えたもの（「〜」）を取り出す。数の名詞でなければ undefined */
function countBase(core: string): string | undefined {
  const m = core.match(/^(.+?)の?(件数|個数|数)$/);
  return m && m[1].length >= 2 ? m[1] : undefined;
}

/** 確かめた要素の呼び名（メッセージが無いとき）。Playwright の locator の表記から読む */
export function subjectOfLocator(desc: string): { subject: string; text?: string } | undefined {
  const last = (re: RegExp) => { let m: RegExpExecArray | null, out: RegExpExecArray | null = null; while ((m = re.exec(desc))) out = m; return out; };
  const unq = (s: string) => s.replace(/\\'/g, "'");
  const role = last(/getByRole\('([a-z]+)'(?:, \{[^}]*name: (?:'((?:[^'\\]|\\.)*)'|\/((?:[^/\\]|\\.)*)\/)[^}]*\})?\)/g);
  const text = last(/getByText\((?:'((?:[^'\\]|\\.)*)'|\/((?:[^/\\]|\\.)*)\/)/g);
  const label = last(/getBy(Label|Placeholder|Title|AltText)\('((?:[^'\\]|\\.)*)'/g);
  // いちばん後ろに書いた絞り込みを使う
  const cands = [role && { i: role.index, k: "role" }, text && { i: text.index, k: "text" }, label && { i: label.index, k: "label" }].filter(Boolean) as { i: number; k: string }[];
  if (!cands.length) return undefined;
  const k = cands.sort((a, b) => b.i - a.i)[0].k;
  if (k === "text" && text) { const s = unq(text[1] ?? text[2] ?? ""); return { subject: `「${cut(s, 40)}」`, text: s }; }
  if (k === "role" && role) {
    const names: Record<string, string> = {
      button: "ボタン", link: "リンク", heading: "見出し", textbox: "入力欄", checkbox: "チェックボックス", radio: "ラジオボタン",
      combobox: "選択欄", listbox: "選択欄", option: "選択肢", row: "行", cell: "欄", columnheader: "列の見出し", table: "表",
      alert: "メッセージ", dialog: "ダイアログ", tab: "タブ", img: "画像", listitem: "項目", menuitem: "メニュー", spinbutton: "入力欄",
    };
    const nm = role[2] ?? role[3];
    const r = names[role[1]] ?? "要素";
    return { subject: nm ? `${r}「${cut(unq(nm), 40)}」` : r };
  }
  if (label) {
    const s = cut(unq(label[2]), 40);
    return { subject: label[1] === "Label" ? `「${s}」の欄` : label[1] === "Placeholder" ? `「${s}」の入力欄` : label[1] === "AltText" ? `画像「${s}」` : `「${s}」` };
  }
  return undefined;
}

export type CheckInfo = {
  matcher: string;
  args: unknown[];
  negated: boolean;
  message?: string;
  /** 照合した値（要素・ページなら undefined） */
  value?: unknown;
  isValue: boolean;
  /** 要素の表記（locator.toString()） */
  locatorDesc?: string;
  isPage?: boolean;
  /** 値を画面の要素から読んだ（数が 0 なら「表示されないこと」と書く） */
  screen?: boolean;
};

/** 「が」「を」などの後ろに値を続ける。かぎかっこ・漢字で始まる値の前には空白を入れない */
const sp = (v: string) => (/^[「『（\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(v) ? v : ` ${v}`);

/**
 * subj: 主語（メッセージの名詞・要素の呼び名）を付けた文。alone: 主語なしの文。
 * detail: メッセージが文のときに、かっこで添える期待値。mech: detail が機械的（0 より大きい・class・属性 など）で、文のメッセージには添えない。
 */
type Phrase = { subj: (s: string) => string; alone: string; detail?: string; key?: string; mech?: boolean };

/** class の名前の、見た目の意味（分かるものだけ。class の名前そのものは画像に出さない） */
function classMeaning(v: unknown, neg: boolean): string {
  const s = v instanceof RegExp ? v.source : Array.isArray(v) ? v.join(" ") : String(v ?? "");
  const P = (yes: string, no: string) => (neg ? no : yes);
  if (/active|selected|current|is-on|checked/i.test(s)) return P("選ばれた状態で表示されている", "選ばれた状態でない");
  if (/visible|show|open|is-shown|expanded/i.test(s)) return P("開いた（表示された）状態", "閉じた（表示されない）状態");
  if (/hidden|hide|closed|collapsed/i.test(s)) return P("閉じた（表示されない）状態", "開いた（表示された）状態");
  if (/disabled|inactive/i.test(s)) return P("操作できない状態", "操作できる状態");
  if (/error|invalid|danger/i.test(s)) return P("エラーの表示になっている", "エラーの表示になっていない");
  return P("期待の表示の状態になっている", "期待の表示の状態になっていない");
}

function phraseOf(ci: CheckInfo): Phrase | undefined {
  const { matcher: m, args, negated: neg } = ci;
  const v = args[0];
  const vt = valueText(v);
  const key = keyOf(v);
  const P = (yes: string, no: string) => (neg ? no : yes);
  switch (m) {
    case "toBeVisible": return { subj: (s) => `${s}が${P("表示されている", "表示されないこと")}`, alone: P("表示されている", "表示されないこと") };
    case "toBeHidden": return { subj: (s) => `${s}が${P("表示されないこと", "表示されている")}`, alone: P("表示されないこと", "表示されている") };
    case "toBeAttached": return { subj: (s) => `${s}が${P("画面にある", "画面に無いこと")}`, alone: P("画面にある", "画面に無いこと") };
    case "toBeEnabled": return { subj: (s) => `${s}が${P("操作できる", "操作できない")}`, alone: P("操作できる", "操作できない") };
    case "toBeDisabled": return { subj: (s) => `${s}が${P("操作できない", "操作できる")}`, alone: P("操作できない", "操作できる") };
    case "toBeEditable": return { subj: (s) => `${s}が${P("入力できる", "入力できない")}`, alone: P("入力できる", "入力できない") };
    case "toBeFocused": return { subj: (s) => `${s}に${P("カーソルがある", "カーソルが無い")}`, alone: P("カーソルがある", "カーソルが無い") };
    case "toBeChecked": {
      const on = (v as { checked?: boolean } | undefined)?.checked !== false;
      const yes = on !== neg;
      return { subj: (s) => `${s}に${yes ? "チェックが入っている" : "チェックが入っていない"}`, alone: yes ? "チェックが入っている" : "チェックが入っていない" };
    }
    case "toBeEmpty": return { subj: (s) => `${s}が${P("空", "空でない")}`, alone: P("空", "空でない") };
    case "toHaveText": case "toContainText": {
      const inc = m === "toContainText" || (v instanceof RegExp && regexLiteral(v)?.mode === "inc");
      const shown = v instanceof RegExp ? (regexLiteral(v) ? `「${cut(regexLiteral(v)!.s, 60)}」` : valueText(v)) : Array.isArray(v) ? v.map((x) => valueText(x, 30)).join("") : vt;
      const pred = inc ? P(`${shown}を含む`, `${shown}を含まないこと`) : P(`${shown}と表示されている`, `${shown}と表示されないこと`);
      return { subj: (s) => (inc ? `${s}に${pred}` : `${s}が${pred}`), alone: inc ? `${shown}${P("を含む文字が表示されている", "を含む文字が表示されないこと")}` : pred, detail: pred, key, mech: shown === "決まった形の値" };
    }
    case "toHaveValue": return { subj: (s) => `${s}の入力値が${P(vt, `${vt}でない`)}`, alone: `入力値が${P(vt, `${vt}でない`)}`, detail: `入力値 ${vt}${P("", "でない")}`, key };
    case "toHaveValues": return { subj: (s) => `${s}で${P(`${vt}を選んでいる`, `${vt}を選んでいない`)}`, alone: P(`${vt}を選んでいる`, `${vt}を選んでいない`), detail: vt, key };
    case "toHaveCount": {
      const n = Number(v);
      if (n === 0 && !neg) return { subj: (s) => `${s}が表示されないこと`, alone: "表示されないこと", detail: "0件", key: "0件", mech: true };
      return { subj: (s) => `${s}が${P(`${n}件`, `${n}件でない`)}`, alone: `件数が${P(`${n}件`, `${n}件でない`)}`, detail: P(`${n}件`, `${n}件でない`), key: `${n}件` };
    }
    case "toHaveAttribute": {
      // 属性の名前・値は機械的なので、メッセージがあれば添えない
      const w = args.length > 1 && typeof args[1] !== "object" ? args[1] : args.length > 1 && args[1] instanceof RegExp ? args[1] : undefined;
      const d = w !== undefined ? `属性 ${String(v)} が${P(valueText(w), `${valueText(w)}でない`)}` : `属性 ${String(v)} が${P("ある", "無い")}`;
      return { subj: (s) => `${s}の${d}`, alone: d, detail: d, mech: true };
    }
    case "toHaveClass": { const d = classMeaning(v, neg); return { subj: (s) => `${s}が${d}`, alone: d, detail: d, mech: true }; }
    case "toHaveCSS": return { subj: (s) => `${s}が期待の見た目で表示されている`, alone: "期待の見た目で表示されている", detail: `${String(v)} ${valueText(args[1])}`, mech: true };
    case "toHaveURL": {
      // 末尾だけ・先頭だけを決めた形、番号の部分のある形は、その形で書く（toMatch と同じ。「…を含む」と書くと実際の URL が含んで期待どおりに読める）
      const shape = v instanceof RegExp ? regexShape(v) : undefined;
      if (shape && (shape.mode === "end" || shape.mode === "start" || shape.s.includes("〔"))) {
        const q = `「${cut(shape.s, 60)}」`;
        const d = shape.mode === "eq" ? P(`${q}の形`, `${q}の形でない`) : shape.mode === "end" ? P(`${q}で終わる`, `${q}で終わらない`)
          : shape.mode === "start" ? P(`${q}で始まる`, `${q}で始まらない`) : P(`${q}を含む`, `${q}を含まない`);
        return { subj: (s) => `${s}（URL が${d}）`, alone: `開いている画面の URL が${d}`, detail: `URL が${d}`, key: shape.s };
      }
      const inc = v instanceof RegExp && (regexLiteral(v) ?? regexReadable(v))?.mode === "inc";
      const d = vt === "決まった形の値" ? P("期待の画面の URL", "期待の画面の URL でない") : inc ? P(`${vt.replace(/を含む文字$/, "")}を含む`, `${vt.replace(/を含む文字$/, "")}を含まない`) : P(vt, `${vt}でない`);
      const subjD = inc ? `URL に${d}` : `URL が${d}`;
      return { subj: (s) => `${s}（${subjD}）`, alone: `開いている画面の ${subjD}`, detail: subjD, key, mech: vt === "決まった形の値" };
    }
    case "toHaveTitle": return { subj: (s) => `${s}（画面の題が${P(vt, `${vt}でない`)}）`, alone: `画面の題が${P(vt, `${vt}でない`)}`, detail: `題 ${vt}`, key };
    case "toBe": case "toEqual": case "toStrictEqual": {
      if (Array.isArray(v) && v.length === 0) return { subj: (s) => `${s}が${P("無いこと", "あること")}`, alone: P("無いこと", "あること"), detail: P("0件", "1件以上"), mech: true };
      const d = P(vt, `${vt}でない`);
      // 一覧（日程の番号の並び など）は文のメッセージに添えない（番号の並びはお客様が画面と結び付けられない）
      return { subj: (s) => `${s}が${sp(d)}`, alone: `値が${sp(d)}`, detail: d, key, mech: Array.isArray(v) || (!!v && typeof v === "object") };
    }
    case "toBeNull": case "toBeUndefined": return { subj: (s) => `${s}が${P("無いこと", "ある")}`, alone: P("値が無いこと", "値がある"), detail: P("値なし", "値あり"), mech: true };
    case "toBeDefined": return { subj: (s) => `${s}が${P("ある", "無いこと")}`, alone: P("値がある", "値が無いこと"), detail: P("値あり", "値なし"), mech: true };
    case "toContain": case "toContainEqual": {
      const d = P(`${vt}を含む`, `${vt}を含まないこと`);
      return { subj: (s) => `${s}に${d}`, alone: d, detail: d, key };
    }
    case "toMatch": {
      // 番号の部分などを〔番号〕にした形・「…で終わる」「…で始まる」で読める正規表現は、その形を期待として書く。
      // 以前は末尾だけを決めた形（/\/setting\/shop\/payment$/ など）を「…を含む」と書き、実際の値がそれを含むので期待どおりに読めた（2026-11-14 の IT-M10-04-041 など）
      const shape = v instanceof RegExp ? regexShape(v) : undefined;
      if (shape && (shape.mode === "end" || shape.mode === "start" || shape.s.includes("〔"))) {
        const q = `「${cut(shape.s, 60)}」`;
        const d = shape.mode === "eq" ? P(`${q}の形`, `${q}の形でない`) : shape.mode === "end" ? P(`${q}で終わる`, `${q}で終わらないこと`)
          : shape.mode === "start" ? P(`${q}で始まる`, `${q}で始まらないこと`) : P(`${q}を含む`, `${q}を含まないこと`);
        return { subj: (s) => `${s}が${d}`, alone: `値が${d}`, detail: d, key: shape.s };
      }
      const lit = v instanceof RegExp ? regexLiteral(v) ?? regexReadable(v) : typeof v === "string" ? { mode: "inc" as const, s: v } : undefined;
      if (lit) {
        const d = lit.mode === "eq" ? P(`「${cut(lit.s, 60)}」`, `「${cut(lit.s, 60)}」でない`) : P(`「${cut(lit.s, 60)}」を含む`, `「${cut(lit.s, 60)}」を含まないこと`);
        return { subj: (s) => (lit.mode === "eq" ? `${s}が${d}` : `${s}に${d}`), alone: `値が${d}`, detail: d, key: lit.s };
      }
      // 形が複雑な正規表現は、正規表現そのものは書かない。合格したとき（実際の値が期待の形に合った）だけ実際の値を見せる。
      // 不合格のときに実際の値を出すと、期待の欄に実際の値が入り、期待と実際が同じに読める（2026-11-14 の IT-M13-06-046・IT-M14-09-009）
      const matched = v instanceof RegExp && typeof ci.value === "string" && new RegExp(v.source, v.flags.replace(/[gy]/g, "")).test(ci.value);
      const shown = matched && typeof ci.value === "string" && ci.value.length <= 80 ? `「${ci.value}」` : undefined;
      const d = shown && !neg ? shown : P("決まった書式の値", "決まった書式の値ではないこと");
      return { subj: (s) => `${s}が${d}`, alone: `値が${d}`, detail: d, mech: true };
    }
    case "toHaveLength": {
      const unit = Array.isArray(ci.value) ? "件" : typeof ci.value === "string" ? "文字" : "";
      if (unit === "件" && Number(v) === 0 && !neg) return { subj: (s) => `${s}が無いこと`, alone: "無いこと", detail: "0件", key: "0件", mech: true };
      const d = P(`${String(v)}${unit}`, `${String(v)}${unit}でない`);
      return { subj: (s) => (unit ? `${s}が${sp(d)}` : `${s}の長さが${sp(d)}`), alone: unit === "件" ? `件数が${sp(d)}` : `長さが${sp(d)}`, detail: d, key: String(v) };
    }
    case "toBeGreaterThan": case "toBeGreaterThanOrEqual": {
      const n = Number(v);
      // 「0 より大きい」「1 以上」は「1件以上ある」と書く。「0 以上」は値が読めたことしか言わないので「（数を読み取れた）」
      if (!neg && ((m === "toBeGreaterThan" && n === 0) || (m === "toBeGreaterThanOrEqual" && n === 1))) return { subj: (s) => `${s}が1件以上ある`, alone: "1件以上ある", detail: "1件以上", mech: true };
      if (!neg && m === "toBeGreaterThanOrEqual" && n === 0) return { subj: (s) => `${s}がある`, alone: "値がある", detail: "0 以上", mech: true };
      return cmp(m === "toBeGreaterThan" ? P(`${vt} より大きい`, `${vt} 以下`) : P(`${vt} 以上`, `${vt} 未満`));
    }
    case "toBeLessThan": case "toBeLessThanOrEqual": {
      // 応答の状態（HTTP のステータス）の 400 未満は「エラーでない（正常に表示できた）」と書く
      if (!neg && Number(v) === (m === "toBeLessThan" ? 400 : 399) && /応答|ステータス|status/i.test(ci.message ?? "")) {
        const got = typeof ci.value === "number" ? `（応答の状態 ${ci.value}）` : "";
        return { subj: (s) => `${s.replace(/の?(応答の状態|応答|ステータス)$/, "") || "画面の応答"}が正常に返った（エラーでない）${got}`, alone: `正常に返った（エラーでない）${got}`, detail: `エラーでない${got}`, mech: true };
      }
      return cmp(m === "toBeLessThan" ? P(`${vt} 未満`, `${vt} 以上`) : P(`${vt} 以下`, `${vt} より大きい`));
    }
    case "toBeCloseTo": return cmp(P(`およそ ${vt}`, `${vt} から離れている`));
    case "toThrow": return { subj: (s) => `${s}で${P("例外になる", "例外にならない")}`, alone: P("例外になる", "例外にならない") };
    case "toPass": return { subj: (s) => s, alone: "確かめが通る" };
    default: return undefined;
  }
  function cmp(d: string): Phrase {
    return { subj: (s) => `${s}が${sp(d)}`, alone: `値が${sp(d)}`, detail: d };
  }
}

/** 「〜の数」の名詞と数の照合なら、「〜が2件」「〜が無いこと」「〜が1件以上ある」の形の文（数の名詞でなければ undefined） */
function countPhrase(ci: CheckInfo, core: string): string | undefined {
  const base = countBase(core);
  if (!base || ci.negated) return undefined;
  const n = Number(ci.args[0]);
  if (!Number.isFinite(n) || typeof ci.args[0] !== "number") return undefined;
  switch (ci.matcher) {
    case "toBe": case "toEqual": case "toStrictEqual": case "toHaveLength": return n === 0 ? `${base}が無いこと` : `${base}が${n}件`;
    case "toBeGreaterThan": return n === 0 ? `${base}が1件以上ある` : `${base}が${n}件より多い`;
    case "toBeGreaterThanOrEqual": return n <= 1 ? (n === 1 ? `${base}が1件以上ある` : undefined) : `${base}が${n}件以上`;
    case "toBeLessThanOrEqual": return `${base}が${n}件以下`;
    default: return undefined;
  }
}

/** 真偽の確かめ（toBe(true) / toBeTruthy など）か。そうなら期待する真偽を返す */
function wantBool(ci: CheckInfo): boolean | undefined {
  let w: boolean | undefined;
  if ((ci.matcher === "toBe" || ci.matcher === "toEqual" || ci.matcher === "toStrictEqual") && typeof ci.args[0] === "boolean") w = ci.args[0] as boolean;
  if (ci.matcher === "toBeTruthy") w = true;
  if (ci.matcher === "toBeFalsy") w = false;
  return w === undefined ? undefined : ci.negated ? !w : w;
}

/** 期待結果の文（「期待結果：」は付けない） */
export function expectationText(ci: CheckInfo, fallback: string): { text: string; boolForm?: "stmt" | "not" | "noun"; generic?: (s: string) => string } {
  // 「（押せずに変わらなかったのではない）」のような二重否定の注記は、読みにくいので落とす
  const msg = ci.message?.replace(/[。．\s]+$/, "").replace(/（[^（）]*のではない）|\([^()]*のではない\)/g, "").trim() || undefined;
  const wb = wantBool(ci);
  if (wb !== undefined) {
    if (!msg) return { text: wb ? "条件を満たしている" : "条件を満たさないこと" };
    const { core, tail } = splitTail(msg);
    // 「（閉じて表示されなくなるはず）」のような、期待の説明のかっこ書きは、否定の文に直したら落とす（逆の意味に読めるので）
    const keepTail = /はず/.test(tail) ? "" : tail;
    const stmt = isStatement(msg);
    // 名詞のメッセージ（「依頼済み状態」）は「〜であること」の肯定の文にする（「：はい」「：いいえ」と書かない）
    if (wb) return stmt ? { text: withKoto(msg), boolForm: "stmt" } : { text: `${core}であること${keepTail}`, boolForm: "noun" };
    if (NEGATIVE_END.test(core)) return { text: withKoto(msg), boolForm: "stmt" };
    if (stmt) {
      const neg = negateStatement(core);
      if (neg) return { text: `${neg}${keepTail}`, boolForm: "stmt" };
    }
    if (NEGATIVE_HINT.test(tail)) return { text: msg, boolForm: "stmt" };
    return stmt ? { text: `次のとおりではないこと：${msg}`, boolForm: "not" } : { text: `${core}ではないこと${keepTail}`, boolForm: "noun" };
  }
  const ph = phraseOf(ci);
  // 照合の種類が分からないときは、メッセージだけ（照合の名前・引数の書き方は出さない）
  if (!ph) return { text: msg ?? fallback };
  if (!msg) {
    const sub = ci.locatorDesc ? subjectOfLocator(ci.locatorDesc) : undefined;
    if (sub?.text !== undefined && ci.matcher === "toBeVisible" && !ci.negated) return { text: `「${cut(sub.text, 60)}」と表示されている` };
    if (sub) return { text: ph.subj(sub.subject) };
    // 要素の呼び名が分からない（CSS のセレクタ など）: 撮るときに要素の文字で主語を補う（lib/annotate.ts）
    return { text: ph.alone, generic: ci.locatorDesc ? ph.subj : undefined };
  }
  if (isStatement(msg)) {
    // 「〜ないこと」の文に 0 を添えると「（0）」の機械的な書き方になるので添えない
    const negZero = NEGATIVE_END.test(splitTail(msg).core) && (Number(ci.args[0]) === 0 || ci.value === 0);
    if (!ph.detail || ph.mech || negZero || (ph.key && msg.includes(ph.key))) return { text: withKoto(msg) };
    return { text: `${msg}（${ph.detail}）` };
  }
  const { core, tail } = splitTail(msg);
  // かっこ書きが期待値そのもの（「会員ポイント（1050）」）や、0件の確かめの「（表示されない）」なら、文と重なるので落とす
  const zero = Number(ci.args[0]) === 0 || (Array.isArray(ci.args[0]) && !(ci.args[0] as unknown[]).length);
  const dropTail = !tail || (ph.key !== undefined && tail === `（${ph.key}）`) || (zero && NEGATIVE_HINT.test(tail));
  const tl = dropTail ? "" : tail;
  const cnt = ci.isValue ? countPhrase(ci, core) : undefined;
  if (cnt) return { text: `${ci.screen ? cnt.replace(/が無いこと$/, "が表示されないこと") : cnt}${tl}` };
  // 「検索店舗が試験本店」「国の初期値が Japan」のように、メッセージが「〜が〜」と期待を言い切っている（文末が名詞）: 「が」を重ねない
  const scalarEq = ["toBe", "toEqual", "toStrictEqual", "toHaveValue", "toHaveValues", "toHaveText"].includes(ci.matcher) && (typeof ci.args[0] !== "object" || ci.args[0] instanceof RegExp);
  if (scalarEq && /[^\s「]が[^\s]/.test(core.replace(/「[^」]*」/g, "「」"))) {
    const showDetail = ph.detail && !ph.mech && !(ph.key && core.includes(ph.key)) && !ci.matcher.startsWith("toHaveValue");
    return { text: `${core}${showDetail ? `（${ph.detail}）` : ""}${tl}` };
  }
  return { text: `${ph.subj(core)}${tl}` };
}

/** 不合格のときの実行結果の文 */
export function actualText(ci: CheckInfo, observed: string, boolForm?: "stmt" | "not" | "noun"): string {
  let s = observed.replace(/（繰り返し確かめた）$/, "").trim();
  if (boolForm && typeof ci.value === "boolean") {
    if (boolForm === "noun") return ci.value ? "そうなっていた" : "そうなっていなかった";
    return boolForm === "not" ? "そうなっている" : "そうなっていない";
  }
  s = s
    .replace(/^文字「(.*)」$/s, "「$1」と表示されている")
    .replace(/^(\d+件。1件目は)文字「(.*)」$/s, "$1「$2」と表示されている")
    .replace(/^0件（画面に無い）$/, "画面に無い（0件）")
    .replace(/^入力値「(.*)」$/s, "入力値が「$1」")
    .replace(/^URL (\S+)$/, "開いている画面の URL が「$1」");
  // パーセント符号のままの URL は読める文字に戻す
  return cut(decodePct(s), 160);
}

// ---------------------------------------------------------------------------------------------
// 画面の要素でない確かめの、値の出どころ（spec の書き方から判定する）
// ---------------------------------------------------------------------------------------------

export type Origin = "DB" | "メール" | "URL" | "画面の題" | "Cookie" | "HTTP の応答" | "新しいタブ" | "ダウンロードしたファイル" | "受け渡し領域（dataLayer）";

type FileInfo = {
  text: string; lines: number[]; dbIds: Set<string>; mailIds: Set<string>; exportsDb: Set<string>; exportsMail: Set<string>;
  /** 最上位の宣言（関数・定数）の名前と本文 */
  chunks: Map<string, string>;
  /** 取り込んだ名前 → 取り込み元のファイルと元の名前 */
  imports: Map<string, { file: string; orig: string }>;
};
const files = new Map<string, FileInfo | null>();
const ID = "[\\p{L}\\p{N}_$]";
const wordRe = (w: string) => new RegExp(`(?<!${ID})${w.replace(/[$]/g, "\\$")}(?!${ID})`, "u");

function resolveImport(from: string, spec: string): string | undefined {
  if (!spec.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(from), spec);
  for (const f of [`${base}.ts`, path.join(base, "index.ts"), base]) if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  return undefined;
}

/** ファイルの中で、DB・メールを読む名前（取り込んだ関数と、それを使う関数・定数） */
function infoOf(file: string, depth = 0): FileInfo | null {
  if (files.has(file)) return files.get(file)!;
  files.set(file, null); // 循環の取り込みで止まらないように
  let text: string;
  try { text = fs.readFileSync(file, "utf8"); } catch { return null; }
  const lines = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") lines.push(i + 1);
  const dbIds = new Set<string>(), mailIds = new Set<string>();
  const imports = new Map<string, { file: string; orig: string }>();
  const isDbFile = (f: string) => /[\\/]db[\\/][^\\/]+\.ts$/.test(f) || /[\\/]lib[\\/](db|db_write|pg_conn)\.ts$/.test(f);
  const isMailFile = (f: string) => /[\\/]lib[\\/]mail\.ts$/.test(f);
  for (const m of text.matchAll(/import\s+(?:type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g)) {
    const target = resolveImport(file, m[2]);
    if (!target) continue;
    const names: [string, string][] = []; // [取り込み先での名前, 元の名前]
    const clause = m[1];
    const ns = clause.match(/\*\s+as\s+([\p{L}\p{N}_$]+)/u);
    if (ns) names.push([ns[1], "*"]);
    const def = clause.match(/^([\p{L}\p{N}_$]+)\s*(,|$)/u);
    if (def) names.push([def[1], "default"]);
    const named = clause.match(/\{([\s\S]*)\}/);
    if (named) for (const part of named[1].split(",")) {
      const p = part.trim().replace(/^type\s+/, "");
      if (!p) continue;
      const [orig, local] = p.split(/\s+as\s+/).map((x) => x.trim());
      names.push([local ?? orig, orig]);
    }
    for (const [local, orig] of names) imports.set(local, { file: target, orig });
    if (isDbFile(target)) { names.forEach(([n]) => dbIds.add(n)); continue; }
    if (isMailFile(target)) { names.forEach(([n]) => mailIds.add(n)); continue; }
    if (depth > 3 || /node_modules/.test(target)) continue;
    const sub = infoOf(target, depth + 1);
    if (!sub) continue;
    for (const [local, orig] of names) {
      if (orig === "*") { if (sub.exportsDb.size) dbIds.add(local); if (sub.exportsMail.size) mailIds.add(local); continue; }
      if (sub.exportsDb.has(orig)) dbIds.add(local);
      if (sub.exportsMail.has(orig)) mailIds.add(local);
    }
  }
  // 最上位の宣言のまとまり（関数・定数）ごとに、DB・メールを読む名前を使っていれば、その宣言の名前も読む側に入れる
  const declRe = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?\s+([\p{L}\p{N}_$]+)|(?:const|let|var)\s+([\p{L}\p{N}_$]+))/gmu;
  const decls: { name: string; start: number }[] = [];
  for (const m of text.matchAll(declRe)) decls.push({ name: m[1] ?? m[2], start: m.index! });
  // 宣言の本文は、次の最上位の文（行の頭から書いた文。caseTest(…) なども）の手前まで。宣言の後ろの caseTest を本文に含めない
  const tops = Array.from(text.matchAll(/^[^\s})\]]/gm), (m) => m.index!);
  const chunks = decls.map((d) => ({ name: d.name, body: text.slice(d.start, tops.find((t) => t > d.start) ?? text.length) }));
  const uses = (body: string, ids: Set<string>, extra?: RegExp) => (extra?.test(body) ?? false) || [...ids].some((n) => wordRe(n).test(body));
  for (let changed = true; changed;) {
    changed = false;
    for (const c of chunks) {
      if (!dbIds.has(c.name) && uses(c.body, dbIds, /(?<![\p{L}\p{N}_$])db\.(query|count)\(/u)) { dbIds.add(c.name); changed = true; }
      if (!mailIds.has(c.name) && uses(c.body, mailIds)) { mailIds.add(c.name); changed = true; }
    }
  }
  const exported = new Set<string>();
  for (const m of text.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?\s+|(?:const|let|var)\s+)([\p{L}\p{N}_$]+)/gmu)) exported.add(m[1]);
  const fi: FileInfo = {
    text, lines, dbIds, mailIds, imports,
    chunks: new Map(chunks.map((c) => [c.name, c.body])),
    exportsDb: isDbFile(file) ? exported : new Set([...exported].filter((n) => dbIds.has(n))),
    exportsMail: isMailFile(file) ? exported : new Set([...exported].filter((n) => mailIds.has(n))),
  };
  files.set(file, fi);
  return fi;
}

/** 呼び出しの位置（spec のファイル・行・桁）を、スタックから拾う。lib の中の確かめ（画面の部品）は対象外 */
export function callSite(stack: string | undefined): { file: string; line: number; col: number } | undefined {
  for (const l of (stack ?? "").split("\n").slice(1)) {
    const m = l.match(/\(?((?:\/|[A-Za-z]:\\)[^():]+\.ts):(\d+):(\d+)\)?\s*$/);
    if (!m) continue;
    if (/node_modules|[\\/]lib[\\/](annotate|annotate_text|annotate_draw|evidence_expect)\.ts$/.test(m[1])) continue;
    return { file: m[1], line: Number(m[2]), col: Number(m[3]) };
  }
  return undefined;
}

/** 呼び出しの位置の手前にある expect(…) の第1引数の文字と、その位置 */
function firstArgAt(fi: FileInfo, line: number, col: number): { arg: string; at: number } | undefined {
  const pos = (fi.lines[line - 1] ?? 0) + col - 1;
  const before = fi.text.slice(Math.max(0, pos - 3000), pos + 1);
  const re = /(?<![\p{L}\p{N}_$.])expect(?:\.soft|\.poll)?\s*\(/gu;
  let m: RegExpExecArray | null, last: RegExpExecArray | null = null;
  while ((m = re.exec(before))) last = m;
  if (!last) return undefined;
  const start = pos - before.length + 1 + last.index + last[0].length;
  let depth = 0, i = start, quote = "";
  for (; i < fi.text.length && i < start + 2000; i++) {
    const ch = fi.text[i];
    if (quote) { if (ch === "\\") { i++; continue; } if (ch === quote) quote = ""; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) { if (depth === 0) break; depth--; }
    else if (ch === "," && depth === 0) break;
  }
  return { arg: fi.text.slice(start, i), at: start };
}

const READ_CALL_RE = /\.(inputValue|textContent|innerText|innerHTML|getAttribute|isVisible|isHidden|isChecked|isEnabled|isDisabled|isEditable|count|allInnerTexts|allTextContents|evaluateAll|evaluate|waitForSelector)\s*\(/g;

const ORIGIN_PATTERNS: [Origin, RegExp][] = [
  // 受け渡し領域（dataLayer）の確かめ。注記に画面のアドレスを書く関数を通るため、URL の確かめと取り違えないよう先に見る（2026-11-16 F10 の帯の「URL で確認」）
  ["受け渡し領域（dataLayer）", /dataLayer|受け渡し領域/],
  ["Cookie", /cookies?\s*\(|[Cc]ookie/],
  ["HTTP の応答", /\.status\(\)|\.headers\(\)|allHeaders\(|\.ok\(\)|[Rr]esponse|waitForResponse|request\.(get|post|fetch)|\bfetch\(|\.statusText\(\)/],
  ["ダウンロードしたファイル", /[Dd]ownload|suggestedFilename|ダウンロード/],
  ["新しいタブ", /popup|newPage\(|waitForEvent\(\s*["']page|新しいタブ|別タブ/],
  ["URL", /\.url\(\)|location\.(href|pathname|search)|pathname|searchParams/],
  ["画面の題", /\.title\(\)/],
];

/**
 * 確かめの式の第1引数より後ろ（メッセージ・照合の値）の文字の部分のどれかが、照合したときのメッセージに含まれるか。
 * 文字の部分が無い（メッセージを変数で渡した など）ときは確かめられないので true。
 */
function messageAtSite(rest: string, message: string): boolean {
  const stmt = rest.split(/;\s*(?:\n|$)/)[0];
  const lits = Array.from(stmt.matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g), (m) => m[2]);
  const pieces = lits.flatMap((l) => l.split(/\$\{[^}]*\}/)).map((x) => x.trim()).filter((x) => x.length >= 2);
  if (!pieces.length) return true;
  return pieces.some((x) => message.includes(x));
}

/**
 * 配列・オブジェクトの展開（`[...r.カラー].sort()` の `...`）を空白にする。
 * 展開の点が名前の手前の「.」と読まれ、展開した中の変数（DB を読んだ値など）を出どころの手がかりに拾えなかった。
 * `Array.from(…)`・`.slice()`・`.map()`・`.sort()`・`.join()` で包んだ式は、もともと中の名前を拾えている。
 */
export function unspread(s: string): string {
  return s.replace(/\.\.\.(?=\s*[\p{L}_$\[({])/gu, "   ");
}

/** 値の出どころ。DB・メールは、読む関数の名前（照会の要約に使う）も返す */
export function originOf(stack: string | undefined, message?: string): { origin?: Origin; fn?: string; expr?: string; readCalls?: string[]; sites?: { file: string; from: number; to: number }[] } {
  const site = callSite(stack);
  if (!site) return {};
  const fi = infoOf(site.file);
  if (!fi) return {};
  const fa = firstArgAt(fi, site.line, site.col);
  if (!fa) return {};
  // 見つけた確かめの式が、実際に照合した確かめ（メッセージ）と別の式なら、出どころを決めない。
  // 流している間に spec のファイルが書き換わって行がずれると、別の確かめの式（メールを読む式など）を拾い、
  // 画面で確かめた値に「メールで確認」と誤って書いていた（2026-11-14 の IT-F03-07-044）
  if (message !== undefined && !messageAtSite(fi.text.slice(fa.at + fa.arg.length, fa.at + fa.arg.length + 600), message)) return {};
  // 宣言の手前（同じ最上位のまとまりの中）にある、ローカルの変数の右辺
  const scopeStart = (() => {
    const head = fi.text.slice(0, fa.at);
    const m = [...head.matchAll(/^(?:export\s+)?(?:async\s+)?(?:function|const|let|var|caseTest|test|for)\b/gm)].pop();
    return m?.index ?? 0;
  })();
  const scope = fi.text.slice(scopeStart, fa.at);
  /** 名前（「m.買取」のような、変数の項目も）に最後に入れた右辺と、その位置（ファイルの中の文字の位置） */
  const rhsOf = (name: string): { text: string; at: number } | undefined => {
    const n = name.replace(/[.$]/g, (c) => `\\${c}`);
    const re = new RegExp(`(?:(?:const|let|var)\\s+(?:\\{[^}]*(?<!${ID})${n}(?!${ID})[^}]*\\}|\\[[^\\]]*(?<!${ID})${n}(?!${ID})[^\\]]*\\]|${n})|(?<![\\p{L}\\p{N}_$.])${n})\\s*(?::[^=;]{1,80})?=(?!=)([^;]{1,600})`, "gu");
    let m: RegExpExecArray | null, last: { text: string; at: number } | undefined;
    while ((m = re.exec(scope))) last = { text: m[1], at: scopeStart + m.index + m[0].length - m[1].length };
    return last;
  };
  const lineAt = (pos: number) => { let lo = 0, hi = fi.lines.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (fi.lines[mid] <= pos) lo = mid; else hi = mid - 1; } return lo + 1; };
  /** 確かめの式と、値を作った右辺の行（読んだ要素を、実行の記録の呼び出し元の行で絞るため） */
  const sites: { file: string; from: number; to: number }[] = [{ file: site.file, from: lineAt(fa.at), to: lineAt(fa.at + fa.arg.length) }];
  const texts: string[] = [fa.arg];
  const seen = new Set<string>();
  const queue = [fa.arg];
  for (let d = 0; d < 3 && queue.length; d++) {
    const next: string[] = [];
    for (const t of queue) {
      for (const tok of new Set(unspread(t.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "")).match(/(?<![\p{L}\p{N}_$.])[\p{L}_$][\p{L}\p{N}_$]*(?:\??\.[\p{L}_$][\p{L}\p{N}_$]*)*/gu) ?? [])) {
        // 「m.買取」は、まず「m.買取 = …」を探し、無ければ「m」の右辺（オブジェクトなら「買取: …」の値を先に）を見る
        const parts = tok.replace(/\?\./g, ".").split(".");
        for (let k = parts.length; k >= 1; k--) {
          const name = parts.slice(0, k).join(".");
          if (seen.has(name)) break;
          seen.add(name);
          const r = rhsOf(name);
          if (!r) continue;
          if (k < parts.length) {
            const prop = parts[k];
            const pm = r.text.match(new RegExp(`(?<![\\p{L}\\p{N}_$])${prop.replace(/\$/g, "\\$")}\\s*:\\s*([^,}]{1,300})`, "u"));
            if (pm) {
              texts.push(pm[1]); next.push(pm[1]); const at = r.at + (pm.index ?? 0); sites.push({ file: site.file, from: lineAt(at), to: lineAt(at + pm[0].length) });
              // 値を作った項目が分かったら、オブジェクト全体（ほかの項目の DB の照会など）は出どころの手がかりにしない。
              // URL の確かめに「DB で確認」と書いていた（2026-11-14 の IT-F03-07-025・026: 同じオブジェクトの別の項目が DB の件数）
              break;
            }
          }
          texts.push(r.text); next.push(r.text);
          sites.push({ file: site.file, from: lineAt(r.at), to: lineAt(r.at + r.text.length) });
          break;
        }
      }
    }
    queue.splice(0, queue.length, ...next);
  }
  const all = texts.join("\n");
  const callee = (ids: Set<string>) => {
    for (const t of texts) {
      for (const m of t.matchAll(/(?<![\p{L}\p{N}_$])([\p{L}_$][\p{L}\p{N}_$]*)(?:\.([\p{L}_$][\p{L}\p{N}_$]*))?\s*\(/gu)) {
        if (ids.has(m[1])) return m[2] && /^[\p{L}_$]/u.test(m[2]) && !["query", "count"].includes(m[2]) ? m[2] : m[1];
      }
    }
    return undefined;
  };
  if ([...fi.dbIds].some((n) => wordRe(n).test(all)) || /(?<![\p{L}\p{N}_$])db\.(query|count)\(/u.test(all)) {
    const fn = callee(fi.dbIds);
    return { origin: "DB", fn: fn && !/^(db|dbm|query|count)$/.test(fn) ? fn : undefined, expr: fa.arg };
  }
  if ([...fi.mailIds].some((n) => wordRe(n).test(all))) return { origin: "メール", fn: callee(fi.mailIds), expr: fa.arg };
  for (const [o, re] of ORIGIN_PATTERNS) if (re.test(all)) return { origin: o, expr: fa.arg };
  // 画面の要素を読む操作（locator.inputValue() など）で作った値か。読んだ要素は lib/annotate.ts が実行の記録から引く。
  // 呼んでいる関数（同じファイルの関数・取り込んだ画面の部品の関数）の本文も1段だけ見る
  const bodies = [all];
  for (const m of unspread(all).matchAll(/(?<![\p{L}\p{N}_$.])([\p{L}_$][\p{L}\p{N}_$]*)\s*\(/gu)) {
    const name = m[1];
    const local = fi.chunks.get(name);
    if (local) { bodies.push(local); continue; }
    const imp = fi.imports.get(name);
    if (imp) { const sub = infoOf(imp.file); const b = sub?.chunks.get(imp.orig); if (b) bodies.push(b); }
  }
  const readCalls = [...new Set(bodies.flatMap((b) => Array.from(b.matchAll(READ_CALL_RE), (m) => m[1])))];
  // 呼んでいる関数（pathOf など）の中で画面のアドレスを読んでいるときは、アドレスの確かめ
  if (!readCalls.length && bodies.slice(1).some((b) => /\.url\(\)|location\.(href|pathname)/.test(b))) return { origin: "URL", expr: fa.arg, readCalls, sites };
  return { expr: fa.arg, readCalls, sites };
}
