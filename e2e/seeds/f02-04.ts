/**
 * F02-04（支店のスマホ版ナビゲーション）の画面シード。正本: cases/F02-04_seed_data.tsv
 *
 * - 環境設定（S-F02-04-ENV・CD-ENV）・専用ブラウザ（S-F02-04-BROWSER-nnn・CD-BROWSER-037）: 作る操作が無い。
 *   専用ブラウザは、ケースの新しいブラウザ（画面幅390×844・ログアウト・カート0個）で代える。共有の設定は書き換えない。
 * - 店舗（BRANCH-A・BRANCH-B・CD-BRANCH-A）: 管理画面の店舗登録で登録する（店舗があれば内容を確かめて使う。pages/admin/f02_03_store.ts）。
 *   正本の外で決めたこと: 支店URLは f0204a・f0204b・f0204cda、店舗名の英語表記は半角英字とスペースだけ（アプリの入力規則）、
 *   住所は「東京都｜新宿区テスト｜1-1」「大阪府｜大阪市テスト｜2-2」に分けて登録（画面で連結して表示される文字は正本の住所と同じ）、
 *   ご当地晴れる屋くんの画像は正本がファイル名だけを定めるため e2e/fixtures/f02-04/ に色の違う小さな画像を置いた。
 * - カードセット（CARDSETS）: 管理画面のカードセット登録。名称に実行の印を付ける（依頼者決定 2026-10-28「印つきデータは何でも」）。
 * - カテゴリ（CATEGORIES）: カテゴリ登録CSVで第一階層と子を登録。名称に実行の印を付ける。
 * - 会員（MEMBER-nnn）: フロントの会員情報登録で登録し、メールのURLで本会員にする。管理画面のポイント履歴追加で保有ポイントを入れる。
 *   メールの前半に実行の印。会員ID・レコードIDは画面が振る。
 * - カート（CART-nnn）: 商品（グッズ商品）を画面で作り、在庫を入れ、新しいブラウザで支店Aの商品詳細画面から数量を入れてカートへ入れる。
 *   そのブラウザのクッキーをケースのブラウザへ移して使う（シード表の「専用ブラウザのサイトデータを消去し、商品画面から投入」と同じ作り）。
 *
 * - 検索サービスの索引に載せる商品（SEARCH-007・L-CARDSET-031・L-PRODUCT-031）: 2つのケースの商品をまとめて1つの束（seeds/unisearch_batch.ts）で作り、
 *   フィードを1回だけ送って、支店Aの商品一覧（カードセット・商品名で絞った検索）に出るまで待つ（依頼者 2026-11-11「ユニサーチのフィード連携はしてもいい」）。
 *   商品はカードセットに詳細情報を持つカードを登録 → グッズ商品CSV登録（支店の商品公開ステータス=公開）→ 商品にカードを指定 → 取り込みで作られた規格を公開
 *   （索引のカードセットは、商品に指定したカードの詳細情報のカードセットから作られる。pages/admin/unisearch_products.ts）。
 *   商品コード・商品名・カードセットの名称に実行の印を付ける。在庫10（007）は本店の在庫に入れる（カートのシードと同じ。支店Aの商品一覧に出る）。
 *   カードセットの表示用HTML（031）は、カードセット登録の画面に入力欄が無いので、この実行で作った印つきのカードセットの行にだけ DB で書く。
 *   L-ENV（ユニサーチ試験環境への接続）・L-BRANCH（テスト支店A）は、接続の設定を書き換えず、BRANCH-A と同じ支店を使う。
 */
import { Browser } from "@playwright/test";
import path from "node:path";
import { SETUP_ADMIN } from "../config/env";
import { rc, rcFixed } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { findTenantId } from "../pages/admin/tenant_k";
import { 読み替えの文, 店舗で表す, 試験支店, 店名を読む, 支店URLを読む } from "../lib/store_pick";
import { 店舗の画像と値をケースの間だけ設定する } from "../pages/admin/store_setting_restore";
import { カート商品の定義, カート用商品を作る } from "../pages/admin/f02_03_cart_setup";
import { ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { 支店のゲストカートを作る, 試験カート } from "../pages/front/f02_03_cart";
import { ensureCardset } from "../pages/admin/product_masters";
import { createByCsv, createTopByCsv } from "../pages/admin/category";
import { キャッシュを削除する } from "../pages/admin/f03_04_category";
import { BranchSpPage } from "../pages/front/f02_04_branch_sp";
import { 本会員を作る, markedMail } from "./f06-member";
import { RUN_MARK } from "../lib/run_marker";
import { 本店の在庫を入れる } from "../pages/admin/f02_02_setup";
import { 索引の商品を作る } from "../pages/admin/unisearch_products";
import { FrontProductList } from "../pages/front/f03_01_product_list";
import { 印つきのカードセットの表示用HTMLを書く } from "../db/unisearch_marked_rows";
import { 索引の束, 束の注記 } from "./unisearch_batch";

/** スマホの端末（spec の test.use と同じ値） */
export const スマホ = {
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

/**
 * 管理画面・会員登録・カートの投入は PC の画面で行う。spec の test.use（スマホの端末）は browser.newContext にも引き継がれ、
 * 管理画面がスマホの画面幅で開いて押せないことがある（F02-02 の前例）。newContext に PC の端末の印を重ねた Browser を返す。
 */
export function PC版(browser: Browser): Browser {
  const pc = {
    viewport: { width: 1280, height: 900 }, screen: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  };
  return new Proxy(browser, {
    get(target, prop) {
      if (prop === "newContext") return (o: object = {}) => target.newContext({ ...pc, ...o });
      const v = (target as unknown as Record<string | symbol, unknown>)[prop];
      return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
  });
}

export const FIXTURES = path.resolve(__dirname, "../fixtures/f02-04");
/**
 * 支店A・B・CD-A。店舗は作らない（依頼者 2026-11-15「店舗は作るのもう禁止」）。住所・電話番号・営業時間が入っている、元からある店舗（読むだけ）で表す:
 * 支店A=名古屋店（店舗ID 6）・支店B=静岡店（7）・支店CD-A=秋葉原店（8）。値は店舗のいまの登録値を読み、画面と比べる。
 * ご当地晴れる屋くんの画像（正本の画像ファイル）は、店舗の登録内容を書き換えないので上げられず、画像の同一を比べる 001 は止める。
 */
export const 支店A = 店舗で表す("6");
export const 支店B = 店舗で表す("7");
export const 支店CDA = 店舗で表す("8");
/** 空白を除いて比べる（画面は改行・空白を整えて出すことがある） */
export const 空白なし = (t: string): string => t.replace(/\s+/g, "");
async function 店舗を確かめる(page: import("@playwright/test").Page, v: 試験支店, 正本の店名: string, issue: (m: string) => void): Promise<string> {
  const id = await findTenantId(page, v.店名);
  if (id !== v.id) throw new Error(`店舗ID ${v.id} が店舗一覧に無い（店名「${v.店名}」で探して ${id ?? "なし"}）`);
  issue(読み替えの文(正本の店名, { id, 店名: v.店名 }, "住所・電話番号・営業時間は店舗の登録値を読んで画面と比べる。ご当地晴れる屋くんの画像は正本の画像ファイルを上げない"));
  return id;
}

/**
 * 画面が振った番号（店舗ID・カードセットID・会員ID）。シード表はこれらを「控える」と定めていない（呼び名〔…〕が無い）ので、
 * 控えた番号（notes）に入れると基盤が「シード表に無い呼び名を控えた」で止める。同じ実行の中だけ、ここに持つ。
 */
export const 番号 = new Map<string, string>();

defineSeed("S-F02-04-ENV", async () => { /* 環境。共有の設定は書き換えない。最初の手順の画面が確かめる */ });
defineSeed("S-F02-04-CD-ENV", async () => { /* 同上 */ });
/** 専用ブラウザ。ケースの新しいブラウザ（画面幅390×844・ログアウト・カート0個）で代える */
const defineBrowserSeed = (seedId: string): void => defineSeed(seedId, async () => { /* 作る操作が無い */ });
defineBrowserSeed("S-F02-04-BROWSER-001");
defineBrowserSeed("S-F02-04-BROWSER-002");
defineBrowserSeed("S-F02-04-BROWSER-003");
defineBrowserSeed("S-F02-04-BROWSER-004");
defineBrowserSeed("S-F02-04-BROWSER-005");
defineBrowserSeed("S-F02-04-BROWSER-008");
defineBrowserSeed("S-F02-04-BROWSER-009");
defineBrowserSeed("S-F02-04-BROWSER-013");
defineBrowserSeed("S-F02-04-BROWSER-014");
defineBrowserSeed("S-F02-04-BROWSER-015");
defineBrowserSeed("S-F02-04-BROWSER-016");
defineBrowserSeed("S-F02-04-BROWSER-017");
defineBrowserSeed("S-F02-04-BROWSER-018");
defineBrowserSeed("S-F02-04-BROWSER-019");
defineBrowserSeed("S-F02-04-BROWSER-020");
defineBrowserSeed("S-F02-04-BROWSER-021");
defineBrowserSeed("S-F02-04-BROWSER-022");
defineBrowserSeed("S-F02-04-BROWSER-023");
defineBrowserSeed("S-F02-04-BROWSER-025");
defineBrowserSeed("S-F02-04-BROWSER-007");
defineBrowserSeed("S-F02-04-BROWSER-032");
defineBrowserSeed("S-F02-04-BROWSER-033");
defineBrowserSeed("S-F02-04-BROWSER-036");
defineSeed("S-F02-04-CD-BROWSER-037", async () => { /* 同上 */ });

// ---- 店舗 ----
defineSeed("S-F02-04-BRANCH-A", async ({ browser, notes, seed }) => {
  await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    番号.set("〔店舗ID-F0204-A〕", await 店舗を確かめる(page, 支店A, "テスト支店A", (m) => reportSeedIssue(seed.シードID, m)));
  });
});
defineSeed("S-F02-04-BRANCH-B", async ({ browser, notes, seed }) => {
  await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    番号.set("〔店舗ID-F0204-B〕", await 店舗を確かめる(page, 支店B, "テスト支店B", (m) => reportSeedIssue(seed.シードID, m)));
  });
});
defineSeed("S-F02-04-CD-BRANCH-A", async ({ browser, notes, seed }) => {
  await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    番号.set("〔店舗ID-F0204-CDA〕", await 店舗を確かめる(page, 支店CDA, "テスト支店CD-A", (m) => reportSeedIssue(seed.シードID, m)));
  });
});

// ---- カードセット ----
export const カードセット名 = (正本の名前: string): string => rc(正本の名前);

defineSeed("S-F02-04-CARDSETS", { needs: ["S-F02-04-BRANCH-A"] }, async ({ browser, seed, notes }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 組 = [["テストセットA", "F0204-SET-A"], ["テストセットB", "F0204-SET-B"]] as const;
  await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const [名前, コード] of 組) {
      番号.set(`〔カードセットID-F0204-${名前.slice(-1)}〕`, await ensureCardset(page, カードセット名(名前), カードセット名(名前), rc(コード), issue));
    }
  });
  issue("カードセットは、管理画面のカードセット登録で名称・略称に実行の印を付けて登録した（リリース日は登録当日）。支店サイトの表示対象にする設定は画面に無いので、登録したカードセットが支店Aのカードセット選択メニューに出ることで確かめた");
  const ctx = await PC版(browser).newContext({ ignoreHTTPSErrors: true, ...スマホ });
  try {
    const nav = new BranchSpPage(await ctx.newPage());
    await nav.支店トップを開く(支店A.支店URL);
    await nav.押す(nav.カードセット選択メニュー(), "カードセット選択メニュー");
    const 出ている = await nav.選択肢に出ているカードセット();
    for (const [名前] of 組) {
      if (!出ている.includes(カードセット名(名前))) throw new Error(`登録したカードセット「${カードセット名(名前)}」が、支店Aのカードセット選択メニューに出ない`);
    }
  } finally { await ctx.close(); }
});

// ---- カテゴリ ----
export const カテゴリ名 = (正本の名前: string): string => rc(正本の名前);

defineSeed("S-F02-04-CATEGORIES", { needs: ["S-F02-04-BRANCH-A"] }, async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 親 = カテゴリ名("テストカテゴリA"), 子 = カテゴリ名("テストカテゴリA-1");
  await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 親ID = await createTopByCsv(page, { nameJp: 親, nameEn: "F0204 Test Category A", frontHide: "0", branchHide: "0" }, `f0204-cat-a-${Date.now()}.csv`, issue);
    await createByCsv(page, { nameJp: 子, nameEn: "F0204 Test Category A-1", parentId: 親ID, frontHide: "0", branchHide: "0" }, `f0204-cat-a1-${Date.now()}.csv`, issue);
  });
  issue("カテゴリは、カテゴリ登録CSVで第一階層と子を登録した（フロント非表示フラグ0・支店非表示フラグ0）。名称に実行の印を付けた");
  // カテゴリの表示はキャッシュされることがあるので、支店Aのカテゴリモーダルに出ないときだけキャッシュを削除する
  const 見える = async (): Promise<boolean> => {
    const ctx = await PC版(browser).newContext({ ignoreHTTPSErrors: true, ...スマホ });
    try {
      const nav = new BranchSpPage(await ctx.newPage());
      await nav.支店トップを開く(支店A.支店URL);
      await nav.カテゴリモーダルを開く();
      return await nav.カテゴリモーダルに出るまで待つ(親, 15_000);
    } finally { await ctx.close(); }
  };
  if (!(await 見える())) {
    await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await キャッシュを削除する(page, seed.シードID, issue); });
    issue("登録したカテゴリが支店Aのカテゴリモーダルにすぐ出なかったので、管理画面のキャッシュ管理でキャッシュを削除した");
    if (!(await 見える())) issue("キャッシュを削除しても、登録したカテゴリが支店Aのカテゴリモーダルに出なかった（ケースで確かめる）");
  }
});

// ---- 会員 ----
export const 会員 = (n: string) => ({ メール: () => markedMail(`f0204-member-${n}`), パスワード: `F0204PASS${n}` });
export const 会員036 = { メール: () => markedMail("dpf0204-036"), パスワード: "Passw0rd-F0204036" };

function defineMemberSeed(seedId: string, n: string): void {
  defineSeed(seedId, { needs: ["S-F02-04-BRANCH-A"] }, async ({ browser, notes }) => {
    const pc = PC版(browser);
    const id = await 本会員を作る(pc, { 姓: "F0204試験", 名: "会員", セイ: "シケン", メイ: "カイイン", 前半: `f0204-member-${n}`, パスワード: 会員(n).パスワード });
    番号.set(`〔会員ID-F0204-${n}〕`, id);
    await withAdminSession(pc, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, id, 1234); });
  });
}
defineMemberSeed("S-F02-04-MEMBER-013", "013");
defineMemberSeed("S-F02-04-MEMBER-014", "014");
defineMemberSeed("S-F02-04-MEMBER-018", "018");
defineMemberSeed("S-F02-04-MEMBER-019", "019");
defineMemberSeed("S-F02-04-MEMBER-020", "020");
defineSeed("S-F02-04-MEMBER-036", { needs: ["S-F02-04-BRANCH-A"] }, async ({ browser, notes }) => {
  // 保有ポイント0: ポイントは付与しない
  番号.set("〔会員ID-F0204-036〕", await 本会員を作る(PC版(browser), { 姓: "F0204試験", 名: "ゼロ", セイ: "シケン", メイ: "ゼロ", 前半: "dpf0204-036", パスワード: 会員036.パスワード }));
});

// ---- カート ----
/** カートのシードが作ったブラウザの状態（シードID → クッキー）。ケースは自分のブラウザへクッキーを移す */
export const カートのブラウザたち = new Map<string, 試験カート>();

type カートの商品 = { 定義: Omit<カート商品の定義, "商品コード"> & { コード: string }; 数量: number };

/**
 * 支店Aの在庫を入れる管理者（支店Aだけを編集できる。承認は別の管理者）。決まった印で1度だけ作って使い回す。
 * 支店の商品詳細は、その支店の在庫を見て数量の欄を出す（本店にだけ在庫を入れると、支店Aの商品詳細に数量の欄が出ず、カートへ入れられない）。
 * 在庫を承認できるのは、在庫の店舗（支店A）を編集できる管理者だけ（F02-03 の前例）。共有の管理者の編集可能店舗は書き換えない。
 */
const 支店A在庫登録者: Account = { loginId: `${rcFixed("f0204_branch_stock")}${支店A.id}`.toLowerCase(), password: "Passw0rd!F0204BS" };
const 支店A在庫承認者: Account = { loginId: `${rcFixed("f0204_branch_appr")}${支店A.id}`.toLowerCase(), password: "Passw0rd!F0204BA" };
async function 支店A在庫登録者を用意する(page: import("@playwright/test").Page): Promise<void> {
  await ensureMember(page, {
    名前: rcFixed("F02-04支店A在庫登録者"), 所属店舗: 支店A.店名, ログインID: 支店A在庫登録者.loginId, メールアドレス: `${支店A在庫登録者.loginId}@example.test`,
    パスワード: 支店A在庫登録者.password, 権限: "システム管理者", デフォルト検索表示店舗: 支店A.店名, 編集可能店舗: [支店A.店名],
  });
  await ensureMember(page, {
    名前: rcFixed("F02-04支店A在庫承認者"), 所属店舗: 支店A.店名, ログインID: 支店A在庫承認者.loginId, メールアドレス: `${支店A在庫承認者.loginId}@example.test`,
    パスワード: 支店A在庫承認者.password, 権限: "システム管理者", デフォルト検索表示店舗: 支店A.店名, 編集可能店舗: [支店A.店名],
  });
}

function defineCartSeed(seedId: string, items: カートの商品[]): void {
  defineSeed(seedId, { needs: ["S-F02-04-BRANCH-A"] }, async ({ browser }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const pc = PC版(browser);
    const made = await カート用商品を作る(pc, seedId, items.map((i) => ({ ...i.定義, 商品コード: rc(i.定義.コード) })), issue,
      { 店舗ID: 支店A.id, 登録者: 支店A在庫登録者, 登録者を用意する: 支店A在庫登録者を用意する, 承認者: 支店A在庫承認者 });
    issue(`在庫数は、カートへ入れる支店A（${支店A.店名}・店舗ID ${支店A.id}）に入れた（シード表は在庫の店舗を決めていない。支店の商品詳細は、その支店の在庫で数量の欄を出す。本店に入れると支店Aの商品詳細は在庫0で数量の欄が出ない）。在庫編集の登録は ${支店A在庫登録者.loginId}、承認は ${支店A在庫承認者.loginId}（どちらも支店Aだけを編集できる E2E の管理者）`);
    const cart = await 支店のゲストカートを作る(pc, seedId, 支店A.支店URL, items.map((i, k) => ({ 商品ID: made[k].商品ID, 数量: i.数量 })));
    const 合計 = items.reduce((a, i) => a + i.数量, 0);
    if (cart.商品数 !== 合計) throw new Error(`${seedId}: カートへ入れたあとの支店トップのカートの商品数が ${cart.商品数}（${合計} のはず）`);
    issue(`支店Aのカートへ${items.map((i) => `「${i.定義.商品名}」${i.数量}個`).join("・")}を入れた順に入れ、カートの商品数が ${合計} になったことを確かめた。このブラウザの状態（クッキー）をケースのブラウザへ移して使う`);
    issue("商品はグッズ商品CSV登録で作り（商品コードに実行の印）、商品登録編集で規格を公開にし、支店Aに在庫10を入庫・承認した。支店Aの商品としてフロントの画面に出る");
    カートのブラウザたち.set(seedId, cart);
  });
}
const 商品 = (コード: string, 商品名: string): カートの商品["定義"] => ({ コード, 商品名, 価格: "1000", 在庫: 10 });

defineCartSeed("S-F02-04-CART-010", [
  { 定義: 商品("F0204CART010A", "カート商品甲010"), 数量: 2 },
  { 定義: 商品("F0204CART010B", "カート商品乙010"), 数量: 1 },
]);
defineCartSeed("S-F02-04-CART-011", [
  { 定義: 商品("F0204CART011A", "カート商品甲011"), 数量: 2 },
  { 定義: 商品("F0204CART011B", "カート商品乙011"), 数量: 1 },
]);
defineCartSeed("S-F02-04-CART-012", [
  { 定義: 商品("F0204CART012A", "カート商品甲012"), 数量: 2 },
  { 定義: 商品("F0204CART012B", "カート商品乙012"), 数量: 1 },
]);
defineCartSeed("S-F02-04-CART-035", [{ 定義: 商品("F0204-CART-035A", "カート商品-035"), 数量: 1 }]);

// ---- 検索サービスの索引に載せる商品（SEARCH-007・L-CARDSET-031・L-PRODUCT-031） ----

/** 007 の商品（正本の商品名 → 実行の印つきの商品名） */
export const 検索の商品名 = { A: rc("支店検索対象商品-007"), B: rc("別セット検索対象商品-007"), C: rc("キーワード対象外商品-007") };
/** 031 のカードセット・商品・表示用HTML */
export const 連携の値 = { カードセット名: rc("連携支店セット001"), 商品名: rc("連携支店商品001"), 表示用HTML: "LINK-SP-BANNER-001" };

export type F0204索引の商品 = {
  カードセットA: string; カードセットB: string; カードセット031: string;
  商品A: string; 商品B: string; 商品C: string; 商品031: string;
  注記: string[];
};

const 索引の束F0204 = new 索引の束<F0204索引の商品>("F02-04（支店のスマホ版ナビゲーションの検索）", async (browser) => {
  const 注記: string[] = [];
  const issue = (m: string) => 注記.push(m);
  const pc = PC版(browser);
  const lines = [
    { key: "商品A", code: rc("F0204-SEARCH-A-007"), nameJp: 検索の商品名.A, nameEn: 検索の商品名.A, set: "A", 価格: "1000" },
    { key: "商品B", code: rc("F0204-SEARCH-B-007"), nameJp: 検索の商品名.B, nameEn: 検索の商品名.B, set: "B", 価格: "1000" },
    { key: "商品C", code: rc("F0204-SEARCH-C-007"), nameJp: 検索の商品名.C, nameEn: 検索の商品名.C, set: "A", 価格: "1000" },
    { key: "商品031", code: rc("F0204-L-PRODUCT-031"), nameJp: 連携の値.商品名, nameEn: `F0204 Linked Branch Product 001 ${RUN_MARK}`, set: "031", 価格: "1000" },
  ] as const;
  const out: Partial<F0204索引の商品> = { 注記 };
  await withAdminSession(pc, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 店舗を確かめる(page, 支店A, "テスト支店A", issue);
    const sets: Record<string, string> = {
      A: await ensureCardset(page, カードセット名("テストセットA"), カードセット名("テストセットA"), rc("F0204-SET-A"), issue),
      B: await ensureCardset(page, カードセット名("テストセットB"), カードセット名("テストセットB"), rc("F0204-SET-B"), issue),
      "031": await ensureCardset(page, 連携の値.カードセット名, 連携の値.カードセット名, rc("F0204-L-SET-031"), issue),
    };
    out.カードセットA = sets.A; out.カードセットB = sets.B; out.カードセット031 = sets["031"];
    番号.set("〔カードセットID-F0204-A〕", sets.A);
    番号.set("〔カードセットID-F0204-B〕", sets.B);
    const n = 印つきのカードセットの表示用HTMLを書く(sets["031"], 連携の値.表示用HTML, `S-F02-04-L-CARDSET-031: カードセット「${連携の値.カードセット名}」の表示用HTML`);
    if (n !== 1) throw new Error(`カードセット「${連携の値.カードセット名}」の表示用HTMLを書いた行が ${n} 行（1行のはず）`);
    issue(`カードセット「${連携の値.カードセット名}」（ID ${sets["031"]}）の表示用HTML（フリーエリア(日)）に「${連携の値.表示用HTML}」を DB で書いた（カードセット登録の画面に入力欄が無い。この実行で作った印つきの行だけ）`);
    // 索引のカードセットは、商品に指定したカードの詳細情報のカードセットから作られる（商品登録編集のカードセットの欄は索引に使われない）。
    // そのため、カードセットに詳細情報を持つカードを登録し、取り込んだ商品にカードを指定する
    const made = await 索引の商品を作る(page, lines.map((l) => ({
      記号: l.key, 商品コード: l.code, 商品名: l.nameJp, 基準価格: l.価格, 販売価格: l.価格, 買取価格: "100", カードセットID: sets[l.set],
    })), "F02-04 の検索の商品", `f0204-search-${RUN_MARK}.csv`, issue,
    // シード表（S-F02-04-L-PRODUCT-031）は商品カテゴリ(ID)をサプライ・グッズのカテゴリIDと定める。既定の「単体カード配下」（開発環境ではセットの下の「シングルカード」）は
    // グッズ商品CSV登録が受け付ける範囲の外で、取込が「商品カテゴリ(ID)の値が異常です」で止まる（F02-02 の 004〜008・062 と同じ原因。2026-11-14 の見直し）
    { カードのカテゴリ: "サプライ・グッズ" });
    for (const m of made) (out as Record<string, unknown>)[m.記号] = m.商品ID;
    issue("商品は、カードセットに詳細情報を持つカードを登録し、グッズ商品CSV登録で取り込んだ商品にカードを指定して作った（検索サービスの索引のカードセットは、指定したカードの詳細情報のカードセットから作られるため。正本の「商品をカードセットに紐付ける」の作り方）");
  });
  await 本店の在庫を入れる(pc, "F02-04 の検索の商品（007）", lines.filter((l) => l.set !== "031").map((l) => l.code), 10, issue);
  issue(`007 の3商品は、本店の在庫に10を入れて承認した（正本の「テスト支店Aの在庫10」。カートのシードと同じく本店の在庫で、支店Aの商品一覧に出る）`);
  return out as F0204索引の商品;
}, async (ctx, r) => {
  const list = new FrontProductList(await ctx.newPage());
  const 店 = `/ja/${支店A.支店URL}`;
  const ids = async (q: string): Promise<string[]> => {
    await list.open(店, `/products/search?${q}`);
    await list.結果を待つ().catch(() => undefined);
    return (await list.カードを読む()).map((c) => c.商品ID);
  };
  const a = await ids(`cardset=${r.カードセットA}`);
  const b = await ids(`cardset=${r.カードセットB}`);
  const l = await ids(`cardset=${r.カードセット031}&product=${encodeURIComponent(連携の値.商品名)}`);
  const ok = a.includes(r.商品A) && a.includes(r.商品C) && b.includes(r.商品B) && l.includes(r.商品031);
  return { ok, 様子: `支店Aの商品一覧: テストセットA → ${a.join(",") || "なし"}／テストセットB → ${b.join(",") || "なし"}／連携支店セット001＋商品名 → ${l.join(",") || "なし"}` };
});

/** 束を用意し、注記をそのシードの報告に出す */
async function 索引の商品を用意する(browser: Browser, seedId: string): Promise<F0204索引の商品> {
  const r = await 索引の束F0204.用意する(PC版(browser), PC版(browser));
  reportSeedIssue(seedId, 束の注記("F02-04（007・031）"));
  for (const m of r.注記) reportSeedIssue(seedId, m);
  return r;
}
let 索引の商品の値: F0204索引の商品 | null = null;
/** 束が作った商品・カードセットの番号（ケースで使う） */
export function 索引の商品(): F0204索引の商品 {
  if (!索引の商品の値) throw new Error("検索サービスの索引に載せる商品のシードをまだ作っていない");
  return 索引の商品の値;
}

defineSeed("S-F02-04-SEARCH-007", { needs: ["S-F02-04-BRANCH-A", "S-F02-04-CARDSETS"] }, async ({ browser, seed }) => {
  索引の商品の値 = await 索引の商品を用意する(browser, seed.シードID);
});
defineSeed("S-F02-04-L-ENV", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "検索サービス（ユニサーチ）の接続の設定は書き換えない（共有の設定）。支店Aの商品一覧に、フィードで送った商品が出ることを L-PRODUCT-031 が確かめる");
});
defineSeed("S-F02-04-L-BRANCH", async ({ browser, seed }) => {
  await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    番号.set("〔店舗ID-F0204-A〕", await 店舗を確かめる(page, 支店A, "テスト支店A", (m) => reportSeedIssue(seed.シードID, m)));
  });
  reportSeedIssue(seed.シードID, "連携試験用のテスト支店Aは、BRANCH-A と同じ店舗（店舗ID 6）を使う");
});
defineSeed("S-F02-04-L-CARDSET-031", { needs: ["S-F02-04-L-BRANCH"] }, async ({ browser, seed }) => {
  索引の商品の値 = await 索引の商品を用意する(browser, seed.シードID);
});
defineSeed("S-F02-04-L-PRODUCT-031", { needs: ["S-F02-04-L-CARDSET-031"] }, async ({ browser, seed }) => {
  索引の商品の値 = await 索引の商品を用意する(browser, seed.シードID);
});

/**
 * 001 用: 支店A・Bに、正本の画像・郵便番号・住所・電話番号・営業時間を、E2E の店舗（A=4973・B=5006）へケースの間だけ設定し、終わりに元へ戻す（依頼者 2026-11-15）。
 * 書き換えるので 001 は solo_cases.tsv の一人で流す回で流す。
 */
export type 画像の支店 = { 店名: string; 支店URL: string; 郵便番号: string; 都道府県: string; 住所1: string; 住所2: string; 電話番号: string; 営業時間: string };
export async function 画像の支店を用意する(browser: Browser): Promise<{ A: 画像の支店; B: 画像の支店 }> {
  const 定め = {
    A: { id: "4973", 画像: "branch-a-hareruya.png", 郵便番号: "160-0022", 都道府県: "東京都", 住所1: "新宿区テスト", 住所2: "1-1", 電話番号: "03-1111-2222", 営業時間: "10:00-20:00" },
    B: { id: "5006", 画像: "branch-b-hareruya.png", 郵便番号: "530-0001", 都道府県: "大阪府", 住所1: "大阪市テスト", 住所2: "2-2", 電話番号: "06-3333-4444", 営業時間: "11:00-19:00" },
  } as const;
  await withAdminSession(PC版(browser), SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue("S-F02-04-BRANCH-A", m);
    for (const d of [定め.A, 定め.B]) {
      await 店舗の画像と値をケースの間だけ設定する(page, d.id, path.join(FIXTURES, d.画像), {
        郵便番号: d.郵便番号.replace("-", ""), 都道府県: d.都道府県, 住所: d.住所1, 番地: d.住所2, 電話番号: d.電話番号.replace(/-/g, ""), 店舗営業時間: d.営業時間,
      }, `店舗ID ${d.id} の画像と店舗情報`, issue);
    }
  });
  const 作る = (d: (typeof 定め)["A"] | (typeof 定め)["B"]): 画像の支店 => ({ 店名: 店名を読む(d.id), 支店URL: 支店URLを読む(d.id), 郵便番号: d.郵便番号, 都道府県: d.都道府県, 住所1: d.住所1, 住所2: d.住所2, 電話番号: d.電話番号, 営業時間: d.営業時間 });
  return { A: 作る(定め.A), B: 作る(定め.B) };
}
