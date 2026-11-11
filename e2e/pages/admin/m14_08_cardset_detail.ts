/**
 * M14-08 カードセット詳細(登録・編集・削除) の画面操作。セレクタはここだけに書く。
 * 画面の作りはアプリのテンプレート（Cardset/edit・delete_modal）で確かめた。期待値はここに書かない。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type 入力 = {
  名日?: string; 名英?: string; 略称?: string;
  /** ブロック選択の選択肢の表示名（「未指定」で未指定） */
  ブロック?: string;
  /** 入力欄の形式（YYYY-MM-DD） */
  リリース日?: string;
  特殊セット?: boolean;
  シンボル画像?: string;
};
export type 送信結果 = { sent: boolean; url: string; status: number | null };

export class CardsetDetailPage {
  constructor(readonly page: Page) {}

  f(name: string): Locator { return this.page.locator(`[name="admin_cardset[${name}]"]`); }
  get フォーム(): Locator { return this.page.locator("form#form1"); }
  get 操作部(): Locator { return this.page.locator(".c-conversionArea"); }
  get 登録ボタン(): Locator { return this.フォーム.locator("button[type=submit]").filter({ hasText: /^\s*登録\s*$/ }); }

  async 登録画面を開く(): Promise<void> {
    await this.page.goto(adminUrl("/cardset/new"));
    await this.page.waitForLoadState("load");
    await expect(this.フォーム, "カードセット詳細（登録）画面").toBeVisible();
  }
  async 編集画面を開く(id: string): Promise<void> {
    await this.page.goto(adminUrl(`/cardset/${id}/edit`));
    await this.page.waitForLoadState("load");
    await expect(this.f("nameJp"), `カードセット詳細（編集・削除）画面（カードセットID ${id}）`).toBeVisible();
  }
  /** アドレスを直接開いて HTTP の状態を返す（存在しないカードセットなど） */
  async 編集画面のアドレスを開く(id: string): Promise<number | null> {
    const res = await this.page.goto(adminUrl(`/cardset/${id}/edit`));
    await this.page.waitForLoadState("load");
    return res?.status() ?? null;
  }

  async 入力する(v: 入力): Promise<void> {
    if (v.名日 !== undefined) await this.f("nameJp").fill(v.名日);
    if (v.名英 !== undefined) await this.f("nameEn").fill(v.名英);
    if (v.略称 !== undefined) await this.f("code").fill(v.略称);
    if (v.ブロック !== undefined) await this.f("Cardsetblock").selectOption({ label: v.ブロック });
    if (v.リリース日 !== undefined) await this.f("releaseDate").fill(v.リリース日);
    if (v.特殊セット !== undefined) await this.f("specialFlg").setChecked(v.特殊セット);
    if (v.シンボル画像) await this.page.locator('[name="admin_cardset[symbol_image_file]"]').setInputFiles(v.シンボル画像);
  }

  /** ブロック選択で、未指定でない選択肢（表示名と値） */
  async ブロックの選択肢(): Promise<{ 表示: string; 値: string }[]> {
    const all = await this.f("Cardsetblock").locator("option").evaluateAll((os) => os.map((o) => ({ 表示: (o.textContent ?? "").trim(), 値: (o as HTMLOptionElement).value })));
    return all.filter((o) => o.値 !== "");
  }
  async ブロック名(値: string): Promise<string | null> {
    return (await this.ブロックの選択肢()).find((o) => o.値 === 値)?.表示 ?? null;
  }

  /** 登録ボタンを押す。要求が送られたか・送信先の状態・押したあとのアドレスを返す */
  async 登録を押す(): Promise<送信結果> {
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).then(() => true, () => false);
    const res = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/cardset\//.test(r.url()), { timeout: 30_000 }).then((r) => r.status(), () => null);
    await this.登録ボタン.click({ timeout: 20_000, noWaitAfter: true });
    const sent = await nav;
    return { sent, url: this.page.url(), status: sent ? await res : null };
  }
  /** 登録して、登録後の編集画面のアドレスのカードセットIDを返す（シード用。画面が保存できなければ落とす） */
  async 登録して控える(what: string): Promise<string> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    await expectSaved(this.page, `${what}: カードセットの登録`);
    const m = /\/cardset\/(\d+)\/edit/.exec(this.page.url());
    if (!m) throw new Error(`${what}: 登録後にカードセットの編集画面へ移らない（${this.page.url()}）`);
    return m[1];
  }
  /** 更新して、成功メッセージまで確かめる（シード用） */
  async 更新する(what: string): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    await expectSaved(this.page, `${what}: カードセットの更新`);
  }

  /** なりすまし対策トークンの入力要素を削除する（開発者ツールでの操作の代わり） */
  async トークンを削除する(): Promise<number> {
    return this.フォーム.locator('input[name$="[_token]"]').evaluateAll((els) => { els.forEach((e) => e.remove()); return els.length; });
  }
  async トークンを書き換える(値: string): Promise<number> {
    return this.フォーム.locator('input[name$="[_token]"]').evaluateAll((els, v) => { els.forEach((e) => { (e as HTMLInputElement).value = v; }); return els.length; }, 値);
  }
  /** ブラウザの入力チェックを外す（サーバー側の判定を確かめるため、開発者ツールでの操作の代わり） */
  async 入力チェックを外す(): Promise<void> {
    await this.フォーム.evaluate((f) => { (f as HTMLFormElement).noValidate = true; });
  }

  // ---- シンボル画像・収録カード ----
  get 画像未登録の表示(): Locator { return this.フォーム.locator(".card-body").getByText("画像未登録", { exact: true }); }
  get シンボル画像(): Locator { return this.フォーム.locator(".card-body img"); }
  async シンボル画像の中身(): Promise<Buffer | null> {
    const img = this.シンボル画像.first();
    if (!(await img.count())) return null;
    const src = await img.getAttribute("src");
    if (!src) return null;
    const res = await this.page.request.get(new URL(src, this.page.url()).toString());
    return res.ok() ? Buffer.from(await res.body()) : null;
  }
  get 収録カードのリンク(): Locator { return this.フォーム.locator("table tbody a[href*='/card/']"); }
  async 収録カードの名前(): Promise<string[]> {
    return (await this.収録カードのリンク.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  収録カードを探す(名: string): Locator { return this.収録カードのリンク.filter({ hasText: 名 }); }

  // ---- 削除 ----
  get 削除ボタン(): Locator { return this.操作部.locator('a[data-bs-target="#DeleteModal"]'); }
  get 削除の確認(): Locator { return this.page.locator("#DeleteModal"); }
  get 実行ボタン(): Locator { return this.削除の確認.locator('a[data-method="delete"]'); }

  async 削除を押す(): Promise<void> {
    await this.削除ボタン.click({ timeout: 20_000 });
    await expect(this.削除の確認, "削除の確認ポップアップ").toBeVisible();
    // ポップアップが開いたとき、画面のスクリプトが実行ボタンの送信先を入れる
    await expect(this.実行ボタン, "実行ボタンの送信先").toHaveAttribute("href", /\/cardset\/\d+\/delete/);
  }
  /** 実行ボタンの送信先のアドレス */
  async 実行の送信先(): Promise<string> {
    return (await this.実行ボタン.getAttribute("href")) ?? "";
  }
  /** 実行ボタンの送信先を書き換える（開発者ツールでの操作の代わり） */
  async 実行の送信先を書き換える(url: string): Promise<void> {
    await this.実行ボタン.evaluate((a, u) => a.setAttribute("href", u), url);
  }
  /** 「実行」を押す。押したあとの画面の HTTP の状態とアドレスを返す */
  async 実行を押す(): Promise<{ status: number | null; url: string }> {
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).then((r) => r, () => null);
    await this.実行ボタン.click({ timeout: 20_000, noWaitAfter: true });
    const r = await nav;
    return { status: r?.status() ?? null, url: this.page.url() };
  }
  /** 「カードセット管理」リンクを押す */
  async カードセット管理を押す(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.操作部.locator("a.c-baseLink").filter({ hasText: "カードセット管理" }).click(),
    ]);
  }
}
