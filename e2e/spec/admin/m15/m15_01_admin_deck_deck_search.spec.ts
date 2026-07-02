/**
 * 管理画面 デッキ管理 > デッキ検索・一覧 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m15_01_admin_deck_deck_search_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち非破壊で安全に実行できるケースのみ test 本体で実装し、
 * 厳密な包含検証・複数ページ・行存在依存は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m15-01_admin_deck_deck_search.md／観点表／基本設計）由来（オラクル独立性）。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（検索フォームCSRF有効化・検索項目の削減/改名・
 * ソートUIの差・admin.error.sort未実装・タイトル/サブタイトル割当）はケース表「付帯表4」に出し、テストは仕様どおりに書く
 * （実装が違えば落ちて検出する）。ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m11系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境・参照系）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 本機能は参照系（検索）でありDBを変更しない。検索送信・表示・遷移・クライアント側クリアは安全に実行できる。
 *  - 一括削除・一括編集・CSV出力・個別削除は別機能（設計書も主題外）のためケース表で対象外/別機能委譲とし、specに置かない。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { DeckDeckSearchPage } from "../../../pages/admin/m15/m15_01_admin_deck_deck_search.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const NEW_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/deck/new(\\?|$)`);
const CSV_IMPORT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/deck/csv_import(\\?|$)`);
// 設計書（md:34「行のデッキ詳細リンク／編集 → GET /{admin_route}/deck/{id}」）由来の遷移先。
// 刷新実装は admin_deck_edit = /deck/{id}/edit（index.twig:539）で乖離＝付帯表4#9。仕様どおり /deck/{id} を期待し、乖離は落として検出する。
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/deck/\\d+(\\?|$)`);

/** 管理ログインしてからデッキ一覧画面（GET /deck）を開く。 */
async function gotoDeckListAsAdmin(page: Page): Promise<DeckDeckSearchPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const deck = new DeckDeckSearchPage(page);
  await deck.gotoList();
  return deck;
}

test.describe(
  "管理画面 > デッキ管理 > デッキ検索・一覧",
  { tag: ["@admin", "@deck"] },
  () => {
    // ===== 表示（GET・非破壊） =====

    test("E2E-M15-01-001 一覧初期表示で検索フォームと『デッキ管理』が表示され、検索実行前は件数ヘッダが出ない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await expect(deck.searchForm).toBeVisible();
      // 設計書「ページタイトルは『デッキ管理』」由来。刷新実装は sub_title ブロックに割当（付帯表4#6）。
      await expect(page.locator("body")).toContainText("デッキ管理");
      // 処理フロー: 一覧初期表示（GET admin_deck_list）は結果エリアが「検索実行前」相当＝件数ヘッダなし。
      await expect(deck.resultCount).toHaveCount(0);
    });

    test("E2E-M15-01-002 検索フォームに主要な検索入力欄が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.seeSearchForm();
    });

    test("E2E-M15-01-003 見出し『デッキ一覧』とサブタイトル『デッキ管理』が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      // 期待は設計書（画面見出し）由来。刷新の block 割当は title=デッキ一覧 / sub_title=デッキ管理（付帯表4#6）。
      await expect(deck.pageTitle).toContainText("デッキ一覧");
      await expect(deck.subTitle).toContainText("デッキ管理");
    });

    test("E2E-M15-01-004 『検索する』ボタン・『検索条件をクリア』・『日付クリア』が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await expect(deck.searchButton).toBeVisible();
      await expect(deck.searchClear).toBeVisible();
      await expect(deck.dateClear).toBeVisible();
    });

    // ===== 検索実行（POST・参照系） =====

    test("E2E-M15-01-010 条件未指定で検索すると件数ヘッダ『検索結果：N件』が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.submitSearch();
      // 処理フロー: 検索実行後は1ページ目一覧（該当件数ヘッダ）を返す。件数値はデータ依存のため見出し表示のみ判定。
      await deck.seeResultHeader();
    });

    test("E2E-M15-01-012 ヒット0件の条件で検索すると一覧に該当行が0件になる（該当データなし）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.deckName.fill("ZZZ_E2E_NO_SUCH_DECK_xyz987"); // 部分一致しない非存在語
      await deck.submitSearch();
      // 期待は設計書「成功時出力＝該当時のみ一覧テーブル」（md:205）由来。一覧の該当行（input.searched_deck_id）が0件であることで判定。
      // 実装の0件文言（messages.ja.yaml）は固定しない（オラクル独立性）。
      await expect(deck.rowCheckboxes).toHaveCount(0);
    });

    test("E2E-M15-01-022 検索後にGET /deck/search/1 を開くとセッションから検索条件が復元される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.deckName.fill("E2E_SESSION_RESTORE");
      await deck.submitSearch();
      // 処理フロー: GET /deck/search/{n} は直前の検索条件をセッションから復元する。
      await deck.gotoSearch(1);
      await expect(deck.deckName).toHaveValue("E2E_SESSION_RESTORE");
    });

    test("E2E-M15-01-030 並べかえUIを変更すると並び順がセッション保存され該当順で再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.submitSearch(); // 結果エリア（並べかえUI）を出す
      await expect(deck.sortOrderPulldown).toBeVisible();
      await deck.sortOrderPulldown.selectOption("ASC"); // change で自動 submit（index.twig:73-80）
      await page.waitForLoadState();
      // 並び順がセッション保存され、再表示後も選択（昇順）が保持されること。
      await expect(deck.sortOrderPulldown).toHaveValue("ASC");
    });

    // ===== バリデーション（正常×異常の対・参照系） =====

    test("E2E-M15-01-040 デッキ名に最大長+1（51文字）で検索するとエラーで検索処理に進まない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      // 仕様（入力項目: デッキ名は文字列50=stext_len）由来。stext_len は環境上書きされうるが期待は設計書の50超過＝エラー。
      await deck.deckName.fill("あ".repeat(51));
      await deck.submitSearch();
      // バリデーションエラー時は検索処理へ進まず同テンプレート再描画＝件数ヘッダが出ない。
      await expect(deck.resultCount).toHaveCount(0);
      await expect(deck.searchForm).toBeVisible();
      // エラー表示の出力クラスは実機確認（form_errors の描画位置）。存在のみ best-effort で確認。
      expect(
        await page.locator(".invalid-feedback, .text-danger, .form-error-message").count(),
        "デッキ名 文字数超過のフォームエラーが表示されること"
      ).toBeGreaterThan(0);
    });

    test("E2E-M15-01-041 デッキ名に最大長（50文字）で検索するとエラーなく検索が継続する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.deckName.fill("あ".repeat(50));
      await deck.submitSearch();
      // 境界内は検索成功＝件数ヘッダ（0件含む）が出る。
      await deck.seeResultHeader();
    });

    test("E2E-M15-01-042 デッキIDに非数値（abc）で検索すると書式エラーで検索処理に進まない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      // 仕様（入力項目: デッキIDは数字・カンマ・スペースのみ許容）由来。
      await deck.deckId.fill("abc");
      await deck.submitSearch();
      await expect(deck.resultCount).toHaveCount(0);
      await expect(deck.searchForm).toBeVisible();
      expect(
        await page.locator(".invalid-feedback, .text-danger, .form-error-message").count(),
        "デッキID 書式エラーが表示されること"
      ).toBeGreaterThan(0);
    });

    test("E2E-M15-01-043 デッキIDに数字・カンマ（1,2,3）で検索するとエラーなく検索が継続する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.deckId.fill("1,2,3");
      await deck.submitSearch();
      await deck.seeResultHeader();
    });

    test("E2E-M15-01-045 順位（下限）に整数（1）で検索するとエラーなく検索が継続する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      // 仕様（入力項目: 順位＝Symfony integer、md:131）由来。整数値は型バリデーション正常＝検索継続。
      await deck.rankingFrom.fill("1");
      await deck.submitSearch();
      await deck.seeResultHeader();
    });

    test("E2E-M15-01-047 イベント開催日Fromに有効日付で検索するとエラーなく検索が継続する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      // 仕様（入力項目: イベント日＝yyyy-MM-dd ウィジェット、md:128）由来。有効日付は型バリデーション正常＝検索継続。
      await deck.eventDateFrom.fill("2020-01-01");
      await deck.submitSearch();
      await deck.seeResultHeader();
    });

    // ===== 画面遷移（GET・非破壊） =====

    test("E2E-M15-01-051 新規登録ボタンでデッキ新規登録画面（/deck/new）へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.newButton.click();
      await expect(page).toHaveURL(NEW_RE);
    });

    test("E2E-M15-01-052 CSV登録ボタンでCSV取込画面（/deck/csv_import）へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.csvImportButton.click();
      await expect(page).toHaveURL(CSV_IMPORT_RE);
    });

    // ===== クライアント側クリア（非破壊） =====

    test("E2E-M15-01-070 『検索条件をクリア』でテキスト入力欄が空になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      await deck.deckName.fill("E2E_CLEAR");
      await deck.searchClear.click();
      await expect(deck.deckName).toHaveValue("");
    });

    test("E2E-M15-01-071 『日付クリア』でイベント開催日 From/To が空になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const deck = await gotoDeckListAsAdmin(page);
      // 開催日From は既定値（-3month）が入っている。クリアで空になることを確認（index.twig:82-85）。
      await deck.dateClear.click();
      await expect(deck.eventDateFrom).toHaveValue("");
      await expect(deck.eventDateTo).toHaveValue("");
    });

    // ===== 未ログインガード（資格情報不要） =====

    test("E2E-M15-01-060 未ログインで一覧URL（/deck）へ直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M15-01-061 未ログインで検索URL（/deck/search/1）へ直接アクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/deck/search/1`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（要シード/複数ページ/行存在。理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で管理） =====

    test.fixme(
      "E2E-M15-01-011 デッキ名条件で該当デッキが一覧に含まれる（要: SEED-M15-01-DECKS 既知デッキ）",
      async () => {
        // 期待は仕様（業務ルール: デッキ名トークン部分一致）由来。既知デッキ投入後、該当行の存在を厳密照合する。
      }
    );

    test.fixme(
      "E2E-M15-01-020 ページリンクでNページ目→直前条件を復元しNページ表示（要: SEED-M15-01-DECKS 2ページ超）",
      async () => {
        // 期待は仕様（処理フロー: ページ送りでセッション条件・ソートを復元）由来。pager の page-link 押下→/deck/search/2 とDOM更新で判定。
      }
    );

    test.fixme(
      "E2E-M15-01-021 表示件数変更でその件数にページ分割され選択が保持（要: SEED-M15-01-DECKS 複数ページ）",
      async () => {
        // 期待は仕様（処理フロー#9: page_count がマスタ一致でセッション保存しページ分割）由来。
        // #page_count_pulldown 変更で件数分割の変化を厳密確認するには複数ページ分のデータが要る。
      }
    );

    test.fixme(
      "E2E-M15-01-044 順位（下限）に非整数→型(integer)エラーで検索進まず（要実機確認: number入力でサーバ到達前抑止の可能性）",
      async () => {
        // 期待は仕様（入力項目: 順位＝Symfony integer、md:131）由来＝非整数は検索処理に進まず件数ヘッダが出ない。
        // 刷新は IntegerType。ブラウザの number 入力がサーバ到達前に弾き得るため挙動は実機確認後にE2E昇格（付帯表5 型別バリデーション）。
      }
    );

    test.fixme(
      "E2E-M15-01-046 イベント開催日Fromに不正書式→型(date書式)エラーで検索進まず（要実機確認: date入力で抑止の可能性）",
      async () => {
        // 期待は仕様（入力項目: イベント日＝yyyy-MM-dd ウィジェット、md:128）由来＝不正書式は検索処理に進まず件数ヘッダが出ない。
        // 刷新は DateType(single_text)。ブラウザの date 入力がサーバ到達前に弾き得るため挙動は実機確認後にE2E昇格（付帯表5 型別バリデーション）。
      }
    );

    test.fixme(
      "E2E-M15-01-050 行のデッキ詳細/編集リンク→デッキ編集（設計 /deck/{id}）へ遷移（要: SEED-M15-01-DECKS 1件以上）",
      async () => {
        // 期待は設計書（md:34 画面遷移: 行リンク→GET /deck/{id} デッキ編集）由来。検索ヒット行の編集リンク押下で EDIT_RE へ遷移を判定。
        // 刷新実装は /deck/{id}/edit（付帯表4#9）＝仕様どおり EDIT_RE(=/deck/{id}) を期待し乖離を検出する。
        void EDIT_RE;
      }
    );
  }
);
