/**
 * M14（カード管理）共通の画面操作。
 * - カード詳細(登録)画面でカードを登録する（シード用）。カード名・マナ・コスト・色・タイプ・リーガリティ・詳細情報を入れられる。
 * - カード検索（一覧・条件抽出）画面の操作（検索・並び順・表示件数・ページ送り・削除・CSV出力）。
 * - MTGマスターデータ管理・フォーマット登録・カードセット登録で、マスターを「あれば使い、無ければ登録する」。
 */
import { Download, expect, Locator, Page } from "@playwright/test";
import { csvRecords, decodeCsvBytes } from "../../lib/csv";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// カード登録（シード用）
// ---------------------------------------------------------------------------

export type カード入力 = {
  カード名日?: string; カード名英: string;
  /** アリーナカード名(日)・(英)。省略すると入れない（空のまま） */
  アリーナ名日?: string; アリーナ名英?: string;
  ルールテキスト日?: string; ルールテキスト英?: string;
  /** 点数で見たマナ・コスト */
  点数で見たマナ: string;
  マナ・コスト?: string;
  カラー?: string[]; 固有色?: string[];
  カードタイプ?: string[]; サブタイプ?: string[]; 特殊タイプ?: string[];
  /** リーガリティの行（フォーマット名・リーガリティ名） */
  リーガリティ?: { フォーマット: string; リーガリティ: string }[];
  /** 詳細情報。false で追加しない。レアリティ・レイアウト・プロモ種別は省略すると選択肢の先頭（全件で同じもの） */
  詳細?: false | 詳細入力 | 詳細入力[];
};
export type 詳細入力 = {
  カードセット?: string; レアリティ?: string; レイアウト?: string; イラストレーター?: string; プロモ種別?: string; Foil?: string; フレーム?: string;
  /** 名前を指定せず「この名前以外の選択肢」から選ぶ（先頭から探す。無ければ止める。マスターには足さない） */
  以外?: { レアリティ?: string[]; レイアウト?: string[]; プロモ種別?: string[] };
};

/** 展開式の選択（チェック群）で、ラベルが label の入力を押す */
async function checkByLabel(page: Page, idPrefix: string, label: string, what: string): Promise<void> {
  const labels = page.locator(`label[for^="${idPrefix}"]`);
  const n = await labels.count();
  for (let i = 0; i < n; i++) {
    const l = labels.nth(i);
    if (((await l.innerText()) ?? "").trim() !== label) continue;
    const id = await l.getAttribute("for");
    await page.locator(`#${id}`).check();
    return;
  }
  throw new Error(`${what}に「${label}」の選択肢が無い`);
}

/** 複数選択欄で、表示名が label の選択肢を足して選ぶ（サブタイプは「英語名 / 日本語名」なので末尾一致も許す） */
async function addSelect(select: Locator, labels: string[], what: string): Promise<void> {
  const options = await select.locator("option").evaluateAll((ns) => ns.map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })));
  const values: string[] = [];
  for (const w of labels) {
    const hit = options.find((o) => o.label === w) ?? options.find((o) => o.label.endsWith(` / ${w}`));
    if (!hit) throw new Error(`${what}に「${w}」の選択肢が無い`);
    values.push(hit.value);
  }
  await select.selectOption(values);
}

async function firstOption(select: Locator, what: string, 除く: string[] = []): Promise<{ value: string; label: string }> {
  await expect(select, what).toHaveCount(1);
  const first = await select.locator("option").evaluateAll((ns, ex) => ns
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== "" && !ex.includes(o.label)), 除く);
  if (!first) throw new Error(`${what}に選べる値が無い${除く.length ? `（「${除く.join("」「")}」以外の選択肢が無い。マスターには足さない）` : ""}`);
  return first;
}

/**
 * カード詳細(登録)画面で、入力を入れて「登録」を押す。登録後のカードID（編集画面のアドレスの番号）を返す。
 * 指定の無い必須欄（レアリティ・レイアウト・プロモ種別）は選択肢の先頭を選ぶ（正本は「選択肢から任意の1つ（全件で同じもの）」）。
 */
export async function カードを登録する(page: Page, v: カード入力, what: string, issue?: Issue): Promise<string> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細(登録)画面`).toBeVisible();
  const t = (id: string, value?: string) => value === undefined ? Promise.resolve() : form.locator(`#admin_card_${id}`).fill(value);
  await t("nameJp", v.カード名日);
  await t("nameEn", v.カード名英);
  await t("arenaFormatNameJp", v.アリーナ名日);
  await t("arenaFormatNameEn", v.アリーナ名英);
  await t("textJp", v.ルールテキスト日);
  await t("textEn", v.ルールテキスト英);
  await t("cmc", v.点数で見たマナ);
  await t("manaCost", v.マナ・コスト);
  for (const c of v.カラー ?? []) await checkByLabel(page, "admin_card_colors_", c, `${what}: カラー`);
  for (const c of v.固有色 ?? []) await checkByLabel(page, "admin_card_colorIdentities_", c, `${what}: 固有色`);
  if (v.カードタイプ?.length) await addSelect(form.locator('select[name="admin_card[cardtypes][]"]'), v.カードタイプ, `${what}: カードタイプ`);
  if (v.サブタイプ?.length) await addSelect(form.locator('select[name="admin_card[subtypes][]"]'), v.サブタイプ, `${what}: サブタイプ`);
  if (v.特殊タイプ?.length) await addSelect(form.locator('select[name="admin_card[specialtypes][]"]'), v.特殊タイプ, `${what}: 特殊タイプ`);
  for (const r of v.リーガリティ ?? []) {
    const rows = page.locator("#card-formats-container .removable-item");
    const before = await rows.count();
    await page.locator("#add-format").click();
    await expect(rows, `${what}: 「リーガリティ追加」で行が増える`).toHaveCount(before + 1);
    const row = rows.last();
    await row.locator('select[name$="[format]"]').selectOption({ label: r.フォーマット });
    await row.locator("label").filter({ hasText: new RegExp(`^\\s*${r.リーガリティ}\\s*$`) }).click();
  }
  if (v.詳細 !== false) {
    const list = Array.isArray(v.詳細) ? v.詳細 : [v.詳細 ?? {}];
    for (const d of list) {
      const details = page.locator("#card-details-container .detail-card");
      const before = await details.count();
      await page.locator("#add-detail").click();
      await expect(details, `${what}: 「詳細情報を追加」で詳細情報が増える`).toHaveCount(before + 1);
      const det = details.last();
      const sel = (f: string) => det.locator(`select[name$="[${f}]"]`);
      if (d.カードセット) await sel("cardset").selectOption({ label: d.カードセット });
      for (const [f, label, want, 除く] of [["rarity", "レアリティ", d.レアリティ, d.以外?.レアリティ], ["cardLayout", "レイアウト", d.レイアウト, d.以外?.レイアウト], ["promotion", "プロモ種別", d.プロモ種別, d.以外?.プロモ種別]] as const) {
        if (want) await sel(f).selectOption({ label: want });
        else await sel(f).selectOption((await firstOption(sel(f), `${what}: 詳細情報の${label}`, 除く ?? [])).value);
      }
      if (d.イラストレーター) await sel("illustrator").selectOption({ label: d.イラストレーター });
      await sel("foilFlg").selectOption({ label: d.Foil ?? "なし" });
      await sel("frameFlg").selectOption({ label: d.フレーム ?? "通常" });
    }
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) issue?.(w);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録後にカードの編集画面へ移らない（${page.url()}）`);
  return m[1];
}

// ---------------------------------------------------------------------------
// カード検索（一覧・条件抽出）
// ---------------------------------------------------------------------------

export type 一覧の行 = { カードID: string; カード名: string };

async function downloadedText(download: Download): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return decodeCsvBytes(Buffer.concat(chunks));
}

export class CardSearchPage {
  readonly form: Locator;
  readonly キーワード: Locator;
  readonly 詳細検索の開閉: Locator;
  readonly 詳細検索: Locator;
  readonly 行: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("#admin_search_form");
    this.キーワード = page.locator("#admin_search_card_multi");
    this.詳細検索の開閉 = page.locator('[data-bs-toggle="collapse"][href="#searchDetail"]');
    this.詳細検索 = page.locator("#searchDetail");
    this.行 = page.locator("#form_bulk tbody tr").filter({ has: page.locator('input[name="cardIds[]"]') });
  }

  /** カード検索（一覧・条件抽出）画面を直接開く（検索保持値を使わない初期表示） */
  async open(): Promise<void> {
    await this.page.goto(adminUrl("/card"));
    await this.page.waitForLoadState("load");
    await expect(this.form, "カード検索の検索欄").toBeVisible();
  }

  /** 管理画面のメニュー「カード管理」→「カード一覧」から開き直す */
  async openFromMenu(): Promise<void> {
    const link = this.page.locator(`a[href$="/${new URL(adminUrl("/card")).pathname.split("/")[1]}/card"]`).first();
    if (!(await link.isVisible())) {
      await this.page.locator("#side, .c-mainNavArea, nav").getByText("カード管理", { exact: true }).first().click();
    }
    await expect(link, "メニューの「カード一覧」").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    await expect(this.form, "カード検索の検索欄").toBeVisible();
  }

  /** 検索条件を展開する（開いていれば何もしない） */
  async 検索条件を展開する(): Promise<void> {
    if (!(await this.詳細検索.isVisible())) {
      await this.詳細検索の開閉.click();
      await expect(this.詳細検索, "展開された検索条件").toBeVisible();
    }
  }

  async 検索結果の文(): Promise<string> {
    const outcome = this.page.getByText(/^(検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした)$/);
    await expect(outcome.first(), "カード検索の検索結果").toBeVisible();
    return ((await outcome.first().innerText()) ?? "").trim();
  }

  async 検索結果件数(): Promise<number | null> {
    const m = /検索結果：(\d+)件/.exec(await this.検索結果の文());
    return m ? Number(m[1]) : null;
  }

  /** 「検索する」を押して結果の表示を待つ */
  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.form.locator('button[type="submit"]').click(),
    ]);
    await this.page.waitForLoadState("load");
    await this.検索結果の文();
  }

  /** カード名・テキストに入れて検索する */
  async キーワードで検索する(語: string): Promise<void> {
    await this.キーワード.fill(語);
    await this.検索する();
  }

  async 表示行(): Promise<一覧の行[]> {
    return this.行.evaluateAll((trs) => trs.map((tr) => ({
      カードID: (tr.querySelector("td:nth-child(2)")?.textContent ?? "").trim(),
      カード名: (tr.querySelector("td:nth-child(3)")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    })));
  }

  async 表示中のカードID(): Promise<string[]> {
    return (await this.表示行()).map((r) => r.カードID);
  }

  /** 表示件数の選択（選ぶと読み込み直される） */
  async 表示件数を選ぶ(件数: number): Promise<void> {
    const select = this.page.locator("#page_count_pulldown");
    await expect(select, "表示件数の選択欄").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), select.selectOption({ label: `${件数}件` })]);
    await this.page.waitForLoadState("load");
    await this.検索結果の文();
  }

  async 表示件数の選択値(): Promise<string> {
    return ((await this.page.locator("#page_count_pulldown option:checked").innerText()) ?? "").trim();
  }

  /** 並び順の選択（キー: カードID・マナ・コスト・カード名（和文）・カード名（英文）、向き: 昇順・降順） */
  async 並び順を選ぶ(キー: string, 向き: "昇順" | "降順"): Promise<void> {
    const select = this.page.locator("#sort_key_pulldown");
    await expect(select, "並び順の選択欄").toBeVisible();
    // 画面の並び順の表示は「カード日名」「カード英名」（設計書は「カード名（和文）」「カード名（英文）」）
    const 表示 = ({ "カード名（和文）": "カード日名", "カード名（英文）": "カード英名" } as Record<string, string>)[キー] ?? キー;
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), select.selectOption({ label: `${表示}（${向き}）` })]);
    await this.page.waitForLoadState("load");
    await this.検索結果の文();
  }

  async 並び順の選択値(): Promise<string> {
    return ((await this.page.locator("#sort_key_pulldown option:checked").innerText()) ?? "").trim();
  }

  async 並び順の選択肢(): Promise<string[]> {
    return (await this.page.locator("#sort_key_pulldown option").allInnerTexts()).map((t) => t.trim());
  }

  pager() { return this.page.locator("ul.pagination"); }

  async ページ送りの表示(): Promise<{ 前へ: boolean; 次へ: boolean; 番号: string[]; 現在: string | null }> {
    const p = this.pager();
    // ページ送りは、2ページ以上あるときだけ表示される。表示されないときは、行があれば1ページだけの一覧（現在は1ページ目）
    if ((await p.count()) === 0) return { 前へ: false, 次へ: false, 番号: [], 現在: (await this.行.count()) > 0 ? "1" : null };
    const items = (await p.locator("li").allInnerTexts()).map((t) => t.trim());
    const cur = await p.locator("li.active").first().innerText().catch(() => null);
    return { 前へ: items.includes("前へ"), 次へ: items.includes("次へ"), 番号: items.filter((t) => /^\d+$/.test(t)), 現在: cur ? cur.trim() : null };
  }

  async ページ送りを押す(名: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.pager().getByRole("link", { name: 名, exact: true }).click(),
    ]);
    await this.page.waitForLoadState("load");
    await this.検索結果の文();
  }

  行のカード(カードID: string): Locator {
    return this.行.filter({ has: this.page.locator(`td:nth-child(2)`).getByText(new RegExp(`^\\s*${カードID}\\s*$`)) });
  }

  async カードを選択する(カードIDs: string[]): Promise<void> {
    for (const id of カードIDs) await this.行のカード(id).locator('input[name="cardIds[]"]').check();
  }

  /** 行の3点リーダーを押す */
  async 三点リーダーを押す(カードID: string): Promise<void> {
    await this.行のカード(カードID).locator("button.dropdown-menu-toggle").click();
  }

  /** 3点リーダーを開いたあと「削除」を押す（確認ポップアップが出る） */
  async 削除を押す(カードID: string): Promise<void> {
    const item = this.行のカード(カードID).locator('button[data-bs-target="#DeleteModal"]');
    await expect(item, `カードID ${カードID} の削除ボタン`).toBeVisible();
    await item.click();
    await expect(this.page.locator("#DeleteModal"), "削除の確認ポップアップ").toBeVisible();
  }

  async 確認ポップアップで実行する(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.page.locator('#DeleteModal a[data-method="delete"]').click(),
    ]);
    await this.page.waitForLoadState("load");
  }

  /**
   * 「カード名リスト作成」を押す。確認ダイアログ（バッチを実行するかの確認）が出る。
   * 返す関数で確認を受け入れ、バッチ完了のメッセージ（ダイアログ）まで待つ。表示された文（確認・完了）を返す。
   */
  async カード名リスト作成を押す(): Promise<{ 確認の文: string; 実行する: () => Promise<string[]>; キャンセルする: () => Promise<void> }> {
    const dialogP = this.page.waitForEvent("dialog", { timeout: 30_000 });
    const clickP = this.page.getByRole("link", { name: "カード名リスト作成", exact: true }).click({ timeout: 30_000 });
    const dialog = await dialogP;
    return {
      確認の文: dialog.message(),
      実行する: async () => {
        const doneP = this.page.waitForEvent("dialog", { timeout: 240_000 });
        await dialog.accept();
        const done = await doneP;
        const msg = done.message();
        await done.accept();
        await clickP.catch(() => undefined);
        return [dialog.message(), msg];
      },
      キャンセルする: async () => { await dialog.dismiss(); await clickP.catch(() => undefined); },
    };
  }

  async 確認ポップアップでキャンセルする(): Promise<void> {
    await this.page.locator("#DeleteModal button").filter({ hasText: /^\s*キャンセル\s*$/ }).click();
    await expect(this.page.locator("#DeleteModal"), "削除の確認ポップアップ（閉じた）").toBeHidden();
  }
}

// ---------------------------------------------------------------------------
// マスター（あれば使い、無ければ登録する）
// ---------------------------------------------------------------------------

/** MTGマスターデータ管理で選べる種別の表示名 */
export type マスター種別 = "カードタイプ" | "サブタイプ" | "特殊タイプ" | "イラストレーター" | "プロモーション" | "レアリティ" | "カードレイアウト" | "特殊サジェスト";

async function openMaster(page: Page, 種別: マスター種別): Promise<void> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: 種別 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), `${種別}の一覧`).toBeVisible();
}

/** 既存の行（新規入力行を除く）の日本語名と並び順 */
async function masterRows(page: Page): Promise<{ 日本語名: string; 並び順: number }[]> {
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { 日本語名: string; 並び順: number }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
      out.push({ 日本語名: v("name_jp"), 並び順: Number(v("sort_no")) });
    }
    return out;
  });
}

/**
 * マスターに日本語名の行が無ければ「新規」の行に入れて登録する（既にある名称は登録しない）。登録したら true。
 * 英語名・表示順などほかの欄は任意の有効な値（英語名は日本語名と同じ綴りにできないものがあるので ASCII の別名を使う）。
 */
export async function ensureMaster(page: Page, 種別: マスター種別, 日本語名: string, 英語名: string, what: string, コード?: string): Promise<boolean> {
  await openMaster(page, 種別);
  const rows = await masterRows(page);
  if (rows.some((r) => r.日本語名 === 日本語名)) return false;
  const f = (name: string) => page.locator(`[name="rows[new][${name}]"]`);
  await f("name_jp").fill(日本語名);
  await f("name_en").fill(英語名);
  const sort = f("sort_no");
  if (await sort.count()) await sort.fill(String(Math.max(0, ...rows.map((r) => r.並び順).filter(Number.isFinite)) + 1));
  const code = f("code");
  if (await code.count()) await code.fill(コード ?? (英語名.replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "M14"));
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('button[type="submit"][form="edit_form"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expectSaved(page, `${what}: ${種別}「${日本語名}」の登録`);
  return true;
}

/** フォーマット一覧にフォーマット名(日)が一致する行があれば、そのフォーマットID */
export async function findFormat(page: Page, 名日: string): Promise<string | null> {
  const res = await page.goto(adminUrl("/format"));
  if (!res || !res.ok()) throw new Error(`フォーマット一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const found = await page.locator('a[href*="/format/"][href$="/edit"]').evaluateAll((links, name) => {
    for (const a of links) {
      const text = (a.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.split(" / ")[0] !== name) continue;
      const m = /\/format\/(\d+)\/edit/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "");
      if (m) return m[1];
    }
    return null;
  }, 名日);
  return found;
}

/** フォーマットが無ければ、フォーマット名(日)・(英)・フォーマットコード・並び順を入れて登録する */
export async function ensureFormatByName(page: Page, v: { 名日: string; 名英: string; コード: string; 並び順: string }, what: string, issue: Issue): Promise<string> {
  const found = await findFormat(page, v.名日);
  if (found) return found;
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  if (v.コード) await f("code").fill(v.コード);
  await f("rank").fill(v.並び順);
  const meta = f("MetaRange");
  if ((await meta.count()) && (await meta.inputValue()) === "") await meta.fill("30");
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録)\s*$/ }).first().click();
  for (const w of await expectSaved(page, `${what}: フォーマット「${v.名日}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** 一覧の検索結果の行が表のどこにも無いことを数える用: 表示中のカード名に語を含む行の数 */
export function 名に含む(rows: 一覧の行[], 語: string): 一覧の行[] {
  return rows.filter((r) => r.カード名.includes(語));
}

export { csvRecords, downloadedText };

// ---------------------------------------------------------------------------
// 検索フォームの部品（カード検索）
// ---------------------------------------------------------------------------

/** 検索フォームの選択欄（select2）の ID（例: cardtype → admin_search_card_cardtype） */
export const 検索欄 = {
  カードタイプ: "admin_search_card_cardtype", サブタイプ: "admin_search_card_subtype", 特殊タイプ: "admin_search_card_specialtype",
  カードセット: "admin_search_card_cardset", 使用可能フォーマット: "admin_search_card_format", イラストレーター: "admin_search_card_illustrator",
  プロモ種別: "admin_search_card_promotion",
} as const;

/** select2 の欄に語を入れ、候補（表示された選択肢の文）を返す。選ぶなら pick=true で語に一致する候補を押す */
export async function select2に入れる(page: Page, 欄ID: string, 語: string, pick: boolean): Promise<string[]> {
  const container = page.locator(`#${欄ID} + span.select2`);
  await expect(container, `${欄ID} の入力欄`).toBeVisible();
  await container.click();
  // 複数選択の欄では、検索の入力はこの欄の中にある（ほかの欄の入力と取り違えない）
  const search = container.locator("input.select2-search__field");
  // 候補の絞り込みは、キーを打つ操作（keyup）で動く。fill では動かないので、1文字ずつ打つ
  await search.pressSequentially(語, { delay: 30 });
  const options = page.locator(".select2-container--open .select2-results__option");
  // 候補が絞り込まれる（語に一致する候補が出る、または「No results found」になる）まで待つ。候補が多い欄は絞り込みに時間がかかる
  await expect.poll(async () => {
    const texts = (await options.allInnerTexts()).map((t) => t.trim());
    return texts.some((t) => t.includes(語)) || texts.some((t) => /No results|結果/.test(t)) || texts.length < 5;
  }, { timeout: 15_000, message: `${語} の候補の絞り込み` }).toBe(true).catch(() => undefined);
  await page.waitForTimeout(300);
  await expect(options.first(), `${語} の候補`).toBeVisible();
  const texts = (await options.allInnerTexts()).map((t) => t.trim());
  if (pick) {
    await options.filter({ hasText: 語 }).first().click();
  } else {
    await page.keyboard.press("Escape");
  }
  return texts;
}

/** 展開式の選択（カラー・固有色・レアリティ・レイアウト・Foil・フレーム・リーガリティ）の、ラベルと状態 */
export async function 展開式の選択肢(page: Page, 欄名: string): Promise<{ ラベル: string; 選択: boolean; 無効: boolean }[]> {
  return page.locator(`input[name="admin_search_card[${欄名}][]"]`).evaluateAll((inputs) => inputs.map((i) => {
    const el = i as HTMLInputElement;
    const l = document.querySelector(`label[for="${el.id}"]`);
    return { ラベル: (l?.textContent ?? "").trim(), 選択: el.checked, 無効: el.disabled };
  }));
}

export async function 展開式を選ぶ(page: Page, 欄名: string, ラベル: string): Promise<void> {
  const inputs = page.locator(`input[name="admin_search_card[${欄名}][]"]`);
  const n = await inputs.count();
  for (let i = 0; i < n; i++) {
    const id = await inputs.nth(i).getAttribute("id");
    const label = ((await page.locator(`label[for="${id}"]`).innerText()) ?? "").trim();
    if (label === ラベル) {
      // 同じ欄の選択肢は、選んだものだけにする（リーガリティは、フォーマットを選ぶと「使用可」が自動で入るため）
      if (欄名 === "restriction") for (let j = 0; j < n; j++) if (j !== i) await inputs.nth(j).uncheck();
      await inputs.nth(i).check();
      return;
    }
  }
  throw new Error(`検索条件「${欄名}」に「${ラベル}」の選択肢が無い`);
}

/** 検索フォームの各入力の値（隠し項目・トークンを除く）。空のものは含めない */
export async function 検索条件の入力値(page: Page): Promise<string[]> {
  return page.locator("#admin_search_form").evaluate((form) => {
    const out: string[] = [];
    for (const el of Array.from(form.querySelectorAll("input, select, textarea")) as (HTMLInputElement | HTMLSelectElement)[]) {
      if (el.type === "hidden" || el.type === "submit" || el.name.endsWith("[_token]") || el.classList.contains("select2-search__field")) continue;
      const name = el.name || el.id;
      if (el instanceof HTMLSelectElement) {
        for (const o of Array.from(el.selectedOptions)) if (o.value !== "") out.push(`${name}=${o.textContent?.trim()}`);
      } else if (el.type === "checkbox" || el.type === "radio") {
        if (el.checked) out.push(`${name}=${el.value}`);
      } else if (el.value !== "") out.push(`${name}=${el.value}`);
    }
    return out;
  });
}

/** カード詳細（編集）画面の、詳細情報の見出しに出るカード詳細ID（上から順） */
export async function カード詳細IDs(page: Page): Promise<string[]> {
  const headers = (await page.locator("#card-details-container .detail-card .detail-header strong").allInnerTexts()).map((t) => t.trim());
  return headers.map((t) => /カード詳細ID:\s*(\d+)/.exec(t)?.[1]).filter((x): x is string => !!x);
}

/** 検索語で絞った一覧の行を、削除ボタンで1件ずつ消す（検索結果が0件になるまで）。消した件数を返す */
export async function 検索結果を1件ずつ削除する(page: Page, 語: string): Promise<number> {
  const l = new CardSearchPage(page);
  let n = 0;
  for (let round = 0; round < 40; round++) {
    await l.open();
    await l.キーワードで検索する(語);
    const ids = await l.表示中のカードID();
    if (ids.length === 0) break;
    for (const id of ids) {
      await l.open();
      await l.キーワードで検索する(語);
      if ((await l.表示中のカードID()).includes(id)) {
        await l.三点リーダーを押す(id);
        await l.削除を押す(id);
        await l.確認ポップアップで実行する();
        n++;
      }
    }
  }
  return n;
}
