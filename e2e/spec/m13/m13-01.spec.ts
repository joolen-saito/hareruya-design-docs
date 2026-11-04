/**
 * M13-01 イベント一覧。正本: cases/M13-01_test_cases.tsv（画面だけで準備できるケースのうち、下記の振り分けのものを実装）
 * 決め打ちの識別の値（イベント名・検索語）は rc() で実行ごとの印を付ける（依頼者決定 2026-10-28）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { EventListPage } from "../../pages/admin/m13_01_event_list";
import { ページ表示件数マスタの既定値, 登録済みのイベントか } from "../../db/m13_01";
import { M1301_ADMIN } from "../../seeds/m13-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ids = (s: string) => s.split(",");

caseTest("IT-M13-01-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  let from = ""; let shops: string[] = [];
  await step(2, async () => { from = await list.日付の値(list.開催日From); shops = await list.選ばれている店舗(); });
  await expected(async () => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    const want = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    expect.soft(from, "開催日(From)の初期値（実行日の3か月前）").toBe(want);
    expect.soft(shops, "店舗の初期値（メンバーのデフォルト表示店舗）").toEqual(["東京店"]);
  });
});

caseTest("IT-M13-01-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await expected(async () => {
    expect(await list.結果の表が表示されている(), "検索結果の表が表示されている").toBe(false);
  });
});

caseTest("IT-M13-01-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  let 既定 = 0; let 語 = "";
  await step(1, async () => { 既定 = ページ表示件数マスタの既定値(); });
  await step(2, async () => {
    await list.開く();
    // 件数の選択肢は検索結果があるときだけ出る。開催日の初期条件を空にして、登録済みのイベントを検索する
    await list.開催日From.fill("");
    await list.検索する();
  });
  await step(3, async () => { 語 = await list.選択値の表示(list.件数); });
  await expected(async () => {
    expect.soft(既定, "ページ表示件数マスタの既定値").toBe(10);
    expect(語, "件数の選択値").toBe(`${既定}件`);
  });
});

caseTest("IT-M13-01-006", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list0 = new EventListPage(page);
  await step(1, async () => { await list0.開く(); });
  await step(2, async () => { await list0.クリアを押す(); });
  await step(3, async () => { await list0.名前略称.fill(rc("開催日境界")); await list0.日付を入れる(list0.開催日From, "2026/08/10"); });
  await step(4, async () => { await list0.検索する(); });
  await expected(async () => {
    const got = await list0.結果のID();
    for (const x of ["B", "C", "D"]) expect.soft(got, `ID ${x}（2026/08/10以降に開始）が表示される`).toContain(notes.get(`〔イベントID-M1301-共有-DATE-${x}〕`));
    expect.soft(got, "2026/08/10より前に開始するID Aが表示されない").not.toContain(notes.get("〔イベントID-M1301-共有-DATE-A〕"));
  });
});

caseTest("IT-M13-01-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称.fill(rc("開催日境界")); await list.日付を入れる(list.開催日To, "2026/08/10"); });
  await step(4, async () => { await list.検索する(); });
  await expected(async () => {
    const got = await list.結果のID();
    for (const x of ["A", "B", "C"]) expect.soft(got, `ID ${x}（2026/08/10までに開始）が表示される`).toContain(notes.get(`〔イベントID-M1301-共有-DATE-${x}〕`));
    expect.soft(got, "2026/08/11 00:00に開始するID Dが表示されない").not.toContain(notes.get("〔イベントID-M1301-共有-DATE-D〕"));
  });
});

caseTest("IT-M13-01-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称.fill(rc("形式確認")); await list.フォーマット.selectOption({ label: "スタンダード" }); });
  await step(4, async () => { await list.検索する(); });
  await expected(async () => {
    const got = await list.結果のID();
    expect.soft(got, "検索結果に表示されたID").toEqual([notes.get("〔イベントID-M1301-共有-FILTER-A〕")]);
    expect.soft(got, "フォーマットが「モダン」のID Bが表示されない").not.toContain(notes.get("〔イベントID-M1301-共有-FILTER-B〕"));
  });
});

caseTest("IT-M13-01-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称.fill(rc("ルール確認")); await list.ルール適用度.selectOption({ label: "競技" }); });
  await step(4, async () => { await list.検索する(); });
  await expected(async () => {
    const got = await list.結果のID();
    expect.soft(got, "検索結果に表示されたID").toEqual([notes.get("〔イベントID-M1301-共有-FILTER-C〕")]);
    expect.soft(got, "ルール適用度が「一般」のID Dが表示されない").not.toContain(notes.get("〔イベントID-M1301-共有-FILTER-D〕"));
  });
});

caseTest("IT-M13-01-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称.fill("未登録イベント名"); });
  await step(4, async () => { await list.検索する(); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "イベント一覧の画面に留まる").toMatch(/\/event(\/page\/\d+)?$/);
    expect.soft(await list.結果の表が表示されている(), "検索結果の表が表示されている").toBe(false);
  });
});

caseTest("IT-M13-01-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await list.名前略称.fill("クリア確認");
    await list.日付を入れる(list.開催日From, "2026/08/01");
    await list.日付を入れる(list.開催日To, "2026/08/31");
    await list.フォーマット.selectOption({ label: "スタンダード" });
    await list.ルール適用度.selectOption({ label: "競技" });
    // 正本は店舗「東京店」と「大阪店」。大阪店は同名の店舗が複数あり選べないので、東京店だけを選ぶ
    note("店舗は「東京店」と「大阪店」を選ぶ手順だが、大阪店は手元のDBに同名の店舗が複数あるため、東京店だけを選んだ");
    await list.店舗を選ぶ(["東京店"]);
  });
  await step(3, async () => { await list.クリアを押す(); });
  await expected(async () => {
    expect.soft(await list.名前略称.inputValue(), "イベント名、略称").toBe("");
    expect.soft(await list.日付の値(list.開催日From), "開催日(From)").toBe("");
    expect.soft(await list.日付の値(list.開催日To), "開催日(To)").toBe("");
    expect.soft(await list.フォーマット.inputValue(), "フォーマット").toBe("");
    expect.soft(await list.選ばれている店舗(), "店舗").toEqual([]);
    expect.soft(await list.ルール適用度.inputValue(), "ルール適用度").toBe("");
  });
});

caseTest("IT-M13-01-023", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.検索する(); });
  await expected(async () => {
    expect(await list.結果の表が表示されている(), "検索結果の表が表示されている").toBe(false);
  });
});

caseTest("IT-M13-01-025", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称で検索する(rc("表示確認大会")); });
  let 行 = "";
  await step(4, async () => { 行 = await list.行の文(notes.get("〔イベントID-M1301-共有-DISPLAY〕")); });
  await expected(async () => {
    expect.soft(行, "開催店舗").toContain("東京店");
    expect.soft(行, "開催日時（同店舗で最も早い日時）").toContain("2026/09/01 09:00");
    expect.soft(行, "遅い日時は表示されない").not.toContain("2026/09/02 10:00");
  });
});

caseTest("IT-M13-01-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.btn-ec-conversion[href$='/event/create']").click()]); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "遷移した画面（イベント登録）").toMatch(/\/event\/create$/);
  });
});

/** 権限内編集確認の検索（027〜029） */
async function 編集確認を検索(list: EventListPage): Promise<void> {
  await list.開く();
  await list.開催日From.fill("");
  await list.名前略称で検索する(rc("権限内編集確認"));
}

caseTest("IT-M13-01-027", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-共有-DELETE-A〕");
  await step(1, async () => { await 編集確認を検索(list); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), list.行(id).locator(`a[href$='/event/${id}/edit']`).first().click()]); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "遷移した画面（イベント編集）").toMatch(new RegExp(`/event/${id}/edit$`));
  });
});

caseTest("IT-M13-01-028", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-共有-DELETE-A〕");
  await step(1, async () => { await 編集確認を検索(list); });
  await step(2, async () => { await list.編集ボタンを押す(id); });
  await expected(async () => {
    expect.soft(list.メニュー項目(id, "編集"), "メニューの「編集」を選択できる").toBeVisible();
    expect.soft(list.メニュー項目(id, "削除"), "メニューの「削除」を選択できる").toBeVisible();
    expect.soft(list.メニュー項目(id, "削除"), "メニューの「削除」が有効").toBeEnabled();
  });
});

caseTest("IT-M13-01-029", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-共有-DELETE-A〕");
  await step(1, async () => { await 編集確認を検索(list); });
  await step(2, async () => { await list.編集ボタンを押す(id); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), list.メニュー項目(id, "編集").click()]); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "遷移した画面（イベント編集）").toMatch(new RegExp(`/event/${id}/edit$`));
  });
});

caseTest("IT-M13-01-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-030〕");
  await step(1, async () => { await list.開く(); await list.開催日From.fill(""); await list.名前略称で検索する(rc("削除実行確認")); });
  await step(2, async () => { await list.編集ボタンを押す(id); });
  await step(3, async () => { await list.削除して確認する(id); });
  let 登録あり = true;
  await step(4, async () => { 登録あり = 登録済みのイベントか(id); });
  await expected(async () => {
    expect.soft(登録あり, "DBから登録済みのイベントとして取得できる").toBe(false);
    await list.開く(); await list.開催日From.fill(""); await list.名前略称で検索する(rc("削除実行確認"));
    expect.soft(await list.結果のID(), "同じ条件で検索した一覧").not.toContain(id);
  });
});

caseTest("IT-M13-01-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-031〕");
  await step(1, async () => { await list.開く(); await list.開催日From.fill(""); await list.名前略称で検索する(rc("削除遷移確認")); });
  await step(2, async () => { await list.編集ボタンを押す(id); });
  await step(3, async () => { await list.削除して確認する(id); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "削除成功後の画面（イベント一覧）").toMatch(/\/event(\/page\/\d+)?$/);
  });
});

caseTest("IT-M13-01-035", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-共有-DELETE-C〕");
  await step(1, async () => { await list.開く(); await list.開催日From.fill(""); await list.名前略称で検索する(rc("日程登録済削除確認")); });
  let r = { 選べた: true, 確認が出た: false };
  await step(2, async () => { await list.編集ボタンを押す(id); r = await list.削除して確認する(id); });
  await step(3, async () => { if (!r.確認が出た) note("日程が登録済みのイベントは、メニューの「削除」が選べない状態で、確認画面は出なかった"); });
  await step(4, async () => { await list.開く(); await list.開催日From.fill(""); await list.名前略称で検索する(rc("日程登録済削除確認")); });
  await expected(async () => {
    expect.soft(await list.結果のID(), "手順4の検索結果（削除されず表示される）").toContain(id);
  });
});

caseTest("IT-M13-01-040", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-040〕");
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => {
    await list.名前略称で検索する(rc("M1301-040-DISCARD"));
    expect.soft(await list.結果のID(), "ID 〔イベントID-M1301-040〕が表示される").toContain(id);
  });
  await step(4, async () => { await list.開く(); });
  await step(5, async () => { await list.クリアを押す(); });
  await step(6, async () => { await list.検索する(); });
  await expected(async () => {
    expect.soft(await list.結果の表が表示されている(), "検索結果の表が表示されている").toBe(false);
    expect.soft(await list.結果のID(), "ID 〔イベントID-M1301-040〕が表示されない").not.toContain(id);
  });
});

caseTest("IT-M13-01-041", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-041〕");
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称で検索する(rc("M1301-041-DISCARD")); });
  await step(4, async () => { await list.件数を選ぶ(50); });
  await step(5, async () => { await list.開く(); });
  await step(6, async () => { await list.クリアを押す(); });
  await step(7, async () => {
    await list.名前略称で検索する(rc("M1301-041-DISCARD"));
    expect.soft(await list.結果のID(), "ID 〔イベントID-M1301-041〕が表示される").toContain(id);
  });
  let 選択 = "";
  await step(8, async () => { 選択 = await list.選択値の表示(list.件数); });
  await expected(async () => {
    expect.soft(選択, "件数の選択値（既定表示件数）").toBe("10件");
    expect.soft(選択, "保持されていた50件は選択されていない").not.toBe("50件");
  });
});

/** 「ページ対象」の検索結果を開く（件数を選び、必要なら2ページ目へ） */
async function ページ対象を検索(list: EventListPage): Promise<void> {
  await list.開く();
  await list.クリアを押す();
  await list.名前略称で検索する(rc("ページ対象"));
}

caseTest("IT-M13-01-017", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  const 全部 = [...ids(notes.get("〔イベントID-M1301-共有-PAGING〕")), notes.get("〔イベントID-M1301-017〕")];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称で検索する(rc("ページ対象")); });
  await step(4, async () => { await list.件数を選ぶ(10); });
  let p1: string[] = [];
  await step(5, async () => { p1 = await list.結果のID(); });
  let p2: string[] = [];
  await step(6, async () => { await list.ページを選ぶ(2); p2 = await list.結果のID(); });
  await expected(async () => {
    expect.soft(await list.名前略称.inputValue(), "検索条件「ページ対象」が復元される").toBe(rc("ページ対象"));
    expect.soft([...p1, ...p2].sort(), "2ページを通して11件が重複・欠落なく1回ずつ表示される").toEqual([...全部].sort());
    expect.soft([...p1, ...p2].length, "表示された件数").toBe(11);
  });
});

caseTest("IT-M13-01-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await ページ対象を検索(list); });
  await step(2, async () => { await list.件数を選ぶ(10); });
  await step(3, async () => {
    // 件数の選択肢に値11を追加して選ぶ（選択肢の値は、その件数の一覧を開くアドレス）
    const url = await list.件数.locator("option").first().getAttribute("value");
    const v = (url ?? "").replace(/page_count=\d+/, "page_count=11");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      list.件数.evaluate((el, value) => {
        const sel = el as HTMLSelectElement;
        const o = document.createElement("option"); o.value = value; o.textContent = "11件"; sel.appendChild(o); sel.value = value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }, v),
    ]);
  });
  await expected(async () => {
    expect.soft((await list.結果のID()).length, "1ページ目の表示行数（保持されていた10件単位）").toBe(10);
    expect.soft(await list.選択値の表示(list.件数), "件数の選択値（11件は採用されない）").toBe("10件");
  });
});

caseTest("IT-M13-01-020", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); await list.クリアを押す(); await list.名前略称で検索する(rc("SORT")); });
  await step(2, async () => { await list.並びを選ぶ("イベント名", "昇順"); });
  await step(3, async () => { await list.件数を選ぶ(10); });
  await expected(async () => {
    expect.soft(await list.名前略称.inputValue(), "検索条件「SORT」が復元される").toBe(rc("SORT"));
    expect.soft(await list.並び項目.inputValue(), "並べ替えの項目（イベント名）").toBe("eventName");
    expect.soft(await list.ソート順.inputValue(), "ソート順（昇順）").toBe("a");
    expect.soft(await list.結果のID(), "イベント名の昇順の表示順").toEqual([
      notes.get("〔イベントID-M1301-共有-SORT-B〕"), notes.get("〔イベントID-M1301-共有-SORT-A〕"), notes.get("〔イベントID-M1301-共有-SORT-C〕")]);
  });
});

caseTest("IT-M13-01-021", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); await list.クリアを押す(); await list.名前略称で検索する(rc("SORT")); });
  await step(2, async () => { await list.並びを選ぶ("イベント名", "昇順"); });
  await step(3, async () => { await list.並びを選ぶ("イベントID", "降順"); });
  await expected(async () => {
    expect.soft(await list.結果のID(), "リクエストの指定（イベントID降順）が優先された表示順").toEqual([
      notes.get("〔イベントID-M1301-共有-SORT-C〕"), notes.get("〔イベントID-M1301-共有-SORT-B〕"), notes.get("〔イベントID-M1301-共有-SORT-A〕")]);
  });
});

caseTest("IT-M13-01-022", async ({ page, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page);
  await step(1, async () => { await list.開く(); await list.クリアを押す(); await list.名前略称で検索する(rc("SORT")); });
  await step(2, async () => {
    // ソート順の選択肢に値「invalid-order」を追加して選び、変更を送信する
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load" }),
      list.ソート順.evaluate((el) => {
        const sel = el as HTMLSelectElement;
        const o = document.createElement("option"); o.value = "invalid-order"; o.textContent = "invalid-order"; sel.appendChild(o); sel.value = "invalid-order";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }),
    ]);
  });
  await expected(async () => {
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect.soft(text, "並び順のエラーが表示される").toMatch(/並び|ソート|不正|正しくない/);
    expect.soft(await list.結果の表が表示されている(), "検索結果の表が表示されない初期表示へ戻る").toBe(false);
  });
});

caseTest("IT-M13-01-024", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const id = notes.get("〔イベントID-M1301-024〕");
  await step(1, async () => { await list.開く(); await list.クリアを押す(); await list.名前略称で検索する(rc("ページ対象")); });
  await step(2, async () => { await list.件数を選ぶ(10); });
  await step(3, async () => { await list.ページを選ぶ(2); });
  await step(4, async () => { await list.編集ボタンを押す(id); await list.削除して確認する(id); });
  await step(5, async () => { await page.waitForLoadState("load"); /* 確認画面の「OK」は手順4で押した */ });
  await expected(async () => {
    expect.soft(await list.現在のページ(), "ページ番号（1へ補正される）").toBe(1);
    expect.soft((await list.結果のID()).length, "1ページ目に検索結果が表示される").toBeGreaterThan(0);
  });
});

caseTest("IT-M13-01-046", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const a = notes.get("〔イベントID-M1301-046A〕");
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称で検索する(rc("M1301-046")); });
  await step(4, async () => { await list.件数を選ぶ(10); });
  await step(5, async () => {
    await list.ページを選ぶ(2);
    expect.soft(await list.結果のID(), "2ページ目にID 〔イベントID-M1301-046A〕が表示される").toContain(a);
  });
  await step(6, async () => { await list.開く(); });
  await step(7, async () => { await list.クリアを押す(); });
  await step(8, async () => { await list.名前略称で検索する(rc("M1301-046")); });
  await expected(async () => {
    const got = await list.結果のID();
    expect.soft(await list.現在のページ(), "表示中のページ（1ページ目）").toBe(1);
    expect.soft(got.length, "1ページ目の件数").toBe(10);
    expect.soft(got, "ID 〔イベントID-M1301-046A〕が表示されない").not.toContain(a);
  });
});

caseTest("IT-M13-01-047", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1301_ADMIN);
  const list = new EventListPage(page); const a = notes.get("〔イベントID-M1301-047A〕"); const b = notes.get("〔イベントID-M1301-047B〕");
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.クリアを押す(); });
  await step(3, async () => { await list.名前略称で検索する(rc("M1301-047")); });
  await step(4, async () => { await list.件数を選ぶ(10); });
  await step(5, async () => { await list.ページを選ぶ(2); });
  await step(6, async () => { await list.編集ボタンを押す(b); await list.削除して確認する(b); });
  await step(7, async () => { await page.waitForLoadState("load"); /* 確認画面の「OK」は手順6で押した */ });
  await expected(async () => {
    expect.soft(await list.現在のページ(), "ページ番号（2ページ目のまま）").toBe(2);
    expect.soft(await list.結果のID(), "表示されるイベント（ID 〔イベントID-M1301-047A〕だけ）").toEqual([a]);
  });
});
