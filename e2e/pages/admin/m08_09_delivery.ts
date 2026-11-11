/**
 * M08-09 配送先一覧表示/編集の画面操作。セレクタはここだけに書く。正本: cases/M08-09_test_cases.tsv
 * - 配送先一覧画面: アプリには配送先だけの一覧の画面が無く、会員登録編集画面の「お届け先住所」欄（会員ごとの配送先の表）がそれに当たる
 *   （/customer/{会員ID}/edit）。1件の配送先が表の1行（枠）。既定の配送先の行には、住所のリンク（編集）と削除の操作が出ない作り。
 * - 配送先編集画面: /customer/{会員ID}/delivery/{配送先ID}/edit（新規は /customer/{会員ID}/delivery/new）。登録すると同じ配送先の編集画面へ戻る。
 * - 削除: 行の削除の操作で確認ダイアログ（画面の中のモーダル）が開き、「削除」で送ると会員登録編集画面へ戻る。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export const 会員編集のパス = (会員ID: string) => new URL(adminUrl(`/customer/${会員ID}/edit`)).pathname;
export const 配送先編集のパス = (会員ID: string, 配送先ID: string) => new URL(adminUrl(`/customer/${会員ID}/delivery/${配送先ID}/edit`)).pathname;

/** 配送先編集画面の入力（空文字は欄を空にする。省略した欄は触らない） */
export type 配送先の入力 = {
  配送先名称?: string; 国?: string; 姓?: string; 名?: string; セイ?: string; メイ?: string;
  電話?: [string, string, string]; 郵便番号?: [string, string]; 海外用郵便番号?: string;
  都道府県?: string; 住所1?: string; 住所2?: string; 住所3?: string; 会社名?: string;
};

export class DeliveryEditPage {
  constructor(readonly page: Page) {}
  private f(name: string): Locator { return this.page.locator(`[name="customer_address[${name}]"]`); }
  get 登録ボタン(): Locator { return this.page.locator("#customer_address_form .c-conversionArea button[type=submit]"); }
  get 会員登録のリンク(): Locator { return this.page.locator("#customer_address_form .c-conversionArea a.c-baseLink"); }
  get 主の領域(): Locator { return this.page.locator(".c-contentsArea"); }

  /** 編集画面をアドレスで開き、応答を返す */
  async open(会員ID: string, 配送先ID: string): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/customer/${会員ID}/delivery/${配送先ID}/edit`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }
  async openNew(会員ID: string): Promise<void> {
    const res = await this.page.goto(adminUrl(`/customer/${会員ID}/delivery/new`), { timeout: 60_000 });
    expect(res?.status(), `会員ID ${会員ID} のお届け先登録画面の応答`).toBe(200);
    await expect(this.f("address_name"), "お届け先登録画面の配送先名称の欄").toBeVisible();
  }

  async fill(v: 配送先の入力): Promise<void> {
    if (v.国 !== undefined) await this.f("country").selectOption({ label: v.国 });
    if (v.配送先名称 !== undefined) await this.f("address_name").fill(v.配送先名称);
    if (v.姓 !== undefined) await this.f("name][name01").fill(v.姓);
    if (v.名 !== undefined) await this.f("name][name02").fill(v.名);
    if (v.セイ !== undefined) await this.f("kana][kana01").fill(v.セイ);
    if (v.メイ !== undefined) await this.f("kana][kana02").fill(v.メイ);
    if (v.電話) { await this.f("tel][tel01").fill(v.電話[0]); await this.f("tel][tel02").fill(v.電話[1]); await this.f("tel][tel03").fill(v.電話[2]); }
    if (v.郵便番号) { await this.f("postalCode][postalCode01").fill(v.郵便番号[0]); await this.f("postalCode][postalCode02").fill(v.郵便番号[1]); }
    if (v.海外用郵便番号 !== undefined) await this.f("abroadPostalCode").fill(v.海外用郵便番号);
    if (v.都道府県 !== undefined) {
      const pref = this.f("address][pref");
      // 国が Japan 以外のときは都道府県の欄が隠れる作り（送ると日本国外で保存される）。見えるときだけ選ぶ
      if (await pref.isVisible()) await pref.selectOption({ label: v.都道府県 });
    }
    if (v.住所1 !== undefined) await this.f("address][addr01").fill(v.住所1);
    if (v.住所2 !== undefined) await this.f("address][addr02").fill(v.住所2);
    if (v.住所3 !== undefined) await this.f("address][addr03").fill(v.住所3);
    if (v.会社名 !== undefined) await this.f("company_name").fill(v.会社名);
  }

  /** 登録ボタンを押し、移った先の読み込みを待つ。移った先のパスを返す */
  async pressRegister(): Promise<string> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.登録ボタン.click()]);
    return new URL(this.page.url()).pathname;
  }

  /** 画面上部のメッセージ（開発用の設定の帯を除く） */
  async messages(): Promise<string[]> {
    return (await this.page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t && !t.includes("デバッグモードが有効"));
  }
  /** 配送先名称の欄の下のエラーの文 */
  async 配送先名称のエラー(): Promise<string> {
    const row = this.f("address_name").locator("xpath=ancestor::div[contains(@class,'row')][1]");
    return ((await row.locator(".invalid-feedback, .form-error-message, .ec-errorMessage").allInnerTexts()).join(" ")).replace(/\s+/g, " ").trim();
  }
  async 値(name: "address_name" | "company_name"): Promise<string> { return this.f(name).inputValue(); }

  /** 編集画面の URL の末尾から配送先IDを読む */
  配送先ID(): string {
    const m = /\/delivery\/(\d+)\/edit$/.exec(new URL(this.page.url()).pathname);
    if (!m) throw new Error(`配送先編集画面のアドレスでない（${this.page.url()}）`);
    return m[1];
  }
}

/** 配送先一覧（会員登録編集画面の「お届け先住所」欄） */
export class DeliveryListPage {
  constructor(readonly page: Page) {}
  get 表(): Locator { return this.page.locator("#delivery table tbody"); }

  async open(会員ID: string): Promise<Response | null> {
    const res = await this.page.goto(adminUrl(`/customer/${会員ID}/edit`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }
  /** 配送先IDの行（住所のリンクか削除の確認ダイアログの番号で見分ける。既定の配送先の行には無い） */
  行(配送先ID: string): Locator {
    return this.表.locator("tr").filter({ has: this.page.locator(`a[href*="/delivery/${配送先ID}/edit"], [data-bs-target="#discontinuance-${配送先ID}"]`) });
  }
  /** 配送先名称（1列目）の行 */
  名称の行(名称: string): Locator {
    return this.表.locator("tr").filter({ has: this.page.locator("td:nth-child(1)", { hasText: new RegExp(`^\\s*${名称.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
  }
  /** 行の文（空白は1つにまとめる） */
  async 文(row: Locator): Promise<string> { return ((await row.innerText()) ?? "").replace(/\s+/g, " ").trim(); }
  async 名称一覧(): Promise<string[]> {
    return (await this.表.locator("tr > td:nth-child(1)").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /** 行に編集の操作（住所のリンク）があるか・削除の操作があるか */
  async 操作(row: Locator): Promise<{ 編集: number; 削除: number }> {
    return { 編集: await row.locator('a[href*="/delivery/"][href$="/edit"]').count(), 削除: await row.locator('[data-bs-target^="#discontinuance-"]').count() };
  }
  /** 行の削除の操作を押し、確認ダイアログが開くのを待つ。ダイアログを返す */
  async 削除の操作を選ぶ(配送先ID: string): Promise<Locator> {
    const row = this.行(配送先ID);
    await expect(row, `配送先ID ${配送先ID} の行`).toHaveCount(1);
    await row.locator(`[data-bs-target="#discontinuance-${配送先ID}"]`).click();
    const modal = this.page.locator(`#discontinuance-${配送先ID}`);
    await expect(modal, "削除の確認ダイアログ").toBeVisible();
    return modal;
  }
  async キャンセルする(modal: Locator): Promise<void> {
    await modal.getByRole("button", { name: "キャンセル" }).click();
    await expect(modal, "削除の確認ダイアログが閉じた").toBeHidden();
  }
  /** 確認ダイアログの「削除」を押し、移った先の読み込みを待つ。移った先のパスを返す */
  async 了承する(modal: Locator): Promise<string> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), modal.locator("a.btn-ec-delete").click()]);
    return new URL(this.page.url()).pathname;
  }
}
