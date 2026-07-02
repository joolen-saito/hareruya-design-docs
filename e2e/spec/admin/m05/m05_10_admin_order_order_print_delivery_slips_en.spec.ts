/**
 * 管理画面 受注管理「納品書印刷（英語）」E2E。
 * 納品ケース表 integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 【screenExists=true】刷新先 ec-cube-enterprise に本機能は実在する（ルート admin_delivery_slips_export /
 *   受注一覧 admin_order / delivery_slips.en.twig）。本specには「E2E自動化」ケースのみ実装し、
 *   手動（帳票内容・海外限定抽出・参照のみ）/対象外（CSRF内部・ログ抑止・別機能委譲）はケース表で全量管理する
 *   （規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様（正本md functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md /
 *   設計HTML / テスト観点表）由来（オラクル独立性）。表示文言も設計書本文の記載を根拠とし、
 *   実装リソース（messages.ja.yaml の翻訳値）・現挙動・Form制約・Cookie名は期待値に固定しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報なしでは未認証系のみ実行可）。
 *  - 一覧UI/POST正常系は受注（海外配送）データが必要（SEED-M05-10-ORDER / SEED-M05-10-ABROAD）。
 *    直接POST/GET正常系は配送ID env SLIP_ABROAD_SHIPPING_ID を要し、未指定なら skip。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderPrintDeliverySlipsEnPage } from "../../../pages/admin/m05/m05_10_admin_order_order_print_delivery_slips_en.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 直接POST/GET正常系で使う海外配送の dtb_shipping.id（SEED-M05-10-ABROAD）。未指定なら当該テストは skip。
const ABROAD_SHIPPING_ID = process.env.SLIP_ABROAD_SHIPPING_ID || "";

// 未ログイン誘導の遷移先＝管理ログイン画面URL（権限・認可・設計書「管理画面共通のログイン誘導」由来）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);

// 期待文言は仕様（設計書・観点表）由来。実装リソース(messages.ja.yaml)の値を固定オラクルにしない（オラクル独立性）。
// - ALERT_NO_CHECK: 設計書 入口節「日本語のアラート『チェックボックスが選択されていません』が出て送信しない」由来。
const ALERT_NO_CHECK = "チェックボックスが選択されていません";
// - SLIP_HEADING: 設計書「英語レイアウトのHTML」「見出しは翻訳キー admin.delivery_slips_en」由来の英語見出し。
//   ※ 設計書(正本md)は翻訳キーを示し英語の表示値は明記しないため、リテラル文字列の厳密一致は「要確認」。
const SLIP_HEADING = "Delivery Slip";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > 納品書印刷（英語）",
  { tag: ["@admin", "@order", "@print"] },
  () => {
    // ===== 未認証ガード（資格情報不要・常時実行可） =====

    test("E2E-M05-10-010 未ログインで英語印刷URLへ直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 期待は権限・認可／利用者視点の入口（管理ログイン要）由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/en?ids[]=1`);
      await expect(page).toHaveURL(LOGIN_RE); // 管理ログイン画面へ誘導される（URL遷移）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 異常系: ids 不正は HTTP404（要ログインのみ） =====

    test("E2E-M05-10-007 idsを付けずに英語印刷URLへアクセス→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      const res = await target.requestPrintEnGet(); // ids 欠落
      expect(res.status()).toBe(404); // 判定順序#1: ids 非空配列でなければ NotFound
    });

    test("E2E-M05-10-008 ids空/非配列で英語印刷URLへアクセス→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      const res = await target.requestPrintEnGet("?ids="); // 空スカラ＝非配列
      expect(res.status()).toBe(404);
    });

    test("E2E-M05-10-014 非空だが存在しない配送IDで英語へPOST→404にならずHTTP200(本文は空整形)", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      // ids は非空配列のため判定順序#1（is_array/空チェック）を通過し 404 にはならない。
      // 該当レコードが無いため #3 で 0 件＝本文は空整形（空整形の本文確認は手動 015）。
      const res = await target.requestPrintEnPost(["999999999"]);
      expect(res.status()).toBe(200); // 存在検証はせず非空配列なら 200（設計書バリデーション）
    });

    test("E2E-M05-10-009 lang要件外(ja|en以外)のパスは解決されずHTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const res = await page.request.get(
        `/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/xx?ids[]=1`
      );
      expect(res.status()).toBe(404); // requirements lang=ja|en によりルート非マッチ
    });

    // ===== 受注一覧（入口）UI・JS挙動（要ログイン＋受注データ SEED-M05-10-ORDER） =====

    test("E2E-M05-10-001 受注一覧に「納品書印刷（英語）」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（要 SEED-M05-10-ORDER）");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      await target.gotoList();
      await target.seePrintEnButton(); // trans admin.order.print_delivery_slips_en
    });

    test("E2E-M05-10-002 未チェックで押下→アラートが出て送信しない（一覧に留まる）", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（要 SEED-M05-10-ORDER）");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      await target.gotoList();
      const msg = await target.clickPrintEnExpectAlert();
      expect(msg).toBe(ALERT_NO_CHECK); // preventIfNoCheckedBulkTarget のアラート
      await expect(page).toHaveURL(/\/order(\?|$)/); // 一覧に留まる（送信されない）
    });

    test("E2E-M05-10-003 配送行チェック→押下で子ウィンドウに英語納品書(タイトル「納品書」)が開く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（要 SEED-M05-10-ORDER）");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      await target.gotoList();
      // 配送行が無い（シード未投入）なら skip。シード不足を仕様不具合の失敗と誤認しない。
      test.skip(
        (await target.rowCheckboxes.count()) === 0,
        "受注一覧に配送行が無くチェック対象が描画されない（要 SEED-M05-10-ORDER）"
      );
      const popup = await target.clickPrintEnAndGetPopup(); // newwin を開きフォームを en へ POST
      await expect(popup).toHaveTitle("納品書"); // delivery_slips.en.twig:19
    });

    test("E2E-M05-10-004 英語納品書ページに印刷ボタン「印刷する」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定（要 SEED-M05-10-ORDER）");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      await target.gotoList();
      // 配送行が無い（シード未投入）なら skip。シード不足を仕様不具合の失敗と誤認しない。
      test.skip(
        (await target.rowCheckboxes.count()) === 0,
        "受注一覧に配送行が無くチェック対象が描画されない（要 SEED-M05-10-ORDER）"
      );
      const popup = await target.clickPrintEnAndGetPopup();
      await target.seeSlipPage(popup); // タイトル「納品書」＋印刷する（admin.common.print）
    });

    // ===== 直接リクエスト正常系（要ログイン＋海外配送ID SLIP_ABROAD_SHIPPING_ID） =====

    test("E2E-M05-10-005 有効idsで英語印刷URLへPOST→HTTP200・英語見出し「Delivery Slip」", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!ABROAD_SHIPPING_ID, "SLIP_ABROAD_SHIPPING_ID 未設定（要 SEED-M05-10-ABROAD）");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      const res = await target.requestPrintEnPost([ABROAD_SHIPPING_ID]);
      expect(res.status()).toBe(200);
      expect(await res.text()).toContain(SLIP_HEADING);
    });

    test("E2E-M05-10-006 GET形式 ids[] で英語印刷URLへアクセス→HTTP200のHTMLが返る", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!ABROAD_SHIPPING_ID, "SLIP_ABROAD_SHIPPING_ID 未設定（要 SEED-M05-10-ABROAD）");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      const res = await target.requestPrintEnGet(`?ids[]=${ABROAD_SHIPPING_ID}`);
      expect(res.status()).toBe(200); // GET,POST 両許容
    });

    test("E2E-M05-10-011 成功応答のContent-Typeがtext/html(UTF-8想定)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!ABROAD_SHIPPING_ID, "SLIP_ABROAD_SHIPPING_ID 未設定（要 SEED-M05-10-ABROAD）");
      await login(page);
      const target = new OrderOrderPrintDeliverySlipsEnPage(page);
      const res = await target.requestPrintEnPost([ABROAD_SHIPPING_ID]);
      expect(res.status()).toBe(200);
      expect((res.headers()["content-type"] || "").toLowerCase()).toContain("text/html");
    });

    // 注: 手動（帳票本文表示＝E2E-...-015、明細30行改ページ/脚注/余り行＝E2E-...-016、印刷ボタン→window.print＝
    //   E2E-...-017、判定順序#4 会員・プレイヤー結合非表示＝E2E-...-018、検索状態非参照/クエリ非載せ＝E2E-...-019、
    //   同一注文複数配送IDの上書き＝E2E-...-020、海外限定抽出の空整形＝E2E-...-012、参照のみ更新なし＝E2E-...-013）と
    //   対象外（CSRF内部・ログ出力抑止・受注検索や出荷指示リスト等別機能委譲・例外時出力中断・ロック未使用・
    //   IT行089「値が変更される」=参照系で起こり得ず母集合誤生成）はケース表(付帯表1/2/2b)で全量管理し、specには残さない。
  }
);
