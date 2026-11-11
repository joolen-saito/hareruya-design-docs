/**
 * M08-01 会員検索一覧（検索入力・検索結果）の画面操作。セレクタはここにだけ書く。
 * - 検索パターンの欄（検索パターン名・検索条件保存・検索パターン削除）は「詳細検索」の折りたたみの中。検索パターンで検索した画面では、はじめから開いている。
 * - 検索パターンのリンクは、検索欄と検索結果の間に並ぶ。選ぶと、アドレスの末尾が検索パターンIDの画面へ移る。
 * - 会員の削除は、結果の行の「…」メニューの「削除」→確認のモーダルの「削除」（ブラウザの確認ダイアログではなく、画面内のモーダル）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class M08CustomerListPage {
  readonly form: Locator;
  readonly multi: Locator;
  readonly detail: Locator;
  readonly detailToggle: Locator;
  readonly patternName: Locator;
  readonly closeReason: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;

  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    this.form = page.locator("form#search_form");
    this.multi = page.locator("#admin_search_customer_multi");
    this.detail = page.locator("#searchDetail");
    this.detailToggle = page.locator('[data-bs-toggle="collapse"][href="#searchDetail"]');
    this.patternName = page.locator("#admin_search_customer_pattern_name");
    this.closeReason = page.locator("#admin_search_customer_close_reason");
    this.saveButton = page.locator('button.submit[data-action$="/customer/save/pattern"]');
    this.deleteButton = page.locator('button.submit[data-method="delete"]');
  }

  /** 会員検索一覧(検索入力)画面を開く（検索条件の指定の無いアドレス） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/customer"), { timeout: 60_000 });
    expect(res?.status(), "会員検索一覧(検索入力)画面の応答").toBe(200);
    await expect(this.form, "会員検索一覧の検索欄").toBeVisible({ timeout: T });
    await this.page.waitForLoadState("load");
  }

  async 詳細検索が開いているか(): Promise<boolean> { return this.detail.isVisible(); }

  /** 詳細検索が閉じていれば開閉ボタンで開く */
  async showDetail(): Promise<void> {
    if (await this.detail.isVisible()) return;
    await this.detailToggle.click({ timeout: T });
    await expect(this.patternName, "詳細検索の検索パターン名の欄").toBeVisible({ timeout: T });
  }

  /** 検索条件の開閉ボタンを1回押し、開閉の動き（アニメーション）が終わるのを待つ */
  async toggleDetail(): Promise<void> {
    await this.detailToggle.click({ timeout: T });
    await this.page.waitForFunction(() => { const e = document.querySelector("#searchDetail"); return !!e && !e.classList.contains("collapsing"); }, undefined, { timeout: T });
  }

  /** 会員ID・メールアドレス・お名前に入れて検索する（結果の画面まで待つ） */
  async searchMulti(語: string): Promise<void> {
    await this.multi.fill(語, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.form.locator('button[type=submit]').filter({ hasText: "検索" }).first().click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  row(会員ID: string): Locator { return this.page.locator(`tr#ex-customer-${会員ID}`); }

  /** 結果の行の「…」メニューから「削除」を選び、削除の確認のモーダルを出す（ブラウザの確認ダイアログではなく画面内のモーダル） */
  async 削除リンクを押す(会員ID: string): Promise<void> {
    const row = this.row(会員ID);
    await expect(row, `検索結果に会員ID ${会員ID} の行がある`).toHaveCount(1, { timeout: T });
    await row.locator("i.dropdown-menu-toggle").click({ timeout: T });
    await row.locator(`a[data-bs-target="#discontinuance-${会員ID}"]`).click({ timeout: T });
    await expect(this.page.locator(`#discontinuance-${会員ID}`), "削除の確認モーダル").toBeVisible({ timeout: T });
  }

  /** 削除の確認のモーダルの「削除」を押す（押したあとの会員一覧の画面まで待つ） */
  async 確認モーダルで削除する(会員ID: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator(`#discontinuance-${会員ID} a.btn-ec-delete`).click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- 検索パターン ----
  patternLinks(): Locator { return this.page.locator('a[href*="/customer/pattern/"]'); }

  /** 検索パターンの欄に並んでいる名前（選んでいるものはリンクでなく文字で出るので、ここには出ない） */
  async patternLinkNames(): Promise<string[]> {
    return (await this.patternLinks().allInnerTexts()).map((t) => t.trim());
  }

  /** 名前の検索パターンを押して、その画面へ移る。移った画面の検索パターンID（アドレスの末尾の番号）を返す */
  async selectPattern(名前: string): Promise<string> {
    const link = this.patternLinks().filter({ hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) });
    await expect(link, `検索パターン「${名前}」のリンクが1つある`).toHaveCount(1, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      link.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return this.patternIdInUrl() ?? "";
  }

  patternIdInUrl(): string | null {
    return /\/customer\/pattern\/(\d+)/.exec(new URL(this.page.url()).pathname)?.[1] ?? null;
  }

  /** 検索パターン名と退会区分を入れて、検索条件保存ボタンを押す（保存後の画面まで待つ） */
  async savePattern(名前: string, 退会区分?: string): Promise<void> {
    await this.showDetail();
    await this.patternName.fill(名前, { timeout: T });
    if (退会区分 !== undefined) await this.closeReason.fill(退会区分, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.saveButton.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 検索パターンを選んでいる画面で、検索パターン削除ボタンを押し、確認ダイアログのOKを押す。ダイアログの文を返す */
  async deletePattern(): Promise<string> {
    const { 文, OKを押す } = await this.削除ボタンを押す();
    await OKを押す();
    return 文;
  }

  /** 検索パターン削除ボタンを押す。確認ダイアログが開いた状態で返す（手順を「押す」と「OKを押す」に分けるため） */
  async 削除ボタンを押す(): Promise<{ 文: string; OKを押す: () => Promise<void> }> {
    await this.showDetail();
    const dialogP = this.page.waitForEvent("dialog", { timeout: T });
    const clickP = this.deleteButton.click({ timeout: T });
    clickP.catch(() => {});
    const dialog = await dialogP;
    return {
      文: dialog.message(),
      OKを押す: async () => {
        const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
        await dialog.accept();
        await clickP;
        await nav;
        await this.page.waitForLoadState("load");
      },
    };
  }

  get flashes(): Locator { return this.page.locator(".alert"); }

  // ---- 検索条件の入力・検索・クリア ----
  private field(name: string): Locator { return this.page.locator(`#admin_search_customer_${name}`); }

  /** 会員ID・メールアドレス・お名前の欄に入れる（検索はしない） */
  async 検索語を入れる(語: string): Promise<void> { await this.multi.fill(語, { timeout: T }); }

  /** 検索するボタンを押し、結果の画面まで待つ */
  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.form.locator("button[type=submit]").filter({ hasText: "検索" }).first().click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 検索条件をクリアを押す（詳細検索の中にあるので、閉じていれば開く）。画面は読み込み直さず、欄を空にするだけ */
  async 条件をクリアする(): Promise<void> {
    await this.showDetail();
    await this.page.locator("a.search-clear").click({ timeout: T });
  }

  /** チェックの項目（会員種別・性別・本人確認ステータス）のラベルを、表示の文字で選ぶ。完全一致、無ければ「…本人確認済み」のように末尾が合うもの */
  async チェックを入れる(項目: "customer_status" | "sex" | "identity_confirm_status", 表示: string): Promise<string> {
    await this.showDetail();
    const boxes = this.page.locator(`input[name="admin_search_customer[${項目}][]"]`);
    const n = await boxes.count();
    const labels: { id: string; text: string }[] = [];
    for (let i = 0; i < n; i++) {
      const id = (await boxes.nth(i).getAttribute("id")) ?? "";
      const text = ((await this.page.locator(`label[for="${id}"]`).first().innerText().catch(() => "")) ?? "").trim();
      labels.push({ id, text });
    }
    const hit = labels.find((l) => l.text === 表示) ?? labels.find((l) => l.text.endsWith(表示));
    if (!hit) throw new Error(`${項目} に「${表示}」の選択肢が無い（${labels.map((l) => l.text).join("、")}）`);
    await this.page.locator(`#${hit.id}`).check({ timeout: T });
    return hit.text;
  }

  /** 国の選択欄を、候補のどれかの表示で選ぶ（日本／Japan など、環境の表示に合わせる）。選んだ表示を返す */
  async 国を選ぶ(候補: string[]): Promise<string> {
    await this.showDetail();
    const sel = this.field("country");
    const have = (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
    const hit = 候補.find((c) => have.includes(c));
    if (!hit) throw new Error(`国の選択肢に ${候補.join("／")} が無い（${have.join("、")}）`);
    await sel.selectOption({ label: hit }, { timeout: T });
    return hit;
  }

  /** 都道府県（複数選択の欄）を表示の文字で選ぶ。見た目の部品（select2）が元の選択欄を隠しているので、元の選択欄を直接選んで変更を知らせる */
  async 都道府県を選ぶ(表示: string): Promise<void> {
    await this.showDetail();
    const ok = await this.page.locator('select[name="admin_search_customer[prefMulti][]"]').evaluate((el, label) => {
      const s = el as HTMLSelectElement;
      const o = [...s.options].find((x) => (x.textContent ?? "").trim() === label);
      if (!o) return false;
      o.selected = true;
      s.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }, 表示);
    if (!ok) throw new Error(`都道府県の選択肢に「${表示}」が無い`);
  }

  /** 文字・数値の欄に入れる（項目は欄の名前。例: phone_number・buy_total_start） */
  async 欄に入れる(項目: string, 値: string): Promise<void> {
    await this.showDetail();
    await this.field(項目).fill(値, { timeout: T });
  }

  /** 日付の欄に「2026/01/01 00:00」を入れる。日付だけの欄（日付の入力欄）には日付の部分だけを入れる */
  async 日付を入れる(項目: string, 年月日時分: string): Promise<void> {
    await this.showDetail();
    const m = /^(\d{4})[/-](\d{2})[/-](\d{2})( (\d{2}):(\d{2}))?$/.exec(年月日時分);
    if (!m) throw new Error(`日付の形が違う: ${年月日時分}`);
    const input = this.field(項目);
    const type = (await input.getAttribute("type")) ?? "text";
    if (type === "date") await input.fill(`${m[1]}-${m[2]}-${m[3]}`, { timeout: T });
    else if (type === "datetime-local") await input.fill(`${m[1]}-${m[2]}-${m[3]}T${m[5] ?? "00"}:${m[6] ?? "00"}`, { timeout: T });
    else await input.fill(年月日時分, { timeout: T });
  }

  /** 日付の欄に、日付として成り立たない文字をそのまま入れる（入力の種類を文字に変えて入れる。開発者ツールで直接入れる操作に当たる） */
  async 日付の欄に文字を直接入れる(項目: string, 文字: string): Promise<void> {
    await this.showDetail();
    const input = this.field(項目);
    await input.evaluate((el) => { (el as HTMLInputElement).type = "text"; });
    await input.fill(文字, { timeout: T });
  }

  /** 日付の欄の値 */
  async 欄の値(項目: string): Promise<string> { return this.field(項目).inputValue({ timeout: T }); }

  /** 検索入力の欄がすべて空か（空でないものを「項目: 値」で返す）。隠し項目は見ない */
  async 空でない欄(): Promise<string[]> {
    return this.form.evaluate((form) => {
      const out: string[] = [];
      for (const el of Array.from(form.querySelectorAll("input, select, textarea")) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]) {
        const type = (el as HTMLInputElement).type;
        if (type === "hidden" || type === "submit" || type === "button") continue;
        const name = el.getAttribute("name") ?? el.id;
        if (type === "checkbox" || type === "radio") { if ((el as HTMLInputElement).checked) out.push(`${name}: 選択`); continue; }
        if (el instanceof HTMLSelectElement) {
          const chosen = Array.from(el.selectedOptions).filter((o) => o.value !== "");
          if (chosen.length) out.push(`${name}: ${chosen.map((o) => (o.textContent ?? "").trim()).join("、")}`);
          continue;
        }
        if (el.value !== "") out.push(`${name}: ${el.value}`);
      }
      return out;
    });
  }

  // ---- 検索結果 ----
  /** いまの画面の結果の行の会員ID（表示順） */
  async 結果の会員ID(): Promise<string[]> {
    return (await this.page.locator('tr[id^="ex-customer-"]').evaluateAll((els) => els.map((e) => e.id.replace("ex-customer-", ""))));
  }

  /** 「検索結果：N件が該当しました」のN。表示が無ければ null */
  async 該当件数(): Promise<number | null> {
    const t = await this.page.locator("span.fw-bold.ms-2").first().innerText({ timeout: 5_000 }).catch(() => "");
    const m = /検索結果：(\d+)件/.exec(t ?? "");
    return m ? Number(m[1]) : null;
  }

  /** 結果の行の文（会員ID・氏名・電話・メール）を空白をそろえて返す */
  async 行の文(会員ID: string): Promise<string> {
    return (await this.row(会員ID).innerText({ timeout: T })).replace(/\s+/g, " ").trim();
  }

  // ---- 件数・ページ ----
  get 件数の選択(): Locator { return this.page.locator("#page_count_pulldown"); }
  async 選択中の件数(): Promise<string> { return ((await this.件数の選択.locator("option:checked").first().innerText({ timeout: T }).catch(() => "")) ?? "").trim(); }

  /** 件数の選択欄で「10件」などを選ぶ（選ぶと画面が移る） */
  async 件数を選ぶ(件: number): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.件数の選択.selectOption({ label: `${件}件` }, { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 件数の選択肢の送信値（移り先のアドレス）を書き換えてから、その選択肢を選ぶ。開発者ツールで選択肢の値を変える操作 */
  async 件数の送信値を書き換えて選ぶ(元の件数: number, 新しい件数: number): Promise<void> {
    await this.件数の選択.evaluate((el, [a, b]) => {
      const s = el as HTMLSelectElement;
      const o = Array.from(s.options).find((x) => (x.textContent ?? "").trim() === `${a}件`);
      if (!o) throw new Error(`件数の選択肢「${a}件」が無い`);
      o.value = o.value.replace(`page_count=${a}`, `page_count=${b}`);
      s.value = o.value;
    }, [元の件数, 新しい件数] as [number, number]);
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null);
    await this.件数の選択.dispatchEvent("change");
    await nav;
    await this.page.waitForLoadState("load");
  }

  /** ページングの現在のページ番号（無ければ null） */
  async 現在のページ(): Promise<string | null> {
    const a = this.page.locator("ul.pagination li.active");
    return (await a.count()) ? ((await a.first().innerText()).trim()) : null;
  }

  async ページを開く(番号: number): Promise<void> {
    const link = this.page.locator("ul.pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${番号}\\s*$`) });
    await expect(link, `ページングの ${番号} ページ目のリンクが1つある`).toHaveCount(1, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      link.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** サイドメニューの「会員一覧」を押す（検索入力の画面を新たに開く） */
  async サイドメニューから開く(): Promise<void> {
    const link = this.page.locator('#nav-customer a[href$="/customer"]');
    await expect(link, "サイドメニューの会員一覧").toHaveCount(1, { timeout: T });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      link.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- 行の操作・画面遷移 ----
  /** 結果の行の会員名を押す（会員登録/編集画面へ） */
  async 会員名を押す(会員ID: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.row(会員ID).locator(`a[href$="/customer/${会員ID}/edit"]`).first().click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 行の「…」メニューを開く */
  async サブメニューを開く(会員ID: string): Promise<void> {
    const row = this.row(会員ID);
    await expect(row, `検索結果に会員ID ${会員ID} の行がある`).toHaveCount(1, { timeout: T });
    await row.locator("i.dropdown-menu-toggle").click({ timeout: T });
  }

  /** 行の「…」メニューの項目（編集・削除・メール通知・仮会員メール再送）の表示の文字 */
  async サブメニューの項目(会員ID: string): Promise<string[]> {
    return (await this.row(会員ID).locator("ul.dropdown-menu li").evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()))).filter((t) => t);
  }

  /** サブメニューの項目を押して移る（編集・メール通知）。移った先のアドレスの道筋を返す */
  async サブメニューの項目を押す(会員ID: string, 項目: "編集" | "メール通知"): Promise<string> {
    await this.サブメニューを開く(会員ID);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.row(会員ID).locator("ul.dropdown-menu a").filter({ hasText: new RegExp(`^\\s*${項目}\\s*$`) }).click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return new URL(this.page.url()).pathname;
  }

  /** メール履歴のアイコンを押す */
  async メール履歴を押す(会員ID: string): Promise<string> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.row(会員ID).locator(`a[href*="/customer/mail/${会員ID}/history"]`).click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return new URL(this.page.url()).pathname;
  }

  /** 仮会員メール再送のモーダルを出す（サブメニューから） */
  async 仮会員メール再送を押す(会員ID: string): Promise<void> {
    await this.サブメニューを開く(会員ID);
    await this.row(会員ID).locator(`a[data-bs-target="#discontinuance_cus_${会員ID}"]`).click({ timeout: T });
    await expect(this.page.locator(`#discontinuance_cus_${会員ID}`), "仮会員メール再送の確認モーダル").toBeVisible({ timeout: T });
  }

  /** 仮会員メール再送のモーダルの送信を押す（押したあとの画面まで待つ） */
  async 再送モーダルで送信する(会員ID: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator(`#discontinuance_cus_${会員ID} a.btn-ec-delete`).click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }
}
