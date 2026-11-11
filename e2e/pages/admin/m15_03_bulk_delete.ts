/**
 * M15-03 一括削除（デッキ・管理画面）の画面部品。セレクタはここだけに置く。
 * デッキ一覧（検索・選択）は M15-01 の部品（pages/admin/m15_deck.ts の デッキ一覧）を使う。ここは一括削除と、
 * 結果の画面（帯・ページ・行のプレイヤー名）を読む小さな部品だけを置く。
 *
 * 画面の表示名（アプリの Twig・翻訳ファイルで確かめたもの）:
 * - 一括削除のボタンは「一括削除」。押すとブラウザの確認（「選択されたデッキを削除しますか？」）が出る
 * - 削除のあとは、保持されたページ番号のデッキ一覧（検索結果）へ戻り、画面上部に「削除しました」かエラーの帯が出る
 */
import { expect, Locator, Page } from "@playwright/test";
import { デッキ一覧 } from "./m15_deck";

const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

export class デッキ一括削除 {
  readonly 一覧: デッキ一覧;
  constructor(readonly page: Page) { this.一覧 = new デッキ一覧(page); }

  get ボタン(): Locator { return this.page.locator("#bulk_delete"); }
  get ページ送り(): Locator { return this.page.locator(".pagination"); }

  /** 検索結果の行の選択欄にチェックを付ける */
  async デッキを選ぶ(デッキID: string): Promise<void> {
    const box = this.一覧.選択(デッキID);
    await expect(box, `検索結果にデッキID ${デッキID} の行の選択欄`).toHaveCount(1);
    await box.check();
    await expect(box, `デッキID ${デッキID} が選ばれる`).toBeChecked();
  }

  /** プレイヤー名の行の選択欄にチェックを付ける（いま表示しているページの中で1行に決まること） */
  async プレイヤーの行を選ぶ(プレイヤー名: string): Promise<string> {
    const ids = await this.行ごと();
    const hit = ids.filter((r) => r.プレイヤー名 === プレイヤー名);
    expect(hit.length, `いまのページのプレイヤー「${プレイヤー名}」の行の数`).toBe(1);
    await this.デッキを選ぶ(hit[0].デッキID);
    return hit[0].デッキID;
  }

  /**
   * 「一括削除」を押し、確認で「OK」を押す。移った先（デッキ一覧）の読み込みを待つ。
   * 確認の文と、画面上部の成功・エラーの帯の文を返す。
   */
  async 削除する(): Promise<{ 確認: string; 成功: string[]; エラー: string[] }> {
    await this.page.waitForLoadState("load"); // 確認の仕掛けは画面の読み込みのあとで付く
    let 確認 = "";
    this.page.once("dialog", (d) => { 確認 = d.message(); void d.accept(); });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), this.ボタン.click()]);
    expect(確認, "「一括削除」を押したときの確認").not.toBe("");
    return { 確認, 成功: await this.帯(".alert-success"), エラー: await this.帯(".alert-danger") };
  }

  private async 帯(sel: string): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(sel).all()) if (await e.isVisible()) out.push(文(await e.innerText()));
    return out;
  }

  /** ページ送りの「N」を押す（結果の表示を待つ） */
  async ページへ移る(n: number): Promise<void> {
    const a = this.ページ送り.locator("a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) }).first();
    await expect(a, `ページ送りの「${n}」`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), a.click()]);
    await this.一覧.結果を待つ();
  }

  /** ページ送りでいま選ばれているページ番号（ページ送りが無ければ空） */
  async いまのページ(): Promise<string> {
    const cur = this.ページ送り.locator(".page-item.active .page-link");
    return (await cur.count()) ? 文(await cur.first().innerText()) : "";
  }

  /** いま表示しているページの行（上から順）のデッキIDとプレイヤー名 */
  async 行ごと(): Promise<{ デッキID: string; プレイヤー名: string }[]> {
    return this.page.locator(".deck-result-table tbody tr").evaluateAll((trs) => trs.map((tr) => {
      const id = (tr.querySelector("input.searched_deck_id") as HTMLInputElement | null)?.value ?? "";
      let name = "";
      for (const r of Array.from(tr.querySelectorAll(".row.mb-1"))) {
        if (r.querySelector(".text-muted")?.textContent?.trim() === "プレイヤー名") name = (r.children[1]?.textContent ?? "").trim();
      }
      return { デッキID: id, プレイヤー名: name };
    }));
  }

  /** 件数・並べかえ項目・ソート順の選択欄で選ぶ（どれも選ぶと画面が移る） */
  async 件数を選ぶ(表示: string): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.一覧.件数選択.selectOption({ label: 表示 })]);
    await this.一覧.結果を待つ();
  }
  async 並べかえ項目を選ぶ(表示: string): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.一覧.並べ替え項目.selectOption({ label: 表示 })]);
    await this.一覧.結果を待つ();
  }
  async ソート順を選ぶ(表示: string): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.一覧.並び順.selectOption({ label: 表示 })]);
    await this.一覧.結果を待つ();
  }
  async 選ばれている(sel: Locator): Promise<string> { return 文(await sel.locator("option:checked").innerText()); }
}
