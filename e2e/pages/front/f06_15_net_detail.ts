/**
 * F06-15 買取履歴詳細（フロントのマイページ）の操作と読み取り。アドレス・セレクタはここだけに書く。正本: cases/F06-15_test_cases.tsv
 *
 * 画面の作り（アプリのテンプレート Mypage/purchase_history_detail*.twig と翻訳ファイルで確かめた）:
 * - 基本情報は見出し（dt）と値（dd）の組。見出しの表示名は「買取番号」「店舗」「依頼日」「査定日」「承諾日」「振込日」「買取の承諾方法」「処理状態」
 *   「査定金額合計」「査定承諾金額合計」（ネット買取）、店頭買取は「買取番号」「店舗」「依頼日」「成立日」「処理状態」「査定金額合計」。
 * - 処理状態は「受付完了」「査定中」「査定完了」「振込待ち」「買取完了」「キャンセル」のラベル。
 * - 「承諾する」ボタン（承諾確定）は査定内容連絡済みのときだけ、明細の上と下に1つずつ出る。押すと同じ買取の詳細へ戻り、成功の帯が出る。
 * - 明細の行は商品名（商品規格が特定できればネット買取商品詳細への別ウィンドウのリンク）・言語・状態・申込時買取価格・査定価格・数量・小計・売却の選択。
 *   査定価格が未確定の行は査定価格欄に「査定中」。金額は「¥1,000」の形。
 * - 売却の選択は「売却する」「売却しない」。査定内容連絡済み以外は選択欄が無効（disabled）。切り替えると「売却しない N件」の数が変わる。
 * - まとめて買取の一覧（見出し「まとめて買取」）と500円未満カードの欄・「500円未満のカードをすべて売却する」チェックは、まとめて買取の明細があるときだけ出る。
 * - 画面の下に「マイページへ戻る」ボタン。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
/** 金額・数量の表示から数字だけを取り出す（「¥1,200」→「1200」）。数字が無ければ表示のまま（「査定中」など） */
export const 数値 = (s: string): string => (/\d/.test(s) ? s.replace(/[^\d]/g, "") : s);

/** ネット買取の買取番号の表示（買取の番号を7桁に0埋め） */
export const 買取番号の表示 = (番号: string): string => String(Number(番号)).padStart(7, "0");

export type 明細の値 = {
  商品名: string; リンク: boolean; 言語: string; 状態: string; 申込時買取価格: string; 査定価格: string; 数量: string; 小計: string;
  売却の選択がある: boolean; 売却: string; 売却を変更できる: boolean;
};

export class NetDetailPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  /** 買取履歴詳細のアドレス（番号が undefined なら番号を付けない）を開く。応答の状態を返す */
  async 開く(番号?: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/mypage/purchase_history/net/${番号 ?? ""}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 詳細画面である(): Promise<boolean> { return (await this.page.getByRole("heading", { name: /買取履歴詳細/ }).count()) > 0; }

  // ---- 買取履歴一覧 ----

  async 一覧を開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/purchase_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** 一覧の買取番号のリンク（表示の文と完全に一致するもの） */
  一覧の番号リンク(表示: string): Locator {
    return this.page.locator(".p-hareruya-history-list__box a.c-hareruya-link").filter({ hasText: new RegExp(`^\\s*${表示.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
  }
  /** 一覧に出ている買取番号の表示（上から順） */
  async 一覧の番号(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-history-list__box a.c-hareruya-link").allInnerTexts()).map(norm);
  }
  /** 一覧の買取番号のリンクの宛先にある番号（ネット買取・店頭買取の別と番号） */
  async 一覧のリンクの宛先(表示: string): Promise<{ 種類: "net" | "otc"; 番号: string }> {
    const href = (await this.一覧の番号リンク(表示).first().getAttribute("href", { timeout: T })) ?? "";
    const m = /\/purchase_history\/(net|otc)\/(\d+)/.exec(href);
    if (!m) throw new Error(`買取履歴一覧の買取番号「${表示}」のリンクの宛先を読めない（${href}）`);
    return { 種類: m[1] as "net" | "otc", 番号: m[2] };
  }
  /** 一覧の買取番号のリンクを押して、買取履歴詳細を開く */
  async 一覧の番号を押す(表示: string): Promise<void> {
    const link = this.一覧の番号リンク(表示).first();
    await link.waitFor({ state: "visible", timeout: T });
    await link.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await Promise.all([this.page.waitForURL(/\/mypage\/purchase_history\/(net|otc)\/\d+/, { timeout: 60_000 }), link.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  /** 買取履歴一覧を開き、買取番号のリンクを押して詳細を開く */
  async 一覧から開く(表示: string): Promise<void> {
    await this.一覧を開く();
    await this.一覧の番号を押す(表示);
  }

  // ---- 基本情報 ----

  /** 基本情報の見出し（表示の順） */
  async 見出し(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-history-detail__order-info dt").allInnerTexts()).map(norm);
  }
  /** 基本情報の見出しの値（見出しが無ければ null） */
  async 値(見出し: string): Promise<string | null> {
    const rows = this.page.locator(".p-hareruya-history-detail__order-info-row").filter({ has: this.page.locator("dt", { hasText: new RegExp(`^\\s*${見出し}\\s*$`) }) });
    if ((await rows.count()) === 0) return null;
    return norm(await rows.first().locator("dd").innerText({ timeout: T }));
  }
  async 会員名(): Promise<string> {
    const l = this.page.locator(".p-hareruya-history-detail__member-name");
    return (await l.count()) ? norm(await l.first().innerText({ timeout: T })) : "";
  }
  /** 画面上部の成功の帯の文 */
  async 成功の帯(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-history-detail__flash .alert-success").allInnerTexts()).map(norm).filter(Boolean);
  }

  // ---- 承諾確定 ----

  get 承諾ボタン(): Locator {
    return this.page.locator("form#purchase-history-net-consent-form button[type=submit]").filter({ hasText: "承諾する" });
  }
  async 承諾ボタンの数(): Promise<number> { return this.承諾ボタン.count(); }
  /** 「承諾する」（明細の上のもの）を押し、移った画面の読み込みを待つ */
  async 承諾する(): Promise<void> {
    const b = this.承諾ボタン.first();
    await b.waitFor({ state: "visible", timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), b.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }

  // ---- 明細 ----

  /** 件数の表示（「件数 N件」） */
  async 件数の表示(): Promise<string> {
    const l = this.page.locator(".p-hareruya-history-detail__table .p-hareruya-toolbar__count p").first();
    return (await l.count()) ? norm(await l.innerText({ timeout: T })) : "";
  }
  get 売却しない件数の欄(): Locator { return this.page.locator("#purchase-history-decline-summary"); }
  /** 売却しない件数（「売却しない N件」の N）。欄が無ければ null */
  async 売却しない件数(): Promise<string | null> {
    if ((await this.売却しない件数の欄.count()) === 0) return null;
    const t = norm(await this.売却しない件数の欄.innerText({ timeout: T }));
    const m = /売却しない\s*(\d+)\s*件/.exec(t);
    return m ? m[1] : t;
  }

  /** 商品名の明細の行 */
  明細の行(商品名: string): Locator {
    return this.page.locator(".p-hareruya-purchase-list__row").filter({ has: this.page.locator(".p-hareruya-purchase-list__name-text", { hasText: new RegExp(`^\\s*${商品名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) }).first();
  }
  async 明細の数(商品名: string): Promise<number> {
    return this.page.locator(".p-hareruya-purchase-list__row").filter({ has: this.page.locator(".p-hareruya-purchase-list__name-text", { hasText: 商品名 }) }).count();
  }
  /** 明細の行の値（金額・数量は表示の文のまま。数値は 数値() で取り出す） */
  async 明細(商品名: string): Promise<明細の値> {
    const row = this.明細の行(商品名);
    await row.waitFor({ state: "attached", timeout: T });
    const v = await row.evaluate((r) => {
      const t = (sel: string) => (r.querySelector(sel)?.textContent ?? "").replace(/\s+/g, " ").trim();
      const s = r.querySelector("select.js-purchase-history-sale-select") as HTMLSelectElement | null;
      return {
        商品名: t(".p-hareruya-purchase-list__name-text"),
        リンク: !!r.querySelector("a.p-hareruya-purchase-list__link"),
        言語: t(".p-hareruya-purchase-list__col-language .p-hareruya-purchase-list__value"),
        状態: t(".p-hareruya-purchase-list__col-condition .p-hareruya-purchase-list__value"),
        申込時買取価格: t(".p-hareruya-purchase-list__col-original-price .p-hareruya-purchase-list__value"),
        査定価格: t(".p-hareruya-purchase-list__col-assessment-price .p-hareruya-purchase-list__value"),
        数量: t(".p-hareruya-purchase-list__col-quantity .p-hareruya-purchase-list__value"),
        小計: t(".p-hareruya-purchase-list__col-total .p-hareruya-purchase-list__value"),
        売却の選択がある: !!s,
        売却: s ? (s.selectedOptions[0]?.textContent ?? "").trim() : "",
        売却を変更できる: !!s && !s.disabled,
      };
    });
    return v;
  }
  売却の選択(商品名: string): Locator { return this.明細の行(商品名).locator("select.js-purchase-history-sale-select"); }
  /** 売却の選択を開く（押す）。選択肢の表示名と、操作できるか（無効でないか）を返す */
  async 売却の選択を開く(商品名: string): Promise<{ 選択肢: string[]; 操作できる: boolean }> {
    const s = this.売却の選択(商品名);
    await s.waitFor({ state: "visible", timeout: T });
    const 操作できる = await s.isEnabled();
    if (操作できる) await s.click({ timeout: T });
    else await s.click({ timeout: 3_000, force: true }).catch(() => undefined);
    const 選択肢 = (await s.locator("option").allInnerTexts()).map(norm).filter(Boolean);
    return { 選択肢, 操作できる };
  }
  /** 売却の選択を表示名で切り替えようとする。切り替えられたか（無効なら切り替えない）と、そのあとの選択を返す */
  async 売却を切り替える(商品名: string, 表示: "売却する" | "売却しない"): Promise<{ 切り替えた: boolean; 選択: string }> {
    const s = this.売却の選択(商品名);
    await s.waitFor({ state: "visible", timeout: T });
    let 切り替えた = false;
    if (await s.isEnabled()) {
      await s.selectOption({ label: 表示 }, { timeout: T });
      切り替えた = true;
    } else {
      // 利用者の操作（押して選ぼうとする）。無効の選択欄は開かない
      await s.click({ timeout: 3_000, force: true }).catch(() => undefined);
    }
    const 選択 = norm(await s.locator("option:checked").innerText({ timeout: T }));
    return { 切り替えた, 選択 };
  }
  /** 明細の商品名を押す。別ウィンドウが開けばそのページを、開かなければ null を返す */
  async 商品名を押す(商品名: string): Promise<Page | null> {
    const row = this.明細の行(商品名);
    const target = row.locator(".p-hareruya-purchase-list__name-text").first();
    await target.waitFor({ state: "visible", timeout: T });
    const popup = this.page.context().waitForEvent("page", { timeout: 10_000 }).catch(() => null);
    await target.click({ timeout: T });
    const p = await popup;
    if (p) await p.waitForLoadState("load").catch(() => undefined);
    return p;
  }

  // ---- まとめて買取 ----

  get まとめて買取の一覧(): Locator { return this.page.locator("#matomete_list"); }
  get 少額カードの欄(): Locator { return this.page.locator(".p-hareruya-purchase-list__item--bundle-under"); }
  get 少額カードをすべて売却するチェック(): Locator { return this.page.locator("#purchase-bulk-low-agree"); }
  /** 申込時買取価格の欄（ネット買取の明細だけにある） */
  get 申込時買取価格の欄(): Locator { return this.page.locator(".p-hareruya-purchase-list__col-original-price"); }
  /** 売却する/しないの選択（すべて） */
  get 売却の選択すべて(): Locator { return this.page.locator("select.js-purchase-history-sale-select"); }
  /** 500円未満カードの欄の「こちら」リンク（まとめて買取の全件の画面へ） */
  get 少額カードのこちらのリンク(): Locator { return this.少額カードの欄.locator("a.p-hareruya-text-link"); }

  /** 500円未満カードの欄の行（価格帯の表示・数量・小計。金額は数値だけにする） */
  async 少額カードの行(): Promise<{ 価格帯: string; 数量: string; 小計: string }[]> {
    const rows = this.少額カードの欄.locator(".p-hareruya-purchase-list__row");
    await this.少額カードの欄.first().waitFor({ state: "attached", timeout: T });
    return rows.evaluateAll((els) => els.map((r) => {
      const t = (sel: string) => (r.querySelector(sel)?.textContent ?? "").replace(/\s+/g, " ").trim();
      return {
        価格帯: t(".p-hareruya-purchase-list__col-assessment-price .p-hareruya-purchase-list__value"),
        数量: t(".p-hareruya-purchase-list__col-quantity .p-hareruya-purchase-list__value"),
        小計: t(".p-hareruya-purchase-list__col-total .p-hareruya-purchase-list__value"),
      };
    }));
  }
  /** 「500円未満のカードをすべて売却する」チェックの状態（無ければ ある: false） */
  async 少額チェックの状態(): Promise<{ ある: boolean; チェック済み: boolean; 有効: boolean }> {
    const c = this.少額カードをすべて売却するチェック;
    if ((await c.count()) === 0) return { ある: false, チェック済み: false, 有効: false };
    return { ある: true, チェック済み: await c.isChecked(), 有効: await c.isEnabled() };
  }
  /** 「500円未満のカードをすべて売却する」チェックを入れる（入れられなければ false） */
  async 少額チェックを入れる(): Promise<boolean> {
    const c = this.少額カードをすべて売却するチェック;
    await c.scrollIntoViewIfNeeded();
    if (!(await c.isEnabled())) return false;
    await c.check({ timeout: T });
    return c.isChecked();
  }

  // ---- 遷移 ----

  /** 「マイページへ戻る」を押す */
  async マイページへ戻るを押す(): Promise<void> {
    const b = this.page.locator(".p-hareruya-history-detail__btn a").first();
    await b.waitFor({ state: "visible", timeout: T });
    await b.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), b.click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async 再読み込みする(): Promise<void> {
    await this.page.reload({ timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
}
