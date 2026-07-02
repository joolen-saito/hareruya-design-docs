/**
 * 管理画面 在庫管理「在庫移動指示リストエクスポート」E2E。
 * 納品ケース表 integration_test/e2e/m04_25_admin_stock_stock_move_instruction_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装する。手動（送り状CSV23列マッピング・雛形4列見出し・文字コード・固定値・
 * 関連店舗JOIN・対象0件時の見出しのみ・送り状CSV応答ヘッダ）・対象外（log_info・参照のみのDB内部値・入力境界＝
 * 入力フォームなし・バッチ/JSON等の非該当）はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-25_admin_stock_stock_move_instruction_export.md
 *   / 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 刷新先 ec-cube-enterprise に該当ルート admin_stock_move_instruction_labels_export（StockMoveInstructionController.php:317）
 *   / admin_stock_move_instruction_csv_download_record（同:334）が存在することを確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 未認証ガード(040)は資格情報不要。送り状CSVダウンロード(030/031)は一覧に1件以上の指示行が必要なためシード依存。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveInstructionExportPage } from "../../../pages/admin/m04/m04_25_admin_stock_stock_move_instruction_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 期待値は設計書「出力ファイル・レスポンス」由来。実装に合わせて変えない（オラクル独立性）。日時は動的のため正規表現照合。
const TEMPLATE_FILENAME_RE =
  /^stock_move_instruction_record_template_\d{14}\.csv$/;
const TEMPLATE_FILENAME_HEADER_RE =
  /filename=stock_move_instruction_record_template_\d{14}\.csv/;
const LABELS_FILENAME_RE = /^stock_move_instruction_labels_\d{14}\.csv$/;
// 未選択時のJSアラート文言は設計書に定義がなく、実装(messages.ja.yaml)由来となるためオラクル化しない。
// 仕様（送り状CSVは選択必須・未選択時は送信を抑止）由来の観測可能事実＝「アラート(dialog)が出る／ダウンロードが発火しない」のみで判定する。
const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction(\\?|$)`
);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 在庫移動指示リストエクスポート",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 未認証ガード（資格情報不要） =====

    test("E2E-M04-25-040 未ログインで雛形CSV URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockMoveInstructionExportPage(page);
      await page.goto(p.templatePath);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-25-043 未ログインで送り状CSV(POST /labels)→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 設計書「いずれも管理画面ログインを要する」由来。雛形GETに加え送り状CSV POSTも未認証ガードを検証（正常系040の対）。
      // 未認証は firewall がフォーム処理(CSRF/ids検証)より前にログインへリダイレクトするため、CSRFトークンは不要。
      const p = new StockStockMoveInstructionExportPage(page);
      const res = await page.request.post(p.labelsPath, {
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      // 管理ログイン画面へ誘導（リダイレクト）されること。
      expect([301, 302, 303, 307, 308]).toContain(res.status());
      const location = res.headers()["location"] || "";
      expect(location).toMatch(LOGIN_RE);
    });

    // ===== 認証必須 =====

    test.describe(() => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");

      test("E2E-M04-25-001 一覧に「在庫移動実績入力用CSVダウンロード」リンクが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        await expect(p.templateLink).toBeVisible();
      });

      test("E2E-M04-25-002 一覧に「送り状CSVダウンロード」ボタンが表示される", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        await expect(p.labelsButton).toBeVisible();
      });

      test("E2E-M04-25-010 雛形DLリンク押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        const download = await p.downloadTemplate();
        expect(download).toBeTruthy();
      });

      test("E2E-M04-25-011 雛形ファイル名が stock_move_instruction_record_template_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        const download = await p.downloadTemplate();
        expect(download.suggestedFilename()).toMatch(TEMPLATE_FILENAME_RE);
      });

      test("E2E-M04-25-012 雛形CSV URL直接GETでダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        // 添付応答へのナビゲーションは download イベントになり goto は中断され得るため握りつぶす。
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.templatePath).catch(() => null),
        ]);
        expect(download.suggestedFilename()).toMatch(TEMPLATE_FILENAME_RE);
      });

      test("E2E-M04-25-013 雛形CSV応答がHTTP200を返す", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        const res = await page.request.get(p.templatePath);
        expect(res.status()).toBe(200);
      });

      test("E2E-M04-25-014 雛形CSV応答のContent-Typeが text/csv である", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        const res = await page.request.get(p.templatePath);
        expect(res.headers()["content-type"]).toContain("text/csv");
      });

      test("E2E-M04-25-015 雛形CSV応答が attachment; filename=stock_move_instruction_record_template_<日時>.csv を返す", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        const res = await page.request.get(p.templatePath);
        const cd = res.headers()["content-disposition"] || "";
        expect(cd).toContain("attachment");
        expect(cd).toMatch(TEMPLATE_FILENAME_HEADER_RE);
      });

      test("E2E-M04-25-020 送り状CSV: 未選択でボタン押下するとアラートで送信が抑止される", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        // 未選択時はアラートで送信を抑止する仕様（選択必須・送信可否制御）。
        // 期待値は「アラート(dialog)が表示される／ダウンロードが発火しない」のみ。
        // アラートの具体文言は設計書に定義がなく実装由来のため照合しない（オラクル独立性）。
        let alertShown = false;
        let downloadFired = false;
        page.on("dialog", async (d) => {
          alertShown = true;
          await d.dismiss();
        });
        page.on("download", () => {
          downloadFired = true;
        });
        await p.labelsButton.click();
        expect(alertShown).toBe(true);
        expect(downloadFired).toBe(false);
      });

      test("E2E-M04-25-042 雛形DL時に確認ダイアログを介さない", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        let dialogShown = false;
        page.on("dialog", async (d) => {
          dialogShown = true;
          await d.dismiss();
        });
        await p.downloadTemplate();
        expect(dialogShown).toBe(false);
      });

      test("E2E-M04-25-041 雛形DL後も一覧画面に留まる", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        await p.downloadTemplate();
        await expect(page).toHaveURL(LIST_RE); // 同一タブのGETダウンロード＝一覧滞留
      });

      // ===== 送り状CSV（一覧に1件以上の指示行が必要＝シード依存） =====

      test("E2E-M04-25-030 送り状CSV: 行を選択してボタン押下でダウンロードが発火する", async ({ page }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        test.skip(
          (await p.rowChecks.count()) === 0,
          "一覧に在庫移動指示行が無い（SEED-M04-25-INSTRUCTION 未投入）"
        );
        const download = await p.downloadLabelsForFirstRow();
        expect(download).toBeTruthy();
      });

      test("E2E-M04-25-031 送り状CSVファイル名が stock_move_instruction_labels_<日時>.csv 形式である", async ({
        page,
      }) => {
        await login(page);
        const p = new StockStockMoveInstructionExportPage(page);
        await p.gotoList();
        test.skip(
          (await p.rowChecks.count()) === 0,
          "一覧に在庫移動指示行が無い（SEED-M04-25-INSTRUCTION 未投入）"
        );
        const download = await p.downloadLabelsForFirstRow();
        expect(download.suggestedFilename()).toMatch(LABELS_FILENAME_RE);
      });
    });

    // ===== 自動化予定だが未実装/要実機確認（理由付きで fixme） =====

    test.fixme(
      "E2E-M04-25-050 送り状CSV: ids空のPOSTで404を返す（要: 一覧フォームからの有効CSRFトークン採取手順の実機確認）",
      async () => {
        // 期待は仕様(分岐・例外: ids空配列/未指定→NotFoundHttpException 404)由来。
        // 実装はCSRF検証(Controller.php:321)がids検証(同:323-326)より先のため、有効トークン付きで空idsをPOSTする必要がある。
        // トークン名は Eccube\Common\Constant::TOKEN_NAME 由来の動的値（index.twig:344）であり、採取手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M04-25-051 送り状CSV: CSRFトークン欠落/改ざんのPOSTでは送り状CSVが出力されない（030正常系の異常系の対・要実機確認）",
      async () => {
        // 期待は仕様(「isTokenValid()でCSRF検証」＝CSRF不正/欠落時は対象処理を実行しない)由来。
        // 観測可能なオラクルは「CSV添付応答(octet-stream/attachment)が返らず download が発火しない」のみ。
        // 具体的なHTTPステータス・エラー画面文言は実装依存のためオラクル化しない（オラクル独立性）。
        // 有効セッション確立＋トークン改ざんPOST手順が未確定のため要実機確認後に実装。
      }
    );
  }
);
