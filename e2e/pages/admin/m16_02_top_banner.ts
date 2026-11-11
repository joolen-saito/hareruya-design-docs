/**
 * M16-02 画像設定（メニュー「データ管理」→「トップバナー管理」。トップバナーの画像の保管と一覧）
 *
 * 画面の作り（アプリのテンプレート・コントローラから）:
 * - 上半分がバナー設定（このテストでは触らない）、下半分（#upload_wrap）が画像のアップロード欄（「店舗」・「画像のアップロード」・「アップロード」）と、
 *   「アップロードした店舗」の切り替え、画像の一覧。
 * - 「アップロードした店舗」は、表示名を押して開く一覧（details の中のリンク）。押すと店舗の店名略称（3文字）で絞った画面へ移る。絞っていないときの表示は「全て」。
 * - 一覧の1行は、1列目に画像と画像のURL、2列目に更新日時、3列目に「画像URLコピー」、4列目に「削除」。画像が無いときは「画像がありません。」の1行だけ。
 * - 削除はブラウザの確認ダイアログで「OK」を押すと送られる。
 * M13-15（イベント管理の画像設定）の部品 m13_15_banner_image.ts と同じ形にした（画面が別なので部品も別）。
 */
import { Locator, Page, Response, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { tamperToken } from "./devtools";

export const 全て = "全て";

export type アップロードの結果 = { 送った: boolean; 応答: number | null; 成功: string[]; エラー: string[]; 行き先: string };

const 正規表現 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class TopBannerPage {
  constructor(readonly page: Page) {}

  get アップロード欄(): Locator { return this.page.locator("#upload_wrap"); }
  get アップロードのフォーム(): Locator { return this.page.locator('form[name="top_banner_upload"]'); }
  get アップロード欄の店舗(): Locator { return this.page.locator('select[name="top_banner_upload[base_info]"]'); }
  get ファイル欄(): Locator { return this.page.locator('input[type=file][name="top_banner_upload[file]"]'); }
  get アップロードボタン(): Locator { return this.アップロード欄.getByRole("button", { name: "アップロード", exact: true }); }
  get 絞り込みの表示(): Locator { return this.アップロード欄.locator(".top-banner-filter__label"); }
  get 絞り込みの一覧(): Locator { return this.アップロード欄.locator(".top-banner-filter__menu"); }
  get 一覧の行(): Locator { return this.アップロード欄.locator("table.top-banner-upload-table tbody tr"); }
  /** 画像のデータ行（画像のURLを持つ行）。「画像がありません。」の行は含まない */
  get 画像の行(): Locator { return this.一覧の行.filter({ has: this.page.locator("td:first-child div.small") }); }
  get 画像なしの行(): Locator { return this.一覧の行.filter({ hasText: /^\s*画像がありません。\s*$/ }); }

  /** 画像設定画面を、アドレスで開く */
  async 開く(): Promise<void> {
    const res = await this.page.goto(adminUrl("/data/top_banner"));
    if (!res || !res.ok()) throw new Error(`画像設定画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.読み込みを待つ();
  }

  /** 画面の読み込みと、一覧（データ行か「画像がありません。」の行）が出たことを待つ */
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.アップロードボタン, "画像設定画面のアップロード欄").toBeVisible({ timeout: 30_000 });
    await expect(this.画像の行.or(this.画像なしの行).first(), "画像の一覧").toBeVisible({ timeout: 30_000 });
  }

  /** いまの画面が画像設定画面か（アドレスとアップロード欄で見る） */
  async 画像設定画面か(): Promise<boolean> {
    if (!/\/data\/top_banner(\/[a-z0-9]+)?\/?$/.test(new URL(this.page.url()).pathname)) return false;
    return this.アップロードボタン.isVisible();
  }

  /** いまのアドレスの、ページ内の位置の印（「#upload_wrap」など。無ければ空） */
  位置の印(): string { return new URL(this.page.url()).hash; }

  /** アップロード欄が画面の見えている範囲にあるか */
  async アップロード欄が見えている(): Promise<boolean> {
    return this.アップロード欄.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
  }

  // ---- アップロード欄 ----

  async アップロード欄の店舗の値(): Promise<string> {
    return (await this.アップロード欄の店舗.locator("option:checked").allInnerTexts()).join("").trim();
  }
  async アップロード欄の店舗を選ぶ(店名: string): Promise<void> { await chooseByLabel(this.アップロード欄の店舗, 店名); }
  async ファイルを選ぶ(file: string): Promise<void> { await this.ファイル欄.setInputFiles(file); }

  /** アップロードのフォームのなりすまし対策トークンを、別の値に変える（開発者ツールで書き換えるのにあたる） */
  async アップロードのトークンを変える(値: string): Promise<void> { await tamperToken(this.アップロードのフォーム, 値); }

  /** 「アップロード」を押し、送った要求の応答と、移った先の画面の成功・エラーの表示を読む */
  async アップロードを押す(): Promise<アップロードの結果> {
    let 送った = false;
    let 応答: number | null = null;
    const 送り先 = /\/data\/top_banner(\/[a-z0-9]+)?\/?(\?.*)?$/;
    const onReq = (r: import("@playwright/test").Request) => { if (r.method() === "POST" && 送り先.test(r.url())) 送った = true; };
    const onRes = (r: Response) => { if (r.request().method() === "POST" && 送り先.test(r.url()) && 応答 === null) 応答 = r.status(); };
    this.page.on("request", onReq);
    this.page.on("response", onRes);
    try {
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined),
        this.アップロードボタン.click(),
      ]);
    } finally {
      this.page.off("request", onReq);
      this.page.off("response", onRes);
    }
    const 文 = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    const 画面 = await this.アップロードボタン.isVisible().catch(() => false);
    return {
      送った, 応答,
      成功: 画面 ? await 文(this.page.locator(".alert-success")) : [],
      エラー: 画面 ? await 文(this.page.locator(".alert-danger, .invalid-feedback, .form-error-message, #top-banner-upload-error")) : [],
      行き先: this.page.url(),
    };
  }

  // ---- アップロードした店舗（絞り込み）と画像の一覧 ----

  async 絞り込みの値(): Promise<string> {
    return ((await this.絞り込みの表示.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /** 「アップロードした店舗」の一覧を開き、表示名がちょうど 名前 のリンクを押す。すでにその表示なら何もしない */
  async 絞り込みを選ぶ(名前: string): Promise<void> {
    if ((await this.絞り込みの値()) === 名前) return;
    await this.絞り込みの表示.click();
    await expect(this.絞り込みの一覧, "「アップロードした店舗」の一覧").toBeVisible();
    const item = this.絞り込みの一覧.locator("a.dropdown-item").filter({ hasText: new RegExp(`^\\s*${正規表現(名前)}\\s*$`) });
    if ((await item.count()) === 0) {
      const have = (await this.絞り込みの一覧.locator("a.dropdown-item").allInnerTexts()).map((t) => t.trim());
      throw new Error(`「アップロードした店舗」に「${名前}」が無い（ある選択肢: ${have.join("、")}。いまの表示: ${await this.絞り込みの値()}）`);
    }
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), item.first().click()]);
    await this.読み込みを待つ();
  }

  /** 一覧の各行に表示された画像のURL（上から順） */
  async 画像のURL(): Promise<string[]> {
    return (await this.画像の行.locator("td:first-child div.small").allInnerTexts()).map((t) => t.trim());
  }

  /** 表示されたURLがちょうど url の行 */
  行(url: string): Locator {
    return this.画像の行.filter({ has: this.page.locator("td:first-child div.small", { hasText: new RegExp(`^\\s*${正規表現(url)}\\s*$`) }) });
  }

  削除リンク(行: Locator): Locator { return 行.getByRole("link", { name: "削除", exact: true }); }

  /** 行の「削除」を押し、確認ダイアログで OK を押して、削除のあとの画面の読み込みを待つ。ダイアログの文を返す（出なければ null） */
  async 削除してOKを押す(行: Locator): Promise<string | null> {
    let message: string | null = null;
    const onDialog = async (d: import("@playwright/test").Dialog) => { message = d.message(); await d.accept(); };
    this.page.once("dialog", onDialog);
    try {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.削除リンク(行).click()]);
    } finally {
      this.page.off("dialog", onDialog);
    }
    await this.読み込みを待つ();
    return message;
  }

  /** 行の更新日時の列の文字 */
  async 更新日時(行: Locator): Promise<string> { return ((await 行.locator("td:nth-child(2)").innerText()) ?? "").replace(/\s+/g, " ").trim(); }

  /** 行の削除リンクの対象ファイル名（アドレスの対象の指定）を、別の値に変える（開発者ツールで書き換えるのにあたる） */
  async 削除の対象を変える(行: Locator, 対象: string): Promise<string> {
    return this.削除リンク(行).evaluate((a, to) => {
      const before = a.getAttribute("href") ?? "";
      const u = new URL(before, location.href);
      u.searchParams.set("select_file", to);
      a.setAttribute("href", u.pathname + u.search);
      return before;
    }, 対象);
  }

  /** 行の削除リンクのなりすまし対策トークンを、別の値に変える（開発者ツールで書き換えるのにあたる） */
  async 削除のトークンを変える(行: Locator, 値: string): Promise<void> {
    await this.削除リンク(行).evaluate((a, v) => a.setAttribute("token-for-anchor", v), 値);
  }

  /**
   * 変えたあとの削除リンクを押し、確認ダイアログで OK を押し、削除の要求への応答のHTTPステータスと、ダイアログの文を返す。
   * 移った先の画面の読み込みは待たない（エラー画面のこともあるため。画面を読むときは 読み込みを待つ を呼ぶ）。
   */
  async 削除を実行する(行: Locator): Promise<{ 応答: number | null; ダイアログ: string | null }> {
    let 応答: number | null = null;
    let ダイアログ: string | null = null;
    const onRes = (r: Response) => { if (r.request().method() === "POST" && /\/data\/top_banner\//.test(r.url()) && 応答 === null) 応答 = r.status(); };
    const onDialog = async (d: import("@playwright/test").Dialog) => { ダイアログ = d.message(); await d.accept(); };
    this.page.on("response", onRes);
    this.page.once("dialog", onDialog);
    try {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined), this.削除リンク(行).click()]);
    } finally {
      this.page.off("response", onRes);
      this.page.off("dialog", onDialog);
    }
    return { 応答, ダイアログ };
  }

}

/**
 * 事前準備: 「アップロードした店舗」を 店名 にして一覧を読み、アップロード欄の店舗を 店名 にして file を送り、増えた画像のURLを返す。
 * シード表の「ストレージシードで画像を置く」（名前を決めたファイルを保管先へ直接置く）は、画面のアップロード（名前は画面が採番する）に読み替える。
 * 増えた画像がちょうど1件でなければ止める。
 */
export async function 準備のアップロード(p: TopBannerPage, 店名: string, file: string): Promise<string> {
  await p.開く();
  await p.絞り込みを選ぶ(店名);
  const 前 = await p.画像のURL();
  await p.アップロード欄の店舗を選ぶ(店名);
  await p.ファイルを選ぶ(file);
  const r = await p.アップロードを押す();
  if (!r.送った) throw new Error(`準備のアップロードで要求が送られない（店舗「${店名}」）`);
  await p.読み込みを待つ();
  const 追加 = (await p.画像のURL()).filter((u) => !前.includes(u));
  if (追加.length !== 1) {
    throw new Error(`準備のアップロードで「${店名}」の一覧に増えた画像が${追加.length}件（1件のはず。成功の表示=${r.成功.join(" / ") || "なし"}／エラーの表示=${r.エラー.join(" / ") || "なし"}／移った先=${r.行き先}）`);
  }
  return 追加[0];
}

/** 画像のURLを新しいタブで開き、応答の状態・種類と、中身の先頭のバイトから見た画像の種別を返す */
export async function 画像のURLを開く(page: Page, url: string): Promise<{ 応答: number | null; 種類: string; 種別: 画像の種別; 開いたタブ: Page }> {
  const tab = await page.context().newPage();
  const res = await tab.goto(url).catch(() => null);
  const body = res ? await res.body().catch(() => Buffer.alloc(0)) : Buffer.alloc(0);
  return { 応答: res?.status() ?? null, 種類: res?.headers()["content-type"] ?? "", 種別: 画像の種別を見る(body), 開いたタブ: tab };
}

export type 画像の種別 = "GIF" | "JPEG" | "PNG" | "画像でない";
export function 画像の種別を見る(b: Buffer): 画像の種別 {
  const head = b.subarray(0, 6).toString("latin1");
  if (head === "GIF87a" || head === "GIF89a") return "GIF";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "JPEG";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "PNG";
  return "画像でない";
}

/** 画像のURLのパス */
export const URLのパス = (url: string): string => decodeURIComponent(new URL(url, "http://x").pathname);
/** 画像のURLの最後の区切り（保管されたファイル名） */
export const ファイル名 = (url: string): string => URLのパス(url).split("/").pop() ?? "";

// ---- 店舗（店舗一覧・店舗編集） ----

const 店舗の欄 = (page: Page, name: string) => page.locator(`[name="mall_tenant_shop_master[${name}]"]`);

/**
 * 店舗一覧で、ID が 店舗ID の行の店名を押して店舗編集画面を開く。一覧に行が無ければ、店舗編集画面をアドレスで開き、false を返す
 * （店舗一覧は親店舗を出さない作りのため）。
 */
export async function 店舗一覧から店舗編集を開く(page: Page, 店舗ID: string): Promise<boolean> {
  await page.goto(adminUrl("/mall/tenant/page/1?page_count=10000"));
  const rows = page.locator("table.table tbody tr");
  for (const row of await rows.all()) {
    if ((await row.locator("td").nth(1).innerText().catch(() => "")).trim() !== 店舗ID) continue;
    const link = row.locator(`a[href$="/mall/tenant/detail/${店舗ID}"]`).first();
    if (!(await link.count())) break;
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    await expect(店舗の欄(page, "shop_name"), `店舗ID ${店舗ID} の店舗編集画面の店名の欄`).toBeVisible();
    return true;
  }
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${店舗ID}`));
  if (!res || !res.ok()) throw new Error(`店舗ID ${店舗ID} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  await expect(店舗の欄(page, "shop_name"), `店舗ID ${店舗ID} の店舗編集画面の店名の欄`).toBeVisible();
  return false;
}

/** 開いている店舗編集画面の、店名と店名略称（3文字） */
export async function 店名と略称を読む(page: Page): Promise<{ 店名: string; 略称: string }> {
  return { 店名: (await 店舗の欄(page, "shop_name").inputValue()).trim(), 略称: (await 店舗の欄(page, "shop_digit").inputValue()).trim() };
}

/** 開いている店舗編集画面で、店名と店名略称（3文字）を入れて「登録」を押す */
export async function 店名と略称を登録する(page: Page, v: { 店名: string; 略称: string }): Promise<void> {
  await 店舗の欄(page, "shop_name").fill(v.店名);
  await 店舗の欄(page, "shop_digit").fill(v.略称);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `店舗「${v.店名}」の店名・店名略称の登録`);
}

/** 店舗編集画面をアドレスで開き、店名と店名略称（3文字）を読む */
export async function 店舗の店名と略称(page: Page, 店舗ID: string): Promise<{ 店名: string; 略称: string }> {
  const res = await page.goto(adminUrl(`/mall/tenant/detail/${店舗ID}`));
  if (!res || !res.ok()) throw new Error(`店舗ID ${店舗ID} の店舗編集画面を開けない（応答 ${res?.status() ?? "なし"}）`);
  await expect(店舗の欄(page, "shop_name"), `店舗ID ${店舗ID} の店舗編集画面の店名の欄`).toBeVisible();
  return 店名と略称を読む(page);
}
