/**
 * 購入グループ管理画面（メニュー「商品管理」）。入力欄と、購入グループの一覧が同じ画面にある。
 * - 編集対象を指定しない画面が新規登録の状態（入力欄の見出し「新規追加」）。一覧の名称（日）のリンクで開く画面が編集の状態（見出し「編集」）。
 * - 登録・更新が通ると、保存した購入グループの編集の状態の画面へ移る。
 * - 一覧は削除されていない購入グループを、購入グループIDの昇順で並べる（アプリのソースで確認）。
 * - 行の削除ボタンは、画面の中の削除確認モーダルを開く。モーダルの削除ボタンを押すと、画面のスクリプトが削除の要求を
 *   フォームで送る（ブラウザの確認ダイアログは出ない）。モーダルの文と送り先は、モーダルが開き終わってから画面のスクリプトが入れる。
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type PurchaseGroupInput = { 名称日: string; 名称英: string; 予約商品フラグ: boolean; メモ: string };
export type PurchaseGroupRow = { 購入グループID: string; 名称日: string; 名称英: string; メモ: string; 支払方法: string; 配送方法: string };

export const purchaseGroupIndexUrl = () => adminUrl("/product/sell_group");
export const purchaseGroupEditUrl = (id: string) => adminUrl(`/product/sell_group/${id}`);
export const pathOf = (url: string) => new URL(url).pathname;
export const purchaseGroupIndexPath = () => pathOf(purchaseGroupIndexUrl());
export const purchaseGroupEditPath = (id: string) => pathOf(purchaseGroupEditUrl(id));
/** 削除の要求の送り先（行の削除ボタンが持つ送り先） */
export const purchaseGroupDeletePath = (id: string) => pathOf(adminUrl(`/product/sell_group/${id}/delete`));

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** 登録ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number; 移った画面: number | null }
  | { sent: false; 止めた項目: string[] };

/** 削除の要求の結果。要求＝削除の要求そのものの応答、移った画面＝転送のあとに開いた画面の応答 */
export type DeleteResult = { 要求: number; 移った画面: number | null };

/** 行の削除ボタンを押して開いた削除確認モーダル（まだ応じていない） */
export type PendingDelete = { modal: Locator; message: string; deletePath: string };

/** 画面上部のメッセージ（成功・エラー）。開発用の設定のときに常に出る帯は除く */
export async function topMessages(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t && !t.includes("デバッグモードが有効"));
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

export class PurchaseGroupPage {
  readonly form: Locator;
  readonly 名称日: Locator;
  readonly 名称英: Locator;
  readonly 予約商品フラグ: Locator;
  readonly メモ: Locator;
  readonly 支払方法: Locator;
  readonly 配送方法: Locator;
  readonly 登録ボタン: Locator;
  readonly 入力欄の見出し: Locator;
  readonly 見出し: Locator;
  readonly 小見出し: Locator;
  readonly 一覧: Locator;
  readonly rows: Locator;
  readonly 削除確認モーダル: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form_sell_group");
    this.名称日 = this.form.locator('[name="product_sell_group[name]"]');
    this.名称英 = this.form.locator('[name="product_sell_group[name_en]"]');
    this.予約商品フラグ = this.form.locator('input[type="checkbox"][name="product_sell_group[reservationFlg]"]');
    this.メモ = this.form.locator('[name="product_sell_group[memo]"]');
    this.支払方法 = this.form.locator('input[type="checkbox"][name="product_sell_group[Payments][]"]');
    this.配送方法 = this.form.locator('input[type="checkbox"][name="product_sell_group[Deliveries][]"]');
    this.登録ボタン = page.locator('button[type="submit"][form="form_sell_group"]');
    this.入力欄の見出し = this.form.locator(".card-header .card-title");
    this.見出し = page.locator(".c-pageTitle__title");
    this.小見出し = page.locator(".c-pageTitle__subTitle");
    this.一覧 = page.locator("table.sell-group-master-list");
    this.rows = this.一覧.locator("tbody tr");
    this.削除確認モーダル = page.locator("#DeleteModal");
  }

  /** 画面の読み込みを終え、入力欄が出るまで待つ（削除ボタンのモーダルは、画面のスクリプトの読み込み後でないと動かない） */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.名称日, "購入グループ管理画面の名称（日）の欄").toBeVisible();
  }

  /** 編集対象を指定せずに開く（新規登録の状態） */
  async openNew(): Promise<Response | null> {
    const res = await this.page.goto(purchaseGroupIndexUrl());
    await this.ready();
    return res;
  }

  /** 一覧の行の、名称（日）のリンクの送り先から購入グループIDを読む */
  private static idOfHref(href: string | null): string {
    const m = (href ?? "").match(/\/product\/sell_group\/(\d+)$/);
    if (!m) throw new Error(`一覧の名称（日）のリンクの送り先が想定と違う: ${href}`);
    return m[1];
  }

  rowById(id: string): Locator {
    return this.rows.filter({ has: this.page.locator(`td:nth-child(1) a[href$="/product/sell_group/${id}"]`) });
  }

  rowsByName(名称日: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(1) a", { hasText: exact(名称日) }) });
  }

  rowsByEnglishName(名称英: string): Locator {
    return this.rows.filter({ has: this.page.locator("td:nth-child(2)", { hasText: exact(名称英) }) });
  }

  async readRow(row: Locator): Promise<PurchaseGroupRow> {
    const cell = async (n: number) => ((await row.locator(`td:nth-child(${n})`).innerText()) ?? "").replace(/\s+/g, " ").trim();
    return {
      購入グループID: PurchaseGroupPage.idOfHref(await row.locator("td:nth-child(1) a").getAttribute("href")),
      名称日: await cell(1), 名称英: await cell(2), メモ: await cell(3), 支払方法: await cell(4), 配送方法: await cell(5),
    };
  }

  /** 一覧で名称（日）が一致する行の購入グループID（上から順） */
  async idsOfName(名称日: string): Promise<string[]> {
    const out: string[] = [];
    for (const row of await this.rowsByName(名称日).all()) out.push((await this.readRow(row)).購入グループID);
    return out;
  }

  /** 一覧の行の名称（日）のリンクを押し、その購入グループの編集の状態の画面へ移る */
  async pressName(id: string): Promise<void> {
    const row = this.rowById(id);
    await expect(row, `一覧に購入グループID ${id} の行が1件`).toHaveCount(1);
    const link = row.locator("td:nth-child(1) a");
    await Promise.all([this.page.waitForURL((u) => u.pathname === purchaseGroupEditPath(id)), link.click()]);
    await this.ready();
  }

  /** 新規登録の状態の画面を開いてから、一覧の名称（日）のリンクでその購入グループの編集の状態を開く */
  async openEdit(id: string): Promise<void> {
    await this.openNew();
    await this.pressName(id);
  }

  /** チェックされている支払方法・配送方法の表示名 */
  async checkedLabels(boxes: Locator): Promise<string[]> {
    return boxes.evaluateAll((nodes) => nodes
      .map((n) => n as HTMLInputElement)
      .filter((n) => n.checked)
      .map((n) => n.labels?.item(0)?.textContent?.trim() ?? n.value));
  }

  /** 入力欄に読み込まれている値 */
  async inputValues(): Promise<PurchaseGroupInput> {
    return {
      名称日: await this.名称日.inputValue(),
      名称英: await this.名称英.inputValue(),
      予約商品フラグ: await this.予約商品フラグ.isChecked(),
      メモ: await this.メモ.inputValue(),
    };
  }

  async fill(v: Partial<PurchaseGroupInput>): Promise<void> {
    if (v.名称日 !== undefined) await this.名称日.fill(v.名称日);
    if (v.名称英 !== undefined) await this.名称英.fill(v.名称英);
    if (v.予約商品フラグ !== undefined) {
      await expect(this.予約商品フラグ, "予約商品フラグ").toBeEnabled();
      await this.予約商品フラグ.setChecked(v.予約商品フラグ);
    }
    if (v.メモ !== undefined) await this.メモ.fill(v.メモ);
  }

  /**
   * 登録ボタンを押す。必須の欄が空のときは、ブラウザの入力チェックが送信を止める（要求を送らない）。
   * そのときは止めた項目（項目名と、ブラウザの案内の文）を返す。送ったときは、登録の要求そのものの応答と、移った画面の応答を返す。
   */
  async pressRegister(): Promise<SubmitResult> {
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => {
        const label = e.closest(".row, .form-group")?.querySelector("label")?.textContent?.trim() ?? "（項目名なし）";
        return `${label}: ${(e as HTMLInputElement).validationMessage}`;
      }));
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.登録ボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST"
      && /\/product\/sell_group\/(create|\d+\/update)$/.test(pathOf(r.url())));
    const [landed] = await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    return { sent: true, status: (await response).status(), 移った画面: landed?.status() ?? null };
  }

  /**
   * 新規登録の状態で入力して登録し、成功の表示を確かめる。登録後に移った編集の状態の画面のアドレス末尾から購入グループIDを読み、
   * 一覧にその購入グループIDの行があり、名称（日）が入れた値であることも確かめる。
   */
  async register(v: PurchaseGroupInput, what: string): Promise<string> {
    await this.openNew();
    await expect(this.入力欄の見出し, `${what}: 入力欄の見出し（新規登録の状態）`).toHaveText(/^\s*新規追加\s*$/);
    const loaded = await this.inputValues();
    if (loaded.名称日 || loaded.名称英 || loaded.メモ || loaded.予約商品フラグ) {
      throw new Error(`${what}: 新規登録の状態の入力欄が空でない（${JSON.stringify(loaded)}）`);
    }
    await this.fill(v);
    // 正本の作り方は、支払方法・配送方法を「未選択のまま」にする
    const payments = await this.checkedLabels(this.支払方法);
    const deliveries = await this.checkedLabels(this.配送方法);
    if (payments.length || deliveries.length) throw new Error(`${what}: 支払方法・配送方法が選ばれている（${[...payments, ...deliveries].join("、")}）`);
    const r = await this.pressRegister();
    if (!r.sent) throw new Error(`${what}: ブラウザの入力チェックで送信が止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(this.page, what);
    const m = pathOf(this.page.url()).match(/\/product\/sell_group\/(\d+)$/);
    if (!m) throw new Error(`${what}: 登録後に、購入グループの編集の状態の画面へ移らない（${this.page.url()}）`);
    await this.ready();
    const row = this.rowById(m[1]);
    await expect(row, `${what}: 一覧に購入グループID ${m[1]} の行が1件`).toHaveCount(1);
    const got = await this.readRow(row);
    if (got.名称日 !== v.名称日 || got.名称英 !== v.名称英) {
      throw new Error(`${what}: 一覧の購入グループID ${m[1]} の行の名称が ${got.名称日}・${got.名称英}（${v.名称日}・${v.名称英} のはず）`);
    }
    return m[1];
  }

  /**
   * 行の削除ボタンを押し、削除確認モーダルが開き終わるまで待つ（モーダルの文と、削除の送り先が入るまで）。モーダルは開いたまま返す。
   * 正本が「削除ボタンを押す」と「削除確認モーダルの削除ボタン（キャンセルボタン）を押す」を別の手順にしているので、手順を分けて実行するため。
   */
  async pressDeleteButton(row: Locator): Promise<PendingDelete> {
    await expect(row, "削除する行が1件").toHaveCount(1);
    await this.page.waitForLoadState("load");
    const id = (await this.readRow(row)).購入グループID;
    const button = row.locator('button[data-bs-target="#DeleteModal"]');
    await expect(button, `購入グループID ${id} の行の削除ボタン`).toHaveCount(1);
    await expect(button, `購入グループID ${id} の行の削除ボタンの名称`).toHaveText(/^\s*削除\s*$/);
    await button.click();
    const modal = this.削除確認モーダル;
    await expect(modal, "削除確認モーダル").toBeVisible();
    const deletePath = purchaseGroupDeletePath(id);
    const confirm = modal.locator('a.btn-ec-delete[data-method="delete"]');
    await expect.poll(async () => pathOf(new URL((await confirm.getAttribute("href")) ?? "#", this.page.url()).href),
      "削除確認モーダルの削除ボタンの送り先（モーダルが開き終わると入る）").toBe(deletePath);
    const message = modal.locator("p.modal-message");
    await expect(message, "削除確認モーダルの文").toHaveText(/\S/);
    return { modal, message: ((await message.innerText()) ?? "").trim(), deletePath };
  }

  /** 開いている削除確認モーダルの削除ボタンを押す。削除の要求そのものの応答と、移った画面の応答を返す */
  async confirmDelete(pending: PendingDelete): Promise<DeleteResult> {
    const confirm = pending.modal.locator('a.btn-ec-delete[data-method="delete"]');
    await expect(confirm, "削除確認モーダルの削除ボタン").toHaveText(/^\s*削除\s*$/);
    const requested = this.page.waitForResponse((r) => r.request().method() === "POST" && pathOf(r.url()) === pending.deletePath, { timeout: 120_000 });
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 });
    await confirm.click();
    const [response, landed] = await Promise.all([requested, nav]);
    return { 要求: response.status(), 移った画面: landed?.status() ?? null };
  }

  /** 開いている削除確認モーダルのキャンセルボタンを押し、モーダルが閉じるのを待つ */
  async cancelDelete(pending: PendingDelete): Promise<void> {
    const cancel = pending.modal.locator('.modal-footer button[data-bs-dismiss="modal"]');
    await expect(cancel, "削除確認モーダルのキャンセルボタン").toHaveText(/^\s*キャンセル\s*$/);
    await cancel.click();
  }

  /** 削除確認モーダルの削除ボタンが送るなりすまし対策トークンを、別の値に書き換える（開発者ツールで書き換えるのと同じ） */
  async replaceDeleteToken(pending: PendingDelete, token: string): Promise<void> {
    const confirm = pending.modal.locator('a.btn-ec-delete[data-method="delete"]');
    await expect(confirm, "削除確認モーダルの削除ボタンのなりすまし対策トークン").toHaveAttribute("token-for-anchor", /.+/);
    await confirm.evaluate((a, t) => a.setAttribute("token-for-anchor", t), token);
    await expect(confirm, "書き換えたなりすまし対策トークン").toHaveAttribute("token-for-anchor", token);
  }

  /** 行の削除ボタンとモーダルの削除ボタンで削除し、成功の表示を確かめる（シードの片付け） */
  async deleteRow(row: Locator, what: string): Promise<void> {
    const pending = await this.pressDeleteButton(row);
    const r = await this.confirmDelete(pending);
    if (r.要求 >= 400) throw new Error(`${what}: 削除の要求の応答が ${r.要求}`);
    await expectSaved(this.page, what);
    await this.ready();
  }
}
