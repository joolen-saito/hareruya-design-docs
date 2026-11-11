/**
 * M15-09 アーキタイプ登録/編集/削除（管理画面）の画面部品。セレクタはここだけに置く。
 * アーキタイプ管理（検索入力・検索結果）は、この機能のケースが使う操作（名前で検索・表示件数・ページ送り・編集の入口・登録デッキ数）だけを置く。
 *
 * 画面の表示名（アプリの Twig・翻訳ファイルで確かめたもの）:
 * - 操作ボタン: 新規登録 / 更新 / 削除 / 戻る（戻るは、アーキタイプ管理の検索結果へ戻るリンク）
 * - 代表カードの検索を開くボタンは「代表カード選択」（開く画面の題名は「代表カード検索」）。その中の検索ボタンは「検索」、
 *   行のボタンは「選択」（正本の「検索する」「決定」）。完全一致のチェックは「完全一致」
 * - 削除の確認ダイアログの文は「このアーキタイプを削除してもよろしいですか？」
 * - アーキタイプ管理の検索ボタンは「検索する」（正本の「検索する >」）。行の右端の「…」から「編集」「削除」
 */
import { expect, Locator, Page, Response } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

type Issue = (m: string) => void;

const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();
const 正規 = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const pathOf = (url: string): string => new URL(url).pathname;
export const アーキタイプ一覧のパス = (): string => pathOf(adminUrl("/archetype"));
export const 新規登録画面のパス = (): string => pathOf(adminUrl("/archetype/new"));
export const 編集画面のパス = (id: string): string => pathOf(adminUrl(`/archetype/${id}/edit`));

/** 送信（登録・更新・削除）の結果: 送った要求の応答と、最後に表示された画面の応答・アドレス */
export type 送信の結果 = { 要求の応答: number; 最後の応答: number; 最後の画面: string };

/** 画面の移動の最終の応答から、最初の要求（送った要求）の応答の状態をたどる（転送されたときは転送の応答 302 など） */
async function 送った要求の応答(res: Response | null): Promise<number> {
  if (!res) return 0;
  let req = res.request();
  while (req.redirectedFrom()) req = req.redirectedFrom()!;
  const first = await req.response();
  return first?.status() ?? res.status();
}

/** 代表カード検索の結果の1行 */
export type 代表カードの行 = { ID: string; 名前: string; 画像: string };

export type アーキタイプ入力 = {
  名日?: string; 名英?: string; 解説日?: string; 解説英?: string;
  /** 代表カード: 検索の語（完全一致で検索する）と、選ぶ行の画像ID */
  代表カード?: { 語: string; 画像ID: string };
  公開状態?: string;
  /** 指定したカラーだけにチェックを付ける */
  カラー?: string[];
  フォーマット?: string;
  /** 指定したタグだけを選ぶ */
  タグ?: string[];
};

/** アーキタイプ新規登録画面・編集画面 */
export class アーキタイプ編集画面 {
  constructor(readonly page: Page) {}

  f(name: string): Locator { return this.page.locator(`[name="admin_archetype[${name}]"], [name="admin_archetype[${name}][]"]`).first(); }
  get 名日() { return this.f("nameJp"); }
  get 名英() { return this.f("nameEn"); }
  get 解説日() { return this.f("commentJp"); }
  get 解説英() { return this.f("commentEn"); }
  get 公開状態() { return this.f("Disp"); }
  get フォーマット() { return this.f("Format"); }
  get タグ() { return this.f("DeckTags"); }
  get カラーの欄() { return this.page.locator('input[name="admin_archetype[Colors][]"]'); }
  get 代表カードID() { return this.page.locator("#admin_archetype_cardImageId"); }
  get 代表カード画像() { return this.page.locator("#cardImagePreview"); }
  get 代表カード名() { return this.page.locator("#selectedCardImageName"); }
  get フォーム() { return this.page.locator("form#admin_archetype"); }

  /** 右側の操作ボタンの欄 */
  get 操作欄() { return this.page.locator(".c-contentsArea__cols .col-md-2 .card-body"); }
  get 新規登録ボタン() { return this.操作欄.locator('button[type="submit"][form="admin_archetype"]').filter({ hasText: /^\s*新規登録\s*$/ }); }
  get 更新ボタン() { return this.操作欄.locator('button[type="submit"][form="admin_archetype"]').filter({ hasText: /^\s*更新\s*$/ }); }
  get 削除ボタン() { return this.操作欄.locator("#btn_delete").filter({ hasText: /^\s*削除\s*$/ }); }
  get 戻るボタン() { return this.操作欄.locator("a").filter({ hasText: /^\s*戻る\s*$/ }); }
  get 代表カード選択ボタン() { return this.page.locator('[data-bs-target="#searchCardImageModal"]').filter({ hasText: /^\s*代表カード選択\s*$/ }); }
  get 削除フォーム() { return this.page.locator("#delete_form"); }

  // ---- 代表カード検索の画面 ----
  get 代表カード検索画面() { return this.page.locator("#searchCardImageModal"); }
  get 代表カード検索の題名() { return this.代表カード検索画面.locator(".modal-title"); }
  get 検索語の欄() { return this.代表カード検索画面.locator("#card_image_search_word"); }
  get 完全一致() { return this.代表カード検索画面.locator("#card_image_exact_match"); }
  get 代表カード検索ボタン() { return this.代表カード検索画面.locator("#btn_search_card_image").filter({ hasText: /^\s*検索\s*$/ }); }
  get 検索結果の欄() { return this.代表カード検索画面.locator("#card_image_search_results"); }
  選択ボタン(画像ID: string): Locator { return this.検索結果の欄.locator(`button.select-card-image[data-id="${画像ID}"]`); }

  /** 新規登録画面を開く */
  async 新規を開く(): Promise<void> {
    await this.page.goto(adminUrl("/archetype/new"));
    await this.読み込みを待つ();
  }

  /** 編集画面を開く。応答の状態を返す（読み込みを待つのは 200 のときだけ） */
  async 編集を開く(id: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/archetype/${id}/edit`));
    const status = res?.status() ?? 0;
    if (status === 200) await this.読み込みを待つ();
    return status;
  }

  /** 画面が読み込まれ、画面の仕掛け（タグの選択欄の表示）が動いた状態まで待つ */
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.名日, "アーキタイプ登録・編集画面のアーキタイプ名(日)").toBeVisible();
    await expect(this.page.locator(".select2-container").first(), "タグの選択欄の表示（画面の仕掛け）").toBeAttached();
  }

  /** 開いているのがアーキタイプ登録・編集画面か（入力の欄が表示されている） */
  async 登録編集画面か(): Promise<boolean> { return this.名日.isVisible(); }

  /** 右側の操作欄に表示されているボタン・リンクの名前 */
  async 操作ボタンの名前(): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.操作欄.locator("button, a").all()) if (await e.isVisible()) out.push(文(await e.innerText()));
    return out;
  }

  /** 選択欄で選ばれている選択肢の表示 */
  async 選択中(sel: Locator): Promise<string[]> {
    return (await sel.locator("option:checked").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
  /** 選択欄の選択肢の表示（上から順。空の選択肢を除く） */
  async 選択肢(sel: Locator): Promise<string[]> {
    return (await sel.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
  /** 選択欄に空の選択肢（値が空）があるか */
  async 空の選択肢があるか(sel: Locator): Promise<boolean> {
    return (await sel.locator('option[value=""]').count()) > 0;
  }

  /** カラーの欄の、ラベルとチェックの状態（左から順） */
  async カラー(): Promise<{ 名: string; 選択: boolean }[]> {
    return this.カラーの欄.evaluateAll((es) => es.map((e) => {
      const i = e as HTMLInputElement;
      const label = i.id ? document.querySelector(`label[for="${i.id}"]`) : null;
      return { 名: (label?.textContent ?? "").trim(), 選択: i.checked };
    }));
  }
  async 選ばれたカラー(): Promise<string[]> { return (await this.カラー()).filter((c) => c.選択).map((c) => c.名); }

  /** 指定したカラーだけにチェックを付ける（ほかは外す） */
  async カラーを選ぶ(名: string[]): Promise<void> {
    const all = await this.カラー();
    for (const n of 名) if (!all.some((c) => c.名 === n)) throw new Error(`カラーの選択肢「${n}」が無い（ある選択肢: ${all.map((c) => c.名).join("、")}）`);
    for (const [i, c] of all.entries()) await this.カラーの欄.nth(i).setChecked(名.includes(c.名));
  }

  /** タグを指定したものだけにする（画面の選択欄の表示も合わせる） */
  async タグを選ぶ(名: string[]): Promise<void> {
    const have = await this.選択肢(this.タグ);
    for (const n of 名) if (!have.includes(n)) throw new Error(`タグの選択肢「${n}」が無い（ある選択肢: ${have.join("、")}）`);
    await this.タグ.selectOption(名.map((label) => ({ label })), { force: true });
    await this.タグ.dispatchEvent("change");
  }

  /** 代表カードの表示（名前の欄の文字と、画像の参照先。表示されていなければ空） */
  async 代表カード(): Promise<{ 名前: string; 画像: string; 画像ID: string }> {
    const 名前 = (await this.代表カード名.isVisible()) ? 文(await this.代表カード名.innerText()) : "";
    const 画像 = (await this.代表カード画像.isVisible()) ? ((await this.代表カード画像.getAttribute("src")) ?? "") : "";
    return { 名前, 画像, 画像ID: await this.代表カードID.inputValue() };
  }

  /** 代表カードの選択を外す（隠し項目の画像IDを空にし、表示も消す） */
  async 代表カードを空にする(): Promise<void> {
    await this.代表カードID.evaluate((e) => { (e as HTMLInputElement).value = ""; });
    await this.代表カード名.evaluate((e) => { (e as HTMLElement).textContent = ""; (e as HTMLElement).style.display = "none"; });
    await this.代表カード画像.evaluate((e) => { (e as HTMLImageElement).removeAttribute("src"); (e as HTMLElement).style.display = "none"; });
  }

  /** 正本の「開発者ツールで代表カード画像IDを…に変更する」: 送信される隠し項目の画像IDを書き換える */
  async 代表カードIDを書き換える(値: string): Promise<void> {
    await this.代表カードID.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }

  /** 入力（指定の項目だけ） */
  async 入力する(v: アーキタイプ入力): Promise<void> {
    if (v.名日 !== undefined) await this.名日.fill(v.名日);
    if (v.名英 !== undefined) await this.名英.fill(v.名英);
    if (v.解説日 !== undefined) await this.解説日.fill(v.解説日);
    if (v.解説英 !== undefined) await this.解説英.fill(v.解説英);
    if (v.代表カード !== undefined) await this.代表カードを選ぶ(v.代表カード.語, v.代表カード.画像ID, { 完全一致: true });
    if (v.公開状態 !== undefined) await chooseByLabel(this.公開状態, v.公開状態);
    if (v.カラー !== undefined) await this.カラーを選ぶ(v.カラー);
    if (v.フォーマット !== undefined) await chooseByLabel(this.フォーマット, v.フォーマット);
    if (v.タグ !== undefined) await this.タグを選ぶ(v.タグ);
  }

  // ---- 代表カード検索 ----

  /** 「代表カード選択」を押して、代表カード検索の画面を開く */
  async 代表カード検索を開く(): Promise<void> {
    await this.代表カード選択ボタン.click();
    await expect(this.代表カード検索画面, "代表カード検索の画面").toBeVisible();
  }

  /** 代表カード検索の画面の、いまの検索の要求の応答を待つ。応答の中身（JSON）を返す */
  private 検索の応答を待つ(): Promise<Response> {
    return this.page.waitForResponse((r) => r.url().includes("/archetype/search_card_image") && r.request().method() === "POST", { timeout: 60_000 });
  }

  /** 検索語を入れ（完全一致の指定があれば付け外しし）、「検索」を押して結果の表示を待つ。応答の中身を返す */
  async 代表カードを検索する(語: string, opt: { 完全一致?: boolean } = {}): Promise<{ page: number; totalPages: number; totalCount: number; items: unknown[] }> {
    await this.検索語の欄.fill(語);
    if (opt.完全一致 !== undefined) await this.完全一致.setChecked(opt.完全一致);
    const res = this.検索の応答を待つ();
    await this.代表カード検索ボタン.click();
    return this.結果を待つ(await res);
  }

  private async 結果を待つ(res: Response): Promise<{ page: number; totalPages: number; totalCount: number; items: unknown[] }> {
    const body = await res.json() as { page: number; totalPages: number; totalCount: number; items: unknown[] };
    if (body.items.length) await expect(this.検索結果の欄.locator("tbody tr").first(), "代表カード検索の結果の行").toBeVisible();
    else await expect(this.検索結果の欄.locator("p").first(), "代表カード検索の結果なしの表示").toBeVisible();
    return body;
  }

  /** 代表カード検索の結果の行（ID・カード名・画像の参照先） */
  async 代表カード検索の結果(): Promise<代表カードの行[]> {
    return this.検索結果の欄.locator("tbody tr").evaluateAll((trs) => trs.map((tr) => {
      const tds = tr.querySelectorAll("td");
      return { ID: (tds[0]?.textContent ?? "").trim(), 名前: (tds[1]?.textContent ?? "").trim(), 画像: tds[2]?.querySelector("img")?.getAttribute("src") ?? "" };
    }));
  }

  /** 代表カード検索のページ送り: 番号の並びと、いまのページ（ページ送りが無ければ空） */
  async 代表カード検索のページ(): Promise<{ 現在: string; 番号: string[] }> {
    const items = this.検索結果の欄.locator(".pagination .page-link");
    const 番号 = (await items.allInnerTexts()).map((t) => t.trim()).filter((t) => /^\d+$/.test(t));
    const active = this.検索結果の欄.locator(".pagination .page-item.active");
    const 現在 = (await active.count()) ? (await active.first().innerText()).trim() : "";
    return { 現在, 番号 };
  }

  /** ページ送りの番号を押して、結果の表示を待つ */
  async 代表カード検索のページを押す(n: number): Promise<{ page: number; totalPages: number; totalCount: number; items: unknown[] }> {
    const link = this.検索結果の欄.locator(".pagination .page-link.card-image-page").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
    await expect(link, `代表カード検索のページ送りの「${n}」`).toHaveCount(1);
    const res = this.検索の応答を待つ();
    await link.click();
    return this.結果を待つ(await res);
  }

  /** ページ送りの「次へ」を押して、結果の表示を待つ */
  async 代表カード検索の次へ(): Promise<{ page: number; totalPages: number; totalCount: number; items: unknown[] }> {
    const link = this.検索結果の欄.locator(".pagination .page-link.card-image-page").last();
    const res = this.検索の応答を待つ();
    await link.click();
    return this.結果を待つ(await res);
  }

  /** 代表カード検索の画面を開き、語で検索して、画像IDの行の「選択」を押す（画面が閉じるまで待つ） */
  async 代表カードを選ぶ(語: string, 画像ID: string, opt: { 完全一致?: boolean } = {}): Promise<void> {
    if (!(await this.代表カード検索画面.isVisible())) await this.代表カード検索を開く();
    await this.代表カードを検索する(語, opt);
    const b = this.選択ボタン(画像ID);
    await expect(b, `代表カード検索の結果に画像ID ${画像ID} の行`).toHaveCount(1);
    await b.click();
    await expect(this.代表カード検索画面, "「選択」を押すと代表カード検索の画面が閉じる").toBeHidden();
  }

  /** 正本の「開発者ツールで…決定ボタンの画像IDを…へ変更する」: 行の「選択」ボタンが持つ画像IDを書き換える */
  async 選択ボタンの画像IDを書き換える(元: string, 値: string): Promise<Locator> {
    const b = this.選択ボタン(元);
    await expect(b, `代表カード検索の結果に画像ID ${元} の行`).toHaveCount(1);
    await b.evaluate((e, v) => { e.setAttribute("data-id", v); (window as unknown as { jQuery?: (x: Element) => { removeData: (k: string) => void } }).jQuery?.(e).removeData("id"); }, 値);
    return this.選択ボタン(値);
  }

  // ---- 送信・削除 ----

  /** 送信ボタン（新規登録・更新）を押して、次の画面の読み込みを待つ */
  async 送信する(button: Locator): Promise<送信の結果> {
    const [res] = await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), button.click()]);
    return { 要求の応答: await 送った要求の応答(res), 最後の応答: res?.status() ?? 0, 最後の画面: this.page.url() };
  }

  /**
   * 「削除」を押し、確認ダイアログが出るまで待つ（ダイアログは開いたまま）。続けて OK かキャンセルを押す操作を返す
   * （正本の「削除ボタンを押す」と「確認ダイアログで OK を押す」が別の手順のときに使う）。
   */
  async 削除を押す(): Promise<{ 文: string; OKを押す: () => Promise<送信の結果>; キャンセルを押す: () => Promise<{ 送った: boolean }> }> {
    let dialog: import("@playwright/test").Dialog | null = null;
    this.page.once("dialog", (d) => { dialog = d; });
    const clicked = this.削除ボタン.click();
    await expect.poll(() => dialog !== null, "確認ダイアログが出る").toBe(true);
    const d = dialog as unknown as import("@playwright/test").Dialog;
    return {
      文: d.message(),
      OKを押す: async () => {
        const [res] = await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), d.accept()]);
        await clicked;
        return { 要求の応答: await 送った要求の応答(res), 最後の応答: res?.status() ?? 0, 最後の画面: this.page.url() };
      },
      キャンセルを押す: async () => {
        let 送った = false;
        const onReq = (r: { method(): string; url(): string }) => { if (r.method() === "POST" && r.url().includes("/archetype/")) 送った = true; };
        this.page.on("request", onReq);
        await d.dismiss();
        await clicked;
        await this.page.waitForTimeout(1_500);
        this.page.off("request", onReq);
        return { 送った };
      },
    };
  }

  /** 「削除」を押し、確認ダイアログで OK を押す。ダイアログの文と送信の結果を返す */
  async 削除してOKを押す(): Promise<{ 文: string } & 送信の結果> {
    let 文 = "";
    this.page.once("dialog", (d) => { 文 = d.message(); void d.accept(); });
    const [res] = await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.削除ボタン.click()]);
    return { 文, 要求の応答: await 送った要求の応答(res), 最後の応答: res?.status() ?? 0, 最後の画面: this.page.url() };
  }

  /** 正本の「開発者ツールで削除フォームの送信先にあるIDを…へ変更する」 */
  async 削除の送信先のIDを書き換える(値: string): Promise<string> {
    return this.削除フォーム.evaluate((e, v) => {
      const f = e as HTMLFormElement;
      f.setAttribute("action", (f.getAttribute("action") ?? "").replace(/\/archetype\/[^/]+\/delete/, `/archetype/${v}/delete`));
      return f.getAttribute("action") ?? "";
    }, 値);
  }

  /** 画面上部の成功・エラーの帯の文 */
  async 成功の帯(): Promise<string[]> { return this.帯(".alert-success"); }
  async エラーの帯(): Promise<string[]> { return this.帯(".alert-danger"); }
  /** 入力欄の下のエラーの文 */
  async 入力エラー(): Promise<string[]> { return this.帯(".invalid-feedback, .form-error-message"); }
  private async 帯(sel: string): Promise<string[]> {
    const out: string[] = [];
    for (const e of await this.page.locator(sel).all()) if (await e.isVisible()) out.push(文(await e.innerText()));
    return out;
  }

  /** 開いている編集画面のアーキタイプID（アドレスの番号） */
  アーキタイプID(): string {
    const m = /\/archetype\/(\d+)\/edit/.exec(this.page.url());
    if (!m) throw new Error(`アーキタイプ編集画面のアドレスでない（${this.page.url()}）`);
    return m[1];
  }
}

// ---- アーキタイプ管理（検索入力・検索結果） ----

export type 一覧の行 = { ID: string; 名前: string; 名日: string; 登録デッキ数: string };

export class アーキタイプ一覧 {
  constructor(readonly page: Page) {}

  get 名前の欄() { return this.page.locator('[name="admin_search_archetype[multi]"]'); }
  get 検索ボタン() { return this.page.locator("form#admin_search_archetype button[type=submit]").filter({ hasText: /^\s*検索する\s*$/ }); }
  get 結果の表() { return this.page.locator("table.archetype-result-table"); }
  get 件数の表示() { return this.page.locator(".c-contentsArea__cols .fw-bold").first(); }
  get 表示件数() { return this.page.locator("#page_count_pulldown"); }
  get ページ送り() { return this.page.locator("ul.pagination"); }

  /** アーキタイプ管理（検索入力）を開く */
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/archetype"));
    await this.page.waitForLoadState("load");
    await expect(this.名前の欄, "アーキタイプ管理のアーキタイプ名の欄").toBeVisible();
  }

  /** アーキタイプ名の欄に入れて「検索する」を押し、結果の表示を待つ */
  async 名前で検索する(語: string): Promise<void> {
    await this.名前の欄.fill(語);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.検索ボタン.click()]);
    await this.結果を待つ();
  }

  async 結果を待つ(): Promise<void> {
    await expect(this.結果の表.or(this.page.getByText("検索条件に合致するデータが見つかりませんでした")).first(), "アーキタイプ管理の検索結果").toBeVisible();
  }

  /** 検索結果の行（ID・アーキタイプ名・登録デッキ数） */
  async 行(): Promise<一覧の行[]> {
    if (!(await this.結果の表.count())) return [];
    return this.結果の表.locator("tbody tr").evaluateAll((trs) => trs.filter((tr) => tr.querySelectorAll("td").length >= 6).map((tr) => {
      const tds = tr.querySelectorAll("td");
      const name = (tds[2].textContent ?? "").replace(/\s+/g, " ").trim();
      return { ID: (tds[1].textContent ?? "").trim(), 名前: name, 名日: name.split(" / ")[0].trim(), 登録デッキ数: (tds[5].textContent ?? "").trim() };
    }));
  }

  /** 表示件数を選ぶ（選ぶと1ページ目が開き直される） */
  async 表示件数を選ぶ(件数: number): Promise<void> {
    await expect(this.表示件数, "検索結果の表示件数の選択欄").toBeVisible();
    if (((await this.表示件数.locator("option:checked").innerText()) ?? "").trim() === `${件数}件`) return; // 既に選ばれている（選び直しても画面は変わらない）
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), chooseByLabel(this.表示件数, `${件数}件`)]);
    await this.結果を待つ();
  }

  /** ページ送りの番号を押す */
  async ページを押す(n: number): Promise<void> {
    const link = this.ページ送り.locator("a.page-link").filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
    await expect(link, `ページ送りの「${n}」`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    await this.結果を待つ();
  }

  /** いま表示しているページの番号 */
  async 現在のページ(): Promise<string> {
    const a = this.ページ送り.locator(".page-item.active");
    return (await a.count()) ? (await a.first().innerText()).trim() : "";
  }

  /** IDの行の右端の「…」を押し、「編集」を押してアーキタイプ編集画面を開く */
  async 編集を押す(id: string): Promise<アーキタイプ編集画面> {
    const tr = this.結果の表.locator("tbody tr").filter({ has: this.page.locator("td:nth-child(2)", { hasText: new RegExp(`^\\s*${正規(id)}\\s*$`) }) });
    await expect(tr, `検索結果に ID ${id} の行`).toHaveCount(1);
    await tr.locator("button.dropdown-menu-toggle").click();
    const link = tr.locator(".dropdown-menu a.dropdown-item").filter({ hasText: /^\s*編集\s*$/ });
    await expect(link, `ID ${id} の行の「編集」`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    const e = new アーキタイプ編集画面(this.page);
    await e.読み込みを待つ();
    return e;
  }

  /** IDの行が表示されているか */
  ID列の行(id: string): Locator {
    return this.結果の表.locator("tbody tr").filter({ has: this.page.locator("td:nth-child(2)", { hasText: new RegExp(`^\\s*${正規(id)}\\s*$`) }) });
  }
}

// ---- シード用 ----

/** アーキタイプ管理で名前を検索し、アーキタイプ名(日)がちょうど一致する行のID（検索結果の全ページを読む） */
export async function 名前でIDを読む(page: Page, 名日: string): Promise<string[]> {
  const l = new アーキタイプ一覧(page);
  await l.開く();
  await l.名前で検索する(名日);
  const ids = (await l.行()).filter((r) => r.名日 === 名日).map((r) => r.ID);
  if (!(await l.結果の表.count())) return ids;
  const 件数 = Number(/(\d+)/.exec(await l.件数の表示.innerText())?.[1] ?? "0");
  const 表示件数 = Number(/(\d+)/.exec((await l.表示件数.locator("option:checked").innerText()) ?? "")?.[1] ?? "0");
  const pages = 表示件数 > 0 ? Math.ceil(件数 / 表示件数) : 1;
  for (let p = 2; p <= pages; p++) {
    await page.goto(adminUrl(`/archetype/search/${p}`));
    await page.waitForLoadState("load");
    await l.結果を待つ();
    ids.push(...(await l.行()).filter((r) => r.名日 === 名日).map((r) => r.ID));
  }
  return [...new Set(ids)];
}

/**
 * シード: アーキタイプ新規登録画面で入力して「新規登録」を押す。アーキタイプ管理で名前を検索し、ID列の番号を返す
 * （名前が1件に決まらなければ止める。登録後に開いた編集画面の番号と同じことも確かめる）。
 */
export async function アーキタイプを登録する(page: Page, v: アーキタイプ入力 & { 名日: string; 名英: string }, issue: Issue): Promise<string> {
  const e = new アーキタイプ編集画面(page);
  await e.新規を開く();
  await e.入力する(v);
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, `アーキタイプ「${v.名日}」の登録`)) issue(`アーキタイプ「${v.名日}」の登録時の警告「${w}」`);
  const 開いた = e.アーキタイプID();
  const ids = await 名前でIDを読む(page, v.名日);
  if (ids.length !== 1) throw new Error(`アーキタイプ「${v.名日}」を登録したが、アーキタイプ管理の検索で1件に決まらない（${ids.length}件: ${ids.join("、")}）`);
  if (ids[0] !== 開いた) throw new Error(`アーキタイプ「${v.名日}」: 検索結果のID ${ids[0]} と、登録後に開いた編集画面の番号 ${開いた} が違う`);
  return ids[0];
}

/** 編集画面に表示されている値（シードの確かめ用） */
export async function 編集画面の値(page: Page, id: string): Promise<{ 名日: string; 名英: string; 解説日: string; 解説英: string; 代表カードID: string; 公開状態: string[]; カラー: string[]; フォーマット: string[]; タグ: string[] }> {
  const e = new アーキタイプ編集画面(page);
  const st = await e.編集を開く(id);
  if (st !== 200) throw new Error(`アーキタイプID ${id} の編集画面を開けない（応答 ${st}）`);
  return {
    名日: await e.名日.inputValue(), 名英: await e.名英.inputValue(), 解説日: await e.解説日.inputValue(), 解説英: await e.解説英.inputValue(),
    代表カードID: await e.代表カードID.inputValue(), 公開状態: await e.選択中(e.公開状態), カラー: await e.選ばれたカラー(),
    フォーマット: await e.選択中(e.フォーマット), タグ: await e.選択中(e.タグ),
  };
}

/** シード: 代表カード検索（アーキタイプ新規登録画面から開く）で語を検索し、全ページの行を読む */
export async function 代表カードを全ページ読む(page: Page, 語: string, opt: { 完全一致?: boolean } = {}): Promise<代表カードの行[]> {
  const e = new アーキタイプ編集画面(page);
  await e.新規を開く();
  await e.代表カード検索を開く();
  let body = await e.代表カードを検索する(語, opt);
  const out = await e.代表カード検索の結果();
  for (let i = 1; i < body.totalPages; i++) {
    body = await e.代表カード検索の次へ();
    out.push(...await e.代表カード検索の結果());
  }
  return out;
}
