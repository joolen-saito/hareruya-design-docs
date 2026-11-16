/**
 * M05-01 受注情報検索 一覧の続き（-x）の画面操作。既存の pages/admin/m05_01_order_search.ts の OrderSearchPage を継いで、
 * 店舗・対応状況の選択、検索結果の読み取り、一括の操作（メール一括送信・スタック用紙印刷・送り状CSV）、行の削除、検索条件クリア、表示件数の選択肢を足す。
 * セレクタはここだけに書く。正本: cases/M05-01_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { OrderSearchPage } from "./m05_01_order_search";

/** 一括の操作を押した結果 */
export type 押した結果 = { 警告の文: string[]; 移った先: string; 新しい窓が開いた: boolean; ダウンロードが始まった: boolean };

export class OrderListPage extends OrderSearchPage {
  readonly purchaseFrom: Locator;
  readonly resultTable: Locator;
  constructor(page: Page) {
    super(page);
    this.purchaseFrom = page.locator("#admin_search_order_payment_total_start");
    this.resultTable = page.locator("table#search_result");
  }

  /** 店舗の選択を、名前（「全店」・店名）でそろえる（複数選択の欄。選ばない店舗は外す） */
  async 店舗を選ぶ(名前: string[]): Promise<string[]> {
    await expect(this.tenants, "店舗の選択欄").toBeAttached();
    return this.tenants.evaluate((node, want) => {
      const s = node as HTMLSelectElement;
      const opts = Array.from(s.options);
      const missing = want.filter((w) => !opts.some((o) => (o.textContent ?? "").trim() === w));
      if (missing.length) throw new Error(`店舗の選択肢に ${missing.join("、")} が無い（${opts.map((o) => (o.textContent ?? "").trim()).join("、")}）`);
      for (const o of opts) o.selected = want.includes((o.textContent ?? "").trim());
      const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
      if (w.jQuery) w.jQuery(s).trigger("change"); else s.dispatchEvent(new Event("change", { bubbles: true }));
      return Array.from(s.selectedOptions).map((o) => (o.textContent ?? "").trim());
    }, 名前);
  }

  /** いま選ばれている店舗の名前 */
  async 選ばれている店舗(): Promise<string[]> {
    return this.tenants.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
  }

  /** 対応状況のうち、名前の一致するものだけにチェックを入れる（ほかは外す）。空の配列ならどれにもチェックを入れない */
  async 対応状況だけを選ぶ(名前: string[]): Promise<void> {
    const boxes = this.page.locator('#admin_search_order_status input[type="checkbox"]');
    const n = await boxes.count();
    const found: string[] = [];
    for (let i = 0; i < n; i++) {
      const box = boxes.nth(i);
      const id = await box.getAttribute("id");
      const label = ((await this.page.locator(`label[for="${id}"]`).first().textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
      const name = label.replace(/\s*\(.*\)\s*$/, "").replace(/\s*（.*）\s*$/, "").trim();
      const on = 名前.includes(name);
      if (on) found.push(name);
      if ((await box.isChecked()) !== on) await box.setChecked(on, { force: true });
    }
    const missing = 名前.filter((w) => !found.includes(w));
    if (missing.length) throw new Error(`対応状況の選択肢に ${missing.join("、")} が無い`);
  }

  /** 検索結果の注文番号（表示の順） */
  async 結果の注文番号(): Promise<string[]> {
    if ((await this.resultTable.count()) === 0) return [];
    return (await this.resultTable.locator('tbody td a.action-edit[target="_blank"]').allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /** 検索結果の行（注文番号が一致するもの） */
  結果の行(注文番号: string): Locator {
    return this.resultTable.locator("tbody tr").filter({ has: this.page.locator('a.action-edit[target="_blank"]', { hasText: new RegExp(`^\\s*${注文番号}\\s*$`) }) });
  }

  /** 検索結果の注文番号の欄（その行の注文番号のセル） */
  注文番号の欄(注文番号: string): Locator {
    return this.結果の行(注文番号).locator("td").filter({ has: this.page.locator('a.action-edit[target="_blank"]') }).first();
  }

  /** 注文番号の文字色（rgb の値） */
  async 注文番号の色(注文番号: string): Promise<string> {
    const a = this.注文番号の欄(注文番号).locator('a.action-edit[target="_blank"]').first();
    return a.evaluate((el) => getComputedStyle(el).color);
  }

  /** 行のチェックを入れる（注文番号の行） */
  async 行を選ぶ(注文番号: string): Promise<void> {
    await this.結果の行(注文番号).locator('input[id^="check_"]').first().check({ force: true });
  }

  /** 一括の操作を押す。確認の窓（警告）の文・移った先・新しい窓・ダウンロードの有無を返す */
  async 一括の操作を押す(操作: "メール一括送信" | "スタック用紙印刷" | "送り状CSV"): Promise<押した結果> {
    const before = this.page.url();
    const dialogs: string[] = [];
    const onDialog = (d: import("@playwright/test").Dialog) => { dialogs.push(d.message()); d.accept().catch(() => {}); };
    this.page.on("dialog", onDialog);
    let popup = false; let download = false;
    const onPopup = () => { popup = true; };
    const onDownload = () => { download = true; };
    this.page.context().on("page", onPopup);
    this.page.on("download", onDownload);
    try {
      if (操作 === "メール一括送信") {
        await this.page.locator("#otherDropDown").click();
        await this.page.locator("#manualMailAll").click();
      } else if (操作 === "スタック用紙印刷") {
        await this.page.locator("#printStack").click();
      } else {
        await this.page.locator("#labelsExport").click();
      }
      await this.page.waitForTimeout(3000);
      await this.page.waitForLoadState("load");
    } finally {
      this.page.off("dialog", onDialog);
      this.page.context().off("page", onPopup);
      this.page.off("download", onDownload);
    }
    return { 警告の文: dialogs, 移った先: this.page.url() === before ? "" : this.page.url(), 新しい窓が開いた: popup, ダウンロードが始まった: download };
  }

  /** 行のポップアップメニューから削除を選び、確認の窓で OK を押す。確認の窓の文を返す */
  async 行を削除する(注文番号: string): Promise<string[]> {
    const row = this.結果の行(注文番号);
    await expect(row, `注文番号「${注文番号}」の行`).toHaveCount(1);
    const dialogs: string[] = [];
    const onDialog = (d: import("@playwright/test").Dialog) => { dialogs.push(d.message()); d.accept().catch(() => {}); };
    this.page.on("dialog", onDialog);
    try {
      await row.locator('button.dropdown-menu-toggle[id^="dropdown_"]').first().click();
      const del = row.locator('a.dropdown-item[data-method="delete"]').first();
      await expect(del, "ポップアップメニューの削除").toBeVisible();
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined), del.click({ noWaitAfter: true })]);
      await this.page.waitForLoadState("load");
    } finally { this.page.off("dialog", onDialog); }
    return dialogs;
  }

  /** 検索条件クリアを押す */
  async 検索条件をクリアする(): Promise<void> {
    await this.page.locator("#search_clear").click();
    await this.page.waitForTimeout(500);
  }

  /** 検索結果の件数の選択肢（画面の文字） */
  async 表示件数の選択肢(): Promise<string[]> {
    return (await this.page.locator("#page_count_pulldown option").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /**
   * 撮影のために、閉じた件数の選択欄（プルダウン）を、選択肢がすべて並んで見える一覧の形に広げる（pages/front/f03_03_detail_search.ts の
   * 選択肢を広げて見せる と同じやり方）。ブラウザのプルダウンは開いても画像に写らないので、選択欄そのものを複数行の一覧にする。
   * 選んでいる値・選択肢は変えない。選択欄のすぐ下に「E2E の注記」の枠を置き、選択肢をすべて上から書く。戻すときは返した関数を呼ぶ。
   */
  async 表示件数の選択肢を広げて見せる(): Promise<() => Promise<void>> {
    const select = this.page.locator("#page_count_pulldown");
    await select.waitFor({ state: "attached", timeout: 15_000 });
    await select.evaluate((el) => {
      const sel = el as HTMLSelectElement & { __e2eSaved?: { size: string | null; style: string | null } };
      const texts = Array.from(sel.options).map((x) => (x.textContent ?? "").replace(/\s+/g, " ").trim());
      sel.__e2eSaved = { size: sel.getAttribute("size"), style: sel.getAttribute("style") };
      sel.setAttribute("size", String(Math.max(2, texts.length)));
      for (const [prop, v] of [["height", "auto"], ["max-height", "none"], ["appearance", "auto"], ["-webkit-appearance", "listbox"], ["background-image", "none"], ["overflow-y", "auto"], ["padding", "4px"], ["position", "relative"], ["z-index", "10"]]) {
        sel.style.setProperty(prop, v, "important");
      }
      const note = document.createElement("div");
      note.setAttribute("data-e2e-note", "1");
      note.style.cssText = "border:2px dashed #d00;color:#d00;background:#fff;font-size:12px;line-height:1.5;padding:4px 8px;margin:4px 0;white-space:normal;word-break:break-all;position:relative;z-index:10;";
      note.textContent = `E2E の注記：「件数」の選択欄を、選択肢がすべて見える一覧の形に広げて撮った（選択肢は${texts.length}件）。選択肢（上から）：${texts.map((t, i) => `${i + 1}. ${t}`).join("／")}`;
      sel.insertAdjacentElement("afterend", note);
      sel.scrollIntoView({ block: "center" });
    });
    await this.page.waitForTimeout(300);
    return async () => {
      await select.evaluate((el) => {
        const sel = el as HTMLSelectElement & { __e2eSaved?: { size: string | null; style: string | null } };
        const sv = sel.__e2eSaved;
        if (sv) {
          if (sv.size === null) sel.removeAttribute("size"); else sel.setAttribute("size", sv.size);
          if (sv.style === null) sel.removeAttribute("style"); else sel.setAttribute("style", sv.style);
          sel.__e2eSaved = undefined;
        }
        const next = sel.nextElementSibling;
        if (next && next.getAttribute("data-e2e-note") === "1") next.remove();
      }).catch(() => undefined);
    };
  }

  /** 選ばれている表示件数（画面の文字） */
  async 選ばれている表示件数(): Promise<string> {
    return ((await this.page.locator("#page_count_pulldown option:checked").first().textContent()) ?? "").replace(/\s+/g, " ").trim();
  }

  /** 管理画面のメニューの受注管理から受注情報検索 一覧(検索入力)画面を開く */
  async メニューから開く(): Promise<void> {
    // メニューは「受注管理」（#nav-order）の折りたたみの中に「受注一覧」のリンクがある
    const target = this.page.locator('#nav-order a[href$="/order"]').first();
    if (!(await target.isVisible().catch(() => false))) await this.page.locator('a[href="#nav-order"]').first().click();
    await expect(target, "メニューの受注管理の受注一覧（受注情報検索）のリンク").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), target.click({ noWaitAfter: true })]);
    await expect(this.form, "受注一覧の検索欄").toBeVisible();
  }
}
