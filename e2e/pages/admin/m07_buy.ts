/**
 * ネット買取管理の買取検索一覧（メニュー「ネット買取管理」→「買取検索一覧」）と買取情報編集。
 *
 * 画面の作り（アプリのテンプレートで確かめた）:
 * - 一覧の買取番号は買取情報の番号を7桁に0埋めした表示。検索の買取番号欄には数字を入れる。
 * - 「検索条件をクリア」は画面のスクリプトが入力欄・選択を空にする（送信はしない）。
 * - 「ダウンロード▼」の項目は、結果にチェックを付けた買取だけを対象にする。チェックが0件なら警告（アラート）を出して送信しない。
 *   戻しリストPDFは別ウィンドウ（ポップアップ）に開く。CSV は送信の応答がファイルになる。
 * - 一覧の「削除」は確認のダイアログ（OK／キャンセル）を出す。
 */
import { Dialog, Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const OPEN = 30_000;

export const 買取番号の表示 = (番号: string): string => String(Number(番号)).padStart(7, "0");

export type 一覧の行 = { 番号: string; 買取番号: string; 依頼日: string; 氏名: string; 本人確認: string; 明細: string; 箱数: string; 買取状況: string; 利用回数: string; 取り消し注記: boolean };

export class BuyListPage {
  constructor(readonly page: Page) {}

  readonly 検索フォーム = () => this.page.locator("form#search_form");
  readonly 結果の表の行 = () => this.page.locator('#result_list_main tbody tr[id^="result_list_main__item--"]');
  readonly 結果の欄 = () => this.page.locator("#result_list_main");
  readonly 該当件数の表示 = () => this.page.locator("#search_form .fw-bold");
  readonly ダウンロードのボタン = () => this.page.locator("#result_list__custom_csv_menu button.dropdown-toggle");
  readonly ダウンロードの項目 = () => this.page.locator("#result_list__custom_csv_menu .dropdown-menu button");
  readonly 表示件数の選択 = () => this.page.locator("#page_count_pulldown");
  readonly ページング = () => this.page.locator("ul.pagination");
  readonly 全選択のチェック = () => this.page.locator("#allCheck");
  readonly 買取番号の欄 = () => this.page.locator("#admin_purchase_list_purchase_number");
  readonly 注文者名の欄 = () => this.page.locator("#admin_purchase_list_name_multi");

  /** 買取検索一覧(検索入力)画面を開く（メニューから開いたときの初期表示） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/purchase/list"), { timeout: 60_000 });
    expect(res?.status() ?? 0, "買取検索一覧画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    await expect(this.検索フォーム(), "買取検索一覧画面の検索欄").toBeVisible({ timeout: OPEN });
  }

  async 買取番号を入れる(s: string): Promise<void> { await this.買取番号の欄().fill(s, { timeout: OPEN }); }
  async 注文者名を入れる(s: string): Promise<void> { await this.注文者名の欄().fill(s, { timeout: OPEN }); }
  async 商品名を入れる(番目: number, s: string): Promise<void> { await this.page.locator(`#admin_purchase_list_product_name${番目}`).fill(s, { timeout: OPEN }); }

  /** 買取状況（複数選択の欄）を表示名で選ぶ */
  async 買取状況を選ぶ(名前: string[]): Promise<void> {
    const sel = this.page.locator("#admin_purchase_list_buy_order_status");
    const values = await sel.locator("option").evaluateAll((os, want) => (os as HTMLOptionElement[]).filter((o) => want.includes((o.textContent ?? "").trim())).map((o) => o.value), 名前);
    if (values.length !== 名前.length) {
      const have = (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
      throw new Error(`買取状況の選択肢に ${名前.join("・")} が揃わない（ある選択肢: ${have.join("、")}）`);
    }
    // 見た目は選択欄の部品に置き換わっているので、元の選択欄に値を入れて変更を知らせる
    await sel.evaluate((el, vs) => {
      const s = el as HTMLSelectElement;
      for (const o of Array.from(s.options)) o.selected = vs.includes(o.value);
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }, values);
  }

  /** 本人確認（ラジオ様のチェック）を表示名で選ぶ */
  async 本人確認を選ぶ(名前: string): Promise<void> {
    const radios = this.page.locator('input[name*="identityConfirmStatus"]');
    const names = await radios.evaluateAll((os) => os.map((o) => ((o as HTMLInputElement).labels?.[0]?.textContent ?? "").trim()));
    const idx = names.indexOf(名前);
    if (idx < 0) throw new Error(`本人確認の選択肢に「${名前}」が無い（ある選択肢: ${names.join("、")}）`);
    await radios.nth(idx).check({ timeout: OPEN });
  }

  async 戻し未完了のみ表示(on: boolean): Promise<void> {
    await this.page.locator("#admin_purchase_list_restock_incomplete_only").setChecked(on, { timeout: OPEN });
  }

  async 検索条件をクリアする(): Promise<void> {
    await this.page.getByRole("link", { name: "検索条件をクリア" }).click({ timeout: OPEN });
  }

  /** 検索するボタンを押し、結果が出るまで待つ */
  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("load"),
      this.検索フォーム().getByRole("button", { name: /検索する/ }).click({ timeout: OPEN }),
    ]);
    await this.page.waitForLoadState("load");
    await expect(this.結果の欄().or(this.page.getByText("検索条件に該当するデータがありませんでした。")).first(), "検索結果の表示").toBeVisible({ timeout: 60_000 });
  }

  /** 該当件数（「N件が該当しました」の数）。結果欄が無いときは null */
  async 該当件数(): Promise<number | null> {
    const el = this.該当件数の表示().first();
    if ((await el.count()) === 0) return null;
    const t = (await el.innerText({ timeout: OPEN })).replace(/[,\s]/g, "");
    const m = /(\d+)/.exec(t);
    return m ? Number(m[1]) : null;
  }

  async 行(): Promise<一覧の行[]> {
    const rows = this.結果の表の行();
    if ((await rows.count()) === 0) return [];
    return rows.evaluateAll((trs) => trs.map((tr) => {
      const id = tr.id.replace("result_list_main__item--", "");
      const t = (key: string) => (tr.querySelector(`[id^="result_list_main__${key}--"]`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        番号: id, 買取番号: t("purchase_number").split(" ")[0], 依頼日: t("purchase_request_date"), 氏名: t("purchase_customer_name"),
        本人確認: t("purchase_identification"), 明細: t("purchase_purchase_detail"), 箱数: t("purchase_package_count"),
        買取状況: t("purchase_purchase_status"), 利用回数: t("purchase_order_count"),
        取り消し注記: (tr.querySelector(`#result_list_main__purchase_number--${id} .text-danger.small, #result_list_main__purchase_number--${id} div.small`)?.textContent ?? "").includes("キャンセル"),
      };
    }));
  }

  /** 買取番号（数字）の行 */
  行の(番号: string): Locator { return this.page.locator(`#result_list_main__item--${Number(番号)}`); }

  async 対象にする(番号: string): Promise<void> {
    const row = this.行の(番号);
    await expect(row, `一覧の買取番号「${買取番号の表示(番号)}」の行`).toHaveCount(1, { timeout: OPEN });
    await row.locator('input[type="checkbox"]').check({ timeout: OPEN });
  }

  /** 買取番号のリンクを押して買取情報編集画面を開く */
  async 編集画面を開く(番号: string): Promise<void> {
    const link = this.page.locator(`#result_list_main__purchase_number--${Number(番号)} a`);
    await expect(link, `一覧の買取番号「${買取番号の表示(番号)}」のリンク`).toBeVisible({ timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), link.click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
  }

  /** 行の三点リーダーを押す */
  async 三点リーダーを押す(番号: string): Promise<void> {
    await this.page.locator(`#result_list_main__menu_box_toggle--${Number(番号)} button.dropdown-menu-toggle`).click({ timeout: OPEN });
  }
  メニューの項目(番号: string): Locator { return this.page.locator(`#result_list_main__menu--${Number(番号)} li a`); }

  /** 三点リーダーの「削除」を押し、確認のダイアログに答える。ダイアログの文を返す */
  async 削除する(番号: string, 答え: "OK" | "キャンセル"): Promise<string[]> {
    const msgs: string[] = [];
    const on = (d: Dialog) => { msgs.push(d.message()); void (答え === "OK" ? d.accept() : d.dismiss()); };
    this.page.on("dialog", on);
    try {
      const del = this.メニューの項目(番号).filter({ hasText: "削除" });
      // すでに開いていれば（手順で先に押している）押し直さない
      if (!(await del.isVisible())) await this.三点リーダーを押す(番号);
      await expect(del, "三点リーダーの「削除」リンク").toBeVisible({ timeout: OPEN });
      if (答え === "OK") {
        await Promise.all([this.page.waitForLoadState("load"), del.click({ timeout: OPEN })]);
        await this.page.waitForLoadState("load");
      } else {
        await del.click({ timeout: OPEN });
        await this.page.waitForTimeout(800);
      }
    } finally {
      this.page.off("dialog", on);
    }
    return msgs;
  }

  /** ダウンロード▼を開く */
  async ダウンロードを開く(): Promise<void> { await this.ダウンロードのボタン().click({ timeout: OPEN }); }

  /**
   * ダウンロードの項目を押す。CSV はファイル、戻しリストPDFは別ウィンドウ（ポップアップ）を返す。
   * 警告のアラートは文を返し、出力が始まらない。
   */
  async ダウンロードを押す(項目: "古物台帳入力用CSV" | "入金CSV" | "買取商品一覧CSV" | "買取商品（キャンセル）CSV" | "戻しリストCSV" | "戻しリストPDF"): Promise<{ file: Download | null; popup: Page | null; ダイアログ: string[]; 応答: number | null }> {
    const dialogs: string[] = [];
    const on = (d: Dialog) => { dialogs.push(d.message()); void d.accept(); };
    this.page.on("dialog", on);
    try {
      const item = this.ダウンロードの項目().filter({ hasText: 項目 });
      if (!(await item.isVisible())) await this.ダウンロードを開く();
      await expect(item, `ダウンロードの項目「${項目}」`).toBeVisible({ timeout: OPEN });
      const pdf = 項目 === "戻しリストPDF";
      const download = this.page.waitForEvent("download", { timeout: 20_000 }).catch(() => null);
      const popup = pdf ? this.page.context().waitForEvent("page", { timeout: 20_000 }).catch(() => null) : Promise.resolve(null);
      const resp = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/purchase\/(csv_export|pdf_export)/.test(new URL(r.url()).pathname), { timeout: 20_000 }).catch(() => null);
      await item.click({ timeout: OPEN });
      const res = await resp;
      const file = pdf ? null : await download;
      const win = pdf ? await popup : null;
      if (win) await win.waitForLoadState("load").catch(() => undefined);
      await this.page.waitForLoadState("load").catch(() => undefined);
      return { file, popup: win, ダイアログ: dialogs, 応答: res ? res.status() : null };
    } finally {
      this.page.off("dialog", on);
    }
  }
}

export type PDFの行 = { 仕訳: string; No: string; 棚番号: string; 言語状態: string; 略称: string; 色レアリティ: string; 数: string; 商品名: string; 価格: string; 備考: string };

/** 戻しリストPDF（別ウィンドウに書かれたHTML）の中身を読む。各ページの見出し（商品仕訳 n/m）・作成日時・明細の行 */
export async function 戻しリストを読む(popup: Page): Promise<{ 作成日時: string; 行: PDFの行[]; 印刷ボタン: boolean; 全文: string }> {
  await popup.waitForLoadState("load").catch(() => undefined);
  await expect(popup.locator(".ContentsAll"), "戻しリストPDFの本文").toBeVisible({ timeout: 30_000 });
  const 全文 = (await popup.locator("body").innerText()).replace(/[ \t]+/g, " ");
  const 作成日時 = /作成日時[:：]\s*([0-9\/\-: ]+)/.exec(全文)?.[1]?.trim() ?? "";
  const 行 = await popup.locator(".multipage").evaluateAll((pages) => pages.flatMap((pg) => {
    const title = (pg.querySelector("div")?.textContent ?? "").replace(/\s+/g, " ").trim().replace(/\s*\d+\/\d+$/, "");
    return Array.from(pg.querySelectorAll("tr.data")).map((tr) => {
      const c = (cls: string) => (tr.querySelector(`td.${cls}`)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return { 仕訳: title, No: c("no_"), 棚番号: c("shelf_number_"), 言語状態: c("language_condition_"), 略称: c("expansion_sname_"), 色レアリティ: c("color_rarity_"), 数: c("qty_"), 商品名: c("name_"), 価格: c("price_"), 備考: c("remarks_") };
    });
  }));
  const 印刷ボタン = await popup.locator("#printButton").isVisible().catch(() => false);
  return { 作成日時, 行: 行.filter((r) => r.商品名 !== "" && !/^全\d+\s*個$/.test(r.商品名.replace(/\s/g, ""))), 印刷ボタン, 全文 };
}

/** ダウンロードしたCSVを読む（UTF-8でなければ Shift_JIS として読む）。1行目を見出しとして、行を 見出し→値 の組にする */
export async function CSVを読む(file: Download): Promise<{ 見出し: string[]; 行: Record<string, string>[]; 文字コード: string }> {
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const buf = Buffer.concat(chunks);
  let text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  let 文字コード = "UTF-8";
  if (text.includes("\ufffd")) { text = new TextDecoder("shift_jis").decode(buf); 文字コード = "Shift_JIS"; }
  text = text.replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let cur: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { cur.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; cur.push(cell); cell = ""; if (cur.some((x) => x !== "") || cur.length > 1) rows.push(cur); cur = []; }
    else cell += ch;
  }
  if (cell !== "" || cur.length) { cur.push(cell); rows.push(cur); }
  const 見出し = rows[0] ?? [];
  return { 見出し, 行: rows.slice(1).map((r) => Object.fromEntries(見出し.map((h, i) => [h, r[i] ?? ""]))), 文字コード };
}

/** 買取情報編集 */
export class BuyEditPage {
  constructor(readonly page: Page) {}

  readonly 買取状況の選択 = () => this.page.locator("#admin_purchase_detail_BuyOrderStatus");

  /** 買取状況を変えて保存する。選択肢に無い名前（表示用の●・★付き）は、印を除いた名前で選び、選んだ名前を返す */
  async 買取状況を変えて保存する(名前: string): Promise<string> {
    const sel = this.買取状況の選択();
    await expect(sel, "買取情報編集画面の買取状況").toBeVisible({ timeout: OPEN });
    const have = (await sel.locator("option").allInnerTexts()).map((t) => t.trim());
    let 選ぶ = 名前;
    if (!have.includes(選ぶ)) 選ぶ = 名前.replace(/[●★]/g, "");
    if (!have.includes(選ぶ)) throw new Error(`買取状況に「${名前}」が無い（ある選択肢: ${have.filter(Boolean).join("、")}）`);
    await sel.selectOption({ label: 選ぶ }, { timeout: OPEN });
    await this.保存する(`買取状況を「${選ぶ}」に変える`);
    return 選ぶ;
  }

  async 保存する(what: string): Promise<void> {
    await Promise.all([this.page.waitForLoadState("load"), this.page.locator("#save_btn").click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    await expectSaved(this.page, what);
  }

  /** 買取明細（査定）の行の数 */
  readonly 明細の行 = () => this.page.locator('#buy_main_cards_field_list tr[id^="purchase_list_main__item"], #buy_main_cards_field_list tr').filter({ has: this.page.locator('[name^="admin_purchase_detail[buyMainCards]"]') });

  /** 「商品追加」（選んで買取。サプライ品などを買取明細に足す）で、商品コード・商品名・IDで探した最初の商品を決定する */
  async 明細に商品を追加する(キーワード: string): Promise<void> {
    await this.page.locator("#add_product").click({ timeout: OPEN });
    const modal = this.page.locator("#searchProductModal");
    await expect(modal, "商品追加の商品検索モーダル").toBeVisible({ timeout: OPEN });
    await modal.locator("#admin_search_product_id").fill(キーワード, { timeout: OPEN });
    await modal.locator("#searchProductModalButton").click({ timeout: OPEN });
    const decide = modal.locator("button.js-add-purchase-product").first();
    await expect(decide, `商品検索の結果（${キーワード}）の「決定」ボタン`).toBeVisible({ timeout: 30_000 });
    await decide.click({ timeout: OPEN });
    await expect(modal, "商品検索モーダルが閉じる").toBeHidden({ timeout: OPEN });
  }

  /** 「査定編集」を押して編集できる状態にする */
  async 査定編集を始める(): Promise<void> {
    const sw = this.page.locator("#edit_appraisal_switch");
    await expect(sw, "査定編集ボタン").toHaveText("査定編集", { timeout: OPEN });
    await sw.click({ timeout: OPEN });
    await expect(sw, "査定確定ボタンに変わる").toHaveText("査定確定", { timeout: OPEN });
  }

  /** 「査定確定」を押す */
  async 査定確定する(): Promise<void> {
    const sw = this.page.locator("#edit_appraisal_switch");
    await expect(sw, "査定確定ボタン").toHaveText("査定確定", { timeout: OPEN });
    await sw.click({ timeout: OPEN });
    await expect(sw, "査定編集ボタンに戻る").toHaveText("査定編集", { timeout: OPEN });
  }

  /** 査定編集中に、明細 index 番目（0始まり）の査定価格・数量・売却を入れる */
  async 明細を入れる(index: number, v: { 査定価格?: string; 数量?: string; 売却?: string }): Promise<void> {
    const f = (name: string) => this.page.locator(`[name="admin_purchase_detail[buyMainCards][${index}][${name}]"]`);
    if (v.査定価格 !== undefined) await f("price").fill(v.査定価格, { timeout: OPEN });
    if (v.数量 !== undefined) await f("count").fill(v.数量, { timeout: OPEN });
    if (v.売却 !== undefined) await f("saleFlg").selectOption({ label: v.売却 }, { timeout: OPEN });
  }

  /** 査定編集で、買取明細すべての売却を選ぶ。選んだ行数を返す */
  async 売却をすべて選ぶ(売却: string): Promise<number> {
    const sels = this.page.locator('select[name^="admin_purchase_detail[buyMainCards]"][name$="[saleFlg]"]');
    const n = await sels.count();
    for (let i = 0; i < n; i++) await sels.nth(i).selectOption({ label: 売却 }, { timeout: OPEN });
    return n;
  }

  /** 送料の入力欄 */
  readonly 送料の欄 = () => this.page.locator("#admin_purchase_detail_deliveryFee");

  /** 実在庫情報の「編集」を押して編集欄を開く */
  async 実在庫の編集を開く(): Promise<void> {
    const btn = this.page.locator("#edit");
    await expect(btn, "実在庫情報の編集ボタン").toHaveText("編集", { timeout: OPEN });
    await btn.click({ timeout: OPEN });
    await expect(this.page.locator("#detail_stock_edit"), "実在庫の編集欄").toBeVisible({ timeout: OPEN });
  }

  /** 実在庫の編集欄で「商品追加」→ 商品コードで検索 → 最初の商品を決定 → 増減数を入れ、「追加品確定」を押して保存する */
  async 実在庫に商品を追加する(商品コード: string, 増減数: string, what: string): Promise<void> {
    await this.page.locator("#stockAddButton").click({ timeout: OPEN });
    const modal = this.page.locator("#registModal");
    await expect(modal, "実在庫用の商品検索モーダル").toBeVisible({ timeout: OPEN });
    await modal.locator("#stock_admin_search_product_id").fill(商品コード, { timeout: OPEN });
    await modal.locator("#stockSearchProductModalButton").click({ timeout: OPEN });
    const decide = modal.locator("#searchProductModalList button.add-order-item").first();
    await expect(decide, `商品検索の結果（${商品コード}）の「追加」ボタン`).toBeVisible({ timeout: 30_000 });
    await decide.click({ timeout: OPEN });
    await expect(modal, "商品検索モーダルが閉じる").toBeHidden({ timeout: 30_000 });
    const row = this.page.locator("#stockEdit tr.js-added-stock-row").last();
    await expect(row, "追加した商品の行").toBeVisible({ timeout: OPEN });
    await row.locator('input[name$="[diff_stock]"]').fill(増減数, { timeout: OPEN });
    await Promise.all([this.page.waitForLoadState("load"), this.page.getByRole("button", { name: "追加品確定" }).click({ timeout: OPEN })]);
    await this.page.waitForLoadState("load");
    await expectSaved(this.page, what);
  }
}
