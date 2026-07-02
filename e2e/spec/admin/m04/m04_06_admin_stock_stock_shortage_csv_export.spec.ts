/**
 * 管理画面 在庫管理 在庫切れリストCSV出力 E2E（納品ケース表
 * integration_test/e2e/m04_06_admin_stock_stock_shortage_csv_export_e2e_cases.md に対応）。
 * 期待結果は仕様(Excel基本設計書 / functions/ec-cube-enterprise/m04-06_admin_stock_stock_shortage_csv_export.md)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * !!! screenExists=false（Ph1未実装） !!!
 *  Excel基本設計書に「在庫切れ、在庫警戒リストCSV出力はPh2で対応するため、Ph1では実装しない」と明記。
 *  刷新先 ec-cube-enterprise に専用 Controller/Route/Service/Form/Twig が存在しない（横断検索で未検出）。
 *  そのため自動化可能な実装済みケースは無く、本specは全ケースを **理由付き test.fixme**（自動化予定だが未実装）で残す。
 *  手動/対象外（CSV内容厳密検査・ログ・DB内部値・別機能M04-07）はケース表で全量管理しspecに残さない。
 *  Ph2実装着手時に画面・ルート・FormType(getBlockPrefix)が確定したら、Twig file:line 根拠でセレクタを埋め、
 *  各 test.fixme を test へ昇格して実装する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec も
 * @playwright/test を直接使う。本specも既存規約に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）と Ph2確定パス（STOCK_SHORTAGE_CSV_PATH）が無いと走らないよう
 * test.skip でガードする（ただし現状は刷新先未実装のため全件 fixme）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M04-06-ADMIN    : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（在庫管理に到達できる管理者・2FA OFF・デフォルト検索表示店舗設定済）
 *  - SEED-M04-06-SHORTAGE : 特定店舗に在庫数0の在庫情報を複数件（在庫切れ判定元テーブル/カラムはPh2実装で確定＝要確認）
 *  - STOCK_SHORTAGE_CSV_PATH : Ph2実装後の出力画面ルート（未定義のため要実機確認）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockShortageCsvExportPage } from "../../../pages/admin/m04/m04_06_admin_stock_stock_shortage_csv_export.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 出力対象店舗の必須エラー文言はPh2実装で確定（要確認）。実装に合わせず確定後に仕様文言でオラクル化する。

/** 管理者でログインし、ログイン画面から遷移するまで（Ph2実装後に使用）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe(
  "管理画面 > 在庫管理 > 在庫切れリストCSV出力",
  { tag: ["@admin", "@stock", "@csv-export"] },
  () => {
    // ===== 全件 test.fixme（screenExists=false／Ph1未実装＝刷新先に画面・ルート・FormTypeが存在しない） =====
    //   期待結果はすべて Excel基本設計書由来。Ph2実装着手時に Twig 根拠のセレクタを埋めて test へ昇格する。

    test.fixme(
      "E2E-M04-06-001 出力画面に出力対象店舗・在庫切れリストCSV出力・在庫警戒リストCSV出力が表示される（Ph1未実装）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "SEED-M04-06-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
        await login(page);
        const target = new StockStockShortageCsvExportPage(page);
        await target.goto();
        // Ph2実装後: 出力対象店舗(単一選択)・在庫切れリストCSV出力ボタン・在庫警戒リストCSV出力ボタンの表示を確認する。
      }
    );

    test.fixme(
      "E2E-M04-06-002 出力対象店舗の初期値がデフォルト検索表示店舗（Ph1未実装）",
      async () => {
        // 期待: Excel識別ID 1（初期値=デフォルト検索表示店舗）。Ph2でセレクタ確定後に実装。
      }
    );

    test.fixme(
      "E2E-M04-06-010 出力対象店舗を選択し在庫切れリストCSV出力でダウンロードが発火（Ph1未実装）",
      async () => {
        // 期待: プロセスフロー3-4／Excel識別ID 2。Ph2でDL発火(acceptDownloads)を検証する。
      }
    );

    test.fixme(
      "E2E-M04-06-020 出力対象店舗を未選択で在庫切れリストCSV出力するとエラーで出力されない（Ph1未実装）",
      async () => {
        // 期待: Excel識別ID 1（単一選択・必須○）。必須エラー表示＋DLされないことを確認する（仕様文言はPh2確定）。
      }
    );

    test.fixme(
      "E2E-M04-06-030 未認証で出力画面URLへ直接アクセスすると管理ログイン画面へ誘導（Ph1未実装＝ルート未定義）",
      async ({ page }) => {
        // 期待: 未認証ガード（管理画面共通）。Ph2でルート確定後、#login_id 表示を確認する。
        const target = new StockStockShortageCsvExportPage(page);
        await target.goto();
        await target.seeRedirectedToLogin();
        void ECCUBE_ADMIN_ROUTE;
      }
    );

    // 011/012（CSV内容16列・在庫0データ）は Ph2実装後も内容厳密検査が手動のためケース表で管理（spec常設しない）。
    // 031（参照のみ＝業務データ非更新）は間接確認のためケース表で管理する。
  }
);
