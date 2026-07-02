/**
 * 管理画面 ネット買取管理 > 買取一覧「戻しリストCSV」出力 E2E。
 * 納品ケース表 integration_test/e2e/m07_08_admin_online_purchase_purchase_online_return_list_csv_export_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースと、自動化予定だが未実装/要実機の test.fixme のみを置く。
 * 手動/対象外（CSV内容検査・restocked_flg・CSRF内部・ログ抑止・一覧検索委譲 等）はケース表で全量管理する。
 * 期待結果は仕様（基本設計 Excel／正本md m07-08／messages.ja.yaml の文言確認）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行前提:
 *  - ログインは config の ECCUBE_ADMIN_USER/PASS（未設定なら test.skip でガード）。
 *  - 002/003/010/011/020 は検索結果1件以上が必要（SEED-M07-08-RESTOCK：出力対象=入庫待ち/入庫済み）。
 *  - 010 のダウンロード成功は出力対象として有効なステータスの買取選択が前提。先頭行が対象外だと
 *    エラー側（021相当）に倒れるため、実行時は SEED-M07-08-RESTOCK の対象行を選ぶこと。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OnlinePurchasePurchaseOnlineReturnListCsvExportPage } from "../../../pages/admin/m07/m07_08_admin_online_purchase_purchase_online_return_list_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様文言（messages.ja.yaml）由来。実装に合わせて変えない（オラクル独立性）。
const NO_SELECTION = "1つ以上の買取注文情報を選択してください。"; // :5247

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe("ネット買取管理 > 戻しリストCSV出力", { tag: ["@admin", "@purchase", "@csv"] }, () => {
  // ===== 未認証（資格情報不要・常時実行可） =====

  test("E2E-M07-08-030 未ログインで買取一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/list`);
    await expect(page.locator("#login_id")).toBeVisible(); // 管理ログインへ誘導
  });

  // ===== 入口・UI部品（要ログイン／検索結果1件以上） =====

  test("E2E-M07-08-001 買取一覧画面が表示され戻しリストCSVの入口に到達できる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OnlinePurchasePurchaseOnlineReturnListCsvExportPage(page);
    await target.goto();
    await target.seeListScreen(); // サブタイトル「買取一覧」
  });

  test("E2E-M07-08-002 ダウンロードドロップダウンに「戻しリストCSV」ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OnlinePurchasePurchaseOnlineReturnListCsvExportPage(page);
    await target.goto();
    // ボタン群は検索結果が1件以上のときのみ描画される（SEED-M07-08-RESTOCK 前提）。
    await target.seeReturnListCsvButton();
  });

  test("E2E-M07-08-003 「戻しリストCSV」ボタンのformactionが戻しリスト出力ルートを指す", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OnlinePurchasePurchaseOnlineReturnListCsvExportPage(page);
    await target.goto();
    await expect(target.returnListCsvButton).toHaveAttribute(
      "formaction",
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_return_list$`)
    );
  });

  // ===== 正常系：CSVダウンロード発火 =====

  test("E2E-M07-08-010 出力対象を選択し戻しリストCSVを実行するとCSVダウンロードが発火する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OnlinePurchasePurchaseOnlineReturnListCsvExportPage(page);
    await target.goto();
    await target.selectRow(0); // SEED-M07-08-RESTOCK：出力対象（入庫待ち/入庫済み）であること
    const downloadPromise = page.waitForEvent("download");
    await target.clickReturnListCsv();
    const download = await downloadPromise; // CSVダウンロードが発火すること
    expect(download).toBeTruthy();
    // 仕様: ダウンロード時は画面遷移しない（買取一覧に留まる）。
    await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase`));
  });

  test("E2E-M07-08-011 ダウンロードファイル名が戻しリストCSVの命名規則に従う", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OnlinePurchasePurchaseOnlineReturnListCsvExportPage(page);
    await target.goto();
    await target.selectRow(0);
    const downloadPromise = page.waitForEvent("download");
    await target.clickReturnListCsv();
    const download = await downloadPromise;
    // 仕様: purchase_restock_list_{min買取番号7桁}_{YmdHis}.csv（位置情報＝命名規則）。
    expect(download.suggestedFilename()).toMatch(/^purchase_restock_list_.*\.csv$/);
  });

  // ===== 異常系：選択必須 =====

  test("E2E-M07-08-020 未選択で戻しリストCSVを実行すると選択必須エラーで一覧に留まる", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const target = new OnlinePurchasePurchaseOnlineReturnListCsvExportPage(page);
    await target.goto();
    await target.clickReturnListCsv(); // 何も選択せず実行
    await expect(target.error).toContainText(NO_SELECTION);
    // 仕様: エラー時は買取一覧へリダイレクトして留まる（CSVは出力されない）。
    await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase`));
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M07-08-021 入庫待ち/入庫済み以外のステータスを選択するとステータス相関エラー（要: SEED-M07-08-INVALID-STATUS）",
    async () => {
      // 期待は仕様（出力対象=入庫待ち/入庫済みのみ）由来。対象外ステータスの買取を選び、
      // エラー表示で一覧に留まりCSVが出力されないことを確認する。
      // 注: 許可ステータスの定義・エラーメッセージ文言は設計に明記が薄く実装補完（要確認）のため、
      //     文言の完全一致は固定せず（オラクル混入回避）、エラー表示と未出力で判定する。
    }
  );

  test.fixme(
    "E2E-M07-08-022 存在しない買取番号での出力はデータ不存在エラー（要: 有効CSRF付き直接POST）",
    async () => {
      // 期待は仕様（対象なし）由来。UIからは不存在IDを送れないため、有効CSRFトークンで直接POSTし
      // 「対象のデータが見つかりません。」/「買取番号: {7桁} は存在しません。」を確認する。
    }
  );

  test.fixme(
    "E2E-M07-08-031 POST専用ルートへGET直接アクセスで出力されない（要: 405挙動の実機確認）",
    async () => {
      // 期待は仕様（admin_purchase_csv_export_return_list は methods:['POST']）由来。
      // GET /admin/purchase/csv_export_return_list が CSV を返さず拒否されることを実機確認後に実装。
    }
  );

  test.fixme(
    "E2E-M07-08-032 未認証でPOST /csv_export_return_list は出力されずログイン誘導/拒否（要: 未認証直接POSTの実機確認）",
    async () => {
      // 期待は仕様（権限・ログイン状態の共通判定。POST専用エンドポイントも管理ファイアウォール配下）由来。
      // 未認証セッションで直接POSTし、CSVが出力されず管理ログインへ誘導/拒否されることを実機確認後に実装。
    }
  );
});
