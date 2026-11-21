/**
 * A15-17 デッキ登録インポート（デッキビルダーの API の POST /api/deck/import）。正本: cases/A15-17_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-17_progress_2026-11-21_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-02 と同じ）。アクセストークンは、シードの会員でログインの API から
 * 受け取る（署名鍵は使わない）。保存結果の確かめは、実行区分が「ブラウザ+DB確認」のケースの DB の参照（db/a15_17.ts）。
 * 023（デッキビルダーの画面）と 014（標準のトークン発行処理の呼び出しが要る）は書かない。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import {
  デッキ名の数, デッキのキャンペーンタグ, デッキの採用カード, デッキ画像のカード名, デッキを読む, プレイヤーのデッキ, 公開区分の番号, 採用カード,
} from "../../db/a15_17";
import { インポート要求, インポートする, ログインする, 署名を1文字変える, 応答 } from "../../pages/api/a15_17_deck_import";
import { 会員の定め } from "../../seeds/a15-17";
import "../../seeds/a15-17";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザからデッキ登録インポート API（POST /api/deck/import）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む";
const トークンの補い = "アクセストークンは、シード表のログインフォームの操作の代わりに、シードの会員でログインの API を呼んで受け取った（値は記録しない）";

const 領域 = { メイン: "メインボード", サイド: "サイドボード", 統率: "統率領域" } as const;
const A = "結合試験カードA", B = "結合試験カードB", C = "結合試験カードC";
const 期待のカード = (...x: [string, string, number][]): 採用カード[] => x.map(([カード名, 領域, 枚数]) => ({ カード名, 領域, 枚数 }));
const 整える = (xs: 採用カード[]): string[] => xs.map((x) => `${x.カード名}｜${x.領域}｜${x.枚数}枚`).sort();

const 番号 = (ctx: CaseCtx, 呼び名: string): string => ctx.notes.get(呼び名);
const 型A = (ctx: CaseCtx) => 番号(ctx, "〔フォーマットID-A1517-共有A〕");
const 型B = (ctx: CaseCtx) => 番号(ctx, "〔フォーマットID-A1517-共有B〕");
const 選手 = (ctx: CaseCtx, n: string) => 番号(ctx, `〔プレイヤーID-A1517-${n}〕`);
const 公開 = () => 公開区分の番号("公開");

/** シードの会員でログインしてアクセストークンを受け取る */
async function トークンを受け取る(ctx: CaseCtx, n: string): Promise<string> {
  const 定め = 会員の定め[n];
  if (!定め) throw new Error(`会員 ${n} の定めが無い`);
  const { token, 応答 } = await ログインする(ctx.page, 定め.メール, 定め.パスワード);
  supplement(トークンの補い);
  note(`ログイン: POST /api/user/login・応答 HTTP ${応答.ステータス}`);
  if (!token) throw new Error(`ログインの API がアクセストークンを返さない（HTTP ${応答.ステータス} ${応答.本文}）`);
  return token;
}

/** 要求を送って、応答の要点を注記に残す */
async function 送る(ctx: CaseCtx, token: string | undefined, 要求: インポート要求, 何: string): Promise<応答> {
  const r = await インポートする(ctx.page, token, 要求);
  note(`${何}: POST /api/deck/import${token !== undefined ? "（jwt-token 付き）" : "（jwt-token なし）"}・応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 600)}`);
  return r;
}

const デッキ番号 = (r: 応答): string => String(r.json?.deck_id ?? "");

/** プレイヤーが持つ、そのデッキ名のデッキの番号（ちょうど1件であること） */
function 一件のデッキ(プレイヤーID: string, 名: string): string {
  const d = プレイヤーのデッキ(プレイヤーID, 名);
  expect.soft(d.length, `プレイヤーのデッキ「${名}」の件数`).toBe(1);
  return d[0]?.番号 ?? "";
}

/** 029〜039 と同じ型: ログインして1件登録し、応答と保存された採用カードを確かめる */
function 一件登録する(o: {
  会員: string; 型: (ctx: CaseCtx) => string; デッキ名: string; リスト: string[];
  ステップ: { 初め: number; 登録: number; 応答: number; DB: number };
  期待ステータス: 200 | 206; 解読できない行?: number[]; 期待カード: 採用カード[]; 成功メッセージ?: boolean;
}) {
  return async (ctx: CaseCtx): Promise<void> => {
    let token = ""; let r!: 応答;
    await ctx.step(o.ステップ.初め, async () => { note(開発者ツールの代わり); });
    await ctx.step(2, async () => { token = await トークンを受け取る(ctx, o.会員); });
    await ctx.step(o.ステップ.登録, async () => {
      r = await 送る(ctx, token, { フォーマット: o.型(ctx), デッキ名: o.デッキ名, 公開区分: 公開(), カードリスト: o.リスト }, o.デッキ名);
    });
    await ctx.step(o.ステップ.応答, async () => { note(`応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}`); });
    let id = "";
    await ctx.step(o.ステップ.DB, async () => { id = 一件のデッキ(選手(ctx, o.会員), o.デッキ名); });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(o.期待ステータス);
      if (o.期待ステータス === 206) {
        expect.soft(r.json?.code, "処理結果コード").toBe(206);
        if (o.成功メッセージ) expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck registration success by import");
        expect.soft(String(r.json?.deck_id ?? "") !== "", "応答にデッキの識別子が含まれる").toBe(true);
        expect.soft(((r.json?.errors as unknown[]) ?? []).map(Number), "解読できない行の行番号").toEqual(o.解読できない行);
      }
      expect.soft(id !== "" && id === デッキ番号(r), "登録されたデッキが応答のデッキの識別子と同じ").toBe(true);
      expect.soft(整える(デッキの採用カード(id)), `デッキ「${o.デッキ名}」の採用カード`).toEqual(整える(o.期待カード));
    });
  };
}

// ---------------------------------------------------------------------------
// 001 正常登録
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-001", async (ctx) => {
  let token = ""; let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "001"); });
  await ctx.step(3, async () => {
    r = await 送る(ctx, token, {
      フォーマット: 型A(ctx), カードリスト: ["2 結合試験カードA", "1 結合試験カードB"], デッキ名: "正常登録デッキ", 公開区分: 公開(),
      アーキタイプ: 番号(ctx, "〔アーキタイプID-A1517-共有〕"), 画像用カード: 番号(ctx, "〔カードID-A1517-共有A〕"),
      キャンペーンタグ: 番号(ctx, "〔キャンペーンタグID-A1517-共有A〕"),
    }, "正常登録デッキ");
  });
  await ctx.step(4, async () => { note(`応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・結果メッセージ ${JSON.stringify(r.json?.message)}・デッキの識別子 ${JSON.stringify(r.json?.deck_id)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(r.json?.code, "処理結果コード").toBe(200);
    expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck registration success by import");
    expect.soft(デッキ番号(r) !== "", "応答に登録したデッキの識別子が含まれる").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 002 デッキ識別子なし・同名の既存デッキは変更せず新規登録
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-002", async (ctx) => {
  let token = ""; let r!: 応答;
  const 既存 = 番号(ctx, "〔デッキID-A1517-002〕");
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "002A"); });
  await ctx.step(3, async () => {
    r = await 送る(ctx, token, {
      フォーマット: 型A(ctx), カードリスト: ["2 結合試験カードA", "1 結合試験カードB"], デッキ名: "既存同名デッキ", 公開区分: 公開(),
      アーキタイプ: 番号(ctx, "〔アーキタイプID-A1517-共有〕"), 画像用カード: 番号(ctx, "〔カードID-A1517-共有A〕"),
      キャンペーンタグ: 番号(ctx, "〔キャンペーンタグID-A1517-共有A〕"),
    }, "既存同名デッキ");
  });
  const 新 = { 番号: "" };
  await ctx.step(4, async () => { 新.番号 = デッキ番号(r); note(`応答 HTTP ${r.ステータス}・新しいデッキの識別子 ${新.番号}`); });
  await ctx.expected(async () => {
    const 前 = デッキを読む(既存);
    expect.soft(前?.プレイヤー, "既存デッキの持ち主（変更されない）").toBe(選手(ctx, "002B"));
    expect.soft(前?.公開区分, "既存デッキの公開区分（非公開のまま）").toBe(公開区分の番号("非公開"));
    expect.soft(整える(デッキの採用カード(既存)), "既存デッキの採用カード（変更されない）").toEqual(整える(期待のカード([A, 領域.メイン, 1])));
    expect.soft(新.番号 !== "" && 新.番号 !== 既存, "別の識別子を持つ新規デッキが登録された").toBe(true);
    const 後 = デッキを読む(新.番号);
    expect.soft(後?.プレイヤー, "新規デッキの持ち主").toBe(選手(ctx, "002A"));
    expect.soft(後?.名前, "新規デッキのデッキ名").toBe("既存同名デッキ");
    expect.soft(後?.公開区分, "新規デッキの公開区分").toBe(公開());
    expect.soft(後?.フォーマット, "新規デッキのフォーマット").toBe(型A(ctx));
    expect.soft(後?.アーキタイプ, "新規デッキのアーキタイプ").toBe(番号(ctx, "〔アーキタイプID-A1517-共有〕"));
    expect.soft(デッキ画像のカード名(新.番号), "新規デッキのデッキ画像用カード").toBe(A);
    expect.soft(デッキのキャンペーンタグ(新.番号), "新規デッキのキャンペーンタグ").toEqual(["結合試験キャンペーンA"]);
    expect.soft(整える(デッキの採用カード(新.番号)), "新規デッキの採用カード（2件）").toEqual(整える(期待のカード([A, 領域.メイン, 2], [B, 領域.メイン, 1])));
  });
});

// ---------------------------------------------------------------------------
// 003 キャンペーンタグを配列で指定
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-003", async (ctx) => {
  let token = ""; let r!: 応答; let id = "";
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "003"); });
  await ctx.step(3, async () => {
    r = await 送る(ctx, token, {
      フォーマット: 型A(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "タグ配列登録デッキ", 公開区分: 公開(),
      キャンペーンタグ: [番号(ctx, "〔キャンペーンタグID-A1517-共有A〕"), 番号(ctx, "〔キャンペーンタグID-A1517-共有B〕")],
    }, "タグ配列登録デッキ");
  });
  await ctx.step(4, async () => { id = 一件のデッキ(選手(ctx, "003"), "タグ配列登録デッキ"); });
  await ctx.expected(async () => {
    expect.soft(デッキのキャンペーンタグ(id), "デッキに紐付いたキャンペーンタグ").toEqual(["結合試験キャンペーンA", "結合試験キャンペーンB"]);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 004 カードリスト未指定・空
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-004", async (ctx) => {
  let token = "";
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "004");
    await 送る(ctx, token, { フォーマット: 型A(ctx), デッキ名: "カードリスト未指定", 公開区分: 公開() }, "カードリスト未指定");
  });
  await ctx.step(3, async () => {
    await 送る(ctx, token, { フォーマット: 型A(ctx), デッキ名: "カードリスト空", 公開区分: 公開(), カードリスト: "" }, "カードリスト空");
  });
  const ids: string[] = [];
  await ctx.step(4, async () => {
    ids.push(一件のデッキ(選手(ctx, "004"), "カードリスト未指定"), 一件のデッキ(選手(ctx, "004"), "カードリスト空"));
  });
  await ctx.expected(async () => {
    expect.soft(ids.every((i) => i !== ""), "「カードリスト未指定」と「カードリスト空」の2件が新規デッキとして保存された").toBe(true);
    expect.soft(ids.map((i) => デッキの採用カード(i).length), "各デッキの採用カードの件数").toEqual([0, 0]);
  });
});

// ---------------------------------------------------------------------------
// 005 カードリスト500行
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-005", async (ctx) => {
  let token = ""; let r!: 応答; let id = "";
  const リスト = Array.from({ length: 500 }, (_, i) => `1 上限試験カード${String(i + 1).padStart(3, "0")}`);
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "005");
    r = await 送る(ctx, token, { フォーマット: 型A(ctx), デッキ名: "500行デッキ", 公開区分: 公開(), カードリスト: リスト }, "500行デッキ");
  });
  await ctx.step(3, async () => { id = 一件のデッキ(選手(ctx, "005"), "500行デッキ"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(id !== "", "デッキ「500行デッキ」が保存された").toBe(true);
    expect.soft(デッキの採用カード(id).length, "採用カードの件数").toBe(500);
  });
});

// ---------------------------------------------------------------------------
// 008・009 解読できない行を含む（部分的な成功）
// ---------------------------------------------------------------------------
const 部分リスト = ["1 存在しないカードX", "2 結合試験カードA", "1 存在しないカードY"];

caseTest("IT-A15-17-008", async (ctx) => {
  let token = ""; let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "008");
    r = await 送る(ctx, token, { フォーマット: 型A(ctx), デッキ名: "部分解読デッキ", 公開区分: 公開(), カードリスト: 部分リスト }, "部分解読デッキ");
  });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・結果コード ${JSON.stringify(r.json?.code)}・解読できない行 ${JSON.stringify(r.json?.errors)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(206);
    expect.soft(r.json?.code, "処理結果コード").toBe(206);
    expect.soft(r.json?.message, "処理結果メッセージ").toBe("Deck registration success by import");
    expect.soft(デッキ番号(r) !== "", "応答に登録したデッキの識別子が含まれる").toBe(true);
    expect.soft(((r.json?.errors as unknown[]) ?? []).map(Number), "解読できない行の行番号").toEqual([1, 3]);
  });
});

caseTest("IT-A15-17-009", async (ctx) => {
  let token = ""; let id = "";
  await ctx.step(1, async () => {
    note(開発者ツールの代わり);
    token = await トークンを受け取る(ctx, "009");
    await 送る(ctx, token, { フォーマット: 型A(ctx), デッキ名: "部分保存確認デッキ", 公開区分: 公開(), カードリスト: 部分リスト }, "部分保存確認デッキ");
  });
  await ctx.step(2, async () => { id = 一件のデッキ(選手(ctx, "009"), "部分保存確認デッキ"); });
  await ctx.expected(async () => {
    expect.soft(id !== "", "デッキ「部分保存確認デッキ」が登録された").toBe(true);
    expect.soft(整える(デッキの採用カード(id)), "採用カード（解読できた結合試験カードAだけ）").toEqual(整える(期待のカード([A, 領域.メイン, 2])));
  });
});

// ---------------------------------------------------------------------------
// 010・011 限定公開の表示用トークン
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-010", async (ctx) => {
  let token = ""; let r!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "010");
    r = await 送る(ctx, token, { フォーマット: 型A(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "限定公開デッキ", 公開区分: 公開区分の番号("限定公開") }, "限定公開デッキ");
  });
  await ctx.step(3, async () => { note(`応答 HTTP ${r.ステータス}・デッキの識別子 ${JSON.stringify(r.json?.deck_id)}・表示用トークンの有無 ${"display_token" in (r.json ?? {})}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(デッキ番号(r) !== "", "応答に登録したデッキの識別子が含まれる").toBe(true);
    expect.soft(typeof r.json?.display_token === "string" && (r.json?.display_token as string) !== "", "応答に表示用トークンが含まれる").toBe(true);
  });
});

caseTest("IT-A15-17-011", async (ctx) => {
  let token = ""; let 公開応答!: 応答; let 非公開応答!: 応答;
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => {
    token = await トークンを受け取る(ctx, "011");
    公開応答 = await 送る(ctx, token, { フォーマット: 型A(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "公開デッキ", 公開区分: 公開区分の番号("公開") }, "公開デッキ");
  });
  await ctx.step(3, async () => {
    非公開応答 = await 送る(ctx, token, { フォーマット: 型A(ctx), カードリスト: ["1 結合試験カードA"], デッキ名: "非公開デッキ", 公開区分: 公開区分の番号("非公開") }, "非公開デッキ");
  });
  await ctx.step(4, async () => { note(`公開デッキ: HTTP ${公開応答.ステータス}・表示用トークンの有無 ${"display_token" in (公開応答.json ?? {})} ／ 非公開デッキ: HTTP ${非公開応答.ステータス}・表示用トークンの有無 ${"display_token" in (非公開応答.json ?? {})}`); });
  await ctx.expected(async () => {
    expect.soft("display_token" in (公開応答.json ?? {}), "「公開デッキ」の応答に表示用トークンが含まれる").toBe(false);
    expect.soft("display_token" in (非公開応答.json ?? {}), "「非公開デッキ」の応答に表示用トークンが含まれる").toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 012・013 認証に失敗する要求は登録されない
// ---------------------------------------------------------------------------
function 認証失敗(n: "012" | "013", デッキ名: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    let 前 = 0; let r!: 応答; let 後 = 0;
    await ctx.step(1, async () => { 前 = デッキ名の数(デッキ名); note(`送信の前のデッキ名「${デッキ名}」の件数: ${前}`); });
    if (n === "013") {
      let token = "";
      await ctx.step(2, async () => {
        token = 署名を1文字変える(await トークンを受け取る(ctx, "013"));
        note("アクセストークンの署名の部分の末尾の1文字を変えた（値は記録しない）");
      });
      await ctx.step(3, async () => {
        r = await 送る(ctx, token, { フォーマット: 型A(ctx), カードリスト: ["1 結合試験カードA"], デッキ名, 公開区分: 公開() }, デッキ名);
      });
    } else {
      await ctx.step(2, async () => {
        note(開発者ツールの代わり);
        r = await 送る(ctx, undefined, { フォーマット: 型A(ctx), カードリスト: ["1 結合試験カードA"], デッキ名, 公開区分: 公開() }, デッキ名);
      });
    }
    await ctx.step(n === "013" ? 4 : 3, async () => { 後 = デッキ名の数(デッキ名); note(`応答 HTTP ${r.ステータス}・結果メッセージ ${JSON.stringify(r.json?.message)}・送信の後のデッキ名「${デッキ名}」の件数: ${後}`); });
    await ctx.expected(async () => {
      expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
      expect.soft(r.json !== null && "code" in r.json, "応答に処理結果コードが含まれる").toBe(true);
      expect.soft(["Access Token is incorrect", "Authentication failed"], "処理結果メッセージ（どちらか）").toContain(r.json?.message);
      expect.soft(後, `デッキ名「${デッキ名}」の件数（送信の前から増加しない。前は ${前} 件）`).toBe(前);
    });
  };
}
caseTest("IT-A15-17-012", 認証失敗("012", "トークン欠落デッキ"));
caseTest("IT-A15-17-013", 認証失敗("013", "署名不正デッキ"));

// ---------------------------------------------------------------------------
// 017 統率者の有効・無効なフォーマットでの解読
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-017", async (ctx) => {
  let token = "";
  await ctx.step(1, async () => {
    token = await トークンを受け取る(ctx, "017");
    await 送る(ctx, token, { フォーマット: 型B(ctx), デッキ名: "統率者有効解読", 公開区分: 公開(), カードリスト: ["1 結合試験カードC", "", "2 結合試験カードA", "", "1 結合試験カードB"] }, "統率者有効解読");
  });
  await ctx.step(2, async () => {
    await 送る(ctx, token, { フォーマット: 型A(ctx), デッキ名: "統率者無効解読", 公開区分: 公開(), カードリスト: ["2 結合試験カードA", "", "1 結合試験カードB"] }, "統率者無効解読");
  });
  let 有効 = ""; let 無効 = "";
  await ctx.step(3, async () => { 有効 = 一件のデッキ(選手(ctx, "017"), "統率者有効解読"); 無効 = 一件のデッキ(選手(ctx, "017"), "統率者無効解読"); });
  await ctx.expected(async () => {
    expect.soft(整える(デッキの採用カード(有効)), "「統率者有効解読」の採用カード").toEqual(整える(期待のカード([C, 領域.統率, 1], [A, 領域.メイン, 2], [B, 領域.サイド, 1])));
    expect.soft(整える(デッキの採用カード(無効)), "「統率者無効解読」の採用カード").toEqual(整える(期待のカード([A, 領域.メイン, 2], [B, 領域.サイド, 1])));
  });
});

// ---------------------------------------------------------------------------
// 024〜026 見出しの英語・日本語の表記（2回ずつ要求）
// ---------------------------------------------------------------------------
/** 見出しの表記違いを、同じ会員で続けて登録し、保存された採用カードを見る */
function 見出しの表記(o: { 会員: string; 型: (ctx: CaseCtx) => string; 登録: { 名: string; リスト: string[] }[]; 期待: 採用カード[] }) {
  return async (ctx: CaseCtx): Promise<void> => {
    let token = "";
    await ctx.step(1, async () => { token = await トークンを受け取る(ctx, o.会員); });
    for (let i = 0; i < o.登録.length; i++) {
      await ctx.step(2 + i, async () => {
        await 送る(ctx, token, { フォーマット: o.型(ctx), デッキ名: o.登録[i].名, 公開区分: 公開(), カードリスト: o.登録[i].リスト }, o.登録[i].名);
      });
    }
    const ids: string[] = [];
    await ctx.step(2 + o.登録.length, async () => { for (const x of o.登録) ids.push(一件のデッキ(選手(ctx, o.会員), x.名)); });
    await ctx.expected(async () => {
      for (let i = 0; i < o.登録.length; i++) {
        expect.soft(整える(デッキの採用カード(ids[i])), `デッキ「${o.登録[i].名}」の採用カード`).toEqual(整える(o.期待));
      }
    });
  };
}

caseTest("IT-A15-17-024", 見出しの表記({
  会員: "024", 型: 型B,
  登録: [
    { 名: "A1517-024-Deck", リスト: ["1 結合試験カードC", "Deck", "2 結合試験カードA"] },
    { 名: "A1517-024-デッキ", リスト: ["1 結合試験カードC", "デッキ", "2 結合試験カードA"] },
  ],
  期待: 期待のカード([C, 領域.統率, 1], [A, 領域.メイン, 2]),
}));

caseTest("IT-A15-17-025", 見出しの表記({
  会員: "025", 型: 型A,
  登録: ["Sideboard", "サイドボード", "相棒", "Companion"].map((見出し) => ({ 名: `A1517-025-${見出し}`, リスト: ["1 結合試験カードA", 見出し, "1 結合試験カードB"] })),
  期待: 期待のカード([A, 領域.メイン, 1], [B, 領域.サイド, 1]),
}));

caseTest("IT-A15-17-026", 見出しの表記({
  会員: "026", 型: 型B,
  登録: [
    { 名: "A1517-026-Commander", リスト: ["Deck", "2 結合試験カードA", "Commander", "1 結合試験カードC"] },
    { 名: "A1517-026-統率者", リスト: ["Deck", "2 結合試験カードA", "統率者", "1 結合試験カードC"] },
  ],
  期待: 期待のカード([A, 領域.メイン, 2], [C, 領域.統率, 1]),
}));

// ---------------------------------------------------------------------------
// 027・028 統率者を使えないフォーマットに統率者の見出し
// ---------------------------------------------------------------------------
const 統率の要求 = (ctx: CaseCtx, 名: string, 見出し: string): インポート要求 => ({ フォーマット: 型A(ctx), デッキ名: 名, 公開区分: 公開(), カードリスト: [見出し, "1 結合試験カードA"] });

caseTest("IT-A15-17-027", async (ctx) => {
  let token = ""; let 英!: 応答; let 日!: 応答;
  await ctx.step(1, async () => { token = await トークンを受け取る(ctx, "027"); });
  await ctx.step(2, async () => { 英 = await 送る(ctx, token, 統率の要求(ctx, "A1517-027-Commander", "Commander"), "A1517-027-Commander"); });
  await ctx.step(3, async () => { 日 = await 送る(ctx, token, 統率の要求(ctx, "A1517-027-統率者", "統率者"), "A1517-027-統率者"); });
  await ctx.step(4, async () => { note(`1回目: HTTP ${英.ステータス}・メッセージ ${JSON.stringify(英.json?.message)} ／ 2回目: HTTP ${日.ステータス}・メッセージ ${JSON.stringify(日.json?.message)}`); });
  await ctx.expected(async () => {
    for (const [名, r] of [["A1517-027-Commander", 英], ["A1517-027-統率者", 日]] as const) {
      expect.soft(r.ステータス, `「${名}」の HTTP ステータス`).toBe(400);
      expect.soft(r.json !== null && "code" in r.json, `「${名}」の応答に処理結果コードが含まれる`).toBe(true);
      expect.soft(typeof r.json?.message === "string" && (r.json?.message as string) !== "", `「${名}」の応答に検証エラーメッセージが含まれる`).toBe(true);
    }
  });
});

caseTest("IT-A15-17-028", async (ctx) => {
  const 名 = ["A1517-028-Commander", "A1517-028-統率者"];
  let 前: number[] = []; let token = "";
  await ctx.step(1, async () => { 前 = 名.map(デッキ名の数); note(`送信の前の件数: ${名.map((n, i) => `${n}=${前[i]}`).join(" / ")}`); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "028"); });
  await ctx.step(3, async () => { await 送る(ctx, token, 統率の要求(ctx, 名[0], "Commander"), 名[0]); });
  await ctx.step(4, async () => { await 送る(ctx, token, 統率の要求(ctx, 名[1], "統率者"), 名[1]); });
  let 後: number[] = [];
  await ctx.step(5, async () => { 後 = 名.map(デッキ名の数); note(`送信の後の件数: ${名.map((n, i) => `${n}=${後[i]}`).join(" / ")}`); });
  await ctx.expected(async () => {
    名.forEach((n, i) => expect.soft(後[i], `デッキ名「${n}」の件数（送信の前から増加しない。前は ${前[i]} 件）`).toBe(前[i]));
  });
});

// ---------------------------------------------------------------------------
// 029 同内容の再登録
// ---------------------------------------------------------------------------
caseTest("IT-A15-17-029", async (ctx) => {
  let token = ""; let 一回目 = ""; let 二回目 = "";
  const 要求 = (): インポート要求 => ({ フォーマット: 型A(ctx), カードリスト: ["2 結合試験カードA", "1 結合試験カードB"], デッキ名: "同内容再登録デッキ", 公開区分: 公開() });
  await ctx.step(1, async () => { note(開発者ツールの代わり); });
  await ctx.step(2, async () => { token = await トークンを受け取る(ctx, "029"); });
  await ctx.step(3, async () => { 一回目 = デッキ番号(await 送る(ctx, token, 要求(), "1回目")); });
  await ctx.step(4, async () => { 二回目 = デッキ番号(await 送る(ctx, token, 要求(), "2回目")); });
  let デッキ: ReturnType<typeof プレイヤーのデッキ> = [];
  await ctx.step(5, async () => { デッキ = プレイヤーのデッキ(選手(ctx, "029"), "同内容再登録デッキ"); });
  await ctx.expected(async () => {
    expect.soft(一回目 !== "" && 二回目 !== "" && 一回目 !== 二回目, `手順3と手順4の応答のデッキの識別子が互いに異なる（${一回目}・${二回目}）`).toBe(true);
    expect.soft(デッキ.length, "デッキ名「同内容再登録デッキ」のデッキの件数").toBe(2);
    expect.soft(デッキ.every((d) => d.プレイヤー === 選手(ctx, "029")), "どちらもこの会員のプレイヤーの所有").toBe(true);
    for (const d of デッキ) expect.soft(整える(デッキの採用カード(d.番号)), `デッキ ${d.番号} の採用カード`).toEqual(整える(期待のカード([A, 領域.メイン, 2], [B, 領域.メイン, 1])));
  });
});

// ---------------------------------------------------------------------------
// 030〜039 一行の不明・見出しと空行の組み合わせ
// ---------------------------------------------------------------------------
const 五手順 = { 初め: 1, 登録: 3, 応答: 4, DB: 5 };

caseTest("IT-A15-17-030", 一件登録する({
  会員: "030", 型: 型A, デッキ名: "一行不明デッキ", リスト: ["2 結合試験カードA", "1 存在しないカードA1517-030Z", "1 結合試験カードB"], ステップ: 五手順,
  期待ステータス: 206, 解読できない行: [2], 期待カード: 期待のカード([A, 領域.メイン, 2], [B, 領域.メイン, 1]),
}));

caseTest("IT-A15-17-031", 一件登録する({
  会員: "031", 型: 型B, デッキ名: "A1517-CB031-Deck", リスト: ["1 結合試験カードC", "1 存在しないカードA1517-CB031Z"], ステップ: 五手順,
  期待ステータス: 206, 解読できない行: [2], 成功メッセージ: true, 期待カード: 期待のカード([C, 領域.統率, 1]),
}));

/** 032〜039: 見出し・空行の組み合わせを登録し、保存された採用カードを見る */
caseTest("IT-A15-17-032", 一件登録する({ 会員: "032", 型: 型B, デッキ名: "A1517-CB032-Deck", リスト: ["1 結合試験カードC", "Deck", "2 結合試験カードA", "", "1 結合試験カードB"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([C, 領域.統率, 1], [A, 領域.メイン, 2], [B, 領域.サイド, 1]) }));
caseTest("IT-A15-17-033", 一件登録する({ 会員: "033", 型: 型B, デッキ名: "A1517-CB033-Deck", リスト: ["1 結合試験カードC", "", "2 結合試験カードA", "Sideboard", "1 結合試験カードB"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([C, 領域.統率, 1], [A, 領域.メイン, 2], [B, 領域.サイド, 1]) }));
caseTest("IT-A15-17-034", 一件登録する({ 会員: "034", 型: 型B, デッキ名: "A1517-CB034-Deck", リスト: ["1 結合試験カードC", "Sideboard", "1 結合試験カードB", "2 結合試験カードA"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([C, 領域.統率, 1], [B, 領域.サイド, 1], [A, 領域.サイド, 2]) }));
caseTest("IT-A15-17-035", 一件登録する({ 会員: "035", 型: 型B, デッキ名: "A1517-CB035-Deck", リスト: ["Commander", "1 結合試験カードC", "", "2 結合試験カードA"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([C, 領域.統率, 1], [A, 領域.メイン, 2]) }));
caseTest("IT-A15-17-036", 一件登録する({ 会員: "036", 型: 型B, デッキ名: "A1517-CB036-Deck", リスト: ["Commander", "1 結合試験カードC"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([C, 領域.統率, 1]) }));
caseTest("IT-A15-17-037", 一件登録する({ 会員: "037", 型: 型A, デッキ名: "A1517-CB037-Deck", リスト: ["Deck", "2 結合試験カードA", "", "1 結合試験カードB"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([A, 領域.メイン, 2], [B, 領域.サイド, 1]) }));
caseTest("IT-A15-17-038", 一件登録する({ 会員: "038", 型: 型A, デッキ名: "A1517-CB038-Deck", リスト: ["Deck", "2 結合試験カードA", "1 結合試験カードB"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([A, 領域.メイン, 2], [B, 領域.メイン, 1]) }));
caseTest("IT-A15-17-039", 一件登録する({ 会員: "039", 型: 型A, デッキ名: "A1517-CB039-Deck", リスト: ["1 結合試験カードA", "", "1 結合試験カードB", "Sideboard", "1 結合試験カードC"], ステップ: 五手順, 期待ステータス: 200, 期待カード: 期待のカード([A, 領域.メイン, 1], [B, 領域.メイン, 1], [C, 領域.サイド, 1]) }));
