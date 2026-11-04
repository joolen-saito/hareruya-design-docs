/**
 * M13-04 繰返日程追加。正本: cases/M13-04_test_cases.tsv（画面だけで準備できるケースを実装）
 * 決め打ちの識別の値（イベント名）は rc() で実行ごとの印を付ける（依頼者決定 2026-10-28）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { RepeatScheduleFormPage, 繰返の入力 } from "../../pages/admin/m13_04_repeat";
import { イベントの日程, 管理者ID } from "../../db/m13_03";
import { M1304_ADMIN } from "../../seeds/m13-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const すべてオフ: 繰返の入力 = { 受付あり: false, デッキ登録あり: false, オンライン受付あり: false };
const 木曜: 繰返の入力 = { 期間From: "2026/09/09", 期間To: "2026/09/11", 曜日: ["木曜日"], 開始時間: "18:00" };
const オンライン7日前から1日前: 繰返の入力 = { オンライン受付あり: true, オンライン受付: { 開始前日数: "7", 開始時刻: "09:00", 終了前日数: "1", 終了時刻: "23:00" } };
type Rows = ReturnType<typeof イベントの日程>;
const の日 = (rows: Rows, 日付: string) => rows.find((r) => r.開始時間?.startsWith(日付));

caseTest("IT-M13-04-001", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-001〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/08/31", 期間To: "2026/09/11", 曜日: ["水曜日"], 開始時間: "18:00" }); });
  await step(3, async () => { await r.入力する({ 受付あり: true, 受付時間: { 開始: "16:00", 終了: "18:00" }, デッキ登録あり: false, オンライン受付あり: false }); });
  await step(4, async () => { await r.登録を押す(); });
  let rows: Rows = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.開始時間), "登録された日程の開始日時（開始日の昇順）").toEqual(["2026/09/02 18:00", "2026/09/09 18:00"]);
  });
});

caseTest("IT-M13-04-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-002〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  let row: ReturnType<typeof の日> = undefined;
  await step(5, async () => { row = の日(イベントの日程(id), "2026/09/10"); });
  await expected(async () => {
    expect.soft(row?.定員, "作成された日程の定員").toBe("64");
    expect.soft(row?.参加費, "作成された日程の参加費").toBe("3000");
    expect.soft(row?.公開状態, "作成された日程の公開状態").toBe("公開");
  });
});

caseTest("IT-M13-04-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-003〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  let row: ReturnType<typeof の日> = undefined;
  await step(5, async () => { row = の日(イベントの日程(id), "2026/09/10"); });
  await expected(async () => {
    expect.soft(row?.賞品日, "作成された日程の賞品（日）").toBe("M1304-003賞品");
    expect.soft(row?.賞品英, "作成された日程の賞品（英）").toBe("M1304-003 Prize");
  });
});

caseTest("IT-M13-04-004", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-004〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  let row: ReturnType<typeof の日> = undefined;
  await step(5, async () => { row = の日(イベントの日程(id), "2026/09/10"); });
  await expected(async () => {
    expect.soft(row?.登録者, "作成された日程の登録者（試験管理者の管理者ID）").toBe(管理者ID(M1304_ADMIN.loginId));
  });
});

caseTest("IT-M13-04-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-005〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/04", 期間To: "2026/09/11", 曜日: ["木曜日", "土曜日", "日曜日"], 開始時間: "10:00" }); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  let rows: Rows = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.開始時間?.slice(0, 10)), "作成された日程の開始日").toEqual(["2026/09/05", "2026/09/06", "2026/09/10"]);
    expect.soft(rows.map((x) => x.祝日), "作成された日程の休日状態（土曜・日曜・休日マスタ登録日の順）").toEqual([true, true, true]);
  });
});

caseTest("IT-M13-04-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-006〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する({ 受付あり: true, 受付時間: { 開始: "16:00", 終了: "18:00" } }); });
  await step(4, async () => { await r.入力する({ デッキ登録あり: true, デッキ登録締切: { 前日数: "2", 時刻: "23:59" } }); });
  await step(5, async () => { await r.入力する(オンライン7日前から1日前); });
  await step(6, async () => { await r.登録を押す(); });
  let row: ReturnType<typeof の日> = undefined;
  await step(7, async () => { row = の日(イベントの日程(id), "2026/09/10"); });
  await expected(async () => {
    expect.soft(row?.オンライン受付開始, "オンライン受付開始日時").toBe("2026/09/03 09:00");
    expect.soft(row?.オンライン受付終了, "オンライン受付終了日時").toBe("2026/09/09 23:00");
    expect.soft(row?.デッキ登録締切, "デッキ登録締切日時").toBe("2026/09/08 23:59");
  });
});

caseTest("IT-M13-04-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(notes.get("〔イベントID-M1304-007〕")); });
  await step(2, async () => { await expect(r.受付あり, "受付あり").toBeVisible(); });
  await step(3, async () => { await r.オンライン受付あり.check({ timeout: 30_000 }); });
  await expected(async () => {
    await expect.soft(r.受付あり, "受付あり（オン）").toBeChecked();
    await expect.soft(r.デッキ登録あり, "デッキ登録あり（オン）").toBeChecked();
    await expect.soft(r.受付開始, "受付開始時間").toHaveValue("00:00");
    await expect.soft(r.受付終了, "受付終了時間").toHaveValue("00:00");
    await expect.soft(r.デッキ登録前日数, "デッキ登録締切の開始日前日数").toHaveValue("0");
    await expect.soft(r.デッキ登録時刻, "デッキ登録締切の時刻").toHaveValue("23:59");
    await expect.soft(r.オンライン開始前日数, "オンライン受付開始の開始日前日数").toHaveValue("0");
    await expect.soft(r.オンライン終了前日数, "オンライン受付終了の開始日前日数").toHaveValue("0");
    await expect.soft(r.オンライン開始時刻, "オンライン受付開始の時刻").toHaveValue("00:00");
    await expect.soft(r.オンライン終了時刻, "オンライン受付終了の時刻").toHaveValue("00:00");
  });
});

caseTest("IT-M13-04-008", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(notes.get("〔イベントID-M1304-008〕")); });
  await step(2, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false, オンライン受付あり: true }); });
  await step(3, async () => { await expect(r.オンライン受付あり, "オンライン受付あり").toBeChecked(); });
  await expected(async () => {
    await expect.soft(r.受付開始, "受付開始時間（非表示）").toBeHidden();
    await expect.soft(r.受付終了, "受付終了時間（非表示）").toBeHidden();
    await expect.soft(r.デッキ登録前日数, "デッキ登録締切の開始日前日数（非表示）").toBeHidden();
    await expect.soft(r.デッキ登録時刻, "デッキ登録締切の時刻（非表示）").toBeHidden();
    await expect.soft(r.オンライン開始前日数, "オンライン受付開始の開始日前日数（表示）").toBeVisible();
    await expect.soft(r.オンライン開始時刻, "オンライン受付開始の時刻（表示）").toBeVisible();
    await expect.soft(r.オンライン終了前日数, "オンライン受付終了の開始日前日数（表示）").toBeVisible();
    await expect.soft(r.オンライン終了時刻, "オンライン受付終了の時刻（表示）").toBeVisible();
  });
});

caseTest("IT-M13-04-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-019〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false, オンライン受付あり: true }); });
  await step(4, async () => { await r.入力する(オンライン7日前から1日前); });
  await step(5, async () => { await r.登録を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示されている画面（繰返日程追加画面）").toBe(`/admin/event/${id}/repeatSchedule/create`);
  });
});

caseTest("IT-M13-04-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-020〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false, オンライン受付あり: true }); });
  await step(4, async () => { await r.入力する(オンライン7日前から1日前); });
  await step(5, async () => { await r.登録を押す(); });
  let rows: Rows = [];
  await step(6, async () => { rows = イベントの日程(id); });
  await expected(async () => { expect.soft(rows.length, "登録された日程の件数（0件のまま）").toBe(0); });
});

caseTest("IT-M13-04-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const a = notes.get("〔イベントID-M1304-021A〕"), b = notes.get("〔イベントID-M1304-021B〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(a); await r.入力する(木曜); });
  await step(2, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false }); await r.入力する(オンライン7日前から1日前); await r.登録を押す(); });
  await step(3, async () => { await r.開く(b); await r.入力する(木曜); });
  await step(4, async () => { await r.入力する(すべてオフ); await r.登録を押す(); });
  let rb: Rows = [], ra: Rows = [];
  await step(5, async () => { rb = イベントの日程(b); ra = イベントの日程(a); });
  await expected(async () => {
    expect.soft(ra.length, "参加費0でオンライン受付ありのイベントの日程の件数").toBe(1);
    expect.soft(rb.length, "参加費が有料でオンライン受付なしのイベントの日程の件数").toBe(1);
  });
});

caseTest("IT-M13-04-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-022〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（イベント編集画面）").toBe(`/admin/event/${id}/edit`);
  });
});

caseTest("IT-M13-04-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-023〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/01", 期間To: "2026/09/02", 曜日: ["金曜日"], 開始時間: "18:00" }); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  let rows: Rows = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => { expect.soft(rows.length, "登録された日程の件数（0件のまま）").toBe(0); });
});

caseTest("IT-M13-04-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-024〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/01", 期間To: "2026/09/02", 曜日: ["金曜日"], 開始時間: "18:00" }); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（イベント編集画面）").toBe(`/admin/event/${id}/edit`);
  });
});

caseTest("IT-M13-04-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-029〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.なりすまし対策トークンを書き換える("invalid-token"); await r.登録を押す(); });
  let rows: Rows = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => { expect.soft(rows.length, "登録された日程の件数（0件のまま）").toBe(0); });
});

caseTest("IT-M13-04-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-031〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.イベント編集リンク.click({ timeout: 30_000 }); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（イベント編集画面）").toBe(`/admin/event/${id}/edit`);
  });
});

caseTest("IT-M13-04-034", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-034〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  let v = "";
  await step(2, async () => { v = await r.ラベルの値("イベントID"); });
  await expected(async () => { expect.soft(v, "イベントIDのラベル").toBe(id); });
});

caseTest("IT-M13-04-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(notes.get("〔イベントID-M1304-035〕")); });
  let v = "";
  await step(2, async () => { v = await r.ラベルの値("イベント名（日）"); });
  await expected(async () => { expect.soft(v, "イベント名（日）のラベル").toBe(rc("M1304-035表示イベント")); });
});

caseTest("IT-M13-04-038", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-038〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/09", 期間To: "2026/09/11", 開始時間: "18:00" }); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  let sent = { sent: false, 止めた項目: [] as string[] };
  await step(4, async () => { sent = await r.登録を押す(); });
  await step(5, async () => { await expect(r.期間From, "画面の表示").toBeVisible(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示されている画面（繰返日程追加画面）").toBe(`/admin/event/${id}/repeatSchedule/create`);
    await expect.soft(r.期間From, "期間Fromの入力値（残っている）").toHaveValue("2026-09-09");
  });
  if (!sent.sent) note(`ブラウザの入力チェックが送信を止めた（止めた項目: ${sent.止めた項目.join(" / ")}）。画面が再表示されたのではなく、送信されないまま入力が残っている`);
});

caseTest("IT-M13-04-041", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-041〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/09", 期間To: "2026/09/11", 曜日: ["水曜日"], 開始時間: "18:00" }); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  let row: ReturnType<typeof の日> = undefined;
  await step(5, async () => { row = の日(イベントの日程(id), "2026/09/09"); });
  await expected(async () => {
    expect.soft(row !== undefined, "2026/09/09 の日程が登録されたか").toBe(true);
    expect.soft(row?.祝日 === true, "2026/09/09 の日程が休日として登録されたか").toBe(false);
  });
});

caseTest("IT-M13-04-042", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-042〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/09", 期間To: "2026/09/11", 曜日: ["木曜日"], 開始時間: "" }); });
  await step(3, async () => { await r.入力する({ 受付あり: true, オンライン受付あり: true, デッキ登録あり: false }); });
  await step(4, async () => { await r.入力する({ 受付時間: { 開始: "09:00", 終了: "17:00" } }); await r.入力する(オンライン7日前から1日前); });
  let sent = { sent: false, 止めた項目: [] as string[] };
  await step(5, async () => { sent = await r.登録を押す(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示されている画面（繰返日程追加画面）").toBe(`/admin/event/${id}/repeatSchedule/create`);
    await expect.soft(page.getByText("保存に失敗しました").first(), "管理画面上部の「保存に失敗しました」").toBeVisible();
    await expect.soft(page.getByText("オンライン受付ありかつ参加費が有料の場合は、イベント編集画面で支払方法を設定してください。"), "入力項目直下の支払方法の案内（表示されない）").toHaveCount(0);
  });
  if (!sent.sent) note(`開始時間が空なので、ブラウザの入力チェックが送信を止めた（止めた項目: ${sent.止めた項目.join(" / ")}）`);
});

caseTest("IT-M13-04-044", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-044〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する(木曜); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await r.登録を押す(); });
  let row: ReturnType<typeof の日> = undefined;
  await step(5, async () => { row = の日(イベントの日程(id), "2026/09/10"); });
  await expected(async () => { expect.soft(row?.公開状態, "作成された日程の公開状態").toBe("非公開"); });
});

caseTest("IT-M13-04-046", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-CB046〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/01", 期間To: "2026/09/02", 曜日: ["金曜日"], 開始時間: "18:00" }); });
  await step(3, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false }); await r.入力する(オンライン7日前から1日前); });
  await step(4, async () => { await r.登録を押す(); });
  await step(5, async () => { await expect(page.locator("body"), "表示された画面").toBeVisible(); });
  let rows: Rows = [];
  await step(6, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（イベント編集画面）").toBe(`/admin/event/${id}/edit`);
    expect.soft(rows.length, "日程の件数（0件のまま）").toBe(0);
  });
});

caseTest("IT-M13-04-047", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-CB047〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/09", 期間To: "2026/09/11", 曜日: ["水曜日"], 開始時間: "18:00" }); });
  await step(3, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false }); await r.入力する(オンライン7日前から1日前); });
  await step(4, async () => { await r.登録を押す(); });
  let row: ReturnType<typeof の日> = undefined;
  await step(5, async () => { row = の日(イベントの日程(id), "2026/09/09"); });
  await expected(async () => {
    expect.soft(row !== undefined, "2026/09/09 の日程が登録されたか").toBe(true);
    expect.soft(row?.祝日 === true, "2026/09/09 の日程が休日として登録されたか").toBe(false);
    expect.soft(row?.参加費, "作成された日程の参加費").toBe("0");
  });
});

caseTest("IT-M13-04-048", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-CB048〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/04", 期間To: "2026/09/08", 曜日: ["土曜日", "日曜日"], 開始時間: "10:00" }); });
  await step(3, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false }); await r.入力する(オンライン7日前から1日前); });
  await step(4, async () => { await r.登録を押す(); });
  let rows: Rows = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.開始時間?.slice(0, 10)), "作成された日程の開始日").toEqual(["2026/09/05", "2026/09/06"]);
    expect.soft(rows.map((x) => x.祝日), "作成された日程の休日状態").toEqual([true, true]);
    expect.soft(rows.map((x) => x.参加費), "作成された日程の参加費").toEqual(["0", "0"]);
  });
});

caseTest("IT-M13-04-049", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-CB049〕"); const r = new RepeatScheduleFormPage(page);
  await step(1, async () => { await r.開く(id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/04", 期間To: "2026/09/08", 曜日: ["土曜日", "日曜日"], 開始時間: "10:00" }); });
  await step(3, async () => { await r.入力する({ 受付あり: false, デッキ登録あり: false }); await r.入力する(オンライン7日前から1日前); });
  await step(4, async () => { await r.登録を押す(); });
  let rows: Rows = [];
  await step(5, async () => { rows = イベントの日程(id); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.開始時間?.slice(0, 10)), "作成された日程の開始日").toEqual(["2026/09/05", "2026/09/06"]);
    expect.soft(rows.map((x) => x.祝日), "作成された日程の休日状態").toEqual([true, true]);
    expect.soft(rows.map((x) => x.参加費), "作成された日程の参加費").toEqual(["3000", "3000"]);
    expect.soft(rows.map((x) => [x.オンライン受付開始, x.オンライン受付終了]), "作成された日程のオンライン受付の開始・終了").toEqual([
      ["2026/08/29 09:00", "2026/09/04 23:00"], ["2026/08/30 09:00", "2026/09/05 23:00"]]);
  });
});
