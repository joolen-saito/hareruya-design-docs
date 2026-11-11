/**
 * F08-05 店頭買取査定申込確認（会員登録なし・会員登録つきの申込）の画面操作。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのテンプレートで確かめた。期待値はここから取らない）:
 * - 申込前ログイン画面（/<言語>/otcbuy/<支店URL>/entry）の Language の選択（JP/EN）で、同じ画面の英語表示へ移る。
 *   「アカウントをお持ちでない方はこちら」（英語は「If you don't have an account, click here」）で申込情報入力画面へ。
 * - 申込情報入力画面の「次のページへ進む」（英語は「Next Page」）は、未ログインなら会員登録フォーム、ログイン中なら確認画面へ移る。
 * - 会員登録フォームは「次のページへ進む」（入力ありで確認画面へ）と「会員登録をスキップする」（英語は「Skip Registration」）。
 * - 確認画面の項目は、項目ごとの枠（p-hareruya-entry__<項目>）に値の文として並ぶ。利用規約の枠は、会員登録の入力があると2つになる。
 * - 確認画面の確定ボタンは、会員登録の入力があれば「会員登録して申込み」（英語は「Membership and Assessment」）、
 *   無ければ「査定申込み」（英語は「Apply for Assessment」）。完了画面に「査定番号 …」が出る。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const NAV = 60_000;

export type 申込入力 = {
  /** 申込前ログイン画面の Language（EN なら英語表示で進む） */
  言語: "JP" | "EN";
  国: "日本" | "米国";
  /** 国が日本のときの前半・後半 */
  郵便番号?: [string, string];
  /** 国が日本以外のときの1欄 */
  海外郵便番号?: string;
  /** 国が日本のときに選ぶ都道府県（英語表示は、その都道府県に当たる選択肢） */
  都道府県?: string;
  住所1: string; 住所2: string;
  生年月日: [string, string, string];
  電話: [string, string, string];
  /** 職業の選択肢の名前（英語表示は、それに当たる選択肢） */
  職業: string;
  /** 返却希望サプライの選択肢（日本語の名前で書く。英語表示は当たる選択肢を選ぶ） */
  サプライ: string[];
  サプライその他?: string;
  電話連絡: "必要" | "不必要";
  大会参加: "はい" | "いいえ";
  適格請求書発行事業者: "はい" | "いいえ";
  登録番号?: string;
  利用規約同意: boolean;
};

export type 申込者 = { 姓: string; 名: string; セイ?: string; メイ?: string; 住所3?: string };

/** 確認画面の項目の枠（テンプレートの p-hareruya-entry__<名前>） */
const 枠: Record<string, string> = {
  Language: "language", 国: "country", お名前: "name", "お名前(フリガナ)": "name-kana", 郵便番号: "postcod", 住所: "address",
  生年月日: "birthday", 電話番号: "tel", 職業: "job", 返却希望サプライ: "return-supply", 電話連絡: "phone-contact",
  大会参加中または参加予定: "tournament", 適格請求書発行事業者確認: "invoice", 利用規約について: "terms",
  メールアドレス: "email", "メールアドレス(確認用)": "email-confirm", パスワード: "password", "パスワード(確認用)": "password-confirm",
};
export type 確認の項目 = keyof typeof 枠;

const サプライ英語: Record<string, string> = { スリーブ: "Sleeves", ストレージボックス: "Storage Box" };
const 国の選択肢: Record<申込入力["国"], RegExp> = { 日本: /^(Japan|日本)$/, 米国: /アメリカ合衆国|United States/ };

export const 申込前ログイン画面のURL = (支店URL: string, 言語: "ja" | "en" = "ja") => `${BASE_URL}/${言語}/otcbuy/${支店URL}/entry`;

export class OtcApplyPage {
  constructor(readonly page: Page) {}

  private readonly f = (name: string) => this.page.locator(`[name="otc_buy_order[${name}]"]`);
  private get 英語(): boolean { return /\/en\/otcbuy\//.test(this.page.url()); }

  // ---- 申込前ログイン画面 ----

  /** 申込前ログイン画面を開く（日本語表示） */
  async 申込前ログイン画面を開く(支店URL: string): Promise<void> {
    await this.page.goto(申込前ログイン画面のURL(支店URL), { timeout: NAV });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("form#login_otc_buy"), "申込前ログイン画面のログイン欄").toBeVisible({ timeout: T });
  }

  /** 申込前ログイン画面の Language で EN を選ぶ（画面のスクリプトが英語表示の同じ画面へ移す） */
  async 言語でENを選ぶ(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/en\/otcbuy\/\w+\/entry/, { timeout: NAV }),
      this.page.locator("select#select_lang").selectOption("en", { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 「アカウントをお持ちでない方はこちら」（英語表示は「If you don't have an account, click here」）を押し、申込情報入力画面へ移る */
  async アカウントなしで進む(): Promise<void> {
    const link = this.page.locator("form#login_otc_buy a.c-hareruya-text--link");
    await expect(link, "申込前ログイン画面の、アカウントを持たない人の入口のリンク").toBeVisible({ timeout: T });
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+(\?|$)/, { timeout: NAV }), link.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
    await expect(this.f("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible({ timeout: T });
  }

  /** 申込前ログイン画面の、アカウントを持たない人の入口のリンクの文 */
  async アカウントなしのリンクの文(): Promise<string> {
    return (await this.page.locator("form#login_otc_buy a.c-hareruya-text--link").innerText({ timeout: T })).trim();
  }

  // ---- 申込情報入力画面 ----

  /** 国の選択肢から、日本・米国に当たるものを選ぶ（画面のスクリプトが郵便番号・都道府県の欄を切り替える） */
  async 国を選ぶ(国: 申込入力["国"]): Promise<void> {
    await this.選択肢を選ぶ(this.f("country"), 国の選択肢[国], `国「${国}」`);
    await this.page.waitForTimeout(300);
  }

  /** 国が日本の状態で、都道府県を選ぶ */
  async 都道府県を選ぶ(都道府県: string): Promise<void> {
    await this.選択肢を選ぶ(this.f("pref"), this.都道府県の名前(都道府県), `都道府県「${都道府県}」`);
  }

  private 都道府県の名前(都道府県: string): RegExp {
    return 都道府県 === "東京都" ? /^(東京都|Tokyo)$/i : new RegExp(`^${都道府県}$`);
  }

  private async 選択肢を選ぶ(select: Locator, 名前: RegExp, 何: string): Promise<void> {
    await expect(select, `${何}を選ぶ欄`).toBeVisible({ timeout: T });
    const options = await select.locator("option").evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, text: (o.textContent ?? "").trim() })));
    const hit = options.find((o) => 名前.test(o.text));
    if (!hit) throw new Error(`${何}に当たる選択肢が無い（選択肢: ${options.map((o) => o.text).join(" / ")}）`);
    await select.selectOption(hit.value, { timeout: T });
  }

  /** 職業の選択肢から名前で選ぶ。英語表示で同じ名前が無いときは、英語の名前に当たるものを選ぶ */
  private async 職業を選ぶ(職業: string): Promise<void> {
    const 英語名: Record<string, RegExp> = { 会社員: /company employee|office worker|employee/i };
    const options = await this.f("job").locator("option").evaluateAll((os) => os.map((o) => (o.textContent ?? "").trim()));
    const name = options.includes(職業) ? new RegExp(`^${職業}$`) : (英語名[職業] ?? new RegExp(`^${職業}$`));
    await this.選択肢を選ぶ(this.f("job"), name, `職業「${職業}」`);
  }

  /**
   * 申込情報入力画面に入力する。国は、選ぶ手順が別にあるケースでは選び済み（国を選ぶ=false）。
   * 申込者の姓・名・フリガナ・住所3も入れる（フリガナの欄が無い英語表示では入れない）。
   */
  async 入力する(v: 申込入力, a: 申込者, o: { 国を選ぶ?: boolean; 都道府県を選ぶ?: boolean } = {}): Promise<void> {
    await expect(this.f("lastName"), "申込情報入力画面のお名前（姓）の欄").toBeVisible({ timeout: T });
    if (o.国を選ぶ !== false) await this.国を選ぶ(v.国);
    await this.f("lastName").fill(a.姓, { timeout: T });
    await this.f("firstName").fill(a.名, { timeout: T });
    if (a.セイ !== undefined && (await this.f("lastNameKana").count()) > 0) await this.f("lastNameKana").fill(a.セイ, { timeout: T });
    if (a.メイ !== undefined && (await this.f("firstNameKana").count()) > 0) await this.f("firstNameKana").fill(a.メイ, { timeout: T });
    if (v.国 === "日本" && v.郵便番号) {
      await this.f("postal_code_1").fill(v.郵便番号[0], { timeout: T });
      await this.f("postal_code_2").fill(v.郵便番号[1], { timeout: T });
      // 郵便番号の欄を離れると、画面のスクリプトが住所を自動で入れる（遅れて届き、あとの入力を上書きすることがある）。落ち着いてから残りを入れる
      await this.f("postal_code_2").blur();
      await this.page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
      await this.page.waitForTimeout(1500);
    }
    if (v.国 !== "日本" && v.海外郵便番号 !== undefined) await this.f("zipcode").fill(v.海外郵便番号, { timeout: T });
    if (v.国 === "日本" && v.都道府県 && o.都道府県を選ぶ !== false) await this.都道府県を選ぶ(v.都道府県);
    await this.f("addr01").fill(v.住所1, { timeout: T });
    await this.f("addr02").fill(v.住所2, { timeout: T });
    if (a.住所3 !== undefined) await this.f("addr03").fill(a.住所3, { timeout: T });
    await this.f("birth][year").selectOption(v.生年月日[0], { timeout: T });
    await this.f("birth][month").selectOption(v.生年月日[1], { timeout: T });
    await this.f("birth][day").selectOption(v.生年月日[2], { timeout: T });
    await this.f("tel01").fill(v.電話[0], { timeout: T });
    await this.f("tel02").fill(v.電話[1], { timeout: T });
    await this.f("tel03").fill(v.電話[2], { timeout: T });
    await this.職業を選ぶ(v.職業);
    const 英語 = this.英語;
    for (const s of v.サプライ) {
      await this.page.locator(`input[name="otc_buy_order[return_supply_choice][]"][value="${英語 ? (サプライ英語[s] ?? s) : s}"]`).check({ timeout: T });
    }
    if (v.サプライその他 !== undefined) await this.f("return_supply_text").fill(v.サプライその他, { timeout: T });
    await this.page.locator(`input[name="otc_buy_order[call_flg]"][value="${v.電話連絡 === "必要" ? 1 : 0}"]`).check({ timeout: T });
    await this.page.locator(`input[name="otc_buy_order[playing_flg]"][value="${v.大会参加 === "はい" ? 1 : 0}"]`).check({ timeout: T });
    await this.page.locator(`input[name="otc_buy_order[qualifiedInvoiceIssuerFlg]"][value="${v.適格請求書発行事業者 === "はい" ? 1 : 0}"]`).check({ timeout: T });
    if (v.適格請求書発行事業者 === "はい" && v.登録番号 !== undefined) {
      const code = this.page.locator('[name="otc_buy_qualified_invoice_issuer_account[qualifiedInvoiceIssuerCode]"]');
      await expect(code, "適格請求書発行事業者登録番号の欄が入力できる").toBeEnabled({ timeout: T });
      await code.fill(v.登録番号, { timeout: T });
    }
    if (v.利用規約同意) await this.f("privacy_flg").check({ timeout: T });
    // 自動で入る住所が遅れて届いても入力が壊れていないこと（壊れていれば入れ直す）
    await this.page.waitForTimeout(500);
    for (const [name, value] of [["addr01", v.住所1], ["addr02", v.住所2], ["tel01", v.電話[0]], ["tel02", v.電話[1]], ["tel03", v.電話[2]]] as const) {
      if ((await this.f(name).inputValue({ timeout: T })) !== value) await this.f(name).fill(value, { timeout: T });
    }
  }

  /** 都道府県の選択欄が見えているか */
  async 都道府県の欄が見える(): Promise<boolean> { return this.f("pref").isVisible(); }

  /** 申込情報入力画面の入力値（戻ったときの確かめ）。選択欄・ラジオは選ばれている選択肢の名前 */
  async 入力画面の値(): Promise<Record<string, string>> {
    const sel = async (name: string) => ((await this.f(name).locator("option:checked").first().textContent({ timeout: T })) ?? "").trim();
    const radio = async (name: string) => {
      const c = this.page.locator(`input[name="otc_buy_order[${name}]"]:checked`).first();
      if ((await c.count()) === 0) return "";
      const id = await c.getAttribute("id");
      return ((await this.page.locator(`label[for="${id}"]`).first().textContent()) ?? "").trim();
    };
    return {
      国: await sel("country"), 姓: await this.f("lastName").inputValue({ timeout: T }), 名: await this.f("firstName").inputValue({ timeout: T }),
      住所1: await this.f("addr01").inputValue({ timeout: T }), 住所2: await this.f("addr02").inputValue({ timeout: T }), 住所3: await this.f("addr03").inputValue({ timeout: T }),
      職業: await sel("job"), 電話連絡: await radio("call_flg"),
    };
  }

  /** 申込情報入力画面の「次のページへ進む」を押す。移った先の画面のパスを返す（未ログインは会員登録フォーム、ログイン中は確認画面） */
  async 次のページへ進む(): Promise<string> {
    const btn = this.page.locator("form#otc_buy_order_form button#otcBuyOrderApply");
    await expect(btn, "申込情報入力画面の「次のページへ進む」").toBeVisible({ timeout: T });
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/(register_customer|confirm)/, { timeout: NAV }), btn.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
    return new URL(this.page.url()).pathname;
  }

  // ---- 会員登録フォーム ----

  readonly 会員登録フォーム = () => this.page.locator("form#otc_buy_register_customer_form");

  /** 会員登録フォームにメールアドレス・パスワード（確認用も）を入れ、利用規約同意にチェックを付けて「次のページへ進む」を押し、確認画面へ移る */
  async 会員登録の入力をして進む(メール: string, パスワード: string): Promise<void> {
    await expect(this.会員登録フォーム(), "会員登録フォーム").toBeVisible({ timeout: T });
    await this.page.locator("#otc_buy_order_email_first").fill(メール, { timeout: T });
    await this.page.locator("#otc_buy_order_email_second").fill(メール, { timeout: T });
    await this.page.locator("#otc_buy_order_password_first").fill(パスワード, { timeout: T });
    await this.page.locator("#otc_buy_order_password_second").fill(パスワード, { timeout: T });
    await this.page.locator("#otc_buy_order_entry_privacy_flg").check({ timeout: T });
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/confirm/, { timeout: NAV }), this.page.locator("button#submitButton").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  /**
   * 会員登録の入力をして「次のページへ進む」を押し、確認画面を返した応答の本文を返す（開発者ツールで応答の内容を開く代わり）。
   */
  async 会員登録の入力をして進み応答を読む(メール: string, パスワード: string): Promise<string> {
    const res: Promise<Response> = this.page.waitForResponse((r) => /\/otcbuy\/\w+\/confirm/.test(r.url()) && r.request().method() === "POST", { timeout: NAV });
    await this.会員登録の入力をして進む(メール, パスワード);
    return (await res).text();
  }

  /** 会員登録フォームの「会員登録をスキップする」（英語表示は「Skip Registration」）を押し、確認画面へ移る */
  async 会員登録をスキップする(): Promise<void> {
    await expect(this.会員登録フォーム(), "会員登録フォーム").toBeVisible({ timeout: T });
    const skip = this.page.locator("form#otc_buy_register_customer_form a#otcBuyOrderApply");
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+\/confirm/, { timeout: NAV }), skip.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 確認画面 ----

  /** 確認画面の項目の枠（同じ項目の枠が複数あれば全部） */
  確認の枠(項目: 確認の項目): Locator {
    return this.page.locator(`.p-hareruya-entry--confirm .p-hareruya-entry__${枠[項目]}`);
  }

  /** 確認画面の項目の値の文（改行は「／」でつなぐ）。枠が無ければ null */
  async 確認の値(項目: 確認の項目): Promise<string | null> {
    const b = this.確認の枠(項目).first();
    if ((await b.count()) === 0) return null;
    const t = await b.locator(".p-hareruya-form-block__fields").innerText({ timeout: T });
    return t.split("\n").map((s) => s.trim()).filter(Boolean).join("／");
  }

  /** 確認画面の項目の見出し（同じ項目の枠が複数あれば全部） */
  async 確認の見出し(項目: 確認の項目): Promise<string[]> {
    return (await this.確認の枠(項目).locator(".p-hareruya-form-block__label").allInnerTexts()).map((t) => t.replace(/\s+/g, "").trim());
  }

  /** 確認画面であること（確定ボタンが見える） */
  async 確認画面を待つ(): Promise<void> {
    await expect(this.page, "店頭買取査定申込確認画面のURL").toHaveURL(/\/otcbuy\/\w+\/confirm/, { timeout: T });
    await expect(this.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible({ timeout: T });
  }

  /** 確認画面の確定のボタン（「査定申込み」または「会員登録して申込み」） */
  readonly 確定ボタン = () => this.page.locator("form#otc_buy_order_form button#otcBuyOrderApply");

  async 確定ボタンの名前(): Promise<string> { return (await this.確定ボタン().innerText({ timeout: T })).replace(/\s+/g, " ").trim(); }

  /** 確認画面の確定のボタンを押し、完了画面へ移るのを待つ。移らなければ、いまのパスを返す */
  async 確定する(): Promise<{ 完了画面: boolean; パス: string }> {
    await expect(this.確定ボタン(), "店頭買取査定申込確認画面の確定のボタン").toBeVisible({ timeout: T });
    await Promise.all([
      this.page.waitForURL(/\/otcbuy\/\w+\/(complete|entry)/, { timeout: NAV }).catch(() => undefined),
      this.確定ボタン().click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    const path = new URL(this.page.url()).pathname;
    return { 完了画面: /\/complete$/.test(path), パス: path };
  }

  /** 確認画面の「戻る」を押し、申込情報入力画面へ移る */
  async 戻る(): Promise<void> {
    const back = this.page.locator("form#otc_buy_order_form button[type=submit]:not(#otcBuyOrderApply)");
    await Promise.all([this.page.waitForURL(/\/otcbuy\/\w+(\?|$)/, { timeout: NAV }), back.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  /** 確認画面の表示の文（入力時間の表示などを探す） */
  async 画面の文(): Promise<string> { return this.page.locator("body").innerText({ timeout: T }); }

  /** 確認画面の、お名前などの枠の中にある、入力できる欄（隠し項目でない入力欄・選択欄・文の欄）の数 */
  async 入力できる欄の数(項目: 確認の項目): Promise<number> {
    return this.確認の枠(項目).locator('input:not([type="hidden"]), select, textarea, [contenteditable="true"]').count();
  }

  /** 項目の値の文を押して、キーボードで文字を打つ（値を変えられるかの確かめ） */
  async 値を押して打つ(項目: 確認の項目, 文字: string): Promise<void> {
    await this.確認の枠(項目).first().locator(".p-hareruya-form-block__fields p").first().click({ timeout: T });
    await this.page.keyboard.type(文字);
  }

  // ---- 完了画面 ----

  readonly 完了の表示 = () => this.page.locator(".p-hareruya-satei-complete");

  /** 完了画面の査定番号の欄の値（「査定番号 」に続く値）。欄が無ければ null */
  async 査定番号(): Promise<string | null> {
    const el = this.page.locator(".p-hareruya-satei-complete__customer .c-hareruya-heading--lev1").first();
    if ((await el.count()) === 0) return null;
    const m = /査定番号\s*(\S*)/.exec((await el.innerText({ timeout: T })).replace(/\s+/g, " "));
    return m ? m[1] : null;
  }
}
