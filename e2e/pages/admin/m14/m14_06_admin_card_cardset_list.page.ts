import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カードセット管理（一覧） Page Object。
 * 期待結果は仕様（functions/pf-eccube3/m14-06_admin_card_cardset_list.md ＋ 観点表）由来（オラクル独立性）。
 * セレクタ（位置情報のみ）は刷新先 Twig `app/template/admin/Cardset/index.twig`（以下 index.twig）由来。
 *
 * 設計書（pf-eccube3）と刷新先実装の乖離はケース表 付帯表4 を参照（ルート名・並び替え機構・resume・
 * セッションキー・削除/DLパスが乖離）。本POMは刷新先の DOM 位置のみ提供し、合否は spec 側で仕様により判定する。
 *
 * DOM 根拠:
 *  - 一覧URL admin_cardset_list → /{route}/cardset（CardsetController.php:49）
 *  - ページングURL admin_cardset_list_paged → /{route}/cardset/page/{page_no}（CardsetController.php:50）
 *  - 新規登録リンク url admin_cardset_new（index.twig:61）/ ブロック追加 admin_data_mtg_master_data（index.twig:64）
 *  - 画像DL（セット別）#admin_cardset_download_by_set（index.twig:70 formaction admin_cardset_download）
 *  - 画像DL（言語別）#admin_cardset_download_by_lang（index.twig:77 formaction admin_cardset_download_each_lang）
 *  - 表示件数 select #page_count_pulldown（index.twig:94）/ 並び順 select #sort_key_pulldown（index.twig:106）
 *  - 全選択 #chose_all（index.twig:129）/ 行チェック input[name="cardsetIds[]"]（index.twig:144-147）
 *  - 行「編集」 a.action-edit（index.twig:168 url admin_cardset_edit）
 *  - 行「削除」 a[data-bs-target="#DeleteModal"]（index.twig:174）/ 削除モーダル #DeleteModal（delete_modal.twig）
 *  - ページャ #product_pagination（index.twig:190 / @admin/pager.twig:191）
 *  - 特殊セット タグアイコン i.fa-tag（index.twig:163 special_flg真）
 */
export class CardCardsetListPage {
  readonly page: Page;
  readonly url: string;

  readonly table: Locator; // 一覧テーブル（index.twig:124）
  readonly newLink: Locator; // 新規登録（index.twig:61）
  readonly addBlockLink: Locator; // ブロックの追加（index.twig:64）
  readonly downloadBySetButton: Locator; // 画像DL（セット別）（index.twig:70）
  readonly downloadByLangButton: Locator; // 画像DL（言語別）（index.twig:77）
  readonly pageCountSelect: Locator; // 表示件数ドロップダウン（index.twig:94）
  readonly sortSelect: Locator; // 並び順ドロップダウン（index.twig:106）
  readonly choseAll: Locator; // 全選択チェック（index.twig:129）
  readonly rowCheckboxes: Locator; // 行チェック（index.twig:144-147）
  readonly editLinks: Locator; // 行「編集」（index.twig:168）
  readonly deleteTriggers: Locator; // 行「削除」モーダル起動（index.twig:174）
  readonly deleteModal: Locator; // 削除確認モーダル（delete_modal.twig #DeleteModal）
  readonly pagination: Locator; // ページャ（index.twig:190）
  readonly tagIcons: Locator; // 特殊セット タグアイコン（index.twig:163）
  // サブタイトル「カードセット管理」(index.twig:6) は default_frame 側の出力先が要実機確認のため
  // 専用セレクタを創作せず、spec ではテキスト存在で確認する。

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/cardset`;

    this.table = page.locator("table.table");
    // 新規登録リンク（index.twig:61 url admin_cardset_new）。同画面内の他リンク混入回避のため
    // href 末尾一致に「新規登録」テキストを併用して限定する。
    this.newLink = page.locator('a[href$="/cardset/new"]', { hasText: "新規登録" });
    this.addBlockLink = page.locator('a[href*="mtg_master_data"]');
    this.downloadBySetButton = page.locator("#admin_cardset_download_by_set");
    this.downloadByLangButton = page.locator("#admin_cardset_download_by_lang");
    this.pageCountSelect = page.locator("#page_count_pulldown");
    this.sortSelect = page.locator("#sort_key_pulldown");
    this.choseAll = page.locator("#chose_all");
    this.rowCheckboxes = page.locator('input[name="cardsetIds[]"]');
    this.editLinks = page.locator("a.action-edit");
    this.deleteTriggers = page.locator('a[data-bs-target="#DeleteModal"]');
    this.deleteModal = page.locator("#DeleteModal");
    this.pagination = page.locator("#product_pagination");
    this.tagIcons = page.locator("i.fa-tag");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** ページ番号付きURL（刷新先 admin_cardset_list_paged：/cardset/page/{n}）。 */
  async gotoPage(pageNo: number) {
    await this.page.goto(`${this.url}/page/${pageNo}`);
  }

  /** ページャ内の指定ページ番号リンク（直接URL遷移ではなくリンク操作の起点）。 */
  pageLink(pageNo: number): Locator {
    // ページャは admin_cardset_list_paged（/cardset/page/{n}）でリンクを生成（@admin/pager.twig）。
    return this.pagination.locator(`a[href*="/page/${pageNo}"]`);
  }

  /** 一覧UI部品が仕様どおり表示されること（タイトル・テーブル・各ボタン）。 */
  async seeListLayout() {
    // 仕様: ページタイトル「カードセット管理」（設計書フロント挙動）。刷新先はサブタイトルで表示（付帯表4#5）。
    await expect(this.page.locator("body")).toContainText("カードセット管理");
    await expect(this.table).toBeVisible();
    await expect(this.newLink).toBeVisible();
    await expect(this.addBlockLink).toBeVisible();
    await expect(this.downloadBySetButton).toBeVisible();
    await expect(this.downloadByLangButton).toBeVisible();
  }

  /** テーブル見出し列が仕様どおり表示されること。 */
  async seeTableHeaders() {
    const head = this.table.locator("thead");
    for (const label of ["リリース日", "シンボル", "略称", "セット名 日/英", "特殊セット"]) {
      await expect(head).toContainText(label);
    }
  }

  /** 表頭の全選択を操作する（true=ON / false=OFF）。 */
  async toggleSelectAll(checked: boolean) {
    if (checked) {
      await this.choseAll.check();
    } else {
      await this.choseAll.uncheck();
    }
  }
}
