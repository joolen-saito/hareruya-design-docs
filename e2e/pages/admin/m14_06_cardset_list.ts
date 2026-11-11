/**
 * M14-06 カードセット管理(一覧) と、カードセット詳細(編集)の操作。セレクタはここだけに書く。
 * 一覧は共有の画面で、ほかの試験のカードセットも並ぶ。行は、控えたカードセットID（選択欄の値）か、実行の印つきの略称・名称で探す。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

const 環境の帯 = "デバッグモードが有効になっています";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const 空白なし = (s: string) => s.replace(/\s+/g, "");

export type ダウンロードの結果 = { ダウンロードした: boolean; エラー: string[]; 警告: string[]; url: string; ダウンロード?: Download };

export class CardsetListPage {
  constructor(readonly page: Page) {}

  get 表示件数欄(): Locator { return this.page.locator("#page_count_pulldown"); }
  get 並び順欄(): Locator { return this.page.locator("#sort_key_pulldown"); }
  get 全選択(): Locator { return this.page.locator("#chose_all"); }
  get 選択欄(): Locator { return this.page.locator('input[name="cardsetIds[]"]'); }
  get 行すべて(): Locator { return this.page.locator("tbody tr").filter({ has: this.選択欄 }); }

  async open(): Promise<void> {
    await this.page.goto(adminUrl("/cardset"));
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("#admin_cardset_download_by_set"), "カードセット一覧の「画像ダウンロード(セット別)」").toBeVisible();
  }

  /** 控えたカードセットIDの行 */
  行(id: string): Locator {
    return this.行すべて.filter({ has: this.page.locator(`input[name="cardsetIds[]"][value="${id}"]`) });
  }
  /** 略称の欄が一致する行 */
  略称の行(略称: string): Locator {
    return this.行すべて.filter({ has: this.page.locator("td", { hasText: new RegExp(`^\\s*${esc(略称)}\\s*$`) }) });
  }
  /** 行のどこかに文字がある行（実行の印つきのセット名(英)などで探す） */
  文字の行(語: string): Locator {
    return this.行すべて.filter({ hasText: 語 });
  }

  // ---- 選択欄（表示件数・並び順）。選ぶと読み込まれる。すでに選ばれている項目は読み込まれない ----
  private async 選ぶ(select: Locator, 表示: string): Promise<boolean> {
    await expect(select, "選択欄").toBeVisible();
    const r = await select.locator("option").evaluateAll((os, want) => {
      const o = (os as HTMLOptionElement[]).find((x) => (x.textContent ?? "").replace(/\s+/g, "") === want);
      return o ? { value: o.value, selected: o.selected } : null;
    }, 空白なし(表示));
    if (!r) throw new Error(`選択肢「${表示}」が無い`);
    if (r.selected) return false;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), select.selectOption(r.value)]);
    return true;
  }
  /** 表示件数を選ぶ。読み込みが起きたら true、すでにその件数が選ばれていて起きなかったら false */
  async 件数を選ぶ(件数: number): Promise<boolean> { return this.選ぶ(this.表示件数欄, `${件数}件`); }
  /** 並び順を選ぶ。表示は「リリース日（降順）」「セット英名（昇順）」の形 */
  async 並び順を選ぶ(表示: string): Promise<boolean> { return this.選ぶ(this.並び順欄, 表示); }

  // ---- ページング ----
  get ページング(): Locator { return this.page.locator(".pagination"); }
  async 現在のページ番号(): Promise<number> {
    const a = this.page.locator(".pagination .page-item.active .page-link");
    return (await a.count()) ? Number((await a.first().innerText()).trim()) : 1;
  }
  /** ページ番号のリンク（いま表示中のページは押せないのでリンクにならない） */
  ページ番号のリンク(n: number): Locator {
    return this.page.locator(".pagination a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }
  前へ(): Locator { return this.page.locator(".pagination a.page-link").filter({ hasText: /^\s*前へ\s*$/ }); }
  次へ(): Locator { return this.page.locator(".pagination a.page-link").filter({ hasText: /^\s*次へ\s*$/ }); }

  async ページ番号を押す(n: number): Promise<void> {
    const link = this.ページ番号のリンク(n).first();
    await expect(link, `ページ番号「${n}」のリンク`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  }
  async 前へを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.前へ().first().click()]);
  }

  async 総ページ数(): Promise<number> {
    const nums = await this.page.locator(".pagination a.page-link").evaluateAll((as) => as.map((a) => {
      const m = /\/page\/(\d+)/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "");
      return m ? Number(m[1]) : 0;
    }));
    return Math.max(1, await this.現在のページ番号(), ...nums);
  }

  /** 表示条件（件数・並び順）を保ったまま、ページ番号を指定して開く */
  async ページを開く(n: number): Promise<void> {
    await this.page.goto(adminUrl(`/cardset/page/${n}`));
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("#admin_cardset_download_by_set"), "カードセット一覧").toBeVisible();
  }

  /**
   * 一覧のページをたどって行を探し、見つかったページ番号を返す（見つからなければ null）。
   * 先頭から: 1ページ目から順に。最後から: 最後のページから順にさかのぼる（古いリリース日のカードセットを探すとき）。
   */
  async 行を探す(行: () => Locator, 方向: "先頭から" | "最後から", 最大ページ数 = 400): Promise<number | null> {
    if (方向 === "先頭から") {
      await this.ページを開く(1);
      const total = Math.min(await this.総ページ数(), 最大ページ数);
      for (let n = 1; n <= total; n++) {
        if (n > 1) await this.ページを開く(n);
        if (await 行().count()) return n;
      }
      return null;
    }
    const last = await this.総ページ数();
    for (let n = last; n >= Math.max(1, last - 5); n--) {
      await this.ページを開く(n);
      if (await 行().count()) return n;
    }
    return null;
  }

  // ---- 行の操作 ----
  async 操作を開く(row: Locator): Promise<void> {
    await row.locator("button.dropdown-menu-toggle").click({ timeout: 20_000 });
    await expect(row.locator(".dropdown-menu"), "行の操作（編集・削除）").toBeVisible();
  }
  編集(row: Locator): Locator { return row.locator("a.action-edit"); }
  削除(row: Locator): Locator { return row.locator('button[data-bs-target="#DeleteModal"]'); }
  get 削除の確認(): Locator { return this.page.locator("#DeleteModal"); }

  async 削除を押す(row: Locator): Promise<void> {
    await this.削除(row).click({ timeout: 20_000 });
    await expect(this.削除の確認, "削除の確認ポップアップ").toBeVisible();
  }
  /** ポップアップの実行（削除）ボタン。押すと一覧へ戻る */
  async ポップアップで実行する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      this.削除の確認.locator('a[data-method="delete"]').click(),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- メッセージ ----
  async メッセージ(種別: "danger" | "warning" | "success"): Promise<string[]> {
    const l = this.page.locator(`.alert-${種別}`).filter({ hasNotText: 環境の帯 });
    const out: string[] = [];
    for (const e of await l.all()) if (await e.isVisible()) out.push((await e.innerText()).replace(/\s+/g, " ").trim());
    return out;
  }

  // ---- 画像ダウンロード ----
  /** ダウンロードのボタンを押し、ZIP が来る（ダウンロードした）か、エラーメッセージつきで一覧へ戻るのを待つ */
  async 画像ダウンロードを押す(種類: "セット別" | "言語別"): Promise<ダウンロードの結果> {
    const button = this.page.locator(種類 === "セット別" ? "#admin_cardset_download_by_set" : "#admin_cardset_download_by_lang");
    const dl: Promise<Download | null> = this.page.waitForEvent("download", { timeout: 120_000 }).then((d) => d, () => null);
    const err = this.page.locator(".alert-danger").filter({ hasNotText: 環境の帯 }).first()
      .waitFor({ state: "visible", timeout: 120_000 }).then(() => "エラー" as const, () => "なし" as const);
    await button.click({ timeout: 20_000, noWaitAfter: true });
    const first = await Promise.race([dl.then((d) => (d ? ("ダウンロード" as const) : ("なし" as const))), err]);
    if (first === "ダウンロード") return { ダウンロードした: true, エラー: [], 警告: [], url: this.page.url(), ダウンロード: (await dl) ?? undefined };
    await this.page.waitForLoadState("load");
    return { ダウンロードした: false, エラー: await this.メッセージ("danger"), 警告: await this.メッセージ("warning"), url: this.page.url() };
  }
}

/** カードセット詳細(編集)画面。シード用に、リリース日・特殊セット・シンボル画像を設定する */
export class CardsetEditPage {
  constructor(readonly page: Page) {}

  async 設定する(id: string, v: { リリース日?: string; 特殊セット?: boolean; シンボル画像?: string }, what: string): Promise<string[]> {
    await this.page.goto(adminUrl(`/cardset/${id}/edit`));
    await this.page.waitForLoadState("load");
    const f = (n: string) => this.page.locator(`[name="admin_cardset[${n}]"]`);
    await expect(f("nameJp"), `${what}: カードセット詳細(編集・削除)画面`).toBeVisible();
    if (v.リリース日 !== undefined) await f("releaseDate").fill(v.リリース日);
    if (v.特殊セット !== undefined) await f("specialFlg").setChecked(v.特殊セット);
    if (v.シンボル画像) await this.page.locator('[name="admin_cardset[symbol_image_file]"]').setInputFiles(v.シンボル画像);
    await this.page.locator("form#form1 button[type=submit]").filter({ hasText: /^\s*登録\s*$/ }).click();
    return expectSaved(this.page, `${what}: カードセットの更新`);
  }
}
