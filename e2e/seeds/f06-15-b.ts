/**
 * F06-15 買取履歴詳細の画面シード（-b）。正本: cases/F06-15_seed_data.tsv
 *
 * - 会員: フロントの会員登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える（依頼者決定 2026-10-31。シード表は管理画面の会員登録（新規）と定める）。パスワードは共通の「Passw0rd!F0615」。
 * - 商品: シード表のグッズ商品CSV登録と同じ画面操作でサプライ品として登録する（商品名・商品コードに実行の印）。申込時の買取価格は査定価格と同じ値にした（シード表が定めない）。
 * - ネット買取: 会員でフロントにログインして申込む。買取番号は申込みの完了画面の番号を控える。申込みの承諾方法は、画面の先頭の選択肢（査定結果を確認してから承諾する）。
 * - 査定・買取状況: 管理画面の買取情報編集で、査定編集 → 査定価格・売却を入れる → 査定確定 → 買取状況を選んで保存。
 * - 買取依頼日をDBで直接設定する手順は行わない（依頼日は申込みの日になる）。依頼日を確かめるケースは実装しない。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 商品IDをコードから } from "../db/m07";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { ログインする, 複数を申込む } from "../pages/front/m07_net_buy";
import { storeInput } from "./m06-common";
import { 店舗の管理者を用意する, 店舗を用意する, 店頭買取のステータスを変える, 店頭買取を申込む } from "./f06-11-b";
import { 本会員を作る } from "./f06-member";
import { PW, mailOf } from "./f06-15";

export const 表示の番号 = (n: string): string => String(Number(n)).padStart(7, "0");
export const 品名 = (n: string, 枝: string): string => rc(`F0615-${n}-${枝}`);

type 明細 = { 枝: string; 買取価格?: string; 数量?: string; 査定価格?: string; 売却?: "売却する" | "売却しない" };
type 注文 = { 明細: 明細[]; 状況: string | null; 査定する?: boolean };

async function 会員を作る(browser: Browser, n: string): Promise<string> {
  return 本会員を作る(browser, { 姓: "F0615", 名: `会員${n}`, セイ: "シケン", メイ: "カイイン", 前半: `f0615-${n}`, パスワード: PW });
}

async function 管理画面で整える(browser: Browser, 番号: string, 注文: 注文, n: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const l = new BuyListPage(page);
    await l.open();
    await l.買取番号を入れる(String(Number(番号)));
    await l.検索する();
    await l.編集画面を開く(番号);
    const e = new BuyEditPage(page);
    if (注文.査定する) {
      await e.査定編集を始める();
      for (const m of 注文.明細) {
        if (m.査定価格 === undefined && m.売却 === undefined) continue;
        await e.明細を名前で入れる(品名(n, m.枝), { 査定価格: m.査定価格, 売却: m.売却 });
      }
      await e.査定確定する();
    }
    if (注文.状況) await e.買取状況を変えて保存する(注文.状況);
  });
}

/** 注文のシード。ラベルは作った順の買取番号の呼び名 */
function ネット注文(seedId: string, n: string, 注文たち: 注文[], 呼び名: string[]): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    notes.set(`〔会員ID-F0615-${n}〕`, await 会員を作る(browser, n));
    const 品 = new Map<string, string>();
    for (const o of 注文たち) for (const m of o.明細) if (!品.has(m.枝)) 品.set(m.枝, m.買取価格 ?? m.査定価格 ?? "1000");
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      await サプライ品を登録する(page, [...品].map(([枝, 価格]) => ({ コード: 品名(n, 枝), 名前: 品名(n, 枝), 基準価格: "5000", 買取価格: 価格 })), (m) => reportSeedIssue(seedId, m));
    });
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    const 番号: string[] = [];
    try {
      await hideDebugToolbar(ctx);
      const fp = await ctx.newPage();
      fp.setDefaultTimeout(60_000);
      await ログインする(fp, { メール: mailOf(`f0615-${n}`), パスワード: PW });
      for (const o of 注文たち) {
        const 商品 = o.明細.map((m) => {
          const id = 商品IDをコードから(品名(n, m.枝));
          if (!id) throw new Error(`申込みに使う商品 ${品名(n, m.枝)} が見つからない`);
          return { 商品ID: id, 数量: m.数量 };
        });
        番号.push(表示の番号(await 複数を申込む(fp, 商品)));
      }
    } finally { await ctx.close(); }
    for (let i = 0; i < 注文たち.length; i++) {
      notes.set(呼び名[i], 番号[i]);
      if (注文たち[i].状況 || 注文たち[i].査定する) await 管理画面で整える(browser, 番号[i], 注文たち[i], n);
    }
  });
}

const 一件 = (枝 = "商品A", 価格 = "1000", 売却: "売却する" | "売却しない" = "売却する"): 明細 => ({ 枝, 買取価格: 価格, 数量: "1", 査定価格: 価格, 売却 });

ネット注文("S-F06-15-ENTRY-005", "005", [{ 明細: [{ 枝: "商品", 買取価格: "1000", 数量: "1" }], 状況: "査定中" }, { 明細: [{ 枝: "商品", 買取価格: "1000", 数量: "1" }], 状況: "査定中" }], ["〔買取番号-F0615-005A〕", "〔買取番号-F0615-005B〕"]);
ネット注文("S-F06-15-MYPAGE-006", "006", [{ 明細: [{ 枝: "商品", 買取価格: "1000", 数量: "1" }], 状況: "査定中" }], ["〔買取番号-F0615-006〕"]);
ネット注文("S-F06-15-MEMNAME-007", "007", [{ 明細: [{ 枝: "商品", 買取価格: "1000", 数量: "1" }], 状況: "査定中" }], ["〔買取番号-F0615-007〕"]);
{
  const m = [{ 枝: "商品", 買取価格: "1000", 数量: "1" }];
  ネット注文("S-F06-15-NETSTATUS-008", "008", [{ 明細: m, 状況: null }, { 明細: m, 状況: "査定中" }, { 明細: m, 状況: "査定内容連絡済み" }, { 明細: m, 状況: "査定内容承諾" }],
    ["〔買取番号-F0615-008A〕", "〔買取番号-F0615-008B〕", "〔買取番号-F0615-008C〕", "〔買取番号-F0615-008D〕"]);
}
ネット注文("S-F06-15-NODATE-012", "012", [{ 明細: [{ 枝: "商品", 買取価格: "1000", 数量: "1" }], 状況: null }], ["〔買取番号-F0615-012〕"]);
ネット注文("S-F06-15-NETSUM-015", "015", [{
  明細: [{ 枝: "商品A", 買取価格: "18000", 数量: "1", 査定価格: "18000", 売却: "売却する" }, { 枝: "商品B", 買取価格: "7000", 数量: "1", 査定価格: "7000", 売却: "売却しない" }],
  査定する: true, 状況: "査定内容承諾" }], ["〔買取番号-F0615-015〕"]);
ネット注文("S-F06-15-BTNON-017", "017", [{ 明細: [一件()], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-017〕"]);
ネット注文("S-F06-15-ELINE-021", "021", [{ 明細: [{ 枝: "商品A", 買取価格: "1000", 数量: "3", 査定価格: "1200", 売却: "売却する" }], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-021〕"]);
ネット注文("S-F06-15-NOBULK-031", "031", [{ 明細: [一件()], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-031〕"]);
ネット注文("S-F06-15-SELLON-033", "033", [{ 明細: [一件()], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-033〕"]);
ネット注文("S-F06-15-SELLOFF-034", "034", [{ 明細: [一件("商品A", "1000", "売却しない")], 査定する: true, 状況: "査定内容承諾" }], ["〔買取番号-F0615-034〕"]);
ネット注文("S-F06-15-PENDING-037", "037", [{
  明細: [{ 枝: "A", 買取価格: "800", 数量: "1" }, { 枝: "B", 買取価格: "800", 数量: "1", 査定価格: "800" }],
  査定する: true, 状況: "査定中" }], ["〔買取番号-F0615-037〕"]);
ネット注文("S-F06-15-NAMELINK-038", "038", [{ 明細: [{ 枝: "商品A", 買取価格: "1000", 数量: "1" }], 状況: "査定中" }], ["〔買取番号-F0615-038〕"]);
ネット注文("S-F06-15-CONFIRM-046", "046", [{ 明細: [一件()], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-046〕"]);
ネット注文("S-F06-15-APPROVE-047", "047", [{ 明細: [一件()], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-047〕"]);
ネット注文("S-F06-15-SWITCH-048", "048", [{ 明細: [一件("A", "1000"), 一件("B", "2000"), 一件("C", "3000")], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-048〕"]);
ネット注文("S-F06-15-SWITCH-050", "050", [{ 明細: [一件("A", "1000"), 一件("B", "2000", "売却しない"), 一件("C", "3000")], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-050〕"]);
ネット注文("S-F06-15-APPROVE-051", "051", [{ 明細: [一件()], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-051〕"]);
ネット注文("S-F06-15-REOPEN-055", "055", [{ 明細: [一件()], 査定する: true, 状況: "査定内容連絡済み" }], ["〔買取番号-F0615-055〕"]);

// ---- 店頭買取の処理状態（店舗を作り、会員として3件申込む） ----
defineSeed("S-F06-15-STORESTATUS-009", async ({ browser, notes, seed }) => {
  notes.set("〔会員ID-F0615-009〕", await 会員を作る(browser, "009"));
  const v = storeInput("F0615-009-店舗", "エフゼロロクイチゴゼロゼロキュウテンポ", "Case Zero Nine Store", "f0615store009", "F9S");
  notes.set("〔店舗ID-F0615-009〕", await 店舗を用意する(browser, v, seed.シードID));
  const 番号 = await 店頭買取を申込む(browser, "f0615store009", "f0615-009", PW, 3);
  notes.set("〔買取番号-F0615-009A〕", 番号[0]);
  notes.set("〔買取番号-F0615-009B〕", 番号[1]);
  notes.set("〔買取番号-F0615-009C〕", 番号[2]);
  const 管理者 = await 店舗の管理者を用意する(browser, notes.get("〔店舗ID-F0615-009〕"), "f0615adm009");
  await 店頭買取のステータスを変える(browser, 番号[1], "査定中", 管理者);
  await 店頭買取のステータスを変える(browser, 番号[2], "経理払い出し待ち", 管理者);
});
