/**
 * M13-11 イベント申込登録（検索入力）。正本: cases/M13-11_test_cases.tsv
 * 実装するのは画面だけで準備できる16件（日付境界・略称のDB設定が要る 007・008・009・013 は実装しない）。
 * 決め打ちの識別の値（イベント名・検索語）は rc() で実行ごとの印を付ける（依頼者決定 2026-10-28）。
 * 「店舗で全店舗を選択」は、店舗を何も選ばない（指定なし）に読み替える。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { adminUrl, loginAdmin } from "../../lib/session";
import { EntrySearchPage } from "../../pages/admin/m13_11_entry_search";
import { M1311_ADMIN, M1311_L_ADMIN } from "../../seeds/m13-11";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 全店舗: string[] = [];

caseTest("IT-M13-11-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  let 店舗: string[] = []; let from = "";
  await step(2, async () => { 店舗 = await s.選ばれている店舗(); from = await s.日付の値(s.開催日From); });
  await expected(async () => {
    const d = new Date(); const today = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    expect.soft(店舗, "店舗の初期値").toEqual(["店舗A"]);
    expect.soft(from, "開催日(From)の初期値（実行日当日）").toBe(today);
  });
});

{
  const 店舗 = ["店舗A", "店舗B"]; const ラベル = "002";
  caseTest("IT-M13-11-002", async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1311_ADMIN);
    const s = new EntrySearchPage(page);
    await step(1, async () => { await s.開く(); });
    await step(2, async () => { await s.店舗を選ぶ([...店舗]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
    await step(3, async () => { await s.検索イベント名.fill(rc("権限確認大会")); await s.検索する(); });
    await expected(async () => {
      const got = await s.表示されたイベントID();
      expect.soft(got, "店舗AのイベントIDが一覧領域に表示される").toContain(notes.get(`〔イベントID-M1311-${ラベル}A〕`));
      expect.soft(got, "店舗BのイベントIDが一覧領域に表示される").toContain(notes.get(`〔イベントID-M1311-${ラベル}B〕`));
    });
  });
}

caseTest("IT-M13-11-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => {
    note("「全店舗」は、店舗を何も選ばない状態（指定なし）として選んだ");
    await s.店舗を選ぶ(全店舗); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, "");
  });
  await step(3, async () => { await s.検索イベント名.fill(rc("権限確認大会")); await s.検索する(); });
  await expected(async () => {
    const got = await s.表示されたイベントID(); const ds = await s.新規登録ボタンの日程ID();
    expect.soft(got, "権限を保持する店舗AのイベントIDが表示される").toContain(notes.get("〔イベントID-M1311-003A〕"));
    expect.soft(got, "権限を保持する店舗BのイベントIDが表示される").toContain(notes.get("〔イベントID-M1311-003B〕"));
    expect.soft(ds, "店舗Aの日程の新規登録ボタンが表示される").toContain(notes.get("〔日程ID-M1311-003A〕"));
    expect.soft(ds, "店舗Bの日程の新規登録ボタンが表示される").toContain(notes.get("〔日程ID-M1311-003B〕"));
    expect.soft(got, "権限を保持しない店舗CのイベントIDは表示されない").not.toContain(notes.get("〔イベントID-M1311-003C〕"));
  });
});

caseTest("IT-M13-11-011", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  const before = () => new URL(page.url()).pathname;
  let 検索前 = "";
  await step(2, async () => {
    検索前 = before();
    await s.店舗を選ぶ(["店舗A"]); await s.検索イベント名.fill(rc("結合対象"));
    await s.日付を入れる(s.開催日From, "2099/08/15"); await s.日付を入れる(s.開催日To, "2099/08/15");
  });
  await step(3, async () => { await s.検索する(); });
  await expected(async () => {
    expect.soft(before(), "画面遷移せず同じ画面のまま").toBe(検索前);
    expect.soft(await s.新規登録ボタンの日程ID(), "全条件を満たす日程だけが表示される").toEqual([notes.get("〔日程ID-M1311-011A〕")]);
    expect.soft(await s.表示されたイベントID(), "全条件を満たすイベントIDだけが表示される").toEqual([notes.get("〔イベントID-M1311-011A〕")]);
  });
});

caseTest("IT-M13-11-014", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("受付判定大会")); await s.検索する(); });
  await expected(async () => {
    const ds = await s.新規登録ボタンの日程ID();
    expect.soft(ds, "オンライン受付ありの日程が表示される").toContain(notes.get("〔日程ID-M1311-014A〕"));
    expect.soft(ds, "オンライン受付なしの日程は表示されない").not.toContain(notes.get("〔日程ID-M1311-014B〕"));
    expect.soft(await s.日程の行数(), "表示された日程の行数").toBe(1);
  });
});

/** 「ページング大会」の検索（015・017〜019） */
async function ページング検索(s: EntrySearchPage): Promise<void> {
  await s.開く();
  await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, "");
  await s.検索イベント名.fill(rc("ページング大会")); await s.検索する();
}
const nn = (i: number) => String(i).padStart(2, "0");

caseTest("IT-M13-11-015", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("ページング大会")); await s.検索する(); });
  let ds: string[] = []; let 行数 = 0;
  await step(4, async () => { ds = await s.新規登録ボタンの日程ID(); 行数 = await s.日程の行数(); });
  await expected(async () => {
    expect.soft(行数, "1ページ目の日程件数（行数）").toBe(10);
    expect.soft(ds, "11件目の日程は1ページ目に表示されない").not.toContain(notes.get("〔日程ID-M1311-共有ページ01〕"));
  });
});

caseTest("IT-M13-11-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("ページング大会")); await s.検索する(); });
  await step(4, async () => { await s.ページを選ぶ(2); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "2ページ目の検索結果へ遷移する").toMatch(/\/entry_registration\/page\/2$/);
    expect.soft(await s.表示されたイベントID(), "イベントID ページ01の日程が表示される").toContain(notes.get("〔イベントID-M1311-共有ページ01〕"));
  });
});

caseTest("IT-M13-11-018", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => {
    await s.開く(); await s.店舗を選ぶ(["店舗A"]); await s.検索イベント名.fill(rc("ページング大会"));
    await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); await s.検索する();
  });
  await step(2, async () => { await s.ページを選ぶ(2); });
  await step(3, async () => { await s.検索する(); });
  await expected(async () => {
    const want = Array.from({ length: 10 }, (_, i) => notes.get(`〔イベントID-M1311-共有ページ${nn(11 - i)}〕`));
    expect.soft(new URL(page.url()).pathname, "1ページ目へ戻る").not.toMatch(/\/page\/2$/);
    expect.soft(await s.表示されたイベントID(), "ページ11からページ02までの日程が表示される").toEqual(want);
  });
});

caseTest("IT-M13-11-019", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => {
    await s.開く(); await s.店舗を選ぶ(["店舗A"]); await s.検索イベント名.fill(rc("ページング大会"));
    await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); await s.検索する();
  });
  let p1: string[] = []; let p2: string[] = [];
  await step(2, async () => { p1 = await s.表示されたイベントID(); });
  await step(3, async () => { await s.ページを選ぶ(2); p2 = await s.表示されたイベントID(); });
  await expected(async () => {
    const want = Array.from({ length: 11 }, (_, i) => notes.get(`〔イベントID-M1311-共有ページ${nn(i + 1)}〕`));
    expect.soft([...p1, ...p2].sort(), "2ページを通して11件が重複・欠落なく1回ずつ表示される").toEqual([...want].sort());
  });
});

/** 「並び順大会」の検索（020・021） */
async function 並び順検索(s: EntrySearchPage): Promise<void> {
  await s.開く(); await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, "");
  await s.検索イベント名.fill(rc("並び順大会")); await s.検索する();
}

caseTest("IT-M13-11-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page); const a = notes.get("〔イベントID-M1311-共有並びA〕");
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("並び順大会")); await s.検索する(); });
  let ds: string[] = []; let span = ""; let 名span = "";
  await step(4, async () => {
    ds = await s.新規登録ボタンの日程ID();
    const idCell = s.結果の行.locator("td[rowspan]", { hasText: new RegExp(`^\\s*${a}\\s*$`) }).first();
    span = (await idCell.getAttribute("rowspan")) ?? "";
    // イベント名の欄は、イベントIDの欄のすぐ右の結合セル
    名span = (await idCell.locator("xpath=following-sibling::td[1]").getAttribute("rowspan")) ?? "";
  });
  await expected(async () => {
    const want = [notes.get("〔日程ID-M1311-共有並びA3〕"), notes.get("〔日程ID-M1311-共有並びA2〕"), notes.get("〔日程ID-M1311-共有並びA1〕")];
    const at = ds.indexOf(want[0]);
    expect.soft(ds.slice(at, at + 3), "イベントAの3日程が日程A3・A2・A1の順に並ぶ").toEqual(want);
    expect.soft(span, "イベントIDが3日程をまたぐ1行にまとまる（行の結合数）").toBe("3");
    expect.soft(名span, "イベント名が3日程をまたぐ1行にまとまる（行の結合数）").toBe("3");
    expect.soft(ds.indexOf(want[0]), "イベントAがイベントBより前（イベントIDの大きい順）").toBeLessThan(ds.indexOf(notes.get("〔日程ID-M1311-共有並びB1〕")));
  });
});

caseTest("IT-M13-11-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page); const a = notes.get("〔イベントID-M1311-共有並びA〕");
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("並び順大会")); await s.検索する(); });
  let 名欄 = ""; let 日程欄: string[] = [];
  await step(4, async () => {
    const first = s.日程の行(notes.get("〔日程ID-M1311-共有並びA3〕"));
    名欄 = (await first.locator("td[rowspan]").nth(1).innerText()).replace(/\s+/g, " ");
    for (const d of ["A1", "A2", "A3"]) 日程欄.push((await s.日程の行(notes.get(`〔日程ID-M1311-共有並び${d}〕`)).locator("td").filter({ hasText: /^\s*2099\/\d\d\/\d\d \d\d:\d\d\s*$/ }).first().innerText()).trim());
    void a;
  });
  await expected(async () => {
    expect.soft(名欄, "イベント名（日）").toContain(rc("並び順大会"));
    expect.soft(名欄, "イベント名（英）に相当する表示は一覧に無く、店舗名").toContain("店舗A");
    expect.soft(名欄, "フォーマット（スタンダード）").toContain("スタンダード");
    expect.soft(名欄, "フォーマット（モダン）").toContain("モダン");
    expect.soft(名欄, "イベント名（英）").toContain("Ordering Tournament");
    expect.soft(日程欄, "各日程の開催日時").toEqual(["2099/04/10 10:00", "2099/04/11 10:00", "2099/04/12 10:00"]);
  });
});

caseTest("IT-M13-11-022", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page); const d = notes.get("〔日程ID-M1311-022〕");
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("遷移確認大会")); await s.検索する(); });
  await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), s.日程の行(d).locator(`a[href$="/entry_registration/new/${d}"]`).click()]); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "遷移した画面（イベント新規申込登録）").toMatch(new RegExp(`/entry_registration/new/${d}$`));
  });
});

caseTest("IT-M13-11-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const d = notes.get("〔日程ID-M1311-023〕");
  const modal = page.locator("#searchEventModal");
  await step(1, async () => {
    await page.goto(adminUrl("/event/entry"));
    await page.waitForLoadState("load");
    await page.locator('button[data-bs-target="#searchEventModal"]').click({ timeout: 30_000 });
    await expect(modal, "重ねて表示されたイベント検索").toBeVisible();
  });
  await step(2, async () => {
    await modal.locator('[name$="[event_name]"]').fill(rc("遷移確認大会"));
    const base = modal.locator('select[name*="base_info"]');
    await base.selectOption([{ label: "店舗A" }]);
    await modal.locator('[name$="[start_date_from]"]').fill("");
    await modal.locator('[name$="[start_date_to]"]').fill("");
    await modal.locator("#searchEventModalButton").click({ timeout: 30_000 });
    await expect(modal.locator(`button.set-event[data-detail="${d}"]`), "検索結果に日程の行").toBeVisible({ timeout: 30_000 });
  });
  await step(3, async () => { await modal.locator(`button.set-event[data-detail="${d}"]`).click({ timeout: 30_000 }); });
  await expected(async () => {
    await expect.soft(modal, "重ねて表示した一覧が閉じる").toBeHidden();
    expect.soft(await page.locator("#admin_search_event_event_name").inputValue(), "検索条件のイベント名").toBe(rc("遷移確認大会"));
    expect.soft((await page.locator("#admin_search_event_start_date_from").inputValue()).replace(/-/g, "/").slice(0, 10), "検索条件の開催日(From)").toBe("2099/12/01");
    expect.soft((await page.locator("#admin_search_event_start_date_to").inputValue()).replace(/-/g, "/").slice(0, 10), "検索条件の開催日(To)").toBe("2099/12/01");
    const shops = await page.locator("#admin_search_event_base_info").evaluate((el) => [...(el as HTMLSelectElement).selectedOptions].map((o) => (o.textContent ?? "").trim()));
    expect.soft(shops, "検索条件の店舗").toEqual(["店舗A"]);
  });
});

caseTest("IT-M13-11-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_L_ADMIN);
  const s = new EntrySearchPage(page); const b = notes.get("〔日程ID-M1311-024B〕");
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("連携確認大会001")); await s.検索する(); });
  await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), s.日程の行(b).locator(`a[href$="/entry_registration/new/${b}"]`).click()]); });
  let 画面 = ""; let 金額 = "";
  await step(5, async () => {
    画面 = (await page.locator("form").first().innerText()).replace(/\s+/g, " ");
    // 画面は桁区切りのカンマつきで表示する（例「2,500」）。金額として比べるためカンマを除く
    金額 = (await page.locator('[name$="[price]"]').first().inputValue()).replace(/,/g, "");
  });
  await expected(async () => {
    expect.soft(画面, "選択した日程のイベント名と開催日時").toContain(`${rc("連携確認大会001")}（Link Check 001） 2099-12-02 14:30`);
    expect.soft(画面, "別の日程（2099-12-01 10:00）は表示されない").not.toContain("2099-12-01 10:00");
    expect.soft(金額.replace(/,/g, ""), "支払金額の初期表示（参加費。桁区切りは除いて比べる）").toBe("2500");
  });
});

caseTest("IT-M13-11-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page); const d = notes.get("〔日程ID-M1311-025〕");
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗A"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("決定非表示確認大会")); await s.検索する(); });
  let 操作欄 = ""; let 表示 = 0;
  await step(4, async () => { const r = s.日程の行(d); 表示 = await r.count(); 操作欄 = (await r.locator("td").last().innerText()).replace(/\s+/g, " "); });
  await expected(async () => {
    expect.soft(表示, "日程の一覧行が表示される").toBe(1);
    expect.soft(await s.表示されたイベントID(), "イベントIDの行が表示される").toContain(notes.get("〔イベントID-M1311-025〕"));
    expect.soft(操作欄, "その行の操作欄に「決定」ボタンが表示されない").not.toContain("決定");
  });
});

caseTest("IT-M13-11-026", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1311_ADMIN);
  const s = new EntrySearchPage(page);
  await step(1, async () => { await s.開く(); });
  await step(2, async () => { await s.店舗を選ぶ(["店舗C"]); await s.日付を入れる(s.開催日From, ""); await s.日付を入れる(s.開催日To, ""); });
  await step(3, async () => { await s.検索イベント名.fill(rc("M1311-026大会")); await s.検索する(); });
  await expected(async () => {
    expect.soft((await page.locator("body").innerText()).replace(/\s+/g, " "), "一覧領域のメッセージ").toContain("検索条件に該当するデータがありませんでした。");
    expect.soft(await s.表示されたイベントID(), "店舗CのイベントIDの日程は表示されない").not.toContain(notes.get("〔イベントID-M1311-026〕"));
  });
});
