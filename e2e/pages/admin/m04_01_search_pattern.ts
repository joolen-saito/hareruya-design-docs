/**
 * M04-01 在庫検索一覧の「検索条件保存」（検索パターン）の画面操作。
 * - 検索パターンの欄（検索パターン名・検索条件保存・検索条件削除・保存された検索パターン一覧）は、検索欄の下の「検索条件保存」の見出しを
 *   押すと開く折りたたみの中にある。検索パターンを選んでいる画面では、はじめから開いている。
 * - 保存された検索パターン一覧は、ログイン中の管理者の所属店舗で保存されたものだけを出す（アプリの検索欄の定義）。
 * - 一覧の検索パターンを押すと、その検索パターンの画面（アドレスの末尾が検索パターンID）へ移り、選んでいる検索パターンは
 *   リンクでなく印つきの文字で出る。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class StockSearchPatternPage {
  readonly form: Locator;
  readonly area: Locator;
  readonly toggle: Locator;
  readonly patternName: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#searchStockListForm");
    this.area = page.locator("#searchPatternArea");
    this.toggle = page.locator('[href="#searchPatternArea"]');
    this.patternName = page.locator("#admin_search_stock_list_pattern_name");
    this.saveButton = page.locator("#savePatternBtn");
    this.deleteButton = page.locator("#deletePatternBtn");
  }

  /** 在庫検索一覧画面を開く（検索条件の指定の無いアドレス。画面のスクリプトの読み込みまで待つ） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/product/stock"));
    expect(res?.status(), "在庫検索一覧画面の応答").toBe(200);
    await expect(this.form, "在庫検索一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 「検索条件保存」の折りたたみを開く（開いていればそのまま） */
  async showPatternArea(): Promise<void> {
    if (!(await this.area.isVisible())) {
      await this.toggle.click();
    }
    await expect(this.area, "検索条件保存の欄").toBeVisible();
    await expect(this.patternName, "検索パターン名の欄").toBeVisible();
  }

  /** 在庫区分のチェック欄（表示名「EC-CUBE」「スマレジ」） */
  stockZone(label: string): Locator {
    return this.form.locator('input[name="admin_search_stock_list[stock_zone][]"]')
      .and(this.page.getByLabel(label, { exact: true }));
  }

  /** 保存された検索パターン一覧の名前（選んでいるものも含む。表示の順） */
  async savedPatternNames(): Promise<string[]> {
    const items = this.area.locator(".row.g-2 > .col-4");
    return (await items.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 保存された検索パターン一覧のリンク（名前が一致するもの） */
  patternLink(name: string): Locator {
    return this.area.locator(".row.g-2 > .col-4 a").filter({ hasText: new RegExp(`^\\s*${escapeRe(name)}\\s*$`) });
  }

  /** 保存された検索パターン一覧で名前を押し、その検索パターンの画面へ移る。移った先のアドレスの検索パターンIDを返す */
  async choosePattern(name: string): Promise<string> {
    const link = this.patternLink(name);
    await expect(link, `保存された検索パターン一覧の「${name.length > 20 ? `${name.slice(0, 10)}…（${name.length}文字）` : name}」は1件`).toHaveCount(1);
    await Promise.all([this.page.waitForURL(/\/product\/stock\/pattern\/\d+$/), link.click()]);
    await this.page.waitForLoadState("load");
    return /\/pattern\/(\d+)$/.exec(this.page.url())![1];
  }

  /** 検索条件保存ボタンを押す。移った先（保存の結果の画面）の応答を待つ */
  async clickSave(): Promise<void> {
    await expect(this.saveButton, "検索条件保存ボタンが押せる").toBeEnabled();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.saveButton.click()]);
  }

  /** 検索条件削除ボタンを押す。移った先（削除の結果の画面）の応答を待つ */
  async clickDelete(): Promise<void> {
    await expect(this.deleteButton, "検索条件削除ボタンが押せる").toBeEnabled();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.deleteButton.click()]);
  }

  /** 画面上部のメッセージ（成功・エラー） */
  async messages(): Promise<{ success: string[]; error: string[] }> {
    const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return {
      success: await read(this.page.locator(".alert-success")),
      error: (await read(this.page.locator(".alert-danger"))).filter((t) => t !== "デバッグモードが有効になっています。"),
    };
  }
}

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 長い名前を記録に書くときの短い呼び方 */
export const shortName = (name: string) => (name.length > 20 ? `「${name.slice(0, 5)}…」（${name.length}文字）` : `「${name}」`);
