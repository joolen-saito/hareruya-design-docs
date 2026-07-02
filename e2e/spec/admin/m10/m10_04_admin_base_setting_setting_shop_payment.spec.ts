/**
 * 管理画面 店舗設定 — 支払方法管理（支払方法・手数料・利用条件）E2E。
 * 納品ケース表 integration_test/e2e/m10_04_admin_base_setting_setting_shop_payment_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」のうち安全に実行できる（非破壊の）ケースのみを置く。手動/対象外はケース表で全量管理する。
 * 自動化予定だが未実装/破壊的（登録・更新・削除・表示順入替でDBを書き換える）/要実機（画像Ajax・MIME）のものは
 * test.fixme（理由付き）で残す。
 * 期待結果は仕様（正本md functions/pf-eccube3/m10-04_...md / 観点表 / ec-cube-enterprise確認値 messages.ja.yaml・
 * validators.ja.yaml）由来とする（オラクル独立性）。実装の現挙動を期待値に写さない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 設計(pf-eccube3リバース)と刷新先(ec-cube-enterprise)の乖離はケース表 付帯表4 に記録済み。テストは仕様どおりに書き、
 * 実装が違えば落ちて検出する（例: 登録成功後の遷移先＝仕様は一覧、実装は編集画面）。
 *
 * 認証fixtureについて: 本リポジトリの e2e ランナーには admin_login.fixture が無く、既存 spec も @playwright/test を直接使う。
 * 既存リポ規約（login.spec.ts / m09系）に倣い @playwright/test + AdminLoginPage 直利用とする。
 *
 * 環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : 管理ログイン（config/default.config）
 *  - PAYMENT_ID : 編集/削除/表示順入替に使える既存の支払方法ID（007/040/041/042 で使用。破壊系は使い捨て前提）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { BaseSettingSettingShopPaymentPage } from "../../../pages/admin/m10/m10_04_admin_base_setting_setting_shop_payment.page";
import {
  ECCUBE_ADMIN_ROUTE,
  ECCUBE_ADMIN_USER,
  ECCUBE_ADMIN_PASS,
} from "../../../config/default.config";

const HAS_CREDS = !!(ECCUBE_ADMIN_USER && ECCUBE_ADMIN_PASS);
const PAYMENT_ID = process.env.PAYMENT_ID || "";

const LOGIN_RE = /\/login(\?|$)/;
const LIST_RE = /\/setting\/shop\/payment(\?|$)/;
const NEW_RE = /\/setting\/shop\/payment\/new(\?|$)/;
const EDIT_RE = /\/setting\/shop\/payment\/\d+\/edit(\?|$)/;

// 仕様（validators.ja.yaml / messages.ja.yaml）由来の表示文言。実装に合わせて変えない（オラクル独立性）。
const MSG_NOT_BLANK = "入力されていません。"; // validators.ja.yaml:17 This value should not be blank.
const MSG_SAVE_COMPLETE = "保存しました"; // messages.ja.yaml:1398 admin.common.save_complete
// 設計md:84 / 観点表 IT-020,060 由来のボタン文言（仕様オラクル）。実装表記「新規作成」は付帯表4#10の乖離。
const MSG_ADD_NEW_LABEL = "支払方法を新規入力";

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ECCUBE_ADMIN_USER, ECCUBE_ADMIN_PASS);
}

test.describe(
  "管理画面 > 店舗設定 > 支払方法管理",
  { tag: ["@admin", "@setting"] },
  () => {
    // ===== 一覧（GET・非破壊） =====

    test("E2E-M10-04-001 一覧見出しに「支払方法」「手数料」「利用条件」列が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoList();
      await pay.seeListHeader();
    });

    test("E2E-M10-04-002 一覧フッタに「支払方法を新規入力」ボタン文言の新規入力導線が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoList();
      // 仕様（フロント挙動 表示要素フッタ: ボタン文言「支払方法を新規入力」/ 設計md:84・観点表IT-020,060）由来。
      await expect(pay.addNewLink).toBeVisible();
      // 仕様の文言で判定する。実装は「新規作成」(付帯表4#10) のため本アサーションは落ちて文言乖離を検出する。
      await expect(pay.addNewLink).toContainText(MSG_ADD_NEW_LABEL);
    });

    test("E2E-M10-04-003 新規入力導線の押下で新規登録・編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoList();
      await pay.addNewLink.click();
      await expect(page).toHaveURL(NEW_RE); // 仕様: 新規用の登録・編集画面が開く
    });

    test("E2E-M10-04-004 新規登録画面に支払方法名・手数料・利用条件・登録ボタンが表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoNew();
      await pay.seeEditForm();
    });

    test("E2E-M10-04-005 新規登録画面の利用条件が下限・上限の2金額欄を「〜」で挟む構成で表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoNew();
      // 仕様（フロント挙動 表示要素編集: 利用条件は2つの金額入力を「〜」で挟む）由来。
      await expect(pay.ruleMin).toBeVisible();
      await expect(pay.ruleMax).toBeVisible();
      await expect(page.locator("body")).toContainText("〜");
    });

    test("E2E-M10-04-006 編集画面の一覧戻りリンクで支払方法一覧へ戻る", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoNew();
      await pay.backToListLink.click();
      await expect(page).toHaveURL(LIST_RE); // 仕様（画面遷移: 一覧へ戻る）
      await pay.seeListHeader();
    });

    test("E2E-M10-04-007 一覧の支払方法名リンク押下で当該編集画面へ遷移する", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoList();
      const link = pay.firstRowEditLink();
      test.skip((await link.count()) === 0, "一覧に支払方法レコードが無い（要シード）");
      // 仕様（利用者視点の入口: 一覧から編集へ進む）由来。
      await link.click();
      await expect(page).toHaveURL(EDIT_RE);
      await pay.seeEditForm();
    });

    test("E2E-M10-04-008 一覧に「上へ」「下へ」操作アイコンが表示され先頭行の「上へ」が無効化される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoList();
      test.skip((await pay.listItems.count()) === 0, "一覧に支払方法レコードが無い（要シード）");
      // 仕様（エッジケース: 表示順入替で隣接行が存在しない＝先頭は上移動不可）由来。
      const up = pay.firstRowUpIcon();
      await expect(up).toBeVisible();
      await expect(up).toHaveClass(/disabled/);
    });

    test("E2E-M10-04-010 一覧に「下へ」操作アイコンが表示され最終行の「下へ」が無効化される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoList();
      test.skip((await pay.listItems.count()) === 0, "一覧に支払方法レコードが無い（要シード）");
      // 仕様（エッジケース 設計md:90,219: 表示順入替で隣接行が存在しない＝最下位は下移動不可）由来。
      const down = pay.lastRowDownIcon();
      await expect(down).toBeVisible();
      await expect(down).toHaveClass(/disabled/);
    });

    test("E2E-M10-04-011 既存支払方法の編集画面に現在の支払方法名が表示される", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      test.skip(!PAYMENT_ID, "PAYMENT_ID 未設定（既存支払方法ID・要シード）");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      // 仕様（処理フロー 編集GET 設計md:124: 当該行の現在値がフォームに載る）由来。URL直接アクセスで編集画面を開く。
      await pay.gotoEdit(PAYMENT_ID);
      await expect(page).toHaveURL(EDIT_RE);
      // 支払方法名欄に現在値（非空）が載ること。具体的な文字列はシード依存のためオラクル化せず「非空」を判定する。
      await expect(pay.method).not.toHaveValue("");
    });

    // 注: 旧 E2E-M10-04-045（削除確認モーダルの見出し「削除します」検証）は削除した。
    // 設計md（JS挙動（一覧）:104「ドラッグ並べ替えやモーダル確認は扱わない」／モーダル:106「管理画面の独自モーダルは使わない」）
    // が当該モーダルを明示的に非対象とするため、削除確認モーダルは実装専用UIであり、仕様オラクルを持たない（オラクル混入）。
    // 削除操作そのものは仕様（一覧で削除を実行する）に基づき E2E-M10-04-040（fixme）でカバーする。

    // ===== バリデーション（POST・検証失敗でDB非更新＝安全） =====

    test("E2E-M10-04-020 支払方法名未入力で登録するとエラーが表示され保存されない", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoNew();
      // 仕様（バリデーション: 支払方法は必須 NotBlank / 判定順序#1）由来。仕様上の必須は支払方法のみのため、
      // 支払方法名を空のまま送信する（実装が追加した必須項目 payment_method_en 等は仕様外＝オラクルに含めない・付帯表4#4）。
      await pay.fillEdit({ method: "" });
      await pay.submitRegister();
      // 主オラクル（仕様: 検証失敗で保存されない）＝成功フラッシュなし＋編集画面に留まる。
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
      // 補助: 必須エラー文言の表示。要確認: 実装は他の必須欄も NotBlank のため本文言が支払方法欄に起因するとは
      // ブラウザ観測だけでは断定できない（フィールド単位の特定は仕様非依存のため非オラクル化・付帯表4#4 要確認）。
      await expect(page.locator("body")).toContainText(MSG_NOT_BLANK);
    });

    test("E2E-M10-04-021 利用条件で上限が下限未満のとき保存されず編集画面に留まる", async ({ page }) => {
      test.skip(!HAS_CREDS, "ECCUBE_ADMIN_USER/PASS 未設定");
      await login(page);
      const pay = new BaseSettingSettingShopPaymentPage(page);
      await pay.gotoNew();
      // 仕様（判定順序#2: 下限・上限が両方入力かつ上限が下限未満なら下限にエラー）由来。
      // 仕様の必須は支払方法のみのため method を有効値で埋め、相関違反（上限<下限）のみを入力する
      // （実装追加の必須項目 payment_method_en 等は仕様外のため埋めない＝実装へ寄せない・付帯表4#4）。
      await pay.fillEdit({ method: "E2E検証用支払方法", ruleMin: "1000", ruleMax: "100" });
      await pay.submitRegister();
      // 主オラクル（仕様: 検証失敗で保存されない）＝成功フラッシュなし＋編集画面に留まる。
      await expect(page).toHaveURL(NEW_RE);
      await expect(page.locator("body")).not.toContainText(MSG_SAVE_COMPLETE);
      // 要確認: 実装の追加必須（付帯表4#4）により、留まる原因が相関違反か他必須欄かはブラウザ観測のみでは
      // 断定不可。相関エラー文言は設計書に固定文言の記載がなくオラクル化しない（実装文言を期待値に写さない）。
    });

    // ===== 権限・認可 / URL直接アクセス（資格情報不要） =====

    test("E2E-M10-04-050 未ログインで一覧URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/payment`);
      await expect(page).toHaveURL(LOGIN_RE); // 仕様（権限・認可: 未認証は管理ログインへ）
      await expect(page.locator("#login_id")).toBeVisible();
    });

    test("E2E-M10-04-051 未ログインで新規登録URLへ直接アクセスすると管理ログイン画面へ誘導される", async ({ page }) => {
      await page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/payment/new`);
      await expect(page).toHaveURL(LOGIN_RE);
      await expect(page.locator("#login_id")).toBeVisible();
    });

    // ===== 保留（破壊的・データ前提・要実機。手動/対象外はケース表で全量管理） =====

    test.fixme(
      "E2E-M10-04-009 固定フラグが編集不可の行は一覧の編集・削除リンクが無効化される（要 固定フラグ行シード・仕様/実装乖離・付帯表4#11）",
      async () => {
        // 期待は仕様（利用者視点の入口 設計md:86「リンクは効かない見た目の錨のみ」/ 入力項目:216「固定フラグが
        // 編集不可の行は一覧では編集・削除リンクが無効化される」/ DBカラム fixed）由来。
        // シードは「編集不可（錨）になる固定フラグ状態」の行が必要（設計用語md:72: fix_flg=1 のみリンク有効＝それ以外が
        // 無効化対象。移行先 fixed boolean の真偽対応は付帯表4#11で要確認）。
        // 実装(ec-cube-enterprise)は fixed による導線無効化分岐を持たず全行リンク有効（payment.twig:154,185）＝乖離。
        // テストは仕様どおり「当該行の編集/削除リンクが無効（リンクとして機能しない）」を判定し、落ちて乖離を検出する。
      }
    );

    test.fixme(
      "E2E-M10-04-030 登録成功で成功メッセージが表示される（破壊的・要使い捨てシード）",
      async () => {
        // 期待は仕様（処理フロー 登録成功: 永続化＋成功フラッシュ）由来。dtb_payment へ追加するため使い捨てで実装。
        // 実装の成功フラッシュは admin.common.save_complete=「保存しました」（要実機確認）。
      }
    );

    test.fixme(
      "E2E-M10-04-031 登録成功後は支払方法一覧へ遷移する（仕様=一覧／実装乖離・付帯表4#8）",
      async () => {
        // 期待は仕様（画面遷移: 登録成功→支払方法一覧 GET）由来。
        // 実装(ec-cube-enterprise)は編集画面へリダイレクト（PaymentController.php:162）＝乖離。テストは仕様どおりで落として検出する。
      }
    );

    test.fixme(
      "E2E-M10-04-032 既存支払方法の更新成功で成功メッセージが表示される（破壊的・要使い捨てシード）",
      async () => {
        // 期待は仕様（処理フロー 登録/更新 設計md:131-137・DB操作md:278-280 persist/flush 即時確定）由来。
        // 既存行を編集して値を変更→登録で永続化されることを更新成功フラッシュで観測する。dtb_payment を書き換えるため使い捨て。
      }
    );

    test.fixme(
      "E2E-M10-04-046 「下へ」押下で隣接行と表示順が入れ替わる（破壊的・Ajax sort_no/move・要複数行）",
      async () => {
        // 期待は仕様（処理フロー 表示順を下へ 設計md:90,166-170: 一つ下の行と表示順入替）由来。要 複数レコード。
        // 実装は action-down→Ajax(admin_setting_shop_payment_sort_no_move)＝設計のPUT /down とは機構乖離（付帯表4#5）。
      }
    );

    test.fixme(
      "E2E-M10-04-047 削除対象が存在しない場合は警告メッセージとともに一覧へ戻る（仕様=警告フラッシュ／実装404乖離・付帯表4#7）",
      async () => {
        // 期待は仕様（処理フロー 削除 設計md:88,154,218: 対象不存在は削除用フラッシュを積み一覧へ戻る・永続化しない）由来。
        // 実装(ec-cube-enterprise)は ParamConverter で不存在→404（PaymentController.php:298）＝乖離。テストは仕様どおりで落として検出する。
      }
    );

    test.fixme(
      "E2E-M10-04-048 画像アップロードの非Ajaxリクエストは不正要求として拒否される（要 request-context 非Ajax）",
      async () => {
        // 期待は仕様（処理フロー ロゴ画像追加 設計md:146: 要求がAjaxでないときは不正要求／エラー処理md:331）由来。
        // 非Ajax（XHRヘッダなし）の画像追加リクエストが不正要求HTTP例外で拒否されること。実装 admin_payment_image_process（PaymentController.php:180）。
      }
    );

    test.fixme(
      "E2E-M10-04-040 削除実行で対象が一覧から消え削除完了が表示される（破壊的・物理削除乖離・付帯表4#6）",
      async () => {
        // 期待は仕様（処理フロー 削除: 対象を一覧取得から除外＋削除完了フラッシュ）由来。要 PAYMENT_ID（使い捨て）。
        // 設計は論理削除、実装は物理削除（PaymentController.php:314）＝乖離。一覧非表示という観測結果は共通。
      }
    );

    test.fixme(
      "E2E-M10-04-041 「上へ」押下で隣接行と表示順が入れ替わる（破壊的・Ajax sort_no/move）",
      async () => {
        // 期待は仕様（表示順を上へ: 一つ上の行と表示順入替）由来。要 複数レコード。
        // 実装は action-up→Ajax(admin_setting_shop_payment_sort_no_move)＝設計のPUT /up とは機構乖離（付帯表4#5）。
      }
    );

    test.fixme(
      "E2E-M10-04-042 表示/非表示トグルで visible 状態が切り替わる（破壊的・要 PAYMENT_ID）",
      async () => {
        // 期待は仕様（DBカラム visible は現行 del_flg の置換＝表示制御）由来。実装 PUT /visible（PaymentController.php:334）。
      }
    );

    test.fixme(
      "E2E-M10-04-043 ロゴ画像の非同期アップロード成功でファイル名が返る（要 multipart/Ajax・FilePond）",
      async () => {
        // 期待は仕様（処理フロー ロゴ画像追加: 一時保存しファイル名をJSON応答）由来。
        // 実装は FilePond /image/process（PaymentController.php:180）＝設計の /image/add とは route 乖離（付帯表4#9）。
      }
    );

    test.fixme(
      "E2E-M10-04-044 画像以外のMIMEのアップロードは Unsupported 系エラーになる（要 multipart/Ajax）",
      async () => {
        // 期待は仕様（エラー処理: 画像MIMEで始まらなければ Unsupported 系HTTP例外）由来。
        // 実装 UnsupportedMediaTypeHttpException（PaymentController.php:198）。
      }
    );
  }
);
