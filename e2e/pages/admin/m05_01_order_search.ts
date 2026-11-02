/**
 * M05-01 受注情報検索 一覧(検索入力)の画面操作。セレクタはここにだけ書く。
 * - 検索パターンの欄（検索パターン名・検索条件保存・検索パターン削除）は「詳細検索」の折りたたみの中。検索パターンを選んでいる画面では、はじめから開いている。
 * - 検索パターンのリンクは、検索フォームと検索結果の間に名前の昇順で並ぶ。選んでいる検索パターンはリンクでなく文字で出る。
 * - 検索パターンを選ぶと、アドレスの末尾が検索パターンIDの画面へ移る。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class OrderSearchPage {
  readonly form: Locator;
  readonly orderNumber: Locator;
  readonly patternName: Locator;
  readonly name: Locator;
  readonly kana: Locator;
  readonly email: Locator;
  readonly tenants: Locator;
  readonly detail: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly searchButton: Locator;
  readonly patternBlock: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#search_form");
    this.orderNumber = page.locator("#admin_search_order_order_number");
    this.patternName = page.locator("#admin_search_order_pattern_name");
    this.name = page.locator("#admin_search_order_name");
    this.kana = page.locator("#admin_search_order_kana");
    this.email = page.locator("#admin_search_order_email");
    this.tenants = page.locator("#admin_search_order_tenants");
    this.detail = page.locator("#searchDetail");
    this.saveButton = page.locator("#save_pattern");
    this.deleteButton = page.locator("#delete_pattern");
    this.searchButton = page.locator("#search_submit");
    this.patternBlock = page.locator("div.c-outsideBlock__contents:has(#reload_all_pattern)");
  }

  /** 受注情報検索 一覧(検索入力)画面を開く（検索条件の指定の無いアドレス。画面のスクリプトの読み込みまで待つ） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order"));
    expect(res?.status(), "受注情報検索 一覧(検索入力)画面の応答").toBe(200);
    await expect(this.form, "受注一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 詳細検索条件が表示されていなければ、開閉ボタン（1つ目）を押して表示する。押したかを返す */
  async showDetail(): Promise<boolean> {
    if (await this.detail.isVisible()) return false;
    await this.page.locator('button[data-bs-target="#searchDetail"]').first().click();
    await expect(this.patternName, "詳細検索条件の検索パターン名の欄").toBeVisible();
    return true;
  }

  /** 検索パターンのリンクの並び（名前だけ。表示の順。選んでいるものも含む） */
  async patternNames(): Promise<string[]> {
    const items = this.patternBlock.locator(".row.mb-3 > .col-3");
    const texts = await items.allInnerTexts();
    return texts.map((t) => t.replace(/\s+/g, " ").trim().replace(/\s*\([^)]*\)\s*$/, "").trim()).filter(Boolean);
  }

  /** 検索パターンのリンク（名前が一致するもの） */
  patternLink(name: string): Locator {
    return this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']").filter({ hasText: new RegExp(`^\\s*${escapeRe(name)}\\s*(\\(.*\\))?\\s*$`) });
  }

  /** 検索パターンの並びの1件（名前が一致するもの。リンクの外の更新アイコンも含む） */
  patternItem(name: string): Locator {
    return this.patternBlock.locator(".row.mb-3 > .col-3").filter({ hasText: new RegExp(`^\\s*${escapeRe(name)}\\s*(\\(.*\\))?\\s*$`) });
  }

  /** 検索パターンのリンクを押して選ぶ。移った先のアドレスの検索パターンIDを返す */
  async choosePattern(name: string): Promise<string> {
    const link = this.patternLink(name);
    await expect(link, `検索パターンのリンク「${name}」は1件`).toHaveCount(1);
    await Promise.all([this.page.waitForURL(/\/order\/search\/pattern\/\d+$/), link.click()]);
    await this.page.waitForLoadState("load");
    return /\/pattern\/(\d+)$/.exec(this.page.url())![1];
  }

  /** 検索パターン保存ボタンを押す。移った先の応答を待つ */
  async clickSave(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.saveButton.click()]);
  }

  /** 検索パターン削除ボタンを押す。移った先の応答を待つ */
  async clickDelete(): Promise<void> {
    await expect(this.deleteButton, "検索パターン削除ボタン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.deleteButton.click()]);
  }

  /** 検索するボタンを押し、結果の件数の表示まで待つ */
  async clickSearch(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.searchButton.click()]);
    await expect(this.page.locator("#search_total_count"), "検索結果の件数の表示").toBeVisible();
  }

  /** 検索条件を入れて保存する（検索パターンを選んでいない状態から）。保存後の画面（選んだ状態）へ移る */
  async savePattern(v: { 注文番号?: string; お名前?: string; フリガナ?: string; メール?: string; パターン名: string }): Promise<void> {
    await this.open();
    if (v.注文番号 !== undefined) await this.orderNumber.fill(v.注文番号);
    await this.showDetail();
    if (v.お名前 !== undefined) await this.name.fill(v.お名前);
    if (v.フリガナ !== undefined) await this.kana.fill(v.フリガナ);
    if (v.メール !== undefined) await this.email.fill(v.メール);
    await this.patternName.fill(v.パターン名);
    await this.clickSave();
    await expect(this.page.locator(".alert-success"), `検索パターン「${v.パターン名}」の保存`).toContainText("検索条件を保存しました");
  }

  /** 名前の検索パターンがあれば、選んで削除する（無ければ何もしない） */
  async removePatternIfExists(name: string): Promise<boolean> {
    await this.open();
    if ((await this.patternLink(name).count()) === 0) return false;
    await this.choosePattern(name);
    await this.clickDelete();
    return true;
  }

  /**
   * 注文番号の欄に値が入る検索パターンを、すべて確かめて削除する。削除した数を返す。
   * 同じ名前の検索パターンが複数ありうるので、名前でなく並びの番号で1件ずつ選ぶ（削除したときだけ並びが詰まる）。
   */
  async removePatternsWithOrderNumber(value: string): Promise<number> {
    await this.open();
    const total = await this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']").count();
    let removed = 0;
    for (let i = 0; i < total; i++) {
      await this.open();
      const links = this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']");
      const n = await links.count();
      const idx = i - removed;
      if (idx >= n) break;
      await Promise.all([this.page.waitForURL(/\/order\/search\/pattern\/\d+$/), links.nth(idx).click()]);
      await this.page.waitForLoadState("load");
      if ((await this.orderNumber.inputValue()) === value) {
        await this.clickDelete();
        removed++;
      }
    }
    return removed;
  }

  /** 検索パターンのリンクをすべて削除する（見えている範囲）。削除した数を返す */
  async removeAllPatterns(): Promise<number> {
    let removed = 0;
    for (let i = 0; i < 200; i++) {
      await this.open();
      const links = this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']");
      if ((await links.count()) === 0) return removed;
      await Promise.all([this.page.waitForURL(/\/order\/search\/pattern\/\d+$/), links.first().click()]);
      await this.page.waitForLoadState("load");
      await this.clickDelete();
      removed++;
    }
    throw new Error("検索パターンが200回削除しても無くならない");
  }

  /** 画面上部のメッセージ（成功・エラー） */
  async messages(): Promise<{ success: string[]; error: string[] }> {
    const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return {
      success: await read(this.page.locator(".alert-success")),
      error: (await read(this.page.locator(".alert-danger"))).filter((t) => t !== "デバッグモードが有効になっています。"),
    };
  }

  /** 検索パターンの更新アイコンが指す検索パターンIDを書き換える（開発者ツールでの書き換えと同じ） */
  async rewriteReloadTarget(name: string, newId: string): Promise<void> {
    const item = this.patternItem(name);
    const btn = item.locator("button.get_count_pattern");
    await expect(btn, `検索パターン「${name}」の更新アイコン`).toHaveCount(1);
    await btn.evaluate((el, id) => {
      el.setAttribute("data-pattern-id", id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jq = (window as any).jQuery;
      if (jq) jq(el).data("pattern-id", id);
    }, newId);
  }

  /** 検索パターンの更新アイコンを押す */
  async pressReload(name: string): Promise<void> {
    const item = this.patternItem(name);
    await item.locator("button.get_count_pattern").click();
  }

  /** 検索パターンの該当件数欄の文字（「*」など） */
  async countText(name: string): Promise<string> {
    const item = this.patternItem(name);
    return ((await item.locator("a span[id^='pattern_id_']").innerText()) ?? "").trim();
  }
}
