/**
 * 管理画面 商品管理「売上分析タグ更新CSVアップロード」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_29_admin_product_product_tag_sales_analysis_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、DB副作用を伴う成功系/要シードは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-29_admin_product_product_tag_sales_analysis_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は事前検証エラー/行検証で打ち切り＝ロールバックされ非破壊。
 * 成功系(040,041,043)は dtb_product_tag_sales_analysis を DELETE/INSERT し履歴を INSERT する破壊的ケースのため fixme
 * （ケース表 付帯表3 のシード/後始末で管理）。タグマスタ不存在(042)は実在商品IDを要するため要シードで fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductTagSalesAnalysisCsvImportPage } from "../../../pages/admin/m03/m03_29_admin_product_product_tag_sales_analysis_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_SUCCESS = "登録が完了しました。"; // :1773 admin.register.complete
const MSG_INVALID_FORMAT = "CSVのフォーマットが一致しません"; // :1561 admin.common.csv_invalid_format
// 改行上限超過: admin.csv.error.upload.maxrecord = "%maxRecord% 行を超えるCSVファイルは登録できません。"（:1429）。
// %maxRecord% は実行時に埋め込まれるため、文言全体ではなく安定部分で確認する。
const MSG_MAXROW_PART = "行を超えるCSVファイルは登録できません。"; // :1429
const MAX_ROWS = 5010; // AbstractController.php:364 ADMIN_CSV_IMPORT_MAX_ROWS（>= で打ち切り）

// 取込CSVのヘッダ（getCsvHeader の列順 TagSalesAnalysisCsvController.php:179-185）。
const HEADER = "商品ID,売上分析タグ(ID)";

const UPLOAD_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/csv_upload`;
const TEMPLATE_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/csv_template`;
const IMPORT_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/import`;
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const UPLOAD_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/csv_upload(\\?|$)`
);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 売上分析タグ更新CSVアップロード",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-29-020 未ログインで売上分析タグ更新CSV URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(UPLOAD_PATH);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（権限・認可）
    });

    test("E2E-M03-29-025 未ログインで雛形DL URLへ直接アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(TEMPLATE_PATH);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログインへ誘導（雛形は取得できない）
    });

    test("E2E-M03-29-026 未ログインで取込POST(import)へ直接アクセス→管理ログインへ誘導され取込されない", async ({
      page,
    }) => {
      // 共通ファイアウォールにより未ログインの取込POSTは到達不可。リクエストは管理ログインへ誘導される（取込は実行されない）。
      const resp = await page.request.post(IMPORT_PATH, { failOnStatusCode: false });
      expect(resp.url()).toMatch(LOGIN_RE); // 取込処理に入らず管理ログインへリダイレクト（権限・認可）
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-29-001 画面UI: ファイル入力・送信ボタン・雛形DLリンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-29-ADMIN）");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-29-002 タイトル「商品管理」・サブタイトル「売上分析タグ更新CSVアップロード」・見出し「売上分析タグ更新CSV」", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("商品管理"); // title block messages:1723
      await expect(page.locator("body")).toContainText("売上分析タグ更新CSVアップロード"); // sub_title messages:1839
      await expect(page.locator("body")).toContainText("売上分析タグ更新CSV"); // csv_box_title messages:1840
    });

    test("E2E-M03-29-003 フォーマット表に「商品ID」「売上分析タグ(ID)」行があり商品IDに必須バッジが付く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("商品ID");
      await expect(page.locator("body")).toContainText("売上分析タグ(ID)");
      // 必須キーは「商品ID」のみ（getRequiredCsvHeader）。フォーマット表内の「必須」バッジは1個。
      await expect(page.getByText("必須", { exact: true })).toHaveCount(1);
    });

    test("E2E-M03-29-004 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（存在しない商品ID＝行検証で打ち切り・ロールバック）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("e2e_no_confirm.csv", `${HEADER}\n2147483647,\n`);
      await expect(page).toHaveURL(UPLOAD_RE); // POST が直接実行され csv_upload へ戻った証跡
      expect(dialogShown).toBe(false); // 確認ダイアログなし（仕様: モーダル・ポップアップなし）
    });

    test("E2E-M03-29-005 ファイル選択でラベルにファイル名が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await csv.selectFile("e2e_label.csv");
      await expect(csv.fileNameLabel).toContainText("e2e_label.csv"); // JS でラベルにファイル名を表示
    });

    test("E2E-M03-29-007 取込履歴カード「CSVインポート履歴」と件数プルダウンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("CSVインポート履歴"); // messages:1788
      await expect(csv.pageCountPulldown).toBeVisible();
    });

    test("E2E-M03-29-008 ファイル入力の accept 属性にCSV/TSV形式(.csv)が含まれる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // 設計: accept=.csv,text/csv,.tsv,text/tsv（base_csv_upload.twig:20,65）。安定部分「.csv」で確認。
      await expect(csv.fileInput).toHaveAttribute("accept", /\.csv/);
    });

    test("E2E-M03-29-006 ナビ「商品管理」→「商品CSV管理」→「売上分析タグ更新CSVアップロード」でアップロード画面へ遷移", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // ナビ操作のセレクタ・メニュー展開挙動は要実機確認（メニュー文言は eccube_nav.yaml 由来）。
      await page.getByRole("link", { name: "商品CSV管理" }).first().click();
      await page.getByRole("link", { name: "売上分析タグ更新CSVアップロード" }).first().click();
      await expect(page).toHaveURL(UPLOAD_RE); // 利用者視点の入口=ナビ経路で csv_upload に到達
    });

    // ===== 雛形ダウンロード（要管理ログイン・非破壊） =====

    test("E2E-M03-29-010 雛形ダウンロードで product_tag_sales_analysis_template.csv の取得が発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("product_tag_sales_analysis_template.csv"); // ファイル名のみ（内容は手動確認）
    });

    // ===== 画面遷移・履歴件数（要管理ログイン・非破壊） =====

    test("E2E-M03-29-021 csv_upload を開くとアップロード画面（フォーマット表・履歴）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await expect(page).toHaveURL(UPLOAD_RE);
      await expect(page.locator("body")).toContainText("売上分析タグ更新CSVファイルフォーマット"); // csv_format_title messages:1841
      await expect(page.locator("body")).toContainText("CSVインポート履歴");
    });

    test("E2E-M03-29-022 取込フォーム送信後（成否問わず）csv_upload へリダイレクトされフラッシュが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await csv.uploadButton.click(); // ファイル未選択のまま送信（検証失敗）
      await expect(page).toHaveURL(UPLOAD_RE); // 常に csv_upload へ戻る
      await expect(csv.flashError.first()).toBeVisible(); // フラッシュ（エラー）が利用者に見える
    });

    test("E2E-M03-29-023 許容件数(50)を指定すると履歴件数プルダウンの選択が保持される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.gotoWithPageCount(50); // 許容リストに含まれる→セッション保存・反映
      await expect(page.locator("#page_count_pulldown option[selected]")).toContainText("50件");
    });

    test("E2E-M03-29-024 非許容件数(7)を指定すると既定10件にフォールバックする", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.gotoWithPageCount(7); // 許容外→既定10
      await expect(page.locator("#page_count_pulldown option[selected]")).toContainText("10件");
    });

    // ===== 取込バリデーション（要管理ログイン・打ち切り＝ロールバックで非破壊） =====

    test("E2E-M03-29-030 ファイル未選択で送信するとエラーフラッシュが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await csv.uploadButton.click(); // ファイル未選択（フォーム検証失敗）
      await expect(csv.flashError.first()).toBeVisible(); // エラーフラッシュ（文言は要実機確認＝不具合候補#1）
      await expect(page).toHaveURL(UPLOAD_RE); // 同画面に留まる
    });

    test("E2E-M03-29-031 ヘッダのみ(データ行なし)のCSVで事前検証エラーフラッシュが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_no_data.csv", `${HEADER}\n`); // ヘッダのみ＝データ行0
      await expect(csv.flashError.first()).toBeVisible(); // 事前検証エラー（文言は要実機確認＝不具合候補#2）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-032 改行数が上限(5010)以上のCSVで上限超過エラーフラッシュが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // ヘッダ + データ行を MAX_ROWS 以上。取込処理に入る前に打ち切られ非破壊（DB変更なし）。
      const rows = [HEADER];
      for (let i = 0; i < MAX_ROWS; i++) rows.push("2147483647,");
      await csv.uploadCsv("e2e_overflow.csv", rows.join("\n") + "\n");
      await expect(csv.flashError.first()).toContainText(MSG_MAXROW_PART);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-033 存在しない商品IDのCSVで商品不存在エラー・ロールバックし同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // 実在しない大きな商品ID（行検証で打ち切り＝全体ロールバックで非破壊）。
      await csv.uploadCsv("e2e_no_product.csv", `${HEADER}\n2147483647,\n`);
      await expect(csv.flashError.first()).toBeVisible(); // 商品不存在エラー（文言は要実機確認＝不具合候補#3）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-034 列数が定義(2列)と不一致のCSVで行エラー・全体中断し同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // 列数1のデータ行（定義は2列）。判定順序#3で行エラー・全体中断＝ロールバックで非破壊。
      await csv.uploadCsv("e2e_colcount.csv", `${HEADER}\n2147483647\n`);
      await expect(csv.flashError.first()).toBeVisible(); // 列数不一致エラー（文言は要実機確認）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-035 商品ID列が非数値のCSVで列検証エラー・全体中断し同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // 商品ID列が非数値（判定順序#4 列単体検証）。行エラー・全体中断＝ロールバックで非破壊。
      await csv.uploadCsv("e2e_nonnumeric.csv", `${HEADER}\nabc,\n`);
      await expect(csv.flashError.first()).toBeVisible(); // 商品ID列検証エラー（文言は要実機確認）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-036 商品ID列が空のデータ行で必須エラー・全体中断し同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // 商品ID列が空（判定順序#4 商品ID必須）。行検証で打ち切り＝全体ロールバックで非破壊。
      await csv.uploadCsv("e2e_empty_product.csv", `${HEADER}\n,\n`);
      await expect(csv.flashError.first()).toBeVisible(); // 商品ID必須エラー（文言は要実機確認）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-037 タグ列に非数値を含むCSVで列検証エラー・全体中断し同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // タグ列が非数値（判定順序#4 タグ要素の数値検証）。行検証で打ち切り＝全体ロールバックで非破壊。
      await csv.uploadCsv("e2e_tag_nonnumeric.csv", `${HEADER}\n2147483647,abc\n`);
      await expect(csv.flashError.first()).toBeVisible(); // タグ要素の数値検証エラー（文言は要実機確認）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-038 ヘッダ名が定義と不一致(ヘッダ解釈不可)のCSVで事前検証エラーフラッシュが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      // 定義と異なるヘッダ行（判定順序#1 ヘッダ解釈不可）。事前検証で中止＝非破壊。
      await csv.uploadCsv("e2e_bad_header.csv", `foo,bar\n2147483647,\n`);
      await expect(csv.flashError.first()).toBeVisible(); // 事前検証エラー（文言は要実機確認）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-29-027 取込失敗時に取込履歴の行数が増えない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductTagSalesAnalysisCsvImportPage(page);
      await csv.goto();
      const before = await csv.historyRows.count(); // 失敗前の履歴行数
      // 行検証で失敗する非破壊CSV（存在しない商品ID）。失敗時は履歴INSERTされない（データ整合性）。
      await csv.uploadCsv("e2e_fail_no_history.csv", `${HEADER}\n2147483647,\n`);
      await expect(csv.flashError.first()).toBeVisible();
      await expect(csv.historyRows).toHaveCount(before); // 失敗時に履歴が増えない
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-29-040 正常CSV取込成功で「登録が完了しました。」＋履歴1件追加（要: 実在商品ID/タグ＋後始末。破壊的）",
      async () => {
        // 期待は仕様(処理フロー#8 / messages.ja.yaml:1773「登録が完了しました。」＋履歴INSERT)由来。
        // dtb_product_tag_sales_analysis を DELETE/INSERT する破壊的ケース。SEED-M03-29-PRODUCT-TAG の後始末を整備後に実装。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-29-041 タグ列空で取込すると当該商品の売上分析タグ紐付けが全削除される（要: 実在商品ID＋値復元。破壊的）",
      async () => {
        // 期待は仕様(エッジケース: タグ列のみ空→紐付け全削除)由来。原値照合はDB確認＝手動/間接。
      }
    );

    test.fixme(
      "E2E-M03-29-042 存在しない売上分析タグIDでマスタ不存在エラー・ロールバック（要: 実在商品ID シード）",
      async () => {
        // 期待は仕様(エッジケース: 存在しないタグID→マスタ不存在エラー・全体ロールバック)由来。
        // 商品ID存在チェックを通すため実在商品IDが必要。SEED-M03-29-PRODUCT で実装。
      }
    );

    test.fixme(
      "E2E-M03-29-043 同一商品IDが複数行のとき末尾行の指定が残り成功件数はユニーク商品数（要: 実在商品ID＋後始末。破壊的）",
      async () => {
        // 期待は仕様(業務ルール: 同一商品の複数行は末尾行が残る/成功件数はユニーク商品ID)由来。原値照合は手動/間接。
      }
    );

    test.fixme(
      "E2E-M03-29-047 1セルに複数タグID(カンマ区切り)指定で複数紐付けが登録される（要: 実在商品ID/タグ＋後始末。破壊的）",
      async () => {
        // 期待は仕様(業務ルール・計算: 複数値=カンマ区切りの複数整数を許す)由来。複数紐付けの原値照合は手動/間接。
      }
    );
  }
);
