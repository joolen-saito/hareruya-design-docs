/**
 * M05-09 納品書印刷（日本語）の画面操作。受注情報検索 一覧(検索結果)・出荷指示リスト編集の「納品書印刷（日本語）」と、
 * 開いた新しい窓の納品書（HTML。@admin/ShippingStandby/delivery_slips.ja.twig）を読む。セレクタはここだけに書く。
 * 正本: cases/M05-09_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { OrderListPage } from "./m05_01_order_list_x";
import { PickingPrintPage } from "./m05_21_picking";

export type 明細行 = { 商品名: string; 価格: string; 数量: string; 合計: string };
export type 納品書のページ = {
  注文番号: string; ページ: string; 受取人署名: boolean;
  お届け先: string[]; 送り主: string[]; 会社: string[];
  お買上額: string; 送料: string; 手数料: string; ポイント使用: string; 発送方法: string; 請求金額: string;
  明細: 明細行[]; 合計の数量: string;
};

/** 受注情報検索 一覧(検索結果)。試験会員のメールアドレスで、全ての対応状況の受注を出す */
export class SlipOrderListPage extends OrderListPage {
  async 会員の受注を出す(メール: string): Promise<void> {
    await this.open();
    await this.showDetail();
    await this.email.fill(メール);
    const boxes = this.page.locator('#admin_search_order_status input[type="checkbox"]');
    const n = await boxes.count();
    for (let i = 0; i < n; i++) await boxes.nth(i).setChecked(true, { force: true });
    await this.clickSearch();
  }
  /** 注文番号の行の選択（配送先ごとに1行。行のチェックボックス） */
  行の選択(注文番号: string): Locator { return this.結果の行(注文番号).locator('input[type="checkbox"][id^="check_"]'); }
  /** 注文番号の行をすべて選ぶ（配送先が2件なら2行とも） */
  async 受注を選ぶ(注文番号: string): Promise<number> {
    const boxes = this.行の選択(注文番号);
    const n = await boxes.count();
    if (n === 0) throw new Error(`検索結果に注文番号 ${注文番号} の行が無い`);
    for (let i = 0; i < n; i++) await boxes.nth(i).check({ force: true });
    return n;
  }
  /** 配送先IDの行だけを選ぶ */
  async 配送先を選ぶ(配送先ID: string): Promise<void> {
    const box = this.page.locator(`#check_${配送先ID}`);
    await expect(box, `配送先ID ${配送先ID} の行の選択`).toHaveCount(1);
    await box.check({ force: true });
  }
  /** 「納品書印刷（日本語）」を押し、開いた新しい窓（納品書）を返す */
  async 納品書印刷を押す(): Promise<Page> {
    return 窓を開く(this.page, this.page.locator("#printDeliverySlipsJp"), /\/order\/print\/delivery_slips\/ja/);
  }
}

/** 出荷指示リスト編集の受注の選択と「納品書印刷（日本語）」 */
export class SlipStandbyPage extends PickingPrintPage {
  async 納品書印刷を押す(): Promise<Page> {
    return 窓を開く(this.page, this.page.locator("#printDeliverySlipsJp"), /\/standby\/\d+\/print\/delivery\/ja/);
  }
  /** 開発者ツールの代わりに、納品書印刷の送り先（出荷指示リストID）を書き換える。押したときに画面のスクリプトが送り先を入れるので、押す前に書き換えの処理を足す */
  async 送り先の出荷指示リストIDを書き換える(元のID: string, 新しいID: string): Promise<void> {
    await this.page.evaluate(([from, to]) => {
      const f = document.querySelector("#form_bulk") as HTMLFormElement | null;
      if (!f) throw new Error("出荷指示リスト編集の送信用のフォームが無い");
      f.addEventListener("submit", () => { f.action = f.action.replace(`/standby/${from}/print/delivery/`, `/standby/${to}/print/delivery/`); }, true);
    }, [元のID, 新しいID]);
  }
}

async function 窓を開く(page: Page, button: Locator, url: RegExp): Promise<Page> {
  await page.waitForLoadState("load");
  await expect(button, "納品書印刷（日本語）ボタン").toBeVisible();
  const [popup] = await Promise.all([page.waitForEvent("popup", { timeout: 60_000 }), button.click()]);
  await popup.waitForLoadState("load");
  // 空の窓を開いてからフォームを送る作りなので、納品書の画面へ移るまで待つ
  await popup.waitForURL(url, { timeout: 60_000 }).catch(() => undefined);
  await popup.waitForLoadState("load");
  return popup;
}

/** 開いた窓の応答の状態（納品書の画面か・エラーか）。画面の見出しと本文の先頭を返す */
export async function 窓の様子(popup: Page): Promise<{ URL: string; 題: string; 本文: string; 納品書のページ数: number }> {
  const 本文 = ((await popup.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  return { URL: popup.url(), 題: await popup.title().catch(() => ""), 本文, 納品書のページ数: await popup.locator(".ContentsAll .multipage").count() };
}

/** 納品書の画面の、ページごとの内容を読む */
export async function 納品書を読む(popup: Page): Promise<納品書のページ[]> {
  await expect(popup.locator(".ContentsAll"), "納品書の画面").toBeAttached({ timeout: 30_000 });
  return popup.locator(".ContentsAll .multipage").evaluateAll((pages) => pages.map((p) => {
    const t = (e: Element | null | undefined) => (e?.textContent ?? "").replace(/\s+/g, " ").trim();
    const lines = (e: Element | null | undefined) => ((e as HTMLElement | null)?.innerText ?? "").split("\n").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
    const divs = Array.from(p.children) as HTMLElement[];
    const head = divs.map((d) => t(d));
    const ページ = head.find((s) => /^\d+\/\d+$/.test(s)) ?? "";
    const 番号 = /注文番号:\s*(\S+)/.exec(head.find((s) => s.startsWith("注文番号")) ?? "")?.[1] ?? "";
    const 署名 = head.some((s) => s.startsWith("受取人署名"));
    const blocks = Array.from(p.querySelectorAll(":scope > div > div[style*='float: left']"));
    const c = (cls: string) => t(p.querySelector(`table.sales_ td.${cls}`));
    const rows = Array.from(p.querySelectorAll("table.detail tr")).filter((tr) => tr.querySelector("td"));
    const items = rows.map((tr) => ({ 商品名: t(tr.querySelector("td.gname")), 価格: t(tr.querySelector("td.price")), 数量: t(tr.querySelector("td.qty")), 合計: t(tr.querySelector("td.amt")) }));
    const last = items.length > 0 && items[items.length - 1].商品名 === "合計" ? items[items.length - 1] : null;
    return {
      注文番号: 番号, ページ, 受取人署名: 署名,
      お届け先: lines(blocks[0]), 送り主: lines(blocks[1]), 会社: lines(blocks[2]),
      お買上額: c("subtotal_"), 送料: c("postage_"), 手数料: c("charge_"), ポイント使用: c("point_out_"), 発送方法: c("delivery_method_"),
      請求金額: t(p.querySelector("table.total_ td.total_")),
      明細: last ? items.slice(0, -1) : items, 合計の数量: last?.数量 ?? "",
    };
  }));
}

/** 受注情報編集画面を受注IDで開く */
export async function 受注情報編集を開く(page: Page, 受注ID: string): Promise<void> {
  const res = await page.goto(adminUrl(`/order/${受注ID}/edit`));
  expect(res?.status() ?? 0, `受注ID ${受注ID} の受注情報編集画面の応答`).toBeLessThan(400);
  await page.waitForLoadState("load");
  await expect(page.locator("#order_OrderStatus"), "受注情報編集画面").toBeVisible({ timeout: 30_000 });
  await 出荷情報の欄を開く(page);
}

/**
 * 受注情報編集の「出荷情報」の欄（#shippingInfo。お届け先の住所・配送方法など）を開く。既存の受注を開くと畳まれて出る
 * （新アプリの edit.twig: collapse {{ id ? '' : 'show' }}。2026-11-11 の M05-09 で配送方法の選択欄が見えずに止まった）。
 */
export async function 出荷情報の欄を開く(page: Page): Promise<void> {
  const box = page.locator("#shippingInfo");
  if ((await box.count()) !== 1) return;
  if (await box.evaluate((e) => e.classList.contains("show"))) return;
  await page.locator('a[href="#shippingInfo"]').first().click();
  await expect(box, "出荷情報の欄が開いた").toHaveClass(/\bshow\b/, { timeout: 10_000 });
}

export type 住所の入力 = {
  姓?: string; 名?: string; 都道府県?: string; 国?: string; 海外郵便番号?: string; 住所1?: string; 住所2?: string; 電話?: [string, string, string];
  /** 住所3（国外の住所で使う。M05-10 で足した） */
  住所3?: string;
};

/** 受注情報編集画面の注文者情報（"order"）・お届け先情報（"order_Shipping"）の欄に入れる。折りたたみを開いてから */
export async function 住所を入れる(page: Page, 欄: "注文者" | "お届け先", v: 住所の入力): Promise<void> {
  const p = 欄 === "注文者" ? "order" : "order_Shipping";
  const toggle = page.locator(`a[href="#${欄 === "注文者" ? "ordererInfo" : "shippingInfo"}"]`).first();
  const first = page.locator(`#${p}_name_name01`);
  if (!(await first.isVisible().catch(() => false)) && (await toggle.count())) await toggle.click({ timeout: 20_000 });
  await expect(first, `${欄}の姓の欄`).toBeVisible({ timeout: 20_000 });
  if (v.姓 !== undefined) await page.locator(`#${p}_name_name01`).fill(v.姓);
  if (v.名 !== undefined) await page.locator(`#${p}_name_name02`).fill(v.名);
  if (v.国 !== undefined) await page.locator(`#${p}_Country`).selectOption({ label: v.国 }, { timeout: 20_000 });
  if (v.都道府県 !== undefined) await page.locator(`#${p}_address_pref`).selectOption({ label: v.都道府県 }, { timeout: 20_000 });
  if (v.海外郵便番号 !== undefined) await page.locator(`#${p}_abroad_postal_code`).fill(v.海外郵便番号);
  if (v.住所1 !== undefined) await page.locator(`#${p}_address_addr01`).fill(v.住所1);
  if (v.住所2 !== undefined) await page.locator(`#${p}_address_addr02`).fill(v.住所2);
  if (v.住所3 !== undefined) await page.locator(`#${p}_address_addr03`).fill(v.住所3);
  if (v.電話) {
    await page.locator(`#${p}_tel_tel01`).fill(v.電話[0]);
    await page.locator(`#${p}_tel_tel02`).fill(v.電話[1]);
    await page.locator(`#${p}_tel_tel03`).fill(v.電話[2]);
  }
}

/**
 * 商品登録編集画面で商品名(日)を変えて「商品を登録」を押す（受注明細の商品名は注文時のまま残る）。
 * 必須で未選択の選択欄（割引率など）は先頭の選択肢を選ぶ（正本: 販売割引率に登録済みの割引率）。
 */
export async function 商品名を変える(page: Page, 商品ID: string, 名前: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await form.locator('input[name="admin_product[name]"]').fill(名前);
  const requiredRows = form.locator(".row").filter({ has: page.locator(":scope > .col-3 .badge", { hasText: "必須" }) });
  for (const r of await requiredRows.all()) {
    const label = ((await r.locator(":scope > .col-3 span").first().textContent()) ?? "").trim();
    for (const select of await r.locator(":scope > .col select").all()) {
      if (await select.inputValue()) continue;
      const options = await select.locator("option").evaluateAll((nodes) => nodes
        .map((n) => ({ value: (n as HTMLOptionElement).value, label: n.textContent?.trim() ?? "" })).filter((o) => o.value !== ""));
      if (options.length === 0) throw new Error(`必須の「${label}」に選べる値が無い`);
      await select.selectOption(options[0].value);
      onIssue(`商品登録編集で、必須で未選択の「${label}」に「${options[0].label}」を選んだ`);
    }
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click()]);
  await page.waitForLoadState("load");
  await expect(form.locator('input[name="admin_product[name]"]'), "登録後の商品名(日)").toHaveValue(名前, { timeout: 30_000 });
}

/** 店舗基本設定の「適格請求書発行事業者登録番号」を入れて登録する（全員が使う共有の設定。呼ぶ側が元の値へ戻す） */
export async function 登録番号を設定する(page: Page, 値: string): Promise<void> {
  await page.goto(adminUrl("/setting/shop"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const box = page.locator('[name="shop_master[invoice_registration_number]"]');
  await expect(box, "店舗基本設定の適格請求書発行事業者登録番号の欄").toBeVisible({ timeout: 30_000 });
  await box.fill(値);
  await Promise.all([page.waitForLoadState("load"), page.locator("form#point_form button[type=submit]").first().click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
  await expect(page.locator('[name="shop_master[invoice_registration_number]"]'), "登録後の適格請求書発行事業者登録番号").toHaveValue(値, { timeout: 30_000 });
}

/**
 * 受注情報編集の画面で、配送方法を選ぶ。既存の受注を開くと「出荷情報」の欄（#shippingInfo）が畳まれて出るので、開いてから選ぶ
 * （新アプリの edit.twig: collapse {{ id ? '' : 'show' }}。2026-11-11 の M05-09 で選択欄が見えずに止まった）。
 */
export async function 配送方法を選ぶ(page: Page, 名前: string): Promise<void> {
  await 出荷情報の欄を開く(page);
  const sel = page.locator("#order_Shipping_Delivery");
  await expect(sel, "配送方法の選択欄").toBeVisible({ timeout: 10_000 });
  await sel.selectOption({ label: 名前 }, { timeout: 20_000 });
}
