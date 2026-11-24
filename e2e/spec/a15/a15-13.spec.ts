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
import { 試験会員 } from "../../seeds/a15-13";
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
  const a = 試験会員[0];
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
