/**
 * F06-15・F06-11 のシードが共通で使う「画面で作れない部分を DB で整える」部品（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 先に画面で印つきの会員・商品・買取を作り（申込みまで）、そのあとでここの部品を呼ぶ。書き先は db/f06_prep.ts（lib/db_write.ts 経由）。
 * M07 の部品（seeds/m07-db-prep.ts）も一緒に使う。書いたことは、いま作っているシードの注記（項目表の備考に出る）に「DBで〜を〜にした」と残る。
 */
import { reportCurrentSeedIssue } from "./current_seed";
import * as prep from "../db/f06_prep";

export type { 明細の設定, 店頭の状況名 } from "../db/f06_prep";

const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);

export function 商品規格が特定できないようにDBで設定する(商品コード: string): void {
  prep.商品規格を特定できなくする(商品コード);
  記す(`商品規格が特定できない明細は画面で作れないので、DBで商品 ${商品コード} の商品規格の状態を「その他」に設定した（明細の言語・状態と一致しない）`);
}

export function 商品を論理削除済みにDBで設定する(商品コード: string): void {
  prep.商品と規格を論理削除する(商品コード);
  記す(`論理削除済みの商品は画面で作れない（商品の削除は物理削除）ので、DBで商品 ${商品コード} を廃止、その商品規格を非表示に設定した（明細との関連は残している）`);
}

export function 明細をDBで設定する(買取番号: string, 印: string, 商品コード: string, v: prep.明細の設定): void {
  prep.明細を設定する(買取番号, 印, 商品コード, v);
  const 文 = [
    v.区分 ? `区分を「${v.区分}」` : "", v.査定価格 !== undefined ? `査定価格を${v.査定価格 === null ? "未確定" : v.査定価格}` : "", v.数量 !== undefined ? `数量を${v.数量}` : "",
    v.売却 ? `売却を「${v.売却}」` : "", v.状態の定義順 ? `カード状態を定義順${v.状態の定義順}の状態` : "",
  ].filter(Boolean).join("・");
  記す(`画面で作れない明細の値は、DBで買取 ${買取番号} の明細 ${商品コード} の${文}に設定した（申込みで作られた明細を書き換えた）`);
}

export function 店頭買取をDBで設定する(店頭ID: string, 印: string, v: prep.店頭の設定): void {
  prep.店頭買取を設定する(店頭ID, 印, v);
  const 文 = [
    v.依頼日 ? `依頼日を${v.依頼日}` : "", v.成立日 ? `成立日を${v.成立日}` : "", v.査定金額合計 !== undefined ? `査定金額合計を${v.査定金額合計}` : "",
    v.状況 ? `ステータスを「${v.状況}」` : "",
  ].filter(Boolean).join("・");
  記す(`店頭買取の${文}は画面で指定できないので（申込み・保存の日時や、査定アプリ・スマレジの連携で入る値）、DBで店頭買取 ${店頭ID} に設定した`);
}

export function 店頭の明細をDBで作る(店頭ID: string, 印: string, 明細: { 商品コード: string; 査定価格: number | null; 数量: number }[]): void {
  for (const m of 明細) prep.店頭の明細を足す(店頭ID, 印, m);
  if (明細.length) 記す(`店頭買取の明細は画面で作れない（スマレジ連携でしか入らない）ので、DBで店頭買取 ${店頭ID} に ${明細.length} 件（${明細.map((m) => `${m.商品コード}・査定価格${m.査定価格 ?? "未確定"}・数量${m.数量}`).join(" / ")}）を作った`);
}

export function 店頭の個別入力をDBで作る(店頭ID: string, 印: string, 商品: { 名前: string; 査定価格: number | null; 数量: number }[]): void {
  for (const v of 商品) prep.店頭の個別入力を足す(店頭ID, 印, v);
  if (商品.length) 記す(`店頭買取の個別入力商品は画面で作れないので、DBで店頭買取 ${店頭ID} に ${商品.length} 件（${商品.map((v) => `${v.名前}・査定価格${v.査定価格 ?? "未確定"}・数量${v.数量}`).join(" / ")}）を作った`);
}
