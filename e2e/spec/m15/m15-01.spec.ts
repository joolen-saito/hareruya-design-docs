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
import { デッキ一覧 } from "../../pages/admin/m15_deck";
import { M1501_ADMIN_A, M1501_ADMIN_B } from "../../seeds/m15-01";
import { デッキの文字項目, メインボードのカード, 最終更新者の名前 } from "../../db/m15_deck";

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
