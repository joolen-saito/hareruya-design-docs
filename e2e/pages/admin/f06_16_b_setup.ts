/**
 * F06-16・F06-17 の続き（-b）のシードが使う操作。
 * - 海外住所の会員は、フロントの新規会員登録（国を米国にして登録）で作る（依頼者決定 2026-10-31）。英字名は管理画面の会員編集で入れる。
 * - 大会デッキを、管理画面のデッキ編集画面で更新する（編集者の設定・プレイヤー名の変更）。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { mailIds, waitForMailTo } from "../../lib/mail";
import { rc } from "../../lib/run_marker";
import { adminUrl, hideDebugToolbar, withAdminSession } from "../../lib/session";
import { EntryPage } from "../front/f06_01_entry";
import { expectSaved } from "./common";
import { 会員IDをメールから } from "./f07_04_setup";
import { 会員のパスワード, 試験会員 } from "./f06_16_setup";
import { M08CustomerEditPage } from "./m08_customer_edit";

export type 海外会員の指定 = {
  ベース: string; 姓: string; 名: string; セイ?: string; メイ?: string;
  /** 管理画面の会員編集で入れる英字名。項目を省略すると、その項目は入れない */
  英字名?: { 姓?: string; 名?: string };
};

/** フロントの新規会員登録で、国が米国の会員を作り（メールの前半に実行の印）、会員IDを読み、英字名を入れる */
export async function 海外会員を用意する(browser: Browser, v: 海外会員の指定): Promise<試験会員> {
  const メール = `${rc(v.ベース)}@example.test`.toLowerCase();
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    const entry = new EntryPage(page);
    page.setDefaultTimeout(120_000);
    await entry.open();
    await entry.fill({
      姓: v.姓, 名: v.名, セイ: v.セイ ?? "ジョン", メイ: v.メイ ?? "スミス", メール, パスワード: 会員のパスワード,
      国: "United States", 郵便番号: "10001", 住所1: "Broadway", 住所2: "1", 住所3: "New York", 電話番号: "0312345678",
    });
    const before = await mailIds();
    const r = await entry.同意する();
    if (!r.sent) throw new Error(`海外会員「${v.姓} ${v.名}」の会員情報登録が送信されない（ブラウザの入力チェック）`);
    const errors = (await page.locator(".ec-errorMessage, .form-error-message, .invalid-feedback, .c-hareruya-form__error").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    if (errors.length) throw new Error(`海外会員「${v.姓} ${v.名}」の会員情報登録で入力エラー: ${errors.join(" / ")}`);
    await entry.登録する();
    if (/\/entry\/complete/.test(page.url())) {
      const mail = await waitForMailTo(メール, before);
      const url = /https?:\/\/[^\s"'<>]+\/entry\/activate\/[^\s"'<>]+/.exec(mail.text)?.[0];
      if (!url) throw new Error(`海外会員「${v.姓} ${v.名}」の本登録のメール（${mail.subject}）に本登録のURLが無い`);
      await page.goto(url.replace(/&amp;/g, "&"));
      await page.waitForLoadState("load");
    }
    if (/\/entry\/(complete|regist_error)/.test(page.url())) throw new Error(`海外会員「${v.姓} ${v.名}」が本会員にならない（${page.url()}）`);
  } finally {
    await context.close();
  }
  const 会員ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    const id = await 会員IDをメールから(page, メール);
    if (v.英字名 && (v.英字名.姓 !== undefined || v.英字名.名 !== undefined)) {
      const e = new M08CustomerEditPage(page);
      await e.open(id);
      if (v.英字名.姓 !== undefined) await e.set("Player][lastNameEn", v.英字名.姓);
      if (v.英字名.名 !== undefined) await e.set("Player][firstNameEn", v.英字名.名);
      await e.登録する();
      await expectSaved(page, `海外会員 ${メール} の英字名の登録`);
    }
    return id;
  });
  return { メール, パスワード: 会員のパスワード, 会員ID };
}

/**
 * 管理画面のデッキ編集画面（デッキIDで開く）で、プレイヤー名を入れ替えて（渡さなければ内容を変えずに）「更新」を押す。
 * 正本のシードは「デッキ一覧でイベント詳細IDを入れて検索してから編集画面を開く」だが、デッキ一覧は大会開始前（開始が 2099-12-20）のデッキを出さないので、
 * 提出したときに控えたデッキIDで編集画面を直接開く（正本の外の補い）。
 */
export async function デッキを管理画面で更新する(page: Page, デッキID: string, プレイヤー名?: string): Promise<string[]> {
  await page.goto(adminUrl(`/deck/${デッキID}/edit`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  if (プレイヤー名 !== undefined) await page.locator('[name="admin_deck[playerName]"]').fill(プレイヤー名);
  // 画面から提出した大会デッキはアーキタイプが空で、編集画面の必須項目（アーキタイプ）を満たさないと更新できない。空の必須の選択欄は、先頭の選択肢を選ぶ（正本の外の補い）
  const 補った: string[] = [];
  for (const sel of await page.locator('select[name^="admin_deck["][required]').all()) {
    if ((await sel.inputValue()) !== "") continue;
    const first = await sel.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })).find((o) => o.v !== ""));
    if (!first) continue;
    await sel.selectOption(first.v);
    補った.push(`${(await sel.getAttribute("name"))?.includes("Archetype") ? "アーキタイプ" : "必須の選択欄"}=${first.t}`);
  }
  await page.locator('button[type="submit"][form="admin_deck"]').first().click();
  await expectSaved(page, `デッキ ${デッキID} の更新`);
  return 補った;
}
