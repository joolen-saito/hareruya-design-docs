/**
 * F08（フロント店頭買取）で、店舗識別名ごとの入口の画面を開き、応答の状態を読む部品。
 * 入口: 申込前ログイン画面（entry）・申込フォーム（店舗直下）・会員登録フォーム（register_customer）・登録確認（confirm）。
 */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 入口 = "申込前ログイン" | "申込フォーム" | "会員登録フォーム" | "登録確認" | "登録完了";

const PATH: Record<入口, string> = { "申込前ログイン": "/entry", "申込フォーム": "", "会員登録フォーム": "/register_customer", "登録確認": "/confirm", "登録完了": "/complete" };

export const 入口のURL = (店舗識別名: string, 入口: 入口) => `${BASE_URL}/ja/otcbuy/${店舗識別名}${PATH[入口]}`;

export class StoreEntryPage {
  constructor(readonly page: Page) {}

  /** 入口のURLを開き、応答の状態を返す */
  async 開く(店舗識別名: string, 入口: 入口): Promise<{ status: number; url: string }> {
    const res = await this.page.goto(入口のURL(店舗識別名, 入口), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return { status: res?.status() ?? 0, url: this.page.url() };
  }

  /** 申込前ログイン画面のログイン欄の数（表示されていれば1） */
  readonly ログイン欄 = () => this.page.locator("form#login_otc_buy");
  /** 申込情報入力・確認などの申込の画面の本体 */
  readonly 申込の入力欄 = () => this.page.locator('[name^="otc_buy_order["]');
}
