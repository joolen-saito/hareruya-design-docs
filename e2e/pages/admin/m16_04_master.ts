/** M16-04 MTGマスターデータ編集（メニュー「データ管理」→「MTGマスターデータ」）と、システム設定のマスターデータ管理 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class MtgMasterEditPage {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/data/mtg_master_data"));
    await this.page.waitForLoadState("load");
    await expect(this.選択欄, "MTGマスターデータ選択").toBeVisible();
  }
  get 選択欄(): Locator { return this.page.locator('select[name="entity"]'); }
  get 選択ボタン(): Locator { return this.page.locator('form[method="get"] button[type="submit"]'); }
  /** 一覧と登録ボタンの領域 */
  get 一覧の領域(): Locator { return this.page.locator("form#edit_form"); }
  get 登録ボタン(): Locator { return this.page.locator('button[type="submit"][form="edit_form"]'); }
  async 選択肢の表示名(): Promise<string[]> { return (await this.選択欄.locator("option").allInnerTexts()).map((t) => t.trim()); }
  async 選ばれている表示名(): Promise<string> { return ((await this.選択欄.locator("option:checked").textContent()) ?? "").trim(); }
  /** 開発者ツールで行うのと同じに、選択欄へ選択肢に無い値を足して選ぶ */
  async 送信値を書き換える(値: string): Promise<void> {
    await this.選択欄.evaluate((e, v) => { const s = e as HTMLSelectElement; s.add(new Option(v, v)); s.value = v; }, 値);
  }
  async 選択を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 45_000 }), this.選択ボタン.click({ timeout: 20_000 })]);
    await this.page.waitForLoadState("load");
  }
  get カード名リスト作成リンク(): Locator { return this.page.getByRole("link", { name: "カード一覧の「カード名リスト作成」" }); }

  /** マスターデータの種別を表示名で選び、「選択」を押して一覧を出す */
  async 種別を選んで表示する(表示名: string): Promise<void> {
    await this.選択欄.selectOption({ label: 表示名 });
    await this.選択を押す();
    await expect(this.一覧の領域, `「${表示名}」の一覧`).toBeVisible();
    expect(await this.選ばれている表示名(), "選ばれている種別").toBe(表示名);
  }
  async 見出し(): Promise<string[]> { return (await this.一覧の領域.locator("thead th").allInnerTexts()).map((t) => t.trim()); }
  /** 末尾の入力用の空行を除いた、登録済みの行 */
  get 登録済みの行(): Locator { return this.一覧の領域.locator("tbody tr").filter({ hasNot: this.page.locator('[name^="rows[new]"]') }); }
  get 入力用の空行(): Locator { return this.一覧の領域.locator("tbody tr").filter({ has: this.page.locator('[name^="rows[new]"]') }); }
  /** 行を、その行の識別番号（入力欄の送信名に含まれる番号）で探す */
  番号の行(番号: number): Locator {
    return this.一覧の領域.locator("tbody tr").filter({ has: this.page.locator(`[name^="rows[${番号}]["]`) });
  }
  /** 行の各列について、入力できない（読み取り専用または無効）かどうか。列の並びは見出しの並び */
  async 入力できない列(行: Locator): Promise<boolean[]> {
    return 行.locator("td").evaluateAll((tds) => tds.map((td) => {
      const c = td.querySelector("input, select") as HTMLInputElement | HTMLSelectElement | null;
      return !!c && (c.hasAttribute("readonly") || c.disabled);
    }));
  }
  /** 真偽値の選択欄（登録済みの行）に表示されている値 */
  async 真偽値の表示(): Promise<string[]> {
    return this.登録済みの行.locator("select option:checked").evaluateAll((os) => os.map((o) => (o.textContent ?? "").trim()));
  }
  get 登録の文字のボタン(): Locator { return this.page.getByRole("button", { name: "登録", exact: true }); }
  get なりすまし対策トークン(): Locator { return this.一覧の領域.locator('input[name$="[_token]"]'); }
  async トークンを書き換える(値: string): Promise<number> {
    return this.なりすまし対策トークン.evaluateAll((els, v) => { els.forEach((e) => { (e as HTMLInputElement).value = v; }); return els.length; }, 値);
  }
  async 登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 45_000 }), this.登録ボタン.click({ timeout: 20_000 })]);
  }
  /** 入力エラーとして画面に出ているメッセージ（開発用の帯は除く） */
  async 入力エラーの文(): Promise<string[]> {
    const l = this.page.locator(".alert-danger, .invalid-feedback, .form-error-message").filter({ hasNotText: "デバッグモードが有効になっています" });
    return (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }
}

/** カードセット管理・デッキ管理の、MTGマスターデータ編集への入口 */
export class MasterEntryLinks {
  constructor(readonly page: Page) {}
  async カードセット管理を開く(): Promise<void> { await this.page.goto(adminUrl("/cardset")); await this.page.waitForLoadState("load"); }
  async デッキ管理を開く(): Promise<void> { await this.page.goto(adminUrl("/deck")); await this.page.waitForLoadState("load"); }
  get ブロックの追加(): Locator { return this.page.getByRole("link", { name: "ブロックの追加", exact: true }); }
  get デッキタグ一覧(): Locator { return this.page.getByRole("link", { name: "デッキタグ一覧", exact: true }).or(this.page.getByRole("button", { name: "デッキタグ一覧", exact: true })); }
}

/** システム設定のマスターデータ管理の選択欄の選択肢の表示名 */
export async function マスターデータ管理の選択肢(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  await page.waitForLoadState("load");
  const sel = page.locator("form select").first();
  await expect(sel, "マスターデータ管理の選択欄").toBeVisible();
  return (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
}
