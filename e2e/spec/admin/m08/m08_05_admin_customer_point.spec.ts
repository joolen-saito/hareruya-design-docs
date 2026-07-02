/**
 * 管理画面 会員管理 — ポイント付与・ポイント履歴 E2E。
 * 納品ケース表 integration_test/e2e/m08_05_admin_customer_point_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち安全に実行できるケース（表示・バリデーション失敗・404・未認証ガード）を置き、
 * 破壊的（履歴追加・残高更新を伴う）付与成功（010/011/012）は test.fixme として残す（手動/対象外はケース表で全量管理）。
 * 期待結果は仕様（正本md functions/pf-eccube3/m08-05_admin_customer_point.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * 設計書は現行 pf-eccube3 のリバースであり、ec-cube-enterprise実装との乖離（POSTパス・必須項目・項目名・type=history）は
 * ケース表 付帯表4 の不具合候補で管理する。テストは仕様どおりに書き、実装が違えば落ちて検出する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * シード/環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - CUSTOMER_POINT_CUSTOMER_ID            : SEED-M08-05-CUSTOMER の対象会員ID（履歴・残高・付与対象）
 *  - CUSTOMER_POINT_UNOWNED_ORDER_NO       : 当該会員が保有しない8桁注文番号（023 相関エラー用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminCustomerPointPage } from "../../../pages/admin/m08/m08_05_admin_customer_point.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const CUSTOMER_ID = process.env.CUSTOMER_POINT_CUSTOMER_ID || "";
const HAS_CUSTOMER = HAS_CREDS && !!CUSTOMER_ID;
const UNOWNED_ORDER_NO = process.env.CUSTOMER_POINT_UNOWNED_ORDER_NO || "00000000";

const LOGIN_RE = /\/login(\?|$)/;
const HISTORY_RE = /\/customer\/point\/\d+\/(history|granted|purchase)(\?|$)/;

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 会員管理 ポイント付与・ポイント履歴",
  { tag: ["@admin", "@customer", "@point"] },
  () => {
    // ===== 権限・認可 / URL直接アクセス（資格情報不要・非破壊） =====

    test("E2E-M08-05-050 未ログインで履歴URL直接→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      const target = new AdminCustomerPointPage(page);
      await page.goto(target.historyUrl(CUSTOMER_ID || 1, "granted"));
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M08-05-051 未ログインで種別選択URL直接→管理ログイン画面へ誘導", async ({
      page,
    }) => {
      const target = new AdminCustomerPointPage(page);
      await page.goto(target.selectUrl(CUSTOMER_ID || 1));
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== HTTPステータス（資格情報のみ・非破壊） =====

    test("E2E-M08-05-040 存在しない会員IDのポイント履歴URLは404", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const resp = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/customer/point/99999999/granted`
      );
      expect(resp?.status(), "存在しない会員IDは404となること").toBe(404);
    });

    // ===== 表示（SEED-M08-05-CUSTOMER・非破壊） =====

    test("E2E-M08-05-001 ポイント種別選択画面が表示される", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定（CUSTOMER_POINT_CUSTOMER_ID）");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoSelect(CUSTOMER_ID);
      await target.seeTypeSelect(); // 付与・購入の2つの種別カード
    });

    test("E2E-M08-05-002 種別選択から当該種別のポイント履歴画面へ遷移する", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoSelect(CUSTOMER_ID);
      await target.clickFirstTypeCard();
      await expect(page).toHaveURL(HISTORY_RE); // admin_customer_point_history へ遷移
    });

    test("E2E-M08-05-003 ポイント履歴画面に付与フォームと履歴一覧が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "granted");
      await target.seeHistoryWithForm();
    });

    test("E2E-M08-05-004 履歴一覧に注文番号を含む見出し列が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "granted");
      // 見出し「注文番号」(admin.common.order_number messages.ja.yaml:1664 / point_update.twig:115)
      await expect(
        target.historyTable.getByText("注文番号", { exact: false })
      ).toBeVisible();
    });

    test("E2E-M08-05-005 会員の保有ポイント残高が表示される", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "granted");
      // 残高表示（point_update.twig:105 Customer.Player.point）。ラベル文言は実装ハードコードのため部分一致で確認。
      await expect(page.getByText("ポイント残高", { exact: false })).toBeVisible();
    });

    test("E2E-M08-05-006 history種別のポイント履歴画面に当該会員の履歴一覧が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "history");
      // 期待は仕様（正本md:65,76,90「{type}のポイント履歴一覧を表示」）由来。
      // history種別自体が実装固有の概念で、設計はhistory/granted/purchaseの区別を明記しない（付帯表4#4）。
      // 付与フォームの表示有無は設計に根拠が無く（設計はGET {type}でフォーム表示と記述）、実装は
      // pointUpdateFlg=false で非表示にする乖離があるため、フォーム表示有無はオラクル化せず付帯表4#4の要確認に委ねる。
      await expect(target.historyTable).toBeVisible(); // 履歴一覧は表示（設計由来）
    });

    // ===== バリデーション失敗（非破壊：保存に至らずDBを変えない・要シード） =====
    // 失敗判定は仕様（検証失敗→履歴画面を再表示・付与されない）由来。各項目エラーの実描画セレクタは要実機確認のため
    // 「成功フラッシュ非表示＋履歴画面に留まる」で観測する（実装の個別文言をオラクル化しない）。

    test("E2E-M08-05-020 ポイント増減量未入力→エラーで付与されない", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "granted");
      // 増減量(必須)未入力を分離して観測するため、他の項目は満たす（失敗理由を増減量に限定）。
      await target.grant({ pointChange: "", note: "キャンペーン", issueDate: "2026-06-19" });
      await expect(target.successFlash).toHaveCount(0); // 保存成功とならない
      await expect(page).toHaveURL(HISTORY_RE); // ポイント履歴画面に留まる
      await expect(target.form).toBeVisible(); // 検証失敗→履歴画面（付与フォーム）を再表示（正本md:96,192）
    });

    test("E2E-M08-05-021 ポイント増減量に整数以外→エラーで付与されない", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "granted");
      // 整数以外を分離して観測するため他項目は満たす（失敗理由を増減量に限定）。
      await target.grant({ pointChange: "1.5", note: "キャンペーン", issueDate: "2026-06-19" }); // 整数以外（数値バリデーション）
      await expect(target.successFlash).toHaveCount(0);
      await expect(page).toHaveURL(HISTORY_RE);
      await expect(target.form).toBeVisible(); // 検証失敗→履歴画面を再表示（正本md:96,192）
    });

    test("E2E-M08-05-022 残高をマイナスにする増減量→エラーで付与されない", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "granted");
      // 他項目を満たした上で残高を0未満にする負値。期待は仕様「残高を0未満にできない＝付与されない」由来。
      await target.grant({
        pointChange: "-999999",
        note: "キャンペーン",
        issueDate: "2026-06-19",
      });
      await expect(target.successFlash).toHaveCount(0);
      await expect(page).toHaveURL(HISTORY_RE);
      await expect(target.form).toBeVisible(); // 検証失敗→履歴画面を再表示（正本md:96,192）
    });

    test("E2E-M08-05-023 会員が保有しない注文番号→エラーで付与されない", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-05-CUSTOMER 未設定");
      await login(page);
      const target = new AdminCustomerPointPage(page);
      await target.gotoHistory(CUSTOMER_ID, "granted");
      await target.grant({
        pointChange: "100",
        note: "キャンペーン",
        issueDate: "2026-06-19",
        orderNumber: UNOWNED_ORDER_NO, // 当該会員が保有しない注文番号
      });
      await expect(target.successFlash).toHaveCount(0);
      await expect(page).toHaveURL(HISTORY_RE);
      await expect(target.form).toBeVisible(); // 検証失敗→履歴画面を再表示（正本md:96,192）
    });

    // ===== 破壊的（履歴追加・残高更新を伴う付与成功）＝ test.fixme で抜け漏れ可視化 =====

    test.fixme(
      "E2E-M08-05-010 有効入力でポイント付与→保存成功（要: 使い捨て/専用会員・後始末）",
      async () => {
        // 期待は仕様（検証成功→履歴追加・成功）由来。成功フラッシュ admin.common.save_complete を観測する。
        // note/issueDate は実装が必須（不具合候補#2）のため値が要る。履歴と残高を変えるため専用会員で実行する。
      }
    );

    test.fixme(
      "E2E-M08-05-014 備考未入力でも有効な増減量で付与できる（備考任意の正常系・要: 専用会員）",
      async () => {
        // 期待は仕様（正本md:114 備考 任意／md:97 検証成功→履歴追加）由来。備考を空のまま増減量に有効値で付与し成功を観測する。
        // 実装は note 必須（不具合候補#2）のため、テストは仕様どおり（備考未入力でも成功）に書き、実装が違えば落ちて乖離を検出する。
        // 履歴と残高を変えるため専用/使い捨て会員で実行する。
      }
    );

    test.fixme(
      "E2E-M08-05-011 付与成功後はポイント履歴画面（admin_customer_point_history）へ戻る（要: 専用会員）",
      async () => {
        // 期待は仕様（付与成功→履歴画面へ戻る）由来。POSTパスは実装 .../{type}（設計 .../update/{type} と乖離＝不具合候補#1）。
      }
    );

    test.fixme(
      "E2E-M08-05-012 付与成功後は履歴一覧に追加行が表示される（間接・要: 専用会員）",
      async () => {
        // 期待は仕様（dtb_point_history 追加）由来。付与前後の履歴件数差分＋入力した増減量で間接確認する。
      }
    );

    test.fixme(
      "E2E-M08-05-030 なりすまし対策トークン不正のPOSTでは付与されない（要: 改変POST・専用会員）",
      async () => {
        // 期待は仕様（正本md:193「なりすまし対策トークン不正→付与を行わない」）由来。
        // _token を改変して付与POSTを送出し、保存成功とならず履歴が増えないことを観測する。
        // 出力（付与されない＝履歴件数不変）はブラウザで観測可能なため対象外ではなく自動化予定/手動とする。
        // 改変POSTの送出（hidden _token 操作）が必要なため fixme で残す。
      }
    );
  }
);
