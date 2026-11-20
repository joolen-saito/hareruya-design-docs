/**
 * M08-10 オンライン本人確認（会員登録/編集画面のモーダル）の操作。セレクタはここにだけ書く。正本: cases/M08-10_test_cases.tsv
 * 会員の編集画面の部品（M08CustomerEditPage）を引き継ぐ。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { M08CustomerEditPage } from "./m08_customer_edit";

const T = 30_000;

export class M0810IdentificationPage extends M08CustomerEditPage {
  constructor(page: Page) { super(page); }

  /** 会員登録画面を新規登録の状態で開く */
  async 新規登録を開く(): Promise<number> {
    const res = await this.page.goto(adminUrl("/customer/new"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** オンライン本人確認ボタンを押し、モーダルが表示されるまで待つ */
  async モーダルを開く(): Promise<void> {
    await this.オンライン本人確認ボタン.click({ timeout: T });
    await expect(this.オンライン本人確認ポップアップ, "オンライン本人確認のモーダル").toBeVisible({ timeout: T });
  }

  /** 身分証有効期限の入力欄（モーダルの中） */
  get 身分証有効期限(): Locator { return this.オンライン本人確認ポップアップ.locator('input[name="admin_customer[Player][id_expiration_date]"]'); }
  get 取消ボタン(): Locator { return this.オンライン本人確認ポップアップ.locator('button[data-bs-dismiss="modal"]'); }
  get 確認済に変更するボタン(): Locator { return this.オンライン本人確認ポップアップ.locator("#submit_confirm"); }

  /** 身分証有効期限に入れる（日付の入力欄は「2028-05-31」の形で入れる。画面の表記は「2028/05/31」） */
  async 期限を入れる(値: string): Promise<void> { await this.身分証有効期限.fill(値, { timeout: T }); }
  async 期限の値(): Promise<string> { return this.身分証有効期限.inputValue({ timeout: T }); }

  /** 開発者ツールの操作の代わりに、期限の入力要素を文字入力できる形に変えて値を入れる */
  async 期限を文字入力に変えて入れる(値: string): Promise<void> {
    await this.身分証有効期限.evaluate((el, v) => { const i = el as HTMLInputElement; i.type = "text"; i.value = v as string; }, 値);
  }

  /** 「確認済に変更する」を押し、移った先の画面の読み込みまで待つ */
  async 確認済に変更するを押す(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
      this.確認済に変更するボタン.click({ timeout: T, noWaitAfter: true }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 「確認済に変更する」を押し、そのとき送られた要求（アドレスと送信内容）を捕まえる */
  async 確認済に変更するを押して要求を捕まえる(): Promise<{ アドレス: string; 送信内容: string | null }> {
    const sent = this.page.waitForRequest((r) => r.method() === "POST" && /\/identification\/complete/.test(r.url()), { timeout: 60_000 });
    await this.確認済に変更するを押す();
    const req = await sent;
    return { アドレス: req.url(), 送信内容: req.postData() };
  }

  /** モーダルの上段（会員情報）の行。見出しと値を、画面の並びのまま返す（住所2・住所3の行は見出しが空） */
  async モーダルの会員情報(): Promise<{ 見出し: string; 値: string }[]> {
    return this.page.locator("#online_identification_info .modal-online_identification-border .row.mb-2").evaluateAll((rows) => rows.map((r) => ({
      見出し: (r.querySelector(".col-3 span")?.textContent ?? "").replace(/\s+/g, " ").trim(),
      値: (r.querySelector(":scope > .col")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    })));
  }

  /** 画面上部の警告・エラーの帯の文 */
  async 上部の表示(): Promise<string[]> {
    return (await this.page.locator(".alert-danger, .alert-success, .alert-warning").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !/デバッグモード/.test(t));
  }
}
