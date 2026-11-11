/**
 * M09-10 支店トップページ管理（コンテンツ管理＞支店トップページ管理）の画面の操作と、M09-10 のシードが使う管理画面の操作。
 * 画面の作り: 支店の選択欄を変えると、選んだ支店の設定で画面が描き直される（選択の送信）。登録ボタンは選んだ支店の設定を送る。
 * タイルの行は4行（登録済みのタイルの行に、足りない位置の行を画面のスクリプトが足す）。行ごとにタイル位置・タイル属性・タイルタグの選択欄がある。
 * タイル位置の選択肢は上から 上段右・中段左・中段右・下段左（正本の「セレクトボックスのn番目」は、この並びのn番目）。
 */
import { Locator, Page, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "../../config/env";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { ensureTenant } from "./tenant";

/** 画像の入力ファイル（fixtures/m09-10。中身の作りは同じ場所の README.md） */
const FIXTURES = join(REPO_ROOT, "e2e", "fixtures", "m09-10");
export const 旧バナー画像 = (): Buffer => readFileSync(join(FIXTURES, "m0910-old-banner.png"));
export const 新バナー画像 = (): Buffer => readFileSync(join(FIXTURES, "m0910-new-banner.png"));
/** ファイル選択に渡す形（名前は正本の画像のファイル名。中身は旧／新のどちらか） */
export const 画像ファイル = (名前: string, 中身: Buffer) => ({ name: 名前, mimeType: "image/png", buffer: 中身 });

export type タイル入力 = { 位置: 1 | 2 | 3 | 4; 属性: string; タグ: string | null };
/** タグは、未選択（---）なら空 */
export type タイル表示 = { 位置: string; 位置の番号: number; 属性: string; タグ: string; 位置を選べる: boolean; 属性を選べる: boolean; タグを選べる: boolean };

const selectedText = async (sel: Locator): Promise<string> =>
  ((await sel.locator("option:checked").allInnerTexts()).map((t) => t.trim()).join("、"));

export class 支店トップページ管理 {
  constructor(readonly page: Page) {}

  get 支店の選択(): Locator { return this.page.locator('select[name="branch_toppage_management[branch_list]"]'); }
  get 共通設定を適用(): Locator { return this.page.locator("#common-setting"); }
  /** バナー画像選択（ファイル選択の入力。画面では「ファイルを選択」の札の中に隠れている） */
  get バナー画像選択(): Locator { return this.page.locator("#branch_toppage_management_image_file"); }
  /** 登録済みのバナー画像の保管先（隠し項目） */
  get 登録済みバナー画像(): Locator { return this.page.locator("#branch_toppage_management_banner_image"); }
  /** バナー画像欄の画像（サムネイル） */
  get バナー画像欄の画像(): Locator { return this.page.locator("#thumb #thumb-image"); }
  get バナー画像削除ボタン(): Locator { return this.page.locator("#thumb .delete-image"); }
  get バナーリンクタグ(): Locator { return this.page.locator("#branch_toppage_management_banner_image_tag"); }
  get タイルの行(): Locator { return this.page.locator("#tiles .tile-config"); }
  タイル位置(行: number): Locator { return this.タイルの行.nth(行 - 1).locator('select[id$="_section"]'); }
  タイル属性(行: number): Locator { return this.タイルの行.nth(行 - 1).locator('select[id$="_tileType"]'); }
  タイルタグ(行: number): Locator { return this.タイルの行.nth(行 - 1).locator('select[id$="_tag"]'); }
  get 登録ボタン(): Locator { return this.page.locator("#ex-conversion-action button[type=submit]"); }
  /** なりすまし対策トークンの入力要素 */
  get トークン(): Locator { return this.page.locator('input[name="branch_toppage_management[_token]"]'); }
  get 成功の表示(): Locator { return this.page.locator(".alert-success"); }
  get エラーの表示(): Locator { return this.page.locator(".alert-danger"); }
  get 画面の見出し(): Locator { return this.page.locator(".c-pageTitle, .c-pageTitle__title").first(); }
  /** 編集欄（トップページ設定のカード）。項目が無いことを数えるときの範囲 */
  get 編集欄(): Locator { return this.page.locator("form#branch_toppage_management_form"); }

  /** 画面のスクリプトが済むのを待つ（タイルの行が4行そろい、共通設定の欄の活性が決まる） */
  async 描画を待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.支店の選択, "支店トップページ管理の支店の選択").toBeVisible({ timeout: 30_000 });
    await expect(this.タイルの行, "タイルの行（4行）").toHaveCount(4, { timeout: 30_000 });
  }

  /** 管理画面のコンテンツ管理＞支店トップページ管理を開く（支店は選ばない） */
  async 開く(): Promise<void> {
    const res = await this.page.goto(adminUrl("/content/branch_toppage"));
    expect(res?.status() ?? 0, "支店トップページ管理の応答").toBeLessThan(400);
    await this.描画を待つ();
  }

  /** 支店の選択欄で、表示名がちょうど 支店名 の支店を選ぶ（選ぶと画面が描き直される）。いま選ばれていれば何もしない */
  async 支店を選ぶ(支店名: string): Promise<void> {
    const options = await this.支店の選択.locator("option").evaluateAll((os) => (os as HTMLOptionElement[]).map((o) => ({ value: o.value, label: (o.textContent ?? "").trim() })));
    const hit = options.filter((o) => o.label === 支店名);
    if (hit.length !== 1) throw new Error(`支店の選択に「${支店名}」が ${hit.length} 件ある（1件のはず）`);
    if ((await this.支店の選択.inputValue()) !== hit[0].value) {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), this.支店の選択.selectOption(hit[0].value)]);
    }
    await this.描画を待つ();
    await expect(this.支店の選択, `選んだ支店「${支店名}」`).toHaveValue(hit[0].value);
  }

  async 開いて支店を選ぶ(支店名: string): Promise<void> { await this.開く(); await this.支店を選ぶ(支店名); }

  async 選択中の支店(): Promise<string> { return selectedText(this.支店の選択); }
  async 選択中のバナーリンクタグ(): Promise<string> { return selectedText(this.バナーリンクタグ); }

  /** バナー画像欄の画像のURL（背景画像に指定されたもの。無ければ空） */
  async バナー画像欄のURL(): Promise<string> {
    if ((await this.バナー画像欄の画像.count()) === 0) return "";
    const style = (await this.バナー画像欄の画像.getAttribute("style")) ?? "";
    const m = /url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(style);
    return m ? m[1] : "";
  }

  /** バナー画像欄の画像を、ブラウザの中で読み込んだ中身（読み込めなければ null） */
  async バナー画像欄の画像の中身(): Promise<Buffer | null> {
    const url = await this.バナー画像欄のURL();
    if (!url) return null;
    const b64 = await this.page.evaluate(async (u) => {
      try {
        const r = await fetch(u);
        if (!r.ok) return null;
        const a = new Uint8Array(await r.arrayBuffer());
        let s = ""; for (const x of a) s += String.fromCharCode(x);
        return btoa(s);
      } catch { return null; }
    }, url);
    return b64 ? Buffer.from(b64, "base64") : null;
  }

  async タイルの表示(): Promise<タイル表示[]> {
    const out: タイル表示[] = [];
    for (let i = 1; i <= await this.タイルの行.count(); i++) {
      out.push({
        位置: await selectedText(this.タイル位置(i)), 位置の番号: await this.タイル位置(i).evaluate((e) => (e as HTMLSelectElement).selectedIndex + 1), 属性: await selectedText(this.タイル属性(i)), タグ: (await this.タイルタグ(i).inputValue()) === "" ? "" : await selectedText(this.タイルタグ(i)),
        位置を選べる: await this.タイル位置(i).isEnabled(), 属性を選べる: await this.タイル属性(i).isEnabled(), タグを選べる: await this.タイルタグ(i).isEnabled(),
      });
    }
    return out;
  }

  /** バナー画像選択でファイルを選ぶ（選ぶと画面のスクリプトがバナー画像欄に表示する） */
  async バナー画像を選ぶ(file: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    await this.バナー画像選択.setInputFiles(file, { timeout: 20_000 });
    await expect(this.バナー画像欄の画像, "選んだ画像がバナー画像欄に表示される").toBeVisible({ timeout: 20_000 }).catch(() => undefined);
  }

  async バナーリンクタグを選ぶ(タグ名: string | null): Promise<void> {
    if (タグ名 === null) { await this.バナーリンクタグ.selectOption(""); return; }
    await chooseByLabel(this.バナーリンクタグ, タグ名);
  }

  /** 行（1〜4）の位置・属性・タグを入れる。属性がピックアップ商品なら、タグの欄は画面が使えなくするので触らない */
  async タイルを入れる(行: number, v: タイル入力): Promise<void> {
    await this.タイル位置(行).selectOption({ index: v.位置 - 1 }, { timeout: 20_000 });
    await chooseByLabel(this.タイル属性(行), v.属性);
    if (v.タグ !== null) await chooseByLabel(this.タイルタグ(行), v.タグ);
    else if (await this.タイルタグ(行).isEnabled()) await this.タイルタグ(行).selectOption("");
  }

  /** 登録ボタンを押し、送信の結果の画面を待つ */
  async 登録ボタンを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), this.登録ボタン.click({ timeout: 20_000 })]);
    await this.page.waitForLoadState("load");
  }

  async 登録して保存を確かめる(what: string, onIssue: (m: string) => void): Promise<void> {
    await this.登録ボタンを押す();
    for (const w of await expectSaved(this.page, what)) onIssue(w);
  }
}

export type トップページ設定 = {
  支店名: string;
  /** 支店共通設定を適用（支店共通には無い欄なので、支店共通のときは undefined） */
  共通設定?: boolean;
  画像: { name: string; mimeType: string; buffer: Buffer } | null;
  バナーリンクタグ: string | null;
  タイル: タイル入力[];
};

/** 支店トップページ管理で支店を選び、設定を入れて登録する（シードの作り方） */
export async function 支店トップページを設定する(page: Page, v: トップページ設定, what: string, onIssue: (m: string) => void): Promise<void> {
  const p = new 支店トップページ管理(page);
  await p.開いて支店を選ぶ(v.支店名);
  if (v.共通設定 !== undefined && (await p.共通設定を適用.isChecked()) !== v.共通設定) await p.共通設定を適用.setChecked(v.共通設定, { timeout: 20_000 });
  if (v.画像) await p.バナー画像を選ぶ(v.画像);
  await p.バナーリンクタグを選ぶ(v.バナーリンクタグ);
  for (let i = 0; i < v.タイル.length; i++) await p.タイルを入れる(i + 1, v.タイル[i]);
  await p.登録して保存を確かめる(`${what}: 支店トップページ管理の登録（${v.支店名}）`, onIssue);
}

// ---- 支店（店舗登録） ----

const 略称 = (s: string): string => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; const L = "ABCDEFGHJKLMNPQRSTUVWXYZ"; return [h % 24, (h >>> 5) % 24, (h >>> 10) % 24].map((i) => L[i]).join(""); };

/**
 * 店舗登録で支店（公開・開店）を登録して店舗IDを返す（あれば使う）。店名略称（3文字）はほかの店舗と重ならない値を選び直す。
 * 店名(英語表記)は半角英字とスペースだけの規則があるので、試験用の固定の英字にする。
 */
export async function 支店を用意する(page: Page, 店名: string, 支店URL: string, onIssue: (m: string) => void): Promise<string> {
  let last = "";
  for (let salt = 0; salt < 6; salt++) {
    try {
      return await ensureTenant(page, {
        店名, 店名カナ: "シケンシテン", 店名英語: "Branch Top Shop", 支店URL, 店名略称3文字: 略称(`${支店URL}${salt || ""}`), ショップ名略称: 店名,
      }, onIssue);
    } catch (e) {
      last = (e as Error).message;
      if (!/略称/.test(last)) throw e;
      onIssue(`店名略称が重なって登録できなかったので、略称を変えて登録し直した（${last.split("\n")[0]}）`);
    }
  }
  throw new Error(`店名略称を変えても支店「${店名}」を登録できない: ${last}`);
}

// ---- メンバーの編集可能店舗 ----

/** メンバー編集画面で、編集可能店舗に店舗を足して登録する（既にあれば何もしない）。デフォルト検索表示店舗は元のまま */
export async function 編集可能店舗に加える(page: Page, 管理者ID: string, 店名: string, what: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/setting/system/member/${管理者ID}/edit`));
  await page.waitForLoadState("load");
  const editable = page.locator('[name="admin_member[editableBaseInfos][]"]');
  await expect(editable, `${what}: メンバー編集の編集可能店舗`).toBeAttached();
  const now = (await editable.locator("option:checked").allInnerTexts()).map((t) => t.trim());
  if (now.includes(店名)) return;
  const defaultShop = page.locator('[name="admin_member[defaultSearchBaseInfo]"]');
  const def = await selectedText(defaultShop);
  await chooseByLabel(editable, [...now, 店名]);
  if (def && (await selectedText(defaultShop)) !== def) await chooseByLabel(defaultShop, def);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  for (const w of await expectSaved(page, `${what}: 管理者ID ${管理者ID} の編集可能店舗に「${店名}」を足す`)) onIssue(w);
}
