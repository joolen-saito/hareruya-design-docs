/**
 * M13-06 イベント申込一覧（検索入力）の画面操作（メニュー「イベント管理」→「イベント申込一覧」）。セレクタはここだけに書く。
 * あわせて、M13-06 のシードが使う画面操作（申込の登録・申込状況の変更・プレイヤーを選んだデッキの登録・フォーマットの用意）もここに置く。
 * 共通の部品（pages/admin/entry.ts・deck.ts）は変えない。entry.ts の申込登録は検索条件の開催日を空にしない（今日より前の日程が出ない）ので、
 * シード表の「開始時間の条件を空にして検索」のとおりに操作する版をここに書く。
 */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";
import { openEventCreate } from "./event";

/** 検索結果の1行（イベント申込を検索・デッキ登録を検索のどちらも同じ表） */
export type 結果の行 = {
  /** 申込IDの欄（デッキ登録を検索で申込の無い行は「なし」） */
  申込ID: string;
  /** プレイヤー名、デッキ登録状況の欄 */
  プレイヤー欄: string;
  /** イベント名、店舗、開催日の欄 */
  イベント欄: string;
  /** 申込日時、支払状況、番号の欄 */
  申込欄: string;
  /** 先頭の欄に一括編集用のチェックボックスがあるか */
  チェックあり: boolean;
  /** プレイヤー名、デッキ登録状況の欄にあるリンクの数 */
  プレイヤー欄のリンク数: number;
  行: Locator;
};

const norm = (s: string) => s.replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

export class EntryListPage {
  constructor(readonly page: Page) {}

  get 検索フォーム() { return this.page.locator("#search_form"); }
  get イベント名() { return this.page.locator("#admin_search_event_event_name"); }
  get 店舗() { return this.page.locator("#admin_search_event_base_info"); }
  get 申込状況() { return this.page.locator("#admin_search_event_entry_status"); }
  get 支払方法() { return this.page.locator("#admin_search_event_payment"); }
  get 支払番号() { return this.page.locator("#admin_search_event_payment_no"); }
  get 開始時間From() { return this.page.locator("#admin_search_event_start_date_from"); }
  get 開始時間To() { return this.page.locator("#admin_search_event_start_date_to"); }
  get イベント詳細ID() { return this.page.locator("#admin_search_event_event_detail_id"); }
  デッキ登録有無(名前: "登録デッキあり" | "デッキ未登録"): Locator { return this.page.locator("#admin_search_event_is_deck_registered").getByLabel(名前, { exact: true }); }
  検索種別(名前: "イベント申込を検索" | "デッキ登録を検索"): Locator { return this.page.locator("#admin_search_event_searchMode").getByLabel(名前, { exact: true }); }
  get 検索ボタン() { return this.page.locator("#search_form button[type='submit']"); }
  /** 「イベント情報を検索＞」ボタン（表示名の末尾に全角の＞が付く。重ねて表示する一覧を開くボタンで特定する） */
  get イベント情報を検索ボタン() { return this.page.locator('#search_form button[data-bs-target="#searchEventModal"]'); }

  /** 検索結果の表（一括編集用の「すべて選ぶ」チェックボックスを持つ表） */
  get 結果の表() { return this.page.locator("table:has(#check_all)"); }
  get 結果の行() { return this.結果の表.locator(":scope > tbody > tr"); }
  get 結果なしの文() { return this.page.getByText("検索条件に合致するデータが見つかりませんでした", { exact: true }); }
  get 一括編集リンク() { return this.page.locator('a[data-bs-target="#bulkUpdateModal"]'); }
  get 一括編集のモーダル() { return this.page.locator("#bulkUpdateModal"); }
  get 表示件数() { return this.page.locator("#page_count_pulldown"); }
  get CSVダウンロードボタン() { return this.page.locator("#entryCsvDownloadDropDown"); }
  get 出力項目設定リンク() { return this.page.locator("#result_list_main__csv_menu").getByRole("link", { name: "出力項目設定", exact: true }); }
  /** 並び順のメニューの中の、並べ替えのリンク（昇順・降順） */
  get 並べ替えのリンク() { return this.page.locator("#result_list_main__sort_menu .dropdown-menu-sort a.dropdown-item"); }
  get 結果のページ送り() { return this.page.locator(".card-body:has(#check_all) .pagination"); }

  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/event/entry"));
    await this.読み込みを待つ();
  }
  /** アドレス（パス）を指定して開く。例: "/event/entry/page/2" */
  async アドレスで開く(パス: string): Promise<void> {
    await this.page.goto(adminUrl(パス));
    await this.読み込みを待つ();
  }
  async 読み込みを待つ(): Promise<void> {
    await this.page.waitForLoadState("load");
    await expect(this.イベント名, "イベント申込一覧（検索入力）の検索条件の欄").toBeVisible({ timeout: 30_000 });
  }

  /** 店舗を選ぶ。空の配列は指定なし */
  async 店舗を選ぶ(店舗名: string[]): Promise<void> {
    await this.店舗.selectOption(店舗名.map((label) => ({ label })));
    await this.店舗.evaluate((el) => { const j = (window as unknown as { jQuery?: (e: Element) => { trigger: (n: string) => void } }).jQuery; if (j) j(el).trigger("change"); });
  }
  async 選ばれている店舗(): Promise<string[]> {
    return this.店舗.evaluate((el) => [...(el as HTMLSelectElement).selectedOptions].map((o) => (o.textContent ?? "").trim()).filter(Boolean));
  }
  async 申込状況を選ぶ(状況: string[]): Promise<void> {
    await this.申込状況.selectOption(状況.map((label) => ({ label })));
    await this.申込状況.evaluate((el) => { const j = (window as unknown as { jQuery?: (e: Element) => { trigger: (n: string) => void } }).jQuery; if (j) j(el).trigger("change"); });
  }
  async 開始時間を空にする(): Promise<void> {
    await this.開始時間From.fill("");
    await this.開始時間To.fill("");
  }

  /**
   * 選択欄（画面の部品で飾った複数選択）の選択肢の一覧を開き、表示された選択肢の文字を上から返す。開いた一覧は閉じずに返す（画面を撮るため）。
   */
  async 選択肢の一覧を開く(select: Locator): Promise<string[]> {
    const id = await select.getAttribute("id");
    const box = this.page.locator(`#${id} + .select2 .select2-selection`);
    await box.click();
    const list = this.page.locator(`#select2-${id}-results`);
    await expect(list, "選択肢の一覧").toBeVisible({ timeout: 10_000 });
    return (await list.locator(".select2-results__option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
  async 選択肢の一覧を閉じる(): Promise<void> { await this.page.keyboard.press("Escape"); }

  /**
   * 選択欄（画面の部品で飾った複数選択）を利用者と同じに開こうとし、選択肢の一覧が開いたかを返す。
   * 開かなかったときは、押せなかった理由（無効など）は問わず false。
   */
  async 選択欄を開けるか(select: Locator): Promise<boolean> {
    const id = await select.getAttribute("id");
    const box = this.page.locator(`#${id} + .select2 .select2-selection`);
    try { await box.click({ timeout: 3000 }); } catch { return false; }
    const opened = await this.page.locator(`#select2-${id}-results`).isVisible().catch(() => false);
    if (opened) await this.選択肢の一覧を閉じる();
    return opened;
  }
  /** 入力欄へ利用者と同じに文字を打とうとし、入った値を返す（打てなければ空のまま） */
  async 入力欄に打つ(input: Locator, 値: string): Promise<string> {
    try { await input.click({ timeout: 3000 }); await input.pressSequentially(値, { timeout: 3000 }); } catch { /* 打てない */ }
    return input.inputValue();
  }

  /** 検索するボタンを押し、結果の画面が出るまで待つ */
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.検索ボタン.click()]);
    await this.読み込みを待つ();
  }

  async 行を読む(): Promise<結果の行[]> {
    const out: 結果の行[] = [];
    for (const 行 of await this.結果の行.all()) {
      const td = 行.locator(":scope > td");
      out.push({
        申込ID: norm(await td.nth(1).innerText()),
        プレイヤー欄: norm(await td.nth(2).innerText()),
        イベント欄: norm(await td.nth(3).innerText()),
        申込欄: norm(await td.nth(4).innerText()),
        チェックあり: (await td.nth(0).locator("input.playerCheck").count()) > 0,
        プレイヤー欄のリンク数: await td.nth(2).locator("a").count(),
        行,
      });
    }
    return out;
  }
  /** 表示された申込ID（上から。空の欄・「なし」は除く） */
  async 表示された申込ID(): Promise<string[]> {
    return (await this.行を読む()).map((r) => r.申込ID).filter((t) => /^\d+$/.test(t));
  }
  /** 「検索結果：N件が該当しました」の N。出ていなければ null */
  async 該当件数(): Promise<number | null> {
    const m = /検索結果：\s*(\d+)\s*件/.exec((await this.検索フォーム.innerText()).replace(/\s+/g, " "));
    return m ? Number(m[1]) : null;
  }
  /** 検索結果のページ送りで、いまのページの番号。ページ送りが出ていなければ null */
  async いまのページ(): Promise<string | null> {
    const active = this.結果のページ送り.locator(".page-item.active");
    if ((await active.count()) === 0) return null;
    return (await active.first().innerText()).trim();
  }
  async 表示件数を選ぶ(件数: number): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.表示件数.selectOption({ label: `${件数}件` })]);
    await this.読み込みを待つ();
  }
  async ページを開く(n: number): Promise<void> {
    const link = this.結果のページ送り.getByRole("link", { name: String(n), exact: true });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click({ timeout: 30_000 })]);
    await this.読み込みを待つ();
  }
  /** サイドメニューの「イベント申込一覧」を押して開く（閉じていれば「イベント管理」を開いてから） */
  async サイドメニューから開く(): Promise<void> {
    const link = this.page.locator("nav").getByRole("link", { name: "イベント申込一覧", exact: true });
    if (!(await link.isVisible())) await this.page.locator('nav a[href="#nav-event"]').click();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), link.click({ timeout: 30_000 })]);
    await this.読み込みを待つ();
  }

  // ---- イベント情報を検索（重ねて表示する一覧）

  get モーダル() { return this.page.locator("#searchEventModal"); }
  get モーダルのイベント名() { return this.page.locator("#admin_entry_event_modal_event_name"); }
  get モーダルの店舗() { return this.page.locator("#admin_entry_event_modal_base_info"); }
  get モーダルの開催日From() { return this.page.locator("#admin_entry_event_modal_start_date_from"); }
  get モーダルの開催日To() { return this.page.locator("#admin_entry_event_modal_start_date_to"); }
  get モーダルの結果() { return this.page.locator("#searchEventModalList"); }

  async モーダルを開く(): Promise<void> {
    await this.イベント情報を検索ボタン.click({ timeout: 30_000 });
    await expect(this.モーダル, "イベント情報検索の重ねて表示する一覧").toBeVisible();
  }
  /** 日付の欄へ「2026/09/01」の形の値を入れる（欄が日付の入力欄なら「2026-09-01」に直す） */
  async 日付を入れる(欄: Locator, 値: string): Promise<void> {
    if (値 === "") { await 欄.fill(""); return; }
    const type = await 欄.getAttribute("type");
    await 欄.fill(type === "date" ? 値.replace(/\//g, "-") : 値);
  }
  async モーダルの店舗の選択肢(): Promise<string[]> {
    return this.モーダルの店舗.evaluate((el) => [...(el as HTMLSelectElement).options].filter((o) => o.value !== "").map((o) => (o.textContent ?? "").trim()));
  }
  async モーダルで選ばれている店舗(): Promise<string> {
    return this.モーダルの店舗.evaluate((el) => { const s = el as HTMLSelectElement; return s.value === "" ? "" : (s.selectedOptions[0]?.textContent ?? "").trim(); });
  }
  /** モーダルの検索ボタンを押し、結果（表・該当なしの文・入力エラー）が出るまで待つ */
  async モーダルで検索する(): Promise<void> {
    await this.page.locator("#searchEventModalButton").click();
    // 検索中は「検索中」の文だけが出る（該当なしの文と同じ形）。結果の表・該当なしの欄・入力エラー・通信エラーのどれかが出るまで待つ
    await expect(this.モーダルの結果.locator("table, #result_list_main__header, .alert-danger, p.text-danger").first(), "イベント情報検索の結果").toBeVisible({ timeout: 30_000 });
  }
  get モーダルの行() { return this.モーダルの結果.locator("table tbody tr"); }
  /** モーダルの一覧の「決定」ボタンの行き先の日程ID（上から） */
  async モーダルの日程ID(): Promise<string[]> {
    return this.モーダルの結果.locator("button.set-event").evaluateAll((bs) => bs.map((b) => b.getAttribute("data-detail") ?? ""));
  }
  /** モーダルの一覧で、イベントIDの欄がその番号の行（イベントの先頭の日程の行） */
  モーダルのイベント行(イベントID: string): Locator {
    return this.モーダルの行.filter({ has: this.page.locator("td[rowspan]:first-child", { hasText: new RegExp(`^\\s*${イベントID}\\s*$`) }) });
  }
  async モーダルのページを開く(n: number): Promise<void> {
    const before = await this.モーダルの日程ID();
    await this.モーダルの結果.locator(".pagination").getByRole("link", { name: String(n), exact: true }).click({ timeout: 30_000 });
    await expect.poll(async () => JSON.stringify(await this.モーダルの日程ID()), { message: "モーダルの一覧が次のページに替わる", timeout: 30_000 }).not.toBe(JSON.stringify(before));
  }
}

// ---- シードが使う画面操作

const 申込詳細の申込ID = async (page: Page): Promise<string> => {
  const m = /\/event\/entry\/(\d+)\/edit/.exec(page.url());
  const text = (await page.locator("#entryApplicationInfo").innerText()).replace(/\s+/g, " ");
  const shown = /申込ID\s*(\d+)/.exec(text)?.[1];
  if (!m || !shown) throw new Error(`イベント申込詳細・編集画面に移っていないか、申込IDが表示されない（${page.url()}）`);
  if (m[1] !== shown) throw new Error(`画面の申込ID ${shown} が、アドレスの番号 ${m[1]} と違う`);
  return shown;
};

/** イベント申込登録で、イベント名で検索し（開始時間の条件は空）、その日程の行の「新規登録」からイベント新規申込登録画面を開く */
export async function 新規申込登録画面を開く(page: Page, イベント名: string, 日程ID: string): Promise<void> {
  await page.goto(adminUrl("/entry_registration"));
  await page.waitForLoadState("load");
  await page.locator('#search_form [name="admin_search_event[multi]"]').fill(イベント名);
  await page.locator('#search_form [name="admin_search_event[start_date_from]"]').fill("");
  await page.locator('#search_form [name="admin_search_event[start_date_to]"]').fill("");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#search_form button[type='submit']").click()]);
  const link = page.locator(`a[href$="/entry_registration/new/${日程ID}"]`);
  if ((await link.count()) !== 1) throw new Error(`イベント申込登録の検索結果に、「${イベント名}」の日程 ${日程ID} の「新規登録」が ${await link.count()} 個ある（1個のはず）`);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
}

/** イベント新規申込登録画面のプレイヤー検索を開いて検索し、結果の表を返す */
export async function プレイヤーを検索する(page: Page, 語: string): Promise<Locator> {
  await page.locator("button.player_selector.search").first().click();
  const modal = page.locator("#searchPlayerModal");
  await expect(modal, "プレイヤー検索").toBeVisible();
  await modal.locator('[name="admin_event_entry_detail[search]"]').fill(語);
  await modal.locator("#searchPlayerModalButton").click();
  await expect(modal.locator("table.search-player-modal-table, p.text-center:not(:has-text('...'))").first(), "プレイヤー検索の結果").toBeVisible({ timeout: 30_000 });
  return modal.locator("table.search-player-modal-table tbody tr");
}

/** プレイヤー検索の結果で、IDの欄がその番号の行の「決定」を押す */
export async function プレイヤーを決定する(page: Page, 行: Locator, プレイヤーID: string): Promise<void> {
  const row = 行.filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^\\s*${プレイヤーID}\\s*$`) }) });
  await expect(row, `プレイヤー検索の結果に ID ${プレイヤーID} の行`).toHaveCount(1);
  await row.locator(".js-entry-player-select").click();
  await expect(page.locator("#searchPlayerModal")).toBeHidden();
}

/** プレイヤー検索の結果の行の [ID, 氏名（1行目）] */
export async function プレイヤー検索の行を読む(行: Locator): Promise<[string, string][]> {
  const out: [string, string][] = [];
  for (const r of await 行.all()) {
    const td = r.locator("td");
    out.push([(await td.nth(0).innerText()).trim(), ((await td.nth(1).innerText()).split("\n")[0] ?? "").trim()]);
  }
  return out;
}

/**
 * 申込を1件登録し、遷移したイベント申込詳細・編集画面の申込IDを返す（申込状況・支払方法は初期表示のまま）。
 * プレイヤー検索にはプレイヤー名（会員の姓）を入れ、出た行（1行のはず）の「決定」を押す。
 */
export async function 申込を登録する(page: Page, イベント名: string, 日程ID: string, プレイヤー名: string): Promise<string> {
  await 新規申込登録画面を開く(page, イベント名, 日程ID);
  const 行 = await プレイヤーを検索する(page, プレイヤー名);
  const 決定 = 行.locator(".js-entry-player-select");
  if ((await 決定.count()) !== 1) throw new Error(`プレイヤー検索「${プレイヤー名}」で、決定を押せる行が ${await 決定.count()} 行ある（1行のはず）`);
  await 決定.click();
  await expect(page.locator("#searchPlayerModal")).toBeHidden();
  await expect(page.locator("#submit_entry"), "プレイヤーを選ぶと登録を押せる").toBeEnabled();
  await page.locator("#submit_entry").click();
  await expectSaved(page, `イベント申込（${イベント名}・${プレイヤー名}）の登録`);
  return 申込詳細の申込ID(page);
}

/** イベント申込詳細・編集画面で申込状況を選び「登録」を押す */
export async function 申込状況を変える(page: Page, 申込ID: string, 状況: string): Promise<void> {
  await page.goto(adminUrl(`/event/entry/${申込ID}/edit`));
  await page.waitForLoadState("load");
  await chooseByLabel(page.locator('[name="admin_event_entry_detail[EntryStatus]"]'), 状況);
  await expect(page.locator("#submit_entry"), "イベント申込詳細・編集画面の登録ボタン").toBeEnabled();
  await page.locator("#submit_entry").click();
  await expectSaved(page, `申込ID ${申込ID} の申込状況の「${状況}」への変更`);
}

export type デッキの入力 = {
  デッキ名: string;
  /** プレイヤー検索に入れるプレイヤー名（会員の姓）。出た行（1行のはず）の「決定」を押す */
  プレイヤー名: string;
  /** イベント検索に入れるイベント名と店舗。開催日（「2026/09/10」の形の日付の部分）とその日程IDの行の「決定」を押す */
  イベント名: string; 店舗: string; 日程ID: string; 開催日: string;
};

/**
 * デッキ一覧の「新規登録」からデッキを登録し、振られたデッキIDを返す（遷移したデッキ編集画面のアドレスから読む）。
 * フォーマット・アーキタイプは登録済みの任意のもの（選択肢の先頭）。デッキタイプと公開状態は初期表示のまま。カード情報は空のまま。
 */
export async function プレイヤーのデッキを登録する(page: Page, v: デッキの入力): Promise<string> {
  await page.goto(adminUrl("/deck"));
  await page.getByRole("link", { name: "新規登録", exact: true }).click();
  await page.waitForURL(/\/deck\/new$/, { waitUntil: "load" });
  const f = (name: string) => page.locator(`[name="admin_deck[${name}]"]`);
  await f("deckName").fill(v.デッキ名);
  for (const name of ["Format", "Archetype"]) {
    const values = (await f(name).locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))).filter(Boolean);
    if (values.length === 0) throw new Error(`デッキ新規登録画面の${name === "Format" ? "フォーマット" : "アーキタイプ"}に選択肢が無い（デッキを登録できない）`);
    await f(name).selectOption(values[0]);
  }
  // プレイヤー
  await page.locator('[data-bs-target="#searchPlayerModal"]').click();
  const pm = page.locator("#searchPlayerModal");
  await expect(pm).toBeVisible();
  await pm.locator("#player_search_word").fill(v.プレイヤー名);
  await pm.locator("#btn_search_player").click();
  await expect(pm.locator("#player_search_results table, #player_search_results p").first(), "デッキのプレイヤー検索の結果").toBeVisible({ timeout: 30_000 });
  const 選ぶ = pm.locator("button.select-player");
  if ((await 選ぶ.count()) !== 1) throw new Error(`デッキのプレイヤー検索「${v.プレイヤー名}」で、決定を押せる行が ${await 選ぶ.count()} 行ある（1行のはず）`);
  await 選ぶ.click();
  await expect(pm).toBeHidden();
  await expect(f("playerId"), "プレイヤーを選ぶと、デッキにプレイヤーが設定される").not.toHaveValue("");
  // イベント
  await page.locator('[data-bs-target="#searchEventModal"]').click();
  const em = page.locator("#searchEventModal");
  await expect(em).toBeVisible();
  await em.locator("#event_search_word").fill(v.イベント名);
  await chooseByLabel(em.locator("#event_search_shop"), v.店舗);
  await em.locator("#btn_search_event").click();
  const 選択 = em.locator(`button.select-event[data-id="${v.日程ID}"]`);
  await expect(選択, `デッキのイベント検索の結果に「${v.イベント名}」の日程 ${v.日程ID} の行`).toBeVisible({ timeout: 30_000 });
  expect((await 選択.getAttribute("data-date")) ?? "", "選ぶ行の開催日").toContain(v.開催日);
  await 選択.click();
  await expect(f("eventDetailId"), "イベントを選ぶと、デッキに日程が設定される").toHaveValue(v.日程ID);
  await expect(em).toBeHidden();
  await page.locator('button[type="submit"][form="admin_deck"]').click();
  await expectSaved(page, `デッキ「${v.デッキ名}」の登録`);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`デッキ「${v.デッキ名}」を登録したが、デッキ編集画面へ遷移しない（${page.url()}）`);
  return m[1];
}

/**
 * フォーマット（イベントに表示）を用意する。イベント登録画面のフォーマットの選択肢にすでにあれば作らずそれを使い、
 * 無ければフォーマット登録画面で登録する（フォーマット名(英)・フォーマットコード・並び順は渡した値）。
 */
export async function フォーマットを用意する(page: Page, v: { 名前日: string; 名前英: string; コード: string; 並び順: string }): Promise<void> {
  const form = await openEventCreate(page);
  if ((await form.options(form.フォーマット)).includes(v.名前日)) return;
  await page.goto(adminUrl("/format/new"));
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`#admin_format_${name}`);
  await f("nameJp").fill(v.名前日);
  await f("nameEn").fill(v.名前英);
  await f("code").fill(v.コード);
  await f("rank").fill(v.並び順);
  await setChecked(f("isShownInEvent"), true);
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `フォーマット「${v.名前日}」の登録`);
}
