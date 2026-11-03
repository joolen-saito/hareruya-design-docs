/** F06-22 お問い合わせ（フロント）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-22_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
export type 言語 = "ja" | "en";

export class ContactPage {
  constructor(readonly page: Page, readonly 言語: 言語 = "ja") { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  private url(p: string): string { return `${BASE_URL}/${this.言語}${p}`; }

  async 開く(): Promise<void> {
    await this.page.goto(this.url("/contact"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
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
}
