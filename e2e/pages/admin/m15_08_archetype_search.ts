/**
 * M15-08 アーキタイプ検索（管理画面）の画面部品。セレクタはここだけに置く。
 * アーキタイプ登録/編集画面の部品は M15-09 が持つ。ここにはシードで使う最小の登録の操作（新規登録・CSV取り込み）だけを置く。
 *
 * 画面の表示名（アプリの翻訳ファイルと画面の作りで確かめたもの）:
 * - 検索ボタンは「検索する」（正本の「検索する >」の「 >」は画面に無い）。上部のボタンは「新規登録」「CSV取り込み」（検索入力・検索結果の両方の画面に出る）
 * - 並べかえの項目は「アーキタイプID」「アーキタイプ名」「登録アーキタイプ数」、ソート順は「昇順」「降順」、件数は「10件」の形
 * - 該当件数は「検索結果 N 件 が該当しました」、該当が無いときは「検索条件に合致するデータが見つかりませんでした」
 * - 行の右端のボタン「…」で開くメニューは「編集」「削除」。削除は確認ダイアログ（「このアーキタイプを削除してもよろしいですか？」）
 * - 検索入力画面のアドレスは /archetype、検索結果画面は /archetype/search/{ページ番号}
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

type Issue = (m: string) => void;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (s: string) => new RegExp(`^\\s*${esc(s)}\\s*$`);
export const pathOf = (url: string): string => new URL(url).pathname;
export const 検索入力のパス = (): string => pathOf(adminUrl("/archetype"));
export const 検索結果のパス = (n: number): string => pathOf(adminUrl(`/archetype/search/${n}`));
export const 新規登録のパス = (): string => pathOf(adminUrl("/archetype/new"));
export const 編集のパス = (id: string): string => pathOf(adminUrl(`/archetype/${id}/edit`));
export const CSV取り込みのパス = (): string => pathOf(adminUrl("/archetype/csv_import"));

/** 検索結果の1件（画面の2行で1件。上の行の値と、下の行の説明） */
export type 結果の行 = {
  ID: string; 名日: string; 名英: string; カラー: string; フォーマット: string; 登録デッキ数: string;
  画像あり: boolean; 画像の欄: string; 説明: string;
};

export type 検索条件の値 = { アーキタイプ名: string; フォーマット: string[]; カラー: string[]; デッキタグ: string[] };

export class ArchetypeSearchPage {
  constructor(readonly page: Page) {}

  get form(): Locator { return this.page.locator("form#admin_search_archetype"); }
  get アーキタイプ名(): Locator { return this.page.locator('[name="admin_search_archetype[multi]"]'); }
  get フォーマット(): Locator { return this.page.locator('select[name="admin_search_archetype[formats][]"]'); }
  get デッキタグ(): Locator { return this.page.locator('select[name="admin_search_archetype[deck_tags][]"]'); }
  get カラーの欄(): Locator { return this.page.locator(".archetype-search-check .form-check"); }
  get 並び順の隠し欄(): Locator { return this.page.locator('[name="admin_search_archetype[sortOrder]"]'); }
  get 検索するボタン(): Locator { return this.form.locator('button[type="submit"]').filter({ hasText: exact("検索する") }); }
  get 新規登録ボタン(): Locator { return this.page.locator(".c-contentsArea__cols a.btn").filter({ hasText: exact("新規登録") }); }
  get CSV取り込みボタン(): Locator { return this.page.locator(".c-contentsArea__cols a.btn").filter({ hasText: exact("CSV取り込み") }); }
  get 一覧(): Locator { return this.page.locator("table.archetype-result-table"); }
  get 該当件数の表示(): Locator { return this.page.locator("span.fw-bold").filter({ hasText: /検索結果/ }); }
  get 該当なしの表示(): Locator { return this.page.getByText("検索条件に合致するデータが見つかりませんでした"); }
  get ページ送り(): Locator { return this.page.locator("ul.pagination"); }
  get 件数(): Locator { return this.page.locator("#page_count_pulldown"); }
  get 並べかえの項目(): Locator { return this.page.locator("#sort_key_pulldown"); }
  get ソート順(): Locator { return this.page.locator("#sort_order_pulldown"); }
  get エラーの帯(): Locator { return this.page.locator(".alert-danger"); }

  /** アーキタイプ管理(検索入力)画面を開く（メニューの「アーキタイプ一覧」と同じアドレス） */
  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/archetype"));
    await this.読み込みを待つ();
  }

  /** 検索結果画面の n ページ目を、検索条件を渡さずに開く。応答のステータスを返す */
  async 結果のページを直接開く(n: number): Promise<number> {
    const res = await this.page.goto(adminUrl(`/archetype/search/${n}`));
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 画面の読み込みと、選択欄（select2）の仕掛けが動いた状態まで待つ */
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.アーキタイプ名, "アーキタイプ管理画面のアーキタイプ名の欄").toBeVisible();
    await expect(this.page.locator(".select2-container").first(), "選択欄の表示（画面の仕掛け）").toBeAttached();
  }

  async 名前を入れる(語: string): Promise<void> { await this.アーキタイプ名.fill(語); }

  /** 「検索する」を押し、移った画面の読み込みを待つ */
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.検索するボタン.click()]);
    await this.page.waitForLoadState("load");
  }

  /** アーキタイプ名を入れて「検索する」を押す */
  async 名前で検索する(語: string): Promise<void> {
    await this.名前を入れる(語);
    await this.検索する();
  }

  /** select2 の複数選択欄で、表示名が一致する候補を選ぶ（利用者と同じく、欄を押して語を入れ、候補を押す） */
  private async 複数選択で選ぶ(sel: Locator, 名: string): Promise<void> {
    const box = sel.locator("xpath=following-sibling::span[contains(@class,'select2-container')][1]");
    await box.locator(".select2-selection").click();
    const search = box.locator(".select2-search__field");
    await search.fill(名);
    const opt = this.page.locator(".select2-container--open .select2-results__option").filter({ hasText: exact(名) });
    await expect(opt.first(), `選択欄の候補「${名}」`).toBeVisible();
    await opt.first().click();
    await this.page.keyboard.press("Escape").catch(() => undefined);
  }

  async フォーマットを選ぶ(名: string[]): Promise<void> { for (const n of 名) await this.複数選択で選ぶ(this.フォーマット, n); }
  async デッキタグを選ぶ(名: string[]): Promise<void> { for (const n of 名) await this.複数選択で選ぶ(this.デッキタグ, n); }
  async カラーを選ぶ(名: string[]): Promise<void> {
    for (const n of 名) {
      const item = this.カラーの欄.filter({ has: this.page.locator("label").filter({ hasText: exact(n) }) });
      await expect(item, `カラー「${n}」の欄`).toHaveCount(1);
      await item.locator('input[type="checkbox"]').check();
    }
  }

  /** カラーの欄の表示名と値（値＝画面が持つカラーの番号。画面には表示されない） */
  async カラーの選択肢(): Promise<{ 名: string; 値: string }[]> {
    return this.カラーの欄.evaluateAll((items) => items.map((it) => ({
      名: (it.querySelector("label")?.textContent ?? "").trim(),
      値: (it.querySelector("input") as HTMLInputElement | null)?.value ?? "",
    })));
  }
  /** デッキタグの選択肢の表示名と値 */
  async デッキタグの選択肢(): Promise<{ 名: string; 値: string }[]> {
    return this.デッキタグ.locator("option").evaluateAll((os) => os.map((o) => ({ 名: (o.textContent ?? "").trim(), 値: (o as HTMLOptionElement).value })));
  }

  /** いま検索条件の欄に入っている値 */
  async 検索条件(): Promise<検索条件の値> {
    const selected = (sel: Locator) => sel.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).selected).map((o) => (o.textContent ?? "").trim()));
    return {
      アーキタイプ名: await this.アーキタイプ名.inputValue(),
      フォーマット: await selected(this.フォーマット),
      カラー: await this.カラーの欄.evaluateAll((items) => items.filter((it) => (it.querySelector("input") as HTMLInputElement | null)?.checked).map((it) => (it.querySelector("label")?.textContent ?? "").trim())),
      デッキタグ: await selected(this.デッキタグ),
    };
  }

  /** 検索条件の欄の見出しと、入力欄の項目名（name）。旧アーキタイプIDの項目の有無を見るため */
  async 検索条件の見出し(): Promise<string[]> {
    return this.form.locator("label").evaluateAll((ls) => ls.map((l) => (l.textContent ?? "").trim()).filter(Boolean));
  }
  async 検索条件の項目名(): Promise<string[]> {
    return this.form.locator("input, select, textarea").evaluateAll((es) => es.map((e) => e.getAttribute("name") ?? "").filter(Boolean));
  }

  /** 検索条件欄のうち、旧アーキタイプIDに当たる見出し（「旧」を含む）と入力項目（項目名に old を含む） */
  async 旧アーキタイプIDの欄(): Promise<{ 見出し: string[]; 項目: string[] }> {
    return {
      見出し: (await this.検索条件の見出し()).filter((l) => /旧/.test(l)),
      項目: (await this.検索条件の項目名()).filter((n) => /old/i.test(n)),
    };
  }

  /** 「検索結果 N 件」の N（表示が無ければ null） */
  async 該当件数(): Promise<number | null> {
    if ((await this.該当件数の表示.count()) === 0) return null;
    const m = /検索結果\s*(\d+)\s*件/.exec(await this.該当件数の表示.first().innerText());
    return m ? Number(m[1]) : null;
  }

  /** 検索結果の一覧の行（1件＝画面の2行） */
  async 結果の行(): Promise<結果の行[]> {
    if ((await this.一覧.count()) === 0) return [];
    return this.一覧.locator("tbody").evaluate((tb) => {
      const trs = [...tb.querySelectorAll(":scope > tr")];
      const out: { ID: string; 名日: string; 名英: string; カラー: string; フォーマット: string; 登録デッキ数: string; 画像あり: boolean; 画像の欄: string; 説明: string }[] = [];
      for (let i = 0; i < trs.length; i++) {
        const tds = trs[i].querySelectorAll(":scope > td");
        if (tds.length < 6) continue;
        const name = (tds[2].textContent ?? "").replace(/\s+/g, " ").trim();
        const k = name.lastIndexOf(" / ");
        const next = trs[i + 1]?.querySelectorAll(":scope > td");
        out.push({
          ID: (tds[1].textContent ?? "").trim(),
          名日: k >= 0 ? name.slice(0, k).trim() : name,
          名英: k >= 0 ? name.slice(k + 3).trim() : "",
          カラー: (tds[3].textContent ?? "").trim(),
          フォーマット: (tds[4].textContent ?? "").trim(),
          登録デッキ数: (tds[5].textContent ?? "").trim(),
          画像あり: !!tds[0].querySelector("img"),
          画像の欄: (tds[0].textContent ?? "").trim(),
          説明: next && next.length === 1 ? (next[0].textContent ?? "").trim() : "",
        });
      }
      return out;
    });
  }
  async 結果のID(): Promise<string[]> { return (await this.結果の行()).map((r) => r.ID); }

  /** アーキタイプIDの行（上の行）。見つからなければ 0 件の Locator */
  行(id: string): Locator {
    return this.一覧.locator("tbody > tr").filter({ has: this.page.locator(":scope > td:nth-child(2)", { hasText: exact(id) }) });
  }

  /** 選んでいる件数（「10件」の形）と、ページ送りで選んでいるページ番号（ページ送りが無ければ null） */
  async 選択中の件数(): Promise<string> { return (await this.件数.locator("option:checked").innerText()).trim(); }
  async 現在のページ(): Promise<string | null> {
    const a = this.ページ送り.locator(".page-item.active");
    return (await a.count()) ? (await a.first().innerText()).trim() : null;
  }
  async 選択中の並べかえ(): Promise<{ 項目: string; ソート順: string }> {
    return {
      項目: (await this.並べかえの項目.locator("option:checked").innerText()).trim(),
      ソート順: (await this.ソート順.locator("option:checked").innerText()).trim(),
    };
  }

  /** 件数の選択欄で「n件」を選ぶ（選ぶと画面が開き直る） */
  async 件数を選ぶ(n: string): Promise<void> {
    await expect(this.件数, "件数の選択欄").toBeVisible();
    if ((await this.選択中の件数()) === `${n}件`) return;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), chooseByLabel(this.件数, `${n}件`)]);
    await this.page.waitForLoadState("load");
  }

  /** 並べかえの項目を選ぶ（選ぶと画面が検索し直す）。いまの選択と同じなら何もしない。送ったら true */
  async 項目を選ぶ(項目: string): Promise<boolean> {
    await expect(this.並べかえの項目, "並べかえの項目の選択欄").toBeVisible();
    if ((await this.選択中の並べかえ()).項目 === 項目) return false;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), chooseByLabel(this.並べかえの項目, 項目)]);
    await this.page.waitForLoadState("load");
    return true;
  }
  /** ソート順を選ぶ（選ぶと画面が検索し直す）。いまの選択と同じなら何もしない。送ったら true */
  async ソート順を選ぶ(順: "昇順" | "降順"): Promise<boolean> {
    await expect(this.ソート順, "ソート順の選択欄").toBeVisible();
    if ((await this.選択中の並べかえ()).ソート順 === 順) return false;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), chooseByLabel(this.ソート順, 順)]);
    await this.page.waitForLoadState("load");
    return true;
  }

  /** ページ送りで n ページ目を押す */
  async ページを開く(n: number): Promise<void> {
    const link = this.ページ送り.locator("a.page-link").filter({ hasText: exact(String(n)) });
    await expect(link.first(), `ページ送りの「${n}」`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.first().click()]);
    await this.page.waitForLoadState("load");
  }

  /** 開発者ツールで、件数の選択欄へ「25件」（page_count=25）の選択肢を足して選ぶ（選ぶと画面が開き直る） */
  async 件数25の要求を送る(): Promise<string> {
    await expect(this.件数, "件数の選択欄").toHaveCount(1);
    const nav = this.page.waitForNavigation({ waitUntil: "load" });
    await this.件数.evaluate((node) => {
      const field = node as HTMLSelectElement;
      if (!field.options.length) throw new Error("件数の選択欄に選択肢が無い");
      const url = new URL(field.options[0].value, window.location.href);
      if (!url.searchParams.has("page_count")) throw new Error("件数の選択肢のアドレスに表示件数が無い");
      url.searchParams.set("page_count", "25");
      const option = new Option("25件", `${url.pathname}${url.search}${url.hash}`);
      field.add(option);
      field.value = option.value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await nav;
    await this.page.waitForLoadState("load");
    return this.page.url();
  }

  /** 開発者ツールで、検索の要求の並び順を書き換える（検索欄の隠し項目の値を変える） */
  async 並び順を書き換える(値: string): Promise<void> {
    await expect(this.並び順の隠し欄, "検索の要求の並び順の項目").toHaveCount(1);
    await this.並び順の隠し欄.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }

  /** 行の右端のボタン「…」を押して、開いたメニューを返す */
  async メニューを開く(id: string): Promise<Locator> {
    const row = this.行(id);
    await expect(row, `アーキタイプID ${id} の行`).toHaveCount(1);
    await row.locator("button.dropdown-menu-toggle").click();
    return row.locator(".dropdown-menu");
  }
  /** メニューの項目の表示名 */
  async メニューの項目(menu: Locator): Promise<string[]> {
    return menu.locator(".dropdown-item").evaluateAll((es) => es.map((e) => (e.textContent ?? "").trim()));
  }
  /** メニューの「編集」のリンク先のパス */
  async メニューの編集のパス(menu: Locator): Promise<string> {
    const href = await menu.locator("a.dropdown-item").filter({ hasText: exact("編集") }).first().getAttribute("href");
    return href ? pathOf(new URL(href, this.page.url()).toString()) : "";
  }
  /** メニューの「削除」を押し、確認ダイアログで OK を押す。ダイアログの文を返す */
  async メニューから削除する(menu: Locator): Promise<string> {
    let 文 = "";
    this.page.once("dialog", (d) => { 文 = d.message(); void d.accept(); });
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "load" }),
      menu.locator("button.dropdown-item").filter({ hasText: exact("削除") }).click(),
    ]);
    await this.page.waitForLoadState("load");
    return 文;
  }

  /**
   * メニューの「削除」を押し、確認ダイアログが出るまで待つ（ダイアログはまだ閉じない）。
   * 返す OK() で確認ダイアログの「OK」を押し、移った画面の読み込みを待つ。
   */
  async 削除を押す(menu: Locator): Promise<{ 文: string; OK: () => Promise<void> }> {
    const dialog = this.page.waitForEvent("dialog");
    const click = menu.locator("button.dropdown-item").filter({ hasText: exact("削除") }).click();
    const d = await dialog;
    return {
      文: d.message(),
      OK: async () => {
        await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), d.accept()]);
        await click;
        await this.page.waitForLoadState("load");
      },
    };
  }

  /** 行のアーキタイプ名（リンク）を押す */
  async 名前を押す(id: string): Promise<void> {
    const link = this.行(id).locator(":scope > td:nth-child(3) a");
    await expect(link, `アーキタイプID ${id} の行のアーキタイプ名`).toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  }

  /** 上部の「新規登録」「CSV取り込み」を押す */
  async 新規登録を押す(): Promise<void> {
    await expect(this.新規登録ボタン, "「新規登録」のボタン").toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.新規登録ボタン.click()]);
  }
  async CSV取り込みを押す(): Promise<void> {
    await expect(this.CSV取り込みボタン, "「CSV取り込み」のボタン").toHaveCount(1);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.CSV取り込みボタン.click()]);
  }
}

// ---- 遷移先の画面（見るだけ） ----

/** アーキタイプ編集画面（登録・編集）の見出しの部品 */
export function アーキタイプ編集の名日欄(page: Page): Locator { return page.locator('[name="admin_archetype[nameJp]"]'); }
export function アーキタイプ編集の送信ボタン(page: Page): Locator { return page.locator('button[type="submit"][form="admin_archetype"]'); }
/** アーキタイプ登録CSVアップロード画面のファイル選択とアップロードのボタン */
export function CSVアップロードのファイル欄(page: Page): Locator { return page.locator("#upload-form input[type=file]"); }
export function CSVアップロードのボタン(page: Page): Locator { return page.locator("#upload-button"); }
/** 画面の題名（ページの見出し） */
export async function 画面の題名(page: Page): Promise<string> {
  const h = page.locator("h2.c-pageTitle__title").first();
  return (await h.count()) ? (await h.innerText()).trim() : "";
}

// ---- シード用 ----

export type アーキタイプ内容 = {
  名日: string; 名英: string; フォーマット: string;
  カラー?: string[]; タグ?: string[]; 解説日?: string;
  /** 代表カードを選ぶ。選んだ代表カード画像の番号を返す */
  代表カードを選ぶ?: boolean;
};

/**
 * シード: 検索入力画面の「新規登録」を押し、アーキタイプ編集画面で入れて「新規登録」を押す。
 * 代表カードを選んだときは、その代表カード画像の番号を返す（選ばなければ空）。
 */
export async function アーキタイプを新規登録する(page: Page, v: アーキタイプ内容, what: string, issue: Issue): Promise<string> {
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  await s.新規登録を押す();
  await expect(アーキタイプ編集の名日欄(page), `${what}: アーキタイプ編集(登録)画面`).toBeVisible();
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"], [name="admin_archetype[${n}][]"]`).first();
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  if (v.解説日 !== undefined) await f("commentJp").fill(v.解説日);
  let 画像ID = "";
  if (v.代表カードを選ぶ) 画像ID = await 代表カードを選ぶ(page, what);
  await chooseByLabel(f("Disp"), "公開");
  for (const c of v.カラー ?? []) {
    const item = page.locator(".archetype-colors .form-check").filter({ has: page.locator("label").filter({ hasText: exact(c) }) });
    await expect(item, `${what}: アーキタイプ編集画面のカラー「${c}」`).toHaveCount(1);
    await item.locator('input[type="checkbox"]').check();
  }
  await chooseByLabel(f("Format"), v.フォーマット);
  if (v.タグ?.length) await f("DeckTags").selectOption(v.タグ.map((label) => ({ label })));
  const button = アーキタイプ編集の送信ボタン(page);
  await expect(button, `${what}: アーキタイプ編集(登録)画面の「新規登録」`).toHaveText(/^\s*新規登録\s*$/);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  for (const w of await expectSaved(page, `${what}: アーキタイプ「${v.名日}」の登録`)) issue(`アーキタイプ「${v.名日}」の登録時の警告「${w}」`);
  return 画像ID;
}

/**
 * シード: 「代表カード選択」を押し、代表カード検索で、検索結果の先頭のカードの名前で検索し直して、先頭の行の「決定」を押す。
 * 選んだ行のID列の番号（代表カード画像の番号）を返す。
 */
async function 代表カードを選ぶ(page: Page, what: string): Promise<string> {
  await page.locator('[data-bs-target="#searchCardImageModal"]').click();
  const m = page.locator("#searchCardImageModal");
  await expect(m, `${what}: 代表カード検索の画面`).toBeVisible();
  const rows = m.locator("#card_image_search_results tbody tr");
  await m.locator("#btn_search_card_image").click();
  await expect(rows.first(), `${what}: 代表カード検索の結果`).toBeVisible({ timeout: 30_000 });
  const 表示名 = (await rows.first().locator("td").nth(1).innerText()).trim();
  const k = 表示名.lastIndexOf(" / ");
  const カード名 = k >= 0 ? 表示名.slice(k + 3).trim() : 表示名;
  await m.locator("#card_image_search_word").fill(カード名);
  const res = page.waitForResponse((r) => r.url().includes("/archetype/search_card_image"));
  await m.locator("#btn_search_card_image").click();
  await res;
  await expect(rows.first(), `${what}: 代表カード検索の結果（「${カード名}」）`).toBeVisible({ timeout: 30_000 });
  const id = (await rows.first().locator("td").first().innerText()).trim();
  await rows.first().locator("button.select-card-image").click();
  await expect(m).toBeHidden();
  if (!/^\d+$/.test(id)) throw new Error(`${what}: 代表カード検索の行のIDが読めない（${id}）`);
  return id;
}

/**
 * シード: 検索入力画面でアーキタイプ名(日)を検索し、アーキタイプ名(日)・(英)・フォーマットが一致する行のIDを返す（1件でなければ止める）。
 * 一覧は既定でアーキタイプIDの降順なので、いま登録したものは1ページ目に出る。
 */
export async function 名前でIDを読む(page: Page, v: { 名日: string; 名英: string; フォーマット: string }, what: string): Promise<string> {
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  await s.名前で検索する(v.名日);
  const hit = (await s.結果の行()).filter((r) => r.名日 === v.名日 && r.名英 === v.名英 && r.フォーマット === v.フォーマット);
  if (hit.length !== 1) throw new Error(`${what}: アーキタイプ名「${v.名日}」で検索した結果の該当行（${v.名英}・${v.フォーマット}）が ${hit.length} 件`);
  return hit[0].ID;
}

/**
 * シード: 検索入力画面で条件を入れて検索し、該当行を、行のメニューの「削除」→確認ダイアログの「OK」で1件ずつ消す。消した件数を返す。
 * 紐づくデッキがあって消せない行が出たときは止める（印つきの名前は実行ごとに違うので、前の実行の残りには当たらない）。
 */
export async function 該当を消す(
  page: Page, 条件: { 名?: string; フォーマット?: string[]; カラー?: string[]; デッキタグ?: string[] }, what: string,
): Promise<number> {
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  if (条件.名 !== undefined) await s.名前を入れる(条件.名);
  if (条件.フォーマット?.length) await s.フォーマットを選ぶ(条件.フォーマット);
  if (条件.カラー?.length) await s.カラーを選ぶ(条件.カラー);
  if (条件.デッキタグ?.length) await s.デッキタグを選ぶ(条件.デッキタグ);
  await s.検索する();
  let n = 0;
  for (let i = 0; i < 200; i++) {
    const rows = await s.結果の行();
    if (rows.length === 0) {
      if ((await s.該当件数()) === 0 || (await s.該当なしの表示.count()) > 0) return n;
      throw new Error(`${what}: 消したあとの検索結果が読めない（${page.url()}）`);
    }
    const menu = await s.メニューを開く(rows[0].ID);
    await s.メニューから削除する(menu);
    const err = (await s.エラーの帯.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    const p = pathOf(page.url());
    if (err.length || !(p === 検索入力のパス() || p.startsWith(`${検索入力のパス()}/search/`))) {
      throw new Error(`${what}: アーキタイプID ${rows[0].ID}（${rows[0].名日}）を削除できない: ${err.join(" / ") || page.url()}`);
    }
    n++;
  }
  throw new Error(`${what}: 200件消しても該当が0件にならない`);
}

/**
 * シード: 検索入力画面の「CSV取り込み」を押し、アーキタイプ登録CSVアップロード画面でファイルを選んで「CSVファイルをアップロード」を押す。
 * 行は [アーキタイプ名（日本語）, アーキタイプ名（英語）, 代表カード名, 色, フォーマット]。
 */
export async function アーキタイプCSVを取り込む(page: Page, rows: string[][], fileName: string, what: string, issue: Issue): Promise<void> {
  const head = ["アーキタイプ名（日本語）", "アーキタイプ名（英語）", "代表カード名", "色", "フォーマット"];
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = Buffer.from(`${[head, ...rows].map((r) => r.map(cell).join(",")).join("\n")}\n`, "utf8");
  const s = new ArchetypeSearchPage(page);
  await s.開く();
  await s.CSV取り込みを押す();
  await CSVアップロードのファイル欄(page).setInputFiles({ name: fileName, mimeType: "text/csv", buffer: csv });
  await expect(CSVアップロードのボタン(page), `${what}: 「CSVファイルをアップロード」が押せる`).toBeEnabled();
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), CSVアップロードのボタン(page).click()]);
  for (const w of await expectSaved(page, `${what}: アーキタイプ登録CSVのアップロード`)) issue(`アーキタイプ登録CSVの警告「${w}」`);
}

/**
 * シード（表示件数マスタ）: システム設定のマスタデータ管理で、管理画面一覧の表示件数のマスタの「25」の行の ID と Name を空にして保存する。
 * 25 の行が無ければ何もしない。消したら true。
 */
export async function 表示件数25を外す(page: Page, issue: Issue): Promise<boolean> {
  await page.goto(adminUrl("/setting/system/masterdata"));
  const master = page.locator("#admin_system_masterdata_masterdata");
  await master.selectOption({ label: "mtb_page_max" });
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("form#form1 button[type=submit]").click()]);
  await expect(page.locator("form#form2"), "表示件数のマスタの一覧").toBeVisible();
  const rows = page.locator("form#form2 tbody tr").filter({ has: page.locator('input[name$="[name]"]') });
  let hit = false;
  for (const row of await rows.all()) {
    if ((await row.locator('input[name$="[name]"]').inputValue()) !== "25") continue;
    await row.locator('input[name$="[id]"]').fill("");
    await row.locator('input[name$="[name]"]').fill("");
    hit = true;
  }
  if (!hit) return false;
  await page.locator("form#form2 button[type=submit]").click();
  for (const w of await expectSaved(page, "表示件数 25 の削除")) issue(w);
  return true;
}
