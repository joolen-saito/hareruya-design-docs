/**
 * 管理画面 商品管理「部門CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_20_admin_product_product_department_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、DB副作用を伴う成功系/要シードは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-20_admin_product_product_department_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は打ち切り＝ロールバックされ非破壊。
 * 成功系(010,011,035)は mtb_section を INSERT/UPDATE する破壊的ケースのため fixme（ケース表 付帯表3 のシード/後始末で管理）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductDepartmentCsvImportPage } from "../../../pages/admin/m03/m03_20_admin_product_product_department_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml / 設計書本文に引用された打ち切りメッセージ)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_INVALID_FORMAT = "CSVのフォーマットが一致しません"; // :1561 admin.common.csv_invalid_format
const MSG_NO_DATA = "CSVデータが存在しません"; // :1562 admin.common.csv_invalid_no_data
const MSG_SUCCESS = "CSVファイルをアップロードしました"; // :1409 admin.common.csv_upload_complete
const ROW_ID_NOT_NUMERIC = "1行目の部門IDが存在しません。"; // CsvImportController.php:1141
const ROW_ID_NOT_EXIST =
  "1行目の更新対象の部門IDが存在しません。新規登録の場合は、部門IDの値を空で登録してください。"; // :1147
const ROW_NAME_EMPTY = "1行目部門名が設定されていません。"; // :1154
const ROW_CODE_EMPTY = "1行目部門コードが設定されていません。"; // :1162
const ROW_TAX_EMPTY = "1行目免税区分が設定されていません。"; // :1170

// 取込CSVのヘッダ（getDepartmentCsvHeader の trans 値順 CsvImportController.php:2140-2169）。
const HEADER = "部門ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ";

const DEPT_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/department_csv_upload`;
const DEPT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/department_csv_upload(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 部門CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-20-040 未ログインで部門CSV登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(DEPT_PATH);
      // 管理ログイン画面へ誘導（権限・認可）。URL（管理ログインルート）とログインフォームの双方で観測。
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`));
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-20-001 画面UI: ファイル選択・一括登録・フォーマット表・雛形リンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-20-ADMIN）");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-20-002 タイトル「部門CSV登録」・サブタイトル「商品管理」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("部門CSV登録"); // title block messages:3727
      await expect(page.locator("body")).toContainText("商品管理"); // sub_title messages:1723
    });

    test("E2E-M03-20-003 フォーマット表で部門名・部門コード・免税区分に必須バッジが付く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      // 必須ヘッダは name/code/tax_free_division の3列（getDepartmentCsvHeader）。フォーマット表内の「必須」バッジは3個。
      const table = page.locator("#ex-csv_section-format");
      await expect(table.getByText("部門名")).toBeVisible();
      await expect(table.getByText("部門コード")).toBeVisible();
      await expect(table.getByText("免税区分")).toBeVisible();
      await expect(table.getByText("必須", { exact: true })).toHaveCount(3);
    });

    test("E2E-M03-20-004 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（部門名空＝行エラーで打ち切り・ロールバック）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("e2e_no_confirm.csv", `${HEADER}\n,,E2E-A,1,1\n`);
      await expect(csv.errors).toContainText(ROW_NAME_EMPTY); // POSTが直接実行された証跡
      expect(dialogShown).toBe(false); // 確認ダイアログなし（仕様: モーダル・ポップアップなし）
    });

    test("E2E-M03-20-005 雛形ダウンロードボタンで department.csv の取得が発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("department.csv"); // ファイル名のみ（内容は手動確認）
    });

    // ===== 取込バリデーション（要管理ログイン・打ち切り＝ロールバックで非破壊） =====

    test("E2E-M03-20-020 ファイル未選択で一括登録するとエラーが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadButton.click(); // ファイル未選択のまま送信
      await expect(csv.errors.first()).toBeVisible(); // エラー表示（文言は要実機確認＝不具合候補#1）
      await expect(page).toHaveURL(DEPT_RE); // 同画面に留まる
    });

    test("E2E-M03-20-021 ヘッダ不一致のCSVで「CSVのフォーマットが一致しません」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_bad_header.csv", "col1,col2\nv1,v2\n");
      await expect(csv.errors).toContainText(MSG_INVALID_FORMAT);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-022 必須ヘッダ（免税区分）欠落のCSVで形式エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv(
        "e2e_missing_header.csv",
        "部門ID,部門名,部門コード,MTGBuyer表示フラグ\n,E2E部門,E2E-A,1\n"
      );
      await expect(csv.errors).toContainText(MSG_INVALID_FORMAT);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-024 必須ヘッダ（部門名）欠落のCSVで形式エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      // 必須ヘッダ集合（name/code/tax_free_division）の包含検証。部門名欠落→形式エラー（処理フロー4 / 判定順序#2）。
      await csv.uploadCsv(
        "e2e_missing_name_header.csv",
        "部門ID,部門コード,免税区分,MTGBuyer表示フラグ\n,E2E-A,1,1\n"
      );
      await expect(csv.errors).toContainText(MSG_INVALID_FORMAT);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-025 必須ヘッダ（部門コード）欠落のCSVで形式エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv(
        "e2e_missing_code_header.csv",
        "部門ID,部門名,免税区分,MTGBuyer表示フラグ\n,E2E部門,1,1\n"
      );
      await expect(csv.errors).toContainText(MSG_INVALID_FORMAT);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-036 2行目失敗で全体ロールバック・「2行目部門名が設定されていません。」打ち切り", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      // 1行目は有効・2行目で部門名空→打ち切り。commit未到達で全体ロールバック＝非破壊（設計書「行途中失敗でロールバック」）。
      // 期待は「2行目…」で2行目まで処理が進み打ち切られたこと（行番号起点）を観測。先行行を含むDB未反映の照合は手動/間接。
      await csv.uploadCsv(
        "e2e_row2_fail.csv",
        `${HEADER}\n,E2E部門1,E2E-1,1,1\n,,E2E-2,1,1\n`
      );
      await expect(csv.errors).toContainText("2行目部門名が設定されていません。"); // CsvImportController.php:1154 起点=$data->key()+1
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-023 ヘッダのみ（データ行0）で「CSVデータが存在しません」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_no_data.csv", `${HEADER}\n`);
      await expect(csv.errors).toContainText(MSG_NO_DATA);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-030 部門ID非数字で「1行目の部門IDが存在しません。」打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_id_nan.csv", `${HEADER}\nabc,E2E部門,E2E-A,1,1\n`);
      await expect(csv.errors).toContainText(ROW_ID_NOT_NUMERIC);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-031 存在しない部門IDで更新対象不存在エラー打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      // 実在しない大きな数値ID（非破壊：更新対象が無く打ち切り）。
      // 要確認: 99999999 の不存在はDB状態に依存する。オラクル独立性のため、環境では
      // mtb_section に当該ID行が存在しないことをシードで保証する（付帯表3 参照）。
      await csv.uploadCsv("e2e_id_missing.csv", `${HEADER}\n99999999,E2E部門,E2E-A,1,1\n`);
      await expect(csv.errors).toContainText(ROW_ID_NOT_EXIST);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-032 部門名空で「1行目部門名が設定されていません。」打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_name_empty.csv", `${HEADER}\n,,E2E-A,1,1\n`);
      await expect(csv.errors).toContainText(ROW_NAME_EMPTY);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-033 部門コード空で「1行目部門コードが設定されていません。」打ち切り", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_code_empty.csv", `${HEADER}\n,E2E部門,,1,1\n`);
      await expect(csv.errors).toContainText(ROW_CODE_EMPTY);
      await expect(page).toHaveURL(DEPT_RE);
    });

    test("E2E-M03-20-034 免税区分空で「1行目免税区分が設定されていません。」打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDepartmentCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_tax_empty.csv", `${HEADER}\n,E2E部門,E2E-A,,1\n`);
      await expect(csv.errors).toContainText(ROW_TAX_EMPTY);
      await expect(page).toHaveURL(DEPT_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-20-010 部門ID空の有効CSV取込で成功メッセージ（要: 後始末＝接頭辞E2Eの mtb_section 削除。破壊的）",
      async () => {
        // 期待は仕様(処理フロー11 / messages.ja.yaml:1409「CSVファイルをアップロードしました」)由来。
        // mtb_section へ INSERT する破壊的ケース。SEED-M03-20-CSV-NEW の後始末を整備後に実装。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-20-011 既存部門ID指定の有効CSV取込で成功メッセージ（要: SEED-M03-20-SECTION＋値復元。破壊的）",
      async () => {
        // 期待は仕様(業務ルール: 既存IDで更新)由来。既知IDの既存 mtb_section を用意し更新後に値を復元する。
      }
    );

    test.fixme(
      "E2E-M03-20-035 免税区分に非数値文字列でも空でなければ取込成功（要: 後始末・不具合候補#3で型整合 要実機確認。破壊的）",
      async () => {
        // 期待は仕様(エッジケース: 数値以外の厳密拒否なし)由来。tax_free_division 列の型整合は実機確認後に実装。
      }
    );
  }
);
