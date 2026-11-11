/**
 * A02-01 商品IDからポップアップ用の商品情報を1件取得（/api/popup/product/{lang}/{商品ID}）。正本: cases/A02-01_test_cases.tsv
 * ケースの「開発者ツールから HTTP GET で要求を送り、Network で確かめる」は、ページで API を開き、その応答（状態・本文・送った要求の見出し）を読む（A17-05 と同じ）。
 * シード: seeds/a02-01.ts（カードのマスタは作らず、既にある商品の付いていないカード詳細を紐付ける。画像・週間販売数量・通常価格は DB で書き足す）。
 * 016・020 は日本語サイトの商品詳細の「最近チェックした商品」のカード画像にマウスを置き、goods_api/get_goods への要求と応答を見る。
 */
import { Page, Request, test } from "@playwright/test";
import { 規格の価格と在庫 } from "../../db/a02_popup";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { 商品IDで開く, 値, 項目の名前, 型, 要約, 応答 } from "../../pages/api/a02_popup";
import { FrontRecent } from "../../pages/front/f03_06_recent";
import "../../seeds/a02-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const NETWORK = "開発者ツールの Network の代わりに、開いたページの応答（状態・本文・送った要求の見出し）をそのまま読む";
const n = (v: string) => Number(v);

/** 開いて応答を注記に残す */
async function 開く(page: Page, lang: string, 商品ID: string): Promise<応答> {
  const r = await 商品IDで開く(page, lang, 商品ID);
  note(`/api/popup/product/${lang}/${商品ID} の応答: ${要約(r)}`);
  return r;
}
/** 該当なしの応答（状態404・本文が処理結果コード404とメッセージの2項目だけ） */
function 該当なしである(r: 応答, what: string, メッセージ?: string): void {
  expect.soft(r.状態, `${what}: HTTPステータス`).toBe(404);
  expect.soft(項目の名前(r), `${what}: 応答本文の項目（処理結果コードとメッセージの2項目だけ）`).toEqual(["code", "message"]);
  expect.soft(値(r, "code"), `${what}: 処理結果コード`).toBe(404);
  if (メッセージ !== undefined) expect.soft(値(r, "message"), `${what}: メッセージ`).toBe(メッセージ);
}
/** 単純な1回の要求で productClassId を見るケースの処理 */
function 規格IDを見る(lang: string, 商品: string, 返る: string, 返らない: string[] = [], 状態200 = false): CaseBody {
  return async ({ page, notes, step, expected }) => {
    let r!: 応答;
    await step(1, async () => { note(NETWORK); r = await 開く(page, lang, notes.get(商品)); });
    await step(2, async () => { note(`HTTPステータス ${r.状態}・productClassId ${String(値(r, "productClassId"))}`); });
    await expected(async () => {
      if (状態200) expect.soft(r.状態, "HTTPステータス").toBe(200);
      expect.soft(値(r, "productClassId"), `productClassId（${返る}）`).toBe(n(notes.get(返る)));
      for (const x of 返らない) expect.soft(値(r, "productClassId"), `productClassId が ${x} でない`).not.toBe(n(notes.get(x)));
    });
  };
}

// ---- 001: 認証情報なしの GET で 200・JSON ----
caseTest("IT-A02-01-001", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  const 送った認証: string[] = [];
  await step(1, async () => {
    note(NETWORK);
    expect((await page.context().cookies()).length, "要求の前のブラウザに Cookie が無い（未認証の専用セッション）").toBe(0);
    r = await 開く(page, "ja", notes.get("〔商品ID-A0201-001〕"));
    for (const k of Object.keys(r.送った見出し)) if (k === "cookie" || k === "authorization") 送った認証.push(k);
  });
  await step(2, async () => { note(`要求メソッド ${r.方法}・HTTPステータス ${r.状態}・種類 ${r.種類}`); });
  await expected(async () => {
    expect.soft(r.方法, "要求メソッド").toBe("GET");
    expect.soft(送った認証, "送った要求に認証情報（Cookie・認可の見出し）が無い").toEqual([]);
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(r.JSONか, "応答本文が JSON の商品情報（オブジェクト）").toBe(true);
    expect.soft(r.種類, "応答の種類（JSON）").toMatch(/application\/json/);
  });
});

// ---- 002: 応答の構造・項目名・値 ----
caseTest("IT-A02-01-002", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  const id = notes.get("〔商品ID-A0201-002〕");
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", id); });
  await step(2, async () => { note(`項目: ${項目の名前(r).join("、")}`); });
  await expected(async () => {
    expect.soft(r.JSONか, "応答 JSON が単一オブジェクト").toBe(true);
    expect.soft(値(r, "productId"), "productId").toBe(n(id));
    expect.soft(値(r, "name"), "name").toBe("A02-01基本商品");
    expect.soft(値(r, "productClassId"), "productClassId").toBe(n(notes.get("〔商品規格ID-A0201-002〕")));
    expect.soft(値(r, "nameEn"), "nameEn").toBe("A02-01 Base Product");
    expect.soft(値(r, "subFileName"), "subFileName").toBe("img/goods/A02-01/sub-201011002.jpg");
    expect.soft(値(r, "fileName"), "fileName").toBe("img/goods/A02-01/main-20101002.jpg");
    expect.soft(値(r, "code"), "code").toBe("JP");
    expect.soft(値(r, "conditionCode"), "conditionCode").toBe("NM");
    expect.soft(String(値(r, "productUrl")), "productUrl が商品ID の商品詳細URL").toMatch(new RegExp(`/products/detail/${id}$`));
    for (const k of ["price01", "price02", "stock", "foilFlg", "weeklySold"]) expect.soft(項目の名前(r), `${k} の項目を含む`).toContain(k);
  });
});

// ---- 003: DB の値がそのまま返る ----
caseTest("IT-A02-01-003", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  let d!: ReturnType<typeof 規格の価格と在庫>;
  await step(1, async () => {
    d = 規格の価格と在庫(notes.get("〔商品規格ID-A0201-003〕"));
    note(`DB: price01 ${d.通常価格}・price02 ${d.販売価格}・在庫数 ${d.在庫数}`);
    expect.soft([d.通常価格, d.販売価格, d.在庫数], "DB の price01・price02・在庫数").toEqual([123, 456, 7]);
  });
  await step(2, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get("〔商品ID-A0201-003〕")); });
  await step(3, async () => { note(`price01 ${String(値(r, "price01"))}・price02 ${String(値(r, "price02"))}・stock ${String(値(r, "stock"))}`); });
  await expected(async () => {
    expect.soft([値(r, "price01"), 値(r, "price02"), 値(r, "stock")], "応答の price01・price02・stock（DB の 123・456・7 から再計算・丸めされない）").toEqual([123, 456, 7]);
    expect.soft([型(値(r, "price01")), 型(値(r, "price02")), 型(値(r, "stock"))], "price01・price02・stock の型").toEqual(["整数", "整数", "整数"]);
  });
});

// ---- 004: 画像が無ければ null ----
caseTest("IT-A02-01-004", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get("〔商品ID-A0201-004〕")); });
  await step(2, async () => { note(`subFileName ${String(値(r, "subFileName"))}・fileName ${String(値(r, "fileName"))}`); });
  await expected(async () => {
    expect.soft(値(r, "subFileName"), "subFileName").toBe(null);
    expect.soft(値(r, "fileName"), "fileName").toBe(null);
  });
});

caseTest("IT-A02-01-005", 規格IDを見る("ja", "〔商品ID-A0201-005〕", "〔商品規格ID-A0201-005A〕", ["〔商品規格ID-A0201-005B〕", "〔商品規格ID-A0201-005C〕"]));

// ---- 006: 取得対象なしは 404 ----
caseTest("IT-A02-01-006", async ({ page, notes, step, expected }) => {
  const 対象 = ["A", "B", "C", "D"].map((x) => `〔商品ID-A0201-006${x}〕`);
  const rs: 応答[] = [];
  await step(1, async () => { note(NETWORK); for (const l of 対象) rs.push(await 開く(page, "ja", notes.get(l))); });
  await step(2, async () => { note(rs.map((r, i) => `${対象[i]}: ${r.状態}`).join("・")); });
  await expected(async () => {
    const what = ["削除済み商品", "非公開商品", "削除されていない商品規格が0件の商品", "販売価格が0より大きい商品規格が0件の商品"];
    expect.soft(rs.map((r) => r.状態), "4件の HTTPステータス").toEqual([404, 404, 404, 404]);
    rs.forEach((r, i) => 該当なしである(r, what[i], "Not Found"));
  });
});

caseTest("IT-A02-01-007", 規格IDを見る("ja", "〔商品ID-A0201-007〕", "〔商品規格ID-A0201-007B〕", ["〔商品規格ID-A0201-007A〕"]));
caseTest("IT-A02-01-008", 規格IDを見る("ja", "〔商品ID-A0201-008〕", "〔商品規格ID-A0201-008A〕", ["〔商品規格ID-A0201-008B〕"]));

// ---- 009: 状態の優先 ----
caseTest("IT-A02-01-009", async ({ page, notes, step, expected }) => {
  const 商品 = ["A", "B", "C"].map((x) => `〔商品ID-A0201-009${x}〕`);
  const rs: 応答[] = [];
  await step(1, async () => { note(NETWORK); for (const l of 商品) rs.push(await 開く(page, "ja", notes.get(l))); });
  await step(2, async () => { note(rs.map((r, i) => `${商品[i]}: productClassId ${String(値(r, "productClassId"))}・conditionCode ${String(値(r, "conditionCode"))}`).join("／")); });
  await expected(async () => {
    const want: [string, string][] = [["〔商品規格ID-A0201-009A〕", "NM"], ["〔商品規格ID-A0201-009E〕", "SP"], ["〔商品規格ID-A0201-009H〕", "MP"]];
    rs.forEach((r, i) => {
      expect.soft(値(r, "productClassId"), `${商品[i]} の productClassId（${want[i][0]}）`).toBe(n(notes.get(want[i][0])));
      expect.soft(値(r, "conditionCode"), `${商品[i]} の conditionCode`).toBe(want[i][1]);
    });
  });
});

// ---- 010: 日本語の規格が無くても英語の規格が返る ----
caseTest("IT-A02-01-010", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get("〔商品ID-A0201-010〕")); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・productClassId ${String(値(r, "productClassId"))}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(値(r, "productClassId"), "productClassId（英語の商品規格）").toBe(n(notes.get("〔商品規格ID-A0201-010〕")));
  });
});

// ---- 011: 週間販売数は返した規格の言語で合計 ----
caseTest("IT-A02-01-011", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "en", notes.get("〔商品ID-A0201-011〕")); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・code ${String(値(r, "code"))}・weeklySold ${String(値(r, "weeklySold"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), "productClassId（英語・NM の 〔商品規格ID-A0201-011A〕）").toBe(n(notes.get("〔商品規格ID-A0201-011A〕")));
    expect.soft(値(r, "code"), "code").toBe("EN");
    expect.soft(値(r, "weeklySold"), "weeklySold（英語の3件の 2＋3＋4。日本語の100を含まない）").toBe(9);
  });
});

caseTest("IT-A02-01-014", 規格IDを見る("en", "〔商品ID-A0201-014〕", "〔商品規格ID-A0201-014B〕", ["〔商品規格ID-A0201-014A〕"]));

// ---- 015: 4条件が等しい2件のどちらか1件 ----
caseTest("IT-A02-01-015", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "en", notes.get("〔商品ID-A0201-015〕")); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・productClassId ${String(値(r, "productClassId"))}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft([n(notes.get("〔商品規格ID-A0201-015A〕")), n(notes.get("〔商品規格ID-A0201-015B〕"))], "productClassId は 015A・015B のどちらか1件").toContain(値(r, "productClassId"));
  });
});

// ---- 016・020: 最近チェックした商品のカード画像にマウスを置く ----
async function 最近チェックした商品で開く(page: Page, step: (n: number, b: () => Promise<void>) => Promise<void>, 商品ID: string, 商品名: string): Promise<{ req: Request | null; 本文: Record<string, unknown> | null }> {
  const f = new FrontRecent(page);
  let req: Request | null = null;
  let 本文: Record<string, unknown> | null = null;
  await step(1, async () => {
    // 専用ブラウザセッションの閲覧履歴を空にしてから開く（ウィンドウ幅は 1280px）
    await page.context().clearCookies();
    note(`ウィンドウ幅 ${page.viewportSize()?.width ?? "?"}px。閲覧履歴の Cookie を消してから開いた`);
    expect(await f.商品詳細を開く("/ja", 商品ID), "日本語サイトの商品詳細画面の応答").toBe(200);
  });
  await step(2, async () => {
    await page.reload({ waitUntil: "load" });
    await f.描画を待つ();
    await expect(f.サムネイル画像(商品名), `「最近チェックした商品」に商品ID ${商品ID} のカード画像がある`).toBeVisible();
  });
  await step(3, async () => {
    note("開発者ツールの Network の代わりに、ページが送る goods_api/get_goods への要求を待って読む");
    const waiting = page.waitForRequest((q) => /goods_api\/get_goods/.test(q.url()), { timeout: 20_000 }).catch(() => null);
    await f.サムネイル画像(商品名).hover();
    req = await waiting;
    note(req ? `要求: ${req.url()}` : "カード画像にマウスを置いて20秒待っても、goods_api/get_goods への要求が出なかった");
  });
  await step(4, async () => {
    const res = req ? await req.response() : null;
    本文 = res ? await res.json().catch(() => null) as Record<string, unknown> | null : null;
    note(`応答: ${res ? `${res.status()}・${JSON.stringify(本文).slice(0, 800)}` : "なし"}`);
  });
  return { get req() { return req; }, get 本文() { return 本文; } } as { req: Request | null; 本文: Record<string, unknown> | null };
}

caseTest("IT-A02-01-016", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-A0201-016〕");
  const got = await 最近チェックした商品で開く(page, step, id, "A02-01基本商品");
  await expected(async () => {
    const url = got.req ? new URL(got.req.url()) : null;
    expect.soft(url?.searchParams.get("product_id") ?? "（要求なし）", "goods_api/get_goods への要求の product_id").toBe(id);
    expect.soft(got.本文?.productId ?? "（応答なし）", "応答 JSON の productId").toBe(n(id));
    expect.soft(got.本文?.productClassId ?? "（応答なし）", "応答 JSON の productClassId").toBe(n(notes.get("〔商品規格ID-A0201-016〕")));
    await expect.soft(page.locator('[class*="popup"]:visible').filter({ hasText: "A02-01基本商品" }), "商品情報のポップアップが表示される").not.toHaveCount(0);
  });
});

caseTest("IT-A02-01-020", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-A0201-020〕");
  const got = await 最近チェックした商品で開く(page, step, id, "A02-01試験商品-020");
  await expected(async () => {
    const url = got.req ? new URL(got.req.url()) : null;
    expect.soft(url?.searchParams.get("product_id") ?? "（要求なし）", "goods_api/get_goods への要求の product_id").toBe(id);
    expect.soft(url?.searchParams.get("lang") ?? "（要求なし）", "goods_api/get_goods への要求の lang").toBe("jp");
    expect.soft(got.本文?.productClassId ?? "（応答なし）", "応答 JSON の productClassId（言語JP・状態HP の 〔商品規格ID-A0201-020A〕）").toBe(n(notes.get("〔商品規格ID-A0201-020A〕")));
    expect.soft(got.本文?.code ?? "（応答なし）", "応答 JSON の code").toBe("JP");
    expect.soft(got.本文?.productClassId ?? "（応答なし）", "言語EN・状態NM の 〔商品規格ID-A0201-020B〕 が返らない").not.toBe(n(notes.get("〔商品規格ID-A0201-020B〕")));
  });
});

// ---- 018: カード詳細の無い商品は 404 ----
caseTest("IT-A02-01-018", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "en", notes.get("〔商品ID-A0201-018〕")); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・本文 ${r.文字}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(404);
    該当なしである(r, "カード詳細が紐づかない商品");
  });
});

caseTest("IT-A02-01-021", 規格IDを見る("ja", "〔商品ID-A0201-021〕", "〔商品規格ID-A0201-021B〕", ["〔商品規格ID-A0201-021A〕"]));

// ---- 022: 在庫0だけの商品でも返る ----
caseTest("IT-A02-01-022", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get("〔商品ID-A0201-022〕")); });
  await step(2, async () => { note(`HTTPステータス ${r.状態}・productClassId ${String(値(r, "productClassId"))}・stock ${String(値(r, "stock"))}`); });
  await expected(async () => {
    expect.soft(r.状態, "HTTPステータス").toBe(200);
    expect.soft(値(r, "productClassId"), "productClassId").toBe(n(notes.get("〔商品規格ID-A0201-022〕")));
    expect.soft(値(r, "stock"), "stock").toBe(0);
  });
});

// ---- 023: 状態の良い規格が画像の順位より先 ----
caseTest("IT-A02-01-023", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get("〔商品ID-A0201-023〕")); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・conditionCode ${String(値(r, "conditionCode"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), "productClassId（NM・画像なしの 〔商品規格ID-A0201-023A〕）").toBe(n(notes.get("〔商品規格ID-A0201-023A〕")));
    expect.soft(値(r, "productClassId"), "HP の 〔商品規格ID-A0201-023B〕 が返らない").not.toBe(n(notes.get("〔商品規格ID-A0201-023B〕")));
    expect.soft(値(r, "conditionCode"), "conditionCode").toBe("NM");
  });
});

// ---- 024: 同じ言語の規格1件の週間販売数 ----
caseTest("IT-A02-01-024", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get("〔商品ID-A0201-024〕")); });
  await step(2, async () => { note(`productClassId ${String(値(r, "productClassId"))}・weeklySold ${String(値(r, "weeklySold"))}`); });
  await expected(async () => {
    expect.soft(値(r, "productClassId"), "productClassId").toBe(n(notes.get("〔商品規格ID-A0201-024〕")));
    expect.soft(値(r, "weeklySold"), "weeklySold").toBe(2);
  });
});

// ---- 025: 規格画像が無ければ商品画像 ----
caseTest("IT-A02-01-025", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { note(NETWORK); r = await 開く(page, "ja", notes.get("〔商品ID-A0201-025〕")); });
  await step(2, async () => { note(`subFileName ${String(値(r, "subFileName"))}・fileName ${String(値(r, "fileName"))}`); });
  await expected(async () => {
    expect.soft(値(r, "subFileName"), "subFileName").toBe(null);
    expect.soft(値(r, "fileName"), "fileName（商品画像のファイル名）").toBe("img/goods/A02-01/main-A0201-025.jpg");
  });
});

caseTest("IT-A02-01-026", 規格IDを見る("en", "〔商品ID-A0201-026〕", "〔商品規格ID-A0201-026B〕", ["〔商品規格ID-A0201-026A〕"]));
caseTest("IT-A02-01-027", 規格IDを見る("en", "〔商品ID-A0201-027〕", "〔商品規格ID-A0201-027A〕", ["〔商品規格ID-A0201-027B〕"]));
caseTest("IT-A02-01-028", 規格IDを見る("ja", "〔商品ID-A0201-028〕", "〔商品規格ID-A0201-028A〕", [], true));
