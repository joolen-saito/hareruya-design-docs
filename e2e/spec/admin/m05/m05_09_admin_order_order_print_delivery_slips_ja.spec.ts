/**
 * 管理画面 受注管理「納品書印刷（日本語）」E2E。
 * 納品ケース表 integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 本specには「E2E自動化」ケースのみ実装し、手動（帳票内容＝E2E-050）・対象外はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。印刷ボタン押下のネイティブ印刷ダイアログ（window.print）は手動。
 *
 * 期待結果は仕様（正本md functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md／観点表／
 *   messages.ja.yaml の trans値）由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 設計源は pf-eccube3 リバースだが、刷新先 ec-cube-enterprise に同等画面が実在する（screenExists=true）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード: ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（未ログイン誘導テストは資格情報不要）。
 *   配送行を伴う正常系（E2E-020/021）は一覧に国内配送の受注（SEED-M05-09-ORDER-JP）が必要で、
 *   配送行チェックボックスが0件なら skip する（シード未投入時の安全動作）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderPrintDeliverySlipsJaPage } from "../../../pages/admin/m05/m05_09_admin_order_order_print_delivery_slips_ja.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);

// 仕様（設計書 帳票フォーマット定義／表示文言）由来の固定文言。実装に合わせて変えない（オラクル独立性）。
const ALERT_NO_CHECK = "チェックボックスが選択されていません"; // Order/index.twig:87（ハードコード文言・不具合候補#2）
const SLIP_TITLE = "納品書"; // delivery_slips.ja.twig:19 <title> / messages.ja.yaml:2436
const PRINT_BTN_LABEL = "印刷する"; // messages.ja.yaml:1467 admin.common.print
// 帳票フォーマット定義の項目ラベル（仕様: 設計書「帳票フォーマット定義」に注文番号・送り主の項目）。
// for ループ内（DeliverySlip が存在する時のみ）に描画されるため、対象データが空でない国内配送納品書の証跡になる。
const FIELD_ORDER_NO = "注文番号"; // admin.delivery_slips_ja.order_number messages.ja.yaml:2437
const FIELD_SENDER = "送り主"; // admin.delivery_slips_ja.sender messages.ja.yaml:2440

const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > 納品書印刷（日本語）",
  { tag: ["@admin", "@order", "@print"] },
  () => {
    // ===== 表示（操作起点・SEED-M05-09-ADMIN） =====

    test("E2E-M05-09-001 受注一覧に「納品書印刷（日本語）」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsJaPage(page);
      await target.gotoList();
      await target.seePrintJaButton();
    });

    test("E2E-M05-09-002 受注一覧に「納品書印刷（英語）」ボタンも並列表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsJaPage(page);
      await target.gotoList();
      await expect(target.printJaButton).toBeVisible();
      await expect(target.printEnButton).toBeVisible();
    });

    // ===== クライアント検証（チェック無→alert・遷移しない） =====

    test("E2E-M05-09-010 配送行未選択でボタン押下→警告アラートが出て遷移しない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsJaPage(page);
      await target.gotoList();
      const urlBefore = page.url();

      let dialogMessage = "";
      page.once("dialog", async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.dismiss();
      });
      await target.printJaButton.click();
      // 仕様: alert「チェックボックスが選択されていません」のみで遷移しない
      await expect.poll(() => dialogMessage).toContain(ALERT_NO_CHECK);
      expect(page.url()).toBe(urlBefore); // 受注一覧に留まる
    });

    // ===== 正常系（新規ウィンドウに納品書HTML・SEED-M05-09-ORDER-JP） =====

    test("E2E-M05-09-020 配送行をチェックして押下→新規ウィンドウに納品書HTMLが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsJaPage(page);
      await target.gotoList();
      test.skip(
        (await target.checkboxCount()) === 0,
        "SEED-M05-09-ORDER-JP 未投入（一覧に配送行が無い）"
      );
      const listUrlBefore = page.url();
      await target.checkFirstShipping();
      const popup = await target.clickPrintJaAndGetPopup();
      // 仕様（処理フロー1-6/画面遷移）: #form_bulk の action を印刷ルートへ差替・target=newwin で送信し、
      //   新規ウィンドウ（newwin）が印刷ルートへ遷移する。action差替/target=newwin の効果はpopupのURLで観測する。
      expect(popup.url()).toContain(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja`);
      // 仕様（画面遷移）: 一覧ウィンドウ自身は自動遷移しない＝親ページは受注一覧URLに留まる。
      expect(page.url()).toBe(listUrlBefore);
      // 仕様: 成功時は新規ウィンドウ（newwin）に納品書HTMLを返す
      await expect(popup).toHaveTitle(SLIP_TITLE);
      // 帳票本文（forループ内）に見出し・項目が描画される＝対象データが空でない国内配送納品書であること。
      //   （仕様: 帳票フォーマット定義に 注文番号・送り主 等。空データなら body には現れない＝空通過を防止）
      await expect(popup.locator("body")).toContainText(SLIP_TITLE);
      await expect(popup.locator("body")).toContainText(FIELD_ORDER_NO);
      await expect(popup.locator("body")).toContainText(FIELD_SENDER);
    });

    test("E2E-M05-09-021 納品書印刷画面に「印刷する」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsJaPage(page);
      await target.gotoList();
      test.skip(
        (await target.checkboxCount()) === 0,
        "SEED-M05-09-ORDER-JP 未投入（一覧に配送行が無い）"
      );
      await target.checkFirstShipping();
      const popup = await target.clickPrintJaAndGetPopup();
      await expect(popup.locator("#printButton")).toBeVisible();
      await expect(popup.locator("#printButton")).toContainText(PRINT_BTN_LABEL);
    });

    // ===== 異常系（ids無→404） =====

    test("E2E-M05-09-030 ids無しで印刷URLへアクセスすると404異常応答になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsJaPage(page);
      const res = await target.gotoPrintUrlWithoutIds();
      // 仕様: ids が配列でない/空なら アクセス不存在相当（404）
      expect(res?.status()).toBe(404);
    });

    test("E2E-M05-09-031 印刷URLへ直接アクセス（ids が配列でないスカラー）すると404になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // 一覧UIを経由せず印刷ルートへ直接GET。E2E-030（ids空＝配列が空）とは別経路として、
      //   ids を配列でないスカラー形で渡す。仕様（バリデーション: ids は配列でかつ空でない）上、
      //   配列でない形も「妥当な配送ID配列が無い」異常経路として404になる。
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja?ids=invalid`);
      expect(res?.status()).toBe(404);
    });

    test("E2E-M05-09-032 GETで妥当な配送ID配列を直接渡すと印刷HTML（200）が返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsJaPage(page);
      await target.gotoList();
      test.skip(
        (await target.checkboxCount()) === 0,
        "SEED-M05-09-ORDER-JP 未投入（一覧に配送行が無い）"
      );
      const id = await target.firstShippingId();
      test.skip(!id, "配送ID（ids[]値）が取得できない");
      // 仕様（利用者視点の入口）: GETルートは要件上許可され、妥当な配送ID配列があれば通常処理→HTML200。
      //   E2E-031（GET不正ids→404）と対の正常系。
      const res = await target.gotoPrintUrlWithIds([id!]);
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(SLIP_TITLE);
    });

    // ===== 権限・認可（未ログイン→管理ログイン誘導／資格情報不要） =====

    test("E2E-M05-09-040 未ログインで印刷URLへアクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      // 未ログイン状態で印刷ルートへアクセス（資格情報不要）
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // 注: 帳票内容（注文番号・適格請求書登録番号・明細・国内配送のみの内部結合＝E2E-M05-09-050）、
    //   印刷ボタン押下のネイティブ印刷ダイアログ window.print（E2E-022）、送信本文の選択ID・検索状態
    //   非混入（E2E-024）、会員/Player結合欠落エッジ（E2E-054）は手動確認のためspecに残さない。
    //   入力バリデーション（本機能は ids 形状のみで他は非該当）・DB検索/登録（参照のみ）等の
    //   対象外はケース表（付帯表1/2/2b）で全量管理する。
  }
);
