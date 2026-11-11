/**
 * M14-10 フォーマット詳細(登録・編集・削除)画面の操作（全項目の入力・読み取り、開発者ツールで行う書き換え、編集画面からの削除）。
 * 一覧の操作・削除の確認ポップアップの操作は M14-09 の部品（pages/admin/m14_09_format_list.ts）を使う。セレクタはここだけに置く。
 *
 * 画面の作り（アプリの Format/edit.twig・FormatType・FormatController で確かめたもの）:
 * - 送信ボタンは登録・更新とも表示名「登録」。成功するとフォーマット詳細画面（/format/<ID>/edit）へ移り「保存しました」を出す。
 * - 統率上限枚数・統率下限枚数・統率のカードをメインボード枚数に含むは、「統率でカードを使用する」を外すと画面のスクリプトが無効にする。
 * - 削除ボタン（表示名「削除」）は登録済みのときだけ出る。押すと確認のポップアップ（一覧と同じ #DeleteModal）が開き、
 *   ポップアップの「削除」ボタンが削除の要求を送る。成功・失敗とも一覧へ戻す。
 * - なりすまし対策トークンはフォームの隠し項目（admin_format[_token]）。フォームの送信先は /format/new か /format/<ID>/edit。
 */
import { Browser, expect, Locator, Page } from "@playwright/test";
import { adminUrl, hideDebugToolbar } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";
import { FormatListPage, フォーマット削除のパス, pathOf } from "./m14_09_format_list";

type Issue = (m: string) => void;

/** フォーマット詳細画面の項目（書いた項目だけ入れる。チェックは書いた状態にする） */
export type フォーマット項目 = {
  名日?: string; 名英?: string; コード?: string; 並び順?: string;
  メイン上限?: string; メイン下限?: string; サイド上限?: string; サイド下限?: string;
  /** 認定の表示名。null は未選択にする */
  認定?: string | null;
  デッキ検索?: boolean; 商品検索?: boolean; ランキング?: boolean; メタ分布簡易化?: boolean; ARENA?: boolean;
  基本土地?: boolean; デッキビルダー?: boolean; イベント?: boolean;
  メタゲーム分析日数?: string; ルール日?: string; ルール英?: string;
  統率使用?: boolean; 統率メイン算入?: boolean; 統率上限?: string; 統率下限?: string; ハイランダー?: boolean;
};

const 文字欄 = {
  名日: "nameJp", 名英: "nameEn", コード: "code", 並び順: "rank",
  メイン上限: "mainMaxCardCount", メイン下限: "mainMinCardCount", サイド上限: "sideMaxCardCount", サイド下限: "sideMinCardCount",
  メタゲーム分析日数: "MetaRange", ルール日: "RuleJp", ルール英: "RuleEn", 統率上限: "commandMaxCardCount", 統率下限: "commandMinCardCount",
} as const;
const チェック欄 = {
  デッキ検索: "searchFlg", 商品検索: "productSearchFlg", ランキング: "rankingFlg", メタ分布簡易化: "OtherMetaFlg", ARENA: "ArenaLegalFlg",
  基本土地: "IncludeBasicFlg", デッキビルダー: "DeckbuilderFlg", イベント: "isShownInEvent", 統率使用: "useCommandFlg",
  統率メイン算入: "commanderInMain", ハイランダー: "HighlanderFlg",
} as const;
export type 文字欄名 = keyof typeof 文字欄;
export type チェック欄名 = keyof typeof チェック欄;

/** 画面に表示されている値（文字の欄は入力値、チェックは選択の有無、認定は選ばれている表示名） */
export type フォーマット画面の値 = Record<文字欄名, string> & Record<チェック欄名, boolean> & { 認定: string };

/** 送信の結果 */
export type 送信の結果 = { sent: boolean; 要求の応答: number | null; 移った画面の応答: number | null; 移った画面: string };

export class FormatEditPage {
  readonly form: Locator;
  readonly 送信ボタン: Locator;
  readonly 削除ボタン: Locator;
  readonly 削除ポップアップ: Locator;
  readonly ポップアップの文: Locator;

  constructor(readonly page: Page) {
    this.form = page.locator("form#form1");
    this.送信ボタン = page.locator('.c-conversionArea button[type="submit"]');
    this.削除ボタン = page.locator('.c-conversionArea a.btn-ec-delete[data-bs-target="#DeleteModal"]');
    this.削除ポップアップ = page.locator("#DeleteModal");
    this.ポップアップの文 = this.削除ポップアップ.locator("p.modal-message");
  }

  欄(name: string): Locator { return this.page.locator(`[name="admin_format[${name}]"]`); }
  文字の欄(k: 文字欄名): Locator { return this.欄(文字欄[k]); }
  チェックの欄(k: チェック欄名): Locator { return this.欄(チェック欄[k]); }
  get 認定の欄(): Locator { return this.欄("Certification"); }
  get トークン(): Locator { return this.form.locator('input[name="admin_format[_token]"]'); }

  /** 登録済みのフォーマットの詳細画面を開く。応答を返す（404 などでも落とさない） */
  async open(id: string): Promise<number> {
    const res = await this.page.goto(adminUrl(`/format/${id}/edit`));
    await this.page.waitForLoadState("load");
    const status = res?.status() ?? 0;
    if (status === 200) await this.表示を待つ();
    return status;
  }

  /** 新規登録状態のフォーマット詳細画面を開く */
  async openNew(): Promise<void> {
    const res = await this.page.goto(adminUrl("/format/new"));
    expect(res?.status() ?? 0, "新規登録状態のフォーマット詳細画面の応答").toBe(200);
    await this.page.waitForLoadState("load");
    await this.表示を待つ();
  }

  async 表示を待つ(): Promise<void> {
    await expect(this.文字の欄("名日"), "フォーマット詳細画面のフォーマット名(日)の欄").toBeVisible();
  }

  /** 書いた項目だけ入れる。統率の欄は「統率でカードを使用する」を先に入れてから入れる（外すと無効になる欄） */
  async 入れる(v: フォーマット項目): Promise<void> {
    if (v.統率使用 !== undefined) await setChecked(this.チェックの欄("統率使用"), v.統率使用);
    for (const k of Object.keys(文字欄) as 文字欄名[]) {
      const value = v[k];
      if (value !== undefined) await this.文字の欄(k).fill(value);
    }
    for (const k of Object.keys(チェック欄) as チェック欄名[]) {
      if (k === "統率使用") continue;
      const on = v[k];
      if (on !== undefined) await setChecked(this.チェックの欄(k), on);
    }
    if (v.認定 === null) {
      await expect(this.認定の欄.locator('option[value=""]'), "認定の未選択の選択肢").toHaveCount(1);
      await this.認定の欄.selectOption("");
    }
    else if (v.認定 !== undefined) await chooseByLabel(this.認定の欄, v.認定);
  }

  /** 認定の選択肢の表示名（空の選択肢を除く） */
  async 認定の選択肢(): Promise<string[]> {
    return this.認定の欄.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()));
  }

  /** 画面に表示されている値 */
  async 値(): Promise<フォーマット画面の値> {
    const out: Record<string, string | boolean> = {};
    for (const k of Object.keys(文字欄) as 文字欄名[]) out[k] = await this.文字の欄(k).inputValue();
    for (const k of Object.keys(チェック欄) as チェック欄名[]) out[k] = await this.チェックの欄(k).isChecked();
    out.認定 = ((await this.認定の欄.locator("option:checked").textContent().catch(() => "")) ?? "").trim();
    return out as フォーマット画面の値;
  }

  /** 送信ボタン（表示名「登録」）を押し、送った要求の応答と、移った画面を返す。ブラウザの入力チェックで止まれば sent=false */
  async 登録を押す(): Promise<送信の結果> {
    await expect(this.送信ボタン, "フォーマット詳細画面の送信ボタン").toHaveText(/^\s*登録\s*$/);
    const main = this.page.mainFrame();
    const sentP = this.page.waitForRequest((r) => r.method() === "POST" && r.isNavigationRequest() && r.frame() === main, { timeout: 5_000 }).then(() => true, () => false);
    const resP = this.page.waitForResponse((r) => r.request().method() === "POST" && r.request().isNavigationRequest() && r.request().frame() === main, { timeout: 120_000 }).catch(() => null);
    await this.送信ボタン.click();
    if (!(await sentP)) return { sent: false, 要求の応答: null, 移った画面の応答: null, 移った画面: pathOf(this.page.url()) };
    const res = await resP;
    await this.page.waitForLoadState("load");
    // 送った要求がリダイレクトなら、移った画面の応答はリダイレクト先の読み込みの応答
    let landed = res?.status() ?? null;
    const next = res?.request().redirectedTo();
    if (next) landed = (await next.response().catch(() => null))?.status() ?? null;
    return { sent: true, 要求の応答: res?.status() ?? null, 移った画面の応答: landed, 移った画面: pathOf(this.page.url()) };
  }

  /** 入力欄のラベル（左の列の項目名と、チェックの表示名。上から順） */
  async 項目のラベル(): Promise<string[]> {
    return (await this.page.locator("#formatOverview .col-3 > span:first-child, #formatOverview label").allInnerTexts())
      .map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /** 画面の項目の下に出た入力エラーの文 */
  async 入力エラー(): Promise<string[]> {
    return (await this.form.locator(".invalid-feedback, .form-error-message").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  // ---- 開発者ツールで行う書き換え ----

  /** なりすまし対策トークンの入力要素をフォームから取り除く。取り除いた数 */
  async トークンを取り除く(): Promise<number> {
    const n = await this.トークン.evaluateAll((es) => { es.forEach((e) => e.remove()); return es.length; });
    await expect(this.トークン, "取り除いたなりすまし対策トークンの入力要素").toHaveCount(0);
    return n;
  }

  /** なりすまし対策トークンの値を書き換える */
  async トークンを書き換える(値: string): Promise<void> {
    await expect(this.トークン, "なりすまし対策トークンの入力要素").toHaveCount(1);
    await this.トークン.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
    await expect(this.トークン, "書き換えたなりすまし対策トークン").toHaveValue(値);
  }

  /** フォームの送信先の、フォーマットの識別子を書き換える */
  async 送信先の識別子を書き換える(id: string): Promise<void> {
    const to = adminUrl(`/format/${id}/edit`);
    await this.form.evaluate((f, a) => f.setAttribute("action", a), to);
    expect(pathOf(new URL((await this.form.getAttribute("action")) ?? "", this.page.url()).href), "書き換えたフォームの送信先").toBe(pathOf(to));
  }

  // ---- 削除（編集画面の削除ボタン） ----

  /** 削除ボタンを押し、確認のポップアップが開いて削除の送り先が入るまで待つ。ポップアップの操作は一覧の部品で行う */
  async 削除を押す(id: string): Promise<FormatListPage> {
    await expect(this.削除ボタン, "フォーマット詳細画面の削除ボタン").toHaveText(/^\s*削除\s*$/);
    await this.削除ボタン.click();
    const list = new FormatListPage(this.page);
    await expect(this.削除ポップアップ, "削除の確認ポップアップ").toBeVisible();
    await expect.poll(async () => list.削除の送り先(), "削除の確認ポップアップの「削除」ボタンの送り先（ポップアップが開き終わると入る）").toBe(フォーマット削除のパス(id));
    return list;
  }

  /** いまのアドレスがフォーマット詳細画面なら、そのフォーマットID */
  いまのフォーマットID(): string | null {
    return /\/format\/(\d+)\/edit$/.exec(pathOf(this.page.url()))?.[1] ?? null;
  }
}

/**
 * シード: フォーマット一覧画面で「新規登録」を押し、フォーマット詳細(登録)画面で入れて「登録」を押す。
 * 登録後に表示されたフォーマット詳細画面のアドレスの番号（フォーマットID）を返す。
 */
export async function フォーマットを作る(page: Page, v: フォーマット項目, what: string, issue: Issue): Promise<string> {
  const list = new FormatListPage(page);
  await list.open();
  await list.新規登録を押す();
  const d = new FormatEditPage(page);
  await d.表示を待つ();
  await d.入れる(v);
  const r = await d.登録を押す();
  if (!r.sent) throw new Error(`${what}: フォーマット「${v.名日}」の登録が、ブラウザの入力チェックで止まった`);
  for (const w of await expectSaved(page, `${what}: フォーマット「${v.名日}」の登録`)) issue(w);
  const id = d.いまのフォーマットID();
  if (!id) throw new Error(`${what}: フォーマット「${v.名日}」を登録したが、フォーマット詳細画面へ移らない（${page.url()}）`);
  return id;
}

/** シード: フォーマットの詳細画面を開いて項目を入れ、「登録」を押して保存する */
export async function フォーマットを直す(page: Page, id: string, v: フォーマット項目, what: string, issue: Issue): Promise<void> {
  const d = new FormatEditPage(page);
  const status = await d.open(id);
  if (status !== 200) throw new Error(`${what}: フォーマットID ${id} の詳細画面を開けない（応答 ${status}）`);
  await d.入れる(v);
  const r = await d.登録を押す();
  if (!r.sent) throw new Error(`${what}: フォーマットID ${id} の保存が、ブラウザの入力チェックで止まった`);
  for (const w of await expectSaved(page, `${what}: フォーマットID ${id} の保存`)) issue(w);
}

/** 新規登録状態のフォーマット詳細画面の、認定の選択肢 */
export async function 認定の選択肢を読む(page: Page): Promise<string[]> {
  const d = new FormatEditPage(page);
  await d.openNew();
  return d.認定の選択肢();
}

// ---------------------------------------------------------------------------
// デッキ編集画面（管理）の警告・プレイヤー検索（シードとテストの読み取り）
// ---------------------------------------------------------------------------

/** 画面上部の警告・エラーの帯の文（開発用の設定の帯は除く） */
export async function 画面上部の警告(page: Page): Promise<string[]> {
  return (await page.locator(".alert-warning, .alert-danger").allInnerTexts())
    .map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && !t.includes("デバッグモードが有効"));
}

/**
 * デッキ新規登録画面のプレイヤー検索で語を検索し、結果の行（選択ボタンの番号と行の文）を読む。デッキは登録しない。
 * 選手IDは行の選択ボタンの番号（結果のID列と同じ）。
 */
export async function プレイヤー検索の結果(page: Page, 語: string): Promise<{ 選手ID: string; 行の文: string }[]> {
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  await page.locator('[data-bs-target="#searchPlayerModal"]').click();
  const m = page.locator("#searchPlayerModal");
  await expect(m, "プレイヤー検索の画面").toBeVisible();
  await m.locator("#player_search_word").fill(語);
  const res = page.waitForResponse((r) => r.url().includes("/deck/search_player"));
  await m.locator("#btn_search_player").click();
  await res;
  await expect(m.locator("#player_search_results table, #player_search_results p").first(), `プレイヤー検索「${語}」の結果`).toBeVisible({ timeout: 30_000 });
  return m.locator("button.select-player").evaluateAll((bs) => bs.map((b) => ({
    選手ID: b.getAttribute("data-id") ?? "",
    行の文: ((b.closest("tr") as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim(),
  })));
}

/** 管理画面とは別のブラウザセッション（新しいコンテキスト）で fn を行う */
export async function 別のセッションで<T>(browser: Browser, baseURL: string, fn: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext({ baseURL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    return await fn(page);
  } finally { await context.close(); }
}

// ---------------------------------------------------------------------------
// カード詳細（シード用の読み取り・リーガリティの追加）
// ---------------------------------------------------------------------------

/** カード詳細(登録)画面の選択欄（カードタイプ・特殊タイプ、または「詳細情報を追加」で出る欄）の選択肢の表示名 */
export async function カード登録の選択肢(page: Page, 欄: "cardtypes" | "specialtypes" | "cardset" | "rarity"): Promise<string[]> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  let sel: Locator;
  if (欄 === "cardtypes" || 欄 === "specialtypes") sel = page.locator(`form#form1 select[name="admin_card[${欄}][]"]`);
  else {
    await page.locator("#add-detail").click();
    sel = page.locator("#card-details-container .detail-card").last().locator(`select[name$="[${欄}]"]`);
  }
  await expect(sel, `カード詳細(登録)画面の選択欄（${欄}）`).toHaveCount(1);
  return sel.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()).filter(Boolean));
}

/** 登録済みのカードの詳細画面で「リーガリティ追加」を押し、フォーマットとリーガリティを選んで保存する */
export async function カードにリーガリティを足す(page: Page, カードID: string, フォーマット: string, リーガリティ: string, what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/card/${カードID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細(編集)画面`).toBeVisible();
  const rows = page.locator("#card-formats-container .removable-item");
  const before = await rows.count();
  await page.locator("#add-format").click();
  await expect(rows, `${what}: 「リーガリティ追加」で行が増える`).toHaveCount(before + 1);
  const row = rows.last();
  await row.locator('select[name$="[format]"]').selectOption({ label: フォーマット });
  await row.locator("label").filter({ hasText: new RegExp(`^\\s*${リーガリティ}\\s*$`) }).click();
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|更新)\s*$/ }).first().click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードID ${カードID} へのリーガリティの追加`)) issue(w);
}
