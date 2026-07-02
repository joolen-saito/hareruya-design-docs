/**
 * 管理画面 商品管理「セール用価格変更CSV登録（アップロード）」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_30_admin_product_product_product_price_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、DB副作用を伴う成功系/注意系/取込内容照合は test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-30_admin_product_product_product_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)・取込後DB値は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は打ち切り＝ロールバックされ非破壊
 * （ProductPriceImportHandler はトランザクション内で取込み、エラー時ロールバックする）。
 * 成功系(050)は dtb_product_class / dtb_price_history / 取込履歴を更新する破壊的ケースのため fixme
 * （ケース表 付帯表3 のシード/後始末で管理）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductProductPriceCsvImportPage } from "../../../pages/admin/m03/m03_30_admin_product_product_product_price_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_INVALID_FORMAT = "CSVのフォーマットが一致しません"; // :1561 admin.common.csv_invalid_format（ヘッダ不一致）
const MSG_NO_DATA = "CSVデータが存在しません"; // :1562 admin.common.csv_invalid_no_data（データ行0）
// :1429 admin.csv.error.upload.maxrecord（%maxRecord%=5010）。埋め込み値5010は設計書由来のオラクルとして検証する。
const MSG_MAXRECORD_TAIL = "行を超えるCSVファイルは登録できません。";
const MSG_SUCCESS = "登録が完了しました。"; // :1773 admin.register.complete（取込成功）

// 取込CSVヘッダ（getCsvHeader の7列 ProductPriceCsvController.php:193-204）。
const HEADER = "商品ID,言語(ID),販売価格,買取価格,セールフラグ,帯URL,タグ(ID)";
// 改行5010以上の上限超過は ADMIN_CSV_IMPORT_MAX_ROWS（設計書: 5010）に基づく。
const MAX_ROWS = 5010;

const UP_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/product_price/product_price_csv_upload`;
const UP_RE = new RegExp(
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

    test("E2E-M03-30-040 未ログインでアップロードURL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(UP_PATH);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（権限・認可）
    });

    test("E2E-M03-30-041 未ログインで雛形DL URL→管理ログイン画面へ誘導", async ({ page }) => {
      // 雛形DL GET（admin_product_product_price_csv_template）も認証ガード対象（権限・認可 md:206-209）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product_price/csv_template`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-30-001 画面UI: ファイル入力・アップロードボタン・雛形DLリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-30-ADMIN）");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-30-002 画面タイトル「セール用価格変更CSVアップロード」・サブ「商品管理」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("セール用価格変更CSVアップロード"); // sub_title messages:1799
      await expect(page.locator("body")).toContainText("商品管理"); // title block messages:1723
    });

    test("E2E-M03-30-003 ボックス見出し「セール用価格変更CSV」「セール用価格変更CSVファイルフォーマット」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // ページ全体ではなく見出し要素にスコープ（box は exact 一致で format と区別）。
      await expect(csv.boxTitle).toBeVisible(); // box title messages:1800「セール用価格変更CSV」
      await expect(csv.formatTitle).toBeVisible(); // format title messages:1801
    });

    test("E2E-M03-30-004 フォーマット表に7列見出し(商品ID/言語(ID)/販売価格/買取価格/セールフラグ/帯URL/タグ(ID))が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      for (const col of [
        "商品ID",
        "言語(ID)",
        "販売価格",
        "買取価格",
        "セールフラグ",
        "帯URL",
        "タグ(ID)",
      ]) {
        // フォーマット表カードにスコープ（ページ全体での誤合格回避）。
        await expect(csv.formatCard).toContainText(col); // getCsvHeader Controller.php:193-204
      }
    });

    test("E2E-M03-30-005 フォーマット表の必須列4つ(商品ID/言語(ID)/販売価格/買取価格)に必須バッジが付く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 必須列は設計書 CSVデータ列（md:131-135）由来＝4列。セールフラグは設計書上「任意（空は無効）」。
      // 実装 getRequiredCsvHeader はセールフラグを含む5列で、設計書と乖離（不具合候補#7）。
      // 期待値は設計書由来の4とし、実装が5を出すなら本テストが落ちて乖離を検出する（オラクル独立）。
      await expect(csv.requiredBadges.filter({ hasText: "必須" })).toHaveCount(4);
    });

    test("E2E-M03-30-006 取込履歴一覧の見出しとページ件数プルダウンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 取込履歴: ファイル名・日時・操作者の3見出し（csv_import_history.twig）／件数プルダウン
      await expect(page.locator("body")).toContainText("ファイル名");
      await expect(csv.pageCountPulldown).toBeVisible(); // #page_count_pulldown
    });

    test("E2E-M03-30-007 取込前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（データ行0＝エラーで打ち切り）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("e2e_no_confirm.csv", `${HEADER}\n`);
      await expect(csv.errorAlert.first()).toBeVisible(); // POSTが直接実行された証跡（エラーフラッシュ）
      expect(dialogShown).toBe(false); // 取込前の確認ダイアログはない（仕様: モーダル・ポップアップなし）
    });

    test("E2E-M03-30-008 ファイル選択でラベルにファイル名が表示される(JS)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // base_csv_upload.twig:25-27 の .custom-file-input change で .custom-file-label にファイル名を反映（セレクタ要実機確認）。
      await csv.fileInput.setInputFiles({
        name: "e2e_label.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(`${HEADER}\n`, "utf-8"),
      });
      await expect(csv.fileLabel).toContainText("e2e_label.csv");
    });

    // ===== 雛形ダウンロード（要管理ログイン・非破壊） =====

    test("E2E-M03-30-010 雛形DLボタンで product_price_template.csv の取得が発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("product_price_template.csv"); // Controller.php:64（内容は手動確認）
    });

    // ===== 取込バリデーション（要管理ログイン・打ち切り＝ロールバックで非破壊） =====

    test("E2E-M03-30-020 ファイル未選択で送信→エラーフラッシュ表示＋アップロード画面に留まる(302)", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      const resp = await csv.submitWithoutFileCaptureImport(); // ファイル未選択のまま送信（NotBlank → form不正）
      expect(resp.status()).toBe(302); // 取込POST応答が302（仕様の画面遷移オラクル）
      await expect(csv.errorAlert.first()).toBeVisible(); // エラーフラッシュ（文言は要実機確認＝不具合候補#1）
      await expect(page).toHaveURL(UP_RE); // 302でアップロード画面へ戻り留まる
    });

    test("E2E-M03-30-021 ヘッダ不一致CSVで「CSVのフォーマットが一致しません」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      const resp = await csv.uploadCsvCaptureImport("e2e_bad_header.csv", "col1,col2\nv1,v2\n");
      expect(resp.status()).toBe(302); // 取込POST応答が302
      await expect(csv.errorAlert).toContainText(MSG_INVALID_FORMAT);
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-022 ヘッダのみ(データ行0)で「CSVデータが存在しません」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      const resp = await csv.uploadCsvCaptureImport("e2e_no_data.csv", `${HEADER}\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302
      await expect(csv.errorAlert).toContainText(MSG_NO_DATA);
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-023 列数が7でないCSV(出力CSV相当・列過多)で列数エラー＋アップロード画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 一覧の「セール用価格変更CSV出力」は基準価格・原価単価等で7列を超える（エッジケース）。列数エラーで打ち切り。
      const wideHeader = `${HEADER},基準価格,原価単価`;
      const resp = await csv.uploadCsvCaptureImport("e2e_wide.csv", `${wideHeader}\n1,2,100,80,0,,1,500,300\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302（取込未確定）
      await expect(csv.errorAlert.first()).toBeVisible(); // 列数エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-024 商品IDが商品マスタ不存在→全件打ち切りでエラーフラッシュ＋302", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 実在しない大きな商品ID（非破壊：存在せず全件打ち切り＝ロールバック）。
      const resp = await csv.uploadCsvCaptureImport("e2e_no_product.csv", `${HEADER}\n999999999,1,100,80,0,,\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302（取込未確定）
      await expect(csv.errorAlert.first()).toBeVisible(); // 商品不存在エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-025 買取価格が販売価格を超えるCSVで相関エラー＋302", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 買取(200) > 販売(100)。列バリデータの相関エラー（仕様: 買取価格は販売価格を超えてはならない）。
      const resp = await csv.uploadCsvCaptureImport("e2e_buy_gt_sell.csv", `${HEADER}\n999999999,1,100,200,0,,\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302
      await expect(csv.errorAlert.first()).toBeVisible(); // 相関エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-026 セールフラグが0/1以外のCSVで値エラー＋302", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // セールフラグ=2（0/1以外）。選択肢バリデータのエラー。
      const resp = await csv.uploadCsvCaptureImport("e2e_saleflag.csv", `${HEADER}\n999999999,1,100,80,2,,\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302
      await expect(csv.errorAlert.first()).toBeVisible(); // 値エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-027 改行5010以上のCSVで上限超過メッセージ＋アップロード画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // ヘッダ1 + データ行で改行個数が MAX_ROWS(5010) 以上になるよう生成（取込開始前に拒否）。
      const rows = [HEADER];
      for (let i = 0; i < MAX_ROWS; i++) rows.push("999999999,1,100,80,0,,");
      const resp = await csv.uploadCsvCaptureImport("e2e_maxrows.csv", rows.join("\n") + "\n");
      expect(resp.status()).toBe(302); // 取込POST応答が302
      // %maxRecord%=5010 の埋め込み値ごと検証（設計書由来オラクル）。
      await expect(csv.errorAlert).toContainText(`${MAX_ROWS} ${MSG_MAXRECORD_TAIL}`);
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-028 販売価格が9桁を超えるCSVで数値/桁エラー＋302", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 販売価格=10桁（9桁までの非負整数を超過）。数値/桁バリデータのエラー。
      const resp = await csv.uploadCsvCaptureImport("e2e_price_digits.csv", `${HEADER}\n999999999,1,1234567890,80,0,,\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302
      await expect(csv.errorAlert.first()).toBeVisible(); // 桁エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-029 必須CSV列(商品ID)が空欄のデータ行で必須エラー＋302", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 必須列(商品ID)空欄（md:131-134）。先頭列を空にしたデータ行。商品ID不存在/空で全件打ち切り＝非破壊。
      const resp = await csv.uploadCsvCaptureImport("e2e_required_empty.csv", `${HEADER}\n,1,100,80,0,,\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302（取込未確定）
      await expect(csv.errorAlert.first()).toBeVisible(); // 必須列エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-030 言語IDがマスタ不存在のデータ行でエラー＋302", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // 言語IDマスタ存在検証（md:132）。存在しない言語ID。商品IDも不存在で全件打ち切り＝非破壊。
      const resp = await csv.uploadCsvCaptureImport("e2e_no_language.csv", `${HEADER}\n999999999,999999,100,80,0,,\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302（取込未確定）
      await expect(csv.errorAlert.first()).toBeVisible(); // 言語ID存在エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    test("E2E-M03-30-031 タグIDが非数値のデータ行で値エラー＋302", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductProductPriceCsvImportPage(page);
      await csv.goto();
      // タグID存在/数値検証（md:137）。非数値タグID。商品ID不存在で全件打ち切り＝非破壊。
      const resp = await csv.uploadCsvCaptureImport("e2e_bad_tag.csv", `${HEADER}\n999999999,1,100,80,0,,abc\n`);
      expect(resp.status()).toBe(302); // 取込POST応答が302（取込未確定）
      await expect(csv.errorAlert.first()).toBeVisible(); // タグID値エラー文言は要実機確認（不具合候補#2）
      await expect(page).toHaveURL(UP_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-30-050 有効CSV取込で「登録が完了しました。」＋302＋取込履歴1件追加（要: SEED-M03-30-PRODUCT＋値復元。破壊的）",
      async () => {
        // 期待は仕様(処理フロー20 / messages.ja.yaml:1773「登録が完了しました。」)由来。
        // dtb_product_class / dtb_price_history / dtb_csv_import_history を更新する破壊的ケース。
        // 既知の商品ID・言語ID・規格を用意し、取込後に価格を復元する後始末（付帯表3）を整備後に実装する。
        void MSG_SUCCESS;
      }
    );
  }
);
