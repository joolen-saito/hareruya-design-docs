/**
 * A15-07 アーキタイプ検索（デッキビルダーの API の GET /api/archetypes/{フォーマットID}）のシード。正本: cases/A15-07_seed_data.tsv
 *
 * フォーマット・アーキタイプは管理画面で「あれば使い、無ければ作る」（A15-17 のシードと同じ作り。部品は pages/admin/a15_17_setup.ts を呼ぶ）。
 * シードでの解釈（正本の外の補い。記録 review/A15-07_progress_2026-11-21_dev.md にも書く）:
 * - DISP（表示区分ID 1・名称「表示」のマスタ）: 書き込まず、ID 1が登録済みであることを DB で読んで確かめる（開発環境の名称は「公開」。名称の違いは注記に残す）。
 * - 控える番号は、画面から読む代わりに DB を名前で引いて控える（読むだけ）。
 * - 既にある場合は、当該フォーマットに紐づく（削除されていない）アーキタイプが正本どおりの件数・名前であることを DB で確かめ、違えば書き換えずに止める。
 */
import { SETUP_ADMIN } from "../config/env";
import { アーキタイプの番号, フォーマットを探す } from "../db/a15_17";
import { フォーマットのアーキタイプ, 表示区分の名称 } from "../db/a15_07";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { アーキタイプを新規登録する, フォーマットを新規登録する } from "../pages/admin/a15_17_setup";

defineSeed("S-A15-07-DISP", async ({ seed }) => {
  const 名 = 表示区分の名称(1);
  if (名 === null) throw new Error(`${seed.シードID}: 表示区分ID 1が登録されていない。共有マスタなので書き込まずに止める`);
  // 開発環境のマスタでは、ID 1の名称は「公開」（シード表は「表示」）。管理画面のアーキタイプ登録の公開状態でも「公開」を選ぶ（同じ ID 1）
  reportSeedIssue(seed.シードID, `表示区分ID 1が登録済みであることを DB で読んで確かめた（名称は「${名}」。シード表の「表示」と名称だけ違うが、アーキタイプ登録画面の公開状態で選ぶ値と同じ ID 1 として使った。書き込んでいない）`);
});

/** フォーマットを、あれば使い、無ければ登録する。番号を返す */
async function フォーマットを用意する({ browser, seed }: SeedCtx, 名日: string, 名英: string, 並び順: string, コード: string): Promise<string> {
  const 既存 = フォーマットを探す(名日);
  if (既存) { reportSeedIssue(seed.シードID, `フォーマット「${名日}」は登録済みなので、そのまま使った`); return 既存.番号; }
  let 番号 = "";
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    番号 = await フォーマットを新規登録する(page, { 名日, 名英, 並び順, コード, 統率を使う: false }, (m) => reportSeedIssue(seed.シードID, m));
  });
  return 番号;
}

/** アーキタイプを、あれば使い、無ければ登録する。番号を返す */
async function アーキタイプを用意する({ browser, seed }: SeedCtx, 名日: string, 名英: string, フォーマット番号: string): Promise<string> {
  const 既存 = アーキタイプの番号(名日, フォーマット番号);
  if (!既存) {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      await アーキタイプを新規登録する(page, { 名日, 名英, フォーマット番号 }, (m) => reportSeedIssue(seed.シードID, m));
    });
  }
  const 番号 = アーキタイプの番号(名日, フォーマット番号);
  if (!番号) throw new Error(`${seed.シードID}: アーキタイプ「${名日}」を登録したが、DB に見つからない`);
  return 番号;
}

/** 当該フォーマットのアーキタイプが、期待の名前だけ・表示区分1であること */
function 紐づきを確かめる(seed: string, フォーマット番号: string, 期待: string[]): void {
  const 実 = フォーマットのアーキタイプ(フォーマット番号);
  const 名 = 実.map((x) => x.名日).sort();
  if (名.join("｜") !== [...期待].sort().join("｜")) throw new Error(`${seed}: フォーマット ${フォーマット番号} に紐づくアーキタイプが「${名.join("」「")}」（「${期待.join("」「")}」だけのはず）。書き換えずに止める`);
  if (実.some((x) => x.表示区分 !== "1")) throw new Error(`${seed}: フォーマット ${フォーマット番号} のアーキタイプに、表示区分が1でないものがある`);
}

defineSeed("S-A15-07-DATA", async (ctx) => {
  const { notes, seed } = ctx;
  const 甲 = await フォーマットを用意する(ctx, "結合試験A1507取得用", "IT A1507 Fetch", "9001", "A1507FMT-A");
  const 乙 = await フォーマットを用意する(ctx, "結合試験A1507別形式", "IT A1507 Other", "9002", "A1507FMT-B");
  const a = await アーキタイプを用意する(ctx, "白単アグロ", "Mono White Aggro", 甲);
  const b = await アーキタイプを用意する(ctx, "青黒コントロール", "Dimir Control", 甲);
  const c = await アーキタイプを用意する(ctx, "別形式アーキタイプ", "Other Format Archetype", 乙);
  紐づきを確かめる(seed.シードID, 甲, ["白単アグロ", "青黒コントロール"]);
  紐づきを確かめる(seed.シードID, 乙, ["別形式アーキタイプ"]);
  notes.set("〔フォーマットID-A1507-共有A〕", 甲);
  notes.set("〔フォーマットID-A1507-共有B〕", 乙);
  notes.set("〔アーキタイプID-A1507-共有A〕", a);
  notes.set("〔アーキタイプID-A1507-共有B〕", b);
  notes.set("〔アーキタイプID-A1507-共有C〕", c);
  reportSeedIssue(seed.シードID, "フォーマットの番号・アーキタイプの番号は、画面の一覧から読む代わりに DB を名前で引いて控えた（読むだけ）");
});

defineSeed("S-A15-07-ONE-009", async (ctx) => {
  const { notes, seed } = ctx;
  const f = await フォーマットを用意する(ctx, "結合試験A1507-009単一形式", "dpa1507-009-fmt", "9009", "A1507F-009");
  const a = await アーキタイプを用意する(ctx, "単一アーキタイプ-A1507-009", "dpa1507-009-arch", f);
  紐づきを確かめる(seed.シードID, f, ["単一アーキタイプ-A1507-009"]);
  notes.set("〔フォーマットID-A1507-009〕", f);
  notes.set("〔アーキタイプID-A1507-009〕", a);
  reportSeedIssue(seed.シードID, "フォーマットの番号・アーキタイプの番号は、画面から読む代わりに DB を名前で引いて控えた（読むだけ）");
});
