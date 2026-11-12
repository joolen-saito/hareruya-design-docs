/**
 * M03-04 グッズ商品CSV出力の続き（-x）の画面シード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもののうち、
 * 開発環境で作れるもの。正本: cases/M03-04_seed_data.tsv
 *
 * シードでの解釈（正本の外の補い。記録 review/M03-04_progress_2026-11-11_dev.md にも書く）:
 * - S-M03-04-MASTER（参照マスタと店舗・在庫場所を DB シードで登録）は、DB シードで登録しない決まりなので、開発環境に既にあるものを使う。
 *   状態 NM・SP・MP と商品公開ステータスのマスタがあることだけを確かめる。
 * - S-M03-04-CONFIG（CSV出力設定 UTF-8・カンマ）は、アプリの設定ファイルの値で画面から変えられない。開発環境の設定をそのまま使う（ケースの結果で確かめる）。
 * - 商品はグッズ商品CSV登録で作る。商品コードと商品名(日)には実行の印 rc() を付ける（検索の結果をこの実行の商品だけにするため）。
 *   正本が値を示さない必須の列は、取込が通る値（言語＝日本語、商品公開ステータス・支店の商品公開ステータス＝公開、商品カテゴリ＝グッズのカテゴリ（番号2）、
 *   既存の購入グループ、基準価格・販売価格100 など。registerGoodsCsv の決め方）。スマレジ連携フラグ・地域別販売制限は 0。
 * - 正本の列の値「言語(ID)=2・商品公開ステータス=2・カードセット(ID)=501・販売制限数=5」（027・030・031）は、開発環境では言語2＝英語・公開ステータス2＝非公開で、
 *   ケースの期待結果も見ないので、上の取込が通る値にした。
 * - 補助商品の商品ID・規格ID（012・013 の〔補助商品ID-…〕など）は、ケースが使わないので控えない。
 * - 「状態NMの規格0件」（008・034）は、取込で作られた NM の規格を、SP（・MP）の規格を足したあとで商品規格登録編集の「商品規格を削除」で消す（アプリの削除は廃止・削除済みの印）。
 * - 031 の商品公開ステータス「廃止」は画面で指定できないので、E2E の商品の行に DB で書く。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 廃止にする } from "../db/m03_04_x";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { 使い回して作る } from "./seed_reuse";
import { withAdminSession } from "../lib/session";
import { 取込の商品と規格を読む, 規格を足す, 規格を削除する } from "../pages/admin/a17_05_setup";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { ProductSearchPage } from "../pages/admin/product_search";

type Issue = (m: string) => void;
type 行 = { 商品コード: string; 商品名日: string; 商品名英?: string; 値?: Record<string, string> };

/** 商品名(日)の検索の言葉（印つき）。正本の「商品名=M0304CASE009」などの読み替え */
export const 検索語 = (正本: string): string => rc(正本);

async function 取り込む(page: Page, seedId: string, lines: 行[], issue: Issue): Promise<void> {
  const categoryId = await readGoodsRootCategoryId(page);
  const template = await downloadGoodsCsvTemplate(page);
  const zeros = Object.fromEntries(template.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
  await registerGoodsCsv(page, {
    what: `${seedId} のグッズ商品CSV登録`, fileName: `${rc(seedId.toLowerCase())}.csv`, categoryId, common: zeros,
    lines: lines.map((l) => ({ code: l.商品コード, nameJp: l.商品名日, nameEn: l.商品名英 ?? `${l.商品名日}-EN`, values: l.値 ?? {} })),
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 300_000,
  });
}

/** 1行ずつの商品を取り込み、商品IDと（取込で作られた NM の）規格IDを控える */
async function 商品を作る(browser: Browser, seedId: string, notes: Notes, defs: (行 & { 商品の呼び名?: string; 規格の呼び名?: string })[], issue: Issue, 一度に = true): Promise<{ 商品ID: string; 規格ID: string }[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    if (一度に) await 取り込む(page, seedId, defs, issue);
    else for (const d of defs) await 取り込む(page, seedId, [d], issue);
    const out: { 商品ID: string; 規格ID: string }[] = [];
    for (const d of defs) {
      const r = await 取込の商品と規格を読む(page, d.商品コード, issue);
      if (d.商品の呼び名) notes.set(d.商品の呼び名, r.商品ID);
      if (d.規格の呼び名) notes.set(d.規格の呼び名, r.規格ID);
      out.push(r);
    }
    return out;
  });
}

const 一件 = (n: string, 値: Record<string, string> = {}, 英?: string): 行 & { 商品の呼び名: string; 規格の呼び名: string } => ({
  商品コード: rc(`GOODS-304-A-${n}`), 商品名日: `${検索語(`M0304CASE${n}`)}-A`, 商品名英: 英, 値,
  商品の呼び名: `〔商品ID-M0304-${n}〕`, 規格の呼び名: `〔規格ID-M0304-${n}〕`,
});

// ---- マスタ・設定 ----
defineSeed("S-M03-04-MASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const s = new ProductSearchPage(page);
    await s.open();
    await s.ensureDetailVisible();
    const 状態 = (await s.choiceOptions("card_condition")).map((c) => c.label);
    // 開発環境の商品一覧の状態の選択肢は略称（NM・SP・MP など）で出る（2026-11-12）。正式名か略称のどちらかがあればよい
    for (const [want, 略称] of [["ニアミント", "NM"], ["スライトリープレイド", "SP"], ["モデレトリープレイド", "MP"]] as const) {
      if (!状態.some((l) => l.startsWith(want) || l.trim() === 略称)) throw new Error(`商品一覧の状態の選択肢に「${want}」（${略称}）が無い（${状態.join("、")}）`);
    }
  });
  reportSeedIssue(seed.シードID, "参照マスタと店舗・在庫場所は DB シードで登録せず、開発環境に既にあるものを使った（状態 NM・SP・MP があることを商品一覧の選択肢で確かめた）");
});

defineSeed("S-M03-04-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "CSV出力の文字コード・区切り文字はアプリの設定ファイルの値で、画面から設定できない。開発環境の設定をそのまま使った（UTF-8・カンマであることは、ケースのダウンロードしたファイルで確かめる）");
});

// ---- 1件の商品 ----
for (const n of ["010", "014", "015"]) {
  defineSeed(n === "010" ? "S-M03-04-RICH-010" : n === "014" ? "S-M03-04-NOTFOUND-014" : "S-M03-04-RICH-NOTFOUND-015", { needs: ["S-M03-04-MASTER"] },
    async ({ browser, notes, seed }) => { await 商品を作る(browser, seed.シードID, notes, [一件(n)], (m) => reportSeedIssue(seed.シードID, m)); });
}
defineSeed("S-M03-04-FORMAT-017", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, [一件("017")], (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-M03-04-VALUES-020", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, [一件("020", { "検索ワード": "M0304-020-KEYWORD" }, "M0304-020-NAME-EN")], (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-M03-04-VALUES-021", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, [一件("021", { "サイズ": "87", "重量": "210" })], (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-M03-04-VALUES-022", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, [一件("022", {
    "商品説明(日)": "M0304-022-DESC-JA", "商品説明(英)": "M0304-022-DESC-EN", "買取商品説明(日)": "M0304-022-BUY-JA", "買取商品説明(英)": "M0304-022-BUY-EN",
  })], (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-M03-04-VALUES-023", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, [一件("023", { "地域別販売制限": "1", "フリーエリア": "M0304-023-FREE-AREA" })], (m) => reportSeedIssue(seed.シードID, m));
});

// ---- 複数の商品 ----
defineSeed("S-M03-04-PAGING-009", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const defs = Array.from({ length: 11 }, (_, i) => {
    const k = String(i + 1).padStart(2, "0");
    return { 商品コード: rc(`M0304-009-${k}`), 商品名日: `${検索語("M0304CASE009")}-${k}`, 商品の呼び名: `〔商品ID-M0304-009-${k}〕`, 規格の呼び名: `〔規格ID-M0304-009-${k}〕` };
  });
  await 商品を作る(browser, seed.シードID, notes, defs, (m) => reportSeedIssue(seed.シードID, m));
});
/**
 * 使い回し（依頼者決定 2026-11-11「シードの使い回しを進めて」）: 012・013 のシードは中身が同じ（対象の商品1件と補助商品10件。商品名の番号だけ違う）。
 * 使うケースは商品一覧の2ページ目で対象を選び、存在しない商品IDを足して出力を押すだけで、商品を変えず、ダウンロードもされないので、012 の定めで1度だけ作って使い回す。
 * ケースの検索語（商品名）は、作った元（012）の商品名で読む（spec の 二ページ目で足す が ページングの元 を使う）。
 */
export const ページングの元 = (_n: "012" | "013"): "012" => "012";

async function ページングの商品を作る(browser: Browser, seedId: string, n: string, notes: Notes, issue: Issue): Promise<void> {
  // 商品IDは登録した順に大きくなる。対象の商品を先に、補助商品10件を後に取り込む（商品ID降順の2ページ目に対象が来る）
  await 商品を作る(browser, seedId, notes, [{ 商品コード: rc(`M0304-${n}-T`), 商品名日: `${検索語(`M0304CASE${n}`)}-TARGET`, 商品の呼び名: `〔商品ID-M0304-${n}〕`, 規格の呼び名: `〔規格ID-M0304-${n}〕` }], issue);
  // 補助商品の呼び名は、シード表が書く両端（01・10）だけを控える（あいだの 02〜09 はシード表に呼び名が無い）
  await 商品を作る(browser, seedId, notes, Array.from({ length: 10 }, (_, i) => {
    const k = String(i + 1).padStart(2, "0");
    const 端 = k === "01" || k === "10";
    return { 商品コード: rc(`M0304-${n}-${k}`), 商品名日: `${検索語(`M0304CASE${n}`)}-${k}`, ...(端 ? { 商品の呼び名: `〔補助商品ID-M0304-${n}-${k}〕`, 規格の呼び名: `〔補助規格ID-M0304-${n}-${k}〕` } : {}) };
  }), issue);
}
for (const n of ["012", "013"] as const) {
  defineSeed(`S-M03-04-PAGING-NOTFOUND-${n}`, { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
    const 元 = ページングの元(n);
    const canonical = `S-M03-04-PAGING-NOTFOUND-${元}`;
    await 使い回して作る({
      seedId: seed.シードID, canonical, notes,
      rename: (l) => l.replace(`-M0304-${元}`, `-M0304-${n}`),
      build: (nn) => ページングの商品を作る(browser, canonical, 元, nn, (m) => reportSeedIssue(canonical, m)),
    });
  });
}
defineSeed("S-M03-04-MULTI-027", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  await 商品を作る(browser, seed.シードID, notes, [
    { 商品コード: rc("M0304-027-A"), 商品名日: `${検索語("M0304-027-NAME")}-A`, 値: { "基準価格": "1000", "販売価格": "1000", "買取価格": "300" }, 商品の呼び名: "〔商品ID-M0304-027A〕", 規格の呼び名: "〔規格ID-M0304-027A〕" },
    { 商品コード: rc("M0304-027-B"), 商品名日: `${検索語("M0304-027-NAME")}-B`, 値: { "基準価格": "2000", "販売価格": "2000", "買取価格": "400" }, 商品の呼び名: "〔商品ID-M0304-027B〕", 規格の呼び名: "〔規格ID-M0304-027B〕" },
  ], issue);
  issue("言語(ID)・商品公開ステータス・カードセット(ID)・販売制限数は、開発環境で取込が通る値にした（期待結果は見ない列）");
});
defineSeed("S-M03-04-SMOFF-030", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  await 商品を作る(browser, seed.シードID, notes, [{ 商品コード: rc("M0304-030-A"), 商品名日: 検索語("M0304-030-NAME"), 商品の呼び名: "〔商品ID-M0304-030〕", 規格の呼び名: "〔規格ID-M0304-030〕" }], (m) => reportSeedIssue(seed.シードID, m));
});
defineSeed("S-M03-04-ABOL-031", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [r] = await 商品を作る(browser, seed.シードID, notes, [{ 商品コード: rc("M0304-031-A"), 商品名日: 検索語("M0304-031-NAME"), 商品の呼び名: "〔商品ID-M0304-031〕", 規格の呼び名: "〔規格ID-M0304-031〕" }], issue);
  廃止にする(`${seed.シードID}: 商品公開ステータスを廃止にする`, r.商品ID);
  issue("商品公開ステータス「廃止」は画面で指定できないので、E2E の商品の行に DB で書いた");
});

// ---- 状態NMの規格が0件の商品 ----
defineSeed("S-M03-04-NONNM-008", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [r] = await 商品を作る(browser, seed.シードID, notes, [{ 商品コード: rc("M0304-008-NM"), 商品名日: `${検索語("M0304CASE008")}-A`, 商品の呼び名: "〔商品ID-M0304-008〕" }], issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔規格ID-M0304-008A〕", await 規格を足す(page, r.商品ID, { 言語: "日本語", 状態: "スライトリープレイド", 商品コード: rc("M0304-008-SP"), 価格: "100" }, `${seed.シードID}: SP の規格`, issue));
    notes.set("〔規格ID-M0304-008B〕", await 規格を足す(page, r.商品ID, { 言語: "日本語", 状態: "モデレトリープレイド", 商品コード: rc("M0304-008-MP"), 価格: "100" }, `${seed.シードID}: MP の規格`, issue));
    await 規格を削除する(page, r.商品ID, r.規格ID, `${seed.シードID}: 取込で作られた NM の規格`, issue);
  });
  issue("状態NMの規格0件は、取込で作られた NM の規格を、SP・MP の規格を足したあとで商品規格登録編集の「商品規格を削除」で消して作った");
});
defineSeed("S-M03-04-CBNONNM-034", { needs: ["S-M03-04-MASTER"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [a] = await 商品を作る(browser, seed.シードID, notes, [
    { 商品コード: rc("M0304-CB034-A-C"), 商品名日: `${検索語("M0304-CB034")}-A`, 商品の呼び名: "〔商品ID-M0304-034A〕", 規格の呼び名: "〔規格ID-M0304-034A〕" },
    { 商品コード: rc("M0304-CB034-B-C"), 商品名日: `${検索語("M0304-CB034")}-B`, 商品の呼び名: "〔商品ID-M0304-034B〕", 規格の呼び名: "〔規格ID-M0304-034B〕" },
  ], issue);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔規格ID-M0304-034AS〕", await 規格を足す(page, a.商品ID, { 言語: "日本語", 状態: "スライトリープレイド", 商品コード: rc("M0304-CB034-A-C-S"), 価格: "100" }, `${seed.シードID}: 商品A の SP の規格`, issue));
    await 規格を削除する(page, a.商品ID, a.規格ID, `${seed.シードID}: 商品A の取込で作られた NM の規格`, issue);
  });
  issue("商品A の状態NMの規格0件は、取込で作られた NM の規格を、SP の規格を足したあとで「商品規格を削除」で消して作った");
});
