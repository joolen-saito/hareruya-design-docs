/**
 * F06-22 お問い合わせのシードが使う、管理画面の操作（読むだけのものと、試験用のイベントの登録）。セレクタはここだけに書く。
 *
 * - お問い合わせ件名（MTGマスターデータ）: 共有のマスタなので書き換えない。MTGマスターデータ画面で「お問い合わせ件名」を選び、行を読むだけ。
 * - 店舗: 共有の開発環境に店舗を増やさないよう、既存の店舗を使う。店舗登録画面（店舗IDで開く）で、公開・開店・表示順・店名を読むだけ。
 * - イベント: 実施店舗を編集できる試験管理者（F06-22 専用。あれば内容を確かめて使う）で、イベント登録画面・日程登録画面から登録する（M13-02・M13-03 の部品）。
 */
import { expect, Page } from "@playwright/test";
import { Account } from "../../lib/session";
import { adminUrl } from "../../lib/session";
import { openEventCreate, registerEvent } from "./event";
import { ensureMember } from "./member";
import { TenantEditPage } from "./m10_15_tenant";
import { registerSchedule, turnOffOnlineEntry } from "./schedule";

// ---- お問い合わせ件名 ----

export type 件名の行 = { 番号: string; 件名: string; 英語: string; 受付アドレス: string; 店舗別: string; 付帯情報名: string; 並び順: string };

/** MTGマスターデータ画面で「お問い合わせ件名」を選び、登録済みの行を読む（書き換えない） */
export async function お問い合わせ件名を読む(page: Page): Promise<件名の行[]> {
  await page.goto(adminUrl("/data/mtg_master_data"), { timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.locator('select[name="entity"]').selectOption({ label: "お問い合わせ件名" });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }),
    page.locator('form[method="get"] button[type="submit"]').click(),
  ]);
  await expect(page.locator("form#edit_form table.mtg-master-table"), "お問い合わせ件名の一覧").toBeVisible({ timeout: 60_000 });
  return page.locator("form#edit_form table.mtg-master-table tbody tr").evaluateAll((trs) => {
    const out: { 番号: string; 件名: string; 英語: string; 受付アドレス: string; 店舗別: string; 付帯情報名: string; 並び順: string }[] = [];
    for (const tr of trs) {
      const first = tr.querySelector("input[name], select[name]") as HTMLInputElement | null;
      const m = /^rows\[(.+?)\]\[/.exec(first?.getAttribute("name") ?? "");
      if (!m || m[1] === "new") continue;
      const v = (f: string) => ((tr.querySelector(`[name="rows[${m[1]}][${f}]"]`) as HTMLInputElement | null)?.value ?? "").trim();
      out.push({ 番号: m[1], 件名: v("subject"), 英語: v("subject_en"), 受付アドレス: v("email"), 店舗別: v("shop_flg"), 付帯情報名: v("attached_info_name"), 並び順: v("sort_no") });
    }
    return out;
  });
}

// ---- 店舗 ----

export type 店舗の設定 = { 店舗ID: string; 店名: string; 公開: string; 開店: string; 表示順: number };

/** 店舗登録画面を店舗IDで開き、店名・公開・開店・表示順を読む（書き換えない） */
export async function 店舗の設定を読む(page: Page, 店舗ID: string): Promise<店舗の設定> {
  const t = new TenantEditPage(page);
  const st = await t.直接開く(店舗ID);
  if (st !== 200) throw new Error(`店舗ID ${店舗ID} の店舗登録画面を開けない（応答 ${st}）`);
  await t.待つ();
  const 表示順 = Number((await t.値("表示順")).trim());
  return { 店舗ID, 店名: (await t.値("店名")).trim(), 公開: await t.選択("公開"), 開店: await t.選択("開店"), 表示順: Number.isFinite(表示順) ? 表示順 : NaN };
}

// ---- イベント ----

/** 実施店舗を編集できる F06-22 の試験管理者（シード表に無い。前例 F07-03）。パスワードは12文字以上 */
export const F0622_ADMIN: Account = { loginId: "f0622admin", password: "Passw0rd!F0622" };

/** 実施店舗を編集できる試験管理者を用意する（あれば内容を確かめて使う） */
export async function 試験管理者を用意する(page: Page, 店名: string): Promise<void> {
  await ensureMember(page, {
    名前: "F06-22 試験管理者", 所属店舗: 店名, ログインID: F0622_ADMIN.loginId, メールアドレス: "f0622admin@example.test",
    パスワード: F0622_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
  });
}

export type イベントの入力 = { イベント名日: string; 店名: string; 大会の公開: "公開" | "非公開"; 開始時間: string; 日程の公開: "公開" | "非公開" };

/**
 * イベント登録画面で大会を登録し、日程登録画面で受付なし・デッキ登録なしの日程を1つ登録する。日程（イベント詳細）IDを返す。
 * フォーマット・ルール適用度は「任意の有効な値」（フォーマットは「スタンダード」があればそれ、ルール適用度は先頭の選択肢）、定員16・参加費0。
 */
export async function イベントを登録する(page: Page, v: イベントの入力): Promise<{ 日程ID: string; 直したこと: string[] }> {
  const 直したこと: string[] = [];
  const form = await openEventCreate(page);
  const formats = (await form.options(form.フォーマット)).filter(Boolean);
  const rels = (await form.options(form.ルール適用度)).filter(Boolean);
  if (!formats.length || !rels.length) throw new Error("イベント登録画面のフォーマット・ルール適用度に選択肢が無い");
  const イベントID = await registerEvent(page, {
    イベント名日: v.イベント名日, イベント名英: v.イベント名日, 店舗: v.店名, フォーマット: [formats.includes("スタンダード") ? "スタンダード" : formats[0]],
    ルール適用度: rels[0], 公開状態: v.大会の公開, 定員: "16", 参加費: "0", チーム戦: false, 支払方法: [],
  });
  const 日程ID = await registerSchedule(page, イベントID, { 開始時間: v.開始時間, 受付あり: false, デッキ登録あり: false, 公開状態: v.日程の公開 });
  if (await page.locator('[name="admin_event_detail[entryFlg]"]').isChecked()) {
    await turnOffOnlineEntry(page, イベントID, 日程ID);
    直したこと.push("登録後の日程に「オンライン受付あり」のチェックが付いていたので、日程編集画面で外して保存した");
  }
  return { 日程ID, 直したこと };
}
