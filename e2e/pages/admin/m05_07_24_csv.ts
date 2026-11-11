/**
 * M05-07 送り状CSV出力・M05-24 出荷実績入力用CSV出力の画面操作。セレクタはここだけに書く。
 * - 送り状CSV: 受注情報検索 一覧(検索結果)で行を選び「送り状CSV」を押すと、選んだ行（配送先）の送り状CSVがダウンロードされる。
 * - 出荷実績入力用CSV: 出荷指示リスト詳細（出荷待ち）画面で受注を選び「出荷実績入力用CSV」を押すと、選んだ受注のCSVがダウンロードされる。
 *   受注を選ばずに押すと、要求の起点の画面（Referer）へ戻り、起点が分からなければ受注一覧へ移る（アプリの作り）。
 * - 受注情報編集の、注文者・お届け先の項目のうち M05-09 の部品（住所を入れる）に無いもの（フリガナ・郵便番号・会社名・注文コメント・送り状No.）を入れる。
 * 正本: cases/M05-07_test_cases.tsv・cases/M05-24_test_cases.tsv
 */
import { Download, expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { OrderListPage } from "./m05_01_order_list_x";
import { PickingPrintPage } from "./m05_21_picking";

export type 受注の追加の項目 = {
  注文者のフリガナ?: [string, string]; 注文者の郵便番号?: string; 注文者の会社名?: string; 注文コメント?: string; 送り状No?: string;
  お届け先のフリガナ?: [string, string]; お届け先の郵便番号?: string; お届け先の会社名?: string;
};

/** 受注情報編集画面（開いた状態）で、追加の項目を入れる。折りたたみを開いてから */
export async function 受注の追加の項目を入れる(page: Page, v: 受注の追加の項目): Promise<void> {
  for (const [href, first] of [["#ordererInfo", "#order_name_name01"], ["#shippingInfo", "#order_Shipping_name_name01"]] as const) {
    if (!(await page.locator(first).isVisible().catch(() => false))) {
      const toggle = page.locator(`a[href="${href}"]`).first();
      if (await toggle.count()) await toggle.click({ timeout: 20_000 });
    }
  }
  const fill = async (sel: string, 値: string, 何: string) => {
    const box = page.locator(sel);
    await expect(box, `受注情報編集の${何}の欄`).toBeVisible({ timeout: 20_000 });
    await box.fill(値);
  };
  const 郵便 = (s: string) => { const d = s.replace(/\D/g, ""); return [d.slice(0, 3), d.slice(3)]; };
  if (v.注文者のフリガナ) { await fill("#order_kana_kana01", v.注文者のフリガナ[0], "注文者のセイ"); await fill("#order_kana_kana02", v.注文者のフリガナ[1], "注文者のメイ"); }
  if (v.注文者の郵便番号) { const [a, b] = 郵便(v.注文者の郵便番号); await fill("#order_postalCode_postalCode01", a, "注文者の郵便番号1"); await fill("#order_postalCode_postalCode02", b, "注文者の郵便番号2"); }
  if (v.注文者の会社名 !== undefined) await fill("#order_company_name", v.注文者の会社名, "注文者の会社名");
  if (v.注文コメント !== undefined) await fill("#order_message", v.注文コメント, "注文コメント");
  if (v.お届け先のフリガナ) { await fill("#order_Shipping_kana_kana01", v.お届け先のフリガナ[0], "お届け先のセイ"); await fill("#order_Shipping_kana_kana02", v.お届け先のフリガナ[1], "お届け先のメイ"); }
  if (v.お届け先の郵便番号) { const [a, b] = 郵便(v.お届け先の郵便番号); await fill("#order_Shipping_postalCode_postalCode01", a, "お届け先の郵便番号1"); await fill("#order_Shipping_postalCode_postalCode02", b, "お届け先の郵便番号2"); }
  if (v.お届け先の会社名 !== undefined) await fill("#order_Shipping_company_name", v.お届け先の会社名, "お届け先の会社名");
  if (v.送り状No !== undefined) await fill("#order_invoiceNumber", v.送り状No, "送り状No.");
}

/** ダウンロードしたファイルのバイト列 */
export async function ダウンロードのバイト列(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/** 押した結果（ダウンロードされたか・移った先） */
export type ダウンロードの結果 = { ファイル名: string | null; バイト列: Buffer | null; 移った先: string; 画面のエラー: string[] };

/** ボタンを押し、ダウンロードか画面の移り変わりを待つ（どちらも無ければ待ち切りで戻る） */
async function 押してダウンロードを待つ(page: Page, sel: string, 何: string, 待つ = 30_000): Promise<ダウンロードの結果> {
  const button = page.locator(sel);
  await expect(button, `${何}ボタン`).toBeVisible({ timeout: 20_000 });
  const before = page.url();
  const dl = page.waitForEvent("download", { timeout: 待つ }).catch(() => null);
  const nav = page.waitForNavigation({ waitUntil: "load", timeout: 待つ }).then(() => true, () => false);
  await button.click();
  // ダウンロードが始まれば画面は移らない。移った（エラーで戻された）ときは、念のため少しだけダウンロードを待つ
  const first = await Promise.race([dl, nav]);
  const download: Download | null = first && typeof first === "object" ? first : await Promise.race([dl, new Promise<null>((r) => setTimeout(() => r(null), 3_000))]);
  await page.waitForLoadState("load").catch(() => undefined);
  const 画面のエラー = (await page.locator(".alert-danger, .alert.alert-danger").allInnerTexts().catch(() => [])).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  return {
    ファイル名: download ? download.suggestedFilename() : null,
    バイト列: download ? await ダウンロードのバイト列(download) : null,
    移った先: page.url() === before ? "" : page.url(),
    画面のエラー,
  };
}

/** 受注情報検索 一覧(検索結果)。送り状CSV */
export class LabelsOrderListPage extends OrderListPage {
  /** 注文者会社名・受注備考の欄 */
  get 注文者会社名の欄() { return this.page.locator("#admin_search_order_multi"); }
  /** 「送り状CSV」を押し、ダウンロードされた送り状CSVを返す */
  async 送り状CSVを押す(): Promise<ダウンロードの結果> {
    return 押してダウンロードを待つ(this.page, "#labelsExport", "送り状CSV");
  }
}

/** 出荷指示リスト詳細（出荷待ち）画面。出荷実績入力用CSV */
export class ResultCsvStandbyPage extends PickingPrintPage {
  /** 一覧の受注の選択をすべて外す（画面は全件が選ばれた状態で開く） */
  async 選択をすべて外す(): Promise<void> {
    const boxes = this.page.locator('#form_bulk input[type="checkbox"][name^="order_ids"]');
    const n = await boxes.count();
    for (let i = 0; i < n; i++) await boxes.nth(i).setChecked(false);
    const all = this.page.locator("#check-all");
    if (await all.count()) await all.setChecked(false);
    for (let i = 0; i < n; i++) await expect(boxes.nth(i), "受注の選択が外れた").not.toBeChecked();
  }
  /** 「出荷実績入力用CSV」を押し、ダウンロードされたCSV（または移った先）を返す */
  async 出荷実績入力用CSVを押す(): Promise<ダウンロードの結果> {
    return 押してダウンロードを待つ(this.page, "#orderExportForInput", "出荷実績入力用CSV");
  }
  /** 出荷実績入力用CSVのフォームの送信先と、受注の選択項目の名前（開発者ツールで見る代わりに、画面のスクリプトの値を読む） */
  async 送信先と選択項目(): Promise<{ 送信先: string; 選択項目: string[] }> {
    const 送信先 = adminUrl("/order/export/order");
    const 選択項目 = await this.page.locator('#form_bulk input[type="checkbox"][name^="order_ids"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name));
    return { 送信先, 選択項目 };
  }
}

/**
 * 開発者ツールの代わりに、出荷実績入力用CSVの送信先へ、Referer ヘッダを付けずに要求する（ログインしたブラウザの Cookie を使う。Playwright の要求は Referer を付けない）。
 * 受注を選ぶときは、画面のフォームと同じ形で受注IDを選んだ値を送る。移った先の URL・応答の種類・中身を返す。
 */
export async function Refererなしで要求する(page: Page, 受注IDs: string[]): Promise<{ 状態: number; URL: string; 種類: string; ファイル名: string; バイト列: Buffer }> {
  const form: Record<string, string> = {};
  for (const id of 受注IDs) form[`order_ids[${id}]`] = "on";
  const res = await page.context().request.post(adminUrl("/order/export/order"), { form, timeout: 60_000 });
  const cd = res.headers()["content-disposition"] ?? "";
  return { 状態: res.status(), URL: res.url(), 種類: res.headers()["content-type"] ?? "", ファイル名: /filename=([^;]+)/.exec(cd)?.[1]?.trim() ?? "", バイト列: await res.body() };
}
