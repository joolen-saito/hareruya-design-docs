import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント申込詳細・編集 Page Object（GET=表示／POST=更新は同一ルート）。
 * 納品ケース表 integration_test/e2e/m13_10_admin_event_event_entry_edit_e2e_cases.md に対応。
 * 期待結果は仕様(functions/pf-eccube3/m13-10_admin_event_event_entry_edit.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_event_entry_detail`（EventEntryDetailType.php:163-166）由来の位置情報のみ。
 *
 * ルート: admin_event_entry_edit = /%eccube_admin_route%/event/entry/{eventEntry}/edit
 *   （GET表示・POST更新を同一ルートで処理。EntryController.php:249-298）
 *   ※設計書は edit/update の2ルートを想定（不具合候補#1・要確認）。
 * テンプレート: @admin/Event/EntryRegistration/edit.twig
 *
 * DOM id 根拠（edit.twig / EventEntryDetailType.php）:
 *  - 申込状況 select → #admin_event_entry_detail_EntryStatus（edit.twig:303 / 編集時 entry_status_editable=true EntryController.php:260）
 *  - 支払方法 select(disabled) → #admin_event_entry_detail_Payment（edit.twig:310 / disabled EventEntryDetailType.php:104）
 *  - 支払金額 input(disabled) → #admin_event_entry_detail_price（edit.twig:317 / disabled EventEntryDetailType.php:111-115・不具合候補#5）
 *  - 参加プレイヤー hidden → #admin_event_entry_detail_entryPlayer（edit.twig:220 / 必須 EventEntryDetailType.php:60-72）
 *  - プレイヤー検索語 → #admin_event_entry_detail_search（edit.twig:377）
 *  - 送信ボタン #submit_entry（edit.twig:353 初期disabled・trans admin.common.registration「登録」messages.ja.yaml:1436）
 *  - 参加者行: 名前 #detail_player__name_jp--1（edit.twig:271） / 隠しID #player_id--1（edit.twig:277）
 *  - 検索ボタン #search_button--1（edit.twig:279「検索」:5561） / 削除ボタン #clear_button--1（edit.twig:282「削除」:5562）
 *  - モーダル #searchPlayerModal（edit.twig:368） / 実行 #searchPlayerModalButton（edit.twig:380「検索する」:5571） / 結果 #searchPlayerModalList（edit.twig:382）
 *  - 戻る a[href=admin_event_entry]「イベント申込一覧」（edit.twig:340 :5553） / #new「同日程の新規申込へ」（edit.twig:350 :5567）
 *  - 支払番号 #payment_no（edit.twig:324・なし時「なし」:5574）
 */
export class AdminEventEventEntryEditPage {
  readonly page: Page;

  readonly entryStatus: Locator; // 申込状況 select
  readonly payment: Locator; // 支払方法 select(disabled)
  readonly price: Locator; // 支払金額 input(disabled)
  readonly entryPlayerHidden: Locator; // 参加プレイヤー hidden（必須）
  readonly searchInput: Locator; // モーダル内 検索語
  readonly submitButton: Locator; // #submit_entry 登録
  readonly playerNameJp: Locator; // 参加者行 氏名
  readonly playerIdHidden: Locator; // 参加者行 隠しプレイヤーID
  readonly searchPlayerButton: Locator; // 行の「検索」ボタン
  readonly clearPlayerButton: Locator; // 行の「削除」ボタン
  readonly modal: Locator; // プレイヤー検索モーダル
  readonly modalRunButton: Locator; // モーダル「検索する」
  readonly modalList: Locator; // モーダル候補一覧 host
  readonly paymentNo: Locator; // 支払番号
  readonly backToListLink: Locator; // 戻る→イベント申込一覧
  readonly newSameScheduleLink: Locator; // 同日程の新規申込へ
  readonly flash: Locator; // フラッシュメッセージ領域

  constructor(page: Page) {
    this.page = page;
    this.entryStatus = page.locator("#admin_event_entry_detail_EntryStatus");
    this.payment = page.locator("#admin_event_entry_detail_Payment");
    this.price = page.locator("#admin_event_entry_detail_price");
    this.entryPlayerHidden = page.locator("#admin_event_entry_detail_entryPlayer");
    this.searchInput = page.locator("#admin_event_entry_detail_search");
    this.submitButton = page.locator("#submit_entry");
    this.playerNameJp = page.locator("#detail_player__name_jp--1");
    this.playerIdHidden = page.locator("#player_id--1");
    this.searchPlayerButton = page.locator("#search_button--1");
    this.clearPlayerButton = page.locator("#clear_button--1");
    this.modal = page.locator("#searchPlayerModal");
    this.modalRunButton = page.locator("#searchPlayerModalButton");
    this.modalList = page.locator("#searchPlayerModalList");
    this.paymentNo = page.locator("#payment_no");
    this.backToListLink = page.getByRole("link", { name: "イベント申込一覧" });
    this.newSameScheduleLink = page.locator("#new");
    this.flash = page.locator(".alert");
  }

  /** 編集画面URL（申込ID指定）。 */
  editUrl(eventEntryId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/event/entry/${eventEntryId}/edit`;
  }

  async goto(eventEntryId: number | string) {
    await this.page.goto(this.editUrl(eventEntryId));
  }

  /**
   * 読み取り専用の申込情報が表示されること（仕様: フロント挙動 表示要素 functions:83）。
   * 仕様の読み取り専用要素＝イベント申込ID・イベント名・店舗・会場・フォーマット・支払会員。
   * ラベル存在に加え、値が col-form-plain（入力欄でない＝読み取り専用）で描かれることを確認する。
   * ※席順セレクト・DCIナンバー・登録本名・チームメンバー確認チェックは実装にUIが無い（乖離#7・対象外）。
   */
  async seeReadonlyEntryInfo() {
    const body = this.page.locator("body");
    await expect(body).toContainText("申込ID"); // messages.ja.yaml:5762
    await expect(body).toContainText("イベント名"); // :5638
    await expect(body).toContainText("店舗"); // :5648
    await expect(body).toContainText("会場"); // 仕様:83 表示要素（読み取り専用）
    await expect(body).toContainText("フォーマット"); // :5649
    await expect(body).toContainText("支払会員"); // 仕様:60,83 確定済み氏名表示
    // 読み取り専用であること: これらの値は入力欄(input/select)ではなく col-form-plain で描かれる。
    await expect(this.page.locator(".col-form-plain").first()).toBeVisible();
  }

  /**
   * プレイヤー検索ボタンを表示可能にする（参加者選択済みのとき検索ボタンは div_search に d-none が付く・edit.twig:278）。
   * 参加者入れ替えの業務フローに合わせ、削除ボタンが見えていれば未選択化して検索ボタンを露出させる。
   */
  async makeSearchAvailable() {
    if (await this.clearPlayerButton.isVisible()) {
      await this.clearPlayerButton.click();
    }
  }

  /** プレイヤー検索モーダルを開く。 */
  async openSearchModal() {
    await this.searchPlayerButton.click();
  }

  /** モーダルで検索語を入力して検索を実行（XHRで候補一覧を取得）。 */
  async searchPlayer(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.modalRunButton.click();
  }

  /** 参加者行の削除ボタンで参加者を未選択にする。 */
  async clearPlayer() {
    await this.clearPlayerButton.click();
  }

  /** 申込状況を選択して更新を送信する。 */
  async submitUpdate() {
    await this.submitButton.click();
  }
}
