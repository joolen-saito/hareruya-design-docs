/**
 * F06-14 マイイベント・デッキ登録のシードが使う、管理画面の操作の組み合わせ。正本: cases/F06-14_seed_data.tsv
 * 大会・日程は、開催店舗を編集できる試験管理者（F07-03 の S-F07-03-REF が用意する f0703admin）で、イベント登録画面と「日程追加」から登録する。
 * 申込は、イベント新規申込登録画面のプレイヤー検索で参加者を選んで登録する（支払い会員は参加者の会員になる）。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved, setChecked } from "./common";
import { registerEvent } from "./event";
import { 開催店舗 } from "./f07_03_setup";
import { EntryEditPage } from "./m13_10_entry_edit";
import { EntryNewPage } from "./m13_12_entry_new";
import { registerSchedule } from "./schedule";

export type 日程の指定 = {
  /** 「2026-11-12 10:00」の形 */
  開始: string;
  /** null＝「デッキ登録あり」のチェックを外す */
  デッキ登録: { 締切: string } | null;
};

/** 大会（イベント）と日程を1つ登録し、イベントIDと日程（イベント詳細）IDを返す。公開・定員10・参加費0・ルール適用度は初心者歓迎（任意の値） */
export async function 大会と日程を登録する(page: Page, v: { 名日: string; 名英: string; フォーマット: string[]; 日程: 日程の指定 }): Promise<{ イベントID: string; 日程ID: string }> {
  const イベントID = await registerEvent(page, {
    イベント名日: v.名日, イベント名英: v.名英, 店舗: 開催店舗, フォーマット: v.フォーマット, ルール適用度: "初心者歓迎", 公開状態: "公開",
    定員: "10", 参加費: "0", チーム戦: false, 支払方法: [],
  });
  const 日程ID = await registerSchedule(page, イベントID, {
    開始時間: v.日程.開始, 受付あり: false, デッキ登録あり: !!v.日程.デッキ登録,
    ...(v.日程.デッキ登録 ? { デッキ登録締切: v.日程.デッキ登録.締切, デッキ登録を終了する: false } : {}),
    公開状態: "公開",
  });
  return { イベントID, 日程ID };
}

/** イベント新規申込登録画面で、プレイヤー検索で氏名を検索して選手IDの行の「決定」を押し、登録して申込IDを返す（申込状況は初期値のまま） */
export async function 申込を登録する(page: Page, 日程ID: string, 氏名: string, 選手ID: string, what: string): Promise<string> {
  const e = new EntryNewPage(page);
  await e.開く(日程ID);
  await e.読み込みを待つ();
  await e.ポップアップを開く();
  await e.プレイヤーを検索する(氏名);
  await e.IDの行のページへ(選手ID);
  await e.決定する(選手ID);
  return e.登録して申込IDを読む(what);
}

/** 申込詳細・編集画面で申込状況を選んで登録する。選択肢に無ければ false（何も保存しない）。保存できなければ落とす */
export async function 申込状況を画面で直す(page: Page, 申込ID: string, 状況: string): Promise<boolean> {
  const e = new EntryEditPage(page);
  await e.申込を開く(申込ID);
  await e.編集画面の読み込みを待つ();
  if (!(await e.選択肢(e.申込状況)).includes(状況)) return false;
  await e.申込状況を選ぶ(状況);
  await e.登録ボタン.click();
  await expectSaved(page, `申込 ${申込ID} の申込状況「${状況}」への変更`);
  return true;
}

/**
 * 日程編集画面で、開始時間・デッキ登録締切・「デッキ登録を終了する」を直して保存する。画面が保存を受け付けないとき（過去の日時など）は、
 * その文を返す（保存されていない）。保存できたら null。
 */
export async function 日程を画面で直す(page: Page, イベントID: string, 日程ID: string, v: { 開始?: string; 締切?: string; 登録を終了する?: boolean }): Promise<string | null> {
  await page.goto(adminUrl(`/event/${イベントID}/schedule/${日程ID}/edit`));
  await page.waitForLoadState("load");
  const f = (name: string) => page.locator(`[name="admin_event_detail[${name}]"]`);
  if (v.開始) await f("startDate").fill(v.開始.replace(" ", "T"));
  if (v.締切) await f("deckRegistDeadline").fill(v.締切.replace(" ", "T"));
  if (v.登録を終了する !== undefined) await setChecked(f("deadlineFlg"), v.登録を終了する);
  await page.getByRole("button", { name: "保存", exact: true }).click();
  try {
    await expectSaved(page, `日程 ${日程ID} の変更`);
    return null;
  } catch (e) {
    return String((e as Error).message).split("\n")[0];
  }
}
