/** イベント一覧・イベント登録・イベント編集（メニュー「イベント管理」） */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";

export type FreeArea = { 項目名日?: string; 項目名英?: string; 内容日?: string; 内容英?: string; 初期表示は閉じる?: boolean };
export type EventInput = {
  イベント名日?: string; イベント名英?: string; 店舗?: string; フォーマット?: string[]; ルール適用度?: string; 公開状態?: string;
  イベント規模?: string; バナーURL日?: string; バナーURL英?: string; 定員?: string; チーム戦?: boolean; 支払方法?: string[];
  参加費?: string; 賞品日?: string; 賞品英?: string; フリー入力エリア?: [FreeArea?, FreeArea?, FreeArea?];
};

export class EventForm {
  constructor(readonly page: Page) {}

  field(name: string): Locator {
    return this.page.locator(`[name="admin_event[${name}]"], [name="admin_event[${name}][]"]`).first();
  }
  get イベント名日() { return this.field("nameJp"); }
  get イベント名英() { return this.field("nameEn"); }
  get 店舗() { return this.field("baseInfo"); }
  get 会場() { return this.page.getByLabel("会場", { exact: true }); }
  get フォーマット() { return this.field("formats"); }
  get ルール適用度() { return this.field("rel"); }
  get 公開状態() { return this.field("disp"); }
  get イベント規模() { return this.field("eventScale"); }
  get バナーURL日() { return this.field("bannerUrl"); }
  get バナーURL英() { return this.field("bannerEnUrl"); }
  get 定員() { return this.field("capacity"); }
  get チーム戦() { return this.field("isTeamBattle"); }
  get 参加費() { return this.field("entryFee"); }
  get 賞品日() { return this.field("prizeJp"); }
  get 賞品英() { return this.field("prizeEn"); }
  支払方法(名前: string): Locator { return this.page.getByLabel(名前, { exact: true }); }
  /** 支払方法の欄に並んでいる選択肢の表示名 */
  async 支払方法の選択肢(): Promise<string[]> {
    const out: string[] = [];
    for (const b of await this.page.locator('[name="admin_event[payments][]"]').all()) {
      out.push((await this.page.locator(`label[for="${await b.getAttribute("id")}"]`).innerText()).trim());
    }
    return out;
  }
  /** 選択欄に並んでいる選択肢の表示名（空の選択肢は除く） */
  async options(select: Locator): Promise<string[]> {
    return (await select.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
  フリー入力エリア(n: 1 | 2 | 3) {
    return {
      項目名日: this.field(`freeTextArea${n}LabelJp`), 項目名英: this.field(`freeTextArea${n}LabelEn`),
      内容日: this.field(`freeTextArea${n}ContentJp`), 内容英: this.field(`freeTextArea${n}ContentEn`),
      初期表示は閉じる: this.field(`isFreeTextArea${n}Accordion`),
    };
  }
  /** 「<br>タグを挿入」ボタン */
  get 改行タグ挿入ボタン() { return this.page.getByRole("button", { name: "<br>タグを挿入" }); }
  get 削除ボタン() { return this.page.locator("a.btn-ec-delete[data-bs-target^='#event_delete_']"); }
  get 日程追加ボタン() { return this.page.getByRole("link", { name: "日程追加", exact: true }); }
  get 繰返日程追加ボタン() { return this.page.getByRole("link", { name: "繰返日程追加", exact: true }); }
  get 複製新規ボタン() { return this.page.getByRole("link", { name: "複製新規", exact: true }); }
  get イベント一覧リンク() { return this.page.locator(".c-conversionArea").getByRole("link", { name: "イベント一覧", exact: true }); }
  get チェックした日程削除ボタン() { return this.page.getByRole("button", { name: "チェックした日程削除", exact: true }); }
  /** 画面下部の操作部（イベント一覧リンクと各ボタンが並ぶ帯） */
  get 操作部() { return this.page.locator(".c-conversionArea"); }

  /** 定員の入力欄の後ろに付く文字（接尾辞） */
  get 定員の接尾辞() { return this.page.locator("#capacityCounterWord"); }
  /** フォーマット欄の、文字を打って候補を絞る入力欄 */
  get フォーマットの入力欄() { return this.page.locator("#admin_event_formats + .select2 .select2-search__field"); }
  /** フォーマット欄に文字を打ったときに出る候補 */
  get フォーマットの候補() { return this.page.locator(".select2-results__option"); }
  /** 日程行の、見出しの欄の文字。見出しは日程一覧の表の見出しの文字 */
  async 日程の欄(日程ID: string, 見出し: string): Promise<string> {
    const heads = (await this.page.locator("table:has(tr[id^='ex-schedule-']) thead th").allInnerTexts()).map((t) => t.trim());
    const i = heads.indexOf(見出し);
    if (i < 0) throw new Error(`日程一覧に見出し「${見出し}」が無い（ある見出し: ${heads.filter(Boolean).join("、")}）`);
    return (await this.日程行(日程ID).locator("td").nth(i).innerText()).replace(/\s+/g, " ").trim();
  }

  /** 日程一覧の行 */
  日程行(日程ID: string): Locator { return this.page.locator(`#ex-schedule-${日程ID}`); }
  /** 日程一覧に並んでいる日程IDを、上から */
  async 日程ID一覧(): Promise<string[]> {
    return this.page.locator('tr[id^="ex-schedule-"]').evaluateAll((rows) => rows.map((r) => r.id.replace("ex-schedule-", "")));
  }
  /** 日程行の一括削除用チェックボックス */
  日程チェック(日程ID: string): Locator { return this.page.locator(`#check_schedule_${日程ID}`); }
  /** 日程行の見出し「開始時間」の欄の文字 */
  async 開始時間(日程ID: string): Promise<string> {
    const cells = this.日程行(日程ID).locator("td");
    // 編集できる管理者には、先頭に一括削除用のチェックボックスの欄がある
    const i = (await this.日程行(日程ID).locator('input[name="event_detail_ids[]"]').count()) > 0 ? 1 : 0;
    return (await cells.nth(i).innerText()).trim();
  }
  /** 日程行の「申込人数」の欄の文字（「申込人数 / 定員」） */
  async 申込人数(日程ID: string): Promise<string> {
    return (await this.日程行(日程ID).locator("td").filter({ hasText: /^\s*\d+\s*\/\s*\d+\s*$/ }).first().innerText()).trim();
  }
  日程の申込一覧リンク(日程ID: string): Locator { return this.日程行(日程ID).getByRole("link", { name: "申込一覧", exact: true }); }
  /** 日程行の編集ボタン（「…」のボタン。押すとポップアップメニューが開く） */
  日程の編集ボタン(日程ID: string): Locator { return this.日程行(日程ID).locator("button.dropdown-menu-toggle"); }
  日程メニューの編集(日程ID: string): Locator { return this.日程行(日程ID).locator(".dropdown-menu").getByRole("link", { name: "編集" }); }
  日程メニューの削除(日程ID: string): Locator { return this.日程行(日程ID).locator(".dropdown-menu").getByRole("button", { name: "削除" }); }
  /** 日程行の削除の確認ダイアログの「削除」 */
  日程削除の確定(日程ID: string): Locator { return this.page.locator(`#schedule_delete_${日程ID} a.btn-ec-delete`); }
  /** チェックした日程削除の確認ダイアログの「削除」 */
  get 一括削除の確定() { return this.page.locator("#schedule_bulk_delete_modal button.btn-ec-delete"); }

  /**
   * 登録・更新ボタンを押し、送信の結果の画面が出るまで待つ。
   * 必須項目の空など、ブラウザが送信を止めたときは画面が変わらないので、そのまま戻る（戻り値 false）。
   */
  async submit(button: Locator): Promise<boolean> {
    const sent = this.page.waitForRequest((r) => r.method() === "POST" && r.isNavigationRequest(), { timeout: 5000 }).then(() => true, () => false);
    await button.click();
    if (!(await sent)) return false;
    await this.page.waitForLoadState("domcontentloaded");
    return true;
  }

  /** 開発者ツールで行うのと同じに、入力欄へ画面からは入れられない値を入れる（数値欄を文字欄に変えて値を書く） */
  async forceValue(input: Locator, value: string): Promise<void> {
    await input.evaluate((e, v) => { (e as HTMLInputElement).type = "text"; (e as HTMLInputElement).value = v; }, value);
  }

  /** 開発者ツールで行うのと同じに、選択欄へ選択肢に無い値を足して選ぶ */
  async forceOption(select: Locator, value: string): Promise<void> {
    await select.evaluate((e, v) => {
      const s = e as HTMLSelectElement;
      if (![...s.options].some((o) => o.value === v)) s.add(new Option(v, v));
      s.value = v;
    }, value);
  }

  /**
   * 選択欄・入力欄を空にする。空にできない（空の選択肢が無い・項目そのものが無い）ときは、その理由を返す。
   * 空にできた・もともと空のときは null。
   */
  async clear(field: Locator, what: string): Promise<string | null> {
    if ((await field.count()) === 0) return `${what}: 入力項目が無い`;
    const tag = await field.evaluate((e) => e.tagName);
    if (tag !== "SELECT") { await field.fill(""); return null; }
    if (await field.evaluate((e) => (e as HTMLSelectElement).multiple)) { await field.selectOption([]); return null; }
    if ((await field.locator('option[value=""]').count()) === 0) return `${what}: 空の選択肢が無いので空にできない`;
    await field.selectOption("");
    return null;
  }

  /** イベント属性の欄で、その見出しの入力項目が使えるか（表示されていて無効でない入力・選択・チェック欄があるか） */
  async usable(見出し: string): Promise<boolean> {
    const rows = this.page.locator("form .row").filter({ hasText: 見出し }).filter({ hasNot: this.page.locator(".row") });
    for (const row of await rows.all()) {
      for (const c of await row.locator("input:not([type=hidden]), select, textarea").all()) {
        if ((await c.isVisible()) && (await c.isEnabled())) return true;
      }
    }
    return false;
  }

  get 登録ボタン() { return this.page.getByRole("button", { name: "登録", exact: true }); }
  get 更新ボタン() { return this.page.getByRole("button", { name: "更新", exact: true }); }

  /** 選択欄で、いま選ばれている選択肢の表示名 */
  async selected(select: Locator): Promise<string[]> {
    return (await select.locator("option:checked").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  /** 書いてある項目だけ入力する。書いていない項目は初期表示のままにする */
  async fill(v: EventInput): Promise<void> {
    if (v.イベント名日 !== undefined) await this.イベント名日.fill(v.イベント名日);
    if (v.イベント名英 !== undefined) await this.イベント名英.fill(v.イベント名英);
    if (v.店舗 !== undefined) await chooseByLabel(this.店舗, v.店舗);
    if (v.フォーマット !== undefined) await chooseByLabel(this.フォーマット, v.フォーマット);
    if (v.ルール適用度 !== undefined) await chooseByLabel(this.ルール適用度, v.ルール適用度);
    if (v.公開状態 !== undefined) await chooseByLabel(this.公開状態, v.公開状態);
    if (v.イベント規模 !== undefined) await chooseByLabel(this.イベント規模, v.イベント規模);
    if (v.バナーURL日 !== undefined) await this.バナーURL日.fill(v.バナーURL日);
    if (v.バナーURL英 !== undefined) await this.バナーURL英.fill(v.バナーURL英);
    if (v.定員 !== undefined) await this.定員.fill(v.定員);
    if (v.チーム戦 !== undefined) await setChecked(this.チーム戦, v.チーム戦);
    // 支払方法は、書いた名前の集まりがそのまま選択の全体（[] なら全部オフ）
    if (v.支払方法 !== undefined) {
      const 選択肢 = await this.支払方法の選択肢();
      for (const p of v.支払方法) if (!選択肢.includes(p)) throw new Error(`支払方法「${p}」が無い（ある選択肢: ${選択肢.join("、")}）`);
      for (const p of 選択肢) await setChecked(this.支払方法(p), v.支払方法.includes(p));
    }
    if (v.参加費 !== undefined) await this.参加費.fill(v.参加費);
    if (v.賞品日 !== undefined) await this.賞品日.fill(v.賞品日);
    if (v.賞品英 !== undefined) await this.賞品英.fill(v.賞品英);
    for (const [i, a] of (v.フリー入力エリア ?? []).entries()) {
      if (!a) continue;
      const f = this.フリー入力エリア((i + 1) as 1 | 2 | 3);
      if (a.項目名日 !== undefined) await f.項目名日.fill(a.項目名日);
      if (a.項目名英 !== undefined) await f.項目名英.fill(a.項目名英);
      if (a.内容日 !== undefined) await f.内容日.fill(a.内容日);
      if (a.内容英 !== undefined) await f.内容英.fill(a.内容英);
      if (a.初期表示は閉じる !== undefined) await setChecked(f.初期表示は閉じる, a.初期表示は閉じる);
    }
  }
}

/** イベント一覧を開き、「新規作成」からイベント登録画面を開く */
export async function openEventCreate(page: Page): Promise<EventForm> {
  await page.goto(adminUrl("/event"));
  await page.getByRole("link", { name: "新規作成" }).click();
  await expect(page).toHaveURL(/\/event\/create/);
  return new EventForm(page);
}

/** イベント編集画面を開く */
export async function openEventEdit(page: Page, イベントID: string): Promise<EventForm> {
  await page.goto(adminUrl(`/event/${イベントID}/edit`));
  return new EventForm(page);
}

/** イベント登録画面で登録し、振られたイベントIDを返す（登録後に遷移した画面のアドレスから読む） */
export async function registerEvent(page: Page, v: EventInput): Promise<string> {
  const form = await openEventCreate(page);
  await form.fill(v);
  await form.登録ボタン.click();
  await expectSaved(page, `イベント「${v.イベント名日}」の登録`);
  const m = /\/event\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`イベント「${v.イベント名日}」を登録したが、イベント編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}

/** イベント一覧でイベント名を検索し、イベント名(日)が一致する行のイベントIDを返す（検索は部分一致なので、行の名前で絞る） */
export async function searchEventIds(page: Page, イベント名日: string): Promise<string[]> {
  await page.goto(adminUrl("/event"));
  await page.locator('[name="admin_search_event[multi]"]').fill(イベント名日);
  // 開催日の検索条件は初期表示で「3か月前から」が入っていて、日程の無いイベントが出ない。空にして探す
  await page.locator('[name="admin_search_event[start_date_from]"]').fill("");
  await page.locator('[name="admin_search_event[start_date_to]"]').fill("");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.waitForLoadState("domcontentloaded");
  const ids: string[] = [];
  for (;;) {
    for (const row of await page.locator("table tbody tr").all()) {
      const name = (await row.locator("td").nth(1).innerText()).replace(/\u00a0/g, " ").trim();
      if (name === イベント名日 || name.startsWith(`${イベント名日} `)) ids.push((await row.locator("td").first().innerText()).trim());
    }
    const next = page.locator(".pagination .page-item:not(.disabled) a[rel='next'], .pagination a:has-text('次へ')").first();
    if ((await next.count()) === 0) break;
    await next.click();
    await page.waitForLoadState("domcontentloaded");
  }
  return ids;
}

/** イベント編集画面の「削除」を押して確定する */
export async function deleteEvent(page: Page, イベントID: string): Promise<void> {
  const form = await openEventEdit(page, イベントID);
  await form.削除ボタン.click();
  const modal = page.locator(`#event_delete_${イベントID}`);
  await expect(modal).toBeVisible();
  await modal.locator("a.btn-ec-delete").click();
  await page.waitForLoadState("domcontentloaded");
}

/** そのイベント名のイベントが登録0件であるようにする（あれば、イベント編集画面で削除する）。0件にできなければ落とす */
export async function ensureNoEvent(page: Page, イベント名日: string): Promise<void> {
  for (const id of await searchEventIds(page, イベント名日)) await deleteEvent(page, id);
  const left = await searchEventIds(page, イベント名日);
  if (left.length) throw new Error(`イベント名「${イベント名日}」のイベントを0件にできない（残り: イベントID ${left.join("、")}）`);
}

/**
 * イベント一覧でイベント名を検索し、表示件数とID降順を設定して、検索結果の指定ページを開く。
 * 開いたページの行のイベントID（上から）と、検索結果の件数を返す。
 */
export async function openEventSearchPage(page: Page, イベント名: string, 表示件数: number, ページ: number): Promise<{ ids: string[]; 件数: number }> {
  await page.goto(adminUrl("/event"));
  await page.locator('[name="admin_search_event[multi]"]').fill(イベント名);
  // 開催日の検索条件は初期表示で「3か月前から」が入っていて、日程の無いイベントが出ない。空にして探す
  await page.locator('[name="admin_search_event[start_date_from]"]').fill("");
  await page.locator('[name="admin_search_event[start_date_to]"]').fill("");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await page.waitForLoadState("load");
  const total = /検索結果：\s*(\d+)\s*件/.exec((await page.locator("body").innerText()).replace(/\s+/g, " "));
  const 件数 = total ? Number(total[1]) : 0;
  if (件数 > 0) {
    // 表示件数（選ぶと画面が切り替わる）
    const count = page.locator("#page_count_pulldown");
    if ((await count.locator("option:checked").innerText()).trim() !== `${表示件数}件`) {
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), count.selectOption({ label: `${表示件数}件` })]);
    }
    // 並び順は初期表示がID・降順。違っていたら選び直す
    if ((await page.locator("#sort_by_pulldown").inputValue()) !== "default" || (await page.locator("#sort_order_pulldown").inputValue()) !== "d") {
      await page.locator("#sort_by_pulldown").selectOption("default");
      await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#sort_order_pulldown").selectOption("d")]);
    }
    if (ページ > 1) {
      await page.locator(".pagination").getByRole("link", { name: String(ページ), exact: true }).click();
      await page.waitForURL(new RegExp(`/event/page/${ページ}(\\?.*)?$`), { waitUntil: "load" });
    }
  }
  const ids = (await page.locator("table tbody tr td:first-child").allInnerTexts()).map((t) => t.trim());
  return { ids, 件数 };
}
