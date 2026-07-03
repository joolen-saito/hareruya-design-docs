import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../../../config/default.config";

/**
 * フロント イベント「イベント詳細」（F07-03）Page Object。
 * integration_test/e2e/f07_03_front_event_event_detail_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f07-03_front_event_event_detail.md（利用者視点の入口・処理フロー・
 * 業務ルール・表示メッセージ・エッジケース）由来。
 * pf-eccube3 `Event/show.twig` は本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう
 * URL・表示文言・ボタンの意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本画面はログイン不要の公開参照画面。詳細URLスキームは
 *   GET /{_locale}/events/{eventDetailId}/detail （詳細IDは数値のみ）
 * で、存在しないID／数値以外の不正IDはページが見つからない（HTTP404）。
 */
export class FrontEventDetailPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly eventsUrl: string;

  readonly body: Locator;
  // 由来: Event/show.twig（本リポジトリ未取込）。文言は表示メッセージ節・ボタン出し分け仕様由来。要実機確認。
  readonly registerButton: Locator; // 申込
  readonly cancelRequestButton: Locator; // キャンセル申込
  readonly decklistButton: Locator; // デッキ登録／デッキ編集
  readonly backButton: Locator; // 戻る
  readonly modal: Locator; // モーダル・ポップアップ・トースト（本画面は表示しない）

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.eventsUrl = `${this.localePrefix}/events`;

    this.body = page.locator("body");
    this.registerButton = page.getByRole("link", { name: /申込|Register/ }).first();
    this.cancelRequestButton = page
      .getByRole("link", { name: /キャンセル申込|Cancellation/ })
      .first();
    this.decklistButton = page
      .getByRole("link", { name: /デッキ登録|デッキ編集|Decklist/ })
      .first();
    this.backButton = page.getByRole("link", { name: /戻る|Back/ }).first();
    // モーダル/ダイアログ/トーストの一般的なセレクタ。存在しないこと（count 0）を確認する。
    this.modal = page.locator(".modal.show, [role='dialog'], .toast.show, .modal[aria-hidden='false']");
  }

  detailUrl(eventDetailId: string | number): string {
    return `${this.localePrefix}/events/${eventDetailId}/detail`;
  }

  async gotoDetail(eventDetailId: string | number) {
    return await this.page.goto(this.detailUrl(eventDetailId));
  }

  /** 存在しない/不正なイベント詳細IDでページが見つからない（HTTP404）こと。期待は設計書「エラー処理・失敗時出力」由来。 */
  async gotoDetailExpectingNotFound(eventDetailId: string | number) {
    const res = await this.page.goto(this.detailUrl(eventDetailId));
    expect(res?.status()).toBe(404);
    return res;
  }

  /** 開催情報の主要見出しが表示されていること。期待見出しは表示メッセージ（常時表示）節由来。 */
  async seeDetailHeadings() {
    await expect(this.body).toContainText("開催店舗");
    await expect(this.body).toContainText("大会名");
    await expect(this.body).toContainText("開催日時");
    await expect(this.body).toContainText("フォーマット");
    await expect(this.body).toContainText("定員");
  }

  /** モーダル・ポップアップ・トーストを表示しないこと。期待はフロント挙動節由来。 */
  async seeNoModal() {
    await expect(this.modal).toHaveCount(0);
  }
}
