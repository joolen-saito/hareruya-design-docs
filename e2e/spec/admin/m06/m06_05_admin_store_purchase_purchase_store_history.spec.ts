/**
 * 管理画面 店頭買取管理 > 買取商品履歴（検索／一覧／CSV）（M06-05）E2E。納品ケース表
 * integration_test/e2e/m06_05_admin_store_purchase_purchase_store_history_e2e_cases.md に対応。
 * 本specには「E2E自動化」（資格情報のみで安定実行できるもの）を実装し、要シード/要実機確認は
 * test.fixme（理由付き）で残す。手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.md / 観点表)由来（オラクル独立性）。
 *   表示文言「店頭買取管理」「買取商品履歴」「検索条件に該当するデータがありませんでした。」等は設計書(フロント挙動/エラー処理節)由来でオラクル化する。
 *   Form制約・i18nキー等の実装事情はオラクルにせず、観測挙動（結果領域の有無・遷移先URL・仕様メッセージ）で判定する。
 * pf-eccube3 由来設計だが刷新先 ec-cube-enterprise に同一画面(route admin_otcbuyorder_history)が実在するためE2E化した。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が無く、既存の login.spec.ts・m05配下も
 *   @playwright/test + AdminLoginPage を直利用する。本specも踏襲。資格情報が無ければ test.skip でガードする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StorePurchasePurchaseStoreHistoryPage } from "../../../pages/admin/m06/m06_05_admin_store_purchase_purchase_store_history.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const HISTORY_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history(\\?|$)`);

// 完全一致検索で確実に0件になる査定ID（仕様: 査定IDは完全一致。判定順序#3）。
const NO_MATCH_ASSESSMENT_ID = "E2E-NO-MATCH-ZZZ999999";

/** 管理ログインして買取商品履歴を開く。 */
async function loginAndOpen(
  page: Page
): Promise<StorePurchasePurchaseStoreHistoryPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const history = new StorePurchasePurchaseStoreHistoryPage(page);
  await history.goto();
  return history;
}

test.describe(
  "管理画面 > 店頭買取管理 > 買取商品履歴",
  { tag: ["@admin", "@purchase_store"] },
  () => {
    // ===== 認証不要（権限・認可／URL直接アクセス） =====

    test("E2E-M06-05-060 未ログインで買取商品履歴URL直接→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 仕様 権限・認可: 未ログインは管理画面認証機構により到達前に拒否＝管理ログイン誘導が正。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // 注: CSV出力ルート(admin_otcbuyorder_history_export)は methods:['POST'] のため、GET 直接アクセスは
    //   ルーティング段(RouterListener)で 405 となりファイアウォールへ到達しない＝「管理ログイン誘導」を観測できない。
    //   認可ガードの観測には未認証 POST が必要だが、未認証 POST 時の正式挙動(ログインリダイレクト/405/CSRF)は
    //   要実機確認のため fixme として残す（GET を login 期待にする旧実装は誤りなので除去した）。
    test.fixme(
      "E2E-M06-05-061 未ログインでCSV出力(POST専用)への認可ガード（要実機確認: 未認証POST時の正式挙動）",
      async () => {
        // 仕様 権限・認可: export ルートも管理ファイアウォール内。期待は仕様由来（未認証は管理ログインへ）。
        // 実装(OtcBuyOrderHistoryController.php:130 methods:['POST'])上、検証は page.request.post 等の未認証POSTで行う。
      }
    );

    // ===== 初期表示・UI部品（ログインのみ・データ不要） =====

    test("E2E-M06-05-001 初回GETで検索フォームのみ表示し結果一覧は出さない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 処理フロー(初回表示): 検索フォーム表示・一覧は出さない。
      await expect(history.searchForm).toBeVisible();
      await expect(history.resultArea).toHaveCount(0);
    });

    test("E2E-M06-05-002 タイトル「店頭買取管理」・サブタイトル「買取商品履歴」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpen(page);
      // 仕様 フロント挙動(表示要素): タイトル/サブタイトルの文言。
      await expect(page.locator("body")).toContainText("店頭買取管理");
      await expect(page.locator("body")).toContainText("買取商品履歴");
    });

    test("E2E-M06-05-003 検索フォームの主要入力欄と検索ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 フロント挙動(表示要素): 査定ID/申込者名/会員ID/商品コード/商品名/検索ボタン。
      await history.seeSearchForm();
    });

    test("E2E-M06-05-004 ステータス絞り込みの選択肢が6種表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 業務ルール: 買取成立・キャンセル・入庫待ち・未登録在庫あり・入庫済み・管理者取消の6種のみ。
      await expect(history.statusChecks).toHaveCount(6);
    });

    test("E2E-M06-05-005 言語3種・状態4種の絞り込みチェックが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 入力項目: 言語(日本語/英語/その他言語=3種)、状態(NM/SP/MP/HP=4種)。
      await expect(history.languageChecks).toHaveCount(3);
      await expect(history.conditionChecks).toHaveCount(4);
    });

    test("E2E-M06-05-006 買取店舗セレクト・査定担当者名・日時/価格レンジ入力が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 入力項目: 買取店舗・査定担当者名・買取日時(開始/終了)・基準価格(開始/終了)・買取価格(開始/終了)の入力欄。
      await history.seeAdditionalSearchFields();
    });

    // ===== 検索実行（ハッピーパス／0件） =====

    test("E2E-M06-05-010/011 条件なしで検索すると同一URLに留まり結果領域が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 010 仕様 画面遷移: 検索POST成功は同一URLで結果付きHTML（URLは変わらない）。
      await history.clickSearch();
      await expect(page).toHaveURL(HISTORY_RE);
      // 011 仕様 実行結果: 検索結果領域（件数見出しまたは0件メッセージ）が表示される。
      await expect(history.resultArea).toBeVisible();
    });

    test("E2E-M06-05-012 一致しない査定IDで検索すると0件メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 フロント挙動(0件時): 「検索条件に該当するデータがありませんでした。」を表示（査定IDは完全一致）。
      await history.searchByAssessmentId(NO_MATCH_ASSESSMENT_ID);
      await expect(page).toHaveURL(HISTORY_RE);
      await history.seeNoResultMessage();
    });

    test("E2E-M06-05-024 買取日時欄に正常書式を入力して検索→書式エラーなく結果領域が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 バリデーション: 日時は単一テキストをパース（YYYY-MM-DD HH:mm）。正常書式は書式エラーにならず検索継続。
      await history.completeDateFrom.fill("2020-01-01 00:00");
      await history.clickSearch();
      await expect(page).toHaveURL(HISTORY_RE);
      await expect(history.resultArea).toBeVisible();
    });

    test("E2E-M06-05-025 整数欄に正常な整数を入力して検索→入力エラーなく結果領域が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const history = await loginAndOpen(page);
      // 仕様 バリデーション/入力項目: 基準価格・買取価格は整数型。正常な整数は入力エラーにならず検索継続。
      await history.standardPriceFrom.fill("0");
      await history.buyPriceFrom.fill("0");
      await history.clickSearch();
      await expect(page).toHaveURL(HISTORY_RE);
      await expect(history.resultArea).toBeVisible();
    });

    // ===== 保留（要シード／要実機確認。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M06-05-013 該当ありデータで検索→件数見出し「検索結果」と結果テーブルが表示される（要シード: 履歴データ）",
      async () => {
        // 期待は仕様(処理フロー検索実行・件数表示)由来。SEED-M06-05-HISTORY 投入後に実装。
      }
    );

    test.fixme(
      "E2E-M06-05-020 CSV「選択した商品履歴取得」未選択→「1つ以上の商品を選択してください」フラッシュ＋一覧へ（要シード: 結果あり状態とCSVドロップダウン操作の実機確認）",
      async () => {
        // 期待は仕様(エラー処理・OtcBuyOrderHistoryController.php:158)由来。結果ありシード後、未チェックでcheck_export実行して確認。
      // 関連: E2E-031 の選択CSVは download 読込で「選択IDのみ／未選択IDを含まない」を自動検証可能（要シード後）。
      }
    );

    test.fixme(
      "E2E-M06-05-022 CSV全件・検索セッションなし→「条件に一致する商品がありません」フラッシュ＋一覧へ（要: 検索未実行状態でall_exportをPOST）",
      async () => {
        // 期待は仕様(エラー処理・Controller.php:179)由来。検索セッション未保存の状態でexportへPOSTする手順を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M06-05-030 CSV「検索結果全件取得」→ダウンロード発火・ファイル名 otc_buy_order_history_YmdHis.csv（要シード＋ダウンロード確認）",
      async () => {
        // 期待は仕様(処理フローCSV出力・ログ節 ファイル名プレフィックス)由来。export-linkのJS submit挙動を実機確認後に実装。
        // CSV内容（ヘッダ存在・検索条件に一致する行のみ含む）は page.waitForEvent('download') → download.path()/読込で
        //   自動検証可能（要シード後）。i18nキーや列定義の実装値固定はオラクル化しない＝設計書のCSV列仕様で判定する。
      }
    );

    test.fixme(
      "E2E-M06-05-026 CSV全件・検索セッションなし→一覧ページ(admin_otcbuyorder_history_page)へリダイレクト（022の遷移対。要: 検索未実行でall_export POST／実機確認）",
      async () => {
        // 期待は仕様(画面遷移・Controller.php:179-182 保存済みページへリダイレクト)由来。022のフラッシュ文言と対をなす遷移先を確認。
      }
    );

    test.fixme(
      "E2E-M06-05-032 CSVドロップダウンの全選択チェック(#allCheck)で全行チェックが一括ONになる（要シード: 複数行結果／JS全選択の実機確認）",
      async () => {
        // 期待は仕様(フロント挙動 JS全選択)由来。結果あり(複数行)シード後、#allCheck ONで otcBuyOrderHistoryIds[] が全件checkedを確認。
      }
    );

    test.fixme(
      "E2E-M06-05-040 ページング GET /history/page/2 でセッション検索条件を復元し指定ページを表示（要シード: 2ページ以上の履歴）",
      async () => {
        // 期待は仕様(ページング表示・遷移時に引き継ぐ状態)由来。複数ページ分のシード後に実装。
      }
    );

    test.fixme(
      "E2E-M06-05-050 order不正→ソートエラーメッセージ・初回表示相当（要実機確認: フラッシュ表示要素／メッセージ文言 admin.error.sort）",
      async () => {
        // 期待は仕様(エラー処理・SearchControllerTrait.php:141-142)由来。フラッシュ表示セレクタを実機確認後に実装（創作しない）。
      }
    );
  }
);
