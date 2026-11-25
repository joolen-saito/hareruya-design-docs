/**
 * A14-02 カード詳細IDからカード詳細情報を取得（GET /api/cardDetails/{カード詳細ID}）の 005・006。正本: cases/A14-02_test_cases.tsv
 * 判定済みのケースのテストの指紋を変えないよう、ファイルを分けた。要求の送り方は spec/a14/a14-02.spec.ts と同じ
 * （試験ブラウザから認証の見出しを付けずに送り、要求メソッド・HTTP ステータス・応答本文をそのまま読む）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { カード詳細情報を取得, 値, 要約, 応答 } from "../../pages/api/a14_cards";
import "../../seeds/a14-02";
import "../../seeds/a14-02-c";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、試験ブラウザから送った要求の、要求メソッド・HTTP ステータス・応答本文をそのまま読む";

caseTest("IT-A14-02-005", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔未登録カード詳細ID-A1402-共有〕");
  let r!: 応答;
  await step(1, async () => { r = await カード詳細情報を取得(page, id); note(要約(r)); });
  await step(2, async () => { note(NETWORK); });
  await expected(async () => {
    expect.soft(r.ステータス, "HTTPステータス").toBe(404);
    expect.soft(Object.keys(r.json ?? {}).sort(), "応答JSONの項目（コードとメッセージの2項目）").toEqual(["code", "message"]);
    expect.soft(値(r.json, "code"), "コード").toBe(404);
    expect.soft(値(r.json, "message"), "メッセージ").toBe("Not Found");
  });
});

caseTest("IT-A14-02-006", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await カード詳細情報を取得(page, ""); note(要約(r)); });
  await step(2, async () => { note(NETWORK); });
  await expected(async () => {
    expect.soft(r.ステータス, "リクエストパラメータidが未指定のときのHTTPステータス").toBe(404);
  });
});
