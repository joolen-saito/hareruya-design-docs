/** イベント申込登録（メニュー「イベント管理」→「イベント申込登録」）と、イベント申込詳細・編集 */
import { Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

/** 日程の行の「新規登録」から開く申込の登録画面で、プレイヤーを検索して選ぶ */
async function choosePlayer(page: Page, 会員の名前: string): Promise<void> {
  await page.locator("button.player_selector.search").first().click();
  const modal = page.locator("#searchPlayerModal");
  await expect(modal).toBeVisible();
  await modal.locator('[name="admin_event_entry_detail[search]"]').fill(会員の名前);
  await modal.locator("#searchPlayerModalButton").click();
  // 検索中は「検索...」とだけ出る。結果の表か「見つからない」の文が出るまで待つ
  const 決定 = modal.locator(".js-entry-player-select");
  await expect(modal.locator("table.search-player-modal-table, p.text-center:not(:has-text('...'))").first(), "プレイヤー検索の結果が出ない").toBeVisible({ timeout: 30_000 });
  if ((await 決定.count()) === 0) {
    throw new Error(`プレイヤー検索で、この日程にまだ申込していない会員「${会員の名前}」が見つからない: ${(await modal.locator(".modal-body").innerText()).replace(/\s+/g, " ").slice(0, 200)}`);
  }
  await 決定.first().click();
  await expect(modal).toBeHidden();
}

/** 登録後に遷移したイベント申込詳細・編集画面のアドレスと、画面の「申込ID」から申込IDを読む */
async function readEntryId(page: Page): Promise<string> {
  const m = /\/event\/entry\/(\d+)|\/entry\/(\d+)\/edit|event_entry\/(\d+)/.exec(page.url());
  const text = (await page.locator("form").first().innerText()).replace(/\s+/g, " ");
  const shown = /申込ID\s*(\d+)/.exec(text)?.[1];
  if (!shown) throw new Error(`イベント申込詳細・編集画面に「申込ID」が表示されない（${page.url()}）`);
  const inUrl = m?.[1] ?? m?.[2] ?? m?.[3];
  if (inUrl && inUrl !== shown) throw new Error(`画面の申込ID ${shown} が、アドレスの番号 ${inUrl} と違う`);
  return shown;
}

/**
 * イベント申込登録でイベント名を検索し、開催日の行の「新規登録」から、会員ごとに申込を登録する。申込IDを登録した順に返す。
 * 2件目からは「同日程の新規申込へ」を押して続ける。申込状況・支払方法は初期表示のままにする。
 * 日程IDは、その日程を登録したときに控えた番号。
 * 会員の名前には、その日程にまだ申込していない、会員登録済みの会員の名前を渡す。
 */
export async function registerEntries(page: Page, イベント名: string, 日程ID: string, 開催日: string, 会員の名前: string[]): Promise<string[]> {
  await page.goto(adminUrl("/entry_registration"));
  await page.locator('#search_form [name="admin_search_event[multi]"]').fill(イベント名);
  // 開催日の開始日は初期表示で今日。それより前の日程は出ないので、日程の開催日以前であることを確かめる
  const from = await page.locator('#search_form [name="admin_search_event[start_date_from]"]').inputValue();
  if (from && from > 開催日.slice(0, 10)) throw new Error(`イベント申込登録の検索条件「開催日」の開始日 ${from} が、日程の開催日 ${開催日} より後`);
  await page.locator("#search_form").getByRole("button", { name: "検索", exact: true }).click();
  await page.waitForLoadState("load");
  // 繰り返し流した環境には同じイベント名・同じ開催日の行が複数ある。いま登録した日程の行を、「新規登録」の行き先の日程IDで選ぶ
  const row = page.locator("table tbody tr").filter({ hasText: イベント名 }).filter({ hasText: 開催日.replace(/-/g, "/") })
    .filter({ has: page.locator(`a[href$="/entry_registration/new/${日程ID}"]`) });
  if ((await row.count()) !== 1) throw new Error(`イベント申込登録の検索結果に、「${イベント名}」の日程「${開催日}」（日程ID ${日程ID}）の行が ${await row.count()} 件ある（1件のはず）`);
  await row.getByRole("link", { name: "新規登録" }).click();
  const ids: string[] = [];
  for (const [i, 名前] of 会員の名前.entries()) {
    if (i > 0) await page.getByRole("link", { name: "同日程の新規申込へ" }).click();
    await page.waitForLoadState("load");
    await choosePlayer(page, 名前);
    await expect(page.locator("#submit_entry"), "プレイヤーを選ぶと登録を押せる").toBeEnabled();
    await page.locator("#submit_entry").click();
    await expectSaved(page, `イベント申込（${イベント名}・${名前}）の登録`);
    ids.push(await readEntryId(page));
  }
  return ids;
}
