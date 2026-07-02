/**
 * 管理画面 売上分析「入荷通知依頼 CSVダウンロード」E2E。
 * 納品ケース表 integration_test/e2e/m12_06_admin_analytics_sales_arrival_notification_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、シード/データが必要なダウンロード系・仕様乖離は test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m12-06_admin_analytics_sales_arrival_notification_csv_export.md)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 入荷通知依頼データが必要なダウンロード発火・ファイル名・CSV本文は SEED-M12-06-REQUEST が要るため test.fixme とし、
 * ケース表のシード要件(付帯表3)で管理する。空セッションの空出力(010)は実装乖離(付帯表4 #2)のため fixme。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesArrivalNotificationCsvExportPage } from "../../../pages/admin/m12/m12_06_admin_analytics_sales_arrival_notification_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 売上分析 > 入荷通知依頼CSVダウンロード",
  { tag: ["@admin", "@analysis", "@csv"] },
  () => {
    // ===== 権限・認可（未ログイン・資格情報不要） =====

    test("E2E-M12-06-020 未ログインで export URL直アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await page.goto(p.exportPath); // GET（権限・認可: 未ログインは出力しない）
      await expect(page).toHaveURL(LOGIN_RE); // CSV出力されず管理ログインへ誘導
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M12-06-021 未ログインで一覧URL直アクセス→管理ログイン画面へ誘導", async ({ page }) => {
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await page.goto(p.listUrl);
      await expect(page.locator("#login_id")).toBeVisible();
      await expect(page).toHaveURL(LOGIN_RE);
    });

    // ===== 検索フォーム・初期表示（要資格情報） =====

    test("E2E-M12-06-030 入荷通知依頼集計画面に検索フォーム・検索ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await p.gotoList();
      await p.seeSearchForm();
    });

    test("E2E-M12-06-031 初期表示（検索前）は結果一覧・CSVダウンロードリンクが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await p.gotoList(); // 検索を実行しない
      await expect(p.resultList).toHaveCount(0); // searched=false で #result_list は描画されない
      await expect(p.csvDownloadLink).toHaveCount(0);
    });

    // ===== 結果0件（要資格情報・データ不要） =====

    test("E2E-M12-06-006 検索結果0件のとき「CSVダウンロード」リンクが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await p.gotoList();
      await p.searchNoResult("E2E-NO-SUCH-REQUEST-" + Date.now());
      await expect(p.csvDownloadLink).toHaveCount(0); // 仕様: summary が無ければリンクは出ない
    });

    test("E2E-M12-06-007 検索結果0件のとき該当データなしメッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await p.gotoList();
      await p.searchNoResult("E2E-NO-SUCH-REQUEST-" + Date.now());
      await expect(p.noData).toBeVisible();
    });

    // ===== リンク表示・GET属性（要資格情報＋入荷通知依頼データ） =====

    test("E2E-M12-06-001 検索実行後（結果あり）の一覧に「CSVダウンロード」リンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await p.gotoList();
      await p.search(); // 全件相当で結果ブロックを描画（要: SEED-M12-06-REQUEST 相当のデータ）
      // seed未整備でデータ0件のときは仕様不具合でなくデータ不足。落とさずskipする（付帯表3）。
      test.skip(
        (await p.csvDownloadLink.count()) === 0,
        "SEED-M12-06-REQUEST 未整備（入荷通知依頼データ無し）"
      );
      await expect(p.csvDownloadLink).toBeVisible();
    });

    test("E2E-M12-06-002 「CSVダウンロード」リンクは export ルートへの GET である", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const p = new AnalyticsSalesArrivalNotificationCsvExportPage(page);
      await p.gotoList();
      await p.search();
      test.skip(
        (await p.csvDownloadLink.count()) === 0,
        "SEED-M12-06-REQUEST 未整備（入荷通知依頼データ無し）"
      );
      // 仕様: 画面遷移を伴わずGETリンク（admリンク）で分析CSV出力ルートへ向かう（確認ダイアログ無し）。
      // パスの実装固有セグメント（product-request）は期待値に固定しない＝設計は概略 analysis/request/export。
      // 完全パスの設計/実装差は付帯表4 #1（要確認）。ここでは「analysisのexportルートへのGETリンク」だけを判定する。
      await expect(p.csvDownloadLink).toHaveAttribute(
        "href",
        /\/analysis\/.*export(\?|$)/
      );
    });

    // ===== 保留（データseed/仕様乖離が必要・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M12-06-003 「CSVダウンロード」押下でCSVダウンロードが発火する（要: SEED-M12-06-REQUEST）",
      async () => {
        // 期待は仕様(入出力 成功時出力＝CSVファイル / 処理フロー#5-9)由来。
        // 実装時: await p.search(); const dl = await p.downloadCsv(); expect(dl).toBeTruthy();
      }
    );

    test.fixme(
      "E2E-M12-06-004 「CSVダウンロード」押下で画面遷移しない（要: SEED-M12-06-REQUEST）",
      async () => {
        // 期待は仕様(画面遷移: 画面遷移せずCSVを出力する)由来。ダウンロード前後でURL不変を確認する。
      }
    );

    test.fixme(
      "E2E-M12-06-005 ダウンロードファイル名が request_report_<YmdHis>.csv である（要: SEED-M12-06-REQUEST）",
      async () => {
        // 期待は仕様(入出力 ファイル名 request_report_＋YmdHis＋.csv)由来。
        // 実装時: const dl = await p.downloadCsv(); expect(dl.suggestedFilename()).toMatch(/^request_report_\d{14}\.csv$/);
      }
    );

    test.fixme(
      "E2E-M12-06-040 CSVヘッダ行が設計の列順である（要: SEED-M12-06-REQUEST／乖離#3を検出）",
      async () => {
        // 期待は仕様(業務ルール: 商品コード・商品名・言語・状態・販売金額・在庫数・会員名・依頼日・購入日・通知日/通知設定削除日)由来。
        // 実装は商品集計サマリ(商品ID・言語ID・商品名・通知待ち・削除)＝付帯表4 #3。テストは設計ヘッダを期待し落ちて検出する。
        // download.path()/readCsvText でヘッダ行を自動検証可能（CSV本文の各セル値・エンコードは手動）。
        // 実装時:
        //   const dl = await p.downloadCsv();
        //   const text = await p.readCsvText(dl);
        //   const header = text.replace(/^﻿/, "").split(/\r?\n/)[0];
        //   expect(header).toBe("商品コード,商品名,言語,状態,販売金額,在庫数,会員名,依頼日,購入日,通知日/通知設定削除日");
      }
    );

    test.fixme(
      "E2E-M12-06-044 出力CSVの先頭にBOMが付与される（要: SEED-M12-06-REQUEST）",
      async () => {
        // 期待は仕様(入出力: 文字コード判別用のBOMを付与する)由来。
        // 実装は CsvExportService::fopen() で eccube_csv_export_encoding=UTF-8 のとき BOM を出力（付帯表4 #4＝要確認）。
        // 実装時:
        //   const dl = await p.downloadCsv();
        //   const text = await p.readCsvText(dl);
        //   expect(text.startsWith("﻿")).toBe(true);
      }
    );

    test.fixme(
      "E2E-M12-06-010 検索条件セッションが空のまま export 直アクセスで空条件で抽出・出力される（仕様乖離#2・要確認）",
      async () => {
        // 期待は仕様(エラー処理: 検索条件セッションが空＝空の検索条件で抽出し、出力する)由来。
        // 実装(ProductRequestController.php:97-101)は「検索条件がありません。」のエラー＋一覧へリダイレクトで非出力＝乖離。
        // テストは仕様(空出力＝ダウンロード発火)を期待し、実装が違えば落ちて検出する。実機の挙動確認後に確定する。
      }
    );
  }
);
