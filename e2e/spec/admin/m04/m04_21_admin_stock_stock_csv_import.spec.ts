/**
 * 管理画面 在庫管理「在庫変更CSV登録」E2E（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、要シード/破壊的/要実機・仕様乖離のケースは test.fixme（理由付き）で残す。
 * 手動・対象外はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md / 観点表 / 基本設計)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(NotBlank/Length/Count)・行数上限値・成功文言は期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（刷新先 ec-cube-enterprise が設計から大きく乖離）: URL・CSV列数(2→3)・変更理由キー(memo→stock_change_reason)・
 * 行数上限(5010→10000)・成功文言(「商品登録CSVファイルをアップロードしました。」→「保存しました」)・
 * 承認ワークフロー追加・クライアントJS検証/AJAX/確認モーダル追加。詳細はケース表 付帯表4「不具合候補（仕様乖離）」参照。
 * テストは仕様どおりに書き、実装が違えば落ちて検出する（期待値を実装へ書き換えない）。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報はコミットしない）。
 * 取込成功・行内エラーは在庫/履歴/承認(dtb_stock_edit_approval系)へ書き込む破壊的経路かつ要マスタ/商品シードのため fixme（付帯表3）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminStockStockCsvImportPage } from "../../../pages/admin/m04/m04_21_admin_stock_stock_csv_import.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様(設計書 表示メッセージ / messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const FEATURE_TITLE = "在庫変更CSV登録"; // 設計書 機能名（画面見出し）messages:4912
const TEMPLATE_FILENAME = "stock_change.csv"; // 雛形ファイル名（StockChangeCsvController.php:455）
// 設計書由来の成功文言（刷新先は「保存しました」のため乖離＝不具合候補#5。期待は仕様）。
const SPEC_SUCCESS = "商品登録CSVファイルをアップロードしました。"; // 設計書 表示メッセージ
// 設計書由来のフラッシュ文言（刷新先に該当キー無し＝不具合候補#4/#6。期待は仕様）。
const SPEC_FILE_REQUIRED = "ファイルを選択してください。"; // admin.csv.error.upload.require
const SPEC_DUPLICATE = "直近でアップロードされたファイル名です。ファイルを確認してください。"; // 刷新先に未実装
const SPEC_MAXRECORD_5010 = "5010 行を超えるCSVファイルは登録できません。"; // 設計書 %d=5010（刷新先は10000）

const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/change/new(\\?|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 在庫管理 > 在庫変更CSV登録",
  { tag: ["@admin", "@stock", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M04-21-020 未ログインで在庫変更CSV登録URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/change/new`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M04-21-021 未ログインで雛形ダウンロードURL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/change/csv-template`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 画面表示（要管理ログイン・非破壊） =====

    test("E2E-M04-21-001 画面UI: ファイル選択・登録ボタン・変更理由欄・フォーマット表・雛形リンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M04-21-ADMIN）");
      await login(page);
      const csv = new AdminStockStockCsvImportPage(page);
      await csv.goto();
      await csv.seeUploadForm();
    });

    test("E2E-M04-21-002 画面に機能名「在庫変更CSV登録」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockCsvImportPage(page);
      await csv.goto();
      await expect(page.locator("body")).toContainText(FEATURE_TITLE); // 設計書 機能名（title messages:4912）
    });

    test("E2E-M04-21-003 変更理由欄が必須表示で存在する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockCsvImportPage(page);
      await csv.goto();
      // 仕様(functions...md:86): 変更理由欄は「必須表示」「赤字注記」で示す。入力欄が表示されることを観測する。
      // 注: HTML required 属性は Form NotBlank 制約(StockChangeType)由来＝実装オラクルのため期待値に固定しない（オラクル独立性）。
      // 仕様の「必須表示・赤字注記」の可視確認はセレクタ未確定のため 要実機確認（深追いはせず実装制約へ寄せない）。
      await expect(csv.changeReason).toBeVisible();
    });

    test("E2E-M04-21-004 フォーマット表に「商品コード」「在庫増減数」が必須列として表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockCsvImportPage(page);
      await csv.goto();
      // 仕様: フォーマット表ヘッダは「商品コード（必須）」「在庫増減数（必須）」の2列。
      await expect(csv.formatTable.getByText("商品コード", { exact: true })).toBeVisible();
      await expect(csv.formatTable.getByText("在庫増減数", { exact: true })).toBeVisible();
      // 注: 刷新先は3列目に「仕入単価」を追加表示する（設計は2列＝不具合候補#2）。当該過剰列はテスト失敗で検出見込み。
      await expect(csv.formatTable.getByText("仕入単価", { exact: true })).toHaveCount(0);
    });

    test("E2E-M04-21-006 初期表示で確認モーダル・ポップアップが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockCsvImportPage(page);
      await csv.goto();
      // 仕様(フロント挙動 functions...md): モーダル・ポップアップは「表示しない」。初期表示でモーダルが可視でないことを観測。
      // 注: 仕様の「表示しない」は大量変動時も含む。刷新先は±100点以上の在庫変動で #largeChangeConfirmModal を出す（付帯表4#8）。
      // この大量変動時モーダル表示の乖離は取込操作(破壊的)が必要で本ケースでは未検出＝部分カバー。検出はE2E-060系(fixme/手動)で扱う。
      await expect(csv.largeChangeModal).toBeHidden();
    });

    test("E2E-M04-21-010 雛形ダウンロードボタンで stock_change.csv の取得が発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const csv = new AdminStockStockCsvImportPage(page);
      await csv.goto();
      const download = await csv.downloadTemplate();
      // 仕様: 在庫変更CSVの雛形を出力する。ファイル名のみ検証（内容＝列構成は手動確認＝CSV列乖離は付帯表4）。
      expect(download.suggestedFilename()).toBe(TEMPLATE_FILENAME);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-21-030 ファイル未選択で登録→「ファイルを選択してください。」表示で同画面（要実機: クライアントJSが登録ボタンを初期disabled制御。サーバ側文言は刷新先で乖離=不具合候補#6）",
      async () => {
        // 期待は仕様(表示メッセージ admin.csv.error.upload.require)由来。クライアントJSの活性化制御とサーバ側エラー表示位置を実機確認後に実装。
        void SPEC_FILE_REQUIRED;
        void LIST_RE;
      }
    );

    test.fixme(
      "E2E-M04-21-033 変更理由未入力で登録→必須エラーで取込されず同画面（要実機: 多数の必須項目をシードで満たす必要・client送信制御）",
      async () => {
        // 期待は仕様(バリデーション 変更理由 必須)由来。刷新先は店舗/在庫場所/区分/承認部署/通知先も必須のため正常入力のセットアップが必要。
      }
    );

    test.fixme(
      "E2E-M04-21-040 同名ファイル再取込→「直近でアップロードされたファイル名です。」で中止（要実機: 刷新先に同名重複チェック未実装=不具合候補#4。仕様どおり書き失敗で検出）",
      async () => {
        // 期待は仕様(エラー処理 同名再取込)由来。刷新先 StockChangeCsvController に同名チェックが無いため、本テストは失敗してギャップを検出する。
        void SPEC_DUPLICATE;
      }
    );

    test.fixme(
      "E2E-M04-21-041 行数上限超過→「5010 行を超えるCSVファイルは登録できません。」で中止（要実機: 大容量CSV。刷新先上限は10000=不具合候補#1。値は仕様5010）",
      async () => {
        // 期待は仕様(バリデーション 行数上限5010)由来。刷新先は10000行で判定するため、5010〜10000行のCSVで失敗＝乖離検出。
        void SPEC_MAXRECORD_5010;
      }
    );

    test.fixme(
      "E2E-M04-21-050 商品コード未存在のCSVで取込中断・エラー行表示（要シード: 在庫商品/店舗/承認マスタ。破壊的経路）",
      async () => {
        // 期待は仕様(判定順序#2 マスタ未存在エラーで中断)由来。SEED-M04-21-PRODUCT/MASTER 整備後に実装。
        // 刷新先のエラー文言はAJAX事前検証「商品コード「%s」が見つかりません」で乖離（不具合候補#7）。
      }
    );

    test.fixme(
      "E2E-M04-21-060 正常CSV取込→成功フラッシュ表示し取込履歴にファイル名追加（要シード・破壊的・承認WF。成功文言が刷新先で乖離=不具合候補#5）",
      async () => {
        // 期待は仕様(処理フロー#8 成功時「商品登録CSVファイルをアップロードしました。」＋取込履歴追加)由来。
        // 在庫/履歴/承認テーブルへ書き込む破壊的ケース。SEED整備・後始末・承認WFの扱い確定後に実装。
        void SPEC_SUCCESS;
      }
    );
  }
);
