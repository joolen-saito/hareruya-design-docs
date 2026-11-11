/**
 * F08-02 店頭買取査定申込情報入力（申込前ログイン画面・申込情報入力画面・会員登録フォーム）の画面操作。セレクタはここにだけ書く。
 * 申込の入力と確認画面の読み取りは F08-05 の部品（pages/front/f08_05_confirm.ts の OtcApplyPage）を使い、ここには F08-02 で足りないものだけを置く。
 *
 * 画面の作り（アプリのテンプレートとスクリプトで確かめた。期待値はここから取らない）:
 * - 申込前ログイン画面（/<言語>/otcbuy/<支店URL>/entry）の Language（JP/EN）の選択で、同じ画面の日本語・英語表示へ移る。
 * - 申込情報入力画面（/<言語>/otcbuy/<支店URL>）は、エントリーを開始していないと申込前ログイン画面へ戻す。
 *   Language の選択欄を変えると、画面のスクリプトが同じ画面の日本語・英語表示へ移す。
 *   「入力時間：残り」（英語は「Remaining time to input:」）の見出しと10分のタイマーがあり、時間切れで申込前ログイン画面へ移る。
 *   未成年の生年月日で「次のページへ進む」を押すと、確認のモーダル（はい・いいえ）が出る。
 *   適格請求書発行事業者登録番号の欄は、「はい」のときだけ入力でき、「いいえ」のときは入力できない（欄は出たまま）。
 *   「キャンセル」は申込前ログイン画面へのリンク。
 * - 会員登録フォーム（/<言語>/otcbuy/<支店URL>/register_customer。POST だけ）は、メールアドレス・パスワードと利用規約同意の欄だけで、
 *   申込情報は画面に出さず、セッションに持つ。「次のページへ進む」（会員登録あり）・「会員登録をスキップする」（会員登録なし）・「キャンセル」。
 *   メールアドレスなどを入れたまま「会員登録をスキップする」を押すと、知らせ（alert）を出して止まる。
 */
import { Dialog, expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const NAV = 60_000;

export type 言語 = "ja" | "en";

export const 入力画面のURL = (支店URL: string, 言語: 言語 = "ja") => `${BASE_URL}/${言語}/otcbuy/${支店URL}`;
export const 会員登録フォームのURL = (支店URL: string, 言語: 言語 = "ja") => `${BASE_URL}/${言語}/otcbuy/${支店URL}/register_customer`;

/** 申込情報入力画面のログイン中の値（ログインした会員の情報が入る欄） */
export type 入力欄の値 = {
  姓: string; 名: string; セイ: string; メイ: string; 郵便番号1: string; 郵便番号2: string; 都道府県: string;
  住所1: string; 住所2: string; 住所3: string; 年: string; 月: string; 日: string; 電話1: string; 電話2: string; 電話3: string; 職業: string;
  登録番号: string; 登録番号を入力できる: boolean;
};

export class OtcInputPage {
  constructor(readonly page: Page) {}

  /** 申込情報入力画面の入力欄（otc_buy_order[...]） */
  readonly 欄 = (name: string): Locator => this.page.locator(`[name="otc_buy_order[${name}]"]`);
  readonly 登録番号欄 = (): Locator => this.page.locator('[name="otc_buy_qualified_invoice_issuer_account[qualifiedInvoiceIssuerCode]"]');
  readonly 入力フォーム = (): Locator => this.page.locator("form#otc_buy_order_form");
  readonly 会員登録フォーム = (): Locator => this.page.locator("form#otc_buy_register_customer_form");
  readonly ログイン欄 = (): Locator => this.page.locator("form#login_otc_buy");
  get パス(): string { return new URL(this.page.url()).pathname; }

  // ---- 申込前ログイン画面 ----

  /** 申込前ログイン画面を開く（言語の表示を選んで） */
  async 申込前ログイン画面を開く(支店URL: string, 言語: 言語 = "ja"): Promise<void> {
    await this.page.goto(`${入力画面のURL(支店URL, 言語)}/entry`, { timeout: NAV });
    await this.page.waitForLoadState("load");
    await expect(this.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible({ timeout: T });
  }

  /** 申込前ログイン画面の Language で JP・EN を選ぶ（画面のスクリプトが同じ画面のその言語の表示へ移す。同じ言語なら開き直す） */
  async 申込前ログイン画面で言語を選ぶ(表示: "JP" | "EN"): Promise<void> {
    const nav = this.page.waitForEvent("framenavigated", { timeout: 10_000 }).catch(() => undefined);
    await this.page.locator("select#select_lang").selectOption({ label: 表示 }, { timeout: T });
    await nav;
    await this.page.waitForLoadState("load");
    await expect(this.ログイン欄(), "申込前ログイン画面のログイン欄").toBeVisible({ timeout: T });
  }

  /** 申込前ログイン画面の Language で選ばれている表示 */
  async 申込前ログイン画面の言語(): Promise<string> {
    return ((await this.page.locator("select#select_lang option:checked").textContent({ timeout: T })) ?? "").trim();
  }

  // ---- 申込情報入力画面 ----

  /** 申込情報入力画面のURLを開く（エントリー開始済みなら入力画面、そうでなければ申込前ログイン画面へ移る）。移った先のパスを返す */
  async 入力画面を開く(支店URL: string, 言語: 言語 = "ja"): Promise<string> {
    await this.page.goto(入力画面のURL(支店URL, 言語), { timeout: NAV });
    await this.page.waitForLoadState("load");
    return this.パス;
  }

  /** 申込情報入力画面であること（お名前（姓）の欄が見える） */
  async 入力画面を待つ(): Promise<void> {
    await expect(this.欄("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible({ timeout: T });
  }

  /** 申込情報入力画面が何も入力されていない状態か（お名前・郵便番号・住所・電話番号の欄が空） */
  async 何も入力されていない(): Promise<boolean> {
    await this.入力画面を待つ();
    for (const n of ["lastName", "firstName", "postal_code_1", "postal_code_2", "addr01", "addr02", "addr03", "tel01", "tel02", "tel03"]) {
      if ((await this.欄(n).count()) > 0 && (await this.欄(n).inputValue({ timeout: T })) !== "") return false;
    }
    return true;
  }

  /** 入力欄に値を入れる（ほかの欄はそのまま） */
  async 欄に入れる(name: string, 値: string): Promise<void> { await this.欄(name).fill(値, { timeout: T }); }

  /** お名前の欄に1文字ずつ打つ（フリガナの自動入力は打鍵に反応する） */
  async 打つ(name: string, 値: string): Promise<void> {
    await this.欄(name).click({ timeout: T });
    await this.欄(name).pressSequentially(値, { delay: 120, timeout: T });
    await this.page.waitForTimeout(500);
  }

  async 値(name: string): Promise<string> { return this.欄(name).inputValue({ timeout: T }); }

  /** 選択欄で選ばれている選択肢の名前 */
  async 選択中(name: string): Promise<string> {
    return ((await this.欄(name).locator("option:checked").first().textContent({ timeout: T })) ?? "").trim();
  }

  /** ラジオで選ばれている選択肢の名前（無ければ空） */
  async ラジオ選択中(name: string): Promise<string> {
    const c = this.page.locator(`input[name="otc_buy_order[${name}]"]:checked`).first();
    if ((await c.count()) === 0) return "";
    const id = await c.getAttribute("id");
    return ((await this.page.locator(`label[for="${id}"]`).first().textContent({ timeout: T })) ?? "").trim();
  }

  /** 利用規約同意のチェック */
  async 利用規約同意の状態(): Promise<boolean> { return this.欄("privacy_flg").isChecked({ timeout: T }); }

  /** 申込情報入力画面の Language の選択欄で選ばれている表示 */
  async 入力画面の言語(): Promise<string> { return this.選択中("language"); }

  /** 申込情報入力画面の Language で JP・EN を選ぶ（画面のスクリプトが同じ画面のその言語の表示へ移す） */
  async 入力画面で言語を選ぶ(表示: "JP" | "EN"): Promise<void> {
    const to = 表示 === "EN" ? /\/en\/otcbuy\// : /\/ja\/otcbuy\//;
    await Promise.all([
      this.page.waitForURL(to, { timeout: NAV }),
      this.欄("language").selectOption({ label: 表示 }, { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 申込情報入力画面の項目名（見出し） */
  async 項目名(): Promise<string[]> {
    return (await this.入力フォーム().locator(".p-hareruya-form-block__label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /** 画面上部の入力時間の見出し */
  async 入力時間の見出し(): Promise<string> {
    return (await this.page.locator(".p-hareruya-entry__time .p-hareruya-form-block__label").first().innerText({ timeout: T })).trim();
  }

  /** 住所の欄の枠（見出し・入力欄・注意書き） */
  readonly 住所の枠 = (): Locator => this.入力フォーム().locator(".p-hareruya-entry__address").first();

  /** 郵便番号（前半・後半）と都道府県の欄 */
  readonly 郵便番号1の欄 = (): Locator => this.欄("postal_code_1");
  readonly 郵便番号2の欄 = (): Locator => this.欄("postal_code_2");
  readonly 都道府県の欄 = (): Locator => this.欄("pref");

  /** 適格請求書発行事業者確認の「はい」「いいえ」を選ぶ */
  async 適格請求書発行事業者を選ぶ(答え: "はい" | "いいえ"): Promise<void> {
    await this.page.locator(`input[name="otc_buy_order[qualifiedInvoiceIssuerFlg]"][value="${答え === "はい" ? 1 : 0}"]`).check({ timeout: T });
    await this.page.waitForTimeout(300);
  }

  /** 利用規約の「詳細」ボタンを押す */
  async 利用規約の詳細を押す(): Promise<void> {
    await this.入力フォーム().locator('.p-hareruya-entry__terms button[data-js-modal-trigger="otc-terms-modal"]').click({ timeout: T });
    await this.page.waitForTimeout(800);
  }
  readonly 利用規約のモーダル = (): Locator => this.page.locator("#otc-terms-modal");
  /** 利用規約のモーダルの中で見えている、個人情報の取り扱い（プライバシーポリシー）のボタン */
  readonly モーダルの個人情報のボタン = (): Locator =>
    this.利用規約のモーダル().locator("button:visible, a:visible, [role=tab]:visible").filter({ hasText: /個人情報|プライバシー/ });

  /** 「適格請求書発行事業者について」を押す */
  async 適格請求書発行事業者についてを押す(): Promise<void> {
    await this.入力フォーム().locator('button[data-js-modal-trigger="invoice-issuer-modal"]').first().click({ timeout: T });
    await this.page.waitForTimeout(800);
  }
  readonly 適格請求書のモーダル = (): Locator => this.page.locator("#invoice-issuer-modal");

  /** 「次のページへ進む」を押す（移らなくても止めない）。押したあとのパスを返す */
  async 次のページへ進むを押す(): Promise<string> {
    const btn = this.入力フォーム().locator("button#otcBuyOrderApply");
    await expect(btn, "申込情報入力画面の「次のページへ進む」").toBeVisible({ timeout: T });
    const nav = this.page.waitForEvent("framenavigated", { timeout: 15_000 }).catch(() => undefined);
    await btn.click({ timeout: T });
    await nav;
    await this.page.waitForLoadState("load");
    await this.page.waitForTimeout(500);
    return this.パス;
  }

  /** 申込情報入力画面の「キャンセル」を押す */
  async 入力画面のキャンセルを押す(): Promise<void> {
    const a = this.入力フォーム().locator(".p-hareruya-entry__form-actions a").filter({ hasText: /キャンセル|Cancel/ }).first();
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/entry/, { timeout: NAV }), a.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 未成年確認モーダル ----

  readonly 未成年確認モーダル = (): Locator => this.page.locator("#ageModal");
  async 未成年確認のはいを押す(): Promise<void> {
    const nav = this.page.waitForEvent("framenavigated", { timeout: 15_000 }).catch(() => undefined);
    await this.page.locator("#ageModalApprove").click({ timeout: T });
    await nav;
    await this.page.waitForLoadState("load");
  }
  async 未成年確認のいいえを押す(): Promise<void> {
    await this.page.locator("#ageModalDismiss").click({ timeout: T });
    await this.page.waitForTimeout(800);
  }

  // ---- ログイン中の入力欄 ----

  /** ログインした会員の情報が入る欄の値 */
  async 入力欄の値(): Promise<入力欄の値> {
    await this.入力画面を待つ();
    const v = (n: string) => this.値(n);
    const code = this.登録番号欄();
    return {
      姓: await v("lastName"), 名: await v("firstName"), セイ: await v("lastNameKana"), メイ: await v("firstNameKana"),
      郵便番号1: await v("postal_code_1"), 郵便番号2: await v("postal_code_2"), 都道府県: await this.選択中("pref"),
      住所1: await v("addr01"), 住所2: await v("addr02"), 住所3: await v("addr03"),
      年: await this.欄("birth][year").inputValue({ timeout: T }), 月: await this.欄("birth][month").inputValue({ timeout: T }), 日: await this.欄("birth][day").inputValue({ timeout: T }),
      電話1: await v("tel01"), 電話2: await v("tel02"), 電話3: await v("tel03"), 職業: await this.選択中("job"),
      登録番号: await code.inputValue({ timeout: T }), 登録番号を入力できる: await code.isEnabled({ timeout: T }),
    };
  }

  /**
   * ログイン中の申込情報入力画面で、空の必須項目（電話連絡・大会参加・適格請求書発行事業者確認・利用規約同意・職業など）だけに入れる。
   * 入れた項目の名前を返す。
   */
  async 空の必須項目に入れる(v: { 職業: string; 電話連絡: "必要" | "不必要"; 大会参加: "はい" | "いいえ"; 適格請求書発行事業者: "はい" | "いいえ"; 利用規約同意: boolean }): Promise<string[]> {
    await this.入力画面を待つ();
    const out: string[] = [];
    if ((await this.欄("job").inputValue({ timeout: T })) === "") { await this.欄("job").selectOption({ label: v.職業 }, { timeout: T }); out.push("職業"); }
    for (const [name, 値, 名] of [["call_flg", v.電話連絡 === "必要" ? 1 : 0, "電話連絡"], ["playing_flg", v.大会参加 === "はい" ? 1 : 0, "大会参加中または参加予定"],
      ["qualifiedInvoiceIssuerFlg", v.適格請求書発行事業者 === "はい" ? 1 : 0, "適格請求書発行事業者確認"]] as const) {
      if ((await this.page.locator(`input[name="otc_buy_order[${name}]"]:checked`).count()) === 0) {
        await this.page.locator(`input[name="otc_buy_order[${name}]"][value="${値}"]`).check({ timeout: T });
        out.push(名);
      }
    }
    if (v.利用規約同意 && !(await this.利用規約同意の状態())) { await this.欄("privacy_flg").check({ timeout: T }); out.push("利用規約同意"); }
    return out;
  }

  /** ログイン中の「次のページへ進む」（確認画面へ送る）を押し、移った先のパスを返す */
  async ログイン中の次へを押す(): Promise<string> { return this.次のページへ進むを押す(); }

  // ---- 開発者ツールの代わり ----

  /** 申込情報入力画面のフォームの送信先を書き換える（開発者ツールで書き換える代わり） */
  async フォームの送信先を書き換える(url: string): Promise<void> {
    await this.入力フォーム().evaluate((f, u) => { (f as HTMLFormElement).action = u; }, url);
  }

  /** このブラウザのクッキー（セッション）を全て消す（開発者ツールで消す代わり） */
  async クッキーを消す(): Promise<void> { await this.page.context().clearCookies(); }

  /** 試験用のフォームを作って、入力内容を含めずに URL へ POST で送る。送ったあとのパスを返す */
  async 空のPOSTを送る(url: string): Promise<string> {
    const nav = this.page.waitForEvent("framenavigated", { timeout: 30_000 }).catch(() => undefined);
    await this.page.evaluate((u) => {
      const f = document.createElement("form");
      f.method = "post"; f.action = u;
      document.body.appendChild(f);
      f.submit();
    }, url);
    await nav;
    await this.page.waitForLoadState("load");
    return this.パス;
  }

  // ---- 会員登録フォーム ----

  /** 会員登録フォームであること */
  async 会員登録フォームか(): Promise<boolean> { return this.会員登録フォーム().isVisible(); }

  /** 会員登録フォームのメールアドレス・パスワード（確認用も）を入れ、利用規約同意にチェックを付ける（送らない） */
  async 会員登録の値を入れる(メール: string, パスワード: string, 同意 = true): Promise<void> {
    await expect(this.会員登録フォーム(), "会員登録フォーム").toBeVisible({ timeout: T });
    await this.page.locator("#otc_buy_order_email_first").fill(メール, { timeout: T });
    await this.page.locator("#otc_buy_order_email_second").fill(メール, { timeout: T });
    await this.page.locator("#otc_buy_order_password_first").fill(パスワード, { timeout: T });
    await this.page.locator("#otc_buy_order_password_second").fill(パスワード, { timeout: T });
    if (同意) await this.page.locator("#otc_buy_order_entry_privacy_flg").check({ timeout: T });
  }

  /** 会員登録フォームのメールアドレス・パスワード（確認用も）を空にする */
  async 会員登録の値を空にする(): Promise<void> {
    await expect(this.会員登録フォーム(), "会員登録フォーム").toBeVisible({ timeout: T });
    for (const id of ["email_first", "email_second", "password_first", "password_second"]) await this.page.locator(`#otc_buy_order_${id}`).fill("", { timeout: T });
  }

  /** 会員登録フォームの「次のページへ進む」（会員登録ありの申込）を押す（移らなくても止めない）。押したあとのパスを返す */
  async 会員登録ありで進むを押す(): Promise<string> {
    const nav = this.page.waitForEvent("framenavigated", { timeout: 15_000 }).catch(() => undefined);
    await this.会員登録フォーム().locator("button#submitButton").click({ timeout: T });
    await nav;
    await this.page.waitForLoadState("load");
    await this.page.waitForTimeout(500);
    return this.パス;
  }

  /**
   * 会員登録フォームの「会員登録をスキップする」（会員登録なしの申込）を押す（移らなくても止めない）。
   * 知らせ（alert）が出たら閉じて、その文を返す。
   */
  async 会員登録なしで進むを押す(): Promise<{ パス: string; 知らせ: string | null }> {
    let 知らせ: string | null = null;
    const onDialog = (d: Dialog) => { 知らせ = d.message(); void d.dismiss(); };
    this.page.on("dialog", onDialog);
    try {
      const nav = this.page.waitForEvent("framenavigated", { timeout: 10_000 }).catch(() => undefined);
      await this.会員登録フォーム().locator("a#otcBuyOrderApply").click({ timeout: T });
      await nav;
      await this.page.waitForLoadState("load");
      await this.page.waitForTimeout(500);
    } finally {
      this.page.off("dialog", onDialog);
    }
    return { パス: this.パス, 知らせ };
  }

  /** 会員登録フォームの「キャンセル」を押す */
  async 会員登録フォームのキャンセルを押す(): Promise<void> {
    const a = this.会員登録フォーム().locator(".p-hareruya-entry__form-actions a.c-hareruya-btn").filter({ hasText: /キャンセル|Cancel/ }).first();
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/entry/, { timeout: NAV }), a.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
}
