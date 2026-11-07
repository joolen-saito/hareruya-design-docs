/**
 * M14-10 フォーマット詳細: デッキビルダー利用の設定がフロントの登録デッキ編集画面（マイデッキ取得）へ反映される連携確認の部品。
 * 管理画面側（大会の登録・マイデッキ）の準備と、フロント側（マイデッキ取得の選択肢の読み取り）。セレクタはここだけ。
 */
import { Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { 日程の入力 } from "./f07_04_setup";
import { 実行日から } from "./f07_01_setup";
import { registerEvent } from "./event";
import { registerSchedule } from "./schedule";
import { DeckEditPage } from "../front/f06_16_deck_entry";

/** 編集できる店舗の先頭（イベント登録画面の店舗の選択肢から読む。店舗はこのケースが確かめない） */
async function 店舗の先頭(page: Page): Promise<string> {
  await page.goto(adminUrl("/event/create"));
  await page.waitForLoadState("load");
  const labels = (await page.locator('[name="admin_event[baseInfo]"] option').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  if (!labels.length) throw new Error("イベントの店舗の選択肢が無い");
  return labels.find((l) => l.includes("大阪")) ?? labels[0];
}

/** 公開中・受付期間内で、デッキ登録ありの日程を1件持つ大会を登録し、日程IDを返す（日程は実行日の30日後、デッキ登録締切は20日後） */
export async function 受付期間内の大会を登録する(page: Page, v: { 名日: string; 名英: string; フォーマット: string[] }): Promise<{ イベントID: string; 日程ID: string }> {
  const イベントID = await registerEvent(page, {
    イベント名日: v.名日, イベント名英: v.名英, 店舗: await 店舗の先頭(page), フォーマット: v.フォーマット,
    ルール適用度: "初心者歓迎", 公開状態: "公開", 定員: "16", 参加費: "0",
  });
  const 日程ID = await registerSchedule(page, イベントID, 日程の入力({ 受付: "中", 定員: "16", 参加費: "0", デッキ登録: { 締切: 実行日から(20, "10:00"), 終了する: false } }, 0));
  return { イベントID, 日程ID };
}

/** マイデッキ取得の画面に出ている「フォーマットで絞り込む」の選択肢（指定なしを除く）。選択欄が無いときは選択欄あり=false */
export async function マイデッキ取得の絞り込み選択肢(e: DeckEditPage): Promise<{ 選択欄あり: boolean; 選択肢: string[]; マイデッキ数: number }> {
  const 選択欄あり = (await e.マイデッキのフォーマット絞り込み.count()) > 0;
  const 選択肢 = 選択欄あり ? (await e.マイデッキのフォーマット絞り込み.locator("option").allInnerTexts()).map((t) => t.trim()).filter((t) => t && t !== "指定なし") : [];
  return { 選択欄あり, 選択肢, マイデッキ数: await e.マイデッキの行.count() };
}
