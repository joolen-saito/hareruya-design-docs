/**
 * 管理画面 商品管理「グッズ商品CSV登録」E2E。
 * 納品ケース表 integration_test/e2e/m03_27_admin_product_product_goods_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。取込内容の厳密照合・DBレコードの区分/件数/更新値照合・ログ出力抑止・
 * 行バリデータ（数値/文字種/相関/DB相関/カテゴリ制限）は手動/間接であり、ケース表(付帯表2/2b)で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約・ファイル名接頭辞は期待値に流用しない。
 *   - 成功フラッシュ「CSVファイルをアップロードしました」(messages.ja.yaml:1409)
 *   - 形式不一致「CSVのフォーマットが一致しません」(messages.ja.yaml:1561)
 *   - 行数超過「… 行を超えるCSVファイルは登録できません。」(messages.ja.yaml:1429)
 *
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 *   未認証ガード(E2E-M03-27-040/041)のみ資格情報不要で常時実行可。
 *   正常系の取込成功(020/022)は完全な有効CSV＋商品マスタを要するため test.fixme で残す。
 *   行数超過(032)は判定順序上マスタ不要のため in-test 生成で自動化する。
 */
import { readFileSync } from "node:fs";
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductGoodsCsvImportPage } from "../../../pages/admin/m03/m03_27_admin_product_product_goods_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 画面/POST URL（admin_product_goods_csv_import / _upload）。POST後は同URL(GET)へリダイレクトされる仕様。
const UPLOAD_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/product_goods_csv_upload(\\?|$)`);
// 管理ログイン画面URL（admin_login = /<route>/login）。未認証ガードの「ログイン画面へ誘導」観点に使う。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS_FLASH = "CSVファイルをアップロードしました"; // :1409
const SUBTITLE = "グッズ商品CSV登録"; // admin.product.product_goods_csv_upload :1739

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 商品管理 > グッズ商品CSV登録",
  { tag: ["@admin", "@product", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要・常時実行可） =====

    test("E2E-M03-27-040 未ログインで画面URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      // 仕様: 未認証は当URLへ到達できない（権限・認可）。
      const p = new ProductProductGoodsCsvImportPage(page);
      await p.goto();
      await expect(page).toHaveURL(LOGIN_RE); // 管理ログイン画面へ誘導
      await expect(p.loginId).toBeVisible();
    });

    test("E2E-M03-27-041 未ログインで雛形DL URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      const p = new ProductProductGoodsCsvImportPage(page);
      await page.goto(p.templateUrl); // 雛形DL URLへ直接GET
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(p.loginId).toBeVisible();
    });

    test("E2E-M03-27-043 未ログインでアップロードPOSTを送ると取込されずログイン画面へ誘導される", async ({ page }) => {
      // 仕様(権限・認可): 未認証は「本画面・POST」共に到達できない。POSTもファイアウォールで弾かれる。
      const p = new ProductProductGoodsCsvImportPage(page);
      const res = await page.request.post(p.uploadUrl, {
        multipart: {
          "admin_csv_import[import_file]": {
            name: "x.csv",
            mimeType: "text/csv",
            buffer: Buffer.from("商品ID\n", "utf-8"),
          },
        },
        maxRedirects: 0,
      });
      // 未認証は管理ログインへリダイレクト（302系）され、取込は実行されない。
      expect([301, 302, 303, 307, 308]).toContain(res.status());
      expect(res.headers()["location"] ?? "").toMatch(/\/login/);
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M03-27-001 グッズ商品CSV登録画面が表示される（入口・到達可能性）", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        // 入口（設計書「ナビ 商品管理→商品CSV管理→グッズ商品CSV登録」）の到達結果＝当画面表示を確認する。
        // ナビメニューのクリック経路（DOM）は本リポジトリ未検証のため URL 起点で到達結果のみを判定（要実機確認）。
        await p.goto();
        await expect(p.subTitle).toContainText(SUBTITLE); // サブタイトル（フロント挙動）
        await expect(p.uploadCardTitle).toBeVisible(); // アップロードカード見出し
      });

      test("E2E-M03-27-002 ファイル選択欄とCSVアップロードボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        await p.seeUploadForm(); // ファイル入力＋アップロードボタン（UI部品）
      });

      test("E2E-M03-27-003 CSVファイルフォーマット表と必須バッジが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        await expect(p.formatCardTitle).toBeVisible(); // 「CSVファイルフォーマット」
        await expect(p.requiredBadge.first()).toBeVisible(); // 必須列の「必須」バッジ
      });

      test("E2E-M03-27-004 雛形ダウンロードリンクが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        await expect(p.skeletonDownload).toBeVisible(); // 「雛形ファイルダウンロード」（操作起点）
      });

      test("E2E-M03-27-005 取込履歴と表示件数プルダウンが表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        await expect(p.historyTitle).toBeVisible(); // 「CSVインポート履歴」
        // 取込履歴の列見出し（ケース表「ファイル名・アップロード日時・作業者」由来）。
        await expect(p.historyColFilename).toBeVisible();
        await expect(p.historyColUploadDate).toBeVisible();
        await expect(p.historyColOperator).toBeVisible();
        await expect(p.pageCountPulldown).toBeVisible(); // 表示件数プルダウン
      });

      test("E2E-M03-27-006 ファイル選択するとラベルにファイル名が表示される（JS挙動）", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(フロント挙動・JS): ファイル選択でラベルにファイル名を表示する。
        await p.fileInput.setInputFiles({
          name: "sample_goods.csv",
          mimeType: "text/csv",
          buffer: Buffer.from("商品ID\n", "utf-8"),
        });
        // .custom-file-label の存在は要実機確認（form theme依存）。ラベルへ選択ファイル名が反映されること。
        await expect(p.fileLabel).toContainText("sample_goods.csv");
      });

      test("E2E-M03-27-007 ファイル入力の accept に CSV/TSV が含まれる（受理形式）", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(フロント挙動・入力項目): ファイル入力の accept は CSV/TSV を選択可能とする。
        const accept = await p.fileInput.getAttribute("accept");
        expect(accept ?? "").toMatch(/\.csv/);
        expect(accept ?? "").toMatch(/\.tsv/);
      });

      test("E2E-M03-27-008 フォーマット表に主要CSV列名が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(CSV列・1行目の日本語ヘッダ名): フォーマット表へ列名と説明が並ぶ。
        // 期待値は設計書「CSV列」一覧由来（実装の列順・内部キーには依存しない）。
        await expect(p.formatColumn("商品コード")).toBeVisible();
        await expect(p.formatColumn("規格画像")).toBeVisible();
        await expect(p.formatColumn("発送日目安(ID)")).toBeVisible();
      });

      test("E2E-M03-27-010 雛形ダウンロードリンク押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        const download = await p.downloadTemplate();
        expect(download).toBeTruthy(); // ダウンロード発火（実行結果。内容は手動）
      });

      test("E2E-M03-27-011 雛形ダウンロードのファイル名が product_goods.csv である", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        const download = await p.downloadTemplate();
        // 仕様(処理フロー・雛形DL): ファイル名は product_goods.csv。
        expect(download.suggestedFilename()).toBe("product_goods.csv");
      });

      test("E2E-M03-27-012 雛形ファイルはヘッダ1行のみ（データ行を含まない）", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        const download = await p.downloadTemplate();
        // 仕様(処理フロー・雛形DL): 1行目（列名）のみを書き出す。説明文列・データ行は含まない。
        const path = await download.path();
        const body = readFileSync(path, "utf-8");
        const lines = body.split(/\r?\n/).filter((l) => l.trim().length > 0);
        expect(lines).toHaveLength(1); // ヘッダ1行のみ＝データ行なし
      });

      test("E2E-M03-27-021 ファイル未選択でアップロードしてもアップロード画面へリダイレクトされる", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        await p.submitWithoutFile();
        // 仕様(画面遷移): POST完了（成否問わず）→ GET アップロード画面へリダイレクト。
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-27-030 ファイル未選択でアップロードするとエラーフラッシュが表示され取込されない", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        await p.submitWithoutFile();
        // 仕様(バリデーション): import_file は必須。エラーフラッシュが表示され、取込されずアップロード画面に滞留。
        await expect(p.errorFlash).toBeVisible();
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-27-031 ヘッダ不正/データ無しCSVは事前検証エラーで取込されない", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(処理フロー#3・バリデーション): ヘッダ行・データ行の事前検証に失敗するとエラー、DB変更なし。
        await p.uploadCsv("不正なヘッダ\n", "broken.csv");
        await expect(p.errorFlash).toBeVisible();
        await expect(page).toHaveURL(UPLOAD_RE);
      });

      test("E2E-M03-27-033 取込失敗時もアップロード画面へリダイレクトされ取込履歴は増えない", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        await p.uploadCsv("不正なヘッダ\n", "broken.csv");
        // 仕様(画面遷移・入出力): 失敗時はエラーフラッシュ＋アップロード画面へ。取込履歴は増えない（成功時のみINSERT）。
        await expect(page).toHaveURL(UPLOAD_RE);
        await expect(p.errorFlash).toBeVisible(); // 失敗＝エラーフラッシュ表示
        await expect(p.successFlash).toHaveCount(0); // 成功フラッシュは出ない＝履歴は増えない（間接）
        // 注: 取込履歴の「行数が増えない」厳密照合は DB副作用照合=手動/間接（付帯表2b 084）。
        //     ここでは成功フラッシュ非表示＋エラーフラッシュ表示を間接オラクルとする。
      });

      test("E2E-M03-27-042 ログイン済みで画面URLを直接GETすると画面が表示される", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(権限・認可): 管理者ログイン済みは利用可能。
        await expect(page).toHaveURL(UPLOAD_RE);
        await expect(p.uploadCardTitle).toBeVisible();
      });

      test("E2E-M03-27-050 表示件数プルダウン変更で page_count を載せたURLへ遷移する", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(セッション・遷移時に引き継ぐ状態): page_count をURL/セッションへ載せて再表示する。
        await Promise.all([
          page.waitForURL(/page_count=50/),
          p.pageCountPulldown.selectOption({ label: "50件" }),
        ]);
        await expect(page).toHaveURL(/page_count=50/);
      });

      test("E2E-M03-27-051 表示件数変更後に画面を再訪すると件数がセッションから復元される", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(セッション): 有効な page_count はセッションへ保存され、クエリ無しの再表示でも復元される。
        await Promise.all([
          page.waitForURL(/page_count=50/),
          p.pageCountPulldown.selectOption({ label: "50件" }),
        ]);
        await p.goto(); // クエリ無しで再訪
        expect(await p.selectedPageCountLabel()).toContain("50件");
      });

      test("E2E-M03-27-052 page_count に不正値を指定すると既定（10件）へフォールバックする", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // セッションに既定外が残らないよう、先に既定状態へ戻すため不正値で開く。
        // 仕様(処理フロー・GET表示): 不正な page_count は既定 10 に落とす。
        await p.gotoWithQuery("page_count=999999");
        expect(await p.selectedPageCountLabel()).toContain("10件");
      });

      test("E2E-M03-27-032 行数超過のCSVでエラーフラッシュが表示され取込されない", async ({ page }) => {
        await login(page);
        const p = new ProductProductGoodsCsvImportPage(page);
        await p.goto();
        // 仕様(判定順序#2 行数超過): 行数チェックはヘッダ/データ事前検証・行検証より前に走るため、
        // 完全な有効CSVや商品マスタは不要（in-test生成で自動化可能）。閾値行はテスト入力であり期待値ではない。
        const overLimitCsv = Array(5011).fill("x").join("\n") + "\n";
        await p.uploadCsv(overLimitCsv, "too_many_rows.csv");
        // 期待は仕様(エラー処理・最大行超過)由来＝エラーフラッシュ表示＋アップロード画面へリダイレクト（取込されない）。
        await expect(p.errorFlash).toBeVisible();
        await expect(page).toHaveURL(UPLOAD_RE);
      });
    });

    // ===== 保留（自動化予定だが要・完全CSV/マスタ・大容量。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-27-020 有効CSVのアップロードで成功フラッシュが表示される（要: 全必須列を満たす有効CSV＋商品マスタ）",
      async () => {
        // 期待は仕様(処理フロー#13・成功時出力)由来＝成功フラッシュ「CSVファイルをアップロードしました」。
        // 有効カテゴリID・購入グループ名称・価格整合等を満たす完全CSVとシード(SEED-M03-27-GOODS)整備後に実装。
        void SUCCESS_FLASH;
      }
    );

    test.fixme(
      "E2E-M03-27-022 取込成功後に取込履歴へアップロードしたファイル名が表示される（要: 有効CSV＋シード）",
      async () => {
        // 期待は仕様(データ整合性・取込履歴)由来＝成功時のみ履歴1件INSERT（間接確認）。
      }
    );
  }
);
