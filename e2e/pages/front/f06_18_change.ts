/**
 * F06-18 会員情報変更（フロントのマイページ）・会員情報変更完了画面の操作。セレクタはここだけに書く。正本: cases/F06-18_test_cases.tsv
 * 入力フォームは会員登録と同じ作り（form#entry_form・項目名 entry[...]）なので、F06-01 の会員登録の部品（EntryPage）を引き継ぐ。
 * 国を変えると、画面のスクリプトがフォームを送り直して入力欄を国ごとに入れ替える（EntryPage.selectCountry が読み込みを待つ）。
 */
import { BrowserContext, Cookie, expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { EntryPage } from "./f06_01_entry";
import { LoginPage } from "./f06_03_login";

const T = 30_000;
export const 変更画面のパス = "/ja/mypage/change";
export const 完了画面のパス = "/ja/mypage/change_complete";

/** 電話番号の数字を3つの欄へ分ける（10桁は 2/4/4、11桁は 3/4/4。会員登録の部品と同じ分け方） */
export function 電話を分ける(n: string): [string, string, string] {
  const d = n.replace(/\D/g, "");
  return d.length >= 11 ? [d.slice(0, 3), d.slice(3, 7), d.slice(7)] : [d.slice(0, 2), d.slice(2, 6), d.slice(6)];
}

export class ChangePage extends EntryPage {
  constructor(page: Page) { super(page); }

  /** 会員情報変更画面のアドレスを開く（ログインしていなければ会員ログイン画面へ移る） */
  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}${変更画面のパス}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** 開いて、会員情報変更の入力フォームが出ていることを確かめる */
  async 開いて待つ(): Promise<void> {
    await this.開く();
    await expect(this.変更フォーム, "会員情報変更画面の入力フォーム").toBeVisible({ timeout: T });
  }
  /** 会員情報変更画面の入力フォーム（送り先が会員情報変更のもの） */
  get 変更フォーム(): Locator { return this.page.locator('form#entry_form[action*="/mypage/change"]'); }
  async 変更画面である(): Promise<boolean> { return (await this.変更フォーム.count()) > 0 && (await this.変更フォーム.isVisible()); }
  get 完了画面である(): boolean { return this.path === 完了画面のパス; }

  // ---- 入力欄 ----
  async 値(name: string): Promise<string> { return this.f(name).inputValue({ timeout: T }); }
  async 選択中の表示(name: string): Promise<string> {
    return ((await this.f(name).locator("option:checked").first().innerText({ timeout: T }).catch(() => "")) ?? "").trim();
  }
  async 入れる(name: string, 値: string): Promise<void> { await this.f(name).fill(値, { timeout: T }); }
  async 選ぶ(name: string, 表示: string): Promise<void> { await this.f(name).selectOption({ label: 表示 }, { timeout: T }); }
  /** 選択欄を空の選択肢（値が空のもの）にする。空の選択肢が無ければ false */
  async 選択を空にする(name: string): Promise<boolean> {
    const has = await this.f(name).locator('option[value=""]').count();
    if (has === 0) return false;
    await this.f(name).selectOption("", { timeout: T });
    return true;
  }
  async 欄がある(name: string): Promise<boolean> { return (await this.f(name).count()) > 0 && (await this.f(name).first().isVisible()); }

  async お名前を入れる(姓: string, 名: string): Promise<void> { await this.入れる("name][name01", 姓); await this.入れる("name][name02", 名); }
  async フリガナを入れる(セイ: string, メイ: string): Promise<void> { await this.入れる("kana][kana01", セイ); await this.入れる("kana][kana02", メイ); }
  async 生年月日を選ぶ(年: string, 月: string, 日: string): Promise<void> {
    await this.f("birth][year").selectOption(年, { timeout: T });
    await this.f("birth][month").selectOption(月, { timeout: T });
    await this.f("birth][day").selectOption(日, { timeout: T });
  }
  async メールを入れる(メール: string): Promise<void> { await this.入れる("email][first", メール); await this.入れる("email][second", メール); }
  async パスワードを入れる(パスワード: string): Promise<void> { await this.入れる("plain_password][first", パスワード); await this.入れる("plain_password][second", パスワード); }
  /** 日本の郵便番号（「100-0001」「1000001」のどちらでも）を2つの欄へ入れる */
  async 日本の郵便番号を入れる(郵便番号: string): Promise<void> {
    const z = 郵便番号.replace(/\D/g, "");
    await this.入れる("postalCode][postalCode01", z.slice(0, 3));
    await this.入れる("postalCode][postalCode02", z.slice(3));
  }
  async 海外の郵便番号を入れる(郵便番号: string): Promise<void> { await this.入れる("abroadPostalCode", 郵便番号); }
  async 電話番号を入れる(n: string): Promise<void> {
    const [a, b, c] = 電話を分ける(n);
    await this.入れる("tel][tel01", a); await this.入れる("tel][tel02", b); await this.入れる("tel][tel03", c);
  }
  async MTG登録名を入れる(姓: string, 名: string): Promise<void> { await this.入れる("Player][lastNameEn", 姓); await this.入れる("Player][firstNameEn", 名); }
  async MTG登録名(): Promise<[string, string]> { return [await this.値("Player][lastNameEn"), await this.値("Player][firstNameEn")]; }

  /**
   * 国を選ぶ。いまと違う国なら、画面がフォームを送り直すのを待つ（EntryPage.selectCountry）。
   * いまと同じ国を選んだときは画面は送り直さない（選び直しても変化が無い）。送り直したかを返す。
   */
  async 国を選ぶ(国: string): Promise<boolean> {
    const current = await this.選択中の表示("country");
    if (current === 国) {
      await this.f("country").selectOption({ label: 国 }, { timeout: T });
      return false;
    }
    await this.selectCountry(国);
    return true;
  }

  /**
   * 国を未選択（値が空の選択肢）にする。空の選択肢が無ければ あった=false。
   * 選ぶと画面のスクリプトがフォームを送り直すので、読み込みを待つ（送り直したかを返す）。
   */
  async 国を空にする(): Promise<{ あった: boolean; 送り直した: boolean }> {
    if ((await this.f("country").locator('option[value=""]').count()) === 0) return { あった: false, 送り直した: false };
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30_000 }).then(() => true, () => false);
    await this.f("country").selectOption("", { timeout: T });
    const 送り直した = await nav;
    if (送り直した) await this.page.waitForLoadState("load");
    return { あった: true, 送り直した };
  }

  // ---- 表示 ----
  /** 本人確認状況の欄に表示されている文 */
  async 本人確認状況(): Promise<string> {
    return ((await this.page.locator(".p-hareruya-entry__confirmation-status .c-hareruya-text").first().innerText({ timeout: T })) ?? "").trim();
  }
  get オンライン本人確認リンク(): Locator { return this.page.locator('.p-hareruya-entry__confirmation-status a[href*="/mypage/identification"]'); }
  /** 「郵便番号から自動入力」の名前の、ボタン・リンク・ボタンの形の入力欄の数 */
  async 郵便番号から自動入力ボタンの数(): Promise<number> {
    const byRole = await this.page.getByRole("button", { name: /郵便番号から自動入力/ }).count();
    const byLink = await this.page.getByRole("link", { name: /郵便番号から自動入力/ }).count();
    const byInput = await this.page.locator('input[type=button][value*="自動入力"], input[type=submit][value*="自動入力"]').count();
    return byRole + byLink + byInput;
  }
  /** 郵便番号の欄の並び（郵便番号の入力欄のまとまり）の文 */
  async 郵便番号欄の文(): Promise<string> {
    const jp = this.page.locator('[data-country-dependent="japan"].p-hareruya-entry__postcod');
    if ((await jp.count()) > 0) return ((await jp.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
    const os = this.page.locator('[data-country-dependent="overseas"].p-hareruya-entry__postcod-overseas');
    return (await os.count()) > 0 ? ((await os.first().innerText()) ?? "").replace(/\s+/g, " ").trim() : "";
  }
  /** 日本の郵便番号の欄の前に「〒」の印が出ているか */
  async 郵便番号の印が見えるか(): Promise<boolean> {
    const m = this.page.locator(".p-hareruya-entry__postcode-mark");
    return (await m.count()) > 0 && (await m.first().isVisible()) && ((await m.first().innerText()).trim() === "〒");
  }
  /** 日本の郵便番号の区切り（「ー」）が見えているか */
  async 郵便番号の区切りが見えるか(): Promise<boolean> {
    const m = this.page.locator(".p-hareruya-entry__postcod .p-hareruya-entry__separator");
    return (await m.count()) > 0 && (await m.first().isVisible());
  }
  get 変更するボタン(): Locator { return this.page.locator("#submit_button"); }
  get 戻るボタン(): Locator { return this.page.locator(".p-hareruya-entry__form-actions a.c-hareruya-btn"); }

  /** 「変更する」を押す。ブラウザ側の入力チェックで送信が止まったら sent=false（EntryPage の同意ボタンと同じ #submit_button） */
  async 変更するを押す(): Promise<{ sent: boolean }> { return this.同意する(); }

  // ---- なりすまし対策トークン（開発者ツールの操作の代わりに、画面の要素をスクリプトで変える） ----
  get トークン欄(): Locator { return this.form.locator('input[name="entry[_token]"]'); }
  async トークン欄を消す(): Promise<number> {
    const n = await this.トークン欄.count();
    await this.トークン欄.evaluateAll((els) => els.forEach((e) => e.remove()));
    return n;
  }
  async トークンを書き換える(値: string): Promise<number> {
    const n = await this.トークン欄.count();
    await this.トークン欄.evaluateAll((els, v) => els.forEach((e) => { (e as HTMLInputElement).value = v; }), 値);
    return n;
  }

  // ---- 完了画面 ----
  get 完了画面の戻るボタン(): Locator { return this.page.locator(".p-hareruya-entry-complete__actions a.c-hareruya-btn"); }

  /** パンくずの現在地を押す（リンクでない要素。押しても移らないことを見るので、読み込みは待たない） */
  async 現在地を押す(): Promise<void> {
    const cur = this.パンくず現在地.first();
    await cur.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await cur.click({ timeout: 10_000 }).catch(async () => { await cur.dispatchEvent("click"); });
    await this.page.waitForLoadState("load");
    await this.page.waitForTimeout(1_500);
  }
  /** リンクを押して、移った先の読み込みを待つ（パンくず・戻るボタン） */
  async リンクを押す(l: Locator): Promise<void> { await this.押して遷移する(l); }
  /** 本店の ECTOP（/ja/）か */
  get 本店ECTOPか(): boolean { return this.path.replace(/\/$/, "") === "/ja"; }
}

/** 会員ログイン画面でメールアドレスとパスワードを入れてログインする（本店）。ログイン画面のままなら止める */
export async function 会員としてログインする(page: Page, メール: string, パスワード: string): Promise<void> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く("本店");
  await l.ログインする(メール, パスワード);
  if (await l.ログイン画面である()) throw new Error(`会員 ${メール} でログインできない（${await l.認証エラー()}）`);
}

/** ブラウザに、自動ログイン用のCookieだけを入れる（会員ログインの認証セッションは入れない） */
export async function 自動ログイン用Cookieだけを入れる(context: BrowserContext, cookies: Cookie[]): Promise<void> {
  await context.clearCookies();
  await context.addCookies(cookies);
}

/** Cookie のうち、自動ログイン用のもの（名前に remember を含む） */
export function 自動ログイン用Cookie(cookies: Cookie[]): Cookie[] {
  return cookies.filter((c) => /remember/i.test(c.name));
}
