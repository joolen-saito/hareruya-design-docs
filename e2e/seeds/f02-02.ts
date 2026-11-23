/**
 * F02-02 本店のスマホ版ナビゲーションの画面シード。正本: cases/F02-02_seed_data.tsv
 *
 * - S-F02-02-ENV（環境）: 作る操作が無い。シード表は、共有の開発環境では本店の基本設定・ページ管理・ユニサーチの接続設定を書き換えず、
 *   環境の値を使うと定めるので、何も書き換えない（最初の手順の画面が、各画面を開けることを確かめる）。
 * - S-F02-02-CARDSETS-002・003: 管理画面のカードセット詳細（登録）で2件ずつ登録し、URL の末尾のカードセットIDを控える
 *   （pages/admin/product_masters.ts の ensureCardset。リリース日は登録当日）。カードセット名・略称に実行の印を付ける（依頼者決定 2026-10-28。
 *   ケースはカードセット名の書式を確かめない）。登録後、スマホ表示の本店ECTOPのカードセット選択メニューに2件とも出ることを確かめる。
 * - S-F02-02-CBMEMBER-070: フロントの会員登録で登録し、本登録のメールのURLを開いて本会員にする（依頼者決定 2026-10-31。シード表の
 *   「管理画面で本会員にする」の代わりに本登録のメールで本会員にする。どちらも本会員になる）。メールの前半に実行の印。
 *   そのあとログインしてお気に入り商品一覧が0件であることを確かめ、ログアウトする。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, hideDebugToolbar, loginAdmin } from "../lib/session";
import { ensureCardset } from "../pages/admin/product_masters";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { フロントにログインする } from "../pages/front/login_without_top";
import { SpNavPage } from "../pages/front/f02_02_sp_nav";
import { markedMail, 本会員を作る } from "./f06-member";
import { 在庫を増減して承認する } from "../pages/admin/f02_02_stock_local";
import { フィードを送って反映を待つ } from "../pages/admin/unisearch_feed";
import { 索引の商品を作る } from "../pages/admin/unisearch_products";
import { CategoryPage, createTopByCsv } from "../pages/admin/category";
import { キャッシュを削除する } from "../pages/admin/f03_04_category";
import { カードセットの表示用HTMLを設定する } from "../db/f02_02_write";

/** スマホの端末（spec の test.use と同じ値。シードの中で別に開くブラウザにも使う） */
export const スマホ = {
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

defineSeed("S-F02-02-ENV", async () => { /* 環境。共有の開発環境では書き換えない（シード表）。最初の手順の画面が確かめる */ });

/** カードセットの名前（正本の値に実行の印） */
export const カードセット名 = (正本の名前: string): string => rc(正本の名前);

/**
 * 管理画面を PC の画面で開いて操作する。spec の test.use（スマホの端末）はテストの中で作るブラウザにも引き継がれ、
 * 管理画面がスマホの画面幅で開いて「登録」ボタンが押せなかった（2026-11-10 の開発環境の流し）。管理画面は PC の画面・端末の印で開く。
 */
async function PCの管理画面で<T>(browser: Browser, account: Account, fn: (page: import("@playwright/test").Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({
    baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    await loginAdmin(page, account);
    return await fn(page);
  } finally { await context.close(); }
}

async function スマホで開いて選択肢を読む(browser: Browser): Promise<string[]> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, ...スマホ });
  try {
    await hideDebugToolbar(ctx);
    const nav = new SpNavPage(await ctx.newPage());
    await nav.トップを開く("ja");
    await nav.押す(nav.カードセット選択メニュー(), "カードセット選択メニュー");
    return await nav.選択肢に出ているカードセット();
  } finally { await ctx.close(); }
}

for (const n of ["002", "003"]) {
  const seedId = `S-F02-02-CARDSETS-${n}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 組 = [["A", `テストセットA-${n}-F0202`, `SET-A-${n}-F0202`], ["B", `テストセットB-${n}-F0202`, `SET-B-${n}-F0202`]] as const;
    await PCの管理画面で(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      for (const [k, 名前, 略称] of 組) {
        const id = await ensureCardset(page, カードセット名(名前), カードセット名(名前), rc(略称), issue);
        notes.set(`〔カードセットID-F0202-${n}${k}〕`, id);
      }
    });
    const 出ている = await スマホで開いて選択肢を読む(browser);
    for (const [, 名前] of 組) {
      if (!出ている.includes(カードセット名(名前))) throw new Error(`登録したカードセット「${カードセット名(名前)}」が、本店ECTOPのカードセット選択メニューに出ない`);
    }
  });
}

defineSeed("S-F02-02-CBMEMBER-070", async ({ browser }) => {
  const m = { 姓: "お気に入り0件会員", 名: "F0202-CB070", セイ: "オキニイリ", メイ: "ゼロケン", 前半: "cbf0202-070", パスワード: "Passw0rd-CBF0202070" };
  await 本会員を作る(browser, m);
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const fav = new FrontFavorite(await ctx.newPage());
    // ログイン後のトップ（/ja/）の表示は待たない（開発環境のトップは重く、ときに 504。pages/front/login_without_top.ts）
    await フロントにログインする(fav.page, { メール: markedMail(m.前半), パスワード: m.パスワード });
    await fav.openFavoriteList();
    const n = await fav.一覧のカード.count();
    if (n !== 0) throw new Error(`会員 ${markedMail(m.前半)} のお気に入り商品一覧に ${n} 件ある（0件のはず）`);
    await fav.logout();
  } finally { await ctx.close(); }
});

// =====================================================================================
// 004〜008・036〜039・062（2026-11-12 追加）
// - 商品（PRODUCTS-004〜008・L-PRODUCT-062）: 本店の商品検索・候補は検索サービス（ユニサーチ）の索引から描かれ、索引の「カードセット」は
//   商品に指定したカードの詳細情報のカードセットから作られる（pages/admin/unisearch_products.ts）。そのため、シード表の
//   「グッズ商品CSVのカードセット(ID)」の代わりに、カードセットの詳細情報を持つカードを登録して商品に指定する形（索引の商品を作る）で作る。
//   在庫10は、在庫編集（入庫/その他・10）とその承認で入れる。索引への反映は、商品管理「ユニサーチフィード作成」でフィードを送り、
//   本店の商品一覧に出るまで待つ（依頼者の許可 2026-11-11 夜）。商品コード・商品名・カードセット名には実行の印を付ける。
// - カテゴリ（CATEGORIES-036〜039）: カテゴリ登録CSVで第一階層2件、カテゴリ登録画面で子カテゴリ1件を作り、キャッシュ削除を押す。
//   シード表の「カテゴリ識別子は DB へ直接設定」は、アプリのカテゴリにその項目が無い（カテゴリの表の列に無い）ので設定しない。
//   ケースは識別子を使わない。
// - 062 のカードセットの表示用HTML: 画面で指定できないので、この実行で作った印つきのカードセットの「フリーエリア(日)」に DB で設定する（db/f02_02_write.ts）。
// =====================================================================================

type 商品の材料 = { 記号: string; 商品コード: string; 商品名: string; カードセットID: string };

/** 商品を索引の形で作り、在庫10を入れ、（索引に載せるなら）フィードを送って本店の商品一覧に出るまで待つ。商品IDを記号ごとに返す */
async function 試験商品を作る(browser: Browser, seedId: string, defs: 商品の材料[], 索引に載せる: boolean): Promise<Map<string, string>> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const made = await PCの管理画面で(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return 索引の商品を作る(page, defs.map((d) => ({
      記号: d.記号, 商品コード: rc(d.商品コード), 商品名: rc(d.商品名), 基準価格: "100", 販売価格: "100", 買取価格: "10", カードセットID: d.カードセットID,
    })), seedId, `${seedId.toLowerCase()}-${Date.now()}.csv`, issue,
    // シード表は商品カテゴリ(ID)をサプライ・グッズのカテゴリIDと定める。既定の「単体カード配下」（開発環境ではセットの下の「シングルカード」）は
    // グッズ商品CSV登録が受け付ける範囲の外で、取込が「商品カテゴリ(ID)の値が異常です」で止まった（2026-11-14 の 004〜008・062。F05-01 と同じ原因）
    { カードのカテゴリ: "サプライ・グッズ" });
  });
  await 在庫を増減して承認する(browser, seedId, made.map((m) => ({ 商品コード: m.商品コード, 数: 10, 区分: "入庫/その他" as const, 承認後の在庫: 10 })), issue);
  issue(`商品 ${made.map((m) => `${m.商品名}（${m.商品コード}・商品ID ${m.商品ID}）`).join("、")} を、カードセットの詳細情報を持つカードを指定して作り、在庫10を入れた（在庫編集とその承認）`);
  if (索引に載せる) {
    await フィードを送って反映を待つ(browser, async (ctx) => {
      const page = await ctx.newPage();
      const 様子: string[] = [];
      let ok = true;
      for (const m of made) {
        await page.goto(`${BASE_URL}/ja/products/search?product=${encodeURIComponent(m.商品名)}`, { timeout: 60_000 });
        await page.waitForLoadState("load");
        const k = await page.locator(".p-hareruya-product-card").filter({ hasText: m.商品名 }).count();
        if (k === 0) ok = false;
        様子.push(`${m.商品名}: ${k}件`);
      }
      return { ok, 様子: 様子.join("／") };
    }, `${seedId} の商品の本店の商品検索への反映`);
    issue("商品管理「ユニサーチフィード作成」でフィードを送り、本店の商品検索に全部の商品が出るまで待った");
  }
  return new Map(made.map((m) => [m.記号, m.商品ID]));
}

async function カードセットを作る(browser: Browser, seedId: string, 組: [string, string][]): Promise<string[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  return PCの管理画面で(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const ids: string[] = [];
    for (const [名前, 略称] of 組) ids.push(await ensureCardset(page, カードセット名(名前), カードセット名(名前), rc(略称), issue));
    return ids;
  });
}

defineSeed("S-F02-02-CARDSETS-004", async ({ browser, notes }) => {
  const [a, b] = await カードセットを作る(browser, "S-F02-02-CARDSETS-004", [["テストセットA-004-F0202", "SET-A-004-F0202"], ["テストセットB-004-F0202", "SET-B-004-F0202"]]);
  notes.set("〔カードセットID-F0202-004A〕", a);
  notes.set("〔カードセットID-F0202-004B〕", b);
  const 出ている = await スマホで開いて選択肢を読む(browser);
  for (const n of ["テストセットA-004-F0202", "テストセットB-004-F0202"]) {
    if (!出ている.includes(カードセット名(n))) throw new Error(`登録したカードセット「${カードセット名(n)}」が、本店ECTOPのカードセット選択メニューに出ない`);
  }
});

defineSeed("S-F02-02-PRODUCTS-004", { needs: ["S-F02-02-CARDSETS-004"] }, async ({ browser, notes }) => {
  const A = notes.get("〔カードセットID-F0202-004A〕"), B = notes.get("〔カードセットID-F0202-004B〕");
  const ids = await 試験商品を作る(browser, "S-F02-02-PRODUCTS-004", [
    { 記号: "A", 商品コード: "F0202-P-004-1", 商品名: "火の試験カード-004", カードセットID: A },
    { 記号: "B", 商品コード: "F0202-P-004-2", 商品名: "火の別セットカード-004", カードセットID: B },
    { 記号: "C", 商品コード: "F0202-P-004-3", 商品名: "水の試験カード-004", カードセットID: A },
  ], true);
  for (const k of ["A", "B", "C"]) notes.set(`〔商品ID-F0202-004${k}〕`, ids.get(k)!);
});

for (const n of ["005", "006", "007", "008"]) {
  defineSeed(`S-F02-02-PRODUCTS-${n}`, async ({ browser, notes }) => {
    const seedId = `S-F02-02-PRODUCTS-${n}`;
    const [set] = await カードセットを作る(browser, seedId, [[`SET-A-${n}`, `SET-A-${n}`]]);
    notes.set(`〔カードセットID-F0202-${n}〕`, set);
    const ids = await 試験商品を作る(browser, seedId, [{ 記号: "A", 商品コード: `F0202-P-${n}-1`, 商品名: `火の試験カード-${n}`, カードセットID: set }], n !== "006");
    notes.set(`〔商品ID-F0202-${n}〕`, ids.get("A")!);
    if (n === "006") reportSeedIssue(seedId, "006 はシード表が索引への反映を定めないので、フィードは送らない");
  });
}

/** 008: 本店トップのナビの検索欄に「火」を入れ、候補リストの商品名サジェストに商品が出るまで入れ直して確かめる（最大15分） */
defineSeed("S-F02-02-UNISUGGEST-008", { needs: ["S-F02-02-PRODUCTS-008"] }, async ({ browser }) => {
  const name = rc("火の試験カード-008");
  const deadline = Date.now() + 15 * 60_000;
  let last: string[] = [];
  for (;;) {
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true, ...スマホ });
    try {
      await hideDebugToolbar(ctx);
      const nav = new SpNavPage(await ctx.newPage());
      await nav.トップを開く("ja");
      await nav.検索欄に入れる("火");
      for (let i = 0; i < 20; i++) {
        last = await nav.候補の文();
        if (last.some((t) => t.includes(name))) {
          reportSeedIssue("S-F02-02-UNISUGGEST-008", `フィードを送ったあと、ナビの検索欄に「火」を入れると候補リストの商品名サジェストに「${name}」が出ることを確かめた`);
          return;
        }
        await nav.page.waitForTimeout(500);
      }
    } finally { await ctx.close(); }
    if (Date.now() > deadline) throw new Error(`ナビの検索欄に「火」を入れても、候補リストに「${name}」が15分出ない（最後の候補: ${last.slice(0, 16).join(" / ") || "なし"}）。検索サービスの候補は件数が16件に限られ、既存の商品が先に並ぶと出ない`);
    await new Promise((r) => setTimeout(r, 60_000));
  }
});

// ---- カテゴリ ----

for (const n of ["036", "037", "038", "039"]) {
  defineSeed(`S-F02-02-CATEGORIES-${n}`, async ({ browser, notes }) => {
    const seedId = `S-F02-02-CATEGORIES-${n}`;
    const issue = (m: string) => reportSeedIssue(seedId, m);
    await PCの管理画面で(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const A = rc(`テストカテゴリA-${n}-F0202`), B = rc(`テストカテゴリB-${n}-F0202`), A1 = rc(`テストカテゴリA-1-${n}-F0202`);
      const a = await createTopByCsv(page, { nameJp: A, nameEn: A, frontHide: "0", branchHide: "0" }, `${seedId.toLowerCase()}-a-${Date.now()}.csv`, issue);
      const b = await createTopByCsv(page, { nameJp: B, nameEn: B, frontHide: "0", branchHide: "0" }, `${seedId.toLowerCase()}-b-${Date.now()}.csv`, issue);
      const a1 = await new CategoryPage(page).createChild(a, { nameJp: A1, nameEn: A1 }, issue);
      notes.set(`〔カテゴリレコードID-F0202-${n}A〕`, a);
      notes.set(`〔カテゴリレコードID-F0202-${n}B〕`, a1);
      notes.set(`〔カテゴリレコードID-F0202-${n}C〕`, b);
      await キャッシュを削除する(page, seedId, issue);
      issue(`カテゴリ「${A}」（ID ${a}）・「${B}」（ID ${b}）を最上位に、「${A1}」（ID ${a1}）をその子に作り、キャッシュ削除を押した。` +
        "最上位のカテゴリは2件ずつ別のCSVで登録した（作り方の部品が1件ずつ登録して振られたIDを読むため）。カテゴリ識別子はアプリのカテゴリに項目が無いので設定しなかった");
    });
  });
}

// ---- 062: 連携（カードセットの表示用HTML） ----

defineSeed("S-F02-02-L-ENV", async () => { /* 環境。本店の日本語版とユニサーチへの接続は環境の値を使う（最初の手順の画面が確かめる） */ });

defineSeed("S-F02-02-L-CARDSET-062", async ({ browser, seed }) => {
  const [id] = await カードセットを作る(browser, seed.シードID, [["連携試験セット001", "LINK-SET-001-F0202"]]);
  カードセットの表示用HTMLを設定する(id, "LINK-BANNER-001F0202n062");
  連携のカードセット = id;
  const 出ている = await スマホで開いて選択肢を読む(browser);
  if (!出ている.includes(カードセット名("連携試験セット001"))) throw new Error(`カードセット「${カードセット名("連携試験セット001")}」が、本店ECTOPのカードセット選択メニューに出ない`);
  reportSeedIssue(seed.シードID, `カードセット「${カードセット名("連携試験セット001")}」（ID ${id}）を登録し、表示用HTML「LINK-BANNER-001F0202n062」を DB でフリーエリア(日)に設定した（画面に入力欄が無い。印つきのカードセットだけ）`);
});
let 連携のカードセット = "";

defineSeed("S-F02-02-L-PRODUCT-062", { needs: ["S-F02-02-L-CARDSET-062"] }, async ({ browser, seed }) => {
  if (!連携のカードセット) throw new Error("連携試験セット001 をまだ作っていない");
  await 試験商品を作る(browser, seed.シードID, [{ 記号: "A", 商品コード: "F0202-P-062-1", 商品名: "連携商品001", カードセットID: 連携のカードセット }], true);
  reportSeedIssue(seed.シードID, "シード表の「商品登録編集でカードセットを選ぶ・割引率を選ぶ」の代わりに、カードセットの詳細情報を持つカードを商品に指定した（索引のカードセットはカードの詳細情報から作られる）");
});
