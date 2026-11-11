/** F07-01 イベント大会TOP。正本: cases/F07-01_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { EventTopPage, 店舗クッキーの値, 店舗クッキーを設定する } from "../../pages/front/f07_01_event_top";
import { 支店URLを作る, 実行日から } from "../../pages/admin/f07_01_setup";
import { 店名, 店名F } from "../../seeds/f07-01";
import "../../seeds/f07-01";
import { EventDetailPage } from "../../pages/front/f07_03_event_detail";

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

// ---- 既定店舗（書き換えない。いまの既定店舗が店舗ID 1 であることを、そのまま確かめる） ----
caseTest("IT-F07-01-001", async ({ page, step, expected }) => {
  note("既定店舗の設定（店舗ID 1 の店名・公開・店舗詳細ページと既定店舗の環境設定）は共有の設定なので書き換えず、いまの設定のまま確かめた。クッキーの無い状態は、ケースごとの新しいブラウザ文脈で用意した");
  const top = new EventTopPage(page);
  await step(1, async () => { await top.open(); });
  await expected(async () => {
    expect.soft(await page.locator(".p-hareruya-event-top").count(), "イベント大会TOP画面の本体の数").toBe(1);
    expect.soft(await top.選ばれた店舗ID(), "表示店舗として選ばれた店舗ID（既定店舗）").toBe("1");
  });
});

caseTest("IT-F07-01-004", async ({ page, notes, step, expected }) => {
  note("既定店舗の設定は共有の設定なので書き換えず、いまの設定（店舗ID 1）のまま確かめた。「ブラウザを終了する」は、ブラウザ文脈の有効期限の無いクッキー（ブラウザ終了で消えるもの）を消して、有効期限のあるものだけを残すことで再現した");
  const id = notes.get("〔店舗ID-F0701-004〕");
  await 店舗クッキーを設定する(page, id);
  const top = new EventTopPage(page);
  let before = "";
  await step(1, async () => { await top.open(); before = await top.選ばれた店舗ID(); });
  await step(2, async () => {
    const ctx = page.context();
    const persistent = (await ctx.cookies()).filter((c) => c.expires !== -1);
    await ctx.clearCookies();
    if (persistent.length) await ctx.addCookies(persistent);
    expect.soft(await 店舗クッキーの値(page), "ブラウザ終了のあと、イベント店舗クッキーが残っていない").toBeNull();
  });
  await step(3, async () => { await top.open(); });
  await expected(async () => {
    expect.soft(before, "終了前は、クッキーの店舗が表示店舗に選ばれていた").toBe(id);
    expect.soft(await top.選ばれた店舗ID(), "新しいブラウザセッションで表示店舗として選ばれた店舗ID").toBe("1");
  });
});

// ---- 詳細検索の起動（040） ----
caseTest("IT-F07-01-040", async ({ page, notes, step, expected }) => {
  note("フォーマットの共有マスタには試験の値を足さず、既存のフォーマット「スタンダード」でイベントを登録した（シード表のスタンダード試験の読み替え）");
  const id = notes.get("〔店舗ID-F0701-040〕");
  const top = new EventTopPage(page);
  await step(1, async () => { await top.open(id); await top.一覧の表示を待つ(); });
  await step(2, async () => { await top.詳細検索を押す(); });
  await expected(async () => {
    expect.soft(await top.詳細検索モーダル.getAttribute("class"), "詳細検索モーダルの表示状態").toMatch(/is-visible/);
    expect.soft(await top.詳細検索モーダル.locator('input[name="term"]').isVisible(), "モーダルにキーワードの入力欄が見える").toBe(true);
    expect.soft(await top.詳細検索モーダル.locator('input[name="from"]').count(), "モーダルに開催日時の入力欄がある").toBeGreaterThan(0);
  });
});

// ---- 特別・無料アイコンが出ない定番イベント（099） ----
caseTest("IT-F07-01-099", async ({ page, notes, step, expected }) => {
  note("イベント規模の共有マスタに「通常規模」は無く、足さない。イベント規模を選ばない（定番イベントに並ぶ）ことで「通常規模」に読み替えた");
  const id = notes.get("〔店舗ID-F0701-099〕");
  const top = new EventTopPage(page);
  await step(1, async () => { await top.open(id); await top.一覧の表示を待つ(); });
  const 行 = top.定番イベントの行(rc("F0701-099-REG"));
  await step(2, async () => { await expect(行, "定番イベントのF0701-099-REG").toHaveCount(1, { timeout: 20_000 }); });
  await expected(async () => {
    expect.soft(await 行.count(), "定番イベントにF0701-099-REGが表示される").toBe(1);
    expect.soft(await top.特別イベントのアイコン(行).count(), "特別イベントのアイコンの数").toBe(0);
    expect.soft(await top.無料イベントのアイコン(行).count(), "無料イベントのアイコンの数").toBe(0);
  });
});

// ---- 複数日程イベントの日別画面（107〜115） ----
// 設計書・正本にアドレスの定めが無く、アプリにも該当の画面が見つからない。過去の検討と同じ /ja/events/<イベントID>/<日付指定> を開く。
// 画面が無ければ、期待結果（詳細画面への遷移・日別の一覧）に当たらず不合格になる（操作せずに元の画面を見て合格にはしない）。
const 年月日時 = (開始: string): string => { const m = /^(\d+)-(\d+)-(\d+) (\d+):(\d+)$/.exec(開始)!; return `${m[1]}年${Number(m[2])}月${Number(m[3])}日 ${m[4]}時${m[5]}分`; };
function 日別の詳細へ(n: string, 日付指定: string, 期待の日程: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    note("複数日程イベントの日別画面のアドレスは正本・設計書に無いため、/ja/events/<イベントID>/<日付指定> を開いた");
    const id = notes.get(`〔イベントID-F0701-${n}〕`);
    const top = new EventTopPage(page);
    let r = { status: 0, url: "" };
    await step(1, async () => { r = await top.日別画面を開く(id, 日付指定); });
    await step(2, async () => { expect.soft(r.status, "ネットワーク応答の状態を読み取った").toBeGreaterThan(0); });
    await expected(async () => {
      const d = new EventDetailPage(page);
      expect.soft(r.status, "HTTPの応答").toBeLessThan(400);
      expect.soft(r.url, "大会詳細画面へ遷移した").toMatch(/\/events\/\d+\/detail/);
      expect.soft(((await d.イベント名.textContent({ timeout: 10_000 }).catch(() => "")) ?? "").trim(), "イベント名").toContain(rc(`F0701-${n}-EVT`));
      expect.soft(((await d.開催日時のパンくず.textContent({ timeout: 10_000 }).catch(() => "")) ?? "").replace(/\s+/g, " ").trim(), "開催日時").toContain(年月日時(期待の日程));
    });
  };
}
function 日別の一覧(n: string, 日付指定: string, 期待の日程: string[]): CaseBody {
  return async ({ page, notes, step, expected }) => {
    note("複数日程イベントの日別画面のアドレスは正本・設計書に無いため、/ja/events/<イベントID>/<日付指定> を開いた。一覧の確かめは、画面の本文に出る開催日時の並びで行った");
    const id = notes.get(`〔イベントID-F0701-${n}〕`);
    const top = new EventTopPage(page);
    let r = { status: 0, url: "" };
    await step(1, async () => { r = await top.日別画面を開く(id, 日付指定); });
    await step(2, async () => { expect.soft(r.status, "ネットワーク応答の状態を読み取った").toBeGreaterThan(0); });
    await expected(async () => {
      const body = ((await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "")) ?? "").replace(/\s+/g, " ");
      expect.soft(r.status, "HTTPの応答").toBeLessThan(400);
      expect.soft(r.url, "大会詳細画面へ遷移せず日別画面に留まる").not.toMatch(/\/events\/\d+\/detail/);
      expect.soft(body, "イベント名").toContain(rc(`F0701-${n}-EVT`));
      const pos = 期待の日程.map((x) => body.indexOf(年月日時(x)));
      期待の日程.forEach((x, i) => expect.soft(pos[i], `開催日程 ${x} が一覧にある`).toBeGreaterThanOrEqual(0));
      expect.soft(pos.every((v, i) => i === 0 || (v > pos[i - 1] && pos[i - 1] >= 0)), "開催日程が開始日時の昇順で並ぶ").toBe(true);
      expect.soft((body.match(/\d{4}年\d{1,2}月\d{1,2}日 \d{2}時\d{2}分/g) ?? []).length, "一覧の開催日程の件数（日時の表示の数）").toBe(期待の日程.length);
    });
  };
}
caseTest("IT-F07-01-107", 日別の詳細へ("107", "20251015", "2025-10-16 10:00"));
caseTest("IT-F07-01-108", 日別の詳細へ("108", "20251015", "2025-10-15 10:00"));
caseTest("IT-F07-01-109", 日別の一覧("109", "20251015", ["2025-10-15 10:00", "2025-10-15 13:00"]));
caseTest("IT-F07-01-110", 日別の詳細へ("110", "20301015", "2030-10-16 10:00"));
caseTest("IT-F07-01-111", 日別の詳細へ("111", "20301015", "2030-10-15 10:00"));
caseTest("IT-F07-01-112", 日別の一覧("112", "20301015", ["2030-10-15 10:00", "2030-10-15 13:00"]));
caseTest("IT-F07-01-113", 日別の詳細へ("113", "all", "2025-10-15 10:00"));
caseTest("IT-F07-01-114", 日別の詳細へ("114", "all", "2030-10-15 10:00"));
caseTest("IT-F07-01-115", 日別の一覧("115", "all", ["2030-10-15 13:00", "2030-10-16 10:00"]));
