/**
 * S-F06-06-MASTER（参照マスタ。作らずに、開発環境の既存のマスタを読んで確かめる）。
 * f06-06-d.ts と f06-06-orders.ts の両方に同じ ID の定義があり、形の検査が二重の定義で止まっていたので、ここに1か所でまとめた（2026-11-11。中身は f06-06-orders.ts のもの）。
 */
import * as d6 from "../db/f06_06";
import { available } from "../lib/db";
import { defineSeed, reportCurrentSeedIssue } from "./current_seed";

const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);

defineSeed("S-F06-06-MASTER", async () => {
  記す("参照マスタ（店舗・支払方法・BOステータス）は作らず、手元の環境の既存のマスタを読んで確かめた（書き換えない）");
  if (!available) return;
  const m = d6.マスタの有無();
  if (m.無い対応状況.length) throw new Error(`対応状況マスタに ${m.無い対応状況.join("・")} が無い`);
  if (m.無い支払方法.length) 記す(`支払方法 ${m.無い支払方法.join("・")} は手元の支払方法マスタに無い。購入履歴の支払方法の表示は注文が持つ値で確かめる`);
  if (m.無い店舗.length) 記す(`店舗 ${m.無い店舗.join("・")} は手元の店舗マスタに無いので、店舗マスタの先頭・2番目の店舗で代える`);
  const r = d6.対応状況のID("購入済み");
  if (r.実際の名前 !== "購入済み") 記す(`BOステータス「購入済み」は手元の対応状況マスタに同じ名前が無いので、同じ意味の「${r.実際の名前}」で代える`);
});
