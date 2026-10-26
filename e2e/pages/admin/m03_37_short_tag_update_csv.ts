/**
 * 略称タグ更新CSV登録画面（設計書 M03-37。商品の略称タグを、商品IDと略称タグの名称のCSVで更新する画面）。
 *
 * 2026-10-21 の時点で、アプリ（/home/y-saito/Developments/ec-cube-enterprise）にこの画面は無い。
 * - メニュー「商品管理」→「商品CSV管理」の項目（`app/config/eccube/packages/eccube_nav.yaml` 40〜80行）に、略称タグの項目が無い。
 * - 管理画面の経路の一覧（`bin/console debug:router`）にも、商品の略称タグを更新する取込の経路が無い。
 *   取込履歴の種別の表には「略称タグ更新」（`src/Eccube/Entity/Master/MtbCsvImportType.php` 39行）があるが、使う処理が無い。
 * - 略称タグ登録/編集画面の「CSV入力」で開く画面は、略称タグそのものを登録する取込（M03-16。見出しは ID・名称・並び順）で、この画面ではない。
 *
 * 画面を開く操作は、メニューから行う（アドレスが無いので、アドレスで開けない）。メニューに項目が無ければ、ある項目を添えて落とす。
 * 開いたあとの操作（取込ファイルの欄・アップロードボタン・雛形ファイルダウンロード・取込履歴）は、商品の更新の取込のほかの画面と
 * 同じ作り（`src/Eccube/Resource/template/admin/Product/base_csv_upload.twig`）を仮定して書いた。画面ができたら確かめ直す。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { tamperToken } from "./devtools";

/** 画面で選ぶファイル（名前・送るときの形式種別・中身） */
export type 取込ファイル = { name: string; mimeType: string; buffer: Buffer };

/** アップロードボタンを押した結果。ブラウザの入力チェックで止まったときは要求を送らない */
export type UploadResult =
  | { sent: true; 応答: number; 戻った画面: string }
  | { sent: false; 止めた項目: string[] };

export type 取込履歴の行 = { ファイル名: string; アップロード日時: string; 作業者: string };

/** メニューの項目の名前に含まれるはずの語（設計書の機能名「略称タグ更新CSV登録」の「略称タグ」） */
const メニューの語 = "略称タグ";

async function downloadedBytes(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export class ShortTagUpdateCsvPage {
  readonly form: Locator;
  readonly 取込ファイル: Locator;
  readonly アップロードボタン: Locator;
  readonly 雛形ファイルダウンロード: Locator;
  readonly 履歴の行: Locator;
  /** メニューから開いたときの画面のパス（開くまでは空） */
  private screenPath = "";

  constructor(readonly page: Page) {
    this.form = page.locator("form#upload-form");
    this.取込ファイル = this.form.locator('input[type="file"]');
    this.アップロードボタン = page.locator("#upload-button");
    this.雛形ファイルダウンロード = page.locator("#download-template-button");
    this.履歴の行 = page.locator("#csv_import_history_table tbody tr");
  }

  /**
   * メニュー「商品管理」→「商品CSV管理」を開き、略称タグ更新CSV登録の項目を押して画面を開く。
   * 項目が無ければ、「商品CSV管理」にある項目の名前を添えて落とす。
   */
  async openFromMenu(): Promise<void> {
    const res = await this.page.goto(adminUrl("/"));
    expect(res?.status() ?? 0, "管理画面のホームの応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    const product = this.page.locator('a.c-mainNavArea__navItemTitle[href="#nav-product"]');
    await expect(product, "メニューの「商品管理」").toHaveCount(1);
    if (!(await this.page.locator("#nav-product").isVisible())) await product.click();
    const csvMenu = this.page.locator('a.c-mainNavArea__navItemSubTitle[href="#nav-product_csv_management"]');
    await expect(csvMenu, "メニューの「商品管理」→「商品CSV管理」").toBeVisible();
    if (!(await this.page.locator("#nav-product_csv_management").isVisible())) await csvMenu.click();
    const items = this.page.locator("#nav-product_csv_management a");
    await expect(items.first(), "「商品CSV管理」の項目").toBeVisible();
    const names = (await items.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    const hits = items.filter({ hasText: メニューの語 });
    if ((await hits.count()) !== 1) {
      throw new Error(`メニュー「商品管理」→「商品CSV管理」に、略称タグ更新CSV登録の項目（名前に「${メニューの語}」を含むもの）が` +
        `${await hits.count()} 件ある（1件のはず）。ある項目: ${names.join("・")}`);
    }
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), hits.first().click()]);
    await expect(this.取込ファイル, "略称タグ更新CSV登録画面の取込ファイルの欄").toHaveCount(1);
    await expect(this.アップロードボタン, "略称タグ更新CSV登録画面のアップロードボタン").toBeVisible();
    this.screenPath = new URL(this.page.url()).pathname;
  }

  /** メニューから開いた画面のパス */
  path(): string {
    if (!this.screenPath) throw new Error("略称タグ更新CSV登録画面をまだ開いていない");
    return this.screenPath;
  }

  async choose(file: 取込ファイル): Promise<void> {
    await this.取込ファイル.setInputFiles({ name: file.name, mimeType: file.mimeType, buffer: file.buffer });
    const names = await this.取込ファイル.evaluate((e) => Array.from((e as HTMLInputElement).files ?? []).map((f) => f.name));
    expect(names, "取込ファイルに選んだファイル").toEqual([file.name]);
  }

  /** 開発者ツールで、フォームの中のなりすまし対策トークンの入力要素を消す */
  async removeToken(): Promise<void> {
    await tamperToken(this.form, "なし");
  }

  /** 開発者ツールで、フォームの中のなりすまし対策トークンの値を変える */
  async changeToken(value: string): Promise<void> {
    await tamperToken(this.form, value);
  }

  /** アップロードボタンを押す。ブラウザの入力チェックで止まったときは要求を送らない */
  async pressUpload(waitMs = 300_000): Promise<UploadResult> {
    await this.page.waitForLoadState("load");
    const blocked = await this.form.evaluate((f) => Array.from((f as HTMLFormElement).elements)
      .filter((e) => "checkValidity" in e && !(e as HTMLInputElement).checkValidity())
      .map((e) => `取込ファイル: ${(e as HTMLInputElement).validationMessage}`));
    if (blocked.length) {
      const sent = this.page.waitForRequest((r) => r.method() === "POST", { timeout: 3_000 }).then(() => true, () => false);
      await this.アップロードボタン.click();
      if (await sent) throw new Error(`ブラウザの入力チェックで止まるはずの送信が送られた（${blocked.join(" / ")}）`);
      return { sent: false, 止めた項目: blocked };
    }
    const action = new URL((await this.form.getAttribute("action")) ?? "", this.page.url()).pathname;
    const response = this.page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === action, { timeout: waitMs });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: waitMs }), this.アップロードボタン.click()]);
    return { sent: true, 応答: (await response).status(), 戻った画面: new URL(this.page.url()).pathname };
  }

  /** 画面上部のメッセージ（成功・エラー）。開発用の設定のときに常に出る帯は除く */
  async messages(): Promise<{ 成功: string[]; エラー: string[] }> {
    const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim())
      .filter((t) => t && !t.includes("デバッグモードが有効"));
    return { 成功: await read(this.page.locator(".alert-success")), エラー: await read(this.page.locator(".alert-danger")) };
  }

  /** アップロード欄（取込ファイルの欄の下）に出たエラーの文 */
  async uploadFieldErrors(): Promise<string[]> {
    return (await this.form.locator(".invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  async downloadTemplate(): Promise<{ fileName: string; bytes: Buffer }> {
    await expect(this.雛形ファイルダウンロード, "雛形ファイルダウンロードボタン").toBeVisible();
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.雛形ファイルダウンロード.click()]);
    return { fileName: download.suggestedFilename(), bytes: await downloadedBytes(download) };
  }

  /** いま表示しているCSVインポート履歴の行（上から順。該当なしの行は除く） */
  async historyRows(): Promise<取込履歴の行[]> {
    return this.履歴の行.evaluateAll((trs) => trs
      .map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => (td.textContent ?? "").replace(/\s+/g, " ").trim()))
      .filter((cells) => cells.length > 1)
      .map((cells) => ({ ファイル名: cells[0], アップロード日時: cells[1], 作業者: cells[cells.length - 1] })));
  }
}
