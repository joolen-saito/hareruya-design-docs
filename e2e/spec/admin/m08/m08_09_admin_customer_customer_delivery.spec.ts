/**
 * 管理画面 会員管理 — 配送先一覧表示/編集 E2E。
 * 納品ケース表 integration_test/e2e/m08_09_admin_customer_customer_delivery_e2e_cases.md に対応。
 *
 * 本specには「E2E自動化」ケースのみ実装し、要確認(006:新規追加が設計入口に未記載 / 013:名称任意の乖離)は test.fixme、手動/間接・対象外はケース表で全量管理する
 * （ケース表とspecは完全1:1ではない＝規約「手動/対象外はspecに残さない」に従う）。
 * 期待結果は仕様(functions/pf-eccube3/m08-09_admin_customer_customer_delivery.md / 観点表)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（設計と刷新先実装の乖離。ケース表 付帯表4）:
 *  - 設計の独立「配送先一覧」画面は存在せず、会員編集画面（/admin/customer/{id}/edit）内 #delivery に一覧が描画される。
 *  - 編集/削除URLは /customer/{id}/delivery/{did}/edit, /new, /{did}/delete（会員id＋配送先didの2パラメータ）。
 *  - 配送先名称は設計＝任意だが実装はNotBlank必須（013は設計どおり「任意」を期待＝乖離なら失敗で検出）。
 *  - 成功メッセージは実装キー admin.common.save_complete=「保存しました」（設計キーは刷新先に存在しない）。
 *
 * 実行方針（安全第一・共有ステージング）:
 *  - 資格情報(ECCUBE_ADMIN_USER/PASS)とシード会員/配送先IDが無いと走らないよう test.skip でガード（抜け漏れ可視化）。
 *  - 削除(008/009)は配送先を破壊するため削除専用シード(DELETABLE)を使う。
 *
 * シード/環境変数（コミットしない）:
 *  - ECCUBE_ADMIN_USER / ECCUBE_ADMIN_PASS : SEED-M08-09-ADMIN（config既定）
 *  - CUSTOMER_ID / DELIVERY_ID             : SEED-M08-09-CUSTOMER-WITH-ADDR（既知会員id・配送先did）
 *  - DELETABLE_CUSTOMER_ID / DELETABLE_DELIVERY_ID : SEED-M08-09-CUSTOMER-DELETABLE-ADDR（削除専用・使い捨て）
 *  - FOREIGN_DELIVERY_ID                    : SEED-M08-09-OTHER-CUSTOMER-ADDR（別会員に属する配送先＝認可境界404）
 *  - EMPTY_CUSTOMER_ID                      : SEED-M08-09-CUSTOMER-NO-ADDR（追加配送先0件の会員）
 */
import { test, expect, Page } from "@playwright/test";
import { AdminLoginPage } from "../../../pages/admin/login.page";
import { CustomerCustomerDeliveryPage } from "../../../pages/admin/m08/m08_09_admin_customer_customer_delivery.page";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

// SEED-M08-09-ADMIN（管理者資格情報）
const ADMIN_USER = process.env.ECCUBE_ADMIN_USER || "";
const ADMIN_PASS = process.env.ECCUBE_ADMIN_PASS || "";
const HAS_CREDS = !!(ADMIN_USER && ADMIN_PASS);
// SEED-M08-09-CUSTOMER-WITH-ADDR（既知の会員・配送先）
const CUSTOMER_ID = process.env.CUSTOMER_ID || "";
const DELIVERY_ID = process.env.DELIVERY_ID || "";
const HAS_SEED = !!(HAS_CREDS && CUSTOMER_ID && DELIVERY_ID);
// SEED-M08-09-CUSTOMER-DELETABLE-ADDR（削除専用・使い捨て）
const DEL_CUSTOMER_ID = process.env.DELETABLE_CUSTOMER_ID || "";
const DEL_DELIVERY_ID = process.env.DELETABLE_DELIVERY_ID || "";
const HAS_DELETABLE = !!(HAS_CREDS && DEL_CUSTOMER_ID && DEL_DELIVERY_ID);
// SEED-M08-09-OTHER-CUSTOMER-ADDR（別会員に属する配送先＝認可境界確認）
const FOREIGN_DELIVERY_ID = process.env.FOREIGN_DELIVERY_ID || "";
const HAS_FOREIGN = !!(HAS_SEED && FOREIGN_DELIVERY_ID);
// SEED-M08-09-CUSTOMER-NO-ADDR（追加配送先0件の会員）
const EMPTY_CUSTOMER_ID = process.env.EMPTY_CUSTOMER_ID || "";
const HAS_EMPTY = !!(HAS_CREDS && EMPTY_CUSTOMER_ID);

// 仕様/ロケール由来の表示文言（実装に合わせて変えない＝オラクル独立性。乖離は付帯表4参照）。
const SAVE_COMPLETE = "保存しました"; // 設計「表示メッセージ:成功=保存完了メッセージ」由来（キー admin.customer.save.complete は付帯表4#4で乖離明記）
// 削除の成功文言は設計「表示メッセージ」表に無い（成功時出力=成功メッセージのみ）。
// 実装ロケール文言の固定はオラクル混入のため、削除成功は .alert-success 領域の表示で観測する（successAlert）。
const ADD_ADDRESS = "お届け先住所を追加"; // admin.customer.customer_address__add（messages.ja.yaml:2550）

const LOGIN_RE = /\/login(\?|$)/;
const EDIT_RE = /\/delivery\/\d+\/edit(\?|$)/; // 配送先編集画面
const CUSTOMER_EDIT_RE = /\/customer\/\d+\/edit(\?|$)/; // 会員編集画面

// 有効な配送先入力値（設計の必須項目＝氏名・郵便番号・住所を満たす）。
const VALID_FORM = {
  addressName: "e2e_自宅",
  name01: "山田",
  name02: "太郎",
  kana01: "ヤマダ",
  kana02: "タロウ",
  tel01: "03",
  tel02: "1234",
  tel03: "5678",
  postalCode01: "100",
  postalCode02: "0001",
  pref: "東京都", // 住所フォームの必須項目（設計「配送先の住所等」）。新規登録(006)で都道府県未選択だと保存不可になるため明示。
  addr01: "千代田1-1",
  addr02: "テストビル101",
};

async function login(page: Page) {
  const lp = new AdminLoginPage(page);
  await lp.goto();
  await lp.login(ADMIN_USER, ADMIN_PASS);
}

test.describe("会員管理 > 配送先一覧表示/編集", { tag: ["@admin", "@customer"] }, () => {
  // ===== 認証不要・非破壊（常時実行可） =====

  test("E2E-M08-09-016 未ログインで配送先編集URL→管理ログイン画面へ誘導", async ({ page }) => {
    // 期待は仕様(権限・認可: 未ログインアクセス不可)由来。会員id/配送先idは存在不問（ガードが先行）。
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/1/delivery/1/edit`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  test("E2E-M08-09-017 未ログインで会員編集(配送先一覧)URL→管理ログイン画面へ誘導", async ({ page }) => {
    await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/1/edit`);
    await expect(page).toHaveURL(LOGIN_RE);
    await expect(page.locator("#login_id")).toBeVisible();
  });

  // ===== 一覧表示（会員編集画面 #delivery / SEED-M08-09-CUSTOMER-WITH-ADDR） =====

  test("E2E-M08-09-001 会員編集画面の配送先セクションに登録済み配送先と編集リンクが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定（CUSTOMER_ID/DELIVERY_ID）");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoCustomerEdit(CUSTOMER_ID);
    await expect(target.deliverySection).toBeVisible();
    // 当該会員の配送先が行として一覧表示され（編集リンク＋表示内容）、内容が空でないこと。
    // 期待は設計「当該会員の追加配送先を一覧表示する」由来（名称/氏名/住所の具体値はシード依存のため非固定）。
    await target.seeDeliveryRow(CUSTOMER_ID, DELIVERY_ID);
  });

  test("E2E-M08-09-002 配送先セクションに「お届け先住所を追加」ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoCustomerEdit(CUSTOMER_ID);
    await expect(target.addAddressButton).toBeVisible();
    await expect(target.addAddressButton).toContainText(ADD_ADDRESS);
  });

  // ===== 編集フォーム（配送先編集画面 / SEED-M08-09-CUSTOMER-WITH-ADDR） =====

  test("E2E-M08-09-003 配送先編集画面に配送先名称・氏名・郵便番号・住所欄と登録ボタンが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    await target.seeDeliveryForm();
  });

  test("E2E-M08-09-004 既存配送先を有効値で編集し登録すると保存完了メッセージが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    await target.fillDeliveryForm(VALID_FORM);
    await target.submitRegister();
    await expect(page.locator("body")).toContainText(SAVE_COMPLETE);
  });

  test("E2E-M08-09-005 編集保存後は配送先編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    await target.fillDeliveryForm(VALID_FORM);
    await target.submitRegister();
    await expect(page).toHaveURL(EDIT_RE); // 編集→編集（Controller.php:109-112）
  });

  // 要確認: 設計「利用者視点の入口」は一覧/編集/削除のみで、管理画面からの配送先「新規追加」は入口に未記載。
  // 設計「本書で扱うこと」も一覧表示・編集・削除に限られ、新規追加は実装の追加ボタン由来（付帯表4#8）。
  // 設計確定（新規追加を本機能の入口に含めるか）まで自動実行しない。シード破壊も伴うため fixme で保留する。
  test.fixme(
    "E2E-M08-09-006 「お届け先住所を追加」から新規配送先を登録すると保存完了メッセージが表示される（要確認: 新規追加は設計入口に未記載）",
    async ({ page }) => {
      await login(page);
      const target = new CustomerCustomerDeliveryPage(page);
      await target.gotoCustomerEdit(CUSTOMER_ID);
      await target.addAddressButton.click(); // /customer/{id}/delivery/new へ
      await target.seeDeliveryForm();
      await target.fillDeliveryForm({ ...VALID_FORM, addressName: "e2e_新規配送先" });
      await target.submitRegister();
      await expect(page.locator("body")).toContainText(SAVE_COMPLETE);
    }
  );

  // ===== 削除（削除確認モーダル / SEED-M08-09-CUSTOMER-DELETABLE-ADDR） =====

  test("E2E-M08-09-007 一覧の削除アイコン押下で削除確認モーダルが表示される", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoCustomerEdit(CUSTOMER_ID);
    await target.openDeleteModal(DELIVERY_ID);
    await expect(target.deleteModalTitle).toBeVisible(); // 「削除します」（edit.twig:775）
  });

  test("E2E-M08-09-008 削除確認モーダルで削除確定すると当該配送先が削除され成功メッセージが表示される", async ({ page }) => {
    test.skip(!HAS_DELETABLE, "SEED-M08-09-CUSTOMER-DELETABLE-ADDR 未設定（DELETABLE_CUSTOMER_ID/DELETABLE_DELIVERY_ID）");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoCustomerEdit(DEL_CUSTOMER_ID);
    await target.openDeleteModal(DEL_DELIVERY_ID);
    await target.confirmDelete(DEL_DELIVERY_ID);
    // 期待は設計(成功時出力=成功メッセージ／副作用=削除)由来。文言は固定せず成功フラッシュ領域で観測（オラクル独立）。
    await expect(target.successAlert).toBeVisible();
    // 削除の主目的(当該配送先の削除)を一覧反映で観測: 当該didの編集リンクが一覧から消えること。
    await expect(target.deliveryEditLink(DEL_CUSTOMER_ID, DEL_DELIVERY_ID)).toHaveCount(0);
  });

  test("E2E-M08-09-009 削除後は会員編集画面へ戻り当該配送先が一覧から消える", async ({ page }) => {
    test.skip(!HAS_DELETABLE, "SEED-M08-09-CUSTOMER-DELETABLE-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoCustomerEdit(DEL_CUSTOMER_ID);
    await target.openDeleteModal(DEL_DELIVERY_ID);
    await target.confirmDelete(DEL_DELIVERY_ID);
    await expect(page).toHaveURL(CUSTOMER_EDIT_RE); // 削除→会員編集（設計 画面遷移:削除→一覧へ戻る）
    // 一覧反映: 削除済み配送先が一覧に存在しないこと（設計 データ整合性=一覧反映／副作用=削除）。
    await expect(target.deliveryEditLink(DEL_CUSTOMER_ID, DEL_DELIVERY_ID)).toHaveCount(0);
  });

  // ===== エラー処理 / バリデーション =====

  test("E2E-M08-09-010 存在しない配送先IDで編集URL→404", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    // 存在しない did（巨大値）でアクセス。期待は仕様(配送先なし→404 Controller.php:67-69)由来。
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/${CUSTOMER_ID}/delivery/999999999/edit`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M08-09-011 氏名(姓)未入力で登録→エラー表示・編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    await target.fillDeliveryForm({ ...VALID_FORM, name01: "" }); // 姓を空に
    await target.submitRegister();
    await expect(target.fieldError.first()).toBeVisible(); // 入力エラー（.invalid-feedback）
    await expect(page).toHaveURL(EDIT_RE); // 保存されず編集画面に留まる
  });

  test("E2E-M08-09-012 国内宛で郵便番号未入力→郵便番号整合エラー・保存されない", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    await target.fillDeliveryForm({ ...VALID_FORM, postalCode01: "", postalCode02: "" });
    await target.submitRegister();
    await expect(target.fieldError.first()).toBeVisible(); // 郵便番号整合エラー
    await expect(page).toHaveURL(EDIT_RE);
  });

  test("E2E-M08-09-014 配送先名称が最大長(128文字)でもエラーにならず保存できる", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    // 期待は設計(最大長128)由来。設定値が128と一致するかは付帯表4#5 要確認。
    await target.fillDeliveryForm({ ...VALID_FORM, addressName: "あ".repeat(128) });
    await target.submitRegister();
    await expect(page.locator("body")).toContainText(SAVE_COMPLETE);
  });

  test("E2E-M08-09-015 配送先名称が最大長+1(129文字)→エラー表示・保存されない", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    // 期待は設計(最大長128超過はエラー)由来。maxlength属性によるクライアント側truncateは付帯表4#5 要確認。
    await target.fillDeliveryForm({ ...VALID_FORM, addressName: "あ".repeat(129) });
    await target.submitRegister();
    await expect(target.fieldError.first()).toBeVisible();
    await expect(page).toHaveURL(EDIT_RE);
  });

  test("E2E-M08-09-019 住所(住所1)未入力で登録→エラー表示・編集画面に留まる", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
    // 期待は設計(入力項目「配送先の住所等」必須・エラー処理 検証失敗→再表示)由来。
    await target.fillDeliveryForm({ ...VALID_FORM, addr01: "" }); // 住所1を空に
    await target.submitRegister();
    await expect(target.fieldError.first()).toBeVisible();
    await expect(page).toHaveURL(EDIT_RE); // 保存されず編集画面に留まる
  });

  // ===== 権限・認可（当該会員の配送先のみ） / 一覧0件 / モーダル中断 =====

  test("E2E-M08-09-018 別会員に属する配送先IDで編集URL→404", async ({ page }) => {
    test.skip(!HAS_FOREIGN, "SEED-M08-09-OTHER-CUSTOMER-ADDR 未設定（FOREIGN_DELIVERY_ID）");
    await login(page);
    // 自会員idの配下に別会員の配送先did。期待は設計(権限・認可「当該会員の配送先のみ」/エラー処理「該当なし→404」)由来。
    // 実装は findOneBy(id+Customer) で該当なし→404（CustomerDeliveryEditController.php:60-69）。
    const res = await page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/${CUSTOMER_ID}/delivery/${FOREIGN_DELIVERY_ID}/edit`);
    expect(res?.status()).toBe(404);
  });

  test("E2E-M08-09-020 追加配送先が無い会員の編集画面では配送先行が表示されない", async ({ page }) => {
    test.skip(!HAS_EMPTY, "SEED-M08-09-CUSTOMER-NO-ADDR 未設定（EMPTY_CUSTOMER_ID）");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoCustomerEdit(EMPTY_CUSTOMER_ID);
    await expect(target.deliverySection).toBeVisible();
    // 期待は設計「当該会員の追加配送先を一覧表示する」由来（0件は行なし）。空表示の文言はオラクル化せず非固定。
    await expect(page.locator(`#delivery a[href*="/delivery/"][href$="/edit"]`)).toHaveCount(0);
  });

  test("E2E-M08-09-021 削除確認モーダルでキャンセルすると配送先は削除されない", async ({ page }) => {
    test.skip(!HAS_SEED, "SEED-M08-09-CUSTOMER-WITH-ADDR 未設定");
    await login(page);
    const target = new CustomerCustomerDeliveryPage(page);
    await target.gotoCustomerEdit(CUSTOMER_ID);
    await target.openDeleteModal(DELIVERY_ID);
    await expect(target.deleteModalTitle).toBeVisible();
    await target.cancelDelete(DELIVERY_ID);
    // 期待は設計(副作用＝削除のみ＝送信中断時は副作用なし)由来。当該配送先が一覧に残ること（非破壊）。
    await expect(target.deliveryEditLink(CUSTOMER_ID, DELIVERY_ID)).toHaveCount(1);
  });

  // ===== 保留（要確認・抜け漏れ可視化。手動/間接・対象外はケース表で全量管理） =====

  test.fixme(
    "E2E-M08-09-013 配送先名称(設計=任意)未入力でも保存継続できる（要確認: 実装はNotBlank必須＝付帯表4#3）",
    async ({ page }) => {
      // 期待は設計(入力項目: 配送先名称＝任意)由来。実装(CustomerAddressType.php:56-64)は required=true+NotBlank。
      // 設計を上位オラクルとし「任意＝保存完了」を期待する。実装が必須なら本ケースは失敗＝乖離検出。
      // 業務確認(任意/必須どちらが正か)を待つため fixme のまま保留（有効化時に下記が実行される）。
      await login(page);
      const target = new CustomerCustomerDeliveryPage(page);
      await target.gotoDeliveryEdit(CUSTOMER_ID, DELIVERY_ID);
      await target.fillDeliveryForm({ ...VALID_FORM, addressName: "" }); // 配送先名称を空に
      await target.submitRegister();
      await expect(page.locator("body")).toContainText(SAVE_COMPLETE); // 設計=任意→保存完了
    }
  );
});
