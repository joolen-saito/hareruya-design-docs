/**
 * 管理画面 在庫管理「在庫警戒リストCSV出力」(M04-07) E2E。
 * 納品ケース表 integration_test/e2e/m04_07_admin_stock_stock_warning_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 重要: 本機能は基本設計仕様書・Excel設計書で「Ph2で対応するため Ph1では実装しない」と明記された新規機能であり、
 * 刷新先 ec-cube-enterprise に在庫警戒リスト専用の Controller/Route/Service/出力画面(Twig)は **未実装**
 * （screenExists=false）。よって現時点で自動化（実装）できる E2E は無い。本specには「Ph2で実装後にE2E自動化
 * 見込み」のケースのみ test.fixme（理由付き）で残し、手動（CSV本文/フォーマット検査）・対象外（入力フォーム無し・
 * DB内部・バッチ集計内部）はケース表で全量管理する（規約「手動/対象外はspecに大量fixmeを残さない」）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-07_*.md / Excel設計書〔出力列16列・店舗指定なし出力・
 * 商品規格単位/NM対象・直近データ〕)由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 在庫警戒の専用ルート/画面/列定義はPh2実装時に確定するため、各 fixme は「要実機確認」を明記する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード方針: Ph2で有効化する際、資格情報(ECCUBE_ADMIN_USER/PASS)を要するケースは各テスト先頭で
 * 個別に test.skip(!HAS_CREDS, ...) すること。未ログイン直接アクセス（E2E-M04-07-020）は資格情報不要のため
 * describe 全体への一括 skip は掛けない（020 まで誤って skip されるのを避ける）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminStockStockWarningCsvExportPage } from "../../../pages/admin/m04/m04_07_admin_stock_stock_warning_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 在庫警戒リストCSV出力",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== Ph1未実装（専用ルート/画面未定義）＝Ph2実装後にE2E自動化見込み。理由付きで fixme =====

    test.fixme(
      "E2E-M04-07-001 在庫切れ・在庫警戒リスト出力画面に「在庫警戒リストCSV出力」ボタンが表示される（要: Ph2実装・専用画面/ボタンセレクタ実機確認）",
      async ({ page }) => {
        // 期待は仕様(利用者視点の入口・Excel識別ID 3)由来。Ph1未実装のため在庫警戒出力ボタンは未存在。
        // Ph2でボタンの id / trans キーを実機確認後、p.seeExportButton() を有効化する。
        await login(page);
        const p = new AdminStockStockWarningCsvExportPage(page);
        await p.gotoHostList();
        await p.seeExportButton();
      }
    );

    test.fixme(
      "E2E-M04-07-010 「在庫警戒リストCSV出力」押下でCSVダウンロードが発火する（要: Ph2実装・出力ルート/ボタン実機確認＋SEED-M04-07-WARNING）",
      async ({ page }) => {
        // 期待は仕様(プロセスフロー#2-#3)由来。Ph2でボタン押下→StreamedResponse のダウンロードを確認する。
        await login(page);
        const p = new AdminStockStockWarningCsvExportPage(page);
        await p.gotoHostList();
        const download = await p.downloadCsv();
        expect(download).toBeTruthy();
      }
    );

    test.fixme(
      "E2E-M04-07-011 出力応答が添付ファイル(attachment)のHTTPヘッダを返す（要: Ph2実装・出力URL実機確認）",
      async ({ page }) => {
        // 期待は仕様(CSV出力仕様・ダウンロード応答)由来。Ph2で出力URL確定後、Content-Disposition=attachment を確認する。
        await login(page);
        const p = new AdminStockStockWarningCsvExportPage(page);
        const res = await page.request.get(p.exportPath); // exportPath は Ph2確定まで要実機確認
        expect(res.status()).toBe(200);
        expect(res.headers()["content-disposition"]).toContain("attachment");
      }
    );

    test.fixme(
      "E2E-M04-07-012 出力URL直接アクセスでもダウンロードが発火する（要: Ph2実装・出力URL実機確認）",
      async ({ page }) => {
        // 期待は仕様(利用者視点の入口・URLエンドポイント)由来。Ph2で出力URL確定後に有効化する。
        await login(page);
        const p = new AdminStockStockWarningCsvExportPage(page);
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.goto(p.exportPath).catch(() => null),
        ]);
        expect(download).toBeTruthy();
      }
    );

    test.fixme(
      "E2E-M04-07-020 未ログインで出力URLへ直接アクセス→管理ログイン画面へ誘導（要: Ph2実装・出力URL実機確認）",
      async ({ page }) => {
        // 期待は仕様(権限・認可＝管理画面ガード)由来。資格情報不要だが出力URLがPh1未定義のため fixme。
        const p = new AdminStockStockWarningCsvExportPage(page);
        await page.goto(p.exportPath);
        await expect(page).toHaveURL(LOGIN_RE);
        await expect(page.locator("#login_id")).toBeVisible();
      }
    );

    // 注: 資格情報ガードは describe 全体へ一括では掛けない（資格情報不要の E2E-M04-07-020 まで
    //     誤って skip されるのを避ける）。Ph2で認証付きケースを有効化する際は、当該テスト先頭で
    //     個別に test.skip(!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS), ...) を記述する。

    // ===== 手動（CSV本文/フォーマット検査）・対象外（入力フォーム無し・DB内部・バッチ集計内部）は =====
    // ===== ケース表 m04_07_..._e2e_cases.md（付帯表2/2b）で全量管理する（spec には残さない）。 =====
  }
);
