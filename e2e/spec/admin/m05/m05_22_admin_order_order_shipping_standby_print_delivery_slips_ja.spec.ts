/**
 * 管理画面 受注管理 出荷指示「納品書印刷（日本語）」E2E。
 * 納品ケース表 integration_test/e2e/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 本specには「E2E自動化」ケースのみ実装し、手動（帳票内容厳密検査）・対象外はケース表で全量管理する
 * （規約「手動/対象外はspecに残さない」）。印刷ボタン押下のネイティブ印刷ダイアログ（window.print）は手動。
 *
 * 期待結果は仕様（正本md functions/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.md／
 *   観点表／messages.ja.yaml の trans値）由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * 設計源は pf-eccube3 リバースだが、刷新先 ec-cube-enterprise に同等画面が実在する（screenExists=true）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（未ログイン誘導テスト 030 は資格情報不要）。
 *  - 編集画面を伴うケースは実在する出荷指示リストID（SEED-M05-22-STANDBY-JP）が必要で、環境変数 STANDBY_ID が
 *    無ければ skip する。正常系（010-013）は一覧に受注行が無い（国内配送受注未投入）なら skip する。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingStandbyPrintDeliverySlipsJaPage } from "../../../pages/admin/m05/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// SEED-M05-22-STANDBY-JP の既知 standby_id（国内配送受注を含む編集可能リスト）。
const STANDBY_ID = process.env.STANDBY_ID || "";
const HAS_STANDBY = HAS_CREDS && !!STANDBY_ID;

// 仕様（messages.ja.yaml の trans値・設計書 帳票フォーマット定義）由来の固定文言。実装に合わせて変えない。
const SLIP_TITLE = "納品書"; // delivery_slips.ja.twig:19 <title> / messages.ja.yaml:2436
const PRINT_BTN_LABEL = "印刷する"; // messages.ja.yaml:1467 admin.common.print
const FIELD_ORDER_NO = "注文番号"; // admin.delivery_slips_ja.order_number messages.ja.yaml:2437
const FIELD_SENDER = "送り主"; // admin.delivery_slips_ja.sender messages.ja.yaml:2440

// 仕様（正典: /{admin_route}/standby/{id}/print/delivery/ja）に合わせ管理ルート配下まで含めて検証する。
const PRINT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/standby/\\d+/print/delivery/ja(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/standby/${STANDBY_ID || "\\d+"}/edit(\\?|$)`);
const LOGIN_RE = /\/login(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 出荷指示 > 納品書印刷（日本語）",
  { tag: ["@admin", "@order", "@print"] },
  () => {
    // ===== 表示（操作起点・SEED-M05-22-STANDBY-JP） =====

    test("E2E-M05-22-001 編集画面に「納品書印刷（日本語）」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_STANDBY, "ECCUBE_ADMIN_USER/PASS または STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      await target.gotoEdit(STANDBY_ID);
      await target.seePrintJaButton();
    });

    test("E2E-M05-22-002 編集画面に全選択チェックと各行チェック（初期オン）が表示される", async ({ page }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      await target.gotoEdit(STANDBY_ID);
      await expect(target.checkAll).toBeVisible();
      test.skip((await target.checkboxCount()) === 0, "SEED-M05-22-STANDBY-JP 未投入（受注行が無い）");
      // 仕様: 一覧左端のチェックは初期オン（edit.twig:157 checked）
      await expect(target.orderCheckboxes.first()).toBeChecked();
    });

    // ===== 正常系（新規ウィンドウに納品書HTML・国内配送受注が必要） =====

    test("E2E-M05-22-010 チェックオンで押下→新規ウィンドウに納品書HTMLが印刷ルートで表示される", async ({
      page,
    }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      await target.gotoEdit(STANDBY_ID);
      test.skip((await target.checkboxCount()) === 0, "SEED-M05-22-STANDBY-JP 未投入（受注行が無い）");
      // 各行は初期オン。1件以上オンの状態で押下する。
      const popup = await target.clickPrintJaAndGetPopup();
      // 仕様（処理フロー クライアント1-4／画面遷移）: action差替・target=newwin で印刷ルートへPOSTし、
      //   新規ウィンドウ（newwin）が印刷ルートへ遷移する。
      await expect(popup).toHaveURL(PRINT_RE);
      // 仕様: 成功時は新規ウィンドウに納品書HTML（UTF-8）を返す
      await expect(popup).toHaveTitle(SLIP_TITLE);
      await expect(popup.locator("body")).toContainText(SLIP_TITLE);
    });

    test("E2E-M05-22-011 納品書HTMLに帳票項目（注文番号・送り主）が描画される", async ({ page }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      await target.gotoEdit(STANDBY_ID);
      test.skip((await target.checkboxCount()) === 0, "SEED-M05-22-STANDBY-JP 未投入（受注行が無い）");
      const popup = await target.clickPrintJaAndGetPopup();
      // 帳票本文（for ループ内）に見出し・項目が描画される＝対象データが空でない国内配送納品書であること。
      //   （仕様: 帳票フォーマット定義に 注文番号・送り主。空データなら body に現れない＝空通過を防止）
      await expect(popup.locator("body")).toContainText(FIELD_ORDER_NO);
      await expect(popup.locator("body")).toContainText(FIELD_SENDER);
    });

    test("E2E-M05-22-012 納品書HTML画面に「印刷する」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      await target.gotoEdit(STANDBY_ID);
      test.skip((await target.checkboxCount()) === 0, "SEED-M05-22-STANDBY-JP 未投入（受注行が無い）");
      const popup = await target.clickPrintJaAndGetPopup();
      await expect(popup.locator("#printButton")).toBeVisible();
      await expect(popup.locator("#printButton")).toContainText(PRINT_BTN_LABEL);
    });

    test("E2E-M05-22-013 ボタン成功後も親（編集）ウィンドウはその場に留まる", async ({ page }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      await target.gotoEdit(STANDBY_ID);
      test.skip((await target.checkboxCount()) === 0, "SEED-M05-22-STANDBY-JP 未投入（受注行が無い）");
      const popup = await target.clickPrintJaAndGetPopup();
      // 仕様: 子ウィンドウのみ納品書HTML、親（編集）ウィンドウは編集画面URLにとどまる。
      await expect(popup).toHaveURL(PRINT_RE);
      await expect(page).toHaveURL(EDIT_RE);
    });

    // ===== 異常系（order_ids空→アクセス不存在） =====

    test("E2E-M05-22-020 全チェックオフで押下→納品書HTMLが表示されない（order_ids空＝アクセス不存在）", async ({
      page,
    }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      await target.gotoEdit(STANDBY_ID);
      test.skip((await target.checkboxCount()) === 0, "SEED-M05-22-STANDBY-JP 未投入（受注行が無い）");
      // 仕様: チェック無しを止める alert は実装されない。全オフでPOSTされ、サーバ側 order_ids空で異常応答。
      await target.uncheckAllOrders();
      const popup = await target.clickPrintJaAndGetPopup();
      // 仕様: order_ids空はアクセス不存在に相当する異常応答（404）。新規ウィンドウに納品書は表示されない。
      // 納品書HTMLが描画されない（タイトル・帳票項目・印刷ボタンのいずれも出ない）ことで「納品書非表示」を判定する。
      //   ※popup を window.open+form submit(POST) で開く構造上、popup ナビゲーションのHTTPステータス(404)は
      //     Playwright から直接取得できない（GET直アクセス 021/022 で404を確実に観測）。本ケースは内容ベースの
      //     否定オラクルで「納品書非表示」を仕様判定する。要確認: popup POST の実応答ステータスは実機で確認。
      await expect(popup).not.toHaveTitle(SLIP_TITLE);
      await expect(popup.locator("body")).not.toContainText(FIELD_ORDER_NO);
      await expect(popup.locator("body")).not.toContainText(FIELD_SENDER);
      await expect(popup.locator("#printButton")).toHaveCount(0);
    });

    test("E2E-M05-22-021 印刷URLへ order_ids 無しで直接アクセスすると404になる", async ({ page }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsJaPage(page);
      const res = await target.gotoPrintUrlWithoutIds(STANDBY_ID);
      // 仕様（処理フロー サーバ3）: order_ids 空キー一覧はアクセス不存在相当（404）
      expect(res?.status()).toBe(404);
    });

    test("E2E-M05-22-022 存在しない出荷指示リストIDの印刷URLは404になる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // 存在しないリストID（リスト欠＝サーバ2分岐）。十分大きいID。
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/standby/99999999/print/delivery/ja`
      );
      expect(res?.status()).toBe(404);
    });

    test("E2E-M05-22-023 当該リストに属さない受注IDのみの印刷URLは404になる", async ({ page }) => {
      test.skip(!HAS_STANDBY, "STANDBY_ID 未設定");
      await login(page);
      // 仕様（処理フロー サーバ4-6／エッジケース「POSTに載ったキーが当リスト所属受注ではないのみ」）:
      //   order_ids は非空だが当該リストに属さない受注IDのみ→絞込後の配送主キー集合が空→アクセス不存在(404)。
      //   当リストに属さない十分大きい受注IDを order_ids に載せる。
      const res = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/standby/${STANDBY_ID}/print/delivery/ja?order_ids[99999999]=on`
      );
      expect(res?.status()).toBe(404);
    });

    // ===== 権限・認可（未ログイン→管理ログイン誘導／資格情報不要） =====

    test("E2E-M05-22-030 未ログインで印刷URLへアクセスすると管理ログイン画面へ誘導される", async ({
      page,
    }) => {
      // 未ログイン状態で印刷ルートへアクセス（資格情報不要）。standby_id は任意（誘導が先行）。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/standby/1/print/delivery/ja`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // 注: 帳票内容の厳密検査（注文番号・適格請求書登録番号・明細・国内配送のみの内部結合・請求欄の値=040、
    //   選択差分でオンのみ印刷=014、全海外配送→国内結合空=024、プレイヤ未紐付け→結合空=025）と
    //   印刷ボタン押下のネイティブ印刷ダイアログ（window.print）は手動/間接（要専用シード含む）確認のためspecに残さない。
    //   入力バリデーション細目（本機能は order_ids 形状のみ）・DB検索/書込（参照のみ・副作用観測外）・
    //   ログ出力抑止などの対象外はケース表（付帯表2/2b）で全量管理する。
  }
);
