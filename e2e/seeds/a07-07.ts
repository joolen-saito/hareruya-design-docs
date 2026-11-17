/**
 * A07-07 個別入力商品の一覧取得（MTGバイヤーの API）のシード。正本: cases/A07-07_seed_data.tsv
 * 共通の作り方・読み替えは seeds/a07-common.ts。この機能だけの点:
 * - 個別入力商品は画面で作れないので、シード表の番号・値で E2E の買取にぶら下げる（db/a07_07.ts）。
 *   「既存試験データを削除してから登録」は行わない。同じ番号の行が前の実行の E2E の買取にあれば、今回の買取へ付け替えて値を書き直す（消さない）。
 * - GHOST（利用者ID 970707999 の管理者が居ない）: seeds/a07-common.ts の 削除した管理者のトークン で読み替える（いま登録した E2E の管理者だけを削除する）。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { API試験環境の注記, 会員を作って申し込む, 管理者を用意する, 削除した管理者のトークン, 決まった管理者, 買取状況を画面で保存する } from "./a07-common";
import { 個別入力, 個別入力商品を置く } from "../db/a07_07";

export const A0707管理者 = 決まった管理者("A07-07試験管理者", "a0707-admin", "Passw0rd!A0707");
/** 削除した管理者の認証トークン（GHOST。プロセスの中だけ） */
export const A0707控え = new Map<string, string>();

defineSeed("S-A07-07-API", async ({ seed }) => { reportSeedIssue(seed.シードID, API試験環境の注記); });

defineSeed("S-A07-07-ADM", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0707-共有〕", await 管理者を用意する(browser, seed.シードID, A0707管理者));
});

defineSeed("S-A07-07-GHOST", async ({ browser, seed, notes }) => {
  const g = await 削除した管理者のトークン(browser, seed.シードID, "0707ghost");
  A0707控え.set("GHOST", g.トークン);
  notes.setExtra("〔管理者会員ID-A0707-GHOST〕", g.管理者ID);
});

const 品 = (ID: string, 名前: string, 金額: number | null = null, 枚数: number | null = null, 売却: boolean | null = null): 個別入力 => ({ ID, 名前, 金額, 枚数, 売却 });

/** 会員を作って申し込み、〔顧客ID〕〔ネット買取受注ID〕を控え、個別入力商品を置く */
function defineOrderSeed(seedId: string, ラベル: string, d: { 受注: string[]; 箱数?: string[]; 品: 個別入力[][]; 査定中?: boolean }): void {
  defineSeed(seedId, async ({ browser, notes }) => {
    const r = await 会員を作って申し込む(browser, seedId, { メール: `a0707-${ラベル}@example.com`, 回数: d.受注.length, 箱数: d.箱数 });
    notes.set(`〔顧客ID-A0707-${ラベル}〕`, r.会員ID);
    d.受注.forEach((l, i) => notes.set(`〔ネット買取受注ID-A0707-${l}〕`, r.番号[i]));
    if (d.査定中) await 買取状況を画面で保存する(browser, seedId, [r.番号[0]], "査定中");
    const 置いた: string[] = [];
    d.品.forEach((list, i) => list.forEach((v) => { 個別入力商品を置く(r.番号[i], r.メール, v); 置いた.push(`${v.ID}→買取 ${r.番号[i]}`); }));
    if (置いた.length) reportSeedIssue(seedId, `シード作成時の問題: 個別入力商品は画面で作れないので、シード表の番号・値でDBに置いた（${置いた.join("・")}）。シード表の「既存試験データを削除してから」は行わず、同じ番号の行が前の実行の E2E の買取にあれば今回の買取へ付け替えて値を書き直した（消していない）`);
  });
}

defineOrderSeed("S-A07-07-BASIC-001", "001", { 受注: ["001"], 品: [[品("940707001", "個別A0707-001-A")]] });
defineOrderSeed("S-A07-07-SELECT-002", "002", { 受注: ["002A", "002B", "002C"], 箱数: ["1", "2", "3"],
  品: [[品("940707002", "個別A0707-002-A"), 品("930707002", "個別A0707-002-B")], [品("920707002", "個別A0707-002-C")], [品("910707002", "個別A0707-002-D")]] });
defineOrderSeed("S-A07-07-TYPES-003", "003", { 受注: ["003"], 品: [[品("940707003", "個別A0707-003-A", 1234, 2, true)]] });
defineOrderSeed("S-A07-07-VALUES-004", "004", { 受注: ["004"], 品: [[品("940707004", "個別A0707-004-A", 1234, 3, false)]] });
defineOrderSeed("S-A07-07-NULLS-005", "005", { 受注: ["005"], 品: [[品("940707005", "個別A0707-005-A")]] });
defineOrderSeed("S-A07-07-NOPROD-006", "006", { 受注: ["006A", "006B"], 箱数: ["1", "2"], 品: [[品("940707006", "個別A0707-006-A")], []] });
defineOrderSeed("S-A07-07-ZERO-007", "007", { 受注: ["007"], 品: [[]] });
defineOrderSeed("S-A07-07-ZERO-008", "008", { 受注: ["008"], 品: [[]] });
defineOrderSeed("S-A07-07-AUTH-009", "009", { 受注: ["009"], 品: [[品("940707009", "個別A0707-009-A")]] });
defineOrderSeed("S-A07-07-AUTH-010", "010", { 受注: ["010"], 品: [[品("940707010", "個別A0707-010-A")]] });
defineOrderSeed("S-A07-07-AUTH-011", "011", { 受注: ["011"], 品: [[品("940707011", "個別A0707-011-A")]] });
// 012 はシード表に商品名の定めが無い。名前は必須の列なので、他と同じ形の「個別A0707-012-A／B」を入れる（正本の外の補い）
defineOrderSeed("S-A07-07-READONLY-012", "012", { 受注: ["012"], 査定中: true, 品: [[品("940707012", "個別A0707-012-A", 1500, 2, true), 品("930707012", "個別A0707-012-B", 800, 1, false)]] });
