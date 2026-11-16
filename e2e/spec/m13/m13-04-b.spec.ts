/**
 * M13-04 繰返日程追加（追加分: 025・026・043 未登録のイベントID、039・040 QK連携の公開側、045 申込登録の検索）。正本: cases/M13-04_test_cases.tsv
 * シードは seeds/m13-04-b.ts（イベントID 999999 は DB で削除も確かめもしない。前例 M13-03-c）。
 *
 * 書いていないケースと理由:
 * - 027・028: 「店舗情報なし」のイベント（店舗の無いイベント）は、イベント登録画面の店舗の欄が必須の選択（空の選択肢が無い）で、画面から作れない。
 *   028 はそのうえ DB での日程の確かめ。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { openEventEdit } from "../../pages/admin/event";
import { RepeatScheduleFormPage, 繰返の入力 } from "../../pages/admin/m13_04_repeat";
import { EntrySearchPage } from "../../pages/admin/m13_11_entry_search";
import { EventSearchPage } from "../../pages/front/f07_02_event_search";
import { 検索結果のカード, 結果なしの文, イベントカード } from "../../pages/front/m13_13_event_cards";
import {
  大会詳細検索の検索を押す, カードを押して大会詳細を開く, 大会詳細の項目, 大会詳細の開催日時の値, 申込登録の検索を押す, 申込登録の結果を読む, 申込登録の結果のイベント,
} from "../../pages/front/m13_04_front";
import { 押して移るのを待つ } from "../../pages/front/nav_click";
import { M1304_ADMIN } from "../../seeds/m13-04";
import { M1304B名, M1304_RI_ADMIN, M1304連携店舗 } from "../../seeds/m13-04-b";
import { QK1302_ADMIN } from "../../seeds/m13-02-qk";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const すべてオフ: 繰返の入力 = { 受付あり: false, デッキ登録あり: false, オンライン受付あり: false };

/** イベント編集画面を開き、「繰返日程追加」を押して繰返日程追加画面へ移る */
async function 繰返日程追加画面を開く(page: Page, イベントID: string): Promise<RepeatScheduleFormPage> {
  const form = await openEventEdit(page, イベントID);
  await 押して移るのを待つ(page, form.繰返日程追加ボタン);
  const r = new RepeatScheduleFormPage(page);
  expect(new URL(page.url()).pathname, "繰返日程追加画面のアドレス").toMatch(new RegExp(`/event/${イベントID}/repeatSchedule/create$`));
  await expect(r.期間From, "繰返日程追加画面の期間Fromの欄").toBeVisible({ timeout: 30_000 });
  return r;
}

/** 登録ボタンを押して、移った先の応答を返す。ブラウザの入力チェックが送信を止めたら null（止めた項目を注記に残す） */
async function 登録を押して応答を読む(page: Page, r: RepeatScheduleFormPage): Promise<number | null> {
  const res = await 押して移るのを待つ(page, r.登録ボタン, { 移る時間: 30_000 }).catch(() => null);
  if (!res) {
    const 止めた = await page.locator("form#repeat_schedule_form :invalid").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).name)).catch(() => [] as string[]);
    note(`登録ボタンを押したが画面が移らなかった（ブラウザの入力チェックで止まった項目: ${止めた.join("、") || "なし"}）`);
    return null;
  }
  return res.status();
}

/** 開発者ツールで行うのと同じに、繰返日程追加のフォームの送信先のイベントIDを書き換える */
async function 送信先のイベントIDを書き換える(page: Page, イベントID: string): Promise<void> {
  await page.locator("form#repeat_schedule_form").evaluate((f, a) => { (f as HTMLFormElement).action = a; }, adminUrl(`/event/${イベントID}/repeatSchedule/create`));
  note(`フォームの送信先を ${adminUrl(`/event/${イベントID}/repeatSchedule/create`)} に書き換えた（開発者ツールの操作の代わりにスクリプトで書き換えた）`);
}

// ---- 未登録のイベントID（025・026・043） ----

caseTest("IT-M13-04-025", async ({ page, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const r = new RepeatScheduleFormPage(page);
  let status = 0;
  await step(1, async () => { status = (await page.goto(adminUrl("/event/999999/repeatSchedule/create"), { waitUntil: "load" }))?.status() ?? 0; });
  await expected(async () => {
    expect.soft(status, "未登録のイベントID（999999）の繰返日程追加画面の応答（HTTP 404）").toBe(404);
    await expect.soft(r.期間From, "繰返日程追加画面の入力欄が表示されない（エラーの画面）").toHaveCount(0);
  });
});

caseTest("IT-M13-04-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-026〕");
  let r!: RepeatScheduleFormPage;
  let status: number | null = null;
  await step(1, async () => { r = await 繰返日程追加画面を開く(page, id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/09", 期間To: "2026/09/11", 曜日: ["木曜日"], 開始時間: "18:00", ...すべてオフ }); });
  await step(3, async () => { await 送信先のイベントIDを書き換える(page, "999999"); });
  await step(4, async () => { status = await 登録を押して応答を読む(page, r); });
  await expected(async () => {
    expect.soft(status, "未登録のイベントID（999999）への登録の送信の応答（HTTP 404のエラー画面）").toBe(404);
    await expect.soft(r.期間From, "繰返日程追加画面の入力欄が表示されない（エラーの画面）").toHaveCount(0);
  });
});

caseTest("IT-M13-04-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_ADMIN);
  const id = notes.get("〔イベントID-M1304-043〕");
  let r!: RepeatScheduleFormPage;
  let status: number | null = null;
  await step(1, async () => { r = await 繰返日程追加画面を開く(page, id); });
  await step(2, async () => { await r.入力する({ 期間From: "2026/09/09", 期間To: "2026/09/11", 曜日: ["木曜日"], 開始時間: "" }); });
  await step(3, async () => { await r.入力する(すべてオフ); });
  await step(4, async () => { await 送信先のイベントIDを書き換える(page, "999999"); });
  await step(5, async () => { status = await 登録を押して応答を読む(page, r); });
  await expected(async () => {
    expect.soft(status, "未登録のイベントID（999999）への登録の送信の応答（HTTP 404のエラー画面）").toBe(404);
    await expect.soft(r.期間From, "繰返日程追加画面の入力欄が表示されない（エラーの画面）").toHaveCount(0);
  });
});

// ---- QK連携: 公開側の大会詳細検索（039・040） ----

/** 大会詳細検索画面の詳細検索モーダルを開き、キーワードを入れて「検索」を押す */
async function キーワードで検索する(page: Page, 語: string): Promise<void> {
  const s = new EventSearchPage(page);
  expect(await s.open(), "大会詳細検索画面の応答").toBeLessThan(400);
  await s.モーダルを開く();
  await s.条件を入れる({ キーワード: 語 });
  const res = await 大会詳細検索の検索を押す(s);
  note(`大会詳細検索（キーワード「${語}」）の結果の画面の応答: ${res?.status() ?? "なし"}`);
}

async function QK管理者でログインする(page: Page): Promise<void> {
  note(`パスワードはシード表の「Passw0rd-QK」を管理画面が拒む（12文字以上）ので、共有シードで代えた「${QK1302_ADMIN.password}」でログインした（ケースはパスワードの値を確かめない）`);
  await loginAdmin(page, QK1302_ADMIN);
}

caseTest("IT-M13-04-039", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1304-QK001〕");
  const 名 = M1304B名.QK001;
  let 手順1の文 = "", 手順1のカード = -1;
  let 手順5のカード: イベントカード[] = [];
  let 総件数 = "";
  let r!: RepeatScheduleFormPage;
  await step(1, async () => {
    await キーワードで検索する(page, 名);
    手順1の文 = await 結果なしの文(page);
    手順1のカード = (await 検索結果のカード(page)).length;
  });
  await step(2, async () => { await QK管理者でログインする(page); });
  await step(3, async () => { r = await 繰返日程追加画面を開く(page, id); });
  await step(4, async () => {
    await r.入力する({ 期間From: "2030-10-14", 期間To: "2030-10-31", 曜日: ["火曜日"], 開始時間: "10:00", 受付あり: false, デッキ登録あり: false, オンライン受付あり: false });
    const status = await 登録を押して応答を読む(page, r);
    expect(status, "繰返日程追加の登録の応答").not.toBeNull();
  });
  await step(5, async () => {
    await キーワードで検索する(page, 名);
    手順5のカード = await 検索結果のカード(page);
    総件数 = await new EventSearchPage(page).総件数の文字();
    note(`手順5の検索結果総件数の表示: 「${総件数}」`);
  });
  await expected(async () => {
    expect.soft(手順1の文, "手順1の検索結果の文").toContain("条件に合うイベントが見つかりませんでした");
    expect.soft(手順1のカード, "手順1の検索結果に出た日程の数").toBe(0);
    expect.soft(手順5のカード.map((c) => c.イベント名), "手順5の検索結果の日程のイベント名（3件）").toEqual([名, 名, 名]);
    expect.soft(手順5のカード.map((c) => c.開催日時の値), "手順5の検索結果の日程の開催日時（機械向けの値・開催日の昇順）").toEqual(["2030-10-15T10:00", "2030-10-22T10:00", "2030-10-29T10:00"]);
    for (const [i, d] of ["2030年10月15日 10時", "2030年10月22日 10時", "2030年10月29日 10時"].entries()) {
      expect.soft(手順5のカード[i]?.開催日時の表示 ?? "", `手順5の検索結果の${i + 1}件目の開催日時（表示）`).toContain(d);
    }
    expect.soft(総件数.replace(/[^\d]/g, ""), "手順5の検索結果総件数の数（3件。「件」は単位で別の文字）").toBe("3");
  });
});

caseTest("IT-M13-04-040", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔イベントID-M1304-QK002〕");
  const 名 = M1304B名.QK002;
  let 手順1の文 = "", 手順1のカード = -1;
  let 手順5のカード: イベントカード[] = [];
  let r!: RepeatScheduleFormPage;
  const 詳細 = { 開催日時: "", 開催日時の値: "", 定員: "", 参加費: "" };
  await step(1, async () => {
    await キーワードで検索する(page, 名);
    手順1の文 = await 結果なしの文(page);
    手順1のカード = (await 検索結果のカード(page)).length;
  });
  await step(2, async () => { await QK管理者でログインする(page); });
  await step(3, async () => { r = await 繰返日程追加画面を開く(page, id); });
  await step(4, async () => {
    await r.入力する({ 期間From: "2030-10-14", 期間To: "2030-10-20", 曜日: ["火曜日"], 開始時間: "10:00", 受付あり: false, デッキ登録あり: false, オンライン受付あり: false });
    const status = await 登録を押して応答を読む(page, r);
    expect(status, "繰返日程追加の登録の応答").not.toBeNull();
  });
  await step(5, async () => {
    await キーワードで検索する(page, 名);
    手順5のカード = await 検索結果のカード(page);
  });
  await step(6, async () => {
    note("検索結果の日程のカード（全体が大会詳細画面へのリンク。イベント基本情報の部分を含む）を押して、大会詳細画面を開いた");
    const res = await カードを押して大会詳細を開く(page, 名);
    expect(res?.status() ?? 0, "大会詳細画面の応答").toBeLessThan(400);
    詳細.開催日時 = await 大会詳細の項目(page, "開催日時");
    詳細.開催日時の値 = await 大会詳細の開催日時の値(page);
    詳細.定員 = await 大会詳細の項目(page, "定員");
    詳細.参加費 = await 大会詳細の項目(page, "参加費");
    note(`大会詳細画面の表示: 開催日時「${詳細.開催日時}」（機械向けの値 ${詳細.開催日時の値}）・定員「${詳細.定員}」・参加費「${詳細.参加費}」`);
  });
  await expected(async () => {
    expect.soft(手順1の文, "手順1の検索結果の文").toContain("条件に合うイベントが見つかりませんでした");
    expect.soft(手順1のカード, "手順1の検索結果に出た日程の数").toBe(0);
    expect.soft(手順5のカード.map((c) => c.イベント名), "手順5の検索結果の日程のイベント名").toEqual([名]);
    expect.soft(手順5のカード[0]?.開催日時の値 ?? "", "手順5の日程の開催日時（機械向けの値）").toBe("2030-10-15T10:00");
    expect.soft(手順5のカード[0]?.開催日時の表示 ?? "", "手順5の日程の開催日時（表示）").toContain("2030年10月15日 10時");
    expect.soft(詳細.開催日時, "手順6の大会詳細画面の開催日時").toBe("2030年10月15日 10時00分");
    expect.soft(詳細.定員, "手順6の大会詳細画面の定員（親イベントと同じ）").toBe("24人");
    expect.soft(詳細.参加費, "手順6の大会詳細画面の参加費（親イベントと同じ）").toBe("800円");
  });
});

// ---- 連携: イベント申込登録(検索入力)（045） ----

caseTest("IT-M13-04-045", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1304_RI_ADMIN);
  const id = notes.get("〔イベントID-M1304-RI001〕");
  const 名 = M1304B名.RI001;
  const s = new EntrySearchPage(page);
  let 登録前: 申込登録の結果のイベント[] = [];
  let 登録後: 申込登録の結果のイベント[] = [];
  const 検索 = async () => {
    await s.店舗を選ぶ([M1304連携店舗]);
    await s.日付を入れる(s.開催日From, "");
    await s.日付を入れる(s.開催日To, "");
    await s.検索イベント名.fill(名);
    await 申込登録の検索を押す(page);
  };
  const 日程の日時 = (rows: 申込登録の結果のイベント[]) => rows.flatMap((x) => x.日程の開始時間).filter((t) => /^\d{4}\/\d\d\/\d\d \d\d:\d\d$/.test(t));
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    await 検索();
    登録前 = await 申込登録の結果を読む(page);
    note(`登録前の結果表: ${JSON.stringify(登録前)}`);
    expect(日程の日時(登録前), "登録前の一覧に日程が表示されない").toEqual([]);
  });
  let r!: RepeatScheduleFormPage;
  await step(3, async () => {
    note("イベント編集画面は、イベント一覧の行の編集を押す代わりに、イベント編集画面のアドレスを開いた");
    r = await 繰返日程追加画面を開く(page, id);
  });
  await step(4, async () => {
    await r.入力する({
      期間From: "2026-11-02", 期間To: "2026-11-11", 曜日: ["月曜日", "水曜日"], 開始時間: "10:00",
      受付あり: true, 受付時間: { 開始: "09:00", 終了: "09:30" }, デッキ登録あり: false,
      オンライン受付あり: true, オンライン受付: { 開始前日数: "7", 開始時刻: "00:00", 終了前日数: "1", 終了時刻: "00:00" },
    });
    const status = await 登録を押して応答を読む(page, r);
    expect(status, "繰返日程追加の登録の応答").not.toBeNull();
  });
  await step(5, async () => {
    await s.開く();
    await 検索();
    登録後 = await 申込登録の結果を読む(page);
    note(`登録後の結果表: ${JSON.stringify(登録後)}`);
  });
  await expected(async () => {
    expect.soft(登録後.map((x) => x.イベントID), "一覧のイベントの行（イベントID 〔イベントID-M1304-RI001〕の1行にまとめて表示）").toEqual([id]);
    await expect.soft(page.locator("table.table tbody td[rowspan]", { hasText: 名 }), `イベント名「${名}」の欄`).toHaveCount(1);
    // 正本は4日程が1行にまとめて表示されることだけを求める（並び順は求めない）。並びを問わず日程の集合で比べる
    expect.soft([...日程の日時(登録後)].sort(), "まとめた行の日程の開始時間（4日程。並びは問わない）").toEqual(["2026/11/02 10:00", "2026/11/04 10:00", "2026/11/09 10:00", "2026/11/11 10:00"]);
  });
});
