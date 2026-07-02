import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 スタック用紙印刷 Page Object。
 * 納品ケース表 integration_test/e2e/m05_08_admin_order_order_stack_paper_print_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-08_admin_order_order_stack_paper_print.md /
 * 観点表 / 基本設計)由来（オラクル独立性）。実装の現挙動・文言を期待値に流用しない。
 * セレクタは ec-cube-enterprise の Twig 由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面タイプ=print（一覧の一括フォームから子ウィンドウを開き、子ウィンドウが AJAX で印刷予約を投げる）。
 * ブラウザで観測できるのは「ボタン表示」「未選択アラート」「子ウィンドウ生成と見出し」「成功/失敗アラート」
 * 「印刷予約エンドポイントの HTTP ステータス・JSON message」まで。DB副作用(browser_print_flg・order_status・
 * confirm_date・member_id)・印字SQLの高額判定列は画面に出ないため手動/間接または対象外（ケース表 付帯表2/5）。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース、nl -ba 基準）:
 *  - 受注一覧 入口ルート admin_order GET,POST /{admin_route}/order（OrderController.php:136）
 *  - スタック用紙印刷ボタン #printStack（index.twig:1207 / 文言 trans admin.order.print_stack_paper
 *    「スタック用紙印刷」 messages.ja.yaml:2262）
 *  - 一括フォーム #form_bulk（index.twig:1095。printStack 押下で action=admin_order_print_stack_window・
 *    target=newwin に差し替えて submit、JS index.twig:231-240）
 *  - 配送チェックボックス name="ids[]" / id=check_{Shipping.id}（index.twig:1249）
 *  - 未選択アラート文言「チェックボックスが選択されていません」（index.twig:87 preventIfNoCheckedBulkTarget）
 *  - 子ウィンドウ見出し <h2>スタック用紙印刷中</h2>（print_stack_window.twig:68）
 *  - 子ウィンドウ AJAX 先 admin_order_print_stack POST /{admin_route}/order/print/stack
 *    （print_stack_window.twig:30 / OrderController.php:850）
 *  - 子ウィンドウ用ページ admin_order_print_stack_window POST /{admin_route}/order/print/stack/window
 *    （OrderController.php:832）
 *  - CSRF トークンフィールド名 _token（Constant::TOKEN_NAME = '_token' / Constant.php:41。
 *    AJAX body は print_stack_window.twig:28）
 */
export class OrderOrderStackPaperPrintPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧（入口）
  readonly printStackPath: string; // 印刷予約 AJAX エンドポイント（POST）
  readonly printStackWindowPath: string; // 子ウィンドウ用ページ（POST）

  readonly printStackButton: Locator; // #printStack（index.twig:1207）
  readonly bulkForm: Locator; // #form_bulk（index.twig:1095）
  readonly shippingCheckboxes: Locator; // input[name="ids[]"]（index.twig:1249）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    this.printStackPath = `/${ECCUBE_ADMIN_ROUTE}/order/print/stack`;
    this.printStackWindowPath = `/${ECCUBE_ADMIN_ROUTE}/order/print/stack/window`;

    this.printStackButton = page.locator("#printStack");
    this.bulkForm = page.locator("#form_bulk");
    this.shippingCheckboxes = page.locator('input[name="ids[]"]');
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 受注一覧に「スタック用紙印刷」ボタンが表示されること（文言は仕様 trans 由来）。 */
  async seePrintStackButton() {
    await expect(this.printStackButton).toBeVisible();
    await expect(this.printStackButton).toContainText("スタック用紙印刷");
  }

  /** 一覧に配送行が1件以上あるか（チェック可能な行の有無）。 */
  async shippingRowCount(): Promise<number> {
    return this.shippingCheckboxes.count();
  }

  /** 先頭の配送行チェックボックスを選択する。 */
  async selectFirstShipping() {
    await this.shippingCheckboxes.first().check();
  }

  /**
   * スタック用紙印刷ボタンを押下し、開いた子ウィンドウ（別ウィンドウ）を返す。
   * 仕様: 選択済みなら別ウィンドウを開きフォームを子ウィンドウへ POST する（処理フロー）。
   * 注意: 子ウィンドウは読込完了後に自動で AJAX 印刷予約 POST を発火し DB を更新する破壊系。
   *   さらに成功/失敗いずれでも alert→window.close する（print_stack_window.twig:33-47）ため、
   *   親側ではなく「子ウィンドウ側」で dialog を捕捉しないと alert で停止し close レースで見出し確認が
   *   フレークする。dialog ハンドラは子ページに登録する（レビュー指摘=中3反映）。
   */
  async clickPrintStackAndGetChild(): Promise<Page> {
    const [child] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.printStackButton.click(),
    ]);
    // 子ウィンドウ自身の alert を子ページで握りつぶす（親 page.on では子の dialog は捕捉できない）。
    child.on("dialog", (d) => d.dismiss().catch(() => {}));
    await child.waitForLoadState("domcontentloaded");
    return child;
  }

  /**
   * 子ウィンドウに見出し「スタック用紙印刷中」が表示されること（print_stack_window.twig:68）。
   * AJAX 完了で window.close する可能性があるため、close 前に見出しを確認する。
   */
  async seeChildHeading(child: Page) {
    await expect(child.locator("h2")).toContainText("スタック用紙印刷中");
  }

  /** 子ウィンドウの dialog（成功/失敗 alert）文言を捕捉する。message は仕様由来オラクルで突合する。 */
  async captureChildDialogMessage(child: Page): Promise<string> {
    return new Promise<string>((resolve) => {
      child.on("dialog", async (d) => {
        const msg = d.message();
        await d.dismiss().catch(() => {});
        resolve(msg);
      });
    });
  }

  /**
   * 印刷予約エンドポイントへ直接 POST する（HTTP ステータス・JSON message の観測用）。
   * 期待値（合否）は仕様(処理フロー/エラー処理)由来。トークンは呼び出し側が与える。
   * page.request はブラウザコンテキストの Cookie を共有するため、ログイン済みなら認証済み POST になる。
   */
  async postPrintStack(
    params: { id?: string; token?: string },
    maxRedirects = 20
  ) {
    const form: Record<string, string> = {};
    if (params.id !== undefined) form["ids[]"] = params.id;
    if (params.token !== undefined) form["_token"] = params.token;
    return this.page.request.post(this.printStackPath, {
      form,
      headers: { "X-Requested-With": "XMLHttpRequest" },
      maxRedirects,
      failOnStatusCode: false,
    });
  }
}
