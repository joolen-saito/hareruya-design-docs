/**
 * F05-02 ネット買取商品検索（フロント）の画面シードの続き（2026-11-11 追加）。正本: cases/F05-02_seed_data.tsv
 * （最初の分は seeds/f05-02.ts。依頼者の方針 2026-11-10: 画面で作る・既存データで読み替える・共有のデータは書き換えない）
 *
 * URL-004・FOIL-FRAME-005・TAG-019・ALLEMPTY-024・MIXURL-030・NOHIT-022 は、使うケース（004・005・019・024・030・022）が
 * 検索結果の商品の表示を確かめず、アドレス・応答のステータス・タグの説明文の表示だけを確かめる。そのため、
 * 商品は「画面で作る」（カード登録→グッズ商品CSV→カード指定→規格の公開→本店の在庫の入庫と承認）ところまで行い、
 * 外部の検索索引（ユニサーチ）への反映は行わない（手元に試験用索引が無く、画面で作った商品はすぐには出ない）。
 * タグ・カテゴリへの商品の所属は設定しない（共有のタグ・カテゴリの商品の関連を増やさない。ケースはアドレスを見るだけ）。
 * 商品名・商品コードには実行の印を付ける（正本の値のあとに「-印」）。検索語は正本の値のまま（前方一致で当たる）。
 *
 * 作らないシード（理由は PM への報告）: BANNED-011・TAG-013・CARRY-014・015・021・PAGING-SETTING・PAGING-017・ELIGIBILITY-018・
 * DETAIL-006・IDENTITY-007・028・LOGIC-023・DEFOP-026・TYPEAND-027・COLORONLY-029・FOIL-FRAME-008・009 の使うケースは、
 * 検索結果にその商品が出ること（外部の検索索引）を確かめるので実装しない。
 */
import { Browser, expect } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { expectSaved } from "../pages/admin/common";
import { カート用商品を作る, 作った商品 } from "../pages/admin/f02_03_cart_setup";
import { 商品名を含む商品の数 } from "../pages/admin/f05_02_setup";
import { TagPage } from "../pages/admin/m03_13_tag";

type 警告 = (w: string) => void;
type 商品の定義 = { コード: string; 名: string; Foil: string };

/** シード表の呼び名（商品ID・商品規格ID・カードID）を、作った商品から控える。末尾の英字（A・B）は商品の並びの番号、無ければ1件目 */
function 商品の呼び名を控える(seedId: string, notes: Notes, made: 作った商品[]): void {
  const seed = getSeed(seedId);
  for (const label of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
    if (notes.has(label)) continue;
    const m = /^〔(商品ID|商品規格ID|カードID)-F0502-(\d+)([A-Z]?)〕$/.exec(label);
    if (!m) throw new Error(`${seedId}: 呼び名 ${label} の形が読めない`);
    const p = made[m[3] ? m[3].charCodeAt(0) - 65 : 0];
    if (!p) throw new Error(`${seedId}: ${label} に当たる商品を作っていない`);
    const v = m[1] === "商品ID" ? p.商品ID : m[1] === "商品規格ID" ? p.規格ID : p.カードID;
    if (!v) throw new Error(`${seedId}: ${label} に当たる番号が控えられていない`);
    notes.set(label, v);
  }
}

async function 商品を作って控える(ctx: { browser: Browser; notes: Notes }, seedId: string, defs: 商品の定義[]): Promise<作った商品[]> {
  const issue: 警告 = (m) => reportSeedIssue(seedId, m);
  const made = await カート用商品を作る(ctx.browser, seedId, defs.map((d) => ({
    商品コード: rc(d.コード), 商品名: rc(d.名), 価格: "100", カード: { Foil: d.Foil }, 在庫: 1,
  })), issue);
  issue(`シード作成時の問題（読み替え）: 商品（${made.map((p) => `${p.商品コード}・商品ID ${p.商品ID}`).join("、")}）は、カード登録・グッズ商品CSV・カード指定・本店の在庫1の入庫と承認まで画面で作った。外部の検索索引への反映（ユニサーチフィード作成）と、タグ・カテゴリへの所属は行っていない。買取価格は取込の値（100）`);
  商品の呼び名を控える(seedId, ctx.notes, made);
  return made;
}

defineSeed("S-F05-02-URL-004", { needs: ["S-F05-02-MASTERS"] }, async (c) => {
  await 商品を作って控える(c, "S-F05-02-URL-004", [{ コード: "URL-001-004", 名: "URL-001-004", Foil: "なし" }]);
});
defineSeed("S-F05-02-FOIL-FRAME-005", async (c) => {
  await 商品を作って控える(c, "S-F05-02-FOIL-FRAME-005", [
    { コード: "FOIL-SPECIAL-005", 名: "F0502-FOIL-005", Foil: "特殊" },
    { コード: "FOIL-OTHER-005", 名: "F0502-FOIL-005", Foil: "通常" },
  ]);
});
defineSeed("S-F05-02-ALLEMPTY-024", async (c) => {
  await 商品を作って控える(c, "S-F05-02-ALLEMPTY-024", [{ コード: "ALLEMPTY-024", 名: "F0502-ALLEMPTY-024", Foil: "なし" }]);
});
defineSeed("S-F05-02-MIXURL-030", { needs: ["S-F05-02-MASTERS"] }, async (c) => {
  await 商品を作って控える(c, "S-F05-02-MIXURL-030", [{ コード: "F0502-MIX-030", 名: "F0502-MIX-030", Foil: "なし" }]);
});

/** タグの説明文（ケース019が表示を確かめる値。正本の値のまま） */
export const F0502_タグ説明 = "F0502-TAG-DESC-019";

defineSeed("S-F05-02-TAG-019", async (c) => {
  const seedId = "S-F05-02-TAG-019";
  const issue: 警告 = (m) => reportSeedIssue(seedId, m);
  // タグは固定の試験用の名称（正本の値 T-F0502-019）。あれば説明文を確かめて使い、無いときだけ作る（実行ごとに増やさない）
  const tagId = await withAdminSession(c.browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const tag = new TagPage(page);
    await tag.showFirstPageWith("12000");
    const hit = (await tag.allRows()).filter((r) => r.名称日 === "T-F0502-019");
    if (hit.length > 1) throw new Error(`${seedId}: タグ「T-F0502-019」が一覧に ${hit.length} 件ある（1件のはず）`);
    if (hit.length === 1) {
      await tag.openEdit(hit[0].ID);
      await tag.openOtherSettings();
      const v = await tag.inputValues();
      expect(v.フリーエリア日, `${seedId}: 既にあるタグ「T-F0502-019」のフリーエリア(日)`).toBe(F0502_タグ説明);
      issue("シード作成時の問題（読み替え）: タグ「T-F0502-019」は前から有るので使い回した（説明文を確かめた）");
      return hit[0].ID;
    }
    await tag.openNew();
    await tag.openOtherSettings();
    await tag.fill({ 名称日: "T-F0502-019", 名称英: "T-F0502-019", 並び順: "9998", フリーエリア日: F0502_タグ説明 });
    const r = await tag.pressRegister();
    if (!r.sent) throw new Error(`${seedId}: タグの登録が入力チェックで止まった（${r.止めた項目.join(" / ")}）`);
    await expectSaved(page, `${seedId}: タグ「T-F0502-019」の登録`);
    const m = new URL(page.url()).pathname.match(/\/product\/tag\/(\d+)$/);
    if (!m) throw new Error(`${seedId}: タグの登録後にタグの編集画面へ移らない（${page.url()}）`);
    issue("シード作成時の問題（読み替え）: タグ「T-F0502-019」を画面で作った（固定の試験用の名称。次からは使い回す）。フリーエリア(日)に説明文を入れた");
    return m[1];
  });
  c.notes.set("〔タグID-F0502-019〕", tagId);
  await 商品を作って控える(c, seedId, [{ コード: "TAG-DISPLAY-019", 名: "TAG-DISPLAY-019", Foil: "なし" }]);
});

defineSeed("S-F05-02-NOHIT-022", async ({ browser, seed }) => {
  // 既存の商品は消さない。商品名に「F0502-NOHIT」を含む商品が1件も無いことを確かめ、あれば止める
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const n = await 商品名を含む商品の数(page, "F0502-NOHIT");
    if (n !== 0) throw new Error(`${seed.シードID}: 商品名に「F0502-NOHIT」を含む商品が ${n} 件ある（0件のはず）。既存の商品は消さないので止める`);
  });
  reportSeedIssue(seed.シードID, "シード作成時の問題（読み替え）: 商品の削除と、試験用索引での件数の確認（ユニサーチフィード作成）は行わない。商品管理の商品一覧で、商品名に「F0502-NOHIT」を含む商品が0件であることを確かめただけ");
});
