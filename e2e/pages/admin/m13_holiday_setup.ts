/**
 * M13（イベント管理）のシードが使う、祝日管理での試験用の祝日の準備。
 * 手元の祝日（本来の祝日）は消さない・書き換えない。同じ日付に試験用（名称が「M13-0」で始まる）の行があれば、前の実行が足したものとして消して足し直す。
 */
import { Page } from "@playwright/test";
import { HolidayPage } from "./m16_03_holiday";

/** 日付（2026/09/10 の形）に試験用の祝日を足し、休日IDを返す。試験用でない祝日がその日付にあれば止める */
export async function 試験用の祝日を足す(page: Page, 日付: string, 名称: string, onIssue: (m: string) => void): Promise<string> {
  const h = new HolidayPage(page);
  await h.open();
  const rowsOf = () => page.locator("table tbody tr").filter({ hasText: 日付 });
  let n = await rowsOf().count();
  for (let i = 0; i < n; i++) {
    const text = (await rowsOf().nth(i).innerText()).replace(/\s+/g, " ");
    if (!/M13-?0\d/.test(text)) throw new Error(`祝日一覧の ${日付} に試験用でない祝日がある（${text}）。手元の祝日なので消さずに止める`);
  }
  if (n > 0) onIssue(`前の実行が足した試験用の祝日 ${n} 件が ${日付} にあった。シード表の「あれば削除」にしたがい、消してから足し直す`);
  while (n > 0) {
    page.once("dialog", (d) => d.accept());
    await Promise.all([page.waitForLoadState("load"), rowsOf().first().locator("a", { hasText: "削除" }).click({ timeout: 30_000 })]);
    await h.open();
    const left = await rowsOf().count();
    if (left >= n) throw new Error(`祝日 ${日付} の試験用の行を削除できない`);
    n = left;
  }
  await h.新規登録を押す();
  await h.名称欄.fill(名称);
  await h.日付欄.fill(日付.replace(/\//g, "-"));
  await Promise.all([page.waitForLoadState("load"), h.追加ボタン.click({ timeout: 30_000 })]);
  await h.open();
  const mine = page.locator("table tbody tr").filter({ hasText: 名称 });
  if ((await mine.count()) !== 1) throw new Error(`試験用の祝日「${名称}」を足せていない`);
  const href = (await mine.locator("a", { hasText: "削除" }).first().getAttribute("href")) ?? "";
  return /(\d+)(?:\D*)$/.exec(href)?.[1] ?? "";
}

/** 日付に祝日が1件も無いこと（あれば止める。手元の祝日を消さない） */
export async function 祝日が無いことを確かめる(page: Page, 日付: string): Promise<void> {
  const h = new HolidayPage(page);
  await h.open();
  const n = await page.locator("table tbody tr").filter({ hasText: 日付 }).count();
  if (n > 0) throw new Error(`祝日一覧に ${日付} の行がある。手元の祝日を消す・書き換えることになるので止める`);
}
