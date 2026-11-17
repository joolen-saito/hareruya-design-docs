/**
 * A07-03〜A07-07（MTGバイヤーの API）のシードが共通で使う操作（シードの登録は含まない）。
 *
 * - API の試験環境: 共有の開発環境では、認証の秘密の値・署名方式・送信元IPの許可を書き換えない（API_の試験環境の注記）。
 *   このファイルには、IPの許可や秘密の値を書き換える処理・何かを消す処理は無い。
 * - 試験管理者: メンバー管理で登録し、実行をまたいで使い回す決まった印を名前・ログインIDに付ける（rcFixed。依頼者決定 2026-11-11）。
 *   所属店舗は試験支店（依頼者決定 2026-11-13。店舗は作らない）。認証トークンは管理者ログインの API で受け取る（pages/admin/a07_api.ts）。
 * - 管理者が居ない利用者のトークン（GHOST・ABSENT など）: 実行の印つきの管理者を登録し、トークンを受け取ってから、その管理者だけをメンバー管理で削除する
 *   （消すのは、このシードがいま登録した E2E の管理者だけ。管理者ID とログインID の両方で当てる）。
 * - 会員と買取: フロントの会員登録（依頼者決定 2026-10-31）で会員を作り、別のブラウザでログインし直してネット買取を申し込む。
 *   メールアドレスはシード表の値の @ の前に実行の印を付け、ドメインは E2E の受け口（@example.test）にする。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { reportSeedIssue } from "../lib/seeds";
import { rc, rcFixed } from "../lib/run_marker";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureMemberFixed, findMemberIdByLoginId } from "../pages/admin/member";
import { メンバーの編集可能店舗を外す, メンバーを削除する } from "../pages/admin/m05_20_standby";
import { 試験店舗の名前を読む, 店舗読み替えの注記 } from "../pages/admin/test_store";
import { BuyEditPage, BuyListPage } from "../pages/admin/m07_buy";
import { registerFrontMember } from "../pages/front/member_entry";
import { ログインする, 買取する商品を選ぶ, 申込む } from "../pages/front/m07_net_buy";
import { 管理者のトークン } from "../pages/admin/a07_api";
import { メールの会員ID } from "../db/a07_02";

export type 試験管理者 = { 名前: string; account: Account };

/** 決まった印つきの試験管理者（シード表の名前・ログインID・パスワード） */
export const 決まった管理者 = (名前: string, ログインID: string, パスワード: string): 試験管理者 =>
  ({ 名前: rcFixed(名前), account: { loginId: rcFixed(ログインID).toLowerCase(), password: パスワード } });

export const API試験環境の注記 = "シード作成時の問題: 共有の開発環境では、APIの認証の秘密の値・署名方式・送信元IPの許可を書き換えず（IPの許可の行を書き足さないので、消す行も無い）、環境に設定済みの値のまま使った。認証トークンは、管理者のログインIDとパスワードで管理者ログインのAPIを呼んで受け取った（シード表の試験用秘密値では作っていない）";

/** メンバー管理で試験管理者を用意し（あれば使い回し）、管理者IDを返す */
export async function 管理者を用意する(browser: Browser, seedId: string, a: 試験管理者): Promise<string> {
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 店 = await 試験店舗の名前を読む(page);
    const id = await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店.試験支店, ログインID: a.account.loginId, メールアドレス: `${a.account.loginId}@example.test`, パスワード: a.account.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店.試験支店, 編集可能店舗: [店.試験支店],
    }, (m) => reportSeedIssue(seedId, `シード作成時の問題: ${m}`));
    reportSeedIssue(seedId, `シード作成時の問題: 管理者はメンバー管理で登録した（名前「${a.名前}」・決まった印つき。所属・権限は任意の値＝システム管理者。${店舗読み替えの注記("任意", 店.試験支店, "1574")}）。あれば使い回した（管理者ID ${id}）`);
    return id;
  });
}

/**
 * 管理者の居ない利用者の認証トークン。実行の印つきの管理者をいま登録し、トークンを受け取ってから、その管理者だけを削除する。
 * 返すのは { 管理者ID, トークン }。シード表の固定の利用者ID（970707999 など）は、署名の秘密の値が無いと作れないので、削除した管理者の番号で読み替える。
 */
export async function 削除した管理者のトークン(browser: Browser, seedId: string, ラベル: string): Promise<{ 管理者ID: string; トークン: string }> {
  const a: 試験管理者 = { 名前: rc(`A07削除用${ラベル}`), account: { loginId: rc(`a07_del_${ラベル}`).toLowerCase(), password: "Passw0rd!A07Del" } };
  const id = await 管理者を用意する(browser, seedId, a);
  const トークン = await 管理者のトークン(a.account.loginId, a.account.password);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // いま登録した印つきの管理者か（ログインIDで引いた番号が、登録で得た番号と同じか）を確かめてから消す
    if ((await findMemberIdByLoginId(page, a.account.loginId, a.名前)) !== id) throw new Error(`${seedId}: 削除する管理者（管理者ID ${id}）が、いま登録した印つきの管理者と一致しない`);
    await メンバーの編集可能店舗を外す(page, id);
    await メンバーを削除する(page, id);
    if (await findMemberIdByLoginId(page, a.account.loginId, a.名前)) throw new Error(`${seedId}: 管理者ID ${id} を削除したが、まだ残っている`);
  });
  reportSeedIssue(seedId, `シード作成時の問題: 管理者の居ない利用者の認証トークンは、署名の秘密の値が無いと作れないので、実行の印つきの管理者（${a.名前}・管理者ID ${id}）をいま登録し、管理者ログインのAPIでトークンを受け取ってから、その管理者だけをメンバー管理で削除した（利用者IDはシード表の固定の番号でなく、この管理者ID）`);
  return { 管理者ID: id, トークン };
}

export const 会員のパスワード = "Passw0rd!A07Mem";
/** 会員のメールアドレス（シード表の値の @ の前に実行の印。ドメインは E2E の受け口 @example.test） */
export const A07のメール = (シード表のメール: string): string => `${rc(シード表のメール.replace(/@example\.(test|com)$/, ""))}@example.test`.toLowerCase();

export type 申込みの定め = { メール: string; 姓?: string; 名?: string; 箱数?: string[]; 回数?: number; /** 申し込む商品（省略すると既存の買取できる商品を選ぶ） */ 商品ID?: string };

/** フロントで会員を作り、別のブラウザでログインし直して申し込む。会員ID と買取番号（申込みの順）を返す */
export async function 会員を作って申し込む(browser: Browser, seedId: string, d: 申込みの定め): Promise<{ メール: string; 会員ID: string; 番号: string[] }> {
  const メール = A07のメール(d.メール);
  const 回数 = d.箱数?.length ?? d.回数 ?? 1;
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  let 会員ID: string | null = null;
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    page.setDefaultTimeout(60_000);
    await registerFrontMember(page, { 姓: d.姓 ?? "試験", 名: d.名 ?? "買取", セイ: "シケン", メイ: "カイトリ", メール, パスワード: 会員のパスワード });
    会員ID = メールの会員ID(メール);
    for (let i = 0; !会員ID && i < 6; i++) { await page.waitForTimeout(10_000); 会員ID = メールの会員ID(メール); }
  } finally { await ctx.close(); }
  if (!会員ID) throw new Error(`${seedId}: 登録した会員 ${メール} が DB に無い`);
  const 番号: string[] = [];
  const ctx2 = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx2);
    const page = await ctx2.newPage();
    page.setDefaultTimeout(60_000);
    await ログインする(page, { メール, パスワード: 会員のパスワード });
    const 商品ID = d.商品ID ?? await 買取する商品を選ぶ(page);
    for (let i = 0; i < 回数; i++) 番号.push(String(Number(await 申込む(page, 商品ID, d.箱数 ? { 箱数: d.箱数[i] } : undefined))));
  } finally { await ctx2.close(); }
  reportSeedIssue(seedId, `シード作成時の問題: 会員はフロントの会員登録で作った（メールアドレスはシード表の値に実行の印を付け、E2E の受け口のドメインにした ${メール}。そのほかの必須項目は任意の値）。顧客IDは、登録した会員のメールアドレスでDBを参照して控えた。買取は${d.商品ID ? `シードで作った商品（商品ID ${d.商品ID}）` : "既存の買取できる商品"}1点を数量1で${回数}回申し込み${d.箱数 ? `（箱数 ${d.箱数.join("・")}）` : ""}、完了画面の買取番号を控えた（${番号.join("・")}）。振込先・承諾方法などは申込みの部品の値（正本は「任意」または承諾方法の指定。API の応答には出ない）`);
  return { メール, 会員ID, 番号 };
}

/** 買取情報編集で、買取状況（と管理者用メモ）を保存する */
export async function 買取状況を画面で保存する(browser: Browser, seedId: string, 番号: string[], 状況: string, メモ?: string): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const n of 番号) {
      const l = new BuyListPage(page);
      await l.open();
      await l.買取番号を入れる(n);
      await l.検索する();
      await l.編集画面を開く(n);
      if (メモ !== undefined) await page.locator('[name="admin_purchase_detail[memo]"]').fill(メモ);
      await new BuyEditPage(page).買取状況を変えて保存する(状況);
    }
  });
  reportSeedIssue(seedId, `シード作成時の問題: 買取 ${番号.join("・")} は、買取情報編集で買取状況「${状況}」${メモ !== undefined ? `・管理者用メモ「${メモ}」` : ""}を保存した`);
}

/**
 * E2E がいま作った行を消す前の関所。消すシードの決まり（config/shared_env_delete_ok.tsv で「消してよい」）に載っていなければ止める。
 * シード表の文に「削除」の語が無くても行を消す作り（申込時買取価格を0件にする など）は、ここを通してから消す（依頼者の了承が出るまで流さない）。
 */
export function 消してよいか(seedId: string, 何を: string): void {
  const f = path.join(__dirname, "..", "config", "shared_env_delete_ok.tsv");
  const ok = fs.existsSync(f) && fs.readFileSync(f, "utf-8").split("\n").some((l) => { const c = l.split("\t"); return c[0]?.trim() === seedId && c[1]?.trim() === "消してよい"; });
  if (!ok) throw new Error(`${seedId}: ${何を}は E2E の行の削除で、消してよいの一覧に載っていない（依頼者の了承待ち）。このシードは流さない`);
}
