/**
 * M05-06 メール一括送信機能の画面操作。受注情報検索 一覧(検索結果)で受注を選んで「その他」→「メール一括送信」→ メール一括送信（入力）→
 * 手動メール通知(確認画面) →「送信」と、受注情報編集画面からの手動メール通知（受注1件）。セレクタはここだけに書く。
 * 受注一覧の検索・行の選択・「その他」の操作は M05-01 の部品（pages/admin/m05_01_order_list_x.ts）を使う。
 * 正本: cases/M05-06_test_cases.tsv
 */
import { Dialog, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { OrderListPage, 押した結果 } from "./m05_01_order_list_x";

const T = 30_000;
const 整える = (s: string): string => s.replace(/\s+/g, " ").trim();

/** 受注情報検索 一覧(検索入力)を開き、メールアドレスの一部で検索して、注文番号の行のチェックを入れる */
export async function 一覧で受注を選ぶ(page: Page, メールの一部: string, 注文番号: string[]): Promise<OrderListPage> {
  const list = new OrderListPage(page);
  await list.open();
  await list.showDetail().catch(() => false);
  await list.email.fill(メールの一部, { timeout: T });
  await list.clickSearch();
  for (const n of 注文番号) {
    await expect(list.結果の行(n), `検索結果に注文番号 ${n} の行がある`).toHaveCount(1, { timeout: T });
    await list.行を選ぶ(n);
    await expect(list.結果の行(n).locator('input[id^="check_"]').first(), `注文番号 ${n} の行にチェックが入った`).toBeChecked();
  }
  return list;
}

/** 受注一覧の、注文番号の行のチェック欄の値（配送の番号） */
export async function 行の配送ID(list: OrderListPage, 注文番号: string): Promise<string> {
  return (await list.結果の行(注文番号).locator('input[id^="check_"]').first().getAttribute("value")) ?? "";
}

export class MailAllPage {
  readonly template: Locator;
  readonly subject: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly confirmButton: Locator;
  readonly sendButton: Locator;
  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    this.template = page.locator("#mail_template");
    this.subject = page.locator("#mail_subject");
    this.header = page.locator("#mail_header");
    this.footer = page.locator("#mail_footer");
    this.confirmButton = page.locator("#ex-conversion-action button[type=submit]");
    this.sendButton = page.locator("#send_mail");
  }
  get パス(): string { return new URL(this.page.url()).pathname; }

  /** 受注一覧の「その他」→「メール一括送信」を押す（M05-01 の部品） */
  static async 一覧から開く(list: OrderListPage): Promise<押した結果> { return list.一括の操作を押す("メール一括送信"); }

  /** 配送の番号を並べたアドレスで開く（開発者ツールで、画面を開く要求の送信対象を書き換えて送る操作の代わり）。応答のステータスを返す */
  async 配送IDで開く(配送ID: string[]): Promise<number> {
    const q = 配送ID.map((id) => `ids%5B%5D=${encodeURIComponent(id)}`).join("&");
    const res = await this.page.goto(adminUrl(`/order/manual_mail/mail_all?${q}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  async 入力画面か(): Promise<boolean> { return /\/order\/manual_mail\/mail_all(\/\d+)?$/.test(this.パス) && (await this.template.count()) > 0 && (await this.sendButton.count()) === 0; }
  async 確認画面か(): Promise<boolean> { return (await this.sendButton.count()) > 0; }

  /** テンプレ選択でテンプレートを選ぶ（選ぶと画面が読み込み直される） */
  async テンプレを選ぶ(テンプレートID: string): Promise<void> {
    await expect(this.template, "テンプレ選択").toBeVisible();
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }),
      this.template.selectOption(テンプレートID),
    ]);
    await expect(this.template, "テンプレ選択の値").toHaveValue(テンプレートID, { timeout: T });
  }
  async 選ばれているテンプレ(): Promise<string> { return this.template.inputValue(); }
  /** テンプレ選択の選択肢（表示の名前） */
  async テンプレの選択肢(): Promise<string[]> { return (await this.template.locator("option").allInnerTexts()).map(整える); }
  async 件名(): Promise<string> { return this.subject.inputValue(); }
  /** メッセージ本文の欄の文（本文の中の入力欄（ヘッダー・フッター）の値も、その場所に入れて読む） */
  async 本文(): Promise<string> {
    return this.page.locator("#mail_edit_box__body").evaluate((el) => {
      const c = el.cloneNode(true) as HTMLElement;
      const src = el.querySelectorAll("textarea");
      c.querySelectorAll("textarea").forEach((t, i) => { t.replaceWith(document.createTextNode((src[i] as HTMLTextAreaElement).value)); });
      return (c.innerText ?? c.textContent ?? "").replace(/ /g, " ").trim();
    });
  }
  /** 本文の中の入力欄（ヘッダー・フッター）の値 */
  async ヘッダーの値(): Promise<string> { return (await this.header.count()) ? this.header.inputValue() : ""; }
  async フッターの値(): Promise<string> { return (await this.footer.count()) ? this.footer.inputValue() : ""; }

  /** 右の送信対象の表（注文番号・注文者氏名。表示の順） */
  async 送信対象(): Promise<{ 注文番号: string; 注文者: string }[]> {
    const rows = this.page.locator("#common_info_box__body tbody tr");
    const out: { 注文番号: string; 注文者: string }[] = [];
    for (const r of await rows.all()) {
      const tds = (await r.locator("td").allInnerTexts()).map(整える);
      out.push({ 注文番号: tds[0] ?? "", 注文者: tds[1] ?? "" });
    }
    return out;
  }
  /** 送信対象の配送の番号（画面の隠れた欄の値） */
  async 送信対象の配送ID(): Promise<string[]> {
    return this.page.locator('#common_info_box__body input[name="ids[]"]').evaluateAll((ns) => ns.map((n) => (n as HTMLInputElement).value));
  }

  async 件名を入れる(v: string): Promise<void> { await this.subject.fill(v); }
  async ヘッダーを入れる(v: string): Promise<void> { await this.header.fill(v); }
  async フッターを入れる(v: string): Promise<void> { await this.footer.fill(v); }

  /** 「確認」を押して、移った先まで待つ */
  async 確認を押す(): Promise<void> {
    await expect(this.confirmButton, "「確認」ボタンが押せる").toBeEnabled();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.confirmButton.click()]);
  }

  /** 画面左下の戻るリンク（入力画面は「受注一覧画面に戻る」、確認画面は「手動メール通知画面に戻る」）を押す。確認の窓が出たら OK を押す */
  async 左下の戻るを押す(): Promise<string[]> {
    const dialogs: string[] = [];
    const h = (d: Dialog) => { dialogs.push(d.message()); void d.accept(); };
    this.page.on("dialog", h);
    try {
      const a = this.page.locator(".c-conversionArea__leftBlockItem a.c-baseLink").first();
      await expect(a, "画面左下の戻るリンク").toBeVisible();
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), a.click()]);
    } finally { this.page.off("dialog", h); }
    return dialogs;
  }
  async 左下の戻るの文(): Promise<string> { return 整える(await this.page.locator(".c-conversionArea__leftBlockItem a.c-baseLink").first().innerText()); }

  // ---- 手動メール通知(確認画面) ----
  /** 確認画面の項目（テンプレート・件名・本文）を、ラベルの名前で読む */
  async 確認画面の項目(): Promise<Record<string, string>> {
    return this.page.locator(".c-primaryCol .card-body .row.mb-3").evaluateAll((rows) => Object.fromEntries(rows.map((r) => {
      const label = (r.querySelector("label")?.textContent ?? "").replace(/\s+/g, " ").trim();
      const v = (r.querySelector(".col-sm-10") as HTMLElement | null)?.innerText ?? "";
      return [label, v.replace(/ /g, " ").trim()];
    })));
  }
  /** 送信の要求の隠れた欄（mail[template]・mail[subject] など）の値を変える（開発者ツールで送信内容を書き換える操作の代わり） */
  async 送る値を変える(name: string, 値: string): Promise<void> {
    const n = await this.page.locator(`#form1 [name="${name}"]`).count();
    if (n !== 1) throw new Error(`送信の要求に「${name}」の欄が ${n} 個（1個のはず）`);
    await this.page.locator(`#form1 [name="${name}"]`).evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }
  /** 「送信」を押し、確認の窓で OK（はい）かキャンセルを押す。確認の窓の文と、画面が移ったかを返す */
  async 送信を押す(OK: boolean): Promise<{ 確認の文: string[]; 移った: boolean }> {
    const dialogs: string[] = [];
    const h = (d: Dialog) => { dialogs.push(d.message()); void (OK ? d.accept() : d.dismiss()); };
    this.page.on("dialog", h);
    try {
      const before = this.page.url();
      const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: OK ? 120_000 : 5_000 }).then(() => true, () => false);
      await this.sendButton.click();
      const moved = await nav;
      return { 確認の文: dialogs, 移った: moved || this.page.url() !== before };
    } finally { this.page.off("dialog", h); }
  }
  /** 画面上部のお知らせ（成功・失敗） */
  async お知らせ(): Promise<string[]> {
    return (await this.page.locator(".c-container .alert, .alert").allInnerTexts()).map(整える).filter(Boolean);
  }
}

// ---- 受注情報編集画面からの手動メール通知（受注1件） ----

export class OrderManualMailPage extends MailAllPage {
  /** 受注情報編集画面を開き、「手動メール通知」を押して手動メール通知画面を開く */
  async 受注情報編集から開く(受注ID: string): Promise<void> {
    const res = await this.page.goto(adminUrl(`/order/${受注ID}/edit`), { timeout: 60_000 });
    expect(res?.status() ?? 0, `受注ID ${受注ID} の受注情報編集画面の応答`).toBeLessThan(400);
    await this.page.waitForLoadState("load");
    const a = this.page.locator(`a[href*="/order/manual_mail"][href*="orderId=${受注ID}"]`).first();
    await expect(a, "受注情報編集画面の「手動メール通知」").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), a.click()]);
    await expect(this.template, "手動メール通知画面のテンプレ選択").toBeVisible();
  }
}
