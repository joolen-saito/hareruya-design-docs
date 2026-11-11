/**
 * M05-19 出荷指示リスト検索（続き）。正本: cases/M05-19_test_cases.tsv
 * このファイル: 004・005・011・012・014・025・026・027・028・029・031・032・033（13件）。013・016・024 は m05-19.spec.ts。
 * 実装しない: 001・020（表示件数マスタ・既定値を共有の設定として書き換えて戻す作りと、11件・12件の出荷指示リスト＝大量のデータを残す作りのため。判断待ち）。
 * シードは seeds/m05-19.ts（画面で作り、画面で指定できない日時・注文区分だけ印つきのデータに限って DB で設定する）。
 */
import { test } from "@playwright/test";
import { 出荷指示リストの件数 } from "../../db/m05_20";
import { リスト入り受注の件数, 同じ注文番号のほかのリスト入り受注の件数 } from "../../db/m05_19";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { StandbySearchPage } from "../../pages/admin/m05_19_standby_search";
import { M0519_ADMIN } from "../../seeds/m05-19";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const BASE = (k: string) => `〔${k}〕`;
const DATE_NOTE = "日付の欄は日時の入力欄（年-月-日 時:分）なので、日付だけの指定は、その日の0時0分として入力した（時刻の入力は手順に無い）";

/** 画面の日時の文字から、年月日と時刻（あれば）を読む */
function 日時を読む(text: string): { 年月日: string; 時刻: string | null } {
  const d = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(text);
  const t = /(\d{1,2}):(\d{2})/.exec(text);
  return { 年月日: d ? `${d[1]}-${d[2].padStart(2, "0")}-${d[3].padStart(2, "0")}` : "", 時刻: t ? `${t[1].padStart(2, "0")}:${t[2]}` : null };
}

caseTest("IT-M05-19-004", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const A = notes.get(BASE("出荷指示番号-M0519-共有-基本A"));
  const 注文A1 = notes.get(BASE("注文番号-M0519-共有-基本A1"));
  const 他 = 同じ注文番号のほかのリスト入り受注の件数(注文A1, [notes.get(BASE("受注ID-M0519-共有-基本A1"))]);
  if (他 > 0) throw new Error(`前提: 注文番号 ${注文A1} の受注がほかにも出荷指示リストに入っている（${他}件）。ほかの人の受注は消さずに止めた`);
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let ids: string[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.注文番号を入れる(注文A1); await s.検索する(); ids = await s.一覧の出荷指示番号(); });
  await expected(async () => {
    expect.soft(ids, `注文番号 ${注文A1} を含む出荷指示番号 ${A} だけが一覧に表示される`).toEqual([A]);
  });
});

caseTest("IT-M05-19-005", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const 注文A1 = notes.get(BASE("注文番号-M0519-共有-基本A1"));
  const 一部 = 注文A1.slice(0, -1);
  if (リスト入り受注の件数(一部) > 0) throw new Error(`前提: 注文番号 ${一部} の受注が出荷指示リストに入っている。ほかの人の受注は消さずに止めた`);
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.注文番号を入れる(一部); await s.検索する(); });
  await expected(async () => {
    const r = await s.結果まわりの表示();
    expect.soft(r.件数見出し, "検索結果の件数見出しが表示されない").toBe(0);
    expect.soft(r.一覧, "一覧が表示されない").toBe(0);
    expect.soft(r.表示件数, "表示件数の選択が表示されない").toBe(0);
    expect.soft(r.ページング, "ページングが表示されない").toBe(0);
    expect.soft(r.結果なしの案内, "検索結果がない旨の案内が表示される").toBeGreaterThan(0);
  });
  note(`注文番号の一部として、${注文A1} の末尾1桁を除いた ${一部} を入力した`);
});

caseTest("IT-M05-19-011", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const A = notes.get(BASE("出荷指示番号-M0519-共有-基本A"));
  const 注文A1 = notes.get(BASE("注文番号-M0519-共有-基本A1"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let ids: string[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    await s.出荷指示番号を入れる(A); await s.注文番号を入れる(注文A1);
    await s.登録日を入れる("2026/08/20"); await s.更新日を入れる("2026/08/21");
    note(`${DATE_NOTE}。入力欄の型: ${await s.日付の欄の型()}`);
  });
  await step(3, async () => { await s.注文区分を選ぶ(["通常"]); await s.検索する(); ids = await s.一覧の出荷指示番号(); });
  await expected(async () => {
    expect.soft(ids, `入力したすべての条件に合致する出荷指示番号 ${A} だけが一覧に表示される`).toEqual([A]);
  });
});

caseTest("IT-M05-19-012", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const A = notes.get(BASE("出荷指示番号-M0519-共有-基本A"));
  const 注文B = notes.get(BASE("注文番号-M0519-共有-基本B"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.出荷指示番号を入れる(A); await s.注文番号を入れる(注文B); await s.検索する(); });
  await expected(async () => {
    const r = await s.結果まわりの表示();
    expect.soft(r.一覧, `出荷指示番号 ${A} は注文番号 ${注文B} の受注を含まないので、検索結果の一覧が表示されない`).toBe(0);
    expect.soft(await s.一覧の出荷指示番号(), "一覧に出荷指示番号の行が無い").toEqual([]);
  });
});

caseTest("IT-M05-19-014", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const A = notes.get(BASE("出荷指示番号-M0519-共有-基本A"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let 件数: number | null = null;
  let 行: Awaited<ReturnType<StandbySearchPage["行の内容"]>> = null;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.出荷指示番号を入れる(A); await s.検索する(); });
  await step(3, async () => { 件数 = await s.件数見出しの件数(); 行 = await s.行の内容(A); });
  await expected(async () => {
    expect.soft(件数, "検索結果が1件").toBe(1);
    expect.soft(行?.区分, `出荷指示番号 ${A} の行の区分が「通常」`).toBe("通常");
    expect.soft(行?.注文件数, "注文件数が2").toBe("2");
    const c = 日時を読む(行?.登録日 ?? ""), u = 日時を読む(行?.最終更新日 ?? "");
    expect.soft(c.年月日, `登録日の日付が 2026年8月20日（画面の表示: ${行?.登録日 ?? "行なし"}）`).toBe("2026-08-20");
    expect.soft(c.時刻, `登録日の時刻が 10:00（画面の表示: ${行?.登録日 ?? "行なし"}）`).toBe("10:00");
    expect.soft(u.年月日, `最終更新日の日付が 2026年8月21日（画面の表示: ${行?.最終更新日 ?? "行なし"}）`).toBe("2026-08-21");
    expect.soft(u.時刻, `最終更新日の時刻が 11:00（画面の表示: ${行?.最終更新日 ?? "行なし"}）`).toBe("11:00");
  });
  note("日時の表示の比べ方: 画面の表記（年月日の区切り）に依らず、年月日と時刻（時:分）を読んで比べた");
});

/** 一覧を検索して、その出荷指示番号の行のポップアップメニューを開くところまで */
async function 検索して開く(s: StandbySearchPage, id: string): Promise<void> {
  await s.出荷指示番号を入れる(id);
  await s.検索する();
}

caseTest("IT-M05-19-025", async ({ page, notes, step, expected, capture }) => {
  page.setDefaultTimeout(60_000);
  const A = notes.get(BASE("出荷指示番号-M0519-共有-基本A"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, A); });
  await step(3, async () => { await s.メニューボタン(A).click(); await page.waitForTimeout(500); await capture("ポップアップメニュー"); });
  await expected(async () => {
    expect.soft(await s.メニューの操作(A, "編集").isVisible(), `出荷指示番号 ${A} のポップアップメニューに「編集」が表示される`).toBe(true);
    expect.soft(await s.メニューの操作(A, "削除").isVisible(), `出荷指示番号 ${A} のポップアップメニューに「削除」が表示される`).toBe(true);
  });
});

caseTest("IT-M05-19-026", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const A = notes.get(BASE("出荷指示番号-M0519-共有-基本A"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, A); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), s.番号のリンク(A).click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(page.url(), `出荷指示番号 ${A} の編集画面へ遷移する`).toMatch(new RegExp(`/standby/${A}/edit`));
    expect.soft(((await page.locator("#number_info_box__standby_id").innerText().catch(() => "")).replace(/\s+/g, "")), "編集画面に出荷指示番号が表示される").toContain(A);
  });
});

caseTest("IT-M05-19-027", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const A = notes.get(BASE("出荷指示番号-M0519-共有-基本A"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, A); });
  await step(3, async () => {
    await s.メニューボタン(A).click();
    await expect(s.メニューの操作(A, "編集"), "ポップアップメニューの「編集」").toBeVisible({ timeout: 10_000 });
  });
  await step(4, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), s.メニューの操作(A, "編集").click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(page.url(), `出荷指示番号 ${A} の編集画面へ遷移する`).toMatch(new RegExp(`/standby/${A}/edit`));
    expect.soft(((await page.locator("#number_info_box__standby_id").innerText().catch(() => "")).replace(/\s+/g, "")), "編集画面に出荷指示番号が表示される").toContain(A);
  });
});

caseTest("IT-M05-19-028", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get(BASE("出荷指示番号-M0519-028"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  s.ダイアログを見張る();
  let 確認 = { 確認の文: null as string | null };
  let 件数 = -1;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, id); });
  await step(3, async () => {
    await s.メニューボタン(id).click();
    await expect(s.メニューの操作(id, "削除"), "ポップアップメニューの「削除」").toBeVisible({ timeout: 10_000 });
    確認 = await s.削除を押す(id);
  });
  await step(4, async () => { expect(確認.確認の文 !== null, "削除の確認ダイアログが表示される").toBe(true); await s.確認でOKを押す(); });
  await step(5, async () => { 件数 = 出荷指示リストの件数(id); });
  await expected(async () => {
    expect.soft(件数, `出荷指示番号 ${id} の出荷指示データがDBで確認できない（登録されている件数）`).toBe(0);
  });
});

caseTest("IT-M05-19-029", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get(BASE("出荷指示番号-M0519-029"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  s.ダイアログを見張る();
  let 確認 = { 確認の文: null as string | null };
  let ok = false;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, id); });
  await step(3, async () => {
    await s.メニューボタン(id).click();
    await expect(s.メニューの操作(id, "削除"), "ポップアップメニューの「削除」").toBeVisible({ timeout: 10_000 });
    確認 = await s.削除を押す(id);
  });
  await step(4, async () => { expect(確認.確認の文 !== null, "削除の確認ダイアログが表示される").toBe(true); ok = await s.確認でOKを押す(); });
  await expected(async () => {
    const m = await s.成功のメッセージ();
    expect.soft(ok, "確認ダイアログでOKを押せた").toBe(true);
    expect.soft(m.some((t) => t.includes("削除しました")), `出荷指示番号 ${id} の削除完了メッセージ「削除しました」が表示される（画面の成功の表示: ${m.join(" / ") || "なし"}）`).toBe(true);
  });
  note("削除完了メッセージは、番号を含まない「削除しました」。削除した番号は、確認ダイアログの前に検索して選んだ行");
});

caseTest("IT-M05-19-031", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get(BASE("出荷指示番号-M0519-031"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let 行: Awaited<ReturnType<StandbySearchPage["行の内容"]>> = null;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, id); });
  await step(3, async () => { 行 = await s.行の内容(id); });
  await expected(async () => {
    expect.soft(行?.注文件数, `出荷指示番号 ${id} の行の注文件数に1が表示される`).toBe("1");
  });
});

caseTest("IT-M05-19-032", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get(BASE("出荷指示番号-M0519-032"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let 行: Awaited<ReturnType<StandbySearchPage["行の内容"]>> = null;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, id); });
  await step(3, async () => { 行 = await s.行の内容(id); });
  await expected(async () => {
    expect.soft(行?.区分, `出荷指示番号 ${id} の行の区分に「予約」が表示される`).toBe("予約");
  });
});

caseTest("IT-M05-19-033", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  const id = notes.get(BASE("出荷指示番号-M0519-033"));
  await loginAdmin(page, M0519_ADMIN);
  const s = new StandbySearchPage(page);
  let 行: Awaited<ReturnType<StandbySearchPage["行の内容"]>> = null;
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索して開く(s, id); });
  await step(3, async () => { 行 = await s.行の内容(id); });
  await expected(async () => {
    expect.soft(行?.区分, `出荷指示番号 ${id} の行の区分に「大量」が表示される`).toBe("大量");
  });
});
