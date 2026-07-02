/**
 * 管理画面 商品管理 買取/販売価格履歴（検索・一覧・CSV出力） E2E。納品ケース表
 * integration_test/e2e/m03_23_admin_product_product_buy_sale_price_history_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ/要実機確認は test.fixme で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m03-23_admin_product_product_buy_sale_price_history.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m03/* も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * 参照系・CSV内容の扱い: 本機能は検索とCSV出力のみの参照系。件数厳密一致・CSV本文・属性別の含む/含まないは
 * 要シードのうえ手動/間接（ケース表）。E2Eでは件数見出し/該当なし表示・CSV発火/応答/ファイル名・
 * 未検索時のフラッシュ＋リダイレクト・未認証ガードを自動化する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { ProductProductBuySalePriceHistoryPage } from "../../../pages/admin/m03/m03_23_admin_product_product_buy_sale_price_history.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 管理ログイン画面（admin ルート配下）。公開側ログインへの誤誘導では通らないよう admin_route を含める。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const SEARCH1_RE = /\/product\/buy_sale_price_history\/search\/1(\?|$)/;
// 初期一覧URL（CSV未検索時のリダイレクト先 admin_product_buy_sale_price_history）。
const LIST_RE = /\/product\/buy_sale_price_history(\?|$)/;
// CSVファイル名 buy_sale_price_<YmdHis>.csv（Controller.php:213）。
const FILENAME_RE = /^buy_sale_price_\d{14}\.csv$/;
// SEED-M03-23-PRICEHIST が含む既知の複合キーワード。シード実装時に確定（要確認）。
const SEED_KEYWORD =
  process.env.SEED_M03_23_PRICEHIST_KEYWORD || "テスト";

/** 管理ログインして買取/販売価格履歴の初期一覧を開く。 */
async function loginAndOpen(
  page: Page
): Promise<ProductProductBuySalePriceHistoryPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const hist = new ProductProductBuySalePriceHistoryPage(page);
  await hist.goto();
  return hist;
}

test.describe(
  "管理画面 > 商品管理 > 買取/販売価格履歴",
  { tag: ["@admin", "@product"] },
  () => {
    // ===== 認証不要（権限・認可ガード） =====

    test("E2E-M03-23-040 未ログインで初期一覧URL直接→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M03-23-041 未ログインでCSV出力URL直接→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history/export`
      );
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ） =====

    test("E2E-M03-23-001 初期表示: 複合キーワード欄・検索ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await hist.seeSearchForm();
    });

    test("E2E-M03-23-002 初期表示: 詳細検索枠が初期で開いている", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await expect(hist.searchDetail).toBeVisible(); // twig:79 collapse ec-collapse show
    });

    test("E2E-M03-23-003 初期表示: 詳細検索枠に日付・カテゴリ・価格レンジが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await hist.seeSearchDetail();
    });

    test("E2E-M03-23-004 初期表示: 該当データなしメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      // 仕様(利用者視点の入口): 初回GETは pagination=null で一覧表を出さず該当なし文言を表示する。
      await hist.seeNoData(); // trans admin.product.buy_sale_price_history.no_data
    });

    test("E2E-M03-23-005 初期表示: 親タイトル・サブタイトルが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpen(page);
      await expect(page.locator("body")).toContainText("商品管理"); // trans admin.product.product_management
      await expect(page.locator("body")).toContainText("買取/販売価格履歴"); // trans admin.product.purchase_sale_price_history
    });

    // ===== 検索POST（正常系/異常系の対） =====

    test("E2E-M03-23-010 複合キーワードで検索すると該当件数見出しが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      // SEED-M03-23-PRICEHIST が含む既知語で検索し、件数見出しが返ることを確認する（件数厳密一致は手動）。
      await hist.searchByKeyword(SEED_KEYWORD);
      await hist.seeResultCountHeading();
    });

    test("E2E-M03-23-011 該当しない条件で検索すると該当なしメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await hist.searchByKeyword("__no_such_price_history_zzz_明らかに存在しない__");
      await hist.seeNoData();
    });

    test("E2E-M03-23-012 検索送信で search/1 のURLへ遷移しHTMLを返す", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await hist.submitSearch(); // 既定条件で送信
      await expect(page).toHaveURL(SEARCH1_RE); // 画面遷移: POST送信先 search/1
    });

    test("E2E-M03-23-006 検索結果ありのとき一覧表に商品コード〜登録者の列が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await hist.searchByKeyword(SEED_KEYWORD);
      const count = await hist.resultList.count();
      test.skip(
        count === 0,
        "検索結果が0件で一覧表が描画されない（要 SEED-M03-23-PRICEHIST）"
      );
      // 仕様(フロント挙動 md:49): 結果一覧表は商品コード〜登録者の列を持つ。両端の列見出しで確認。
      await hist.seeResultListColumns();
    });

    test("E2E-M03-23-013 「検索条件をクリア」リンクで複合キーワード欄が空になる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      // 仕様(フロント挙動JS md:50): クリアリンクはテキスト入力を空にする。
      await hist.clearSearchAndExpectEmptyKeyword("クリア確認用キーワード");
    });

    // ===== CSV出力（正常系/異常系の対） =====

    test("E2E-M03-23-021 未検索状態でCSV URL直接→エラーで初期一覧へ転送", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ADMIN_USER, ADMIN_PASS);
      // 検索を実行せずに export 直接アクセス（セッションに検索条件なし）。
      const hist = new ProductProductBuySalePriceHistoryPage(page);
      await hist.gotoExport();
      // 仕様(処理フロー・エラー処理): 初期一覧URLへリダイレクトし、フラッシュ文言を表示する。
      await expect(page).toHaveURL(LIST_RE);
      await expect(page).not.toHaveURL(/\/export/);
      await expect(page.locator("body")).toContainText(
        "検索条件を指定してからCSVをダウンロードしてください。"
      );
    });

    test("E2E-M03-23-022 検索結果ありのときCSVダウンロードリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await hist.searchByKeyword(SEED_KEYWORD);
      const count = await hist.csvDownloadLink.count();
      test.skip(
        count === 0,
        "検索結果が0件でCSVダウンロードリンクが描画されない（要 SEED-M03-23-PRICEHIST）"
      );
      await expect(hist.csvDownloadLink).toBeVisible(); // trans admin.common.csv_download（結果あり時のみ）
    });

    test("E2E-M03-23-020 検索後CSVダウンロードでCSVファイルが返る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      await hist.searchByKeyword(SEED_KEYWORD);
      const count = await hist.csvDownloadLink.count();
      test.skip(
        count === 0,
        "検索結果が0件でCSVダウンロードリンクが描画されない（要 SEED-M03-23-PRICEHIST）"
      );
      const download = await hist.exportAndWaitDownload();
      // 仕様(処理フロー5): ファイル名は buy_sale_price_<YmdHis>.csv。内容検査は手動。
      expect(download.suggestedFilename()).toMatch(FILENAME_RE);
    });

    // ===== バリデーション正常系（050桁超過NGの対＝境界内の正常値） =====

    test("E2E-M03-23-052 価格レンジに範囲内の正常値を入力すると検証エラーなく検索が完了する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const hist = await loginAndOpen(page);
      // 仕様(バリデーション節: 価格は数値/桁制約。境界内なら通る)由来。桁上限値はオラクル化せず、
      // 妥当な整数値で検証エラーが出ず search/1 に遷移することを確認する（050桁超過NGの正常系対）。
      await hist.searchBySellPriceFromExpectNoError("1000");
      await expect(page).toHaveURL(SEARCH1_RE);
      await expect(hist.priceErrors).toHaveCount(0);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M03-23-023 CSV本文の検証（手動・要シード: ヘッダ/データ行/NULL→空文字/登録日形式）",
      async () => {
        // 期待は仕様(処理フロー4: ヘッダ行とデータ行を逐次出力 md:77／空セルを空文字に落とす md:151)由来。
        // ダウンロードファイルの中身（列順・列値・NULL→空文字・登録日形式・BOM/文字コード）は
        // ファイル内部検査＝手動。E2Eでは発火/ファイル名のみ自動化（020）。内容はオラクル化せず手動確認。
      }
    );

    test.fixme(
      "E2E-M03-23-030 表示件数の選択で件数指定URLへ遷移（要: 結果データ＋dropdown-item挙動の実機確認）",
      async () => {
        // 期待は仕様(処理フロー3・画面遷移 page_count)由来。表示件数は<select>でなくBootstrap dropdown
        // （ul.dropdown-menu の a.dropdown-item・不具合候補#2）。クリックで search/1?page_count=… 遷移を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-23-031 ページネーションで2ページ目を表示（要: 2ページ以上の履歴シード）",
      async () => {
        // 期待は仕様(画面遷移 ページリンク search/{page_no})由来。SEED-M03-23-PRICEHIST-PAGED 投入後に実装。
      }
    );

    test.fixme(
      "E2E-M03-23-050 価格レンジに桁超過入力で検証エラー（要: form_errors描画位置の実機確認）",
      async () => {
        // 期待は仕様(バリデーション節: 価格の数値/桁制約)由来。桁上限値(eccube_price_len)はオラクル化せず、
        // 明らかな桁超過入力で検証エラー表示の有無を実機確認後に実装（不具合候補#5）。
      }
    );

    test.fixme(
      "E2E-M03-23-051 ソートクエリ異常値でエラーフラッシュ後に初期一覧へ戻る（要: セッション検索確立＋order不正クエリ手順の実機確認）",
      async () => {
        // 期待は仕様(エラー処理: 並びクエリ ASC/DESC 以外→エラー翻訳キー積み初期画面)由来。
        // フラッシュ文言・遷移先は SearchControllerTrait 実装に依存（不具合候補#6）。実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M03-23-014 日付レンジで検索すると登録日でフィルタした結果/該当なしが返る（要: 登録日が既知の履歴シード）",
      async () => {
        // 期待は仕様(入力項目 日付 md:119: date_from以上・date_to翌日未満で create_date に適用)由来。
        // 範囲内→件数見出し、範囲外→該当なし。件数厳密一致はシード依存のため手動/間接。
        // SEED-M03-23-PRICEHIST の登録日確定後に実装（複合キーワード以外の検索条件の正常×非ヒットの対）。
      }
    );

    test.fixme(
      "E2E-M03-23-032 最終ページのデータが無くなった場合に1つ前のページへ補正される（要: 実機/再現困難）",
      async () => {
        // 期待は仕様(処理フロー6 md:70: 最終ページ境界で行が無くなると1つ前のページへ再ページング)由来。
        // 本機能は参照系で画面から履歴を削除できず、検索中の他者削除に依存するため再現困難＝手動/要実機。
      }
    );
  }
);
