/**
 * M14-10 フォーマット詳細 のシード その5（デッキビルダー利用の設定がフロントのマイデッキ取得へ反映される連携確認）。正本: cases/M14-10_seed_data.tsv
 * - 名称・メールには実行の印を付ける（前の実行の残りと重ならない）。値そのものを確かめるケースではない。
 * - 会員はフロントの新規会員登録で作る（依頼者決定 2026-10-31）。会員IDは管理画面の会員一覧、選手IDは参照（SELECT）で読む。
 * - 064 のマイデッキの所有選手は、プレイヤー検索の全ページから最大IDを探す代わりに、選手IDを入力欄へ直接入れる（F06-16 のシードと同じ補い）。
 */
import { SETUP_ADMIN } from "../config/env";
import { 会員の選手ID } from "../db/f06_16";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { withAdminSession } from "../lib/session";
import { フォーマットを登録する } from "../pages/admin/m14_10_format";
import { アーキタイプを登録する } from "../pages/admin/m12_deck_seed";
import { 会員を用意する, マイデッキを登録する, 試験会員 } from "../pages/admin/f06_16_setup";
import { 受付期間内の大会を登録する } from "../pages/admin/m14_10_downstream";

/** ケースの番号 → 作った会員・日程（同じプロセスの中で、シードがケースへ渡す） */
export const 連携の会員 = new Map<string, 試験会員>();
export const 連携の日程 = new Map<string, string>();

defineSeed("S-M14-10-DOWNSTREAM-033", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const 名日 = rc("連携確認フォーマット-033");
  const 会員 = await 会員を用意する(browser, { ベース: "m1410-033" });
  連携の会員.set("033", 会員);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    notes.set("〔フォーマットID-M1410-033〕", await フォーマットを登録する(page, { 名日, 名英: rc("Integration Link Format-033"), 並び順: "70", メタ日数: "14", チェック: { DeckbuilderFlg: false } }, seed.シードID));
    const 大 = await 受付期間内の大会を登録する(page, { 名日: rc("連携イベント-033"), 名英: rc("M1410-033-Event"), フォーマット: [名日] });
    連携の日程.set("033", 大.日程ID);
    void issue;
  });
});

defineSeed("S-M14-10-DPBUILDER-064", async ({ browser, notes, seed }) => {
  const issue = (m: string) => reportSeedIssue(seed.シードID, m);
  const A名 = rc("連携確認フォーマットA-064"), B名 = rc("連携確認フォーマットB-064");
  const 会員 = await 会員を用意する(browser, { ベース: "dpm1410-064" });
  連携の会員.set("064", 会員);
  const 選手ID = 会員の選手ID(会員.会員ID);
  if (!選手ID) throw new Error(`会員 ${会員.メール} の選手が見つからない`);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    notes.set("〔フォーマットID-M1410-064A〕", await フォーマットを登録する(page, { 名日: A名, 名英: rc("M1410-064-FmtA"), 並び順: "70", メタ日数: "14", チェック: { DeckbuilderFlg: false } }, seed.シードID));
    notes.set("〔フォーマットID-M1410-064B〕", await フォーマットを登録する(page, { 名日: B名, 名英: rc("M1410-064-FmtB"), 並び順: "71", メタ日数: "14", チェック: { DeckbuilderFlg: false } }, seed.シードID));
    const 大 = await 受付期間内の大会を登録する(page, { 名日: rc("連携イベント-064"), 名英: rc("M1410-064-Event"), フォーマット: [A名, B名] });
    連携の日程.set("064", 大.日程ID);
    await アーキタイプを登録する(page, { 名日: rc("連携確認アーキタイプ-064"), 名英: `LinkArchetype064${rc("").replace(/[^0-9A-Za-z]/g, "")}`, フォーマット: A名 }, issue);
    await マイデッキを登録する(page, { 名: rc("連携確認マイデッキ-064"), フォーマット: A名, 選手ID, 選手名: "YAMADA TARO", メイン: "1 Island" });
  });
});
