/**
 * M14-09 フォーマット一覧（メニュー「カード管理」→「フォーマット一覧」）と、フォーマット詳細(登録・編集・削除)画面の操作。
 * シード（seeds/m14-09.ts）とテスト（spec/m14/m14-09.spec.ts）が使う。セレクタはここだけに置く。
 *
 * 画面の作り（実ソースの Twig・Controller で確かめたもの）:
 * - 一覧は絞り込み・ページ送りが無く、並び順の昇順・同じ並び順は登録の早い順。表の列は「フォーマット名」「略称」「認定」と操作の列。
 *   フォーマット名は「日本語名 / 英語名」のリンクで、フォーマット詳細画面を開く。認定も「日本語名 / 英語名」（無ければ空欄）。
 * - 行の3点リーダーを押すと「編集」（フォーマット詳細画面へのリンク）と「削除」が出る。「削除」は確認のポップアップを出し、
 *   ポップアップの「削除」ボタン（正本の「実行」）で削除の要求を送る。成功・失敗とも一覧へ戻す（画面上部にメッセージ）。
 * - フォーマット詳細画面の送信ボタンは、登録・更新とも表示名「登録」（正本の「フォーマット登録」「フォーマット更新」）。
 *   一覧へ戻るリンクの表示名は「フォーマット管理」（正本の「フォーマット一覧」）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

type Issue = (m: string) => void;

export const pathOf = (url: string): string => new URL(url).pathname;
export const フォーマット一覧のパス = (): string => pathOf(adminUrl("/format"));
export const フォーマット登録のパス = (): string => pathOf(adminUrl("/format/new"));
export const フォーマット詳細のパス = (id: string): string => pathOf(adminUrl(`/format/${id}/edit`));
export const フォーマット削除のパス = (id: string): string => pathOf(adminUrl(`/product/format/${id}/delete`));
/** カードセット詳細(編集・削除)画面のアドレスの形 */
export const カードセット詳細のパスの形 = (): RegExp => new RegExp(`^${pathOf(adminUrl("/cardset"))}/\\d+/edit$`);

/** 画面上部のメッセージ（開発用の設定のときに常に出る帯は除く） */
export async function 画面上部のメッセージ(page: Page): Promise<{ 成功: string[]; エラー: string[] }> {
  const read = async (l: Locator) => (await l.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効"));
  return { 成功: await read(page.locator(".alert-success")), エラー: await read(page.locator(".alert-danger")) };
}

export type 一覧の行 = { フォーマットID: string; フォーマット名: string; 略称: string; 認定: string };

/** 削除の要求を送った結果 */
export type 削除の結果 = { 要求の応答: number; 移った画面の応答: number | null; 移った画面: string };

export class FormatListPage {
  readonly 表: Locator;
  readonly 見出し行: Locator;
  readonly データ行: Locator;
  readonly 新規登録ボタン: Locator;
  readonly 削除ポップアップ: Locator;
  readonly ポップアップの削除ボタン: Locator;

  constructor(readonly page: Page) {
    this.表 = page.locator(".c-primaryCol table.table");
    this.見出し行 = this.表.locator("thead tr");
    this.データ行 = this.表.locator("tbody tr");
    this.新規登録ボタン = page.locator(".c-primaryCol a.btn-ec-regular").filter({ hasText: /^\s*新規登録\s*$/ });
    this.削除ポップアップ = page.locator("#DeleteModal");
    this.ポップアップの削除ボタン = this.削除ポップアップ.locator('a.btn-ec-delete[data-method="delete"]');
  }

  /** フォーマット一覧画面を開く（表の見出しが出るまで待つ） */
  async open(): Promise<void> {
    const res = await this.page.goto(adminUrl("/format"));
    expect(res?.status() ?? 0, "フォーマット一覧画面の応答").toBe(200);
    await this.page.waitForLoadState("load");
    await this.表示を待つ();
  }

  async 表示を待つ(): Promise<void> {
    await expect(this.見出し行, "フォーマット一覧の表の見出し行").toBeVisible();
  }

  /** 一覧の行（上から）。フォーマットIDはフォーマット名のリンクの行き先から読む */
  async 行(): Promise<一覧の行[]> {
    return this.データ行.evaluateAll((trs) => trs.map((tr) => {
      const tds = Array.from(tr.querySelectorAll(":scope > td"));
      const link = tds[0]?.querySelector("a");
      const id = /\/format\/(\d+)\/edit/.exec(link?.getAttribute("href") ?? "")?.[1] ?? "";
      const text = (el?: Element) => ((el as HTMLElement | undefined)?.innerText ?? "").replace(/\s+/g, " ").trim();
      return { フォーマットID: id, フォーマット名: text(tds[0]), 略称: text(tds[1]), 認定: text(tds[2]) };
    }));
  }

  async 行のフォーマットID(): Promise<string[]> {
    return (await this.行()).map((r) => r.フォーマットID);
  }

  /** フォーマット名(日)がちょうど一致する行のフォーマットID */
  async 名で探す(名日: string): Promise<string[]> {
    return (await this.行()).filter((r) => r.フォーマット名.split(" / ")[0].trim() === 名日).map((r) => r.フォーマットID);
  }

  行のフォーマット(id: string): Locator {
    return this.データ行.filter({ has: this.page.locator(`td:first-child a[href$="/format/${id}/edit"]`) });
  }

  フォーマット名リンク(id: string): Locator {
    return this.行のフォーマット(id).locator(`td:first-child a[href$="/format/${id}/edit"]`);
  }

  /** 行の3点リーダーを押したときに出るメニューの項目（表示名がちょうど一致するもの） */
  メニューの項目(id: string, 名: string): Locator {
    return this.行のフォーマット(id).locator(".dropdown-menu a").filter({ hasText: new RegExp(`^\\s*${名}\\s*$`) });
  }

  async 三点リーダーを押す(id: string): Promise<void> {
    const row = this.行のフォーマット(id);
    await expect(row, `フォーマットID ${id} の行`).toHaveCount(1);
    await row.locator("button.dropdown-menu-toggle").click();
  }

  /** 3点リーダーを開いたあと「編集」を押し、移った画面の読み込みを待つ */
  async 編集を押す(id: string): Promise<void> {
    const item = this.メニューの項目(id, "編集");
    await expect(item, `フォーマットID ${id} のメニューの「編集」`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), item.click()]);
  }

  /** フォーマット名のリンクを押し、移った画面の読み込みを待つ */
  async フォーマット名を押す(id: string): Promise<void> {
    const link = this.フォーマット名リンク(id);
    await expect(link, `フォーマットID ${id} のフォーマット名のリンク`).toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
  }

  /** 「新規登録」を押し、移った画面の読み込みを待つ */
  async 新規登録を押す(): Promise<void> {
    await expect(this.新規登録ボタン, "「新規登録」ボタン").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.新規登録ボタン.click()]);
  }

  /**
   * 3点リーダーを開いたあと「削除」を押し、確認のポップアップが開いて削除の送り先が入るまで待つ。
   * 送り先（ポップアップの「削除」ボタンの行き先）は、ポップアップが開き終わったときに画面のスクリプトが入れる。
   */
  async 削除を押す(id: string): Promise<void> {
    const item = this.メニューの項目(id, "削除");
    await expect(item, `フォーマットID ${id} のメニューの「削除」`).toBeVisible();
    await item.click();
    await expect(this.削除ポップアップ, "削除の確認ポップアップ").toBeVisible();
    await expect.poll(async () => this.削除の送り先(), "削除の確認ポップアップの「削除」ボタンの送り先（ポップアップが開き終わると入る）").toBe(フォーマット削除のパス(id));
  }

  /** ポップアップの「削除」ボタンの送り先のパス */
  async 削除の送り先(): Promise<string> {
    const href = (await this.ポップアップの削除ボタン.getAttribute("href")) ?? "#";
    return pathOf(new URL(href, this.page.url()).href);
  }

  /** 開発者ツールで行うのと同じに、ポップアップの「削除」ボタンの送り先の、対象のフォーマット識別子を書き換える */
  async 削除の対象を書き換える(id: string): Promise<void> {
    const to = adminUrl(`/product/format/${id}/delete`);
    await this.ポップアップの削除ボタン.evaluate((a, href) => a.setAttribute("href", href), to);
    expect(await this.削除の送り先(), "書き換えた削除の送り先").toBe(フォーマット削除のパス(id));
  }

  /** 開発者ツールで行うのと同じに、ポップアップの「削除」ボタンが送るなりすまし対策トークンを書き換える */
  async 削除のトークンを書き換える(token: string): Promise<void> {
    await expect(this.ポップアップの削除ボタン, "ポップアップの「削除」ボタンのなりすまし対策トークン").toHaveAttribute("token-for-anchor", /.+/);
    await this.ポップアップの削除ボタン.evaluate((a, t) => a.setAttribute("token-for-anchor", t), token);
    await expect(this.ポップアップの削除ボタン, "書き換えたなりすまし対策トークン").toHaveAttribute("token-for-anchor", token);
  }

  /** ポップアップの「削除」ボタン（正本の「実行」）を押す。削除の要求の応答と、移った画面を返す */
  async ポップアップで削除を実行する(): Promise<削除の結果> {
    await expect(this.ポップアップの削除ボタン, "削除の確認ポップアップの「削除」ボタン").toHaveText(/^\s*削除\s*$/);
    const 送り先 = await this.削除の送り先();
    const requested = this.page.waitForResponse((r) => r.request().method() === "POST" && pathOf(r.url()) === 送り先, { timeout: 120_000 });
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 120_000 });
    await this.ポップアップの削除ボタン.click();
    const [response, landed] = await Promise.all([requested, nav]);
    return { 要求の応答: response.status(), 移った画面の応答: landed?.status() ?? null, 移った画面: pathOf(this.page.url()) };
  }
}

// ---------------------------------------------------------------------------
// フォーマット詳細(登録・編集・削除)画面
// ---------------------------------------------------------------------------

export type フォーマット入力 = { 名日?: string; 名英?: string; コード?: string; 認定?: string; 並び順?: string; メタゲーム分析日数?: string };

export class FormatDetailPage {
  readonly form: Locator;
  readonly 送信ボタン: Locator;
  readonly 一覧へ戻るリンク: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form1");
    this.送信ボタン = page.locator('.c-conversionArea button[type="submit"]');
    this.一覧へ戻るリンク = page.locator(".c-conversionArea a.c-baseLink");
  }

  欄(n: "nameJp" | "nameEn" | "code" | "rank" | "Certification" | "MetaRange"): Locator {
    return this.page.locator(`[name="admin_format[${n}]"]`);
  }
  get 名日() { return this.欄("nameJp"); }
  get 名英() { return this.欄("nameEn"); }

  /** フォーマット詳細画面を直接開く */
  async open(id: string): Promise<void> {
    const res = await this.page.goto(adminUrl(`/format/${id}/edit`));
    expect(res?.status() ?? 0, `フォーマットID ${id} のフォーマット詳細画面の応答`).toBe(200);
    await this.page.waitForLoadState("load");
    await this.表示を待つ();
  }

  async 表示を待つ(): Promise<void> {
    await expect(this.名日, "フォーマット詳細画面のフォーマット名(日)の欄").toBeVisible();
  }

  /** 書いてある項目だけ入れる。書いていない項目は初期表示のまま */
  async 入れる(v: フォーマット入力): Promise<void> {
    if (v.名日 !== undefined) await this.欄("nameJp").fill(v.名日);
    if (v.名英 !== undefined) await this.欄("nameEn").fill(v.名英);
    if (v.コード !== undefined) await this.欄("code").fill(v.コード);
    if (v.認定 !== undefined) await chooseByLabel(this.欄("Certification"), v.認定);
    if (v.並び順 !== undefined) await this.欄("rank").fill(v.並び順);
    if (v.メタゲーム分析日数 !== undefined) await this.欄("MetaRange").fill(v.メタゲーム分析日数);
  }

  /** 送信ボタン（表示名「登録」）を押し、移った画面の読み込みを待つ。ブラウザの入力チェックで止まったときは false */
  async 登録を押す(): Promise<boolean> {
    await expect(this.送信ボタン, "フォーマット詳細画面の送信ボタン").toHaveText(/^\s*登録\s*$/);
    const sent = this.page.waitForRequest((r) => r.method() === "POST" && r.isNavigationRequest(), { timeout: 5_000 }).then(() => true, () => false);
    await this.送信ボタン.click();
    if (!(await sent)) return false;
    await this.page.waitForLoadState("load");
    return true;
  }

  /** 一覧へ戻るリンク（表示名「フォーマット管理」。正本の「フォーマット一覧」）を押す */
  async 一覧へ戻るを押す(): Promise<void> {
    await expect(this.一覧へ戻るリンク, "フォーマット詳細画面の一覧へ戻るリンク").toHaveText(/^\s*フォーマット管理\s*$/);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.一覧へ戻るリンク.click()]);
  }

  /** いまのアドレスがフォーマット詳細画面なら、そのフォーマットID */
  いまのフォーマットID(): string | null {
    return /\/format\/(\d+)\/edit$/.exec(pathOf(this.page.url()))?.[1] ?? null;
  }
}

/**
 * シード: フォーマット一覧画面で「新規登録」を押し、フォーマット詳細(登録)画面で入れて「登録」を押す。
 * 登録後に表示されたフォーマット詳細画面のアドレスに含まれる番号（フォーマットID）を返す。
 */
export async function フォーマットを登録する(page: Page, v: フォーマット入力, what: string, issue: Issue): Promise<string> {
  const list = new FormatListPage(page);
  await list.open();
  await list.新規登録を押す();
  const d = new FormatDetailPage(page);
  await d.表示を待つ();
  await d.入れる(v);
  if (!(await d.登録を押す())) throw new Error(`${what}: フォーマット「${v.名日}」の登録が、ブラウザの入力チェックで止まった`);
  for (const w of await expectSaved(page, `${what}: フォーマット「${v.名日}」の登録`)) issue(w);
  const id = d.いまのフォーマットID();
  if (!id) throw new Error(`${what}: フォーマット「${v.名日}」を登録したが、フォーマット詳細画面へ移らない（${page.url()}）`);
  return id;
}

/** シード: フォーマット一覧画面で、そのフォーマットIDの行の3点リーダーから「削除」を押し、ポップアップで削除を実行する */
export async function フォーマットを一覧から削除する(page: Page, id: string, what: string): Promise<void> {
  const list = new FormatListPage(page);
  await list.open();
  await list.三点リーダーを押す(id);
  await list.削除を押す(id);
  const r = await list.ポップアップで削除を実行する();
  if (r.要求の応答 >= 400) throw new Error(`${what}: フォーマットID ${id} の削除の要求の応答が ${r.要求の応答}`);
  await expectSaved(page, `${what}: フォーマットID ${id} の削除`);
  await list.表示を待つ();
  if ((await list.行のフォーマットID()).includes(id)) throw new Error(`${what}: フォーマットID ${id} を削除したが、一覧に残っている`);
}

/** シード: フォーマット一覧にフォーマット名(日)の行があれば、すべて削除する。消した件数 */
export async function 同じ名のフォーマットを消す(page: Page, 名日: string, what: string): Promise<number> {
  const list = new FormatListPage(page);
  let n = 0;
  for (let round = 0; round < 10; round++) {
    await list.open();
    const [id] = await list.名で探す(名日);
    if (!id) return n;
    await フォーマットを一覧から削除する(page, id, what);
    n++;
  }
  throw new Error(`${what}: フォーマット「${名日}」を消しきれない`);
}

/** シード: フォーマット詳細画面のアドレスの番号を書き換えて開いたときの応答（該当なしなら 404） */
export async function フォーマット詳細の応答(page: Page, id: string): Promise<number> {
  const res = await page.goto(adminUrl(`/format/${id}/edit`));
  await page.waitForLoadState("load");
  return res?.status() ?? 0;
}

// ---------------------------------------------------------------------------
// MTGマスターデータ画面の「認定」
// ---------------------------------------------------------------------------

async function 認定の一覧を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: "認定" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), "認定の一覧").toBeVisible();
}

async function 認定の行(page: Page): Promise<{ 日: string; 英: string }[]> {
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { 日: string; 英: string }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "").trim();
      out.push({ 日: v("name_jp"), 英: v("name_en") });
    }
    return out;
  });
}

/**
 * シード: MTGマスターデータ画面で「認定」を選び、「日 / 英」の行が無いときは空の行に名前(日)・名前(英)・並び順を入れて「登録」を押す。
 * 登録したら true。同じ名前(日)で名前(英)の違う行があるときは、一覧の表示が「日 / 英」にならないので止める。
 */
export async function 認定を用意する(page: Page, v: { 日: string; 英: string; 並び順: string }, what: string): Promise<boolean> {
  await 認定の一覧を開く(page);
  const rows = await 認定の行(page);
  if (rows.some((r) => r.日 === v.日 && r.英 === v.英)) return false;
  const other = rows.find((r) => r.日 === v.日);
  if (other) throw new Error(`${what}: 認定「${v.日}」の名前(英)が「${other.英}」（シード表は「${v.英}」）`);
  const f = (n: string) => page.locator(`[name="rows[new][${n}]"]`);
  await f("name_jp").fill(v.日);
  await f("name_en").fill(v.英);
  await f("sort_no").fill(v.並び順);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('button[type="submit"][form="edit_form"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: 認定「${v.日} / ${v.英}」の登録`);
  await 認定の一覧を開く(page);
  if (!(await 認定の行(page)).some((r) => r.日 === v.日 && r.英 === v.英)) throw new Error(`${what}: 認定「${v.日} / ${v.英}」を登録したが、一覧に行が無い`);
  return true;
}

// ---------------------------------------------------------------------------
// イベント・アーキタイプ（フォーマットを使う側。シード用）
// ---------------------------------------------------------------------------

/** イベント編集(登録)画面の選択欄の、選べる選択肢（空を除く）の表示名 */
export async function イベント登録の選択肢(page: Page, 欄: "baseInfo" | "rel"): Promise<string[]> {
  await page.goto(adminUrl("/event/create"));
  await page.waitForLoadState("load");
  return page.locator(`[name="admin_event[${欄}]"] option`).evaluateAll((os) => os
    .filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()).filter(Boolean));
}

/** アーキタイプ編集(登録)画面で、アーキタイプ名(日)・(英)・公開状態・フォーマットを入れて「新規登録」を押す */
export async function アーキタイプを登録する(page: Page, v: { 名日: string; 名英: string; 公開状態: string; フォーマット: string }, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await chooseByLabel(f("Disp"), v.公開状態);
  await chooseByLabel(f("Format"), v.フォーマット);
  const button = page.locator('button[type="submit"][form="admin_archetype"]');
  await expect(button, `${what}: アーキタイプ編集(登録)画面の「新規登録」`).toHaveText(/^\s*新規登録\s*$/);
  await button.click();
  for (const w of await expectSaved(page, `${what}: アーキタイプ「${v.名日}」の登録`)) issue(w);
}
