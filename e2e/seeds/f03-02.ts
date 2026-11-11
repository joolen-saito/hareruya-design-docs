/**
 * F03-02 商品詳細（フロント）の画面シード。正本: cases/F03-02_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * - カード商品: カード詳細(登録)でカードを登録 → カード商品CSV登録で1行を取り込む（言語ごとの状態の商品規格が在庫0で作られる）→
 *   商品マスターで商品名から商品IDを控える → 商品規格の価格・買取価格・高額商品コードの登録、要らない状態の規格の削除、規格の新規登録 →
 *   在庫編集で入庫（在庫を入れる管理者が登録し、別の管理者が在庫編集承認一覧で一括承認）→ 商品登録編集（カテゴリ・販売制限）→ デッキ登録。
 * - グッズ商品: グッズ商品CSV登録 → 商品IDを控える →（高額商品コード）→ 入庫と承認 →（商品カテゴリ）。
 * - 会員: フロント本店の新規会員登録画面で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧で会員IDを控える。
 * - 専用ブラウザ: ケースごとの新しいブラウザの状態（閲覧履歴・カートが空・ログアウト）で成り立つ。作るものは無い。
 *
 * 作らないシード（使うケースも実装しない。PMへの報告に書く）:
 * - 外部の検索索引（ユニサーチ）から出る「他のバージョン」の欄が要る: OTHER-VERSIONS・FAVVER-096・097・BULKVER-098・NOTIFYVER-099。
 * - 共有のマスタ（旧商品コード対応表）への書き込みが要る: OLD-CODE・OLD-BROKEN。
 * - 画面の外の集計（週間販売数の集計表）・画像ファイルの配置・選手情報なしの会員が要る: WEEKLY-043・IMAGE-084・IMAGE-085・MEMBER-NOPLAYER-027。
 * - 外部サービスのログイン（SNS の試験アカウント）が要るケースは実装しない。SNS のシードは、共有の宛先のアドレスを読むだけのケース用に作る（作るものは無い）。
 * - 外部連携（スマレジ）: PRICE-NOJP・PRICE-JPZERO は、代表価格・総在庫が画面のどこにも出ないので作らない。
 *
 * 2026-11-10 の方針（読み替え）で作るようにしたもの:
 * - 状態EXは手元の環境に無い（状態はNM・SP・MP・HP・OT）。「EX」は2番目の状態「SP」に読み替える。NM以外の状態の基準価格が300円以上だとスマレジ連携の対象になるので、
 *   NM以外の状態の価格は200円以下にする。NMの価格は正本どおり。「入荷通知/通知待ち」「まとめて入荷通知」は在庫0の状態があるときだけ出るので、
 *   BASE-CARD の日本語・英語に、在庫0の状態「MP」（価格200円）を1つずつ足す（正本に無い補い）。
 * - BASE-CARD: カードセット「テストセット」・イラストレーター・色などカード詳細の細かい項目と裏面カード・掲載記事の紐付けは作らない（使うケースを実装しない）。
 *   商品カテゴリ「テストセット」は最上位のカテゴリを新しく作る。
 *
 * 決め打ちの識別の値（商品名・カード名・商品コード・カテゴリ名・デッキ名・会員のメールアドレス）には、実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * ケースが値そのものを確かめる高額商品コード（F0302-087-HC・F0302-CB124-HC・H-F0302-118）とパスワードには付けない。
 *
 * 正本の外で補ったこと（記録・報告に書く）:
 * - ENV: 店舗・コンテキストルート・マスタは画面で書き換えず、本店・TC大阪支店が日本語・英語で開けることだけを確かめた（F03-01・F03-06 と同じ）。
 * - カード詳細のコレクターNo: 正本に無い。カード商品の商品コードはカード詳細の値（プロモ種別・カードセット・コレクターNo・言語・状態）から作られ、
 *   重なると取込が止まるので、実行ごとに重ならない値を入れた。カードの言語・表示面はカード画像の欄で、画像を足さないと入れる欄が無いので入れていない。
 * - パワー・タフネス・ルールテキストは、カードの欄と詳細情報の欄の両方に入れた（商品詳細は詳細情報の値を出す）。
 * - カード商品CSVの基準価格・販売価格: 正本が300円以上（500・5,000）を定めるシードは、200で取り込んだ。300円以上で取り込むと、NM以外の状態の規格が
 *   スマレジ連携の対象になり外部のスマレジへ送られるため。正本がNMの規格の価格を商品規格登録編集画面で入れるシードは、そこで正本の価格にした
 *   （残る規格の価格は正本どおり）。商品規格の価格を入れないシード（116・121・122・123）は200のままで、ケースは価格を確かめない。
 *   正本が「試験用の価格」と定めるシードも200にした。
 * - 割引率(ID)・購入グループ名称・商品カテゴリ(ID)（カード商品）は、試験環境にある値（選択肢・一覧の先頭、グッズ直下の既存カテゴリ）を入れた。
 * - デッキのアーキタイプ: スタンダードのアーキタイプが試験環境に無ければ、試験用のアーキタイプを1件登録して使う（次からはそれを使う）。
 * - MEMBER-109・110 の「商品ID 3208109／3208110」は、ケースの文が指す〔商品ID-F0302-109〕／〔商品ID-F0302-110〕のこととして読んだ。
 *   110 の入荷通知依頼は、会員でログインして商品詳細の先頭のNMの規格の通知ボタンを押して登録する。109 は登録したばかりの会員で依頼は0件（消すものが無い）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { customerStateByEmail } from "../pages/admin/customer";
import {
  アーキタイプを用意する, カードを登録する, カード商品CSVを登録する, 割引率の先頭, 規格, 規格の一覧, 規格の値, 規格を削除する, 規格を足す, 規格を登録する,
  言語IDの一覧, 子カテゴリを登録する, 最上位のカテゴリを登録する, 商品名で商品IDを読む, 商品を登録する, 入庫して承認する, 行が当たる, 新しい規格,
} from "../pages/admin/f03_02_seed_ops";
import { customerIdByEmail, savePublishedClass } from "../pages/admin/f03_07_restock";
import { readExistingGoodsChildCategoryId, readExistingSellGroupName } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { デッキを登録する, 公開用 } from "../pages/admin/m15_deck";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { FrontRestock } from "../pages/front/f03_07_restock_notify";
import { お気に入り件数 } from "../db/f03_08";
import { registerFrontMember } from "../pages/front/member_entry";

const ENV_SEED = "S-F03-02-ENV";

// ---- 実行中に控える対応（ケースの文の値 → 実際の値） ----

export type 作った商品 = { productId: string; cardId?: string; classes: 規格[] };
const products = new Map<string, 作った商品[]>();
/** シードIDから、そのシードが作った商品（並び順）を引く */
export function productsOf(seedId: string): 作った商品[] {
  const p = products.get(seedId);
  if (!p) throw new Error(`${seedId} の商品はまだ作っていない`);
  return p;
}
/** シードが作った商品の、言語・状態の商品規格ID */
export function classIdOf(seedId: string, 言語: string, 状態: string): string {
  const hit = productsOf(seedId)[0].classes.filter((c) => 行が当たる({ ...c, 公開状態: "" }, 言語, 状態));
  if (hit.length !== 1) throw new Error(`${seedId} の商品に ${言語}・${状態} の商品規格が ${hit.length} 件ある`);
  return hit[0].商品規格ID;
}

export type 会員 = { mail: string; password: string; id: string };
const members = new Map<string, 会員>();
/** ケースの文の会員（メールアドレスの@の前＝正本の値）から、シードが作った会員を引く */
export function memberOf(正本のメールの前半: string): 会員 {
  const m = members.get(正本のメールの前半);
  if (!m) throw new Error(`会員 ${正本のメールの前半} はまだ作っていない`);
  return m;
}

/** 呼び名（〔商品ID-F0302-…〕〔カードID-F0302-…〕〔会員ID-F0302-…〕）を、作ったものから控える。シード表の文に出てくるものだけ */
function noteLabels(seedId: string, notes: Notes, made: { products?: 作った商品[]; member?: 会員 }): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (notes.has(label)) continue; // 他のシード（共有）が控えた呼び名（会員のシードが商品を指すときなど）
    const m = /^〔(商品ID|カードID|会員ID)-F0302-(.+)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, suffix] = m;
    const n = /HISTORY-(\d+)$/.exec(suffix);
    const p = made.products?.[n ? Number(n[1]) - 1 : 0];
    if (kind === "商品ID") {
      if (!p) throw new Error(`${seedId}: ${label} に当たる商品を作っていない`);
      notes.set(label, p.productId);
    } else if (kind === "カードID") {
      if (!p?.cardId) throw new Error(`${seedId}: ${label} に当たるカードを作っていない`);
      notes.set(label, p.cardId);
    } else {
      if (!made.member) throw new Error(`${seedId}: ${label} に当たる会員を作っていない`);
      notes.set(label, made.member.id);
    }
  }
}

// ---- 共通の試験環境 ----

defineSeed(ENV_SEED, async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    for (const path of ["/ja", "/en", "/ja/osaka"]) {
      for (const 画面 of ["/", "/products/search"]) {
        const res = await page.goto(`${BASE_URL}${path}${画面}`, { waitUntil: "domcontentloaded" });
        expect(res?.status() ?? 0, `公開側（${path}${画面}）が開けない`).toBeLessThan(400);
      }
    }
  } finally {
    await context.close();
  }
  reportSeedIssue(ENV_SEED, "店舗・コンテキストルート・マスタ（カード言語・状態・カテゴリ・フォーマット）は画面で書き換えず、本店・TC大阪支店が日本語・英語で開けることだけを確かめた。状態EXは手元の環境に無い");
});

// ---- 専用ブラウザ（ケースごとの新しいブラウザの状態で成り立つ） ----

/** ケースは新しいブラウザ（Cookie・閲覧履歴・カートが空、EC会員はログアウト）で始まる。作るものは無い */
function defineBrowserSeed(seedId: string): void {
  defineSeed(seedId, async () => { /* 作るものは無い */ });
}
defineBrowserSeed("S-F03-02-BROWSER-003");
defineBrowserSeed("S-F03-02-BROWSER-010");
defineBrowserSeed("S-F03-02-BROWSER-019");
defineBrowserSeed("S-F03-02-BROWSER-021");
defineBrowserSeed("S-F03-02-BROWSER-022");
defineBrowserSeed("S-F03-02-BROWSER-028");
defineBrowserSeed("S-F03-02-BROWSER-031");
defineBrowserSeed("S-F03-02-BROWSER-032");
defineBrowserSeed("S-F03-02-BROWSER-053");
defineBrowserSeed("S-F03-02-BROWSER-064");
defineBrowserSeed("S-F03-02-BROWSER-069");
defineBrowserSeed("S-F03-02-BROWSER-075");
defineBrowserSeed("S-F03-02-BROWSER-076");
defineBrowserSeed("S-F03-02-BROWSER-078");
defineBrowserSeed("S-F03-02-BROWSER-079");
defineBrowserSeed("S-F03-02-BROWSER-081");
defineBrowserSeed("S-F03-02-BROWSER-082");
defineBrowserSeed("S-F03-02-BROWSER-086");
defineBrowserSeed("S-F03-02-BROWSER-087");
defineBrowserSeed("S-F03-02-BROWSER-106");
defineBrowserSeed("S-F03-02-BROWSER-107");
defineBrowserSeed("S-F03-02-BROWSER-108");
defineBrowserSeed("S-F03-02-BROWSER-109");
defineBrowserSeed("S-F03-02-BROWSER-110");
defineBrowserSeed("S-F03-02-BROWSER-111");
defineBrowserSeed("S-F03-02-BROWSER-115");
defineBrowserSeed("S-F03-02-BROWSER-116");
defineBrowserSeed("S-F03-02-BROWSER-117");
defineBrowserSeed("S-F03-02-BROWSER-118");
defineBrowserSeed("S-F03-02-BROWSER-121");
defineBrowserSeed("S-F03-02-BROWSER-122");
defineBrowserSeed("S-F03-02-BROWSER-123");
defineBrowserSeed("S-F03-02-CBBROWSER-124");
defineBrowserSeed("S-F03-02-CBBROWSER-125");
defineBrowserSeed("S-F03-02-CBBROWSER-126");
defineBrowserSeed("S-F03-02-CBBROWSER-127");
defineBrowserSeed("S-F03-02-CBBROWSER-130");
defineBrowserSeed("S-F03-02-CBBROWSER-131");
defineBrowserSeed("S-F03-02-CBBROWSER-132");
defineBrowserSeed("S-F03-02-CBBROWSER-133");
defineBrowserSeed("S-F03-02-CBBROWSER-134");
defineBrowserSeed("S-F03-02-CBBROWSER-135");
defineBrowserSeed("S-F03-02-CBBROWSER-136");
defineBrowserSeed("S-F03-02-CBBROWSER-143");

// ---- 試験環境にある値（1回の起動で1度だけ読む） ----

type 共通の値 = { 言語: Map<string, string>; 割引率: { value: string; label: string }; 購入グループ: string; カードのカテゴリ: string };
let shared: 共通の値 | null = null;
async function 共通の値を読む(page: Page, issue: (m: string) => void): Promise<共通の値> {
  if (!shared) {
    shared = {
      言語: await 言語IDの一覧(page), 割引率: await 割引率の先頭(page),
      購入グループ: await readExistingSellGroupName(page), カードのカテゴリ: await readExistingGoodsChildCategoryId(page),
    };
  }
  issue(`カード商品CSVの割引率(ID)は「${shared.割引率.label}」（${shared.割引率.value}）、購入グループ名称は「${shared.購入グループ}」、商品カテゴリ(ID)は ${shared.カードのカテゴリ}（試験環境にある値）`);
  return shared;
}
const LANG_LABEL: Record<string, string> = { JP: "日本語", EN: "英語", FR: "フランス語" };

let cardSeq = 0;
/** 実行ごとに重ならないコレクターNo（16文字まで） */
const コレクターNo = () => `${RUN_MARK}${String(++cardSeq).padStart(2, "0")}`.slice(-16);

// ---- カード商品 ----

type カード商品の定義 = {
  /** 正本の商品名（カード名も同じ） */
  name: string;
  /** 商品名に実行の印を付けず、この値のままにするとき（文字数を確かめるケース用。値は実行ごとに重ならないようにしておく） */
  nameExact?: string;
  /** カード名が商品名と違うとき（rc を付ける前の値） */
  cardName?: string;
  /** 正本と違う値に読み替えたこと（シードの注記に残す） */
  読み替え?: string[];
  card?: { ルールテキスト?: string; パワー?: string; タフネス?: string; 忠誠度?: string; フォーマット?: string[] };
  csv: {
    言語: "JP" | "EN" | "FR"; 公開?: "公開" | "非公開"; 支店?: "公開" | "非公開";
    /** 取り込む基準価格・販売価格 */
    価格: string;
    /** 正本の価格が300円以上で、取り込む価格と違うとき（注記に残す） */
    正本の価格?: string;
    買取: string; 地域?: "0" | "1" | "2";
  };
  /** 取込で作られた規格のうち、値を入れる状態（言語は CSV の言語） */
  規格?: Record<string, 規格の値>;
  /** 取込で作られた規格のうち、これ以外の状態を削除する（undefined なら削除しない） */
  残す?: string[];
  足す?: 新しい規格[];
  入庫?: { 状態: string; 言語?: string; 数: number }[];
  商品編集?: { カテゴリID?: string; 販売制限?: string };
  デッキ?: string[];
};

async function カード商品を作る(browser: Browser, seedId: string, d: カード商品の定義, before?: (page: Page) => Promise<{ カテゴリID?: string }>): Promise<作った商品> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const name = d.nameExact ?? rc(d.name);
  const cardName = d.cardName ? rc(d.cardName) : name;
  for (const m of d.読み替え ?? []) issue(m);
  const made = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const extra = before ? await before(page) : {};
    const env = await 共通の値を読む(page, issue);
    const card = await カードを登録する(page, { カード名: cardName, コレクターNo: コレクターNo(), ...d.card }, `${seedId}: カード`, issue);
    const langId = env.言語.get(LANG_LABEL[d.csv.言語]);
    if (!langId) throw new Error(`${seedId}: 言語「${LANG_LABEL[d.csv.言語]}」のIDを画面から読めない`);
    if (d.csv.正本の価格) issue(`カード商品CSVの基準価格・販売価格は、正本の ${d.csv.正本の価格} でなく ${d.csv.価格} で取り込んだ（300円以上はNM以外の状態の規格がスマレジ連携の対象になり外部へ送られるため）`);
    await カード商品CSVを登録する(page, {
      言語ID: langId, 商品公開ステータス: d.csv.公開 ?? "公開", 支店の商品公開ステータス: d.csv.支店 ?? "非公開", 商品名: name,
      商品カテゴリID: env.カードのカテゴリ, 購入グループ名称: env.購入グループ, 割引率ID: env.割引率.value,
      基準価格: d.csv.価格, 販売価格: d.csv.価格, 買取価格: d.csv.買取, カード詳細ID: card.カード詳細ID, 地域別販売制限: d.csv.地域 ?? "0",
    }, `${seedId.toLowerCase()}-${RUN_MARK}.csv`, `${seedId}: カード商品CSV登録`, issue);
    const productId = await 商品名で商品IDを読む(page, name);
    let classes = await 規格の一覧(page, productId);
    issue(`取込で作られた商品規格: ${classes.map((c) => `${c.言語}・${c.状態}（${c.商品コード}）`).join("、")}`);
    for (const c of classes) {
      if (!(c.言語 === d.csv.言語 || c.言語 === LANG_LABEL[d.csv.言語])) continue;
      const cond = Object.keys(d.規格 ?? {}).find((s) => 行が当たる({ ...c, 公開状態: "" }, d.csv.言語, s));
      if (cond) await 規格を登録する(page, productId, c.商品規格ID, d.規格![cond], `${seedId}: ${d.csv.言語}・${cond} の商品規格`, issue);
      else if (d.残す && !d.残す.some((s) => 行が当たる({ ...c, 公開状態: "" }, d.csv.言語, s))) {
        await 規格を削除する(page, productId, c.商品規格ID, `${seedId}: ${c.言語}・${c.状態} の商品規格`, issue);
      }
    }
    for (const a of d.足す ?? []) await 規格を足す(page, productId, a, `${seedId}: ${a.言語}・${a.状態} の商品規格の新規登録`, issue);
    classes = await 規格の一覧(page, productId);
    const p: 作った商品 = { productId, cardId: card.カードID, classes };
    if (d.商品編集 || extra.カテゴリID) {
      await 商品を登録する(page, productId, { ...d.商品編集, ...(extra.カテゴリID ? { カテゴリID: extra.カテゴリID } : {}) }, `${seedId}: 商品登録編集`, issue);
    }
    return p;
  });
  const stock = (d.入庫 ?? []).map((s) => {
    const hit = made.classes.filter((c) => 行が当たる({ ...c, 公開状態: "" }, s.言語 ?? d.csv.言語, s.状態));
    if (hit.length !== 1) throw new Error(`${seedId}: 入庫する ${s.言語 ?? d.csv.言語}・${s.状態} の商品規格が ${hit.length} 件`);
    return { 商品コード: hit[0].商品コード, 数: s.数 };
  });
  await 入庫して承認する(browser, stock, seedId, issue);
  if (d.デッキ?.length) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      const archetype = await アーキタイプを用意する(page, "スタンダード", seedId, issue);
      for (const deck of d.デッキ!) {
        await デッキを登録する(page, {
          デッキ名: rc(deck), デッキタイプ: "event", フォーマット: "スタンダード", アーキタイプ: archetype, ...公開用(`F0302-${deck}`),
          メイン: `4 ${cardName}`,
        }, issue);
      }
      issue(`デッキ ${d.デッキ!.join("・")} をこの順に登録した（デッキ種別 event・アーキタイプ「${archetype}」・イベント名と開催日は試験用の値）`);
    });
  }
  return made;
}

function defineCardSeed(seedId: string, d: カード商品の定義, opts: { needs?: string[]; before?: (page: Page) => Promise<{ カテゴリID?: string }> } = {}): void {
  defineSeed(seedId, { needs: [ENV_SEED, ...(opts.needs ?? [])] }, async ({ browser, notes }) => {
    const p = await カード商品を作る(browser, seedId, d, opts.before);
    products.set(seedId, [p]);
    noteLabels(seedId, notes, { products: [p] });
  });
}

/** 正本「JPのNMの規格は販売価格と基準価格に{価格}…、JPのNM以外の状態の規格は削除」「在庫増減数に2」の形 */
const NMだけ = (価格: string, 入庫 = 2): Pick<カード商品の定義, "規格" | "残す" | "入庫"> => ({
  規格: { NM: { 基準価格: 価格, 販売価格: 価格 } }, 残す: ["NM"], 入庫: [{ 状態: "NM", 数: 入庫 }],
});

// 共有のカード商品
defineCardSeed("S-F03-02-BRANCH-HIDDEN", { name: "支店非公開カード", csv: { 言語: "JP", 支店: "非公開", 価格: "200", 買取: "0" } });
defineCardSeed("S-F03-02-ZERO-STOCK", { name: "在庫なしカード", csv: { 言語: "JP", 支店: "非公開", 価格: "200", 買取: "0" } });
defineCardSeed("S-F03-02-REGION-LIMIT", { name: "地域制限カード", csv: { 言語: "JP", 価格: "200", 買取: "0", 地域: "1" } });
defineCardSeed("S-F03-02-BUY-ZERO", { name: "買取金額ゼロカード", csv: { 言語: "JP", 価格: "200", 買取: "0" }, 規格: { NM: { 買取価格: "0" } } });
defineCardSeed("S-F03-02-HIGH", { name: "高額商品コード付きカード", csv: { 言語: "JP", 価格: "200", 買取: "100" }, 規格: { NM: { 買取価格: "100", 高額商品コード: "F0302-HIGH-HC" } } });
defineCardSeed("S-F03-02-OPTIONAL-EMPTY", { name: "任意カード情報なしカード", csv: { 言語: "JP", 価格: "200", 買取: "0" } });
defineCardSeed("S-F03-02-DECK-ZERO", { name: "デッキなしカード", card: { フォーマット: ["スタンダード"] }, csv: { 言語: "JP", 価格: "200", 買取: "0" } });

// パンくず（カード）: カテゴリ3階層を作り、商品カテゴリを階層3だけにする
async function 三階層(page: Page, seedId: string, n: string): Promise<{ カテゴリID: string }> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const c1 = await 最上位のカテゴリを登録する(page, rc(`階層1 F0302-${n}-B`), seedId, issue);
  const c2 = await 子カテゴリを登録する(page, c1, rc(`階層2 F0302-${n}-C`), seedId, issue);
  const c3 = await 子カテゴリを登録する(page, c2, rc(`階層3 F0302-${n}-D`), seedId, issue);
  issue(`カテゴリ ${c1} > ${c2} > ${c3} を登録した`);
  return { カテゴリID: c3 };
}
defineCardSeed("S-F03-02-CRUMB-CARD-078", { name: "パンくずカード F0302-078-A", csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" }, ...NMだけ("500") },
  { before: (page) => 三階層(page, "S-F03-02-CRUMB-CARD-078", "078") });
defineCardSeed("S-F03-02-LIMIT-081", { name: "国内限定カード F0302-081-A", csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" }, ...NMだけ("500"), 商品編集: { 販売制限: "日本国内のみ" } });
defineCardSeed("S-F03-02-LIMIT-082", { name: "海外限定カード F0302-082-A", csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" }, ...NMだけ("500"), 商品編集: { 販売制限: "海外のみ" } });
defineCardSeed("S-F03-02-LANGLABEL-086", { name: "言語表示カード F0302-086-A", csv: { 言語: "FR", 価格: "200", 正本の価格: "500", 買取: "0" }, ...NMだけ("500") });
defineCardSeed("S-F03-02-HIGHDISP-087", {
  name: "高額表示カード F0302-087-A", csv: { 言語: "JP", 価格: "200", 正本の価格: "5,000", 買取: "0" },
  規格: { NM: { 基準価格: "5000", 販売価格: "5000", 高額商品コード: "F0302-087-HC" } }, 残す: ["NM"], 入庫: [{ 状態: "NM", 数: 2 }],
});
defineCardSeed("S-F03-02-DECKBRANCH-106", { name: "支店デッキカード F0302-106-A", card: { フォーマット: ["スタンダード"] }, csv: { 言語: "JP", 支店: "公開", 価格: "200", 正本の価格: "500", 買取: "0" }, ...NMだけ("500"), デッキ: ["デッキ F0302-106-1", "デッキ F0302-106-2"] });
defineCardSeed("S-F03-02-DECKCOUNT-107", { name: "デッキ4件カード F0302-107-A", card: { フォーマット: ["スタンダード"] }, csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" }, ...NMだけ("500"), デッキ: ["4", "3", "2", "1"].map((n) => `デッキ F0302-107-${n}`) });
defineCardSeed("S-F03-02-DECKCOUNT-108", { name: "デッキ3件カード F0302-108-A", card: { フォーマット: ["スタンダード"] }, csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" }, ...NMだけ("500"), デッキ: ["3", "2", "1"].map((n) => `デッキ F0302-108-${n}`) });
defineCardSeed("S-F03-02-NOTIFYWAIT-109", { name: "通知待ちカード F0302-109-A", csv: { 言語: "JP", 価格: "200", 買取: "0" } });
defineCardSeed("S-F03-02-NOTIFYCANCEL-110", { name: "通知取消カード F0302-110-A", csv: { 言語: "JP", 価格: "200", 買取: "0" } });
defineCardSeed("S-F03-02-DECKMIX-115", {
  name: "デッキ混在カード F0302-115-A", card: { フォーマット: ["スタンダード", "モダン"] }, csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" },
  規格: { NM: { 基準価格: "500", 販売価格: "500" } }, 残す: ["NM", "EX"], 入庫: [{ 状態: "NM", 数: 2 }], デッキ: ["デッキ F0302-115-1"],
});
defineCardSeed("S-F03-02-PUBSWAP-116", { name: "本店非公開支店公開カード F0302-116-A", csv: { 言語: "JP", 公開: "非公開", 支店: "公開", 価格: "200", 正本の価格: "500", 買取: "0" } });
defineCardSeed("S-F03-02-BUYONE-117", {
  name: "買取1円カード F0302-117-A", csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "1" },
  規格: { NM: { 基準価格: "500", 販売価格: "500", 買取価格: "1" } }, 残す: ["NM", "EX"],
});
defineCardSeed("S-F03-02-HIGHMIX-118", {
  name: "高額混在カード F0302-118-A", csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "100" },
  規格: { NM: { 基準価格: "500", 販売価格: "500", 買取価格: "100", 高額商品コード: "H-F0302-118" } }, 残す: ["NM"],
  足す: [{ 言語: "EN", 状態: "NM", 商品コード: rc("F0302-118-EN-NM"), 基準価格: "600", 買取価格: "100" }],
});
defineCardSeed("S-F03-02-NOBACK-121", { name: "裏面なしカード F0302-121-A", card: { ルールテキスト: "表面能力 F0302-121" }, csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" } });
defineCardSeed("S-F03-02-PTLOY-122", { name: "任意情報ありカード F0302-122-A", card: { パワー: "4", タフネス: "5", 忠誠度: "6" }, csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" } });
defineCardSeed("S-F03-02-PTONLY-123", { name: "忠誠度なしカード F0302-123-A", card: { パワー: "3", タフネス: "1" }, csv: { 言語: "JP", 価格: "200", 正本の価格: "500", 買取: "0" } });

// ---- グッズ商品 ----

type グッズの定義 = { code: string; name: string; 公開?: "公開" | "非公開"; 支店?: "公開" | "非公開" };

async function グッズを作る(browser: Browser, seedId: string, defs: グッズの定義[], a: { 在庫?: number; 高額商品コード?: string; before?: (page: Page) => Promise<{ カテゴリID?: string }> } = {}): Promise<作った商品[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const made = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const extra = a.before ? await a.before(page) : {};
    const categoryId = await readGoodsRootCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${RUN_MARK}.csv`, categoryId,
      lines: defs.map((d) => ({ code: rc(d.code), nameJp: rc(d.name), nameEn: rc(d.name), productStatus: d.公開, branchStatus: d.支店 ?? "非公開", values: { "スマレジ連携フラグ": "0" } })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    issue(`商品カテゴリ(ID)はサプライ・グッズのカテゴリ（${categoryId}）、そのほかの列は試験環境にある値（言語は日本語・価格100など）を入れた`);
    const out: 作った商品[] = [];
    for (const d of defs) {
      const productId = await 商品名で商品IDを読む(page, rc(d.name));
      await page.goto(adminUrl(`/product/product/${productId}/edit`));
      await page.waitForLoadState("load");
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1) throw new Error(`${seedId}: ${d.name} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      if (rows[0].公開状態 !== "公開" || a.高額商品コード !== undefined) {
        await savePublishedClass(page, { productId, classId: rows[0].商品規格ID, highPriceCode: a.高額商品コード }, `${seedId}: ${d.name}`, issue);
      }
      out.push({ productId, classes: [{ 商品規格ID: rows[0].商品規格ID, 言語: rows[0].言語, 状態: rows[0].状態, 商品コード: rows[0].商品コード }] });
    }
    if (extra.カテゴリID) for (const p of out) await 商品を登録する(page, p.productId, { カテゴリID: extra.カテゴリID }, `${seedId}: 商品登録編集`, issue);
    return out;
  });
  if (a.在庫) await 入庫して承認する(browser, made.map((p) => ({ 商品コード: p.classes[0].商品コード, 数: a.在庫! })), seedId, issue);
  return made;
}

function defineGoodsSeed(seedId: string, defs: グッズの定義[], a: Parameters<typeof グッズを作る>[3] = {}): void {
  defineSeed(seedId, { needs: [ENV_SEED] }, async ({ browser, notes }) => {
    const made = await グッズを作る(browser, seedId, defs, a);
    products.set(seedId, made);
    noteLabels(seedId, notes, { products: made });
  });
}

defineGoodsSeed("S-F03-02-SUPPLY", [{ code: "F0302-SUPPLY", name: "結合試験サプライ", 支店: "公開" }], { 在庫: 5 });
defineGoodsSeed("S-F03-02-HISTORY", Array.from({ length: 19 }, (_, i) => {
  const nn = String(i + 1).padStart(2, "0");
  return { code: `F0302-HISTORY-${nn}`, name: `履歴商品${nn}` };
}));
defineGoodsSeed("S-F03-02-CRUMB-SUPPLY-079", [{ code: "F0302-079-C", name: "パンくずサプライ F0302-079-A" }], { 在庫: 5, before: (page) => 三階層(page, "S-F03-02-CRUMB-SUPPLY-079", "079") });
defineGoodsSeed("S-F03-02-LANGSUPPLY-111", [{ code: "F0302-111-C", name: "言語非表示サプライ F0302-111-A" }], { 在庫: 5 });
defineGoodsSeed("S-F03-02-CBSUPHIGH-124", [{ code: "F0302-CB124-C", name: "高額サプライ F0302-CB124-A", 支店: "公開" }], { 在庫: 5, 高額商品コード: "F0302-CB124-HC" });
defineGoodsSeed("S-F03-02-CBPUB-132", [{ code: "F0302-CB132-C", name: "公開制御サプライ F0302-CB132-A", 公開: "公開", 支店: "公開" }], { 在庫: 5 });
defineGoodsSeed("S-F03-02-CBPUB-133", [{ code: "F0302-CB133-C", name: "公開制御サプライ F0302-CB133-A", 公開: "非公開", 支店: "非公開" }], { 在庫: 5 });
defineGoodsSeed("S-F03-02-CBPUB-134", [{ code: "F0302-CB134-C", name: "公開制御サプライ F0302-CB134-A", 公開: "非公開", 支店: "公開" }], { 在庫: 5 });
defineGoodsSeed("S-F03-02-CBPUB-135", [{ code: "F0302-CB135-C", name: "公開制御サプライ F0302-CB135-A", 公開: "公開", 支店: "公開" }], { 在庫: 5 });
defineGoodsSeed("S-F03-02-CBPUB-136", [{ code: "F0302-CB136-C", name: "公開制御サプライ F0302-CB136-A", 公開: "非公開", 支店: "公開" }], { 在庫: 5 });

// ---- 会員 ----

async function 会員を作る(browser: Browser, seedId: string, local: string, password: string): Promise<会員> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const mail = `${rc(local)}@example.test`;
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: "試験", 名: "商品詳細", セイ: "シケン", メイ: "ショウヒンショウサイ", メール: mail, パスワード: password });
  } finally {
    await context.close();
  }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const state = await customerStateByEmail(page, mail);
    if (state !== "本会員") throw new Error(`会員 ${mail} を登録したが、会員一覧で本会員にならない（${state ?? "見つからない"}）`);
    return customerIdByEmail(page, mail);
  });
  const m = { mail, password, id };
  members.set(local, m);
  issue(`会員 ${mail} を登録した（会員ID ${id}。お名前・住所などは試験用の値）`);
  return m;
}

function defineMemberSeed(seedId: string, local: string, password: string, a: { needs?: string[]; after?: (browser: Browser, m: 会員) => Promise<void> } = {}): void {
  defineSeed(seedId, { needs: [ENV_SEED, ...(a.needs ?? [])] }, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, seedId, local, password);
    if (a.after) await a.after(browser, m);
    noteLabels(seedId, notes, { member: m });
  });
}

defineMemberSeed("S-F03-02-MEMBER-022", "f0302-member-022", "Passw0rd-F0302-022!");
defineMemberSeed("S-F03-02-CBMEMBER-126", "cbf0302-126", "Passw0rd-CBF0302126");
defineMemberSeed("S-F03-02-MEMBER-109", "f0302-member-109", "Passw0rd-F0302-109!", {
  needs: ["S-F03-02-NOTIFYWAIT-109"],
  after: async () => { reportSeedIssue("S-F03-02-MEMBER-109", "登録したばかりの会員で、入荷通知依頼は0件（消すものが無い）"); },
});
defineMemberSeed("S-F03-02-MEMBER-110", "f0302-member-110", "Passw0rd-F0302-110!", {
  needs: ["S-F03-02-NOTIFYCANCEL-110"],
  after: async (browser, m) => {
    const seedId = "S-F03-02-MEMBER-110";
    const classId = classIdOf("S-F03-02-NOTIFYCANCEL-110", "JP", "NM");
    const productId = productsOf("S-F03-02-NOTIFYCANCEL-110")[0].productId;
    const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(context);
      const front = new FrontRestock(await context.newPage());
      await front.login(m.mail, m.password);
      await front.openDetail(productId);
      const r = await front.press(front.classButton(classId));
      if (!r.通知が出た) throw new Error(`${seedId}: 先頭のNMの規格（商品規格ID ${classId}）の通知ボタンを押しても、依頼の完了の通知が出ない（${JSON.stringify(r)}）`);
      reportSeedIssue(seedId, `会員でログインし、商品ID ${productId} の先頭のNMの規格（商品規格ID ${classId}）の通知ボタンを押して入荷通知依頼を登録した（通知「${r.通知の文}」）`);
    } finally {
      await context.close();
    }
  },
});

// ---- 2026-11-10 の方針（読み替え）で足したシード ----

const EX読み替え = "状態EXは手元の環境に無いので、2番目の状態「SP」に読み替えた（NM以外の状態の価格は、スマレジ連携の対象にならない200円以下にした）";

/** 商品カテゴリ「テストセット」: 最上位のカテゴリを新しく作る（正本はカードセットのカテゴリ。共有のマスタは書き換えない） */
async function テストセット(page: Page): Promise<{ カテゴリID: string }> {
  const issue = (m: string) => reportSeedIssue("S-F03-02-BASE-CARD", m);
  const id = await 最上位のカテゴリを登録する(page, rc("テストセット"), "S-F03-02-BASE-CARD", issue);
  issue(`商品カテゴリ「テストセット」は、最上位のカテゴリ（カテゴリID ${id}）を新しく作って選んだ`);
  return { カテゴリID: id };
}

// BASE-CARD: 正本は JP の NM 1,500（在庫2・買取100）・EX 900（在庫3）、EN の NM 1,200（在庫4）・EX 800（在庫1）。
// EX→SP、SP の価格 900・800 → 200（NM以外は300円未満）。在庫0の MP（200円）を日本語・英語に1つずつ足す（入荷通知・まとめて入荷通知のボタンが出る条件）。
defineCardSeed("S-F03-02-BASE-CARD", {
  name: "結合試験カード", card: { フォーマット: ["スタンダード", "モダン"] },
  csv: { 言語: "JP", 支店: "公開", 価格: "200", 正本の価格: "1,500", 買取: "100" },
  規格: { NM: { 基準価格: "1500", 販売価格: "1500", 買取価格: "100" } }, 残す: ["NM", "SP", "MP"],
  足す: [
    { 言語: "EN", 状態: "NM", 商品コード: rc("F0302-BASE-EN-NM"), 基準価格: "1200", 買取価格: "100" },
    { 言語: "EN", 状態: "SP", 商品コード: rc("F0302-BASE-EN-SP"), 基準価格: "200", 買取価格: "100" },
    { 言語: "EN", 状態: "MP", 商品コード: rc("F0302-BASE-EN-MP"), 基準価格: "200", 買取価格: "100" },
  ],
  入庫: [{ 状態: "NM", 数: 2 }, { 状態: "SP", 数: 3 }, { 言語: "EN", 状態: "NM", 数: 4 }, { 言語: "EN", 状態: "SP", 数: 1 }],
  デッキ: ["デッキ F0302-BASE-1"],
  読み替え: [
    EX読み替え,
    "SP の価格は、日本語・英語とも 200（正本は日本語900・英語800）",
    "日本語・英語に在庫0の状態「MP」（価格200）を足した（正本に無い補い。入荷通知・まとめて入荷通知のボタンは在庫0の状態があるときだけ出るため）",
    "カードセット「テストセット」・イラストレーター・色・コスト・裏面カードなどカード詳細の細かい項目と掲載記事の紐付けは入れていない（使うケースを実装しない）",
    "スタンダードのデッキ1件は、デッキ編集の新規登録で作った",
  ],
}, { before: テストセット });

// 状態の価格・在庫の組み合わせ（EX→SP）
function 価格在庫の定義(name: string, nm: { 価格: string; 在庫: number }, sp: { 価格: string; 在庫: number }, 正本: string): カード商品の定義 {
  return {
    name, csv: { 言語: "JP", 価格: "200", 買取: "0" },
    規格: { NM: { 基準価格: nm.価格, 販売価格: nm.価格 }, SP: { 基準価格: sp.価格, 販売価格: sp.価格 } }, 残す: ["NM", "SP"],
    入庫: [...(nm.在庫 ? [{ 状態: "NM", 数: nm.在庫 }] : []), ...(sp.在庫 ? [{ 状態: "SP", 数: sp.在庫 }] : [])],
    読み替え: [EX読み替え, `正本: ${正本}。NM は ${nm.価格}円・在庫${nm.在庫}、SP は ${sp.価格}円・在庫${sp.在庫}`],
  };
}
defineCardSeed("S-F03-02-STATEPRICE-088", 価格在庫の定義("状態価格カード F0302-088-A", { 価格: "99", 在庫: 2 }, { 価格: "99", 在庫: 3 }, "NM価格99円・在庫2／EX価格99円・在庫3"));
defineCardSeed("S-F03-02-STATEPRICE-089", 価格在庫の定義("状態価格カード F0302-089-A", { 価格: "99", 在庫: 2 }, { 価格: "100", 在庫: 3 }, "NM価格99円・在庫2／EX価格100円・在庫3"));
defineCardSeed("S-F03-02-STOCKMAX-113", 価格在庫の定義("最大価格在庫なしカード F0302-113-A", { 価格: "1500", 在庫: 0 }, { 価格: "200", 在庫: 3 }, "NM価格1,500円・在庫0／EX価格900円・在庫3"));
defineCardSeed("S-F03-02-STOCKMIX-114", 価格在庫の定義("在庫混在カード F0302-114-A", { 価格: "1500", 在庫: 2 }, { 価格: "200", 在庫: 0 }, "NM価格1,500円・在庫2／EX価格900円・在庫0"));

// 先頭の言語（登録言語順 EN、FR・JP/DE は未登録）。ENはCSVで取り込み、FRは規格を足す。在庫は正本に無い（先頭規格NMが初期表示になる）
function 先頭言語の定義(name: string, n: string): カード商品の定義 {
  return {
    name, csv: { 言語: "EN", 価格: "200", 買取: "0" }, 残す: ["NM", "SP"],
    足す: [{ 言語: "FR", 状態: "NM", 商品コード: rc(`F0302-CB${n}-FR-NM`), 基準価格: "200", 買取価格: "0" }],
    読み替え: [EX読み替え, "ENの規格はNM・SP（正本はNM・EX）。FRは NM を1件足した（正本はNM・EX。先頭の言語がENであることを見るのに足りる）。在庫・価格は正本に無く、取込の値（200）のまま"],
  };
}
defineCardSeed("S-F03-02-CBLANG-141", 先頭言語の定義("先頭言語カード F0302-CB141-A", "141"));
defineCardSeed("S-F03-02-CBLANG-142", 先頭言語の定義("先頭言語カード F0302-CB142-A", "142"));

// DECKS: スタンダードのデッキ5件。デッキは新しい登録の順（デッキID の大きい順）に並ぶので、試験デッキ5〜1の順に登録して、1が最も新しいものにする
defineCardSeed("S-F03-02-DECKS", {
  name: "デッキ使用カード", card: { フォーマット: ["スタンダード"] }, csv: { 言語: "JP", 価格: "200", 買取: "0" },
  デッキ: ["試験デッキ5", "試験デッキ4", "試験デッキ3", "試験デッキ2", "試験デッキ1"],
  読み替え: ["デッキの登録日は画面で指定できずDBで設定する、と正本にあるが、アプリは使われているデッキを登録の新しい順（デッキIDの大きい順）に出すので、試験デッキ5〜1の順に登録して、登録日をDBで書き換えなかった"],
});

// SNS の共有: 長い商品名（全角90文字）
const 長い商品名の長さ = 90;
export const 長い商品名 = (): string => RUN_MARK + "あ".repeat(長い商品名の長さ - RUN_MARK.length);
defineCardSeed("S-F03-02-SHARE-LONG", {
  name: "SNS共有境界カード", nameExact: 長い商品名(), cardName: "SNS共有境界カード", csv: { 言語: "JP", 価格: "200", 買取: "0" },
  読み替え: [`商品名は全角「あ」90文字でなく、先頭に実行の印（${RUN_MARK}）を付けて合計90文字にした（同じ名前が前の実行の商品と重ならないように）。名前の「あ」の数が90−印の長さになる`],
});

// SNS の試験アカウント: X・LINE にはログインしない。共有ボタンが開く宛先のアドレスだけを読むケース用（作るものは無い）
defineSeed("S-F03-02-SNS", { needs: [ENV_SEED] }, async () => {
  reportSeedIssue("S-F03-02-SNS", "X・LINE の試験用アカウントは使わない。共有のボタンを押して開く宛先のアドレス（渡される内容）を読む。外部サービスへは接続せず、ブラウザの要求を空の応答に差し替える");
});

// ---- 会員（BASE-CARD への操作を画面で作る） ----

async function 会員で操作する(browser: Browser, m: 会員, run: (page: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.on("dialog", (d) => { d.accept().catch(() => {}); });
    await run(page);
  } finally {
    await context.close();
  }
}

/** 会員でログインし、商品詳細（JP）のお気に入りボタンを押してお気に入りを1件作る */
async function JPをお気に入りにする(browser: Browser, seedId: string, m: 会員): Promise<void> {
  const productId = productsOf("S-F03-02-BASE-CARD")[0].productId;
  await 会員で操作する(browser, m, async (page) => {
    const front = new FrontFavorite(page);
    await front.login(m.mail, m.password);
    await front.openDetail(productId, "JP");
    const r = await front.押す();
    if (!r.通知が出た) throw new Error(`${seedId}: お気に入りのボタンを押しても、登録の通知が出ない（${JSON.stringify(r)}）`);
  });
  const n = お気に入り件数(m.id, productId, "JP");
  if (n !== 1) throw new Error(`${seedId}: 会員 ${m.mail} の商品 ${productId} のJPのお気に入りが ${n} 件（1件のはず）`);
  reportSeedIssue(seedId, `会員でログインし、商品ID ${productId} のJP商品詳細のお気に入りボタンを押してJPのお気に入りを1件作った（正本は選手情報つきの会員をDBで準備）`);
}

/** 会員でログインし、商品詳細（JP）の「まとめて入荷通知」を押して、日本語の入荷通知依頼を1件作る */
async function JPをまとめて入荷通知にする(browser: Browser, seedId: string, m: 会員): Promise<void> {
  const productId = productsOf("S-F03-02-BASE-CARD")[0].productId;
  await 会員で操作する(browser, m, async (page) => {
    const front = new FrontRestock(page);
    await front.login(m.mail, m.password);
    await front.openDetail(productId);
    const r = await front.press(front.bulkButton);
    if (!r.通知が出た) throw new Error(`${seedId}: まとめて入荷通知のボタンを押しても、完了の通知が出ない（${JSON.stringify(r)}）`);
  });
  reportSeedIssue(seedId, `会員でログインし、商品ID ${productId} のJP商品詳細の「まとめて入荷通知」を押して、日本語の入荷通知依頼を1件作った（正本は、JPのNM規格の依頼1件をDBで準備。NMは在庫があり規格ごとの通知ボタンが出ないので、まとめての依頼に読み替えた）`);
}

const BASE = ["S-F03-02-BASE-CARD"];
defineMemberSeed("S-F03-02-MEMBER-007", "f0302-member-007", "Passw0rd-F0302-007!", { needs: BASE });
defineMemberSeed("S-F03-02-MEMBER-008", "f0302-member-008", "Passw0rd-F0302-008!", { needs: BASE });
defineMemberSeed("S-F03-02-MEMBER-020", "f0302-member-020", "Passw0rd-F0302-020!", { needs: BASE, after: (b, m) => JPをまとめて入荷通知にする(b, "S-F03-02-MEMBER-020", m) });
defineMemberSeed("S-F03-02-MEMBER-024", "f0302-member-024", "Passw0rd-F0302-024!", { needs: BASE, after: (b, m) => JPをお気に入りにする(b, "S-F03-02-MEMBER-024", m) });
defineMemberSeed("S-F03-02-MEMBER-025", "f0302-member-025", "Passw0rd-F0302-025!", { needs: BASE });
defineMemberSeed("S-F03-02-MEMBER-026", "f0302-member-026", "Passw0rd-F0302-026!", { needs: BASE, after: (b, m) => JPをお気に入りにする(b, "S-F03-02-MEMBER-026", m) });
defineMemberSeed("S-F03-02-MEMBER-119", "dpf0302-119", "Passw0rd-F0302119", { needs: BASE, after: (b, m) => JPをお気に入りにする(b, "S-F03-02-MEMBER-119", m) });
defineMemberSeed("S-F03-02-MEMBER-120", "dpf0302-120", "Passw0rd-F0302120", { needs: BASE, after: (b, m) => JPをまとめて入荷通知にする(b, "S-F03-02-MEMBER-120", m) });
