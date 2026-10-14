/**
 * M13-02 イベント登録/編集
 * ケースの正本: integration_test/casegen/cases/M13-02_test_cases.tsv（手順・期待結果の文は正本から引く）
 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { openEventCreate, openEventEdit, EventForm } from "../../pages/admin/event";
import { 保存されているイベント } from "../../db/event";
import { M1302_ADMIN } from "../../seeds/m13-02";

caseTest("IT-M13-02-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventCreate(page); });
  let 店舗: string[] = [];
  await step(2, async () => { 店舗 = await form.selected(form.店舗); });
  await expected(async () => {
    expect(店舗, "店舗の初期値").toEqual(["店舗A"]);
    await expect(form.支払方法("クレジットカード決済"), "支払方法の初期値").toBeChecked();
  });
});

caseTest("IT-M13-02-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1302_ADMIN);
  let form!: EventForm;
  await step(1, async () => { form = await openEventEdit(page, notes.get("〔イベントID-M1302-002〕")); });
  await step(2, async () => { await expect(form.イベント名日).toBeVisible(); });
  await expected(async () => {
    await expect.soft(form.会場, "会場").toHaveValue("会場A");
    await expect.soft(form.イベント名日).toHaveValue("編集前イベント-002");
    await expect.soft(form.イベント名英).toHaveValue("Before Event-002");
    expect.soft(await form.selected(form.店舗), "店舗").toEqual(["店舗A"]);
    expect.soft(await form.selected(form.フォーマット), "フォーマット").toEqual(["スタンダード"]);
    expect.soft(await form.selected(form.ルール適用度), "ルール適用度").toEqual(["初心者歓迎"]);
    expect.soft(await form.selected(form.公開状態), "公開状態").toEqual(["公開"]);
    expect.soft(await form.selected(form.イベント規模), "イベント規模").toEqual(["おすすめイベント"]);
    await expect.soft(form.バナーURL日).toHaveValue("https://example.com/before-jp");
    await expect.soft(form.バナーURL英).toHaveValue("https://example.com/before-en");
    await expect.soft(form.定員).toHaveValue("16");
    await expect.soft(form.チーム戦).not.toBeChecked();
    await expect.soft(form.支払方法("クレジットカード決済")).toBeChecked();
    await expect.soft(form.参加費).toHaveValue("500");
    await expect.soft(form.賞品日).toHaveValue("編集前賞品");
    await expect.soft(form.賞品英).toHaveValue("Before Prize");
    for (const n of [1, 2, 3] as const) {
      const f = form.フリー入力エリア(n);
      await expect.soft(f.項目名日).toHaveValue(`項目${n}`);
      await expect.soft(f.項目名英).toHaveValue(`Item${n}-002`);
      await expect.soft(f.内容日).toHaveValue(`内容${n}`);
      await expect.soft(f.内容英).toHaveValue(`Content${n}-002`);
      await expect.soft(f.初期表示は閉じる).not.toBeChecked();
    }
  });
});
