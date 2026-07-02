/**
 * 管理画面 イベント管理 > イベント一覧検索 E2E。
 * 納品ケース表 integration_test/e2e/m13_01_admin_event_event_search_list_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケース（実装済み）と、自動化予定だが未実装/要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動/要確認（JS読込内部・最終ページ補正の間接確認）と対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 * 期待結果は仕様（正本 functions/pf-eccube3/m13-01_admin_event_event_search_list.md / 観点表）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計源と刷新先の乖離・付帯表4）: 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise は
 *  - 入口が GET/POST /event（admin_event_index）で、GET時に一覧を表示（設計の /event/list 初期表示=結果非表示 と乖離 #1）。
 *  - 会場(MtbVenue)検索が無く店舗(base_info)へ置換（#2/#3）／イベント名にLength制約なし（#9）／開催日にdate_range_error追加（#8）。
 *  - 件数・0件メッセージ文言差（#4/#5）。テストは主観測（一覧の有無・遷移URL・件数包含）で文言差の影響を避けつつ仕様どおりに書く。
 * 当該乖離に該当する spec ケース（002/060/061/062/063）は test.fixme で残し、要確認として可視化する（自動カバー済みではない）。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針:
 *  - ログインが要るケースは ECCUBE_ADMIN_USER/PASS（config/default.config.ts）が無いと走らないよう test.skip でガード。
 *  - 一覧/検索結果の出現には対象イベントのシードが必要（SEED-M13-EVENTS / -MANY / -EVENT-DELETABLE）。SEED_M13_EVENTS=1 でガード解除。
 *  - 本機能は参照系（検索）。削除実行・編集本体は M13-02 委譲のため、ここでは遷移到達・確認ダイアログ表示までを観測する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventSearchListPage } from "../../../pages/admin/m13/m13_01_admin_event_event_search_list.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 対象イベントが投入済みのとき true（検索結果一覧が描画される前提）。
const HAS_EVENTS = process.env.SEED_M13_EVENTS === "1";
// 既知イベントのイベント名キーワード（シード由来。環境変数で供給し、無ければ走らせない）。
const EVENT_KEYWORD = process.env.SEED_M13_EVENT_KEYWORD || "";

const LOGIN_RE = /\/login(\?|$)/;
const EVENT_LIST_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event(\\?|$|/page)`);
const EVENT_CREATE_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/create(\\?|$)`);
const EVENT_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/\\d+/edit(\\?|$)`);

/** 管理者ログインしてイベント一覧を閲覧できる状態にする（SEED-M13-ADMIN は2FA OFF前提）。 */
async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  await expect(page).not.toHaveURL(LOGIN_RE); // ログイン成功でログイン画面から離脱
}

test.describe("管理画面 > イベント一覧検索", { tag: ["@admin", "@event"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M13-01-050 未ログインでイベント一覧URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event`);
    await expect(page.locator("#login_id")).toBeVisible(); // 権限・認可: 未ログインはログイン誘導
  });

  // ===== ログイン要・非破壊（SEED-M13-ADMIN） =====

  test("E2E-M13-01-001 イベント一覧画面に検索フォームの入力欄と検索ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（SEED-M13-ADMIN）");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.seeSearchForm(); // フロント挙動（表示要素）。会場欄は刷新先に無く002で要確認（付帯表4#2）
  });

  test("E2E-M13-01-051 ログイン済みでイベント一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await expect(list.searchForm).toBeVisible();
    await expect(page.locator("body")).toContainText("イベント一覧"); // 見出し（admin.event.event_list）
  });

  test("E2E-M13-01-030 新規作成ボタンでイベント登録画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.createButton.click();
    await expect(page).toHaveURL(EVENT_CREATE_RE); // M13-02 登録画面へ遷移
  });

  test("E2E-M13-01-015 全条件未入力で検索してもエラーにならず一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.submitSearch(); // 各入力は任意（必須なし）
    await expect(page).toHaveURL(EVENT_LIST_RE); // 検索が実行され一覧画面に留まる
    await expect(list.searchForm).toBeVisible();
  });

  test("E2E-M13-01-020 該当しない条件で検索すると一覧が表示されない（0件）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    // どのイベントにも一致しないキーワード（衝突回避のため一意な文字列）。
    await list.searchByKeyword("__no_such_event_zzz_8f3a__");
    // 主観測: 一覧テーブルに行が出ないこと（0件メッセージ文言差は付帯表4#5）。
    await expect(list.resultRows()).toHaveCount(0);
  });

  // ===== ログイン要・要シード（SEED-M13-EVENTS） =====

  test("E2E-M13-01-010 イベント名キーワードで検索すると該当イベントが一覧に表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS || !EVENT_KEYWORD, "SEED-M13-EVENTS / SEED_M13_EVENT_KEYWORD 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword(EVENT_KEYWORD);
    // 仕様「該当イベントの行（イベントID・イベント名）が一覧に表示される」。単なる行可視ではなく、
    // 検索語（イベント名）を含む行が存在することで抽出結果（部分一致ヒット）を検証する。
    await expect(list.resultRowsContaining(EVENT_KEYWORD).first()).toBeVisible();
  });

  test("E2E-M13-01-011 検索結果が1件以上のとき該当件数が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS || !EVENT_KEYWORD, "SEED-M13-EVENTS / SEED_M13_EVENT_KEYWORD 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword(EVENT_KEYWORD);
    // 仕様「検索結果 N件が該当しました」。刷新先の「：%count%件が該当しました」とも一致する包含で判定（付帯表4#4）。
    await expect(list.countMessage).toContainText("件が該当しました");
    // 仕様「件数は整数で表示」。件数部が整数であることを検証（表示形式オラクル）。
    await expect(list.countMessage).toHaveText(/\d+\s*件が該当しました/);
  });

  test("E2E-M13-01-012 開催日From/Toで絞り込むと範囲内のイベントが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(
      !HAS_EVENTS || !process.env.SEED_M13_EVENT_DATE_FROM || !process.env.SEED_M13_EVENT_DATE_TO,
      "SEED-M13-EVENTS / SEED_M13_EVENT_DATE_FROM・TO 未設定"
    );
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByStartDateRange(
      process.env.SEED_M13_EVENT_DATE_FROM as string,
      process.env.SEED_M13_EVENT_DATE_TO as string
    );
    await expect(list.resultRows().first()).toBeVisible(); // 範囲内イベント行が表示される
  });

  test("E2E-M13-01-013 フォーマットで絞り込むと該当イベントが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS, "SEED-M13-EVENTS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    // 先頭の実選択肢（指定なし以外）を選択。シードのフォーマットに紐づくイベントが出る前提。
    await list.formats.selectOption({ index: 1 });
    await list.submitSearch();
    await expect(page).toHaveURL(EVENT_LIST_RE);
    await expect(list.resultTable).toBeVisible(); // 該当フォーマットのイベント行が表示される
  });

  test("E2E-M13-01-014 ルール適用度で絞り込むと該当イベントが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS, "SEED-M13-EVENTS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.rel.selectOption({ index: 1 }); // 指定なし以外
    await list.submitSearch();
    await expect(page).toHaveURL(EVENT_LIST_RE);
    await expect(list.resultTable).toBeVisible(); // 該当ルール適用度のイベント行が表示される
  });

  test("E2E-M13-01-031 一覧行の編集リンクでイベント編集画面へ遷移する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS || !EVENT_KEYWORD, "SEED-M13-EVENTS / SEED_M13_EVENT_KEYWORD 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword(EVENT_KEYWORD);
    // 一覧行のイベント名リンク（href admin_event_edit）。
    await list.resultRows().first().getByRole("link").first().click();
    await expect(page).toHaveURL(EVENT_EDIT_RE); // M13-02 編集画面へ遷移
  });

  test("E2E-M13-01-042 ソート（イベント名）を変更すると並び替えて再表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS || !EVENT_KEYWORD, "SEED-M13-EVENTS / SEED_M13_EVENT_KEYWORD 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword(EVENT_KEYWORD);
    await list.sortByPulldown.selectOption("eventName"); // ソートキーをイベント名へ（onchangeで再送信）
    await expect(page).toHaveURL(EVENT_LIST_RE);
    await expect(list.resultRows().first()).toBeVisible(); // 並び替え後も一覧が表示される
  });

  test("E2E-M13-01-032 削除操作で確認ダイアログが表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const deletableName = process.env.SEED_M13_EVENT_DELETABLE_NAME || "";
    test.skip(
      process.env.SEED_M13_EVENT_DELETABLE !== "1" || !deletableName,
      "SEED-M13-EVENT-DELETABLE / SEED_M13_EVENT_DELETABLE_NAME 未設定（日程なし・削除可イベント）"
    );
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    // 削除対象を名前で検索して特定（先頭行任せにせず、削除可イベント行を狙う）。
    await list.searchByKeyword(deletableName);
    await list.openDeleteForEvent(deletableName);
    // 確認文（仕様「このイベント情報を削除してもよろしいですか？」＝admin.event.delete.confirm）。
    await expect(page.locator("body")).toContainText(
      "このイベント情報を削除してもよろしいですか？"
    );
  });

  test("E2E-M13-01-016 イベント名の複数語はAND条件で各語を含む行が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const kw = process.env.SEED_M13_EVENT_KEYWORDS || "";
    test.skip(
      !HAS_EVENTS || !kw.trim().includes(" "),
      "SEED-M13-EVENTS / SEED_M13_EVENT_KEYWORDS（空白区切り2語）未設定"
    );
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword(kw);
    // 仕様(md:141): 各語をANDで結ぶ。全語を含む行が存在することで語ごとANDを検証（略称/英名列の扱いは付帯表4#11）。
    const words = kw.trim().split(/\s+/);
    await expect(list.resultRowsContainingAll(words).first()).toBeVisible();
  });

  test("E2E-M13-01-017 イベント名に空白・カンマのみを入力してもエラーにならず検索が継続する", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS, "SEED-M13-EVENTS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword("  ,　,  "); // 半角/全角空白・カンマのみ
    await expect(page).toHaveURL(EVENT_LIST_RE);
    // 仕様(md:168): 分割後の各語が空＝イベント名条件を追加しない。検索は継続（バリデーションエラーにならない）。
    await expect(list.searchForm).toBeVisible();
    await expect(list.resultTable.or(list.emptyMessage)).toBeVisible();
  });

  test("E2E-M13-01-018 開催日Toに当日を指定すると当日のイベントが範囲に含まれる（To当日包含境界）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const d = process.env.SEED_M13_EVENT_DATE_EXACT || "";
    test.skip(!HAS_EVENTS || !d, "SEED-M13-EVENTS / SEED_M13_EVENT_DATE_EXACT 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByStartDateRange(d, d); // From=To=開催日。仕様(md:143): Toは指定日+1日未満＝当日を含む
    await expect(list.resultRows().first()).toBeVisible();
  });

  test("E2E-M13-01-019 開催日条件を指定すると開催日程のないイベントは一覧から除外される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    const name = process.env.SEED_M13_EVENT_DELETABLE_NAME || "";
    test.skip(
      process.env.SEED_M13_EVENT_DELETABLE !== "1" || !name,
      "SEED-M13-EVENT-DELETABLE（日程なしイベント）/ SEED_M13_EVENT_DELETABLE_NAME 未設定"
    );
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    // 広い開催日範囲を指定。仕様(md:170): 詳細(開催日程)の無いイベントは開催日条件に一致せず除外。
    await list.searchByStartDateRange("1900-01-01", "2999-12-31");
    await expect(list.resultRowsContaining(name)).toHaveCount(0);
  });

  test("E2E-M13-01-021 既定ソート（指定なし）ではイベントID降順で一覧が並ぶ", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS || !EVENT_KEYWORD, "SEED-M13-EVENTS / SEED_M13_EVENT_KEYWORD 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword(EVENT_KEYWORD); // ソート未変更＝既定(default=イベントID, DESC md:148)
    const ids = await list.rowEventIds();
    test.skip(ids.length < 2, "並び検証には2件以上の該当イベントが必要");
    const sorted = [...ids].sort((a, b) => b - a);
    expect(ids).toEqual(sorted); // 仕様(md:148): 既定ソートキー=イベントID・並び順DESC
  });

  test("E2E-M13-01-022 開催日範囲に該当が無いと0件になる（開催日条件の非該当）", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(!HAS_EVENTS, "SEED-M13-EVENTS 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByStartDateRange("2999-01-01", "2999-12-31"); // どのイベントも該当しない未来範囲
    await expect(list.resultRows()).toHaveCount(0); // 開催日条件の非該当で0件
  });

  // ===== ログイン要・要シード（SEED-M13-EVENTS-MANY：2ページ以上） =====

  test("E2E-M13-01-040 表示件数を変更すると指定件数で一覧が再表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(process.env.SEED_M13_EVENTS_MANY !== "1", "SEED-M13-EVENTS-MANY 未設定（多数イベント）");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.submitSearch();
    // 表示件数プルダウンはoptionのvalueが遷移先URL（admin_event_index_page, page_count付き）。
    const firstValue = await list.pageCountPulldown
      .locator("option")
      .nth(1)
      .getAttribute("value");
    test.skip(!firstValue, "表示件数の選択肢が取得できない");
    await list.pageCountPulldown.selectOption(firstValue as string);
    await expect(page).toHaveURL(EVENT_LIST_RE); // 指定件数で再描画
    await expect(list.resultTable).toBeVisible();
  });

  test("E2E-M13-01-041 ページ送りで次ページの一覧が表示される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(process.env.SEED_M13_EVENTS_MANY !== "1", "SEED-M13-EVENTS-MANY 未設定");
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.submitSearch();
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/page/2`); // 2ページ目（セッション条件を復元して再検索）
    await expect(list.resultTable).toBeVisible(); // 2ページ目の一覧が表示される
  });

  test("E2E-M13-01-043 検索条件がセッション保持されページ送り後も復元される", async ({ page }) => {
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    test.skip(
      process.env.SEED_M13_EVENTS_MANY !== "1" || !EVENT_KEYWORD,
      "SEED-M13-EVENTS-MANY / SEED_M13_EVENT_KEYWORD 未設定"
    );
    await login(page);
    const list = new EventEventSearchListPage(page);
    await list.goto();
    await list.searchByKeyword(EVENT_KEYWORD);
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/page/2`); // ページ送り
    // セッションの検索条件が復元され、絞り込み結果（一覧）が表示される。
    await expect(list.resultTable).toBeVisible();
    // 検索語が維持された結果であること（2ページ目も該当キーワードを含む行で構成される）。
    await expect(list.resultRowsContaining(EVENT_KEYWORD).first()).toBeVisible();
  });

  // ===== 自動化予定だが要確認（刷新先乖離・付帯表4）。fixme で残し可視化 =====

  test.fixme(
    "E2E-M13-01-002 検索ボックスに会場(MtbVenue)セレクトが表示される（刷新先は店舗に置換・付帯表4#2/#3）",
    async () => {
      // 期待は仕様（フロント挙動: 会場セレクト表示）由来。刷新先 SearchEventType に venue が無く、
      // 創作セレクタを置かない。移行設計で会場検索の扱いが確定後に E2E化 または 対象外 を判断する。
    }
  );

  test.fixme(
    "E2E-M13-01-060 並び順が不正なとき並び順エラーを表示し初期表示へ戻す（刷新先に自由order経路なし・付帯表4#7）",
    async () => {
      // 期待は仕様（エラー処理: admin.error.sort）由来。刷新先はソートがhidden+pulldown(DESC固定)で観測経路が無い。
    }
  );

  test.fixme(
    "E2E-M13-01-061 一覧初期表示では検索結果を表示しない（刷新先はGET /event で一覧表示・付帯表4#1）",
    async () => {
      // 期待は仕様（処理フロー: 初期表示は結果非表示）由来。刷新先は初期表示専用ルートが無くGETで結果表示。
    }
  );

  test.fixme(
    "E2E-M13-01-062 イベント名に最大長(50)超過を入力するとエラーになる（刷新先のmultiにLength制約なし・付帯表4#9）",
    async () => {
      // 期待は仕様（バリデーション: 最大長stext_len=50）由来。刷新先はLength制約が無く観測不可。
    }
  );

  test.fixme(
    "E2E-M13-01-063 開催日From>Toでも範囲整合検証せず0件（刷新先はdate_range_errorを表示・付帯表4#8）",
    async () => {
      // 期待は仕様（エッジケース: 範囲整合の検証は行わない）由来。刷新先はPOST_SUBMITで範囲エラーを追加表示。
    }
  );

  test.fixme(
    "E2E-M13-01-003 会場(MtbVenue)で絞り込むと該当イベントが表示される（刷新先に会場検索なし・付帯表4#2）",
    async () => {
      // 期待は仕様（業務ルール: e.venue一致で絞り込み md:146）由来。刷新先 SearchEventType に venue が無く店舗(base_info)へ置換。創作セレクタを置かない。
    }
  );

  test.fixme(
    "E2E-M13-01-044 表示件数(page_count)に不正値を与えても採用されず既定/セッション値で表示する（刷新先は任意値入力経路なし・付帯表4#6相当）",
    async () => {
      // 期待は仕様（処理フロー: page_countがマスタ存在値のみ採用 md:114）由来。刷新先はプルダウンvalue遷移で任意値入力経路が無く要実機確認。
    }
  );

  test.fixme(
    "E2E-M13-01-064 イベント名が最大長(50)ちょうどはエラーにならず検索できる（正常境界・刷新先Length制約なし・付帯表4#9）",
    async () => {
      // 期待は仕様（バリデーション: 最大長stext_len=50 md:233）由来。062(51文字エラー)の正常側の対。刷新先はLength制約が無く常に通るため要確認。
    }
  );
});
