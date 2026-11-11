/**
 * M13-03 日程登録/編集（未登録のイベントへの操作・権限外店舗の操作）。正本: cases/M13-03_test_cases.tsv
 * 権限外店舗のイベントは、店舗Bだけを編集できる管理者が登録したもの（seeds/m13-03-c.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ScheduleFormPage } from "../../pages/admin/m13_03_schedule";
import { 日程, イベントの日程 } from "../../db/m13_03";
import { M1303_ADMIN } from "../../seeds/m13-03";
import "../../seeds/m13-03-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const すべてオフ = { 受付あり: false, デッキ登録あり: false, オンライン受付あり: false };
const 基本の入力 = { 開始時間: "2026/09/10 18:00", 定員: "10", 参加費: "0", 公開状態: "公開" };

caseTest("IT-M13-03-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  let status = 0;
  await step(1, async () => { status = await s.アドレスで開く("/event/999999/schedule/create"); });
  await expected(async () => {
    expect.soft(status, "未登録のイベントIDの日程追加画面の応答（404）").toBe(404);
    await expect.soft(s.開始時間, "日程の入力欄が表示されない（エラーの画面）").toHaveCount(0);
  });
});

function 送信先を未登録に変える(no: string, トークンも変える: boolean) {
  return async ({ page, notes, step, expected }: any) => {
    await loginAdmin(page, M1303_ADMIN);
    const id = notes.get(`〔イベントID-M1303-${no}〕`);
    const s = new ScheduleFormPage(page);
    let status = 0;
    await step(1, async () => { await s.日程追加画面を開く(id); });
    await step(2, async () => { await s.入力する({ ...基本の入力, ...すべてオフ }); });
    await step(3, async () => {
      await s.送信先のアドレスを書き換える("/event/999999/schedule/create");
      if (トークンも変える) await s.なりすまし対策トークンを書き換える("invalid-token");
    });
    await step(4, async () => { status = await s.押して応答の状態を読む(s.登録ボタン); });
    await expected(async () => {
      expect.soft(status, "未登録のイベントIDへの送信の応答（404）").toBe(404);
      expect.soft(イベントの日程(id).length, "元のイベントに日程が追加されない").toBe(0);
    });
  };
}
caseTest("IT-M13-03-031", 送信先を未登録に変える("031", false));
caseTest("IT-M13-03-056", 送信先を未登録に変える("056", true));

caseTest("IT-M13-03-034", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-034〕");
  const s = new ScheduleFormPage(page);
  let wasDisabled = false;
  await step(1, async () => { await s.アドレスで開く(`/event/${id}/schedule/create`); await expect(s.開始時間, "日程追加画面").toBeVisible(); });
  await step(2, async () => { await s.入力する({ ...基本の入力, ...すべてオフ }); });
  await step(3, async () => {
    wasDisabled = await s.送信ボタンの無効状態を解除する(s.登録ボタン);
    await s.押して送信する(s.登録ボタン);
  });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(4, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(wasDisabled, "店舗Bの権限が無いとき、登録ボタンは無効状態で表示される").toBe(true);
    expect.soft(rows.length, "追加された日程の件数（0件のまま）").toBe(0);
  });
  note("権限外店舗のイベントは、イベント編集画面から日程追加へ進めるかを確かめず、日程追加画面のアドレスを直接開いた");
});

caseTest("IT-M13-03-040", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const イベントID = notes.get("〔イベントID-M1303-040〕"), 日程ID = notes.get("〔日程ID-M1303-040〕");
  const s = new ScheduleFormPage(page);
  let wasDisabled = false;
  await step(1, async () => { await s.アドレスで開く(`/event/${イベントID}/schedule/${日程ID}/edit`); await expect(s.開始時間, "日程編集画面").toBeVisible(); });
  await step(2, async () => { await s.入力する({ 定員: "99" }); });
  await step(3, async () => {
    note("画面の送信ボタンは「保存」で、「更新」という名前のボタンは無い。手順の「更新ボタン」として、この保存ボタンを押した");
    wasDisabled = await s.送信ボタンの無効状態を解除する(s.保存ボタン);
    await s.押して送信する(s.保存ボタン);
  });
  let r: ReturnType<typeof 日程> = null;
  await step(4, async () => { r = 日程(日程ID); });
  await expected(async () => {
    expect.soft(wasDisabled, "店舗Bの権限が無いとき、保存ボタンは無効状態で表示される").toBe(true);
    expect.soft(r?.定員, "日程の定員（16のまま）").toBe("16");
  });
});

caseTest("IT-M13-03-045", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const イベントID = notes.get("〔イベントID-M1303-045〕"), 日程ID = notes.get("〔日程ID-M1303-045〕");
  const s = new ScheduleFormPage(page);
  let status = 0;
  await step(1, async () => { status = await s.日程削除の要求を送る(イベントID, 日程ID); });
  let r: ReturnType<typeof 日程> = null;
  await step(2, async () => { r = 日程(日程ID); });
  await expected(async () => {
    expect.soft(r !== null && !r.削除済み, "日程が削除されずに残っている").toBe(true);
  });
  note(`削除要求の応答の状態コード: ${status}（転送の応答は 0 と読める）`);
});
