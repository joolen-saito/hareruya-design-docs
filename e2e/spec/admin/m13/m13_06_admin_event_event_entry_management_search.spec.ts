/**
 * 管理画面 イベント管理 > イベント申込検索（一覧/検索）E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m13_06_admin_event_event_entry_management_search_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動・間接（検索条件セッション保持・件数厳密一致）と対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(m13-06_admin_event_event_entry_management_search.md / integration-test-viewpoints.md / 基本設計)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計源と刷新先の乖離・ケース表 付帯表4）: 設計書は pf-eccube3 / HareruyaEc プラグインのリバースであり、刷新先
 * ec-cube-enterprise では入口URL(/event/entry)・検索モード値(event_entry/deck_registration)・初期表示挙動・並び順不正時の
 * 扱いが異なる。本specは実装ルートを位置情報として用いつつ、期待結果は仕様どおりに書く（乖離は落ちて検出）。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - 一覧結果・ページング・ソート・デッキ表示・CSV導線は対象期間の申込データ（SEED-M13-06-ENTRIES）が必要なため
 *    HAS_ENTRIES(SEED_M13_06_ENTRIES=1)が無いと走らないようガードする。
 *  - 検索条件セッション保持(間接)・並び順不正(設計と実装の乖離)は test.fixme／ケース表で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventEntryManagementSearchPage } from "../../../pages/admin/m13/m13_06_admin_event_event_entry_management_search.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// SEED-M13-06-ENTRIES（既知イベント・申込が複数ページ分投入済み）のとき true。
const HAS_ENTRIES = process.env.SEED_M13_06_ENTRIES === "1";
// 既知のイベント詳細ID（SEED-M13-06-ENTRIES に含まれる日程）。
const KNOWN_EVENT_DETAIL_ID = process.env.SEED_M13_06_EVENT_DETAIL_ID || "1";
// 既知イベント名の一部（検索に確実にヒットする語）。
const KNOWN_EVENT_NAME = process.env.SEED_M13_06_EVENT_NAME || "";

const LOGIN_RE = /\/login(\?|$)/;

// イベント詳細IDの最大長（設計: 10桁以内）。境界テストに用いる。実装制約値はオラクル化しない。
const EVENT_DETAIL_ID_MAX_LEN = 10;

/** 管理ログインして一覧画面へ。ログイン画面に留まっていないことを確認する。 */
async function loginAndOpenList(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE);
  const target = new EventEventEntryManagementSearchPage(page);
  await target.goto();
  return target;
}

test.describe(
  "管理画面 イベント管理 > イベント申込検索",
  { tag: ["@admin", "@event", "@entry"] },
  () => {
    // ===== 認証不要・非破壊 =====

    test("E2E-M13-06-016 未ログインで申込一覧URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== ログインのみで実行可（非破壊・参照） =====

    test("E2E-M13-06-001 申込一覧: 検索フォーム・検索ボタン・検索種別ラジオが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.seeSearchForm();
    });

    test("E2E-M13-06-002 申込一覧: 各検索入力部品が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      // 仕様(正本:92,168)の入力項目一式を検証する。DCIナンバー・確認済は刷新先に欠落（付帯表4#3#4）のため
      // 本ケースは実装で落ちて欠落を検出する（実装へ寄せて欠落を黙認しない）。
      await target.seeSearchInputs();
    });

    test("E2E-M13-06-003 既定モードで検索→申込一覧または0件メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.submitSearch();
      await target.seeListOrEmpty();
    });

    test("E2E-M13-06-004 デッキ登録検索モードで検索→一覧（または0件）が描画される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      await target.searchAsDeckRegistration();
      // 検索モード分岐後も画面に滞留し、一覧または0件メッセージが描画されること（スモーク）。
      // デッキ集計単位・デッキ用ソートキー候補・申込系条件のJS無効化（正本:141）はシード/JS依存のため
      // 手動・間接（ケース表 付帯表5「JS表示制御」「ソートキー候補」）。本ケースはモード切替の到達のみ確認。
      await expect(page).toHaveURL(/\/event\/entry(\?|$)/);
      await target.seeListOrEmpty();
    });

    test("E2E-M13-06-012 該当0件の条件→0件メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      // 実在しない語で確実に0件化する。
      await target.searchByEventName("___no_match_zzz_" + Date.now());
      await expect(target.emptyMessage).toBeVisible();
    });

    test("E2E-M13-06-013 開催日時From>Toで相関エラー表示・画面滞留", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      // From を To より後にして相関エラー（終了日時は開始日時より後）を誘発する。
      await target.searchByDateRange("2025-12-31 23:59", "2025-01-01 00:00");
      // 期待は仕様(開催日時 From≦To 相関)。文言は messages.ja.yaml:1418 由来。エラー要素セレクタは要実機確認。
      await expect(target.formError.first()).toBeVisible();
      await expect(page).toHaveURL(/\/event\/entry(\?|$)/);
    });

    test("E2E-M13-06-014 イベント詳細ID 最大長+1桁→入力長エラーで処理未完了", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      const overLen = "1".repeat(EVENT_DETAIL_ID_MAX_LEN + 1); // 最大長+1桁
      await target.searchByEventDetailId(overLen);
      // 期待は仕様(イベント詳細ID 10桁以内)。エラー表示で検索が完了せず滞留する。
      await expect(target.formError.first()).toBeVisible();
    });

    test("E2E-M13-06-015 イベント詳細ID 最大長ちょうど→エラーなく検索を継続", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      const maxLen = "1".repeat(EVENT_DETAIL_ID_MAX_LEN); // 最大長ちょうど（数字）
      await target.searchByEventDetailId(maxLen);
      // 文字列長エラーが出ず検索が実行され、一覧/0件のいずれかが描画される。
      await target.seeListOrEmpty();
    });

    test("E2E-M13-06-020 開催日時From≦Toは相関エラーなく検索を継続（013の正常系対）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      // From を To 以前にして相関エラーが出ないこと（仕様: 開催日時 From≦To）。
      await target.searchByDateRange("2025-01-01 00:00", "2025-12-31 23:59");
      // 相関エラーの非表示を確認（要素が描画されていても可視でないこと）。期待は仕様由来でForm文言はオラクル化しない。
      const errCount = await target.formError.count();
      if (errCount > 0) await expect(target.formError.first()).toBeHidden();
      // 検索が完了し一覧/0件のいずれかが描画される。
      await target.seeListOrEmpty();
    });

    test("E2E-M13-06-021 イベント詳細IDに数字以外→数字限定エラーで処理未完了（015の文字種異常系対）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenList(page);
      // 数字以外を含む値で数字限定（10桁以内の数字 Regex 正本:172,245）エラーを期待する。
      await target.searchByEventDetailId("12a");
      // 期待は仕様どおり「数字限定エラー」。刷新先は数字限定Regexが無く落ちて検出する（付帯表4#9）。
      await expect(target.formError.first()).toBeVisible();
    });

    // ===== シード（SEED-M13-06-ENTRIES）が要るケース =====

    test("E2E-M13-06-005 イベント名キーワードで申込を絞り込める", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_ENTRIES, "SEED-M13-06-ENTRIES 未投入（SEED_M13_06_ENTRIES=1）");
      test.skip(!KNOWN_EVENT_NAME, "SEED_M13_06_EVENT_NAME（既知イベント名の一部語）未設定");
      const target = await loginAndOpenList(page);
      await target.searchByEventName(KNOWN_EVENT_NAME);
      await expect(target.resultTable).toBeVisible();
      await expect(target.resultRows().first()).toBeVisible(); // 厳密件数は間接（ケース表参照）
    });

    test("E2E-M13-06-006 イベント詳細指定表示URL→特定日程の申込一覧（200）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_ENTRIES, "SEED-M13-06-ENTRIES 未投入");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      await expect(page).not.toHaveURL(LOGIN_RE);
      const target = new EventEventEntryManagementSearchPage(page);
      await target.gotoEventDetail(KNOWN_EVENT_DETAIL_ID);
      await expect(page).toHaveURL(
        new RegExp(`/event/entry/event_detail/${KNOWN_EVENT_DETAIL_ID}`)
      );
      await target.seeListOrEmpty();
    });

    test("E2E-M13-06-007 ページ送りURL→同条件の2ページ目が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_ENTRIES, "SEED-M13-06-ENTRIES（2ページ以上）未投入");
      const target = await loginAndOpenList(page);
      await target.submitSearch();
      await target.gotoPage(2);
      await expect(page).toHaveURL(/\/event\/entry\/page\/2/);
      await expect(target.resultTable).toBeVisible();
    });

    test("E2E-M13-06-008 表示件数変更→指定件数で一覧が再表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_ENTRIES, "SEED-M13-06-ENTRIES 未投入");
      const target = await loginAndOpenList(page);
      await target.submitSearch();
      await expect(target.pageCountPulldown).toBeVisible();
      // プルダウンは onchange で location 遷移する。先頭オプション以外の値を選ぶ。
      const options = await target.pageCountPulldown.locator("option").all();
      if (options.length > 1) {
        const value = await options[options.length - 1].getAttribute("value");
        await Promise.all([
          page.waitForURL(/\/event\/entry\/page\//),
          target.pageCountPulldown.selectOption(value ?? undefined),
        ]);
      }
      await expect(target.resultTable).toBeVisible();
    });

    test("E2E-M13-06-009 検索結果にソートメニュー（モード別ソートキー候補）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_ENTRIES, "SEED-M13-06-ENTRIES 未投入");
      const target = await loginAndOpenList(page);
      await target.submitSearch();
      await expect(target.sortMenu).toBeVisible();
    });

    test("E2E-M13-06-010 デッキ表示ボタン→別ウィンドウ（960x900）でデッキ表示画面が開く", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_ENTRIES, "SEED-M13-06-ENTRIES 未投入");
      const target = await loginAndOpenList(page);
      await target.submitSearch();
      await expect(target.decklistButton).toBeVisible();
      const popup = await target.openDeckListPopup();
      await expect(popup).toHaveURL(/\/event\/entry\/decklist/); // M13-08 デッキ表示画面
      // 別ウィンドウの開設（popup）まで自動検証。window.open の幅960・高さ900 の features 値は
      // ブラウザ越しに安定観測できないため、サイズ確認は手動（ケース表 期待結果・付帯表5）。
      await popup.close();
    });

    test("E2E-M13-06-011 CSVダウンロードメニューに申込CSV出力導線が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_ENTRIES, "SEED-M13-06-ENTRIES 未投入");
      const target = await loginAndOpenList(page);
      await target.submitSearch();
      await expect(target.csvMenu).toBeVisible();
      await expect(target.csvExportLink.first()).toHaveAttribute(
        "href",
        /event\/entry\/csv/
      );
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/間接・仕様乖離はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-06-017 検索条件がセッションに保持されページ送りで復元される（手動/間接: 条件一致の安定観測手順を要確認）",
      async () => {
        // 期待は仕様(データ整合性/検索条件の保持・セッション接頭辞 admin.event_entry／正本:69,316)由来。
        // セッション領域はブラウザ観測外のため、復元はページ送り後の同条件再検索結果で間接観測する。
        // 復元の確からしさは件数一致＝DB依存のため、安定したシードと観測点を実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M13-06-019 一覧初期表示は検索フォームのみ表示し結果非表示・検索条件セッション初期化（仕様乖離: 実装は初期表示で検索実行し結果表示）",
      async () => {
        // 期待は仕様(処理フロー5/DB操作 一覧初期表示・正本:78,115,277)由来。
        // /entry/list（実装は GET /{admin}/event/entry）初期表示は結果を表示せず検索条件セッションを削除する。
        // 刷新先実装は GET でも検索を実行し結果を表示・セッション保存する（付帯表4#5）。テストは仕様どおり
        // 「初期表示は一覧結果なし」を期待し実装差を検出する想定。セッション初期化はブラウザ観測外のため
        // 一覧結果の有無で間接観測する（観測点を実機確認後に E2E化）。E2E-001/003 はこの乖離を検出しない。
      }
    );

    test.fixme(
      "E2E-M13-06-018 並び順paramが不正→並び順エラー表示し初期表示（仕様乖離: 実装は黙ってDESCへ補正）",
      async () => {
        // 期待は仕様(エラー処理: 並び順不正→エラー表示し初期表示・admin.error.sort)由来。
        // 刷新先実装は不正 order を DESC へ無言補正する（付帯表4#6）。テストは仕様どおり書き、実装差を検出する想定。
        // フラッシュ領域のセレクタ確定後に E2E化（要実機確認）。
      }
    );
  }
);
