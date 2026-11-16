/**
 * M12-01 日別・月別集計 集計一覧表示（IT-M12-01-001・006・007・008・013〜018・021・033・034・045）。ケースの正本: integration_test/casegen/cases/M12-01_test_cases.tsv
 *
 * 読み替え（シード m12-01.ts）: 店舗は作らず（依頼者 2026-11-15）、E2E の店舗を店舗IDで使う（大阪店=221・TC東京=5006・休業店=5007・非集計店=4973・非公開店=4974）。
 * 正本の性質に合わない店舗は、ケースの間だけ店舗登録画面で性質を変え、ケースの終わりに元へ戻した。店舗は店舗IDで選び、画面の表示名（ショップ名略称）は選んだ店舗のものを期待にする。
 * 集計データは E2E の店舗の行だけ DB で足した（画面に集計行を入れる操作が無いため）。集計行は消せないので、正本の日付の年（2026・2025）は、
 * E2E の店舗の集計行がほかに無い遠い将来の年に読み替えた（月日は正本のとおり）。月別の集計月の列は画面では「2126/4」の形で、「2126-04」と同じ月として比べる。
 *
 * 実装しないケース（理由）:
 * - 009〜012・020・031・032・036〜043・047〜059: 受注・買取の DB 登録と日次・月次集計の更新コマンド（アプリサーバでの実行）が要る。
 *   049〜059 のうち通販の行（共有の集計行）を確かめるものは、期待結果が共有データの集計行に依存して印つきの行に絞れない。
 * - 022: 検索を実行する前は画面に CSVダウンロードのリンクが無く、押せない（直接アドレスを要求して代えない）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { 年を読む, 読み替える, 店舗 } from "../../db/m12_01";
import { SummaryPage } from "../../pages/admin/m12_01_summary";
import { M1201_ADMIN } from "../../seeds/m12-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-M12-01-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 文字 = "";
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => {
    note("集計日(From)・(To)は日付の入力欄、集計対象(通販)・全店舗のチェックは画面のチェック欄、店舗全選択/全解除は画面の「全店舗チェック」で確かめた");
    文字 = await p.検索フォームの文字();
  });
  await expected(async () => {
    expect.soft(await p.集計タイプ.count(), "集計タイプの選択肢の数（日次・月次）").toBe(2);
    expect.soft(await p.集計日From.isVisible(), "集計日(From)が表示されている").toBe(true);
    expect.soft(await p.集計日To.isVisible(), "集計日(To)が表示されている").toBe(true);
    expect.soft(await p.通販.isVisible(), "集計対象(通販)が表示されている").toBe(true);
    expect.soft(文字, "集計対象の「店舗売上」の見出し").toContain("店舗売上");
    expect.soft(await p.各店舗.count(), "集計対象(各店舗)のチェック欄の数（1以上）").toBeGreaterThan(0);
    expect.soft(await p.店舗全選択.isVisible(), "店舗全選択/全解除が表示されている").toBe(true);
    expect.soft(await p.検索ボタン.isVisible(), "検索ボタンが表示されている").toBe(true);
    expect.soft(await p.検索枠ボタン.isVisible(), "検索枠表示・非表示ボタンが表示されている").toBe(true);
    expect.soft(文字, "利用端末が表示されない").not.toContain("利用端末");
    expect.soft(文字, "表示項目が表示されない（表示項目(注文)・表示項目(詳細)）").not.toContain("表示項目");
  });
});

caseTest("IT-M12-01-006", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const 表示: boolean[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { await p.検索枠ボタン.click({ timeout: 20_000 }); await page.waitForTimeout(800); 表示.push(await p.検索枠.isVisible()); });
  await step(3, async () => { await p.検索枠ボタン.click({ timeout: 20_000 }); await page.waitForTimeout(800); 表示.push(await p.検索枠.isVisible()); });
  await expected(async () => {
    expect.soft(表示[0], "1回目の押下のあと、検索枠（識別ID 1〜6）が表示されている").toBe(false);
    expect.soft(表示[1], "2回目の押下のあと、検索枠（識別ID 1〜6）が表示されている").toBe(true);
  });
});

caseTest("IT-M12-01-007", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let ON: boolean[] = [];
  let OFF: boolean[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { await p.店舗全選択.setChecked(true, { timeout: 20_000 }); });
  await step(3, async () => { ON = await p.各店舗の状態(); });
  await step(4, async () => { await p.店舗全選択.setChecked(false, { timeout: 20_000 }); });
  await step(5, async () => { OFF = await p.各店舗の状態(); });
  await expected(async () => {
    expect.soft(ON.length, "表示されている店舗の数（1以上）").toBeGreaterThan(0);
    expect.soft(ON.every((c) => c), "チェックON後、表示されている全店舗がチェックONである").toBe(true);
    expect.soft(OFF.length, "チェックOFF後の店舗の数（ONのときと同じ）").toBe(ON.length);
    expect.soft(OFF.every((c) => !c), "チェックOFF後、表示されている全店舗がチェックOFFである").toBe(true);
  });
});

caseTest("IT-M12-01-033", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 文字 = "";
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => {
    note("集計月(From)・(To)は月（年-月）の入力欄で確かめた");
    文字 = await p.検索フォームの文字();
  });
  await expected(async () => {
    expect.soft(await p.集計タイプ.count(), "集計タイプの選択肢の数（日次・月次）").toBe(2);
    expect.soft(文字, "集計月の見出し").toContain("集計月");
    expect.soft(await p.集計日From.isVisible(), "集計月(From)が表示されている").toBe(true);
    expect.soft(await p.集計日To.isVisible(), "集計月(To)が表示されている").toBe(true);
    expect.soft(await p.通販.isVisible(), "集計対象(通販)が表示されている").toBe(true);
    expect.soft(文字, "集計対象の「店舗売上」の見出し").toContain("店舗売上");
    expect.soft(await p.各店舗.count(), "集計対象(各店舗)のチェック欄の数（1以上）").toBeGreaterThan(0);
    expect.soft(await p.店舗全選択.isVisible(), "店舗全選択/全解除が表示されている").toBe(true);
    expect.soft(await p.検索ボタン.isVisible(), "検索ボタンが表示されている").toBe(true);
    expect.soft(await p.検索枠ボタン.isVisible(), "検索枠表示・非表示ボタンが表示されている").toBe(true);
  });
});

caseTest("IT-M12-01-034", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 文字 = "";
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { 文字 = await p.検索フォームの文字(); });
  await expected(async () => {
    // 月別の検索枠が開いていることを見てから「表示されない」を確かめる
    expect.soft(文字, "月別の検索枠（集計月の見出し）が開いている").toContain("集計月");
    expect.soft(文字, "利用端末が表示されない").not.toContain("利用端末");
    expect.soft(文字, "表示項目が表示されない（表示項目(注文)・表示項目(詳細)）").not.toContain("表示項目");
  });
});

const 月の見た目 = (t: string) => t.replace(/^(\d{4})\/(\d{1,2})$/, (_, y, m) => `${y}-${String(m).padStart(2, "0")}`);
const 数 = (r: { 値: string[] }) => r.値.map((v) => Number(v.replace(/,/g, "")));
/** 店舗の呼び名 → 選んだ E2E の店舗の店舗ID・画面の表示名（シードが控えた値） */
const 名 = { get 大阪() { return 店舗("大阪店").店名; }, get 東京() { return 店舗("TC東京").店名; }, get 休業() { return 店舗("休業店").店名; } };
const ID = { get 大阪() { return 店舗("大阪店").id; }, get 東京() { return 店舗("TC東京").id; }, get 休業() { return 店舗("休業店").id; }, get 非集計() { return 店舗("非集計店").id; }, get 非公開() { return 店舗("非公開店").id; } };
const 印の注記 = () => `店舗は E2E の店舗（大阪店=店舗ID ${ID.大阪}・TC東京=${ID.東京}・休業店=${ID.休業}・非集計店=${ID.非集計}・非公開店=${ID.非公開}）に読み替え、性質が正本と違うものはケースの間だけ画面で変えた。集計日・集計月は正本の年を読み替えた年に置いた（月日は正本のとおり）`;

caseTest("IT-M12-01-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 表示ID: string[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記()); 表示ID = await p.店舗のID(); });
  await expected(async () => {
    // 表示名は店舗ごとに違う値なので、集計対象(各店舗)のチェック欄の値（店舗ID）で比べる
    expect.soft(表示ID, `「TC東京」（店舗ID ${ID.東京}）が表示されている`).toContain(ID.東京);
    expect.soft(表示ID, `「大阪店」（店舗ID ${ID.大阪}）が表示されている`).toContain(ID.大阪);
    expect.soft(表示ID, `「休業店」（店舗ID ${ID.休業}）が表示されている`).toContain(ID.休業);
    expect.soft(表示ID, `売上集計対象外の「非集計店」（店舗ID ${ID.非集計}）が表示されない`).not.toContain(ID.非集計);
    expect.soft(表示ID, `非公開の「非公開店」（店舗ID ${ID.非公開}）が表示されない`).not.toContain(ID.非公開);
  });
});

caseTest("IT-M12-01-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("DAILY-RESULT");
  const 日 = (d: string) => 読み替える(y, d);
  let 行: Awaited<ReturnType<SummaryPage["結果の行"]>> = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記()); await p.期間を入れる(日("2026-04-15"), 日("2026-04-15")); });
  await step(3, async () => { await p.集計対象を店舗IDで選ぶ(false, [ID.東京]); await p.検索する(); 行 = (await p.結果の行()).filter((r) => r.店舗 === 名.東京); });
  await expected(async () => {
    expect.soft(行.length, "2026/04/15 の「TC東京」の行の数").toBe(1);
    expect.soft(行[0]?.日, "集計日").toBe(日("2026/04/15"));
    expect.soft(行[0] ? 数(行[0]) : [], "総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品").toEqual([1200, 400, 800, 3, 2, 600, 1, 250, 5, 6]);
  });
});

caseTest("IT-M12-01-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("MONTHLY-RESULT");
  const 日 = (d: string) => 読み替える(y, d);
  let 行: Awaited<ReturnType<SummaryPage["結果の行"]>> = [];
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { note(印の注記()); await p.期間を入れる(日("2026-04"), 日("2026-04")); });
  await step(3, async () => { await p.集計対象を店舗IDで選ぶ(false, [ID.大阪]); await p.検索する(); 行 = (await p.結果の行()).filter((r) => r.店舗 === 名.大阪); });
  await expected(async () => {
    expect.soft(行.length, "2026-04 の「大阪店」の行の数").toBe(1);
    expect.soft(行[0] ? 月の見た目(行[0].日) : "", "集計月").toBe(日("2026-04"));
    expect.soft(行[0] ? 数(行[0]) : [], "総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品").toEqual([3000, 1000, 2000, 10, 4, 750, 2, 500, 7, 8]);
  });
});

caseTest("IT-M12-01-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("SORT-015");
  const 日 = (d: string) => 読み替える(y, d);
  let 並び: string[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記()); await p.期間を入れる(日("2026-04-18"), 日("2026-04-20")); });
  await step(3, async () => { await p.集計対象を店舗IDで選ぶ(false, [ID.大阪, ID.東京]); await p.検索する(); });
  await step(4, async () => { 並び = (await p.結果の行()).filter((r) => r.店舗 !== "").map((r) => `${r.日}・${r.店舗}`); });
  await expected(async () => {
    expect.soft(並び, "一覧の集計日と店舗名の並び").toEqual([`${日("2026/04/18")}・${名.大阪}`, `${日("2026/04/18")}・${名.東京}`, `${日("2026/04/20")}・${名.大阪}`, `${日("2026/04/20")}・${名.東京}`]);
  });
});

caseTest("IT-M12-01-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("MONTHLY-RESULT");
  const 日 = (d: string) => 読み替える(y, d);
  let 並び: string[] = [];
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { note(印の注記()); await p.期間を入れる(日("2026-04"), 日("2026-06")); });
  await step(3, async () => { await p.集計対象を店舗IDで選ぶ(false, [ID.大阪, ID.東京]); await p.検索する(); });
  await step(4, async () => { 並び = (await p.結果の行()).filter((r) => r.店舗 !== "").map((r) => `${月の見た目(r.日)}・${r.店舗}`); });
  await expected(async () => {
    expect.soft(並び, "一覧の集計月と店舗名の並び").toEqual([`${日("2026-04")}・${名.大阪}`, `${日("2026-04")}・${名.東京}`, `${日("2026-05")}・${名.大阪}`, `${日("2026-05")}・${名.東京}`, `${日("2026-06")}・${名.大阪}`, `${日("2026-06")}・${名.東京}`]);
  });
});

caseTest("IT-M12-01-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("TOTAL-017");
  const 日 = (d: string) => 読み替える(y, d);
  let 総合計: number[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記()); await p.期間を入れる(日("2026-04-21"), 日("2026-04-21")); });
  await step(3, async () => { await p.集計対象を店舗IDで選ぶ(false, [ID.大阪, ID.東京]); await p.検索する(); });
  await step(4, async () => { const r = (await p.結果の行()).find((x) => x.日 === "総合計"); 総合計 = r ? 数(r) : []; });
  await expected(async () => {
    // 総合計の行の値は、店舗名の空欄を除いた10個（結果の行() が日付と店舗名の欄を外してある）
    expect.soft(総合計, "総合計行の総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品").toEqual([300, 70, 230, 5, 3, 200, 3, 70, 10, 12]);
  });
});

caseTest("IT-M12-01-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("DAILY-RESULT");
  const 日 = (d: string) => 読み替える(y, d);
  let 状態: { from: string; to: string; 通販: boolean; 店舗: string[] } = { from: "", to: "", 通販: true, 店舗: [] };
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記()); await p.期間を入れる(日("2026-04-15"), 日("2026-04-15")); });
  await step(3, async () => { await p.集計対象を店舗IDで選ぶ(false, [ID.東京]); await p.検索する(); });
  await step(4, async () => {
    const ids = await p.店舗のID(); const on = await p.各店舗の状態();
    状態 = { from: await p.集計日From.inputValue(), to: await p.集計日To.inputValue(), 通販: await p.通販.isChecked(), 店舗: ids.filter((_, i) => on[i]) };
  });
  await expected(async () => {
    expect.soft(状態.from, "集計日(From)").toBe(日("2026-04-15"));
    expect.soft(状態.to, "集計日(To)").toBe(日("2026-04-15"));
    expect.soft(状態.通販 === false, "集計対象(通販)がチェックOFF").toBe(true);
    expect.soft(状態.店舗, "チェックONの店舗は「TC東京」（店舗ID）だけ").toEqual([ID.東京]);
  });
});

caseTest("IT-M12-01-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("DAILY-RESULT");
  const 日 = (d: string) => 読み替える(y, d);
  let csv: Awaited<ReturnType<SummaryPage["CSVをダウンロードする"]>> = null;
  await step(1, async () => {
    await p.open("daily"); note(印の注記());
    await p.期間を入れる(日("2026-04-15"), 日("2026-04-15")); await p.集計対象を店舗IDで選ぶ(false, [ID.東京]); await p.検索する();
  });
  await step(2, async () => { csv = await p.CSVをダウンロードする(); });
  await step(3, async () => { note("ダウンロードされたファイルは、ブラウザが受け取った1ファイルの名前と先頭のバイトで確かめた"); });
  await expected(async () => {
    expect.soft(csv !== null, "CSVが1ファイルダウンロードされた").toBe(true);
    expect.soft(csv?.fileName ?? "", "ファイル名").toMatch(/^report_summary_\d{14}\.csv$/);
    expect.soft(csv ? [...csv.先頭] : [], "ファイル先頭がBOM").toEqual([0xef, 0xbb, 0xbf]);
  });
});

caseTest("IT-M12-01-045", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  const y = 年を読む("TOTALM-045");
  const 日 = (d: string) => 読み替える(y, d);
  let 総合計: number[] = [];
  let 表示: string[] = [];
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { note(印の注記()); await p.期間を入れる(日("2025-11"), 日("2025-11")); });
  await step(3, async () => { await p.集計対象を店舗IDで選ぶ(false, [ID.大阪, ID.東京]); await p.検索する(); });
  await step(4, async () => { const r = (await p.結果の行()).find((x) => x.日 === "総合計"); 総合計 = r ? 数(r) : []; 表示 = r ? r.値 : []; });
  await expected(async () => {
    expect.soft(総合計, "総合計行の総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品（整数）").toEqual([405, 105, 300, 10, 5, 160, 3, 60, 8, 6]);
    // 数に直すと「160.0」も 160 になるので、画面の表示が整数の形（小数点なし）であることを文字で見る
    expect.soft(表示.filter((v) => !/^-?[\d,]+$/.test(v)), "総合計行に整数でない表示が無い").toEqual([]);
    expect.soft(表示.length, "総合計行の値の数").toBe(10);
  });
});
