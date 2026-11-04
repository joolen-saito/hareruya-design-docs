/**
 * M13-03 日程登録/編集（日程の編集・削除・表示・登録エラー）。正本: cases/M13-03_test_cases.tsv
 * 「更新ボタン」は、画面では「保存」ボタン（設計書は「更新」と定める）。手順で「更新ボタンを押す」ときは画面の唯一の送信ボタンである保存ボタンを押す。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { ScheduleFormPage } from "../../pages/admin/m13_03_schedule";
import { 日程, イベントの日程 } from "../../db/m13_03";
import { M1303_ADMIN } from "../../seeds/m13-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 更新の注記 = () => note("画面の送信ボタンは「保存」で、「更新」という名前のボタンは無い。手順の「更新ボタン」として、この保存ボタンを押した");

caseTest("IT-M13-03-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程編集画面を開く(notes.get("〔イベントID-M1303-011〕"), notes.get("〔日程ID-M1303-011〕")); });
  await step(2, async () => { await expect(s.開始時間, "日程編集画面").toBeVisible(); });
  await expected(async () => {
    await expect.soft(s.更新ボタン, "更新ボタン").toBeVisible();
    await expect.soft(s.削除ボタン, "削除ボタン").toBeVisible();
    await expect.soft(s.登録ボタン, "登録ボタン（表示されない）").toHaveCount(0);
  });
  note(`画面の送信ボタンの名前は「${(await s.保存ボタン.count()) > 0 ? "保存" : "（なし）"}」`);
});

caseTest("IT-M13-03-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const 日程ID = notes.get("〔日程ID-M1303-012〕");
  let popup: import("@playwright/test").Page | null = null;
  await step(1, async () => { await s.日程編集画面を開く(notes.get("〔イベントID-M1303-012〕"), 日程ID); });
  await step(2, async () => {
    const [p] = await Promise.all([page.context().waitForEvent("page", { timeout: 30_000 }), s.イベントページURLのリンク.click({ timeout: 30_000 })]);
    popup = p;
    await p.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(popup?.url() ?? "", "開いたフロントのイベントページのアドレス").toMatch(new RegExp(`/events/${日程ID}/detail`));
  });
});

caseTest("IT-M13-03-037", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const イベントID = notes.get("〔イベントID-M1303-037〕"), 日程ID = notes.get("〔日程ID-M1303-037〕");
  await step(1, async () => { await s.日程編集画面を開く(イベントID, 日程ID); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/11/01 19:00", 定員: "32", 参加費: "1000", 賞品日: "更新後賞品", 賞品英: "Updated Prize" }); });
  await step(3, async () => { await s.入力する({ 受付あり: false, デッキ登録あり: false, オンライン受付あり: false, 公開状態: "公開" }); });
  await step(4, async () => { 更新の注記(); await s.押して送信する(s.保存ボタン); });
  let r: ReturnType<typeof 日程> = null;
  await step(5, async () => { r = 日程(日程ID); });
  await expected(async () => {
    expect.soft(r?.開始時間, "開始時間").toBe("2026/11/01 19:00");
    expect.soft(r?.定員, "定員").toBe("32");
    expect.soft(r?.参加費, "参加費").toBe("1000");
    expect.soft(r?.賞品日, "賞品（日）").toBe("更新後賞品");
    expect.soft(r?.賞品英, "賞品（英）").toBe("Updated Prize");
    expect.soft([r?.デッキ登録あり, r?.オンライン受付あり], "デッキ登録あり・オンライン受付あり（オフ）").toEqual([false, false]);
    expect.soft(r?.公開状態, "公開状態").toBe("公開");
  });
});

caseTest("IT-M13-03-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const イベントID = notes.get("〔イベントID-M1303-038〕");
  await step(1, async () => { await s.日程編集画面を開く(イベントID, notes.get("〔日程ID-M1303-038〕")); });
  await step(2, async () => { await s.入力する({ 定員: "32" }); });
  await step(3, async () => { 更新の注記(); await s.押して送信する(s.保存ボタン); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（イベント編集画面）").toBe(`/admin/event/${イベントID}/edit`);
  });
});

caseTest("IT-M13-03-041", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const 日程ID = notes.get("〔日程ID-M1303-041〕");
  await step(1, async () => { await s.日程編集画面を開く(notes.get("〔イベントID-M1303-041〕"), 日程ID); });
  await step(2, async () => { await s.削除ボタン.click({ timeout: 30_000 }); });
  await step(3, async () => { await s.確認画面の削除を押す(日程ID); });
  let r: ReturnType<typeof 日程> = null;
  await step(4, async () => { r = 日程(日程ID); });
  await expected(async () => {
    expect.soft(r === null || r.削除済み, "日程が削除されたか（行が無い、または削除の印がある）").toBe(true);
  });
});

caseTest("IT-M13-03-042", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const イベントID = notes.get("〔イベントID-M1303-042〕"), 日程ID = notes.get("〔日程ID-M1303-042〕");
  await step(1, async () => { await s.日程編集画面を開く(イベントID, 日程ID); });
  await step(2, async () => { await s.削除ボタン.click({ timeout: 30_000 }); });
  await step(3, async () => { await s.確認画面の削除を押す(日程ID); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（イベント編集画面）").toBe(`/admin/event/${イベントID}/edit`);
  });
});

caseTest("IT-M13-03-046", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const イベントID = notes.get("〔イベントID-M1303-046〕");
  await step(1, async () => { await s.日程編集画面を開く(イベントID, notes.get("〔日程ID-M1303-046〕")); });
  await step(2, async () => { await s.イベント編集リンク.click({ timeout: 30_000 }); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（イベント編集画面）").toBe(`/admin/event/${イベントID}/edit`);
  });
});

caseTest("IT-M13-03-047", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程編集画面を開く(notes.get("〔イベントID-M1303-047〕"), notes.get("〔日程ID-M1303-047〕")); });
  const v: Record<string, string> = {};
  await step(2, async () => {
    for (const k of ["イベントID", "イベント詳細ID", "イベント名（日）"]) v[k] = await s.ラベルの値(k);
  });
  await expected(async () => {
    expect.soft(v["イベントID"], "イベントIDのラベル").toBe(notes.get("〔イベントID-M1303-047〕"));
    expect.soft(v["イベント詳細ID"], "イベント詳細IDのラベル").toBe(notes.get("〔日程ID-M1303-047〕"));
    expect.soft(v["イベント名（日）"], "イベント名（日）のラベル").toBe(rc("M1303-047表示イベント"));
  });
});

caseTest("IT-M13-03-063", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const id = notes.get("〔イベントID-M1303-CB063〕");
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/10 18:00", 定員: "10", 参加費: "1000", 公開状態: "公開" }); });
  await step(3, async () => { await s.入力する({ 受付あり: false, デッキ登録あり: false, デッキ登録を終了する: false, オンライン受付あり: true, オンライン受付: { 開始: "2026/09/01 09:00", 終了: "2026/09/09 23:00" } }); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  await step(5, async () => { await expect(s.開始時間, "表示された画面").toBeVisible(); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(6, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示されている画面（日程入力画面）").toBe(`/admin/event/${id}/schedule/create`);
    await expect.soft(page.getByText("保存に失敗しました", { exact: false }).first(), "画面上部のメッセージ「保存に失敗しました」").toBeVisible();
    expect.soft(rows.length, "追加された日程の件数（0件のまま）").toBe(0);
  });
});

caseTest("IT-M13-03-064", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const イベントID = notes.get("〔イベントID-M1303-CB064〕"), 日程ID = notes.get("〔日程ID-M1303-CB064〕");
  await step(1, async () => { await s.日程編集画面を開く(イベントID, 日程ID); });
  await step(2, async () => { await s.入力する({ 参加費: "1000" }); });
  await step(3, async () => { await s.入力する({ オンライン受付あり: true, オンライン受付: { 開始: "2026/09/01 09:00", 終了: "2026/09/30 23:00" } }); });
  await step(4, async () => { 更新の注記(); await s.押して送信する(s.保存ボタン); });
  await step(5, async () => { await expect(page.locator("body"), "表示された画面").toBeVisible(); });
  let r: ReturnType<typeof 日程> = null;
  await step(6, async () => { r = 日程(日程ID); });
  await expected(async () => {
    await expect.soft(page.locator(".alert-danger, .invalid-feedback, .form-error-message").first(), "更新のエラー表示").toBeVisible();
    expect.soft(r?.参加費, "参加費（0のまま）").toBe("0");
    expect.soft(r?.オンライン受付あり, "オンライン受付あり（オフのまま）").toBe(false);
  });
});

caseTest("IT-M13-03-065", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  const イベントID = notes.get("〔イベントID-M1303-CB065〕"), 日程ID = notes.get("〔日程ID-M1303-CB065〕");
  await step(1, async () => { await s.日程編集画面を開く(イベントID, 日程ID); });
  await step(2, async () => { await s.入力する({ 定員: "20" }); });
  await step(3, async () => { await s.入力する({ オンライン受付あり: true, オンライン受付: { 開始: "2026/09/01 09:00", 終了: "2026/09/30 23:00" } }); });
  await step(4, async () => { 更新の注記(); await s.押して送信する(s.保存ボタン); });
  let r: ReturnType<typeof 日程> = null;
  await step(5, async () => { r = 日程(日程ID); });
  await expected(async () => {
    expect.soft(r?.定員, "定員（16から20）").toBe("20");
    expect.soft(r?.オンライン受付あり, "オンライン受付あり（オン）").toBe(true);
  });
});
