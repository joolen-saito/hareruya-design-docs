/**
 * F07-03 大会詳細（フロント）のシードが使う、管理画面の操作の組み合わせ。
 * - 参照マスタ（開催店舗・フォーマット・ルール適用度）は登録しない。イベント登録画面の選択肢に、シード表の名前と番号で出ることを確かめる。
 * - 大会（イベント）はイベント登録画面、日程はイベント編集画面の「日程追加」で登録する（M13-02・M13-03 の部品）。
 * - イベント登録画面の「店舗」には、ログインした管理者が編集できる店舗だけが並ぶ（全権限の管理者は編集できる店舗を持たない）。
 *   そこで、開催店舗を編集できる試験管理者を用意し、その管理者で登録する。
 */
import { Locator, Page } from "@playwright/test";
import { Account } from "../../lib/session";
import { EventInput, openEventCreate, registerEvent } from "./event";
import { ensureMember } from "./member";
import { registerSchedule, ScheduleInput, turnOffOnlineEntry } from "./schedule";

/** シード表の開催店舗（店舗ID 1）・フォーマット（フォーマットID 1）・参加対象者層（ID 6） */
export const 開催店舗 = "トーナメントセンター東京";
export const 開催フォーマット = "スタンダード";
export const 参加対象者層 = "初心者向け";

/** 開催店舗を編集できる試験管理者（共有のシード S-F07-03-REF が用意する）。パスワードは12文字以上 */
export const F0703_ADMIN: Account = { loginId: "f0703admin", password: "Passw0rd!F0703" };

/** 開催店舗を編集できる試験管理者を用意する（あれば内容を確かめて使う） */
export async function 試験管理者を用意する(page: Page): Promise<void> {
  await ensureMember(page, {
    名前: "F07-03 試験管理者", 所属店舗: 開催店舗, ログインID: F0703_ADMIN.loginId, メールアドレス: "f0703admin@example.test",
    パスワード: F0703_ADMIN.password, 権限: "システム管理者", デフォルト検索表示店舗: 開催店舗, 編集可能店舗: [開催店舗],
  });
}

/** 選択欄で、表示名の選択肢の値（番号）。無ければ null */
async function 選択肢の値(select: Locator, 表示名: string): Promise<string | null> {
  for (const o of await select.locator("option").all()) {
    if (((await o.innerText()) ?? "").trim() === 表示名) return o.getAttribute("value");
  }
  return null;
}

/**
 * イベント登録画面の選択肢で、参照マスタが シード表の番号と名前で出ているかを確かめる。
 * 出ていないもの（名前が無い・番号が違う）を、業務の言葉で返す。
 */
export async function 参照マスタを確かめる(page: Page): Promise<{ 店舗とフォーマット: string[]; 参加対象者層: string[] }> {
  const form = await openEventCreate(page);
  const check = async (欄: string, sel: Locator, 名前: string, 番号: string): Promise<string[]> => {
    const v = await 選択肢の値(sel, 名前);
    if (v === null) return [`${欄}の選択肢に「${名前}」が無い（ある選択肢: ${(await form.options(sel)).join("、")}）`];
    if (v !== 番号) return [`${欄}の「${名前}」の番号が ${v}（シード表は ${番号}）`];
    return [];
  };
  return {
    店舗とフォーマット: [...(await check("店舗", form.店舗, 開催店舗, "1")), ...(await check("フォーマット", form.フォーマット, 開催フォーマット, "1"))],
    参加対象者層: await check("ルール適用度", form.ルール適用度, 参加対象者層, "6"),
  };
}

/** 「任意の値」として選ぶルール適用度（初心者歓迎があればそれ、無ければ先頭の選択肢） */
async function 任意のルール適用度(page: Page): Promise<string> {
  const form = await openEventCreate(page);
  const have = await form.options(form.ルール適用度);
  if (!have.length) throw new Error("イベント登録画面のルール適用度に選択肢が無い");
  return have.includes("初心者歓迎") ? "初心者歓迎" : have[0];
}

export type 大会の入力 = {
  イベント名日: string; イベント名英?: string;
  /** 書かなければ「任意の値」（定員16・参加費0・ルール適用度は任意の選択肢） */
  定員?: string; 参加費?: string; 支払方法?: string[]; フリー入力エリア?: EventInput["フリー入力エリア"]; バナーなし?: boolean;
  日程: ScheduleInput;
};

/**
 * 開催店舗・フォーマット「スタンダード」・公開で大会を登録し、日程を1つ登録して、イベントIDと日程（イベント詳細）IDを返す。
 * 日程の「オンライン受付あり」は、書かなければチェックの無い状態にする（登録後の日程編集画面でチェックが付いていれば外して保存する）。
 */
export async function 大会と日程を登録する(page: Page, v: 大会の入力): Promise<{ イベントID: string; 日程ID: string; 直したこと: string[] }> {
  const 直したこと: string[] = [];
  const ルール適用度 = await 任意のルール適用度(page);
  const イベントID = await registerEvent(page, {
    イベント名日: v.イベント名日, イベント名英: v.イベント名英 ?? v.イベント名日, 店舗: 開催店舗, フォーマット: [開催フォーマット], ルール適用度,
    公開状態: "公開", 定員: v.定員 ?? "16", 参加費: v.参加費 ?? "0", チーム戦: false, 支払方法: v.支払方法 ?? [],
    ...(v.フリー入力エリア ? { フリー入力エリア: v.フリー入力エリア } : {}),
    ...(v.バナーなし ? { バナーURL日: "", バナーURL英: "" } : {}),
  });
  const 日程ID = await registerSchedule(page, イベントID, v.日程);
  if (!v.日程.オンライン受付 && (await page.locator('[name="admin_event_detail[entryFlg]"]').isChecked())) {
    await turnOffOnlineEntry(page, イベントID, 日程ID);
    直したこと.push("登録後の日程に「オンライン受付あり」のチェックが付いていたので、日程編集画面で外して保存した");
  }
  return { イベントID, 日程ID, 直したこと };
}
