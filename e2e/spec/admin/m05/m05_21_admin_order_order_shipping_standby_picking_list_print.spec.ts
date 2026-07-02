/**
 * 管理画面 受注管理 ピッキングリスト印刷 E2E（納品ケース表
 * integration_test/e2e/m05_21_admin_order_order_shipping_standby_picking_list_print_e2e_cases.md に対応）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-21_admin_order_order_shipping_standby_picking_list_print.md /
 * 観点表 / 基本設計)由来（オラクル独立性）。実装の現挙動・文言を期待値に流用しない。
 * 設計書(pf-eccube3 リバース)と刷新先 ec-cube-enterprise は、本ルートの処理フロー・画面構成が一致する
 * （編集画面のピッキング印刷ボタン→別ウィンドウ newwin へ #form_bulk を POST→picking_list.twig が単体HTMLを返す／
 *  存在しないidは404／印刷ボタンはブラウザ印刷に委ねる）。詳細・乖離はケース表 付帯表4。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 本specには「E2E自動化」ケースのみ実装する。手動/対象外(印刷物の集計内容・価格帯振り分け・色レラ抽出・
 * Foil表示・印刷ダイアログ・DB検索内部値・ログ抑止・本機能に非該当の入力バリデーション等)はケース表で全量管理し
 * specに残さない。仕様未確定(order_ids空集合のふるまい)は理由付き test.fixme で抜け漏れを可視化する。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が存在せず、既存 spec も
 * @playwright/test を直接使う。本specも既存規約（login.spec.ts / m05 系）に倣い
 * @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針: 資格情報（ECCUBE_ADMIN_USER/PASS）が無いと走らないよう test.skip でガードする。
 * 編集画面・印刷ページは有効な出荷指示リストID（受注が紐づくもの）を要する。STANDBY_ID 環境変数で供給する
 * （本機能は参照系で更新しないため非破壊。創作IDは使わない）。
 *
 * シード/環境変数（コミットしない）:
 *  - SEED-M05-21-ADMIN   : ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS（出荷指示リスト編集に到達できる管理者・2FA OFF）
 *  - SEED-M05-21-STANDBY : STANDBY_ID（受注が1件以上紐づく有効な dtb_shipping_standby のID）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { OrderOrderShippingStandbyPickingListPrintPage } from "../../../pages/admin/m05/m05_21_admin_order_order_shipping_standby_picking_list_print.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const STANDBY_ID = process.env.STANDBY_ID || "";
const HAS_STANDBY = !!(HAS_CREDS && STANDBY_ID);
// 存在しないID（404検証用）。十分大きな整数を使う。
const MISSING_ID = process.env.STANDBY_MISSING_ID || "999999999";

const LOGIN_RE = /\/login(\?|$)/;
const EDIT_RE = (id: string) => new RegExp(`/standby/${id}/edit(\\?|$)`);
// 別ウィンドウのPOST先（設計書: action=印刷URL・target=newwin）。子ウィンドウが印刷ルートに居ることを確認する。
const PRINT_RE = (id: string) => new RegExp(`/standby/${id}/print/picking(\\?|$)`);

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 受注管理 > ピッキングリスト印刷",
  { tag: ["@admin", "@order", "@print"] },
  () => {
    // ===== 権限・認可（資格情報不要・非破壊。常時実行可） =====

    test("E2E-M05-21-021 未ログインで印刷URL→管理ログイン画面へ誘導", async ({ page }) => {
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoPrint(STANDBY_ID || "1"); // 未ログインなら認証ガードが先に効く
      await expect(page).toHaveURL(LOGIN_RE);
    });

    test("E2E-M05-21-023 未ログインで編集URL→管理ログイン画面へ誘導", async ({ page }) => {
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoEdit(STANDBY_ID || "1");
      await expect(page).toHaveURL(LOGIN_RE);
    });

    test("E2E-M05-21-020 存在しないidで印刷URL→HTTP404", async ({ page }) => {
      test.skip(!HAS_CREDS, "SEED-M05-21-ADMIN 未設定（ECCUBE_ADMIN_USER/PASS）");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      // createNotFoundException（ShippingStandbyController.php:287-289）由来の404。
      const res = await target.getPrint(MISSING_ID);
      expect(res.status()).toBe(404);
    });

    // ===== 編集画面のUI部品（SEED-M05-21-STANDBY） =====

    test("E2E-M05-21-001 編集画面に「ピッキングリスト印刷」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定（ECCUBE_ADMIN_USER/PASS + STANDBY_ID）");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoEdit(STANDBY_ID);
      await target.seePrintPickingButton(); // 文言「ピッキングリスト印刷」（仕様 trans 由来）
    });

    test("E2E-M05-21-002 編集画面に一括フォーム・全選択チェック・受注チェック(初期オン)が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoEdit(STANDBY_ID);
      await target.seeBulkFormChecked(); // #form_bulk / #check-all / order_ids[*] checked
    });

    // ===== 別ウィンドウ印刷（SEED-M05-21-STANDBY・受注あり） =====

    test("E2E-M05-21-010 印刷ボタン押下で別ウィンドウにピッキング単体ページが開く", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoEdit(STANDBY_ID);
      const child = await target.clickPrintAndGetChild(); // newwin へ #form_bulk を POST
      // 子ウィンドウが印刷ルート（action差替先）に居ること（設計書: action=印刷URL・target=newwin）。
      await expect(child).toHaveURL(PRINT_RE(STANDBY_ID));
      await target.seePrintPage(child); // 印刷ボタン #printButton が表示される（文言固定はしない）
    });

    test("E2E-M05-21-011 印刷ウィンドウを開いても親画面は編集画面のまま", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoEdit(STANDBY_ID);
      await target.clickPrintAndGetChild();
      await expect(page).toHaveURL(EDIT_RE(STANDBY_ID)); // 親URLは編集画面のまま不変
    });

    // ===== 印刷単体ページ（直接GET。SEED-M05-21-STANDBY） =====

    test("E2E-M05-21-015 印刷URL(GET)に有効idで直接アクセス→HTTP200・text/html", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      const res = await target.getPrint(STANDBY_ID, 5);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"] || "").toContain("text/html");
    });

    test("E2E-M05-21-013 印刷単体ページは共通管理フレームを使わない単体HTMLである", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoPrint(STANDBY_ID);
      await target.seeStandalonePage(); // .printBox / #printButton / .ContentsAll のみ
    });

    test("E2E-M05-21-014 印刷単体ページが pickinglist.css を読み込む", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoPrint(STANDBY_ID);
      await target.seePickingListCss(); // href に assets/css/pickinglist.css
    });

    test("E2E-M05-21-016 印刷単体ページは <title> を持つ単体HTMLである", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoPrint(STANDBY_ID);
      // 設計書「印刷用の単体HTMLを返す」由来。<title> が存在し非空であることを確認する。
      // タイトル文言「ピッキングリスト」は実装(Twig静的文言)由来のため期待値固定しない（オラクル独立性）。
      await expect(page).toHaveTitle(/.+/);
    });

    test("E2E-M05-21-012 印刷単体ページに列見出し(No〜備考)が表示される", async ({ page }) => {
      test.skip(!HAS_STANDBY, "SEED-M05-21-STANDBY 未設定（対象帯に明細がある受注が前提）");
      await login(page);
      const target = new OrderOrderShippingStandbyPickingListPrintPage(page);
      await target.gotoEdit(STANDBY_ID);
      // 列見出しは明細がある帯に対してのみ描画される（picking_list.twig は items|length>0 のときに表を出す）。
      // GET直叩きは order_ids 空で明細が出ない場合があるため、設計書の主経路（order_ids を POST する別ウィンドウ）で確認する。
      const child = await target.clickPrintAndGetChild();
      await expect(child).toHaveURL(PRINT_RE(STANDBY_ID));
      await target.seeColumnHeaders(child);
    });

    // ===== 保留（仕様未確定・要確認。理由付きで未実行・抜け漏れ可視化） =====

    test.fixme(
      "E2E-M05-21-022 全チェックを外して印刷→order_idsが空集合（空結果か実行時エラーかは設計書上未確定・要実機確認）",
      async () => {
        // 期待は仕様(利用者視点の入口/エラー処理)由来だが、空配列INのORM/DB方言依存でふるまいが定まらない
        // （ケース表 付帯表4#1）。実機確認後、空集合扱い(明細なし)または例外のいずれかを確定して実装する。
        void ECCUBE_ADMIN_ROUTE;
      }
    );
  }
);
