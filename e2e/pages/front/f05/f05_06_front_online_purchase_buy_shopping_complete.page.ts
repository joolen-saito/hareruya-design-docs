import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント ネット買取「買取手続き〜完了」（F05-06）Page Object。
 * integration_test/e2e/f05_06_front_online_purchase_buy_shopping_complete_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f05-06_front_online_purchase_buy_shopping_complete.md
 * （画面・処理フロー・判定順序・表示メッセージ）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは Twig 差分に耐えるよう
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本機能は 記入→ログイン→確認→完了 の破壊的フローの終端であり、完了画面や確定副作用の観測は
 * 買取カート投入・会員ログイン・申込確定が前提。非破壊で走るのは fill ガード / complete 直接アクセスのみ。
 */
export class FrontPurchaseCompletePage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly fillUrl: string;
  readonly loginUrl: string;
  readonly completeUrl: string;

  readonly body: Locator;
  readonly confirmHeading: Locator; // 「買取依頼内容の確認」（記入・確認画面）
  readonly completeHeading: Locator; // 「買取依頼完了」（完了画面）
  readonly bankNameInput: Locator;
  readonly branchNameInput: Locator;
  readonly accountTypeRadio: Locator;
  readonly accountNoInput: Locator;
  readonly accountHolderInput: Locator;
  readonly packageCountSelect: Locator;
  readonly autoApprovalRadio: Locator;
  readonly qualifiedInvoiceCodeInput: Locator;
  readonly csrfToken: Locator;
  readonly submitButton: Locator;
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.fillUrl = `${this.localePrefix}/purchase/fill`;
    this.loginUrl = `${this.localePrefix}/purchase/login`;
    this.completeUrl = `${this.localePrefix}/purchase/complete`;

    this.body = page.locator("body");
    // 見出しは設計md「表示メッセージ（常時表示）」由来。Twig 未取込のためセレクタは要実機確認。
    this.confirmHeading = page.getByRole("heading", { name: /買取依頼内容の確認/ }).first();
    this.completeHeading = page.getByRole("heading", { name: /買取依頼完了/ }).first();
    // 振込口座欄・個口数・自動承諾・登録番号は意味で寄せる（name/id は要実機確認）。
    this.bankNameInput = page.locator('input[name*="bank_code"], input[name*="bank_name"]').first();
    this.branchNameInput = page.locator('input[name*="branch_code"], input[name*="branch_name"]').first();
    this.accountTypeRadio = page.locator('input[type="radio"][name*="account_type"]').first();
    this.accountNoInput = page.locator('input[name*="account_no"]').first();
    this.accountHolderInput = page.locator('input[name*="account_holder"]').first();
    this.packageCountSelect = page.locator('select[name*="packageCount"], select[name*="package_count"]').first();
    this.autoApprovalRadio = page.locator('input[type="radio"][name*="autoApprovalFlg"], input[type="radio"][name*="auto_approval"]').first();
    this.qualifiedInvoiceCodeInput = page.locator('input[name*="qualifiedInvoiceIssuerCode"], input[name*="qualified_invoice_issuer_code"]').first();
    this.csrfToken = page.locator('input[type="hidden"][name="_csrf_token"], input[type="hidden"][name*="csrf"]').first();
    this.submitButton = page.getByRole("button", { name: /確認|確定|買取依頼|次へ/ }).first();
    // 各入力欄付近のエラー枠（front.purchase.error.*）。Twig 差分に備え文言と一般クラスで拾う。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoFill() {
    await this.page.goto(this.fillUrl);
  }

  async gotoLogin() {
    await this.page.goto(this.loginUrl);
  }

  async gotoComplete() {
    await this.page.goto(this.completeUrl);
  }

  /** 会員資格情報でログインする（要ログイン系ケースの前段。実行は creds のある環境のみ）。 */
  get creds() {
    return { user: ECCUBE_FRONT_USER, pass: ECCUBE_FRONT_PASS };
  }

  /** 記入画面（確認フォーム）が表示されていないこと（カート無・未ログイン時のガード観測）。 */
  async seeFillFormNotShown() {
    await expect(this.confirmHeading).toHaveCount(0);
    await expect(this.page).not.toHaveURL(/\/purchase\/fill(?:\?|$)/);
  }

  /** 完了画面に有効なオーダーID（PU＋日付＋連番）が表示されていないこと。期待は設計md「完了再訪」由来。 */
  async seeNoOrderId() {
    // オーダーID = PU + 年月日6桁 + 受注ID10桁ゼロ詰め（設計md 業務ルール）。
    await expect(this.body).not.toContainText(/PU\d{12,}/);
  }
}
