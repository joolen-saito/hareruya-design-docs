/**
 * M03-30 基準価格変更CSV登録の画面シード。正本: cases/M03-30_seed_data.tsv
 *
 * 作るのは、実装したケース（014・032・037・055・059）が使うシードだけ。
 * - S-M03-30-ADM: メンバー管理で試験管理者を登録する（M03-29 と同じ作り方。所属店舗は選択肢の先頭、権限はシステム管理者）。
 * - S-M03-30-MASTER: 投入方法は「DBシードで言語ID=1を登録し、言語ID=999と商品ID=999999999が未登録であることを確認する」。
 *   言語ID=1（日本語）は手元のDBに既にあるので、DBへは何も書かず、画面で確かめるだけにする（商品規格の登録画面の言語の欄に、
 *   値1の「日本語」があり、値999が無いこと。商品マスターで商品ID 999999999 の商品が無いこと）。シード表の作り方と違うので、
 *   これを使うケースは「条件付き合格」に分ける（記録の注記）。
 * - S-M03-30-DATA-014・DATA-055・DATA-059: 取込ファイルと、055・059 はグッズ商品CSV登録で作る商品。
 *
 * 取込ファイルの列名は、ケースの手順2が書く「商品ID、言語ID、基準価格、買取価格、原価単価」（設計書 L0139〜L0143 の5列と同じ）。
 * UTF-8・タブ区切り・改行は LF・末尾に改行1個（fixtures の README と同じ決め方。正本は改行の種類を書かない）。
 * ファイルは実行のたびに e2e/.state/m03-30/<ケース番号>/ に作る（ファイル名は正本どおり。取込履歴にファイル名が残る）。
 *
 * 作らないシード（使うケースも実装しない。理由は e2e/review/M03-30_progress_2026-10-21.md）:
 * - DATA-001〜013・015〜018・020〜024・026〜031・033〜036、HISTORY-039・040・042、各 MULTI/MIX/DISC/BUYDISC/BOTH/EQUAL/AGAIN/DUP/SMAREGI/CBPRICE/CBSMAREGI、
 *   RB-MASTER: 投入方法に「DBへ直接設定する」がある（販売価格・価格履歴・原価単価・取込履歴など）。
 * - DATA-025: 取込ファイルのデータ行の値が正本に無い（「数値のデータ行」だけ）。
 * - DATA-043・054・056〜058・063・064: カード指定の「商品を登録」で割引率（必須）を選ばざるを得ず、状態「割引率設定なし」にできない。
 *   SP・MP・HP・その他の規格の価格の換算に割引率が効くので、ケースの結果が変わる。
 * - DATA-044・060〜062: スマレジの試験環境への連携と、部門「ショーケース」（手元のDBに無い）が要る。
 * - THRESH: 設定画面が無い（閾値はアプリに固定）。ASYNC: 非同期処理の基盤の操作（環境の操作）。
 * - QC-*（073〜076）: QC-MASTERS が、DBへ直接設定する割引率A（S-M03-02-MASTERS）と、手元のDBに無い部門「ショーケース」を選べることを求める。
 *   074・076 はユニサーチ（外部サービス）の試験環境も要る。
 */
import fs from "node:fs";
import path from "node:path";
import { expect, Page } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { getSeed } from "../lib/catalog";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { readLanguageChoicesFromClassForm } from "../pages/admin/m03_01_product_class";
import { classRowsFromProductEdit } from "../pages/admin/m03_23_seed_products";
import { PriceCsvUploadPage } from "../pages/admin/m03_30_price_csv";
import {
  assignFirstCard, classStatusLabel, displayedClassId, displayedProductIdOnClassEdit, expectNoProductWithId,
  openClassEdit, registerGoodsProduct,
} from "../pages/admin/m03_30_products";
import { ProductSearchPage } from "../pages/admin/product_search";

export const M0330_ADMIN: Account = { loginId: "m0330_admin", password: "Passw0rd!M0330" };

/** ケースの手順2が書く列名（設計書の5列） */
export const M0330_COLUMNS = ["商品ID", "言語ID", "基準価格", "買取価格", "原価単価"];

const RUNTIME_DIR = path.join(STATE_DIR, "m03-30");

/** ケースが選ぶ取込ファイルの場所（シードが実行のたびに作る） */
export function m0330FilePath(caseNo: string, file: string): string {
  return path.join(RUNTIME_DIR, caseNo, file);
}

/** UTF-8・タブ区切りのファイルを作る（見出し行＋データ行。LF・末尾に改行1個） */
function writeTsv(seedId: string, caseNo: string, file: string, row: string[]): void {
  const attrs = getSeed(seedId)["状態・属性"];
  if (!attrs.includes(file)) throw new Error(`${seedId}: シード表の状態・属性にファイル名 ${file} が無い`);
  const dir = path.join(RUNTIME_DIR, caseNo);
  fs.mkdirSync(dir, { recursive: true });
  const text = [M0330_COLUMNS, row].map((r) => r.join("\t")).join("\n") + "\n";
  fs.writeFileSync(path.join(dir, file), text, "utf-8");
}

// ---- 管理者・マスタ ----

async function createAdmin(page: Page): Promise<void> {
  await page.goto(adminUrl("/setting/system/member/new"));
  const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "")
    .map((option) => option.textContent?.trim() ?? "")
    .filter(Boolean));
  if (stores.length === 0) throw new Error("S-M03-30-ADM: メンバーに割り当てられる店舗が画面に無い");
  const store = stores[0];
  await ensureMember(page, {
    名前: "M03-30試験管理者", 所属店舗: store, ログインID: M0330_ADMIN.loginId, メールアドレス: "m0330_admin@example.test",
    パスワード: M0330_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: store, 編集可能店舗: [store],
  });
}

defineSeed("S-M03-30-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => createAdmin(page));
  // ログインでき（稼働中・ロックなし）、基準価格変更CSVアップロード画面を開けることを、ケースとは別のセッションで確かめる
  await withAdminSession(browser, M0330_ADMIN, async (page) => {
    const upload = new PriceCsvUploadPage(page, "基準価格変更");
    await upload.open();
    await expect(upload.アップロードボタン, "M03-30試験管理者で基準価格変更CSVアップロード画面を開けない").toBeVisible();
  });
});

defineSeed("S-M03-30-MASTER", async ({ browser, seed }) => {
  const id = seed.シードID;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const languages = await readLanguageChoicesFromClassForm(page);
    const one = languages.filter((l) => l.id === "1");
    if (one.length !== 1 || one[0].label !== "日本語") throw new Error(`${id}: 商品規格の登録画面の言語の欄に、値1の「日本語」が無い: ${JSON.stringify(languages)}`);
    if (languages.some((l) => l.id === "999")) throw new Error(`${id}: 商品規格の登録画面の言語の欄に、値999がある（言語ID=999 は未登録のはず）`);
    await expectNoProductWithId(page, "999999999", id);
  });
  reportSeedIssue(id, "投入方法の「DBシードで言語ID=1を登録」は行わず（DBへ書かない決まり）、言語ID=1（日本語）が既にあることを商品規格の登録画面の言語の欄で確かめた。言語ID=999 が選択肢に無いこと、商品ID=999999999 の商品が商品マスターに無いことも画面で確かめた");
});

// ---- 014 ----

defineSeed("S-M03-30-DATA-014", async ({ browser, seed }) => {
  const id = seed.シードID;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await expectNoProductWithId(page, "999999999", id);
    const upload = new PriceCsvUploadPage(page, "基準価格変更");
    await upload.open();
    // 一覧は1ページ目だけを出すので、表示件数を最大にして全件を見る
    await upload.showHistoryCount("12000");
    const rows = await upload.historyRows();
    const same = rows.filter((r) => r.ファイル名 === "missing_product.tsv");
    if (same.length) throw new Error(`${id}: 基準価格変更CSVアップロード画面の取込履歴に missing_product.tsv の行が既にある（${same.length}件）。同名の取込履歴=0件にできない`);
  });
  writeTsv(id, "014", "missing_product.tsv", ["999999999", "1", "1200", "500", "350"]);
});

// ---- 055・059（グッズ商品CSV登録で作る商品） ----

/** 正本「商品マスター画面で商品名(日/英)に名前を入れて検索し、該当商品の商品登録編集画面を開く」。開いた商品の商品IDを返す */
async function openProductEditByName(page: Page, name: string, what: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.field("product_name").fill(name);
  await search.submitAndWaitForResult();
  const rows = page.locator('tr[id^="ex-product-"]').filter({ has: page.locator("td:nth-child(3) a", { hasText: new RegExp(`^\\s*${name}\\s*$`) }) });
  await expect(rows, `${what}: 商品名「${name}」の商品が商品マスターの検索結果に1件`).toHaveCount(1);
  const productId = ((await rows.first().locator("td:nth-child(2)").textContent()) ?? "").trim();
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${productId}/edit`)), rows.first().locator("td:nth-child(3) a").click()]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), `${what}: 商品登録編集画面`).toBeVisible();
  return productId;
}

/** グッズ商品CSV登録の1行（正本の DATA-055・059 の値）。商品公開ステータス・支店の商品公開ステータスは registerGoodsCsv が「公開」を表す値にする */
function goodsValues(standard: string, buy: string): Record<string, string> {
  return {
    "言語(ID)": "1", "サイズ": "1", "重量": "1",
    "基準価格": standard, "販売価格": standard, "買取価格": buy, "原価単価": "0", "スマレジ連携フラグ": "0",
  };
}

/**
 * 商品登録編集画面（開いた状態）から規格設定で商品規格一覧を開き、ただ1つの規格（グッズ商品CSV登録でできたニアミント）の編集ボタンで
 * 商品規格登録編集画面を開き、公開ステータスが公開であることを確かめ、表示された商品IDと商品規格IDを読む。
 */
async function readOnlyClass(page: Page, productId: string, code: string, what: string): Promise<{ productId: string; classId: string }> {
  const rows = await classRowsFromProductEdit(page, productId);
  if (rows.length !== 1 || rows[0].商品コード !== code || rows[0].状態 !== "NM") {
    throw new Error(`${what}: 商品規格一覧の行が、商品コード ${code}・NM の1件でない: ${JSON.stringify(rows)}`);
  }
  await openClassEdit(page, productId, rows[0].商品規格ID);
  const status = await classStatusLabel(page);
  if (status !== "公開") throw new Error(`${what}: 商品規格の公開ステータスが「${status}」（公開のはず）`);
  return { productId: await displayedProductIdOnClassEdit(page), classId: await displayedClassId(page) };
}

defineSeed("S-M03-30-DATA-055", async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  const name = "M0330試験商品055";
  const issue = (m: string) => reportSeedIssue(id, m);
  const got = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await registerGoodsProduct(page, { what: id, code: "M0330-055", nameJp: name, nameEn: name, values: goodsValues("200", "100"), onIssue: issue });
    const productId = await openProductEditByName(page, name, id);
    await assignFirstCard(page, { productId, productNameJp: name, productNameEn: name }, id, issue);
    return readOnlyClass(page, productId, "M0330-055", id);
  });
  notes.set("〔商品ID-M0330-055〕", got.productId);
  notes.set("〔商品規格ID-M0330-055〕", got.classId);
  writeTsv(id, "055", "smaregi-055.tsv", [got.productId, "1", "1000", "100", "80"]);
});

defineSeed("S-M03-30-DATA-059", async ({ browser, seed, notes }) => {
  const id = seed.シードID;
  const name = "M0330試験商品059";
  const issue = (m: string) => reportSeedIssue(id, m);
  const got = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await registerGoodsProduct(page, { what: id, code: "M0330-059", nameJp: name, nameEn: name, values: goodsValues("200", "100"), onIssue: issue });
    const productId = await openProductEditByName(page, name, id);
    return readOnlyClass(page, productId, "M0330-059", id);
  });
  notes.set("〔商品ID-M0330-059〕", got.productId);
  notes.set("〔商品規格ID-M0330-059〕", got.classId);
  writeTsv(id, "059", "smaregi-059.tsv", [got.productId, "1", "500", "100", "80"]);
});
