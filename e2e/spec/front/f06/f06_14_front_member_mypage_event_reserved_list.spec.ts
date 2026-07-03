/**
 * フロント 会員 マイページ「予約済み大会一覧」（F06-14）E2E。
 * integration_test/e2e/f06_14_front_member_mypage_event_reserved_list_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-14_front_member_mypage_event_reserved_list.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能は参照のみの表示専用画面で、マイページ配下のため会員ログインを要する。
 * 会員資格情報は ECCUBE_FRONT_USER/PASS（未設定時は認証必須ケースを test.skip）。
 * 要シード/要ログイン/要特定申込データのケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberEventReservedListPage } from "../../../pages/front/f06/f06_14_front_member_mypage_event_reserved_list.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 会員 > マイページ > 予約済み大会一覧", { tag: ["@front", "@member"] }, () => {
  // --- 未認証で走る live ケース（資格情報・シード不要・非破壊） ---
  test("E2E-F06-14-002 未ログインで予約済み大会一覧URLへアクセスすると会員ログインへ誘導される", async ({ page }) => {
    const events = new FrontMemberEventReservedListPage(page);
    await events.gotoEventsList();
    await events.seeLoginGuidance();
  });

  test("E2E-F06-14-021 未ログインで保護URLへ直接アクセスすると一覧見出しを表示せずログイン誘導される", async ({ page }) => {
    const events = new FrontMemberEventReservedListPage(page);
    await events.gotoEventsList();
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(events.heading).toHaveCount(0);
  });

  // --- 会員資格情報がある環境で走る成功系（未設定時は skip） ---
  test("E2E-F06-14-007 ログイン後、見出し「予約済み大会一覧」と遷移ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const events = new FrontMemberEventReservedListPage(page);
    await events.login();
    await events.gotoEventsList();
    await events.seeListScreen();
  });

  // --- 要ログイン/要特定申込シード。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F06-14-004 会員自身の申込をキャンセル除外・開催日時の新しい順で表示する（要: 会員シード/複数申込データ）", async () => {});
  test.fixme("E2E-F06-14-012 申込0件で「予約済みの大会はありません。」を表示する（要: 申込0件の会員シード）", async () => {});
  test.fixme("E2E-F06-14-013 申込状態が決済中で「決済中」と決済案内ヘルプリンクを表示する（要: 決済中申込シード）", async () => {});
  test.fixme("E2E-F06-14-014 開催日時が過去でイベント終了済みなら「イベント終了」を表示する（要: 終了イベント申込シード）", async () => {});
  test.fixme("E2E-F06-14-010 決済中以外・未終了の申込は申込状態の名称を表示する（要: 申込完了状態のシード）", async () => {});
  test.fixme("E2E-F06-14-009 フォーマットがコードに対応するアイコンで表示される（要: フォーマット付きイベント申込シード）", async () => {});
  test.fixme("E2E-F06-14-005 イベント名リンクからイベント詳細（/events/{id}）へ遷移する（要: 申込シード）", async () => {});
  test.fixme("E2E-F06-14-006 「デッキ登録」ボタンからデッキ登録一覧へ遷移する（要: 会員ログイン状態）", async () => {});
  test.fixme("E2E-F06-14-015 「マイページ」ボタンからマイページトップへ戻る（要: 会員ログイン状態）", async () => {});
});
