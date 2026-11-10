/**
 * F06-06 購入履歴一覧の続き（-c）の画面シード。正本: cases/F06-06_seed_data.tsv
 * 既存の seeds/f06-06.ts は変えない。ここは再購入のシード（REPURCHASE-019〜022・OTHER-CUSTOMER-022）。
 *
 * - 会員: フロントの会員登録で登録し、本登録のメールは手元の受け口で読む（seeds/f06-member.ts の 本会員を作る）。メールの前半に実行の印を付ける。
 * - 商品: グッズ商品CSV登録で2種（商品コードと商品名に実行の印を付ける）→ 本店・EC-CUBE の在庫編集で入庫して別のメンバーが承認（pages/admin/f04_setup.ts の 商品を作って入庫する）。
 *   入庫数は「注文で減って、試験開始時に在庫10になる」数（A=12・B=11）。020〜022 は在庫10にする指定が無く「2以上」「1以上」なので同じ数にした。
 * - 注文: 会員がフロントで商品Aを数量2・商品Bを数量1でカートに入れ、配送方法「ゆうパック」・支払方法「銀行振込」で確定し、管理画面で「入金済み」へ変更する。
 *   注文番号と受注IDを控える。
 * - 他会員（OTHER-CUSTOMER-022）の注文は、販売中で在庫のある手元の商品1点（どの商品でもよい）。
 * - 正本の外の補い: 商品規格の公開は、商品登録のCSVで公開にしたまま（商品規格登録編集画面では保存し直さない。F04 の注文と同じ作り）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { OrderEditPage } from "../pages/admin/m05_11_order_edit";
import { 商品を作って入庫する, 本店の店名 } from "../pages/admin/f04_setup";
import { 会員が注文する, 販売中の商品 } from "../pages/front/m05_11_order";
import { 本会員を作る } from "./f06-member";

export const mailOf = (前半: string): string => `${rc(前半)}@example.test`;

function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

async function 入金済みにして受注IDを読む(browser: Browser, 注文番号: string): Promise<string> {
  const shop = await 本店の店名(browser);
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const p = new OrderEditPage(page);
    await p.openByOrderNo(注文番号, shop);
    const id = /\/order\/(\d+)\/edit/.exec(page.url())?.[1] ?? "";
    await p.ステータスを選ぶ("入金済み");
    await p.ステータスを変更する(() => undefined);
    return id;
  });
}

for (const n of ["019", "020", "021", "022"]) {
  const 接尾 = n === "022" ? "022A" : n;
  defineSeed(`S-F06-06-REPURCHASE-${n}`, async ({ browser, notes, seed }) => {
    const issue = (m: string) => reportSeedIssue(seed.シードID, m);
    const パスワード = `Pw-F0606-${n}!`;
    const 会員ID = await 本会員を作る(browser, { 姓: "再購入確認", 名: "会員", セイ: "サイコウニュウ", メイ: "カイイン", 前半: `repurchase-f0606-${n}`, パスワード });
    控える(notes, seed.シードID, `〔会員ID-F0606-${接尾}〕`, 会員ID);
    const [A, B] = await 商品を作って入庫する(browser, seed.シードID, [
      { 商品コード: rc(`REP-A-${n}`), 商品名: rc(`REP-A-${n}`), 価格: "1000", 入庫数: 12, 入庫方法: "在庫編集" },
      { 商品コード: rc(`REP-B-${n}`), 商品名: rc(`REP-B-${n}`), 価格: "1000", 入庫数: 11, 入庫方法: "在庫編集" },
    ], issue);
    控える(notes, seed.シードID, `〔商品ID-F0606-${n}A〕`, A.productId);
    控える(notes, seed.シードID, `〔商品ID-F0606-${n}B〕`, B.productId);
    const r = await 会員が注文する(browser, { 姓: "再購入確認", 名: "会員", セイ: "サイコウニュウ", メイ: "カイイン", メール: mailOf(`repurchase-f0606-${n}`), パスワード },
      [{ 商品ID: A.productId, 数量: 2 }, { 商品ID: B.productId, 数量: 1 }], seed.シードID, { 配送: "ゆうパック" });
    if (r.支払方法 !== "銀行振込") issue(`支払方法は「銀行振込」でなく「${r.支払方法}」で注文した`);
    控える(notes, seed.シードID, `〔注文番号-F0606-${接尾}〕`, r.注文番号);
    控える(notes, seed.シードID, `〔注文ID-F0606-${接尾}〕`, await 入金済みにして受注IDを読む(browser, r.注文番号));
  });
}

defineSeed("S-F06-06-OTHER-CUSTOMER-022", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const パスワード = "Pw-F0606-OTHER-022!";
  const 会員ID = await 本会員を作る(browser, { 姓: "他会員", 名: "確認", セイ: "タカイイン", メイ: "カクニン", 前半: "other-f0606-022", パスワード });
  控える(notes, seed.シードID, "〔会員ID-F0606-022B〕", 会員ID);
  const r = await 会員が注文する(browser, { 姓: "他会員", 名: "確認", セイ: "タカイイン", メイ: "カクニン", メール: mailOf("other-f0606-022"), パスワード },
    販売中の商品(1).map((商品ID) => ({ 商品ID, 数量: 1 })), seed.シードID, { 配送: "ゆうパック" });
  if (r.支払方法 !== "銀行振込") issue(`支払方法は「銀行振込」でなく「${r.支払方法}」で注文した`);
  控える(notes, seed.シードID, "〔注文番号-F0606-022B〕", r.注文番号);
  控える(notes, seed.シードID, "〔注文ID-F0606-022B〕", await 入金済みにして受注IDを読む(browser, r.注文番号));
});
