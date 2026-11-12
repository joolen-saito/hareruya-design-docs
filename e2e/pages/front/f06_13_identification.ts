/**
 * F06-13 オンライン本人確認（フロント）の画面操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-13_test_cases.tsv
 * - スマートフォン版の表示は、iPhone の端末の印のブラウザで開く（呼ぶ側）。ここは画面の操作と、テスト用カメラ入力の用意だけ。
 * - 撮影は、画面の「撮影を開始する」の枠を押してカメラを起動し、もう一度枠を押して撮る（画面のスクリプトの作り）。
 *   試験のブラウザには実際のカメラが無いので、カメラ入力（getUserMedia）を、画像形式を判別できる絵を映す入力に差し替える（テスト用カメラ入力）。
 */
import { BrowserContext, devices, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
export const スマホ端末 = (() => {
  const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices["iPhone 13"];
  return { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch };
})();
export const PC版ChromeのUA = devices["Desktop Chrome"].userAgent;

export type 撮影枠 = "現在の顔写真" | "オモテ面" | "ウラ面・別ページ" | "斜め";
const 枠の要素: Record<撮影枠, string> = { 現在の顔写真: "faceImage", オモテ面: "frontImage", "ウラ面・別ページ": "backImage", 斜め: "angleImage" };
export const 全撮影枠: 撮影枠[] = ["現在の顔写真", "オモテ面", "ウラ面・別ページ", "斜め"];
export const マイナンバー撮影枠: 撮影枠[] = ["現在の顔写真", "オモテ面", "斜め"];

/** テスト用カメラ入力（ページを開く前にコンテキストへ入れる）。撮るたびに違う番号の絵を映す */
export async function テスト用カメラを用意する(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    let shot = 0;
    const fake = async (): Promise<MediaStream> => {
      shot += 1;
      const c = document.createElement("canvas");
      c.width = 640; c.height = 480;
      const g = c.getContext("2d")!;
      const draw = () => {
        g.fillStyle = `hsl(${(shot * 67) % 360}, 60%, 70%)`;
        g.fillRect(0, 0, 640, 480);
        g.fillStyle = "#000";
        g.font = "48px sans-serif";
        g.fillText(`E2E camera ${shot}`, 60, 250);
        g.fillText(String(Date.now() % 100000), 60, 320);
      };
      draw();
      setInterval(draw, 100);
      return c.captureStream(10);
    };
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: fake, enumerateDevices: async () => [] }, configurable: true });
  });
}

export class IdentificationPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  get path(): string { return new URL(this.page.url()).pathname; }
  get スタート画面か(): boolean { return /\/mypage\/identification\/?$/.test(this.path); }
  get 撮影画面か(): boolean { return /\/mypage\/identification\/photograph\/?$/.test(this.path); }
  get 申請完了画面か(): boolean { return /\/mypage\/identification\/complete\/?$/.test(this.path); }
  get マイページか(): boolean { return /\/mypage\/?$/.test(this.path); }
  get 本店ECTOPか(): boolean { return /^\/(ja\/?)?$/.test(this.path); }

  async 開く(): Promise<void> { await this.goto(`${BASE_URL}/ja/mypage/identification`); }
  /** 画面のアドレスを直接開く（応答の状態を返す） */
  async goto(url: string): Promise<number> {
    const res = await this.page.goto(url, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async ログアウトする(): Promise<void> { await this.goto(`${BASE_URL}/logout`); }

  // ---- スタート画面 ----
  get QRコード(): Locator { return this.page.locator(".p-hareruya-text-with-qr__qr-img"); }
  get 種類の選択欄(): Locator { return this.page.locator('select[name="identification_select[Identification]"]'); }
  get 撮影画面へボタン(): Locator { return this.page.getByRole("button", { name: "撮影画面へ" }); }
  get 本人確認状況(): Locator { return this.page.locator(".p-hareruya-identification__card-value").first(); }
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-identification__actions").getByRole("link", { name: "マイページ" }); }

  /** 種類の選択肢の表示名（「選択して下さい」の行は除く） */
  async 種類の選択肢(): Promise<string[]> {
    const all = (await this.種類の選択欄.locator("option").evaluateAll((os) => os.map((o) => [(o as HTMLOptionElement).value, (o.textContent ?? "").trim()]))) as string[][];
    return all.filter(([v]) => v !== "").map(([, t]) => t);
  }
  async 種類を選ぶ(表示名: string): Promise<void> { await this.種類の選択欄.selectOption({ label: 表示名 }, { timeout: T }); }
  async 選択中の種類(): Promise<string> { return (await this.種類の選択欄.locator("option:checked").innerText()).trim(); }
  async 撮影画面へ(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.撮影画面へボタン.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 撮影画面 ----
  枠(名: 撮影枠): Locator { return this.page.locator(`#identification_image_${枠の要素[名]}`); }
  画像の入力(名: 撮影枠): Locator { return this.page.locator(`#identification_image_${枠の要素[名]}Base64`); }
  get 撮影項目の数(): Promise<number> { return this.page.locator('[id^="identification_image_"][id$="Image"]').count(); }
  get 撮影項目の見出し(): Promise<string[]> {
    return this.page.locator(".p-hareruya-identification-photograph__section-header h2").allInnerTexts().then((a) => a.map((t) => t.trim()));
  }
  get 選んだ種類の入力(): Locator { return this.page.locator('input[name="identification_image[identification]"]'); }
  get 同意チェック(): Locator { return this.page.locator('input[name="identification_image[agree]"]'); }
  get 確定ボタン(): Locator { return this.page.locator(".submit-button-forward"); }
  get キャンセル(): Locator { return this.page.locator(".p-hareruya-identification-photograph__actions").getByRole("link", { name: "キャンセル" }); }
  get 画面の文(): Promise<string> { return this.page.locator("main, #contents, body").first().innerText().then((t) => t.replace(/\s+/g, " ")); }

  /** 枠の「撮影を開始する」を押してカメラを起動し、もう一度押して撮る（撮った画像が入力に入るまで待つ） */
  async 撮影する(名: 撮影枠): Promise<void> {
    const 枠 = this.枠(名);
    await 枠.click({ timeout: T });
    await this.page.waitForFunction("typeof streaming !== 'undefined' && streaming === true", undefined, { timeout: T });
    await 枠.click({ timeout: T });
    await this.page.waitForFunction((id) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").length > 100, `identification_image_${枠の要素[名]}Base64`, { timeout: T });
  }
  async 同意する(): Promise<void> { await this.同意チェック.check({ timeout: T }); }
  async 確定を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), this.確定ボタン.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  /** 確定を押す。移動せず画面のスクリプトの確認ダイアログが出るときのために、出たダイアログの文を返す */
  async 確定を押してダイアログを読む(): Promise<string[]> {
    const msgs: string[] = [];
    const h = (d: import("@playwright/test").Dialog) => { msgs.push(d.message()); void d.accept(); };
    this.page.on("dialog", h);
    try {
      await this.確定ボタン.click({ timeout: T });
      await this.page.waitForTimeout(2_000);
      await this.page.waitForLoadState("load");
    } finally { this.page.off("dialog", h); }
    return msgs;
  }

  /** 開発者ツールのネットワーク条件で、ユーザーエージェントを変える */
  async ユーザーエージェントを変える(ua: string): Promise<void> {
    const cdp = await this.page.context().newCDPSession(this.page);
    await cdp.send("Network.setUserAgentOverride", { userAgent: ua });
  }
  /** 開発者ツールで、画像データの入力の値を書き換える */
  async 画像データを書き換える(名: 撮影枠, 値: string): Promise<void> {
    await this.画像の入力(名).evaluate((el, v) => { (el as HTMLInputElement).value = v; }, 値);
  }
  get なりすまし対策トークン(): Locator { return this.page.locator('input[name="identification_image[_token]"]'); }
  async トークンの入力要素を削除する(): Promise<void> { await this.なりすまし対策トークン.evaluate((el) => el.remove()); }
  async トークンを書き換える(値: string): Promise<void> { await this.なりすまし対策トークン.evaluate((el, v) => { (el as HTMLInputElement).value = v; }, 値); }

  /** 申請完了画面 */
  get 申請完了の本人確認状況(): Locator { return this.page.locator(".p-hareruya-identification-complete__status-text"); }
  get 完了のマイページボタン(): Locator { return this.page.locator(".p-hareruya-identification-complete__actions").getByRole("link", { name: "マイページ" }); }
  get 買取TOPボタン(): Locator { return this.page.locator(".p-hareruya-identification-complete__actions").getByRole("link", { name: "買取TOP" }); }

  // ---- パンくずリスト ----
  get ホームアイコン(): Locator { return this.page.locator(".p-hareruya-breadcrumb__link[aria-label]").first(); }
  get パンくずの現在のページ(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async パンくずの現在のページがリンクでないか(): Promise<{ 名前: string; リンク: boolean }> {
    const cur = this.パンくずの現在のページ;
    const 名前 = (await cur.innerText()).replace(/\s+/g, " ").trim();
    const inLink = (await cur.locator("a").count()) > 0 || (await cur.evaluate((el) => !!el.closest("a")));
    const linkTexts = (await this.page.locator("a.p-hareruya-breadcrumb__link").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
    return { 名前, リンク: inLink || linkTexts.includes(名前) };
  }
  async 押して移動する(l: Locator): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), l.click({ timeout: T, noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
  }
}
