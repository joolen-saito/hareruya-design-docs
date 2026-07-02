import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 顧客グループ管理（M08-12）Page Object。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-12_admin_customer_customer_group.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_customer_group`（CustomerGroupType.php:80）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面構成（index.twig）: 上部に登録/編集フォーム、その下に登録済みグループ一覧（テーブル）、各行に削除（Bootstrapモーダル確認）。
 * 登録（新規）と更新（既存）は同一の index メソッドで処理され、フォーム action のみ切替（new / {id}）。
 *
 * 設計書との乖離（テストは仕様どおりに書き、落ちて検出する。詳細はケース表 付帯表4）:
 *  - URLパス: 設計書は `/{admin_route}/customer_group/...`、実装は `/{admin_route}/customer/customer_group/...`（Controller.php:39-40,72）。
 *  - 入力項目: 設計書は「顧客グループ名」のみ。実装は name に加え point_percentage（必須・整数）等を持つ（CustomerGroupType.php:36-66）。
 *  - 文字列長: 設計書は name 最大255。実装フォームに Length 制約は無く required のみ（CustomerGroupType.php:36-38）。
 */
export class CustomerCustomerGroupPage {
  readonly page: Page;
  readonly listUrl: string; // 一覧＋新規登録フォーム（admin_customer_group_new）

  readonly cardTitle: Locator; // 顧客グループ管理 見出し（index.twig:20 trans admin.customer.customer_group_management）
  readonly nameInput: Locator; // 名称入力欄（index.twig:30 form.name / id=admin_customer_group_name）
  readonly pointPercentageInput: Locator; // ポイント還元率（index.twig:39 form.point_percentage / 設計書外＝不具合候補#2）
  readonly registerButton: Locator; // 「登録」submit（index.twig:146 trans admin.common.registration=登録）
  readonly newLink: Locator; // 「新規登録」リンク（index.twig:143 trans admin.common.registration__new=新規登録）
  readonly groupTable: Locator; // 登録済みグループ一覧（index.twig:74）
  readonly error: Locator; // フォーム検証エラー（form_errors出力。bootstrapテーマのため .invalid-feedback を既定。要実機確認）

  constructor(page: Page) {
    this.page = page;
    // listUrl は画面を開く（goto）ための位置情報（実装ルート admin_customer_group_new）であり、合否オラクルではない。
    // 設計書の入口パスは `/{admin_route}/customer_group`（customer/ 無し。不具合候補#1）だが、画面を実際に表示するには
    // 実装ルートへ遷移する必要がある。URLの合否判定は spec 側で設計/実装どちらのパスでも成立する正規表現を用いる。
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/customer/customer_group`;

    this.cardTitle = page.locator(".card-title");
    this.nameInput = page.locator("#admin_customer_group_name");
    this.pointPercentageInput = page.locator("#admin_customer_group_point_percentage");
    // submit「登録」は exact 一致で「新規登録」リンクと区別する。
    this.registerButton = page.getByRole("button", { name: "登録", exact: true });
    this.newLink = page.getByRole("link", { name: "新規登録" });
    this.groupTable = page.locator("table");
    this.error = page.locator(".invalid-feedback, .text-danger");
  }

  /** 一覧＋新規登録フォーム画面（GET）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 既存グループの編集フォーム画面（GET /customer/customer_group/{id}）を開く。 */
  async gotoEdit(id: string | number) {
    await this.page.goto(`${this.listUrl}/${id}`);
  }

  /** 一覧テーブル中の、指定名称のグループ行リンク（index.twig:85）。 */
  groupLink(name: string): Locator {
    return this.groupTable.getByRole("link", { name });
  }

  /**
   * 一覧テーブル中の、指定IDのグループ名称リンク（編集フォームへの遷移導線。index.twig:85
   * a href=url('admin_customer_group',{id})）。末尾一致で削除リンク(/{id}/delete)と区別する。
   * 名称が不明でも編集導線（画面遷移）をクリックで検証するために用いる。
   */
  groupEditLink(id: string | number): Locator {
    return this.page.locator(`a[href$="/customer_group/${id}"]`);
  }

  /** 指定グループ行の削除トリガ（モーダルを開く。index.twig:94-95 data-bs-target=#delete_{id}）。 */
  deleteOpenButton(id: string | number): Locator {
    return this.page.locator(`a[data-bs-target="#delete_${id}"]`);
  }

  /** 指定グループの削除確認モーダル（index.twig:98 id=delete_{id}）。 */
  deleteModal(id: string | number): Locator {
    return this.page.locator(`#delete_${id}`);
  }

  /** 削除確認モーダル内の削除実行リンク（index.twig:116-119 data-method=delete／DELETE発火は要実機確認）。 */
  deleteConfirmLink(id: string | number): Locator {
    return this.deleteModal(id).locator("a.btn-ec-delete");
  }

  /** 削除確認モーダル内のキャンセルボタン（index.twig:114-115 data-bs-dismiss=modal。位置情報・i18n語はオラクル化しない）。 */
  deleteCancelButton(id: string | number): Locator {
    return this.deleteModal(id).locator('[data-bs-dismiss="modal"]');
  }

  /** 登録/更新フォームに名称を入力して「登録」を押下する。 */
  async submitName(name: string) {
    await this.nameInput.fill(name);
    await this.registerButton.click();
  }

  /** 一覧＋登録フォームの主要部品が仕様どおり表示されること。 */
  async seeListForm() {
    await expect(this.cardTitle.first()).toContainText("顧客グループ管理");
    await expect(this.nameInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
