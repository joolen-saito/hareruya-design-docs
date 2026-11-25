/**
 * A15-18 デッキ更新インポートの続き: 021（デッキ名が256文字で 400・内容と一時保存が変わらない）。正本: cases/A15-18_test_cases.tsv
 * 作り方は a15-18.spec.ts と同じ（試験ブラウザから API へ要求を送り、応答を読む。更新の対象デッキと下書きはシードが API で作る。下書きの有無は取得の API で確かめる）。
 * 書かないケース: 030・034・045・048・049（アーキタイプの画像・登録日時の違うカード画像）、039・040（フロント・管理画面の大会デッキ登録の連携）。理由は review/A15-18_progress_2026-11-26_b.md。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { デッキの内容を読む, 公開区分の番号 } from "../../db/a15_18";
import { 取得したデッキ名, 更新インポートする, ログインする } from "../../pages/api/a15_18_deck_update_import";
import { 会員の定め, 対象デッキの番号 } from "../../seeds/a15-18";
import "../../seeds/a15-18";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-A15-18-021", async (ctx) => {
  const id = 対象デッキの番号.get("021");
  if (!id) throw new Error("更新の対象デッキ（021）の番号が控えられていない");
  supplement("更新の対象デッキの識別子は、シード表の固定の値でなく、シードがデッキビルダーの登録の API で作ったときに振られた番号（控えた番号）を使った");
  supplement("一時保存（下書き）の有無は、Redis を直接見る代わりに、デッキの取得の API（GET /api/deck/{識別子}。一時保存があれば下書きの名前が返る）で確かめた");
  supplement("アクセストークンは、シードの会員でログインの API を呼んで受け取った（値は記録しない）");
  let token = ""; let 前!: ReturnType<typeof デッキの内容を読む>; let 後!: ReturnType<typeof デッキの内容を読む>;
  let 前の下書き = false; let 後の下書き = false; let status = 0; let 本文 = "";
  await ctx.step(1, async () => {
    const 定め = 会員の定め["共有A"];
    const { token: t } = await ログインする(ctx.page, 定め.メール, 定め.パスワード);
    if (!t) throw new Error("ログインの API がアクセストークンを返さない");
    token = t;
    前 = デッキの内容を読む(id);
    前の下書き = (await 取得したデッキ名(ctx.page, token, id)).デッキ名 === "下書き";
    note(`記録: デッキ名「${前.名前}」・明細 ${JSON.stringify(前.明細)}・一時保存 ${前の下書き ? "あり" : "なし"}`);
  });
  await ctx.step(2, async () => {
    const r = await 更新インポートする(ctx.page, token, id, {
      フォーマット: ctx.notes.get("〔フォーマットID-A1518-共有B〕"), デッキ名: "あ".repeat(256), 公開区分: 公開区分の番号("公開"), カードリスト: ["1 結合試験カードA"],
    });
    status = r.ステータス; 本文 = r.本文;
    note(`PUT /api/deck/import/${id}（256文字のデッキ名）・応答 HTTP ${status}・本文 ${本文.slice(0, 400)}`);
  });
  await ctx.step(3, async () => { note(`応答 HTTP ${status}`); });
  await ctx.step(4, async () => { 後 = デッキの内容を読む(id); });
  await ctx.step(5, async () => { 後の下書き = (await 取得したデッキ名(ctx.page, token, id)).デッキ名 === "下書き"; note(`更新のあとの一時保存: ${後の下書き ? "あり" : "なし"}`); });
  await ctx.expected(async () => {
    expect.soft(前の下書き, "手順1の一時保存（あり）").toBe(true);
    expect.soft(status, "HTTP ステータス").toBe(400);
    expect.soft(後.名前, "デッキ名が手順1の記録から変わらない").toBe(前.名前);
    expect.soft(後.明細, "デッキカード・メイビー・アトラクション・ステッカーが手順1の記録から変わらない").toEqual(前.明細);
    expect.soft(後, "デッキの内容が手順1の記録から変わらない").toEqual(前);
    expect.soft(後の下書き, "一時保存が残る").toBe(true);
  });
});
