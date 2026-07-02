/**
 * 管理画面 イベント管理 > 繰り返し日程登録 E2E（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m13_04_admin_event_event_repeat_schedule_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ test 本体で実装し、申込受付の支払い方法前提(040)は
 * 刷新先未実装の不具合候補（付帯表4#3）のため test.fixme で残す。手動/対象外はケース表で全量管理し、
 * specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m13-04_admin_event_event_repeat_schedule.md／観点表／基本設計）由来（オラクル独立性）。
 * pf-eccube3 リバース設計と刷新先 ec-cube-enterprise の乖離（URL経路差・保存失敗メッセージのキー/表示形態・
 * 申込受付の支払い方法前提の未実装・BaseInfo編集権限の粒度）はケース表「付帯表4」に出し、テストは仕様どおりに書く
 * （実装が違えば落ちて検出する）。ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m11系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報が無いと走らないよう test.skip(!HAS_CREDS) でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - GET表示・必須/相関バリデーション・404・未認証ガードは DB を変更せず安全に実行できる。
 *  - 正常登録(010/011)は dtb_event_detail に複数日程を作成する破壊的副作用があるため、使い捨てイベントで実行すること。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）。対象イベントの店舗(BaseInfo)を編集可能な権限を推奨（付帯表4#5）。
 *  - E2E_M13_EVENT_ID    : SEED-M13-04-EVENT（支払い方法設定済・使い捨てイベントのID）
 *  - E2E_M13_EVENT_NOPAY : SEED-M13-04-EVENT-NOPAY（支払い方法未設定イベントのID。040用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { EventEventRepeatSchedulePage } from "../../../pages/admin/m13/m13_04_admin_event_event_repeat_schedule.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const EVENT_ID = process.env.E2E_M13_EVENT_ID || "";
// SEED-M13-04-EVENT のイベント名（シード由来＝実装文言ではない）。設定時のみ名称表示を検証する。
const EVENT_NAME = process.env.E2E_M13_EVENT_NAME || "";
const HAS_EVENT = HAS_CREDS && !!EVENT_ID;
const EVENT_NOPAY = process.env.E2E_M13_EVENT_NOPAY || "";
// 存在しないイベントID（404確認用）。十分大きい数値を既定にする。
const MISSING_EVENT_ID = process.env.E2E_M13_MISSING_EVENT_ID || "99999999";

const CREATE_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/\\d+/repeatSchedule/create(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/event/\\d+/edit(\\?|$)`);
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

async function loginAndOpen(page: Page, eventId: string) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
  const target = new EventEventRepeatSchedulePage(page);
  await target.goto(eventId);
  return target;
}

/** 期間の入力に使う日付（当月1日／翌月1日）を YYYY-MM-DD で返す。 */
function periodDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

test.describe(
  "イベント管理 > 繰り返し日程登録",
  { tag: ["@admin", "@event"] },
  () => {
    // ===== 未認証ガード（資格情報不要・非破壊） =====

    test("E2E-M13-04-060 未ログインで作成URL直接→管理ログイン画面へ誘導", async ({ page }) => {
      const target = new EventEventRepeatSchedulePage(page);
      await target.goto(EVENT_ID || "1");
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可: 未ログインはアクセス不可
    });

    // ===== 作成画面表示（GET・非破壊） =====

    test("E2E-M13-04-001 繰り返し日程の作成画面が表示される", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定（ECCUBE_ADMIN_USER/PASS, E2E_M13_EVENT_ID）");
      const target = await loginAndOpen(page, EVENT_ID);
      await expect(page).toHaveURL(CREATE_RE);
      await target.seeCreateForm(); // サブタイトル/カード見出し「繰返し日程登録」・フォーム・登録ボタン
    });

    test("E2E-M13-04-002 作成画面に対象イベント名・イベントIDが表示される", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定");
      await loginAndOpen(page, EVENT_ID);
      // 設計書「フロント挙動/表示要素」: 対象イベント名・イベントID を表示する。
      // イベントID（シード由来）が表示されること。
      await expect(page.locator("body")).toContainText(String(EVENT_ID));
      // イベント名（シードで供給＝実装文言ではない）が渡された場合のみ名称表示を検証する。
      // 未設定時は名称オラクルが無いため検証しない（要 E2E_M13_EVENT_NAME）。
      if (EVENT_NAME) {
        await expect(page.locator("body")).toContainText(EVENT_NAME);
      }
    });

    test("E2E-M13-04-003 期間・開始時間に必須表示があり登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定");
      const target = await loginAndOpen(page, EVENT_ID);
      await expect(target.requiredBadge.first()).toBeVisible(); // 必須バッジ（期間/開始時間）
      await expect(target.registerButton).toBeVisible(); // 「登録」
    });

    // ===== バリデーション（非破壊） =====

    test("E2E-M13-04-020 必須未入力で登録→作成画面に留まる（編集画面へ遷移しない）", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定");
      const target = await loginAndOpen(page, EVENT_ID);
      await target.submitEmpty();
      await expect(page).not.toHaveURL(EDIT_RE); // 検証失敗→イベント編集へ遷移しない
      await expect(page).toHaveURL(CREATE_RE); // 作成画面に留まる（日程は作成されない）
    });

    test("E2E-M13-04-021 必須未入力で登録→必須エラーが表示される", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定");
      const target = await loginAndOpen(page, EVENT_ID);
      await target.submitEmpty();
      // エラー要素のセレクタは bootstrap form_errors 出力（.invalid-feedback 推定・要実機確認 付帯表4#4）。
      await expect(target.error.first()).toBeVisible();
    });

    test("E2E-M13-04-022 曜日のみ未選択で登録→作成画面に留まる（曜日必須）", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定");
      const target = await loginAndOpen(page, EVENT_ID);
      const { start, end } = periodDates();
      // 期間・開始時間は入力し曜日のみ未選択（設計書 入力項目: 期間・曜日 等は必須）。
      await target.fillAndSubmit({ start, end, time: "10:00", skipWeekday: true });
      await expect(page).not.toHaveURL(EDIT_RE); // 曜日未選択→検証失敗で遷移しない
      await expect(page).toHaveURL(CREATE_RE); // 作成画面に留まる（日程は作成されない）
    });

    test("E2E-M13-04-030 期間開始＞期間終了で相関エラー・作成画面に留まる", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定");
      const target = await loginAndOpen(page, EVENT_ID);
      const { start, end } = periodDates();
      // 期間開始を終了より後に設定（start と end を入れ替え）して相関エラーを誘発する。
      await target.fillAndSubmit({ start: end, end: start });
      await expect(page).not.toHaveURL(EDIT_RE); // 相関エラー→遷移しない
      await expect(page).toHaveURL(CREATE_RE); // 作成画面に留まる
    });

    // ===== 404（要ログイン・非破壊） =====

    test("E2E-M13-04-050 存在しないイベントIDで作成画面→404", async ({ page }) => {
      test.skip(!HAS_CREDS, "資格情報未設定（ECCUBE_ADMIN_USER/PASS）");
      const lp = new AdminLoginPage(page);
      await lp.goto();
      await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
      const target = new EventEventRepeatSchedulePage(page);
      const resp = await page.goto(target.createUrl(MISSING_EVENT_ID));
      expect(resp?.status()).toBe(404); // イベント不存在→ページが見つからない扱い
    });

    // ===== 正常登録（破壊的＝使い捨てイベント前提） =====

    test("E2E-M13-04-010 必須全入力で登録→イベント編集画面へ遷移", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定（破壊的＝使い捨てイベントで実行）");
      const target = await loginAndOpen(page, EVENT_ID);
      const { start, end } = periodDates();
      await target.fillAndSubmit({ start, end, weekday: 1, time: "10:00" });
      await expect(page).toHaveURL(EDIT_RE); // 該当日の一括作成後、イベント編集画面へ遷移
    });

    test("E2E-M13-04-011 登録成功時に該当日の日程が一括作成され編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_EVENT, "SEED-M13-04-EVENT 未設定（破壊的）");
      const target = await loginAndOpen(page, EVENT_ID);
      const { start, end } = periodDates();
      await target.fillAndSubmit({ start, end, weekday: 1, time: "10:00" });
      // 設計書「表示メッセージ」節に成功時メッセージの規定は無い（save-failed/支払い未設定のみ）。
      // 成功時オラクルは設計書「処理フロー#5(一括作成)」「画面遷移(登録成功→イベント編集)」由来の遷移で判定し、
      // 実装由来の成功文言（admin.common.save_complete=「保存しました」）を期待値固定しない（オラクル独立性）。
      await expect(page).toHaveURL(EDIT_RE);
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M13-04-040 申込受付有効＋支払い方法未設定→申込受付不可で再表示（刷新先未実装＝不具合候補#3。要 SEED-M13-04-EVENT-NOPAY）",
      async ({ page }) => {
        // 期待は仕様(処理フロー#4／表示メッセージ admin.schedule.error.payment.not.exists)由来。
        // 刷新先 Controller / RepeatScheduleStoreAction に支払い方法存在チェックが無いため、
        // 仕様どおり「申込受付不可で再表示・日程は作成されない」を期待すると現状は失敗で検出される見込み。
        test.skip(!(HAS_CREDS && EVENT_NOPAY), "SEED-M13-04-EVENT-NOPAY 未設定");
        const target = await loginAndOpen(page, EVENT_NOPAY);
        const { start, end } = periodDates();
        await target.fillAndSubmit({ start, end, weekday: 1, time: "10:00", enableEntry: true });
        await expect(page).toHaveURL(CREATE_RE); // 申込受付不可→入力画面を再表示（仕様）
      }
    );
  }
);
