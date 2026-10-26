#!/usr/bin/env node
// シード表の全シードを「マスタ（ダンプに入れる）／ケースで登録する／要確認」に分け、ケースで登録するものの手順書（md）を書く。
// DB・アプリには触らない。使い方: node tools/seed_split.mjs [機能ID…]（省略時は e2e/seeds に作り方のある機能すべて）
//
// 分け方の規則（シード表の「区分」を「・」で分けた語ごとに判定する）:
//  A. 常にマスタの語: 管理者・店舗・所属・メンバー・承認者・在庫区分・各種設定・環境・参照マスタ など、ケースの前提として環境にあればよい参照用のもの。
//  B. 共有可のときだけマスタの語: カテゴリ・部門・棚番号・タグ類・購入グループ・カード。ケース専用（共有可でない）ものは、そのケースが登録して確かめる対象なのでケースで登録する側。
//  C. ケースで登録する語: 商品・規格・在庫・在庫移動・棚卸・受注・イベント・会員・各種ファイル・取込履歴・変動履歴・不存在状態 など。
//  0. 共有可でない（ケース専用）シードは、区分の語によらず「ケースで登録」（依頼者決定 2026-10-23）。マスタ（ダンプに入れる）は共有可のものだけ。
//  判定（共有可のもの）: ケース側の語が1つでもある（マスタ側の語が混ざっていても） → ケースで登録（依頼者決定 2026-10-23）／全部マスタ側 → マスタ／ケース側の語が無く、規則表に無い語を含む → 要確認。
//  形式（ケースで登録するもの）: ファイルの語を含む → CSV等のファイル候補／全部が「不存在・未登録・登録前」の語 → 登録なし（無い状態を保つ）／ほか → 画面入力（手順書）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES = path.resolve(ROOT, "..", "integration_test", "casegen", "cases");

const BASE = new Set(["管理者", "管理者アカウント", "店舗", "支店", "所属", "メンバー", "承認者", "在庫区分", "在庫変動区分", "状態マスター", "商品属性",
  "設定", "環境設定", "環境", "試験環境", "試験環境設定", "基本設定", "アプリケーション設定", "画面設定", "画面表示設定", "一覧設定", "表示件数設定", "採番設定",
  "出力設定", "CSV出力設定", "CSV設定", "外部連携環境", "外部連携設定", "メール環境", "メール確認環境", "マスタ", "マスター", "参照マスタ", "参照マスター",
  "各種マスタ", "業務マスタ", "商品関連マスタ", "検索マスタ", "タグマスタ", "売上分析タグマスタ", "支払方法", "配送方法", "言語", "販売割引率", "通知先", "分類"]);
const REF = new Set(["カテゴリ", "部門", "棚番号", "タグ", "略称タグ", "売上分析タグ", "購入グループ", "カード"]);
const CASE = new Set(["商品", "商品規格", "規格", "在庫", "CSV", "入力ファイル", "取込ファイル", "棚卸計画", "在庫移動", "CSVファイル", "取込履歴", "棚卸詳細", "イベント",
  "在庫変動履歴", "不存在状態", "DB", "在庫移動指示", "不存在条件", "日程", "外部連携", "在庫結合", "在庫分割", "商品在庫", "会員", "承認初期状態", "価格履歴", "振替",
  "スマレジ在庫", "価格変更履歴", "商品タグ", "CSVフィクスチャ", "スマレジ連携", "カード属性", "在庫振替", "申込", "受注", "承認", "入荷通知依頼", "画像", "履歴",
  "在庫分割結合", "登録前状態", "ブラウザ状態", "画面入力値", "デッキ", "集計情報", "タグ未登録状態", "検索データ", "承認待ち", "スマレジ商品", "商品一覧状態", "カード詳細",
  "棚番号状態", "TSV", "ファイル", "インポート履歴", "カスタムCSV設定", "店舗別在庫", "販売数", "価格", "商品画像", "未登録状態", "タグ全体状態", "画面保持状態", "注文明細",
  "買取依頼", "買取依頼サマリ", "TSVファイル", "テキストファイル", "ダウンロード先", "検索パターン", "検索パターン不存在状態", "メール受信箱", "在庫集計", "入庫承認待ち在庫",
  "商品規格拡張", "試験用ファイル", "ブラウザセッション", "個別入力商品", "画面入力状態", "CSV入力値", "テキスト", "表計算ファイル", "画像ファイル", "販売集計", "内外在庫",
  "欠品理由", "入力値", "販売数量", "在庫編集承認", "在庫移動振替", "店頭買取", "ネット買取", "在庫編集承認情報", "在庫変更履歴", "試験ファイル", "日時", "メール"]);
const FILE = /CSV|TSV|ファイル|テキスト|表計算/;
const NEG = /不存在|未登録|登録前/;
const PASSWORD = /パスワード|password/i;

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
function readSeeds(fid) {
  const lines = fs.readFileSync(path.join(CASES, `${fid}_seed_data.tsv`), "utf-8").split(/\r?\n/).filter(Boolean);
  const head = parseTsvLine(lines[0]);
  return lines.slice(1).map((l) => { const c = parseTsvLine(l); return Object.fromEntries(head.map((h, i) => [h, c[i] ?? ""])); });
}

export function classify(seed) {
  const shared = seed["共有"].trim() === "共有可";
  const toks = seed["区分"].split("・").map((s) => s.trim()).filter(Boolean);
  const master = [], casing = [], unknown = [];
  for (const t of toks) {
    if (BASE.has(t)) master.push(t);
    else if (REF.has(t)) (shared ? master : casing).push(t);
    else if (CASE.has(t)) casing.push(t);
    else unknown.push(t);
  }
  let cls, reason;
  if (!shared) { cls = "ケースで登録"; reason = "共有可でない（ケース専用）ため、区分の語によらずケースで登録（依頼者決定 2026-10-23）"; }
  else if (casing.length && master.length) { cls = "ケースで登録"; reason = `ケース側の語（${casing.join("・")}）が混ざるため丸ごとケースで登録（マスタ側の語 ${master.join("・")} も手でその場で作る。依頼者決定 2026-10-23）`; }
  else if (casing.length) { cls = "ケースで登録"; reason = `区分の語がすべてケースで登録する側（${casing.join("・")}${toks.some((t) => REF.has(t)) ? "。共有可でないため" : ""}${unknown.length ? `。規則表に無い語 ${unknown.join("・")} を含む` : ""}）`; }
  else if (unknown.length) { cls = "要確認"; reason = `区分に規則表に無い語がある（${unknown.join("・")}）`; }
  else if (master.length) { cls = "マスタ"; reason = `区分の語がすべてマスタ側（${master.join("・")}${toks.some((t) => REF.has(t)) ? "。共有可のため" : ""}）`; }
  else { cls = "ケースで登録"; reason = `区分の語がすべてケースで登録する側（${casing.join("・")}${toks.some((t) => REF.has(t)) ? "。共有可でないため" : ""}）`; }
  let form = "";
  if (cls === "ケースで登録") form = toks.every((t) => NEG.test(t)) ? "登録なし（無い状態を保つ）" : toks.some((t) => FILE.test(t)) ? "CSV等のファイル候補" : "画面入力（手順書）";
  return { cls, reason, form };
}

const csvResult = new Map();
{
  const f = path.join(ROOT, "review", "csv_make_result.tsv");
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf-8").split("\n").slice(1).filter(Boolean)) { const c = l.split("\t"); csvResult.set(c[1], [c[4], c[6]]); }
}
const setupResult = new Map();
{
  const f = path.join(ROOT, "review", "csv_setup_result.tsv");
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf-8").split("\n").slice(1).filter(Boolean)) { const c = l.split("\t"); setupResult.set(c[1], c[5] ?? ""); }
}
const dbsql = (() => { const f = path.join(ROOT, "review", "db_sql_md.json"); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf-8")) : {}; })();
const runres = new Map();
{
  const f = path.join(ROOT, "review", "db_sql_run_result.tsv");
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf-8").split("\n").slice(1).filter(Boolean)) {
    const c = l.split("\t"); const m = /S-[^/]+\/(db[^/]*\.sql)$/.exec(c[0]); const sd = /(S-[^/]+)\/db[^/]*\.sql$/.exec(c[0]);
    if (m && sd) runres.set(`${sd[1]}/${m[1]}`, c);
  }
}
const _idx = new Map();
function csvIndex(fid) {
  if (_idx.has(fid)) return _idx.get(fid);
  const m = new Map();
  const f = path.join(ROOT, "seed_files", fid, "_csv_index.tsv");
  if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf-8").split("\n").slice(1).filter(Boolean)) {
    const c = l.split("\t"); if (!m.has(c[0])) m.set(c[0], []); m.get(c[0]).push([c[1], c[4] ?? ""]);
  }
  _idx.set(fid, m); return m;
}
function runText(rr) {
  // review/db_sql_run_result.tsv（tools/db_sql_run.py）の1行 → 手順書に書く確かめの結果。実際に確かめたことだけを書く
  if (!rr) return "（試し用DBではまだ流していない）";
  const [, , aRes, aMsg, aCls, bRes, bChanged, bScope, bExpect, bIdem, bNote, verdict, cRes] = rr;
  const a = aRes === "ok" ? `呼び名を置き換えずに（存在しない番号で）流すと${aCls.startsWith("想定どおり") ? "通り、何も変わらない" : aCls.startsWith("このSQLが行を入れた") ? "通り、このSQLが自分で行を入れる（" + aMsg + "。画面のデータに頼らない部分）" : "通る（" + aMsg + "。" + aCls + "）"}`
    : `呼び名を置き換えずに（存在しない番号で）流すと確認で止まる（${aMsg}）${aCls.startsWith("想定どおり") ? "＝画面で作るデータが無いため。想定どおり" : "＝" + aCls}`;
  const prep = "シード表の文（と下の「画面で入れる値」）に書かれた商品コード・店舗名・棚卸名・ファイル名・呼び名から、画面で作るはずの行を試し用に用意して";
  let b = "";
  if (verdict.startsWith("正しく登録しても止まる")) b = `${aCls === verdict ? "" : verdict + "。"}下の「備考」「作れない部分」に書いたとおり、その行を作るシードが無いため、手順書どおりに登録してもこのSQLは確認で止まる（何も変わらない）`;
  else if (verdict.startsWith("シード全体の期待に合わない")) b = `このシードの全ファイルを流す順に流すと、${cRes}。要確認`;
  else if (verdict.startsWith("正しく変わった（シード全体")) b = `${prep}、このシードの全ファイルを流す順に流し、シード表の文から作った期待（${cRes}）を満たすこと、用意した行とこのSQLが入れた行のほかは変わらないこと、もう一度流しても同じことを確かめた（このファイルで変わった行 ${bChanged}）`;
  else if (verdict.startsWith("正しく変わった")) b = `${prep}流し、正しい行が期待どおりの値になること（${bExpect}）、用意した行とこのSQLが入れた行のほかは変わらないこと、もう一度流しても同じことを確かめた（変わった行 ${bChanged}）`;
  else if (verdict.startsWith("用意した行の中だけ")) b = `${prep}流し、変わるのが用意した行とこのSQLが入れた行だけであること、もう一度流しても同じことを確かめた（変わった行 ${bChanged}。値の一つ一つが期待どおりかは確かめていない）`;
  else if (verdict.startsWith("用意して流しても何も変わらない")) b = `${prep}流すと通るが、何も変わらなかった`;
  else if (verdict.startsWith("用意して流しても止まった")) b = `${prep}流すと止まった（${bNote}）`;
  else if (verdict.startsWith("用意できない")) b = `画面で作るはずの行を試し用に用意できなかった（${bNote}）ので、置き換えずに流した結果だけ`;
  else b = `用意して流した結果: ${bRes}・${bScope}・${bExpect}・${bIdem}（${bNote}）。要確認`;
  const pre = /（前提: ([^）]*)。そのシードを先に登録して流す）/.exec(verdict);
  const extra = pre ? `前提: ${pre[1]}。そのシードを先に登録して流す。` : "";
  return `（試し用DB eccubedb_sqltest で確かめた。${a}。${b}。${extra}${bNote && !verdict.startsWith("用意して流しても止まった") && !verdict.startsWith("用意できない") ? "備考: " + bNote + "。" : ""}確かめはすべてロールバックした（行の中身は変えていない。ただし連番（シーケンス）を進める文があると、その値はロールバックしても戻らない））`;
}
function dbSection(sid, fid) {
  const info = dbsql[sid];
  if (!info) return "";
  const out = ["", "## DBへ直接設定する部分（SQL）", ""];
  const made = info.steps.filter((x) => x.status === "ok");
  const ng = info.steps.filter((x) => x.status === "ng");
  const files = Object.keys(info.where);
  if (files.length) {
    out.push("- SQLファイル（流す時点の順）:");
    for (const f of files) {
      const priv = info.where[f] === "private";
      const loc = priv ? `e2e/.runs/seed_files_private/${fid}/${sid}/${f}（認証情報を含むため非公開側。git に入れない）` : `e2e/seed_files/${fid}/${sid}/${f}`;
      out.push(`  - ${loc} ← 流す時点: ${(info.when || {})[f] || "（不明）"}`);
      out.push(`    - ${runText(runres.get(`${sid}/${f}`))}`);
    }
    out.push("- どのファイルも 1つのトランザクション（BEGIN〜COMMIT）。途中で止まれば何も変わらない。商品コード・店舗名などで引く行と、呼び名の番号で指す行は、流す時点で1件に決まることを確かめ、決まらなければ止まる（止まったときのメッセージに実際の件数が出る）。流し直しても壊れない形（同じ行があれば同じ値に揃える／消すのはこのシードの行だけ）で書いてある。全件削除（表全体・取込種別全体を消すもの）は作っていない（下の「SQLを作っていない文」「作れない部分」に、渡したダンプの直後の件数を書いた）。");
    out.push("- 文ごとの流す時点（ファイル）:");
    for (const x of made) out.push(`  - [${x.n}] ${x.sent.slice(0, 90)} → ${x.file}（${x.after}）`);
    out.push(info.labels.length ? `- 流す前に置き換える呼び名: ${info.labels.join("、")}（画面で控えた番号に。SQLの中の〔…〕を番号に書き換える。確認のメッセージの中の〔…〕は置き換えなくても動く）` : "- 流す前に置き換える呼び名: なし");
    out.push("- 流し方（psql の一例。接続先・利用者・パスワードは自分の環境のものを使い、ここには書かない）: `psql -v ON_ERROR_STOP=1 -h <ホスト> -U <利用者> -d <データベース> -f <上のSQLファイル>`");
    const enter = [...new Set(made.flatMap((x) => x.enter || []))];
    if (enter.length) out.push(`- 画面で入れる値（シード表の文に完全な語としては無いが、文の指示から決まる値・画面が必須とする値。この値で入れる）: ${enter.join("、")}`);
    const dups = Object.entries(info.shop_dups || {});
    for (const [nm, regs] of dups) {
      const fns = [...new Set(regs.map((r) => r[0]))];
      const own = regs.filter((r) => r[0] === fid).map((r) => r[1]);
      out.push(`- 注意（店舗名の重なり）: 店舗名「${nm}」の店舗は、${fns.length}つの機能のシード（${regs.map((r) => `${r[1]}（${r[0]}）`).join("・")}）がそれぞれ同じ名前で登録する。複数の機能のシードを1つの環境に入れると店舗名が2件以上になり、店舗名で引くこのSQLは「店舗「${nm}」が1件に決まらない（2件）」などで止まる（何も変わらない）。避け方: (1) 機能ごとに別の環境（ダンプから作り直したDB）で登録する。または (2) 店舗一覧で、この機能のシード（${own.join("・") || "この機能の店舗のシード"}）で登録した「${nm}」の行のIDを控え、SQLの中の \`(SELECT id FROM dtb_base_info WHERE shop_name = '${nm}')\` をすべてその番号に、\`WHERE shop_name = '${nm}'\` を \`WHERE id = <その番号>\` に書き換えてから流す（シードの名前は正本のとおりで、変えない）。`);
    }
    const notes = [...new Set(made.flatMap((x) => x.notes))];
    if (notes.length) out.push("- 備考:\n" + notes.map((n) => `  - ${n}`).join("\n"));
    const um = made.filter((x) => (x.unmade || []).length);
    if (um.length) {
      out.push("- 作った文のうち、作れない部分（SQLに入れていない。手で行うか、状態をそろえられないことに注意）:");
      for (const x of um) for (const u of x.unmade) out.push(`  - [${x.n}] ${u}`);
    }
  } else {
    out.push("- この手順書のDB直接設定の文は、すべて SQL を作っていない（理由は下）。");
  }
  if (ng.length) {
    out.push("- SQLを作っていない文と理由:");
    for (const x of ng) out.push(`  - [${x.n}] ${x.sent.slice(0, 90)} → ${x.reason}${x.gap ? `（区分: 設計と実装の差の候補（${x.gap}））` : ""}`);
  }
  const gaps = made.filter((x) => x.gap);
  for (const x of gaps) out.push(`- [${x.n}] は区分「設計と実装の差の候補（${x.gap}）」に当たる（上の備考・作れない部分を見る）。`);
  out.push("");
  return out.join("\n");
}
function main() {
  let fids = process.argv.slice(2);
  if (!fids.length) {
    fids = [...new Set(fs.readdirSync(path.join(ROOT, "seeds")).map((f) => /^(m\d\d-\d\d)/.exec(f)?.[1]).filter(Boolean))].map((s) => s.toUpperCase()).sort();
  }
  const outDir = path.join(ROOT, "seed_files");
  const privDir = path.join(ROOT, ".runs", "seed_files_private");
  const rows = []; const summary = [];
  for (const fid of fids) {
    const seeds = readSeeds(fid);
    const cnt = { マスタ: 0, ケースで登録: 0, 要確認: 0, csv: 0, 画面: 0, なし: 0 };
    for (const s of seeds) {
      const { cls, reason, form } = classify(s);
      cnt[cls]++;
      if (form.startsWith("CSV")) cnt.csv++; else if (form.startsWith("画面")) cnt.画面++; else if (form.startsWith("登録なし")) cnt.なし++;
      rows.push([fid, s["シードID"], s["論理名"], s["区分"], s["共有"], cls, form, reason]);
      const text = `${s["状態・属性"]}\n${s["投入方法"]}`;
      const priv = PASSWORD.test(text);
      const dir = path.join(priv ? privDir : outDir, fid);
      fs.mkdirSync(dir, { recursive: true });
      const labels = [...new Set((text.match(/〔[^〕]+〕/g) ?? []))];
      const sdir = path.join(outDir, fid, s["シードID"]);
      const walk = (d, pre) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name), `${pre}${e.name}/`) : [`${pre}${e.name}`]) : [];
      const csvFiles = walk(sdir, "").filter((f) => !/^db(_before|_\d+)?\.sql$/.test(f)).sort().map((f) => `${s["シードID"]}/${f}`);
      // CSV作成の結果(tools/csv_make.py)。作ったCSVの中の呼び名〔…〕は、画面が振る番号に置き換える列
      const csvNotes = [];
      for (const f of csvFiles) {
        const raw = fs.readFileSync(path.join(outDir, fid, f));
        let body, sjis = false;
        try { body = new TextDecoder("utf-8", { fatal: true }).decode(raw); } catch { try { body = new TextDecoder("shift_jis").decode(raw); sjis = true; } catch { body = ""; } }
        const ls = [...new Set(body.match(/〔[^〕]+〕/g) ?? [])];
        csvNotes.push(`- ${f}${ls.length ? `: 次の呼び名の所は、その画面で控えた番号に置き換えてから取り込む: ${ls.join("、")}` : ""}${f.includes("/setup/") ? "（準備用。グッズ商品CSV登録で取り込む）" : ""}${sjis && ls.length ? "。このファイルは Shift_JIS。〔…〕を置き換えるときは Shift_JIS のまま保存する（UTF-8 で保存し直さない）" : ""}`);
      }
      const idxNotes = csvIndex(fid).get(s["シードID"]) ?? [];
      for (const [fn, note] of idxNotes) { const n2 = (note ?? "").replace(/^番号の呼び名を含む( ／ )?/, ""); if (n2) csvNotes.push(`  - ${fn} で担当が決めた値・出どころ: ${n2}`); }
      const why = csvResult.get(s["シードID"]);
      const md = [
        `# ${s["シードID"]} ${s["論理名"]}`, "",
        `- 機能: ${fid}／区分: ${s["区分"]}／共有: ${s["共有"] || "（ケース専用）"}／分類: ${cls}${form ? `／形式: ${form}` : ""}`, "",
        "## 状態・属性（シード表の文）", "", s["状態・属性"], "",
        "## 用途（シード表の文）", "", s["用途"], "",
        "## 投入方法（シード表の文）", "", s["投入方法"], "",
        "## 登録するときの注意", "",
        cls === "マスタ" ? "- このシードはマスタ（ダンプに入っている）。マスタの登録そのものを試すときは、上の文のとおりに画面から入力する。文にない操作は足さない。" : form.startsWith("登録なし") ? "- このシードは「無い状態」を保つもの。登録しない（同じものが既にあれば、ケースの前にその状態に戻す）。" : "- 上の文のとおりに、画面から（または下のCSVで）登録する。文にない操作は足さない。",
        // 共有の開発環境で1件しかない設定を書き換えるシードの扱い（2026-10-26 依頼者決定。integration_test/casegen/shared_env/ が投入方法の末尾に書き足した文）
        ...(s["投入方法"].includes("≪共有の設定≫") ? [`- **共有の開発環境で登録するとき**（投入方法の末尾の≪共有の設定≫と同じ）:\n${s["投入方法"].split("≪共有の設定≫").slice(1).map((t) => `  - ${t.replace(/^／|／$/g, "")}`).join("\n")}`] : []),
        labels.length ? `- 画面が振る番号は登録した場所で控える。控える呼び名: ${labels.join("、")}` : "- 画面が振る番号は無い。",
        "- 承認・削除・取込などで状態が変わるシードは、一度使うと元に戻らない。もう一度試すときは同じ内容で登録し直す（商品コードなどが重なって登録できないときは、前のものが残っていないか確かめる）。",
        csvFiles.length ? `- 取込用のファイル（e2e/seed_files/${fid}/ の下。シード表の文から tools/csv_make.py が組んだもの）:\n${csvNotes.join("\n")}` : "",
        why && why[0] !== "完全" ? `- CSVを作れなかった（または一部だけ作れた）理由: ${why[1] || "（理由なし）"}。この部分はシード表の文のとおりに手でCSVを作る。` : "",
        (/グッズ商品CSV登録/.test(s["投入方法"]) && !csvFiles.some((f) => f.includes("/setup/")) && !setupResult.get(s["シードID"]))
          ? `- 準備用のCSV: 作っていない。理由: ${/DBへ直接設定/.test(s["投入方法"]) ? "投入方法がDBへの直接設定と書いている（画面でIDを指定できない）。CSVでは登録しない" : fid === "M03-27" ? "このシード表ではグッズ商品CSV登録そのものが試験対象で、取り込むファイルは上の一覧のとおり" : /見出し|1行|行を|行の/.test(s["投入方法"]) ? "グッズ商品CSV登録で行を書く文の形が読み取りの対象外だった（行の値が表になっているなど）。投入方法の文のとおりに手でCSVを作る" : "グッズ商品CSV登録は操作の説明に出てくるだけで、行の値を書いた文が無い"}。` : "",
        setupResult.get(s["シードID"]) ? `- 準備用のCSVを作れなかった（または一部だけ作れた）理由: ${setupResult.get(s["シードID"])}。この部分は投入方法の文のとおりに手でCSVを作る（グッズ商品CSV登録の雛形ファイルの見出しに合わせる）。` : "",
        "",
      ].join("\n") + dbSection(s["シードID"], fid);
      fs.writeFileSync(path.join(dir, `${s["シードID"]}.md`), md);
    }
    summary.push([fid, seeds.length, cnt.マスタ, cnt.ケースで登録, cnt.csv, cnt.画面, cnt.なし, cnt.要確認]);
  }
  const rev = path.join(ROOT, "review");
  const enc = (a) => a.map((c) => String(c).replace(/[\t\r\n]+/g, " ")).join("\t");
  fs.writeFileSync(path.join(rev, "seed_split.tsv"), [["機能ID", "シードID", "論理名", "区分", "共有", "分類", "形式", "理由"], ...rows].map(enc).join("\n") + "\n");
  fs.writeFileSync(path.join(rev, "seed_split_summary.tsv"), [["機能ID", "シード数", "マスタ", "ケースで登録", "うちCSV等候補", "うち画面入力", "うち登録なし", "要確認"], ...summary].map(enc).join("\n") + "\n");
  console.log(`機能 ${fids.length}／シード ${rows.length}`);
}
main();
