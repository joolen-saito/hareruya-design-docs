/**
 * 管理画面 会員管理 > メール一括送信 E2E。
 * 納品ケース表 integration_test/e2e/m08_02_admin_customer_customer_mail_all_e2e_cases.md に対応。
 * 本specには「E2E自動化」ケースと、自動化予定だが未実装/要実機の test.fixme のみを置く。
 * 手動/対象外（実メール受信・本文内容・送信単位1通ずつ・dtb_user_mail_history 記録・CSRF内部・ログ抑止・
 * 同時更新・一覧検索委譲 等）はケース表で全量管理する。
 * 期待結果は仕様（正本md m08-02_admin_customer_customer_mail_all.md / 観点表）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 実行前提:
 *  - ログインは config の ECCUBE_ADMIN_USER/PASS（未設定なら test.skip でガード）。
 *  - 001/002/010-013/020-022/030 は会員一覧に会員1件以上が必要（SEED-M08-02-CUSTOMER）。入口は会員一覧（別機能）の
 *    チェックボックス選択＋「その他」→「メール一括送信」(target-action JS)。本ルートは POST 専用で URL 直接GETでは到達不可。
 *  - 本文は ace editor(#editor)入力で、submit時にJSが hidden #admin_customer_mail_body へコピーする（要実機確認）。
 *  - 040(送信→完了)は実メール送信の副作用があるため、必ず catch-all 宛先のシード(SEED-M08-02-MAILTARGET)で実行する。
 *    共有環境への誤送信を避けるため、専用フラグ HAS_MAIL_TARGET が無い限り test.fixme とする。
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerMailAllPage } from "../../../pages/admin/m08/m08_02_admin_customer_customer_mail_all.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
// 実メール送信ケース(040)用の明示フラグ。catch-all 宛先シードが用意できた環境でのみ true。
const HAS_MAIL_TARGET = !!process.env.HAS_MAIL_TARGET;

// オラクル独立性: 完了文言「メール送信完了しました」(mail_complete.twig:16 ハードコード)・必須エラー文言
// 「入力されていません。」(validators.ja.yaml) は実装由来の表示文字列であり、期待値として固定しない。
// 期待結果は設計書由来の「観測可能な状態変化」で判定する（完了画面への遷移／入力画面滞留＋エラー表示の有無）。
// 完了文言・エラー文言そのものの一致確認は要実機（付帯表4#3）として手動に委ねる。

// 本文は ace editor(#editor)で編集し submit 時に JS が hidden #admin_customer_mail_body へコピーする想定だが、
// 入力経路(.ace_text-input への入力)が未検証＝要実機確認（付帯表4#5）。安定入力手段を実機で確立するまで fixme。
const ACE_FIXME =
  "本文は ace editor(#editor)入力で入力経路が要実機確認（付帯表4#5）。確実な入力手段を実機で確立後に有効化する。";
const MAIL_FIXME =
  "実メール送信の副作用回避: HAS_MAIL_TARGET と catch-all 宛先 SEED-M08-02-MAILTARGET が必要。";

const SUBJECT = "E2E一括メール件名_" + Date.now();
const BODY = "E2E一括メール本文_" + Date.now();

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

/** 会員一覧から会員を選択し、入力画面まで到達する。選択した会員IDを併せて返す。 */
async function gotoInputScreen(
  page: Page
): Promise<{ mail: CustomerCustomerMailAllPage; selectedId: string | null }> {
  const mail = new CustomerCustomerMailAllPage(page);
  await mail.gotoCustomerList();
  const selectedId = await mail.startMailAllFromList();
  await mail.seeInputForm();
  return { mail, selectedId };
}

test.describe(
  "会員管理 > メール一括送信",
  { tag: ["@admin", "@customer", "@mail"] },
  () => {
    // ===== 認証不要・非破壊（常時実行可） =====

    test("E2E-M08-02-050 未ログインで一括送信URL→管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/mail`);
      // 権限・認可: 未ログインはアクセス不可 → 管理ログイン画面へ誘導（設計書: 失敗時 認証/権限不足）
      await expect(page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 入力画面（SEED-M08-02-CUSTOMER） =====

    test("E2E-M08-02-001 会員選択→一括送信起動で件名・本文の入力画面が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await expect(mail.confirmButton).toBeVisible(); // 「送信内容を確認」ボタン
    });

    test("E2E-M08-02-002 入力画面に件名・本文のラベルと入力部品が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await expect(page.locator("body")).toContainText("件名"); // admin.customer.mail_subject
      await expect(page.locator("body")).toContainText("本文"); // admin.customer.body
      await expect(mail.subject).toBeVisible();
      await expect(page.locator("#editor")).toBeVisible();
    });

    // ===== 入力→確認 =====

    test("E2E-M08-02-010 件名・本文を入力し確認すると確認画面へ遷移する", async ({ page }) => {
      test.fixme(true, ACE_FIXME);
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      await mail.seeConfirmScreen(); // 送信ボタン＋「配信対象者」
    });

    test("E2E-M08-02-011 確認画面に入力した件名が表示される", async ({ page }) => {
      test.fixme(true, ACE_FIXME);
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      await mail.seeConfirmReadonly(); // 確認画面は入力欄を変更不可で表示（編集UI非露出）
      await expect(page.locator("body")).toContainText(SUBJECT);
    });

    test("E2E-M08-02-012 確認画面に入力した本文が表示される", async ({ page }) => {
      test.fixme(true, ACE_FIXME);
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      await mail.seeConfirmReadonly(); // 確認画面は入力欄を変更不可で表示（編集UI非露出）
      await expect(page.locator("#detail_box__body")).toContainText(BODY);
    });

    test("E2E-M08-02-013 確認画面に選択した配信対象会員が一覧表示される", async ({ page }) => {
      test.fixme(true, ACE_FIXME);
      await login(page);
      const { mail, selectedId } = await gotoInputScreen(page);
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      await expect(page.locator("body")).toContainText("配信対象者");
      // 設計書: 選択会員IDから対象会員を取得(findByIds)。選択IDが保持され対象会員が選択会員と一致すること。
      expect(selectedId, "会員一覧の選択IDが取得できること").not.toBeNull();
      await expect(mail.idsHidden).toHaveValue(new RegExp(`(^|,)${selectedId}(,|$)`)); // 選択IDがhiddenで保持
      await mail.seeSelectedCustomerInTargets(selectedId as string); // 対象一覧に選択会員が出る
    });

    test("E2E-M08-02-015 複数会員を選択すると確認画面に全選択会員が配信対象として表示される", async ({ page }) => {
      test.fixme(true, ACE_FIXME);
      await login(page);
      const mail = new CustomerCustomerMailAllPage(page);
      await mail.gotoCustomerList();
      const ids = await mail.startMailAllFromListMultiple(2);
      await mail.seeInputForm();
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      // 設計書: 複数会員への一括送信。findByIds が選択ID全件を返し、確認画面に全対象会員が表示される。
      await expect(page.locator("body")).toContainText("配信対象者");
      expect(ids.length, "会員一覧で2件以上選択できること").toBeGreaterThanOrEqual(2);
      for (const id of ids) {
        await mail.seeSelectedCustomerInTargets(id);
      }
    });

    test("E2E-M08-02-022 件名・本文を入力すればエラーなく確認画面へ継続できる", async ({ page }) => {
      test.fixme(true, ACE_FIXME);
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      await expect(mail.completeButton).toBeVisible(); // 確認画面へ到達＝必須エラーなし
    });

    // ===== 必須バリデーション（異常系） =====

    test("E2E-M08-02-020 件名未入力で確認すると処理が完了せず入力画面に留まる", async ({ page }) => {
      test.fixme(true, ACE_FIXME); // 本文入力に ace editor を要するため要実機
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await mail.fillForm("", BODY); // 件名空
      await mail.clickConfirm();
      // 設計書: 確認画面へ進まず入力画面に留まり、件名の必須エラーが表示される（処理未完了）。
      await expect(mail.completeButton).toHaveCount(0); // 確認画面へ進まない
      await expect(mail.confirmButton).toBeVisible(); // 入力画面に留まる
      await expect(page.locator(".invalid-feedback")).toBeVisible(); // 件名の必須エラー表示(form_errors mail.twig:68・文言は固定しない)
    });

    test("E2E-M08-02-021 本文未入力で確認すると処理が完了せず入力画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const { mail } = await gotoInputScreen(page); // 件名のみ入力・本文は空＝ace editor 入力不要
      await mail.fillForm(SUBJECT, ""); // 本文空
      await mail.clickConfirm();
      // 設計書: 確認画面へ進まず入力画面に留まり、本文の必須エラーが表示される（処理未完了）。
      await expect(mail.completeButton).toHaveCount(0); // 確認画面へ進まない
      await expect(mail.confirmButton).toBeVisible(); // 入力画面に留まる
      await expect(page.locator("#editor")).toHaveClass(/is-invalid/); // 本文エラー表示(has_errors→is-invalid mail.twig:75・文言は固定しない)
    });

    // ===== 確認→戻る =====

    test("E2E-M08-02-030 確認画面から戻ると入力画面へ戻る", async ({ page }) => {
      test.fixme(true, ACE_FIXME);
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      await mail.seeConfirmScreen();
      await mail.clickBack();
      await expect(mail.confirmButton).toBeVisible(); // 入力画面の「確認」ボタンが再表示
    });

    // ===== 送信→完了（実メール副作用・catch-all宛先シード必須） =====

    test("E2E-M08-02-040 送信すると一括送信完了の案内画面が表示される", async ({ page }) => {
      // 実メール送信の副作用 ＋ 本文 ace editor 入力（要実機）の双方を満たせる環境でのみ有効化。
      // HAS_MAIL_TARGET と catch-all 宛先 SEED-M08-02-MAILTARGET が必要。
      test.fixme(!(HAS_CREDS && HAS_MAIL_TARGET), MAIL_FIXME);
      test.fixme(true, ACE_FIXME);
      await login(page);
      const { mail } = await gotoInputScreen(page);
      await mail.fillForm(SUBJECT, BODY);
      await mail.clickConfirm();
      await mail.seeConfirmScreen();
      await mail.clickComplete();
      // 設計書: 一括送信完了の案内画面へ遷移する（状態変化）。完了文言そのものはオラクル化しない（要実機/付帯表4#3）。
      await expect(mail.completeButton).toHaveCount(0); // 送信ボタンが消える＝確認画面を離脱
      await expect(mail.confirmButton).toHaveCount(0); // 入力画面でもない＝完了画面へ遷移
    });
  }
);
