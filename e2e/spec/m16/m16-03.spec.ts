/** M16-03 祝日追加・削除。正本: cases/M16-03_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { HolidayPage } from "../../pages/admin/m16_03_holiday";
import { M1603_ADMIN } from "../../seeds/m16-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ここ = /\/data\/holiday\/?$/;

caseTest("IT-M16-03-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await expected(async () => {
    expect.soft(await h.追加枠が表示されている(), "祝日の新規登録枠が表示されている").toBe(true);
  });
});

caseTest("IT-M16-03-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await step(3, async () => { await h.戻るを押す(); });
  await expected(async () => {
    expect.soft(await h.追加枠が表示されている(), "祝日の新規登録枠が表示されている").toBe(false);
  });
});

caseTest("IT-M16-03-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await step(3, async () => { await h.属性を消す(h.名称欄, "maxlength"); });
  await step(4, async () => { await h.名称欄.fill("あ".repeat(65)); await h.日付欄.fill("2025-04-17"); });
  let r = { sent: false, status: 0, path: "" };
  await step(5, async () => { r = await h.送信する(h.追加ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "追加の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.取得開始日.fill(""); await h.取得終了日.fill("2025-01-13"); });
  await step(3, async () => { await h.属性を消す(h.取得開始日, "required"); });
  let r = { sent: false, status: 0, path: "" };
  await step(4, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.取得開始日.fill("2025-01-01"); await h.取得終了日.fill(""); });
  await step(3, async () => { await h.属性を消す(h.取得終了日, "required"); });
  let r = { sent: false, status: 0, path: "" };
  await step(4, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.取得開始日.fill("2025-05-02"); await h.取得終了日.fill("2025-05-01"); });
  let r = { sent: false, status: 0, path: "" };
  await step(3, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-020", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.属性を書き換える(h.取得開始日, "type", "text"); });
  await step(3, async () => { await h.取得開始日.fill("2025-02-30"); await h.取得終了日.fill("2025-03-01"); });
  let r = { sent: false, status: 0, path: "" };
  await step(4, async () => { r = await h.送信する(h.決定ボタン); if (!r.sent) note("ブラウザの入力チェックが送信を止めた"); });
  await expected(async () => {
    expect.soft(r.sent, "決定の要求が送られた").toBe(true);
    expect.soft(r.path, "表示された画面（祝日追加・削除画面）").toMatch(ここ);
  });
});

caseTest("IT-M16-03-034", async ({ page, step, expected }) => {
  await loginAdmin(page, M1603_ADMIN);
  const h = new HolidayPage(page);
  await step(1, async () => { await h.open(); });
  await step(2, async () => { await h.新規登録を押す(); });
  await step(3, async () => { await h.名称欄.fill("期限不正祝日"); await h.日付欄.fill("2025-04-18"); });
  await step(4, async () => { await h.追加のトークン.evaluate((e) => { (e as HTMLInputElement).value = "invalid-token"; }); });
  let r = { sent: false, status: 0, path: "" };
  await step(5, async () => { r = await h.送信する(h.追加ボタン); });
  await expected(async () => {
    expect.soft(r.status, "追加の要求の応答（アクセス拒否）").toBe(403);
  });
});
