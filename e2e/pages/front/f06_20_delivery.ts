/**
 * F06-20 マイページの配送先（一覧・新規登録/変更・確認・削除）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-20_test_cases.tsv
 * 既存の pages/front/f04_mypage_delivery.ts（F04-03 のシードが使う登録の部品）は変えず、会社名・住所3・一覧の読み取りなどはこちらに持つ。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const NAV = 60_000;

export type 配送先の入力 = {
  配送先名称: string;
  姓?: string; 名?: string; セイ?: string; メイ?: string;
  国?: string;
  郵便番号?: string; 海外郵便番号?: string;
  都道府県?: string;
  住所1?: string; 住所2?: string; 住所3?: string;
  電話?: string;
  会社名?: string;
};

/** 配送先の入力の既定（シード表の「そのほかの必須項目には入力チェックを通る任意の値」） */
export const 既定の入力 = { 姓: "山田", 名: "花子", セイ: "ヤマダ", メイ: "ハナコ", 郵便番号: "101-0021", 都道府県: "東京都", 住所1: "千代田区外神田", 住所2: "1-1", 電話: "03-1234-5678" };

export type 一覧の配送先 = { 配送先ID: string; 名称: string; 氏名: string; 郵便番号: string; 住所: string; 電話: string; 会社: string };

export class DeliveryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  private url(p: string, 言語 = "ja"): string { return `${BASE_URL}/${言語}${p}`; }
  private async 開く(p: string, 言語 = "ja"): Promise<number | null> {
    const r = await this.page.goto(this.url(p, 言語), { timeout: NAV });
    await this.page.waitForLoadState("load");
    return r ? r.status() : null;
  }

  // ---- 開く ----
  async 一覧を開く(言語 = "ja"): Promise<void> { await this.開く("/mypage/delivery", 言語); }
  async 新規入力を開く(言語 = "ja"): Promise<void> { await this.開く("/mypage/delivery/new/edit", 言語); }
  async 編集を開く(配送先ID: string, 言語 = "ja"): Promise<number | null> { return this.開く(`/mypage/delivery/${配送先ID}/edit`, 言語); }
  /** 画面のアドレスを開き、応答のステータスを返す（404 の確認用） */
  async アドレスを開く(p: string): Promise<number | null> { return this.開く(p); }

  // ---- 画面の判別 ----
  get 一覧の画面か(): Promise<boolean> { return this.page.locator(".p-hareruya-delivery-list").count().then((n) => n > 0); }
  get 入力の画面か(): Promise<boolean> { return this.page.locator("form#customer_address_form").count().then((n) => n > 0); }
  get 確認の画面か(): Promise<boolean> { return this.page.getByRole("button", { name: "登録する" }).count().then((n) => n > 0); }
  get 会員ログイン画面か(): Promise<boolean> { return this.page.locator("form#login_mypage").count().then((n) => n > 0); }

  // ---- 一覧 ----
  get 新しい住所を追加(): Locator { return this.page.locator('.p-hareruya-delivery-list__new-address a[href$="/mypage/delivery/new/edit"]'); }
  /** 一覧の上部のエラー枠（登録上限） */
  get 上限のエラー枠(): Locator { return this.page.locator(".p-hareruya-delivery-list__new-address .ec-errorMessage, .p-hareruya-delivery-list__flash"); }
  get マイページのボタン(): Locator { return this.page.locator(".p-hareruya-delivery-list__btn a").first(); }
  get 一覧の既定の枠(): Locator { return this.page.locator(".p-hareruya-shipping-address__item").first(); }
  get 一覧の画面上部の文(): Promise<string> { return this.page.locator(".p-hareruya-delivery-list").first().innerText().then((t) => t.replace(/\s+/g, " ").trim()); }

  /** 会員情報住所の枠を除いた、登録配送先の枠 */
  private get 配送先の枠(): Locator { return this.page.locator(".p-hareruya-shipping-address__item").filter({ has: this.page.locator('a[href$="/edit"]') }); }
  async 一覧の配送先(): Promise<一覧の配送先[]> {
    const items = this.配送先の枠;
    const n = await items.count();
    const out: 一覧の配送先[] = [];
    const txt = async (it: Locator, cls: string) => ((await it.locator(`.p-hareruya-shipping-address__${cls}`).first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    for (let i = 0; i < n; i++) {
      const it = items.nth(i);
      const href = (await it.locator('a[href$="/edit"]').first().getAttribute("href")) ?? "";
      out.push({
        配送先ID: /\/mypage\/delivery\/(\d+)\/edit/.exec(href)?.[1] ?? "",
        名称: await txt(it, "title"), 氏名: await txt(it, "name"), 郵便番号: await txt(it, "postal"), 住所: await txt(it, "street"), 電話: await txt(it, "tel"), 会社: await txt(it, "company"),
      });
    }
    return out;
  }
  async 配送先IDを名称から(名称: string): Promise<string> {
    const hit = (await this.一覧の配送先()).filter((x) => x.名称 === 名称);
    if (hit.length !== 1) throw new Error(`配送先一覧に配送先名称「${名称}」の枠が ${hit.length} 件ある（1件のはず）`);
    return hit[0].配送先ID;
  }
  枠(名称: string): Locator { return this.配送先の枠.filter({ has: this.page.locator(".p-hareruya-shipping-address__title", { hasText: new RegExp(`^\\s*${名称.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) }); }
  編集ボタン(名称: string): Locator { return this.枠(名称).locator('a[href$="/edit"]'); }
  削除ボタン(名称: string): Locator { return this.枠(名称).locator('a[data-method="delete"]'); }
  /** 既定の枠（会員情報住所）の中身 */
  async 会員情報住所の枠(): Promise<{ 名称: string; 氏名: string; 郵便番号: string; 住所: string; 電話: string; 会社: string }> {
    const it = this.一覧の既定の枠;
    const txt = async (cls: string) => ((await it.locator(`.p-hareruya-shipping-address__${cls}`).first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    return { 名称: await txt("title"), 氏名: await txt("name"), 郵便番号: await txt("postal"), 住所: await txt("street"), 電話: await txt("tel"), 会社: await txt("company") };
  }

  // ---- パンくず ----
  get パンくずのホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link[aria-label='ホーム']").first(); }
  get パンくずの現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 押して遷移する(l: Locator): Promise<void> {
    await expect(l, "押す対象").toBeVisible({ timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: NAV }), l.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  /** 押しても遷移しないもの（現在地）を押し、遷移したかを返す */
  async 現在地を押す(): Promise<boolean> {
    const before = this.page.url();
    const l = this.パンくずの現在地;
    await expect(l, "パンくずリストの現在表示中ページ").toBeVisible({ timeout: T });
    await l.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(1500);
    await this.page.waitForLoadState("load");
    return this.page.url() !== before;
  }

  // ---- 入力画面 ----
  field(name: string): Locator { return this.page.locator(`#customer_address_form [name="customer_address[${name}]"]`); }
  get 国(): Locator { return this.field("country"); }
  get 配送先名称欄(): Locator { return this.field("address_name"); }
  get 姓欄(): Locator { return this.field("name][name01"); }
  get 名欄(): Locator { return this.field("name][name02"); }
  get セイ欄(): Locator { return this.field("kana][kana01"); }
  get メイ欄(): Locator { return this.field("kana][kana02"); }
  get 郵便番号3桁(): Locator { return this.field("postalCode][postalCode01"); }
  get 郵便番号4桁(): Locator { return this.field("postalCode][postalCode02"); }
  get 海外郵便番号(): Locator { return this.field("abroadPostalCode"); }
  get 都道府県(): Locator { return this.field("address][pref"); }
  get 住所1欄(): Locator { return this.field("address][addr01"); }
  get 住所2欄(): Locator { return this.field("address][addr02"); }
  get 住所3欄(): Locator { return this.field("address][addr03"); }
  get 電話1(): Locator { return this.field("tel][tel01"); }
  get 電話2(): Locator { return this.field("tel][tel02"); }
  get 電話3(): Locator { return this.field("tel][tel03"); }
  get 会社名欄(): Locator { return this.field("company_name"); }
  get 確認画面へ(): Locator { return this.page.locator("#customer_address_form #submit_button"); }
  get 戻る(): Locator { return this.page.locator("#customer_address_form .p-hareruya-entry__form-actions a"); }
  /** 入力画面で表示されている項目の見出し（ラベルの文） */
  async 見えている見出し(): Promise<string[]> {
    return (await this.page.locator("#customer_address_form label:not(.u-hareruya-dsp-visually-hidden), #customer_address_form legend .p-hareruya-form-block__label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  async 見えている(l: Locator): Promise<boolean> { return (await l.count()) > 0 && (await l.first().isVisible()); }
  async 選択中の国(): Promise<string> { return ((await this.国.locator("option:checked").first().innerText().catch(() => "")) ?? "").trim(); }

  /** 国を選ぶ（選ぶと画面が作り直される）。画面が作り直されるのを待つ */
  async 国を選ぶ(国: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => undefined),
      this.国.selectOption({ label: 国 }, { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 入力する（国が日本以外なら、先に国を選ぶ。値の無い項目は入れない） */
  async 入力する(v: Partial<配送先の入力>): Promise<void> {
    const 国 = v.国 ?? "Japan";
    if (v.国 !== undefined && 国 !== (await this.選択中の国())) await this.国を選ぶ(国);
    if (v.配送先名称 !== undefined) await this.配送先名称欄.fill(v.配送先名称, { timeout: T });
    if (v.姓 !== undefined) await this.姓欄.fill(v.姓, { timeout: T });
    if (v.名 !== undefined) await this.名欄.fill(v.名, { timeout: T });
    if (v.セイ !== undefined && (await this.セイ欄.count()) > 0) await this.セイ欄.fill(v.セイ, { timeout: T });
    if (v.メイ !== undefined && (await this.メイ欄.count()) > 0) await this.メイ欄.fill(v.メイ, { timeout: T });
    if (国 === "Japan") {
      if (v.郵便番号 !== undefined) {
        const zip = v.郵便番号.replace(/\D/g, "");
        await this.郵便番号3桁.fill(zip.slice(0, 3), { timeout: T });
        await this.郵便番号4桁.fill(zip.slice(3), { timeout: T });
      }
      if (v.都道府県 !== undefined) await this.都道府県.selectOption({ label: v.都道府県 }, { timeout: T });
    } else if (v.海外郵便番号 !== undefined) {
      await this.海外郵便番号.fill(v.海外郵便番号, { timeout: T });
    }
    if (v.住所1 !== undefined) await this.住所1欄.fill(v.住所1, { timeout: T });
    if (v.住所2 !== undefined) await this.住所2欄.fill(v.住所2, { timeout: T });
    if (v.住所3 !== undefined && (await this.住所3欄.count()) > 0) await this.住所3欄.fill(v.住所3, { timeout: T });
    if (v.電話 !== undefined) {
      const parts = v.電話.includes("-") ? v.電話.split("-") : [v.電話.slice(0, 2), v.電話.slice(2, 6), v.電話.slice(6)];
      await this.電話1.fill(parts[0], { timeout: T });
      await this.電話2.fill(parts[1], { timeout: T });
      await this.電話3.fill(parts[2], { timeout: T });
    }
    if (v.会社名 !== undefined) await this.会社名欄.fill(v.会社名, { timeout: T });
  }

  /** 「確認画面へ」を押す。ブラウザの入力チェックが止めたら sent=false */
  async 確認画面へ進む(): Promise<{ sent: boolean; 入力エラー: string[] }> {
    const p = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20_000 }).then(() => true).catch(() => false);
    await this.確認画面へ.click({ timeout: T });
    const sent = await p;
    await this.page.waitForLoadState("load");
    const errs = (await this.page.locator(".c-hareruya-form-input__field-error, .ec-errorMessage, .invalid-feedback").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { sent, 入力エラー: errs };
  }
  get 登録する(): Locator { return this.page.getByRole("button", { name: "登録する" }); }
  async 登録するを押す(): Promise<void> {
    await expect(this.登録する, "確認画面の「登録する」").toBeVisible({ timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: NAV }), this.登録する.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  /** シード用: 一覧 →「新しい住所を追加」→ 入力 → 確認画面へ → 登録する。登録後は一覧に戻る */
  async 登録する流れ(v: 配送先の入力, what: string): Promise<void> {
    await this.一覧を開く();
    await expect(this.新しい住所を追加, `${what}: 配送先一覧の「新しい住所を追加」`).toBeVisible({ timeout: T });
    await this.押して遷移する(this.新しい住所を追加);
    await this.入力する({ ...既定の入力, ...v });
    const r = await this.確認画面へ進む();
    if (!r.sent || !(await this.確認の画面か)) throw new Error(`${what}: 配送先の入力が確認画面へ進まない（${this.page.url()}）: ${r.入力エラー.join(" / ") || "入力エラーの表示なし"}`);
    await this.登録するを押す();
    if (!/\/mypage\/delivery\/?$/.test(this.path)) throw new Error(`${what}: 登録後に配送先一覧へ戻らない（${this.page.url()}）`);
  }

  // ---- 削除 ----
  /** 削除ボタンを押し、確認ダイアログに答える（OK=true）。ダイアログの文を返す */
  async 削除を押す(名称: string, OK: boolean): Promise<string> {
    let 文 = "";
    this.page.once("dialog", (d) => { 文 = d.message(); void (OK ? d.accept() : d.dismiss()); });
    const l = this.削除ボタン(名称);
    await expect(l, `配送先名称「${名称}」の削除ボタン`).toBeVisible({ timeout: T });
    if (OK) {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: NAV }).catch(() => undefined), l.click({ timeout: T })]);
      await this.page.waitForLoadState("load");
    } else {
      await l.click({ timeout: T });
      await this.page.waitForTimeout(1500);
    }
    return 文;
  }
  /**
   * 削除ボタンを押して確認ダイアログを開いたままにする（ダイアログが開いているあいだも、要求の書き換えなど Playwright 側の操作はできる）。
   * 答える(OK) でダイアログに答え、削除要求が済むのを待つ。ダイアログの文は 文() で読む。
   */
  async 削除を押して確認を保留する(名称: string): Promise<{ 文: () => string; 答える: (OK: boolean) => Promise<void> }> {
    let 文 = "";
    let 答え!: (ok: boolean) => void;
    const 答え待ち = new Promise<boolean>((r) => { 答え = r; });
    const 開いた = new Promise<void>((res) => {
      this.page.once("dialog", (d) => { 文 = d.message(); res(); void 答え待ち.then((ok) => (ok ? d.accept() : d.dismiss())); });
    });
    const l = this.削除ボタン(名称);
    await expect(l, `配送先名称「${名称}」の削除ボタン`).toBeVisible({ timeout: T });
    const click = l.click({ timeout: NAV }).catch(() => undefined);
    await 開いた;
    return {
      文: () => 文,
      答える: async (OK: boolean) => { 答え(OK); await click; await this.page.waitForTimeout(2000); await this.page.waitForLoadState("load"); },
    };
  }
  /** 削除要求（POSTの本文）のなりすまし対策の値を、送信の直前に書き換える（開発者ツールでの書き換えに当たる）。undefined なら値を除く */
  async 削除要求の照合値を書き換える(値: string | undefined): Promise<void> {
    await this.page.route(/\/mypage\/delivery\/\d+\/delete/, async (route) => {
      const req = route.request();
      const body = new URLSearchParams(req.postData() ?? "");
      body.delete("_token");
      if (値 !== undefined) body.set("_token", 値);
      await route.continue({ postData: body.toString() });
    });
  }
  async 削除要求の照合をやめる(): Promise<void> { await this.page.unroute(/\/mypage\/delivery\/\d+\/delete/); }

  /** 一覧から読んだ削除用のなりすまし対策の値（先頭の削除ボタン） */
  async 削除用の照合値(): Promise<string> {
    const v = await this.page.locator('a[data-method="delete"]').first().getAttribute("data-csrf-token");
    if (!v) throw new Error("一覧に削除ボタンの照合値が無い");
    return v;
  }
  /** 削除要求を直接送る（識別子はパスで指定。空なら識別子なし）。応答のステータス */
  async 削除要求を送る(識別子: string, 照合値: string): Promise<number> {
    const r = await this.page.request.post(`${BASE_URL}/ja/mypage/delivery/${識別子}/delete`, { form: { _method: "DELETE", _token: 照合値 }, maxRedirects: 0, timeout: NAV });
    return r.status();
  }

  /** 入力画面の「確認画面へ」と同じ要求（配送先の識別子つき）を直接送る。応答のステータス */
  async 確認画面を開く要求を送る(識別子: string): Promise<number> {
    const token = (await this.field("_token").inputValue());
    const form: Record<string, string> = {
      "customer_address[_token]": token, "customer_address[is_country_change]": "0", "customer_address[address_name]": "要求確認",
      "customer_address[name][name01]": "山田", "customer_address[name][name02]": "花子", "customer_address[kana][kana01]": "ヤマダ", "customer_address[kana][kana02]": "ハナコ",
      "customer_address[country]": await this.国.inputValue(), "customer_address[postalCode][postalCode01]": "101", "customer_address[postalCode][postalCode02]": "0021",
      "customer_address[address][pref]": await this.都道府県.inputValue(), "customer_address[address][addr01]": "千代田区外神田", "customer_address[address][addr02]": "1-1",
      "customer_address[tel][tel01]": "03", "customer_address[tel][tel02]": "1234", "customer_address[tel][tel03]": "5678", "customer_address[company_name]": "",
    };
    const r = await this.page.request.post(`${BASE_URL}/ja/mypage/delivery/${識別子}/edit`, { form, maxRedirects: 0, timeout: NAV });
    return r.status();
  }
}
