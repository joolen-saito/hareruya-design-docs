/**
 * M12-03 受注売上分析 集計一覧表示。正本: integration_test/casegen/cases/M12-03_test_cases.tsv
 *
 * 実装していないケース（理由）:
 * - 016: 商品名(英)「Alpha Cards」・備考・カード名「Blue Dragon」をそれぞれ持つカード商品が要る。商品の英語名・備考は商品そのものの値で、
 *   共有の既存の商品は書き換えられず、グッズ商品CSV登録で作る商品にはカード（カード名）を結びつけられない（カードの登録とカード商品の作成が要る）。
 * 2026-11-12 追加で実装したケース: 008・009・037・039（試験店舗「大阪店-M1203-E2E」「名古屋店-M1203-E2E」を1度だけ作って使い回す）、
 *   015・023・028・031・040・041・045・047・049（試験のカテゴリ・グッズ商品を決まった名前で作って使い回し、受注明細の商品をその商品にする）、
 *   017・019（受注明細の商品・規格を、状態NM/SP・カードセットの違う既存のカード商品に当てる）、034・035（配送方法なし・スムーズ店頭受取の受注）、
 *   043（受注13件・明細78件を写して作る。DBの書き込みは受注1件あたり約10回・明細1件あたり約3回で、手元で約1〜2分、開発環境のトンネル越しで約3〜5分の見込み）。
 *
 * 正本・シードとの食い違い（読み替え）:
 * - 日付の年: 正本の日付の年（2026）は、ほかの人の受注が混ざるため、ほかの人の受注が無い遠い将来の年の同じ月日に読み替えた（シードが決める）。時刻・月日は正本のとおり。
 * - 商品コード: 実行の印を付けた値（正本の値 + 「-印」）で作り、比べる。
 * - 店舗: 「TC東京」は本店の店舗の選択肢。TC東京・店頭受取の受注は配送方法を店頭受取にした受注、宅配便の受注は基の受注のまま（通販）で表した。
 * - 累計: 画面は表の最後の行（合計の行）に数量・合計・件数を出す。正本の「数量累計・合計累計・件数累計」はその行の値と読んだ。
 * - 出荷完了・引渡し済み: 入金済みの受注と、移行先受注の関連付けで表した（シード参照）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { scene, 選択肢を広げて撮る } from "../../lib/evidence_other";
import { loginAdmin } from "../../lib/session";
import { データ情報, データ情報を読む } from "../../db/m12_03";
import { SalesAnalysisPage, 入力欄の日時, 検索条件, 結果の行, 日時を揃える } from "../../pages/admin/m12_03_sales_analysis";
import { M1203_039_ADMIN, M1203_ADMIN, 大阪店, 名古屋店 } from "../../seeds/m12-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 年の注記 = (y: number) => `日付の年は、ほかの人の受注が無い年に読み替えた: ${y}（正本は2026）。商品コードは実行の印を付けた値で確かめる`;
const TC東京 = "TC東京";

type Ctx = Parameters<Parameters<typeof caseTest>[1]>[0];

// ---------------------------------------------------------------- 検索して結果を確かめる共通の形（手順1〜3）

type 行の期待 = { c: string; 平均?: number; 数量?: number; 合計?: number; 件数?: number };
type 期待 = {
  説明: string;
  /** 結果の行（この順に、これだけ表示される）。部分が真なら、これらが含まれていればよい */
  行: 行の期待[];
  部分?: boolean;
  合計?: { 数量: number; 合計: number; 件数: number };
  含まない?: string[];
  /** 2026-11-12 追加: 集計単位がカテゴリ（行の c はカテゴリ名。実行の印を付けずに比べる） */
  カテゴリ?: boolean;
  /** 2026-11-12 追加: 行の並びを問わない（これだけ表示されることは確かめる） */
  順不同?: boolean;
  /** 2026-11-12 追加: 合計の行のうち、正本が定めた項目だけを確かめる */
  合計の一部?: { 数量?: number; 合計?: number; 件数?: number };
};
type 検索の定め = {
  seed: string;
  通販: boolean;
  店舗: string[] | (() => string[]);
  /** 手順2で店舗全選択/全解除を一度ONにしてからOFFにする */
  全選択して全解除: boolean;
  条件: (info: データ情報) => 検索条件;
  期待: 期待 | ((info: データ情報) => 期待);
};

function 検索の確かめ(v: 検索の定め) {
  return async ({ page, step, expected }: Ctx) => {
    await loginAdmin(page, M1203_ADMIN);
    const info = データ情報を読む(v.seed);
    const p = new SalesAnalysisPage(page);
    let 行: 結果の行[] = []; let 合計: { 数量: string; 合計: string; 件数: string } | null = null;
    await step(1, async () => { await p.open(); });
    await step(2, async () => {
      await p.通販を選ぶ(v.通販);
      if (v.全選択して全解除) await p.全選択して全解除する();
      await p.店舗だけを選ぶ(typeof v.店舗 === "function" ? v.店舗() : v.店舗);
    });
    await step(3, async () => {
      note(年の注記(info.年));
      await p.条件を入れる(v.条件(info), info.年);
      await p.検索する();
      ({ 行, 合計 } = await p.結果を読む());
    });
    const 期 = typeof v.期待 === "function" ? v.期待(info) : v.期待;
    const 鍵 = (c: string) => (期.カテゴリ ? c : rc(c));
    await expected(async () => {
      const codes = 行.map((r) => (期.カテゴリ ? r.カテゴリ : r.商品コード));
      if (期.部分) {
        for (const w of 期.行) expect.soft(codes, `${期.説明}（${w.c}が表示される）`).toContain(鍵(w.c));
      } else if (期.順不同) {
        expect.soft([...codes].sort(), 期.説明).toEqual(期.行.map((w) => 鍵(w.c)).sort());
      } else {
        expect.soft(codes, 期.説明).toEqual(期.行.map((w) => 鍵(w.c)));
      }
      for (const w of 期.行) {
        const a = 行.find((r) => (期.カテゴリ ? r.カテゴリ : r.商品コード) === 鍵(w.c));
        if (!a) continue;
        if (w.平均 !== undefined) expect.soft(a.平均単価, `${w.c}の平均単価`).toBe(String(w.平均));
        if (w.数量 !== undefined) expect.soft(a.数量, `${w.c}の数量`).toBe(String(w.数量));
        if (w.合計 !== undefined) expect.soft(a.合計, `${w.c}の合計`).toBe(String(w.合計));
        if (w.件数 !== undefined) expect.soft(a.件数, `${w.c}の件数`).toBe(String(w.件数));
      }
      for (const c of 期.含まない ?? []) expect.soft(codes, `${c}が表示されない`).not.toContain(鍵(c));
      if (期.合計) {
        expect.soft(合計, "合計の行（数量累計・合計累計・件数累計）").toEqual({ 数量: String(期.合計.数量), 合計: String(期.合計.合計), 件数: String(期.合計.件数) });
      }
      const 一部 = 期.合計の一部;
      if (一部?.数量 !== undefined) expect.soft(合計?.数量, "合計の行の数量（数量累計）").toBe(String(一部.数量));
      if (一部?.合計 !== undefined) expect.soft(合計?.合計, "合計の行の合計（合計累計）").toBe(String(一部.合計));
      if (一部?.件数 !== undefined) expect.soft(合計?.件数, "合計の行の件数（件数累計）").toBe(String(一部.件数));
    });
  };
}

const 日付範囲 = (from: string, to: string) => ({ 集計日From: `2026/${from} 00:00:00`, 集計日To: `2026/${to} 00:00:00` });
const 判定 = (n: string, 追加: 検索条件 = {}): 検索条件 => ({
  キーワード: `M1203-CB${n}-判定`, ...日付範囲("11/01", "12/01"), 集計単位: "商品", 件数: "100", ...追加,
});

// ---------------------------------------------------------------- 画面の項目・操作（データなし）

caseTest("IT-M12-03-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const p = new SalesAnalysisPage(page);
  let 検索枠の文字 = ""; let 集計単位の選択肢: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    検索枠の文字 = (await page.locator("#search_form").innerText()).replace(/\s+/g, " ");
    集計単位の選択肢 = (await p.集計単位.locator("option").allInnerTexts()).map((t) => t.trim());
  });
  await expected(async () => {
    for (const w of ["生年月日", "性別", "都道府県", "利用端末"]) expect.soft(検索枠の文字, `検索枠に「${w}」が表示されない`).not.toContain(w);
    expect.soft(集計単位の選択肢, "集計単位の選択肢は商品とカテゴリだけ（支払方法、購入グループ、都道府県、性別、利用端末、年代(会員)は選べない）").toEqual(["商品", "カテゴリ"]);
  });
});

caseTest("IT-M12-03-002", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const p = new SalesAnalysisPage(page);
  let 件数 : string[] = []; let 状態: string[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    件数 = (await p.件数.locator("option").allInnerTexts()).map((t) => t.trim());
    状態 = (await p.状態.locator("label").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  });
  await expected(async () => {
    expect.soft(件数, "件数の選択肢").toEqual(["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000", "15000", "20000"]);
    expect.soft(状態, "状態の選択肢").toEqual(["NM", "SP", "MP", "HP"]);
    // 閉じたままでは選択肢が読めないので、件数の選択肢（全11件）を一覧の形に広げて画面に出して撮る
    await 選択肢を広げて撮る(p.件数, scene.expectedLabel("件数の選択肢（11件すべてを広げて表示）"), 11);
  });
});

caseTest("IT-M12-03-004", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const p = new SalesAnalysisPage(page);
  let 一回目で表示 = true; let 二回目で表示 = false;
  await step(1, async () => { await p.open(); await expect(p.検索枠, "最初は検索枠が表示されている").toBeVisible(); });
  await step(2, async () => {
    await p.検索枠ボタン.click({ timeout: 20_000 });
    await expect(p.検索枠, "1回目の押下のあと検索枠が閉じるまで").toBeHidden({ timeout: 10_000 }).catch(() => undefined);
    一回目で表示 = await p.検索枠.isVisible();
  });
  await step(3, async () => {
    await p.検索枠ボタン.click({ timeout: 20_000 });
    await expect(p.検索枠, "2回目の押下のあと検索枠が開くまで").toBeVisible({ timeout: 10_000 }).catch(() => undefined);
    二回目で表示 = await p.検索枠.isVisible();
  });
  await expected(async () => {
    expect.soft(一回目で表示, "1回目の押下後は検索枠が非表示").toBe(false);
    expect.soft(二回目で表示, "2回目の押下後は検索枠が再表示").toBe(true);
  });
});

caseTest("IT-M12-03-005", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const p = new SalesAnalysisPage(page);
  let オン: Record<string, boolean> = {}; let オフ: Record<string, boolean> = {};
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.全選択を切り替える(true); });
  await step(3, async () => { オン = await p.全店舗のチェック状態(); });
  await step(4, async () => { await p.全選択を切り替える(false); });
  await step(5, async () => { オフ = await p.全店舗のチェック状態(); });
  await expected(async () => {
    note("表示されている店舗は、画面に出ている店舗をそのまま使った（店舗は作らない）");
    expect.soft(Object.keys(オン).length, "表示されている店舗がある").toBeGreaterThan(0);
    expect.soft(Object.values(オン).every(Boolean), `チェックON後は表示されている全店舗がチェックON（${JSON.stringify(オン)}）`).toBe(true);
    expect.soft(!Object.values(オフ).some(Boolean), `チェックOFF後は表示されている全店舗がチェックOFF（${JSON.stringify(オフ)}）`).toBe(true);
  });
});

caseTest("IT-M12-03-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-FILTER");
  const p = new SalesAnalysisPage(page);
  let 初期: Record<string, string> = {}; let 入力後: Record<string, string> = {}; let クリア後: Record<string, string> = {};
  await step(1, async () => { await p.open(); 初期 = await p.値を読む(); });
  await step(2, async () => {
    note(年の注記(info.年));
    await p.キーワード.fill("クリア確認", { timeout: 20_000 });
    await p.通販を選ぶ(true);
    await p.全選択を切り替える(true);
    await p.日時を入れる(p.集計日From, "2026/08/01 00:00:00", info.年);
    await p.日時を入れる(p.集計日To, "2026/08/31 23:59:59", info.年);
  });
  await step(3, async () => {
    note("カテゴリ・売上分析タグ・カードセットは、画面の選択肢の先頭を選んだ（正本の「絞込カテゴリ」「タグT-A」「セットA」は作らない。状態はSP）");
    await p.条件を入れる({ 集計日対象項目: "キャンセル日", 集計単位: "カテゴリ", 並び替え項目: "販売数", 並び順: "降順", 件数: "50", 平均単価From: 100, 平均単価To: 200, 数量From: 2, 数量To: 4 }, info.年);
    const cat = await p.カテゴリ.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })).filter((o) => o.v !== ""));
    if (cat.length === 0) throw new Error("カテゴリの選択肢が画面に無い");
    await p.カテゴリ.selectOption({ value: cat[0].v }, { timeout: 20_000 });
    await p.状態.getByLabel("SP", { exact: true }).check({ timeout: 20_000 });
    const tags = await p.選択肢の名前(p.売上分析タグ);
    if (tags.length === 0) throw new Error("売上分析タグの選択肢が画面に無い");
    await p.複数選択を設定する(p.売上分析タグ, [tags[0]]);
    const sets = await p.選択肢の名前(p.カードセット);
    if (sets.length === 0) throw new Error("カードセットの選択肢が画面に無い");
    await p.複数選択を設定する(p.カードセット, [sets[0]]);
    入力後 = await p.値を読む();
  });
  await step(4, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000}), p.クリア.click({ timeout: 20_000, noWaitAfter: true })]);
    await expect(p.キーワード, "クリア後の画面").toBeVisible({ timeout: 30_000 });
    クリア後 = await p.値を読む();
  });
  await expected(async () => {
    expect.soft(入力後.キーワード, "クリアの前は入力した条件が入っている（手順2・3）").toBe("クリア確認");
    // 入れた条件が初期値と違う値になっていたこと（同じままだと「初期値へ戻る」の確かめにならない）
    const 入れた項目 = ["キーワード", "集計日From", "集計日To", "集計日対象項目", "集計単位", "カテゴリ", "状態", "売上分析タグ", "カードセット", "平均単価From", "平均単価To", "数量From", "数量To"];
    expect.soft(入れた項目.filter((k) => 入力後[k] === 初期[k]), "クリアの前に、初期値と同じままの項目が無い（手順2・3で入れた項目）").toEqual([]);
    expect.soft(クリア後, "識別ID 1・3～18の全項目が手順1で記録した初期値へ戻る").toEqual(初期);
  });
});

caseTest("IT-M12-03-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-PRODUCT");
  const p = new SalesAnalysisPage(page);
  let 検索後: Record<string, string> = {};
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.全選択して全解除する(); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる({
      キーワード: "商品集計確認", 集計日From: "2026/04/01 00:00:00", 集計日To: "2026/05/01 00:00:00", 集計日対象項目: "注文日",
      集計単位: "商品", 並び替え項目: "金額", 並び順: "降順", 件数: "50",
    }, info.年);
    await p.検索する();
  });
  await step(4, async () => { 検索後 = await p.値を読む(); });
  await expected(async () => {
    expect.soft(検索後.キーワード, "キーワード検索").toBe("商品集計確認");
    expect.soft(検索後.店舗, "集計対象店舗").toBe(TC東京);
    expect.soft(検索後.集計日From, "集計日(From)").toBe(日時を揃える(入力欄の日時("2026/04/01 00:00:00", info.年)));
    expect.soft(検索後.集計日To, "集計日(To)").toBe(日時を揃える(入力欄の日時("2026/05/01 00:00:00", info.年)));
    expect.soft(検索後.集計日対象項目, "集計日対象項目").toBe("注文日");
    expect.soft(検索後.集計単位, "集計単位").toBe("商品");
    expect.soft(検索後.並び替え項目, "並び替え(項目)").toBe("金額");
    expect.soft(検索後.並び順, "並び替え(並び順)").toBe("降順");
    expect.soft(検索後.件数, "件数").toBe("50");
  });
});

// ---------------------------------------------------------------- 日時の境界・キャンセル・注文日

caseTest("IT-M12-03-010", 検索の確かめ({
  seed: "S-M12-03-DATE", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "From境界", 集計日対象項目: "注文日", 集計日From: "2026/05/10 10:00:00", 集計日To: "2026/05/10 10:01:00", 集計単位: "商品" }),
  期待: { 説明: "注文日が10:00:00のFROM-EXACTだけが表示される", 行: [{ c: "FROM-EXACT" }], 含まない: ["FROM-BEFORE"] },
}));
caseTest("IT-M12-03-011", 検索の確かめ({
  seed: "S-M12-03-DATE", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "To境界", 集計日対象項目: "注文日", 集計日From: "2026/05/10 10:00:00", 集計日To: "2026/05/10 11:00:00", 集計単位: "商品" }),
  期待: { 説明: "注文日が10:59:59のTO-BEFOREだけが表示され、11:00:00のTO-EXACTは表示されない", 行: [{ c: "TO-BEFORE" }], 含まない: ["TO-EXACT"] },
}));
caseTest("IT-M12-03-012", 検索の確かめ({
  seed: "S-M12-03-CANCEL", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "キャンセル判定", 集計日対象項目: "注文日", 集計日From: "2026/05/10 00:00:00", 集計日To: "2026/05/11 00:00:00", 集計単位: "商品" }),
  期待: { 説明: "キャンセルされていないNORMAL-001だけが表示され、キャンセル済みのCANCEL-001は表示されない", 行: [{ c: "NORMAL-001" }], 含まない: ["CANCEL-001"] },
}));
caseTest("IT-M12-03-013", 検索の確かめ({
  seed: "S-M12-03-CANCEL", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "キャンセル判定", 集計日対象項目: "キャンセル日", 集計日From: "2026/05/12 00:00:00", 集計日To: "2026/05/13 00:00:00", 集計単位: "商品" }),
  期待: { 説明: "キャンセル日が05/12のCANCEL-001が表示される", 行: [{ c: "CANCEL-001" }], 部分: true },
}));
caseTest("IT-M12-03-014", 検索の確かめ({
  seed: "S-M12-03-NULL-DATE", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "注文日欠落", 集計日対象項目: "注文確定日", 集計日From: "2026/06/10 00:00:00", 集計日To: "2026/06/11 00:00:00", 集計単位: "商品" }),
  期待: { 説明: "注文日が設定されたDATE-VALIDだけが表示され、注文日が未設定のDATE-NULLは表示されない", 行: [{ c: "DATE-VALID" }], 含まない: ["DATE-NULL"] },
}));

// ---------------------------------------------------------------- 選択項目の絞り込み・集計後の絞り込み

caseTest("IT-M12-03-018", 検索の確かめ({
  seed: "S-M12-03-FILTER", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: (info) => ({ キーワード: "絞込確認", ...日付範囲("08/01", "09/01"), 売上分析タグ: [info.タグ名[0]], 集計単位: "商品" }),
  期待: { 説明: "タグが設定されたFILTER-Aだけが表示され、設定されていないFILTER-Bは表示されない", 行: [{ c: "FILTER-A" }], 含まない: ["FILTER-B"] },
}));
caseTest("IT-M12-03-020", 検索の確かめ({
  seed: "S-M12-03-AGGREGATE", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "集計後判定", ...日付範囲("08/01", "09/01"), 平均単価From: 95, 平均単価To: 105, 数量From: 3, 数量To: 5, 集計単位: "商品" }),
  期待: { 説明: "集計後の平均単価100・数量4のAGG-001が表示される", 行: [{ c: "AGG-001", 平均: 100, 数量: 4 }], 部分: true },
}));
caseTest("IT-M12-03-021", 検索の確かめ({
  seed: "S-M12-03-AGGREGATE", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "切捨前判定", ...日付範囲("08/01", "09/01"), 平均単価To: 100, 集計単位: "商品" }),
  期待: { 説明: "切り捨て前の平均単価が100.5のAVG-001は表示されない", 行: [], 含まない: ["AVG-001"] },
}));

// ---------------------------------------------------------------- 集計結果

const 商品集計確認 = (): 検索条件 => ({ キーワード: "商品集計確認", ...日付範囲("04/01", "05/01"), 集計単位: "商品" });

caseTest("IT-M12-03-022", 検索の確かめ({
  seed: "S-M12-03-PRODUCT", 通販: false, 店舗: [TC東京], 全選択して全解除: false, 条件: 商品集計確認,
  期待: { 説明: "P-001が平均単価1000・数量4・合計4000・件数2の1行にまとまり、累計は数量4・合計4000・件数2", 行: [{ c: "P-001", 平均: 1000, 数量: 4, 合計: 4000, 件数: 2 }], 合計: { 数量: 4, 合計: 4000, 件数: 2 } },
}));

caseTest("IT-M12-03-029", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-PRODUCT");
  const p = new SalesAnalysisPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる({ キーワード: "存在しない受注売上ZZZ", ...日付範囲("04/01", "05/01"), 集計単位: "商品" }, info.年);
    await p.検索する();
  });
  await expected(async () => {
    expect.soft(page.url(), "受注売上分析 集計一覧表示画面に留まる").toContain("/analysis/sales");
    // 「10件」などでも通らないよう、「検索結果：0件が該当しました」の件数の部分を見る
    await expect.soft(p.検索結果の件数, "検索結果0件の表示").toContainText(/：0件/);
    expect.soft(await p.結果の表.count(), "結果の表は出ない").toBe(0);
  });
});

caseTest("IT-M12-03-030", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-PRODUCT");
  const p = new SalesAnalysisPage(page);
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる(商品集計確認(), info.年);
    await p.検索する();
  });
  await expected(async () => {
    expect.soft(page.url(), "受注売上分析 集計一覧表示画面に留まる").toContain("/analysis/sales");
    // 「11件」などでも通らないよう、「検索結果：1件が該当しました」の件数の部分を見る
    await expect.soft(p.検索結果の件数, "検索結果件数が1件").toContainText(/：1件/);
  });
});

// ---------------------------------------------------------------- 並び替え・表示件数

function 並び替えの確かめ(並び順: "昇順" | "降順", 期待: Record<string, string[]>) {
  return async ({ page, step, expected }: Ctx) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-SORT");
  const p = new SalesAnalysisPage(page);
  const got: Record<string, string[]> = {};
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる({ キーワード: "並べ替え確認", ...日付範囲("09/01", "10/01"), 集計単位: "商品", 並び順 }, info.年);
  });
  await step(4, async () => {
    for (const 項目 of ["集計単位", "注文数", "金額", "販売数"]) {
      await p.条件を入れる({ 並び替え項目: 項目 }, info.年);
      await p.検索する();
      got[項目] = (await p.結果を読む()).行.map((r) => r.商品コード);
    }
  });
  await expected(async () => {
    for (const 項目 of Object.keys(期待)) expect.soft(got[項目], `並び替え(項目)${項目}・${並び順}の商品コードの順`).toEqual(期待[項目].map((c) => rc(c)));
  });
  };
}
caseTest("IT-M12-03-024", 並び替えの確かめ("昇順", {
  集計単位: ["SORT-A", "SORT-B", "SORT-C"], 注文数: ["SORT-A", "SORT-B", "SORT-C"], 金額: ["SORT-C", "SORT-A", "SORT-B"], 販売数: ["SORT-B", "SORT-C", "SORT-A"],
}));
caseTest("IT-M12-03-025", 並び替えの確かめ("降順", {
  集計単位: ["SORT-C", "SORT-B", "SORT-A"], 注文数: ["SORT-C", "SORT-B", "SORT-A"], 金額: ["SORT-B", "SORT-A", "SORT-C"], 販売数: ["SORT-A", "SORT-C", "SORT-B"],
}));

const 表示件数の条件 = (): 検索条件 => ({ キーワード: "表示件数確認", ...日付範囲("10/01", "11/01"), 集計単位: "商品", 並び替え項目: "集計単位", 並び順: "昇順", 件数: "10" });
const 先頭10件 = Array.from({ length: 10 }, (_, i) => ({ c: `LIMIT-${String(i + 1).padStart(2, "0")}` }));

caseTest("IT-M12-03-026", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-LIMIT");
  const p = new SalesAnalysisPage(page);
  let 行: 結果の行[] = []; let ページ送り = -1;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる(表示件数の条件(), info.年);
    await p.検索する();
    行 = (await p.結果を読む()).行;
    ページ送り = await page.locator(".pagination").count();
  });
  await expected(async () => {
    expect.soft(行.map((r) => r.商品コード), "LIMIT-01～LIMIT-10の10行が表示される").toEqual(先頭10件.map((w) => rc(w.c)));
    expect.soft(行.map((r) => r.商品コード), "LIMIT-11は表示されない").not.toContain(rc("LIMIT-11"));
    expect.soft(ページ送り, "ページ送りが表示されない").toBe(0);
  });
});

caseTest("IT-M12-03-027", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-LIMIT");
  const p = new SalesAnalysisPage(page);
  let 合計: { 数量: string; 合計: string; 件数: string } | null = null;
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); await p.店舗だけを選ぶ([TC東京]); });
  await step(3, async () => {
    note(年の注記(info.年));
    await p.条件を入れる(表示件数の条件(), info.年);
    await p.検索する();
  });
  await step(4, async () => { 合計 = (await p.結果を読む()).合計; });
  await expected(async () => {
    expect.soft(合計, "表示されたLIMIT-01～LIMIT-10だけを合算した数量累計10・合計累計5500・件数累計10（LIMIT-11は含まれない）").toEqual({ 数量: "10", 合計: "5500", 件数: "10" });
  });
});

// ---------------------------------------------------------------- 通販・店舗・引き渡し済み

caseTest("IT-M12-03-036", 検索の確かめ({
  seed: "S-M12-03-HANDOVER-036", 通販: false, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => ({ キーワード: "M1203-036-二重計上", ...日付範囲("11/01", "12/01"), 集計単位: "商品" }),
  期待: { 説明: "M1203-036-Aの1行だけが数量5・合計1000・件数1で表示され、引き渡し済みの元EC受注の数量3・合計300は加算も代用もされない", 行: [{ c: "M1203-036-A", 数量: 5, 合計: 1000, 件数: 1 }] },
}));
caseTest("IT-M12-03-038", 検索の確かめ({
  seed: "S-M12-03-MIXCHAN-038", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => ({ キーワード: "M1203-038-混在", ...日付範囲("08/01", "09/01"), 集計単位: "商品" }),
  期待: { 説明: "通販のM1203-038-MAILと店舗のM1203-038-TOKYOの2行が1つの結果に表示され、累計は数量2・合計200・件数2", 行: [{ c: "M1203-038-MAIL" }, { c: "M1203-038-TOKYO" }], 合計: { 数量: 2, 合計: 200, 件数: 2 } },
}));

// ---------------------------------------------------------------- 要因の組合せ

caseTest("IT-M12-03-042", 検索の確かめ({
  seed: "S-M12-03-CBTWOPROD-042", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("042", { 集計日対象項目: "注文日", 並び替え項目: "集計単位", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB042-01・M1203-CB042-02の2行がこの順に表示され、累計は数量3・合計500・件数2",
    行: [{ c: "M1203-CB042-01", 平均: 100, 数量: 1, 合計: 100, 件数: 1 }, { c: "M1203-CB042-02", 平均: 200, 数量: 2, 合計: 400, 件数: 1 }],
    合計: { 数量: 3, 合計: 500, 件数: 2 },
  },
}));
caseTest("IT-M12-03-044", 検索の確かめ({
  seed: "S-M12-03-CBAMOUNTCXL-044", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("044", { 集計日対象項目: "キャンセル日", 並び替え項目: "金額", 並び順: "降順" }),
  期待: {
    説明: "M1203-CB044-02・03・01の3行がこの順に表示され、累計は数量4・合計600・件数3",
    行: [{ c: "M1203-CB044-02", 平均: 300, 数量: 1, 合計: 300, 件数: 1 }, { c: "M1203-CB044-03", 平均: 100, 数量: 2, 合計: 200, 件数: 1 }, { c: "M1203-CB044-01", 平均: 100, 数量: 1, 合計: 100, 件数: 1 }],
    合計: { 数量: 4, 合計: 600, 件数: 3 },
  },
}));
caseTest("IT-M12-03-050", 検索の確かめ({
  seed: "S-M12-03-CBHANDSTORE-050", 通販: false, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("050", { 集計日対象項目: "注文日", 並び替え項目: "注文数", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB050-01・02の2行がこの順に表示され、累計は数量5・合計500・件数3（引き渡し済みの元EC受注の数量は加算されない）",
    行: [{ c: "M1203-CB050-01", 平均: 100, 数量: 2, 合計: 200, 件数: 1 }, { c: "M1203-CB050-02", 平均: 100, 数量: 3, 合計: 300, 件数: 2 }],
    合計: { 数量: 5, 合計: 500, 件数: 3 },
  },
}));
caseTest("IT-M12-03-051", 検索の確かめ({
  seed: "S-M12-03-CBHANDCAT-051", 通販: false, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("051", { 集計日対象項目: "注文日", 並び替え項目: "注文数", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB051-01・02の2行がこの順に表示され、累計は数量5・合計500・件数3（引き渡し済みの元EC受注の数量は加算されない）",
    行: [{ c: "M1203-CB051-01", 平均: 100, 数量: 1, 合計: 100, 件数: 1 }, { c: "M1203-CB051-02", 平均: 100, 数量: 4, 合計: 400, 件数: 2 }],
    合計: { 数量: 5, 合計: 500, 件数: 3 },
  },
}));
caseTest("IT-M12-03-053", 検索の確かめ({
  seed: "S-M12-03-CBHANDMULTI-053", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("053", { 集計日対象項目: "注文日", 並び替え項目: "販売数", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB053-02・03・01の3行がこの順に表示され、累計は数量7・合計700・件数3（引き渡し済みの元EC受注の数量3は加算されない）",
    行: [{ c: "M1203-CB053-02", 平均: 100, 数量: 1, 合計: 100, 件数: 1 }, { c: "M1203-CB053-03", 平均: 100, 数量: 2, 合計: 200, 件数: 1 }, { c: "M1203-CB053-01", 平均: 100, 数量: 4, 合計: 400, 件数: 1 }],
    合計: { 数量: 7, 合計: 700, 件数: 3 },
  },
}));
caseTest("IT-M12-03-054", 検索の確かめ({
  seed: "S-M12-03-CBLIMITCXL-054", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("054", { 集計日対象項目: "キャンセル日", 並び替え項目: "販売数", 並び順: "昇順", 件数: "10" }),
  期待: {
    説明: "M1203-CB054-01～10の10行がこの順に表示され、11は表示されず、累計は数量55・合計5500・件数10",
    行: Array.from({ length: 10 }, (_, i) => ({ c: `M1203-CB054-${String(i + 1).padStart(2, "0")}` })),
    含まない: ["M1203-CB054-11"],
    合計: { 数量: 55, 合計: 5500, 件数: 10 },
  },
}));
caseTest("IT-M12-03-055", 検索の確かめ({
  seed: "S-M12-03-CBCXLORDER-055", 通販: false, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("055", { 集計日対象項目: "注文日", 並び替え項目: "集計単位", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB055-02の1行だけが表示され、累計は数量1・合計200・件数1（キャンセル済みのM1203-CB055-01は含まれない）",
    行: [{ c: "M1203-CB055-02", 平均: 200, 数量: 1, 合計: 200, 件数: 1 }], 含まない: ["M1203-CB055-01"], 合計: { 数量: 1, 合計: 200, 件数: 1 },
  },
}));
caseTest("IT-M12-03-056", 検索の確かめ({
  seed: "S-M12-03-CBHANDKEY-056", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("056", { 集計日対象項目: "注文日", 並び替え項目: "集計単位", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB056-01・02の2行がこの順に表示され、累計は数量3・合計300・件数2（引き渡し済みの元EC受注の数量3は加算されない）",
    行: [{ c: "M1203-CB056-01", 平均: 100, 数量: 2, 合計: 200, 件数: 1 }, { c: "M1203-CB056-02", 平均: 100, 数量: 1, 合計: 100, 件数: 1 }],
    合計: { 数量: 3, 合計: 300, 件数: 2 },
  },
}));
caseTest("IT-M12-03-057", 検索の確かめ({
  seed: "S-M12-03-CBHANDAMT-057", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("057", { 集計日対象項目: "注文日", 並び替え項目: "金額", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB057-03・02・01の3行がこの順に表示され、累計は数量4・合計650・件数3（引き渡し済みの元EC受注の数量5は加算されない）",
    行: [{ c: "M1203-CB057-03", 平均: 150, 数量: 1, 合計: 150, 件数: 1 }, { c: "M1203-CB057-02", 平均: 100, 数量: 2, 合計: 200, 件数: 1 }, { c: "M1203-CB057-01", 平均: 300, 数量: 1, 合計: 300, 件数: 1 }],
    合計: { 数量: 4, 合計: 650, 件数: 3 },
  },
}));
caseTest("IT-M12-03-058", 検索の確かめ({
  seed: "S-M12-03-CBNULLDATE-058", 通販: false, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("058", { 集計日対象項目: "注文日", 並び替え項目: "集計単位", 並び順: "昇順" }),
  期待: {
    説明: "M1203-CB058-02の1行だけが表示され、累計は数量1・合計200・件数1（注文日が未設定のM1203-CB058-01は含まれない）",
    行: [{ c: "M1203-CB058-02", 平均: 200, 数量: 1, 合計: 200, 件数: 1 }], 含まない: ["M1203-CB058-01"], 合計: { 数量: 1, 合計: 200, 件数: 1 },
  },
}));

// ================================================================ 2026-11-12 追加
const 店の注記 = () => `読み替え: 正本の「大阪店」はE2Eの店舗「${大阪店}」（店舗ID 221）、「名古屋店」はE2Eでない元からある店舗「${名古屋店}」（店舗ID 5。売上集計の対象）で表した（店舗は作らない。依頼者 2026-11-15。売上集計の選択肢の表示名）`;
const カテゴリの名 = (info: データ情報, 正本: string): string => {
  const c = info.カテゴリ?.[正本];
  if (!c) throw new Error(`シードがカテゴリ「${正本}」を作っていない`);
  return c.名;
};
const カテゴリの注記 = (info: データ情報) => `カテゴリは正本の名前に印を付けた試験のカテゴリ: ${Object.entries(info.カテゴリ ?? {}).map(([k, c]) => `「${k.replace(/-M1203$/, "")}」→「${c.名}」`).join("・")}`;

// ---------------------------------------------------------------- 集計対象（通販・店舗）

caseTest("IT-M12-03-008", 検索の確かめ({
  seed: "S-M12-03-CHANNEL", 通販: true, 店舗: [], 全選択して全解除: true,
  条件: () => ({ キーワード: "集計対象確認", ...日付範囲("04/01", "05/01"), 集計単位: "商品" }),
  期待: { 説明: "通販受注のMAIL-001だけが表示される", 行: [{ c: "MAIL-001" }], 含まない: ["TOKYO-001", "OSAKA-001"] },
}));

caseTest("IT-M12-03-009", async ({ page, step, expected }) => {
  await loginAdmin(page, M1203_ADMIN);
  const info = データ情報を読む("S-M12-03-CHANNEL");
  const p = new SalesAnalysisPage(page);
  let 行: 結果の行[] = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => { await p.通販を選ぶ(false); });
  await step(3, async () => { await p.全選択して全解除する(); await p.店舗だけを選ぶ([大阪店]); });
  await step(4, async () => {
    note(年の注記(info.年)); note(店の注記());
    await p.条件を入れる({ キーワード: "集計対象確認", ...日付範囲("04/01", "05/01"), 集計単位: "商品" }, info.年);
    await p.検索する();
    ({ 行 } = await p.結果を読む());
  });
  await expected(async () => {
    const codes = 行.map((r) => r.商品コード);
    expect.soft(codes, "大阪店受注のOSAKA-001だけが表示される").toEqual([rc("OSAKA-001")]);
    expect.soft(codes, "通販受注のMAIL-001が表示されない").not.toContain(rc("MAIL-001"));
    expect.soft(codes, "TC東京受注のTOKYO-001が表示されない").not.toContain(rc("TOKYO-001"));
  });
});

caseTest("IT-M12-03-034", 検索の確かめ({
  seed: "S-M12-03-CHANNELDEF-034", 通販: true, 店舗: [], 全選択して全解除: true,
  条件: () => ({ キーワード: "M1203-034-通販定義", ...日付範囲("11/01", "12/01"), 集計単位: "商品" }),
  期待: { 説明: "配送方法が宅配便のM1203-034-MAILだけが表示される", 行: [{ c: "M1203-034-MAIL" }], 含まない: ["M1203-034-SMOOTH", "M1203-034-NONE"] },
}));

caseTest("IT-M12-03-035", 検索の確かめ({
  seed: "S-M12-03-STOREDEF-035", 通販: false, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => ({ キーワード: "M1203-035-店舗定義", ...日付範囲("11/01", "12/01"), 集計単位: "商品" }),
  期待: { 説明: "スムーズ店頭受取のM1203-035-SMOOTHと配送方法なしのM1203-035-NONEの2行が表示される（並びは問わない）", 行: [{ c: "M1203-035-SMOOTH" }, { c: "M1203-035-NONE" }], 順不同: true, 含まない: ["M1203-035-MAIL"] },
}));

caseTest("IT-M12-03-037", 検索の確かめ({
  seed: "S-M12-03-MULTISTORE-037", 通販: false, 店舗: () => [TC東京, 大阪店], 全選択して全解除: true,
  条件: () => { note(店の注記()); return ({ キーワード: "M1203-037-合算", ...日付範囲("11/01", "12/01"), 集計単位: "商品" }); },
  期待: {
    説明: "M1203-037-Aの1行だけが表示される（名古屋店の数量40・合計6000を含まない）",
    行: [{ c: "M1203-037-A", 数量: 30, 合計: 5000 }], 合計の一部: { 数量: 30, 合計: 5000 },
  },
}));

caseTest("IT-M12-03-039", async ({ page, step, expected }) => {
  const p = new SalesAnalysisPage(page);
  let 状態: Record<string, boolean> = {};
  await step(1, async () => { await loginAdmin(page, M1203_039_ADMIN); });
  await step(2, async () => { await p.open(); 状態 = await p.全店舗のチェック状態(); });
  note(店の注記());
  await expected(async () => {
    expect.soft(状態[TC東京], "「TC東京」にチェックが入っている").toBe(true);
    expect.soft(Object.entries(状態).filter(([, v]) => v).map(([k]) => k), "チェックが入っているのは「TC東京」だけ").toEqual([TC東京]);
    expect.soft(状態[大阪店], `「大阪店」（${大阪店}）にチェックが入っていない`).toBe(false);
    expect.soft(状態[名古屋店], `「名古屋店」（${名古屋店}）にチェックが入っていない`).toBe(false);
  });
});

// ---------------------------------------------------------------- 選択項目の絞り込み（状態・カードセット・カテゴリ）

caseTest("IT-M12-03-017", 検索の確かめ({
  seed: "S-M12-03-FILTER", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "絞込確認", ...日付範囲("08/01", "09/01"), 状態: ["NM"], 集計単位: "商品" }),
  期待: { 説明: "状態がNMのFILTER-Aだけが表示される（FILTER-Bは状態SP）", 行: [{ c: "FILTER-A" }], 含まない: ["FILTER-B"] },
}));

caseTest("IT-M12-03-019", 検索の確かめ({
  seed: "S-M12-03-FILTER", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: (info) => ({ キーワード: "絞込確認", ...日付範囲("08/01", "09/01"), カードセット: [(info.カードセット名 ?? [])[0] ?? "（シードが選んでいない）"], 集計単位: "商品" }),
  期待: (info) => ({ 説明: `正本の「セットA」（既存のカードセット「${(info.カードセット名 ?? [])[0]}」）が設定されたFILTER-Aだけが表示される`, 行: [{ c: "FILTER-A" }], 含まない: ["FILTER-B"] }),
}));

caseTest("IT-M12-03-015", 検索の確かめ({
  seed: "S-M12-03-CATEGORY", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: (info) => ({ キーワード: "階層確認", ...日付範囲("07/01", "08/01"), カテゴリID: info.カテゴリ?.["カテゴリ親-M1203"]?.ID ?? "", 集計単位: "商品" }),
  期待: (info) => ({ 説明: `「カテゴリ親」の配下の「カテゴリ子」に属するCHILD-001が表示される。${カテゴリの注記(info)}`, 行: [{ c: "CHILD-001" }], 部分: true }),
}));

caseTest("IT-M12-03-040", 検索の確かめ({
  seed: "S-M12-03-CATMIX-040", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: (info) => ({ キーワード: "M1203-040-カテゴリ混在", ...日付範囲("08/01", "09/01"), カテゴリID: info.カテゴリ?.["M1203-040-親"]?.ID ?? "", 集計単位: "商品" }),
  期待: (info) => ({ 説明: `親に直接所属するDIRECTと配下の子に属するCHILDの2行が表示される（並びは問わない）。${カテゴリの注記(info)}`, 行: [{ c: "M1203-040-DIRECT" }, { c: "M1203-040-CHILD" }], 順不同: true, 含まない: ["M1203-040-OTHER"] }),
}));

// ---------------------------------------------------------------- カテゴリ集計

caseTest("IT-M12-03-023", 検索の確かめ({
  seed: "S-M12-03-CATEGORY", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "カテゴリ重複確認", ...日付範囲("07/01", "08/01"), 集計単位: "カテゴリ" }),
  期待: (info) => ({
    説明: `「カテゴリ赤」「カテゴリ青」の2行だけが表示される（カテゴリなし商品の値は出ない。並びは問わない）。${カテゴリの注記(info)}`, カテゴリ: true, 順不同: true,
    行: [{ c: カテゴリの名(info, "カテゴリ赤-M1203"), 平均: 500, 数量: 2, 合計: 1000, 件数: 1 }, { c: カテゴリの名(info, "カテゴリ青-M1203"), 平均: 500, 数量: 2, 合計: 1000, 件数: 1 }],
    合計: { 数量: 4, 合計: 2000, 件数: 2 },
  }),
}));

caseTest("IT-M12-03-041", 検索の確かめ({
  seed: "S-M12-03-CATSAME-041", 通販: false, 店舗: [TC東京], 全選択して全解除: false,
  条件: () => ({ キーワード: "M1203-041-同一カテゴリ", ...日付範囲("08/01", "09/01"), 集計単位: "カテゴリ" }),
  期待: (info) => ({
    説明: `「M1203-041-同一」の1行だけが表示される。${カテゴリの注記(info)}`, カテゴリ: true,
    行: [{ c: カテゴリの名(info, "M1203-041-同一"), 平均: 400, 数量: 2, 合計: 800, 件数: 1 }], 合計: { 数量: 2, 合計: 800, 件数: 1 },
  }),
}));

caseTest("IT-M12-03-043", 検索の確かめ({
  seed: "S-M12-03-CBSTAIRCXL-043", 通販: true, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("043", { 集計日対象項目: "キャンセル日", 並び替え項目: "注文数", 並び順: "降順", 件数: "10" }),
  期待: {
    説明: "M1203-CB043-01～10の10行がこの順に表示され、11は表示されない（引き渡し済みの元EC受注の明細は加算されない）",
    行: Array.from({ length: 10 }, (_, i) => ({ c: `M1203-CB043-${String(i + 1).padStart(2, "0")}` })),
    含まない: ["M1203-CB043-11"], 合計: { 数量: 67, 合計: 6700, 件数: 66 },
  },
}));

const CBカテゴリ = (info: データ情報, n: string, k: number) => カテゴリの名(info, `M1203-CB${n}-カテゴリ${String(k).padStart(2, "0")}`);

caseTest("IT-M12-03-045", 検索の確かめ({
  seed: "S-M12-03-CBSTAIRCAT-045", 通販: true, 店舗: [], 全選択して全解除: true,
  条件: () => 判定("045", { 集計日対象項目: "注文日", 集計単位: "カテゴリ", 並び替え項目: "販売数", 並び順: "降順", 件数: "10" }),
  期待: (info) => ({
    説明: `カテゴリ01～10の10行がこの順に表示され、11は表示されない（引き渡し済みの元EC受注とスマレジ由来受注の数量5は含まない）。${カテゴリの注記(info)}`, カテゴリ: true,
    行: Array.from({ length: 10 }, (_, i) => ({ c: CBカテゴリ(info, "045", i + 1) })),
    含まない: [CBカテゴリ(info, "045", 11)], 合計: { 数量: 65, 合計: 6500, 件数: 65 },
  }),
}));

caseTest("IT-M12-03-047", 検索の確かめ({
  seed: "S-M12-03-CBCATCXLHAND-047", 通販: true, 店舗: [], 全選択して全解除: true,
  条件: () => 判定("047", { 集計日対象項目: "キャンセル日", 集計単位: "カテゴリ", 並び替え項目: "集計単位", 並び順: "昇順", 件数: "100" }),
  期待: (info) => ({
    説明: `カテゴリ01・02の2行がこの順に表示される（引き渡し済みの元EC受注の明細とスマレジ由来受注の数量4は含まない）。${カテゴリの注記(info)}`, カテゴリ: true,
    行: [{ c: CBカテゴリ(info, "047", 1), 平均: 100, 数量: 1, 合計: 100, 件数: 1 }, { c: CBカテゴリ(info, "047", 2), 平均: 100, 数量: 2, 合計: 200, 件数: 1 }],
    合計: { 数量: 3, 合計: 300, 件数: 2 },
  }),
}));

caseTest("IT-M12-03-049", 検索の確かめ({
  seed: "S-M12-03-CBNOCAT-049", 通販: false, 店舗: [TC東京], 全選択して全解除: true,
  条件: () => 判定("049", { 集計日対象項目: "注文日", 集計単位: "カテゴリ", 並び替え項目: "集計単位", 並び順: "昇順", 件数: "100" }),
  期待: (info) => ({
    説明: `カテゴリ02の1行だけが表示される（どのカテゴリにも属さないM1203-CB049-01の値は含まない）。${カテゴリの注記(info)}`, カテゴリ: true,
    行: [{ c: CBカテゴリ(info, "049", 2), 平均: 200, 数量: 1, 合計: 200, 件数: 1 }], 合計: { 数量: 1, 合計: 200, 件数: 1 },
  }),
}));

// ---------------------------------------------------------------- 結果の項目・CSVダウンロード（028・031）

async function 商品とカテゴリで検索する(ctx: Ctx, 読む: (p: SalesAnalysisPage) => Promise<string[] | number>): Promise<{ 商品: string[] | number; カテゴリ: string[] | number; info: データ情報[] }> {
  const { page, step } = ctx;
  await loginAdmin(page, M1203_ADMIN);
  const a = データ情報を読む("S-M12-03-PRODUCT");
  const b = データ情報を読む("S-M12-03-CATEGORY");
  const p = new SalesAnalysisPage(page);
  let 商品: string[] | number = [], カテゴリ: string[] | number = [];
  await step(1, async () => { await p.open(); });
  await step(2, async () => {
    note(年の注記(a.年));
    await p.通販を選ぶ(false);
    await p.店舗だけを選ぶ([TC東京]);
    await p.条件を入れる({ キーワード: "商品集計確認", ...日付範囲("04/01", "05/01"), 集計単位: "商品" }, a.年);
    await p.検索する();
    商品 = await 読む(p);
  });
  await step(3, async () => {
    note(`カテゴリ集計の年: ${b.年}（正本は2026。シードごとに、ほかの人の受注が無い年を選ぶので、商品集計と違う年になることがある）`);
    await p.条件を入れる({ キーワード: "カテゴリ重複確認", ...日付範囲("07/01", "08/01"), 集計単位: "カテゴリ" }, b.年);
    await p.検索する();
    カテゴリ = await 読む(p);
  });
  return { 商品, カテゴリ, info: [a, b] };
}

caseTest("IT-M12-03-028", async (ctx) => {
  const r = await 商品とカテゴリで検索する(ctx, async (p) => p.結果の見出し());
  const 商品 = r.商品 as string[]; const カテゴリ = r.カテゴリ as string[];
  await ctx.expected(async () => {
    expect.soft(商品, "商品集計結果の項目").toEqual(["商品コード", "商品名", "平均単価", "数量", "合計", "件数"]);
    expect.soft(カテゴリ, "カテゴリ集計結果の項目").toEqual(["カテゴリ", "平均単価", "数量", "合計", "件数"]);
    for (const w of ["数量割合", "合計割合", "件数割合"]) {
      expect.soft(商品, `商品集計結果に「${w}」が表示されない`).not.toContain(w);
      expect.soft(カテゴリ, `カテゴリ集計結果に「${w}」が表示されない`).not.toContain(w);
    }
  });
});

caseTest("IT-M12-03-031", async (ctx) => {
  const r = await 商品とカテゴリで検索する(ctx, async (p) => {
    const n = await p.CSVダウンロード.count();
    if (n) { await p.CSVダウンロード.first().scrollIntoViewIfNeeded(); await ctx.capture("CSVダウンロードのリンク"); }
    return (await p.CSVダウンロード.filter({ visible: true }).count());
  });
  await ctx.expected(async () => {
    expect.soft(r.商品, "商品集計結果にCSVダウンロードのリンクが表示される（表示されているリンクの数）").toBeGreaterThan(0);
    expect.soft(r.カテゴリ, "カテゴリ集計結果にCSVダウンロードのリンクが表示される（表示されているリンクの数）").toBeGreaterThan(0);
  });
});
