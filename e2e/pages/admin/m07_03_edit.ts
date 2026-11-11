/**
 * M07-03 買取情報編集（管理画面「ネット買取管理」→ 買取検索一覧 → 買取番号のリンク）の、M07-03 のケースが使う読み取りと操作。
 * 共通の部品（m07_buy.ts の BuyEditPage）に足す形で、ここにだけセレクタを書く。
 *
 * 画面の作り（アプリのテンプレート admin/Purchase/detail.twig と purchasedetail.js で確かめた）:
 * - 初期表示は「確定状態」。入力欄は読み取り専用、選択欄・ラジオ・チェックは画面のスクリプトが操作できない印（purchase-uneditable）を付ける。
 *   「査定編集」で送料・管理者用メモ・選んで買取の明細（サプライ品の査定価格・数量と売却）が編集でき、「査定確定」で元に戻る。
 *   買取依頼者情報の「編集」で依頼者・口座・事業者状況が編集でき、「確定」で元に戻る。
 * - 日付群は買取状況ごとの日付を並べる（履歴の無い日付も見出しは出る）。
 * - ステータス変更履歴は折りたたみ（開閉アイコン）。変更日時の降順。
 * - 選んで買取の「削除」リンクはサプライ品の行だけ（data-method="delete" で確認ダイアログを出す）。
 * - 実在庫情報は「編集」で編集欄（増減数）に切り替わり、ボタンが「編集解除」になる。「編集解除」は確認ダイアログを出す。
 * - 「会員詳細」（基本情報）と「詳細」（買取依頼者情報）は会員登録編集を別タブで開く。
 */
import { Dialog, expect, Locator, Page } from "@playwright/test";
import { decodeCsvBytes, csvRecords } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { BuyEditPage, BuyListPage } from "./m07_buy";

const OPEN = 30_000;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** 入力欄・選択欄の編集の可否（読み取り専用・無効・画面のスクリプトの操作できない印） */
export type 編集の可否 = { 読み取り専用: boolean; 無効: boolean; 操作できない印: boolean; 編集できる: boolean };

export async function 編集の可否を読む(l: Locator): Promise<編集の可否> {
  await expect(l, "入力欄").toHaveCount(1, { timeout: OPEN });
  const v = await l.evaluate((el) => {
    const e = el as HTMLInputElement;
    const ro = e.readOnly === true || e.hasAttribute("readonly") && e.tagName !== "SELECT" && e.type !== "radio" && e.type !== "checkbox";
    const mark = e.classList.contains("purchase-uneditable") || getComputedStyle(e).pointerEvents === "none";
    return { 読み取り専用: !!ro, 無効: e.disabled === true, 操作できない印: mark };
  });
  return { ...v, 編集できる: !v.読み取り専用 && !v.無効 && !v.操作できない印 };
}

/** 買取検索一覧から買取番号で検索し、買取番号のリンクで買取情報編集を開く */
export async function 一覧から編集を開く(page: Page, 番号: string): Promise<M0703EditPage> {
  const l = new BuyListPage(page);
  await l.open();
  await l.買取番号を入れる(String(Number(番号)));
  await l.検索する();
  await l.編集画面を開く(番号);
  const e = new M0703EditPage(page);
  await e.読み込みを待つ();
  return e;
}

export type 基本情報 = {
  買取番号: string; 本人確認: string; 氏名: string; 氏名カナ: string;
  振込依頼可能: boolean; 振込失敗: boolean; 事業者: string; 登録番号: string; 承諾方法: string; 買取状況: string;
};

export type 明細の行 = { 商品コード: string; 商品名: string; 査定価格: string; 数量: string; 売却: string; 削除リンク: boolean };
export type 実在庫の行 = { 商品コード: string; 商品名: string; 買取金額: string; 数量: string };

export class M0703EditPage extends BuyEditPage {
  constructor(page: Page) { super(page); }

  /** 画面のスクリプトの初期化（読み込み中の無効化が外れる）まで待つ */
  async 読み込みを待つ(): Promise<void> {
    await expect(this.page.locator("#purchase_detail_form"), "買取情報編集画面").toBeVisible({ timeout: 60_000 });
    await expect(this.page.locator("#edit_info_wrap.purchase-detail-editform-js-pending"), "買取情報編集画面のスクリプトの読み込み").toHaveCount(0, { timeout: 60_000 });
  }

  /** URL の買取IDを指定して開く（応答の状態を返す） */
  async URLで開く(買取ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/purchase/${買取ID}/edit`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  // ---- 基本情報 ----

  async 基本情報(): Promise<基本情報> {
    const box = this.page.locator("#edit_basic_info_box");
    await expect(box, "基本情報").toBeVisible({ timeout: OPEN });
    const row = (label: string) => this.page.locator("#edit_basic_info_box__information .row.mb-3").filter({ has: this.page.locator("label", { hasText: label }) }).first();
    const cells = async (label: string) => (await row(label).locator(":scope > div").allInnerTexts()).map(norm).filter(Boolean);
    const checked = async (name: string) => this.page.locator(`[name="admin_purchase_detail[${name}]"]`).isChecked();
    const issuer = this.page.locator('#edit_basic_info_box input[name="admin_purchase_detail[qualifiedInvoiceIssuerFlg]"]:checked');
    const issuerLabel = (await issuer.count()) ? norm(await this.page.locator(`label[for="${await issuer.first().getAttribute("id")}"]`).first().innerText()) : "";
    return {
      買取番号: norm(await box.locator(".card-header .card-title").nth(1).innerText()),
      本人確認: norm(await box.locator(".card-body > .row").first().locator("span").first().innerText()),
      氏名: (await cells("買取依頼者氏名")).join(" "),
      氏名カナ: (await cells("買取依頼者氏名カナ")).join(" "),
      振込依頼可能: await checked("canTransferRequestFlg"),
      振込失敗: await checked("transferFailedFlg"),
      事業者: issuerLabel,
      登録番号: norm(await this.page.locator("#edit_basic_info_box .qualified-invoice-issuer-code").first().innerText().catch(() => "")),
      承諾方法: (await cells("買取の承諾方法")).join(" "),
      買取状況: norm(await this.買取状況の選択().locator("option:checked").innerText()),
    };
  }

  /** 買取状況の選択肢（表示名、空を除く） */
  async 買取状況の選択肢(): Promise<string[]> {
    return (await this.買取状況の選択().locator("option").allInnerTexts()).map(norm).filter(Boolean);
  }

  /** 買取状況の選択肢を開く（選択欄を押す。見た目の確認のため） */
  async 買取状況の選択肢を開く(): Promise<void> {
    await this.買取状況の選択().click({ timeout: OPEN });
  }

  /** 買取状況を選ぶ（保存はしない） */
  async 買取状況を選ぶ(名前: string): Promise<void> {
    const have = await this.買取状況の選択肢();
    if (!have.includes(名前)) throw new Error(`買取状況に「${名前}」が無い（ある選択肢: ${have.join("、")}）`);
    await this.買取状況の選択().selectOption({ label: 名前 }, { timeout: OPEN });
  }

  readonly 振込依頼可能のチェック = () => this.page.locator('[name="admin_purchase_detail[canTransferRequestFlg]"]');
  readonly 振込失敗のチェック = () => this.page.locator('[name="admin_purchase_detail[transferFailedFlg]"]');

  /** 振込状況設定のチェック（振込依頼可能・振込失敗）を入れる／外す。画面の操作で押す */
  async 振込状況を設定する(v: { 振込依頼可能?: boolean; 振込失敗?: boolean }): Promise<void> {
    for (const [want, box] of [[v.振込依頼可能, this.振込依頼可能のチェック()], [v.振込失敗, this.振込失敗のチェック()]] as const) {
      if (want === undefined) continue;
      if ((await box.isChecked()) !== want) await box.click({ timeout: OPEN });
      await expect(box, "振込状況設定のチェック").toBeChecked({ checked: want, timeout: OPEN });
    }
  }

  /** 日付群（見出し → 値）。履歴の無い日付は値が空 */
  async 日付群(): Promise<{ 見出し: string; 値: string; 表示: boolean }[]> {
    const items = this.page.locator('#edit_basic_info_box__status_information div[id^="edit_basic_info_box__"]').filter({ hasNot: this.page.locator('input[name*="restockedFlg"]') });
    const out: { 見出し: string; 値: string; 表示: boolean }[] = [];
    for (const it of await items.all()) {
      const id = (await it.getAttribute("id")) ?? "";
      if (id === "edit_basic_info_box__restocked_flg") continue;
      out.push({ 見出し: norm(await it.locator("label").first().innerText().catch(() => "")), 値: norm(await it.locator(".col-md-8").first().innerText().catch(() => "")), 表示: await it.isVisible() });
    }
    return out;
  }

  // ---- ステータス変更履歴 ----

  readonly 履歴の欄 = () => this.page.locator("#statusHistoryCollapse");

  async 履歴の開閉アイコンを押す(): Promise<void> {
    await this.page.locator('a[href="#statusHistoryCollapse"]').click({ timeout: OPEN });
    await this.page.waitForTimeout(700);
  }

  async 履歴が見えるか(): Promise<boolean> {
    return this.履歴の欄().evaluate((el) => el.classList.contains("show") && (el as HTMLElement).offsetHeight > 0);
  }

  async 履歴の行(): Promise<{ 変更日時: string; ステータス: string; 変更者: string }[]> {
    return this.page.locator('#statusHistoryCollapse tbody tr[id^="detail__item--"]').evaluateAll((trs) => trs.map((tr) => {
      const t = (k: string) => (tr.querySelector(`[id^="detail__item_${k}--"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 変更日時: t("date"), ステータス: t("status"), 変更者: t("name") };
    }));
  }

  // ---- 棚戻し済み ----

  async 棚戻し済み(): Promise<{ 選ばれた: string; 無効: boolean[] }> {
    const radios = this.page.locator('#edit_basic_info_box__restocked_flg input[type="radio"]');
    await expect(radios.first(), "棚戻し済みのラジオボタン").toBeAttached({ timeout: OPEN });
    const r = await radios.evaluateAll((els) => els.map((e) => {
      const i = e as HTMLInputElement;
      return { checked: i.checked, disabled: i.disabled, label: (i.labels?.[0]?.textContent ?? "").trim() };
    }));
    return { 選ばれた: r.filter((x) => x.checked).map((x) => x.label).join("・"), 無効: r.map((x) => x.disabled) };
  }

  // ---- 遷移のボタン ----

  /** 基本情報の「会員詳細」を押す。別タブで開いた画面を返す */
  async 会員詳細を押す(): Promise<Page> {
    const link = this.page.locator("#edit_basic_info_box a.btn", { hasText: "会員詳細" });
    await expect(link, "基本情報の「会員詳細」").toBeVisible({ timeout: OPEN });
    const [popup] = await Promise.all([this.page.context().waitForEvent("page", { timeout: 30_000 }), link.click({ timeout: OPEN })]);
    await popup.waitForLoadState("load");
    return popup;
  }

  /** 買取依頼者情報の「詳細」を押す。別タブで開いた画面を返す */
  async 依頼者情報の詳細を押す(): Promise<Page> {
    const link = this.page.locator("#edit_customer_info_box .card-header a.btn").filter({ hasText: /^\s*詳細\s*$/ });
    await expect(link, "買取依頼者情報の「詳細」").toBeVisible({ timeout: OPEN });
    const [popup] = await Promise.all([this.page.context().waitForEvent("page", { timeout: 30_000 }), link.click({ timeout: OPEN })]);
    await popup.waitForLoadState("load");
    return popup;
  }

  /** 画面下の「ネット買取一覧」を押す */
  async ネット買取一覧を押す(): Promise<void> {
    const link = this.page.locator(".c-conversionArea a.c-baseLink").filter({ hasText: "ネット買取一覧" });
    await expect(link, "「ネット買取一覧」のリンク").toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 「古物台帳入力用CSV出力」を押して、ダウンロードされたCSVの本文を返す */
  async 古物台帳CSV出力を押す(): Promise<{ 見出し: string[]; 行: Record<string, string>[] }> {
    const button = this.page.locator("button#export_csv").filter({ hasText: "古物台帳入力用CSV出力" });
    await expect(button, "「古物台帳入力用CSV出力」ボタン").toBeVisible({ timeout: OPEN });
    const [download] = await Promise.all([this.page.waitForEvent("download", { timeout: 30_000 }), button.click({ timeout: OPEN })]);
    const chunks: Buffer[] = [];
    for await (const c of await download.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    const text = decodeCsvBytes(Buffer.concat(chunks));
    const 行 = csvRecords(text);
    return { 見出し: 行.length ? Object.keys(行[0]) : [], 行 };
  }

  /** 画面下の「手動メール通知」を押す（確認のアラートが出れば OK で答え、文を返す） */
  async 手動メール通知を押す(): Promise<string[]> {
    const msgs: string[] = [];
    const on = (d: Dialog) => { msgs.push(d.message()); void d.accept(); };
    this.page.on("dialog", on);
    try {
      const link = this.page.locator("#alert_no_assessment_send_mail");
      await expect(link, "「手動メール通知」").toBeVisible({ timeout: OPEN });
      await Promise.all([this.page.waitForURL(/\/purchase\/.*mail/, { timeout: 60_000 }), link.click({ timeout: OPEN })]);
      await this.page.waitForLoadState("load");
    } finally { this.page.off("dialog", on); }
    return msgs;
  }

  // ---- 査定 ----

  readonly 査定編集ボタン = () => this.page.locator("#edit_appraisal_switch");
  readonly メモの欄 = () => this.page.locator("#admin_purchase_detail_memo");
  readonly 査定金額合計の欄 = () => this.page.locator("#admin_purchase_detail_totalPrice");

  async 査定編集ボタンの文(): Promise<string> { return norm(await this.査定編集ボタン().innerText()); }

  /** 査定編集中に、送料・管理者用メモを入れる */
  async 送料とメモを入れる(v: { 送料?: string; メモ?: string }): Promise<void> {
    if (v.送料 !== undefined) await this.送料の欄().fill(v.送料, { timeout: OPEN });
    if (v.メモ !== undefined) await this.メモの欄().fill(v.メモ, { timeout: OPEN });
  }

  async 査定金額合計(): Promise<string> { return (await this.査定金額合計の欄().inputValue({ timeout: OPEN })).replace(/[^\d]/g, ""); }

  /** 選んで買取の、商品名の行 */
  選んで買取の行(商品名: string): Locator {
    return this.page.locator("#buy_main_cards_field_list tr").filter({ has: this.page.locator('td[id^="purchase_list_main__product_name--"]', { hasText: 商品名 }) }).first();
  }

  async 選んで買取の明細(): Promise<明細の行[]> {
    return this.page.locator("#buy_main_cards_field_list tr").evaluateAll((trs) => trs.map((tr) => {
      const t = (k: string) => (tr.querySelector(`[id^="purchase_list_main__${k}--"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const v = (k: string) => ((tr.querySelector(`[name$="[${k}]"]`) as HTMLInputElement | null)?.value ?? "");
      const sel = tr.querySelector('select[name$="[saleFlg]"]') as HTMLSelectElement | null;
      return {
        商品コード: t("product_code"), 商品名: t("product_name"), 査定価格: v("price"), 数量: v("count"),
        売却: sel ? (sel.selectedOptions[0]?.textContent ?? "").trim() : "",
        削除リンク: !!tr.querySelector('td[id^="purchase_list_main__delete--"] a'),
      };
    }));
  }

  /** 選んで買取の行の入力欄（査定価格・数量・売却） */
  明細の入力欄(商品名: string, 欄: "査定価格" | "数量" | "売却"): Locator {
    const name = { 査定価格: "price", 数量: "count", 売却: "saleFlg" }[欄];
    return this.選んで買取の行(商品名).locator(`[name$="[${name}]"]`);
  }

  /** 選んで買取の行の「削除」リンクの宛先（買取明細の番号を含む URL） */
  async 削除リンクの宛先(商品名: string): Promise<string> {
    return (await this.選んで買取の行(商品名).locator('td[id^="purchase_list_main__delete--"] a').getAttribute("href", { timeout: OPEN })) ?? "";
  }

  /** 一括売却登録の確認ダイアログに答える（キャンセルなら画面は変わらない）。ダイアログの文を返す */
  async 一括売却登録を押す(答え: "OK" | "キャンセル"): Promise<string[]> {
    if (答え === "OK") return this.一括売却登録する("OK");
    const msgs: string[] = [];
    const on = (d: Dialog) => { msgs.push(d.message()); void d.dismiss(); };
    this.page.on("dialog", on);
    try {
      await this.page.locator("#sell_btn").click({ timeout: OPEN });
      await this.page.waitForTimeout(1_500);
    } finally { this.page.off("dialog", on); }
    return msgs;
  }

  // ---- 商品追加（選んで買取） ----

  readonly 商品検索モーダル = () => this.page.locator("#searchProductModal");
  readonly 商品検索の結果 = () => this.page.locator("#supplyProductSearchList");

  async 商品追加を押す(): Promise<void> {
    await this.page.locator("#add_product").click({ timeout: OPEN });
    await expect(this.商品検索モーダル(), "商品追加の商品検索モーダル").toBeVisible({ timeout: OPEN });
  }

  /** 商品検索モーダルで「商品名・ID・コード」に語を入れて「検索」を押す（結果の表示を待つかは呼び出し側で選ぶ） */
  async 商品を検索する(語: string, 結果を待つ = true): Promise<void> {
    const m = this.商品検索モーダル();
    await m.locator("#admin_search_product_id").fill(語, { timeout: OPEN });
    const res = this.page.waitForResponse((r) => /\/purchase\/searchproduct/.test(new URL(r.url()).pathname), { timeout: 30_000 }).catch(() => null);
    await m.locator("#searchProductModalButton").click({ timeout: OPEN });
    if (結果を待つ) {
      await res;
      await expect(this.商品検索の結果().locator(".table-responsive").first(), "商品検索の結果").toBeAttached({ timeout: 30_000 });
    } else {
      await this.page.waitForTimeout(2_000);
    }
  }

  /** 商品検索の結果の行（商品コード・商品名の文） */
  async 商品検索の結果の文(): Promise<string[]> {
    return (await this.商品検索の結果().locator("tbody tr").allInnerTexts()).map(norm).filter(Boolean);
  }

  /** 商品検索の結果で、商品コードの行の「決定」（追加）を押す */
  async 結果の商品を決定する(商品コード: string): Promise<void> {
    const btn = this.商品検索の結果().locator(`.js-add-purchase-product[data-product-code="${商品コード}"]`).first();
    const alt = this.商品検索の結果().locator("tbody tr").filter({ hasText: 商品コード }).locator(".js-add-purchase-product").first();
    const target = (await btn.count()) ? btn : alt;
    await expect(target, `商品検索の結果（${商品コード}）の「決定」ボタン`).toBeVisible({ timeout: 30_000 });
    await target.click({ timeout: OPEN });
    await expect(this.商品検索モーダル(), "商品検索モーダルが閉じる").toBeHidden({ timeout: OPEN });
  }

  /** 商品検索の結果のページ送りで、ページ番号のリンクを押す */
  async 結果のページを押す(番号: number): Promise<void> {
    const link = this.商品検索の結果().locator("a.page-link").filter({ hasText: new RegExp(`^\\s*${番号}\\s*$`) }).first();
    await expect(link, `商品検索の結果の ${番号} ページ目のリンク`).toBeVisible({ timeout: OPEN });
    await link.click({ timeout: OPEN });
    await this.page.waitForTimeout(2_000);
  }

  // ---- 買取依頼者情報 ----

  readonly 依頼者情報の編集ボタン = () => this.page.locator("#edit_customer_switch");
  f(name: string): Locator { return this.page.locator(`[name="admin_purchase_detail[${name}]"]`); }
  口座(name: string): Locator { return this.page.locator(`[name="admin_purchase_bank_account[${name}]"]`); }
  readonly 事業者状況のラジオ = () => this.page.locator('input[name="admin_purchase_qualified_invoice_issuer_account[qualifiedInvoiceIssuerFlg]"]');
  readonly 事業者番号の欄 = () => this.page.locator("#admin_purchase_qualified_invoice_issuer_account_qualifiedInvoiceIssuerCode");

  async 依頼者情報の編集ボタンの文(): Promise<string> { return norm(await this.依頼者情報の編集ボタン().innerText()); }

  /** 買取依頼者情報の「編集」（または「確定」）を押す */
  async 依頼者情報の編集を押す(): Promise<void> { await this.依頼者情報の編集ボタン().click({ timeout: OPEN }); }

  /** 選択欄を表示名で選ぶ。空文字は先頭の空の選択肢を選ぶ */
  async 依頼者の選択欄を選ぶ(name: string, 表示: string): Promise<void> {
    const sel = this.f(name);
    if (表示 === "") { await sel.selectOption({ index: 0 }, { timeout: OPEN }); return; }
    const have = (await sel.locator("option").allInnerTexts()).map(norm);
    if (!have.includes(表示)) throw new Error(`${name} の選択肢に「${表示}」が無い（ある選択肢: ${have.filter(Boolean).join("、")}）`);
    await sel.selectOption({ label: 表示 }, { timeout: OPEN });
  }

  /** 事業者状況のラジオを表示名（事業者／非事業者）で押す。押せたか（無効でなかったか）を返す */
  async 事業者状況を選ぶ(表示: "事業者" | "非事業者"): Promise<{ 押せた: boolean; 選ばれた: string }> {
    const radios = this.事業者状況のラジオ();
    const labels = await radios.evaluateAll((els) => els.map((e) => ((e as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    const i = labels.indexOf(表示);
    if (i < 0) throw new Error(`事業者状況に「${表示}」が無い（${labels.join("、")}）`);
    const r = radios.nth(i);
    const 押せた = await r.isEnabled();
    if (押せた) await r.check({ timeout: OPEN });
    return { 押せた, 選ばれた: await this.事業者状況() };
  }

  async 事業者状況(): Promise<string> {
    return (await this.事業者状況のラジオ().evaluateAll((els) => els.filter((e) => (e as HTMLInputElement).checked).map((e) => ((e as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()))).join("・");
  }

  /** 基本情報の適格請求書発行事業者情報のラジオで、表示名のものを押す（無効なら押せない）。押したあとの選択を返す */
  async 基本情報の事業者を押す(表示: string): Promise<{ 無効: boolean; 選ばれた: string }> {
    const radios = this.page.locator('#edit_basic_info_box input[name="admin_purchase_detail[qualifiedInvoiceIssuerFlg]"]');
    const labels = await radios.evaluateAll((els) => els.map((e) => ((e as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    const i = labels.indexOf(表示);
    if (i < 0) throw new Error(`基本情報の適格請求書発行事業者情報に「${表示}」が無い（${labels.join("、")}）`);
    const r = radios.nth(i);
    const 無効 = await r.isDisabled();
    // ラベルを押す（利用者の操作。無効なら何も起きない）
    await this.page.locator(`label[for="${await r.getAttribute("id")}"]`).first().click({ timeout: OPEN, force: true }).catch(() => undefined);
    const 選ばれた = (await radios.evaluateAll((els) => els.filter((e) => (e as HTMLInputElement).checked).map((e) => ((e as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()))).join("・");
    return { 無効, 選ばれた };
  }

  /** 生年月日の年・月・日を値で選ぶ */
  async 生年月日を選ぶ(年: string, 月: string, 日: string): Promise<void> {
    await this.f("birth][year").selectOption(年, { timeout: OPEN });
    await this.f("birth][month").selectOption(月, { timeout: OPEN });
    await this.f("birth][day").selectOption(日, { timeout: OPEN });
  }

  // ---- なりすまし対策トークン ----

  readonly トークンの欄 = () => this.page.locator('#purchase_detail_form input[name="admin_purchase_detail[_token]"]');

  /** 保存のフォームのなりすまし対策トークンの入力要素を消す（開発者ツールの操作の代わり） */
  async トークンを消す(): Promise<number> {
    const n = await this.トークンの欄().count();
    await this.トークンの欄().evaluateAll((els) => els.forEach((e) => e.remove()));
    return n;
  }

  /** 保存のフォームのなりすまし対策トークンの値を書き換える（開発者ツールの操作の代わり） */
  async トークンを書き換える(値: string): Promise<number> {
    const n = await this.トークンの欄().count();
    await this.トークンの欄().evaluateAll((els, v) => els.forEach((e) => { (e as HTMLInputElement).value = v; }), 値);
    return n;
  }

  /** 「保存」を押し、結果の画面のメッセージ（成功・エラー）を返す（成功を前提にしない） */
  async 保存を押す(): Promise<{ 成功: string[]; エラー: string[]; 応答: number | null }> {
    const resP = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/purchase\/\d+\/update/.test(new URL(r.url()).pathname), { timeout: 120_000 }).catch(() => null);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }).catch(() => null), this.page.locator("#save_btn").click({ timeout: OPEN, noWaitAfter: true })]);
    const res = await resP;
    await this.page.waitForLoadState("load", { timeout: 120_000 });
    return { ...(await this.画面上部のメッセージ()), 応答: res ? res.status() : null };
  }

  async 画面上部のメッセージ(): Promise<{ 成功: string[]; エラー: string[] }> {
    const t = async (sel: string) => (await this.page.locator(sel).allInnerTexts()).map(norm).filter((x) => x && !x.includes("デバッグモード"));
    return { 成功: await t(".alert-success"), エラー: await t(".alert-danger, .invalid-feedback, .form-error-message") };
  }

  // ---- 実在庫情報 ----

  readonly 実在庫の編集ボタン = () => this.page.locator("#edit");
  readonly 実在庫の閲覧表 = () => this.page.locator("#detail_stock_display");
  readonly 実在庫の編集欄 = () => this.page.locator("#detail_stock_edit");

  async 実在庫の編集ボタンの文(): Promise<string> { return norm(await this.実在庫の編集ボタン().innerText()); }

  /** 実在庫情報の「編集」「編集解除」を押す。確認ダイアログが出れば答え、文を返す */
  async 実在庫の編集ボタンを押す(答え: "OK" | "キャンセル" = "OK"): Promise<string[]> {
    const msgs: string[] = [];
    const on = (d: Dialog) => { msgs.push(d.message()); void (答え === "OK" ? d.accept() : d.dismiss()); };
    this.page.on("dialog", on);
    try {
      await this.実在庫の編集ボタン().click({ timeout: OPEN });
      await this.page.waitForTimeout(800);
    } finally { this.page.off("dialog", on); }
    return msgs;
  }

  /** 実在庫の編集欄の、商品コードの行の増減数の欄 */
  増減数の欄(商品コード: string): Locator {
    return this.page.locator("#stockEdit tr").filter({ has: this.page.locator('td[id^="detail__item_product_code--"]', { hasText: new RegExp(`^\\s*${商品コード.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) }).locator('input[name$="[diff_stock]"]').first();
  }

  async 増減数を入れる(商品コード: string, 値: string): Promise<void> {
    const f = this.増減数の欄(商品コード);
    await expect(f, `実在庫の編集欄の ${商品コード} の増減数`).toBeVisible({ timeout: OPEN });
    await f.fill(値, { timeout: OPEN });
  }

  /** 実在庫情報の閲覧表の行 */
  async 実在庫の行(): Promise<実在庫の行[]> {
    return this.page.locator("#stockDisplay tr").evaluateAll((trs) => trs.map((tr) => {
      const t = (k: string) => (tr.querySelector(`[id^="detail__item_${k}--"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 商品コード: t("product_code"), 商品名: t("product_name"), 買取金額: t("buy_price"), 数量: t("stock") };
    }));
  }
}

/** 手動メール通知（入力画面 → 確認画面 → 送信） */
export class ManualMailPage {
  constructor(readonly page: Page) {}

  async テンプレートの選択肢(): Promise<string[]> {
    return (await this.page.locator("#template-change option").allInnerTexts()).map(norm).filter(Boolean);
  }

  /** テンプレートを、表示名に語を含むもので選ぶ（件名・本文は画面のスクリプトが入れる） */
  async テンプレートを選ぶ(語: string): Promise<string> {
    const have = await this.テンプレートの選択肢();
    const hit = have.find((t) => t.includes(語));
    if (!hit) throw new Error(`手動メール通知のテンプレートに「${語}」を含むものが無い（${have.join("、")}）`);
    await this.page.locator("#template-change").selectOption({ label: hit }, { timeout: OPEN });
    await this.page.waitForTimeout(1_500);
    return hit;
  }

  /** 「確認」→ 確認画面の「送信」を押す。送信後のメッセージを返す */
  async 送信する(): Promise<{ 成功: string[]; エラー: string[] }> {
    const confirm = this.page.locator('button[name="mode"][value="confirm"]');
    await expect(confirm, "手動メール通知の確認ボタン").toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), confirm.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    const send = this.page.locator('button[name="mode"][value="complete"]');
    await expect(send, "手動メール通知の確認画面の送信ボタン").toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), send.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    const t = async (sel: string) => (await this.page.locator(sel).allInnerTexts()).map(norm).filter((x) => x && !x.includes("デバッグモード"));
    return { 成功: await t(".alert-success"), エラー: await t(".alert-danger, .invalid-feedback, .form-error-message") };
  }
}
