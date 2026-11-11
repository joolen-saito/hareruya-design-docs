/**
 * M10-10 CSV出力項目設定（設定 > 基本設定 > CSV出力項目設定）。セレクタはここにだけ書く。
 * 画面: CSV種別の選択、左の「CSV出力しない項目」・右の「CSV出力する項目」、操作（出力・解除）、順序（ひとつ上へ・ひとつ下へ）、登録。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const T = 30_000;

export type 項目 = { value: string; label: string };
export type 並び = { 出力しない: 項目[]; 出力する: 項目[] };

const options = (page: Page, id: string): Promise<項目[]> => page.locator(`#${id} option`).evaluateAll((os) => os.map((o) => ({ value: (o as HTMLOptionElement).value, label: (o.textContent ?? "").trim() })));

export class CsvSettingPage {
  constructor(private readonly page: Page) { page.setDefaultTimeout(60_000); }

  private get 種別() { return this.page.locator("#csv-type"); }
  private get 左() { return this.page.locator("#csv-not-output"); }
  private get 右() { return this.page.locator("#csv-output"); }

  /** CSV出力項目設定画面を開く（種別を指定しない。アプリの既定の種別が選ばれる） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/setting/shop/csv"));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "CSV出力項目設定画面の応答").toBeLessThan(400);
    await expect(this.page.locator("#csv-form"), "CSV出力項目設定の画面").toBeVisible({ timeout: T });
  }

  /** 種別の番号を指定して開く（画面の種別の選択を使わない準備用） */
  async openType(種別ID: string): Promise<void> {
    const res = await this.page.goto(adminUrl(`/setting/shop/csv/${種別ID}`));
    await this.page.waitForLoadState("load");
    expect(res?.status() ?? 0, "CSV出力項目設定画面の応答").toBeLessThan(400);
    await expect(this.page.locator("#csv-form"), "CSV出力項目設定の画面").toBeVisible({ timeout: T });
  }

  async 種別の選択肢(): Promise<string[]> {
    return (await options(this.page, "csv-type")).map((o) => o.label);
  }

  async 選ばれている種別(): Promise<string> {
    return this.種別.evaluate((n) => { const s = n as HTMLSelectElement; return (s.selectedOptions[0]?.textContent ?? "").trim(); });
  }

  /** CSV種別で名称を選ぶ（選ぶと、その種別の画面へ移る。すでにその種別が選ばれていれば何もしない） */
  async 種別を選ぶ(名称: string): Promise<void> {
    if ((await this.選ばれている種別()) === 名称) return;
    const hit = (await options(this.page, "csv-type")).find((o) => o.label === 名称);
    if (!hit) throw new Error(`CSV種別の選択肢に「${名称}」が無い（ある選択肢: ${(await this.種別の選択肢()).join("、")}）`);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), this.種別.selectOption(hit.value)]);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("#csv-form"), "CSV出力項目設定の画面").toBeVisible({ timeout: T });
  }

  async 並びを読む(): Promise<並び> {
    return { 出力しない: await options(this.page, "csv-not-output"), 出力する: await options(this.page, "csv-output") };
  }
  async 表示名の並び(): Promise<{ 出力しない: string[]; 出力する: string[] }> {
    const p = await this.並びを読む();
    return { 出力しない: p.出力しない.map((o) => o.label), 出力する: p.出力する.map((o) => o.label) };
  }

  /** 選択状態の項目（左右それぞれ） */
  async 選ばれている項目(): Promise<{ 出力しない: string[]; 出力する: string[] }> {
    const sel = (id: string) => this.page.locator(`#${id}`).evaluate((n) => Array.from((n as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
    return { 出力しない: await sel("csv-not-output"), 出力する: await sel("csv-output") };
  }

  private async 項目の値(リスト: "左" | "右", 表示名: string): Promise<string> {
    const hit = (await options(this.page, リスト === "左" ? "csv-not-output" : "csv-output")).filter((o) => o.label === 表示名);
    if (hit.length !== 1) throw new Error(`${リスト === "左" ? "CSV出力しない項目" : "CSV出力する項目"}に「${表示名}」が ${hit.length} 件ある（1件のはず）`);
    return hit[0].value;
  }

  /** 左（CSV出力しない項目）で、表示名の項目だけを選ぶ（ほかの選択は外れる） */
  async 左で選ぶ(...表示名: string[]): Promise<void> {
    await this.左.selectOption(await Promise.all(表示名.map((n) => this.項目の値("左", n))));
  }
  /** 右（CSV出力する項目）で、表示名の項目だけを選ぶ */
  async 右で選ぶ(...表示名: string[]): Promise<void> {
    await this.右.selectOption(await Promise.all(表示名.map((n) => this.項目の値("右", n))));
  }
  /** 項目をクリックし、修飾キーを押したまま別の項目をクリックして、複数を同時に選ぶ（Ctrl。Mac の Chrome では Ctrl のクリックが選択にならないので、Mac は Command） */
  async 複数選ぶ(リスト: "左" | "右", 表示名: string[]): Promise<void> {
    const list = リスト === "左" ? this.左 : this.右;
    const opt = (n: string) => list.locator("option").filter({ hasText: new RegExp(`^\\s*${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) });
    await opt(表示名[0]).click();
    for (const n of 表示名.slice(1)) await opt(n).click({ modifiers: ["ControlOrMeta"] });
  }
  async 選択を外す(): Promise<void> {
    await this.左.selectOption([]);
    await this.右.selectOption([]);
  }

  /** 左で選んだ項目を右へ移す（「出力」ボタン） */
  async 出力するへ移す(): Promise<void> { await this.page.locator("#add").click(); }
  /** 右で選んだ項目を左へ移す（「解除」ボタン） */
  async 出力しないへ移す(): Promise<void> { await this.page.locator("#remove").click(); }
  async ひとつ上へ(): Promise<void> { await this.page.locator('.move[data-value="up"]').click(); }
  async ひとつ下へ(): Promise<void> { await this.page.locator('.move[data-value="down"]').click(); }

  /** 右で「表示名」だけを選び、最下段になるまで「ひとつ下へ」を押す */
  async 最下段まで下げる(表示名: string): Promise<void> {
    await this.右で選ぶ(表示名);
    for (let i = 0; i < 200; i++) {
      const labels = (await options(this.page, "csv-output")).map((o) => o.label);
      if (labels[labels.length - 1] === 表示名) return;
      await this.ひとつ下へ();
    }
    throw new Error(`「${表示名}」が最下段にならない`);
  }

  /** ブラウザの開発者ツールで、左（CSV出力しない項目）／右（CSV出力する項目）の入力要素を削除する */
  async 入力要素を削除する(リスト: "左" | "右"): Promise<void> {
    await (リスト === "左" ? this.左 : this.右).evaluate((n) => n.remove());
  }
  /** ブラウザの開発者ツールで、左の項目の識別子（選択肢の値）を書き換える */
  async 識別子を書き換える(表示名: string, 新しい値: string): Promise<void> {
    const v = await this.項目の値("左", 表示名);
    await this.左.locator(`option[value="${v}"]`).evaluate((o, nv) => { (o as HTMLOptionElement).value = nv; }, 新しい値);
  }

  /** 「登録」を押す。遷移後の画面の応答の状態を返す（エラーの画面も待つ） */
  async 登録する(): Promise<{ 応答: number }> {
    const [res] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.page.locator('#csv-form button[type="submit"]').click(),
    ]);
    await this.page.waitForLoadState("load");
    return { 応答: res?.status() ?? 0 };
  }
  async 保存したと表示される(): Promise<void> {
    await expectSaved(this.page, "CSV出力項目設定の登録");
  }
  get 現在のパス(): string { return new URL(this.page.url()).pathname; }

  /**
   * 左右の並びを、画面の部品を使って指定の並びにして登録する（元に戻す・準備用）。
   * 項目の移動は画面の「出力」「解除」と同じ動き（選択肢を反対側の末尾へ付け替える）で、指定の順に付け替えてから登録する。
   */
  async 並びを指定して登録する(並び: { 出力しない: string[]; 出力する: string[] } /* 項目の識別子（選択肢の値）の並び */): Promise<void> {
    await this.page.evaluate((p) => {
      const left = document.getElementById("csv-not-output") as HTMLSelectElement;
      const right = document.getElementById("csv-output") as HTMLSelectElement;
      const all = new Map<string, HTMLOptionElement>();
      for (const o of [...Array.from(left.options), ...Array.from(right.options)]) all.set(o.value, o);
      for (const v of p.出力しない) { const o = all.get(v); if (!o) throw new Error(`項目 ${v} が画面に無い`); o.selected = false; left.appendChild(o); }
      for (const v of p.出力する) { const o = all.get(v); if (!o) throw new Error(`項目 ${v} が画面に無い`); o.selected = false; right.appendChild(o); }
    }, 並び);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), this.page.locator('#csv-form button[type="submit"]').click()]);
    await this.page.waitForLoadState("load");
  }
}
