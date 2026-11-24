/**
 * M07-06（買取商品一覧CSV出力）・M07-03 023（買取情報編集の買取商品一覧CSV出力）の、あとから足したケースのシード。正本: cases/M07-06_seed_data.tsv・M07-03_seed_data.tsv
 *
 * 既存の seeds/m07-06.ts は変えず、同じ作り方（カード商品CSV登録 → 商品規格 → 会員 → フロントで申込 → 売却を保存）をこのファイルに写して、
 * 画面で作れない部分だけを、E2E が作った実行の印つきの行にDBで書く（db/m07_w.ts。依頼者承認 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 共有のマスタ・設定は書き換えない（いまの値を読んで使う）。
 *
 * 読み替え（各シードの報告にも残る）:
 * - 略称タグ「TAGA」「TAGB」「CSV23」は新しく作らず、略称タグの一覧の先頭・2番目の既存の略称タグで代える。
 * - 買取依頼日「実行日の前日」は画面から決められない（申込んだ日になる）。ケースは確かめない。
 * - 状態SP・状態未設定・個別入力商品・更新日時・在庫数は、画面で作れないので、実行の印つきの買取・商品規格にだけDBで書く。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { ensureCardset } from "../pages/admin/product_masters";
import {
  F0504カードを登録する, カード商品CSVの公開の値, カード商品CSVの見出し, カード商品CSVを登録する, 商品名で商品IDを読む, 商品規格一覧を読む, 商品規格を削除する, 商品規格を登録する,
  単体カード配下のカテゴリID, 登録済みの割引率ID, 規格IDを選ぶ,
} from "../pages/admin/f05_04_products";
import { マスタを読む, 商品をカードにする, 略称タグを読む } from "../pages/admin/m07_09_card";
import { 売却を明細ごとに設定する } from "../pages/admin/m07_06";
import { 条件つきで申込む } from "../pages/front/m07_03_apply";
import { ログインする, 申込む, 買取する商品を選ぶ } from "../pages/front/m07_net_buy";
import { 会員のパスワード, 会員を用意する } from "./m07-03-b";
import { 個別入力商品をDBで作る, 選んで買取の査定価格をDBで設定する } from "./m07-db-prep";
import * as w from "../db/m07_w";
import "./m07-06";
import "./m07-03-b";

// ---------------------------------------------------------------------------
// 共有の前提（MASTER）を画面で読んで控える（書き換えない）
// ---------------------------------------------------------------------------

type 前提 = {
  言語ID: { JP: string; EN: string };
  レアリティID: Map<string, string>;
  略称タグ: string[];
  common: { 見出し: string[]; 公開: { 商品公開ステータス: string; 支店の商品公開ステータス: string }; カテゴリ: string; 割引率: string; 購入グループ: string; カードセット: string; 日本語: string; 英語: string };
};
let 控え: 前提 | null = null;

/** ケース（期待結果）が使う、読んだ言語ID・略称タグ・レアリティID */
export function 読んだ前提E(): { 言語ID: { JP: string; EN: string }; 略称タグ: string[] } {
  if (!控え) throw new Error("共有の前提（MASTER）を読んでいない");
  return { 言語ID: 控え.言語ID, 略称タグ: 控え.略称タグ };
}

async function 前提を読む(browser: Browser, seedId: string): Promise<前提> {
  if (控え) return 控え;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const v = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const byCode = async (種別: string, コード: string) => {
      const r = (await マスタを読む(page, 種別)).find((x) => x.コード === コード);
      if (!r) throw new Error(`MTGマスターデータ管理の${種別}に、コード ${コード} の行が無い（共有のマスタは書き換えない）`);
      return r;
    };
    const jp = await byCode("言語", "JP"), en = await byCode("言語", "EN");
    await byCode("状態", "NM");
    await byCode("状態", "SP");
    const rar = new Map<string, string>();
    for (const c of ["M", "C", "R"]) rar.set(c, (await byCode("レアリティ", c)).ID);
    const tags = await 略称タグを読む(page);
    if (tags.length < 2) throw new Error(`略称タグが ${tags.length} 件しかない（2件以上要る。共有のマスタは書き換えない）`);
    const lang = await readLanguageIds(page);
    const cardset = await ensureCardset(page, rc("M0706試験カードセット"), `M0706 Test Set ${RUN_MARK}`, `M6${RUN_MARK}`, issue);
    return {
      jp, en, rar, tags: tags.map((t) => t.名称),
      common: {
        見出し: await カード商品CSVの見出し(page), 公開: await カード商品CSVの公開の値(page), カテゴリ: (await 単体カード配下のカテゴリID(page)).id, 割引率: (await 登録済みの割引率ID(page)).id,
        購入グループ: await readExistingSellGroupName(page), カードセット: cardset, 日本語: lang.日本語, 英語: lang.英語,
      },
    };
  });
  控え = { 言語ID: { JP: v.jp.ID, EN: v.en.ID }, レアリティID: v.rar, 略称タグ: v.tags, common: v.common };
  issue(`シード作成時の問題: MASTER は共有のマスタなので書き換えず、いまの値を読んで使った（言語のID 日本語=${v.jp.ID}・英語=${v.en.ID}、レアリティのID ${[...v.rar].map(([k, x]) => `${k}=${x}`).join("・")}）。`
    + `略称タグ「TAGA」「CSV23」は新しく作らず略称タグの一覧の先頭の既存「${v.tags[0]}」、「TAGB」は2番目の既存「${v.tags[1]}」で代えた`);
  return 控え;
}

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

export const 注文者名E = (n: string): string => rc(`M0706-${n}-顧客`);
export const 品コードE = (n: string, 枝: string): string => rc(`M0706-${n}-${枝}`);
export const 品名E = (n: string, 枝: string): string => rc(`M0706-${n}-カード${枝}`);
export const 個別カード名005 = (): string => rc("M0706-005-個別カード");
/** M07-03 023 の商品コード・商品名（印つき） */
export const コード023 = (): string => rc("CSV-PROD-023");
export const 名前023 = (): string => rc("CSV確認商品");

type 明細E = {
  枝: string;
  数量: number;
  基準価格: number;
  買取価格?: number;
  売却: "売却する" | "売却しない";
  言語?: "JP" | "EN";
  /** 略称タグを付ける（0＝一覧の先頭の既存、1＝2番目の既存） */
  略称?: 0 | 1;
  レア?: "M" | "C" | "R";
  /** 商品コード・商品名を、決め打ちの正本の値（印つき）にする */
  コード?: string;
  名前?: string;
};

let cardSeq = 0;
const CARD_NO_BASE = String(Date.now()).slice(-9);
const 次のカード番号 = () => `${CARD_NO_BASE}${String(++cardSeq).padStart(2, "0")}`;

/** カード商品を1つ作る。商品IDを返す */
async function 商品を作る(page: Page, 前: 前提, seedId: string, n: string, d: 明細E): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const c = 前.common;
  const 言語 = d.言語 ?? "JP";
  const name = d.名前 ?? 品名E(n, d.枝);
  const code = d.コード ?? 品コードE(n, d.枝);
  const price = String(d.基準価格);
  const buy = String(d.買取価格 ?? d.基準価格);
  const reg = await F0504カードを登録する(page, {
    カード名英: rc(`M0706 CARD ${n} ${d.枝}`),
    詳細: [{ カードセットID: c.カードセット, カード番号: 次のカード番号(), レアリティID: 前.レアリティID.get(d.レア ?? "M")! }],
  }, `${seedId}: カード ${n}-${d.枝}`, issue);
  const row = (言語ID: string, 商品ID: string): Record<string, string> => ({
    "商品ID": 商品ID, "言語(ID)": 言語ID, "商品公開ステータス": c.公開.商品公開ステータス, "支店の商品公開ステータス": c.公開.支店の商品公開ステータス,
    "商品名(日)": name, "商品名(英)": name, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": c.カテゴリ,
    "購入グループ名称": c.購入グループ, "割引率(ID)": c.割引率, "基準価格": price, "販売価格": price, "買取価格": buy,
    "カード詳細(ID)": reg.カード詳細IDs[0],
  });
  await カード商品CSVを登録する(page, c.見出し, [row(c.日本語, "")], `m0706e-${n}-${d.枝}-jp-${RUN_MARK.toLowerCase()}.csv`, `${seedId}: カード商品CSV登録（日本語）`, issue);
  const productId = await 商品名で商品IDを読む(page, name);
  if (言語 === "EN") {
    await カード商品CSVを登録する(page, c.見出し, [row(c.英語, productId)], `m0706e-${n}-${d.枝}-en-${RUN_MARK.toLowerCase()}.csv`, `${seedId}: カード商品CSV登録（英語）`, issue);
  }
  if (d.略称 !== undefined) {
    await 商品をカードにする(page, productId, { 商品名: name, 略称タグ: 前.略称タグ[d.略称] }, issue);
  }
  const rows = await 商品規格一覧を読む(page, productId);
  const target = 規格IDを選ぶ(rows, 言語, "NM");
  await 商品規格を登録する(page, productId, target, { 商品コード: code, 買取価格: buy }, `${seedId}: ${n}-${d.枝} の規格`, issue);
  if (言語 === "EN") {
    for (const r of rows.filter((x) => x.言語 === "日本語")) await 商品規格を削除する(page, productId, r.商品規格ID, `${seedId}: ${n}-${d.枝} の日本語の規格`, issue);
  }
  return productId;
}

type 作った = { 番号: string; メール: string };

/**
 * 買取を1件作る: 商品 → 会員 → 申込 → 売却を保存。買取番号と会員のメール（DBへ書く印）を返す。
 * 買取依頼日は「実行日の前日」だが、画面から決められない。
 */
async function 買取を作る(browser: Browser, seedId: string, n: string, 明細: 明細E[], 会員の姓: string): Promise<作った> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 前 = await 前提を読む(browser, seedId);
  const ids = new Map<string, string>();
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const d of 明細) ids.set(d.枝, await 商品を作る(page, 前, seedId, n, d));
  });
  issue("シード作成時の問題: 買取依頼日は「実行日の前日」だが、画面からは決められない（申込んだ日になる）。ケースは買取依頼日を確かめない。商品はカード商品CSV登録で作った（グッズ商品CSV登録は開発環境のカテゴリIDの不具合 ECCUBE_HARERUYA-3966 で使わない）");
  issue(`シード作成時の問題: カード商品CSVの商品公開ステータスは、画面のCSVの形式の説明で「公開」に当たる値 ${前.common.公開.商品公開ステータス} を入れた。支店の商品公開ステータスは ${前.common.公開.支店の商品公開ステータス}（公開）`);

  const メール = `${rc(`m0706e-${n}`)}@example.test`.toLowerCase();
  await 会員を用意する(browser, seedId, { 姓: 会員の姓, 名: "シード", セイ: "シケン", メイ: "シード", メール, 電話: ["090", "1234", "5678"] });
  issue(`シード作成時の問題: 会員はフロントの会員登録＋管理画面の会員登録編集（本会員）で作った。お名前の姓（注文者名）は実行の印つき（${会員の姓}）`);

  let 番号 = "";
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const fp = await ctx.newPage();
    fp.setDefaultTimeout(60_000);
    await ログインする(fp, { メール, パスワード: 会員のパスワード });
    番号 = await 条件つきで申込む(fp, 明細.map((d) => ({ 商品ID: ids.get(d.枝)!, 数量: String(d.数量) })), { 承諾方法: "査定結果を確認してから承諾する", 登録番号: null, 口座名義: "シケンシード" });
  } finally { await ctx.close(); }

  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 売却を明細ごとに設定する(page, 番号, 明細.map((d) => ({ 名前: d.名前 ?? 品名E(n, d.枝), 売却: d.売却 })));
  });
  return { 番号, メール };
}

const NEEDS06 = ["S-M07-06-ADM", "S-M07-06-MASTER"];

// ---- M07-06-002: 状態SP の明細 ----
defineSeed("S-M07-06-STATE-002", { needs: NEEDS06 }, async ({ browser, seed, notes }) => {
  const a = await 買取を作る(browser, seed.シードID, "002", [
    { 枝: "A", 数量: 1, 基準価格: 1000, 売却: "売却する", 略称: 0, レア: "M" },
    { 枝: "B", 数量: 1, 基準価格: 1000, 売却: "売却する", 略称: 1, レア: "C" },
  ], 注文者名E("002"));
  // フロントの買取カートは状態NMの規格だけを入れられるので、Bの規格と明細の状態を、申込のあとでDBで「SP」にする
  w.規格の状態を設定する(品コードE("002", "B"), "SP");
  w.明細の状態を設定する(a.番号, a.メール, 品コードE("002", "B"), "SP");
  reportSeedIssue(seed.シードID, `シード作成時の問題: フロントの買取カートは状態NMの規格だけを入れられる（アプリの作り）ので、申込（状態NM）のあと、DBで商品 ${品コードE("002", "B")} の規格と買取明細の状態を「SP」にした（実行の印つきの商品・買取にだけ書いた）`);
  notes.set("〔買取番号-M0706-002〕", a.番号);
});

// ---- M07-06-006: 状態が未設定の明細 ----
defineSeed("S-M07-06-NOSTATE-006", { needs: NEEDS06 }, async ({ browser, seed, notes }) => {
  const a = await 買取を作る(browser, seed.シードID, "006", [
    { 枝: "A", 数量: 1, 基準価格: 1000, 売却: "売却する", 言語: "EN", 略称: 1, レア: "C" },
  ], 注文者名E("006"));
  w.明細の状態を未設定にする(a.番号, a.メール, 品コードE("006", "A"));
  reportSeedIssue(seed.シードID, "シード作成時の問題: 買取明細の状態を「未設定」にする画面が無いので、DBで、実行の印つきの買取の明細の状態を空にした");
  notes.set("〔買取番号-M0706-006〕", a.番号);
});

// ---- M07-06-011: 更新日時・在庫数がCSV出力で変わらないこと ----
export const 更新日時011 = "2026/09/01 10:00:00";
defineSeed("S-M07-06-NOUPD-011", { needs: NEEDS06 }, async ({ browser, seed, notes }) => {
  const a = await 買取を作る(browser, seed.シードID, "011", [
    { 枝: "A", 数量: 4, 基準価格: 1000, 売却: "売却する", 略称: 0, レア: "M" },
  ], 注文者名E("011"));
  // 画面の保存が更新日時を書き換えるので、画面の操作がすべて済んだあとにDBで設定する
  w.更新日時を設定する(a.番号, a.メール, "2026-09-01 10:00:00+09");
  w.規格の在庫数を設定する(品コードE("011", "A"), 20);
  reportSeedIssue(seed.シードID, `シード作成時の問題: 更新日時 ${更新日時011}・商品規格の在庫数20は画面で指定できないので、画面の操作がすべて済んだあと、DBで実行の印つきの買取の更新日時と、商品コード ${品コードE("011", "A")} の本店の在庫数を設定した。買取状況は申込直後の「注文」のまま`);
  notes.set("〔買取番号-M0706-011〕", a.番号);
});

// ---- M07-06-005: 個別入力商品だけの買取 ----
export const 個別の査定金額005 = 1000;
/** 買取番号706005001は画面で決められない。シード表に呼び名が無いので、画面が振った番号を、このプロセスの中だけで持ち回す */
export const 控え005 = new Map<string, string>();
defineSeed("S-M07-06-FREE-005", { needs: NEEDS06 }, async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, `シード作成時の問題: ${m}`);
  const 姓 = 注文者名E("005");
  const メール = `${rc("m0706e-005")}@example.test`.toLowerCase();
  await 会員を用意する(browser, seed.シードID, { 姓, 名: "シード", セイ: "シケン", メイ: "シード", メール, 電話: ["090", "1234", "5678"] });
  let 番号 = "";
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const fp = await ctx.newPage();
    fp.setDefaultTimeout(60_000);
    await ログインする(fp, { メール, パスワード: 会員のパスワード });
    番号 = String(Number(await 申込む(fp, await 買取する商品を選ぶ(fp))));
  } finally { await ctx.close(); }
  // 画面は買取明細なしの申込ができず、個別入力商品を作る画面も無い。申込のあと、DBで、実行の印つきの買取の明細を消し、個別入力商品を1件足す
  const 消した = w.選んで買取の明細を消す(番号, メール);
  個別入力商品をDBで作る(番号, メール, [{ 名前: 個別カード名005(), 査定金額: 個別の査定金額005, 数量: 1, 売却: "する" }]);
  issue(`買取番号 706005001 は画面で決められない（画面が振った番号 ${番号} を使う）。買取は画面で明細なしでは申込めないので、既存の買取できる商品1点で申込んだあと、DBで、実行の印つきの買取の通常買取明細 ${消した} 件を消し、個別入力商品「${個別カード名005()}」（数量1・売却する。査定金額はシード表に無いので ${個別の査定金額005} 円）を足した`);
  控え005.set("買取番号", 番号);
});

// ---- M07-03-023: 買取情報編集の買取商品一覧CSV出力 ----
defineSeed("S-M07-03-CASE-023", { needs: ["S-M07-03-ADM"] }, async ({ browser, seed, notes }) => {
  const a = await 買取を作る(browser, seed.シードID, "023", [
    { 枝: "P", 数量: 2, 基準価格: 1500, 買取価格: 700, 売却: "売却する", 略称: 0, レア: "R", コード: コード023(), 名前: 名前023() },
  ], rc("M0703-023-顧客"));
  // カード商品の買取明細は画面（査定編集）で買取価格を入れられないので、DBで実行の印つきの買取の明細の買取価格を700にする
  選んで買取の査定価格をDBで設定する(a.番号, a.メール, コード023(), 700);
  reportSeedIssue(seed.シードID, `シード作成時の問題: シード表はグッズ商品CSV登録で商品を作る定めだが、開発環境のカテゴリIDの不具合（ECCUBE_HARERUYA-3966）で使えないので、カード商品CSV登録（日本語・状態NM・レアリティR・基準価格＝販売価格1500・買取価格700）で作った。略称タグ「CSV23」は新しく作らず、略称タグの一覧の先頭の既存「${読んだ前提E().略称タグ[0]}」で代えた。商品コード・商品名は実行の印つき`);
  notes.set("〔買取番号-M0703-023〕", a.番号);
});

