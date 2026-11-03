/** F07-01 イベント大会TOP。正本: cases/F07-01_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { EventTopPage, 店舗クッキーの値, 店舗クッキーを設定する } from "../../pages/front/f07_01_event_top";
import { 支店URLを作る, 実行日から } from "../../pages/admin/f07_01_setup";
import { 店名, 店名F } from "../../seeds/f07-01";
import "../../seeds/f07-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-F07-01-002", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店舗ID-F0701-002〕");
  await 店舗クッキーを設定する(page, id); // 事前準備: 専用ブラウザのイベント店舗クッキーを設定する
  const top = new EventTopPage(page);
  await step(1, async () => { await top.open(); });
  await expected(async () => {
    expect.soft(await top.選ばれた店舗ID(), "表示店舗として選ばれた店舗ID").toBe(id);
    expect.soft(await top.選ばれた店舗名(), "表示店舗として選ばれた店名").toBe(店名("002"));
  });
});

caseTest("IT-F07-01-003", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔店舗ID-F0701-003A〕"), b = notes.get("〔店舗ID-F0701-003B〕");
  await 店舗クッキーを設定する(page, a);
  const top = new EventTopPage(page);
  await step(1, async () => { await top.open(b); });
  let cookie: string | null = null;
  await step(2, async () => { cookie = await 店舗クッキーの値(page); });
  await expected(async () => {
    expect.soft(await top.選ばれた店舗ID(), "表示店舗として選ばれた店舗ID").toBe(b);
    expect.soft(await top.選ばれた店舗名(), "表示店舗として選ばれた店名").toBe(店名("003", "大阪試験店"));
    expect.soft(cookie, "イベント店舗クッキーの値").toBe(b);
  });
});

caseTest("IT-F07-01-005", async ({ page, step, expected }) => {
  const top = new EventTopPage(page);
  let status = 0;
  await step(1, async () => { ({ status } = await top.open("999999")); });
  await step(2, async () => { expect.soft(status, "ネットワーク応答の状態を読み取った").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(status, "HTTPの応答").toBe(404);
    expect.soft(await page.locator(".p-hareruya-event-top").count(), "イベント大会TOP画面の本体の数").toBe(0);
  });
});

caseTest("IT-F07-01-006", async ({ page, notes, step, expected }) => {
  const a = notes.get("〔店舗ID-F0701-006A〕"), b = notes.get("〔店舗ID-F0701-006B〕");
  const top = new EventTopPage(page);
  await step(1, async () => { await top.open(a, "tab=daily"); await expect(top.タブ("daily"), "日別で探すタブが選ばれている").toHaveClass(/is-active/, { timeout: 20_000 }); });
  let method = "";
  await step(2, async () => {
    const nav = page.waitForRequest((r) => r.isNavigationRequest() && /[?&]shop=/.test(r.url()) && new URL(r.url()).searchParams.get("shop") === b, { timeout: 30_000 });
    await top.店舗を選ぶ(店名("006", "大阪試験店"));
    method = (await nav).method();
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.pathname, "遷移先の画面").toMatch(/\/events\/?$/);
    expect.soft(u.searchParams.get("shop"), "遷移先の店舗指定").toBe(b);
    expect.soft(u.searchParams.get("tab"), "引き継いだ表示モード（日別で探す）").toBe("daily");
    expect.soft(method, "遷移の方法").toBe("GET");
  });
});

caseTest("IT-F07-01-007", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店舗ID-F0701-007〕");
  const top = new EventTopPage(page);
  await step(1, async () => { await top.open(id); await top.一覧の表示を待つ(); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), top.店舗ページリンク.click({ timeout: 20_000 })]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先のアドレス（店舗の詳細ページ）").toContain(`/${支店URLを作る("007")}`);
    expect.soft(await page.locator("body").innerText(), "遷移先の画面に出る店名").toContain(店名("007"));
  });
});

caseTest("IT-F07-01-105", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店舗ID-F0701-105〕");
  const top = new EventTopPage(page);
  expect(await 店舗クッキーの値(page), "事前準備: イベント店舗クッキーが無い").toBeNull();
  await step(1, async () => { await top.open(id); });
  let cookie: string | null = null;
  await step(2, async () => { cookie = await 店舗クッキーの値(page); });
  await expected(async () => {
    expect.soft(await top.選ばれた店舗ID(), "表示店舗として選ばれた店舗ID").toBe(id);
    expect.soft(await top.選ばれた店舗名(), "表示店舗として選ばれた店名").toBe(店名F("105"));
    expect.soft(cookie, "イベント店舗クッキーの値").toBe(id);
  });
});

caseTest("IT-F07-01-106", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔店舗ID-F0701-106〕");
  await 店舗クッキーを設定する(page, id);
  const top = new EventTopPage(page);
  let headers: Record<string, string> = {};
  await step(1, async () => { ({ headers } = await top.open(id)); });
  await step(2, async () => { expect.soft(Object.keys(headers).length, "ネットワーク応答のヘッダを読み取った").toBeGreaterThan(0); });
  let cookie: string | null = null;
  await step(3, async () => { cookie = await 店舗クッキーの値(page); });
  await expected(async () => {
    expect.soft(await top.選ばれた店舗ID(), "表示店舗として選ばれた店舗ID").toBe(id);
    expect.soft(await top.選ばれた店舗名(), "表示店舗として選ばれた店名").toBe(店名F("106"));
    expect.soft(headers["set-cookie"] ?? "", "応答のクッキー設定（Set-Cookie）").not.toMatch(/(^|[\s;,])shop=/);
    expect.soft(cookie, "イベント店舗クッキーの値").toBe(id);
  });
});

/** 117〜119: カレンダーの「イベントあり」と定番イベントの一覧 */
function listCase(n: "117" | "118" | "119", 出る: string, 出ない: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const id = notes.get(`〔店舗ID-F0701-${n}〕`);
    const top = new EventTopPage(page);
    const ymd = (d: number) => 実行日から(d, "00:00").slice(0, 10);
    await step(1, async () => { await top.open(id); await top.一覧の表示を待つ(); });
    let 翌日あり = false, 二日後あり = false;
    await step(2, async () => {
      await top.タブを開く("monthly");
      await top.カレンダーを含む月へ移る(ymd(1));
      翌日あり = await top.イベントあり(ymd(1));
      二日後あり = await top.イベントあり(ymd(2));
    });
    await step(3, async () => { await top.タブを開く("list"); await top.一覧の表示を待つ(); });
    await expected(async () => {
      expect.soft(翌日あり, `カレンダーの${ymd(1)}（ケース実行日の翌日）にイベントあり`).toBe(true);
      expect.soft(二日後あり, `カレンダーの${ymd(2)}（2日後）にイベントあり`).toBe(false);
      const names = await top.定番イベントの名前();
      expect.soft(names.includes(rc(出る)), `定番イベントに ${出る} が表示される`).toBe(true);
      expect.soft(names.includes(rc(出ない)), `定番イベントに ${出ない} が表示されない`).toBe(false);
    });
  };
}
caseTest("IT-F07-01-117", listCase("117", "F0701-117-PUB", "F0701-117-PRIV"));
caseTest("IT-F07-01-118", listCase("118", "F0701-118-PUB", "F0701-118-PRIV"));
caseTest("IT-F07-01-119", listCase("119", "F0701-119-PUB", "F0701-119-OTHER"));
