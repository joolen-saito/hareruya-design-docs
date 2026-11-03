/**
 * M08-01 会員検索一覧（検索入力・検索結果）の画面操作。セレクタはここにだけ書く。
 * - 検索パターンの欄（検索パターン名・検索条件保存・検索パターン削除）は「詳細検索」の折りたたみの中。検索パターンで検索した画面では、はじめから開いている。
 * - 検索パターンのリンクは、検索欄と検索結果の間に並ぶ。選ぶと、アドレスの末尾が検索パターンIDの画面へ移る。
 * - 会員の削除は、結果の行の「…」メニューの「削除」→確認のモーダルの「削除」（ブラウザの確認ダイアログではなく、画面内のモーダル）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class M08CustomerListPage {
  readonly form: Locator;
  readonly multi: Locator;
  readonly detail: Locator;
  readonly detailToggle: Locator;
  readonly patternName: Locator;
  readonly closeReason: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;

  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    this.form = page.locator("form#search_form");
    this.multi = page.locator("#admin_search_customer_multi");
    this.detail = page.locator("#searchDetail");
    this.detailToggle = page.locator('[data-bs-toggle="collapse"][href="#searchDetail"]');
    this.patternName = page.locator("#admin_search_customer_pattern_name");
    this.closeReason = page.locator("#admin_search_customer_close_reason");
    this.saveButton = page.locator('button.submit[data-action$="/customer/save/pattern"]');
    this.deleteButton = page.locator('button.submit[data-method="delete"]');
  }

  /** 会員検索一覧(検索入力)画面を開く（検索条件の指定の無いアドレス） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/customer"), { timeout: 60_000 });
    expect(res?.status(), "会員検索一覧(検索入力)画面の応答").toBe(200);
    await expect(this.form, "会員検索一覧の検索欄").toBeVisible({ timeout: T });
    await this.page.waitForLoadState("load");
  }

  async 詳細検索が開いているか(): Promise<boolean> { return this.detail.isVisible(); }

  /** 詳細検索が閉じていれば開閉ボタンで開く */
  async showDetail(): Promise<void> {
    if (await this.detail.isVisible()) return;
    await this.detailToggle.click({ timeout: T });
    await expect(this.patternName, "詳細検索の検索パターン名の欄").toBeVisible({ timeout: T });
  }

  /** 検索条件の開閉ボタンを1回押し、開閉の動き（アニメーション）が終わるのを待つ */
  async toggleDetail(): Promise<void> {
    await this.detailToggle.click({ timeout: T });
    await this.page.waitForFunction(() => { const e = document.querySelector("#searchDetail"); return !!e && !e.classList.contains("collapsing"); }, undefined, { timeout: T });
  }

  /** 会員ID・メールアドレス・お名前に入れて検索する（結果の画面まで待つ） */
  async searchMulti(語: string): Promise<void> {
    await this.multi.fill(語, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.form.locator('button[type=submit]').filter({ hasText: "検索" }).first().click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  row(会員ID: string): Locator { return this.page.locator(`tr#ex-customer-${会員ID}`); }

  /** 結果の行の「…」メニューから「削除」を選び、削除の確認のモーダルを出す（ブラウザの確認ダイアログではなく画面内のモーダル） */
  async 削除リンクを押す(会員ID: string): Promise<void> {
    const row = this.row(会員ID);
    await expect(row, `検索結果に会員ID ${会員ID} の行がある`).toHaveCount(1, { timeout: T });
    await row.locator("i.dropdown-menu-toggle").click({ timeout: T });
    await row.locator(`a[data-bs-target="#discontinuance-${会員ID}"]`).click({ timeout: T });
    await expect(this.page.locator(`#discontinuance-${会員ID}`), "削除の確認モーダル").toBeVisible({ timeout: T });
  }

  /** 削除の確認のモーダルの「削除」を押す（押したあとの会員一覧の画面まで待つ） */
  async 確認モーダルで削除する(会員ID: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator(`#discontinuance-${会員ID} a.btn-ec-delete`).click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- 検索パターン ----
  patternLinks(): Locator { return this.page.locator('a[href*="/customer/pattern/"]'); }

  /** 検索パターンの欄に並んでいる名前（選んでいるものはリンクでなく文字で出るので、ここには出ない） */
  async patternLinkNames(): Promise<string[]> {
    return (await this.patternLinks().allInnerTexts()).map((t) => t.trim());
  }

  /** 名前の検索パターンを押して、その画面へ移る。移った画面の検索パターンID（アドレスの末尾の番号）を返す */
  async selectPattern(名前: string): Promise<string> {
    const link = this.patternLinks().filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) });
    await expect(link, `検索パターン「${名前}」のリンクが1つある`).toHaveCount(1, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      link.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return this.patternIdInUrl() ?? "";
  }

  patternIdInUrl(): string | null {
    return /\/customer\/pattern\/(\d+)/.exec(new URL(this.page.url()).pathname)?.[1] ?? null;
  }

  /** 検索パターン名と退会区分を入れて、検索条件保存ボタンを押す（保存後の画面まで待つ） */
  async savePattern(名前: string, 退会区分?: string): Promise<void> {
    await this.showDetail();
    await this.patternName.fill(名前, { timeout: T });
    if (退会区分 !== undefined) await this.closeReason.fill(退会区分, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.saveButton.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 検索パターンを選んでいる画面で、検索パターン削除ボタンを押し、確認ダイアログのOKを押す。ダイアログの文を返す */
  async deletePattern(): Promise<string> {
    const { 文, OKを押す } = await this.削除ボタンを押す();
    await OKを押す();
    return 文;
  }

  /** 検索パターン削除ボタンを押す。確認ダイアログが開いた状態で返す（手順を「押す」と「OKを押す」に分けるため） */
  async 削除ボタンを押す(): Promise<{ 文: string; OKを押す: () => Promise<void> }> {
    await this.showDetail();
    const dialogP = this.page.waitForEvent("dialog", { timeout: T });
    const clickP = this.deleteButton.click({ timeout: T });
    clickP.catch(() => {});
    const dialog = await dialogP;
    return {
      文: dialog.message(),
      OKを押す: async () => {
        const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
        await dialog.accept();
        await clickP;
        await nav;
        await this.page.waitForLoadState("load");
      },
    };
  }

  get flashes(): Locator { return this.page.locator(".alert"); }
}
