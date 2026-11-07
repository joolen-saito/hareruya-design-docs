/** F06-16 大会デッキ登録編集（フロント）の画面操作。セレクタはここだけに書く。正本: cases/F06-16_test_cases.tsv */
import { Locator, Page, Response, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export const 前面 = (p: string): string => `${BASE_URL}/ja${p}`;
const T = 20_000;

export class DeckEditPage {
  constructor(readonly page: Page) {}

  /** 大会デッキ登録編集画面をアドレスで開く（日程のイベント詳細IDで） */
  async 開く(日程ID: string): Promise<Response | null> {
    const res = await this.page.goto(前面(`/deckentry/${日程ID}/edit`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }
  /** 画面として表示されているか（フォームがある） */
  async 表示されている(): Promise<boolean> { return (await this.page.locator("form#decklist_submit").count()) > 0; }

  get 見出し(): Locator { return this.page.locator(".p-hareruya-deckentry-edit h1").first(); }
  get 大会名(): Locator { return this.page.locator(".p-hareruya-deckentry-edit__event-title"); }
  get 大会情報(): Locator { return this.page.locator(".p-hareruya-deckentry-edit__event-detail"); }
  get 利用ガイドのリンク(): Locator { return this.page.locator("a.p-hareruya-deckentry-edit__guide-link"); }
  get メイン(): Locator { return this.page.locator("#deckMain"); }
  get サイド(): Locator { return this.page.locator("#deckSide"); }
  get 統率(): Locator { return this.page.locator("#deckCommand"); }
  get 提出ボタン(): Locator { return this.page.getByRole("button", { name: "デッキリストを提出する" }); }
  get キャンセル(): Locator { return this.page.locator("a.p-hareruya-deckentry-edit__submit-btn", { hasText: "キャンセル" }); }
  get トークン(): Locator { return this.page.locator('form#decklist_submit input[name="_token"]'); }
  get フォーマットの入力欄(): Locator { return this.page.locator('form#decklist_submit input[name="format"]'); }
  /** フォーマット選択の見える選択肢の表示名 */
  async フォーマット選択肢(): Promise<string[]> {
    return (await this.page.locator("label.p-hareruya-deckentry-edit__format-item").allInnerTexts()).map((t) => t.trim());
  }
  async フォーマットを選ぶ(名: string): Promise<void> {
    const l = this.page.locator("label.p-hareruya-deckentry-edit__format-item").filter({ hasText: new RegExp(`^\\s*${名}\\s*$`) });
    await expect(l, `フォーマット選択に「${名}」がある`).toHaveCount(1, { timeout: T });
    await l.click({ timeout: T });
  }
  /** 選択中のフォーマットの値（選択欄が見えているときはチェック済みの値、無いときは隠し項目の値） */
  async 選択中のフォーマットID(): Promise<string> {
    const checked = this.page.locator('form#decklist_submit input[name="format"]:checked');
    if ((await checked.count()) > 0) return await checked.first().inputValue();
    return await this.page.locator('form#decklist_submit input[type="hidden"][name="format"]').first().inputValue();
  }
  async 選択中のフォーマット名(): Promise<string> {
    const checked = this.page.locator('form#decklist_submit input[name="format"]:checked');
    if ((await checked.count()) === 0) return "";
    const id = await checked.first().getAttribute("id");
    return ((await this.page.locator(`label[for="${id}"]`).first().innerText()) ?? "").trim();
  }

  async 入力する(欄: "メイン" | "サイド" | "統率", 文: string): Promise<void> {
    const t = 欄 === "メイン" ? this.メイン : 欄 === "サイド" ? this.サイド : this.統率;
    await t.fill(文, { timeout: T });
  }

  /** 「デッキリストを提出する」を押す。送信されたか（ブラウザの入力チェックで止まらなかったか）と応答を返す */
  async 提出する(): Promise<{ 送信: boolean; 応答?: Response }> {
    const resP = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/deckentry\/\d+\/update/.test(r.url()), { timeout: 45_000 }).catch(() => null);
    await this.提出ボタン.click({ timeout: T, noWaitAfter: true });
    const res = await resP;
    // 提出が成功すると完了画面へ移る（302）。移り終わるのを待ってから、画面を読む
    if (res && res.status() >= 300 && res.status() < 400) await this.page.waitForURL(/\/deckentry\/\d+\/check/, { timeout: 120_000 }).catch(() => undefined);
    await this.page.waitForLoadState("load").catch(() => undefined);
    return { 送信: res !== null, 応答: res ?? undefined };
  }

  // ---- インポート ----
  get インポートボタン(): Locator { return this.page.locator('button[data-js-modal-trigger="deckentry-import"]'); }
  get インポートの画面(): Locator { return this.page.locator("#deckentry-import"); }
  get インポートの入力欄(): Locator { return this.page.locator("#arenaDeckList"); }
  get インポート実行(): Locator { return this.page.locator("#copyArenaListButton"); }
  get インポート閉じる(): Locator { return this.page.locator("#closeDeckImportButton"); }
  async インポートを開く(): Promise<void> {
    await this.インポートボタン.click({ timeout: T });
    await expect(this.インポートの画面, "インポート用ポップアップ画面").toBeVisible({ timeout: T });
  }

  // ---- マイデッキ ----
  get マイデッキボタン(): Locator { return this.page.locator('button[data-js-modal-trigger="deckentry-mydeck"]'); }
  get マイデッキの画面(): Locator { return this.page.locator("#deckentry-mydeck"); }
  get マイデッキの行(): Locator { return this.page.locator("#deckentry-mydeck .p-hareruya-deckentry-edit__mydeck-item"); }
  get マイデッキの総数(): Locator { return this.page.locator("#myDeck_modal_total_count"); }
  get マイデッキのフォーマット絞り込み(): Locator { return this.page.locator("#select_format"); }
  async マイデッキを開く(): Promise<void> {
    await this.マイデッキボタン.click({ timeout: T });
    await expect(this.マイデッキの画面, "マイデッキ取得用ポップアップ画面").toBeVisible({ timeout: T });
  }
  マイデッキ(名: string): Locator { return this.マイデッキの行.filter({ has: this.page.locator(".p-hareruya-deckentry-edit__mydeck-item-name", { hasText: new RegExp(`^\\s*${名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) }); }

  // ---- カード名から登録 ----
  get カード名入力(): Locator { return this.page.locator("#cardNameInput"); }
  get サジェスト候補(): Locator { return this.page.locator("[data-deckentry-card-suggest-item]"); }
  get 枚数入力(): Locator { return this.page.locator("#cardNumInput"); }
  get 枚数追加ボタン(): Locator { return this.page.locator(".p-hareruya-deckentry-edit__num-submit"); }
  枚数ボタン(n: 1 | 2 | 3 | 4): Locator { return this.page.locator(`.p-hareruya-deckentry-edit__num-btn[data-value="${n}"]`); }
  ボード選択(ボード: "main" | "side" | "command"): Locator { return this.page.locator(`label.p-hareruya-deckentry-edit__board-item:has(input[value="${ボード}"])`); }
  ボードの選択状態(ボード: "main" | "side" | "command"): Locator { return this.page.locator(`input[name="board"][value="${ボード}"]`); }
  get 説明欄(): Locator { return this.page.locator("#how-to-import"); }
}
