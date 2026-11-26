/**
 * B02-07 ヘッダの商品検索（キーワード）の続き（014・017）のシード。正本: cases/B02-07_seed_data.tsv
 * 既存の seeds/b02-07.ts は変えず、同じ作り方（seeds/f03_index_common.ts の索引のまとめ）で、014・017 の組を別に作る
 * （商品をグッズ商品CSV登録で作り、公開・在庫1にし、フィードを送って公開側の検索に出るまで待つ）。この2組で、フィードを1回送る。
 *
 * - 014（ルールテキスト(日)）: カード詳細(登録)画面でカードを2件登録する（A のルールテキスト(日)=キーワード、B のルールテキスト(日)=別の値）。
 *   商品の「カード指定 >」で紐づける。
 * - 017（カテゴリID）: シード表のカテゴリID 207901700 は画面で決められないので、カテゴリ登録/編集画面で登録して振られたカテゴリIDを使う
 *   （検索キーワードも振られたカテゴリID。正本の外の補い）。カテゴリは、グッズ商品CSV登録が受け付けるサプライ・グッズ系統の下の子カテゴリとして
 *   カテゴリ名（実行の印つき）で作り、商品Aだけがそのカテゴリに属する。商品Bの「所属カテゴリ=なし」は、商品カテゴリが必須なので
 *   サプライ・グッズ（作ったカテゴリではない）にした（正本の外の補い）。商品ID・商品規格IDも振られた番号を控える。
 * 決め打ちの識別の値（商品コード・商品名・カード名・カテゴリ名・キーワード）には実行ごとの印（rc）を付ける。
 */
import { Page } from "@playwright/test";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { Issue, 索引の商品 } from "../pages/admin/f03_index_seed";
import { カードを登録する, 子カテゴリを登録する } from "../pages/admin/f03_02_seed_ops";
import { readGoodsRootCategoryId } from "../pages/admin/m03_23_seed_products";
import { defineSeed } from "./current_seed";
import { 索引のまとめ } from "./f03_index_common";
import "./b02-07";

let 連番 = 0;
const コレクターNo = (): string => `${RUN_MARK}y${String(++連番).padStart(2, "0")}`.slice(-16);

export const B0207b索引 = new 索引のまとめ("B02-07-b", [
  {
    名前: "S-B02-07-KW-014",
    前の準備: async (page: Page, issue: Issue) => {
      const a = await カードを登録する(page, { カード名: rc("B0207-014-CARD-A"), ルールテキスト: rc("B0207-014-RULEJPKW"), コレクターNo: コレクターNo() }, "S-B02-07-KW-014: カードA", issue);
      const b = await カードを登録する(page, { カード名: rc("B0207-014-CARD-B"), ルールテキスト: rc("B0207-014-OTHER"), コレクターNo: コレクターNo() }, "S-B02-07-KW-014: カードB", issue);
      return { カードA: a.カードID, 詳細A: a.カード詳細ID, カードB: b.カードID, 詳細B: b.カード詳細ID };
    },
    商品: (前: Record<string, string>): 索引の商品[] => [
      { 商品コード: rc("B0207-014-A"), 商品名: rc("B0207-014-NAME-A"), 価格: "100", 在庫: { 本店: 1 }, 既存のカード: { カード名: rc("B0207-014-CARD-A"), カード詳細ID: 前.詳細A, カードID: 前.カードA } },
      { 商品コード: rc("B0207-014-B"), 商品名: rc("B0207-014-NAME-B"), 価格: "100", 在庫: { 本店: 1 }, 既存のカード: { カード名: rc("B0207-014-CARD-B"), カード詳細ID: 前.詳細B, カードID: 前.カードB } },
    ],
  },
  {
    名前: "S-B02-07-KW-017",
    前の準備: async (page: Page, issue: Issue) => {
      const root = await readGoodsRootCategoryId(page);
      const id = await 子カテゴリを登録する(page, root, rc("B0207-017-CATNAME"), "S-B02-07-KW-017: カテゴリ", issue);
      return { カテゴリID: id, 親: root };
    },
    商品: (前: Record<string, string>): 索引の商品[] => [
      { 商品コード: rc("B0207-017-A"), 商品名: rc("B0207-017-NAME-A"), 価格: "100", 在庫: { 本店: 1 }, カテゴリID: 前.カテゴリID },
      { 商品コード: rc("B0207-017-B"), 商品名: rc("B0207-017-NAME-B"), 価格: "100", 在庫: { 本店: 1 } },
    ],
  },
]);

/** 組の商品の商品ID（正本の商品コードで引く） */
export function B0207bの商品ID(seedId: string, 正本の商品コード: string): string {
  return B0207b索引.作った(seedId, rc(正本の商品コード)).商品ID;
}

function 控える(seedId: string, notes: Notes, n: string, コード: string[]): void {
  コード.forEach((c, k) => {
    const p = B0207b索引.作った(seedId, rc(c));
    const l = String.fromCharCode(65 + k);
    notes.set(`〔商品ID-B0207-${n}${l}〕`, p.商品ID);
    notes.set(`〔商品規格ID-B0207-${n}${l}〕`, p.商品規格ID);
  });
}

defineSeed("S-B02-07-KW-014", { needs: ["S-B02-07-SEARCH-ENV"] }, async ({ browser, seed, notes }) => {
  await B0207b索引.用意する(browser, seed.シードID);
  控える(seed.シードID, notes, "014", ["B0207-014-A", "B0207-014-B"]);
  reportSeedIssue(seed.シードID, "シード作成時の問題（読み替え）: 検索サービスの試験環境への反映は、商品管理「ユニサーチフィード作成」の「フィードファイルを更新する」で送り、公開側の検索に出るまで待つことにした。ルールテキスト(日)はカード詳細(登録)画面のカードに入れ、商品に紐づけた。商品コード・商品名・カード名・キーワードには実行の印を付けた");
});

defineSeed("S-B02-07-KW-017", { needs: ["S-B02-07-SEARCH-ENV"] }, async ({ browser, seed, notes }) => {
  const r = await B0207b索引.用意する(browser, seed.シードID);
  控える(seed.シードID, notes, "017", ["B0207-017-A", "B0207-017-B"]);
  notes.set("〔カテゴリID-B0207-017〕", r.前.カテゴリID);
  reportSeedIssue(seed.シードID, `シード作成時の問題（読み替え）: カテゴリID 207901700 は画面で決められないので、カテゴリ登録/編集画面で登録して振られたカテゴリID ${r.前.カテゴリID} を使い、検索キーワードも同じ値にした。商品B の「所属カテゴリ=なし」は、商品カテゴリが必須なのでサプライ・グッズにした。反映は、フィードファイルを更新して送り、公開側の検索に出るまで待つことにした`);
});
