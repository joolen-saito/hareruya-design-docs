/**
 * M05-05 受注詳細カスタムCSV出力の画面部品。
 * - 受注情報検索の一覧: 注文番号で検索する・「受注詳細CSVダウンロード」「受注詳細カスタムCSVダウンロード」を押してCSVを受け取る。
 * - カスタムCSV出力設定（配送CSV）: 名前を決め、「CSV出力しない項目」から項目を移して並べ、登録する。登録後のアドレスの末尾の番号が定義ID。
 * - CSV出力項目設定（配送CSV）: 受注詳細CSV出力の全体の出力項目（共有の設定）。
 */
import { expect, Page } from "@playwright/test";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export type ダウンロード結果 = { ファイル名: string; 行: string[][]; 開始: Date; 完了: Date };

export class OrderCsvPage {
  constructor(private readonly page: Page) { page.setDefaultTimeout(60_000); }

  /** 受注情報検索 一覧(検索入力)画面を開く */
  async openSearch(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "受注情報検索 一覧(検索入力)画面の応答").toBeLessThan(400);
    await expect(this.page.locator("form#search_form"), "受注情報検索の検索欄").toBeVisible();
  }

  /** 注文番号を入れて検索する（店舗の欄が空なら先頭の店舗を選ぶ。対応状況をすべて選ぶ指定もできる） */
  async 注文番号で検索する(注文番号: string, opt: { 対応状況をすべて選ぶ?: boolean } = {}): Promise<number> {
    const form = this.page.locator("form#search_form");
    const tenants = form.locator("#admin_search_order_tenants");
    if ((await tenants.count()) > 0) {
      const selected = await tenants.evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).length);
      if (selected === 0) {
        await tenants.evaluate((node) => {
          const s = node as HTMLSelectElement;
          const hit = Array.from(s.options).find((o) => o.value === "1") ?? s.options[0];
          hit.selected = true;
          const w = window as unknown as { jQuery?: (e: Element) => { trigger: (ev: string) => void } };
          if (w.jQuery) w.jQuery(s).trigger("change"); else s.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }
    }
    await form.locator("#admin_search_order_order_number").fill(注文番号);
    if (opt.対応状況をすべて選ぶ) {
      const detail = this.page.locator("#searchDetail");
      if (!(await detail.isVisible())) {
        await this.page.locator('button[data-bs-target="#searchDetail"]').click();
        await expect(detail, "詳細検索の欄").toBeVisible();
      }
      const boxes = this.page.locator('#admin_search_order_status input[type="checkbox"]');
      for (const b of await boxes.all()) await b.check();
    }
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator("#search_submit").click()]);
    await this.page.waitForLoadState("load");
    return this.page.locator('a.action-edit[href*="/order/"]').count();
  }

  /** ダウンロードを待つ。出力の要求が異常な応答（500など）を返したときは、待たずにその応答の状態を知らせて止まる */
  private async receive(open: () => Promise<void>): Promise<ダウンロード結果> {
    const 開始 = new Date();
    let bad: string | null = null;
    const onResp = (r: import("@playwright/test").Response) => {
      if (/\/(order\/export\/|custom_csv\/export\/)/.test(r.url()) && r.status() >= 400) bad = `${r.status()} ${new URL(r.url()).pathname}`;
    };
    this.page.on("response", onResp);
    try {
      const dlP = this.page.waitForEvent("download", { timeout: 60_000 }).then((d) => d, () => null);
      await open();
      const dl = await dlP;
      if (!dl) throw new Error(bad ? `CSVの出力の要求が異常な応答を返した（${bad}）` : "CSVのダウンロードが始まらない");
      const path = await dl.path();
      const 完了 = new Date();
      const fs = await import("node:fs");
      return { ファイル名: dl.suggestedFilename(), 行: parseCsv(decodeCsvBytes(fs.readFileSync(path))), 開始, 完了 };
    } finally {
      this.page.off("response", onResp);
    }
  }

  /** 「受注詳細CSVダウンロード」（出力項目設定の全体の形） */
  async 受注詳細CSVをダウンロードする(): Promise<ダウンロード結果> {
    return this.receive(async () => {
      await this.page.locator(".btn-group:has(#shippingCsvDownload) > button").first().click();
      await this.page.locator("#shippingCsvDownload").click();
    });
  }

  /** 「受注詳細カスタムCSVダウンロード」で定義の名前を選ぶ */
  async 受注詳細カスタムCSVをダウンロードする(定義名: string): Promise<ダウンロード結果> {
    return this.receive(async () => {
      await this.page.locator("#customShippingCsvDownloadDropDown").click();
      const item = this.page.locator("#customShippingCsvDownloadDropDown + .dropdown-menu a.dropdown-item").filter({ hasText: new RegExp(`^\\s*${定義名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
      await expect(item, `カスタムCSVの一覧に定義「${定義名}」が1つ`).toHaveCount(1);
      await item.click();
    });
  }

  /** カスタムCSVの一覧にある定義のダウンロード先のアドレス（開発者ツールで読む）から、定義IDを読む */
  async 定義のダウンロードURL(定義名: string): Promise<string> {
    await this.page.locator("#customShippingCsvDownloadDropDown").click();
    const item = this.page.locator("#customShippingCsvDownloadDropDown + .dropdown-menu a.dropdown-item").filter({ hasText: new RegExp(`^\\s*${定義名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
    await expect(item, `カスタムCSVの一覧に定義「${定義名}」が1つ`).toHaveCount(1);
    return (await item.getAttribute("href")) ?? "";
  }

  /** 一覧のダウンロード先のアドレスを、定義IDだけ置き換えて開く。ダウンロードされたか、応答の状態を返す */
  async 定義IDを置き換えて開く(元のURL: string, 新しい定義ID: string): Promise<{ ダウンロードされた: boolean; 応答: number | null; ファイル名: string | null }> {
    const url = new URL(元のURL, this.page.url());
    url.pathname = url.pathname.replace(/\/custom_csv\/export\/\d+/, `/custom_csv/export/${新しい定義ID}`);
    const dl = this.page.waitForEvent("download", { timeout: 15_000 }).then((d) => d, () => null);
    const nav = this.page.goto(url.toString()).then((r) => r, (e: Error) => e);
    const [d, r] = await Promise.all([dl, nav]);
    if (d) return { ダウンロードされた: true, 応答: null, ファイル名: d.suggestedFilename() };
    return { ダウンロードされた: false, 応答: r && !(r instanceof Error) ? r.status() : null, ファイル名: null };
  }

  /** 受注詳細カスタムCSV（配送CSV）の出力項目設定の画面を開く（受注一覧の「出力項目設定」の行き先。配送CSVの種別は4） */
  async openCustomCsvSetting(): Promise<void> {
    const res = await this.page.goto(adminUrl("/setting/shop/custom_csv/4"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "カスタムCSV出力設定（配送CSV）の応答").toBeLessThan(400);
  }
}

const labelsOf = (page: Page, id: string) => page.locator(`#${id} option`).evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: (o.textContent ?? "").trim() })));

/**
 * カスタムCSV出力設定で「配送CSV」の定義を新規作成する。出力する項目は、渡した順に「CSV出力しない項目」から移し、その順に並べる。
 * 登録後に開いた画面のアドレスの末尾の番号（定義ID）を返す。項目名が画面に無いときは止める。
 */
export async function createCustomShippingCsv(page: Page, 定義名: string, 項目: string[], what: string): Promise<string> {
  await new OrderCsvPage(page).openCustomCsvSetting();
  await expect(page.locator("#csv-form"), `${what}: カスタムCSV出力設定画面`).toBeVisible();
  await page.locator('[name="admin_custom_csv[name]"]').fill(定義名);
  const notOut = await labelsOf(page, "csv-not-output");
  const used = new Set<string>();
  const values: string[] = [];
  for (const label of 項目) {
    const hit = notOut.find((o) => o.label === label && !used.has(o.value));
    if (!hit) throw new Error(`${what}: カスタムCSV出力設定の「CSV出力しない項目」に「${label}」が無い（ある項目: ${notOut.map((o) => o.label).join("、")}）`);
    used.add(hit.value);
    values.push(hit.value);
  }
  // 項目を渡した順に1つずつ移す（出力する項目の末尾へ足されるので、渡した順に並ぶ）
  for (const v of values) {
    await page.locator("#csv-not-output").selectOption(v);
    await page.locator("#add").click();
  }
  const out = (await labelsOf(page, "csv-output")).map((o) => o.label);
  if (JSON.stringify(out) !== JSON.stringify(項目)) throw new Error(`${what}: 「CSV出力する項目」の並びが指定と違う（画面: ${out.join("、")}）`);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#csv-form button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: カスタムCSV出力設定の登録`);
  const m = /\/custom_csv\/\d+\/(\d+)\/?$/.exec(new URL(page.url()).pathname);
  if (!m) throw new Error(`${what}: 登録後のアドレスの末尾に定義IDが無い（${page.url()}）`);
  return m[1];
}

/** 全項目の出力項目を75項目の指定順にするための補助: 項目の移動を一括で行う（「すべて移動」→並べ替え） */
export async function createCustomShippingCsvAll(page: Page, 定義名: string, 項目: string[], what: string): Promise<{ 定義ID: string; 足りない項目: string[] }> {
  await new OrderCsvPage(page).openCustomCsvSetting();
  await page.locator('[name="admin_custom_csv[name]"]').fill(定義名);
  const notOut = await labelsOf(page, "csv-not-output");
  const pool = [...notOut];
  const wantValues: string[] = [];
  const 足りない: string[] = [];
  for (const label of 項目) {
    const i = pool.findIndex((o) => o.label === label);
    if (i < 0) { 足りない.push(label); continue; }
    wantValues.push(pool[i].value);
    pool.splice(i, 1);
  }
  // 状態・属性に挙げた順に、1項目ずつ「CSV出力する項目」へ移す
  for (const v of wantValues) {
    await page.locator("#csv-not-output").selectOption(v);
    await page.locator("#add").click();
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#csv-form button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: カスタムCSV出力設定の登録`);
  const m = /\/custom_csv\/\d+\/(\d+)\/?$/.exec(new URL(page.url()).pathname);
  if (!m) throw new Error(`${what}: 登録後のアドレスの末尾に定義IDが無い（${page.url()}）`);
  return { 定義ID: m[1], 足りない項目: 足りない };
}

/** 受注詳細CSVの出力項目設定（共有の設定）で、項目を出力する側／しない側へ移して登録する。移す前に出力側にあったかを返す */
export async function setShippingCsvOutput(page: Page, 項目: string, 出力する: boolean, what: string): Promise<{ 移す前に出力していた: boolean }> {
  page.setDefaultTimeout(60_000);
  await page.goto(adminUrl("/setting/shop/csv/4"));
  await page.waitForLoadState("load");
  const outs = await labelsOf(page, "csv-output");
  const before = outs.some((o) => o.label === 項目);
  if (before !== 出力する) {
    if (出力する) {
      const hit = (await labelsOf(page, "csv-not-output")).find((o) => o.label === 項目);
      if (!hit) throw new Error(`${what}: 受注詳細CSV出力項目設定に「${項目}」が無い`);
      await page.locator("#csv-not-output").selectOption(hit.value);
      await page.locator("#add").click();
    } else {
      const hit = outs.find((o) => o.label === 項目)!;
      await page.locator("#csv-output").selectOption(hit.value);
      await page.locator("#remove").click();
    }
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('#csv-form button[type="submit"]').click()]);
    await page.waitForLoadState("load");
    await expectSaved(page, `${what}: 受注詳細CSV出力項目設定の登録`);
  }
  return { 移す前に出力していた: before };
}
