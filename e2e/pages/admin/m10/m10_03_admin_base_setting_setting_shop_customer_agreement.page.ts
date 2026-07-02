import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定／利用規約（m10_03）Page Object。
 * 納品ケース表 integration_test/e2e/m10_03_admin_base_setting_setting_shop_customer_agreement_e2e_cases.md に対応。
 *
 * 【重要】screenExists=false: pf-eccube3 の専用画面「利用規約設定画面」
 *  （GET/POST /{admin_route}/setting/shop/customer_agreement・単一「利用規約」textarea(NotBlank)・
 *   ボタン「規約を登録」・保存先 dtb_help.customer_agreement）は刷新先 ec-cube-enterprise に存在しない
 *  （grep customer_agreement ヒット0／Controller/Admin/Setting/Shop/ に該当なし）。
 *  利用規約本文の編集はページ管理（コンテンツ管理）側の固定ページ編集へ委譲されている。
 *  本 Page Object は「移行先」のページ編集画面（page_edit.twig の ?return=agreement モード）を
 *  最小限モデル化する。原画面の textarea/「規約を登録」/customer_agreement のセレクタは導出不能（創作禁止）。
 *
 * 期待結果は仕様（pf-eccube3 正本 m10-03_admin_base_setting_setting_shop_customer_agreement.md）由来（オラクル独立性）。
 *  原仕様の表示オラクルは「ショップ設定」「利用規約管理」「利用規約」textarea「規約を登録」（正本md:80-81）であり、
 *  移行先の「利用規約設定」「登録」「#editor」等は刷新先実測値であって原仕様オラクルではない（不具合候補#1〜#3）。
 *  本 PO は移行先到達の観測スモーク用であり、原仕様オラクルとの不一致それ自体が検出対象である。
 * セレクタは移行先 Twig（src/Eccube/Resource/template/admin/Content/page_edit.twig）由来の位置情報のみ（DOM由来・創作なし）。
 *  編集フォーム本体は MainEditType（getBlockPrefix=main_edit。MainEditType.php:278）で、本文 hidden は #main_edit_tpl_data
 *  （page_edit.twig:70 で実装確定。創作でない）。PageType（getBlockPrefix=admin_page。PageType.php）はレイアウト副フォームのみ。
 *  未確定なのは entry route（利用規約ページ page id=19 への到達導線）のみで、全件 要実機確認のうえ test.fixme とする。
 *
 * セレクタ根拠:
 *  - 移行先タイトル「利用規約設定」 trans admin.setting.shop.agreement_setting（page_edit.twig:20 / messages.ja.yaml:2777）※移行先実測
 *  - 編集フォーム #content_page_form（page_edit.twig:96）
 *  - 本文エディタ #editor（Ace。page_edit.twig:46,63,205）／本文 hidden #main_edit_tpl_data（page_edit.twig:70）
 *  - 登録ボタン「登録」 trans admin.common.registration（page_edit.twig:366 / messages.ja.yaml:1436）※移行先実測
 *  - フィールドエラー .is-invalid（#editor 上。page_edit.twig:205）/ form_errors（page_edit.twig:207）
 *  - 更新日 trans admin.common.update_date=「更新日」（page_edit.twig:214 / messages.ja.yaml:1643）
 *  - ルート admin_content_page_edit（PageController.php:90）
 *
 * 【重大な前提リスク（要確認）】移行先の利用規約ページ help_agreement は id=19・edit_type=2（EDIT_TYPE_DEFAULT。
 *  dtb_page.csv:34 / Page.php:39,46）であり、page_edit.twig:57-61 が is_user_data_page=false の既定ページで
 *  Ace エディタを setReadOnly(true) にする（PageController.php:113）。すなわち本画面では利用規約「本文」を編集できない
 *  可能性が高く、本文編集系（fillBody を使う E2E-004/006/008）は本導線では成立しない（不具合候補#6）。
 */
export class BaseSettingSettingShopCustomerAgreementPage {
  readonly page: Page;

  // 移行先(ページ管理)の利用規約ページ編集 URL。page id は要実機確認のため引数で受け取る。
  readonly editForm: Locator; // #content_page_form（page_edit.twig:96）
  readonly aceEditor: Locator; // #editor（Ace 本文エディタ。page_edit.twig:46,63,205）
  readonly tplDataHidden: Locator; // 本文 hidden（送信時に editor 値を反映。page_edit.twig:70。MainEditType=main_edit で実装確定）
  readonly registerButton: Locator; // 「登録」trans admin.common.registration（page_edit.twig:366）※移行先実測
  readonly fieldError: Locator; // .is-invalid（#editor 上。page_edit.twig:205）
  readonly updateDateLabel: Locator; // 「更新日」ラベル（page_edit.twig:214 trans admin.common.update_date / messages.ja.yaml:1643）

  constructor(page: Page) {
    this.page = page;
    this.editForm = page.locator("#content_page_form");
    this.aceEditor = page.locator("#editor");
    this.tplDataHidden = page.locator("#main_edit_tpl_data"); // page_edit.twig:70（MainEditType getBlockPrefix=main_edit）
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.fieldError = page.locator(".is-invalid");
    this.updateDateLabel = page.getByText("更新日");
  }

  /** 移行先の利用規約ページ編集 URL（?return=agreement）。page id は要実機確認。 */
  editUrl(pageId: number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/content/page/${pageId}/edit?return=agreement`;
  }

  async gotoEdit(pageId: number) {
    await this.page.goto(this.editUrl(pageId));
  }

  /**
   * 移行先のページ編集画面に到達したことを観測する（移行先到達スモーク）。
   * 注: 「利用規約設定」は移行先実測タイトル（?return=agreement モード）であり原仕様オラクルではない。
   * 原仕様オラクルは「ショップ設定／利用規約管理／規約を登録」（正本md:80）で、移行先がこれを表示しないこと自体が
   * 不具合候補#1の検出対象。さらに ?return=agreement は保存後に維持されない（不具合候補#5）ため、初回 GET のみで観測する。
   */
  async seeAgreementEditScreen() {
    await expect(this.page.locator("body")).toContainText("利用規約設定");
    await expect(this.editForm).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * 本文（Ace エディタ）にテキストを設定する。Ace は textarea 直 fill 不可のため API 経由（要実機確認）。
   * 【要確認】help_agreement は edit_type=2（既定ページ）で page_edit.twig:57-61 が editor を readOnly にするため、
   * 本導線では本文編集できない可能性が高い（不具合候補#6）。実機確認で編集導線が別経路の場合は委譲先（m09_04）へ移す。
   */
  async fillBody(text: string) {
    // Ace エディタは #editor のDOMに直接 value を持たないため、ace API で設定する（要実機確認）。
    await this.page.evaluate((value: string) => {
      const w = window as unknown as { ace?: { edit: (id: string) => { setValue: (v: string) => void } } };
      w.ace?.edit("editor").setValue(value);
    }, text);
  }

  async submitRegister() {
    await this.registerButton.click();
  }
}
