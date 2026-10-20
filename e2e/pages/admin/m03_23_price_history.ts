/**
 * 買取・販売価格履歴検索画面（メニュー「商品管理」→「買取/販売価格履歴」）。
 * 検索条件の欄と、検索したあとの一覧（件数欄・CSVダウンロード・ページング）が同じ画面にある。
 * 一覧は検索の結果が出ているときだけ表示され、件数欄・CSVダウンロードは結果が1件以上のときだけ表示される。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** フォームの欄の名前の接頭辞 */
const P = "buy_sale_price_history_search";

/** 画面のアドレス（管理画面の接頭辞の後ろ） */
export const 価格履歴検索のパス = "/product/buy_sale_price_history";
export const 価格履歴CSVのパス = "/product/buy_sale_price_history/export";

/** 一覧の1行（画面の列の順） */
export type 価格履歴の行 = {
  商品コード: string; 商品名: string; 言語: string; 状態: string;
  変更前基準価格: string; 変更後基準価格: string; 変更前販売価格: string; 変更後販売価格: string;
  変更前買取価格: string; 変更後買取価格: string; 登録日: string; 登録者: string;
};
const 列 = [
  "商品コード", "商品名", "言語", "状態", "変更前基準価格", "変更後基準価格", "変更前販売価格", "変更後販売価格",
  "変更前買取価格", "変更後買取価格", "登録日", "登録者",
] as const;

/** チェック項目の1つ（値・表示名・選ばれているか・見えているか・押せるか） */
export type 選択肢 = { value: string; label: string; checked: boolean; visible: boolean; enabled: boolean };

/** チェック項目の欄（業務の名前 → フォームの欄の名前） */
const チェック項目 = {
  公開状態: "status", レアリティ: "rarity", 言語: "language", 状態: "card_condition", Foil: "foil", プロモ: "promotion",
} as const;
export type チェック項目名 = keyof typeof チェック項目;

/** 設計書の識別ID 1-3〜1-16 の検索条件の欄（見えているかを確かめる対象） */
const 検索条件の識別ID = [
  "1-3", "1-4", "1-5", "1-6", "1-7", "1-8", "1-9", "1-10", "1-11", "1-12", "1-13", "1-14", "1-15", "1-16",
] as const;
export type 検索条件の識別ID = (typeof 検索条件の識別ID)[number];
/** 検索条件の欄の表示の状態 */
export type 欄の表示 = "表示" | "非表示" | "一部だけ表示";

export class PriceHistoryPage {
  readonly form: Locator;
  /** 1-1 商品名等（商品名(日/英)・カード名・商品コード・備考） */
  readonly 商品名等: Locator;
  /** 1-2 検索条件の開閉ボタン */
  readonly 開閉ボタン: Locator;
  /** 開閉ボタンで表示・非表示が切り替わる領域 */
  readonly 詳細: Locator;
  /** 1-20 「検索する >」 */
  readonly 検索ボタン: Locator;
  /** 検索したあとの一覧の領域（検索の結果が0件のときも出る） */
  readonly 結果: Locator;
  readonly 行: Locator;
  /** 2-2 CSVダウンロード */
  readonly CSVダウンロード: Locator;
  /** 2-1 件数（押すと件数の選択肢が開くボタン） */
  readonly 件数: Locator;
  /** 2-15 ページング */
  readonly ページング: Locator;
  /** 検索の結果が0件のときの表示 */
  readonly 該当なし: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#search_form");
    this.商品名等 = page.locator(`#${P}_multi`);
    this.開閉ボタン = this.form.locator('button[data-bs-target="#searchDetail"]');
    this.詳細 = page.locator("#searchDetail");
    this.検索ボタン = this.form.locator('button[type="submit"]').filter({ hasText: "検索する" });
    this.結果 = page.locator("#result_list");
    this.行 = this.結果.locator("table tbody tr");
    this.CSVダウンロード = this.結果.locator(`a[href$="${価格履歴CSVのパス}"]`);
    this.件数 = this.結果.locator("button.dropdown-menu-toggle");
    this.ページング = this.結果.locator("ul.pagination");
    this.該当なし = this.結果.getByText("検索条件に該当するデータがありません。", { exact: true });
  }

  /** 画面のスクリプトまで読み込まれたこと（開閉ボタンなどの動きはスクリプトが付ける） */
  async ready(): Promise<void> {
    await expect(this.form, "買取・販売価格履歴検索画面の検索条件の欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** アドレスで画面を開く（検索条件を持たない初期表示） */
  async open(): Promise<void> {
    await this.page.goto(adminUrl(価格履歴検索のパス));
    await this.ready();
  }

  /** ブラウザのアドレス欄で、管理画面の接頭辞の後ろのアドレスを開く。応答の状態を返す */
  async openAddress(pathAndQuery: string): Promise<number> {
    const res = await this.page.goto(adminUrl(pathAndQuery));
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** いまの画面のアドレス（管理画面の接頭辞を含むパス） */
  path(): string {
    return new URL(this.page.url()).pathname;
  }

  /** 「検索する >」を押し、検索したあとの画面が読み込まれるまで待つ */
  async search(): Promise<void> {
    await expect(this.検索ボタン, "「検索する >」ボタン").toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.検索ボタン.click()]);
    await expect(this.form, "検索したあとの画面").toBeVisible();
  }

  /** 商品名等に入れて「検索する >」を押す */
  async searchWord(word: string): Promise<void> {
    await this.商品名等.fill(word);
    await this.search();
  }

  // ---- 検索条件の欄 ----

  private choiceInputs(項目: チェック項目名): Locator {
    return this.form.locator(`input[name="${P}[product][${チェック項目[項目]}][]"]`);
  }

  /** チェック項目の選択肢（画面の並び順） */
  async choices(項目: チェック項目名): Promise<選択肢[]> {
    const out: 選択肢[] = [];
    for (const input of await this.choiceInputs(項目).all()) {
      out.push({
        value: await input.inputValue(),
        label: await input.evaluate((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim()),
        checked: await input.isChecked(),
        visible: await input.isVisible(),
        enabled: await input.isEnabled(),
      });
    }
    return out;
  }

  /** チェック項目で、表示名が labels のものだけを選んだ状態にする（ほかはチェックを外す） */
  async checkOnly(項目: チェック項目名, labels: string[]): Promise<void> {
    const have = await this.choices(項目);
    for (const l of labels) {
      if (!have.some((c) => c.label === l)) throw new Error(`${項目}に選択肢「${l}」が無い（ある選択肢: ${have.map((c) => c.label).join("、")}）`);
    }
    for (const input of await this.choiceInputs(項目).all()) {
      const label = await input.evaluate((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim());
      const want = labels.includes(label);
      if ((await input.isChecked()) === want) continue;
      await expect(input, `${項目}の「${label}」を押せる`).toBeEnabled();
      if (want) await input.check(); else await input.uncheck();
    }
    const now = (await this.choices(項目)).filter((c) => c.checked).map((c) => c.label);
    expect(now, `${項目}で選んだ選択肢`).toEqual(labels);
  }

  /** エキスパンション（1-7）の欄 */
  get エキスパンション(): Locator {
    return this.page.locator(`#${P}_product_cardset`);
  }

  /** カテゴリ（1-5）の欄 */
  get カテゴリ(): Locator {
    return this.page.locator(`#${P}_product_category_id`);
  }

  /** 名称入力のサジェストのある選択欄で、選ばれている値 */
  async selectedValues(select: Locator): Promise<string[]> {
    return select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => o.value).filter(Boolean));
  }

  /**
   * 名称入力のサジェストのある選択欄（エキスパンション・カテゴリ）に語を入力し、サジェストの候補から label を選ぶ。
   * 選ぶ前に出ていた候補を返す。
   */
  async chooseFromSuggest(select: Locator, term: string, label: string): Promise<string[]> {
    const id = await select.getAttribute("id");
    if (!id) throw new Error("サジェストのある選択欄のIDを読めない");
    await this.page.locator(`#${id} + .select2-container .select2-selection`).click();
    const input = this.page.locator(".select2-container--open .select2-search__field").first();
    await expect(input, "サジェストの入力欄").toBeVisible();
    await input.fill(term);
    const options = this.page.locator(".select2-container--open .select2-results__option[aria-selected]");
    await expect(options.first(), `「${term}」のサジェストの候補`).toBeVisible();
    const labels = (await options.allInnerTexts()).map((t) => t.trim());
    const index = labels.indexOf(label);
    if (index < 0) throw new Error(`「${term}」のサジェストに「${label}」が無い（候補: ${labels.join("、")}）`);
    await options.nth(index).click();
    await this.page.keyboard.press("Escape");
    return labels;
  }

  /**
   * 設計書の識別ID 1-3〜1-16 の欄で、画面に見えている部品。
   * 名称入力のサジェストのある欄（1-5・1-7）は、画面のスクリプトが元の選択欄を隠して代わりの部品を出すので、その部品を見る。
   */
  検索条件の部品(識別ID: 検索条件の識別ID): Locator {
    const サジェスト欄 = (name: string) => this.page.locator(`#${P}_product_${name} + .select2-container, #${P}_product_${name}:not(.select2-hidden-accessible)`);
    switch (識別ID) {
      case "1-3": return this.page.locator(`#${P}_date_from`);
      case "1-4": return this.page.locator(`#${P}_date_to`);
      case "1-5": return サジェスト欄("category_id");
      case "1-6": return this.choiceInputs("公開状態");
      case "1-7": return サジェスト欄("cardset");
      case "1-8": return this.choiceInputs("レアリティ");
      case "1-9": return this.choiceInputs("言語");
      case "1-10": return this.choiceInputs("状態");
      case "1-11": return this.choiceInputs("Foil");
      case "1-12": return this.choiceInputs("プロモ");
      case "1-13": return this.page.locator(`#${P}_product_standard_price_from`);
      case "1-14": return this.page.locator(`#${P}_product_standard_price_to`);
      case "1-15": return this.page.locator(`#${P}_product_sell_price_from`);
      case "1-16": return this.page.locator(`#${P}_product_sell_price_to`);
    }
  }

  /**
   * 識別ID 1-3〜1-16 の各欄の表示の状態。欄に部品が複数あるとき（チェックの選択肢など）は、
   * すべて見えていれば「表示」、すべて見えていなければ「非表示」、一部だけ見えていれば「一部だけ表示」。
   */
  async 検索条件の表示(): Promise<Record<検索条件の識別ID, 欄の表示>> {
    // 開閉の動きの途中（高さを変えている間）は待つ
    await expect(this.page.locator("#searchDetail.collapsing"), "検索条件の開閉の動きが終わる").toHaveCount(0);
    const out = {} as Record<検索条件の識別ID, 欄の表示>;
    for (const id of 検索条件の識別ID) {
      const parts = await this.検索条件の部品(id).all();
      if (parts.length === 0) throw new Error(`識別ID ${id} の欄が画面に無い`);
      let shown = 0;
      for (const p of parts) if (await p.isVisible()) shown += 1;
      out[id] = shown === parts.length ? "表示" : shown === 0 ? "非表示" : "一部だけ表示";
    }
    return out;
  }

  /** 開閉ボタンを押し、開閉の動きが終わるまで待つ */
  async pressToggle(): Promise<void> {
    await expect(this.開閉ボタン, "検索条件の開閉ボタン").toBeVisible();
    await this.開閉ボタン.click();
    await expect(this.page.locator("#searchDetail.collapsing"), "検索条件の開閉の動きが終わる").toHaveCount(0, { timeout: 10_000 });
  }

  // ---- 一覧 ----

  /** 一覧の行（上から順）。一覧が無ければ空 */
  async rowValues(): Promise<価格履歴の行[]> {
    const out: 価格履歴の行[] = [];
    for (const tr of await this.行.all()) {
      const cells = (await tr.locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
      if (cells.length !== 列.length) throw new Error(`一覧の行の列の数が ${cells.length}（${列.length} のはず）: ${cells.join(" | ")}`);
      out.push(Object.fromEntries(列.map((k, i) => [k, cells[i]])) as 価格履歴の行);
    }
    return out;
  }

  /** 一覧の行の商品コード（上から順） */
  async codes(): Promise<string[]> {
    return (await this.rowValues()).map((r) => r.商品コード);
  }

  /** 一覧の上の「検索結果 N件が該当しました」の N。一覧が無いか、表示が無ければ null */
  async totalCount(): Promise<number | null> {
    const t = this.結果.getByText(/検索結果\s*\d+件が該当しました/);
    if ((await t.count()) === 0) return null;
    const m = ((await t.first().textContent()) ?? "").match(/(\d+)件/);
    return m ? Number(m[1]) : null;
  }

  /** 件数の欄に出ている件数（例: "10件"）。件数の欄が無ければ null */
  async selectedCount(): Promise<string | null> {
    if ((await this.件数.count()) === 0) return null;
    return ((await this.件数.textContent()) ?? "").replace(/\s+/g, "");
  }

  /** 件数の欄を押して開き、n件を選ぶ（選ぶと画面が移る） */
  async chooseCount(n: string): Promise<void> {
    await expect(this.件数, "件数の欄").toBeVisible();
    await this.件数.click();
    const item = this.結果.locator(".dropdown-menu a.dropdown-item").filter({ hasText: new RegExp(`^\\s*${n}\\s*件\\s*$`) });
    await expect(item, `件数の選択肢「${n}件」`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), item.click()]);
    await expect(this.form, "件数を選んだあとの画面").toBeVisible();
  }

  /** ページングの現在のページ番号。ページングが無ければ null */
  async currentPage(): Promise<string | null> {
    if ((await this.ページング.count()) === 0) return null;
    return ((await this.ページング.locator(".page-item.active .page-link").first().textContent()) ?? "").trim();
  }

  /** ページングで n ページ目を選ぶ（選ぶと画面が移る） */
  async goToPage(n: string): Promise<void> {
    const link = this.ページング.locator("a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
    await expect(link, `ページングの「${n}」`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    await expect(this.form, "ページを選んだあとの画面").toBeVisible();
  }

  /** 画面上部に出たメッセージ（成功・エラー） */
  async topMessages(): Promise<string[]> {
    const texts = await this.page.locator(".alert-success, .alert-danger, .alert-warning").allInnerTexts();
    return texts.map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効"));
  }
}
