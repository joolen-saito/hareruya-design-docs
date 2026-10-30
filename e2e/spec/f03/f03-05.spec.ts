/**
 * F03-05 商品リコメンド。正本: cases/F03-05_test_cases.tsv
 *
 * 実装したのは、画面だけで準備できる 012・013 だけ。ほかのケースは、使用シードの投入方法に
 * 「DBへ直接」（注文・受注の投入）や外部の試験環境（決済・メール）が含まれるので実装しない
 * （記録 e2e/review/F03-05_progress_2026-10-30.md）。
 * 共有の設定（レコメンド検索期間）を書き換えるので、基盤が1本だけで流す。
 */
import { expect, CaseBody, caseTest } from "../../lib/case";
import { FrontRecommend } from "../../pages/front/f03_05_recommend";
import { productOf, restoreRecommendDays, 開始時に検索期間を30にする } from "../../seeds/f03-05";

type 見え方 = { 表示言語: string; 見出し: string; 商品の数: number; 案内の文: string; 案内の数: number; エラーや通知: string[]; 画面: string };

async function 読む(front: FrontRecommend): Promise<見え方> {
  const page = front.page;
  const 案内 = front.おすすめ商品なしの案内;
  return {
    表示言語: await front.表示言語(),
    見出し: (await front.見出し.count()) ? ((await front.見出し.first().innerText()) ?? "").trim() : "",
    商品の数: await front.商品カード.count(),
    案内の数: await 案内.count(),
    案内の文: (await 案内.count()) ? ((await 案内.first().innerText()) ?? "").trim() : "",
    エラーや通知: await front.エラーや通知の表示(),
    画面: new URL(page.url()).pathname,
  };
}

function noRecommendCase(a: { code: string; english: boolean }): CaseBody {
  return async ({ browser, page, step, expected }) => {
    const front = new FrontRecommend(page);
    const { productId } = productOf(a.code);
    let got!: 見え方;
    try {
      await 開始時に検索期間を30にする(browser);
      await step(1, async () => {
        expect(await front.商品詳細を開く("/ja", productId), "日本語表示の商品詳細の応答").toBeLessThan(400);
      });
      if (a.english) {
        await step(2, async () => {
          await front.言語を切り替える();
          expect(await front.表示言語(), "言語切替のあとの表示言語").toBe("en");
        });
      }
      await step(a.english ? 3 : 2, async () => {
        await front.枠までスクロールする();
        got = await 読む(front);
        // 枠は描画のあとに確かめる（読み込み中に数えて0件で合格にしない）
        await expect(front.枠.first(), "おすすめ商品枠").toBeVisible();
        got = await 読む(front);
      });
      await expected(async () => {
        expect.soft(got.画面, "商品詳細ページに留まっている（商品詳細のパス）").toContain(`/products/detail/${productId}`);
        expect.soft(got.商品の数, "おすすめ商品の表示数（表示しない）").toBe(0);
        expect.soft(got.案内の数, "おすすめ商品なしの案内領域の数").toBe(1);
        // 設計書の表示メッセージ F03-05-MSG-001: 日本語「表示するおすすめ商品はまだありません。」、英語「No recommended products to display.」（英語の別の確認値は「No recommended items to display yet.」）
        if (a.english) expect.soft(got.案内の文, "おすすめ商品なしの案内の文（英語表示）").toMatch(/^No recommended (products|items) to display( yet)?\.$/);
        else expect.soft(got.案内の文, "おすすめ商品なしの案内の文（日本語表示）").toBe("表示するおすすめ商品はまだありません。");
        expect.soft(got.エラーや通知, "インラインエラー・フラッシュ・トーストの表示（出ない）").toEqual([]);
      });
    } finally {
      await restoreRecommendDays(browser);
    }
  };
}

caseTest("IT-F03-05-012", noRecommendCase({ code: "BASE-ZERO-012", english: false }));
caseTest("IT-F03-05-013", noRecommendCase({ code: "BASE-ZERO-013", english: true }));
