/**
 * A07-05 の追加ケース（022〜024・033〜035・047・048・050）のシード。正本: cases/A07-05_seed_data.tsv。共通の作り方は seeds/a07-05.ts・seeds/a07-common.ts。
 * 正本の「既存データを削除してから登録する」は行わない（消さない。受注は、そのケース専用に作る）。
 * - 既存の明細がある受注（022・033〜035）: カード商品を作って数量1で申し込んだ受注（明細1件）。
 * - 新しい商品規格の明細を足す受注（023・047・048・050）: 申込用のサプライ商品で申し込んだ受注と、受注に無い別のカード商品（商品規格を控える）。
 */
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { 会員を作って申し込む } from "./a07-common";
import { カード商品を作る } from "./a06-buying";
import { カードを作る, defineSupplyOrderSeed } from "./a07-05";
import { 明細を読む } from "../db/a07_06";
import { 更新日時と担当を書く } from "../db/a07_04";
import { 合計金額を書く } from "../db/a07_05b";

type 場 = SeedCtx;

/** カード商品を作り、それを数量1で申し込んだ受注（明細1件）。後処理があれば受注の番号とメールで呼ぶ */
function 明細つきの受注(seedId: string, 番号: string, 後?: (o: { 受注ID: string; メール: string }, 場: 場) => void): void {
  defineSeed(seedId, async (場) => {
    const { browser, seed, notes } = 場;
    const p = await カードを作る(browser, seed.シードID, notes, 番号, `A07-05カード-${番号}`);
    const o = await 会員を作って申し込む(browser, seed.シードID, { メール: `a0705-${番号}@example.test`, 商品ID: p.商品ID });
    const 受注ID = o.番号[0];
    notes.set(`〔受注ID-A0705-${番号}〕`, 受注ID);
    const rows = 明細を読む(受注ID).filter((m) => m.商品ID === p.商品ID);
    if (rows.length !== 1) throw new Error(`${seed.シードID}: 受注 ${受注ID} に商品 ${p.商品ID} の明細が ${rows.length} 件`);
    後?.({ 受注ID, メール: o.メール }, 場);
    reportSeedIssue(seed.シードID, `シード作成時の問題: 正本の「既存データを削除してから登録」はせず、カード商品（${p.商品コード}・買取価格1000）を作り、フロントで数量1のまま申し込んだ受注（買取 ${受注ID}・買取状況は申込直後のまま・明細1件。明細の査定金額 ${rows[0].査定金額 ?? "空"}・枚数 ${rows[0].枚数 ?? "空"} は申込みで決まった値で、正本の数量1・価格1000・800と違うことがある）を使う`);
  });
}
明細つきの受注("S-A07-05-DETAILS-022", "022");
明細つきの受注("S-A07-05-ORDER-034", "034");
明細つきの受注("S-A07-05-ORDER-035", "035");
明細つきの受注("S-A07-05-ORDER-033", "033", (o, { notes, seed }) => {
  合計金額を書く(o.受注ID, o.メール, 1000);
  更新日時と担当を書く(o.受注ID, o.メール, "2026-08-01 10:00:00+09", notes.get("〔管理者会員ID-A0705-共有〕"));
  reportSeedIssue(seed.シードID, "シード作成時の問題: 合計金額1000・更新者・更新日 2026-08-01 10:00:00 は画面で指定できないので、E2E の買取にだけ DB で書いた（持ち主は会員のメールの実行の印で確かめた）");
});

/** 申込用のサプライ商品で申し込んだ受注＋受注に無い別のカード商品 */
function サプライと別のカード(seedId: string, 番号: string): void {
  defineSeed(seedId, async ({ browser, seed, notes }) => {
    const s = await カード商品を作る(browser, seed.シードID, { 商品コード: `A0705-SUP-${番号}`, 商品名日: `A07-05申込用サプライ-${番号}`, 商品名英: `A07-05申込用サプライ-${番号}`, 基準価格: "500", 販売価格: "500", 買取価格: "500", 在庫: 0 });
    const o = await 会員を作って申し込む(browser, seed.シードID, { メール: `a0705-${番号}@example.test`, 商品ID: s.商品ID });
    notes.set(`〔受注ID-A0705-${番号}〕`, o.番号[0]);
    const p = await カードを作る(browser, seed.シードID, notes, 番号, `A07-05カード-${番号}`);
    reportSeedIssue(seed.シードID, `シード作成時の問題: 正本の「既存データを削除してから登録」はせず、申込用のサプライ商品（${s.商品コード}）で申し込んだ受注（買取 ${o.番号[0]}・サプライ品の明細1件・個別入力商品0件）と、受注に無い別のカード商品（${p.商品コード}）を用意した（受注内の当該規格の明細は0件）。サプライ商品の価格は500円（フロントのネット買取は買取価格500円以上）`);
  });
}
サプライと別のカード("S-A07-05-DETAILS-023", "023");
サプライと別のカード("S-A07-05-PURCAT-047", "047");
サプライと別のカード("S-A07-05-PURCAT-048", "048");
サプライと別のカード("S-A07-05-DETAILS-050", "050");
defineSupplyOrderSeed("S-A07-05-DETAILS-024", "024", "A07-05申込用サプライ-024");
