/**
 * F09-01 デッキ検索TOP のシードで使う、管理画面の操作。セレクタはここだけに置く。
 * フォーマット管理（ランキング表示・メタ分布簡易化・デッキ検索条件に表示の切り替えを含む）・アーキタイプ一覧（カラー）・
 * デッキ一覧（新規登録・CSV登録）・直近の大会管理・デッキタグ（MTGマスターデータ管理）・カード一覧（カード名リスト作成）。
 * 既存の部品（m12_deck_seed・m15_deck）は名前に実行の印を自分で付ける・デッキリスト公開状態の欄を扱わないため、この機能用に置く。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { csvLine } from "../../lib/csv";
import { chooseByLabel, expectSaved, setChecked } from "./common";

type Issue = (m: string) => void;

// ---------------------------------------------------------------------------
// 日付（日本時間の実施日から数える）
// ---------------------------------------------------------------------------

/** 日本時間の今日から n 日後（負なら n 日前）の「yyyy-mm-dd」 */
export function 日付(日後: number): string {
  const base = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 日後);
  return d.toISOString().slice(0, 10);
}
/** 「yyyy-mm-dd」を画面の表示「yyyy/mm/dd」にする */
export const 表示日付 = (iso: string) => iso.replace(/-/g, "/");

// ---------------------------------------------------------------------------
// フォーマット管理
// ---------------------------------------------------------------------------

export type フォーマット定義 = {
  /** フォーマット名(日)・(英)に入れる値（実行の印つき）。フォーマットコードはこの値から作る（フォーマットコード()） */
  名: string;
  表示順: string;
  ランキング: boolean;
  その他メタ: boolean;
  メタ日数: string;
  検索対象: boolean;
};

/**
 * フォーマットコード。画面の入力規則（10文字以内）に合わせ、印つきのフォーマット名から重ならない10文字の英数字を作る
 * （名前をそのまま入れると長すぎて登録できなかった。2026-11-09）。公開側のタブはこのコードで区別される。
 */
export function フォーマットコード(名: string): string {
  let h = 2166136261;
  for (const ch of 名) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619) >>> 0; }
  let h2 = 5381;
  for (const ch of 名) { h2 = (Math.imul(h2, 33) + ch.codePointAt(0)!) >>> 0; }
  return ("F" + h.toString(36) + h2.toString(36)).slice(0, 10).toUpperCase();
}

/** フォーマット管理の新規登録で登録し、フォーマットの番号（編集画面のアドレスの番号）を返す */
export async function フォーマットを登録する(page: Page, v: フォーマット定義, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名);
  await f("code").fill(フォーマットコード(v.名));
  await f("rank").fill(v.表示順);
  await f("MetaRange").fill(v.メタ日数);
  await setChecked(f("searchFlg"), v.検索対象);
  await setChecked(f("rankingFlg"), v.ランキング);
  await setChecked(f("OtherMetaFlg"), v.その他メタ);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名}」の登録`)) issue(w);
  const m = /\/format\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`フォーマット「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** フォーマット一覧に並ぶフォーマットの番号（編集画面へのリンクから読む） */
async function フォーマットの番号の一覧(page: Page): Promise<string[]> {
  const res = await page.goto(adminUrl("/format"));
  if (!res || !res.ok()) throw new Error(`フォーマット一覧を開けない（応答 ${res?.status() ?? "なし"}）`);
  const ids = await page.locator('a[href*="/format/"][href$="/edit"]').evaluateAll((as) => as
    .map((a) => /\/format\/(\d+)\/edit/.exec((a as HTMLAnchorElement).getAttribute("href") ?? "")?.[1] ?? "")
    .filter(Boolean));
  return [...new Set(ids)];
}

/**
 * フォーマット管理で、登録済みのフォーマットを1件ずつ編集画面で開き、欄（ランキング表示・メタ分布簡易化）のチェックが
 * 入っていれば外して「登録」を押す。外した件数と、確かめた件数を返す。
 */
export async function すべてのフォーマットの欄を外す(page: Page, 欄: "ランキング表示" | "メタ分布簡易化", issue: Issue): Promise<{ 外した: number; 確かめた: number }> {
  const name = 欄 === "ランキング表示" ? "rankingFlg" : "OtherMetaFlg";
  const ids = await フォーマットの番号の一覧(page);
  if (ids.length === 0) throw new Error("フォーマット一覧にフォーマットが1件も無い");
  let 外した = 0;
  for (const id of ids) {
    await page.goto(adminUrl(`/format/${id}/edit`));
    await page.waitForLoadState("load");
    const box = page.locator(`[name="admin_format[${name}]"]`);
    if (!(await box.isChecked())) continue;
    await setChecked(box, false);
    await page.locator('button[type="submit"]').filter({ hasText: /^\s*登録\s*$/ }).first().click();
    for (const w of await expectSaved(page, `フォーマット（番号 ${id}）の${欄}を外す`)) issue(w);
    外した += 1;
  }
  // 外したあと、一覧の全件で欄が外れていることを確かめる
  for (const id of await フォーマットの番号の一覧(page)) {
    await page.goto(adminUrl(`/format/${id}/edit`));
    await page.waitForLoadState("load");
    if (await page.locator(`[name="admin_format[${name}]"]`).isChecked()) throw new Error(`フォーマット（番号 ${id}）の${欄}が外れていない`);
  }
  return { 外した, 確かめた: ids.length };
}

// ---------------------------------------------------------------------------
// アーキタイプ一覧
// ---------------------------------------------------------------------------

/** アーキタイプ一覧の新規登録（アーキタイプ名(日)・(英)・公開・フォーマット・カラー）。アーキタイプの番号を返す */
export async function アーキタイプを登録する(page: Page, v: { 名: string; フォーマット: string; カラー?: string[] }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(v.名);
  await f("nameEn").fill(v.名);
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), v.フォーマット);
  for (const c of v.カラー ?? []) {
    const label = page.locator('label[for^="admin_archetype_Colors_"]').filter({ hasText: new RegExp(`^\\s*${c}\\s*$`) });
    await expect(label, `アーキタイプ「${v.名}」: カラーの選択肢「${c}」`).toHaveCount(1);
    await setChecked(page.locator(`#${await label.getAttribute("for")}`), true);
  }
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  for (const w of await expectSaved(page, `アーキタイプ「${v.名}」の登録`)) issue(w);
  const m = /\/archetype\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`アーキタイプ「${v.名}」を登録したが、編集画面へ移らない（${page.url()}）`);
  return m[1];
}

// ---------------------------------------------------------------------------
// デッキ一覧
// ---------------------------------------------------------------------------

export type デッキ定義 = {
  デッキタイプ: "大会デッキ" | "ユーザーデッキ";
  公開: boolean;
  /** デッキリストを非公開にする（「非公開(採用カード情報を公開しない)」にチェック） */
  リスト非公開?: boolean;
  フォーマット: string; アーキタイプ: string; プレイヤー名: string;
  イベント名日: string; イベント名英: string;
  /** 「yyyy-mm-ddThh:mm」（日時の入力欄の値） */
  開催日時: string;
  順位?: string; 参加人数?: string;
  タグ?: string[];
};

/** デッキ一覧の「新規登録」で登録し、デッキの番号を返す */
export async function デッキを登録する(page: Page, v: デッキ定義, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
  // デッキタイプの選択肢は、画面ではマスターの名前のまま「event」「user」と出る（シード表: 大会デッキは event、ユーザーデッキは user）
  await chooseByLabel(f("DeckType"), v.デッキタイプ === "大会デッキ" ? "event" : "user");
  await chooseByLabel(f("Disp"), v.公開 ? "公開" : "非公開");
  await setChecked(f("privateFlg"), !!v.リスト非公開);
  await chooseByLabel(f("Format"), v.フォーマット);
  await chooseByLabel(f("Archetype"), v.アーキタイプ);
  if (v.タグ?.length) await chooseByLabel(page.locator('[name="admin_deck[DeckTags][]"]'), v.タグ);
  await f("playerName").fill(v.プレイヤー名);
  await f("eventNameJp").fill(v.イベント名日);
  await f("eventNameEn").fill(v.イベント名英);
  await f("eventDate").fill(v.開催日時);
  if (v.順位 !== undefined) await f("ranking").fill(v.順位);
  if (v.参加人数 !== undefined) await f("participants").fill(v.参加人数);
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  for (const w of await expectSaved(page, `デッキ（プレイヤー名「${v.プレイヤー名}」）の登録`)) issue(w);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`デッキ（プレイヤー名「${v.プレイヤー名}」）を登録したが、デッキ編集画面へ移らない（${page.url()}）`);
  return m[1];
}

export type CSVデッキ定義 = {
  プレイヤー名: string; フォーマット: string; アーキタイプ: string;
  イベント名英: string; イベント名日: string;
  /** 「yyyy-mm-dd hh:mm:ss」（秒まで） */
  開催日時: string;
  表示: boolean; リスト非公開: boolean;
  /** 「枚数 カード名」を改行で区切ったメインリスト。デッキリストを公開するときは必須（登録済みのカード名） */
  メインリスト?: string;
  順位?: string; 参加人数?: string;
};

/**
 * デッキ一覧の「CSV登録」（デッキ登録CSVアップロード）で、デッキを新規に登録する（デッキIDは空）。
 * 列の並びは、CSV登録画面に出る「CSVファイルの形式」の見出しの順に合わせる（CSV出力のファイルと同じ見出し）。
 */
export async function デッキをCSVで登録する(page: Page, rows: CSVデッキ定義[], what: string, issue: Issue): Promise<void> {
  await page.goto(adminUrl("/deck/csv_import"));
  await page.waitForLoadState("load");
  const headers = (await page.locator("table.csv-format-table thead th").allInnerTexts()).map((t) => t.trim());
  if (headers.length === 0) throw new Error(`${what}: CSV登録画面に列の見出しが無い`);
  const value = (h: string, r: CSVデッキ定義): string => ({
    プレイヤー名: r.プレイヤー名, フォーマット: r.フォーマット, アーキタイプ: r.アーキタイプ,
    "イベント名(英)": r.イベント名英, "イベント名(日)": r.イベント名日, イベント開催日: r.開催日時,
    表示フラグ: r.表示 ? "1" : "0", デッキリスト非公開フラグ: r.リスト非公開 ? "1" : "0",
    メインリスト: r.メインリスト ?? "", 順位: r.順位 ?? "", イベント参加人数: r.参加人数 ?? "",
  } as Record<string, string>)[h] ?? "";
  for (const need of ["プレイヤー名", "フォーマット", "アーキタイプ", "イベント名(英)", "イベント名(日)", "イベント開催日", "表示フラグ", "デッキリスト非公開フラグ", "デッキID"]) {
    if (!headers.includes(need)) throw new Error(`${what}: CSV登録画面の列の見出しに「${need}」が無い（${headers.join("、")}）`);
  }
  const text = [csvLine(headers), ...rows.map((r) => csvLine(headers.map((h) => value(h, r))))].join("\r\n") + "\r\n";
  await page.locator("#admin_csv_import_import_file").setInputFiles({ name: "f0901_decks.csv", mimeType: "text/csv", buffer: Buffer.from(text, "utf-8") });
  const upload = page.locator("#upload-button");
  await expect(upload, `${what}: 「CSVファイルをアップロード」が押せる`).toBeEnabled();
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), upload.click()]);
  for (const w of await expectSaved(page, `${what}: デッキ登録CSVアップロード`)) issue(w);
}

/** デッキ一覧でプレイヤー名を検索し、該当したデッキの番号を返す（CSVで登録したデッキの確かめ） */
export async function プレイヤー名でデッキを探す(page: Page, プレイヤー名: string): Promise<string[]> {
  await page.goto(adminUrl("/deck"));
  await page.waitForLoadState("load");
  // 検索欄の開催日(From)は初期表示で日付が入っているので空にする
  await page.locator('[name="admin_search_deck[event_date_from]"]').fill("");
  await page.locator('[name="admin_search_deck[event_date_to]"]').fill("");
  await page.locator('[name="admin_search_deck[player_name]"]').fill(プレイヤー名);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('#admin_search_deck button[type="submit"]').first().click()]);
  await expect(page.getByText(/検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした/).first(), "デッキ一覧の検索結果").toBeVisible({ timeout: 60_000 });
  return page.locator("input.searched_deck_id").evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value));
}

// ---------------------------------------------------------------------------
// 直近の大会管理
// ---------------------------------------------------------------------------

export type 直近の大会の行 = {
  /** 「yyyy-mm-ddThh:mm」 */
  開催日時: string; フォーマット: string; 大会名日: string; 大会名英: string; 参加人数: string;
};

/** 直近の大会管理の行の数（固定の行） */
export async function 直近の大会の行数(page: Page): Promise<number> {
  await page.goto(adminUrl("/deck/latest_event_deck"));
  await page.waitForLoadState("load");
  return page.locator("table.latest-event-deck-table").count();
}

/** 直近の大会管理で、上の行から順に値を入れ、使わない行は「消去」を押して空にし、「直近の大会設定」を押す */
export async function 直近の大会を設定し直す(page: Page, rows: 直近の大会の行[], issue: Issue): Promise<void> {
  const n = await 直近の大会の行数(page);
  if (n < rows.length) throw new Error(`直近の大会管理の行が ${n} 行しか無い（${rows.length} 行使う）`);
  const tables = page.locator("table.latest-event-deck-table");
  for (let i = 0; i < n; i++) {
    const t = tables.nth(i);
    await t.locator(".latest-event-deck-clear").click();
    const r = rows[i];
    if (!r) continue;
    await t.locator('input[name$="[eventDate]"]').fill(r.開催日時);
    await chooseByLabel(t.locator('select[name$="[Format]"]'), r.フォーマット);
    await t.locator('input[name$="[eventNameJp]"]').fill(r.大会名日);
    await t.locator('input[name$="[eventNameEn]"]').fill(r.大会名英);
    await t.locator('input[name$="[participants]"]').fill(r.参加人数);
  }
  await page.locator('#admin_latest_event_deck button[type="submit"]').first().click();
  for (const w of await expectSaved(page, "直近の大会設定")) issue(w);
}

// ---------------------------------------------------------------------------
// デッキタグ（MTGマスターデータ管理）
// ---------------------------------------------------------------------------

/** デッキタグ一覧で、日本語名が一致する行の番号 */
export async function デッキタグの番号(page: Page, 日本語名: string): Promise<string> {
  await page.goto(adminUrl("/data/mtg_master_data"));
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: "デッキタグ" });
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator('form[method="get"] button[type="submit"]').click()]);
  await page.waitForLoadState("load");
  const id = await page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs, name) => {
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (tr.querySelector(`[name="rows[${m[1]}][name_jp]"], [name="rows[${m[1]}][nameJp]"]`) as HTMLInputElement | null)?.value ?? "";
      if (v === name) return m[1];
    }
    return null;
  }, 日本語名);
  if (!id) throw new Error(`デッキタグ一覧に「${日本語名}」の行が無い`);
  return id;
}

// ---------------------------------------------------------------------------
// カード一覧（カード名リスト作成）
// ---------------------------------------------------------------------------

/** カード一覧の「カード名リスト作成」を押し、確認で実行する。終わりの知らせ（ダイアログ）の文を返す */
export async function カード名リストを作成する(page: Page): Promise<string> {
  await page.goto(adminUrl("/card"));
  await page.waitForLoadState("load");
  const messages: string[] = [];
  const done = new Promise<string>((resolve) => {
    const handler = (d: import("@playwright/test").Dialog) => {
      messages.push(d.message());
      void d.accept();
      if (d.type() === "alert") { page.off("dialog", handler); resolve(d.message()); }
    };
    page.on("dialog", handler);
  });
  await page.locator("#generate-card-list-btn").click();
  const msg = await Promise.race([done, page.waitForTimeout(180_000).then(() => "")]);
  if (!msg) throw new Error(`カード名リスト作成の終わりの知らせが出ない（出たダイアログ: ${messages.join(" / ")}）`);
  if (/エラー/.test(msg)) throw new Error(`カード名リスト作成がエラーになった: ${msg}`);
  return msg;
}
