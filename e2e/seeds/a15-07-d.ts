/**
 * A15-07 アーキタイプ検索の 006 のシード（S-A15-07-EMPTY）。既存の seeds/a15-07.ts は変えない。正本: cases/A15-07_seed_data.tsv
 * フォーマット「結合試験A1507空形式」を、あれば使い、無ければ管理画面で登録する（A15-07 のほかのシードと同じ作り）。アーキタイプは登録しない。
 * 既にあるフォーマットに、削除されていないアーキタイプが紐づいていたら、書き換えずに止める。
 * シードでの解釈（正本の外の補い）: フォーマットコードはシード表に値が無いので「A1507FMT-C」にした。控える番号は DB を名前で引いて読む。
 */
import { SETUP_ADMIN } from "../config/env";
import { フォーマットを探す } from "../db/a15_17";
import { フォーマットのアーキタイプ } from "../db/a15_07";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { フォーマットを新規登録する } from "../pages/admin/a15_17_setup";

defineSeed("S-A15-07-EMPTY", async ({ browser, notes, seed }) => {
  const 名日 = "結合試験A1507空形式";
  let 番号: string;
  const 既存 = フォーマットを探す(名日);
  if (既存) {
    番号 = 既存.番号;
    reportSeedIssue(seed.シードID, `フォーマット「${名日}」は登録済みなので、そのまま使った`);
  } else {
    番号 = "";
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      番号 = await フォーマットを新規登録する(page, { 名日, 名英: "IT A1507 Empty", 並び順: "9003", コード: "A1507FMT-C", 統率を使う: false }, (m) => reportSeedIssue(seed.シードID, m));
    });
  }
  const 紐づき = フォーマットのアーキタイプ(番号);
  if (紐づき.length !== 0) throw new Error(`${seed.シードID}: フォーマット ${番号} に、アーキタイプが ${紐づき.length} 件紐づいている（0件のはず。書き換えずに止める）`);
  notes.set("〔フォーマットID-A1507-共有C〕", 番号);
  reportSeedIssue(seed.シードID, "フォーマットの番号は、画面から読む代わりに DB を名前で引いて控えた（読むだけ）。紐づくアーキタイプが0件であることを DB で確かめた");
});
