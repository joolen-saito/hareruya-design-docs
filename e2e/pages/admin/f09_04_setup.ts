/**
 * F09-04 採用枚数ランキング のシードで使う、管理画面の操作。セレクタはここだけに置く。
 *
 * - フォーマット登録（「採用枚数ランキングに基本土地を含める」の欄を含む）。F09-01 の部品（f09_01_setup の フォーマットを登録する）は
 *   この欄を扱わないため、この機能用に置く。フォーマットコードは F09-01 と同じく フォーマットコード() で作る。
 * - カード登録（カード名(日)・(英)・点数で見たマナ・コスト・カードタイプ・特殊タイプ・色順。詳細情報は足さない）。
 *   M14 の部品（m14_card の カードを登録する）は色順を扱わないため、この機能用に置く。
 * - MTGマスターデータ管理の行（カードタイプ・特殊タイプ・色順）を読む。
 * - デッキ登録CSVアップロード（デッキ名・メインリストの列を含む）。F09-01 の部品はデッキ名・メインリストの列を空にするため、この機能用に置く。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { csvLine } from "../../lib/csv";
import { expectSaved, setChecked } from "./common";
import { フォーマットコード } from "./f09_01_setup";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// フォーマット管理
// ---------------------------------------------------------------------------

export type F0904フォーマット = {
  名日: string; 名英: string; 並び順: string;
  /** メタゲーム分析日数。省略は初期値のまま触らない（入っていた値を issue に残す） */
  メタ日数?: string;
  /** 「採用枚数ランキングに基本土地を含める」 */
  基本土地を含める: boolean;
};

/** フォーマット管理の新規登録で登録し、登録後に開くフォーマット登録画面のアドレスの番号を返す */
export async function フォーマットを登録する(page: Page, v: F0904フォーマット, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await f("code").fill(フォーマットコード(v.名日));
  await f("rank").fill(v.並び順);
  if (v.メタ日数 !== undefined) await f("MetaRange").fill(v.メタ日数);
  else issue(`フォーマット「${v.名日}」: メタゲーム分析日数は初期値のまま触らなかった（初期値 ${await f("MetaRange").inputValue()}）`);
  await setChecked(f("IncludeBasicFlg"), v.基本土地を含める);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名日}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名日}」を登録したが、フォーマット登録画面へ移らない（${page.url()}）`);
  return m[1];
}

/** フォーマット登録画面をアドレスの番号で開いたときの応答の状態（無い番号なら 404 など） */
export async function フォーマット登録画面の応答(page: Page, 番号: string): Promise<{ 状態: number; 画面がある: boolean }> {
  const res = await page.goto(adminUrl(`/format/${番号}/edit`));
  await page.waitForLoadState("load");
  return { 状態: res?.status() ?? 0, 画面がある: (await page.locator('[name="admin_format[nameJp]"]').count()) > 0 };
}

// ---------------------------------------------------------------------------
// MTGマスターデータ管理
// ---------------------------------------------------------------------------

export type マスターの行 = { 番号: string; 日本語名: string; 英語名: string; 名称: string; 並び順: string };

/** MTGマスターデータ管理で対象（カードタイプ・特殊タイプ・色順）を選んで一覧を表示し、登録済みの行を読む */
export async function マスターの行を読む(page: Page, 対象: "カードタイプ" | "特殊タイプ" | "色順"): Promise<マスターの行[]> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: 対象 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator("form#edit_form table.mtg-master-table"), `${対象}の一覧`).toBeVisible();
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { 番号: string; 日本語名: string; 英語名: string; 名称: string; 並び順: string }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "");
      out.push({ 番号: m[1], 日本語名: v("name_jp") || v("nameJp"), 英語名: v("name_en") || v("nameEn"), 名称: v("name"), 並び順: v("sort_no") || v("sortNo") });
    }
    return out;
  });
}

// ---------------------------------------------------------------------------
// カード一覧（カード詳細画面での新規登録）
// ---------------------------------------------------------------------------

export type F0904カード = {
  名日: string; 名英: string;
  /** カードタイプの表示名（日本語名） */
  カードタイプ: string[];
  /** 特殊タイプの表示名（日本語名）。選ばないなら空 */
  特殊タイプ?: string[];
  /** 色順の選択肢の値（MTGマスターデータ管理の色順の行の番号）。選ばないなら省略 */
  色順?: string;
};

/**
 * カード一覧の「新規登録」で開くカード詳細画面で、カード名(日)・(英)、点数で見たマナ・コスト=0、カードタイプ・特殊タイプ・色順を入れ、
 * 「詳細情報を追加」は押さずに「登録」を押す。登録後の編集画面のアドレスの番号（カードID）を返す。
 */
export async function カードを登録する(page: Page, v: F0904カード, what: string, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/card/new"));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `${what}: カード詳細画面`).toBeVisible();
  await form.locator("#admin_card_nameJp").fill(v.名日);
  await form.locator("#admin_card_nameEn").fill(v.名英);
  await form.locator("#admin_card_cmc").fill("0");
  const 選ぶ = async (sel: string, labels: string[], 欄: string) => {
    if (!labels.length) return;
    const select = form.locator(sel);
    const options = await select.locator("option").evaluateAll((ns) => ns.map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })));
    const values = labels.map((l) => {
      const hit = options.find((o) => o.label === l);
      if (!hit) throw new Error(`${what}: ${欄}に「${l}」の選択肢が無い（ある選択肢: ${options.map((o) => o.label).filter(Boolean).join("、")}）`);
      return hit.value;
    });
    await select.selectOption(values);
  };
  await 選ぶ('select[name="admin_card[cardtypes][]"]', v.カードタイプ, "カードタイプ");
  await 選ぶ('select[name="admin_card[specialtypes][]"]', v.特殊タイプ ?? [], "特殊タイプ");
  if (v.色順 !== undefined) {
    const sel = form.locator('select[name="admin_card[colorSequence]"]');
    await expect(sel.locator(`option[value="${v.色順}"]`), `${what}: 色順の選択肢（番号 ${v.色順}）`).toHaveCount(1);
    await sel.selectOption(v.色順);
  }
  await expect(page.locator("#card-details-container .detail-card"), `${what}: 詳細情報が無いまま（「詳細情報を追加」は押さない）`).toHaveCount(0);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    form.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).click(),
  ]);
  for (const w of await expectSaved(page, `${what}: カードの登録`)) issue(`${what}: カード登録時の警告「${w}」`);
  const m = /\/card\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`${what}: 登録後にカードの編集画面へ移らない（${page.url()}）`);
  return m[1];
}

// ---------------------------------------------------------------------------
// カテゴリ登録/編集（最上位の一覧の「サプライ・グッズ」の行のID）
// ---------------------------------------------------------------------------

/** カテゴリ登録/編集画面の最上位の一覧で、「サプライ・グッズ」の行のID欄（「ID:12 サプライ・グッズ (3)」）の番号を読む */
export async function サプライ・グッズのカテゴリID(page: Page): Promise<string> {
  await page.goto(adminUrl("/product/category"));
  await page.waitForLoadState("load");
  const link = page.locator("#ex-secondaryCol .c-directoryTree > ul > li > span > a").filter({ hasText: /^ID:\d+\s+サプライ・グッズ\s+\(\d+\)$/ });
  await expect(link, "最上位の一覧に「サプライ・グッズ」の行が1件").toHaveCount(1);
  const m = /^ID:(\d+)/.exec(((await link.textContent()) ?? "").trim());
  if (!m) throw new Error("「サプライ・グッズ」の行からIDを読めない");
  return m[1];
}

// ---------------------------------------------------------------------------
// デッキ一覧（デッキ登録CSVアップロード）
// ---------------------------------------------------------------------------

export type F0904CSVデッキ = {
  プレイヤー名: string;
  /** フォーマット名(英) */
  フォーマット: string;
  アーキタイプ: string; デッキ名: string;
  イベント名英: string; イベント名日: string;
  /** 「yyyy-mm-dd hh:mm:ss」 */
  開催日時: string;
  表示: boolean; リスト非公開: boolean;
  /** 「枚数 半角スペース カード名」の行（セルの中で改行して区切る） */
  メインリスト: string[];
};

/**
 * デッキ一覧の「CSV登録」（デッキ登録CSVアップロード）で、デッキを新しく登録する（デッキIDは空）。
 * 列の並びは、CSV登録画面に出ている列見出しの順に合わせる。書いていない列は空。
 */
export async function デッキをCSVで登録する(page: Page, rows: F0904CSVデッキ[], what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl("/deck/csv_import"));
  await page.waitForLoadState("load");
  const headers = (await page.locator("table.csv-format-table thead th").allInnerTexts()).map((t) => t.trim());
  if (headers.length === 0) throw new Error(`${what}: CSV登録画面に列の見出しが無い`);
  const need = ["プレイヤー名", "フォーマット", "アーキタイプ", "デッキ名", "イベント名(英)", "イベント名(日)", "イベント開催日", "表示フラグ", "デッキリスト非公開フラグ", "メインリスト", "デッキID"];
  for (const h of need) if (!headers.includes(h)) throw new Error(`${what}: CSV登録画面の列の見出しに「${h}」が無い（${headers.join("、")}）`);
  const value = (h: string, r: F0904CSVデッキ): string => ({
    プレイヤー名: r.プレイヤー名, フォーマット: r.フォーマット, アーキタイプ: r.アーキタイプ, デッキ名: r.デッキ名,
    "イベント名(英)": r.イベント名英, "イベント名(日)": r.イベント名日, イベント開催日: r.開催日時,
    表示フラグ: r.表示 ? "1" : "0", デッキリスト非公開フラグ: r.リスト非公開 ? "1" : "0", メインリスト: r.メインリスト.join("\n"),
  } as Record<string, string>)[h] ?? "";
  const text = [csvLine(headers), ...rows.map((r) => csvLine(headers.map((h) => value(h, r))))].join("\r\n") + "\r\n";
  await page.locator("#admin_csv_import_import_file").setInputFiles({ name: "f0904_decks.csv", mimeType: "text/csv", buffer: Buffer.from(text, "utf-8") });
  const upload = page.locator("#upload-button");
  await expect(upload, `${what}: 「CSVファイルをアップロード」が押せる`).toBeEnabled();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), upload.click()]);
  for (const w of await expectSaved(page, `${what}: デッキ登録CSVアップロード`)) issue(w);
}
