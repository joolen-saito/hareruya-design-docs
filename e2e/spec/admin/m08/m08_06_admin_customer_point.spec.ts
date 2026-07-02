/**
 * 管理画面 会員管理 ポイント付与・ポイント履歴（M08-06）E2E。納品ケース表
 * integration_test/e2e/m08_06_admin_customer_point_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースのみ実装し、破壊的（DB履歴追加）・乖離検出は test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m08-06_admin_customer_point.md / 観点表）の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来設計だが、刷新先 ec-cube-enterprise に同一画面
 * （admin_customer_point_select / admin_customer_point_history / admin_customer_point_update）が実在するためE2E化した。
 * 表示文言のうち i18n リソース(messages.ja.yaml)由来の語・Form 制約はオラクルにせず、設計が定める観測挙動で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m07/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報・会員シードが無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config.ts）
 *  - POINT_CUSTOMER_ID      : SEED-M08-06-CUSTOMER の会員ID（選手情報＋履歴あり）
 *  - POINT_FOREIGN_ORDER_NO : 当該会員が「持たない」8桁注文番号（DB相関エラー確認用 022）
 *  - POINT_OWNED_ORDER_NO   : 当該会員が「保有する」8桁注文番号（DB相関 正常系 012・破壊的fixme）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerPointPage } from "../../../pages/admin/m08/m08_06_admin_customer_point.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const CUSTOMER_ID = process.env.POINT_CUSTOMER_ID || "";
const HAS_CUSTOMER = HAS_CREDS && !!CUSTOMER_ID;
const FOREIGN_ORDER_NO = process.env.POINT_FOREIGN_ORDER_NO || "";

// 負系で「対象フィールド以外」を有効値で埋め、検証エラーを対象1項目に分離するための操作データ。
// 期待結果（対象項目のエラー＝付与されない）は設計由来でオラクル独立。値自体はオラクルではない。
// VALID_ISSUE_DATE: 発行日 single_text(YYYY-MM-DD) の有効値（操作データ）。
const VALID_ISSUE_DATE = "2025-01-01";
// VALID_NOTE_INDEX: 備考 select の先頭の有効選択肢（位置指定。文言に依存しない操作データ）。
const VALID_NOTE_INDEX = 0;

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const SELECT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/point/\\d+/select(\\?|$)`);
const HISTORY_GRANTED_RE = new RegExp(
  `/${ECCUBE_ADMIN_ROUTE}/customer/point/\\d+/granted(\\?|$)`
);

/** 管理ログインする（共通アカウント）。 */
async function adminLogin(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "会員管理 ポイント付与・ポイント履歴",
  { tag: ["@admin", "@customer", "@point"] },
  () => {
    // ===== 認証不要（常時実行可） =====

    test("E2E-M08-06-040 未ログインで種別選択URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/point/1/select`);
      await expect(page).toHaveURL(LOGIN_RE); // 遷移先＝管理ログイン画面（権限・認可: 未ログインはアクセス不可）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M08-06-041 未ログインで履歴確認URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/point/1/history`);
      await expect(page).toHaveURL(LOGIN_RE); // 遷移先＝管理ログイン画面
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== ログインのみ（会員シード不要） =====

    test("E2E-M08-06-050 存在しない会員IDの履歴確認→ページが見つからない(404)", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await adminLogin(page);
      // 十分大きいID＝未存在を想定（SEED-M08-06-NOCUSTOMER）。404 を期待（仕様: 会員なし→404）。
      const resp = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/customer/point/99999999/history`
      );
      expect(resp?.status()).toBe(404);
    });

    // ===== ログイン＋会員シード（SEED-M08-06-CUSTOMER） =====

    test("E2E-M08-06-001 種別選択画面に付与/利用の2カードが表示される", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID（SEED-M08-06-CUSTOMER）未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoSelect(CUSTOMER_ID);
      await pt.seeTypeSelect(); // 仕様: ポイント種別の選択画面（2種別）
    });

    test("E2E-M08-06-002 種別カード押下で当該種別の履歴確認画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoSelect(CUSTOMER_ID);
      await pt.typeCards.first().click(); // 付与(granted)カード（point_select.twig:14）
      await expect(page).toHaveURL(HISTORY_GRANTED_RE); // 履歴確認画面へ遷移
    });

    test("E2E-M08-06-003 履歴確認画面（granted）に付与フォームが表示される", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "granted");
      await pt.seeGrantForm(); // ポイント増減量入力欄＋「登録」ボタン
    });

    test("E2E-M08-06-004 履歴一覧（注文番号列含む）とポイント残高が表示される", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定（履歴あり）");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "granted");
      await pt.seeHistoryTable();
      // 注文番号列を含む複数列の見出し構造があること（構造で間接確認）。
      // 列見出しの文言（admin.common.order_number）・残高の数値は i18n/動的値のためオラクル化せず、
      // 列構造と履歴行の存在で間接確認する（厳密な列文言・残高値は要実機確認）。
      expect(await pt.historyHeaderColumnCount()).toBeGreaterThan(1);
      expect(await pt.historyRowCount()).toBeGreaterThan(0); // SEED-M08-06-CUSTOMER は履歴あり
    });

    test("E2E-M08-06-005 種別=履歴(history)では付与フォームを表示せず一覧のみ", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "history");
      await pt.seeHistoryTable();
      await expect(pt.registerButton).toHaveCount(0); // pointUpdateFlg=false（Controller.php:109）
    });

    test("E2E-M08-06-006 利用(purchase)種別でも当該種別の履歴一覧が表示される", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "purchase");
      // 仕様（業務ルール: ポイント種別ごとに履歴を表示する）。purchase 種別でも当該種別の履歴一覧が出ること。
      await pt.seeHistoryTable();
    });

    test("E2E-M08-06-020 ポイント増減量未入力→エラーで付与されない", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "granted");
      const before = await pt.historyRowCount();
      // 他項目は有効値で埋め、エラーを「ポイント変動 未入力」に分離する（設計: ポイント変動 必須）。
      await pt.submitGrant({
        pointChange: "",
        issueDate: VALID_ISSUE_DATE,
        noteIndex: VALID_NOTE_INDEX,
      });
      await expect(pt.error.first()).toBeVisible(); // エラー表示
      await expect(page).toHaveURL(HISTORY_GRANTED_RE); // 履歴画面に留まる（再表示）
      expect(await pt.historyRowCount()).toBe(before); // 履歴に追加されない
    });

    test("E2E-M08-06-021 ポイント増減量に数値以外→エラーで付与されない", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "granted");
      const before = await pt.historyRowCount();
      // 他項目は有効値で埋め、エラーを「ポイント変動 数値以外」に分離する（設計: ポイント変動は数値）。
      await pt.submitGrant({
        pointChange: "abc",
        issueDate: VALID_ISSUE_DATE,
        noteIndex: VALID_NOTE_INDEX,
      });
      await expect(pt.error.first()).toBeVisible();
      expect(await pt.historyRowCount()).toBe(before);
    });

    test("E2E-M08-06-022 当該会員が持たない注文番号→エラーで付与されない", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      test.skip(!FOREIGN_ORDER_NO, "POINT_FOREIGN_ORDER_NO（会員が持たない8桁注文番号）未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "granted");
      const before = await pt.historyRowCount();
      // 他項目は有効値で埋め、エラーを「注文番号の所有不一致」に分離する。
      await pt.submitGrant({
        orderNumber: FOREIGN_ORDER_NO,
        pointChange: "1",
        issueDate: VALID_ISSUE_DATE,
        noteIndex: VALID_NOTE_INDEX,
      });
      await expect(pt.error.first()).toBeVisible(); // DB相関エラー（注文番号は当該会員のものに限る）
      expect(await pt.historyRowCount()).toBe(before);
    });

    test("E2E-M08-06-023 残高を0未満にする増減量→エラーで付与されない", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "granted");
      const before = await pt.historyRowCount();
      // 他項目は有効値で埋め、エラーを「残高を0未満にする相関」に分離する（設計: 残高0未満不可）。
      await pt.submitGrant({
        pointChange: "-999999999",
        issueDate: VALID_ISSUE_DATE,
        noteIndex: VALID_NOTE_INDEX,
      });
      await expect(pt.error.first()).toBeVisible();
      expect(await pt.historyRowCount()).toBe(before);
    });

    // E2E-M08-06-024（注文番号8桁以外→エラー）はオラクル混入のため除去。
    // 設計「入力項目」表に注文番号の桁数定義は無く、8桁制約は Form の Regex('/^\d{8}$/')
    // （CustomerPointType.php:71）由来＝実装由来オラクル。注文番号入力欄自体も設計入力項目に未記載
    // （付帯表4 #2/#7・要確認）。ケース表側で対象外に再分類した。

    test("E2E-M08-06-030 検証失敗時はポイント履歴確認画面を再表示する", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoHistory(CUSTOMER_ID, "granted");
      // 他項目は有効値で埋め、検証失敗を設計必須の「ポイント変動 未入力」に分離する。
      await pt.submitGrant({
        pointChange: "",
        issueDate: VALID_ISSUE_DATE,
        noteIndex: VALID_NOTE_INDEX,
      });
      await expect(pt.registerButton).toBeVisible(); // 付与フォームが再表示される（仕様: 履歴画面再表示）
    });

    test("E2E-M08-06-060 会員編集のポイント管理リンクから種別選択画面へ遷移", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "POINT_CUSTOMER_ID 未設定");
      await adminLogin(page);
      const pt = new CustomerPointPage(page);
      await pt.gotoCustomerEdit(CUSTOMER_ID);
      // 「ポイント管理・履歴一覧」リンク（edit.twig:1038 admin.customer.point_type_select）。文言はi18n由来のため要実機確認。
      await page.getByRole("link", { name: "ポイント管理・履歴一覧" }).click();
      await expect(page).toHaveURL(SELECT_RE);
    });

    // ===== 保留（破壊的=DB履歴追加・仕様乖離検出。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M08-06-010 有効なポイント増減量で付与→履歴追加・履歴画面へ戻る（要: 専用会員/隔離・DB追加が破壊的）",
      async () => {
        // 期待は仕様(処理フロー Controller.php:83-97)由来。dtb_point_history 追加・dtb_player.point 更新を伴うため
        // SEED-M08-06-CUSTOMER を使い捨て/復元可能にしてから実装する。成功時は履歴一覧に増減量が追加表示される。
      }
    );

    test.fixme(
      "E2E-M08-06-011 備考未選択でも付与が成功する（設計:備考=任意 / 実装:備考必須＝乖離検出・付帯表4 #2）",
      async () => {
        // 期待は仕様(入力項目: 備考=任意)由来。実装は note 必須(CustomerPointType.php:85-93)のため失敗で検出見込み。
        // 破壊的（成功時はDB追加）のため専用会員で実装する。
      }
    );

    test.fixme(
      "E2E-M08-06-012 当該会員が保有する注文番号→付与が継続し履歴に追加される（正常系・破壊的=DB追加）",
      async () => {
        // 022（会員が持たない注文番号→エラー）の正常対。期待は仕様(業務ルール: 履歴に関連する注文番号を取得して表示)由来。
        // 当該会員が保有する8桁注文番号(POINT_OWNED_ORDER_NO)を入力し、付与継続→履歴一覧に追加表示されることを確認する。
        // 成功時は dtb_point_history 追加=破壊的のため SEED-M08-06-CUSTOMER を使い捨て/復元可能にしてから実装する。
      }
    );
  }
);
