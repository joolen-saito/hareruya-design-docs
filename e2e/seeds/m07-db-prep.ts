/**
 * M07 系（M07-01・M07-03・F06-11・F06-15 など）のシードが共通で使う「画面で作れない部分を DB で整える」部品。
 * 依頼者の承認 2026-11-10「印つきデータは何でも」: E2E が画面で作った実行の印つきの買取にだけ書く（db/m07_prep.ts → lib/db_write.ts）。
 *
 * 使い方: 先に画面で印つきの会員・商品・買取を作り（申込みまで）、そのあとでここの部品を呼ぶ。
 * - 印は、その買取の会員のメールアドレス（実行の印を含む）を渡す。買取の行のメールアドレスが一致しなければ書かない。
 * - まとめて買取の明細・実在庫に使う商品は、先に画面（グッズ商品CSV登録）で印つきの商品コードで作っておく（まとめて買取用の商品を作る）。
 * - 書いたことは、いま作っているシードの注記（項目表の備考に出る）に「DBで〜を〜にした」と残す。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { reportCurrentSeedIssue } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { サプライ品を登録する } from "../pages/admin/m07_supply";
import * as prep from "../db/m07_prep";

export type { まとめての明細, 個別入力, 買取状況名 } from "../db/m07_prep";

const 記す = (m: string) => reportCurrentSeedIssue(`シード作成時の問題: ${m}`);

/** まとめて買取の明細・実在庫の行に使う商品を、グッズ商品CSV登録で作る（商品コード・商品名は渡した値。印つきで渡す） */
export async function まとめて買取用の商品を作る(browser: Browser, 商品コード: string[], issue: (m: string) => void): Promise<void> {
  if (商品コード.length === 0) return;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await サプライ品を登録する(page, 商品コード.map((c) => ({ コード: c, 名前: c, 基準価格: "1000", 買取価格: "500" })), issue);
  });
}

/** まとめて買取の明細を DB で作る（印つきの買取に紐づける） */
export function まとめて買取の明細をDBで作る(買取番号: string, 印: string, 明細: prep.まとめての明細[]): void {
  for (const m of 明細) prep.まとめて買取の明細を足す(買取番号, 印, m);
  if (明細.length) 記す(`まとめて買取の明細は画面で作れないので、DBで買取 ${買取番号} に ${明細.length} 件（${明細.map((m) => `${m.商品コード}・査定価格${m.査定価格}・数量${m.数量}・売却${m.売却}`).join(" / ")}）を作った（商品はグッズ商品CSV登録で作った印つきの商品）`);
}

/** 個別入力商品を DB で作る（印つきの買取に紐づける）。個別入力商品のIDを順に返す */
export function 個別入力商品をDBで作る(買取番号: string, 印: string, 商品: prep.個別入力[]): string[] {
  const ids = 商品.map((v) => prep.個別入力商品を足す(買取番号, 印, v));
  if (商品.length) 記す(`個別入力商品は画面で作れないので、DBで買取 ${買取番号} に ${商品.length} 件（${商品.map((v) => `${v.名前}・査定金額${v.査定金額}・数量${v.数量}・売却${v.売却}・${v.登録済みの商品コード ? `実在庫登録済み（${v.登録済みの商品コード}）` : "実在庫未登録"}`).join(" / ")}）を作った`);
  return ids;
}

/** 実在庫情報（と、求めがあれば実在庫の履歴1件）を DB で作る。実在庫のIDを返す */
export function 実在庫情報をDBで作る(買取番号: string, 印: string, v: { 商品コード: string; 数量: number; 小計: number; 履歴?: { 日時: string } }): string {
  const id = prep.実在庫情報を足す(買取番号, 印, v);
  if (v.履歴) prep.実在庫履歴を足す(買取番号, 印, id, { 変更前: null, 変更後: v.数量, 日時: v.履歴.日時 });
  記す(`実在庫情報は画面で作れないので、DBで買取 ${買取番号} に ${v.商品コード}（数量${v.数量}・小計${v.小計}）を作った${v.履歴 ? `。その実在庫履歴1件（数量${v.数量}・${v.履歴.日時}）も作った` : ""}`);
  return id;
}

/** ステータス変更履歴を、申込みなどで作られたものを消して、与えたものだけにする（空の配列なら消すだけ） */
export function ステータス変更履歴をDBで置き換える(買取番号: string, 印: string, 履歴: { 状況: prep.買取状況名; 日時: string; 変更者のログインID?: string }[]): void {
  const n = prep.ステータス変更履歴を消す(買取番号, 印);
  for (const h of 履歴) prep.ステータス変更履歴を足す(買取番号, 印, h);
  記す(`ステータス変更履歴の日時は画面で指定できないので、DBで買取 ${買取番号} の履歴 ${n} 件を消し、${履歴.length ? 履歴.map((h) => `${h.状況}（${h.日時}${h.変更者のログインID ? `・変更者 ${h.変更者のログインID}` : ""}）`).join(" / ") : "履歴なし"} にした`);
}

/** ステータス変更履歴を1件足す（ほかの履歴は残す） */
export function ステータス変更履歴をDBで足す(買取番号: string, 印: string, h: { 状況: prep.買取状況名; 日時: string; 変更者のログインID?: string }): void {
  prep.ステータス変更履歴を足す(買取番号, 印, h);
  記す(`ステータス変更履歴の日時は画面で指定できないので、DBで買取 ${買取番号} に ${h.状況}（${h.日時}）の履歴を1件足した`);
}

export function 買取依頼日をDBで設定する(買取番号: string, 印: string, 日時: string): void {
  prep.買取依頼日を設定する(買取番号, 印, 日時);
  記す(`買取依頼日は画面で指定できないので、DBで買取 ${買取番号} の買取依頼日を ${日時} にした`);
}

export function 買取状況をDBで設定する(買取番号: string, 印: string, 状況: prep.買取状況名): void {
  prep.買取状況を直接設定する(買取番号, 印, 状況);
  記す(`DBで買取 ${買取番号} の買取状況を「${状況}」にした（画面の保存を通していない）`);
}

export function 査定金額合計をDBで設定する(買取番号: string, 印: string, 金額: number): void {
  prep.査定金額合計を設定する(買取番号, 印, 金額);
  記す(`DBで買取 ${買取番号} の査定金額合計を ${金額} にした`);
}

export function 選んで買取の査定価格をDBで設定する(買取番号: string, 印: string, 商品コード: string, 査定価格: number): void {
  prep.選んで買取の査定価格を設定する(買取番号, 印, 商品コード, 査定価格);
  記す(`カードの査定価格は画面で編集できないので、DBで買取 ${買取番号} の選んで買取 ${商品コード} の査定価格を ${査定価格} にした`);
}

export function 会員の本人確認情報をDBで外す(会員ID: string, 印: string): void {
  const n = prep.会員の本人確認情報を外す(会員ID, 印);
  記す(n
    ? `DBで会員 ${会員ID} の本人確認情報（${n}件）を会員から外した（行は消さず、会員とのつながりだけを外した。会員から見た本人確認情報は0件）`
    : `会員 ${会員ID} には本人確認情報がもともと無かった（DBでは何もしていない）`);
}

// ---- M07-01（買取検索一覧）のために足した部品 ----

export function 状況の履歴をDBで入れ替える(買取番号: string, 印: string, 状況: prep.買取状況名, 日時: string[]): void {
  prep.状況の履歴を入れ替える(買取番号, 印, 状況, 日時);
  記す(`「${状況}」の履歴の日時は画面で指定できないので、DBで買取 ${買取番号} の「${状況}」の履歴を消し、${日時.length ? 日時.join(" / ") : "なし"} にした（ほかの状況の履歴は残した）`);
}

export function 箱数をDBで設定する(買取番号: string, 印: string, 箱数: number | null): void {
  prep.箱数を設定する(買取番号, 印, 箱数);
  記す(`箱数の未設定は画面で指定できないので、DBで買取 ${買取番号} の箱数を ${箱数 ?? "未設定"} にした`);
}

export function 商品規格の状態をDBで設定する(商品コード: string, 状態: string): void {
  prep.商品規格の状態を設定する(商品コード, 状態);
  記す(`DBで印つきの商品 ${商品コード} の規格の状態を ${状態} にした（グッズ商品CSV登録では状態を指定できないため）`);
}

export function 選んで買取の価格と状態をDBで設定する(買取番号: string, 印: string, 商品コード: string, 査定価格: number, 状態: string): void {
  prep.選んで買取の価格と状態を設定する(買取番号, 印, 商品コード, 査定価格, 状態);
  記す(`DBで買取 ${買取番号} の選んで買取 ${商品コード} の査定価格を ${査定価格}・状態を ${状態} にした`);
}

export function 申込単価をDBで置き換える(買取番号: string, 印: string, 商品コード: string, 単価: { 状態: string; 金額: number }[]): void {
  prep.申込単価を置き換える(買取番号, 印, 商品コード, 単価);
  記す(`申込単価は画面で指定できないので、DBで買取 ${買取番号} の ${商品コード} の申込単価を ${単価.map((t) => `${t.状態} ${t.金額}円`).join("・")} に置き換えた`);
}

export function まとめて買取商品の明細をDBで足す(買取番号: string, 印: string, v: { 査定価格: number; 数量: number; 状態: string }): void {
  prep.まとめて買取商品の明細を足す(買取番号, 印, { 査定価格: v.査定価格, 数量: v.数量, 状態の名: v.状態 });
  記す(`まとめて買取の商品の明細は画面で作れないので、DBで買取 ${買取番号} に、設定のまとめて買取の商品（${prep.まとめて買取商品の商品ID().名前}）の選んで買取の明細（査定価格${v.査定価格}・数量${v.数量}・状態${v.状態}）を足した（共有の商品は読むだけ）`);
}

export { まとめて買取商品の商品ID } from "../db/m07_prep";
export { 選んで買取の明細ID } from "../db/m07_prep";
