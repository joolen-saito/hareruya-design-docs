/**
 * 管理画面 商品管理「高額商品価格変更CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_32_admin_product_product_simple_high_price_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。
 * fixme と手動の区別: ブラウザで観測不能な純粋手動（DB値照合・ログ・ファイル削除等）は spec に残さずケース表で全量管理する
 *   （規約「手動/対象外はspecに残さない」）。一方 010-014 は「自動化可能だが破壊的シード/対象シード未整備のため未自動化」であり、
 *   抜け漏れ可視化のため test.fixme（理由付き）で残す（手動とは別カテゴリ＝シード整備後に自動化する保留枠）。
 * 注意: 網羅マトリクスで 010-014 は「カバー」ではなく「手動/間接(fixme・自動未検証)」であり、成功フラッシュ・履歴INSERT・更新値・
 *   ロールバックは現時点で自動検証されていない（ケース表 付帯表5 参照）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は前段検証/打ち切り＝ロールバックで非破壊
 *   （存在しない商品コード・列数不一致・必須空・数値異常・行数過多は dtb_product_class を更新しない）。
 * 成功系(010,011)・高額条件外(012)・規格重複(013)は既存商品(dtb_product_class)を要し、010/011 は破壊的更新のため fixme
 *   （ケース表 付帯表3 のシード/後始末で管理）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSimpleHighPriceCsvImportPage } from "../../../pages/admin/m03/m03_32_admin_product_product_simple_high_price_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_NO_DATA = "CSVデータが存在しません。"; // :2211 admin.csv.error.data.empty
const MSG_FORMAT = "CSVのフォーマットが一致しません。"; // :2209/2210 admin.csv.error.format.*（列数不一致）
const MSG_REQUIRE = "は必須項目です。"; // :2213 admin.csv.error.data.require（必須空）
const MSG_OVER_ZERO = "は0以上の数値を設定してください。"; // :2220 admin.csv.error.product.over_zero（数値異常）
const MSG_MAX_LENGTH = "桁以内の数値"; // :2221 admin.csv.error.product.max_length（基準価格9桁超）
const MSG_NOT_EXISTS = "ではデータを取得できません。"; // :2218 admin.csv.error.product.not_exists（商品コード存在しない）
const MSG_MAX_ROWS = "行を超えるCSVファイルは登録できません。"; // :1429 admin.csv.error.upload.maxrecord（>=5010行）
const MSG_SUCCESS = "登録が完了しました。"; // :1773 admin.register.complete（成功時のみ）

// 取込CSVのヘッダ（getCsvHeader の連想キー並び Controller:184-190）。
const HEADER = "商品コード,基準価格";

const UP_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/simple_high_price/csv_upload`;
const UP_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/simple_high_price/csv_upload(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 高額商品価格変更CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-32-040 未ログインで高額商品価格変更CSVアップロードURL→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(UP_PATH);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（権限・認可）
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-32-001 画面UI: ファイル入力・アップロードボタン・雛形ダウンロードリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-32-ADMIN）");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-32-002 サブタイトル「高額商品価格変更CSVアップロード」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("高額商品価格変更CSVアップロード"); // messages:1804
    });

    test("E2E-M03-32-003 ボックス見出し「高額商品価格変更CSV」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await expect(csv.boxTitle.filter({ hasText: "高額商品価格変更CSV" }).first()).toBeVisible(); // messages:1805
    });

    test("E2E-M03-32-004 フォーマット表に商品コード・基準価格が表示され、両列が必須として示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // 必須ヘッダは商品コード・基準価格の2列（Controller:197-203 getRequiredCsvHeader）。フォーマット表内の必須バッジは2個。
      const body = page.locator("body");
      await expect(body).toContainText("商品コード");
      await expect(body).toContainText("基準価格");
      await expect(csv.requiredBadges.filter({ hasText: "必須" })).toHaveCount(2);
    });

    test("E2E-M03-32-005 雛形ダウンロードボタンで simple_high_price_template.csv の取得が発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("simple_high_price_template.csv"); // ファイル名のみ（内容は手動確認）
    });

    test("E2E-M03-32-006 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（列数不一致＝前段で打ち切り・更新なし）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("e2e_no_confirm.csv", "商品コード\nE2E-NOPROD\n");
      await expect(csv.flashError.first()).toBeVisible(); // POSTが直接実行された証跡
      expect(dialogShown).toBe(false); // 確認ダイアログなし（仕様: モーダル・ポップアップなし）
    });

    test("E2E-M03-32-009 ファイル入力が CSV/TSV 形式を受け付ける（accept属性）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // 設計書(フロント挙動)記載の許容形式 .csv/.tsv（text/csv・text/tsv）を accept 属性に含むこと。
      const accept = (await csv.fileAcceptAttr()) ?? "";
      expect(accept).toContain(".csv");
      expect(accept).toContain(".tsv");
    });

    test("E2E-M03-32-008 履歴件数プルダウンを変更すると page_count を反映したURLへ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      const pulldown = csv.pageCountPulldown;
      await expect(pulldown).toBeVisible();
      // 既定50以外の許容候補へ変更（option value は path(history_page_route,{page_no:1,page_count})）。
      const target = await pulldown.locator("option").nth(1).getAttribute("value");
      await pulldown.selectOption({ index: 1 });
      await page.waitForURL(/page_count=/);
      expect(page.url()).toContain("page_count="); // 件数がURLクエリへ反映される
      if (target) expect(target).toContain("page_count=");
    });

    // ===== 取込バリデーション（要管理ログイン・前段検証/打ち切り＝ロールバックで非破壊） =====

    test("E2E-M03-32-020 ファイル未選択でアップロードするとエラーフラッシュが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.submitWithoutFile(); // ファイル未選択のまま送信（フォーム不正→admin エラーフラッシュ・取込なし）
      await expect(csv.flashError.first()).toBeVisible(); // 文言は要実機確認＝不具合候補#1
      await expect(page).toHaveURL(UP_RE); // アップロード画面へ戻る
    });

    test("E2E-M03-32-024 空ファイル（ヘッダ不成立）でエラーフラッシュが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // 0バイト＝ヘッダ行が成立しない→インポータ前段で打ち切り・非破壊。
      await csv.uploadCsv("e2e_empty.csv", "");
      await expect(csv.flashError.first()).toBeVisible(); // 文言は要実機確認（no_data/format いずれか）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-041 CSRFトークン改ざんで送信するとエラーフラッシュが表示され取込されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // CSRFトークンを改ざん→フォーム不正でadminエラーフラッシュ・取込なし（仕様: 入出力 CSRF / import#2）。非破壊。
      await csv.tamperCsrfAndUpload("e2e_csrf.csv", `${HEADER}\nE2E-NOPROD,1000\n`);
      await expect(csv.flashError.first()).toBeVisible();
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-021 列数不一致のCSVで「CSVのフォーマットが一致しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // ヘッダ・データとも1列のみ（列数2に不一致）→ 前段で打ち切り・非破壊。
      await csv.uploadCsv("e2e_bad_cols.csv", "商品コード\nE2E-NOPROD\n");
      await expect(csv.flashError).toContainText(MSG_FORMAT);
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-022 ヘッダ名不一致のCSVでエラーフラッシュが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_bad_header.csv", "col1,col2\nE2E-NOPROD,1000\n");
      await expect(csv.flashError.first()).toBeVisible(); // ヘッダ名不一致→取得不可エラー（文言は要実機確認）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-023 ヘッダのみ（データ行0）で「CSVデータが存在しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_no_data.csv", `${HEADER}\n`);
      await expect(csv.flashError).toContainText(MSG_NO_DATA);
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-030 基準価格が空で必須エラーが表示され同画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_price_empty.csv", `${HEADER}\nE2E-NOPROD,\n`);
      await expect(csv.flashError).toContainText(MSG_REQUIRE); // 基準価格は必須（設計書: 基準価格 必須）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-031 商品コードが空で必須エラーが表示され同画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_code_empty.csv", `${HEADER}\n,1000\n`);
      await expect(csv.flashError).toContainText(MSG_REQUIRE); // 商品コードは必須（設計書: 商品コード 必須）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-032 基準価格が非数値で数値エラーが表示され同画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // 列値検証は商品コード存在チェックより前に走るため、存在しないコードでも数値エラーで打ち切り＝非破壊。
      await csv.uploadCsv("e2e_price_nan.csv", `${HEADER}\nE2E-NOPROD,abc\n`);
      await expect(csv.flashError).toContainText(MSG_OVER_ZERO); // 基準価格は符号なし数値（設計書: 基準価格 数値）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-035 基準価格が負値(-1)で数値エラー（0以上）が表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // 符号なし数値の下限違反（負値）→ over_zero で打ち切り＝非破壊（存在チェック前に列値検証）。
      await csv.uploadCsv("e2e_price_negative.csv", `${HEADER}\nE2E-NOPROD,-1\n`);
      await expect(csv.flashError).toContainText(MSG_OVER_ZERO); // 基準価格は0以上（設計書: 符号なし数値）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-033 基準価格が桁超過(10桁)で桁エラーが表示され同画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_price_overlen.csv", `${HEADER}\nE2E-NOPROD,1234567890\n`); // 10桁（最大9桁+1）
      await expect(csv.flashError).toContainText(MSG_MAX_LENGTH); // 基準価格は最大9桁（設計書: 最大9桁相当）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-034 存在しない商品コードでデータ取得不可エラーが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // 形式は正しいが実在しない商品コード→存在チェックで breakAll＝ロールバック・非破壊。
      await csv.uploadCsv("e2e_code_missing.csv", `${HEADER}\nE2E-NOPROD-${Date.now()},1000\n`);
      await expect(csv.flashError).toContainText(MSG_NOT_EXISTS); // 商品コードに該当データなし（DBとの相関）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-32-050 行数過多(>=5010行)で行数キャップエラーが表示され取込されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSimpleHighPriceCsvImportPage(page);
      await csv.goto();
      // ADMIN_CSV_IMPORT_MAX_ROWS=5010 以上で取込前にエラー（インポータ未起動＝非破壊）。
      const rows = Array.from({ length: 5010 }, (_, i) => `E2E-NOPROD-${i},1000`).join("\n");
      await csv.uploadCsv("e2e_too_many.csv", `${HEADER}\n${rows}\n`);
      await expect(csv.flashError).toContainText(MSG_MAX_ROWS);
      await expect(page).toHaveURL(UP_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-32-010 セール中の高額対象規格を取込→成功フラッシュ＋警告(sell_price_not_updated)＋standard_priceのみ更新＋履歴INSERT（要: SEED-M03-32-PC-SALE・破壊的・後始末で価格復元）",
      async () => {
        // 期待は仕様(行更新フェーズ#1 / messages.ja.yaml:1773「登録が完了しました。」/ :1808 sell_price_not_updated＝販売価格は更新されない警告)由来。
        // 自動化時は .alert-success（登録完了）と .alert-warning（販売価格未更新）の双方を観測する。
        // dtb_product_class.standard_price を更新し dtb_csv_import_history へ INSERT する破壊的ケース。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-32-011 セール外の高額対象規格を取込→成功フラッシュ＋standard_price/price02同値更新＋履歴INSERT（要: SEED-M03-32-PC-NOSALE・破壊的）",
      async () => {
        // 期待は仕様(行更新フェーズ#2 / messages.ja.yaml:1773)由来。standard_price と price02 を同値上書き。
      }
    );

    test.fixme(
      "E2E-M03-32-012 商品コードは存在するが高額対象規格でない→エラーフラッシュ・成功フラッシュ無し・履歴INSERT無し（要: SEED-M03-32-PC-NOMATCH）",
      async () => {
        // 期待は仕様(行更新フェーズ#3 / messages.ja.yaml:1809「対象の商品規格がありません。」/ データ整合性: hasError時は完了表示・履歴なし)由来。
        // 非破壊だが対象外の既存商品コードを要する（onValidateRow を通過するため存在＋一意の規格が必要）。
      }
    );

    test.fixme(
      "E2E-M03-32-013 同一商品コードに複数規格が存在→重複エラーで breakAll・ロールバック（要: SEED-M03-32-PC-DUP）",
      async () => {
        // 期待は仕様(検証フェーズ: 同一規格コードで2件以上は breakAll / messages.ja.yaml:2225 商品コード重複)由来。
        // 商品コードに複数 ProductClass が紐づく既存データを要する。
      }
    );

    test.fixme(
      "E2E-M03-32-014 同一取込内で info(セール中警告)とerror(対象規格なし)が両立→成功フラッシュ・履歴INSERT無し（要: SEED-M03-32-PC-MIXED・破壊的）",
      async () => {
        // 期待は仕様(エッジケース: info と error の両立 / データ整合性: hasError真は完了表示・履歴なし / 行更新#1警告 messages:1808 ・ #3エラー messages:1809)由来。
        // 1取込にセール中高額対象行＋高額対象外行を混在させ、.alert-warning と .alert-danger の同時表示、.alert-success と履歴INSERTの不在を観測する。
        // breakAll は発生せずセール行の standard_price 更新がコミットされうる破壊的ケース（後始末で価格復元）。
      }
    );
  }
);
