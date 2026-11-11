/**
 * F06-09 お気に入り商品一覧の画面シード。正本: cases/F06-09_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. 会員: フロントの新規会員登録画面で登録し、管理画面の会員登録/編集で会員ステータスを本会員にする（開発環境では本登録のメールを読めないため。
 *    pages/admin/f02_02_setup.ts の「会員を登録して本会員にする」）。会員IDは管理画面の会員一覧で読む。
 * 2. カード（カード商品だけ）: カード詳細(登録)で登録し、登録後の画面のカードIDを控える。
 * 3. 商品: グッズ商品CSV登録（商品カテゴリはサプライ・グッズ、地域別販売制限0・スマレジ連携フラグ0）。商品マスターで商品IDを読み、
 *    取り込みで作られた商品規格を公開で登録する（高額商品コード・セールフラグがあれば入れる）。状態EX・英語の商品規格は商品規格一覧の「新規作成」で足す。
 *    カード商品は商品登録編集画面の「カード指定」でカードを指定し、商品名を入れ直して「商品を登録」。
 * 4. 在庫: 在庫検索一覧で本店・EC-CUBE の行から在庫編集画面を開き、在庫IDを控え、在庫を入れて（登録者とは別の管理者が承認）。
 * 5. お気に入り: フロントに会員でログインし、商品詳細の「お気に入りに追加する」を押す（確認は OK）。
 * 6. 登録後の整え: 非公開にする商品（014・049）は、お気に入りに追加したあと商品登録編集画面で非公開にする。
 *
 * 決め打ちの識別の値（会員のメールアドレスの前半・商品コード・商品名・高額商品コード）には、実行ごとの印を付ける（lib/run_marker.ts。依頼者決定 2026-10-28）。
 * パスワードには付けない。
 *
 * 正本の外で補ったこと・代えたこと（ケースの注記にも出す）:
 * - プレイヤーIDは、シード表はデッキ管理のプレイヤー検索で控えると定めるが、DBの参照で読む（DB確認の接続先が無ければ「（DB確認なし）」と控える。F06-08 と同じ扱い）。
 * - お気に入りIDは画面に出ない番号で、シード表も「控えず、会員と商品の組で特定する」と書くので、会員ID・商品ID・言語の組を控える。
 * - カード商品の「商品カテゴリはサプライ・グッズの選択を外して単体カードを選ぶ」は行わない（ケースはカテゴリを見ない）。
 * - パスワードをシード表が定めない会員（030〜036・014 の他会員）は F0609PwdCase<番号> の形にした。
 * - 「Foilにあり」は、カードの Foil の選択肢の「通常」を選んだ（選択肢は なし・通常・特殊）。
 *
 * 作らないシード（ケースを実装していない）: 002・003・034・037（DBシードで固定の番号の会員・百件前後の商品とお気に入りを作る）。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { プレイヤーID } from "../db/f03_07";
import { getSeed } from "../lib/catalog";
import { available } from "../lib/db";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 会員を登録して本会員にする } from "../pages/admin/f02_02_setup";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { readFavoriteOption, setProductPrivate } from "../pages/admin/f03_08_masters";
import { セールの規格にして公開する, 在庫を入れて在庫IDを読む, 在庫の対象, 規格を足す } from "../pages/admin/f06_09_setup";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, openProductEditByCode, readGoodsRootCategoryId, registerCard } from "../pages/admin/m03_23_seed_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { ensureCardset } from "../pages/admin/product_masters";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { markedMail } from "./f06-member";

type Issue = (m: string) => void;

// ---- 定義 ----

type 足す規格 = { 言語?: "英語"; 状態: "NM" | "EX"; 価格: string; 買取: string; 高額?: string; 在庫?: number };
type 商品 = {
  code: string;
  /** CSV の基準価格＝販売価格（既定 1000） */
  価格?: string;
  /** CSV の買取価格（既定 100） */
  買取?: string;
  販売制限数?: string;
  カード?: { Foil?: "あり" | "なし" };
  /** 取り込みで作られた商品規格の高額商品コード（正本の値。印を付けて入れる） */
  高額?: string;
  /** 取り込みで作られた商品規格をセール対象にするときの販売価格（基準価格は1000） */
  セール?: string;
  /** 取り込みで作られた商品規格の本店の在庫（既定 0） */
  在庫?: number;
  追加?: 足す規格[];
  /** お気に入りに追加したあと非公開にする */
  非公開?: boolean;
};
type 会員 = { 前半: string; パスワード: string; 姓?: string; 名?: string };
type 定義 = {
  seedId: string;
  /** 呼び名の番号（〔会員ID-F0609-<番号>〕） */
  n: string;
  会員: 会員[];
  商品?: 商品[];
  /** 既定: 先頭の会員が、商品を並びの順に日本語でお気に入りに追加する */
  お気に入り?: { 会員: number; 商品: number; 言語?: "JP" | "EN" }[];
};

export type 作った会員 = { mail: string; password: string; id: string };
export type 作った商品 = { productId: string; classIds: string[]; code: string; name: string };

// ---- ケースが引く対応（シードが作ったもの） ----

const members = new Map<string, 作った会員>();
const products = new Map<string, 作った商品>();

/** シード表のログインID（メールアドレスの@の前＝正本の値）から、シードが作った会員を引く */
export function memberOf(正本の前半: string): 作った会員 {
  const m = members.get(rc(正本の前半));
  if (!m) throw new Error(`会員 ${正本の前半} はまだ作っていない`);
  return m;
}
/** シード表の商品コード（正本の値）から、シードが作った商品を引く */
export function productOf(正本の商品コード: string): 作った商品 {
  const p = products.get(rc(正本の商品コード));
  if (!p) throw new Error(`商品コード ${正本の商品コード} の商品はまだ作っていない`);
  return p;
}
/** 正本の商品名（＝商品コード）に印を付けた、画面に出る商品名 */
export const 商品名 = (正本: string): string => rc(正本);
/** 正本の高額商品コードに印を付けた値 */
export const 高額商品コード = (正本: string): string => rc(正本);

// ---- 会員 ----

async function 会員を作る(browser: Browser, m: 会員, issue: Issue): Promise<作った会員> {
  const mail = markedMail(m.前半);
  const id = await 会員を登録して本会員にする(browser, {
    姓: m.姓 ?? "試験", 名: m.名 ?? "会員", セイ: "シケン", メイ: "カイイン", メール: mail, パスワード: m.パスワード,
  }, issue);
  const made = { mail, password: m.パスワード, id };
  members.set(rc(m.前半), made);
  return made;
}

// ---- 商品 ----

async function 商品を作る(browser: Browser, seedId: string, n: string, defs: 商品[], issue: Issue): Promise<{ made: 作った商品[]; カードID: string[]; 在庫: 在庫の対象[] }> {
  const made: 作った商品[] = [];
  const カードID: string[] = [];
  const 在庫: 在庫の対象[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // カード（カード商品だけ）
    const cards = new Map<number, { 名: string; 詳細ID: string }>();
    const withCard = defs.map((d, i) => [d, i] as const).filter(([d]) => d.カード);
    if (withCard.length) {
      const cardsetId = await ensureCardset(page, "F0609カードセット", "F0609 Card Set", "F0609S", issue);
      for (const [d, i] of withCard) {
        const 名 = rc(`F0609-CARD-${n}${withCard.length > 1 ? `-${i}` : ""}`);
        const foil = d.カード!.Foil === "あり" ? "通常" : d.カード!.Foil === "なし" ? "なし" : undefined;
        const c = await registerCard(page, { カード名日: 名, カード名英: 名, 点数で見たマナ: "1", コスト: "{1}", カードセットID: cardsetId, ...(foil ? { Foil: foil } : {}) }, `${seedId}: ${d.code} のカード`, issue);
        if (foil) issue(`${seedId}: ${d.code} のカードは Foil に「${foil}」を選んだ（シード表: Foil${d.カード!.Foil}）`);
        cards.set(i, { 名, 詳細ID: c.カード詳細ID });
        カードID.push(c.カードID);
        issue(`${seedId}: ${d.code} のカードを登録した（カードID ${c.カードID}。登録後のカードの編集画面で読んだ）`);
      }
    }
    // グッズ商品CSV登録
    const categoryId = await readGoodsRootCategoryId(page);
    const template = await downloadGoodsCsvTemplate(page);
    const region = Object.fromEntries(template.headers.filter((h) => h.includes("地域")).map((h) => [h, "0"]));
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${Date.now()}.csv`, categoryId,
      common: { ...region, "スマレジ連携フラグ": "0", "原価単価": "10" },
      lines: defs.map((d) => ({
        code: rc(d.code), nameJp: rc(d.code), nameEn: rc(d.code),
        values: {
          "基準価格": d.価格 ?? "1000", "販売価格": d.価格 ?? "1000", "買取価格": d.買取 ?? "100",
          ...(d.販売制限数 ? { "販売制限数": d.販売制限数 } : {}),
        },
      })),
      onWarning: (w) => issue(`${seedId}: グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    // 商品ごとに: 商品ID・カード指定・取り込みの規格の公開（高額・セール）・規格を足す
    for (const [i, d] of defs.entries()) {
      const code = rc(d.code);
      const what = `${seedId}: ${code}`;
      const productId = await openProductEditByCode(page, code);
      if (cards.has(i)) {
        const c = cards.get(i)!;
        await assignCardOnProductEdit(page, { productId, cardNameJp: c.名, cardDetailId: c.詳細ID, productNameJp: code, productNameEn: code }, (m) => issue(`${what}: ${m}`));
        issue(`${what}: カードを指定した。商品カテゴリの「サプライ・グッズ」→「単体カード」の付け替えは行っていない（ケースはカテゴリを見ない）`);
      }
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1 || rows[0].商品コード !== code) throw new Error(`${what}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      const first = rows[0].商品規格ID;
      if (d.セール !== undefined) {
        await セールの規格にして公開する(page, { productId, classId: first, 基準価格: "1000", 販売価格: d.セール }, what, issue);
      } else {
        await savePublishedClass(page, { productId, classId: first, ...(d.高額 ? { highPriceCode: rc(d.高額) } : {}) }, what, issue);
      }
      const classIds = [first];
      在庫.push({ 商品コード: code, 商品規格ID: first, 数: d.在庫 ?? 0 });
      for (const a of d.追加 ?? []) {
        const id = await 規格を足す(page, productId, {
          言語: a.言語 ?? "日本語", 状態: a.状態, 商品コード: code, 価格: a.価格, 買取価格: a.買取, ...(a.高額 ? { 高額商品コード: rc(a.高額) } : {}),
        }, `${what} の規格（${a.言語 ?? "日本語"}・${a.状態}・${a.価格}円）`, issue);
        classIds.push(id);
        在庫.push({ 商品コード: code, 商品規格ID: id, 数: a.在庫 ?? 0 });
      }
      const p = { productId, classIds, code, name: code };
      products.set(code, p);
      made.push(p);
    }
  });
  return { made, カードID, 在庫 };
}

// ---- お気に入り（フロントで会員が商品詳細のボタンを押す） ----

async function お気に入りに追加する(browser: Browser, m: 作った会員, items: { productId: string; lang: "JP" | "EN"; code: string }[], seedId: string, issue: Issue): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const front = new FrontFavorite(await context.newPage());
    await front.login(m.mail, m.password);
    for (const it of items) {
      await front.openDetail(it.productId, it.lang);
      const r = await front.押す();
      if (!r.通知が出た || r.ログインモーダルが開いた) throw new Error(`${seedId}: ${it.code}（${it.lang}）のお気に入りボタンを押しても、登録完了の通知が出ない（${JSON.stringify(r)}）`);
      await front.通知を閉じる();
    }
    await front.logout();
    issue(`${seedId}: 会員 ${m.mail} がお気に入りを ${items.length} 件登録した（確認のダイアログは OK。完了の表示は画面右下の通知）`);
  } finally {
    await context.close();
  }
}

// ---- 呼び名の控え ----

const 英字 = (i: number) => String.fromCharCode(65 + i);

/**
 * シード表の状態・属性・投入方法に出てくる呼び名を、作ったものから決めて控える。
 * 末尾の英字 A・B… は並びの番号（会員・商品・商品規格（作った順）・在庫（商品規格と同じ並び）・お気に入り（登録した順）・カード）。英字の無い呼び名は先頭。
 */
function 控える(seedId: string, notes: Notes, n: string, ctx: {
  会員: 作った会員[]; 商品: 作った商品[]; カードID: string[]; 在庫ID: Map<string, string>;
  お気に入り: { 会員: number; 商品: number; 言語: "JP" | "EN" }[];
}): void {
  const seed = getSeed(seedId);
  const classes = ctx.商品.flatMap((p) => p.classIds);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (label.includes("…")) continue;
    const m = new RegExp(`^〔(.+?)-F0609-${n}([A-Z]?)〕$`).exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, letter] = m;
    const idx = letter ? letter.charCodeAt(0) - 65 : 0;
    const need = <T>(v: T | undefined, what: string): T => { if (v === undefined) throw new Error(`${seedId}: ${label}（${what}）に当たるものを作っていない`); return v; };
    if (kind === "会員ID") notes.set(label, need(ctx.会員[idx], "会員").id);
    else if (kind === "プレイヤーID") {
      const id = need(ctx.会員[idx], "会員").id;
      notes.set(label, available ? (プレイヤーID(id) ?? `（会員ID ${id} のプレイヤーが参照で見つからない）`) : "（DB確認なし）");
    } else if (kind === "商品ID") notes.set(label, need(ctx.商品[idx], "商品").productId);
    else if (kind === "商品規格ID") notes.set(label, need(classes[idx], "商品規格"));
    else if (kind === "在庫ID") notes.set(label, need(ctx.在庫ID.get(need(classes[idx], "商品規格")), "在庫"));
    else if (kind === "カードID") notes.set(label, need(ctx.カードID[idx], "カード"));
    else if (kind === "お気に入りID") {
      const f = need(ctx.お気に入り[idx], "お気に入り");
      notes.set(label, `画面に出ない番号（会員ID ${ctx.会員[f.会員].id}・商品ID ${ctx.商品[f.商品].productId}・言語 ${f.言語} の組で特定する）`);
    } else throw new Error(`${seedId}: 呼び名 ${label} の種類が未対応`);
  }
}

// ---- 標準の形 ----

function define(d: 定義): void {
  defineSeed(d.seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(d.seedId, m);
    const mems: 作った会員[] = [];
    for (const m of d.会員) mems.push(await 会員を作る(browser, m, issue));
    const defs = d.商品 ?? [];
    let made: 作った商品[] = [];
    let カードID: string[] = [];
    const 在庫ID = new Map<string, string>();
    if (defs.length) {
      const r = await 商品を作る(browser, d.seedId, d.n, defs, issue);
      made = r.made;
      カードID = r.カードID;
      // 在庫: 在庫を入れる商品規格と、シード表が在庫IDを控えると定める商品規格だけ在庫編集画面を開く
      const seed = getSeed(d.seedId);
      const labels = Notes.labelsIn(seed["状態・属性"] + seed.投入方法).filter((l) => l.startsWith("〔在庫ID-"));
      const classes = made.flatMap((p) => p.classIds);
      const 対象 = r.在庫.filter((t) => {
        const i = classes.indexOf(t.商品規格ID);
        return t.数 > 0 || labels.includes(`〔在庫ID-F0609-${d.n}${英字(i)}〕`) || (i === 0 && labels.includes(`〔在庫ID-F0609-${d.n}〕`));
      });
      for (const [c, v] of await 在庫を入れて在庫IDを読む(browser, d.seedId, 対象, issue)) 在庫ID.set(c, v.在庫ID);
    }
    const favs = (d.お気に入り ?? made.map((_, i) => ({ 会員: 0, 商品: i, 言語: "JP" as const }))).map((f) => ({ ...f, 言語: f.言語 ?? ("JP" as const) }));
    for (const mi of [...new Set(favs.map((f) => f.会員))]) {
      const items = favs.filter((f) => f.会員 === mi).map((f) => ({ productId: made[f.商品].productId, lang: f.言語, code: made[f.商品].code }));
      await お気に入りに追加する(browser, mems[mi], items, d.seedId, issue);
    }
    for (const [i, p] of defs.entries()) {
      if (!p.非公開) continue;
      await withAdminSession(browser, SETUP_ADMIN, (page) => setProductPrivate(page, made[i].productId, `${d.seedId}: ${made[i].code} を非公開にする`, issue));
    }
    控える(d.seedId, notes, d.n, { 会員: mems, 商品: made, カードID, 在庫ID, お気に入り: favs });
  });
}

// ---- 共通の環境 ----

/**
 * 共有の設定（基本設定のお気に入り商品機能・状態表示下限価格・本店・言語・商品状態）は書き換えない。
 * 店舗設定のお気に入り商品機能が有効であることを画面で確かめるだけ（共有の開発環境では、ある設定をそのまま使う。config/parallel_ok_seeds.tsv）。
 */
defineSeed("S-F06-09-ENV", async ({ browser, seed }) => {
  const on = await withAdminSession(browser, SETUP_ADMIN, (page) => readFavoriteOption(page));
  if (!on) throw new Error("店舗設定のお気に入り商品機能が無効。共有の設定は書き換えないので、有効にしてから流す");
  reportSeedIssue(seed.シードID, "共有の設定は書き換えず、店舗設定のお気に入り商品機能が有効であることだけを画面で確かめた。状態表示下限価格（100円）は画面で読めないので確かめていない（アプリケーション設定の既定の値を前提にした）");
});

// ---- 会員だけ（お気に入り0件） ----

const pw = (n: string) => `F0609PwdCase${n}`;
const std = (n: string): 会員 => ({ 前半: `f0609-${n}`, パスワード: pw(n), 名: `会員${n}` });
const 結合試験 = (n: string): 会員 => ({ 前半: `f0609-${n}`, パスワード: pw(n), 姓: "結合試験", 名: "会員" });

define({ seedId: "S-F06-09-CASE-001", n: "001", 会員: [結合試験("001")] });
for (const n of ["009", "010", "023", "028"]) define({ seedId: `S-F06-09-CASE-${n}`, n, 会員: [std(n)] });

// ---- 会員と商品とお気に入り ----

define({ seedId: "S-F06-09-CASE-004", n: "004", 会員: [std("004")], 商品: ["COUNT-001", "COUNT-002", "COUNT-003"].map((code) => ({ code, 在庫: 1 })) });
for (const n of ["005", "013"]) {
  define({ seedId: `S-F06-09-CASE-${n}`, n, 会員: [std(n)], 商品: [{ code: `SALE-001-${n}`, セール: "800", 在庫: 2 }, { code: `REG-001-${n}`, 在庫: 2 }] });
}
// 006・007・030: 状態別価格（NM・EX）を持つ3商品
const 状態別価格 = (pre: string): 商品[] => [["A", "100", "900"], ["B", "200", "800"], ["C", "300", "700"]].map(([x, nm, ex]) => ({
  code: `${pre}${x}`, 価格: nm, 買取: "10", 在庫: 1, 追加: [{ 状態: "EX" as const, 価格: ex, 買取: "10", 在庫: 1 }],
}));
define({ seedId: "S-F06-09-CASE-006", n: "006", 会員: [std("006")], 商品: 状態別価格("SORT-").map((p) => ({ ...p, code: `${p.code}-006` })) });
define({ seedId: "S-F06-09-CASE-007", n: "007", 会員: [std("007")], 商品: 状態別価格("SORT-").map((p) => ({ ...p, code: `${p.code}-007` })) });
define({ seedId: "S-F06-09-NOPRESS-030", n: "030", 会員: [std("030")], 商品: 状態別価格("F0609-030-") });
// 011・012・025: カード商品1件
for (const n of ["011", "012", "025"]) {
  const seedId = n === "025" ? "S-F06-09-CASE-025" : `S-F06-09-CASE-${n}`;
  define({ seedId, n, 会員: [std(n)], 商品: [{ code: `LINK-CARD-${n}`, カード: {}, 在庫: 2 }] });
}
// 014: 一覧に表示する対象（公開・非公開・高額商品コードと在庫・言語・他会員）
define({
  seedId: "S-F06-09-CASE-014", n: "014",
  会員: [{ 前半: "f0609-014", パスワード: pw("014"), 名: "会員014" }, { 前半: "f0609-other-014", パスワード: pw("014B"), 名: "他会員014" }],
  商品: [
    { code: "PUB-NORMAL-014" },
    { code: "PRIVATE-001-014", 在庫: 1, 非公開: true },
    { code: "PUB-HIGH-ZERO-014", 高額: "HIGH-0609-014-ZERO" },
    { code: "PUB-HIGH-STOCK-014", 高額: "HIGH-0609-014-STOCK", 在庫: 1 },
    { code: "LANG-001-014", 追加: [{ 言語: "英語", 状態: "NM", 価格: "1000", 買取: "100" }] },
    { code: "OTHER-001-014", 在庫: 1 },
  ],
  お気に入り: [
    { 会員: 0, 商品: 0 }, { 会員: 0, 商品: 1 }, { 会員: 0, 商品: 2 }, { 会員: 0, 商品: 3 },
    { 会員: 0, 商品: 4, 言語: "JP" }, { 会員: 0, 商品: 4, 言語: "EN" }, { 会員: 1, 商品: 5 },
  ],
});
// 015・016: NM 50円・EX 99円・EX 100円
for (const n of ["015", "016"]) {
  define({
    seedId: `S-F06-09-CASE-${n}`, n, 会員: [std(n)],
    商品: [{ code: `DETAIL-001-${n}`, 価格: "50", 買取: "10", 在庫: 2, 追加: [{ 状態: "EX", 価格: "99", 買取: "10", 在庫: 2 }, { 状態: "EX", 価格: "100", 買取: "10", 在庫: 2 }] }],
  });
}
define({ seedId: "S-F06-09-CASE-017", n: "017", 会員: [std("017")], 商品: [{ code: "DETAIL-HIGH-001-017", 価格: "200", 高額: "HIGH-0609-017", 在庫: 2 }] });
define({ seedId: "S-F06-09-CASE-018", n: "018", 会員: [std("018")], 商品: [{ code: "QTY-001-018", 販売制限数: "1", 在庫: 3 }] });
define({ seedId: "S-F06-09-CASE-019", n: "019", 会員: [std("019")], 商品: [{ code: "QTY-ZERO-001-019" }] });
for (const n of ["020", "021", "022"]) define({ seedId: `S-F06-09-CASE-${n}`, n, 会員: [std(n)], 商品: [{ code: `CART-001-${n}`, 在庫: 5 }] });
define({ seedId: "S-F06-09-CASE-024", n: "024", 会員: [std("024")], 商品: [{ code: "LINK-CARD-024", カード: {}, 在庫: 2 }, { code: "LINK-NONCARD-024", 在庫: 2 }] });
for (const n of ["026", "027"]) define({ seedId: `S-F06-09-CASE-${n}`, n, 会員: [結合試験(n)], 商品: [{ code: `DELETE-001-${n}`, 在庫: 2 }] });

// 031〜036: セール対象・NM の4商品（A 900円セール・B 800円・C 700円セール・D 600円）
const セール4 = (n: string): 商品[] => [
  { code: `F0609-${n}-A`, 価格: "900", セール: "900", 在庫: 2 }, { code: `F0609-${n}-B`, 価格: "800", 在庫: 2 },
  { code: `F0609-${n}-C`, 価格: "700", セール: "700", 在庫: 2 }, { code: `F0609-${n}-D`, 価格: "600", 在庫: 2 },
];
define({ seedId: "S-F06-09-SALEKEEP-031", n: "031", 会員: [std("031")], 商品: セール4("031") });
define({ seedId: "S-F06-09-SORTKEEP-032", n: "032", 会員: [std("032")], 商品: セール4("032") });
define({ seedId: "S-F06-09-RELOAD-033", n: "033", 会員: [std("033")], 商品: セール4("033") });
define({ seedId: "S-F06-09-URLKEEP-035", n: "035", 会員: [std("035")], 商品: セール4("035") });
define({ seedId: "S-F06-09-SALEOFF-036", n: "036", 会員: [std("036")], 商品: セール4("036") });

define({ seedId: "S-F06-09-QTY1-038", n: "038", 会員: [std("038")], 商品: [{ code: "F0609-038-A", 在庫: 5 }] });
define({ seedId: "S-F06-09-FOILON-039", n: "039", 会員: [std("039")], 商品: [{ code: "F0609-039-A", カード: { Foil: "あり" }, 在庫: 2 }] });
define({ seedId: "S-F06-09-FOILOFF-040", n: "040", 会員: [std("040")], 商品: [{ code: "F0609-040-A", カード: { Foil: "なし" }, 在庫: 2 }] });
define({ seedId: "S-F06-09-QTYNOLIM-041", n: "041", 会員: [std("041")], 商品: [{ code: "F0609-041-A", 在庫: 3 }] });
define({ seedId: "S-F06-09-STOCKMIX-042", n: "042", 会員: [std("042")], 商品: [{ code: "F0609-042-A", 価格: "200", 追加: [{ 状態: "EX", 価格: "300", 買取: "100", 在庫: 2 }] }] });
define({
  seedId: "S-F06-09-HIGHCODE-043", n: "043", 会員: [std("043")],
  商品: [{ code: "F0609-043-A", 価格: "200", 在庫: 2, 追加: [{ 状態: "EX", 価格: "300", 買取: "100", 高額: "F0609-043-HIGH", 在庫: 2 }] }],
});
define({ seedId: "S-F06-09-DEL3-044", n: "044", 会員: [std("044")], 商品: ["A", "B", "C"].map((x) => ({ code: `F0609-044-${x}`, 在庫: 2 })) });

// 045〜055: コールバックの会員（cbf0609-…）
const cb = (n: string): 会員 => ({ 前半: `cbf0609-${n}`, パスワード: `Passw0rd-CBF0609${n}`, 名: `会員CB${n}` });
define({ seedId: "S-F06-09-CBPUBHIGHSTOCK-045", n: "045", 会員: [cb("045")], 商品: [{ code: "F0609-CB045-A", 価格: "200", 高額: "F0609-CB045-HIGH", 在庫: 2 }] });
define({ seedId: "S-F06-09-CBPUBNOHIGHZERO-046", n: "046", 会員: [cb("046")], 商品: [{ code: "F0609-CB046-A", 価格: "200" }] });
define({ seedId: "S-F06-09-CBHIGHZERO-047", n: "047", 会員: [cb("047")], 商品: [{ code: "F0609-CB047-A", 価格: "200", 高額: "F0609-CB047-HIGH" }] });
define({ seedId: "S-F06-09-CBPUBNOHIGHSTOCK-048", n: "048", 会員: [cb("048")], 商品: [{ code: "F0609-CB048-A", 価格: "200", 在庫: 2 }] });
define({ seedId: "S-F06-09-CBPRIVATE-049", n: "049", 会員: [cb("049")], 商品: [{ code: "F0609-CB049-A", 価格: "200", 非公開: true }] });
define({ seedId: "S-F06-09-CBNMOVER-050", n: "050", 会員: [cb("050")], 商品: [{ code: "F0609-CB050-A", 価格: "200" }] });
define({ seedId: "S-F06-09-CBNMUNDER-051", n: "051", 会員: [cb("051")], 商品: [{ code: "F0609-CB051-A", 価格: "50", 買取: "10" }] });
define({ seedId: "S-F06-09-CBEXOVER-052", n: "052", 会員: [cb("052")], 商品: [{ code: "F0609-CB052-A", 価格: "200", 追加: [{ 状態: "EX", 価格: "300", 買取: "100" }] }] });
define({ seedId: "S-F06-09-CBEXUNDER-053", n: "053", 会員: [cb("053")], 商品: [{ code: "F0609-CB053-A", 価格: "200", 追加: [{ 状態: "EX", 価格: "50", 買取: "10" }] }] });
define({ seedId: "S-F06-09-CBNONCARD-055", n: "055", 会員: [cb("055")], 商品: [{ code: "F0609-CB055-A", 価格: "200" }] });
