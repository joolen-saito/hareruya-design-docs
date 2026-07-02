/**
 * 管理画面 会員管理 > 手動メール通知 E2E。
 * 納品ケース表 integration_test/e2e/m08_08_admin_customer_customer_manual_mail_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケース（仕様乖離検出ケースを含む）のみを置く。手動/対象外はケース表で全量管理する。
 * 手動/対象外（実メール受信・本文・宛先・履歴レコード値・CSRF内部・ログ抑止・最大長境界 等）はケース表で全量管理する。
 * 期待結果は仕様（functions/pf-eccube3/m08-08_...md / messages.ja.yaml の文言確認）由来（オラクル独立性）。
 * 本機能は pf-eccube3(HareruyaEc) 出自で刷新先 ec-cube-enterprise コア（CustomerMailController）へ移載済み。
 * 設計と実装の乖離は付帯表4に集約し、当該E2E（030/051/060）は仕様どおりに実アサートで書いて失敗で検出する（空fixmeにしない）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行前提（環境変数。コミットしない）:
 *  - ログイン: config の ECCUBE_ADMIN_USER/PASS（未設定なら test.skip でガード）。
 *  - SEED-M08-08-CUSTOMER : MM_CUSTOMER_ID（有効な会員ID。到達しないダミー宛先を推奨）。
 *  - SEED-M08-08-TEMPLATE : MM_TEMPLATE_ID（会員向けベースのメールテンプレID）。
 *  - 010 は実メール送信・履歴INSERTの副作用あり。共有環境では送信抑止/隔離で実行する。
 *  - 404系: MM_MISSING_CUSTOMER_ID / MM_MISSING_TEMPLATE_ID（存在しないID。既定は大きな番号）。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerManualMailPage } from "../../../pages/admin/m08/m08_08_admin_customer_customer_manual_mail.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const MM_CUSTOMER_ID = process.env.MM_CUSTOMER_ID || "";
const MM_TEMPLATE_ID = process.env.MM_TEMPLATE_ID || "";
const HAS_CUSTOMER = HAS_CREDS && !!MM_CUSTOMER_ID;
const HAS_TEMPLATE = HAS_CUSTOMER && !!MM_TEMPLATE_ID;
const MM_MISSING_CUSTOMER_ID = process.env.MM_MISSING_CUSTOMER_ID || "999999999";
const MM_MISSING_TEMPLATE_ID = process.env.MM_MISSING_TEMPLATE_ID || "999999999";
// SEED-M08-08-TEMPLATE-NONBASE : 会員向けベース外（注文向け等）の既存テンプレID。030（仕様乖離検出）で使用。
const MM_TEMPLATE_NONBASE_ID = process.env.MM_TEMPLATE_NONBASE_ID || "";
const HAS_TEMPLATE_NONBASE = HAS_CUSTOMER && !!MM_TEMPLATE_NONBASE_ID;

// 仕様(messages.ja.yaml)由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const SUCCESS_FLASH = "メール送信が完了しました。"; // :2614 admin.customer.manual_mail.success
const SUBJECT_VALUE = "E2E 手動メール件名";
const BODY_VALUE = "E2E 手動メール本文";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "会員管理 > 手動メール通知",
  { tag: ["@admin", "@customer", "@mail"] },
  () => {
    // ===== 未認証（資格情報不要・常時実行可） =====

    test("E2E-M08-08-040 未ログインで作成画面URL→管理ログイン画面へ誘導", async ({ page }) => {
      const customerId = MM_CUSTOMER_ID || "1";
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail/${customerId}`);
      await expect(page.locator("#login_id")).toBeVisible(); // 管理ログインへ誘導
    });

    // ===== 入口・UI部品（要ログイン／要会員シード） =====

    test("E2E-M08-08-001 作成画面に会員名・テンプレ選択・件名・本文・確認ボタン・戻るリンクが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-08-CUSTOMER 未設定（ECCUBE_ADMIN_USER/PASS・MM_CUSTOMER_ID）");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID);
      await target.seeInputForm();
    });

    test("E2E-M08-08-003 会員編集画面の「手動メール通知」リンクから作成画面へ遷移できる", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-08-CUSTOMER 未設定");
      await login(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/${MM_CUSTOMER_ID}/edit`);
      await page.getByRole("link", { name: "手動メール通知" }).click();
      const target = new CustomerCustomerManualMailPage(page);
      await expect(page).toHaveURL(target.manualMailUrlRe(MM_CUSTOMER_ID));
    });

    test("E2E-M08-08-004 会員一覧の操作メニューから作成画面へ遷移できる", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-08-CUSTOMER 未設定");
      await login(page);
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer`);
      const target = new CustomerCustomerManualMailPage(page);
      // 会員一覧の操作メニューの手動メールリンク（href基準。ドロップダウン開閉/ラベルは要実機確認）。
      await target.manualMailLinkInList(MM_CUSTOMER_ID).click();
      await expect(page).toHaveURL(target.manualMailUrlRe(MM_CUSTOMER_ID));
    });

    test("E2E-M08-08-050 「会員編集に戻る」リンクで会員編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-08-CUSTOMER 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID);
      await target.backToEditLink.click();
      await expect(page).toHaveURL(target.editUrlRe(MM_CUSTOMER_ID)); // M08-04 会員編集
    });

    // ===== テンプレ差し込み・確認・送信（要会員＋会員向けテンプレ） =====

    test("E2E-M08-08-002 テンプレ選択でテンプレID付きURLへ遷移し件名が差し込まれる", async ({ page }) => {
      test.skip(!HAS_TEMPLATE, "SEED-M08-08-TEMPLATE 未設定（MM_TEMPLATE_ID）");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID);
      await target.selectTemplateByValue(MM_TEMPLATE_ID); // JSで template_id 付きURLへ遷移
      await expect(page).toHaveURL(target.manualMailUrlReWithTemplate(MM_CUSTOMER_ID, MM_TEMPLATE_ID));
      await target.seeMailFields(); // テンプレ選択時は件名・本文欄が表示される
      await expect(target.subject).not.toHaveValue(""); // テンプレ件名が差し込まれる（処理フロー#5）
      await expect(target.body).not.toHaveValue(""); // ヘッダ・フッタ・会員・店舗情報を差し込んだ本文が組み立てられる（処理フロー#5）
    });

    test("E2E-M08-08-070 テンプレ選択を未選択へ戻すと会員IDのみのURLへ遷移する", async ({ page }) => {
      test.skip(!HAS_TEMPLATE, "SEED-M08-08-TEMPLATE 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID, MM_TEMPLATE_ID); // テンプレ選択済み
      await target.deselectTemplate(); // 未選択へ戻す（002の対）
      // 仕様(フロント挙動: 未選択へ戻すと会員IDのみ付けたURLへ遷移)由来。テンプレIDが落ちること。
      await expect(page).toHaveURL(target.manualMailUrlReNoTemplate(MM_CUSTOMER_ID));
    });

    test("E2E-M08-08-011 「確認」押下で確認画面へ遷移し「メール送信」ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_TEMPLATE, "SEED-M08-08-TEMPLATE 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID, MM_TEMPLATE_ID);
      await target.fillSubject(SUBJECT_VALUE);
      await target.fillBody(BODY_VALUE);
      await target.clickConfirm(); // mode=confirm
      await target.seeConfirmForm();
    });

    test("E2E-M08-08-010 確認→送信で成功フラッシュ「メール送信が完了しました。」が表示される", async ({ page }) => {
      // 注意: 実メール送信・dtb_user_mail_history へのINSERTの副作用あり。共有環境では隔離/送信抑止で実行する。
      test.skip(!HAS_TEMPLATE, "SEED-M08-08-TEMPLATE 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID, MM_TEMPLATE_ID);
      await target.fillSubject(SUBJECT_VALUE);
      await target.fillBody(BODY_VALUE);
      await target.clickConfirm();
      await target.clickSend(); // mode=complete
      await expect(page.locator("body")).toContainText(SUCCESS_FLASH); // 仕様(:2614)由来
    });

    // ===== バリデーション（必須・エラーパス） =====

    test("E2E-M08-08-020 件名を空にして確認するとエラーが表示され送信されない", async ({ page }) => {
      test.skip(!HAS_TEMPLATE, "SEED-M08-08-TEMPLATE 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID, MM_TEMPLATE_ID);
      await target.fillSubject(""); // 件名 NotBlank 違反
      await target.fillBody(BODY_VALUE);
      await target.clickConfirm();
      await expect(target.error.first()).toBeVisible(); // 検証エラー
      // 仕様: 検証失敗は「同じ作成画面へ戻す」。テンプレ選択済みなのでテンプレIDを保持した作成画面に留まる。
      await expect(page).toHaveURL(target.manualMailUrlReWithTemplate(MM_CUSTOMER_ID, MM_TEMPLATE_ID));
    });

    test("E2E-M08-08-021 本文を空にして確認するとエラーが表示され送信されない", async ({ page }) => {
      test.skip(!HAS_TEMPLATE, "SEED-M08-08-TEMPLATE 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID, MM_TEMPLATE_ID);
      await target.fillSubject(SUBJECT_VALUE);
      await target.fillBody(""); // 本文 NotBlank 違反
      await target.clickConfirm();
      await expect(target.error.first()).toBeVisible();
      // 仕様: 検証失敗は「同じ作成画面へ戻す」。テンプレIDを保持した作成画面に留まる。
      await expect(page).toHaveURL(target.manualMailUrlReWithTemplate(MM_CUSTOMER_ID, MM_TEMPLATE_ID));
    });

    // ===== 404 / URL直接アクセス =====

    test("E2E-M08-08-031 存在しない会員IDを指定すると404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const resp = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail/${MM_MISSING_CUSTOMER_ID}`
      );
      expect(resp?.status()).toBe(404); // 処理フロー#3 会員なし→404
    });

    test("E2E-M08-08-032 存在しないテンプレートIDを指定すると404", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-08-CUSTOMER 未設定");
      await login(page);
      const resp = await page.goto(
        `/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail/${MM_CUSTOMER_ID}/${MM_MISSING_TEMPLATE_ID}`
      );
      expect(resp?.status()).toBe(404);
    });

    test("E2E-M08-08-033 会員ID指定なしで作成画面URLにアクセスすると404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      // 仕様(入口/エッジケース: 会員ID指定なしは404)由来。会員ID無しのパスは到達不能（ページが見つからない扱い）。
      const resp = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail`);
      expect(resp?.status()).toBe(404); // エッジケース 会員ID指定なし→404
    });

    // ===== 仕様乖離検出（仕様どおりに書き、実装が違えば失敗で検出。付帯表4参照。空fixmeにせず実アサートで監査可能化） =====

    test("E2E-M08-08-030 会員向けベース外テンプレID→404（仕様乖離#3: 実装は会員向け絞り込みをURLで404判定しない）", async ({
      page,
    }) => {
      test.skip(!HAS_TEMPLATE_NONBASE, "SEED-M08-08-TEMPLATE-NONBASE 未設定（MM_TEMPLATE_NONBASE_ID）");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      // 期待は仕様(業務ルール: 会員向けベース外は404)由来。実装は MapEntity が任意テンプレを読み込み
      // 差し込み表示される恐れ（CustomerMailController.php:152）＝この期待で失敗して検出する。
      const resp = await page.goto(target.manualMailUrl(MM_CUSTOMER_ID, MM_TEMPLATE_NONBASE_ID));
      expect(resp?.status()).toBe(404); // 業務ルール: 会員向けベース外テンプレID→404
    });

    test("E2E-M08-08-060 テンプレ未選択時は件名・本文欄を表示しない（仕様乖離#2: 実装は常時描画）", async ({ page }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-08-CUSTOMER 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID); // テンプレ未選択
      // 期待は仕様(エッジケース: 本文textareaはテンプレ選択時のみ／未選択時は件名・本文欄を出さない)由来。
      // 実装は条件分岐なしで常時描画（mail_manual.twig:78,85）＝この期待で失敗して検出する。
      await target.seeMailFieldsHidden();
    });

    test("E2E-M08-08-051 送信成功後は同じ会員・テンプレートの作成画面へ戻る（仕様乖離#1: 実装は会員編集へリダイレクト）", async ({
      page,
    }) => {
      // 注意: 実メール送信・履歴INSERTの副作用あり。共有環境では隔離/送信抑止で実行する。
      test.skip(!HAS_TEMPLATE, "SEED-M08-08-TEMPLATE 未設定");
      await login(page);
      const target = new CustomerCustomerManualMailPage(page);
      await target.gotoManualMail(MM_CUSTOMER_ID, MM_TEMPLATE_ID);
      await target.fillSubject(SUBJECT_VALUE);
      await target.fillBody(BODY_VALUE);
      await target.clickConfirm();
      await target.clickSend();
      await expect(page.locator("body")).toContainText(SUCCESS_FLASH); // 成功は両画面で観測可
      // 期待は仕様(画面遷移: 送信成功→同じ会員・テンプレートの作成画面へ戻る)由来。
      // 実装は redirectToRoute('admin_customer_edit')（CustomerMailController.php:203）＝この期待で失敗して検出する。
      await expect(page).toHaveURL(target.manualMailUrlReWithTemplate(MM_CUSTOMER_ID, MM_TEMPLATE_ID));
    });
  }
);
