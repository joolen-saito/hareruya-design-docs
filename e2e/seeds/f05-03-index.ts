/**
 * F05-03 ネット買取商品一覧（フロント）の、検索サービス（ユニサーチ）の索引に載せる商品のシード。正本: cases/F05-03_seed_data.tsv
 * （最初の分は seeds/f05-03.ts。依頼者の決定 2026-11-11 夜「ユニサーチのフィード連携はしてもいい」）
 *
 * 作り方: カテゴリ（サプライ・グッズの子）・タグ・カード・カードセットを画面で作り、グッズ商品CSV登録で商品を取り込み、
 * 要る商品だけ「カード指定」・規格の編集をする（pages/admin/f05_index_products.ts）。この機能の索引用のシードの商品を1回の起動でまとめて作り、
 * ユニサーチフィード作成で1回だけ送って、公開側の一覧に出るまで待つ（seeds/f05_index_batch.ts）。
 * 名前（カテゴリ・タグ・商品名・商品コード・検索ワード・カード名・カードセット名）には実行の印を付ける（rc）。説明文は正本の値のまま。
 *
 * シード表から読み替えたこと（各シードの報告にも出す）:
 * - カテゴリ: シード表は「カテゴリ一覧でカテゴリ名を入れて子カテゴリ作成」とする。最上位に作ると共有のサイトのカテゴリの並びに出るので、
 *   サプライ・グッズの子として作った。商品の商品カテゴリ(ID)には、サプライ・グッズとそのカテゴリの両方を入れた（グッズ商品CSVはカンマ区切りで複数指定できる）。
 * - PAGING-007・008・028・029・031: シード表は DB で決まった番号（商品レコードID 950007001〜 など）の121商品を入れるとする。
 *   DB には入れず、グッズ商品CSV登録で121商品を1回だけ作り、5つのカテゴリ（ページング確認カテゴリ-007・008・028・029・031）の全部に所属させた。
 *   商品名は「PAGE-001-F0503」〜「PAGE-121-F0503」（印つき）。ケースは件数・ページ・重複と欠落を見るので、5つのケースで同じ121商品を使っても成り立つ。
 * - ELIGIBILITY-024: ELIGIBLE-NOSTOCK-024 の販売価格0円は作れない（買取価格を上回れない。シード表は DB での直接設定）ので1000円、
 *   ELIGIBLE-STOCK-024 の在庫10は DB ではなく入庫と承認で入れた。
 * - VIEW-032: SUPPLY-001-032 の「カード言語なし」は DB での直接設定とするが、言語は日本語のまま（カードを指定しない商品には言語ラベルが出ない作り）。
 * - 販売価格（基準価格）は 1000 円と買取価格の大きいほう。ケースが在庫を見ない商品は入庫しない。
 *
 * 作らないシード（使うケースを実装しない。理由は PM への報告）: LIMIT-003・LIMIT-052・CBOVER-067（9999件以上の商品）、INCOMING-038（買取TOPの新着タグ＝共有の設定）。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { CategoryPage } from "../pages/admin/category";
import { expectSaved } from "../pages/admin/common";
import { 商品名を含む商品の数 } from "../pages/admin/f05_02_setup";
import { 索引用カード, 索引用カードを登録する, 索引用商品, 索引用の商品を作る, 作った索引用商品, 買取価格を入れ直す, リリース日つきのカードセットを作る } from "../pages/admin/f05_index_products";
import { TagPage } from "../pages/admin/m03_13_tag";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { defineSeed } from "./current_seed";
import { 索引のまとめ, まとめの結果 } from "./f05_index_batch";

export const F0503索引 = new 索引のまとめ("F05-03 ネット買取商品一覧");
type C = { browser: Browser; notes: Notes; issue: (m: string) => void };

/** シードが作ったもの（ケースが引く） */
export const F0503作った = {
  商品: new Map<string, 作った索引用商品>(), // 正本の商品コード → 作った商品
  カテゴリ: new Map<string, string>(), // 正本のカテゴリ名 → カテゴリID
  タグ名: (正本: string) => rc(正本),
  名: (正本: string) => rc(正本),
};
export function f0503商品(正本のコード: string): 作った索引用商品 {
  const p = F0503作った.商品.get(正本のコード);
  if (!p) throw new Error(`商品 ${正本のコード} はまだ作っていない`);
  return p;
}

const 一覧 = "/ja/purchase/search";

async function カテゴリを作る(c: C, 名: string, what: string): Promise<string> {
  return withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const goods = await readGoodsRootCategoryId(page);
    const id = await new CategoryPage(page).createChild(goods, { nameJp: rc(名), nameEn: `F0503 Category ${RUN_MARK}`, frontHide: false }, c.issue);
    F0503作った.カテゴリ.set(名, id);
    c.issue(`${what}: カテゴリ「${rc(名)}」（カテゴリID ${id}）をサプライ・グッズの子として画面で作った`);
    return id;
  });
}

async function タグを作る(c: C, 名: string, 説明: string, what: string): Promise<string> {
  return withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tag = new TagPage(page);
    await tag.openNew();
    await tag.openOtherSettings();
    await tag.fill({ 名称日: rc(名), 名称英: rc(名), 並び順: "9990", フリーエリア日: 説明 });
    const r = await tag.pressRegister();
    if (!r.sent) throw new Error(`${what}: タグの登録が入力チェックで止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(page, `${what}: タグ「${rc(名)}」の登録`);
    const m = new URL(page.url()).pathname.match(/\/product\/tag\/(\d+)$/);
    if (!m) throw new Error(`${what}: タグの登録後にタグの編集画面へ移らない（${page.url()}）`);
    c.issue(`${what}: タグ「${rc(名)}」（タグID ${m[1]}・フリーエリア(日)「${説明}」）を画面で作った`);
    return m[1];
  });
}

/** カード（1件ずつ、または詳細情報を複数持つ1件）を登録する。名前 → { カード名, 詳細ID[] , カードID } */
async function カードを作る(c: C, what: string, defs: (Omit<索引用カード, "名"> & { 名: string })[]): Promise<Map<string, { 名: string; カードID: string; 詳細IDs: string[] }>> {
  const out = new Map<string, { 名: string; カードID: string; 詳細IDs: string[] }>();
  await withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const d of defs) {
      const r = await 索引用カードを登録する(page, { ...d, 名: rc(d.名) }, `${what}: カード ${rc(d.名)}`, c.issue);
      out.set(d.名, { 名: rc(d.名), カードID: r.カードID, 詳細IDs: r.詳細IDs });
    }
  });
  return out;
}

/** 商品を作って控える（コード・商品名・検索ワードに印を付ける）。商品コード（正本）の順に返す */
async function 商品を作る(c: C, what: string, defs: (Omit<索引用商品, "コード" | "名" | "検索ワード"> & { コード: string; 名?: string; 検索ワード?: string })[]): Promise<作った索引用商品[]> {
  const real = defs.map((d) => ({ ...d, コード: rc(d.コード), 名: rc(d.名 ?? d.コード), 検索ワード: d.検索ワード ? rc(d.検索ワード) : undefined }));
  const made = await 索引用の商品を作る(c.browser, what, real, c.issue);
  return defs.map((d, i) => {
    const m = made.get(real[i].コード) ?? { 商品ID: "", 規格ID: "", コード: real[i].コード, 名: real[i].名 };
    F0503作った.商品.set(d.コード, m);
    return m;
  });
}

const 目印 = (パス: string, 正本の名: string) => ({ パス, 商品名: rc(正本の名) });
const カテゴリの一覧 = (id: string) => `${一覧}/cate/${id}`;
const キーワードの一覧 = (語: string) => `${一覧}?product=${encodeURIComponent(rc(語))}`;

function defineIndexSeed(seedId: string, f: (c: C) => Promise<まとめの結果>): void {
  F0503索引.足す(seedId, f);
  defineSeed(seedId, async ({ browser, notes }) => { await F0503索引.用意する(seedId, browser, notes); });
}

// ---- 002（0件） ----
defineSeed("S-F05-03-LIMIT-002", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const n = await 商品名を含む商品の数(page, "F0503-ZERO-002");
    if (n !== 0) throw new Error(`${seed.シードID}: 「F0503-ZERO-002」を含む商品が ${n} 件ある（0件のはず）。既存の商品は消さないので止める`);
  });
  reportSeedIssue(seed.シードID, "商品管理の商品一覧で「F0503-ZERO-002」を含む商品が0件であることを確かめた（商品の名前・検索ワード・商品コードの書き換えはしていない）。検索語は正本の値のまま（印を付けない）");
});

// ---- 015・016・017・019（カテゴリの中の絞り込み・並び） ----
defineIndexSeed("S-F05-03-FILTER-015", async (c) => {
  const what = "S-F05-03-FILTER-015";
  const cat = await カテゴリを作る(c, "絞り込み確認カテゴリ-015", what);
  const 基本 = { 色: ["赤"], カードタイプ: [{ 名: "クリーチャー" }], 点数で見たマナ: "1" };
  const cards = await カードを作る(c, what, [
    { 名: "FILTER-CARD-ALL-015", ...基本, 詳細: [{ レアリティ: "神話レア", Foil: "特殊" }, { レアリティ: "神話レア", Foil: "特殊" }] },
    { 名: "FILTER-CARD-FOIL-015", ...基本, 詳細: [{ レアリティ: "神話レア", Foil: "通常" }] },
    { 名: "FILTER-CARD-RARITY-015", ...基本, 詳細: [{ レアリティ: "レア", Foil: "特殊" }] },
    { 名: "FILTER-CARD-COLOR-015", ...基本, 色: ["青"], 詳細: [{ レアリティ: "神話レア", Foil: "特殊" }] },
    { 名: "FILTER-CARD-TYPE-015", ...基本, カードタイプ: [{ 名: "アーティファクト" }], 詳細: [{ レアリティ: "神話レア", Foil: "特殊" }] },
  ]);
  const k = (n: string, i = 0) => ({ 名: cards.get(n)!.名, 詳細ID: cards.get(n)!.詳細IDs[i] });
  const 共通 = { 買取: 600, カテゴリID: [cat] };
  await 商品を作る(c, what, [
    { コード: "FILTER-ALL", ...共通, カード: k("FILTER-CARD-ALL-015") },
    { コード: "FILTER-NG-LANG-015", ...共通, 言語: "英語", カード: k("FILTER-CARD-ALL-015", 1) },
    { コード: "FILTER-NG-FOIL-015", ...共通, カード: k("FILTER-CARD-FOIL-015") },
    { コード: "FILTER-NG-RARITY-015", ...共通, カード: k("FILTER-CARD-RARITY-015") },
    { コード: "FILTER-NG-COLOR-015", ...共通, カード: k("FILTER-CARD-COLOR-015") },
    { コード: "FILTER-NG-TYPE-015", ...共通, カード: k("FILTER-CARD-TYPE-015") },
  ]);
  c.issue(`${what}: FILTER-ALL と FILTER-NG-LANG-015 は同じカード「${rc("FILTER-CARD-ALL-015")}」の詳細情報を1件ずつ使った（言語だけが違う）。カードタイプのクリーチャー以外はアーティファクト。点数で見たマナ・コストは1`);
  return { 控え: [["〔カテゴリレコードID-F0503-015〕", cat]], 目印: 目印(カテゴリの一覧(cat), "FILTER-ALL") };
});

defineIndexSeed("S-F05-03-FILTER-016", async (c) => {
  const what = "S-F05-03-FILTER-016";
  const cat = await カテゴリを作る(c, "マナコスト確認カテゴリ-016", what);
  const cards = await カードを作る(c, what, [{ 名: "MANA-CARD-3-016", 点数で見たマナ: "3", 詳細: [{}] }, { 名: "MANA-CARD-4-016", 点数で見たマナ: "4", 詳細: [{}] }]);
  await 商品を作る(c, what, [
    { コード: "MANA-3-016", 買取: 600, カテゴリID: [cat], カード: { 名: cards.get("MANA-CARD-3-016")!.名, 詳細ID: cards.get("MANA-CARD-3-016")!.詳細IDs[0] } },
    { コード: "MANA-4-016", 買取: 600, カテゴリID: [cat], カード: { 名: cards.get("MANA-CARD-4-016")!.名, 詳細ID: cards.get("MANA-CARD-4-016")!.詳細IDs[0] } },
  ]);
  return { 控え: [["〔カテゴリレコードID-F0503-016〕", cat]], 目印: 目印(カテゴリの一覧(cat), "MANA-3-016") };
});

async function 色のカテゴリ(c: C, what: string, カテゴリ名: string, 品: [string, string][]): Promise<string> {
  const cat = await カテゴリを作る(c, カテゴリ名, what);
  const cards = await カードを作る(c, what, 品.map(([code, color]) => ({ 名: `${code}-CARD`, 色: [color], 詳細: [{}] })));
  await 商品を作る(c, what, 品.map(([code]) => ({ コード: code, 買取: 600, カテゴリID: [cat], カード: { 名: cards.get(`${code}-CARD`)!.名, 詳細ID: cards.get(`${code}-CARD`)!.詳細IDs[0] } })));
  return cat;
}
defineIndexSeed("S-F05-03-FILTER-017", async (c) => {
  const cat = await 色のカテゴリ(c, "S-F05-03-FILTER-017", "カラー確認カテゴリ-017", [["COLOR-R-017", "赤"], ["COLOR-U-017", "青"]]);
  return { 控え: [["〔カテゴリレコードID-F0503-017〕", cat]], 目印: 目印(カテゴリの一覧(cat), "COLOR-R-017") };
});
defineIndexSeed("S-F05-03-SORT-019", async (c) => {
  const cat = await 色のカテゴリ(c, "S-F05-03-SORT-019", "F0503色順カテゴリ-019", [["SORT-COLOR-W-019", "白"], ["SORT-COLOR-U-019", "青"], ["SORT-COLOR-R-019", "赤"]]);
  return { 控え: [["〔カテゴリレコードID-F0503-019〕", cat]], 目印: 目印(カテゴリの一覧(cat), "SORT-COLOR-W-019") };
});

// ---- 018（発売日順） ----
defineIndexSeed("S-F05-03-SORT-018", async (c) => {
  const what = "S-F05-03-SORT-018";
  const sets = await withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 新 = await リリース日つきのカードセットを作る(page, { 名: rc("F0503新カードセット-018"), 英名: `F0503 New Set ${RUN_MARK}`, 略称: `N18${RUN_MARK}`.slice(0, 12), リリース日: "2026-03-02" }, what, c.issue);
    const 旧 = await リリース日つきのカードセットを作る(page, { 名: rc("F0503旧カードセット-018"), 英名: `F0503 Old Set ${RUN_MARK}`, 略称: `O18${RUN_MARK}`.slice(0, 12), リリース日: "2025-03-02" }, what, c.issue);
    return { 新, 旧 };
  });
  const cards = await カードを作る(c, what, [
    { 名: "REL-CARD-100-018", 詳細: [{ カードセットID: sets.新 }] },
    { 名: "REL-CARD-200-018", 詳細: [{ カードセットID: sets.新 }] },
    { 名: "REL-CARD-300-018", 詳細: [{ カードセットID: sets.旧 }] },
  ]);
  const k = (n: string) => ({ 名: cards.get(n)!.名, 詳細ID: cards.get(n)!.詳細IDs[0] });
  const w = "F0503-SORT-018";
  const made = await 商品を作る(c, what, [
    { コード: "REL-NEW-100-JP-018", 買取: 600, 検索ワード: w, カード: k("REL-CARD-100-018") },
    { コード: "REL-NEW-200-JP-018", 名: "REL-NEW-200-018", 買取: 600, 検索ワード: w, カード: k("REL-CARD-200-018"), 英語の規格: rc("REL-NEW-200-EN-018") },
    { コード: "REL-OLD-300-JP-018", 買取: 600, 検索ワード: w, カード: k("REL-CARD-300-018") },
    { コード: "REL-SUPPLY-400-018", 買取: 600, 検索ワード: w },
  ]);
  if (!(Number(made[1].商品ID) > Number(made[0].商品ID))) throw new Error(`${what}: REL-NEW-200 の商品ID（${made[1].商品ID}）が REL-NEW-100 の商品ID（${made[0].商品ID}）より大きくない`);
  return { 控え: [["〔商品レコードID-F0503-018A〕", made[1].商品ID], ["〔商品レコードID-F0503-018B〕", made[0].商品ID]], 目印: 目印(キーワードの一覧(w), "REL-NEW-100-JP-018") };
});

// ---- 020・032（表示属性） ----
async function 表示属性(c: C, what: string, no: "020" | "032"): Promise<まとめの結果> {
  const cat = await カテゴリを作る(c, `表示属性確認カテゴリ-${no}`, what);
  const cards = await カードを作る(c, what, [{ 名: `VIEW-CARD-${no}`, 詳細: [{}, {}] }]);
  const card = cards.get(`VIEW-CARD-${no}`)!;
  await 商品を作る(c, what, [
    { コード: `CARD-001-${no}`, 買取: 600, カテゴリID: [cat], カード: { 名: card.名, 詳細ID: card.詳細IDs[0] } },
    { コード: `CARD-002-${no}`, 買取: 600, カテゴリID: [cat], カード: { 名: card.名, 詳細ID: card.詳細IDs[1] } },
    { コード: `SUPPLY-001-${no}`, 買取: 600, カテゴリID: [cat] },
  ]);
  c.issue(`${what}: CARD-001-${no}・CARD-002-${no} は同じカード「${card.名}」（カードID ${card.カードID}）の詳細情報を1件ずつ指定した。SUPPLY-001-${no} はカードを指定しないサプライ商品${no === "032" ? "（言語は日本語のまま。シード表の「カード言語なし」は DB での直接設定なので行わない）" : ""}`);
  return { 控え: [[`〔カテゴリレコードID-F0503-${no}〕`, cat], [`〔カードレコードID-F0503-${no}〕`, card.カードID]], 目印: 目印(カテゴリの一覧(cat), `CARD-001-${no}`) };
}
defineIndexSeed("S-F05-03-VIEW-020", (c) => 表示属性(c, "S-F05-03-VIEW-020", "020"));
defineIndexSeed("S-F05-03-VIEW-032", (c) => 表示属性(c, "S-F05-03-VIEW-032", "032"));

// ---- 024（検索対象の判定） ----
defineIndexSeed("S-F05-03-ELIGIBILITY-024", async (c) => {
  const what = "S-F05-03-ELIGIBILITY-024";
  const w = "F0503-ELIGIBILITY-024";
  await 商品を作る(c, what, [
    { コード: "ELIGIBLE-NOSTOCK-024", 買取: 1, 価格: 1000, 検索ワード: w },
    { コード: "ELIGIBLE-STOCK-024", 買取: 600, 価格: 9999, 検索ワード: w, 在庫: 10 },
    { コード: "BUY-ZERO-024", 買取: 0, 検索ワード: w },
    { コード: "STATE-EX-024", 買取: 600, 検索ワード: w, NM以外: true },
    { コード: "HIGH-CODE-024", 買取: 600, 検索ワード: w, 高額商品コード: rc("F0503-HIGH-024") },
    { コード: "RESERVED-024", 買取: 600, 検索ワード: w, 予約: true },
  ]);
  c.issue(`${what}: 読み替え: ELIGIBLE-NOSTOCK-024 の販売価格は0円にできない（買取価格を上回れない。シード表は DB での直接設定）ので1000円、在庫は0のまま。ELIGIBLE-STOCK-024 の在庫10は入庫と承認で入れた`);
  return { 目印: 目印(キーワードの一覧(w), "ELIGIBLE-STOCK-024") };
});

// ---- 025（索引の値と画面の値が違う買取価格） ----
defineIndexSeed("S-F05-03-PRICE-025", async (c) => {
  const what = "S-F05-03-PRICE-025";
  const w = "F0503-PRICE-025";
  const [p] = await 商品を作る(c, what, [{ コード: "PRICE-001-025", 買取: 700, 検索ワード: w }]);
  return {
    控え: [["〔商品規格レコードID-F0503-025〕", p.規格ID]], 目印: 目印(キーワードの一覧(w), "PRICE-001-025"),
    反映のあと: async () => {
      await 買取価格を入れ直す(c.browser, p.商品ID, p.規格ID, 900, what, c.issue);
      c.issue(`${what}: 買取価格700円で索引へ載せたあと、商品規格登録編集で買取価格を900円に入れ直した（フィードは送り直していない）`);
    },
  };
});

// ---- 026（価格の高い順） ----
defineIndexSeed("S-F05-03-SORT-026", async (c) => {
  const what = "S-F05-03-SORT-026";
  const cat = await カテゴリを作る(c, "買取価格順確認カテゴリ-026", what);
  await 商品を作る(c, what, [
    { コード: "PRICE-HIGH-026", 買取: 3000, カテゴリID: [cat] },
    { コード: "PRICE-MID-026", 買取: 2000, カテゴリID: [cat] },
    { コード: "PRICE-LOW-026", 買取: 1000, カテゴリID: [cat] },
  ]);
  return { 控え: [["〔カテゴリレコードID-F0503-026〕", cat]], 目印: 目印(カテゴリの一覧(cat), "PRICE-HIGH-026") };
});

// ---- 007・008・028・029・031（121商品のページング。1組の商品を5つのカテゴリで使う） ----
export const F0503ページングの商品名 = Array.from({ length: 121 }, (_, i) => rc(`PAGE-${String(i + 1).padStart(3, "0")}-F0503`));
let ページングの商品: Promise<void> | null = null;
async function ページングを用意する(c: C): Promise<void> {
  if (!ページングの商品) {
    ページングの商品 = (async () => {
      const what = "S-F05-03-PAGING-007〜031";
      const cats: string[] = [];
      for (const no of ["007", "008", "028", "029", "031"]) cats.push(await カテゴリを作る(c, `ページング確認カテゴリ-${no}`, what));
      await 商品を作る(c, what, Array.from({ length: 121 }, (_, i) => ({ コード: `PAGE-${String(i + 1).padStart(3, "0")}-F0503`, 買取: 600, カテゴリID: cats, 番号を読まない: true })));
    })();
  }
  await ページングの商品;
}
function ページング(no: "007" | "008" | "028" | "029" | "031") {
  return async (c: C): Promise<まとめの結果> => {
    await ページングを用意する(c);
    c.issue(`S-F05-03-PAGING-${no}: 読み替え: シード表は DB で決まった番号の121商品を入れるとするが、グッズ商品CSV登録で「PAGE-001-F0503」〜「PAGE-121-F0503」（印つき）の121商品を画面で作り、ページング確認カテゴリ-007・008・028・029・031 の5つに所属させた（5つのケースで同じ商品を使う）`);
    return { 目印: 目印(カテゴリの一覧(F0503作った.カテゴリ.get(`ページング確認カテゴリ-${no}`)!), "PAGE-121-F0503") };
  };
}
defineIndexSeed("S-F05-03-PAGING-007", ページング("007"));
defineIndexSeed("S-F05-03-PAGING-008", ページング("008"));
defineIndexSeed("S-F05-03-PAGING-028", ページング("028"));
defineIndexSeed("S-F05-03-PAGING-029", ページング("029"));
defineIndexSeed("S-F05-03-PAGING-031", ページング("031"));

// ---- 033〜037・054（カート） ----
async function カート(c: C, no: string, 二つ: boolean): Promise<まとめの結果> {
  const what = `S-F05-03-${no === "054" ? "CARTDEF" : "CART"}-${no}`;
  const cat = await カテゴリを作る(c, `カート確認カテゴリ-${no}`, what);
  const code500 = no === "054" ? "F0503-CART-500-054" : `CART-500-${no}`;
  const made = await 商品を作る(c, what, [
    ...(二つ ? [{ コード: `CART-499-${no}`, 買取: 499, カテゴリID: [cat] }] : []),
    { コード: code500, 買取: 500, カテゴリID: [cat] },
  ]);
  const 控え: [string, string][] = [[`〔カテゴリレコードID-F0503-${no}〕`, cat]];
  if (no !== "033") 控え.push([`〔商品規格レコードID-F0503-${no}〕`, made[made.length - 1].規格ID]);
  return { 控え, 目印: 目印(カテゴリの一覧(cat), code500) };
}
defineIndexSeed("S-F05-03-CART-033", (c) => カート(c, "033", true));
defineIndexSeed("S-F05-03-CART-034", (c) => カート(c, "034", true));
defineIndexSeed("S-F05-03-CART-035", (c) => カート(c, "035", true));
defineIndexSeed("S-F05-03-CART-036", (c) => カート(c, "036", true));
defineIndexSeed("S-F05-03-CART-037", (c) => カート(c, "037", true));
defineIndexSeed("S-F05-03-CARTDEF-054", (c) => カート(c, "054", false));

// ---- 045〜048・050・053（ページ送りの表記・数量） ----
function 連番(seedId: string, no: string, 件数: number, カテゴリ名: string) {
  return async (c: C): Promise<まとめの結果> => {
    const cat = await カテゴリを作る(c, カテゴリ名, seedId);
    await 商品を作る(c, seedId, Array.from({ length: 件数 }, (_, i) => ({
      コード: `F0503-${no}-${String(i + 1).padStart(3, "0")}`, 買取: 600, カテゴリID: [cat], 番号を読まない: 件数 > 1,
    })));
    return { 控え: [[`〔カテゴリレコードID-F0503-${no}〕`, cat]], 目印: 目印(カテゴリの一覧(cat), `F0503-${no}-001`) };
  };
}
defineIndexSeed("S-F05-03-PAGECUR-045", 連番("S-F05-03-PAGECUR-045", "045", 3, "ページング確認カテゴリ-F0503-045"));
defineIndexSeed("S-F05-03-PAGEELL-046", 連番("S-F05-03-PAGEELL-046", "046", 17, "ページング確認カテゴリ-F0503-046"));
defineIndexSeed("S-F05-03-PAGEELL-047", 連番("S-F05-03-PAGEELL-047", "047", 17, "ページング確認カテゴリ-F0503-047"));
defineIndexSeed("S-F05-03-PAGEDOT-048", 連番("S-F05-03-PAGEDOT-048", "048", 17, "ページング確認カテゴリ-F0503-048"));
defineIndexSeed("S-F05-03-PAGEMID-053", 連番("S-F05-03-PAGEMID-053", "053", 17, "ページング確認カテゴリ-F0503-053"));
defineIndexSeed("S-F05-03-QTYDEC-050", 連番("S-F05-03-QTYDEC-050", "050", 1, "数量確認カテゴリ-F0503-050"));

// ---- 051（販促バナー） ----
export const F0503販促バナーの文 = ["クレジットカード・コンビニ・代引き決済対応", "晴れる屋トーナメントセンターで受取可能", "即日発送 ※15時までの入金確認or代引", "ポイントが1%貯まる"] as const;
defineSeed("S-F05-03-BANNER-051", async ({ browser, seed }) => {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const res = await page.goto(`${BASE_URL}/ja/products/search`, { waitUntil: "load" });
    expect(res?.status() ?? 0, `${seed.シードID}: 販売側の商品一覧の応答`).toBeLessThan(400);
    const footer = ((await page.locator("footer").first().textContent()) ?? "").replace(/\s+/g, " ");
    const 無い = F0503販促バナーの文.filter((t) => !footer.includes(t.replace(/\s+/g, " ")));
    // 前提（フッターに4種の案内が出る）が成り立たなければ、共有のレイアウトを書き換えずに止める
    if (無い.length) throw new Error(`${seed.シードID}: 販売側の商品一覧のフッターに案内「${無い.join("」「")}」が無い。シード表はレイアウトにフッターのブロックを置くとするが、共有のレイアウトなので書き換えずに止めた`);
  } finally {
    await context.close();
  }
  reportSeedIssue(seed.シードID, "データは入れていない。販売側の商品一覧のフッターに4種の案内が出ていることを確かめた（レイアウト管理は書き換えていない）");
});

// ---- 057〜066・068（タグの説明文と、買取の対象でない商品） ----
type 対象外 = "買取0" | "NM以外" | "高額" | "予約";
function タグ説明(no: string, タグ数: 1 | 2, 対象外?: 対象外) {
  const seedId = `S-F05-03-${{ "057": "CBZERO", "058": "CBZERO", "059": "CBSTATE", "060": "CBHIGH", "061": "CBRSV", "062": "CBSTATE", "063": "CBHIGH", "064": "CBRSV", "065": "CBEMPTY", "066": "CBPOS", "068": "CBPOS" }[no]}-${no}`;
  return async (c: C): Promise<まとめの結果> => {
    const tags: string[] = [];
    for (const s of タグ数 === 1 ? ["A"] : ["A", "B"]) tags.push(await タグを作る(c, `説明タグF0503-CB${no}${s}`, `F0503-CB${no}-DESC-${s}`, seedId));
    const base = { 買取: 600, タグID: tags };
    await 商品を作る(c, seedId, [
      { コード: `F0503-CB${no}-BASE`, ...base },
      ...(対象外 ? [{
        コード: `F0503-CB${no}-TARGET`, ...base,
        ...(対象外 === "買取0" ? { 買取: 0 } : 対象外 === "NM以外" ? { NM以外: true } : 対象外 === "高額" ? { 高額商品コード: rc(`F0503-CB${no}-HV`) } : { 予約: true }),
      }] : []),
    ]);
    const 控え = tags.map((t, i): [string, string] => [`〔タグレコードID-F0503-${no}${i === 0 ? "A" : "B"}〕`, t]);
    return { 控え, 目印: 目印(`${一覧}/tag/${tags.join("-")}`, `F0503-CB${no}-BASE`) };
  };
}
defineIndexSeed("S-F05-03-CBZERO-057", タグ説明("057", 1, "買取0"));
defineIndexSeed("S-F05-03-CBZERO-058", タグ説明("058", 2, "買取0"));
defineIndexSeed("S-F05-03-CBSTATE-059", タグ説明("059", 1, "NM以外"));
defineIndexSeed("S-F05-03-CBHIGH-060", タグ説明("060", 1, "高額"));
defineIndexSeed("S-F05-03-CBRSV-061", タグ説明("061", 1, "予約"));
defineIndexSeed("S-F05-03-CBSTATE-062", タグ説明("062", 2, "NM以外"));
defineIndexSeed("S-F05-03-CBHIGH-063", タグ説明("063", 2, "高額"));
defineIndexSeed("S-F05-03-CBRSV-064", タグ説明("064", 2, "予約"));
defineIndexSeed("S-F05-03-CBEMPTY-065", タグ説明("065", 1));
defineIndexSeed("S-F05-03-CBPOS-066", タグ説明("066", 1));
defineIndexSeed("S-F05-03-CBPOS-068", タグ説明("068", 2));
