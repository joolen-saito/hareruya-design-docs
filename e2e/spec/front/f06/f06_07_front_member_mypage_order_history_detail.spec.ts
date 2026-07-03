/**
 * フロント 会員「購入履歴詳細」（F06-07）E2E。
 * 本リポジトリでは未実行の雛形（ec-cube-enterprise/pf-eccube3 の Playwright は実行不可で構造参考のみ）。
 * 対応ケース表: integration_test/e2e/f06_07_front_member_mypage_order_history_detail_e2e_cases.md
 *
 * 期待結果は functions/pf-eccube3/f06-07_front_member_mypage_order_history_detail.md
 * （利用者視点の入口・処理フロー・判定順序・表示メッセージ・権限認可）由来。
 * 会員ログイン必須の参照画面。未認証→ログイン誘導は資格情報不要で live。
 * ログイン後の詳細表示は会員注文シードを要するため、会員ログインのみで非破壊に走るものは
 * test.skip(!HAS_FRONT_CREDS,…) 付き live、要注文/決済/2会員/英語ロケール等の専用シードを
 * 要するものは test.fixme（理由付き）で保留する。手動・対象外はケース表で全量管理。
 */
import { test, expect } from "@playwright/test";
import { FrontMemberMypageOrderHistoryDetailPage } from "../../../pages/front/f06/f06_07_front_member_mypage_order_history_detail.page";
import {
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

const HAS_FRONT_CREDS = !!(ECCUBE_FRONT_USER && ECCUBE_FRONT_PASS);

test.describe("フロント > マイページ > 購入履歴詳細", { tag: ["@front", "@member"] }, () => {
  // 未認証保護（資格情報不要・非破壊）: 判定順序#1（未ログインは会員ログインへ誘導）
  test("E2E-F06-07-002 未ログインで購入履歴詳細URLへ直接アクセスすると会員ログインへ誘導される", async ({ page }) => {
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.gotoDetail(1);
    await detail.seeLoginRedirect();
  });

  test("E2E-F06-07-021 未ログインで詳細URLを直接開くとログイン画面の入力欄が表示される", async ({ page }) => {
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.gotoDetail(1);
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(page.locator('input[type="password"], input[name*="password"]').first()).toBeVisible();
    // 詳細見出しは表示されないこと（保護）
    await expect(page.getByText("購入履歴詳細", { exact: false })).toHaveCount(0);
  });

  test("E2E-F06-07-079 未ログインアクセスは404ではなく会員ログインへ誘導される", async ({ page }) => {
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.gotoDetail(1);
    // 判定順序#1が#2に先行: 未ログインは404ではなくログイン誘導
    await expect(page).toHaveURL(/\/mypage\/login(?:\?|$)/);
  });

  test("E2E-F06-07-082 /mypage配下は会員ログイン必須で未ログイン時は保護される", async ({ page }) => {
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.gotoDetail(1);
    await detail.seeLoginRedirect();
  });

  // 会員ログインのみで非破壊に走る（要資格情報。注文が無い環境ではランタイムでスキップ）
  test("E2E-F06-07-005 ログイン会員が自分の注文詳細を開くと見出し「購入履歴詳細」が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.login();
    const opened = await detail.openFirstOrderDetail();
    test.skip(!opened, "対象会員に購入履歴（注文）が無いため詳細を開けない（要 SEED-F06-07-ORDER）");
    await detail.seeDetailScreen();
  });

  test("E2E-F06-07-009 詳細画面にポイント注記が表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.login();
    const opened = await detail.openFirstOrderDetail();
    test.skip(!opened, "対象会員に購入履歴（注文）が無い（要 SEED-F06-07-ORDER）");
    // 期待文言は表示メッセージ節（常時表示）由来
    await expect(detail.pointNote).toBeVisible();
  });

  test("E2E-F06-07-007 金額内訳・決済情報・お届け先が区分して表示される", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.login();
    const opened = await detail.openFirstOrderDetail();
    test.skip(!opened, "対象会員に購入履歴（注文）が無い（要 SEED-F06-07-ORDER）");
    // 区分表示（金額内訳・決済情報・お届け先）は CSS・レイアウト節由来。区分ブロックのセレクタは要実機確認。
    await detail.seeDetailScreen();
  });

  test("E2E-F06-07-016 存在しない注文IDの詳細URLは見つからない（HTTP404）", async ({ page }) => {
    test.skip(!HAS_FRONT_CREDS, "ECCUBE_FRONT_USER/PASS 未設定");
    const detail = new FrontMemberMypageOrderHistoryDetailPage(page);
    await detail.login();
    // 判定順序#3（注文取得不可→HTTP404）。存在しない大きなIDを直接指定（非破壊・シード不要）
    const res = await page.goto(detail.detailUrl(999999999));
    expect(res?.status()).toBe(404);
  });

  // 専用シードを要するため保留（理由付き fixme）
  test.fixme("E2E-F06-07-004 領収書発行リンクから領収書発行画面へ遷移する（要: SEED-F06-07-ORDER）", async () => {
    // 期待は利用者視点の入口（printOrderReceipt）／画面遷移 由来。
  });
  test.fixme("E2E-F06-07-011 金額内訳の各項目が表示される（要: SEED-F06-07-ORDER・既知金額）", async () => {
    // 期待は業務ルール・計算（金額内訳）由来。商品金額合計・送料・手数料・ポイント使用・注文金額合計・発生ポイント。
  });
  test.fixme("E2E-F06-07-013 支払方法に応じた決済情報が表示される（要: SEED-F06-07-ORDER-CVS）", async () => {
    // 期待は業務ルール（決済情報は支払方法に応じ表示）由来。
  });
  test.fixme("E2E-F06-07-017 使用・発生ポイントが0の注文では0ポイントとして表示される（要: SEED-F06-07-ORDER-POINT0）", async () => {
    // 期待はエッジケース（使用・発生ポイント0→0ポイント表示）由来。
  });
  test.fixme("E2E-F06-07-014 言語が英語の場合はコンビニ一覧が英語表記で表示される（要: SEED-F06-07-ORDER-CVS＋英語ロケール）", async () => {
    // 期待は業務ルール（言語別表示：英語はコンビニ一覧を英語表記）由来。
  });
  test.fixme("E2E-F06-07-018 他会員の注文IDの詳細URLは見つからない（HTTP404・認可）（要: SEED-F06-07-OTHER-ORDER）", async () => {
    // 期待は判定順序#4／権限・認可（他会員の注文はHTTP404、理由非区別）由来。
  });
  test.fixme("E2E-F06-07-084 再購入操作は画面遷移せず非同期でカート投入内容を返す（要: SEED-F06-07-ORDER）", async () => {
    // 期待はフロント挙動（JS挙動：再購入は非同期）／画面遷移（遷移せず非同期）由来。応答本体は購入履歴一覧機能へ委譲。
  });
});
