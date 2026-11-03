/**
 * M08-12 顧客グループ管理の画面操作。セレクタはここにだけ書く。
 * - 同じ画面に入力フォーム（新規追加／編集の状態）と顧客グループの一覧がある。登録後は新規追加の状態の画面へ戻る。
 * - 削除は、一覧の行の「削除」ボタンで確認のモーダルを出し、モーダルの「削除」を押す（ブラウザの確認ダイアログではなく画面内のモーダル）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class M08CustomerGroupPage {
  readonly form: Locator;
  readonly name: Locator;
  readonly percentage: Locator;
  readonly shopFront: Locator;
  readonly branchFront: Locator;
  readonly registerButton: Locator;

  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    this.form = page.locator("form#customer-mail-form");
    this.name = page.locator("#admin_customer_group_name");
    this.percentage = page.locator("#admin_customer_group_point_percentage");
    this.shopFront = page.locator("#admin_customer_group_shop_front_flg");
    this.branchFront = page.locator("#admin_customer_group_branch_shop_front_flg");
    this.registerButton = this.form.locator('button[type=submit]');
  }

  /** 顧客グループ管理画面を開く（新規追加の状態） */
  async open(): Promise<number> {
    const res = await this.page.goto(adminUrl("/customer/customer_group"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    if (res?.status() === 200) await expect(this.name, "顧客グループ管理の入力フォーム").toBeVisible({ timeout: T });
    return res?.status() ?? 0;
  }

  /** いまのアドレスの末尾の顧客グループID（編集状態なら）。新規追加の状態なら null */
  idInUrl(): string | null { return /\/customer\/customer_group\/(\d+)/.exec(new URL(this.page.url()).pathname)?.[1] ?? null; }

  async 新規追加の状態か(): Promise<boolean> {
    return this.idInUrl() === null && (await this.name.inputValue()) === "";
  }

  async 入れる(v: { 名称?: string; 還元率?: string; 店内注文専用?: boolean; 支店店内注文専用?: boolean }): Promise<void> {
    if (v.名称 !== undefined) await this.name.fill(v.名称, { timeout: T });
    if (v.還元率 !== undefined) await this.percentage.fill(v.還元率, { timeout: T });
    if (v.店内注文専用 !== undefined) await this.shopFront.setChecked(v.店内注文専用, { timeout: T });
    if (v.支店店内注文専用 !== undefined) await this.branchFront.setChecked(v.支店店内注文専用, { timeout: T });
  }

  /** 登録ボタンを押す。ブラウザの入力チェックで止まったときは sent=false。応答のステータスも返す */
  async 登録する(): Promise<{ sent: boolean; status: number | null }> {
    const before = this.page.url();
    const respP = this.page.waitForResponse((r) => r.request().resourceType() === "document" && r.request().method() === "POST", { timeout: 15_000 }).then((r) => r.status(), () => null);
    await this.registerButton.click({ timeout: T });
    const status = await respP;
    if (status !== null) await this.page.waitForLoadState("load");
    return { sent: status !== null || this.page.url() !== before, status };
  }

  /** 一覧の行（名称のリンクがある行）。名称は完全一致 */
  rowByName(名称: string): Locator {
    return this.page.locator("table tbody tr").filter({ has: this.page.locator("td a", { hasText: new RegExp(`^\\s*${esc(名称)}\\s*$`) }) });
  }
  rowById(id: string): Locator {
    return this.page.locator("table tbody tr").filter({ has: this.page.locator(`td a[href$="/customer/customer_group/${id}"]`) });
  }

  /** 一覧の名称リンクを押して編集の状態にし、アドレスの末尾の顧客グループIDを返す */
  async 名称リンクを押してIDを読む(名称: string): Promise<string> {
    const row = this.rowByName(名称);
    await expect(row, `一覧に名称「${名称}」の行が1つある`).toHaveCount(1, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), row.locator("td a").first().click({ timeout: T })]);
    await this.page.waitForLoadState("load");
    const id = this.idInUrl();
    if (!id) throw new Error(`名称「${名称}」の名称リンクを押したが、アドレスの末尾に顧客グループIDが出ない（${this.page.url()}）`);
    return id;
  }

  /** 名称で一覧から探して、削除ボタン→モーダルの削除で消す（無ければ何もしない）。消した数を返す */
  async 名称で消す(名称: string): Promise<number> {
    let n = 0;
    for (let i = 0; i < 20; i++) {
      await this.open();
      const rows = this.rowByName(名称);
      if ((await rows.count()) === 0) return n;
      const id = (/customer_group\/(\d+)/.exec((await rows.first().locator("td a").first().getAttribute("href")) ?? ""))?.[1];
      if (!id) throw new Error(`名称「${名称}」の行から顧客グループIDを読めない`);
      await this.削除ボタンを押す(id);
      await this.モーダルで削除する(id);
      n++;
    }
    throw new Error(`名称「${名称}」の顧客グループが消えない`);
  }

  /** 一覧の行の「削除」ボタンを押し、確認のモーダルを出す */
  async 削除ボタンを押す(id: string): Promise<void> {
    const row = this.rowById(id);
    await expect(row, `一覧に顧客グループID ${id} の行が1つある`).toHaveCount(1, { timeout: T });
    await row.locator(`a[data-bs-target="#delete_${id}"]`).click({ timeout: T });
    await expect(this.page.locator(`#delete_${id}`), "削除の確認モーダル").toBeVisible({ timeout: T });
  }

  /** 削除の確認モーダルの「削除」を押す。削除要求の応答のステータスを返す */
  async モーダルで削除する(id: string): Promise<number | null> {
    const respP = this.page.waitForResponse((r) => r.request().resourceType() === "document" && /\/customer_group\/\d+\/delete/.test(r.url()), { timeout: 60_000 }).then((r) => r.status(), () => null);
    await this.page.locator(`#delete_${id} a.btn-ec-delete`).click({ timeout: T });
    const s = await respP;
    await this.page.waitForLoadState("load");
    return s;
  }

  get flashes(): Locator { return this.page.locator(".alert"); }
}
