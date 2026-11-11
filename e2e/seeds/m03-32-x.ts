/**
 * M03-32 高額商品価格変更CSV登録の続き（-x）の画面シード。正本: cases/M03-32_seed_data.tsv
 * 実施不可の見直し（仕分け直し recheck2）で流せる見込みになったケースで使うもの。記録: review/M03-32_progress_2026-11-11_dev.md
 *
 * 作り方（シード表の投入方法の順）:
 * 1. グッズ商品CSV登録で商品を1件登録する（状態ニアミント・セールフラグ無効・販売価格=基準価格の規格が1件できる）。pages/admin/m03_30_products.ts の registerGoodsProduct。
 * 2. 商品マスターで商品コードを検索して商品登録編集画面を開き、取込でできた規格を商品規格登録編集画面で登録する
 *    （高額商品コード・セールフラグ・基準価格・販売価格・買取価格・部門は選択肢の先頭・公開。pages/admin/m03_32_high_price_csv.ts の registerHighPriceClass）。
 * 3. シード表が画面で定める変更（規格の商品コードの書き換え・規格の廃止・商品の廃止）を画面で行う（pages/admin/m03_32_x.ts・f01_02_setup.ts）。
 * 4. 画面で作れない状態だけ、E2E の行に DB で書き足す（依頼者決定 2026-11-10。db/m03_30_x.ts・db/m03_32_x.ts）:
 *    販売価格（セールでない規格は画面では基準価格と同じになる）・価格履歴の0件・更新日時。
 * 5. 取込ファイル（見出し「商品コード,基準価格」・UTF-8・カンマ区切り・LF・末尾に改行1個）を e2e/.state/m03-32-x/<シードの番号>/ に作る。
 *
 * シードでの解釈（記録にも書く）:
 * - 商品コード・商品名・高額商品コード・取込ファイル名には実行の印を付ける（依頼者決定 2026-10-28「案A」）。ファイル名は「<正本の名前>-<印>.<拡張子>」。
 *   取込ファイルの中の商品コードも、同じ印を付けた値で書く。未登録であることが前提の商品コード（UNKNOWN-…）には付けない（未登録であることを確かめる）。
 * - 「対象種別の取込履歴0件」「同名取込履歴0件」は、取込履歴を消さず、印つきのファイル名の取込履歴が0件であることを確かめる（DB での削除はしない）。
 *   ケースは取込履歴をこのファイル名で数える（ほかの方やほかのケースの取込が混ざらない）。
 * - 「高額商品コードに任意の値」は HP-M0332-<番号> に印を付けた値にした。
 * - 「1行目「…」、2行目「…」」と書かれた取込ファイルは、見出し「商品コード,基準価格」の下のデータの1行目・2行目と読んだ（ほかの取込ファイルと同じ形）。
 *   見出しが書かれていない取込ファイル（029・030・032・033 など）も、この機能のCSVのフォーマットの見出し（設計書・雛形と同じ）を先頭に書いた。
 * - 031 のバイト順マークは見出しの「商品」と「コード」のあいだ、ゼロ幅スペースは商品コードの「HIGH-N-」と「0001」のあいだに入れた。
 * - 042・043 の同じ商品コードの規格2件は、シード表のとおり別の商品の規格の商品コードを画面で書き換えて作り、DB の参照で2件あることを確かめる
 *   （シード表は「重複商品コード確認」の画面で確かめるとするが、参照で同じことを確かめた）。
 * - RB-・CB- の東京本店は、開発環境の本店（店舗ID 1。店名は画面から読む）に読み替える（M03-30・M03-31 と同じ）。新しい店舗は作らない。
 *   言語ID=1・商品カテゴリID=2・購入グループ「通常商品」は、あることを確かめるだけ。CSV取込の区切り文字などのアプリの設定は書き換えない。
 * - RB-DATA-076・077 の部門「RB部門-32001」「RB部門-32002」は作らず、規格の部門は選択肢の先頭にした（部門を登録するとアプリがスマレジへ部門を送る。
 *   スマレジは後回しの決定）。期待結果は部門を見ない。判断待ちに書く（条件付き）。
 * - RB-ADM の表示名「M03-32連携試験管理者」は期待結果が見るので、印を付けない。ログインID m0332rb も印を付けない（開発環境に同じログインIDのメンバーは無い 2026-11-11）。
 *   権限は「商品管理と在庫管理を操作できる」をシステム管理者で読む。
 * - RB-・CB- の「該当があれば削除して0件にする」は、印つきの商品コードで該当が0件であることを確かめるだけ（削除しない。あれば止める）。
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
import * as x from "../db/m03_32_x";
import { 取込種別, 取込履歴の件数, 商品規格の状態 } from "../db/m03_32_high_price";
import { ensureMember } from "../pages/admin/member";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { GOODS_ROOT_CATEGORY_ID } from "../pages/admin/product_masters";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readLanguageChoicesFromClassForm } from "../pages/admin/m03_01_product_class";
import { encodeShiftJis } from "../pages/admin/m03_41_csv_file";
import { searchStockByCode } from "../pages/admin/m04_02_rc_stock";
import { registerHighPriceClass } from "../pages/admin/m03_32_high_price_csv";
import { registerGoodsProduct } from "../pages/admin/m03_30_products";
import { openProductEditByCode, productIdsByCode } from "../pages/admin/m03_23_seed_products";
import { タグを付けて商品を登録する } from "../pages/admin/f01_02_setup";
import { 規格の商品コードを変える, 規格を廃止にする, 高額の雛形の見出し } from "../pages/admin/m03_32_x";

const DIR = path.join(STATE_DIR, "m03-32-x");
/** この機能のCSVのフォーマットの見出し（設計書・雛形と同じ） */
const HEADER = ["商品コード", "基準価格"];

/** 取込ファイル名に実行の印を付ける（<正本の名前>-<印>.<拡張子>） */
export const 印つきのファイル名 = (正本の名前: string): string => {
  const ext = path.extname(正本の名前);
  return `${rc(path.basename(正本の名前, ext))}${ext}`;
};

function 定めの文(seedId: string): string {
  const s = getSeed(seedId);
  return s["状態・属性"] + s.投入方法;
}
function 文にある(seedId: string, parts: string[]): void {
  const 文 = 定めの文(seedId);
  for (const p of parts) if (!文.includes(p)) throw new Error(`${seedId}: シード表に「${p}」が無い`);
}

// ---- DATA-・DPDATA-（グッズ商品CSV登録＋商品規格登録編集画面） ----

type 規格の定め = {
  /** 呼び名の番号（"004"・"022A" など。〔商品ID-M0332-<呼び>〕〔商品規格ID-M0332-<呼び>〕） */
  呼び: string;
  /** 正本の商品コード（登録のときの商品コード） */
  商品コード: string;
  /** 正本の高額商品コード。"任意" は HP-M0332-<呼び>。null は未設定 */
  高額: string | null;
  セール?: boolean;
  基準: number; 販売: number; 買取: number;
  履歴0?: boolean;
  /** DB で書き足す更新日時（「2026-09-01 00:00:00+09」の形） */
  更新日時?: string;
  商品を廃止?: boolean;
  規格を廃止?: boolean;
  /** 登録のあと、規格の商品コードをこの値（正本）に書き換える */
  規格コード?: string;
};
type ファイルの定め = {
  /** 正本のファイル名 */
  名前: string;
  /** データ行（正本の値。「空」は空の値）。先頭の列が規格の商品コードなら印を付ける */
  行: string[];
  形?: "tsv" | "sjis" | "invisible" | { 繰り返し: number };
};
type シードの定め = { 規格: 規格の定め[]; ファイル: ファイルの定め; 未登録?: string[] };

export type 作った規格 = { 商品ID: string; 商品規格ID: string; 商品コード: string };
type 作ったもの = { 規格: Record<string, 作った規格>; ファイル: string; ファイル名: string };
const 作ったものの表 = new Map<string, 作ったもの>();

/** シードが作った規格（呼び名の番号ごと）と取込ファイル（ケースから引く） */
export function 作ったものの(seedId: string): 作ったもの {
  const v = 作ったものの表.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

/** 取込ファイルを書く。中身の行の値が、シード表に書かれた値であることを確かめてから、規格の商品コードに印を付ける */
function ファイルを書く(seedId: string, d: シードの定め, issue: (m: string) => void): { ファイル: string; ファイル名: string } {
  const f = d.ファイル;
  const 文 = 定めの文(seedId);
  if (!文.includes(f.名前)) throw new Error(`${seedId}: シード表にファイル名 ${f.名前} が無い`);
  const 区切り = f.形 === "tsv" ? "\t" : ",";
  for (const l of f.行) {
    const 書き方 = f.形 === "tsv" ? `「${l.split(",").join("・")}」` : `「${l}」`;
    if (f.形 !== "invisible" && !文.includes(書き方)) throw new Error(`${seedId}: シード表に ${書き方} が無い`);
  }
  if (f.形 === "invisible") 文にある(seedId, ["バイト順マーク", "ゼロ幅スペース"]);
  if (f.形 !== "invisible" && !文.includes(`見出し「${HEADER.join(f.形 === "tsv" ? "・" : ",")}」`)) {
    issue(`${f.名前}: シード表は見出し行の値を書かない。この機能のCSVのフォーマットの見出し「${HEADER.join(",")}」（設計書・雛形と同じ）を先頭に書いた`);
  }
  const 印を付ける = new Set(d.規格.flatMap((k) => [k.商品コード, ...(k.規格コード ? [k.規格コード] : [])]));
  const 行 = f.行.map((l) => {
    const cells = l.split(",").map((v) => (v === "空" ? "" : v));
    if (印を付ける.has(cells[0])) cells[0] = rc(cells[0]);
    return cells;
  });
  let text: string;
  if (f.形 === "invisible") {
    // 見出しの「商品」と「コード」のあいだにバイト順マーク、商品コードの「HIGH-N-」と「0001」のあいだにゼロ幅スペース
    const [code, price] = 行[0];
    if (!code.startsWith("HIGH-N-")) throw new Error(`${seedId}: 商品コード ${code} にゼロ幅スペースを入れる場所が無い`);
    text = `商品﻿コード,基準価格\n${code.replace("HIGH-N-", "HIGH-N-​")},${price}\n`;
  } else {
    const rows = typeof f.形 === "object" ? Array.from({ length: f.形.繰り返し }, () => 行[0]) : 行;
    text = [HEADER, ...rows].map((r) => (区切り === "\t" ? r.join("\t") : csvLine(r))).join("\n") + "\n";
    if (typeof f.形 === "object") {
      const n = (text.match(/\n/g) ?? []).length;
      if (n !== f.形.繰り返し + 1) throw new Error(`${seedId}: 取込ファイルの改行数が ${n}（見出し1行とデータ ${f.形.繰り返し} 行のはず）`);
    }
  }
  const dir = path.join(DIR, seedId.replace(/^.*-/, ""));
  fs.mkdirSync(dir, { recursive: true });
  const ファイル名 = 印つきのファイル名(f.名前);
  const ファイル = path.join(dir, ファイル名);
  fs.writeFileSync(ファイル, f.形 === "sjis" ? encodeShiftJis(text) : Buffer.from(text, "utf-8"));
  return { ファイル, ファイル名 };
}

async function 規格を作る(page: Page, seedId: string, k: 規格の定め, issue: (m: string) => void): Promise<作った規格> {
  const code = rc(k.商品コード);
  const before = await productIdsByCode(page, code);
  if (before.length) throw new Error(`${seedId}: 商品コード ${code} の商品が既にある（${before.join("、")}）`);
  const 販売 = k.セール ? k.販売 : k.基準;
  await registerGoodsProduct(page, {
    what: seedId, code, nameJp: code, nameEn: code, onIssue: issue,
    values: {
      "基準価格": String(k.基準), "販売価格": String(販売), "買取価格": String(k.買取), "原価単価": "10", "地域別販売制限": "0",
      "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "",
    },
  });
  const 商品ID = await openProductEditByCode(page, code);
  const 高額 = k.高額 === null ? "" : rc(k.高額 === "任意" ? `HP-M0332-${k.呼び}` : k.高額);
  const 商品規格ID = await registerHighPriceClass(page, 商品ID, code, {
    高額商品コード: 高額, セール: k.セール ?? false, 基準価格: String(k.基準), 販売価格: String(販売), 買取価格: String(k.買取),
  }, `${seedId}: 商品コード ${code}`, issue);
  let 商品コード = code;
  if (k.規格コード) {
    商品コード = rc(k.規格コード);
    await 規格の商品コードを変える(page, 商品ID, 商品規格ID, 商品コード, `${seedId}: 規格 ${商品規格ID} の商品コードを ${商品コード} へ`, issue);
  }
  if (k.規格を廃止) await 規格を廃止にする(page, 商品ID, 商品規格ID, `${seedId}: 規格 ${商品規格ID} を廃止`, issue);
  if (k.商品を廃止) {
    await タグを付けて商品を登録する(page, 商品ID, null, "廃止", `${seedId}: 商品 ${商品ID} を廃止`, issue);
    issue(`${seedId}: 商品 ${商品ID} は、商品登録編集画面で割引率（未選択なら選択肢の先頭）を選び、公開状態を「廃止」にして登録した`);
  }
  return { 商品ID, 商品規格ID, 商品コード };
}

function 定める(seedId: string, d: シードの定め): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 文 = 定めの文(seedId);
    for (const k of d.規格) {
      文にある(seedId, [k.規格コード ?? k.商品コード, `基準価格${k.基準}`, `販売価格${k.販売}`]);
      if (k.高額 && k.高額 !== "任意") 文にある(seedId, [k.高額]);
    }
    for (const u of d.未登録 ?? []) {
      文にある(seedId, [u, "未登録"]);
      if (x.商品コードの規格(u).length) throw new Error(`${seedId}: 商品コード ${u} の商品規格がある（未登録のはず。消さずに止める）`);
    }
    const 作った = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const out: Record<string, 作った規格> = {};
      for (const k of d.規格) out[k.呼び] = await 規格を作る(page, seedId, k, issue);
      return out;
    });
    // 画面で作れない状態だけ、E2E の行に DB で書き足す
    for (const k of d.規格) {
      const c = 作った[k.呼び];
      if (!k.セール && k.販売 !== k.基準) {
        w30.販売価格を書き足す(seedId, [c], k.販売);
        issue(`${c.商品コード} の販売価格 ${k.販売} は、セールフラグなしでは画面が基準価格と同じ値で保存するので、DB で書き足した（E2E の規格だけ）`);
      }
      if (k.履歴0) {
        const n = w30.価格履歴を消す(seedId, [c]);
        issue(`${c.商品コード} の価格履歴=0件は画面で作れないので、登録・編集のときにできた価格履歴 ${n} 件を DB で消した（E2E の規格の行だけ）`);
      }
      if (k.更新日時) {
        x.更新日時を書き足す(seedId, c, k.更新日時);
        issue(`${c.商品コード} の更新日時は画面で指定できないので、DB で ${k.更新日時} にした（E2E の規格だけ）`);
      }
    }
    // 作ったあと、規格がシード表の状態になっていることをDBの参照で確かめる（違えばケースの前提が崩れるので止める）
    for (const k of d.規格) {
      const c = 作った[k.呼び];
      const s = 商品規格の状態(c.商品規格ID);
      const got = s && { 商品コード: s.商品コード, 基準価格: s.基準価格, 販売価格: s.販売価格, 買取価格: s.買取価格, セール: s.セール, 高額: Boolean(s.高額商品コード) };
      const want = { 商品コード: c.商品コード, 基準価格: String(k.基準), 販売価格: String(k.販売), 買取価格: String(k.買取), セール: k.セール ?? false, 高額: k.高額 !== null };
      if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${seedId}: 作った規格 ${c.商品規格ID} が ${JSON.stringify(got)}（シード表は ${JSON.stringify(want)}）`);
      if (k.履歴0 && w30.価格履歴の行(c.商品規格ID).length !== 0) throw new Error(`${seedId}: 規格 ${c.商品規格ID} の価格履歴が0件にならない`);
      if (k.商品を廃止 && w30.商品の公開状態(c.商品ID) !== "廃止") throw new Error(`${seedId}: 商品 ${c.商品ID} の公開状態が「${w30.商品の公開状態(c.商品ID)}」（廃止のはず）`);
      if (k.規格を廃止) {
        const st = x.商品コードの規格(c.商品コード).find((r) => r.商品規格ID === c.商品規格ID);
        if (st?.規格の公開状態 !== "廃止") throw new Error(`${seedId}: 規格 ${c.商品規格ID} の公開状態が「${st?.規格の公開状態}」（廃止のはず）`);
      }
    }
    // 同じ商品コードの規格（042・043）
    const 書き換えた = [...new Set(d.規格.filter((k) => k.規格コード).map((k) => rc(k.規格コード!)))];
    for (const code of 書き換えた) {
      const rows = x.商品コードの規格(code).filter((r) => r.規格の公開状態 !== "廃止" && r.商品の公開状態 !== "廃止");
      if (rows.length !== 2) throw new Error(`${seedId}: 商品コード ${code} の表示中の規格が ${rows.length} 件（2件のはず）`);
      issue(`同じ商品コード ${code} の規格が2件あることを、DB の参照で確かめた（シード表は重複商品コード確認の画面で確かめるとする）`);
    }
    // 呼び名（シード表が定めるものだけ控える）
    for (const k of d.規格) {
      const c = 作った[k.呼び];
      const p = `〔商品ID-M0332-${k.呼び}〕`;
      const q = `〔商品規格ID-M0332-${k.呼び}〕`;
      if (文.includes(p)) notes.set(p, c.商品ID);
      if (文.includes(q)) notes.set(q, c.商品規格ID);
    }
    const f = ファイルを書く(seedId, d, issue);
    if (取込履歴の件数(取込種別.高額商品価格変更, f.ファイル名) !== 0) throw new Error(`${seedId}: ファイル名 ${f.ファイル名} の取込履歴が既にある`);
    if (/取込履歴0件/.test(文)) issue(`取込履歴0件は、取込履歴を消さず、印つきのファイル名 ${f.ファイル名} の取込履歴が0件であることを確かめた（ケースはこのファイル名で数える）`);
    作ったものの表.set(seedId, { 規格: 作った, ...f });
  });
}

/** 通常の高額商品（セールなし）。正本の高額商品コードは HP-M0332-<番号> */
const N = (呼び: string, 商品コード: string, 基準: number, 販売: number, o: Partial<規格の定め> = {}): 規格の定め => ({
  呼び, 商品コード, 高額: `HP-M0332-${呼び.replace(/[A-Z]$/, "")}`, 基準, 販売, 買取: 販売, ...o,
});
const 一つ = (no: string, code: string, ファイル: string, 行: string[], o: Partial<規格の定め> = {}, 形?: ファイルの定め["形"]): シードの定め => ({
  規格: [N(no, code, o.基準 ?? 1000, o.販売 ?? 900, o)], ファイル: { 名前: ファイル, 行, 形 },
});

// 004〜013（通常商品の価格更新・取込履歴・価格履歴・更新日時・なりすまし対策）
for (const no of ["004", "007", "008", "013"]) 定める(`S-M03-32-DATA-${no}`, 一つ(no, `HIGH-N-0001-${no}`, `normal-${no}.csv`, [`HIGH-N-0001-${no},1500`]));
定める("S-M03-32-DATA-009", 一つ("009", "HIGH-N-0001-009", "normal-009.csv", ["HIGH-N-0001-009,1500"], { 履歴0: true }));
定める("S-M03-32-DATA-010", 一つ("010", "HIGH-U-0001-010", "unchanged-010.csv", ["HIGH-U-0001-010,1000"], { 販売: 1000, 履歴0: true }));
定める("S-M03-32-DATA-011", 一つ("011", "HIGH-U-0001-011", "unchanged-011.csv", ["HIGH-U-0001-011,1000"], { 販売: 1000, 更新日時: "2026-09-01 00:00:00+09" }));

// 022〜024・038〜045（不備の行で取込全体が取り消される）
const 二つ = (no: string, b: Omit<規格の定め, "呼び">, ファイル: string, 行: string[], 未登録?: string[]): シードの定め => ({
  規格: [N(`${no}A`, `HIGH-N-0002-${no}`, 2000, 1800, { 高額: no === "038" || no === "039" || no === "040" || no === "041" ? `HP-M0332-${no}` : "任意" }), { 呼び: `${no}B`, ...b }],
  ファイル: { 名前: ファイル, 行 }, 未登録,
});
定める("S-M03-32-DATA-022", 二つ("022", { 商品コード: "HIGH-N-0001-022", 高額: "任意", 基準: 1000, 販売: 900, 買取: 900 }, "bad_columns-022.csv", ["HIGH-N-0002-022,2500", "HIGH-N-0001-022,1500,EXTRA"]));
定める("S-M03-32-DATA-024", 二つ("024", { 商品コード: "HIGH-N-0001-024", 高額: "任意", 基準: 1000, 販売: 900, 買取: 900 }, "blank_price-024.csv", ["HIGH-N-0002-024,2500", "HIGH-N-0001-024,空"]));
定める("S-M03-32-DATA-023", {
  規格: [N("023", "HIGH-N-0002-023", 2000, 1800, { 高額: "HP-M0332-023" })],
  ファイル: { 名前: "blank_product-023.csv", 行: ["HIGH-N-0002-023,2500", "空,1200"] },
});
for (const no of ["038", "039"]) {
  定める(`S-M03-32-DATA-${no}`, 二つ(no, { 商品コード: `NOHIGH-0001-${no}`, 高額: null, 基準: 700, 販売: 700, 買取: 700 }, `no_target-${no}.csv`,
    [`HIGH-N-0002-${no},2500`, `NOHIGH-0001-${no},1200`]));
}
定める("S-M03-32-DATA-040", {
  規格: [N("040", "HIGH-N-0002-040", 2000, 1800, { 高額: "HP-M0332-040" })],
  ファイル: { 名前: "unknown-040.csv", 行: ["HIGH-N-0002-040,2500", "UNKNOWN-001-040,1200"] }, 未登録: ["UNKNOWN-001-040"],
});
定める("S-M03-32-DATA-041", {
  規格: [N("041", "HIGH-N-0002-041", 2000, 1800, { 高額: "HP-M0332-041" })],
  ファイル: { 名前: "unknown-041.csv", 行: ["HIGH-N-0002-041,2500", "UNKNOWN-001-M0332-041,1200"] }, 未登録: ["UNKNOWN-001-M0332-041"],
});
for (const no of ["042", "043"]) {
  定める(`S-M03-32-DATA-${no}`, {
    規格: [
      N(`${no}A`, `HIGH-N-0002-${no}`, 2000, 1800, { 高額: "任意" }),
      { 呼び: `${no}B`, 商品コード: `HIGH-DUP001-${no}-A`, 規格コード: `HIGH-DUP001-${no}`, 高額: "任意", 基準: 800, 販売: 800, 買取: 800 },
      { 呼び: `${no}C`, 商品コード: `HIGH-DUP001-${no}-B`, 規格コード: `HIGH-DUP001-${no}`, 高額: "任意", 基準: 800, 販売: 800, 買取: 800 },
    ],
    ファイル: { 名前: `duplicate-${no}.csv`, 行: [`HIGH-N-0002-${no},2500`, `HIGH-DUP001-${no},1200`] },
  });
}
定める("S-M03-32-DATA-044", 二つ("044", { 商品コード: "HIGH-P-DEL1-044", 高額: "任意", 基準: 600, 販売: 600, 買取: 600, 商品を廃止: true }, "deleted_product-044.csv", ["HIGH-N-0002-044,2500", "HIGH-P-DEL1-044,1200"]));
定める("S-M03-32-DATA-045", 二つ("045", { 商品コード: "HIGH-C-DEL1-045", 高額: "任意", 基準: 650, 販売: 650, 買取: 650, 規格を廃止: true }, "deleted_class-045.csv", ["HIGH-N-0002-045,2500", "HIGH-C-DEL1-045,1200"]));

// 025・028〜033（取込ファイルの形と値の境界）
定める("S-M03-32-DATA-025", 一つ("025", "HIGH-N-0001-025", "limit-ok-025.csv", ["HIGH-N-0001-025,1500"], {}, { 繰り返し: 5008 }));
定める("S-M03-32-DATA-028", 一つ("028", "HIGH-N-0001-028", "valid.tsv", ["HIGH-N-0001-028,1500"], {}, "tsv"));
定める("S-M03-32-DATA-029", 一つ("029", "HIGH-N-0001-029", "shift_jis-029.csv", ["HIGH-N-0001-029,1500"], {}, "sjis"));
定める("S-M03-32-DATA-030", 一つ("030", "HIGH-N-0001-030", "valid.txt", ["HIGH-N-0001-030,1500"]));
定める("S-M03-32-DATA-031", 一つ("031", "HIGH-N-0001-031", "invisible-031.csv", ["HIGH-N-0001-031,1500"], {}, "invisible"));
定める("S-M03-32-DATA-032", 一つ("032", "HIGH-N-0001-032", "zero-032.csv", ["HIGH-N-0001-032,0"]));
定める("S-M03-32-DATA-033", 一つ("033", "HIGH-N-0001-033", "max11-033.csv", ["HIGH-N-0001-033,99999999999"]));

// 065〜075（データパターン。高額商品コードは HPM0332-<番号>-<末尾>）
const DP = (no: string, 末尾: string, 基準: number, 販売: number, o: Partial<規格の定め> = {}): 規格の定め => ({
  呼び: `${no}${末尾}`, 商品コード: `HIGHM0332-${no}-${末尾}`, 高額: `HPM0332-${no}-${末尾}`, 基準, 販売, 買取: 販売, 履歴0: true, ...o,
});
const DPファイル = (no: string, 行: string[]): ファイルの定め => ({ 名前: `dp-m0332-${no}.csv`, 行 });
for (const no of ["065", "066", "067"]) {
  定める(`S-M03-32-DPDATA-${no}`, { 規格: [DP(no, "A", 1000, 1000), DP(no, "B", 2000, 2000)], ファイル: DPファイル(no, [`HIGHM0332-${no}-A,1500`, `HIGHM0332-${no}-B,2500`]) });
}
for (const no of ["068", "075"]) {
  定める(`S-M03-32-DPDATA-${no}`, { 規格: [DP(no, "S", 1000, 800, { セール: true }), DP(no, "N", 2000, 2000)], ファイル: DPファイル(no, [`HIGHM0332-${no}-S,1500`, `HIGHM0332-${no}-N,2500`]) });
}
定める("S-M03-32-DPDATA-069", { 規格: [DP("069", "C", 1000, 1000), DP("069", "U", 2000, 2000)], ファイル: DPファイル("069", ["HIGHM0332-069-C,1500", "HIGHM0332-069-U,2000"]) });
定める("S-M03-32-DPDATA-070", { 規格: [DP("070", "A", 1500, 1000, { 買取: 1000 })], ファイル: DPファイル("070", ["HIGHM0332-070-A,1500"]) });
定める("S-M03-32-DPDATA-071", { 規格: [DP("071", "A", 1000, 800, { セール: true })], ファイル: DPファイル("071", ["HIGHM0332-071-A,1500"]) });
for (const no of ["072", "073"]) 定める(`S-M03-32-DPDATA-${no}`, { 規格: [DP(no, "A", 1000, 1000)], ファイル: DPファイル(no, [`HIGHM0332-${no}-A,1500`]) });

// ---- RB-・CB-（雛形の見出しで作る。価格履歴検索・在庫検索で見る） ----

export const RB_ADMIN = { loginId: "m0332rb", password: "Passw0rd-M0332R" };
export const RB_ADMIN_NAME = "M03-32連携試験管理者";
let 本店名 = "";
/** 本店（店舗ID 1）の店名。まだ読んでいなければ画面から読む */
export async function 本店の店名(page?: Page): Promise<string> {
  if (!本店名) {
    if (!page) throw new Error("本店の店名をまだ読んでいない");
    本店名 = await storeNameById(page, "1");
  }
  return 本店名;
}

defineSeed("S-M03-32-RB-MASTER", async ({ browser }) => {
  const issue = (m: string) => reportSeedIssue("S-M03-32-RB-MASTER", m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 本店の店名(page);
    await page.goto(adminUrl("/product/sell_group"));
    const groups = await page.locator(".sell-group-master-list tbody tr td:first-child a").allInnerTexts();
    if (!groups.map((g) => g.trim()).includes("通常商品")) throw new Error("S-M03-32-RB-MASTER: 購入グループに「通常商品」が無い");
    const languages = await readLanguageChoicesFromClassForm(page);
    if (!languages.some((l) => l.id === "1" && l.label === "日本語")) throw new Error(`S-M03-32-RB-MASTER: 商品規格の登録画面の言語の欄に、値1の「日本語」が無い: ${JSON.stringify(languages)}`);
  });
  issue(`東京本店は開発環境の本店（店舗ID 1「${本店名}」）に読み替えた。言語ID=1（日本語）・購入グループ「通常商品」があることを画面で確かめた。` +
    "CSV取込の区切り文字・囲み文字・アップロードサイズ上限（アプリの設定ファイル）と商品カテゴリID=2 の階層は、共有の開発環境では書き換えない（シード表のとおり。カテゴリは既存の番号2を使う）");
});

defineSeed("S-M03-32-RB-ADM", { needs: ["S-M03-32-RB-MASTER"] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 店 = await 本店の店名(page);
    await ensureMember(page, {
      名前: RB_ADMIN_NAME, 所属店舗: 店, ログインID: RB_ADMIN.loginId, メールアドレス: "m0332rb@example.test",
      パスワード: RB_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: 店, 編集可能店舗: [店],
    });
  });
  reportSeedIssue("S-M03-32-RB-ADM", "「商品管理と在庫管理を操作できる」権限は、システム管理者で読んだ。デフォルト検索表示店舗は開発環境の本店");
});

type RBの定め = {
  /** 正本の商品コード・商品名・高額商品コード（印を付ける前） */
  商品コード: string; 商品名: string; 商品名英: string; 高額: string;
  セール: boolean; 基準: number; 買取: number;
  /** DB で書き足す販売価格（セールでない規格） */
  販売?: number;
  /** 取込ファイル名（印を付ける前）と、基準価格の列の値 */
  ファイル名: string; 取込の基準価格: number;
  部門?: string;
  在庫の行を確かめる?: boolean;
};
export type RBで作ったもの = { 商品ID: string; 商品規格ID: string; 商品コード: string; ファイル: string; ファイル名: string };
const RB作ったもの = new Map<string, RBで作ったもの>();
export function RBの(seedId: string): RBで作ったもの {
  const v = RB作ったもの.get(seedId);
  if (!v) throw new Error(`${seedId} はまだ作っていない`);
  return v;
}

function RBを定める(seedId: string, d: RBの定め): void {
  defineSeed(seedId, { needs: ["S-M03-32-RB-MASTER"] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    文にある(seedId, [d.商品コード, d.商品名, d.高額, `基準価格=${d.基準}`, `買取価格=${d.買取}`, d.ファイル名, `基準価格=${d.取込の基準価格}`,
      ...(d.販売 !== undefined ? [`販売価格=${d.販売}`] : []), ...(d.部門 ? [d.部門] : [])]);
    const code = rc(d.商品コード);
    const name = rc(d.商品名);
    const got = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const before = await productIdsByCode(page, code);
      if (before.length) throw new Error(`${seedId}: 商品コード ${code} の商品が既にある（${before.join("、")}）。消さずに止める`);
      await registerGoodsCsv(page, {
        what: `${seedId}: グッズ商品CSV登録`, fileName: `${code}-base.csv`, categoryId: GOODS_ROOT_CATEGORY_ID,
        common: { "購入グループ名称": "通常商品" },
        lines: [{ code, nameJp: name, nameEn: rc(d.商品名英), values: {
          "言語(ID)": "1", "サイズ": "200", "重量": "148", "基準価格": String(d.基準), "販売価格": String(d.基準), "買取価格": String(d.買取), "原価単価": "300", "スマレジ連携フラグ": "0",
        } }],
        onWarning: (m) => issue(`グッズ商品CSV登録の警告「${m}」`),
      });
      const 商品ID = await openProductEditByCode(page, code);
      const 商品規格ID = await registerHighPriceClass(page, 商品ID, code, {
        高額商品コード: rc(d.高額), セール: d.セール, 基準価格: String(d.基準), 販売価格: String(d.基準), 買取価格: String(d.買取),
      }, `${seedId}: 商品コード ${code}`, issue);
      if (d.部門) issue(`部門「${d.部門}」は作らず、規格の部門は選択肢の先頭にした（部門を登録するとアプリがスマレジへ部門を送る。スマレジは後回しの決定。期待結果は部門を見ない）`);
      if (d.在庫の行を確かめる) {
        const 店 = await 本店の店名(page);
        const list = await searchStockByCode(page, { 商品コード: code, 店舗: 店, 在庫区分: "EC-CUBE" });
        const n = await list.row(code, 店, "EC-CUBE").count();
        if (n !== 1) throw new Error(`${seedId}: 在庫検索一覧で、店舗「${店}」・在庫区分 EC-CUBE・コード ${code} の行が ${n} 件（1件のはず）`);
      }
      const 見出し = await 高額の雛形の見出し(page, path.join(DIR, seedId.replace(/^.*-/, "")));
      return { 商品ID, 商品規格ID, 見出し };
    });
    if (d.販売 !== undefined && !d.セール && d.販売 !== d.基準) {
      w30.販売価格を書き足す(seedId, [{ 商品規格ID: got.商品規格ID, 商品コード: code }], d.販売);
      issue(`販売価格 ${d.販売} は、セールフラグなしでは画面が基準価格と同じ値で保存するので、DB で書き足した（E2E の規格だけ）`);
    }
    const s = 商品規格の状態(got.商品規格ID);
    const want = { 基準価格: String(d.基準), 販売価格: String(d.販売 ?? d.基準), 買取価格: String(d.買取), セール: d.セール };
    const now = s && { 基準価格: s.基準価格, 販売価格: s.販売価格, 買取価格: s.買取価格, セール: s.セール };
    if (JSON.stringify(now) !== JSON.stringify(want)) throw new Error(`${seedId}: 作った規格が ${JSON.stringify(now)}（シード表は ${JSON.stringify(want)}）`);
    const 値: Record<string, string> = { "商品コード": code, "基準価格": String(d.取込の基準価格) };
    const 書けない = Object.keys(値).filter((k) => !got.見出し.includes(k));
    if (書けない.length) throw new Error(`${seedId}: 画面の雛形の見出しに「${書けない.join("・")}」が無い（見出し: ${got.見出し.join("・")}）`);
    const 余り = got.見出し.filter((k) => !(k in 値));
    if (余り.length) issue(`画面の雛形の見出しにある、シード表が書かない列（${余り.join("・")}）は空にした`);
    const ファイル名 = 印つきのファイル名(d.ファイル名);
    const dir = path.join(DIR, seedId.replace(/^.*-/, ""));
    fs.mkdirSync(dir, { recursive: true });
    const ファイル = path.join(dir, ファイル名);
    fs.writeFileSync(ファイル, [csvLine(got.見出し), csvLine(got.見出し.map((h) => 値[h] ?? ""))].join("\n") + "\n", "utf-8");
    RB作ったもの.set(seedId, { 商品ID: got.商品ID, 商品規格ID: got.商品規格ID, 商品コード: code, ファイル, ファイル名 });
  });
}

RBを定める("S-M03-32-RB-DATA-076", {
  商品コード: "M0332RB-001", 商品名: "M03-32 RB高額商品-001", 商品名英: "M03-32 RB高額商品-001E", 高額: "H0332RB-001", セール: false, 基準: 1000, 買取: 400,
  ファイル名: "m0332rb001.csv", 取込の基準価格: 1500, 部門: "RB部門-32001",
});
RBを定める("S-M03-32-RB-DATA-077", {
  商品コード: "M0332RB-002", 商品名: "M03-32 RB高額商品-002", 商品名英: "M03-32 RB高額商品-002E", 高額: "H0332RB-002", セール: false, 基準: 1000, 買取: 400,
  ファイル名: "m0332rb002.csv", 取込の基準価格: 1500, 部門: "RB部門-32002", 在庫の行を確かめる: true,
});
RBを定める("S-M03-32-CBHIST-078", {
  商品コード: "M32CB078A", 商品名: "M32CB078A商品", 商品名英: "M32CB078AItem", 高額: "HM0332-CB078-A", セール: true, 基準: 1000, 買取: 400,
  ファイル名: "cb-m0332-078.csv", 取込の基準価格: 1000,
});
RBを定める("S-M03-32-CBHIST-079", {
  商品コード: "M32CB079A", 商品名: "M32CB079A商品", 商品名英: "M32CB079AItem", 高額: "HM0332-CB079-A", セール: false, 基準: 1000, 買取: 400, 販売: 1500,
  ファイル名: "cb-m0332-079.csv", 取込の基準価格: 1500,
});
