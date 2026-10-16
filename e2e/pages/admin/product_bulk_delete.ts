/** 商品マスター(検索結果)の「完全に削除」（行を選び、一括操作の削除ボタンから確認モーダルで削除する）。 */
import { expect, Locator, Page } from "@playwright/test";

/** 設計 0204 の表示メッセージ M03-01-MSG-004（一括削除処理の完了） */
export const DELETE_DONE_MESSAGE = "商品の削除処理が完了しました";

export class ProductBulkDelete {
  readonly modal: Locator;
  readonly openButton: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly doneButton: Locator;

  constructor(readonly page: Page) {
    this.modal = page.locator("#bulkDeleteModal");
    this.openButton = page.locator('#btn_bulk button[data-bs-target="#bulkDeleteModal"]');
    this.confirmButton = this.modal.locator("#bulkDelete");
    this.cancelButton = this.modal.locator('.modal-footer button[data-bs-dismiss="modal"]:not(#bulkDeleteDone)');
    this.doneButton = this.modal.locator("#bulkDeleteDone");
  }

  row(productId: string): Locator {
    return this.page.locator(`#ex-product-${productId}`);
  }

  /** 結果行の選択欄にチェックを入れる */
  async select(productId: string): Promise<void> {
    const box = this.page.locator(`#check_${productId}`);
    await expect(box, `商品ID ${productId} の選択欄`).toBeVisible();
    await box.check();
    await expect(box).toBeChecked();
  }

  /** 一括操作の削除ボタンで確認モーダルを開く。ボタンの文言を返す（正本の呼び名との違いを注記するため） */
  async open(): Promise<string> {
    await expect(this.openButton, "一括操作の削除ボタン").toBeVisible();
    await expect(this.openButton).toBeEnabled();
    const label = (await this.openButton.innerText()).trim();
    await this.openButton.click();
    await expect(this.modal, "削除の確認モーダル").toBeVisible();
    return label;
  }

  async modalMessage(): Promise<string> {
    return ((await this.modal.locator(".modal-body p").first().textContent()) ?? "").trim();
  }

  async errors(): Promise<string[]> {
    return (await this.modal.locator("#bulkErrors li").allInnerTexts()).map((s) => s.trim()).filter(Boolean);
  }
}

/** 再読み込みの検出用に、いまの画面に印を付ける（再読み込みされると印は消える） */
export async function markCurrentDocument(page: Page): Promise<void> {
  await page.evaluate(() => { (window as unknown as { __e2eMark?: boolean }).__e2eMark = true; });
}

/** 印を付けたあとに画面が読み込み直されたか。読み込みの途中は false */
export async function documentWasReloaded(page: Page): Promise<boolean> {
  try {
    return await page.evaluate(() => (window as unknown as { __e2eMark?: boolean }).__e2eMark !== true);
  } catch {
    return false;
  }
}
