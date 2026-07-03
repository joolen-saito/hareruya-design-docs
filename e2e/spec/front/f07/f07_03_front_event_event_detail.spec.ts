/**
 * フロント イベント「イベント詳細」（F07-03）E2E。
 * integration_test/e2e/f07_03_front_event_event_detail_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f07-03_front_event_event_detail.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本画面はログイン不要の公開参照画面のため @playwright/test を直接使う（管理fixture不要）。
 * 詳細の表示内容・状態別ボタン・条件付き表示・遷移導線は「実在するイベント詳細1件」を要するため
 * 要シード/要ログインとして test.fixme（理由付き）で保留する。URLスキームが設計書で確定している
 * 存在しないID／数値以外の不正IDに対する 404 のみ、シード不要で live 実行する。
 */
import { test, expect } from "@playwright/test";
import { FrontEventDetailPage } from "../../../pages/front/f07/f07_03_front_event_event_detail.page";

test.describe("フロント > イベント > イベント詳細", { tag: ["@front", "@event"] }, () => {
  test("E2E-F07-03-021 存在しないイベント詳細IDへ直接アクセスするとページが見つからない(404)", async ({ page }) => {
    const detail = new FrontEventDetailPage(page);
    // 存在しない数値ID。期待は設計書「存在しないID→404」由来。
    await detail.gotoDetailExpectingNotFound(999999999);
  });

  test("E2E-F07-03-022 数値以外の不正なイベント詳細IDはルートに一致せず404となる", async ({ page }) => {
    const detail = new FrontEventDetailPage(page);
    // 詳細IDは数値形式に限る（ルートのパス制約）。期待は設計書「バリデーション・失敗時出力」由来。
    await detail.gotoDetailExpectingNotFound("not-a-number");
  });

  // --- 要シード（実在イベント詳細）/要ログイン。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F07-03-004 詳細ページに開催情報と状態別ボタンが表示される（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-005 申込ボタン押下でイベント申込(F07-04)へ遷移する（要: SEED-F07-03-ENTRYOK/会員ログイン）", async () => {});
  test.fixme("E2E-F07-03-006 キャンセル申込ボタン押下で問い合わせへ遷移する（要: SEED-F07-03-ENTERED/会員ログイン）", async () => {});
  test.fixme("E2E-F07-03-007 デッキ登録・編集ボタン押下でデッキ登録機能へ遷移する（要: SEED-F07-03-DECK/会員ログイン）", async () => {});
  test.fixme("E2E-F07-03-008 戻るボタン押下で一覧側へ戻る（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-009 表示要素（店舗/大会名/日時/フォーマット/定員/参加費/賞品/備考）が表示される（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-012 詳細画面はモーダル・ポップアップ・トーストを表示しない（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-015 定員に達しているとき申込ボタン領域を表示しない（要: SEED-F07-03-FULL）", async () => {});
  test.fixme("E2E-F07-03-016 残り予約数は事前予約期限前のときのみ表示される（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-017 参加費0円は「無料」、それ以外は「(金額)円」で表示される（要: SEED-F07-03-FREE）", async () => {});
  test.fixme("E2E-F07-03-018 受付時間は受付開始・終了双方設定時のみ表示される（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-019 事前予約フラグ真のとき事前予約期間・参加費を表示する（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-020 未ログインでもイベント詳細(開催情報)を閲覧できる（要: SEED-F07-03-EVENT）", async () => {});
  test.fixme("E2E-F07-03-023 デッキ登録済みのときデッキ登録ボタンをデッキ編集として表示する（要: SEED-F07-03-DECK-DONE/会員ログイン）", async () => {});
});
