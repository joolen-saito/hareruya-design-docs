#!/usr/bin/env node
/**
 * エビデンス（e2e/evidence/）の記録から、読むための形を作り直す。
 *   node tools/evidence_index.mjs [--quiet] [機能ID...]      機能IDを省くと、evidence/ にある全機能
 *
 * 作るもの（どれも result.json から決まる。何度流しても同じものができる）
 *   evidence/<機能ID>/<テストID>/evidence.md・evidence.html   ケース1件のエビデンス（手順の文・画面・確かめの合否・エラー）
 *   evidence/<機能ID>/index.md・index.html・results.tsv      機能ごとの一覧
 *   evidence/index.md・index.html・results.tsv              全機能の一覧
 *
 * 結果の決め方
 *   - 自動判定: レポーターが Playwright の結果から決めたもの（合格／不合格／未判定／スキップ）。
 *   - 判定: 人（または担当）が e2e/review/judgements/<機能ID>.tsv に書いたもの。対象の実施日時がエビデンスの実施日時と
 *     同じときだけ使う。違えば「判定が古い」として自動判定を出す（流し直したのに古い判定を引き継がない）。
 *   - 正本との一致: エビデンスを取ったときのケースの中身（使用シード・事前準備・手順・期待結果・実行区分）と、
 *     いまの正本（integration_test/casegen/cases/）が同じか。違えば「要再実行」。
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const E2E = path.resolve(here, "..");
const REPO = path.resolve(E2E, "..");
const ROOT = path.resolve(process.env.E2E_EVIDENCE_DIR || path.join(E2E, "evidence"));
const CASES = path.join(REPO, "integration_test", "casegen", "cases");
const JUDGE = path.join(E2E, "review", "judgements");
const args = process.argv.slice(2);
const quiet = args.includes("--quiet");
const want = args.filter((a) => !a.startsWith("--"));

// ---- 正本の読み込み（lib/catalog.ts と同じ読み方） ----
function parseTsvLine(line) {
  const cells = []; let v = ""; let q = false; let closed = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { v += '"'; i++; } else if (ch === '"') { q = false; closed = true; } else v += ch; }
    else if (ch === "\t") { cells.push(v); v = ""; closed = false; }
    else if (ch === '"' && v === "" && !closed) q = true;
    else v += ch;
  }
  cells.push(v);
  return cells;
}
function readTsv(file) {
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, "utf-8").split(/\r?\n/).filter((l) => l.length > 0);
  const head = parseTsvLine(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(parseTsvLine(l).map((c, i) => [head[i], c])));
}
const fingerprint = (c) => createHash("sha256").update([c.実行区分, c.使用シード, c.事前準備, c.手順, c.期待結果].join("\u0000")).digest("hex").slice(0, 16);
const caseCache = new Map();
function currentCases(fid) {
  if (!caseCache.has(fid)) caseCache.set(fid, new Map(readTsv(path.join(CASES, `${fid}_test_cases.tsv`)).map((r) => [r.テストID, r])));
  return caseCache.get(fid);
}
function judgements(fid) {
  return new Map(readTsv(path.join(JUDGE, `${fid}.tsv`)).filter((r) => r.テストID).map((r) => [r.テストID, r]));
}

// ---- 書き出しの部品 ----
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const md = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
const tsv = (s) => String(s ?? "").replace(/[\t\r\n]+/g, " ").trim();
const splitPre = (s) => String(s ?? "").split(/／(?=[①-⑳])/).map((x) => x.trim()).filter(Boolean);
const firstLine = (s) => String(s ?? "").split("\n").map((x) => x.trim()).find(Boolean) ?? "";
const when = (iso) => String(iso ?? "").replace("T", " ").replace(/\+09:00$/, "");
// 並べて流す回が同時に書くことがあるので、一時ファイルに書いてから置き換える（読む側が書きかけを見ない）
const writeIfChanged = (file, text) => {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf-8") === text) return;
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, file);
};
const RESULT_CLASS = { 合格: "ok", 不合格: "ng", 未判定: "na", スキップ: "skip" };

const CSS = `
:root{--bg:#fbfbfa;--fg:#1d1d1b;--muted:#6b6b66;--line:#dedcd6;--card:#ffffff;--ok:#1f7a3f;--ok-bg:#e3f3e8;--ng:#b42318;--ng-bg:#fde8e6;--na:#8a5a00;--na-bg:#fdf1d6;--skip:#55575c;--skip-bg:#eceef1;--accent:#2f5bd3}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#17181a;--fg:#e8e6e1;--muted:#a09d96;--line:#33343a;--card:#1f2023;--ok:#6fd08f;--ok-bg:#163522;--ng:#ff8b7e;--ng-bg:#3d1b18;--na:#f2c25b;--na-bg:#3a2e12;--skip:#b9bcc2;--skip-bg:#2a2c30;--accent:#8fb0ff}}
:root[data-theme="dark"]{--bg:#17181a;--fg:#e8e6e1;--muted:#a09d96;--line:#33343a;--card:#1f2023;--ok:#6fd08f;--ok-bg:#163522;--ng:#ff8b7e;--ng-bg:#3d1b18;--na:#f2c25b;--na-bg:#3a2e12;--skip:#b9bcc2;--skip-bg:#2a2c30;--accent:#8fb0ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.65 "Hiragino Sans","Noto Sans JP","Yu Gothic UI",system-ui,sans-serif}
main{max-width:1180px;margin:0 auto;padding:24px 16px 64px}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
a{color:var(--accent)}.muted{color:var(--muted)}table{border-collapse:collapse;width:100%;background:var(--card)}th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}th{white-space:nowrap;font-weight:600;background:color-mix(in srgb,var(--line) 35%,transparent)}
.wrap{overflow-x:auto}.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.ok{color:var(--ok);background:var(--ok-bg)}.ng{color:var(--ng);background:var(--ng-bg)}.na{color:var(--na);background:var(--na-bg)}.skip{color:var(--skip);background:var(--skip-bg)}
.scene{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:12px 0}.scene h3{font-size:14px;margin:0 0 6px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.shot{margin:10px 0 0}.shot img{max-width:100%;border:1px solid var(--line);border-radius:4px;display:block}.shot figcaption{font-size:12px;color:var(--muted);word-break:break-all}
pre{white-space:pre-wrap;word-break:break-word;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:10px;font-size:12px;margin:6px 0}
ol,ul{margin:4px 0;padding-left:22px}.kv th{width:160px}.summary{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.summary div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 14px;min-width:96px}.summary b{display:block;font-size:20px}
`;
const page = (title, body) => `<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body><main>\n${body}\n</main></body></html>\n`;
const badge = (r) => `<span class="badge ${RESULT_CLASS[r] ?? "na"}">${esc(r)}</span>`;

// ---- 1件の結果を決める ----
/**
 * 人の判定が自動判定を覆してよい向き。合格と判定できるのは自動判定が合格の実施だけ、不合格と判定できるのは自動判定が不合格の実施だけ
 * （落ちた実施を「E2E の不備だから」と合格にしない。直して流し直す）。未判定へはどれからでも下げられる
 */
export const consistent = (判定, 自動判定) => 判定 === "未判定" || 判定 === 自動判定;
function specHash(rec) {
  const f = path.join(REPO, String(rec.テストコード ?? "").replace(/:\d+$/, ""));
  if (!rec.テストコード || !fs.existsSync(f)) return "";
  return createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16);
}
function judge(rec, cur, j) {
  const 正本 = !cur ? "正本から消えた"
    : fingerprint(cur) !== rec.正本の指紋 ? "正本が変わった（要再実行）"
    : !rec.テストコードの指紋 ? "テストコードの指紋が無い（要再実行）"
    : specHash(rec) !== rec.テストコードの指紋 ? "テストコードが変わった（要再実行）"
    : "一致";
  let 結果 = rec.結果, 区分 = "", 理由 = "", 判定の状態 = "";
  if (j) {
    if (j.対象の実施日時 !== rec.実施日時) 判定の状態 = `判定が古い（${j.対象の実施日時 || "実施日時なし"} の実施への判定）`;
    else if (!consistent(j.判定, rec.結果)) 判定の状態 = `判定が自動判定と合わない（判定 ${j.判定}・自動判定 ${rec.結果}。直して流し直す）`;
    else { 結果 = j.判定 || 結果; 区分 = j.区分 ?? ""; 理由 = j.理由 ?? ""; 判定の状態 = "判定済み"; }
  } else if (rec.結果 === "不合格" || rec.結果 === "未判定") 判定の状態 = "要判定";
  const failed = rec.確かめ.filter((k) => k.結果 === "不合格").map((k) => k.項目);
  const err = firstLine(rec.エラー[0]).replace(/^Error:\s*/, "");
  const 失敗の要約 = rec.結果 === "合格" || rec.結果 === "スキップ" ? (rec.スキップの理由 || "") :
    [rec.落ちた場面 && `${rec.落ちた場面}で停止`, ...failed.map((k) => `✗${k}`), failed.includes(err) ? "" : err].filter(Boolean).join(" / ").slice(0, 400);
  return { 結果, 区分, 理由, 判定の状態, 正本, 失敗の要約 };
}

// ---- ケース1件 ----
function renderCase(dir, rec, v) {
  const shots = rec.場面.reduce((n, s) => n + s.画像.length, 0);
  const meta = [
    ["テストID", rec.テストID + (rec.一覧のテストID && rec.一覧のテストID !== rec.テストID ? `（一覧のテストID ${rec.一覧のテストID}）` : "")],
    ["結果", v.結果 + (v.区分 ? `（${v.区分}）` : "") + (v.判定の状態 ? ` — ${v.判定の状態}` : "")],
    ["自動判定", `${rec.結果}（Playwright: ${rec.Playwrightの結果}${rec.落ちた場面 ? `、${rec.落ちた場面}で停止` : ""}）`],
    ["正本との一致", v.正本],
    ["観点ID", rec.観点ID], ["実行区分", rec.実行区分], ["出典", rec.出典],
    ["実施日時", when(rec.実施日時)], ["所要", `${rec.所要秒}秒`],
    ["環境", `${rec.環境.E2E_ENV}（${rec.環境.接続先}）${rec.環境.実行の形 ? `・${rec.環境.実行の形}` : ""}`], ["E2Eのコミット", rec.E2Eのコミット], ["アプリのコミット", rec.アプリのコミット],
    ["テストコード", rec.テストコード], ["使用シード", rec.使用シード],
  ];
  // Markdown
  const M = [];
  M.push(`# ${rec.テストID} エビデンス`, "", "| 項目 | 内容 |", "| --- | --- |", ...meta.map(([k, x]) => `| ${k} | ${md(x)} |`), "");
  M.push("## 期待結果に対する実際の状態", "", `**期待結果**: ${rec.期待結果}`, "", `**実際の状態**: ${rec.実際の状態 || "（この記録の形では書いていない。流し直すと出る）"}`, "");
  if (v.理由) M.push("## 判定の理由", "", v.理由, "");
  M.push("## 事前準備", "", ...splitPre(rec.事前準備).map((x) => `- ${x}`), "");
  if (rec.控えた番号.length) M.push("### 控えた番号", "", "| 呼び名 | 値 |", "| --- | --- |", ...rec.控えた番号.map(([k, x]) => `| ${md(k)} | ${md(x)} |`), "");
  for (const s of rec.場面) {
    if (s.種類 === "開始時" && s.画像.length === 0) continue;
    const head = s.種類 === "手順" ? `## 手順${s.番号}（${s.状態}）` : s.種類 === "期待結果" ? `## 期待結果（${s.状態}）` : "## 手順1の前の画面";
    M.push(head, "");
    if (s.種類 !== "開始時") M.push(s.文, "");
    if (s.種類 === "手順" && s.確かめ?.length) M.push("手順の中の確かめ:", "", "| 確かめた項目 | 期待 | 実際の状態 | 結果 |", "| --- | --- | --- | --- |", ...s.確かめ.map((k) => `| ${md(k.項目)} | ${md(k.期待 ?? "")} | ${md(k.実際 ?? "")} | ${k.結果 === "合格" ? "○ 合格" : "✗ 不合格"} |`), "");
    if (s.種類 === "期待結果" && rec.確かめ.length) M.push("| 確かめた項目 | 期待 | 実際の状態 | 結果 |", "| --- | --- | --- | --- |", ...rec.確かめ.map((k) => `| ${md(k.項目)} | ${md(k.期待 ?? "")} | ${md(k.実際 ?? "")} | ${k.結果 === "合格" ? "○ 合格" : "✗ 不合格"} |`), "");
    for (const im of s.画像) M.push(`![${md(im.場面)}](${encodeURI(im.file)})`, "", `<sub>${md(im.場面)}${im.URL ? ` — ${md(im.URL)}` : ""}${im.注記 ? ` — ${md(im.注記)}` : ""}</sub>`, "");
    for (const x of s.撮れなかった) M.push(`> 画面を撮れなかった: ${x}`, "");
    if (s.エラー) M.push("```text", s.エラー, "```", "");
  }
  if (rec.注記.length) M.push("## 注記", "", ...rec.注記.map((n) => `- **${n.種類}**: ${n.内容}`), "");
  if (rec.スキップの理由) M.push("## スキップの理由", "", rec.スキップの理由, "");
  if (rec.エラー.length || rec.失敗時の画面.length || rec.trace) {
    M.push("## エラー（Playwright の出力）", "");
    for (const e of rec.エラー) M.push("```text", e, "```", "");
    if (rec.失敗時の画面.length) M.push("落ちたときに Playwright が撮った画面（ケースの画面と、シードを作った別のブラウザセッションの最後の画面）", "");
    for (const f of rec.失敗時の画面) M.push(`![${f}](${encodeURI(f)})`, "");
    if (rec.trace) M.push(`操作の記録: [${rec.trace}](${rec.trace})（\`npx playwright show-trace\` で開く）`, "");
  }
  writeIfChanged(path.join(dir, "evidence.md"), M.join("\n") + "\n");

  // HTML
  const H = [];
  H.push(`<p class="muted"><a href="../index.html">${esc(rec.機能ID)} の一覧</a></p>`, `<h1>${esc(rec.テストID)} ${badge(v.結果)}</h1>`, `<p class="muted">画面 ${shots}枚</p>`);
  H.push(`<div class="wrap"><table class="kv">${meta.map(([k, x]) => `<tr><th>${esc(k)}</th><td>${esc(x)}</td></tr>`).join("")}</table></div>`);
  H.push(`<h2>期待結果に対する実際の状態</h2><div class="wrap"><table class="kv"><tr><th>期待結果</th><td>${esc(rec.期待結果)}</td></tr><tr><th>実際の状態</th><td>${badge(v.結果)} ${esc(rec.実際の状態 || "（この記録の形では書いていない。流し直すと出る）")}</td></tr></table></div>`);
  if (v.理由) H.push(`<h2>判定の理由</h2><p>${esc(v.理由)}</p>`);
  H.push(`<h2>事前準備</h2><ul>${splitPre(rec.事前準備).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
  if (rec.控えた番号.length) H.push(`<div class="wrap"><table><tr><th>控えた番号</th><th>値</th></tr>${rec.控えた番号.map(([k, x]) => `<tr><td>${esc(k)}</td><td>${esc(x)}</td></tr>`).join("")}</table></div>`);
  H.push("<h2>手順と画面</h2>");
  for (const s of rec.場面) {
    if (s.種類 === "開始時" && s.画像.length === 0) continue;
    const st = s.状態 === "済" ? "ok" : s.状態 === "失敗" ? "ng" : "skip";
    const head = s.種類 === "手順" ? `手順${s.番号}` : s.種類 === "期待結果" ? "期待結果" : "手順1の前の画面";
    H.push(`<section class="scene"><h3>${esc(head)} <span class="badge ${st}">${esc(s.状態)}</span>${s.秒 !== undefined ? `<span class="muted">${s.秒}秒</span>` : ""}</h3>`);
    if (s.種類 !== "開始時") H.push(`<div>${esc(s.文)}</div>`);
    if (s.種類 === "手順" && s.確かめ?.length) H.push(`<div class="wrap" style="margin-top:8px"><table><tr><th>手順の中で確かめた項目</th><th>期待</th><th>実際の状態</th><th>結果</th></tr>${s.確かめ.map((k) => `<tr><td>${esc(k.項目)}</td><td>${esc(k.期待 ?? "")}</td><td>${esc(k.実際 ?? "")}</td><td>${badge(k.結果)}</td></tr>`).join("")}</table></div>`);
    if (s.種類 === "期待結果" && rec.確かめ.length) H.push(`<div class="wrap" style="margin-top:8px"><table><tr><th>確かめた項目</th><th>期待</th><th>実際の状態</th><th>結果</th></tr>${rec.確かめ.map((k) => `<tr><td>${esc(k.項目)}${k.エラー ? `<details><summary class="muted">詳細</summary><pre>${esc(k.エラー)}</pre></details>` : ""}</td><td>${esc(k.期待 ?? "")}</td><td>${esc(k.実際 ?? "")}</td><td>${badge(k.結果)}</td></tr>`).join("")}</table></div>`);
    for (const im of s.画像) H.push(`<figure class="shot"><a href="${esc(encodeURI(im.file))}" target="_blank"><img loading="lazy" src="${esc(encodeURI(im.file))}" alt="${esc(im.場面)}"></a><figcaption>${esc(im.場面)}${im.URL ? ` — ${esc(im.URL)}` : ""}${im.注記 ? ` — ${esc(im.注記)}` : ""}</figcaption></figure>`);
    for (const x of s.撮れなかった) H.push(`<p class="muted">画面を撮れなかった: ${esc(x)}</p>`);
    if (s.エラー) H.push(`<details><summary>エラー</summary><pre>${esc(s.エラー)}</pre></details>`);
    H.push("</section>");
  }
  if (rec.注記.length) H.push(`<h2>注記</h2><ul>${rec.注記.map((n) => `<li><b>${esc(n.種類)}</b>: ${esc(n.内容)}</li>`).join("")}</ul>`);
  if (rec.スキップの理由) H.push(`<h2>スキップの理由</h2><p>${esc(rec.スキップの理由)}</p>`);
  if (rec.エラー.length || rec.失敗時の画面.length || rec.trace) {
    H.push("<h2>エラー（Playwright の出力）</h2>", ...rec.エラー.map((e) => `<pre>${esc(e)}</pre>`));
    if (rec.失敗時の画面.length) H.push(`<details><summary>落ちたときに Playwright が撮った画面（${rec.失敗時の画面.length}枚。ケースの画面と、シードを作った別のブラウザセッションの最後の画面）</summary>`, ...rec.失敗時の画面.map((f) => `<figure class="shot"><img loading="lazy" src="${esc(encodeURI(f))}" alt="${esc(f)}"><figcaption>${esc(f)}</figcaption></figure>`), "</details>");
    if (rec.trace) H.push(`<p>操作の記録: <a href="${esc(rec.trace)}">${esc(rec.trace)}</a>（<code>npx playwright show-trace</code> で開く）</p>`);
  }
  writeIfChanged(path.join(dir, "evidence.html"), page(`${rec.テストID} エビデンス`, H.join("\n")));
  return shots;
}

// ---- 一覧 ----
const COLS = ["テストID", "一覧のテストID", "機能ID", "観点ID", "実行区分", "結果", "自動判定", "判定の区分", "判定の理由", "判定の状態", "落ちた場面", "失敗の要約", "正本との一致", "実施日時", "所要秒", "画面の枚数", "エビデンス", "E2Eのコミット", "アプリのコミット", "環境", "期待結果", "実際の状態"];
function rowOf(rec, v, shots, rel) {
  return { テストID: rec.テストID, 一覧のテストID: rec.一覧のテストID, 機能ID: rec.機能ID, 観点ID: rec.観点ID, 実行区分: rec.実行区分, 結果: v.結果, 自動判定: rec.結果,
    判定の区分: v.区分, 判定の理由: v.理由, 判定の状態: v.判定の状態, 落ちた場面: rec.落ちた場面, 失敗の要約: v.失敗の要約, 正本との一致: v.正本, 実施日時: rec.実施日時,
    所要秒: rec.所要秒, 画面の枚数: shots, エビデンス: rel, E2Eのコミット: rec.E2Eのコミット, アプリのコミット: rec.アプリのコミット, 環境: rec.環境.E2E_ENV,
    期待結果: rec.期待結果, 実際の状態: rec.実際の状態 ?? "" };
}
const count = (rows) => { const c = { 合格: 0, 不合格: 0, 未判定: 0, スキップ: 0 }; for (const r of rows) c[r.結果] = (c[r.結果] ?? 0) + 1; return c; };
const stale = (rows) => rows.filter((r) => r.正本との一致 !== "一致").length;
const pending = (rows) => rows.filter((r) => r.判定の状態 && r.判定の状態 !== "判定済み").length;

function writeIndex(dir, title, rows, linkOf, upLink) {
  const c = count(rows);
  const tsvText = [COLS.join("\t"), ...rows.map((r) => COLS.map((k) => tsv(r[k])).join("\t"))].join("\n") + "\n";
  writeIfChanged(path.join(dir, "results.tsv"), tsvText);
  const M = [`# ${title}`, "", `合格 ${c.合格}・不合格 ${c.不合格}・未判定 ${c.未判定}・スキップ ${c.スキップ}（計 ${rows.length}件）。要判定 ${pending(rows)}件・正本と合わない ${stale(rows)}件。`, "",
    "| テストID | 結果 | 判定の状態 | 期待結果に対する実際の状態 | 正本との一致 | 実施日時 | 画面 |", "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((r) => `| [${r.テストID}](${encodeURI(linkOf(r, "md"))}) | ${r.結果}${r.判定の区分 ? `（${md(r.判定の区分)}）` : ""} | ${md(r.判定の状態)} | ${md(r.実際の状態 || r.失敗の要約)} | ${md(r.正本との一致)} | ${when(r.実施日時)} | ${r.画面の枚数} |`)];
  writeIfChanged(path.join(dir, "index.md"), M.join("\n") + "\n");
  const H = [upLink ? `<p class="muted"><a href="${upLink}">全機能の一覧</a></p>` : "", `<h1>${esc(title)}</h1>`,
    `<div class="summary">${["合格", "不合格", "未判定", "スキップ"].map((k) => `<div><span class="badge ${RESULT_CLASS[k]}">${k}</span><b>${c[k]}</b></div>`).join("")}<div><span class="muted">要判定</span><b>${pending(rows)}</b></div><div><span class="muted">正本と合わない</span><b>${stale(rows)}</b></div></div>`,
    `<div class="wrap"><table><tr><th>テストID</th><th>結果</th><th>判定の状態</th><th>期待結果に対する実際の状態</th><th>正本との一致</th><th>実施日時</th><th>画面</th></tr>`,
    ...rows.map((r) => `<tr><td><a href="${esc(encodeURI(linkOf(r, "html")))}">${esc(r.テストID)}</a>${r.一覧のテストID && r.一覧のテストID !== r.テストID ? `<div class="muted">一覧 ${esc(r.一覧のテストID)}</div>` : ""}</td><td>${badge(r.結果)}${r.判定の区分 ? `<div class="muted">${esc(r.判定の区分)}</div>` : ""}</td><td>${esc(r.判定の状態)}</td><td>${esc(r.実際の状態 || r.失敗の要約)}</td><td>${esc(r.正本との一致)}</td><td>${esc(when(r.実施日時))}</td><td>${r.画面の枚数}</td></tr>`),
    "</table></div>"];
  writeIfChanged(path.join(dir, "index.html"), page(title, H.join("\n")));
  return c;
}

// ---- 本体 ----
if (!fs.existsSync(ROOT)) { if (!quiet) console.log(`エビデンスが無い: ${ROOT}`); process.exit(0); }
const fids = (want.length ? want : fs.readdirSync(ROOT).filter((d) => /^[A-Z]\d\d-\d\d$/.test(d))).sort();
for (const fid of fids) {
  const fdir = path.join(ROOT, fid);
  if (!fs.existsSync(fdir)) { if (!quiet) console.log(`${fid}: エビデンスが無い`); continue; }
  const cur = currentCases(fid);
  const J = judgements(fid);
  const rows = [];
  for (const id of fs.readdirSync(fdir).filter((d) => /^IT-/.test(d) && !d.includes(".tmp-")).sort()) {
    const f = path.join(fdir, id, "result.json");
    if (!fs.existsSync(f)) continue;
    const rec = JSON.parse(fs.readFileSync(f, "utf-8"));
    const v = judge(rec, cur.get(id), J.get(id));
    const shots = renderCase(path.join(fdir, id), rec, v);
    rows.push(rowOf(rec, v, shots, `${fid}/${id}/evidence.md`));
  }
  const c = writeIndex(fdir, `${fid} エビデンス`, rows, (r, ext) => `${r.テストID}/evidence.${ext}`, "../index.html");
  if (!quiet) console.log(`${fid}: 合格 ${c.合格}・不合格 ${c.不合格}・未判定 ${c.未判定}・スキップ ${c.スキップ}（要判定 ${pending(rows)}・正本と合わない ${stale(rows)}）`);
}
// 全機能の一覧は、いつも evidence/ にある全機能から作る
const all = [];
for (const fid of fs.readdirSync(ROOT).filter((d) => /^[A-Z]\d\d-\d\d$/.test(d)).sort()) {
  const t = readTsv(path.join(ROOT, fid, "results.tsv"));
  all.push(...t.map((r) => ({ ...r, 画面の枚数: Number(r.画面の枚数) })));
}
const c = writeIndex(ROOT, "E2E エビデンス（全機能）", all, (r, ext) => `${r.機能ID}/${r.テストID}/evidence.${ext}`, "");
if (!quiet) console.log(`全体: 合格 ${c.合格}・不合格 ${c.不合格}・未判定 ${c.未判定}・スキップ ${c.スキップ}（${all.length}件） → ${path.relative(process.cwd(), path.join(ROOT, "index.html"))}`);
