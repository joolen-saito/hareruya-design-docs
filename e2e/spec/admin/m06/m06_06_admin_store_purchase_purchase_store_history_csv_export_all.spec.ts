/**
 * 管理画面 店頭買取管理「買取商品履歴 検索結果全件CSV出力」E2E（M06-06）。
 * 納品ケース表 integration_test/e2e/m06_06_admin_store_purchase_purchase_store_history_csv_export_all_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、要実機確認/要データ生成は test.fixme（理由付き）で残す。
 * 手動/対象外（CSV列値・固定ヘッダ・行数・BOM/エンコード・件数厳密一致・DB副作用・ログ）はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-06_..._csv_export_all.md / 観点表)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・内部セッションキー名・ログ文言は期待値に流用しない。
 * pf-eccube3(HareruyaEc)由来設計だが刷新先 ec-cube-enterprise に同一画面(admin_otcbuyorder_history)が実在するためE2E化した。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts・m05系も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報(ECCUBE_ADMIN_USER/PASS)が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 * UI起点（CSVダウンロードドロップダウン）は履歴が1件以上ヒットする必要があるため SEED-M06-06-HISTORY を前提とする
 * （CSVメニューは pagination.totalItemCount>0 のときのみ描画＝history.twig:164,186-192）。
 */
import { test, expect, Page, Dialog } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreHistoryCsvExportAllPage } from "../../../pages/admin/m06/m06_06_admin_store_purchase_purchase_store_history_csv_export_all.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const HISTORY_PAGE_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history/page/\\d+(\\?|$)`);
const EXPORT_PATH = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history/export`;

// 仕様(OtcBuyOrderHistoryController.php:179 addError)由来のフラッシュ文言。実装に合わせて変えない（オラクル独立性）。
const ERR_NO_CONDITION = "条件に一致する商品がありません";

/** 管理ログインして買取商品履歴一覧を開き、検索を成功させて一覧（CSVメニュー）を表示する。 */
async function loginAndSearch(page: Page): Promise<StorePurchasePurchaseStoreHistoryCsvExportAllPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const target = new StorePurchasePurchaseStoreHistoryCsvExportAllPage(page);
  await target.gotoHistory();
  await target.submitSearch(); // 検索条件は空のまま＝全件検索（SEED-M06-06-HISTORY で1件以上ヒット前提）
  return target;
}

test.describe(
  "管理画面 店頭買取管理 > 買取商品履歴 検索結果全件CSV出力",
  { tag: ["@admin", "@store_purchase", "@csv_export"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M06-06-020 未ログインで履歴URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      const target = new StorePurchasePurchaseStoreHistoryCsvExportAllPage(page);
      await target.gotoHistory();
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン画面へ誘導
    });

    // ===== 検索一覧（SEED-M06-06-HISTORY 必須） =====

    test("E2E-M06-06-001 検索実行で一覧ブロックと件数見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndSearch(page);
      await target.seeResultList(); // 「検索結果 … 件 が該当しました」
    });

    test("E2E-M06-06-002 一覧描画時にCSVダウンロードドロップダウンと「検索結果全件取得」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndSearch(page);
      await target.seeAllExportLink(); // data-type=all_export「検索結果全件取得」
    });

    test("E2E-M06-06-003 「検索結果全件取得」押下でブラウザがCSVをダウンロードする", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndSearch(page);
      const download = await target.downloadAllExport();
      expect(download).toBeTruthy(); // ダウンロード発火＝ブラウザがCSVを取得
    });

    test("E2E-M06-06-004 ダウンロードCSVのファイル名が otc_buy_order_history_ で始まり .csv で終わる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndSearch(page);
      const download = await target.downloadAllExport();
      const name = download.suggestedFilename();
      // 仕様(処理フロー#7): 接頭辞 otc_buy_order_history_ ＋ 日時(YmdHis=14桁) ＋ 拡張子 .csv。
      expect(name).toMatch(/^otc_buy_order_history_\d{14}\.csv$/);
    });

    test("E2E-M06-06-005 出力前に確認ダイアログ/モーダルが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndSearch(page);
      let dialogShown = false;
      page.on("dialog", (d: Dialog) => {
        dialogShown = true;
        void d.dismiss();
      });
      const download = await target.downloadAllExport();
      expect(download).toBeTruthy();
      expect(dialogShown).toBe(false); // 仕様: 出力前の確認ダイアログはない
    });

    test("E2E-M06-06-006 全件取得POSTに export_type=all_export が乗りHTML遷移しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndSearch(page);
      await target.openCsvDropdown();
      const [request, download] = await Promise.all([
        page.waitForRequest(
          (req) => req.url().includes(EXPORT_PATH) && req.method() === "POST"
        ),
        page.waitForEvent("download"), // HTMLページ遷移ではなくダウンロード応答
        target.allExportLink.click(),
      ]);
      // POSTボディに export_type=all_export が含まれること（JS が #export_type に注入）。
      expect(request.postData() ?? "").toContain("export_type=all_export");
      expect(download).toBeTruthy();
    });

    test("E2E-M06-06-022 セッション保存条件で指定ページ（page/1）を再表示できる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndSearch(page);
      await target.gotoHistoryPage(1);
      await target.seeResultList(); // 保存条件で一覧ブロックが再表示される
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-06-010 検索セッション無で全件取得→「条件に一致する商品がありません」フラッシュ（要: 検索未保存状態の生成・フラッシュ表示要素の実機確認）",
      async () => {
        // 期待は仕様(判定順序#2 / エラー処理 / Controller.php:179 addError)由来。
        // 検索を一度も成功させていない状態（検索セッションキー無）で all_export を送信し、
        // リダイレクト先で ERR_NO_CONDITION フラッシュを確認する。前提生成手順を実機確認後に実装。
        void ERR_NO_CONDITION;
      }
    );

    test.fixme(
      "E2E-M06-06-011 検索セッション無で全件取得→履歴ページ一覧へリダイレクト（要: 検索未保存状態の生成）",
      async () => {
        // 期待は仕様(画面遷移 失敗時 / Controller.php:181-183 redirect admin_otcbuyorder_history_page)由来。
        // 遷移先が HISTORY_PAGE_RE に一致し、ダウンロードは発火しないこと。
        void HISTORY_PAGE_RE;
      }
    );

    test.fixme(
      "E2E-M06-06-012 検索結果0件でもセッション条件があればCSVがダウンロードされる（要: 該当0件シード SEED-M06-06-NOHIT）",
      async () => {
        // 期待は仕様(エッジケース: データ行0でもヘッダのみのファイルになりうる)由来。
        // 0件ヒットでは CSVメニュー(#result_list__custom_csv_menu)が描画されない（totalItemCount>0条件）ため、
        // 出力発火経路（form直接submit等）と前提を実機確認後に実装。CSV中身(ヘッダのみ)は手動確認。
      }
    );

    test.fixme(
      "E2E-M06-06-021 未ログインで全件CSV exportエンドポイントへ→管理ログイン誘導（要: 未認証POST応答を実機確認）",
      async ({ page }) => {
        // 期待は仕様(権限・認可: 未ログインは管理ログインへ)由来。export は POST 専用ルートのため、
        // GET前提にせず未認証 POST(target.postExportPath)で観測する。誘導先 Location が LOGIN_RE に一致、
        // または CSV(application/octet-stream)が返らないことを期待。実応答(リダイレクト/403/302)を実機確認後に実装。
        const target = new StorePurchasePurchaseStoreHistoryCsvExportAllPage(page);
        void target.postExportPath; // 未認証POSTで誘導/非CSVを観測する経路（実機確認後に有効化）
        void LOGIN_RE;
        void EXPORT_PATH;
      }
    );

    test.fixme(
      "E2E-M06-06-030 不正な export_type ではCSVを返さない（要: crafted POST・例外ステータスを実機確認）",
      async () => {
        // 期待は仕様(判定順序#1: all_export/check_export 以外は対象外＝例外を投げうる)由来。
        // 当フォームはCSRF無効のため page.request.post で export_type=foo を送れるが、
        // 返却ステータス(500/例外画面)は環境依存で要実機確認。CSVダウンロードが発火しないことを期待。
      }
    );
  }
);
