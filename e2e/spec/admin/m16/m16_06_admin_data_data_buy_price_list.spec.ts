/**
 * 管理画面 データ管理 > 買取価格対応表（一覧） E2E。
 * 納品ケース表 integration_test/e2e/m16_06_admin_data_data_buy_price_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、シード/データ依存ケースは test.fixme（理由付き）で保留する。
 * 手動・対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 *
 * 期待結果は仕様(functions/pf-eccube3/m16-06_admin_data_data_buy_price_list.md /
 * integration-test-viewpoints.md)由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 本リポジトリでは未実行の雛形。ec-cube-enterprise の Playwright は実行不可で構造参考のみ。
 *
 * 実行方針: 一覧は管理ログインが前提のため、資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガードする。
 * 資格情報: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（環境変数。コミットしない）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DataDataBuyPriceListPage } from "../../../pages/admin/m16/m16_06_admin_data_data_buy_price_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

/** 管理ログインしてからテスト本体に入る。 */
async function loginAdmin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden(); // ログイン完了
}

test.describe("管理画面 > データ管理 > 買取価格対応表（一覧）", { tag: ["@admin", "@data"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M16-06-009 未ログインで一覧URL直接→管理ログイン画面へ誘導", async ({ page }) => {
    // 仕様(権限・認可: 未到達主体は共通認証で拒否)。位置情報の一覧URLは実装(/data/)由来。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/data/buy_price_list`);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 認証あり（資格情報があるときのみ実行） =====

  test("E2E-M16-06-001 正常: メニュー「データ管理」→「買取価格対応表」で一覧表示", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.gotoViaMenu(); // 親メニュー展開は要実機確認
    // 仕様共通トークン buy_price_list で到達判定（実装固有の /data/ は固定しない＝不具合候補#1）。
    await expect(page).toHaveURL(/\/buy_price_list(\?|$)/);
    await list.seeListPage();
  });

  test("E2E-M16-06-002 URL直接アクセスで一覧(マトリクス)が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.goto();
    await list.seeListPage();
  });

  test("E2E-M16-06-003 一覧のタイトルが「買取価格対応表」", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.goto();
    await expect(list.pageTitle).toContainText("買取価格対応表"); // 仕様(フロント挙動: title)
  });

  test("E2E-M16-06-013 サブタイトルが「一覧」である（設計書フロント挙動）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.goto();
    // 仕様(フロント挙動: サブタイトル「一覧」)。実装は「データ管理」のため失敗時は不具合候補#3を検出する。
    await list.seeSubTitle();
  });

  test("E2E-M16-06-004 表頭「NM価格」「ノーマルカード」「Foil&プロモ版カード」が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.goto();
    await list.seeTableHeaders(); // 仕様(フロント挙動: 表頭二段)
  });

  test("E2E-M16-06-005 サブ表頭にカード状態コードが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.goto();
    // 仕様(フロント挙動: カード状態コードのサブヘッダを2回繰り返す)。
    // コード値自体はマスタ依存のため固定しないが、「同じ並びを2回繰り返す」構造を検証する。
    // ※ 設計書はサブ列を id>1 で生成と記載。実装は全件で列数が乖離し得る（不具合候補#2・要確認）ため、
    //   厳密な列数(3/4)・colspan一致は保留し、ここでは偶数件かつ前半=後半の繰り返し構造のみ判定する。
    const subHeaderCells = list.table.locator("thead tr").nth(1).locator("th");
    const labels = await subHeaderCells.allTextContents();
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.length % 2).toBe(0); // 2ブロック分の繰り返し
    const half = labels.length / 2;
    expect(labels.slice(0, half)).toEqual(labels.slice(half)); // 前半と後半が同一コード列
  });

  test("E2E-M16-06-006 金額セルが編集画面(id付き)へのリンクになっている", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.goto();
    await list.seePriceCellIsEditLink(); // 仕様(画面遷移: セル金額→編集)
  });

  test("E2E-M16-06-007 金額セル押下で編集画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    await list.goto();
    await list.clickFirstPriceCell();
    // 仕様(画面遷移)の編集URL=buy_price_list/{id}。/data/・/edit はオラクルに固定しない（不具合候補#1）。
    await expect(page).toHaveURL(/\/buy_price_list\/\d+/); // 仕様(画面遷移: 編集画面 id付き)
  });

  test("E2E-M16-06-012 一覧GETがHTTP 200で応答する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    const resp = await page.goto(list.url);
    expect(resp?.status()).toBe(200); // 仕様(入出力: 成功時=一覧HTML)
  });

  test("E2E-M16-06-014 任意クエリ付きGETでも一覧が絞り込まれない", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await loginAdmin(page);
    const list = new DataDataBuyPriceListPage(page);
    // 仕様(入出力: クエリパラメータによる絞り込みは無い)。クエリ有無で行数が変わらないことを比較で判定。
    // 期待値に固定行数を書かず、同一環境の2リクエスト間の同値性のみを検証する（オラクル独立）。
    await list.goto();
    const baseRows = await list.table.locator("tbody tr").count();
    await page.goto(`${list.url}?dummy=1`);
    await expect(list.table).toBeVisible();
    const queriedRows = await list.table.locator("tbody tr").count();
    expect(queriedRows).toBe(baseRows); // クエリで絞り込まれない=行数不変
  });

  // ===== 保留（自動化予定だがシード/データ依存・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M16-06-008 マスタに無い組合せには買取価格(編集リンク)が表示されない（要シード SEED-M16-06-GAP: 欠けのある組合せを用意）",
    async () => {
      // 期待は仕様(データ整合性: マスタに存在しない組み合わせはセル自体が無い)由来。
      // 観測=該当組合せに金額(編集リンク)が無いこと。実装の「-」文言はオラクルに用いない（不具合候補#6）。欠けデータを安定生成後に実装。
    }
  );

  test.fixme(
    "E2E-M16-06-010 NM価格行が設計書の列挙順どおりに全行欠落なく描画される（要シード SEED-M16-06-MATRIX: 既知の複数NM価格）",
    async () => {
      // 期待は仕様(処理フロー#5: 最外層キー(NM価格)の列挙順)由来。
      // 設計書は「DB既定順/列挙順」で昇順を明示しないため、昇順固定はオラクルに用いない（昇順は実装挙動=不具合候補#4・要確認）。
    }
  );

  test.fixme(
    "E2E-M16-06-011 既知シード価格が一覧マトリクスに表示される（要シード SEED-M16-06-MATRIX）",
    async () => {
      // 期待は仕様(検索/実行結果 IT-23: 該当レコードが取得結果に含まれる→セルに金額表示)由来。
    }
  );
});
