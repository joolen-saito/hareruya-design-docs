/**
 * M03-31 セール用価格変更CSV登録の続き（-x）の画面シード。正本: cases/M03-31_seed_data.tsv
 * 実施不可の見直し（仕分け直し recheck2）で流せる見込みになったケースで使うもの。記録: review/M03-31_progress_2026-11-11_dev.md
 *
 * 作り方（シード表の投入方法の順）:
 * 1. グッズ商品CSV登録で商品を1件登録する（状態ニアミント・セールフラグ無効・販売価格=基準価格の規格が1件できる）。pages/admin/m03_30_products.ts の registerGoodsProduct。
 * 2. 商品マスターで商品コードを検索して商品登録編集画面を開き、規格設定から商品規格一覧を開いて、取込でできた規格の商品規格IDを読む。
 * 3. 商品規格登録編集画面で、セールフラグ・販売価格・帯URL をシード表の値にして登録する（saveClassEdits）。足す規格は商品規格一覧の「新規作成」（addClass）。
 * 4. 画面で作れない状態だけ、E2E の行に DB で書き足す（依頼者決定 2026-11-10。db/m03_31_x.ts・db/m03_30_x.ts）:
 *    規格の状態 SP・販売価格（セールでない規格は画面では基準価格と同じになる）・価格履歴の0件・商品の削除済み（公開状態「廃止」）。
 * 5. 取込ファイル（設計書の7列「商品ID」「言語ID」「販売価格」「買取価格」「セールフラグ」「帯URL」「タグ(ID)」・UTF-8・カンマ区切り・LF・末尾に改行1個）を
 *    e2e/.state/m03-31-x/<シードの番号>/ に作る。RB-・CB- のシードは、シード表のとおり画面の雛形の見出し行の下に値を書く。
 *
 * シードでの解釈（記録にも書く）:
 * - 商品コード・商品名・取込ファイル名には実行の印を付ける（依頼者決定 2026-10-28「案A」）。ファイル名は「<正本の名前>-<印>.csv」。
 *   ケースはファイル名の書式を確かめず、取込履歴をファイル名で数えるので、前の実行の取込履歴が混ざらない。
 *   これにより「同名の取込履歴=0件」は、取込履歴を消さなくても成り立つ（DB での削除はしない。0件であることを確かめる）。
 * - 「割引率に率が100%の選択肢、買取減額率に率が100%の選択肢を選ぶ」: 開発環境の割引率・買取減額率に、SP の率が 1.00 の選択肢が無い（2026-11-11 に確かめた）。
 *   商品登録編集画面を保存せず、割引率・買取減額率を未設定のままにする（アプリは割引率の未設定を率1として販売価格を計算する。
 *   買取減額率の未設定は、SP の規格の買取価格を買取価格表から求める）。判断待ちに書く。
 * - 言語ID=1 の有効は、既存の S-M03-31-MASTERS（seeds/m03-31.ts）のとおり画面で確かめるだけ。
 * - 045 の「言語ID 933045 が未登録」は、言語のマスタに無いことを確かめるだけ（あれば止める。消さない）。
 * - 049・050 の2行目の「タグID 933049（933050）」の行の、正本が書かないほかの列は、言語ID=1・販売価格1500・買取価格600・セールフラグ1・帯URL空にした。
 *   3行目（049）・1行目（050）の「正常値」は、言語ID=1・販売価格1500・買取価格600・セールフラグ1・帯URL空・タグ空にした。
 * - 054 のゼロ幅空白は、商品IDの先頭と、1桁目と2桁目のあいだに U+200B を入れた。
 * - 東京本店は、開発環境の本店（店舗ID 1。店名は画面から読む）に読み替える（M03-30 の RB- と同じ）。新しい店舗は作らない。
 *   CSV取込の区切り文字・囲み文字・アップロードサイズ上限（アプリの設定ファイル）は、シード表のとおり共有の開発環境では書き換えない。
 * - RB-ADM の表示名「M03-31連携試験管理者」は期待結果が見るので、印を付けない。ログインID m0331rb も印を付けない（開発環境に同じログインIDのメンバーは無い 2026-11-11）。
 *   権限は「商品管理と在庫管理を操作できる」をシステム管理者で読む。
 */
import fs from "node:fs";
import path from "node:path";
import { Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { csvLine } from "../lib/csv";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { adminUrl, withAdminSession } from "../lib/session";
import * as w30 from "../db/m03_30_x";
import * as price from "../db/m03_30_price";
import * as w from "../db/m03_31_x";
import { ensureMember } from "../pages/admin/member";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { GOODS_ROOT_CATEGORY_ID } from "../pages/admin/product_masters";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readLanguageChoicesFromClassForm } from "../pages/admin/m03_01_product_class";
import { PriceCsvUploadPage } from "../pages/admin/m03_30_price_csv";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { セール用の雛形の見出し } from "../pages/admin/m03_31_x";
import { TagPage } from "../pages/admin/m03_13_tag";
import { addClass, openClassEdit, openClassList, registerGoodsProduct, saveClassEdits } from "../pages/admin/m03_30_products";
import { classRowsFromProductEdit, openProductEditByCode, productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { BELT, M0331_COLUMNS } from "./m03-31";

const DIR = path.join(STATE_DIR, "m03-31-x");
/** 取込ファイル名に実行の印を付ける（<正本の名前>-<印>.csv） */
export const 印つきのファイル名 = (正本の名前: string): string => `${rc(正本の名前.replace(/\.csv$/, ""))}.csv`;

const TAG_A = "〔タグID-M0331-共有A〕";
const TAG_B = "〔タグID-M0331-共有B〕";
const TAG_C = "〔タグID-M0331-共有C〕";

// ---- 設計書の7列のシード（DATA-・DPDATA-） ----

type 規格の定め = {
  /** シード表の呼び名（〔商品規格ID-M0331-080A〕など） */
  呼び名: string;
  /** 投入方法が同じ規格を別の呼び名でも書くとき（080 の投入方法は規格Aを〔商品規格ID-M0331-080〕と書く） */
  別の呼び名?: string;
  /** 新規作成で足す規格の商品コードの末尾（取込でできる最初の規格は書かない） */
  末尾?: string;
  /** セールフラグ有効にして、販売価格をこの値にする */
  セール販売価格?: string;
  帯URL?: string;
  /** DB で書き足す販売価格（セールでない規格） */
  販売価格?: number;
  SP?: boolean;
};
type 商品の定め = {
  /** 商品コード・商品名の番号（"001"・"049A" など） */
  番号: string;
  商品ID呼び名: string;
  基準価格: number; 買取価格: number;
  タグA?: boolean;
  規格: 規格の定め[];
  廃止?: boolean;
};
/** 7列の1行。〔…〕の呼び名は控えた番号に置き換える */
type Row7 = [string, string, string, string, string, string, string];
type シードの定め = {
  商品: 商品の定め[];
  価格履歴を0件に?: boolean;
  /** 状態・属性に書かれた取込ファイルの名前 */
  ファイル名: string;
  行: Row7[];
  形?: "ゼロ幅" | { データ行の数: number };
  /** タグ登録画面の一覧に、このIDの行が無いことを確かめる */
  無いタグID?: string;
  /** 言語のマスタに、この番号が無いことを確かめる */
  無い言語ID?: string;
};

export type 作った規格 = { 商品規格ID: string; 商品コード: string };
export type 作った商品 = { 商品ID: string; 規格: 作った規格[] };
type 作ったもの = { 商品: 作った商品[]; ファイル: string; ファイル名: string };
const 作ったものの表 = new Map<string, 作ったもの>();

/** シードが作った商品と取込ファイル（ケースから引く） */
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作ったものの表.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

function 定めの文(seedId: string): string {
  const s = getSeed(seedId);
  return s["状態・属性"] + s.投入方法;
}

/** 取込ファイルを書く。行の値は、正本の状態・属性に書かれた値（呼び名・空でない値）であることを確かめてから、呼び名を控えた番号に置き換える */
function ファイルを書く(seedId: string, no: string, d: シードの定め, notes: Notes): { ファイル: string; ファイル名: string } {
  const attrs = getSeed(seedId)["状態・属性"];
  if (!attrs.includes(d.ファイル名)) throw new Error(`${seedId}: シード表の状態・属性にファイル名 ${d.ファイル名} が無い`);
  for (const row of d.行) for (const v of row) {
    for (const part of v.split(",")) if (part && part !== "1" && part !== "0" && !attrs.includes(part)) throw new Error(`${seedId}: シード表の状態・属性に値「${part}」が無い`);
  }
  const resolve = (v: string) => v.replace(/〔[^〕]+〕/g, (l) => notes.get(l));
  let rows = d.行.map((r) => r.map(resolve));
  if (d.形 === "ゼロ幅") {
    // 商品IDの先頭と、1桁目と2桁目のあいだに U+200B
    rows = rows.map((r) => [`​${r[0].slice(0, 1)}​${r[0].slice(1)}`, ...r.slice(1)]);
  } else if (d.形 && typeof d.形 === "object") {
    const n = d.形.データ行の数;
    rows = Array.from({ length: n }, () => rows[0]);
  }
  const text = [M0331_COLUMNS, ...rows].map((r) => csvLine(r)).join("\n") + "\n";
  if (d.形 && typeof d.形 === "object") {
    const count = (text.match(/\n/g) ?? []).length;
    if (count !== d.形.データ行の数 + 1) throw new Error(`${seedId}: 取込ファイルの行の数が ${count}（見出し1行とデータ ${d.形.データ行の数} 行のはず）`);
  }
  const dir = path.join(DIR, no);
  fs.mkdirSync(dir, { recursive: true });
  const ファイル名 = 印つきのファイル名(d.ファイル名);
  const ファイル = path.join(dir, ファイル名);
  fs.writeFileSync(ファイル, text, "utf-8");
  return { ファイル, ファイル名 };
}

async function 商品を作る(page: Page, seedId: string, p: 商品の定め, notes: Notes, issue: (m: string) => void): Promise<作った商品> {
  const code = rc(`M0331-${p.番号}`);
  const name = rc(`M0331試験商品${p.番号}`);
  const before = await productIdsByCode(page, code);
  if (before.length) throw new Error(`${seedId}: 商品コード ${code} の商品が既にある（${before.join("、")}）`);
  await registerGoodsProduct(page, {
    what: seedId, code, nameJp: name, nameEn: name, onIssue: issue,
    values: {
      "言語(ID)": "1", "サイズ": "1", "重量": "1",
      "基準価格": String(p.基準価格), "販売価格": String(p.基準価格), "買取価格": String(p.買取価格),
      "タグ(ID)": p.タグA ? notes.get(TAG_A) : "", "スマレジ連携フラグ": "0",
    },
  });
  const 商品ID = await openProductEditByCode(page, code);
  const rows = await classRowsFromProductEdit(page, 商品ID);
  if (rows.length !== 1 || rows[0].商品コード !== code || rows[0].状態 !== "NM") {
    throw new Error(`${seedId}: 取込直後の商品規格が、商品コード ${code}・NM の1件でない: ${JSON.stringify(rows)}`);
  }
  const 規格: 作った規格[] = [{ 商品規格ID: rows[0].商品規格ID, 商品コード: code }];
  // 取込でできた規格の帯URL・セール（足す規格より先に。シード表の順）
  const first = p.規格[0];
  if (first.帯URL !== undefined || first.セール販売価格 !== undefined) {
    await openClassEdit(page, 商品ID, rows[0].商品規格ID);
    await saveClassEdits(page, { 帯URL: first.帯URL, セール販売価格: first.セール販売価格 }, `${seedId}: ${code}`, issue);
  }
  // 足す規格（言語=日本語・状態=ニアミント・部門=選択肢の先頭・公開。セールフラグ有効のものは登録後に入れる）
  for (const k of p.規格.slice(1)) {
    await openClassList(page, 商品ID);
    const c = rc(`M0331-${p.番号}${k.末尾 ?? ""}`);
    const id = await addClass(page, 商品ID, {
      言語: "日本語", 状態: "ニアミント", 商品コード: c, 基準価格: String(p.基準価格), 販売価格: k.セール販売価格 ?? String(p.基準価格), 買取価格: String(p.買取価格),
    }, `${seedId}: ${c}`, issue);
    if (k.セール販売価格 !== undefined || k.帯URL !== undefined) {
      await saveClassEdits(page, { 帯URL: k.帯URL, セール販売価格: k.セール販売価格 }, `${seedId}: ${c} のセール`, issue);
    }
    規格.push({ 商品規格ID: id, 商品コード: c });
  }
  return { 商品ID, 規格 };
}

function 定める(seedId: string, d: シードの定め): void {
  const needs = ["S-M03-31-MASTERS"];
  defineSeed(seedId, { needs }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 文 = 定めの文(seedId);
    if (d.無い言語ID && w.言語がある(d.無い言語ID)) throw new Error(`${seedId}: 言語のマスタに番号 ${d.無い言語ID} がある（未登録のはず。消さずに止める）`);
    const 商品 = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const out: 作った商品[] = [];
      for (const p of d.商品) out.push(await 商品を作る(page, seedId, p, notes, issue));
      if (d.無いタグID) {
        const tag = new TagPage(page);
        await tag.showFirstPageWith("12000");
        if ((await tag.allRows()).some((r) => r.ID === d.無いタグID)) throw new Error(`${seedId}: タグ登録画面の一覧に、IDが${d.無いタグID}の行がある（未登録のはず）`);
      }
      return out;
    });
    if (文.includes("率が100%の選択肢")) {
      issue("開発環境の割引率・買取減額率に、SP の率が 1.00 の選択肢が無いので、商品登録編集画面を保存せず、割引率・買取減額率を未設定のままにした（アプリは割引率の未設定を率1として計算する。買取減額率の未設定は、SP の規格の買取価格を買取価格表から求める）");
      for (const x of 商品) {
        const s = w.商品の割引の設定(x.商品ID);
        if (s.割引率 || s.買取減額率) throw new Error(`${seedId}: グッズ商品CSV登録でできた商品 ${x.商品ID} に割引率・買取減額率が設定されている（${JSON.stringify(s)}）`);
      }
    }
    // 画面で作れない状態だけ、E2E の行に DB で書き足す
    for (const [pi, p] of d.商品.entries()) {
      for (const [ki, k] of p.規格.entries()) {
        if (k.販売価格 !== undefined) w30.販売価格を書き足す(seedId, [商品[pi].規格[ki]], k.販売価格);
      }
      const sp = p.規格.map((k, ki) => (k.SP ? 商品[pi].規格[ki] : null)).filter((x): x is 作った規格 => x !== null);
      if (sp.length) { w.状態をSPにする(seedId, sp); issue(`規格の状態 SP は画面で指定できないので、DB で書き足した（E2E の規格 ${sp.map((k) => k.商品規格ID).join("・")} だけ）`); }
      if (p.廃止) { w30.商品を廃止にする(seedId, 商品[pi].商品ID, 商品[pi].規格[0].商品コード); issue("商品の削除済みは、画面の削除が商品を消すので、DB で公開状態を「廃止」にした（E2E の商品だけ）"); }
    }
    if (d.価格履歴を0件に) {
      const n = w30.価格履歴を消す(seedId, 商品.flatMap((x) => x.規格));
      issue(`価格履歴=0件は画面で作れないので、登録・編集のときにできた価格履歴 ${n} 件を DB で消した（E2E の規格の行だけ）`);
    }
    // 呼び名（シード表が定めるものだけ控える）
    for (const [pi, p] of d.商品.entries()) {
      if (文.includes(p.商品ID呼び名)) notes.set(p.商品ID呼び名, 商品[pi].商品ID);
      for (const [ki, k] of p.規格.entries()) {
        for (const l of [k.呼び名, k.別の呼び名]) if (l && 文.includes(l)) notes.set(l, 商品[pi].規格[ki].商品規格ID);
      }
    }
    const no = seedId.replace(/^.*-/, "");
    const f = ファイルを書く(seedId, no, d, notes);
    if (price.取込履歴の件数("セール用価格変更", f.ファイル名) !== 0) throw new Error(`${seedId}: ファイル名 ${f.ファイル名} の取込履歴が既にある`);
    作ったものの表.set(seedId, { 商品, ...f });
  });
}

const P = (番号: string) => `〔商品ID-M0331-${番号}〕`;
const K = (番号: string) => `〔商品規格ID-M0331-${番号}〕`;

/** 1商品・1規格（よくある形） */
function 普通(seedId: string, o: {
  販売?: number; セール?: string; SP?: boolean; 買取?: number; 履歴0?: boolean; 廃止?: boolean; タグA?: boolean; 帯URL?: string;
  ファイル名: string; 行: (p: string) => Row7[]; 形?: シードの定め["形"]; 無いタグID?: string; 無い言語ID?: string;
}): void {
  const 番号 = seedId.replace(/^.*-/, "");
  定める(seedId, {
    商品: [{
      番号, 商品ID呼び名: P(番号), 基準価格: 2000, 買取価格: o.買取 ?? 500, タグA: o.タグA, 廃止: o.廃止,
      規格: [{ 呼び名: K(番号), セール販売価格: o.セール, 販売価格: o.販売, SP: o.SP, 帯URL: o.帯URL }],
    }],
    価格履歴を0件に: o.履歴0, ファイル名: o.ファイル名, 行: o.行(P(番号)), 形: o.形, 無いタグID: o.無いタグID, 無い言語ID: o.無い言語ID,
  });
}
const 一行 = (販売: string, 買取: string, セール: string, 言語 = "1", 帯 = "", タグ = "") => (p: string): Row7[] => [[p, 言語, 販売, 買取, セール, 帯, タグ]];

// 001〜006（SP 規格のセール切り替え）
普通("S-M03-31-DATA-001", { SP: true, ファイル名: "normal-to-sale-001.csv", 行: 一行("1234", "777", "1") });
普通("S-M03-31-DATA-002", { SP: true, セール: "1500", ファイル名: "sale-to-sale-002.csv", 行: 一行("1333", "666", "1") });
普通("S-M03-31-DATA-003", { SP: true, セール: "1500", ファイル名: "sale-to-normal-003.csv", 行: 一行("9999", "700", "0") });
普通("S-M03-31-DATA-004", { SP: true, セール: "1500", ファイル名: "sale-to-normal-004.csv", 行: 一行("9999", "700", "0") });
普通("S-M03-31-DATA-005", { SP: true, ファイル名: "normal-to-normal-005.csv", 行: 一行("9999", "700", "0") });
普通("S-M03-31-DATA-006", { SP: true, ファイル名: "normal-to-normal-006.csv", 行: 一行("9999", "700", "0") });
// 017〜020・029（価格履歴・取込履歴。NM 規格）
普通("S-M03-31-DATA-017", { セール: "1500", 履歴0: true, ファイル名: "sell-only-change-017.csv", 行: 一行("1600", "500", "1") });
普通("S-M03-31-DATA-018", { セール: "1500", 履歴0: true, ファイル名: "buy-only-change-018.csv", 行: 一行("1500", "600", "1") });
普通("S-M03-31-DATA-019", { セール: "1500", 履歴0: true, ファイル名: "no-price-change-019.csv", 行: 一行("1500", "500", "1") });
普通("S-M03-31-DATA-020", { セール: "1500", ファイル名: "history-success-020.csv", 行: 一行("1500", "500", "1") });
普通("S-M03-31-DATA-029", { ファイル名: "rows-5009-029.csv", 行: 一行("2000", "500", "0"), 形: { データ行の数: 5008 } });
// 045（未登録の言語ID）・054（ゼロ幅空白）
普通("S-M03-31-DATA-045", { ファイル名: "unknown-language-045.csv", 行: 一行("1500", "500", "1", "933045"), 無い言語ID: "933045" });
普通("S-M03-31-DATA-054", { ファイル名: "zero-width-space-054.csv", 行: 一行("1500", "500", "1"), 形: "ゼロ幅" });
// 069・070（削除済みの商品）
普通("S-M03-31-DATA-069", { 廃止: true, ファイル名: "M0331-069-deleted.csv", 行: 一行("1234", "500", "1") });
普通("S-M03-31-DATA-070", { 廃止: true, ファイル名: "M0331-070-deleted.csv", 行: 一行("1234", "500", "1") });

// 049・050（不備行での巻き戻し。2商品）
for (const no of ["049", "050"] as const) {
  const 二商品 = (行: (a: string, b: string) => Row7[]): シードの定め => ({
    商品: (["A", "B"] as const).map((s) => ({
      番号: `${no}${s}`, 商品ID呼び名: P(`${no}${s}`), 基準価格: 2000, 買取価格: 500, タグA: true,
      規格: [{ 呼び名: K(`${no}${s}`), 帯URL: BELT.before }],
    })),
    ファイル名: `rollback-${no}.csv`, 行: 行(P(`${no}A`), P(`${no}B`)), 無いタグID: `933${no}`,
  });
  const 不備 = `933${no}`;
  定める(`S-M03-31-DATA-${no}`, no === "049"
    ? 二商品((a, b) => [[a, "1", "1500", "600", "1", BELT.sale, TAG_B], [a, "1", "1500", "600", "1", "", 不備], [b, "1", "1500", "600", "1", "", ""]])
    : 二商品((a, b) => [[a, "1", "1500", "600", "1", "", ""], [a, "1", "1500", "600", "1", "", 不備], [b, "1", "1500", "600", "1", "", TAG_B]]));
}

// 077〜083（SP 規格。データパターン）
定める("S-M03-31-DPDATA-077", {
  商品: (["A", "B", "C"] as const).map((s) => ({
    番号: `077${s}`, 商品ID呼び名: P(`077${s}`), 基準価格: 2000, 買取価格: 500, 規格: [{ 呼び名: K(`077${s}`), SP: true }],
  })),
  ファイル名: "multi-rows-077.csv",
  行: [[P("077A"), "1", "1300", "700", "1", "", ""], [P("077B"), "1", "1400", "800", "1", "", ""], [P("077C"), "1", "1500", "900", "1", "", ""]],
});
普通("S-M03-31-DPDATA-078", { SP: true, 販売: 500, 買取: 200, ファイル名: "equal-price-078.csv", 行: 一行("1000", "1000", "1") });
普通("S-M03-31-DPDATA-079", { SP: true, セール: "1500", 履歴0: true, ファイル名: "both-change-079.csv", 行: 一行("1600", "600", "1") });
定める("S-M03-31-DPDATA-080", {
  商品: [{
    番号: "080", 商品ID呼び名: P("080"), 基準価格: 2000, 買取価格: 500,
    規格: [{ 呼び名: K("080A"), 別の呼び名: K("080"), セール販売価格: "1500", SP: true }, { 呼び名: K("080B"), 末尾: "B", セール販売価格: "1600", SP: true }],
  }],
  価格履歴を0件に: true, ファイル名: "mixed-change-080.csv", 行: [[P("080"), "1", "1600", "500", "1", "", ""]],
});
普通("S-M03-31-DPDATA-081", { SP: true, ファイル名: "tag-none-081.csv", 行: 一行("1300", "700", "1", "1", "", `${TAG_B},${TAG_C}`) });
普通("S-M03-31-DPDATA-082", { SP: true, 履歴0: true, ファイル名: "twice-same-082.csv", 行: 一行("1300", "700", "1") });
普通("S-M03-31-DPDATA-083", { SP: true, セール: "1500", ファイル名: "sale-off-twice-083.csv", 行: 一行("9999", "700", "0") });

// ---- 084〜088・095〜098（雛形の見出しで作る。RB-・CB-） ----

export const RB_ADMIN = { loginId: "m0331rb", password: "Passw0rd-M0331R" };
export const RB_ADMIN_NAME = "M03-31連携試験管理者";
let 本店名 = "";
/** 本店（店舗ID 1）の店名。まだ読んでいなければ画面から読む */
export async function 本店の店名(page: Page): Promise<string> {
  if (!本店名) 本店名 = await storeNameById(page, "1");
  return 本店名;
}

defineSeed("S-M03-31-RB-MASTER", async ({ browser }) => {
  const issue = (m: string) => reportSeedIssue("S-M03-31-RB-MASTER", m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 本店の店名(page);
    await page.goto(adminUrl("/product/sell_group"));
    const groups = await page.locator(".sell-group-master-list tbody tr td:first-child a").allInnerTexts();
    if (!groups.map((g) => g.trim()).includes("通常商品")) throw new Error("S-M03-31-RB-MASTER: 購入グループに「通常商品」が無い");
    const languages = await readLanguageChoicesFromClassForm(page);
    if (!languages.some((l) => l.id === "1" && l.label === "日本語")) throw new Error(`S-M03-31-RB-MASTER: 商品規格の登録画面の言語の欄に、値1の「日本語」が無い: ${JSON.stringify(languages)}`);
  });
  issue(`東京本店は開発環境の本店（店舗ID 1「${本店名}」）に読み替えた。言語ID=1（日本語）・購入グループ「通常商品」があることを画面で確かめた。` +
    "CSV取込の区切り文字・囲み文字・アップロードサイズ上限（アプリの設定ファイル）と商品カテゴリID=2 の階層は、共有の開発環境では書き換えない（シード表のとおり。カテゴリは既存の番号2を使う）");
});

defineSeed("S-M03-31-RB-ADM", { needs: ["S-M03-31-RB-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 店 = await 本店の店名(page);
    await ensureMember(page, {
      名前: RB_ADMIN_NAME, 所属店舗: 店, ログインID: RB_ADMIN.loginId, メールアドレス: "m0331rb@example.test",
      パスワード: RB_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: 店, 編集可能店舗: [店],
    });
  });
  reportSeedIssue("S-M03-31-RB-ADM", "「商品管理と在庫管理を操作できる」権限は、システム管理者で読んだ。デフォルト検索表示店舗は開発環境の本店");
});

type RBの定め = {
  /** 正本の商品コード（印を付ける前） */
  商品コード: string;
  商品名: string; 商品名英: string;
  基準価格: string; 買取価格: string;
  /** 規格を開いてセールフラグ有効・販売価格にする */
  セール販売価格?: string;
  商品ID呼び名: string;
  /** 取込ファイル名（印を付ける前）と、雛形の見出しの列ごとの値（〔商品ID〕は控えた番号） */
  ファイル名: string;
  値: { 販売価格: string; 買取価格: string; セールフラグ: string };
  在庫の行を確かめる?: boolean;
};
export type RBで作ったもの = { 商品ID: string; 商品コード: string; 商品名: string; ファイル: string; ファイル名: string };
const RB作ったもの = new Map<string, RBで作ったもの>();
export function RBの(seedId: string): RBで作ったもの {
  const v = RB作ったもの.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

/** 雛形の見出し（アプリの名前）を、シード表の列の名前に合わせて読む（「言語(ID)」→「言語ID」） */
const 列の名前 = (h: string) => h.replace(/[()（）]/g, "").replace(/^タグID$/, "タグ(ID)");

function RBを定める(seedId: string, d: RBの定め): void {
  defineSeed(seedId, { needs: ["S-M03-31-RB-MASTER"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 文 = 定めの文(seedId);
    for (const s of [d.商品コード, d.商品名, `基準価格=${d.基準価格}`, d.ファイル名, `販売価格=${d.値.販売価格}`, `買取価格=${d.値.買取価格}`, `セールフラグ=${d.値.セールフラグ}`]) {
      if (!文.includes(s)) throw new Error(`${seedId}: シード表に「${s}」が無い`);
    }
    const code = rc(d.商品コード);
    const name = rc(d.商品名);
    const got = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const before = await productIdsByCode(page, code);
      if (before.length) throw new Error(`${seedId}: 商品コード ${code} の商品が既にある（${before.join("、")}）`);
      await registerGoodsCsv(page, {
        what: `${seedId}: グッズ商品CSV登録`, fileName: `${code}-base.csv`, categoryId: GOODS_ROOT_CATEGORY_ID,
        common: { "購入グループ名称": "通常商品" },
        lines: [{ code, nameJp: name, nameEn: rc(d.商品名英), values: {
          "言語(ID)": "1", "サイズ": "200", "重量": "148", "基準価格": d.基準価格, "販売価格": d.基準価格, "買取価格": d.買取価格, "原価単価": "300", "スマレジ連携フラグ": "0",
        } }],
        onWarning: (m) => issue(`グッズ商品CSV登録の警告「${m}」`),
      });
      const 商品ID = await openProductEditByCode(page, code);
      if (d.セール販売価格 !== undefined) {
        const rows = await classRowsFromProductEdit(page, 商品ID);
        const nm = rows.filter((r) => r.言語 === "日本語" && r.状態 === "NM");
        if (nm.length !== 1) throw new Error(`${seedId}: 商品規格一覧の言語日本語・状態NMの行が1件でない: ${JSON.stringify(rows)}`);
        await openClassEdit(page, 商品ID, nm[0].商品規格ID);
        await saveClassEdits(page, { セール販売価格: d.セール販売価格 }, `${seedId}: ${code} のセール`, issue);
      }
      if (d.在庫の行を確かめる) {
        const 店 = await 本店の店名(page);
        const list = await searchStockByCode(page, { 商品コード: code, 店舗: 店, 在庫区分: "EC-CUBE" });
        const n = await list.row(code, 店, "EC-CUBE").count();
        if (n !== 1) throw new Error(`${seedId}: 在庫検索一覧で、店舗「${店}」・在庫区分 EC-CUBE・コード ${code} の行が ${n} 件（1件のはず）`);
      }
      const upload = new PriceCsvUploadPage(page, "セール用価格変更");
      await upload.open();
      const 見出し = await セール用の雛形の見出し(page, path.join(DIR, seedId.replace(/^.*-/, "")));
      return { 商品ID, 見出し };
    });
    const 値: Record<string, string> = {
      "商品ID": got.商品ID, "言語ID": "1", "販売価格": d.値.販売価格, "買取価格": d.値.買取価格, "セールフラグ": d.値.セールフラグ, "帯URL": "", "タグ(ID)": "",
    };
    const 列 = got.見出し.map(列の名前);
    const 書けない = Object.keys(値).filter((k) => !列.includes(k));
    if (書けない.length) issue(`画面の雛形の見出しに無い列（${書けない.join("・")}）の値は書けないので書かない（見出し: ${got.見出し.join("・")}）`);
    const 余り = 列.filter((k) => !(k in 値));
    if (余り.length) issue(`画面の雛形の見出しにある、シード表が書かない列（${余り.join("・")}）は空にした`);
    const ファイル名 = 印つきのファイル名(d.ファイル名);
    const dir = path.join(DIR, seedId.replace(/^.*-/, ""));
    fs.mkdirSync(dir, { recursive: true });
    const ファイル = path.join(dir, ファイル名);
    fs.writeFileSync(ファイル, [csvLine(got.見出し), csvLine(列.map((h) => 値[h] ?? ""))].join("\n") + "\n", "utf-8");
    if (文.includes(d.商品ID呼び名)) notes.set(d.商品ID呼び名, got.商品ID);
    RB作ったもの.set(seedId, { 商品ID: got.商品ID, 商品コード: code, 商品名: name, ファイル, ファイル名 });
  });
}

RBを定める("S-M03-31-RB-DATA-084", {
  商品コード: "M0331RB-001", 商品名: "M03-31 RB価格商品-001", 商品名英: "M03-31 RB価格商品-001E", 基準価格: "1500", 買取価格: "400", 商品ID呼び名: "〔商品ID-M0331-RB001〕",
  ファイル名: "m0331rb001.csv", 値: { 販売価格: "1200", 買取価格: "400", セールフラグ: "1" },
});
RBを定める("S-M03-31-RB-DATA-085", {
  商品コード: "M0331RB-002", 商品名: "M03-31 RB価格商品-002", 商品名英: "M03-31 RB価格商品-002E", 基準価格: "1500", 買取価格: "400", 商品ID呼び名: "〔商品ID-M0331-RB002〕",
  ファイル名: "m0331rb002.csv", 値: { 販売価格: "1200", 買取価格: "400", セールフラグ: "1" }, 在庫の行を確かめる: true,
});
const CB = (no: string, o: { 基準価格: string; 買取価格: string; セール販売価格?: string; 値: RBの定め["値"] }): RBの定め => ({
  商品コード: `M0331-CB${no}-A`, 商品名: `M0331-CB${no}-A商品`, 商品名英: `M0331-CB${no}-AItem`, 基準価格: o.基準価格, 買取価格: o.買取価格,
  セール販売価格: o.セール販売価格, 商品ID呼び名: `〔商品ID-M0331-${no}〕`, ファイル名: `cb-m0331-${no}.csv`, 値: o.値,
});
RBを定める("S-M03-31-CBSALE-088", CB("088", { 基準価格: "2000", 買取価格: "400", 値: { 販売価格: "1500", 買取価格: "600", セールフラグ: "0" } }));
RBを定める("S-M03-31-CBPRC-095", CB("095", { 基準価格: "20000", 買取価格: "500", 値: { 販売価格: "20000", 買取価格: "1234", セールフラグ: "1" } }));
RBを定める("S-M03-31-CBHIST-096", CB("096", { 基準価格: "1500", 買取価格: "400", 値: { 販売価格: "1200", 買取価格: "450", セールフラグ: "0" } }));
RBを定める("S-M03-31-CBHIST-097", CB("097", { 基準価格: "2000", 買取価格: "400", セール販売価格: "1500", 値: { 販売価格: "1300", 買取価格: "400", セールフラグ: "0" } }));
RBを定める("S-M03-31-CBHIST-098", CB("098", { 基準価格: "2000", 買取価格: "400", セール販売価格: "1500", 値: { 販売価格: "1500", 買取価格: "450", セールフラグ: "1" } }));
