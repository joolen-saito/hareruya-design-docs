/**
 * フロント 会員 マイページ「買取履歴詳細」（F06-12 / buy_history_detail）E2E。
 * integration_test/e2e/f06_12_front_member_mypage_buy_history_detail_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-12_front_member_mypage_buy_history_detail.md 由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の実画面は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * 本機能はマイページ配下＝会員ログイン必須の表示専用画面。承諾（売却可否確定）は買取査定承諾機能が正。
 * 資格情報不要で非破壊に走る未認証誘導 002/021 を live とし、要ログイン/要シード（本人・他人・削除済み等の
 * 買取注文レコード）のケースは test.fixme（理由付き）で保留し、全量はケース表で管理する。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageBuyHistoryDetailPage } from "../../../pages/front/f06/f06_12_front_member_mypage_buy_history_detail.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > 買取履歴詳細", { tag: ["@front", "@member"] }, () => {
  test("E2E-F06-12-002 未ログインで買取履歴詳細URLを開くと会員ログインへ誘導される", async ({ page }) => {
    const detail = new FrontMemberMypageBuyHistoryDetailPage(page);
    await detail.gotoDetail(1);
    await detail.seeLoginRedirect();
  });

  test("E2E-F06-12-021 未ログインで保護URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const detail = new FrontMemberMypageBuyHistoryDetailPage(page);
    await detail.gotoDetail(999999);
    await detail.seeLoginRedirect();
  });

  // --- 要ログイン/要シード（本人・他人・削除済み等の買取注文レコード）。自動化可能だが本リポ環境では保留 ---
  test.fixme("E2E-F06-12-008 本人の買取注文詳細を1件表示し見出しと会員氏名を表示する（要: SEED-F06-12-ORDER-CONTACTED/会員資格情報）", async () => {});
  test.fixme("E2E-F06-12-005 進行履歴のオーダーID・各日付が識別子として表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-007 処理状態が状態識別子に対応する画像で表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-009 査定金額合計が表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-010 査定承諾金額合計が表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-011 えらんで買取区分の明細が一覧表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-012 まとめて買取（一定価格以上）の明細が個別に一覧表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-013 進行履歴日付（査定・承諾・振込完了）が表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-022 連絡済み以外は売却可否が操作不可で承諾フォームを出さない（要: SEED-F06-12-ORDER-NONCONTACTED）", async () => {});
  test.fixme("E2E-F06-12-023 査定価格未確定の明細は「査定中」と表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-015 連絡済みのとき承諾案内文言が表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-016 他人の買取注文の詳細URLはHTTP404となる（要: SEED-F06-12-ORDER-OTHER/会員資格情報）", async () => {});
  test.fixme("E2E-F06-12-017 連絡済みのとき承諾フォームと承諾確定ボタンが表示される（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-018 査定価格が確定済みの明細は金額と小計（査定価格×数量）を表示する（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-019 まとめて買取は一定価格以上の商品を個別表示する（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-020 売却可否の選択に応じて承諾合計・非承諾合計が画面上で集計表示される（要: SEED-F06-12-ORDER-CONTACTED/JS挙動）", async () => {});
  test.fixme("E2E-F06-12-014 商品リンクで買取用商品詳細を別タブ表示し削除済み商品も明細表示する（要: SEED-F06-12-ORDER-DELETED-ITEM）", async () => {});
  test.fixme("E2E-F06-12-006 買取履歴用スクリプトを読み込み売却可否選択で集計が変化する（要: SEED-F06-12-ORDER-CONTACTED/JS挙動）", async () => {});
  test.fixme("E2E-F06-12-003 承諾確定ボタンの送信先が承諾処理（POST update/{id}）である（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-001 承諾フォームになりすまし対策トークン（hidden）が存在する（要: SEED-F06-12-ORDER-CONTACTED）", async () => {});
  test.fixme("E2E-F06-12-058 存在しない注文番号の詳細URLはHTTP404となる（要: 会員資格情報/認証後404確認）", async () => {});

  // creds があれば live 化する成功系（詳細本体は要シード注文IDのため、認証成立＝マイページ配下到達まで観測）
  test("E2E-F06-12-008-live 会員資格情報がある環境では認証成立しマイページ配下へ到達できる", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const detail = new FrontMemberMypageBuyHistoryDetailPage(page);
    await detail.login();
    await page.goto(detail.mypageUrl);
    // 認証成立により、保護URLがログイン画面へ再誘導されないこと（詳細表示の前提＝会員ログイン必須）。
    await expect(page).toHaveURL(/\/mypage(?:\/|\?|$)/);
    await expect(page).not.toHaveURL(/\/mypage\/login/);
  });
});
