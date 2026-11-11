/**
 * M05-20 出荷指示リスト編集（出荷指示リスト詳細）の画面部品と、シードが使う出荷指示リストの生成。
 * 出荷指示リストは出荷指示リスト検索画面の「出荷指示リスト生成」欄で、注文番号の範囲を指定して生成する。
 */
import { Dialog, expect, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { OrderSearchPage } from "./m05_01_order_search_k";
import { OrderCsvPage } from "./m05_05_custom_csv";

/** 受注一覧で注文番号を検索し、その受注の受注登録画面を開いて、アドレスの受注IDを返す */
export async function 受注IDを読む(page: Page, 注文番号: string, what: string): Promise<string> {
  const csv = new OrderCsvPage(page);
  await csv.openSearch();
  const n = await csv.注文番号で検索する(注文番号);
  if (n < 1) throw new Error(`${what}: 注文番号 ${注文番号} の受注が受注一覧に出ない`);
  const href = await page.locator('a.action-edit[href*="/order/"]').first().getAttribute("href");
  const id = /\/order\/(\d+)\/edit/.exec(href ?? "")?.[1];
  if (!id) throw new Error(`${what}: 受注一覧の編集リンクから受注IDを読めない（${href}）`);
  return id;
}

/** 出荷指示リスト検索画面で、注文番号（from）と（to）に同じ注文番号を入れて生成し、検索して出荷指示番号を読む */
export async function 出荷指示リストを生成する(page: Page, 注文番号: string, what: string): Promise<string> {
  return 出荷指示リストを範囲で生成する(page, 注文番号, 注文番号, 注文番号, what);
}

/**
 * 出荷指示リスト検索画面の生成欄で、注文番号（from）と（to）を入れて生成し、注文番号（検索用）で検索して出荷指示番号を読む。
 * 手元のDBには同じ注文番号の古い受注がある（採番が戻っているため）ので、複数出たときは、いま生成した（出荷指示番号が最大の）ものを使う。
 */
export async function 出荷指示リストを範囲で生成する(page: Page, from: string, to: string, 検索する注文番号: string, what: string): Promise<string> {
  page.setDefaultTimeout(60_000);
  await page.goto(adminUrl("/standby/search"));
  await page.waitForLoadState("load");
  const toggle = page.locator('a[href="#generateList"]');
  if (!(await page.locator("#generateList").isVisible())) await toggle.click();
  await expect(page.locator("#generateList"), `${what}: 出荷指示リスト生成欄`).toBeVisible();
  await page.locator('[name="admin_generate_shipping_standby[order_id_from]"]').fill(from);
  await page.locator('[name="admin_generate_shipping_standby[order_id_to]"]').fill(to);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#generate_form button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  await page.goto(adminUrl("/standby/search"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_shipping_standby[order_id]"]').fill(検索する注文番号);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('button[type="submit"][form="search_form"]').click()]);
  await page.waitForLoadState("load");
  const ids = await page.locator('tr[id^="result_list_main__item--"]').evaluateAll((rs) => rs.map((r) => r.id.replace("result_list_main__item--", "")));
  if (ids.length === 0) {
    const msgs = (await page.locator(".alert").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    throw new Error(`${what}: 注文番号 ${検索する注文番号} の出荷指示リストが 0 件。画面の表示: ${msgs.join(" / ") || "なし"}`);
  }
  ids.sort((a, b) => Number(b) - Number(a));
  return ids[0];
}

/** 備考を入れて登録する（出荷指示リスト詳細画面） */
export async function 備考を登録する(page: Page, 出荷指示リストID: string, 備考: string, what: string): Promise<void> {
  const p = new StandbyDetailPage(page);
  await p.open(出荷指示リストID);
  await p.備考欄.fill(備考);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), p.登録ボタン.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator(".alert-success"), `${what}: 備考の登録の結果`).toBeVisible();
}

export class StandbyDetailPage {
  private dialog: Dialog | null = null;
  private clicking: Promise<unknown> | null = null;
  constructor(private readonly page: Page) {
    page.setDefaultTimeout(60_000);
    page.on("dialog", (d) => { this.dialog = d; });
  }
  get 備考欄() { return this.page.locator("form[action*='/standby/'][action$='/update'] textarea"); }
  get 登録ボタン() { return this.page.locator("form[action*='/standby/'][action$='/update'] button[type=submit]"); }
  get リスト削除ボタン() { return this.page.locator("a[token-for-anchor][href*='/standby/']").filter({ hasText: /リスト削除/ }).first(); }
  get 出荷指示番号の表示() { return this.page.locator("#number_info_box__standby_id"); }

  /** 出荷指示リスト詳細画面を開く。応答の状態を返す */
  async open(出荷指示リストID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/standby/${出荷指示リストID}/edit`));
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 開発者ツールで、登録フォームの送信先の出荷指示リストIDを書き換える */
  async 登録フォームの送信先IDを書き換える(新ID: string): Promise<void> {
    await this.page.locator("form[action*='/standby/'][action$='/update']").evaluate((f, id) => {
      const form = f as HTMLFormElement;
      form.action = form.action.replace(/\/standby\/\d+\/update/, `/standby/${id}/update`);
    }, 新ID);
  }
  /** 開発者ツールで、リスト削除要求の送信先IDを書き換える */
  async 削除要求の送信先IDを書き換える(新ID: string): Promise<void> {
    await this.リスト削除ボタン.evaluate((a, id) => {
      const el = a as HTMLAnchorElement;
      el.setAttribute("href", el.getAttribute("href")!.replace(/\/standby\/\d+\/delete/, `/standby/${id}/delete`));
    }, 新ID);
  }

  /** 登録ボタンを押し、その要求の応答の状態と、押したあとの画面の見出しの文を返す */
  async 登録を押す(): Promise<{ 応答: number; 画面の文: string }> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r: Response) => r.request().method() === "POST" && /\/standby\/\d+\/update/.test(r.url())),
      this.登録ボタン.click(),
    ]);
    await this.page.waitForLoadState("load");
    return { 応答: res.status(), 画面の文: ((await this.page.locator("body").innerText()).replace(/\s+/g, " ")).slice(0, 200) };
  }

  /** リスト削除ボタンを押す（確認のダイアログが出るまで待つ。OKは別の手順で押す） */
  async リスト削除を押す(): Promise<{ 確認の文: string | null }> {
    this.dialog = null;
    this.clicking = this.リスト削除ボタン.click({ noWaitAfter: true }).catch(() => undefined);
    for (let i = 0; i < 50 && !this.dialog; i++) await this.page.waitForTimeout(100);
    const d = this.dialog as Dialog | null;
    return { 確認の文: d ? d.message() : null };
  }

  /** 確認のダイアログでOKを押し、削除要求の応答の状態を返す */
  async 確認ダイアログでOKを押す(): Promise<{ 応答: number | null }> {
    const d = this.dialog as Dialog | null;
    if (!d) return { 応答: null };
    const resP = this.page.waitForResponse((r: Response) => /\/standby\/(\d+\/)?delete/.test(r.url()), { timeout: 15_000 }).then((r) => r, () => null);
    await d.accept();
    await this.clicking;
    const res = await resP;
    // 削除が成功すると検索画面へ移る。移り終わるまで待つ（見つからない応答なら移らないので、短く待って先へ進む）
    await this.page.waitForURL(/\/standby\/search/, { timeout: 15_000 }).catch(() => undefined);
    await this.page.waitForLoadState("load");
    return { 応答: res ? res.status() : null };
  }

  /** 確認のダイアログでキャンセルを押す（削除要求は送られない） */
  async 確認ダイアログでキャンセルを押す(): Promise<void> {
    const d = this.dialog as Dialog | null;
    if (!d) return;
    await d.dismiss();
    await this.clicking;
    await this.page.waitForTimeout(500);
  }

  /** 開発者ツールで、リスト削除要求のなりすまし対策トークンを書き換える */
  async 削除要求のトークンを書き換える(値: string): Promise<void> {
    await expect(this.リスト削除ボタン, "リスト削除のなりすまし対策トークン").toHaveAttribute("token-for-anchor", /.+/);
    await this.リスト削除ボタン.evaluate((a, t) => a.setAttribute("token-for-anchor", t), 値);
    await expect(this.リスト削除ボタン, "書き換えたなりすまし対策トークン").toHaveAttribute("token-for-anchor", 値);
  }

  /** 開発者ツールで、リスト削除要求の方式（data-method）を書き換える */
  async 削除要求の方式を書き換える(方式: string): Promise<void> {
    await this.リスト削除ボタン.evaluate((a, m) => a.setAttribute("data-method", m), 方式);
    await expect(this.リスト削除ボタン, "書き換えた削除要求の方式").toHaveAttribute("data-method", 方式);
  }

  /** 開発者ツールで、リスト削除要求の送信先から出荷指示リストIDを削除する（…/standby/<ID>/delete → …/standby/delete）。書き換えた送信先を返す */
  async 削除要求の送信先からIDを削除する(): Promise<string> {
    return this.リスト削除ボタン.evaluate((a) => {
      const el = a as HTMLAnchorElement;
      el.setAttribute("href", el.getAttribute("href")!.replace(/\/standby\/\d+\/delete/, "/standby/delete"));
      return el.getAttribute("href") ?? "";
    });
  }

  /** 受注一覧の1行（受注IDの行）の表示 */
  受注行(受注ID: string) {
    const col = (name: string) => this.page.locator(`#result_list_main__${name}--${受注ID}`);
    return {
      行: this.page.locator(`#result_list_main__item--${受注ID}`),
      選択: this.page.locator(`#check-${受注ID}`),
      注文番号: col("id"), お名前: col("name"), 支払方法: col("payment_method"), 購入金額: col("payment_total"),
      合計点数: col("total_count"), 受注日: col("order_date"), 出荷指示日: col("commit_date"), 対応状況: col("order_status"),
    };
  }
  /** 受注の注文番号のリンク */
  注文番号のリンク(受注ID: string) { return this.page.locator(`#result_list_main__id--${受注ID} a`); }
  get 全件選択() { return this.page.locator("#check-all"); }
  /** 全件選択のチェックボックスを、オン・オフにする（いまの状態と同じなら押さない） */
  async 全件選択を設定する(on: boolean): Promise<void> {
    await this.全件選択.setChecked(on);
  }
  /** 登録日・更新日・最終更新者の表示の文（「登録日：2026/08/01 10:20:30」など。コロンより後ろ） */
  async リスト情報(): Promise<{ 出荷指示番号: string; 登録日: string; 更新日: string; 最終更新者: string }> {
    const t = async (id: string) => {
      const s = ((await this.page.locator(`#number_info_box__${id}`).innerText()) ?? "").replace(/\s+/g, " ").trim();
      return s.replace(/^[^：]*：\s*/, "");
    };
    return { 出荷指示番号: await t("standby_id"), 登録日: await t("create_date"), 更新日: await t("update_date"), 最終更新者: await t("member") };
  }

  async 画面の文(): Promise<string> { return ((await this.page.locator("body").innerText()).replace(/\s+/g, " ")).slice(0, 200); }
}

/** メンバー管理の一覧で、管理者IDの行を削除する（システム管理者でログインした画面。削除の確認の窓で削除を押す） */
export async function メンバーを削除する(page: Page, 管理者ID: string): Promise<void> {
  const res = await page.goto(adminUrl("/setting/system/member"));
  if (!res || !res.ok()) throw new Error(`メンバー一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const row = page.locator(`tr#ex-member-${管理者ID}`);
  await expect(row, `メンバー一覧の管理者ID ${管理者ID} の行`).toHaveCount(1);
  await row.locator("a.action-delete").click();
  const ok = page.locator(`#member_delete_${管理者ID} a.btn-ec-delete[data-method="delete"]`);
  await expect(ok).toBeVisible();
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), ok.click()]);
  await page.waitForLoadState("load");
  await expect(page.locator(".alert-success"), "メンバー削除の結果").toBeVisible();
}

/** 受注情報検索 一覧(検索入力)で、店舗に全店を選び、注文番号を入れて（対応状況はすべて選んで）検索する */
export async function 受注を注文番号で検索する(page: Page, 注文番号: string): Promise<void> {
  const p = new OrderSearchPage(page);
  await p.open();
  await p.selectTenants(["全店"]);
  await p.orderNumber.fill(注文番号);
  await p.showDetail();
  await page.locator('#admin_search_order_status input[type="checkbox"]').evaluateAll((ns) => ns.forEach((n) => { (n as HTMLInputElement).checked = true; }));
  await p.clickSearch();
}

/**
 * 受注情報検索 一覧(検索結果)で、注文番号の行の出荷指示日・対応状況を読む（列は 受注日・注文番号・お名前・支払方法・購入金額・出荷指示日・対応状況・店舗）。
 * 手元のDBには同じ注文番号の古い受注があるので、同じ注文番号の行が複数あれば、受注IDが最大の行を読む。
 */
export async function 検索結果の行を読む(page: Page, 注文番号: string): Promise<{ 件数: number; 出荷指示日: string; 対応状況: string }> {
  const rows = await page.locator("#search_result tbody tr").evaluateAll((trs, no) => trs
    .map((tr) => {
      const tds = Array.from(tr.querySelectorAll("td"));
      const a = tr.querySelector("td:nth-child(3) a") as HTMLAnchorElement | null;
      return {
        no: (tds[2]?.textContent ?? "").replace(/\s+/g, " ").trim(),
        id: Number(/\/order\/(\d+)\/edit/.exec(a?.href ?? "")?.[1] ?? 0),
        date: (tds[6]?.textContent ?? "").replace(/\s+/g, " ").trim(),
        status: (tds[7]?.textContent ?? "").replace(/\s+/g, " ").trim(),
      };
    })
    .filter((r) => r.no === no), 注文番号);
  if (rows.length === 0) return { 件数: 0, 出荷指示日: "", 対応状況: "" };
  rows.sort((a, b) => b.id - a.id);
  return { 件数: rows.length, 出荷指示日: rows[0].date, 対応状況: rows[0].status };
}
