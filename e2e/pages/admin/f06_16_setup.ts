/**
 * F06-16 大会デッキ登録編集・F06-17 大会デッキ登録確認〜完了 のシードが使う、管理画面・フロントの操作の組み合わせ。
 * - 会員は、フロントの新規会員登録で作る（依頼者決定 2026-10-31）。英字名は管理画面の会員編集で入れる。
 * - 大会（イベント）と日程は、イベント登録画面と「日程追加」で作る。店舗・フォーマットは共有シードが作る。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { hideDebugToolbar, withAdminSession, Account, adminUrl } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { registerFrontMember } from "../front/member_entry";
import { 会員IDをメールから } from "./f07_04_setup";
import { registerEvent } from "./event";
import { registerSchedule } from "./schedule";
import { findFormat } from "./m14_card";
import { フォーマットを登録する, 登録を押す, 編集画面を開く } from "./m14_10_format";
import { M08CustomerEditPage } from "./m08_customer_edit";
import { chooseByLabel, expectSaved } from "./common";

export const 会員のパスワード = "Passw0rd!F0616";
export const 店名 = "晴れる屋2";

export type 試験会員 = { メール: string; パスワード: string; 会員ID: string };

export type 会員の指定 = {
  ベース: string; 姓?: string; 名?: string; セイ?: string; メイ?: string;
  /** 管理画面の会員編集で入れる英字名（MTG Companion登録本名(英語)）。省略は入れない */
  英字名?: { 姓: string; 名: string };
};

/** フロントの新規会員登録で会員を作り（メールの前半に実行の印）、管理画面の会員一覧で会員IDを読み、英字名を入れる */
export async function 会員を用意する(browser: Browser, v: 会員の指定): Promise<試験会員> {
  const メール = `${rc(v.ベース)}@example.test`.toLowerCase();
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    await registerFrontMember(page, { 姓: v.姓 ?? "山田", 名: v.名 ?? "太郎", セイ: v.セイ ?? "ヤマダ", メイ: v.メイ ?? "タロウ", メール, パスワード: 会員のパスワード });
  } finally {
    await context.close();
  }
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    const id = await 会員IDをメールから(page, メール);
    if (v.英字名) {
      const e = new M08CustomerEditPage(page);
      await e.open(id);
      await e.set("Player][lastNameEn", v.英字名.姓);
      await e.set("Player][firstNameEn", v.英字名.名);
      await e.登録する();
      await expectSaved(page, `会員 ${メール} の英字名の登録`);
    }
    return id;
  });
  return { メール, パスワード: 会員のパスワード, 会員ID };
}

export type フォーマット指定 = { 名: string; コード: string; 並び順: string; チェック: Record<string, boolean> };
export const 参照フォーマット: フォーマット指定[] = [
  { 名: "Standard", コード: "X6S", 並び順: "9601", チェック: { rankingFlg: true, OtherMetaFlg: false, isShownInEvent: true, useCommandFlg: false } },
  { 名: "Modern", コード: "X6M", 並び順: "9602", チェック: { rankingFlg: false, OtherMetaFlg: true, isShownInEvent: true, useCommandFlg: false } },
  { 名: "Legacy", コード: "X6L", 並び順: "9603", チェック: { rankingFlg: false, OtherMetaFlg: false, isShownInEvent: true, useCommandFlg: false } },
  { 名: "Commander", コード: "X6C", 並び順: "9604", チェック: { rankingFlg: false, OtherMetaFlg: false, isShownInEvent: true, useCommandFlg: true } },
];

/** フォーマットが無ければ登録する（あれば使う）。登録したフォーマットIDを返す */
export async function フォーマットを用意する(page: Page, f: フォーマット指定): Promise<string> {
  const found = await findFormat(page, f.名);
  if (found) {
    // 前に登録したフォーマットに、マイデッキの絞り込みに出すチェックが無ければ足す
    await 編集画面を開く(page, found);
    const box = page.locator('[name="admin_format[DeckbuilderFlg]"]');
    if (!(await box.isChecked())) { await box.setChecked(true); await 登録を押す(page); await expectSaved(page, `フォーマット ${f.名} の更新`); }
    return found;
  }
  return フォーマットを登録する(page, { 名日: f.名, 名英: f.名, 並び順: f.並び順, コード: f.コード, チェック: { ...f.チェック, DeckbuilderFlg: true } }, `F06-16 参照フォーマット ${f.名}`);
}

export type 日程の指定 = { 開始: string; デッキ登録: boolean; 締切: string; 終了する?: boolean };

/** 大会（イベント）と日程を1つ登録する（店舗は晴れる屋2、公開、受付なし）。日程のイベント詳細IDを返す */
export async function 大会を登録する(page: Page, v: { 名: string; 英名?: string; 店舗?: string; フォーマット: string[]; 日程: 日程の指定 }): Promise<{ イベントID: string; 日程ID: string }> {
  const イベントID = await registerEvent(page, {
    イベント名日: v.名, イベント名英: v.英名 ?? (v.名.replace(/[^\x20-\x7E]/g, "").trim() || "F0616 Event"), 店舗: v.店舗 ?? 店名, フォーマット: v.フォーマット,
    ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "10", 参加費: "0",
  });
  const 日程ID = await registerSchedule(page, イベントID, {
    開始時間: v.日程.開始, 受付あり: false, デッキ登録あり: v.日程.デッキ登録, 公開状態: "公開",
    ...(v.日程.デッキ登録 ? { デッキ登録締切: v.日程.締切, デッキ登録を終了する: v.日程.終了する ?? false } : {}),
  });
  return { イベントID, 日程ID };
}

export type 管理者 = Account;

/** カード一覧の「カード名リスト作成」を押し、フォーマット別のカード名候補（サジェストの元）を作り直す */
export async function カード名リストを作る(page: Page): Promise<string> {
  await page.goto(adminUrl("/card"));
  await page.waitForLoadState("load");
  const msgs: string[] = [];
  page.on("dialog", (d) => { msgs.push(d.message()); void d.accept(); });
  await page.locator("#generate-card-list-btn").click({ timeout: 20_000 });
  const t0 = Date.now();
  while (msgs.length < 2 && Date.now() - t0 < 120_000) await page.waitForTimeout(500);
  return msgs[1] ?? msgs[0] ?? "";
}

export type マイデッキ = { 名: string; フォーマット: string; 選手ID: string; 選手名: string; メイン: string; サイド?: string; 統率?: string };

/** デッキ新規登録画面で、デッキタイプ user のデッキ（マイデッキ）を登録し、デッキIDを返す。所有する選手は、選手IDと名前を入力欄へ直接入れる（プレイヤー検索の結果の選択と同じ値） */
export async function マイデッキを登録する(page: Page, v: マイデッキ): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_deck[${n}]"]`);
  await f("deckName").fill(v.名);
  await chooseByLabel(f("DeckType"), "user");
  await chooseByLabel(f("Format"), v.フォーマット);
  const opts = (await f("Archetype").locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })))).filter((o) => o.v);
  if (opts.length) await f("Archetype").selectOption({ label: opts[0].t });
  await chooseByLabel(f("Disp"), "非公開");
  await page.locator("#admin_deck_playerId").evaluate((o, [id, name]) => { (o as HTMLInputElement).value = id; (document.getElementById("admin_deck_playerName") as HTMLInputElement).value = name; }, [v.選手ID, v.選手名]);
  await f("textMain").fill(v.メイン);
  if (v.サイド !== undefined) await f("textSide").fill(v.サイド);
  if (v.統率 !== undefined) await f("textCommand").fill(v.統率);
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  await expectSaved(page, `マイデッキ「${v.名}」の登録`);
  const m = /\/deck\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`マイデッキを登録したが、デッキ編集画面へ移らない（${page.url()}）`);
  return m[1];
}

/** アーキタイプ登録画面で、フォーマットと代表カード（検索して先頭を選ぶ。画像つきの既存カード）を指定して登録する */
export async function アーキタイプを用意する(page: Page, v: { 名日: string; 名英: string; フォーマット: string }): Promise<void> {
  await page.goto(adminUrl("/archetype/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_archetype[${n}]"]`);
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  await chooseByLabel(f("Disp"), "公開");
  await chooseByLabel(f("Format"), v.フォーマット);
  await page.locator('[data-bs-target="#searchCardImageModal"]').click();
  const m = page.locator("#searchCardImageModal");
  await m.locator("#card_image_search_word").fill("Lightning Bolt");
  await m.locator("#btn_search_card_image").click();
  const 決定 = m.locator("button.select-card-image").first();
  await 決定.waitFor({ state: "visible", timeout: 60_000 });
  await 決定.click();
  await page.locator('button[type="submit"][form="admin_archetype"]').first().click();
  await expectSaved(page, `アーキタイプ「${v.名日}」の登録`);
}
