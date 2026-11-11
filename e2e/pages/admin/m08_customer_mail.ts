/**
 * M08-02 メール一括送信（会員検索一覧(検索結果)の「その他」→「メール一括送信」→ メール一括送信 → 送信内容を確認 → メール送信）の画面操作。
 * セレクタはここにだけ書く。本文は画面のコードエディタ（Ace）に入れる。
 */
import { expect, Locator, Page } from "@playwright/test";

const T = 30_000;

export class M08CustomerMailPage {
  readonly subject: Locator;
  readonly ids: Locator;
  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    this.subject = page.locator("#admin_customer_mail_subject");
    this.ids = page.locator('[name="admin_customer_mail[ids]"]');
  }

  /** 会員検索一覧(検索結果)で、会員IDの行のチェックを入れる（ほかのチェックは外す） */
  async 一覧で選ぶ(会員ID: string[]): Promise<void> {
    const boxes = this.page.locator('input[name="ids[]"]');
    for (const b of await boxes.all()) if (await b.isChecked()) await b.uncheck({ timeout: T });
    for (const id of 会員ID) {
      const b = this.page.locator(`#check-${id}`);
      await expect(b, `検索結果に会員ID ${id} のチェック欄がある`).toHaveCount(1, { timeout: T });
      await b.check({ timeout: T });
    }
  }
  async 一覧で全部外す(): Promise<void> {
    await this.page.locator("#check-all").uncheck({ timeout: T }).catch(() => undefined);
    for (const b of await this.page.locator('input[name="ids[]"]').all()) if (await b.isChecked()) await b.uncheck({ timeout: T });
  }

  /** 「その他」→「メール一括送信」を押す。画面の動き（遷移したか・ダイアログが出たか）を返す */
  async その他からメール一括送信を押す(): Promise<{ 遷移した: boolean; ダイアログ: string | null }> {
    let dialog: string | null = null;
    const h = (d: import("@playwright/test").Dialog) => { dialog = d.message(); void d.accept(); };
    this.page.on("dialog", h);
    try {
      await this.page.locator("button.dropdown-toggle", { hasText: "その他" }).click({ timeout: T });
      const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }).then(() => true, () => false);
      await this.page.locator("a.target-action", { hasText: "メール一括送信" }).click({ timeout: T });
      const 遷移した = await nav;
      if (遷移した) await this.page.waitForLoadState("load");
      return { 遷移した, ダイアログ: dialog };
    } finally {
      this.page.off("dialog", h);
    }
  }

  async 入力画面である(): Promise<boolean> { return this.subject.isVisible(); }
  async 入力する(件名: string, 本文: string): Promise<void> {
    await this.subject.fill(件名, { timeout: T });
    await this.page.waitForFunction(() => typeof (window as unknown as { ace?: unknown }).ace !== "undefined", undefined, { timeout: T });
    await this.page.evaluate((t) => { (window as unknown as { ace: { edit: (id: string) => { setValue: (v: string, c: number) => void } } }).ace.edit("editor").setValue(t, -1); }, 本文);
  }
  async 本文を読む(): Promise<string> {
    return this.page.evaluate(() => (window as unknown as { ace: { edit: (id: string) => { getValue: () => string } } }).ace.edit("editor").getValue());
  }
  async 件名を読む(): Promise<string> { return this.subject.inputValue({ timeout: T }); }

  /** 非表示の会員IDリストの値を変える（開発者ツールで変える操作） */
  async 会員IDリストを変える(値: string): Promise<void> {
    await this.ids.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }
  async 会員IDリストを読む(): Promise<string> { return this.ids.inputValue({ timeout: T }); }

  async 送信内容を確認を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.page.locator("#confirm").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 確認画面 ----
  async 確認画面である(): Promise<boolean> { return (await this.page.locator("#complete").count()) > 0; }
  async 確認画面の件名と本文(): Promise<{ 件名: string; 本文: string }> {
    const sub = await this.page.locator("#detail_box__body").locator("xpath=ancestor::div[contains(@class,'card-body')][1]").locator(".row").first().innerText();
    const body = (await this.page.locator("#detail_box__body").innerText()).trim();
    return { 件名: sub.replace(/\s+/g, " ").trim(), 本文: body };
  }
  /** 確認画面の配信対象者（表の行の順に、会員IDと氏名） */
  async 配信対象者(): Promise<{ 会員ID: string; 氏名: string }[]> {
    const rows = this.page.locator('table tbody tr[id^="ex-customer-"]');
    const out: { 会員ID: string; 氏名: string }[] = [];
    for (const r of await rows.all()) {
      out.push({ 会員ID: ((await r.getAttribute("id")) ?? "").replace("ex-customer-", ""), 氏名: (await r.locator("td").nth(1).innerText()).replace(/\s+/g, " ").trim() });
    }
    return out;
  }
  async 戻るを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.page.locator("#back").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async 配信対象者の氏名を押す(会員ID: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator(`tr#ex-customer-${会員ID} a`).click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  async メール送信を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.page.locator("#complete").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 完了画面 ----
  async 完了画面である(): Promise<boolean> { return (await this.page.getByText("メール送信完了しました").count()) > 0; }
  /** 完了画面の本文の文（空白をそろえる） */
  async 完了画面の文(): Promise<string> {
    return (await this.page.locator("#main, main, .c-contentsArea").first().innerText({ timeout: T })).replace(/\s+/g, " ").trim();
  }
  async 完了画面の宛先の行数(): Promise<number> { return this.page.locator('tr[id^="ex-customer-"]').count(); }
  /** 入力画面・完了画面の左下の「会員一覧」（戻りのリンク）を押す */
  async 会員一覧を押す(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator("a.c-baseLink", { hasText: "会員一覧" }).first().click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }
  /** 確認画面の「検索結果へ戻る」（ボタンまたはリンク）を押す。画面に無ければ、この確かめが落ちる */
  async 検索結果へ戻るを押す(): Promise<void> {
    const b = this.page.getByRole("button", { name: "検索結果へ戻る", exact: true }).or(this.page.getByRole("link", { name: "検索結果へ戻る", exact: true }));
    await expect(b, "メール一括送信確認画面に「検索結果へ戻る」のボタンまたはリンクが1つある").toHaveCount(1, { timeout: 5_000 });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), b.first().click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
}

/** メール配信履歴画面（会員検索一覧の行の「メール履歴」から開く） */
export class M08MailHistoryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  private 行(件名: string): Locator {
    return this.page.locator("tbody tr").filter({ has: this.page.locator("a.btn-link", { hasText: 件名 }) });
  }
  async 件名の行の数(件名: string): Promise<number> { return this.行(件名).count(); }
  /** 件名の行の処理日と通知メール（1行目） */
  async 行の内容(件名: string): Promise<{ 処理日: string; 通知メール: string }> {
    const tds = this.行(件名).first().locator("td");
    return { 処理日: (await tds.nth(0).innerText({ timeout: T })).trim(), 通知メール: (await tds.nth(1).innerText({ timeout: T })).trim() };
  }
  /** 件名リンクを押して出るポップアップの件名と本文 */
  async 件名を押してポップアップを読む(件名: string): Promise<{ 件名: string; 本文: string }> {
    await this.行(件名).first().locator("a.btn-link").click({ timeout: T });
    const m = this.page.locator(".modal.show");
    await expect(m, "件名リンクのポップアップ").toBeVisible({ timeout: T });
    return { 件名: (await m.locator(".modal-title").innerText()).trim(), 本文: (await m.locator("p.text-start").innerText()).trim() };
  }
}
