/**
 * A17-02 関連記事取得API（記事IDに関連する記事情報を取得）。正本: cases/A17-02_test_cases.tsv
 * 書いたケース: 007（21件の関連記事があっても limit 未指定は20件）、012〜023（要因の組合せ。共有する対象・候補記事の数・limit の指定の組）。
 * 書いていないケース（記録 review/A17-02_progress_2026-11-26.md）: 001〜006・008〜011・024・025（項目表では依頼者決定で実施不可、または別の担当の範囲）。
 * ケースの「ブラウザでGETを開く」は、API サーバーの同じパスをページで開き、その応答（状態・本文）を読む。
 * WP投稿IDは、実在の記事の投稿IDとぶつからないよう、正本の値に 800000000 を足した値で作り・開き・確かめる（seeds/a17-02.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { 関連記事を開く, 型, 応答 } from "../../pages/api/a17_02_related";
import { 組の定めの一覧 } from "../../seeds/a17-02";
import { 投稿ID } from "../../db/a17_02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 見る = (r: 応答) => note(`応答: 状態 ${r.状態}・本文 ${r.文字.length > 1500 ? `${r.文字.slice(0, 1500)}…（${r.文字.length}文字）` : r.文字}`);
const 読み替え = "WP投稿IDは実在の記事とぶつからないよう、正本の値に 800000000 を足した値で読む。関連付ける先（デッキ・アーキタイプ・カード・イベント詳細）の番号は、ほかの記事に関連付けられていない既存の行に読み替える";

type 立つ = "デッキ" | "アーキタイプ" | "カード" | "イベント詳細";
const 項目: Record<立つ, "hasSameDeck" | "hasSameArchetype" | "hasSameCard" | "hasSameEventDetail"> = {
  デッキ: "hasSameDeck", アーキタイプ: "hasSameArchetype", カード: "hasSameCard", イベント詳細: "hasSameEventDetail",
};

/** 012〜023: 共有する対象の組・候補記事の数・limit の指定が決まる1件 */
function 組のケース(番号: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const d = 組の定めの一覧[番号];
    let r!: 応答;
    await step(1, async () => { note(読み替え); r = await 関連記事を開く(page, 投稿ID(d.基準), d.limit); 見る(r); });
    await step(2, async () => { note(`応答の要素数 ${r.配列?.length ?? "（配列でない）"}`); });
    await expected(async () => {
      const a = r.配列 ?? [];
      const 立つ側 = new Set(d.対象.map((t) => 項目[t]));
      expect.soft(r.状態, "HTTPステータス").toBe(200);
      expect.soft(r.配列 !== null, "応答が配列のJSON").toBe(true);
      expect.soft(a.length, "応答の要素数（同じWP投稿IDが複数回現れず1件）").toBe(1);
      expect.soft(a.map((x) => x.wpPostId), "要素のWP投稿ID").toEqual([投稿ID(d.関連)]);
      expect.soft(new Set(a.map((x) => x.wpPostId)).size, "同じWP投稿IDが複数回現れない").toBe(a.length);
      for (const k of ["hasSameDeck", "hasSameArchetype", "hasSameCard", "hasSameEventDetail"] as const) {
        const 値 = a[0]?.[k];
        expect.soft(型(値), `${k} の型（文字型）`).toBe("文字列");
        expect.soft(値, `${k}（共有する対象なら「1」、そうでなければ「0」）`).toBe(立つ側.has(k) ? "1" : "0");
      }
    });
  };
}
caseTest("IT-A17-02-012", 組のケース("012"));
caseTest("IT-A17-02-013", 組のケース("013"));
caseTest("IT-A17-02-014", 組のケース("014"));
caseTest("IT-A17-02-015", 組のケース("015"));
caseTest("IT-A17-02-016", 組のケース("016"));
caseTest("IT-A17-02-017", 組のケース("017"));
caseTest("IT-A17-02-018", 組のケース("018"));
caseTest("IT-A17-02-019", 組のケース("019"));
caseTest("IT-A17-02-020", 組のケース("020"));
caseTest("IT-A17-02-021", 組のケース("021"));
caseTest("IT-A17-02-022", 組のケース("022"));
caseTest("IT-A17-02-023", 組のケース("023"));

// ---- 007: 21件あっても limit 未指定は20件 ----
caseTest("IT-A17-02-007", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(読み替え); r = await 関連記事を開く(page, 投稿ID(1400), null); 見る(r); });
  await step(2, async () => { note(`応答の要素数 ${r.配列?.length ?? "（配列でない）"}`); });
  await expected(async () => {
    const a = r.配列 ?? [];
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(r.配列 !== null, "応答が配列のJSON").toBe(true);
    expect.soft(a.length, "limit 未指定の応答の要素数（21件あっても20件）").toBe(20);
    expect.soft(new Set(a.map((x) => x.wpPostId)).size, "同じWP投稿IDが複数回現れない").toBe(a.length);
  });
});
