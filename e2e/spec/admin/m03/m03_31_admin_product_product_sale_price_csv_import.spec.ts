/**
 * 管理画面 商品管理「セール用価格変更CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_31_admin_product_product_sale_price_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、DB副作用を伴う成功系/要シードは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系（ヘッダ不一致/データなし/商品ID不存在/行数上限）は
 * 取込中止＝トランザクションロールバックで非破壊。成功系(010,011)・要既存商品シード(024,025)は破壊的/要シードのため fixme。
 *
 * 不具合候補（ケース表 付帯表4 参照。テストは仕様どおり書き、乖離は失敗で検出する）:
 *  - 成功フラッシュ文言: 設計「商品登録CSVファイルをアップロードしました。」 vs 実装 admin.register.complete「登録が完了しました。」
 *  - ファイル未選択文言: 設計「ファイルを選択してください。」 vs 実装 NotBlank 既定メッセージのフラッシュ
 *  - 行エラー表示位置: 設計「画面内エラー一覧」 vs 実装 addError フラッシュ(.alert-danger)＋リダイレクト
 *  - URLパス: 設計 /product/product_price_csv_upload vs 実装 /product/product_price/product_price_csv_upload
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSalePriceCsvImportPage } from "../../../pages/admin/m03/m03_31_admin_product_product_sale_price_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_FORMAT_HEADER = "CSVのフォーマットが一致しません。"; // :2209 admin.csv.error.format.header
const MSG_NO_DATA = "CSVデータが存在しません。"; // :2211 admin.csv.error.data.empty
const MSG_MAX_ROWS = "5010 行を超えるCSVファイルは登録できません。"; // :1429 admin.csv.error.upload.maxrecord（%maxRecord%=5010）

// 取込CSVのヘッダ（getCsvHeader の列順 ProductPriceCsvController.php:195-203）。
const HEADER = "商品ID,言語(ID),販売価格,買取価格,セールフラグ,帯URL,タグ(ID)";

const UPLOAD_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/product_price/product_price_csv_upload(\\?|$)`
);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > セール用価格変更CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-31-070 未ログインでセール用価格変更CSV登録URL→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（権限・認可）
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-31-001 画面UI: 見出し・ファイル選択・アップロードボタン・雛形リンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-31-ADMIN）");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-31-002 フォーマット表に7列（商品ID〜タグ(ID)）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      const body = page.locator("body");
      for (const col of ["商品ID", "言語(ID)", "販売価格", "買取価格", "セールフラグ", "帯URL", "タグ(ID)"]) {
        await expect(body).toContainText(col); // フォーマット表 列名（getCsvHeader）
      }
    });

    test("E2E-M03-31-003 フォーマット表で必須4列に必須バッジが付く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      // 仕様(CSVファイル形式 m03-31_..._csv_import.md:117-121)で必須は 商品ID/言語(ID)/販売価格/買取価格 の4列。
      // セールフラグは「任意（未指定は0）」(同:121)。実装の getRequiredCsvHeader はセールフラグを含む5列で
      // 必須バッジを描画しており設計と乖離（不具合候補#7）。期待値は実装(5)へ寄せず仕様の4で固定する。
      await expect(csv.requiredBadges).toHaveCount(4);
    });

    test("E2E-M03-31-004 雛形ダウンロードボタンで product_price_template.csv の取得が発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("product_price_template.csv"); // ファイル名のみ（内容は手動確認）
    });

    test("E2E-M03-31-005 CSVインポート履歴セクションが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      // 仕様(フロント挙動 m03-31_..._csv_import.md:77「CSVインポート履歴（ファイル名・アップロード日時・作業者）」)。
      const body = page.locator("body");
      await expect(body).toContainText("CSVインポート履歴");
      for (const header of ["ファイル名", "アップロード日時", "作業者"]) {
        await expect(body).toContainText(header); // 履歴テーブルの3列見出し（仕様由来）
      }
    });

    test("E2E-M03-31-007 ファイル選択欄に受理MIMEヒント(CSV/TSV)が設定される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      // 仕様(フロント挙動 m03-31_..._csv_import.md:77「受理MIMEヒント text/csv,text/tsv」)。
      // accept の正確な文字列は実装(.csv, text/csv, .tsv, text/tsv)と設計表記で差異があり要実機確認のため、
      // CSV/TSV ヒントの有無で判定し文言を固定しない（オラクル独立性）。
      const accept = (await csv.fileInput.getAttribute("accept")) ?? "";
      expect(accept).toContain("csv");
      expect(accept).toContain("tsv");
    });

    test("E2E-M03-31-006 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（ヘッダ不一致＝取込中止・ロールバック）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("e2e_no_confirm.csv", "col1,col2\nv1,v2\n");
      await expect(csv.errorAlert.first()).toBeVisible(); // POSTが直接実行された証跡
      expect(dialogShown).toBe(false); // 確認ダイアログなし（仕様: モーダル・ポップアップなし）
    });

    // ===== 取込バリデーション（要管理ログイン・取込中止＝ロールバックで非破壊） =====

    test("E2E-M03-31-020 ファイル未選択でアップロードするとエラーが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      await csv.submitWithoutFile(); // ファイル未選択のまま送信
      await expect(csv.errorAlert.first()).toBeVisible(); // エラー表示（文言は要実機確認＝不具合候補#2）
      await expect(page).toHaveURL(UPLOAD_RE); // 同画面に留まる（取込しない）
    });

    test("E2E-M03-31-021 ヘッダ不一致のCSVで「CSVのフォーマットが一致しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_bad_header.csv", "colA,colB\nv1,v2\n");
      await expect(csv.errorAlert).toContainText(MSG_FORMAT_HEADER);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-31-022 ヘッダのみ（データ行0）で「CSVデータが存在しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_no_data.csv", `${HEADER}\n`);
      await expect(csv.errorAlert).toContainText(MSG_NO_DATA);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-31-023 存在しない商品IDの行で取込全体が中止される（取込されない）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      // 実在しない大きな商品ID（非破壊：商品が存在せず取込中止＝ロールバック）。
      await csv.uploadCsv("e2e_pid_missing.csv", `${HEADER}\n99999999,1,1000,500,0,,\n`);
      // 仕様(表示メッセージ m03-31_..._csv_import.md:292)「{N} 行目の {列名} ではデータを取得できません。」の
      // 固定部を観測してオラクルを強化（誤った別エラーでの誤通過を防ぐ）。文言は仕様由来で実装へ寄せない。
      await expect(csv.errorAlert).toContainText("データを取得できません");
      await expect(page).toHaveURL(UPLOAD_RE); // 取込確定しない（ロールバック）
    });

    test("E2E-M03-31-040 5010行以上のCSVで「5010 行を超えるCSVファイルは登録できません。」", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      // ヘッダ + データ5010行（>= 上限5010）を生成。行数チェックは取込前のため非破壊。
      const rows = Array.from({ length: 5010 }, () => "99999999,1,1000,500,0,,").join("\n");
      await csv.uploadCsv("e2e_over_rows.csv", `${HEADER}\n${rows}\n`);
      await expect(csv.errorAlert).toContainText(MSG_MAX_ROWS);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-31-027 取込失敗時はCSVインポート履歴にファイル名が追加されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSalePriceCsvImportPage(page);
      await csv.goto();
      // 仕様(処理フロー#10／失敗結果 m03-31_..._csv_import.md:106,175「失敗時は履歴を記録しない」)。
      // 取込前の履歴件数を控え、ヘッダ不一致CSV（取込中止＝ロールバックで非破壊）でエラーにし、件数が増えないことを判定。
      const before = await csv.historyRows.count();
      await csv.uploadCsv("e2e_fail_no_history.csv", "colA,colB\nv1,v2\n");
      await expect(csv.errorAlert.first()).toBeVisible(); // 取込失敗（エラー表示）
      await expect(page).toHaveURL(UPLOAD_RE);
      const after = await csv.historyRows.count();
      expect(after).toBe(before); // 失敗時はCSVインポート履歴を記録しない
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-31-010 有効CSV取込で成功フラッシュ表示（要: 既存商品シード＋後始末。価格/履歴/タグを更新する破壊的ケース）",
      async () => {
        // 期待は仕様(処理フロー10・表示メッセージ「成功フラッシュ」)由来。
        // 実装の成功文言は admin.register.complete「登録が完了しました。」で設計文言と乖離（不具合候補#1）。
        // dtb_product_class/dtb_product_tag/dtb_price_history を更新するため SEED-M03-31-PRODUCT と後始末整備後に実装。
      }
    );

    test.fixme(
      "E2E-M03-31-011 取込成功後、取込履歴にアップロードファイル名が追加表示される（要: 既存商品シード。破壊的）",
      async () => {
        // 期待は仕様(処理フロー10「取込履歴へファイル名を記録」)由来。成功取込が前提のため 010 と同じく破壊的。
      }
    );

    test.fixme(
      "E2E-M03-31-024 販売価格<買取価格の行で「N 行目の販売価格は…」エラー取込中止（要: 既存商品シード）",
      async () => {
        // 期待は仕様(判定順序#2 / messages.ja.yaml:2223 admin.csv.error.product.price_valid)由来。
        // PriceConsistencyRowValidator が反応する前に商品存在チェックが先行し得るため、既存商品ID(言語)シードで分岐を隔離する。
      }
    );

    test.fixme(
      "E2E-M03-31-025 必須列（販売価格）空の行で行エラー取込中止（要: 既存商品シード）",
      async () => {
        // 期待は仕様(判定順序#1 必須列検証 / バリデーション節)由来。必須列空の行検証を既存商品IDで隔離する。
      }
    );
  }
);
