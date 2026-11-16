/**
 * F06-26 店頭PC用アカウント制御。正本: cases/F06-26_test_cases.tsv
 * 実装するのは 016（条件付き: お気に入り商品機能は保存せず有効であることを確かめるだけ）と、2026-11-12 に足した 020・022〜025（下）。
 * 実装しないもの:
 * - 014・017・018・019: 実行コンソールでセール通知のバッチを起動し、メール試験サーバーの受信履歴（≪共有の設定≫）を消して確かめる。画面の操作で行えない。
 * - 021: 支店店内アカウントの会員の所属店舗の設定と支店の店頭用アカウントIPアドレス（報告で判断待ち）。
 */
import { test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { mailOf, productOf, 本店の店頭用IPを画面で入れる } from "../../seeds/f06-26";
import { Page } from "@playwright/test";
import { SETUP_ADMIN } from "../../config/env";
import { loginAdmin } from "../../lib/session";
import { 受注の番号札 } from "../../db/f06_26";
import { LoginPage } from "../../pages/front/f06_03_login";
import { FrontDetail } from "../../pages/front/f03_02_detail";
import { F0626Front } from "../../pages/front/f06_26_front";
import { ShoppingPage, カートに入れる } from "../../pages/front/f04_shopping";

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

// =====================================================================================
// 020・022〜025 店頭用アカウント（店内アカウント）（2026-11-12 追加）。本店の店頭用アカウントIPアドレスは共有の設定で、
// シードが全項目を控えて書き換え、ケースの終わりに画面で戻して確かめる（seeds/f06-26.ts）。021 は実装しない（報告）。
// =====================================================================================

const 店内 = (n: string) => ({ メール: mailOf(`fgf0626-${n}`), パスワード: `Passw0rd-FGF0626${n}` });

async function 本店にログインする(page: Page, n: string): Promise<string> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く();
  await l.ログインする(店内(n).メール, 店内(n).パスワード);
  return l.path();
}

caseTest("IT-F06-26-020", async ({ page, step, expected }) => {
  const f = new F0626Front(page);
  let 応答 = 0;
  await step(1, async () => {
    const 後 = await 本店にログインする(page, "020");
    note(`ログインのあとの画面: ${後}`);
    expect(await f.ログイン中か(), "店内アカウントでログインできている（ログアウトのリンクがある）").toBe(true);
  });
  await step(2, async () => { 応答 = await f.購入履歴一覧を開く(); note(`購入履歴一覧のアドレスの応答 ${応答}・表示された画面 ${f.path}`); });
  await expected(async () => {
    expect.soft(await f.購入履歴一覧である(), "購入履歴一覧画面は表示されない").toBe(false);
    await expect.soft(f.エラーの見出し, "共通エラー画面のタイトル").toHaveText(/^\s*店頭用アカウントでは利用できません。\s*$/);
    expect.soft(((await f.エラーの本文.textContent().catch(() => null)) ?? "（本文の欄なし）").trim(), "共通エラー画面の本文が空").toBe("");
  });
});

function 注文方法指定まで(n: "022" | "024", page: Page, step: (n: number, f: () => Promise<void>) => Promise<void>): Promise<void> {
  return (async () => {
    const { productId } = productOf(`F0626-FG-ORDER-${n}`);
    await step(1, async () => {
      await 本店にログインする(page, n);
      expect(await new F0626Front(page).ログイン中か(), "店内アカウントでログインできている").toBe(true);
    });
    await step(2, async () => { await カートに入れる(page, "", productId, 1, `IT-F06-26-${n}: 商品詳細でカートに入れる`); });
    await step(3, async () => { await new ShoppingPage(page).買い物かごから開く(""); note(`ご注文方法指定画面: ${page.url()}`); });
  })();
}

caseTest("IT-F06-26-022", async ({ page, step, expected }) => {
  const f = new F0626Front(page);
  let 見出し: string[] = [];
  await 注文方法指定まで("022", page, step);
  await step(4, async () => { 見出し = await f.注文画面の見出しの一覧(); note(`ご注文方法指定画面の見出し: ${見出し.join(" / ")}`); });
  await expected(async () => {
    expect.soft(f.path, "ご注文方法指定画面が表示されている（アドレス）").toMatch(/\/ja\/shopping\/?$/);
    expect.soft(見出し.length, "ご注文方法指定画面の見出しが読めた（画面が表示されている）").toBeGreaterThan(0);
    await expect.soft(f.注文画面の見出し("ご注文主"), "「ご注文主」の見出し").toHaveCount(0);
    await expect.soft(f.注文画面の見出し("お届け先"), "「お届け先」の見出し").toHaveCount(0);
  });
});

caseTest("IT-F06-26-023", async ({ page, step, expected }) => {
  const fav = new FrontFavorite(page);
  const restock = new FrontRestock(page);
  const p = productOf("F0626-FG-SOLD-023");
  let 入荷 = -1, お気に入り = -1, 商品名 = "";
  await step(1, async () => {
    await 本店にログインする(page, "023");
    expect(await new F0626Front(page).ログイン中か(), "店内アカウントでログインできている").toBe(true);
  });
  await step(2, async () => { await fav.openDetail(p.productId, "JP"); 商品名 = await new FrontDetail(page).商品名の文(); });
  await step(3, async () => {
    入荷 = (await restock.classButton(p.classId).count()) + (await restock.bulkButton.count());
    お気に入り = await fav.お気に入りボタン.count();
    note(`商品詳細画面の「入荷時通知」ボタン ${入荷} 個・「お気に入り登録/解除」ボタン ${お気に入り} 個`);
  });
  await expected(async () => {
    expect.soft(商品名, "商品詳細画面が表示されている（商品名の見出し）").toContain(p.code);
    expect.soft(入荷, "「入荷時通知」ボタンの数").toBe(0);
    expect.soft(お気に入り, "「お気に入り登録/解除」ボタンの数").toBe(0);
  });
});

caseTest("IT-F06-26-024", async ({ page, step, expected }) => {
  const f = new F0626Front(page);
  let 注文番号 = "";
  let 結果: { 受注の数: number; 番号札: (string | null)[] } = { 受注の数: 0, 番号札: [] };
  await 注文方法指定まで("024", page, step);
  await step(4, async () => {
    const r = await f.既定のまま注文を確定する("IT-F06-26-024");
    注文番号 = r.注文番号;
    note(`配送方法・支払方法は選ばれていた既定のもの（標準のもの）のまま確定した: 配送方法「${r.配送方法 || "読めない"}」・支払方法「${r.支払方法 || "読めない"}」`);
  });
  await step(5, async () => { note(`注文完了画面の注文番号: ${注文番号}`); expect(注文番号, "注文完了画面の注文番号").not.toBe(""); });
  await step(6, async () => {
    結果 = 受注の番号札(注文番号);
    note(`DB: 注文番号 ${注文番号} の受注 ${結果.受注の数} 件・店舗販売用の整理番号 ${結果.番号札.map((x) => x ?? "なし").join("、")}。「受注に紐づく番号札」は、受注に保存される店舗販売用の整理番号と読んだ`);
  });
  await expected(async () => {
    expect.soft(結果.受注の数, `DB: 注文番号 ${注文番号} の受注の数`).toBe(1);
    expect.soft(結果.番号札.filter((x) => x !== null && x !== "").length, `DB: 注文番号 ${注文番号} の受注に保存された番号札（店舗販売用の整理番号）の数`).toBe(1);
  });
});

caseTest("IT-F06-26-025", async ({ page, browser, notes, step, expected }) => {
  const f = new F0626Front(page);
  let 一回目 = { 画面: "", ログイン中: false };
  let 二回目 = { 画面: "", ログイン中: false };
  await step(1, async () => {
    一回目 = { 画面: await 本店にログインする(page, "025"), ログイン中: await f.ログイン中か() };
    note(`店頭用アカウントIPアドレスが空のときのログインのあと: 画面 ${一回目.画面}・ログイン中 ${一回目.ログイン中 ? "はい" : "いいえ"}`);
  });
  await step(2, async () => {
    await loginAdmin(page, SETUP_ADMIN);
    await 本店の店頭用IPを画面で入れる(page, browser, notes.get("〔接続元IP-F0626-共有〕"));
  });
  await step(3, async () => {
    二回目 = { 画面: await 本店にログインする(page, "025"), ログイン中: await f.ログイン中か() };
    note(`店頭用アカウントIPアドレスを入れたあとのログインのあと: 画面 ${二回目.画面}・ログイン中 ${二回目.ログイン中 ? "はい" : "いいえ"}`);
  });
  await expected(async () => {
    expect.soft(二回目.画面, "手順3のログイン後に本店ECTOPが表示される（アドレス）").toMatch(/^\/ja\/?$/);
    expect.soft(二回目.ログイン中, "手順3のログイン後はログインしている（ログアウトのリンクがある）").toBe(true);
  });
});
