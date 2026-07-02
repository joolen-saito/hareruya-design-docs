/**
 * 管理画面 商品管理「部門更新CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_35_admin_product_product_section_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、DB破壊/要シード/大容量の成功系・相関系は test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-35_admin_product_product_section_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は breakAll＝ロールバックされ非破壊。
 * 成功系(010,011)は dtb_product_class.section_id を更新する破壊的ケースのため fixme（付帯表3 のシード/後始末で管理）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSectionCsvImportPage } from "../../../pages/admin/m03/m03_35_admin_product_product_section_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_FORMAT_HEADER = "CSVのフォーマットが一致しません。"; // :2209 admin.csv.error.format.header（:2210 format.body も同先頭）
const MSG_DATA_EMPTY = "CSVデータが存在しません。"; // :2211 admin.csv.error.data.empty
const MSG_REQUIRE = "は必須項目です。"; // :2213 admin.csv.error.data.require（%s=商品コード）
const MSG_PRODUCT_NOT_EXISTS = "ではデータを取得できません。"; // :2218 admin.csv.error.product.not_exists
const MSG_SUCCESS = "登録が完了しました。"; // :1773 admin.register.complete

// 取込CSVの正しいヘッダ（getCsvHeader のキー順 ProductSectionCsvController.php:181-187）。
const HEADER = "商品コード,部門コード";

const UPLOAD_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/section/csv_upload`;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 部門更新CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-35-040 未ログインで部門更新CSV登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(UPLOAD_PATH);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導（権限・認可）
    });

    test("E2E-M03-35-042 未ログインで雛形DL(csv_template)URL→管理ログイン画面へ誘導", async ({ page }) => {
      // 権限・認可: 画面/雛形/取込POSTすべて未ログイン到達不可（設計書「権限・認可」）。
      const csv = new ProductProductSectionCsvImportPage(page);
      await page.goto(csv.templateUrl);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-35-001 画面UI: ファイル選択・アップロード・雛形DLボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-35-ADMIN）");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-35-002 フォーマット表に「商品コード」必須バッジと「部門コード」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("商品コード");
      await expect(page.locator("body")).toContainText("部門コード");
      // 必須ヘッダは商品コードの1列のみ（getRequiredCsvHeader）。フォーマット表の必須バッジは1個。
      await expect(csv.requiredBadge).toHaveCount(1);
    });

    test("E2E-M03-35-003 「CSVインポート履歴」カードと表示件数プルダウンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await expect(csv.historyTitle).toBeVisible();
      await expect(csv.pageCountPulldown).toBeVisible();
    });

    test("E2E-M03-35-007 ファイル入力のaccept属性に.csv/.tsvが含まれる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      // 仕様(フロント挙動 表示要素): accept=.csv,text/csv,.tsv,text/tsv。属性に拡張子が含まれることを観測。
      const accept = (await csv.fileInput.getAttribute("accept")) || "";
      expect(accept).toContain(".csv");
      expect(accept).toContain(".tsv");
    });

    test("E2E-M03-35-031 履歴件数を許容リスト外クエリ(999)で指定してもセッション保存されず既定件数のまま", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      // 仕様(GET画面処理#3 / 遷移時引き継ぎ): page_count は許容リストに含まれるときだけ保存される。
      await csv.gotoWithPageCount(999, 1);
      const selectedText = await csv.pageCountPulldown
        .locator("option:checked")
        .textContent();
      // 許容リスト外(999)は採用されず、選択は「999件」にならない（既定の許容件数のまま）。
      expect((selectedText || "").trim()).not.toContain("999");
    });

    test("E2E-M03-35-004 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      // 表示時点でモーダル(.modal.show)が無いこと（仕様: モーダル・ポップアップなし）。
      await expect(csv.modalDialog).toHaveCount(0);
      // 非破壊CSV（ヘッダ不一致＝フォーマットエラーで打ち切り）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("col1,col2\nv1,v2\n", "e2e_no_confirm.csv");
      await expect(csv.errorAlert.first()).toBeVisible(); // POSTが直接実行された証跡（フラッシュ）
      expect(dialogShown).toBe(false); // ネイティブ確認ダイアログなし（仕様: モーダル・ポップアップなし）
      await expect(csv.modalDialog).toHaveCount(0); // 送信経路でも確認モーダルDOMが出ないこと
    });

    test("E2E-M03-35-005 雛形ダウンロードで product_section_update.csv の取得が発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("product_section_update.csv"); // ファイル名のみ（内容は手動確認）
    });

    test("E2E-M03-35-030 履歴件数を許容リスト内クエリ(50)で指定すると「50件」が選択状態になる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.gotoWithPageCount(50, 1);
      // 選択中option（admin.common.count「%count%件」）が「50件」であること。
      const selectedText = await csv.pageCountPulldown
        .locator("option:checked")
        .textContent();
      expect((selectedText || "").trim()).toContain("50件");
      // 設計書「許容値ならセッションに保存」: クエリ無しで再訪しても件数が保持されること。
      await csv.goto();
      const persistedText = await csv.pageCountPulldown
        .locator("option:checked")
        .textContent();
      expect((persistedText || "").trim()).toContain("50件");
    });

    // ===== 取込バリデーション（要管理ログイン・breakAll＝ロールバックで非破壊） =====

    test("E2E-M03-35-020 ファイル未選択で送信するとエラーフラッシュが表示され同画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await csv.submitWithoutFile(); // ファイル未選択のまま送信
      await expect(csv.errorAlert.first()).toBeVisible(); // エラーフラッシュ（文言は要実機確認＝不具合候補#3）
      await expect(page).toHaveURL(csv.uploadRoute); // csv_upload に留まる
    });

    test("E2E-M03-35-021 ヘッダ不一致のCSVで「CSVのフォーマットが一致しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("col1,col2\nv1,v2\n", "e2e_bad_header.csv");
      await expect(csv.errorAlert).toContainText(MSG_FORMAT_HEADER);
      await expect(page).toHaveURL(csv.uploadRoute);
    });

    test("E2E-M03-35-022 ヘッダのみ（データ行0）で「CSVデータが存在しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv(`${HEADER}\n`, "e2e_no_data.csv");
      await expect(csv.errorAlert).toContainText(MSG_DATA_EMPTY);
      await expect(page).toHaveURL(csv.uploadRoute);
    });

    test("E2E-M03-35-023 列数が2でないデータ行でフォーマット不一致エラー", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      // 正しいヘッダ＋3列のデータ行（列数2不一致）
      await csv.uploadCsv(`${HEADER}\nE2E_NOEXIST,SEC,EXTRA\n`, "e2e_col_count.csv");
      await expect(csv.errorAlert).toContainText(MSG_FORMAT_HEADER); // format.body も同先頭文言
      await expect(page).toHaveURL(csv.uploadRoute);
    });

    test("E2E-M03-35-024 商品コード空で必須エラーとなり取込が中断される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv(`${HEADER}\n,SEC\n`, "e2e_code_empty.csv"); // 商品コード空・部門コード任意
      await expect(csv.errorAlert).toContainText(MSG_REQUIRE); // 「商品コード は必須項目です。」
      await expect(page).toHaveURL(csv.uploadRoute);
    });

    test("E2E-M03-35-025 存在しない商品コードで規格不存在エラーとなり取込が中断される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      // 実在しない商品コード＋部門コード空（規格実在チェックで打ち切り・非破壊）
      await csv.uploadCsv(`${HEADER}\nE2E_NOEXIST_PCODE,\n`, "e2e_product_missing.csv");
      await expect(csv.errorAlert).toContainText(MSG_PRODUCT_NOT_EXISTS);
      await expect(page).toHaveURL(csv.uploadRoute);
    });

    test("E2E-M03-35-041 取込POST後は常にcsv_upload画面へリダイレクトされる(PRG)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSectionCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("col1,col2\nv1,v2\n", "e2e_prg.csv"); // 非破壊（フォーマットエラー）
      await expect(page).toHaveURL(csv.uploadRoute); // GET csv_upload へリダイレクト
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-35-010 正常CSV取込で成功フラッシュ＋履歴1件追記（要: SEED-M03-35-PRODUCT/SECTION・section_id復元。破壊的）",
      async () => {
        // 期待は仕様(処理フロー#8 / messages.ja.yaml:1773「登録が完了しました。」)由来。
        // 既存商品コード＋既存部門コードのCSVで dtb_product_class.section_id を更新する破壊的ケース。後始末整備後に実装。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-35-011 部門コード空でsection_idがNULLクリアされ成功（要: SEED-M03-35-PRODUCT・値復元。破壊的・DB値は間接）",
      async () => {
        // 期待は仕様(エッジケース: 部門コード空→検証スキップ→NULL更新)由来。NULL更新自体はDB値で間接確認。
      }
    );

    test.fixme(
      "E2E-M03-35-026 非空の部門コードが部門マスタ不存在でマスタ不存在エラー打ち切り（要: SEED-M03-35-PRODUCT 既存商品コード）",
      async () => {
        // 期待は仕様(判定順序#7 / messages.ja.yaml:2214「…がマスターから取得できません。」)由来。
        // 規格実在チェックを通過させるため既存商品コードが必要。シード整備後に実装。
      }
    );

    test.fixme(
      "E2E-M03-35-027 改行行数が上限(5010)以上で行数上限超過メッセージ（要: 大容量CSV生成・性能/実機確認）",
      async () => {
        // 期待は仕様(判定順序#2 / messages.ja.yaml:1429「%maxRecord% 行を超える…」)由来。
        // 5010行以上のCSVを毎回生成するため重い。実機での性能確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-35-028 ファイルサイズ上限超過でエラーフラッシュ＋csv_uploadに留まる（要: 上限超過ファイル生成・実機確認）",
      async () => {
        // 期待は仕様(判定順序#1 / 入力項目: Symfony File サイズ上限 eccube_csv_size＝配布既定5M)由来。
        // 上限を超える大容量ファイルを生成して送信し、取込されずエラーフラッシュとなることを確認する。
        // 上限値はオラクル化せず「上限超過で取込不可」を期待（具体MBは要実機確認）。
      }
    );

    test.fixme(
      "E2E-M03-35-006c 雛形CSVの内容（ヘッダのみ・キー順=商品コード,部門コード）を検証（要: ダウンロード内容読込・実機確認）",
      async () => {
        // 期待は仕様(処理フロー雛形#2,#3 / フロント挙動: getCsvHeader キー順)由来。
        // download.path() から本文を読み、1行目のみ＝ヘッダ、列順が「商品コード,部門コード」であることを確認する。
        // Content-Type application/octet-stream はネットワーク応答ヘッダ確認のため別途/手動（ケース表 006）。
      }
    );

    test.fixme(
      "E2E-M03-35-043 未ログインで取込POST(import)が処理されず管理ログインへ誘導（要: request-context/multipart・実機確認）",
      async () => {
        // 期待は仕様(権限・認可: 取込POSTも未ログイン到達不可)由来。
        // page.request.post で multipart 送信し、最終応答が管理ログイン画面であり取込が実行されないことを確認する。
      }
    );

    test.fixme(
      "E2E-M03-35-090 ファイル選択でカスタムラベルにファイル名が表示される（要: ラベルセレクタ実機確認）",
      async () => {
        // 期待は仕様(フロント挙動 JS: ファイル選択でカスタムラベルへファイル名表示)由来。
        // csv.selectFile(...) 後に csv.fileNameLabel がファイル名を含むこと。
        // .custom-file-label のセレクタは未検証のため fixme（要実機確認）。
      }
    );
  }
);
