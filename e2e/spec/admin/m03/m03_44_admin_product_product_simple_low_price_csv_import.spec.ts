/**
 * 管理画面 商品管理「低価格帯カード価格変更CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_44_admin_product_product_simple_low_price_csv_import_e2e_cases.md に対応。
 *
 * 【重要】刷新先 ec-cube-enterprise に当該画面(Controller/Route/Twig/取込ハンドラ/MtbCsvImportType定数)が
 * 未実装である（ケース表 付帯表4 #1）。確認: SimpleLowPrice 系コントローラ/ハンドラ無し・MtbCsvImportType に
 * LOW_PRICE 系定数無し・low_price/simple_low ルート無し。高額(m03_32 simple_high_price)・基準価格(standard_price)が
 * 構造analog。したがって本spec の全ケースは「自動化予定だが未実装＝test.fixme（理由付き）」で残し、
 * 実装後に AdminLoginPage + ProductProductSimpleLowPriceCsvImportPage で本実装へ昇格する。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(基本設計「基準価格変更CSVアップロード/フォーマット」/ messages.ja.yaml)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。取込後の dtb_product_class 原値照合は手動/間接。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード（実装後）: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductSimpleLowPriceCsvImportPage } from "../../../pages/admin/m03/m03_44_admin_product_product_simple_low_price_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// オラクル独立性: 成功/エラーの判定はフラッシュ要素の出現(.alert-success/.alert-danger/.alert-warning)で行い、
// messages.ja.yaml 等の実装由来の確定文言は期待値に固定しない（低価格帯専用 trans キーは要実機確認＝ケース表 付帯表4 #4）。
// 期待結果は仕様(基本設計「基準価格変更CSVアップロード/フォーマット」)由来の「成功/エラー/警告が表示される」という観測事実に留める。

// 低価格帯専用ルート（要実機確認・未実装）。analog: product/simple_high_price/csv_upload。
const UP_PATH = `/${ECCUBE_ADMIN_ROUTE}/product/simple_low_price/csv_upload`;

// 取込CSVのヘッダ（基準価格変更CSVフォーマットの入力データ。オラクルではなく入力＝列数固定で実装に寄せない）。
// 【要確認】正典(正本 functions/.../m03-44_...md)は識別ID5「原価単価」について「新規追加」と「→こちら対応なし」が併記され内部矛盾。
// よって列数・順序（原価単価の有無）は実装で確定する要確認事項（ケース表 付帯表4 #2）。下記は代表入力で、列定義の固定オラクルではない。
const HEADER = "商品ID,言語ID,基準価格,買取価格"; // 要確認: 原価単価列を含む5列の可能性あり（正典内部矛盾）

async function login(page: Page) {
  // 資格情報未設定時は本テスト(認証必須)をスキップ（昇格後に空ID/空PWでのログイン試行を防ぐ）。
  test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M03-44-ADMIN）");
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > 低価格帯カード価格変更CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 全件 test.fixme: 刷新先に当該画面が未実装のため未実行（実装後に昇格） =====
    // 理由は各fixme末尾に明記。期待値は基本設計由来でオラクル化済み。

    test.fixme(
      "E2E-M03-44-001 画面UI: ファイル入力・アップロードボタン・雛形ダウンロードリンクが表示される（要: 低価格帯CSV登録画面の実装）",
      async ({ page }) => {
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.seeUploadForm(); // 基本設計 識別ID1/2/4
      }
    );

    test.fixme(
      "E2E-M03-44-002 アップロード画面の見出し（低価格帯カード価格変更CSV）が表示される（要: 画面実装＋trans キー確定）",
      async ({ page }) => {
        // 期待は基本設計「★『価格変更』に『基準』を追加」画面表記由来。低価格帯専用 trans キーは要実機確認。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await expect(page.locator("body")).toContainText("低価格帯");
      }
    );

    test.fixme(
      "E2E-M03-44-003 フォーマット表に必須項目（商品ID/言語ID/基準価格/買取価格）が表示される（要: 画面実装＋CSV列定義確定）",
      async ({ page }) => {
        // 期待は基準価格変更CSVフォーマット（識別ID1-4）由来。原価単価の要否は要確認（付帯表4 #2）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await expect(csv.requiredBadges.filter({ hasText: "必須" }).first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-010 雛形ファイルダウンロードボタンでCSV雛形の取得が発火する（要: 画面実装＋雛形ファイル名確定）",
      async ({ page }) => {
        // 期待は基本設計 識別ID4 雛形DL由来。ファイル名・内容は実装後の手動/要実機確認。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        const download = await csv.downloadTemplate();
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    );

    test.fixme(
      "E2E-M03-44-011 低価格帯カード価格変更CSVダウンロードプルダウンで件数別CSV出力が発火する（要: 識別ID5の実装＋セレクタ確定）",
      async () => {
        // 期待は基本設計 識別ID5/7（件数選択での低価格帯CSV出力）由来。実装セレクタ未存在＝要実機確認。
        // 本体は空にしない: 件数プルダウン/出力ボタンのセレクタが未確定のため、昇格時に未検証のまま成功(false positive)
        // とならないよう明示的に未実装で失敗させる。実装後にセレクタ確定→ダウンロード発火(waitForEvent('download'))へ差し替える。
        expect(
          false,
          "要実機確認: 低価格帯カード価格変更CSVダウンロードのプルダウン/出力ボタンのセレクタ未確定（識別ID5未実装）"
        ).toBe(true);
      }
    );

    test.fixme(
      "E2E-M03-44-020 セールフラグ無効の規格を取込→成功フラッシュ＋同画面に戻る（要: SEED-M03-44-PC-NOSALE・破壊的・後始末で価格復元）",
      async ({ page }) => {
        // 期待は基本設計 価格登録（セールフラグ無効=基準/販売/買取を更新）＋ messages.ja.yaml:1773 由来。
        // standard_price/price02/買取価格の更新値はDBで手動/間接確認。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_low_price_nosale.csv", `${HEADER}\n1,1,1000,500\n`);
        await expect(csv.flashSuccess).toBeVisible(); // 成功フラッシュの出現で判定（確定文言は実装に固定しない）
      }
    );

    test.fixme(
      "E2E-M03-44-021 セールフラグ有効の規格を取込→販売価格変更不可アラート＋基準/買取のみ更新（要: SEED-M03-44-PC-SALE・破壊的）",
      async ({ page }) => {
        // 期待は基本設計 価格登録（セールフラグ有効=販売価格据え置き＋アラート、基準/買取は更新）由来。
        // 販売価格据え置きはDBで手動/間接確認。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_low_price_sale.csv", `${HEADER}\n1,1,1000,500\n`);
        await expect(csv.flashWarning).toBeVisible(); // セール中商品の販売価格は変更できない旨のアラート
      }
    );

    test.fixme(
      "E2E-M03-44-030 ファイル未選択でアップロード→エラーフラッシュ表示・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は例外処理「入力不備（必須項目）」由来。文言は要実機確認（analog: admin.common.csv_invalid_no_data）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.submitWithoutFile();
        await expect(csv.flashError.first()).toBeVisible(); // エラーフラッシュの出現で判定（確定文言は実装に固定しない）
      }
    );

    test.fixme(
      "E2E-M03-44-031 列数/ヘッダ不一致のCSV→フォーマット不一致エラー・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は例外処理「入力不備（CSVヘッダ）」由来。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_bad_cols.csv", "col1\nE2E-NOPROD\n");
        await expect(csv.flashError.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-032 必須項目が空の行→必須エラー・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は例外処理「入力不備（CSV行・必須）」由来（観点 IT-22 必須）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_required_empty.csv", `${HEADER}\n,1,1000,500\n`);
        await expect(csv.flashError.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-033 基準価格が非数値→数値エラー・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は基準価格変更CSVフォーマット「基準価格=数値」由来（観点 IT-22 数値）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_price_nan.csv", `${HEADER}\n1,1,abc,500\n`);
        await expect(csv.flashError.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-034 基準価格が桁超過(10桁=最大999999999+1桁)→桁エラー・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は基準価格変更CSVフォーマット「最大値999999999（9桁）」由来（観点 IT-22 文字列長 境界外）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_price_overlen.csv", `${HEADER}\n1,1,1234567890,500\n`);
        await expect(csv.flashError.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-035 基準価格が9桁(999999999=最大値)→桁エラー無しで取込継続（要: SEED-M03-44-PC-NOSALE・境界内）",
      async ({ page }) => {
        // 期待は基準価格変更CSVフォーマット 最大値999999999由来（観点 IT-22 文字列長 境界内）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_price_max.csv", `${HEADER}\n1,1,999999999,500\n`);
        await expect(csv.flashSuccess).toBeVisible(); // 境界内は成功フラッシュ出現で判定（確定文言は実装に固定しない）
      }
    );

    test.fixme(
      "E2E-M03-44-036 存在しない商品ID/言語ID→データ取得不可エラー・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は基本設計「当該の商品データが見つからない場合は、エラーを返す」由来（観点 IT-22 DB相関）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_code_missing.csv", `${HEADER}\n999999999,1,1000,500\n`);
        await expect(csv.flashError.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-040 送信時に確認ダイアログが介在せず直接送信される（要: 画面実装）",
      async ({ page }) => {
        // 期待は観点 IT-25 送信可否制御/確認ダイアログ（base_csv_upload.twig は確認ダイアログ不使用）由来。
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_no_confirm.csv", `${HEADER}\n999999999,1,1000,500\n`);
        await expect(csv.flashError.first()).toBeVisible();
        expect(dialogShown).toBe(false);
      }
    );

    test.fixme(
      "E2E-M03-44-041 取込履歴件数プルダウン変更でpage_countを反映したURLへ遷移（要: 画面実装）",
      async ({ page }) => {
        // 期待は基本設計 識別ID7 件数・識別ID9 ページング由来。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await expect(csv.pageCountPulldown).toBeVisible();
        await csv.pageCountPulldown.selectOption({ index: 1 });
        await page.waitForURL(/page_count=/);
        expect(page.url()).toContain("page_count=");
      }
    );

    test.fixme(
      "E2E-M03-44-042 取込成功後はアップロード画面に戻り取込履歴先頭に当該ファイル名が表示される（要: SEED-M03-44-PC-NOSALE・破壊的）",
      async ({ page }) => {
        // 期待は基本設計 識別ID8 該当レコード表示（インポート日時降順）由来。履歴=間接確認。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_low_price.csv", `${HEADER}\n1,1,1000,500\n`);
        await expect(csv.flashSuccess).toBeVisible(); // 成功フラッシュの出現で判定（確定文言は実装に固定しない）
        await expect(page.locator("body")).toContainText("e2e_low_price.csv");
      }
    );

    test.fixme(
      "E2E-M03-44-050 未ログインでアップロードURL直接アクセス→管理ログイン画面へ誘導（要: 画面実装）",
      async ({ page }) => {
        // 期待は開始条件「管理画面にログイン済み」由来（観点 IT-13/IT-15 未認証）。
        await page.goto(UP_PATH);
        await expect(page.locator("#login_id")).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-004 CSVフォーマット表の原価単価列の要否を確認（要: 画面実装＋列定義確定。設計内部矛盾「新規追加→こちら対応なし」）",
      async ({ page }) => {
        // 期待は基準価格変更CSVフォーマット 識別ID5原価単価由来。正本md:232 で「新規追加」と「→こちら対応なし」が
        // 併記され矛盾するため、原価単価列の有無・必須/数値/桁の検証要否は実装で確定する要確認事項（付帯表4 #2）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        // 列の有無自体が未確定のため、フォーマット表の存在のみ観測（原価単価ラベルの固定オラクル化はしない）。
        await expect(csv.requiredBadges.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-037 商品ID/言語IDが非数値→数値エラー・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は基準価格変更CSVフォーマット「商品ID/言語ID=数値(整数)」（識別ID1/2）由来（観点 IT-22 数値）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_id_nan.csv", `${HEADER}\nabc,xyz,1000,500\n`);
        await expect(csv.flashError.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-038 商品ID/言語IDが桁超過(10桁=最大999999999+1桁)→桁エラー・同画面滞留（要: 画面実装）",
      async ({ page }) => {
        // 期待は基準価格変更CSVフォーマット「商品ID/言語ID 最大値999999999」（識別ID1/2）由来（観点 IT-22 文字列長 境界外）。
        await login(page);
        const csv = new ProductProductSimpleLowPriceCsvImportPage(page);
        await csv.goto();
        await csv.uploadCsv("e2e_id_overlen.csv", `${HEADER}\n1234567890,1,1000,500\n`);
        await expect(csv.flashError.first()).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M03-44-051 ログアウト済み/セッション期限切れでアップロードURLへアクセス→管理ログイン画面へ誘導（要: 画面実装）",
      async ({ page }) => {
        // 期待は開始条件「管理画面にログイン済み」由来（観点 IT-15 未認証＝ログアウト済み/セッション期限切れ）。
        await login(page);
        // ログイン状態を破棄（ログアウト相当）してから保護URLへアクセスし、管理ログイン誘導を観測する。
        await page.context().clearCookies();
        await page.goto(UP_PATH);
        await expect(page.locator("#login_id")).toBeVisible();
      }
    );
  }
);
