/**
 * M03-05 セール用価格変更CSV出力の画面シード。正本: cases/M03-05_seed_data.tsv
 * 実装するケースは 005・006・007・011・014・017（作らないケースと理由は e2e/review/M03-05_progress_2026-11-21_dev.md）。
 *
 * シードでの解釈（正本の外の補い。記録にも書く）:
 * - S-M03-05-MASTER（店舗・在庫場所・言語・状態・タグ・商品公開ステータスを DB シードで登録）は、DB シードで登録しない決まりなので、
 *   開発環境に既にあるものを使う。商品一覧の状態の選択肢に NM・SP があることと、本店（店舗ID 1）の店名を読めることだけを確かめる。
 * - S-M03-05-CONFIG（CSV出力設定 UTF-8・カンマ）は、アプリの設定ファイルの値で画面から設定できない。開発環境の設定をそのまま使う
 *   （UTF-8・カンマであることは、007 の結果で確かめる）。
 * - 商品はグッズ商品CSV登録で作る。商品コードと商品名(日)には実行の印 rc() を付ける（検索の結果をこの実行の商品だけにするため）。
 *   正本が値を示さない必須の列は、取込が通る値（registerGoodsCsv の決め方）。
 * - 商品ID 999999006・999999011 が未登録であることは、商品一覧で商品IDを入れて検索する代わりに、DB を参照して確かめる（読むだけ）。
 * - 007・014 の在庫10・総原価2500・原価単価250: 在庫編集の入庫は F06-09 のシードと同じ部品（在庫を入れて在庫IDを読む）で行うので、
 *   仕入単価は0・在庫変動理由は部品の決まりの文になる（原価単価は250でなく0）。ケースの期待結果は在庫・原価の値を見ないので結果に関わらない。
 * - 017 の「状態SPの規格2件・状態NMの規格0件」: 規格ID 017A を DB で状態SPにする作り方は使わず、商品規格一覧の「新規作成」で状態SPの規格を2件足し、
 *   取込で作られた状態NMの規格を「商品規格を削除」で消して作る（M03-04 の 034 と同じ。〔規格ID-M0305-017A〕・〔規格ID-M0305-017B〕は足した2件の規格ID）。
 */
import { Browser, Page } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { 商品があるか } from "../db/m03_04_x";
import { 取込の商品と規格を読む, 規格を足す, 規格を削除する } from "../pages/admin/a17_05_setup";
import { 在庫を入れて在庫IDを読む } from "../pages/admin/f06_09_setup";
import { downloadGoodsCsvTemplate } from "../pages/admin/m03_01_goods_csv";
import { registerGoodsCsv } from "../pages/admin/m03_01_goods_register";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { openClassEdit, openClassList, saveClassEdits } from "../pages/admin/m03_30_products";
import { storeNameById } from "../pages/admin/m04_19_masters";
import { ensureMember } from "../pages/admin/member";
import { ProductSearchPage } from "../pages/admin/product_search";

type Issue = (m: string) => void;
type 行 = { 商品コード: string; 商品名日: string; 値?: Record<string, string> };

/** 開発環境に同じログインIDの試験管理者（だれの回で作られたか分からない）がありうるので、ログインID・名前に決まった印を付けて1度だけ作る（M03-04 と同じ） */
export const M0305_ADMIN: Account = { loginId: rcFixed("m0305_admin").toLowerCase(), password: "Passw0rd!M0305" };

/** 商品名(日)の検索の言葉（印つき）。正本の「商品名=M0305CASE005」などの読み替え */
export const 検索語 = (正本: string): string => rc(正本);

/** 英字の連番 A〜K（シード表の呼び名の末尾） */
const 英字 = "ABCDEFGHIJK";

async function 取り込む(page: Page, seedId: string, lines: 行[], issue: Issue): Promise<void> {
  const categoryId = await readGoodsRootCategoryId(page);
  const template = await downloadGoodsCsvTemplate(page);
  const zeros = Object.fromEntries(template.headers.filter((h) => h.includes("地域") || h.includes("スマレジ連携")).map((h) => [h, "0"]));
  await registerGoodsCsv(page, {
    what: `${seedId} のグッズ商品CSV登録`, fileName: `${rc(seedId.toLowerCase())}.csv`, categoryId, common: zeros,
    lines: lines.map((l) => ({ code: l.商品コード, nameJp: l.商品名日, nameEn: `${l.商品名日}-EN`, values: l.値 ?? {} })),
    onWarning: (w) => issue(`グッズ商品CSV登録の警告「${w}」`), uploadWaitMs: 300_000,
  });
}

/** 取り込んだ商品ごとに、商品IDと（取込で作られた NM の）規格IDを読む */
async function 商品を作る(browser: Browser, seedId: string, lines: 行[], issue: Issue): Promise<{ 商品ID: string; 規格ID: string }[]> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await 取り込む(page, seedId, lines, issue);
    const out: { 商品ID: string; 規格ID: string }[] = [];
    for (const l of lines) out.push(await 取込の商品と規格を読む(page, l.商品コード, issue));
    return out;
  });
}

// ---- 管理者・マスタ・設定 ----
defineSeed("S-M03-05-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const shop = await storeNameById(page, "1");
    await ensureMember(page, {
      名前: rcFixed("M03-05試験管理者"), 所属店舗: shop, ログインID: M0305_ADMIN.loginId, メールアドレス: `${M0305_ADMIN.loginId}@example.test`,
      パスワード: M0305_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
    });
  });
  // ログインでき、商品管理（商品一覧）を操作できること（ケースのセッションとは別）
  await withAdminSession(browser, M0305_ADMIN, async (page) => { await new ProductSearchPage(page).open(); });
});

defineSeed("S-M03-05-MASTER", async ({ browser, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const s = new ProductSearchPage(page);
    await s.open();
    await s.ensureDetailVisible();
    const 状態 = (await s.choiceOptions("card_condition")).map((c) => c.label);
    for (const [want, 略称] of [["ニアミント", "NM"], ["スライトリープレイド", "SP"]] as const) {
      if (!状態.some((l) => l.startsWith(want) || l.trim() === 略称)) throw new Error(`商品一覧の状態の選択肢に「${want}」（${略称}）が無い（${状態.join("、")}）`);
    }
    await storeNameById(page, "1");
  });
  reportSeedIssue(seed.シードID, "店舗・在庫場所・言語・状態・タグ・商品公開ステータスは DB シードで登録せず、開発環境に既にあるものを使った（状態 NM・SP が商品一覧の選択肢にあること、本店の店名を読めることを画面で確かめた。タグ8・12・20はこの機能で実装するケースが使わないので確かめていない）");
});

defineSeed("S-M03-05-CONFIG", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "CSV出力の文字コード・区切り文字はアプリの設定ファイルの値で、画面から設定できない。開発環境の設定をそのまま使った（UTF-8・カンマであることは、ケースの結果で確かめる）");
});

// ---- 2ページ目（005・011） ----
function ページングの行(n: "005" | "011"): 行[] {
  return Array.from({ length: 11 }, (_, i) => {
    const k = String(i + 1).padStart(2, "0");
    return { 商品コード: rc(`M0305-${n}-${k}`), 商品名日: `${検索語(`M0305CASE${n}`)}-${k}` };
  });
}
async function ページングの商品を作る(browser: Browser, seedId: string, n: "005" | "011", notes: Notes): Promise<void> {
  const r = await 商品を作る(browser, seedId, ページングの行(n), (m) => reportSeedIssue(seedId, m));
  r.forEach((x, i) => {
    notes.set(`〔商品ID-M0305-${n}${英字[i]}〕`, x.商品ID);
    notes.set(`〔規格ID-M0305-${n}${英字[i]}〕`, x.規格ID);
  });
}
defineSeed("S-M03-05-PAGING-005", { needs: ["S-M03-05-MASTER"] }, async ({ browser, notes, seed }) => {
  await ページングの商品を作る(browser, seed.シードID, "005", notes);
});
defineSeed("S-M03-05-PAGING-NOTFOUND-011", { needs: ["S-M03-05-MASTER"] }, async ({ browser, notes, seed }) => {
  if (商品があるか("999999011")) throw new Error(`${seed.シードID}: 商品ID 999999011 が登録されている（未登録のはず）`);
  await ページングの商品を作る(browser, seed.シードID, "011", notes);
  reportSeedIssue(seed.シードID, "商品ID 999999011 が未登録であることは、商品一覧で検索する代わりに DB を参照して確かめた");
});

// ---- 1件の商品 ----
defineSeed("S-M03-05-NOTFOUND-006", { needs: ["S-M03-05-MASTER"] }, async ({ browser, notes, seed }) => {
  if (商品があるか("999999006")) throw new Error(`${seed.シードID}: 商品ID 999999006 が登録されている（未登録のはず）`);
  const [r] = await 商品を作る(browser, seed.シードID, [{ 商品コード: rc("M0305-006-A"), 商品名日: `${検索語("M0305CASE006")}-A` }], (m) => reportSeedIssue(seed.シードID, m));
  notes.set("〔商品ID-M0305-006〕", r.商品ID);
  notes.set("〔規格ID-M0305-006〕", r.規格ID);
  reportSeedIssue(seed.シードID, "商品ID 999999006 が未登録であることは、商品一覧で検索する代わりに DB を参照して確かめた");
});

/** 007・014: 商品1件 → セールフラグ・販売価格900・帯URL → 本店EC-CUBEの在庫10（入庫して承認） */
async function セールと在庫のある商品(browser: Browser, seedId: string, n: "007" | "014", notes: Notes): Promise<void> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const code = rc(`M0305-${n}-A`);
  const [r] = await 商品を作る(browser, seedId, [{
    商品コード: code, 商品名日: `${検索語(`M0305CASE${n}`)}-A`,
    値: { "言語(ID)": "1", "基準価格": "1000", "販売価格": "1000", "買取価格": "300" },
  }], issue);
  notes.set(`〔商品ID-M0305-${n}〕`, r.商品ID);
  notes.set(`〔規格ID-M0305-${n}〕`, r.規格ID);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // openClassEdit は商品規格一覧を開いた状態で使う（新しいセッションは管理画面のホームから始まる）
    await openClassList(page, r.商品ID);
    await openClassEdit(page, r.商品ID, r.規格ID);
    await saveClassEdits(page, { 帯URL: "https://replace-dev.hareruyamtg.com:8443/belt/a", セール販売価格: "900" }, `${seedId}: セールの設定`, issue);
  });
  const stock = await 在庫を入れて在庫IDを読む(browser, seedId, [{ 商品コード: code, 商品規格ID: r.規格ID, 数: 10 }], issue);
  notes.set(`〔通販在庫ID-M0305-${n}〕`, stock.get(r.規格ID)!.在庫ID);
  issue("在庫の入庫は F06-09 のシードと同じ部品で行ったので、仕入単価は0・在庫変動理由は部品の決まりの文（正本は仕入単価250・理由「M03-05試験データ」）。ケースの期待結果は在庫・原価の値を見ない");
}
defineSeed("S-M03-05-FORMAT-007", { needs: ["S-M03-05-MASTER", "S-M03-05-CONFIG"] }, async ({ browser, notes, seed }) => {
  await セールと在庫のある商品(browser, seed.シードID, "007", notes);
});
defineSeed("S-M03-05-NOTAG-014", { needs: ["S-M03-05-MASTER", "S-M03-05-CONFIG"] }, async ({ browser, notes, seed }) => {
  await セールと在庫のある商品(browser, seed.シードID, "014", notes);
});

// ---- 状態NMの規格が0件の商品（017） ----
defineSeed("S-M03-05-CBNONNM-017", { needs: ["S-M03-05-MASTER", "S-M03-05-CONFIG"] }, async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const [r] = await 商品を作る(browser, seed.シードID, [{ 商品コード: rc("M0305-CB017-A"), 商品名日: `${検索語("M0305-CB017")}-A` }], issue);
  notes.set("〔商品ID-M0305-017〕", r.商品ID);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    notes.set("〔規格ID-M0305-017A〕", await 規格を足す(page, r.商品ID, { 言語: "日本語", 状態: "スライトリープレイド", 商品コード: rc("M0305-CB017-A-S1"), 価格: "100" }, `${seed.シードID}: SP の規格（1件目）`, issue));
    notes.set("〔規格ID-M0305-017B〕", await 規格を足す(page, r.商品ID, { 言語: "日本語", 状態: "スライトリープレイド", 商品コード: rc("M0305-CB017-A-S2"), 価格: "100" }, `${seed.シードID}: SP の規格（2件目）`, issue));
    await 規格を削除する(page, r.商品ID, r.規格ID, `${seed.シードID}: 取込で作られた NM の規格`, issue);
  });
  issue("状態SPの規格2件・状態NMの規格0件は、DB で状態を書き換えず、商品規格一覧の「新規作成」で状態SPの規格を2件足し、取込で作られた NM の規格を「商品規格を削除」で消して作った（〔規格ID-M0305-017A〕・〔規格ID-M0305-017B〕は足した2件）");
});
