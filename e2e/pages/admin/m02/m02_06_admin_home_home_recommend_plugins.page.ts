import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面ホーム おすすめプラグイン Page Object（#ec-cube-plugin カード＋プラグイン詳細モーダル）。
 * 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書+Twig由来の未実行雛形。
 * 期待結果は仕様(m02-06_admin_home_home_recommend_plugins.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。
 *
 * セレクタ根拠（行番号は ec-cube-enterprise 現行ソース基準）:
 *  - カード #ec-cube-plugin（Resource/template/admin/index.twig:274）
 *  - 見出し .card-title trans admin.home.recommend_plugins_title=「おすすめのプラグイン」（index.twig:277 / messages.ja.yaml:1696）
 *  - カード本文（縦スクロール）.card-body style=max-height:395px;overflow-y:scroll（index.twig:280）
 *  - プラグイン行リンク a[data-bs-toggle="modal"][data-bs-target^="#searchPluginModal-"]（index.twig:284,289）
 *  - オーナーズストアリンク .card-footer a trans admin.home.recommend_plugins.owner_store=「オーナーズストア」（index.twig:299 / messages.ja.yaml:1697）
 *  - 詳細モーダル #searchPluginModal-{id}（Store/plugin_detail_modal.twig:1）
 *  - 価格ラベル admin.store.plugin.price=「販売価格」（modal:17 / messages.ja.yaml:3231）／ common.tax_include=「税込」（messages.ja.yaml:82）
 *  - 「一覧に戻る」admin.store.plugin_owners_search.modal.cancel（modal:52 / messages.ja.yaml:3317）／ 閉じる .btn-close（modal:6）
 *
 * 注意（本機能の構造）: おすすめプラグインはサーバ側で外部APIから取得する（AdminController.php:189）。
 * ブラウザからは route interception でモックできないため、行/モーダル/状態別CTAはデータ依存（spec で fixme・ケース表で手動管理）。
 */
export class AdminHomeHomeRecommendPluginsPage {
  readonly page: Page;
  readonly homeUrl: string;

  readonly card: Locator; // #ec-cube-plugin カード
  readonly cardTitle: Locator; // 見出し「おすすめのプラグイン」
  readonly cardBody: Locator; // 本文（縦スクロール領域）
  readonly ownerStoreLink: Locator; // カード下部「オーナーズストア」
  readonly pluginModalLinks: Locator; // プラグイン行の画像/名称リンク（モーダル起動）

  constructor(page: Page) {
    this.page = page;
    this.homeUrl = `/${ECCUBE_ADMIN_ROUTE}/`;

    this.card = page.locator("#ec-cube-plugin");
    this.cardTitle = this.card.locator(".card-title");
    this.cardBody = this.card.locator(".card-body");
    this.ownerStoreLink = this.card
      .locator(".card-footer")
      .getByRole("link", { name: "オーナーズストア" });
    this.pluginModalLinks = this.card.locator(
      'a[data-bs-toggle="modal"][data-bs-target^="#searchPluginModal-"]'
    );
  }

  async goto() {
    await this.page.goto(this.homeUrl);
  }

  /** おすすめプラグインカードの枠（見出し・オーナーズストアリンク）が仕様どおり表示されること。 */
  async seeCardFrame() {
    await expect(this.card).toBeVisible();
    await expect(this.cardTitle).toContainText("おすすめのプラグイン");
    await expect(this.ownerStoreLink).toBeVisible();
  }

  /** カード下部のオーナーズストアリンクを押下する（オーナーズストア検索へ遷移）。 */
  async clickOwnerStore() {
    await this.ownerStoreLink.click();
  }

  /** 指定IDの詳細モーダル Locator（データ依存）。 */
  modal(id: string | number): Locator {
    return this.page.locator(`#searchPluginModal-${id}`);
  }
}
