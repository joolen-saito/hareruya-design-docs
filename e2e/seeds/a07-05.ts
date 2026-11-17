/**
 * A07-05 ネット買取注文の査定終了処理（MTGバイヤーの API の PUT /api/admin/buyOrder/{受注ID}.json）のシード。正本: cases/A07-05_seed_data.tsv
 * 共通の作り方・読み替えは seeds/a07-common.ts。この機能だけの点（1回目は 001・002・004・005・007・011・017〜020・049・051・052 の分だけ）:
 * - カード商品: A06 と同じく、グッズ商品CSV登録＋カード指定で作る（seeds/a06-buying.ts の カード商品を作る。商品コード・商品名・カード名に実行の印。在庫は入れない）。
 * - 受注: 正本は「申込用のサプライ商品で申し込み、買取詳細画面でサプライ品の行を削除し、査定編集でカードを足す」。E2E は行を消さず、
 *   フロントで会員を作って、そのカード商品をそのまま数量1で申し込む（明細はカード商品1件・数量1・査定価格は買取価格の1000）。
 *   個別入力商品0件の受注（017〜020・049）は、正本の申込用サプライ商品で申し込み、サプライ品の行は消さずに残す（個別入力商品は0件のまま）。
 * - 画面で指定できない明細の状態（BASE-001 の状態ID 2）は、E2E の明細にだけ DB で書く（db/a07_06.ts の 明細に書く。持ち主はメールの実行の印）。
 * - 存在しない受注（799999・795051・795052）: 0件であることを数えるだけ（あれば止める。消さない）。
 * - API の試験環境（IP の許可・署名の秘密値）: 書き換えない（seeds/a07-common.ts の注記）。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { API試験環境の注記, 管理者を用意する, 会員を作って申し込む, 決まった管理者 } from "./a07-common";
import { カード商品を作る } from "./a06-buying";
import { 受注の件数 } from "../db/a07_03";
import { 買取状況のマスタ } from "../db/a07_04";
import { 明細を読む, 明細に書く } from "../db/a07_06";

export const A0705管理者 = 決まった管理者("A07-05試験管理者", "a0705_admin", "Passw0rd!A0705");

defineSeed("S-A07-05-API", async ({ seed }) => { reportSeedIssue(seed.シードID, API試験環境の注記); });
defineSeed("S-A07-05-ADM", async ({ browser, seed, notes }) => {
  notes.set("〔管理者会員ID-A0705-共有〕", await 管理者を用意する(browser, seed.シードID, A0705管理者));
});
/** マスタは書き換えない。買取状況のマスタに ID 1・2 があることを確かめるだけ（無ければ止める） */
defineSeed("S-A07-05-MASTER", async ({ seed }) => {
  const m = 買取状況のマスタ();
  for (const id of ["1", "2"]) if (!m.has(id)) throw new Error(`${seed.シードID}: 買取状況のマスタに ID ${id} が無い`);
  reportSeedIssue(seed.シードID, `シード作成時の問題: マスタは書き換えず（正本の「登録または記載値へ戻す」はしない）、買取状況のマスタに ID 1（${m.get("1")}）・2（${m.get("2")}）があることを DB で確かめた。言語・状態・Foil区分は環境に登録済みの値をそのまま使った`);
});

/** 存在しない受注の番号が0件であることを数える（あれば止める。消さない） */
function 無いことを確かめる(seedId: string, 番号: string): void {
  const n = 受注の件数(番号);
  if (n !== 0) throw new Error(`${seedId}: 受注 ${番号} が ${n} 件ある（正本は未登録。E2E は消さないので止める）`);
  reportSeedIssue(seedId, `シード作成時の問題: 受注 ${番号} が無いことを DB で数えて確かめた（正本の「表示された場合は一覧のその行の削除で消す」はしない。あれば止める）`);
}

/** カード商品（カード指定・状態 NM の規格1件・買取価格1000）を作り、商品ID・商品規格IDを控える */
async function カードを作る(browser: Parameters<typeof カード商品を作る>[0], seedId: string, notes: { set: (l: string, v: string) => void }, 番号: string, カード名: string) {
  const コード = `A0705-${番号}`;
  const p = await カード商品を作る(browser, seedId, { 商品コード: コード, 商品名日: カード名, 商品名英: カード名, カード名日: カード名, カード名英: `A0705 Test Card ${番号}`, 基準価格: "1000", 販売価格: "1000", 買取価格: "1000", 在庫: 0 });
  notes.set(`〔商品ID-A0705-${番号}〕`, p.商品ID);
  notes.set(`〔商品規格ID-A0705-${番号}〕`, p.規格ID);
  return p;
}

/** BASE-001・002・004・005・VALIDATION-011: カード商品を作り、それを数量1で申し込んだ受注（明細1件） */
function defineCardOrderSeed(seedId: string, 番号: string, カード名: string, 状態ID?: number): void {
  defineSeed(seedId, async ({ browser, seed, notes }) => {
    const p = await カードを作る(browser, seed.シードID, notes, 番号, カード名);
    const o = await 会員を作って申し込む(browser, seed.シードID, { メール: `a0705-${番号}@example.test`, 商品ID: p.商品ID });
    const 受注ID = o.番号[0];
    notes.set(`〔受注ID-A0705-${番号}〕`, 受注ID);
    const rows = 明細を読む(受注ID).filter((m) => m.商品ID === p.商品ID);
    if (rows.length !== 1) throw new Error(`${seed.シードID}: 受注 ${受注ID} に商品 ${p.商品ID} の明細が ${rows.length} 件`);
    if (状態ID !== undefined) 明細に書く(rows[0].ID, o.メール, { 状態ID });
    reportSeedIssue(seed.シードID, `シード作成時の問題: 正本は「申込用のサプライ商品で申し込み、買取詳細画面でサプライ品の行を削除し、査定編集でカード（査定価格1000・数量1）を足して保存する」。E2E は行を消さず、作ったカード商品（${p.商品コード}・買取価格1000）をフロントで数量1のまま申し込んだ（買取 ${受注ID}・買取状況は申込直後のまま。明細の査定金額 ${rows[0].査定金額 ?? "空"}・枚数 ${rows[0].枚数 ?? "空"}）${状態ID !== undefined ? `。明細の状態は画面で指定できないので、E2E の明細にだけ DB で状態ID ${状態ID} を書いた` : ""}`);
  });
}
defineCardOrderSeed("S-A07-05-BASE-001", "001", "A07-05基本カード-001", 2);
defineCardOrderSeed("S-A07-05-BASE-002", "002", "A07-05基本カード-002");
defineCardOrderSeed("S-A07-05-BASE-004", "004", "A07-05カード-004");
defineCardOrderSeed("S-A07-05-BASE-005", "005", "A07-05カード-005");
defineCardOrderSeed("S-A07-05-VALIDATION-011", "011", "A07-05カード-011");

defineSeed("S-A07-05-ABSENT-007", async ({ browser, seed, notes }) => {
  無いことを確かめる(seed.シードID, "799999");
  await カードを作る(browser, seed.シードID, notes, "007", "A07-05カード-007");
});
defineSeed("S-A07-05-ABSENT-051", async ({ seed }) => { 無いことを確かめる(seed.シードID, "795051"); });
defineSeed("S-A07-05-ABSENT-052", async ({ seed }) => { 無いことを確かめる(seed.シードID, "795052"); });

/** VALIDATION-017〜020・049: 申込用のサプライ商品で申し込んだ受注（個別入力商品0件。サプライ品の行は消さずに残す） */
function defineSupplyOrderSeed(seedId: string, 番号: string, サプライ名: string): void {
  defineSeed(seedId, async ({ browser, seed, notes }) => {
    const p = await カード商品を作る(browser, seed.シードID, { 商品コード: `A0705-SUP-${番号}`, 商品名日: サプライ名, 商品名英: サプライ名, 基準価格: "100", 販売価格: "100", 買取価格: "100", 在庫: 0 });
    const o = await 会員を作って申し込む(browser, seed.シードID, { メール: `a0705-${番号}@example.test`, 商品ID: p.商品ID });
    notes.set(`〔受注ID-A0705-${番号}〕`, o.番号[0]);
    reportSeedIssue(seed.シードID, `シード作成時の問題: 申込用のサプライ商品（${p.商品コード}）で申し込んだ（買取 ${o.番号[0]}・買取状況は申込直後のまま）。正本の「選んで買取の表でサプライ品の行を削除する」は、E2E の行を消すことになるのでしなかった（サプライ品の明細は残る。個別入力商品は0件）${番号 === "017" ? "。正本の「改名前受注ID=7511」は、ほかの受注の番号で、E2E は触らない" : ""}${番号 === "020" ? "。正本の合計金額1111・更新者・更新日は画面で指定できず、このケース（数値でない値で 400 になるか）の確かめに関わらないので書いていない" : ""}`);
  });
}
defineSupplyOrderSeed("S-A07-05-VALIDATION-017", "017", "A07-05申込用サプライ");
defineSupplyOrderSeed("S-A07-05-VALIDATION-018", "018", "A07-05申込用サプライ");
defineSupplyOrderSeed("S-A07-05-VALIDATION-019", "019", "A07-05申込用サプライ");
defineSupplyOrderSeed("S-A07-05-VALIDATION-020", "020", "A07-05申込用サプライ");
defineSupplyOrderSeed("S-A07-05-VALIDATION-049", "049", "A0705-049申込用サプライ");
