/**
 * F05-04 ネット買取商品詳細（フロント）の画面シード。正本: cases/F05-04_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. カード新規登録画面でカードを登録し、カードIDと詳細情報のカード詳細IDを控える。
 * 2. カード商品CSV登録画面で、商品IDを空にした行（言語JP）を取り込み、商品マスター(検索結果)で商品名から商品IDを控える。
 *    言語ENもある商品は、続けて商品IDを入れた行（言語EN）を取り込む。
 * 3. 商品規格登録編集画面で、言語JP・状態NMの規格に商品コード（と買取価格）を入れて登録する。シード表が定める残りの規格の買取価格も入れ、
 *    シード表が残す状態（NM・EX など）以外の状態の規格を削除する。
 * 4. 画像のあるシードは、商品登録編集画面で画像を追加して「商品を登録」し、商品規格登録編集画面で代表画像を選ぶ。
 * サプライ商品（007B・048）はグッズ商品CSV登録で作る。
 *
 * 作らないシード（理由は記録と PM への報告に書く）:
 * - CATEGORY（販売側の販促バナーを DB へ直接設定する）・SEARCH-ENV（外部の商品検索サービスの試験環境・≪共有の設定≫）
 * - CARD-017（販売数量を DB へ直接設定する）・LEGACY-044〜046（旧商品コード対応を DB で登録・削除する）
 * - 上の2つを使うケースだけが使うシード（002〜006・019・021・022・024〜030・042・050・051・054〜056・060〜065 のシード）
 *
 * 決め打ちの識別の値（商品名・商品コード・カード名）には実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * シード表が値を定めないもので、ここで決めたこと（各シードの報告にも出す）:
 * - 「単体カード配下のカテゴリ」は、管理画面の最上位カテゴリ「シングルカード」の配下の先頭のカテゴリ。
 * - 「任意の金額」の買取価格は 100 円（基準価格・販売価格も 100 円）。基準価格が300円以上だとNM以外の規格のスマレジ連携フラグが「連携する」になり、
 *   保存すると外部のスマレジへ送られるため、決まっていない金額は300円未満にした。決まった金額（499・500・600・800・1200）の基準価格・販売価格は買取価格と同じ。
 * - サイズ・重量は 1。購入グループ名称は購入グループの一覧の先頭、割引率(ID)は商品登録編集画面の割引率の選択肢の先頭。
 * - カードの詳細情報には、このシード専用のカードセット「F0504試験カードセット」と、重ならないカード番号を入れる
 *   （カード商品CSVは商品コードをカードセットのコードとカード番号から振り、同じ商品コードがあると取り込めないため）。
 * - 画像は f03_06 の部品で、画像名ごとに色の違う小さな画像を作って追加する（正本は中身を定めない）。
 */
import { Browser, BrowserContext, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { CategoryPage } from "../pages/admin/category";
import { imageFile, saveProductWithImages } from "../pages/admin/f03_06_products";
import "./f05-01"; // CATEGORY が使う共有シード S-F05-01-CATEGORY-ROOTS（最新セットの第一階層）を登録する
import {
  F0504カードの入力, F0504カードを登録する, カード商品CSVの見出し, カード商品CSVを登録する, 商品IDで公開状態すべてを検索した件数, 商品名で商品IDを読む,
  商品規格一覧を読む, 商品規格を削除する, 商品規格を登録する, 単体カード配下のカテゴリID, 登録済みの割引率ID, 査定例ページの行数, 規格IDを選ぶ,
} from "../pages/admin/f05_04_products";
import { readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { productIdsByCode, readGoodsRootCategoryId, readLanguageIds } from "../pages/admin/m03_23_seed_products";
import { ensureCardset } from "../pages/admin/product_masters";
import { NetBuyCartPage, NetBuyDetailPage } from "../pages/front/f05_04_net_detail";

type 言語 = "JP" | "EN";
type 規格キー = `${言語}-${string}`;

/** シードが作った商品（正本の商品名で引く） */
export type F0504の商品 = {
  商品ID: string;
  /** 「JP-NM」の形の商品クラス → 商品規格ID（削除しなかった規格） */
  規格: Record<string, string>;
  /** 規格に選んだ代表画像のファイル名（画面が付け直したもの） */
  画像: Record<string, string>;
};
const built = new Map<string, F0504の商品>();

/** ケースの文の商品名（正本の値）から、シードが作った商品を引く */
export function f0504商品(正本の商品名: string): F0504の商品 {
  const p = built.get(正本の商品名);
  if (!p) throw new Error(`商品 ${正本の商品名} はまだ作っていない`);
  return p;
}

/** 057 のシードがカートに19点入れたブラウザのCookie（ケースのブラウザへ移す） */
export const f0504カートのCookie = new Map<string, Awaited<ReturnType<BrowserContext["cookies"]>>>();

// ---- 共通の値（1回の実行で1度だけ画面から読む） ----

type 共通の値 = { 見出し: string[]; 日本語: string; 英語: string; カテゴリ: string; 購入グループ: string; 割引率: string; カードセット: string };
let common: 共通の値 | null = null;
const CARD_NO_BASE = String(Date.now()).slice(-9);
let cardSeq = 0;
const nextCardNo = () => `${CARD_NO_BASE}${String(++cardSeq).padStart(2, "0")}`;

async function readCommon(page: Page, seedId: string): Promise<共通の値> {
  if (common) return common;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const lang = await readLanguageIds(page);
  const cat = await 単体カード配下のカテゴリID(page);
  const discount = await 登録済みの割引率ID(page);
  const sellGroup = await readExistingSellGroupName(page);
  const cardset = await ensureCardset(page, "F0504試験カードセット", "F0504 Test Set", "F0504S", issue);
  const 見出し = await カード商品CSVの見出し(page);
  common = { 見出し, 日本語: lang.日本語, 英語: lang.英語, カテゴリ: cat.id, 購入グループ: sellGroup, 割引率: discount.id, カードセット: cardset };
  issue(`単体カード配下のカテゴリは「シングルカード」配下の先頭「${cat.名称}」（ID ${cat.id}）、購入グループ名称は「${sellGroup}」、割引率は「${discount.名称}」（ID ${discount.id}）を使った（シード表は「登録済みの」とだけ定める）`);
  return common;
}

// ---- カード商品の定義 ----

type 規格の指定 = { 商品コード?: string; 買取?: number; 画像?: string };
export type カード商品の定義 = {
  /** 正本の商品名 */
  名: string;
  /** 言語（JP は必ず。EN は続けて取り込む） */
  言語: 言語[];
  /** CSV の買取価格（基準価格・販売価格も同じ値） */
  買取: number;
  /** 商品規格登録編集で入れる値（商品クラス → 値）。商品コードは正本の値（印を付けて入れる） */
  規格: Partial<Record<規格キー, 規格の指定>>;
  /** 残す状態（指定したときは、ほかの状態の規格を削除する） */
  残す状態?: string[];
  /** 画像が無いとケースが成り立たない（画像を追加できなければ止める） */
  画像が要る?: boolean;
  /** 商品カテゴリ(ID)。省略すると、管理画面の最上位カテゴリ「シングルカード」配下の先頭のカテゴリ */
  カテゴリID?: string;
};

export async function カード商品を作る(
  browser: Browser, seedId: string, notes: Notes,
  card: { 名英: string; 任意の説明?: boolean; 基本土地?: F0504カードの入力["基本土地"] }, def: カード商品の定義,
  /** 他の機能（F05-06 など）が使うときは false（シード表の呼び名の形が F0504 のものだけを控えるため） */
  呼び名を控える = true,
): Promise<F0504の商品> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  let out: F0504の商品 | null = null;
  let cardId = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const c = await readCommon(page, seedId);
    // 1. カード
    const cardName = rc(card.名英);
    const reg = await F0504カードを登録する(page, {
      カード名英: cardName,
      任意の説明: card.任意の説明 ? { カード名日: cardName, ルールテキスト日: "F0504試験用のカード説明" } : undefined,
      詳細: [{ カードセットID: c.カードセット, カード番号: nextCardNo() }],
      基本土地: card.基本土地,
    }, `${seedId}: カード ${card.名英}`, issue);
    cardId = reg.カードID;
    // 2. カード商品CSV
    const name = rc(def.名);
    const price = String(def.買取);
    const row = (言語ID: string, 商品ID: string): Record<string, string> => ({
      "商品ID": 商品ID, "言語(ID)": 言語ID, "商品公開ステータス": "2", "支店の商品公開ステータス": "1",
      "商品名(日)": name, "商品名(英)": name, "サイズ": "1", "重量": "1", "商品カテゴリ(ID)": def.カテゴリID ?? c.カテゴリ,
      "購入グループ名称": c.購入グループ, "割引率(ID)": c.割引率, "基準価格": price, "販売価格": price, "買取価格": price,
      "カード詳細(ID)": reg.カード詳細IDs[0],
    });
    await カード商品CSVを登録する(page, c.見出し, [row(c.日本語, "")], `${seedId}-JP.csv`, `${seedId}: カード商品CSV登録（JP）`, issue);
    const productId = await 商品名で商品IDを読む(page, name);
    if (def.言語.includes("EN")) {
      await カード商品CSVを登録する(page, c.見出し, [row(c.英語, productId)], `${seedId}-EN.csv`, `${seedId}: カード商品CSV登録（EN）`, issue);
    }
    // 4（前半）. 画像（代表画像を選ぶ前に、商品へ追加する）
    const imageNames = Object.entries(def.規格).filter(([, v]) => v?.画像).map(([k, v]) => [k, v!.画像!] as const);
    const imageFileOf = new Map<string, string>();
    if (imageNames.length) {
      const files = imageNames.map(([, n]) => imageFile(n));
      const sources = await saveProductWithImages(page, productId, files, `${seedId}: 商品の画像`, issue);
      if (sources.length < files.length) {
        const m = `${seedId}: 商品画像を ${files.length} 件追加するはずが ${sources.length} 件しか追加できなかった`;
        if (def.画像が要る) throw new Error(`${m}。画像の表示を確かめるケースなので、画像なしでは成り立たない`);
        issue(`${m}。代表画像は選ばずに続けた`);
      } else {
        imageNames.forEach(([k], i) => imageFileOf.set(k, sources[i]));
      }
    }
    // 3. 商品規格
    let rows = await 商品規格一覧を読む(page, productId);
    issue(`${seedId}: 取り込みで作られた商品規格: ${rows.map((r) => `${r.言語}-${r.状態}（${r.商品規格ID}）`).join("、")}`);
    for (const [key, v] of Object.entries(def.規格)) {
      if (!v) continue;
      const [lang, state] = key.split("-") as [言語, string];
      const classId = 規格IDを選ぶ(rows, lang, state);
      await 商品規格を登録する(page, productId, classId, {
        商品コード: v.商品コード ? rc(v.商品コード) : undefined,
        買取価格: v.買取 !== undefined ? String(v.買取) : undefined,
        代表画像: imageFileOf.has(key) ? [imageFileOf.get(key)!] : undefined,
      }, `${seedId}: ${key}`, issue);
    }
    if (def.残す状態) {
      for (const r of rows.filter((x) => !def.残す状態!.includes(x.状態))) {
        await 商品規格を削除する(page, productId, r.商品規格ID, `${seedId}: ${r.言語}-${r.状態}`, issue);
      }
      rows = await 商品規格一覧を読む(page, productId);
    }
    const 規格: Record<string, string> = {};
    for (const r of rows) 規格[`${r.言語 === "日本語" ? "JP" : r.言語 === "英語" ? "EN" : r.言語}-${r.状態}`] = r.商品規格ID;
    out = { 商品ID: productId, 規格, 画像: Object.fromEntries(imageFileOf) };
  });
  built.set(def.名, out!);
  if (呼び名を控える) noteLabels(seedId, notes, { 商品: [out!.商品ID], カード: [cardId] });
  return out!;
}

/** グッズ商品CSV登録で、サプライ・グッズのカテゴリのサプライ商品を作る。商品IDを返す */
async function サプライ商品を作る(browser: Browser, seedId: string, 名: string, 買取: number, カテゴリID?: string): Promise<string> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  let id = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = カテゴリID ?? await readGoodsRootCategoryId(page);
    const p = String(買取);
    await registerGoodsCsv(page, {
      what: `${seedId}: グッズ商品CSV登録`, fileName: `${seedId}-goods.csv`, categoryId,
      lines: [{ code: rc(名), nameJp: rc(名), nameEn: rc(名), values: { "基準価格": p, "販売価格": p, "原価単価": p, "買取価格": p } }],
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const ids = await productIdsByCode(page, rc(名));
    if (ids.length !== 1) throw new Error(`${seedId}: 商品コード ${rc(名)} の商品が ${ids.length} 件ある（1件のはず）`);
    id = ids[0];
  });
  issue(`${seedId}: サプライ商品は、${カテゴリID ? `カテゴリID ${カテゴリID} のカテゴリ` : "管理画面の最上位カテゴリ「サプライ・グッズ」のID"}で作った。基準価格・販売価格・原価単価は買取価格と同じ ${買取} 円`);
  built.set(名, { 商品ID: id, 規格: {}, 画像: {} });
  return id;
}

/** シード表の状態・属性・投入方法に出てくる呼び名（〔商品ID-F0504-NNN[A|B]〕・〔カードID-F0504-NNN[A|B]〕）を控える */
function noteLabels(seedId: string, notes: Notes, v: { 商品: string[]; カード: string[] }): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(商品ID|カードID)-F0504-\d{3}([AB]?)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const idx = m[2] === "B" ? 1 : 0;
    const value = (m[1] === "商品ID" ? v.商品 : v.カード)[idx];
    if (value) notes.set(label, value);
  }
}

// ---- 1商品・言語JPだけ・JP-NM に商品コード（と買取価格）を入れる形 ----

function defineSimpleCardSeed(seedId: string, カード名: string, 商品名: string, 買取: number, 買取を入れる: boolean): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    await カード商品を作る(browser, seedId, notes, { 名英: カード名 }, {
      名: 商品名, 言語: ["JP"], 買取, 規格: { "JP-NM": { 商品コード: 商品名, 買取: 買取を入れる ? 買取 : undefined } },
    });
  });
}

// ---- 001 ----
defineSeed("S-F05-04-CARD-001", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-001", notes, { 名英: "F0504-CARD-A-001" }, {
    名: "F0504-CARD-001-001", 言語: ["JP", "EN"], 買取: 100, 残す状態: ["NM", "EX"],
    規格: {
      "JP-NM": { 商品コード: "F0504-CARD-001-001", 買取: 100, 画像: "F0504-001-JP-NM" },
      "JP-EX": { 買取: 100, 画像: "F0504-001-JP-EX" },
      "EN-NM": { 買取: 100, 画像: "F0504-001-EN-NM" },
      "EN-EX": { 買取: 100, 画像: "F0504-001-EN-EX" },
    },
  });
});

// ---- 007 ----
defineSeed("S-F05-04-CARD-SUPPLY-007", async ({ browser, notes }) => {
  const seedId = "S-F05-04-CARD-SUPPLY-007";
  const card = await カード商品を作る(browser, seedId, notes, { 名英: "F0504-CARD-A-007", 任意の説明: true }, {
    名: "F0504-CARD-001-007", 言語: ["JP", "EN"], 買取: 100, 残す状態: ["NM", "EX"],
    規格: {
      "JP-NM": { 商品コード: "F0504-CARD-001-007", 買取: 100, 画像: "F0504-007-JP-NM" },
      "JP-EX": { 買取: 100, 画像: "F0504-007-JP-EX" },
      "EN-NM": { 買取: 100, 画像: "F0504-007-EN-NM" },
      "EN-EX": { 買取: 100, 画像: "F0504-007-EN-EX" },
    },
  });
  const supply = await サプライ商品を作る(browser, seedId, "F0504-SUPPLY-001-007", 100);
  notes.set("〔商品ID-F0504-007A〕", card.商品ID);
  notes.set("〔商品ID-F0504-007B〕", supply);
});

// ---- 008・009（買取価格の境界） ----
defineSimpleCardSeed("S-F05-04-PRICE-008", "F0504-PRICE-CARD-008", "F0504-PRICE-499-008", 499, true);
defineSimpleCardSeed("S-F05-04-PRICE-009", "F0504-PRICE-CARD-009", "F0504-PRICE-500-009", 500, true);

// ---- 010・011・012（SNS） ----
defineSimpleCardSeed("S-F05-04-CARD-010", "F0504-CARD-A-010", "F0504-CARD-001-010", 100, false);
defineSimpleCardSeed("S-F05-04-CARD-011", "F0504-CARD-A-011", "F0504-CARD-001-011", 100, false);
defineSimpleCardSeed("S-F05-04-CARD-012", "F0504-CARD-A-012", "F0504-CARD-001-012", 100, false);

// ---- 013（EN-EX の初期表示。各クラスに異なる画像） ----
defineSeed("S-F05-04-CARD-013", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-013", notes, { 名英: "F0504-CARD-A-013" }, {
    名: "F0504-CARD-001-013", 言語: ["JP", "EN"], 買取: 100, 残す状態: ["NM", "EX"], 画像が要る: true,
    規格: {
      "JP-NM": { 商品コード: "F0504-CARD-001-013", 画像: "F0504-013-JP-NM" },
      "JP-EX": { 画像: "F0504-013-JP-EX" },
      "EN-NM": { 画像: "F0504-013-EN-NM" },
      "EN-EX": { 画像: "F0504-013-EN-EX" },
    },
  });
});

// ---- 014（言語切替） ----
defineSeed("S-F05-04-CARD-014", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-014", notes, { 名英: "F0504-CARD-A-014" }, {
    名: "F0504-CARD-001-014", 言語: ["JP", "EN"], 買取: 100, 残す状態: ["NM", "EX"],
    規格: { "JP-NM": { 商品コード: "F0504-CARD-001-014", 買取: 100 }, "JP-EX": { 買取: 100 }, "EN-NM": { 買取: 100 }, "EN-EX": { 買取: 100 } },
  });
});

// ---- 015（商品クラス切替。JP-NM と JP-EX に異なる画像） ----
defineSeed("S-F05-04-CARD-015", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-015", notes, { 名英: "F0504-CARD-A-015" }, {
    名: "F0504-CARD-001-015", 言語: ["JP"], 買取: 100, 残す状態: ["NM", "EX"], 画像が要る: true,
    規格: { "JP-NM": { 商品コード: "F0504-CARD-001-015", 画像: "F0504-015-JP-NM" }, "JP-EX": { 画像: "F0504-015-JP-EX" } },
  });
});

// ---- 016（画像の拡大） ----
defineSeed("S-F05-04-CARD-016", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-016", notes, { 名英: "F0504-CARD-A-016" }, {
    名: "F0504-CARD-001-016", 言語: ["JP"], 買取: 100, 画像が要る: true,
    規格: { "JP-NM": { 商品コード: "F0504-CARD-001-016", 画像: "F0504-016-JP-NM" } },
  });
});

// ---- 020（パワー・タフネス・忠誠度なし） ----
defineSimpleCardSeed("S-F05-04-NO-SALES-020", "F0504-NO-SALES-CARD-020", "F0504-NO-SALES-020", 100, false);

// ---- 033〜037（数量・カート。買取価格600円） ----
defineSimpleCardSeed("S-F05-04-CART-033", "F0504-CART-CARD-033", "F0504-CART-033", 600, true);
defineSimpleCardSeed("S-F05-04-CART-034", "F0504-CART-CARD-034", "F0504-CART-034", 600, true);
defineSimpleCardSeed("S-F05-04-CART-035", "F0504-CART-CARD-035", "F0504-CART-035", 600, true);
defineSimpleCardSeed("S-F05-04-CART-036", "F0504-CART-CARD-036", "F0504-CART-036", 600, true);
defineSimpleCardSeed("S-F05-04-CART-037", "F0504-CART-CARD-037", "F0504-CART-037", 600, true);

// ---- 039（言語・クラス未指定） ----
defineSeed("S-F05-04-CARD-039", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-039", notes, { 名英: "F0504-CARD-A-039" }, {
    名: "F0504-CARD-001-039", 言語: ["JP", "EN"], 買取: 100, 残す状態: ["NM", "EX"],
    規格: { "JP-NM": { 商品コード: "F0504-CARD-001-039" } },
  });
});

// ---- 041（状態別の買取価格） ----
defineSeed("S-F05-04-CARD-041", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-041", notes, { 名英: "F0504-CARD-A-041" }, {
    名: "F0504-CARD-001-041", 言語: ["JP"], 買取: 1200, 残す状態: ["NM", "EX"],
    規格: { "JP-NM": { 商品コード: "F0504-CARD-001-041", 買取: 1200 }, "JP-EX": { 買取: 800 } },
  });
});

// ---- 043（未登録の商品ID） ----
defineSeed("S-F05-04-NOT-FOUND-043", async ({ browser }) => {
  const seedId = "S-F05-04-NOT-FOUND-043";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const n = await 商品IDで公開状態すべてを検索した件数(page, "999999");
    if (n !== 0) {
      // シード表は「該当があれば商品を削除」とするが、ほかのデータを消すことになるので消さずに止める（PM の方針）
      throw new Error(`${seedId}: 商品ID 999999 の商品が ${n} 件ある。シード表はその商品を削除するとするが、ほかのデータなので消さずに止めた`);
    }
  });
  reportSeedIssue(seedId, "商品マスターで商品ID 999999 を公開状態すべてで検索し、0件であることを確かめた（削除はしていない）");
});

// ---- 047（カード言語ラベル） ----
defineSeed("S-F05-04-CARD-047", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-047", notes, { 名英: "F0504-047-CARD" }, {
    名: "F0504-047-A", 言語: ["JP", "EN"], 買取: 600, 残す状態: ["NM"],
    規格: {
      "JP-NM": { 商品コード: "F0504-047-A", 買取: 600, 画像: "F0504-047-JP-NM" },
      "EN-NM": { 買取: 600, 画像: "F0504-047-EN-NM" },
    },
  });
});

// ---- 048（サプライ商品） ----
defineSeed("S-F05-04-SUPPLY-048", async ({ browser, notes }) => {
  notes.set("〔商品ID-F0504-048〕", await サプライ商品を作る(browser, "S-F05-04-SUPPLY-048", "F0504-048-A", 800));
});

// ---- 049（査定例ページ） ----
defineSeed("S-F05-04-ASSESS-049", async ({ browser, notes }) => {
  const seedId = "S-F05-04-ASSESS-049";
  await カード商品を作る(browser, seedId, notes, { 名英: "F0504-049-CARD" }, {
    名: "F0504-049-A", 言語: ["JP"], 買取: 600, 残す状態: ["NM"],
    規格: { "JP-NM": { 商品コード: "F0504-049-A", 買取: 600 } },
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const n = await 査定例ページの行数(page);
    // ページ管理に公開の切り替えは無い。ページがあればフロントで開ける。無ければ作らずに止める（共有のマスタを書き換えない）
    if (n < 1) throw new Error(`${seedId}: ページ管理に査定例ページ（purchase_example）が無い。シード表は公開状態にするとするが、共有のページを書き換えずに止めた`);
  });
  reportSeedIssue(seedId, "ページ管理の一覧で査定例ページ（purchase_example）があることを確かめた（ページ管理に公開の切り替えは無く、書き換えていない）");
});

// ---- 052・053（数量の上限・下限） ----
defineSimpleCardSeed("S-F05-04-QTY-052", "F0504-052-CARD", "F0504-052-A", 600, true);
defineSimpleCardSeed("S-F05-04-QTY-053", "F0504-053-CARD", "F0504-053-A", 600, true);

// ---- 057（カートに19点入っている） ----
defineSeed("S-F05-04-LIMIT19-057", async ({ browser, notes }) => {
  const seedId = "S-F05-04-LIMIT19-057";
  const p = await カード商品を作る(browser, seedId, notes, { 名英: "F0504-LIMIT-CARD-057" }, {
    名: "F0504-LIMIT-057", 言語: ["JP"], 買取: 600, 規格: { "JP-NM": { 商品コード: "F0504-LIMIT-057", 買取: 600 } },
  });
  // ケースのブラウザのカートに入れるため、新しいブラウザで入れて、その Cookie をケースへ渡す（ケースの直前にケースのブラウザへ移す）
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const d = new NetBuyDetailPage(page);
    const status = await d.開く(p.商品ID);
    if (status >= 400) throw new Error(`${seedId}: ネット買取商品詳細が開けない（応答 ${status}）`);
    await d.プラスを押す(18);
    const qty = await d.数量.inputValue();
    if (qty !== "19") throw new Error(`${seedId}: プラスを18回押したあとの買取数量が ${qty}（19のはず）`);
    const r = await d.カートに追加を押す();
    if (r.応答 !== 200) throw new Error(`${seedId}: 「カートに追加」の応答が ${r.応答}（知らせ「${r.知らせ}」）`);
    const cart = new NetBuyCartPage(page);
    await cart.開く();
    const q = await cart.数量(p.商品ID);
    if (q.length !== 1 || q[0] !== "19") throw new Error(`${seedId}: ネット買取カートの同じ規格が ${JSON.stringify(q)}（19点の1行のはず）`);
    f0504カートのCookie.set(seedId, await context.cookies());
  } finally {
    await context.close();
  }
  reportSeedIssue(seedId, "カートの19点は、シード用の新しいブラウザでネット買取商品詳細からプラスを18回押して「カートに追加」し、カートで19点を確かめた。そのブラウザのCookie（買取カートのセッション）を、ケースのブラウザへ移してから手順を始める");
});

// ---- 058（同じ規格を2回追加） ----
defineSimpleCardSeed("S-F05-04-REPEAT-058", "F0504-REPEAT-CARD-058", "F0504-REPEAT-058", 600, true);

// ---- 059（状態ごとに買取価格が違う） ----
defineSeed("S-F05-04-MIXPRICE-059", async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-MIXPRICE-059", notes, { 名英: "F0504-MIXPRICE-CARD-059" }, {
    名: "F0504-MIXPRICE-059", 言語: ["JP"], 買取: 600, 残す状態: ["NM", "EX"],
    規格: { "JP-NM": { 商品コード: "F0504-MIXPRICE-059", 買取: 600 }, "JP-EX": { 買取: 400 } },
  });
});

// ==== 読み替えで作るシード（依頼者の方針 2026-11-10。002・003・005・006・055・060・061・063） ====
//
// - CATEGORY（共有可）: シード表は「タルキール：龍嵐録」などのカテゴリを共有のカテゴリとして作り、販売側の販促バナーを DB へ直接設定する。
//   共有のカテゴリツリーは書き換えず、実行の印つきのカテゴリを画面（カテゴリ登録）で作って代える（F05-01 と同じ作り方）。
//   単体カード配下（シングルカード）に1件、最新セットの下に親子1組。販促バナーの設定は行わない（バナーを使うケース 056 は作らない）。
// - SEARCH-ENV（共有可）: 外部の商品検索サービスの接続先・商品フィード連携先（共有の設定）は書き換えない。
//   このシードを使うケースのうち、検索サービスから出る一覧を確かめる手順は実装していない。ここでは何も設定しない。
// - SUPPLY-003: サプライ・グッズ＞スリーブ＞KMC の階層を、実行の印つきの名前で作る（スリーブ・KMC は印つき）。
// - CBLAND*（060・061・063）: 基本土地は「同名カードの一覧」を出さない作りなので、比較商品（B）と検索サービスへの反映は使わない。
//   商品Aだけを作る（カード詳細は1件）。

/** CATEGORY が作ったカテゴリ（正本の値）。画面の名前は rc() を付けた値 */
export const F0504カテゴリ = { 単体: "タルキール：龍嵐録-F0504", 最新セットの親: "セットF0504-A", 最新セットの子: "タルキール：龍嵐録-F0504-B" } as const;
export const F0504サプライの階層 = { スリーブ: "スリーブ-F0504-003", KMC: "KMC-F0504-003" } as const;
const categoryIds = new Map<string, string>();
export function f0504カテゴリID(正本の名: string): string {
  const id = categoryIds.get(正本の名);
  if (!id) throw new Error(`カテゴリ ${正本の名} はまだ作っていない`);
  return id;
}

defineSeed("S-F05-04-SEARCH-ENV", async () => {
  reportSeedIssue("S-F05-04-SEARCH-ENV", "ネット買取の商品検索サービス接続先・商品フィード連携先（共有の設定）は書き換えず、何も設定していない。環境に設定済みの値を使う。索引から出る一覧（他のバージョン商品・カテゴリ検索の一覧）を確かめるケースの商品は、seeds/f05-04-index.ts が作ってユニサーチフィード作成で送る");
});

defineSeed("S-F05-04-CATEGORY", { needs: ["S-F05-01-CATEGORY-ROOTS"] }, async ({ browser, notes }) => {
  const seedId = "S-F05-04-CATEGORY";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const category = new CategoryPage(page);
    await category.openTop();
    const single = await category.idOf("シングルカード");
    const make = async (親: string, 名: string, 英名: string): Promise<string> => category.createChild(親, { nameJp: rc(名), nameEn: 英名, frontHide: false }, issue);
    categoryIds.set(F0504カテゴリ.単体, await make(single, F0504カテゴリ.単体, "Tarkir Dragonstorm F0504 single"));
    const latest = notes.get("〔カテゴリID-F0501-共有A〕");
    const parent = await make(latest, F0504カテゴリ.最新セットの親, "Set F0504 A");
    categoryIds.set(F0504カテゴリ.最新セットの親, parent);
    categoryIds.set(F0504カテゴリ.最新セットの子, await make(parent, F0504カテゴリ.最新セットの子, "Tarkir Dragonstorm F0504 B"));
  });
  issue(`シード表の共有カテゴリ「タルキール：龍嵐録」（DBでの販促バナーの設定を含む）は、共有のカテゴリを書き換えないため、実行の印つきのカテゴリを画面で作って代えた: シングルカード配下に「${rc(F0504カテゴリ.単体)}」、最新セットの下に「${rc(F0504カテゴリ.最新セットの親)}」とその子「${rc(F0504カテゴリ.最新セットの子)}」。販促バナーはDBで設定していない`);
});

defineSeed("S-F05-04-CARD-002", { needs: ["S-F05-04-CATEGORY"] }, async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CARD-002", notes, { 名英: "F0504-CARD-A-002" }, {
    名: "F0504-CARD-001-002", 言語: ["JP"], 買取: 100, 規格: { "JP-NM": { 商品コード: "F0504-CARD-001-002" } },
    カテゴリID: f0504カテゴリID(F0504カテゴリ.単体),
  });
});

defineSeed("S-F05-04-SUPPLY-003", { needs: ["S-F05-04-CATEGORY"] }, async ({ browser, notes }) => {
  const seedId = "S-F05-04-SUPPLY-003";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  let kmc = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const root = await readGoodsRootCategoryId(page);
    const category = new CategoryPage(page);
    const sleeve = await category.createChild(root, { nameJp: rc(F0504サプライの階層.スリーブ), nameEn: "Sleeve F0504 003", frontHide: false }, issue);
    kmc = await category.createChild(sleeve, { nameJp: rc(F0504サプライの階層.KMC), nameEn: "KMC F0504 003", frontHide: false }, issue);
  });
  issue(`カテゴリ階層「サプライ・グッズ＞スリーブ＞KMC」は、共有のカテゴリを書き換えないため、サプライ・グッズの下に実行の印つきの「${rc(F0504サプライの階層.スリーブ)}」とその子「${rc(F0504サプライの階層.KMC)}」を画面で作って代えた`);
  notes.set("〔商品ID-F0504-003〕", await サプライ商品を作る(browser, seedId, "F0504-SUPPLY-003", 800, kmc));
});

defineSimpleCardSeed("S-F05-04-CARD-005", "F0504-CARD-A-005", "F0504-CARD-001-005", 100, false);
defineSimpleCardSeed("S-F05-04-CARD-006", "F0504-CARD-A-006", "F0504-CARD-001-006", 100, false);
defineSeed("S-F05-04-CATLINK-055", { needs: ["S-F05-04-CATEGORY"] }, async ({ browser, notes }) => {
  await カード商品を作る(browser, "S-F05-04-CATLINK-055", notes, { 名英: "F0504-CATLINK-CARD-055" }, {
    名: "F0504-CATLINK-055-A", 言語: ["JP"], 買取: 100, 規格: { "JP-NM": { 商品コード: "F0504-CATLINK-055-A" } },
    カテゴリID: f0504カテゴリID(F0504カテゴリ.最新セットの子),
  });
  reportSeedIssue("S-F05-04-CATLINK-055", "商品Bは作らない（ケースは遷移先のアドレスだけを確かめ、検索サービスから出る一覧は確かめない）");
});

// ---- 060・061・063（基本土地の組合せ） ----

type 基本土地の定義 = {
  番号: string; 買取: number; パワー?: string; タフネス?: string; 忠誠度?: string; 種別: string;
  /** 買取価格の500円の境界を、実際の画面で確かめるクラス（出る＝「カートに追加」が出る） */
  境界の確かめ?: { 言語: 言語; 状態: string; 出る: boolean };
};

function define基本土地シード(seedId: string, d: 基本土地の定義): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const p = await カード商品を作る(browser, seedId, notes, {
      名英: `F0504-CB${d.番号}-CARD`,
      基本土地: { カード名日: rc(`結合試験カード-${d.番号}`), ルールテキスト日: "結合試験", カードタイプ: d.種別, パワー: d.パワー, タフネス: d.タフネス, 忠誠度: d.忠誠度 },
    }, { 名: `F0504-CB${d.番号}-A`, 言語: ["JP", "EN"], 買取: d.買取, 残す状態: ["NM", "EX"], 規格: {} });
    reportSeedIssue(seedId, `シード表の「商品種別=基本土地」は、カードの詳細情報のレアリティ「基本土地」で作った。各クラスの買取価格は、カード商品CSVの買取価格 ${d.買取} 円から画面が決める（基準価格が300円以上のとき、NM以外の規格はスマレジ連携の対象になり、保存すると外部へ送られるので、規格は編集していない）`);
    const check = d.境界の確かめ;
    if (check) {
      // 買取価格の500円の境界を、実際の画面で確かめる（前提が成り立たなければ、ケースの合否が決まらないのでここで止める）
      const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
      try {
        await hideDebugToolbar(context);
        const page = await context.newPage();
        const det = new NetBuyDetailPage(page);
        const status = await det.開く(p.商品ID, { 言語: check.言語, 商品クラス: p.規格[`${check.言語}-${check.状態}`] });
        if (status >= 400) throw new Error(`${seedId}: ネット買取商品詳細が開けない（応答 ${status}）`);
        await det.見えている価格の表.first().waitFor({ state: "visible" });
        const n = await det.カートに追加ボタン.count();
        if ((n > 0) !== check.出る) throw new Error(`${seedId}: ${check.言語}-${check.状態} の買取価格が、${d.買取} 円からの境界の前提を満たさない（「カートに追加」が ${n} 件。${check.出る ? "出る" : "出ない"}はず）。クラスごとの買取価格は画面が決める`);
      } finally {
        await context.close();
      }
    }
  });
}

define基本土地シード("S-F05-04-CBLANDEN-060", { 番号: "060", 買取: 499, パワー: "3", タフネス: "4", 種別: "クリーチャー", 境界の確かめ: { 言語: "EN", 状態: "EX", 出る: false } });
define基本土地シード("S-F05-04-CBLANDJP-061", { 番号: "061", 買取: 600, 忠誠度: "5", 種別: "プレインズウォーカー", 境界の確かめ: { 言語: "JP", 状態: "EX", 出る: true } });
define基本土地シード("S-F05-04-CBLANDZZ-063", { 番号: "063", 買取: 600, パワー: "3", タフネス: "4", 種別: "クリーチャー" });
