/**
 * A02-03 旧商品IDからポップアップ用の商品情報を1件取得（/api/popup/old/{lang}/{旧商品ID}(.json)）。正本: cases/A02-03_test_cases.tsv
 * ケースの「開発者ツールの Network で確かめる」は、ページで API を開き、その応答（状態・本文・送った要求の見出し）を読む（A17-05 と同じ）。
 * 旧商品ID・旧英語商品ID（A0203BASEJN-001 など）は、シードが選んだ開発環境の既にあるカードの値で読み替える（seeds/a02-03.ts。カードのマスタは作らない・書き換えない）。
 * 実装しないケース（記録 review/A02-03_progress_2026-11-11_dev.md）: 006〜009・025〜028（カードセット・プロモ・リリース日・Foil の違うカード詳細を、1つの旧商品IDに並べる。カードのマスタを作る必要がある）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { 旧商品IDで開く, 値, 項目の名前, 型, 要約, 応答 } from "../../pages/api/a02_popup";
import { グッズの商品コード, 旧商品IDの, 該当なしの旧商品ID } from "../../seeds/a02-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、開いたページの応答（状態・本文・送った要求の見出し）をそのまま読む";
const n = (v: string) => Number(v);

/** 正本の旧商品ID（ケースの文の値）を、シードが選んだカードの値で読み替えて開き、応答を注記に残す */
async function 開く(page: Page, lang: string, 正本の値: string, 実際の値: string, json = true): Promise<応答> {
  if (正本の値 !== 実際の値) note(`旧商品ID「${正本の値}」は、開発環境の既にあるカードの値「${実際の値}」で読み替えた`);
  const r = await 旧商品IDで開く(page, lang, 実際の値, json);
  note(`/api/popup/old/${lang}/${実際の値}${json ? ".json" : ""} の応答: ${要約(r)}`);
  return r;
}
const 旧 = (seedId: string) => 旧商品IDの(seedId).旧商品ID;
const 旧英 = (seedId: string) => 旧商品IDの(seedId).旧英語商品ID;

/** 該当なしの応答（状態404・本文がコードとメッセージの2項目だけ） */
function 該当なしである(r: 応答, what: string, メッセージ?: string): void {
  expect.soft(r.状態, `${what}: HTTPステータス`).toBe(404);
  expect.soft(項目の名前(r), `${what}: 応答本文の項目（コードとメッセージの2項目だけ）`).toEqual(["code", "message"]);
  expect.soft(値(r, "code"), `${what}: コード`).toBe(404);
  if (メッセージ !== undefined) expect.soft(値(r, "message"), `${what}: メッセージ`).toBe(メッセージ);
}

/** 1回開いて productId を見るケースの処理 */
function 商品IDを見る(lang: string, seedId: string, 正本の値: string, 返る: string, 返らない?: string, 状態200 = false): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: 応答;
    await step(1, async () => { note(NETWORK); r = await 開く(page, lang, 正本の値, 旧(seedId)); });
    await step(2, async () => { note(`HTTPステータス ${r.状態}・productId ${String(値(r, "productId"))}`); });
    await expected(async () => {
      if (状態200) expect.soft(r.状態, "HTTPステータス").toBe(200);
      expect.soft(値(r, "productId"), `productId（${返る}）`).toBe(n(notes.get(返る)));
      if (返らない) expect.soft(値(r, "productId"), `productId が ${返らない} でない`).not.toBe(n(notes.get(返らない)));
    });
  };
}

// ---- 001: 認証情報なしの GET で 200・JSON ----
caseTest("IT-A02-03-001", async ({ page, step, expected }) => {
  let r!: 応答;
  const 送った認証: string[] = [];
  await step(1, async () => {
    note(NETWORK);
    expect((await page.context().cookies()).length, "要求の前のブラウザに Cookie が無い（未認証）").toBe(0);
  });
  await step(2, async () => {
    r = await 開く(page, "ja", "A0203BASEJN-001", 旧("S-A02-03-BASE-001"));
    for (const k of Object.keys(r.送った見出し)) if (k === "cookie" || k === "authorization") 送った認証.push(k);
  });
  await step(3, async () => { note(`要求メソッド ${r.方法}・HTTPステータス ${r.状態}・種類 ${r.種類}`); });
  await expected(async () => {
    expect.soft(r.方法, "要求メソッド").toBe("GET");
    expect.soft(送った認証, "送った要求に認証情報（Cookie・認可の見出し）が無い").toEqual([]);
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(r.JSONか, "応答本文が JSON オブジェクト").toBe(true);
  });
});

// ---- 002: 拡張子なしも同じ ----
caseTest("IT-A02-03-002", async ({ page, step, expected }) => {
  let a!: 応答; let b!: 応答;
  const id = 旧("S-A02-03-BASE-002");
  await step(1, async () => { note(NETWORK); a = await 開く(page, "ja", "A0203BASEJN-002", id, true); });
  await step(2, async () => { b = await 開く(page, "ja", "A0203BASEJN-002", id, false); });
  await expected(async () => {
    expect.soft(b.状態, "拡張子なしの HTTPステータスが拡張子ありと同じ").toBe(a.状態);
    expect.soft(b.本文, "拡張子なしの応答 JSON が拡張子ありと同じ").toEqual(a.本文);
    expect.soft(a.JSONか, "拡張子ありの応答が JSON オブジェクト").toBe(true);
  });
});

// ---- 003: 項目名・値型・値 ----
caseTest("IT-A02-03-003", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", "A0203BASEJN-003", 旧("S-A02-03-BASE-003")); });
  await step(2, async () => { note(`項目: ${項目の名前(r).join("、")}`); });
  await expected(async () => {
    const want: [string, unknown, string][] = [
      ["productId", n(notes.get("〔商品ID-A0203-003〕")), "整数"],
      ["name", "A02-03基本カード商品-003", "文字列"],
      ["productClassId", n(notes.get("〔商品規格ID-A0203-003〕")), "整数"],
      ["nameEn", "A02-03 Basic Card Product-A0203-003", "文字列"],
      ["subFileName", "img/goods/L/A02/jp/20301003_sub.jpg", "文字列"],
      ["fileName", "img/goods/L/A02/jp/20301003.jpg", "文字列"],
      ["code", "JP", "文字列"],
      ["conditionCode", "NM", "文字列"],
    ];
    for (const [k, v, t] of want) {
      expect.soft(値(r, k), `${k} の値`).toBe(v);
      expect.soft(型(値(r, k)), `${k} の型`).toBe(t);
    }
    expect.soft(型(値(r, "productUrl")), "productUrl が文字列").toBe("文字列");
    expect.soft(String(値(r, "productUrl")), "productUrl が商品詳細URL").toMatch(new RegExp(`/products/detail/${notes.get("〔商品ID-A0203-003〕")}$`));
  });
});

// ---- 004: 旧商品ID・旧英語商品IDの双方で同じ商品 ----
caseTest("IT-A02-03-004", async ({ page, notes, step, expected }) => {
  let a!: 応答; let b!: 応答;
  await step(1, async () => { note(NETWORK); a = await 開く(page, "ja", "A0203BASEJN-004", 旧("S-A02-03-BASE-004")); });
  await step(2, async () => { b = await 開く(page, "ja", "A0203BASEEN-004", 旧英("S-A02-03-BASE-004")); });
  await expected(async () => {
    const id = n(notes.get("〔商品ID-A0203-004〕"));
    expect.soft(値(a, "productId"), "旧商品IDを指定した productId").toBe(id);
    expect.soft(値(b, "productId"), "旧英語商品IDを指定した productId").toBe(id);
  });
});

// ---- 010: 言語コードで返る商品が変わる ----
caseTest("IT-A02-03-010", async ({ page, notes, step, expected }) => {
  let a!: 応答; let b!: 応答;
  const id = 旧("S-A02-03-PRIORITY-010");
  await step(1, async () => { note(NETWORK); a = await 開く(page, "ja", "A0203PR5-010", id); });
  await step(2, async () => { b = await 開く(page, "en", "A0203PR5-010", id); });
  await expected(async () => {
    expect.soft(値(a, "productId"), "言語コード ja の productId（日本語の 〔商品ID-A0203-010A〕）").toBe(n(notes.get("〔商品ID-A0203-010A〕")));
    expect.soft(値(b, "productId"), "言語コード en の productId（英語の 〔商品ID-A0203-010B〕）").toBe(n(notes.get("〔商品ID-A0203-010B〕")));
  });
});

caseTest("IT-A02-03-011", 商品IDを見る("ja", "S-A02-03-PRIORITY-011", "A0203PR6-011", "〔商品ID-A0203-011A〕", "〔商品ID-A0203-011B〕"));

// ---- 012: 週間販売数は言語コードの規格の合計 ----
caseTest("IT-A02-03-012", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", "A0203WEEK-012", 旧("S-A02-03-WEEKLY-012")); });
  await step(2, async () => { note(`weeklySold ${String(値(r, "weeklySold"))}`); });
  await expected(async () => { expect.soft(値(r, "weeklySold"), "weeklySold（日本語の2件の 2＋5。英語の11を含まない）").toBe(7); });
});

// ---- 013: 値がそのまま返る ----
caseTest("IT-A02-03-013", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", "A0203RAW-013", 旧("S-A02-03-RAW-013")); });
  await step(2, async () => { note(`price02 ${String(値(r, "price02"))}・stock ${String(値(r, "stock"))}`); });
  await expected(async () => {
    expect.soft(値(r, "price02"), "price02（再計算・丸め・桁区切りなし）").toBe(1234567);
    expect.soft(値(r, "stock"), "stock（再計算・丸め・桁区切りなし）").toBe(1234);
  });
});

// ---- 014: 該当なし ----
caseTest("IT-A02-03-014", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", "A0203NOTFOUND-014", 該当なしの旧商品ID()); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・本文 ${r.文字}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(404);
    該当なしである(r, "該当する商品が無い旧商品ID", "Not Found");
  });
});

// ---- 015: カードの紐づかないグッズ商品 ----
caseTest("IT-A02-03-015", async ({ page, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "en", "A0203GOODS-015", グッズの商品コード()); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・本文 ${r.文字}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(404);
    該当なしである(r, "カード詳細とカードが紐づかないグッズ商品");
  });
});

// ---- 022: 非公開の商品は対象外 ----
caseTest("IT-A02-03-022", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", "A0203MIXED-022", 旧("S-A02-03-MIXED-022")); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・productId ${String(値(r, "productId"))}・productClassId ${String(値(r, "productClassId"))}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(値(r, "productId"), "productId（公開・未削除の 〔商品ID-A0203-022B〕）").toBe(n(notes.get("〔商品ID-A0203-022B〕")));
    expect.soft(値(r, "productClassId"), "productClassId（〔商品規格ID-A0203-022B〕）").toBe(n(notes.get("〔商品規格ID-A0203-022B〕")));
    expect.soft(値(r, "productId"), "非公開の 〔商品ID-A0203-022A〕 が返らない").not.toBe(n(notes.get("〔商品ID-A0203-022A〕")));
  });
});

// ---- 024: 日本語の規格1つの販売数 ----
caseTest("IT-A02-03-024", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", "A0203WEEK1-024", 旧("S-A02-03-WEEKLY1-024")); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・weeklySold ${String(値(r, "weeklySold"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), "productClassId").toBe(n(notes.get("〔商品規格ID-A0203-024〕")));
    expect.soft(値(r, "weeklySold"), "weeklySold").toBe(3);
  });
});

caseTest("IT-A02-03-029", 商品IDを見る("en", "S-A02-03-CBIMAGEPRIO-029", "A0203-CB029-JN", "〔商品ID-A0203-029B〕", "〔商品ID-A0203-029A〕", true));

// ---- 030: 旧英語商品IDで引ける ----
caseTest("IT-A02-03-030", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", "A0203-CB030-EN", 旧英("S-A02-03-CBPASS-030")); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・productId ${String(値(r, "productId"))}・productClassId ${String(値(r, "productClassId"))}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(値(r, "productId"), "productId").toBe(n(notes.get("〔商品ID-A0203-030〕")));
    expect.soft(値(r, "productClassId"), "productClassId").toBe(n(notes.get("〔商品規格ID-A0203-030〕")));
  });
});
