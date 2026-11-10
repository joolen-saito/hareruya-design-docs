/**
 * M05-11 受注情報編集の続き（-o）の画面操作。既存の pages/admin/m05_11_order_edit.ts は変えず、足りない操作だけをここに足す。
 * セレクタはここだけに書く。正本: cases/M05-11_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

/** 受注情報編集の折りたたみの欄（注文者情報・お支払情報・お届け先情報・ポイント連携エラー） */
export const 折りたたみの欄 = { 注文者情報: "ordererInfo", お支払情報: "paymentInfo", お届け先情報: "shippingInfo", ポイント連携エラー: "pointErrorMessage" } as const;
export type 欄の名前 = keyof typeof 折りたたみの欄;

export class OrderEditMore {
  constructor(readonly page: Page) {}

  /** 欄の中身が開いているか（折りたたみの中身が見えているか） */
  async 欄が開いているか(欄: 欄の名前): Promise<boolean> {
    const body = this.page.locator(`#${折りたたみの欄[欄]}`);
    await this.page.waitForTimeout(400);
    return body.evaluate((e) => e.classList.contains("show") && (e as HTMLElement).getBoundingClientRect().height > 1);
  }
  /** 欄のタイトル（右端の開閉の矢印）を押し、開閉の動きが終わるのを待つ */
  async 欄のタイトルを押す(欄: 欄の名前): Promise<void> {
    const toggle = this.page.locator(`a[data-bs-toggle="collapse"][href="#${折りたたみの欄[欄]}"]`).first();
    await expect(toggle, `${欄}の開閉`).toBeVisible();
    await toggle.click({ timeout: 20_000 });
    await this.page.waitForTimeout(600);
  }
  /** 欄のタイトルの行が見えているか */
  async 欄のタイトルが見えているか(欄: 欄の名前): Promise<boolean> {
    return this.page.locator(`a[data-bs-toggle="collapse"][href="#${折りたたみの欄[欄]}"]`).first().isVisible();
  }

  /** お支払情報の発生ポイント・使用ポイント・ポイント付与率、お届け先情報の送り状No.、ポイント連携エラーの値 */
  async ポイントと送り状の値(): Promise<{ 発生: string; 使用: string; 付与率: string; 送り状: string; 連携エラー: string }> {
    const v = async (sel: string) => (await this.page.locator(sel).count()) ? (await this.page.locator(sel).first().inputValue()).trim() : "（欄が無い）";
    return {
      発生: await v("#order_gainedPoints"), 使用: await v("#order_spendedPoints"), 付与率: await v("#order_pointPercentage"),
      送り状: await v("#order_invoiceNumber"),
      連携エラー: ((await this.page.locator("#pointErrorMessage textarea").first().inputValue().catch(() => "（欄が無い）")) ?? "").trim(),
    };
  }

  // ---- 会員の呼び出し ----
  /** 「会員から検索」を押して会員検索のモーダルを開き、語で検索して結果を待つ */
  async 会員を検索する(語: string): Promise<void> {
    await this.page.locator('a[data-bs-target="#searchCustomerModal"]').first().click({ timeout: 20_000 });
    const modal = this.page.locator("#searchCustomerModal");
    await expect(modal, "会員検索のモーダル").toBeVisible();
    await modal.locator('input[type="text"], input[type="search"]').first().fill(語, { timeout: 20_000 });
    await modal.locator("#searchCustomerModalButton").click({ timeout: 20_000 });
    await expect(this.決定ボタン(), "会員検索の結果の決定ボタン").not.toHaveCount(0, { timeout: 60_000 });
  }
  /** 会員検索の結果の、会員IDの「決定」（追加）ボタン */
  決定ボタン(会員ID?: string): Locator {
    return this.page.locator(会員ID ? `#searchCustomerModalList button.set-customer[data-customer="${会員ID}"]` : "#searchCustomerModalList button.set-customer");
  }
  /** 会員IDの決定ボタンを押して会員を呼び出し、注文者情報への反映（会員IDの表示）を待つ */
  async 会員を決定する(会員ID: string): Promise<void> {
    await expect(this.決定ボタン(会員ID), `会員ID ${会員ID} の決定ボタン`).toHaveCount(1);
    await this.決定ボタン(会員ID).click({ timeout: 20_000 });
    await expect(this.page.locator("#order_CustomerId"), "注文者情報の会員ID").toContainText(会員ID, { timeout: 30_000 });
    await this.page.waitForTimeout(500);
  }
  /** 決定ボタンが送る会員IDを書き換える（開発者ツールの代わり） */
  async 決定ボタンの会員IDを書き換える(会員ID: string, 新しいID: string): Promise<void> {
    await this.決定ボタン(会員ID).first().evaluate((b, v) => { (b as HTMLElement).dataset.customer = v; }, 新しいID);
  }
  /** 注文者情報の欄の値（姓・名・郵便番号・都道府県・住所1・住所2・メール・電話） */
  async 注文者情報の値(): Promise<Record<string, string>> {
    const ids: Record<string, string> = {
      姓: "#order_name_name01", 名: "#order_name_name02", 郵便番号1: "#order_postalCode_postalCode01", 郵便番号2: "#order_postalCode_postalCode02",
      都道府県: "#order_address_pref", 住所1: "#order_address_addr01", 住所2: "#order_address_addr02", メール: "#order_email",
      電話1: "#order_tel_tel01", 電話2: "#order_tel_tel02", 電話3: "#order_tel_tel03",
    };
    const out: Record<string, string> = {};
    for (const [k, sel] of Object.entries(ids)) {
      const l = this.page.locator(sel).first();
      if (!(await l.count())) { out[k] = "（欄が無い）"; continue; }
      out[k] = k === "都道府県" ? ((await l.locator("option:checked").textContent().catch(() => "")) ?? "").trim() : (await l.inputValue()).trim();
    }
    return out;
  }
  /** 注文者情報の「最終注文日」「累計注文金額」の表示 */
  async 購入の表示(): Promise<{ 最終注文日: string; 累計注文金額: string }> {
    const val = async (label: string) => {
      const row = this.page.locator("#ordererInfo .row").filter({ has: this.page.locator("label", { hasText: new RegExp(`^\\s*${label}\\s*$`) }) }).first();
      if (!(await row.count())) return "（項目が無い）";
      return ((await row.locator(".col").first().textContent()) ?? "").replace(/\s+/g, " ").trim();
    };
    return { 最終注文日: await val("最終注文日"), 累計注文金額: await val("累計注文金額") };
  }

  // ---- 履歴の画面 ----
  /** 更新のボタン（「受注情報を登録」「受注ステータスを変更」など）の数 */
  async 更新ボタンの数(): Promise<number> {
    return this.page.locator('button[type="submit"]:visible:not([disabled]), button.change-status:visible:not([disabled])').count();
  }
  /** 本文の中の押せるリンクの数（ヘッダ・サイドの共通の導線は除く） */
  async 本文のリンクの数(): Promise<number> {
    return this.page.locator("#form1 a[href]:visible").evaluateAll((as) => as.filter((a) => !(a as HTMLAnchorElement).getAttribute("href")!.startsWith("#") && !a.closest(".pointer-events-none")).length);
  }
  async 受注データ更新履歴の数(): Promise<number> { return this.page.locator("#orderEditHistory").count(); }
  /** 入力できる欄（disabled・readonly でない入力・選択）の数（注文者・お支払・お届け先の欄の中） */
  async 入力できる欄の数(): Promise<number> {
    return this.page.locator("#ordererInfo, #paymentInfo, #shippingInfo").locator("input:not([type=hidden]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])").count();
  }

  // ---- 欠品・空にする ----
  /** 先頭の明細の「欠品登録」を押す */
  async 欠品登録を押す(onDialog: (m: string) => void): Promise<void> {
    const btn = this.page.locator("#table-form-field tr.item_box button.btn-stockout").first();
    await expect(btn, "明細の欠品登録").toBeVisible();
    const h = (d: import("@playwright/test").Dialog) => { onDialog(d.message()); d.accept().catch(() => undefined); };
    this.page.on("dialog", h);
    try { await btn.click({ timeout: 20_000 }); await this.page.waitForTimeout(800); } finally { this.page.off("dialog", h); }
  }
  /** 欄を空にする（入力欄は空文字、選択は空の選択肢。空の選択肢が無ければ値を空にする）。空にできなかった欄の名前を返す */
  async 空にする(sels: string[]): Promise<string[]> {
    const ng: string[] = [];
    for (const sel of sels) {
      const l = this.page.locator(sel);
      const n = await l.count();
      if (n === 0) { ng.push(sel); continue; }
      for (let i = 0; i < n; i++) {
        await l.nth(i).evaluate((e) => {
          if (e instanceof HTMLSelectElement) {
            const empty = Array.from(e.options).find((o) => o.value === "");
            if (empty) e.value = ""; else { e.selectedIndex = -1; }
          } else (e as HTMLInputElement).value = "";
          e.dispatchEvent(new Event("input", { bubbles: true }));
          e.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }
    }
    return ng;
  }
  /** 変更後お届け時間の選択肢の文字 */
  async お届け時間の選択肢(): Promise<string[]> {
    return (await this.page.locator("#order_Shipping_DeliveryTime option").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /** 変更後配送方法を選ぶ（画面のスクリプトが変更後お届け時間を入れ替える） */
  async 配送方法を選ぶ(名前: string): Promise<void> {
    await this.page.locator("#order_Shipping_Delivery").selectOption({ label: 名前 }, { timeout: 20_000 });
    await this.page.waitForTimeout(1500);
  }
  /** 受注IDの受注情報編集画面を直接開く。応答の状態を返す */
  async 受注IDで開く(受注ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/order/${受注ID}/edit`));
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 画面のエラーの表示（警告の帯・入力欄のエラー） */
  async エラーの文(): Promise<string[]> {
    return (await this.page.locator(".alert-danger:visible, .invalid-feedback:visible, .form-error-message:visible, .text-danger:visible").allTextContents())
      .map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  // ---- 日付のクリア ----
  /** 日付の「クリア」ボタン（ピック中=confirm_date・入金日=payment_date・出荷指示日=commit_date・出荷日=shipping_date・キャンセル日=cancel_date・店頭予約日=otc_rsv_date） */
  クリアボタン(列: string): Locator { return this.page.locator(`button.clear-date[data-target="${列}"]`).first(); }
  /** 「クリア」を押し、画面の読み込み直しを待つ。読み込み直したか（画面の移動があったか）を返す */
  async クリアを押す(列: string, onDialog: (m: string) => void): Promise<boolean> {
    const b = this.クリアボタン(列);
    await expect(b, `「クリア」（${列}）`).toBeVisible();
    const h = (d: import("@playwright/test").Dialog) => { onDialog(d.message()); d.accept().catch(() => undefined); };
    this.page.on("dialog", h);
    try {
      const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).then(() => true).catch(() => false);
      await b.click({ timeout: 20_000 });
      const moved = await nav;
      await this.page.waitForLoadState("load");
      return moved;
    } finally { this.page.off("dialog", h); }
  }
}
