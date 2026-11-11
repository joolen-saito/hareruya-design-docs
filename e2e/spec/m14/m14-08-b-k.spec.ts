// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/** M14-08 カードセット詳細(登録・編集・削除) の続き（編集・削除・収録カード・画像・一覧への戻り・連携）。正本: cases/M14-08_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { カードセットの値, 名称のカードセット件数 } from "../../db/m14_08_cardset";
import { カードセットの件数 } from "../../db/m14_06_cardset";
import { CardsetDetailPage } from "../../pages/admin/m14_08_cardset_detail";
import { CardsetListPage } from "../../pages/admin/m14_06_cardset_list";
import { MainNavPage } from "../../pages/front/f02_01_nav";
import { M1408_ADMIN, M1408L_ADMIN, 画像 } from "../../seeds/m14-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 長い = (c: string, n: number) => c.repeat(n);
const idOf = (url: string) => /\/cardset\/(\d+)\/edit/.exec(url)?.[1] ?? "";
const 保存された = async (page: Page) => page.locator(".alert-success").first().isVisible();

caseTest("IT-M14-08-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const d = new CardsetDetailPage(page);
  const id = notes.get("〔カードセットID-M1408-031〕");
  const 名 = rc("画像維持セット");
  let r = { sent: false, url: "", status: null as number | null };
  let 値: ReturnType<typeof カードセットの値> = null;
  await step(1, async () => { await d.編集画面を開く(id); });
  await step(2, async () => { await d.入力する({ 名日: 名 }); });
  await step(3, async () => { r = await d.登録を押す(); });
  await step(4, async () => { 値 = カードセットの値(id); });
  await expected(async () => {
    expect.soft(r.sent, "更新の要求が送信された").toBe(true);
    expect.soft(値?.名日, "カードセット名日本語（更新された）").toBe(名);
    expect.soft(値?.シンボル画像, "シンボル画像の値（変わらない）").toBe("symbol.png-031");
  });
});

caseTest("IT-M14-08-032", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const d = new CardsetDetailPage(page);
  const id = notes.get("〔カードセットID-M1408-032〕");
  let 前: Buffer | null = null;
  let 後: Buffer | null = null;
  let r = { sent: false, url: "", status: null as number | null };
  await step(1, async () => { await d.編集画面を開く(id); 前 = await d.シンボル画像の中身(); });
  await step(2, async () => { await d.入力する({ シンボル画像: 画像.赤 }); });
  await step(3, async () => { r = await d.登録を押す(); });
  await step(4, async () => { await d.編集画面を開く(id); 後 = await d.シンボル画像の中身(); });
  await expected(async () => {
    expect.soft(r.sent, "更新の要求が送信された").toBe(true);
    expect.soft(前 !== null && 前.equals(readFileSync(画像.青)), "更新前に表示されていた画像は青色の画像").toBe(true);
    expect.soft(後 !== null && 後.equals(readFileSync(画像.赤)), "更新後に表示される画像は赤色の画像").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 削除
// ---------------------------------------------------------------------------

function 一覧のアドレスか(url: string): boolean { return /\/cardset(\/page\/\d+)?$/.test(new URL(url).pathname); }

caseTest("IT-M14-08-037", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const list = new CardsetListPage(page);
  const d = new CardsetDetailPage(page);
  const id = notes.get("〔カードセットID-M1408-037〕");
  let 対象のページ: number | null = null;
  let r = { status: null as number | null, url: "" };
  await step(1, async () => { await list.open(); await list.件数を選ぶ(10); await list.並び順を選ぶ("リリース日（降順）"); });
  await step(2, async () => {
    対象のページ = await list.行を探す(() => list.行(id), "最後から");
    expect(対象のページ, "印つきのカードセットが出る一覧のページ番号").not.toBeNull();
    expect(対象のページ ?? 0, "2ページ目以降であること").toBeGreaterThanOrEqual(2);
    note(`正本は2ページ目を開くが、共有の一覧では件数が決まらないので、リリース日が最も古い印つきのセットが出る最後のページ（${対象のページ}ページ目）を開いた`);
  });
  await step(3, async () => {
    const row = list.行(id);
    await list.操作を開く(row);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), list.編集(row).click()]);
  });
  await step(4, async () => { await d.削除を押す(); });
  await step(5, async () => { r = await d.実行を押す(); });
  await expected(async () => {
    expect.soft(new URL(r.url).pathname.endsWith(`/cardset/page/${対象のページ}`), `遷移先が一覧の${対象のページ}ページ目のアドレス`).toBe(true);
    await expect.soft(page.locator("#admin_cardset_download_by_set"), "カードセット一覧画面").toBeVisible();
  });
});

caseTest("IT-M14-08-053", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const d = new CardsetDetailPage(page);
  const list = new CardsetListPage(page);
  let r = { status: null as number | null, url: "" };
  await step(1, async () => { await d.編集画面を開く(notes.get("〔カードセットID-M1408-053〕")); });
  await step(2, async () => { await d.削除を押す(); });
  await step(3, async () => { r = await d.実行を押す(); });
  await expected(async () => {
    expect.soft(new URL(r.url).pathname.endsWith("/cardset"), "遷移先が一覧の1ページ目のアドレス（ページ番号が付かない）").toBe(true);
    await expect.soft(page.locator("#admin_cardset_download_by_set"), "カードセット一覧画面").toBeVisible();
    expect.soft(await list.現在のページ番号(), "表示されているページ番号").toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 一覧の表示条件の保持
// ---------------------------------------------------------------------------

caseTest("IT-M14-08-043", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1408_ADMIN);
  const list = new CardsetListPage(page);
  const d = new CardsetDetailPage(page);
  const id = notes.get("〔カードセットID-M1408-043〕");
  await step(1, async () => { await list.open(); await list.件数を選ぶ(50); await list.並び順を選ぶ("セット英名（昇順）"); });
  await step(2, async () => {
    const row = list.行(id);
    await expect(row, "印つきのカードセットの行（セット英名の昇順の1ページ目）").toHaveCount(1);
    await list.操作を開く(row);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), list.編集(row).click()]);
  });
  await step(3, async () => { await d.カードセット管理を押す(); });
  await expected(async () => {
    await expect.soft(page.locator("#admin_cardset_download_by_set"), "カードセット一覧画面").toBeVisible();
    expect.soft((await list.表示件数欄.locator("option:checked").innerText()).replace(/\s+/g, ""), "表示件数").toBe("50件");
    expect.soft((await list.並び順欄.locator("option:checked").innerText()).replace(/\s+/g, ""), "並び順").toBe("セット英名（昇順）");
  });
});
