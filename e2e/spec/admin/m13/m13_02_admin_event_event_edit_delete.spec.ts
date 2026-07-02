/**
 * 管理画面 イベント編集/削除 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m13_02_admin_event_event_edit_delete_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」（実装済み）と、自動化予定だが未実装/要実機・仕様乖離検出の test.fixme のみを残す。
 * 手動/間接（永続値の厳密検証・申込/デッキシード前提）と対象外はケース表で全量管理し、specに大量のfixmeを残さない。
 * 期待結果は仕様(m13-02_admin_event_event_edit_delete.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要(仕様乖離): 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise では
 *  - 更新POST は設計の /event/{id}/create ではなく /event/{id}/edit（EventController.php:194）
 *  - 新規表示は /event/new ではなく /event/create（:154）
 *  - 略称/店舗shop_id/チーム人数/備考detail が base_info/eventScale/isTeamBattle/freeTextArea* に再編
 *  - 検証失敗時の挙動は「インラインエラー＋編集テンプレ再描画」（save_error フラッシュは例外時のみ。設計の登録失敗フラッシュとは乖離）
 *  - 日程残イベントの削除はモーダル側で削除ボタンを disabled 化（サーバ側も schedule_exists で拒否）
 * いずれも付帯表4で管理し、テストは仕様どおりの観測（更新成功/削除可否/検証失敗で滞留）を期待する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・two_factor_auth.spec.ts も @playwright/test を直接使う。本specもこれに倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行ゲート（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（管理者ログイン）= HAS_CREDS
 *  - EVENT_ID            : 既存イベント（編集表示/更新/検証/削除モーダル表示に使用。店舗が編集可能なもの）
 *  - 破壊系（削除成功・日程一括削除・支払方法変更不可）は専用シード/申込・デッキ前提のため test.fixme で保留
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventEditDeletePage } from "../../../pages/admin/m13/m13_02_admin_event_event_edit_delete.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
const EVENT_ID = process.env.EVENT_ID || "";
const HAS_EVENT = HAS_CREDS && !!EVENT_ID;

// 仕様由来の表示文言（messages.ja.yaml）。実装に合わせて変えない（オラクル独立性）。
const SUBTITLE_EDIT = "イベント編集"; // admin.event.event_edit :5551
const SUBTITLE_NEW = "イベント登録"; // admin.event.event_new :5550
const DELETE_NOT_SCHEDULE = "日程情報が登録されているため削除できません"; // admin.event.delete.not.schedule_exists :5717

const EDIT_RE = /\/event\/\d+\/edit(\?|$)/;
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe("管理画面 > イベント編集/削除", { tag: ["@admin", "@event"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M13-02-060 未ログインで編集URL直接→管理ログイン画面へ誘導", async ({ page }) => {
    // 期待は仕様(権限・認可: 未ログインは管理画面共通のログイン誘導)由来。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/1/edit`);
    await expect(page.locator("#login_id")).toBeVisible();
    await expect(page).toHaveURL(LOGIN_RE);
  });

  // ===== 編集/新規 表示（HAS_CREDS / EVENT_ID） =====

  test("E2E-M13-02-001 編集画面表示: 入力フォームと開催日程一覧が表示される", async ({ page }) => {
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    await expect(page).toHaveURL(EDIT_RE);
    await expect(page.locator("body")).toContainText(SUBTITLE_EDIT); // サブタイトル「イベント編集」
    await ev.seeEditForm();
    await expect(ev.scheduleListHeading.first()).toBeVisible(); // 開催日程一覧（設計「表示要素」）
  });

  test("E2E-M13-02-002 新規登録画面表示: 空フォームとサブタイトル「イベント登録」が表示される", async ({ page }) => {
    // 設計は /event/new だが刷新先は /event/create（付帯表4#2）。期待は仕様(新規は空フォーム表示)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoCreate();
    await expect(page.locator("body")).toContainText(SUBTITLE_NEW);
    await expect(ev.nameJp).toBeVisible();
    await expect(ev.nameJp).toHaveValue(""); // 新規は空
    // 設計「新規時は支払方法にクレジットカードを初期選択する」(処理フロー/業務ルール)由来のオラクル。
    // 実装が初期選択を設定しなければ落ちて検出する（付帯表4参照）。
    await expect(ev.paymentCredit).toBeChecked();
  });

  test("E2E-M13-02-013 新規登録 必須未入力で送信→検証エラーで新規画面に滞留", async ({ page }) => {
    // 期待は仕様(処理フロー 新規登録#2: 検証失敗→登録失敗エラーを表示し再描画)由来。
    // 非破壊（検証失敗で永続化前に弾かれる）ため常時自動実行可。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoCreate();
    await ev.nameJp.fill(""); // 必須未入力
    await ev.submit();
    await expect(page).not.toHaveURL(EDIT_RE); // 登録イベントの編集画面へは遷移しない（滞留）
    await expect(ev.fieldError.first()).toBeVisible(); // 検証エラー表示
  });

  test("E2E-M13-02-003 編集画面: イベント情報フォームの主要入力部品が表示される", async ({ page }) => {
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    await ev.seeEditForm(); // イベント名・フォーマット・公開状態・定員・参加費・登録ボタン
  });

  // ===== イベント更新（判定順序#3,#4） =====

  test("E2E-M13-02-010 更新成功: イベント名(日)を変更し送信→成功メッセージで編集画面へ", async ({ page }) => {
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    const newName = `E2E更新_${Date.now()}`;
    await ev.nameJp.fill(newName);
    await ev.submit();
    await expect(page).toHaveURL(EDIT_RE); // 更新成功→編集画面へリダイレクト
    await expect(ev.alert).toBeVisible(); // 成功フラッシュ（文言は付帯表4#3: 設計「イベント情報を登録しました。」vs 実装「保存しました」要確認）
    await expect(ev.nameJp).toHaveValue(newName); // 更新値が再描画に反映（間接DB確認）
  });

  test("E2E-M13-02-020 必須未入力: イベント名(日)を空で送信→検証エラーで編集画面に滞留", async ({ page }) => {
    // 期待は仕様(判定順序#3: フォーム検証失敗→編集テンプレ再描画・永続化しない)由来。
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    await ev.nameJp.fill("");
    await ev.submit();
    await expect(page).toHaveURL(EDIT_RE); // 編集画面に滞留（一覧へ遷移しない）
    await expect(ev.fieldError.first()).toBeVisible(); // 入力欄の検証エラー表示
  });

  test("E2E-M13-02-022 バナーURLに admin.hareruyamtg.com を含む→検証エラーで滞留", async ({ page }) => {
    // 期待は仕様(エッジケース: バナーURLに admin.hareruyamtg.com を含むと検証エラー)由来。
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    await ev.bannerUrl.fill("https://admin.hareruyamtg.com/banner.png");
    await ev.submit();
    await expect(page).toHaveURL(EDIT_RE); // 滞留
    await expect(ev.fieldError.first()).toBeVisible(); // 検証エラー（メッセージキー admin.banner.regex_error 欠落は付帯表4#5）
  });

  test("E2E-M13-02-023 定員に最小未満(0)を入力→検証エラーで滞留", async ({ page }) => {
    // 期待は仕様(定員 最小1)由来。境界外(0)は検証エラー。
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    await ev.capacity.fill("0");
    await ev.submit();
    await expect(page).toHaveURL(EDIT_RE); // 滞留
    await expect(ev.fieldError.first()).toBeVisible();
  });

  // ===== 削除（判定順序） =====

  test("E2E-M13-02-042 削除確認モーダル表示: 削除リンク押下で確認ダイアログが開く", async ({ page }) => {
    // 期待は仕様(モーダル・ポップアップ: 削除リンクは確認ダイアログを経て送信)由来。
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    await ev.openDeleteModal();
    await expect(page.locator(`#event_delete_${EVENT_ID}`)).toBeVisible();
  });

  test("E2E-M13-02-061 存在しないIDの編集→404", async ({ page }) => {
    // 期待は仕様(利用者視点の入口: 存在しないIDは404)由来。
    test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
    await login(page);
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/999999999/edit`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M13-02-070 戻るリンクでイベント一覧へ遷移する", async ({ page }) => {
    // 期待は仕様(画面遷移: 戻る→イベント一覧)由来。
    test.skip(!HAS_EVENT, "HAS_CREDS かつ EVENT_ID 未設定");
    await login(page);
    const ev = new EventEventEditDeletePage(page);
    await ev.gotoEdit(EVENT_ID);
    await ev.backToList.first().click();
    await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event(\\?|$)`)); // 検索結果(一覧)へ
  });

  // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M13-02-021 イベント名(日)最大長+1で検証エラー（要確認: 上限が設計255 vs 移行先155 で乖離・付帯表4#4）",
    async () => {
      // 期待は仕様(文字列長バリデーション)由来だが、最大長の正値が設計(255)と移行先DB(155)で食い違うため実機で上限確定後に実装。
    }
  );

  test.fixme(
    "E2E-M13-02-030 申込済みで支払方法を変更不可（要: 申込シード）。設計は変更不可エラー＋referer、実装はpayments無効化/オンライン有料日程条件（付帯表4#6）",
    async () => {
      // 期待は仕様(更新時判定順序#2: 申込済みで支払方法差分→変更不可エラー・永続化しない)由来。申込ありイベントのシード後に実装。
    }
  );

  test.fixme(
    "E2E-M13-02-040 日程なしイベントの削除成功→成功メッセージで一覧へ遷移（破壊的・専用使い捨てイベント要）",
    async () => {
      // 期待は仕様(削除判定順序#4: 削除実行→完了メッセージ→検索結果ページ)由来。日程ゼロの専用イベント投入後に実装。
    }
  );

  test.fixme(
    "E2E-M13-02-041 日程が残るイベントの削除不可（要: 日程ありイベントのシード）。モーダルに日程残メッセージ＋削除ボタン無効",
    async () => {
      // 期待は仕様(削除判定順序#3: 日程残→削除不可)由来。日程ありイベントで `${DELETE_NOT_SCHEDULE}` を確認する。
      void DELETE_NOT_SCHEDULE;
    }
  );

  test.fixme(
    "E2E-M13-02-050 チェックした日程を一括削除成功（要: 削除可能日程のシード）。成功メッセージで編集画面へ",
    async () => {
      // 期待は仕様(日程一括削除#6: 削除→日程削除完了→編集画面)由来。デッキ/申込なし日程のシード後に実装。
    }
  );

  test.fixme(
    "E2E-M13-02-051 デッキ登録済み/申込済み日程はチェック不可で一括削除対象外（要: デッキ/申込シード）",
    async () => {
      // 期待は仕様(日程削除可否#4#5: デッキ/申込ありは削除しない)由来。該当日程は checkbox disabled を確認する。
    }
  );
});
