/** M05-11 受注情報編集（価格差異・キャンセルのポイント・店頭販売用整理番号・連携の確認）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { 受注のポイント } from "../../db/m05_11_n";
import { StockHistoryPage, HistoryRow, numberOf } from "../../pages/admin/m04_17_stock_history";
import { chooseHistoryShopAndZone } from "../../pages/admin/m04_02_rc_stock";
import { OrderEditPage, OrderItemsEdit, 明細行 } from "../../pages/admin/m05_11_order_edit";
import { 会員検索から会員編集を開く, 会員の累計, ポイント確認を開く, ポイント履歴の増減量, 整理番号の表示 } from "../../pages/admin/m05_11_n";
import "../../seeds/m05-11-n";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";
import { M0511_RE_ADMIN } from "../../seeds/m05-11-n";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const 注記 = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
const onDialog = (m: string) => 注記(`ダイアログを受け入れた: ${m}`);
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

// ---- 010: 価格差異のある商品欄 ----
caseTest("IT-M05-11-010", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const chg = rc("価格変更商品"), keep = rc("価格維持商品");
  const messages: string[] = [];
  await step(1, async () => { await 開く(browser, page, notes.get(key("共有PRICE"))); });
  await step(2, async () => {
    // 価格差異の商品は、数量を増やして「受注情報を登録」を押したときの確認ダイアログに出る作り（画面に常設の欄は無い）。確認だけして登録はしない
    注記("価格差異のある商品は、数量を増やして「受注情報を登録」を押すと出る確認ダイアログに表示される作り。2商品の数量を2にして押し、確認の文を読んで取り消した（登録はしない）。正本の外の補い");
    const items = new OrderItemsEdit(page);
    await items.明細に入れる(rc("PRICE-CHG"), { 数量: "2" });
    await items.明細に入れる(rc("PRICE-KEEP"), { 数量: "2" });
    page.on("dialog", (d) => { messages.push(d.message()); void d.dismiss(); });
    await page.locator('button[type="submit"][name="mode"][value="register"]').filter({ hasText: /^\s*受注情報を登録\s*$/ }).first().click({ timeout: 20_000 });
    await expect.poll(() => messages.length, { timeout: 20_000, message: "確認ダイアログが出る" }).toBeGreaterThan(0);
  });
  await expected(async () => {
    const all = messages.join("\n");
    expect.soft(all.includes(chg), `価格差異の確認に商品名「${chg}」が出る（確認の文: ${all.replace(/\n/g, " / ")}）`).toBe(true);
    expect.soft(all.includes(keep), `価格差異の確認に商品名「${keep}」が出ない`).toBe(false);
  });
});

// ---- 023: キャンセルで使用ポイント・付与ポイントが戻る ----
caseTest("IT-M05-11-023", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("023"));
  let 前 = { 使用: -1, 付与: -1, 会員の保持: -1 }, 後 = { 使用: -1, 付与: -1, 会員の保持: -1 };
  let p!: OrderEditPage;
  await step(1, async () => { p = await 開く(browser, page, no); 前 = 受注のポイント(no); });
  await step(2, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { 後 = 受注のポイント(no); });
  await expected(async () => {
    注記(`期待は「キャンセル前の状態へ戻る」。設計書は「在庫・使用ポイント・付与ポイントを戻す」で、受注の使用ポイント・付与ポイントが取り消されて0になることと読んだ（解釈）。操作前は使用${前.使用}・付与${前.付与}・会員の保持ポイント${前.会員の保持}`);
    expect.soft(後.使用, "キャンセル後の受注の使用ポイント（戻って0）").toBe(0);
    expect.soft(後.付与, "キャンセル後の受注の付与ポイント（戻って0）").toBe(0);
  });
});

// ---- 104・141: 店頭販売用整理番号 ----
caseTest("IT-M05-11-104", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let 表示: { 文字: string; リンク: boolean } | null = null;
  await step(1, async () => { await 開く(browser, page, notes.get(key("104"))); });
  await step(2, async () => { 表示 = await 整理番号の表示(page); });
  await expected(async () => {
    expect.soft(表示?.文字 ?? "（表示なし）", "店頭販売用整理番号の表示").toBe(notes.get("〔店頭販売用整理番号-M0511-104〕"));
    expect.soft(表示?.リンク ?? false, "店頭販売用整理番号がリンクとして表示される").toBe(true);
  });
});
caseTest("IT-M05-11-141", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage, h!: OrderEditPage;
  let 表示: { 文字: string; リンク: boolean } | null = null;
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("141"))); });
  await step(2, async () => { h = await p.履歴を開く(0); });
  await step(3, async () => { await h.status.waitFor({ state: "attached", timeout: 30_000 }); 表示 = await 整理番号の表示(h.page); });
  await expected(async () => {
    expect.soft(表示?.文字 ?? "（表示なし）", "履歴画面の店頭販売用整理番号の表示").toBe(notes.get("〔店頭販売用整理番号-M0511-141〕"));
    expect.soft(表示?.リンク ?? false, "履歴画面の店頭販売用整理番号がリンクとして表示される").toBe(true);
  });
});

// ---- 222〜224: 連携 ----
const 列 = (r: HistoryRow, ...names: string[]): string => { const k = Object.keys(r).find((h) => names.some((n) => h === n)) ?? Object.keys(r).find((h) => names.some((n) => h.includes(n))); return k ? r[k] : ""; };
async function 在庫履歴を検索する(page: Page, browser: Browser, code: string): Promise<HistoryRow[]> {
  const h = new StockHistoryPage(page);
  await h.open();
  await h.clearConditions();
  await h.fillKeyword(code);
  await chooseHistoryShopAndZone(page, { 店舗: await 店舗Aの店名(browser), 在庫区分: "EC-CUBE" });
  expect(await h.submit(), "在庫履歴検索一覧の応答").toBe(200);
  return h.rows();
}
async function 注文を開く(page: Page, browser: Browser, no: string): Promise<OrderEditPage> {
  return 開く(browser, page, no);
}

caseTest("IT-M05-11-222", async ({ page, browser, notes, step, expected }) => {
  const no = notes.get("〔注文番号-M0511-RE001〕"), code = rc("RE0511-001-A");
  let 前: HistoryRow[] = [], 後: HistoryRow[] = [];
  let p!: OrderEditPage;
  await step(1, async () => { await loginAdmin(page, M0511_RE_ADMIN); });
  await step(2, async () => { 前 = await 在庫履歴を検索する(page, browser, code); });
  await step(3, async () => { 注記(`手順3の一覧の行: ${JSON.stringify(前.map((r) => ({ 登録元: 列(r, "登録元"), 登録元ID: 列(r, "登録元ID"), 変動: 列(r, "在庫変動数") })))}`); });
  await step(4, async () => { p = await 注文を開く(page, browser, no); });
  await step(5, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(6, async () => { await p.ステータスを変更する(onDialog); });
  await step(7, async () => { 後 = await 在庫履歴を検索する(page, browser, code); });
  await expected(async () => {
    expect.soft(前.filter((r) => 列(r, "在庫変動理由").includes("キャンセル時の在庫戻し")).length, `手順3の一覧の、注文番号${no}のキャンセルによる行の数`).toBe(0);
    const rows = 後.filter((r) => 列(r, "在庫変動理由").includes("キャンセル時の在庫戻し"));
    expect.soft(rows.length, "手順7の一覧の、キャンセルによる行の数").toBe(1);
    const r = rows[0] ?? {};
    expect.soft(列(r, "登録元"), "登録元").toBe("受注");
    expect.soft(列(r, "登録元ID"), "登録元ID").toBe(no);
    expect.soft(numberOf(列(r, "変更前在庫")), "変更前在庫").toBe(7);
    expect.soft(numberOf(列(r, "変更後在庫")), "変更後在庫").toBe(10);
    expect.soft(numberOf(列(r, "在庫増減数", "在庫変動数")), "在庫増減数").toBe(3);
    expect.soft(列(r, "在庫変動理由"), "在庫変動理由").toBe(`キャンセル時の在庫戻し 注文番号：${no}`);
  });
});

caseTest("IT-M05-11-223", async ({ page, browser, notes, step, expected }) => {
  const no = notes.get("〔注文番号-M0511-RE002〕"), cid = notes.get("〔会員ID-M0511-RE002〕");
  let 前: string[] = [], 後: string[] = [];
  let p!: OrderEditPage;
  const ポイント履歴を見る = async (): Promise<string[]> => { await 会員検索から会員編集を開く(page, cid); await ポイント確認を開く(page); return ポイント履歴の増減量(page, no); };
  await step(1, async () => { await loginAdmin(page, M0511_RE_ADMIN); });
  await step(2, async () => { await 会員検索から会員編集を開く(page, cid); });
  await step(3, async () => { await ポイント確認を開く(page); 前 = await ポイント履歴の増減量(page, no); });
  await step(4, async () => { p = await 注文を開く(page, browser, no); });
  await step(5, async () => { await p.ステータスを選ぶ("キャンセル"); });
  await step(6, async () => { await p.ステータスを変更する(onDialog); });
  await step(7, async () => { 注記("スマレジ連携の成功応答は試験環境の起動時の設定で、この環境の既定のまま（画面から設定しない）"); 後 = await ポイント履歴を見る(); });
  await expected(async () => {
    expect.soft(前.map((v) => numberOf(v)), `手順3のポイント履歴の注文番号${no}の増減量`).toEqual([50]);
    expect.soft(後, `手順7のポイント履歴の注文番号${no}の行`).toEqual([]);
  });
});

caseTest("IT-M05-11-224", async ({ page, browser, notes, step, expected }) => {
  const no = notes.get("〔注文番号-M0511-RE003〕"), cid = notes.get("〔会員ID-M0511-RE003〕"), 控え = Number(notes.get("〔累計注文金額-M0511-RE003〕"));
  let 前 = -1, 後 = -1;
  let p!: OrderEditPage;
  await step(1, async () => { await loginAdmin(page, M0511_RE_ADMIN); });
  await step(2, async () => { await 会員検索から会員編集を開く(page, cid); 前 = (await 会員の累計(page, cid)).金額; });
  await step(3, async () => { p = await 注文を開く(page, browser, no); });
  await step(4, async () => { await new OrderItemsEdit(page).明細に入れる(rc("RE0511-003-A"), { 数量: "3" }); });
  await step(5, async () => { const w = await p.受注情報を登録する(onDialog); 注記(`保存の応答の文: ${w.join(" / ")}`); });
  await step(6, async () => { await 会員検索から会員編集を開く(page, cid); 後 = (await 会員の累計(page, cid)).金額; });
  await expected(async () => {
    expect.soft(前, "手順2の累計注文金額が、シード作成の最後に控えた値と一致する").toBe(控え);
    expect.soft(後, `手順6の累計注文金額（手順2は${前}）`).toBeGreaterThan(控え);
  });
});
void 明細行;
