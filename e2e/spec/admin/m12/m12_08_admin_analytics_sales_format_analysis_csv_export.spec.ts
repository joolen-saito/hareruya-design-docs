/**
 * 管理画面 フォーマット売上分析 CSVダウンロード E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m12_08_admin_analytics_sales_format_analysis_csv_export_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 仕様乖離(セッション依存)の検出を要する 021 は test.fixme（理由付き）で残す。
 * 手動（CSV内容・集計値の一致）／対象外（DB内部・M12-07委譲）はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 pf-eccube3 md / 観点表）由来（オラクル独立性）。実装の現挙動・Form制約・ファイル名を期待値に流用しない。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離はケース表「付帯表4」に出し、テストは仕様どおりに書く（落ちて検出）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m10系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 本機能は参照・出力のみで業務データを更新しない（副作用なし）。検索→ダウンロードは非破壊。
 *  - 集計値そのものの一致（CSV内容）・BOM・ヘッダ/データ行の中身は手動（ケース表 006-008,026,062-082）。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AnalyticsSalesFormatAnalysisCsvExportPage } from "../../../pages/admin/m12/m12_08_admin_analytics_sales_format_analysis_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// URLアサーションは管理ルートを含めて判定する（別ログイン画面・誤リダイレクトの取りこぼし防止）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
// 滞留先は集計（M12-07）画面の実URL。本機能の出力オラクルではなくホスト画面なので実URLで観測する。
const INDEX_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/analysis/format-sales(\\?|$)`);
// 仕様(pf-eccube3)の出力入口URL（path区切りはアンダースコア・メソッドはPOST）。
// オラクル独立性のためテストは仕様URLを叩く（実装のハイフン/GETと相違＝付帯表4 #1を落として検出）。
const SPEC_EXPORT_PATH = `/${ECCUBE_ADMIN_ROUTE}/analysis/format_sales/export`;

/** 管理ログインしてフォーマット売上分析を検索し、CSVダウンロード導線が出た状態にする。 */
async function gotoSearchedAsAdmin(
  page: Page
): Promise<AnalyticsSalesFormatAnalysisCsvExportPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new AnalyticsSalesFormatAnalysisCsvExportPage(page);
  await target.goto();
  await target.search(); // 画面初期値（当月・集計対象両ON）で検索
  return target;
}

test.describe(
  "管理画面 > フォーマット売上分析 > CSVダウンロード",
  { tag: ["@admin", "@analysis", "@csv"] },
  () => {
    // ===== 表示・出力（検索→ダウンロード・非破壊） =====

    test("E2E-M12-08-001 検索実行後に「CSVダウンロード」導線が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoSearchedAsAdmin(page);
      // 仕様: CSVダウンロードのボタンは集計フォームの送信ボタンとして配置される（フロント挙動・利用者視点の入口）。
      await target.seeCsvDownloadAvailable();
    });

    test("E2E-M12-08-002 CSVダウンロード押下でCSVファイルがダウンロードされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoSearchedAsAdmin(page);
      const download = await target.clickCsvDownload();
      // 仕様(フロント挙動: 表示要素＝CSVファイルのダウンロード)。内容の正否は手動（ケース表 006-008,026,062-082）。
      expect(download).toBeTruthy();
      expect((await download.path()) || download.suggestedFilename()).toBeTruthy();
    });

    test("E2E-M12-08-003 ダウンロードファイル名が format_sales_report_<YmdHis>.csv 形式", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoSearchedAsAdmin(page);
      const download = await target.clickCsvDownload();
      // 期待は仕様(入出力: 成功時出力)由来＝`format_sales_report_`+YmdHis+`.csv`。
      // 実装は `format_sales_`+YmdHis（付帯表4 #3）でプレフィックスが異なるため、本判定は失敗で乖離を検出する見込み。
      expect(download.suggestedFilename()).toMatch(
        AnalyticsSalesFormatAnalysisCsvExportPage.EXPECTED_FILENAME_RE
      );
    });

    test("E2E-M12-08-004 CSVダウンロード押下で画面遷移しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoSearchedAsAdmin(page);
      await target.clickCsvDownload();
      // 仕様(画面遷移: 「CSVダウンロード」押下→画面遷移せずCSVを出力)。ダウンロードはページ遷移を伴わない。
      await expect(page).toHaveURL(INDEX_RE);
    });

    test("E2E-M12-08-005 CSV出力応答が添付ファイル（ダウンロード）として返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoSearchedAsAdmin(page);
      const download = await target.clickCsvDownload();
      // 仕様(API/バッチ結果: CSV出力はストリーミング／入出力: 成功時出力＝CSVファイル)。
      // download イベントの発火自体が Content-Disposition: attachment（=添付ファイル応答）の証跡。
      // ブラウザ表示に切り替わらず（INDEX_RE滞留）、拡張子 .csv のファイルとして保存されること。
      await expect(page).toHaveURL(INDEX_RE);
      expect(await download.path()).toBeTruthy();
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
      // 要確認: Content-Type/Content-Disposition ヘッダの直接検証は download API では取得できず、
      // 応答ヘッダ検証が必要なら request コンテキスト経由の追加実装で補う。
    });

    test("E2E-M12-08-006 「CSVダウンロード」押下時に確認ダイアログ・モーダルが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await gotoSearchedAsAdmin(page);
      // 仕様(フロント挙動: 本機能専用のモーダルは無い)。ネイティブ dialog（confirm/alert）が出ればそれを捕捉する。
      let dialogShown = false;
      page.on("dialog", async (d) => {
        dialogShown = true;
        await d.dismiss();
      });
      const download = await target.clickCsvDownload();
      // 確認ダイアログ・ポップアップを介さずそのままダウンロードが発火すること。
      expect(dialogShown).toBe(false);
      expect(download).toBeTruthy();
    });

    // ===== バリデーション・権限（エラーパス） =====

    test("E2E-M12-08-010 集計月未入力ではCSV出力に進めない（集計月必須）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const target = new AnalyticsSalesFormatAnalysisCsvExportPage(page);
      await target.goto();
      await target.month.fill(""); // 集計月を空にして検索
      await target.search();
      // 仕様(エラー処理: 集計月は必須のため未入力では送信できない)。
      // 集計結果（CSVダウンロード導線）に進めないこと＝集計画面に滞留すること。
      await expect(page).toHaveURL(INDEX_RE);
      await expect(target.csvDownloadLink).toHaveCount(0);
    });

    test("E2E-M12-08-020 未ログインでCSV出力URLへ直接アクセス→管理ログイン画面へ誘導・出力しない", async ({ page }) => {
      // 資格情報不要（未ログイン前提）。仕様(権限・認可: 未ログイン管理者はアクセス不可)。
      // 仕様の出力URL（SPEC_EXPORT_PATH）を叩く（実装のハイフン/GETに寄せない＝オラクル独立性）。
      // 未認証は Symfony firewall がルーティング前に /login へ誘導するため、仕様URLでも認可ガードを観測できる。
      await page.goto(SPEC_EXPORT_PATH);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（仕様乖離検出・要実機確認。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M12-08-021 CSV出力は集計月の送信値で出力し検索条件セッションを参照しない（仕様乖離: 実装はセッション依存）",
      async () => {
        // 期待は仕様(集計条件: 集計月はCSVダウンロードの送信値とする／検索条件セッションは参照しない)由来。
        // 実装(FormatSalesController.php:101-107)は SESSION_KEY を参照し、検索未実行だと
        // 「検索条件がありません。先に検索を実行してください。」で集計画面へリダイレクトする（付帯表4 #2）。
        // ブラウザ単独で「集計月のみを送信して出力」する導線が無いため、乖離確認は実機/リクエスト構築後に実装する。
      }
    );
  }
);
