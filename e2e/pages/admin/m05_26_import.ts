/** M05-26 出荷実績インポート登録の画面（メニュー「受注管理」→「出荷実績登録CSVアップロード」） */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class ShippingResultImportPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/order/shipping_result_csv/import"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "出荷実績インポート登録画面の応答").toBeLessThan(400);
  }

  /** 「ファイルを選択」ボタンを押し、開いたファイル選択ダイアログ（のうち、取り込みの入力）を返す。開かなければ null */
  async ファイルを選択を押す(): Promise<{ 開いた: boolean; 複数選択: boolean | null; 受け付ける形式: string | null }> {
    const button = this.page.locator("#file-select");
    await expect(button, "「ファイルを選択」ボタン").toBeVisible();
    const chooser = this.page.waitForEvent("filechooser", { timeout: 10_000 }).then((c) => c, () => null);
    await button.click();
    const c = await chooser;
    if (!c) return { 開いた: false, 複数選択: null, 受け付ける形式: null };
    return { 開いた: true, 複数選択: c.isMultiple(), 受け付ける形式: await this.page.locator("#admin_csv_import_import_file").getAttribute("accept") };
  }

  /** 画面の「出荷実績登録CSVファイルフォーマット」の表の見出し（CSVの項目名。画面に出ている順） */
  async 形式の見出し(): Promise<string[]> {
    const ths = this.page.locator("#file_format_box__header th");
    await expect(ths.first(), "CSVファイルフォーマットの表の見出し").toBeVisible();
    return (await ths.allInnerTexts()).map((t) => t.trim());
  }

  /**
   * ファイルを選び、「CSVファイルのアップロード」ボタンを押す。要求の応答のあと、再表示された画面の結果の表示を返す。
   * 完了のメッセージ（緑の帯）、エラー（赤い帯・欄のエラー）の文を集める。開発用の設定の帯は数えない。
   */
  async アップロードする(file: { 名前: string; 中身: Buffer }): Promise<アップロード結果> {
    await this.page.locator("#admin_csv_import_import_file").setInputFiles({ name: file.名前, mimeType: file.名前.endsWith(".tsv") ? "text/tsv" : "text/csv", buffer: file.中身 });
    await expect(this.page.locator("#admin_csv_import_import_file_name"), "選んだファイル名の表示").toHaveText(file.名前).catch(() => undefined);
    const posted = this.page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/order/shipping_result_csv/import"), { timeout: 120_000 });
    await this.page.locator("#upload-button").click();
    const res = await posted;
    await this.page.waitForLoadState("load");
    return this.結果を読む(res.status());
  }

  async 結果を読む(応答?: number): Promise<アップロード結果> {
    const ok = this.page.locator(".alert-success");
    const ng = this.page.locator(".alert-danger, .invalid-feedback, .form-error-message, .text-danger")
      .filter({ hasNotText: "デバッグモードが有効になっています" });
    // 結果の帯が出るのを待つ（保存待ち）。どちらも出ないまま再表示されることもあるので、短く待つだけにする
    await ok.or(ng).first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    const texts = async (l: Locator) => {
      const out: string[] = [];
      for (const e of await l.all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
      return [...new Set(out.filter(Boolean))];
    };
    return {
      応答: 応答 ?? 0,
      完了: await texts(ok),
      エラー: await texts(ng),
      取込画面: /\/order\/shipping_result_csv\/import(\?.*)?$/.test(this.page.url()),
      システムエラー: (await this.page.getByText("システムエラーが発生しました").count()) > 0,
    };
  }
}

export type アップロード結果 = { 応答: number; 完了: string[]; エラー: string[]; 取込画面: boolean; システムエラー: boolean };

/** 取り込むファイルの中身を作る（見出し行と、データ行を区切り文字でつなぐ。文字コードは UTF-8、改行は LF） */
export function 取込ファイル(名前: string, 行: string[][], opt: { 区切り?: string; 文字コード?: "utf-8" | "sjis"; 末尾改行?: boolean } = {}): { 名前: string; 中身: Buffer } {
  const sep = opt.区切り ?? (名前.endsWith(".tsv") ? "\t" : ",");
  const text = 行.map((r) => r.join(sep)).join("\n") + (opt.末尾改行 === false ? "" : "\n");
  return { 名前, 中身: opt.文字コード === "sjis" ? Buffer.from(新しいSJIS(text)) : Buffer.from(text, "utf-8") };
}

/** Shift_JIS で書ける文字（CSV の見出し語）と、そのバイト列。ほかの日本語は使わない（ASCII はそのまま） */
const SJIS見出し: [string, string][] = [["注文番号", "928d95b694d48d86"], ["出荷日", "8f6f89d793fa"], ["送り状No.", "919782e88ff34e6f2e"]];

/** Shift_JIS のバイト列にする（見出し語と ASCII だけ。Node に Shift_JIS の符号化が無いため） */
function 新しいSJIS(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length;) {
    const hit = SJIS見出し.find(([w]) => text.startsWith(w, i));
    if (hit) { for (const b of Buffer.from(hit[1], "hex")) out.push(b); i += hit[0].length; continue; }
    const c = text.charCodeAt(i);
    if (c > 0x7f) throw new Error(`Shift_JIS に変換できない文字: ${text[i]}`);
    out.push(c); i++;
  }
  return Uint8Array.from(out);
}

/** 受注情報編集画面の出荷日（先頭の配送の出荷日）の表示 */
export async function 受注編集の出荷日(page: Page): Promise<string> {
  const row = page.locator("div.row.mb-3").filter({ has: page.locator("div.col-3", { hasText: /^\s*出荷日\s*$/ }) });
  await expect(row.first(), "受注情報編集画面の出荷日の行").toBeVisible();
  return ((await row.first().locator("div.col").first().innerText()) ?? "").replace(/\s+/g, " ").trim();
}

/** 会員検索一覧から会員登録編集画面を開き、「ポイント確認」でポイント履歴確認画面の一覧を読む */
export class 会員のポイント履歴Page {
  constructor(private readonly page: Page) {}

  /** 会員検索一覧(検索入力)で「会員ID・メールアドレス・お名前」に会員IDを入れて検索し、結果の会員名を押して会員登録編集画面を開く */
  async 検索して編集画面を開く(会員ID: string): Promise<void> {
    await this.page.goto(adminUrl("/customer"));
    await this.page.waitForLoadState("load");
    await this.page.locator('[name="admin_search_customer[multi]"]').fill(会員ID);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click(),
    ]);
    await this.page.waitForLoadState("load");
    const link = this.page.locator(`tr#ex-customer-${会員ID} td:nth-child(3) a`);
    await expect(link, `会員ID ${会員ID} の会員名`).toBeVisible();
    await Promise.all([this.page.waitForURL(new RegExp(`/customer/${会員ID}/edit`)), link.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 会員登録編集画面の「ポイント確認」を押し、ポイント履歴確認画面の一覧の行（注文番号・増減量）を返す */
  async ポイント確認を押す(): Promise<{ 注文番号: string; 増減量: string }[]> {
    await Promise.all([
      this.page.waitForURL(/\/customer\/point\/\d+\/history/),
      this.page.getByRole("link", { name: "ポイント確認" }).first().click(),
    ]);
    await this.page.waitForLoadState("load");
    const rows = this.page.locator("#pointHistory tbody tr");
    const out: { 注文番号: string; 増減量: string }[] = [];
    for (const r of await rows.all()) {
      const tds = await r.locator("td").allInnerTexts();
      out.push({ 注文番号: (tds[2] ?? "").trim(), 増減量: (tds[3] ?? "").trim() });
    }
    return out;
  }
}
