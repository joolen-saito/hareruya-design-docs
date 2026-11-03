/**
 * F06-08 入荷待ち商品一覧。正本: cases/F06-08_test_cases.tsv
 * 実装するのは、カード商品・まとめて入荷通知（カード商品の詳細にだけある）を使わない 002・003・004・009・010・011・024・030・031・032。
 * 入荷通知登録上限数（共有の設定）を20にするシードを使うケースは基盤が1本だけで流し、終わったら控えた値へ戻して画面で確かめる。
 * 記録 review/F06-08_progress_2026-11-04.md
 */
import { Browser, test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { NotifyListPage, 言語 } from "../../pages/front/f06_08_notifylist";
import { mailOf, passwordOf, 上限を20にする, 上限を戻す } from "../../seeds/f06-08";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 上限の補い = "入荷通知登録上限数（共有の設定）をシードの定めどおりケースの開始時に20にし、終わったら控えた値へ戻した";

async function 戻す(browser: Browser): Promise<void> {
  expect(await 上限を戻す(browser), "共有の設定（入荷通知登録上限数）を控えた値へ戻せた").toBe("");
}

caseTest("IT-F06-08-002", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_auth-002"), passwordOf("002"));
  await step(1, async () => { await n.ログアウトする(); });
  await step(2, async () => { await n.開く(); });
  await expected(async () => {
    expect.soft(n.path, "遷移した画面（会員ログイン画面）").toBe("/ja/mypage/login");
    expect.soft(await n.ログイン画面である(), "会員ログイン画面が表示される").toBe(true);
  });
});

function 零件(番号: string, 前半: string, 言: 言語) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const n = new NotifyListPage(page, 言);
    await n.ログインする(mailOf(前半), passwordOf(番号));
    await step(1, async () => { await n.開く(); });
    await expected(async () => {
      expect.soft(n.path, "入荷待ち商品一覧画面に留まる").toBe(`/${言}/mypage/notifylist`);
      expect.soft(await n.商品カード.count(), "入荷待ち商品がない").toBe(0);
      expect.soft(await n.見出し.isVisible(), "一覧の見出しが表示される").toBe(true);
      expect.soft(await n.マイページボタン.isVisible(), "マイページへのリンクが表示される").toBe(true);
      expect.soft(await n.案内文.count(), "入荷通知の案内（商品がある場合の説明文）が表示されない").toBe(0);
    });
  };
}
caseTest("IT-F06-08-003", 零件("003", "f0608_empty-003", "ja"));
caseTest("IT-F06-08-004", 零件("004", "f0608_empty-004", "en"));

function 空の案内(番号: string, 前半: string, 言: 言語, 文: string) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const n = new NotifyListPage(page, 言);
    await n.ログインする(mailOf(前半), passwordOf(番号));
    await step(1, async () => { await n.開く(); });
    await expected(async () => {
      expect.soft(await n.商品なしの案内.innerText().catch(() => ""), "画面上部の案内の文").toContain(文);
    });
  };
}
caseTest("IT-F06-08-030", 空の案内("030", "f0608_gfjp-030", "ja", "入荷待ち商品はありません。"));
caseTest("IT-F06-08-031", 空の案内("031", "f0608_gfen-031", "en", "No items waiting for restock."));

caseTest("IT-F06-08-024", async ({ page, step, expected }) => {
  const n = new NotifyListPage(page);
  await n.ログインする(mailOf("f0608_empty-024"), passwordOf("024"));
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.押して遷移する(n.マイページボタン); });
  await expected(async () => { expect.soft(n.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/); });
});

// ---- 通知が1件ある会員（上限20の共有の設定） ----
caseTest("IT-F06-08-009", async ({ page, browser, step, expected }) => {
  try {
    supplement(上限の補い);
    await 上限を20にする(browser);
    const n = new NotifyListPage(page);
    await n.ログインする(mailOf("f0608_name-009"), passwordOf("009"));
    await step(1, async () => { await n.開く(); });
    let 上部 = "";
    await step(2, async () => { 上部 = await n.画面上部の文(); });
    await expected(async () => {
      expect.soft(await n.一覧画面である(), "入荷待ち商品一覧画面が表示される").toBe(true);
      expect.soft(上部, "画面上部に会員の氏名「晴屋太郎-009」が表示されない").not.toMatch(/晴屋|太郎-009/);
    });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-08-010", async ({ page, browser, step, expected }) => {
  try {
    supplement(上限の補い);
    await 上限を20にする(browser);
    const n = new NotifyListPage(page);
    await n.ログインする(mailOf("f0608_breadcrumb-010"), passwordOf("010"));
    await step(1, async () => { await n.開く(); });
    await step(2, async () => { await n.現在地を押す(); });
    await expected(async () => {
      expect.soft(await n.現在地がリンクか(), "現在表示中ページが押下可能なリンクになっている").toBe(false);
      expect.soft(n.path, "入荷待ち商品一覧画面に留まる").toBe("/ja/mypage/notifylist");
    });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-08-011", async ({ page, browser, step, expected }) => {
  try {
    supplement(上限の補い);
    await 上限を20にする(browser);
    const n = new NotifyListPage(page);
    await n.ログインする(mailOf("f0608_home-011"), passwordOf("011"));
    await step(1, async () => { await n.開く(); });
    await step(2, async () => { await n.押して遷移する(n.パンくずホーム); });
    await expected(async () => { expect.soft(n.path, "遷移した画面（本店ECTOP）").toMatch(/^\/(ja\/?)?$/); });
  } finally { await 戻す(browser); }
});
caseTest("IT-F06-08-032", async ({ page, browser, step, expected }) => {
  try {
    supplement(上限の補い);
    await 上限を20にする(browser);
    const n = new NotifyListPage(page);
    await n.ログインする(mailOf("f0608_single-032"), "Passw0rd-F0608032");
    await step(1, async () => { await n.開く(); });
    let 件数 = "";
    let 名前: string[] = [];
    await step(2, async () => { 件数 = await n.商品件数の表示(); 名前 = await n.商品名一覧(); });
    await expected(async () => {
      expect.soft(件数, "商品件数の表示").toMatch(/1\s*件/);
      expect.soft(名前, "表示された商品名（1商品だけ）").toEqual([rc("テスト単品通知-032")]);
    });
  } finally { await 戻す(browser); }
});
