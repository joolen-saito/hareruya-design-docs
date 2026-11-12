/**
 * M12-01 日別・月別集計 集計一覧表示（IT-M12-01-001・006・007・008・013〜018・021・033・034・045）。ケースの正本: integration_test/casegen/cases/M12-01_test_cases.tsv
 *
 * 読み替え（シード m12-01.ts）: 大阪店・TC東京などの店舗は、実行の印を付けた店名の店舗を店舗登録画面で新しく作って使う（依頼者決定 2026-11-11）。
 * 画面の店舗の表示名はショップ名略称（店名と同じ値）なので、期待の店名も印つきの値（rc）で比べる。
 * 集計データは印つきの店舗の行だけ DB で足した（画面に集計行を入れる操作が無いため）。月別の集計月の列は画面では「2026/4」の形で、「2026-04」と同じ月として比べる。
 *
 * 実装しないケース（理由）:
 * - 009〜012・020・031・032・036〜043・047〜059: 受注・買取の DB 登録と日次・月次集計の更新コマンド（アプリサーバでの実行）が要る。
 *   049〜059 のうち通販の行（共有の集計行）を確かめるものは、期待結果が共有データの集計行に依存して印つきの行に絞れない。
 * - 022: 検索を実行する前は画面に CSVダウンロードのリンクが無く、押せない（直接アドレスを要求して代えない）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
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
    expect.soft(文字, "利用端末が表示されない").not.toContain("利用端末");
    expect.soft(文字, "表示項目が表示されない（表示項目(注文)・表示項目(詳細)）").not.toContain("表示項目");
  });
});

const 月の見た目 = (t: string) => t.replace(/^(\d{4})\/(\d{1,2})$/, (_, y, m) => `${y}-${String(m).padStart(2, "0")}`);
const 数 = (r: { 値: string[] }) => r.値.map((v) => Number(v.replace(/,/g, "")));
const 名 = { 大阪: rc("大阪店"), 東京: rc("TC東京"), 休業: rc("休業店"), 非集計: rc("非集計店"), 非公開: rc("非公開店") };
const 印の注記 = "店舗は、実行の印を付けた店名の店舗（大阪店・TC東京など）に読み替えた。集計日・集計月は正本のとおり";

caseTest("IT-M12-01-008", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 表示名: string[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記); 表示名 = await p.店舗の表示名(); });
  await expected(async () => {
    expect.soft(表示名, "「TC東京」が表示されている").toContain(名.東京);
    expect.soft(表示名, "「大阪店」が表示されている").toContain(名.大阪);
    expect.soft(表示名, "「休業店」が表示されている").toContain(名.休業);
    expect.soft(表示名, "売上集計対象外の「非集計店」が表示されない").not.toContain(名.非集計);
    expect.soft(表示名, "非公開の「非公開店」が表示されない").not.toContain(名.非公開);
  });
});

caseTest("IT-M12-01-013", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 行: Awaited<ReturnType<SummaryPage["結果の行"]>> = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記); await p.期間を入れる("2026-04-15", "2026-04-15"); });
  await step(3, async () => { await p.集計対象を選ぶ(false, [名.東京]); await p.検索する(); 行 = (await p.結果の行()).filter((r) => r.店舗 === 名.東京); });
  await expected(async () => {
    expect.soft(行.length, "2026/04/15 の「TC東京」の行の数").toBe(1);
    expect.soft(行[0]?.日, "集計日").toBe("2026/04/15");
    expect.soft(行[0] ? 数(行[0]) : [], "総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品").toEqual([1200, 400, 800, 3, 2, 600, 1, 250, 5, 6]);
  });
});

caseTest("IT-M12-01-014", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 行: Awaited<ReturnType<SummaryPage["結果の行"]>> = [];
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { note(印の注記); await p.期間を入れる("2026-04", "2026-04"); });
  await step(3, async () => { await p.集計対象を選ぶ(false, [名.大阪]); await p.検索する(); 行 = (await p.結果の行()).filter((r) => r.店舗 === 名.大阪); });
  await expected(async () => {
    expect.soft(行.length, "2026-04 の「大阪店」の行の数").toBe(1);
    expect.soft(行[0] ? 月の見た目(行[0].日) : "", "集計月").toBe("2026-04");
    expect.soft(行[0] ? 数(行[0]) : [], "総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品").toEqual([3000, 1000, 2000, 10, 4, 750, 2, 500, 7, 8]);
  });
});

caseTest("IT-M12-01-015", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記); await p.期間を入れる("2026-04-18", "2026-04-20"); });
  await step(3, async () => { await p.集計対象を選ぶ(false, [名.大阪, 名.東京]); await p.検索する(); });
  await step(4, async () => { 並び = (await p.結果の行()).filter((r) => r.店舗 !== "").map((r) => `${r.日}・${r.店舗}`); });
  await expected(async () => {
    expect.soft(並び, "一覧の集計日と店舗名の並び").toEqual([`2026/04/18・${名.大阪}`, `2026/04/18・${名.東京}`, `2026/04/20・${名.大阪}`, `2026/04/20・${名.東京}`]);
  });
});

caseTest("IT-M12-01-016", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 並び: string[] = [];
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { note(印の注記); await p.期間を入れる("2026-04", "2026-06"); });
  await step(3, async () => { await p.集計対象を選ぶ(false, [名.大阪, 名.東京]); await p.検索する(); });
  await step(4, async () => { 並び = (await p.結果の行()).filter((r) => r.店舗 !== "").map((r) => `${月の見た目(r.日)}・${r.店舗}`); });
  await expected(async () => {
    expect.soft(並び, "一覧の集計月と店舗名の並び").toEqual([`2026-04・${名.大阪}`, `2026-04・${名.東京}`, `2026-05・${名.大阪}`, `2026-05・${名.東京}`, `2026-06・${名.大阪}`, `2026-06・${名.東京}`]);
  });
});

caseTest("IT-M12-01-017", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 総合計: number[] = [];
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記); await p.期間を入れる("2026-04-21", "2026-04-21"); });
  await step(3, async () => { await p.集計対象を選ぶ(false, [名.大阪, 名.東京]); await p.検索する(); });
  await step(4, async () => { const r = (await p.結果の行()).find((x) => x.日 === "総合計"); 総合計 = r ? 数(r) : []; });
  await expected(async () => {
    expect.soft(総合計.slice(1), "総合計行の総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品").toEqual([300, 70, 230, 5, 3, 200, 3, 70, 10, 12]);
  });
});

caseTest("IT-M12-01-018", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let 状態: { from: string; to: string; 通販: boolean; 店舗: string[] } = { from: "", to: "", 通販: true, 店舗: [] };
  await step(1, async () => { await p.open("daily"); });
  await step(2, async () => { note(印の注記); await p.期間を入れる("2026-04-15", "2026-04-15"); });
  await step(3, async () => { await p.集計対象を選ぶ(false, [名.東京]); await p.検索する(); });
  await step(4, async () => {
    const names = await p.店舗の表示名(); const on = await p.各店舗の状態();
    状態 = { from: await p.集計日From.inputValue(), to: await p.集計日To.inputValue(), 通販: await p.通販.isChecked(), 店舗: names.filter((_, i) => on[i]) };
  });
  await expected(async () => {
    expect.soft(状態.from, "集計日(From)").toBe("2026-04-15");
    expect.soft(状態.to, "集計日(To)").toBe("2026-04-15");
    expect.soft(状態.通販, "集計対象(通販)がチェックOFF").toBe(false);
    expect.soft(状態.店舗, "チェックONの店舗は「TC東京」だけ").toEqual([名.東京]);
  });
});

caseTest("IT-M12-01-021", async ({ page, step, expected }) => {
  await loginAdmin(page, M1201_ADMIN);
  const p = new SummaryPage(page);
  let csv: Awaited<ReturnType<SummaryPage["CSVをダウンロードする"]>> = null;
  await step(1, async () => {
    await p.open("daily"); note(印の注記);
    await p.期間を入れる("2026-04-15", "2026-04-15"); await p.集計対象を選ぶ(false, [名.東京]); await p.検索する();
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
  let 総合計: number[] = [];
  await step(1, async () => { await p.open("monthly"); });
  await step(2, async () => { note(印の注記); await p.期間を入れる("2025-11", "2025-11"); });
  await step(3, async () => { await p.集計対象を選ぶ(false, [名.大阪, 名.東京]); await p.検索する(); });
  await step(4, async () => { const r = (await p.結果の行()).find((x) => x.日 === "総合計"); 総合計 = r ? 数(r) : []; });
  await expected(async () => {
    expect.soft(総合計.slice(1), "総合計行の総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品（整数）").toEqual([405, 105, 300, 10, 5, 160, 3, 60, 8, 6]);
  });
});
