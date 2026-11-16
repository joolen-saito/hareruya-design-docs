/**
 * M06-01 の戻しリスト・CSV の「出ず、買取一覧へ戻る」ケースが使う確かめ。
 * 遷移先のアドレスだけでなく、画面上部のエラーの文（理由）と買取一覧の画面を確かめる（赤枠が付く）。
 * 文言の根拠: 設計書 M06-01-MSG-001・002・004・005（integration_test/casegen/datapattern/units/M06-01/design.txt の 125〜128 行）。
 */
import { expect } from "../../lib/case";
import type { OtcListPage } from "../../pages/admin/m06_otc_list";

export const 一覧のアドレス = /\/otcbuyorder(\/page\/\d+)?$/;

export type エラーの理由 = "選択なし" | "データなし" | "対象外のステータス" | "権限のない店舗" | "複数店舗";

const 文言: Record<エラーの理由, { 文: RegExp; 説明: string }> = {
  選択なし: { 文: /1つ以上の買取注文情報を選択してください。/, 説明: "「1つ以上の買取注文情報を選択してください。」" },
  データなし: { 文: /対象のデータが見つかりません。/, 説明: "「対象のデータが見つかりません。」" },
  対象外のステータス: { 文: /ID: \d+ は対象外のステータスです。/, 説明: "「ID: n は対象外のステータスです。」" },
  権限のない店舗: { 文: /ID: \d+ は権限のない店舗のデータです。/, 説明: "「ID: n は権限のない店舗のデータです。」" },
  複数店舗: { 文: /複数店舗の買取情報を同時に処理することはできません。/, 説明: "「複数店舗の買取情報を同時に処理することはできません。」" },
};

/** 買取一覧へ戻り、画面上部に理由のエラーの文が出ていること（エラーの文と一覧の画面に赤枠が付く） */
export async function 一覧へ戻りエラーが出る(list: OtcListPage, 理由: エラーの理由): Promise<void> {
  const page = list.page;
  expect.soft(new URL(page.url()).pathname, "移った先の画面（買取一覧）").toMatch(一覧のアドレス);
  await expect.soft(list.上部のエラー().filter({ hasText: 文言[理由].文 }).first(), `画面上部のエラー（${文言[理由].説明}）`).toBeVisible();
  await expect.soft(list.検索フォーム(), "買取一覧の検索欄").toBeVisible();
  await expect.soft(list.検索結果の欄(), "買取一覧の検索結果").toBeVisible();
}
