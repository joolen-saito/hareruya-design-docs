/** 配送方法設定（メニュー「設定」→「店舗設定」→「配送方法設定」）。M10-06 の画面操作。 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const LIST = "/setting/shop/delivery";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const nm = (n: string) => `[name="delivery[${n}]"]`;

export type 配送方法の入力 = { 配送業者名: string; 名称: string; 英語名称: string; 支払方法: string[]; 送料: string | null; 出荷指示から除外?: boolean };

export class DeliveryPage {
  constructor(readonly page: Page) {}

  async openList(): Promise<void> {
    await this.page.goto(adminUrl(LIST), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("li.sortable-item").first(), "配送方法一覧").toBeVisible({ timeout: 30_000 });
  }
  行(配送業者名: string): Locator {
    return this.page.locator("li.sortable-item").filter({ has: this.page.locator("a[href$='/edit']", { hasText: new RegExp(`^\\s*${esc(配送業者名)}\\s*/`) }) });
  }
  async 行のID(配送業者名: string): Promise<string> {
    return ((await this.行(配送業者名).locator("div.col-auto.d-flex").nth(1).innerText()) ?? "").trim();
  }
  /** 一覧で配送業者名のリンクを押して編集画面を開く */
  async 編集を開く(配送業者名: string): Promise<void> {
    await this.openList();
    await Promise.all([this.page.waitForLoadState("load"), this.行(配送業者名).locator("a[href$='/edit']").first().click({ timeout: 30_000 })]);
    await expect(this.page.locator(nm("name")), "配送方法の編集画面の配送業者名欄").toBeVisible({ timeout: 30_000 });
  }
  async 新規登録を開く(): Promise<void> {
    await this.page.goto(adminUrl(`${LIST}/new`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.page.locator(nm("name")), "配送方法の編集画面の配送業者名欄").toBeVisible({ timeout: 30_000 });
  }
  支払方法の箱(名称: string): Locator {
    return this.page.locator('input[type=checkbox][name="delivery[payments][]"]').and(this.page.getByRole("checkbox", { name: 名称, exact: true }));
  }
  async 支払方法を選ぶ(名称: string, 選ぶ: boolean): Promise<void> {
    const 箱 = this.支払方法の箱(名称);
    await expect(箱, `支払方法「${名称}」のチェックボックス`).toHaveCount(1, { timeout: 30_000 });
    await 箱.setChecked(選ぶ, { timeout: 30_000 });
  }
  async 選ばれた支払方法(): Promise<string[]> {
    return this.page.locator('input[type=checkbox][name="delivery[payments][]"]').evaluateAll((ns) => (ns as HTMLInputElement[]).filter((n) => n.checked).map((n) => n.labels?.item(0)?.textContent?.trim() ?? n.value));
  }
  async 全部の支払方法(): Promise<string[]> {
    return this.page.locator('input[type=checkbox][name="delivery[payments][]"]').evaluateAll((ns) => (ns as HTMLInputElement[]).map((n) => n.labels?.item(0)?.textContent?.trim() ?? n.value));
  }
  get 除外の箱() { return this.page.locator(nm("is_shipping_standby_list_exclusion")); }
  /** 送料を47都道府県すべてに同じ額で足す（画面の「新規登録」の行を47回使う） */
  async 全都道府県の送料を足す(送料: string): Promise<void> {
    const sel = this.page.locator("#add-delivery-fee-pref");
    const ids = await sel.locator("option").evaluateAll((os) => (os as HTMLOptionElement[]).map((o) => o.value).filter((v) => v));
    for (const id of ids) {
      await sel.selectOption(id, { timeout: 30_000 });
      await this.page.locator("#add-delivery-fee-value").fill(送料, { timeout: 30_000 });
      await this.page.locator("#add-delivery-fee-button").click({ timeout: 30_000 });
    }
    await expect(this.page.locator("#delivery-fee-group .delivery-fee-item"), "追加した都道府県別送料の行").toHaveCount(ids.length, { timeout: 30_000 });
  }
  async 登録を押す(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator("#delivery-registration-button").click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async 作る(v: 配送方法の入力): Promise<string> {
    await this.新規登録を開く();
    await this.page.locator(nm("name")).fill(v.配送業者名, { timeout: 30_000 });
    await this.page.locator(nm("service_name")).fill(v.名称, { timeout: 30_000 });
    await this.page.locator(nm("service_name_en")).fill(v.英語名称, { timeout: 30_000 });
    if (v.出荷指示から除外) await this.除外の箱.setChecked(true, { timeout: 30_000 });
    for (const p of v.支払方法) await this.支払方法を選ぶ(p, true);
    if (v.送料 !== null) await this.全都道府県の送料を足す(v.送料);
    await this.登録を押す();
    await expectSaved(this.page, `配送方法「${v.配送業者名}」の登録`);
    await this.openList();
    return this.行のID(v.配送業者名);
  }
  /** 一覧の行の削除→確認モーダル */
  async 削除を押す(配送業者名: string): Promise<string> {
    await this.page.waitForLoadState("load");
    await this.行(配送業者名).locator('a[data-bs-target="#DeleteModal"]').click({ timeout: 30_000 });
    const modal = this.page.locator("#DeleteModal");
    await expect(modal, "削除確認モーダル").toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await modal.locator('a.btn-ec-delete[data-method="delete"]').getAttribute("href")) ?? "#", "削除の送り先").toMatch(/delivery\/\d+\/delete/);
    return ((await modal.locator("p.modal-message").innerText()) ?? "").trim();
  }
  async モーダルで削除する(): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator('#DeleteModal a.btn-ec-delete[data-method="delete"]').click({ timeout: 30_000 })]);
    await this.page.waitForLoadState("load");
  }
  async モーダルでキャンセルする(): Promise<void> {
    await this.page.locator('#DeleteModal .modal-footer button[data-bs-dismiss="modal"]').click({ timeout: 30_000 });
    await expect(this.page.locator("#DeleteModal"), "削除確認モーダルが閉じる").toBeHidden({ timeout: 30_000 });
  }

  // ---- 基本情報・送料・お届け時間・並べ替え（M10-06 の残りのケース） ----

  /** 基本情報の欄に入れる（指定したものだけ） */
  async 基本情報を入れる(v: { 配送業者名?: string; 名称?: string; 英語名称?: string; 伝票URL?: string; 上限サイズ?: string }): Promise<void> {
    if (v.配送業者名 !== undefined) await this.page.locator(nm("name")).fill(v.配送業者名, { timeout: 30_000 });
    if (v.名称 !== undefined) await this.page.locator(nm("service_name")).fill(v.名称, { timeout: 30_000 });
    if (v.英語名称 !== undefined) await this.page.locator(nm("service_name_en")).fill(v.英語名称, { timeout: 30_000 });
    if (v.伝票URL !== undefined) await this.page.locator(nm("confirm_url")).fill(v.伝票URL, { timeout: 30_000 });
    if (v.上限サイズ !== undefined) await this.page.locator(nm("max_size")).fill(v.上限サイズ, { timeout: 30_000 });
  }
  async 基本情報を読む(): Promise<{ 名称: string; 英語名称: string; 伝票URL: string; 上限サイズ: string }> {
    const v = (n: string) => this.page.locator(nm(n)).inputValue({ timeout: 30_000 });
    return { 名称: await v("service_name"), 英語名称: await v("service_name_en"), 伝票URL: await v("confirm_url"), 上限サイズ: await v("max_size") };
  }
  get 国外配送の箱() { return this.page.locator(nm("is_abroad")); }

  /** 一覧の行の配送業者名のリンクのアドレスの配送方法ID（行のID欄と見比べる） */
  async 行のリンクのID(配送業者名: string): Promise<string> {
    const href = (await this.行(配送業者名).locator("a[href$='/edit']").first().getAttribute("href", { timeout: 30_000 })) ?? "";
    return /\/delivery\/(\d+)\/edit/.exec(href)?.[1] ?? "";
  }

  /** 編集画面のまま（登録の確認画面や一覧に移っていない）か */
  async 編集画面か(): Promise<boolean> {
    return /\/setting\/shop\/delivery\/(new|\d+\/edit)$/.test(new URL(this.page.url()).pathname) && (await this.page.locator(nm("name")).isVisible());
  }

  // お届け時間
  async お届け時間を足す(名前: string): Promise<void> {
    await this.page.locator("#add-delivery-time-value").fill(名前, { timeout: 30_000 });
    await this.page.locator("#add-delivery-time-button").click({ timeout: 30_000 });
  }
  async お届け時間の一覧(): Promise<string[]> {
    return this.page.locator('#delivery-time-group input[name*="[delivery_time]"]').evaluateAll((ns) => (ns as HTMLInputElement[]).map((n) => n.value));
  }

  // 都道府県別送料
  get 送料の行() { return this.page.locator("#delivery-fee-group li.delivery-fee-item"); }
  /** 追加用の欄に入れて「新規登録」を押す（地域は表示名で選ぶ。null なら選ばない） */
  async 送料の行を足す(v: { 地域: string | null; サイズ?: string; 送料?: string }): Promise<void> {
    if (v.地域 !== null) await this.page.locator("#add-delivery-fee-pref").selectOption({ label: v.地域 }, { timeout: 30_000 });
    if (v.サイズ !== undefined) await this.page.locator("#add-delivery-fee-size").fill(v.サイズ, { timeout: 30_000 });
    if (v.送料 !== undefined) await this.page.locator("#add-delivery-fee-value").fill(v.送料, { timeout: 30_000 });
    await this.page.locator("#add-delivery-fee-button").click({ timeout: 30_000 });
  }
  /** 追加用の欄の下の赤い注意（地域・送料の入力漏れ） */
  async 追加欄のエラー(): Promise<string> {
    return ((await this.page.locator("#add-delivery-fee-form-error").textContent()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 送料の行の表示（地域・サイズ・送料。送料は桁区切りを外した数字）を、画面の並びのまま読む */
  async 送料の行を読む(): Promise<{ 地域: string; サイズ: string; 送料: string }[]> {
    return this.送料の行.evaluateAll((ns) => ns.map((n) => {
      const t = (c: string) => (n.querySelector(c)?.textContent ?? "").trim();
      return { 地域: t(".display-label-pref"), サイズ: t(".display-label-size"), 送料: t(".display-label-fee").replace(/,/g, "") };
    }));
  }
  /** 地域（とサイズ）の行。サイズを指定しなければ、その地域の最初の行 */
  送料の行の絞り込み(地域: string, サイズ?: string): Locator {
    let l = this.送料の行.filter({ has: this.page.locator(".display-label-pref", { hasText: new RegExp(`^\\s*${esc(地域)}\\s*$`) }) });
    if (サイズ !== undefined) l = l.filter({ has: this.page.locator(".display-label-size", { hasText: new RegExp(`^\\s*${esc(サイズ)}\\s*$`) }) });
    return l;
  }
  /** 行の鉛筆を押して入力欄を出す */
  async 送料の行を編集にする(行: Locator): Promise<void> {
    await 行.locator("a.action-edit").click({ timeout: 30_000 });
    await expect(行.locator(".mode-edit"), "送料の行の入力欄").toBeVisible({ timeout: 30_000 });
  }
  /** 行の入力欄（サイズ・送料）。入力欄の種類を数値からテキストに書き換えて、数値でない値も入れられるようにする */
  async 行の入力欄をテキストにして入れる(行: Locator, 欄: "size" | "fee", 値: string): Promise<void> {
    const input = 行.locator(`input[name*="[${欄}]"]`);
    await input.evaluate((n) => (n as HTMLInputElement).setAttribute("type", "text"));
    await input.fill(値, { timeout: 30_000 });
  }
  async 行の入力欄に入れる(行: Locator, 欄: "size" | "fee", 値: string): Promise<void> {
    await 行.locator(`input[name*="[${欄}]"]`).fill(値, { timeout: 30_000 });
  }
  /** 行の×を押して削除の確認モーダルを開き、その文（<br>を改行にしたもの）を返す */
  async 送料の行の削除を押す(行: Locator): Promise<string> {
    await 行.locator(".remove-delivery-fee-item").click({ timeout: 30_000 });
    const modal = this.page.locator("#delivery-fee-delete-modal");
    await expect(modal, "送料の行の削除確認モーダル").toBeVisible({ timeout: 30_000 });
    return (await modal.locator("p.modal-message").evaluate((n) => (n as HTMLElement).innerHTML.replace(/<br\s*\/?>/g, "\n"))).trim();
  }
  async 送料の行の削除を確定する(): Promise<void> {
    await this.page.locator("#delivery-fee-delete-confirm").click({ timeout: 30_000 });
    await expect(this.page.locator("#delivery-fee-delete-modal"), "送料の行の削除確認モーダルが閉じる").toBeHidden({ timeout: 30_000 });
  }

  // 一覧の並べ替え
  /** 一覧の並び（配送業者名のリンクの前半。上から） */
  async 一覧の並び(): Promise<string[]> {
    const t = await this.page.locator("li.sortable-item a[href$='/edit']").allInnerTexts();
    return t.map((x) => x.replace(/\s+/g, " ").trim().split(" / ")[0]);
  }
  /** 行のつまみ（三本線）から、別の行の上端へドラッグして放す。「並び順を変更しますか？」のモーダルが出るまで */
  async 上へドラッグする(配送業者名: string, 上の行の配送業者名: string): Promise<void> {
    const handle = this.行(配送業者名).locator("i.fa-bars");
    const target = this.行(上の行の配送業者名);
    await target.scrollIntoViewIfNeeded();
    await handle.scrollIntoViewIfNeeded();
    const h = (await handle.boundingBox())!;
    await this.page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 - 5, { steps: 5 });
    const t = (await target.boundingBox())!;
    await this.page.mouse.move(h.x + h.width / 2, t.y + 3, { steps: 20 });
    await this.page.mouse.up();
    await expect(this.page.locator("#ConfirmModal"), "並び順を変更しますか？のモーダル").toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator("#ConfirmModal p.modal-message"), "並べ替えの確認の文").toHaveText("並び順を変更しますか？", { timeout: 10_000 });
  }
  async 並べ替えを確定する(): Promise<void> {
    const saved = this.page.waitForResponse((r) => r.url().includes("/setting/shop/delivery/sort_no/move"), { timeout: 30_000 });
    await this.page.locator("#ConfirmModal .btn-confirm").click({ timeout: 30_000 });
    await saved;
    await expect(this.page.locator("#ConfirmModal"), "並べ替えの確認のモーダルが閉じる").toBeHidden({ timeout: 30_000 });
  }
  async 並べ替えをキャンセルする(): Promise<void> {
    await this.page.locator('#ConfirmModal .modal-footer button[data-bs-dismiss="modal"]').click({ timeout: 30_000 });
    await expect(this.page.locator("#ConfirmModal"), "並べ替えの確認のモーダルが閉じる").toBeHidden({ timeout: 30_000 });
  }
}
