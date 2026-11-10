/**
 * F06-21 退会の続き。退会を完了する操作と、なりすまし対策の照合値の書き換え。セレクタはここだけに書く。
 * 既存の pages/front/f06_21_withdraw.ts は変えず、継ぐ。正本: cases/F06-21_test_cases.tsv
 */
import { Locator } from "@playwright/test";
import { WithdrawPage } from "./f06_21_withdraw";

export class WithdrawExecPage extends WithdrawPage {
  /** 画面にあるフォームのなりすまし対策の照合値の入力要素 */
  get 照合値の入力要素(): Locator { return this.page.locator('form[action$="/mypage/withdraw"] input[name$="[_token]"]'); }

  /** 開発者ツールで入力要素を削除するのと同じ（画面の要素を取り除く）。取り除いた数を返す */
  async 照合値の入力要素を削除する(): Promise<number> {
    const n = await this.照合値の入力要素.count();
    await this.照合値の入力要素.evaluateAll((els) => els.forEach((e) => e.remove()));
    return n;
  }
  /** 開発者ツールで値を書き換えるのと同じ（画面の要素の値を変える）。変えた数を返す */
  async 照合値を変える(値: string): Promise<number> {
    const n = await this.照合値の入力要素.count();
    await this.照合値の入力要素.evaluateAll((els, v) => els.forEach((e) => { (e as HTMLInputElement).value = v; }), 値);
    return n;
  }
  /** 画面の照合値の入力要素が持つ値（書き換えたあとに確かめる） */
  async 照合値の入力要素の値(): Promise<string[]> {
    return this.照合値の入力要素.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  }

  /** ログイン→退会前→退会手続きへ→パスワード入力→退会する（正本の手順1〜4に当たる操作を順に） */
  async 退会前から退会を完了する(パスワード: string): Promise<void> {
    await this.退会前を開く();
    await this.押して遷移する(this.退会手続きへ);
    await this.パスワード欄.fill(パスワード, { timeout: 30_000 });
    await this.押して遷移する(this.退会する);
  }
}
