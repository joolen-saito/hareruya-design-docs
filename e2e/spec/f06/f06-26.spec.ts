/**
 * F06-26 店頭PC用アカウント制御。正本: cases/F06-26_test_cases.tsv
 * 実装するのは 016（1件。条件付き: お気に入り商品機能は保存せず有効であることを確かめるだけ。seeds/f06-26.ts）。
 * 実装しないもの:
 * - 014・017・018・019: 実行コンソールでセール通知のバッチを起動し、メール試験サーバーの受信履歴（≪共有の設定≫）を消して確かめる。画面の操作で行えない。
 * - 020〜025: 本店・支店の店頭用アカウントIPアドレス（共有の設定。入れるとほかの人が店頭用アカウントで使えなくなる）と本店の公開・開店を書き換え、
 *   実行端末の接続元IPを控える必要がある。021 は会員の所属店舗を DB で設定する。PM の判断待ち。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { mailOf, productOf } from "../../seeds/f06-26";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-F06-26-016", async ({ page, step, expected }) => {
  const fav = new FrontFavorite(page);
  const restock = new FrontRestock(page);
  const p = productOf("F0626-SOLD-016");
  let 入荷 = 0;
  let お気に入り = 0;
  await step(1, async () => { await fav.login(mailOf("dpf0626-016-a"), "Passw0rd-F0626016"); });
  await step(2, async () => { await fav.openDetail(p.productId, "JP"); });
  await step(3, async () => {
    入荷 = await restock.classButton(p.classId).count();
    お気に入り = await fav.お気に入りボタン.count();
    note(`「入荷時通知」ボタンは、商品詳細の売り切れの商品規格の行に出る「入荷通知」のボタン（商品規格ID ${p.classId}）として数えた。グッズ商品なので「まとめて入荷通知」は出ない作り。見えたボタン: 入荷通知 ${入荷}・お気に入り ${お気に入り}`);
  });
  await expected(async () => {
    await expect.soft(restock.classButton(p.classId), "商品詳細画面の「入荷時通知」ボタン").toBeVisible();
    await expect.soft(fav.お気に入りボタン, "商品詳細画面の「お気に入り登録/解除」ボタン").toBeVisible();
  });
});
