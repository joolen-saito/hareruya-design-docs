/** M16-07 買取価格対応表（編集）（メニュー「データ管理」→「買取価格対応表」→ 価格のリンク） */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { tamperToken } from "./devtools";

export class BuyPriceEditPage {
  constructor(readonly page: Page) {}

  /** 一覧（買取価格対応表）を開き、最初の価格リンクの識別IDを返す。試験用の行を足さず、画面に既にある行を使う */
  async 一覧の最初の行のID(): Promise<number> {
    await this.page.goto(adminUrl("/data/buy_price_list"));
    await this.page.waitForLoadState("load");
    const link = this.page.locator('a[href*="/data/buy_price_list/"][href$="/edit"]').first();
    await expect(link, "一覧の価格リンク（確かめる前に既存の行が出ている）").toBeVisible();
    const m = /buy_price_list\/(\d+)\/edit/.exec((await link.getAttribute("href")) ?? "");
    if (!m) throw new Error("一覧の価格リンクから識別IDを読めない");
    return Number(m[1]);
  }

  /** 編集画面を開く。応答の状態を返す */
  async 開く(id: number | string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/data/buy_price_list/${id}/edit`));
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get 買取価格欄(): Locator { return this.page.locator('input[name="buy_price_list_edit[price]"]'); }
  get 更新ボタン(): Locator { return this.page.getByRole("button", { name: "更新", exact: true }); }
  get 戻るボタン(): Locator { return this.page.getByRole("link", { name: "戻る", exact: true }); }
  get フォーム(): Locator { return this.page.locator("form").filter({ has: this.買取価格欄 }); }
  /** 表示項目（NM価格・カード状態・Foil or Promotion Card?）の表の1行目のセル */
  get 表示項目のセル(): Locator { return this.page.locator(".buy-price-edit-table tbody tr td"); }
  /** 編集の表の中にある入力部品 */
  get 表の中の入力部品(): Locator { return this.表示項目のセル.locator("input, select, textarea"); }
  /** 買取価格の入力欄を含む、本文の領域で見える入力部品（隠し項目を除く）の名前 */
  async 見える入力部品の名前(): Promise<string[]> {
    return await this.フォーム.locator('input:not([type="hidden"]), select, textarea').evaluateAll((es) => es.map((e) => (e as HTMLInputElement).name));
  }

  async 買取価格(): Promise<string> { return await this.買取価格欄.inputValue(); }
  async 入力する(値: string): Promise<void> { await this.買取価格欄.fill(値); }
  async 更新を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => undefined), this.更新ボタン.click({ timeout: 20_000 })]);
    await this.page.waitForLoadState("load");
  }
  async 戻るを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 45_000 }), this.戻るボタン.click({ timeout: 20_000 })]);
    await this.page.waitForLoadState("load");
  }
  /** 開発者ツールで、買取価格の入力欄を文字列を入力できる形にする */
  async 入力欄を文字列入力可能にする(): Promise<void> {
    await this.買取価格欄.evaluate((e) => { (e as HTMLInputElement).type = "text"; });
  }
  /** 開発者ツールで、フォームの送信先の識別IDを変える */
  async 送信先のIDを変える(id: number | string): Promise<void> {
    await this.フォーム.evaluate((f, v) => {
      const a = (f as HTMLFormElement).getAttribute("action") ?? "";
      (f as HTMLFormElement).setAttribute("action", a.replace(/buy_price_list\/\d+\/update/, `buy_price_list/${v}/update`));
    }, String(id));
  }
  async トークンを変える(token: "なし" | string): Promise<void> { await tamperToken(this.フォーム, token); }
  /** 編集画面が出ている（買取価格の入力欄がある） */
  async 編集画面か(): Promise<boolean> { return (await this.買取価格欄.count()) > 0; }
}

/** 共有の買取価格対応表の1行を、画面から控えて・戻す・戻ったか確かめる（lib/shared_restore.ts の registerRestore に渡す） */
export type 行の控え = { id: number; 買取価格: string; 表示項目: string[] };

export async function 行を控える(p: BuyPriceEditPage, id: number): Promise<行の控え> {
  const 価格 = await p.買取価格();
  const 表示 = (await p.表示項目のセル.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  return { id, 買取価格: 価格, 表示項目: 表示 };
}

/** 別のブラウザの画面で、控えた買取価格に戻す（今の値が同じなら何もしない） */
export async function 行を戻す(p: BuyPriceEditPage, 元: 行の控え): Promise<void> {
  await p.開く(元.id);
  if ((await p.買取価格()) === 元.買取価格) return;
  await p.入力する(元.買取価格);
  await p.更新を押す();
}

export async function 行が元と同じか(p: BuyPriceEditPage, 元: 行の控え): Promise<boolean> {
  await p.開く(元.id);
  const 今 = await 行を控える(p, 元.id);
  return JSON.stringify(今) === JSON.stringify(元);
}
