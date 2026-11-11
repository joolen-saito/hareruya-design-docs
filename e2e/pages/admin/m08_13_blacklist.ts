/**
 * M08-13 ブラックリスト登録/編集/削除画面の操作。セレクタはここだけに書く。正本: cases/M08-13_test_cases.tsv
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 1つのフォームに、上の新規登録行（項目の選択・キーワード）と、保存済みの全行（行ごとに項目の選択・キーワード）が並ぶ。「登録」で全行と新規登録行を一度に送る。
 * - 行ごとの「削除」ボタンは、行ごとの隠れた削除用フォーム（識別子の末尾がブラックリストID）を送る。確認のモーダルは無い。
 * - 保存できると一覧を開き直す（画面のアドレスは一覧に戻る）。入力エラーのときは送った値のまま同じ画面を返す（アドレスは登録の送り先のまま）。
 * 開発環境のブラックリストには、ほかの方の行もある。行は、ケースが控えたブラックリストIDか、印を付けたキーワードで見分ける。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 60_000;
const 一覧のパス = /\/customer\/blacklist\/?$/;

export type ブラックリストの行 = { ブラックリストID: string; 項目: string; キーワード: string };

export class M0813BlacklistPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }

  get フォーム(): Locator { return this.page.locator("#blacklist-form"); }
  get 新規登録行の項目(): Locator { return this.フォーム.locator('select[name$="[new_blacklist_tag]"]'); }
  get 新規登録行のキーワード(): Locator { return this.フォーム.locator('input[name$="[new_keyword]"]'); }
  get 登録ボタン(): Locator { return this.page.locator("#ex-conversion-action button.btn-ec-conversion", { hasText: "登録" }); }
  /** なりすまし対策トークンの入力要素（登録のフォームのもの） */
  get トークン(): Locator { return this.フォーム.locator('input[type="hidden"][name$="[_token]"]'); }
  /** ブラックリストIDの行（削除ボタンが、そのIDの削除用フォームを指す行） */
  行(ID: string): Locator { return this.フォーム.locator("tr.blacklist-row").filter({ has: this.page.locator(`button[form="blacklist-delete-${ID}"]`) }); }
  行の項目(ID: string): Locator { return this.行(ID).locator('select[name$="[BlacklistTag]"]'); }
  行のキーワード(ID: string): Locator { return this.行(ID).locator('input[name$="[keyword]"]'); }

  get いまのパス(): string { return new URL(this.page.url()).pathname; }
  /** 保存済み一覧の画面（登録・削除のあとに開き直された一覧）か */
  一覧の画面か(): boolean { return 一覧のパス.test(this.いまのパス); }

  /** ブラックリスト登録/編集/削除画面を開く。応答のステータスを返す */
  async 開く(): Promise<number> {
    const res = await this.page.goto(adminUrl("/customer/blacklist"), { timeout: T });
    await this.page.waitForLoadState("load");
    await expect(this.フォーム, "ブラックリスト登録/編集/削除画面のフォーム").toBeVisible({ timeout: T });
    return res?.status() ?? 0;
  }

  /** 画面に並ぶ保存済みの行（画面上の、いまの入力値で読む） */
  async 行の一覧(): Promise<ブラックリストの行[]> {
    return this.フォーム.locator("tr.blacklist-row").evaluateAll((trs) => trs.map((tr) => {
      const btn = tr.querySelector("button[form^='blacklist-delete-']");
      const sel = tr.querySelector("select") as HTMLSelectElement | null;
      const kw = tr.querySelector("input[type='text'], input:not([type])") as HTMLInputElement | null;
      return {
        ブラックリストID: (btn?.getAttribute("form") ?? "").replace(/^blacklist-delete-/, ""),
        項目: sel ? (sel.selectedOptions[0]?.textContent ?? "").trim() : "",
        キーワード: kw?.value ?? "",
      };
    }));
  }
  /** 項目とキーワードが一致する保存済みの行 */
  async 一致する行(項目: string, キーワード: string): Promise<ブラックリストの行[]> {
    return (await this.行の一覧()).filter((r) => r.項目 === 項目 && r.キーワード === キーワード);
  }
  /** キーワードが一致する保存済みの行（項目を問わない） */
  async キーワードの行(キーワード: string): Promise<ブラックリストの行[]> {
    return (await this.行の一覧()).filter((r) => r.キーワード === キーワード);
  }

  /** 選択の欄で、表示名の選択肢を選ぶ（選べたかを確かめる） */
  private async 項目を選ぶ(select: Locator, 項目: string, 何: string): Promise<void> {
    await select.selectOption({ label: 項目 });
    await expect.poll(async () => select.evaluate((n) => ((n as HTMLSelectElement).selectedOptions[0]?.textContent ?? "").trim()), `${何}で「${項目}」が選ばれた`).toBe(項目);
  }
  async 新規登録行で項目を選ぶ(項目: string): Promise<void> { await this.項目を選ぶ(this.新規登録行の項目, 項目, "新規登録行の項目"); }
  async 新規登録行のキーワードを入れる(キーワード: string): Promise<void> { await this.新規登録行のキーワード.fill(キーワード); }
  async 行の項目を選ぶ(ID: string, 項目: string): Promise<void> {
    await expect(this.行(ID), `ブラックリストID ${ID} の行が1つある`).toHaveCount(1);
    await this.項目を選ぶ(this.行の項目(ID), 項目, `ブラックリストID ${ID} の行の項目`);
  }
  async 行のキーワードを入れる(ID: string, キーワード: string): Promise<void> {
    await expect(this.行(ID), `ブラックリストID ${ID} の行が1つある`).toHaveCount(1);
    await this.行のキーワード(ID).fill(キーワード);
  }
  /** 新規登録行の項目で選ばれている選択肢の表示 */
  async 新規登録行で選ばれている項目(): Promise<string> {
    return this.新規登録行の項目.evaluate((n) => ((n as HTMLSelectElement).selectedOptions[0]?.textContent ?? "").trim());
  }
  /** 新規登録行の項目の選択肢（値と表示） */
  async 新規登録行の項目の選択肢(): Promise<{ 値: string; 表示: string }[]> {
    return this.新規登録行の項目.locator("option").evaluateAll((os) => os.map((o) => ({ 値: (o as HTMLOptionElement).value, 表示: (o.textContent ?? "").trim() })));
  }

  /** 登録ボタンを押し、画面が移るのを待つ。応答のステータスを返す */
  async 登録する(): Promise<number> {
    await expect(this.登録ボタン, "登録ボタン").toBeEnabled({ timeout: T });
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
      this.登録ボタン.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** ブラックリストIDの行の削除ボタンを押し、画面が移るのを待つ。応答のステータスを返す */
  async 削除する(ID: string): Promise<number> {
    const btn = this.行(ID).locator(`button[form="blacklist-delete-${ID}"]`);
    await expect(btn, `ブラックリストID ${ID} の行の削除ボタン`).toBeVisible({ timeout: T });
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
      btn.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 開発者ツールで、登録のフォームのなりすまし対策トークンの入力要素を消す */
  async トークンの入力要素を消す(): Promise<void> {
    await expect(this.トークン, "なりすまし対策トークンの入力要素").toHaveCount(1);
    await this.トークン.evaluate((n) => n.remove());
    await expect(this.トークン, "なりすまし対策トークンの入力要素が消えた").toHaveCount(0);
  }
  /** 開発者ツールで、登録のフォームのなりすまし対策トークンの値を書き換える */
  async トークンを書き換える(値: string): Promise<void> {
    await expect(this.トークン, "なりすまし対策トークンの入力要素").toHaveCount(1);
    await this.トークン.evaluate((n, v) => { (n as HTMLInputElement).value = v; }, 値);
    await expect(this.トークン, "なりすまし対策トークンの値").toHaveValue(値);
  }

  /** 画面に出ている成功・エラーのメッセージ */
  async メッセージ(): Promise<{ 成功: string[]; エラー: string[] }> {
    const read = async (l: Locator): Promise<string[]> => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return {
      成功: await read(this.page.locator(".alert-success:visible")),
      エラー: (await read(this.page.locator(".alert-danger:visible, .invalid-feedback:visible, .form-error-message:visible")))
        .filter((t) => t !== "デバッグモードが有効になっています。"),
    };
  }
}
