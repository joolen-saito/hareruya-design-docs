/**
 * ケースの画面（ctx.page）と別のブラウザセッションで開いた画面を、エビデンスとして撮る（足した部品。lib/evidence.ts は変えない）。
 *
 * caseTest の自動のキャプチャは、ケースの画面と同じセッションのタブしか撮らない。正本が「ブラウザA（会員）とブラウザB（管理者）」の
 * ように別のセッションで操作するケースは、ブラウザAの画面が写らない。手順・期待結果の中でこれを呼ぶと、その場面の画像として残る。
 *
 *   await step(1, async () => { …; await 別のブラウザの画面を撮る(A, scene.stepLabel(1, "ブラウザA（会員）の買取履歴詳細")); });
 *   await expected(async () => { …; await 別のブラウザの画面を撮る(A, scene.expectedLabel("ブラウザA（会員）")); });
 *
 * 撮れても撮れなくても合否は変えない（撮れなかったら理由を添える）。ファイル名は自動のキャプチャ（evidence-NNN）とぶつからない名前にする。
 * 同じ画面の撮り方を足すもの（選択肢を広げて撮る・要素を撮る）もここに置く。
 */
import { Page, test } from "@playwright/test";
import { EVIDENCE_PREFIX } from "./evidence";
import { finishShot, prepareShot, Prepared, takeMarksOfPage } from "./annotate";

export { scene } from "./evidence";

const MODE = (process.env.E2E_EVIDENCE || "full").toLowerCase();
const FORMAT = (process.env.E2E_EVIDENCE_FORMAT || "png").toLowerCase() === "jpeg" ? "jpeg" : "png";
const MAX_HEIGHT = Number(process.env.E2E_EVIDENCE_MAX_HEIGHT || 8000);
let seq = 0;

export async function 別のブラウザの画面を撮る(p: Page, 場面: string): Promise<void> {
  if (MODE === "off") return;
  const info = test.info();
  const name = `${EVIDENCE_PREFIX}${場面}`;
  if (p.isClosed() || p.url() === "about:blank") {
    await info.attach(`${name}:撮れなかった`, { body: "別のブラウザの画面が開いていない", contentType: "text/plain" }).catch(() => {});
    return;
  }
  seq += 1;
  const file = info.outputPath(`evidence-other-${String(seq).padStart(3, "0")}.${FORMAT}`);
  try {
    const height = await Promise.race([
      p.evaluate(() => Math.max(document.documentElement?.scrollHeight ?? 0, document.body?.scrollHeight ?? 0)).catch(() => Number.POSITIVE_INFINITY),
      new Promise<undefined>((r) => setTimeout(() => r(undefined), 5_000)),
    ]);
    if (height === undefined) {
      await info.attach(`${name}:撮れなかった`, { body: "画面が応答しない（ブラウザの確認ダイアログが開いている など）", contentType: "text/plain" }).catch(() => {});
      return;
    }
    const full = MODE === "full" && height <= MAX_HEIGHT;
    await p.screenshot({ path: file, fullPage: full, type: FORMAT, quality: FORMAT === "jpeg" ? 80 : undefined, timeout: 15_000, caret: "initial" });
    await info.attach(name, { path: file, contentType: FORMAT === "jpeg" ? "image/jpeg" : "image/png" });
    await info.attach(`${name}:URL`, { body: p.url(), contentType: "text/plain" });
  } catch (e) {
    await info.attach(`${name}:撮れなかった`, { body: (e as Error).message.split("\n")[0], contentType: "text/plain" }).catch(() => {});
  }
}

/**
 * 別のブラウザセッションの画面を、その画面の要素を確かめた印（赤い枠と「期待結果：…」）と、手順の文・URL の帯を付けて撮る（足した部品）。
 * 印になるのは、その画面の要素（Locator）を直接確かめたもの（toHaveText・toBeVisible など）だけ。値の確かめ・ほかの画面の印はケースの画面に残る。
 * 撮れても撮れなくても合否は変えない。
 */
export async function 別のブラウザの画面を印つきで撮る(p: Page, 場面: string, 見えている範囲だけ = false): Promise<void> {
  if (MODE === "off") return;
  const info = test.info();
  const name = `${EVIDENCE_PREFIX}${場面}`;
  const sm = takeMarksOfPage(p, 場面, info);
  if (p.isClosed() || p.url() === "about:blank") {
    await info.attach(`${name}:撮れなかった`, { body: "別のブラウザの画面が開いていない", contentType: "text/plain" }).catch(() => {});
    return;
  }
  seq += 1;
  const file = info.outputPath(`evidence-other-${String(seq).padStart(3, "0")}.${FORMAT}`);
  try {
    const height = await Promise.race([
      p.evaluate(() => Math.max(document.documentElement?.scrollHeight ?? 0, document.body?.scrollHeight ?? 0)).catch(() => Number.POSITIVE_INFINITY),
      new Promise<undefined>((r) => setTimeout(() => r(undefined), 5_000)),
    ]);
    if (height === undefined) {
      await info.attach(`${name}:撮れなかった`, { body: "画面が応答しない（ブラウザの確認ダイアログが開いている など）", contentType: "text/plain" }).catch(() => {});
      return;
    }
    // 見えている範囲だけ: 縦に長い画面で、確かめた要素（メニューの項目 など）を見える大きさで撮る（確かめた要素まで画面を動かして撮る）
    let full = !見えている範囲だけ && MODE === "full" && height <= MAX_HEIGHT;
    let pr: Prepared | undefined;
    let shot = false;
    let 注記: string | undefined;
    try {
      pr = sm ? await prepareShot(p, sm, true, full) : undefined;
      if (pr?.refuse) throw new Error(pr.refuse);
      if (pr) full = pr.full;
      await p.screenshot({ path: file, fullPage: full || !!pr?.clip, clip: pr?.clip, type: FORMAT, quality: FORMAT === "jpeg" ? 80 : undefined, timeout: 15_000, caret: "initial" });
      shot = true;
    } finally {
      if (pr) 注記 = await finishShot(pr, shot ? file : undefined, FORMAT);
    }
    await info.attach(name, { path: file, contentType: FORMAT === "jpeg" ? "image/jpeg" : "image/png" });
    await info.attach(`${name}:URL`, { body: p.url(), contentType: "text/plain" });
    if (注記) await info.attach(`${name}:注記`, { body: 注記, contentType: "text/plain" });
  } catch (e) {
    await info.attach(`${name}:撮れなかった`, { body: (e as Error).message.split("\n")[0], contentType: "text/plain" }).catch(() => {});
  }
}

/**
 * 別のウィンドウ（戻しリストPDFのポップアップなど、アドレスが about:blank のもの）が開いた時点の画面を撮る（足した部品）。
 * 別のブラウザの画面を撮る は about:blank を撮らないので、こちらで撮る。撮れても撮れなくても合否は変えない。
 */
export async function 別のウィンドウの画面を撮る(p: Page, 場面: string): Promise<void> {
  if (MODE === "off") return;
  const info = test.info();
  const name = `${EVIDENCE_PREFIX}${場面}`;
  if (p.isClosed()) {
    await info.attach(`${name}:撮れなかった`, { body: "ウィンドウがすでに閉じていた", contentType: "text/plain" }).catch(() => {});
    return;
  }
  seq += 1;
  const file = info.outputPath(`evidence-other-${String(seq).padStart(3, "0")}.${FORMAT}`);
  try {
    await p.waitForFunction(() => (document.body?.innerText ?? "").trim().length > 0, undefined, { timeout: 3_000 }).catch(() => undefined);
    await p.screenshot({ path: file, fullPage: false, type: FORMAT, quality: FORMAT === "jpeg" ? 80 : undefined, timeout: 10_000, caret: "initial" });
    await info.attach(name, { path: file, contentType: FORMAT === "jpeg" ? "image/jpeg" : "image/png" });
    await info.attach(`${name}:URL`, { body: p.url(), contentType: "text/plain" });
  } catch (e) {
    await info.attach(`${name}:撮れなかった`, { body: (e as Error).message.split("\n")[0], contentType: "text/plain" }).catch(() => {});
  }
}

/**
 * 選択欄（select）の選択肢を、画面の上で一覧の形に広げて撮り、元に戻す。ブラウザが開く選択肢の一覧は画面に描かれず撮れないため、
 * 選択欄に表示の行数（size）を一時的に付けて、選択肢そのもの（先頭から最大 行数 件）を画面に出す。値・選択は変えない。
 */
export async function 選択肢を広げて撮る(sel: import("@playwright/test").Locator, 場面: string, 行数 = 20): Promise<void> {
  if (MODE === "off") return;
  const page = sel.page();
  const before = await sel.evaluate((el, n) => {
    const s = el as HTMLSelectElement;
    const old = { size: s.getAttribute("size"), style: s.getAttribute("style") };
    s.setAttribute("size", String(Math.min(n, s.options.length)));
    s.style.height = "auto"; s.style.overflowY = "auto"; s.style.position = "relative"; s.style.zIndex = "10";
    s.scrollIntoView({ block: "center" });
    return old;
  }, 行数).catch(() => undefined);
  if (!before) {
    await test.info().attach(`${EVIDENCE_PREFIX}${場面}:撮れなかった`, { body: "選択欄が見つからない", contentType: "text/plain" }).catch(() => {});
    return;
  }
  try {
    await 別のブラウザの画面を撮る(page, 場面);
  } finally {
    await sel.evaluate((el, old) => {
      const s = el as HTMLSelectElement;
      if (old.size === null) s.removeAttribute("size"); else s.setAttribute("size", old.size);
      if (old.style === null) s.removeAttribute("style"); else s.setAttribute("style", old.style);
    }, before).catch(() => undefined);
  }
}

/** 画面の一部（パンくずなど、確かめる対象の要素）だけを拡大して撮る。ページ全体の画像では小さくて読めないときに足す */
export async function 要素を撮る(l: import("@playwright/test").Locator, 場面: string): Promise<void> {
  if (MODE === "off") return;
  const info = test.info();
  const name = `${EVIDENCE_PREFIX}${場面}`;
  seq += 1;
  const file = info.outputPath(`evidence-other-${String(seq).padStart(3, "0")}.${FORMAT}`);
  try {
    await l.scrollIntoViewIfNeeded({ timeout: 10_000 });
    await l.screenshot({ path: file, type: FORMAT, quality: FORMAT === "jpeg" ? 80 : undefined, timeout: 15_000, caret: "initial" });
    await info.attach(name, { path: file, contentType: FORMAT === "jpeg" ? "image/jpeg" : "image/png" });
    await info.attach(`${name}:URL`, { body: l.page().url(), contentType: "text/plain" });
  } catch (e) {
    await info.attach(`${name}:撮れなかった`, { body: (e as Error).message.split("\n")[0], contentType: "text/plain" }).catch(() => {});
  }
}


/**
 * ダウンロードしたファイル（CSV）の中身を、画面の上に「注記の枠」として載せて撮り、すぐ外す（足した部品）。
 * アプリの画面ではない（試験が読み取ったファイルの内容）ことを枠の見出しに明記する。画面の他の要素・値は変えない。
 * 撮れても撮れなくても合否は変えない。
 */
export async function ダウンロードしたCSVの内容を撮る(p: Page, 行: string[][], 場面: string, 最大行数 = 40): Promise<void> {
  if (MODE === "off" || p.isClosed()) return;
  const 表 = 行.slice(0, 最大行数);
  const 添える = 行.length > 最大行数 ? `（先頭 ${最大行数} 行まで。全 ${行.length} 行）` : `（全 ${行.length} 行）`;
  const ok = await p.evaluate(({ 表, 添える }) => {
    const box = document.createElement("div");
    box.id = "e2e-csv-note";
    box.setAttribute("style", "all:initial;display:block;margin:8px;padding:8px 12px;border:3px solid #c00;background:#fff;color:#000;font:13px/1.5 sans-serif;overflow:auto;position:relative;z-index:2147483647;");
    const h = document.createElement("div");
    h.setAttribute("style", "font-weight:bold;color:#c00;margin-bottom:4px;");
    h.textContent = `【試験が読み取ったダウンロードファイル（CSV）の内容。アプリの画面ではありません】${添える}`;
    box.appendChild(h);
    const t = document.createElement("table");
    t.setAttribute("style", "border-collapse:collapse;");
    表.forEach((r, i) => {
      const tr = document.createElement("tr");
      r.forEach((c) => {
        const td = document.createElement(i === 0 ? "th" : "td");
        td.setAttribute("style", "border:1px solid #888;padding:2px 8px;text-align:left;" + (i === 0 ? "background:#eee;" : ""));
        td.textContent = c;
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    box.appendChild(t);
    document.body.insertBefore(box, document.body.firstChild);
    window.scrollTo(0, 0);
    return true;
  }, { 表, 添える }).catch(() => false);
  if (!ok) return;
  try {
    await 別のブラウザの画面を撮る(p, 場面);
  } finally {
    await p.evaluate(() => document.getElementById("e2e-csv-note")?.remove()).catch(() => undefined);
  }
}


/** ダウンロードしたCSV1つぶんの内容（題＝ファイル名など、行＝見出し行を先頭にした表） */
export type CSVの表 = { 題: string; 行: string[][] };

const CSV枠 = "#e2e-csv-note";

/**
 * ダウンロードしたCSVの内容を、画面の上に「試験が読み取った内容」の枠として載せ、そのまま残す（足した部品）。
 * 撮ったあとに外さないので、続く期待結果の確かめ（CSVの枠のセル・CSVの枠の列・CSVの枠の題で確かめる）の赤枠は、この枠の中の要素に付く。
 * 期待結果の画像を撮ったあと caseTest が外す（ページを移れば消える）。アプリの画面ではないことを枠の見出しに明記する。画面の他の要素・値は変えない。
 * 画像を撮らない設定（E2E_EVIDENCE=off）でも、確かめがこの枠の要素を読むので載せる。
 */
export async function CSVの内容を画面の枠に出す(p: Page, 表: CSVの表[], 最大行数 = 40): Promise<void> {
  const ok = await p.evaluate(({ 表, 最大行数, sel }) => {
    document.querySelector(sel)?.remove();
    const box = document.createElement("div");
    box.id = sel.slice(1);
    box.setAttribute("style", "all:initial;display:block;margin:8px;padding:8px 12px;border:3px solid #c00;background:#fff;color:#000;font:13px/1.5 sans-serif;overflow:auto;position:relative;z-index:2147483647;");
    const h = document.createElement("div");
    h.setAttribute("style", "font-weight:bold;color:#c00;margin-bottom:4px;");
    h.textContent = "【試験が読み取ったダウンロードファイル（CSV）の内容。アプリの画面ではありません】";
    box.appendChild(h);
    表.forEach((x, ti) => {
      const wrap = document.createElement("div");
      wrap.setAttribute("data-csv-table", String(ti));
      wrap.setAttribute("style", "margin-bottom:8px;");
      const t0 = document.createElement("div");
      t0.setAttribute("data-csv-title", String(ti));
      t0.setAttribute("style", "font-weight:bold;margin:4px 0;");
      const n = x.行.length - 1;
      t0.textContent = `${x.題}（データ ${n} 行${n > 最大行数 ? `。先頭 ${最大行数} 行まで表示` : ""}）`;
      wrap.appendChild(t0);
      const t = document.createElement("table");
      t.setAttribute("style", "border-collapse:collapse;");
      const head = x.行[0] ?? [];
      x.行.slice(0, 最大行数 + 1).forEach((r, i) => {
        const tr = document.createElement("tr");
        if (i > 0) tr.setAttribute("data-csv-row", String(i - 1));
        r.forEach((c, ci) => {
          const td = document.createElement(i === 0 ? "th" : "td");
          td.setAttribute("style", "border:1px solid #888;padding:2px 8px;text-align:left;" + (i === 0 ? "background:#eee;" : ""));
          td.setAttribute("data-csv-col", i === 0 ? "" : (head[ci] ?? String(ci)));
          if (i === 0) td.setAttribute("data-csv-head", String(ci));
          td.textContent = c;
          tr.appendChild(td);
        });
        t.appendChild(tr);
      });
      wrap.appendChild(t);
      box.appendChild(wrap);
    });
    document.body.insertBefore(box, document.body.firstChild);
    window.scrollTo(0, 0);
    return true;
  }, { 表, 最大行数, sel: CSV枠 }).catch(() => false);
  if (!ok) throw new Error("CSVの内容を載せる画面が無い（画面が閉じている）");
}

/** CSVの枠（CSVの内容を画面の枠に出す）を外す。無ければ何もしない */
export async function CSVの枠を外す(p: Page): Promise<void> {
  if (p.isClosed()) return;
  await p.evaluate((sel) => document.querySelector(sel)?.remove(), CSV枠).catch(() => undefined);
}

/** CSVの枠の、データ行（0 から数える）の列のセル。列は見出しの名前 */
export function CSVの枠のセル(p: Page, 表の番号: number, データ行の番号: number, 列名: string): import("@playwright/test").Locator {
  return p.locator(`${CSV枠} [data-csv-table="${表の番号}"] tr[data-csv-row="${データ行の番号}"] td[data-csv-col="${列名.replace(/"/g, '\\"')}"]`);
}

/** CSVの枠の、列の全データ行のセル（行の順） */
export function CSVの枠の列(p: Page, 表の番号: number, 列名: string): import("@playwright/test").Locator {
  return p.locator(`${CSV枠} [data-csv-table="${表の番号}"] tr[data-csv-row] td[data-csv-col="${列名.replace(/"/g, '\\"')}"]`);
}

/** CSVの枠の、見出し行の n 番目（0 から）の項目 */
export function CSVの枠の見出し(p: Page, 表の番号: number, 列の番号: number): import("@playwright/test").Locator {
  return p.locator(`${CSV枠} [data-csv-table="${表の番号}"] th[data-csv-head="${列の番号}"]`);
}

/** CSVの枠の題（ファイル名など） */
export function CSVの枠の題(p: Page, 表の番号: number): import("@playwright/test").Locator {
  return p.locator(`${CSV枠} [data-csv-title="${表の番号}"]`);
}

/** CSVの枠の、データ行の全体（行の数・行の有無を確かめる） */
export function CSVの枠のデータ行(p: Page, 表の番号: number): import("@playwright/test").Locator {
  return p.locator(`${CSV枠} [data-csv-table="${表の番号}"] tr[data-csv-row]`);
}

/** 読んだCSV（見出しと、見出し→値の組の行）を、見出し行を先頭にした表（CSVの内容を画面の枠に出すの行）にする */
export function CSVの全行(csv: { 見出し: string[]; 行: Record<string, string>[] }): string[][] {
  return [csv.見出し, ...csv.行.map((r) => csv.見出し.map((k) => r[k] ?? ""))];
}

/**
 * DB で読み取った値（照会の説明と、項目ごとの値）を、画面の上に「注記の枠」として載せて撮り、すぐ外す（足した部品）。
 * アプリの画面ではない（試験が DB から読み取った値）ことを枠の見出しに明記する。画面の他の要素・値は変えない。
 * 撮れても撮れなくても合否は変えない。
 */
export async function DBで読み取った値を撮る(p: Page, 照会: string, 行: string[][], 場面: string): Promise<void> {
  if (MODE === "off" || p.isClosed()) return;
  const ok = await p.evaluate(({ 照会, 行 }) => {
    const box = document.createElement("div");
    box.id = "e2e-db-note";
    box.setAttribute("style", "all:initial;display:block;margin:8px;padding:8px 12px;border:3px solid #c00;background:#fff;color:#000;font:13px/1.5 sans-serif;overflow:auto;position:relative;z-index:2147483647;");
    const h = document.createElement("div");
    h.setAttribute("style", "font-weight:bold;color:#c00;margin-bottom:4px;");
    h.textContent = `【試験が DB から読み取った値。アプリの画面ではありません】照会：${照会}`;
    box.appendChild(h);
    const t = document.createElement("table");
    t.setAttribute("style", "border-collapse:collapse;");
    行.forEach((r, i) => {
      const tr = document.createElement("tr");
      r.forEach((c) => {
        const td = document.createElement(i === 0 ? "th" : "td");
        td.setAttribute("style", "border:1px solid #888;padding:2px 8px;text-align:left;" + (i === 0 ? "background:#eee;" : ""));
        td.textContent = c;
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    box.appendChild(t);
    document.body.insertBefore(box, document.body.firstChild);
    window.scrollTo(0, 0);
    return true;
  }, { 照会, 行 }).catch(() => false);
  if (!ok) return;
  try {
    await 別のブラウザの画面を撮る(p, 場面);
  } finally {
    await p.evaluate(() => document.getElementById("e2e-db-note")?.remove()).catch(() => undefined);
  }
}

/**
 * 画面の裏にある情報（ページの head の対応付けなど、見た目に出ない値）を、画面の上に「注記の枠」として載せて撮り、すぐ外す（足した部品）。
 * アプリの画面ではない（試験がページから読み取った値）ことを枠の見出しに明記する。画面の他の要素・値は変えない。
 * 撮れても撮れなくても合否は変えない。
 */
export async function ページから読み取った値を撮る(p: Page, 見出し: string, 行: string[][], 場面: string): Promise<void> {
  if (MODE === "off" || p.isClosed()) return;
  const ok = await p.evaluate(({ 見出し, 行 }) => {
    const box = document.createElement("div");
    box.id = "e2e-page-note";
    box.setAttribute("style", "all:initial;display:block;margin:8px;padding:8px 12px;border:3px solid #c00;background:#fff;color:#000;font:13px/1.5 sans-serif;overflow:auto;position:relative;z-index:2147483647;");
    const h = document.createElement("div");
    h.setAttribute("style", "font-weight:bold;color:#c00;margin-bottom:4px;");
    h.textContent = `【試験がこのページから読み取った値。画面の見た目ではありません】${見出し}`;
    box.appendChild(h);
    const t = document.createElement("table");
    t.setAttribute("style", "border-collapse:collapse;");
    行.forEach((r, i) => {
      const tr = document.createElement("tr");
      r.forEach((c) => {
        const td = document.createElement(i === 0 ? "th" : "td");
        td.setAttribute("style", "border:1px solid #888;padding:2px 8px;text-align:left;" + (i === 0 ? "background:#eee;" : ""));
        td.textContent = c;
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    box.appendChild(t);
    document.body.insertBefore(box, document.body.firstChild);
    window.scrollTo(0, 0);
    return true;
  }, { 見出し, 行 }).catch(() => false);
  if (!ok) return;
  try {
    await 別のブラウザの画面を撮る(p, 場面);
  } finally {
    await p.evaluate(() => document.getElementById("e2e-page-note")?.remove()).catch(() => undefined);
  }
}

/**
 * CSVの枠の、「検索列が検索値」の行（全行は見出し行を先頭にした読んだCSV）の列のセル。該当の行が無ければ、無い行を指して確かめが落ちる。
 * 同じ値の行が複数あるときは先頭の行
 */
export function CSVの枠の行のセル(p: Page, 表の番号: number, 全行: string[][], 検索列: string, 検索値: string, 列名: string): import("@playwright/test").Locator {
  const ci = (全行[0] ?? []).indexOf(検索列);
  const i = 全行.slice(1).findIndex((r) => ci >= 0 && r[ci] === 検索値);
  return CSVの枠のセル(p, 表の番号, i, 列名);
}
