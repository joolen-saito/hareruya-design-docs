/**
 * M15-01 デッキ検索・一覧。ケースの正本: integration_test/casegen/cases/M15-01_test_cases.tsv
 * 手元の環境には開発用のデッキが5万件以上ある。検索結果は新しいデッキ（デッキIDの大きい順）が先頭に出るので、
 * 今回作ったデッキはいつも先頭側に表示される。「〜だけが表示される」と確かめるケースは、開発用のデッキが混ざれば不合格でなく未判定（開発用データ）にする。
 * 決め打ちのデッキ名・フォーマット名などは、検索語に使える前半に実行の印を付けて作っている（rc）。
 */
import { test, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { デッキ一覧, デッキのタグ, 基線のアーキタイプ, 選んだ店舗 } from "../../pages/admin/m15_deck";
import { chooseByLabel } from "../../pages/admin/common";
import { デッキ一括編集, デッキIDで検索する } from "../../pages/admin/m15_04_bulk_edit";
import { DeckSearchModal, DeckTopPage } from "../../pages/front/f09_01_deck_top";
import { DeckResultPage } from "../../pages/front/f09_02_deck_result";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar } from "../../lib/session";
import { available as DB使える } from "../../lib/db";
import {
  M1501_ADMIN_A, M1501_ADMIN_B, マスタ名, ページ試験の語, 青空の語, 店舗の語020, 更新者の語021, 稲穂確認のカード名日, タグ検索の語, 一括後の型, 一括の前後098, 組合せの選手前, 組合せの選手後,
} from "../../seeds/m15-01";
import { デッキの文字項目, デッキの保存内容を読む, メインボードのカード, 最終更新者の名前, 店舗の表示順 } from "../../db/m15_deck";

/** ログイン。操作の待ちは時間切れを付けて、止まったら落とす */
async function login(page: Page, a: typeof M1501_ADMIN_A): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, a);
}
const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const path = (page: Page) => new URL(page.url()).pathname;
const 一覧のパス = new URL(adminUrl("/deck")).pathname;
const 日付 = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(d);

/** 日付クリアを押してから検索する */
async function 日付をクリアして検索する(l: デッキ一覧) { await l.日付クリア.click(); await l.検索する(); }
/** ID 以外の開発用データが混ざっていないか（今回作ったデッキだけが並ぶか）を確かめるための、表示されたIDの集まり */
const 含む = (ids: string[], 期待: string[]) => 期待.every((i) => ids.includes(i));

caseTest("IT-M15-01-001", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await 日付をクリアして検索する(l); });
  let 検索欄 = "", 結果 = "", 並べ替え: string[] = [], csv: string[] = [];
  await step(3, async () => {
    検索欄 = (await page.locator("#admin_search_deck").innerText()).replace(/\s+/g, " ");
    結果 = (await page.locator(".deck-result-table").first().innerText().catch(() => "")).replace(/\s+/g, " ");
    並べ替え = (await l.並べ替え項目.locator("option").allInnerTexts()).map((t) => t.trim());
    csv = (await page.locator("button, a").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => /CSV/.test(t));
  });
  await step(4, async () => { await l.一括編集.click(); await expect(l.一括編集パネル, "一括編集欄").toBeVisible(); });
  await expected(async () => {
    for (const w of ["旧デッキID", "DCIナンバー", "勝利数", "敗北数", "引き分け数"]) expect.soft(検索欄.includes(w), `検索入力欄に「${w}」が表示されている`).toBe(false);
    expect.soft(/\d+\s*-\s*\d+\s*-\s*\d+/.test((await page.locator(".deck-result-table").first().innerText().catch(() => "")).replace(/勝利数-敗北数-引き分け数/, "") ) && 結果.includes("勝利数-敗北数-引き分け数"), "検索結果に「勝利数-敗北数-引き分け数」が表示されている").toBe(false);
    for (const w of ["DCIナンバー", "勝利数", "敗北数", "引き分け数"]) expect.soft(並べ替え.some((o) => o.includes(w)), `並べ替え項目の選択肢に「${w}」がある`).toBe(false);
    expect.soft(csv.some((t) => t.includes("旧サイト")), "「CSV出力(旧サイト仕様)」が表示されている").toBe(false);
    const 一括 = (await l.一括編集パネル.innerText()).replace(/\s+/g, " ");
    for (const w of ["DCIナンバー", "勝利数", "敗北数", "引き分け数"]) expect.soft(一括.includes(w), `一括編集に「${w}」が表示されている`).toBe(false);
  });
});

caseTest("IT-M15-01-002", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  let 見出し: string[] = [];
  await step(2, async () => { 見出し = (await page.locator("#admin_search_deck label").allInnerTexts()).map((t) => t.trim()); });
  await expected(async () => {
    expect.soft(見出し.includes("イベント詳細ID"), "イベント詳細IDの検索欄が表示されている").toBe(true);
    expect.soft(見出し.includes("イベントID"), "イベントIDの検索欄が表示されている").toBe(false);
  });
});

caseTest("IT-M15-01-003", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  let from = "";
  await step(2, async () => { from = await l.f("event_date_from").inputValue(); });
  await step(3, async () => { await 日付をクリアして検索する(l); });
  let 既定 = "";
  await step(4, async () => { 既定 = (await l.件数選択.locator("option:checked").innerText()).trim(); });
  await expected(async () => {
    const d = new Date(`${日付(new Date())}T00:00:00+09:00`); d.setMonth(d.getMonth() - 3);
    expect.soft(from.replace(/\//g, "-"), "初期表示のイベント開催日(From)（実行日の3か月前）").toBe(日付(d));
    expect.soft(既定, "検索後の既定の表示件数").toBe("100件");
  });
});

caseTest("IT-M15-01-005", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); await 日付をクリアして検索する(l); });
  let 名前1: string[] = [];
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並べ替え項目.selectOption({ label: "デッキ名" })]);
    await l.結果を待つ();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並び順.selectOption({ label: "昇順" })]);
    await l.結果を待つ();
    名前1 = await l.表示されたデッキ名();
  });
  await step(3, async () => {
    await page.getByRole("link", { name: "デッキ管理" }).first().click().catch(() => {});
    const m = page.getByRole("link", { name: "デッキ一覧" }).first();
    if (await m.isVisible().catch(() => false)) { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), m.click()]); }
    else { note("サイドメニューからデッキ一覧を開けなかったため、デッキ一覧のアドレスを直接開いた"); await l.開く(); }
  });
  await step(4, async () => { await 日付をクリアして検索する(l); });
  await expected(async () => {
    const 名前 = await l.表示されたデッキ名();
    const 並び = 名前.map((n) => (n === "-" ? "" : n));
    expect.soft(並び.every((n, i) => i === 0 || 並び[i - 1].localeCompare(n, "ja") <= 0), "検索結果がデッキ名の昇順で表示されている").toBe(true);
    expect.soft(await l.並べ替え項目.locator("option:checked").innerText(), "並べ替え項目が、初期表示前に選んだデッキ名のまま").toBe("デッキ名");
    expect.soft(await l.並び順.locator("option:checked").innerText(), "並び順が、初期表示前に選んだ昇順のまま").toBe("昇順");
    note(`手順2のあとの先頭のデッキ名: ${名前1.slice(0, 3).join(" / ")}。今回作ったデッキ ${[notes.get("〔デッキID-M1501-005A〕")].join("")} ほか4件のデッキ名は先頭側に出るとは限らない（開発用のデッキが多数ある）`);
  });
});

caseTest("IT-M15-01-007", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.新規登録.click()]); });
  await expected(async () => { expect(path(page), "表示された画面（デッキ新規登録）").toBe(`${一覧のパス}/new`); });
});

caseTest("IT-M15-01-008", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => {
    // 画面の表示は「CSV登録」（正本の「CSV,TSV取り込み」に当たる位置のボタン）
    note("画面のボタンの表示は「CSV登録」で、正本の「CSV,TSV取り込み」とは文言が違う。同じ位置にあるデッキ登録CSVの入口を押した");
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }), page.locator('a[href$="/deck/csv_import"]').click({ timeout: 30_000 })]);
  });
  await expected(async () => {
    expect.soft(path(page), "表示された画面（デッキ登録CSV, TSVアップロード）").toBe(`${一覧のパス}/csv_import`);
    expect.soft((await page.locator("body").innerText()).includes("CSV"), "画面に「CSV」の文字がある").toBe(true);
  });
});

caseTest("IT-M15-01-009", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  await step(2, async () => { await l.f("event_date_to").fill("2025-08-31"); });
  await step(3, async () => { await l.日付クリア.click(); });
  await expected(async () => {
    expect.soft(await l.f("event_date_from").inputValue(), "イベント開催日(From)").toBe("");
    expect.soft(await l.f("event_date_to").inputValue(), "イベント開催日(To)").toBe("");
  });
});

caseTest("IT-M15-01-018", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B, C, D] = ["A", "B", "C", "D"].map((x) => notes.get(`〔デッキID-M1501-018${x}〕`));
  await l.開く();
  let r1: string[] = [], r2: string[] = [], r3: string[] = [];
  await step(1, async () => { await l.日付クリア.click(); await l.f("event_date_from").fill("2025-08-01"); await l.検索する(); r1 = await l.表示されたID(); });
  await step(2, async () => { await l.条件をクリアする(); await l.f("event_date_to").fill("2025-08-31"); await l.検索する(); r2 = await l.表示されたID(); });
  await step(3, async () => { await l.条件をクリアする(); await l.f("event_date_from").fill("2025-08-01"); await l.f("event_date_to").fill("2025-08-31"); await l.検索する(); r3 = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(含む(r1, [B, C, D]) && !r1.includes(A), "Fromだけ: 開催日が8/1 0:00以降のデッキ（B・C・D）が表示され、前のA が表示されない").toBe(true);
    expect.soft(含む(r2, [A, B, C]) && !r2.includes(D), "Toだけ: 開催日が8/31 23:59:59以前のデッキ（A・B・C）が表示され、後のD が表示されない").toBe(true);
    expect.soft(含む(r3, [B, C]) && !r3.includes(A) && !r3.includes(D), "両方: 境界を含むB・C が表示され、A・D が表示されない").toBe(true);
  });
});

caseTest("IT-M15-01-019", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B, C, D] = ["A", "B", "C", "D"].map((x) => notes.get(`〔デッキID-M1501-019${x}〕`));
  await l.開く();
  let r1: string[] = [], r2: string[] = [], r3: string[] = [];
  await step(1, async () => { await l.日付クリア.click(); await l.f("ranking_from").fill("5"); await l.検索する(); r1 = await l.表示されたID(); });
  await step(2, async () => { await l.条件をクリアする(); await l.日付クリア.click(); await l.f("ranking_to").fill("10"); await l.検索する(); r2 = await l.表示されたID(); });
  await step(3, async () => { await l.条件をクリアする(); await l.日付クリア.click(); await l.f("ranking_from").fill("5"); await l.f("ranking_to").fill("10"); await l.検索する(); r3 = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(含む(r1, [B, C, D]) && !r1.includes(A), "Fromだけ: 順位5以上のデッキ（B・C・D）が表示され、A が表示されない").toBe(true);
    expect.soft(含む(r2, [A, B, C]) && !r2.includes(D), "Toだけ: 順位10以下のデッキ（A・B・C）が表示され、D が表示されない").toBe(true);
    expect.soft(含む(r3, [B, C]) && !r3.includes(A) && !r3.includes(D), "両方: 順位5〜10のB・C が表示され、A・D が表示されない").toBe(true);
  });
});

caseTest("IT-M15-01-025", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-025〕");
  await l.開く();
  let r1: string[] = [], r2: string[] = [];
  await step(1, async () => { await l.日付クリア.click(); await l.f("card").fill("稲妻"); await l.検索する(); r1 = await l.表示されたID(); });
  await step(2, async () => { await l.条件をクリアする(); await l.f("card").fill("Lightning Bolt"); await l.検索する(); r2 = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(r1.includes(id), "カード名(日)「稲妻」の検索結果に、今回のデッキが表示される").toBe(true);
    expect.soft(r2.includes(id), "カード名(英)「Lightning Bolt」の検索結果に、今回のデッキが表示される").toBe(true);
    expect.soft(r1.filter((x) => x !== id).length, "カード名(日)の検索結果に、ほかのデッキ（開発用データ）が表示されていない件数").toBe(0);
    expect.soft(r2.filter((x) => x !== id).length, "カード名(英)の検索結果に、ほかのデッキ（開発用データ）が表示されていない件数").toBe(0);
  });
});

caseTest("IT-M15-01-030", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await l.開く();
  await step(1, async () => { await 日付をクリアして検索する(l); });
  let 選択肢: string[] = [], 既定 = "";
  await step(2, async () => { 選択肢 = (await l.件数選択.locator("option").allInnerTexts()).map((t) => t.trim()); 既定 = (await l.件数選択.locator("option:checked").innerText()).trim(); });
  await expected(async () => {
    expect.soft(選択肢, "件数の選択肢").toEqual(["10件", "50件", "100件", "300件", "500件", "1000件", "2000件", "10000件", "12000件"]);
    expect.soft(既定, "既定値").toBe("100件");
  });
});

caseTest("IT-M15-01-033", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await l.開く();
  await step(1, async () => { await 日付をクリアして検索する(l); });
  let 選択肢: string[] = [];
  await step(2, async () => { 選択肢 = (await l.並べ替え項目.locator("option").allInnerTexts()).map((t) => t.trim()); });
  await expected(async () => {
    expect.soft(選択肢, "並べ替え項目の選択肢").toEqual(["デッキID", "順位", "イベント開催日", "イベント名(日)", "イベント名(英)", "デッキ名", "プレイヤー名"]);
  });
});

caseTest("IT-M15-01-036", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await l.開く();
  await step(1, async () => { await 日付をクリアして検索する(l); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並べ替え項目.selectOption({ label: "デッキ名" })]);
    await l.結果を待つ();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.並び順.selectOption({ label: "昇順" })]);
    await l.結果を待つ();
  });
  let 不正後: { 結果あり: boolean; 異常表示: string } = { 結果あり: true, 異常表示: "" };
  await step(3, async () => {
    await page.locator("#admin_search_deck .hidden_sort_order").evaluate((e) => { (e as HTMLInputElement).value = "INVALID"; });
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.検索ボタン.click()]);
    不正後 = {
      結果あり: (await page.getByText(/検索結果：\d+件が該当しました/).count()) > 0,
      異常表示: (await page.locator(".alert-danger, .invalid-feedback, .form-error-message, .text-danger").allInnerTexts()).map((t) => t.trim()).filter(Boolean).join(" / "),
    };
  });
  await step(4, async () => { await 日付をクリアして検索する(l); });
  await expected(async () => {
    expect.soft(不正後.異常表示 !== "", `並び順が不正のとき、エラーが表示される（表示: ${不正後.異常表示 || "なし"}）`).toBe(true);
    expect.soft(不正後.結果あり, "並び順が不正のとき、検索結果が出ない初期画面になる（結果が表示された＝true）").toBe(false);
    const 並び = (await l.表示されたデッキ名()).map((n) => (n === "-" ? "" : n));
    expect.soft(並び.every((n, i) => i === 0 || 並び[i - 1].localeCompare(n, "ja") <= 0), "再検索した一覧が、保持されているデッキ名の昇順で表示されている").toBe(true);
    expect.soft(await l.並べ替え項目.locator("option:checked").innerText(), "並べ替え項目が保持されている").toBe("デッキ名");
  });
});

/** デッキ名の検索語で検索して、行を開く */
async function 名前で検索する(l: デッキ一覧, 語: string) { await l.開く(); await l.日付クリア.click(); await l.f("deck_name").fill(語); await l.検索する(); }

caseTest("IT-M15-01-042", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-042〕");
  await step(1, async () => { await 名前で検索する(l, rc("青空")); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行(id).locator(`a[href$="/deck/${id}/edit"]`).first().click()]); });
  await expected(async () => { expect(path(page), "表示された画面（そのデッキの編集）").toBe(`${一覧のパス}/${id}/edit`); });
});

caseTest("IT-M15-01-043", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-043〕");
  await step(1, async () => { await 名前で検索する(l, rc("青空")); });
  await step(2, async () => { await l.メニュー(id).click(); });
  await expected(async () => {
    const m = l.行(id).locator(".dropdown-menu");
    await expect.soft(m.getByRole("link", { name: "編集" }), "そのデッキの操作項目「編集」").toBeVisible();
    await expect.soft(m.locator(".deck-delete-button"), "そのデッキの操作項目「削除」").toBeVisible();
  });
});

caseTest("IT-M15-01-044", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-044〕");
  await step(1, async () => { await 名前で検索する(l, rc("青空")); });
  await step(2, async () => { await l.メニュー(id).click(); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行(id).locator(".dropdown-menu").getByRole("link", { name: "編集" }).click()]); });
  await expected(async () => { expect(path(page), "表示された画面（そのデッキの編集）").toBe(`${一覧のパス}/${id}/edit`); });
});

/** 一括操作の送信から、なりすまし対策トークンの入力を取り除く（開発者ツールで消す手順） */
const トークンを消す = (page: Page) => page.locator("#bulk_form_token").evaluate((e) => e.remove());

caseTest("IT-M15-01-049", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-049〕");
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); await l.選択(id).check(); });
  await step(2, async () => { await トークンを消す(page); });
  await step(3, async () => {
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.一括削除.click()]);
  });
  await expected(async () => {
    expect.soft(path(page), "表示された画面（デッキ検索・一覧）").toBe(一覧のパス);
    expect.soft((await page.locator("body").innerText()).includes("セッションがタイムアウトしました。もう一度やり直してください。"), "有効期限切れのメッセージが表示される").toBe(true);
  });
});

caseTest("IT-M15-01-051", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1501-051${x}〕`));
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(`${A},${B},${C}`); await l.検索する(); });
  await step(2, async () => { await l.選択(A).check(); await l.選択(B).check(); });
  let text = "";
  await step(3, async () => {
    const [dl] = await Promise.all([page.waitForEvent("download"), l.CSV出力.click()]);
    const chunks: Buffer[] = [];
    for await (const c of await dl.createReadStream()) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    text = decodeCsvBytes(Buffer.concat(chunks));
  });
  let rows: string[][] = [];
  await step(4, async () => { rows = parseCsv(text); });
  await expected(async () => {
    const all = rows.flat();
    expect.soft(rows.length > 1, "CSVがダウンロードされ、見出しのほかに行がある").toBe(true);
    expect.soft(all.includes(A) && all.includes(B), "選択したデッキ（A・B）の情報が出力されている").toBe(true);
    expect.soft(all.includes(C), "選択しなかったデッキ（C）が出力に含まれている").toBe(false);
  });
});

caseTest("IT-M15-01-052", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-052〕");
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); await l.選択(id).check(); });
  await step(2, async () => { await トークンを消す(page); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.CSV出力.click()]); });
  await expected(async () => {
    expect.soft(path(page), "表示された画面（デッキ検索・一覧）").toBe(一覧のパス);
    expect.soft((await page.locator("body").innerText()).includes("セッションがタイムアウトしました。もう一度やり直してください。"), "有効期限切れのメッセージが表示される").toBe(true);
  });
});

async function 一括編集を開く(l: デッキ一覧, id: string) {
  await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); await l.選択(id).check();
}
async function 一括の変更チェック(page: Page, 項目: string) { await page.locator(`input.toggle_bulk_update_check[name="change_flgs[${項目}]"]`).check(); }
const 一括の欄 = (page: Page, 項目: string) => page.locator(`#bulk_edit_panel [name="admin_deck_bulk_update[${項目}]"], #bulk_edit_panel [name="admin_deck_bulk_update[${項目}][]"]`);

caseTest("IT-M15-01-054", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-054〕");
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); });
  await step(2, async () => { await l.一括編集.click(); });
  await expected(async () => { await expect(l.一括編集パネル, "一括編集のアコーディオン").toBeVisible(); });
});

caseTest("IT-M15-01-056", async ({ page, step, expected, notes, db }) => {
  void db;
  await login(page, M1501_ADMIN_B);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-056〕");
  await step(1, async () => { await 一括編集を開く(l, id); });
  await step(2, async () => { await l.一括編集.click(); await expect(l.一括編集パネル).toBeVisible(); });
  await step(3, async () => { await 一括の変更チェック(page, "result"); await 一括の欄(page, "result").fill("更新者確認"); });
  await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#bulk_update_execute").click()]); });
  let 更新者: string | null = null;
  await step(5, async () => { 更新者 = 最終更新者の名前(id); });
  await expected(async () => { expect(更新者, "デッキの最終更新者").toBe("M15-01試験管理者B"); });
});

caseTest("IT-M15-01-058", async ({ page, step, expected, notes, db }) => {
  void db;
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-058〕");
  const 値 = { 日: "あ".repeat(255), 英: "A".repeat(255), 成績: "B".repeat(32), 選手: "C".repeat(64), URL: "U".repeat(255) };
  await step(1, async () => { await 一括編集を開く(l, id); });
  await step(2, async () => { await l.一括編集.click(); await expect(l.一括編集パネル).toBeVisible(); });
  await step(3, async () => {
    for (const [k, v] of [["eventNameJp", 値.日], ["eventNameEn", 値.英], ["result", 値.成績], ["playerName", 値.選手], ["sourceUrl", 値.URL]] as const) {
      await 一括の変更チェック(page, k);
      await 一括の欄(page, k).fill(v);
    }
  });
  await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#bulk_update_execute").click()]); });
  let r = デッキの文字項目(id);
  await step(5, async () => { r = デッキの文字項目(id); });
  await expected(async () => {
    expect.soft(r.イベント名日.length, "イベント名(日)の文字数").toBe(255);
    expect.soft(r.イベント名日 === 値.日, "イベント名(日)が入力値で更新された").toBe(true);
    expect.soft(r.イベント名英 === 値.英, "イベント名(英)が入力値（255文字）で更新された").toBe(true);
    expect.soft(r.成績 === 値.成績, "成績が入力値（32文字）で更新された").toBe(true);
    expect.soft(r.プレイヤー名 === 値.選手, "プレイヤー名が入力値（64文字）で更新された").toBe(true);
    expect.soft(r.引用元URL === 値.URL, "引用元URLが入力値（255文字）で更新された").toBe(true);
  });
});

function 一括編集の実行(no: "060" | "062", 値: string): CaseBody {
  return async ({ page, step, expected, notes }) => {
    await login(page, M1501_ADMIN_A);
    const l = new デッキ一覧(page);
    const id = notes.get(`〔デッキID-M1501-${no}〕`);
    await step(1, async () => { await 一括編集を開く(l, id); });
    await step(2, async () => { await l.一括編集.click(); await expect(l.一括編集パネル).toBeVisible(); });
    await step(3, async () => { await 一括の変更チェック(page, "result"); await 一括の欄(page, "result").fill(値); });
    if (no === "060") {
      await step(4, async () => { await トークンを消す(page); });
      await step(5, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#bulk_update_execute").click()]); });
    } else {
      await step(4, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("#bulk_update_execute").click()]); });
    }
    await expected(async () => {
      expect.soft(path(page).startsWith(一覧のパス) && !/\/(new|\d+\/edit)$/.test(path(page)), "表示された画面（デッキ検索・一覧）").toBe(true);
    });
  };
}
caseTest("IT-M15-01-060", 一括編集の実行("060", "期限切れ確認"));
caseTest("IT-M15-01-062", 一括編集の実行("062", "遷移確認"));

caseTest("IT-M15-01-063", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const id = notes.get("〔デッキID-M1501-063〕");
  const 編集 = adminUrl(`/deck/${id}/edit`);
  await step(1, async () => { await page.goto(編集); await page.waitForLoadState("load"); });
  await step(2, async () => { await page.locator('[name="admin_deck[textMain]"]').fill("4 Lightning Bolt\nLightning Bolt"); });
  await step(3, async () => { await page.locator('button[type="submit"][form="admin_deck"]').first().click(); await page.waitForLoadState("load"); });
  let 画面 = "", 留まった = false;
  await step(4, async () => { 留まった = path(page) === `${一覧のパス}/${id}/edit`; 画面 = (await page.locator("body").innerText()).replace(/\s+/g, " "); await page.goto(編集); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect.soft(/2\s*行目に、異常な値が入力されています/.test(画面), "メインボードの2行目を示す異常値のメッセージ（M15-01-MSG-008）が表示される").toBe(true);
    expect.soft(留まった, "デッキ編集画面に留まる").toBe(true);
    expect.soft(await page.locator('[name="admin_deck[textMain]"]').inputValue(), "開き直したメインボードが保存前のまま").toBe("4 Lightning Bolt");
  });
});

/** 候補欄（select2）に語を1文字ずつ入れて、絞り込まれた候補の表示名を読む。複数選択は欄の中で、単一選択は開いた候補の上の検索欄で入れる */
async function 候補を読む(page: Page, 欄: ReturnType<Page["locator"]>, 語: string): Promise<string[]> {
  const box = 欄.locator("xpath=following-sibling::span[contains(@class,'select2')]").first();
  await box.click();
  await expect(page.locator(".select2-dropdown").first(), "候補の一覧").toBeVisible();
  // 開いた候補の検索欄にフォーカスが入っている。1文字ずつ打って絞り込みを待つ
  await page.keyboard.type(語, { delay: 60 });
  await page.waitForTimeout(1000);
  return (await page.locator(".select2-container--open .select2-results__option").allInnerTexts()).map((t) => t.trim());
}

const 候補の確認 = (候補: string[], 語: string, 他: string, 欄: string) => {
  expect.soft(候補.some((t) => t.includes(rc(語))), `${欄}の候補に「${語}」が表示される`).toBe(true);
  expect.soft(候補.some((t) => t.includes(rc(他))), `${欄}の候補に「${他}」が表示されない`).toBe(false);
};

function 検索欄の候補(no: string, 欄名: string, 欄: string, 語: string, 他: string): CaseBody {
  return async ({ page, step, expected }) => {
    await login(page, M1501_ADMIN_A);
    const l = new デッキ一覧(page);
    let 候補: string[] = [];
    await step(1, async () => { await l.開く(); });
    await step(2, async () => { 候補 = await 候補を読む(page, l.f(欄名), rc(語)); });
    await step(3, async () => { await expect(page.locator(".select2-dropdown").first(), `${欄}の候補が開いている`).toBeVisible(); });
    await expected(async () => {
      候補の確認(候補, 語, 他, 欄);
      if (no === "069") expect.soft(候補.some((t) => t.includes(rc("M1501-069-Fmt"))), "候補にそのフォーマット名「M1501-069-Fmt」も表示される").toBe(true);
    });
  };
}
caseTest("IT-M15-01-067", 検索欄の候補("067", "formats", "フォーマット欄", "M1501-067-Alpha", "M1501-067-Zulu"));
caseTest("IT-M15-01-069", 検索欄の候補("069", "archetypes", "アーキタイプ欄", "M1501-069-Arc1", "M1501-069-Zulu"));
caseTest("IT-M15-01-070", 検索欄の候補("070", "deck_tags", "タグ欄", "M1501-070-TagA", "M1501-070-Zulu"));

caseTest("IT-M15-01-068", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  let 候補: string[] = [];
  await step(1, async () => { await l.開く(); });
  await step(2, async () => {
    note("カラーの検索欄は文字を入力する欄でなく、カラーごとのチェックの一覧のため、語を入力できない。一覧に並んだカラー名をそのまま候補として読む");
    await expect(page.locator("#admin_search_deck .deck-search-check").first(), "カラーのチェックの一覧").toBeVisible();
  });
  await step(3, async () => { 候補 = (await l.f("color").evaluateAll((es) => es.map((e) => (e.closest("div")?.textContent ?? "").trim()))); });
  await expected(async () => {
    const 全部 = (await page.locator("#admin_search_deck").innerText()).replace(/\s+/g, " ");
    expect.soft(全部.includes("M1501-068-Aka"), "カラー欄の候補に「M1501-068-Aka」が表示される").toBe(true);
    expect.soft(全部.includes("M1501-068-Zulu"), "カラー欄の候補に「M1501-068-Zulu」が表示される（表示されないはず）").toBe(false);
    void 候補;
  });
});

/** 一括編集欄（単一選択）の候補 */
async function 一括の候補(page: Page, l: デッキ一覧, id: string, 項目: string, 語: string): Promise<string[]> {
  await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する();
  await l.一括編集.click(); await expect(l.一括編集パネル).toBeVisible();
  await 一括の変更チェック(page, 項目);
  return 候補を読む(page, 一括の欄(page, 項目), 語);
}

function 一括の候補確認(no: string, 項目: string, 欄: string, 語: string, 他: string): CaseBody {
  return async ({ page, step, expected, notes }) => {
    await login(page, M1501_ADMIN_A);
    const l = new デッキ一覧(page);
    const id = notes.get(`〔デッキID-M1501-${no}〕`);
    let 候補: string[] = [];
    await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); });
    await step(2, async () => { await l.一括編集.click(); await expect(l.一括編集パネル).toBeVisible(); await 一括の変更チェック(page, 項目); });
    await step(3, async () => { 候補 = await 候補を読む(page, 一括の欄(page, 項目), rc(語)); });
    await step(4, async () => { await expect(page.locator(".select2-dropdown").first(), `一括編集の${欄}の候補が開いている`).toBeVisible(); });
    await expected(async () => {
      expect.soft(候補.some((t) => t.includes(rc(語))), `一括編集の${欄}の候補に「${語}」が表示される`).toBe(true);
      expect.soft(候補.some((t) => t.includes(rc(他))), `一括編集の${欄}の候補に「${他}」が表示されない`).toBe(false);
    });
  };
}
caseTest("IT-M15-01-077", 一括の候補確認("077", "format", "フォーマット欄", "M1501-077-Alpha", "M1501-077-Zulu"));
caseTest("IT-M15-01-078", 一括の候補確認("078", "archetype", "アーキタイプ欄", "M1501-078-Arc1", "M1501-078-Zulu"));
caseTest("IT-M15-01-079", 一括の候補確認("079", "deckTags", "タグ欄", "M1501-079-TagA", "M1501-079-Zulu"));

function 一括の候補選択(no: string, 項目: string, 欄: string, 語: string): CaseBody {
  return async ({ page, step, expected, notes }) => {
    await login(page, M1501_ADMIN_A);
    const l = new デッキ一覧(page);
    const id = notes.get(`〔デッキID-M1501-${no}〕`);
    await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); });
    await step(2, async () => { await l.一括編集.click(); await expect(l.一括編集パネル).toBeVisible(); await 一括の変更チェック(page, 項目); });
    const 候補 = await (async () => { let c: string[] = []; await step(3, async () => { c = await 候補を読む(page, 一括の欄(page, 項目), rc(語)); }); return c; })();
    await step(4, async () => {
      const hit = page.locator(".select2-container--open .select2-results__option").filter({ hasText: rc(語) }).first();
      await hit.click();
    });
    await expected(async () => {
      expect.soft(候補.some((t) => t.includes(rc(語))), `候補に「${語}」が表示される`).toBe(true);
      const sel = await 一括の欄(page, 項目).evaluate((e) => Array.from((e as HTMLSelectElement).selectedOptions).map((o) => (o.textContent ?? "").trim()));
      expect.soft(sel.some((t) => t.includes(rc(語))), `一括編集の${欄}に「${語}」が選択された状態で表示される`).toBe(true);
    });
  };
}
caseTest("IT-M15-01-091", 一括の候補選択("091", "format", "フォーマット欄", "M1501-091-Alpha"));
caseTest("IT-M15-01-092", 一括の候補選択("092", "archetype", "アーキタイプ欄", "M1501-092-Arc1"));
caseTest("IT-M15-01-093", 一括の候補選択("093", "deckTags", "タグ欄", "M1501-093-TagA"));

caseTest("IT-M15-01-071", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1501-071${x}〕`));
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); });
  let r: string[] = [];
  await step(2, async () => {
    await l.f("deck_name").fill(rc("M1501-071"));
    for (const 名 of ["公開", "非公開"]) await page.locator("#admin_search_deck .deck-search-check label", { hasText: new RegExp(`^\\s*${名}\\s*$`) }).first().click();
    await l.検索する(); r = await l.表示されたID();
  });
  await expected(async () => {
    expect.soft(含む(r, [A, B]), "公開のデッキ（A）と非公開のデッキ（B）が表示される").toBe(true);
    expect.soft(r.includes(C), "選択しなかった限定公開のデッキ（C）が表示される").toBe(false);
    expect.soft(r.length, "表示されたデッキの件数").toBe(2);
  });
});

caseTest("IT-M15-01-095", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1501-095${x}〕`));
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); });
  await step(2, async () => { await l.f("deck_name").fill(rc("M1501-095")); });
  await step(3, async () => { await page.locator("#admin_search_deck .deck-search-check label", { hasText: /^\s*公開\s*$/ }).first().click(); });
  let r: string[] = [];
  await step(4, async () => { await l.検索する(); r = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(r.includes(A), "公開のデッキ（A）が表示される").toBe(true);
    expect.soft(r.includes(B), "非公開のデッキ（B）が表示される").toBe(false);
    expect.soft(r.includes(C), "限定公開のデッキ（C）が表示される").toBe(false);
    expect.soft(r.length, "表示されたデッキの件数").toBe(1);
  });
});

caseTest("IT-M15-01-096", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [S, F, U, N] = ["S", "F", "U", "N"].map((x) => notes.get(`〔デッキID-M1501-096${x}〕`));
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); });
  await step(2, async () => { await l.f("deck_name").fill(rc("M1501-096")); });
  let r: string[] = [];
  await step(3, async () => { await l.検索する(); r = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(含む(r, [S, N]), "大会開始済み（S）とイベント詳細なし（N）が表示される").toBe(true);
    expect.soft(r.includes(F), "大会開始前（F）が表示される").toBe(false);
    expect.soft(r.includes(U), "ユーザ作成（U）が表示される").toBe(false);
    expect.soft(r.length, "表示されたデッキの件数").toBe(2);
  });
});

caseTest("IT-M15-01-097", async ({ page, step, expected, notes }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const A = notes.get("〔デッキID-M1501-097A〕");
  await l.開く();
  await step(1, async () => {
    await l.日付クリア.click(); await l.f("deck_name").fill(rc("M1501-097"));
    await l.検索する();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]);
    await l.結果を待つ();
  });
  let url = "";
  await step(2, async () => { url = (await page.locator('.pagination a.page-link', { hasText: "2" }).first().getAttribute("href")) ?? ""; });
  const tab = await page.context().newPage();
  let ids: string[] = [], 件数 = 0, 条件 = "", 件数表示 = "";
  await step(3, async () => {
    await tab.goto(new URL(url, page.url()).toString());
    await tab.waitForLoadState("load");
    const l2 = new デッキ一覧(tab);
    await l2.結果を待つ();
    ids = await l2.表示されたID(); 件数 = await l2.件数(); 条件 = await l2.f("deck_name").inputValue(); 件数表示 = (await l2.件数選択.locator("option:checked").innerText()).trim();
  });
  await expected(async () => {
    expect.soft(条件, "保持された検索条件のデッキ名").toBe(rc("M1501-097"));
    expect.soft(件数表示, "保持された表示件数").toBe("10件");
    expect.soft(件数, "該当件数").toBe(11);
    expect.soft(ids, "2ページ目に表示されたデッキ").toEqual([A]);
  });
  await tab.close();
});

caseTest("IT-M15-01-099", async ({ page, step, expected, notes, db }) => {
  void db;
  await login(page, M1501_ADMIN_A);
  const id = notes.get("〔デッキID-M1501-099〕");
  await step(1, async () => { await page.goto(adminUrl(`/deck/${id}/edit`)); await page.waitForLoadState("load"); });
  await step(2, async () => { await page.locator('[name="admin_deck[textMain]"]').fill(`4 ${rc("M1501-099-CardA")}\n\n3 ${rc("M1501-099-CardB")}`); });
  await step(3, async () => { await page.locator('button[type="submit"][form="admin_deck"]').first().click(); await page.waitForLoadState("load"); });
  let 保存 = false, カード: { カード名英: string; 枚数: number }[] = [], 文言 = "";
  await step(4, async () => { カード = メインボードのカード(id); 保存 = path(page) === `${一覧のパス}/${id}/edit`; 文言 = (await page.locator(".alert-success").allInnerTexts()).join(" "); });
  await expected(async () => {
    expect.soft(文言.includes("保存しました"), "「保存しました」（M15-01-MSG-010）が表示される").toBe(true);
    expect.soft(保存, "デッキ編集画面に移る").toBe(true);
    expect.soft(カード, "DBのメインボードのカードリスト（空行を含まない2行）").toEqual([{ カード名英: rc("M1501-099-CardA"), 枚数: 4 }, { カード名英: rc("M1501-099-CardB"), 枚数: 3 }]);
  });
});

// ===========================================================================
// 2026-11-11 追加分。依頼者の方針（2026-11-10）:
// - シード表の「本シード以外の同名のデッキを削除する」は行わない。デッキ名の語に実行の印を付け、検索をその語で絞って、今回作ったデッキだけを見る。
// - 共有のマスタ（Standard・Modern・タグA・タグB・東京店 など）には試験の値を足さない。既存のマスタの選択肢で代える（各ケースの注記）。
// - 実装しない: 039（デッキ12001件を作る大量データ）
// ===========================================================================
const 絞りの注記 = "シード表の「本シード以外の同名のデッキを削除する」は行わない（依頼者の方針）。検索のデッキ名は、実行の印を付けた語で、今回作ったデッキだけに絞った";
const 検索結果の文 = /検索結果：\d+件が該当しました/;

/** 手順: 日付クリア → デッキ名に語 → 検索する（一覧は開いてある前提） */
async function 日付クリアして名前で検索する(l: デッキ一覧, 語: string, 追加?: () => Promise<void>) {
  await l.日付クリア.click();
  await l.f("deck_name").fill(語);
  if (追加) await 追加();
  await l.検索する();
}

/** 管理画面のサイドメニューから、デッキ検索・一覧を初期表示する（開けなければアドレスを直接開く。注記に残す） */
async function メニューから一覧を開く(page: Page, l: デッキ一覧) {
  await page.getByRole("link", { name: "デッキ管理" }).first().click().catch(() => {});
  const m = page.getByRole("link", { name: "デッキ一覧" }).first();
  if (await m.isVisible().catch(() => false)) { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), m.click()]); }
  else { note("サイドメニューからデッキ一覧を開けなかったため、デッキ一覧のアドレスを直接開いた"); await l.開く(); }
}

caseTest("IT-M15-01-004", async ({ page, step, expected }) => {
  note(絞りの注記);
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const 語 = ページ試験の語("004");
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await l.f("deck_name").fill(語); await l.検索する(); });
  await step(3, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]);
    await l.結果を待つ();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("ul.pagination a.page-link", { hasText: "2" }).first().click()]);
    await l.結果を待つ();
  });
  let 入力済み: string[] = [], 結果あり = true, 初期の件数選択: string | null = null;
  await step(4, async () => {
    await メニューから一覧を開く(page, l);
    入力済み = await page.locator('#admin_search_deck [name^="admin_search_deck["]').evaluateAll((es) => es.filter((e) => {
      const n = (e as HTMLInputElement).name;
      if (/event_date_from|sortKey|sortOrder|_token/.test(n)) return false;
      if (e instanceof HTMLSelectElement) return Array.from(e.selectedOptions).some((o) => o.value !== "");
      const i = e as HTMLInputElement;
      return i.type === "checkbox" || i.type === "radio" ? i.checked : i.value !== "";
    }).map((e) => (e as HTMLInputElement).name));
    結果あり = (await page.getByText(検索結果の文).count()) > 0 || (await page.locator(".deck-result-table").count()) > 0;
    初期の件数選択 = (await l.件数選択.count()) ? (await l.件数選択.locator("option:checked").innerText()).trim() : null;
  });
  await expected(async () => {
    const d = new Date(`${日付(new Date())}T00:00:00+09:00`); d.setMonth(d.getMonth() - 3);
    expect.soft(入力済み, "検索条件のうち、入力・選択の残っている項目（イベント開催日(From)を除く）").toEqual([]);
    expect.soft((await l.f("event_date_from").inputValue()).replace(/\//g, "-"), "イベント開催日(From)（実行日の3か月前）").toBe(日付(d));
    expect.soft(結果あり, "一覧が表示されている（空＝false）").toBe(false);
    // ページ番号・表示件数は初期表示の画面に出ない。保持している値を引き継いで開く別タブで読む
    const tab = await page.context().newPage();
    try {
      await tab.goto(adminUrl("/deck?resume=1")); await tab.waitForLoadState("load");
      const t = new デッキ一覧(tab);
      await t.結果を待つ();
      const 件数表示 = 初期の件数選択 ?? (await t.件数選択.locator("option:checked").innerText()).trim();
      expect.soft(件数表示, "表示件数").toBe("100件");
      const 現在 = await tab.locator("ul.pagination li.page-item.active").first().innerText().catch(() => "1");
      expect.soft(現在.trim(), "ページ番号").toBe("1");
    } finally { await tab.close(); }
    note("ページ番号と表示件数は初期表示の画面に出ないため、保持された値を引き継いで開く別タブ（一覧のアドレスに、保持値を引き継ぐ指定を付けて開く）で、現在のページと表示件数を読んだ");
  });
});

caseTest("IT-M15-01-006", async ({ page, step, expected, notes }) => {
  note(絞りの注記);
  note("デッキ名はシード表の「A-青空」「B-青空」に実行の印を付けた「A-青空-006-印」「B-青空-006-印」。検索語はその印つきの語（青空-006-印）");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B] = ["A", "B"].map((x) => notes.get(`〔デッキID-M1501-006${x}〕`));
  const 語 = 青空の語("006");
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await l.f("deck_name").fill(語); await l.検索する(); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.CSV出力.click()]); });
  await expected(async () => {
    expect.soft(path(page).startsWith(一覧のパス) && !/\/(new|\d+\/edit)$/.test(path(page)), "表示された画面（デッキ検索・一覧）").toBe(true);
    expect.soft(await l.f("deck_name").inputValue(), "デッキ名の検索条件").toBe(語);
    expect.soft([...(await l.表示されたID())].sort(), "検索結果のデッキ（A・B）").toEqual([A, B].sort());
  });
});

caseTest("IT-M15-01-010", async ({ page, step, expected }) => {
  note("シード表のStandard・タグA・イベント詳細ID「501」のうち、フォーマットとタグは共有のマスタに足さず、検索欄の選択肢の先頭を選んだ（このケースは選んだ値でなく、すべて空に戻ることを確かめる）");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await step(1, async () => { await l.開く(); });
  const 先頭 = async (name: string) => (await l.f(name).locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean)[0];
  await step(2, async () => {
    await l.f("deck_id").fill("1501");
    await l.f("deck_name").fill("青空");
    await chooseByLabel(l.f("formats"), await 先頭("formats"));
    await chooseByLabel(l.f("deck_tags"), await 先頭("deck_tags"));
    await l.f("event_detail_id").fill("501");
  });
  await step(3, async () => { await l.条件をクリアする(); });
  await expected(async () => {
    for (const [name, 欄] of [["deck_id", "デッキID"], ["deck_name", "デッキ名"], ["event_detail_id", "イベント詳細ID"]] as const) {
      expect.soft(await l.f(name).inputValue(), `${欄}の入力欄`).toBe("");
    }
    for (const [name, 欄] of [["formats", "フォーマット"], ["deck_tags", "タグ"]] as const) {
      const 選択 = await l.f(name).evaluate((e) => Array.from((e as HTMLSelectElement).selectedOptions).filter((o) => o.value !== "").map((o) => (o.textContent ?? "").trim()));
      expect.soft(選択, `${欄}の選択`).toEqual([]);
    }
  });
});

caseTest("IT-M15-01-011", async ({ page, step, expected }) => {
  note("シード表のStandard・Modern・Pioneer・カラー・タグ・店舗・管理者の並びのうち、フォーマットとアーキタイプは、実行の印つきのフォーマット3件（並び順 9012・9012・9011、登録はこの順）とアーキタイプ2件を画面で作って並びを確かめた。カラーとタグは共有のマスタに足さず、既存の選択肢があることを確かめた");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const n = マスタ名();
  await step(1, async () => { await l.開く(); });
  const 候補: Record<string, string[]> = {};
  await step(2, async () => {
    for (const name of ["formats", "color", "archetypes", "deck_tags", "shop", "member"]) {
      候補[name] = (await l.f(name).locator("option").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).filter((t) => t && t !== "単一選択");
    }
  });
  await expected(async () => {
    const 位置 = ["フォーマットC", "フォーマットA", "フォーマットB"].map((k) => 候補.formats.indexOf(n[k as "フォーマットA"]));
    expect.soft(位置.every((p) => p >= 0), "フォーマットの選択肢に、作った3件がある").toBe(true);
    expect.soft(位置[0] < 位置[1] && 位置[1] < 位置[2], "フォーマットが表示順（同順位は登録の古い順）に並ぶ（C → A → B）").toBe(true);
    const 正規化 = (s: string) => s.replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")");
    const arc = 候補.archetypes.map(正規化);
    expect.soft(arc.includes(正規化(`${n.アーキタイプ青}(${n.フォーマットA})`)), "アーキタイプが「名前（フォーマット）」の形で表示される（青の組）").toBe(true);
    expect.soft(arc.includes(正規化(`${n.アーキタイプ赤}(${n.フォーマットB})`)), "アーキタイプが「名前（フォーマット）」の形で表示される（赤の組）").toBe(true);
    expect.soft(候補.color.length > 0, "カラーを選択できる（選択肢がある）").toBe(true);
    expect.soft(候補.deck_tags.length > 0, "タグを選択できる（選択肢がある）").toBe(true);
    const a = 候補.member.indexOf("M15-01試験管理者A"), b = 候補.member.indexOf("M15-01試験管理者B");
    expect.soft(a >= 0 && b >= 0 && a < b, "最終更新者の選択肢が表示順に並ぶ（試験管理者A → B）").toBe(true);
    if (DB使える) {
      const 順 = 店舗の表示順();
      const rk = 候補.shop.map((s) => 順.find((x) => x.店舗名 === s)?.順 ?? -1);
      expect.soft(rk.length > 0 && rk.every((r, i) => r >= 0 && (i === 0 || rk[i - 1] <= r)), "開催店舗の選択肢が表示順に並ぶ").toBe(true);
    } else {
      expect.soft(候補.shop.length > 0, "開催店舗を選択できる（選択肢がある）").toBe(true);
      note("DBへの接続先が無い環境のため、開催店舗は選択肢があることだけを確かめた（並び順の確かめはDBの表示順と照らす）");
    }
  });
});

caseTest("IT-M15-01-020", async ({ page, step, expected, notes }) => {
  note(絞りの注記);
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B] = ["A", "B"].map((x) => notes.get(`〔デッキID-M1501-020${x}〕`));
  const 店 = 選んだ店舗();
  note(`東京店は共有のマスタのため作らず、イベントの店舗に選んだ「${店}」で絞った。検索のデッキ名にも、印つきの語を入れた`);
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await chooseByLabel(l.f("shop"), 店); await l.f("deck_name").fill(店舗の語020()); });
  let ids: string[] = [];
  await step(3, async () => { await l.検索する(); ids = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(ids.includes(A), "イベント詳細を経由して店舗に紐づくデッキAが表示される").toBe(true);
    expect.soft(ids.includes(B), "イベント詳細を持たないデッキBが表示されない").toBe(false);
    expect.soft([...ids].sort(), "表示されたのはデッキAだけ").toEqual([A]);
  });
});

caseTest("IT-M15-01-021", async ({ page, step, expected, notes }) => {
  note(絞りの注記);
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, , C, D] = ["A", "B", "C", "D"].map((x) => notes.get(`〔デッキID-M1501-021${x}〕`));
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await chooseByLabel(l.f("member"), "M15-01試験管理者A"); await l.f("deck_name").fill(更新者の語021()); });
  let ids: string[] = [];
  await step(3, async () => { await l.検索する(); ids = await l.表示されたID(); });
  await expected(async () => {
    expect.soft([...ids].sort(), "表示されたのは、最終更新者が試験管理者AのデッキA・C・Dだけ").toEqual([A, C, D].sort());
  });
});

caseTest("IT-M15-01-026", async ({ page, step, expected, notes }) => {
  note("カード名(日)に実行の印を付けた「稲穂確認-…」のカードを作って使った（「稲」だけのカードは作らない）。ほかの開発用データを消す指定は行わない");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-026〕");
  note(`デッキのカード名(日): ${稲穂確認のカード名日()}`);
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await l.f("card").fill("稲"); });
  let ids: string[] = [];
  await step(3, async () => { await l.検索する(); ids = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(ids.includes(id), "カード名が部分一致するだけのデッキが検索結果に表示されない").toBe(false);
  });
});

caseTest("IT-M15-01-027", async ({ page, step, expected, notes }) => {
  note(絞りの注記);
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-027〕");
  const タグ = await デッキのタグ(page, id);
  note(`タグA・タグBは共有のマスタに足さず、既存のデッキタグの先頭2件（${タグ.join("・")}）で代えた`);
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await chooseByLabel(l.f("deck_tags"), タグ); await l.f("deck_name").fill(タグ検索の語("027")); });
  let ids: string[] = [];
  await step(3, async () => { await l.検索する(); ids = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(タグ.length, "デッキが持つタグの数").toBe(2);
    expect.soft([...ids].sort(), "表示されたのは、両方のタグを持つデッキだけ").toEqual([id]);
  });
});

caseTest("IT-M15-01-028", async ({ page, step, expected }) => {
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await l.f("deck_name").fill(rc("存在しない名称")); });
  await step(3, async () => { await l.検索する(); });
  await expected(async () => {
    await expect.soft(page.getByText("検索条件に合致するデータが見つかりませんでした").first(), "検索の結果（該当なし）が表示されている").toBeVisible();
    await expect.soft(l.検索ボタン, "検索条件の入力欄が表示される").toBeVisible();
    expect.soft(await page.locator(".deck-result-table").count(), "デッキ一覧の表").toBe(0);
    expect.soft(await page.locator("ul.pagination").count(), "ページ送り").toBe(0);
  });
});

caseTest("IT-M15-01-029", async ({ page, step, expected, notes }) => {
  note(絞りの注記);
  note("デッキ名はシード表の「A-青空-029」「B-青空-029」に実行の印を付けたもの。検索語は印つきの「青空-029-印」");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B] = ["A", "B"].map((x) => notes.get(`〔デッキID-M1501-029${x}〕`));
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await l.f("deck_name").fill(青空の語("029")); });
  let ids: string[] = [], 件数 = 0;
  await step(3, async () => { await l.検索する(); ids = await l.表示されたID(); 件数 = await l.件数(); });
  await expected(async () => {
    expect.soft(件数, "該当件数").toBe(2);
    expect.soft([...ids].sort(), "表示されたデッキ情報（A・B）").toEqual([A, B].sort());
  });
});

caseTest("IT-M15-01-032", async ({ page, step, expected }) => {
  note(絞りの注記);
  note("検索開始時の表示件数10件は、検索したあとに件数で10件を選んで整えた");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const 語 = ページ試験の語("032");
  await l.開く();
  await step(1, async () => {
    await 日付クリアして名前で検索する(l, 語);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]);
    await l.結果を待つ();
  });
  await step(2, async () => {
    const v = (await l.件数選択.locator("option", { hasText: /^\s*10件\s*$/ }).getAttribute("value")) ?? "";
    const u = new URL(v, page.url());
    if (u.searchParams.get("page_count") !== "10") throw new Error(`件数10件の選択肢のアドレスに表示件数の指定（10）が無い（${v}）`);
    u.searchParams.set("page_count", "11");
    await page.goto(u.toString()); await page.waitForLoadState("load");
    await l.結果を待つ();
  });
  await expected(async () => {
    expect.soft((await l.件数選択.locator("option:checked").innerText()).trim(), "表示件数").toBe("10件");
    expect.soft((await l.表示されたID()).length, "1ページに表示されたデッキ情報の数（11件が該当）").toBe(10);
    expect.soft(await l.件数(), "該当件数").toBe(11);
  });
});

caseTest("IT-M15-01-037", async ({ page, browser, step, expected }) => {
  note(絞りの注記);
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const 語 = ページ試験の語("037");
  await l.開く();
  let url = "";
  await step(1, async () => {
    await 日付クリアして名前で検索する(l, 語);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.件数選択.selectOption({ label: "10件" })]);
    await l.結果を待つ();
    const href = (await page.locator("ul.pagination a.page-link", { hasText: "2" }).first().getAttribute("href")) ?? "";
    url = new URL(href, page.url()).toString();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("ul.pagination a.page-link", { hasText: "2" }).first().click()]);
  });
  const ctxB = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctxB);
    const pageB = await ctxB.newPage();
    await login(pageB, M1501_ADMIN_A);
    const b = new デッキ一覧(pageB);
    await step(2, async () => { await pageB.goto(url); await pageB.waitForLoadState("load"); });
    await expected(async () => {
      await expect.soft(b.検索ボタン, "検索条件の入力欄（初期画面）が表示される").toBeVisible();
      expect.soft(await pageB.getByText(検索結果の文).count(), "検索結果の件数表示").toBe(0);
      expect.soft(await pageB.locator(".deck-result-table").count(), "検索結果の一覧").toBe(0);
    });
  } finally { await ctxB.close(); }
});

caseTest("IT-M15-01-041", async ({ page, step, expected }) => {
  note(絞りの注記);
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const 語 = ページ試験の語("041");
  const 状態 = async () => page.locator("input.searched_deck_id").evaluateAll((es) => ({ 総数: es.length, 選択: es.filter((e) => (e as HTMLInputElement).checked).length }));
  await step(1, async () => { await 名前で検索する(l, 語); });
  await step(2, async () => { await l.全選択.check(); });
  let オン = { 総数: 0, 選択: 0 };
  await step(3, async () => { オン = await 状態(); });
  await step(4, async () => { await l.全選択.uncheck(); });
  await expected(async () => {
    const オフ = await 状態();
    expect.soft(オン.総数, "表示されたデッキ情報の数").toBe(11);
    expect.soft(オン.選択, "オンにしたあと選択されているデッキ情報の数（表示中のすべて）").toBe(オン.総数);
    expect.soft(オフ.選択, "オフにしたあと選択されているデッキ情報の数").toBe(0);
  });
});

caseTest("IT-M15-01-048", async ({ page, step, expected, notes }) => {
  note("デッキに関連する記事は、画面では作れないため、DBで記事とデッキの紐づけを作った（実行の印つきのデッキにだけ）");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-048〕");
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); });
  await step(2, async () => { await l.選択(id).check(); });
  let 遷移先 = "";
  await step(3, async () => {
    page.once("dialog", (d) => { void d.accept(); });
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.一括削除.click()]);
    遷移先 = path(page);
  });
  let ids: string[] = [];
  await step(4, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); ids = await l.表示されたID(); });
  await expected(async () => {
    expect.soft(遷移先.startsWith(一覧のパス) && !/\/(new|\d+\/edit)$/.test(遷移先), "遷移した画面（デッキ検索・一覧）").toBe(true);
    expect.soft(ids, "記事に使用されているデッキが検索結果に残る").toEqual([id]);
  });
});

caseTest("IT-M15-01-053", async ({ page, step, expected, notes }) => {
  note("「デッキID 999999は未登録」は、実行前に確かめていない。登録済みなら、CSVが出力されて画面が移らず、不合格になる");
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const id = notes.get("〔デッキID-M1501-053〕");
  await step(1, async () => { await l.開く(); await l.日付クリア.click(); await l.f("deck_id").fill(id); await l.検索する(); await l.選択(id).check(); });
  await step(2, async () => { await l.選択(id).evaluate((e) => { (e as HTMLInputElement).value = "999999"; }); });
  await step(3, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.CSV出力.click()]); });
  await expected(async () => {
    expect.soft(path(page).startsWith(一覧のパス) && !/\/(new|\d+\/edit)$/.test(path(page)), "遷移した画面（デッキ検索・一覧）").toBe(true);
  });
});

caseTest("IT-M15-01-094", async ({ page, step, expected, notes }) => {
  note(絞りの注記);
  await login(page, M1501_ADMIN_A);
  const l = new デッキ一覧(page);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1501-094${x}〕`));
  const タグ = await デッキのタグ(page, C);
  note(`タグA・タグBは共有のマスタに足さず、既存のデッキタグの先頭2件（${タグ.join("・")}）で代えた。デッキ名「M1501-094」は印つきの語`);
  await l.開く();
  await step(1, async () => { await l.日付クリア.click(); });
  await step(2, async () => { await l.f("deck_name").fill(タグ検索の語("094")); });
  await step(3, async () => { await chooseByLabel(l.f("deck_tags"), タグ); });
  let ids: string[] = [];
  await step(4, async () => { await l.検索する(); ids = await l.表示されたID(); });
  await expected(async () => {
    expect.soft([...ids].sort(), "表示されたのは、両方のタグを持つデッキCだけ").toEqual([C]);
    expect.soft(ids.includes(A) || ids.includes(B), "片方のタグだけを持つデッキA・Bが表示される").toBe(false);
  });
});

/** 一括編集の区画を、デッキIDで検索して選んで開く */
async function 一括編集を始める(page: Page, ids: string[], 選ぶ: string[]) {
  const l = await デッキIDで検索する(page, ids.join(","));
  const b = new デッキ一括編集(page);
  for (const id of 選ぶ) await b.デッキを選ぶ(l, id);
  return { l, b };
}

caseTest("IT-M15-01-055", async ({ page, step, expected, notes, db }) => {
  void db;
  note("検索で日付クリアを押した（シード表の手順に無いが、更新前の開催日が3か月より前のため、初期のイベント開催日(From)のままでは一覧に出ない）。Standard・Modern・Blue Control・Red Aggro・タグA・タグBは共有のマスタに足さず、更新前は既存のマスタの先頭の組とタグ、更新後は実行の印つきのフォーマット・アーキタイプと2件目のタグで代えた。「デッキリスト公開状態を偽」は、デッキリストを公開する側（更新前と同じ値）を選んだ");
  await login(page, M1501_ADMIN_A);
  const [A, B, C] = ["A", "B", "C"].map((x) => notes.get(`〔デッキID-M1501-055${x}〕`));
  const 前 = { A: デッキの保存内容を読む(A), C: デッキの保存内容を読む(C) };
  const 後 = 一括後の型();
  const 後の値 = { イベント名日: "一括更新大会", イベント名英: "Bulk Event", 開催日: "2025-12-01 09:30", 順位: "3", 成績: "3-0", プレイヤー名: "一括選手", 引用元URL: "https://example.com/deck/bulk" };
  let l!: デッキ一覧, b!: デッキ一括編集;
  await step(1, async () => { const l1 = await デッキIDで検索する(page, `${A},${B},${C}`); l = l1; b = new デッキ一括編集(page); });
  await step(2, async () => { await b.デッキを選ぶ(l, A); await b.デッキを選ぶ(l, B); });
  await step(3, async () => { await b.開く(); });
  const 後のタグ = 前.A.タグ.length ? (await b.区画.locator('[name="admin_deck_bulk_update[deckTags][]"] option').allInnerTexts()).map((t) => t.trim()).filter((t) => t && !前.A.タグ.includes(t))[0] : "";
  await step(4, async () => {
    await b.チェック("format", true); await b.フォーマットを選ぶ(後.フォーマット);
    await b.チェック("archetype", true); await b.アーキタイプを選ぶ(後.アーキタイプ);
    await b.チェック("disp", true); await b.公開状態を選ぶ("非公開");
    await b.チェック("privateFlg", true); await b.デッキリスト公開状態を選ぶ("公開");
    await b.チェック("eventNameJp", true); await b.入れる("eventNameJp", 後の値.イベント名日);
    await b.チェック("eventNameEn", true); await b.入れる("eventNameEn", 後の値.イベント名英);
    await b.チェック("eventDate", true); await b.入れる("eventDate", 後の値.開催日.replace(" ", "T"));
    await b.チェック("ranking", true); await b.入れる("ranking", 後の値.順位);
    await b.チェック("result", true); await b.入れる("result", 後の値.成績);
    await b.チェック("playerName", true); await b.入れる("playerName", 後の値.プレイヤー名);
    await b.チェック("deckTags", true); await b.タグを選ぶ([後のタグ]);
    await b.チェック("sourceUrl", true); await b.入れる("sourceUrl", 後の値.引用元URL);
  });
  let 結果 = { 成功: [] as string[], エラー: [] as string[], 入力の不足: [] as string[] };
  await step(5, async () => { 結果 = await b.実行する(); });
  let 保存: Record<string, ReturnType<typeof デッキの保存内容を読む>> = {};
  await step(6, async () => { 保存 = { A: デッキの保存内容を読む(A), B: デッキの保存内容を読む(B), C: デッキの保存内容を読む(C) }; });
  await expected(async () => {
    expect.soft(結果.エラー, "一括編集実行のエラー表示").toEqual([]);
    for (const k of ["A", "B"]) {
      const s = 保存[k];
      expect.soft(s.フォーマット, `デッキ${k}のフォーマット`).toBe(後.フォーマット);
      expect.soft(s.アーキタイプ, `デッキ${k}のアーキタイプ`).toBe(後.アーキタイプ);
      expect.soft(s.公開状態, `デッキ${k}の公開状態`).toBe("非公開");
      expect.soft(s.デッキリスト非公開, `デッキ${k}のデッキリスト公開状態（偽）`).toBe(false);
      expect.soft(s.イベント名日, `デッキ${k}のイベント名(日)`).toBe(後の値.イベント名日);
      expect.soft(s.イベント名英, `デッキ${k}のイベント名(英)`).toBe(後の値.イベント名英);
      expect.soft(s.開催日, `デッキ${k}のイベント開催日`).toBe(後の値.開催日);
      expect.soft(s.順位, `デッキ${k}の順位`).toBe(後の値.順位);
      expect.soft(s.成績, `デッキ${k}の成績`).toBe(後の値.成績);
      expect.soft(s.プレイヤー名, `デッキ${k}のプレイヤー名`).toBe(後の値.プレイヤー名);
      expect.soft(s.タグ, `デッキ${k}のタグ`).toEqual([後のタグ]);
      expect.soft(s.引用元URL, `デッキ${k}の引用元URL`).toBe(後の値.引用元URL);
    }
    expect.soft(保存.C, "選択しなかったデッキCは更新前の値を維持している").toEqual(前.C);
  });
});

caseTest("IT-M15-01-098", async ({ page, step, expected, notes, db }) => {
  void db;
  note("Standard・Blue Controlは共有のマスタなので作らず、既存のマスタの先頭の組を使った（このケースは種類を確かめない）。入力するが変更チェックはオフのままの項目は、チェックを付けて値を入れ、そのあとチェックを外した（入れた値は欄に残り、一緒に送られる）");
  await login(page, M1501_ADMIN_A);
  const id = notes.get("〔デッキID-M1501-098〕");
  const 前 = 一括の前後098.前;
  let l!: デッキ一覧;
  const b = new デッキ一括編集(page);
  await step(1, async () => { l = await デッキIDで検索する(page, id); });
  await step(2, async () => { await b.デッキを選ぶ(l, id); });
  await step(3, async () => { await b.開く(); });
  await step(4, async () => {
    await b.チェック("result", true); await b.入れる("result", "M1501-098-Rec-After");
    await b.チェック("playerName", true); await b.入れる("playerName", "M1501-098-Pl-After");
  });
  await step(5, async () => {
    for (const [k, v] of [["eventNameJp", "M1501-098-Ev-After"], ["ranking", "5"], ["sourceUrl", "https://example.com/m1501-098-after"]] as const) {
      await b.チェック(k, true); await b.入れる(k, v); await b.チェック(k, false);
    }
  });
  let 結果 = { 成功: [] as string[], エラー: [] as string[], 入力の不足: [] as string[] };
  await step(6, async () => { 結果 = await b.実行する(); });
  let s = デッキの保存内容を読む(id);
  await step(7, async () => { s = デッキの保存内容を読む(id); });
  await expected(async () => {
    expect.soft(結果.エラー, "一括編集実行のエラー表示").toEqual([]);
    expect.soft(s.成績, "成績").toBe("M1501-098-Rec-After");
    expect.soft(s.プレイヤー名, "プレイヤー名").toBe("M1501-098-Pl-After");
    expect.soft(s.イベント名日, "イベント名(日)は変更チェックがオフのため更新前のまま").toBe(前.イベント名日);
    expect.soft(s.順位, "順位は更新前のまま").toBe(前.順位);
    expect.soft(s.引用元URL, "引用元URLは更新前のまま").toBe(前.引用元URL);
  });
});

/** 一括編集の組合せ（100〜103）。操作: 公開状態・アーキタイプの変更チェックの付け方 */
function 組合せの一括編集(no: "100" | "101" | "102" | "103", 操作: { プレイヤー?: boolean; アーキタイプ?: boolean; 公開?: boolean }, 期待: { 公開状態: "公開" | "非公開"; アーキタイプあり: boolean; 店頭に載る: boolean }): CaseBody {
  return async ({ page, browser, step, expected, notes, db }) => {
    void db;
    note("Standard・Red Aggro・Blue Controlは共有のマスタなので作らず、アーキタイプは既存のマスタの先頭の組（デッキ登録の既定のアーキタイプ）で代えた。アーキタイプの未設定は、DBで設定した（デッキ登録画面ではアーキタイプが必須のため）");
    await login(page, M1501_ADMIN_A);
    const id = notes.get(`〔デッキID-M1501-${no}〕`);
    // 検索するプレイヤー名: プレイヤー名を一括編集で変えるケース（100）は変更後の名前、それ以外は元の名前
    const 名後 = 操作.プレイヤー ? 組合せの選手後(no) : 組合せの選手前(no);
    const アーキ = 基線のアーキタイプ().アーキタイプ;
    let l!: デッキ一覧;
    const b = new デッキ一括編集(page);
    await step(1, async () => { l = await デッキIDで検索する(page, id); });
    await step(2, async () => { await b.デッキを選ぶ(l, id); });
    await step(3, async () => { await b.開く(); });
    await step(4, async () => {
      if (操作.プレイヤー) { await b.チェック("playerName", true); await b.入れる("playerName", 名後); }
      if (操作.公開) { await b.チェック("disp", true); await b.公開状態を選ぶ("公開"); }
      if (操作.アーキタイプ) { await b.チェック("archetype", true); await b.アーキタイプを選ぶ(アーキ); }
    });
    let 結果 = { 成功: [] as string[], エラー: [] as string[], 入力の不足: [] as string[] };
    await step(5, async () => { 結果 = await b.実行する(); });
    let s = デッキの保存内容を読む(id);
    await step(6, async () => { s = デッキの保存内容を読む(id); });
    let 載る = false;
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const p = await ctx.newPage();
      p.setDefaultTimeout(60_000); p.setDefaultNavigationTimeout(90_000);
      const top = new DeckTopPage(p);
      const m = new DeckSearchModal(p);
      await step(7, async () => { await top.開く(); });
      await step(8, async () => { await m.開く(); await m.クリアする(); });
      await step(9, async () => {
        note("「クリア」とプレイヤー名の欄は、デッキ検索TOPの画面上部の「詳細検索」で開く画面の中にある。開いてから押した");
        await m.入れる("player", 名後);
        await m.検索する();
        const 行 = await new DeckResultPage(p).行();
        載る = 行.some((r) => r.プレイヤー === 名後);
      });
    } finally { await ctx.close(); }
    await expected(async () => {
      expect.soft(結果.エラー, "一括編集実行のエラー表示").toEqual([]);
      expect.soft(s.公開状態, "表示区分").toBe(期待.公開状態);
      if (期待.アーキタイプあり) expect.soft(s.アーキタイプ, "アーキタイプ").toBe(アーキ);
      else expect.soft(s.アーキタイプ, "アーキタイプ（未設定のまま）").toBeNull();
      if (操作.プレイヤー) expect.soft(s.プレイヤー名, "プレイヤー名").toBe(名後);
      expect.soft(載る, `フロントのデッキ検索で、プレイヤー名「${名後}」のデッキが一覧に載る`).toBe(期待.店頭に載る);
    });
  };
}
caseTest("IT-M15-01-100", 組合せの一括編集("100", { プレイヤー: true }, { 公開状態: "非公開", アーキタイプあり: false, 店頭に載る: false }));
caseTest("IT-M15-01-101", 組合せの一括編集("101", { アーキタイプ: true }, { 公開状態: "非公開", アーキタイプあり: true, 店頭に載る: false }));
caseTest("IT-M15-01-102", 組合せの一括編集("102", { 公開: true }, { 公開状態: "公開", アーキタイプあり: false, 店頭に載る: false }));
caseTest("IT-M15-01-103", 組合せの一括編集("103", { 公開: true, アーキタイプ: true }, { 公開状態: "公開", アーキタイプあり: true, 店頭に載る: true }));
