/**
 * M13-02 イベント登録/編集（削除・権限外の要求・なりすまし対策トークン。IT-M13-02-052〜056、058〜062）
 * ケースの正本: integration_test/casegen/cases/M13-02_test_cases.tsv（手順・期待結果の文は正本から引く）
 */
import { expect, Page } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { openEventEdit, EventForm } from "../../pages/admin/event";
import { sendForm, tamperToken, Token } from "../../pages/admin/devtools";
import { 保存されているイベント, イベントの状態 } from "../../db/event";
import { 日程の状態 } from "../../db/schedule";
import { M1302_ADMIN } from "../../seeds/m13-02";

const 編集画面 = (id: string) => new RegExp(`/event/${id}/edit(\\?.*)?$`);
const イベント削除要求 = (page: Page, id: string, token: Token) => sendForm(page, adminUrl(`/event/${id}/delete`), [], token, "DELETE");
const 日程削除要求 = (page: Page, イベント: string, 日程: string, token: Token) => sendForm(page, adminUrl(`/event/${イベント}/schedule/${日程}/delete`), [], token, "DELETE");
const 日程一括削除要求 = (page: Page, イベント: string, 日程: string[], token: Token) =>
  sendForm(page, adminUrl(`/event/${イベント}/schedule/bulk_delete`), 日程.map((d) => ["event_detail_ids[]", d] as [string, string]), token);

/** イベント編集画面の削除ボタンを押し、確認ダイアログで削除を確定する。確定を押して要求が送られたら true（確定が押せない状態なら false） */
async function イベントを削除(form: EventForm, id: string): Promise<boolean> {
  await form.削除ボタン.click();
  const modal = form.page.locator(`#event_delete_${id}`);
  await expect(modal).toBeVisible();
  // 日程があるイベントでは、確認ダイアログの削除が押せない状態で出る。利用者が押したのと同じに、その位置を押す
  const 確定 = modal.locator(".btn-ec-delete");
  if (await 確定.isDisabled()) { await 確定.click({ force: true }); return false; }
  await 確定.click();
  await form.page.waitForLoadState("domcontentloaded");
  return true;
}

caseTest("IT-M13-02-052", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔イベントID-M1302-052A〕"), 日程B = notes.get("〔日程ID-M1302-052B〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await openEventEdit(page, a); });
  await step(2, async () => { await 日程一括削除要求(page, a, [日程B], "有効"); });
  let 状態 = "";
  await step(3, async () => { 状態 = 日程の状態(日程B); });
  await expected(async () => {
    expect(状態, "他イベントの日程が削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-053", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-053〕"), 日程 = notes.get("〔日程ID-M1302-053〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await 日程削除要求(page, id, 日程, "有効"); });
  let 状態 = "";
  await step(2, async () => { 状態 = 日程の状態(日程); });
  await expected(async () => {
    expect(状態, "店舗Bの日程が削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-054", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-054〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await イベントを削除(form, id); });
  let 状態 = "";
  await step(3, async () => { 状態 = イベントの状態(id); });
  await expected(async () => {
    expect(状態, "日程を持つイベントが削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-055", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-055〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  let 送信された = false;
  await step(2, async () => { 送信された = await イベントを削除(form, id); });
  await expected(async () => {
    // 確定が押せず何も送られなければ、もとの画面が出ているだけで、遷移を確かめたことにならない
    expect(送信された, "削除を確定して、要求が送られた（確定が押せない状態で、何も送られていない）").toBe(true);
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-056", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-056〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await イベントを削除(form, id); });
  let 状態 = "";
  await step(3, async () => { 状態 = イベントの状態(id); });
  await expected(async () => {
    expect(状態, "日程の無いイベントが削除されている").not.toBe("ある");
  });
});

caseTest("IT-M13-02-058", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-058〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await イベントを削除(form, id); });
  await expected(async () => {
    await expect.soft(page, "イベント一覧（検索結果）画面の1ページ目へ遷移する").toHaveURL(/\/event(\/page\/1)?(\?.*)?$/);
    await expect.soft(page.locator('[name="admin_search_event[multi]"]'), "イベント一覧の画面である（検索条件の欄がある）").toBeVisible();
    await expect.soft(page.locator("body"), "検索結果が表示されている").toContainText("検索結果");
  });
});

caseTest("IT-M13-02-059", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-059〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await イベント削除要求(page, id, "有効"); });
  let 状態 = "";
  await step(2, async () => { 状態 = イベントの状態(id); });
  await expected(async () => {
    expect(状態, "店舗Bのイベントが削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-060", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-060〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  const イベントフォーム = () => page.locator("form#event_form");
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.fill({ イベント名日: "トークン欠落更新" }); });
  await step(3, async () => { await tamperToken(イベントフォーム(), "なし"); await form.submit(form.更新ボタン); });
  await step(4, async () => { form = await openEventEdit(page, id); await form.fill({ イベント名日: "トークン改ざん更新" }); });
  await step(5, async () => { await tamperToken(イベントフォーム(), "invalid-token"); await form.submit(form.更新ボタン); });
  let 名前 = "";
  await step(6, async () => { 名前 = 保存されているイベント(id)?.["イベント名(日)"] ?? "（イベントがDBに無い）"; });
  await expected(async () => {
    expect(名前, "イベント名(日)").toBe("編集前イベント-060");
  });
});

caseTest("IT-M13-02-061", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-061〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await openEventEdit(page, id); });
  await step(2, async () => { await イベント削除要求(page, id, "なし"); });
  await step(3, async () => { await openEventEdit(page, id); });
  await step(4, async () => { await イベント削除要求(page, id, "invalid-token"); });
  let 状態 = "";
  await step(5, async () => { 状態 = イベントの状態(id); });
  await expected(async () => {
    expect(状態, "イベントが削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-062", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-062〕"), 日程 = notes.get("〔日程ID-M1302-062〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  const 一括削除 = async (token: "なし" | string) => {
    await tamperToken(page.locator("form#form_schedule_bulk"), token);
    await form.チェックした日程削除ボタン.click();
    await expect(form.一括削除の確定).toBeVisible();
    await form.一括削除の確定.click();
    await page.waitForLoadState("domcontentloaded");
  };
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.日程チェック(日程).check(); });
  await step(3, async () => { await 一括削除("なし"); });
  await step(4, async () => { form = await openEventEdit(page, id); await form.日程チェック(日程).check(); });
  await step(5, async () => { await 一括削除("invalid-token"); });
  let 状態 = "";
  await step(6, async () => { 状態 = 日程の状態(日程); });
  await expected(async () => {
    expect(状態, "日程が削除されていない").toBe("ある");
  });
});
