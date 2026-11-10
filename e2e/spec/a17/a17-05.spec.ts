/**
 * A17-05 [任意門]商品名から商品詳細の情報を取得（商品名検索API）。正本: cases/A17-05_test_cases.tsv
 * 実装しないケース（記録 review/A17-05_progress_2026-11-10_dev.md）: 007・011・025（DBでの準備）、012・013（カードのマスタの登録。後回し）。
 * ケースの「ブラウザで開く／開発者ツールの Network で確かめる」は、ページで API を開き、その応答（状態・本文・送った要求の見出し）を読む。
 * 商品名には実行の印を付けて作っているので、ケースの検索語・期待結果の商品名・商品コードも同じ印を付けた値で読む（seeds/a17-05.ts）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import {
  商品IDの, 商品の一覧があるか, 商品名で開く, 型, 処理結果, 規格IDの, 規格IDの並び, 項目の名前, 応答,
} from "../../pages/api/a17_05_product_search";
import { 全件の商品ID, 全件の検索語 } from "../../seeds/a17-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 見る = (r: 応答) => note(`応答: 状態 ${r.状態}・本文 ${r.文字.length > 1500 ? `${r.文字.slice(0, 1500)}…（${r.文字.length}文字）` : r.文字}`);
const NETWORK = "開発者ツールの Network の代わりに、開いたページの応答（状態・本文・送った要求の見出し）をそのまま読む";

// ---- 001: 認証情報なしで開ける ----
caseTest("IT-A17-05-001", async ({ page, step, expected }) => {
  let r!: 応答;
  const cookies: string[] = [];
  await step(1, async () => {
    note(NETWORK);
    expect((await page.context().cookies()).length, "開く前のブラウザに Cookie が無い（未認証）").toBe(0);
  });
  await step(2, async () => {
    r = await 商品名で開く(page, rc("結合基本商品-001"));
    for (const k of Object.keys(r.送った見出し)) if (k === "cookie" || k === "authorization") cookies.push(k);
    見る(r);
  });
  await expected(async () => {
    expect.soft(cookies, "送った要求に認証情報（Cookie・認可の見出し）が無い").toEqual([]);
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(r.JSONか, "応答の本文がJSONとして読める").toBe(true);
    expect.soft(r.種類, "応答の種類（JSON）").toMatch(/application\/json/);
  });
});

// ---- 002: 101件が重複・欠落なく出る ----
caseTest("IT-A17-05-002", async ({ page, step, expected }) => {
  let r!: 応答; let ids: unknown[] = [];
  await step(1, async () => { r = await 商品名で開く(page, 全件の検索語()); });
  await step(2, async () => { ids = r.商品.map((p) => p.product_id); note(`商品の一覧の件数 ${ids.length}・件数の項目 ${String(処理結果(r).件数)}`); });
  await expected(async () => {
    const want = 全件の商品ID.map(Number);
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(ids.length, "商品の一覧の件数（101件）").toBe(101);
    expect.soft(new Set(ids).size, "商品の一覧に同じ商品IDが重ならない").toBe(ids.length);
    expect.soft(want.filter((id) => !ids.includes(id)).length, "作った101件のうち一覧に無い商品の数（欠落）").toBe(0);
    expect.soft(ids.filter((id) => !want.includes(id as number)).length, "作った101件以外の商品の数").toBe(0);
  });
});

// ---- 003: 商品と商品規格の各項目と型 ----
caseTest("IT-A17-05-003", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 商品名で開く(page, rc("結合基本商品-003")); 見る(r); });
  await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
  await expected(async () => {
    const p = 商品IDの(r, notes.get("〔商品ID-A1705-003〕"));
    const c = 規格IDの(p, notes.get("〔規格ID-A1705-003〕"));
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(p?.product_id ?? "（商品が無い）", "商品ID（整数）").toBe(Number(notes.get("〔商品ID-A1705-003〕")));
    expect.soft(型(p?.product_id), "商品IDの型").toBe("整数");
    expect.soft(p?.product_name, "商品名（文字列）").toBe(rc("結合基本商品-003"));
    expect.soft(p?.language_code, "言語コード").toBe("JP");
    expect.soft(p?.high_price_code, "高額商品コード（null）").toBe(null);
    expect.soft(p?.categories, "カテゴリ（試験カテゴリA・試験カテゴリBの配列）").toEqual(["試験カテゴリA", "試験カテゴリB"]);
    expect.soft(p?.region_restriction, "販売制限").toBe("制限なし");
    expect.soft(c?.product_class_id ?? "（規格が無い）", "規格ID（整数）").toBe(Number(notes.get("〔規格ID-A1705-003〕")));
    expect.soft(c?.product_code, "商品コード（文字列）").toBe(rc("A1705-BASE-NM-003"));
    expect.soft(c?.card_condition_code, "状態コード").toBe("NM");
    expect.soft(c?.price, "販売価格（整数）").toBe(100);
    expect.soft(c?.stock, "在庫数（整数）").toBe(3);
    expect.soft([型(p?.product_name), 型(p?.language_code), 型(p?.categories), 型(p?.region_restriction)], "商品名・言語コード・カテゴリ・販売制限の型").toEqual(["文字列", "文字列", "配列", "文字列"]);
    expect.soft([型(c?.product_code), 型(c?.card_condition_code), 型(c?.price), 型(c?.stock)], "商品コード・状態コード・販売価格・在庫数の型").toEqual(["文字列", "文字列", "整数", "整数"]);
  });
});

// ---- 規格の選別（出るもの・出ないもの） ----
function 規格の選別(番号: string, 商品名: string, 出る: string[], 出ない: string[], 説明: string) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    let r!: 応答;
    await step(1, async () => { r = await 商品名で開く(page, rc(商品名)); 見る(r); });
    await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
    await expected(async () => {
      const ids = r.商品.flatMap((p) => 規格IDの並び(p));
      const id = (k: string) => Number(notes.get(`〔規格ID-A1705-${番号}${k}〕`));
      expect.soft(r.状態, "応答の状態").toBe(200);
      for (const k of 出る) expect.soft(ids.includes(id(k)), `規格 ${k}（${説明}）が出る`).toBe(true);
      for (const k of 出ない) expect.soft(ids.includes(id(k)), `規格 ${k}（${説明}）が出ない`).toBe(false);
    });
  };
}
caseTest("IT-A17-05-008", 規格の選別("008", "規格選別商品-008", ["A", "B"], ["C", "D"], "A=NM・販売価格1、B=SP・販売価格100、C=削除済み、D=販売価格0"));
caseTest("IT-A17-05-015", 規格の選別("015", "状態境界商品-015", ["A", "B"], ["C"], "A=NM、B=SP・販売価格100、C=MP・販売価格99"));

// ---- 009・010: 404 ----
function 見つからない(商品名: string | null) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    let r!: 応答;
    await step(1, async () => { note(NETWORK); });
    await step(2, async () => { r = await 商品名で開く(page, 商品名); 見る(r); });
    await step(3, async () => { note(`応答の項目: ${項目の名前(r).join("、")}`); });
    await expected(async () => {
      const x = 処理結果(r);
      expect.soft(r.状態, "応答の状態").toBe(404);
      expect.soft(x.コード, "処理結果コード").toBe(404);
      expect.soft(x.メッセージ, "メッセージ").toBe("Not Found");
      expect.soft(項目の名前(r).length, "応答の項目は処理結果コードとメッセージの2つだけ").toBe(2);
      expect.soft(商品の一覧があるか(r), "商品の一覧が含まれない").toBe(false);
    });
  };
}
caseTest("IT-A17-05-009", 見つからない(null));
caseTest("IT-A17-05-010", 見つからない("存在しない商品名A1705"));

// ---- 014: カード詳細の無い商品の商品名 ----
caseTest("IT-A17-05-014", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 商品名で開く(page, rc("非カード商品-014")); 見る(r); });
  await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
  await expected(async () => {
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(商品IDの(r, notes.get("〔商品ID-A1705-014〕"))?.product_name ?? "（商品が無い）", "商品名（言語の印が付かない）").toBe(rc("非カード商品-014"));
  });
});

// ---- 017: NM の規格だけ ----
caseTest("IT-A17-05-017", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 商品名で開く(page, rc("NM限定商品-017")); 見る(r); });
  await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
  await expected(async () => {
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(規格IDの並び(商品IDの(r, notes.get("〔商品ID-A1705-017〕"))), "商品規格の一覧（NMの規格Aだけ）").toEqual([Number(notes.get("〔規格ID-A1705-017A〕"))]);
  });
});

// ---- 018: 高額商品コードのある商品は NM だけに絞らない ----
caseTest("IT-A17-05-018", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 商品名で開く(page, rc("高額商品条件-018")); 見る(r); });
  await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
  await expected(async () => {
    const p = r.商品.find((x) => x.product_id === Number(notes.get("〔商品ID-A1705-018〕")) && x.high_price_code === "HIGH-A-018");
    const ids = 規格IDの並び(p);
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(p?.high_price_code ?? "（高額商品コードの商品が無い）", "高額商品コード").toBe("HIGH-A-018");
    expect.soft(ids.includes(Number(notes.get("〔規格ID-A1705-018A〕"))), "NMの規格Aが出る").toBe(true);
    expect.soft(ids.includes(Number(notes.get("〔規格ID-A1705-018B〕"))), "在庫0のSPの規格Bが出る").toBe(true);
  });
});

// ---- 019: 状態コード（状態別称があればそれ） ----
caseTest("IT-A17-05-019", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 商品名で開く(page, rc("状態コード商品-019")); 見る(r); });
  await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
  await expected(async () => {
    const all = r.商品.flatMap((p) => p.product_classes ?? []);
    const 状態 = (k: string) => all.find((c) => c.product_class_id === Number(notes.get(`〔規格ID-A1705-019${k}〕`)))?.card_condition_code ?? "（規格が無い）";
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(状態("A"), "状態別称のある規格Aの状態コード").toBe("鑑定済NM");
    expect.soft(状態("B"), "状態別称の無い規格Bの状態コード").toBe("SP");
  });
});

// ---- 020: 規格画像のURL ----
caseTest("IT-A17-05-020", async ({ page, notes, step, expected }) => {
  let r!: 応答;
  await step(1, async () => { r = await 商品名で開く(page, rc("画像変換商品-020")); 見る(r); });
  await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
  await expected(async () => {
    const c = 規格IDの(商品IDの(r, notes.get("〔商品ID-A1705-020〕")), notes.get("〔規格ID-A1705-020〕"));
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(c?.product_class_images ?? "（規格が無い）", "規格画像のURL").toEqual(["https://stg-files.hareruyamtg.com/img/goods/L/M21/JP/0204-020.jpg"]);
  });
});

// ---- 026〜029: 規格の並び・販売価格・状態コード ----
function 規格の並び(番号: string, 期待: { 印: string; 価格: number; 状態: string }[]) {
  return async ({ page, notes, step, expected }: CaseCtx): Promise<void> => {
    let r!: 応答;
    await step(1, async () => { r = await 商品名で開く(page, rc(`組合せ商品A1705-CB${番号}`)); 見る(r); });
    await step(2, async () => { note(`商品の一覧の件数 ${r.商品.length}`); });
    await expected(async () => {
      const p = 商品IDの(r, notes.get(`〔商品ID-A1705-${番号}〕`));
      const got = (p?.product_classes ?? []).map((c) => ({ 規格ID: c.product_class_id, 販売価格: c.price, 状態コード: c.card_condition_code }));
      const want = 期待.map((e) => ({ 規格ID: Number(notes.get(`〔規格ID-A1705-${番号}${e.印}〕`)), 販売価格: e.価格, 状態コード: e.状態 }));
      expect.soft(r.状態, "応答の状態").toBe(200);
      expect.soft(got, "商品規格の一覧（規格ID・販売価格・状態コードの並び）").toEqual(want);
    });
  };
}
caseTest("IT-A17-05-026", 規格の並び("026", [{ 印: "", 価格: 99, 状態: "NM" }]));
caseTest("IT-A17-05-027", 規格の並び("027", [{ 印: "A", 価格: 150, 状態: "NM" }, { 印: "B", 価格: 150, 状態: "SP" }]));
caseTest("IT-A17-05-028", 規格の並び("028", [{ 印: "A", 価格: 99, 状態: "NM" }, { 印: "B", 価格: 150, 状態: "SP" }]));
caseTest("IT-A17-05-029", 規格の並び("029", [{ 印: "A", 価格: 120, 状態: "NM" }, { 印: "B", 価格: 180, 状態: "SP" }]));
