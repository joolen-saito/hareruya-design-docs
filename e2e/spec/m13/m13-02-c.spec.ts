/**
 * M13-02 イベント登録/編集（日程一覧と画面下部の操作。IT-M13-02-003、006、007、035〜038、040〜045）
 * ケースの正本: integration_test/casegen/cases/M13-02_test_cases.tsv（手順・期待結果の文は正本から引く）
 */
import { expect } from "@playwright/test";
import { CaseBody, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { openEventEdit, EventForm } from "../../pages/admin/event";
import { 日程の状態 } from "../../db/schedule";
import { M1302_ADMIN } from "../../seeds/m13-02";

const 編集画面 = (id: string) => new RegExp(`/event/${id}/edit(\\?.*)?$`);

caseTest("IT-M13-02-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-003〕")); });
  let ids: string[] = [];
  const 開始時間: string[] = [];
  await step(2, async () => {
    ids = await form.日程ID一覧();
    for (const id of ids) 開始時間.push(await form.開始時間(id));
  });
  await expected(async () => {
    expect.soft(ids, "日程IDの並び").toEqual(["A", "B", "C", "D"].map((x) => notes.get(`〔日程ID-M1302-003${x}〕`)));
    expect.soft(開始時間, "開始時間の並び（降順）").toEqual(["2026/12/01 10:00", "2026/11/01 10:00", "2026/10/01 10:00", "2026/09/01 10:00"]);
  });
});

caseTest("IT-M13-02-006", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-006〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-006〕")); });
  await step(2, async () => { await expect(form.日程行(日程)).toBeVisible(); });
  await expected(async () => {
    for (const [what, l] of [["更新", form.更新ボタン], ["日程追加", form.日程追加ボタン], ["繰返日程追加", form.繰返日程追加ボタン], ["削除", form.削除ボタン], ["複製新規", form.複製新規ボタン]] as const) {
      await expect.soft(l, `${what}が表示されている`).toBeVisible();
      await expect.soft(l, `${what}が使用できる`).toBeEnabled();
    }
    // チェックした日程削除は、日程を選ぶと押せるようになる
    await expect.soft(form.日程チェック(日程), "日程のチェックボックスが使用できる").toBeEnabled();
    await form.日程チェック(日程).check();
    await expect.soft(form.チェックした日程削除ボタン, "チェックした日程削除が使用できる").toBeEnabled();
    await form.日程の編集ボタン(日程).click();
    await expect.soft(form.日程メニューの削除(日程), "日程行の削除操作が使用できる").toBeVisible();
  });
});

caseTest("IT-M13-02-007", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-007〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-007〕")); });
  await step(2, async () => { await expect(form.操作部, "操作部が表示されている").toBeVisible(); });
  await expected(async () => {
    await expect.soft(form.操作部.getByRole("link", { name: "戻る" }).or(form.操作部.getByRole("button", { name: "戻る" })), "戻るボタンが表示されている").toBeVisible();
    const 操作 = await form.操作部.locator("a:visible, button:visible").allInnerTexts();
    expect.soft(操作.map((t) => t.trim()).filter(Boolean), "操作部に表示されているのは戻るボタンだけ").toEqual(["戻る"]);
    for (const [what, l] of [["登録", form.登録ボタン], ["更新", form.更新ボタン], ["削除", form.削除ボタン], ["日程追加", form.日程追加ボタン], ["繰返日程追加", form.繰返日程追加ボタン],
      ["チェックした日程削除", form.チェックした日程削除ボタン], ["複製新規", form.複製新規ボタン], ["日程のチェックボックス", form.日程チェック(日程)]] as const) {
      await expect.soft(l, `${what}が使用できない`).toBeHidden();
    }
    if (await form.日程の編集ボタン(日程).isVisible()) {
      await form.日程の編集ボタン(日程).click();
      await expect.soft(form.日程メニューの削除(日程), "日程行の削除操作が使用できない").toBeHidden();
      // 日程の編集: メニューに出ていれば、開いた日程編集画面で保存できないこと
      if (await form.日程メニューの編集(日程).isVisible()) {
        await form.日程メニューの編集(日程).click();
        await page.waitForLoadState("load");
        for (const b of await page.locator('form button[type="submit"]:visible').all()) await expect.soft(b, "日程編集画面の保存が使用できない").toBeDisabled();
      }
    }
  });
});

/** イベント編集画面を開き、画面下部のリンク・ボタンを押して、遷移先を確かめるケース */
function 押して遷移(n: string, 押す: (form: EventForm) => ReturnType<EventForm["field"]>, 遷移先: (id: string) => RegExp, what: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔イベントID-M1302-${n}〕`);
    await loginAdmin(page, M1302_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventEdit(page, id); });
    await step(2, async () => { await 押す(form).click(); });
    await expected(async () => {
      await expect(page, what).toHaveURL(遷移先(id));
    });
  };
}

caseTest("IT-M13-02-035", 押して遷移("035", (f) => f.日程追加ボタン, (id) => new RegExp(`/event/${id}/schedule/create$`), "日程追加画面へ遷移する"));
caseTest("IT-M13-02-036", 押して遷移("036", (f) => f.繰返日程追加ボタン, (id) => new RegExp(`/event/${id}/repeatSchedule/create$`), "繰返日程追加画面へ遷移する"));
caseTest("IT-M13-02-037", 押して遷移("037", (f) => f.複製新規ボタン, (id) => new RegExp(`/event/${id}/copy$`), "複製新規画面へ遷移する"));
caseTest("IT-M13-02-038", 押して遷移("038", (f) => f.イベント一覧リンク, () => /\/event(\/page\/\d+)?(\?.*)?$/, "イベント一覧画面へ遷移する"));

caseTest("IT-M13-02-040", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-040〕"), 日程 = notes.get("〔日程ID-M1302-040〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.日程の編集ボタン(日程).click(); });
  await step(3, async () => { await form.日程メニューの編集(日程).click(); });
  await expected(async () => {
    await expect(page, "日程編集画面へ遷移する").toHaveURL(new RegExp(`/event/${id}/schedule/${日程}/edit$`));
  });
});

/** 日程行のポップアップメニューから削除を選び、確定する */
async function 日程行を削除(form: EventForm, 日程: string): Promise<void> {
  await form.日程メニューの削除(日程).click();
  await expect(form.日程削除の確定(日程)).toBeVisible();
  await form.日程削除の確定(日程).click();
  await form.page.waitForLoadState("domcontentloaded");
}

caseTest("IT-M13-02-041", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-041〕"), 日程 = notes.get("〔日程ID-M1302-041〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.日程の編集ボタン(日程).click(); });
  await step(3, async () => { await 日程行を削除(form, 日程); });
  let 状態 = "";
  await step(4, async () => { 状態 = 日程の状態(日程); });
  await expected(async () => {
    expect(状態, "日程が削除されている").not.toBe("ある");
  });
});

caseTest("IT-M13-02-042", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-042〕"), 日程 = notes.get("〔日程ID-M1302-042〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await form.日程の編集ボタン(日程).click(); });
  await step(3, async () => { await 日程行を削除(form, 日程); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

/** 日程2件のチェックボックスをオンにし、チェックした日程削除を押して確定する */
async function 二件を一括削除(form: EventForm, a: string, b: string, 何手順目: "選ぶ" | "削除"): Promise<void> {
  if (何手順目 === "選ぶ") { await form.日程チェック(a).check(); await form.日程チェック(b).check(); return; }
  await form.チェックした日程削除ボタン.click();
  await expect(form.一括削除の確定).toBeVisible();
  await form.一括削除の確定.click();
  await form.page.waitForLoadState("domcontentloaded");
}

caseTest("IT-M13-02-043", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-043〕"), a = notes.get("〔日程ID-M1302-043A〕"), b = notes.get("〔日程ID-M1302-043B〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await 二件を一括削除(form, a, b, "選ぶ"); });
  await step(3, async () => { await 二件を一括削除(form, a, b, "削除"); });
  let 状態: string[] = [];
  await step(4, async () => { 状態 = [日程の状態(a), 日程の状態(b)]; });
  await expected(async () => {
    expect.soft(状態[0], "日程Aが削除されている").not.toBe("ある");
    expect.soft(状態[1], "日程Bが削除されている").not.toBe("ある");
  });
});

caseTest("IT-M13-02-044", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-044〕"), a = notes.get("〔日程ID-M1302-044A〕"), b = notes.get("〔日程ID-M1302-044B〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  await step(2, async () => { await 二件を一括削除(form, a, b, "選ぶ"); });
  await step(3, async () => { await 二件を一括削除(form, a, b, "削除"); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-045", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-045〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, id); });
  let 送信された = false;
  await step(2, async () => {
    // 日程を選んでいない間、このボタンは押せない状態で表示されている。利用者が押したのと同じに、その位置を押す
    const sent = page.waitForRequest((r) => r.isNavigationRequest(), { timeout: 5000 }).then(() => true, () => false);
    await form.チェックした日程削除ボタン.click({ force: true });
    if (await form.一括削除の確定.isVisible()) await form.一括削除の確定.click();
    送信された = await sent;
    await page.waitForLoadState("domcontentloaded");
  });
  await expected(async () => {
    // 押しても何も送られなければ、もとの画面が出ているだけで、遷移を確かめたことにならない
    expect(送信された, "チェックした日程削除ボタンを押して、要求が送られた（ボタンが押せない状態で、何も送られていない）").toBe(true);
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});
