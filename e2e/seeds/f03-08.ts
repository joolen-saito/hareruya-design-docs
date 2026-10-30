/**
 * F03-08 お気に入り商品の画面シード。正本: cases/F03-08_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 会員: フロント本店の新規会員登録画面で登録し、本登録のメールのURLを開いて本会員にする。管理画面の会員一覧でメールアドレスを検索して会員IDを控える。
 * 2. 商品: グッズ商品CSV登録で取り込み（商品と、状態がニアミントの商品規格が登録される）、商品マスターで商品コードを検索して商品IDを控え、
 *    商品規格が公開でなければ公開にして登録する。英語の商品規格は商品規格一覧の「新規作成」で登録する（状態ニアミント・販売価格100円）。
 * 3. お気に入り: フロント本店に会員でログインし、商品詳細画面のお気に入りボタンを押して登録する。
 * 4. 登録後の整え: 商品の非公開（010）・高額商品コード（011）・在庫（011・041。登録者とは別の管理者が承認する）。
 *
 * 決め打ちの識別の値（会員のメールアドレス・商品コード・商品名）には、実行ごとの印を付ける（e2e/lib/run_marker.ts。依頼者決定 2026-10-28）。
 * パスワードは識別の値でないので印を付けない。
 * 画面が振らず、画面にも出ない番号（選手ID・お気に入りID）は、ケースの文が呼び名で引くので、DBの参照で読んで控える（書き込みはしない）。
 *
 * 正本の外で補ったこと（記録にも書く）:
 * - 「お気に入り登録完了モーダルを閉じる」は、アプリに完了のモーダルが無く画面右下の通知が出るので、通知の閉じるボタンで閉じた。
 * - 「表示された確認モーダルでアップロードを確定する」（039〜042）は、取込の画面に確認モーダルが無いので、取込の結果の表示を確かめて進めた。
 * - 商品名が正本で「商品コードと同じ文字列」のものは、印を付けた商品コードと同じにした。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { プレイヤーID } from "../db/f03_07";
import { お気に入りID, 在庫承認の最大ID } from "../db/f03_08";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { customerIdByEmail, savePublishedClass } from "../pages/admin/f03_07_restock";
import { ensureStockAdmin, setFavoriteOption, setProductPrivate, STOCK_ADMIN } from "../pages/admin/f03_08_masters";
import { customerStateByEmail } from "../pages/admin/customer";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { searchStockByCode, stockInRow } from "../pages/admin/m04_02_rc_stock";
import { classRowsFromProductEdit, openProductEditByCode } from "../pages/admin/m03_23_seed_products";
import { addClass, openClassList } from "../pages/admin/m03_30_products";
import { loggedInMemberName, registerStockEdit, StockApprovalListPage, StockListPage } from "../pages/admin/stock_edit";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { registerFrontMember } from "../pages/front/member_entry";

// ---- 実行中に控える対応（ケースの文の値 → 実際の値） ----

export type 規格の場所 = { productId: string; classId: string; classIdEn?: string };
const products = new Map<string, 規格の場所>();
export type 会員 = { mail: string; password: string; id: string };
const members = new Map<string, 会員>();

/** ケースの文の商品コード（正本の値）から、シードが作った商品ID・商品規格IDを引く */
export function productOf(正本の商品コード: string): 規格の場所 {
  const c = products.get(rc(正本の商品コード));
  if (!c) throw new Error(`商品コード ${正本の商品コード} の商品はまだ作っていない`);
  return c;
}
/** ケースの文の会員（メールアドレスの@の前＝正本の値）から、シードが作った会員を引く */
export function memberOf(正本のメールの前半: string): 会員 {
  const m = members.get(rc(正本のメールの前半));
  if (!m) throw new Error(`会員 ${正本のメールの前半} はまだ作っていない`);
  return m;
}
/** メールアドレス（@の前に実行の印を付ける） */
export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

// ---- 定義 ----

type 会員定義 = { local: string; password: string; given: string };
type 商品定義 = {
  code: string;
  /** 商品名(日)。正本が「商品コードと同じ」ときは書かない */
  name?: string;
  /** 英語の商品規格を足す */
  english?: boolean;
};
type 登録定義 = { member: number; product: number; lang?: "JP" | "EN" };
type 整え = {
  /** お気に入りを登録したあとに非公開にする商品（商品の並びの番号） */
  非公開?: number[];
  /** お気に入りを登録したあとに高額商品コードを入れる商品の番号 */
  高額商品コード?: number[];
  /** 本店EC-CUBE在庫を1にする商品の番号 */
  在庫を1にする?: number[];
};
type シード定義 = {
  id: string;
  members?: 会員定義[];
  products: 商品定義[];
  favorites?: 登録定義[];
  後?: 整え;
  /** 支店の商品公開ステータス。正本の既定は非公開、001 だけ公開 */
  branch?: "公開" | "非公開";
};

/** 標準の会員（A）。メールアドレスの前半・パスワード・お名前(名)は番号から決まる */
const std = (n: string): 会員定義 => ({ local: `f0308-a-${n}`, password: `Passw0rd-F0308-${n}!F0308A-${n}`, given: `F0308A${n}` });
const nameOf = (p: 商品定義): string => p.name ?? p.code;

// ---- 会員 ----

async function createMember(browser: Browser, d: 会員定義, issue: (m: string) => void): Promise<会員> {
  const mail = mailOf(d.local);
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    await registerFrontMember(await context.newPage(), { 姓: "試験", 名: d.given, セイ: "シケン", メイ: "テスト", メール: mail, パスワード: d.password });
  } finally {
    await context.close();
  }
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const state = await customerStateByEmail(page, mail);
    if (state !== "本会員") throw new Error(`会員 ${mail} を登録したが、会員一覧で本会員にならない（${state ?? "見つからない"}）`);
    return customerIdByEmail(page, mail);
  });
  const m = { mail, password: d.password, id };
  members.set(rc(d.local), m);
  issue(`会員 ${d.local} を登録した（会員ID ${id}）`);
  return m;
}

// ---- 商品 ----

type 作った商品 = { productId: string; classId: string; classIdEn?: string };

async function createProducts(browser: Browser, tag: string, defs: 商品定義[], branch: "公開" | "非公開", issue: (m: string) => void): Promise<作った商品[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${tag} のグッズ商品CSV登録`, fileName: `${tag}.csv`, categoryId, branchStatus: branch,
      lines: defs.map((d) => ({ code: rc(d.code), nameJp: rc(nameOf(d)), nameEn: rc(nameOf(d)) })),
      onWarning: (w) => issue(`${tag}: グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    const out: 作った商品[] = [];
    for (const d of defs) {
      const code = rc(d.code);
      const productId = await openProductEditByCode(page, code);
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== code) throw new Error(`${tag}: ${code} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId, classId: rows[0].商品規格ID }, `${tag}: ${code}`, issue);
      let classIdEn: string | undefined;
      if (d.english) {
        await openClassList(page, productId);
        classIdEn = await addClass(page, productId, {
          言語: "英語", 状態: "ニアミント", 商品コード: code, 基準価格: "100", 販売価格: "100", 買取価格: "0",
        }, `${tag}: ${code} の英語の規格`, issue);
      }
      const made = { productId, classId: rows[0].商品規格ID, classIdEn };
      products.set(code, made);
      out.push(made);
    }
    return out;
  });
}

// ---- お気に入り（フロントで会員が商品詳細のボタンを押す） ----

async function favoriteAs(browser: Browser, m: 会員, items: { productId: string; lang: "JP" | "EN"; code: string }[], tag: string, issue: (m: string) => void): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const front = new FrontFavorite(await context.newPage());
    await front.login(m.mail, m.password);
    for (const it of items) {
      await front.openDetail(it.productId, it.lang);
      const r = await front.押す();
      if (!r.通知が出た || r.ログインモーダルが開いた) {
        throw new Error(`${tag}: 商品 ${it.code}（${it.lang}）のお気に入りボタンを押しても、登録完了の通知が出ない（${JSON.stringify(r)}）`);
      }
      await front.通知を閉じる();
      if (!お気に入りID(m.id, it.productId, it.lang)) throw new Error(`${tag}: 商品 ${it.code}（${it.lang}）のお気に入りを登録したのに、参照で見つからない`);
    }
    issue(`${tag}: 会員 ${m.mail} がお気に入りを ${items.length} 件登録した。完了の表示はモーダルでなく画面右下の通知で、その閉じるボタンで閉じた（正本は「完了モーダルを閉じる」）`);
  } finally {
    await context.close();
  }
}

// ---- 在庫（登録者とは別の管理者が承認する） ----

async function stockToOne(browser: Browser, codes: string[], tag: string, issue: (m: string) => void): Promise<void> {
  const approverName = await withAdminSession(browser, SETUP_ADMIN, (page) => loggedInMemberName(page));
  const shop = await withAdminSession(browser, SETUP_ADMIN, (page) => new StockListPage(page).shopNameById("1"));
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureStockAdmin(page));
  const baseline = 在庫承認の最大ID();
  const registeredBy = await withAdminSession(browser, STOCK_ADMIN, async (page) => {
    const registrant = await loggedInMemberName(page);
    if (registrant === approverName) throw new Error(`${tag}: 登録者と承認者が同じ管理者になっている`);
    const stock = new StockListPage(page);
    for (const code of codes) {
      await stock.searchByProductCode(code);
      await stock.openEdit(stock.row(code, shop, "EC-CUBE"));
      await registerStockEdit(page, { changeType: "入庫/その他", reason: "F03-08試験データ", quantity: "1", purchasePrice: "0", approverName }, `${tag}: ${code} の在庫編集（1）`, issue);
    }
    return registrant;
  });
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const list = new StockApprovalListPage(page);
    await list.open(shop);
    const rows = (await list.rowValues()).filter((r) => r.status === "未承認" && r.registrant === registeredBy && r.shop.startsWith(shop)
      && r.changeType.endsWith("入庫/その他") && r.quantity === "1" && Number(r.id) > baseline);
    if (rows.length < codes.length) throw new Error(`${tag}: 在庫編集の未承認の行が ${rows.length} 件（${codes.length} 件のはず）`);
    await list.approve(rows.slice(0, codes.length).map((r) => r.id), `${tag}: 在庫編集の承認（${codes.length}件）`, issue);
    for (const code of codes) {
      const after = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
      const n = await stockInRow(after.row(code, shop, "EC-CUBE"));
      if (n !== 1) throw new Error(`${tag}: ${code} の在庫が ${n}（1のはず）`);
    }
  });
}

// ---- 呼び名の控え ----

type 控えの材料 = { members: 会員[]; products: 作った商品[]; classes: string[]; favs: { member: number; product: number; lang: "JP" | "EN" }[] };

/** シード表の状態・属性・投入方法に出てくる呼び名を、作ったものから決めて控える（末尾の英字 A・B… は並びの番号） */
function noteLabels(seedId: string, notes: Notes, ctx: 控えの材料): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(.+?)-F0308-(\d+)([A-Z]?)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, , letter] = m;
    const idx = letter ? letter.charCodeAt(0) - 65 : 0;
    if (kind === "会員ID") notes.set(label, ctx.members[idx].id);
    else if (kind === "選手ID") {
      const p = プレイヤーID(ctx.members[idx].id);
      if (!p) throw new Error(`${seedId}: 会員ID ${ctx.members[idx].id} の選手が見つからない`);
      notes.set(label, p);
    } else if (kind === "商品ID") notes.set(label, ctx.products[idx].productId);
    else if (kind === "商品規格ID") notes.set(label, ctx.classes[idx]);
    else if (kind === "お気に入りID") {
      const f = ctx.favs[idx];
      const id = お気に入りID(ctx.members[f.member].id, ctx.products[f.product].productId, f.lang);
      if (!id) throw new Error(`${seedId}: お気に入りを画面で登録したのに、参照でお気に入りIDが見つからない`);
      notes.set(label, id);
    } else throw new Error(`${seedId}: 呼び名 ${label} の種類が未対応`);
  }
}

// ---- 標準の形: 会員（任意）＋商品＋お気に入り＋整え ----

function define(d: シード定義): void {
  const seedId = `S-F03-08-${d.id}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const mems: 会員[] = [];
    for (const md of d.members ?? []) mems.push(await createMember(browser, md, issue));
    const made = await createProducts(browser, seedId, d.products, d.branch ?? "非公開", issue);
    // お気に入り: 会員ごとに、シード表の並びのとおりに登録する
    const favs = (d.favorites ?? []).map((f) => ({ member: f.member, product: f.product, lang: f.lang ?? ("JP" as const) }));
    for (const mi of [...new Set(favs.map((f) => f.member))]) {
      const items = favs.filter((f) => f.member === mi).map((f) => ({ productId: made[f.product].productId, lang: f.lang, code: rc(d.products[f.product].code) }));
      await favoriteAs(browser, mems[mi], items, seedId, issue);
    }
    // 登録後の整え
    const after = d.後 ?? {};
    for (const i of after.高額商品コード ?? []) {
      await withAdminSession(browser, SETUP_ADMIN, (page) =>
        savePublishedClass(page, { productId: made[i].productId, classId: made[i].classId, highPriceCode: rc(d.products[i].code) }, `${seedId}: ${rc(d.products[i].code)} の高額商品コード`, issue));
    }
    if ((after.在庫を1にする ?? []).length) await stockToOne(browser, after.在庫を1にする!.map((i) => rc(d.products[i].code)), seedId, issue);
    for (const i of after.非公開 ?? []) {
      await withAdminSession(browser, SETUP_ADMIN, (page) => setProductPrivate(page, made[i].productId, `${seedId}: ${rc(d.products[i].code)}`, issue));
    }
    const classes = made.flatMap((p) => (p.classIdEn ? [p.classId, p.classIdEn] : [p.classId]));
    noteLabels(seedId, notes, { members: mems, products: made, classes, favs });
  });
}

// ---- 共通: お気に入り商品機能の有効 ----

/** 試験環境の本店・支店を使用し、管理画面の店舗設定でお気に入り商品機能を設定する。各ケースが開始時に必要な値（有効）にする */
defineSeed("S-F03-08-ENV", async ({ browser }) => {
  const changed = await withAdminSession(browser, SETUP_ADMIN, (page) => setFavoriteOption(page, true));
  reportSeedIssue("S-F03-08-ENV", changed ? "お気に入り商品機能を有効に切り替えた" : "お気に入り商品機能は有効のままだった");
});

// ---- ケースごとのシード ----

const addOne = (n: string): シード定義 => ({ id: `CASE-${n}`, members: [std(n)], products: [{ code: `ADD-001-${n}` }] });
const existOne = (n: string): シード定義 => ({ id: `CASE-${n}`, members: [std(n)], products: [{ code: `EXIST-001-${n}` }], favorites: [{ member: 0, product: 0 }] });

// 001 本店と支店の表示差（商品は支店でも公開）
define({ id: "CASE-001", members: [std("001")], products: [{ code: "STORE-001-001" }], favorites: [{ member: 0, product: 0 }], branch: "公開" });
// 002・025 は会員なし（未ログインで押す）
define({ id: "CASE-002", products: [{ code: "ADD-001-002" }] });
define({ id: "CASE-025", products: [{ code: "ADD-001-025" }] });
for (const n of ["003", "004", "005", "018", "019", "026", "030"]) define(addOne(n));
for (const n of ["006", "007", "022", "023", "027", "028", "029", "031"]) define(existOne(n));
// 008 会員A・会員Bと、会員ごとのお気に入り
define({
  id: "CASE-008",
  members: [std("008"), { local: "f0308-b-008", password: "Passw0rd-F0308-008!F0308B-008", given: "F0308B008" }],
  products: [{ code: "OWN-A-001-008" }, { code: "OWN-A-002-008" }, { code: "OWN-B-001-008" }],
  favorites: [{ member: 0, product: 0 }, { member: 0, product: 1 }, { member: 1, product: 2 }],
});
// 010 公開中と非公開のお気に入り（登録したあとに一方を非公開にする）
define({
  id: "CASE-010", members: [std("010")], products: [{ code: "PUB-001-010" }, { code: "PRIVATE-001-010" }],
  favorites: [{ member: 0, product: 0 }, { member: 0, product: 1 }], 後: { 非公開: [1] },
});
// 011 高額商品（登録したあとに高額商品コードを入れ、HP-STOCK だけ在庫を1にする）
define({
  id: "CASE-011", members: [std("011")], products: [{ code: "HP-STOCK-001-011" }, { code: "HP-OUT-001-011" }],
  favorites: [{ member: 0, product: 0 }, { member: 0, product: 1 }], 後: { 高額商品コード: [0, 1], 在庫を1にする: [0] },
});
// 012 日本語と英語のお気に入り各1件
define({
  id: "CASE-012", members: [std("012")], products: [{ code: "LANG-LIST-001-012", english: true }],
  favorites: [{ member: 0, product: 0, lang: "JP" }, { member: 0, product: 0, lang: "EN" }],
});
// 013 日本語だけお気に入り
define({ id: "CASE-013", members: [std("013")], products: [{ code: "LANG-STATE-001-013", english: true }], favorites: [{ member: 0, product: 0, lang: "JP" }] });
// 021 解除する商品と対象外の商品
define({
  id: "CASE-021", members: [std("021")], products: [{ code: "EXIST-001-021" }, { code: "OTHER-001-021" }],
  favorites: [{ member: 0, product: 0 }, { member: 0, product: 1 }],
});
// 034 日本語だけお気に入り（英語を足す）
define({
  id: "LANGADD-034", members: [{ local: "f0308-034-a", password: "Pw-F0308-034-A", given: "F0308A034" }],
  products: [{ code: "F0308-034-P1", english: true }], favorites: [{ member: 0, product: 0, lang: "JP" }],
});
// 035 ログインモーダルを閉じる（未ログイン）
define({ id: "CLOSELOGIN-035", products: [{ code: "F0308-035-P1" }] });
// 036 モーダルでログインして一覧を見る
define({
  id: "LOGINOK-036", members: [{ local: "f0308-036-a", password: "Pw-F0308-036-A", given: "F0308A036" }],
  products: [{ code: "F0308-036-P1" }, { code: "F0308-036-P2" }], favorites: [{ member: 0, product: 1 }],
});
define({ id: "CLOSEDONE-037", members: [{ local: "f0308-037-a", password: "Pw-F0308-037-A", given: "F0308A037" }], products: [{ code: "F0308-037-P1" }] });
define({
  id: "CLOSECANCEL-038", members: [{ local: "f0308-038-a", password: "Pw-F0308-038-A", given: "F0308A038" }],
  products: [{ code: "F0308-038-P1" }], favorites: [{ member: 0, product: 0 }],
});
// 039 再登録（商品名は「再登録商品-039」）
define({ id: "READD-039", members: [{ local: "dpf0308-039", password: "Passw0rd-F0308039", given: "F0308A039" }], products: [{ code: "RE-ADD-F0308-039", name: "再登録商品-039" }] });
// 040〜042 コールバック由来の固定の会員・商品
define({ id: "CBUNLOGIN-040", members: [{ local: "cbf0308-040", password: "Passw0rd-CBF0308040", given: "CBF0308A040" }], products: [{ code: "CBF0308-040-P1" }] });
define({
  id: "CBLIST-041", members: [{ local: "cbf0308-041", password: "Passw0rd-CBF0308041", given: "CBF0308A041" }],
  products: [{ code: "CBF0308-041-P1" }], favorites: [{ member: 0, product: 0 }], 後: { 在庫を1にする: [0] },
});
define({
  id: "CBLIST-042", members: [{ local: "cbf0308-042", password: "Passw0rd-CBF0308042", given: "CBF0308A042" }],
  products: [{ code: "CBF0308-042-P1" }], favorites: [{ member: 0, product: 0 }],
});
