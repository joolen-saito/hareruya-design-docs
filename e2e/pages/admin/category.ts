/** カテゴリ登録/編集画面と、カテゴリ登録CSV画面の操作（M03-11）。 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { csvLine, csvRecords, decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

/** カテゴリ一覧の1行（表示順） */
export type CategoryRow = {
  id: string; sortNo: string; nameJp: string; nameEn: string;
  /** 「編集中」の印が付いている（編集中のカテゴリの行） */
  editing: boolean;
  /** ペンアイコンの移動先。入口が無い（見えない・移動先が無い）ときは null */
  editHref: string | null;
  /** ×アイコンが押せない */
  deleteDisabled: boolean;
};

async function downloadedText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return decodeCsvBytes(Buffer.concat(chunks));
}

export class CategoryPage {
  readonly form: Locator;
  readonly nameJp: Locator;
  readonly nameEn: Locator;
  readonly frontHide: Locator;
  readonly branchHide: Locator;
  readonly htmlJa: Locator;
  readonly htmlEn: Locator;
  readonly searchParameters: Locator;
  /** 「子カテゴリ作成」（親を選んだ画面）・「カテゴリ更新」（編集画面）のボタン */
  readonly submit: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#admin_category_form");
    this.nameJp = page.locator("#admin_category_name");
    this.nameEn = page.locator("#admin_category_category_name_en");
    this.frontHide = page.locator("#admin_category_front_search_hide_flg");
    this.branchHide = page.locator("#admin_category_branch_hide_flg");
    this.htmlJa = page.locator("#admin_category_html_ja");
    this.htmlEn = page.locator("#admin_category_html_en");
    this.searchParameters = page.locator("#admin_category_search_parameters");
    this.submit = page.locator('button[type="submit"][form="admin_category_form"]');
    this.rows = page.locator('li.sortable-item[id^="ex-category-"]');
  }

  private async ready(): Promise<void> {
    await expect(this.page.locator("#ex-secondaryCol .c-directoryTree"), "カテゴリ登録/編集画面のカテゴリツリー").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 最上位のカテゴリ登録/編集画面（親カテゴリを選んでいない） */
  async openTop(): Promise<void> {
    await this.page.goto(adminUrl("/product/category"));
    await this.ready();
  }

  /** そのカテゴリを親として選んだカテゴリ登録/編集画面（子カテゴリの一覧と入力欄） */
  async openChildrenOf(parentId: string): Promise<void> {
    await this.page.goto(adminUrl(`/product/category/${parentId}`));
    await this.ready();
  }

  /** そのカテゴリのカテゴリ編集画面 */
  async openEdit(id: string): Promise<void> {
    await this.page.goto(adminUrl(`/product/category/${id}/edit`));
    await this.ready();
  }

  async rowValues(): Promise<CategoryRow[]> {
    return this.rows.evaluateAll((items) => items.map((li) => {
      const el = li as HTMLElement;
      const names = Array.from(el.querySelectorAll(".flex-grow-1 > a, .flex-grow-1 > span:not(.text-ec-gray):not(.badge)"))
        .map((n) => (n.textContent ?? "").trim());
      const edit = el.querySelector("a.action-edit") as HTMLAnchorElement | null;
      const del = el.querySelector('a[data-bs-target="#DeleteModal"]');
      return {
        id: el.dataset.id ?? "", sortNo: el.dataset.sortNo ?? "",
        nameJp: names[0] ?? "", nameEn: names[1] ?? "",
        editing: el.querySelector(".badge") !== null,
        editHref: edit && !edit.classList.contains("invisible") && edit.getAttribute("href") ? edit.href : null,
        deleteDisabled: del === null || del.classList.contains("disabled"),
      };
    }));
  }

  /** 一覧で名称（日）が一致する行のID。行がちょうど1件でなければ落とす */
  async idOf(nameJp: string): Promise<string> {
    const hit = (await this.rowValues()).filter((r) => r.nameJp === nameJp);
    if (hit.length !== 1) throw new Error(`カテゴリ一覧に「${nameJp}」の行が ${hit.length} 件ある（1件のはず）`);
    return hit[0].id;
  }

  /** 一覧で名称（日）が一致する行の操作欄 */
  row(nameJp: string): Locator {
    return this.rows.filter({ has: this.page.locator(".flex-grow-1 > :first-child", { hasText: new RegExp(`^\\s*${escape(nameJp)}\\s*$`) }) });
  }

  /** 一覧でカテゴリIDの行 */
  rowById(id: string): Locator {
    return this.page.locator(`li.sortable-item#ex-category-${id}`);
  }

  /** パンくずの項目（先頭の「すべてのカテゴリ」を含む） */
  async breadcrumb(): Promise<string[]> {
    return (await this.page.locator('nav[aria-label="breadcrumb"] li.breadcrumb-item').allInnerTexts()).map((t) => t.trim());
  }

  /** カテゴリツリーで見えているカテゴリ（「ID:n 名称 (子の数)」のIDと名称）。閉じた枝の中は含めない */
  async visibleTree(): Promise<{ id: string; name: string }[]> {
    await this.page.waitForLoadState("load");
    const texts = await this.page.locator("#ex-secondaryCol .c-directoryTree a").evaluateAll((links) => links
      .filter((a) => (a as HTMLElement).offsetParent !== null).map((a) => (a.textContent ?? "").replace(/\s+/g, " ").trim()));
    return texts.map((t) => {
      const m = /^ID:(\d+)\s+(.*?)\s+\(\d+\)$/.exec(t);
      if (!m) throw new Error(`カテゴリツリーの表示を読めない: ${t}`);
      return { id: m[1], name: m[2] };
    });
  }

  /**
   * カテゴリツリーでカテゴリを選ぶ（名称のリンクを押す）。閉じた枝の中にあれば、外側の枝から順に開いてから押す
   * （ツリーで下の階層を選ぶときの操作）。
   */
  async selectInTree(id: string): Promise<void> {
    const link = this.page.locator(`#ex-secondaryCol .c-directoryTree a[href$="/product/category/${id}"]`);
    await expect(link, `カテゴリツリーのカテゴリID ${id}`).toHaveCount(1);
    const branches = await link.evaluate((a) => {
      const ids: string[] = [];
      for (let el = a.parentElement; el; el = el.parentElement) if (el.matches("ul.collapse") && el.id) ids.unshift(el.id);
      return ids;
    });
    for (const b of branches) {
      const ul = this.page.locator(`ul#${b}`);
      if (await ul.evaluate((e) => e.classList.contains("show"))) continue;
      await this.page.locator(`#ex-secondaryCol .c-directoryTree label[href="#${b}"]`).click();
      await expect(ul, "カテゴリツリーの枝が開かない").toHaveClass(/\bshow\b/);
    }
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await this.ready();
  }

  /** 画面の小見出しが「カテゴリ一覧」（カテゴリ登録/編集画面とカテゴリ編集画面に共通の画面名） */
  async subTitle(): Promise<string> {
    return (await this.page.locator(".c-pageTitle__subTitle").first().innerText()).trim();
  }

  /** カテゴリの画面の部品（カテゴリツリー・入力欄）のうち、表示されているもの */
  async categoryScreenParts(): Promise<string[]> {
    const parts: string[] = [];
    if (await this.page.locator("#ex-secondaryCol .c-directoryTree").count()) parts.push("カテゴリツリー");
    if (await this.form.count()) parts.push("カテゴリの入力欄");
    return parts;
  }

  /** 入力欄に値を入れる。指定しない欄は触らない */
  async fill(v: CategoryInput): Promise<void> {
    if (v.nameJp !== undefined) await this.nameJp.fill(v.nameJp);
    if (v.nameEn !== undefined) await this.nameEn.fill(v.nameEn);
    if (v.frontHide !== undefined) await this.frontHide.setChecked(v.frontHide);
    if (v.branchHide !== undefined) await this.branchHide.setChecked(v.branchHide);
    if (v.htmlJa !== undefined) await this.htmlJa.fill(v.htmlJa);
    if (v.htmlEn !== undefined) await this.htmlEn.fill(v.htmlEn);
    if (v.searchParameters !== undefined) await this.searchParameters.fill(v.searchParameters);
  }

  /** 「子カテゴリ作成」・「カテゴリ更新」を押して、結果の画面へ移るのを待つ */
  async submitAndWait(): Promise<void> {
    await expect(this.submit, "子カテゴリ作成・カテゴリ更新のボタン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), this.submit.click()]);
    await this.page.waitForLoadState("load");
  }

  /**
   * 親を選んだ画面で子カテゴリを登録し、振られたカテゴリIDを一覧の行から読む。
   * 同じ名称の行が前からあれば、登録で増えた行を選ぶ（同名が残っていても、今回の行を取り違えない）。
   */
  async createChild(parentId: string, v: CategoryInput & { nameJp: string }, onWarning: (w: string) => void): Promise<string> {
    await this.openChildrenOf(parentId);
    const before = (await this.rowValues()).filter((r) => r.nameJp === v.nameJp).map((r) => r.id);
    await this.fill(v);
    await this.submitAndWait();
    for (const w of await expectSaved(this.page, `カテゴリ「${v.nameJp}」の登録`)) onWarning(w);
    expect(this.page.url(), "登録後は親カテゴリの一覧へ戻る").toBe(adminUrl(`/product/category/${parentId}`));
    const added = (await this.rowValues()).filter((r) => r.nameJp === v.nameJp && !before.includes(r.id));
    if (added.length !== 1) throw new Error(`カテゴリ「${v.nameJp}」の登録で増えた行が ${added.length} 件`);
    if (before.length > 0) onWarning(`親カテゴリ ${parentId} の下に同名の「${v.nameJp}」が前から ${before.length} 件あり、登録で増えた行を使った`);
    return added[0].id;
  }

  /** 編集画面で値を変えて「カテゴリ更新」を押し、保存の結果を確かめる */
  async update(id: string, v: CategoryInput, onWarning: (w: string) => void): Promise<void> {
    await this.openEdit(id);
    await this.fill(v);
    await this.submitAndWait();
    for (const w of await expectSaved(this.page, `カテゴリ ${id} の更新`)) onWarning(w);
  }

  /** 行の×アイコンを押して、削除の確認モーダルを開く */
  async openDelete(nameJp: string): Promise<Locator> {
    const row = this.row(nameJp);
    await expect(row, `カテゴリ一覧の「${nameJp}」の行`).toHaveCount(1);
    return this.openDeleteOf(row);
  }

  /** カテゴリIDの行の×アイコンを押して、削除の確認モーダルを開く */
  async openDeleteById(id: string): Promise<Locator> {
    const row = this.rowById(id);
    await expect(row, `カテゴリ一覧のカテゴリID ${id} の行`).toHaveCount(1);
    return this.openDeleteOf(row);
  }

  private async openDeleteOf(row: Locator): Promise<Locator> {
    await row.locator('a[data-bs-target="#DeleteModal"]').click();
    const modal = this.page.locator("#DeleteModal");
    await expect(modal, "削除の確認").toBeVisible();
    return modal;
  }

  /** 削除の確認モーダルで、確定のボタン（画面の名称は「削除」）を押し、結果の画面へ移るのを待つ */
  async confirmDelete(modal: Locator): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      modal.locator('a.btn-ec-delete[data-method="delete"]').click(),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 「CSVダウンロード」でカテゴリCSVをダウンロードし、各行を「列名→値」で返す */
  async downloadCsv(): Promise<Record<string, string>[]> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.locator('a.btn[href$="/product/category/export"]').click(),
    ]);
    return csvRecords(await downloadedText(download));
  }
}

export type CategoryInput = {
  nameJp?: string; nameEn?: string; frontHide?: boolean; branchHide?: boolean;
  htmlJa?: string; htmlEn?: string; searchParameters?: string;
};

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** カテゴリ登録CSV画面の雛形をダウンロードし、見出し（列名）を返す */
export async function downloadCategoryCsvTemplate(page: Page): Promise<string[]> {
  await page.goto(adminUrl("/product/category/category_bulk_csv_upload"));
  const [download] = await Promise.all([page.waitForEvent("download"), page.locator("#download-template-button").click()]);
  const [headers] = parseCsv(await downloadedText(download));
  if (!headers || !headers.includes("カテゴリ名(日)") || !headers.includes("親カテゴリID"))
    throw new Error(`カテゴリ登録CSVの雛形の見出しを読めない: ${headers?.join(",")}`);
  return headers;
}

/** カテゴリ登録CSV画面で、指定した列だけ値を入れたCSVをアップロードする（ほかの列は空） */
export async function registerCategoryCsv(page: Page, rows: Record<string, string>[], fileName: string, what: string,
  onWarning: (w: string) => void): Promise<void> {
  const headers = await downloadCategoryCsvTemplate(page);
  const known = new Set(headers);
  for (const row of rows) for (const key of Object.keys(row)) if (!known.has(key)) throw new Error(`カテゴリ登録CSVの雛形に列「${key}」が無い`);
  const csv = Buffer.from(`${[csvLine(headers), ...rows.map((r) => csvLine(headers.map((h) => r[h] ?? "")))].join("\n")}\n`, "utf8");
  await page.locator("#upload-form input[type=file]").setInputFiles({ name: fileName, mimeType: "text/csv", buffer: csv });
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator("#upload-button").click()]);
  for (const w of await expectSaved(page, what)) onWarning(w);
}

/** カテゴリ登録CSVの1行（取込で必須の列を含む）。正本のシードが「…にした行」と書いた値を入れる */
export type CategoryCsvRow = {
  /** 新規登録は空 */
  id?: string;
  /** 新規登録は空 */
  rank?: string;
  nameJp: string;
  nameEn: string;
  /** 最上位は "0" */
  parentId: string;
  frontHide?: "0" | "1";
  branchHide?: "0" | "1";
  searchParameters?: string;
};

function csvRowValues(r: CategoryCsvRow): Record<string, string> {
  return {
    "カテゴリID": r.id ?? "", "表示ランク": r.rank ?? "", "カテゴリ名(日)": r.nameJp, "カテゴリ名(英)": r.nameEn,
    "親カテゴリID": r.parentId, "フロント非表示フラグ": r.frontHide ?? "0", "支店非表示フラグ": r.branchHide ?? "0",
    "検索パラメータ": r.searchParameters ?? "",
  };
}

/** カテゴリ登録CSV画面で、行を登録・更新する */
export async function uploadCategoryRows(page: Page, rows: CategoryCsvRow[], fileName: string, what: string,
  onWarning: (w: string) => void): Promise<void> {
  await registerCategoryCsv(page, rows.map(csvRowValues), fileName, what, onWarning);
}

/**
 * カテゴリ登録CSV画面で最上位のカテゴリを1件登録し、最上位の一覧のID欄からカテゴリIDを読む。
 * 同じ名称の行が前からあれば、登録で増えた行を選ぶ。
 */
export async function createTopByCsv(page: Page, row: Omit<CategoryCsvRow, "id" | "rank" | "parentId">, fileName: string,
  onWarning: (w: string) => void): Promise<string> {
  return createByCsv(page, { ...row, parentId: "0" }, fileName, onWarning);
}

/**
 * カテゴリ登録CSV画面でカテゴリを1件登録し、親の一覧（最上位なら最上位の一覧）のID欄からカテゴリIDを読む。
 * 同じ名称の行が前からあれば、登録で増えた行を選ぶ。
 */
export async function createByCsv(page: Page, row: Omit<CategoryCsvRow, "id" | "rank">, fileName: string,
  onWarning: (w: string) => void): Promise<string> {
  const category = new CategoryPage(page);
  const openList = () => row.parentId === "0" ? category.openTop() : category.openChildrenOf(row.parentId);
  const where = row.parentId === "0" ? "最上位" : `親カテゴリ ${row.parentId} の下`;
  await openList();
  const before = (await category.rowValues()).filter((r) => r.nameJp === row.nameJp).map((r) => r.id);
  await uploadCategoryRows(page, [row], fileName, `${where}のカテゴリ「${row.nameJp}」のCSV登録`, onWarning);
  await openList();
  const added = (await category.rowValues()).filter((r) => r.nameJp === row.nameJp && !before.includes(r.id));
  if (added.length !== 1) throw new Error(`${where}のカテゴリ「${row.nameJp}」のCSV登録で増えた行が ${added.length} 件`);
  if (before.length > 0) onWarning(`${where}に同名の「${row.nameJp}」が前から ${before.length} 件あり、登録で増えた行を使った`);
  return added[0].id;
}

/**
 * 「CSVダウンロード」でダウンロードしたカテゴリCSVで、条件に合う行が無いことを確かめる。
 * 行があれば、そのカテゴリが並ぶ一覧を開き、その行の×アイコンを押して削除を実行する。消したカテゴリIDを返す。
 */
export async function purgeCategories(page: Page, match: (r: Record<string, string>) => boolean, what: string,
  onWarning: (w: string) => void): Promise<string[]> {
  const category = new CategoryPage(page);
  await category.openTop();
  const hits = (await category.downloadCsv()).filter(match);
  for (const r of hits) {
    const id = r["カテゴリID"];
    const parent = r["親カテゴリID"];
    if (!/^\d+$/.test(id)) throw new Error(`${what}: カテゴリCSVの行のカテゴリIDを読めない（${JSON.stringify(r)}）`);
    if (parent && parent !== "0") await category.openChildrenOf(parent); else await category.openTop();
    await category.confirmDelete(await category.openDeleteById(id));
    await expect(category.rowById(id), `${what}: カテゴリID ${id} を削除したのに一覧に残っている`).toHaveCount(0);
    onWarning(`${what}: 前の実行で残っていたカテゴリID ${id}「${r["カテゴリ名(日)"]}」を画面から削除した`);
  }
  return hits.map((r) => r["カテゴリID"]);
}
