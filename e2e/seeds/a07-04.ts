/**
 * A07-04 ネット買取受注ステータス更新（MTGバイヤーの API）のシード。正本: cases/A07-04_seed_data.tsv
 * 共通の作り方・読み替えは seeds/a07-common.ts。この機能だけの点:
 * - 受注: フロントで会員を作って申し込み、買取状況は買取情報編集で選んで保存する。更新日時・更新担当者は E2E の買取にだけ DB で書く（db/a07_04.ts）。
 * - 「ステータス変更履歴=0件」「紐づく買取商品=0件」は、申込みと画面の保存で作られた E2E の行を消すことになる。seeds/a07-common.ts の 消してよいか を通し、
 *   消してよいの一覧に載るまでは止める（依頼者の了承が出るまで、このシードを使うケースは流さない）。ORDER-*・CBORDER-* がこれに当たる。
 * - 存在しない受注（704999004・704999005）: 0件であることを DB で数えるだけ。あれば止める（消さない）。
 * - 管理者に対応しない利用者（NOADMIN-003）: seeds/a07-common.ts の 削除した管理者のトークン（いま登録した E2E の管理者だけを削除する）。
 * - AC（024〜026）: 商品はグッズ商品CSV登録で、商品コード・商品名に実行の印。会員はフロントの会員登録。消すものは無い。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 商品IDをコードから } from "../db/m07";
import { 受注の件数 } from "../db/a07_03";
import { 明細を読む, 申込時買取価格を消す, 明細を消す } from "../db/a07_06";
import { 買取状況のマスタ, 更新日時と担当を書く, 履歴の件数, 履歴を消す } from "../db/a07_04";
import { API試験環境の注記, 会員を作って申し込む, 管理者を用意する, 削除した管理者のトークン, 決まった管理者, 買取状況を画面で保存する, 消してよいか } from "./a07-common";

export const A0704管理者 = 決まった管理者("査定担当者A", "a0704_admin", "Passw0rd!A0704");
export const A0704AC管理者 = 決まった管理者("査定担当者AC04", "a0704acadm", "Passw0rd-A0704ac");
export const A0704控え = new Map<string, string>();
export const AC乙 = () => rc("AC申込用サプライ乙");
const 日時 = "2026-09-01 10:00:00+09";

defineSeed("S-A07-04-API", async ({ seed }) => { reportSeedIssue(seed.シードID, API試験環境の注記); });
defineSeed("S-A07-04-AC-API", async ({ seed }) => { reportSeedIssue(seed.シードID, API試験環境の注記); });
defineSeed("S-A07-04-ADM-A", async ({ browser, seed, notes }) => { notes.set("〔管理者会員ID-A0704-共有〕", await 管理者を用意する(browser, seed.シードID, A0704管理者)); });
defineSeed("S-A07-04-AC-ADM", async ({ browser, seed, notes }) => { notes.set("〔管理者会員ID-A0704-AC〕", await 管理者を用意する(browser, seed.シードID, A0704AC管理者)); });

const 全状況: [string, string][] = [["1", "注文"], ["2", "商品到着"], ["3", "MTGBuyer査定完了"], ["4", "査定内容承諾"], ["5", "簡易書留送付済み"], ["6", "振込依頼済み"], ["7", "振込完了"], ["8", "振込失敗"], ["9", "キャンセル済み"], ["10", "査定中"], ["11", "査定中断"], ["12", "査定再開"], ["13", "査定内容連絡済み"], ["14", "入庫済み"], ["15", "未登録在庫あり"], ["16", "入庫待ち"]];
function マスタを確かめる(seedId: string, want: [string, string][], 無い?: string): void {
  const m = 買取状況のマスタ();
  const ng = want.filter(([id, n]) => m.get(id) !== n);
  if (ng.length) throw new Error(`買取状況のマスタがシード表と違う: ${ng.map(([i, n]) => `${i}=${n}（実際 ${m.get(i) ?? "なし"}）`).join("・")}`);
  if (無い && m.has(無い)) throw new Error(`買取状況のマスタに ID ${無い} がある（無いはず）`);
  reportSeedIssue(seedId, `シード作成時の問題: マスタはDBへ書かず、買取状況 ${want.map(([i, n]) => `${i}=${n}`).join("・")}${無い ? `・ID ${無い} が無いこと` : ""}をDBの参照で確かめた`);
}
defineSeed("S-A07-04-MASTER", async ({ seed }) => { マスタを確かめる(seed.シードID, 全状況, "999"); });
defineSeed("S-A07-04-AC-MASTER", async ({ seed }) => { マスタを確かめる(seed.シードID, 全状況.filter(([i]) => ["1", "2", "10"].includes(i))); });

defineSeed("S-A07-04-TOKEN-BAD-002", async ({ seed }) => { reportSeedIssue(seed.シードID, "シード作成時の問題: 認証トークンのヘッダの値はシード表の「invalid-token」をそのまま使う（作るものは無い）"); });
defineSeed("S-A07-04-NOADMIN-003", async ({ browser, seed }) => {
  A0704控え.set("NOADMIN-003", (await 削除した管理者のトークン(browser, seed.シードID, "0704noadmin003")).トークン);
});
for (const [id, n] of [["S-A07-04-ABSENT-004", "704999004"], ["S-A07-04-ABSENT-005", "704999005"]]) {
  defineSeed(id, async ({ seed }) => {
    const c = 受注の件数(n);
    if (c !== 0) throw new Error(`受注 ${n} が ${c} 件ある（消さないので、このケースは流せない）`);
    reportSeedIssue(seed.シードID, `シード作成時の問題: 受注 ${n} が0件であることをDBで数えて確かめた（画面の一覧の検索の代わり。消していない）`);
  });
}

/** 受注を作り、買取状況を画面で保存し、更新日時・担当を DB で書き、履歴と買取商品を0件にする（消す。関所を通す） */
async function 受注を作る(browser: Browser, seedId: string, notes: { set: (l: string, v: string) => void; get: (l: string) => string }, d: { メール: string; 会員の呼び名: string; 受注の呼び名: string[]; 状況: string; 担当?: string | null }): Promise<void> {
  消してよいか(seedId, "ステータス変更履歴と紐づく買取商品を0件にすること");
  const r = await 会員を作って申し込む(browser, seedId, { メール: d.メール, 回数: d.受注の呼び名.length });
  notes.set(`〔顧客ID-A0704-${d.会員の呼び名}〕`, r.会員ID);
  d.受注の呼び名.forEach((l, i) => notes.set(`〔受注ID-A0704-${l}〕`, r.番号[i]));
  await 買取状況を画面で保存する(browser, seedId, r.番号, d.状況);
  for (const n of r.番号) {
    更新日時と担当を書く(n, r.メール, 日時, d.担当);
    for (const m of 明細を読む(n)) if (m.申込時.length) 申込時買取価格を消す(m.ID, r.メール);
    if (明細を読む(n).length) 明細を消す(n, r.メール);
    if (履歴の件数(n)) 履歴を消す(n, r.メール);
  }
  reportSeedIssue(seedId, `シード作成時の問題: 更新日時 2026-09-01 10:00:00（日本時間）${d.担当 === undefined ? "" : `・更新担当者（${d.担当 ?? "なし"}）`}は E2E の買取にだけDBで書いた。申込みと画面の保存で作られた E2E のステータス変更履歴・買取商品（と申込時買取価格）をDBで消して0件にした（消してよいの一覧に載っているときだけ）`);
}

function defineOrderSeed(seedId: string, ラベル: string, 状況: string, 担当: "共有" | "なし" | "自分" = "共有", 受注の呼び名: string[] = [ラベル], メールの頭 = "a0704-"): void {
  defineSeed(seedId, { needs: 担当 === "共有" ? ["S-A07-04-ADM-A"] : [] }, async ({ browser, seed, notes }) => {
    let 担当ID: string | null | undefined = undefined;
    if (担当 === "共有") 担当ID = notes.get("〔管理者会員ID-A0704-共有〕");
    if (担当 === "自分") {
      担当ID = await 管理者を用意する(browser, seed.シードID, 決まった管理者(`査定担当者A0704CB${ラベル}`, `a0704cb${ラベル}`, "Passw0rd!A0704CB"));
      notes.set(`〔管理者会員ID-A0704-${ラベル}〕`, 担当ID);
    }
    await 受注を作る(browser, seed.シードID, notes, { メール: `${メールの頭}${ラベル}@example.test`, 会員の呼び名: ラベル, 受注の呼び名, 状況, 担当: 担当ID });
  });
}
for (const n of ["001", "002", "003", "009", "010"]) defineOrderSeed(`S-A07-04-ORDER-ARRIVAL-${n}`, n, "商品到着");
defineOrderSeed("S-A07-04-ORDER-ARRIVAL-QUERY-022", "022", "商品到着");
for (const n of ["012", "013"]) defineOrderSeed(`S-A07-04-ORDER-COMPLETE-${n}`, n, "MTGBuyer査定完了");
defineOrderSeed("S-A07-04-ORDER-COMPLETE-PRIORITY-023", "023", "MTGBuyer査定完了");
defineOrderSeed("S-A07-04-ORDERS-FORBIDDEN-011", "011", "商品到着", "共有", "ABCDEFGHI".split("").map((c) => `011${c}`));
defineOrderSeed("S-A07-04-CBORDER-033", "033", "査定中", "共有", ["033"], "a0704-cb");
defineOrderSeed("S-A07-04-CBORDER-037", "037", "査定中", "自分", ["037"], "a0704-cb");
defineOrderSeed("S-A07-04-CBORDER-043", "043", "査定再開", "自分", ["043"], "a0704-cb");
defineOrderSeed("S-A07-04-CBORDER-046", "046", "査定再開", "共有", ["046"], "a0704-cb");
for (const n of ["047"]) defineOrderSeed(`S-A07-04-CBORDER-${n}`, n, "査定中断", "なし", [n], "a0704-cb");
for (const n of ["048", "049", "050"]) defineOrderSeed(`S-A07-04-CBORDER-${n}`, n, "MTGBuyer査定完了", "なし", [n], "a0704-cb");

defineSeed("S-A07-04-AC-PRODUCT", async ({ browser, seed }) => {
  const コード = rc("A0704-AC-PRODUCT");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, [{ コード, 名前: AC乙(), 基準価格: "1000", 買取価格: "500" }], (m) => reportSeedIssue(seed.シードID, m));
  });
  if (!商品IDをコードから(コード)) throw new Error(`商品コード ${コード} の商品が登録されていない`);
  reportSeedIssue(seed.シードID, `シード作成時の問題: 商品はグッズ商品CSV登録で作った（商品コード ${コード}・商品名 ${AC乙()}。実行の印つき。買取価格500円。シード表の値と違うことがあるが、フロントのネット買取は買取価格500円以上の商品でないと申し込めないため・期待結果は受注のステータスだけを見るので効かない）`);
});
for (const [id, l] of [["S-A07-04-AC-ORDER-024", "AC001"], ["S-A07-04-AC-ORDER-025", "AC002"], ["S-A07-04-AC-ORDER-026", "AC003"]]) {
  defineSeed(id, { needs: ["S-A07-04-AC-PRODUCT"] }, async ({ browser, seed, notes }) => {
    const p = 商品IDをコードから(rc("A0704-AC-PRODUCT"));
    if (!p) throw new Error("AC の商品が無い");
    const r = await 会員を作って申し込む(browser, seed.シードID, { メール: `a0704-${l.toLowerCase()}@example.test`, 商品ID: p });
    notes.set(`〔顧客ID-A0704-${l}〕`, r.会員ID);
    notes.set(`〔受注ID-A0704-${l}〕`, r.番号[0]);
    A0704控え.set(`会員メール-${l}`, r.メール);
    await 買取状況を画面で保存する(browser, seed.シードID, [r.番号[0]], "商品到着");
  });
}
