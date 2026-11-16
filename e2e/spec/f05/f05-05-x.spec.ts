/**
 * F05-05 ネット買取カート（DB の書き込みが手順にあるケース）。正本: cases/F05-05_test_cases.tsv
 * 実装: 001（手順2で、画面で作った印つきの商品の商品名・買取価格・商品画像を DB で更新する。足した商品画像は、ケースの終わりに消す）。
 * 見送りは f05-05.spec.ts の冒頭（022・029 は共有の基本設定「まとめて買取商品ID」の書き換え）。
 */
import { test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { 商品の名前と買取価格と画像を更新する, 商品の現在の値 } from "../../db/f05_05_x";
import { NetBuyCart05Page } from "../../pages/front/f05_05_cart";
import { f0505会員, f0505商品 } from "../../seeds/f05-05";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-F05-05-001", async ({ page, step, expected }) => {
  note("事前準備の「ログイン済み・買取カートに入っている」は、ケースの冒頭（手順1の前）で、会員ログイン画面でログインし、買取商品詳細の画面から記載数量でカートに入れて用意した。"
    + "買取価格が500円未満の商品は「カートに追加」ボタンが出ないため、ボタンが送る追加の要求と同じ要求を画面のスクリプトから送って入れた");
  note("商品名・商品画像のファイル名には、実行ごとの印を付けた値を使った（更新前「更新前カードA-001」・更新後「更新後カードA-001」。画像は「after-a.webp」）。画像のファイルは置かない（画面が出す画像のアドレスのファイル名で確かめる）");
  const c = new NetBuyCart05Page(page);
  const m = f0505会員("S-F05-05-CUS-001");
  await c.ログインする(m.メール, m.パスワード);
  const A = f0505商品("S-F05-05-CART-001", "A");
  const B = f0505商品("S-F05-05-CART-001", "B");
  for (const p of [A, B]) await c.カートへ入れる(p.商品ID, p.規格ID, p.言語, p.数量);
  const 更新後の名 = rc("更新後カードA-001");
  const 画像名 = rc("after-a.webp");
  let 名前 = ""; let 画像 = ""; let 単価 = ""; let A行: { 数量: string; 合計: string } | null = null; let B行: { 数量: string; 合計: string } | null = null; let 小計 = "";
  await step(1, async () => { await c.開いて整える(); });
  await step(2, async () => {
    商品の名前と買取価格と画像を更新する("IT-F05-05-001 の商品更新", { 商品ID: A.商品ID, 規格ID: A.規格ID, 商品名: 更新後の名, 買取価格: 150, 画像ファイル名: 画像名 });
    const 値 = 商品の現在の値(A.商品ID, A.規格ID);
    note(`DB の更新後の値: 商品名「${値.商品名}」・買取価格 ${値.買取価格} 円・商品画像「${値.画像 ?? "なし"}」`);
  });
  await step(3, async () => {
    await c.再読み込みして整える();
    名前 = (await c.商品名リンク(A.規格ID).innerText()).trim();
    画像 = (await c.画像(A.規格ID).getAttribute("src")) ?? "";
    単価 = (await c.行(A.規格ID).locator(".p-hareruya-cart-item__price").innerText()).replace(/[¥,\s]/g, "");
    A行 = await c.行を読む(A.規格ID);
    B行 = await c.行を読む(B.規格ID);
    小計 = await c.小計を読む();
  });
  await expected(async () => {
    expect.soft(名前, "規格F0505-A-001-001の商品名（現在の商品名）").toBe(更新後の名);
    expect.soft(単価, "規格F0505-A-001-001の買取価格（円）").toBe("150");
    expect.soft(画像, "規格F0505-A-001-001の商品画像のアドレスのファイル名").toContain(画像名);
    expect.soft(A行, "規格F0505-A-001-001の数量と商品ごとの合計金額").toEqual({ 数量: "2", 合計: "300" });
    expect.soft(B行, "規格F0505-B-001-001の数量と商品ごとの合計金額").toEqual({ 数量: "3", 合計: "600" });
    expect.soft(小計, "規格F0505-B-001-001を含む小計").toBe("900");
  });
});
