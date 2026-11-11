// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * M05-01 受注情報検索 一覧(検索入力)の画面操作。セレクタはここにだけ書く。
 * - 検索パターンの欄（検索パターン名・検索条件保存・検索パターン削除）は「詳細検索」の折りたたみの中。検索パターンを選んでいる画面では、はじめから開いている。
 * - 検索パターンのリンクは、検索フォームと検索結果の間に名前の昇順で並ぶ。選んでいる検索パターンはリンクでなく文字で出る。
 * - 検索パターンを選ぶと、アドレスの末尾が検索パターンIDの画面へ移る。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class OrderSearchPage {
  readonly form: Locator;
  readonly orderNumber: Locator;
  readonly patternName: Locator;
  readonly name: Locator;
  readonly kana: Locator;
  readonly email: Locator;
  readonly tenants: Locator;
  readonly detail: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly searchButton: Locator;
  readonly patternBlock: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#search_form");
    this.orderNumber = page.locator("#admin_search_order_order_number");
    this.patternName = page.locator("#admin_search_order_pattern_name");
    this.name = page.locator("#admin_search_order_name");
    this.kana = page.locator("#admin_search_order_kana");
    this.email = page.locator("#admin_search_order_email");
    this.tenants = page.locator("#admin_search_order_tenants");
    this.detail = page.locator("#searchDetail");
    this.saveButton = page.locator("#save_pattern");
    this.deleteButton = page.locator("#delete_pattern");
    this.searchButton = page.locator("#search_submit");
    this.patternBlock = page.locator("div.c-outsideBlock__contents:has(#reload_all_pattern)");
  }

  /** 受注情報検索 一覧(検索入力)画面を開く（検索条件の指定の無いアドレス。画面のスクリプトの読み込みまで待つ） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order"));
    expect(res?.status(), "受注情報検索 一覧(検索入力)画面の応答").toBe(200);
    await expect(this.form, "受注一覧の検索欄").toBeVisible();
    await this.page.waitForLoadState("load");
  }

  /** 詳細検索条件が表示されていなければ、開閉ボタン（1つ目）を押して表示する。押したかを返す */
  async showDetail(): Promise<boolean> {
    if (await this.detail.isVisible()) return false;
    await this.page.locator('button[data-bs-target="#searchDetail"]').first().click();
    await expect(this.patternName, "詳細検索条件の検索パターン名の欄").toBeVisible();
    return true;
  }

  /** 検索パターンのリンクの並び（名前だけ。表示の順。選んでいるものも含む） */
  async patternNames(): Promise<string[]> {
    const items = this.patternBlock.locator(".row.mb-3 > .col-3");
    const texts = await items.allInnerTexts();
    return texts.map((t) => t.replace(/\s+/g, " ").trim().replace(/\s*\([^)]*\)\s*$/, "").trim()).filter(Boolean);
  }

  /** 検索パターンのリンク（名前が一致するもの） */
  patternLink(name: string): Locator {
    return this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']").filter({ hasText: new RegExp(`^\\s*${escapeRe(name)}\\s*(\\(.*\\))?\\s*$`) });
  }

  /** 検索パターンの並びの1件（名前が一致するもの。リンクの外の更新アイコンも含む） */
  patternItem(name: string): Locator {
    return this.patternBlock.locator(".row.mb-3 > .col-3").filter({ hasText: new RegExp(`^\\s*${escapeRe(name)}\\s*(\\(.*\\))?\\s*$`) });
  }

  /** 検索パターンのリンクを押して選ぶ。移った先のアドレスの検索パターンIDを返す */
  async choosePattern(name: string): Promise<string> {
    const link = this.patternLink(name);
    await expect(link, `検索パターンのリンク「${name}」は1件`).toHaveCount(1);
    await Promise.all([this.page.waitForURL(/\/order\/search\/pattern\/\d+$/), link.click()]);
    await this.page.waitForLoadState("load");
    return /\/pattern\/(\d+)$/.exec(this.page.url())![1];
  }

  /** 検索パターン保存ボタンを押す。移った先の応答を待つ */
  async clickSave(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.saveButton.click()]);
  }

  /** 検索パターン削除ボタンを押す。移った先の応答を待つ */
  async clickDelete(): Promise<void> {
    await expect(this.deleteButton, "検索パターン削除ボタン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.deleteButton.click()]);
  }

  /** 検索するボタンを押し、結果の件数の表示まで待つ */
  async clickSearch(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.searchButton.click()]);
    await expect(this.page.locator("#search_total_count"), "検索結果の件数の表示").toBeVisible();
  }

  /** 検索条件を入れて保存する（検索パターンを選んでいない状態から）。保存後の画面（選んだ状態）へ移る */
  async savePattern(v: { 注文番号?: string; お名前?: string; フリガナ?: string; メール?: string; パターン名: string }): Promise<void> {
    await this.open();
    if (v.注文番号 !== undefined) await this.orderNumber.fill(v.注文番号);
    await this.showDetail();
    if (v.お名前 !== undefined) await this.name.fill(v.お名前);
    if (v.フリガナ !== undefined) await this.kana.fill(v.フリガナ);
    if (v.メール !== undefined) await this.email.fill(v.メール);
    await this.patternName.fill(v.パターン名);
    await this.clickSave();
    await expect(this.page.locator(".alert-success"), `検索パターン「${v.パターン名}」の保存`).toContainText("検索条件を保存しました");
  }

  /** 名前の検索パターンがあれば、選んで削除する（無ければ何もしない） */
  async removePatternIfExists(name: string): Promise<boolean> {
    await this.open();
    if ((await this.patternLink(name).count()) === 0) return false;
    await this.choosePattern(name);
    await this.clickDelete();
    return true;
  }

  /**
   * 注文番号の欄に値が入る検索パターンを、すべて確かめて削除する。削除した数を返す。
   * 同じ名前の検索パターンが複数ありうるので、名前でなく並びの番号で1件ずつ選ぶ（削除したときだけ並びが詰まる）。
   */
  async removePatternsWithOrderNumber(value: string): Promise<number> {
    await this.open();
    const total = await this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']").count();
    let removed = 0;
    for (let i = 0; i < total; i++) {
      await this.open();
      const links = this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']");
      const n = await links.count();
      const idx = i - removed;
      if (idx >= n) break;
      await Promise.all([this.page.waitForURL(/\/order\/search\/pattern\/\d+$/), links.nth(idx).click()]);
      await this.page.waitForLoadState("load");
      if ((await this.orderNumber.inputValue()) === value) {
        await this.clickDelete();
        removed++;
      }
    }
    return removed;
  }

  /** 検索パターンのリンクをすべて削除する（見えている範囲）。削除した数を返す */
  async removeAllPatterns(): Promise<number> {
    let removed = 0;
    for (let i = 0; i < 200; i++) {
      await this.open();
      const links = this.patternBlock.locator(".row.mb-3 > .col-3 a[id^='search_pattern_']");
      if ((await links.count()) === 0) return removed;
      await Promise.all([this.page.waitForURL(/\/order\/search\/pattern\/\d+$/), links.first().click()]);
      await this.page.waitForLoadState("load");
      await this.clickDelete();
      removed++;
    }
    throw new Error("検索パターンが200回削除しても無くならない");
  }

  /** 画面上部のメッセージ（成功・エラー） */
  async messages(): Promise<{ success: string[]; error: string[] }> {
    const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    return {
      success: await read(this.page.locator(".alert-success")),
      error: (await read(this.page.locator(".alert-danger"))).filter((t) => t !== "デバッグモードが有効になっています。"),
    };
  }

  /** 検索パターンの更新アイコンが指す検索パターンIDを書き換える（開発者ツールでの書き換えと同じ） */
  async rewriteReloadTarget(name: string, newId: string): Promise<void> {
    const item = this.patternItem(name);
    const btn = item.locator("button.get_count_pattern");
    await expect(btn, `検索パターン「${name}」の更新アイコン`).toHaveCount(1);
    await btn.evaluate((el, id) => {
      el.setAttribute("data-pattern-id", id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jq = (window as any).jQuery;
      if (jq) jq(el).data("pattern-id", id);
    }, newId);
  }

  /** 検索パターンの更新アイコンを押す */
  async pressReload(name: string): Promise<void> {
    const item = this.patternItem(name);
    await item.locator("button.get_count_pattern").click();
  }

  /** 検索パターンの該当件数欄の文字（「*」など） */
  async countText(name: string): Promise<string> {
    const item = this.patternItem(name);
    return ((await item.locator("a span[id^='pattern_id_']").innerText()) ?? "").trim();
  }

  // ---- 受注情報検索 一覧(検索結果) ----
  // 一覧の表は1行が配送先1件。列は チェック・受注日・注文番号・お名前・支払方法・購入金額・出荷指示日・対応状況・店舗・操作。
  // 注文番号のリンクは別のタブで受注情報編集画面を開く。操作の「…」を押すと、編集・削除・メール通知のメニューが出る。

  /** 検索結果の表 */
  get resultTable(): Locator { return this.page.locator("#search_result"); }
  /** 検索結果の件数の表示（「検索結果：N件が該当しました」） */
  get totalCount(): Locator { return this.page.locator("#search_total_count"); }
  /** 件数（表示件数）の選択欄 */
  get pageCountSelect(): Locator { return this.page.locator("#page_count_pulldown"); }
  /** 検索条件の開閉ボタン1（詳細検索条件）・開閉ボタン2（配送先の検索条件） */
  get toggle1(): Locator { return this.page.locator('button[data-bs-target="#searchDetail"]').first(); }
  get toggle2(): Locator { return this.page.locator('button[data-bs-target="#searchDetailDelivery"]').first(); }
  /** 配送先の検索条件（配送先-お名前〜配送先-都道府県）の折りたたみ */
  get deliveryDetail(): Locator { return this.page.locator("#searchDetailDelivery"); }
  /** 検索条件クリアボタン */
  get clearButton(): Locator { return this.page.locator("#search_clear"); }
  /** 購入金額（From） */
  get paymentTotalStart(): Locator { return this.page.locator("#admin_search_order_payment_total_start"); }

  /** 検索結果の行のうち、注文番号の列が一致するもの */
  row(注文番号: string): Locator {
    return this.page.locator("#search_result tbody tr").filter({
      has: this.page.locator("td:nth-child(3) a.action-edit", { hasText: new RegExp(`^\\s*${escapeRe(注文番号)}\\s*$`) }),
    });
  }

  /** 検索結果の注文番号の列（表示の順） */
  async shownOrderNumbers(): Promise<string[]> {
    if ((await this.resultTable.count()) === 0) return [];
    return (await this.page.locator("#search_result tbody tr td:nth-child(3)").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 検索結果の件数の表示の数（読めなければ null） */
  async totalCountNumber(): Promise<number | null> {
    if ((await this.totalCount.count()) === 0) return null;
    const m = /(\d[\d,]*)\s*件/.exec((await this.totalCount.innerText()).replace(/\s+/g, ""));
    return m ? Number(m[1].replace(/,/g, "")) : null;
  }

  /** 検索結果でチェックが入っている行の数 */
  async checkedCount(): Promise<number> {
    return this.page.locator('#search_result input[id^="check_"]:checked').count();
  }

  /** 注文番号の行の受注ID（行のチェックが持つ値） */
  async rowOrderId(注文番号: string): Promise<string> {
    const box = this.row(注文番号).locator('input[id^="check_"]');
    await expect(box, `注文番号「${注文番号}」の行のチェック`).toHaveCount(1);
    return (await box.getAttribute("data-order-id")) ?? "";
  }

  /** 件数の選択欄の選択肢の表示名（並びの順） */
  async pageCountLabels(): Promise<string[]> {
    await expect(this.pageCountSelect, "件数の選択欄").toBeVisible();
    return (await this.pageCountSelect.locator("option").allInnerTexts()).map((t) => t.trim());
  }

  /** 折りたたみの動きが終わるのを待って、表示されているかを返す */
  async settledVisible(box: Locator): Promise<boolean> {
    await expect(box, "折りたたみの動きが終わる").not.toHaveClass(/collapsing/, { timeout: 10_000 });
    await this.page.waitForTimeout(200);
    return box.isVisible();
  }

  /** 注文番号の行の、対応状況の列の文字 */
  async rowStatus(注文番号: string): Promise<string> {
    return ((await this.row(注文番号).locator("td:nth-child(8)").innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /** 注文番号の行の、注文番号の欄（欄の文字全体・注文番号の文字の色・注文番号のリンクを押す要素） */
  async numberCell(注文番号: string): Promise<{ 欄の文字: string; 文字の色: string }> {
    const cell = this.row(注文番号).locator("td:nth-child(3)");
    return {
      欄の文字: ((await cell.innerText()) ?? "").replace(/\s+/g, " ").trim(),
      文字の色: await cell.locator("a.action-edit").evaluate((a) => getComputedStyle(a).color),
    };
  }
  /** 注文番号の行の、注文番号の欄の行（注文番号と、その下の警告文言の行。空の行は除く） */
  async numberCellLines(注文番号: string): Promise<string[]> {
    const cell = this.row(注文番号).locator("td:nth-child(3)");
    return ((await cell.innerText()) ?? "").split("\n").map((t) => t.trim()).filter(Boolean);
  }
  /** 注文番号の行の、注文番号のリンク（別のタブで受注情報編集画面を開く） */
  numberLink(注文番号: string): Locator { return this.row(注文番号).locator("td:nth-child(3) a.action-edit"); }
  /** 注文番号の行の、削除のメニュー項目（偽造防止トークンを属性に持つリンク） */
  deleteAnchor(注文番号: string): Locator { return this.row(注文番号).locator('.dropdown-menu a[data-method="delete"]'); }

  /** 削除のメニュー項目の偽造防止トークンを書き換える（null なら属性を消す。開発者ツールでの書き換えと同じ） */
  async rewriteDeleteToken(注文番号: string, token: string | null): Promise<void> {
    const a = this.deleteAnchor(注文番号);
    await expect(a, `注文番号「${注文番号}」の削除のメニュー項目`).toHaveCount(1);
    await a.evaluate((el, t) => { if (t === null) el.removeAttribute("token-for-anchor"); else el.setAttribute("token-for-anchor", t); }, token);
  }

  /** 手動メール通知画面の注文の欄（受注IDの値と、表示された文字） */
  async manualMailOrderInfo(): Promise<{ 受注ID: string; 文字: string }> {
    const info = this.page.locator("#order_info");
    await expect(info, "手動メール通知画面の注文の欄").toBeVisible();
    return { 受注ID: (await info.getAttribute("value")) ?? "", 文字: ((await info.innerText()) ?? "").replace(/\s+/g, " ").trim() };
  }

  /** CSV出力項目設定画面の、選ばれているCSVの種類（値） */
  async csvTypeValue(): Promise<string> {
    const sel = this.page.locator("#csv-type");
    await expect(sel, "CSV出力項目設定画面のCSVの種類の欄").toBeVisible();
    return sel.inputValue();
  }

  /** 注文番号の行のチェックを入れる */
  async checkRow(注文番号: string): Promise<void> {
    const box = this.row(注文番号).locator('input[id^="check_"]');
    await expect(box, `注文番号「${注文番号}」の行のチェック`).toHaveCount(1);
    await box.check();
  }

  /** 注文番号の行の「…」を押して、操作のメニュー（編集・削除・メール通知）を開き、その項目を返す */
  async openRowMenu(注文番号: string, 項目: "編集" | "削除" | "メール通知"): Promise<Locator> {
    const row = this.row(注文番号);
    await expect(row, `注文番号「${注文番号}」の行`).toHaveCount(1);
    await row.locator("button.dropdown-menu-toggle").click();
    const item = row.locator(".dropdown-menu a.dropdown-item").filter({ hasText: new RegExp(`^\\s*${escapeRe(項目)}\\s*$`) });
    await expect(item, `操作のメニューの「${項目}」`).toBeVisible();
    return item;
  }

  /** 操作のメニュー（CSVダウンロード・カスタムCSV・その他）を開いて、項目を返す */
  async openToolMenu(menu: "CSVダウンロード" | "受注一覧カスタムCSV" | "受注詳細カスタムCSV" | "その他", 項目: string): Promise<Locator> {
    const id = { "CSVダウンロード": "csvDownloadDropDown", "受注一覧カスタムCSV": "customOrderCsvDownloadDropDown", "受注詳細カスタムCSV": "customShippingCsvDownloadDropDown", "その他": "otherDropDown" }[menu];
    const button = this.page.locator(`#${id}`);
    await expect(button, `「${menu}」のボタン`).toBeVisible();
    await button.click();
    const item = button.locator("xpath=following-sibling::div[contains(@class,'dropdown-menu')][1]").locator("a.dropdown-item").filter({ hasText: new RegExp(`^\\s*${escapeRe(項目)}\\s*$`) });
    await expect(item, `「${menu}」のメニューの「${項目}」`).toBeVisible();
    return item;
  }

  /** 一覧の下の操作ボタン（スタック用紙印刷・送り状CSV・納品書印刷（日本語）・納品書印刷（英語）） */
  bulkButton(name: "スタック用紙印刷" | "送り状CSV" | "納品書印刷（日本語）" | "納品書印刷（英語）"): Locator {
    const id = { "スタック用紙印刷": "printStack", "送り状CSV": "labelsExport", "納品書印刷（日本語）": "printDeliverySlipsJp", "納品書印刷（英語）": "printDeliverySlipsEn" }[name];
    return this.page.locator(`#${id}`);
  }

  /** 詳細検索条件のチェック項目（対応状況・支払方法）の表示名（並びの順） */
  async checkLabels(欄: "対応状況" | "支払方法"): Promise<string[]> {
    const box = this.page.locator(欄 === "対応状況" ? "#admin_search_order_status" : "#admin_search_order_payment");
    await expect(box, `詳細検索条件の${欄}の欄`).toBeVisible();
    return (await box.locator("label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 対応状況のチェックを、表示名が一致するものだけにする */
  async checkStatusOnly(labels: string[]): Promise<void> {
    const box = this.page.locator("#admin_search_order_status");
    await expect(box, "詳細検索条件の対応状況の欄").toBeVisible();
    const inputs = box.locator('input[type="checkbox"]');
    const n = await inputs.count();
    const seen: string[] = [];
    for (let i = 0; i < n; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const label = ((await box.locator(`label[for="${id}"]`).innerText()) ?? "").trim();
      seen.push(label);
      if (labels.includes(label)) await input.check(); else await input.uncheck();
    }
    const missing = labels.filter((l) => !seen.includes(l));
    if (missing.length) throw new Error(`対応状況に ${missing.join("・")} の選択肢が無い（${seen.join("、")}）`);
  }

  /** 店舗の選択を、表示名が一致するものだけにする（全店を含めてよい） */
  async selectTenants(labels: string[]): Promise<void> {
    await this.tenants.selectOption(labels.map((label) => ({ label })));
    const chosen = await this.tenants.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
    expect(chosen.sort(), "店舗の選択").toEqual([...labels].sort());
  }

  // ---- 2026-11-10 追加（DB で整えた受注を検索・確認するための操作） ----

  /** 注文者会社名・受注備考の欄（注文者会社名・注文備考・ショップ用メモ・商品コードを横断して検索する欄） */
  get multi(): Locator { return this.page.locator("#admin_search_order_multi"); }
  /** 配送先氏名・住所・送り状No の欄（配送先の検索条件の中） */
  get shippingMulti(): Locator { return this.page.locator("#admin_search_order_shipping_multi"); }
  /** 購入金額（To） */
  get paymentTotalEnd(): Locator { return this.page.locator("#admin_search_order_payment_total_end"); }

  /** 配送先の検索条件が表示されていなければ、開閉ボタン2を押して表示する。押したかを返す */
  async showDelivery(): Promise<boolean> {
    if (await this.deliveryDetail.isVisible()) return false;
    await this.toggle2.click();
    await expect(this.shippingMulti, "配送先の検索条件の配送先氏名・住所・送り状Noの欄").toBeVisible();
    return true;
  }

  /** 日付・日時の欄（項目: order・payment・update・confirm・commit・shipping・cancel・receipt・otc_rsv。種類: start・end・since_before・until_before） */
  dateInput(項目: string, 種類: "start" | "end" | "since_before" | "until_before"): Locator {
    return this.page.locator(`#admin_search_order_${項目}_datetime_${種類}`);
  }

  /** 日時の欄に「2026/09/10 00:00」を入れる（日時の入力欄は書式が違うので、欄の種類に合わせて入れる） */
  async fillDateTime(input: Locator, 年月日時分: string): Promise<void> {
    const m = /^(\d{4})[/-](\d{2})[/-](\d{2}) (\d{2}):(\d{2})$/.exec(年月日時分);
    if (!m) throw new Error(`日時の形が違う: ${年月日時分}`);
    await expect(input, "日時の入力欄").toHaveCount(1);
    const type = (await input.getAttribute("type")) ?? "text";
    if (type === "datetime-local") await input.fill(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`);
    else await input.fill(`${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}`);
  }

  /** 入力状態（未入力・入力）のチェックを、指定した値だけにする（値: 0=未入力・1=入力） */
  async checkEnter(項目: string, 値: ("0" | "1")[]): Promise<void> {
    const boxes = this.page.locator(`input[name="admin_search_order[${項目}_datetime_enter][]"]`);
    await expect(boxes, `${項目}の入力状態のチェック`).toHaveCount(2);
    for (const v of ["0", "1"] as const) {
      const box = boxes.and(this.page.locator(`[value="${v}"]`));
      if (値.includes(v)) await box.check(); else await box.uncheck();
    }
  }

  /** チェック項目の欄（対応状況・支払方法・配送方法・顧客グループ・性別・注文備考）を、表示名が一致するものだけにする */
  async checkGroup(欄: "対応状況" | "支払方法" | "配送方法" | "顧客グループ" | "性別" | "注文備考", labels: string[]): Promise<void> {
    const id = { "対応状況": "status", "支払方法": "payment", "配送方法": "delivery", "顧客グループ": "customer_group", "性別": "sex", "注文備考": "message_flg" }[欄];
    const box = this.page.locator(`#admin_search_order_${id}`);
    await expect(box, `詳細検索条件の${欄}の欄`).toBeVisible();
    const inputs = box.locator('input[type="checkbox"]');
    const n = await inputs.count();
    const seen: string[] = [];
    for (let i = 0; i < n; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute("id");
      const label = ((await box.locator(`label[for="${inputId}"]`).innerText()) ?? "").replace(/\s+/g, " ").trim();
      seen.push(label);
      if (labels.includes(label)) await input.check(); else await input.uncheck();
    }
    const missing = labels.filter((l) => !seen.includes(l));
    if (missing.length) throw new Error(`${欄}に ${missing.join("・")} の選択肢が無い（${seen.join("、")}）`);
  }

  /** 件数の選択欄で件数（例「10件」）を選ぶ。選ぶと一覧が開き直る */
  async selectPageCount(label: string): Promise<void> {
    await expect(this.pageCountSelect, "件数の選択欄").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.pageCountSelect.selectOption({ label })]);
    await expect(this.totalCount, "検索結果の件数の表示").toBeVisible();
  }

  /** 件数の選択欄の選択肢の送信値の一部を書き換える（開発者ツールでの書き換えと同じ。例: 10 → 11） */
  async rewritePageCountOption(label: string, from: string, to: string): Promise<void> {
    const opt = this.pageCountSelect.locator("option", { hasText: new RegExp(`^\\s*${escapeRe(label)}\\s*$`) });
    await expect(opt, `件数の選択肢「${label}」`).toHaveCount(1);
    await opt.evaluate((el, [a, b]) => { (el as HTMLOptionElement).value = (el as HTMLOptionElement).value.replace(a, b); }, [from, to]);
  }

  /** ページングのリンク（ページ番号） */
  pageLink(n: number): Locator {
    return this.page.locator("ul.pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }

  /** ページングで n ページ目を選ぶ */
  async goToPage(n: number): Promise<void> {
    const link = this.pageLink(n);
    await expect(link, `ページングの${n}ページ目のリンク`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    await expect(this.totalCount, "検索結果の件数の表示").toBeVisible();
  }

  /** いま表示しているページの番号（ページングが無ければ 1） */
  async currentPage(): Promise<number> {
    const active = this.page.locator("ul.pagination li.page-item.active");
    if ((await active.count()) === 0) return 1;
    return Number((await active.first().innerText()).replace(/\D/g, "")) || 1;
  }

  /** 注文番号の行の配送IDの値（行のチェックが持つ値。手動メール通知・送り状CSVに渡る） */
  async rowShippingId(注文番号: string): Promise<string> {
    const box = this.row(注文番号).locator('input[id^="check_"]');
    await expect(box, `注文番号「${注文番号}」の行のチェック`).toHaveCount(1);
    return (await box.getAttribute("value")) ?? "";
  }

  /** 検索結果の表の見出しの文字（表示の順） */
  async headerTexts(): Promise<string[]> {
    return (await this.page.locator("#search_result thead th").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 注文番号の行の各列の文字（表示の順。先頭はチェックの列） */
  async rowCells(注文番号: string): Promise<string[]> {
    return (await this.row(注文番号).locator("td").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** 注文番号の行の、受注日の列のリンクの行き先（受注情報編集の受注ID） */
  async rowEditOrderId(注文番号: string): Promise<string> {
    const href = (await this.row(注文番号).locator("td:nth-child(2) a.action-edit").getAttribute("href")) ?? "";
    return /\/order\/(\d+)\/edit/.exec(href)?.[1] ?? "";
  }

  /** 注文番号の行の「当日」のアイコン */
  pickupBadge(注文番号: string): Locator { return this.row(注文番号).locator(".pickup-today-badge"); }

  /** 検索パターンの該当件数欄が「*」でなくなるのを待って、文字を返す */
  async countTextAfterReload(name: string, timeoutMs = 30_000): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const t = await this.countText(name);
      if (t !== "*" && t !== "") return t;
      if (Date.now() > deadline) return t;
      await this.page.waitForTimeout(300);
    }
  }

  /** 検索パターンの該当件数欄の文字が変わる（または時間切れ）まで待って返す */
  async countTextChanged(name: string, before: string, timeoutMs = 15_000): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const t = await this.countText(name);
      if (t !== before && t !== "") return t;
      if (Date.now() > deadline) return t;
      await this.page.waitForTimeout(300);
    }
  }

  /** 検索パターンのリンクの行き先に、アドレスの一部を足す（開発者ツールでの書き換えと同じ） */
  async appendToPatternLink(name: string, 足す: string): Promise<void> {
    const link = this.patternLink(name);
    await expect(link, `検索パターンのリンク「${name}」は1件`).toHaveCount(1);
    await link.evaluate((el, add) => {
      const a = el as HTMLAnchorElement;
      a.setAttribute("href", a.getAttribute("href") + (a.getAttribute("href")!.includes("?") ? "&" : "?") + add);
    }, 足す);
  }

  /** 管理画面のメニュー「受注管理」の「受注一覧」を押して、受注情報検索 一覧(検索入力)画面を開く */
  async openFromMenu(): Promise<void> {
    const link = this.page.locator("#nav-order a").filter({ hasText: /^\s*受注一覧\s*$/ }).first();
    if (!(await link.isVisible())) await this.page.locator('a[href="#nav-order"]').first().click();
    await expect(link, "メニューの受注管理の受注一覧").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    await expect(this.form, "受注一覧の検索欄").toBeVisible();
  }
}
