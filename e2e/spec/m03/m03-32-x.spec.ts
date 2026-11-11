/**
 * M03-32 高額商品価格変更CSV登録の続き（-x）。正本: cases/M03-32_test_cases.tsv
 * 実施不可の見直し（仕分け直し recheck2）で流せる見込みになったケース（記録 review/M03-32_progress_2026-11-11_dev.md）。
 * シード（seeds/m03-32-x.ts）は画面で商品・商品規格を作り、画面で作れない状態（販売価格・価格履歴の0件・更新日時）だけを E2E の行に DB で書き足す。
 * 商品コード・取込ファイル名には実行の印を付けている（取込履歴をファイル名で数えるため）。
 * 正本の「高額商品価格変更CSVアップロード画面」は、メニュー「商品管理」→「CSV管理」の画面（見出し「高額商品価格変更CSVアップロード」）。
 * 正本の「CSVファイルのアップロードボタン」「CSVファイルのアップロード」は、画面の「CSVファイルをアップロード」ボタン。
 */
import { Page, test } from "@playwright/test";
import { expect, CaseCtx, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import * as w30 from "../../db/m03_30_x";
import * as x from "../../db/m03_32_x";
import { 取込種別, 取込履歴の件数, 商品規格の状態 } from "../../db/m03_32_high_price";
import { HighPriceCsvUploadPage, pathOf, SubmitResult, uploadPath } from "../../pages/admin/m03_32_high_price_csv";
import { PriceHistoryPage } from "../../pages/admin/m03_23_price_history";
import { searchStockByCode } from "../../pages/admin/m04_02_rc_stock";
import { 在庫の行の価格 } from "../../pages/admin/m03_30_x";
import { M0332_ADMIN } from "../../seeds/m03-32";
import { RB_ADMIN, RB_ADMIN_NAME, RBの, 作ったものの, 本店の店名 } from "../../seeds/m03-32-x";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const list = (xs: string[]) => xs.join(" / ") || "なし";
const 高額 = 取込種別.高額商品価格変更;
/** セール中商品の販売価格を変更しなかった旨の警告＝設計書 M03-32-MSG-004（既存の 006 と同じ文） */
const セールの警告 = /\d+行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）/;

async function 開く(page: Page): Promise<HighPriceCsvUploadPage> {
  await loginAdmin(page, M0332_ADMIN);
  return new HighPriceCsvUploadPage(page, "高額商品価格変更");
}

/** 取込ファイルを選んで「CSVファイルをアップロード」を押す（送信が止まったら落とす）。画面上部のメッセージを注記に残す */
async function 取り込む(upload: HighPriceCsvUploadPage, ファイル: string, ファイル名: string, timeoutMs?: number): Promise<SubmitResult> {
  await upload.choose(ファイル);
  expect(await upload.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual([ファイル名]);
  const r = await upload.submit(timeoutMs);
  expect(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた（送られないと手順を実行できない）").toBe(true);
  const m = await upload.messages();
  note(`取込ファイル ${ファイル名}・取込の要求の応答 ${r.sent ? r.status : "送られない"}・移った画面 ${pathOf(upload.page.url())}・成功「${list(m.成功)}」・警告「${list(m.警告)}」・エラー「${list(m.エラー)}」`);
  return r;
}

type 価格 = { 基準価格: string; 販売価格: string };
const 価格 = (基準: number, 販売: number): 価格 => ({ 基準価格: String(基準), 販売価格: String(販売) });
function 値(商品規格ID: string): 価格 {
  const s = 商品規格の状態(商品規格ID);
  if (!s) throw new Error(`商品規格ID ${商品規格ID} が無い`);
  return { 基準価格: s.基準価格, 販売価格: s.販売価格 };
}

/** 取込の要求の結果として、高額商品価格変更CSVアップロード画面にいること */
async function 取込画面にいる(page: Page, upload: HighPriceCsvUploadPage, r: SubmitResult): Promise<void> {
  expect.soft(r.sent, "「CSVファイルをアップロード」で取込の要求が送られた").toBe(true);
  expect.soft(pathOf(page.url()), "送信のあとの画面").toBe(uploadPath("高額商品価格変更"));
  await expect.soft(upload.見出し, "送信のあとの画面の見出し").toHaveText(/^\s*高額商品価格変更CSVアップロード\s*$/);
}

// ---- 取り込んで、規格の価格を確かめる ----
function 価格を見る(seedId: string, 期待: { 呼び: string; 価格: 価格; 説明: string }[], timeoutMs?: number) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    if (timeoutMs) test.setTimeout(timeoutMs * 3);
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    const got: Record<string, 価格> = {};
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await 取り込む(upload, s.ファイル, s.ファイル名, timeoutMs); });
    await step(3, async () => {
      for (const e of 期待) got[e.呼び] = 値(s.規格[e.呼び].商品規格ID);
      note(`取込のあとの規格の価格（DBの参照）: ${JSON.stringify(Object.fromEntries(期待.map((e) => [s.規格[e.呼び].商品コード, got[e.呼び]])))}`);
    });
    await expected(async () => {
      for (const e of 期待) expect.soft(got[e.呼び], `${e.説明}（${s.規格[e.呼び].商品コード}）の基準価格・販売価格`).toEqual(e.価格);
    });
  };
}
caseTest("IT-M03-32-004", 価格を見る("S-M03-32-DATA-004", [{ 呼び: "004", 価格: 価格(1500, 1500), 説明: "セールフラグが無効の規格" }]));
caseTest("IT-M03-32-025", 価格を見る("S-M03-32-DATA-025", [{ 呼び: "025", 価格: 価格(1500, 1500), 説明: "改行数5009のファイルの規格" }], 300_000));
caseTest("IT-M03-32-028", 価格を見る("S-M03-32-DATA-028", [{ 呼び: "028", 価格: 価格(1500, 1500), 説明: "タブ区切りのファイルの規格" }]));
caseTest("IT-M03-32-029", 価格を見る("S-M03-32-DATA-029", [{ 呼び: "029", 価格: 価格(1500, 1500), 説明: "Shift_JIS のファイルの規格" }]));
caseTest("IT-M03-32-030", 価格を見る("S-M03-32-DATA-030", [{ 呼び: "030", 価格: 価格(1500, 1500), 説明: "書式なしテキストのファイルの規格" }]));
caseTest("IT-M03-32-031", 価格を見る("S-M03-32-DATA-031", [{ 呼び: "031", 価格: 価格(1500, 1500), 説明: "見えない文字を取り除いた商品コードの規格" }]));
caseTest("IT-M03-32-032", 価格を見る("S-M03-32-DATA-032", [{ 呼び: "032", 価格: 価格(0, 0), 説明: "下限値0の規格" }]));
caseTest("IT-M03-32-033", 価格を見る("S-M03-32-DATA-033", [{ 呼び: "033", 価格: { 基準価格: "99999999999", 販売価格: "99999999999" }, 説明: "最大桁数11桁の規格" }]));
caseTest("IT-M03-32-065", 価格を見る("S-M03-32-DPDATA-065", [
  { 呼び: "065A", 価格: 価格(1500, 1500), 説明: "1行目の規格" },
  { 呼び: "065B", 価格: 価格(2500, 2500), 説明: "2行目の規格" },
]));
caseTest("IT-M03-32-068", 価格を見る("S-M03-32-DPDATA-068", [
  { 呼び: "068S", 価格: 価格(1500, 800), 説明: "セール中の規格（販売価格は800のまま）" },
  { 呼び: "068N", 価格: 価格(2500, 2500), 説明: "同じファイルの通常商品の規格" },
]));

// ---- 送信のあとの画面（007・039・041・043） ----
caseTest("IT-M03-32-007", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-32-DATA-007");
  const upload = await 開く(page);
  let r!: SubmitResult;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { r = await 取り込む(upload, s.ファイル, s.ファイル名); });
  await expected(async () => {
    await 取込画面にいる(page, upload, r);
    const m = await upload.messages();
    expect.soft(m.成功.length, `画面上部の成功メッセージ（成功: ${list(m.成功)}）`).toBeGreaterThan(0);
  });
});
function エラーで戻る(seedId: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    let r!: SubmitResult;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { r = await 取り込む(upload, s.ファイル, s.ファイル名); });
    await expected(async () => {
      await 取込画面にいる(page, upload, r);
      const m = await upload.messages();
      expect.soft(m.エラー.length, `画面上部のエラー（エラー: ${list(m.エラー)}）`).toBeGreaterThan(0);
      expect.soft(m.成功, "完了のメッセージは出ない").toEqual([]);
    });
  };
}
caseTest("IT-M03-32-039", エラーで戻る("S-M03-32-DATA-039"));
caseTest("IT-M03-32-041", エラーで戻る("S-M03-32-DATA-041"));
caseTest("IT-M03-32-043", エラーで戻る("S-M03-32-DATA-043"));

// ---- 不備の行で取込全体が取り消される（022〜024・038・040・042・044・045） ----
function 取り消される(seedId: string, 期待: { 呼び: string; 価格: 価格; 説明: string }[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    const got: Record<string, 価格> = {};
    let n = -1;
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await 取り込む(upload, s.ファイル, s.ファイル名); });
    await step(3, async () => {
      for (const e of 期待) got[e.呼び] = 値(s.規格[e.呼び].商品規格ID);
      n = 取込履歴の件数(高額, s.ファイル名);
      note(`取込のあとの規格の価格（DBの参照）: ${JSON.stringify(Object.fromEntries(期待.map((e) => [s.規格[e.呼び].商品コード, got[e.呼び]])))}・取込履歴（種別 高額商品価格変更・ファイル名 ${s.ファイル名}）${n} 件`);
    });
    await expected(async () => {
      for (const e of 期待) expect.soft(got[e.呼び], `${e.説明}（${s.規格[e.呼び].商品コード}）の基準価格・販売価格（取込前のまま）`).toEqual(e.価格);
      expect.soft(n, `取込ファイル ${s.ファイル名} の取込履歴の件数（追加されない）`).toBe(0);
    });
  };
}
const 先行行 = (no: string) => ({ 呼び: no, 価格: 価格(2000, 1800), 説明: "不備の行より前の行の規格" });
caseTest("IT-M03-32-022", 取り消される("S-M03-32-DATA-022", [先行行("022A")]));
caseTest("IT-M03-32-023", 取り消される("S-M03-32-DATA-023", [先行行("023")]));
caseTest("IT-M03-32-024", 取り消される("S-M03-32-DATA-024", [先行行("024A")]));
caseTest("IT-M03-32-038", 取り消される("S-M03-32-DATA-038", [先行行("038A"), { 呼び: "038B", 価格: 価格(700, 700), 説明: "高額商品コード未設定の規格" }]));
caseTest("IT-M03-32-040", 取り消される("S-M03-32-DATA-040", [先行行("040")]));
caseTest("IT-M03-32-042", 取り消される("S-M03-32-DATA-042", [
  先行行("042A"), { 呼び: "042B", 価格: 価格(800, 800), 説明: "同じ商品コードの規格の1件目" }, { 呼び: "042C", 価格: 価格(800, 800), 説明: "同じ商品コードの規格の2件目" },
]));
caseTest("IT-M03-32-044", 取り消される("S-M03-32-DATA-044", [先行行("044A"), { 呼び: "044B", 価格: 価格(600, 600), 説明: "削除済み商品に属する規格" }]));
caseTest("IT-M03-32-045", 取り消される("S-M03-32-DATA-045", [先行行("045A"), { 呼び: "045B", 価格: 価格(650, 650), 説明: "削除済みの規格" }]));

caseTest("IT-M03-32-013", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-32-DATA-013");
  const upload = await 開く(page);
  let got!: 価格; let n = -1;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => {
    await upload.choose(s.ファイル);
    expect(await upload.chosenNames(), "取込ファイルの欄で選ばれているファイル").toEqual([s.ファイル名]);
  });
  await step(3, async () => {
    await upload.changeToken("invalid-token");
    expect(await upload.tokenValues(), "フォームの中のなりすまし対策トークン").toEqual(["invalid-token"]);
    note("開発者ツールの代わりに、画面の取込のフォームのなりすまし対策トークンをスクリプトで「invalid-token」に書き換えた");
  });
  await step(4, async () => {
    const r = await upload.submit();
    const m = await upload.messages();
    note(`送信の結果: ${r.sent ? `応答 ${r.status}・移った画面 ${pathOf(page.url())}` : "送られない"}・成功「${list(m.成功)}」・エラー「${list(m.エラー)}」`);
  });
  await step(5, async () => {
    got = 値(s.規格["013"].商品規格ID);
    n = 取込履歴の件数(高額, s.ファイル名);
    note(`規格の価格（DBの参照）: ${JSON.stringify(got)}・取込履歴（ファイル名 ${s.ファイル名}）${n} 件`);
  });
  await expected(async () => {
    expect.soft(got, "規格の基準価格・販売価格（1000と900のまま）").toEqual(価格(1000, 900));
    expect.soft(n, `取込ファイル ${s.ファイル名} の取込履歴の件数（追加されない）`).toBe(0);
  });
});

// ---- 取込履歴（008・067・073） ----
function 取込履歴を見る(seedId: string, 回数: 1 | 2, 件数: number) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    let n = -1;
    let k = 1;
    await step(k++, async () => { await upload.open(); });
    await step(k++, async () => { await 取り込む(upload, s.ファイル, s.ファイル名); });
    if (回数 === 2) await step(k++, async () => { await upload.ready(); await 取り込む(upload, s.ファイル, s.ファイル名); });
    await step(k++, async () => { n = 取込履歴の件数(高額, s.ファイル名); note(`取込履歴（種別 高額商品価格変更・ファイル名 ${s.ファイル名}）: ${n} 件`); });
    await expected(async () => {
      expect.soft(n, `種別が高額商品価格変更・ファイル名が ${s.ファイル名} の取込履歴の件数（${件数}件）`).toBe(件数);
    });
  };
}
caseTest("IT-M03-32-008", 取込履歴を見る("S-M03-32-DATA-008", 1, 1));
caseTest("IT-M03-32-067", 取込履歴を見る("S-M03-32-DPDATA-067", 1, 1));
caseTest("IT-M03-32-073", 取込履歴を見る("S-M03-32-DPDATA-073", 2, 2));

// ---- 価格履歴（009・010・066・069・070・071・072） ----
type 履歴の期待 = Partial<w30.価格履歴> | null;
function 履歴を見る(seedId: string, 期待: { 呼び: string; 履歴: 履歴の期待; 説明: string }[], 追加?: (s: ReturnType<typeof 作ったものの>) => void) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = 作ったものの(seedId);
    const upload = await 開く(page);
    const rows: Record<string, w30.価格履歴[]> = {};
    await step(1, async () => { await upload.open(); });
    await step(2, async () => { await 取り込む(upload, s.ファイル, s.ファイル名); });
    await step(3, async () => {
      for (const e of 期待) rows[e.呼び] = w30.価格履歴の行(s.規格[e.呼び].商品規格ID);
      note(`取込のあとの価格履歴（DBの参照）: ${JSON.stringify(Object.fromEntries(期待.map((e) => [s.規格[e.呼び].商品コード, rows[e.呼び]])))}`);
    });
    await expected(async () => {
      for (const e of 期待) {
        const r = rows[e.呼び];
        const code = s.規格[e.呼び].商品コード;
        if (e.履歴 === null) { expect.soft(r.length, `${e.説明}（${code}）の価格履歴の件数（追加されない）`).toBe(0); continue; }
        expect.soft(r.length, `${e.説明}（${code}）の価格履歴の件数（1件追加）`).toBe(1);
        const last = r[r.length - 1] ?? ({} as w30.価格履歴);
        const pick = Object.fromEntries(Object.keys(e.履歴).map((key) => [key, (last as Record<string, string>)[key]]));
        expect.soft(pick, `${e.説明}（${code}）の価格履歴の値`).toEqual(e.履歴);
      }
      追加?.(s);
    });
  };
}
const 両方 = (前: number, 後: number, 前販売 = 前): Partial<w30.価格履歴> => ({ 変更前基準価格: String(前), 基準価格: String(後), 変更前販売価格: String(前販売), 販売価格: String(後) });
caseTest("IT-M03-32-009", 履歴を見る("S-M03-32-DATA-009", [{ 呼び: "009", 履歴: 両方(1000, 1500, 900), 説明: "規格" }]));
caseTest("IT-M03-32-010", 履歴を見る("S-M03-32-DATA-010", [{ 呼び: "010", 履歴: null, 説明: "価格が変わらない規格" }]));
caseTest("IT-M03-32-066", 履歴を見る("S-M03-32-DPDATA-066", [
  { 呼び: "066A", 履歴: 両方(1000, 1500), 説明: "1行目の規格" },
  { 呼び: "066B", 履歴: 両方(2000, 2500), 説明: "2行目の規格" },
]));
caseTest("IT-M03-32-069", 履歴を見る("S-M03-32-DPDATA-069", [
  { 呼び: "069C", 履歴: 両方(1000, 1500), 説明: "価格が変わる規格" },
  { 呼び: "069U", 履歴: null, 説明: "価格が変わらない規格" },
]));
caseTest("IT-M03-32-070", 履歴を見る("S-M03-32-DPDATA-070", [{ 呼び: "070A", 履歴: { 変更前販売価格: "1000", 販売価格: "1500" }, 説明: "規格" }], (s) => {
  expect.soft(値(s.規格["070A"].商品規格ID).基準価格, "規格の基準価格（1500のまま変わらない）").toBe("1500");
}));
caseTest("IT-M03-32-071", 履歴を見る("S-M03-32-DPDATA-071", [{ 呼び: "071A", 履歴: { 変更前基準価格: "1000", 基準価格: "1500" }, 説明: "セール中の規格" }], (s) => {
  const r = w30.価格履歴の行(s.規格["071A"].商品規格ID);
  const last = r[r.length - 1];
  // 販売価格800の変更は記録されない（変更前・変更後の販売価格が空、または同じ値）
  const 記録された = !!last && last.変更前販売価格 !== "" && last.販売価格 !== "" && last.変更前販売価格 !== last.販売価格;
  expect.soft(記録された, `価格履歴に販売価格の変更が記録されていない（変更前販売価格「${last?.変更前販売価格 ?? ""}」・販売価格「${last?.販売価格 ?? ""}」）`).toBe(false);
}));

caseTest("IT-M03-32-072", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-32-DPDATA-072");
  const k = s.規格["072A"];
  const upload = await 開く(page);
  let r1: w30.価格履歴[] = []; let r2: w30.価格履歴[] = [];
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await 取り込む(upload, s.ファイル, s.ファイル名); });
  await step(3, async () => { r1 = w30.価格履歴の行(k.商品規格ID); note(`1回目の取込のあとの価格履歴: ${JSON.stringify(r1)}`); });
  await step(4, async () => { await upload.ready(); await 取り込む(upload, s.ファイル, s.ファイル名); });
  await step(5, async () => { r2 = w30.価格履歴の行(k.商品規格ID); note(`2回目の取込のあとの価格履歴: ${JSON.stringify(r2)}`); });
  await expected(async () => {
    expect.soft(r1.length, "1回目の取込のあとの価格履歴の件数").toBe(1);
    const a = r1[0];
    expect.soft(a ? { 変更前基準価格: a.変更前基準価格, 基準価格: a.基準価格, 変更前販売価格: a.変更前販売価格, 販売価格: a.販売価格 } : null,
      "1回目の取込のあとの価格履歴の値").toEqual(両方(1000, 1500));
    expect.soft(r2.length, "2回目の取込のあとの価格履歴の件数（1件のまま）").toBe(1);
  });
});

// ---- 画面上部の警告（075） ----
caseTest("IT-M03-32-075", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-32-DPDATA-075");
  const upload = await 開く(page);
  let r!: SubmitResult;
  let m!: Awaited<ReturnType<HighPriceCsvUploadPage["messages"]>>;
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { r = await 取り込む(upload, s.ファイル, s.ファイル名); });
  await step(3, async () => { m = await upload.messages(); note(`画面上部の表示: 成功「${list(m.成功)}」・警告「${list(m.警告)}」・エラー「${list(m.エラー)}」`); });
  await expected(async () => {
    await 取込画面にいる(page, upload, r);
    expect.soft(m.警告.some((t) => セールの警告.test(t)),
      `画面上部の警告「n行目: セール中商品のため、基準価格のみ更新しました。（販売価格は変更されません）」（警告: ${list(m.警告)}）`).toBe(true);
  });
});

// ---- 更新日時（011） ----
caseTest("IT-M03-32-011", async ({ page, step, expected }) => {
  const s = 作ったものの("S-M03-32-DATA-011");
  const k = s.規格["011"];
  const before = x.規格の更新日時(k.商品規格ID);
  note(`取込前の規格の更新日時（DBの参照・日本時間）: ${before}`);
  const upload = await 開く(page);
  let after = "";
  await step(1, async () => { await upload.open(); });
  await step(2, async () => { await 取り込む(upload, s.ファイル, s.ファイル名); });
  await step(3, async () => { after = x.規格の更新日時(k.商品規格ID); note(`取込のあとの規格の更新日時（DBの参照・日本時間）: ${after}`); });
  await expected(async () => {
    expect.soft(before, "取込前の更新日時（シードで 2026-09-01 00:00:00）").toBe("2026-09-01 00:00:00");
    expect.soft(after > before, `規格の更新日時が取込前（${before}）より後（${after}）`).toBe(true);
  });
});

// ---- 価格履歴の検索・在庫検索で見る（076〜079） ----
const 数字 = (v: string | undefined) => (v ?? "").replace(/[^\d-]/g, "");
function 履歴の画面で見る(seedId: string, 増える: 0 | 1, 行の期待?: Record<string, string>, 登録者?: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const s = RBの(seedId);
    await loginAdmin(page, RB_ADMIN);
    const hist = new PriceHistoryPage(page);
    const upload = new HighPriceCsvUploadPage(page, "高額商品価格変更");
    let 前 = -1;
    let 前の行: Awaited<ReturnType<PriceHistoryPage["rowValues"]>> = [];
    let rows: Awaited<ReturnType<PriceHistoryPage["rowValues"]>> = [];
    await step(1, async () => {
      await hist.open(); await hist.searchWord(s.商品コード);
      前の行 = await hist.rowValues(); 前 = 前の行.length;
      note(`検索の前の行の数: ${前}`);
    });
    await step(2, async () => { await upload.open(); });
    await step(3, async () => { await 取り込む(upload, s.ファイル, s.ファイル名); });
    await step(4, async () => {
      const m = await upload.messages();
      expect.soft(m.成功.length, `完了のメッセージが表示される（成功: ${list(m.成功)}）`).toBeGreaterThan(0);
    });
    await step(5, async () => { await hist.open(); await hist.searchWord(s.商品コード); rows = await hist.rowValues(); note(`検索のあとの行: ${JSON.stringify(rows)}`); });
    await expected(async () => {
      expect.soft(rows.length, `行の数（手順1で控えた ${前} 件${増える ? "より1件多い" : "のまま"}）`).toBe(前 + 増える);
      if (!行の期待) {
        expect.soft(rows.filter((r) => r.商品コード === s.商品コード).length, `商品コード ${s.商品コード} の履歴の行の数（増えない）`).toBe(前の行.filter((r) => r.商品コード === s.商品コード).length);
        return;
      }
      const keys = Object.keys(行の期待) as (keyof typeof rows[number])[];
      const 新しい行 = rows.filter((r) => r.商品コード === s.商品コード && keys.every((k) => 数字(r[k]) === 行の期待[k as string]));
      expect.soft(新しい行.length, `商品コード ${s.商品コード} で ${JSON.stringify(行の期待)} の行`).toBe(1);
      if (登録者) expect.soft(新しい行[0]?.登録者 ?? "", "その行の登録者").toBe(登録者);
    });
  };
}
caseTest("IT-M03-32-076", 履歴の画面で見る("S-M03-32-RB-DATA-076", 1, {
  変更前基準価格: "1000", 変更後基準価格: "1500", 変更前販売価格: "1000", 変更後販売価格: "1500", 変更前買取価格: "", 変更後買取価格: "",
}));
caseTest("IT-M03-32-078", 履歴の画面で見る("S-M03-32-CBHIST-078", 0));
caseTest("IT-M03-32-079", 履歴の画面で見る("S-M03-32-CBHIST-079", 1, {
  変更前基準価格: "1000", 変更後基準価格: "1500", 変更前販売価格: "", 変更後販売価格: "",
}, RB_ADMIN_NAME));

caseTest("IT-M03-32-077", async ({ page, step, expected }) => {
  const s = RBの("S-M03-32-RB-DATA-077");
  await loginAdmin(page, RB_ADMIN);
  const 店 = await 本店の店名(page);
  supplement(`正本の店舗「東京本店」は、開発環境の本店（店舗ID 1「${店}」）と読んだ`);
  const upload = new HighPriceCsvUploadPage(page, "高額商品価格変更");
  let 前!: { 基準価格: string; 販売価格: string; 買取価格: string }; let 後!: { 基準価格: string; 販売価格: string; 買取価格: string };
  const 行を読む = async () => {
    const listPage = await searchStockByCode(page, { 商品コード: s.商品コード, 店舗: 店, 在庫区分: "EC-CUBE" });
    const row = listPage.row(s.商品コード, 店, "EC-CUBE");
    await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
    const v = await 在庫の行の価格(row);
    return { 基準価格: 数字(v.基準価格), 販売価格: 数字(v.販売価格), 買取価格: 数字(v.買取価格) };
  };
  await step(1, async () => { 前 = await 行を読む(); note(`取込の前の行の価格: ${JSON.stringify(前)}`); });
  await step(2, async () => { await upload.open(); });
  await step(3, async () => { await 取り込む(upload, s.ファイル, s.ファイル名); });
  await step(4, async () => {
    const m = await upload.messages();
    expect.soft(m.成功.length, `完了のメッセージが表示される（成功: ${list(m.成功)}）`).toBeGreaterThan(0);
  });
  await step(5, async () => { 後 = await 行を読む(); note(`取込のあとの行の価格: ${JSON.stringify(後)}`); });
  await expected(async () => {
    expect.soft({ 基準価格: 前.基準価格, 販売価格: 前.販売価格 }, "手順1の表示（基準価格1000・販売価格1000）").toEqual(価格(1000, 1000));
    expect.soft(後, "取込のあとの表示（基準価格1500・販売価格1500・買取価格400のまま）").toEqual({ 基準価格: "1500", 販売価格: "1500", 買取価格: "400" });
  });
});
