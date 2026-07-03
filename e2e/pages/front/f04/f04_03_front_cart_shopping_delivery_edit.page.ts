import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../../../config/default.config";

/**
 * フロント 購入手続き「注文時の配送先登録・変更（お届け先編集）」（F04-03）Page Object。
 * integration_test/e2e/f04_03_front_cart_shopping_delivery_edit_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f04-03_front_cart_shopping_delivery_edit.md
 * （利用者視点の入口・処理フロー・表示メッセージ・画面遷移・バリデーション）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontShoppingDeliveryEditPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly newEditUrl: string;
  readonly shoppingUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly noticeText: Locator;
  readonly addressNameInput: Locator;
  readonly name01Input: Locator;
  readonly name02Input: Locator;
  readonly kana01Input: Locator;
  readonly kana02Input: Locator;
  readonly tel01Input: Locator;
  readonly tel02Input: Locator;
  readonly tel03Input: Locator;
  readonly countrySelect: Locator;
  readonly zip01Input: Locator;
  readonly zip02Input: Locator;
  readonly zipcodeInput: Locator;
  readonly prefSelect: Locator;
  readonly addr01Input: Locator;
  readonly addr02Input: Locator;
  readonly companyNameInput: Locator;
  readonly modeConfirm: Locator;
  readonly csrfToken: Locator;
  readonly confirmButton: Locator;
  readonly backButton: Locator;
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 利用者視点の入口（設計md）: GET/POST /{_locale}/shopping/delivery/new/edit
    this.newEditUrl = `${this.localePrefix}/shopping/delivery/new/edit`;
    // 上限超過・戻る時の遷移先（ご注文方法指定）
    this.shoppingUrl = `${this.localePrefix}/shopping`;

    // 見出し「配送先の新規登録・変更」。表示メッセージ節（常時表示）由来。
    this.heading = page.getByRole("heading", { name: /配送先の新規登録・変更|Register New\/Change Address/ }).first();
    this.body = page.locator("body");
    // 注意文（既にいただいています…変更されません…）。表示メッセージ節由来。
    this.noticeText = page.locator("body");

    // 入力欄。name はお届け先入力フォーム種別の論理キー由来（要実機確認）。差分に備え広めに拾う。
    this.addressNameInput = page.locator('input[name*="address_name"], input[name*="addressName"]').first();
    this.name01Input = page.locator('input[name*="name][name*=01"], input[name*="name01"]').first();
    this.name02Input = page.locator('input[name*="name02"]').first();
    this.kana01Input = page.locator('input[name*="kana01"]').first();
    this.kana02Input = page.locator('input[name*="kana02"]').first();
    this.tel01Input = page.locator('input[name*="tel01"]').first();
    this.tel02Input = page.locator('input[name*="tel02"]').first();
    this.tel03Input = page.locator('input[name*="tel03"]').first();
    this.countrySelect = page.locator('select[name*="country"]').first();
    this.zip01Input = page.locator('input[name*="zip01"]').first();
    this.zip02Input = page.locator('input[name*="zip02"]').first();
    this.zipcodeInput = page.locator('input[name*="zipcode"]').first();
    this.prefSelect = page.locator('select[name*="pref"]').first();
    this.addr01Input = page.locator('input[name*="addr01"]').first();
    this.addr02Input = page.locator('input[name*="addr02"]').first();
    this.companyNameInput = page.locator('input[name*="company_name"], input[name*="companyName"]').first();
    // 送信モード（mode=confirm 隠し項目）。フロント挙動節由来。
    this.modeConfirm = page.locator('input[type="hidden"][name*="mode"]').first();
    this.csrfToken = page.locator('input[type="hidden"][name="_csrf_token"], input[type="hidden"][name*="csrf"]').first();
    // ボタン文言（要実機確認）。確認画面へ進む／戻る。
    this.confirmButton = page.getByRole("button", { name: /確認画面へ進む|確認|次へ|Confirm|Next/i }).first();
    this.backButton = page.getByRole("link", { name: /戻る|Back/ }).first();
    // 検証エラー枠。Twig差分に備え一般的なエラークラスで拾う。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoNewEdit() {
    await this.page.goto(this.newEditUrl);
  }

  async gotoEdit(id: number | string) {
    await this.page.goto(`${this.localePrefix}/shopping/delivery/${id}/edit`);
  }

  /** お届け先編集画面（見出し・主要入力欄）が表示されていること。 */
  async seeEditScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.addressNameInput).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
  }

  /** 購入手続きの前提未成立で編集画面へ到達していないこと（未ログイン/カート未投入の誘導）。 */
  async seeNotOnEditScreen() {
    await expect(this.heading).toHaveCount(0);
  }
}
