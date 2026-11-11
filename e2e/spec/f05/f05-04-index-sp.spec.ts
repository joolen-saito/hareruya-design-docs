/**
 * F05-04 ネット買取商品詳細（フロント）のSP版のうち、検索サービスの索引から出る一覧を確かめるケース（004）。正本: cases/F05-04_test_cases.tsv
 * スマートフォン表示は、iPhone の利用者エージェント・画面の大きさ・タッチの設定のブラウザで代える（f05-04-sp.spec.ts と同じ）。
 * 商品は seeds/f05-04-index.ts が画面で作り、ユニサーチフィード作成で送って、公開側に出るまで待つ。
 */
import { devices, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { NetBuyDetailPage } from "../../pages/front/f05_04_net_detail";
import { ネット買取の検索結果, 一覧の行 } from "../../pages/front/f05_purchase_results";
import { F0504カテゴリ } from "../../seeds/f05-04";
import "../../seeds/f05-04-index";

const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices["iPhone 13"];
test.use({ userAgent, viewport, deviceScaleFactor, isMobile, hasTouch });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-F05-04-004", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  const カテゴリ = rc(F0504カテゴリ.単体);
  let rows: 一覧の行[] = [];
  note(`カテゴリ「タルキール：龍嵐録」は、実行の印つきのカテゴリ「${カテゴリ}」（シングルカードの下）で代えた（シードの注記）`);
  await step(1, async () => {
    const d = new NetBuyDetailPage(page);
    expect(await d.開く(notes.get("〔商品ID-F0504-004A〕")), "ネット買取商品詳細の応答").toBeLessThan(400);
    await expect(d.パンくず, "パンくずリスト（SP版）").toBeVisible();
    note(`パンくず: ${(await d.パンくずの項目()).map((i) => (i.ホーム ? "（ホーム）" : i.名称)).join(" > ")}`);
  });
  await step(2, async () => {
    const d = new NetBuyDetailPage(page);
    const link = d.パンくず.locator("a").filter({ hasText: new RegExp(`^\\s*${カテゴリ}\\s*$`) });
    await expect(link, `パンくずリストの「${カテゴリ}」`).toHaveCount(1);
    await Promise.all([page.waitForURL((u) => u.pathname.includes("/purchase/search"), { timeout: 60_000 }), link.click()]);
    await r.結果を待つ();
    rows = await r.行を読む();
    note(`遷移先: ${decodeURIComponent(page.url())}。一覧: ${rows.map((x) => x.商品名).join("、")}`);
  });
  await expected(async () => {
    await expect.soft(page.locator("body.purchase_search"), "ネット買取商品一覧の画面へ遷移した").toHaveCount(1);
    expect.soft(new URL(page.url()).pathname, "遷移先はカテゴリで検索した一覧").toMatch(/\/purchase\/search\/cate\/\d+/);
    expect.soft(rows.map((x) => x.商品ID).sort(), "商品ID 〔商品ID-F0504-004A〕と〔商品ID-F0504-004B〕が表示された").toEqual([notes.get("〔商品ID-F0504-004A〕"), notes.get("〔商品ID-F0504-004B〕")].sort());
  });
});
