/**
 * A15-13 デッキ情報検索（デッキビルダーの API の GET /api/decks）。正本: cases/A15-13_test_cases.tsv
 * 実装したケース（021）と、書かなかったケース（006）の理由は記録 review/A15-13_progress_2026-11-21_dev.md。
 *
 * 「ブラウザの開発者ツールで要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * API へ要求を送り、HTTP ステータスと応答本文（JSON）を読む（A15-17 と同じ）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { デッキを検索する, 検索の応答 } from "../../pages/api/a15_13_deck_search";
import { ログインする, 署名を1文字変える } from "../../pages/api/a15_17_deck_import";
import { カードの実番号, 型の番号, 会員の控えを読む } from "../../seeds/a15-13";
import { デッキの控え } from "../../db/a15_13";
import { CaseCtx } from "../../lib/case";
import "../../seeds/a15-13";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-A15-13-021", async ({ page, step, expected }) => {
  let r!: 検索の応答;
  await step(1, async () => {
    supplement("開発者ツールの代わりに、試験ブラウザからデッキ情報検索 API（GET /api/decks）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む");
  });
  await step(2, async () => {
    supplement("モードはケースが指定しないので省略（API の既定の公開）。フォーマットは API が受け取る配列の形（format[]）で、未登録のフォーマットID 13999 を送る");
    r = await デッキを検索する(page, { フォーマット: ["13999"] });
  });
  await step(3, async () => {
    note(`応答 HTTP ${r.ステータス}・総件数 ${JSON.stringify(r.json?.total_count)}・一覧の件数 ${Array.isArray(r.json?.decks) ? (r.json?.decks as unknown[]).length : "一覧なし"}・本文の先頭 ${r.本文.slice(0, 300)}`);
  });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(Array.isArray(r.json?.decks) ? (r.json?.decks as unknown[]).length : -1, "デッキ一覧の件数（空）").toBe(0);
    expect.soft(Number(r.json?.total_count), "総件数").toBe(0);
  });
});

const 認証エラー = (r: 検索の応答) => {
  const 文 = JSON.stringify(r.json ?? {});
  return { 本文に: /Access Token is incorrect|Authentication failed/.test(文), コード: Object.keys(r.json ?? {}).some((k) => /code/i.test(k)) };
};

caseTest("IT-A15-13-004", async ({ page, step, expected }) => {
  let r!: 検索の応答;
  await step(1, async () => { supplement("開発者ツールの代わりに、試験ブラウザからデッキ情報検索 API（GET /api/decks）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む"); });
  await step(2, async () => { r = await デッキを検索する(page, { モード: "private" }); });
  await step(3, async () => { note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(認証エラー(r).コード, "応答本文に処理結果コードが含まれる").toBe(true);
    expect.soft(認証エラー(r).本文に, "応答本文に「Access Token is incorrect」または「Authentication failed」が含まれる").toBe(true);
  });
});

caseTest("IT-A15-13-005", async ({ page, step, expected }) => {
  const a = 会員の控えを読む("A");
  let token = "";
  let r!: 検索の応答;
  await step(1, async () => {
    supplement("プレイヤーAの有効なトークンは、ログインの API で受け取った（メールアドレスは @ の前に「-E2E」を付けた試験会員。値は記録しない）");
    const l = await ログインする(page, a.メール, a.パスワード);
    if (!l.token) throw new Error(`ログインの API がアクセストークンを返さない（HTTP ${l.応答.ステータス}）`);
    token = 署名を1文字変える(l.token);
  });
  await step(2, async () => { r = await デッキを検索する(page, { モード: "private" }, token); });
  await step(3, async () => { note(`応答 HTTP ${r.ステータス}・本文 ${r.本文.slice(0, 300)}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(401);
    expect.soft(認証エラー(r).コード, "応答本文に処理結果コードが含まれる").toBe(true);
    expect.soft(認証エラー(r).本文に, "応答本文に「Access Token is incorrect」または「Authentication failed」が含まれる").toBe(true);
  });
});

caseTest("IT-A15-13-007", async ({ page, step, expected }) => {
  let r!: 検索の応答;
  await step(1, async () => { supplement("開発者ツールの代わりに、試験ブラウザからデッキ情報検索 API（GET /api/decks）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む"); });
  await step(2, async () => { r = await デッキを検索する(page, { 大会デッキ: "0", ユーザーデッキ: "false" }); });
  await step(3, async () => { note(`応答 HTTP ${r.ステータス}・総件数 ${JSON.stringify(r.json?.total_count)}・本文の先頭 ${r.本文.slice(0, 300)}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(Array.isArray(r.json?.decks) ? (r.json?.decks as unknown[]).length : -1, "デッキ一覧の件数（空）").toBe(0);
    expect.soft(Number(r.json?.total_count), "総件数").toBe(0);
  });
});

// ---- 共有のシードを使うケースと、ケース専用の会員・デッキを使うケース ----
const デバッグ代わり = "開発者ツールの代わりに、試験ブラウザからデッキ情報検索 API（GET /api/decks）へ要求を送り、応答の HTTP ステータスと本文（JSON）を読む";
const 利用者IDの補い = "デッキ利用者ID は8文字までの列でシード表の値が入らないので、シードが実行の印から作った8文字までの値に読み替えて指定した（前方一致の関係は保っている）";
type 一覧 = { id?: number; deck_user_id?: string; nickname?: string; display_token?: string; deck_name?: string };
const 件 = (r: 検索の応答): 一覧[] => ((r.json?.decks ?? []) as 一覧[]);
const 番号たち = (r: 検索の応答): string[] => 件(r).map((d) => String(d.id));
const 総件数 = (r: 検索の応答): number => Number(r.json?.total_count);
const id = (ctx: CaseCtx, 呼び名: string) => ctx.notes.get(`〔デッキID-A1513-${呼び名}〕`);

async function トークンを受ける(ctx: CaseCtx, キー: string, 改ざん = false): Promise<string> {
  const m = 会員の控えを読む(キー);
  const l = await ログインする(ctx.page, m.メール, m.パスワード);
  if (!l.token) throw new Error(`ログインの API がアクセストークンを返さない（HTTP ${l.応答.ステータス}）`);
  supplement("有効なトークンは、テスト用認証データ作成機構の代わりに、シードの会員でログインの API を呼んで受け取った（値は記録しない）");
  return 改ざん ? 署名を1文字変える(l.token) : l.token;
}

/** 手順1が「開発者ツールを開く」で、手順2が要求、手順3が確認の形（トークンの改ざんが手順1に入るケースは別に書く） */
async function 検索する(ctx: CaseCtx, 条件: Parameters<typeof デッキを検索する>[1], token?: string, 開始: number = 1): Promise<検索の応答> {
  let r!: 検索の応答;
  await ctx.step(開始, async () => { supplement(デバッグ代わり); });
  await ctx.step(開始 + 1, async () => { r = await デッキを検索する(ctx.page, 条件, token); });
  await ctx.step(開始 + 2, async () => { note(`応答 HTTP ${r.ステータス}・総件数 ${JSON.stringify(r.json?.total_count)}・本文の先頭 ${r.本文.slice(0, 400)}`); });
  return r;
}

caseTest("IT-A15-13-003", async (ctx) => {
  const token = await トークンを受ける(ctx, "A");
  const r = await 検索する(ctx, { モード: "private" }, token);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(番号たち(r).sort(), "プレイヤーAが所有するデッキ（共有D・共有C）だけが返る").toEqual([id(ctx, "共有D"), id(ctx, "共有C")].sort());
    for (const d of 件(r)) expect.soft(Object.keys(d), `デッキ ${d.id} に display_token が含まれる`).toContain("display_token");
  });
});
caseTest("IT-A15-13-011", async (ctx) => {
  supplement(利用者IDの補い);
  const r = await 検索する(ctx, { 追加: [["user_id", 会員の控えを読む("A").利用者ID]] });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(番号たち(r), "デッキ利用者IDが完全一致する公開デッキ（共有C）だけが返る").toEqual([id(ctx, "共有C")]);
    expect.soft(番号たち(r), "前方一致のデッキ利用者IDのデッキ（共有F）は返らない").not.toContain(id(ctx, "共有F"));
  });
});
caseTest("IT-A15-13-017", async (ctx) => {
  supplement("カード 13501・13502 は、実行の印つきの名前で作ったカードの番号（画面が振った番号）に読み替えた");
  const r = await 検索する(ctx, { 追加: [["cards[0][card_id]", カードの実番号("13501")], ["cards[0][board_id]", "1"], ["cards[1][card_id]", カードの実番号("13502")], ["cards[1][board_id]", "2"]] });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(番号たち(r), "指定したカードとボードの組を両方持つデッキ（共有A）だけが返る").toEqual([id(ctx, "共有A")]);
  });
});
caseTest("IT-A15-13-023", async (ctx) => {
  supplement(利用者IDの補い);
  const token = await トークンを受ける(ctx, "A");
  const r = await 検索する(ctx, { モード: "private", フォーマット: [型の番号({ 名日: "所有者検索用フォーマット" })] }, token);
  await ctx.expected(async () => {
    const d = 件(r)[0];
    expect.soft(番号たち(r), "プレイヤーAが所有するデッキ（共有D）だけが返る").toEqual([id(ctx, "共有D")]);
    expect.soft(d?.deck_user_id, "deck_user_id").toBe(会員の控えを読む("A").利用者ID);
    expect.soft(d?.nickname, "nickname").toBe("プレイヤーA");
    expect.soft(d?.display_token, "display_token").toBe(`display-${id(ctx, "共有D")}`);
  });
});
caseTest("IT-A15-13-025", async (ctx) => {
  const { step } = ctx;
  const 番号 = ["共有A", "共有B", "共有C", "共有D", "共有E", "共有F", "共有G"].map((k) => id(ctx, k));
  let 前: string[] = [], 後: string[] = [];
  let r!: 検索の応答;
  await step(1, async () => { 前 = デッキの控え(番号); note(`検索の前のデッキ ${前.length} 件を DB で控えた`); });
  await step(2, async () => { supplement(デバッグ代わり); r = await デッキを検索する(ctx.page, {}); });
  await step(3, async () => { 後 = デッキの控え(番号); note(`応答 HTTP ${r.ステータス}・検索のあとのデッキ ${後.length} 件を DB で確かめた`); });
  await ctx.expected(async () => {
    expect.soft(前.length, "控えたデッキの件数（7件）").toBe(7);
    expect.soft(後.length, "検索のあとのデッキの件数").toBe(前.length);
    expect.soft(後, "検索の前後で各デッキの値が変わらない").toEqual(前);
  });
});
caseTest("IT-A15-13-032", async (ctx) => {
  supplement(利用者IDの補い);
  const r = await 検索する(ctx, { 追加: [["user_id", 会員の控えを読む("032").利用者ID], ["regulation_violation_flag", "true"]] });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(2);
    expect.soft(番号たち(r), "レギュレーション違反（032B）・違反でない（032A）の順（作成日時の降順）").toEqual([id(ctx, "032B"), id(ctx, "032A")]);
  });
});
caseTest("IT-A15-13-033", async (ctx) => {
  supplement(利用者IDの補い);
  const u = 会員の控えを読む("033").利用者ID;
  const rs: 検索の応答[] = [];
  await ctx.step(1, async () => { supplement(デバッグ代わり); });
  for (const [i, [k, v]] of ([["champion_flag", ""], ["champion_flag", "0"], ["top8_flag", ""], ["top8_flag", "0"]] as [string, string][]).entries()) {
    await ctx.step(i + 2, async () => { rs.push(await デッキを検索する(ctx.page, { 追加: [["user_id", u], [k, v]] })); });
  }
  await ctx.step(6, async () => { note(rs.map((r) => `HTTP ${r.ステータス}・総件数 ${JSON.stringify(r.json?.total_count)}`).join(" / ")); });
  await ctx.expected(async () => {
    for (const [i, r] of rs.entries()) {
      expect.soft(r.ステータス, `HTTP ステータス（${i + 1}回目）`).toBe(200);
      expect.soft(総件数(r), `総件数（${i + 1}回目）`).toBe(3);
      expect.soft(番号たち(r), `順位で絞り込まず 033C・033B・033A の順（${i + 1}回目）`).toEqual([id(ctx, "033C"), id(ctx, "033B"), id(ctx, "033A")]);
    }
  });
});
caseTest("IT-A15-13-034", async (ctx) => {
  supplement(利用者IDの補い);
  const r = await 検索する(ctx, { 大会デッキ: "false", 追加: [["user_id", 会員の控えを読む("034").利用者ID]] });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(1);
    expect.soft(番号たち(r), "大会デッキ（034A）が除外され、ユーザーデッキ（034B）だけが返る").toEqual([id(ctx, "034B")]);
  });
});
caseTest("IT-A15-13-037", async (ctx) => {
  supplement(利用者IDの補い);
  const r = await 検索する(ctx, { 追加: [["user_id", 会員の控えを読む("037").利用者ID], ["top8_flag", "1"]] });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(1);
    expect.soft(番号たち(r), "順位8（037A）だけが返り、順位9（037B）は返らない").toEqual([id(ctx, "037A")]);
  });
});
caseTest("IT-A15-13-038", async (ctx) => {
  supplement(利用者IDの補い);
  const token = await トークンを受ける(ctx, "A");
  const r = await 検索する(ctx, { モード: "public", 追加: [["user_id", 会員の控えを読む("CB038").利用者ID]] }, token);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(1);
    expect.soft(番号たち(r), "別のプレイヤーの公開デッキだけが返る").toEqual([id(ctx, "CB038")]);
    expect.soft(Object.keys(件(r)[0] ?? {}), "display_token を含まない").not.toContain("display_token");
  });
});
caseTest("IT-A15-13-039", async (ctx) => {
  supplement(利用者IDの補い);
  let token = "";
  let r!: 検索の応答;
  await ctx.step(1, async () => { token = await トークンを受ける(ctx, "CB039", true); });
  await ctx.step(2, async () => { supplement(デバッグ代わり); });
  await ctx.step(3, async () => { r = await デッキを検索する(ctx.page, { モード: "public", 追加: [["user_id", 会員の控えを読む("CB039").利用者ID]] }, token); });
  await ctx.step(4, async () => { note(`応答 HTTP ${r.ステータス}・総件数 ${JSON.stringify(r.json?.total_count)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(1);
    expect.soft(番号たち(r), "トークンの持ち主本人の公開デッキだけが返る").toEqual([id(ctx, "CB039")]);
  });
});
caseTest("IT-A15-13-040", async (ctx) => {
  supplement(利用者IDの補い);
  const r = await 検索する(ctx, { モード: "public", 追加: [["user_id", 会員の控えを読む("CB040").利用者ID]] });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(1);
    expect.soft(番号たち(r), "公開デッキ（CB040A）だけが返る").toEqual([id(ctx, "CB040A")]);
    expect.soft(番号たち(r), "非公開（CB040B）・限定公開（CB040C）は返らない").not.toContain(id(ctx, "CB040B"));
  });
});
caseTest("IT-A15-13-041", async (ctx) => {
  supplement(利用者IDの補い);
  const token = await トークンを受ける(ctx, "CB041");
  const r = await 検索する(ctx, { モード: "private", 追加: [["user_id", 会員の控えを読む("CB041").利用者ID]] }, token);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(1);
    expect.soft(Object.keys(件(r)[0] ?? {}), "限定公開トークンの項目（display_token）が含まれる").toContain("display_token");
    expect.soft(番号たち(r), "本人が所有する公開デッキだけが返る").toEqual([id(ctx, "CB041")]);
  });
});
caseTest("IT-A15-13-042", async (ctx) => {
  supplement(利用者IDの補い);
  const token = await トークンを受ける(ctx, "CB042");
  const r = await 検索する(ctx, { モード: "private", 追加: [["user_id", 会員の控えを読む("CB042").利用者ID]] }, token);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(2);
    expect.soft(番号たち(r).sort(), "非公開（CB042A）と限定公開（CB042B）が返る").toEqual([id(ctx, "CB042A"), id(ctx, "CB042B")].sort());
    expect.soft(件(r).find((d) => String(d.id) === id(ctx, "CB042B"))?.display_token, "CB042B の display_token").toBe("A1513-CB042-VIEW");
  });
});
caseTest("IT-A15-13-043", async (ctx) => {
  supplement(利用者IDの補い);
  const token = await トークンを受ける(ctx, "A");
  const r = await 検索する(ctx, { モード: "private", 追加: [["user_id", 会員の控えを読む("CB043").利用者ID]] }, token);
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(件(r).length, "デッキ一覧の件数（空）").toBe(0);
    expect.soft(総件数(r), "総件数").toBe(0);
    expect.soft(番号たち(r), "他人が所有する公開デッキは返らない").not.toContain(id(ctx, "CB043"));
  });
});
caseTest("IT-A15-13-044", async (ctx) => {
  supplement(利用者IDの補い);
  let token = "";
  let r!: 検索の応答;
  await ctx.step(1, async () => { token = await トークンを受ける(ctx, "A", true); });
  await ctx.step(2, async () => { supplement(デバッグ代わり); });
  await ctx.step(3, async () => { r = await デッキを検索する(ctx.page, { モード: "public", 追加: [["user_id", 会員の控えを読む("CB044").利用者ID]] }, token); });
  await ctx.step(4, async () => { note(`応答 HTTP ${r.ステータス}・総件数 ${JSON.stringify(r.json?.total_count)}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(総件数(r), "総件数").toBe(1);
    expect.soft(番号たち(r), "他人が所有する公開デッキだけが返る").toEqual([id(ctx, "CB044")]);
  });
});
