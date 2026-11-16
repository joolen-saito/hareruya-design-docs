/**
 * M06-09 買取集計データCSV出力（検索結果・CSVの中身）。正本: cases/M06-09_test_cases.tsv
 * 買取集計データは DB で試験店舗に作る（seeds/m06-09-b.ts）。部門は既存の「カード」「サプライ」を使い、期待の D01・D02 は既存の部門コードとして確かめる。
 * 007（端数調整部門の設定と集計処理）は実装しない。
 */
import { Page, test } from "@playwright/test";
import fs from "node:fs";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { decodeCsvBytes, parseCsv } from "../../lib/csv";
import { CSVの内容を画面の枠に出す, CSVの枠のセル, CSVの枠のデータ行, CSVの枠の見出し, CSVの枠の題 } from "../../lib/evidence_other";
import { loginAdmin } from "../../lib/session";
import { 集計データを足す } from "../../db/m06_09_prep";
import { SummaryPage } from "../../pages/admin/m06_09_summary";
import { 既存の部門, M0609_ADMIN, M0609_ADMIN_014, M0609_ADMIN_015, 店名 } from "../../seeds/m06-09-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 部門の読み替え = "部門は既存の「カード」「サプライ」を使った。期待の部門コード D01・D02 は、その部門の実際のコードとして確かめた";
const ヘッダ = ["集計日", "部門コード", "部門", "買取金額", "販売金額"];

/** 検索条件を入れて検索する（部門・店舗は名前。null なら選ばない） */
async function 検索する(s: SummaryPage, 期間: [string, string], 店: string | null, 部門名: string | null): Promise<void> {
  await s.集計日を入れる(期間[0], 期間[1]);
  if (店) await s.買取店舗を選ぶ(店);
  if (部門名) await s.部門を選ぶ(部門名);
  await s.検索する();
}
/** CSVダウンロードを押し、ダウンロードされたファイル名と行（見出しを含む）を返す */
async function CSVをダウンロードする(page: Page, s: SummaryPage): Promise<{ ファイル名: string; 行: string[][]; 押した直後: Date }> {
  const dl = page.waitForEvent("download", { timeout: 60_000 });
  const 押した直後 = new Date();
  await s.CSVダウンロードのボタン().click({ timeout: 30_000 });
  const d = await dl;
  const 行 = parseCsv(decodeCsvBytes(fs.readFileSync(await d.path())));
  // 読んだCSV（ファイル名・見出し・全データ行）を画面の枠に書き出して残す。続く期待結果の確かめはこの枠の要素で行い、赤枠がCSVの値に付く
  await CSVの内容を画面の枠に出す(page, [{ 題: `ファイル名：${d.suggestedFilename()}`, 行 }]);
  return { ファイル名: d.suggestedFilename(), 行, 押した直後 };
}
/** CSVの枠の、データ行 i（0 から）の5項目を、期待の値と比べる */
async function 枠の行を確かめる(page: Page, i: number, 期待: string[], 説明: string): Promise<void> {
  for (const [k, h] of ヘッダ.entries()) await expect.soft(CSVの枠のセル(page, 0, i, h), `${説明}の「${h}」`).toHaveText(期待[k] ?? "");
}
/** CSVの枠の、見出し行とデータ行の全体（期待の行だけ）を比べる */
async function 枠のデータ行を確かめる(page: Page, 期待: string[][], 説明: string): Promise<void> {
  await expect.soft(CSVの枠のデータ行(page, 0), `${説明}（行数）`).toHaveCount(期待.length);
  for (const [i, e] of 期待.entries()) await 枠の行を確かめる(page, i, e, `${説明}（${i + 1}行目）`);
}
async function 枠の見出しを確かめる(page: Page): Promise<void> {
  for (const [k, h] of ヘッダ.entries()) await expect.soft(CSVの枠の見出し(page, 0, k), `CSVの1行目（ヘッダ行）の${k + 1}番目`).toHaveText(h);
}
const 日本時間の年月日時分秒 = (d: Date): string => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}`;
};
const 開く = async (page: CaseCtx["page"], account = M0609_ADMIN): Promise<SummaryPage> => { await loginAdmin(page, account); return new SummaryPage(page); };

caseTest("IT-M06-09-001", async ({ page, step, expected }) => {
  const s = await 開く(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名["001"], "カード"); });
  let 行数 = 0;
  await step(3, async () => { 行数 = await s.日別の表の行().count(); });
  await expected(async () => {
    expect.soft(行数, "日別の集計の件数（1件以上）").toBeGreaterThanOrEqual(1);
    await expect.soft(s.CSVダウンロードのボタン(), "CSVダウンロードボタンが表示される").toBeVisible();
  });
  note(部門の読み替え);
});

caseTest("IT-M06-09-003", async ({ page, step, expected }) => {
  const s = await 開く(page);
  const カード = 既存の部門("カード");
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-08-31", "2026-09-02"], null, null); });
  await step(3, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名["003A"], "カード"); });
  let csv = { ファイル名: "", 行: [] as string[][], 押した直後: new Date() };
  await step(4, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(5, async () => { csv = { ...csv, 行: csv.行 }; });
  await expected(async () => {
    await expect.soft(CSVの枠のデータ行(page, 0), "CSVのデータ行の数（直前の検索条件の1行だけ）").toHaveCount(1);
    await 枠のデータ行を確かめる(page, [["2026/09/01", カード.部門コード, カード.部門名, "3000", "7000"]], "CSVのデータ行（直前の検索条件の1行だけ）");
  });
  note(部門の読み替え);
});

caseTest("IT-M06-09-004", async ({ page, notes, step, expected }) => {
  const s = await 開く(page);
  const 店舗ID = notes.get("〔店舗ID-M0609-004〕");
  const カード = 既存の部門("カード");
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-02", "2026-09-02"], 店名["004"], "カード"); });
  await step(3, async () => { 集計データを足す(店舗ID, 店名["004"], { 日時: "2026-09-02", 部門ID: カード.部門ID, 買取金額: 200, 販売金額: 100 }); });
  let csv = { ファイル名: "", 行: [] as string[][], 押した直後: new Date() };
  await step(4, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(5, async () => { csv = { ...csv, 行: csv.行 }; });
  await expected(async () => {
    await expect.soft(CSVの枠のデータ行(page, 0), "CSVのデータ行の数（集計し直された1行）").toHaveCount(1);
    await 枠のデータ行を確かめる(page, [["2026/09/02", カード.部門コード, カード.部門名, "1000", "1000"]], "CSVのデータ行（検索後に足した行を含めて集計し直された）");
  });
  note(`${部門の読み替え}。手順3は、DBで試験店舗に買取集計データを1件足して行った（内部ID 60900422 は DB が振る番号）`);
});

caseTest("IT-M06-09-005", async ({ page, step, expected }) => {
  const s = await 開く(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名["005"], "カード"); });
  let csv = { ファイル名: "", 行: [] as string[][], 押した直後: new Date() };
  await step(3, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(4, async () => { csv = { ...csv, 行: csv.行 }; });
  await expected(async () => {
    await 枠の見出しを確かめる(page);
    await expect.soft(CSVの枠のデータ行(page, 0).first(), "2行目以降の集計結果の行（1行以上）").toBeVisible();
  });
  note(部門の読み替え);
});

caseTest("IT-M06-09-006", async ({ page, step, expected }) => {
  const s = await 開く(page);
  const カード = 既存の部門("カード");
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名["006"], "カード"); });
  let csv = { ファイル名: "", 行: [] as string[][], 押した直後: new Date() };
  await step(3, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(4, async () => { csv = { ...csv, 行: csv.行 }; });
  await expected(async () => {
    await 枠の行を確かめる(page, 0, ["2026/09/01", カード.部門コード, カード.部門名, "3000", "7000"], "CSVのデータ行（集計日・部門コード・部門・買取金額・販売金額）");
    await expect.soft(CSVの枠のセル(page, 0, 0, "買取金額"), "買取金額に桁区切りと通貨記号が付かない（数字だけ）").toHaveText(/^\d+$/);
    await expect.soft(CSVの枠のセル(page, 0, 0, "販売金額"), "販売金額に桁区切りと通貨記号が付かない（数字だけ）").toHaveText(/^\d+$/);
  });
  note(部門の読み替え);
});

caseTest("IT-M06-09-008", async ({ page, step, expected }) => {
  const s = await 開く(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-04", "2026-09-04"], 店名["008"], null); });
  let csv = { ファイル名: "", 行: [] as string[][], 押した直後: new Date() };
  await step(3, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(4, async () => { csv = { ...csv, 行: csv.行 }; });
  await expected(async () => {
    await expect.soft(CSVの枠のデータ行(page, 0), "CSVのデータ行の数（1行）").toHaveCount(1);
    await 枠のデータ行を確かめる(page, [["2026/09/04", "", "未設定", "1200", "3400"]], "CSVのデータ行（部門コードが空欄・部門が「未設定」）");
  });
});

caseTest("IT-M06-09-009", async ({ page, step, expected }) => {
  const s = await 開く(page);
  await step(1, async () => { await s.open(); });
  await step(2, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名["009"], "カード"); });
  const 記録: { 前?: Date; 後?: Date } = {};
  await step(3, async () => { 記録.前 = new Date(); });
  let csv = { ファイル名: "", 行: [] as string[][], 押した直後: new Date() };
  await step(4, async () => { csv = await CSVをダウンロードする(page, s); });
  await step(5, async () => { 記録.後 = new Date(); });
  await step(6, async () => { csv = { ...csv, 行: csv.行 }; });
  await expected(async () => {
    const m = /^otc_buy_order_summary_(\d{14})\.csv$/.exec(csv.ファイル名);
    await expect.soft(CSVの枠の題(page, 0), `ダウンロードされたCSVのファイル名（${csv.ファイル名}）が「otc_buy_order_summary_年月日時分秒.csv」の形`).toHaveText(/^ファイル名：otc_buy_order_summary_\d{14}\.csv（/);
    const 時刻 = m?.[1] ?? "";
    expect.soft(時刻 >= 日本時間の年月日時分秒(記録.前!), "ファイル名の出力日時が手順3の記録（日本時間）以後").toBe(true);
    expect.soft(時刻 <= 日本時間の年月日時分秒(記録.後!), "ファイル名の出力日時が手順5の記録（日本時間）以前").toBe(true);
  });
  note("CSVは添付ファイルとしてダウンロードされた（ダウンロードの開始で確かめた）。試験端末とアプリのサーバーの時計の同期（時刻差1秒未満）は確かめていない");
});

caseTest("IT-M06-09-011", async ({ page, browser, step, expected }) => {
  const s = await 開く(page);
  const ctxB = await browser.newContext({ ignoreHTTPSErrors: true });
  const pageB = await ctxB.newPage();
  const sB = new SummaryPage(pageB);
  let 送信先 = "";
  let ダウンロードされた = false;
  let 送信の応答 = 0;
  try {
    await step(1, async () => { await s.open(); });
    await step(2, async () => { await 検索する(s, ["2026-09-01", "2026-09-01"], 店名["011"], "カード"); });
    await step(3, async () => { 送信先 = await s.CSVダウンロードのボタン().evaluate((b) => new URL((b.closest("form") as HTMLFormElement).action, location.href).toString()); });
    await step(4, async () => { await loginAdmin(pageB, M0609_ADMIN); await sB.open(); });
    await step(5, async () => {
      const dl = pageB.waitForEvent("download", { timeout: 10_000 }).then(() => true, () => false);
      const 応答 = pageB.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === new URL(送信先).pathname, { timeout: 60_000 }).then((r) => r.status(), () => 0);
      await pageB.evaluate((url) => { const f = document.createElement("form"); f.method = "post"; f.action = url; document.body.appendChild(f); f.submit(); }, 送信先);
      送信の応答 = await 応答;
      await pageB.waitForLoadState("load");
      ダウンロードされた = await dl;
    });
    await expected(async () => {
      // 送信されずに同じ画面に留まっていただけのときに合格にしないため、手順3の送信先へのPOSTに応答が返ったことを確かめる
      expect.soft(送信の応答, `ブラウザBから手順3の送信先へPOSTが送られ、応答が返った（応答の状態: ${送信の応答}）`).toBeGreaterThan(0);
      expect.soft(送信の応答, "POSTの応答がシステムエラー（500番台）でない").toBeLessThan(500);
      expect.soft(ダウンロードされた, "CSVがダウンロードされる（されない）").toBe(false);
      expect.soft(new URL(pageB.url()).pathname, "表示された画面（買取集計データ画面）").toMatch(/\/otcbuyorder\/summary$/);
      await expect.soft(pageB.locator('input[name="admin_otc_buy_order_summary[summary_date_from]"]'), "買取集計データ画面の集計日の入力欄が表示される").toBeVisible();
    });
    note(`ブラウザBは、別のコンテキスト（サイトデータが独立）で同じ管理者としてログインした。手順3の送信先（${送信先}）へ POST のフォームを作って送信した`);
  } finally {
    await ctxB.close();
  }
});

/** 014・015: 部門を選ばず検索して CSV の行を確かめる */
function 複数行のCSV(n: "014" | "015", account: typeof M0609_ADMIN_014, 期間: [string, string], 期待: (c: { カード: ReturnType<typeof 既存の部門>; サプライ: ReturnType<typeof 既存の部門> }) => string[][]) {
  return async ({ page, step, expected }: CaseCtx) => {
    const s = await 開く(page, account);
    await step(1, async () => { await s.open(); });
    await step(2, async () => { await 検索する(s, 期間, 店名[n], null); });
    let csv = { ファイル名: "", 行: [] as string[][], 押した直後: new Date() };
    await step(3, async () => { csv = await CSVをダウンロードする(page, s); });
    await step(4, async () => { csv = { ...csv, 行: csv.行 }; });
    await expected(async () => {
      await 枠の見出しを確かめる(page);
      await expect.soft(CSVの枠のデータ行(page, 0), "ヘッダ行の次のデータ行の数（期待の行だけ）").toHaveCount(期待({ カード: 既存の部門("カード"), サプライ: 既存の部門("サプライ") }).length);
      await 枠のデータ行を確かめる(page, 期待({ カード: 既存の部門("カード"), サプライ: 既存の部門("サプライ") }), "ヘッダ行の次のデータ行（期待の行だけ）");
    });
    note(`${部門の読み替え}。管理者は試験用（ログインID ${account.loginId}。権限はシステム管理者）`);
  };
}
caseTest("IT-M06-09-014", 複数行のCSV("014", M0609_ADMIN_014, ["2026-09-06", "2026-09-07"], (c) => [
  ["2026/09/06", c.カード.部門コード, c.カード.部門名, "1000", "3000"], ["2026/09/06", c.サプライ.部門コード, c.サプライ.部門名, "400", "500"],
  ["2026/09/07", c.カード.部門コード, c.カード.部門名, "800", "900"], ["2026/09/07", c.サプライ.部門コード, c.サプライ.部門名, "200", "300"]]));
caseTest("IT-M06-09-015", 複数行のCSV("015", M0609_ADMIN_015, ["2026-09-08", "2026-09-08"], (c) => [
  ["2026/09/08", c.カード.部門コード, c.カード.部門名, "1000", "3000"], ["2026/09/08", "", "未設定", "1200", "3400"]]));
