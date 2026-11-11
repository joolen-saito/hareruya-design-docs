/**
 * M06-08 買取集計データ(検索入力)。正本: cases/M06-08_test_cases.tsv
 * 買取集計データは DB で試験店舗に作る（seeds/m06-08.ts。M06-09 と同じ作り方）。東京店・大阪店は、ケースごとの試験店舗（東京店の役 A・大阪店の役 B）に代えた。
 * 部門は既存の「カード」「サプライ」と3つ目の部門で、期待の D01・D02・D03 は、その部門の実際のコードとして確かめる。
 *
 * 実装しないケースと理由:
 * - 006・014: 共有の追加システム設定（端数調整部門）を書き換え、買取集計バッチ（B06-02）を実行して集計する必要がある
 * - 009・010・012: 買取店舗と部門を未選択（全店舗・全部門）で検索し、全体の集計を数えるので、ほかの実データ・ほかのケースの集計が混ざる
 */
import { Page, test } from "@playwright/test";
import fs from "node:fs";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { loginAdmin } from "../../lib/session";
import { M0608SummaryPage } from "../../pages/admin/m06_08_summary";
import { 集計の記録 } from "../../db/m06_08_prep";
import { M0608_ADMIN, 既存の部門, 三つ目の部門, 店名, 店舗の注記, 部門の注記 } from "../../seeds/m06-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const 開く = async (page: CaseCtx["page"], no: string): Promise<M0608SummaryPage> => { await loginAdmin(page, M0608_ADMIN(no)); return new M0608SummaryPage(page); };

/** 検索条件を入れて検索する（店・部門は名前。null なら選ばない） */
async function 検索する(s: M0608SummaryPage, 期間: [string, string], 店: string | null, 部門名: string | null): Promise<void> {
  await s.集計日を入れる(期間[0], 期間[1]);
  if (店) await s.買取店舗を選ぶ(店);
  if (部門名) await s.部門を選ぶ(部門名);
  await s.検索する();
}
type 行 = { 部門コード: string; 部門: string; 買取金額: number; 販売金額: number };
type 日別 = 行 & { 集計日: string };
const 行にする = (d: { 部門コード: string; 部門名: string }, 買取金額: number, 販売金額: number): 行 => ({ 部門コード: d.部門コード, 部門: d.部門名, 買取金額, 販売金額 });
const 日別にする = (日: string, r: 行): 日別 => ({ 集計日: 日, ...r });

async function CSVをダウンロードする(page: Page, s: M0608SummaryPage): Promise<string[][]> {
  const dl = page.waitForEvent("download", { timeout: 60_000 });
  await s.CSVダウンロードのボタン().click({ timeout: 30_000 });
  const d = await dl;
  return parseCsv(decodeCsvBytes(fs.readFileSync(await d.path())));
}
const ヘッダ = ["集計日", "部門コード", "部門", "買取金額", "販売金額"];
const csv行 = (日: string, d: { 部門コード: string; 部門名: string }, 買取: number, 販売: number) => [日, d.部門コード, d.部門名, String(買取), String(販売)];

caseTest("IT-M06-08-001", async ({ page, step, expected }) => {
  const s = await 開く(page, "001");
  await step(1, async () => { await s.open(); });
  await expected(async () => {
    await expect.soft(page.locator("#search_form"), "検索欄が表示される").toBeVisible();
    expect.soft(await s.結果の欄の数(), "期間全体の集計表と日別の集計表の欄の数").toBe(0);
  });
  note(店舗の注記);
});

caseTest("IT-M06-08-002", async ({ page, step, expected }) => {
  const s = await 開く(page, "002");
  let 選択中: string[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { 選択中 = await s.選択中の店舗(); });
  await expected(async () => {
    expect.soft(選択中, "選択されている買取店舗（デフォルト検索表示店舗の東京店の役）").toEqual([店名("002")]);
  });
  note(店舗の注記);
});

caseTest("IT-M06-08-003", async ({ page, step, expected }) => {
  const s = await 開く(page, "003");
  let 選択中: string[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { 選択中 = await s.選択中の店舗(); });
  await expected(async () => {
    expect.soft(選択中, "選択されている買取店舗（未選択）").toEqual([]);
  });
  note(`${店舗の注記}。デフォルト検索表示店舗「全店」は、メンバーのデフォルト検索表示店舗を未選択にして表した`);
});

caseTest("IT-M06-08-004", async ({ page, step, expected }) => {
  const s = await 開く(page, "004");
  let 日付 = { from: "", to: "" };
  let 部門: string[] = [];
  let 店: string[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    await s.集計日を入れる("2026-09-01", "2026-09-01");
    await s.部門を選ぶ("カード");
    await s.買取店舗を未選択にする();
    await s.買取店舗を選ぶ(店名("004", "B"));
    await s.検索する();
  });
  await step(3, async () => { await s.メニューから開き直す(); });
  await step(4, async () => { 日付 = await s.集計日(); 部門 = await s.選択中の部門(); 店 = await s.選択中の店舗(); });
  await expected(async () => {
    expect.soft(日付, "集計日(From)・集計日(To)が保持されず空").toEqual({ from: "", to: "" });
    expect.soft(部門, "選択されている部門（カードが保持されず未選択）").toEqual([]);
    expect.soft(店, "選択されている買取店舗（大阪店の役が保持されず、デフォルト検索表示店舗の東京店の役に戻る）").toEqual([店名("004")]);
  });
  note(`${店舗の注記}。手順2は、大阪店の役を選ぶために、デフォルトで選ばれている東京店の役の選択を外してから選んだ`);
});

caseTest("IT-M06-08-005", async ({ page, step, expected }) => {
  const s = await 開く(page, "005");
  let 部門: string[] = [];
  let 店: string[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { 部門 = await s.部門の選択肢(); 店 = await s.店舗の選択肢(); });
  await expected(async () => {
    for (const n of ["カード", "サプライ", 三つ目の部門().部門名]) expect.soft(部門, `部門の選択肢に「${n}」がある`).toContain(n);
    for (const n of [店名("005", "A"), 店名("005", "B")]) expect.soft(店, `買取店舗の選択肢に「${n}」がある`).toContain(n);
  });
  note(`${店舗の注記}。${部門の注記}`);
});

caseTest("IT-M06-08-007", async ({ page, step, expected }) => {
  const s = await 開く(page, "007");
  const カード = 既存の部門("カード");
  let 期間全体: 行[] = []; let 日別の行: 日別[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名("007"), "カード"); });
  await step(3, async () => { 期間全体 = await s.期間全体の行(); 日別の行 = await s.日別の行(); });
  await expected(async () => {
    expect.soft(期間全体, "期間全体の集計（09/01 00:00:00 と 23:59:59 のデータだけ。買取金額3000・販売金額7000）").toEqual([行にする(カード, 3000, 7000)]);
    expect.soft(日別の行, "日別の集計").toEqual([日別にする("2026/09/01", 行にする(カード, 3000, 7000))]);
  });
  note(`${店舗の注記}。${部門の注記}`);
});

caseTest("IT-M06-08-008", async ({ page, step, expected }) => {
  const s = await 開く(page, "008");
  const サプライ = 既存の部門("サプライ");
  let 期間全体: 行[] = []; let 日別の行: 日別[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    await 検索する(s, ["2026-09-01", "2026-09-01"], 店名("008"), "サプライ");
    期間全体 = await s.期間全体の行(); 日別の行 = await s.日別の行();
  });
  await expected(async () => {
    expect.soft(期間全体, "期間全体の集計（東京店の役・サプライのデータだけ。買取金額400・販売金額500）").toEqual([行にする(サプライ, 400, 500)]);
    expect.soft(日別の行, "日別の集計").toEqual([日別にする("2026/09/01", 行にする(サプライ, 400, 500))]);
  });
  note(`${店舗の注記}。${部門の注記}。手順2の検索結果は、期待結果の確認のために同じ手順の中で読んだ`);
});

caseTest("IT-M06-08-015", async ({ page, step, expected }) => {
  const s = await 開く(page, "015");
  const カード = 既存の部門("カード");
  let 日別の行: 日別[] = []; let csv: string[][] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    await s.集計日を入れる("2026-08-31", "2026-09-02");
    await s.買取店舗を未選択にする(); await s.部門を未選択にする();
    await s.検索する();
  });
  await step(3, async () => {
    await s.集計日を入れる("2026-09-01", "2026-09-01");
    await s.部門を未選択にする(); await s.買取店舗を未選択にする();
    await s.部門を選ぶ("カード"); await s.買取店舗を選ぶ(店名("015"));
    await s.検索する();
  });
  await step(4, async () => { 日別の行 = await s.日別の行(); });
  await step(5, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(6, async () => { csv = [...csv]; });
  await expected(async () => {
    expect.soft(csv.slice(1), "CSVのデータ行（直前の検索条件の1行だけ）").toEqual([csv行("2026/09/01", カード, 3000, 7000)]);
    expect.soft(csv.slice(1), "CSVのデータ行が手順4の日別の集計結果と同じ").toEqual(日別の行.map((r) => csv行(r.集計日, { 部門コード: r.部門コード, 部門名: r.部門 }, r.買取金額, r.販売金額)));
    expect.soft(csv[0], "CSVの1行目（ヘッダ行）").toEqual(ヘッダ);
  });
  note(`${店舗の注記}。${部門の注記}。手順2・3の「未選択」は、デフォルトで選ばれている買取店舗の選択を外して表した`);
});

caseTest("IT-M06-08-017", async ({ page, step, expected }) => {
  const s = await 開く(page, "017");
  let 日付 = { from: "x", to: "x" }; let 部門: string[] = []; let 店: string[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    await s.集計日を入れる("", "2026-09-01");
    await s.部門を選ぶ("カード");
    await s.買取店舗を未選択にする();
    await s.買取店舗を選ぶ(店名("017", "B"));
    await s.検索するを押すだけ();
  });
  await step(3, async () => { 日付 = await s.集計日(); 部門 = await s.選択中の部門(); 店 = await s.選択中の店舗(); });
  await expected(async () => {
    expect.soft(日付, "集計日(From)の空値と集計日(To)の2026/09/01が検索欄に保持される").toEqual({ from: "", to: "2026-09-01" });
    expect.soft(部門, "選択されている部門（カード）").toEqual(["カード"]);
    expect.soft(店, "選択されている買取店舗（大阪店の役）").toEqual([店名("017", "B")]);
    expect.soft(await s.結果の欄の数(), "検索結果の欄が出ない（検証エラー）").toBe(0);
  });
  note(`${店舗の注記}。集計日(From)は必須の欄で、ブラウザの入力チェックが送信を止めることもある。止まった場合も、止まったままの検索欄の状態を確かめた`);
});

caseTest("IT-M06-08-018", async ({ page, step, expected }) => {
  const s = await 開く(page, "018");
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await s.集計日を入れる("2099-01-01", "2099-01-01"); await s.検索する(); });
  await expected(async () => {
    expect.soft(await s.期間全体の文(), "期間全体の欄の空結果のメッセージ").toContain("期間全体の集計データがありませんでした");
    expect.soft(await s.日別の文(), "日別の欄の空結果のメッセージ").toContain("日別の集計データがありませんでした");
    expect.soft(await s.期間全体の欄().locator("table").count(), "期間全体の集計表が表示されない").toBe(0);
    expect.soft(await s.日別の表の行().count(), "日別の集計表が表示されない").toBe(0);
    await expect.soft(s.CSVダウンロードのボタン(), "CSVダウンロードボタンが表示されない").toHaveCount(0);
  });
  note(店舗の注記);
});

caseTest("IT-M06-08-023", async ({ page, browser, step, expected }) => {
  const s = await 開く(page, "023");
  const ctxB = await browser.newContext({ ignoreHTTPSErrors: true });
  const pageB = await ctxB.newPage();
  const sB = new M0608SummaryPage(pageB);
  let 送信先 = "";
  let ダウンロードされた = false;
  try {
    await step(1, async () => { await s.open(); });
    await step(2, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名("023"), "カード"); });
    await step(3, async () => { 送信先 = await s.CSVダウンロードのボタン().evaluate((b) => new URL((b.closest("form") as HTMLFormElement).action, location.href).toString()); });
    await step(4, async () => { await loginAdmin(pageB, M0608_ADMIN("023")); await sB.open(); });
    await step(5, async () => {
      const dl = pageB.waitForEvent("download", { timeout: 10_000 }).then(() => true, () => false);
      await pageB.evaluate((url) => { const f = document.createElement("form"); f.method = "post"; f.action = url; document.body.appendChild(f); f.submit(); }, 送信先);
      await pageB.waitForLoadState("load");
      ダウンロードされた = await dl;
    });
    await expected(async () => {
      expect.soft(ダウンロードされた, "CSVがダウンロードされる（されない）").toBe(false);
      expect.soft(new URL(pageB.url()).pathname, "表示された画面（買取集計データ画面）").toMatch(/\/otcbuyorder\/summary$/);
      await expect.soft(pageB.locator('input[name="admin_otc_buy_order_summary[summary_date_from]"]'), "買取集計データ画面の集計日の入力欄が表示される").toBeVisible();
    });
    note(`${店舗の注記}。ブラウザBは、別のコンテキスト（サイトデータが独立）で同じ管理者としてログインした。手順3の送信先（${送信先}）へ POST のフォームを作って送信した。CSVボタンが出るよう、東京店の役に09/01のカードの買取集計データを1行DBで足した`);
  } finally {
    await ctxB.close();
  }
});

caseTest("IT-M06-08-024", async ({ page, db, step, expected }) => {
  const s = await 開く(page, "024");
  const 店 = [店名("024", "A"), 店名("024", "B")];
  let 前: string[] = []; let 後: string[] = [];
  await step(1, async () => { 前 = 集計の記録(db.query, 店); });
  await step(2, async () => { await s.open(); });
  await step(3, async () => { await s.集計日を入れる("2026-09-01", "2026-09-01"); await s.検索する(); });
  await step(4, async () => { 後 = 集計の記録(db.query, 店); });
  await expected(async () => {
    expect.soft(前.length, "検索前の買取集計データの件数（6件）").toBe(6);
    expect.soft(後, "検索後の買取集計データの件数・集計日・買取金額・販売金額が検索前と同じ").toEqual(前);
  });
  note(`${店舗の注記}。DBで記録した対象は、このシードの試験店舗2件の買取集計データ`);
});

caseTest("IT-M06-08-026", async ({ page, step, expected }) => {
  const s = await 開く(page, "026");
  const カード = 既存の部門("カード"); const サプライ = 既存の部門("サプライ"); const 三つ目 = 三つ目の部門();
  let 期間全体: 行[] = []; let 日別の行: 日別[] = [];
  const 並べ = <T extends 行>(r: T[]) => [...r].sort((a, b) => a.部門コード.localeCompare(b.部門コード));
  await step(1, async () => { await s.open(); });
  await step(2, async () => {
    await s.集計日を入れる("2026-09-01", "2026-09-01");
    await s.買取店舗を選ぶ(店名("026"));
    await s.部門を複数選ぶ(["カード", "サプライ"]);
    await s.検索する();
  });
  await step(3, async () => { 期間全体 = await s.期間全体の行(); 日別の行 = await s.日別の行(); });
  await expected(async () => {
    expect.soft(並べ(期間全体), "期間全体の集計（カードとサプライ。3つ目の部門の行は無い）").toEqual(並べ([行にする(カード, 1000, 3000), 行にする(サプライ, 400, 500)]));
    expect.soft(並べ(日別の行), "日別の集計（カードとサプライ。3つ目の部門の行は無い）").toEqual(並べ([日別にする("2026/09/01", 行にする(カード, 1000, 3000)), 日別にする("2026/09/01", 行にする(サプライ, 400, 500))]));
    expect.soft([...期間全体, ...日別の行].some((r) => r.部門 === 三つ目.部門名), `${三つ目.部門名}の行が表示される（されない）`).toBe(false);
  });
  note(`${店舗の注記}。${部門の注記}`);
});

caseTest("IT-M06-08-027", async ({ page, step, expected }) => {
  const s = await 開く(page, "027");
  const カード = 既存の部門("カード");
  let 期間全体: 行[] = []; let 日別の行: 日別[] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-05", "2026-09-05"], 店名("027"), null); });
  await step(3, async () => { 期間全体 = await s.期間全体の行(); 日別の行 = await s.日別の行(); });
  const 未設定 = (r: 行[]) => r.filter((x) => x.部門 === "未設定");
  await expected(async () => {
    expect.soft(期間全体.filter((x) => x.部門 === カード.部門名), "期間全体のカードの行").toEqual([行にする(カード, 1000, 3000)]);
    expect.soft(未設定(期間全体), "期間全体の部門名「未設定」の行").toEqual([{ 部門コード: "", 部門: "未設定", 買取金額: 1200, 販売金額: 3400 }]);
    expect.soft(日別の行.filter((x) => x.部門 === カード.部門名), "日別のカードの行").toEqual([日別にする("2026/09/05", 行にする(カード, 1000, 3000))]);
    expect.soft(未設定(日別の行), "日別の部門名「未設定」の行").toEqual([{ 集計日: "2026/09/05", 部門コード: "", 部門: "未設定", 買取金額: 1200, 販売金額: 3400 }]);
    expect.soft(期間全体.length + 日別の行.length, "表示された行の数（期間全体2行・日別2行）").toBe(4);
  });
  note(`${店舗の注記}。${部門の注記}。部門との紐づけなしの行の部門コードは空欄で確かめた`);
});

caseTest("IT-M06-08-028", async ({ page, step, expected }) => {
  const s = await 開く(page, "028");
  const カード = 既存の部門("カード"); const サプライ = 既存の部門("サプライ");
  let 日別の行: 日別[] = []; let csv: string[][] = [];
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-06", "2026-09-07"], 店名("028"), null); });
  await step(3, async () => { 日別の行 = await s.日別の行(); });
  await step(4, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(5, async () => { csv = [...csv]; });
  await expected(async () => {
    expect.soft(csv.slice(1), "CSVのデータ行（日付の昇順、同じ日の中は部門コードの昇順の4行）").toEqual([
      csv行("2026/09/06", カード, 1000, 3000), csv行("2026/09/06", サプライ, 400, 500), csv行("2026/09/07", カード, 800, 900), csv行("2026/09/07", サプライ, 200, 300)]);
    expect.soft(csv.slice(1), "CSVのデータ行が手順3の日別の集計結果の行と同じ").toEqual(日別の行.map((r) => csv行(r.集計日, { 部門コード: r.部門コード, 部門名: r.部門 }, r.買取金額, r.販売金額)));
  });
  note(`${店舗の注記}。${部門の注記}。部門コードの昇順は、既存のカードとサプライの実際のコードの順が D01・D02 の順と同じになることを前提に確かめた`);
});
