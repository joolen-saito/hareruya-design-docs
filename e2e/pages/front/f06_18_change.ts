/**
 * F06-18 会員情報変更（マイページの会員情報変更画面 → 会員情報変更完了画面）の操作。セレクタはここだけに書く。
 * 入力欄は会員情報登録画面（f06_01_entry.ts）と同じ名前。国を変えると画面が自動で送り直され（国の切り替えの印つき）、入力欄が国ごとに入れ替わる。
 * 正本: cases/F06-18_test_cases.tsv
 */
import { expect, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;

/** 画面の項目名 → 入力欄の名前（入力欄の名前はここだけに書く） */
const 欄名 = {
  "お名前(姓)": "name][name01", "お名前(名)": "name][name02", "フリガナ(姓)": "kana][kana01", "フリガナ(名)": "kana][kana02",
  "性別": "sex", "国": "country", "郵便番号(前半)": "postalCode][postalCode01", "郵便番号(後半)": "postalCode][postalCode02",
  "郵便番号(海外)": "abroadPostalCode", "住所(都道府県)": "address][pref", "住所1": "address][addr01", "住所2": "address][addr02",
  "住所3": "address][addr03", "会社名": "company_name", "職業": "job",
  "MTG Campaign 登録名(姓)": "Player][lastNameEn", "MTG Campaign 登録名(名)": "Player][firstNameEn",
} as const;
export type 項目 = keyof typeof 欄名;

/** 電話番号の数字を3つの欄へ分ける（10桁は 2/4/4、11桁は 3/4/4） */
function splitTel(n: string): [string, string, string] {
  const d = n.replace(/\D/g, "");
  return d.length >= 11 ? [d.slice(0, 3), d.slice(3, 7), d.slice(7)] : [d.slice(0, 2), d.slice(2, 6), d.slice(6)];
}

export type 表示値 = {
  姓: string; 名: string; セイ: string; メイ: string; 生年月日: string; 性別: string; メール: string; メール確認: string;
  国: string; 郵便番号: string; 都道府県: string; 住所1: string; 住所2: string; 住所3: string; 電話番号: string;
  会社名: string; 職業: string; MTG姓: string; MTG名: string; 本人確認状況: string;
};

export class ChangePage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  get form(): Locator { return this.page.locator("form#entry_form"); }
  f(name: string): Locator { return this.form.locator(`[name="entry[${name}]"]`); }
  /** 画面の項目名で入力欄を引く */
  欄(項目: 項目): Locator { return this.f(欄名[項目]); }

  /** 会員ログイン画面からログインする（本店） */
  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await this.page.locator("#login_email").fill(メール, { timeout: T });
    await this.page.locator("#login_pass").fill(パスワード, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator("form#login_mypage button[type=submit]").click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    if (/\/mypage\/login/.test(this.path)) throw new Error(`会員 ${メール} でログインできない（会員ログイン画面のまま）`);
  }

  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/change`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.form, "会員情報変更画面の入力フォーム").toBeVisible({ timeout: T });
  }
  async 変更画面である(): Promise<boolean> { return /\/mypage\/change\/?$/.test(this.path) && (await this.form.count()) > 0; }
  get 完了画面か(): boolean { return /\/mypage\/change_complete\/?$/.test(this.path); }

  // ---- 入力 ----
  private async 生で入れる(name: string, 値: string): Promise<void> { await this.f(name).fill(値, { timeout: T }); }
  async 入れる(項目: 項目, 値: string): Promise<void> { await this.生で入れる(欄名[項目], 値); }
  async 値(項目: 項目): Promise<string> { return this.欄(項目).inputValue({ timeout: T }); }
  /** 選択欄を表示の名前で選ぶ。空文字は未選択の選択肢（値が空のもの） */
  async 選ぶ(項目: 項目, 表示: string): Promise<void> {
    if (表示 === "") await this.欄(項目).selectOption({ value: "" }, { timeout: T });
    else await this.欄(項目).selectOption({ label: 表示 }, { timeout: T });
  }
  private async 生の選択中(name: string): Promise<string> {
    const o = this.f(name).locator("option:checked");
    return (await o.count()) ? (await o.first().innerText()).trim() : "";
  }
  async 選択中(項目: 項目): Promise<string> { return this.生の選択中(欄名[項目]); }
  async 選択肢(項目: 項目): Promise<string[]> { return (await this.欄(項目).locator("option").allInnerTexts()).map((t) => t.trim()); }
  /** 未選択の選択肢（値が空のもの）があるか */
  async 未選択の選択肢があるか(項目: 項目): Promise<boolean> { return (await this.欄(項目).locator('option[value=""]').count()) > 0; }

  async お名前(姓: string, 名: string): Promise<void> { await this.生で入れる("name][name01", 姓); await this.生で入れる("name][name02", 名); }
  async フリガナ(セイ: string, メイ: string): Promise<void> { await this.生で入れる("kana][kana01", セイ); await this.生で入れる("kana][kana02", メイ); }
  async 生年月日(y: string, m: string, d: string): Promise<void> {
    for (const [n, v] of [["birth][year", y], ["birth][month", m], ["birth][day", d]] as const) {
      // 空は未選択の選択肢。ほかは値または表示（会員情報登録画面の部品と同じ選び方）
      if (v === "") await this.f(n).selectOption({ value: "" }, { timeout: T });
      else await this.f(n).selectOption(v, { timeout: T });
    }
  }
  async メールアドレス(v: string): Promise<void> { await this.生で入れる("email][first", v); await this.生で入れる("email][second", v); }
  async パスワード(v: string): Promise<void> { await this.生で入れる("plain_password][first", v); await this.生で入れる("plain_password][second", v); }
  /** 日本の郵便番号（「101-0001」「1010001」のどちらでも） */
  async 日本の郵便番号(v: string): Promise<void> {
    const z = v.replace(/\D/g, "");
    await this.生で入れる("postalCode][postalCode01", z.slice(0, 3));
    await this.生で入れる("postalCode][postalCode02", z.slice(3));
  }
  async 電話番号(v: string): Promise<void> {
    const [a, b, c] = v === "" ? ["", "", ""] : splitTel(v);
    await this.生で入れる("tel][tel01", a); await this.生で入れる("tel][tel02", b); await this.生で入れる("tel][tel03", c);
  }

  /**
   * 国を選ぶ。国の欄を選ぶと画面のスクリプトが入力内容を送り直し、入力欄が国ごとに入れ替わった画面に読み込み直される。
   * いまと同じ国を選んだときも、選ぶ操作で送り直されることがあるので、送り直されたら読み込み直しを待つ（送り直されたかを返す）
   */
  async 国を選ぶ(国: string): Promise<boolean> {
    const 同じ = (await this.選択中("国")) === 国;
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 同じ ? 10_000 : 60_000 }).then(() => true, () => false);
    await this.f("country").selectOption(国 === "" ? { value: "" } : { label: 国 }, { timeout: T });
    const moved = await nav;
    if (!同じ && !moved) throw new Error(`国を「${国}」に変えても、画面が読み込み直されない`);
    if (moved) {
      await this.page.waitForLoadState("load");
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      await expect(this.form, "国を選んだあとの会員情報変更画面の入力フォーム").toBeVisible({ timeout: T });
    }
    return moved;
  }

  get 変更するボタン(): Locator { return this.page.locator("#submit_button"); }
  /** 「変更する」を押す。画面の入力チェックで止まって送信されなかったときは sent=false */
  async 変更するを押す(): Promise<{ sent: boolean }> {
    const before = this.page.url();
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).then(() => true, () => false);
    await this.変更するボタン.click({ timeout: T });
    const sent = await nav;
    if (sent) await this.page.waitForLoadState("load");
    return { sent: sent || this.page.url() !== before };
  }

  // ---- なりすまし対策の照合値（開発者ツールの代わりに、画面の要素をスクリプトで変える） ----
  get 照合値(): Locator { return this.form.locator('input[name="entry[_token]"]'); }
  async 照合値の入力要素を削除する(): Promise<number> {
    return this.照合値.evaluateAll((ns) => { ns.forEach((n) => n.remove()); return ns.length; });
  }
  async 照合値を変える(v: string): Promise<number> {
    return this.照合値.evaluateAll((ns, val) => { ns.forEach((n) => { (n as HTMLInputElement).value = val; }); return ns.length; }, v);
  }

  // ---- 表示の読み取り ----
  async 日本の郵便番号欄(): Promise<boolean> {
    return (await this.f("postalCode][postalCode01").isVisible()) && (await this.f("postalCode][postalCode02").isVisible());
  }
  /** 日本の郵便番号の「〒」の印が見えているか */
  async 郵便番号の印(): Promise<string> {
    const l = this.page.locator(".p-hareruya-entry__postcode-mark").first();
    return (await l.count()) && (await l.isVisible()) ? (await l.innerText()).trim() : "";
  }
  async 海外の郵便番号欄(): Promise<boolean> { return this.f("abroadPostalCode").isVisible(); }
  async 都道府県欄(): Promise<boolean> { return this.f("address][pref").isVisible(); }
  async 住所3欄(): Promise<boolean> { return this.f("address][addr03").isVisible(); }
  /** 「郵便番号から自動入力」のボタン・リンクの数 */
  async 郵便番号から自動入力の数(): Promise<number> {
    const a = await this.page.locator("button, a", { hasText: "郵便番号から自動入力" }).count();
    const b = await this.page.locator('input[type=button][value*="郵便番号から自動入力"], input[type=submit][value*="郵便番号から自動入力"]').count();
    return a + b;
  }
  get 本人確認状況(): Locator { return this.page.locator(".p-hareruya-entry__confirmation-status .c-hareruya-text").first(); }
  get オンライン本人確認リンク(): Locator { return this.page.locator(".p-hareruya-entry__confirmation-status a", { hasText: "オンラインで本人確認を行う" }).first(); }
  get 戻るリンク(): Locator { return this.form.locator("a.c-hareruya-btn", { hasText: "戻る" }).first(); }
  get 完了画面の戻る(): Locator { return this.page.locator("main a.c-hareruya-btn, a.c-hareruya-btn.u-hareruya-w-full").filter({ hasText: "戻る" }).first(); }

  /** 画面に表示されている入力欄の値 */
  async 表示値(): Promise<表示値> {
    const v = async (n: string) => ((await this.f(n).count()) && (await this.f(n).isVisible()) ? this.f(n).inputValue() : "");
    const s = async (n: string) => ((await this.f(n).count()) ? this.生の選択中(n) : "");
    const z1 = await v("postalCode][postalCode01"), z2 = await v("postalCode][postalCode02");
    return {
      姓: await v("name][name01"), 名: await v("name][name02"), セイ: await v("kana][kana01"), メイ: await v("kana][kana02"),
      生年月日: [await this.f("birth][year").inputValue(), (await this.f("birth][month").inputValue()).padStart(2, "0"), (await this.f("birth][day").inputValue()).padStart(2, "0")].join("-"),
      性別: await s("sex"), メール: await v("email][first"), メール確認: await v("email][second"),
      国: await s("country"), 郵便番号: z1 || z2 ? `${z1}-${z2}` : await v("abroadPostalCode"),
      都道府県: (await this.都道府県欄()) ? await s("address][pref") : "", 住所1: await v("address][addr01"), 住所2: await v("address][addr02"),
      住所3: await v("address][addr03"),
      電話番号: (await v("tel][tel01")) + (await v("tel][tel02")) + (await v("tel][tel03")),
      会社名: await v("company_name"), 職業: await s("job"), MTG姓: await v("Player][lastNameEn"), MTG名: await v("Player][firstNameEn"),
      本人確認状況: (await this.本人確認状況.count()) ? (await this.本人確認状況.innerText()).trim() : "",
    };
  }
  async エラー文(): Promise<string[]> {
    return (await this.page.locator(".form-error-message, .invalid-feedback, .c-hareruya-form-input__field-error, .c-hareruya-form-input__field-error--server").allInnerTexts())
      .map((t) => t.trim()).filter(Boolean);
  }

  // ---- パンくず ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  /** 押して画面が移るのを待つ（移らないときは待ち切りで続ける。移ったかを返す） */
  async 押す(l: Locator, 移るはず = true): Promise<boolean> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 移るはず ? 60_000 : 5_000 }).then(() => true, () => false);
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      // 固定ヘッダーが要素の上に重なって普通に押せないとき（画面の作りの問題）。押下の操作を要素へ直接送って続け、注記を残す
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    const moved = await nav;
    if (moved) await this.page.waitForLoadState("load");
    return moved;
  }
}
