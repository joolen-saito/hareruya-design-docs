import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理 > イベント申込一括編集 Page Object（M13-07）。
 * 一括編集はイベント申込一覧（admin_event_entry）上のモーダルで操作し、選択した申込の申込ステータスを
 * 非同期(XHR)で一括更新する。結果は JSON で返り、画面側は native alert() ＋ location.reload() で反映する。
 *
 * 期待結果は仕様（正本 functions/pf-eccube3/m13-07_admin_event_event_entry_bulk_update.md／観点表）由来（オラクル独立性）。
 * セレクタは Twig ＋ Symfony Form の getBlockPrefix=`admin_entry_bulk_update`
 *   （EventEntryBulkUpdateType.php:47-49、field=entryStatus :30）由来の位置情報のみ。合否は仕様で判定する。
 *
 * DOM/セレクタ根拠（ec-cube-enterprise 現行ソース）:
 *  - 一覧画面 route admin_event_entry（/event/entry, 一覧テンプレート @admin/Event/Entry/index.twig）
 *  - 一括更新 route admin_event_entry_bulk_update（POST /event/entry/bulk_update, EntryController.php:300）
 *  - 「一括編集」起点リンク（index.twig:344, trans admin.event.entry.bulk_edit=「一括編集」 messages.ja.yaml:5779）
 *      data-bs-target="#bulkUpdateModal"
 *  - 一括更新モーダル #bulkUpdateModal（index.twig:536）/ 見出し .modal-title
 *      trans admin.event.entry.bulk_update.modal_title=「イベント申込一括更新」（index.twig:540, :5780）
 *  - 申込ステータス選択 #admin_entry_bulk_update_entryStatus（form_row index.twig:545, required EventEntryBulkUpdateType.php:33）
 *  - 「更新」ボタン #bulkUpdateModalButton（index.twig:547, trans admin.event.entry.bulk_update.button=「更新」 :5781）
 *  - なりすまし対策トークン #admin_entry_bulk_update__token（form_widget index.twig:549）
 *  - 全選択 #check_all（index.twig:394）/ 行選択 .playerCheck（index.twig:409, data-entry_id）
 *  - 対象未選択時の native alert は admin.event.entry.bulk_update.nothing_selected（index.twig:134, :5782）
 */
export class EventEventEntryBulkUpdatePage {
  readonly page: Page;
  readonly listUrl: string; // イベント申込一覧（一括編集の起点）
  readonly bulkUpdateUrl: string; // 一括更新エンドポイント（POST）

  readonly listHeading: Locator; // 一覧見出し（admin.event.entry_list=「イベント申込一覧」）
  readonly bulkEditLink: Locator; // 「一括編集」起点リンク（モーダルを開く）
  readonly bulkUpdateModal: Locator; // #bulkUpdateModal
  readonly modalTitle: Locator; // モーダル見出し
  readonly entryStatusSelect: Locator; // 申込ステータス選択
  readonly updateButton: Locator; // 「更新」ボタン
  readonly tokenInput: Locator; // なりすまし対策トークン（hidden）
  readonly checkAll: Locator; // 全選択チェックボックス
  readonly rowChecks: Locator; // 行選択チェックボックス

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/event/entry`;
    this.bulkUpdateUrl = `/${ECCUBE_ADMIN_ROUTE}/event/entry/bulk_update`;

    this.listHeading = page.locator("h2"); // default_frame の見出し（出力先クラスは要実機確認のため h2 で確認）
    this.bulkEditLink = page.locator('a[data-bs-target="#bulkUpdateModal"]');
    this.bulkUpdateModal = page.locator("#bulkUpdateModal");
    this.modalTitle = this.bulkUpdateModal.locator(".modal-title");
    this.entryStatusSelect = page.locator("#admin_entry_bulk_update_entryStatus");
    this.updateButton = page.locator("#bulkUpdateModalButton");
    this.tokenInput = page.locator("#admin_entry_bulk_update__token");
    this.checkAll = page.locator("#check_all");
    this.rowChecks = page.locator(".playerCheck");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 「一括編集」起点リンクを押して一括更新モーダルを開く（要: 一覧に申込が1件以上）。 */
  async openBulkUpdateModal() {
    await this.bulkEditLink.click();
    await expect(this.bulkUpdateModal).toBeVisible();
  }

  /** 一覧の先頭から n 件の申込行を選択する。 */
  async selectRows(n: number) {
    const count = await this.rowChecks.count();
    const take = Math.min(n, count);
    for (let i = 0; i < take; i++) {
      await this.rowChecks.nth(i).check();
    }
    return take;
  }

  /** 申込ステータスを option index（0=プレースホルダ）で選択する。 */
  async selectStatusByIndex(index: number) {
    const values = await this.entryStatusSelect
      .locator("option")
      .evaluateAll((opts) => (opts as HTMLOptionElement[]).map((o) => o.value));
    await this.entryStatusSelect.selectOption(values[index]);
  }

  /** 申込ステータスを未選択（プレースホルダ value=""）にする。 */
  async clearStatus() {
    await this.entryStatusSelect.selectOption("");
  }

  /** なりすまし対策トークンを不正値に書き換える（CSRF異常系）。 */
  async tamperToken() {
    await this.tokenInput.evaluate((el) => {
      (el as HTMLInputElement).value = "invalid-csrf-token";
    });
  }

  /**
   * 先頭の申込行を選択したうえで、その data-entry_id（送信される申込ID）を任意値へ書き換える。
   * 設計書「処理フロー4: 指定された申込IDの申込を取得する」/ 観点 IT-15 対象データ の異常系で、
   *   存在しない/不正な申込IDを送信したときの失敗JSONを観測するために用いる（非破壊：検証失敗で確定しない）。
   */
  async tamperFirstRowEntryId(value: string) {
    const first = this.rowChecks.first();
    await first.check();
    await first.evaluate((el, v) => {
      (el as HTMLElement).dataset.entry_id = v as string;
    }, value);
  }

  /**
   * 申込ステータス選択に「存在しないマスタID」の選択肢を注入して選択する（IT-22 DBとの相関バリデーション異常系）。
   * フォームの選択肢制約（ChoiceType）に外れた値を送信したときの検証失敗JSONを観測するために用いる（非破壊）。
   */
  async injectInvalidStatus(value = "999999999") {
    await this.entryStatusSelect.evaluate((el, v) => {
      const sel = el as HTMLSelectElement;
      const opt = document.createElement("option");
      opt.value = v as string;
      opt.text = "invalid";
      sel.appendChild(opt);
      sel.value = v as string;
    }, value);
  }

  async clickUpdate() {
    await this.updateButton.click();
  }

  /**
   * 一括更新モーダルのUI部品が仕様どおり表示されること。
   * 見出し文言（"イベント申込一括更新"）は実装ロケール由来（messages.ja.yaml）であり設計書が規定しないため、
   * オラクル独立性のため特定文言は固定せずモーダル見出し要素の存在のみを確認する。
   */
  async seeBulkUpdateModal() {
    await expect(this.modalTitle).toBeVisible(); // モーダル見出しの存在（文言は実装由来のため固定しない）
    await expect(this.entryStatusSelect).toBeVisible();
    await expect(this.updateButton).toBeVisible();
  }
}
