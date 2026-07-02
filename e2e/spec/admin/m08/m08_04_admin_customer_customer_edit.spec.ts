/**
 * 管理画面 会員管理 — 会員登録/編集（会員編集）E2E。
 * 納品ケース表 integration_test/e2e/m08_04_admin_customer_customer_edit_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち実装済みのケースのみを置く（手動/対象外はケース表で全量管理）。
 * 自動化予定だが未実装/破壊的/要実機のものは test.fixme（理由付き）で残す。
 * 期待結果は仕様（正本md / 観点表 / ec-cube-enterprise確認値 messages.ja.yaml）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 実行方針（安全第一・共有環境）:
 *  - 資格情報/シードが無いと走らないよう test.skip でガード（存在はするが未実行＝抜け漏れ可視化）。
 *  - 保存成功(050/051)・本人確認ステータス自動降格(030)はDBを書き換える破壊的操作のため test.fixme（使い捨てシードで実装）。
 *  - 必須/形式/相関の検証エラー系は「保存に失敗してDBを変えない」ため安全に実行できる（要: 編集可能な会員シード）。
 *  - 郵便番号自動入力(040)は外部API(AjaxZip3)依存のためケース表で「手動」扱い、specには置かない。
 *
 * シード/環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - CUSTOMER_EDIT_ID       : 編集可能な既存会員ID（表示・必須/形式検証で使用）
 *  - CUSTOMER_CONFIRMED_ID  : 本人確認ステータス=確認済みの会員ID（確認ダイアログ030/031で使用）
 *  - CUSTOMER_DUP_EMAIL     : 既に他会員で使われているメールアドレス（重複エラー023で使用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { AdminCustomerCustomerEditPage } from "../../../pages/admin/m08/m08_04_admin_customer_customer_edit.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const EDIT_ID = process.env.CUSTOMER_EDIT_ID || "";
const CONFIRMED_ID = process.env.CUSTOMER_CONFIRMED_ID || "";
const DUP_EMAIL = process.env.CUSTOMER_DUP_EMAIL || "";

const LOGIN_RE = /\/login(\?|$)/;
const NEW_RE = /\/customer\/new(\?|$)/;
const EDIT_RE = /\/customer\/\d+\/edit(\?|$)/;

// 確認ダイアログ文言は仕様（設計書 表示メッセージ :299）由来。設計書は本文＋対象項目一覧の2部構成。
// 実装テンプレート(edit.twig:36)の区切りは "\n" だが、区切り文字に依存しないよう2部を個別に toContain で照合する。
const CONFIRM_MSG_HEAD =
  "本人確認用情報に変更があるため本人確認ステータスを未確認に変更します。よろしいですか？";
const CONFIRM_MSG_FIELDS = "本人確認用情報：お名前、お名前(フリガナ)、住所、生年月日";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 会員管理 会員登録/編集（会員編集）",
  { tag: ["@admin", "@customer"] },
  () => {
    // ===== 権限・認可 / HTTPステータス（資格情報のみ） =====

    test("E2E-M08-04-010 未ログインで会員編集URLへアクセスすると管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE); // 権限・認可（未ログインは管理ログインへ）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M08-04-011 未ログインで会員新規登録URLへアクセスすると管理ログイン画面へ誘導", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M08-04-012 存在しないidの会員編集GETは404", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      const resp = await target.gotoEdit(2147483646); // 存在しない想定の大きなID（エラー処理: 404）
      expect(resp?.status()).toBe(404);
    });

    // ===== 表示・UI部品 =====

    test("E2E-M08-04-001 会員新規登録フォーム(GET new)が空フォームで表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await expect(page).toHaveURL(NEW_RE);
      await target.seeRegistrationForm();
    });

    test("E2E-M08-04-005 新規登録フォームでは購入履歴・買取履歴カードを表示しない（編集時のみ）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await expect(target.orderHistoryCard).toHaveCount(0); // 利用者視点: 新規時は履歴を表示しない
      await expect(target.buyOrderHistoryCard).toHaveCount(0);
    });

    test("E2E-M08-04-002 会員編集(GET edit)で会員情報が展開され編集画面が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDIT_ID, "ECCUBE_ADMIN_USER/PASS または CUSTOMER_EDIT_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      await expect(page).toHaveURL(EDIT_RE);
      await target.seeRegistrationForm();
    });

    test("E2E-M08-04-003 会員編集画面に購入履歴・買取履歴カードが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDIT_ID, "CUSTOMER_EDIT_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      await target.seeHistoryCards();
    });

    test("E2E-M08-04-004 会員編集画面に各機能導線（ポイント管理・送信履歴・手動メール・オンライン本人確認）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS || !EDIT_ID, "CUSTOMER_EDIT_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      await target.seeFunctionLinks();
    });

    test("E2E-M08-04-006 会員登録/編集フォームに登録ボタン・会員一覧戻りリンクが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await expect(target.registerButton).toBeVisible();
      await expect(target.backToListLink).toBeVisible();
    });

    test("E2E-M08-04-007 会員編集時はパスワード欄に既定値(非空)が初期セットされる", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDIT_ID, "CUSTOMER_EDIT_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      // 仕様: 編集時はパスワード欄に既定パスワードを表示する（原値は観測しない＝非空であることのみ確認）。
      const v = await target.passwordFirst.inputValue();
      expect(v.length).toBeGreaterThan(0);
    });

    test("E2E-M08-04-008 会員登録フォームに仕様定義の DCIナンバー・DCI確認フラグ・本人確認フラグ欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      // 期待は設計書（入力項目 :158/161/163,245）由来。現行刷新先フォームは未実装のため失敗し、不具合候補#3 を検出する。
      // セレクタは仕様の form キー(mapped=偽)から推定した期待DOM id（要実機確認）。実装に寄せない。
      await target.expectSpecPlayerFieldsPresent();
    });

    test("E2E-M08-04-009 会員編集画面に仕様定義の拡張入力欄（国・会員グループ・本人確認ステータス・メールマガジン配信フラグ・DCI登録本名・スマレジID・身分証有効期限・会員ステータス・メモ）が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS || !EDIT_ID, "CUSTOMER_EDIT_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      // 期待は設計書「入力項目」(:144-167)由来。表示の有無のみ観測し、値・制約はオラクル化しない。
      await target.seeExtendedInputFields();
    });

    test("E2E-M08-04-013 会員編集画面に配送先一覧カードと配送先追加導線が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDIT_ID, "CUSTOMER_EDIT_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      // 設計書 画面遷移「配送先一覧」(:270)・フロント挙動「配送先一覧」導線。
      await target.seeDeliveryLink();
    });

    // ===== 画面遷移 =====

    test("E2E-M08-04-060 会員一覧戻りリンクで会員一覧(admin_customer_page)へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await target.backToListLink.click();
      await expect(page).toHaveURL(/\/customer\/page\/\d+|\/customer(\?|$)/); // admin_customer_page（M08-01）
    });

    test("E2E-M08-04-061 会員一覧戻りリンクが検索セッションのページ番号と再開指定(resume)を伴う", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      // 設計書 セッション(:268,322): 戻り導線は会員検索用セッションのページ番号と再開指定(resume)を参照する。
      // リンクhrefにページ番号セグメントと resume 指定が含まれること（保持ページ値の正否はM08-01）。
      const href = await target.backToListLink.getAttribute("href");
      expect(href ?? "").toMatch(/\/customer\/page\/\d+/); // 保持ページ番号
      expect(href ?? "").toContain("resume=1"); // 再開指定
    });

    // ===== バリデーション（保存失敗＝DB非変更で安全に実行） =====

    test("E2E-M08-04-020 名前を空で新規登録すると保存されず新規フォームに留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await target.fillMinimalRequired({ email: true }); // 対象外項目で失敗しないよう必須コアを満たす（要実機確認: 必須選択は別途）
      await target.name01.fill(""); // 名前は必須（仕様: 入力項目/バリデーション）—検証対象を名前に限定
      await target.name02.fill("");
      await target.clickRegister();
      await expect(page).toHaveURL(NEW_RE); // 編集画面へ遷移しない＝保存されない
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    test("E2E-M08-04-021 メールアドレスを空で新規登録すると保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await target.fillMinimalRequired({ email: false }); // 名前など必須コアを満たし、検証対象をメール未入力に限定
      await target.email.fill(""); // メールは必須（仕様: 入力項目/バリデーション）
      await target.clickRegister();
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    test("E2E-M08-04-022 メールアドレスを不正形式で新規登録すると保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await target.fillMinimalRequired({ email: false }); // 名前など必須コアを満たし、検証対象をメール形式に限定
      await target.email.fill("not-an-email"); // メール形式検証（仕様: バリデーション）
      await target.clickRegister();
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    test("E2E-M08-04-023 既存と重複するメールアドレスで編集保存すると保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDIT_ID || !DUP_EMAIL, "CUSTOMER_EDIT_ID / CUSTOMER_DUP_EMAIL 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      await target.email.fill(DUP_EMAIL); // 他会員の既存メール（仕様: DBとの相関＝重複拒否）
      await target.clickRegister();
      // 編集では成功時も同じ /edit に戻るためURLは判別力を持たない。仕様(設計書 :305「フィールドのエラーは各欄直下に表示」)由来で
      // 検証エラー表示を主オラクルとする。要確認: .invalid-feedback 等のエラー要素クラスは form_theme 依存で要実機確認。
      await expect(target.errors.first()).toBeVisible();
      // 補助: 仕様の保存成功フラッシュ文言は出ないこと（実装文言相違は付帯表4#1。本判定は副次）。
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    test("E2E-M08-04-024 パスワードにメールアドレスと同一値を入れて新規登録すると保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await target.fillMinimalRequired({ email: false }); // 名前など必須コアを満たし、検証対象を相関に限定
      const sameValue = "e2e_same@example.com";
      await target.email.fill(sameValue);
      await target.passwordFirst.fill(sameValue); // 仕様: パスワード=メールは相関エラー
      await target.passwordSecond.fill(sameValue);
      await target.clickRegister();
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    test("E2E-M08-04-025 海外用郵便番号が最大長を超えると保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoNew();
      await target.fillMinimalRequired(); // 名前・メールを満たし、検証対象を海外用郵便番号の文字列長に限定
      // 仕様: 海外用郵便番号は最大文字数(stext_len)の検証。上限超過(256文字)で保存されないこと。
      await target.abroadPostalCode.fill("9".repeat(256));
      await target.clickRegister();
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    test("E2E-M08-04-041 名前を空で編集保存すると保存されず編集画面に留まる（編集側 必須異常）", async ({ page }) => {
      test.skip(!HAS_CREDS || !EDIT_ID, "CUSTOMER_EDIT_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(EDIT_ID);
      await target.name01.fill(""); // 名前は必須（仕様: 入力項目/バリデーション）。編集側でも検証されること
      await target.name02.fill("");
      await target.clickRegister();
      // 編集は成功時も同じ /edit に戻るためURLは判別力を持たない。検証失敗で「保存成功フラッシュが出ない＋エラー表示」を主オラクルとする。
      await expect(page).toHaveURL(EDIT_RE); // 編集画面に留まる
      await expect(target.errors.first()).toBeVisible(); // フィールドエラー（位置/クラスは要実機確認）
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    // ===== 確認ダイアログ（本人確認ステータス自動降格・非破壊で取消） =====

    test("E2E-M08-04-031 確認済み会員で本人確認用情報を変更し登録すると確認ダイアログが表示され取消で送信しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS || !CONFIRMED_ID, "CUSTOMER_CONFIRMED_ID 未設定");
      await login(page);
      const target = new AdminCustomerCustomerEditPage(page);
      await target.gotoEdit(CONFIRMED_ID);
      // 取消（dismiss）で送信させない＝DBを変えない（非破壊）。ダイアログ文言は仕様（表示メッセージ）由来。
      let dialogMessage = "";
      page.once("dialog", async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.dismiss();
      });
      await target.addr01.fill("E2E変更住所" + Date.now()); // 住所変更＝本人確認用情報の変更
      await target.clickRegister();
      await expect.poll(() => dialogMessage).toContain(CONFIRM_MSG_HEAD);
      expect(dialogMessage).toContain(CONFIRM_MSG_FIELDS); // 設計書 :299 の対象項目一覧まで網羅
      await expect(page).toHaveURL(EDIT_RE); // 取消したので送信されず編集画面に留まる
      await expect(page.locator("body")).not.toContainText("会員情報を保存しました。");
    });

    // ===== 保留（破壊的/外部依存。理由付きで未実装。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M08-04-030 確認ダイアログ続行で本人確認ステータスが未確認へ降格して保存される（破壊的・要使い捨てシード）",
      async () => {
        // 期待は仕様(処理フロー: 本人確認ステータスを戻す確認 / 表示メッセージ)由来。
        // dialog.accept() で送信→DBの identity_confirm_status_id が未確認へ更新されるため使い捨て会員で実装する。
      }
    );

    test.fixme(
      "E2E-M08-04-050 新規登録の正常保存で保存成功フラッシュ＋保存後の編集画面へ遷移（破壊的・会員/会員住所を生成）",
      async () => {
        // 期待は仕様(処理フロー: 保存成功表示＋編集画面遷移 / 表示メッセージ「会員情報を保存しました。」)由来。
        // 注: 実装フラッシュは admin.common.save_complete=「保存しました」で仕様文言と相違（不具合候補#1）。
        // dtb_customer / dtb_customer_address / dtb_player を生成するため使い捨てシードで実装する。
      }
    );

    test.fixme(
      "E2E-M08-04-051 会員編集の正常保存で保存成功フラッシュ＋同一編集画面へ遷移（破壊的）",
      async () => {
        // 期待は仕様(処理フロー: 検証後に会員情報を更新し同じ編集画面へ遷移)由来。専用使い捨て会員で実装する。
      }
    );

    test.fixme(
      "E2E-M08-04-026 住所1がSJIS換算で上限を超えると超過エラーで保存されない（要確認: 刷新先のSJIS長検証の有無）",
      async () => {
        // 期待は仕様(業務ルール: 住所のSJIS上限超過エラー)由来。刷新先 ec-cube-enterprise の AddressType に
        // SJIS換算の長さ検証が存在するか要実機確認（不具合候補#2）。存在すれば上限超過で保存されないことを確認する。
      }
    );
  }
);
