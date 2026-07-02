/**
 * 管理画面 在庫管理 在庫編集承認一覧 E2E（納品ケース表
 * integration_test/e2e/m04_32_admin_stock_stock_approval_list_e2e_cases.md に対応）。
 * 本specには「E2E自動化」ケースのうち実装可能なものを実装し、承認待ちレコード/承認権限/明細を要する
 * ケース（一括承認/却下・確認モーダル・明細モーダル・別タブリンク・ページ送り）は理由付き test.fixme で残す。
 * 手動/対象外（DB値の厳密照合・ログ抑止・本機能に非該当のバリデーション細目・実メール等）はケース表で全量管理しspecに残さない。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-32_admin_stock_stock_approval_list.md /
 * Excel基本設計 / messages.ja.yaml のメッセージキーが指す文言)由来（オラクル独立性）。実装の現挙動・Form制約を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec も
 * @playwright/test を直接使う。本specも既存規約（login.spec.ts / m04_19）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（env-gated）:
 *  - 資格情報 ECCUBE_ADMIN_USER/PASS が無いと走らないよう test.skip でガードする（HAS_CREDS）。
 *  - 承認待ちレコード・承認権限・明細を要するケースは SEED 未整備のため test.fixme（自動化予定・未実装）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M04-32-ADMIN     : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（承認一覧に到達できる管理者・2FA OFF）
 *  - SEED-M04-32-LIST      : 承認待ち/承認済/却下の在庫承認一覧 複数件（検索・件数・CSV・0件確認）
 *  - SEED-M04-32-ACTIONABLE: 未承認・在庫編集系・登録者≠ログイン管理者の行＋明細（一括承認/却下・モーダル）
 *  - SEED-M04-32-DENY      : 承認権限なし（権限なしメッセージ）
 *  - SEED-M04-32-EXTERNAL  : 在庫移動/振替/分割/結合の承認対象（別タブリンク）
 *  - SEED-M04-32-PAGING    : 既定表示件数超（ページ送り）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockApprovalListPage } from "../../../pages/admin/m04/m04_32_admin_stock_stock_approval_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 仕様(messages.ja.yaml のキーが指す文言)由来。実装に合わせて変えない（オラクル独立性）。
const DATE_END_ERROR = "終了日は、開始日より大きく設定してください"; // :1419 admin.common.date_end_error
const NO_SESSION =
  "明細を表示するための選択情報がありません。確認モーダルを開き直してからCSVダウンロードしてください。"; // :5085
const TITLE = "在庫編集承認一覧"; // :5025 admin.stock.approval_list.title

// 一覧画面（admin ルート配下の approval_list トップ／page・count サブルート／クエリ付き）にマッチし、
// /approval_list/line_items/csv 等のサブパスにはマッチしないようアンカーする（URLアサーションの厳密化）。
const APPROVAL_LIST_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/product/stock/approval_list(?:/page/\\d+(?:/count/\\d+)?)?(?:\\?.*)?$`
);

/** 管理者でログインする。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  await expect(page.locator("#login_id")).toBeHidden();
}

test.describe(
  "管理画面 > 在庫管理 > 在庫編集承認一覧",
  { tag: ["@admin", "@stock", "@search-list"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M04-32-024 未ログインで承認一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/approval_list`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログイン必須（設計書: すべて管理ログインを要する）
    });

    // ===== 画面表示・検索（SEED-M04-32-ADMIN／データ非依存で実行可） =====

    test("E2E-M04-32-001 承認一覧画面の見出し「在庫編集承認一覧」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      await expect(page.locator("body")).toContainText(TITLE);
    });

    test("E2E-M04-32-002 検索フォームの主要検索条件入力欄と検索ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      await target.seeScreen();
      await target.seeSearchFields();
    });

    test("E2E-M04-32-003 一覧テーブルの見出し列が仕様どおり表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      await target.seeListHeaders();
    });

    test("E2E-M04-32-004 検索結果件数の見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      await target.seeResultCount();
    });

    test("E2E-M04-32-005 承認ステータスで検索すると同一画面に結果が再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      // 承認ステータス「未承認」を選択して検索（任意項目のため0件でも検索は成立する）。
      await target.approvalStatus
        .locator('input[type="checkbox"]')
        .first()
        .check();
      await target.search();
      await expect(page).toHaveURL(APPROVAL_LIST_RE); // 同一画面に留まる
      await target.seeResultCount();
    });

    test("E2E-M04-32-006 検索条件がセッションに保持され再アクセスで復元される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      const firstStatus = target.approvalStatus.locator('input[type="checkbox"]').first();
      await firstStatus.check();
      await target.search();
      await target.goto(); // 一覧URLへ再アクセス（GETでセッション復元）
      await expect(
        target.approvalStatus.locator('input[type="checkbox"]').first()
      ).toBeChecked();
    });

    test("E2E-M04-32-007 「検索条件をクリア」リンクで入力がクリアされる", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      const firstStatus = target.approvalStatus.locator('input[type="checkbox"]').first();
      await firstStatus.check();
      await target.clearLink.click(); // クライアント制御（検索は実行しない）。要実機確認
      await expect(firstStatus).not.toBeChecked();
    });

    test("E2E-M04-32-008 CSVダウンロードボタンで検索結果CSVのダウンロードが発火する", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        target.csvDownloadLink.click(),
      ]);
      // ファイル名は仕様(stock_approval_list_YmdHis.csv)由来。内容検証は手動。
      expect(download.suggestedFilename()).toMatch(/^stock_approval_list_.*\.csv$/);
    });

    test("E2E-M04-32-009 表示件数プルダウン変更で件数変更URLへ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      const options = target.pageCountPulldown.locator("option");
      const count = await options.count();
      test.skip(count < 2, "表示件数の選択肢が不足（mtb_page_max 要確認）");
      // 2番目の選択肢へ変更（onchange で URL 遷移する）。
      const value = await options.nth(1).getAttribute("value");
      await target.pageCountPulldown.selectOption(value || "");
      await expect(page).toHaveURL(/\/product\/stock\/approval_list\/page\/1\/count\/\d+/);
    });

    test("E2E-M04-32-010 不正な表示件数を直接指定するとエラーにならず一覧が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.gotoPageCount(1, 9999); // mtb_page_max に無い値→既定件数へ丸め
      await expect(page.locator("body")).toContainText(TITLE); // 例外にならず一覧表示
      // 丸めのオラクル: 不正値 9999 が採用されないこと（採用件数=既定へ丸め）。
      // 既定件数の具体値は実装由来のためオラクル化せず、「9999 が選択値に残らない」ことだけを観測する。
      const selected = await target.pageCountPulldown.inputValue();
      expect(selected).not.toBe("9999");
    });

    // ===== 検索の相関バリデーション（データ非依存で実行可） =====

    test("E2E-M04-32-012 登録日 From>To でフォームエラーになり検索が成立しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      await target.registeredDateStart.fill("2026-01-02");
      await target.registeredDateEnd.fill("2026-01-01");
      await target.search();
      await expect(page.locator("body")).toContainText(DATE_END_ERROR);
      await expect(page).toHaveURL(APPROVAL_LIST_RE); // 画面に留まる
    });

    test("E2E-M04-32-013 承認日 From>To でフォームエラーになり検索が成立しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      await target.approvedDateStart.fill("2026-01-02");
      await target.approvedDateEnd.fill("2026-01-01");
      await target.search();
      await expect(page.locator("body")).toContainText(DATE_END_ERROR);
      await expect(page).toHaveURL(APPROVAL_LIST_RE);
    });

    test("E2E-M04-32-014 合致しない条件で検索すると該当なしメッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto();
      // 未来日（登録日From）で確実に0件にする。
      await target.registeredDateStart.fill("9999-12-31");
      await target.search();
      await expect(target.noResult).toBeVisible();
    });

    // ===== 明細CSV セッション欠落（データ非依存で実行可） =====

    test("E2E-M04-32-023 明細CSVをセッション選択なしで直接アクセスすると一覧へ誘導される", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M04-32-ADMIN 未設定");
      await login(page);
      const target = new StockStockApprovalListPage(page);
      await target.goto(); // セッションに明細選択IDを持たない状態
      await target.gotoLineItemsCsv();
      await expect(page).toHaveURL(APPROVAL_LIST_RE); // 一覧へリダイレクト
      await expect(page.locator("body")).toContainText(NO_SESSION);
    });

    // ===== 保留（自動化予定・SEED未整備で未実装。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-32-011 ページャでセッション条件の2ページ目を表示できる（要 SEED-M04-32-PAGING：既定件数超）",
      async () => {
        // 期待: セッション検索条件で2ページ目。pager.twig(list.twig:530 routes=admin_stock_approval_list_page)。
      }
    );

    test.fixme(
      "E2E-M04-32-015 一括操作対象（未承認・在庫編集系・登録者≠自分）の行のみチェックボックスが表示される（要 SEED-M04-32-ACTIONABLE）",
      async () => {
        // 期待: list.twig:494 if is_bulk_actionable。対象外行には input[name="approval_list_ids[]"] が無いこと。
      }
    );

    test.fixme(
      "E2E-M04-32-016 チェック選択して一括承認を押すと確認モーダル「確認」が表示される（要 SEED-M04-32-ACTIONABLE）",
      async () => {
        // 期待: #btn_bulk_approve(list.twig:455)→ #stockApprovalListConfirmModal(:536) title「確認」(:543)。
      }
    );

    test.fixme(
      "E2E-M04-32-017 一括承認を確定すると「保存しました」表示し一覧へ戻る（要 SEED-M04-32-ACTIONABLE＋承認権限。破壊的）",
      async () => {
        // 期待: 「承認する」(:575)→「OK」(:579)→ save_complete「保存しました」(Controller:272/messages:1398)。DB値は手動/間接。
      }
    );

    test.fixme(
      "E2E-M04-32-018 却下理由未入力で「却下する」を押すと却下できない（クライアントalert・要実機確認）",
      async () => {
        // 期待: list.twig:326 alert「却下理由は入力必須です」。dialog 捕捉が必要。SEED-M04-32-ACTIONABLE。
      }
    );

    test.fixme(
      "E2E-M04-32-019 却下理由入力で却下を確定すると「保存しました」表示（要 SEED-M04-32-ACTIONABLE＋承認権限。破壊的）",
      async () => {
        // 期待: #rejection_reason(:559)入力→「却下する」(:574)→「OK」(:579)→ save_complete。却下理由の保存/通知メールは未実装(付帯表4#2)。
      }
    );

    test.fixme(
      "E2E-M04-32-020 承認権限がないと一括承認/却下で「在庫編集の承認権限がありません。」表示（要 SEED-M04-32-DENY）",
      async () => {
        // 期待: not_granted(messages:5083 / StockApprovalListUpdateAction isGrantedForStockApprovalList)→一覧へリダイレクト。
      }
    );

    test.fixme(
      "E2E-M04-32-021 承認対象（在庫編集系）リンクで明細モーダルが開きAjaxで明細が表示される（要 SEED-M04-32-ACTIONABLE）",
      async () => {
        // 期待: a.js-open-single-approval-modal(:500)→ #js-approval-line-items-container(:555) に明細テーブル(Ajax POST admin_stock_approval_list_line_items)。
      }
    );

    test.fixme(
      "E2E-M04-32-022 明細モーダル内の明細CSVリンクが明細読込後に活性化する（要 SEED-M04-32-ACTIONABLE）",
      async () => {
        // 期待: .js-approval-line-items-csv-link(:553) が読込後 aria-disabled=false（list.twig JS:200-202,234）。
      }
    );

    test.fixme(
      "E2E-M04-32-025 在庫移動/振替/分割/結合の承認対象は別タブで承認画面を開くリンクになっている（要 SEED-M04-32-EXTERNAL）",
      async () => {
        // 期待: 非活性行 a[target=_blank] href=item.approval_target_link(list.twig:504-505)。遷移先本体は別機能委譲。
      }
    );

    test.fixme(
      "E2E-M04-32-027 ヘッダのチェックボックスでページ内の対象行を一括選択/解除できる（要 SEED-M04-32-ACTIONABLE）",
      async () => {
        // 期待: #toggle_check_all(list.twig:473 / JS:127-181)→ input[name="approval_list_ids[]"]:not(:disabled) が全check、再押下で全解除。
      }
    );

    test.fixme(
      "E2E-M04-32-028 自己登録分を含む一括承認/却下は「在庫編集の承認権限がありません。」で弾かれる（自己承認不可・要 SEED-M04-32-ACTIONABLE）",
      async () => {
        // 期待: 自分が登録者の対象を選択し確定→ not_granted(messages:5083 / UpdateAction:61 countByRegisteredMemberId>0)→一覧へリダイレクト。判定順序#2。
      }
    );

    test.fixme(
      "E2E-M04-32-029 明細モーダルを開いた後に明細CSVを正常にダウンロードできる（要 SEED-M04-32-ACTIONABLE）",
      async () => {
        // 期待: モーダルを開く→ .js-approval-line-items-csv-link(:553) 押下→ stock_approval_line_items_*.csv の download 発火。内容は手動。023(セッション欠落)と対。
      }
    );

    test.fixme(
      "E2E-M04-32-032 対象未選択で一括処理を要求すると「承認一覧IDが指定されていません。」が表示される（判定順序#1・要直接リクエスト）",
      async () => {
        // 期待: approval_list_ids 空で update→ no_approval_list_ids(messages:5084 / UpdateAction:57)→一覧へリダイレクト。通常UIでは一括ボタン非活性のため直接リクエストで再現。
      }
    );
  }
);
