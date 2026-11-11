// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/** F06-22 お問い合わせ（フロント）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-22_test_cases.tsv */
import { Dialog, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
export type 言語 = "ja" | "en";

export class ContactPage {
  constructor(readonly page: Page, readonly 言語: 言語 = "ja") { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  private url(p: string): string { return `${BASE_URL}/${this.言語}${p}`; }

  async 開く(クエリ = ""): Promise<void> {
    await this.page.goto(this.url(`/contact${クエリ}`), { timeout: 60_000 });
    await this.入力画面の準備を待つ();
  }
  /** お問い合わせ画面のアドレスのクエリにイベント詳細IDを指定して開く */
  async イベント詳細を指定して開く(イベント詳細ID: string): Promise<void> { await this.開く(`?eventDetailId=${encodeURIComponent(イベント詳細ID)}`); }
  async トップを開く(): Promise<void> {
    await this.page.goto(this.url("/"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async お問い合わせ画面である(): Promise<boolean> { return (await this.page.locator("#submitButton").count()) > 0; }

  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  get ご利用案内(): Locator { return this.page.locator(".p-hareruya-banner__link").first(); }
  get 戻る(): Locator { return this.page.locator("#submitButton").locator("xpath=following::a[contains(@class,'c-hareruya-btn')][1]"); }

  /** 電話番号の3分割の欄 */
  get 電話番号の3分割欄(): Locator { return this.page.locator('input[name$="[tel][tel01]"], input[name$="[tel][tel02]"], input[name$="[tel][tel03]"]'); }
  /** 電話番号の1欄（英語ページ） */
  get 電話番号の1欄(): Locator { return this.page.locator('input[name$="[telEn]"]'); }
  async 表示されている数(l: Locator): Promise<number> {
    let n = 0;
    for (const e of await l.all()) if (await e.isVisible()) n++;
    return n;
  }
  async 電話番号欄の種類(): Promise<string | null> {
    return this.電話番号の1欄.first().evaluate((e) => (e as HTMLInputElement).type).catch(() => null);
  }

  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }
  async 現在地を押そうとする(): Promise<boolean> {
    const before = this.page.url();
    await this.パンくず現在地.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.パンくず現在地.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
    return this.page.url() !== before;
  }

  // ---- 入力画面の欄（F06-22 の残りのケース。2026-11-10） ----

  /** 入力画面の仕掛け（件名に応じて欄を出し分ける）が動き終わるまで待つ */
  async 入力画面の準備を待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    if ((await this.page.locator("#submitButton").count()) === 0) return;
    await this.page.waitForFunction(() => typeof (window as unknown as { jQuery?: unknown }).jQuery === "function", undefined, { timeout: T }).catch(() => undefined);
    await this.page.waitForTimeout(300);
  }
  欄(name: string): Locator { return this.page.locator(`[name="contact[${name}]"]`).first(); }
  get 件名(): Locator { return this.欄("subject"); }
  get お問い合わせ詳細(): Locator { return this.欄("subSubject"); }
  get 付帯情報(): Locator { return this.欄("attachedInfo"); }
  get 付帯情報の見出し(): Locator { return this.page.locator('[data-js-target="attached-info-label"]').first(); }
  get お問い合わせ店舗(): Locator { return this.欄("shop"); }
  get 姓(): Locator { return this.欄("name][name01"); }
  get 名(): Locator { return this.欄("name][name02"); }
  電話(i: 1 | 2 | 3): Locator { return this.欄(`tel][tel0${i}`); }
  get メール(): Locator { return this.欄("email"); }
  get 内容(): Locator { return this.欄("contents"); }
  get イベント名(): Locator { return this.欄("eventName"); }
  get イベント実施店舗(): Locator { return this.欄("eventShop"); }
  get 開催日(): Locator { return this.欄("eventDate"); }
  get 開始時間(): Locator { return this.欄("eventStartTime"); }
  get キャンセル理由(): Locator { return this.欄("cancelReason"); }
  get その他キャンセル理由(): Locator { return this.欄("otherCancelReason"); }
  get アンケート(): Locator { return this.欄("questionnaire"); }
  /** キャンセル期限の案内の領域 */
  get キャンセル期限の案内(): Locator { return this.page.locator("#event_cancel_policy"); }
  /** 欄の行（表示・非表示を切り替える単位） */
  行(種類: "付帯情報" | "お問い合わせ詳細" | "お問い合わせ店舗" | "内容"): Locator {
    const id = { 付帯情報: "attached_info_row", お問い合わせ詳細: "sub_subject_row", お問い合わせ店舗: "shop_row", 内容: "content_row" }[種類];
    return this.page.locator(`#${id}`);
  }
  /** お問い合わせ詳細の欄の直下のエラー */
  get お問い合わせ詳細のエラー(): Locator { return this.page.locator("#sub_subject_row .c-hareruya-text--error"); }

  /** 選択欄の選択肢（値と表示名）。空の値の選択肢も含む */
  async 選択肢(sel: Locator): Promise<{ 値: string; 表示: string }[]> {
    return sel.locator("option").evaluateAll((os) => os.map((o) => ({ 値: (o as HTMLOptionElement).value, 表示: (o.textContent ?? "").trim() })));
  }
  /** 選択欄の空でない選択肢の表示名 */
  async 選択肢の表示名(sel: Locator): Promise<string[]> { return (await this.選択肢(sel)).filter((o) => o.値 !== "").map((o) => o.表示); }
  async 選択中(sel: Locator): Promise<{ 値: string; 表示: string }> {
    return sel.evaluate((e) => { const s = e as HTMLSelectElement; const o = s.selectedIndex >= 0 ? s.options[s.selectedIndex] : null; return { 値: o?.value ?? "", 表示: (o?.textContent ?? "").trim() }; });
  }
  async 選ぶ(sel: Locator, 表示: string): Promise<void> { await sel.selectOption({ label: 表示 }, { timeout: T }); await this.page.waitForTimeout(200); }
  async 値で選ぶ(sel: Locator, 値: string): Promise<void> { await sel.selectOption(値, { timeout: T }); await this.page.waitForTimeout(200); }
  async 見えるか(l: Locator): Promise<boolean> { return (await l.count()) > 0 && l.first().isVisible(); }
  async 入力できるか(l: Locator): Promise<boolean> { return (await l.count()) > 0 && l.first().isEnabled(); }

  /**
   * 欄に入れる。欄が表示されていない（件名・お問い合わせ詳細で隠れている）・入力できないときは入れずに、その旨の文を返す
   * （手順の注記に残すため）。
   */
  async 入れる(項目: string, l: Locator, 値: string): Promise<string | null> {
    if (!(await this.見えるか(l))) return `「${項目}」の欄が画面に表示されていないので「${値}」を入れられなかった`;
    if (!(await l.isEnabled())) return `「${項目}」の欄が入力できない状態なので「${値}」を入れられなかった`;
    await l.fill(値, { timeout: T });
    return null;
  }
  async 電話番号を入れる(n: [string, string, string]): Promise<string | null> {
    for (const i of [1, 2, 3] as const) { const r = await this.入れる("電話番号", this.電話(i), n[i - 1]); if (r) return r; }
    return null;
  }

  /**
   * 「確認画面へ」を押す。送信を止めるアラートが出たら、その文を読んで閉じる。
   * 戻り値: 画面が移ったか・アラートの文（出なければ null）
   */
  async 確認画面へを押す(): Promise<{ 移った: boolean; アラート: string | null }> {
    let アラート: string | null = null;
    let 出た: () => void = () => undefined;
    const alertShown = new Promise<void>((r) => { 出た = r; });
    const h = (d: Dialog) => { アラート = d.message(); 出た(); void d.accept().catch(() => undefined); };
    this.page.on("dialog", h);
    try {
      const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).then(() => true).catch(() => false);
      await this.page.locator("#submitButton").click({ timeout: T });
      const 移った = await Promise.race([nav, alertShown.then(async () => { await this.page.waitForTimeout(3_000); return false; })]);
      await this.page.waitForLoadState("load");
      return { 移った, アラート };
    } finally {
      this.page.off("dialog", h);
    }
  }
  /** 開発者ツールで行うのと同じに、選択欄の選ばれている選択肢の値を空に書き換える */
  async 選択値を空に書き換える(sel: Locator): Promise<void> {
    await sel.evaluate((e) => { const s = e as HTMLSelectElement; const o = s.options[s.selectedIndex]; if (o) o.value = ""; });
  }

  // ---- 確認画面・完了画面 ----

  async 入力画面か(): Promise<boolean> { return (await this.page.locator("#submitButton").count()) > 0; }
  get 送信ボタン(): Locator { return this.page.locator('#contact-form button[name="mode"][value="complete"]'); }
  get 確認画面の戻る(): Locator { return this.page.locator('#contact-form button[name="mode"][value="back"]'); }
  async 確認画面か(): Promise<boolean> { return (await this.送信ボタン.count()) > 0; }
  /** 確認画面の項目（見出しと表示された値。表示の順） */
  async 確認画面の項目(): Promise<{ 見出し: string; 値: string }[]> {
    return this.page.locator("#contact-form .p-hareruya-form-block").evaluateAll((bs) => bs.map((b) => ({
      見出し: ((b.querySelector(".p-hareruya-form-block__label") as HTMLElement | null)?.innerText ?? "").trim(),
      値: ((b.querySelector(".p-hareruya-form-block__fields") as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim(),
    })));
  }
  async 確認画面の値(見出し: string): Promise<string | null> {
    return (await this.確認画面の項目()).find((r) => r.見出し === 見出し)?.値 ?? null;
  }
  async 送信するを押す(): Promise<void> {
    await this.送信ボタン.scrollIntoViewIfNeeded();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 90_000 }), this.送信ボタン.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async 確認画面の戻るを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.確認画面の戻る.click({ timeout: T })]);
    await this.入力画面の準備を待つ();
  }
  async 完了画面か(): Promise<boolean> { return /\/contact\/complete$/.test(this.path) && (await this.page.locator(".p-hareruya-contact-complete").count()) > 0; }
  get 完了画面のトップへ戻る(): Locator { return this.page.locator(".p-hareruya-contact-complete__actions a").first(); }
  /** 本店の ECTOP（/ja/ または /）か */
  get ECTOPか(): boolean { return /^\/(ja\/?)?$/.test(this.path); }

  // ---- マイページからの遷移（001） ----
  async マイページを開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  get マイページのお問い合わせ(): Locator { return this.page.locator('a.p-hareruya-mypage__menu-link[href$="/contact"]').first(); }
}
