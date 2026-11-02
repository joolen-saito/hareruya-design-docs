/** M05-27 店頭注文番号札管理（メニュー「受注管理」→「店頭注文番号札管理」）と、試験管理者の編集可能店舗の設定 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { findMemberId } from "./member";

export class WaitingTagPage {
  constructor(private readonly page: Page) { page.setDefaultTimeout(60_000); }
  private get shopSelect() { return this.page.locator("#waiting_tag_BaseInfo"); }
  private get tagInput() { return this.page.locator("#waiting_tag_waiting_tag"); }
  get 登録ボタン() { return this.page.locator('#add_new_waiting_tag button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }); }

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order/waiting_tag"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "店頭注文番号札管理画面の応答").toBeLessThan(400);
    await expect(this.shopSelect, "検索店舗の選択欄").toBeVisible();
  }

  async 検索店舗の店名(): Promise<string> {
    return ((await this.shopSelect.locator("option:checked").textContent()) ?? "").trim();
  }
  async 検索店舗の店舗ID(): Promise<string> { return this.shopSelect.inputValue(); }

  /** 検索店舗を店名で選ぶ（選ぶと、その店舗の一覧で画面が作り直される） */
  async 検索店舗を選ぶ(店名: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.shopSelect.selectOption({ label: 店名 }),
    ]);
    await this.page.waitForLoadState("load");
    expect(await this.検索店舗の店名(), `検索店舗が「${店名}」になった`).toBe(店名);
  }

  /** 開発者ツールで、検索店舗の選択欄の選択値だけを店舗IDに書き換える（再検索は走らせない） */
  async 検索店舗の選択値を書き換える(店舗ID: string): Promise<void> {
    await this.shopSelect.evaluate((node, id) => {
      const s = node as HTMLSelectElement;
      if (!Array.from(s.options).some((o) => o.value === id)) {
        const o = document.createElement("option"); o.value = id; o.textContent = id; s.appendChild(o);
      }
      s.value = id;
    }, 店舗ID);
  }

  /** 店頭注文番号札に値を入れて登録ボタンを押し、結果の画面の読み込みを待つ */
  async 登録する(札: string): Promise<{ 成功の表示: boolean; エラーの表示: string[] }> {
    await this.tagInput.fill(札);
    await expect(this.登録ボタン.first(), "登録ボタン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), this.登録ボタン.first().click()]);
    await this.page.waitForLoadState("load");
    const ok = await this.page.locator(".alert-success").count();
    const ng = (await this.page.locator(".alert-danger, .invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { 成功の表示: ok > 0, エラーの表示: ng };
  }

  /** 一覧に表示されている番号札（上から） */
  async 一覧の番号札(): Promise<string[]> {
    return (await this.page.locator("tbody.sortable-container tr.sortable-item td:first-child").allInnerTexts()).map((t) => t.trim());
  }

  /** 番号札の行の削除ボタンに設定されたURLに含まれる番号（番号札ID）。開発者ツールで読む */
  async 番号札ID(札: string): Promise<string> {
    const row = this.page.locator("tbody.sortable-container tr.sortable-item").filter({ has: this.page.locator("td:first-child", { hasText: new RegExp(`^\\s*${札}\\s*$`) }) });
    await expect(row, `一覧に番号札「${札}」の行が1行`).toHaveCount(1);
    const url = (await row.locator("[data-url]").first().getAttribute("data-url")) ?? "";
    const m = /\/waiting_tag\/(\d+)\/delete/.exec(url);
    if (!m) throw new Error(`番号札「${札}」の削除ボタンのURLから番号札IDを読めない（${url}）`);
    return m[1];
  }
}

/**
 * 管理者の所属店舗・デフォルト検索表示店舗・編集可能店舗を、メンバー編集画面で設定する（店舗IDで選ぶ）。
 * デフォルト検索表示店舗の選択肢は、所属店舗の選択に合わせて画面のスクリプトが作り直すので、所属店舗をデフォルト検索表示店舗と同じにする。
 */
export async function setMemberStores(page: Page, 名前: string, v: { 店舗ID: string; 編集可能店舗ID: string[] }): Promise<void> {
  const id = await findMemberId(page, 名前);
  if (!id) throw new Error(`メンバー「${名前}」がいない`);
  await page.goto(adminUrl(`/setting/system/member/${id}/edit`));
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="admin_member[${name}]"]`);
  await expect(f("name"), `メンバー編集画面（${名前}）`).toBeVisible();
  await f("baseInfo").selectOption(v.店舗ID);
  await page.locator('[name="admin_member[editableBaseInfos][]"]').selectOption(v.編集可能店舗ID);
  await page.waitForTimeout(500);
  await f("defaultSearchBaseInfo").selectOption(v.店舗ID);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.getByRole("button", { name: "登録", exact: true }).click()]);
  await expectSaved(page, `メンバー「${名前}」の編集可能店舗の設定`);
}
