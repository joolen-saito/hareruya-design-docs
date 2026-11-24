/**
 * A15-15 採用枚数情報参照（デッキビルダーの API）。正本: cases/A15-15_test_cases.tsv
 * 実装したケースと解釈は記録 review/A15-15_progress_2026-11-24_dev.md。
 *
 * 「ブラウザの開発者ツールから GET で要求を送り、Network で応答を見る」の代わりに、試験ブラウザ（ケースのブラウザのコンテキスト）から
 * 要求を送り、HTTP ステータスと応答本文を読む（A15-07 と同じ）。書いたケース: 001〜007・009・010・012。
 *
 * 送り先の経路が新アプリに無い（開発環境の API サーバーで 404・本文は JSON でない。2026-11-24 に確かめた）ので、依頼者の決定
 * （2026-11-24「起票して不合格」）に従い、シードを作る前に送り先が有るかを確かめ、無ければシードを作らずに手順へ進む
 * （lib/case.ts の 送り先が無ければシードを作らない）。送り先が有れば、ふつうどおり使用シードを作る（作り方はまだ無いので、事前準備で止まる）。
 * シードを作らないときは、経路のフォーマット識別子に既存のフォーマットの番号（DB を読むだけ）を使い、カード識別子の突き合わせはしない。
 */
import { test } from "@playwright/test";
import { caseTest, CaseCtx, expect, 送り先が無ければシードを作らない } from "../../lib/case";
import { カード別集計の並び, 採用枚数を参照する, 条件, 設計の経路, 経路が無い, 応答 } from "../../pages/api/a15_15_usage_card";
import { 既存のアーキタイプの番号, 既存のフォーマットの番号 } from "../../db/a15_15";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 開発者ツールの代わり = "開発者ツールの代わりに、試験ブラウザから採用枚数情報参照 API へ GET で要求を送り、応答の HTTP ステータス・本文の種類・本文を読む";

const 書いたケース = ["001", "002", "003", "004", "005", "006", "007", "009", "010", "012"].map((n) => `IT-A15-15-${n}`);

/** 送り先の確かめに使ったフォーマットの番号（シードを作らないときの経路に使う） */
let 確かめのフォーマット = "";
送り先が無ければシードを作らない(書いたケース, async (page) => {
  const f = 既存のフォーマットの番号();
  確かめのフォーマット = f;
  const a = await 採用枚数を参照する(page, f);
  const b = await 採用枚数を参照する(page, f, {}, undefined, 設計の経路(f));
  if (!経路が無い(a) || !経路が無い(b)) return null;
  return `既存のフォーマット（番号 ${f}）で ${a.経路} へ送った応答が HTTP ${a.ステータス}（${a.種類 || "種類なし"}）、設計の経路 ${b.経路} も HTTP ${b.ステータス}（${b.種類 || "種類なし"}）`;
});

const 呼び名 = (ctx: CaseCtx, l: string): string | null => (ctx.notes.has(l) ? ctx.notes.get(l) : null);
const カード = (x: string) => `〔カード識別子-A1515-共有${x}〕`;
const シードなし = (ctx: CaseCtx): boolean => 呼び名(ctx, "〔フォーマット識別子-A1515-共有A〕") === null;
const フォーマット = (ctx: CaseCtx): string => 呼び名(ctx, "〔フォーマット識別子-A1515-共有A〕") ?? 確かめのフォーマット;
const 要点 = (r: 応答): string => `${r.経路}・応答 HTTP ${r.ステータス}（${r.種類 || "種類なし"}）・本文の先頭 ${r.本文.slice(0, 200)}`;

/** 手順1（開発者ツールを開く）の代わりの注記。シードを作らなかったときは、その補いも書く */
function 開く(ctx: CaseCtx): void {
  note(開発者ツールの代わり);
  if (シードなし(ctx)) supplement(`送り先が無いので使用シードを作らなかった。経路のフォーマット識別子は、既存のフォーマットの番号 ${確かめのフォーマット}（DB を読むだけ）を使った`);
}

async function 送る(ctx: CaseCtx, v: 条件 = {}, 認証?: string, 何 = ""): Promise<応答> {
  const r = await 採用枚数を参照する(ctx.page, フォーマット(ctx), v, 認証);
  note(`${何 ? `${何}: ` : ""}GET ${要点(r)}`);
  return r;
}

/** 期待結果のうち、どのケースにも共通の本文の形（本文が JSON・カード別採用枚数集計が配列）。HTTP ステータスは各ケースで確かめる */
function 形の確かめ(r: 応答, 何 = ""): void {
  expect.soft(r.json !== null, `${何}応答の本文が JSON`).toBe(true);
  expect.soft(カード別集計の並び(r) !== null, `${何}カード別採用枚数集計（配列）がある`).toBe(true);
}

const 識別子の並び = (r: 応答): string[] => (カード別集計の並び(r) ?? []).map((x) => String(x.id));

/** 呼び名のカード識別子の突き合わせ。シードを作っていないとき（呼び名が控えていない）は、突き合わせをせずに注記だけ残す */
function カードの確かめ(ctx: CaseCtx, r: 応答, 何: string, 期待の呼び名: string[], 並びも = false): void {
  const 期待 = 期待の呼び名.map((l) => 呼び名(ctx, l));
  if (期待.some((x) => x === null)) { note(`${何}: シードを作っていないので、カード識別子の突き合わせはしない（送り先が無く、集計が返っていない）`); return; }
  const 実際 = 識別子の並び(r);
  expect.soft(並びも ? 実際 : [...実際].sort(), 何).toEqual(並びも ? (期待 as string[]) : [...(期待 as string[])].sort());
}

caseTest("IT-A15-15-001", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => { r = await 送る(ctx, {}, undefined, "任意条件なし"); });
  await ctx.step(3, async () => { note("応答のカード別採用枚数集計を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    カードの確かめ(ctx, r, "集計のカード識別子（カードA〜E だけ）", ["A", "B", "C", "D", "E"].map(カード));
  });
});

caseTest("IT-A15-15-002", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => { r = await 送る(ctx, { 種別: "土地" }, undefined, "種別「土地」"); });
  await ctx.step(3, async () => { note("応答のカード別採用枚数集計を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    カードの確かめ(ctx, r, "集計のカード識別子（土地カードのカードA だけ）", [カード("A")]);
  });
});

caseTest("IT-A15-15-003", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); supplement("種別「土地以外」は、現行が「土地」以外の値をすべて土地以外として扱うので、土地でない値を送った"); });
  await ctx.step(2, async () => { r = await 送る(ctx, { 種別: "土地以外" }, undefined, "種別「土地以外」"); });
  await ctx.step(3, async () => { note("応答のカード別採用枚数集計を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    カードの確かめ(ctx, r, "集計のカード識別子（土地以外のカードB〜E だけ）", ["B", "C", "D", "E"].map(カード));
  });
});

caseTest("IT-A15-15-004", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => {
    let a = 呼び名(ctx, "〔アーキタイプ識別子-A1515-共有A〕");
    if (a === null) {
      a = 既存のアーキタイプの番号(フォーマット(ctx));
      supplement(`アーキタイプ識別子は、シードを作っていないので、そのフォーマットの既存のアーキタイプの番号（${a ?? "無し"}。DB を読むだけ）を使った`);
    }
    r = await 送る(ctx, a ? { アーキタイプ: a } : {}, undefined, `アーキタイプ識別子 ${a ?? "なし"}`);
  });
  await ctx.step(3, async () => { note("応答のカード別採用枚数集計を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    カードの確かめ(ctx, r, "集計のカード識別子（アーキタイプA のデッキのカードA〜C だけ）", ["A", "B", "C"].map(カード));
  });
});

caseTest("IT-A15-15-005", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => { r = await 送る(ctx, { ボード: "15301" }, undefined, "ボード識別子 15301"); });
  await ctx.step(3, async () => { note("応答のカード別採用枚数集計を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    カードの確かめ(ctx, r, "集計のカード識別子（ボード15301 のカードA・B・D だけ）", ["A", "B", "D"].map(カード));
  });
});

caseTest("IT-A15-15-006", async (ctx) => {
  let r1!: 応答;
  let r2!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => { r1 = await 送る(ctx, {}, undefined, "認証情報なし"); });
  await ctx.step(3, async () => { r2 = await 送る(ctx, {}, "Bearer invalid-token", "認証ヘッダ「Bearer invalid-token」"); });
  await ctx.step(4, async () => { note("2回の応答を読む"); });
  await ctx.expected(async () => {
    expect.soft(r1.ステータス, "認証情報なしの HTTP ステータス").toBe(200);
    expect.soft(r2.ステータス, "不正な認証ヘッダの HTTP ステータス").toBe(200);
    形の確かめ(r1, "認証情報なしの ");
    形の確かめ(r2, "不正な認証ヘッダの ");
    expect.soft(JSON.stringify(カード別集計の並び(r2)), "2回のカード別採用枚数集計が同じ").toBe(JSON.stringify(カード別集計の並び(r1)));
    if (カード別集計の並び(r1) === null) note("2回とも集計が返っていないので、同じかの確かめは集計が無いことの一致になる");
  });
});

caseTest("IT-A15-15-007", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => { r = await 送る(ctx, { 件数: "2" }, undefined, "件数 2"); });
  await ctx.step(3, async () => { note("応答のカード別採用枚数集計を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    expect.soft(カード別集計の並び(r)?.length ?? null, "返った件数").toBe(2);
    カードの確かめ(ctx, r, "集計のカード識別子（平均採用枚数が上位のカードA・B の順）", ["A", "B"].map(カード), true);
  });
});

caseTest("IT-A15-15-009", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => { r = await 送る(ctx, {}, undefined, "任意条件なし"); });
  await ctx.step(3, async () => { note("応答のカード別採用枚数集計の順序を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    カードの確かめ(ctx, r, "集計のカード識別子の順（A・B・D・C・E）", ["A", "B", "D", "C", "E"].map(カード), true);
    if (!シードなし(ctx)) expect.soft((カード別集計の並び(r) ?? []).map((x) => x.totalCount), "平均採用枚数の降順").toEqual([8, 6, 5, 3, 2]);
  });
});

caseTest("IT-A15-15-010", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => {
    let c = 呼び名(ctx, "〔アーキタイプ識別子-A1515-共有C〕");
    if (c === null) {
      c = 既存のアーキタイプの番号(フォーマット(ctx));
      supplement(`アーキタイプ識別子は、シードを作っていないので、そのフォーマットの既存のアーキタイプの番号（${c ?? "無し"}。DB を読むだけ）を使った`);
    }
    r = await 送る(ctx, c ? { アーキタイプ: c } : {}, undefined, `採用デッキの無いアーキタイプ識別子 ${c ?? "なし"}`);
  });
  await ctx.step(3, async () => { note("応答を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    if (シードなし(ctx)) { note("シードを作っていないので、空の配列かの確かめはしない（送り先が無く、集計が返っていない）"); return; }
    expect.soft(カード別集計の並び(r), "カード別採用枚数集計が空の配列").toEqual([]);
  });
});

caseTest("IT-A15-15-012", async (ctx) => {
  let r!: 応答;
  await ctx.step(1, async () => { 開く(ctx); });
  await ctx.step(2, async () => { r = await 送る(ctx, { 種別: "土地" }, undefined, "種別「土地」"); });
  await ctx.step(3, async () => { note("応答本文を読む"); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    形の確かめ(r);
    const A = 呼び名(ctx, カード("A"));
    if (A === null) { note("シードを作っていないので、カードA の項目の確かめはしない（送り先が無く、集計が返っていない）"); return; }
    const 行 = (カード別集計の並び(r) ?? []).find((x) => String(x.id) === A);
    expect.soft(行 !== undefined, "集計にカードA がある").toBe(true);
    expect.soft(行?.name_jp, "カード名（日本語）").toBe("結合試験土地A");
    expect.soft(行?.name_en, "カード名（英語）").toBe("Integration Land A");
    expect.soft(行?.image_jp, "画像（日本語）").toBe("https://example.invalid/cards/15101-ja.jpg");
    expect.soft(行?.image_en, "画像（英語）").toBeNull();
    expect.soft(Number.isInteger(行?.totalCount), "平均採用枚数が integer 型").toBe(true);
  });
});

