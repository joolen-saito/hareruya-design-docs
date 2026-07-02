/**
 * 管理画面 商品管理「割引率変更CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_34_admin_product_product_discount_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-34_admin_product_product_discount_csv_import.md)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(NotBlank/CsvMimeType/csv_size)は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 【重要・screenExists=false】刷新先 ec-cube-enterprise に「割引率変更CSV登録」専用画面・取込ハンドラ・雛形(type=discount)が存在しない
 *  （専用ルート product_discount_csv_upload 無し／admin_product_csv_template は type=discount 未対応／取込種別定数10は未参照／
 *   discount_id は包括「商品カードCSV」CardCsvController.php:299-307 に吸収。本画面とは別機能で1:1対応しない）。
 * したがって本spec が載せる自動化候補（ブラウザ観測可能＝要確認ケース）は **実装済みを1件も持たず、いずれも test.fixme（理由付き）** とする。
 * 各ケースの期待結果は設計仕様どおりに記述してあり、移行方針（専用画面の再実装 or 商品カードCSVへの集約）確定・実機確認後に
 * セレクタを確定して有効化する。
 * 【specとケース表の対応】ケース表の全テストID(001-052)のうち、本specには「ブラウザで観測可能な自動化候補」を正常系/異常系の対で収録する
 *  （UI表示 001/002/004、正常取込 010/013、列順正常 033、境界正常 037、異常系 020/022/023/025/026/028/029/030/024/034/035/036、
 *   雛形DL 040、未認証 050/051/052）。
 *  DB照合が必須の手動/間接ケース(011,012,014,031)と、ブラウザ観測不能な対象外ケースはspecに載せずケース表(付帯表2/2b)で全量管理する
 *  （規約「手動/対象外はspecに残さない」）。よって本ファイルが「全件 test.fixme」なのは収録した自動化候補に対する記述であり、ケース表との不整合ではない。
 *
 * 実行ガード（有効化時）: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込CSVはテスト内で生成（setInputFiles バッファ）。異常系は打ち切り＝ロールバックされ非破壊。
 * 成功系(010,011,012,014)は dtb_product / 履歴を更新する破壊的ケースのため、シード/後始末（ケース表 付帯表3）で管理。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductDiscountCsvImportPage } from "../../../pages/admin/m03/m03_34_admin_product_product_discount_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 設計仕様(pf-eccube3 HareruyaEc)由来の入口。刷新先 ec-cube-enterprise には未存在（不具合候補#1）。
const SCREEN_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/product_discount_csv_upload`;

// 取込CSVヘッダ（設計仕様の必須列）。期待値は設計由来でオラクル化。
const HEADER = "商品ID,割引率(ID)";

// 全件に付す未実装理由（刷新先未存在）。
const REASON =
  "刷新先 ec-cube-enterprise に割引率変更CSV専用画面が未存在（product_discount_csv_upload 無し／csv_template type=discount 未対応）。移行方針確定・実機確認後にセレクタを確定して有効化する。";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 割引率変更CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 画面表示（要管理ログイン・非破壊） =====

    test.fixme(`E2E-M03-34-001 画面表示: ファイル選択・アップロードボタンが表示される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm(); // 期待: フォーム部品表示（フロント挙動「表示要素」由来）
    });

    test.fixme(`E2E-M03-34-002 画面表示: ボックス見出し「割引率変更CSV」が表示される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      // 期待は仕様(フロント挙動: ボックス見出し「割引率変更CSV」/サブタイトル「割引率変更CSVアップロード」)由来。
      await expect(page.locator("body")).toContainText("割引率変更CSV");
    });

    test.fixme(`E2E-M03-34-004 雛形ファイルダウンロードリンクが表示される（${REASON}）`, async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await expect(csv.downloadButton).toBeVisible(); // 利用者視点の入口（雛形DL）由来
    });

    // ===== 取込 正常系（破壊的・要シード SEED-M03-34-PRODUCT） =====

    test.fixme(`E2E-M03-34-010 正常CSVアップロードで成功メッセージが表示される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      // 実在商品ID・実在割引率ID（要シード）。期待は仕様(処理フロー#9 成功フラッシュ)由来。
      await csv.uploadCsv("discount_ok.csv", `${HEADER}\n1001,2`);
      await expect(page.locator("body")).toContainText("アップロード"); // 文言は刷新先で要再定義（不具合候補#2）
    });

    test.fixme(`E2E-M03-34-013 アップロード送信後URLは変わらず同一画面が再描画される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_ok.csv", `${HEADER}\n1001,2`);
      // 期待は仕様(画面遷移: PRGではない＝同一URL再描画)由来。
      await expect(page).toHaveURL(new RegExp(`product_discount_csv_upload`));
    });

    // ===== 取込 異常系（打ち切り＝ロールバックで非破壊） =====

    test.fixme(`E2E-M03-34-020 ファイル未選択で送信すると必須エラーで再描画される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadButton.click(); // ファイル未選択のまま送信
      // 期待は仕様(判定順序#1 フォーム必須・バリデーション「CSVファイル選択 NotBlank」)由来。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-022 CSV以外のMIMEファイルはフォームエラーになる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      // CSV以外のMIME（例: 画像）。期待は仕様(判定順序#1 フォーム検証・バリデーション「CSVファイル形式」)由来。
      // 具体のForm制約(CsvMimeType)文言はオラクル化せず、フォームエラー表示＝取込されないことのみ判定。
      await csv.uploadCsv("not_csv.png", "\x89PNG\r\n", "image/png");
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-023 サイズ上限超過のファイルはフォームエラーになる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      // 上限超過サイズ。期待は仕様(判定順序#1 サイズ上限・バリデーション)由来。
      // 具体の上限値(csv_size)はオラクル化せず、フォームエラー表示＝取込されないことのみ判定。
      const huge = [HEADER, ...Array.from({ length: 200000 }, (_, i) => `${1000 + i},2`)].join("\n");
      await csv.uploadCsv("discount_huge.csv", huge);
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-025 ヘッダ/データ行が無いCSVは取込エラーになる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_empty.csv", `${HEADER}\n`); // ヘッダのみ・データ行なし
      // 期待は仕様(判定順序#3 ヘッダ/データ行)由来。成功フラッシュは出ず errors 表示。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-024 行数5010以上で件数超過メッセージが表示される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      const rows = [HEADER, ...Array.from({ length: 5010 }, (_, i) => `${1000 + i},2`)].join("\n");
      await csv.uploadCsv("discount_over.csv", rows);
      // 期待は仕様(判定順序#2 5010行以上は件数超過で再描画)由来。
      await expect(page.locator("body")).toContainText("超過");
    });

    test.fixme(`E2E-M03-34-026 必須列名が欠落すると列存在エラーで打ち切られる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_no_col.csv", `商品ID\n1001`); // 「割引率(ID)」列欠落
      // 期待は仕様(判定順序#4 列数2・列名存在／エッジケース)由来。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-033 列順が異なっても必須列が揃えば正常取込される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      // 列順入替（割引率(ID),商品ID）。期待は仕様(エッジケース「列順の厳密一致は不要」)由来＝026の正常系対。
      await csv.uploadCsv("discount_reorder.csv", `割引率(ID),商品ID\n2,1001`);
      await expect(page.locator("body")).toContainText("アップロード"); // 文言は刷新先で要再定義（不具合候補#2）
    });

    test.fixme(`E2E-M03-34-034 データ行の商品IDが空のとき必須エラーになる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_no_pid.csv", `${HEADER}\n,2`); // 商品ID空
      // 期待は仕様(バリデーション「商品ID必須」／判定順序#5)由来。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-035 データ行の割引率(ID)が空のとき必須エラーになる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_no_did.csv", `${HEADER}\n1001,`); // 割引率(ID)空
      // 期待は仕様(バリデーション「割引率ID必須」／判定順序#5)由来。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-036 割引率IDが非数値のとき形式エラーになる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_did_nan.csv", `${HEADER}\n1001,abc`); // 割引率ID非数値
      // 期待は仕様(判定順序#5 割引率ID数値検証)由来＝027(商品ID非数値)の割引率ID側対。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-037 5009行（境界内）は件数超過にならず取込される（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      // ヘッダ込み5009行（5010未満）。期待は仕様(判定順序#2 5010未満は通過＝境界正常側)由来＝024の正常系対。
      const rows = [HEADER, ...Array.from({ length: 5008 }, (_, i) => `${1000 + i},2`)].join("\n");
      await csv.uploadCsv("discount_5009.csv", rows);
      await expect(page.locator("body")).not.toContainText("超過");
    });

    test.fixme(`E2E-M03-34-028 割引率IDがマスタ未存在のときエラーになる（${REASON}）`, async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_bad_master.csv", `${HEADER}\n1001,9999999`); // mtb_discount 不存在ID
      // 期待は仕様(判定順序#5 割引率ID mtb_discount 存在)由来。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-029 商品が未削除で存在しないときエラーで打ち切られる（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_no_product.csv", `${HEADER}\n99999999,2`); // 不存在商品ID
      // 期待は仕様(判定順序#6 商品本体未削除存在／商品存在検証)由来。
      await expect(csv.errors.first()).toBeVisible();
    });

    test.fixme(`E2E-M03-34-030 取込エラー時は成功フラッシュを積まず errors で表示する（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      await csv.uploadCsv("discount_invalid.csv", `${HEADER}\nabc,2`); // 商品ID非数値
      // 期待は仕様(エッジケース「取込エラーと成功フラッシュ」)由来。
      await expect(csv.errors.first()).toBeVisible();
    });

    // ===== 雛形ダウンロード =====

    test.fixme(`E2E-M03-34-040 雛形ダウンロードでファイルダウンロード応答が返る（${REASON}）`, async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      // 期待は仕様(処理フロー（雛形）: product_discount.csv をダウンロード応答)由来。BOM/列名内容検査は手動。
      expect(download.suggestedFilename()).toContain("discount");
    });

    // ===== 権限・認可（資格情報不要） =====

    test.fixme(`E2E-M03-34-050 未ログインで該当URL直接アクセスで管理ログインへ誘導される（${REASON}）`, async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 未ログインは取込POSTへ到達不可)由来。
      // 注: 刷新先に専用ルートが無いため、ログイン誘導ではなく404となる可能性あり（不具合候補#1＝失敗で検出見込み）。
      await page.goto(SCREEN_PATH);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test.fixme(`E2E-M03-34-052 未ログインで雛形DL URL直接アクセスは管理ログインへ誘導される（${REASON}）`, async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 未ログイン雛形GET到達不可)由来＝040の未認証対。
      const csv = new ProductProductDiscountCsvImportPage(page);
      await csv.gotoTemplate();
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test.fixme(`E2E-M03-34-051 未ログインでPOST取込しても取込が実行されない（${REASON}）`, async ({
      page,
    }) => {
      // 期待は仕様(権限・認可: 未ログインPOST到達不可)由来＝050のPOST対。
      // 未認証POSTは取込されずログイン誘導される（具体のHTTPステータスはオラクル化せず到達不可のみ判定）。
      const res = await page.request.post(SCREEN_PATH, { failOnStatusCode: false });
      expect(res.url()).not.toContain("product_discount_csv_upload"); // ログイン等へ誘導され取込URLに留まらない
    });
  }
);
