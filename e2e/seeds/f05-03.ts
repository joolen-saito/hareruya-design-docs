/**
 * F05-03 ネット買取商品一覧（フロント）の画面シード。正本: cases/F05-03_seed_data.tsv
 *
 * 作るシード:
 * - ENV（共有可）: 共有の設定（本店・検索の接続先・商品フィードの送信先）は書き換えず、ログインなしでネット買取商品一覧が開けることだけを確かめる。
 * - MASTER（共有可）: 参照するだけ。まとめて買取商品の登録・追加システム設定の書き換え・買取TOP用タグの設定（DB への直接設定）は共有の設定・マスタの書き換えなので行わず、
 *   追加システム設定のまとめて買取商品IDの今の値を読み、シード表の呼び名〔商品レコードID-F0503-共有〕に控える（未設定なら「未設定」）。
 * - BREADCRUMB-011（ケース専用）: カテゴリ3階層・レアリティ・タグを画面で作り、番号を控える。名称には実行の印（rc）を付ける。
 *
 * 作らないシード（理由は PM への報告に書く）:
 * - 商品を作ってユニサーチフィード作成で外部の検索索引へ反映し、索引で確かめるまでを定めるシード全般
 *   （LIMIT・PAGING・FILTER・SORT・VIEW・ELIGIBILITY・PRICE・CART・INCOMING・PAGE*・QTYDEC・CB* など）。
 *   開発環境の索引は共有で、フィードの更新は索引全体の再作成であり、画面で作った少数の商品だけの結果を作れない。
 * - BANNER（共有のレイアウトのブロック配置を書き換えて戻す）。
 *
 * BREADCRUMB-011 でシード表から読み替えたこと:
 * - 商品 BREAD-001-011（グッズ商品CSV登録→カード指定→規格の公開→ユニサーチフィードの更新）は作らない。ケース011はパンくずの表示だけを確かめ、
 *   商品の表示や索引の件数を確かめない。グッズ商品CSV登録のカテゴリIDには開発環境の不具合（ECCUBE_HARERUYA-3966）もある。
 * - カテゴリ一覧の最上位は「子カテゴリ作成」の入力欄が無いので、最上位の「スタンダード-011」はカテゴリ登録CSVで作り、2階層目・3階層目は画面の「子カテゴリ作成」で作る。
 * - レアリティのコードは「F3」＋実行の印、タグの並び順は 9990。カテゴリ・タグ・レアリティの英語名は半角英数字と空白に実行の印を付けた値。
 */
import { Browser, expect } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { RUN_MARK, rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { hideDebugToolbar, withAdminSession } from "../lib/session";
import { CategoryPage, createTopByCsv } from "../pages/admin/category";
import { まとめて買取商品IDを読む } from "../pages/admin/f05_01_setup";
import { レアリティを登録する } from "../pages/admin/f05_03_setup";
import { TagPage } from "../pages/admin/m03_13_tag";
import { PurchaseSearchPage } from "../pages/front/f05_02_purchase_search";

async function ログインなしで一覧が開ける(browser: Browser, seedId: string): Promise<void> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const list = new PurchaseSearchPage(await context.newPage());
    const status = await list.開く();
    expect(status, `${seedId}: ログインなしでネット買取商品一覧が開けない`).toBeLessThan(400);
    await expect(list.一覧の印, `${seedId}: ネット買取商品一覧の画面`).toHaveCount(1);
  } finally {
    await context.close();
  }
}

defineSeed("S-F05-03-ENV", async ({ browser, seed }) => {
  await ログインなしで一覧が開ける(browser, seed.シードID);
  reportSeedIssue(seed.シードID, "本店の言語・本店フラグ・公開状態、検索の接続先、商品フィードの送信先は、共有の設定なので書き換えていない。ログインなしでネット買取商品一覧が開けることだけを確かめた");
});

defineSeed("S-F05-03-MASTER", async ({ browser, seed, notes }) => {
  const now = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return (await まとめて買取商品IDを読む(page)).trim();
  });
  notes.set("〔商品レコードID-F0503-共有〕", now || "未設定");
  reportSeedIssue(seed.シードID, `参照専用のマスタなので、何も登録・設定していない。まとめて買取商品の登録と追加システム設定のまとめて買取商品IDの書き換え、買取TOP用タグの設定（DB への直接設定）は共有の設定・マスタの書き換えなので行わず、追加システム設定のまとめて買取商品IDの今の値「${now || "未設定"}」を控えた。このシードを使うケースは、販売側とネット買取側のカテゴリ一覧の比較（040）だけ`);
});

/** BREADCRUMB-011 が作ったレアリティの番号（シード表に呼び名が無いので、控えとは別に持つ）と、印つきの名称 */
export const F0503_011 = { レアリティID: "", 名称: { 最上位: rc("スタンダード-011"), カテゴリ: rc("タルキール：龍嵐録-011"), レア: rc("レア・神話レア-011"), タグ: rc("デッキセット-011") } };

defineSeed("S-F05-03-BREADCRUMB-011", async ({ browser, seed, notes }) => {
  const seedId = seed.シードID;
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const 名 = {
    A: rc("スタンダード-011"), B: rc("タルキール：龍嵐録-011"), レア: rc("レア・神話レア-011"), タグ: rc("デッキセット-011"),
  };
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const 英 = (s: string) => `F0503 ${s} ${RUN_MARK}`;
    const a = await createTopByCsv(page, { nameJp: 名.A, nameEn: 英("Standard 011"), frontHide: "0", branchHide: "0" }, `f0503-011a-${Date.now()}.csv`, issue);
    notes.set("〔カテゴリレコードID-F0503-011A〕", a);
    const category = new CategoryPage(page);
    const b = await category.createChild(a, { nameJp: 名.B, nameEn: 英("Tarkir Dragonstorm 011 B") }, issue);
    notes.set("〔カテゴリレコードID-F0503-011B〕", b);
    const c = await category.createChild(b, { nameJp: 名.B, nameEn: 英("Tarkir Dragonstorm 011 C") }, issue);
    notes.set("〔カテゴリレコードID-F0503-011C〕", c);
    const rarity = await レアリティを登録する(page, { 日本語名: 名.レア, 英語名: 英("Rare Mythic 011"), コード: `F3${RUN_MARK}` }, seedId);
    F0503_011.レアリティID = rarity;
    const tag = new TagPage(page);
    await tag.openNew();
    const tagId = await tag.register({ 名称日: 名.タグ, 名称英: 英("Deck Set 011"), 並び順: "9990" }, `${seedId}: タグ「${名.タグ}」の登録`);
    notes.set("〔タグレコードID-F0503-011〕", tagId);
  });
  issue("読み替え: 商品 BREAD-001-011（商品・カード・規格の公開・ユニサーチフィードの更新）は作らない。ケースはパンくずの表示だけを確かめ、商品の表示や索引の件数を確かめない。カテゴリの最上位はカテゴリ登録CSV、2階層目・3階層目は「子カテゴリ作成」で作った");
});
