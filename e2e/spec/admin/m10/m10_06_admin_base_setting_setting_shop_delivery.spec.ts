/**
 * 管理画面 店舗設定 — 配送方法管理（配送業者・配送料・お届け時間）E2E。
 * 納品ケース表 integration_test/e2e/m10_06_admin_base_setting_setting_shop_delivery_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち安全に実行できるケースのみを置く（手動/対象外はケース表で全量管理）。
 * 破壊的（登録成功でDBへ追加／削除で物理削除／並び替えでsort_no更新）や要動的行操作/要実機は test.fixme（理由付き）で残す。
 * 期待結果は仕様（正本md / テスト観点表 / ec-cube-enterprise確認値 messages.ja.yaml・validators.ja.yaml）由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / two_factor_auth.spec.ts / m08・m09系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 重要（仕様乖離）: 刷新先(ec-cube-enterprise)は設計書(pf-eccube3リバース)と差異が大きい。
 *   - 一覧見出し文言が「配送方法設定」（設計書は「配送方法一覧」）。
 *   - 新規ボタン文言が「新規作成」（設計書は「配送方法・配送料を新規入力」）。
 *   - 編集に 商品種別select／ショップ用メモ欄／全国一律送料「各都道府県に反映」が無い。名称(英)が追加・必須。
 *   - 削除は物理削除＋表示/非表示トグル別建て（設計書は論理削除 del_flg）。登録成功後は一覧でなく編集画面へ戻る。
 *   詳細はケース表の付帯表4（不具合候補）。テストは仕様どおりに書き、乖離は落ちて検出する方針のものは fixme に注記。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - DELIVERY_ID : 編集可能/削除可能な既存の配送方法ID（009/010/011 で使用）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopDeliveryPage } from "../../../pages/admin/m10/m10_06_admin_base_setting_setting_shop_delivery.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const DELIVERY_ID = process.env.DELIVERY_ID || "";

const LOGIN_RE = /\/login(\?|$)/;
const LIST_RE = /\/setting\/shop\/delivery(\?|$)/;
const NEW_RE = /\/setting\/shop\/delivery\/new(\?|$)/;
const EDIT_RE = /\/setting\/shop\/delivery\/\d+\/edit(\?|$)/;

// 仕様（messages.ja.yaml / validators.ja.yaml）由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_NOT_BLANK = "入力されていません。"; // validators.ja.yaml:17 This value should not be blank.
const MSG_SAVE_COMPLETE = "保存しました"; // messages.ja.yaml:1398 admin.common.save_complete
const MSG_DELETE_MODAL_TITLE = "削除します"; // messages.ja.yaml:1592 admin.common.delete_modal__title

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 店舗設定 > 配送方法管理",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 一覧（GET・非破壊） =====

    test("E2E-M10-06-001 一覧画面のページ見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoList();
      // 仕様（設計書「配送方法一覧」）を期待値にする。実装文言「配送方法設定」をオラクル化しない。
      // 刷新先は「配送方法設定」のため本アサーションは落ちて乖離（不具合候補#1）を検出する。
      await expect(page.locator("body")).toContainText("配送方法一覧");
    });

    test("E2E-M10-06-002 一覧の列見出しに「ID」「配送業者名」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoList();
      await expect(d.listIdHeader).toBeVisible(); // 列見出し「ID」
      await expect(d.listNameHeader).toBeVisible(); // trans delivery.delivery_name=「配送業者名」
    });

    test("E2E-M10-06-003 一覧に新規入力ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoList();
      await expect(d.newButton).toBeVisible();
    });

    test("E2E-M10-06-004 新規入力ボタン押下で新規編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoList();
      await d.newButton.click();
      await expect(page).toHaveURL(NEW_RE); // 仕様: 新規用の編集画面が開く
    });

    // ===== 編集画面UI（GET・非破壊） =====

    test("E2E-M10-06-005 新規編集画面に「基本情報」カードと配送業者名・名称(必須)入力が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      await d.seeBasicInfoForm();
    });

    test("E2E-M10-06-006 新規編集画面に「支払方法設定」カードと支払方法チェックボックスが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      // 見出しは仕様「支払方法設定」を期待値にする（刷新先は「取り扱う支払方法」＝不具合候補#2で落ちて検出）。
      await expect(d.paymentHeader).toBeVisible();
      await expect(d.paymentCheckboxes.first()).toBeVisible();
    });

    test("E2E-M10-06-007 新規編集画面に「お届け時間設定」カードが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      await expect(d.deliveryTimeHeader).toBeVisible();
    });

    test("E2E-M10-06-008 新規編集画面に「都道府県別送料設定」見出しが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      await expect(d.deliveryFeeHeader).toBeVisible();
    });

    test("E2E-M10-06-009 編集画面の戻るリンクで配送方法一覧へ戻る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      await d.backToListLink.click();
      await expect(page).toHaveURL(LIST_RE);
    });

    test("E2E-M10-06-010 一覧の編集リンク押下で当該編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!DELIVERY_ID, "DELIVERY_ID（編集可能な既存の配送方法ID）未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoList();
      await d.editLink(DELIVERY_ID).first().click();
      await expect(page).toHaveURL(EDIT_RE); // 仕様: 一覧から編集へ進む→当該編集画面
      await d.seeBasicInfoForm(); // 既存値を読み込んだフォームが表示される
    });

    test("E2E-M10-06-011 削除アイコン押下で確認モーダル「削除します」が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!DELIVERY_ID, "DELIVERY_ID（削除可能な既存の配送方法ID）未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoList();
      await d.deleteTrigger(DELIVERY_ID).first().click();
      await expect(d.deleteModal).toBeVisible();
      await expect(d.deleteModal.locator(".modal-title")).toContainText(MSG_DELETE_MODAL_TITLE);
    });

    test("E2E-M10-06-016 既存編集画面に全都道府県分の送料行と既存支払チェック済みが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!DELIVERY_ID, "DELIVERY_ID（支払方法紐づけ済みの既存配送方法ID）未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoEdit(DELIVERY_ID);
      // 設計書(処理フロー 既存編集GET): 全ての都道府県について送料行がフォームに並び、既に紐づく支払方法はチェック済みで表示される。
      await expect(d.deliveryFeeHeader).toBeVisible();
      // 都道府県別送料の金額入力行が複数（全都道府県分）並ぶ（コレクション #delivery_delivery_fees）。
      const feeInputs = page.locator("#delivery_delivery_fees input");
      expect(await feeInputs.count()).toBeGreaterThan(1);
      // 既存で紐づく支払方法が1件以上チェック済み。
      const checkedPayments = page.locator("#delivery_payments input[type=checkbox]:checked");
      expect(await checkedPayments.count()).toBeGreaterThan(0);
    });

    // ===== バリデーション（POST・検証失敗でDB非更新＝安全） =====

    // オラクル独立性: 各異常系は対象項目「以外」の必須を正当化し、対象項目のみを不正化する。
    // 期待は当該フィールドの .invalid-feedback へスコープし「別の未入力エラーで偶然失敗→誤通過」を防ぐ。
    // 要確認: 都道府県別送料は各行必須（設計書）。新規フォームの送料行が空のまま必須化される場合、完全な単一項目分離には
    //   送料行のシード/動的入力（要実機）が要る。下記は他のテキスト必須＋支払方法1件を成立させた上での近似分離。

    test("E2E-M10-06-020 配送業者名未入力でその欄に「入力されていません。」が表示され保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      // 配送業者名のみ空。他の必須テキスト＋支払方法は正当化して対象項目を分離する。
      await d.fillBasic({ name: "", serviceName: "E2E名称", serviceNameEn: "E2E_EN" });
      await d.selectFirstPayment();
      await d.submitRegister();
      await expect(d.fieldError(d.name)).toContainText(MSG_NOT_BLANK); // 配送業者名NotBlank（判定順序#1）
      await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
    });

    test("E2E-M10-06-021 名称未入力でその欄にエラーが出て保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      await d.fillBasic({ name: "E2E配送", serviceName: "", serviceNameEn: "E2E_EN" }); // 名称のみ空
      await d.selectFirstPayment();
      await d.submitRegister();
      await expect(d.fieldError(d.serviceName)).toContainText(MSG_NOT_BLANK);
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
    });

    test("E2E-M10-06-022 名称(英)未入力でその欄にエラーが出て保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      // 名称(英)は刷新先で追加された必須項目（DeliveryType.php:63-69）。設計書には無く、仕様乖離（不具合候補#3）。
      await d.fillBasic({ name: "E2E配送", serviceName: "E2E名称", serviceNameEn: "" }); // 名称(英)のみ空
      await d.selectFirstPayment();
      await d.submitRegister();
      await expect(d.fieldError(d.serviceNameEn)).toContainText(MSG_NOT_BLANK);
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
    });

    test("E2E-M10-06-023 支払方法0件で保存されず編集画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      // 支払方法以外の必須テキストは正当化し、支払方法のみ0件にして判定順序#2を分離する。
      await d.fillBasic({ name: "E2E配送", serviceName: "E2E名称", serviceNameEn: "E2E_EN" });
      // 支払方法は1件も選択しない（実質必須1件以上：判定順序#2 / バリデーション節）。
      await d.submitRegister();
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
    });

    test("E2E-M10-06-024 伝票No.URLが形式不正だと当該欄でエラーになり保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      // 伝票No.URL以外の必須は正当化し、URLのみ不正化してURL形式制約（バリデーション節）を分離する。
      await d.fillBasic({ name: "E2E配送", serviceName: "E2E名称", serviceNameEn: "E2E_EN", confirmUrl: "not-a-valid-url" });
      await d.selectFirstPayment();
      await d.submitRegister();
      // 文言（メッセージ）はオラクル化せず、当該欄でのエラー表示＋未保存で判定（URL形式制約は仕様由来）。
      await expect(d.fieldError(d.confirmUrl)).toBeVisible();
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
    });

    test("E2E-M10-06-025 伝票No.URLが正当な形式ならURL形式エラーは出ない（024の正常系対）", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      await d.gotoNew();
      // 任意項目の伝票URLに正当なURLを入れる正常系。送信せずとも、提出後に当該欄のURL形式エラーが出ないことを確認する。
      // 非破壊のため必須は満たさず（保存しない）、URL欄に限り形式エラーが出ないことだけをオラクルにする。
      await d.fillBasic({ name: "E2E配送", serviceName: "E2E名称", serviceNameEn: "E2E_EN", confirmUrl: "https://example.com/track" });
      await d.submitRegister();
      await expect(d.fieldError(d.confirmUrl)).toHaveCount(0); // URL形式エラーは出ない（正常値）
    });

    // ===== 権限・認可 / URL直接アクセス（資格情報不要 or 404） =====

    test("E2E-M10-06-050 未ログインで一覧URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/delivery`);
      await expect(page).toHaveURL(LOGIN_RE); // 仕様: 未ログインは管理画面共通認証で拒否→ログイン誘導
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M10-06-051 未ログインで新規編集URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/delivery/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M10-06-052 存在しない識別子の編集URLでは通常の編集フォームが表示されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const d = new BaseSettingSettingShopDeliveryPage(page);
      const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/delivery/99999999/edit`);
      // 仕様（設計書）: 識別子で取得できなければ「その後の処理は実装の分岐に従う」とされ、HTTPステータスは規定されない。
      // よって正常応答(2xx)で編集フォームが開かないこと＝後続処理に進まないことをオラクルにする（404固定は実装由来で混入させない）。
      // 刷新先はParamConverterで404を返す（不具合候補#4）が、それは観測値であり仕様オラクルではない。
      expect(res?.ok()).toBeFalsy(); // 2xxではない（後続処理に進まない）
      await expect(d.basicInfoHeader).toBeHidden(); // 既存値を読み込んだ編集フォームにはならない
    });

    test.fixme(
      "E2E-M10-06-053 存在しない識別子の削除要求は警告フラッシュを表示し一覧へ戻る（破壊的POST・要使い捨て前提）",
      async () => {
        // 期待は仕様（エッジケース「削除対象の識別子が存在しない＝警告フラッシュを積み一覧へリダイレクト」）由来。
        // 刷新先は route requirements id=\d+ ＋ ParamConverter で 404 を返す（不具合候補#4）ため、本ケースは落ちて乖離を検出する。
        // 削除はPOST（CSRFトークン要）かつ状態変化を伴うため、使い捨て前提を整えた上で実機実装する。
      }
    );

    // ===== 保留（破壊的・要動的行操作・要実機。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-06-030 全項目正当で登録すると「保存しました」が表示される（破壊的・要使い捨てシード＋要動的行操作）",
      async () => {
        // 期待は仕様（処理フロー 登録成功 + admin.common.save_complete）由来。
        // 支払方法選択・都道府県別送料(動的追加行)・お届け時間入力が要るため、使い捨てシードで実装。
        // 注: 刷新先は登録成功後に編集画面へ戻る（設計書は一覧へ遷移＝不具合候補#5）。
      }
    );

    test.fixme(
      "E2E-M10-06-031 削除実行で「削除しました」＋一覧へ遷移する（破壊的・物理削除・要使い捨てDELIVERY）",
      async () => {
        // 期待は仕様（処理フロー 削除成功 + admin.common.delete_complete）由来。
        // 刷新先は物理削除（設計書は論理削除 del_flg＝不具合候補#4）。使い捨てレコードで実装。
      }
    );

    test.fixme(
      "E2E-M10-06-032 一覧の並べ替えで確認モーダル→Backdrop表示→sort_no更新（要実機・JS drag&drop）",
      async () => {
        // 期待は仕様（JS挙動 一覧: Backdrop全画面オーバーレイ＋Ajax POST sort_no更新）由来。
        // 刷新先のルートは admin_setting_shop_delivery_sort_no_move（設計書は /rank/move＝不具合候補#6）。
        // 並べ替えは jQuery UI Sortable＋確認モーダルで自動化が不安定なため要実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-06-035 お届け時間を空のまま（他必須は正当）登録してもお届け時間欄起因のエラーは出ない（設計書: 各行任意=034の正常対・要実機）",
      async () => {
        // 期待は仕様（バリデーション「お届け時間はフィールド単体に追加のNotBlankは無い」md:308 ／ エッジケース「空文字のみは保存され得る」md:224）由来。
        // 刷新先は delivery_time に NotBlank 追加（不具合候補#7）のため、設計どおりの正常系は落ちて乖離を検出する。
        // お届け時間行・他必須(支払方法/都道府県別送料)の入力に動的行操作が要るため要実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-06-036 都道府県別送料の境界（0は下限OK／非数値・最大桁超過は当該欄エラー）（要動的行操作・要実機）",
      async () => {
        // 期待は仕様（業務ルール「0以上かつ設定ファイル由来の最大桁制約」price_len=8確認値 md:200,212／Price型 DeliveryFeeType.php:51-57）由来。
        // 033(未入力)の境界補完。送料行の動的追加UI操作が要るため要実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-06-033 都道府県別送料を未入力のまま登録するとエラーで保存されない（要動的行操作・要実機）",
      async () => {
        // 期待は仕様（都道府県別送料は各行必須=Price型）由来。送料行の動的追加UI操作が要るため要実機確認後に実装。
      }
    );

    test.fixme(
      "E2E-M10-06-034 お届け時間行に文言未入力で登録するとエラーになる（要動的行操作・要実機）",
      async () => {
        // 期待は仕様（お届け時間 text行）由来。刷新先は delivery_time に NotBlank 追加（設計書は追加NotBlank無し＝不具合候補#7）。
        // 動的追加行の生成が要るため要実機確認後に実装。
      }
    );

    // ===== 仕様乖離検出（設計書に在るUIが刷新先に無い／変更。仕様どおりに書き落ちて検出する。fixme=要実機/要セレクタ確認） =====
    // これらは「刷新先に無い＝対象外」ではなく、設計書(上位オラクル)を期待値とする乖離検出ケース。落ちることで欠落を検出する。

    test.fixme(
      "E2E-M10-06-012 編集画面の基本情報に商品種別ドロップダウン（必須）が表示される（設計書必須・刷新先欠落=#3）",
      async () => {
        // 期待は仕様（フロント挙動 表示要素(編集・基本): ドロップダウン「商品種別」／入力項目: 商品種別 必須）由来。
        // 刷新先 DeliveryType.php に sale_type 選択フィールドが無い（不具合候補#3）。ロケータは設計書ラベル「商品種別」基準（要実機確認）。
      }
    );

    test.fixme(
      "E2E-M10-06-013 編集画面右カラムにショップ用メモ欄テキストエリアが表示される（設計書あり・刷新先欠落=#3）",
      async () => {
        // 期待は仕様（表示要素(編集・メモ): テキストエリア「ショップ用メモ欄」／入力項目: ショップ用メモ欄 任意=description）由来。
        // 刷新先 DeliveryType.php に description が無い（不具合候補#3）。ロケータは設計書ラベル「ショップ用メモ欄」基準（要実機確認）。
      }
    );

    test.fixme(
      "E2E-M10-06-014 編集画面送料設定に全国一律送料欄と「各都道府県に反映」ボタンが表示される（設計書あり・刷新先欠落=#8）",
      async () => {
        // 期待は仕様（表示要素(編集・送料): 金額入力「全国一律送料」とボタン「各都道府県に反映」／JS挙動(編集): 全送料欄へコピー）由来。
        // 刷新先 delivery_edit.twig に「各都道府県に反映」未描画（不具合候補#8）。ロケータは設計書ラベル基準（要実機確認）。
      }
    );

    test.fixme(
      "E2E-M10-06-015 新規編集画面のお届け時間が最大16行（番号付き）表示される（設計書: 新規は16行充填・刷新先は動的追加=#7）",
      async () => {
        // 期待は仕様（表示要素(編集・時間): 「お届け時間1」〜最大16行／処理フロー: 16未満は空行で16件まで充填）由来。
        // 刷新先は16行固定充填を廃し動的追加に変更（不具合候補#7）。行数の数え方は要実機確認。
      }
    );
  }
);
