/**
 * 管理画面 ネット買取管理 買取商品一覧CSV出力 E2E。
 * 納品ケース表 integration_test/e2e/m07_06_admin_online_purchase_purchase_online_product_list_csv_export_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、サーバ側フラッシュ/JS alert系（030-038）は test.fixme、
 * 手動（CSV内容厳密検査）・対象外（ログ/DB/POST内容）はケース表で全量管理する（spec とケース表は完全1:1ではない）。
 * 期待結果は仕様（functions/pf-eccube3/m07-06_...md / messages.ja.yaml）由来（オラクル独立性）。
 * pf-eccube3 はリバース設計のため設計書・観点表を上位オラクルとし、刷新先 ec-cube-enterprise との乖離は
 * ケース表 付帯表4（不具合候補）に出す（例: 不正type文言の末尾「。」有無）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行方針（env-gated）:
 *  - 管理者資格情報（ECCUBE_ADMIN_USER/PASS）が無いと走らないように test.skip でガード。
 *  - 一覧/詳細のダウンロードは買取注文シード（SEED-M07-06-BUYORDER）に依存する。詳細IDは M07_BUY_ORDER_ID で与える。
 *  - 040（未ログイン誘導）は資格情報・シード不要で常時実行可。
 *  - CSVの中身（列・値・文字コード・区切り）の一致確認は手動（ケース表）で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage } from "../../../pages/admin/m07/m07_06_admin_online_purchase_purchase_online_product_list_csv_export.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 買取詳細画面を開くための既存買取注文ID（SEED-M07-06-BUYORDER）。未設定なら詳細系をskip。
const BUY_ORDER_ID = process.env.M07_BUY_ORDER_ID || "";
const HAS_DETAIL = HAS_CREDS && !!BUY_ORDER_ID;

// 仕様（messages.ja.yaml）由来のラベル/文言。実装に合わせて変えない（オラクル独立性）。
const SALE_CSV_LABEL = "買取商品一覧CSV"; // :5252
const CANCEL_CSV_LABEL = "買取商品（キャンセル）CSV"; // :5258
const SALE_PREFIX = "purchase_product_list_"; // 処理フロー#12（売却側接頭辞）
const CANCEL_PREFIX = "purchase_product_cancel_list_"; // 処理フロー#12（非売却側接頭辞）

const LOGIN_RE = /\/login(\?|$)/;
const PURCHASE_PAGE_RE = /\/purchase\/page\/\d+/; // admin_purchase_page（一覧へのリダイレクト先）
// 売却CSVファイル名形式（処理フロー#12: 接頭辞 + printf('%07d') + _YmdHis + .csv）。番号・日時は実行時依存のため形式で判定。
const SALE_FILENAME_RE = /^purchase_product_list_\d{7}_\d{14}\.csv$/;

async function loginAsAdmin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > ネット買取管理 > 買取商品一覧CSV出力",
  { tag: ["@admin", "@purchase", "@csv"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M07-06-040 未ログインで買取一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/list`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M07-06-041 未ログインでCSV出力ルート→管理ログイン画面へ誘導（出力ルート自体の認可ガード）", async ({
      page,
    }) => {
      // 設計書 処理フロー#1「管理画面の認証・共通制約を通過」。一覧URLだけでなく出力ルート自体の
      // 未認証ガードを確認する（POST専用ルートだが認証ファイアウォールはルーティング前に作用するため
      // 未認証アクセスはログインへ誘導される＝期待は設計由来）。CSVはダウンロードされない。
      await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_product_list?type=sale`
      );
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 一覧 UI（SEED-M07-06-BUYORDER） =====

    test("E2E-M07-06-001/002 一覧のダウンロードメニューに売却/キャンセルCSV項目が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理者資格情報 未設定（ECCUBE_ADMIN_USER/PASS）");
      await loginAsAdmin(page);
      const p = new AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage(page);
      await p.gotoList();
      await p.seeListCsvMenuItems(); // 「買取商品一覧CSV」「買取商品（キャンセル）CSV」
    });

    test("E2E-M07-06-020 一覧の#allCheckで行チェックが一括オンになる", async ({ page }) => {
      test.skip(!HAS_CREDS, "管理者資格情報 未設定（ECCUBE_ADMIN_USER/PASS）");
      await loginAsAdmin(page);
      const p = new AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage(page);
      await p.gotoList();
      const total = await p.rowCheckboxes.count();
      test.skip(total === 0, "買取一覧に行が無い（SEED-M07-06-BUYORDER 未投入）");
      await p.checkAll();
      expect(await p.checkedCount()).toBe(total); // 全行オン
    });

    // ===== 一覧 ダウンロード発火＋ファイル名接頭辞（SEED-M07-06-BUYORDER） =====

    test("E2E-M07-06-010/011 一覧 売却CSV: ダウンロード発火＋ファイル名接頭辞 purchase_product_list_", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理者資格情報 未設定（ECCUBE_ADMIN_USER/PASS）");
      await loginAsAdmin(page);
      const p = new AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage(page);
      await p.gotoList();
      test.skip((await p.rowCheckboxes.count()) === 0, "買取一覧に行が無い（SEED未投入）");
      await p.checkFirstRow();
      const download = await p.exportSaleFromList(); // ダウンロード発火
      const name = download.suggestedFilename();
      expect(name.startsWith(SALE_PREFIX)).toBeTruthy(); // 接頭辞 purchase_product_list_
      expect(name.endsWith(".csv")).toBeTruthy();
      // 注: CSVの中身（列・値・文字コード・区切り）の一致確認は手動（ケース表 IT-16）。
    });

    test("E2E-M07-06-017 一覧 売却CSV: ファイル名が 接頭辞+7桁ID+_YmdHis+.csv 形式である", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理者資格情報 未設定（ECCUBE_ADMIN_USER/PASS）");
      await loginAsAdmin(page);
      const p = new AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage(page);
      await p.gotoList();
      test.skip((await p.rowCheckboxes.count()) === 0, "買取一覧に行が無い（SEED未投入）");
      await p.checkFirstRow();
      const download = await p.exportSaleFromList();
      // 仕様（処理フロー#12）: 接頭辞 + printf('%07d', min(buyOrderIds)) + '_' + YmdHis + '.csv'。
      // 番号・日時は実行時/データ依存のため形式（正規表現）で判定する（オラクル独立性）。
      expect(download.suggestedFilename()).toMatch(SALE_FILENAME_RE);
    });

    test("E2E-M07-06-012/013 一覧 キャンセルCSV: ダウンロード発火＋ファイル名接頭辞 purchase_product_cancel_list_", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "管理者資格情報 未設定（ECCUBE_ADMIN_USER/PASS）");
      await loginAsAdmin(page);
      const p = new AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage(page);
      await p.gotoList();
      test.skip((await p.rowCheckboxes.count()) === 0, "買取一覧に行が無い（SEED未投入）");
      await p.checkFirstRow();
      const download = await p.exportCancelFromList(); // ダウンロード発火
      const name = download.suggestedFilename();
      expect(name.startsWith(CANCEL_PREFIX)).toBeTruthy(); // 接頭辞 purchase_product_cancel_list_
      expect(name.endsWith(".csv")).toBeTruthy();
    });

    // ===== 買取詳細（要 M07_BUY_ORDER_ID） =====

    test("E2E-M07-06-003 買取詳細に「買取商品一覧CSV出力」ボタンと隠しbuyOrderIdsが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_DETAIL, "買取詳細ID 未設定（M07_BUY_ORDER_ID）または資格情報未設定");
      await loginAsAdmin(page);
      const p = new AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage(page);
      await p.gotoDetail(BUY_ORDER_ID);
      // 仕様: 隠し buyOrderIds[] は「当該買取IDを値に持つ」。値一致も検証する。
      await p.seeDetailCsvButton(BUY_ORDER_ID);
    });

    test("E2E-M07-06-014 買取詳細から売却CSVを押すとダウンロードが発火する", async ({ page }) => {
      test.skip(!HAS_DETAIL, "買取詳細ID 未設定（M07_BUY_ORDER_ID）または資格情報未設定");
      await loginAsAdmin(page);
      const p = new AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage(page);
      await p.gotoDetail(BUY_ORDER_ID);
      const download = await p.exportFromDetail();
      expect(download.suggestedFilename().startsWith(SALE_PREFIX)).toBeTruthy();
      expect(download.suggestedFilename().endsWith(".csv")).toBeTruthy();
    });

    // ===== 保留（自動化予定・未実装。手動/対象外はケース表で全量管理） =====
    // 030-034 はクライアントJSを介さないPOST構築（同一セッションでのフォーム送信）と、
    // フラッシュ表示領域のDOMセレクタ確定（要実機確認・付帯表4#3）が必要なため fixme。

    test.fixme(
      "E2E-M07-06-030/031 buyOrderIds未選択でサーバ到達→未選択フラッシュ＋一覧リダイレクト（要: JS非経由POST＋flashセレクタ実機確認）",
      async () => {
        // 期待は仕様（処理フロー#4 翻訳キー admin.purchase.online.csv_export.no_selection
        //  ＋ admin_purchase_page へリダイレクト）由来を一次オラクルとする。
        //  具体文言「1つ以上の買取注文情報を選択してください。」は messages.ja.yaml 実装由来＝参考のみ
        //  （オラクル混入回避。文言固定ではなくキー対応で判定。付帯表4#7）。フラッシュ領域セレクタ確定後に実装。
        // expect(redirected to /purchase/page/{page_no}) ＝ PURCHASE_PAGE_RE
      }
    );

    test.fixme(
      "E2E-M07-06-032/033 不正type→「不正なCSV種別です。」フラッシュ＋一覧リダイレクト（要: JS非経由POST。実装は末尾「。」なし＝付帯表4#1で落ちて検出見込み）",
      async () => {
        // 期待は仕様（処理フロー#5 固定文言「不正なCSV種別です。」＋ admin_purchase_page）由来。
        // 実装(PurchaseController.php:620)は「不正なCSV種別です」で句点なし＝仕様乖離をテストで検出する。
      }
    );

    test.fixme(
      "E2E-M07-06-034 存在しないIDのみ→「存在しない買取注文情報IDが含まれています。」フラッシュ（要: シード＋JS非経由POST）",
      async () => {
        // 期待は仕様（処理フロー#8 翻訳キー admin.purchase.online.csv_export.not_registered_buy_order_id）
        //  由来を一次オラクルとする。RuntimeException→翻訳→フラッシュ。
        //  具体文言「存在しない買取注文情報IDが含まれています。」は messages.ja.yaml 実装由来＝参考のみ（付帯表4#7）。
      }
    );

    test.fixme(
      "E2E-M07-06-035 一覧で未選択のまま売却CSVボタン押下→JS alertで中断（要: purchase.js ロード確認＋dialogハンドラ実機確認）",
      async () => {
        // 期待は仕様（フロント挙動: .searched_buy_order_id:checked が0件で alert 中断）由来。
        // 当該JS（html/template/admin/assets/js/Purchase/purchase.js）の刷新先ロード状況は要実機確認（付帯表4#5）。
      }
    );

    test.fixme(
      "E2E-M07-06-036 typeクエリ欠損→「不正なCSV種別です。」フラッシュ＋一覧リダイレクト（要: JS非経由POST。type省略でdefault枝＝032/033と対の欠損異常系）",
      async () => {
        // 期待は仕様（POSTパラメータ節「欠損やその他の値は固定文言」＋処理フロー#5 固定文言「不正なCSV種別です。」）由来。
        // 実装(PurchaseController.php:618-622)は type 未指定で default 枝へ落ち句点なし＝仕様乖離をテストで検出（付帯表4#1）。
      }
    );

    test.fixme(
      "E2E-M07-06-037 buyOrderIds[]=0 のみ→intval/array_filter後に空→no_selectionフラッシュ（要: JS非経由POST。030の境界版）",
      async () => {
        // 期待は仕様（処理フロー#3 array_filter(array_map('intval', …)) で0が除かれ空→#4 no_selection）由来。
        // 翻訳キー admin.purchase.online.csv_export.no_selection を一次オラクルとし具体文言は参考（付帯表4#7）。
      }
    );

    test.fixme(
      "E2E-M07-06-038 一覧で未選択のままキャンセルCSVボタン押下→JS alertで中断（035と対になるキャンセルボタン異常系）",
      async () => {
        // 期待は仕様（フロント挙動: #csv_export_product_cancel も .searched_buy_order_id:checked が0件で alert 中断）由来。
        // purchase.js の刷新先ロード状況は要実機確認（付帯表4#5）。
      }
    );
  }
);
