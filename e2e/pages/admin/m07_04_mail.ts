/**
 * 買取の手動メール通知（入力画面）。
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 買取番号は7桁に0埋めした表示。テンプレ選択は必須のプルダウン（先頭は「選択してください」）。
 * - 「買取編集画面に戻る」は買取情報編集画面へのリンク。「確認」は送信ボタン。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { 買取番号の表示 } from "./m07_buy";

const OPEN = 30_000;

export class ManualMailPage {
  constructor(private readonly page: Page) {}

  /** 直近に開いた画面のHTTPステータス（Networkで見る値） */
  直近のステータス = 0;

  get テンプレ選択(): Locator { return this.page.locator("#template-change"); }
  get 件名(): Locator { return this.page.locator('#purchase-mail-form input[name$="[subject]"]'); }
  get 本文(): Locator { return this.page.locator('#purchase-mail-form textarea[name$="[body]"]'); }

  /** 買取番号の手動メール通知（入力画面）を開き、HTTPステータスを返す */
  async 開く(番号: string): Promise<number> {
    return this.URLを開く(`/purchase/${Number(番号)}/mail`);
  }

  /** 管理画面のパスを開き、HTTPステータスを返す */
  async URLを開く(path: string): Promise<number> {
    const resp = await this.page.goto(adminUrl(path), { waitUntil: "load" });
    this.直近のステータス = resp?.status() ?? 0;
    return this.直近のステータス;
  }

  /** 画面に出ている買取番号（7桁表示） */
  async 買取番号を読む(): Promise<string> {
    const row = this.page.locator("#purchase-mail-form .row").filter({ has: this.page.locator("span", { hasText: /^買取番号$/ }) }).first();
    await expect(row, "買取番号の行").toBeVisible({ timeout: OPEN });
    return ((await row.locator(".col span").first().textContent()) ?? "").trim();
  }

  期待の買取番号(番号: string): string { return 買取番号の表示(番号); }

  async テンプレートの選択状態(): Promise<{ 値: string; 表示: string }> {
    const 値 = await this.テンプレ選択.inputValue();
    const 表示 = ((await this.テンプレ選択.locator("option:checked").textContent()) ?? "").trim();
    return { 値, 表示 };
  }

  async 件名と本文を読む(): Promise<{ 件名: string; 本文: string }> {
    return { 件名: await this.件名.inputValue(), 本文: await this.本文.inputValue() };
  }

  async 件名と本文を入れる(件名: string, 本文: string): Promise<void> {
    await this.件名.fill(件名);
    await this.本文.fill(本文);
  }

  /** 開発者ツールで、テンプレ選択のrequired属性を削除する */
  async テンプレのrequiredを外す(): Promise<void> {
    await this.テンプレ選択.evaluate((el) => el.removeAttribute("required"));
  }

  async 確認を押す(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.page.locator('#purchase-mail-form button[name="mode"][value="confirm"]').click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 入力画面の項目ごとのエラー表示の文（無ければ空） */
  async 項目のエラー(): Promise<string[]> {
    const t = await this.page.locator("#purchase-mail-form .invalid-feedback, #purchase-mail-form .form-error-message, #purchase-mail-form .text-danger").allInnerTexts();
    return t.map((s) => s.trim()).filter((s) => s);
  }

  async 買取編集画面へ戻る(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.page.locator("a.c-baseLink").filter({ hasText: /買取編集画面.*戻る/ }).click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- テンプレートの選択・確認画面 ----

  /** テンプレ選択の選択肢（先頭の「選択してください」を除く、画面の並びのまま） */
  async 選択肢(): Promise<string[]> {
    return this.テンプレ選択.locator("option").evaluateAll((os) => (os as HTMLOptionElement[]).filter((o) => o.value !== "").map((o) => (o.textContent ?? "").trim()));
  }
  /** テンプレ選択で名前を選ぶ。選ぶと画面が読み込み直される（選択肢に無ければ失敗する） */
  async テンプレを選ぶ(名称: string): Promise<void> {
    const 候補 = await this.選択肢();
    if (!候補.includes(名称)) throw new Error(`テンプレ選択の選択肢に「${名称}」が無い（ある選択肢: ${候補.slice(0, 30).join("、")}）`);
    await Promise.all([this.page.waitForLoadState("load"), this.テンプレ選択.selectOption({ label: 名称 }, { timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    await expect(this.件名, "テンプレート選択後の入力画面").toBeVisible({ timeout: OPEN });
  }
  /** 開発者ツールで、テンプレ選択へ値の選択肢を追加して選び、テンプレート変更の要求（POST）のHTTPステータスを返す */
  async 選択肢を足して選ぶ(値: string): Promise<number> {
    const wait = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/purchase\/\d+\/mail/.test(r.url()), { timeout: 60_000 });
    await this.テンプレ選択.evaluate((el, v) => {
      const sel = el as HTMLSelectElement;
      const o = document.createElement("option");
      o.value = v; o.textContent = `追加-${v}`;
      sel.appendChild(o);
      sel.value = v;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }, 値);
    const r = await wait;
    await this.page.waitForLoadState("load");
    this.直近のステータス = r.status();
    return this.直近のステータス;
  }

  private 確認の行(ラベル: string): Locator {
    return this.page.locator("#purchase-mail-form .row.mb-2").filter({ has: this.page.locator("div.col-3 span", { hasText: new RegExp(`^\\s*${ラベル}\\s*$`) }) });
  }
  /** 手動メール通知(確認画面)の表示内容 */
  async 確認画面の内容(): Promise<{ 買取番号: string; テンプレート: string; 件名: string; 本文: string }> {
    const v = async (l: string) => ((await this.確認の行(l).locator("div.col").innerText({ timeout: OPEN })) ?? "").trim();
    await expect(this.page.locator("#back"), "確認画面の「手動メール通知入力画面に戻る」").toBeVisible({ timeout: OPEN });
    return {
      買取番号: await v("買取番号"), テンプレート: await v("テンプレ選択"), 件名: await v("件名"),
      本文: ((await this.page.locator("#purchase-mail-form .form-control-static").innerText({ timeout: OPEN })) ?? "").trim(),
    };
  }
  async 確認画面を表示中か(): Promise<boolean> { return (await this.page.locator("#back").count()) > 0; }
  async 入力画面へ戻る(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator("#back").click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }
  async 送信を押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator('#purchase-mail-form button[name="mode"][value="complete"]').click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }
  get パス(): string { return new URL(this.page.url()).pathname; }
  /** 件名の入力欄のrequired属性を削除する */
  async 件名のrequiredを外す(): Promise<void> { await this.件名.evaluate((el) => el.removeAttribute("required")); }
  async 本文のrequiredを外す(): Promise<void> { await this.本文.evaluate((el) => el.removeAttribute("required")); }
}
