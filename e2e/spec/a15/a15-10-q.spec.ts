/**
 * A15-10 デッキ情報更新（PUT /api/deck/{デッキID}）の結果が画面へ届くこと（033: 大会デッキ登録編集のマイデッキ取得・034: 管理画面のデッキ編集）。
 * 正本: cases/A15-10_test_cases.tsv。「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザから API へ要求を送り、応答を読む。
 * 正本のマスタの名前（A15-10連携形式甲・乙など）は、共有のマスタで読み替える（シード S-A15-10-AE-REF の注記と、ケースの「正本の外の補い」）。
 */
import { test } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { デッキ編集画面 } from "../../pages/admin/m15_05_deck_edit";
import { デッキを更新する, 更新要求, 応答 } from "../../pages/api/a15_10_deck_update";
import { ログインする } from "../../pages/api/a15_18_deck_update_import";
import { DeckEntryEditPage } from "../../pages/front/f06_16_deck_entry_k";
import { 所有者の定め } from "../../seeds/a15-10";
import { 型乙の名, 型甲の名 } from "../../seeds/a15-10-q";
import "../../seeds/a15-10-q";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 読み替え = () => supplement(`正本のマスタの名前は共有のマスタで読み替えた: フォーマット「A15-10連携形式甲」=「${型甲の名}」・「A15-10連携形式乙」=「${型乙の名}」、アーキタイプ「A15-10連携型甲」=「A1510アーキタイプA」・「A15-10連携型乙」=「結合試験アーキタイプ」、カード「A15-10連携カードA」=「結合試験カードA」・「A15-10連携カードB」=「結合試験カードB」`);
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからデッキ情報更新 API（PUT /api/deck/{デッキの識別子}）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読んだ。所有者の有効なトークンは、ログインの API で受け取った（値は記録しない）";
const 番号 = (ctx: CaseCtx, 呼び名: string): string => ctx.notes.get(呼び名);
const 要点 = (r: 応答): string => `応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}`;

async function 更新を送る(ctx: CaseCtx, 持ち主: string, デッキID: string, 要求: 更新要求): Promise<応答> {
  supplement(開発者ツールの代わり);
  const 定め = 所有者の定め[持ち主];
  const { token, 応答: ログイン } = await ログインする(ctx.page, 定め.メール, 定め.パスワード);
  if (!token) throw new Error(`ログインの API がトークンを返さない（HTTP ${ログイン.ステータス} ${ログイン.本文}）`);
  const r = await デッキを更新する(ctx.page, token, デッキID, 要求);
  note(`PUT /api/deck/${デッキID}・要求 ${JSON.stringify(要求)}・${要点(r)}・本文 ${r.本文.slice(0, 300)}`);
  return r;
}
const 空白をそろえる = (s: string) => s.replace(/\s+/g, " ").trim();

caseTest("IT-A15-10-033", async (ctx) => {
  const { page, step, expected } = ctx;
  読み替え();
  const メール = 所有者の定め["AE001"].メール, パスワード = 所有者の定め["AE001"].パスワード;
  const 詳細ID = 番号(ctx, "〔イベント詳細ID-A1510-AE001〕");
  const デッキID = 番号(ctx, "〔デッキID-A1510-AE001〕");
  const カードA = Number(番号(ctx, "〔カードID-A1510-共有A〕")), カードB = Number(番号(ctx, "〔カードID-A1510-共有B〕"));
  const e = new DeckEntryEditPage(page);
  let 前: { フォーマット: string; デッキ名: string }[] = [];
  let 後: { フォーマット: string; デッキ名: string }[] = [];
  let r!: 応答;
  let メイン = "", サイド = "";
  const 取得ポップアップを開いて甲を選ぶ = async (): Promise<{ フォーマット: string; デッキ名: string }[]> => {
    await e.マイデッキ画面を開く();
    await e.ポップアップでフォーマットを選ぶ(型甲の名);
    const rows = (await e.見えているマイデッキ()).map((x) => ({ フォーマット: x.フォーマット, デッキ名: x.デッキ名 }));
    note(`マイデッキ取得用ポップアップ（フォーマット「${型甲の名}」）の表示: ${JSON.stringify(rows)}`);
    return rows;
  };
  await step(1, async () => {
    await e.ログインする(メール, パスワード);
    const st = await e.開く(詳細ID);
    expect(st, "大会デッキ登録編集画面の応答").toBeLessThan(400);
  });
  await step(2, async () => {
    前 = await 取得ポップアップを開いて甲を選ぶ();
    expect.soft(前.some((x) => x.デッキ名 === "A15-10旧デッキ-001" && x.フォーマット === 型甲の名), "手順2のポップアップにフォーマット甲・デッキ名「A15-10旧デッキ-001」のデッキが表示される").toBe(true);
    await e.ポップアップの外を押す(e.マイデッキ画面);
  });
  await step(3, async () => { note("ブラウザの開発者ツールを開く操作は、試験ブラウザから要求を送る手順4・5に含めた"); });
  await step(4, async () => {
    r = await 更新を送る(ctx, "AE001", デッキID, {
      scope_id: 1, deck_name: "A15-10新デッキ-001", instant_save_flag: true,
      cards: [{ card_id: カードA, board_id: 1, count: 2 }, { card_id: カードB, board_id: 2, count: 1 }],
    });
  });
  await step(5, async () => { note(`応答: ${要点(r)}（正本は処理結果コード200・メッセージ「Deck update success」）`); });
  await step(6, async () => {
    await e.開く(詳細ID);
    await e.マイデッキ画面を開く();
    await e.ポップアップでフォーマットを選ぶ(型甲の名);
  });
  await step(7, async () => {
    後 = (await e.見えているマイデッキ()).map((x) => ({ フォーマット: x.フォーマット, デッキ名: x.デッキ名 }));
    note(`更新後のポップアップの表示: ${JSON.stringify(後)}`);
    await e.マイデッキを選ぶ("A15-10新デッキ-001");
  });
  await step(8, async () => {
    メイン = 空白をそろえる(await e.メインボード.inputValue());
    サイド = 空白をそろえる(await e.サイドボード.inputValue());
    note(`入力欄: メインボード「${メイン}」・サイドボード「${サイド}」`);
  });
  await expected(async () => {
    expect.soft(後.some((x) => x.デッキ名 === "A15-10新デッキ-001" && x.フォーマット === 型甲の名), "ポップアップにフォーマット甲・デッキ名「A15-10新デッキ-001」のデッキが表示される").toBe(true);
    expect.soft(後.some((x) => x.デッキ名 === "A15-10旧デッキ-001"), "ポップアップに「A15-10旧デッキ-001」は表示されない").toBe(false);
    expect.soft(メイン, "選んだデッキのメインボード（2枚のカードA）").toMatch(/^2 (結合試験カードA|IT A1517 Card A)$/);
    expect.soft(サイド, "選んだデッキのサイドボード（1枚のカードB）").toMatch(/^1 (結合試験カードB|IT A1517 Card B)$/);
  });
});

caseTest("IT-A15-10-034", async (ctx) => {
  const { page, step, expected } = ctx;
  読み替え();
  const デッキID = 番号(ctx, "〔デッキID-A1510-AE002〕");
  const 型乙 = Number(番号(ctx, "〔フォーマットID-A1510-共有B〕")), 型乙のアーキ = Number(番号(ctx, "〔アーキタイプID-A1510-共有B〕"));
  const カードA = Number(番号(ctx, "〔カードID-A1510-共有A〕")), カードB = Number(番号(ctx, "〔カードID-A1510-共有B〕"));
  const 画面 = new デッキ編集画面(page);
  type 表示 = { デッキ名: string; フォーマット: string[]; アーキタイプ: string[]; 公開状態: string[]; メイン: string; サイド: string };
  const 読む = async (when: string): Promise<表示> => {
    await page.goto(adminUrl(`/deck/${デッキID}/edit`));
    await 画面.読み込みを待つ();
    const v: 表示 = {
      デッキ名: await 画面.デッキ名.inputValue(), フォーマット: await 画面.選択中(画面.フォーマット), アーキタイプ: await 画面.選択中(画面.アーキタイプ),
      公開状態: await 画面.選択中(画面.公開状態), メイン: 空白をそろえる(await 画面.メイン.inputValue()), サイド: 空白をそろえる(await 画面.サイド.inputValue()),
    };
    note(`${when}のデッキ編集画面: ${JSON.stringify(v)}`);
    return v;
  };
  let 前!: 表示, 後!: 表示, r!: 応答;
  await step(1, async () => { await loginAdmin(page, SETUP_ADMIN); });
  await step(2, async () => { 前 = await 読む("更新前"); });
  await step(3, async () => { note("ブラウザの開発者ツールを開く操作は、試験ブラウザから要求を送る手順4・5に含めた"); });
  await step(4, async () => {
    r = await 更新を送る(ctx, "AE002", デッキID, {
      scope_id: 3, deck_name: "A15-10新デッキ-002", format_id: 型乙, archetype_id: 型乙のアーキ, instant_save_flag: true,
      cards: [{ card_id: カードA, board_id: 1, count: 2 }, { card_id: カードB, board_id: 2, count: 1 }],
    });
  });
  await step(5, async () => { note(`応答: ${要点(r)}（正本は処理結果コード200・メッセージ「Deck update success」・限定公開のとき返る閲覧用トークン）。本文の閲覧用トークンの有無: ${/token|トークン/i.test(r.本文.replace(/jwt/gi, "")) ? "あり" : "不明"}（値は記録しない）`); });
  await step(6, async () => { 後 = await 読む("更新後"); });
  await expected(async () => {
    expect.soft(前.デッキ名, "更新前のデッキ名").toBe("A15-10旧デッキ-002");
    expect.soft(前.フォーマット, "更新前のフォーマット（甲）").toEqual([型甲の名]);
    expect.soft(前.アーキタイプ, "更新前のアーキタイプ（甲）").toEqual(["A1510アーキタイプA"]);
    expect.soft(前.公開状態, "更新前の公開状態").toEqual(["非公開"]);
    expect.soft([前.メイン, 前.サイド], "更新前のメインボード・サイドボードは空").toEqual(["", ""]);
    expect.soft(後.デッキ名, "更新後のデッキ名").toBe("A15-10新デッキ-002");
    expect.soft(後.フォーマット, "更新後のフォーマット（乙）").toEqual([型乙の名]);
    expect.soft(後.アーキタイプ, "更新後のアーキタイプ（乙）").toEqual(["結合試験アーキタイプ"]);
    expect.soft(後.公開状態, "更新後の公開状態").toEqual(["限定公開"]);
    expect.soft(後.メイン, "更新後のメインボード").toMatch(/^2 (結合試験カードA|IT A1517 Card A)$/);
    expect.soft(後.サイド, "更新後のサイドボード").toMatch(/^1 (結合試験カードB|IT A1517 Card B)$/);
  });
});
