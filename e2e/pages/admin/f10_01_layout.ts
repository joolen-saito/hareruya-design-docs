/**
 * F10-01 会員IDの連携のシードとケースが使う、管理画面の操作。セレクタはここだけに書く。
 * - レイアウト管理(編集)の「<head></head>タグ内」（先頭部）へ、未使用ブロックを置く。ドラッグではなく、ブロックの右端のメニュー
 *   「セクションに移動」→ 移動先の選択 →「移動」で置く（画面: admin/Content/layout.twig。置いた順に末尾へ並ぶ）。
 * - ブロック管理(一覧)の行を、ブロック名で引く（一覧の部品は pages/admin/m09_07_block.ts）。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** 先頭部（<head></head>タグ内）の配置の番号。未使用は 0 */
const 先頭部 = "1";
const 未使用 = "0";

function 置き場のブロック(page: Page, 置き場: string, 名前?: string): Locator {
  const l = page.locator(`#position_${置き場} > [id^="detail_box__layout_item--"]`);
  return 名前 === undefined ? l : l.filter({ has: page.locator(".view_readme", { hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }) });
}

/** レイアウト管理(編集)画面を開く */
export async function レイアウト編集を開く(page: Page, レイアウトID: string): Promise<void> {
  await page.goto(adminUrl(`/content/layout/${レイアウトID}/edit`), { waitUntil: "load", timeout: 60_000 });
  await expect(page.locator(`#position_${先頭部}`), "レイアウト管理(編集)画面の先頭部の欄").toBeVisible({ timeout: T });
}

/** 先頭部に置いてあるブロックの名前（上から順） */
export async function 先頭部のブロック名(page: Page): Promise<string[]> {
  return (await 置き場のブロック(page, 先頭部).locator(".view_readme").allInnerTexts()).map((t) => t.trim());
}

/**
 * レイアウト管理(編集)画面で、未使用ブロックの中から名前のブロックを順に先頭部へ移し（置いた順に並ぶ）、「登録」を押す。
 * 登録後に画面を開き直し、先頭部の並びが指定どおりかを確かめる。
 */
export async function 先頭部へブロックを置く(page: Page, レイアウトID: string, ブロック名: string[], what: string): Promise<void> {
  await レイアウト編集を開く(page, レイアウトID);
  for (const name of ブロック名) {
    const item = 置き場のブロック(page, 未使用, name);
    await expect(item, `${what}: 未使用ブロックに「${name}」が1件ある`).toHaveCount(1, { timeout: T });
    await item.scrollIntoViewIfNeeded();
    await item.locator(".block-context-menu").click({ timeout: T });
    const menu = page.locator(".popover .context-movesection").filter({ visible: true }).first();
    await expect(menu, `${what}: 「${name}」のメニューの「セクションに移動」`).toBeVisible({ timeout: T });
    await menu.click({ timeout: T });
    const modal = page.locator("#clickStreamConfirm");
    await expect(modal, `${what}: セクションの移動の確認`).toBeVisible({ timeout: T });
    await modal.locator("#move-section").selectOption(先頭部, { timeout: T });
    await modal.locator("#move-to-section").click({ timeout: T });
    await expect(modal, `${what}: セクションの移動の確認が閉じる`).toBeHidden({ timeout: T });
    await expect(置き場のブロック(page, 先頭部, name), `${what}: 「${name}」が先頭部へ移った`).toHaveCount(1, { timeout: T });
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }),
    page.locator("#form1 button[type=submit]").filter({ hasText: "登録" }).click({ timeout: T }),
  ]);
  await page.waitForLoadState("load");
  await expect(page.locator(".alert-success"), `${what}: レイアウトの登録結果`).toBeVisible({ timeout: 60_000 });
  await レイアウト編集を開く(page, レイアウトID);
  const now = await 先頭部のブロック名(page);
  if (JSON.stringify(now) !== JSON.stringify(ブロック名)) throw new Error(`${what}: 登録後の先頭部の並びが「${now.join("、")}」（求めるのは「${ブロック名.join("、")}」）`);
}

// ---- ブロック管理(一覧) ----

/** ブロック管理(一覧)の、名前の欄（行の左端）がその名前の、見えている行 */
export function 名前の行(page: Page, 名前: string): Locator {
  return page.locator("li.list-group-item[id^='ex-block-']:visible").filter({
    has: page.locator(":scope > .row > div:first-child", { hasText: new RegExp(`^\\s*${esc(名前)}\\s*$`) }),
  });
}
/** 行の名前の欄が、編集画面へのリンクでなく文字（ラベル）だけか */
export async function 名前がラベルか(行: Locator): Promise<boolean> {
  return (await 行.locator(":scope > .row > div:first-child a").count()) === 0;
}
/** 行の編集リンク（鉛筆のボタンと、名前のリンク） */
export function 編集リンク(行: Locator): Locator { return 行.locator("a[href*='/content/block/'][href*='/edit']"); }
/** 行の削除ボタン */
export function 削除ボタン(行: Locator): Locator { return 行.locator("a[data-bs-target^='#confirmModal-']"); }
