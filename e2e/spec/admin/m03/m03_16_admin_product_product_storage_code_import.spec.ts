/**
 * 管理画面 商品管理「略称タグCSV入力」E2E。
 * 納品ケース表 integration_test/e2e/m03_16_admin_product_product_storage_code_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。DBレコード（id・名称・並び順）の値照合・件数・同時更新（後勝ち）は
 * 手動/間接であり、ケース表(付帯表2/2b)で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-16_admin_product_product_storage_code_import.md / messages.ja.yaml /
 * validators.ja.yaml)由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *   - 設計書「エラー処理」: ヘッダ不正・検証失敗時は取込せず取込画面を再表示する → 期待は「/csv へ戻りエラー表示」。
 *   - 表示入口URLは設計書(/import)と実装(/csv)が乖離（不具合候補#1）。E2Eは実画面/csvで仕様挙動を判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 *  未認証ガード(E2E-M03-16-030)のみ資格情報不要で常時実行可。
 *  010/011 は mtb_storage_code への書込を伴うため、識別接頭辞 E2E_ を付け共有環境では取込後の撤去を推奨。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductStorageCodeImportPage } from "../../../pages/admin/m03/m03_16_admin_product_product_storage_code_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 取込画面URL（admin_product_storage_code_csv = /<route>/product/storage_code/csv）。再表示の滞留確認に使う。
const CSV_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/storage_code/csv(\\?|$)`);
// 管理ログイン画面URL（admin_login = /<route>/login）。未認証ガードの誘導先。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

// 仕様(messages.ja.yaml / validators.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS = "登録が完了しました。"; // admin.register.complete :1773
const ERR_HEADER = "CSVのフォーマットが一致しません。"; // admin.csv.error.format.header :2209
const ERR_EMPTY = "CSVデータが存在しません。"; // admin.csv.error.data.empty :2211
const ERR_REQUIRE = "は必須項目です。"; // admin.csv.error.data.require :2213（contains判定）
const ERR_BODY = "行目のデータを確認してください"; // admin.csv.error.format.body :2210（列数不一致／行指摘・contains判定）

// CSVヘッダは仕様（ID・名称・並び順／必須=名称・並び順、ID任意）由来。
const VALID_CSV = "ID,名称,並び順\n,E2E_略称タグ,999\n";
const VALID_NO_ID_CSV = "名称,並び順\nE2E_略称タグ無ID,998\n"; // IDは任意ヘッダ→省略しても取込可
const HEADER_INVALID_CSV = "コード,なまえ,順\nx,y,1\n";
const EMPTY_DATA_CSV = "ID,名称,並び順\n";
const REQUIRE_MISSING_CSV = "ID,名称,並び順\n,,5\n"; // 名称が空
const REQUIRE_MISSING_RANK_CSV = "ID,名称,並び順\n,E2E_略称タグ,\n"; // 並び順が空（名称空023の対）
const COLUMN_MISMATCH_CSV = "ID,名称,並び順\n,E2E_略称タグ\n"; // データ行の列数がヘッダ(3列)と不一致(2列)

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 略称タグCSV入力",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要・常時実行可） =====

    test("E2E-M03-16-030 未ログインで取込画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 仕様: 未ログイン管理者はアクセス不可（権限・認可／URL直接アクセス）。
      const p = new ProductProductStorageCodeImportPage(page);
      await page.goto(p.csvUrl);
      await expect(page).toHaveURL(LOGIN_RE); // 管理ログイン画面へ誘導
      await expect(p.loginId).toBeVisible(); // 取込フォームは表示しない
    });

    // ===== 認証必須（取込画面・取込本体） =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M03-16-001 一覧の「CSV入力」リンク押下で取込画面へ遷移する", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.openCsvViaListLink();
        await expect(page).toHaveURL(CSV_RE); // 取込画面へ遷移
        await expect(p.uploadTitle).toBeVisible(); // 見出し「略称タグ登録CSVアップロード」
      });

      test("E2E-M03-16-002 取込画面にCSVファイル選択欄とアップロードボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.seeUploadForm(); // フロント挙動（表示要素：ファイル選択・アップロード）
      });

      test("E2E-M03-16-003 取込画面にヘッダ説明（ID・名称・並び順）が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        // 業務ルール（ヘッダ確認）：CSVフォーマット表に必須/任意ヘッダが説明として表示される。
        await expect(page.getByRole("columnheader", { name: "ID" })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: "名称" })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: "並び順" })).toBeVisible();
      });

      test("E2E-M03-16-004 取込画面に雛形ダウンロードと一覧に戻るの導線が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await expect(p.skeletonDownload).toBeVisible(); // 操作起点（雛形DL）
        await expect(p.backToListLink).toBeVisible(); // 操作起点（一覧に戻る）
      });

      test("E2E-M03-16-010 正しいCSVをアップロードすると略称タグが登録され完了メッセージが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(VALID_CSV, "storage_code_valid.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込後は取込画面へ戻る
        await expect(page.locator("body")).toContainText(SUCCESS); // 成功時出力（略称タグの登録）
      });

      test("E2E-M03-16-011 既存IDを含むCSVをアップロードすると更新され完了メッセージが表示される", async ({ page }) => {
        // 既存ID(SEED-M03-16-STORAGE)が無いと「更新」でなく新規登録になり更新オラクルが成立しない。
        // 実装都合のID=1を当て込まない（オラクル独立性）。シードIDが未提供なら本ケースはskipし、
        // DB上の値照合は手動ケース E2E-M03-16-040 に委譲する（ケース表 付帯表3 SEED-M03-16-STORAGE）。
        const existingId = process.env.STORAGE_CODE_ID;
        test.skip(!existingId, "STORAGE_CODE_ID(SEED-M03-16-STORAGEの既存ID) 未設定のため更新ケースをスキップ");
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        // SEED-M03-16-STORAGE の既存IDを用いる。識別接頭辞付きで安定キーにする。
        await p.uploadCsv(`ID,名称,並び順\n${existingId},E2E_略称タグ更新,500\n`, "storage_code_update.csv");
        await expect(page).toHaveURL(CSV_RE);
        await expect(page.locator("body")).toContainText(SUCCESS); // 登録方式（同一スキーマへ登録/更新）。値照合は040(手動)
      });

      test("E2E-M03-16-012 ID列を省略したCSV（ヘッダ「名称,並び順」）でも略称タグが登録され完了する", async ({ page }) => {
        // 仕様: IDは必須外ヘッダ（getNotRequiredCsvHeader=ID）。ID列を省いても取込できる正常系（ID任意ヘッダ分岐）。
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(VALID_NO_ID_CSV, "storage_code_no_id.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込後は取込画面へ戻る
        await expect(page.locator("body")).toContainText(SUCCESS); // 成功時出力（略称タグの登録）
      });

      test("E2E-M03-16-020 ファイル未選択でアップロードすると取込せず取込画面に戻りエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.submitWithoutFile(); // 必須（CSVファイル）未選択
        await expect(page).toHaveURL(CSV_RE); // 取込せず取込画面を再表示
        await expect(p.errorAlert.first()).toBeVisible(); // 検証失敗のエラー表示
      });

      test("E2E-M03-16-021 ヘッダ不正のCSVをアップロードするとフォーマット不一致で取込画面に戻る", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(HEADER_INVALID_CSV, "storage_code_badheader.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込せず再表示
        await expect(page.locator("body")).toContainText(ERR_HEADER); // ヘッダ不正
      });

      test("E2E-M03-16-022 データ行が無いCSV（ヘッダのみ）でデータ無しエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(EMPTY_DATA_CSV, "storage_code_empty.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込せず再表示
        await expect(page.locator("body")).toContainText(ERR_EMPTY); // データ無し
      });

      test("E2E-M03-16-023 必須項目（名称）が空の行を含むCSVで必須エラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(REQUIRE_MISSING_CSV, "storage_code_require.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込せず再表示
        await expect(page.locator("body")).toContainText(ERR_REQUIRE); // 必須項目欠落（名称空）
      });

      test("E2E-M03-16-024 必須項目（並び順）が空の行を含むCSVで必須エラーが表示される", async ({ page }) => {
        // 名称空(023)と対の必須失敗分岐。必須ヘッダ=名称・並び順（仕様：ヘッダ・必須項目の確認）。
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(REQUIRE_MISSING_RANK_CSV, "storage_code_require_rank.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込せず再表示
        await expect(page.locator("body")).toContainText(ERR_REQUIRE); // 必須項目欠落（並び順空）
      });

      test("E2E-M03-16-025 データ行の列数がヘッダと一致しないCSVでフォーマット不一致（行指摘）が表示される", async ({ page }) => {
        // 仕様: ヘッダ不正・検証失敗時は取込せず取込画面を再表示する（データ列数不一致＝format.body）。
        await login(page);
        const p = new ProductProductStorageCodeImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(COLUMN_MISMATCH_CSV, "storage_code_colmismatch.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込せず再表示
        await expect(page.locator("body")).toContainText(ERR_BODY); // 該当行を指摘するフォーマット不一致
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-16-031 未ログインで取込POSTを送信しても取込されず管理ログイン画面へ誘導（要: CSRF/multipart直送の実機確認）",
      async () => {
        // 期待は仕様(権限・認可：未ログインはアクセス不可)由来。
        // 未ログインPOST(/product/storage_code/import)の挙動はCSRF/認証ガードに依存するため実機確認後に実装。
      }
    );
  }
);
