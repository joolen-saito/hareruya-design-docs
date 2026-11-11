/**
 * F06-08 入荷待ち商品一覧の画面シード。正本: cases/F06-08_seed_data.tsv
 *
 * - 会員: フロントの会員情報登録で登録し本会員にする。管理画面の会員一覧で会員IDを控える。プレイヤーIDは、シード表はデッキ管理のプレイヤー検索で控えると定めるが、
 *   画面に出ない番号をDBの参照で読んで控える（書き込みはしない。F03-07 と同じ扱い）。メールアドレスの前半に実行の印を付ける（依頼者決定 2026-10-28）。
 * - 商品（NAME・BREADCRUMB・HOME・SINGLE）: グッズ商品CSV登録で1行取り込み、商品規格を公開にする（F03-07 の部品）。商品コード・商品名に実行の印を付ける。
 *   入荷通知: 会員でログインして商品詳細の規格の「入荷通知」を押す。通知IDは画面に出ないので、DBの参照で読んで控える。
 * - 実装しないシード: カード商品（カード管理の登録・カードの指定）や、まとめて入荷通知（カード商品の詳細にだけある）、入荷通知登録上限数（共有の設定）を要するもの。
 */
import { プレイヤーID, 規格の依頼ID } from "../db/f03_07";
import { available } from "../lib/db";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { createProducts, requestAs } from "./f03-07";
import { markedMail, 本会員を作る } from "./f06-member";

export const mailOf = (前半: string): string => markedMail(前半);
export const passwordOf = (n: string): string => `F0608-Passw0rd-${n}!`;

/** 会員を作り、会員ID・プレイヤーIDを控える。ログイン用のメール・パスワードを返す */
export async function 会員(browser: import("@playwright/test").Browser, notes: import("../lib/notes").Notes, n: string, 前半: string, 名: string, パスワード: string): Promise<{ mail: string; password: string; id: string }> {
  const id = await 本会員を作る(browser, { 姓: "晴屋", 名, セイ: "ハレヤ", メイ: "シケン", 前半, パスワード });
  notes.set(`〔会員ID-F0608-${n}〕`, id);
  const pid = available ? プレイヤーID(id) : "（DB確認なし）";
  if (!pid) throw new Error(`会員 ${前半} のプレイヤーが見つからない`);
  notes.set(`〔プレイヤーID-F0608-${n}〕`, pid);
  return { mail: mailOf(前半), password: パスワード, id };
}

// ---- 入荷通知0件の会員 ----
for (const [id, n, 前半, 名] of [
  ["S-F06-08-AUTH-002", "002", "f0608_auth-002", "認証-002"], ["S-F06-08-EMPTY-003", "003", "f0608_empty-003", "零件-003"],
  ["S-F06-08-EMPTY-004", "004", "f0608_empty-004", "零件-004"], ["S-F06-08-BACK-024", "024", "f0608_empty-024", "戻り-024"],
  ["S-F06-08-GF-EMPTYJP-030", "030", "f0608_gfjp-030", "零件-030"], ["S-F06-08-GF-EMPTYEN-031", "031", "f0608_gfen-031", "零件-031"],
] as const) {
  defineSeed(id, async ({ browser, notes }) => { await 会員(browser, notes, n, 前半, 名, passwordOf(n)); });
}
defineSeed("S-F06-08-ENV", async () => { /* 環境。最初の手順の画面が確かめる */ });

// ---- 規格単位の入荷通知が1件ある会員と商品 ----
function 通知1件(seedId: string, n: string, 前半: string, 名: string, 商品コード: string, 商品名: string, パスワード: string): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const issue = (m: string) => reportSeedIssue(seedId, m);
    const m = await 会員(browser, notes, n, 前半, 名, パスワード);
    const [p] = await createProducts(browser, seedId, [{ name: 商品名, classes: [{ code: 商品コード }] }], issue);
    notes.set(`〔商品ID-F0608-${n}〕`, p.productId);
    notes.set(`〔商品規格ID-F0608-${n}〕`, p.classIds[0]);
    await requestAs(browser, m, [{ product: p, classIndex: 0 }], seedId, issue);
    const rid = available ? 規格の依頼ID(m.id, p.classIds[0]) : "（DB確認なし）";
    if (!rid) throw new Error(`${seedId}: 通知を画面で登録したのに、DBの参照で通知が見つからない`);
    notes.set(`〔通知ID-F0608-${n}〕`, rid);
  });
}
通知1件("S-F06-08-NAME-009", "009", "f0608_name-009", "太郎-009", "F0608-NAME-009", "F0608-NAME-009", passwordOf("009"));
通知1件("S-F06-08-BREADCRUMB-010", "010", "f0608_breadcrumb-010", "現在地-010", "F0608-BREADCRUMB-010", "F0608-BREADCRUMB-010", passwordOf("010"));
通知1件("S-F06-08-HOME-011", "011", "f0608_home-011", "ホーム-011", "F0608-HOME-011", "F0608-HOME-011", passwordOf("011"));
通知1件("S-F06-08-SINGLE-032", "032", "f0608_single-032", "単品-032", "SINGLE-F0608-032", "テスト単品通知-032", "Passw0rd-F0608032");

// ---- 共有の設定・管理者・マスタ（ケースの使用シードに並ぶもの） ----
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { readArrivalMax, setArrivalMax } from "../pages/admin/f03_07_restock";
import { ensureMemberAdmin } from "../pages/admin/f06_masters";

export const ADM = { loginId: "f0608_admin", password: "Passw0rd!F0608ADM" };
defineSeed("S-F06-08-ADM", async ({ browser }) => {
  await withAdminSession(browser, SETUP_ADMIN, (page) => ensureMemberAdmin(page, "F06-08入荷通知上限設定管理者", ADM.loginId, ADM.password));
  reportSeedIssue("S-F06-08-ADM", "権限は、追加システム設定を変更できる権限として「システム管理者」にした（正本に権限の名前が無い）");
});
defineSeed("S-F06-08-MASTER", async () => {
  reportSeedIssue("S-F06-08-MASTER", "言語JP・EN とカード状態NM・SP のマスタは、手元の環境に既にある値を参照するだけで、確認の操作はしていない（シード表は無ければ登録すると定める）");
});

// 入荷通知登録上限数（共有の設定）。ケースの開始時に20にし、終わったら控えた値へ戻す
let 前の上限: string | null = null;
defineSeed("S-F06-08-LIMIT", async () => { /* 値の設定と戻しは、ケースの開始時と終了時に 上限を20にする()・上限を戻す() で行う */ });
export async function 上限を20にする(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if (前の上限 === null) 前の上限 = await readArrivalMax(page);
    await setArrivalMax(page, "20");
  });
}
export async function 上限を戻す(browser: Browser): Promise<string> {
  if (前の上限 === null) return "";
  const v = 前の上限;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { await setArrivalMax(page, v); });
  const now = await withAdminSession(browser, SETUP_ADMIN, (page) => readArrivalMax(page));
  return now === v ? "" : `入荷通知登録上限数を ${v} に戻したが、画面の値は ${now}`;
}
