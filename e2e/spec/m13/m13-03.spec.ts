/**
 * M13-03 日程登録/編集（日程の登録画面）。正本: cases/M13-03_test_cases.tsv
 * 画面だけで準備できるケースのうち、日程の登録・入力欄・表示を確かめるものを実装した（編集・削除は m13-03-b.spec.ts）。
 * 決め打ちの識別の値（イベント名）は rc() で実行ごとの印を付けて読む（依頼者決定 2026-10-28）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { 日程の入力, ScheduleFormPage } from "../../pages/admin/m13_03_schedule";
import { openEventEdit } from "../../pages/admin/event";
import { イベントの日程 } from "../../db/m13_03";
import { M1303_ADMIN } from "../../seeds/m13-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 受付あり・デッキ登録あり・オンライン受付ありをオフにする（シード表のとおり、条件付きの入力欄は空のまま） */
const すべてオフ: 日程の入力 = { 受付あり: false, デッキ登録あり: false, オンライン受付あり: false };
const 基本の入力: 日程の入力 = { 開始時間: "2026/09/10 18:00", 定員: "10", 参加費: "0", 公開状態: "公開" };

caseTest("IT-M13-03-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-001〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await openEventEdit(page, id); });
  await step(2, async () => {
    await page.getByRole("link", { name: "日程追加", exact: true }).click({ timeout: 30_000 });
    await page.waitForURL(/\/schedule\/create$/, { waitUntil: "load" });
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（日程追加画面）").toBe(`/admin/event/${id}/schedule/create`);
    await expect.soft(s.開始時間, "日程追加画面の開始時間の欄").toBeVisible();
  });
});

caseTest("IT-M13-03-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-002〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/10 18:00" }); });
  await step(3, async () => { await s.入力する({ 受付あり: true, 受付時間: { 開始: "16:00", 終了: "18:00" } }); });
  await step(4, async () => { await s.入力する({ デッキ登録あり: true, デッキ登録を終了する: true, デッキ登録締切: "2026/09/09 23:59" }); });
  await step(5, async () => { await s.入力する({ オンライン受付あり: true, オンライン受付: { 開始: "2026/09/01 09:00", 終了: "2026/09/09 23:00" } }); });
  await step(6, async () => { await s.入力する({ 定員: "64", 参加費: "3000", 公開状態: "公開", 賞品日: "賞品A", 賞品英: "Prize A" }); });
  await step(7, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(8, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    const r = rows[0];
    expect.soft(r?.開始時間, "開始時間").toBe("2026/09/10 18:00");
    expect.soft(r?.受付開始, "受付開始時間").toBe("2026/09/10 16:00");
    expect.soft(r?.受付終了, "受付終了時間").toBe("2026/09/10 18:00");
    expect.soft(r?.デッキ登録あり, "デッキ登録あり").toBe(true);
    expect.soft(r?.デッキ登録を終了する, "デッキ登録を終了する").toBe(true);
    expect.soft(r?.デッキ登録締切, "デッキ登録締め切り").toBe("2026/09/09 23:59");
    expect.soft(r?.オンライン受付あり, "オンライン受付あり").toBe(true);
    expect.soft(r?.オンライン受付開始, "オンライン受付開始時間").toBe("2026/09/01 09:00");
    expect.soft(r?.オンライン受付終了, "オンライン受付終了時間").toBe("2026/09/09 23:00");
    expect.soft(r?.定員, "定員").toBe("64");
    expect.soft(r?.参加費, "参加費").toBe("3000");
    expect.soft(r?.公開状態, "公開状態").toBe("公開");
    expect.soft(r?.賞品日, "賞品（日）").toBe("賞品A");
    expect.soft(r?.賞品英, "賞品（英）").toBe("Prize A");
  });
});

caseTest("IT-M13-03-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-003〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する(基本の入力); });
  await step(3, async () => {
    await s.条件付きの欄を空にする();
    await s.入力する({ ...すべてオフ, デッキ登録を終了する: false, 賞品日: "", 賞品英: "" });
  });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    const r = rows[0];
    expect.soft(r?.開始時間, "開始時間").toBe("2026/09/10 18:00");
    expect.soft([r?.定員, r?.参加費, r?.公開状態], "定員・参加費・公開状態").toEqual(["10", "0", "公開"]);
    expect.soft([r?.デッキ登録あり, r?.デッキ登録を終了する, r?.オンライン受付あり], "デッキ登録あり・終了する・オンライン受付あり（すべてオフ）").toEqual([false, false, false]);
    expect.soft([r?.受付開始 ?? null, r?.受付終了 ?? null, r?.デッキ登録締切 ?? null, r?.オンライン受付開始 ?? null, r?.オンライン受付終了 ?? null], "条件付きの日時（すべて空）").toEqual([null, null, null, null, null]);
    expect.soft([r?.賞品日 ?? "", r?.賞品英 ?? ""], "賞品（日）・賞品（英）（空）").toEqual(["", ""]);
  });
  note("「受付あり」をオフにした日程の受付開始・終了時間が空として記録されることを確かめた");
});

caseTest("IT-M13-03-004", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-004〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/10 18:00" }); });
  await step(3, async () => { await s.入力する({ 受付あり: true, 受付時間: { 開始: "16:00", 終了: "17:00" } }); });
  await step(4, async () => { await s.入力する({ デッキ登録あり: false, オンライン受付あり: false, 定員: "10", 参加費: "0", 公開状態: "公開" }); });
  await step(5, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(6, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.受付開始, "受付開始日時").toBe("2026/09/10 16:00");
    expect.soft(rows[0]?.受付終了, "受付終了日時").toBe("2026/09/10 17:00");
  });
});

caseTest("IT-M13-03-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-005〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する(基本の入力); });
  await step(3, async () => { await s.入力する(すべてオフ); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.祝日, "追加された日程の祝日状態").toBe(true);
  });
});

caseTest("IT-M13-03-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-006〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する(基本の入力); });
  await step(3, async () => { await s.入力する(すべてオフ); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.登録者, "追加された日程の登録者（試験管理者の管理者ID）").toBe(notes.get("〔管理者ID-M1303-共有〕"));
  });
});

caseTest("IT-M13-03-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-007〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { /* 初期表示の確認（期待結果で確かめる） */ await expect(s.受付あり, "受付あり").toBeVisible(); });
  await expected(async () => {
    await expect.soft(s.受付あり, "受付あり（オン）").toBeChecked();
    await expect.soft(s.デッキ登録あり, "デッキ登録あり（オン）").toBeChecked();
    await expect.soft(s.受付開始, "受付開始時間").toHaveValue("00:00");
    await expect.soft(s.受付終了, "受付終了時間").toHaveValue("00:00");
    await expect.soft(s.定員, "定員").toHaveValue("10");
    await expect.soft(s.参加費, "参加費").toHaveValue("0");
    expect.soft((await s.公開状態.locator("option:checked").innerText()).trim(), "公開状態").toBe("公開");
  });
});

caseTest("IT-M13-03-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-008〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 受付あり: false, デッキ登録あり: false, オンライン受付あり: true }); });
  await step(3, async () => { await expect(s.オンライン受付あり, "オンライン受付あり").toBeChecked(); });
  await expected(async () => {
    await expect.soft(s.受付開始, "受付開始時間（非表示）").toBeHidden();
    await expect.soft(s.受付終了, "受付終了時間（非表示）").toBeHidden();
    await expect.soft(s.デッキ登録締切, "デッキ登録締め切り（非表示）").toBeHidden();
    await expect.soft(s.オンライン受付開始, "オンライン受付開始時間（表示）").toBeVisible();
    await expect.soft(s.オンライン受付終了, "オンライン受付終了時間（表示）").toBeVisible();
  });
});

caseTest("IT-M13-03-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const a = notes.get("〔イベントID-M1303-009A〕");
  const b = notes.get("〔イベントID-M1303-009B〕");
  const s = new ScheduleFormPage(page);
  let 接尾A = "", 接尾B = "";
  await step(1, async () => { await s.日程追加画面を開く(a); 接尾A = (await s.定員の接尾辞.innerText()).trim(); });
  await step(2, async () => { await s.日程追加画面を開く(b); 接尾B = (await s.定員の接尾辞.innerText()).trim(); });
  await expected(async () => {
    expect.soft(接尾A, "チーム戦オフのイベントの定員の接尾辞").toBe("人");
    expect.soft(接尾B, "チーム戦オンのイベントの定員の接尾辞").toBe("組");
  });
});

caseTest("IT-M13-03-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(notes.get("〔イベントID-M1303-010〕")); });
  await step(2, async () => { await expect(s.登録ボタン, "操作ボタンの並ぶ帯").toBeVisible(); });
  await expected(async () => {
    await expect.soft(s.登録ボタン, "登録ボタン").toBeVisible();
    await expect.soft(s.更新ボタン, "更新ボタン（表示されない）").toHaveCount(0);
    await expect.soft(s.削除ボタン, "削除ボタン（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-M13-03-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-017〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/10 18:00", 公開状態: "公開", ...すべてオフ }); });
  await step(3, async () => { await s.入力する({ 定員: "11111111", 参加費: "22222222" }); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.定員, "定員（8桁）").toBe("11111111");
    expect.soft(rows[0]?.参加費, "参加費（8桁）").toBe("22222222");
  });
});

caseTest("IT-M13-03-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-019〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ ...基本の入力, ...すべてオフ }); });
  await step(3, async () => { await s.入力する({ 賞品日: "あ".repeat(4096), 賞品英: "A".repeat(4096) }); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft((rows[0]?.賞品日 ?? "").length, "賞品（日）の文字数").toBe(4096);
    expect.soft((rows[0]?.賞品英 ?? "").length, "賞品（英）の文字数").toBe(4096);
    expect.soft(rows[0]?.賞品日, "賞品（日）の内容").toBe("あ".repeat(4096));
    expect.soft(rows[0]?.賞品英, "賞品（英）の内容").toBe("A".repeat(4096));
  });
});

caseTest("IT-M13-03-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-022〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/10 18:00", 定員: "1", 参加費: "0", 公開状態: "公開" }); });
  await step(3, async () => { await s.入力する(すべてオフ); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.定員, "定員（下限値）").toBe("1");
  });
});

caseTest("IT-M13-03-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-028〕");
  const s = new ScheduleFormPage(page);
  let r = { sent: false, 止めた項目: [] as string[] };
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "", 定員: "12", 参加費: "500", 公開状態: "公開", 賞品日: "保持対象賞品" }); });
  await step(3, async () => { await s.入力する(すべてオフ); });
  await step(4, async () => { r = await s.押して送信する(s.登録ボタン); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示されている画面（日程追加画面）").toBe(`/admin/event/${id}/schedule/create`);
    await expect.soft(s.定員, "定員（保たれる）").toHaveValue("12");
    await expect.soft(s.参加費, "参加費（保たれる）").toHaveValue("500");
    expect.soft((await s.公開状態.locator("option:checked").innerText()).trim(), "公開状態（保たれる）").toBe("公開");
    await expect.soft(s.賞品日, "賞品（日）（保たれる）").toHaveValue("保持対象賞品");
  });
  if (!r.sent) note(`ブラウザの入力チェックが送信を止めた（止めた項目: ${r.止めた項目.join(" / ")}）。画面が再表示されたのではなく、送信されないまま入力が残っている`);
});

caseTest("IT-M13-03-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-029〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する(基本の入力); });
  await step(3, async () => { await s.入力する(すべてオフ); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（追加された日程の日程編集画面）").toMatch(new RegExp(`^/admin/event/${id}/schedule/\\d+/edit$`));
  });
});

caseTest("IT-M13-03-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-032〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ ...基本の入力, ...すべてオフ }); });
  await step(3, async () => { await s.なりすまし対策トークンを書き換える("invalid-token"); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数（0件のまま）").toBe(0);
  });
});

caseTest("IT-M13-03-048", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-048〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/10 18:00", 公開状態: "公開", ...すべてオフ }); });
  await step(3, async () => { await s.入力する({ 定員: "99999999", 参加費: "0" }); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.定員, "定員（8桁）").toBe("99999999");
  });
});

caseTest("IT-M13-03-050", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-050〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/10 18:00", 公開状態: "公開", ...すべてオフ }); });
  await step(3, async () => { await s.入力する({ 定員: "10", 参加費: "99999999" }); });
  await step(4, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.参加費, "参加費（8桁）").toBe("99999999");
  });
});

caseTest("IT-M13-03-052", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(notes.get("〔イベントID-M1303-052〕")); });
  await step(2, async () => { await expect(s.賞品日, "賞品（日）の欄").toBeVisible(); });
  await expected(async () => {
    await expect.soft(s.賞品日, "賞品（日）の初期表示").toHaveValue("M1303-052賞品日");
    await expect.soft(s.賞品英, "賞品（英）の初期表示").toHaveValue("M1303-052-PRIZE-EN");
  });
});

caseTest("IT-M13-03-053", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-053〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  let ラベルID = "", ラベル名 = "";
  await step(2, async () => { ラベルID = await s.ラベルの値("イベントID"); ラベル名 = await s.ラベルの値("イベント名（日）"); });
  await expected(async () => {
    expect.soft(ラベルID, "イベントIDのラベル").toBe(id);
    expect.soft(ラベル名, "イベント名（日）のラベル").toBe(rcName("M1303-053追加表示イベント"));
  });
});

caseTest("IT-M13-03-057", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(notes.get("〔イベントID-M1303-057〕")); });
  await step(2, async () => { await expect(s.定員, "定員の欄").toBeVisible(); });
  await expected(async () => {
    await expect.soft(s.定員, "定員の初期表示").toHaveValue("20");
    await expect.soft(s.参加費, "参加費の初期表示").toHaveValue("1500");
  });
});

caseTest("IT-M13-03-058", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(notes.get("〔イベントID-M1303-058〕")); });
  await step(2, async () => { await expect(s.公開状態, "公開状態の欄").toBeVisible(); });
  await expected(async () => {
    expect.soft((await s.公開状態.locator("option:checked").innerText()).trim(), "公開状態の初期表示").toBe("非公開");
  });
});

caseTest("IT-M13-03-059", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-059〕");
  const s = new ScheduleFormPage(page);
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する({ 開始時間: "2026/09/11 18:00", 定員: "10", 参加費: "0", 公開状態: "公開", ...すべてオフ }); });
  await step(3, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(4, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(1);
    expect.soft(rows[0]?.祝日 === true, "追加された日程が祝日として記録されたか").toBe(false);
  });
});

caseTest("IT-M13-03-060", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1303_ADMIN);
  const id = notes.get("〔イベントID-M1303-060〕");
  const s = new ScheduleFormPage(page);
  const 入力: 日程の入力 = { 開始時間: "2026/09/12 18:00", 定員: "10", 参加費: "0", 公開状態: "公開", ...すべてオフ };
  await step(1, async () => { await s.日程追加画面を開く(id); });
  await step(2, async () => { await s.入力する(入力); });
  await step(3, async () => { await s.押して送信する(s.登録ボタン); });
  await step(4, async () => { await s.日程追加画面を開く(id); });
  await step(5, async () => { await s.入力する(入力); });
  await step(6, async () => { await s.押して送信する(s.登録ボタン); });
  let rows: ReturnType<typeof イベントの日程> = [];
  await step(7, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.length, "追加された日程の件数").toBe(2);
    for (const [i, r] of rows.entries()) {
      expect.soft([r.開始時間, r.定員, r.参加費, r.公開状態], `${i + 1}件目の開始時間・定員・参加費・公開状態`).toEqual(["2026/09/12 18:00", "10", "0", "公開"]);
    }
  });
});

/** 実行の印を付けたイベント名（シードが作った名前） */
const rcName = (正本の名前: string): string => rc(正本の名前);
