/**
 * M10-15（店舗登録）の連携ケースで見る支店サイトのトップページ（支店ECTOP）。店舗情報・ご当地晴れる屋くんは F02-03 の部品を使い、
 * ここには支店ECTOPが表示されたか・X公式アカウントのQRコードの読み取りだけを書く。
 * QRコードはサーバーが作った画像（data URI）。読み取りはブラウザの読み取りの部品（BarcodeDetector）で行う。部品の無いブラウザでは読めない。
 */
import { Locator, Page } from "@playwright/test";

export class BranchTopCheck {
  constructor(readonly page: Page) {}
  /** 支店ECTOPの画面か（本体に支店トップの印がある） */
  async 支店ECTOPか(): Promise<boolean> { return (await this.page.locator("body.shop_top").count()) > 0; }
  get XのQRコード(): Locator { return this.page.locator('img.p-hareruya-branch-top__promo-card-qr-img[alt$="X公式アカウントQRコード"]').first(); }
  /** X公式アカウントのQRコードを読み取った文字列 */
  async XのQRコードを読む(): Promise<string> {
    const img = this.XのQRコード;
    if ((await img.count()) === 0) throw new Error("支店ECTOPに X公式アカウントのQRコードの画像が無い");
    await img.scrollIntoViewIfNeeded();
    const src = await img.getAttribute("src");
    if (!src) throw new Error("X公式アカウントのQRコードの画像に中身が無い");
    const r = await this.page.evaluate(async (s) => {
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect(i: ImageBitmapSource): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (!BD) return { error: "このブラウザには QRコードの読み取りの部品（BarcodeDetector）が無い" };
      const im = new Image();
      im.src = s;
      await im.decode();
      // 余白を足して大きく描き直す（小さい画像・中央のロゴでも読めるように）
      const scale = Math.max(1, Math.ceil(600 / Math.max(im.naturalWidth, 1)));
      const c = document.createElement("canvas");
      c.width = im.naturalWidth * scale + 80; c.height = im.naturalHeight * scale + 80;
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingEnabled = false;
      g.drawImage(im, 40, 40, im.naturalWidth * scale, im.naturalHeight * scale);
      const found = await new BD({ formats: ["qr_code"] }).detect(c);
      return found.length ? { value: found[0].rawValue } : { error: "QRコードを読み取れなかった" };
    }, src);
    if ("error" in r && r.error) throw new Error(r.error);
    return (r as { value: string }).value;
  }
}
