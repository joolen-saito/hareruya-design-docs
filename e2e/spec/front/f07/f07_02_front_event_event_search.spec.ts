/**
 * フロント イベント「大会詳細検索（イベント検索）」（F07-02）E2E。
 * integration_test/e2e/f07_02_front_event_event_search_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f07-02_front_event_event_search.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能はログイン不要の公開検索画面のため資格情報は不要。
 * 検索結果内容（一致/除外・件数・25件/ページ・並び順・各種フィルタ・結果→詳細遷移）はシード投入イベントに依存するため
 * test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontEventSearchPage } from "../../../pages/front/f07/f07_02_front_event_event_search.page";

test.describe("フロント > イベント > 大会詳細検索（イベント検索）", { tag: ["@front", "@event"] }, () => {
  test("E2E-F07-02-007 検索フォーム初期表示で検索用UI部品が表示される", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    await search.seeSearchForm();
  });

  test("E2E-F07-02-020 詳細条件チェックボックスの初期状態が仕様どおりである", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    // 平日/休日=初期チェック済、過去=初期未チェック（フロント挙動 節）。
    await expect(search.weekdayCheckbox).toBeChecked();
    await expect(search.holidayCheckbox).toBeChecked();
    await expect(search.pastCheckbox).not.toBeChecked();
  });

  test("E2E-F07-02-009 初期表示で日付ピッカー以外のモーダル・ポップアップ・トーストが出ない", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    await expect(search.modal).toHaveCount(0);
  });

  test("E2E-F07-02-002 未ログインで検索フォームを利用できる", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    // ログイン画面へ誘導されず検索フォームURLに留まる（公開機能）。
    await expect(page).toHaveURL(/\/events\/search(?:\?|$)/);
    await expect(search.searchButton).toBeVisible();
  });

  test("E2E-F07-02-013 検索ボタン押下で結果一覧URLへ遷移する", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    await search.fillKeyword("e2e-event");
    await search.submitSearch();
    // 0件時は404でもURLは events/list（GET送信の遷移先）。
    await search.expectOnListUrl();
  });

  test("E2E-F07-02-023 検索条件がGETクエリとして結果一覧URLに載る", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    await search.fillKeyword("e2e-keyword-xyz");
    await search.submitSearch();
    await expect(page).toHaveURL(/[?&]term=e2e-keyword-xyz/);
  });

  test("E2E-F07-02-022 件数0件となる条件ではページが見つからない（HTTP404）を返す", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    // 一致し得ない架空キーワードで直接アクセスし、0件→404 を確認する。
    const res = await search.gotoList("term=zzz-no-such-event-" + Date.now());
    expect(res?.status()).toBe(404);
  });

  test("E2E-F07-02-042 不正な日付条件はエラーにならず無視して検索を続行する", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    // Y/m/d として解釈できない値。バリデーションエラーにせず条件を無視して続行する仕様。
    await search.dateFrom.fill("not-a-date");
    await search.fillKeyword("e2e-event");
    await search.submitSearch();
    await search.expectOnListUrl();
    await expect(search.errorArea).toHaveCount(0);
  });

  test("E2E-F07-02-014 戻るボタンでイベント大会TOPへ遷移する", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoSearchForm();
    await search.backButton.click();
    await search.expectOnEventsTopUrl();
  });

  test("E2E-F07-02-021 結果一覧URLへ未ログインで直接アクセスできる", async ({ page }) => {
    const search = new FrontEventSearchPage(page);
    await search.gotoList("term=e2e-public");
    // ログイン画面へ誘導されず events/list の処理（一覧または0件時404）が動く。
    await expect(page).toHaveURL(/\/events\/list(?:\?|$)/);
  });

  // --- 要シード/要ログイン。自動化可能だが本リポ環境（シード無し）では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F07-02-025 全条件未指定でも検索が成立し既定条件で抽出される（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-057 キーワード一致イベントが結果一覧に含まれる（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-058 キーワード不一致イベントは結果一覧に含まれない（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-062 開催日時from/toで期間内の日程のみ抽出される（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-060 平日/休日条件で該当区分の日程のみ抽出される（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-063 過去未指定では現在時刻以降の日程のみ抽出される（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-070 表示区分が表示の日程のみ抽出される（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-072 フォーマット指定で該当フォーマットのみ抽出される（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-073 会場指定で該当会場のみ抽出される（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-054 存在しないフォーマット/会場IDは結果に寄与しない（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-075 ログイン済み会員でも検索結果は同一である（要: SEED-F07-02-EVENTS/会員）", async () => {});
  test.fixme("E2E-F07-02-085 検索結果一覧が開催日昇順・1ページ25件で表示される（要: SEED-F07-02-EVENTS 26件以上）", async () => {});
  test.fixme("E2E-F07-02-015 ページ送りで同一条件の指定ページが表示される（要: SEED-F07-02-EVENTS 26件以上）", async () => {});
  test.fixme("E2E-F07-02-088 ページ番号が件数を超過すると該当ページは一覧を表示しない（要: SEED-F07-02-EVENTS）", async () => {});
  test.fixme("E2E-F07-02-090 結果一覧の行からイベント詳細（F07-03）へ遷移する（要: SEED-F07-02-EVENTS）", async () => {});
});
