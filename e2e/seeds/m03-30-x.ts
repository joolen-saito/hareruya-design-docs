/**
 * M03-30 基準価格変更CSV登録の続き（-x）の画面シード。正本: cases/M03-30_seed_data.tsv
 * 実施不可の見直し（仕分け直し recheck2。E: 画面で作り、画面で作れない状態だけ E2E の行に DB で書き足す）のケースで使うもの。
 *
 * 作り方（シード表の投入方法の順）:
 * 1. グッズ商品CSV登録で商品を1件登録する（状態ニアミント・セールフラグ無効・販売価格=基準価格の規格が1件できる）。pages/admin/m03_30_products.ts の registerGoodsProduct。
 * 2. 商品マスターで商品コードを検索して商品登録編集画面を開き、規格設定から商品規格一覧を開いて、取込でできた規格の商品規格IDを読む。
 * 3. シード表が足す規格は、商品規格一覧の「新規作成」で登録する（言語=日本語・状態=ニアミント・部門=選択肢の先頭・公開・スマレジ連携しない。addClass）。
 *    高額商品コードもこの画面で入れる。セールフラグ有効の規格は、商品規格登録編集画面でセールフラグを入れ、販売価格をシード表の値にして登録する。
 *    削除済みの規格は、ほかの規格を登録したあとで、商品規格登録編集画面の「商品規格を削除」で消す。
 * 4. 画面で作れない状態だけ、E2E の行に DB で書き足す（依頼者決定 2026-11-10。db/m03_30_x.ts）:
 *    販売価格（セールでない規格は画面では基準価格と同じになる）・価格履歴の0件（登録のときにできた価格履歴を消す）・商品の削除済み（公開状態「廃止」）。
 * 5. 取込ファイル（設計の5列・UTF-8・タブ区切り・LF・末尾に改行1個）を e2e/.state/m03-30-x/<シードの番号>/ に作る。
 *
 * シードでの解釈（記録 review/M03-30_progress_2026-11-11_dev.md にも書く）:
 * - 商品コード・商品名・取込ファイル名には実行の印を付ける（依頼者決定 2026-10-28「案A」）。ファイル名は「<正本の名前>-<印>.tsv」。
 *   ケースはファイル名の書式を確かめず、取込履歴をファイル名で数えるので、前の実行の取込履歴が混ざらないよう印を付けた。
 *   これにより「同名の取込履歴=0件」は、取込履歴を消さなくても成り立つ（DB での削除はしない）。
 * - 原価単価（シード表の 原価単価=300 など）は、商品規格に持つ欄が無く（取込でも出力の形を合わせるための列で、取り込まない作り）、書き足さない。どのケースも確かめない。
 * - 言語ID=1 の有効（S-M03-30-MASTER）は既存の seeds/m03-30.ts のとおり、画面で確かめるだけ。
 * - 026 のゼロ幅の文字は、値の前と後ろの両方に、ゼロ幅スペース（U+200B）とゼロ幅ノーブレークスペース（U+FEFF）をこの順で付けた。
 * - 033 のデータ行の6列目は「1」（正本は値を決めない）。
 * - 023・024 の「引用符外の改行が5009個・5010個」は、見出し行を含めた改行の数（見出し1行＋データ行 5008行・5009行。各行の末尾に改行）。
 */
import fs from "node:fs";
import path from "node:path";
import { Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { adminUrl as adminUrlOf, withAdminSession } from "../lib/session";
import { csvLine } from "../lib/csv";
import { ensureMember } from "../pages/admin/member";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { GOODS_ROOT_CATEGORY_ID } from "../pages/admin/product_masters";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { PriceCsvUploadPage } from "../pages/admin/m03_30_price_csv";
import { 雛形の見出し } from "../pages/admin/m03_30_x";
import * as w from "../db/m03_30_x";
import {
  addClass, classStatusLabel, deleteClassOnEdit, openClassEdit, openClassList, registerGoodsProduct, saveClassEdits,
} from "../pages/admin/m03_30_products";
import { classRowsFromProductEdit, openProductEditByCode, productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { M0330_COLUMNS } from "./m03-30";

type 規格の定め = {
  /** シード表の呼び名（〔商品規格ID-M0330-004B〕など）。控えない規格は書かない */
  呼び名?: string;
  /** 新規作成で足す規格の商品コードの末尾（取込でできる最初の規格は書かない） */
  末尾?: string;
  高額商品コード?: string;
  削除?: boolean;
  /** セールフラグ有効にして、販売価格をこの値にする */
  セール販売価格?: string;
  /** DB で書き足す販売価格 */
  販売価格?: number;
};
type 商品の定め = {
  /** 商品コード・商品名の番号（"001"・"021A" など） */
  番号: string;
  基準価格: number; 買取価格: number;
  商品ID呼び名?: string;
  規格: 規格の定め[];
  廃止?: boolean;
};
type ファイルの定め = {
  名前: string;
  /** データ行（商品の番号の順の商品IDを受け取る） */
  行?: (商品ID: string[]) => string[][];
  /** 書き方の特別（ゼロ幅の文字・6列・行数） */
  形?: "見出しだけ" | "ゼロ幅とCRLF" | "6列" | { 改行の数: number };
};
type シードの定め = { 商品: 商品の定め[]; 価格履歴を0件に?: boolean; ファイル: ファイルの定め };

export type 作った規格 = { 商品規格ID: string; 商品コード: string };
export type 作った商品 = { 商品ID: string; 規格: 作った規格[] };
const 作ったもの = new Map<string, { 商品: 作った商品[]; ファイル: string; ファイル名: string }>();

/** シードが作った商品と取込ファイル（ケースから引く） */
export function 作ったものの(seedId: string): { 商品: 作った商品[]; ファイル: string; ファイル名: string } {
  const v = 作ったもの.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

const DIR = path.join(STATE_DIR, "m03-30-x");
/** 取込ファイル名に実行の印を付ける（<正本の名前>-<印>.tsv） */
export const 印つきのファイル名 = (正本の名前: string): string => `${rc(正本の名前.replace(/\.tsv$/, ""))}.tsv`;

function ファイルを書く(seedId: string, no: string, f: ファイルの定め, 商品ID: string[]): { ファイル: string; ファイル名: string } {
  const dir = path.join(DIR, no);
  fs.mkdirSync(dir, { recursive: true });
  const ファイル名 = 印つきのファイル名(f.名前);
  const header = M0330_COLUMNS.join("\t");
  let text: string;
  if (f.形 === "見出しだけ") {
    text = header + "\n";
  } else if (f.形 === "ゼロ幅とCRLF") {
    const z = (v: string) => `​﻿${v}​﻿`;
    const rows = (f.行 ?? (() => []))(商品ID).map((r) => r.map((v, i) => (i < 4 ? z(v) : v)).join("\t"));
    text = [header, ...rows].join("\r\n") + "\r\n";
  } else if (f.形 === "6列") {
    const rows = (f.行 ?? (() => []))(商品ID).map((r) => [...r, "1"].join("\t"));
    text = [header, ...rows].join("\n") + "\n";
  } else if (f.形 && typeof f.形 === "object") {
    const row = (f.行 ?? (() => []))(商品ID)[0].join("\t");
    const n = f.形.改行の数 - 1; // 見出し行の改行を除いたデータ行の数
    text = header + "\n" + `${row}\n`.repeat(n);
    const count = (text.match(/\n/g) ?? []).length;
    if (count !== f.形.改行の数) throw new Error(`${seedId}: 取込ファイルの改行の数が ${count}（${f.形.改行の数} のはず）`);
  } else {
    const rows = (f.行 ?? (() => []))(商品ID).map((r) => r.join("\t"));
    text = [header, ...rows].join("\n") + "\n";
  }
  const p = path.join(dir, ファイル名);
  fs.writeFileSync(p, text, "utf-8");
  return { ファイル: p, ファイル名 };
}

async function 商品を作る(page: Page, seedId: string, p: 商品の定め, issue: (m: string) => void): Promise<作った商品> {
  const code = rc(`M0330-${p.番号}`);
  const name = rc(`M0330試験商品${p.番号}`);
  await registerGoodsProduct(page, {
    what: seedId, code, nameJp: name, nameEn: name, onIssue: issue,
    values: {
      "言語(ID)": "1", "サイズ": "1", "重量": "1",
      "基準価格": String(p.基準価格), "販売価格": String(p.基準価格), "買取価格": String(p.買取価格), "原価単価": "0", "スマレジ連携フラグ": "0",
    },
  });
  const 商品ID = await openProductEditByCode(page, code);
  const rows = await classRowsFromProductEdit(page, 商品ID);
  if (rows.length !== 1 || rows[0].商品コード !== code || rows[0].状態 !== "NM") {
    throw new Error(`${seedId}: 取込直後の商品規格が、商品コード ${code}・NM の1件でない: ${JSON.stringify(rows)}`);
  }
  await openClassEdit(page, 商品ID, rows[0].商品規格ID);
  const status = await classStatusLabel(page);
  if (status !== "公開") throw new Error(`${seedId}: 取込でできた商品規格の公開ステータスが「${status}」（公開のはず）`);
  const 規格: 作った規格[] = [{ 商品規格ID: rows[0].商品規格ID, 商品コード: code }];
  // 足す規格（取込でできた最初の規格のあと）
  for (const k of p.規格.slice(1)) {
    await openClassList(page, 商品ID);
    const c = rc(`M0330-${p.番号}${k.末尾 ?? ""}`);
    const id = await addClass(page, 商品ID, {
      言語: "日本語", 状態: "ニアミント", 商品コード: c, 基準価格: String(p.基準価格), 販売価格: String(p.基準価格), 買取価格: String(p.買取価格),
      高額商品コード: k.高額商品コード,
    }, `${seedId}: ${c}`, issue);
    規格.push({ 商品規格ID: id, 商品コード: c });
  }
  // セールフラグ有効
  for (const [i, k] of p.規格.entries()) {
    if (k.セール販売価格 === undefined) continue;
    await openClassList(page, 商品ID);
    await openClassEdit(page, 商品ID, 規格[i].商品規格ID);
    await saveClassEdits(page, { セール販売価格: k.セール販売価格 }, `${seedId}: ${規格[i].商品コード} のセール`, issue);
  }
  // 削除済みの規格（ほかを登録したあと）
  for (const [i, k] of p.規格.entries()) {
    if (!k.削除) continue;
    await openClassList(page, 商品ID);
    await openClassEdit(page, 商品ID, 規格[i].商品規格ID);
    await deleteClassOnEdit(page, `${seedId}: ${規格[i].商品コード} の削除`, issue);
  }
  return { 商品ID, 規格 };
}

function 定める(seedId: string, d: シードの定め): void {
  defineSeed(seedId, { needs: ["S-M03-30-MASTER"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 商品 = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const out: 作った商品[] = [];
      for (const p of d.商品) out.push(await 商品を作る(page, seedId, p, issue));
      return out;
    });
    // 画面で作れない状態だけ、E2E の行に DB で書き足す
    for (const [pi, p] of d.商品.entries()) {
      for (const [ki, k] of p.規格.entries()) {
        if (k.販売価格 !== undefined) w.販売価格を書き足す(seedId, [商品[pi].規格[ki]], k.販売価格);
      }
      if (p.廃止) w.商品を廃止にする(seedId, 商品[pi].商品ID, 商品[pi].規格[0].商品コード);
    }
    if (d.価格履歴を0件に) {
      const n = w.価格履歴を消す(seedId, 商品.flatMap((x) => x.規格));
      issue(`価格履歴=0件は画面で作れないので、登録のときにできた価格履歴 ${n} 件を DB で消した（E2E の規格の行だけ）`);
    }
    issue("原価単価は商品規格に持つ欄が無い（取込でも取り込まない列）ので、書き足していない（ケースは確かめない）");
    // 呼び名（シード表が定めるものだけ控える）
    const 定め = getSeed(seedId)["状態・属性"] + getSeed(seedId).投入方法;
    const 控える = (呼び名: string | undefined, 値: string) => { if (呼び名 && 定め.includes(呼び名)) notes.set(呼び名, 値); };
    for (const [pi, p] of d.商品.entries()) {
      控える(p.商品ID呼び名, 商品[pi].商品ID);
      for (const [ki, k] of p.規格.entries()) 控える(k.呼び名, 商品[pi].規格[ki].商品規格ID);
    }
    const f = ファイルを書く(seedId, d.商品[0].番号, d.ファイル, 商品.map((x) => x.商品ID));
    作ったもの.set(seedId, { 商品, ...f });
  });
}

// ---- 1商品・1規格（よくある形） ----
const 普通 = (no: string, o: { セール?: string; 販売価格?: number | null; 基準価格?: number; 買取価格?: number; 履歴0?: boolean; 廃止?: boolean; ファイル: ファイルの定め }): void => {
  const 番号 = no.replace(/^.*-/, "");
  const 定め: 規格の定め = { 呼び名: `〔商品規格ID-M0330-${番号}〕` };
  if (o.セール) 定め.セール販売価格 = o.セール;
  else if (o.販売価格 !== null) 定め.販売価格 = o.販売価格 ?? 900;
  定める(`S-M03-30-${no}`, {
    商品: [{ 番号, 基準価格: o.基準価格 ?? 1000, 買取価格: o.買取価格 ?? 400, 商品ID呼び名: `〔商品ID-M0330-${番号}〕`, 規格: [定め], 廃止: o.廃止 }],
    価格履歴を0件に: o.履歴0, ファイル: o.ファイル,
  });
};
const 一行 = (基準: string, 買取: string, 原価: string, 言語 = "1") => (ids: string[]) => [[ids[0], 言語, 基準, 買取, 原価]];

普通("DATA-001", { 履歴0: true, ファイル: { 名前: "normal.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-002", { セール: "800", 履歴0: true, ファイル: { 名前: "sale.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-003", { セール: "800", ファイル: { 名前: "sale_alert.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-007", { ファイル: { 名前: "max.tsv", 行: 一行("999999999", "999999999", "999999999") } });
普通("DATA-009", { ファイル: { 名前: "zero.tsv", 行: 一行("0", "0", "0") } });
普通("DATA-013", { ファイル: { 名前: "invalid_language.tsv", 行: 一行("1200", "500", "350", "999") } });
普通("DATA-015", { 廃止: true, ファイル: { 名前: "deleted_product.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-020", { ファイル: { 名前: "header_only.tsv", 形: "見出しだけ" } });
普通("DATA-022", { ファイル: { 名前: "cutoff.tsv", 行: (ids) => [["999999999", "1", "1200", "500", "350"], [ids[0], "1", "1000", "1001", "350"]] } });
普通("DATA-023", { ファイル: { 名前: "rows_5009-023.tsv", 行: 一行("1200", "500", "350"), 形: { 改行の数: 5009 } } });
普通("DATA-024", { ファイル: { 名前: "rows_5010-024.tsv", 行: 一行("1200", "500", "350"), 形: { 改行の数: 5010 } } });
普通("DATA-026", { ファイル: { 名前: "normalize.tsv", 行: 一行("1200", "500", "350"), 形: "ゼロ幅とCRLF" } });
普通("DATA-027", { セール: "800", 履歴0: true, ファイル: { 名前: "buy_history.tsv", 行: 一行("1000", "500", "350") } });
普通("DATA-028", { 履歴0: true, ファイル: { 名前: "sell_history.tsv", 行: 一行("1000", "400", "300") } });
普通("DATA-029", { 販売価格: null, 履歴0: true, ファイル: { 名前: "unchanged.tsv", 行: 一行("1000", "400", "300") } });
普通("DATA-030", { ファイル: { 名前: "history_success.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-031", { ファイル: { 名前: "success_transition.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-033", { ファイル: { 名前: "wrong_columns_transition.tsv", 行: 一行("1200", "500", "350"), 形: "6列" } });
普通("DATA-034", { ファイル: { 名前: "token-034.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-035", { ファイル: { 名前: "unexpected-035.tsv", 行: 一行("1200", "500", "350") } });
普通("DATA-036", { ファイル: { 名前: "form-036.tsv", 行: 一行("1200", "500", "350") } });
普通("BOTH-086", { 履歴0: true, ファイル: { 名前: "dp-m0330-086.tsv", 行: 一行("1300", "600", "350") } });
普通("EQUAL-087", { 基準価格: 800, 販売価格: null, 履歴0: true, ファイル: { 名前: "dp-m0330-087.tsv", 行: 一行("1000", "1000", "300") } });
普通("AGAIN-088", { 履歴0: true, ファイル: { 名前: "dp-m0330-088.tsv", 行: 一行("1200", "500", "350") } });
普通("AGAIN-089", { 履歴0: true, ファイル: { 名前: "dp-m0330-089.tsv", 行: 一行("1200", "500", "350") } });
普通("DUP-090", { 履歴0: true, ファイル: { 名前: "dp-m0330-090.tsv", 行: (ids) => [[ids[0], "1", "1200", "500", "350"], [ids[0], "1", "1500", "700", "350"]] } });

// ---- 複数の規格（削除済み・高額商品コード） ----
定める("S-M03-30-DATA-004", {
  商品: [{
    番号: "004", 基準価格: 1000, 買取価格: 400, 商品ID呼び名: "〔商品ID-M0330-004〕",
    規格: [
      { 呼び名: "〔商品規格ID-M0330-004A〕", 販売価格: 900 },
      { 呼び名: "〔商品規格ID-M0330-004B〕", 末尾: "B", 販売価格: 900 },
      { 呼び名: "〔商品規格ID-M0330-004C〕", 末尾: "C", 削除: true, 販売価格: 900 },
      { 呼び名: "〔商品規格ID-M0330-004D〕", 末尾: "D", 高額商品コード: "M0330H004", 販売価格: 900 },
    ],
  }],
  ファイル: { 名前: "filter.tsv", 行: 一行("1300", "600", "400") },
});
for (const no of ["005", "006"]) {
  定める(`S-M03-30-DATA-${no}`, {
    商品: [{
      番号: no, 基準価格: 1000, 買取価格: 400, 商品ID呼び名: `〔商品ID-M0330-${no}〕`,
      規格: [
        { 呼び名: `〔商品規格ID-M0330-${no}A〕`, 削除: true, 販売価格: 900 },
        { 呼び名: `〔商品規格ID-M0330-${no}B〕`, 末尾: "B", 高額商品コード: `M0330H${no}`, 販売価格: 900 },
      ],
    }],
    価格履歴を0件に: true,
    ファイル: { 名前: no === "005" ? "no_target.tsv" : "no_target_success.tsv", 行: 一行("1300", "600", "400") },
  });
}

// ---- 2商品 ----
定める("S-M03-30-DATA-021", {
  商品: [
    { 番号: "021A", 基準価格: 1000, 買取価格: 400, 商品ID呼び名: "〔商品ID-M0330-021A〕", 規格: [{ 呼び名: "〔商品規格ID-M0330-021A〕", 販売価格: 900 }] },
    { 番号: "021B", 基準価格: 1000, 買取価格: 400, 商品ID呼び名: "〔商品ID-M0330-021B〕", 規格: [{ 呼び名: "〔商品規格ID-M0330-021B〕" }] },
  ],
  価格履歴を0件に: true,
  ファイル: { 名前: "rollback.tsv", 行: (ids) => [[ids[0], "1", "1200", "500", "350"], ["999999999", "1", "1200", "500", "350"], [ids[1], "1", "1300", "600", "400"]] },
});
for (const no of ["077", "078"]) {
  定める(`S-M03-30-${no === "077" ? "MULTI" : "MULTIH"}-${no}`, {
    商品: [
      { 番号: `${no}A`, 基準価格: 1000, 買取価格: 400, 商品ID呼び名: `〔商品ID-M0330-${no}A〕`, 規格: [{ 呼び名: `〔商品規格ID-M0330-${no}A〕`, 販売価格: 900 }] },
      { 番号: `${no}B`, 基準価格: 2000, 買取価格: 800, 商品ID呼び名: `〔商品ID-M0330-${no}B〕`, 規格: [{ 呼び名: `〔商品規格ID-M0330-${no}B〕`, 販売価格: 1800 }] },
    ],
    価格履歴を0件に: true,
    ファイル: { 名前: `dp-m0330-${no}.tsv`, 行: (ids) => [[ids[0], "1", "1200", "500", "350"], [ids[1], "1", "2200", "900", "700"]] },
  });
}
定める("S-M03-30-MIX-079", {
  商品: [
    { 番号: "079A", 基準価格: 1000, 買取価格: 400, 商品ID呼び名: "〔商品ID-M0330-079A〕", 規格: [{ 呼び名: "〔商品規格ID-M0330-079A〕", 販売価格: 900 }] },
    { 番号: "079B", 基準価格: 1000, 買取価格: 400, 商品ID呼び名: "〔商品ID-M0330-079B〕", 規格: [{ 呼び名: "〔商品規格ID-M0330-079B〕", セール販売価格: "800" }] },
  ],
  価格履歴を0件に: true,
  ファイル: { 名前: "dp-m0330-079.tsv", 行: (ids) => [[ids[0], "1", "1200", "500", "350"], [ids[1], "1", "1200", "500", "350"]] },
});

// ---- 092・093（基準価格変更の結果を、価格履歴の検索・在庫検索で見る。RB-） ----
//
// シードでの解釈:
// - 「東京本店」は、開発環境の本店（店舗ID 1。店名は画面から読む）に読み替える（M05-01 の「店舗A＝本店」と同じ）。新しい店舗は作らない。
// - S-M03-30-RB-MASTER の CSV取込の区切り文字・囲み文字・アップロードサイズ上限（アプリの設定ファイル）は、シード表のとおり共有の開発環境では書き換えない。
//   言語ID=1・購入グループ「通常商品」・本店があることを画面で確かめるだけ。
// - 取込ファイル m0330rb001.csv・m0330rb002.csv は、画面の雛形の見出し行の下に、見出しの列ごとの値を書く。アプリの雛形に「原価単価」の列が無いので、
//   原価単価=350 は書けない（書かない）。ケースは原価単価を確かめない。
// - 「該当があれば削除して0件にする」は、商品コードに実行の印を付けるので、該当が無いこと（0件）を確かめるだけ（削除はしない）。
// - 試験管理者の表示名「M03-30連携試験管理者」は期待結果が見るので、印を付けない。ログインID m0330rb も印を付けない（開発環境に同じログインIDのメンバーは無い 2026-11-11）。
export const RB_ADMIN = { loginId: "m0330rb", password: "Passw0rd-M0330R" };
export const RB_ADMIN_NAME = "M03-30連携試験管理者";
let 本店名 = "";
export const 本店の店名 = (): string => { if (!本店名) throw new Error("本店の店名をまだ読んでいない（S-M03-30-RB-MASTER）"); return 本店名; };

defineSeed("S-M03-30-RB-MASTER", { needs: ["S-M03-30-MASTER"] }, async ({ browser }) => {
  const issue = (m: string) => reportSeedIssue("S-M03-30-RB-MASTER", m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    本店名 = await storeNameById(page, "1");
    const groups = await page.goto(adminUrlOf("/product/sell_group")).then(() => page.locator(".sell-group-master-list tbody tr td:first-child a").allInnerTexts());
    if (!groups.map((g) => g.trim()).includes("通常商品")) throw new Error("S-M03-30-RB-MASTER: 購入グループに「通常商品」が無い");
  });
  issue(`東京本店は開発環境の本店（店舗ID 1「${本店名}」）に読み替えた。CSV取込の区切り文字・囲み文字・アップロードサイズ上限（アプリの設定ファイル）は共有の開発環境では書き換えない（シード表のとおり）。言語ID=1 は S-M03-30-MASTER で確かめた`);
});

defineSeed("S-M03-30-RB-ADM", { needs: ["S-M03-30-RB-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, {
      名前: RB_ADMIN_NAME, 所属店舗: 本店の店名(), ログインID: RB_ADMIN.loginId, メールアドレス: "m0330rb@example.test",
      パスワード: RB_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: 本店の店名(), 編集可能店舗: [本店の店名()],
    });
  });
});

const RB作ったもの = new Map<string, { 商品ID: string; 商品コード: string; ファイル: string; ファイル名: string }>();
export function RBの(seedId: string): { 商品ID: string; 商品コード: string; ファイル: string; ファイル名: string } {
  const v = RB作ったもの.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

for (const [no, 番号] of [["092", "001"], ["093", "002"]] as const) {
  const seedId = `S-M03-30-RB-DATA-${no}`;
  defineSeed(seedId, { needs: ["S-M03-30-RB-MASTER", "S-M03-30-RB-ADM"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const code = rc(`M0330RB-${番号}`);
    const name = rc(`M03-30 RB価格商品-${番号}`);
    const got = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const before = await productIdsByCode(page, code);
      if (before.length) throw new Error(`${seedId}: 商品コード ${code} の商品が既にある（${before.join("、")}）`);
      await registerGoodsCsv(page, {
        what: `${seedId}: グッズ商品CSV登録`, fileName: `${code}-base.csv`, categoryId: GOODS_ROOT_CATEGORY_ID,
        common: { "購入グループ名称": "通常商品" },
        lines: [{ code, nameJp: name, nameEn: `${name}E`, values: {
          "言語(ID)": "1", "サイズ": "200", "重量": "148", "基準価格": "1000", "販売価格": "1000", "買取価格": "400", "原価単価": "300", "スマレジ連携フラグ": "0",
        } }],
        onWarning: (m) => issue(`グッズ商品CSV登録の警告「${m}」`),
      });
      const 商品ID = await openProductEditByCode(page, code);
      const upload = new PriceCsvUploadPage(page, "基準価格変更");
      await upload.open();
      const 見出し = await 雛形の見出し(page, path.join(DIR, `rb${no}`));
      return { 商品ID, 見出し };
    });
    const 値: Record<string, string> = { "商品ID": got.商品ID, "言語ID": "1", "基準価格": "1200", "買取価格": "500", "原価単価": "350" };
    const 書けない = Object.keys(値).filter((k) => !got.見出し.includes(k));
    if (書けない.length) issue(`画面の雛形の見出しに無い列（${書けない.join("・")}）の値は書けないので書かない（見出し: ${got.見出し.join("・")}）`);
    const ファイル名 = `${rc(`m0330rb${番号}`)}.csv`;
    const dir = path.join(DIR, `rb${no}`);
    fs.mkdirSync(dir, { recursive: true });
    const ファイル = path.join(dir, ファイル名);
    fs.writeFileSync(ファイル, [csvLine(got.見出し), csvLine(got.見出し.map((h) => 値[h] ?? ""))].join("\n") + "\n", "utf-8");
    notes.set(`〔商品ID-M0330-RB${番号}〕`, got.商品ID);
    RB作ったもの.set(seedId, { 商品ID: got.商品ID, 商品コード: code, ファイル, ファイル名 });
  });
}
