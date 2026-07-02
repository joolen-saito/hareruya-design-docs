/**
 * 管理画面 店舗設定／利用規約（m10_03）E2E。未実行雛形。
 * 納品ケース表 integration_test/e2e/m10_03_admin_base_setting_setting_shop_customer_agreement_e2e_cases.md に対応。
 * 期待結果は仕様（pf-eccube3 正本 functions/pf-eccube3/m10-03_admin_base_setting_setting_shop_customer_agreement.md）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 【screenExists=false】pf-eccube3 の専用画面「利用規約設定画面」
 *  （/{admin_route}/setting/shop/customer_agreement・単一「利用規約」textarea(NotBlank)・ボタン「規約を登録」・
 *   保存先 dtb_help.customer_agreement）は刷新先 ec-cube-enterprise に存在しない（機能移設）。
 *  利用規約本文の編集はページ管理（コンテンツ管理）側の固定ページ編集（page_edit.twig の ?return=agreement モード・
 *  ルート admin_content_page_edit）へ委譲されている＝別機能 m09_04（admin_content_content_page）。
 *  詳細はケース表 付帯表4（不具合候補・仕様乖離#1〜#7。#5=保存後の?return=agreement不保持・#6=既定ページreadOnly本文編集不可・#7=委譲先m09_04）を参照。
 *
 * 【方針】原画面が刷新先に無いため自動化の実装済みは 0（区分は「未実装(要確認)」。ケース表の自動化候補=要実機確認7件に対応）。
 *  （区分は「未実装(要確認)」。ケース表の自動化候補=要実機確認12件に対応。うち本spec掲載は観測可能な E2E-001〜005,007,009。手動/間接の010〜012はケース表のみ）。
 *  観測可能なのは移行先(ページ編集)の最小スモークのみ。編集フォーム本体は MainEditType（getBlockPrefix=main_edit。
 *  MainEditType.php:278）で #main_edit_tpl_data は実装確定（page_edit.twig:70・創作でない）。PageType(admin_page)は
 *  レイアウト副フォームのみ。未確定は entry route（利用規約ページ page id=19 への到達導線）と本文編集可否（#6）のため、
 *  本specは全件 test.fixme（理由付き・抜け漏れ可視化）とする。
 *  手動/対象外（CSRF・ログ抑止・dtb_help内部値・数値/文字種/相関バリデーション非該当 等）はケース表で全量管理しspecに残さない。
 *  利用規約本文編集の網羅的 E2E は m09_04 の spec へ委譲するのが正しい（仕様乖離#7）。
 *
 * 認証について: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、既存の
 * spec/admin/login.spec.ts・m05-m09/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報（ECCUBE_ADMIN_USER/PASS）が無ければ走らないよう test.skip(!HAS_CREDS) でガードする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopCustomerAgreementPage } from "../../../pages/admin/m10/m10_03_admin_base_setting_setting_shop_customer_agreement.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// 移行先の利用規約ページ page id。初期データ上 help_agreement は id=19（dtb_page.csv:34 / Page::AGREEMENT_PAGE_ID=19）。
// entry route 解決導線（id をどの導線から得るか）は未確定＝要実機確認のため、既定値は実在 id=19 を用いて
// 未認証テストが実在しない /content/page/0/edit に化けて素通り合格するのを防ぐ。
const AGREEMENT_PAGE_ID = Number(process.env.AGREEMENT_PAGE_ID || "19");

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const PAGE_EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/content/page/\\d+/edit`);

/** 管理者ログインして移行先の利用規約ページ編集画面を開く（要実機確認の補助関数）。 */
async function gotoAgreementEditAsAdmin(
  page: Page
): Promise<BaseSettingSettingShopCustomerAgreementPage> {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
  const target = new BaseSettingSettingShopCustomerAgreementPage(page);
  await target.gotoEdit(AGREEMENT_PAGE_ID);
  return target;
}

test.describe(
  "管理画面 > 店舗設定／利用規約（刷新先はページ管理へ機能移設）",
  { tag: ["@admin", "@setting", "@agreement"] },
  () => {
    // 全件 test.fixme: screenExists=false（原画面が刷新先に無い）かつ entry route/DOM id 要実機確認のため未実装。
    // 期待結果は pf-eccube3 仕様由来。実機確認後、移行先(ページ編集)で観測できる範囲を実装する（または m09_04 へ委譲）。

    test.fixme(
      "E2E-M10-03-001 移行先の利用規約編集画面へ到達する（移行先スモーク。原仕様の「ショップ設定/利用規約管理/規約を登録」は不具合候補#1）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 原仕様オラクル（正本md:80）は「ショップ設定」「利用規約管理」「規約を登録」。本ケースは移行先到達の観測スモークで、
        // 「利用規約設定」表示は移行先実測値であって合格オラクルではない。原仕様文言を移行先が出さないこと自体が不具合候補#1の検出対象。
        const target = await gotoAgreementEditAsAdmin(page);
        await target.seeAgreementEditScreen();
      }
    );

    test.fixme(
      "E2E-M10-03-002 GETで移行先編集画面を開くと当編集画面が表示される（要: page id 解決）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様(画面遷移: GETで当編集画面表示)由来。
        const target = await gotoAgreementEditAsAdmin(page);
        await expect(page).toHaveURL(PAGE_EDIT_RE);
        await expect(target.editForm).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M10-03-003 ROLE_ADMIN・権限拒否なしで編集画面の表示・保存ができる（要: 権限マスタ状態確認）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様(権限・認可)由来。
        const target = await gotoAgreementEditAsAdmin(page);
        await expect(target.registerButton).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M10-03-004 本文を編集し登録すると編集画面へリダイレクトし登録完了メッセージが表示される（要: 本文編集可否・完了メッセージキー確認）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様(処理フロー: POST成功→同一編集画面へリダイレクト＋登録完了メッセージ)由来。
        // 【要確認・不具合候補#6】help_agreement は edit_type=2(既定ページ)で editor が readOnly のため本導線では本文編集できない可能性。
        // 【要確認・不具合候補#5】form action / redirect は locale のみで ?return=agreement を落とすため、保存後は
        //  「利用規約設定」モードが維持されない（通常のページ管理表示に戻る）可能性。URL は接頭辞のみ検証する。
        const target = await gotoAgreementEditAsAdmin(page);
        await target.fillBody("利用規約本文 E2E-MARKER");
        await target.submitRegister();
        await expect(page).toHaveURL(PAGE_EDIT_RE);
        // 完了メッセージの正確なキー/文言は実機確認後に仕様(登録完了メッセージ)で確定する。
      }
    );

    test.fixme(
      "E2E-M10-03-005 必須項目を空にして登録すると保存されず同一画面にフィールドエラーが表示される（要: 必須項目特定）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様(判定順序#2 Validator・処理フロー: POST失敗→再描画＋フィールドエラー・保存しない)由来。
        const target = await gotoAgreementEditAsAdmin(page);
        await target.fillBody("");
        await target.submitRegister();
        await expect(target.fieldError.first()).toBeVisible();
        await expect(page).toHaveURL(PAGE_EDIT_RE);
      }
    );

    test.fixme(
      "E2E-M10-03-006 登録後にフロントの利用規約ページに保存した本文が反映される（手動/間接・要: フロント規約ページURL確認）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様(データ整合性: 管理画面とフロントが同一行を参照)由来。フロントテンプレートは別機能のため間接確認。
        // 【要確認・不具合候補#6】既定ページ(edit_type=2)は editor readOnly のため本導線で本文編集できない可能性。
        const target = await gotoAgreementEditAsAdmin(page);
        await target.fillBody("利用規約本文 E2E-FRONT-MARKER");
        await target.submitRegister();
        // フロント利用規約ページを開き E2E-FRONT-MARKER の表示を確認（URLは要実機確認）。
      }
    );

    test.fixme(
      "E2E-M10-03-007 未ログインで利用規約編集URLへアクセスすると管理ログイン画面へ誘導される（要: entry route確定）",
      async ({ page }) => {
        // 資格情報不要。期待は仕様(権限・認可: 未認証→管理ログイン誘導)由来。
        const target = new BaseSettingSettingShopCustomerAgreementPage(page);
        await target.gotoEdit(AGREEMENT_PAGE_ID);
        await expect(page).toHaveURL(LOGIN_RE);
        await expect(page.locator("#login_id")).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M10-03-008 登録成功時に本文と更新日が更新される（手動/間接・要: 本文編集可否・更新日表示確認）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様(DB操作: 本文/update_date更新の間接確認)由来。刷新先は dtb_help ではなく dtb_page 側（不具合候補#3）。
        // 更新日ラベルは「更新日」(messages.ja.yaml:1643)。【要確認・不具合候補#6】既定ページは editor readOnly のため本文更新できない可能性。
        const target = await gotoAgreementEditAsAdmin(page);
        await target.fillBody("利用規約本文 E2E-UPDATE-" + Date.now());
        await target.submitRegister();
        await target.gotoEdit(AGREEMENT_PAGE_ID);
        await expect(target.updateDateLabel).toBeVisible();
      }
    );

    test.fixme(
      "E2E-M10-03-009 CSRFトークン欠落/改ざんのPOSTでは保存されず送信が成立しない（判定順序#1の異常系。要: CSRFトークン名/挙動の実機確認）",
      async ({ page }) => {
        test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
        // 期待は仕様(保存処理の判定順序#1・エラー処理: CSRF失敗→送信成立せず副作用なし。正本md:127,237)由来。
        // E2E-004(成功POST)に対する異常系の対。CSRFトークンはフォーム送信時に自動付与されるため、
        // DOMでトークン値を改ざん/除去してから登録POSTを送る（移行先フォームのトークン名/挙動は要実機確認・実装文言はオラクル化しない）。
        const target = await gotoAgreementEditAsAdmin(page);
        await target.fillBody("利用規約本文 E2E-CSRF");
        // 実機確認後: トークン input を改ざん/除去 → submitRegister() → 保存されない(副作用なし)・成功フラッシュ非表示 を検証する。
        await target.submitRegister();
        // 期待: 登録完了（成功フラッシュ）が表示されない（送信成立せず）。具体的検証は実機確認後に実装。
      }
    );
  }
);
