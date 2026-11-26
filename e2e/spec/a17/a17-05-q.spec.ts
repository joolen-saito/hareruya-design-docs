/**
 * A17-05 商品名検索API（商品名から商品詳細の情報を取得）の、カード詳細を持つ商品の出力（012: 商品ID・言語・高額商品コードによる集約・013: 商品名への言語コード付与）。
 * 正本: cases/A17-05_test_cases.tsv。「ブラウザで開く／開発者ツールで確かめる」は、ページで API を開き、その応答（状態・本文）を読む（spec/a17/a17-05.spec.ts と同じ）。
 * 商品名・商品コードには実行の印を付けて作っているので、検索語・期待結果も同じ印つきの値で読む（seeds/a17-05-q.ts）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 商品名で開く } from "../../pages/api/a17_05_product_search";
import { 集約の高額商品コード, 集約カードの商品コード, 集約カードの商品名 } from "../../seeds/a17-05-q";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-A17-05-012", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-A1705-012〕");
  const 名 = 集約カードの商品名("012");
  let r!: Awaited<ReturnType<typeof 商品名で開く>>;
  await step(1, async () => { r = await 商品名で開く(page, 名); note(`応答: 状態 ${r.状態}・本文 ${r.文字.slice(0, 1500)}`); });
  await step(2, async () => {
    const 自分 = r.商品.filter((p) => p.product_id === Number(id));
    note(`商品ID ${id} の出力: ${JSON.stringify(自分.map((p) => ({ 言語: p.language_code, 高額: p.high_price_code, 規格: p.product_classes.map((c) => c.product_code) })))}`);
  });
  await expected(async () => {
    const 自分 = r.商品.filter((p) => p.product_id === Number(id));
    const 組 = (言語: string, 高額: string | null) => 自分.filter((p) => p.language_code === 言語 && p.high_price_code === 高額);
    const コード = (p: typeof 自分[number] | undefined) => (p?.product_classes ?? []).map((c) => String(c.product_code)).sort();
    expect.soft(r.状態, "応答の状態").toBe(200);
    expect.soft(自分.length, "商品ID 〔商品ID-A1705-012〕の出力が3商品にまとめられる").toBe(3);
    expect.soft(組("JP", null).length, "「JP・null」の商品が1件").toBe(1);
    expect.soft(組("EN", null).length, "「EN・null」の商品が1件").toBe(1);
    expect.soft(組(("JP"), 集約の高額商品コード("012")).length, "「JP・HIGH-A-012」の商品が1件").toBe(1);
    expect.soft(コード(組("JP", null)[0]), "「JP・null」の product_classes（規格1・規格2）").toEqual([集約カードの商品コード("012", "1"), 集約カードの商品コード("012", "2")].sort());
    expect.soft(コード(組("EN", null)[0]), "「EN・null」の product_classes（規格3）").toEqual([集約カードの商品コード("012", "3")]);
    expect.soft(コード(組("JP", 集約の高額商品コード("012"))[0]), "「JP・HIGH-A-012」の product_classes（規格4）").toEqual([集約カードの商品コード("012", "4")]);
  });
});

caseTest("IT-A17-05-013", async ({ page, notes, step, expected }) => {
  const id = notes.get("〔商品ID-A1705-013〕");
  const 名 = 集約カードの商品名("013");
  let r!: Awaited<ReturnType<typeof 商品名で開く>>;
  await step(1, async () => { r = await 商品名で開く(page, 名); note(`応答: 状態 ${r.状態}・本文 ${r.文字.slice(0, 1500)}`); });
  await step(2, async () => { note(`商品ID ${id} の product_name: ${JSON.stringify(r.商品.filter((p) => p.product_id === Number(id)).map((p) => [p.language_code, p.product_name]))}`); });
  await expected(async () => {
    const 名前 = r.商品.filter((p) => p.product_id === Number(id)).map((p) => String(p.product_name));
    expect.soft(名前, "product_name に「【JP】組合せ集約カード-013」が出力される").toContain(`【JP】${名}`);
    expect.soft(名前, "product_name に「【EN】組合せ集約カード-013」が出力される").toContain(`【EN】${名}`);
  });
});
