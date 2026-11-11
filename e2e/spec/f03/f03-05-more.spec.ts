/**
 * F03-05 商品リコメンド（012・013 以外）。正本: cases/F03-05_test_cases.tsv
 *
 * 実装しないケース: 002（購入完了の表示対象は注文したブラウザの状態で、シードの場では作れない）、009・030・032・034（TC大阪支店の在庫の準備）、
 * 017・019・021（状態別の規格の価格・在庫の準備）。理由は e2e/review/F03-05_progress_2026-11-11.md。
 * 注文はDBで印つきの受注を作る（seeds/f03-05-more.ts）。共有の設定（レコメンド検索期間）を書き換えるので、基盤が1本だけで流す。
 * 画面の作り: 商品詳細・マイページ・買い物かごのおすすめ商品枠は、サーバーが描画した枠（遅延描画の仕組みは見当たらない）で、送りボタンで横に進むカルーセル。
 */
import { Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { FrontRecommend, 表示された商品 } from "../../pages/front/f03_05_recommend";
import { 同時購入の実績を置き換える, memberOf, productOf } from "../../seeds/f03-05-more";
import { restoreRecommendDays, 開始時に検索期間を30にする } from "../../seeds/f03-05";

/** 検索期間を30にして始め、終わったら控えた値へ戻す */
async function 案(ctx: CaseCtx, body: (ctx: CaseCtx) => Promise<void>): Promise<void> {
  try {
    await 開始時に検索期間を30にする(ctx.browser);
    await body(ctx);
  } finally {
    await restoreRecommendDays(ctx.browser);
  }
}

const idOf = (code: string): string => productOf(code).productId;
const 十件 = (no: string): string[] => Array.from({ length: 10 }, (_, i) => idOf(`LIMIT-${String(i + 1).padStart(2, "0")}-${no}`));
const ids = (rows: 表示された商品[]): string[] => rows.map((r) => r.商品ID);

/** おすすめ商品枠までスクロールして、描画を待ち、並んだ商品を読む（前送りで最後まで見るときは最後まで押す） */
async function 枠を読む(front: FrontRecommend, 前送り = false): Promise<表示された商品[]> {
  await front.枠までスクロールする();
  await front.描画を待つ();
  return 前送り ? front.前送りで最後まで見て読む() : front.表示された商品();
}

async function 商品詳細を開く(front: FrontRecommend, code: string): Promise<void> {
  expect(await front.商品詳細を開く("/ja", idOf(code)), "日本語表示の商品詳細の応答").toBeLessThan(400);
}

/** 手順2: おすすめ商品枠までスクロールして、描画を待ち、並んだ商品を読む */
async function 枠まで進んで読む(front: FrontRecommend): Promise<表示された商品[]> {
  await front.枠までスクロールする();
  await front.描画を待つ();
  return front.表示された商品();
}

async function 会員でログインする(page: Page, key: string): Promise<void> {
  const m = memberOf(key);
  await frontLogin(page, { メール: m.mail, パスワード: m.password });
}

async function マイページを開く(front: FrontRecommend, page: Page): Promise<void> {
  expect(await front.マイページを開く(), "マイページの応答").toBeLessThan(400);
  expect(new URL(page.url()).pathname, "マイページに入れている（ログイン画面へ戻されていない）").toMatch(/\/mypage\/?$/);
}

// ---- マイページ ----
caseTest("IT-F03-05-001", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page, "マイページ");
  let rows: 表示された商品[] = [];
  await step(1, () => 会員でログインする(page, "M"));
  await step(2, () => マイページを開く(front, page));
  await step(3, async () => { rows = await 枠まで進んで読む(front); });
  await expected(async () => {
    expect.soft(ids(rows), "マイページのおすすめ商品（直近の「処理中」以外の注文で販売価格が最も高いBASE-MYP-HIGH-001を基準とした商品BASE-MYP-LOW-001）").toContain(idOf("BASE-MYP-LOW-001"));
    expect.soft(ids(rows), "「処理中」の最新注文の商品REC-PROCESS-001は出ない").not.toContain(idOf("REC-PROCESS-001"));
  });
}));
caseTest("IT-F03-05-005", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page, "マイページ");
  let rows: 表示された商品[] = [];
  await step(1, () => 会員でログインする(page, "M"));
  await step(2, () => マイページを開く(front, page));
  await step(3, async () => { rows = await 枠まで進んで読む(front); });
  await expected(async () => {
    expect.soft(rows.length, "基準となる商品IDを取得できないので、おすすめ商品は表示されない（商品の数）").toBe(0);
  });
}));
caseTest("IT-F03-05-025", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page, "マイページ");
  let rows: 表示された商品[] = [];
  await step(1, () => 会員でログインする(page, "M"));
  await step(2, () => マイページを開く(front, page));
  await step(3, async () => { rows = await 枠まで進んで読む(front); });
  await expected(async () => {
    expect.soft(ids(rows), "直近の注文の唯一の明細F0305-025-BASEを基準とした同時購入商品F0305-025-REC").toEqual([idOf("F0305-025-REC")]);
  });
}));
caseTest("IT-F03-05-026", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page, "マイページ");
  let rows: 表示された商品[] = [];
  await step(1, () => 会員でログインする(page, "M"));
  await step(2, () => マイページを開く(front, page));
  await step(3, async () => { rows = await 枠まで進んで読む(front); });
  await expected(async () => {
    expect.soft(ids(rows), "直近の注文のF0305-026-NEWLOWを基準とした同時購入商品F0305-026-RECNEWが出る").toContain(idOf("F0305-026-RECNEW"));
    expect.soft(ids(rows), "前の注文のF0305-026-OLDHIGHを基準としたF0305-026-RECOLDは出ない").not.toContain(idOf("F0305-026-RECOLD"));
  });
}));

// ---- 商品詳細 ----
caseTest("IT-F03-05-003", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "BASE-DETAIL-003"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await expected(async () => {
    expect.soft(ids(rows), "表示中の商品BASE-DETAIL-003を基準としたREC-DETAIL-003").toEqual([idOf("REC-DETAIL-003")]);
  });
}));
caseTest("IT-F03-05-006", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "BASE-CORR-006"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await step(3, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    expect.soft(ids(rows), "過去30日以内の「処理中」以外の注文で同時購入された数量の多い順（REC-QTY-5-006、REC-QTY-3-006）").toEqual([idOf("REC-QTY-5-006"), idOf("REC-QTY-3-006")]);
    expect.soft(ids(rows), "期間外のREC-OLD-006は出ない").not.toContain(idOf("REC-OLD-006"));
    expect.soft(ids(rows), "「処理中」の注文のREC-PROCESS-006は出ない").not.toContain(idOf("REC-PROCESS-006"));
  });
}));
caseTest("IT-F03-05-007", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "BASE-SAME-007"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await step(3, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    expect.soft(ids(rows), "異なるカードの商品OTHER-CARD-007だけが出る").toEqual([idOf("OTHER-CARD-007")]);
    expect.soft(ids(rows), "基準商品BASE-SAME-007は出ない").not.toContain(idOf("BASE-SAME-007"));
    expect.soft(ids(rows), "同一カードの商品SAME-CARD-ALT-007は出ない").not.toContain(idOf("SAME-CARD-ALT-007"));
  });
}));
caseTest("IT-F03-05-008", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "BASE-FILTER-008"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await step(3, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    expect.soft(ids(rows), "本店で公開中・日本語商品・在庫ありのFILTER-OK-008だけが出る").toEqual([idOf("FILTER-OK-008")]);
    expect.soft(ids(rows), "非公開のFILTER-PRIVATE-008は出ない").not.toContain(idOf("FILTER-PRIVATE-008"));
    expect.soft(ids(rows), "英語商品のFILTER-EN-008は出ない").not.toContain(idOf("FILTER-EN-008"));
    expect.soft(ids(rows), "在庫なしのFILTER-NOSTOCK-008は出ない").not.toContain(idOf("FILTER-NOSTOCK-008"));
  });
}));
caseTest("IT-F03-05-011", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "BASE-LIMIT-011"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await step(3, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    expect.soft(ids(rows), "同時購入数量の合計が多い順にLIMIT-01-011からLIMIT-10-011までの10件").toEqual(十件("011"));
    expect.soft(ids(rows), "11件目のLIMIT-11-011は出ない").not.toContain(idOf("LIMIT-11-011"));
  });
}));
caseTest("IT-F03-05-028", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "F0305-028-BASE"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await step(3, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    expect.soft(ids(rows), "同時購入数量の合計が多い順（F0305-028-Aが4個、F0305-028-Bが3個）").toEqual([idOf("F0305-028-A"), idOf("F0305-028-B")]);
  });
}));
caseTest("IT-F03-05-029", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "F0305-029-BASE"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await step(3, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    const foil = rows.find((r) => r.商品ID === idOf("F0305-029-FOIL"));
    const plain = rows.find((r) => r.商品ID === idOf("F0305-029-PLAIN"));
    expect.soft(foil, "F0305-029-FOILが出ている").toBeDefined();
    expect.soft(plain, "F0305-029-PLAINが出ている").toBeDefined();
    expect.soft(foil?.Foilの装飾, "F0305-029-FOILの商品画像にフォイル用の装飾が付く").toBe(true);
    expect.soft(plain?.Foilの装飾, "F0305-029-PLAINの商品画像にフォイル用の装飾が付かない").toBe(false);
  });
}));
caseTest("IT-F03-05-031", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "F0305-CB031-BASE"));
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await step(3, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    expect.soft(ids(rows), "未ログインでは購入済みの除外が行われず、会員Pが購入したことのあるF0305-CB031-RECAが出る").toContain(idOf("F0305-CB031-RECA"));
    expect.soft(ids(rows), "処理中の注文だけに含まれるF0305-CB031-RECPは出ない").not.toContain(idOf("F0305-CB031-RECP"));
  });
}));

caseTest("IT-F03-05-010", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let ログイン中: 表示された商品[] = [];
  let ログアウト後: 表示された商品[] = [];
  await step(1, () => 会員でログインする(page, "M"));
  await step(2, async () => {
    await 商品詳細を開く(front, "BASE-PURCHASED-010");
    await front.枠までスクロールする();
    await front.描画を待つ();
  });
  await step(3, async () => { ログイン中 = await front.表示された商品(); });
  await step(4, async () => {
    await page.goto(`${BASE_URL}/ja/logout`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
  });
  await step(5, async () => {
    await 商品詳細を開く(front, "BASE-PURCHASED-010");
    ログアウト後 = await 枠を読む(front);
  });
  await expected(async () => {
    expect.soft(ids(ログイン中), "ログイン中は購入済みのPURCHASED-REC-010が出ず、NEW-REC-010だけが出る").toEqual([idOf("NEW-REC-010")]);
    expect.soft([...ids(ログアウト後)].sort(), "ログアウト後はPURCHASED-REC-010とNEW-REC-010が出る").toEqual([idOf("PURCHASED-REC-010"), idOf("NEW-REC-010")].sort());
  });
}));

caseTest("IT-F03-05-014", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let rows: 表示された商品[] = [];
  await step(1, () => 商品詳細を開く(front, "BASE-EN-014"));
  await step(2, async () => {
    await front.言語を切り替える();
    expect(await front.表示言語(), "言語切替のあとの表示言語").toBe("en");
  });
  await step(3, async () => { rows = await 枠を読む(front); });
  await expected(async () => {
    const en = rows.find((r) => r.商品ID === idOf("EN-OK-014"));
    expect.soft(en, "英語商品のEN-OK-014が出る").toBeDefined();
    expect.soft(en?.名前, "EN-OK-014が英語名で表示される").toBe("English Recommendation");
    expect.soft(ids(rows), "日本語商品のJP-ONLY-014は出ない").not.toContain(idOf("JP-ONLY-014"));
  });
}));

caseTest("IT-F03-05-015", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  const 枠が画面内か = (): Promise<boolean> => front.枠.first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  });
  let 外にいる = true;
  let 外の間の商品数 = -1;
  let rows: 表示された商品[] = [];
  await step(1, async () => {
    await 商品詳細を開く(front, "BASE-DETAIL-015");
    await page.evaluate(() => window.scrollTo(0, 0));
    外にいる = !(await 枠が画面内か());
  });
  await step(2, async () => {
    外の間の商品数 = (await front.枠.count()) ? await front.商品カード.count() : 0;
  });
  await step(3, async () => {
    await front.枠までスクロールする();
    await front.描画を待つ();
    rows = await front.表示された商品();
  });
  await expected(async () => {
    expect.soft(外にいる, "手順1でおすすめ商品枠が画面外にある").toBe(true);
    expect.soft(外の間の商品数, "おすすめ商品枠が画面外にある間は商品が描画されない（商品カードの数）").toBe(0);
    expect.soft(ids(rows), "画面内に入った後にREC-DETAIL-015が枠内へ描画される").toEqual([idOf("REC-DETAIL-015")]);
  });
}));

caseTest("IT-F03-05-016", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let 最初: 表示された商品[] = [];
  let 最後: 表示された商品[] = [];
  await step(1, async () => {
    await 商品詳細を開く(front, "BASE-ASYNC-016");
    最初 = await 枠を読む(front);
    expect(ids(最初), "最初にASYNC-A-016が表示される").toContain(idOf("ASYNC-A-016"));
  });
  await step(2, async () => {
    同時購入の実績を置き換える("016", "ASYNC-A-016", "ASYNC-B-016");
  });
  await step(3, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => front.枠.first().evaluate((el) => el.getBoundingClientRect().top >= window.innerHeight), { message: "おすすめ商品枠が画面外になる" }).toBe(true);
  });
  await step(4, async () => {
    await front.枠までスクロールする();
    最後 = await front.表示された商品();
  });
  await expected(async () => {
    expect.soft(ids(最後), "再度画面内に入れてもASYNC-A-016が表示されたまま").toContain(idOf("ASYNC-A-016"));
    expect.soft(ids(最後), "ASYNC-B-016は表示されない").not.toContain(idOf("ASYNC-B-016"));
  });
}));

caseTest("IT-F03-05-018", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page);
  let 並び: string[] = [];
  let 最初の先頭 = "";
  let 前送り後の先頭 = "";
  let 後送り後の先頭 = "";
  await step(1, async () => {
    await 商品詳細を開く(front, "BASE-LIMIT-018");
    await front.枠までスクロールする();
    await front.描画を待つ();
    並び = ids(await front.表示された商品());
  });
  await step(2, async () => { 最初の先頭 = await front.先頭に見える商品ID(); });
  await step(3, async () => {
    expect(await front.前送りを押す(), "前送りボタンが押せる").toBe(true);
    前送り後の先頭 = await front.先頭に見える商品ID();
  });
  await step(4, async () => {
    expect(await front.後送りを押す(), "後送りボタンが押せる").toBe(true);
    後送り後の先頭 = await front.先頭に見える商品ID();
  });
  await expected(async () => {
    expect.soft(前送り後の先頭, "前送り後に後方の商品が表示される（最初の先頭より後ろの商品）").not.toBe(最初の先頭);
    expect.soft(並び.indexOf(前送り後の先頭), "前送り後の先頭は並びの後方にある").toBeGreaterThan(並び.indexOf(最初の先頭));
    expect.soft(後送り後の先頭, "後送り後に手順2で記録した商品が再び表示される").toBe(最初の先頭);
  });
}));

// ---- 買い物かご ----
caseTest("IT-F03-05-004", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page, "買い物かご");
  let rows: 表示された商品[] = [];
  // 事前準備: 未ログインの新しいブラウザのカートに、各1個を入れる
  await front.カートに1個入れる(idOf("CART-HIGH-004"), "カートに CART-HIGH-004 を入れる");
  await front.カートに1個入れる(idOf("CART-LOW-004"), "カートに CART-LOW-004 を入れる");
  await step(1, async () => { expect(await front.買い物かごを開く(), "買い物かごの応答").toBeLessThan(400); });
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await expected(async () => {
    expect.soft(ids(rows), "カート内で販売価格が最も高いCART-HIGH-004を基準としたREC-CART-HIGH-004が出る").toContain(idOf("REC-CART-HIGH-004"));
    expect.soft(ids(rows), "CART-LOW-004を基準としたREC-CART-LOW-004は出ない").not.toContain(idOf("REC-CART-LOW-004"));
  });
}));
caseTest("IT-F03-05-027", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page, "買い物かご");
  let rows: 表示された商品[] = [];
  // 事前準備: 未ログインの新しいブラウザのカートに、各1個を入れる
  await front.カートに1個入れる(idOf("F0305-027-CART"), "カートに F0305-027-CART を入れる");
  await step(1, async () => { expect(await front.買い物かごを開く(), "買い物かごの応答").toBeLessThan(400); });
  await step(2, async () => { rows = await 枠まで進んで読む(front); });
  await expected(async () => {
    expect.soft(ids(rows), "カート内の唯一の商品F0305-027-CARTを基準とした同時購入商品").toEqual([idOf("F0305-027-REC")]);
  });
}));
caseTest("IT-F03-05-033", (ctx) => 案(ctx, async ({ page, step, expected }) => {
  const front = new FrontRecommend(page, "買い物かご");
  let rows: 表示された商品[] = [];
  await step(1, async () => { await front.カートに1個入れる(idOf("F0305-CB033-BASE"), "カートに F0305-CB033-BASE を入れる"); });
  await step(2, async () => { expect(await front.買い物かごを開く(), "買い物かごの応答").toBeLessThan(400); });
  await step(3, async () => {
    await front.枠までスクロールする();
    await front.描画を待つ();
  });
  await step(4, async () => { rows = await front.前送りで最後まで見て読む(); });
  await expected(async () => {
    expect.soft(ids(rows), "未ログインでは購入済みの除外が行われず、会員Pが購入したことのあるF0305-CB033-RECAが出る").toContain(idOf("F0305-CB033-RECA"));
  });
}));
