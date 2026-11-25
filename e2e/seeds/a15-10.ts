/**
 * A15-10 デッキ情報更新（デッキビルダーの API の PUT /api/deck/{デッキID}）のシード。正本: cases/A15-10_seed_data.tsv
 *
 * 作り方は A15-18（デッキ更新インポート）と同じ型で、その部品を使う（A15-18 のファイルは変えない）:
 * - 所有者A・Bは、フロントの新規会員登録（選手あり）で作る（seeds/a15-01.ts の 会員を作る。メールは @ の前に実行の印）。
 * - フォーマット・カード・アーキタイプ・キャンペーンタグは、A15-18 のシード（S-A15-18-FORMATS・CARDS・RELATED）を先に作り、その番号を A1510 の呼び名に写す。
 *   A15-18 のアーキタイプはフォーマットBに付けた1件だけなので、フォーマットAに付けるアーキタイプ「A1510アーキタイプA」を、管理画面で足す（あれば使う）。
 * - 更新の対象デッキ（シード表は「画面で作る」＋ DB で関連を設定）は、デッキビルダーの登録の API（POST /api/deck。画面が送る要求と同じ）で、シード表と同じ内容に作る。
 *   キャンペーンタグも、登録の API の campaign_tag_ids で付ける（DB へは書かない）。デッキは毎回新しく作るので、一時保存（Redis）は無い。
 *   一時保存が無いことは、取得の API（一時保存があればその名前が返る）で確かめる（Redis の代わり）。
 * - 公開範囲ID 1・2・3、区画の識別子1〜6、ユーザー作成デッキの種別は、マスタに登録済みであることを確かめるだけ（書き換えない）。公開範囲ID 4 は、あれば止める（消さない）。
 * - 署名方式・署名シークレットは共有の設定なので書き換えない。トークンはログインの API から受け取る。
 */
import { SETUP_ADMIN, BASE_URL } from "../config/env";
import { アーキタイプの番号, 公開区分の番号 } from "../db/a15_18";
import { query } from "../lib/db";
import { defineSeed, reportSeedIssue, SeedCtx } from "../lib/seeds";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { 取得したデッキ名, 対象デッキを作る, ログインする } from "../pages/api/a15_18_deck_update_import";
import { アーキタイプを新規登録する } from "../pages/admin/a15_17_setup";
import { A1501のメール, 会員を作る, 印の注記 } from "./a15-01";
import "./a15-18";

const 注 = (s: SeedCtx, m: string) => reportSeedIssue(s.seed.シードID, m);

/** 所有者A・Bの会員（メールは実行の印つき）。A・B のトークンは、ケースの中でログインの API から受け取る */
export const 所有者の定め: Record<string, { メール: string; パスワード: string }> = {};
function 所有者(呼び名: "共有A" | "共有B", メール: string, パスワード: string, 名: string) {
  所有者の定め[呼び名] = { メール: A1501のメール(メール), パスワード };
  return async (ctx: SeedCtx) => {
    await 会員を作る(ctx, { メール, パスワード, 名, 選手: true, 呼び名, 機能: "A1510", 会員IDの名: "顧客ID", デッキユーザーIDを控える: false });
  };
}
const 作るA = 所有者("共有A", "a1510-owner-a@example.test", "ItA1510-Pass-A1!", "デッキ更新所有者エー");
const 作るB = 所有者("共有B", "a1510-owner-b@example.test", "ItA1510-Pass-B1!", "デッキ更新所有者ビー");

defineSeed("S-A15-10-ENV", async (ctx) => {
  注(ctx, "署名方式・署名シークレット・API の疎通は共有の環境の設定で、書き換えない。トークンはログインの API で受け取る。DB は参照だけ。Redis は参照できないので、一時保存の有無はデッキの取得の API で確かめる");
});

defineSeed("S-A15-10-PLAYERS", async (ctx) => {
  await 作るA(ctx); await 作るB(ctx);
  注(ctx, `${印の注記}。所有者A・Bの会員・選手は、フロントの会員登録で作った（姓「デッキ更新」・名は「所有者エー」「所有者ビー」に実行の印つきのメールを付けた読み替え）。トークンは、シード表の「テスト用認証データ作成機構で発行」の代わりに、ケースの中でログインの API を呼んで受け取る（署名鍵は使わない）`);
});

defineSeed("S-A15-10-MASTERS", { needs: ["S-A15-18-FORMATS", "S-A15-18-CARDS", "S-A15-18-SCOPES", "S-A15-18-RELATED"] }, async (ctx) => {
  const { notes, browser } = ctx;
  const 型A = notes.get("〔フォーマットID-A1518-共有A〕");
  const 型B = notes.get("〔フォーマットID-A1518-共有B〕");
  notes.set("〔フォーマットID-A1510-共有A〕", 型A);
  notes.set("〔フォーマットID-A1510-共有B〕", 型B);
  for (const k of ["A", "B", "C", "D", "E", "F"]) notes.set(`〔カードID-A1510-共有${k}〕`, notes.get(`〔カードID-A1518-共有${k}〕`));
  notes.set("〔キャンペーンタグID-A1510-共有A〕", notes.get("〔キャンペーンタグID-A1518-共有A〕"));
  notes.set("〔キャンペーンタグID-A1510-共有B〕", notes.get("〔キャンペーンタグID-A1518-共有B〕"));
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    if (アーキタイプの番号("A1510アーキタイプA", 型A) === null) await アーキタイプを新規登録する(page, { 名日: "A1510アーキタイプA", 名英: "A1510 Archetype A", フォーマット番号: 型A }, (m) => 注(ctx, m));
  });
  const 甲 = アーキタイプの番号("A1510アーキタイプA", 型A);
  if (!甲) throw new Error("アーキタイプ「A1510アーキタイプA」が登録後に見つからない");
  notes.set("〔アーキタイプID-A1510-共有A〕", 甲);
  notes.set("〔アーキタイプID-A1510-共有B〕", notes.get("〔アーキタイプID-A1518-共有〕"));
  for (const id of ["1", "2", "3"]) {
    if (query(`select 1 from mtb_disp where id = $1::int`, [id]).length !== 1) throw new Error(`公開範囲ID ${id} がマスタに無い（書き換えずに止める）`);
  }
  if (query(`select 1 from mtb_disp where id = 4`, []).length !== 0) throw new Error("公開範囲ID 4 が登録されている（シード表は未登録。ほかの方の行かもしれないので消さずに止める）");
  注(ctx, "フォーマット・カード・キャンペーンタグは A15-18 のシードが作った（または既にある）ものを使った（フォーマットA=「更新前フォーマット」・B=「結合試験フォーマット」、カードA〜F=結合試験カードA・B・更新前デッキカード用ほか、キャンペーンタグ=結合試験キャンペーンA・B）。アーキタイプBは A15-18 のアーキタイプ（フォーマットBに付く）を使い、アーキタイプAは管理画面で足した。公開範囲ID 1〜3 はマスタに有ることを DB で確かめ、公開範囲ID 4 は無いことを数えた（消さない）。区画の識別子1〜6・ユーザー作成デッキの種別は書き換えない");
});

defineSeed("S-A15-10-ABSENT", async (ctx) => {
  if (query(`select 1 from dtb_deck where id = 159999`, []).length !== 0) throw new Error("デッキ 159999 が登録されている（シード表は未登録。ほかの方のデッキかもしれないので消さずに止める）");
  注(ctx, "デッキ 159999 が未登録であることを DB で数えて確かめた（あれば止める。消さない）");
});

/** 入力値の取り決め（投入するデータは無い。ケースの中で要求の中身にする） */
for (const id of ["S-A15-10-FULL-001", "S-A15-10-FULL-002", "S-A15-10-REQUEST-011", "S-A15-10-REQUEST-014", "S-A15-10-ONECARD-031", "S-A15-10-REPEAT-032"]) {
  defineSeed(id, async (ctx) => { 注(ctx, "入力値の取り決めで、投入するデータは無い。要求の中身は、ケースの中で（カードの番号は控えた番号で）作る"); });
}

type 対象の定め = { 所有者?: "共有A" | "共有B"; デッキ名: string; 公開: 1 | 2; 先に?: ("アーキA" | "画像A" | "タグA" | "カードB")[] };
/** 更新の対象デッキ。デッキビルダーの登録の API で作る（所有者・名前・フォーマット・アーキタイプ・公開範囲・代表カード・キャンペーンタグ・採用カードはシード表のとおり） */
function 対象(seedId: string, n: string, o: 対象の定め) {
  const 持ち主 = o.所有者 ?? "共有A";
  const needs = ["S-A15-10-PLAYERS", "S-A15-10-MASTERS"];
  defineSeed(seedId, { needs }, async (ctx) => {
    const { browser, notes } = ctx;
    const 定め = 所有者の定め[持ち主];
    const c = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(c);
      const page = await c.newPage();
      const { token, 応答 } = await ログインする(page, 定め.メール, 定め.パスワード);
      if (!token) throw new Error(`${seedId}: 所有者 ${持ち主} のログインでトークンを受け取れない（HTTP ${応答.ステータス} ${応答.本文}）`);
      const f = (x: NonNullable<対象の定め["先に"]>[number]) => (o.先に ?? []).includes(x);
      const 公開 = 公開区分の番号(o.公開 === 1 ? "公開" : "非公開");
      const id = await 対象デッキを作る(page, token, {
        デッキ名: o.デッキ名, フォーマット: notes.get("〔フォーマットID-A1510-共有A〕"), 公開区分: 公開,
        ...(f("アーキA") ? { アーキタイプ: notes.get("〔アーキタイプID-A1510-共有A〕") } : {}),
        ...(f("画像A") ? { 画像カード: notes.get("〔カードID-A1510-共有A〕") } : {}),
        ...(f("タグA") ? { キャンペーンタグ: [notes.get("〔キャンペーンタグID-A1510-共有A〕")] } : {}),
        ...(f("カードB") ? { デッキカード: [[notes.get("〔カードID-A1510-共有B〕"), seedId.endsWith("003") ? 2 : 1]] as [string, number][] } : {}),
      });
      notes.set(`〔デッキID-A1510-${n}〕`, id);
      const 取得 = await 取得したデッキ名(page, token, id);
      if (取得.デッキ名 !== o.デッキ名) throw new Error(`${seedId}: デッキ ${id} の取得の API が返すデッキ名が「${取得.デッキ名}」（「${o.デッキ名}」のはず。一時保存があるかもしれない）`);
    } finally { await c.close(); }
    注(ctx, `更新の対象デッキ（所有者${持ち主}・デッキ名「${o.デッキ名}」・${o.公開 === 1 ? "公開" : "非公開"}）は、画面と DB への書き込みの代わりに、所有者のトークンでデッキビルダーの登録の API で作った（キャンペーンタグも登録の API で付けた）。デッキは毎回新しく作るので一時保存（Redis）は無く、取得の API でデッキ名が保存済みの名前であることを確かめた`);
  });
}
const 満 = ["アーキA", "画像A", "タグA", "カードB"] as const;
for (const n of ["001", "002", "004", "005", "006", "007", "008", "009", "016"]) {
  対象(`S-A15-10-TARGET-${n}`, n, { デッキ名: "更新前デッキ", 公開: 2, 先に: [...満] });
}
対象("S-A15-10-OMIT-003", "003", { デッキ名: "省略前デッキ", 公開: 1, 先に: [...満] });
対象("S-A15-10-TARGET-031", "031", { デッキ名: "更新前デッキ", 公開: 2 });
対象("S-A15-10-TARGET-032", "032", { デッキ名: "更新前デッキ", 公開: 2 });
対象("S-A15-10-OTHER-012", "012", { 所有者: "共有B", デッキ名: "他者所有デッキ", 公開: 1 });
対象("S-A15-10-OTHER-013", "013", { 所有者: "共有B", デッキ名: "他者所有デッキ", 公開: 1 });
