/**
 * A06-18 買取用カード一覧取得の読み取り専用（価格・在庫を書き換えない）。正本: cases/A06-18_test_cases.tsv
 * 実装の解釈は記録 review/A06-18_progress_2026-11-17_dev.md。要求の送り方は pages/admin/a06_mtgbuyer_api.ts（A06-01 と同じ）。
 * 事前準備の「ブラウザでログイン済みで API 認証が成立する」は、手順1の前に管理者のログイン API で認証トークンを受け取り、要求に付ける形にした。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { searchStockByCode, stockInRow } from "../../pages/admin/m04_02_rc_stock";
import { 規格の価格を読む } from "../../pages/admin/a06_product_read";
import { トークンを受け取る, 商品IDで買取カードを取る, 応答に商品コードがある, 応答 } from "../../pages/admin/a06_mtgbuyer_api";
import { rc } from "../../lib/run_marker";
import { SETUP_ADMIN } from "../../config/env";
import { A0618_ADM, A0618の店 } from "../../seeds/a06-18";
import "../../seeds/a06-18";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

caseTest("IT-A06-18-002", async ({ page, notes, step, expected }) => {
  supplement("管理者は決まった印（-E2E）を付けた値、商品コードは実行の印つき。API 認証は、手順1の前に管理者のログイン API で受け取った認証トークンを要求に付けた（値は記録しない）。店舗A は本店に読み替えた");
  const token = await トークンを受け取る(page, A0618_ADM.loginId, A0618_ADM.password);
  const 商品ID = notes.get("〔商品ID-A0618-FG002〕");
  const 規格ID = notes.get("〔商品規格ID-A0618-FG002〕");
  const 商品コード = rc("A0618-FG002-P");
  let r!: 応答;
  let 価格 = { 販売価格: "", 基準価格: "" };
  let 在庫 = -1;
  await step(1, async () => { r = await 商品IDで買取カードを取る(page, "買取用カード一覧取得（本文に商品ID）", 商品ID, "本文", token); });
  await step(2, async () => {
    expect.soft(r.ステータス, "HTTP ステータス").toBe(200);
    expect.soft(応答に商品コードがある(r, 商品コード), `応答に商品コード ${商品コード} の商品がある`).toBe(true);
  });
  await step(3, async () => {
    await loginAdmin(page, SETUP_ADMIN);
    価格 = await 規格の価格を読む(page, 商品ID, 規格ID);
    note(`商品規格登録編集画面（言語 JP・状態 NM）: 販売価格 ${価格.販売価格}・基準価格 ${価格.基準価格}。商品マスターの検索・商品規格一覧の代わりに、控えた商品ID・商品規格IDの商品規格登録編集画面を開いた`);
  });
  await step(4, async () => {
    const list = await searchStockByCode(page, { 商品コード, 店舗: A0618の店.店名, 在庫区分: "EC-CUBE" });
    在庫 = await stockInRow(list.row(商品コード, A0618の店.店名, "EC-CUBE"));
    note(`在庫検索一覧（店舗 ${A0618の店.店名}・在庫場所 EC-CUBE）: 在庫数 ${在庫}`);
  });
  await expected(async () => {
    expect.soft(価格.販売価格, "販売価格（3456 のまま）").toBe("3456");
    expect.soft(価格.基準価格, "基準価格（2345 のまま）").toBe("2345");
    expect.soft(在庫, "店舗A（本店で読み替え）の EC 在庫数（6 のまま）").toBe(6);
  });
});
