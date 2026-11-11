/**
 * M08-05・M08-06・M08-07 のシードが共有して使う作り方（試験管理者・試験会員・注文・控える）。defineSeed は持たない。
 * - 試験管理者: メンバー管理で登録。ログインID・名前に実行の印を付ける（開発環境に同じIDの手動テスト用のメンバーがあることがある）。
 * - 試験会員: フロントの新規会員登録（seeds/f06-member.ts の 本会員を作る。メールの前半に実行の印）。会員IDは管理画面の会員一覧で控える。
 * - 注文: 任意の商品（グッズ商品CSV登録で作って本店に入庫。同じ起動の中で1つを使い回す）を会員がフロントで注文する（pages/front/m05_11_order.ts の 会員が注文する）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 会員IDをメールで, 受注ID } from "../db/m08_05_07";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { 作った商品, 商品を作って入庫する } from "../pages/admin/f04_setup";
import { ensureMember } from "../pages/admin/member";
import { 会員が注文する } from "../pages/front/m05_11_order";
import { markedMail, 本会員を作る } from "./f06-member";

/** シードの状態・属性・投入方法に出てくる呼び名だけを控える */
export function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

/** 試験管理者（システム管理者・会員管理を操作できる）を用意する */
export async function 試験管理者を用意する(browser: Browser, 名前: string, account: Account): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (stores.length === 0) throw new Error(`${名前}: メンバーに割り当てられる店舗が画面に無い`);
    await ensureMember(page, {
      名前, 所属店舗: stores[0], ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`,
      パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
    });
  });
}

export type 試験会員の定め = { 前半: string; 姓: string; 名: string; セイ: string; メイ: string; パスワード: string };
export type 作った会員 = 試験会員の定め & { 会員ID: string; メール: string };

/** 会員を作る。同じ実行の印のメールアドレスの会員が既にいれば（同じ実行の流し直し・別の起動の共有の会員）、作らずにその会員を使う */
export async function 会員を作る(browser: Browser, m: 試験会員の定め): Promise<作った会員> {
  const メール = markedMail(m.前半);
  const 既に = 会員IDをメールで(メール);
  const 会員ID = 既に || await 本会員を作る(browser, m);
  return { ...m, 会員ID, メール };
}

let 共有の商品: Promise<作った商品> | null = null;
/** 注文に使う任意の商品（同じ起動の中で1つを使い回す。在庫は多めに入庫する） */
function 注文用の商品(browser: Browser, seedId: string): Promise<作った商品> {
  if (!共有の商品) {
    const code = `M0805-ORDER-${RUN_MARK}`;
    共有の商品 = 商品を作って入庫する(browser, seedId, [{ 商品コード: code, 商品名: code, 価格: "1000", 入庫数: 30, 入庫方法: "在庫編集" }],
      (m) => reportSeedIssue(seedId, m)).then((r) => r[0]);
    共有の商品.catch(() => { 共有の商品 = null; });
  }
  return 共有の商品;
}

/** 会員がフロントで任意の商品を1点注文する。注文番号と受注IDを返す */
export async function 会員が1点注文する(browser: Browser, seedId: string, m: 作った会員): Promise<{ 注文番号: string; 受注ID: string }> {
  const p = await 注文用の商品(browser, seedId);
  const r = await 会員が注文する(browser, { 姓: m.姓, 名: m.名, セイ: m.セイ, メイ: m.メイ, メール: m.メール, パスワード: m.パスワード },
    [{ 商品ID: p.productId, 数量: 1 }], seedId, { 配送: "ゆうパック", 支払候補: ["代金引換", "銀行振込"] });
  const id = 受注ID(r.注文番号);
  if (!id) throw new Error(`${seedId}: 注文番号 ${r.注文番号} の受注が DB に無い`);
  reportSeedIssue(seedId, `注文は任意の商品（${p.商品コード}）を1点、配送方法「${r.配送方法}」・支払方法「${r.支払方法}」で行った（注文日は実施日のまま）`);
  return { 注文番号: r.注文番号, 受注ID: id };
}

export { rc };
