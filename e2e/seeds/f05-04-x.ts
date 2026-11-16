/**
 * F05-04 ネット買取商品詳細 のシードの続き（DB での準備が要るもの）。正本: cases/F05-04_seed_data.tsv
 * - S-F05-04-CARD-017: カード商品を画面で作り（f05-04.ts と同じ作り方）、本店ECの過去1週間の販売数量 3 を DB に足す。
 *   ≪DB に足すもの≫ 画面で作った印つきの商品の規格に付く「商品の販売数」1行だけ。ケースの終わりに消し、消えたことを DB の参照で確かめる（db/f05_04_x.ts）。
 *   「他の規格を含めた本商品の1週間販売数=3」は、規格が1つ（JP-NM）だけなので同じ値になる。
 * 作らないシード（理由は PM への報告）: LEGACY-044〜046（アプリにネット買取商品詳細へ旧商品コードから入る入口が無い）・BANNER-056（販促バナーの中身と置き場が正本・アプリから決まらない）。
 */
import { defineSeed } from "./current_seed";
import { 本店ECの1週間販売数を足す, 本店ECの1週間販売数 } from "../db/f05_04_x";
import { カード商品を作る } from "./f05-04";

defineSeed("S-F05-04-CARD-017", async ({ browser, notes, seed }) => {
  const p = await カード商品を作る(browser, seed.シードID, notes, { 名英: "F0504-CARD-A-017" }, {
    名: "F0504-CARD-001-017", 言語: ["JP"], 買取: 100, 規格: { "JP-NM": { 商品コード: "F0504-CARD-001-017" } },
  });
  const 規格ID = p.規格["JP-NM"];
  if (!規格ID) throw new Error(`${seed.シードID}: 言語JP・状態NMの規格が見つからない`);
  本店ECの1週間販売数を足す(`${seed.シードID} の販売数`, 規格ID, 3);
  const 値 = 本店ECの1週間販売数(規格ID);
  if (値 !== 3) throw new Error(`${seed.シードID}: 足した販売数が読めない（${値}）`);
});
