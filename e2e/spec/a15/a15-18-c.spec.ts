/**
 * A15-18 デッキ更新インポートの続き: 030・034・045・048・049（デッキ画像がアーキタイプの画像・統率領域カードの最新の画像になる）。正本: cases/A15-18_test_cases.tsv
 * 作り方は a15-18.spec.ts と同じ（試験ブラウザから API へ要求を送り、応答を読む。対象デッキ・アーキタイプはシードが作る）。
 * デッキ画像・アーキタイプの画像は、カード画像の番号を DB で読んで比べる。一時保存（下書き）の有無は取得の API で確かめる。
 * 書かないケース: 039・040（フロント・管理画面の大会デッキ登録の連携）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import {
  デッキの内容を読む, 公開区分の番号, カードの最新の画像の番号, 区分別に読む, 区分別の文字列,
} from "../../db/a15_18";
import { アーキタイプの画像の番号, デッキ画像の番号, カードの画像を登録日時の順に読む } from "../../db/a15_18_c";
import { 取得したデッキ名, 更新インポートする, ログインする, 応答, インポート要求 } from "../../pages/api/a15_18_deck_update_import";
import { 会員の定め } from "../../seeds/a15-18";
import { 準備の控え, 対象デッキの番号 } from "../../seeds/a15-18-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 識別子の補い = "更新の対象デッキの識別子・アーキタイプの識別子・カード画像の識別子は、シード表の固定の値でなく、シードが作ったときに振られた番号（控えた番号）を使った";
const トークンの補い = "アクセストークンは、シード表の「テスト環境の認証機能で発行する」の代わりに、シードの会員でログインの API を呼んで受け取った（値は記録しない）";
const 下書きの補い = "一時保存（下書き）の有無は、Redis を直接見る代わりに、デッキの取得の API（GET /api/deck/{識別子}。一時保存があれば「下書き」の名前が返る）で確かめた";
const 画像の補い = "デッキ画像・アーキタイプの画像は、カード画像の番号を DB で読んで比べた";

const 番号 = (ctx: CaseCtx, 呼び名: string): string => ctx.notes.get(呼び名);
const メイン = "メインボード";
const 期待 = (...x: [string, string, number][]): string[] => x.map(([カード名, 領域, 枚数]) => `デッキカード｜${領域}｜${カード名}｜${枚数}枚`).sort();

function 対象(n: string): string {
  supplement(識別子の補い);
  const id = 対象デッキの番号.get(n);
  if (!id) throw new Error(`更新の対象デッキ（${n}）の番号が控えられていない`);
  note(`更新の対象デッキの識別子: ${id}`);
  return id;
}
function 控え(n: string) {
  const c = 準備の控え.get(n);
  if (!c) throw new Error(`準備の控え（${n}）が無い`);
  return c;
}

async function トークンを受け取る(ctx: CaseCtx): Promise<string> {
  const 定め = 会員の定め["共有A"];
  const { token, 応答 } = await ログインする(ctx.page, 定め.メール, 定め.パスワード);
  supplement(トークンの補い);
  note(`ログイン: POST /api/user/login・応答 HTTP ${応答.ステータス}`);
  if (!token) throw new Error(`ログインの API がアクセストークンを返さない（HTTP ${応答.ステータス} ${応答.本文}）`);
  return token;
}

async function 更新する(ctx: CaseCtx, token: string, id: string, 要求: インポート要求, 何: string): Promise<応答> {
  const r = await 更新インポートする(ctx.page, token, id, 要求);
  note(`${何}: PUT /api/deck/import/${id}・応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 600)}`);
  return r;
}
const 要点 = (r: 応答): string => `応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}・デッキの識別子 ${JSON.stringify(r.json?.deck_id)}・解読できない行 ${JSON.stringify(r.json?.errors)}`;
const 行番号 = (r: 応答): number[] => ((r.json?.errors as unknown[]) ?? []).map(Number);

// ---------------------------------------------------------------------------
// 030 デッキ画像用カードを省略・アーキタイプを指定 → アーキタイプの画像
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-030", async (ctx) => {
  const id = 対象("030"); const c = 控え("030");
  let token = ""; let r!: 応答; let 前 = ""; let 後 = "";
  await ctx.step(1, async () => { 前 = デッキ画像の番号(id); supplement(画像の補い); note(`記録: デッキ画像のカード画像の番号 ${前}`); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx);
    r = await 更新する(ctx, token, id, {
      フォーマット: 番号(ctx, "〔フォーマットID-A1518-共有C〕"), カードリスト: ["Commander", "1 A1518-030-統率者", "Deck", "1 結合試験カードA"],
      アーキタイプ: c.アーキタイプ, 公開区分: 公開区分の番号("公開"),
    }, "デッキ画像用カードを指定せず、アーキタイプを指定した更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { 後 = デッキ画像の番号(id); note(`更新後のデッキ画像のカード画像の番号 ${後}（アーキタイプの画像 ${アーキタイプの画像の番号(c.アーキタイプ!)}）`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(前, "手順1で記録したデッキ画像（更新前デッキカード用のカードの画像）").toBe(カードの最新の画像の番号(番号(ctx, "〔カードID-A1518-共有C〕")));
    expect.soft(後, "更新後のデッキ画像がアーキタイプの画像").toBe(アーキタイプの画像の番号(c.アーキタイプ!));
    expect.soft(後 !== 前, "デッキ画像が手順1の記録から変わる").toBe(true);
    expect.soft(後 !== カードの最新の画像の番号(c.統率者のカード!), "デッキ画像が統率領域カードの画像にならない").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 034 デッキ画像用カードとアーキタイプを省略・統率領域のカードの画像が2件 → 登録日時の新しい画像
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-034", async (ctx) => {
  const id = 対象("034"); const c = 控え("034");
  let token = ""; let r!: 応答; let 前 = ""; let 後 = "";
  await ctx.step(1, async () => {
    前 = デッキ画像の番号(id); supplement(画像の補い);
    supplement("統率領域のカードの登録日時の違うカード画像2件は、シードがカード登録CSVで作った E2E のカードの画像の行だけ DB で書き足して作った");
    note(`記録: デッキ画像のカード画像の番号 ${前}・統率領域のカードの画像 ${JSON.stringify(カードの画像を登録日時の順に読む(c.統率者のカード!))}`);
  });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx);
    r = await 更新する(ctx, token, id, {
      フォーマット: 番号(ctx, "〔フォーマットID-A1518-共有C〕"), カードリスト: ["Commander", "1 A1518-034-統率者", "Deck", "1 結合試験カードA"], 公開区分: 公開区分の番号("公開"),
    }, "アーキタイプとデッキ画像用カードを指定しない更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { 後 = デッキ画像の番号(id); note(`更新後のデッキ画像のカード画像の番号 ${後}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(後, "更新後のデッキ画像が登録日時の新しいカード画像").toBe(c.新しい画像);
    expect.soft(後 !== c.古い画像, "登録日時の古いカード画像にならない").toBe(true);
    expect.soft(後 !== 前, "手順1の記録のカード画像にならない").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 045・048・049 アーキタイプの画像で決まる組合せ
// ---------------------------------------------------------------------------
type 組合せの定め = {
  n: "045" | "048" | "049"; 型: string; 下書きあり: boolean; リスト?: string[]; ステータス: 200 | 206; 行?: number[]; 期待の明細: string[];
};
function 組合せ(o: 組合せの定め) {
  return async (ctx: CaseCtx): Promise<void> => {
    const id = 対象(`CB${o.n}`); const c = 控え(`CB${o.n}`);
    let token = ""; let r!: 応答; let 前の画像 = ""; let 後の画像 = ""; let 前の下書き = false; let 後の下書き = false; let 後!: ReturnType<typeof デッキの内容を読む>;
    await ctx.step(1, async () => {
      token = await トークンを受け取る(ctx);
      前の画像 = デッキ画像の番号(id);
      前の下書き = (await 取得したデッキ名(ctx.page, token, id)).デッキ名 === "下書き";
      supplement(画像の補い); supplement(下書きの補い);
      note(`記録: デッキ画像のカード画像の番号 ${前の画像}・4区分の明細 ${JSON.stringify(区分別の文字列(区分別に読む(id)))}・一時保存 ${前の下書き ? "あり" : "なし"}`);
    });
    await ctx.step(2, async () => {
      r = await 更新する(ctx, token, id, {
        フォーマット: o.型 === "B" ? 番号(ctx, "〔フォーマットID-A1518-共有B〕") : 番号(ctx, "〔フォーマットID-A1518-共有C〕"),
        デッキ名: `A1518-CB${o.n}-更新後`, 公開区分: 公開区分の番号("公開"), アーキタイプ: c.アーキタイプ, ...(o.リスト ? { カードリスト: o.リスト } : {}),
      }, `組合せ ${o.n}`);
    });
    await ctx.step(3, async () => { note(要点(r)); });
    await ctx.step(4, async () => { 後 = デッキの内容を読む(id); 後の画像 = デッキ画像の番号(id); note(`更新後のデッキ画像のカード画像の番号 ${後の画像}（アーキタイプの画像 ${アーキタイプの画像の番号(c.アーキタイプ!)}）`); });
    await ctx.step(5, async () => { 後の下書き = (await 取得したデッキ名(ctx.page, token, id)).デッキ名 === "下書き"; note(`更新のあとの一時保存: ${後の下書き ? "あり" : "なし"}`); });
    await ctx.expected(async () => {
      expect.soft(前の下書き, `手順1の一時保存（${o.下書きあり ? "あり" : "なし"}）`).toBe(o.下書きあり);
      expect.soft(r.ステータス, "HTTP ステータス").toBe(o.ステータス);
      expect.soft(r.json?.code, "処理結果コード").toBe(o.ステータス);
      expect.soft(String(r.json?.deck_id ?? ""), "応答のデッキの識別子（更新したデッキ）").toBe(id);
      if (o.ステータス === 206) {
        expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck update success by import");
        expect.soft(行番号(r), "解読できない行の行番号").toEqual(o.行 ?? []);
      }
      expect.soft(後.明細, "デッキカード・メイビー・アトラクション・ステッカー（更新前の4区分のカードがなくなる）").toEqual(o.期待の明細);
      expect.soft(後の画像, "更新後のデッキ画像がアーキタイプの画像").toBe(アーキタイプの画像の番号(c.アーキタイプ!));
      expect.soft(後の画像 !== 前の画像, "デッキ画像が手順1の記録から変わる").toBe(true);
      expect.soft(後の下書き, "一時保存（削除される / 無いまま）").toBe(false);
    });
  };
}
const A = "結合試験カードA";
caseTest("IT-A15-18-045", 組合せ({ n: "045", 型: "B", 下書きあり: true, リスト: ["2 結合試験カードA", "1 A1518-CB045-未登録カード"], ステータス: 206, 行: [2], 期待の明細: 期待([A, メイン, 2]) }));
caseTest("IT-A15-18-048", 組合せ({ n: "048", 型: "C", 下書きあり: false, リスト: ["1 A1518-CB048-未登録カード", "Deck", "2 結合試験カードA"], ステータス: 206, 行: [1], 期待の明細: 期待([A, メイン, 2]) }));
caseTest("IT-A15-18-049", 組合せ({ n: "049", 型: "C", 下書きあり: true, ステータス: 200, 期待の明細: [] }));
