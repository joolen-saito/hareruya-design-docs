/** 日程登録・日程編集（イベント編集画面の「日程追加」から開く） */
import { Page, expect } from "@playwright/test";
import { expectSaved, setChecked } from "./common";
import { adminUrl } from "../../lib/session";
import { openEventEdit } from "./event";

export type ScheduleInput = {
  /** 「2026-11-01 10:00」の形 */
  開始時間: string;
  受付あり: boolean;
  /** 受付ありのときの受付時間。「09:00」の形 */
  受付時間?: { 開始: string; 終了: string };
  デッキ登録あり: boolean;
  /** デッキ登録ありのときのデッキ登録締切。「2026-10-31 18:00」の形 */
  デッキ登録締切?: string;
  /** オンライン受付あり。開始・終了は「2026-10-25 12:00」の形。書かなければチェックを入れないまま */
  オンライン受付?: { 開始: string; 終了: string };
};

const dt = (v: string) => v.replace(" ", "T");

/**
 * イベント編集画面の「日程追加」から日程登録画面を開いて登録し、振られた日程IDを返す
 * （登録後に遷移した日程編集画面のアドレスと、画面の「イベント詳細ID」の両方から読み、同じであることを確かめる）。
 * 定員・参加費・公開状態は初期表示（イベントと同じ値）のままにする。
 */
export async function registerSchedule(page: Page, イベントID: string, v: ScheduleInput): Promise<string> {
  const form = await openEventEdit(page, イベントID);
  await form.日程追加ボタン.click();
  // 画面の読み込みが終わる前にチェックを外すと、受付時間の欄が無効に切り替わらない（画面の仕掛けがまだ動いていない）
  await page.waitForURL(/\/schedule\/create$/, { waitUntil: "load" });
  const f = (name: string) => page.locator(`[name="admin_event_detail[${name}]"]`);
  await f("startDate").fill(dt(v.開始時間));
  await setChecked(f("offlineEntryFlg"), v.受付あり);
  await setChecked(f("deckRegistFlg"), v.デッキ登録あり);
  if (!v.受付あり) await expect(f("entryStartDate"), "受付ありを外すと、受付時間は入力できなくなる").toBeDisabled();
  if (v.受付時間) { await f("entryStartDate").fill(v.受付時間.開始); await f("entryEndDate").fill(v.受付時間.終了); }
  if (v.デッキ登録締切) await f("deckRegistDeadline").fill(dt(v.デッキ登録締切));
  if (v.オンライン受付) {
    await setChecked(f("entryFlg"), true);
    await f("onlineEntryStartDate").fill(dt(v.オンライン受付.開始));
    await f("onlineEntryEndDate").fill(dt(v.オンライン受付.終了));
  }
  await page.getByRole("button", { name: "登録", exact: true }).click();
  await expectSaved(page, `日程「${v.開始時間}」の登録`);
  const m = /\/schedule\/(\d+)\/edit/.exec(page.url());
  if (!m) throw new Error(`日程「${v.開始時間}」を登録したが、日程編集画面へ遷移しない（${page.url()}）`);
  const shown = (await page.locator("form").first().innerText()).replace(/\s+/g, " ");
  if (!new RegExp(`イベント詳細ID ${m[1]}( |$)`).test(shown)) throw new Error(`日程編集画面の「イベント詳細ID」が、アドレスの番号 ${m[1]} と違う`);
  return m[1];
}

/** イベント編集画面の日程一覧から日程編集画面を開き、「オンライン受付あり」のチェックを外して保存する */
export async function turnOffOnlineEntry(page: Page, イベントID: string, 日程ID: string): Promise<void> {
  const form = await openEventEdit(page, イベントID);
  await form.日程の編集ボタン(日程ID).click();
  await form.日程メニューの編集(日程ID).click();
  await page.waitForURL(new RegExp(`/schedule/${日程ID}/edit$`), { waitUntil: "load" });
  await setChecked(page.locator('[name="admin_event_detail[entryFlg]"]'), false);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expectSaved(page, `日程 ${日程ID} のオンライン受付なしへの変更`);
}
