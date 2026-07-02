/**
 * 管理画面 商品管理「略称タグ更新CSV登録（略称タグ登録CSVアップロード）」E2E。
 * 納品ケース表 integration_test/e2e/m03_37_admin_product_product_storage_code_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。DBレコード（id・名称・並び順）の値照合・件数・新規/更新の区別・
 * 一覧再表示反映・ログ出力（開始/完了/抑止）は手動/間接・対象外であり、ケース表(付帯表2/2b)で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-37_admin_product_product_storage_code_csv_import.md / messages.ja.yaml)
 * 由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *   - 設計書「取込時の判定順序」#1〜#9 の各失敗分岐を、それぞれ独立のエラーパスとして判定する。
 *   - 設計書「エラー処理」: 検証失敗時は取込せず取込画面へリダイレクトしフラッシュにエラー文言 → 期待は「/csv へ戻りエラー表示」。
 *   - ルートは設計書どおり GET表示=/csv・POST送信=/import を区別（乖離なし）。E2Eは GET /csv で表示、POST /import で取込挙動を判定する。
 *   - 登録系（010/011/012/013）は名称一意制約があるため、CSV内の名称に実行ごとのユニーク接尾辞を付けて再実行のべき等性を確保する（仕様は変えずデータのみ一意化）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 *  未認証ガード(E2E-M03-37-030)のみ資格情報不要で常時実行可。
 *  010/011/012/013 は mtb_storage_code への書込を伴うため、識別接頭辞 E2E_ ＋実行ごとのユニーク接尾辞(RUN)で名称重複を回避し、共有環境では取込後の撤去を推奨。
 *  011/027 は SEED-M03-37-STORAGE（既存 id / 名称）を前提とし、STORAGE_CODE_ID / STORAGE_CODE_NAME 未設定時は個別に skip する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductStorageCodeCsvImportPage } from "../../../pages/admin/m03/m03_37_admin_product_product_storage_code_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// SEED-M03-37-STORAGE（既存 id / 名称）依存テストのガード。シード未提供環境では skip（オラクルは仕様、前提はシード）。
const STORAGE_CODE_ID = process.env.STORAGE_CODE_ID;
const STORAGE_CODE_NAME = process.env.STORAGE_CODE_NAME;
// 登録系の名称一意化（再実行のべき等性確保。値の一意化のみで仕様は変えない）。
const RUN = Date.now();

// 取込画面URL（admin_product_storage_code_csv = /<route>/product/storage_code/csv）。再表示の滞留確認に使う。
const CSV_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/storage_code/csv(\\?|$)`);
// 略称タグ一覧URL（admin_product_storage_code = /<route>/product/storage）。一覧へ戻る遷移先。
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/storage(\\?|$)`);
// 管理ログイン画面URL（admin_login = /<route>/login）。未認証ガードの誘導先。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS = "登録が完了しました。"; // admin.register.complete :1773
const ERR_FORMAT = "CSVのフォーマットが一致しません"; // header :2209 / body :2210 / csv_invalid_format :1561（contains判定）
const ERR_EMPTY = "CSVデータが存在しません。"; // admin.csv.error.data.empty :2211
const ERR_REQUIRE = "は必須項目です。"; // admin.csv.error.data.require :2213（contains判定）
const ERR_DUP_RANK = "CSV内で並び順が重複しています。"; // admin.storagecode.duplicate_csv_rank_error :1780（contains判定）
const ERR_DUP_NAME = "名称がすでに登録されています。"; // admin.storagecode.duplicate_error :1778（contains判定）

// CSVヘッダは仕様（ID・名称・並び順／必須=名称・並び順、ID任意）由来。
// 登録系の名称は RUN で一意化し再実行のべき等性を確保（仕様は変えずデータのみ一意化）。
const VALID_CSV = `ID,名称,並び順\n,E2E_略称タグ_${RUN},9001\n`;
// TSV正常系（拡張子 tsv → タブ区切り。仕様: 処理フロー#8）
const VALID_TSV = `ID\t名称\t並び順\n\tE2E_TSV_${RUN}\t9050\n`;
const HEADER_INVALID_CSV = "コード,なまえ,順\nx,y,1\n"; // ヘッダ不一致（#3）
const EMPTY_DATA_CSV = "ID,名称,並び順\n"; // データ0行（#4）
const COLUMN_MISMATCH_CSV = "ID,名称,並び順\n,E2E_列数,9002,余分\n"; // 列数不一致（#5）
const REQUIRE_MISSING_CSV = "ID,名称,並び順\n,,9003\n"; // 名称が空（#6 必須空）
const RANK_MISSING_CSV = "ID,名称,並び順\n,E2E_並び順空,\n"; // 並び順が空（#6 必須空・名称と対の異常系）
const DUP_RANK_CSV = "ID,名称,並び順\n,E2E_重複A,9100\n,E2E_重複B,9100\n"; // ファイル内並び順重複（#7）

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 略称タグ更新CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要・常時実行可） =====

    test("E2E-M03-37-030 未ログインで取込画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 仕様（権限・認可／URL直接アクセス）: 未ログイン管理者はアクセス不可で管理ログインへ誘導。
      const p = new ProductProductStorageCodeCsvImportPage(page);
      await page.goto(p.csvUrl);
      await expect(page).toHaveURL(LOGIN_RE); // 管理ログイン画面へ誘導
      await expect(p.loginId).toBeVisible(); // 取込フォームは表示しない
    });

    // ===== 認証必須（表示・導線・取込本体） =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M03-37-001 取込画面のブロックタイトルが「商品管理」である", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（表示要素）: ブロックタイトルは商品管理。
        await expect(page.locator("body")).toContainText("商品管理");
      });

      test("E2E-M03-37-002 取込画面にCSVファイル選択欄・アップロードボタン・見出しが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.seeUploadForm(); // フロント挙動（表示要素：見出し・ファイル選択・アップロード）
      });

      test("E2E-M03-37-003 取込画面にヘッダ説明（ID・名称・並び順）が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（フォーマット表）: 列名 ID・名称・並び順を説明として表示。
        await expect(p.formatTitle).toBeVisible();
        await expect(page.getByRole("columnheader", { name: "ID" })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: "名称" })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: "並び順" })).toBeVisible();
      });

      test("E2E-M03-37-014 取込画面のサブタイトルが「略称タグ管理」である", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（フロント挙動 表示要素）: サブタイトルは admin.product.storage_code_management（「略称タグ管理」）。
        await expect(p.subTitle.first()).toBeVisible();
      });

      test("E2E-M03-37-015 フォーマット表のID列に新規登録時は任意である旨の注記が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（フロント挙動 表示要素）: フォーマ表のID列セルに「ID列は任意」である旨の注記を表示する。
        // 注記の存在（表示）を判定し、実装文言はオラクル化しない（design正本は文言を確定しないため）。
        await expect(p.idOptionalNote.first()).toBeVisible();
      });

      test("E2E-M03-37-004 雛形ダウンロードの導線を押下するとダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（利用者視点の入口・雛形DL）: 押下でダウンロードが発火する（発火のみ自動化）。
        await expect(p.skeletonDownload).toBeVisible();
        const download = await p.downloadSkeleton();
        expect(download.suggestedFilename()).toBeTruthy(); // ファイル内容（ヘッダのみCSV）は手動確認
      });

      test("E2E-M03-37-009 一覧ヘッダの「CSV入力」導線から取込画面へ遷移する", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        // 仕様（利用者視点の入口）: 略称タグ登録/編集画面ヘッダの「CSV取込」導線（実装翻訳「CSV入力」）から取込専用画面が開く。
        await p.openCsvViaListLink();
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.uploadTitle).toBeVisible();
      });

      test("E2E-M03-37-005 「一覧に戻る」で略称タグ一覧へ遷移する", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.backToListLink.click();
        await expect(page).toHaveURL(LIST_RE); // 略称タグ一覧・フォーム画面へ遷移
      });

      test("E2E-M03-37-006 取込画面URLへアクセスすると取込専用画面が開く", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（利用者視点の入口・URL直接アクセス）: 取込専用画面が開く。
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.uploadTitle).toBeVisible();
      });

      test("E2E-M03-37-008 取込前に確認ダイアログが表示されない", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（モーダル・ポップアップ）: 取込前の確認ダイアログはない。送信ボタン押下で直接POSTされる。
        await expect(page.getByRole("dialog")).toHaveCount(0);
      });

      test("E2E-M03-37-010 正しいCSVをアップロードすると登録され完了メッセージが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(VALID_CSV, "storage_code_valid.csv");
        await expect(page).toHaveURL(CSV_RE); // 取込後は取込画面へ戻る（302）
        await expect(p.successAlert).toContainText(SUCCESS); // 成功フラッシュ admin.register.complete
      });

      test("E2E-M03-37-011 既存IDを含むCSVをアップロードすると更新され完了メッセージが表示される", async ({ page }) => {
        // SEED-M03-37-STORAGE の既存IDを前提とする。未提供環境では skip（前提はシード、オラクルは仕様由来）。
        test.skip(!STORAGE_CODE_ID, "STORAGE_CODE_ID（SEED-M03-37-STORAGE）未設定のためスキップ");
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 新規/更新の区別はDB→手動/間接。名称は RUN で一意化し名称重複を回避。
        await p.uploadCsv(`ID,名称,並び順\n${STORAGE_CODE_ID},E2E_略称タグ更新_${RUN},9500\n`, "storage_code_update.csv");
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.successAlert).toContainText(SUCCESS); // 更新登録の成功（DB値照合は手動/間接）
      });

      test("E2E-M03-37-012 DBに無いIDを書いたCSVは新規作成され完了メッセージが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（業務ルール・エッジケース）: DBに無いID列は新規行として作成。新規判定自体はDB→間接、成功表示で代表。名称は RUN で一意化。
        await p.uploadCsv(`ID,名称,並び順\n99999999,E2E_未知ID_${RUN},9600\n`, "storage_code_unknown_id.csv");
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.successAlert).toContainText(SUCCESS);
      });

      test("E2E-M03-37-013 拡張子tsv（タブ区切り）の正しいファイルをアップロードすると登録され完了メッセージが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（入力項目: CSV/TSV受付・処理フロー#8 拡張子tsvはタブ区切り）。名称は RUN で一意化。
        await p.uploadCsv(VALID_TSV, "storage_code_valid.tsv", "text/tsv");
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.successAlert).toContainText(SUCCESS);
      });

      // ----- エラーパス（取込時の判定順序 #1〜#8） -----

      test("E2E-M03-37-020 ファイル未選択でアップロードすると取込せず取込画面に戻りエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.submitWithoutFile(); // 判定順序#1: ファイル必須
        await expect(page).toHaveURL(CSV_RE); // 取込せず取込画面を再表示
        await expect(p.errorAlert.first()).toBeVisible(); // 検証失敗のエラーフラッシュ
      });

      test("E2E-M03-37-022 ヘッダ不一致のCSVでフォーマット不一致エラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(HEADER_INVALID_CSV, "storage_code_badheader.csv"); // 判定順序#3
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.errorAlert).toContainText(ERR_FORMAT); // admin.csv.error.format.header
      });

      test("E2E-M03-37-023 データ行が無いCSV（ヘッダのみ）でデータ無しエラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(EMPTY_DATA_CSV, "storage_code_empty.csv"); // 判定順序#4
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.errorAlert).toContainText(ERR_EMPTY); // admin.csv.error.data.empty
      });

      test("E2E-M03-37-024 列数がヘッダと一致しないCSVでフォーマット不一致（行番号付）エラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(COLUMN_MISMATCH_CSV, "storage_code_columns.csv"); // 判定順序#5
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.errorAlert).toContainText(ERR_FORMAT); // admin.csv.error.format.body（行番号埋め込み）
      });

      test("E2E-M03-37-025 必須項目（名称）が空の行を含むCSVで必須エラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(REQUIRE_MISSING_CSV, "storage_code_require.csv"); // 判定順序#6（名称空）
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.errorAlert).toContainText(ERR_REQUIRE); // admin.csv.error.data.require
      });

      test("E2E-M03-37-028 必須項目（並び順）が空の行を含むCSVで必須エラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 仕様（判定順序#6 必須ヘッダ=名称・並び順）: 並び順空も必須エラー。名称空（025）と対の異常系。
        await p.uploadCsv(RANK_MISSING_CSV, "storage_code_require_rank.csv");
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.errorAlert).toContainText(ERR_REQUIRE); // admin.csv.error.data.require
      });

      test("E2E-M03-37-026 ファイル内で並び順が重複するCSVで重複エラーが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        await p.uploadCsv(DUP_RANK_CSV, "storage_code_duprank.csv"); // 判定順序#7
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.errorAlert).toContainText(ERR_DUP_RANK); // admin.storagecode.duplicate_csv_rank_error
      });

      test("E2E-M03-37-027 既存の別IDが持つ名称へ変更するCSVで名称重複エラーが表示される", async ({ page }) => {
        // SEED-M03-37-STORAGE の既存名称を前提とする。未提供環境では skip（既定値に依存しない＝flaky回避）。
        test.skip(!STORAGE_CODE_NAME, "STORAGE_CODE_NAME（SEED-M03-37-STORAGE）未設定のためスキップ");
        await login(page);
        const p = new ProductProductStorageCodeCsvImportPage(page);
        await p.gotoCsv();
        // 既存名称を、別id（ここでは新規=ID空）で書き込み衝突させる（判定順序#8）。
        await p.uploadCsv(`ID,名称,並び順\n,${STORAGE_CODE_NAME},9700\n`, "storage_code_dupname.csv");
        await expect(page).toHaveURL(CSV_RE);
        await expect(p.errorAlert).toContainText(ERR_DUP_NAME); // admin.storagecode.duplicate_error
      });
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-37-007 ファイル選択でラベルに選択ファイル名が表示される（要: .custom-file-label の実機セレクタ確認）",
      async () => {
        // 期待は仕様(フロント挙動・JS挙動)由来。custom-file の change で .custom-file-label に
        // ファイル名が反映される挙動を実機でセレクタ確定後に実装（twig:24-28）。
      }
    );

    test.fixme(
      "E2E-M03-37-021 空（0バイト）または壊れたファイルで csv_invalid_format が表示される（要: 0バイトUploadedFileの実機挙動確認）",
      async () => {
        // 期待は仕様(判定順序#2 admin.common.csv_invalid_format)由来。NotBlank と getFormFile(サイズ0→null)の
        // 境界がブラウザ送信で再現するかを実機確認後に実装。
      }
    );
  }
);
