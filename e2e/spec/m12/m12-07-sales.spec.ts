/**
 * M12-07 フォーマット売上分析 集計一覧表示 のうち、集計結果を確かめるケース（003・025〜036）。正本: integration_test/casegen/cases/M12-07_test_cases.tsv
 *
 * 正本・シードとの食い違い（読み替え）:
 * - 集計月: シード表の集計月（2026-04・2025-01 など）は、ほかの人の受注が混ざるため、ほかの人の受注が無い遠い将来の年の同じ月に読み替えた
 *   （シードが決める。年はケースごとに違う。月と、月の日数は正本のとおり。2025-02 は28日の月）。
 * - 売上分析タグ: 共有のマスタなので足さず、既存のタグ2件に読み替えた。シード表の「スタンダード」はタグ1、「モダン」はタグ2の名称（列の見出し）。
 *   ほかの列は、ほかの人のタグでも、その月に売上が無いので0であることまで確かめる。
 * - 店舗: 受注の店舗・配送方法は、通販＝本店の宅配便、店舗＝配送方法を店頭受取にした受注で表した（支店の受注にはしていない）。
 * - 003: 正本は「集計月を選択する」だけで「検索ボタンを押さなくても集計が実行される」と期待する。検索ボタンは押さない。
 * - 平均: 画面の平均は、合計を日数で割った小数点以下を切り捨てた整数（正本の例: 700 ÷ 30 日 = 23）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ケース情報, ケース情報を読む } from "../../db/m12_07";
import { FormatSalesPage } from "../../pages/admin/m12_analysis";
import { M1207_ADMIN } from "../../seeds/m12-07";
import "../../seeds/m12-08"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 月の注記 = (c: ケース情報, 正本の月: string) =>
  `集計月は、ほかの人の受注が無い月に読み替えた: ${c.集計月}（正本は ${正本の月}）。売上分析タグ1「${c.タグ名[0]}」・タグ2「${c.タグ名[1]}」は既存のタグ（正本のスタンダード・モダンに読み替え）`;

type 日の期待 = Record<string, Record<number, number>>;

/** 日別の売上表・合計表・平均表の全体を、期待（列名 → 日 → 金額。指定の無い列・日は0）と比べ、食い違いの一覧を返す */
async function 全体の差(p: FormatSalesPage, 日数: number, 期待: 日の期待): Promise<string[]> {
  const 差: string[] = [];
  const t = await p.日別の売上表();
  const 列 = t.見出し.slice(1, -1);
  if (t.見出し[0] !== "日" || t.見出し[t.見出し.length - 1] !== "合計") 差.push(`日別の売上表の見出しが想定と違う（${t.見出し.join("、")}）`);
  if (t.行.length !== 日数) 差.push(`日別の売上表の行数: 実際 ${t.行.length}・期待 ${日数}`);
  for (let d = 1; d <= 日数; d++) {
    const r = t.行.find((x) => x[0] === String(d));
    if (!r) { 差.push(`${d}日の行が無い`); continue; }
    let 和 = 0;
    列.forEach((name, i) => {
      const want = 期待[name]?.[d] ?? 0; 和 += want;
      if (Number(r[i + 1]) !== want) 差.push(`${d}日の「${name}」: 実際 ${r[i + 1]}・期待 ${want}`);
    });
    if (Number(r[r.length - 1]) !== 和) 差.push(`${d}日の「合計」: 実際 ${r[r.length - 1]}・期待 ${和}`);
  }
  const 合計 = await p.合計表(); const 平均 = await p.平均表();
  let 総和 = 0; let 平均和 = 0;
  for (const name of 列) {
    const s = Object.values(期待[name] ?? {}).reduce((a, b) => a + b, 0); const a = Math.trunc(s / 日数);
    総和 += s; 平均和 += a;
    if (Number(合計[`${name}合計`]) !== s) 差.push(`合計表の「${name}合計」: 実際 ${合計[`${name}合計`]}・期待 ${s}`);
    if (Number(平均[`${name}平均`]) !== a) 差.push(`平均表の「${name}平均」: 実際 ${平均[`${name}平均`]}・期待 ${a}`);
  }
  if (Number(合計["今月合計"]) !== 総和) 差.push(`合計表の「今月合計」: 実際 ${合計["今月合計"]}・期待 ${総和}`);
  if (Number(平均["今月平均"]) !== 平均和) 差.push(`平均表の「今月平均」: 実際 ${平均["今月平均"]}・期待 ${平均和}`);
  return 差;
}

type 本体 = {
  no: string; 正本の月: string; 通販: boolean; 店舗: boolean;
  /** 確かめる列の名前 */
  列: (c: ケース情報) => string;
  /** 受注のある日と金額（列 → 日 → 金額） */
  期待: (c: ケース情報) => 日の期待;
  説明: string;
};

/** 025〜036: 集計対象を選び、集計月を入れて検索し、日別の売上表・合計表・平均表の値を確かめる */
function 集計の確かめ(v: 本体) {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    await loginAdmin(page, M1207_ADMIN);
    const c = ケース情報を読む(v.no);
    const p = new FormatSalesPage(page);
    let 列の見出し: string[] = []; let 差: string[] = []; let 行数 = 0;
    await step(1, async () => { await p.open(); });
    await step(2, async () => { await p.通販.setChecked(v.通販, { timeout: 20_000 }); await p.店舗.setChecked(v.店舗, { timeout: 20_000 }); });
    await step(3, async () => { note(月の注記(c, v.正本の月)); await p.月を入れる(c.集計月); });
    await step(4, async () => {
      await p.検索する();
      await expect(p.グラフ, "折れ線グラフ").toBeVisible({ timeout: 30_000 });
      行数 = (await p.日別の売上表()).行.length;
      expect(await p.合計表().then((t) => Object.keys(t).length), "フォーマットごとの合計表の列数").toBeGreaterThan(0);
      expect(await p.平均表().then((t) => Object.keys(t).length), "フォーマットごとの平均表の列数").toBeGreaterThan(0);
    });
    await step(5, async () => {
      列の見出し = (await p.日別の売上表()).見出し;
      差 = await 全体の差(p, c.日数, v.期待(c));
      note(`日別の売上表・合計表・平均表を、全列・全日について期待と比べた（食い違い ${差.length} 件）`);
    });
    await expected(async () => {
      expect.soft(行数, "日別の売上表の行数（集計月の日数）").toBe(c.日数);
      expect.soft(列の見出し, `日別の売上表に「${v.列(c)}」の列がある`).toContain(v.列(c));
      expect.soft(差, v.説明).toEqual([]);
    });
  };
}

// ---- 003 検索ボタンを押さなくても集計が実行される ----

caseTest("IT-M12-07-003", async ({ page, step, expected }) => {
  await loginAdmin(page, M1207_ADMIN);
  const c = ケース情報を読む("003");
  const p = new FormatSalesPage(page);
  let 通販 = false; let 店舗 = false;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { 通販 = await p.通販.isChecked(); 店舗 = await p.店舗.isChecked(); });
  await step(3, async () => {
    note(月の注記(c, "2026-04"));
    note("検索ボタンは押していない（正本の手順は集計月を選択するまで）");
    await p.月を入れる(c.集計月);
    // 集計月の選択で検索が実行されるなら、画面が送信されて結果が出る。出るまで少し待つ
    await page.waitForLoadState("load");
    await p.集計結果.waitFor({ state: "visible", timeout: 8_000 }).catch(() => undefined);
  });
  await expected(async () => {
    expect.soft(通販 && 店舗, "集計対象(通販)と集計対象(店舗)がチェックONである（手順2）").toBe(true);
    await expect.soft(p.集計結果, "検索ボタンを押さなくても集計結果が表示される").toBeVisible({ timeout: 1_000 });
    await expect.soft(p.グラフ, "折れ線グラフが表示される").toBeVisible({ timeout: 1_000 });
    expect.soft(await p.集計結果.locator("table").count(), "日別の売上表、合計表、平均表の3つの表が同一画面に表示される").toBe(3);
    expect.soft((await p.日別の売上表().catch(() => ({ 行: [] as string[][] }))).行.length, "日別の売上表の行数（集計月の日数）").toBe(c.日数);
  });
});

// ---- 025〜036 ----

caseTest("IT-M12-07-025", 集計の確かめ({
  no: "025", 正本の月: "2025-01", 通販: true, 店舗: false, 列: (c) => c.タグ名[0], 期待: () => ({}),
  説明: "スタンダードの列が日別の売上表の全日で0、合計表の合計が0、平均表の平均が0（店舗の受注は通販のみの集計に入らない。ほかの列も0）",
}));
caseTest("IT-M12-07-026", 集計の確かめ({
  no: "026", 正本の月: "2025-02", 通販: true, 店舗: false, 列: () => "その他(カード)", 期待: () => ({ "その他(カード)": { 10: 700 } }),
  説明: "その他(カード)の列が10日で700、それ以外の全日で0、合計表の合計が700、平均表の平均が25（28日の月）",
}));
caseTest("IT-M12-07-027", 集計の確かめ({
  no: "027", 正本の月: "2025-03", 通販: true, 店舗: false, 列: () => "その他", 期待: () => ({}),
  説明: "その他の列が日別の売上表の全日で0、合計表の合計が0、平均表の平均が0（店舗の受注は通販のみの集計に入らない）",
}));
caseTest("IT-M12-07-028", 集計の確かめ({
  no: "028", 正本の月: "2025-04", 通販: false, 店舗: true, 列: () => "その他(カード)", 期待: () => ({ "その他(カード)": { 10: 700 } }),
  説明: "その他(カード)の列が10日で700、それ以外の全日で0、合計表の合計が700、平均表の平均が23（30日の月）",
}));
caseTest("IT-M12-07-029", 集計の確かめ({
  no: "029", 正本の月: "2025-05", 通販: false, 店舗: true, 列: (c) => c.タグ名[0], 期待: () => ({}),
  説明: "スタンダードの列が日別の売上表の全日で0、合計表の合計が0、平均表の平均が0（通販の受注は店舗のみの集計に入らない）",
}));
caseTest("IT-M12-07-030", 集計の確かめ({
  no: "030", 正本の月: "2025-06", 通販: false, 店舗: true, 列: () => "その他", 期待: () => ({}),
  説明: "その他の列が日別の売上表の全日で0、合計表の合計が0、平均表の平均が0（通販の受注は店舗のみの集計に入らない）",
}));
caseTest("IT-M12-07-031", 集計の確かめ({
  no: "031", 正本の月: "2025-07", 通販: true, 店舗: true, 列: () => "その他(カード)", 期待: () => ({ "その他(カード)": { 10: 800 } }),
  説明: "その他(カード)の列が10日でスマレジ由来受注の800（引き渡し済みの元EC受注の700は加算も代用もされない）、それ以外の全日で0、合計表の合計が800、平均表の平均が25",
}));
caseTest("IT-M12-07-032", 集計の確かめ({
  no: "032", 正本の月: "2025-08", 通販: true, 店舗: true, 列: () => "その他", 期待: () => ({ "その他": { 10: 600 } }),
  説明: "その他の列が10日でスマレジ由来受注の600（引き渡し済みの元EC受注の500は加算も代用もされない）、それ以外の全日で0、合計表の合計が600、平均表の平均が19",
}));
caseTest("IT-M12-07-033", 集計の確かめ({
  no: "033", 正本の月: "2025-09", 通販: true, 店舗: true, 列: (c) => c.タグ名[0], 期待: (c) => ({ [c.タグ名[0]]: { 10: 1000 } }),
  説明: "スタンダード(タグ1)の列が10日で1000、それ以外の全日で0、合計表の合計が1000、平均表の平均が33",
}));
caseTest("IT-M12-07-034", 集計の確かめ({
  no: "034", 正本の月: "2025-10", 通販: true, 店舗: true, 列: (c) => c.タグ名[0], 期待: (c) => ({ [c.タグ名[0]]: { 10: 1200 } }),
  説明: "スタンダード(タグ1)の列が10日でスマレジ由来受注の1200（引き渡し済みの元EC受注の1000は加算も代用もされない）、それ以外の全日で0、合計表の合計が1200、平均表の平均が38",
}));
caseTest("IT-M12-07-035", 集計の確かめ({
  no: "035", 正本の月: "2025-11", 通販: true, 店舗: true, 列: (c) => c.タグ名[0], 期待: () => ({}),
  説明: "キャンセルの受注の単価1000が集計されず、スタンダード(タグ1)の列が全日で0、合計表の合計が0、平均表の平均が0",
}));
caseTest("IT-M12-07-036", 集計の確かめ({
  no: "036", 正本の月: "2025-12", 通販: true, 店舗: true, 列: (c) => c.タグ名[0], 期待: () => ({}),
  説明: "前年の同じ月の15日の受注の単価1000が集計されず、スタンダード(タグ1)の列が全日で0、合計表の合計が0、平均表の平均が0",
}));
