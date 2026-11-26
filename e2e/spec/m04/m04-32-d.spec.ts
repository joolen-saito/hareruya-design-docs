/**
 * M04-32 在庫編集承認一覧: 承認状態「スマレジ連携失敗」の行を使うケース（121・128・145・146）。正本: cases/M04-32_test_cases.tsv
 *
 * これらのケースは、承認状態が「スマレジ連携失敗」の承認がある状態から始まる。この状態はスマレジの試験環境で連携を失敗させないと画面では作れないので、
 * 画面で「未承認の申請」まで作ったあと、ケースの事前準備として E2E が作った承認の行にだけ DB で承認状態を足す
 * （db/m04_32_d.ts・依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい。画面で作れない状態だけ」）。
 * 作った承認の行の承認状態は、足したあとに読み直して確かめ、注記に残す。
 */
import { expect, caseTest } from "../../lib/case";
import { test } from "@playwright/test";
import { loginAdmin } from "../../lib/session";
import { スマレジ連携失敗にする, 承認状態の数字 } from "../../db/m04_32_d";
import {
  checkRow, downloadModalCsv, LineItem, ListRow, listRows, modalButtons, modalLineItems, num, openBulk, openModalFromRow, searchApprovalList,
} from "../../pages/admin/m04_32_approval_list";
import { 試験支店の店名, Org32 } from "../../seeds/m04-32";
import { CB121, CB128, CBX145, CBX146, CODEA128, CODEB128 } from "../../seeds/m04-32-d";

test.use({ actionTimeout: 90_000, navigationTimeout: 180_000 });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const applicants = (org: Org32) => org.申請者.map((p) => p.名前);
const lineOf = (items: LineItem[], code: string) => items.filter((i) => (i["商品名/商品コード"] ?? "").endsWith(` / ${code}`));
const short = (rows: ListRow[]) => JSON.stringify(rows.map((r) => ({ 承認状態: r.承認状態, 承認対象: r.承認対象, チェック: r.チェックボックス, 増減: r.合計在庫増減数 })));
const FAILED = "スマレジ連携失敗";

/** 事前準備: E2E が作った未承認の申請を、承認状態「スマレジ連携失敗」にする（画面で作れない状態）。足したあと読み直して確かめる */
function 連携失敗にする(what: string, code: string, target: "在庫編集" | "在庫変更CSV登録"): void {
  スマレジ連携失敗にする(what, code, target);
  const s = 承認状態の数字(code, target);
  note(`補い（正本の外の準備）: 承認状態「${FAILED}」の承認は画面で作れないので、E2E が作った承認（${target}・商品コード ${code}）の承認状態を DB で「${FAILED}」にした。読み直した承認状態の数字: ${JSON.stringify(s)}`);
  expect(s.filter((x) => x === 4), `${what}: 承認状態が「${FAILED}」の承認が1種類ある`).toHaveLength(1);
}

function one(rows: ListRow[], target: string, what: string): ListRow {
  const hit = rows.filter((r) => r.承認対象 === target && r.承認状態 === FAILED);
  if (hit.length !== 1) throw new Error(`${what}: 承認対象「${target}」・承認状態「${FAILED}」の行が ${hit.length} 件（1件のはず）: ${short(rows)}`);
  return hit[0];
}

/** 検索入力（店舗・承認可能のみ表示を外す・登録者）。承認ステータスは選ばない */
async function searchAll(page: import("@playwright/test").Page, org: Org32): Promise<ListRow[]> {
  await searchApprovalList(page, { 店舗: 試験支店の店名(""), 承認可能のみ: false, 登録者: applicants(org) });
  const rows = await listRows(page);
  note(`在庫編集承認一覧(検索結果): ${short(rows)}`);
  return rows;
}

// ---- 121: 承認状態「スマレジ連携失敗」の在庫編集の行のチェックボックスとモーダルのボタン ----

caseTest("IT-M04-32-121", async ({ page, step, expected }) => {
  const c = CB121;
  連携失敗にする("S-M04-32-CBSTOCK-121", c.code, "在庫編集");
  let rows: ListRow[] = [];
  let row: ListRow | null = null;
  let buttons = { 承認する: false, 却下する: false };
  await step(1, () => loginAdmin(page, c.org.承認者.account));
  await step(2, async () => { rows = await searchAll(page, c.org); });
  await step(3, async () => { row = one(rows, "在庫編集", "手順3"); });
  await step(4, async () => {
    await openModalFromRow(page, row!);
    buttons = await modalButtons(page);
    note(`確認モーダルのボタン: ${JSON.stringify(buttons)}`);
  });
  await expected(async () => {
    expect.soft(row!.承認状態, "手順3の承認対象「在庫編集」の行の承認状態").toBe(FAILED);
    expect.soft(row!.チェックボックス, "手順3の行にチェックボックスが表示される").toBe(true);
    expect.soft(buttons.承認する, "確認モーダルに「承認する」ボタンが表示される").toBe(true);
    expect.soft(buttons.却下する, "確認モーダルに「却下する」ボタンは表示されない").toBe(false);
  });
});

// ---- 128: 在庫編集と在庫変更CSV登録を選んだ一括承認のモーダル（2件とも連携失敗） ----

caseTest("IT-M04-32-128", async ({ page, step, expected }) => {
  const c = CB128;
  連携失敗にする("S-M04-32-CBSTOCK-128（在庫編集）", CODEA128, "在庫編集");
  連携失敗にする("S-M04-32-CBSTOCK-128（在庫変更CSV登録）", CODEB128, "在庫変更CSV登録");
  let rows: ListRow[] = [];
  let items: LineItem[] = [];
  await step(1, () => loginAdmin(page, c.org.承認者.account));
  await step(2, async () => { rows = await searchAll(page, c.org); });
  await step(3, async () => {
    await checkRow(page, one(rows, "在庫編集", "手順3"), "手順3");
    await checkRow(page, one(rows, "在庫変更CSV登録", "手順3"), "手順3");
    await openBulk(page, "一括承認");
    items = await modalLineItems(page);
    note(`確認モーダルの明細: ${JSON.stringify(items)}`);
  });
  await expected(async () => {
    const a = lineOf(items, CODEA128);
    expect(a, `確認モーダルの一覧に商品コード「CBM0432-128-CODEA」の行が1行だけ表示される`).toHaveLength(1);
    expect.soft(num(a[0]["在庫増減数"]), "在庫増減数が3").toBe(3);
    expect.soft(num(a[0]["変更前在庫"]), "変更前在庫が10").toBe(10);
    expect.soft(num(a[0]["変更後在庫"]), "変更後在庫が13").toBe(13);
    expect.soft(lineOf(items, CODEB128), "商品コード「CBM0432-128-CODEB」の行は表示されない").toEqual([]);
  });
});

// ---- 145・146: スマレジ連携失敗の入庫の確認モーダルのCSVダウンロード ----

const want = { 変更前在庫: 10, 変更後在庫: 13, 変更前総原価: 1000, 変更後総原価: 1900 } as const;
function modalCsvCase(c: typeof CBX145, seed: string, target: "在庫編集" | "在庫変更CSV登録") {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    連携失敗にする(seed, c.code, target);
    let rows: ListRow[] = [];
    let line: Record<string, string>[] = [];
    await step(1, () => loginAdmin(page, c.org.承認者.account));
    await step(2, async () => { rows = await searchAll(page, c.org); });
    await step(3, async () => {
      await openModalFromRow(page, one(rows, target, "手順3"));
      note(`確認モーダルの明細: ${JSON.stringify(await modalLineItems(page))}`);
    });
    await step(4, async () => {
      const r = await downloadModalCsv(page);
      note(`ダウンロードしたCSV（${r.download.suggestedFilename()}）: 見出し ${JSON.stringify(r.header)}・行 ${JSON.stringify(r.rows)}`);
      line = r.rows.filter((x) => x["商品コード"] === c.code);
    });
    await expected(async () => {
      expect(line, `CSVに商品コード「${c.code}」の行が1行`).toHaveLength(1);
      for (const [k, v] of Object.entries(want)) expect.soft(num(line[0][k]), `${k}が${v}（出力「${line[0][k]}」）`).toBe(v);
    });
  };
}
caseTest("IT-M04-32-145", modalCsvCase(CBX145, "S-M04-32-CBCSVINUNAPP-145", "在庫変更CSV登録"));
caseTest("IT-M04-32-146", modalCsvCase(CBX146, "S-M04-32-CBINUNAPP-146", "在庫編集"));
