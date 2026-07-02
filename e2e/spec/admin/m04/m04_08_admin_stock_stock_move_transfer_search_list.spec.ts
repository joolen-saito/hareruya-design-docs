/**
 * 管理画面 在庫管理 在庫移動・振替検索/一覧 E2E。納品ケース表
 * integration_test/e2e/m04_08_admin_stock_stock_move_transfer_search_list_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、要データ/要セッションなど自動化予定だが未実装のものは test.fixme で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-08_admin_stock_stock_move_transfer_search_list.md /
 * 基本設計(在庫管理機能) / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { StockStockMoveTransferSearchListPage } from "../../../pages/admin/m04/m04_08_admin_stock_stock_move_transfer_search_list.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

const LOGIN_RE = /\/login(\?|$)/;
// 表示件数変更後の遷移先（処理フロー#4・入口節 GET /move_transfer/page/1?page_count=…）。
const PAGE_COUNT_RE = /\/move_transfer\/page\/1\?.*page_count=/;
// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const NO_SELECTION_RETURN = "1つ以上の在庫移動情報を選択してください。"; // :5139 戻しリストCSV/PDF
const NO_SELECTION_INSTRUCTION = "1つ以上の移動を選択してください。"; // :5159 移動指示作成

/** 管理ログインして在庫移動・振替一覧を開く。 */
async function loginAndOpenList(
  page: Page
): Promise<StockStockMoveTransferSearchListPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const list = new StockStockMoveTransferSearchListPage(page);
  await list.goto();
  return list;
}

test.describe(
  "管理画面 > 在庫管理 > 在庫移動・振替検索/一覧",
  { tag: ["@admin", "@stock"] },
  () => {
    // ===== 認証不要 =====

    test("E2E-M04-08-070 未ログインで一覧URL直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインは管理ログインへ
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 初期表示（ログインのみ） =====

    test("E2E-M04-08-001 初期表示: 見出し「在庫移動振替一覧」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await loginAndOpenList(page);
      await expect(page.locator("body")).toContainText("在庫移動振替一覧"); // trans admin.stock.move_transfer.title
    });

    test("E2E-M04-08-002 初期表示: CSVファイル登録カードと在庫移動/振替CSV登録ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await expect(list.csvFileRegistrationCard).toBeVisible();
      await expect(list.moveCsvRegisterButton).toBeVisible();
      await expect(list.transferCsvRegisterButton).toBeVisible();
    });

    test("E2E-M04-08-003 初期表示: 検索フォーム（ID欄・送り状No欄・検索ボタン）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.seeSearchForm();
    });

    test("E2E-M04-08-004 初期表示: 詳細検索枠は閉じている", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(エラー処理): 詳細検索 collapse は has_errors 時のみ show。初期GETは has_errors=false→閉じている。
      await expect(list.searchDetail).not.toBeVisible();
    });

    // ===== 検索POST（正常系/異常系の対） =====

    test("E2E-M04-08-010 既定条件で検索実行後も件数見出し（検索結果）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.submitSearch();
      await list.seeResultCountHeading(); // trans admin.common.search_result（pagination有時）
    });

    test("E2E-M04-08-012 該当しない条件で検索すると0件メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 非数字混在IDは ID文字列の部分一致(LIKE)。明らかに存在しない値で0件→search_no_result。
      await list.searchByStockMoveTransferId("__zzz_no_such_id_明らかに存在しない__");
      await list.seeNoResult(); // trans admin.common.search_no_result
    });

    test("E2E-M04-08-020 登録日が開始>終了でPOST検証エラーメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(例外処理・相関バリデーション): 開始>終了で admin.common.date_end_error を終了側に付与。
      await list.searchByCreateDateRange("2025-12-31", "2025-01-01");
      await list.seeDateEndError();
    });

    test("E2E-M04-08-021 POST検証エラー時は一覧（件数見出し）を描画しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByCreateDateRange("2025-12-31", "2025-01-01");
      await list.seeDateEndError();
      // 仕様(例外処理): 検証エラー時は pagination=null で一覧/件数を描画しない。
      await expect(page.getByText("検索結果")).toHaveCount(0);
    });

    test("E2E-M04-08-022 出庫日が開始>終了でPOST検証エラーメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByMoveFromStockDateRange("2025-12-31", "2025-01-01");
      await list.seeDateEndError();
    });

    test("E2E-M04-08-023 入庫日が開始>終了でPOST検証エラーメッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByMoveToStockDateRange("2025-12-31", "2025-01-01");
      await list.seeDateEndError();
    });

    test("E2E-M04-08-024 POST検証エラー時は詳細検索枠が開いて表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.searchByCreateDateRange("2025-12-31", "2025-01-01");
      await list.seeDateEndError();
      // 仕様(処理フロー・index.twig:534): has_errors 時は詳細検索 collapse が show になる。
      await expect(list.searchDetail).toBeVisible();
    });

    test("E2E-M04-08-025 全項目空のまま検索しても検証エラーにならず検索が継続する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(検索条件): 設計書「検索条件」表はいずれも任意指定（必須記載なし）。
      // 空送信でも検証エラーにならず検索が成立する＝件数見出しが出て相関エラーが出ない、という観測で判定する
      // （Form の required 等の実装制約はオラクル化しない）。
      await list.submitSearch();
      await list.seeResultCountHeading();
      await expect(
        page.getByText("終了日は、開始日より大きく設定してください")
      ).toHaveCount(0);
    });

    test("E2E-M04-08-026 登録日が開始≤終了（境界正常）では相関エラーにならず検索が継続する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(検索条件・例外処理): 日付3ペアの開始>終了のみ相関エラー。開始≤終了は検索継続（020の正常対）。
      await list.searchByCreateDateRange("2025-01-01", "2025-12-31");
      await expect(
        page.getByText("終了日は、開始日より大きく設定してください")
      ).toHaveCount(0);
      await list.seeResultCountHeading();
    });

    // ===== 各種出力・モーダル（資格情報のみで動作・データ不要） =====

    test("E2E-M04-08-040 在庫移動振替CSV出力リンク押下でCSVダウンロードが発火する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(利用者視点の入口 admin_stock_move_transfer_csv_export): セッション検索条件で全件CSV出力。
      // ダウンロード発火のみを観測する（CSV内容の厳密検査は手動／別機能M04-10）。
      const downloadPromise = page.waitForEvent("download");
      await list.moveTransferCsvExportLink.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename().length).toBeGreaterThan(0);
    });

    test("E2E-M04-08-050 在庫移動CSV登録ボタン押下でモーダルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.moveCsvRegisterButton.click();
      await expect(list.moveCsvModal).toBeVisible();
    });

    test("E2E-M04-08-051 在庫振替CSV登録ボタン押下でモーダルが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.transferCsvRegisterButton.click();
      await expect(list.transferCsvModal).toBeVisible();
    });

    test("E2E-M04-08-041 在庫移動CSV雛形をダウンロードできる（stock_move.csv）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.moveCsvRegisterButton.click(); // 雛形リンクはモーダル内のため先に開く
      await expect(list.moveCsvModal).toBeVisible();
      const downloadPromise = page.waitForEvent("download");
      await list.moveCsvTemplateLink.click();
      const download = await downloadPromise;
      // ファイル名は仕様(正本: stock_move.csv)由来。内容(ヘッダ)の厳密検査は手動。
      expect(download.suggestedFilename()).toBe("stock_move.csv");
    });

    test("E2E-M04-08-042 在庫振替CSV雛形をダウンロードできる（stock_transfer.csv）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      await list.transferCsvRegisterButton.click();
      await expect(list.transferCsvModal).toBeVisible();
      const downloadPromise = page.waitForEvent("download");
      await list.transferCsvTemplateLink.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe("stock_transfer.csv");
    });

    // ===== 未選択ガード（クライアントalert・データ不要） =====

    test("E2E-M04-08-060 戻しリストCSV出力で未選択時に選択要求メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      // 仕様(例外処理 戻しリスト出力の選択なし): 未選択で選択要求を表示。
      const dialogPromise = page.waitForEvent("dialog");
      await list.returnListCsvButton.click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain(NO_SELECTION_RETURN);
      await dialog.dismiss();
    });

    test("E2E-M04-08-061 戻しリストPDF出力で未選択時に選択要求メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const dialogPromise = page.waitForEvent("dialog");
      await list.returnListPdfButton.click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain(NO_SELECTION_RETURN);
      await dialog.dismiss();
    });

    test("E2E-M04-08-062 移動指示作成で未選択時に選択要求メッセージが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const list = await loginAndOpenList(page);
      const dialogPromise = page.waitForEvent("dialog");
      await list.createInstructionButton.click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain(NO_SELECTION_INSTRUCTION);
      await dialog.dismiss();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M04-08-030 表示件数プルダウン変更で件数指定URLへ遷移（要: 一覧データ・複数 mtb_page_max 値）",
      async () => {
        // 期待は仕様(入口 admin_stock_move_transfer_page・処理フロー#4)由来。
        // #page_count_pulldown は pagination かつ totalItemCount>0 時のみ描画されるため要シード。
        // 選択で /move_transfer/page/1?page_count=… (PAGE_COUNT_RE) へ遷移することを確認する。
      }
    );

    test.fixme(
      "E2E-M04-08-080 一覧の在庫移動振替IDリンク押下で詳細画面が別タブで開く（要: 在庫移動振替レコード）",
      async () => {
        // 期待は仕様(画面表示・一覧項目)由来。td 内 a[target=_blank] の遷移先(/stock/move/{id} 等)を要シード後に確認。
      }
    );

    test.fixme(
      "E2E-M04-08-081 戻しリストCSV出力（移動を選択）でCSVダウンロードが発火（要: 移動レコード・選択チェック）",
      async () => {
        // 期待は仕様(M04-33連携・validateReturnListExportRequest)由来。
        // ids[] にチェック→CSRF検証後にCSV出力。対象妥当性(移動であること等)を満たすシード後に実装。
      }
    );

    test.fixme(
      "E2E-M04-08-082 ページングで指定ページを表示（要: 2ページ以上のデータ）",
      async () => {
        // 期待は仕様(入口 admin_stock_move_transfer_page)由来。セッション検索条件復元＋ページ遷移を要シード後に実装。
      }
    );

    test.fixme(
      "E2E-M04-08-083 resume=1 で検索条件・ページ番号がセッションから復元される（要: セッション状態の事前確立）",
      async () => {
        // 期待は仕様(処理フロー#3 resume)由来。検索→別画面→/move_transfer?resume=1 の復元を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M04-08-084 戻しリストPDF出力（移動を選択）でPDF用HTMLがJSONで返る（要: 戻し対象の移動レコード・選択チェック）",
      async () => {
        // 期待は仕様(戻しリストPDF出力 return_list_pdf_export・M04-34連携)由来。
        // 未選択ガード(061)に対する正常系の対。ids[] にチェック→CSRF検証後にPDF用HTMLをJSONで返す。
        // 対象妥当性(移動であること等)を満たすシード後に実装。内容(HTML)の厳密検査は手動。
      }
    );

    test.fixme(
      "E2E-M04-08-085 移動指示作成（条件を満たす移動を選択）で在庫移動指示詳細へ遷移（要: 同一店舗・出庫承認済み・移動指示ID未登録の移動）",
      async () => {
        // 期待は仕様(create_instruction・移動をまとめて作成し在庫移動指示詳細へ遷移)由来。
        // 未選択ガード(062)に対する正常系の対。作成本体はM04-09。
        // 条件(移動タイプ＝移動・同一出庫元/入庫先店舗・出庫承認済み・移動指示ID未登録)を満たすシード後に実装。
      }
    );

    test.fixme(
      "E2E-M04-08-086 一覧の表示順が在庫移動振替ID降順であること（要: 在庫移動振替レコード複数件）",
      async () => {
        // 期待は基本設計『在庫移動振替IDを降順』を上位オラクルとする(不具合候補#1)。
        // 一覧テーブルのID列の並びがID降順であることを要シード後に確認。
        // 実装は登録日降順→ID降順のため乖離があれば本ケースで検出する（期待値は実装に寄せない）。
      }
    );
  }
);
