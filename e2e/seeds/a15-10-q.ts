/**
 * A15-10 デッキ情報更新の「画面へ届く」ケース（033・034）のシード。正本: cases/A15-10_seed_data.tsv
 *  - S-A15-10-AE-ENV: 環境。管理画面にログインでき、デッキ情報更新APIへ試験ブラウザから要求できる（設定は書き換えない）
 *  - S-A15-10-AE-REF: マスタ。A15-10 の共有のマスタ（seeds/a15-10.ts の S-A15-10-MASTERS が A15-18 のマスタを写して作る）で読み替える
 *      フォーマット「A15-10連携形式甲」→「更新前フォーマット」・「A15-10連携形式乙」→「結合試験フォーマット」、アーキタイプ「A15-10連携型甲」→「A1510アーキタイプA」・
 *      「A15-10連携型乙」→「結合試験アーキタイプ」、カード「A15-10連携カードA」→「結合試験カードA」・「A15-10連携カードB」→「結合試験カードB」（共有のマスタに行を足さない）
 *  - S-A15-10-AE-CASE-033: 専用の会員・イベント（フォーマットは甲だけ・デッキ登録あり・締切 2099-12-19 23:59）・更新前デッキ（甲・メイン/サイド空）
 *  - S-A15-10-AE-CASE-034: 専用の会員・更新前デッキ（甲・アーキタイプ甲・非公開・メイン/サイド空）
 *  - S-A15-10-AE-REQ-033・034: 入力値の取り決め（投入するデータは無い。要求の中身はケースの中で作る）
 * 作り方は seeds/a15-10.ts と同じ型（会員はフロントの新規会員登録・デッキはデッキビルダーの登録のAPI・トークンはログインのAPI）。店舗「A15-10連携店舗」は作らず、
 * イベントの店舗は大会デッキ登録（F06-16）の共有の店舗で読み替える。
 */
import { BASE_URL } from "../config/env";
import { 公開区分の番号 } from "../db/a15_18";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { rc } from "../lib/run_marker";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 大会を登録する } from "../pages/admin/f06_16_setup";
import { 対象デッキを作る, ログインする } from "../pages/api/a15_18_deck_update_import";
import { A1501のメール, 会員を作る } from "./a15-01";
import { 所有者の定め } from "./a15-10";
import { 管理者 } from "./f06-16";

const 注 = (s: SeedCtx, m: string) => reportSeedIssue(s.seed.シードID, m);
export const 型甲の名 = "更新前フォーマット";
export const 型乙の名 = "結合試験フォーマット";
export const 大会名の正本 = "A15-10連携大会-001";
export const 大会名 = () => rc(大会名の正本);

const 読み替えの文 = "正本の名前は、共有のマスタに行を足さないため、既にあるマスタで読み替えた（フォーマット甲=更新前フォーマット・乙=結合試験フォーマット、アーキタイプ甲=A1510アーキタイプA・乙=結合試験アーキタイプ、カードA=結合試験カードA・カードB=結合試験カードB）";

defineSeed("S-A15-10-AE-ENV", async (ctx) => {
  注(ctx, "管理画面のログインID「ae1510admin」は作らず、共有の初期の管理者（システム管理者）で読み替えた。署名設定・API の疎通は共有の環境の設定で、書き換えない");
});
defineSeed("S-A15-10-AE-REF", { needs: ["S-A15-10-MASTERS"] }, async (ctx) => {
  注(ctx, 読み替えの文);
  注(ctx, "店舗「A15-10連携店舗」は作らない（店舗は作らない決まり）。イベントの店舗は大会デッキ登録（F06-16）の共有の店舗で読み替えた");
});
for (const n of ["033", "034"]) defineSeed(`S-A15-10-AE-REQ-${n}`, async (ctx) => { 注(ctx, "入力値の取り決めで、投入するデータは無い。要求の中身は、ケースの中で（カードの番号は控えた番号で）作る"); });

/** 専用の会員（フロントの新規会員登録）と、更新前デッキ（所有者のトークンでデッキビルダーの登録のAPIで作る）を作る */
async function 会員とデッキを作る(ctx: SeedCtx, n: string, 呼び名: string, 名: string, デッキ名: string, 公開: "公開" | "非公開", アーキA: boolean): Promise<void> {
  const { browser, notes } = ctx;
  const メール = `a1510-ae${n}@example.test`;
  const パスワード = `ItA1510-Pass-AE${n}!`;
  await 会員を作る(ctx, { メール, パスワード, 名, 選手: true, 呼び名, 機能: "A1510", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false });
  所有者の定め[`AE${n}`] = { メール: A1501のメール(メール), パスワード };
  const c = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(c);
    const page = await c.newPage();
    const { token, 応答 } = await ログインする(page, 所有者の定め[`AE${n}`].メール, パスワード);
    if (!token) throw new Error(`${ctx.seed.シードID}: 所有者のログインでトークンを受け取れない（HTTP ${応答.ステータス} ${応答.本文}）`);
    const id = await 対象デッキを作る(page, token, {
      デッキ名, フォーマット: notes.get("〔フォーマットID-A1510-共有A〕"), 公開区分: 公開区分の番号(公開),
      ...(アーキA ? { アーキタイプ: notes.get("〔アーキタイプID-A1510-共有A〕") } : {}),
    });
    notes.set(`〔デッキID-A1510-${呼び名}〕`, id);
  } finally { await c.close(); }
  注(ctx, `会員（所有者）はフロントの新規会員登録で作った（メールは実行の印つき）。更新前デッキ「${デッキ名}」（フォーマット甲・${公開}・メイン/サイドは空）は、画面の代わりに、所有者のトークンでデッキビルダーの登録のAPIで作った。トークンはログインのAPIで受け取った（記録しない）`);
}

defineSeed("S-A15-10-AE-CASE-033", { needs: ["S-A15-10-AE-ENV", "S-A15-10-AE-REF", "S-F06-16-REF"] }, async (ctx) => {
  await 会員とデッキを作る(ctx, "001", "AE001", "デッキ連携所有者1", "A15-10旧デッキ-001", "公開", false);
  const 大 = await withAdminSession(ctx.browser, 管理者, async (page) => {
    page.setDefaultTimeout(120_000);
    page.setDefaultNavigationTimeout(180_000);
    return 大会を登録する(page, { 名: 大会名(), フォーマット: [型甲の名], 日程: { 開始: "2099-12-20 10:00", デッキ登録: true, 締切: "2099-12-19 23:59", 終了する: false } });
  });
  ctx.notes.set("〔イベント詳細ID-A1510-AE001〕", 大.日程ID);
  注(ctx, `イベント「${大会名の正本}」は「${大会名()}」（実行の印つき）。フォーマットは甲（${型甲の名}）だけ・開催 2099-12-20 10:00・デッキ登録あり・締切 2099-12-19 23:59`);
  注(ctx, "更新前デッキの公開状態は、シード表に指定が無いので公開にした（マイデッキの取得で表示されるため）");
});

defineSeed("S-A15-10-AE-CASE-034", { needs: ["S-A15-10-AE-ENV", "S-A15-10-AE-REF"] }, async (ctx) => {
  await 会員とデッキを作る(ctx, "002", "AE002", "デッキ連携所有者2", "A15-10旧デッキ-002", "非公開", true);
});
