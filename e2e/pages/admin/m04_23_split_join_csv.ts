/**
 * M04-23 在庫分割結合CSV登録の画面操作。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - 在庫分割結合検索/一覧の上部の「在庫分割結合」の枠に「在庫分割CSV登録」「在庫結合CSV登録」のボタンがあり、
 *   押すとそれぞれのモーダルが開く（Bootstrap のモーダル。画面のスクリプトの読み込みを待ってから押す）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export type SplitJoinCsvKind = "在庫分割CSV登録" | "在庫結合CSV登録";
const MODAL_ID: Record<SplitJoinCsvKind, string> = { 在庫分割CSV登録: "#modalSplitCsv", 在庫結合CSV登録: "#modalJoinCsv" };

/** 在庫分割結合検索/一覧を開く（メニューから開くのと同じ画面） */
export async function openSplitJoinList(page: Page): Promise<void> {
  const res = await page.goto(adminUrl("/product/stock/split-join"));
  expect(res?.status(), "在庫分割結合検索/一覧の応答").toBe(200);
  await expect(page.getByRole("button", { name: "在庫分割CSV登録", exact: true }), "在庫分割結合検索/一覧の画面").toBeVisible();
  await page.waitForLoadState("load");
}

/** 「在庫分割CSV登録」「在庫結合CSV登録」のボタンを押す */
export async function pressSplitJoinCsvButton(page: Page, kind: SplitJoinCsvKind): Promise<void> {
  const button = page.getByRole("button", { name: kind, exact: true });
  await expect(button, `「${kind}」ボタンは1つ`).toHaveCount(1);
  await button.click();
}

/** モーダルと、その見出し */
export function splitJoinCsvModal(page: Page, kind: SplitJoinCsvKind): { modal: Locator; title: Locator } {
  const modal = page.locator(MODAL_ID[kind]);
  return { modal, title: modal.locator(".modal-title") };
}

// ---------------------------------------------------------------- モーダルの入力と登録
//
// 画面の作り（開発環境の画面と、アプリのソース src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig で確かめたこと）:
// - 店舗は、ログインしたメンバーの編集可能店舗の選択欄。在庫区分は「EC-CUBE」「スマレジ」のラジオ。
// - 在庫分割CSV登録だけ、承認通知先（所属の選択欄と、メンバーの複数選択の select2）がある。メンバーの選択肢は、開いた時点では最初の編集可能店舗の
//   メンバーで、店舗を選び直すと画面のスクリプトが、その店舗の承認権限を持つメンバーに取り直す（非同期。少し待つ）。
// - CSVファイルは「ファイルを選択」が隠れたファイル欄を押す作り。送信のボタンの表示は「CSVから登録」（正本の「登録」ボタン）。
// - 送信すると、成功・失敗とも在庫分割結合検索/一覧へ戻る（失敗の理由は画面上部のメッセージ）。

const PREFIX: Record<SplitJoinCsvKind, string> = { 在庫分割CSV登録: "admin_stock_split_csv_upload", 在庫結合CSV登録: "admin_stock_join_csv_upload" };
const exact = (s: string) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

export class SplitJoinCsvModal {
  readonly modal: Locator;
  constructor(readonly page: Page, readonly kind: SplitJoinCsvKind) { this.modal = page.locator(MODAL_ID[kind]); }
  private get p(): string { return PREFIX[this.kind]; }
  get 店舗欄(): Locator { return this.modal.locator(`#${this.p}_store`); }
  get 在庫区分(): Locator { return this.modal.locator(`input[name="${this.p}[inventory_category]"]`); }
  get 所属欄(): Locator { return this.modal.locator(`#${this.p}_approval_department`); }
  get メンバー欄(): Locator { return this.modal.locator(`#${this.p}_approval_notification_target_members`); }
  get ファイル欄(): Locator { return this.modal.locator(`#${this.p}_import_file`); }
  get 登録ボタン(): Locator { return this.modal.locator('form button[type="submit"]'); }
  get 閉じるボタン(): Locator { return this.modal.locator(".modal-footer button", { hasText: "閉じる" }); }

  /** 一覧のボタンを押してモーダルを開き、表示されるのを待つ */
  async 開く(): Promise<void> {
    await pressSplitJoinCsvButton(this.page, this.kind);
    await expect(this.modal, `${this.kind}モーダル`).toBeVisible();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }
  async 閉じる(): Promise<void> {
    await this.閉じるボタン.click();
    await expect(this.modal, `${this.kind}モーダルが閉じた`).toBeHidden();
  }

  /** 在庫区分のラジオの表示名（並びのとおり） */
  async 在庫区分の選択肢(): Promise<string[]> {
    return this.在庫区分.evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).labels?.item(0)?.textContent ?? "").trim()));
  }
  /** 在庫区分のラジオそれぞれが選べるか（表示されていて、無効でない） */
  async 在庫区分が選べる(): Promise<Record<string, boolean>> {
    const out: Record<string, boolean> = {};
    for (const r of await this.在庫区分.all()) {
      const label = ((await r.evaluate((n) => (n as HTMLInputElement).labels?.item(0)?.textContent ?? "")) ?? "").trim();
      out[label] = (await r.isEnabled()) && (await this.modal.locator(`label[for="${await r.getAttribute("id")}"]`).isVisible());
    }
    return out;
  }

  /** 店舗を店名で選ぶ（在庫分割は、選ぶと承認通知先のメンバーを取り直すので、取り直しが落ち着くまで待つ） */
  async 店舗を選ぶ(店名: string): Promise<void> {
    const have = (await this.店舗欄.locator("option").allInnerTexts()).map((t) => t.trim());
    if (!have.includes(店名)) throw new Error(`${this.kind}の店舗に「${店名}」が無い（ある選択肢: ${have.filter(Boolean).join("、")}）`);
    await this.店舗欄.selectOption({ label: 店名 });
    if (this.kind === "在庫分割CSV登録") {
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      await this.page.waitForTimeout(500);
    }
  }
  /** 開発者ツールで店舗の値を書き換えたのと同じ状態にする（選択肢に無い値も入れる。画面のスクリプトは動かさない） */
  async 店舗の値を書き換える(値: string): Promise<void> {
    await this.店舗欄.evaluate((n, v) => {
      const s = n as HTMLSelectElement;
      if (!Array.from(s.options).some((o) => o.value === v)) {
        const o = document.createElement("option");
        o.value = v; o.textContent = v; s.appendChild(o);
      }
      s.value = v;
    }, 値);
    await expect(this.店舗欄, "店舗の値").toHaveValue(値);
  }
  async 在庫区分を選ぶ(名前: "EC-CUBE" | "スマレジ"): Promise<void> {
    const radio = this.modal.getByLabel(名前, { exact: true });
    if (!(await radio.isChecked())) await this.modal.locator(`label[for="${await radio.getAttribute("id")}"]`).click();
    await expect(radio, `在庫区分「${名前}」`).toBeChecked();
  }
  /** 開発者ツールで在庫区分の値を書き換えたのと同じ状態にする（選ばれているラジオの値を書き換える。無ければ先頭を選んでから） */
  async 在庫区分の値を書き換える(値: string): Promise<void> {
    await this.在庫区分.first().evaluate((n, v) => {
      const radios = Array.from(document.getElementsByName((n as HTMLInputElement).name)) as HTMLInputElement[];
      const r = radios.find((x) => x.checked) ?? radios[0];
      r.value = v; r.checked = true;
    }, 値);
    expect(await this.在庫区分.evaluateAll((ns) => ns.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value)), "在庫区分の値").toEqual([値]);
  }

  /** 承認通知先（所属選択）の選択肢の表示名（「指定なし」を除く。並びのとおり） */
  async 所属の選択肢(): Promise<string[]> {
    return this.所属欄.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
  }
  /** 承認通知先（メンバー選択）の選択肢の表示名（並びのとおり。選べないものも含む） */
  async メンバーの選択肢(): Promise<string[]> {
    return this.メンバー欄.locator("option").evaluateAll((os) => os.map((o) => (o.textContent ?? "").trim()).filter(Boolean));
  }
  /** メンバーの選択肢に名前が出るまで待つ（店舗を選び直したあとの取り直しは非同期） */
  async メンバーの選択肢が出るまで待つ(名前: string[], timeoutMs = 30_000): Promise<void> {
    const end = Date.now() + timeoutMs;
    for (;;) {
      const have = await this.メンバーの選択肢();
      if (名前.every((n) => have.includes(n))) return;
      if (Date.now() > end) throw new Error(`承認通知先（メンバー選択）に ${名前.filter((n) => !have.includes(n)).join("・")} が出ない（ある選択肢: ${have.join("、")}）`);
      await this.page.waitForTimeout(500);
    }
  }

  /** 承認通知先（メンバー選択）で、名前のメンバーを選ぶ（select2 の候補の一覧から押す。複数可） */
  async メンバーを選ぶ(名前: string[]): Promise<void> {
    await this.メンバーの選択肢が出るまで待つ(名前);
    const box = this.メンバー欄.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
    await expect(box, "承認通知先（メンバー選択）の選択欄").toBeVisible();
    for (const n of 名前) {
      const open = this.page.locator(".select2-container--open .select2-results");
      for (let i = 0; i < 3 && (await open.count()) === 0; i++) {
        await box.locator(".select2-selection").click();
        await this.page.waitForTimeout(300);
      }
      await expect(open, "承認通知先の候補の一覧が開いた").toHaveCount(1, { timeout: 5_000 });
      const search = box.locator(".select2-search__field");
      if ((await search.count()) > 0) await search.fill(n);
      const option = this.page.locator(".select2-container--open .select2-results__option").filter({ hasText: exact(n) });
      await expect(option, `承認通知先の候補「${n}」は1件`).toHaveCount(1);
      await option.click();
      await this.page.keyboard.press("Escape");
    }
    const open = this.page.locator(".select2-container--open");
    for (let i = 0; i < 3 && (await open.count()) > 0; i++) await this.page.keyboard.press("Escape");
    const chosen = await this.選ばれたメンバー();
    expect(chosen, "承認通知先に選んだメンバー").toEqual(名前);
  }
  async 選ばれたメンバー(): Promise<string[]> {
    return this.メンバー欄.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  }

  /** CSVファイルを指定する（ファイル名と中身を渡す） */
  async ファイルを指定する(ファイル名: string, 中身: string): Promise<void> {
    await this.ファイル欄.setInputFiles({ name: ファイル名, mimeType: "text/csv", buffer: Buffer.from(中身, "utf8") });
    await expect(this.modal.locator(".js-csv-file-name"), "選んだファイル名の表示").toHaveText(ファイル名);
  }

  /** 「登録」（表示は「CSVから登録」）を押し、画面が移るのを待つ。移った先のパスと、画面上部のメッセージを返す */
  async 登録を押す(): Promise<{ path: string; 状態: number; メッセージ: string[] }> {
    await expect(this.登録ボタン, "登録のボタンは1つ").toHaveCount(1);
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      this.登録ボタン.click(),
    ]);
    const メッセージ = (await this.page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t && !t.includes("デバッグモードが有効"));
    return { path: new URL(this.page.url()).pathname, 状態: res?.status() ?? 0, メッセージ };
  }
}

/** 在庫分割結合検索/一覧の画面か（パスで見る） */
export const 一覧のパス = new URL(adminUrl("/product/stock/split-join")).pathname;

/** CSVの中身（1行目は項目名。値は渡したとおりに並べる。カンマや引用符を含む値は無い前提で、含めば止める） */
export function csvText(項目名: string[], 行: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => cells.map((c) => {
    const s = String(c);
    if (/[",\n]/.test(s)) throw new Error(`CSVの値に区切りの文字がある: ${s}`);
    return s;
  }).join(",");
  return [line(項目名), ...行.map(line)].join("\n") + "\n";
}
export const 分割CSVの項目名 = ["分割元商品コード", "分割数", "分割先商品コード", "分割先在庫数"];
export const 結合CSVの項目名 = ["結合先商品コード", "結合数", "結合元商品コード", "結合元在庫区分", "結合元在庫数"];

/** 在庫分割結合検索/一覧で、店舗（複数選択の欄）に店名の店舗だけを選んで「検索」を押す（ほかの条件は初期のまま） */
export async function 店舗で検索する(page: Page, 店名: string): Promise<void> {
  const form = page.locator('form[name="admin_search_stock_split_join"]');
  await expect(form, "在庫分割結合検索/一覧の検索欄").toBeVisible();
  const store = form.locator("#admin_search_stock_split_join_store");
  const have = (await store.locator("option").allInnerTexts()).map((t) => t.trim());
  if (have.filter((t) => t === 店名).length !== 1) throw new Error(`検索条件の店舗に「${店名}」が1つではない（${have.filter((t) => t === 店名).length}件）`);
  await store.selectOption([{ label: 店名 }]);
  await store.evaluate((n) => {
    const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
    if (w.jQuery) w.jQuery(n).trigger("change");
  });
  const chosen = await store.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  expect(chosen, "検索条件の店舗").toEqual([店名]);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: "検索" }).first().click(),
  ]);
}
