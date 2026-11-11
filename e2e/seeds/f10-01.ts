/**
 * F10-01 会員IDの連携（フロント）のシード（画面操作）。正本: cases/F10-01_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり。シード表と違えたところ（解釈。記録にも書く）:
 * - 会員: シード表は「管理画面の会員管理＞会員登録」で登録すると定めるが、管理画面には会員を新しく登録する画面が無い（会員の編集だけ）。
 *   フロントの新規会員登録で作り、本登録のメールのURLを開いて本会員にする（依頼者決定 2026-10-31。F06-16 と同じ作り方）。
 *   会員IDは画面が振るので、シード表の会員ID（92010001 など）にはならない。管理画面の会員一覧をメールアドレスで検索して読み、ケースは
 *   「その会員の会員ID」として確かめる。シード表に控える呼び名（〔…〕）が無いので、読んだ会員IDはこのファイルの表に持つ（同じ実行の中だけ）。
 *   メールアドレスの前半には実行の印を付ける（依頼者決定 2026-10-28）。パスワード・姓名はシード表の値。フリガナ（ケツゴウ・レンケイ）・
 *   生年月日・住所・電話番号は、フロントの登録で必須なので登録できる任意の値。
 * - 仮会員（MEM-015）・退会済み（MEM-016）: 本会員として作ったあと、管理画面の会員登録/編集画面で会員ステータスを「仮会員」「退会」にして登録する
 *   （仮会員機能の共有の設定を書き換えないため。退会処理はこの画面の会員ステータスで行う）。
 * - 商品（PRD-009・PRD-010）: 商品コード・商品名には実行の印を付ける。CSV の列はシード表の値。「在庫あり」は、取り込んだあと本店の EC-CUBE 在庫へ
 *   5 を入庫して承認する（F03-02 と同じ作り方。数はシード表に無い）。取込直後の商品規格が非公開なら公開にする（F03-02 と同じ）。
 *   商品IDは控えない（シード表どおり）。ケースが商品詳細を開くために、商品コードで読んだ商品IDをこのファイルの表に持つ。
 * - 追加ページ（PAGE-*・CBPAGE-031）: ページ名・URL・ファイル名には実行の印を付ける（URL・ファイル名はシード表に無いので「f1001-<番号>」に印）。
 *   「ページのレイアウト設定の先頭部へブロックを置く」は、このアプリではページごとにレイアウト（PC）を選び、ブロックはレイアウトに置く作りなので、
 *   ページごとに新しいPC向けのレイアウト（名前に印）を登録し、その先頭部（<head></head>タグ内）へブロックを置き、ページのPCのレイアウトに選ぶ。
 *   新しいレイアウトにはほかのブロックが無いので、「当該ブロックだけを置く」になる。共有のレイアウトは書き換えない。
 *   PAGE-013（レイアウト設定は何もしない）は、ページ登録画面のレイアウトの欄を初期値（未選択）のまま登録する。
 *   試験用ブロック（005・031）はブロック管理で登録し（ブロック名・ファイル名に印）、内容は「受け渡し領域が無ければ空の配列として用意し、
 *   項目名 marker-…・値 … の要素を1件積む」スクリプト。公開URLは、ページ登録画面のURL欄の左に出る前置きとURL欄の値をつないだもの。
 * - 管理者（ADM-026・027）: コンテンツ管理だけの権限はメンバー管理に無いので「システム管理者」で登録する（M09-04・M09-07 と同じ）。
 *   シード表のパスワード（F1001Adm026・F1001Adm027）は11文字で、管理者のパスワードの規則（12文字以上）に合わないので、末尾の番号を4桁にした
 *   F1001Adm0026・F1001Adm0027 で登録する（ケースはパスワードの値そのものを確かめない。前例 F07-04）。
 * - 共通環境（ENV）: 作り方は無い（参照だけ。ブロックの配置などは環境の状態のまま。ケースの画面が確かめる）。
 *
 * 作らないシード（ケースを実装しない）: MEM-012・LAYOUT-012（共有のページのレイアウトから当該ブロックを外し、戻さない。判断待ち）、
 * MEM-023（撮影の入力画像が正本で決まらない）、MEM-028・ORD-028（管理画面の受注登録の部品が無い。判断待ち）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { BASE_URL } from "../config/env";
import { 入庫して承認する } from "../pages/admin/f03_02_seed_ops";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { 先頭部へブロックを置く } from "../pages/admin/f10_01_layout";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, productIdsByCode, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { M08CustomerEditPage } from "../pages/admin/m08_customer_edit";
import { ページ管理 } from "../pages/admin/m09_04_page";
import { ブロック管理 } from "../pages/admin/m09_07_block";
import { レイアウトを登録する } from "../pages/admin/m09_layout";
import { カートに入れる } from "../pages/front/f04_shopping";
import { FrontCart } from "../pages/front/f03_02_detail";
import { LoginPage } from "../pages/front/f06_03_login";
import { markedMail, 本会員を作る } from "./f06-member";
import { ensureAnalysisAdmin } from "./m12-common";

/** ブロック「GoogleAnalytics用会員ID連携スクリプト」の名前（環境にあるもの。印は付けない） */
export const 連携ブロック名 = "GoogleAnalytics用会員ID連携スクリプト";

// ---------------------------------------------------------------------------
// 会員
// ---------------------------------------------------------------------------

export type F1001会員 = { 前半: string; パスワード: string; 名: string };
/** シード表の会員（キーはシードID）。メールアドレスの前半・パスワード・名（姓はすべて「結合」） */
export const 会員: Record<string, F1001会員> = {
  "S-F10-01-MEM-001": { 前半: "f1001-001", パスワード: "F1001Pass001", 名: "連携F1001-001" },
  "S-F10-01-MEM-002": { 前半: "f1001-002", パスワード: "F1001Pass002", 名: "連携F1001-002" },
  "S-F10-01-MEMB-002": { 前半: "f1001b-002", パスワード: "F1001PassB002", 名: "連携F1001-002" },
  "S-F10-01-MEM-003": { 前半: "f1001-003", パスワード: "F1001Pass003", 名: "連携F1001-003" },
  "S-F10-01-MEM-004": { 前半: "f1001-004", パスワード: "F1001Pass004", 名: "連携F1001-004" },
  "S-F10-01-MEM-005": { 前半: "f1001-005", パスワード: "F1001Pass005", 名: "連携F1001-005" },
  "S-F10-01-MEM-006": { 前半: "f1001-006", パスワード: "F1001Pass006", 名: "連携F1001-006" },
  "S-F10-01-MEM-008": { 前半: "f1001-008", パスワード: "F1001Pass008", 名: "連携F1001-008" },
  "S-F10-01-MEM-009": { 前半: "f1001-009", パスワード: "F1001Pass009", 名: "連携F1001-009" },
  "S-F10-01-MEM-010": { 前半: "f1001-010", パスワード: "F1001Pass010", 名: "連携F1001-010" },
  "S-F10-01-MEM-011": { 前半: "f1001-011", パスワード: "F1001Pass011", 名: "連携F1001-011" },
  "S-F10-01-MEM-013": { 前半: "f1001-013", パスワード: "F1001Pass013", 名: "連携F1001-013" },
  "S-F10-01-MEM-014": { 前半: "f1001-014", パスワード: "F1001Pass014", 名: "連携F1001-014" },
  "S-F10-01-MEM-015": { 前半: "f1001-015", パスワード: "F1001Pass015", 名: "連携F1001-015" },
  "S-F10-01-MEM-016": { 前半: "f1001-016", パスワード: "F1001Pass016", 名: "連携F1001-016" },
  "S-F10-01-MEM-017": { 前半: "f1001-017", パスワード: "F1001Pass017", 名: "連携F1001-017" },
  "S-F10-01-MEM-021": { 前半: "f1001-021", パスワード: "F1001Pass021", 名: "連携F1001-021" },
  "S-F10-01-MEM-022": { 前半: "f1001-022", パスワード: "F1001Pass022", 名: "連携F1001-022" },
};
export const 姓 = "結合";
/** 会員のメールアドレス（前半に実行の印） */
export const メールの値 = (seedId: string): string => markedMail(会員の定義(seedId).前半);
export const パスワードの値 = (seedId: string): string => 会員の定義(seedId).パスワード;
function 会員の定義(seedId: string): F1001会員 {
  const m = 会員[seedId];
  if (!m) throw new Error(`${seedId} の会員の定義が無い`);
  return m;
}

/** 作った会員の会員ID（画面が振った番号。同じ実行の中だけ） */
const 会員IDの表 = new Map<string, string>();
export function 会員IDの値(seedId: string): string {
  const id = 会員IDの表.get(seedId);
  if (!id) throw new Error(`${seedId} の会員IDを読めていない（シードが作られていない）`);
  return id;
}

async function 会員を作る(browser: Browser, seedId: string): Promise<string> {
  const m = 会員の定義(seedId);
  const id = await 本会員を作る(browser, { 姓, 名: m.名, セイ: "ケツゴウ", メイ: "レンケイ", 前半: m.前半, パスワード: m.パスワード });
  会員IDの表.set(seedId, id);
  reportSeedIssue(seedId, `フロントの新規会員登録で本会員を作った。画面が振った会員IDは ${id}（シード表の会員IDの値にはならない。ケースはこの会員IDで確かめる）`);
  return id;
}

/** 管理画面の会員登録/編集画面で、会員ステータスを変えて登録する */
async function 会員ステータスを変える(browser: Browser, seedId: string, 会員ID: string, ステータス: "仮会員" | "退会"): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ed = new M08CustomerEditPage(page);
    const st = await ed.open(会員ID);
    if (st !== 200) throw new Error(`${seedId}: 会員ID ${会員ID} の会員登録/編集画面を開けない（応答 ${st}）`);
    await ed.選ぶ("status", ステータス);
    await ed.登録する();
    const err = await ed.エラー文();
    if (err.length) throw new Error(`${seedId}: 会員ステータスを「${ステータス}」にして保存できない: ${err.join(" / ")}`);
    if ((await ed.成功メッセージ()) === null) throw new Error(`${seedId}: 会員ステータスを「${ステータス}」にした保存が成功の表示にならない`);
    if ((await ed.選択中("status")) !== ステータス) throw new Error(`${seedId}: 保存後の会員ステータスが「${await ed.選択中("status")}」`);
  });
}

defineSeed("S-F10-01-ENV", async () => { /* 試験環境（参照だけ）。ブロックの配置・表示言語などは環境の状態のまま。ケースの画面が確かめる */ });

defineSeed("S-F10-01-MEM-001", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-001"); });
defineSeed("S-F10-01-MEM-002", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-002"); });
defineSeed("S-F10-01-MEMB-002", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEMB-002"); });
defineSeed("S-F10-01-MEM-003", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-003"); });
defineSeed("S-F10-01-MEM-004", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-004"); });
defineSeed("S-F10-01-MEM-005", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-005"); });
defineSeed("S-F10-01-MEM-006", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-006"); });
defineSeed("S-F10-01-MEM-008", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-008"); });
defineSeed("S-F10-01-MEM-009", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-009"); });
defineSeed("S-F10-01-MEM-010", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-010"); });
defineSeed("S-F10-01-MEM-011", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-011"); });
defineSeed("S-F10-01-MEM-013", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-013"); });
defineSeed("S-F10-01-MEM-014", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-014"); });
defineSeed("S-F10-01-MEM-015", async ({ browser }) => {
  const id = await 会員を作る(browser, "S-F10-01-MEM-015");
  await 会員ステータスを変える(browser, "S-F10-01-MEM-015", id, "仮会員");
  reportSeedIssue("S-F10-01-MEM-015", "本会員として作ったあと、管理画面の会員登録/編集画面で会員ステータスを「仮会員」にした（仮会員機能の共有の設定を書き換えないため）");
});
defineSeed("S-F10-01-MEM-016", async ({ browser }) => {
  const id = await 会員を作る(browser, "S-F10-01-MEM-016");
  await 会員ステータスを変える(browser, "S-F10-01-MEM-016", id, "退会");
  reportSeedIssue("S-F10-01-MEM-016", "登録後の退会処理は、管理画面の会員登録/編集画面で会員ステータスを「退会」にして登録した");
});
defineSeed("S-F10-01-MEM-017", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-017"); });
defineSeed("S-F10-01-MEM-021", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-021"); });
defineSeed("S-F10-01-MEM-022", async ({ browser }) => { await 会員を作る(browser, "S-F10-01-MEM-022"); });

// ---------------------------------------------------------------------------
// 商品・買い物かご
// ---------------------------------------------------------------------------

/** 商品コード（実行の印つき）。ケースの「F1001-009-A」などは、この値として読む */
export const 商品コード = (正本の値: string): string => rc(正本の値);
const 商品IDの表 = new Map<string, string>();
/** 商品コード（正本の値）で、シードが作った商品の商品IDを引く（同じ実行の中だけ） */
export function 商品IDの値(正本の商品コード: string): string {
  const id = 商品IDの表.get(正本の商品コード);
  if (!id) throw new Error(`商品コード ${正本の商品コード} の商品をシードが作っていない`);
  return id;
}

async function グッズを作る(browser: Browser, seedId: string, 正本のコード: string, 正本の名前: string): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const code = rc(正本のコード);
  const 規格の商品コード = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readGoodsRootCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${RUN_MARK}.csv`, categoryId, branchStatus: "公開",
      lines: [{ code, nameJp: rc(正本の名前), nameEn: rc(正本の名前), productStatus: "公開" }],
      common: { "基準価格": "500", "販売価格": "500", "買取価格": "0", "原価単価": "0", "地域別販売制限": "0", "スマレジ連携フラグ": "0" },
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    const ids = await productIdsByCode(page, code);
    if (ids.length !== 1) throw new Error(`${seedId}: 商品コード ${code} の商品が ${ids.length} 件（1件のはず）`);
    const rows = await classRowsFromProductEdit(page, ids[0]);
    if (rows.length !== 1) throw new Error(`${seedId}: 取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
    if (rows[0].公開状態 !== "公開") await savePublishedClass(page, { productId: ids[0], classId: rows[0].商品規格ID }, `${seedId}: ${正本の名前}`, issue);
    商品IDの表.set(正本のコード, ids[0]);
    return rows[0].商品コード;
  });
  await 入庫して承認する(browser, [{ 商品コード: 規格の商品コード, 数: 5 }], seedId, issue);
  issue(`商品コード・商品名に実行の印を付けた。「在庫あり」は本店の EC-CUBE 在庫へ 5 を入庫して承認した（数はシード表に無い）`);
}

defineSeed("S-F10-01-PRD-009", async ({ browser }) => { await グッズを作る(browser, "S-F10-01-PRD-009", "F1001-009-A", "結合商品F1001-009"); });
defineSeed("S-F10-01-PRD-010", async ({ browser }) => { await グッズを作る(browser, "S-F10-01-PRD-010", "F1001-010-A", "結合商品F1001-010"); });

defineSeed("S-F10-01-CART-010", { needs: ["S-F10-01-MEM-010", "S-F10-01-PRD-010"] }, async ({ browser }) => {
  const seedId = "S-F10-01-CART-010";
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const login = new LoginPage(page);
    await login.ログイン画面を開く();
    await login.ログインする(メールの値("S-F10-01-MEM-010"), パスワードの値("S-F10-01-MEM-010"));
    if (await login.ログイン画面である()) throw new Error(`${seedId}: ログインできない（${await login.認証エラー()}）`);
    await カートに入れる(page, "", 商品IDの値("F1001-010-A"), 1, seedId);
    const cart = new FrontCart(page);
    await cart.open();
    const rows = (await cart.行()).filter((r) => r.商品名.includes(rc("結合商品F1001-010")));
    if (rows.length !== 1 || rows[0].数量 !== "1") throw new Error(`${seedId}: 買い物かごの「${rc("結合商品F1001-010")}」が数量1で1行でない: ${JSON.stringify(await cart.行())}`);
    if (!(await login.マイページのログアウトを押す())) throw new Error(`${seedId}: マイページのログアウトを押せない`);
  } finally { await context.close(); }
});

// ---------------------------------------------------------------------------
// 追加ページ
// ---------------------------------------------------------------------------

const 公開URLの表 = new Map<string, string>();
/** 追加ページ（正本のページ名）の公開URL（同じ実行の中だけ） */
export function 公開URLの値(正本のページ名: string): string {
  const u = 公開URLの表.get(正本のページ名);
  if (!u) throw new Error(`ページ「${正本のページ名}」をシードが作っていない`);
  return u;
}
export const ページ名 = (正本のページ名: string): string => rc(正本のページ名);

/** 受け渡し領域が無ければ空の配列として用意し、項目名・値の要素を1件積む試験用ブロックを登録する。ブロック名を返す */
async function 試験用ブロックを作る(browser: Browser, seedId: string, 番号: string, 項目名: string, 値: string): Promise<string> {
  const name = rc(`試験用ブロックF1001-${番号}`);
  const code = [
    "<script>",
    "window.dataLayer = window.dataLayer || [];",
    `window.dataLayer.push(${JSON.stringify({ [項目名]: 値 })});`,
    "</script>",
  ].join("\n");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await new ブロック管理(page).作る({ ブロック名: name, ファイル名: rc(`f1001_${番号.toLowerCase()}_marker`).replace(/-/g, "_"), コード: code, 言語: "ja" });
  });
  reportSeedIssue(seedId, `試験用ブロック「${name}」（フリー入力のスクリプト）をブロック管理で登録した。内容: ${code.replace(/\n/g, " ")}`);
  return name;
}

/**
 * ページを追加する。先頭部へ置くブロックがあれば、ページ用のPC向けレイアウトを登録して先頭部へ順に置き、ページのPCのレイアウトに選ぶ。
 * 公開URL（ページ登録画面のURL欄の左の前置き＋URL欄の値）を控える。
 */
async function ページを作る(browser: Browser, seedId: string, 番号: string, 正本のページ名: string, 先頭部: string[] | null): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    let layoutName: string | undefined;
    if (先頭部) {
      layoutName = rc(`F1001-${番号}レイアウト`);
      const layoutId = await レイアウトを登録する(page, { 名称: layoutName, 端末種別: "PC" });
      await 先頭部へブロックを置く(page, layoutId, 先頭部, seedId);
      issue(`PC向けのレイアウト「${layoutName}」（ID ${layoutId}）を登録し、先頭部へ「${先頭部.join("」「")}」をこの順に置いた`);
    }
    const pa = new ページ管理(page);
    const url = rc(`f1001-${番号.toLowerCase()}`);
    const id = await pa.作る({ ページ名: rc(正本のページ名), URL: url, ファイル名: rc(`f1001_${番号.toLowerCase()}`).replace(/-/g, "_"), 言語: "ja", ...(layoutName ? { PC: layoutName } : {}) });
    const 前置き = ((await pa.URLの前置き.textContent()) ?? "").replace(/\s+/g, "").trim();
    if (!/^https?:\/\//.test(前置き)) throw new Error(`${seedId}: ページ登録画面のURL欄の前置きを読めない（「${前置き}」）`);
    const 公開URL = `${前置き}${url}`;
    公開URLの表.set(正本のページ名, 公開URL);
    issue(`ページ「${rc(正本のページ名)}」（ID ${id}）を登録した。PCのレイアウトは${layoutName ? `「${layoutName}」` : "未選択（初期値のまま）"}。公開URL ${公開URL}`);
  });
}

defineSeed("S-F10-01-PAGE-005", async ({ browser }) => {
  const b = await 試験用ブロックを作る(browser, "S-F10-01-PAGE-005", "005", "marker-F1001-005", "F1001-005");
  await ページを作る(browser, "S-F10-01-PAGE-005", "005", "追加ページF1001-005", [b, 連携ブロック名]);
});
defineSeed("S-F10-01-PAGE-006", async ({ browser }) => { await ページを作る(browser, "S-F10-01-PAGE-006", "006", "追加ページF1001-006", [連携ブロック名]); });
defineSeed("S-F10-01-PAGE-013", async ({ browser }) => { await ページを作る(browser, "S-F10-01-PAGE-013", "013", "追加ページF1001-013", null); });
defineSeed("S-F10-01-PAGE-014", async ({ browser }) => { await ページを作る(browser, "S-F10-01-PAGE-014", "014", "追加ページF1001-014", [連携ブロック名]); });
defineSeed("S-F10-01-PAGE-019", async ({ browser }) => { await ページを作る(browser, "S-F10-01-PAGE-019", "019", "追加ページF1001-019", [連携ブロック名]); });
defineSeed("S-F10-01-PAGE-024", async ({ browser }) => { await ページを作る(browser, "S-F10-01-PAGE-024", "024", "追加ページF1001-024", [連携ブロック名]); });
defineSeed("S-F10-01-CBPAGE-031", async ({ browser }) => {
  const b = await 試験用ブロックを作る(browser, "S-F10-01-CBPAGE-031", "CB031", "marker-F1001-CB031", "F1001-CB031");
  await ページを作る(browser, "S-F10-01-CBPAGE-031", "CB031", "追加ページF1001-CB031", [b, 連携ブロック名]);
});

// ---------------------------------------------------------------------------
// 管理者
// ---------------------------------------------------------------------------

export const F1001_ADMIN_026: Account = { loginId: "f1001-adm-026", password: "F1001Adm0026" };
export const F1001_ADMIN_027: Account = { loginId: "f1001-adm-027", password: "F1001Adm0027" };
const 管理者の補い = "コンテンツ管理だけの権限はメンバー管理に無いので「システム管理者」で登録した。シード表のパスワードは11文字で管理者のパスワードの規則（12文字以上）に合わないので、末尾の番号を4桁にした値で登録した（ケースはパスワードの値を確かめない）";

defineSeed("S-F10-01-ADM-026", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "F10-01試験管理者026", account: F1001_ADMIN_026, メール: "f1001-adm-026@example.test" });
  reportSeedIssue("S-F10-01-ADM-026", `${管理者の補い}（${F1001_ADMIN_026.password}）`);
});
defineSeed("S-F10-01-ADM-027", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "F10-01試験管理者027", account: F1001_ADMIN_027, メール: "f1001-adm-027@example.test" });
  reportSeedIssue("S-F10-01-ADM-027", `${管理者の補い}（${F1001_ADMIN_027.password}）`);
});
