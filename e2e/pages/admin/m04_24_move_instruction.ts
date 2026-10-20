/**
 * 在庫移動指示検索画面（メニュー「在庫管理」→「在庫移動指示一覧」）と在庫移動指示詳細画面。
 * 画面の作り（アプリのテンプレート・フォームの定義で確かめたこと）:
 * - 検索欄の出庫元店舗・入庫先店舗は必須（ブラウザの入力チェックも効く）。出庫元店舗の初期値はログイン中の管理者のデフォルト検索表示店舗、
 *   入庫先店舗の初期値は「未選択」。検索ボタンの表示は「検索」。
 * - 初めて開いたとき（検索の前）は一覧に行を出さず、検索結果件数・表示件数・CSVダウンロードの2つのボタンも出さない。
 * - 一覧の列は、選択・移動指示ID（詳細画面へのリンク）・出庫元店舗・入庫先店舗・在庫移動・移動点数・基準価格合計・移動原価合計・
 *   登録日・更新日・送り状No.（無ければ「登録」ボタン）・発送状況。
 * - 「在庫移動実績CSV登録」はモーダルを開く。モーダルの「ファイルを選択」は、隠れたファイルの欄を押してファイルの選択を開く。
 *   ファイルを選ぶと「登録」が押せるようになる。
 * - 送り状No.の「登録」ボタンは、送り状No.登録モーダルを開き、モーダルのフォームの送り先をその在庫移動指示に合わせる。
 * 画面のスクリプトが読み込まれる前に押すと、モーダルやボタンの切り替えが働かないので、読み込みを待ってから押す。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export const moveInstructionListUrl = () => adminUrl("/product/stock/move-instruction");
export const pathOf = (url: string) => new URL(url).pathname;
export const moveInstructionListPath = () => pathOf(moveInstructionListUrl());
export const moveInstructionDetailPath = (id: string) => pathOf(adminUrl(`/product/stock/move-instruction/${id}`));
export const trackingRegisterPath = (id: string) => pathOf(adminUrl(`/product/stock/move-instruction/${id}/tracking`));

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** 送信ボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type SubmitResult =
  | { sent: true; status: number }
  | { sent: false; 止めた項目: string[] };

/** 画面上部のメッセージ（成功・エラー）。開発用の設定のときに常に出る帯は除く */
export async function topMessages(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map(clean).filter((t) => t && !t.includes("デバッグモードが有効"));
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

/** フォームの中で、ブラウザの入力チェックに通らない項目（項目名と、ブラウザの案内の文） */
async function invalidFields(form: Locator): Promise<string[]> {
  return form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
    .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
    .map((e) => {
      const el = e as HTMLInputElement;
      const label = (el.id && f.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()) || "（項目名なし）";
      return `${label}: ${el.validationMessage}`;
    }));
}

export type InstructionRow = {
  移動指示ID: string; 出庫元店舗: string; 入庫先店舗: string; 在庫移動数: string; 移動点数: string; 基準価格合計: string; 移動原価合計: string;
  登録日: string; 更新日: string;
  /** 送り状No.の欄の表示（値か、「登録」ボタンの文字） */
  送り状No欄: string;
  /** 登録されている送り状No.の値（無ければ空） */
  送り状No: string;
  送り状Noの登録ボタン: boolean; 発送状況: string;
};

export class MoveInstructionSearchPage {
  readonly form: Locator;
  readonly 検索欄の見出し: Locator;
  readonly 出庫元店舗: Locator;
  readonly 入庫先店舗: Locator;
  readonly 在庫移動指示ID: Locator;
  readonly 検索ボタン: Locator;
  readonly 検索結果件数: Locator;
  readonly 表示件数: Locator;
  readonly rows: Locator;
  readonly 一覧の案内: Locator;
  readonly 在庫移動実績入力用CSVダウンロード: Locator;
  readonly 送り状CSVダウンロード: Locator;
  readonly 在庫移動実績CSV登録ボタン: Locator;
  readonly CSV登録モーダル: Locator;
  readonly ファイルを選択: Locator;
  readonly ファイルの欄: Locator;
  readonly 選んだファイル名: Locator;
  readonly CSVの登録ボタン: Locator;
  readonly 送り状No登録モーダル: Locator;
  readonly 送り状No登録モーダルの見出し: Locator;
  readonly 送り状No登録フォーム: Locator;
  readonly 送り状Noの欄: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator('form[name="admin_search_stock_move_instruction"]');
    this.検索欄の見出し = page.locator(".card-header .fw-bold", { hasText: exact("在庫移動指示検索") });
    this.出庫元店舗 = this.form.locator('[name="admin_search_stock_move_instruction[move_from_base_info]"]');
    this.入庫先店舗 = this.form.locator('[name="admin_search_stock_move_instruction[move_to_base_info]"]');
    this.在庫移動指示ID = this.form.locator('[name="admin_search_stock_move_instruction[instruction_id]"]');
    this.検索ボタン = this.form.locator('button[type="submit"]');
    this.検索結果件数 = page.locator(".card-body.border-bottom > p.mb-3");
    this.表示件数 = page.locator("#page_count_pulldown");
    this.rows = page.locator("table.table-stock-move-instruction tbody tr").filter({ has: page.locator("input.row-check") });
    this.一覧の案内 = page.locator("table.table-stock-move-instruction tbody tr td[colspan]");
    this.在庫移動実績入力用CSVダウンロード = page.locator("#stockMoveInstructionRecordExport");
    this.送り状CSVダウンロード = page.locator("#stockMoveInstructionLabelsExport");
    this.在庫移動実績CSV登録ボタン = page.locator('button[data-bs-target="#csvRecordRegistrationModal"]');
    this.CSV登録モーダル = page.locator("#csvRecordRegistrationModal");
    this.ファイルを選択 = page.locator("#csvRecordFileSelect");
    this.ファイルの欄 = page.locator("#csvRecordImportFile");
    this.選んだファイル名 = page.locator("#csvRecordFileName");
    this.CSVの登録ボタン = page.locator("#csvRecordUploadButton");
    this.送り状No登録モーダル = page.locator("#trackingRegisterModal");
    this.送り状No登録モーダルの見出し = page.locator("#trackingRegisterModalLabel");
    this.送り状No登録フォーム = page.locator("#trackingRegisterForm");
    this.送り状Noの欄 = page.locator("#trackingRegisterTrackingNo");
  }

  /** 画面の読み込みを終え、検索欄が出るまで待つ */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.form, "在庫移動指示検索画面の検索欄").toBeVisible();
  }

  async open(): Promise<void> {
    const res = await this.page.goto(moveInstructionListUrl());
    if (!res || !res.ok()) throw new Error(`在庫移動指示検索画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.ready();
  }

  /** 選択欄で選ばれている選択肢（表示と値） */
  async selected(select: Locator): Promise<{ 表示: string; 値: string }> {
    return select.evaluate((n) => {
      const o = (n as HTMLSelectElement).selectedOptions[0];
      return { 表示: (o?.textContent ?? "").trim(), 値: o?.value ?? "" };
    });
  }

  /**
   * 「検索」ボタンを押す。ブラウザの入力チェックに通らない項目があれば、送信が止まったこと（要求が出ないこと）を確かめて、止めた項目を返す。
   * 通るときは、送信の応答と、検索結果の画面の読み込みを待つ。
   */
  async pressSearch(): Promise<SubmitResult> {
    const blocked = await invalidFields(this.form);
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.検索ボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの検索が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && pathOf(r.url()) === moveInstructionListPath());
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.検索ボタン.click()]);
    return { sent: true, status: (await response).status() };
  }

  /** 在庫移動指示IDを入れて「検索」を押す。stores を渡したときだけ、出庫元店舗・入庫先店舗も店舗IDで選ぶ */
  async searchById(在庫移動指示ID: string, stores?: { 出庫元店舗ID: string; 入庫先店舗ID: string }): Promise<SubmitResult> {
    if (stores) {
      await this.出庫元店舗.selectOption(stores.出庫元店舗ID);
      await this.入庫先店舗.selectOption(stores.入庫先店舗ID);
    }
    await this.在庫移動指示ID.fill(在庫移動指示ID);
    return this.pressSearch();
  }

  rowById(在庫移動指示ID: string): Locator {
    return this.rows.filter({ has: this.page.locator(`input.row-check[value="${在庫移動指示ID}"]`) });
  }

  /** 一覧の行（上から順） */
  async listedRows(): Promise<InstructionRow[]> {
    return this.rows.evaluateAll((trs) => trs.map((tr) => {
      const td = tr.querySelectorAll("td");
      const t = (i: number) => (td[i]?.textContent ?? "").replace(/\s+/g, " ").trim();
      const value = td[10]?.querySelector(".tracking-no-value");
      return {
        移動指示ID: t(1), 出庫元店舗: t(2), 入庫先店舗: t(3), 在庫移動数: t(4), 移動点数: t(5), 基準価格合計: t(6), 移動原価合計: t(7),
        登録日: t(8), 更新日: t(9), 送り状No欄: t(10), 送り状No: (value?.textContent ?? "").trim(),
        送り状Noの登録ボタン: td[10]?.querySelector("button.btn-tracking-register") !== null, 発送状況: t(11),
      };
    }));
  }

  /** 行の「選択」の欄にチェックを入れる */
  async selectRow(在庫移動指示ID: string): Promise<void> {
    await this.rowById(在庫移動指示ID).locator("input.row-check").check();
  }

  /** 行の移動指示IDのリンクを押し、移った画面のアドレスを返す */
  async pressInstructionId(在庫移動指示ID: string): Promise<string> {
    const link = this.rowById(在庫移動指示ID).locator("td").nth(1).getByRole("link", { name: 在庫移動指示ID, exact: true });
    await expect(link, `移動指示ID ${在庫移動指示ID} のリンク`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    return this.page.url();
  }

  /** 行の送り状No.欄の「登録」ボタンを押す（モーダルが開くのを待つのは呼ぶ側） */
  async pressTrackingRegister(在庫移動指示ID: string): Promise<void> {
    const button = this.rowById(在庫移動指示ID).locator("button.btn-tracking-register");
    await expect(button, `移動指示ID ${在庫移動指示ID} の送り状No.欄の「登録」ボタン`).toHaveCount(1);
    await button.click();
  }

  /** 送り状No.登録モーダルで送り状No.を入れて「登録」を押す。送信の応答と、移った画面の読み込みを待つ */
  async submitTracking(在庫移動指示ID: string, 送り状No: string): Promise<SubmitResult> {
    await expect(this.送り状No登録モーダル, "送り状No.登録モーダル").toBeVisible();
    await this.送り状Noの欄.fill(送り状No);
    const button = this.送り状No登録フォーム.locator('button[type="submit"]');
    const blocked = await invalidFields(this.送り状No登録フォーム);
    if (blocked.length) {
      await button.click();
      return { sent: false, 止めた項目: blocked };
    }
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && pathOf(r.url()) === trackingRegisterPath(在庫移動指示ID));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), button.click()]);
    return { sent: true, status: (await response).status() };
  }

  /** 「在庫移動実績CSV登録」を押し、モーダルが開くのを待つ */
  async openCsvRegistration(): Promise<void> {
    await expect(this.在庫移動実績CSV登録ボタン, "「在庫移動実績CSV登録」ボタン").toBeVisible();
    await this.在庫移動実績CSV登録ボタン.click();
    await expect(this.CSV登録モーダル, "在庫移動実績CSV登録モーダル").toBeVisible();
  }

  /** モーダルの「ファイルを選択」を押してファイルの選択を開き、ファイルを選ぶ。ファイルの選択が開かなければ止める */
  async chooseCsvFile(file: string | { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    const [chooser] = await Promise.all([
      this.page.waitForEvent("filechooser", { timeout: 10_000 }).catch(() => {
        throw new Error("「ファイルを選択」を押しても、ファイルの選択が開かない");
      }),
      this.ファイルを選択.click(),
    ]);
    await chooser.setFiles(file);
  }

  /** モーダルの「登録」を押す。取込の要求を送ったこと（応答）と、移った画面の読み込みを待つ。送れなければ止める */
  async submitCsv(): Promise<{ status: number }> {
    await expect(this.CSVの登録ボタン, "在庫移動実績CSV登録モーダルの「登録」").toBeEnabled();
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/product\/stock\/move-instruction\/csv-tracking$/.test(pathOf(r.url())));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.CSVの登録ボタン.click()]);
    return { status: (await response).status() };
  }
}

/** 在庫移動指示詳細画面 */
export class MoveInstructionDetailPage {
  readonly 見出し: Locator;
  readonly 在庫移動指示ID: Locator;
  readonly 送り状Noの欄: Locator;
  readonly 登録ボタン: Locator;

  constructor(readonly page: Page) {
    this.見出し = page.locator(".card-header .card-title", { hasText: exact("在庫移動指示情報") });
    this.在庫移動指示ID = page.locator("label", { hasText: exact("移動指示ID") }).locator("xpath=following-sibling::p[1]");
    this.送り状Noの欄 = page.locator('[name="admin_stock_move_instruction_detail[trackingNo]"]');
    this.登録ボタン = page.locator("#stockMoveInstructionRegisterButton");
  }

  /** 送り状No.を書き換えて「登録」を押す（画面の保存のボタンの表示は「登録」）。送信の応答と、移った画面の読み込みを待つ */
  async saveTrackingNo(在庫移動指示ID: string, 送り状No: string): Promise<{ status: number }> {
    await this.page.waitForLoadState("load");
    await this.送り状Noの欄.fill(送り状No);
    await expect(this.登録ボタン, "在庫移動指示詳細画面の「登録」が押せる（内容を変えたとき）").toBeEnabled();
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && pathOf(r.url()) === moveInstructionDetailPath(在庫移動指示ID));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.登録ボタン.click()]);
    return { status: (await response).status() };
  }
}

/** サイドバーのメニュー。見出しを押して開き、中のリンクを押す */
export class AdminSidebar {
  constructor(readonly page: Page) {}

  group(見出し: string): Locator {
    return this.page.locator("a.c-mainNavArea__navItemTitle", { hasText: exact(見出し) });
  }

  /** 見出しを押してメニューを開く。開いたメニューの中身を返す */
  async openGroup(見出し: string): Promise<Locator> {
    const group = this.group(見出し);
    await expect(group, `サイドバーの「${見出し}」`).toHaveCount(1);
    const id = await group.getAttribute("aria-controls");
    if (!id) throw new Error(`サイドバーの「${見出し}」にメニューの中身が無い`);
    const body = this.page.locator(`[id="${id}"]`);
    if (!(await body.isVisible())) await group.click();
    await expect(body, `サイドバーの「${見出し}」のメニューが開く`).toBeVisible();
    return body;
  }
}
