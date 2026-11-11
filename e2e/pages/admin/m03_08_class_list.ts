/**
 * M03-08 商品規格一覧の画面の読み取りと操作。セレクタはここだけに書く。正本: cases/M03-08_test_cases.tsv
 * 画面の作り（アプリのテンプレート）: 上に商品名と「新規作成」、該当件数（「検索結果：N件が該当しました」）、廃止でない規格の表、
 * その下に「廃止規格一覧」の見出しと「▼」（折りたたみ）、廃止の規格の表、画面の下に「商品登録」（商品登録編集画面へ戻るリンク）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;

/** 廃止でない規格の表の1行（列は 公開ステータス・言語・状態・スマレジ連携フラグ・商品コード・在庫数・販売制限数・基準価格・販売価格・買取価格） */
export type 稼働中の行 = { 商品規格ID: string; 公開ステータス: string; 言語: string; 状態: string; スマレジ連携: string; 商品コード: string; 在庫数: string; 販売制限数: string; 基準価格: string; 販売価格: string; 買取価格: string };
/** 廃止規格一覧の1行（列は 言語・状態・商品コード・在庫数・販売制限数・基準価格・販売価格・買取価格） */
export type 廃止の行 = { 商品規格ID: string; 言語: string; 状態: string; 商品コード: string; 在庫数: string; 販売制限数: string; 基準価格: string; 販売価格: string; 買取価格: string };

const 文 = (t: string | null) => (t ?? "").replace(/\s+/g, " ").trim();

export class M0308ClassListPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  /** 商品IDの商品規格一覧を開き、応答の状態を返す */
  async 開く(商品ID: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/product/product/class/${商品ID}`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 商品規格一覧の画面か（商品名と新規作成の見出しがある） */
  async 一覧の画面か(): Promise<boolean> { return (await this.page.locator("#ex-product_class-header").count()) > 0; }
  async 商品名(): Promise<string> { return 文(await this.page.locator("#ex-product_class-header .card-title").first().textContent()); }
  get 新規作成(): Locator { return this.page.locator('#ex-product_class-header a[href$="/new"]').first(); }

  /** 該当件数の表示（「検索結果：N件が該当しました」の N。読めなければ null）と、その文 */
  async 該当件数(): Promise<{ 件数: number | null; 文: string }> {
    const t = 文(await this.page.getByText(/検索結果：\s*\d+\s*件が該当しました/).first().textContent().catch(() => ""));
    const m = /検索結果：\s*(\d+)\s*件/.exec(t);
    return { 件数: m ? Number(m[1]) : null, 文: t };
  }

  private 稼働中の表の行(): Locator { return this.page.locator("#ex-product_class tbody tr"); }
  private 廃止の表の行(): Locator { return this.page.locator("#abolishedProductClass tbody tr"); }

  async 稼働中の行(): Promise<稼働中の行[]> {
    const out: 稼働中の行[] = [];
    for (const tr of await this.稼働中の表の行().all()) {
      const c = (await tr.locator("td").allTextContents()).map(文);
      out.push({ 商品規格ID: ((await tr.getAttribute("id")) ?? "").replace("ex-product_class-", ""), 公開ステータス: c[0] ?? "", 言語: c[1] ?? "", 状態: c[2] ?? "", スマレジ連携: c[3] ?? "", 商品コード: c[4] ?? "", 在庫数: c[5] ?? "", 販売制限数: c[6] ?? "", 基準価格: c[7] ?? "", 販売価格: c[8] ?? "", 買取価格: c[9] ?? "" });
    }
    return out;
  }
  async 廃止の行(): Promise<廃止の行[]> {
    const out: 廃止の行[] = [];
    for (const tr of await this.廃止の表の行().all()) {
      const c = (await tr.locator("td").allTextContents()).map(文);
      out.push({ 商品規格ID: ((await tr.getAttribute("id")) ?? "").replace("ex-product_class-", ""), 言語: c[0] ?? "", 状態: c[1] ?? "", 商品コード: c[2] ?? "", 在庫数: c[3] ?? "", 販売制限数: c[4] ?? "", 基準価格: c[5] ?? "", 販売価格: c[6] ?? "", 買取価格: c[7] ?? "" });
    }
    return out;
  }
  /** 廃止規格一覧の行のうち、画面に見えている行の数 */
  async 見えている廃止の行の数(): Promise<number> {
    let n = 0;
    for (const tr of await this.廃止の表の行().all()) if (await tr.isVisible()) n++;
    return n;
  }
  /** 廃止規格一覧の「▼」（折りたたみの開閉） */
  get 廃止規格の開閉(): Locator { return this.page.locator('a[href="#abolishedProductClass"]').first(); }
  /** 「▼」を押し、開閉の動きが終わるのを待つ */
  async 廃止規格の開閉を押す(): Promise<void> {
    await expect(this.廃止規格の開閉, "廃止規格一覧の「▼」").toBeVisible();
    await this.廃止規格の開閉.click({ timeout: T });
    await this.page.waitForTimeout(800);
  }
  /** 廃止規格一覧の中身（折りたたみの欄）が開いているか */
  async 廃止規格が開いているか(): Promise<boolean> {
    const body = this.page.locator("#abolishedProductClass");
    if ((await body.count()) === 0) return false;
    return body.evaluate((e) => e.classList.contains("show") && (e as HTMLElement).getBoundingClientRect().height > 1);
  }
  /** 稼働中の表の、商品規格IDの行の「編集」 */
  編集ボタン(商品規格ID: string): Locator {
    return this.page.locator(`#ex-product_class-${商品規格ID}`).getByRole("link", { name: "編集", exact: true });
  }
  /** 画面の下の「商品登録」（商品登録編集画面へ戻るリンク） */
  get 商品登録に戻る(): Locator { return this.page.locator(".c-conversionArea a.c-baseLink").filter({ hasText: /商品登録/ }).first(); }
  /** 「商品規格を初期化」のボタン（無ければ数が0） */
  get 商品規格を初期化(): Locator { return this.page.getByRole("button", { name: "商品規格を初期化" }).or(this.page.getByRole("link", { name: "商品規格を初期化" })); }

  /** 押して画面が移るのを待つ（移らなければ待ち切りで戻る） */
  async 押して移る(l: Locator): Promise<void> {
    await expect(l, "押す要素").toBeVisible();
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => undefined),
      l.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }
}
