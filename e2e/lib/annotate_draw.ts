/**
 * エビデンスの画像に印を描く処理のうち、ブラウザの中で動かす関数（lib/annotate.ts から使う）。
 *
 * ここの関数は Playwright の evaluate でブラウザへ送るので、外の変数・関数を使わない（引数だけで完結させる）。
 *
 *   prepareInPage / restoreInPage   撮る直前に画面を整え（デバッグの表示を隠す、全体を撮るときは固定の表示を外し、
 *                                   見えていない部品が撮影中に写り込まないようにする）、撮ったら元に戻す。ケースの画面で動く。
 *   scrollInPage                    見えている範囲を撮るときに、確かめた要素が写る位置まで画面を動かす（restoreInPage で戻す）
 *   rectsOfElements                 確かめた要素の位置（画面の座標。iframe の中なら外の画面の座標に直す）
 *   findByValue                     画面の要素でない確かめの値を、画面の中でただ1つの要素として探す
 *   renderComposite                 撮った画像に、赤い枠・赤い文字・上の帯を重ねる。別の作業用の画面で動く（ケースの画面には描かない）
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type PrepareOpts = {
  /** 全体を撮る（fullPage）。固定の表示を外し、見えていない表示を撮影中も見えないままにする */
  full: boolean;
  /** 隠すもの（デバッグの表示）。セレクタだけで決まるもの */
  debugSelectors: string[];
  /** 隠すもの（デバッグの表示）。同じ作りの部品と見分けるため、文言で決めるもの */
  debugTexts: { selector: string; text: string }[];
  /** 撮る間だけ当てる CSS（検索パネルの写り込みを止める など） */
  css: string;
  /** サーバーの内部の情報（例外の画面・サーバーのパス）の目印。隠しても見えていれば、撮らない */
  leakPatterns: string[];
  /** ツールバーより後ろに足された、例外の画面の目印（ツールバーより後ろにあるときだけ隠す） */
  afterToolbarTexts: string[];
};

export type PrepareResult = {
  sx: number; sy: number; dpr: number; vw: number; vh: number;
  /** 文書の幅・高さ（撮る範囲を決めるため） */
  docW: number; docH: number;
  /** 画面を覆う大きな固定の表示（開いたダイアログ・モーダル）があるので、全体でなく見えている範囲を撮る */
  forceViewport: boolean;
  /** 隠したもの（エビデンスの注記用） */
  hidden: string[];
  /** 隠しても見えている、サーバーの内部の情報（あれば撮らない） */
  leak?: string;
};

/**
 * 撮る直前に画面を整える。元に戻すための控えは window に置き、restoreInPage で戻す。
 *
 * 全体を撮る（Chromium の captureBeyondViewport）と、撮る間だけ画面の幅の条件（@media）が一度外れてまた当たる。
 * そのとき、見えないように opacity・visibility を transition で切り替えている部品（フロントの詳細検索のパネル など）が、
 * 一瞬見える状態から消えていく途中で写る。撮る直前に見えていない部品は、撮る間 transition を止めて見えないままにする。
 */
export function prepareInPage(o: PrepareOpts): PrepareResult {
  type Saved = { el: HTMLElement; css: string | null };
  const w = window as unknown as { __e2eShot?: { style?: HTMLStyleElement; saved: Saved[] } };
  // Chromium は element.style で変えた style 属性を遅れて書き戻すので、読んで書き戻しを済ませてから消す（そうしないと style="" が残る）
  const back = (x: Saved) => { x.el.getAttribute("style"); if (x.css === null) x.el.removeAttribute("style"); else x.el.setAttribute("style", x.css); };
  if (w.__e2eShot) {
    // 前の撮影の戻し忘れ（例外など）があれば、先に戻す
    for (const x of w.__e2eShot.saved.reverse()) back(x);
    for (const sh of (w.__e2eShot as { sheets?: CSSStyleSheet[] }).sheets ?? []) sh.disabled = false;
    w.__e2eShot.style?.remove();
    const sc = (w.__e2eShot as { scroll?: { x: number; y: number } }).scroll;
    if (sc) window.scrollTo({ left: sc.x, top: sc.y, behavior: "instant" as ScrollBehavior });
  }
  const st: { style?: HTMLStyleElement; saved: Saved[] } = { saved: [] };
  w.__e2eShot = st;
  const save = (el: HTMLElement) => { if (!st.saved.some((x) => x.el === el)) st.saved.push({ el, css: el.getAttribute("style") }); };
  const hidden: string[] = [];
  const visible = (e: Element) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.01;
  };
  const valid = o.debugSelectors.filter((s) => { try { document.querySelector(s); return true; } catch { return false; } });
  if (valid.some((sel) => Array.from(document.querySelectorAll(sel)).some(visible))) hidden.push("デバッグの表示");
  for (const t of o.debugTexts) {
    let els: HTMLElement[] = [];
    try { els = Array.from(document.querySelectorAll<HTMLElement>(t.selector)); } catch { continue; }
    for (const el of els) {
      if (!(el.textContent ?? "").includes(t.text) || !visible(el)) continue;
      save(el);
      el.style.setProperty("display", "none", "important");
      hidden.push("デバッグの表示");
    }
  }
  // 開発環境のサーバーが、応答を送ったあとの処理（プロファイラの記録）で落ちると、例外の画面（システムエラーの画面と、
  // サーバーのパス・ソースを含む Symfony の例外の画面）を HTML の後ろに書き足す。ブラウザはそれを body の末尾（ツールバーの後ろ）に置く。
  // ツールバーより後ろにある、その目印を含む body の直下の要素を隠し、書き足された style も止める。
  const toolbar = document.querySelector("[id^='sfwdt'], .sf-toolbar");
  const after = (e: Node) => !!toolbar && !!(toolbar.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) && !toolbar.contains(e);
  if (toolbar && document.body) {
    for (const child of Array.from(document.body.children) as HTMLElement[]) {
      if (!after(child)) continue;
      const t = child.textContent ?? "";
      if (child.tagName === "STYLE" || (child.tagName === "LINK" && (child as HTMLLinkElement).rel === "stylesheet")) {
        if (/exception|sf-|trace/i.test(t) || child.tagName === "LINK") {
          const sh = (child as HTMLStyleElement).sheet;
          if (sh && !sh.disabled) { sh.disabled = true; (st as { sheets?: CSSStyleSheet[] }).sheets = [...((st as { sheets?: CSSStyleSheet[] }).sheets ?? []), sh]; }
        }
        continue;
      }
      if ([...o.leakPatterns, ...o.afterToolbarTexts].some((x) => t.includes(x)) && visible(child)) {
        save(child);
        child.style.setProperty("display", "none", "important");
        hidden.push("デバッグの表示");
      }
    }
  }
  const style = document.createElement("style");
  style.setAttribute("data-e2e-evidence", "1");
  style.textContent = `${valid.length ? `${valid.join(",\n")} { display: none !important; }\n` : ""}${o.css}`;
  (document.head ?? document.documentElement).appendChild(style);
  st.style = style;
  const vw = innerWidth, vh = innerHeight;
  let forceViewport = false;
  if (o.full) {
    const fixed: { el: HTMLElement; r: DOMRect; sticky: boolean }[] = [];
    for (const el of Array.from(document.body?.querySelectorAll<HTMLElement>("*") ?? [])) {
      const cs = getComputedStyle(el);
      // 見えていない部品は、撮る間も見えないままにする（上の説明）
      // display:none の部品（閉じているモーダルなど）は、もともと写らないので触らない。触ると、戻しが間に合わないときに
      // 開いたあとも隠れたままになる（2026-11-13 M04-22 の CSV 登録モーダルが「表示されない」と誤って不合格になった）
      if (cs.display !== "none" && cs.transitionDuration.split(",").some((d) => parseFloat(d) > 0) && (cs.visibility === "hidden" || Number(cs.opacity) <= 0.01)) {
        save(el);
        el.style.setProperty("transition", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        continue;
      }
      if (cs.position !== "fixed" && cs.position !== "sticky") continue;
      if (!visible(el)) continue;
      // 固定の表示の中の固定の表示は、外側を動かせば付いてくる
      let inner = false;
      for (let a = el.parentElement; a; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === "fixed" || p === "sticky") { inner = true; break; } }
      if (inner) continue;
      const r = el.getBoundingClientRect();
      if (cs.position === "fixed" && r.width * r.height > vw * vh * 0.5 && Number(cs.opacity) > 0.05) { forceViewport = true; continue; }
      fixed.push({ el, r, sticky: cs.position === "sticky" });
    }
    if (!forceViewport) {
      const docH = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
      for (const f of fixed) {
        save(f.el);
        if (f.sticky) { f.el.style.setProperty("position", "static", "important"); continue; }
        // 上に付く表示はページの頭に、下に付く表示はページの終わりに置く（途中に貼り付いて値を隠さない）
        const atBottom = f.r.top > vh / 2;
        const wantTop = atBottom ? docH - (vh - f.r.top) : f.r.top;
        const wantLeft = f.r.left + scrollX;
        const s = f.el.style;
        s.setProperty("position", "absolute", "important");
        s.setProperty("top", "0px", "important");
        s.setProperty("left", "0px", "important");
        s.setProperty("right", "auto", "important");
        s.setProperty("bottom", "auto", "important");
        s.setProperty("box-sizing", "border-box", "important");
        s.setProperty("width", `${f.r.width}px`, "important");
        s.setProperty("height", `${f.r.height}px`, "important");
        s.setProperty("margin", "0", "important");
        s.setProperty("transform", "none", "important");
        s.setProperty("transition", "none", "important");
        const r0 = f.el.getBoundingClientRect();
        s.setProperty("top", `${wantTop - (r0.top + scrollY)}px`, "important");
        s.setProperty("left", `${wantLeft - (r0.left + scrollX)}px`, "important");
      }
    }
  }
  // 隠したあとも、サーバーの内部の情報が見えていないか（見えていれば撮らない）
  let leak: string | undefined;
  const walker = document.createTreeWalker(document.body ?? document.documentElement, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n && !leak; n = walker.nextNode()) {
    const t = n.nodeValue ?? "";
    const hitp = o.leakPatterns.find((x) => t.includes(x));
    if (hitp && n.parentElement && visible(n.parentElement)) leak = hitp;
  }
  const docW = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0);
  const docH = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
  return { sx: scrollX, sy: scrollY, dpr: devicePixelRatio || 1, vw, vh, docW, docH, forceViewport, hidden: [...new Set(hidden)], leak };
}

/**
 * 見えている範囲を撮るときに、確かめた要素が画面の外にあれば、画面を動かす（prepareInPage のあとに呼ぶ）。
 * 元の位置は控えて、restoreInPage で戻す。なめらかに動かす指定（scroll-behavior: smooth）があっても、すぐに動かす。
 */
export function scrollInPage(o: { x: number; y: number }): { sx: number; sy: number } {
  const w = window as unknown as { __e2eShot?: { scroll?: { x: number; y: number } } };
  if (w.__e2eShot && !w.__e2eShot.scroll) w.__e2eShot.scroll = { x: scrollX, y: scrollY };
  window.scrollTo({ left: o.x, top: o.y, behavior: "instant" as ScrollBehavior });
  return { sx: scrollX, sy: scrollY };
}

export function restoreInPage(): void {
  const w = window as unknown as { __e2eShot?: { style?: HTMLStyleElement; saved: { el: HTMLElement; css: string | null }[]; sheets?: CSSStyleSheet[]; scroll?: { x: number; y: number } } };
  const st = w.__e2eShot;
  if (!st) return;
  for (const sh of st.sheets ?? []) sh.disabled = false;
  // style 属性は、撮る前の文字のまま戻す（無かったものは消す）
  // Chromium は element.style で変えた style 属性を遅れて書き戻すので、読んで書き戻しを済ませてから消す（そうしないと style="" が残る）
  for (const x of st.saved.reverse()) { x.el.getAttribute("style"); if (x.css === null) x.el.removeAttribute("style"); else x.el.setAttribute("style", x.css); }
  st.style?.remove();
  // 確かめた要素を写すために動かした画面の位置を戻す（scrollInPage）
  if (st.scroll) window.scrollTo({ left: st.scroll.x, top: st.scroll.y, behavior: "instant" as ScrollBehavior });
  delete w.__e2eShot;
}

/** 画面の「読込中」の表示・読み込み途中の画像が無いか（撮る前に待つ） */
export function settledInPage(o: { loading: string[]; ignore: string[] }): boolean {
  const ignored = (e: Element) => o.ignore.some((sel) => { try { return !!e.closest(sel); } catch { return false; } });
  const vis = (e: Element) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.01 && !ignored(e); };
  for (const sel of o.loading) { try { if (Array.from(document.querySelectorAll(sel)).some(vis)) return false; } catch { /* 飛ばす */ } }
  const walker = document.createTreeWalker(document.body ?? document.documentElement, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.nodeValue ?? "").trim();
    if (t.length > 12 || !/^(読込中|読み込み中|ロード中|Loading)[.…・]*$/i.test(t)) continue;
    const el = n.parentElement;
    if (el && !el.closest("[data-e2e-evidence]") && vis(el)) return false;
  }
  for (const img of Array.from(document.images)) {
    if (!img.complete && img.loading !== "lazy" && vis(img)) {
      const r = img.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight * 3) return false;
    }
  }
  return true;
}

/** fixed: 要素が固定の表示（position: fixed・sticky）の中にあるか（rects と同じ並び。画面を動かしても位置が変わらない） */
/** label: 1つ目の要素の呼び名（aria-label・placeholder・見えている文字の1行目など。確かめの文の主語を補うため） */
export type ElementInfo = { rects: (Rect | null)[]; cross: boolean; fixed?: boolean[]; options?: { texts: string[]; selected: string[] }; label?: string };

/**
 * 確かめた要素の位置（いまの画面の座標）。見えない要素は null。iframe が別の出どころで座標を直せないときは cross。
 * 大きな要素（画面の4分の1を超える）は、囲む所を絞る（枠が画面の半分を覆って、何を示すか分からなくならないように）:
 *   - 確かめた文字（hint）があれば、その文字を表示している一番小さい要素
 *   - 画面を覆う入れ物（モーダルの外枠 など）なら、見えている子が1つだけの間は中へ（モーダルの本体）
 */
export function rectsOfElements(els0: Element[], o?: { hint?: string; want?: string }): ElementInfo {
  const out: (Rect | null)[] = [];
  const fixed: boolean[] = [];
  let cross = false;
  let options: ElementInfo["options"];
  let label: string | undefined;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const seen = (x: Element) => { const r = x.getBoundingClientRect(); const s = getComputedStyle(x); return r.width >= 1 && r.height >= 1 && s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0.01; };
  const big = (x: Element) => { const r = x.getBoundingClientRect(); return r.width * r.height > innerWidth * innerHeight * 0.25; };
  // 値の確かめ（読んだ値）: いくつもの要素を読んだときは、確かめた値を表示している要素だけにする（ほかの欄に札を付けない）
  const shownOf = (x: Element) => x instanceof HTMLInputElement || x instanceof HTMLTextAreaElement ? (x.type === "password" ? "" : x.value)
    : x instanceof HTMLSelectElement ? Array.from(x.selectedOptions).map((op) => `${op.text} ${op.value}`).join(" ")
    : (x as HTMLElement).innerText ?? x.textContent ?? "";
  const plainNum = (s: string) => s.replace(/[\s,¥円]/g, "");
  const wantOk = (x: Element) => {
    const w = norm(o?.want ?? "");
    if (!w) return true;
    const t = norm(shownOf(x));
    if (/^[\d,.\-¥円\s]+$/.test(w)) return plainNum(t) === plainNum(w) || t.split(/[\s/／:：]+/).some((p) => plainNum(p) === plainNum(w));
    return t.includes(w);
  };
  // 値と同じ文字の要素を先に（「晴」を確かめたとき「晴屋テスト」の欄を含めない）。無ければ値を含む要素
  const exact = o?.want && els0.length > 1 ? els0.filter((x) => norm(shownOf(x)) === norm(o.want ?? "")) : [];
  const matched = exact.length ? exact : o?.want && els0.length > 1 ? els0.filter(wantOk) : [];
  const els = matched.length ? matched : els0;
  const narrow = (x: Element): Element => {
    if (!big(x)) return x;
    const hint = norm(o?.hint ?? "");
    if (hint) {
      let best: Element | undefined;
      const walker = document.createTreeWalker(x, NodeFilter.SHOW_ELEMENT);
      for (let n = walker.nextNode() as Element | null; n; n = walker.nextNode() as Element | null) {
        if (!seen(n) || !norm((n as HTMLElement).innerText ?? "").includes(hint)) continue;
        const r = n.getBoundingClientRect();
        if (!best || r.width * r.height <= best.getBoundingClientRect().width * best.getBoundingClientRect().height) best = n;
      }
      if (best) return best;
    }
    // 画面の本文全体のような入れ物（「〜画面が表示される」の確かめ）: 見出しを囲む（本文全体を囲むと何を示すか分からない）
    const head = Array.from(x.querySelectorAll("h1, h2")).find((h) => seen(h) && norm((h as HTMLElement).innerText ?? "").length > 0);
    if (head) return head;
    let cur = x;
    for (let i = 0; i < 6; i++) {
      const kids = Array.from(cur.children).filter(seen);
      if (kids.length !== 1) break;
      const r0 = cur.getBoundingClientRect(), r1 = kids[0].getBoundingClientRect();
      if (r1.width * r1.height > r0.width * r0.height * 0.85) { cur = kids[0]; continue; }
      cur = kids[0];
      break;
    }
    return cur;
  };
  // 選択欄の札（選んでいる値）は、確かめた要素がただ1つの選択欄（select）のときだけ付ける（ほかの欄に付けない）
  const asSel = (x: Element) => (x.tagName === "OPTION" || x.tagName === "OPTGROUP" ? (x.closest("select") ?? x) : x);
  const distinct = [...new Set(els.slice(0, 30).map(asSel))];
  const oneSelect = distinct.length === 1 && distinct[0].tagName === "SELECT";
  for (const e0 of els.slice(0, 30)) {
    // 選択肢（option）は、選択欄（select）を囲む
    const e1 = asSel(e0);
    const e = e1.tagName === "SELECT" || e1.tagName === "INPUT" ? e1 : narrow(e1);
    if (label === undefined) {
      const h = e1 as HTMLInputElement;
      // パスワードの欄の値は呼び名にしない（伏せ字でない値を画像に書かない）
      const t = h.getAttribute?.("aria-label") || h.getAttribute?.("placeholder") || h.getAttribute?.("title") || h.getAttribute?.("alt")
        || norm(((e1 as HTMLElement).innerText ?? e1.textContent ?? "").split("\n").find((l) => l.trim()) ?? "") || (typeof h.value === "string" && h.type !== "password" ? h.value : "");
      label = t ? norm(t).slice(0, 40) : "";
    }
    if (oneSelect && e.tagName === "SELECT" && !options) {
      const s = e as HTMLSelectElement;
      options = { texts: Array.from(s.options).map((x) => x.text.replace(/\s+/g, " ").trim()), selected: Array.from(s.selectedOptions).map((x) => x.text.replace(/\s+/g, " ").trim()) };
    }
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    let fx = false;
    for (let a: Element | null = e; a && !fx; a = a.parentElement) { const p = getComputedStyle(a).position; fx = p === "fixed" || p === "sticky"; }
    fixed.push(fx);
    // 見た目を隠した元の選択欄（select2 などの 1px の要素）は、囲まない（小さな点の枠になり、何を示すか分からない）
    if (cs.display === "none" || cs.visibility === "hidden" || r.width < 4 || r.height < 4) { out.push(null); continue; }
    let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
    // はみ出しを隠す枠（overflow）の外は見えないので切る
    for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX !== "visible" || s.overflowY !== "visible") {
        const ar = a.getBoundingClientRect();
        if (s.overflowX !== "visible") { x1 = Math.max(x1, ar.left); x2 = Math.min(x2, ar.right); }
        if (s.overflowY !== "visible") { y1 = Math.max(y1, ar.top); y2 = Math.min(y2, ar.bottom); }
      }
      if (s.position === "fixed") break;
    }
    if (x2 - x1 < 1 || y2 - y1 < 1) { out.push(null); continue; }
    let ox = 0, oy = 0;
    try {
      let w: Window = window;
      while (w !== w.top) {
        const fe = w.frameElement as HTMLElement | null;
        if (!fe) throw new Error("cross");
        const fr = fe.getBoundingClientRect();
        const fs = getComputedStyle(fe);
        ox += fr.left + fe.clientLeft + parseFloat(fs.paddingLeft || "0");
        oy += fr.top + fe.clientTop + parseFloat(fs.paddingTop || "0");
        w = w.parent;
      }
    } catch {
      cross = true;
    }
    out.push({ x: x1 + ox, y: y1 + oy, w: x2 - x1, h: y2 - y1 });
  }
  return { rects: out, cross, fixed, options, label: label || undefined };
}

export type ValuePred = { kind: "eq" | "inc"; s: string } | { kind: "options"; items: string[] };

/** 値を表示している要素を、画面の中でただ1つに絞れたときだけ、その位置を返す（2つ以上・0なら null） */
export function findByValue(preds: ValuePred[]): ({ rect: Rect; options?: { texts: string[]; selected: string[] } } | null)[] {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const vis = (e: Element) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const all = Array.from(document.body?.querySelectorAll("*") ?? []).filter((e) => !["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "OPTION", "OPTGROUP"].includes(e.tagName));
  const textOf = new Map<Element, string>();
  const tx = (e: Element) => {
    let t = textOf.get(e);
    if (t === undefined) {
      t = e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement ? norm(e.value) : e instanceof HTMLSelectElement ? norm(e.selectedOptions[0]?.text ?? "") : norm(e.textContent ?? "");
      textOf.set(e, t);
    }
    return t;
  };
  const rectOf = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  return preds.map((p) => {
    if (p.kind === "options") {
      const hits = Array.from(document.querySelectorAll("select")).filter((s) => {
        if (!vis(s)) return false;
        const texts = Array.from(s.options).map((o) => norm(o.text));
        const vals = Array.from(s.options).map((o) => o.value);
        return p.items.every((i) => texts.includes(norm(i)) || vals.includes(i));
      });
      if (hits.length !== 1) return null;
      const s = hits[0];
      return { rect: rectOf(s), options: { texts: Array.from(s.options).map((o) => norm(o.text)), selected: Array.from(s.selectedOptions).map((o) => norm(o.text)) } };
    }
    const want = norm(p.s);
    if (!want) return null;
    const match = (e: Element) => {
      const raw = e.textContent ?? "";
      if (!(e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement) && raw.length > want.length * 4 + 200) return false;
      const t = tx(e);
      return p.kind === "eq" ? t === want : t.includes(want);
    };
    const cands = all.filter((e) => match(e) && !Array.from(e.children).some((c) => match(c)) && vis(e));
    // 見た目の文字（隠れた子を除く）でも合うものだけ
    const ok = cands.filter((e) => {
      if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement) return true;
      const t = norm((e as HTMLElement).innerText ?? "");
      return p.kind === "eq" ? t === want : t.includes(want);
    });
    return ok.length === 1 ? { rect: rectOf(ok[0]) } : null;
  });
}

/**
 * 「無い」ことの確かめ（0件・表示されない）や、エラーの画面を確かめたときに、画面に出ている案内の文言（「〜はありません。」「404 Page Not Found」
 * 「お探しのページが見つかりません」など）を探す。見つかれば、その要素を囲む（上の帯だけでは、画面のどこを見ればよいか分からない）。
 * 文言の短い、いちばん内側の見えている要素。いくつもあれば最初（画面の上）のもの。
 * 「No 商品コード 商品名 …」のような表の見出し（番号の列）を「No results」の案内と取り違えない（No の後ろが英字のときだけ案内とする）。
 */
export function findNotice(): { rect: Rect; text: string } | null {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const RE = /(ありません|見つかりません|見つかりませんでした|該当.{0,10}(ありません|なし)|Not Found|\b40[34]\b|システムエラー|\bNo [A-Za-z][A-Za-z ,'-]{0,39}\.?$|You have no|There (is|are) no|not found)/i;
  const vis = (e: Element) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width >= 4 && r.height >= 4 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.01; };
  const skip = "script,style,noscript,template,header,footer,nav,[data-e2e-evidence],select,option,input,textarea";
  for (const e of Array.from(document.body?.querySelectorAll("*") ?? [])) {
    if (e.matches(skip) || e.closest("header,footer,nav")) continue;
    const t = norm((e as HTMLElement).innerText ?? "");
    if (!t || t.length > 80 || !RE.test(t) || !vis(e)) continue;
    // より内側に同じ文言の要素があれば、そちら
    if (Array.from(e.children).some((c) => RE.test(norm((c as HTMLElement).innerText ?? "")) && vis(c))) continue;
    const r = e.getBoundingClientRect();
    if (r.width * r.height > innerWidth * innerHeight * 0.2) continue;
    return { rect: { x: r.left, y: r.top, w: r.width, h: r.height }, text: t };
  }
  return null;
}

export type FramePlan = { rects: Rect[]; lines: { text: string; fail: boolean }[]; sub?: string[] };
/** prior: この画像より前の画面（操作の前）で確かめたこと。この画像の画面のことではないので、赤でなく灰色で分けて書く */
export type BandLine = { text: string; kind: "check" | "fail" | "meta" | "dialog" | "scene" | "prior" };
export type RenderInput = { src: string; dpr: number; frames: FramePlan[]; band: BandLine[] };

/** 撮った画像に印を重ねる（作業用の画面で動く）。描き終えた大きさ（CSS の px）を返す */
export async function renderComposite(inp: RenderInput): Promise<{ w: number; h: number; overflow: number }> {
  const RED = "#e60012";
  const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans CJK JP","Noto Sans JP","Yu Gothic","Meiryo",sans-serif';
  document.documentElement.style.cssText = "margin:0;padding:0;background:#fff";
  document.body.style.cssText = "margin:0;padding:0;background:#fff";
  const img = new Image();
  img.src = inp.src;
  await img.decode();
  const W = img.naturalWidth / inp.dpr, H = img.naturalHeight / inp.dpr;
  const root = document.createElement("div");
  root.id = "root";
  root.style.cssText = `position:relative;width:${W}px;background:#fff;font-family:${FONT};`;
  document.body.appendChild(root);
  const band = document.createElement("div");
  root.appendChild(band);
  const stage = document.createElement("div");
  stage.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden`;
  img.style.cssText = `display:block;width:${W}px;height:${H}px`;
  stage.appendChild(img);
  root.appendChild(stage);

  // 空いている所（色の変化が少ない所）を探すための、細かい升目ごとの込み具合
  const C = 4;
  const gw = Math.ceil(W / C), gh = Math.ceil(H / C);
  const sat = new Float64Array((gw + 1) * (gh + 1));
  // 暗い所（ヘッダーの帯など）。白い札を載せると、そこにある表示を覆い隠して見えるので避ける
  const satDark = new Float64Array((gw + 1) * (gh + 1));
  try {
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(W); cv.height = Math.ceil(H);
    const g = cv.getContext("2d", { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, W, H);
    const data = g.getImageData(0, 0, cv.width, cv.height).data;
    for (let cy = 0; cy < gh; cy++) {
      for (let cx = 0; cx < gw; cx++) {
        let mn = 255, mx = 0, sum = 0, cnt = 0;
        for (let y = cy * C; y < Math.min(cv.height, cy * C + C); y++) {
          for (let x = cx * C; x < Math.min(cv.width, cx * C + C); x++) {
            const i = (y * cv.width + x) * 4;
            const l = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
            if (l < mn) mn = l;
            if (l > mx) mx = l;
            sum += l; cnt++;
          }
        }
        const busy = mx - mn > 24 ? 1 : 0;
        sat[(cy + 1) * (gw + 1) + cx + 1] = busy + sat[cy * (gw + 1) + cx + 1] + sat[(cy + 1) * (gw + 1) + cx] - sat[cy * (gw + 1) + cx];
        const dark = cnt && sum / cnt < 150 ? 1 : 0;
        satDark[(cy + 1) * (gw + 1) + cx + 1] = dark + satDark[cy * (gw + 1) + cx + 1] + satDark[(cy + 1) * (gw + 1) + cx] - satDark[cy * (gw + 1) + cx];
      }
    }
  } catch { /* 読めなければ、込み具合は 0 として扱う */ }
  const busy = (r: Rect) => area(sat, r) + area(satDark, r) * 0.3;
  const area = (t: Float64Array, r: Rect) => {
    const x1 = Math.max(0, Math.floor(r.x / C)), y1 = Math.max(0, Math.floor(r.y / C));
    const x2 = Math.min(gw, Math.ceil((r.x + r.w) / C)), y2 = Math.min(gh, Math.ceil((r.y + r.h) / C));
    if (x2 <= x1 || y2 <= y1) return 0;
    const s = t[y2 * (gw + 1) + x2] - t[y1 * (gw + 1) + x2] - t[y2 * (gw + 1) + x1] + t[y1 * (gw + 1) + x1];
    return s / ((x2 - x1) * (y2 - y1));
  };
  const hit = (a: Rect, b: Rect, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
  const inside = (r: Rect) => r.x >= 2 && r.y >= 2 && r.x + r.w <= W - 2 && r.y + r.h <= H - 2;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", String(W));
  svg.setAttribute("height", String(H));
  svg.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;overflow:visible";
  stage.appendChild(svg);

  // 枠: 要素の外側に描く（要素の文字・境界を隠さない）。画像の端では内側に寄せて、線が切れないようにする
  const SW = 3, GAP = 2;
  type F = { boxes: Rect[]; U: Rect; plan: FramePlan };
  const frames: F[] = [];
  for (const fp of inp.frames) {
    const boxes: Rect[] = [];
    for (const r of fp.rects) {
      const x1 = Math.max(SW / 2, r.x - GAP - SW / 2), y1 = Math.max(SW / 2, r.y - GAP - SW / 2);
      const x2 = Math.min(W - SW / 2, r.x + r.w + GAP + SW / 2), y2 = Math.min(H - SW / 2, r.y + r.h + GAP + SW / 2);
      if (x2 - x1 < 2 || y2 - y1 < 2) continue;
      boxes.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
    }
    if (!boxes.length) continue;
    const ux1 = Math.min(...boxes.map((b) => b.x)), uy1 = Math.min(...boxes.map((b) => b.y));
    const ux2 = Math.max(...boxes.map((b) => b.x + b.w)), uy2 = Math.max(...boxes.map((b) => b.y + b.h));
    frames.push({ boxes, U: { x: ux1, y: uy1, w: ux2 - ux1, h: uy2 - uy1 }, plan: fp });
  }
  const obstacles: Rect[] = frames.flatMap((f) => f.boxes.map((b) => ({ x: b.x - SW / 2, y: b.y - SW / 2, w: b.w + SW, h: b.h + SW })));
  for (const f of frames) {
    for (const b of f.boxes) {
      const r = document.createElementNS(svgNS, "rect");
      r.setAttribute("x", String(b.x)); r.setAttribute("y", String(b.y));
      r.setAttribute("width", String(b.w)); r.setAttribute("height", String(b.h));
      r.setAttribute("rx", "2");
      r.setAttribute("fill", "none"); r.setAttribute("stroke", RED); r.setAttribute("stroke-width", String(SW));
      svg.appendChild(r);
    }
  }

  // 文字の札: 赤い文字。読めるように、下地は白（少し透ける）
  const makeLabel = (fp: FramePlan, maxW: number) => {
    const d = document.createElement("div");
    d.style.cssText = `position:absolute;left:0;top:0;max-width:${maxW}px;box-sizing:border-box;padding:3px 7px 4px;background:rgba(255,255,255,0.93);`
      + `border:1px solid ${RED};border-radius:3px;color:${RED};font-size:13px;line-height:1.45;font-weight:600;white-space:normal;word-break:break-all;visibility:hidden`;
    for (const l of fp.lines) {
      // 不合格は「期待結果：…／」と「実行結果：…」を2行に分けて読みやすくする（文の形は「期待結果：…／実行結果：…」のまま）
      for (const part of l.text.split(/(?<=／)(?=実行結果：)/)) { const p = document.createElement("div"); p.textContent = part; if (l.fail) p.style.fontWeight = "700"; d.appendChild(p); }
    }
    for (const s of fp.sub ?? []) { const p = document.createElement("div"); p.textContent = s; p.style.cssText = "font-weight:500;font-size:12px"; d.appendChild(p); }
    stage.appendChild(d);
    return d;
  };
  const placed: Rect[] = [];
  const overflow: { n: number; f: F }[] = [];
  // 番号の印（枠と、離れた札・上の帯の行を結ぶ）
  let tagNo = 0;
  const num = (n: number) => (n <= 20 ? String.fromCharCode(0x2460 + n - 1) : `(${n})`);
  const makeTag = (n: number) => {
    const tag = document.createElement("div");
    tag.textContent = num(n);
    tag.style.cssText = `position:absolute;min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;border-radius:11px;background:${RED};color:#fff;font-size:14px;line-height:22px;text-align:center;font-weight:700;border:1px solid #fff`;
    return tag;
  };
  /** 枠の外側（左上・左・右・左下の順で、画像に入り、ほかの枠・札に掛からない所）に番号を置く。どこも無ければ枠の左上の内側 */
  const putTag = (n: number, U: Rect) => {
    const tag = makeTag(n);
    stage.appendChild(tag);
    const tw = tag.offsetWidth, th = 22;
    const cands: [number, number][] = [
      [U.x, U.y - th - 2], [U.x - tw - 3, U.y], [U.x + U.w + 3, U.y], [U.x, U.y + U.h + 2],
      [U.x + U.w - tw, U.y - th - 2], [U.x + U.w - tw, U.y + U.h + 2], [U.x - tw - 3, U.y + U.h - th], [U.x + U.w + 3, U.y + U.h - th],
    ];
    const rr = (x: number, y: number) => ({ x, y, w: tw, h: th });
    const free = (x: number, y: number) => { const r = rr(x, y); return inside(r) && !obstacles.some((o) => hit(r, o, 0)) && !placed.some((p) => hit(r, p, 1)); };
    // 画面の文字に重ならない所を先に（番号の丸が文字を隠して読み違えないように）。無ければ、枠の線に掛かってもよいので文字の少ない所
    const quiet = cands.filter(([cx, cy]) => free(cx, cy) && busy(rr(cx, cy)) < 0.05);
    const loose = cands.filter(([cx, cy]) => inside(rr(cx, cy)) && !placed.some((p) => hit(rr(cx, cy), p, 1))).sort((a, b) => busy(rr(a[0], a[1])) - busy(rr(b[0], b[1])));
    const [x, y] = quiet[0] ?? cands.find(([cx, cy]) => free(cx, cy) && busy(rr(cx, cy)) < 0.15) ?? loose[0] ?? [Math.min(Math.max(2, U.x + 3), W - tw - 2), Math.min(Math.max(2, U.y + 3), H - th - 2)];
    tag.style.left = `${x}px`;
    tag.style.top = `${y}px`;
    placed.push({ x, y, w: tw, h: th });
  };
  const order = [...frames].sort((a, b) => a.U.y - b.U.y || a.U.x - b.U.x);
  const GAPL = 6;
  for (const f of order) {
    // 離れた所にある要素をまとめて囲んだ枠（同じ確かめで読んだ要素が散らばっている）: 札は一番上の要素の近くに置き、ほかの要素には番号を付ける
    const sumArea = f.boxes.reduce((a, b) => a + b.w * b.h, 0);
    const U = f.boxes.length > 1 && f.U.w * f.U.h > sumArea * 2.5 ? [...f.boxes].sort((a, b) => a.y - b.y || a.x - b.x)[0] : f.U;
    let best: { r: Rect; score: number; el: HTMLDivElement; far: boolean } | undefined;
    // 1行で収まるならその幅（折り返さない）、長ければ 440・300・220 px で折り返す
    const natural = (() => { const el = makeLabel(f.plan, 4000); el.style.whiteSpace = "nowrap"; const w0 = el.offsetWidth + 2; el.remove(); return w0; })();
    const widths = [...new Set([...(natural <= Math.min(640, W - 8) ? [natural] : []), Math.min(440, W - 8), Math.min(300, W - 8), Math.min(220, W - 8)])];
    // 自分の枠の中の、空いている所（右寄せ）。表の行のように、横にも上下にも置けない枠のため
    const own = f.boxes[0];
    // ほかの枠の要素そのもの（枠の線は除く）。隣り合う行の枠は線が重なるので、線までは避けない
    const others = frames.filter((g) => g !== f).flatMap((g) => g.boxes.map((x) => ({ x: x.x + GAP + SW / 2, y: x.y + GAP + SW / 2, w: x.w - 2 * (GAP + SW / 2), h: x.h - 2 * (GAP + SW / 2) })));
    const okInside = (r: Rect) => inside(r) && r.x >= own.x + SW + 2 && r.y >= own.y + 1 && r.x + r.w <= own.x + own.w - SW - 2 && r.y + r.h <= own.y + own.h - 1
      && !others.some((o) => hit(r, o, 0)) && !placed.some((p) => hit(r, p, 4)) && busy(r) < 0.02;
    const tried: HTMLDivElement[] = [];
    const ok = (r: Rect) => inside(r) && !obstacles.some((o) => hit(r, o, 1)) && !placed.some((p) => hit(r, p, 4));
    for (const [wi, mw] of widths.entries()) {
      const el = makeLabel(f.plan, mw);
      tried.push(el);
      const w = el.offsetWidth, h = el.offsetHeight;
      const clampY = (y: number) => Math.min(Math.max(2, y), H - h - 2);
      const clampX = (x: number) => Math.min(Math.max(2, x), W - w - 2);
      const cands: [number, number][] = [
        [U.x + U.w + GAPL, clampY(U.y)],
        [U.x + U.w + GAPL, clampY(U.y + U.h / 2 - h / 2)],
        [clampX(U.x), U.y + U.h + GAPL],
        [clampX(U.x + U.w - w), U.y + U.h + GAPL],
        [clampX(U.x), U.y - h - GAPL],
        [clampX(U.x + U.w - w), U.y - h - GAPL],
        [U.x - w - GAPL, clampY(U.y)],
        [U.x - w - GAPL, clampY(U.y + U.h / 2 - h / 2)],
      ];
      cands.forEach(([x, y], i) => {
        const r = { x, y, w, h };
        if (!ok(r)) return;
        const score = busy(r) * 10 + i * 0.03 + wi * 0.4;
        if (!best || score < best.score) best = { r, score, el, far: false };
      });
      const ins: [number, number][] = [[own.x + own.w - SW - 6 - w, own.y + own.h / 2 - h / 2], [own.x + own.w - SW - 6 - w, own.y + SW + 3], [own.x + own.w - SW - 6 - w, own.y + own.h - h - SW - 3]];
      for (const [x, y] of ins) {
        const r = { x, y, w, h };
        if (!okInside(r)) continue;
        const score = 0.6 + wi * 0.4;
        if (!best || score < best.score) best = { r, score, el, far: false };
      }
    }
    // すぐ横（または枠の中）が文字・表示に掛かるなら、近くの空いている所に置いて線で結ぶ。空いている所が無ければ、すぐ横の一番ましな所
    const CLEAN = 0.03;
    const near = best as { r: Rect; score: number; el: HTMLDivElement; far: boolean } | undefined;
    if (!near || busy(near.r) > CLEAN) {
      let far: typeof near;
      for (const el of tried) {
        const w = el.offsetWidth, h = el.offsetHeight;
        for (let dy = -600; dy <= 600; dy += 8) {
          for (let dx = -600; dx <= 600; dx += 8) {
            const r = { x: U.x + dx, y: U.y + dy, w, h };
            if (!ok(r) || busy(r) > CLEAN) continue;
            const cx = Math.max(0, Math.max(U.x - (r.x + r.w), r.x - (U.x + U.w)));
            const cy = Math.max(0, Math.max(U.y - (r.y + r.h), r.y - (U.y + U.h)));
            const score = Math.hypot(cx, cy) / 40 + busy(r) * 10 + h / 100;
            if (!far || score < far.score) far = { r, score, el, far: true };
          }
        }
      }
      // 近くに空いた所が無く、すぐ横に置くと画面の値・文字を隠す: 札は置かず、枠に番号を付けて上の帯に書く
      best = far ?? (near && busy(near.r) <= 0.08 ? near : undefined);
    }
    for (const t of tried) if (t !== best?.el) t.remove();
    if (!best) { overflow.push({ n: ++tagNo, f }); continue; }
    const b = best;
    b.el.style.left = `${b.r.x}px`;
    b.el.style.top = `${b.r.y}px`;
    b.el.style.visibility = "visible";
    placed.push(b.r);
    // 札が枠から離れたら、線で結ばず、枠と札に同じ番号を付ける（線が画面の文字の上を通って隠さないように）
    // 札から離れた要素（枠の中の要素のどれか）があれば、その要素ごとに同じ番号を付ける
    const dist = (B: Rect) => Math.hypot(Math.max(0, B.x - (b.r.x + b.r.w), b.r.x - (B.x + B.w)), Math.max(0, B.y - (b.r.y + b.r.h), b.r.y - (B.y + B.h)));
    const farBoxes = f.boxes.filter((B) => dist(B) > GAPL + 3 + SW + GAP);
    if (farBoxes.length) {
      const n = ++tagNo;
      for (const B of farBoxes.slice(0, 10)) putTag(n, B);
      const t2 = makeTag(n);
      t2.style.left = `${Math.max(0, b.r.x - 11)}px`;
      t2.style.top = `${Math.max(0, b.r.y - 11)}px`;
      stage.appendChild(t2);
    }
  }
  // 置き場の無い札は、枠に番号を付けて、上の帯に書く
  const bandLines = [...inp.band];
  for (const o of overflow) {
    const sumA = o.f.boxes.reduce((a, b) => a + b.w * b.h, 0);
    if (o.f.boxes.length > 1 && o.f.U.w * o.f.U.h > sumA * 2.5) for (const B of o.f.boxes.slice(0, 10)) putTag(o.n, B);
    else putTag(o.n, o.f.U);
    o.f.plan.lines.forEach((l, i) => bandLines.push({ text: `${i === 0 ? num(o.n) : "　"}${l.text}`, kind: l.fail ? "fail" : "check" }));
    for (const s of o.f.plan.sub ?? []) bandLines.push({ text: `　${s}`, kind: "meta" });
  }
  if (bandLines.length) {
    band.style.cssText = `box-sizing:border-box;width:${W}px;padding:8px 12px 9px;background:#fff;border-bottom:3px solid ${RED};`;
    for (const l of bandLines) {
      const p = document.createElement("div");
      p.textContent = l.text;
      p.style.cssText = l.kind === "scene" ? "color:#111;font-size:14px;line-height:1.55;font-weight:700;word-break:break-all"
        : l.kind === "prior"
        ? "color:#555;font-size:13px;line-height:1.55;font-weight:600;word-break:break-all"
        : l.kind === "meta"
        ? "color:#333;font-size:12.5px;line-height:1.55;word-break:break-all"
        : `color:${RED};font-size:14px;line-height:1.55;font-weight:${l.kind === "fail" ? 700 : 600};word-break:break-all`;
      band.appendChild(p);
    }
  }
  await document.fonts.ready;
  return { w: W, h: root.offsetHeight, overflow: overflow.length };
}
