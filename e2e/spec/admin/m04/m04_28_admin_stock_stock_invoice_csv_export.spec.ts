/**
 * 管理画面 在庫管理「送り状CSV出力」E2E。
 * 納品ケース表 integration_test/e2e/m04_28_admin_stock_stock_invoice_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、シード/細工POSTが必要なものは test.fixme（理由付き）で残す。
 * 手動・対象外（CSV内容23列・値生成・SJIS-win・完了ログ log_info・DB参照のみ等）はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-28_admin_stock_stock_invoice_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * ダウンロード成功・ファイル名・行チェックボックスは「1件以上の在庫移動指示」(SEED-M04-28-INSTRUCTION)が要るため
 * test.fixme/前提付きで残す。空ids 404・不正CSRF拒否は認証済みコンテキストでの細工POSTが要るため test.fixme とする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockInvoiceCsvExportPage } from "../../../pages/admin/m04/m04_28_admin_stock_stock_invoice_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ALERT_SELECT_ROWS =
  "送り状CSVを出力する在庫移動指示にチェックを入れてください。"; // :4969 csv_invoice_select_rows
const INVOICE_BTN_LABEL = "送り状CSVダウンロード"; // :4968 csv_download_invoice

const LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction(/page/\\d+)?(\\?|$)`
);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 送り状CSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（資格情報不要） =====

    test("E2E-M04-28-031 未ログインで在庫移動指示一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new StockStockInvoiceCsvExportPage(page);
      await p.gotoList(); // 未認証でGET
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-28-032 未ログインでCSV出力ルートへPOST→CSVが返らず管理ログインへ誘導", async ({ page }) => {
      const p = new StockStockInvoiceCsvExportPage(page);
      // 期待は仕様(利用者視点の入口・権限「管理画面ログインを要する」正本md:43,47,49)由来。
      // POST処理も管理ファイアウォールが isTokenValid/コントローラより前に認証判定する。未認証ならCSVストリームを返さずログイン誘導。
      const res = await page.request.post(p.labelsExportPath, {
        form: { "ids[]": "1" },
        maxRedirects: 0,
        failOnStatusCode: false,
      });
      expect([301, 302, 303, 307, 308]).toContain(res.status()); // ダウンロード(200/octet-stream)ではなくリダイレクト誘導
      expect(res.headers()["location"] ?? "").toContain(`/${ECCUBE_ADMIN_ROUTE}/login`);
    });

    // ===== UI部品・送信可否（認証要） =====

    test("E2E-M04-28-010 検索後の一覧に「送り状CSVダウンロード」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");
      await login(page);
      const p = new StockStockInvoiceCsvExportPage(page);
      await p.gotoList();
      await p.search(); // 検索実行で pagination 確定 → ボタン行が描画される（twig:157-162）
      await expect(p.invoiceButton).toBeVisible();
      await expect(p.invoiceButton).toContainText(INVOICE_BTN_LABEL);
    });

    test("E2E-M04-28-020 未選択で送り状CSVダウンロードを押すと選択促進アラートが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");
      await login(page);
      const p = new StockStockInvoiceCsvExportPage(page);
      await p.gotoList();
      await p.search();
      // JS(twig:405-414): チェック0件なら alert を出し submit させない。仕様文言で判定。
      let dialogMsg = "";
      page.once("dialog", async (d) => {
        dialogMsg = d.message();
        await d.dismiss();
      });
      await p.clickInvoiceExport(); // 1件もチェックせず押下
      await expect.poll(() => dialogMsg).toContain(ALERT_SELECT_ROWS);
    });

    test("E2E-M04-28-021 未選択でのクリックではダウンロードが発火せず一覧に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");
      await login(page);
      const p = new StockStockInvoiceCsvExportPage(page);
      await p.gotoList();
      await p.search();
      let downloaded = false;
      page.on("download", () => {
        downloaded = true;
      });
      page.once("dialog", (d) => d.dismiss());
      await p.clickInvoiceExport();
      await expect(page).toHaveURL(LIST_RE); // 送信されず一覧に滞留（JS return false）
      expect(downloaded).toBe(false);
    });

    // ===== POST専用ルート・直接アクセス（認証要） =====

    test("E2E-M04-28-030 送り状CSV出力ルートへGET直接アクセスすると許可されない(405)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");
      await login(page);
      const p = new StockStockInvoiceCsvExportPage(page);
      const res = await page.goto(p.labelsExportPath); // GET（ルートは methods=['POST'] :317）
      expect(res?.status()).toBe(405); // Method Not Allowed
    });

    // ===== 行チェックボックス（要: 1件以上の在庫移動指示 SEED-M04-28-INSTRUCTION） =====

    test("E2E-M04-28-011 各在庫移動指示行に ids[] チェックボックスが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定のため管理画面E2Eをスキップ");
      await login(page);
      const p = new StockStockInvoiceCsvExportPage(page);
      await p.gotoList();
      await p.search();
      test.skip(
        (await p.rowChecks.count()) === 0,
        "在庫移動指示が0件のためチェックボックス検証をスキップ（要 SEED-M04-28-INSTRUCTION）"
      );
      await expect(p.rowChecks.first()).toBeVisible();
      await expect(p.checkAll).toBeVisible();
    });

    // ===== 保留（シード/細工POST/要実機確認・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-28-001 1件選択して出力すると送り状CSVダウンロードが発火する（要: SEED-M04-28-INSTRUCTION）",
      async () => {
        // 期待は仕様(プロセスフロー#5・出力単位 在庫移動指示1件=CSV1行)由来。安定した在庫移動指示シード後に実装。
        // 実装時: await login(page); const p=new ...; await p.gotoList(); await p.search();
        //         const dl = await p.exportFirstAndWaitDownload(); expect(dl).toBeTruthy();
      }
    );

    test.fixme(
      "E2E-M04-28-002 ダウンロードファイル名が stock_move_instruction_labels_<YmdHis>.csv である（要: SEED-M04-28-INSTRUCTION）",
      async () => {
        // 期待は仕様(CSV出力仕様 ファイル名 stock_move_instruction_labels_{YmdHis}.csv)由来。
        // 実装時: const dl = await p.exportFirstAndWaitDownload();
        //         expect(dl.suggestedFilename()).toMatch(/^stock_move_instruction_labels_\d{14}\.csv$/);
      }
    );

    test.fixme(
      "E2E-M04-28-012 表頭の全選択チェックで全行の ids[] チェックボックスが一括ONになる（要実機確認: checkAll の JS ハンドラが当テンプレート内に未確認）",
      async () => {
        // 期待は仕様(UI部品 全選択)由来。#checkAll(twig:183) の一括ON挙動は当 twig の script に未定義のため、
        // 共通JSの有無を実機確認後に実装する（創作セレクタ/挙動を避ける）。
      }
    );

    test.fixme(
      "E2E-M04-28-040 ids 未指定で labels_export へPOSTすると 404 になる（要: 認証済み＋CSRFトークン細工POST）",
      async () => {
        // 期待は仕様(プロセスフロー#3・例外処理「対象未選択は404」Controller.php:323-326)由来。ids=[] 空配列は 042 で別途確認。
        // 実装時: 認証済みコンテキストで一覧から CSRF トークン(hidden #form_..._label_csv 内)を取得し、
        //         ids 無しで page.request.post(labelsExportPath) → status 404 を期待。
      }
    );

    test.fixme(
      "E2E-M04-28-042 ids=[]（空配列）を明示して labels_export へPOSTすると 404 になる（要: 認証済み＋CSRFトークン細工POST）",
      async () => {
        // 期待は仕様(プロセスフロー#3・例外処理「ids 無し・ids=[] の双方を404」正本md:112 / Controller.php:323-326 $requestedIds === [])由来。
        // 040(ids未指定)と分離し、空配列の分岐を個別確認する。
        // 実装時: 認証済みコンテキストで CSRF トークンを取得し、ids[] を空配列として明示送信 → status 404 を期待。
      }
    );

    test.fixme(
      "E2E-M04-28-041 不正なCSRFトークンで labels_export へPOSTすると拒否される（要: 細工POST）",
      async () => {
        // 期待は仕様(プロセスフロー#2・例外処理「CSRF不正は共通の不正トークン処理」isTokenValid :321)由来。
        // 実装時: ids 有り・改竄トークンで POST し、CSV ストリームが返らない（拒否）ことを確認。
      }
    );
  }
);
