/**
 * F07-04 イベント申込（フロント）のシードが使う、管理画面・フロントの操作の組み合わせ。
 * - 会員は、フロントの新規会員登録で作る（本登録のメールは手元の受け口で読む。依頼者決定 2026-10-31）。メールアドレスと氏名は実行の印つき。
 * - 大会（イベント）と日程は、イベント登録画面と、イベント編集画面の「日程追加」で作る。
 * - 選手IDは、イベント申込登録画面のプレイヤー検索の結果一覧のID列から読む（申込の登録をしないときは、読んだら画面を閉じる）。
 */
import { Browser, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar, adminUrl } from "../../lib/session";
import { rc, RUN_MARK } from "../../lib/run_marker";
import { registerFrontMember } from "../front/member_entry";
import { EventInput, registerEvent } from "./event";
import { registerSchedule, ScheduleInput } from "./schedule";
import { expectSaved } from "./common";
import { 実行日から } from "./f07_01_setup";

export type 試験会員 = { メール: string; パスワード: string; 姓: string; 名: string; 会員ID: string; 氏名: string };

export const 会員のパスワード = "Passw0rd!F0704";

/**
 * フロントの新規会員登録で会員を作る（本登録まで）。ベース（例: member-a-f0704-002）に実行の印を付けたものがメールアドレスの前半。
 * 名は、プレイヤー検索で取り違えない、この会員だけの値（識別＋実行の印）。会員IDは作ったあとに管理画面で読む（読むのは呼び出し側）。
 */
export async function 会員を作る(browser: Browser, ベース: string, 識別: string, 名の固定?: { 姓: string; 名: string }, パスワード = 会員のパスワード): Promise<Omit<試験会員, "会員ID">> {
  const メール = `${rc(ベース)}@example.test`.toLowerCase();
  const 姓 = 名の固定?.姓 ?? "F0704";
  const 名 = 名の固定?.名 ?? `${識別}${RUN_MARK}`.replace(/[^0-9A-Za-z]/g, "");
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓, 名, セイ: "シケン", メイ: "カイイン", メール, パスワード });
  } finally {
    await context.close();
  }
  return { メール, パスワード, 姓, 名, 氏名: `${姓} ${名}` };
}

/** 管理画面の会員一覧をメールアドレスで検索し、その会員の会員IDを返す */
export async function 会員IDをメールから(page: Page, メール: string): Promise<string> {
  await page.goto(adminUrl("/customer"));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_search_customer[multi]"]').fill(メール);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click()]);
  await page.waitForLoadState("load");
  const id = /ex-customer-(\d+)/.exec((await page.locator('tr[id^="ex-customer-"]').first().getAttribute("id")) ?? "")?.[1];
  if (!id) throw new Error(`会員 ${メール} が会員一覧に無い`);
  return id;
}

/** 会員を作り、会員IDまで読む（管理画面のセッションで） */
export async function 会員を作って会員IDを読む(browser: Browser, page: Page, ベース: string, 識別: string, 名の固定?: { 姓: string; 名: string }): Promise<試験会員> {
  const m = await 会員を作る(browser, ベース, 識別, 名の固定);
  return { ...m, 会員ID: await 会員IDをメールから(page, m.メール) };
}

export type 受付 = "中" | "前" | "後";
export type 日程の設定 = {
  /** 受付中＝オンライン受付が開始済みで終了前／前＝受付開始前／後＝受付終了後 */
  受付: 受付; 定員: string; 参加費: string;
  デッキ登録?: { 締切: string; 終了する: boolean };
  /** シード表が開始時間・オンライン受付時間を決めているとき、その値（書かなければ実行日からの値） */
  固定の時間?: { 開始: string; オンライン受付: { 開始: string; 終了: string } };
};

/** 開催日（YYYY-MM-DD）。日程ごとにずらす（同じ大会の日程が重ならないように） */
export const 開催日 = (n: number): string => 実行日から(30 + n, "10:00").slice(0, 10);

/** 日程の設定を、日程登録画面の入力にする。開始時間は現在より後（実行日の30日後〜）、オンライン受付時間は開始時間より前 */
export function 日程の入力(s: 日程の設定, n: number): ScheduleInput {
  const 開始 = s.固定の時間?.開始 ?? `${開催日(n)} 10:00`;
  const オンライン受付 = s.固定の時間?.オンライン受付 ?? (s.受付 === "中" ? { 開始: 実行日から(-2, "00:00"), 終了: 実行日から(29 + n, "10:00") }
    : s.受付 === "前" ? { 開始: 実行日から(10, "10:00"), 終了: 実行日から(20, "10:00") }
      : { 開始: 実行日から(-5, "10:00"), 終了: 実行日から(-3, "10:00") });
  return {
    開始時間: 開始, 受付あり: false, デッキ登録あり: !!s.デッキ登録, ...(s.デッキ登録 ? { デッキ登録締切: s.デッキ登録.締切, デッキ登録を終了する: s.デッキ登録.終了する } : {}),
    オンライン受付, 公開状態: "公開", 定員: s.定員, 参加費: s.参加費,
  };
}

export type 大会 = { イベント名: string; イベントID: string; 日程ID: string[]; 開催日: string[] };

/**
 * 大会（イベント）を登録し、日程を順に登録する。店舗は編集できる任意の店舗（Hareruya）、フォーマット・ルール適用度は任意の値。
 * 支払方法は、書いたときだけチェックを入れる（有料でオンライン受付ありの日程は、大会に支払方法が無いと登録できない）。
 */
export async function 大会を登録する(page: Page, v: { イベント名: string; イベント名英?: string; 店舗?: string; フォーマット?: string; チーム戦?: boolean; 支払方法?: string[]; 日程: 日程の設定[] }): Promise<大会> {
  const ev: EventInput = {
    イベント名日: v.イベント名, イベント名英: v.イベント名英 ?? (`${v.イベント名} Event`.replace(/[^\x20-\x7E]/g, "").trim() || "F0704 Event"), 店舗: v.店舗 ?? "Hareruya", フォーマット: [v.フォーマット ?? "スタンダード"],
    ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "10", 参加費: "0", チーム戦: v.チーム戦 ?? false, ...(v.支払方法 ? { 支払方法: v.支払方法 } : {}),
  };
  const イベントID = await registerEvent(page, ev);
  const 日程ID: string[] = [];
  for (const [i, s] of v.日程.entries()) 日程ID.push(await registerSchedule(page, イベントID, 日程の入力(s, i)));
  return { イベント名: v.イベント名, イベントID, 日程ID, 開催日: v.日程.map((d, i) => d.固定の時間?.開始.slice(0, 10) ?? 開催日(i)) };
}

/** 日程編集画面を開き、デッキ登録締切を書き換えて保存する（日程登録のあとで締切を過去にするため） */
export async function デッキ登録締切を直す(page: Page, イベントID: string, 日程ID: string, 締切: string): Promise<void> {
  await page.goto(adminUrl(`/event/${イベントID}/schedule/${日程ID}/edit`));
  await page.waitForLoadState("load");
  await page.locator('[name="admin_event_detail[deckRegistDeadline]"]').fill(締切.replace(" ", "T"));
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expectSaved(page, `日程 ${日程ID} のデッキ登録締切の変更`);
}

/** 登録後に遷移したイベント申込詳細・編集画面の「申込ID」を読む */
async function 申込IDを読む(page: Page): Promise<string> {
  const text = (await page.locator("form").first().innerText()).replace(/\s+/g, " ");
  const shown = /申込ID\s*(\d+)/.exec(text)?.[1];
  if (!shown) throw new Error(`イベント申込詳細・編集画面に「申込ID」が表示されない（${page.url()}）`);
  return shown;
}

/**
 * イベント申込登録で、大会の日程の「新規登録」を開き、プレイヤー検索で会員の氏名を検索して、結果一覧のID列の選手IDを読む。
 * 登録するときは、その行の決定を押して（申込状況はエントリー済みのまま）登録し、登録後の画面の申込IDも返す。
 * 登録しないときは、読んだら何も登録せず画面を閉じる（別の画面へ移る）。
 */
export async function 申込登録で選手を読む(page: Page, 大: 大会, 日程の番号: number, 氏名: string, 登録する: boolean): Promise<{ 選手ID: string; 申込ID?: string }> {
  const 日程ID = 大.日程ID[日程の番号];
  const 開催 = 大.開催日[日程の番号];
  await page.goto(adminUrl("/entry_registration"));
  await page.locator('#search_form [name="admin_search_event[multi]"]').fill(大.イベント名);
  const from = await page.locator('#search_form [name="admin_search_event[start_date_from]"]').inputValue();
  if (from && from > 開催) throw new Error(`イベント申込登録の検索条件「開催日」の開始日 ${from} が、日程の開催日 ${開催} より後`);
  await page.locator('#search_form [name="admin_search_event[start_date_from]"]').fill("");
  await page.locator("#search_form").getByRole("button", { name: "検索", exact: true }).click();
  await page.waitForLoadState("load");
  const row = page.locator("table tbody tr").filter({ has: page.locator(`a[href$="/entry_registration/new/${日程ID}"]`) });
  if ((await row.count()) !== 1) throw new Error(`イベント申込登録の検索結果に、「${大.イベント名}」の日程（日程ID ${日程ID}）の行が ${await row.count()} 件ある（1件のはず）`);
  await row.getByRole("link", { name: "新規登録" }).click();
  await page.waitForLoadState("load");
  await page.locator("button.player_selector.search").first().click();
  const modal = page.locator("#searchPlayerModal");
  await expect(modal).toBeVisible();
  await modal.locator('[name="admin_event_entry_detail[search]"]').fill(氏名);
  await modal.locator("#searchPlayerModalButton").click();
  await expect(modal.locator("table.search-player-modal-table, p.text-center:not(:has-text('...'))").first(), "プレイヤー検索の結果が出ない").toBeVisible({ timeout: 30_000 });
  const 決定 = modal.locator(".js-entry-player-select");
  if ((await 決定.count()) !== 1) {
    throw new Error(`プレイヤー検索で、会員「${氏名}」の決定ボタンが ${await 決定.count()} 個（1個のはず）: ${(await modal.locator(".modal-body").innerText()).replace(/\s+/g, " ").slice(0, 200)}`);
  }
  const 選手ID = (await 決定.first().getAttribute("data-player-id")) ?? "";
  const 表示のID = (await modal.locator("table.search-player-modal-table tbody tr").first().locator("td").first().innerText()).trim();
  if (!選手ID || 選手ID !== 表示のID) throw new Error(`選手IDが読めない（決定ボタンの値 ${選手ID}、結果一覧のID列 ${表示のID}）`);
  if (!登録する) {
    await modal.locator('[data-bs-dismiss="modal"]').first().click().catch(() => {});
    await page.goto(adminUrl("/entry_registration"));
    return { 選手ID };
  }
  await 決定.first().click();
  await expect(modal).toBeHidden();
  await expect(page.locator("#submit_entry"), "プレイヤーを選ぶと登録を押せる").toBeEnabled();
  await page.locator("#submit_entry").click();
  await expectSaved(page, `イベント申込（${大.イベント名}・${氏名}）の登録`);
  return { 選手ID, 申込ID: await 申込IDを読む(page) };
}

// ---- 管理画面のイベント申込一覧（検索入力）と、イベント申込詳細・編集 ----

export type 申込の行 = { 申込ID: string; 行の文: string; イベント名の欄: string };

/** イベント申込一覧で、検索種別「イベント申込を検索」・イベント名で検索する（開始時間は空、店舗は既定表示のまま）。件数と行を返す */
export async function 申込を検索する(page: Page, イベント名: string, 一覧を開く = true): Promise<{ 件数: number; 行: 申込の行[] }> {
  if (一覧を開く) await page.goto(adminUrl("/event/entry"));
  await page.waitForLoadState("load");
  const form = page.locator("#search_form");
  await form.locator('input[type="radio"][value="event_entry"]').first().check();
  await form.locator('[name="admin_search_event[event_name]"]').fill(イベント名);
  await form.locator('[name="admin_search_event[start_date_from]"]').fill("");
  await form.locator('[name="admin_search_event[start_date_to]"]').fill("");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), form.getByRole("button", { name: "検索", exact: true }).first().click()]);
  const total = /検索結果：\s*(\d+)\s*件/.exec((await page.locator("body").innerText()).replace(/\s+/g, " "));
  const 件数 = total ? Number(total[1]) : 0;
  const 行: 申込の行[] = [];
  for (const tr of await page.locator("table tbody tr").all()) {
    const tds = tr.locator("td");
    if ((await tds.count()) < 5) continue;
    行.push({ 申込ID: (await tds.nth(1).innerText()).trim(), 行の文: (await tr.innerText()).replace(/\s+/g, " ").trim(), イベント名の欄: (await tds.nth(3).innerText()).replace(/\s+/g, " ").trim() });
  }
  return { 件数, 行 };
}

/** 検索結果の行のプレイヤー名のリンクを押して、イベント申込詳細・編集画面を開く */
export async function 申込詳細を開く(page: Page, 申込ID: string): Promise<void> {
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator(`a[href$="/event/entry/${申込ID}/edit"]`).first().click()]);
}

export type 申込詳細 = { 申込ID: string; イベント名の欄: string; 店舗: string; フォーマット: string; 支払番号: string };

/** イベント申込詳細・編集画面の表示内容を読む */
export async function 申込詳細を読む(page: Page): Promise<申込詳細> {
  const rows = page.locator("#entryApplicationInfo .row");
  const value = async (見出し: RegExp): Promise<string> => {
    for (const r of await rows.all()) {
      const label = ((await r.locator("label").first().innerText().catch(() => "")) ?? "").trim();
      if (見出し.test(label)) return (await r.locator(".col-form-plain").first().innerText()).replace(/\s+/g, " ").trim();
    }
    return "";
  };
  return {
    申込ID: await value(/申込ID/), イベント名の欄: await value(/イベント名/), 店舗: await value(/店舗/), フォーマット: await value(/フォーマット/),
    支払番号: ((await page.locator("#payment_no").innerText().catch(() => "")) ?? "").trim(),
  };
}

/** イベント申込一覧（検索入力）画面を開く */
export async function 申込一覧を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/event/entry"));
  await page.waitForLoadState("load");
  await expect(page.locator("#search_form"), "イベント申込一覧（検索入力）画面").toBeVisible();
}

/** フォーマット登録画面で「ランキング表示」と「イベントに表示」にチェックを入れる（大会で選択できるフォーマットにする） */
export async function フォーマットのランキング表示とイベントに表示を付ける(page: Page): Promise<void> {
  await page.locator("#admin_format_rankingFlg").setChecked(true);
  await page.locator("#admin_format_isShownInEvent").setChecked(true);
}
