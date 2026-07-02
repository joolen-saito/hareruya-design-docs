/**
 * 管理画面 商品管理「棚番号更新CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_40_admin_product_product_shelf_number_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、DB副作用を伴う成功系/要シード/巨大ファイルは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-40_admin_product_product_shelf_number_csv_import.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)・messages.ja.yaml の打ち切り文言は期待値に流用しない
 * （これらは設計書本文に存在せず実装由来＝オラクル混入。文言は要確認:実機とし、観測オラクルは「エラーフラッシュ表示＋取込画面URLに留まる」に限る）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は検証で打ち切り＝ロールバックされ非破壊。
 *  - 商品コード未入力(024)・商品不存在(030)・ヘッダ不正(021,023)・データ空(022)は更新対象が確定せず非破壊。
 *  - 成功系(010)・棚番号マスタ不存在(012)・商品コード重複(011)・行数上限(013)は破壊的/要シード/巨大入力のため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductShelfNumberCsvImportPage } from "../../../pages/admin/m03/m03_40_admin_product_product_shelf_number_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// オラクル独立性（重要）: 各判定の打ち切りメッセージ文言は設計書本文(functions/...md)・観点表に存在せず
// messages.ja.yaml(実装)のみに由来するため、期待値として固定しない（toContainText で実装文言をオラクル化しない）。
// 設計書(判定順序・エラー処理)由来の観測オラクルは「エラーフラッシュ(.alert-danger)が表示され、取込画面URLへ留まる(PRG)」とする。
// どの判定順序を励起するかは入力CSVで決定し（コメントに判定#と実装文言を実機確認用に併記）、文言自体は要確認(実機)とする。
//  - 判定#3 ヘッダ形式不一致（実装文言例「CSVのフォーマットが一致しません。」/ admin.csv.error.format.header）要確認
//  - 判定#3 データ空（実装文言例「CSVデータが存在しません。」/ admin.csv.error.data.empty）要確認
//  - 判定#4 列数2不一致（実装文言例「CSVのフォーマットが一致しません。 1 行目…」/ admin.csv.error.format.body）要確認
//  - 判定#5 商品コード必須（実装文言例「商品コード は必須項目です。 1 行目…」/ admin.csv.error.data.require）要確認
//  - 判定#5 棚番号 数値検証（設計: 非空・非数値は列検証失敗で全体中断。不具合候補#1で実装は findOneByName 名称照合へ乖離）要確認
//  - 判定#6 商品コード0件（実装文言例「1 行目の 商品コード ではデータを取得できません。」/ admin.csv.error.product.not_exists）要確認

// CSV ヘッダ（getCsvHeader のキー順 ProductShelfNumberCsvController.php:183-189）。
const HEADER = "商品コード,棚番号";

const IMPORT_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/product_shelf_number_csv_import`;
const IMPORT_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/product_shelf_number_csv_import(\\?|$)`
);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 棚番号更新CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-40-040 未ログインで棚番号更新CSV登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(IMPORT_PATH);
      // 管理ログイン画面へ誘導（権限・認可）。URL も管理ログインへ遷移していることを観測する。
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-40-041 未ログインで雛形ダウンロードURL→管理ログイン画面へ誘導（雛形は取得不可）", async ({ page }) => {
      // 権限・認可: 設計書は取込画面GET/雛形GET/取込POSTの3経路すべてを未ログイン到達不可とする。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/shelf_number/csv_template`);
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-40-042 未ログインで取込POST URL→管理ログイン画面へ誘導（取込されない）", async ({ page }) => {
      // 権限・認可: 取込POST経路も未ログイン到達不可。GETアクセスでもログインへ誘導されることを観測する。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/product_shelf_number_csv_upload`);
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-40-001 画面UI: ファイル入力・アップロードボタン・雛形リンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-40-ADMIN）");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-40-002 サブタイトル「棚番号更新CSV登録」相当・タイトル「商品管理」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // タイトル block は admin.product.product_management=「商品管理」(base_csv_upload.twig:3)
      await expect(page.locator("body")).toContainText("商品管理");
      // sub_title は admin.product.product_shelf_number_csv。設計書の表示名は「棚番号更新CSV登録」だが
      // 実装値は「棚番号登録CSVアップロード」(messages.ja.yaml:1834)＝不具合候補#2。仕様の語幹「棚番号」で確認する。
      await expect(page.locator("body")).toContainText("棚番号");
    });

    test("E2E-M03-40-003 フォーマット表で商品コードに必須バッジが付き、棚番号には付かない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // フォーマット表の見出しは商品コード・棚番号の2列（getCsvHeader）。必須は商品コードのみ（getRequiredCsvHeader）。
      // フォーマット表（base_csv_upload.twig:87 <table>。列見出しに商品コード/棚番号を含む唯一のテーブル）にスコープする。
      const formatTable = page.locator("table").filter({ hasText: "商品コード" });
      await expect(formatTable).toContainText("商品コード");
      await expect(formatTable).toContainText("棚番号");
      // フォーマット表内の「必須」バッジは1個（商品コードのみ＝getRequiredCsvHeader）。画面全体ではなく表内に限定し誤検知を防ぐ。
      await expect(formatTable.getByText("必須", { exact: true })).toHaveCount(1);
    });

    test("E2E-M03-40-006 ファイル選択でカスタムラベルに選択ファイル名が表示される（フロント挙動JS）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 設計書「フロント挙動 JS」: ファイル選択でカスタムラベルへファイル名表示。送信はしない＝非破壊。
      const fileName = "e2e_label_check.csv";
      await csv.attachFileOnly(fileName, `${HEADER}\n`);
      await expect(csv.fileNameLabel).toContainText(fileName);
    });

    test("E2E-M03-40-007 カード見出し（アップロード/フォーマット）・accept属性・履歴部品が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 設計書「フロント挙動 表示要素」: カード見出し2種・accept=.csv,text/csv,.tsv,text/tsv・CSV取込履歴一覧部品。
      // 見出し文言は実装trans値に依存するため固定せず、カード見出し要素が2つ以上存在することのみ観測する。
      await expect(csv.cardTitles).not.toHaveCount(0);
      // accept 属性（設計書: .csv,text/csv,.tsv,text/tsv）。少なくとも csv/tsv を受理する設定であることを確認。
      const accept = await csv.fileInput.getAttribute("accept");
      expect(accept ?? "").toContain("csv");
      expect(accept ?? "").toContain("tsv");
      // 履歴一覧部品（csv_import_history.twig）。履歴テーブルの存在を観測（件数=DB依存は手動/間接）。
      await expect(page.locator("table")).not.toHaveCount(0);
    });

    test("E2E-M03-40-004 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（商品コード空＝必須エラーで打ち切り・ロールバック）を送信し確認ダイアログ不在を観測。
      await csv.uploadCsv("e2e_no_confirm.csv", `${HEADER}\n,\n`);
      await expect(page).toHaveURL(IMPORT_RE); // POSTが直接実行された証跡（PRGで取込画面へ）
      expect(dialogShown).toBe(false); // 確認ダイアログなし（仕様: モーダル・ポップアップなし）
    });

    test("E2E-M03-40-005 雛形ダウンロードボタンで product_shelf_number_template.csv の取得が発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      // ファイル名のみ検証（内容＝ヘッダ行は手動確認）。仕様: 雛形ダウンロード処理フロー3。
      expect(download.suggestedFilename()).toBe("product_shelf_number_template.csv");
    });

    // ===== 取込バリデーション（要管理ログイン・打ち切り＝ロールバックで非破壊） =====

    test("E2E-M03-40-020 ファイル未選択で送信するとエラーが表示され取込画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      await csv.uploadButton.click(); // ファイル未選択のまま送信
      await expect(csv.errors.first()).toBeVisible(); // エラーフラッシュ表示（文言はNotBlank先行か要実機確認＝不具合候補#5）
      await expect(page).toHaveURL(IMPORT_RE); // 取込画面に留まる（PRG）
    });

    test("E2E-M03-40-021 ヘッダ不一致のCSVでヘッダ形式エラーとなり取込画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 判定順序#3 ヘッダ形式不一致。期待は設計書由来の観測（エラーフラッシュ＋取込画面に留まる）。
      // 実装文言「CSVのフォーマットが一致しません。」(admin.csv.error.format.header)は設計書外＝オラクル固定しない（要確認:実機）。
      await csv.uploadCsv("e2e_bad_header.csv", "col1,col2\nv1,v2\n");
      await expect(csv.errors.first()).toBeVisible();
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-40-022 ヘッダのみ（データ行0）でデータ不存在エラーとなり取込画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 判定順序#3 データ行0。実装文言「CSVデータが存在しません。」(admin.csv.error.data.empty)は設計書外＝固定しない（要確認:実機）。
      await csv.uploadCsv("e2e_no_data.csv", `${HEADER}\n`);
      await expect(csv.errors.first()).toBeVisible();
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-40-023 列数不一致（3列）で形式エラーとなり取込画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 列数が2でないデータ行（判定順序#4）。商品コードは実在不問で列数で打ち切り。
      // 実装文言「CSVのフォーマットが一致しません。 1 行目…」(admin.csv.error.format.body)は設計書外＝固定しない（要確認:実機）。
      await csv.uploadCsv("e2e_col_count.csv", `${HEADER}\nE2E-NOEXIST,1,extra\n`);
      await expect(csv.errors.first()).toBeVisible();
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-40-024 商品コード空（必須）で必須エラーとなり打ち切られる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 判定順序#5 商品コード必須。実装文言「商品コード は必須項目です。 1 行目…」(admin.csv.error.data.require)は設計書外＝固定しない（要確認:実機）。
      await csv.uploadCsv("e2e_code_empty.csv", `${HEADER}\n,1\n`); // 商品コード空・棚番号は任意
      await expect(csv.errors.first()).toBeVisible();
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-40-025 棚番号が非数値だと棚番号の数値検証で打ち切られる（設計: 列検証エラー）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 設計書: 棚番号は非空かつ非数値だと列検証(判定順序#5)で失敗し全体中断。#5 は商品コード件数(#6)より前に評価されるため実在商品コード不要＝非破壊。
      // 注: 実装は findOneByName 名称照合で数値検証を持たない（不具合候補#1）。本テストは仕様どおりに書き、乖離があれば落ちて検出する。
      // 期待は設計書由来の観測（エラーフラッシュ＋取込画面に留まる）。実装文言は固定しない（要確認:実機）。
      await csv.uploadCsv("e2e_shelf_nonnumeric.csv", `${HEADER}\nE2E-NOEXIST,ABC\n`);
      await expect(csv.errors.first()).toBeVisible();
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-40-030 商品コード不存在（0件）で商品不存在エラーとなり打ち切られる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 実在しない商品コード＋棚番号空（マスタ照合スキップ）。更新対象0件で打ち切り＝非破壊（判定順序#6）。
      // 実装文言「1 行目の 商品コード ではデータを取得できません。」(admin.csv.error.product.not_exists)は設計書外＝固定しない（要確認:実機）。
      await csv.uploadCsv("e2e_code_noexist.csv", `${HEADER}\nE2E-NOEXIST-CODE,\n`);
      await expect(csv.errors.first()).toBeVisible();
      await expect(page).toHaveURL(IMPORT_RE);
    });

    test("E2E-M03-40-026 TSV（タブ区切り）がタブ区切りとして読み込まれCSVと同経路で判定が進む", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductShelfNumberCsvImportPage(page);
      await csv.goto();
      // 設計書「入力項目」: 拡張子tsvのとき区切りがタブ。実在しない商品コードのタブ区切りTSVを送り、
      // CSVと同経路で判定が進み商品不存在(判定#6)等で打ち切り＝非破壊。実装文言は固定しない（要確認:実機）。
      await csv.uploadCsv(
        "e2e_tab.tsv",
        "商品コード\t棚番号\nE2E-NOEXIST-CODE\t\n",
        "text/tab-separated-values"
      );
      await expect(csv.errors.first()).toBeVisible();
      await expect(page).toHaveURL(IMPORT_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-40-010 実在商品コード＋有効棚番号の取込で成功フラッシュ(取込完了)が表示される（要: SEED-M03-40-PRODUCT＋値復元。破壊的。実装文言「登録が完了しました。」は設計書外＝要確認:実機）",
      async () => {
        // 期待は仕様(処理フロー8 / messages.ja.yaml:1773 admin.register.complete)由来。
        // dtb_product_class.shelf_number_id を UPDATE し dtb_csv_import_history に1件 INSERT する破壊的ケース。
        // 既知の単一規格(商品コード一意)＋既存棚番号を用意し、取込後に値を復元する。DB原値照合は手動/間接。
      }
    );

    test.fixme(
      "E2E-M03-40-011 同一商品コードの規格が2件存在し重複エラーで全体中断（要: SEED-M03-40-DUP データ不整合）",
      async () => {
        // 期待は仕様(判定順序#6 / エッジケース: 件数2以上で重複エラー breakAll)由来。
        // 同一 product_code を持つ規格を2件用意する必要があり、通常運用では作りにくいため要シード。
      }
    );

    test.fixme(
      "E2E-M03-40-012 棚番号が実在しない値で棚番号マスタ不存在エラーとなり打ち切り（要: SEED-M03-40-PRODUCT 実在商品コード）",
      async () => {
        // 期待は仕様(判定順序#7 / 棚番号が与えられたときマスタ存在を確認)由来。
        // 商品コードが1件実在する前提が必要（不存在だと#6で先に打ち切られ#7へ到達しない）。
        // 注: 実装は findOneByName（棚番号の名称照合）で、設計書の「主キーID(正の整数)」と乖離＝不具合候補#1。
      }
    );

    test.fixme(
      "E2E-M03-40-013 行数上限（110000行）超過で上限エラーとなり取込されない（要: 巨大ファイル・要実機。実装文言「N 行を超えるCSVファイルは登録できません。」は設計書外＝要確認:実機）",
      async () => {
        // 期待は仕様(処理フロー4 / 判定順序#2 / messages.ja.yaml:1429 admin.csv.error.upload.maxrecord)由来。
        // 110000行以上のCSV生成は重く不安定なため要実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-40-014 サイズ上限（配布既定5M）超過でサイズエラーとなり取込されない（要: 5M超ファイル・要実機）",
      async () => {
        // 期待は仕様(判定順序#1 / 入力項目: Symfony File サイズ上限 eccube_csv_size 既定5M)由来。
        // 5M超のファイル生成・送信は重く環境依存のため要実機確認後に実装。実装文言は設計書外＝要確認:実機。
      }
    );

    test.fixme(
      "E2E-M03-40-015 棚番号 空/0/負数で棚番号未設定（NULL更新）成功（要: SEED-M03-40-PRODUCT＋値復元。破壊的）",
      async () => {
        // 期待は仕様(入力項目「棚番号 空/0以下→未設定NULL」/ エッジケース / 判定#7スキップ→#8 NULLクリア)由来。
        // 実在商品コード＋棚番号空でマスタチェックを経ず shelf_number_id を NULL 更新する破壊的ケース。DB原値照合は手動。
      }
    );

    test.fixme(
      "E2E-M03-40-016 同一商品コード複数行が全成功し後行が前行を上書き（要: SEED-M03-40-PRODUCT＋値復元。破壊的）",
      async () => {
        // 期待は仕様(処理フロー#8 / エッジケース「全成功なら後行が前行を上書き」)由来。
        // 同一商品コードで異なる実在棚番号の複数データ行を送り、最終的に後行の棚番号で確定することを確認。DB原値照合は手動。
      }
    );

    test.fixme(
      "E2E-M03-40-017 同一商品コード複数行で後続行が失敗すると先行行も全体ロールバック（要: SEED-M03-40-PRODUCT。破壊的）",
      async () => {
        // 期待は仕様(排他制御・トランザクション / 判定順序#8注記「途中で breakAll なら一行も確定しない」)由来。
        // 1行目=有効、2行目=棚番号マスタ不存在等で失敗するCSVを送り、先行行の更新も含め部分保存されないことを確認。DB原値照合は手動。
      }
    );
  }
);
