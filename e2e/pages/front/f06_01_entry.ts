/**
 * F06-01 会員登録（フロントの会員情報登録画面 → 会員登録確認画面 → 仮会員登録完了画面）の操作。
 * セレクタはここだけに書く。正本: cases/F06-01_test_cases.tsv
 */
import { expect, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 入力値 = {
  姓: string; 名: string; セイ: string; メイ: string;
  生年月日?: [string, string, string];
  性別?: "男性" | "女性" | "";
  メール: string; メール確認?: string;
  パスワード: string; パスワード確認?: string;
  国: "Japan" | "United States";
  /** 日本は「100-0001」「1000001」のどちらでも。海外はそのまま */
  郵便番号: string;
  都道府県?: string;
  住所1: string; 住所2: string; 住所3?: string;
  電話番号: string;
  会社名?: string;
  職業?: string;
  /** MTG Campaign 登録名（姓・名） */
  MTG姓?: string; MTG名?: string;
};

const TIMEOUT = 30_000;

/** 電話番号の数字を3つの欄へ分ける（10桁は 2/4/4、11桁は 3/4/4） */
function splitTel(n: string): [string, string, string] {
  const d = n.replace(/\D/g, "");
  return d.length >= 11 ? [d.slice(0, 3), d.slice(3, 7), d.slice(7)] : [d.slice(0, 2), d.slice(2, 6), d.slice(6)];
}

export class EntryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  get form(): Locator { return this.page.locator("form#entry_form"); }
  f(name: string): Locator { return this.form.locator(`[name="entry[${name}]"]`); }

  async open(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/entry`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.form, "会員登録画面の入力フォーム").toBeVisible({ timeout: TIMEOUT });
  }

  /** 国を選ぶ。国を変えると画面が読み込み直される（入力欄が国ごとに入れ替わる） */
  async selectCountry(国: string): Promise<void> {
    const current = (await this.f("country").locator("option:checked").innerText()).trim();
    if (current === 国) return;
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.f("country").selectOption({ label: 国 }, { timeout: TIMEOUT }),
    ]);
    await this.page.waitForLoadState("load");
    await expect(this.f("country").locator("option:checked"), "国の選択").toHaveText(国, { timeout: TIMEOUT });
  }

  /** 全項目を入力する（国を先に選ぶ） */
  async fill(v: 入力値): Promise<void> {
    await this.selectCountry(v.国);
    const set = async (name: string, value: string) => { await this.f(name).fill(value, { timeout: TIMEOUT }); };
    await set("name][name01", v.姓);
    await set("name][name02", v.名);
    await set("kana][kana01", v.セイ);
    await set("kana][kana02", v.メイ);
    const [y, m, d] = v.生年月日 ?? ["1990", "1", "2"];
    await this.f("birth][year").selectOption(y, { timeout: TIMEOUT });
    await this.f("birth][month").selectOption(m, { timeout: TIMEOUT });
    await this.f("birth][day").selectOption(d, { timeout: TIMEOUT });
    if (v.性別 !== undefined && v.性別 !== "") await this.f("sex").selectOption({ label: v.性別 }, { timeout: TIMEOUT });
    await set("email][first", v.メール);
    await set("email][second", v.メール確認 ?? v.メール);
    await set("plain_password][first", v.パスワード);
    await set("plain_password][second", v.パスワード確認 ?? v.パスワード);
    if (v.国 === "Japan") {
      const z = v.郵便番号.replace(/\D/g, "");
      await set("postalCode][postalCode01", z.slice(0, 3));
      await set("postalCode][postalCode02", z.slice(3));
      await this.f("address][pref").selectOption({ label: v.都道府県 ?? "東京都" }, { timeout: TIMEOUT });
    } else {
      await set("abroadPostalCode", v.郵便番号);
    }
    await set("address][addr01", v.住所1);
    await set("address][addr02", v.住所2);
    if (v.国 !== "Japan" && v.住所3 !== undefined) await set("address][addr03", v.住所3);
    const [t1, t2, t3] = splitTel(v.電話番号);
    await set("tel][tel01", t1);
    await set("tel][tel02", t2);
    await set("tel][tel03", t3);
    if (v.会社名 !== undefined) await set("company_name", v.会社名);
    if (v.職業 !== undefined && v.職業 !== "") await this.f("job").selectOption({ label: v.職業 }, { timeout: TIMEOUT });
    if (v.MTG姓 !== undefined) await set("Player][lastNameEn", v.MTG姓);
    if (v.MTG名 !== undefined) await set("Player][firstNameEn", v.MTG名);
  }

  get 同意ボタン(): Locator { return this.page.locator("#submit_button"); }
  /** 「同意する」（画面上の名前は「同意して確認画面へ」）を押す。ブラウザの入力チェックで止まったら、送信されなかったことを返す */
  async 同意する(): Promise<{ sent: boolean }> {
    const before = this.page.url();
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }).then(() => true, () => false);
    await this.同意ボタン.click({ timeout: TIMEOUT });
    const sent = await nav;
    if (sent) await this.page.waitForLoadState("load");
    return { sent: sent && this.page.url() !== before ? true : sent };
  }

  // ---- 確認画面 ----
  get 登録するボタン(): Locator { return this.page.locator('button[name="mode"][value="complete"]'); }
  get 戻るボタン(): Locator { return this.page.locator('button[name="mode"][value="back"]'); }
  async 登録する(): Promise<void> {
    await expect(this.登録するボタン, "確認画面の「登録する」").toBeVisible({ timeout: TIMEOUT });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.登録するボタン.click({ timeout: TIMEOUT })]);
    await this.page.waitForLoadState("load");
  }
  async 戻る(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.戻るボタン.click({ timeout: TIMEOUT })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 画面の判別 ----
  get path(): string { return new URL(this.page.url()).pathname; }
  /** 入力画面か（名前の欄が入力できる状態で見えている。確認画面では隠し項目になる） */
  async 入力画面である(): Promise<boolean> { return this.f("name][name01").isVisible(); }
  /** 確認画面にだけある「登録する」ボタンで判別する */
  async 確認画面である(): Promise<boolean> { return (await this.登録するボタン.count()) > 0; }
  get 完了画面か(): boolean { return /\/entry\/complete/.test(this.path); }
  get 登録エラー画面か(): boolean { return /\/entry\/regist_error/.test(this.path); }
  get 本登録画面か(): boolean { return /\/entry\/activate/.test(this.path); }

  // ---- 入力画面の状態 ----
  /** 日本の郵便番号の入力欄（2分割）が見えているか */
  async 日本の郵便番号欄(): Promise<boolean> {
    return (await this.f("postalCode][postalCode01").isVisible()) && (await this.f("postalCode][postalCode02").isVisible());
  }
  async 海外の郵便番号欄(): Promise<boolean> { return this.f("abroadPostalCode").isVisible(); }
  async 都道府県欄(): Promise<boolean> { return this.f("address][pref").isVisible(); }
  async 住所3欄(): Promise<boolean> { return this.f("address][addr03").isVisible(); }
  /** 国の選択肢（先頭から） */
  async 国の選択肢(): Promise<string[]> { return (await this.f("country").locator("option").allInnerTexts()).map((t) => t.trim()); }
  async 職業の選択肢(): Promise<string[]> { return (await this.f("job").locator("option").allInnerTexts()).map((t) => t.trim()); }
  async 性別の選択肢(): Promise<string[]> { return (await this.f("sex").locator("option").allInnerTexts()).map((t) => t.trim()); }

  // ---- パンくず・リンク ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current"); }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  /** パンくずの現在地が押せるリンクか（現在地の要素の中・外にリンクがあるか） */
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地.first();
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  async 押して遷移する(l: Locator): Promise<void> {
    // 画面上部に固定されたヘッダーがパンくずなどを覆わない位置（画面の中ほど）へ動かしてから押す
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      // 固定ヘッダーが要素の上に重なって普通に押せないとき（画面の作りの問題）。押下の操作そのものは DOM へ送って続け、注記と条件付きの印を残す
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }


  /** 画面の本文（確認画面・完了画面の文を読む） */
  async 本文(): Promise<string> { return (await this.page.locator("main, #main, body").first().innerText()).replace(/\s+/g, " "); }
  /** 画面のエラー文 */
  async エラー文(): Promise<string[]> {
    return (await this.page.locator(".ec-errorMessage, .form-error-message, .invalid-feedback, .c-hareruya-form-input__field-error, .c-hareruya-form-input__field-error--server").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
}
