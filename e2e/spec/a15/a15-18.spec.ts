/**
 * A15-18 デッキ更新インポート（デッキビルダーの API の PUT /api/deck/import/{デッキID}）。正本: cases/A15-18_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-18_progress_2026-11-21_dev.md。
 *
 * 作り方は A15-17 と同じ: 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む。アクセストークンは、シードの会員でログインの API から受け取る（署名鍵は使わない）。
 * 更新の対象デッキはシードがデッキビルダーの登録の API で作る（デッキの識別子は固定の値でなく、控えた番号。ケースの文の固定の識別子は読み替える）。
 * 一時保存（下書き）の有無は、Redis の代わりにデッキの取得の API（一時保存があればその名前が返る）で確かめる。
 * 書かないケース: 015（外部・作れない前提）、030・034・045・048・049（アーキタイプの画像・登録日時の違うカード画像が要る）。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import {
  デッキの内容を読む, プレイヤーのデッキ, 公開区分の番号, 区分別に読む, 区分別の文字列, 明細の件数, カードの番号,
} from "../../db/a15_18";
import {
  インポート要求, 取得したデッキ名, 応答, 更新インポートする, 登録インポートする, 署名を1文字変える, ログインする,
} from "../../pages/api/a15_18_deck_update_import";
import { 会員の定め, 対象デッキの番号 } from "../../seeds/a15-18";
import "../../seeds/a15-18";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからデッキ更新インポート API（PUT /api/deck/import/{デッキの識別子}）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む";
const トークンの補い = "アクセストークンは、シード表の「テスト環境の認証機能で発行する」の代わりに、シードの会員でログインの API を呼んで受け取った（値は記録しない）";
const 識別子の補い = "更新の対象デッキの識別子は、シード表の固定の値でなく、シードがデッキビルダーの登録の API で作ったときに振られた番号（控えた番号）を使った";

const メイン = "メインボード", サイド = "サイドボード", 統率 = "統率領域";
const A = "結合試験カードA", B = "結合試験カードB";
const 期待 = (...x: [string, string, number][]): string[] => x.map(([カード名, 領域, 枚数]) => `デッキカード｜${領域}｜${カード名}｜${枚数}枚`).sort();

const 番号 = (ctx: CaseCtx, 呼び名: string): string => ctx.notes.get(呼び名);
const 型A = (ctx: CaseCtx) => 番号(ctx, "〔フォーマットID-A1518-共有A〕");
const 型B = (ctx: CaseCtx) => 番号(ctx, "〔フォーマットID-A1518-共有B〕");
const 型C = (ctx: CaseCtx) => 番号(ctx, "〔フォーマットID-A1518-共有C〕");
const 公開 = () => 公開区分の番号("公開");
const 対象 = (_ctx: CaseCtx, n: string): string => {
  supplement(識別子の補い);
  const id = 対象デッキの番号.get(n);
  if (!id) throw new Error(`更新の対象デッキ（${n}）の番号が控えられていない`);
  note(`更新の対象デッキの識別子: ${id}`);
  return id;
};

async function トークンを受け取る(ctx: CaseCtx, 会員: string): Promise<string> {
  const 定め = 会員の定め[会員];
  if (!定め) throw new Error(`会員 ${会員} の定めが無い`);
  const { token, 応答 } = await ログインする(ctx.page, 定め.メール, 定め.パスワード);
  supplement(トークンの補い);
  note(`ログイン: POST /api/user/login・応答 HTTP ${応答.ステータス}`);
  if (!token) throw new Error(`ログインの API がアクセストークンを返さない（HTTP ${応答.ステータス} ${応答.本文}）`);
  return token;
}

/** 更新の要求を送って、応答の要点を注記に残す */
async function 更新する(ctx: CaseCtx, token: string | undefined, id: string, 要求: インポート要求, 何: string): Promise<応答> {
  const r = await 更新インポートする(ctx.page, token, id, 要求);
  note(`${何}: PUT /api/deck/import/${id}${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}・応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 600)}`);
  return r;
}

const 要点 = (r: 応答): string => `応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}・デッキの識別子 ${JSON.stringify(r.json?.deck_id)}・解読できない行 ${JSON.stringify(r.json?.errors)}`;
const 行番号 = (r: 応答): number[] => ((r.json?.errors as unknown[]) ?? []).map(Number);
const 整数か = (v: unknown): boolean => typeof v === "number" && Number.isInteger(v);

/** 更新の成功（200・206）の応答の確かめ（HTTP ステータスは呼び出し側で確かめる） */
function 成功の応答を確かめる(r: 応答, id: string, o: { ステータス: 200 | 206; 行: number[] }): void {
  expect.soft(r.json?.code, "処理結果コード").toBe(o.ステータス);
  expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck update success by import");
  expect.soft(String(r.json?.deck_id ?? ""), "応答のデッキの識別子（更新したデッキ）").toBe(id);
  expect.soft(行番号(r), "解読できない行の行番号").toEqual(o.行);
}

/** 区分ごとの明細が、指定のデッキカードだけであること */
function 明細を確かめる(id: string, 期待のデッキカード: string[], 何: string): void {
  const x = 区分別に読む(id);
  expect.soft(区分別の文字列(x), `${何}の明細（デッキカード・メイビー・アトラクション・ステッカー）`).toEqual(期待のデッキカード);
}

// ---------------------------------------------------------------------------
// 001・002 正常更新
// ---------------------------------------------------------------------------
function 正常更新の要求(ctx: CaseCtx): インポート要求 {
  return {
    フォーマット: 型B(ctx), カードリスト: ["2 結合試験カードA", "1 結合試験カードB"], デッキ名: "正常更新デッキ", 公開区分: 公開(),
    アーキタイプ: 番号(ctx, "〔アーキタイプID-A1518-共有〕"), 画像用カード: 番号(ctx, "〔カードID-A1518-共有A〕"),
    キャンペーンタグ: 番号(ctx, "〔キャンペーンタグID-A1518-共有A〕"),
  };
}

caseTest("IT-A15-18-001", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "001");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "共有A"); });
  await ctx.step(3, async () => { r = await 更新する(ctx, token, id, 正常更新の要求(ctx), "正常更新デッキ"); });
  await ctx.step(4, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json !== null && !Array.isArray(r.json), "応答本文がラッパオブジェクト").toBe(true);
    expect.soft(Object.keys(r.json ?? {}).every((k) => /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(k)), `含まれるキーがスネークケース（${Object.keys(r.json ?? {}).join("・")}）`).toBe(true);
    expect.soft(整数か(r.json?.code) && r.json?.code === 200, "処理結果コードが integer 型の 200").toBe(true);
    expect.soft(typeof r.json?.message === "string" && r.json?.message === "Deck update success by import", "処理結果メッセージが string 型の「Deck update success by import」").toBe(true);
    expect.soft(整数か(r.json?.deck_id) && String(r.json?.deck_id) === id, "デッキ識別子が integer 型で、更新したデッキの識別子").toBe(true);
    expect.soft(行番号(r), "解読できない行の行番号が含まれない").toEqual([]);
  });
});

caseTest("IT-A15-18-002", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "002");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "共有A"); });
  await ctx.step(3, async () => { r = await 更新する(ctx, token, id, 正常更新の要求(ctx), "正常更新デッキ"); });
  let 後!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(4, async () => { 後 = デッキの内容を読む(id); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(後.存在, "デッキの識別子はそのまま（同じデッキが残っている）").toBe(true);
    expect.soft(後.名前, "デッキ名").toBe("正常更新デッキ");
    expect.soft(後.公開区分, "公開区分").toBe(公開());
    expect.soft(後.フォーマット, "フォーマット").toBe(型B(ctx));
    expect.soft(後.アーキタイプ, "アーキタイプ").toBe(番号(ctx, "〔アーキタイプID-A1518-共有〕"));
    expect.soft(後.画像カード名, "デッキ画像用カード").toBe(A);
    expect.soft(後.タグ, "キャンペーンタグ").toEqual(["結合試験キャンペーンA"]);
    expect.soft(後.明細, "デッキカード・メイビー・アトラクション・ステッカー（更新前のカードがなくなり、結合試験カードAが2枚・結合試験カードBが1枚）").toEqual(期待([A, メイン, 2], [B, メイン, 1]));
  });
});

// ---------------------------------------------------------------------------
// 004 キャンペーンタグを配列で指定
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-004", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "004");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "共有A"); });
  await ctx.step(3, async () => {
    r = await 更新する(ctx, token, id, {
      フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "タグ配列更新デッキ", 公開区分: 公開(),
      キャンペーンタグ: [番号(ctx, "〔キャンペーンタグID-A1518-共有A〕"), 番号(ctx, "〔キャンペーンタグID-A1518-共有B〕")],
    }, "タグ配列更新デッキ");
  });
  let タグ: string[] = [];
  await ctx.step(4, async () => { タグ = デッキの内容を読む(id).タグ; });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(タグ, "デッキに紐付いたキャンペーンタグ").toEqual(["結合試験キャンペーンA", "結合試験キャンペーンB"]);
  });
});

// ---------------------------------------------------------------------------
// 005 カードリスト未指定・空
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-005", async (ctx) => {
  let token = ""; let 件数1 = -1; let 件数2 = -1;
  const id = 対象(ctx, "005");
  await ctx.step(1, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    await 更新する(ctx, token, id, { フォーマット: 型B(ctx), デッキ名: "カードリスト未指定更新", 公開区分: 公開() }, "カードリスト未指定更新");
  });
  await ctx.step(2, async () => { 件数1 = 明細の件数(区分別に読む(id)); note(`カードリスト未指定の更新のあとの、デッキカード・メイビー・アトラクション・ステッカーの合計: ${件数1} 件`); });
  await ctx.step(3, async () => {
    await 更新する(ctx, token, id, { フォーマット: 型B(ctx), デッキ名: "カードリスト空更新", 公開区分: 公開(), カードリスト: "" }, "カードリスト空更新");
  });
  await ctx.step(4, async () => { 件数2 = 明細の件数(区分別に読む(id)); });
  await ctx.expected(async () => {
    expect.soft(件数1, "カードリスト未指定の更新のあとの明細の合計件数").toBe(0);
    expect.soft(件数2, "カードリスト空文字の更新のあとの明細の合計件数").toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 006 カードリスト500行
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-006", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "006");
  const リスト = Array.from({ length: 500 }, (_, i) => `1 上限試験カード${String(i + 1).padStart(3, "0")}`);
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), デッキ名: "500行更新デッキ", 公開区分: 公開(), カードリスト: リスト }, "500行更新デッキ");
  });
  let 後!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(3, async () => { 後 = デッキの内容を読む(id); note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(後.名前, "デッキ名").toBe("500行更新デッキ");
    expect.soft(後.明細.length, "カードの件数（500行に対応する500件）").toBe(500);
    expect.soft(後.明細.every((m) => m.startsWith("デッキカード｜メインボード｜上限試験カード") && m.endsWith("｜1枚")), "カードがすべて上限試験カードのメインボード1枚").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 009・010 解読できない行を含む（部分的な成功）
// ---------------------------------------------------------------------------
const 部分リスト = ["1 存在しないカードX", "2 結合試験カードA", "1 存在しないカードY"];

caseTest("IT-A15-18-009", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "009");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), デッキ名: "部分解読更新デッキ", 公開区分: 公開(), カードリスト: 部分リスト }, "部分解読更新デッキ");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(206);
    成功の応答を確かめる(r, id, { ステータス: 206, 行: [1, 3] });
  });
});

caseTest("IT-A15-18-010", async (ctx) => {
  let token = "";
  const id = 対象(ctx, "010");
  await ctx.step(1, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    await 更新する(ctx, token, id, { フォーマット: 型B(ctx), デッキ名: "部分保存確認デッキ", 公開区分: 公開(), カードリスト: 部分リスト }, "部分保存確認デッキ");
  });
  let 後!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(2, async () => { 後 = デッキの内容を読む(id); });
  await ctx.expected(async () => {
    expect.soft(後.名前, "デッキ名").toBe("部分保存確認デッキ");
    expect.soft(後.明細, "カード（更新前のカードがなくなり、解読できた結合試験カードAが枚数2だけ）").toEqual(期待([A, メイン, 2]));
  });
});

// ---------------------------------------------------------------------------
// 011・012 表示用トークン
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-011", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "011");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "限定公開更新デッキ", 公開区分: 公開区分の番号("限定公開") }, "限定公開更新デッキ");
  });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・デッキの識別子 ${JSON.stringify(r.json?.deck_id)}・表示用トークンの有無 ${"display_token" in (r.json ?? {})}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(String(r.json?.deck_id ?? ""), "応答のデッキの識別子（更新したデッキ）").toBe(id);
    expect.soft(typeof r.json?.display_token === "string" && (r.json?.display_token as string) !== "", "応答に string 型の表示用トークンが含まれる").toBe(true);
  });
});

caseTest("IT-A15-18-012", async (ctx) => {
  let token = ""; let 公開応答!: 応答; let 非公開応答!: 応答;
  const id = 対象(ctx, "012");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    公開応答 = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "公開更新デッキ", 公開区分: 公開区分の番号("公開") }, "公開更新デッキ");
  });
  await ctx.step(3, async () => {
    非公開応答 = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "非公開更新デッキ", 公開区分: 公開区分の番号("非公開") }, "非公開更新デッキ");
  });
  await ctx.step(4, async () => { note(`公開更新デッキ: HTTP ${公開応答.ステータス}・表示用トークンの有無 ${"display_token" in (公開応答.json ?? {})} ／ 非公開更新デッキ: HTTP ${非公開応答.ステータス}・表示用トークンの有無 ${"display_token" in (非公開応答.json ?? {})}`); });
  await ctx.expected(async () => {
    expect.soft("display_token" in (公開応答.json ?? {}), "「公開更新デッキ」の応答に表示用トークンが含まれる").toBe(false);
    expect.soft("display_token" in (非公開応答.json ?? {}), "「非公開更新デッキ」の応答に表示用トークンが含まれる").toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 013・014・016・017 認証・存在・所有者の判定
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-013", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    r = await 更新する(ctx, undefined, "999999", { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "トークン欠落更新", 公開区分: 公開() }, "トークン欠落更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス（デッキの存在判定より先に認証判定が行われ、404 でなく 401）").toBe(401);
    expect.soft(r.json !== null && "code" in r.json, "応答に処理結果コードが含まれる").toBe(true);
    expect.soft(r.json?.message, "処理結果メッセージ").toBe("Access Token is incorrect");
  });
});

caseTest("IT-A15-18-014", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "014");
  await ctx.step(1, async () => {
    token = 署名を1文字変える(await トークンを受け取る(ctx, "共有A"));
    note("アクセストークンの署名の部分の末尾の1文字を変えた（署名鍵は使わない。値は記録しない）");
  });
  await ctx.step(2, async () => {
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "署名不正更新", 公開区分: 公開() }, "署名不正更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json !== null && "code" in r.json, "応答に処理結果コードが含まれる").toBe(true);
    expect.soft(r.json?.message, "処理結果メッセージ").toBe("Access Token is incorrect");
  });
});

caseTest("IT-A15-18-016", async (ctx) => {
  let token = ""; let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "016");
    r = await 更新する(ctx, token, "999999", { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "存在しないデッキ更新", 公開区分: 公開() }, "存在しないデッキ更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(r.json !== null && "code" in r.json, "応答に処理結果コードが含まれる").toBe(true);
    expect.soft(r.json?.message, "処理結果メッセージ").toBe("The deck does not exist");
  });
});

caseTest("IT-A15-18-017", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "017");
  let 前!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(1, async () => { 前 = デッキの内容を読む(id); note(`記録: デッキ名「${前.名前}」・明細 ${JSON.stringify(前.明細)}`); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "他者デッキ更新", 公開区分: 公開() }, "他者デッキ更新");
  });
  let 後!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(3, async () => { 後 = デッキの内容を読む(id); note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(r.json !== null && "code" in r.json, "応答に処理結果コードが含まれる").toBe(true);
    expect.soft(r.json?.message, "処理結果メッセージ").toBe("Authentication failed");
    expect.soft(後.名前, "デッキ名（要求の送信前から更新されない）").toBe(前.名前);
    expect.soft(後.明細, "配下のカード（要求の送信前から更新されない）").toEqual(前.明細);
  });
});

// ---------------------------------------------------------------------------
// 019・020 デッキの識別子を付けない要求は新規登録
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-019", async (ctx) => {
  let token = ""; let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "019");
    r = await 登録インポートする(ctx.page, token, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "登録分岐デッキ", 公開区分: 公開() });
    note(`識別子を付けず POST /api/deck/import へ送信・${要点(r)}`);
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck registration success by import");
    expect.soft(String(r.json?.deck_id ?? "") !== "", "応答に新規デッキの識別子が含まれる").toBe(true);
  });
});

caseTest("IT-A15-18-020", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "020");
  const 選手 = 番号(ctx, "〔プレイヤーID-A1518-020〕");
  let 前!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(1, async () => { 前 = デッキの内容を読む(id); note(`記録: デッキ名「${前.名前}」・明細 ${JSON.stringify(前.明細)}`); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "020");
    r = await 登録インポートする(ctx.page, token, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "更新前デッキ", 公開区分: 公開() });
    note(`識別子を付けず POST /api/deck/import へ送信・${要点(r)}`);
  });
  let 後!: ReturnType<typeof デッキの内容を読む>; let 同名: string[] = [];
  await ctx.step(3, async () => { 後 = デッキの内容を読む(id); 同名 = プレイヤーのデッキ(選手, "更新前デッキ").map((d) => d.番号); });
  await ctx.expected(async () => {
    expect.soft(後, "既存のデッキは要求の送信前の内容から更新されない").toEqual(前);
    const 新 = 同名.filter((d) => d !== id);
    expect.soft(同名.includes(id) && 新.length === 1, `デッキ名「更新前デッキ」のデッキ（既存の1件と、別の識別子を持つ新規デッキ1件。実際 ${同名.length} 件）`).toBe(true);
    expect.soft(新[0] !== undefined && 新[0] === String(r.json?.deck_id ?? ""), "新規デッキの識別子が応答のデッキの識別子と同じ").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 022 領域の解読（フォーマットで統率領域が変わる）
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-022", async (ctx) => {
  let token = ""; let 手順2: string[] = []; let 手順4: string[] = [];
  const id = 対象(ctx, "022");
  await ctx.step(1, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    await 更新する(ctx, token, id, { フォーマット: 型B(ctx), 公開区分: 公開区分の番号("非公開"), カードリスト: ["Deck", "2 結合試験カードA", "Sideboard", "1 結合試験カードB"] }, "領域の見出しつき（統率なしのフォーマット）");
  });
  await ctx.step(2, async () => { 手順2 = 区分別の文字列(区分別に読む(id)); });
  await ctx.step(3, async () => {
    await 更新する(ctx, token, id, { フォーマット: 型C(ctx), 公開区分: 公開区分の番号("非公開"), カードリスト: ["Commander", "1 結合試験カードA", "Deck", "1 結合試験カードB"] }, "領域の見出しつき（統率ありのフォーマット）");
  });
  await ctx.step(4, async () => { 手順4 = 区分別の文字列(区分別に読む(id)); });
  await ctx.expected(async () => {
    expect.soft(手順2, "手順2: 結合試験カードAがメインボード・結合試験カードBがサイドボード（メイビー・アトラクション・ステッカーは0件）").toEqual(期待([A, メイン, 2], [B, サイド, 1]));
    expect.soft(手順4, "手順4: 結合試験カードAが統率領域・結合試験カードBがメインボード（メイビー・アトラクション・ステッカーは0件）").toEqual(期待([A, 統率, 1], [B, メイン, 1]));
  });
});

// ---------------------------------------------------------------------------
// 027 呼び出し元を識別する項目なし
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-027", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "027");
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), 公開区分: 公開区分の番号("非公開"), デッキ名: "開発者ツール更新", カードリスト: ["1 結合試験カードA"] }, "開発者ツール更新（呼び出し元を識別する項目なし）");
  });
  await ctx.step(2, async () => { note(要点(r)); });
  let 後!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(3, async () => { 後 = デッキの内容を読む(id); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(後.名前, "デッキ名").toBe("開発者ツール更新");
  });
});

// ---------------------------------------------------------------------------
// 028・029・033 項目を省略したときの値（省略すると値なしになる）
// ---------------------------------------------------------------------------
caseTest("IT-A15-18-028", async (ctx) => {
  let token = ""; let r!: 応答; let 前 = ""; let 後 = "";
  const id = 対象(ctx, "028");
  await ctx.step(1, async () => { 前 = デッキの内容を読む(id).名前; note(`記録: デッキ名「${前}」`); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], 公開区分: 公開() }, "デッキ名を指定しない更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { 後 = デッキの内容を読む(id).名前; });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(前, "手順1で記録したデッキ名").toBe("A1518-028-更新前");
    expect.soft(後, "更新後のデッキ名（変わって値なし）").toBe("");
  });
});

caseTest("IT-A15-18-029", async (ctx) => {
  let token = ""; let r!: 応答; let 前 = ""; let 後 = "";
  const id = 対象(ctx, "029");
  await ctx.step(1, async () => { 前 = デッキの内容を読む(id).アーキタイプ; note(`記録: アーキタイプの識別子 ${前}`); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, {
      フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "A1518-029-更新後", 公開区分: 公開(), 画像用カード: 番号(ctx, "〔カードID-A1518-共有A〕"),
    }, "アーキタイプを指定しない更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { 後 = デッキの内容を読む(id).アーキタイプ; });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(前, "手順1で記録したアーキタイプ").toBe(番号(ctx, "〔アーキタイプID-A1518-共有〕"));
    expect.soft(後, "更新後のアーキタイプ（変わって値なし）").toBe("");
  });
});

caseTest("IT-A15-18-033", async (ctx) => {
  let token = ""; let r!: 応答; let 前: string[] = []; let 後: string[] = [];
  const id = 対象(ctx, "033");
  await ctx.step(1, async () => { 前 = デッキの内容を読む(id).タグ; note(`記録: キャンペーンタグ ${JSON.stringify(前)}`); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "A1518-033-更新後", 公開区分: 公開() }, "キャンペーンタグを指定しない更新");
  });
  await ctx.step(3, async () => { note(要点(r)); });
  await ctx.step(4, async () => { 後 = デッキの内容を読む(id).タグ; });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(前, "手順1で記録したキャンペーンタグ（2件）").toEqual(["結合試験キャンペーンA", "結合試験キャンペーンB"]);
    expect.soft(後, "更新後のキャンペーンタグ（紐づけなし）").toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 031・032 デッキ画像用カードを省略したときのデッキ画像（統率領域のカード）
// ---------------------------------------------------------------------------
function 画像の省略(n: "031" | "032") {
  return async (ctx: CaseCtx): Promise<void> => {
    let token = ""; let r!: 応答; let 前 = ""; let 後 = "";
    const id = 対象(ctx, n);
    await ctx.step(1, async () => { 前 = デッキの内容を読む(id).画像カード名; note(`記録: デッキ画像のカード「${前}」`); });
    await ctx.step(2, async () => {
      token = await トークンを受け取る(ctx, "共有A");
      const リスト = n === "031" ? ["Commander", "1 A1518-031-統率者", "Deck", "1 結合試験カードA"] : ["Deck", "1 結合試験カードA"];
      r = await 更新する(ctx, token, id, { フォーマット: 型C(ctx), カードリスト: リスト, 公開区分: 公開() }, "デッキ画像用カードとアーキタイプを指定しない更新");
    });
    await ctx.step(3, async () => { note(要点(r)); });
    await ctx.step(4, async () => { 後 = デッキの内容を読む(id).画像カード名; });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
      expect.soft(前, "手順1で記録したデッキ画像のカード").toBe("更新前デッキカード用");
      if (n === "031") {
        expect.soft(後, "更新後のデッキ画像のカード（統率領域のカードの画像）").toBe("A1518-031-統率者");
        expect.soft(カードの番号("A1518-031-統率者") !== null, "統率領域のカードがカードとして登録済み").toBe(true);
      } else {
        expect.soft(後, "更新後のデッキ画像（変わって値なし）").toBe("");
      }
    });
  };
}
caseTest("IT-A15-18-031", 画像の省略("031"));
caseTest("IT-A15-18-032", 画像の省略("032"));

// ---------------------------------------------------------------------------
// 035・036 解読できない行が1行
// ---------------------------------------------------------------------------
const 一行の未登録 = (n: string) => ["2 結合試験カードA", `1 A1518-${n}-未登録カード`, "1 結合試験カードB"];

caseTest("IT-A15-18-035", async (ctx) => {
  let token = ""; let r!: 応答;
  const id = 対象(ctx, "035");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "共有A"); });
  await ctx.step(3, async () => {
    r = await 更新する(ctx, token, id, { フォーマット: 型B(ctx), デッキ名: "部分解読1行デッキ", 公開区分: 公開(), カードリスト: 一行の未登録("035") }, "部分解読1行デッキ");
  });
  await ctx.step(4, async () => { note(要点(r)); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(206);
    成功の応答を確かめる(r, id, { ステータス: 206, 行: [2] });
  });
});

caseTest("IT-A15-18-036", async (ctx) => {
  let token = "";
  const id = 対象(ctx, "036");
  await ctx.step(1, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    await 更新する(ctx, token, id, { フォーマット: 型B(ctx), デッキ名: "部分保存1行デッキ", 公開区分: 公開(), カードリスト: 一行の未登録("036") }, "部分保存1行デッキ");
  });
  let 後!: ReturnType<typeof デッキの内容を読む>;
  await ctx.step(2, async () => { 後 = デッキの内容を読む(id); });
  await ctx.expected(async () => {
    expect.soft(後.名前, "デッキ名").toBe("部分保存1行デッキ");
    expect.soft(後.明細, "カード（更新前のカードがなくなり、結合試験カードAが枚数2・結合試験カードBが枚数1。未登録カードは保存されない）").toEqual(期待([A, メイン, 2], [B, メイン, 1]));
  });
});

// ---------------------------------------------------------------------------
// 037・038 同じ内容で続けて2回更新
// ---------------------------------------------------------------------------
const 二重の要求 = (ctx: CaseCtx, n: "037" | "038"): インポート要求 =>
  ({ フォーマット: 型B(ctx), デッキ名: `二重更新デッキ-${n}`, 公開区分: 公開(), カードリスト: ["2 結合試験カードA", "1 結合試験カードB"] });

caseTest("IT-A15-18-037", async (ctx) => {
  let token = ""; let 二回目!: 応答;
  const id = 対象(ctx, "037");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "共有A"); });
  await ctx.step(3, async () => { await 更新する(ctx, token, id, 二重の要求(ctx, "037"), "1回目"); });
  await ctx.step(4, async () => { 二回目 = await 更新する(ctx, token, id, 二重の要求(ctx, "037"), "2回目（同じ内容）"); });
  await ctx.step(5, async () => { note(`2回目: ${要点(二回目)}`); });
  await ctx.expected(async () => {
    expect.soft(二回目.ステータス, "2回目の HTTP ステータス").toBe(200);
    成功の応答を確かめる(二回目, id, { ステータス: 200, 行: [] });
  });
});

caseTest("IT-A15-18-038", async (ctx) => {
  let token = ""; let 記録!: ReturnType<typeof デッキの内容を読む>; let 後!: ReturnType<typeof デッキの内容を読む>;
  const id = 対象(ctx, "038");
  await ctx.step(1, async () => {
    token = await トークンを受け取る(ctx, "共有A");
    await 更新する(ctx, token, id, 二重の要求(ctx, "038"), "1回目");
  });
  await ctx.step(2, async () => { 記録 = デッキの内容を読む(id); note(`記録: デッキ名「${記録.名前}」・明細 ${JSON.stringify(記録.明細)}`); });
  await ctx.step(3, async () => { await 更新する(ctx, token, id, 二重の要求(ctx, "038"), "2回目（同じ内容）"); });
  await ctx.step(4, async () => { 後 = デッキの内容を読む(id); });
  await ctx.expected(async () => {
    expect.soft(後.名前, "デッキ名").toBe("二重更新デッキ-038");
    expect.soft(後.明細, "デッキカードは結合試験カードA枚数2と結合試験カードB枚数1の2件だけ（メイビー・アトラクション・ステッカーは0件。枚数が倍にならない）").toEqual(期待([A, メイン, 2], [B, メイン, 1]));
    expect.soft(後, "手順2で記録した内容と同じ").toEqual(記録);
  });
});

// ---------------------------------------------------------------------------
// 041〜051 組合せ（統率者の設定・カードリスト・画像・解読できない行・一時保存）
// 一時保存（下書き）の有無は、Redis の代わりにデッキの取得の API（一時保存があれば「下書き」の名前が返る）で確かめる。
// ---------------------------------------------------------------------------
const 下書きの補い = "一時保存（下書き）の有無は、Redis を直接見る代わりに、デッキの取得の API（GET /api/deck/{識別子}。一時保存があれば下書きの名前が返り、無ければ保存済みのデッキの名前が返る）で確かめた";

type 組合せの定め = {
  n: string; 型: (ctx: CaseCtx) => string; 下書きあり: boolean; リスト?: string[]; 画像カードA?: boolean;
  ステータス?: 200 | 206 | 400; 行?: number[]; 期待の明細?: string[]; 期待の画像: string; 変わらない?: boolean;
};

function 組合せ(o: 組合せの定め) {
  return async (ctx: CaseCtx): Promise<void> => {
    let token = ""; let r!: 応答; let 前!: ReturnType<typeof デッキの内容を読む>; let 後!: ReturnType<typeof デッキの内容を読む>;
    let 前の下書き = false; let 後の下書き = false;
    const id = 対象(ctx, `CB${o.n}`);
    await ctx.step(1, async () => {
      token = await トークンを受け取る(ctx, "共有A");
      前 = デッキの内容を読む(id);
      前の下書き = (await 取得したデッキ名(ctx.page, token, id)).デッキ名 === "下書き";
      supplement(下書きの補い);
      note(`記録: デッキ名「${前.名前}」・デッキ画像「${前.画像カード名}」・明細 ${JSON.stringify(前.明細)}・一時保存 ${前の下書き ? "あり" : "なし"}`);
    });
    await ctx.step(2, async () => {
      r = await 更新する(ctx, token, id, {
        フォーマット: o.型(ctx), デッキ名: `A1518-CB${o.n}-更新後`, 公開区分: 公開(), ...(o.リスト ? { カードリスト: o.リスト } : {}),
        ...(o.画像カードA ? { 画像用カード: 番号(ctx, "〔カードID-A1518-共有A〕") } : {}),
      }, `組合せ ${o.n}`);
    });
    await ctx.step(3, async () => { note(要点(r)); });
    await ctx.step(4, async () => { 後 = デッキの内容を読む(id); });
    await ctx.step(5, async () => { 後の下書き = (await 取得したデッキ名(ctx.page, token, id)).デッキ名 === "下書き"; note(`更新のあとの一時保存: ${後の下書き ? "あり" : "なし"}`); });
    await ctx.expected(async () => {
      expect.soft(前の下書き, `手順1の一時保存（${o.下書きあり ? "あり" : "なし"}）`).toBe(o.下書きあり);
      expect.soft(r.ステータス, "HTTP ステータス").toBe(o.ステータス === 206 ? 206 : o.ステータス ?? 200);
      if (o.ステータス === 400) {
        expect.soft(後, "デッキの内容（手順1の記録から変わらない）").toEqual(前);
        expect.soft(後の下書き, `一時保存（${o.下書きあり ? "残る" : "無いまま"}）`).toBe(o.下書きあり);
        return;
      }
      expect.soft(r.json?.code, "処理結果コード").toBe(o.ステータス ?? 200);
      expect.soft(String(r.json?.deck_id ?? ""), "応答のデッキの識別子（更新したデッキ）").toBe(id);
      if (o.ステータス === 206) {
        expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck update success by import");
        expect.soft(行番号(r), "解読できない行の行番号").toEqual(o.行 ?? []);
      }
      expect.soft(後.明細, "デッキカード・メイビー・アトラクション・ステッカー（更新前の4区分のカードがなくなる）").toEqual(o.期待の明細 ?? []);
      expect.soft(後.画像カード名, "デッキ画像").toBe(o.期待の画像);
      expect.soft(後.画像カード名 !== 前.画像カード名, "デッキ画像が手順1の記録から変わる").toBe(true);
      expect.soft(後の下書き, "一時保存（削除される / 無いまま）").toBe(false);
    });
  };
}

caseTest("IT-A15-18-041", 組合せ({ n: "041", 型: 型B, 下書きあり: true, リスト: ["Commander", "1 結合試験カードA"], ステータス: 400, 期待の画像: "" }));
caseTest("IT-A15-18-042", 組合せ({ n: "042", 型: 型B, 下書きあり: false, リスト: ["Commander", "1 結合試験カードA"], ステータス: 400, 期待の画像: "" }));
caseTest("IT-A15-18-043", 組合せ({ n: "043", 型: 型C, 下書きあり: true, 画像カードA: true, 期待の画像: A }));
caseTest("IT-A15-18-044", 組合せ({ n: "044", 型: 型C, 下書きあり: false, リスト: ["1 結合試験カードB", "1 A1518-CB044-未登録カード"], 画像カードA: true, ステータス: 206, 行: [2], 期待の明細: 期待([B, 統率, 1]), 期待の画像: A }));
caseTest("IT-A15-18-046", 組合せ({ n: "046", 型: 型B, 下書きあり: false, 期待の画像: "" }));
caseTest("IT-A15-18-047", 組合せ({ n: "047", 型: 型C, 下書きあり: true, リスト: ["1 A1518-CB047-統率者", "1 A1518-CB047-未登録カード"], ステータス: 206, 行: [2], 期待の明細: 期待(["A1518-CB047-統率者", 統率, 1]), 期待の画像: "A1518-CB047-統率者" }));
caseTest("IT-A15-18-050", 組合せ({ n: "050", 型: 型C, 下書きあり: false, リスト: ["1 A1518-CB050-統率者", "1 A1518-CB050-未登録カード"], ステータス: 206, 行: [2], 期待の明細: 期待(["A1518-CB050-統率者", 統率, 1]), 期待の画像: "A1518-CB050-統率者" }));
caseTest("IT-A15-18-051", 組合せ({ n: "051", 型: 型C, 下書きあり: true, リスト: ["1 A1518-CB051-未登録カード", "Deck", "2 結合試験カードA"], ステータス: 206, 行: [1], 期待の明細: 期待([A, メイン, 2]), 期待の画像: "" }));
