/**
 * A08-01 トップバナーIDのトップバナー情報を取得（GET /topBanner/{トップバナーID}）の 002・006（-r。2026-11-25）。正本: cases/A08-01_test_cases.tsv
 * 「ブラウザで開き、開発者ツールの Network で見る」の代わりに、試験ブラウザから GET を送り、HTTP ステータスと応答 JSON を読む。
 * 項目名は正本のとおり（imageUrl・dispType 等。アプリの実際の項目名と食い違えば、不合格として記録する）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 紐づく言語の数, バナーを読む } from "../../db/a08_r";
import { トップバナーを取得する, 応答 } from "../../pages/api/a08_01_r";
import { 画像URL006, リンク006, 振られた番号を引く } from "../../seeds/a08-01-r";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 代わり = "ブラウザで開いて開発者ツールの Network で見る代わりに、試験ブラウザから GET を送り、応答の HTTP ステータスと本文（JSON）を読む";
const o = (v: unknown): Record<string, unknown> | null => (v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

caseTest("IT-A08-01-002", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await トップバナーを取得する(page, "108012999"); note(`GET /topBanner/108012999・HTTP ${r.ステータス}・本文の先頭 ${r.本文.slice(0, 200)}`); note(代わり); });
  await step(2, async () => { note(`応答 JSON: ${r.本文.slice(0, 200)}`); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(404);
    expect.soft(o(r.json)?.code, "応答 JSON の code").toBe(404);
    expect.soft(o(r.json)?.message, "応答 JSON の message").toBe("Not Found");
  });
});

caseTest("IT-A08-01-006", async ({ page, step, expected }) => {
  const id = 振られた番号を引く("トップバナーID006");
  const 画像URL = 振られた番号を引く("画像URL006");
  let r!: 応答;
  await step(1, async () => {
    const n = 紐づく言語の数(id);
    note(`DB: トップバナーID ${id} に紐づく言語 ${n} 件・${JSON.stringify(バナーを読む(id))}`);
    expect(n, "紐づく言語が0件").toBe(0);
    supplement(`トップバナーID 108016001 は振られた番号 ${id} に、画像URLは末尾に実行の印を付けた値「${画像URL}」に読み替えた`);
  });
  await step(2, async () => { r = await トップバナーを取得する(page, id); note(`GET /topBanner/${id}・HTTP ${r.ステータス}`); });
  await step(3, async () => { note(代わり); note(`応答 JSON: ${r.本文.slice(0, 400)}`); });
  await expected(async () => {
    const j = o(r.json);
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(j?.id, "id").toBe(Number(id));
    expect.soft(j?.imageUrl, "imageUrl（印を付けた値）").toBe(画像URL);
    expect.soft(String(画像URL).startsWith(画像URL006), "印を付ける前の値が正本の画像URL").toBe(true);
    expect.soft(j?.link, "link").toBe(リンク006);
    expect.soft(j?.dispType, "dispType").toBe(0);
    expect.soft(j?.languages, "languages が要素0件の空配列").toEqual([]);
  });
});
