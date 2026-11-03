/** M14-01 カード検索（一覧・条件抽出）の続き（CSV出力・件数表示・並び順と表示件数の組合せ）。正本: cases/M14-01_test_cases.tsv */
import { test } from "@playwright/test";
import { caseTest, CaseBody, expect } from "../../lib/case";
import { csvRecords } from "../../lib/csv";
import { rc } from "../../lib/run_marker";
import { loginAdmin } from "../../lib/session";
import { CardSearchPage, downloadedText } from "../../pages/admin/m14_card";
import { M1401_ADMIN } from "../../seeds/m14-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const ID群 = (notes: { get(l: string): string }, prefix: string, 文字: string) => [...文字].map((c) => notes.get(`〔カードID-${prefix}${c}〕`));

caseTest("IT-M14-01-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  let 取れた = false, 確認文 = "";
  await step(1, async () => { await l.open(); });
  await step(2, async () => {
    page.once("dialog", (d) => { 確認文 = d.message(); void d.dismiss(); });
    await page.getByRole("link", { name: "カード名リスト作成", exact: true }).click({ timeout: 20_000 });
    await page.waitForTimeout(500);
    取れた = 確認文 !== "";
  });
  await step(3, async () => { /* 確認ポップアップの「キャンセル」: 画面の確認ダイアログを閉じた（手順2で閉じた） */ note("確認ポップアップは画面の確認ダイアログとして表示され、「キャンセル」で閉じた"); });
  await expected(async () => {
    expect.soft(取れた, "カード名リスト作成の確認ポップアップが表示された").toBe(true);
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（カード検索）").toMatch(/\/card$/);
    expect.soft(await l.form.count(), "カード検索の検索欄").toBe(1);
  });
});

caseTest("IT-M14-01-081", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const [A] = ID群(notes, "M1401-081", "A");
  let rows: Record<string, string>[] = [];
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc("M1401DP081")); });
  await step(2, async () => { await l.カードを選択する([A]); });
  await step(3, async () => {
    const [d] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.locator("#form_bulk button.action-submit").filter({ hasText: /^\s*CSV出力\s*$/ }).click()]);
    rows = csvRecords(await downloadedText(d));
  });
  await step(4, async () => { expect(rows.length, "ダウンロードされたCSVのデータ行数").toBeGreaterThan(0); });
  await expected(async () => {
    const names = rows.map((r) => r["name_en"] ?? "");
    expect.soft(rows.length, "CSVのデータ行数").toBe(1);
    expect.soft(names.some((n) => n === rc("M1401DP081") + "-A"), `カード名(英)がAの行がある（出力: ${names.join("、")}）`).toBe(true);
    expect.soft(names.some((n) => n === rc("M1401DP081") + "-B"), "カード名(英)がBの行がある").toBe(false);
  });
});

caseTest("IT-M14-01-082", async ({ page, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401DP082")); });
  await step(3, async () => { await l.表示件数を選ぶ(10); });
  let 表示 = { 前へ: true, 次へ: true, 番号: [] as string[], 現在: null as string | null };
  await step(4, async () => { 表示 = await l.ページ送りの表示(); });
  await expected(async () => {
    expect.soft(await l.行.count(), "1ページに表示されたカードの行数").toBe(5);
    expect.soft(表示.前へ, "「前へ」が表示されている").toBe(false);
    expect.soft(表示.次へ, "「次へ」が表示されている").toBe(false);
  });
});

caseTest("IT-M14-01-083", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const [A, B] = ID群(notes, "M1401-083", "AB");
  await step(1, async () => { await l.open(); await l.キーワードで検索する(rc("M1401DP083")); });
  await step(2, async () => { await l.表示件数を選ぶ(10); });
  await step(3, async () => { await l.ページ送りを押す("2"); });
  await step(4, async () => { await l.三点リーダーを押す(B); });
  await step(5, async () => { await l.削除を押す(B); });
  await step(6, async () => { await l.確認ポップアップで実行する(); });
  await expected(async () => {
    expect.soft((await l.ページ送りの表示()).現在, "削除後に表示された一覧のページ番号").toBe("2");
    expect.soft(await l.表示中のカードID(), "2ページ目のカードID").toEqual([A]);
  });
});

// ---- 並び順と表示件数の組合せ ----
type 操作 = { 並び?: [string, "昇順" | "降順"]; 件数?: number; 詳細往復?: boolean };

/** 検索→(並び順→)(表示件数→)(カード詳細を開いて「カード一覧」に戻る) の順に操作する。手順の数は正本に合わせて渡す */
function 組合せ(num: string, 順序: ("並び" | "件数" | "往復")[], 期待順: string, 件数表示: number, 次ページなし: boolean, 向き: "昇順" | "降順" | null): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1401_ADMIN);
    const l = new CardSearchPage(page);
    const token = `M1401-CB${num}`;
    const 操作: 操作 = {};
    void 操作; void 向き;
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.キーワードで検索する(rc(token)); });
    let n = 3;
    for (const o of 順序) {
      if (o === "並び") await step(n++, async () => { await l.並び順を選ぶ(並び[num][0], 並び[num][1]); });
      if (o === "件数") await step(n++, async () => { await l.表示件数を選ぶ(50); });
      if (o === "往復") {
        await step(n++, async () => {
          await Promise.all([page.waitForNavigation({ waitUntil: "load" }), l.行.first().locator("td:nth-child(3) a").click()]);
        });
        await step(n++, async () => {
          await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.c-baseLink").filter({ hasText: "カード一覧" }).click()]);
          await l.検索結果の文();
        });
      }
    }
    await expected(async () => {
      const 期待 = ID群(notes, `M1401-${num}`, 期待順);
      expect.soft(await l.表示中のカードID(), `表示されたカードIDの順（${期待順.length}件）`).toEqual(期待);
      const p = await l.ページ送りの表示();
      if (次ページなし) expect.soft(p.次へ || p.番号.includes("2"), "2ページ目がある").toBe(false);
      void 件数表示;
    });
  };
}
const 並び: Record<string, [string, "昇順" | "降順"]> = {
  "085": ["カードID", "昇順"], "086": ["カードID", "降順"], "087": ["カード名（和文）", "昇順"], "088": ["カード名（英文）", "昇順"],
  "092": ["マナ・コスト", "昇順"], "093": ["マナ・コスト", "降順"], "094": ["カード名（和文）", "昇順"], "095": ["カード名（英文）", "昇順"], "096": ["カード名（英文）", "昇順"],
};
caseTest("IT-M14-01-085", 組合せ("085", ["並び"], "ABCDEFGHIJ", 10, false, "昇順"));
caseTest("IT-M14-01-086", 組合せ("086", ["並び", "件数", "往復"], "LKJIHGFEDCBA", 50, true, "降順"));
caseTest("IT-M14-01-087", 組合せ("087", ["並び", "往復"], "CIFAKEHLBG", 10, false, "昇順"));
caseTest("IT-M14-01-088", 組合せ("088", ["並び", "件数"], "FBJGDICLHAKE", 50, true, "昇順"));
caseTest("IT-M14-01-089", 組合せ("089", ["件数"], "LKJIHGFEDCBA", 50, true, null));
caseTest("IT-M14-01-090", 組合せ("090", ["件数", "往復"], "LKJIHGFEDCBA", 50, true, null));
caseTest("IT-M14-01-091", 組合せ("091", [], "LKJIHGFEDC", 10, false, null));
caseTest("IT-M14-01-092", 組合せ("092", ["件数", "並び"], "DHBJFLAKEICG", 50, true, "昇順"));
caseTest("IT-M14-01-093", 組合せ("093", ["並び"], "GCIEKALFJB", 10, false, "降順"));
caseTest("IT-M14-01-094", 組合せ("094", ["件数", "並び"], "CIFAKEHLBGJD", 50, true, "昇順"));
caseTest("IT-M14-01-095", 組合せ("095", ["件数", "並び"], "FBJGDICLHAKE", 50, true, "昇順"));
caseTest("IT-M14-01-096", 組合せ("096", ["並び"], "FBJGDICLHA", 10, false, "昇順"));

caseTest("IT-M14-01-097", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const [K] = ID群(notes, "M1401-097", "K");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-CB097")); });
  await step(3, async () => { await l.表示件数を選ぶ(10); });
  await step(4, async () => { await l.三点リーダーを押す(K); });
  await step(5, async () => { await l.削除を押す(K); });
  await step(6, async () => { await l.確認ポップアップで実行する(); });
  await expected(async () => {
    const ids = await l.表示中のカードID();
    expect.soft(ids, "削除後の1ページ目のカードIDの順").toEqual(ID群(notes, "M1401-097", "JIHGFEDCBA"));
    expect.soft(ids.includes(K), "削除したカードが表示されている").toBe(false);
  });
});
caseTest("IT-M14-01-098", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1401_ADMIN);
  const l = new CardSearchPage(page);
  const [A] = ID群(notes, "M1401-098", "A");
  await step(1, async () => { await l.open(); });
  await step(2, async () => { await l.キーワードで検索する(rc("M1401-CB098")); });
  await step(3, async () => { await l.三点リーダーを押す(A); });
  await step(4, async () => { await l.削除を押す(A); });
  await step(5, async () => { await l.確認ポップアップで実行する(); });
  await expected(async () => {
    expect.soft(await page.getByText("検索条件に合致するデータが見つかりませんでした").count(), "該当なしの見出しの数").toBeGreaterThan(0);
    expect.soft(await l.行.count(), "表示されているカードの行数").toBe(0);
  });
});
function 検索語の書き換え(num: string, 書き換える: boolean, 期待: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    await loginAdmin(page, M1401_ADMIN);
    const l = new CardSearchPage(page);
    await step(1, async () => { await l.open(); });
    await step(2, async () => { await l.キーワードで検索する(rc(`M1401-CB${num}-ALPHA`)); });
    if (書き換える) await step(3, async () => { await l.キーワードで検索する(rc(`M1401-CB${num}-BRAVO`)); });
    await expected(async () => {
      expect.soft(await l.表示中のカードID(), "検索結果のカードIDの順").toEqual(ID群(notes, `M1401-${num}`, 期待));
    });
  };
}
caseTest("IT-M14-01-099", 検索語の書き換え("099", true, "DC"));
caseTest("IT-M14-01-100", 検索語の書き換え("100", false, "BA"));
void note;
