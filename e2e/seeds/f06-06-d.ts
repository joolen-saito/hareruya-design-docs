/**
 * F06-06 購入履歴一覧の続き（-d）のシード。実施不可の見直し（review/not_runnable_recheck_cases.tsv）で流せる見込みになったもののうち、
 * 画面で作れる 002・011・015・016・024・025・030。正本: cases/F06-06_seed_data.tsv
 *
 * 型: 会員はフロントの会員登録（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）→ 商品はグッズ商品CSV登録で作り、
 * 本店・EC-CUBE の在庫編集で入庫して別のメンバーが承認（pages/admin/f04_setup.ts の 商品を作って入庫する）→ 会員がフロントで注文
 * （pages/front/m05_11_order.ts の 会員が注文する。配送方法・支払方法はシード表のとおり。選べなければ止める）→ 管理画面の受注情報編集で対応状況を変える。
 * 注文番号・注文ID・商品IDは画面が振った番号を控える。
 *
 * シードでの解釈（正本の外の補い。記録にも書く）:
 * - 注文日（011 2026-02-01・015/016 2026-01-10・024 2026-05-01・025 2026-05-10・030 2026-04-12）は画面で指定できないので、注文した日（実施日）のまま。
 * - 受取店舗「晴れる屋本店」は、開発環境の本店（店舗ID 1）の店名に読み替えた。
 * - 002 の購入処理中の注文（注文ID=606040102・注文番号=FILTER-A-002-002）は、会員がカートに入れてご注文方法指定画面を開いて作った（画面が振る番号。DB の参照で確かめる）。
 * - S-F06-06-MASTER（環境初期化用DBシードの店舗・支払方法・BOステータス）は環境のシードとして、開発環境に既にあるものを使う。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 処理中受注ID一覧 } from "../db/f04_02";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 商品を作って入庫する, 本店の店名 } from "../pages/admin/f04_setup";
import { addToCart, clearCart, frontLogin } from "../pages/admin/m04_19_order_shortage";
import { ShoppingPage } from "../pages/front/f04_shopping";
import { 会員が注文する } from "../pages/front/m05_11_order";
import { 本会員を作る } from "./f06-member";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

export type 作った注文 = { 会員ID: string; 会員メール: string; パスワード: string; 商品ID: string; 商品コード: string; 注文番号: string; 注文ID: string; 処理中の受注ID?: string };
const built = new Map<string, 作った注文>();
export function 注文の(seedId: string): 作った注文 {
  const s = built.get(seedId);
  if (!s) throw new Error(`${seedId} はまだ作っていない`);
  return s;
}

async function 対応状況を変えて注文IDを読む(browser: Browser, 注文番号: string, 状況: string[]): Promise<string> {
  const shop = await 本店の店名(browser);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new OrderEditPage(page);
    await p.openByOrderNo(注文番号, shop);
    const id = /\/order\/(\d+)\/edit/.exec(page.url())?.[1] ?? "";
    for (const s of 状況) {
      await p.ステータスを選ぶ(s);
      await p.ステータスを変更する(() => undefined);
    }
    return id;
  });
}

type 作り方 = { 前半: string; パスワード: string; 姓: string; 名: string; 商品コード: string; 配送: string; 支払: string; 状況: string[]; 番号: string };

async function 会員と注文を作る(browser: Browser, seedId: string, notes: Notes, a: 作り方): Promise<作った注文> {
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 会員ID = await 本会員を作る(browser, { 姓: a.姓, 名: a.名, セイ: "コウニュウリレキ", メイ: "タロウ", 前半: a.前半, パスワード: a.パスワード });
  控える(notes, seedId, `〔会員ID-F0606-${a.番号}〕`, 会員ID);
  const [商品] = await 商品を作って入庫する(browser, seedId, [{ 商品コード: rc(a.商品コード), 商品名: rc(a.商品コード), 価格: "1000", 入庫数: 5, 入庫方法: "在庫編集" }], issue);
  控える(notes, seedId, `〔商品ID-F0606-${a.番号}〕`, 商品.productId);
  const r = await 会員が注文する(browser, { 姓: a.姓, 名: a.名, セイ: "コウニュウリレキ", メイ: "タロウ", メール: mailOf(a.前半), パスワード: a.パスワード },
    [{ 商品ID: 商品.productId, 数量: 1 }], seedId, { 配送: a.配送, 支払候補: [a.支払] });
  if (r.配送方法 !== a.配送) throw new Error(`${seedId}: 配送方法「${a.配送}」を選べなかった（選んだのは「${r.配送方法}」）`);
  if (r.支払方法 !== a.支払) throw new Error(`${seedId}: 支払方法「${a.支払}」を選べなかった（選んだのは「${r.支払方法}」）`);
  控える(notes, seedId, `〔注文番号-F0606-${a.番号}〕`, r.注文番号);
  const 注文ID = await 対応状況を変えて注文IDを読む(browser, r.注文番号, a.状況);
  控える(notes, seedId, `〔注文ID-F0606-${a.番号}〕`, 注文ID);
  issue(`注文日は画面で指定できないので、注文した日（実施日）のまま（正本の外の補い）`);
  const o: 作った注文 = { 会員ID, 会員メール: mailOf(a.前半), パスワード: a.パスワード, 商品ID: 商品.productId, 商品コード: rc(a.商品コード), 注文番号: r.注文番号, 注文ID };
  built.set(seedId, o);
  return o;
}

const 本店受取 = (番号: string, 前半: string, パスワード: string, 商品コード: string, 配送: "店頭受取" | "スムーズ店頭受取") =>
  ({ 前半, パスワード, 姓: "購入履歴", 名: 番号, 商品コード, 配送, 支払: "店頭支払", 状況: ["出荷完了"], 番号 });

defineSeed("S-F06-06-DISPLAY-011", async ({ browser, notes, seed }) => { await 会員と注文を作る(browser, seed.シードID, notes, 本店受取("011", "display-f0606-011", "Pw-F0606-011!", "F0606-OTC-011", "店頭受取")); });
defineSeed("S-F06-06-DISPLAY-030", async ({ browser, notes, seed }) => { await 会員と注文を作る(browser, seed.シードID, notes, 本店受取("030", "dpf0606-030", "Passw0rd-F0606030", "F0606-OTC-030", "店頭受取")); });
defineSeed("S-F06-06-SMOOTHNO-024", async ({ browser, notes, seed }) => { await 会員と注文を作る(browser, seed.シードID, notes, 本店受取("024", "smoothno-f0606-024", "Pw-F0606-024!", "F0606-SMOOTH-024", "スムーズ店頭受取")); });
for (const n of ["015", "016"]) {
  defineSeed(`S-F06-06-DISPLAY-${n}`, async ({ browser, notes, seed }) => {
    await 会員と注文を作る(browser, seed.シードID, notes, { 前半: `display-f0606-${n}`, パスワード: `Pw-F0606-${n}!`, 姓: "購入履歴", 名: n, 商品コード: `F0606-EC-${n}`, 配送: "ゆうパック", 支払: "銀行振込", 状況: ["入金済み"], 番号: n });
  });
}
defineSeed("S-F06-06-MEMBERNAME-025", async ({ browser, notes, seed }) => {
  await 会員と注文を作る(browser, seed.シードID, notes, { 前半: "membername-f0606-025", パスワード: "Pw-F0606-025!", 姓: "購入履歴025", 名: "太郎", 商品コード: "F0606-NAME-025", 配送: "ゆうパック", 支払: "銀行振込", 状況: ["入金済み"], 番号: "025" });
});

defineSeed("S-F06-06-FILTER-002", async ({ browser, notes, seed }) => {
  const A = await 会員と注文を作る(browser, seed.シードID, notes, { 前半: "filter-f0606-002", パスワード: "Pw-F0606-002!", 姓: "抽出確認", 名: "会員", 商品コード: "F0606-FILTER-002", 配送: "ゆうパック", 支払: "銀行振込", 状況: ["入金済み"], 番号: "002A" });
  const B = await 会員と注文を作る(browser, seed.シードID, notes, { 前半: "filter-other-f0606-002", パスワード: "Pw-F0606-002-OTHER!", 姓: "抽出確認", 名: "他会員", 商品コード: "F0606-FILTER-002B", 配送: "ゆうパック", 支払: "銀行振込", 状況: ["入金済み"], 番号: "002B" });
  // 購入処理中の注文: 対象会員がカートに入れてご注文方法指定画面を開く（画面が受注を作る）
  const 会員ID = A.会員ID;
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, { メール: A.会員メール, パスワード: A.パスワード });
    await clearCart(page, () => undefined);
    await addToCart(page, A.商品ID, 1, `${seed.シードID}: 購入処理中の注文の商品をカートに入れる`);
    await new ShoppingPage(page).買い物かごから開く();
  } finally { await context.close(); }
  const 処理中 = 処理中受注ID一覧(会員ID);
  if (処理中.length === 0) throw new Error(`${seed.シードID}: ご注文方法指定画面を開いたが、対象会員の購入処理中の受注が DB に無い`);
  A.処理中の受注ID = 処理中[処理中.length - 1];
  reportSeedIssue(seed.シードID, `購入処理中の注文は画面が振る番号（受注ID ${A.処理中の受注ID}）。正本の注文ID 606040102・注文番号 FILTER-A-002-002 は画面で指定できない（正本の外の補い）`);
  built.set(seed.シードID, A);
  built.set(`${seed.シードID}#B`, B);
});
