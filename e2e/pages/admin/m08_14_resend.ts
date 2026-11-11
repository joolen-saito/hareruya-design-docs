/**
 * M08-14 仮会員メール再送の、会員検索一覧の行の操作（再送リンク・確認のモーダル）。セレクタはここにだけ書く。
 * 再送リンクは、押すとJavaScriptがなりすまし対策の値つきで送る。開発者ツールでの書き換えは、リンクの属性（送信先の会員ID・なりすまし対策の値）を書き換えて表す。
 */
import { expect, Locator, Page } from "@playwright/test";

const T = 30_000;

export class M0814ResendPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  private row(会員ID: string): Locator { return this.page.locator(`tr#ex-customer-${会員ID}`); }
  private link(会員ID: string): Locator { return this.row(会員ID).locator(`a[data-bs-target="#discontinuance_cus_${会員ID}"]`); }
  private send(会員ID: string): Locator { return this.page.locator(`#discontinuance_cus_${会員ID} a.btn-ec-delete`); }

  /** 検索結果の行の数（会員ID指定） */
  async 行の数(会員ID: string): Promise<number> { return this.row(会員ID).count(); }

  /** 行のサブメニュー（…）を開く */
  async サブメニューを開く(会員ID: string): Promise<void> {
    await expect(this.row(会員ID), `検索結果に会員ID ${会員ID} の行が1つある`).toHaveCount(1, { timeout: T });
    await this.row(会員ID).locator("i.dropdown-menu-toggle").click({ timeout: T });
  }

  /** 開いたサブメニューに、仮会員メール再送リンクが見えるか */
  async 再送リンクが見える(会員ID: string): Promise<boolean> { return this.link(会員ID).isVisible(); }

  /** 開発者ツールでの書き換え: 再送の送信ボタンの、なりすまし対策の値 */
  async なりすまし対策の値を書き換える(会員ID: string, 値: string): Promise<void> {
    await this.send(会員ID).evaluate((el, v) => el.setAttribute("token-for-anchor", v), 値);
  }

  /** 開発者ツールでの書き換え: 再送の送信先の会員IDを別の会員IDに書き換える */
  async 送信先の会員IDを書き換える(会員ID: string, 新会員ID: string): Promise<void> {
    await this.send(会員ID).evaluate((el, id) => el.setAttribute("href", (el.getAttribute("href") ?? "").replace(/\/customer\/\d+\/resend/, `/customer/${id}/resend`)), 新会員ID);
  }

  /** 仮会員メール再送リンクを押して、確認のモーダルを出す（サブメニューを開いた後） */
  async 再送リンクを押す(会員ID: string): Promise<void> {
    await this.link(会員ID).click({ timeout: T });
    await expect(this.page.locator(`#discontinuance_cus_${会員ID}`), "仮会員メール再送の確認モーダル").toBeVisible({ timeout: T });
  }

  /** 確認のモーダルの「送信」（確認ダイアログの「OK」）を押し、再送要求の応答のHTTPステータスを返す */
  async 送信して応答を読む(会員ID: string): Promise<number> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => /\/customer\/\d+\/resend/.test(r.url()), { timeout: 60_000 }),
      this.send(会員ID).click({ timeout: T }),
    ]);
    const status = res.status();
    await this.page.waitForLoadState("load").catch(() => undefined);
    return status;
  }
}
