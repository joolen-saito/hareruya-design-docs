/**
 * 管理画面 イベント管理 > イベント申込登録検索 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m13_11_admin_event_event_entry_search_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動・間接（直接検索のJSON応答・CSRF・非同期でない時の挙動）と対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(functions/pf-eccube3/m13-11_admin_event_event_entry_search.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計源と刷新先の乖離・ケース表 付帯表4）: 設計書は pf-eccube3 / HareruyaEc プラグインのリバースであり、刷新先
 * ec-cube-enterprise では入口URL(/admin/event/entry のモーダル)・HTTPメソッド(POST→GET)・直接検索応答(JSON＋編集可能店舗ガード)・
 * 非同期でない時の分岐(欠落)が設計書と異なる。本specは実装ルートを位置情報として用いつつ、期待結果は仕様どおりに書く（乖離は落ちて検出）。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - 検索結果・決定・ページングは対象イベントデータ（SEED-M13-11-EVENTS / SEED-M13-11-MANY）が必要なため
 *    HAS_EVENTS / HAS_MANY が無いと走らないようガードする。
 *  - 直接検索のJSON応答・CSRF・非同期でない時の挙動（乖離）は test.fixme／ケース表で管理する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventEntrySearchPage } from "../../../pages/admin/m13/m13_11_admin_event_event_entry_search.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// SEED-M13-11-EVENTS（既知イベント名のイベント・日程が投入済）のとき true。
const HAS_EVENTS = process.env.SEED_M13_11_EVENTS === "1";
// SEED-M13-11-MANY（既定表示件数10件超に一致する日程）のとき true。
const HAS_MANY = process.env.SEED_M13_11_MANY === "1";
// 既知イベント名の一部（検索に確実にヒットする語）。
const KNOWN_EVENT_NAME = process.env.SEED_M13_11_EVENT_NAME || "";
// 既知イベント名の複数語（スペース区切り・全語が同一イベント名に含まれる）。
const KNOWN_EVENT_NAME_MULTI = process.env.SEED_M13_11_EVENT_NAME_MULTI || "";
// 開始日条件用の日付。日程以前(合致)＝過去日、日程より後(非合致)＝未来日で代表する。
const PAST_DATE = "2000-01-01";
const FUTURE_DATE = "2999-01-01";

const LOGIN_RE = /\/login(\?|$)/;

// 検索非該当時の0件表示は設計書「条件に合致するデータ」由来のふるまい観測に用いる。
const NO_RESULT = "検索条件に合致するデータが見つかりませんでした";
// 注: プレースホルダ文言・モーダルタイトル文言・日付範囲エラー文言は実装(messages.ja.yaml)由来のため
// 期待値として固定しない（オラクル混入回避）。表示の有無/エラー発生の有無のみを観測する。

/** 管理ログインして申込一覧画面を開き、検索モーダルを開く。 */
async function loginAndOpenModal(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE);
  const target = new EventEventEntrySearchPage(page);
  await target.goto();
  await target.openModal();
  return target;
}

test.describe(
  "管理画面 イベント管理 > イベント申込登録検索",
  { tag: ["@admin", "@event", "@entry"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M13-11-030 未ログインで申込一覧URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M13-11-031 未ログインで検索結果HTMLエンドポイント直接→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry/search_event`);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M13-11-032 未ログインで直接検索POSTエンドポイントはアクセス不可（ログイン誘導/認可拒否）", async ({ page }) => {
      // 期待は仕様(権限・認可: 未認証はアクセス不可)由来。実装の応答コード/文言には依存しない。
      // 未ログインPOSTは管理ログインへ誘導(3xx)または認可拒否(4xx)となり、成功(2xx)しないことのみ観測する。
      const resp = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/event/entry/search_event/set`,
        { maxRedirects: 0, failOnStatusCode: false }
      );
      expect(resp.status()).toBeGreaterThanOrEqual(300);
    });

    // ===== ログインのみで実行可（非破壊・参照） =====

    test("E2E-M13-11-001 検索モーダルに検索フォーム（イベント名/開催日）と検索ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenModal(page);
      await target.seeSearchForm();
    });

    test("E2E-M13-11-002 モーダルのイベント名欄に入力ヒント（プレースホルダ属性）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenModal(page);
      // 具体文言は実装由来のため固定しない。キーワード入力ヒント(placeholder属性)が存在すること(空でない)のみ観測。
      await expect(target.eventName).toHaveAttribute("placeholder", /.+/);
    });

    test("E2E-M13-11-003 モーダル見出し（タイトル）が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenModal(page);
      // タイトル文言は実装由来のため固定しない。モーダル見出しが表示され空でないことのみ観測。
      await expect(target.modalTitle).toBeVisible();
      await expect(target.modalTitle).not.toBeEmpty();
    });

    test("E2E-M13-11-011 一致しないキーワードで検索→0件メッセージが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenModal(page);
      // 実在しない語で確実に0件化する。
      await target.searchByEventName("___no_match_zzz_" + Date.now());
      await expect(target.resultList).toContainText(NO_RESULT);
    });

    test("E2E-M13-11-020 開催日From>Toで日付範囲エラーが表示され結果一覧が出ない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenModal(page);
      // From を To より後にして相関エラー（範囲指定 From≦To）を誘発する。
      await target.searchByDateRange("2025-12-31", "2025-01-01");
      // 期待は「入力エラーが表示され結果一覧が出ない」。エラー文言は実装由来のため固定しない（オラクル混入回避）。
      // 注: 開催日の範囲・相関自体が実装由来の可能性（設計の入力は「開始日」単一）＝ケース表 付帯表4#4 要確認。
      await expect(target.formError).toBeVisible();
      await expect(target.resultTableHeader).toHaveCount(0);
    });

    test("E2E-M13-11-021 検索条件未入力でも検索が実行され一覧/0件が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      const target = await loginAndOpenModal(page);
      // 検索条件は全任意。未入力でもエラーにならず検索が成立する。
      await target.searchWithoutConditions();
      await target.seeResultOrEmpty();
    });

    // ===== シード（SEED-M13-11-EVENTS / MANY）が要るケース =====

    test("E2E-M13-11-010 キーワードで検索→一致イベントがモーダル一覧に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EVENTS, "SEED-M13-11-EVENTS 未投入（SEED_M13_11_EVENTS=1）");
      test.skip(!KNOWN_EVENT_NAME, "SEED_M13_11_EVENT_NAME（既知イベント名の一部語）未設定");
      const target = await loginAndOpenModal(page);
      await target.searchByEventName(KNOWN_EVENT_NAME);
      await target.seeResultList();
      // 設計(条件一致イベントをモーダル一覧表示)。検索語に一致した対象イベントが結果一覧に含まれること。
      await expect(target.resultList).toContainText(KNOWN_EVENT_NAME);
      await expect(target.decisionButtons.first()).toBeVisible();
    });

    test("E2E-M13-11-015 複数語キーワードで検索→全語に合致するイベントが一覧に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EVENTS, "SEED-M13-11-EVENTS 未投入");
      test.skip(
        !KNOWN_EVENT_NAME_MULTI,
        "SEED_M13_11_EVENT_NAME_MULTI（複数語）未設定"
      );
      const target = await loginAndOpenModal(page);
      // 設計「検索条件＝キーワード（複数語）」。スペース区切りの複数語で各語に合致するイベントを取得。
      await target.searchByEventName(KNOWN_EVENT_NAME_MULTI);
      await target.seeResultList();
      // 結果一覧に各語が現れることを確認（語ごとの含有を観測）。
      for (const word of KNOWN_EVENT_NAME_MULTI.split(/\s+/).filter(Boolean)) {
        await expect(target.resultList).toContainText(word);
      }
    });

    test("E2E-M13-11-016 開始日(From)条件に合致する日程のイベントが検索結果に表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EVENTS, "SEED-M13-11-EVENTS 未投入");
      test.skip(!KNOWN_EVENT_NAME, "SEED_M13_11_EVENT_NAME 未設定");
      const target = await loginAndOpenModal(page);
      // 開始日Fromを十分過去にし、既知イベントの日程が条件に合致する正常系（016と017は対）。
      await target.searchByNameAndStartDate(KNOWN_EVENT_NAME, PAST_DATE);
      await target.seeResultList();
      await expect(target.resultList).toContainText(KNOWN_EVENT_NAME);
    });

    test("E2E-M13-11-017 開始日(From)が日程より後だと該当イベントが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EVENTS, "SEED-M13-11-EVENTS 未投入");
      test.skip(!KNOWN_EVENT_NAME, "SEED_M13_11_EVENT_NAME 未設定");
      const target = await loginAndOpenModal(page);
      // 開始日Fromを未来にし、既知イベントの日程が条件に合致しない異常系（016と対）。
      await target.searchByNameAndStartDate(KNOWN_EVENT_NAME, FUTURE_DATE);
      // 該当イベントが結果一覧に現れないこと（0件メッセージ or 該当行非表示）。
      await expect(target.resultTableHeader).toHaveCount(0);
    });

    test("E2E-M13-11-012 イベント検索で画面遷移せずモーダル内に結果が反映される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EVENTS, "SEED-M13-11-EVENTS 未投入");
      test.skip(!KNOWN_EVENT_NAME, "SEED_M13_11_EVENT_NAME 未設定");
      const target = await loginAndOpenModal(page);
      await target.searchByEventName(KNOWN_EVENT_NAME);
      // 画面遷移せず（申込一覧URLのまま）モーダル内の結果が更新される。
      await expect(page).toHaveURL(/\/event\/entry(\?|$)/);
      await target.seeResultList();
    });

    test("E2E-M13-11-014 結果一覧の「決定」で指定イベント1件が申込フォームに反映される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_EVENTS, "SEED-M13-11-EVENTS 未投入");
      test.skip(!KNOWN_EVENT_NAME, "SEED_M13_11_EVENT_NAME 未設定");
      const target = await loginAndOpenModal(page);
      await target.searchByEventName(KNOWN_EVENT_NAME);
      await target.seeResultList();
      await target.clickFirstDecision();
      // 直接検索＝指定イベント1件取得。申込フォームのイベント名欄(#admin_search_event_event_name)に
      // 検索語を含むイベント名が反映され、モーダルが閉じる（設計: 指定イベント1件を反映）。
      const reflected = await page
        .locator("#admin_search_event_event_name")
        .inputValue();
      expect(reflected).toContain(KNOWN_EVENT_NAME);
      await expect(target.modal).not.toBeVisible();
    });

    test("E2E-M13-11-013 検索結果が既定件数超のときページャで次ページへ送れる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!HAS_MANY, "SEED-M13-11-MANY（既定件数10件超）未投入（SEED_M13_11_MANY=1）");
      test.skip(!KNOWN_EVENT_NAME, "SEED_M13_11_EVENT_NAME 未設定");
      const target = await loginAndOpenModal(page);
      await target.searchByEventName(KNOWN_EVENT_NAME);
      await expect(target.pager).toBeVisible();
      // 既定の表示件数でページ送り。ページャの別ページリンクを押下し、指定ページの結果一覧が表示される。
      // 要確認: 「次ページ」リンクの厳密な特定子（次/最終の区別）・指定ページ番号の検証は要実機確認（ケース表 付帯表1 E2E-013補足）。
      await target.pager.locator("a.page-link").last().click();
      await target.seeResultList();
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/間接・仕様乖離はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-11-040 存在しないイベントIDの直接検索は申込フォームに反映されない（手動/間接: JSON 404 応答の安定観測手順を要確認）",
      async () => {
        // 期待は仕様(直接検索＝指定IDで1件取得・不存在は取得不可)由来。
        // 刷新先は POST /event/entry/search_event/set が JSON 404(message='not found')を返す(EntryController.php:469-471)。
        // CSRFトークン取得とAPI直叩き/UI操作のどちらで安定観測するか実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M13-11-041 非同期でないリクエストでは空の結果でモーダル枠のみ表示（仕様乖離: 刷新先は常にHTML断片を返す）",
      async () => {
        // 期待は仕様(エラー処理: 非同期でないリクエスト→空の結果でモーダル枠のみ表示)由来。
        // 刷新先の entryEventHtml は isXmlHttpRequest ガードを持たず常に結果断片を描画する(EntryController.php:381-449・付帯表4#3)。
        // テストは仕様どおり書き、実装差を落ちて検出する想定。観測点を実機確認後に E2E化。
      }
    );

    test.fixme(
      "E2E-M13-11-042 直接検索はCSRFトークン不正だと拒否される（手動/間接: JSON 403 応答）",
      async () => {
        // 期待は仕様(CSRF)由来。刷新先は POST /event/entry/search_event/set で CSRF 不正時に
        // admin.common.csrf_invalid を JSON 403 で返す(EntryController.php:457-460 / messages.ja.yaml:3941)。
        // トークン改ざんの注入手順を実機確認後に実装。
      }
    );
  }
);
