// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F06-17 大会デッキ登録確認～完了のシードが使う、管理画面・フロントの操作の組み合わせ。セレクタはここだけに置く。
 * 既にある部品（会員登録画面・会員一覧・会員登録/編集・フォーマット一覧・カードCSV・カード登録・アーキタイプ登録・デッキ編集）を呼び出して使う。
 *
 * - 会員: フロントの会員登録画面で登録し（本登録のメールは読まない）、管理画面の会員登録/編集で会員ステータスを本会員にする
 *   （pages/admin/f02_02_setup.ts の「会員を登録して本会員にする」と同じ流れ。国・フリガナ・MTG Companion登録本名(英語)を指定できる版）。
 * - フォーマット: フォーマット詳細で、名称(日)(英)・並び順・メイン/サイドの上限下限・「ランキング表示」「イベントに表示」を入れる。
 *   同じフォーマット名(日)があれば、その編集画面で同じ値へそろえて保存する。
 * - カード（画像あり）: カード登録CSVアップロードで、使用可能・使用制限・使用禁止のフォーマット（フォーマット名(英)で指定）つきで取り込む。
 * - デッキ: デッキ新規登録画面（大会のデッキ種別・プレイヤー検索で選手を選ぶ）と、デッキ編集画面の「更新」。
 */
import { Browser, expect, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../../lib/session";
import { EntryPage } from "../front/f06_01_entry";
import { buildCardCsv, downloadCardCsvTemplate, readExistingCardValues, uploadCardCsv } from "./card_csv";
import { expectSaved, setChecked } from "./common";
import { openEventCreate } from "./event";
import { openEditFromResult, resultCustomerId, searchCustomer } from "./f06_customer";
import { M08CustomerEditPage } from "./m08_customer_edit";
import { findFormat } from "./m14_card";
import { デッキ編集画面 } from "./m15_05_deck_edit";

type Issue = (m: string) => void;

// ---- 会員 ----

export type F0617会員 = {
  姓: string; 名: string; セイ: string; メイ: string; メール: string; パスワード: string;
  海外: boolean;
  /** MTG Companion登録本名(英語)。undefined は空のまま */
  英姓?: string; 英名?: string;
  /** 日本の会員の住所・電話（省略は登録できる任意の値） */
  郵便番号?: string; 都道府県?: string; 住所1?: string; 住所2?: string; 電話番号?: string;
};

let telSeq = 0;
/** 会員ごとに違う電話番号（携帯の形の11桁） */
const 試験の電話番号 = (): string => `090${String((Date.now() + telSeq++) % 100_000_000).padStart(8, "0")}`;

/**
 * 本店の新規会員登録画面で登録し、管理画面の会員一覧でメールアドレスを検索して会員IDを読み、
 * 会員登録/編集で会員ステータスを本会員にして「会員情報を登録」を押す。会員IDを返す。
 */
export async function 会員を登録して本会員にする(browser: Browser, m: F0617会員, issue: Issue): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    const e = new EntryPage(page);
    await e.open();
    await e.fill(m.海外
      ? { 姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, 生年月日: ["1990", "1", "1"], メール: m.メール, パスワード: m.パスワード,
        国: "United States", 郵便番号: "10001", 住所1: "New York", 住所2: "1 Main Street", 電話番号: "2125550100", MTG姓: m.英姓, MTG名: m.英名 }
      : { 姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, 生年月日: ["1990", "1", "1"], メール: m.メール, パスワード: m.パスワード,
        国: "Japan", 郵便番号: m.郵便番号 ?? "1000001", 都道府県: m.都道府県 ?? "東京都", 住所1: m.住所1 ?? "千代田区千代田", 住所2: m.住所2 ?? "1-1",
        電話番号: m.電話番号 ?? 試験の電話番号(), MTG姓: m.英姓, MTG名: m.英名 });
    if (!(await e.同意する()).sent) throw new Error(`会員 ${m.メール} の登録: 「同意する」を押しても確認画面へ進めない`);
    if (!(await e.確認画面である())) throw new Error(`会員 ${m.メール} の会員情報登録で確認画面へ進めない（入力エラー: ${(await page.locator(".ec-errorMessage, .form-error-message, .invalid-feedback, .c-hareruya-form__error").allInnerTexts()).join(" / ")}）`);
    await e.登録する();
    if (e.登録エラー画面か) throw new Error(`会員 ${m.メール} の登録が登録エラーの画面になった（${e.path}）`);
  } finally { await context.close(); }
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await searchCustomer(page, m.メール);
    const id = await resultCustomerId(page, m.メール);
    if (!id) throw new Error(`会員 ${m.メール} が管理画面の会員一覧で1件に定まらない`);
    await openEditFromResult(page, m.メール);
    const ed = new M08CustomerEditPage(page);
    const before = await ed.選択中("status");
    await ed.選ぶ("status", "本会員");
    await ed.登録する();
    if (!(await ed.成功メッセージ())) throw new Error(`会員 ${m.メール} を本会員にする保存が成功の表示にならない（${(await ed.エラー文()).join(" / ")}）`);
    issue(`会員 ${m.メール} を登録した（会員ID ${id}。登録直後の会員ステータス「${before}」を本会員にして保存した）`);
    return id;
  });
}

// ---- フォーマット ----

export type F0617フォーマット = {
  名日: string; 名英: string; 並び順: string;
  メイン下限?: string; メイン上限?: string; サイド下限?: string; サイド上限?: string;
};

/**
 * フォーマットを、同じフォーマット名(日)があればその編集画面で記載の値へそろえて保存し、無ければ新規登録する。
 * 「ランキング表示」と「イベントに表示」にチェックを入れる（大会で選択可能にする）。フォーマットIDを返す。
 */
export async function フォーマットを用意する(page: Page, v: F0617フォーマット, issue: Issue): Promise<string> {
  const found = await findFormat(page, v.名日);
  await page.goto(adminUrl(found ? `/format/${found}/edit` : "/format/new"));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_format[${n}]"]`);
  await expect(f("nameJp"), "フォーマット詳細のフォーマット名(日)").toBeVisible();
  await f("nameJp").fill(v.名日);
  await f("nameEn").fill(v.名英);
  if (!found) await f("rank").fill(v.並び順);
  if ((await f("MetaRange").inputValue()) === "") await f("MetaRange").fill("30");
  const num = async (n: string, x?: string) => { if (x !== undefined) await f(n).fill(x); };
  await num("mainMinCardCount", v.メイン下限);
  await num("mainMaxCardCount", v.メイン上限);
  await num("sideMinCardCount", v.サイド下限);
  await num("sideMaxCardCount", v.サイド上限);
  await setChecked(f("rankingFlg"), true);
  await setChecked(f("isShownInEvent"), true);
  await page.locator('button[type="submit"]').filter({ hasText: /^\s*(登録|新規登録|更新)\s*$/ }).first().click();
  for (const w of await expectSaved(page, `フォーマット「${v.名日}」の${found ? "保存" : "登録"}`)) issue(`フォーマット「${v.名日}」の警告「${w}」`);
  const id = /\/format\/(\d+)\/edit/.exec(page.url())?.[1] ?? found;
  if (!id) throw new Error(`フォーマット「${v.名日}」を登録したが、編集画面へ移らない（${page.url()}）`);
  if (found) issue(`フォーマット「${v.名日}」は登録済み（ID ${found}）。編集画面で記載の値へそろえて保存した`);
  return id;
}

// ---- カード ----

export type F0617CSVカード = {
  名日: string; 名英: string;
  /** フォーマット名(英)の並び */
  使用可?: string[]; 使用制限?: string[]; 使用禁止?: string[];
};

/**
 * カード登録CSVアップロードで、カードを取り込む。レアリティ・レイアウトは指定が無ければ既存のカードにある値、
 * 画像URL(英語)は指定が無ければ既存のカードにある画像のURL（試験用の画像として表示できるもの）。
 */
export async function カードを取り込む(page: Page, rows: F0617CSVカード[], what: string, issue: Issue, 固定?: { レアリティ: string; レイアウト: string; 画像URL: string }): Promise<void> {
  const base = 固定 ?? await (async () => { const b = await readExistingCardValues(page); return { レアリティ: b.rarity, レイアウト: b.layout, 画像URL: b.imageEn }; })();
  const headers = await downloadCardCsvTemplate(page);
  const csv = buildCardCsv(headers, rows.map((r) => ({
    name_jp: r.名日, name_en: r.名英, rarity: base.レアリティ, layout: base.レイアウト, image_en: base.画像URL, image_jp: "", card_detail_id: "",
    format: (r.使用可 ?? []).join(","), restriction_format: (r.使用制限 ?? []).join(","), ban_format: (r.使用禁止 ?? []).join(","),
  })));
  await uploadCardCsv(page, csv, `${what.replace(/[^A-Za-z0-9_-]/g, "_")}.csv`, `${what} のカード登録CSVアップロード`, (w) => issue(`${what}: カード登録CSVの警告「${w}」`));
  issue(`${what}: レアリティ「${base.レアリティ}」・レイアウト「${base.レイアウト}」・画像URL(英語)「${base.画像URL}」でカード登録CSVを作って取り込んだ（${rows.map((r) => r.名日).join("・")}）`);
}

// ---- アーキタイプ ----

/** デッキ新規登録画面のアーキタイプの選択肢のうち、フォーマットに属するものの表示名 */
export async function フォーマットのアーキタイプ(page: Page, フォーマットID: string): Promise<string[]> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  return (await e.アーキタイプ.locator(`option[data-format-id="${フォーマットID}"]`).allInnerTexts()).map((t) => t.trim());
}

// ---- デッキ ----

/** デッキ編集画面を開き、プレイヤー名を（指定があれば）入れ、アーキタイプが空なら指定のものを選んで「更新」を押す */
export async function デッキを更新する(page: Page, デッキID: string, v: { プレイヤー名?: string; 空のときのアーキタイプ: string }, issue: Issue): Promise<void> {
  await page.goto(adminUrl(`/deck/${デッキID}/edit`));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  if ((await e.アーキタイプ.inputValue()) === "") {
    await e.アーキタイプを選ぶ(v.空のときのアーキタイプ);
    issue(`デッキID ${デッキID}: アーキタイプが空で「更新」が通らない（必須）ため、アーキタイプ「${v.空のときのアーキタイプ}」を選んでから更新した`);
  }
  if (v.プレイヤー名 !== undefined) await e.プレイヤー名.fill(v.プレイヤー名);
  await e.送信する(e.更新ボタン);
  for (const w of await expectSaved(page, `デッキID ${デッキID} の更新`)) issue(`デッキID ${デッキID} の更新時の警告「${w}」`);
}

/**
 * デッキ新規登録画面で、デッキタイプ「event」（大会のデッキ種別）のデッキを、イベントを選ばずに登録する。
 * プレイヤーはプレイヤー検索で語を検索し、選手IDの行の「決定」を押して選ぶ。デッキID（登録後のデッキ編集画面のアドレスの番号）を返す。
 */
export async function イベントなしの大会デッキを登録する(page: Page, v: { フォーマット: string; アーキタイプ: string; 公開状態: "公開" | "非公開" | "限定公開"; 検索語: string; 選手ID: string; メイン: string }, issue: Issue): Promise<string> {
  await page.goto(adminUrl("/deck/new"));
  const e = new デッキ編集画面(page);
  await e.読み込みを待つ();
  await e.入力する({ デッキ種別: "event", フォーマット: v.フォーマット, アーキタイプ: v.アーキタイプ, 公開状態: v.公開状態, メイン: v.メイン });
  await プレイヤーを選ぶ(page, v.検索語, v.選手ID);
  await e.送信する(e.新規登録ボタン);
  for (const w of await expectSaved(page, "イベントなしの大会デッキの登録")) issue(`イベントなしの大会デッキの登録時の警告「${w}」`);
  return e.デッキID();
}

/** デッキ新規登録画面のプレイヤー検索で語を検索し、選手IDの行が出るページまで送って「決定」を押す */
async function プレイヤーを選ぶ(page: Page, 語: string, 選手ID: string): Promise<void> {
  await page.locator('[data-bs-target="#searchPlayerModal"]').click();
  const m = page.locator("#searchPlayerModal");
  await expect(m, "プレイヤー検索の画面").toBeVisible();
  await m.locator("#player_search_word").fill(語);
  const first = page.waitForResponse((r) => r.url().includes("/deck/search_player"));
  await m.locator("#btn_search_player").click();
  await first;
  for (let i = 0; i < 50; i++) {
    await expect(m.locator("#player_search_results table, #player_search_results p").first(), `プレイヤー検索「${語}」の結果`).toBeVisible({ timeout: 30_000 });
    const 行 = m.locator(`button.select-player[data-id="${選手ID}"]`);
    if (await 行.count()) {
      await 行.first().click();
      await expect(m, "「決定」を押すとプレイヤー検索の画面が閉じる").toBeHidden();
      await expect(page.locator('[name="admin_deck[playerId]"]'), "選んだプレイヤーがデッキに設定される").toHaveValue(選手ID);
      return;
    }
    const 次へ = m.locator("li.page-item:not(.disabled) a.player-page").filter({ hasText: /^\s*次へ\s*$/ });
    if (!(await 次へ.count())) break;
    const いま = ((await m.locator("li.page-item.active").first().innerText()) ?? "").trim();
    const res = page.waitForResponse((r) => r.url().includes("/deck/search_player"));
    await 次へ.click();
    await res;
    await expect(m.locator("li.page-item.active").first(), "プレイヤー検索の結果が次のページに替わる").toHaveText(String(Number(いま) + 1));
  }
  throw new Error(`プレイヤー検索「${語}」の結果に、選手ID ${選手ID} の行が無い`);
}

/** イベント登録画面のルール適用度の選択肢の先頭（空の選択肢を除く） */
export async function ルール適用度の先頭(page: Page): Promise<string> {
  const form = await openEventCreate(page);
  const labels = await form.ルール適用度.locator("option").evaluateAll((os) => os.filter((o) => (o as HTMLOptionElement).value !== "").map((o) => (o.textContent ?? "").trim()).filter(Boolean));
  if (!labels.length) throw new Error("イベント登録画面のルール適用度の選択肢が無い");
  return labels[0];
}
