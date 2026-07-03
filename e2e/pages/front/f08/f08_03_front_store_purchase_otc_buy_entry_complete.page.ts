import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 店頭買取「査定申込登録確認〜完了」（F08-03）Page Object。
 * integration_test/e2e/f08_03_front_store_purchase_otc_buy_entry_complete_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f08-03_front_store_purchase_otc_buy_entry_complete.md
 * （利用者視点の入口・処理フロー・判定順序・表示メッセージ・画面遷移・データ整合性）由来。
 *
 * 本機能は確認/完了ステップで、店舗ごとのURL `/otcbuy/{name}/confirm|complete` で扱う
 * （{name}=店舗識別子＝HTMLクラス名。現行=htmlClassName／移行先=dtb_base_info.html_class_name）。
 * 店舗識別子は環境変数 ECCUBE_FRONT_SHOP を流用する（f08_01 と同型）。
 * 確認/完了画面への到達には F08-02 からの受付フロー＋セッション入力データが前提で、登録は
 * 査定申込レコードを永続化する破壊的処理のため、多くの観測メソッドは fixme 側で用いる。
 * pf-eccube3 の Twig（OtcBuy/confirm.twig・complete.twig と *.en.twig）は本リポジトリに未取込のため、
 * セレクタはURL・表示文言・フォーム意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontStorePurchaseOtcBuyEntryCompletePage {
  readonly page: Page;
  readonly store: string;
  readonly localePrefix: string;
  readonly entryUrl: string;
  readonly confirmUrl: string;
  readonly completeUrl: string;
  readonly invalidStoreCompleteUrl: string;
  readonly invalidStoreConfirmUrl: string;

  readonly body: Locator;
  readonly completionHeading: Locator; // 由来: complete.twig 完了文言「査定申込みが完了しました。」(要実機確認)
  readonly assessmentNumber: Locator; // 由来: 「査定番号：…」(要実機確認)
  readonly counterGuide: Locator; // 由来: 買取カウンター案内(要実機確認)
  readonly idGuide: Locator; // 由来: 身分証明書案内(要実機確認)
  readonly minorGuide: Locator; // 由来: 未成年案内(成年判定・要実機確認)
  readonly autoTransitionGuide: Locator; // 由来: 自動遷移の秒数案内(要実機確認)
  readonly metaRefresh: Locator; // 由来: <meta http-equiv="refresh">(自動遷移・要実機確認)
  readonly backToEntryButton: Locator; // 由来: 「査定申込みへ戻る」ボタン(要実機確認)
  readonly registerSuccessMessage: Locator; // 由来: 仮会員登録完了メッセージ(register成功・要実機確認)
  readonly registerFailureMessage: Locator; // 由来: 会員登録できなかった案内(register失敗・要実機確認)
  readonly confirmSubmitButton: Locator; // 由来: 「会員登録して申込み」/「査定申込み」ボタン(要実機確認)
  readonly confirmBackButton: Locator; // 由来: 確認画面の「戻る」ボタン(要実機確認)
  readonly errorArea: Locator; // 由来: インラインエラー表示枠(要実機確認)

  constructor(page: Page) {
    this.page = page;
    this.store = ECCUBE_FRONT_SHOP || "";
    // otcbuy ルートは管理プレフィックスを持たないフロントページ。locale は環境により付く場合があるため保持のみ。
    this.localePrefix = ECCUBE_FRONT_LOCALE ? `/${ECCUBE_FRONT_LOCALE}` : "";
    this.entryUrl = `/otcbuy/${this.store}`;
    this.confirmUrl = `/otcbuy/${this.store}/confirm`;
    this.completeUrl = `/otcbuy/${this.store}/complete`;
    // 店舗識別子が該当なしのケース（404 期待）。実在しない店舗名を用いる。
    this.invalidStoreCompleteUrl = `/otcbuy/__e2e_no_such_store__/complete`;
    this.invalidStoreConfirmUrl = `/otcbuy/__e2e_no_such_store__/confirm`;

    this.body = page.locator("body");
    this.completionHeading = page.getByText(/査定申込みが完了しました|Assessment registration is complete/i).first();
    this.assessmentNumber = page.getByText(/査定番号|Assessment Number/i).first();
    this.counterGuide = page.getByText(/買取カウンターで/).first();
    this.idGuide = page.getByText(/身分証明書をご用意ください|prepare your ID/i).first();
    this.minorGuide = page.getByText(/未成年の方は保護者同意書|under 18/i).first();
    this.autoTransitionGuide = page.getByText(/秒後に自動で査定申込みへ遷移|automatically return to the registration page/i).first();
    this.metaRefresh = page.locator('meta[http-equiv="refresh" i]');
    this.backToEntryButton = page.getByRole("link", { name: /査定申込みへ戻る|Back/i }).first();
    this.registerSuccessMessage = page.getByText(/仮会員登録が完了しました|Pre-registration is complete/i).first();
    this.registerFailureMessage = page.getByText(/会員登録ができませんでした|not valid for membership registration/i).first();
    this.confirmSubmitButton = page.getByRole("button", { name: /会員登録して申込み|査定申込み|Membership and Assessment|Apply for Assessment/i }).first();
    this.confirmBackButton = page.getByRole("button", { name: /戻る|Back/i }).first();
    // インラインエラー表示枠。Twig差分に備え文言と一般的なエラークラスの双方で拾う。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoConfirmDirect() {
    await this.page.goto(this.confirmUrl);
  }

  async gotoCompleteDirect() {
    return this.page.goto(this.completeUrl);
  }

  async gotoInvalidStoreComplete() {
    return this.page.goto(this.invalidStoreCompleteUrl);
  }

  /**
   * ガード観測（live用・非破壊）: 査定ID/エントリー前提が無い状態で確認・完了URLへ直接アクセスしても、
   * 完了内容（完了文言・査定番号）を表示しないこと。期待は設計書「完了処理#1（査定IDなし→エントリー戻し）」
   * 「判定順序#3（エントリー前提を満たさない→エントリー戻し）」由来。
   * 実装のエントリー戻し先URLは要実機確認のため、URL断定ではなく完了内容の非表示で判定する。
   */
  async seeNotCompletionScreen() {
    await expect(this.body).not.toContainText("査定申込みが完了しました");
    await expect(this.body).not.toContainText("Assessment registration is complete");
  }

  /** 完了画面の主要素（完了文言・申込者氏名）を表示していること。期待は設計書「表示メッセージ」節由来。 */
  async seeCompletionScreen() {
    await expect(this.completionHeading).toBeVisible();
  }
}
