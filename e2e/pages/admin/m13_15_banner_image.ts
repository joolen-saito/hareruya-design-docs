/**
 * M13-15 画像設定（メニュー「イベント管理」の画像の保管とバナー設定。画面の見出しは「イベントバナー管理」）
 *
 * 画面の作り（アプリのテンプレート・コントローラから）:
 * - 上半分がバナー設定（識別番号ごとの画像URL・リンク先URL・表示店舗・言語・表示タイプ・画像alt属性・並び順と「バナー設定」ボタン）、
 *   下半分（#upload_wrap）が画像のアップロード欄（店舗・ファイル・「アップロード」）と、選択店舗の切り替え、画像の一覧。
 * - 選択店舗は、ボタンを押して開く一覧（ドロップダウン）のリンク。押すと店舗の識別子で絞った画面へ移る。絞っていないときの表示は「全て」。
 * - 一覧の1行は、上段に画像、下段に画像のURL、更新日付、「画像URLコピー」、削除のリンク。削除はブラウザの確認ダイアログで「OK」を押すと送られる。
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";

export type アップロードの結果 = { 送った: boolean; 成功: string[]; エラー: string[]; 行き先: string };

export class BannerImagePage {
  constructor(readonly page: Page) {}

  get アップロード欄(): Locator { return this.page.locator("#upload_wrap"); }
  get アップロード欄の店舗(): Locator { return this.page.locator('select[name="event_banner_upload[baseInfos]"]'); }
  get ファイル欄(): Locator { return this.page.locator('input[type=file][name="event_banner_upload[file]"]'); }
  get アップロードボタン(): Locator { return this.アップロード欄.getByRole("button", { name: "アップロード", exact: true }); }
  get 選択店舗ボタン(): Locator { return this.アップロード欄.locator("button.dropdown-toggle"); }
  get 画像の行(): Locator { return this.アップロード欄.locator("table.table-striped tbody tr"); }

  /** 画像設定画面を、アドレスで開く */
  async 開く(): Promise<void> {
    const res = await this.page.goto(adminUrl("/event/banner"));
    if (!res || !res.ok()) throw new Error(`画像設定画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.読み込みを待つ();
  }

  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.アップロードボタン, "画像設定画面のアップロード欄").toBeVisible({ timeout: 30_000 });
  }

  /** 左のメニュー「イベント管理」を展開する（閉じていれば押す） */
  async イベント管理メニューを展開する(): Promise<void> {
    const sub = this.page.locator("#nav-event");
    if (!(await sub.isVisible())) await this.page.locator('a[href="#nav-event"]').click();
    await expect(sub, "左のメニュー「イベント管理」の下の項目").toBeVisible();
  }

  /** 展開した「イベント管理」の下に並ぶ項目の表示名 */
  async イベント管理メニューの項目(): Promise<string[]> {
    return (await this.page.locator("#nav-event a").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /** 「イベント管理」の下の、表示名がちょうど 名前 の項目 */
  メニューの項目(名前: string): Locator {
    return this.page.locator("#nav-event").getByRole("link", { name: 名前, exact: true });
  }

  /** 「イベント管理」の下で、画像設定画面（このページ）を開く項目（表示名は問わない） */
  get 画像設定画面へのメニュー(): Locator {
    return this.page.locator('#nav-event a[href$="/event/banner"]');
  }

  async メニューを押す(項目: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), 項目.click()]);
  }

  /** いまの画面が画像設定画面か（アドレスとアップロード欄で見る） */
  async 画像設定画面か(): Promise<boolean> {
    if (!/\/event\/banner(\/[A-Za-z0-9_-]+)?(#.*)?$/.test(new URL(this.page.url()).pathname)) return false;
    return this.アップロードボタン.isVisible();
  }

  async 見出し(): Promise<string> {
    return ((await this.page.locator(".c-pageTitle__title, .c-pageTitle h2").first().textContent()) ?? "").trim();
  }

  // ---- アップロード欄 ----

  async アップロード欄の店舗の選択肢(): Promise<string[]> {
    return (await this.アップロード欄の店舗.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
  async アップロード欄の店舗の値(): Promise<string> {
    return ((await this.アップロード欄の店舗.locator("option:checked").allInnerTexts()).join("")).trim();
  }

  async アップロード欄の店舗を選ぶ(店名: string): Promise<void> { await chooseByLabel(this.アップロード欄の店舗, 店名); }
  async ファイルを選ぶ(file: string): Promise<void> { await this.ファイル欄.setInputFiles(file); }

  /** 「アップロード」を押し、移った先の画面の成功・エラーの表示を読む */
  async アップロードを押す(): Promise<アップロードの結果> {
    let 送った = false;
    const onReq = (r: import("@playwright/test").Request) => { if (r.method() === "POST" && /\/event\/banner(\/[^/]+)?\/image\/upload/.test(r.url())) 送った = true; };
    this.page.on("request", onReq);
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined),
        this.アップロードボタン.click(),
      ]);
    } finally {
      this.page.off("request", onReq);
    }
    await expect(this.アップロードボタン, "アップロードのあとの画像設定画面").toBeVisible({ timeout: 30_000 });
    const 文 = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return {
      送った,
      成功: await 文(this.page.locator(".alert-success")),
      エラー: await 文(this.page.locator(".alert-danger, .invalid-feedback, .form-error-message, #upload_wrap .errormsg")),
      行き先: this.page.url(),
    };
  }

  /** アップロード欄の店舗を選び、ファイルを選んで「アップロード」を押す */
  async アップロードする(店名: string, file: string): Promise<アップロードの結果> {
    await this.アップロード欄の店舗を選ぶ(店名);
    await this.ファイルを選ぶ(file);
    return this.アップロードを押す();
  }

  // ---- 選択店舗と画像の一覧 ----

  async 選択店舗の表示(): Promise<string> {
    return ((await this.選択店舗ボタン.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /** 選択店舗の一覧（ドロップダウン）を開き、表示名がちょうど 名前 のリンクを押す。すでにその表示なら何もしない */
  async 選択店舗を選ぶ(名前: string): Promise<void> {
    if ((await this.選択店舗の表示()) === 名前) return;
    await this.選択店舗ボタン.click();
    const item = this.アップロード欄.locator("ul.dropdown-menu a.dropdown-item").filter({ hasText: new RegExp(`^\\s*${名前.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
    if ((await item.count()) === 0) {
      const have = (await this.アップロード欄.locator("ul.dropdown-menu a.dropdown-item").allInnerTexts()).map((t) => t.trim());
      throw new Error(`選択店舗に「${名前}」が無い（ある選択肢: ${have.join("、")}。いまの表示: ${await this.選択店舗の表示()}）`);
    }
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), item.first().click()]);
    await this.読み込みを待つ();
  }

  /** 一覧の各行の下段に表示された画像のURL（上から順） */
  async 画像のURL(): Promise<string[]> {
    return (await this.画像の行.locator("td:first-child div.small").allInnerTexts()).map((t) => t.trim());
  }

  /** 下段のURLがちょうど url の行 */
  行(url: string): Locator {
    return this.画像の行.filter({ has: this.page.locator("div.small", { hasText: new RegExp(`^\\s*${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
  }

  削除リンク(行: Locator): Locator { return 行.getByRole("link", { name: "削除", exact: true }); }
  画像URLコピー(行: Locator): Locator { return 行.getByRole("button", { name: "画像URLコピー", exact: true }); }

  /** 行の上段の画像（img）のアドレス */
  async 行の画像のアドレス(行: Locator): Promise<string> { return (await 行.locator("td").first().locator("img").getAttribute("src")) ?? ""; }

  /**
   * 行の「削除」を押し、確認ダイアログで OK かキャンセルを押す。ダイアログの文を返す（出なければ null）。
   * OK のときは削除の送信のあとの画面の読み込みを待つ。
   */
  async 削除を押す(行: Locator, 答え: "OK" | "キャンセル"): Promise<string | null> {
    let message: string | null = null;
    const onDialog = async (d: import("@playwright/test").Dialog) => {
      message = d.message();
      if (答え === "OK") await d.accept(); else await d.dismiss();
    };
    this.page.once("dialog", onDialog);
    if (答え === "OK") {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.削除リンク(行).click()]);
      await this.読み込みを待つ();
    } else {
      await this.削除リンク(行).click();
      await this.page.waitForTimeout(1_000);
    }
    this.page.off("dialog", onDialog);
    return message;
  }

  /** 選択店舗で 店名 を選び、一覧の画像を上から順に削除（確認ダイアログで OK）して、0件にする */
  async 店舗の画像を消す(店名: string): Promise<number> {
    await this.選択店舗を選ぶ(店名);
    let n = 0;
    for (;;) {
      const urls = await this.画像のURL();
      if (urls.length === 0) return n;
      if (n > 500) throw new Error(`「${店名}」の画像を500件消しても0件にならない`);
      const row = this.画像の行.first();
      if ((await this.削除リンク(row).count()) === 0) throw new Error(`「${店名}」の画像「${urls[0]}」の行に削除のリンクが無い（編集権限が無い店舗の画像か）`);
      const msg = await this.削除を押す(row, "OK");
      if (msg === null) throw new Error(`「${urls[0]}」の削除で確認ダイアログが出ない`);
      if (await this.行(urls[0]).count()) throw new Error(`「${urls[0]}」を削除したが一覧に残っている`);
      n++;
    }
  }

  /**
   * 行の「画像URLコピー」を押し、写された文字を返す。
   * 画面は安全な接続（localhost を含む）ならクリップボードへ写し、そうでなければ文字の入った入力ダイアログを出す。両方を受ける。
   */
  async 画像URLをコピーする(行: Locator): Promise<{ 写した文字: string; 方法: string }> {
    let prompt: string | null = null;
    const onDialog = async (d: import("@playwright/test").Dialog) => { prompt = d.defaultValue() || d.message(); await d.dismiss(); };
    // クリップボードを読むための許可（利用者のブラウザで「許可」を押すのにあたる）
    await this.page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(this.page.url()).origin });
    this.page.once("dialog", onDialog);
    await this.page.evaluate(() => navigator.clipboard?.writeText("").catch(() => undefined)).catch(() => undefined);
    await this.画像URLコピー(行).click();
    await this.page.waitForTimeout(500);
    this.page.off("dialog", onDialog);
    if (prompt !== null) return { 写した文字: prompt, 方法: "入力ダイアログ" };
    const text = await this.page.evaluate(() => navigator.clipboard.readText());
    return { 写した文字: text, 方法: "クリップボード" };
  }

  // ---- バナー設定（画面上部） ----

  バナー設定の欄(項目: "image_url" | "link" | "base_info" | "disp_type" | "image_alt" | "sort_no", 番号: number): Locator {
    const name = `event_banner[${項目}_${番号}]`;
    return this.page.locator(`[name="${name}"], [name="${name}[]"]`).first();
  }

  /** バナー設定の識別番号の数（画像URLの欄の数） */
  async バナー設定の数(): Promise<number> {
    return this.page.locator('input[name^="event_banner[image_url_"]').count();
  }

  async バナー設定の画像URL(番号: number): Promise<string> { return this.バナー設定の欄("image_url", 番号).inputValue(); }
  async バナー設定の画像URLを入れる(番号: number, 値: string): Promise<void> { await this.バナー設定の欄("image_url", 番号).fill(値); }

  /** 識別番号の言語のチェック欄（表示名→欄） */
  async 言語の欄(番号: number): Promise<Map<string, Locator>> {
    const out = new Map<string, Locator>();
    for (const b of await this.page.locator(`input[type=checkbox][name="event_banner[language_${番号}][]"]`).all()) {
      const id = await b.getAttribute("id");
      out.set((await this.page.locator(`label[for="${id}"]`).innerText()).trim(), b);
    }
    return out;
  }

  /**
   * 識別番号の各欄に入れる。表示店舗は複数選択の欄（画面は select2 で飾る）で、指定した店舗だけを選んだ状態にする。
   * 言語は指定したものだけに印を付ける。並び順は触らない。
   */
  async バナー設定を入れる(番号: number, v: { 画像URL: string; リンク先URL: string; 表示店舗: string[]; 言語: string[]; 表示タイプ: string; 画像alt属性: string }): Promise<void> {
    await this.バナー設定の欄("image_url", 番号).fill(v.画像URL);
    await this.バナー設定の欄("link", 番号).fill(v.リンク先URL);
    const shops = this.バナー設定の欄("base_info", 番号);
    const have = (await shops.locator("option").allInnerTexts()).map((t) => t.trim());
    for (const s of v.表示店舗) if (!have.includes(s)) throw new Error(`識別番号${番号}の表示店舗に「${s}」が無い（ある選択肢: ${have.join("、")}）`);
    await shops.selectOption(v.表示店舗.map((label) => ({ label })), { force: true });
    await shops.dispatchEvent("change");
    const langs = await this.言語の欄(番号);
    for (const l of v.言語) if (!langs.has(l)) throw new Error(`識別番号${番号}の言語に「${l}」が無い（ある選択肢: ${[...langs.keys()].join("、")}）`);
    for (const [名, box] of langs) await setChecked(box, v.言語.includes(名));
    await chooseByLabel(this.バナー設定の欄("disp_type", 番号), v.表示タイプ);
    await this.バナー設定の欄("image_alt", 番号).fill(v.画像alt属性);
  }

  /** 画面上部の「バナー設定」ボタンを押し、保存の成功を確かめる */
  async バナー設定を押す(what: string): Promise<void> {
    const btn = this.page.locator("button.js-event-banner-setting-submit").first();
    await expect(btn, "「バナー設定」ボタン").toHaveText(/^\s*バナー設定\s*$/);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), btn.click()]);
    await expectSaved(this.page, what);
  }

  // ---- バナー設定の読み取り・アップロード欄の改ざん（開発者ツールにあたる操作） ----

  /** 画面上部のバナー設定の全欄の、いまの内容（欄の名前→値。なりすまし対策トークンは除く）。書き換えない確かめ用 */
  async バナー設定の内容(): Promise<string> {
    return this.page.evaluate(() => {
      const out: Record<string, string> = {};
      for (const e of Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name^="event_banner["]'))) {
        if (e.name.includes("_token")) continue;
        let v = "";
        if (e instanceof HTMLSelectElement) v = Array.from(e.selectedOptions).map((o) => o.value).join(",");
        else if (e instanceof HTMLInputElement && (e.type === "checkbox" || e.type === "radio")) { if (!e.checked) continue; v = e.value; }
        else v = e.value;
        out[e.name] = out[e.name] === undefined ? v : `${out[e.name]}|${v}`;
      }
      return JSON.stringify(out, Object.keys(out).sort());
    });
  }

  /**
   * アップロード欄の店舗（必須）を、選択値が空の状態にして送信できる状態にする（開発者ツールで選択値を空にするのにあたる）。
   * 空の選択肢を足して選び、ブラウザの必須の検査の印を外す。
   */
  async アップロード欄の店舗を空にする(): Promise<void> {
    await this.アップロード欄の店舗.evaluate((e) => {
      const sel = e as HTMLSelectElement;
      let empty = Array.from(sel.options).find((o) => o.value === "");
      if (!empty) { empty = document.createElement("option"); empty.value = ""; empty.textContent = ""; sel.insertBefore(empty, sel.firstChild); }
      sel.value = "";
      sel.required = false;
      sel.removeAttribute("required");
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  /** 画像の行の下段のURLから見た、保管先の店舗の識別子（/banner/event/<識別子>/…）。読めなければ空 */
  static 店舗の識別子(url: string): string {
    const m = /\/banner\/event\/([^/]+)\//.exec(decodeURIComponent(new URL(url, "http://x").pathname));
    return m ? m[1] : "";
  }
}

/**
 * 事前準備: 選択店舗を 店名 にして一覧を読み、アップロード欄の店舗を 店名 にして file を送り、増えた画像のURLを返す。
 * シード表の「保管先へ名前を決めた画像を置く」（画面の外の操作）は、画面のアップロード（ファイル名は画面が採番する）に読み替える。
 * 増えた画像がちょうど1件でなければ止める。
 */
export async function 準備のアップロード(p: BannerImagePage, 店名: string, file: string): Promise<string> {
  await p.開く();
  await p.選択店舗を選ぶ(店名);
  const 前 = await p.画像のURL();
  const r = await p.アップロードする(店名, file);
  if (!r.送った) throw new Error(`準備のアップロードで要求が送られない（店舗「${店名}」）`);
  await p.読み込みを待つ();
  const now = await p.選択店舗の表示();
  if (now !== 店名) await p.選択店舗を選ぶ(店名);
  const 追加 = (await p.画像のURL()).filter((u) => !前.includes(u));
  if (追加.length !== 1) {
    throw new Error(`準備のアップロードで「${店名}」の一覧に増えた画像が${追加.length}件（1件のはず。成功の表示=${r.成功.join(" / ") || "なし"}／エラーの表示=${r.エラー.join(" / ") || "なし"}／移った先=${r.行き先}）`);
  }
  return 追加[0];
}

/** 画像のURLの最後の区切り（保管されたファイル名） */
export const ファイル名 = (url: string): string => decodeURIComponent(new URL(url, "http://x").pathname.split("/").pop() ?? "");

/** 店舗編集画面で、店舗の支店URL（識別子）を読む */
export async function 店舗の支店URL(page: Page, 店舗ID: string): Promise<string> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${店舗ID}`));
  if (!res || !res.ok()) throw new Error(`店舗ID ${店舗ID} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  const f = page.locator('[name="mall_tenant_shop_master[html_class_name]"]');
  await expect(f, `店舗ID ${店舗ID} の支店URLの欄`).toBeVisible();
  return (await f.inputValue()).trim();
}
