/**
 * F03-06 最近チェックした商品の画面シード。正本: cases/F03-06_seed_data.tsv
 *
 * 作り方（シード表の投入方法の順）:
 * 1. カードを指定する商品は、管理画面のカード新規登録画面でこのシード専用のカード名のカードを登録する。
 * 2. グッズ商品CSV登録で、商品（と状態がニアミントの商品規格）を取り込む（商品コード・商品名・価格・地域別販売制限・公開ステータスは正本の値）。
 * 3. 商品マスターで商品コードを検索して商品登録編集画面を開き、（カードを指定する商品は「カード指定 >」でカードを選び）、
 *    商品画像に画像ファイルを追加し、割引率を選んで「商品を登録」する。商品IDを控える。
 * 4. 商品規格一覧から取り込みで作られた規格を開き、（セールの商品はセールフラグと販売価格を入れ）、部門は先頭・公開ステータスは公開にして登録する。
 *    商品規格IDと、代表画像欄の選択肢の値（商品画像ID）を控える。
 * 閲覧履歴のCookieの設定は、ケースの事前準備としてテスト側（pages/front/f03_06_recent.ts）が行う。
 *
 * 作らないシード（記録 e2e/review/F03-06_progress_2026-10-30.md）:
 * - ELIGIBILITY-010（商品規格のカード状態をDBへ直接設定する）、BASE-014（DBフィクチャで投入する）。依頼者の決まりで、DBでの準備を含むシードは実装しない。
 *
 * 決め打ちの識別の値（商品コード・商品名・カード名）には実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * 正本の外で補ったこと:
 * - 共通の試験環境（ENV）は、店舗設定の公開中・営業中・表示言語の設定欄を画面で書き換えず、本店とTC大阪支店が日本語・英語で開けることだけを確かめた（F03-01 と同じ）。
 * - 画像ファイルは正本が中身を定めないので、画像名ごとに色の違う小さな画像を実行時に作って追加した。
 * - カードの詳細情報のカードセットは、このシード専用に1件登録（あれば再利用）して選んだ。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { imageFile, openProductEditByCodeAnyStatus, productImageSources, publishClass, saveProductWithImages } from "../pages/admin/f03_06_products";
import { readExistingGoodsChildCategoryId } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { openProductEditByCode, registerCard } from "../pages/admin/m03_23_seed_products";
import { expectNoProductWithId } from "../pages/admin/m03_30_products";
import { assignCardOnProductEdit } from "../pages/admin/product_card_assign";
import { ensureCardset } from "../pages/admin/product_masters";

// ---- 実行中に控える対応（ケースの文の値 → 実際の値） ----

export type 作った商品 = { productId: string; classId: string; cardDetailId?: string; imageIds: string[]; imageFiles: string[] };
const built = new Map<string, 作った商品>();
const imageFileByName = new Map<string, string>();

/** ケースの文の商品名（正本の値）から、シードが作った商品を引く */
export function productOf(正本の商品名: string): 作った商品 {
  const p = built.get(rc(正本の商品名));
  if (!p) throw new Error(`商品 ${正本の商品名} はまだ作っていない`);
  return p;
}
/** ケースの文の画像名（正本の値）から、商品画像のファイル名（画面が付け直したもの）を引く */
export function imageFileOf(正本の画像名: string): string {
  const f = imageFileByName.get(正本の画像名);
  if (!f) throw new Error(`画像 ${正本の画像名} はまだ追加していない`);
  return f;
}

// ---- 商品の定義 ----

type 商品の定義 = {
  /** 正本の商品名（商品コードは「F0306-」を付けたもの。例外は code で指定） */
  name: string;
  code?: string;
  price: number;
  buy: number;
  /** 地域別販売制限（0=日本語英語両サイト・1=日本語サイト・2=英語サイト） */
  region: 0 | 1 | 2;
  status?: "公開" | "非公開";
  branch?: "公開" | "非公開";
  /** カードを指定する（カード名はこのシード専用） */
  card?: boolean;
  /** 追加する画像の正本の画像名（省略すると1件） */
  images?: string[];
  /** 画像がサムネイルの確かめの対象。追加できなければシードを止める */
  imageRequired?: boolean;
  /** セールの商品規格にする販売価格 */
  sale?: string;
};

const ENV_SEED = "S-F03-06-ENV";

defineSeed("S-F03-06-ENV", async ({ browser }) => {
  // 本店・TC大阪支店が日本語・英語で開けることだけを確かめる（店舗設定の公開中・営業中・表示言語の設定欄は書き換えない）
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    for (const path of ["/ja", "/en", "/ja/osaka", "/en/osaka"]) {
      for (const 画面 of ["/", "/products/search"]) {
        const res = await page.goto(`${BASE_URL}${path}${画面}`, { waitUntil: "domcontentloaded" });
        expect(res?.status() ?? 0, `公開側（${path}${画面}）が開けない`).toBeLessThan(400);
      }
    }
  } finally {
    await context.close();
  }
  reportSeedIssue(ENV_SEED, "店舗設定の公開中・営業中・表示言語の設定は画面で書き換えず、本店・TC大阪支店が日本語・英語で開けることだけを確かめた");
});

const codeOf = (d: 商品の定義) => d.code ?? `F0306-${d.name}`;

/** 商品を作る。呼び名は、シード表の文に出てくるものだけを控える */
async function create(browser: Browser, seedId: string, notes: Notes, defs: 商品の定義[]): Promise<作った商品[]> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const out: 作った商品[] = [];
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 1. カード（カードを指定する商品だけ）
    const cards = new Map<string, { 詳細ID: string; 名: string }>();
    const withCard = defs.filter((d) => d.card);
    let cardsetId = "";
    if (withCard.length) cardsetId = await ensureCardset(page, "F0306カードセット", "F0306 Card Set", "F0306S", issue);
    for (const d of withCard) {
      const 名 = rc(`F0306-CARD-${d.name}`);
      const c = await registerCard(page, { カード名日: 名, カード名英: 名, 点数で見たマナ: "1", コスト: "{1}", カードセットID: cardsetId }, `${seedId}: ${d.name} のカード`, issue);
      cards.set(d.name, { 詳細ID: c.カード詳細ID, 名 });
    }
    // 2. グッズ商品CSV登録
    const categoryId = await readExistingGoodsChildCategoryId(page);
    await registerGoodsCsv(page, {
      what: `${seedId} のグッズ商品CSV登録`, fileName: `${seedId}.csv`, categoryId,
      lines: defs.map((d) => ({
        code: rc(codeOf(d)), nameJp: rc(d.name), nameEn: rc(d.name), productStatus: d.status, branchStatus: d.branch,
        values: { "基準価格": String(d.sale ? 1000 : d.price), "販売価格": String(d.sale ? 1000 : d.price), "買取価格": String(d.buy), "地域別販売制限": String(d.region), "スマレジ連携フラグ": "0" },
      })),
      onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`),
      uploadWaitMs: 120_000,
    });
    // 3・4. 商品ごとの編集と商品規格
    for (const d of defs) {
      const what = `${seedId}: ${d.name}`;
      const names = d.images ?? [`IMG-${d.name}`];
      const files = names.map((n) => imageFile(n));
      const productId = d.status === "非公開" ? await openProductEditByCodeAnyStatus(page, rc(codeOf(d))) : await openProductEditByCode(page, rc(codeOf(d)));
      let sources: string[];
      let cardDetailId: string | undefined;
      if (d.card) {
        const c = cards.get(d.name)!;
        cardDetailId = c.詳細ID;
        await assignCardOnProductEdit(page, { productId, cardNameJp: c.名, cardDetailId: c.詳細ID, productNameJp: rc(d.name), productNameEn: rc(d.name), images: files }, (m) => issue(`${what}: ${m}`));
        sources = await productImageSources(page);
      } else {
        sources = await saveProductWithImages(page, productId, files, what, issue);
      }
      if (d.imageRequired && sources.length !== names.length) {
        throw new Error(`${what}: 商品画像を画面で追加できない（${names.length} 件のはずが ${sources.length} 件）。サムネイルの画像を確かめるケースなので、画像なしでは成り立たない`);
      }
      names.forEach((n, i) => { if (sources[i]) imageFileByName.set(n, sources[i]); });
      const cls = await publishClass(page, productId, { sale: d.sale }, what, issue);
      issue(`${what}: 代表画像欄の選択肢の値=${cls.imageOptionIds.join(",") || "（なし）"}・選ばれている値=${cls.imageSelectedIds.join(",") || "（なし）"}`);
      const p: 作った商品 = { productId, classId: cls.classId, cardDetailId, imageIds: cls.imageOptionIds, imageFiles: sources };
      built.set(rc(d.name), p);
      out.push(p);
    }
  });
  noteLabels(seedId, notes, out);
  return out;
}

/** シード表の状態・属性・投入方法に出てくる呼び名を、作ったものから決めて控える */
function noteLabels(seedId: string, notes: Notes, products: 作った商品[]): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    const m = /^〔(商品ID|商品規格ID|カード情報ID|商品画像ID)-F0306-(\d{3})([A-Z]?)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const [, kind, , suffix] = m;
    const idx = suffix ? suffix.charCodeAt(0) - 65 : 0;
    if (kind === "商品画像ID" && seedId === "S-F03-06-BASE-008") {
      // 008 は末尾の英字が画像の並び（A=表示順1・B=表示順2）
      notes.set(label, products[0].imageIds[idx] ?? "画像なし");
      continue;
    }
    const p = products[idx];
    if (!p) throw new Error(`${seedId}: ${label} に当たる商品が無い`);
    if (kind === "商品ID") notes.set(label, p.productId);
    else if (kind === "商品規格ID") notes.set(label, p.classId);
    else if (kind === "カード情報ID") {
      if (!p.cardDetailId) throw new Error(`${seedId}: ${label} のカード情報IDを控えられない（カードを指定していない）`);
      notes.set(label, p.cardDetailId);
    } else {
      // 商品画像を画面で追加できない環境では、代表画像欄の選択肢が空。控える番号が無いので「画像なし」と控える（記録に書く）
      notes.set(label, p.imageIds[0] ?? "画像なし");
    }
  }
}

defineSeed("S-F03-06-BASE-001", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-001", notes, [{ name: "UI-SALE-001", price: 500, buy: 100, region: 0, card: true, images: ["THUMB-FIRST-001"] }]);
});
defineSeed("S-F03-06-STATUS-003", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-STATUS-003", notes, [
  { name: "STATUS-PUBLIC-003", price: 100, buy: 50, region: 1, card: true },
  { name: "STATUS-PRIVATE-003", price: 100, buy: 50, region: 1, card: true, status: "非公開" },
]);
});
defineSeed("S-F03-06-STORE-SHARED-004", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-STORE-SHARED-004", notes, [
  { name: "REC-HQ-SHARED-004", price: 100, buy: 50, region: 1, card: true },
  { name: "REC-OSA-SHARED-004", price: 100, buy: 50, region: 1, card: true },
]);
});
defineSeed("S-F03-06-STORE-FLAG-005", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-STORE-FLAG-005", notes, [
  { name: "REC-FLAG-ON-005", price: 100, buy: 50, region: 1, card: true },
  { name: "REC-FLAG-OFF-005", price: 100, buy: 50, region: 1, card: true, branch: "非公開" },
]);
});
defineSeed("S-F03-06-BASE-006", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-006", notes, [
  { name: "UI-SALE-006", price: 500, buy: 100, region: 0 },
  { name: "UI-NOSALE-006", price: 500, buy: 100, region: 0 },
]);
});
defineSeed("S-F03-06-LIMIT-007", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-LIMIT-007", notes, Array.from({ length: 16 }, (_, i) => ({
  name: `履歴商品${String(i + 1).padStart(2, "0")}`, code: `F0306-007-${String(i + 1).padStart(2, "0")}`, price: 100, buy: 50, region: 1 as const,
})));
});
defineSeed("S-F03-06-BASE-008", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-008", notes, [{ name: "UI-SALE-008", price: 500, buy: 100, region: 0, card: true, images: ["THUMB-FIRST-008", "THUMB-SECOND-008"], imageRequired: true }]);
});
defineSeed("S-F03-06-REGION-009", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-REGION-009", notes, [
  { name: "REGION-JA-009", price: 100, buy: 50, region: 1 },
  { name: "REGION-EN-009", price: 100, buy: 50, region: 2 },
]);
});

defineSeed("S-F03-06-PARTIAL-MISSING-011", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-PARTIAL-MISSING-011", notes, [{ name: "AVAILABLE-001-011", price: 100, buy: 50, region: 1 }]);
  await withAdminSession(browser, SETUP_ADMIN, (page) => expectNoProductWithId(page, "939601101", "S-F03-06-PARTIAL-MISSING-011"));
});
defineSeed("S-F03-06-EMPTY-012", { needs: [ENV_SEED] }, async () => {
  // 閲覧履歴のCookieが無い状態は、ケースの新しいブラウザセッション（Cookieなし）で成り立つ。作るものは無い
});
defineSeed("S-F03-06-ALL-MISSING-013", { needs: [ENV_SEED] }, async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await expectNoProductWithId(page, "939601301", "S-F03-06-ALL-MISSING-013");
    await expectNoProductWithId(page, "939601302", "S-F03-06-ALL-MISSING-013");
  });
});

defineSeed("S-F03-06-BASE-015", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-015", notes, [
  { name: "UI-SALE-015", price: 500, buy: 100, region: 0, sale: "500" },
  { name: "UI-NOSALE-015", price: 500, buy: 100, region: 0 },
]);
});
defineSeed("S-F03-06-BASE-016", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-016", notes, [{ name: "UI-SALE-016", price: 500, buy: 100, region: 0 }]);
});
defineSeed("S-F03-06-BASE-017", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-017", notes, [{ name: "UI-SALE-017", price: 500, buy: 100, region: 0 }]);
});
defineSeed("S-F03-06-BASE-018", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-018", notes, [{ name: "UI-SALE-018", price: 500, buy: 100, region: 0, card: true }]);
});
defineSeed("S-F03-06-BASE-020", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-BASE-020", notes, [{ name: "UI-SALE-020", price: 500, buy: 100, region: 0 }]);
});
defineSeed("S-F03-06-HQ-NOFLAG-021", { needs: [ENV_SEED] }, async ({ browser, notes }) => {
  await create(browser, "S-F03-06-HQ-NOFLAG-021", notes, [{ name: "F0306-021-NOFLAG", code: "F0306-021-NOFLAG", price: 100, buy: 50, region: 1, card: true, branch: "非公開" }]);
});
