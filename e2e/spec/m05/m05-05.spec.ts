/**
 * M05-05 受注詳細カスタムCSV出力。正本: cases/M05-05_test_cases.tsv
 * 実装したのは、使用シードが画面だけで作れる 002・004・005・006・007・012・018・020・031・036。
 * ほかは使用シードの投入方法に「DBへ直接設定する」、スマレジ連携の値が含まれるので実装しない
 * （記録 e2e/review/M05-05_progress_2026-10-31.md）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { OrderCsvPage, ダウンロード結果 } from "../../pages/admin/m05_05_custom_csv";
import { M0505_ADMIN, 注文IDの出力を元に戻す, 定義名 } from "../../seeds/m05-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M05-05-002", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-002〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505選択定義A-002")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const head = r?.行[0] ?? [];
    expect.soft(head, "見出し行が定義Aの「注文番号」「配送ID」だけで、登録表示順の昇順").toEqual(["注文番号", "配送ID"]);
    expect.soft(head.includes("会員ID"), "定義Bだけに登録された「会員ID」を含む").toBe(false);
  });
});

caseTest("IT-M05-05-004", async ({ page, browser, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  try {
    await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-004〕")); });
    await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505無効項目定義-004")); });
    await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
    await expected(async () => {
      expect.soft(r?.行[0] ?? [], "見出し行に、出力項目設定で無効な「注文ID」が定義に登録された列として出力される").toEqual(["注文ID"]);
      expect.soft(r?.行[1] ?? [], "データ行に、注文IDの値が出力される").toEqual([notes.get("〔注文ID-M0505-004〕")]);
    });
  } finally {
    // ケースの終了後に、共有の設定（受注詳細CSVの出力項目）を元へ戻す
    note(await 注文IDの出力を元に戻す(browser));
  }
});

caseTest("IT-M05-05-005", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  // 事前準備③: 受注情報検索 一覧(検索入力)画面で注文番号を検索し、一覧(検索結果)画面を開いた状態にする
  await csv.openSearch();
  await csv.注文番号で検索する(notes.get("〔注文番号-M0505-005〕"));
  let url = "";
  let 結果: Awaited<ReturnType<OrderCsvPage["定義IDを置き換えて開く"]>> | undefined;
  await step(1, async () => { /* 一覧(検索結果)画面を開いている状態から進める */ expect(page.url(), "一覧(検索結果)画面を開いている").toMatch(/\/order/); });
  await step(2, async () => { url = await csv.定義のダウンロードURL(定義名("M0505基本定義-005")); expect(url, "ダウンロードURL").toMatch(/custom_csv\/export\/\d+/); });
  await step(3, async () => { 結果 = await csv.定義IDを置き換えて開く(url, "999999"); });
  await expected(async () => {
    expect.soft(結果?.ダウンロードされた, "CSVファイルがダウンロードされない").toBe(false);
  });
});

caseTest("IT-M05-05-006", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-006〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-006")); });
  await expected(async () => {
    expect.soft(r?.ファイル名 ?? "", "受注詳細カスタムCSVがダウンロードとして返される（ファイル名が .csv）").toMatch(/\.csv$/);
    expect.soft(r?.行.length ?? 0, "ダウンロードしたCSVに行がある（行数）").toBeGreaterThan(0);
  });
});

caseTest("IT-M05-05-007", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let 開始 = new Date(0), 完了 = new Date(0);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-007〕")); });
  await step(2, async () => { 開始 = new Date(); });
  await step(3, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-007")); });
  await step(4, async () => { 完了 = new Date(); });
  await step(5, async () => { expect(r?.ファイル名, "ダウンロードしたファイル名").toBeTruthy(); });
  await expected(async () => {
    const name = r?.ファイル名 ?? "";
    expect.soft(name, "ファイル名が「shipping_YYYYMMDDhhmmss.csv」（14桁）の形").toMatch(/^shipping_\d{14}\.csv$/);
    const d = /^shipping_(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.csv$/.exec(name);
    if (d) {
      // ファイル名の日時を、この環境の時刻（アプリの時刻帯と同じ日本時間）として読み、手順2〜4の記録した日時の間にあるかを確かめる
      const t = Date.UTC(+d[1], +d[2] - 1, +d[3], +d[4], +d[5], +d[6]) - 9 * 3600_000;
      expect.soft(t >= Math.floor(開始.getTime() / 1000) * 1000 && t <= 完了.getTime(), `ファイル名の日時が手順2の日時（${開始.toISOString()}）から手順4の日時（${完了.toISOString()}）の間（日本時間として読んだ）`).toBe(true);
    }
  });
});

caseTest("IT-M05-05-012", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-012A〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-012")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const data = (r?.行 ?? []).slice(1).map((x) => x[0]);
    expect.soft(data, "最後に実行した検索条件に一致する受注Aだけが出力される").toEqual([notes.get("〔注文番号-M0505-012A〕")]);
    expect.soft(data.includes(notes.get("〔注文番号-M0505-012B〕")), "受注Bを含む").toBe(false);
  });
});

caseTest("IT-M05-05-020", async ({ page, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する("99999999"); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-020")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(r?.行 ?? [], "検索条件に一致する受注が0件のため、見出し行だけが出力される").toEqual([["注文番号"]]);
  });
});

caseTest("IT-M05-05-031", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-031〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505基本定義-031")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    expect.soft(r?.行[0] ?? [], "ファイルの先頭行が見出し行「注文番号」").toEqual(["注文番号"]);
    expect.soft(r?.行[1] ?? [], "次の行からデータ行として注文番号が出力される").toEqual([notes.get("〔注文番号-M0505-031〕")]);
    expect.soft(r?.行.length, "見出し行とデータ行の2行（行数）").toBe(2);
  });
});

caseTest("IT-M05-05-036", async ({ page, notes, step, expected }) => {
  page.setDefaultTimeout(60_000);
  await loginAdmin(page, M0505_ADMIN);
  const csv = new OrderCsvPage(page);
  let r: ダウンロード結果 | undefined;
  await step(1, async () => { await csv.openSearch(); await csv.注文番号で検索する(notes.get("〔注文番号-M0505-036〕")); });
  await step(2, async () => { r = await csv.受注詳細カスタムCSVをダウンロードする(定義名("M0505会員姓定義-036")); });
  await step(3, async () => { expect(r?.行.length, "CSVを受け取れた（行数）").toBeGreaterThan(0); });
  await expected(async () => {
    const i = (r?.行[0] ?? []).indexOf("お名前(姓)");
    expect.soft(i, "見出し行に「お名前(姓)」の列がある（位置）").toBeGreaterThanOrEqual(0);
    const v = i >= 0 ? (r?.行[1] ?? [])[i] : undefined;
    expect.soft(v, "会員受注のお名前(姓)列に会員の姓が出力される").toBe("試験M0505036");
    expect.soft(v === "非会員", "「非会員」と出力される").toBe(false);
  });
});
