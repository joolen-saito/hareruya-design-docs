// 取り込み注記: 同じ機能の作り方を main 側も実装していたため、栗野側の版を別ファイルにした。main が登録済みのシードは登録しない（seeds/main_defined.ts）。
/**
 * F02-01（本店のグローバルナビ・PC版）の画面シード。正本: cases/F02-01_seed_data.tsv
 *
 * 作るシード:
 * - S-F02-01-ENV: 試験環境。シード表の作り方は「サイト設定とDBシードで用意する」だが、すでにある環境を用意するだけなので、
 *   本店の日本語版・英語版のECTOPが開けることを画面で確かめる形に代えた（PM方針 2026-11-10。条件付き）。
 * - S-F02-01-CARDSETS: 試験セットA・B。カードセット管理の新規登録。名前には実行の印を付ける（依頼者決定 2026-10-28）。
 * - S-F02-01-LANGUAGE: 日本語限定商品（地域別販売制限=1）・日英対応商品（=0）。グッズ商品CSV登録。名前には実行の印。
 * - 会員（MEMBER-…・CBMEMBER-080）: フロントの会員情報登録で登録し本会員にする（本登録のメールを読む）。メールの前半に実行の印。
 *   016・018 は管理画面のポイント履歴追加で +125（登録したばかりの会員の残高は0として、シード表の「残高が0なら125」に従った）。
 *   021・022・068 はグッズ商品を登録し、その会員で商品詳細の「お気に入りに追加」を押す。
 * - カート（CART-…）: 会員を登録し、グッズ商品CSV登録 → 在庫編集（入庫）→ 別の管理者の一括承認 → その会員で商品詳細から「カートに入れる」。
 *   074 は「在庫なし商品」を入れたあと、在庫編集（廃棄 -1）と承認で在庫を0にする。
 *   明細ID（〔明細ID-F0201-0xx〕）は画面に出ないので、シード表のとおり番号は控えず、会員と商品名で明細を特定する文を控える。
 * - S-F02-01-CBBRANCH-078: 支店「試験支店F0201-CB078-A」。店舗一覧に同じ店名があれば内容を確かめて使う（店舗は画面から消せない）。
 * - ブラウザ状態（BROWSER-…・CBBROWSER-…）: ケースは毎回新しいブラウザ（サイトデータの無い状態）で始まるので作る操作が無い。
 *   「会員でログイン済み」は、ケースの事前準備としてケースの最初にログインする（シードのブラウザとケースのブラウザは別のため）。
 *
 * シードでの解釈（シード表に無い値）:
 * - 商品コードが無いもの（日本語限定商品・お気に入りの商品名・カート商品B など）は、F0201-…の形の商品コードに実行の印を付けた値で作った。
 * - 価格の無いグッズ商品は 1000 円。カード商品の指定が無いカートの商品はグッズ商品（026 のカート商品は正本どおりグッズ）。
 * - 会員の氏名は「姓＝シード表の名前の前半、名＝番号」。電話番号・住所などの必須項目は会員登録の部品の既定の値。
 *
 * 作らないシード（ケースを実装しない）: SHOP-CONFIG（≪共有の設定≫）、SEARCH（ユニサーチフィードの作成が外部の試験環境）、CATEGORIES（DBシード）、
 * HISTORY-…（履歴はユニサジェストの外部の試験環境が持つ）、CART-024・025（追加日時をDBへ直接設定）、CART-027・028（送料無料の共有設定）、
 * CART-072・073（カード商品）、L-…（060）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue, SeedCtx } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { カードセットを登録する, グッズ商品を登録する, グッズ商品, 作ったグッズ, 在庫を増減して承認する } from "../pages/admin/f02_01_setup";
import { ensureBranch, 支店の入力 } from "../pages/admin/f02_03_store";
import { カート用商品を作る } from "../pages/admin/f02_03_cart_setup";
import { ShopBasicPage } from "../pages/admin/m10_01_shop";
import { CategoryPage, CategoryCsvRow } from "../pages/admin/category";
import { キャッシュを削除する, 最上位に取り込む } from "../pages/admin/f03_04_category";
import { writeTestData } from "../db/write_adapter";
import { ポイントを付与する } from "../pages/admin/m05_11_order_edit";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { MainNavPage } from "../pages/front/f02_01_nav";
import { markedMail, 本会員を作る } from "./f06-member";

// ---------------------------------------------------------------------------
// ケースが引く値
// ---------------------------------------------------------------------------

export const 試験セットA = () => rc("試験セットA");
export const 試験セットB = () => rc("試験セットB");
export const 日本語限定商品 = () => rc("日本語限定商品");
export const 日英対応商品 = () => rc("日英対応商品");

export type 試験会員 = { メール: string; パスワード: string };
/** 会員（シードIDの番号）のメールとパスワード */
export const 会員: Record<string, () => 試験会員> = {
  "016": () => ({ メール: markedMail("f0201-016"), パスワード: "Pw-F0201-016" }),
  "018": () => ({ メール: markedMail("f0201-018"), パスワード: "Pw-F0201-018" }),
  "020": () => ({ メール: markedMail("f0201-020"), パスワード: "Pw-F0201-020" }),
  "021": () => ({ メール: markedMail("f0201-021"), パスワード: "Pw-F0201-021" }),
  "022": () => ({ メール: markedMail("f0201-022"), パスワード: "Pw-F0201-022" }),
  "067": () => ({ メール: markedMail("f0201-067"), パスワード: "Pw-F0201-067" }),
  "068": () => ({ メール: markedMail("f0201-068"), パスワード: "Pw-F0201-068" }),
  "069": () => ({ メール: markedMail("f0201-069"), パスワード: "Pw-F0201-069" }),
  "070": () => ({ メール: markedMail("f0201-070"), パスワード: "Pw-F0201-070" }),
  "071": () => ({ メール: markedMail("f0201-071"), パスワード: "Pw-F0201-071" }),
  "074": () => ({ メール: markedMail("f0201-074"), パスワード: "Pw-F0201-074" }),
  "080": () => ({ メール: markedMail("cbf0201-080"), パスワード: "Passw0rd-CBF0201080" }),
};
/** シード表がメールとパスワードを「このケース専用の値」とするカートの会員 */
const カード会員 = (n: string): 試験会員 => ({ メール: markedMail(`f0201-cart-${n}`), パスワード: `Pw-F0201-C${n}` });
for (const n of ["024", "025", "026", "027", "028", "032", "033", "034", "036", "037", "038", "058", "072", "073"]) 会員[n] = () => カード会員(n);

/** カートに入れた商品（シードIDの番号ごと）。商品名は実行の印つき */
const カートの商品 = new Map<string, 作ったグッズ[]>();
export function カートに入れた商品(n: string): 作ったグッズ[] {
  const v = カートの商品.get(n);
  if (!v) throw new Error(`S-F02-01-CART-${n} をまだ作っていない`);
  return v;
}

export const 支店CB078: 支店の入力 = {
  店名: "試験支店F0201-CB078-A", 店名カナ: "シケンシテンエフゼロニゼロイチ", 店名英語: "Test Branch Suggest", 支店URL: "f0201cb078", 店名略称3文字: "F1A", ショップ名略称: "試験支店F0201",
  郵便番号: "100-0001", 都道府県: "東京都", 住所1: "千代田区試験", 住所2: "1-1", 電話番号: "03-0000-0201",
  地図URL: "https://replace-dev.hareruyamtg.com:8443/maps/f0201-cb078",
};

// ---------------------------------------------------------------------------
// 部品
// ---------------------------------------------------------------------------

async function フロントで<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    return await fn(page);
  } finally { await context.close(); }
}

/** 会員を登録して本会員にし、会員IDを返す */
async function 会員を作る(browser: Browser, n: string, 姓: string): Promise<string> {
  const m = 会員[n]();
  const 前半 = m.メール.replace(`-${RUN_MARK}@example.test`, "");
  return 本会員を作る(browser, { 姓, 名: n, セイ: "シケン", メイ: "カイイン", 前半, パスワード: m.パスワード });
}

async function グッズを作る({ browser, seed }: SeedCtx, defs: グッズ商品[]): Promise<作ったグッズ[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return グッズ商品を登録する(page, seed.シードID, defs, (m) => reportSeedIssue(seed.シードID, m));
  });
}

for (const n of ["001", "002", "003", "004", "005", "006", "008", "009", "011", "012", "014", "016", "017", "018", "019", "020", "021", "022",
  "026", "032", "033", "034", "036", "037", "038", "043", "044", "058", "061", "062", "063", "064", "065", "066", "067", "068", "069", "070", "071", "074",
  "007", "024", "025", "027", "028", "039", "040", "041", "042", "072", "073"]) {
  defineSeed(`S-F02-01-BROWSER-${n}`, async () => { /* ケースは新しいブラウザで始まる。ログインはケースの事前準備で行う */ });
}
for (const n of ["076", "077", "078", "079", "080"]) {
  defineSeed(`S-F02-01-CBBROWSER-${n}`, async () => { /* ケースは新しいブラウザで始まる（サイトデータ・検索語・カードセットの選択なし） */ });
}

// ---------------------------------------------------------------------------
// カードセット・商品
// ---------------------------------------------------------------------------

defineSeed("S-F02-01-CARDSETS", async ({ browser, notes, seed }) => {
  const d = new Date(Date.now() - 86_400_000);
  const 前日 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    notes.set("〔カードセットID-F0201-共有A〕", await カードセットを登録する(page, { 名日: 試験セットA(), 名英: `F0201 Test Set A ${RUN_MARK}`, 略称: `F0201A${RUN_MARK}`, リリース日: 前日 }, issue));
    notes.set("〔カードセットID-F0201-共有B〕", await カードセットを登録する(page, { 名日: 試験セットB(), 名英: `F0201 Test Set B ${RUN_MARK}`, 略称: `F0201B${RUN_MARK}`, リリース日: 前日 }, issue));
  });
  // ③ フロントのカードセット選択メニューの選択肢に出ることを確かめる
  await フロントで(browser, async (page) => {
    const n = new MainNavPage(page);
    await n.ECTOPを開く("ja");
    for (const name of [試験セットA(), 試験セットB()]) {
      if ((await n.カードセットの選択肢の名前(name).count()) !== 1) throw new Error(`フロントのカードセット選択メニューに「${name}」が1件出ない`);
    }
  });
});

defineSeed("S-F02-01-LANGUAGE", async (c) => {
  const [a, b] = await グッズを作る(c, [
    { 商品コード: rc("F0201-LANG-A"), 商品名: 日本語限定商品(), 地域別販売制限: "1" },
    { 商品コード: rc("F0201-LANG-B"), 商品名: 日英対応商品(), 地域別販売制限: "0" },
  ]);
  c.notes.set("〔商品ID-F0201-共有A〕", a.商品ID);
  c.notes.set("〔商品ID-F0201-共有B〕", b.商品ID);
});

// ---------------------------------------------------------------------------
// 会員・お気に入り
// ---------------------------------------------------------------------------

for (const n of ["016", "018"]) {
  defineSeed(`S-F02-01-MEMBER-${n}`, async ({ browser, notes }) => {
    const id = await 会員を作る(browser, n, "F0201会員");
    notes.set(`〔会員ID-F0201-${n}〕`, id);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await ポイントを付与する(page, id, 125); });
  });
}
defineSeed("S-F02-01-MEMBER-020", async ({ browser, notes }) => { notes.set("〔会員ID-F0201-020〕", await 会員を作る(browser, "020", "F0201会員")); });
defineSeed("S-F02-01-MEMBER-069", async ({ browser }) => { await 会員を作る(browser, "069", "ポイント0会員"); });

/** 会員を作り、お気に入りの件数が0であることを確かめる（067・CB080） */
async function お気に入りなしの会員(browser: Browser, n: string, 姓: string): Promise<void> {
  await 会員を作る(browser, n, 姓);
  const m = 会員[n]();
  await フロントで(browser, async (page) => {
    const fav = new FrontFavorite(page);
    await fav.login(m.メール, m.パスワード);
    await fav.openFavoriteList();
    const names = await fav.一覧の商品名();
    if (names.length !== 0) throw new Error(`会員 ${m.メール} のお気に入り商品一覧が ${names.length} 件（0件のはず）`);
    await fav.logout();
  });
}
defineSeed("S-F02-01-MEMBER-067", async ({ browser }) => { await お気に入りなしの会員(browser, "067", "お気に入り0件会員"); });
defineSeed("S-F02-01-CBMEMBER-080", async ({ browser }) => { await お気に入りなしの会員(browser, "080", "お気に入り0件会員"); });

/** 会員を作り、グッズ商品を登録して、その会員で商品詳細の「お気に入りに追加」を押す（021・022・068） */
async function お気に入りありの会員(c: SeedCtx, n: string, 姓: string, 商品コード: string[]): Promise<string> {
  const id = await 会員を作る(c.browser, n, 姓);
  const goods = await グッズを作る(c, 商品コード.map((code) => ({ 商品コード: rc(code), 商品名: rc(`F0201お気に入り商品-${code}`) })));
  const m = 会員[n]();
  await フロントで(c.browser, async (page) => {
    const fav = new FrontFavorite(page);
    await fav.login(m.メール, m.パスワード);
    for (const g of goods) {
      await fav.openDetail(g.商品ID);
      await fav.押す();
      if (!(await fav.登録済みの表示か())) throw new Error(`${c.seed.シードID}: ${g.商品コード} の「お気に入りに追加」を押したが登録済みの表示にならない`);
    }
  });
  return id;
}
defineSeed("S-F02-01-MEMBER-021", async (c) => { c.notes.set("〔会員ID-F0201-021〕", await お気に入りありの会員(c, "021", "F0201会員", ["FAV-001-021", "FAV-002-021"])); });
defineSeed("S-F02-01-MEMBER-022", async (c) => { c.notes.set("〔会員ID-F0201-022〕", await お気に入りありの会員(c, "022", "F0201会員", ["FAV-001-022", "FAV-002-022"])); });
defineSeed("S-F02-01-MEMBER-068", async (c) => { await お気に入りありの会員(c, "068", "お気に入り1件会員", ["FAV-001-068"]); });

// ---------------------------------------------------------------------------
// カート
// ---------------------------------------------------------------------------

type カートの品 = { 商品名: string; 商品コード: string; 価格?: string; 在庫: number; 数量: number };

async function カートを作る(c: SeedCtx, n: string, 姓: string, items: カートの品[], 後で廃棄?: string): Promise<void> {
  await 会員を作る(c.browser, n, 姓);
  const issue = (m: string) => reportSeedIssue(c.seed.シードID, m);
  const goods = items.length ? await グッズを作る(c, items.map((i) => ({ 商品コード: rc(i.商品コード), 商品名: rc(i.商品名), 価格: i.価格 ?? "1000" }))) : [];
  await 在庫を増減して承認する(c.browser, c.seed.シードID, items.map((i) => ({ 商品コード: rc(i.商品コード), 数: i.在庫, 区分: "入庫/その他" as const, 承認後の在庫: i.在庫 })), issue);
  const m = 会員[n]();
  await フロントで(c.browser, async (page) => {
    await frontLogin(page, { メール: m.メール, パスワード: m.パスワード });
    await clearCart(page, (d) => issue(`カートを空にするときの確認「${d}」`));
    for (const [k, i] of items.entries()) await addToCart(page, goods[k].商品ID, i.数量, `${c.seed.シードID}: ${i.商品名} をカートに入れる`);
  });
  if (後で廃棄) {
    const i = items.find((x) => x.商品名 === 後で廃棄)!;
    await 在庫を増減して承認する(c.browser, c.seed.シードID, [{ 商品コード: rc(i.商品コード), 数: -i.在庫, 区分: "廃棄/廃棄(その他)", 承認後の在庫: 0 }], issue);
  }
  カートの商品.set(n, goods);
  for (const g of goods) {
    const label = `〔明細ID-F0201-${n}〕`;
    if ((c.seed["状態・属性"] + c.seed.投入方法).includes(label)) c.notes.set(label, `${m.メール} のカートの「${g.商品名}」の明細（番号は画面に出ないので控えない）`);
  }
}

const 二品 = (n: string, a: Partial<カートの品> = {}, b: Partial<カートの品> = {}): カートの品[] => [
  { 商品名: `カート商品A-${n}`, 商品コード: `CART-F0201-${n}-A`, 価格: "1000", 在庫: 5, 数量: 2, ...a },
  { 商品名: `カート商品B-${n}`, 商品コード: `CART-F0201-${n}-B`, 価格: "1500", 在庫: 5, 数量: 1, ...b },
];
defineSeed("S-F02-01-CART-026", (c) => カートを作る(c, "026", "販売カート確認会員", 二品("026")));
defineSeed("S-F02-01-CART-038", (c) => カートを作る(c, "038", "販売カート確認会員", 二品("038", { 価格: undefined }, { 価格: undefined })));
defineSeed("S-F02-01-CART-058", (c) => カートを作る(c, "058", "販売カート確認会員", 二品("058", { 価格: undefined }, { 価格: undefined })));
defineSeed("S-F02-01-CART-070", async ({ browser }) => {
  await 会員を作る(browser, "070", "空カート確認会員");
  const m = 会員["070"]();
  await フロントで(browser, async (page) => {
    await frontLogin(page, { メール: m.メール, パスワード: m.パスワード });
    const n = new MainNavPage(page);
    await n.開く("/ja/cart");
    if ((await n.カートの商品数().count()) !== 0) throw new Error(`会員 ${m.メール} のカートに商品がある`);
  });
});
defineSeed("S-F02-01-CART-071", (c) => カートを作る(c, "071", "販売カート確認会員", [{ 商品名: "カート商品A-071", 商品コード: "CART-F0201-071-A", 価格: "1000", 在庫: 5, 数量: 1 }]));
for (const [n, 名, 数量] of [["032", "数量操作商品-032", 2], ["033", "数量操作商品-033", 2], ["034", "最小数量商品-034", 1], ["036", "数量操作商品-036", 2], ["037", "在庫上限商品-037", 5]] as const) {
  defineSeed(`S-F02-01-CART-${n}`, (c) => カートを作る(c, n, "数量操作確認会員", [{ 商品名: 名, 商品コード: `CART-F0201-${n}-A`, 在庫: 5, 数量 }]));
}
defineSeed("S-F02-01-CART-074", (c) => カートを作る(c, "074", "数量操作確認会員", [
  { 商品名: "在庫なし商品-074", 商品コード: "CART-F0201-074-A", 価格: "1000", 在庫: 1, 数量: 1 },
  { 商品名: "在庫あり商品-074", 商品コード: "CART-F0201-074-B", 価格: "1000", 在庫: 5, 数量: 2 },
], "在庫なし商品-074"));

/** カートの商品名（実行の印つき） */
export const カートの商品名 = (正本の名前: string) => rc(正本の名前);

// ---------------------------------------------------------------------------
// 支店
// ---------------------------------------------------------------------------

defineSeed("S-F02-01-CBBRANCH-078", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureBranch(page, 支店CB078, (m) => reportSeedIssue(seed.シードID, m));
  });
  await フロントで(browser, async (page) => {
    const res = await page.goto(`${BASE_URL}/ja/${支店CB078.支店URL}/`);
    if ((res?.status() ?? 0) >= 400) throw new Error(`支店ECTOP（/ja/${支店CB078.支店URL}/）が開けない（${res?.status()}）`);
  });
});

// ---------------------------------------------------------------------------
// 2026-11-11 追加（依頼者の方針 2026-11-10: 画面で作る・既存データで読み替える・共有のデータは書き換えない）
// ---------------------------------------------------------------------------

// ---- カート（024・025・027・028）。商品はグッズ商品（シード表の024・025の「カード・Foil」は、ケースが商品の種類を見ないのでグッズで代えた） ----
// 追加日時（シード表: DBへ直接設定）: カートの明細に追加日時の項目がアプリに無く、ヘッダのカートの並びは明細の番号順（入れた順）。
// 画面でカート商品A→Bの順に入れる作りにして、追加日時の設定は行わない（F02-03 と同じ）。
const 追加日時の注記 = "追加日時（カート商品Aは10:00、Bは11:00）は、カートの明細に追加日時の項目がアプリに無いため設定できない。カートへ入れた順（A→B）で代えた（ヘッダのカートの並びは明細の番号順）";
defineSeed("S-F02-01-CART-024", async (c) => {
  await カートを作る(c, "024", "販売カート確認会員", 二品("024"));
  reportSeedIssue(c.seed.シードID, `シード作成時の問題（読み替え）: ${追加日時の注記}。カート商品Aはカード（EN・NM・Foilあり）でなくグッズ商品`);
});
defineSeed("S-F02-01-CART-025", async (c) => {
  await カートを作る(c, "025", "販売カート確認会員", 二品("025"));
  reportSeedIssue(c.seed.シードID, `シード作成時の問題（読み替え）: ${追加日時の注記}`);
});
defineSeed("S-F02-01-CART-027", async (c) => {
  await カートを作る(c, "027", "販売カート確認会員", 二品("027", { 在庫: 2 }, { 在庫: 1 }));
});
defineSeed("S-F02-01-CART-028", async (c) => {
  await カートを作る(c, "028", "送料無料確認会員", [{ 商品名: "送料無料商品-028", 商品コード: "CART-F0201-028-A", 価格: "10000", 在庫: 5, 数量: 1 }]);
});

// ---- 送料無料条件（共有の設定）。書き換えず、いまの値を読んで、シード表の前提（10,000円）と違えば止める ----
defineSeed("S-F02-01-SHOP-CONFIG", async ({ browser, seed }) => {
  const 値 = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const shop = new ShopBasicPage(page);
    await shop.open();
    return shop.値("送料無料条件(金額)");
  });
  const 数 = Number(値.replace(/[,，\s]/g, ""));
  if (数 !== 10000) {
    throw new Error(`${seed.シードID}: 本店の送料無料条件（金額）がいま「${値}」で、シード表の前提の10,000円と違う。共有の設定は書き換えないので止める`);
  }
  reportSeedIssue(seed.シードID, "シード作成時の問題（読み替え）: 送料無料条件（金額）は共有の設定なので書き換えず、いまの値が10,000円であることを管理画面で確かめた（違えば止める）。戻す操作も行わない");
});

// ---- カード商品のカート（072・073）。カード指定のある商品をグッズ商品CSV＋カード指定で作る（F02-03 の部品） ----
type カードの品 = { 商品名: string; 商品コード: string; 価格: string; Foil?: string; 言語?: string; 在庫: number; 数量: number };
async function カード商品のカートを作る(c: SeedCtx, n: string, 姓: string, items: カードの品[]): Promise<void> {
  await 会員を作る(c.browser, n, 姓);
  const issue = (m: string) => reportSeedIssue(c.seed.シードID, m);
  const made = await カート用商品を作る(c.browser, c.seed.シードID, items.map((i) => ({
    商品コード: rc(i.商品コード), 商品名: rc(i.商品名), 価格: i.価格, カード: i.Foil ? { Foil: i.Foil } : undefined, 言語: i.言語, 在庫: i.在庫,
  })), issue);
  const m = 会員[n]();
  await フロントで(c.browser, async (page) => {
    await frontLogin(page, { メール: m.メール, パスワード: m.パスワード });
    await clearCart(page, (d) => issue(`カートを空にするときの確認「${d}」`));
    for (const [k, i] of items.entries()) await addToCart(page, made[k].商品ID, i.数量, `${c.seed.シードID}: ${i.商品名} をカートに入れる`);
  });
  カートの商品.set(n, made.map((x) => ({ 商品ID: x.商品ID, 商品コード: x.商品コード, 商品名: x.商品名 })));
  issue("シード作成時の問題（読み替え）: カード商品は、カード詳細(登録)でカードを作り、グッズ商品CSV登録で取り込んで商品登録編集の「カード指定」でカードを指定する作り方（F02-03 と同じ）。カード商品CSV登録は使っていない");
}
defineSeed("S-F02-01-CART-072", (c) => カード商品のカートを作る(c, "072", "販売カート確認会員", [
  { 商品名: "カート商品A-072", 商品コード: "CART-F0201-072-A", 価格: "1000", Foil: "なし", 在庫: 5, 数量: 2 },
]));
defineSeed("S-F02-01-CART-073", (c) => カード商品のカートを作る(c, "073", "混在カート確認会員", [
  { 商品名: "カード商品-073", 商品コード: "CART-F0201-073-A", 価格: "1000", Foil: "通常", 言語: "英語", 在庫: 5, 数量: 2 },
  { 商品名: "グッズ商品-073", 商品コード: "CART-F0201-073-B", 価格: "500", 在庫: 5, 数量: 1 },
]));

// ---- 検索用の商品（SEARCH）。外部の検索索引（ユニサーチ）への反映は行わない ----
defineSeed("S-F02-01-SEARCH", { needs: ["S-F02-01-CARDSETS"] }, async (c) => {
  const A = c.notes.get("〔カードセットID-F0201-共有A〕"), B = c.notes.get("〔カードセットID-F0201-共有B〕");
  await グッズを作る(c, [
    { 商品コード: rc("SEARCH-A"), 商品名: rc("検索商品"), カードセットID: A },
    { 商品コード: rc("SEARCH-B"), 商品名: rc("検索商品"), カードセットID: B },
    { 商品コード: rc("SEARCH-C"), 商品名: rc("別商品"), カードセットID: A },
  ]);
  reportSeedIssue(c.seed.シードID, "シード作成時の問題（読み替え）: 商品3件（SEARCH-A・B・C。商品名・商品コードに実行の印）は画面で作ったが、商品管理のユニサーチフィード作成（外部の試験用索引への反映）は行っていない");
});

// ---- カテゴリ（039・040）。試験用の固定の名称で、無いときだけ作って使い回す（共有のナビへ実行ごとに増やさない） ----
export const 試験カテゴリ = {
  第一階層: "試験カテゴリ第一階層(E2E試験-F0201)", 第一階層の子: ["試験カテゴリ子A(E2E試験-F0201)", "試験カテゴリ子B(E2E試験-F0201)"],
  最新セットA: "最新セットA(E2E試験-F0201)", 最新セットAの子: ["最新セット子A(E2E試験-F0201)", "最新セット子B(E2E試験-F0201)"],
} as const;

defineSeed("S-F02-01-CATEGORIES", async ({ browser, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  let 作った = false;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const category = new CategoryPage(page);
    await category.openTop();
    const 最上位 = await category.rowValues();
    const 最新セット = 最上位.filter((r) => r.nameJp === "最新セット");
    if (最新セット.length !== 1) throw new Error(`${seed.シードID}: 最上位に既存のカテゴリ「最新セット」が ${最新セット.length} 件ある（1件のはず）。既存のカテゴリは書き換えない・作らないので止める`);
    const csv = (r: Pick<CategoryCsvRow, "nameJp" | "nameEn" | "parentId">): CategoryCsvRow => ({ ...r, frontHide: "0", branchHide: "0" });
    /** 親の下に名称の行が無ければ作り、IDを返す */
    const ensure = async (親ID: string, 名: string, 英: string): Promise<string> => {
      if (親ID === "0") await category.openTop(); else await category.openChildrenOf(親ID);
      const hit = (await category.rowValues()).filter((r) => r.nameJp === 名);
      if (hit.length > 1) throw new Error(`${seed.シードID}: 親 ${親ID} の下に「${名}」が ${hit.length} 件ある（1件のはず）`);
      if (hit.length === 1) return hit[0].id;
      await 最上位に取り込む(page, [csv({ nameJp: 名, nameEn: 英, parentId: 親ID })], `${seed.シードID}-${Date.now()}.csv`, `${seed.シードID} のカテゴリ登録CSV（「${名}」）`, issue);
      作った = true;
      if (親ID === "0") await category.openTop(); else await category.openChildrenOf(親ID);
      return category.idOf(名);
    };
    const 第一 = await ensure("0", 試験カテゴリ.第一階層, "F0201 Test Category Top");
    for (const [i, 名] of 試験カテゴリ.第一階層の子.entries()) await ensure(第一, 名, `F0201 Test Category Child ${i + 1}`);
    const 最新A = await ensure(最新セット[0].id, 試験カテゴリ.最新セットA, "F0201 Latest Set A");
    for (const [i, 名] of 試験カテゴリ.最新セットAの子.entries()) await ensure(最新A, 名, `F0201 Latest Set Child ${i + 1}`);
    if (作った) await キャッシュを削除する(page, seed.シードID, issue);
  });
  issue(作った
    ? "シード作成時の問題（読み替え）: カテゴリID 820201301 などは画面で指定できないので、固定の試験用の名称（〇〇(E2E試験-F0201)）で、無かったものを新しく作った（最上位1件・その子2件・最新セットの子1件とその子2件）。キャッシュを削除した。次からは使い回す"
    : "シード作成時の問題（読み替え）: 試験用のカテゴリは前から有るので使い回した（作らず、キャッシュも削除していない）");
  issue("シード作成時の問題（読み替え）: フォーマット（スタンダードなど）の子カテゴリと、その他配下のカテゴリは作っていない（既存のナビを読んで確かめる。041・042）");
});

// ---- カードセットの表示用HTML（060）。画面で指定できないので、この実行で作ったカードセットだけ DB へ書く ----
export const 連携セット = () => rc("連携試験セット001");
export const 連携商品 = () => rc("連携商品001");
export const 連携バナー = "LINK-BANNER-001F0201n060";
defineSeed("S-F02-01-L-ENV", async () => { /* 本店の日本語版PC画面は基盤の既定。ユニサーチ試験環境への接続は行わない（060は検索結果を確かめない） */ });
let 連携セットID = "";
defineSeed("S-F02-01-L-CARDSET-060", async ({ browser, seed }) => {
  const d = new Date(Date.now() - 86_400_000);
  const 前日 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const id = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return カードセットを登録する(page, { 名日: 連携セット(), 名英: `F0201 Link Set ${RUN_MARK}`, 略称: `F0201L${RUN_MARK}`, リリース日: 前日 }, issue);
  });
  連携セットID = id;
  const n = writeTestData({
    理由: `${seed.シードID}: カードセットの表示用HTMLは画面で指定できないので、この実行で作ったカードセットだけに設定する`,
    sql: "update mtb_cardset set free_area_jp = $1 where id = $2",
    params: [連携バナー, id],
    対象の確かめ: "select id, name_jp from mtb_cardset where id = $1",
    確かめのparams: [id],
    印: RUN_MARK,
    最大行数: 1,
  });
  issue(`シード作成時の問題（読み替え）: DBで、この実行で作ったカードセット「${連携セット()}」（ID ${id}）の表示用HTML（フリーエリア(日)）を「${連携バナー}」に設定した（${n}行。画面で指定できないため）`);
});
defineSeed("S-F02-01-L-PRODUCT-060", { needs: ["S-F02-01-L-CARDSET-060"] }, async (c) => {
  await グッズを作る(c, [{ 商品コード: rc("LINK-001"), 商品名: 連携商品(), カードセットID: 連携セットID }]);
  reportSeedIssue(c.seed.シードID, "シード作成時の問題（読み替え）: 商品は画面で作ったが、商品管理のユニサーチフィード作成（外部の試験用索引への反映）は行っていない");
});
