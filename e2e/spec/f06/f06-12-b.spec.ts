/**
 * F06-12 ネット買取の一括買取確認（続き）。正本: cases/F06-12_test_cases.tsv
 * 実装するのは 008〜011（依頼の持ち主・依頼の有無・ログインの有無・参照で更新されないことを確かめるケース）。
 * 実装しない: 001〜003・005・012・013（まとめて買取の明細・個別入力の明細を画面で作れない）。
 * 明細は画面で作れないため、008〜011 は明細の無いネット買取依頼で行った（条件付き）。
 * 記録 review/F06-12_progress_2026-11-08.md
 */
import { Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { 依頼の状態, ネット買取依頼の所有会員ID } from "../../db/f06_12";
import { LoginPage } from "../../pages/front/f06_03_login";
import { NetBulkPage } from "../../pages/front/f06_12_net_bulk";
import { markedMail } from "../../seeds/f06-member";
import { 依頼一覧, 参照会員のパスワード } from "../../seeds/f06-12-b";
import "../../seeds/f06-12-b";

const note = (type: string, m: string) => { test.info().annotations.push({ type, description: m }); };
const 明細なしの補い = () => note("正本の外の補い", "まとめて買取の明細（通常・個別入力）は画面で作れないため、明細の無いネット買取依頼で行った。依頼のIDは画面が振った番号（正本の固定の番号ではない）");
const ネットワークの注記 = () => note("手順の注記", "開発者ツールのNetworkの代わりに、ページを開いたときの応答の状態を読んだ");

const 依頼 = (n: string) => { const d = 依頼一覧.get(n); if (!d) throw new Error(`依頼 ${n} が作られていない`); return d; };
async function ログインする(page: Page, n: string): Promise<void> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(markedMail(`f0612_member-${n}`), 参照会員のパスワード(n));
}

caseTest("IT-F06-12-008", async ({ page, step, expected }) => {
  await ログインする(page, "008");
  const d = 依頼("008");
  const n = new NetBulkPage(page);
  let status = 0;
  await step(1, async () => { status = await n.開く(`/mypage/purchase_history/net/${d.買取依頼ID}/bulk`); });
  ネットワークの注記(); 明細なしの補い();
  await step(2, async () => { expect(status, "応答の状態を取得できた").toBeGreaterThan(0); });
  await expected(async () => { expect.soft(status, "他会員が所有する買取依頼IDを指定した要求のHTTPステータス").toBe(404); });
});

caseTest("IT-F06-12-009", async ({ page, step, expected }) => {
  const d = 依頼("009");
  // 会員のセッションは無い（新しいブラウザセッション）
  const n = new NetBulkPage(page);
  await step(1, async () => { await n.開く(`/mypage/purchase_history/net/${d.買取依頼ID}/bulk`); });
  明細なしの補い();
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移した画面（会員ログイン）").toBe("/ja/mypage/login");
    expect.soft(await page.locator("form#login_mypage").count(), "会員ログイン画面が表示されている").toBeGreaterThan(0);
    expect.soft(await page.locator(".p-hareruya-purchase-list__row").count(), "まとめて買取査定結果の行は表示されない").toBe(0);
  });
});

caseTest("IT-F06-12-010", async ({ page, step, expected }) => {
  await ログインする(page, "010");
  const d = 依頼("010");
  const n = new NetBulkPage(page);
  let status = 0;
  await step(1, async () => { status = await n.開く(`/mypage/purchase_history/net/${d.買取依頼ID}/bulk`); });
  await step(2, async () => { expect(status, "応答の状態を取得できた").toBeGreaterThan(0); });
  // 同じIDのネット買取依頼があっても、持ち主はこの会員でないことをDBの参照で確かめる（0件か他会員の依頼）
  const 持ち主 = ネット買取依頼の所有会員ID(d.買取依頼ID);
  note("正本の外の補い", `店頭買取の依頼ID ${d.買取依頼ID} は画面が振った番号（正本の固定の番号ではない）。同じIDのネット買取依頼は${持ち主 === null ? "0件" : "他の会員の依頼が1件ある"}`);
  await expected(async () => {
    expect.soft(status, "店頭買取だけが存在する依頼IDの応答のHTTPステータス（まとめて買取査定結果は表示されない）").toBe(404);
    expect.soft(await page.locator(".p-hareruya-purchase-list__row").count(), "まとめて買取査定結果の行は表示されない").toBe(0);
  });
});

caseTest("IT-F06-12-011", async ({ page, step, expected }) => {
  await ログインする(page, "011");
  const d = 依頼("011");
  const n = new NetBulkPage(page);
  let 前 = 依頼の状態(d.買取依頼ID);
  let 後 = 前;
  await step(1, async () => { 前 = 依頼の状態(d.買取依頼ID); });
  await step(2, async () => { await n.開く(`/mypage/purchase_history/net/${d.買取依頼ID}/bulk`); });
  await step(3, async () => { 後 = 依頼の状態(d.買取依頼ID); });
  明細なしの補い();
  note("正本の外の補い", "更新日時を2026-09-11 12:00:00にそろえる準備（DBでの設定）は行わず、画面を開く前後の値を比べた");
  await expected(async () => {
    expect.soft(後.更新日時, "買取依頼の更新日時が画面の参照の前後で変わらない").toBe(前.更新日時);
    expect.soft(後.通常明細の件数, "買取の明細（まとめて買取を含む）の件数が変わらない").toBe(前.通常明細の件数);
    expect.soft(後.個別入力明細の件数, "個別入力の明細の件数が変わらない").toBe(前.個別入力明細の件数);
  });
});
