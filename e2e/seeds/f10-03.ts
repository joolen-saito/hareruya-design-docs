/**
 * F10-03 閲覧商品の連携（フロント アクセス解析）のシード（画面操作）。正本: cases/F10-03_seed_data.tsv
 *
 * 作り方は、シード表の投入方法のとおり（グッズ商品CSV登録 → 商品マスターで商品IDを控える → 取り込みで作られた規格を公開で登録 →
 * 商品規格の新規作成 → 在庫検索一覧から入庫して、別の管理者が承認）。シード表と違えたところ（解釈。記録・報告にも書く）:
 * - 商品コード・商品名・追加する商品規格の商品コードには、実行の印を付ける（依頼者決定 2026-10-28）。ケースの「商品名F1003-001-A」などは、印つきの値として読む。
 * - 入庫の在庫変動理由は、共通の部品（F03-02 の入庫と承認）の「結合試験」で入れる（シード表は「結合テストのデータ作成」。ケースは理由を確かめない）。
 * - 商品IDを控える呼び名が無い商品規格（追加したSP・英語版など）の商品規格IDは、このファイルの表に持つ（同じ実行の中だけ）。
 * - 共通環境（ENV）: 店舗設定（共有の設定）は書き換えず、本店の日本語サイト・英語サイトのTOP・買い物かご・商品一覧が開けることを画面で確かめる（PM 方針: 条件付き）。
 * - 会員（FAV-045・WAITLIST-048）: 管理画面に会員を新しく登録する画面が無いので、フロントの新規会員登録で作り、本登録のメールのURLを開いて本会員にする
 *   （依頼者決定 2026-10-31。F10-01 と同じ作り方）。メールアドレスの前半に実行の印を付ける。パスワードはシード表の値。
 * - DET-LANGSPEC-057: シード表に無い、追加する日本語版NM・英語版MPの規格の商品コード（F1003-057-JP・F1003-057-EN-MP）と買取価格（10）は試験用の値。
 *   取り込みで作られた英語版NMの規格が非公開なら公開にする（英語版の先頭の規格がNMであることの前提）。
 * - 管理者（GF-ADMIN）: 商品の閲覧と編集の権限の名前はメンバー管理に無いので「システム管理者」で登録する（F10-01・M12 と同じ）。メールアドレスは試験用の値。
 * - NOGTM-047: 買い物かご画面（ページ管理の URL が「cart」のページ）のPCのレイアウトの先頭部に置いたブロックのコードを、ブロック管理(編集)画面で読み、
 *   タグの管理サービスのスクリプト（googletagmanager・gtag）と受け渡し領域（dataLayer）へ積むコードが無いことを確かめる（書き換えない）。
 *
 * 作らないシード（ケースを実装しない。記録 review/F10-03_progress_2026-11-10.md・2026-11-11）:
 * - 特定の商品が索引に載る前提（LIST-IDS-025・LIST-LANG-026・LIST-MEMBER-029・LIST-EN-030・STRUCT-LISTTYPE-038・TOP-*・DETSAME-CARD/LAND・NOUPD-LIST/TOPCART/TOPPROD/LISTCART）。
 *   画面で作った商品は索引へ反映されず、既存の商品で代えると期待（特定の商品IDの並び）を弱めるため。027・028・039・044 は期待が商品に依らないので、画面・既存データで作った。
 * - MARKER-046: 買い物かご画面（共有のページ）のレイアウトの先頭部へ試験用ブロックを置き、戻さない（共有のレイアウトは書き換えない）。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { Account, adminUrl, hideDebugToolbar, withAdminSession } from "../lib/session";
import { 言語IDの一覧, 規格を足す, 入庫して承認する } from "../pages/admin/f03_02_seed_ops";
import { savePublishedClass } from "../pages/admin/f03_07_restock";
import { URLでページを探す, ページのPCのレイアウト, ブロックのコード, 先頭部のブロック } from "../pages/admin/f10_03_setup";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { classRowsFromProductEdit, productIdsByCode, readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { FrontProductList, 公開側の場, 店舗の入口 } from "../pages/front/f03_01_product_list";
import { ProductSearchPage } from "../pages/admin/product_search";
import { FrontRestock } from "../pages/front/f03_07_restock_notify";
import { FrontFavorite } from "../pages/front/f03_08_favorite";
import { markedMail, 本会員を作る } from "./f06-member";
import { ensureAnalysisAdmin } from "./m12-common";

const ENV_SEED = "S-F10-03-ENV";

// ---------------------------------------------------------------------------
// 共通環境（日英サイトの公開）
// ---------------------------------------------------------------------------

defineSeed(ENV_SEED, async ({ browser }) => {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    for (const 入口 of ["/ja", "/en"]) {
      for (const 画面 of ["/", "/cart", "/products/search"]) {
        const res = await page.goto(`${BASE_URL}${入口}${画面}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        expect(res?.status() ?? 0, `${ENV_SEED}: 公開側（${入口}${画面}）が開けない`).toBeLessThan(400);
      }
    }
  } finally { await context.close(); }
  reportSeedIssue(ENV_SEED, "店舗設定（共有の設定）は書き換えず、本店の日本語サイト・英語サイトのTOP・買い物かご・商品一覧が開けることを画面で確かめた（設定の存在を画面で確かめる形に代えた）");
});

// ---------------------------------------------------------------------------
// 試験ブラウザ（ケースごとの新しいブラウザで成り立つ。作るものは無い）
// ---------------------------------------------------------------------------

for (const id of ["S-F10-03-CART-EMPTYIDS-006", "S-F10-03-CART-EMPTYVAL-007", "S-F10-03-OTHER-031"]) {
  defineSeed(id, async () => { /* 新しいブラウザ（Cookieなし・未ログイン・買い物かごが空）はケースごとに用意される */ });
}

// ---------------------------------------------------------------------------
// グッズ商品
// ---------------------------------------------------------------------------

type 言語 = "JP" | "EN";
type 足す規格 = { 言語: 言語; 状態: string; コード: string; 価格: string; 買取?: string; 控え?: string };
type 商品の定義 = {
  /** 商品の記号（ケースの文の A・B・X など） */
  記号: string;
  /** 正本の商品コード（商品名も同じ値。名前が違うときは 名前） */
  コード: string; 名前?: string;
  言語: 言語; 価格: string; 買取?: string; 公開?: "公開" | "非公開";
  /** 商品IDを控える呼び名 */
  控え: string;
  /** 取り込みで作られた規格の商品規格IDを控える呼び名 */
  規格の控え?: string;
  足す?: 足す規格[];
  /** 取り込みで作られた規格は、非公開のときだけ公開にする（057。シード表に公開の登録が無い） */
  非公開なら公開?: boolean;
};

const 言語の名前: Record<言語, string> = { JP: "日本語", EN: "英語" };

/** 作った商品の商品ID・商品規格ID（同じ実行の中だけ） */
const 商品IDの表 = new Map<string, string>();
const 規格IDの表 = new Map<string, string>();
const key = (seedId: string, 記号: string) => `${seedId}/${記号}`;

/** シードが作った商品（記号）の商品ID */
export function 商品IDの値(seedId: string, 記号: string): string {
  const v = 商品IDの表.get(key(seedId, 記号));
  if (!v) throw new Error(`${seedId} の商品 ${記号} をシードが作っていない`);
  return v;
}
/** シードが作った商品（記号）の、言語・状態の商品規格ID */
export function 規格IDの値(seedId: string, 記号: string, 言語: 言語, 状態: string): string {
  const v = 規格IDの表.get(`${key(seedId, 記号)}/${言語}-${状態}`);
  if (!v) throw new Error(`${seedId} の商品 ${記号} の ${言語}・${状態} の商品規格をシードが作っていない`);
  return v;
}
/** 商品名（実行の印つき）。ケースの「商品名F1003-001-A」は、この値として読む */
export const 商品名 = (正本の値: string): string => rc(正本の値);

async function グッズを作る(browser: Browser, seedId: string, notes: Notes, defs: 商品の定義[], 在庫?: number): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 入庫する: { 商品コード: string; 数: number }[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const categoryId = await readGoodsRootCategoryId(page);
    const langs = await 言語IDの一覧(page);
    const langId = (l: 言語) => {
      const v = langs.get(言語の名前[l]);
      if (!v) throw new Error(`${seedId}: 言語「${言語の名前[l]}」のIDを画面から読めない`);
      return v;
    };
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId.toLowerCase()}-${RUN_MARK}.csv`, categoryId, branchStatus: "公開",
      lines: defs.map((d) => ({
        code: rc(d.コード), nameJp: rc(d.名前 ?? d.コード), nameEn: rc(d.名前 ?? d.コード), productStatus: d.公開 ?? "公開",
        values: {
          "言語(ID)": langId(d.言語), "基準価格": d.価格, "販売価格": d.価格, "買取価格": d.買取 ?? "10", "原価単価": "10",
          "地域別販売制限": "0", "スマレジ連携フラグ": "0",
        },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 180_000,
    });
    for (const d of defs) {
      const code = rc(d.コード);
      const ids = await productIdsByCode(page, code);
      if (ids.length !== 1) throw new Error(`${seedId}: 商品コード ${code} の商品が ${ids.length} 件（1件のはず）`);
      const productId = ids[0];
      notes.set(d.控え, productId);
      商品IDの表.set(key(seedId, d.記号), productId);
      await page.goto(adminUrl(`/product/product/${productId}/edit`));
      await page.waitForLoadState("load");
      const rows = await classRowsFromProductEdit(page, productId);
      if (rows.length !== 1) throw new Error(`${seedId}: ${code} の取込直後の商品規格が1件でない: ${JSON.stringify(rows)}`);
      const base = rows[0];
      if (!d.非公開なら公開 || base.公開状態 !== "公開") {
        await savePublishedClass(page, { productId, classId: base.商品規格ID }, `${seedId}: ${code} の取り込みで作られた規格`, issue);
      }
      規格IDの表.set(`${key(seedId, d.記号)}/${d.言語}-NM`, base.商品規格ID);
      if (d.規格の控え) notes.set(d.規格の控え, base.商品規格ID);
      入庫する.push({ 商品コード: base.商品コード, 数: 在庫 ?? 0 });
      for (const a of d.足す ?? []) {
        const c = rc(a.コード);
        const classId = await 規格を足す(page, productId, { 言語: a.言語, 状態: a.状態, 商品コード: c, 基準価格: a.価格, 買取価格: a.買取 ?? "10" },
          `${seedId}: ${code} の ${言語の名前[a.言語]}・${a.状態} の商品規格の新規作成`, issue);
        規格IDの表.set(`${key(seedId, d.記号)}/${a.言語}-${a.状態}`, classId);
        if (a.控え) notes.set(a.控え, classId);
        入庫する.push({ 商品コード: c, 数: 在庫 ?? 0 });
      }
    }
  });
  if (在庫) await 入庫して承認する(browser, 入庫する, seedId, issue);
  issue(`商品コード・商品名・追加した規格の商品コードに実行の印（${RUN_MARK}）を付けた。${在庫 ? `本店の EC-CUBE 在庫へ ${在庫} を入庫し、別の管理者が承認した（在庫変動理由は「結合試験」）` : "入庫はしていない（シード表に入庫が無い）"}`);
}

function defineGoodsSeed(seedId: string, defs: 商品の定義[], 在庫?: number, needs: string[] = []): void {
  defineSeed(seedId, needs.length ? { needs } : {}, async ({ browser, notes }) => { await グッズを作る(browser, seedId, notes, defs, 在庫); });
}

const 一つ = (n: string, a: Partial<商品の定義> = {}): 商品の定義 => ({ 記号: "A", コード: `F1003-${n}`, 言語: "JP", 価格: "500", 控え: `〔商品ID-F1003-${n}〕`, ...a });
const SP = (n: string, 控え?: string): 足す規格 => ({ 言語: "JP", 状態: "SP", コード: `F1003-${n}-SP`, 価格: "400", ...(控え ? { 控え } : {}) });
const EN_NM = (n: string): 足す規格 => ({ 言語: "EN", 状態: "NM", コード: `F1003-${n}-EN`, 価格: "700" });

// 買い物かご
defineGoodsSeed("S-F10-03-CART-IDS-001", [
  { 記号: "A", コード: "F1003-001-A", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-001A〕" },
  { 記号: "B", コード: "F1003-001-B", 言語: "JP", 価格: "1000", 控え: "〔商品ID-F1003-001B〕" },
], 10);
defineGoodsSeed("S-F10-03-CART-VALUE-002", [
  { 記号: "A", コード: "F1003-002-C", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-002A〕" },
  { 記号: "B", コード: "F1003-002-D", 言語: "JP", 価格: "1000", 控え: "〔商品ID-F1003-002B〕" },
], 10);
defineGoodsSeed("S-F10-03-CART-DUP-003", [
  { 記号: "A", コード: "F1003-003-A", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-003A〕", 足す: [SP("003-A")] },
  { 記号: "B", コード: "F1003-003-B", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-003B〕" },
], 10);
defineGoodsSeed("S-F10-03-CART-REDISP-004", [一つ("004")], 10);
defineGoodsSeed("S-F10-03-CART-GUEST-008", [一つ("008")], 10);
defineGoodsSeed("S-F10-03-CART-EN-010", [一つ("010", { 言語: "EN", 価格: "600" })], 10);
defineGoodsSeed("S-F10-03-STRUCT-CARTNEST-032", [一つ("032")], 10);
defineGoodsSeed("S-F10-03-STRUCT-CARTIDS-033", [一つ("033")], 10);
defineGoodsSeed("S-F10-03-STRUCT-CARTVAL-034", [一つ("034")], 10);
defineGoodsSeed("S-F10-03-CART-LANGDUP-049", [
  { 記号: "A", コード: "F1003-049-A", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-049A〕", 足す: [{ 言語: "EN", 状態: "NM", コード: "F1003-049-A-EN", 価格: "700" }] },
  { 記号: "B", コード: "F1003-049-B", 言語: "JP", 価格: "1000", 控え: "〔商品ID-F1003-049B〕" },
], 10);
defineGoodsSeed("S-F10-03-NOUPD-CART-051", [一つ("051")], 10);
defineGoodsSeed("S-F10-03-NOUPD-PROD-052", [一つ("052")], 10);

// 商品詳細
defineGoodsSeed("S-F10-03-DET-ID-011", [一つ("011")]);
defineGoodsSeed("S-F10-03-DET-VALUE-012", [一つ("012", { 足す: [SP("012")] })]);
defineGoodsSeed("S-F10-03-DET-SPEC-013", [一つ("013", { 足す: [SP("013", "〔商品規格ID-F1003-013〕")] })]);
defineGoodsSeed("S-F10-03-DET-LANG-014", [一つ("014", { 足す: [EN_NM("014")] })]);
defineGoodsSeed("S-F10-03-DET-ONLYEN-015", [一つ("015", { 言語: "EN", 価格: "700" })]);
defineGoodsSeed("S-F10-03-DET-NOEN-016", [一つ("016")]);
defineGoodsSeed("S-F10-03-DET-NOSPEC-017", [一つ("017", {
  足す: [SP("017"), EN_NM("017"), { 言語: "EN", 状態: "PL", コード: "F1003-017-EN-PL", 価格: "300", 控え: "〔商品規格ID-F1003-017〕" }],
})]);
defineGoodsSeed("S-F10-03-DET-EN-018", [一つ("018", { 足す: [EN_NM("018")] })]);
defineGoodsSeed("S-F10-03-DET-SWSPECN-019", [一つ("019", { 足す: [SP("019")] })]);
defineGoodsSeed("S-F10-03-DET-SWSPECV-020", [一つ("020", { 足す: [SP("020")] })]);
defineGoodsSeed("S-F10-03-DET-SWLANGN-021", [一つ("021", { 足す: [EN_NM("021")] })]);
defineGoodsSeed("S-F10-03-DET-SWLANGV-022", [一つ("022", { 足す: [EN_NM("022")] })]);
defineGoodsSeed("S-F10-03-DET-PRIVATE-023", [一つ("023", { 公開: "非公開" })]);
defineGoodsSeed("S-F10-03-STRUCT-DETNEST-035", [一つ("035")]);
defineGoodsSeed("S-F10-03-STRUCT-DETID-036", [一つ("036")]);
defineGoodsSeed("S-F10-03-STRUCT-DETVAL-037", [一つ("037")]);
defineGoodsSeed("S-F10-03-DET-SWSPECID-050", [一つ("050", { 足す: [SP("050")] })]);
// 044: カード以外の商品（雑貨＝グッズ）。シード表の控える呼び名は〔商品ID-F1003-044〕、商品名は F1003-044-X
defineGoodsSeed("S-F10-03-DETSAME-OTHER-044", [一つ("044", { コード: "F1003-044-X", 控え: "〔商品ID-F1003-044〕" })], 10);

defineGoodsSeed("S-F10-03-DET-LANGSPEC-057", [{
  記号: "A", コード: "F1003-057-CODE", 名前: "F1003-057", 言語: "EN", 価格: "700", 買取: "300", 控え: "〔商品ID-F1003-057〕", 非公開なら公開: true,
  足す: [
    { 言語: "JP", 状態: "NM", コード: "F1003-057-JP", 価格: "500" },
    { 言語: "EN", 状態: "MP", コード: "F1003-057-EN-MP", 価格: "300", 控え: "〔商品規格ID-F1003-057〕" },
  ],
}]);
defineGoodsSeed("S-F10-03-CBDET-058", [一つ("CB058", { 足す: [SP("CB058", "〔商品規格ID-F1003-CB058〕"), EN_NM("CB058")] })]);
defineGoodsSeed("S-F10-03-CBDET-059", [一つ("CB059", { 足す: [SP("CB059", "〔商品規格ID-F1003-CB059〕")] })]);

// ---------------------------------------------------------------------------
// 買い物かご画面のレイアウトの確認（NOGTM-047）
// ---------------------------------------------------------------------------

/** タグの管理サービスのスクリプト・受け渡し領域へ積むコードの印 */
const 連携のコードの印 = /googletagmanager|gtag\s*\(|dataLayer/i;

defineSeed("S-F10-03-NOGTM-047", async ({ browser, notes }) => {
  const seedId = "S-F10-03-NOGTM-047";
  await グッズを作る(browser, seedId, notes, [{ 記号: "A", コード: "F1003-047-A", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-047〕" }], 10);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const cart = await URLでページを探す(page, "cart");
    const layout = await ページのPCのレイアウト(page, cart.ページID);
    if (!layout) {
      reportSeedIssue(seedId, `買い物かご画面（ページ「${cart.ページ名}」・ID ${cart.ページID}）にPCのレイアウトが選ばれていない（先頭部に置いたブロックは無い）`);
      return;
    }
    const blocks = await 先頭部のブロック(page, layout.レイアウトID);
    const found: string[] = [];
    for (const b of blocks) {
      const code = await ブロックのコード(page, b.ブロックID);
      if (code === null) throw new Error(`${seedId}: 先頭部のブロック「${b.名前}」（ID ${b.ブロックID}）のコードをブロック管理(編集)画面で読めない（確かめられない）`);
      if (連携のコードの印.test(code)) found.push(`${b.名前}（ID ${b.ブロックID}）`);
    }
    if (found.length) {
      throw new Error(`${seedId}: 買い物かご画面のPCのレイアウト「${layout.名称}」の先頭部に、タグの管理サービスのスクリプトか受け渡し領域へ積むブロックがある: ${found.join("、")}（共有のレイアウトなので書き換えない）`);
    }
    reportSeedIssue(seedId, `買い物かご画面（ページ「${cart.ページ名}」）のPCのレイアウト「${layout.名称}」（ID ${layout.レイアウトID}）の先頭部のブロック: ${blocks.map((b) => b.名前).join("、") || "なし"}。どのブロックのコードにも、タグの管理サービスのスクリプトと受け渡し領域へ積むコードが無いことを、ブロック管理(編集)画面で確かめた（書き換えていない）`);
  });
});

// ---------------------------------------------------------------------------
// 会員（お気に入り・入荷待ち）
// ---------------------------------------------------------------------------

export type F1003会員 = { 前半: string; パスワード: string };
export const 会員: Record<string, F1003会員> = {
  "S-F10-03-FAV-045": { 前半: "f1003-045", パスワード: "Pw-F1003-045!" },
  "S-F10-03-WAITLIST-048": { 前半: "f1003-048", パスワード: "Pw-F1003-048!" },
};
/** 会員のメールアドレス（前半に実行の印） */
export const メールの値 = (seedId: string): string => markedMail(会員[seedId].前半);
export const パスワードの値 = (seedId: string): string => 会員[seedId].パスワード;

async function 会員を作る(browser: Browser, seedId: string, 名: string): Promise<string> {
  const m = 会員[seedId];
  const id = await 本会員を作る(browser, { 姓: "結合", 名, セイ: "ケツゴウ", メイ: "レンケイ", 前半: m.前半, パスワード: m.パスワード });
  reportSeedIssue(seedId, `フロントの新規会員登録で本会員を作り、本登録のメールのURLを開いた（管理画面に会員を新しく登録する画面が無いため）。会員ID ${id}・メールアドレス ${メールの値(seedId)}`);
  return id;
}

/** 会員でログインした新しいブラウザで、fn を行う */
async function 会員のブラウザで<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    return await fn(page);
  } finally { await context.close(); }
}

defineSeed("S-F10-03-FAV-045", async ({ browser, notes }) => {
  const seedId = "S-F10-03-FAV-045";
  notes.set("〔会員ID-F1003-045〕", await 会員を作る(browser, seedId, "連携F1003-045"));
  await グッズを作る(browser, seedId, notes, [{ 記号: "X", コード: "F1003-045-X", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-045〕" }], 10);
  const productId = 商品IDの値(seedId, "X");
  await 会員のブラウザで(browser, async (page) => {
    const fav = new FrontFavorite(page);
    await fav.login(メールの値(seedId), パスワードの値(seedId));
    await fav.openDetail(productId, "JP");
    const r = await fav.押す();
    if (!(await fav.登録済みの表示か())) throw new Error(`${seedId}: 商品ID ${productId} のお気に入りボタンを押しても登録済みの表示にならない（${JSON.stringify(r)}）`);
    reportSeedIssue(seedId, `会員でログインし、商品ID ${productId} の商品詳細（日本語）でお気に入りボタンを押して登録した（通知「${r.通知の文}」）`);
  });
});

defineSeed("S-F10-03-WAITLIST-048", async ({ browser, notes }) => {
  const seedId = "S-F10-03-WAITLIST-048";
  notes.set("〔会員ID-F1003-048〕", await 会員を作る(browser, seedId, "連携F1003-048"));
  await グッズを作る(browser, seedId, notes, [{
    記号: "X", コード: "F1003-048-X", 言語: "JP", 価格: "500", 控え: "〔商品ID-F1003-048〕", 規格の控え: "〔商品規格ID-F1003-048〕",
  }]);
  const productId = 商品IDの値(seedId, "X");
  const classId = 規格IDの値(seedId, "X", "JP", "NM");
  await 会員のブラウザで(browser, async (page) => {
    const front = new FrontRestock(page);
    await front.login(メールの値(seedId), パスワードの値(seedId));
    await front.openDetail(productId);
    const r = await front.press(front.classButton(classId));
    if (!(await front.依頼済み表示か(front.classButton(classId)))) {
      throw new Error(`${seedId}: 在庫0の日本語版の規格（商品規格ID ${classId}）の「入荷通知」ボタンを押しても「通知待ち」にならない（${JSON.stringify(r)}）`);
    }
    reportSeedIssue(seedId, `会員でログインし、商品ID ${productId} の商品詳細で在庫0の日本語版の規格（商品規格ID ${classId}）の「入荷通知」ボタンを押した（通知待ちの表示になった）。グッズ商品CSVの必須列は、ほかのシードと同じ試験用の値（基準価格・販売価格500など）`);
  });
});

// ---------------------------------------------------------------------------
// 管理者
// ---------------------------------------------------------------------------

export const F1003_GF_ADMIN: Account = { loginId: "f1003-gf-admin", password: "Passw0rd!F1003GF" };

defineSeed("S-F10-03-GF-ADMIN", async ({ browser }) => {
  await ensureAnalysisAdmin(browser, { 名前: "試験管理者F1003", account: F1003_GF_ADMIN, メール: "f1003-gf-admin@example.test" });
  reportSeedIssue("S-F10-03-GF-ADMIN", "商品の閲覧と編集の権限の名前はメンバー管理に無いので「システム管理者」（所属店舗・編集可能店舗は本店）で登録した（あれば使う）。メールアドレスは試験用の値");
});

// ---------------------------------------------------------------------------
// 商品一覧（ユニサーチ）。画面で作った商品は索引へ反映されるまで一覧に出ないので、既存の商品・画面で作った検索語に読み替える
// ---------------------------------------------------------------------------

const UNI_SEED = "S-F10-03-UNI";
const 読み替え = (seedId: string, m: string) => reportSeedIssue(seedId, `シード作成時の問題（読み替え）: ${m}`);
const found = new Map<string, { 検索語: string; 件数?: number }>();
/** 一覧のシードが決めた検索語 */
export function 検索語の値(seedId: string): { 検索語: string; 件数?: number } {
  const v = found.get(seedId);
  if (!v) throw new Error(`${seedId} をまだ作っていない（検索語が無い）`);
  return v;
}

async function 一覧で<T>(browser: Browser, fn: (list: FrontProductList) => Promise<T>): Promise<T> {
  const context = await 公開側の場(browser);
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    return await fn(new FrontProductList(page));
  } finally { await context.close(); }
}

defineSeed(UNI_SEED, async ({ browser }) => {
  // 共有の設定（接続先・一覧上限・1ページ最大件数）は書き換えない。本店の商品一覧が検索基盤の経路で動いていて、1ページ60件・上限4000件であることを画面（ページの設定）で読み、違えば止める
  const cfg = await 一覧で(browser, async (list) => {
    await list.open(店舗の入口.本店);
    return list.page.locator("[data-js-unisearch-product-list]").first().getAttribute("data-unisearch-config", { timeout: 30_000 }).catch(() => null);
  });
  if (!cfg) throw new Error(`${UNI_SEED}: 本店の商品一覧が検索基盤（ユニサーチ）の経路で動いていない（接続先が未設定）`);
  const j = JSON.parse(cfg) as { pageSize?: number; maxRows?: number };
  if (j.pageSize !== 60 || j.maxRows !== 4000) throw new Error(`${UNI_SEED}: 商品一覧の1ページ最大件数 ${j.pageSize}・一覧上限 ${j.maxRows} が前提（60・4000）と違う。共有の設定なので書き換えず止める`);
  reportSeedIssue(UNI_SEED, "シード作成時の問題: 共有の設定は書き換えず、本店の商品一覧が検索基盤の経路で、1ページ60件・一覧上限4000件であることを画面で読んで確かめた。接続先が試験環境かどうかは画面から読めないので、環境の担当者が確かめる");
});

defineSeed("S-F10-03-LIST-ZERO-027", async ({ browser }) => {
  const id = "S-F10-03-LIST-ZERO-027";
  const kw = rc("F1003-027");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const field of ["product_name", "product_code"] as const) {
      const s = new ProductSearchPage(page);
      await s.open();
      await s.ensureDetailVisible();
      await s.field(field).fill(kw);
      await s.submitAndWaitForResult();
      await expect(page.getByText("検索条件に合致するデータが見つかりませんでした").first(), `商品マスターで「${kw}」を${field === "product_name" ? "商品名(日/英)" : "コード"}に入れて検索した結果が0件`).toBeVisible();
    }
  });
  found.set(id, { 検索語: kw });
  読み替え(id, `検索語に実行の印を付けた「${kw}」を使う（管理画面の商品マスターで商品名・コードとも0件を確かめた。印つきの語なので削除は要らない）。ユニサーチフィードの送信と索引への反映は、存在しない語の0件に関わらないため行わない`);
});

/** 既存の商品が複数当たる検索語を、本店の商品一覧で探す */
function define複数当たる検索語(seedId: string, 正本: string): void {
  defineSeed(seedId, { needs: [UNI_SEED] }, async ({ browser }) => {
    const 候補 = ["ドラゴン", "エルフ", "ゴブリン", "天使", "騎士", "マジック", "の"];
    const seen: string[] = [];
    const hit = await 一覧で(browser, async (list) => {
      for (const kw of 候補) {
        await list.openKeyword(店舗の入口.本店, kw);
        const n = (await list.本表示のカード.count());
        seen.push(`「${kw}」${n}枚`);
        if (n >= 2) return { 検索語: kw, 件数: n };
      }
      return null;
    });
    if (!hit) throw new Error(`${seedId}: 既存の商品で2件以上当たる検索語が見つからない（${seen.join("、")}）`);
    found.set(seedId, hit);
    読み替え(seedId, `${正本}は索引への反映が要り画面で作れないため、既存の商品が2件以上当たる検索語「${hit.検索語}」（1ページ目 ${hit.件数}件）で代えた（試した語: ${seen.join("、")}）。ケースの期待は商品の数・種類に依らない形（要素の件数・項目）なので弱めない`);
  });
}
define複数当たる検索語("S-F10-03-LIST-ONCE-028", "商品A・商品B（商品名F1003-028-A・B）が一覧に出る前提");
define複数当たる検索語("S-F10-03-STRUCT-LISTNEST-039", "商品A・商品B（商品名F1003-039-A・B）が一覧に出る前提");
