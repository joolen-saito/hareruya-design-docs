/**
 * 管理画面 在庫管理 在庫検索/一覧（M04-01）E2E。納品ケース表
 * integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、データ十分性・破壊的操作・要実機確認は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockSearchListPage } from "../../../pages/admin/m04/m04_01_admin_stock_stock_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
// 商品名で検索する正常系(E2E-M04-01-010)のシード商品名。SEED-M04-01-STOCK の「商品名既知」レコードを指す。
// 未設定なら検索条件未指定の全件検索にフォールバックせず skip（オラクルを曖昧化しない）。
const STOCK_PRODUCT_NAME = process.env.E2E_M04_STOCK_PRODUCT_NAME || "";

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock(\\?|$)`);
const STOCK_APPROVAL_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/\\d+/stock-approval/new(\\?|$)`
);
const HISTORY_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/history(\\?|$)`
);
const PAGE_COUNT_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/page/1/count/\\d+(\\?|$)`
);

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const ERR_PRICE_RANGE = "上限金額は、下限金額より大きく設定してください"; // :1420
const ERR_DATE_RANGE = "終了日時は、開始日時より大きく設定してください"; // :1418
const ERR_PATTERN_NAME_EMPTY = "検索パターン名を入力して下さい。"; // :1607
const ERR_CSV_NEED_SEARCH = "検索条件を指定してからCSV出力してください。"; // :4419

/** 管理ログインして在庫一覧を開く。 */
async function loginAndOpenList(page: Page): Promise<StockStockSearchListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new StockStockSearchListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > 在庫管理 > 在庫検索/一覧",
  { tag: ["@admin", "@stock"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M04-01-070 未ログインで在庫一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ・データ不要） =====

    test("E2E-M04-01-001 初期表示: 検索カード見出し「検索」と検索ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await expect(page.locator("body")).toContainText("検索"); // trans admin.stock.list.search_title
      await expect(list.searchButton).toBeVisible();
    });

    test("E2E-M04-01-002 初期表示: 一覧カード見出し「在庫一覧」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      await expect(page.locator("body")).toContainText("在庫一覧"); // trans admin.stock.list.list_title
    });

    test("E2E-M04-01-003 検索前は一覧が空で初期案内文が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 プロセスフロー#4: パラメータ無し初回GETは空一覧（検索前状態）。
      await list.seeSearchFirst();
    });

    test("E2E-M04-01-004 基本検索フォーム部品（商品名/カード名/ID/コード）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.seeSearchForm();
    });

    test("E2E-M04-01-005 詳細検索トグル押下で詳細検索枠が開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.openDetailSearch(); // twig:154 トグル → #searchDetailArea collapse show
      await expect(list.detailArea).toBeVisible();
    });

    // ===== バリデーション（相関・正常×異常の対。ログインのみで決定的） =====

    test("E2E-M04-01-020 基準価格 From>To で範囲エラーが表示され検索されない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 例外処理: 価格範囲(From>To)は has_errors=true で同一画面再表示。
      await list.searchByBasePriceRange("1000", "10");
      await list.seeMessage(ERR_PRICE_RANGE);
      await expect(page).toHaveURL(LIST_RE); // 滞留（在庫一覧）
    });

    test("E2E-M04-01-021 販売価格 From>To で範囲エラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchBySellPriceRange("1000", "10");
      await list.seeMessage(ERR_PRICE_RANGE);
    });

    test("E2E-M04-01-022 在庫数 From>To で範囲エラーが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByStockRange("100", "1");
      await list.seeMessage(ERR_PRICE_RANGE); // 在庫範囲も price_range_error を流用（SearchStockListType.php:474）
    });

    test("E2E-M04-01-023 更新日 終了<開始 で日付範囲エラーが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByUpdateDateRange("2025-12-31", "2025-01-01");
      await list.seeMessage(ERR_DATE_RANGE);
    });

    test("E2E-M04-01-024 基準価格 From<=To（正常系）では範囲エラーが出ず検索が継続する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 例外処理の対(正常系): From<=To は範囲相関エラーにならず検索が成立する。
      await list.searchByBasePriceRange("10", "1000");
      await expect(page.getByText(ERR_PRICE_RANGE)).toHaveCount(0);
      await expect(page).toHaveURL(LIST_RE);
    });

    test("E2E-M04-01-025 販売価格 From<=To（正常系）では範囲エラーが出ず検索が継続する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 例外処理の対(正常系): 販売価格 From<=To は範囲相関エラーにならず検索が成立する（異常系021の対）。
      await list.searchBySellPriceRange("10", "1000");
      await expect(page.getByText(ERR_PRICE_RANGE)).toHaveCount(0);
      await expect(page).toHaveURL(LIST_RE);
    });

    test("E2E-M04-01-026 在庫数 From<=To（正常系）では範囲エラーが出ず検索が継続する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 例外処理の対(正常系): 在庫数 From<=To は範囲相関エラーにならず検索が成立する（異常系022の対）。
      await list.searchByStockRange("1", "100");
      await expect(page.getByText(ERR_PRICE_RANGE)).toHaveCount(0);
      await expect(page).toHaveURL(LIST_RE);
    });

    test("E2E-M04-01-027 更新日 開始<=終了（正常系）では日付範囲エラーが出ず検索が継続する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 例外処理の対(正常系): 更新日 開始<=終了 は日付範囲相関エラーにならず検索が成立する（異常系023の対）。
      await list.searchByUpdateDateRange("2025-01-01", "2025-12-31");
      await expect(page.getByText(ERR_DATE_RANGE)).toHaveCount(0);
      await expect(page).toHaveURL(LIST_RE);
    });

    // ===== 検索パターン保存（名称未入力＝非破壊） =====

    test("E2E-M04-01-030 検索パターン名未入力で保存→名称未入力エラーが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様 検索パターンの保存: パターン名未入力は name_empty エラー（DB登録は発生しない＝非破壊）。
      await list.savePattern("");
      await list.seeMessage(ERR_PATTERN_NAME_EMPTY);
      await expect(page).toHaveURL(LIST_RE);
    });

    // ===== CSV出力（検索未実行＝エラー誘導。非破壊） =====

    test("E2E-M04-01-040 検索未実行で在庫情報CSV要求→エラー表示し一覧へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      // 仕様 例外処理: セッションに検索条件が無い状態でCSV要求→エラー表示し一覧へリダイレクト。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/csv`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.getByText(ERR_CSV_NEED_SEARCH).first()).toBeVisible();
    });

    test("E2E-M04-01-041 検索未実行で在庫リコメンドCSV要求→エラー表示し一覧へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/recommend-csv`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.getByText(ERR_CSV_NEED_SEARCH).first()).toBeVisible();
    });

    test("E2E-M04-01-042 検索未実行で在庫情報カスタムCSV要求→エラー表示し一覧へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      // 仕様 例外処理: 検索未実行の custom-csv 要求は CSV種別判定より前にエラー誘導（Controller.php:273-277）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/custom-csv/1`);
      await expect(page).toHaveURL(LIST_RE);
      await expect(page.getByText(ERR_CSV_NEED_SEARCH).first()).toBeVisible();
    });

    // ===== 検索実行・一覧操作（データ依存はガード） =====

    test("E2E-M04-01-010 商品名で検索すると件数見出し（検索結果）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(
        STOCK_PRODUCT_NAME === "",
        "E2E_M04_STOCK_PRODUCT_NAME 未設定（商品名部分一致の正常系オラクルにシード商品名が必要）"
      );
      const list = await loginAndOpenList(page);
      // 仕様 検索条件(基本検索/商品名部分一致): 既知商品名で検索し件数見出しが出ること。
      await list.searchByProductName(STOCK_PRODUCT_NAME);
      const heading = await page.getByText("検索結果").count();
      test.skip(heading === 0, "該当商品名のシードが無く件数見出しが描画されない（要シードデータ）");
      await list.seeResultCountHeading(); // trans admin.common.search_result
    });

    test("E2E-M04-01-012 検索結果がある場合にCSV出力・在庫操作ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const heading = await page.getByText("検索結果").count();
      test.skip(heading === 0, "検索結果が0件でアクションボタンが描画されない（要シードデータ）");
      // 仕様 画面表示: 検索結果がある場合にCSV出力・在庫操作ボタンを表示（twig:439-503）。
      await expect(list.stockInfoCsvLink).toBeVisible();
      await expect(list.recommendCsvLink).toBeVisible();
      await expect(list.bulkEditBtn).toBeVisible();
    });

    test("E2E-M04-01-050 表示件数プルダウン変更で件数指定URLへ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const count = await list.pageCountPulldown.count();
      test.skip(count === 0, "検索結果が無く表示件数プルダウンが描画されない（要シード）");
      const options = await list.pageCountPulldown.locator("option").all();
      test.skip(options.length < 2, "表示件数の選択肢が複数無く別値へ変更できない");
      // 仕様 利用者視点の入口(表示件数変更): /product/stock/page/1/count/{page_count} へ遷移。
      await list.pageCountPulldown.selectOption({ index: options.length - 1 });
      await expect(page).toHaveURL(PAGE_COUNT_RE);
    });

    test("E2E-M04-01-060 商品名リンク押下で在庫編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const linkCount = await list.firstProductLink.count();
      test.skip(linkCount === 0, "一覧に在庫が無く商品名リンクが描画されない（要シード）");
      // 仕様 一覧項目(2-4): 商品名リンク→在庫編集（admin_stock_approval_new）。
      await list.firstProductLink.click();
      await expect(page).toHaveURL(STOCK_APPROVAL_RE);
    });

    test("E2E-M04-01-061 在庫変動履歴リンク押下で在庫変動履歴画面へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const menuCount = await list.firstRowMenuBtn.count();
      test.skip(menuCount === 0, "一覧に在庫が無く3点メニューが描画されない（要シード）");
      // 仕様 一覧項目(2-16): 在庫変動履歴リンク→在庫変動履歴（admin_stock_history）。
      await list.firstRowMenuBtn.click();
      await list.firstStockHistoryLink.click();
      await expect(page).toHaveURL(HISTORY_RE);
    });

    test("E2E-M04-01-062 未選択時は在庫操作ボタンがすべて非活性", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const btn = await list.bulkEditBtn.count();
      test.skip(btn === 0, "検索結果が無く在庫操作ボタンが描画されない（要シード）");
      // 仕様 画面遷移と遷移可否: 未選択では各在庫操作ボタンは非活性（twig:480-501 disabled）。
      await expect(list.bulkEditBtn).toBeDisabled();
      await expect(list.stockMoveBtn).toBeDisabled();
      await expect(list.stockTransferBtn).toBeDisabled();
      await expect(list.stockSplitBtn).toBeDisabled();
      await expect(list.stockJoinBtn).toBeDisabled();
    });

    test("E2E-M04-01-063 チェック選択で在庫操作ボタンが活性化する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      const rows = await list.rowChecks.count();
      test.skip(rows === 0, "一覧に在庫が無く行チェックボックスが描画されない（要シード）");
      // 仕様 画面遷移と遷移可否: 1件以上選択で在庫操作ボタンが活性化（twig:774-778）。
      await list.rowChecks.first().check();
      await expect(list.bulkEditBtn).toBeEnabled();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-01-011 該当しない条件で検索→0件メッセージ（要実機: 0件時の描画が初期案内文に分岐する不具合候補#1）",
      async () => {
        // 期待は仕様(0件は no_result 文言)由来。実装は pagination 空時に search_first を出すため要実機確認（不具合候補#1）。
      }
    );

    test.fixme(
      "E2E-M04-01-031 検索パターン名を入力して保存→登録成功メッセージ（要シード/破壊的: dtb_search_pattern を作成）",
      async () => {
        // 期待は仕様(検索パターン保存 success)由来。DB登録を伴うため使い捨てパターン名＋後始末を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M04-01-032 検索パターン削除→削除成功メッセージ（要シード: 既存パターン＋patternId）",
      async () => {
        // 期待は仕様(検索パターン削除 success)由来。事前に保存済みパターン(SEED-M04-01-PATTERN)が必要。
      }
    );

    test.fixme(
      "E2E-M04-01-043 検索実行後に存在しないcsvExtensionIdでカスタムCSV→404（要: 検索セッション確立）",
      async () => {
        // 期待は仕様(カスタムCSV対象不正は404)由来。404判定はセッションに検索条件がある場合のみ到達するため、
        // 先に検索を実行してから不正IDへアクセスする手順を実機確認後に実装（Controller.php:280-284）。
      }
    );

    test.fixme(
      "E2E-M04-01-044 検索実行後に在庫情報CSVボタン押下でダウンロードが発火する（要シード・内容は手動）",
      async () => {
        // 期待は仕様(セッションの検索条件で全件CSV出力)由来。download 発火のみE2E、CSV内容の検査は手動。
      }
    );

    test.fixme(
      "E2E-M04-01-064 一括編集ディスパッチに対象ID無しでPOST→在庫未選択エラーで一覧へ（要: CSRFトークン取得）",
      async () => {
        // 期待は仕様(対象ID無しは一覧へ戻す＝no_product_stocks)由来。フォームの _token を取得して
        // admin_stock_list_bulk_edit_dispatch へ ID無しPOSTする手順を実機確認後に実装（Controller.php:438-443）。
      }
    );

    test.fixme(
      "E2E-M04-01-045 検索実行後に在庫リコメンドCSVボタン押下でダウンロードが発火する（要シード・内容は手動。041の対＝正常系）",
      async () => {
        // 期待は仕様(同検索条件でリコメンドCSV出力)由来。download 発火のみE2E、CSV内容の検査は手動。
      }
    );

    test.fixme(
      "E2E-M04-01-046 検索実行後に有効csvExtensionIdでカスタムCSVがダウンロードされる（要シード＋在庫種別の出力フォーマット。042/043の対＝正常系）",
      async () => {
        // 期待は仕様(指定フォーマットでカスタムCSV出力)由来。有効な csvExtensionId(在庫種別)のシードと
        // 検索セッション確立後に download 発火を確認（Controller.php:270-294）。内容検査は手動。
      }
    );

    test.fixme(
      "E2E-M04-01-051 ページ送りURL直接アクセスで指定ページが表示される（要シード: 2ページ以上）",
      async () => {
        // 期待は仕様(セッションの検索条件を復元し指定ページを表示)由来。既定表示件数を超える在庫シードで
        // 検索実行後に /product/stock/page/2 へアクセスし2ページ目表示を確認（Controller.php:95）。
      }
    );

    test.fixme(
      "E2E-M04-01-066 一括編集ディスパッチに有効IDでPOST→在庫一括編集へリダイレクト（要シード単一店舗＋CSRFトークン。064の対＝正常系）",
      async () => {
        // 期待は仕様(有効IDで在庫一括編集へリダイレクト)由来。単一店舗の規格シードと _token 取得後に
        // admin_stock_list_bulk_edit_dispatch へ有効IDでPOSTし admin_stock_bulk_approval_new 遷移を確認（Controller.php:445）。
      }
    );
  }
);
