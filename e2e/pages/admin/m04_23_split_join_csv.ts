/**
 * M04-23 在庫分割結合CSV登録の画面操作。セレクタはここにだけ書く。
 *
 * 画面の作り（アプリのソースで確かめたこと）:
 * - 在庫分割結合検索/一覧の上部の「在庫分割結合」の枠に「在庫分割CSV登録」「在庫結合CSV登録」のボタンがあり、
 *   押すとそれぞれのモーダルが開く（Bootstrap のモーダル。画面のスクリプトの読み込みを待ってから押す）。
 * - 在庫分割CSV登録モーダル: 店舗（選択欄）・在庫区分（EC-CUBE／スマレジのラジオ）・承認通知先の所属（選択欄）と
 *   メンバー（複数選択。select2 の付いた欄）・ファイルを選択（隠れたファイルの欄を、見えているボタンが開く）・送信のボタン。
 *   店舗を選び直すと、画面のスクリプトが、その店舗の承認権限を持つメンバーを問い合わせてメンバーの選択肢を入れ替える。
 *   所属を選ぶと、画面のスクリプトが、その所属でないメンバーの選択肢を選べなくし、選択を外す。
 * - 在庫結合CSV登録モーダル: 店舗・在庫区分・ファイルを選択・送信のボタン（承認通知先は無い）。
 * - 送信のボタンの表示名は「CSVから登録」。正本の「登録」ボタンはこれ。
 * - 送信すると、登録の処理のあと在庫分割結合検索/一覧へ戻る（誤りのときは前回の検索条件の一覧へ戻り、上部にメッセージが出る）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel } from "./common";

export type SplitJoinCsvKind = "在庫分割CSV登録" | "在庫結合CSV登録";
const MODAL_ID: Record<SplitJoinCsvKind, string> = { 在庫分割CSV登録: "#modalSplitCsv", 在庫結合CSV登録: "#modalJoinCsv" };
const PREFIX: Record<SplitJoinCsvKind, string> = { 在庫分割CSV登録: "admin_stock_split_csv_upload", 在庫結合CSV登録: "admin_stock_join_csv_upload" };
const FORM_ID: Record<SplitJoinCsvKind, string> = { 在庫分割CSV登録: "#form-stock-split-csv-upload", 在庫結合CSV登録: "#form-stock-join-csv-upload" };
const FILE_BUTTON: Record<SplitJoinCsvKind, string> = { 在庫分割CSV登録: ".js-split-csv-file-btn", 在庫結合CSV登録: ".js-join-csv-file-btn" };
const LIST_PATH = "/product/stock/split-join";

export const exactText = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 在庫分割結合検索/一覧を開く（メニューから開くのと同じ画面） */
export async function openSplitJoinList(page: Page): Promise<void> {
  const res = await page.goto(adminUrl(LIST_PATH));
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

/** いまの画面が在庫分割結合検索/一覧か（アドレスと、一覧の上部のボタンで見る） */
export async function onSplitJoinList(page: Page): Promise<{ アドレス: string; 一覧のボタン: number }> {
  return {
    アドレス: new URL(page.url()).pathname.replace(/^\/[^/]+/, ""),
    一覧のボタン: await page.getByRole("button", { name: "在庫分割CSV登録", exact: true }).count(),
  };
}
export const SPLIT_JOIN_LIST_PATH = LIST_PATH;

/** 画面の上部のメッセージ（成功・誤り・注意） */
export async function pageAlerts(page: Page): Promise<string[]> {
  const texts = await page.locator(".alert").allInnerTexts();
  return [...new Set(texts.map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

export type MemberOption = { 名前: string; 選べる: boolean; 選択: boolean };

/** 在庫分割CSV登録モーダル・在庫結合CSV登録モーダルの操作 */
export class SplitJoinCsvModal {
  readonly modal: Locator;
  readonly form: Locator;

  constructor(readonly page: Page, readonly kind: SplitJoinCsvKind) {
    this.modal = page.locator(MODAL_ID[kind]);
    this.form = page.locator(FORM_ID[kind]);
  }

  private field(name: string): Locator {
    return this.page.locator(`#${PREFIX[this.kind]}_${name}`);
  }

  get 店舗(): Locator { return this.field("store"); }
  get 在庫区分(): Locator { return this.form.locator(`input[name="${PREFIX[this.kind]}[inventory_category]"]`); }
  get 所属(): Locator { return this.page.locator("#admin_stock_split_csv_upload_approval_department"); }
  get メンバー(): Locator { return this.page.locator("#admin_stock_split_csv_upload_approval_notification_target_members"); }

  /** 在庫分割結合検索/一覧を開いてボタンを押し、モーダルが開くのを待つ */
  async open(): Promise<void> {
    await openSplitJoinList(this.page);
    await this.openOnList();
  }

  /** いま開いている在庫分割結合検索/一覧で、ボタンを押してモーダルを開く */
  async openOnList(): Promise<void> {
    await pressSplitJoinCsvButton(this.page, this.kind);
    await expect(this.modal, `${this.kind}モーダル`).toBeVisible();
    await expect(this.form, `${this.kind}モーダルの入力欄`).toBeVisible();
  }

  /** モーダルの下の「閉じる」を押す */
  async close(): Promise<void> {
    const button = this.modal.locator(".modal-footer button[data-bs-dismiss=modal]");
    await expect(button, "モーダルの「閉じる」").toHaveCount(1);
    await button.click();
    await expect(this.modal, `${this.kind}モーダルが閉じる`).toBeHidden();
  }

  /** 在庫区分の選択肢（表示名と、選べるか） */
  async zoneChoices(): Promise<{ 名前: string; 選べる: boolean }[]> {
    return this.在庫区分.evaluateAll((inputs) => inputs.map((i) => ({
      名前: (i as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "",
      選べる: !(i as HTMLInputElement).disabled,
    })));
  }

  /**
   * 店舗を表示名で選ぶ。在庫分割では、選び直すと画面のスクリプトが承認通知先のメンバーを問い合わせて入れ替えるので、その応答を待つ。
   */
  async chooseStore(name: string): Promise<void> {
    const option = this.店舗.locator("option").filter({ hasText: exactText(name) });
    await expect(option, `店舗の選択肢「${name}」は1つ`).toHaveCount(1);
    const value = (await option.getAttribute("value")) ?? "";
    if (this.kind === "在庫分割CSV登録") {
      const reloaded = this.page.waitForResponse((r) => /\/split-join\/approval-members/.test(r.url()), { timeout: 60_000 });
      await this.店舗.selectOption(value);
      const res = await reloaded;
      expect(res.status(), `店舗「${name}」の承認通知先の問い合わせの応答`).toBe(200);
      await this.page.waitForTimeout(300);
    } else {
      await this.店舗.selectOption(value);
    }
  }

  async chooseZone(name: "EC-CUBE" | "スマレジ"): Promise<void> {
    const radio = this.在庫区分.and(this.page.getByLabel(name, { exact: true }));
    await expect(radio, `在庫区分「${name}」の選択肢は1つ`).toHaveCount(1);
    await radio.check();
  }

  /** 承認通知先（所属選択）の選択肢の表示名（「指定なし」を除く。並びは画面のまま） */
  async departmentChoices(): Promise<string[]> {
    return this.所属.locator("option").evaluateAll((os) => os
      .filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
  }

  async chooseDepartment(name: string): Promise<void> {
    await chooseByLabel(this.所属, name);
  }

  /** 承認通知先（メンバー選択）の選択肢（並びは画面のまま） */
  async memberChoices(): Promise<MemberOption[]> {
    return this.メンバー.locator("option").evaluateAll((os) => os
      .filter((o) => (o as HTMLOptionElement).value !== "")
      .map((o) => ({ 名前: (o.textContent ?? "").trim(), 選べる: !(o as HTMLOptionElement).disabled, 選択: (o as HTMLOptionElement).selected })));
  }

  /** 承認通知先（メンバー選択）で、名前の候補を1つずつ選ぶ（select2 の欄を開いて候補を押す） */
  async chooseMembers(names: string[]): Promise<void> {
    const box = this.メンバー.locator("xpath=following-sibling::span[contains(@class,'select2')][1]");
    await expect(box, "承認通知先（メンバー選択）の欄").toBeVisible();
    for (const name of names) {
      await box.locator(".select2-selection").click();
      const option = this.page.locator(".select2-container--open .select2-results__option").filter({ hasText: exactText(name) });
      await expect(option, `承認通知先（メンバー選択）の候補「${name}」は1件`).toHaveCount(1);
      await option.click();
      await this.page.keyboard.press("Escape");
    }
    const chosen = (await this.memberChoices()).filter((o) => o.選択).map((o) => o.名前);
    for (const name of names) expect(chosen, `承認通知先（メンバー選択）に「${name}」を選んだ`).toContain(name);
  }

  /** 「ファイルを選択」を押して、ファイルを選ぶ */
  async chooseFile(filePath: string): Promise<void> {
    const button = this.modal.locator(FILE_BUTTON[this.kind]);
    await expect(button, "「ファイルを選択」").toBeVisible();
    const [chooser] = await Promise.all([this.page.waitForEvent("filechooser"), button.click()]);
    await chooser.setFiles(filePath);
    const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
    await expect(this.modal.locator(".js-csv-file-name"), "選んだファイルの名前の表示").toHaveText(fileName);
  }

  /**
   * 開発者ツールで店舗の値を書き換えるのと同じく、店舗の選択欄の値をその場で書き換える
   * （その値の選択肢が無ければ足して選ぶ。画面のスクリプトの連動は起こさない）。
   */
  async overwriteStoreValue(value: string): Promise<void> {
    await this.店舗.evaluate((el, v) => {
      const s = el as HTMLSelectElement;
      if (!Array.from(s.options).some((o) => o.value === v)) {
        const o = document.createElement("option");
        o.value = v;
        o.textContent = v;
        s.appendChild(o);
      }
      s.value = v;
    }, value);
    await expect(this.店舗, "店舗の選択欄の値").toHaveValue(value);
  }

  /**
   * 開発者ツールで在庫区分の値を書き換えるのと同じく、在庫区分のラジオの先頭の値を書き換えて選んだ状態にする。
   */
  async overwriteZoneValue(value: string): Promise<void> {
    await this.在庫区分.first().evaluate((el, v) => {
      const i = el as HTMLInputElement;
      i.value = v;
      i.checked = true;
    }, value);
    const checked = await this.在庫区分.evaluateAll((inputs) => inputs.filter((i) => (i as HTMLInputElement).checked).map((i) => (i as HTMLInputElement).value));
    expect(checked, "選ばれている在庫区分の値").toEqual([value]);
  }

  /** 送信のボタン（表示名「CSVから登録」）。正本の「登録」ボタン */
  get 登録(): Locator {
    return this.form.locator('button[type="submit"]');
  }

  /** 「登録」を押し、移った先の画面の読み込みを待つ */
  async pressRegister(): Promise<void> {
    await expect(this.登録, `${this.kind}モーダルの送信のボタンは1つ`).toHaveCount(1);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load", timeout: 300_000 }),
      this.登録.click(),
    ]);
  }
}

// ---- 在庫分割結合検索/一覧の検索（店舗で絞る） ----

export type SplitJoinListRow = { ID: string; 種別: string; 店舗: string; 在庫区分: string; 商品名: string; 点数: string; ステータス: string };

/** 検索欄の店舗（複数選択）を、表示名の1店だけにする（select2 の有無にかかわらず、選択欄の選択を変えて変更を知らせる） */
async function chooseSearchStore(page: Page, name: string): Promise<void> {
  const select = page.locator("#admin_search_stock_split_join_store");
  await expect(select.locator("option").filter({ hasText: exactText(name) }), `検索欄の店舗の選択肢「${name}」は1つ`).toHaveCount(1);
  await select.evaluate((node, want) => {
    const s = node as HTMLSelectElement;
    for (const o of Array.from(s.options)) o.selected = (o.textContent ?? "").trim() === want;
    const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
    if (w.jQuery) w.jQuery(s).trigger("change");
    else s.dispatchEvent(new Event("change", { bubbles: true }));
  }, name);
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  expect(chosen, "検索欄の店舗に選んだもの").toEqual([name]);
}

/** いま開いている在庫分割結合検索/一覧で、検索条件の店舗を選んで「検索」を押す */
export async function searchSplitJoinByStore(page: Page, storeName: string): Promise<void> {
  const form = page.locator('form[name="admin_search_stock_split_join"]');
  await expect(form, "在庫分割結合検索/一覧の検索欄").toBeVisible();
  await chooseSearchStore(page, storeName);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: "検索" }).click(),
  ]);
}

/** 在庫分割結合検索/一覧の検索結果の行（点数は、分割数・結合数の欄の1段目） */
export async function splitJoinListRows(page: Page): Promise<SplitJoinListRow[]> {
  return page.locator("#stock_split_join_list tbody tr").filter({ has: page.locator("td:first-child a") }).evaluateAll((trs) => trs.map((tr) => {
    const tds = tr.querySelectorAll(":scope > td");
    const td = (i: number) => (tds[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
    const first = (tds[5]?.querySelector("div")?.textContent ?? tds[5]?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { ID: td(0), 種別: td(1), 店舗: td(2), 在庫区分: td(3), 商品名: td(4), 点数: first, ステータス: td(8) };
  }));
}

// ---- 店舗一覧（店舗IDの有無） ----

/** 店舗一覧（全件表示）に、店舗IDの行があるか */
export async function tenantIdExists(page: Page, id: string): Promise<boolean> {
  const res = await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"));
  expect(res?.status(), "店舗一覧の応答").toBe(200);
  const ids = await page.locator("table.table tbody tr").evaluateAll((trs) => trs.map((tr) => (tr.querySelectorAll("td")[1]?.textContent ?? "").trim()));
  if (ids.length === 0) throw new Error("店舗一覧に行が無い（読み込めていない）");
  return ids.includes(id);
}

// ---- マスタデータ管理（所属）・権限管理（読むだけ） ----

/** マスタデータ管理で所属のマスタを開き、名称を画面の並び順で読む（書き換えない） */
export async function readDepartmentNames(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const select = page.locator("form#form1 select").first();
  await expect(select, "マスタデータ管理のマスタの選択欄").toBeVisible();
  await chooseByLabel(select, "mtb_department");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("form#form1 button[type=submit]").click()]);
  const rows = page.locator("form#form2 tbody tr");
  await expect(rows.first(), "所属のマスタの行").toBeVisible();
  const names: string[] = [];
  for (const row of await rows.all()) {
    const inputs = row.locator("input[type=text], input:not([type])");
    if ((await inputs.count()) < 2) continue;
    const name = (await inputs.nth(1).inputValue()).trim();
    if (name) names.push(name);
  }
  return names;
}

/** 権限管理の表で、「承認権限」のチェックが外れている権限の名前（画面の並び順） */
export async function authoritiesWithoutApproval(page: Page): Promise<string[]> {
  const res = await page.goto(adminUrl("/setting/system/authority"));
  expect(res?.status(), "権限管理の応答").toBe(200);
  await expect(page.locator("#table-authority"), "権限管理の表").toBeVisible();
  await page.waitForLoadState("load");
  return page.locator("#table-authority tbody tr").evaluateAll((trs) => trs.flatMap((tr) => {
    const box = tr.querySelector('input.permission-checkbox[data-url="/approval_authority"]') as HTMLInputElement | null;
    const name = (tr.querySelector("th")?.textContent ?? "").trim();
    return box && !box.checked && name ? [name] : [];
  }));
}

/** 在庫変更CSV登録画面を開き、在庫区分の選択肢の表示名を読む */
export async function stockChangeCsvZoneLabels(page: Page): Promise<string[]> {
  const res = await page.goto(adminUrl("/product/stock/change/new"));
  expect(res?.status(), "在庫変更CSV登録画面の応答").toBe(200);
  const zones = page.locator('form#upload-form input[name="admin_stock_change_csv_list[change_stock_location_id]"]');
  await expect(zones.first(), "在庫変更CSV登録画面の在庫区分").toBeVisible();
  return zones.evaluateAll((nodes) => nodes.map((n) => (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? ""));
}

// ---- 在庫履歴検索一覧（店舗・登録元） ----

/** 複数選択の欄（select2 の有無にかかわらず）で、表示名が一致する選択肢だけを選び、変更を知らせる */
async function selectOnly(select: Locator, labels: string[], what: string): Promise<void> {
  for (const l of labels) await expect(select.locator("option").filter({ hasText: exactText(l) }), `${what}の選択肢「${l}」は1つ`).toHaveCount(1);
  await select.evaluate((node, want) => {
    const s = node as HTMLSelectElement;
    for (const o of Array.from(s.options)) o.selected = want.includes((o.textContent ?? "").trim());
    const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
    if (w.jQuery) w.jQuery(s).trigger("change");
    else s.dispatchEvent(new Event("change", { bubbles: true }));
  }, labels);
  const chosen = await select.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  expect(chosen, `${what}に選んだもの`).toEqual(labels);
}

/** 在庫履歴検索一覧(検索入力)の、店舗（1店だけ）と登録元を選ぶ */
export async function chooseHistoryShopAndSource(page: Page, shop: string, source: string): Promise<void> {
  const form = page.locator("form#search_form");
  await selectOnly(form.locator("#admin_stock_history_base_info"), [shop], "在庫履歴検索一覧の店舗");
  await selectOnly(form.locator("#admin_stock_history_create_source"), [source], "在庫履歴検索一覧の登録元");
}

// ---- ログアウト ----

/**
 * 管理画面の上部の「○○ 様」を押して開く吹き出しの「ログアウト」を押す
 * （吹き出しの中身は、押したときに画面のスクリプトが作る）。
 */
export async function logoutAdmin(page: Page): Promise<void> {
  const toggle = page.locator('[data-bs-content*="/logout"]').first();
  await expect(toggle, "管理画面の上部の、ログアウトを含む吹き出しを開く欄").toBeVisible();
  await toggle.click();
  const link = page.locator('.popover a[href$="/logout"]');
  await expect(link, "吹き出しの「ログアウト」").toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  await expect(page, "ログアウトするとログイン画面になる").toHaveURL(/\/login/);
}
