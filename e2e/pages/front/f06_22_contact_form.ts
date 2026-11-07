/** F06-22 お問い合わせ（フロント）の入力・確認・完了の操作。セレクタはここだけに書く。正本: cases/F06-22_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { ContactPage } from "./f06_22_contact";

export type 入力 = {
  件名?: string; 詳細?: string; 付帯情報?: string; 店舗?: string; 姓?: string; 名?: string; 電話?: [string, string, string]; メール?: string; 内容?: string;
  イベント名?: string; イベント実施店舗?: string; 開催日?: string; 開始時間?: string; キャンセル理由?: string; その他キャンセル理由?: string; アンケート?: string;
};

export class ContactFormPage extends ContactPage {
  private f(id: string): Locator { return this.page.locator(`#contact_${id}`); }
  get 件名(): Locator { return this.f("subject"); }
  get 詳細(): Locator { return this.f("subSubject"); }
  get 付帯情報(): Locator { return this.f("attachedInfo"); }
  get 店舗(): Locator { return this.f("shop"); }
  get 姓(): Locator { return this.f("name_name01"); }
  get 名(): Locator { return this.f("name_name02"); }
  get メール(): Locator { return this.f("email"); }
  get 内容(): Locator { return this.f("contents"); }
  get イベント名(): Locator { return this.f("eventName"); }
  get イベント実施店舗(): Locator { return this.f("eventShop"); }
  get 開催日(): Locator { return this.f("eventDate"); }
  get 開始時間(): Locator { return this.f("eventStartTime"); }
  get キャンセル理由(): Locator { return this.f("cancelReason"); }
  get その他キャンセル理由(): Locator { return this.f("otherCancelReason"); }
  get アンケート(): Locator { return this.f("questionnaire"); }
  get 電話(): Locator[] { return ["tel01", "tel02", "tel03"].map((n) => this.f(`tel_${n}`)); }
  get 確認画面へ(): Locator { return this.page.locator("#submitButton"); }
  get 付帯情報の行(): Locator { return this.page.locator("#attached_info_row"); }
  get 店舗選択の行(): Locator { return this.page.locator("#shop_row"); }
  get キャンセル期限の行(): Locator { return this.page.locator("#event_cancel_policy"); }
  get 送信する(): Locator { return this.page.locator('button[name="mode"][value="complete"]'); }
  get 確認画面の戻る(): Locator { return this.page.locator('button[name="mode"][value="back"]'); }
  get 完了画面のトップへ戻る(): Locator { return this.page.getByRole("link", { name: "ホームへ戻る" }); }

  async 選択肢の表示名(l: Locator): Promise<string[]> { return (await l.locator("option").allInnerTexts()).map((t) => t.trim()); }
  async 選ばれている表示名(l: Locator): Promise<string> { return ((await l.locator("option:checked").first().textContent()) ?? "").trim(); }
  async 選ぶ(l: Locator, 表示名: string): Promise<void> {
    await l.selectOption({ label: 表示名 }, { timeout: 20_000 });
    await this.page.waitForTimeout(300);
  }

  /** 入力欄に値を入れる。指定した項目だけ（選択の順は、件名 → 詳細 → 以降） */
  async 入力する(v: 入力): Promise<void> {
    const T = 20_000;
    if (v.件名 !== undefined) await this.選ぶ(this.件名, v.件名);
    if (v.詳細 !== undefined) await this.選ぶ(this.詳細, v.詳細);
    if (v.付帯情報 !== undefined) await this.付帯情報.fill(v.付帯情報, { timeout: T });
    if (v.店舗 !== undefined) await this.選ぶ(this.店舗, v.店舗);
    if (v.イベント名 !== undefined) await this.イベント名.fill(v.イベント名, { timeout: T });
    if (v.イベント実施店舗 !== undefined) await this.選ぶ(this.イベント実施店舗, v.イベント実施店舗);
    if (v.開催日 !== undefined) await this.開催日.fill(v.開催日, { timeout: T });
    if (v.開始時間 !== undefined) await this.開始時間.fill(v.開始時間, { timeout: T });
    if (v.キャンセル理由 !== undefined) await this.選ぶ(this.キャンセル理由, v.キャンセル理由);
    if (v.その他キャンセル理由 !== undefined) await this.その他キャンセル理由.fill(v.その他キャンセル理由, { timeout: T });
    if (v.アンケート !== undefined) await this.アンケート.fill(v.アンケート, { timeout: T });
    if (v.姓 !== undefined) await this.姓.fill(v.姓, { timeout: T });
    if (v.名 !== undefined) await this.名.fill(v.名, { timeout: T });
    if (v.電話 !== undefined) for (let i = 0; i < 3; i++) await this.電話[i].fill(v.電話[i], { timeout: T });
    if (v.メール !== undefined) await this.メール.fill(v.メール, { timeout: T });
    if (v.内容 !== undefined) {
      if (await this.内容.isVisible()) await this.内容.fill(v.内容, { timeout: T });
      else test.info().annotations.push({ type: "手順の注記", description: `内容の入力欄は、お問い合わせ詳細が「イベントのキャンセル申込」のとき画面に表示されない（キャンセルの各項目から自動で組み立てられる）ため、「${v.内容}」を入力できなかった` });
    }
  }

  /** 「確認画面へ」を押す。ブラウザの警告（アラート）が出たらその文を返す。確認画面へ進んだかも返す */
  async 確認画面へ進む(): Promise<{ 警告: string | null; 確認画面: boolean }> {
    let 警告: string | null = null;
    const onDialog = (d: import("@playwright/test").Dialog) => { 警告 = d.message(); void d.dismiss(); };
    this.page.once("dialog", onDialog);
    await this.確認画面へ.evaluate((el) => el.scrollIntoView({ block: "center" }));
    try {
      await this.確認画面へ.click({ timeout: 15_000 });
    } catch {
      test.info().annotations.push({ type: "正本の外の補い", description: "「確認画面へ」は固定ヘッダーが重なり普通のクリックでは押せなかったため、クリックの操作を要素へ直接送って続けた" });
      await this.確認画面へ.dispatchEvent("click");
    }
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(1500);
    await this.page.waitForLoadState("load");
    this.page.off("dialog", onDialog);
    return { 警告, 確認画面: (await this.送信する.count()) > 0 };
  }
  async マイページを開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  get マイページのお問い合わせ(): Locator { return this.page.locator('a.p-hareruya-mypage__menu-link[href$="/contact"]'); }
  async マイページのお問い合わせを押す(): Promise<void> { await this.押して遷移する(this.マイページのお問い合わせ); }
  async 確認画面である(): Promise<boolean> { return (await this.送信する.count()) > 0; }
  async 確認画面の戻るを押す(): Promise<void> { await this.押して遷移する(this.確認画面の戻る); }
  /** 開発者ツールで行うのと同じに、お問い合わせ詳細の選択値を空にする */
  async 詳細の選択値を空にする(): Promise<void> {
    await this.詳細.evaluate((e) => { const s = e as HTMLSelectElement; s.add(new Option("", "")); s.value = ""; });
  }
  async 詳細の直下のエラー(): Promise<string> {
    return ((await this.page.locator("#sub_subject_row .c-hareruya-form-input__field-error, #sub_subject_row .form-error-message, #sub_subject_row ul li, #sub_subject_row [role=alert], #sub_subject_row .c-hareruya-text--error").allInnerTexts()).join(" ")).trim();
  }
  async 送信する押下(): Promise<void> {
    await this.押して遷移する(this.送信する);
  }
  async 確認画面の文(): Promise<string> { return (await this.page.locator(".p-hareruya-entry__form-body").first().innerText()).replace(/\s+/g, " ").trim(); }
  /** イベント詳細IDをクエリに付けて開く */
  async イベント詳細IDを指定して開く(id: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/${this.言語}/contact?eventDetailId=${id}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** 確認画面の項目名（見出しの文字）の一覧 */
  async 確認画面の項目名(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-entry__form-body .p-hareruya-form-block__label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  async 完了画面である(): Promise<boolean> { return /\/contact\/complete/.test(this.page.url()) && (await this.page.locator(".p-hareruya-contact-complete__message").count()) > 0; }

  /** 件名を選んだとき、入力欄として出ているか */
  async 表示中(l: Locator): Promise<boolean> { return l.isVisible(); }
  async 付帯情報のラベル(): Promise<string> { return ((await this.付帯情報の行.locator("label").first().textContent()) ?? "").trim(); }
  async 入力欄の値(l: Locator): Promise<string> { return l.inputValue(); }
}
