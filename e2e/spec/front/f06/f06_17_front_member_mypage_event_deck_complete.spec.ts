/**
 * フロント 会員「大会に登録するデッキの確認・登録（デッキ登録完了画面）」（F06-17）E2E。
 * integration_test/e2e/f06_17_front_member_mypage_event_deck_complete_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-17_front_member_mypage_event_deck_complete.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本画面はデッキ登録の確定（更新）→完了画面表示であり、到達には会員ログインと編集完了フロー（有効な
 * 選手情報・登録可能イベント・保存済みデッキ）が要る。会員資格情報は ECCUBE_FRONT_USER/PASS
 * （未設定時は creds 必須ケースを test.skip）。要シード/要ログイン/要フロー状態のケースは
 * test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageEventDeckCompletePage } from "../../../pages/front/f06/f06_17_front_member_mypage_event_deck_complete.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 会員 > 大会デッキ登録 完了画面", { tag: ["@front", "@member"] }, () => {
  // --- シード/ログイン不要で非破壊に走る live ケース ---
  test("E2E-F06-17-002 未ログインで完了画面URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const deck = new FrontMemberMypageEventDeckCompletePage(page);
    await deck.gotoDeckCheck(1);
    await deck.seeLoginRedirect();
  });

  // --- creds があれば live 化する（会員ログイン後、非所有/不存在のデッキID完了画面は表示しない） ---
  test("E2E-F06-17-021-live ログイン済みでも不存在・非所有のデッキID完了画面は表示されない", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const deck = new FrontMemberMypageEventDeckCompletePage(page);
    await deck.login();
    // 選手情報に紐づかない・存在しないデッキIDは所有者不一致/取得不可としてHTTP404（完了画面は出さない）。
    await deck.gotoDeckCheck(999999999);
    await expect(deck.heading).toHaveCount(0);
  });

  // --- 要ログイン/要シード/要編集完了フロー。自動化可能だが本リポ環境では保留（抜け漏れ可視化） ---
  test.fixme("E2E-F06-17-006 更新成功でデッキを保存し完了画面へリダイレクトする（要: 会員シード/選手情報/登録可能イベント/編集完了フロー）", async () => {});
  test.fixme("E2E-F06-17-007 完了画面に見出し・会員氏名・大会名/フォーマット・DCI・お名前・カードリスト・登録枚数を表示する（要: 完了フロー到達）", async () => {});
  test.fixme("E2E-F06-17-010 完了画面に見出し「デッキ登録完了」を表示する（要: 完了フロー到達）", async () => {});
  test.fixme("E2E-F06-17-011 完了画面に完了案内文を表示する（要: 完了フロー到達）", async () => {});
  test.fixme("E2E-F06-17-012 存在しないカード名の行に「%d行目の%sは存在しません」を表示する（要: 不正カードを含む完了フロー）", async () => {});
  test.fixme("E2E-F06-17-013 禁止カードの行に「%d行目の%sは禁止カードです」を表示する（要: 禁止カード/フォーマットシード）", async () => {});
  test.fixme("E2E-F06-17-014 制限カードの行に「%d行目の%sは制限カードです」を表示する（要: 制限カード/フォーマットシード）", async () => {});
  test.fixme("E2E-F06-17-015 範囲外カードの行に「%d行目の%sはフォーマットの範囲から外れています」を表示する（要: フォーマットシード）", async () => {});
  test.fixme("E2E-F06-17-016 同一カード超過の行に「%d行目の%sが5枚以上登録されています」を表示する（要: 重複カードを含む完了フロー）", async () => {});
  test.fixme("E2E-F06-17-019 書式エラー時は保存せずデッキ編集画面へリダイレクトし入力を復元する（要: 書式エラー入力/編集完了フロー）", async () => {});
  test.fixme("E2E-F06-17-020 完了画面で枚数超過・不足のボードメッセージを表示し登録は取り消さない（要: 枚数境界の完了フロー）", async () => {});
  test.fixme("E2E-F06-17-021 他会員のデッキIDで完了画面を開くと選手不一致でHTTP404となる（要: 2会員/他会員デッキシード）", async () => {});
  test.fixme("E2E-F06-17-022 デッキ登録フラグオフ・登録期限超過のイベントへ更新するとHTTP404で保存しない（要: イベント設定シード）", async () => {});
});
