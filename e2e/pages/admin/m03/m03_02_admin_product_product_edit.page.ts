import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品編集 Page Object（GET /{admin_route}/product/product/{id}/edit）。
 * 納品ケース表 integration_test/e2e/m03_02_admin_product_product_edit_e2e_cases.md に対応。
 *
 * 設計源は pf-eccube3 のリバース（functions/pf-eccube3/m03-02_admin_product_product_edit.md）であり、
 * 刷新先 ec-cube-enterprise を実機セレクタ源とする。期待結果は設計書/観点表（仕様）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_product`（ProductType.php:380-384）由来の位置情報のみ。
 *
 * 刷新先の構成差（設計の dtb_product_sub は dtb_product 本体へ統合）により、商品名(英)等の付加情報も
 * 同一フォーム `admin_product` 配下の id を持つ。DOM id 根拠:
 *  - name → #admin_product_name（product.twig:198 form.name）
 *  - name_en → #admin_product_name_en（product.twig:209 form.name_en）
 *  - description_detail → #admin_product_description_detail（product.twig:265）
 *  - search_word → #admin_product_search_word（product.twig:350）
 *  - note(ショップ用メモ) → #admin_product_note（product.twig:793 / ラベル admin.common.shop_memo messages.ja.yaml:778）
 *  - CardDetail(hidden) → #admin_product_CardDetail（product.twig:173 form.CardDetail）
 *  - Status(商品ステータス) → #admin_product_Status（product.twig:820 form.Status。表示条件は要確認・付帯表4#2）
 *  - カテゴリ チェックボックス → #admin_product_category_{id} / name=admin_product[Category][]（product.twig:626-627）
 *  - 登録(更新)ボタン → type=submit trans admin.common.registration「登録」（product.twig:824-825 / messages.ja.yaml:1436）
 *  - カード指定ボタン → data-bs-target=#searchCardDetailModal trans admin.product.card_detail_select「カード指定」（product.twig:176-178 / :2071）
 *  - カード検索モーダル → #searchCardDetailModal（product.twig:85）
 *  - 削除ボタン → data-bs-target=#deleteModal trans admin.common.delete「削除」（product.twig:577-579 / :1444）/ 削除確認モーダル #deleteModal（product.twig:53）
 *  - 規格設定リンク → url('admin_product_product_class') trans admin.product.product_class__setting「規格設定」（product.twig:562-564 / :1918）
 *  - 確認ボタン → target=_blank url('product_detail') trans admin.common.confirm「確認」（product.twig:566-568 / :1448）
 *  - 商品一覧へ戻るリンク → trans admin.product.product_list「商品一覧」（product.twig:807-815 / :1724）
 *  - 商品ID表示 → <p>{{ Product.id }}（product.twig:160。更新時=id is not null のときのみ表示）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductEditPage {
  readonly page: Page;

  readonly name: Locator; // #admin_product_name（product.twig:198）
  readonly nameEn: Locator; // #admin_product_name_en（product.twig:209）
  readonly descriptionDetail: Locator; // #admin_product_description_detail（product.twig:265）
  readonly searchWord: Locator; // #admin_product_search_word（product.twig:350）
  readonly note: Locator; // #admin_product_note ショップ用メモ（product.twig:793）
  readonly size: Locator; // #admin_product_size（ProductType.php:177 IntegerType。設計: NotBlank/Length max9/0..999999999）
  readonly weight: Locator; // #admin_product_weight（ProductType.php:186 IntegerType。設計: NotBlank/Length max9/0..999999999）
  readonly cardDetailHidden: Locator; // #admin_product_CardDetail hidden（product.twig:173）
  readonly status: Locator; // #admin_product_Status（product.twig:820）
  readonly registerButton: Locator; // 登録(更新)submit（product.twig:824-825）

  readonly cardSelectButton: Locator; // カード指定（product.twig:176-178）
  readonly cardSearchModal: Locator; // #searchCardDetailModal（product.twig:85）
  readonly deleteButton: Locator; // 削除（product.twig:577-579）
  readonly deleteModal: Locator; // #deleteModal（product.twig:53）
  readonly productClassLink: Locator; // 規格設定（product.twig:562-564）
  readonly confirmFrontLink: Locator; // 確認（フロント別タブ）（product.twig:566-568）
  readonly backToListLink: Locator; // 商品一覧へ戻る（product.twig:807-815）
  readonly productIdValue: Locator; // 商品ID 表示（product.twig:160）

  readonly basicInfoCard: Locator; // 基本情報カード #basicConfig（product.twig:148）
  readonly freeAreaCard: Locator; // フリーエリアカード #freeArea（product.twig:536）
  readonly mainForm: Locator; // #form1（product.twig:124）
  readonly errors: Locator; // form_errors / invalid-feedback（バリデーションエラー表示）

  constructor(page: Page) {
    this.page = page;

    this.name = page.locator("#admin_product_name");
    this.nameEn = page.locator("#admin_product_name_en");
    this.descriptionDetail = page.locator("#admin_product_description_detail");
    this.searchWord = page.locator("#admin_product_search_word");
    this.note = page.locator("#admin_product_note");
    this.size = page.locator("#admin_product_size");
    this.weight = page.locator("#admin_product_weight");
    this.cardDetailHidden = page.locator("#admin_product_CardDetail");
    this.status = page.locator("#admin_product_Status");
    this.registerButton = page.getByRole("button", { name: "登録", exact: true });

    this.cardSelectButton = page.locator('[data-bs-target="#searchCardDetailModal"]');
    this.cardSearchModal = page.locator("#searchCardDetailModal");
    this.deleteButton = page.locator('[data-bs-target="#deleteModal"]');
    this.deleteModal = page.locator("#deleteModal");
    this.productClassLink = page.getByRole("link", { name: "規格設定" });
    this.confirmFrontLink = page.getByRole("link", { name: "確認", exact: true });
    this.backToListLink = page.getByRole("link", { name: "商品一覧" });
    // 商品ID は基本情報カード冒頭の <p> に出力される（更新時のみ。値は Product.id）。
    this.productIdValue = page.locator("#basicConfig .card-body p").first();

    this.basicInfoCard = page.locator("#basicConfig");
    this.freeAreaCard = page.locator("#freeArea");
    this.mainForm = page.locator("#form1");
    // Symfony の form_errors は .invalid-feedback / .text-danger 等で出力される（実体は要実機確認）。
    // ヘッダ等のグローバルなアラートを誤検出しないよう、編集フォーム(#form1)配下に限定する（オラクル汚染防止）。
    this.errors = this.mainForm.locator(
      ".invalid-feedback, .text-danger, .form-error-message"
    );
  }

  /**
   * 指定フィールドの直近のエラー表示を取得する（フィールド単位の検証用）。
   * Symfony Form は通常フィールドを form-group/col 等で包むため、最も近い祖先ブロック内の
   * エラー要素を拾う。包み要素のクラスは実機で確定する（要実機確認・付帯表4#4）。
   */
  fieldErrors(field: Locator): Locator {
    return field
      .locator(
        'xpath=ancestor::*[contains(@class,"form-group") or contains(@class,"col") or contains(@class,"mb-")][1]'
      )
      .locator(".invalid-feedback, .text-danger, .form-error-message");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/product/${id}/edit`;
  }

  /** 商品編集画面をGET表示する。Response を返し 404 等の判定に使う。 */
  async goto(id: number | string) {
    return await this.page.goto(this.editUrl(id));
  }

  /** 登録(更新)ボタンを押下する。 */
  async submit() {
    await this.registerButton.click();
  }

  /** 指定カテゴリのチェックボックスを取得（#admin_product_category_{id}）。 */
  categoryCheckbox(categoryId: number | string): Locator {
    return this.page.locator(`#admin_product_category_${categoryId}`);
  }

  /** 選択中の全カテゴリチェックを外す（必須バリデーション検証用）。 */
  async uncheckAllCategories() {
    const checked = this.page.locator(
      'input[name="admin_product[Category][]"]:checked'
    );
    const n = await checked.count();
    for (let i = 0; i < n; i++) {
      await checked.nth(0).uncheck();
    }
  }

  /** 編集画面の基本UI部品が仕様どおり表示されること（設計「フロント挙動/表示要素」）。 */
  async seeEditForm() {
    await expect(this.basicInfoCard).toBeVisible();
    await expect(this.freeAreaCard).toBeVisible();
    await expect(this.name).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
