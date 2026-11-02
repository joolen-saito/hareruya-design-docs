/**
 * M07-03 買取履歴（マイページ）。正本: cases/M07-03_test_cases.tsv
 *
 * 画面だけで準備できる QG（買取情報編集の変更が会員側の買取履歴へ反映される）の 137〜142 を実装した（記録 review/M07-03_progress_2026-11-02.md）。
 * ブラウザA（会員）とブラウザB（管理者）は、別のブラウザセッション（コンテキスト）で操作する。
 * DBでの準備が要るシードを使うケースと、在庫履歴・会員登録編集を見る RG-* のケースは実装していない。
 */
import { Browser, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest } from "../../lib/case";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { BuyEditPage, BuyListPage } from "../../pages/admin/m07_buy";
import { NetHistoryPage } from "../../pages/front/m07_03_history";
import { ログインする } from "../../pages/front/m07_net_buy";
import { M0703_ADMIN, QG会員, 品名 } from "../../seeds/m07-03";

/** ブラウザA（会員）を別のコンテキストで開き、ログインする */
async function ブラウザAを開く(browser: Browser, n: string): Promise<{ page: Page; close: () => Promise<void> }> {
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(ctx);
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  const m = QG会員.get(n);
  if (!m) throw new Error(`QG0703-${n} の会員がシードで作られていない`);
  await ログインする(page, m);
  return { page, close: () => ctx.close() };
}

/** ブラウザBで、買取情報編集画面を開く */
async function 編集を開く(page: Page, 番号: string): Promise<BuyEditPage> {
  const l = new BuyListPage(page);
  await l.open();
  await l.買取番号を入れる(String(Number(番号)));
  await l.検索する();
  await l.編集画面を開く(番号);
  return new BuyEditPage(page);
}

caseTest("IT-M07-03-137", async ({ page, browser, notes, step, expected }) => {
  const A = await ブラウザAを開く(browser, "001");
  try {
    const 番号 = notes.get("〔買取番号-M0703-QG001〕");
    const h = new NetHistoryPage(A.page);
    let 前: Awaited<ReturnType<NetHistoryPage["明細"]>> = [], 後: typeof 前 = [];
    let 編集: BuyEditPage;
    await step(1, async () => { await h.一覧を開く(); await h.詳細を開く(番号); });
    await step(2, async () => { 前 = await h.明細(); });
    await step(3, async () => { await loginAdmin(page, M0703_ADMIN); 編集 = await 編集を開く(page, 番号); });
    let 文: string[] = [];
    await step(4, async () => { 文 = await 編集!.一括売却登録する("OK"); });
    await step(5, async () => { await h.一覧を開く(); await h.詳細を開く(番号); 後 = await h.明細(); });
    await expected(async () => {
      const f = (rows: typeof 前, 枝: string) => rows.find((r) => r.商品名 === 品名("001", 枝))?.売却 ?? "（明細が無い）";
      expect.soft(f(前, "B"), "手順2の明細QG0703-001-Bの選択").toBe("売却しない");
      for (const 枝 of ["A", "B", "C"]) expect.soft(f(後, 枝), `手順5の明細QG0703-001-${枝}の選択`).toBe("売却する");
      expect.soft(文.join(" / "), "一括売却登録の確認ダイアログの文").toContain("すべての買取商品の売却ステータスを「売却する」に変更します");
    });
  } finally { await A.close(); }
});

caseTest("IT-M07-03-138", async ({ page, browser, notes, step, expected }) => {
  const A = await ブラウザAを開く(browser, "002");
  try {
    const 番号 = notes.get("〔買取番号-M0703-QG002〕");
    const h = new NetHistoryPage(A.page);
    let 前 = { 処理状態: "", 買取金額合計: "" }, 後 = { 処理状態: "", 買取金額合計: "" };
    let 編集: BuyEditPage;
    await step(1, async () => { await h.一覧を開く(); });
    await step(2, async () => { const b = await h.箱の文(番号); 前 = { 処理状態: b.処理状態, 買取金額合計: b.買取金額合計 }; });
    await step(3, async () => { await loginAdmin(page, M0703_ADMIN); 編集 = await 編集を開く(page, 番号); });
    await step(4, async () => { await 編集!.買取状況を変えて保存する("査定内容承諾"); });
    await step(5, async () => { await h.一覧を開く(); const b = await h.箱の文(番号); 後 = { 処理状態: b.処理状態, 買取金額合計: b.買取金額合計 }; });
    await expected(async () => {
      expect.soft(前.処理状態, "手順2の処理状態").toContain("査定完了");
      expect.soft(前.買取金額合計.replace(/[^0-9]/g, ""), "手順2の買取金額合計（表示されない）").toBe("");
      expect.soft(後.処理状態, "手順5の処理状態").toContain("振込待ち");
      expect.soft(後.買取金額合計.replace(/[^0-9]/g, ""), "手順5の買取金額合計（査定承諾金額合計2000）").toBe("2000");
    });
  } finally { await A.close(); }
});

caseTest("IT-M07-03-139", async ({ page, browser, notes, step, expected }) => {
  const A = await ブラウザAを開く(browser, "003");
  try {
    const 番号 = notes.get("〔買取番号-M0703-QG003〕");
    const h = new NetHistoryPage(A.page);
    let 前: Awaited<ReturnType<NetHistoryPage["明細"]>> = [], 後: typeof 前 = [];
    let 編集: BuyEditPage;
    await step(1, async () => { await h.一覧を開く(); await h.詳細を開く(番号); });
    await step(2, async () => { 前 = await h.明細(); });
    await step(3, async () => { await loginAdmin(page, M0703_ADMIN); 編集 = await 編集を開く(page, 番号); });
    await step(4, async () => { await 編集!.明細に商品を追加する(品名("003", "SUP")); });
    await step(5, async () => {
      await 編集!.査定編集を始める();
      await 編集!.明細を名前で入れる(品名("003", "SUP"), { 査定価格: "700", 数量: "2", 売却: "売却する" });
      await 編集!.査定確定する();
      await 編集!.保存する("明細の追加と査定の保存");
    });
    await step(6, async () => { await h.一覧を開く(); await h.詳細を開く(番号); 後 = await h.明細(); });
    await expected(async () => {
      expect.soft(前.some((r) => r.商品名 === 品名("003", "SUP")), "手順2のえらんで買取の明細にQG0703-003-SUPが表示される").toBe(false);
      const r = 後.find((x) => x.商品名 === 品名("003", "SUP"));
      expect.soft(r !== undefined, "手順6の明細にQG0703-003-SUPが表示される").toBe(true);
      expect.soft(r?.査定価格.replace(/[^0-9]/g, "") ?? "", "手順6の査定価格").toBe("700");
      expect.soft(r?.数量 ?? "", "手順6の数量").toBe("2");
      expect.soft(r?.小計.replace(/[^0-9]/g, "") ?? "", "手順6の小計").toBe("1400");
    });
  } finally { await A.close(); }
});

caseTest("IT-M07-03-140", async ({ page, browser, notes, step, expected }) => {
  const A = await ブラウザAを開く(browser, "004");
  try {
    const 番号 = notes.get("〔買取番号-M0703-QG004〕");
    const h = new NetHistoryPage(A.page);
    let 前: Awaited<ReturnType<NetHistoryPage["明細"]>> = [], 後: typeof 前 = [];
    let 編集: BuyEditPage;
    let 文: string[] = [];
    await step(1, async () => { await h.一覧を開く(); await h.詳細を開く(番号); });
    await step(2, async () => { 前 = await h.明細(); });
    await step(3, async () => { await loginAdmin(page, M0703_ADMIN); 編集 = await 編集を開く(page, 番号); });
    await step(4, async () => { 文 = await 編集!.明細を削除する(品名("004", "B"), "OK"); });
    await step(5, async () => { await h.一覧を開く(); await h.詳細を開く(番号); 後 = await h.明細(); });
    await expected(async () => {
      expect.soft(前.map((r) => r.商品名).sort(), "手順2の明細の商品名").toEqual([品名("004", "A"), 品名("004", "B")].sort());
      expect.soft(後.map((r) => r.商品名), "手順5の明細の商品名（QG0703-004-Aの1件だけ）").toEqual([品名("004", "A")]);
      expect.soft(文.join(" / "), "削除の確認ダイアログの文").toContain("を削除してもよろしいですか？");
    });
  } finally { await A.close(); }
});

caseTest("IT-M07-03-141", async ({ page, browser, notes, step, expected }) => {
  const A = await ブラウザAを開く(browser, "005");
  try {
    const 番号 = notes.get("〔買取番号-M0703-QG005〕");
    const h = new NetHistoryPage(A.page);
    let 前 = { 状態: "", ボタン: -1 }, 後 = { 状態: "", ボタン: -1 };
    let 編集: BuyEditPage;
    await step(1, async () => { await h.一覧を開く(); await h.詳細を開く(番号); });
    await step(2, async () => { 前 = { 状態: await h.項目("処理状態"), ボタン: await h.承諾確定ボタン().count() }; });
    await step(3, async () => { await loginAdmin(page, M0703_ADMIN); 編集 = await 編集を開く(page, 番号); });
    await step(4, async () => { await 編集!.買取状況を変えて保存する("査定内容連絡済み"); });
    await step(5, async () => { await h.一覧を開く(); await h.詳細を開く(番号); 後 = { 状態: await h.項目("処理状態"), ボタン: await h.承諾確定ボタン().count() }; });
    await expected(async () => {
      expect.soft(前.状態, "手順2の処理状態").toContain("査定中");
      expect.soft(前.ボタン, "手順2の承諾確定ボタンの数（表示されない）").toBe(0);
      expect.soft(後.状態, "手順5の処理状態").toContain("査定完了");
      expect.soft(後.ボタン, "手順5の承諾確定ボタンの数（表示される）").toBeGreaterThan(0);
    });
  } finally { await A.close(); }
});

caseTest("IT-M07-03-142", async ({ page, browser, notes, step, expected }) => {
  const A = await ブラウザAを開く(browser, "006");
  try {
    const 番号 = notes.get("〔買取番号-M0703-QG006〕");
    const h = new NetHistoryPage(A.page);
    let 前 = "", 後 = "";
    let 編集: BuyEditPage;
    await step(1, async () => { await h.一覧を開く(); });
    await step(2, async () => { 前 = (await h.箱の文(番号)).全文; });
    await step(3, async () => { await loginAdmin(page, M0703_ADMIN); 編集 = await 編集を開く(page, 番号); });
    await step(4, async () => { await 編集!.一括売却登録する("OK"); });
    await step(5, async () => { await h.一覧を開く(); 後 = (await h.箱の文(番号)).全文; });
    await expected(async () => {
      expect.soft(前, "手順2の買取依頼内容に代表商品QG0703-006-C").toContain(品名("006", "C"));
      expect.soft(前, "手順2の買取依頼内容の「ほか1件」").toContain("ほか1件");
      expect.soft(後, "手順5の買取依頼内容に代表商品QG0703-006-C").toContain(品名("006", "C"));
      expect.soft(後, "手順5の買取依頼内容の「ほか2件」").toContain("ほか2件");
    });
  } finally { await A.close(); }
});
