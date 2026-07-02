/**
 * 管理画面 商品管理「セール用高額商品価格変更CSVアップロード」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_33_admin_product_product_sale_high_price_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」かつ非破壊で実行できるケースのみ実装し、
 * 要シード/破壊的（取込成功・価格更新・取込履歴追記・警告表示）と要実機確認は test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系はヘッダ不正/列バリデーション breakAll＝
 * ロールバックされ非破壊（BaseCsvImportHandler.php:75,88,94 breakAll／CsvImporter.php:270 isSuccessful 判定）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSaleHighPriceCsvImportPage } from "../../../pages/admin/m03/m03_33_admin_product_product_sale_high_price_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_FORMAT_HEADER = "CSVのフォーマットが一致しません。"; // :2209 admin.csv.error.format.header
const MSG_FORMAT_BODY = "行目のデータを確認してください"; // :2210 admin.csv.error.format.body
const MSG_NO_DATA = "CSVデータが存在しません。"; // :2211 admin.csv.error.data.empty
const MSG_REQUIRE = "は必須項目です"; // :2213 admin.csv.error.data.require
const MSG_MAX_LENGTH = "桁以内の数値"; // :2221 admin.csv.error.product.max_length
const MSG_INVALID = "の値が異常です"; // :2217 admin.csv.error.product.invalid
const MSG_NOT_EXISTS = "ではデータを取得できません"; // :2218 admin.csv.error.product.not_exists
const MSG_MAX_ROWS = "登録できません"; // :1429 admin.csv.error.upload.maxrecord
const MSG_SUCCESS = "登録が完了しました。"; // :1773 admin.register.complete

// 有効ヘッダは仕様（functions md「CSVアップロードファイル内の各列」表）由来＝7列。
// 列順は設計書の項目表どおり。ヘッダ名で列が解決される。
// ※刷新先 ec-cube-enterprise の getCsvHeader は5列のみ（買取価格・スマレジ連携フラグ欠落）＝不具合候補#1。
//   実装に寄せず仕様の7列を期待ヘッダとする（乖離はテスト失敗で検出）。
const HEADER =
  "商品コード,販売価格,買取価格,セールフラグ,帯URL,タグ(ID),スマレジ連携フラグ";

const PATH = `/${ECCUBE_ADMIN_ROUTE}/product/sale_high_price/csv_upload`;
const UPLOAD_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/sale_high_price/csv_upload(\\?|$)`
);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > セール用高額商品価格変更CSVアップロード",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M03-33-010 未ログインでアップロードURL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(PATH);
      await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: 未認証はログイン誘導
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M03-33-001 画面UI: ファイル入力・アップロードボタン・雛形リンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-33-ADMIN）");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M03-33-002 タイトル「商品管理」・サブタイトル「セール用高額商品価格変更CSVアップロード」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText("商品管理"); // title block messages:1723
      await expect(page.locator("body")).toContainText(
        "セール用高額商品価格変更CSVアップロード"
      ); // sub_title messages:1812
    });

    test("E2E-M03-33-003 フォーマット表で必須列（仕様5列）に必須バッジが付く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      // 仕様（functions md 列表）の必須列は 商品コード/販売価格/買取価格/セールフラグ/スマレジ連携フラグ の5列。
      // 帯URL・タグ(ID) は任意。必須バッジは5個（期待は仕様由来）。
      // ※刷新先実装は5列定義で必須バッジ3個になる可能性＝不具合候補#1（実装に寄せず仕様で固定し乖離を検出）。
      await expect(csv.requiredBadges).toHaveCount(5);
    });

    test("E2E-M03-33-004 送信前の確認ダイアログが表示されず直接送信される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      // 非破壊CSV（ヘッダ不一致＝即エラー・取込本体に入らない）を送信し、確認ダイアログが介在しないことを観測。
      await csv.uploadCsv("e2e_no_confirm.csv", "col1,col2\nv1,v2\n");
      await expect(csv.errorAlert).toContainText(MSG_FORMAT_HEADER); // POSTが直接実行された証跡
      expect(dialogShown).toBe(false); // 確認ダイアログなし（仕様: モーダル・ポップアップなし）
    });

    test("E2E-M03-33-005 取込履歴件数プルダウンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await expect(csv.pageCountSelect).toBeVisible(); // 履歴ページサイズ選択（csv_import_history.twig:10）
    });

    test("E2E-M03-33-006 雛形ダウンロードで sale_high_price_template.csv の取得が発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      expect(download.suggestedFilename()).toBe("sale_high_price_template.csv"); // ファイル名のみ（内容は手動確認）
    });

    // ===== 履歴ページング（要管理ログイン・非破壊） =====

    test("E2E-M03-33-007 履歴件数プルダウン変更で page_count クエリ付きURLへ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.changePageCount(50); // 許容リストの 50 件へ変更
      await expect(page).toHaveURL(/page_count=50/); // 同一パスにクエリ付きGET（画面遷移）
    });

    test("E2E-M03-33-008 page_count 許容外を直接指定してもエラーにならず画面が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      await page.goto(`${PATH}?page_no=1&page_count=7`); // 許容外（既定/セッション値が採用される）
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await expect(csv.pageCountSelect).toBeVisible(); // 画面は正常表示（不正値で500等にならない）
    });

    // ===== 取込バリデーション（要管理ログイン・breakAll＝ロールバックで非破壊） =====

    test("E2E-M03-33-020 ファイル未選択でアップロードするとエラーが表示されアップロード画面へリダイレクト", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.submitWithoutFile();
      await expect(csv.errorAlert).toBeVisible(); // エラーフラッシュ（文言は要実機確認＝不具合候補#2）
      await expect(page).toHaveURL(UPLOAD_RE); // アップロード画面へリダイレクト
    });

    test("E2E-M03-33-021 ヘッダ不一致のCSVで「CSVのフォーマットが一致しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_bad_header.csv", "col1,col2\nv1,v2\n");
      await expect(csv.errorAlert).toContainText(MSG_FORMAT_HEADER);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-022 ヘッダのみ（データ行0）で「CSVデータが存在しません。」", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_no_data.csv", `${HEADER}\n`);
      await expect(csv.errorAlert).toContainText(MSG_NO_DATA);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-023 物理列数不一致のCSVで形式不正（N行目）エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_col_count.csv", `${HEADER}\nE2E_NO_SUCH_CODE,100,0\n`); // 3列のみ（仕様は7列）
      await expect(csv.errorAlert).toContainText(MSG_FORMAT_BODY);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-024 必須列（販売価格）空で「必須項目です」エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_require.csv", `${HEADER}\nE2E_NO_SUCH_CODE,,100,1,,,1\n`); // 販売価格セルが空
      await expect(csv.errorAlert).toContainText(MSG_REQUIRE);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-025 販売価格が非数値だと値異常/0以上エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_numeric.csv", `${HEADER}\nE2E_NO_SUCH_CODE,abc,100,1,,,1\n`); // 販売価格=非数値
      await expect(csv.errorAlert).toContainText("販売価格"); // 該当列が示される（厳密文言は列バリデータ依存＝不具合候補#3）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-026 販売価格が9桁超過だと桁数エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_maxlen.csv", `${HEADER}\nE2E_NO_SUCH_CODE,1234567890,100,1,,,1\n`); // 販売価格=10桁
      await expect(csv.errorAlert).toContainText(MSG_MAX_LENGTH);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-027 セールフラグが0/1以外だと値異常エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_saleflg.csv", `${HEADER}\nE2E_NO_SUCH_CODE,100,100,2,,,1\n`); // セールフラグ=2は選択肢外
      await expect(csv.errorAlert).toContainText(MSG_INVALID);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-030 高額・非公開規格に該当しない商品コードで不存在エラーで打ち切り", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      // 実在しない商品コード（重複でも公開でもなく単純に不存在）→ 行ターゲット検証 not_exists で breakAll（非破壊）。
      await csv.uploadCsv("e2e_not_found.csv", `${HEADER}\nE2E_NO_SUCH_CODE_999,100,100,0,,,1\n`);
      await expect(csv.errorAlert).toContainText(MSG_NOT_EXISTS);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-050 5010行以上のCSVは取込前に拒否される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      // ヘッダ + 5011 データ行（改行カウント >= 5010）。取込本体に入らず拒否（非破壊）。
      const body = Array.from(
        { length: 5011 },
        () => "E2E_NO_SUCH_CODE,100,100,0,,,1"
      ).join("\n");
      await csv.uploadCsv("e2e_maxrows.csv", `${HEADER}\n${body}\n`);
      await expect(csv.errorAlert).toContainText(MSG_MAX_ROWS);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-012 取込POST後は常にアップロード画面へリダイレクトされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_redirect.csv", "col1,col2\nv1,v2\n"); // 失敗系でも
      await expect(page).toHaveURL(UPLOAD_RE); // 常に csv_upload へリダイレクト（GET）
    });

    test("E2E-M03-33-011 CSRFトークン不正のPOSTはエラーで取込されずアップロード画面へリダイレクト", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page); // セッションCookieを確立（page.request は同一コンテキストのCookieを共有）
      // 仕様(エラー処理: フォーム・CSRF不備→エラーフラッシュ＋リダイレクト)由来。
      // 不正トークンで import ルートへ直接POST→フォーム妥当性エラー→常に csv_upload へリダイレクト（副作用なし）。
      // フィールド名(blockPrefix admin_csv_import)は入力プラミングであり期待値オラクルではない。要確認: 実機でのフィールド名。
      const resp = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/product/sale_high_price/import`,
        {
          multipart: {
            "admin_csv_import[_token]": "invalid-csrf-token",
            "admin_csv_import[import_file]": {
              name: "e2e_csrf.csv",
              mimeType: "text/csv",
              buffer: Buffer.from(
                `${HEADER}\nE2E_NO_SUCH_CODE,100,100,0,,,1\n`,
                "utf-8"
              ),
            },
          },
        }
      );
      expect(resp.url()).toMatch(UPLOAD_RE); // 終了後は常に csv_upload へリダイレクト
    });

    test("E2E-M03-33-033 必須列（商品コード）空で「必須項目です」エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("e2e_require_code.csv", `${HEADER}\n,100,100,1,,,1\n`); // 商品コードセルが空（必須列）
      await expect(csv.errorAlert).toContainText(MSG_REQUIRE);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-028 スマレジ連携フラグが0/1以外だと値異常エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      // 仕様: スマレジ連携フラグは 0/1 のみ（必須）。2 は選択肢外＝値異常。
      // ※刷新先実装にスマレジ連携フラグ列が無い＝不具合候補#1（実装に寄せず仕様7列で送り乖離を検出）。
      await csv.uploadCsv("e2e_smaregi.csv", `${HEADER}\nE2E_NO_SUCH_CODE,100,100,0,,,2\n`);
      await expect(csv.errorAlert).toContainText(MSG_INVALID);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-029 買取価格が非数値だと値異常/0以上エラーで打ち切り", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      // 仕様: 買取価格は半角数字のみ（0 以上・必須）。非数値は値異常。
      // ※刷新先実装に買取価格列が無い＝不具合候補#1。
      await csv.uploadCsv("e2e_buy_numeric.csv", `${HEADER}\nE2E_NO_SUCH_CODE,100,abc,1,,,1\n`);
      await expect(csv.errorAlert).toContainText("買取価格"); // 該当列が示される（厳密文言は列バリデータ依存＝不具合候補#3）
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    test("E2E-M03-33-058 .tsv 拡張子はタブ区切りとして取り込まれる（ヘッダ不一致で形式エラー）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await csv.goto();
      // 仕様(汎用インポータ内部1): 拡張子が tsv のときはタブ区切りで読む。
      // タブ区切りの不一致ヘッダ→タブ分割で2列と解釈されヘッダ不一致エラー（非破壊）。
      await csv.uploadCsv(
        "e2e_bad_header.tsv",
        "col1\tcol2\nv1\tv2\n",
        "text/tab-separated-values"
      );
      await expect(csv.errorAlert).toContainText(MSG_FORMAT_HEADER);
      await expect(page).toHaveURL(UPLOAD_RE);
    });

    // ===== 画面遷移・認可（要管理ログイン or 認証不要・非破壊） =====

    test("E2E-M03-33-009 ナビ導線（商品管理>商品CSV管理>セール用…）でアップロード画面に到達", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // 仕様(利用者視点の入口): ナビ導線でアップロード画面に到達する。
      // リンク名は messages 由来（admin.product.sale_high_price_csv＝「セール用高額商品価格変更CSVアップロード」）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}`);
      await page
        .getByRole("link", { name: "セール用高額商品価格変更CSVアップロード" })
        .first()
        .click();
      await expect(page).toHaveURL(UPLOAD_RE); // csv_upload へ到達
    });

    test("E2E-M03-33-014 page_no を直接指定してもエラーにならず画面が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      await page.goto(`${PATH}?page_no=2&page_count=50`); // page_no はセッションへ保存される（観測は正常表示）
      const csv = new ProductProductSaleHighPriceCsvImportPage(page);
      await expect(csv.pageCountSelect).toBeVisible(); // 不正なページ番号でも500等にならず表示
    });

    test("E2E-M03-33-013 未ログインで import へ直接POSTすると取込されずログイン誘導", async ({ page }) => {
      // 認証不要で実行可（未ログインPOSTのガード観測）。
      // 仕様(権限・認可): 未認証はログイン誘導またはアクセス拒否。取込は実行されない（副作用なし）。
      const resp = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/product/sale_high_price/import`,
        {
          multipart: {
            "admin_csv_import[import_file]": {
              name: "e2e_unauth.csv",
              mimeType: "text/csv",
              buffer: Buffer.from(
                `${HEADER}\nE2E_NO_SUCH_CODE,100,100,0,,,1\n`,
                "utf-8"
              ),
            },
          },
        }
      );
      // ログイン画面へ誘導される（最終URLにログイン経路を含む。フィールド名は入力プラミング＝非オラクル）。
      expect(resp.url()).toMatch(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
    });

    // ===== 保留（要シード/破壊的・要実機確認。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-33-051 高額コード空/公開規格の商品コードで不存在エラー打ち切り（要: SEED-M03-33-PUBLIC 公開or高額コード空の規格。030の別分岐）",
      async () => {
        // 期待は仕様(エッジケース: 高額コードが空/NULL、または規格が公開のまま→検索ヒットせず不存在エラー)由来。
        // 030(実在しない商品コード)に対し、規格は存在するが検索要件を満たさない別失敗分岐。
        void MSG_NOT_EXISTS;
      }
    );


    test.fixme(
      "E2E-M03-33-040 有効CSV取込で「登録が完了しました。」＋取込履歴1件追加（要: SEED-M03-33-HIGH-PRICE。破壊的＝価格更新/履歴追記）",
      async () => {
        // 期待は仕様(処理フロー8 / messages.ja.yaml:1773 admin.register.complete)由来。
        // 高額・非公開規格の dtb_product_class を用意し、取込後に値を復元する後始末が必要。
        void MSG_SUCCESS;
      }
    );

    test.fixme(
      "E2E-M03-33-031 同一商品コードの規格が2件以上で重複エラー打ち切り（要: SEED-M03-33-DUP 重複規格）",
      async () => {
        // 期待は仕様(行ターゲット検証1 / messages.ja.yaml:2225 product_code_duplicated)由来。
        // 同一 product_code を持つ規格を2件以上シードする必要がある。breakAll＝非破壊。
      }
    );

    test.fixme(
      "E2E-M03-33-032 タグ(ID)がマスタに存在しないと取込エラー打ち切り（要: SEED-M03-33-HIGH-PRICE＋存在しないタグID）",
      async () => {
        // 期待は仕様(各列: タグIDマスタ存在検証)由来。対象規格が存在しないとタグ検証前に不存在で打ち切るため、
        // 有効な高額・非公開規格のシードが前提。
      }
    );

    test.fixme(
      "E2E-M03-33-042 セールON→CSVセールOFFで基準価格へ戻し、販売列≠0なら警告(セール外のため…)（要: SEED-M03-33-SALE-ON。破壊的）",
      async () => {
        // 期待は仕様(決定順序3 / messages.ja.yaml:1815 alert_off_sale_buy_only)由来。警告フラッシュ .alert-warning を観測。
      }
    );

    test.fixme(
      "E2E-M03-33-043 通常(OFF)かつCSVセールOFFで既存price02維持＋警告(通常商品のため…)（要: SEED-M03-33-SALE-OFF。破壊的）",
      async () => {
        // 期待は仕様(決定順序4 / messages.ja.yaml:1816 alert_end_sale_sell_from_standard)由来。警告フラッシュ .alert-warning を観測。
      }
    );
  }
);
