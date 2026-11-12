/**
 * M12-04 受注売上分析 CSV出力 のシードが、集計用の受注を整えるための DB 書き込み。
 * db/m12_03.ts（印つきの受注を写して作る）に、受注の店舗と「新規受付」の対応状況を足したもの。
 * 書き込み先は実行の印つきの受注だけ（db/write_adapter.ts の writeTestData が印を確かめる）。共有のマスタ・店舗は読むだけ。
 */
import { 受注を整える } from "./m05_01_order_write";
import { 受注群を作る as 印つきの受注を作る, 受注の定め as 基の定め } from "./m12_03";
import type { 作った受注 } from "./m12_08";

export type 受注の定め = Omit<基の定め, "状態"> & {
  /** 受注の店舗（印つきの店舗の店舗ID）。無ければ本店（TC東京） */
  店舗ID?: string;
};

export type データ情報 = { 年: number; 受注: 作った受注[]; 店名?: string };
const infos = new Map<string, データ情報>();
export function データを控える(シードID: string, v: データ情報): void { infos.set(シードID, v); }
export function データ情報を読む(シードID: string): データ情報 {
  const v = infos.get(シードID);
  if (!v) throw new Error(`${シードID} のデータ情報が無い（そのシードを作っていない）`);
  return v;
}

/** 基の受注を写して受注を作り、店舗と対応状況（引き渡し先のある受注以外は新規受付）を設定する */
export function 受注群を作る(基の受注ID: string, 番号: string, 定め: 受注の定め[]): 作った受注[] {
  const made = 印つきの受注を作る(基の受注ID, 番号, 定め.map(({ 店舗ID: _s, ...d }) => d), []);
  for (const [i, d] of 定め.entries()) {
    const id = made[i].受注ID;
    if (d.店舗ID) 受注を整える(id, { 店舗ID: d.店舗ID });
    // 引渡し済みの受注（移行先の受注がある元注文）は入金済みのまま。ほかは新規受付にする
    if (d.引き渡し先 === undefined) 受注を整える(id, { 対応状況: ["新規受付", "注文受領"] });
  }
  return made;
}
