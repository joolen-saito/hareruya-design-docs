/**
 * F03-07 入荷時通知の画面シード。正本: cases/F03-07_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 会員: フロント本店の新規会員登録画面で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧でメールアドレスを検索して会員IDを控える。
 * 2. 商品: グッズ商品CSV登録で1行（または複数行）を取り込み（商品と、状態がニアミントの商品規格が在庫0で登録される）、
 *    商品マスターで商品コードを検索して商品IDを控え、商品規格一覧で公開でなければ公開にして登録する。
 *    2つ目以降の商品規格は商品規格一覧の「新規作成」で登録する（在庫0）。高額商品コードは商品規格登録編集画面で入れる。
 * 3. 入荷通知依頼: フロント本店に会員でログインし、商品詳細画面で商品規格の通知ボタンを押して登録する。
 *
 * 決め打ちの識別の値（会員のメールアドレス・商品コード・商品名）には、実行ごとの印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。
 * パスワードは識別の値でないので印を付けない。
 *
 * 画面が振らず、画面にも出ない番号（プレイヤーID・依頼ID）は、ケースの文が呼び名で引くので、DBの参照で読んで控える（書き込みはしない）。
 *
 * 正本の外で補ったこと（記録にも書く）:
 * - グッズ商品CSVの「商品公開ステータスに2（公開）」は、画面の項目説明（1:公開 2:非公開）に従い、公開を表す値で書いた。
 * - 確認モーダルは取込の画面に無い（M03-27 の記録と同じ）ので、取込の結果（成功の表示）を確かめて進めた。
 * - 013 の商品名は「重複しない試験用の商品名」なので、商品コード（に印を付けたもの）と同じにした。
 * - 部門が未選択のときは、選択肢の先頭を選んだ（正本: 任意の部門）。
 * - 入荷通知完了モーダルの「OK」を押す手順（055・056・051・052）は、アプリに「OK」が無いので、通知の閉じるボタンで閉じた（記録に書く）。
 */
import { Browser, BrowserContext, Page, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { プレイヤーID, 規格の依頼ID, 商品単位の依頼ID } from "../db/f03_07";
import { 依頼に削除日時を設定する } from "../db/f03_07_write";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { customerIdByEmail, readArrivalMax, savePublishedClass, setArrivalMax } from "../pages/admin/f03_07_restock";
import { customerStateByEmail } from "../pages/admin/customer";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { 既存のカードを指定する } from "../pages/admin/f01_02_setup";
import { ensureMember } from "../pages/admin/member";
import { FrontRestock } from "../pages/front/f03_07_restock_notify";
import { registerFrontMember } from "../pages/front/member_entry";
import { SHARED_ENV } from "../config/env";
import { registerRestore } from "../lib/shared_restore";
import { mailIds } from "../lib/mail";
import { フィードを送って反映を待つ } from "../pages/admin/unisearch_feed";
import { 索引のまとめ, 反映の目印 } from "./f05_index_batch";
import { F0102試験支店, F0102試験支店を用意する } from "../pages/admin/f01_02_layout";
import { ShopRestockScreens } from "../pages/front/f03_07_branch";
import { 依頼の登録日時を設定する } from "../db/f03_07_write";
import {
  入荷通知メールの許可を読む, 入荷通知メールの許可を設定する, 追加システム設定を全部読む, 追加システム設定を控えへ戻す,
} from "../pages/admin/f03_07_restock";
import { StockListPage } from "../pages/admin/stock_edit";
import { InventoryPlanEditPage, InventoryPlanListPage, InventoryPlanNewPage, pressDiffConfirm, topMessages } from "../pages/admin/m04_31_inventory_plan";

// ---- 実行中に控える対応（ケースの文の値 → 実際の値） ----

// 控えは正本の値で引く（実際の値は控えに持つ）。本店の商品一覧のまとめ（下の F0307一覧）は、同じ回の前の Playwright のプロセスが
// 作ったものを .runs/index_batch/ の控えから戻して使い、その印はいまのプロセスの印（rc）と違うため、ケースは rc で組み立てずに控えから引く。
export type 規格の場所 = { productId: string; classId: string; /** 実際の商品規格コード（印つき） */ 商品コード: string };
const classes = new Map<string, 規格の場所>();
export type 会員 = { mail: string; password: string; id: string };
const members = new Map<string, 会員>();
/** 正本の商品名 → 実際の商品名（印つき） */
const names = new Map<string, string>();

/** ケースの文の商品規格コード（正本の値）から、シードが作った商品ID・商品規格ID・実際の商品規格コードを引く */
export function classOf(正本の商品コード: string): 規格の場所 {
  const c = classes.get(正本の商品コード);
  if (!c) throw new Error(`商品規格コード ${正本の商品コード} の商品はまだ作っていない`);
  return c;
}
/** ケースの文の会員（メールアドレスの@の前＝正本の値）から、シードが作った会員を引く */
export function memberOf(正本のメールの前半: string): 会員 {
  const m = members.get(正本のメールの前半);
  if (!m) throw new Error(`会員 ${正本のメールの前半} はまだ作っていない`);
  return m;
}
/** ケースの文の商品名（正本の値）から、シードが作った商品の実際の商品名（印つき）を引く */
export function 商品名Of(正本の商品名: string): string {
  const n = names.get(正本の商品名);
  if (!n) throw new Error(`商品 ${正本の商品名} はまだ作っていない`);
  return n;
}
/** メールアドレス（@の前に実行の印を付ける） */
export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;
export const passwordOf = (前半: string): string => `Passw0rd!${前半}`;

// ---- 会員 ----

async function createMember(browser: Browser, 前半: string, password: string, issue: (m: string) => void): Promise<会員> {
  const mail = mailOf(前半);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: "試験会員", 名: "入荷通知", セイ: "シケンカイイン", メイ: "ニュウカツウチ", メール: mail, パスワード: password });
  } finally {
    await context.close();
  }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const state = await customerStateByEmail(page, mail);
    if (state !== "本会員") throw new Error(`会員 ${mail} を登録したが、会員一覧で本会員にならない（${state ?? "見つからない"}）`);
    return customerIdByEmail(page, mail);
  });
  const m = { mail, password, id };
  members.set(前半, m);
  issue(`会員 ${前半} を登録した（会員ID ${id}）`);
  return m;
}

// ---- 商品 ----

export type 規格の定義 = {
  /** 正本の商品規格コード（印はここで付ける） */
  code: string;
  /** 取込以外の規格の状態（商品規格登録編集画面の状態の選択肢）。1つ目の規格は取込で作られるニアミントなので書かない */
  state?: string;
  /** 高額商品コード（正本の値。印は付けない） */
  highPrice?: string;
};
export type 商品の定義 = {
  name: string; classes: 規格の定義[];
  /** 既存のカードを指定してカード商品にする。「まとめて入荷通知」（商品単位の依頼）のボタンは、カードを指定した商品の詳細にだけ出る（アプリの商品詳細のテンプレート） */
  card?: boolean;
};
export type 作った商品 = { productId: string; classIds: string[] };

/** 正本「商品規格…スライトリープレイド」「…モデレトリープレイド」の、画面の状態名 */
export const STATE_SP = "スライトリープレイド";
export const STATE_SP_BELOW = "モデレトリープレイド";

export async function createProducts(browser: Browser, tag: string, defs: 商品の定義[], issue: (m: string) => void): Promise<作った商品[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${tag} のグッズ商品CSV登録`, fileName: `${tag}.csv`, categoryId,
      lines: defs.map((d) => ({ code: rc(d.classes[0].code), nameJp: rc(d.name), nameEn: rc(d.name) })),
      onWarning: (w) => issue(`${tag}: グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const out: 作った商品[] = [];
    for (const d of defs) {
      const first = rc(d.classes[0].code);
      const productId = await openProductEditByCode(page, first);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== first) throw new Error(`${tag}: ${first} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      const classIds = [rows[0].商品規格ID];
      const high = d.classes[0].highPrice;
      if (rows[0].公開状態 !== "公開" || high !== undefined) {
        await savePublishedClass(page, { productId, classId: rows[0].商品規格ID, highPriceCode: high }, `${tag}: ${first}`, issue);
      }
      for (const extra of d.classes.slice(1)) {
        await openClassList(page, productId);
        const id = await addClass(page, productId, {
          言語: "日本語", 状態: extra.state ?? STATE_SP, 商品コード: rc(extra.code), 基準価格: "100", 販売価格: "100", 買取価格: "10", 高額商品コード: extra.highPrice,
        }, `${tag}: ${rc(extra.code)}`, issue);
        classIds.push(id);
      }
      if (d.card) await 既存のカードを指定する(page, productId, { Foil: false, 商品名: rc(d.name) }, `${tag}: ${first}`, issue);
      d.classes.forEach((c, i) => classes.set(c.code, { productId, classId: classIds[i], 商品コード: rc(c.code) }));
      names.set(d.name, rc(d.name));
      out.push({ productId, classIds });
    }
    return out;
  });
}

// ---- 入荷通知依頼（フロントで会員が通知ボタンを押す） ----

export type 依頼の定義 = { product: 作った商品; classIndex: number } | { product: 作った商品; bulk: true };

export async function requestAs(browser: Browser, m: 会員, items: 依頼の定義[], tag: string, issue: (m: string) => void): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    const front = new FrontRestock(page);
    await front.login(m.mail, m.password);
    for (const it of items) {
      await front.openDetail(it.product.productId);
      if ("bulk" in it) {
        if ((await front.bulkButton.count()) === 0) {
          throw new Error(`${tag}: 商品ID ${it.product.productId} の商品詳細画面に「まとめて入荷通知」のボタンが無い（カードを指定していない商品の詳細には出ない作り）`);
        }
        const r = await front.press(front.bulkButton);
        if (!r.通知が出た) throw new Error(`${tag}: 「まとめて入荷通知」を押しても完了の通知が出ない`);
      } else {
        const btn = front.classButton(it.product.classIds[it.classIndex]);
        const r = await front.press(btn);
        if (!r.通知が出た || !/設定/.test(r.通知の文)) throw new Error(`${tag}: 商品規格ID ${it.product.classIds[it.classIndex]} の通知ボタンを押しても依頼の完了の通知が出ない（${JSON.stringify(r)}）`);
      }
    }
    issue(`${tag}: 会員 ${m.mail} が通知ボタンを押して入荷通知依頼を ${items.length} 件登録した`);
  } finally {
    await context.close();
  }
}

// ---- 呼び名の控え ----

type 控えの材料 = { members: 会員[]; products: 作った商品[]; requests: 依頼の定義[]; requestMember?: number[] };

/** シード表の状態・属性・投入方法に出てくる呼び名を、作ったものから決めて控える */
function noteLabels(seedId: string, notes: Notes, ctx: 控えの材料, 控え済みの種類: string[] = []): void {
  const seed = getSeed(seedId);
  const letter = (suffix: string): number => (/[A-Z]$/.test(suffix) && !/^PF/.test(suffix) ? suffix.charCodeAt(suffix.length - 1) - 65 : 0);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(.+?)-F0307-(.+)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, suffix] = m;
    if (控え済みの種類.includes(kind)) continue;
    const idx = letter(suffix);
    if (kind === "会員ID") notes.set(label, ctx.members[ctx.members.length > 1 ? idx : 0].id);
    else if (kind === "プレイヤーID") {
      const mem = ctx.members[ctx.members.length > 1 ? idx : 0];
      const p = プレイヤーID(mem.id);
      if (!p) throw new Error(`${seedId}: 会員ID ${mem.id} のプレイヤーが見つからない`);
      notes.set(label, p);
    } else if (kind === "商品ID") notes.set(label, ctx.products[0].productId);
    else if (kind === "商品規格ID") {
      const p = ctx.products[0];
      notes.set(label, p.classIds[p.classIds.length > 1 ? Math.min(idx, p.classIds.length - 1) : 0]);
    } else if (kind === "依頼ID") {
      const rq = ctx.requests[Math.min(idx, ctx.requests.length - 1)];
      const mem = ctx.members[(ctx.requestMember ?? [])[Math.min(idx, ctx.requests.length - 1)] ?? 0];
      const id = "bulk" in rq ? 商品単位の依頼ID(mem.id, rq.product.productId) : 規格の依頼ID(mem.id, rq.product.classIds[rq.classIndex]);
      if (!id) throw new Error(`${seedId}: 依頼を画面で登録したのに、DBの参照で依頼IDが見つからない`);
      notes.set(label, id);
    } else throw new Error(`${seedId}: 呼び名 ${label} の種類が未対応`);
  }
}

// ---- 標準の形: 会員（任意）＋商品1件（＋依頼） ----

type 標準 = {
  sfx: string;
  /** 会員を作らないシードは undefined。メールの前半・パスワードを変えるときだけ書く */
  member?: { local?: string; password?: string } | false;
  product: 商品の定義;
  /** 作った会員が依頼を登録する規格の番号（商品の規格の並びの何番目か）。bulk は商品単位 */
  request?: ({ classIndex: number } | { bulk: true })[];
  /** シードの読み替えの注記 */
  issueNote?: string;
  /**
   * 本店の商品一覧に出ることが前提のシード。本店の商品一覧は検索サービス（ユニサーチ）の索引から描かれ、画面で作った商品は
   * フィードを送るまで一覧に出ない（2026-11-13 の 001・036〜041・056 は一覧が0点で前提が成り立たなかった）。
   * このシードは、下の F0307一覧 にまとめ、同じ回の本店の一覧のシードの商品をまとめて作ってからフィードを1回だけ送り、
   * すべての商品のカードが本店の商品一覧に出るまで待つ（出なければシードで落ち、ケースは事前準備で止まって未判定になる）
   */
  listed?: boolean;
};

/**
 * 索引への反映を待つ上限。既定の30分はテストの時間切れ（30分）と同じで、シードの作成（会員・商品で2分ほど）を足すと
 * 先にテストが時間切れになり、どこで止まったかが残らない（2026-11-13 の IT-F03-07-003・012）。反映はふつう6分ほどなので20分で諦める
 */
const 反映を待つ上限 = 20 * 60_000;

/**
 * 本店の商品一覧（商品名で絞り込み）に、目印の商品のカードがすべて出ているか（パスが空なら本店、ほかは支店URL）。
 * 一覧の商品カードは検索サービスから後で描かれるので、読み込み中の印・仮のカードが消えるまで待ってから数える（一覧を開く）。
 * 最後に作った商品から確かめ、出ていない商品が1つでもあれば、そこで「まだ」とする。
 */
async function 一覧に出ているか(ctx: BrowserContext, 目印: 反映の目印[]): Promise<{ ok: boolean; 様子: string }> {
  for (const m of [...目印].reverse()) {
    const page = await ctx.newPage();
    try {
      const s = new ShopRestockScreens(page, m.パス);
      const 描けた = await s.一覧を開く(m.商品名).then(() => true, () => false);
      const k = await s.一覧のカード(m.商品名).count();
      if (k === 0) return { ok: false, 様子: `${m.パス ? `支店（${m.パス}）` : "本店"}の商品一覧（商品名「${m.商品名}」で絞り込み）の商品カードが0件${描けた ? "" : "（一覧の読み込みが終わらなかった）"}` };
    } finally {
      await page.close();
    }
  }
  return { ok: true, 様子: "" };
}

/**
 * 本店の商品一覧に出ることが前提のシード（001・003・004・012・036〜041・056）のまとめ（seeds/f05_index_batch.ts。F05-03 と同じ仕組み）。
 * - フィードは全商品を送る重い処理なので、1回の流しでは、どれかのシードが最初に呼ばれたときに、まとめのシードの商品をすべて作り、
 *   フィードを1回だけ送り、すべての商品が一覧に出るまで待つ。作ったもの（商品・規格・会員・商品名・控え）は .runs/index_batch/<回>-f03-07.json に書き、
 *   同じ回のあとの Playwright のプロセスは作らずに使う。作れなかった回は、残りのケースをすぐ同じ理由で事前準備で止める（未判定）。
 * - 042・043 は共有の設定を書き換えるので1件ずつ別の回（run_shared_solo.sh）で流す。まとめに入れると1件のためにまとめの全部を作るので、
 *   それぞれのシードでフィードを送る（その回の送信は1回）。
 * - 上限: 作るのは60分まで・続けて3つ落ちたら打ち切り・フィードが実行中なら送れるまで20分・反映は20分まで。
 */
const 一覧の上限 = { 作る分: 60 * 60_000, 続けて落ちたら: 3, 送る分: 20 * 60_000, 反映の分: 反映を待つ上限 };
/** まとめで作ったものの正本の値（持ち越しに書く分だけ。ほかのシードが同じプロセスで作ったものは書かない） */
const 一覧で作った = { classes: new Set<string>(), members: new Set<string>(), names: new Set<string>() };
const F0307一覧 = new 索引のまとめ("F03-07 本店の商品一覧", 一覧の上限.作る分 + 一覧の上限.送る分 + 一覧の上限.反映の分 + 10 * 60_000, {
  名: "f03-07",
  書き出す: () => ({
    classes: [...一覧で作った.classes].map((k) => [k, classes.get(k)]),
    members: [...一覧で作った.members].map((k) => [k, members.get(k)]),
    names: [...一覧で作った.names].map((k) => [k, names.get(k)]),
  }),
  読み込む: (x) => {
    const v = x as { classes: [string, 規格の場所][]; members: [string, 会員][]; names: [string, string][] };
    for (const [k, c] of v.classes) classes.set(k, c);
    for (const [k, m] of v.members) members.set(k, m);
    for (const [k, n] of v.names) names.set(k, n);
  },
}, 一覧の上限, 一覧に出ているか);

/** まとめに、本店の商品一覧に出ることが前提のシードを足す。作り方は控え（呼び名）と目印（一覧に出るはずの商品名）を返す */
function defineListedSeed(
  seedId: string,
  build: (browser: Browser, notes: Notes, issue: (m: string) => void) => Promise<{ 目印: 反映の目印; ほかの目印?: 反映の目印[] }>,
): void {
  F0307一覧.足す(seedId, async ({ browser, issue }) => {
    const before = { classes: new Set(classes.keys()), members: new Set(members.keys()), names: new Set(names.keys()) };
    const tmp = new Notes();
    const r = await build(browser, tmp, issue);
    for (const k of classes.keys()) if (!before.classes.has(k)) 一覧で作った.classes.add(k);
    for (const k of members.keys()) if (!before.members.has(k)) 一覧で作った.members.add(k);
    for (const k of names.keys()) if (!before.names.has(k)) 一覧で作った.names.add(k);
    return { 控え: tmp.entries(), 目印: r.目印, ほかの目印: r.ほかの目印 };
  });
  defineSeed(seedId, async ({ browser, notes }) => { await F0307一覧.用意する(seedId, browser, notes); });
}

function defineStandard(a: 標準): void {
  const seedId = `S-F03-07-${a.sfx}`;
  const build = async (browser: Browser, notes: Notes, issue: (m: string) => void): Promise<string> => {
    const mems: 会員[] = [];
    if (a.member !== false && a.member !== undefined) {
      const local = a.member.local ?? `f0307-a-${/(\d+)$/.exec(a.sfx)![1]}`;
      mems.push(await createMember(browser, local, a.member.password ?? passwordOf(local), issue));
    }
    // 商品単位の依頼（まとめて入荷通知）は、カードを指定した商品の詳細にだけボタンが出るので、その商品はカード商品にする
    const bulk = (a.request ?? []).some((r) => "bulk" in r);
    const [product] = await createProducts(browser, seedId, [{ ...a.product, card: a.product.card || bulk }], issue);
    if (bulk) issue("商品単位の入荷通知依頼（まとめて入荷通知）のボタンはカード商品の詳細にだけ出るので、既存のカードを指定してカード商品にした（シード表は商品の種類を決めていない）");
    const reqs: 依頼の定義[] = (a.request ?? []).map((r) => ("bulk" in r ? { product, bulk: true as const } : { product, classIndex: r.classIndex }));
    if (reqs.length) await requestAs(browser, mems[0], reqs, seedId, issue);
    if (a.issueNote) issue(a.issueNote);
    noteLabels(seedId, notes, { members: mems, products: [product], requests: reqs });
    return 商品名Of(a.product.name);
  };
  if (a.listed) {
    defineListedSeed(seedId, async (browser, notes, issue) => ({ 目印: { パス: "", 商品名: await build(browser, notes, issue) } }));
    return;
  }
  defineSeed(seedId, async ({ browser, notes }) => { await build(browser, notes, (m) => reportSeedIssue(seedId, m)); });
}

const S = (code: string) => ({ code });

// 001 通知単位と一覧での表示
// 商品詳細の商品言語単位のボタン（まとめて入荷通知）はカード商品の詳細にだけ出る（011 と同じ）ので、カード商品にする。一覧で通知ボタンが無いことを見るので一覧に出す
defineStandard({ sfx: "CASE-001", member: {}, product: { name: "通知単位確認商品-001", classes: [S("UNIT-NM-001"), { code: "UNIT-SP-001", state: STATE_SP }], card: true }, listed: true });
// 002 状態別の表示（NM・SP・SP以下）
// 全状態の通知ボタン（まとめて入荷通知）はカード商品の詳細にだけ出る（011 と同じ）ので、カード商品にする
defineStandard({ sfx: "CASE-002", member: {}, product: { name: "状態別通知確認商品-002", classes: [S("STATE-NM-002"), { code: "STATE-SP-002", state: STATE_SP }, { code: "STATE-SPLOW-002", state: STATE_SP_BELOW }], card: true } });
// 003 高額商品
defineStandard({ sfx: "CASE-003", member: {}, product: { name: "高額商品確認商品-003", classes: [{ code: "HIGH-NM-003", highPrice: "HP-F0307-003" }] }, listed: true });
// 005 未ログインで通知ボタンを押す
defineStandard({ sfx: "CASE-005", member: false, product: { name: "通知単位確認商品-005", classes: [S("UNIT-NM-005"), { code: "UNIT-SP-005", state: STATE_SP }] } });
for (const n of ["006", "007", "025"]) {
  defineStandard({ sfx: `CASE-${n}`, member: {}, product: { name: `通知単位確認商品-${n}`, classes: [S(`UNIT-NM-${n}`)] } });
}
for (const n of ["008", "009", "010", "026"]) {
  defineStandard({ sfx: `CASE-${n}`, member: {}, product: { name: `既存依頼商品-${n}`, classes: [S(`EXIST-001-${n}`)] }, request: [{ classIndex: 0 }] });
}
// 011: 手順で「まとめて入荷通知」を押す。ボタンはカードを指定した商品の詳細にだけ出る（アプリの Product/detail.twig の Product.CardDetail の条件）ので、カード商品にする
defineStandard({ sfx: "CASE-011", member: {}, product: { name: "まとめて通知確認商品-011", classes: [S("BULK-NM-011"), { code: "BULK-SP-011", state: STATE_SP }], card: true } });
defineStandard({ sfx: "CASE-012", member: {}, product: { name: "一覧SOLDOUT商品-012", classes: [S("LISTSO-NM-012"), { code: "LISTSO-SP-012", state: STATE_SP }] }, listed: true });
for (const n of ["020", "021"]) {
  defineStandard({ sfx: `CASE-${n}`, member: false, product: { name: `通知単位確認商品-${n}`, classes: [S(`UNIT-NM-${n}`)] } });
}
for (const n of ["022", "023"]) {
  defineStandard({ sfx: `CASE-${n}`, member: { password: `Passw0rd-F0307-${n}!F0307A-${n}` }, product: { name: `通知単位確認商品-${n}`, classes: [S(`UNIT-NM-${n}`)] } });
}
// 一覧からの通知（商品一覧に出る商品）
for (const n of ["036", "037"]) {
  defineStandard({ sfx: `LISTLOGIN${n === "037" ? "C" : ""}-${n}`, member: false, product: { name: `一覧未ログイン確認商品-${n}`, classes: [S(`F0307-${n}-NM`)] }, listed: true });
}
for (const n of ["038", "039"]) {
  defineStandard({ sfx: `LISTDONE${n === "039" ? "C" : ""}-${n}`, member: {}, product: { name: `一覧ログイン済み確認商品-${n}`, classes: [S(`F0307-${n}-NM`)] }, listed: true });
}
for (const n of ["040", "041"]) {
  // 商品単位（まとめて入荷通知）の依頼が前提。ボタンはカード商品の詳細にだけ出るので、商品は既存のカードを指定したカード商品にする（defineStandard）
  defineStandard({ sfx: `LISTCANCEL${n === "041" ? "C" : ""}-${n}`, member: {}, product: { name: `一覧取消確認商品-${n}`, classes: [S(`F0307-${n}-NM`)] }, request: [{ bulk: true }, { classIndex: 0 }], listed: true,
    issueNote: "商品一覧の「通知待ち」の表示は、規格単位の依頼だけで決まる（商品単位の依頼だけでは「入荷時に通知」のまま。アプリの一覧の作りを確かめた）。正本の事前準備③の商品単位の依頼に加えて、同じ会員の規格単位の依頼（F0307-" + n + "-NM）も画面で登録し、一覧で「通知待ち」を押せる状態にした" });
}
defineStandard({ sfx: "LOGINCLOSE-044", member: false, product: { name: "ログインモーダル閉じる確認商品-044", classes: [S("F0307-044-NM")] } });
defineStandard({ sfx: "DONEX-045", member: {}, product: { name: "依頼完了閉じる確認商品-045", classes: [S("F0307-045-NM")] } });
defineStandard({ sfx: "DONEOK-046", member: {}, product: { name: "依頼完了OK確認商品-046", classes: [S("F0307-046-NM")] } });
defineStandard({ sfx: "CANCELX-047", member: {}, product: { name: "取消完了閉じるボタン確認商品-047", classes: [S("F0307-047-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "CANCELOK-048", member: {}, product: { name: "取消完了OK確認商品-048", classes: [S("F0307-048-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "BTNREQ-049", member: {}, product: { name: "依頼後表示切替確認商品-049", classes: [S("F0307-049-NM")] } });
defineStandard({ sfx: "BTNCANCEL-050", member: {}, product: { name: "取消後表示切替確認商品-050", classes: [S("F0307-050-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "RELOAD-054", member: { local: "dpf0307-054" }, product: { name: "再依頼商品-054", classes: [S("RE-REQ-F0307-054")] } });
// 055・056 の会員は固定のメールアドレスとパスワード
defineStandard({ sfx: "CBWAIT-055", member: { local: "cbf0307-055", password: "Passw0rd-CBF0307055" }, product: { name: "F0307-CB055-GOODS", classes: [S("F0307-CB055-NM")] }, request: [{ classIndex: 0 }] });
defineStandard({ sfx: "CBLIST-056", member: { local: "cbf0307-056", password: "Passw0rd-CBF0307056" }, product: { name: "F0307-CB056-LIST", classes: [S("F0307-CB056-NM")] }, request: [{ classIndex: 0 }], listed: true });
// 連携（051）: 会員のメールアドレス・パスワードは固定
defineStandard({ sfx: "PF-REQ-051", member: { local: "f0307-pf-001", password: "Passw0rd-PF001" }, product: { name: "連携入荷通知商品F0307PF001", classes: [S("F0307PF001-NM")] } });

// 018 商品詳細を開いたあとに商品規格を削除する（削除は手順の中で、管理画面から行う）
defineStandard({ sfx: "CASE-018", member: false, product: { name: "削除判定商品-018", classes: [S("DELETE-AFTER-OPEN-018")] } });
// 024 会員登録途中の戻り先。会員の登録はケースの手順で行う（メールアドレスは実行の印つき。印つきなので、既存の会員・仮会員・プレイヤーに当たらない）
defineStandard({ sfx: "CASE-024", member: false, product: { name: "通知単位確認商品-024", classes: [S("UNIT-NM-024")] } });

// 013 会員A・会員Bと、会員ごとの入荷待ち商品
defineSeed("S-F03-07-CASE-013", async ({ browser, notes }) => {
  const seedId = "S-F03-07-CASE-013";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const a = await createMember(browser, "f0307-a-013", passwordOf("f0307-a-013"), issue);
  const b = await createMember(browser, "f0307-b-013", passwordOf("f0307-b-013"), issue);
  const defs: 商品の定義[] = ["OWN-A-001-013", "OWN-A-002-013", "OWN-B-001-013"].map((c) => ({ name: c, classes: [S(c)] }));
  const ps = await createProducts(browser, seedId, defs, issue);
  await requestAs(browser, a, [{ product: ps[0], classIndex: 0 }, { product: ps[1], classIndex: 0 }], seedId, issue);
  await requestAs(browser, b, [{ product: ps[2], classIndex: 0 }], seedId, issue);
  issue("商品名は正本が「重複しない試験用の商品名」と定めるだけなので、商品コード（に印を付けたもの）と同じにした");
  noteLabels(seedId, notes, {
    members: [a, b], products: [ps[0]], requests: [{ product: ps[2], classIndex: 0 }], requestMember: [1],
  });
});

// ---- 共有の設定: 入荷通知最大数 ----

/** シードを作る前の入荷通知最大数（ケースが終わるたびに戻す） */
let arrivalMaxBefore: string | null = null;
defineSeed("S-F03-07-ARRIVAL-LIMIT", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if (arrivalMaxBefore === null) arrivalMaxBefore = await readArrivalMax(page);
    reportSeedIssue("S-F03-07-ARRIVAL-LIMIT", `入荷通知最大数のいまの値は ${arrivalMaxBefore}。ケースが終わったら戻す`);
  });
});
/** ケースが終わるたびに、控えた値へ戻す（正本: このシードを使うケースが終わるたびに控えた値へ戻す） */
export async function restoreArrivalMax(browser: Browser): Promise<void> {
  if (arrivalMaxBefore === null) return;
  const before = arrivalMaxBefore;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { await setArrivalMax(page, before); });
}
/** 正本「開始時に追加システム設定の入荷通知最大数を20に設定する」 */
export async function setArrivalMaxAtStart(browser: Browser, value: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { await setArrivalMax(page, value); });
}

/** 上限を試す3シード（014・015・019）の共通の形 */
async function limitSeed(a: {
  seedId: string; sfx: string; targetCode: string; targetName: string; fillerCount: number; bulkCount?: number; includeTargetRequest?: boolean;
}, browser: Browser, notes: Notes): Promise<void> {
  const issue = (m: string) => reportSeedIssue(a.seedId, m);
  const m = await createMember(browser, `f0307-a-${a.sfx}`, passwordOf(`f0307-a-${a.sfx}`), issue);
  const defs: 商品の定義[] = [{ name: a.targetName, classes: [S(a.targetCode)] }];
  for (let i = 1; i <= a.fillerCount; i++) {
    const nn = String(i).padStart(2, "0");
    defs.push({ name: `上限充足商品-${nn}-${a.sfx}`, classes: [S(`LIMIT-FILL-${nn}-${a.sfx}`)] });
  }
  const ps = await createProducts(browser, a.seedId, defs, issue);
  await setArrivalMaxAtStart(browser, "20");
  const reqs: 依頼の定義[] = ps.slice(a.includeTargetRequest ? 0 : 1).map((p) => ({ product: p, classIndex: 0 }));
  await requestAs(browser, m, reqs, a.seedId, issue);
  noteLabels(a.seedId, notes, { members: [m], products: [ps[0]], requests: [reqs[0]] });
}
defineSeed("S-F03-07-CASE-014", { needs: ["S-F03-07-ARRIVAL-LIMIT"] }, ({ browser, notes }) => limitSeed({
  seedId: "S-F03-07-CASE-014", sfx: "014", targetCode: "LIMIT-NEW-001-014", targetName: "上限境界商品", fillerCount: 19,
}, browser, notes));
defineSeed("S-F03-07-CASE-019", { needs: ["S-F03-07-ARRIVAL-LIMIT"] }, ({ browser, notes }) => limitSeed({
  seedId: "S-F03-07-CASE-019", sfx: "019", targetCode: "LIMIT-EXIST-001-019", targetName: "上限内既存依頼商品", fillerCount: 19, includeTargetRequest: true,
}, browser, notes));

// 015: 商品・日本語単位10件と規格単位10件。グッズ商品の詳細に「まとめて入荷通知」が無いので、商品単位の依頼を画面で作れず止まる
defineSeed("S-F03-07-CASE-015", { needs: ["S-F03-07-ARRIVAL-LIMIT"] }, async ({ browser }) => {
  const seedId = "S-F03-07-CASE-015";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const m = await createMember(browser, "f0307-a-015", passwordOf("f0307-a-015"), issue);
  const defs: 商品の定義[] = [{ name: "上限超過商品", classes: [S("LIMIT-NEW-001-015")] }, { name: "既存の上限内商品-015", classes: [S("LIMIT-EXIST-001-015")] }];
  for (let i = 1; i <= 19; i++) {
    const nn = String(i).padStart(2, "0");
    defs.push({ name: `上限充足商品-${nn}-015`, classes: [S(`LIMIT-FILL-${nn}-015`)] });
  }
  // 先に1商品だけで「まとめて入荷通知」の有無を確かめる（無ければ、残りの商品を作らずに止める）
  const first = await createProducts(browser, `${seedId}-first`, [defs[2]], issue);
  await setArrivalMaxAtStart(browser, "20");
  await requestAs(browser, m, [{ product: first[0], bulk: true }], seedId, issue);
  throw new Error(`${seedId}: 想定外。商品単位の依頼を作れたが、残りの19件の作り方は実装していない`);
});

// ---- 連携の確認に使う管理者（共有可。あれば内容を確かめて使い、無ければ登録する） ----

export const PF_ADMIN: Account = { loginId: "pf0307admin", password: "Passw0rd-PF0307" };
/**
 * 正本: ログインID pf0307admin・パスワード Passw0rd-PF0307・稼働中・分析・集計管理機能を閲覧・操作できる。
 * 権限の種類は「分析・集計管理機能」を含むものとして、全機能を使える「システム管理者」にした（権限の細かい名前が正本に無い。記録に書く）。
 */
defineSeed("S-F03-07-PF-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (stores.length === 0) throw new Error("PF-ADM: メンバーに割り当てられる店舗が画面に無い");
    await ensureMember(page, {
      名前: "F03-07連携試験管理者", 所属店舗: stores[0], ログインID: PF_ADMIN.loginId, メールアドレス: "pf0307admin@example.test",
      パスワード: PF_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
    });
  });
  reportSeedIssue("S-F03-07-PF-ADM", "権限は、分析・集計管理機能を含む「システム管理者」にした（正本に権限の名前が無い）");
});

// ---- 017 非有効な依頼が混ざる会員 ----

/**
 * 正本: 有効な依頼19件・取り消し済み1件・削除日時 2026-09-01 12:00:00 の依頼1件を持つ会員Aと、会員Aの依頼が0件の商品規格 LIMIT-ACTIVE-NEW-017。入荷通知最大数は20。
 * 作り方: 入荷通知最大数は共有の設定なので書き換えない。いまの値が20でなければ止める（前提と違う）。
 * 依頼は画面で作る（有効19件、取り消し用1件を押して取り消す、削除日時用1件）。削除日時は画面で指定できないので、
 * 印つきの会員の依頼に限って DB で設定した（db/f03_07_write.ts）。
 */
defineSeed("S-F03-07-CASE-017", { needs: ["S-F03-07-ARRIVAL-LIMIT"] }, async ({ browser, notes }) => {
  const seedId = "S-F03-07-CASE-017";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const max = await withAdminSession(browser, SETUP_ADMIN, (page) => readArrivalMax(page));
  if (max !== "20") throw new Error(`${seedId}: 追加システム設定の入荷通知最大数が ${max}（前提は20）。共有の設定なので書き換えずに止める`);
  const m = await createMember(browser, "f0307-a-017", passwordOf("f0307-a-017"), issue);
  const defs: 商品の定義[] = [{ name: "非有効依頼除外商品", classes: [S("LIMIT-ACTIVE-NEW-017")] }];
  for (let i = 1; i <= 19; i++) {
    const nn = String(i).padStart(2, "0");
    defs.push({ name: `有効依頼商品-${nn}-017`, classes: [S(`LIMIT-ACTIVE-${nn}-017`)] });
  }
  defs.push({ name: "取消済み依頼商品-017", classes: [S("LIMIT-CANCELED-017")] }, { name: "削除日時つき依頼商品-017", classes: [S("LIMIT-DELETED-017")] });
  const ps = await createProducts(browser, seedId, defs, issue);
  const target = ps[0], canceled = ps[20], deleted = ps[21];
  await requestAs(browser, m, [...ps.slice(1, 20).map((p) => ({ product: p, classIndex: 0 })), { product: canceled, classIndex: 0 }], seedId, issue);
  const idA = 規格の依頼ID(m.id, canceled.classIds[0]);
  if (!idA) throw new Error(`${seedId}: 取消用の依頼を画面で登録したのに、DBの参照で依頼IDが見つからない`);
  // 取消用の依頼を、もう一度通知ボタンを押して取り消す
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const front = new FrontRestock(await context.newPage());
    await front.login(m.mail, m.password);
    await front.openDetail(canceled.productId);
    const r = await front.press(front.classButton(canceled.classIds[0]));
    if (!r.通知が出た || !/解除|キャンセル/.test(r.通知の文)) throw new Error(`${seedId}: 取消用の依頼を取り消す通知が出ない（${JSON.stringify(r)}）`);
  } finally {
    await context.close();
  }
  await requestAs(browser, m, [{ product: deleted, classIndex: 0 }], seedId, issue);
  const idB = 規格の依頼ID(m.id, deleted.classIds[0]);
  if (!idB) throw new Error(`${seedId}: 削除日時用の依頼を画面で登録したのに、DBの参照で依頼IDが見つからない`);
  依頼に削除日時を設定する(idB, "2026-09-01 12:00:00");
  issue("DBで入荷通知依頼（削除日時用の1件）の削除日時を 2026-09-01 12:00:00（日本時間）に設定した（画面では日時を指定できない。印つきの会員の依頼だけに書いた）");
  issue("入荷通知最大数は共有の設定なので書き換えず、いまの値が20であることを確かめて使った");
  for (const label of Notes.labelsIn(getSeed(seedId)["状態・属性"] + getSeed(seedId).投入方法)) {
    const mm = /^〔(.+?)-F0307-(.+)〕$/.exec(label);
    if (!mm) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    if (mm[1] === "会員ID") notes.set(label, m.id);
    else if (mm[1] === "プレイヤーID") { const p = プレイヤーID(m.id); if (!p) throw new Error(`${seedId}: 会員のプレイヤーが見つからない`); notes.set(label, p); }
    else if (mm[1] === "商品規格ID") notes.set(label, target.classIds[0]);
    else if (mm[1] === "依頼ID") notes.set(label, mm[2] === "017A" || mm[2] === "A" ? idA : idB);
    else throw new Error(`${seedId}: 呼び名 ${label} の種類が未対応`);
  }
});

// =====================================================================================
// 入荷通知メール（029〜035・042・043・053・057・058）と連携の集計（052）。2026-11-12 追加。
// - 入荷通知メールの許可（追加システム設定。共有の設定）は、ケースの事前準備で前提の値にし、書き換える前に追加システム設定の全項目を
//   画面から控え、ケースの終わりに画面で全項目を戻して確かめる（lib/shared_restore.ts）。共有の環境では夜の1本流し（E2E_ALLOW_SHARED=1）でだけ書き換える。
// - 受信箱（MAILBOX）: 開発環境のメールの受け口（E2E_MAIL_URL）を読む。共有の受け口なので消さず、ケースの操作の前に控えたメールの番号より後に、
//   そのケースの宛先（実行の印つきの会員のメールアドレス）に届いたメールだけを数えて「受信メール0件」に代える。
// - 033 の依頼の登録日時は画面で指定できないので、印つきの会員の依頼に限って DB で設定する（db/f03_07_write.ts）。
// =====================================================================================

/** 試験管理者（S-F03-07-ADM）。パスワードはシード表に無いので、入力規則（12文字以上）に合う試験用の値にした */
export const F0307_ADMIN: Account = { loginId: "f0307_admin", password: "Passw0rd!F0307ADM" };
export const F0307_ADMIN_NAME = "F03-07試験管理者";
/** 承認用管理者（S-F03-07-CBAPR） */
export const CB_APPROVER: Account = { loginId: "f0307cb-apr", password: "Passw0rd-CBF0307A" };
export const CB_APPROVER_NAME = "F03-07承認用管理者";

/** 本店（店舗ID 1）の店名。在庫検索一覧の店舗の選択肢から読む（店舗一覧は本店を出さない） */
export async function 本店の店名(page: Page): Promise<string> {
  return new StockListPage(page).shopNameById("1");
}

async function 本店の管理者を用意する(browser: Browser, seedId: string, a: { 名前: string; account: Account; メール: string }): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 本店 = await 本店の店名(page);
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (!stores.includes(本店)) throw new Error(`${seedId}: メンバー登録の所属店舗の選択肢に本店「${本店}」が無い`);
    await ensureMember(page, {
      名前: a.名前, 所属店舗: 本店, ログインID: a.account.loginId, メールアドレス: a.メール, パスワード: a.account.password,
      権限: "システム管理者", デフォルト検索表示店舗: 本店, 編集可能店舗: [本店],
    });
  });
  reportSeedIssue(seedId, `${a.名前}（ログインID ${a.account.loginId}）を、所属店舗・編集可能店舗を本店、権限を「システム管理者」（商品・在庫・棚卸・在庫編集承認を含む）で用意した（あれば内容を確かめて使った）`);
}

defineSeed("S-F03-07-ADM", async ({ browser, seed }) => {
  await 本店の管理者を用意する(browser, seed.シードID, { 名前: F0307_ADMIN_NAME, account: F0307_ADMIN, メール: "f0307_admin@example.test" });
  reportSeedIssue(seed.シードID, "シード表の管理者ID 730790001 は画面で指定できないので、登録で振られた番号を使った。パスワードはシード表に無いので試験用の値にした");
});
defineSeed("S-F03-07-CBAPR", async ({ browser, seed }) => {
  await 本店の管理者を用意する(browser, seed.シードID, { 名前: CB_APPROVER_NAME, account: CB_APPROVER, メール: "f0307cb-apr@example.test" });
});

// ---- 入荷通知メールの許可（共有の設定） ----

defineSeed("S-F03-07-MAIL-SETTING", async ({ browser, seed }) => {
  const now = await withAdminSession(browser, SETUP_ADMIN, (page) => 入荷通知メールの許可を読む(page));
  reportSeedIssue(seed.シードID, `追加システム設定の入荷通知メールの許可のいまの値は「${now}」。ケースの事前準備で前提の値にし、ケースの終わりに追加システム設定の全項目を元の値へ戻す`);
});

/**
 * ケースの事前準備「開始時に入荷通知メールの許可を…に設定する」。いまの値が同じなら書き換えない。
 * 書き換えるときは、先に追加システム設定の全項目を画面から控え、ケースの終わりに画面で戻して開き直して確かめる登録をする。
 */
export async function 入荷通知メールの許可をケースの間だけ設定する(browser: Browser, 値: "送信する" | "送信しない"): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const now = await 入荷通知メールの許可を読む(page);
    if (now === 値) return `入荷通知メールの許可はすでに「${値}」だったので書き換えなかった`;
    if (SHARED_ENV && process.env.E2E_ALLOW_SHARED !== "1") {
      throw new Error(`共有の環境では入荷通知メールの許可（共有の設定。いまは「${now}」）を書き換えない。夜に1本だけで流す回でだけ書き換える`);
    }
    const 控え = await 追加システム設定を全部読む(page);
    registerRestore("追加システム設定（全項目。入荷通知メールの許可を書き換える前）", 控え,
      async () => { await withAdminSession(browser, SETUP_ADMIN, async (p) => { p.setDefaultTimeout(60_000); await 追加システム設定を控えへ戻す(p, 控え, "追加システム設定を元の値へ戻す"); }); },
      async () => withAdminSession(browser, SETUP_ADMIN, async (p) => {
        p.setDefaultTimeout(60_000);
        const 今 = await 追加システム設定を全部読む(p);
        return Object.keys(控え).every((k) => 今[k] === 控え[k]) && Object.keys(今).every((k) => k in 控え);
      }));
    await 入荷通知メールの許可を設定する(page, 値);
    return `入荷通知メールの許可を「${now}」から「${値}」にした（共有の設定。追加システム設定の全項目を控え、ケースの終わりに画面で戻して確かめる）`;
  });
}

defineSeed("S-F03-07-MAILBOX", async ({ seed }) => {
  await mailIds(); // メールの受け口が読めること（読めなければここで止まる）
  reportSeedIssue(seed.シードID, "メールの受け口（開発環境の受信環境）が読めることを確かめた。共有の受け口なので受信メールを消さず、ケースの操作の前に控えたメールの番号より後に、" +
    "そのケースの宛先（実行の印つきの会員のメールアドレス）に届いたメールだけを数えて「宛先の受信メールを0件にする」に代えた。入荷通知メールのテンプレートと本店の送信元は環境に設定済みの値を使った");
});

// ---- 会員1人・商品1件・依頼1件の形 ----

for (const n of ["029", "032", "034", "035"]) {
  const code = n === "032" ? `MAIL-UPDATE-001-${n}` : `MAIL-ONE-001-${n}`;
  defineStandard({ sfx: `CASE-${n}`, member: {}, product: { name: `入荷通知メール確認商品-${n}`, classes: [S(code)] }, request: [{ classIndex: 0 }] });
}
// 042・043: 一覧から押す（依頼は0件）。NM と SP の2規格。本店の商品一覧は検索サービス（ユニサーチ）の索引から描かれるので、
// 商品管理「ユニサーチフィード作成」でフィードを送り、本店の商品一覧に商品が出るまで待つ（依頼者の許可 2026-11-11 夜）。
// 042・043 は共有の設定を書き換えるので1件ずつ別の回で流す（solo_cases）。上の F0307一覧 のまとめには入れず、このシードで送る（その回の送信は1回）
for (const [sfx, n, name] of [["LISTNM-042", "042", "一覧NM入荷確認商品-042"], ["LISTSP-043", "043", "一覧非NM入荷確認商品-043"]] as const) {
  defineSeed(`S-F03-07-${sfx}`, async ({ browser, notes }) => {
    const seedId = `S-F03-07-${sfx}`;
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const m = await createMember(browser, `f0307-a-${n}`, passwordOf(`f0307-a-${n}`), issue);
    const [product] = await createProducts(browser, seedId, [{ name, classes: [S(`F0307-${n}-NM`), { code: `F0307-${n}-SP`, state: STATE_SP }] }], issue);
    await フィードを送って反映を待つ(browser, (ctx) => 一覧に出ているか(ctx, [{ パス: "", 商品名: 商品名Of(name) }]), `${seedId} の商品の本店の商品一覧への反映`, 反映を待つ上限);
    issue("商品管理「ユニサーチフィード作成」でフィードを送り、本店の商品一覧に商品が出るまで待った");
    noteLabels(seedId, notes, { members: [m], products: [product], requests: [] });
  });
}
// 057: グッズ商品・NM の規格単位の依頼
defineStandard({ sfx: "CBMAILNM-057", member: { local: "cbf0307-057", password: "Passw0rd-CBF0307057" }, product: { name: "F0307-CB057-GOODS", classes: [S("F0307-CB057-NM")] }, request: [{ classIndex: 0 }] });
// 058: カード商品（既存のカードを指定）・NM と SP。SP の規格単位の依頼
defineStandard({ sfx: "CBMAILSP-058", member: { local: "cbf0307-058", password: "Passw0rd-CBF0307058" },
  product: { name: "F0307-CB058-CARD", classes: [S("F0307-CB058-NM"), { code: "F0307-CB058-SP", state: STATE_SP }], card: true }, request: [{ classIndex: 1 }] });

// ---- 棚卸計画（030・053）: 本店・EC-CUBE、棚卸数量1・差異確認済み・在庫未反映 ----

export type 作った棚卸計画 = { 計画ID: string; 明細ID: string[] };

async function 棚卸計画を作る(browser: Browser, seedId: string, 棚卸名: string, 商品コード: string[], issue: (m: string) => void): Promise<作った棚卸計画> {
  return withAdminSession(browser, F0307_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 本店 = await 本店の店名(page);
    const list = new InventoryPlanListPage(page);
    await list.open();
    await list.pressNew();
    const form = new InventoryPlanNewPage(page);
    await form.fill({ 棚卸名, 店舗: 本店, 在庫区分: "EC-CUBE" });
    if ((await form.submit()) !== "送信") throw new Error(`${seedId}: 棚卸計画の登録がブラウザの入力チェックで止まった: ${(await form.invalidFields()).join(" / ")}`);
    const edit = new InventoryPlanEditPage(page);
    const 計画ID = edit.planIdInUrl();
    const m = await topMessages(page);
    if (!計画ID || m.エラー.length) throw new Error(`${seedId}: 棚卸計画を登録できない（${page.url()}・${m.エラー.join(" / ")}）`);
    await edit.uploadCsv("商品登録", { name: `${seedId.toLowerCase()}-items-${Date.now()}.csv`, body: `商品コード\n${商品コード.join("\n")}\n` }, `${seedId} の棚卸商品CSV登録`, issue);
    await edit.uploadCsv("数量登録", { name: `${seedId.toLowerCase()}-qty-${Date.now()}.csv`, body: `商品コード,棚卸数量\n${商品コード.map((c) => `${c},1`).join("\n")}\n` }, `${seedId} の棚卸商品数量CSV登録`, issue);
    const 明細ID: string[] = [];
    for (const c of 商品コード) {
      await edit.openById(計画ID);
      await edit.openDetail(c);
      const d = /\/inventory_plan\/detail\/(\d+)$/.exec(page.url());
      if (!d) throw new Error(`${seedId}: 棚卸在庫確認のアドレスから明細の番号を読めない（${page.url()}）`);
      明細ID.push(d[1]);
      await pressDiffConfirm(page, `${seedId}: ${c} の差異確認`);
    }
    await edit.openById(計画ID);
    const rows = await edit.detailRows();
    for (const c of 商品コード) {
      const r = rows.find((x) => x["商品コード"] === c);
      if (!r || r["棚卸数量"] !== "1" || r["差異確認"] !== "済") throw new Error(`${seedId}: 棚卸計画の ${c} の行が「棚卸数量1・差異確認済」でない: ${JSON.stringify(r)}`);
    }
    issue(`棚卸計画「${棚卸名}」（棚卸計画ID ${計画ID}・本店・EC-CUBE）を試験管理者で登録し、${商品コード.join("・")} を棚卸数量1・差異確認済みにした（在庫反映はしない）。` +
      "棚卸数量は、棚卸在庫確認の画面で1件ずつ入れる代わりに、同じ画面の棚卸商品数量CSV登録で入れた（できる状態は同じ）");
    return { 計画ID, 明細ID };
  });
}

const 作った計画 = new Map<string, 作った棚卸計画>();
/** シードが作った棚卸計画（正本の棚卸名 → 計画ID・明細ID） */
export function 棚卸計画Of(正本の棚卸名: string): 作った棚卸計画 {
  const p = 作った計画.get(正本の棚卸名);
  if (!p) throw new Error(`棚卸計画「${正本の棚卸名}」はまだ作っていない`);
  return p;
}

defineSeed("S-F03-07-CASE-030", { needs: ["S-F03-07-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-F03-07-CASE-030";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const m = await createMember(browser, "f0307-a-030", passwordOf("f0307-a-030"), issue);
  const [product] = await createProducts(browser, seedId, [{ name: "入荷通知メール確認商品-030", classes: [S("MAIL-ONE-001-030")] }], issue);
  const reqs: 依頼の定義[] = [{ product, classIndex: 0 }];
  await requestAs(browser, m, reqs, seedId, issue);
  const plan = await 棚卸計画を作る(browser, seedId, rc("F0307棚卸-030"), [rc("MAIL-ONE-001-030")], issue);
  作った計画.set("F0307棚卸-030", plan);
  notes.set("〔棚卸計画ID-F0307-030〕", plan.計画ID);
  notes.set("〔棚卸計画明細ID-F0307-030〕", plan.明細ID[0]);
  noteLabels(seedId, notes, { members: [m], products: [product], requests: reqs }, ["棚卸計画ID", "棚卸計画明細ID"]);
});

defineSeed("S-F03-07-MAILTWO-053", { needs: ["S-F03-07-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-F03-07-MAILTWO-053";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const m = await createMember(browser, "dpf0307-053", passwordOf("dpf0307-053"), issue);
  const [a, b] = await createProducts(browser, seedId, [
    { name: "同時入荷商品A-F0307-053", classes: [S("MAIL-TWO-A-F0307-053")] },
    { name: "同時入荷商品B-F0307-053", classes: [S("MAIL-TWO-B-F0307-053")] },
  ], issue);
  const reqs: 依頼の定義[] = [{ product: a, classIndex: 0 }, { product: b, classIndex: 0 }];
  await requestAs(browser, m, reqs, seedId, issue);
  const plan = await 棚卸計画を作る(browser, seedId, rc("F0307棚卸-053"), [rc("MAIL-TWO-A-F0307-053"), rc("MAIL-TWO-B-F0307-053")], issue);
  作った計画.set("F0307棚卸-053", plan);
  // 呼び名の商品規格ID 053A・053B は2つの商品の規格（控えの材料では1つの商品の2規格として並べる）
  noteLabels(seedId, notes, { members: [m], products: [{ productId: a.productId, classIds: [a.classIds[0], b.classIds[0]] }], requests: reqs });
});

// ---- 033: 会員3人の依頼と、登録日時（DB） ----

defineSeed("S-F03-07-CASE-033", async ({ browser, notes }) => {
  const seedId = "S-F03-07-CASE-033";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const ms: 会員[] = [];
  for (const x of ["a", "b", "c"]) ms.push(await createMember(browser, `f0307-${x}-033`, passwordOf(`f0307-${x}-033`), issue));
  const [product] = await createProducts(browser, seedId, [{ name: "入荷通知送信順確認商品-033", classes: [S("MAIL-ORDER-001-033")] }], issue);
  // 依頼の登録の順を、登録日時の順（A→B→C）と変える（C→A→B の順に登録する）。登録の順（依頼ID の順）と日時の順が同じだと、
  // 「登録日時の昇順で送った」のか「依頼ID の順で送った」のかを見分けられない（2026-11-14 の検証の指摘）
  for (const i of [2, 0, 1]) await requestAs(browser, ms[i], [{ product, classIndex: 0 }], seedId, issue);
  issue("依頼の登録の順は、日時の順（A→B→C）と変えて C→A→B にした（送信順が登録日時の昇順か、依頼の登録順かを見分けるため）");
  const 日時 = ["2026-09-01 09:00:00", "2026-09-01 10:00:00", "2026-09-01 11:00:00"];
  ms.forEach((m, i) => {
    const id = 規格の依頼ID(m.id, product.classIds[0]);
    if (!id) throw new Error(`${seedId}: 会員 ${m.mail} の依頼を画面で登録したのに、DBの参照で依頼IDが見つからない`);
    依頼の登録日時を設定する(id, 日時[i]);
  });
  issue(`会員A・B・C の依頼の登録日時を、DBで ${日時.join("・")}（日本時間）に設定した（画面では登録日時を指定できない。印つきの会員の依頼だけ）`);
  const reqs: 依頼の定義[] = ms.map(() => ({ product, classIndex: 0 }));
  noteLabels(seedId, notes, { members: ms, products: [product], requests: reqs, requestMember: [0, 1, 2] });
});

// ---- 052: 連携の集計（カード商品の NM・SP に依頼0件） ----

defineSeed("S-F03-07-PF-REQ-052", async ({ browser, notes }) => {
  const seedId = "S-F03-07-PF-REQ-052";
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await createMember(browser, "f0307-pf-002", "Passw0rd-PF002", issue);
  const [p] = await createProducts(browser, seedId, [{ name: "連携入荷通知商品F0307PF002", classes: [S("F0307PF002-NM"), { code: "F0307PF002-SP", state: STATE_SP }], card: true }], issue);
  notes.set("〔商品ID-F0307-PF002〕", p.productId);
  notes.set("〔商品規格ID-F0307-PF002A〕", p.classIds[0]);
  notes.set("〔商品規格ID-F0307-PF002B〕", p.classIds[1]);
  issue("カード商品は、カード詳細の登録・カード商品CSV登録の代わりに、グッズ商品CSV登録で作った商品に既存のカードを指定し、NM の規格に SP（スライトリープレイド）の規格を足して作った（JP の規格は NM と SP の2件だけ。SP の販売価格は100円）");
});

// ---- 004: 本店と支店での表示（会員A・会員B相当の会員・店舗表示確認商品・入荷待ち一覧用の3商品） ----
// 支店は、F01-02 の決まった印の試験支店を使う（試験用の店舗は決まった名前で1度だけ作って使い回す。依頼者決定 2026-11-11）。
// 会員B相当の専用プレイヤーと、その依頼1件は、シード表では DB で直接設定する定めだが、2人目の会員を画面で登録し、その会員が画面で依頼して代える（PM 2026-11-12）。
// 本店・支店の商品一覧は検索サービス（ユニサーチ）の索引から描かれるので、本店の商品一覧のまとめ（F0307一覧）に入れ、
// まとめて1回送ったフィードで、本店と支店の両方の商品一覧に商品が出るまで待つ。

/** 004 が使う支店の支店URL（ケースが支店の画面を開くのに使う） */
export const 支店URL004 = F0102試験支店.支店URL;
export const 店舗表示確認商品004 = (): string => 商品名Of("店舗表示確認商品-004");
/** 004 の入荷待ち一覧用の3商品の商品名（正本が「重複しない試験用の商品コードと商品名」と定めるだけなので、商品コードと同じ） */
export const 入荷待ち商品004 = (i: 1 | 2 | 3): string => 商品名Of(`F0307-WAIT-00${i}-004`);

defineListedSeed("S-F03-07-CASE-004", async (browser, notes, issue) => {
  const seedId = "S-F03-07-CASE-004";
  await withAdminSession(browser, SETUP_ADMIN, (page) => F0102試験支店を用意する(page, issue));
  const a = await createMember(browser, "f0307-a-004", passwordOf("f0307-a-004"), issue);
  const b = await createMember(browser, "f0307-b-004", passwordOf("f0307-b-004"), issue);
  issue("会員B相当の専用プレイヤーと、そのプレイヤーに紐づく依頼1件は、シード表では DB で直接設定する定めだが、2人目の会員（f0307-b-004）を画面で登録し、その会員が残り1商品の入荷通知依頼を画面で登録して代えた（依頼IDは画面が振る。PM 2026-11-12）");
  // 支店のログイン画面で、同じメールアドレスとパスワードでログインできることを確かめる
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const br = new ShopRestockScreens(await ctx.newPage(), 支店URL004);
    if (!(await br.ログイン画面を開く())) throw new Error(`${seedId}: 新しいブラウザで支店のログイン画面を開いたのに、ログインの入力欄が無い`);
    await br.ログインする(a.mail, a.password);
  } finally {
    await ctx.close();
  }
  issue(`支店（支店URL ${支店URL004}）のログイン画面で、会員A（${a.mail}）が同じメールアドレスとパスワードでログインできることを確かめた`);
  const defs: 商品の定義[] = [
    { name: "店舗表示確認商品-004", classes: [S("F0307-SHOP-004")] },
    ...([1, 2, 3] as const).map((i) => ({ name: `F0307-WAIT-00${i}-004`, classes: [S(`F0307-WAIT-00${i}-004`)] })),
  ];
  const ps = await createProducts(browser, seedId, defs, issue);
  issue("入荷待ち一覧用の3商品の商品名は、正本が「重複しない試験用の商品コードと商品名」と定めるだけなので、商品コード（に印を付けたもの）と同じにした");
  await requestAs(browser, a, [{ product: ps[1], classIndex: 0 }, { product: ps[2], classIndex: 0 }], seedId, issue);
  await requestAs(browser, b, [{ product: ps[3], classIndex: 0 }], seedId, issue);
  const name = 店舗表示確認商品004();
  issue("本店と支店の両方の商品一覧に店舗表示確認商品が出ることを、まとめて送ったフィードの反映の目印にした");
  noteLabels(seedId, notes, { members: [a, b], products: [ps[0]], requests: [] });
  return { 目印: { パス: "", 商品名: name }, ほかの目印: [{ パス: 支店URL004, 商品名: name }] };
});
