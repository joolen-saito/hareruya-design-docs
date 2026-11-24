/**
 * A02-04 旧商品IDからポップアップ用のカード情報を1件取得（言語の指定なし。/api/popup/old/{旧商品ID}(.json)）。正本: cases/A02-04_test_cases.tsv
 * ケースの「開発者ツールで HTTPステータスと応答本文を確認する」は、ページで API を開き、その応答（状態・本文・送った要求の見出し）を読む（A02-03 と同じ）。
 * 旧商品ID（AER000022JN-001 など）は、シードが作った試験用のカードに書いたシード表の値で開く（seeds/a02-04.ts。依頼者決定 2026-11-14「マスタは作ってよい」）。
 * 正本のケースは 001・002・004〜011・016〜020（003・012〜015 は正本に無い）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { 規格の価格と在庫 } from "../../db/a02_popup";
import { 旧商品IDで開く_言語なし, 値, 項目の名前, 要約, 応答 } from "../../pages/api/a02_popup";
import { 該当なしの旧商品ID } from "../../seeds/a02-04";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの代わりに、開いたページの応答（状態・本文・送った要求の見出し）をそのまま読む";
const n = (v: string) => Number(v);

/** 旧商品IDで開き、応答を注記に残す */
async function 開く(page: Page, 旧商品ID: string, json = false): Promise<応答> {
  const r = await 旧商品IDで開く_言語なし(page, 旧商品ID, json);
  note(`/api/popup/old/${旧商品ID}${json ? ".json" : ""} の応答: ${要約(r)}`);
  return r;
}

/** 該当なしの応答本文（処理結果コードとメッセージの2項目） */
function 該当なしである(r: 応答, what: string): void {
  expect.soft(項目の名前(r), `${what}: 応答JSONの項目（処理結果コードとメッセージの2項目）`).toEqual(["code", "message"]);
  expect.soft(値(r, "code"), `${what}: 処理結果コード`).toBe(404);
  expect.soft(値(r, "message"), `${what}: メッセージ`).toBe("Not Found");
}

/** 開いて404の該当なしを確かめるケース */
function 該当なし(旧商品ID: string, what: string): CaseBody {
  return async ({ page, step, expected }) => {
    let r!: 応答;
    await step(1, async () => { r = await 開く(page, 旧商品ID); });
    await step(2, async () => { note(NETWORK); note(`HTTPステータス ${r.状態}・応答JSON ${r.文字}`); });
    await expected(async () => {
      expect.soft(r.状態, `${what}: HTTPステータス 404`).toBe(404);
      該当なしである(r, what);
    });
  };
}

/** 開いて200・productId（と1つの項目）を見るケース */
function 一つを見る(旧商品ID: string, 商品ID: string, 項目: [string, unknown] | null, 商品規格ID?: string, 返らない規格?: string): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: 応答;
    await step(1, async () => { r = await 開く(page, 旧商品ID); });
    await step(2, async () => {
      note(NETWORK);
      note(`HTTPステータス ${r.状態}・productId ${String(値(r, "productId"))}・productClassId ${String(値(r, "productClassId"))}${項目 ? `・${項目[0]} ${String(値(r, 項目[0]))}` : ""}`);
    });
    await expected(async () => {
      expect.soft(r.状態, "HTTPステータス").toBe(200);
      expect.soft(値(r, "productId"), `productId（${商品ID}）`).toBe(n(notes.get(商品ID)));
      if (商品規格ID) expect.soft(値(r, "productClassId"), `productClassId（${商品規格ID}）`).toBe(n(notes.get(商品規格ID)));
      if (返らない規格) expect.soft(値(r, "productClassId"), `${返らない規格} の商品情報が返らない`).not.toBe(n(notes.get(返らない規格)));
      if (項目) expect.soft(値(r, 項目[0]), 項目[0]).toBe(項目[1]);
    });
  };
}

// ---- 001: 認証なしの GET で、拡張子なし・.json とも 200・JSON ----
caseTest("IT-A02-04-001", async ({ page, step, expected }) => {
  let a!: 応答; let b!: 応答;
  const 送った認証: string[] = [];
  const 認証を見る = (r: 応答) => { for (const k of Object.keys(r.送った見出し)) if (k === "cookie" || k === "authorization") 送った認証.push(k); };
  await step(1, async () => {
    expect((await page.context().cookies()).length, "要求の前のブラウザに Cookie が無い（ログインしていない）").toBe(0);
    a = await 開く(page, "AER000022JN-001", false); 認証を見る(a);
  });
  await step(2, async () => { note(NETWORK); note(`拡張子なし: HTTPステータス ${a.状態}・種類 ${a.種類}`); });
  await step(3, async () => { b = await 開く(page, "AER000022JN-001", true); 認証を見る(b); });
  await step(4, async () => { note(NETWORK); note(`.json: HTTPステータス ${b.状態}・種類 ${b.種類}`); });
  await expected(async () => {
    expect.soft(送った認証, "送った要求に認証情報（Cookie・認可の見出し）が無い").toEqual([]);
    expect.soft(a.状態, "拡張子なしの HTTPステータス").toBe(200);
    expect.soft(a.JSONか, "拡張子なしの応答本文が JSON の商品情報").toBe(true);
    expect.soft(値(a, "productId"), "拡張子なしの応答に productId がある").not.toBeUndefined();
    expect.soft(b.状態, ".json の HTTPステータス").toBe(200);
    expect.soft(b.JSONか, ".json の応答本文が JSON の商品情報").toBe(true);
    expect.soft(値(b, "productId"), ".json の応答に productId がある").not.toBeUndefined();
  });
});

// ---- 002: 応答の各項目の値 ----
caseTest("IT-A02-04-002", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 開く(page, "AER000022JN-002"); });
  await step(2, async () => { note(`応答JSON: ${r.文字}`); });
  await expected(async () => {
    const 商品ID = notes.get("〔商品ID-A0204-002〕");
    const want: [string, unknown][] = [
      ["productId", n(商品ID)],
      ["name", "《生真面目な補充兵/Solemn Recruit》[AER] 白R"],
      ["productClassId", n(notes.get("〔商品規格ID-A0204-002〕"))],
      ["nameEn", "《Solemn Recruit》 [AER]"],
      ["subFileName", "img/goods/L/AER/jp/22_jpn-002.jpg"],
      ["fileName", "img/goods/L/AER/jp/22_jpn-002.jpg"],
      ["code", "JP"],
      ["conditionCode", "NM"],
    ];
    for (const [k, v] of want) expect.soft(値(r, k), k).toBe(v);
    expect.soft(String(値(r, "productUrl")), `productUrl が商品ID ${商品ID} の商品詳細URL`).toMatch(new RegExp(`/products/detail/${商品ID}$`));
  });
});

// ---- 004: 旧英語商品IDで引ける ----
caseTest("IT-A02-04-004", 一つを見る("A02EN0001-004", "〔商品ID-A0204-004〕", null));

// ---- 005〜009: 取得対象が無い ----
caseTest("IT-A02-04-005", 該当なし("A02DELPROD1-005", "商品が廃止のカード"));
caseTest("IT-A02-04-006", 該当なし("A02DELCLASS1-006", "商品規格が廃止・非表示のカード"));
caseTest("IT-A02-04-007", 該当なし("A02NOCARD1-007", "商品にカード詳細が紐付かないカード"));
caseTest("IT-A02-04-008", 該当なし("A02NOIMAGE1-008", "商品画像・商品規格画像が0件のカード"));
caseTest("IT-A02-04-009", 該当なし(該当なしの旧商品ID, "旧商品ID・旧英語商品IDが一致するカードが無い"));

// ---- 010: 取得対象が2件でも1件だけ返す ----
caseTest("IT-A02-04-010", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 開く(page, "A02MULTI1-010"); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・応答JSON ${r.文字}`); });
  await expected(async () => {
    const A = n(notes.get("〔商品規格ID-A0204-010A〕"));
    const B = n(notes.get("〔商品規格ID-A0204-010B〕"));
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(r.JSONか, "応答が1件の商品情報（JSON のオブジェクト。配列でない）").toBe(true);
    expect.soft([A, B], `productClassId が 〔商品規格ID-A0204-010A〕(${A}) か 〔商品規格ID-A0204-010B〕(${B}) のどちらか`).toContain(値(r, "productClassId"));
  });
});

// ---- 011: price01・price02・stock が DB の値のまま ----
caseTest("IT-A02-04-011", async ({ page, notes, step, expected }) => {
  let db!: ReturnType<typeof 規格の価格と在庫>;
  let r!: 応答;
  await step(1, async () => {
    db = 規格の価格と在庫(notes.get("〔商品規格ID-A0204-011〕"));
    note(`DB: 通常価格 ${String(db.通常価格)}・販売価格 ${String(db.販売価格)}・店舗ID 1・EC-CUBE の在庫 ${String(db.在庫数)}`);
  });
  await step(2, async () => { r = await 開く(page, "A02VALUE1-011"); });
  await step(3, async () => { note(`price01 ${String(値(r, "price01"))}・price02 ${String(値(r, "price02"))}・stock ${String(値(r, "stock"))}`); });
  await expected(async () => {
    expect.soft(db.通常価格, "DB の通常価格").toBe(2000);
    expect.soft(db.販売価格, "DB の販売価格").toBe(1501);
    expect.soft(db.在庫数, "DB の在庫").toBe(17);
    expect.soft(値(r, "price01"), "price01（DB の値 2000）").toBe(2000);
    expect.soft(値(r, "price02"), "price02（DB の値 1501）").toBe(1501);
    expect.soft(値(r, "stock"), "stock（DB の値 17）").toBe(17);
  });
});

// ---- 016〜020 ----
caseTest("IT-A02-04-016", 一つを見る("A0204-016-DELMIX", "〔商品ID-A0204-016A〕", null, "〔商品規格ID-A0204-016A〕", "〔商品規格ID-A0204-016B〕"));
caseTest("IT-A02-04-017", 一つを見る("A0204-017-IMGMIX", "〔商品ID-A0204-017A〕", null, "〔商品規格ID-A0204-017A〕", "〔商品規格ID-A0204-017B〕"));
caseTest("IT-A02-04-018", 一つを見る("A0204-018-STOCK0", "〔商品ID-A0204-018〕", ["stock", 0]));
caseTest("IT-A02-04-019", 一つを見る("A0204-019-LANGEN", "〔商品ID-A0204-019〕", ["code", "EN"]));
caseTest("IT-A02-04-020", 一つを見る("A0204-020-CONDSP", "〔商品ID-A0204-020〕", ["conditionCode", "SP"]));
