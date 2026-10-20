/**
 * M03-45 カテゴリ一覧の画面操作。
 *
 * カテゴリ一覧は、M03-11 カテゴリ登録/編集と同じ画面（親を選んだ一覧・最上位の一覧・カテゴリ編集画面）なので、
 * M03-11 の部品 CategoryPage を引き継ぎ、一覧の行の操作部・カテゴリツリーの開閉・並べ替え・削除の確認モーダル・
 * CSV出力項目設定を足す。セレクタはこのファイルにだけ書く。
 */
import { Dialog, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { CategoryPage } from "./category";
import { expectSaved } from "./common";
import { ProductSearchPage } from "./product_search";

/** 親カテゴリを指定した一覧（指定しなければ最上位の一覧）の画面URL */
export const categoryListUrl = (parentId?: string | null) => adminUrl(parentId ? `/product/category/${parentId}` : "/product/category");
/** カテゴリ編集画面の画面URL */
export const categoryEditUrl = (id: string) => adminUrl(`/product/category/${id}/edit`);

/** 一覧の1行の操作部 */
export type RowParts = {
  /** 行頭のドラッグ用のつまみ（三点リーダー） */
  handle: Locator;
  up: Locator;
  down: Locator;
  edit: Locator;
  delete: Locator;
  /** 削除ボタンを包む、補足（ツールチップ）を出す枠 */
  deleteHint: Locator;
};

/** カテゴリツリーの1項目（「ID:n 名称 (直下の件数)」） */
export type TreeItem = { id: string; name: string; count: string };

export class CategoryListPage extends CategoryPage {
  constructor(page: Page) {
    super(page);
  }

  /** 画面上部の操作部（パンくずとCSVのボタンの並ぶ帯） */
  topArea(): Locator {
    return this.page.locator(".c-outsideBlock").first();
  }

  /** 表示の文字が一致するボタン（アイコンが名前に混ざるので、表示の文字で探す） */
  buttonByText(text: string): Locator {
    return this.page.locator("a.btn, button.btn", { has: this.page.getByText(text, { exact: true }) });
  }

  /** 画面上部の操作部にある、表示の文字が一致するボタン */
  topButton(text: string): Locator {
    return this.topArea().locator("a.btn, button.btn", { has: this.page.getByText(text, { exact: true }) });
  }

  /** カテゴリを登録・更新するボタン（「子カテゴリ作成」「カテゴリ更新」） */
  registerButtons(): Locator {
    return this.page.getByRole("button", { name: /子カテゴリ作成|カテゴリ更新/ });
  }

  /** リンク・ボタンを押して、移った先の画面の読み込みを待つ */
  async follow(link: Locator, what: string): Promise<void> {
    await expect(link, what).toBeVisible();
    await this.page.waitForLoadState("load");
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 画面のボタン・リンク・入力ボタンのうち、表示の文字が条件に合うもの */
  controlsMatching(pattern: RegExp): Locator {
    return this.page.locator("a, button, input[type=button], input[type=submit]").filter({ hasText: pattern });
  }

  /** 画面上部の操作部に見えているボタンの表示の文字 */
  async topButtonTexts(): Promise<string[]> {
    return (await this.topArea().locator("a.btn:visible, button:visible").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /** 一覧の行のカテゴリIDの並び（上から） */
  async listIds(): Promise<string[]> {
    return (await this.rowValues()).map((r) => r.id);
  }

  /** 一覧の行の並び（行が並ぶ枠。行が1件も無いと出ない） */
  listContainer(): Locator {
    return this.page.locator("#ex-primaryCol .sortable-container");
  }

  /** 一覧部分の、該当するカテゴリが無いときの案内 */
  noDataMessage(): Locator {
    return this.page.locator("#ex-primaryCol > p.text-muted");
  }

  /** 一覧の下の、並べ替えの操作の説明（行があるときに出る） */
  listFootnote(): Locator {
    return this.page.locator("#ex-primaryCol > p:not(.text-muted)");
  }

  /** 一覧の行のカテゴリ名（日）のリンク */
  nameLink(id: string): Locator {
    return this.rowById(id).locator(".flex-grow-1 > a").first();
  }

  /** 一覧の1行の操作部 */
  rowParts(id: string): RowParts {
    const row = this.rowById(id);
    const del = row.locator('a[data-bs-target="#DeleteModal"]');
    return {
      handle: row.locator(".fa-bars"),
      up: row.locator("a.action-up"),
      down: row.locator("a.action-down"),
      edit: row.locator("a.action-edit"),
      delete: del,
      // 補足の枠の中から削除ボタンを探す（行から探す指定を渡すと、枠の中に行を探して見つからない。025 の1回目）
      deleteHint: row.locator('div[data-bs-toggle="tooltip"]', { has: this.page.locator('a[data-bs-target="#DeleteModal"]') }),
    };
  }

  /** 一覧の行のカテゴリ名（日）を押して、そのカテゴリの直下の一覧へ移る */
  async clickName(id: string): Promise<void> {
    const link = this.nameLink(id);
    await expect(link, `一覧のカテゴリID ${id} のカテゴリ名`).toBeVisible();
    await Promise.all([this.page.waitForURL(categoryListUrl(id)), link.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 一覧の行の編集ボタン（ペンアイコン）を押して、カテゴリ編集画面へ移る */
  async clickEdit(id: string): Promise<void> {
    const pen = this.rowParts(id).edit;
    await expect(pen, `一覧のカテゴリID ${id} の編集ボタン`).toBeVisible();
    await Promise.all([this.page.waitForURL(categoryEditUrl(id)), pen.click()]);
    await this.page.waitForLoadState("load");
  }

  /** パンくずの項目（表示の文字と移動先） */
  async breadcrumbLinks(): Promise<{ text: string; href: string }[]> {
    return this.page.locator('nav[aria-label="breadcrumb"] li.breadcrumb-item a').evaluateAll((links) => links
      .map((a) => ({ text: (a.textContent ?? "").replace(/\s+/g, " ").trim(), href: (a as HTMLAnchorElement).href })));
  }

  // ---- カテゴリツリー ----

  treeLink(id: string): Locator {
    return this.page.locator(`#ex-secondaryCol .c-directoryTree a[href$="/product/category/${id}"]`);
  }

  /** カテゴリの枝を開閉するつまみ（子の無いカテゴリにもある） */
  treeToggle(id: string): Locator {
    return this.page.locator(`#ex-secondaryCol .c-directoryTree label[href="#directory_category${id}"]`);
  }

  /** カテゴリの枝（子カテゴリの並び）。子が無いカテゴリには無い */
  treeBranch(id: string): Locator {
    return this.page.locator(`#ex-secondaryCol .c-directoryTree ul#directory_category${id}`);
  }

  /** カテゴリツリーの項目の表示（「ID:n 名称 (直下の件数)」）を読む。閉じた枝の中の項目も読む */
  async treeItem(id: string): Promise<TreeItem> {
    const link = this.treeLink(id);
    await expect(link, `カテゴリツリーのカテゴリID ${id}`).toHaveCount(1);
    const text = ((await link.textContent()) ?? "").replace(/\s+/g, " ").trim();
    const m = /^ID:(\d+)\s+(.*?)\s+\((\d+)\)$/.exec(text);
    if (!m) throw new Error(`カテゴリツリーの表示を読めない: ${text}`);
    return { id: m[1], name: m[2], count: m[3] };
  }

  /** カテゴリツリーで、そのカテゴリを包む枝のカテゴリID（外側から順） */
  async treeAncestors(id: string): Promise<string[]> {
    const link = this.treeLink(id);
    await expect(link, `カテゴリツリーのカテゴリID ${id}`).toHaveCount(1);
    return link.evaluate((a) => {
      const ids: string[] = [];
      for (let el = a.parentElement; el; el = el.parentElement) {
        if (el.matches("ul.collapse") && /^directory_category\d+$/.test(el.id)) ids.unshift(el.id.replace("directory_category", ""));
      }
      return ids;
    });
  }

  /** カテゴリツリーで開いている枝のカテゴリID（ツリーの上から順） */
  async openBranchIds(): Promise<string[]> {
    return this.page.locator("#ex-secondaryCol .c-directoryTree ul.collapse.show").evaluateAll((uls) => uls
      .map((ul) => ul.id.replace("directory_category", "")));
  }

  /** カテゴリの枝が開いているか（子の無いカテゴリは枝が無いので false） */
  async isBranchOpen(id: string): Promise<boolean> {
    const ul = this.treeBranch(id);
    if ((await ul.count()) === 0) return false;
    return ul.evaluate((e) => e.classList.contains("show"));
  }

  /** つまみの状態（閉じた印・開いた印） */
  async toggleState(id: string): Promise<{ collapsedMark: boolean; expanded: string | null }> {
    const t = this.treeToggle(id);
    await expect(t, `カテゴリツリーのカテゴリID ${id} のつまみ`).toHaveCount(1);
    return t.evaluate((e) => ({ collapsedMark: e.classList.contains("collapsed"), expanded: e.getAttribute("aria-expanded") }));
  }

  /** カテゴリツリーの枝のつまみを押して開く（開いていれば何もしない） */
  async openBranch(id: string): Promise<void> {
    if (await this.isBranchOpen(id)) return;
    await this.treeToggle(id).click();
    await expect(this.treeBranch(id), `カテゴリツリーのカテゴリID ${id} の枝が開かない`).toHaveClass(/\bshow\b/);
  }

  /** カテゴリツリーで、そのカテゴリが見えるまで外側の枝から順に開く */
  async revealInTree(id: string): Promise<void> {
    for (const b of await this.treeAncestors(id)) await this.openBranch(b);
    await expect(this.treeLink(id), `カテゴリツリーのカテゴリID ${id} が見えない`).toBeVisible();
  }

  /** カテゴリツリーで、そのカテゴリの親（最上位なら null） */
  async treeParentOf(id: string): Promise<string | null> {
    const a = await this.treeAncestors(id);
    return a.length ? a[a.length - 1] : null;
  }

  // ---- 並べ替え ----

  /**
   * 一覧の行を、三点リーダーの位置からつかんで、別の行の下へドラッグして放す。放すと確認のポップアップが出る。
   * ポップアップは閉じずに返す（押すのは次の手順）。放す操作は、ポップアップが閉じるまで終わらない。
   */
  async dragBelow(fromId: string, belowId: string): Promise<{ dialog: Dialog; released: Promise<void> }> {
    const handle = this.rowParts(fromId).handle;
    const target = this.rowById(belowId);
    await expect(handle, `カテゴリID ${fromId} の三点リーダー`).toBeVisible();
    // 座標は画面に見えている範囲で測る（画面の外の行を測ると、つかむ位置がずれて文字の選択になる）
    await target.scrollIntoViewIfNeeded();
    await handle.scrollIntoViewIfNeeded();
    const h = (await handle.boundingBox())!;
    const shown = this.page.waitForEvent("dialog", { timeout: 10_000 });
    await this.page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 + 5, { steps: 5 });
    // つかむと、画面の下端まで送ってあるときはスクロールの位置が戻って行の位置がずれることがある（016 の1回目）。
    // 放す先の行の位置は、つかんだあとで測る
    const t = (await target.boundingBox())!;
    await this.page.mouse.move(h.x + h.width / 2, t.y + t.height + 5, { steps: 20 });
    const released = this.page.mouse.up();
    const dialog = await shown.catch(() => { throw new Error("ドラッグして放したが、並べ替えの確認のポップアップが出ない"); });
    return { dialog, released };
  }

  /** 表示順入替ボタン（上移動・下移動）を押す。確認のポップアップは閉じずに返す。押す操作は、ポップアップが閉じるまで終わらない */
  async pressMove(id: string, dir: "up" | "down"): Promise<{ dialog: Dialog; pressed: Promise<void> }> {
    const button = dir === "up" ? this.rowParts(id).up : this.rowParts(id).down;
    await expect(button, `カテゴリID ${id} の表示順入替ボタン（${dir === "up" ? "上移動" : "下移動"}）`).toBeVisible();
    await this.page.waitForLoadState("load");
    const shown = this.page.waitForEvent("dialog", { timeout: 10_000 });
    const pressed = button.click();
    const dialog = await shown.catch(() => { throw new Error("表示順入替ボタンを押したが、並べ替えの確認のポップアップが出ない"); });
    return { dialog, pressed };
  }

  /** 並べ替えの確認のポップアップで OK を押し、表示順の保存の応答の状態を返す */
  async acceptMove(dialog: Dialog, done: Promise<void>): Promise<number> {
    const saved = this.page.waitForResponse((r) => r.url().includes("/product/category/sort_no/move"));
    await dialog.accept();
    await done;
    return (await saved).status();
  }

  // ---- 削除 ----

  deleteModal(): Locator {
    return this.page.locator("#DeleteModal");
  }

  /** 行の削除ボタンを押して削除確認モーダルを開き、モーダルの「削除」の送り先がそのカテゴリになるのを待つ */
  async openDeleteModal(id: string): Promise<Locator> {
    await this.page.waitForLoadState("load");
    const button = this.rowParts(id).delete;
    await expect(button, `一覧のカテゴリID ${id} の削除ボタン`).toBeVisible();
    await button.click();
    const modal = this.deleteModal();
    await expect(modal, "削除確認モーダル").toBeVisible();
    await expect(this.deleteConfirmButton(), "削除確認モーダルの「削除」の送り先").toHaveAttribute("href", new RegExp(`/product/category/${id}/delete$`));
    return modal;
  }

  deleteConfirmButton(): Locator {
    return this.deleteModal().locator('a.btn-ec-delete[data-method="delete"]');
  }

  deleteCancelButton(): Locator {
    return this.deleteModal().locator('.modal-footer button[data-bs-dismiss="modal"]');
  }

  /** 削除確認モーダルの文言 */
  async deleteModalMessage(): Promise<string> {
    return ((await this.deleteModal().locator("p.modal-message").textContent()) ?? "").trim();
  }

  /** 削除確認モーダルの「キャンセル」を押し、モーダルが閉じるのを待つ */
  async cancelDelete(): Promise<void> {
    await expect(this.deleteCancelButton(), "削除確認モーダルの「キャンセル」").toHaveText(/^\s*キャンセル\s*$/);
    await this.deleteCancelButton().click();
    await expect(this.deleteModal(), "削除確認モーダルが閉じない").toBeHidden();
  }

  /** 削除確認モーダルの「削除」を押し、結果の画面へ移るのを待つ。削除の要求の応答の状態を返す */
  async confirmDeleteOf(id: string): Promise<number> {
    const button = this.deleteConfirmButton();
    await expect(button, "削除確認モーダルの「削除」").toHaveText(/^\s*削除\s*$/);
    const res = this.page.waitForResponse((r) => r.url().endsWith(`/product/category/${id}/delete`) && r.request().method() === "POST");
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), button.click()]);
    await this.page.waitForLoadState("load");
    return (await res).status();
  }

  /**
   * 削除ボタンの位置を利用者と同じに押して、削除確認モーダルが開くかを見る（押せない状態でも、その位置を押す）。
   * 開いたら「キャンセル」で閉じる（削除はしない）。
   */
  async tryOpenDelete(id: string): Promise<boolean> {
    await this.page.waitForLoadState("load");
    await this.rowParts(id).delete.click({ force: true });
    const opened = await this.deleteModal().waitFor({ state: "visible", timeout: 3_000 }).then(() => true, () => false);
    if (opened) await this.cancelDelete();
    return opened;
  }

  /** 削除ボタンに指を載せたときに出る補足（ツールチップ）の文。出なければ null */
  async deleteHintText(id: string): Promise<string | null> {
    await this.page.waitForLoadState("load");
    const box = this.rowParts(id).deleteHint;
    await expect(box, `一覧のカテゴリID ${id} の削除ボタンを包む補足の枠`).toHaveCount(1);
    await box.hover({ timeout: 30_000 });
    const tip = this.page.locator(".tooltip.show .tooltip-inner");
    const shown = await tip.first().waitFor({ state: "visible", timeout: 3_000 }).then(() => true, () => false);
    return shown ? ((await tip.first().textContent()) ?? "").trim() : null;
  }

  /** 画面上部の案内（成功・警告・エラーの帯）の文 */
  async alertTexts(): Promise<string[]> {
    const texts = await this.page.locator(".alert:visible").allInnerTexts();
    return texts.map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && t !== "デバッグモードが有効になっています。");
  }
}

/**
 * カテゴリ一覧の「CSV出力項目設定」ボタンからCSV出力項目設定画面（対象はカテゴリCSV）を開き、
 * 指定した項目が「出力する項目」に入っていることを確かめる。「出力しない項目」にあれば移して登録する。
 * ほかの項目は外さない（ほかの機能の試験もカテゴリCSVの親カテゴリIDなどを読むため）。移した項目の名前を返す。
 */
export async function ensureCategoryCsvOutputs(page: Page, labels: string[], what: string,
  onWarning: (w: string) => void): Promise<string[]> {
  const list = new CategoryListPage(page);
  const open = async () => {
    await list.openTop();
    const button = list.buttonByText("CSV出力項目設定");
    await expect(button, "カテゴリ一覧の「CSV出力項目設定」ボタン").toHaveCount(1);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), button.click()]);
    await page.waitForLoadState("load");
    await expect(page.locator("#csv-type option:checked"), `${what}: CSV出力項目設定画面の対象のCSV`).toHaveText("カテゴリCSV");
  };
  const options = (id: string) => page.locator(`#${id} option`).evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })));
  await open();
  const outputs = (await options("csv-output")).map((o) => o.label);
  const notOutputs = await options("csv-not-output");
  const missing = labels.filter((l) => !outputs.includes(l));
  if (missing.length === 0) return [];
  const move = missing.map((l) => {
    const hit = notOutputs.filter((o) => o.label === l);
    if (hit.length !== 1) throw new Error(`${what}: カテゴリCSVの出力項目に「${l}」が無い（出力する項目: ${outputs.join("、")}）`);
    return hit[0].value;
  });
  await page.locator("#csv-not-output").selectOption(move);
  await page.locator("#add").click();
  const now = (await options("csv-output")).map((o) => o.label);
  for (const l of missing) if (!now.includes(l)) throw new Error(`${what}: 「${l}」を出力する項目へ移せない`);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#csv-form button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  for (const w of await expectSaved(page, `${what}: CSV出力項目設定の登録`)) onWarning(w);
  await open();
  const saved = (await options("csv-output")).map((o) => o.label);
  for (const l of labels) if (!saved.includes(l)) throw new Error(`${what}: 登録したのに「${l}」が出力する項目に無い`);
  onWarning(`${what}: カテゴリCSVの出力項目に「${missing.join("」「")}」が無かったので、出力する項目へ移して登録した`);
  return missing;
}

/**
 * カテゴリ一覧の「CSVダウンロード」でカテゴリCSVをダウンロードし、条件に合う行が無いことを確かめる。
 * 行があれば、カテゴリツリーでそのカテゴリの親を読み、親の一覧（最上位なら最上位の一覧）でその行の削除ボタンを押して
 * 削除確認モーダルの「削除」を押し、もう一度CSVで確かめる。消したカテゴリIDを返す。
 */
export async function purgeCategoryRows(page: Page, match: (r: Record<string, string>) => boolean, what: string,
  onWarning: (w: string) => void): Promise<string[]> {
  const list = new CategoryListPage(page);
  const removed: string[] = [];
  for (let round = 0; ; round += 1) {
    await list.openTop();
    const hits = (await list.downloadCsv()).filter(match);
    if (hits.length === 0) return removed;
    if (round >= 3) throw new Error(`${what}: 削除したのに、CSVに条件に合う行が残る（${hits.map((r) => r["カテゴリID"]).join("、")}）`);
    for (const r of hits) {
      const id = r["カテゴリID"];
      if (!/^\d+$/.test(id ?? "")) throw new Error(`${what}: カテゴリCSVの行のカテゴリIDを読めない（${JSON.stringify(r)}）`);
      await list.openTop();
      const parent = await list.treeParentOf(id);
      if (parent) await list.openChildrenOf(parent); else await list.openTop();
      const row = (await list.rowValues()).find((v) => v.id === id);
      if (!row) throw new Error(`${what}: カテゴリID ${id} の行が、親の一覧に無い`);
      if (row.deleteDisabled) throw new Error(`${what}: 前の実行で残ったカテゴリID ${id}「${row.nameJp}」は、子カテゴリか商品があって削除ボタンが押せない。片付け方の判断が要る`);
      await list.openDeleteModal(id);
      await list.confirmDeleteOf(id);
      await expect(list.rowById(id), `${what}: カテゴリID ${id} を削除したのに一覧に残っている`).toHaveCount(0);
      removed.push(id);
      onWarning(`${what}: 前の実行で残っていたカテゴリID ${id}「${row.nameJp}」を画面から削除した（削除で、それより大きい表示順が1つずつ減る）`);
    }
  }
}

/**
 * 商品マスター(検索入力)で、既定でチェックされている絞り込み（公開状態・状態・高額商品）を外して商品コードで検索し、
 * 商品コードが一致する行の商品IDを返す（片付けはしない。残りがあるかを見るだけ）。
 */
export async function productIdsByCode(page: Page, code: string): Promise<string[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  const filters: [string, string][] = [["status", "公開状態"], ["card_condition", "状態"], ["expensive", "高額商品"]];
  for (const [field, name] of filters) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), `${name}の絞り込みを外す`).toEqual([]);
  }
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  const ids: string[] = [];
  for (const row of await page.locator('tr[id^="ex-product-"]').all()) {
    if ((await row.locator("td:nth-child(4)").innerText()).trim() === code) ids.push((await row.locator("td:nth-child(2)").innerText()).trim());
  }
  return ids;
}

/**
 * 商品マスター(検索結果)の行の商品名のリンクから商品登録編集画面を開き、商品カテゴリは指定したカテゴリだけにチェックを入れ、
 * 公開状態で「公開」を選び、割引率に選択肢の先頭を選んで「商品を登録」を押す（いま商品マスター(検索結果)を開いている）。
 * 選んだ値は onWarning に渡す（報告に出す）。
 */
export async function relateProductOnlyTo(page: Page, 商品ID: string, categoryId: string, onWarning: (w: string) => void): Promise<void> {
  const link = page.locator(`tr#ex-product-${商品ID} td:nth-child(3) a`);
  await expect(link, `商品マスター(検索結果)の商品ID ${商品ID} の商品名のリンク`).toHaveCount(1);
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${商品ID}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();

  const boxes = form.locator('input[type="checkbox"][name="admin_product[Category][]"]');
  const before = await boxes.evaluateAll((nodes) => nodes.filter((n) => (n as HTMLInputElement).checked)
    .map((n) => ({ value: (n as HTMLInputElement).value, label: (n as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "" })));
  for (const b of before) if (b.value !== categoryId) await form.locator(`#admin_product_category_${b.value}`).setChecked(false);
  await form.locator(`#admin_product_category_${categoryId}`).setChecked(true);
  const after = await boxes.evaluateAll((nodes) => nodes.filter((n) => (n as HTMLInputElement).checked).map((n) => (n as HTMLInputElement).value));
  if (after.join(",") !== categoryId) throw new Error(`商品ID ${商品ID} の商品カテゴリを、カテゴリID ${categoryId} だけにできない（${after.join("、")}）`);
  onWarning(`商品ID ${商品ID} の商品カテゴリの選択を外した: ${before.map((b) => `${b.label}（${b.value}）`).join("、") || "なし"}`);

  const status = form.locator('select[name="admin_product[Status]"]');
  await expect(status, "公開状態の欄").toHaveCount(1);
  await status.selectOption({ label: "公開" });

  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, "割引率の欄").toHaveCount(1);
  const discounts = await discount.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
  if (discounts.length === 0) throw new Error("割引率に選べる値が無い");
  await discount.selectOption(discounts[0].value);
  onWarning(`割引率に「${discounts[0].label}」を選んだ（正本: 販売割引率に登録済みのもの）`);
  await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), "地域別販売制限が選ばれている").toHaveCount(1);

  const save = form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ });
  await expect(save, "「商品を登録」ボタン").toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), save.click()]);
  for (const w of await expectSaved(page, `商品ID ${商品ID} の「商品を登録」`)) onWarning(w);
}
