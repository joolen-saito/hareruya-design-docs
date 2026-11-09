/**
 * F06-14 マイイベント・デッキ登録 のシードが使う、管理画面の操作の組み合わせ（日程の修正・申込状況の変更・大会と日程の登録）。
 * 大会（イベント）と日程は、イベント登録画面と「日程追加」で作る。店舗は編集できる任意の店舗（Hareruya）。
 */
import { Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved, setChecked } from "./common";
import { registerEvent } from "./event";
import { registerSchedule } from "./schedule";
import { 大会 } from "./f07_04_setup";

const p2 = (n: number): string => String(n).padStart(2, "0");
/** 「2026-11-08 10:00」の形の日時を、日数だけずらして同じ形で返す */
export function 日時をずらす(日時: string, 日数: number): string {
  const d = new Date(日時.replace(" ", "T"));
  d.setDate(d.getDate() + 日数);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export type 大会の指定 = {
  名: string; 英名: string; フォーマット: string[];
  /** 日程の開始時間（「2026-11-09 10:00」の形） */
  開始: string; デッキ登録: boolean; 締切: string;
  /** 申込を登録する大会はオンライン受付ありにし、受付時間は開始時間より前にする（シード表の作り方） */
  オンライン受付あり: boolean;
};

/** 大会（イベント）と日程を1つ登録する（店舗は Hareruya、公開、受付なし、デッキ登録を終了しない） */
export async function 大会を登録する(page: Page, v: 大会の指定): Promise<大会> {
  const イベントID = await registerEvent(page, {
    イベント名日: v.名, イベント名英: v.英名, 店舗: "Hareruya", フォーマット: v.フォーマット,
    ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "10", 参加費: "0",
  });
  const 日程ID = await registerSchedule(page, イベントID, {
    開始時間: v.開始, 受付あり: false, デッキ登録あり: v.デッキ登録,
    ...(v.デッキ登録 ? { デッキ登録締切: v.締切, デッキ登録を終了する: false } : {}),
    ...(v.オンライン受付あり ? { オンライン受付: { 開始: 日時をずらす(v.開始, -2), 終了: 日時をずらす(v.開始, -1) } } : {}),
    公開状態: "公開",
  });
  return { イベント名: v.名, イベントID, 日程ID: [日程ID], 開催日: [v.開始.slice(0, 10)] };
}

export type 日程の修正 = { 開始?: string; 締切?: string; デッキ登録を終了する?: boolean };

/** 日程編集画面を開き、開始時間（オンライン受付時間もそれより前に直す）・デッキ登録締切・「デッキ登録を終了する」を直して保存する */
export async function 日程を直す(page: Page, イベントID: string, 日程ID: string, v: 日程の修正): Promise<void> {
  await page.goto(adminUrl(`/event/${イベントID}/schedule/${日程ID}/edit`));
  await page.waitForLoadState("load");
  const f = (n: string) => page.locator(`[name="admin_event_detail[${n}]"]`);
  const dt = (s: string) => s.replace(" ", "T");
  if (v.開始) {
    await f("startDate").fill(dt(v.開始));
    if (await f("onlineEntryStartDate").isEnabled()) {
      await f("onlineEntryStartDate").fill(dt(日時をずらす(v.開始, -2)));
      await f("onlineEntryEndDate").fill(dt(日時をずらす(v.開始, -1)));
    }
  }
  if (v.締切) await f("deckRegistDeadline").fill(dt(v.締切));
  if (v.デッキ登録を終了する !== undefined) await setChecked(f("deadlineFlg"), v.デッキ登録を終了する);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expectSaved(page, `日程 ${日程ID} の修正`);
}

/** イベント申込詳細・編集画面で申込状況を選んで登録する */
export async function 申込状況を変える(page: Page, 申込ID: string, 状況: string): Promise<void> {
  await page.goto(adminUrl(`/event/entry/${申込ID}/edit`));
  await page.waitForLoadState("load");
  await chooseByLabel(page.locator('[name="admin_event_entry_detail[EntryStatus]"]'), 状況);
  await expect(page.locator("#submit_entry"), "申込状況を選ぶと登録を押せる").toBeEnabled();
  await page.locator("#submit_entry").click();
  await expectSaved(page, `申込 ${申込ID} の申込状況「${状況}」への変更`);
}
