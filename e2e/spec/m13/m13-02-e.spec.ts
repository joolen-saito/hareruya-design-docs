/**
 * M13-02 イベント登録/編集（IT-M13-02-066〜076、079、081、083 のうち、申込・デッキ登録のデータが要らないもの）
 * ケースの正本: integration_test/casegen/cases/M13-02_test_cases.tsv（手順・期待結果の文は正本から引く）
 */
import { Page } from "@playwright/test";
import { expect, CaseBody, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { openEventCreate, openEventEdit, EventForm } from "../../pages/admin/event";
import { sendForm } from "../../pages/admin/devtools";
import { 保存されているイベント } from "../../db/event";
import { 日程の状態 } from "../../db/schedule";
import { M1302_ADMIN, M1302_ADMIN_072 } from "../../seeds/m13-02";

const 編集画面 = (id: string) => new RegExp(`/event/${id}/edit(\\?.*)?$`);
const 日程一括削除要求 = (page: Page, イベント: string, 日程: string) => sendForm(page, adminUrl(`/event/${イベント}/schedule/bulk_delete`), [["event_detail_ids[]", 日程]], "有効");

caseTest("IT-M13-02-066", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-066〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => {
    // イベント編集画面の入力欄を使える状態にし、イベント名(日)を変えて、画面の更新と同じ要求を送る
    await openEventEdit(page, id);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.locator("form#event_form").evaluate((f) => {
        const form = f as HTMLFormElement;
        for (const e of Array.from(form.elements) as HTMLInputElement[]) { e.disabled = false; e.readOnly = false; }
        (form.elements.namedItem("admin_event[nameJp]") as HTMLInputElement).value = "M1302-066-AFTER";
        form.submit();
      }),
    ]);
  });
  let 名前 = "";
  await step(2, async () => { 名前 = 保存されているイベント(id)?.["イベント名(日)"] ?? "（イベントがDBに無い）"; });
  await expected(async () => {
    expect(名前, "イベント名(日)").toBe("M1302-066-BEFORE");
  });
});

caseTest("IT-M13-02-067", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-067〕")); });
  await step(2, async () => { await expect(form.チーム戦, "チーム戦がオフである").not.toBeChecked(); });
  await expected(async () => {
    await expect(form.定員の接尾辞, "定員の接尾辞").toHaveText("人");
  });
});

caseTest("IT-M13-02-068", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-068〕")); });
  await step(2, async () => { await form.チーム戦.check(); });
  await step(3, async () => { await expect(form.定員の接尾辞).toBeVisible(); });
  await expected(async () => {
    await expect(form.定員の接尾辞, "定員の接尾辞").toHaveText("組");
  });
});

caseTest("IT-M13-02-069", async ({ page, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); await page.waitForLoadState("load"); });
  let 候補: string[] = [];
  await step(2, async () => {
    await form.フォーマットの入力欄.click();
    await form.フォーマットの入力欄.pressSequentially("スタ");
    await expect(form.フォーマットの候補.first()).toBeVisible();
    候補 = (await form.フォーマットの候補.allInnerTexts()).map((t) => t.trim());
  });
  await step(3, async () => { await form.フォーマットの候補.filter({ hasText: /^スタンダード$/ }).click(); });
  await expected(async () => {
    expect.soft(候補, "候補に「スタンダード」が表示される").toContain("スタンダード");
    expect.soft(await form.selected(form.フォーマット), "フォーマットの選択").toEqual(["スタンダード"]);
  });
});

/** 公開状態を変えて更新し、DBの公開状態を確かめるケース */
function 公開状態を更新(n: string, 公開状態: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔イベントID-M1302-${n}〕`);
    await loginAdmin(page, M1302_ADMIN);
    let form!: EventForm;
    await step(1, async () => { form = await openEventEdit(page, id); });
    await step(2, async () => { await form.fill({ 公開状態 }); await form.submit(form.更新ボタン); });
    let 保存値 = "";
    await step(3, async () => { 保存値 = 保存されているイベント(id)?.公開状態 ?? "（イベントがDBに無い）"; });
    await expected(async () => {
      expect(保存値, "公開状態").toBe(公開状態);
    });
  };
}
caseTest("IT-M13-02-070", 公開状態を更新("070", "非公開"));
caseTest("IT-M13-02-071", 公開状態を更新("071", "限定公開"));

caseTest("IT-M13-02-072", async ({ page, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN_072);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); });
  await step(2, async () => { await expect(form.操作部).toBeVisible(); });
  await expected(async () => {
    for (const [what, l] of [["日程追加", form.日程追加ボタン], ["繰返日程追加", form.繰返日程追加ボタン], ["削除", form.削除ボタン], ["チェックした日程削除", form.チェックした日程削除ボタン], ["複製新規", form.複製新規ボタン]] as const) {
      await expect.soft(l, `${what}ボタンが表示されない`).toBeHidden();
    }
  });
});

caseTest("IT-M13-02-073", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-073〕");
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-073〕")); });
  const 欄: Record<string, string> = {};
  await step(2, async () => { for (const h of ["受付時間", "オンライン受付時間", "デッキ登録締切"]) 欄[h] = await form.日程の欄(日程, h); });
  await expected(async () => {
    // 日付の区切りは「-」でも「/」でもよい。日付と時刻の両方が表示されていること
    const 日時 = (v: string) => new RegExp(v.replace(/-/g, "[-/]"));
    expect.soft(欄["受付時間"], "受付時間の開始").toMatch(日時("2026-11-01 09:00"));
    expect.soft(欄["受付時間"], "受付時間の終了").toMatch(日時("2026-11-01 09:50"));
    expect.soft(欄["オンライン受付時間"], "オンライン受付時間の開始").toMatch(日時("2026-10-25 12:00"));
    expect.soft(欄["オンライン受付時間"], "オンライン受付時間の終了").toMatch(日時("2026-10-31 23:00"));
    expect.soft(欄["デッキ登録締切"], "デッキ登録締切").toMatch(日時("2026-10-31 18:00"));
  });
});

caseTest("IT-M13-02-074", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-074〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await sendForm(page, adminUrl(`/event/${id}/delete`), [], "有効", "DELETE"); });
  await step(2, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-075", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-075〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await sendForm(page, adminUrl(`/event/${id}/schedule/${notes.get("〔日程ID-M1302-075〕")}/delete`), [], "有効", "DELETE"); });
  await step(2, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-076", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔イベントID-M1302-076A〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await openEventEdit(page, a); });
  await step(2, async () => { await sendForm(page, adminUrl(`/event/${a}/schedule/${notes.get("〔日程ID-M1302-076B〕")}/delete`), [], "有効", "DELETE"); });
  await step(3, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(a));
  });
});

caseTest("IT-M13-02-079", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1302-079〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await 日程一括削除要求(page, id, notes.get("〔日程ID-M1302-079〕")); });
  await step(2, async () => { await page.waitForLoadState("load"); });
  await expected(async () => {
    await expect(page, "イベント編集画面へ遷移する").toHaveURL(編集画面(id));
  });
});

caseTest("IT-M13-02-081", async ({ page, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); });
  let 見出し = "";
  await step(2, async () => { 見出し = (await page.locator("form#event_form").innerText()).replace(/\s+/g, " "); });
  await expected(async () => {
    expect.soft(見出し, "イベント属性に会場の項目が表示されない").not.toContain("会場");
    await expect.soft(form.会場, "会場の入力項目が無い").toHaveCount(0);
  });
});

caseTest("IT-M13-02-083", async ({ page, notes, step, expected }) => {
  const 日程 = notes.get("〔日程ID-M1302-083〕");
  await loginAdmin(page, M1302_ADMIN);
  await step(1, async () => { await 日程一括削除要求(page, notes.get("〔イベントID-M1302-083〕"), 日程); });
  let 状態 = "";
  await step(2, async () => { 状態 = 日程の状態(日程); });
  await expected(async () => {
    expect(状態, "店舗Bの日程が削除されず残っている").toBe("ある");
  });
});
