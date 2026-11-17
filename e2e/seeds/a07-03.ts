/**
 * A07-03 ネット買取受注コメント更新（MTGバイヤーの API）のシード。正本: cases/A07-03_seed_data.tsv
 * 共通の作り方・読み替えは seeds/a07-common.ts。この機能だけの点:
 * - 利用者・更新担当の管理者は、決まった印つきで使い回す（rcFixed）。権限は「MTGBuyerを利用できる権限」としてシステム管理者。
 * - 受注: フロントで会員を作って申し込み、買取情報編集で「商品到着」と管理者用メモ「更新前コメント」を保存する。
 *   申込日時と更新担当者は画面で指定できないので、E2E の買取にだけ DB で書く（db/a07_03.ts）。
 * - 存在しない受注（ABSENT-006・ADM-009 の 703999006・703999009）: 0件であることを DB で数えるだけ。あれば止める（シード表の「あれば削除」は行わない。消さない）。
 * - 管理者の居ない利用者（GHOST-008）: seeds/a07-common.ts の 削除した管理者のトークン（いま登録した E2E の管理者だけを削除する）。
 * - AC（015）: 商品はグッズ商品CSV登録で、商品コード・商品名に実行の印を付けて作る。会員は正本の管理画面の会員登録でなくフロントの会員登録。
 * - 003・004（MTGBuyer の「ネット買取査定」画面を操作する）・005（固定の商品ID・商品規格ID・在庫IDを DB へ直接登録する）は実装しない（記録に理由）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import { 商品IDをコードから } from "../db/m07";
import { 受注の件数, 買取状況が一致する, 申込日時と更新担当者を設定する } from "../db/a07_03";
import { 都道府県がある } from "../db/a07_02";
import { API試験環境の注記, 会員を作って申し込む, 管理者を用意する, 削除した管理者のトークン, 決まった管理者, 買取状況を画面で保存する, 試験管理者 } from "./a07-common";

/** 管理者（シード表の名前・ログインID。パスワードはシード表の「任意の値」） */
export const A0703管理者 = (名前: string, ログインID: string, パスワード = "Passw0rd!A0703"): 試験管理者 => 決まった管理者(名前, ログインID, パスワード);
export const A0703AC管理者 = 決まった管理者("査定担当者AC03", "a0703acadm", "Passw0rd-A0703ac");
/** 管理者の居ない利用者の認証トークン（GHOST。プロセスの中だけ） */
export const A0703控え = new Map<string, string>();
/** AC の商品（実行の印つき） */
export const AC商品名 = () => rc("AC申込用サプライ甲");

defineSeed("S-A07-03-API", async ({ seed }) => { reportSeedIssue(seed.シードID, API試験環境の注記); });
defineSeed("S-A07-03-AC-API", async ({ seed }) => { reportSeedIssue(seed.シードID, API試験環境の注記); });

defineSeed("S-A07-03-MASTER", async ({ seed }) => {
  if (!買取状況が一致する("2", "商品到着")) throw new Error("買取状況のマスタに 2=商品到着 が無い");
  if (!都道府県がある("東京都")) throw new Error("都道府県のマスタに「東京都」が無い");
  reportSeedIssue(seed.シードID, "シード作成時の問題: マスタはDBへ書かず、買取状況 2=商品到着 と都道府県「東京都」があることをDBの参照で確かめた");
});
defineSeed("S-A07-03-AC-MASTER", async ({ seed }) => {
  if (!買取状況が一致する("1", "注文")) throw new Error("買取状況のマスタに 1=注文 が無い");
  reportSeedIssue(seed.シードID, "シード作成時の問題: マスタはDBへ書かず、買取状況 1=注文 があることをDBの参照で確かめた（一致したので直していない）");
});

/** 受注を作って「商品到着」「更新前コメント」にし、申込日時・更新担当者を DB で書く。〔顧客ID〕〔受注ID〕を控える */
async function 受注を作る(browser: Browser, seedId: string, notes: { set: (l: string, v: string) => void }, ラベル: string, 更新担当ID: string): Promise<void> {
  const r = await 会員を作って申し込む(browser, seedId, { メール: `a0703-${ラベル}@example.test` });
  notes.set(`〔顧客ID-A0703-${ラベル}〕`, r.会員ID);
  notes.set(`〔受注ID-A0703-${ラベル}〕`, r.番号[0]);
  await 買取状況を画面で保存する(browser, seedId, [r.番号[0]], "商品到着", "更新前コメント");
  申込日時と更新担当者を設定する(r.番号[0], r.メール, "2026-09-01 10:00:00+09", 更新担当ID);
  reportSeedIssue(seedId, `シード作成時の問題: 申込日時 2026-09-01 10:00:00（日本時間）と更新担当者（管理者ID ${更新担当ID}）は画面で指定できないので、E2E の買取 ${r.番号[0]} にだけDBで書いた`);
}

/** 利用者A・更新担当B と受注のシード（001・002・003・004・007） */
function defineAdmOrderSeed(seedId: string, n: string): void {
  defineSeed(seedId, async ({ browser, seed, notes }) => {
    notes.set(`〔管理者会員ID-A0703-${n}A〕`, await 管理者を用意する(browser, seed.シードID, A0703管理者(`A0703-${n}利用者`, `a0703-${n}a`)));
    const B = await 管理者を用意する(browser, seed.シードID, A0703管理者(`A0703-${n}更新担当`, `a0703-${n}b`));
    notes.set(`〔管理者会員ID-A0703-${n}B〕`, B);
    await 受注を作る(browser, seed.シードID, notes, n, B);
  });
}
for (const n of ["001", "002", "003", "004", "007"]) defineAdmOrderSeed(`S-A07-03-ADM-${n}`, n);

defineSeed("S-A07-03-ABSENT-006", async ({ seed }) => {
  const n = 受注の件数("703999006");
  if (n !== 0) throw new Error(`受注 703999006 が ${n} 件ある（消さないので、このケースは流せない）`);
  reportSeedIssue(seed.シードID, "シード作成時の問題: 受注 703999006 が0件であることをDBで数えて確かめた（シード表の「あれば削除」は行わない。消していない）");
});

defineSeed("S-A07-03-GHOST-008", async ({ browser, seed, notes }) => {
  const B = await 管理者を用意する(browser, seed.シードID, A0703管理者("A0703-008更新担当", "a0703-008b"));
  notes.set("〔管理者会員ID-A0703-008〕", B);
  await 受注を作る(browser, seed.シードID, notes, "008", B);
  const g = await 削除した管理者のトークン(browser, seed.シードID, "0703ghost008");
  A0703控え.set("GHOST-008", g.トークン);
  notes.setExtra("〔管理者会員ID-A0703-GHOST-008〕", g.管理者ID);
});

defineSeed("S-A07-03-ADM-009", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0703-009〕", await 管理者を用意する(browser, seed.シードID, A0703管理者("A0703-009利用者", "a0703-009a")));
  const n = 受注の件数("703999009");
  if (n !== 0) throw new Error(`受注 703999009 が ${n} 件ある（消さないので、このケースは流せない）`);
  reportSeedIssue(seed.シードID, "シード作成時の問題: 受注 703999009 が0件であることをDBで数えて確かめた（シード表の「あれば削除」は行わない。消していない）");
});

defineSeed("S-A07-03-ADM-014", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0703-014X〕", await 管理者を用意する(browser, seed.シードID, A0703管理者("A0703-014利用者X", "a0703-014x")));
  notes.set("〔管理者会員ID-A0703-014Y〕", await 管理者を用意する(browser, seed.シードID, A0703管理者("A0703-014利用者Y", "a0703-014y")));
  const Z = await 管理者を用意する(browser, seed.シードID, A0703管理者("A0703-014更新担当", "a0703-014z"));
  notes.set("〔管理者会員ID-A0703-014Z〕", Z);
  await 受注を作る(browser, seed.シードID, notes, "014", Z);
});

defineSeed("S-A07-03-AC-ADM", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0703-AC〕", await 管理者を用意する(browser, seed.シードID, A0703AC管理者));
});

defineSeed("S-A07-03-AC-PRODUCT", async ({ browser, seed }) => {
  const コード = rc("A0703-AC-PRODUCT");
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, [{ コード, 名前: AC商品名(), 基準価格: "1000", 買取価格: "100" }], (m) => reportSeedIssue(seed.シードID, m));
  });
  if (!商品IDをコードから(コード)) throw new Error(`商品コード ${コード} の商品が登録されていない`);
  reportSeedIssue(seed.シードID, `シード作成時の問題: 商品はグッズ商品CSV登録で作った（商品コード ${コード}・商品名 ${AC商品名()}。実行の印つき。買取価格100円・基準価格と販売価格1000円）。規格の部門・公開ステータスの編集は行わず、取込でできた規格のまま申し込めることを申込みで確かめる`);
});

defineSeed("S-A07-03-AC-ORDER-015", { needs: ["S-A07-03-AC-PRODUCT"] }, async ({ browser, seed, notes }) => {
  const id = 商品IDをコードから(rc("A0703-AC-PRODUCT"));
  if (!id) throw new Error("AC の商品が無い");
  const r = await 会員を作って申し込む(browser, seed.シードID, { メール: "a0703-ac001@example.test", 姓: "結合試験", 名: "A0703AC001", 商品ID: id });
  notes.set("〔顧客ID-A0703-AC001〕", r.会員ID);
  notes.set("〔受注ID-A0703-AC001〕", r.番号[0]);
});
