import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ表示（M13-08）Page Object。
 * デッキリストは印刷向けの読み取り専用画面で、申込一覧（M13-06）のデッキ表示ボタンから別ウィンドウで開く。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-08_admin_event_event_deck_view.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。デッキ内容（プレイヤー名・DCI・枚数・サイド・カナ代替）は要シードのため手動。
 *
 * route 根拠: admin_event_entry_decklist = GET /%eccube_admin_route%/event/entry/decklist
 *   （src/Eccube/Controller/Admin/Event/EntryController.php:503・methods=['GET']）
 * 申込一覧 route: admin_event_entry = /%eccube_admin_route%/event/entry（EntryController.php:93）
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Event/Entry/decklist.twig）:
 *  - <title> trans admin.event.entry.decklist_title=「デッキリスト」(decklist.twig:5 / messages.ja.yaml:5770)
 *  - 印刷ボタン #decklistPrintButton trans admin.common.print=「印刷する」(decklist.twig:296 / messages.ja.yaml:1467)
 *  - 空表示 .decklist-empty trans admin.common.search_no_result=「検索条件に合致するデータが見つかりませんでした」(decklist.twig:300 / messages.ja.yaml:1542)
 *  - デッキ単位ブロック .wrapper(decklist.twig:304)
 *  - 名前/ページ番号/先頭文字 .decklist-header__name-value(decklist.twig:308)・.decklist-header__box-letter(decklist.twig:313)
 *  - メイン見出し .decklist-mainboard__title=「メインボード(N)」(decklist.twig:334)
 *  - イベント名/開催日 .decklist-meta__value(decklist.twig:325,329)
 * 申込一覧 デッキ表示ボタン #decklist trans admin.event.entry.deck_display=「デッキ表示」
 *   (index.twig:381 / messages.ja.yaml:5769)、window.open(url,'preview','width=960,height=900')(index.twig:62)
 */
export class M13_08AdminEventEventDeckViewPage {
  readonly page: Page;
  readonly url: string; // デッキ表示画面（直接アクセス用）
  readonly entryListUrl: string; // 申込一覧（起点ボタンを持つ）

  readonly printButton: Locator; // #decklistPrintButton「印刷する」
  readonly emptyMessage: Locator; // .decklist-empty 空表示
  readonly deckWrapper: Locator; // .wrapper デッキ単位ブロック
  readonly nameValue: Locator; // .decklist-header__name-value プレイヤー名＋ページ番号
  readonly firstLetter: Locator; // .decklist-header__box-letter 先頭文字
  readonly mainboardTitle: Locator; // .decklist-mainboard__title メイン見出し
  readonly metaValue: Locator; // .decklist-meta__value イベント名/開催日
  readonly entryDeckButton: Locator; // 申込一覧 #decklist「デッキ表示」

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/event/entry/decklist`;
    this.entryListUrl = `/${ECCUBE_ADMIN_ROUTE}/event/entry`;

    this.printButton = page.locator("#decklistPrintButton");
    this.emptyMessage = page.locator(".decklist-empty");
    this.deckWrapper = page.locator(".wrapper");
    this.nameValue = page.locator(".decklist-header__name-value");
    this.firstLetter = page.locator(".decklist-header__box-letter");
    this.mainboardTitle = page.locator(".decklist-mainboard__title");
    this.metaValue = page.locator(".decklist-meta__value");
    this.entryDeckButton = page.locator("#decklist");
  }

  /** デッキ表示画面を直接GETで開く。応答（HTTPステータス確認用）を返す。 */
  async goto() {
    return await this.page.goto(this.url);
  }

  /** 申込一覧を開く（デッキ表示ボタンの起点）。 */
  async gotoEntryList() {
    await this.page.goto(this.entryListUrl);
  }

  /** 申込一覧のデッキ表示ボタンを押下し、別ウィンドウ（popup）を取得する。 */
  async openDeckListPopup(): Promise<Page> {
    const [popup] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.entryDeckButton.click(),
    ]);
    await popup.waitForLoadState();
    return popup;
  }

  /** デッキ表示画面が表示され、タイトルが「デッキリスト」であること（仕様: 成功時HTML描画）。 */
  async seeDeckListScreen() {
    await expect(this.page).toHaveTitle("デッキリスト");
    await expect(this.printButton).toBeVisible();
  }

  /** 印刷ボタンに仕様の文言「印刷する」が表示されること。 */
  async seePrintButton() {
    await expect(this.printButton).toBeVisible();
    await expect(this.printButton).toHaveText("印刷する");
  }

  /** 本画面が入力フォーム・テキスト入力を持たないこと（仕様: 入力項目なし）。 */
  async seeNoInputForm() {
    await expect(this.page.locator("input, textarea, select")).toHaveCount(0);
  }

  /** 管理共通フレーム（ナビゲーション）を持たない独立HTMLであること。 */
  async seeStandaloneFrame() {
    await expect(this.page.getByRole("navigation")).toHaveCount(0);
  }

  /** モーダル・確認ダイアログを表示しないこと。 */
  async seeNoModal() {
    await expect(this.page.locator(".modal.show, [role=dialog]")).toHaveCount(0);
  }

  /**
   * デッキ0件のときデッキリストに何も表示されず印刷ボタンのみであること。
   * 仕様(エッジケース: デッキ0件はデッキリストに何も表示しない・印刷ボタンのみ)由来。
   * 注: 空表示の固定文言「検索条件に合致するデータが見つかりませんでした」は実装のメッセージカタログ由来のため
   *     オラクル化しない（設計書は空表示メッセージを規定していない）。観測は「デッキ単位ブロック0件＋印刷ボタン表示」で行う。
   */
  async seeEmptyDeckList() {
    await expect(this.deckWrapper).toHaveCount(0);
    await expect(this.printButton).toBeVisible();
  }
}
