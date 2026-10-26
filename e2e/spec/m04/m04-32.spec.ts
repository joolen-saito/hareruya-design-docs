/**
 * M04-32 在庫編集承認一覧。正本: cases/M04-32_test_cases.tsv
 *
 * 画面だけで準備できるケース（使用シードに「DBへ直接設定」を含まないもの）のうち、次を実装した（記録 review/M04-32_progress_2026-10-22.md）。
 * 104〜106・108〜116・118・120・122・124〜127・130・131・133・134・136〜144
 * 実装しないもの:
 * - 103: 公開側のブラウザ環境 S-M04-32-QE-ENV（ユニサーチ試験環境へ接続できる）が要る（外部サービス。M04-02 の062〜068 と同じ扱い）。
 * - 121・128・135・145・146: 使用シードがDBへ直接設定する（スマレジ連携失敗の状態など）。
 *
 * 画面の作り（アプリのテンプレート Stock/approval_list.twig で確かめたこと）:
 * - 検索欄の「承認可能な在庫のみ表示」は初期でチェックが付いていて、その間は承認ステータスのチェック欄が選べない（設計書 L0048）。
 *   正本の手順が「承認可能な在庫のみ表示」に触れずに「承認ステータスの「未承認」にチェック」と書くもの（104〜106・108・109）は、
 *   チェック欄が選べないのでチェックを付けずに検索し、注記に残す（条件付き）。
 */
import { Page, test } from "@playwright/test";
import { MAIL_URL } from "../../config/env";
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { historiesOf, stockOf } from "../../db/m04_32_approval";
import { chooseHistoryShopAndZone, classStock, openClassListByName, searchStockByCode } from "../../pages/admin/m04_02_rc_stock";
import { HistoryRow, numberOf, StockHistoryPage } from "../../pages/admin/m04_17_stock_history";
import {
  ApprovalSearch, checkRow, closeModal, confirmApprove, confirmReject, downloadModalCsv, LineItem, ListRow, listRows, mailsTo,
  modalButtons, modalLineItems, modalLineText, num, openBulk, openModalFromRow, searchApprovalList,
} from "../../pages/admin/m04_32_approval_list";
import { CB, CBX, DP104, DP105, DP106, DP108, DP109, Org32, RC110, RC111, RC112, RC113, RC114, RC115, RC116 } from "../../seeds/m04-32";
import { StockListPage } from "../../pages/admin/stock_edit";

// 待ちの上限（誤ったセレクタや移らない画面でロックを長く持たないように。共通の設定は変えず、このファイルのテストだけに効かせる）
test.use({ actionTimeout: 90_000, navigationTimeout: 180_000 });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const short = (rows: ListRow[]) => JSON.stringify(rows.map((r) => ({
  承認状態: r.承認状態, 承認対象: r.承認対象, チェック: r.チェックボックス, 増減: r.合計在庫増減数, 総原価: r.合計総原価増減数, 区分: r.在庫変動区分, 登録者: r.登録者, 承認者: r.承認者,
})));

/** 正本の検索の手順。承認ステータスのチェック欄が選べなかったら注記に残す（補い） */
async function search(page: Page, v: ApprovalSearch): Promise<ListRow[]> {
  const r = await searchApprovalList(page, v);
  if (r.承認ステータス === "選べない") {
    note(`補い: 正本の「承認ステータスの「${(v.承認ステータス ?? []).join("・")}」にチェック」は、「承認可能な在庫のみ表示」のチェック（初期で付いている）が承認ステータスのチェック欄を選べなくしているので行えない（設計書 0202 在庫編集承認一覧(検索入力) L0048 のとおり）。チェックを付けずに検索した`);
  }
  const rows = await listRows(page);
  note(`在庫編集承認一覧(検索結果): ${short(rows)}`);
  return rows;
}

/**
 * 手順2が「承認ステータスの「未承認」にチェック」を書くときだけ、未承認のチェックを求める。
 * 依頼者の裁定（2026-10-22）で104〜106・108・109 の手順2はこの指定を外し「承認可能な在庫のみ表示のチェックは初期のまま」になる。
 * 正本の手順の文に合わせて動くようにした（文はコードに写さず、正本を引く）。
 */
const unapprovedIfAsked = (steps: string): string[] | undefined => (/承認ステータスの「未承認」にチェック/.test(steps) ? ["未承認"] : undefined);

/** 承認対象・承認状態が一致する行（1件であること） */
function one(rows: ListRow[], target: string, status: string | null, what: string, extra?: (r: ListRow) => boolean): ListRow {
  const hit = rows.filter((r) => r.承認対象 === target && (status === null || r.承認状態 === status) && (!extra || extra(r)));
  if (hit.length !== 1) throw new Error(`${what}: 承認対象「${target}」${status ? `・承認状態「${status}」` : ""}の行が ${hit.length} 件（1件のはず）: ${short(rows)}`);
  return hit[0];
}

const lineOf = (items: LineItem[], code: string) => items.filter((i) => (i["商品名/商品コード"] ?? "").endsWith(` / ${code}`));
const noteLines = (items: LineItem[]) => note(`確認モーダルの明細: ${JSON.stringify(items)}`);

/** 登録者は申請者全員の名前 */
const applicants = (org: Org32) => org.申請者.map((p) => p.名前);

// ---- 104・105: 2行を一括承認 ----

caseTest("IT-M04-32-104", async ({ page, step, expected, c }) => {
  const shop = "DP0432-104支店";
  let after: { CODE1: number; CODE2: number } = { CODE1: NaN, CODE2: NaN };
  await step(1, () => loginAdmin(page, DP104.承認者.account));
  let rows: ListRow[] = [];
  await step(2, async () => { rows = await search(page, { 店舗: shop, 承認ステータス: unapprovedIfAsked(c.手順), 登録者: applicants(DP104) }); });
  await step(3, async () => {
    const targets = rows.filter((r) => r.承認対象 === "在庫編集" && r.承認状態 === "未承認" && r.チェックボックス);
    expect(targets, "承認対象「在庫編集」の未承認の行（チェックボックスあり）は2行").toHaveLength(2);
    for (const r of targets) await checkRow(page, r, "手順3");
    await openBulk(page, "一括承認");
  });
  await step(4, async () => {
    const r = await confirmApprove(page);
    note(`承認の確認の文「${r.確認の文}」・承認のあとのメッセージ ${JSON.stringify(r.メッセージ)}`);
  });
  await step(5, async () => {
    after = { CODE1: stockOf("DP0432-104-CODE1", shop, 1).在庫, CODE2: stockOf("DP0432-104-CODE2", shop, 1).在庫 };
    note(`DBの在庫（${shop}・EC-CUBE）: ${JSON.stringify(after)}`);
  });
  await expected(async () => {
    expect.soft(after.CODE1, "商品DP0432-104-CODE1の在庫が13").toBe(13);
    expect.soft(after.CODE2, "商品DP0432-104-CODE2の在庫が13").toBe(13);
  });
});

caseTest("IT-M04-32-105", async ({ page, step, expected, c }) => {
  const shop = "DP0432-105支店";
  const addr = ["dp0432-105-ap1@example.test", "dp0432-105-ap2@example.test"];
  const got: Record<string, string[]> = {};
  await step(1, () => loginAdmin(page, DP105.承認者.account));
  let rows: ListRow[] = [];
  await step(2, async () => { rows = await search(page, { 店舗: shop, 承認ステータス: unapprovedIfAsked(c.手順), 登録者: applicants(DP105) }); });
  await step(3, async () => {
    const targets = rows.filter((r) => r.承認対象 === "在庫編集" && r.承認状態 === "未承認" && r.チェックボックス);
    expect(targets, "承認対象「在庫編集」の未承認の行（チェックボックスあり）は2行").toHaveLength(2);
    for (const r of targets) await checkRow(page, r, "手順3");
    await openBulk(page, "一括承認");
  });
  await step(4, async () => {
    const r = await confirmApprove(page);
    note(`承認の確認の文「${r.確認の文}」・承認のあとのメッセージ ${JSON.stringify(r.メッセージ)}`);
  });
  await step(5, async () => {
    // 送信が遅れることがあるので、60秒まで待つ（届いたものは数えるだけで、待つ間に条件を緩めない）
    for (let i = 0; i < 12; i++) {
      for (const a of addr) got[a] = (await mailsTo(MAIL_URL, a)).map((m) => m.subject);
      if (addr.every((a) => got[a].length >= 1)) break;
      await page.waitForTimeout(5000);
    }
    await page.waitForTimeout(5000);
    for (const a of addr) got[a] = (await mailsTo(MAIL_URL, a)).map((m) => m.subject);
    note(`試験用メール受信環境の受信メール（件名）: ${JSON.stringify(got)}`);
  });
  await expected(async () => {
    for (const a of addr) {
      expect.soft(got[a], `${a} 宛にステータス変更のメールが1通届く`).toEqual(["【在庫管理】承認ステータス変更通知メール"]);
    }
  });
});

// ---- 106: 廃棄の申請の確認モーダル ----

caseTest("IT-M04-32-106", async ({ page, step, expected, c }) => {
  const shop = "DP0432-106支店";
  let items: LineItem[] = [];
  await step(1, () => loginAdmin(page, DP106.承認者.account));
  let rows: ListRow[] = [];
  await step(2, async () => { rows = await search(page, { 店舗: shop, 承認ステータス: unapprovedIfAsked(c.手順), 登録者: applicants(DP106) }); });
  await step(3, async () => {
    await openModalFromRow(page, one(rows, "在庫編集", "未承認", "手順3"));
    items = await modalLineItems(page);
    noteLines(items);
  });
  await expected(async () => {
    expect(items, "確認モーダルの一覧は1行").toHaveLength(1);
    expect.soft(items[0]["商品名/商品コード"], "商品名「DP0432-106-NAME」・商品コード「DP0432-106-CODE」").toBe("DP0432-106-NAME / DP0432-106-CODE");
    expect.soft(num(items[0]["在庫増減数"]), "在庫増減数が-2").toBe(-2);
  });
});

// ---- 108・109: 端数の総原価 ----

caseTest("IT-M04-32-108", async ({ page, step, expected, c }) => {
  const shop = "DP0432-108支店";
  const code = DP108.code;
  let modal: number | null = null;
  let csv: number | null = null;
  let db: (number | null)[] = [];
  await step(1, () => loginAdmin(page, DP108.org.承認者.account));
  let rows: ListRow[] = [];
  await step(2, async () => { rows = await search(page, { 店舗: shop, 承認ステータス: unapprovedIfAsked(c.手順), 登録者: applicants(DP108.org) }); });
  await step(3, async () => {
    await openModalFromRow(page, one(rows, "在庫編集", "未承認", "手順3"));
    const items = await modalLineItems(page);
    noteLines(items);
    const line = lineOf(items, code);
    expect(line, `確認モーダルに商品コード ${code} の行が1行`).toHaveLength(1);
    modal = num(line[0]["総原価増減数"]);
  });
  await step(4, async () => {
    const r = await downloadModalCsv(page);
    note(`ダウンロードしたCSV（${r.download.suggestedFilename()}）: 見出し ${JSON.stringify(r.header)}・行 ${JSON.stringify(r.rows)}`);
    const line = r.rows.filter((x) => x["商品コード"] === code);
    expect(line, `CSVに商品コード ${code} の行が1行`).toHaveLength(1);
    csv = num(line[0]["総原価増減数"]);
  });
  await step(5, async () => {
    const h = historiesOf(code, shop, 1);
    note(`DBの在庫変動履歴: ${JSON.stringify(h)}`);
    db = h.filter((x) => x.在庫増減数 === -100).map((x) => x.総原価増減数);
  });
  await expected(async () => {
    expect.soft(modal, "確認モーダルの総原価増減数が-3333").toBe(-3333);
    expect.soft(csv, "CSVの総原価増減数が-3333").toBe(-3333);
    expect.soft(db, "廃棄の申請に紐づく在庫変動履歴の総原価増減数が-3333").toEqual([-3333]);
  });
});

caseTest("IT-M04-32-109", async ({ page, step, expected, c }) => {
  const shop = "DP0432-109支店";
  const code = DP109.code;
  let modal: number | null = null;
  let total = NaN;
  await step(1, () => loginAdmin(page, DP109.org.承認者.account));
  let rows: ListRow[] = [];
  await step(2, async () => { rows = await search(page, { 店舗: shop, 承認ステータス: unapprovedIfAsked(c.手順), 登録者: applicants(DP109.org) }); });
  let target: ListRow | null = null;
  await step(3, async () => {
    target = one(rows, "在庫編集", "未承認", "手順3");
    await openModalFromRow(page, target);
    const items = await modalLineItems(page);
    noteLines(items);
    const line = lineOf(items, code);
    expect(line, `確認モーダルに商品コード ${code} の行が1行`).toHaveLength(1);
    modal = num(line[0]["総原価増減数"]);
    await closeModal(page);
  });
  await step(4, async () => {
    await checkRow(page, target!, "手順4");
    await openBulk(page, "一括却下");
  });
  await step(5, async () => {
    const r = await confirmReject(page, "DP0432-109-却下");
    note(`却下の確認の文「${r.確認の文}」・却下のあとのメッセージ ${JSON.stringify(r.メッセージ)}`);
  });
  await step(6, async () => {
    total = stockOf(code, shop, 1).総原価;
    note(`DBの在庫の総原価（${shop}・EC-CUBE）: ${total}`);
  });
  await expected(async () => {
    expect.soft(modal, "確認モーダルの総原価増減数が-3333").toBe(-3333);
    expect.soft(total, "却下後の在庫の総原価が10000").toBe(10000);
  });
});

// ---- 110〜116: 承認・却下の結果がほかの画面に届く ----

/** 在庫履歴検索一覧で、検索条件をクリアしてから、キーワード・店舗・在庫区分 EC-CUBE で検索した一覧の行 */
async function searchHistory(page: Page, code: string, shop: string): Promise<HistoryRow[]> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(code);
  await chooseHistoryShopAndZone(page, { 店舗: shop, 在庫区分: "EC-CUBE" });
  expect(await h.submit(), "在庫履歴検索一覧の検索の応答").toBe(200);
  expect(await h.resultCount(), "検索が実行された（件数の表示が出ている）").not.toBeNull();
  const rows = await h.rows();
  note(`在庫履歴検索一覧: ${JSON.stringify(rows.map((r) => ({
    商品コード: r["商品コード"], 店舗: r["店舗"], 在庫場所: r["在庫場所"], 登録元: r["登録元"], 在庫変動数: r["在庫変動数"], 変更前在庫: r["変更前在庫"],
    変更後在庫: r["変更後在庫"], 仕入単価: r["仕入単価"], 変更前総原価: r["変更前総原価"], 変更後総原価: r["変更後総原価"], 在庫変動理由: r["在庫変動理由"],
    登録者: r["登録者"], 承認日: r["承認日"], 承認者: r["承認者"], 最終更新日: r["最終更新日"], 最終更新者: r["最終更新者"],
  })))}`);
  return rows;
}

const withQty = (rows: HistoryRow[], code: string, qty: number) => rows.filter((r) => r["商品コード"] === code && numberOf(r["在庫変動数"] ?? "") === qty);
/** 画面の日時の表示（YYYY/MM/DD HH:mm）を、手元の時刻で作る */
const ymdhm = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

caseTest("IT-M04-32-110", async ({ page, step, expected }) => {
  const r = RC110;
  const shop = "RC0432-001支店";
  let before: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  await step(1, () => loginAdmin(page, r.org.承認者.account));
  await step(2, async () => { before = await searchHistory(page, r.code, shop); });
  const t = await decide(page, shop, r.org, "一括承認", null, step, 3);
  await step(6, async () => { after = await searchHistory(page, r.code, shop); });
  await expected(async () => {
    expect.soft(withQty(before, r.code, 3), "手順2では在庫増減数3の行が表示されない").toEqual([]);
    const rows = withQty(after, r.code, 3);
    expect(rows, "手順6では在庫増減数3の行が1件表示される").toHaveLength(1);
    const h = rows[0];
    expect.soft(h["店舗"], "店舗").toBe(shop);
    expect.soft(h["在庫場所"], "在庫区分").toBe("EC-CUBE");
    expect.soft(h["登録元"], "登録元").toBe("在庫編集");
    expect.soft(h["在庫変動理由"], "在庫変動理由").toBe("RC0432-001-入庫");
    expect.soft(numberOf(h["変更前在庫"] ?? ""), "変更前在庫").toBe(10);
    expect.soft(numberOf(h["変更後在庫"] ?? ""), "変更後在庫").toBe(13);
    expect.soft(numberOf(h["仕入単価"] ?? ""), "仕入単価").toBe(300);
    expect.soft(numberOf(h["変更前総原価"] ?? ""), "変更前総原価").toBe(1000);
    expect.soft(numberOf(h["変更後総原価"] ?? ""), "変更後総原価").toBe(1900);
    expect.soft(h["登録者"], "登録者").toBe(r.org.申請者[0].名前);
    expect.soft(h["承認者"], "承認者").toBe(r.org.承認者.名前);
    expect.soft([ymdhm(t.t0), ymdhm(t.t1)], "承認日に承認を押した日時").toContain(h["承認日"]);
  });
});

/** 在庫検索一覧の行の在庫・原価単価・総原価 */
async function readStockRow(page: Page, code: string, shop: string): Promise<{ 在庫: number; 原価単価: number; 総原価: number }> {
  const list = await searchStockByCode(page, { 商品コード: code, 店舗: shop, 在庫区分: "EC-CUBE" });
  const row = list.row(code, shop, "EC-CUBE");
  await expect(row, "在庫検索一覧の対象の行は1件").toHaveCount(1);
  const n = async (l: ReturnType<Page["locator"]>) => Number((await l.innerText()).replace(/[,\s¥]/g, ""));
  const v = {
    在庫: await n(row.locator("td.col-stock > div").nth(0)),
    原価単価: await n(row.locator("td.col-price").nth(1).locator("> div").nth(1)),
    総原価: await n(row.locator("td.col-stock > div").nth(1)),
  };
  note(`在庫検索一覧の ${code}（${shop}・EC-CUBE）: ${JSON.stringify(v)}`);
  return v;
}

/** 手順3〜5: 検索（承認可能な在庫のみ表示は初期のまま）→行にチェック→一括承認/一括却下→確認 */
async function decide(page: Page, shop: string, org: Org32, which: "一括承認" | "一括却下", 理由: string | null,
  step: (n: number, body: () => Promise<void>) => Promise<void>, first: number): Promise<{ t0: Date; t1: Date }> {
  let rows: ListRow[] = [];
  const t = { t0: new Date(), t1: new Date() };
  await step(first, async () => { rows = await search(page, { 店舗: shop, 登録者: applicants(org) }); });
  await step(first + 1, async () => {
    await checkRow(page, one(rows, "在庫編集", "未承認", `手順${first + 1}`), `手順${first + 1}`);
    await openBulk(page, which);
  });
  await step(first + 2, async () => {
    t.t0 = new Date();
    const x = which === "一括承認" ? await confirmApprove(page) : await confirmReject(page, 理由 ?? "");
    t.t1 = new Date();
    note(`確認の文「${x.確認の文}」・あとのメッセージ ${JSON.stringify(x.メッセージ)}・押した時刻 ${ymdhm(t.t0)}〜${ymdhm(t.t1)}`);
  });
  return t;
}

caseTest("IT-M04-32-111", async ({ page, step, expected }) => {
  const r = RC111;
  const shop = "RC0432-002支店";
  let before = { 在庫: NaN, 原価単価: NaN, 総原価: NaN };
  let after = { 在庫: NaN, 原価単価: NaN, 総原価: NaN };
  await step(1, () => loginAdmin(page, r.org.承認者.account));
  await step(2, async () => { before = await readStockRow(page, r.code, shop); });
  await decide(page, shop, r.org, "一括承認", null, step, 3);
  await step(6, async () => { after = await readStockRow(page, r.code, shop); });
  await expected(async () => {
    expect.soft(before, "手順2（承認前）: 在庫10・原価単価100・総原価1000").toEqual({ 在庫: 10, 原価単価: 100, 総原価: 1000 });
    expect.soft(after, "手順6（承認後）: 在庫13・原価単価146・総原価1900").toEqual({ 在庫: 13, 原価単価: 146, 総原価: 1900 });
  });
});

caseTest("IT-M04-32-112", async ({ page, step, expected }) => {
  const r = RC112;
  const shop = "RC0432-003支店";
  let before = NaN;
  let after = NaN;
  await step(1, () => loginAdmin(page, r.org.承認者.account));
  await step(2, async () => { before = (await readStockRow(page, r.code, shop)).在庫; });
  await decide(page, shop, r.org, "一括却下", "RC0432-003-却下", step, 3);
  await step(6, async () => { after = (await readStockRow(page, r.code, shop)).在庫; });
  await expected(async () => {
    expect.soft(before, "手順2（却下前）の在庫が7").toBe(7);
    expect.soft(after, "手順6（却下後）の在庫が10").toBe(10);
  });
});

async function mainStoreCase(page: Page, r: typeof RC113, which: "一括承認" | "一括却下", 理由: string | null,
  step: (n: number, body: () => Promise<void>) => Promise<void>): Promise<{ before: number; after: number }> {
  const out = { before: NaN, after: NaN };
  let shop = "";
  await step(1, async () => {
    await loginAdmin(page, r.org.承認者.account);
    shop = await new StockListPage(page).shopNameById("1");
    note(`「本店」は店舗ID 1（親店舗）。手元の環境の店名は「${shop}」（在庫検索一覧の検索欄「店舗」の選択肢から読んだ）`);
  });
  await step(2, async () => {
    await openClassListByName(page, r.name);
    out.before = await classStock(page, r.code);
    note(`手順2の商品規格一覧の在庫数: ${out.before}`);
  });
  await decide(page, shop, r.org, which, 理由, step, 3);
  await step(6, async () => {
    await openClassListByName(page, r.name);
    out.after = await classStock(page, r.code);
    note(`手順6の商品規格一覧の在庫数: ${out.after}`);
  });
  return out;
}

caseTest("IT-M04-32-113", async ({ page, step, expected }) => {
  const v = await mainStoreCase(page, RC113, "一括承認", null, step);
  await expected(async () => {
    expect.soft(v.before, "手順2（承認前）の在庫数が10").toBe(10);
    expect.soft(v.after, "手順6（承認後）の在庫数が13").toBe(13);
  });
});

caseTest("IT-M04-32-115", async ({ page, step, expected }) => {
  const v = await mainStoreCase(page, RC115, "一括却下", "RC0432-006-却下", step);
  await expected(async () => {
    expect.soft(v.before, "手順2（却下前）の在庫数が7").toBe(7);
    expect.soft(v.after, "手順6（却下後）の在庫数が10").toBe(10);
  });
});

caseTest("IT-M04-32-114", async ({ page, step, expected }) => {
  const r = RC114;
  const shop = "RC0432-005支店";
  let before: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  await step(1, () => loginAdmin(page, r.org.承認者.account));
  await step(2, async () => { before = await searchHistory(page, r.code, shop); });
  const t = await decide(page, shop, r.org, "一括承認", null, step, 3);
  await step(6, async () => { after = await searchHistory(page, r.code, shop); });
  await expected(async () => {
    const b = withQty(before, r.code, -3);
    expect(b, "手順2: 在庫増減数-3の行が1件").toHaveLength(1);
    expect.soft(b[0]["承認日"], "手順2（承認前）の承認日が「-」").toBe("-");
    expect.soft(b[0]["承認者"], "手順2（承認前）の承認者が「承認待ち」").toBe("承認待ち");
    const a = withQty(after, r.code, -3);
    expect(a, "手順6: 在庫増減数-3の行が1件").toHaveLength(1);
    expect.soft(a[0]["承認者"], "手順6（承認後）の承認者").toBe(r.org.承認者.名前);
    expect.soft([ymdhm(t.t0), ymdhm(t.t1)], "手順6（承認後）の承認日が承認を押した日時（YYYY/MM/DD HH:mm）").toContain(a[0]["承認日"]);
  });
});

caseTest("IT-M04-32-116", async ({ page, step, expected }) => {
  const r = RC116;
  const shop = "RC0432-007支店";
  let before: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  let shownBefore = "";
  await step(1, () => loginAdmin(page, r.org.承認者.account));
  await step(2, async () => {
    before = await searchHistory(page, r.code, shop);
    const b = withQty(before, r.code, -3);
    expect(b, "手順2: 在庫増減数-3の行が1件").toHaveLength(1);
    shownBefore = b[0]["最終更新日"] ?? "";
    note(`手順2で控えた最終更新日「${shownBefore}」・最終更新者「${b[0]["最終更新者"]}」`);
  });
  await step(3, async () => {
    // 控えた表示の分が変わるまで待つ（1分以上）
    const start = Date.now();
    await page.waitForTimeout(61_000);
    while (ymdhm(new Date()) === shownBefore && Date.now() - start < 180_000) await page.waitForTimeout(5_000);
    note(`手順3: ${Math.round((Date.now() - start) / 1000)} 秒待った（いまの時刻 ${ymdhm(new Date())}）`);
  });
  const t = await decide(page, shop, r.org, "一括却下", "RC0432-007-却下", step, 4);
  await step(7, async () => { after = await searchHistory(page, r.code, shop); });
  await expected(async () => {
    const b = withQty(before, r.code, -3);
    expect.soft(b[0]["最終更新者"], "手順2（却下前）の最終更新者が申請者").toBe(r.org.申請者[0].名前);
    const a = withQty(after, r.code, -3);
    expect(a, "手順7: 在庫増減数-3の行が1件").toHaveLength(1);
    expect.soft(a[0]["最終更新者"], "手順7（却下後）の最終更新者が承認者").toBe(r.org.承認者.名前);
    expect.soft([ymdhm(t.t0), ymdhm(t.t1)], "手順7の最終更新日が却下を押した日時（YYYY/MM/DD HH:mm）").toContain(a[0]["最終更新日"]);
    expect.soft((a[0]["最終更新日"] ?? "") > shownBefore, `手順7の最終更新日（${a[0]["最終更新日"]}）が手順2で控えた表示（${shownBefore}）より後`).toBe(true);
  });
});

// ---- 118: 入庫の申請の却下は在庫履歴に出ない ----

caseTest("IT-M04-32-118", async ({ page, step, expected }) => {
  const c = CB["118"];
  let before: HistoryRow[] = [];
  let after: HistoryRow[] = [];
  await step(1, () => loginAdmin(page, c.org.承認者.account));
  await step(2, async () => {
    before = await searchHistory(page, c.code, c.shop);
    expect(before.filter((r) => r["商品コード"] === c.code).map((r) => numberOf(r["在庫変動数"] ?? "")), "手順2: 在庫増減数10の行だけ").toEqual([10]);
  });
  await decide(page, c.shop, c.org, "一括却下", "CBM0432-118-却下", step, 3);
  await step(6, async () => { after = await searchHistory(page, c.code, c.shop); });
  await expected(async () => {
    for (const [label, rows] of [["手順2（却下前）", before], ["手順6（却下後）", after]] as const) {
      const mine = rows.filter((r) => r["商品コード"] === c.code);
      expect.soft(withQty(rows, c.code, 3), `${label}: 在庫増減数3の行が表示されない`).toEqual([]);
      expect.soft(mine.map((r) => numberOf(r["在庫変動数"] ?? "")), `${label}: 在庫増減数10の行だけが表示される`).toEqual([10]);
      expect.soft(mine.map((r) => numberOf(r["変更後在庫"] ?? "")), `${label}: その行の変更後在庫が10`).toEqual([10]);
    }
  });
});

// ---- 120・122・124・125: チェックボックスと確認モーダルのボタン ----

caseTest("IT-M04-32-120", async ({ page, step, expected }) => {
  const c = CB["120"];
  let rows: ListRow[] = [];
  let row: ListRow | null = null;
  let buttons = { 承認する: false, 却下する: false };
  await step(1, () => loginAdmin(page, c.org.承認者.account));
  await step(2, async () => { rows = await search(page, { 店舗: c.shop, 登録者: applicants(c.org) }); });
  await step(3, async () => { row = one(rows, "在庫編集", null, "手順3"); });
  await step(4, async () => {
    await openModalFromRow(page, row!);
    buttons = await modalButtons(page);
    note(`確認モーダルのボタン: ${JSON.stringify(buttons)}`);
  });
  await expected(async () => {
    expect.soft(row!.チェックボックス, "手順3の行にチェックボックスが表示される").toBe(true);
    expect.soft(num(row!.合計在庫増減数), "合計在庫増減数が3").toBe(3);
    expect.soft(buttons, "確認モーダルに「承認する」と「却下する」の両方が表示される").toEqual({ 承認する: true, 却下する: true });
  });
});

caseTest("IT-M04-32-122", async ({ page, step, expected }) => {
  const c = CB["122"];
  let rows: ListRow[] = [];
  let row: ListRow | null = null;
  let buttons = { 承認する: true, 却下する: true };
  await step(1, () => loginAdmin(page, c.org.申請者[0].account));
  await step(2, async () => { rows = await search(page, { 店舗: c.shop, 承認可能のみ: false, 登録者: applicants(c.org) }); });
  await step(3, async () => {
    // 申請者自身の申請（入庫の申請 合計在庫増減数3）の行。シードで承認済みにした入庫10の行も同じ登録者で出る
    row = one(rows, "在庫編集", "未承認", "手順3");
  });
  await step(4, async () => {
    await openModalFromRow(page, row!);
    buttons = await modalButtons(page);
    note(`確認モーダルのボタン: ${JSON.stringify(buttons)}`);
  });
  await expected(async () => {
    expect.soft(row, "手順3の承認対象「在庫編集」の行が表示される").not.toBeNull();
    expect.soft(row!.チェックボックス, "チェックボックスが表示されない").toBe(false);
    expect.soft(buttons, "確認モーダルに「承認する」も「却下する」も表示されない").toEqual({ 承認する: false, 却下する: false });
  });
});

/** 承認済・却下済で絞った一覧の「在庫編集」の行のすべてで、チェックボックスが無く、モーダルにボタンが無いことを見る */
function decidedRowsCase(no: "124" | "125", status: "承認済" | "却下済") {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const c = CB[no];
    let rows: ListRow[] = [];
    let targets: ListRow[] = [];
    const buttons: { 承認する: boolean; 却下する: boolean }[] = [];
    await step(1, () => loginAdmin(page, c.org.承認者.account));
    await step(2, async () => { rows = await search(page, { 店舗: c.shop, 承認可能のみ: false, 承認ステータス: [status], 登録者: applicants(c.org) }); });
    await step(3, async () => {
      targets = rows.filter((r) => r.承認対象 === "在庫編集");
      expect(targets.length, "承認対象「在庫編集」の行がある").toBeGreaterThan(0);
      if (targets.length > 1) note(`承認対象「在庫編集」の行が ${targets.length} 行ある（シードの入庫10の承認済の行を含む）。どの行で見てもよいよう、すべての行で確かめた`);
    });
    await step(4, async () => {
      for (const t of targets) {
        await openModalFromRow(page, t);
        buttons.push(await modalButtons(page));
        await closeModal(page);
      }
      note(`確認モーダルのボタン（行ごと）: ${JSON.stringify(buttons)}`);
    });
    await expected(async () => {
      expect.soft(targets.map((t) => t.承認状態), `手順3の行の承認状態が「${status}」`).toEqual(targets.map(() => status));
      expect.soft(targets.map((t) => t.チェックボックス), "チェックボックスが表示されない").toEqual(targets.map(() => false));
      expect.soft(buttons, "確認モーダルに「承認する」も「却下する」も表示されない").toEqual(targets.map(() => ({ 承認する: false, 却下する: false })));
    });
  };
}
caseTest("IT-M04-32-124", decidedRowsCase("124", "承認済"));
caseTest("IT-M04-32-125", decidedRowsCase("125", "却下済"));

// ---- 126: 在庫移動の行 ----

caseTest("IT-M04-32-126", async ({ page, step, expected }) => {
  const c = CB["126"];
  let rows: ListRow[] = [];
  let moves: ListRow[] = [];
  await step(1, () => loginAdmin(page, c.org.承認者.account));
  await step(2, async () => { rows = await search(page, { 店舗: c.shop, 承認可能のみ: false, 登録者: applicants(c.org) }); });
  await step(3, async () => {
    moves = rows.filter((r) => r.承認対象.startsWith("在庫移動"));
    note(`承認対象が在庫移動の行: ${short(moves)}`);
  });
  await expected(async () => {
    expect(moves, "承認対象が在庫移動の行が1行").toHaveLength(1);
    expect.soft(moves[0].チェックボックス, "チェックボックスが表示されない").toBe(false);
    expect.soft(moves[0].合計在庫増減数, "合計在庫増減数が「-」").toBe("-");
    expect.soft(moves[0].在庫変動区分, "在庫変動区分が「-」").toBe("-");
  });
});

// ---- 127・130・131・133: 確認モーダルの明細の値 ----

type LineWant = Partial<Record<"在庫増減数" | "仕入単価" | "変更前在庫" | "変更後在庫" | "変更前総原価" | "変更後総原価", number | "-">>;
function expectLine(items: LineItem[], code: string, want: LineWant): void {
  const line = lineOf(items, code);
  expect(line, `確認モーダルの一覧に商品コード「${code}」の行が1行`).toHaveLength(1);
  for (const [k, v] of Object.entries(want)) {
    const shown = line[0][k];
    if (v === "-") expect.soft(shown, `${k}が「-」`).toBe("-");
    else expect.soft(num(shown), `${k}が${v}（表示「${shown}」）`).toBe(v);
  }
}

function modalValuesCase(no: string, search2: Partial<ApprovalSearch>, pick: (rows: ListRow[]) => ListRow, want: LineWant) {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const c = CB[no];
    let rows: ListRow[] = [];
    let items: LineItem[] = [];
    await step(1, () => loginAdmin(page, c.org.承認者.account));
    await step(2, async () => { rows = await search(page, { 店舗: c.shop, 登録者: applicants(c.org), ...search2 }); });
    await step(3, async () => {
      await openModalFromRow(page, pick(rows));
      items = await modalLineItems(page);
      noteLines(items);
    });
    await expected(async () => { expectLine(items, c.code, want); expect.soft(lineOf(items, c.code), "商品コードの行は1行").toHaveLength(1); });
  };
}

caseTest("IT-M04-32-127", modalValuesCase("127", {}, (rows) => one(rows, "在庫編集", "未承認", "手順3"),
  { 在庫増減数: 3, 仕入単価: 300, 変更前在庫: 10, 変更後在庫: 13, 変更前総原価: 1000, 変更後総原価: 1900 }));
caseTest("IT-M04-32-130", modalValuesCase("130", { 承認可能のみ: false, 承認ステータス: ["承認済"] }, (rows) => {
  note("補い: 承認済の承認対象「在庫編集」の行は、シードの入庫10と入庫3の2行がある。期待結果の明細（在庫増減数3）の行として、合計在庫増減数が3の行のリンクを押した");
  return one(rows, "在庫編集", "承認済", "手順3", (r) => num(r.合計在庫増減数) === 3);
}, { 在庫増減数: 3, 仕入単価: 300, 変更前在庫: 10, 変更後在庫: 13, 変更前総原価: 1000, 変更後総原価: 1900 }));
caseTest("IT-M04-32-131", modalValuesCase("131", { 承認可能のみ: false, 承認ステータス: ["却下済"] }, (rows) => one(rows, "在庫編集", "却下済", "手順3"),
  { 在庫増減数: 3, 仕入単価: 300, 変更前在庫: 10, 変更後在庫: "-", 変更前総原価: 1000, 変更後総原価: "-" }));
caseTest("IT-M04-32-133", modalValuesCase("133", {}, (rows) => one(rows, "在庫編集", "未承認", "手順3"),
  { 在庫増減数: -3, 仕入単価: "-", 変更前在庫: 10, 変更後在庫: 7 }));

// ---- 134: 在庫編集と在庫変更CSV登録を選んだ一括承認のモーダル ----

caseTest("IT-M04-32-134", async ({ page, step, expected }) => {
  const c = CB["134"];
  let rows: ListRow[] = [];
  let items: LineItem[] = [];
  await step(1, () => loginAdmin(page, c.org.承認者.account));
  await step(2, async () => { rows = await search(page, { 店舗: c.shop, 登録者: applicants(c.org) }); });
  await step(3, async () => {
    await checkRow(page, one(rows, "在庫編集", "未承認", "手順3"), "手順3");
    await checkRow(page, one(rows, "在庫変更CSV登録", "未承認", "手順3"), "手順3");
    await openBulk(page, "一括承認");
    items = await modalLineItems(page);
    noteLines(items);
  });
  await expected(async () => {
    expectLine(items, "CBM0432-134-CODEA", { 在庫増減数: 3, 変更前在庫: 10, 変更後在庫: 13 });
    expect.soft(lineOf(items, "CBM0432-134-CODEB"), "商品コード「CBM0432-134-CODEB」の行は表示されない").toEqual([]);
  });
});

// ---- 136・137: 在庫変更CSV登録の行のモーダルには明細を出さない ----

function csvTargetModalCase(no: "136" | "137", status: "承認済" | "却下済") {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const c = CBX[no];
    let rows: ListRow[] = [];
    let items: LineItem[] = [];
    let text = "";
    await step(1, () => loginAdmin(page, c.org.承認者.account));
    await step(2, async () => { rows = await search(page, { 店舗: c.shop, 登録者: applicants(c.org), 承認可能のみ: false, 承認ステータス: [status] }); });
    await step(3, async () => {
      await openModalFromRow(page, one(rows, "在庫変更CSV登録", status, "手順3"));
      items = await modalLineItems(page);
      text = await modalLineText(page);
      noteLines(items);
      note(`確認モーダルの明細の場所の文: ${text.slice(0, 300)}`);
    });
    await expected(async () => {
      expect.soft(lineOf(items, c.code), `確認モーダルの一覧に商品コード「${c.code}」の行が表示されない`).toEqual([]);
      expect.soft(text, `確認モーダルに商品コード「${c.code}」が出ていない`).not.toContain(c.code);
    });
  };
}
caseTest("IT-M04-32-136", csvTargetModalCase("136", "承認済"));
caseTest("IT-M04-32-137", csvTargetModalCase("137", "却下済"));

// ---- 138〜144: 確認モーダルのCSVダウンロード ----

type CsvWant = { 変更前在庫: number; 変更後在庫: number | "-"; 変更前総原価: number; 変更後総原価: number | "-" };
function modalCsvCase(no: string, search2: Partial<ApprovalSearch>, pick: (rows: ListRow[]) => ListRow, want: CsvWant) {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const c = CBX[no];
    let rows: ListRow[] = [];
    let line: Record<string, string>[] = [];
    await step(1, () => loginAdmin(page, c.org.承認者.account));
    await step(2, async () => { rows = await search(page, { 店舗: c.shop, 登録者: applicants(c.org), ...search2 }); });
    await step(3, async () => {
      await openModalFromRow(page, pick(rows));
      noteLines(await modalLineItems(page));
    });
    await step(4, async () => {
      const r = await downloadModalCsv(page);
      note(`ダウンロードしたCSV（${r.download.suggestedFilename()}）: 見出し ${JSON.stringify(r.header)}・行 ${JSON.stringify(r.rows)}`);
      line = r.rows.filter((x) => x["商品コード"] === c.code);
    });
    await expected(async () => {
      expect(line, `CSVに商品コード「${c.code}」の行が1行`).toHaveLength(1);
      for (const [k, v] of Object.entries(want)) {
        const shown = line[0][k];
        if (v === "-") expect.soft(shown, `${k}が「-」`).toBe("-");
        else expect.soft(num(shown), `${k}が${v}（出力「${shown}」）`).toBe(v);
      }
    });
  };
}
const unapproved = (target: string) => (rows: ListRow[]) => one(rows, target, "未承認", "手順3");

caseTest("IT-M04-32-138", modalCsvCase("138", {}, unapproved("在庫編集"), { 変更前在庫: 10, 変更後在庫: 13, 変更前総原価: 1000, 変更後総原価: 1900 }));
caseTest("IT-M04-32-139", modalCsvCase("139", { 承認可能のみ: false, 承認ステータス: ["承認済"] },
  (rows) => one(rows, "在庫編集", "承認済", "手順3", (r) => num(r.合計在庫増減数) === 3), { 変更前在庫: 10, 変更後在庫: 13, 変更前総原価: 1000, 変更後総原価: 1900 }));
caseTest("IT-M04-32-140", modalCsvCase("140", { 承認可能のみ: false, 承認ステータス: ["却下済"] },
  (rows) => one(rows, "在庫編集", "却下済", "手順3"), { 変更前在庫: 10, 変更後在庫: "-", 変更前総原価: 1000, 変更後総原価: "-" }));
caseTest("IT-M04-32-141", modalCsvCase("141", { 承認可能のみ: false, 承認ステータス: ["承認済"] },
  (rows) => one(rows, "在庫変更CSV登録", "承認済", "手順3"), { 変更前在庫: 10, 変更後在庫: 7, 変更前総原価: 1000, 変更後総原価: 700 }));
caseTest("IT-M04-32-142", modalCsvCase("142", {}, unapproved("在庫編集"), { 変更前在庫: 10, 変更後在庫: 7, 変更前総原価: 1000, 変更後総原価: 700 }));
caseTest("IT-M04-32-143", modalCsvCase("143", {}, unapproved("在庫変更CSV登録"), { 変更前在庫: 10, 変更後在庫: 13, 変更前総原価: 1000, 変更後総原価: 1900 }));
caseTest("IT-M04-32-144", modalCsvCase("144", { 承認可能のみ: false, 承認ステータス: ["却下済"] },
  (rows) => one(rows, "在庫変更CSV登録", "却下済", "手順3"), { 変更前在庫: 10, 変更後在庫: "-", 変更前総原価: 1000, 変更後総原価: "-" }));
