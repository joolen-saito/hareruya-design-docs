/**
 * 管理画面 受注管理 出荷指示「納品書印刷（英語）」E2E。
 * 納品ケース表 integration_test/e2e/m05_23_admin_order_order_shipping_standby_print_delivery_slips_en_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 【screenExists=true】刷新先 ec-cube-enterprise に本機能は実在する（入口 admin_shipping_standby_edit /
 *   印刷ルート admin_shipping_standby_print_delivery_slips（lang=ja|en）/ delivery_slips.en.twig）。
 *   本specには「E2E自動化」ケースのみ実装し、手動（帳票フォーマット内容・国内配送のみの薄い紙面・
 *   CSSレイアウト・検索抽出の帳票反映・参照のみ）/対象外（CSRF内部・ログ抑止・DB検索のレコード単位確認・
 *   別機能委譲）はケース表で全量管理する（規約「手動/対象外はspecに残さない」）。
 *
 * 期待結果は仕様（正本md / 設計HTML / テスト観点表）由来（オラクル独立性）。表示文言も設計書本文の記載を
 *   根拠とし、実装リソース（messages.ja.yaml の翻訳値）・現挙動・Form制約・Cookie名は期待値に固定しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行ガード:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS が無ければ test.skip（資格情報なしでは未認証系のみ実行可）。
 *  - 編集UI/POST正常系は出荷指示リスト（受注を含む）が必要。既存リストの整数主キーを env STANDBY_ID で与える。
 *    未指定なら当該テストは skip（シード不足を仕様不具合の失敗と誤認しない）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingStandbyPrintDeliverySlipsEnPage } from "../../../pages/admin/m05/m05_23_admin_order_order_shipping_standby_print_delivery_slips_en.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 受注を含む既存の出荷指示リストの整数主キー（SEED-M05-23-STANDBY）。未指定なら関連テストは skip。
const STANDBY_ID = process.env.STANDBY_ID || "";
// 存在しないと見込める出荷指示リスト主キー（判定順序#1 の HTTP404 用）。
const MISSING_STANDBY_ID = process.env.MISSING_STANDBY_ID || "999999999";

// 未ログイン誘導の遷移先＝管理ログイン画面URL（権限・認可・設計書「管理画面共通のログイン誘導」由来）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const EDIT_RE = /\/standby\/\d+\/edit(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

/** STANDBY_ID 配下の編集画面を開き、チェック対象（受注行）を読み込む。 */
async function gotoEditWithRows(
  page: Page,
  target: OrderOrderShippingStandbyPrintDeliverySlipsEnPage
): Promise<number> {
  await target.gotoEdit(STANDBY_ID);
  return target.rowCheckboxes.count();
}

test.describe(
  "管理画面 受注管理 出荷指示 > 納品書印刷（英語）",
  { tag: ["@admin", "@order", "@print"] },
  () => {
    // ===== 未認証ガード（資格情報不要・常時実行可） =====

    test("E2E-M05-23-030 未ログインで英語印刷URLへ直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      // 期待は権限・認可／利用者視点の入口（管理ログイン要）由来。
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/standby/${MISSING_STANDBY_ID}/print/delivery/en`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M05-23-031 未ログインで出荷指示リスト編集URLへ直接アクセス→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/standby/${MISSING_STANDBY_ID}/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 異常系: 404（要ログインのみ。STANDBY_ID 任意） =====

    test("E2E-M05-23-020 存在しない{id}で英語印刷URLへPOST→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      // 判定順序#1: 出荷指示{id}が存在しなければ NotFound。order_ids を付けても{id}解決で先に404。
      const res = await target.requestPrintPost(MISSING_STANDBY_ID, [1]);
      expect(res.status()).toBe(404);
    });

    test("E2E-M05-23-024 lang要件外(ja|en以外)のパスは解決されずHTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const res = await page.request.get(
        `/${ECCUBE_ADMIN_ROUTE}/standby/${MISSING_STANDBY_ID}/print/delivery/xx`
      );
      expect(res.status()).toBe(404); // requirements lang=ja|en によりルート非マッチ
    });

    test("E2E-M05-23-021 order_idsを付けず英語印刷URLへPOST→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      // 判定順序#2: order_ids が空（キー無し）なら NotFound。
      const res = await target.requestPrintPost(STANDBY_ID, []);
      expect(res.status()).toBe(404);
    });

    test("E2E-M05-23-022 GETのみ(order_ids無し)で英語印刷URLへアクセス→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      // 設計書: 通常GETでは order_ids が読み取れずHTTP404。メソッドはルート上許可される。
      const res = await target.requestPrintGet(STANDBY_ID);
      expect(res.status()).toBe(404);
    });

    // ===== 入口（出荷指示リスト編集）UI・権限（要ログイン＋ STANDBY_ID） =====

    test("E2E-M05-23-032 ログイン管理者は出荷指示リスト編集画面を利用できる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      await target.gotoEdit(STANDBY_ID);
      await expect(page).toHaveURL(EDIT_RE); // ログイン画面へ送られず編集画面に留まる
      await expect(target.formBulk).toBeVisible();
    });

    test("E2E-M05-23-001 編集画面に「納品書印刷（英語）」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      await target.gotoEdit(STANDBY_ID);
      await target.seePrintEnButton(); // trans admin.order.print_delivery_slips_en
    });

    test("E2E-M05-23-002 各受注行に既定オンのorder_idsチェックボックスと一括選択が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      await target.seeRowCheckboxes(); // 既定オン＋#check-all
    });

    test("E2E-M05-23-003 form_bulk内にピッキング/納品書(日)/納品書(英)/他出力ボタンが並ぶ", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      await target.gotoEdit(STANDBY_ID);
      await target.seeBulkButtons();
    });

    test("E2E-M05-23-016 ヘッダ一括選択(#check-all)で全受注行チェックが連動する", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      // 設計書（正本md:50「ヘッダの#check-all は列一括選択と連動する」）由来。
      await target.seeCheckAllTogglesRows();
    });

    test("E2E-M05-23-017 一部の受注行のみチェックして英語印刷→残した受注のみでHTTP200", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows < 2, "複数受注行が必要（要 SEED-M05-23-STANDBY 複数受注）");
      // 正常系×異常系の対（023=全解除→404 の正常側）。設計書 処理フロー#6・データ整合性
      // 「送信されるのは当該画面のチェック由来の order_ids のみ」由来。先頭行を外し、残した受注のみPOST。
      await target.uncheckRowAt(0);
      const remaining = await target.getCheckedOrderIds();
      test.skip(remaining.length === 0, "残るチェック受注が無い");
      const res = await target.requestPrintPost(STANDBY_ID, remaining);
      expect(res.status()).toBe(200); // 残した受注に配送があれば判定順序#3を通過しHTTP200
    });

    test("E2E-M05-23-010 チェック保持で押下→子ウィンドウに英語納品書(タイトル「納品書」)が開く", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      const popup = await target.clickPrintEnAndGetPopup(); // newwin を開き en へ POST
      await expect(popup).toHaveTitle("納品書"); // delivery_slips.en.twig:19
    });

    test("E2E-M05-23-011 子ウィンドウの英語納品書に印刷ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      const popup = await target.clickPrintEnAndGetPopup();
      await target.seeSlipPage(popup); // タイトル「納品書」＋印刷する
    });

    test("E2E-M05-23-012 「納品書印刷（英語）」押下後も親タブは編集画面のまま", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      await target.clickPrintEnAndGetPopup(); // 子ウィンドウへ出力
      await expect(page).toHaveURL(EDIT_RE); // 親タブは編集画面のまま（設計書: 画面遷移）
    });

    test("E2E-M05-23-023 全行チェックを外し画面から押下(order_ids空)→クライアントアラート無し・子ウィンドウHTTP404", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      // エッジケース（設計書 正本md:117）: 全行のチェックを外して押下しても、クライアント側の
      // 未選択アラートは無く（edit.twig:29-34 に preventなし）、子ウィンドウへ常時POSTされ
      // order_ids が空となりサーバでHTTP404。実ブラウザ経路（uncheck→押下→子ウィンドウ応答）で観測する。
      let dialogFired = false;
      page.on("dialog", async (d) => {
        dialogFired = true;
        await d.dismiss();
      });
      await target.uncheckAllRows();
      const { status } = await target.clickPrintEnAndGetPopupResponse();
      expect(status).toBe(404);
      expect(dialogFired).toBe(false); // 未選択アラートは出ない（設計書: クライアント側アラート無し）
      await expect(page).toHaveURL(EDIT_RE); // 親タブは編集画面のまま（自動遷移しない）
    });

    test("E2E-M05-23-026 チェック済み受注が当該リストに属さない→配送ID集合空でHTTP404", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      // 判定順序#3（設計書 正本md:37,97）: order_ids が当該出荷指示リストに属さなければ
      // 対象受注が残らず配送ID集合が空となりHTTP404。リスト外と見込める受注IDをPOSTする。
      const res = await target.requestPrintPost(STANDBY_ID, [MISSING_STANDBY_ID]);
      expect(res.status()).toBe(404);
    });

    // ===== 直接リクエスト正常系（要ログイン＋ STANDBY_ID＋海外配送を含む受注） =====

    test("E2E-M05-23-013 有効なorder_idsで英語印刷URLへPOST→HTTP200のHTMLが返る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      // 画面のチェック済み受注ID（既定オン）から order_ids を組む。
      const orderIds = await target.rowCheckboxes.evaluateAll((els) =>
        els
          .map((el) => (el as HTMLInputElement).getAttribute("name") || "")
          .map((n) => (n.match(/order_ids\[(\d+)\]/) || [])[1])
          .filter((v): v is string => !!v)
      );
      const res = await target.requestPrintPost(STANDBY_ID, orderIds);
      expect(res.status()).toBe(200);
    });

    test("E2E-M05-23-014 成功応答のContent-Typeがtext/html(UTF-8想定)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!STANDBY_ID, "STANDBY_ID 未設定（要 SEED-M05-23-STANDBY）");
      await login(page);
      const target = new OrderOrderShippingStandbyPrintDeliverySlipsEnPage(page);
      const rows = await gotoEditWithRows(page, target);
      test.skip(rows === 0, "出荷指示リストに受注行が無い（要 SEED-M05-23-STANDBY）");
      const orderIds = await target.rowCheckboxes.evaluateAll((els) =>
        els
          .map((el) => (el as HTMLInputElement).getAttribute("name") || "")
          .map((n) => (n.match(/order_ids\[(\d+)\]/) || [])[1])
          .filter((v): v is string => !!v)
      );
      const res = await target.requestPrintPost(STANDBY_ID, orderIds);
      expect(res.status()).toBe(200);
      expect((res.headers()["content-type"] || "").toLowerCase()).toContain("text/html");
    });

    // ===== 保留（理由付きで未実行・抜け漏れ可視化。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M05-23-025 チェック受注に配送が無く配送ID集合が空→HTTP404（要: 配送なし受注を含む出荷指示リストのシード）",
      async () => {
        // 期待は仕様（判定順序#3 / ShippingStandbyController.php:425-427）由来。
        // 配送を持たない受注を含む出荷指示リストのシード（SEED-M05-23-NOSHIP）を投入後に実装。
      }
    );

    test.fixme(
      "E2E-M05-23-015 国内配送のみの受注を選んだ英語印刷→HTTP200の薄い紙面（要: 国内配送のみのシード）",
      async () => {
        // 期待は仕様（判定順序#4 / 正本md:98「国内のみは海外結合に残らずHTTP200のまま薄い紙面」）由来。
        // 海外結合に残らず DeliverySlips が空配列になりうるが HTTPステータスは200。
        // 国内配送のみ（is_abroad=0）の受注を含む出荷指示リスト（SEED-M05-23-DOMESTIC）投入後に実装。
        // 紙面（印刷ボタンと外枠のみ）の内容検査は手動。
      }
    );

    // 注: 手動（帳票フォーマット内容＝IT-18、国内配送のみの薄い紙面＝IT-03外部画面、CSSレイアウト＝IT-25、
    //   検索抽出の帳票反映＝IT-03/IT-15対象データ、参照のみ更新なし＝IT-26）と
    //   対象外（CSRF内部・ログ出力抑止＝IT-20・DB検索のレコード単位確認＝IT-23・別機能委譲・数値形式バリデーション不在）は
    //   ケース表(付帯表1/2/2b)で全量管理し、specには残さない。
  }
);
