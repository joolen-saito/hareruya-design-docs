/**
 * M07-03 買取履歴（マイページ）の画面シード（買取情報編集の変更が会員側へ反映されるケースが使うもの）。正本: cases/M07-03_seed_data.tsv
 *
 * 作るシード: QG-ADMIN（管理者）と QG-ORDER-137〜142（会員・ネット買取・えらんで買取の明細）。
 * - 会員は、正本は管理画面の会員登録（固定のメールアドレス）だが、フロントの会員登録で作る（依頼者決定 2026-10-31）。メールアドレスは実行の印つき
 *   （qg0703-001-<印>@example.test）で、ケースはこのメールでログインする。姓は正本の値（QG0703-001-会員）。
 * - 商品名・商品コードは実行の印つき（QG0703-001-A-<印>）。ケースの文の同じ値も印つきの値として確かめる。
 * - 買取番号は、申込のたびに管理画面の一覧の先頭行から控える（完了画面の番号と同じことを確かめている）。マイページの買取履歴一覧からの控えではない。
 * DBでの準備が要るシード（REF・GF-STATUS・CASE-* ほか）は作らない。RG-*（在庫履歴を見るケース）は作っていない。
 */
import { SETUP_ADMIN } from "../config/env";
import { 商品IDをコードから } from "../db/m07";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc, RUN_MARK } from "../lib/run_marker";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { サプライ, サプライ品を登録する } from "../pages/admin/m07_supply";
import { 複数を申込む, ログインする } from "../pages/front/m07_net_buy";
import { BASE_URL } from "../config/env";
import { hideDebugToolbar } from "../lib/session";
import { 会員を作る, 先頭の買取番号, 試験管理者を用意する, 試験会員 } from "./m07-common";

export const M0703_ADMIN: Account = { loginId: "qg0703admin", password: "Passw0rd-Qg0703Ad" };

/** QG-ORDER ごとの会員（ケースがログインに使う） */
export const QG会員 = new Map<string, 試験会員>();

export const 品名 = (n: string, 枝: string): string => rc(`QG0703-${n}-${枝}`);

defineSeed("S-M07-03-QG-ADMIN", async ({ browser }) => {
  await 試験管理者を用意する(browser, M0703_ADMIN, "QG0703 ネット買取管理者");
});

type 明細の設定 = { 枝: string; 買取価格: string; 申込数量: string; 査定価格: string; 売却: string };

/** 会員の管理画面での会員ID（会員一覧の行から読む） */
async function 会員IDを読む(browser: import("@playwright/test").Browser, メール: string): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    await page.goto(adminUrl("/customer"));
    await page.waitForLoadState("load");
    await page.locator('[name="admin_search_customer[multi]"]').fill(メール);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.locator("#search_form button[type=submit]").filter({ hasText: "検索" }).first().click()]);
    await page.waitForLoadState("load");
    const id = /ex-customer-(\d+)/.exec((await page.locator('tr[id^="ex-customer-"]').first().getAttribute("id")) ?? "")?.[1];
    if (!id) throw new Error(`会員 ${メール} が会員一覧に無い`);
    return id;
  });
}

function QG注文(seedId: string, n: string, 明細: 明細の設定[], 状況: string, 別に登録する枝: { 枝: string; 買取価格: string }[] = []): void {
  defineSeed(seedId, { needs: ["S-M07-03-QG-ADMIN"] }, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const 姓 = `QG0703-${n}-会員`;
    const 品: サプライ[] = 明細.map((m) => ({ コード: 品名(n, m.枝), 名前: 品名(n, m.枝), 基準価格: "5000", 買取価格: m.買取価格 }));
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { page.setDefaultTimeout(60_000); await サプライ品を登録する(page, [...品, ...別に登録する枝.map((m) => ({ コード: 品名(n, m.枝), 名前: 品名(n, m.枝), 基準価格: "5000", 買取価格: m.買取価格 }))], issue); });
    const 会員 = await 会員を作る(browser, 姓, `qg0703${n}`);
    QG会員.set(n, 会員);
    notes.set(`〔会員ID-M0703-QG${n}〕`, await 会員IDを読む(browser, 会員.メール));
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    let done = "";
    try {
      await hideDebugToolbar(ctx);
      const fp = await ctx.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, 会員);
      const 商品 = 明細.map((m) => {
        const id = 商品IDをコードから(品名(n, m.枝));
        if (!id) throw new Error(`申込に使う商品 ${品名(n, m.枝)} が見つからない`);
        return { 商品ID: id, 数量: m.申込数量 };
      });
      done = await 複数を申込む(fp, 商品);
    } finally { await ctx.close(); }
    await withAdminSession(browser, SETUP_ADMIN, async (a) => {
      a.setDefaultTimeout(60_000);
      const first = await 先頭の買取番号(a, 姓);
      if (first !== done) throw new Error(`申込完了の買取番号 ${done} と、一覧の先頭行 ${first} が違う`);
    });
    notes.set(`〔買取番号-M0703-QG${n}〕`, done);
    await withAdminSession(browser, { loginId: M0703_ADMIN.loginId, password: M0703_ADMIN.password }, async (page) => {
      page.setDefaultTimeout(60_000);
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(done);
      await l.検索する();
      await l.編集画面を開く(done);
      const edit = new BuyEditPage(page);
      await edit.査定編集を始める();
      for (const m of 明細) await edit.明細を名前で入れる(品名(n, m.枝), { 査定価格: m.査定価格, 売却: m.売却 });
      await edit.査定確定する();
      await edit.買取状況を変えて保存する(状況);
    });
  });
}

QG注文("S-M07-03-QG-ORDER-137", "001", [
  { 枝: "A", 買取価格: "1000", 申込数量: "1", 査定価格: "1000", 売却: "売却する" },
  { 枝: "B", 買取価格: "2000", 申込数量: "1", 査定価格: "2000", 売却: "売却しない" },
  { 枝: "C", 買取価格: "3000", 申込数量: "1", 査定価格: "3000", 売却: "売却する" },
], "査定内容連絡済み");
QG注文("S-M07-03-QG-ORDER-138", "002", [
  { 枝: "A", 買取価格: "1000", 申込数量: "2", 査定価格: "1000", 売却: "売却する" },
  { 枝: "B", 買取価格: "3000", 申込数量: "1", 査定価格: "3000", 売却: "売却しない" },
], "査定内容連絡済み");
QG注文("S-M07-03-QG-ORDER-140", "004", [
  { 枝: "A", 買取価格: "1000", 申込数量: "1", 査定価格: "1000", 売却: "売却する" },
  { 枝: "B", 買取価格: "800", 申込数量: "1", 査定価格: "800", 売却: "売却する" },
], "査定内容連絡済み");
QG注文("S-M07-03-QG-ORDER-141", "005", [
  { 枝: "A", 買取価格: "1000", 申込数量: "1", 査定価格: "1000", 売却: "売却する" },
], "査定中");
QG注文("S-M07-03-QG-ORDER-142", "006", [
  { 枝: "A", 買取価格: "1000", 申込数量: "1", 査定価格: "1000", 売却: "売却する" },
  { 枝: "B", 買取価格: "2000", 申込数量: "1", 査定価格: "2000", 売却: "売却しない" },
  { 枝: "C", 買取価格: "3000", 申込数量: "1", 査定価格: "3000", 売却: "売却する" },
], "査定内容連絡済み");

// 139: 明細は A の1件。サプライ品 QG0703-003-SUP（買取価格100）は別に登録しておく（この買取の明細には入れない）
QG注文("S-M07-03-QG-ORDER-139", "003", [
  { 枝: "A", 買取価格: "1000", 申込数量: "1", 査定価格: "1000", 売却: "売却する" },
], "査定内容連絡済み", [{ 枝: "SUP", 買取価格: "100" }]);
void RUN_MARK;
