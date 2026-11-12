/** M05-11 受注情報編集の続き（お支払方法・履歴画面・スマレジ受注の金額欄・在庫0の警告・ステータス・QF）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { 受注の日付 } from "../../db/m05_11_write";
import { 受注の支払方法 } from "../../db/m05_11_q";
import { OrderEditPage } from "../../pages/admin/m05_11_order_edit";
import { OrderEditQ } from "../../pages/admin/m05_11_q";
import { HistoryDetailPage, 数字 } from "../../pages/front/f06_07_history";
import { 購入履歴の出荷日Page } from "../../pages/front/m05_26_history";
import "../../seeds/m05-11-n-k";
import "../../seeds/m05-11-o";
import "../../seeds/m05-11-q";
import { QF会員, QF管理者 } from "../../seeds/m05-11-q";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const key = (n: string) => `〔受注番号-M0511-${n}〕`;
const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
const onDialog = (m: string) => note(`ダイアログを受け入れた: ${m}`);
const 履歴リンクの注記 = () => note("受注データ更新履歴のリンクの文言は「画面操作変更」。これを正本の「変更」として押した（別タブで履歴画面が開く）");
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

// ---- お支払方法 ----
caseTest("IT-M05-11-075", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  note("受注ステータス・購入時の支払方法の準備は、シードで「クレジットカード」へ変更済み（銀行振込で購入したあと、受注情報編集で変更）");
  const no = notes.get(key("075"));
  let q!: OrderEditQ;
  let 前 = "", 後 = "";
  await step(1, async () => { await 開く(browser, page, no); q = new OrderEditQ(page); });
  await step(2, async () => { await new OrderEditPage(page).お支払情報を開く(); 前 = await q.選択中のお支払方法(); });
  await step(3, async () => { await q.お支払方法を選ぶ("銀行振込"); });
  await step(4, async () => { await new OrderEditPage(page).受注情報を登録する(onDialog); });
  await step(5, async () => { 後 = 受注の支払方法(no); });
  await expected(async () => {
    expect.soft(前, "変更前のお支払方法（シードで変更したクレジットカード）").toBe("クレジットカード");
    expect.soft(後, "受注の支払方法").toBe("銀行振込");
  });
});

// ---- 履歴画面 ----
caseTest("IT-M05-11-137", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let p!: OrderEditPage, h!: OrderEditPage;
  let 支払 = "";
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("137"))); });
  await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); });
  await step(3, async () => {
    await h.status.waitFor({ state: "attached", timeout: 30_000 });
    await h.お支払情報を開く();
    支払 = await new OrderEditQ(h.page).選択中のお支払方法();
  });
  await expected(async () => { expect.soft(支払, "履歴画面のお支払情報のお支払方法").toBe("銀行振込"); });
});

caseTest("IT-M05-11-143", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  note("ポイント連携エラーは、通常の受注情報編集でも入力できない欄（常に非活性）。履歴画面でも操作・入力ができないことを確かめた");
  let p!: OrderEditPage, h!: OrderEditPage, q!: OrderEditQ;
  let ス = { 活性: true, 入力できた: true };
  const 文: Record<string, { 活性: boolean; 入力できた: boolean }> = {};
  await step(1, async () => { p = await 開く(browser, page, notes.get(key("143"))); });
  await step(2, async () => { 履歴リンクの注記(); h = await p.履歴を開く(0); q = new OrderEditQ(h.page); await h.status.waitFor({ state: "attached", timeout: 30_000 }); });
  await step(3, async () => { ス = await q.操作できるか(q.履歴の欄("変更後のステータス"), "変更後のステータス"); });
  await step(4, async () => {
    await q.欄が開いている();
    for (const k of ["スマレジメモ", "ショップ用メモ欄", "ポイント連携エラー"] as const) 文[k] = await q.操作できるか(q.履歴の欄(k), k);
  });
  await expected(async () => {
    expect.soft(ス, "変更後のステータス（非活性・選べない）").toEqual({ 活性: false, 入力できた: false });
    for (const k of ["スマレジメモ", "ショップ用メモ欄", "ポイント連携エラー"]) expect.soft(文[k], `${k}（非活性・入力できない）`).toEqual({ 活性: false, 入力できた: false });
  });
});

// ---- スマレジ受注の金額欄 ----
caseTest("IT-M05-11-150", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  note("スマレジ取引は画面で作れないため、画面で作った受注へスマレジ取引IDを書き足した受注で確かめた（シード表の受注番号 M0511-150-ORD ではなく、画面が振った番号）");
  const 見出し = ["小計値引き/割引区分", "クーポン値引き", "免税額"];
  let q!: OrderEditQ;
  const 数: Record<string, number> = {};
  await step(1, async () => { await 開く(browser, page, notes.get(key("150"))); q = new OrderEditQ(page); });
  await step(2, async () => { for (const h of 見出し) 数[h] = await q.金額欄の見出し(h).count(); });
  await expected(async () => { for (const h of 見出し) expect.soft(数[h], `金額欄に「${h}」が表示される件数`).toBe(1); });
});

// ---- 商品の追加（在庫0の警告） ----
caseTest("IT-M05-11-083", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let q!: OrderEditQ;
  let 警告: string[] = [];
  await step(1, async () => { await 開く(browser, page, notes.get(key("共有BASE"))); q = new OrderEditQ(page); });
  await step(2, async () => { await q.商品の追加を開く(); });
  await step(3, async () => { await q.商品を検索する("在庫なし商品"); });
  await step(4, async () => { await q.規格を選んで決定する(rc("ZERO-001")); 警告 = await q.在庫の警告(); note(`画面の在庫についての警告: ${警告.join(" / ") || "（なし）"}`); });
  await expected(async () => { expect.soft(警告.length, "在庫が0の商品を追加したことを示す警告の件数").toBeGreaterThan(0); });
});

// ---- 受注ステータス ----
caseTest("IT-M05-11-249", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const no = notes.get(key("249"));
  let p!: OrderEditPage;
  let 前: string | null = "", 後: string | null = null;
  await step(1, async () => { p = await 開く(browser, page, no); 前 = 受注の日付(no, "注文確定日"); });
  await step(2, async () => { await p.ステータスを選ぶ("ピック中"); });
  await step(3, async () => { await p.ステータスを変更する(onDialog); });
  await step(4, async () => { 後 = 受注の日付(no, "注文確定日"); });
  await expected(async () => {
    expect.soft(前, "操作前の注文確定日（未登録）").toBeNull();
    expect.soft(後, "受注の注文確定日（登録された）").not.toBeNull();
  });
});

// ---- QF（二つのブラウザ） ----
async function 新しいブラウザ(browser: Browser): Promise<{ context: import("@playwright/test").BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return { context, page: await context.newPage() };
}
const 数量たち = async (d: HistoryDetailPage): Promise<string[]> => (await d.明細()).filter((r) => r.名前.includes("QF受注編集商品-001")).map((r) => 数字(r.数量));

caseTest("IT-M05-11-199", async ({ page, browser, notes, step, expected }) => {
  note("ブラウザAは新しいブラウザセッション、ブラウザBはケースの画面。商品の在庫数無制限・商品コードの印はシードで設定。数量・住所の確かめは、購入履歴詳細の注文明細の行すべてと、お届け先の郵便番号・住所の欄で行った");
  const no = notes.get("〔注文番号-M0511-QF001〕"), code = rc("QF-M0511-001");
  const m = QF会員("001");
  const A = await 新しいブラウザ(browser);
  try {
    const 履歴 = new 購入履歴の出荷日Page(A.page);
    const 詳細 = new HistoryDetailPage(A.page);
    let 前: { 数量: string[]; 郵便: string; 住所: string } = { 数量: [], 郵便: "", 住所: "" };
    let 後: typeof 前 = { 数量: [], 郵便: "", 住所: "" };
    const 読む = async () => ({ 数量: await 数量たち(詳細), 郵便: await 詳細.お届け先の郵便番号(), 住所: await 詳細.お届け先の住所() });
    let q!: OrderEditQ;
    await step(1, async () => { await 履歴.ログインして購入履歴を開く({ メール: m.メール, パスワード: m.パスワード }); });
    await step(2, async () => { await 履歴.詳細を開く(no); 前 = await 読む(); });
    await step(3, async () => { await loginAdmin(page, QF管理者); await 開く(browser, page, no); q = new OrderEditQ(page); });
    await step(4, async () => { await q.数量を入れる(code, "2"); });
    await step(5, async () => { await q.お届け先を入れる({ 郵便1: "105", 郵便2: "0011", 住所1: "港区芝公園", 住所2: "4-2-8", 住所3: "QF-ビル3F-001" }); });
    await step(6, async () => { await new OrderEditPage(page).受注情報を登録する(onDialog); });
    await step(7, async () => { await 履歴.開き直す(); 後 = await 読む(); });
    await expected(async () => {
      expect.soft(前.数量, "手順2の注文明細の数量（すべて1）").toEqual(前.数量.map(() => "1"));
      expect.soft(前.数量.length, "手順2の注文明細の行数").toBeGreaterThan(0);
      expect.soft(前.郵便, "手順2のお届け先の郵便番号").toContain("100-0001");
      expect.soft(前.住所, "手順2のお届け先の住所").toContain("千代田区千代田");
      expect.soft(前.住所, "手順2のお届け先の住所").toContain("1-1");
      expect.soft(後.数量, "手順7の注文明細の数量（すべて2）").toEqual(後.数量.map(() => "2"));
      expect.soft(後.数量.length, "手順7の注文明細の行数").toBeGreaterThan(0);
      expect.soft(後.郵便, "手順7のお届け先の郵便番号").toContain("105-0011");
      for (const s of ["港区芝公園", "4-2-8", "QF-ビル3F-001"]) expect.soft(後.住所, `手順7のお届け先の住所に「${s}」`).toContain(s);
    });
  } finally {
    await A.context.close();
  }
});

caseTest("IT-M05-11-200", async ({ page, browser, notes, step, expected }) => {
  note("ブラウザAは新しいブラウザセッション、ブラウザBはケースの画面。商品名には実行の印が付くので、商品名は印を除いた部分で比べた");
  const no = notes.get("〔注文番号-M0511-QF002〕");
  const m = QF会員("002");
  const A = await 新しいブラウザ(browser);
  try {
    const 履歴 = new 購入履歴の出荷日Page(A.page);
    const 行の文 = async (): Promise<string> => {
      const box = A.page.locator(".p-hareruya-history-list__box").filter({ hasText: no }).first();
      await expect(box, `購入履歴一覧の注文番号 ${no} の行`).toBeVisible();
      return ((await box.innerText()) ?? "").replace(/\s+/g, " ").trim();
    };
    let 前 = "", 後 = "";
    let q!: OrderEditQ;
    await step(1, async () => { await 履歴.ログインして購入履歴を開く({ メール: m.メール, パスワード: m.パスワード }); });
    await step(2, async () => { 前 = await 行の文(); });
    await step(3, async () => { await loginAdmin(page, QF管理者); await 開く(browser, page, no); q = new OrderEditQ(page); });
    await step(4, async () => {
      await q.商品の追加を開く();
      await q.商品を検索する(rc("QF-M0511-002B"));
      await q.規格を選んで決定する(rc("QF-M0511-002B"));
    });
    await step(5, async () => { await new OrderEditPage(page).受注情報を登録する(onDialog); });
    await step(6, async () => { await A.page.goto(`${BASE_URL}/ja/mypage/shopping_history`); await A.page.waitForLoadState("load"); 後 = await 行の文(); });
    await expected(async () => {
      expect.soft(前, "手順2の注文内容に「QF元商品-002」").toContain("QF元商品-002");
      expect.soft(前.includes("QF追加商品-002"), "手順2の注文内容に「QF追加商品-002」は無い").toBe(false);
      expect.soft(後, "手順6の注文内容に「QF元商品-002」").toContain("QF元商品-002");
      expect.soft(後, "手順6の注文内容に「QF追加商品-002」").toContain("QF追加商品-002");
    });
  } finally {
    await A.context.close();
  }
});
