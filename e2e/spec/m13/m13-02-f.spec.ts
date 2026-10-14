/**
 * M13-02 イベント登録/編集（申込・デッキ登録のある日程、有料オンライン受付の日程。IT-M13-02-004、033、034、039、046〜051、077、078、080、082）
 * ケースの正本: integration_test/casegen/cases/M13-02_test_cases.tsv（手順・期待結果の文は正本から引く）
 */
import { expect, test } from "@playwright/test";
import { CaseBody, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { openEventEdit, EventForm } from "../../pages/admin/event";
import { 保存されているイベント } from "../../db/event";
import { 日程の状態 } from "../../db/schedule";
import { M1302_ADMIN } from "../../seeds/m13-02";

/** 手順どおりにできなかったが試験は続けられること（押せない・選べない操作など）を、報告に残す */
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 編集画面 = (id: string) => new RegExp(`/event/${id}/edit(\\?.*)?$`);

caseTest("IT-M13-02-004", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔日程ID-M1302-004A〕"), b = notes.get("〔日程ID-M1302-004B〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-004〕")); });
  let 人数A = "", 人数B = "";
  await step(2, async () => { 人数A = await form.日程の欄(a, "申込人数"); 人数B = await form.日程の欄(b, "申込人数"); });
  await expected(async () => {
    // 欄の表示は「申込人数 / 定員」
    expect.soft(人数A.split("/")[0].trim(), "日程Aの申込人数").toBe("0");
    expect.soft(人数B.split("/")[0].trim(), "日程Bの申込人数").toBe("2");
  });
});

/** 支払方法のクレジットカード決済をオフにして更新し、DBの支払方法がクレジットカード決済のままであることを確かめるケース */
function 支払方法が更新されない(n: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔イベントID-M1302-${n}〕`);
    await loginAdmin(page, M1302_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventEdit(page, id); });
    await step(2, async () => {
      const box = form.支払方法("クレジットカード決済");
      if (await box.isDisabled()) note("支払方法のクレジットカード決済は無効になっていて、オフにできない");
      else await box.uncheck();
    });
    await step(3, async () => { await form.submit(form.更新ボタン); });
    let 支払方法: string[] | string = [];
    await step(4, async () => { 支払方法 = 保存されているイベント(id)?.支払方法 ?? "（イベントがDBに無い）"; });
    await expected(async () => {
      expect(支払方法, "支払方法").toEqual(["クレジットカード決済"]);
    });
  };
}
caseTest("IT-M13-02-033", 支払方法が更新されない("033"));
caseTest("IT-M13-02-034", 支払方法が更新されない("034"));

caseTest("IT-M13-02-039", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-039〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-039〕")); });
  await step(2, async () => { await form.日程の申込一覧リンク(日程).click(); await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect.soft(page, "この日程を対象とするイベント申込一覧画面へ遷移する").toHaveURL(new RegExp(`/event/entry/event_detail/${日程}(\\?.*)?$`));
    await expect.soft(page.locator("body"), "イベント申込一覧画面である").toContainText("イベント申込一覧");
    for (const x of ["A", "B"]) await expect.soft(page.locator("table tbody"), `申込 ${x} が一覧に出ている`).toContainText(notes.get(`〔申込ID-M1302-039${x}〕`));
  });
});

/** 日程行のポップアップメニューを開き、削除を選んで確定する。メニューに削除が無ければ、その旨を注記して何もしない。確定して要求が送られたら true */
async function 日程行の削除を試みる(form: EventForm, 日程: string): Promise<boolean> {
  if (!(await form.日程メニューの削除(日程).isVisible())) { note("日程行のポップアップメニューに削除が無く、選択できない"); return false; }
  await form.日程メニューの削除(日程).click();
  await expect(form.日程削除の確定(日程)).toBeVisible();
  await form.日程削除の確定(日程).click();
  await form.page.waitForLoadState("domcontentloaded");
  return true;
}

caseTest("IT-M13-02-047", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-047〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-047〕")); });
  await step(2, async () => { await form.日程の編集ボタン(日程).click(); });
  await step(3, async () => { await 日程行の削除を試みる(form, 日程); });
  let 状態 = "";
  await step(4, async () => { 状態 = 日程の状態(日程); });
  await expected(async () => {
    expect(状態, "申込がある日程が削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-049", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-049〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-049〕")); });
  await step(2, async () => {
    // 押せない状態のチェックボックスを、利用者が押したのと同じに、その位置で押す
    await form.日程チェック(日程).click({ force: true });
  });
  await expected(async () => {
    await expect.soft(form.日程チェック(日程), "チェックボックスが選択できない").toBeDisabled();
    await expect.soft(form.日程チェック(日程), "チェックボックスが選択されていない").not.toBeChecked();
    await expect.soft(form.チェックした日程削除ボタン, "一括削除の対象にできない（チェックした日程削除が押せない）").toBeDisabled();
  });
});

/** 開発者ツールで日程Bのチェックボックスを選択可能にし、日程A・Bを選んで、チェックした日程削除を確定する */
async function 選択不可の日程を含めて一括削除(form: EventForm, a: string, b: string, 手順: "選択可能にする" | "選択する" | "削除する"): Promise<void> {
  if (手順 === "選択可能にする") { await form.日程チェック(b).evaluate((e) => { (e as HTMLInputElement).disabled = false; }); return; }
  if (手順 === "選択する") { await form.日程チェック(a).check(); await form.日程チェック(b).check(); return; }
  await form.チェックした日程削除ボタン.click();
  await expect(form.一括削除の確定).toBeVisible();
  await form.一括削除の確定.click();
  await form.page.waitForLoadState("domcontentloaded");
}

caseTest("IT-M13-02-051", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔日程ID-M1302-051A〕"), b = notes.get("〔日程ID-M1302-051B〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-051〕")); });
  await step(2, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択可能にする"); });
  await step(3, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択する"); });
  await step(4, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "削除する"); });
  let 状態: string[] = [];
  await step(5, async () => { 状態 = [日程の状態(a), 日程の状態(b)]; });
  await expected(async () => {
    expect.soft(状態[0], "日程Aが削除されていない").toBe("ある");
    expect.soft(状態[1], "日程Bが削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-078", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-078〕"), 日程 = notes.get("〔日程ID-M1302-078〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  let 送信された = false;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.日程の編集ボタン(日程).click(); });
  await step(3, async () => { 送信された = await 日程行の削除を試みる(form, 日程); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    // 削除を選べず何も送られなければ、もとの画面が出ているだけで、遷移を確かめたことにならない
    expect(送信された, "削除を確定して、要求が送られた（メニューに削除が無く、何も送られていない）").toBe(true);
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-082", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-082〕"), a = notes.get("〔日程ID-M1302-082A〕"), b = notes.get("〔日程ID-M1302-082B〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択可能にする"); });
  await step(3, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択する"); });
  await step(4, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "削除する"); });
  await step(5, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-046", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-046〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-046〕")); });
  await step(2, async () => { await form.日程の編集ボタン(日程).click(); });
  await step(3, async () => { await 日程行の削除を試みる(form, 日程); });
  let 状態 = "";
  await step(4, async () => { 状態 = 日程の状態(日程); });
  await expected(async () => {
    expect(状態, "デッキ登録がある日程が削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-048", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-048〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-048〕")); });
  await step(2, async () => {
    // 押せない状態のチェックボックスを、利用者が押したのと同じに、その位置で押す
    await form.日程チェック(日程).click({ force: true });
  });
  await expected(async () => {
    await expect.soft(form.日程チェック(日程), "チェックボックスが選択できない").toBeDisabled();
    await expect.soft(form.日程チェック(日程), "チェックボックスが選択されていない").not.toBeChecked();
    await expect.soft(form.チェックした日程削除ボタン, "一括削除の対象にできない（チェックした日程削除が押せない）").toBeDisabled();
  });
});

caseTest("IT-M13-02-050", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔日程ID-M1302-050A〕"), b = notes.get("〔日程ID-M1302-050B〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-050〕")); });
  await step(2, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択可能にする"); });
  await step(3, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択する"); });
  await step(4, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "削除する"); });
  let 状態: string[] = [];
  await step(5, async () => { 状態 = [日程の状態(a), 日程の状態(b)]; });
  await expected(async () => {
    expect.soft(状態[0], "日程Aが削除されていない").toBe("ある");
    expect.soft(状態[1], "日程Bが削除されていない").toBe("ある");
  });
});

caseTest("IT-M13-02-077", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-077〕"), 日程 = notes.get("〔日程ID-M1302-077〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  let 送信された = false;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.日程の編集ボタン(日程).click(); });
  await step(3, async () => { 送信された = await 日程行の削除を試みる(form, 日程); });
  await step(4, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    // 削除を選べず何も送られなければ、もとの画面が出ているだけで、遷移を確かめたことにならない
    expect(送信された, "削除を確定して、要求が送られた（メニューに削除が無く、何も送られていない）").toBe(true);
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-080", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-080〕"), a = notes.get("〔日程ID-M1302-080A〕"), b = notes.get("〔日程ID-M1302-080B〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択可能にする"); });
  await step(3, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "選択する"); });
  await step(4, async () => { await 選択不可の日程を含めて一括削除(form, a, b, "削除する"); });
  await step(5, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});
