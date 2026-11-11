/**
 * M13-05 複製新規（イベント編集画面の「複製新規」から開く、複製元の値が入ったイベント登録の画面）。セレクタはここだけに書く。
 * 複製新規の画面は、イベント登録・イベント編集と同じ作りの画面（pages/admin/event.ts の EventForm）。ここには複製新規に固有の操作と、
 * M13-05 の確かめに要る読み取り（店舗のエラー・フォーマットのタグ・チーム項目・備考の入力欄 など）だけを足す。
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";
import { EventForm, EventInput, deleteEvent, openEventCreate } from "./event";
import { FormatPage } from "./f03_03_masters";

/** 複製新規の画面を、アドレスで開く（イベント編集画面の「複製新規」が開くアドレスと同じ） */
export async function openEventCopy(page: Page, 複製元ID: string): Promise<EventForm> {
  await page.goto(adminUrl(`/event/${複製元ID}/copy`));
  await page.waitForLoadState("load");
  const form = new EventForm(page);
  await expect(form.イベント名日, "複製新規の画面のイベント名(日)の欄").toBeVisible();
  return form;
}

/** イベント編集画面で「複製新規」を押し、複製新規の画面が開くのを待つ */
export async function pressCopy(form: EventForm, 複製元ID: string): Promise<void> {
  await form.複製新規ボタン.click();
  await form.page.waitForURL(new RegExp(`/event/${複製元ID}/copy$`), { waitUntil: "load" });
  await expect(form.イベント名日, "複製新規の画面のイベント名(日)の欄").toBeVisible();
}

/** 画面の見出しの横の小見出し（「イベント登録」「イベント編集」） */
export function 小見出し(page: Page): Locator { return page.locator(".c-pageTitle__subTitle"); }

/** 店舗の欄の下に出る入力エラーの文 */
export function 店舗のエラー(page: Page): Locator {
  return page.locator("div.col-8", { has: page.locator("#admin_event_baseInfo") }).locator(".invalid-feedback, .form-error-message");
}

/** 画面上部の成功メッセージ（緑の帯） */
export function 成功メッセージ(page: Page): Locator { return page.locator(".alert-success"); }

/** フォーマットの欄に並んでいるタグ（選ばれているフォーマット）の名前 */
export async function フォーマットのタグ(page: Page): Promise<string[]> {
  const tags = page.locator("#admin_event_formats + .select2 .select2-selection__choice");
  const out: string[] = [];
  for (const t of await tags.all()) {
    const title = await t.getAttribute("title");
    out.push((title ?? (await t.innerText())).replace(/^×/, "").trim());
  }
  return out;
}

/** フォーマットの欄のタグの「×」を押して、選ばれているフォーマットを全部外す（開いた候補の一覧は閉じる） */
export async function フォーマットの選択を外す(page: Page): Promise<number> {
  const removes = page.locator("#admin_event_formats + .select2 .select2-selection__choice__remove");
  let n = 0;
  while ((await removes.count()) > 0) {
    await removes.first().click();
    n++;
    if (n > 50) throw new Error("フォーマットのタグを外しきれない");
  }
  await page.keyboard.press("Escape");
  return n;
}

/** イベント登録の欄に、見出しの文字がある入力欄が無いか（チーム人数・席次などを探す）。見出しの文字を含む入力欄の行の数 */
export async function 見出しのある入力行の数(page: Page, 見出し: string): Promise<number> {
  const rows = page.locator("#event_form .row").filter({ hasText: 見出し }).filter({ hasNot: page.locator(".row") });
  let n = 0;
  for (const row of await rows.all()) {
    if ((await row.locator("input:not([type=hidden]), select, textarea").count()) > 0 && (await row.isVisible())) n++;
  }
  return n;
}

/** チーム戦のチェック以外の、チームに関する入力項目（項目名に team を含むもの）の数 */
export async function チーム戦以外のチーム項目の数(page: Page): Promise<number> {
  return page.locator('#event_form [name^="admin_event["]:not([name="admin_event[isTeamBattle]"])')
    .evaluateAll((es) => es.filter((e) => /team/i.test(e.getAttribute("name") ?? "")).length);
}

/** 備考(日)・備考(英)の入力欄（見出しの文字で探す）。無ければ件数0の Locator */
export function 備考の入力欄(page: Page, 言語: "日" | "英"): Locator {
  return page.locator("#event_form .row").filter({ hasText: `備考(${言語})` }).filter({ hasNot: page.locator(".row") }).locator("textarea, input:not([type=hidden])");
}

/** 日程一覧の表・各日程の申込人数・申込一覧へのリンクなど、日程に関する表示が画面にいくつあるか */
export async function 日程に関する表示(page: Page): Promise<{ 日程一覧の表: number; 日程の行: number; 申込一覧リンク: number; 日程追加: number; 繰返日程追加: number; チェックした日程削除: number }> {
  return {
    日程一覧の表: await page.locator("#form_schedule_bulk, table:has(tr[id^='ex-schedule-'])").count(),
    日程の行: await page.locator("tr[id^='ex-schedule-']").count(),
    申込一覧リンク: await page.getByRole("link", { name: "申込一覧" }).count(),
    日程追加: await page.getByRole("link", { name: "日程追加", exact: true }).count(),
    繰返日程追加: await page.getByRole("link", { name: "繰返日程追加", exact: true }).count(),
    チェックした日程削除: await page.getByRole("button", { name: "チェックした日程削除", exact: true }).count(),
  };
}

/** 画面のフォームに入っている値（DB確認の「保存されているイベント」と同じ形。選択項目は表示名） */
export type フォームの値 = {
  "イベント名(日)": string; "イベント名(英)": string; 店舗: string; フォーマット: string[]; ルール適用度: string; 公開状態: string;
  イベント規模: string; "バナーURL(日)": string; "バナーURL(英)": string; 定員: string; チーム戦: string; 支払方法: string[]; 参加費: string;
  "賞品(日)": string; "賞品(英)": string;
  フリー入力エリア: { "項目名(日)": string; "項目名(英)": string; "内容(日)": string; "内容(英)": string; 初期表示は閉じる: string }[];
};

export async function フォームの値を読む(form: EventForm): Promise<フォームの値> {
  const one = async (l: Locator) => (await form.selected(l))[0] ?? "";
  const 支払方法: string[] = [];
  for (const p of await form.支払方法の選択肢()) if (await form.支払方法(p).isChecked()) 支払方法.push(p);
  const area = async (n: 1 | 2 | 3) => {
    const f = form.フリー入力エリア(n);
    return {
      "項目名(日)": await f.項目名日.inputValue(), "項目名(英)": await f.項目名英.inputValue(), "内容(日)": await f.内容日.inputValue(), "内容(英)": await f.内容英.inputValue(),
      初期表示は閉じる: (await f.初期表示は閉じる.isChecked()) ? "真" : "偽",
    };
  };
  return {
    "イベント名(日)": await form.イベント名日.inputValue(), "イベント名(英)": await form.イベント名英.inputValue(), 店舗: await one(form.店舗),
    フォーマット: await form.selected(form.フォーマット), ルール適用度: await one(form.ルール適用度), 公開状態: await one(form.公開状態), イベント規模: await one(form.イベント規模),
    "バナーURL(日)": await form.バナーURL日.inputValue(), "バナーURL(英)": await form.バナーURL英.inputValue(), 定員: await form.定員.inputValue(),
    チーム戦: (await form.チーム戦.isChecked()) ? "真" : "偽", 支払方法, 参加費: await form.参加費.inputValue(),
    "賞品(日)": await form.賞品日.inputValue(), "賞品(英)": await form.賞品英.inputValue(),
    フリー入力エリア: [await area(1), await area(2), await area(3)],
  };
}

/** 会場の入力欄があれば会場を選ぶ。入力欄が無ければ選ばずに false を返す（会場はイベント登録の画面に無いことがある） */
export async function 会場を選ぶ(form: EventForm, 会場: string): Promise<boolean> {
  if ((await form.会場.count()) === 0) return false;
  await chooseByLabel(form.会場, 会場);
  return true;
}

/** 備考の入力欄があれば入れる。入力欄が無ければ入れずに false を返す */
export async function 備考を入れる(page: Page, 日: string, 英: string): Promise<boolean> {
  const jp = 備考の入力欄(page, "日"), en = 備考の入力欄(page, "英");
  if ((await jp.count()) === 0 || (await en.count()) === 0) return false;
  await jp.first().fill(日);
  await en.first().fill(英);
  return true;
}

/**
 * イベント登録画面で、会場・備考も含めて入力して登録し、振られたイベントIDを返す。
 * 会場・備考の入力欄が画面に無いときは入れずに登録し、入れられなかった項目を onIssue で知らせる。
 */
export async function 複製元を登録する(page: Page, v: EventInput, extra: { 会場?: string; 備考?: [string, string] }, onIssue: (m: string) => void): Promise<string> {
  const form = await openEventCreate(page);
  await form.fill(v);
  if (extra.会場 !== undefined && !(await 会場を選ぶ(form, extra.会場))) onIssue(`イベント登録画面に会場の入力項目が無いので、会場「${extra.会場}」は入れずに登録した`);
  if (extra.備考 !== undefined && !(await 備考を入れる(page, ...extra.備考))) onIssue("イベント登録画面に備考(日)・備考(英)の入力項目が無いので、備考は入れずに登録した");
  await form.登録ボタン.click();
  await expectSaved(page, `イベント「${v.イベント名日}」の登録`);
  const m = /\/event\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`イベント「${v.イベント名日}」を登録したが、イベント編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}

/** 登録・送信のあと、遷移したイベント編集画面のアドレスからイベントIDを読む。編集画面でなければ "" */
export function 編集画面のイベントID(page: Page): string {
  return /\/event\/(\d+)\/edit/.exec(new URL(page.url()).pathname)?.[1] ?? "";
}

/**
 * イベント一覧で検索語（名前の頭）を検索し、結果の行の候補をイベント編集画面で開いて、イベント名(日)が「名前」と完全に一致するイベントIDを返す。
 * 255文字のような長い名前は、一覧の欄で省略されることがあるので、編集画面の欄の値で比べる。
 */
export async function 長い名前のイベントID(page: Page, 検索語: string, 名前: string): Promise<string[]> {
  await page.goto(adminUrl("/event"));
  await page.locator('[name="admin_search_event[multi]"]').fill(検索語);
  // 開催日の検索条件は初期表示で「3か月前から」が入っていて、日程の無いイベントが出ない。空にして探す
  await page.locator('[name="admin_search_event[start_date_from]"]').fill("");
  await page.locator('[name="admin_search_event[start_date_to]"]').fill("");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.waitForLoadState("load");
  const cands = (await page.locator("table tbody tr td:first-child").allInnerTexts()).map((t) => t.trim()).filter((t) => /^\d+$/.test(t));
  const out: string[] = [];
  for (const id of cands) {
    await page.goto(adminUrl(`/event/${id}/edit`));
    await page.waitForLoadState("load");
    if ((await page.locator('[name="admin_event[nameJp]"]').inputValue()) === 名前) out.push(id);
  }
  return out;
}

/** 長い名前のイベントがあれば、イベント編集画面の削除で消して0件にする。0件にできなければ落とす */
export async function 長い名前のイベントを無くす(page: Page, 検索語: string, 名前: string): Promise<void> {
  for (const id of await 長い名前のイベントID(page, 検索語, 名前)) await deleteEvent(page, id);
  const left = await 長い名前のイベントID(page, 検索語, 名前);
  if (left.length) throw new Error(`イベント名(日)が「${名前.slice(0, 10)}…」（${名前.length}文字）のイベントを0件にできない（残り: イベントID ${left.join("、")}）`);
}

/**
 * フォーマット名(日)のフォーマットがあれば、その番号を返す。無ければフォーマット登録画面で登録し、編集画面のアドレスの番号を返す。
 * あるかどうかは、イベント登録画面のフォーマットの選択肢（値がフォーマットの番号）で見る。同じ名前が複数あれば、どれか決められないので止める。
 */
export async function ensureFormat(page: Page, 名称日: string, 名称英: string): Promise<string> {
  const find = async (): Promise<string | null> => {
    const form = await openEventCreate(page);
    const vals = await form.フォーマット.locator("option").evaluateAll((os, name) =>
      os.filter((o) => (o.textContent ?? "").trim() === name).map((o) => (o as HTMLOptionElement).value), 名称日);
    if (vals.length > 1) throw new Error(`フォーマット「${名称日}」が複数ある（番号 ${vals.join("、")}）。どれを使うか決められない`);
    return vals[0] ?? null;
  };
  const found = await find();
  if (found) return found;
  const f = new FormatPage(page);
  await f.openNew();
  await f.fill({ 名称日, 名称英, 並び順: "1" });
  return f.register(`フォーマット「${名称日}」の登録`);
}
