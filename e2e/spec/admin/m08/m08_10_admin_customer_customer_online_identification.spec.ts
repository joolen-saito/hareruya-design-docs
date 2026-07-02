/**
 * 管理画面 会員管理 オンライン本人確認（M08-10）E2E。納品ケース表
 * integration_test/e2e/m08_10_admin_customer_customer_online_identification_e2e_cases.md に対応（完全1:1ではない）。
 * 本specには「E2E自動化」ケースのみ実装し、破壊的(DB更新)・要実機確認・仕様乖離検出見込みは test.fixme（理由付き）で残す。
 * 手動/対象外はケース表で全量管理し、specに大量のfixmeを残さない（規約）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-10_admin_customer_customer_online_identification.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来設計だが、刷新先 ec-cube-enterprise の会員編集画面(admin_customer_edit)の
 * オンライン本人確認モーダルとして実在するためE2E化した。
 * 表示文言のうち i18n リソース(messages.ja.yaml)由来の語はオラクルにせず、設計書が明記する文言・観測挙動で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには fixtures/admin_login.fixture が存在せず、
 * 既存の spec/admin/login.spec.ts・m07/*.spec.ts も @playwright/test を直接使う。本specも踏襲する。
 * 資格情報が無ければ走らないよう test.skip でガードする（存在はするが未実行＝抜け漏れ可視化）。
 *
 * シード（環境変数。コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 本人確認の閲覧権限を持つ管理者（SEED-M08-10-ADMIN-VIEW）
 *  - M08_CUSTOMER_ID    : 選手情報(dtb_player)を持つ会員のID（SEED-M08-10-CUSTOMER。身分証画像・本人確認ステータス未確認）
 *  - M08_CUSTOMER_NOIMG : 一部種別の身分証画像が未登録の会員ID（SEED-M08-10-CUSTOMER-NOIMG）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerOnlineIdentificationPage } from "../../../pages/admin/m08/m08_10_admin_customer_customer_online_identification.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);

// SEED-M08-10-CUSTOMER: 選手情報を持つ会員のID（モーダル表示・確認済への変更の対象）。
const CUSTOMER_ID = process.env.M08_CUSTOMER_ID || "";
const HAS_CUSTOMER = HAS_CREDS && !!CUSTOMER_ID;
// SEED-M08-10-CUSTOMER-NOIMG: 一部の身分証画像が未登録の会員ID。
const CUSTOMER_NOIMG = process.env.M08_CUSTOMER_NOIMG || "";
const HAS_NOIMG = HAS_CREDS && !!CUSTOMER_NOIMG;

// URLアサーションは管理ルート接頭辞まで含めて誤検知を防ぐ（ECCUBE_ADMIN_ROUTE は環境可変）。
const LOGIN_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login(\\?|$)`);
const EDIT_RE = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/\\d+/edit(\\?|$)`);

// 仕様(設計書 表示メッセージ)由来の文言。実装に合わせて変えない（オラクル独立性）。
const ERR_ID_EXPIRATION = "身分証有効期限の値が不正です"; // 確認済への変更で日付として解釈できないとき
const TXT_NO_IMAGE = "登録データなし"; // 身分証画像が未登録の種別

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe(
  "管理画面 > 会員管理 > オンライン本人確認",
  { tag: ["@admin", "@customer"] },
  () => {
    // ===== 入口・権限（資格情報のみで観測可） =====

    test("E2E-M08-10-014 未ログインで会員編集URLへ直接アクセスすると管理ログイン画面へ誘導", async ({
      page,
    }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/1/edit`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M08-10-015 会員新規登録画面（会員IDなし）ではオンライン本人確認ボタンを表示しない", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M08-10-ADMIN-VIEW 未設定（ECCUBE_ADMIN_USER/PASS）");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoNew();
      await expect(m08.openModalButton).toHaveCount(0);
    });

    // ===== モーダル表示（SEED-M08-10-CUSTOMER） =====

    test("E2E-M08-10-001 会員編集画面（編集時）にオンライン本人確認ボタンが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定（M08_CUSTOMER_ID）");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      await expect(m08.openModalButton).toBeVisible();
    });

    test("E2E-M08-10-002 ボタン押下でモーダルが開き見出し「オンライン本人確認」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      await m08.openModal();
      await expect(m08.modal).toBeVisible();
      await m08.seeModalTitle();
    });

    test("E2E-M08-10-003 モーダルに会員の個人情報（氏名・住所・生年月日等）の項目が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      await m08.openModal();
      // 設計書「表示要素」(正本 md:84): 会員の個人情報
      // （お名前・お名前（フリガナ）・国・郵便番号・海外用郵便番号・都道府県・住所・生年月日・職業）の表示。
      // 「等」で省略せず設計書が列挙する代表項目を節単位で網羅検証する（codex指摘:個人情報網羅不足）。
      await expect(m08.modal).toContainText("お名前");
      await expect(m08.modal).toContainText("フリガナ");
      await expect(m08.modal).toContainText("郵便番号");
      await expect(m08.modal).toContainText("都道府県");
      await expect(m08.modal).toContainText("住所");
      await expect(m08.modal).toContainText("生年月日");
      await expect(m08.modal).toContainText("職業");
    });

    test("E2E-M08-10-004 モーダルに身分証画像区分（顔写真・表・裏・斜め）のラベルが表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      await m08.openModal();
      // 設計書「表示要素」: 身分証画像区分（顔写真・オモテ・ウラ・斜め）ごとのサムネイル枠。
      await expect(m08.modal).toContainText("本人の顔写真");
      await expect(m08.modal).toContainText("身分証明書（表）");
      await expect(m08.modal).toContainText("身分証明書（裏）");
      await expect(m08.modal).toContainText("身分証明書（斜め）");
      // ラベルだけでなく、登録済の身分証画像サムネイル(img.expand-image)が実際に描画されることを確認する
      // （codex指摘: 画像「表示」確認がラベル確認にすり替わらないように）。設計書「表示要素／種別ごとのサムネイル」由来。
      // 画像配信(admin_identification_image)の200/403は別観点(012/権限)で扱う。
      await expect(m08.images.first()).toBeVisible();
    });

    test("E2E-M08-10-021 閲覧権限ありで登録済みの身分証画像が種別ごとにサムネイル表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定（M08_CUSTOMER_ID。4種別とも画像登録済前提）");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      await m08.openModal();
      // 設計書「フロント挙動／表示要素」「処理フロー#3（権限ありで現在の身分証画像を種別ごとに取得して表示）」由来。
      // 顔写真・オモテ・ウラ・斜めの4種別とも身分証画像サムネイル(img.expand-image)が描画されることを確認する
      // （codex指摘: IT行069「種別ごとの現在画像表示」が区分ラベル確認(004)にすり替わらないよう独立ケース化）。
      // 画像配信(admin_identification_image)の200/403は別観点（012=閲覧権限）で扱う。
      await expect(m08.images).toHaveCount(4);
      for (let i = 0; i < 4; i++) {
        await expect(m08.images.nth(i)).toBeVisible();
      }
    });

    test("E2E-M08-10-005 モーダルに身分証有効期限の日付入力欄が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      await m08.openModal();
      await expect(m08.idExpirationDate).toBeVisible();
    });

    test("E2E-M08-10-006 取消ボタンでモーダルを閉じ会員編集画面に留まる", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      await m08.openModal();
      await expect(m08.modal).toBeVisible();
      await m08.cancelButton.click();
      await expect(m08.modal).toBeHidden();
      await expect(page).toHaveURL(EDIT_RE);
    });

    test("E2E-M08-10-010 身分証画像が未登録の種別に「登録データなし」が表示される", async ({
      page,
    }) => {
      test.skip(!HAS_NOIMG, "SEED-M08-10-CUSTOMER-NOIMG 未設定（M08_CUSTOMER_NOIMG）");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_NOIMG);
      await m08.openModal();
      await expect(m08.modal).toContainText(TXT_NO_IMAGE);
    });

    // ===== 確認済への変更（異常系・非破壊：エラーで更新せず会員編集へ戻る） =====

    test("E2E-M08-10-008 身分証有効期限が日付として不正だとエラー表示で会員編集画面へ戻る", async ({
      page,
    }) => {
      test.skip(!HAS_CUSTOMER, "SEED-M08-10-CUSTOMER 未設定");
      await login(page);
      const m08 = new CustomerCustomerOnlineIdentificationPage(page);
      await m08.gotoEdit(CUSTOMER_ID);
      // 身分証有効期限は DateType single_text + class=datetimepicker-input（type="text"。HTML5 date入力ではない。
      // PlayerType.php:83,91-94）なので、任意文字列を fill してもブラウザに弾かれずサーバの日付解釈(処理フロー#4)へ到達する。
      // 日付として解釈できない値を入力して確認済へ変更する（ステータスは更新しない）。
      await m08.submitComplete("不正な日付");
      // 元の会員の編集画面へ戻ること（誤った会員IDへのリダイレクトを見逃さないようID固定で検証。codex指摘:URL緩い）。
      await expect(page).toHaveURL(
        new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/${CUSTOMER_ID}/edit(\\?|$)`)
      );
      await expect(page.locator("body")).toContainText(ERR_ID_EXPIRATION);
    });

    // ===== 不存在会員（404） =====

    test("E2E-M08-10-013 存在しない会員IDで確認済への変更POSTすると404になる", async ({
      page,
    }) => {
      test.skip(!HAS_CREDS, "SEED-M08-10-ADMIN-VIEW 未設定");
      await login(page);
      // 認証済みセッションで存在しない会員IDの complete ルートへ POST する（仕様: 会員ID無し→404）。
      const res = await page.request.post(
        `/${ECCUBE_ADMIN_ROUTE}/customer/999999999/identification/complete`,
        { form: { id_expiration_date: "" }, failOnStatusCode: false }
      );
      expect(res.status()).toBe(404);
    });

    test.fixme(
      "E2E-M08-10-016 確認済への変更POSTでなりすまし対策トークン未付与だと拒否され更新されない（破壊的・仕様乖離検出見込み: 実装にCSRF検証なし）",
      async () => {
        // 期待は仕様(処理フロー#1「なりすまし対策トークンを検証する」/ JS挙動「トークンを隠しフォームに載せてPOST」)由来。
        // _token を載せずに admin_customer_identification_complete へ POST し、仕様どおりなら拒否(例:403)され
        // 本人確認ステータスが更新されないことを期待する。実装(CustomerEditController.php:194-267)はCSRFを検証せず
        // 隠しフォーム(edit.twig:84-94)も _token を載せないため通過し更新される（不具合候補#3）→落ちて検出する。
        // トークンが通った場合に更新されるため使い捨て会員(SEED-M08-10-CUSTOMER-EXPENDABLE)で実行。
      }
    );

    test.fixme(
      "E2E-M08-10-017 会員は存在するが選手情報なしで確認済への変更POSTすると404になる（要シード・仕様乖離検出見込み）",
      async () => {
        // 期待は仕様(処理フロー#3「会員IDから選手情報を取得。存在しない場合は404」/ サマリ md:76,107)由来。
        // 選手情報(dtb_player)を持たない会員IDで complete ルートへ POST し 404 を期待する。
        // 実装(CustomerEditController.php:227-233)は Player null を system_error フラッシュ＋会員編集へリダイレクト
        // （404ではない・不具合候補#4）→落ちて検出する。選手情報なし会員シード(SEED-M08-10-CUSTOMER-NOPLAYER)が必要。
      }
    );

    // ===== 保留（破壊的/要実機確認/仕様乖離検出見込み。手動・対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M08-10-007 確認済へ変更成功でステータス確認済み・有効期限保存・保存成功フラッシュ・会員編集へ戻る（破壊的: DB更新。専用使い捨て会員で実行）",
      async () => {
        // 期待は仕様(処理フロー#5-6・成功時出力・表示メッセージ「会員情報を保存しました。」)由来。
        // 実装は addSuccess('admin.common.save_complete'=「保存しました」)で文言が異なる（不具合候補#2）。テストは仕様文言を期待し落ちて検出する。
      }
    );

    test.fixme(
      "E2E-M08-10-009 身分証有効期限が空のとき未設定で確認済みへ更新が成功する（破壊的: DB更新）",
      async () => {
        // 期待は仕様(エッジケース「身分証有効期限が空→未設定にして確認済みへ更新」)由来。専用使い捨て会員で実行。
      }
    );

    test.fixme(
      "E2E-M08-10-011 身分証画像サムネイル押下で拡大表示モーダルが開く（要実機確認: 拡大モーダルのセレクタ）",
      async () => {
        // 期待は仕様(フロント挙動「サムネイル押下で拡大表示モーダルを開く」)由来。拡大モーダルのID/トリガを実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M08-10-012 本人確認の閲覧権限がない管理者には身分証画像を表示せず「閲覧不可」文言を表示（仕様乖離検出見込み）",
      async () => {
        // 期待は仕様(業務ルール・表示メッセージ「閲覧不可」)由来。実装(edit.twig)は閲覧不可文言を持たず画像URLを常時描画し
        // 画像配信エンドポイント(admin_identification_image)で403とするため「閲覧不可」文言は表示されない（不具合候補#1）。
        // テストは仕様どおり「閲覧不可」文言の表示を期待し、落ちて検出する。閲覧権限なし管理者シード(SEED-M08-10-ADMIN-NOVIEW)が必要。
      }
    );
  }
);
