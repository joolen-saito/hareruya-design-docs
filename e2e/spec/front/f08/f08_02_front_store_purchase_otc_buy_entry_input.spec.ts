/**
 * フロント 店頭買取受付「査定申込情報入力」（F08-02）E2E。
 * integration_test/e2e/f08_02_front_store_purchase_otc_buy_entry_input_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f08-02_front_store_purchase_otc_buy_entry_input.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本画面は店頭買取査定申込みの入力段階であり、エントリー／申込フォーム／会員登録フォームは
 * 有効な店舗識別名（dtb_base_info.html_class_name）とエントリー開始状態を前提とする。
 * そのため大半は要: 店舗シード/エントリー状態/ログイン のため test.fixme（理由付き）で保留し、全量はケース表で管理する。
 * creds/シード不要で走るのは「存在しない店舗識別名→404」ガードのみ（live）。
 * 会員資格情報は ECCUBE_FRONT_USER/PASS（未設定時は認証必須の live 変種を test.skip）。
 */
import { test, expect } from "@playwright/test";
import { FrontOtcBuyEntryInputPage } from "../../../pages/front/f08/f08_02_front_store_purchase_otc_buy_entry_input.page";
import { ECCUBE_FRONT_PASS, ECCUBE_FRONT_USER } from "../../../config/default.config";

// 認証必須ケースは全て要店舗シードのため現状 test.fixme。将来の live 化ゲート用に定義。
const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > 店頭買取受付 > 査定申込情報入力", { tag: ["@front", "@otcbuy"] }, () => {
  // --- live: creds/シード不要（存在しない店舗→404）。非破壊 ---
  test("E2E-F08-02-002 未ログインで存在しない店舗のエントリーURLへアクセスすると404となる", async ({ page }) => {
    const otc = new FrontOtcBuyEntryInputPage(page);
    await otc.expectStoreNotFoundOnEntry();
  });

  test("E2E-F08-02-021 存在しない店舗の申込フォームURLへ直接アクセスすると404となる", async ({ page }) => {
    const otc = new FrontOtcBuyEntryInputPage(page);
    await otc.expectStoreNotFoundOnForm();
  });

  // --- 要: 店舗シード（SEED-F08-02-STORE）。エントリー画面表示 ---
  test.fixme("E2E-F08-02-012 エントリー画面に見出し・言語選択・ログインフォーム・ゲスト導線が表示される（要: SEED-F08-02-STORE）", async () => {});
  test.fixme("E2E-F08-02-011 エントリー・申込フォームに見出し「査定申込み」が表示される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-016 エントリーのログイン失敗時に最終エラーがフォーム直下に表示される（要: SEED-F08-02-STORE/認証失敗）", async () => {});

  // --- 要: 店舗シード＋エントリー開始状態。申込フォーム表示・入力項目 ---
  test.fixme("E2E-F08-02-003 エントリー開始後に申込フォームが表示される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-006 申込フォームに規定の入力項目が表示される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-013 申込フォームに入力時間の残り表示（10分タイマー）が表示される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-007 申込フォームに郵便番号自動入力ボタンと検索リンクが表示される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-010 申込フォームに各種モーダルが用意される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-019 未送信時に国が日本で初期化される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-023 Language選択でフォーム文言が日本語・英語に切り替わる（要: SEED-F08-02-STORE/エントリー状態）", async () => {});

  // --- 要: 会員ログイン状態。ログイン初期反映 ---
  test.fixme("E2E-F08-02-020 ログイン中は会員の登録情報が申込フォームへ初期反映される（要: SEED-F08-02-MEMBER/ログイン状態）", async () => {});

  // --- 要: 店舗シード＋エントリー状態（＋申込フォーム送信）。送信分岐・会員登録フォーム ---
  test.fixme("E2E-F08-02-009 申込フォーム送信は未ログイン時に会員登録フォームへ向かう（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-004 申込フォーム送信で会員登録フォームが表示される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-008 会員登録フォームにメール・確認用・パスワード・確認用・同意が表示される（要: 申込フォーム送信済）", async () => {});
  test.fixme("E2E-F08-02-014 会員登録フォームに会員登録案内文が表示される（要: 申込フォーム送信済）", async () => {});
  test.fixme("E2E-F08-02-015 会員登録フォームのパスワード欄に注意文が表示される（要: 申込フォーム送信済）", async () => {});

  // --- 要: 店舗シード（エントリー未開始）。ガード遷移 ---
  test.fixme("E2E-F08-02-028 エントリー未開始で申込フォームへ直接アクセスするとエントリーへ戻される（要: SEED-F08-02-STORE/未開始）", async () => {});

  // --- 要: 店舗シード＋エントリー状態。入力バリデーション ---
  test.fixme("E2E-F08-02-024 適格「はい」で登録番号未入力だと必須エラーになる（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-055 適格の設問に応じて登録番号欄の必須が制御される（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-041 登録番号に全角を含むと文字種エラーになる（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-025 個人情報同意しないと送信できない（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-032 郵便番号・電話番号の分割欄に非数値で数値エラーになる（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-049 日本語ページはカナ必須・英語ページは任意（言語別相関）（要: SEED-F08-02-STORE/エントリー状態）", async () => {});
  test.fixme("E2E-F08-02-026 会員登録メールは最大長まで許容される（要: 申込フォーム送信済）", async () => {});
  test.fixme("E2E-F08-02-027 会員登録パスワードが32文字超過で文字数エラーになる（要: 申込フォーム送信済）", async () => {});

  // creds＋店舗シードが整えばエントリー画面表示を live 化する（現状は店舗未確定のため skip）。
  test("E2E-F08-02-012-live 店舗シード/資格情報がある環境ではエントリー画面要素が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定。かつ要: 店舗識別名シード（SEED-F08-02-STORE）");
    const otc = new FrontOtcBuyEntryInputPage(page);
    await otc.gotoEntry(process.env.OTCBUY_STORE || otc.noSuchStore);
    await otc.seeEntryScreen();
  });
});
