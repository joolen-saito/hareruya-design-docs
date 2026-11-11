/**
 * F02-01 本店のグローバルナビ（PC版）の続き。正本: cases/F02-01_test_cases.tsv（最初の45件は f02-01.spec.ts）
 *
 * 2026-11-11 に足した12件: 007・024・025・027・028・039・040・041・042・060・072・073。
 * 実装しないケース（013・046・047・048）は PM への報告に理由を書いた（外部の検索索引・検索履歴の外部サービスが要る）。
 */
import { Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { MainNavPage } from "../../pages/front/f02_01_nav";
import { LoginPage } from "../../pages/front/f06_03_login";
import { カートの商品名, 会員, 連携バナー, 連携セット, 連携商品, 試験カテゴリ } from "../../seeds/f02-01-k";
import "../../seeds/f02-01"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備の「会員でログイン済み」。ケースのブラウザで会員ログイン画面からログインする */
async function ログインしておく(page: Page, 番号: string): Promise<void> {
  const m = 会員[番号]();
  const login = new LoginPage(page);
  await login.ログイン画面を開く("本店");
  await login.ログインする(m.メール, m.パスワード);
  if (await login.ログイン画面である()) throw new Error(`会員 ${m.メール} でログインできない: ${await login.認証エラー()}`);
}

// ---------------------------------------------------------------------------
// 007 商品一覧からの日英切替
// ---------------------------------------------------------------------------

caseTest("IT-F02-01-007", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  note("手順1の「日本語版商品一覧画面で「検索商品」を検索する」は、日本語版商品一覧（/ja/products/search）の商品検索テキストボックスに入れて検索ボタンを押した。商品は画面で作ったが、外部の検索索引（ユニサーチ）へは反映していない（ケースは検索結果の中身を確かめない）");
  await step(1, async () => {
    await n.開く("/ja/products/search");
    await n.商品検索テキストボックス().fill("検索商品");
    await Promise.all([page.waitForURL((u) => u.searchParams.has("product") || /product=/.test(u.search), { waitUntil: "domcontentloaded", timeout: 30_000 }), n.検索ボタン().click()]);
    await page.waitForLoadState("load");
  });
  await step(2, async () => { await n.押して遷移する(n.日英切替()); });
  await expected(async () => {
    expect.soft(n.path(), "移った先（英語版ECTOP画面）のアドレス").toMatch(/^\/en\/?$/);
  });
});

// ---------------------------------------------------------------------------
// 024・025・027・028・072・073 ヘッダのカート
// ---------------------------------------------------------------------------

const 追加順の注記 = "追加日時（10:00・11:00）は、カートの明細に追加日時の項目がアプリに無いため設定できず、カートへ入れた順（A→B）で代えた（ヘッダのカートの並びは明細の番号順）";

caseTest("IT-F02-01-024", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const A = カートの商品名("カート商品A-024"), B = カートの商品名("カート商品B-024");
  note(追加順の注記);
  await ログインしておく(page, "024");
  let 中 = { 一覧: false, A: false, B: false };
  let 外 = true;
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { await n.マウスオーバーする(n.カート()); });
  await step(3, async () => {
    中 = { 一覧: await n.見えている(n.カートの一覧()), A: await n.見えている(n.カートの商品の行(A)), B: await n.見えている(n.カートの商品の行(B)) };
    await n.マウスを外す();
    外 = await n.見えている(n.カートの一覧());
  });
  await expected(async () => {
    expect.soft(中.一覧, "マウスオーバー中のカートの商品一覧（表示される）").toBe(true);
    expect.soft(中.A, `「${A}」の概要（一覧に表示される）`).toBe(true);
    expect.soft(中.B, `「${B}」の概要（一覧に表示される）`).toBe(true);
    expect.soft(外, "マウスポインタを外したあとのカートの商品一覧（非表示）").toBe(false);
  });
});

caseTest("IT-F02-01-025", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const A = カートの商品名("カート商品A-025"), B = カートの商品名("カート商品B-025");
  note(追加順の注記);
  await ログインしておく(page, "025");
  let 並び: string[] = [];
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.マウスオーバーする(n.カート());
    await n.表示されている(n.カートの商品の行(B), `カートの「${B}」`);
    並び = (await n.カートの商品名()).filter((x) => x === A || x === B);
  });
  await expected(async () => {
    expect.soft(並び, "カートの商品の並び（先に追加したカート商品A-025、次にカート商品B-025の順）").toEqual([A, B]);
  });
});

caseTest("IT-F02-01-027", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  note("送料無料条件（金額）は共有の設定なので書き換えていない。シードがいまの値（10,000円）を確かめている");
  await ログインしておく(page, "027");
  let 文 = "";
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.マウスオーバーする(n.カート());
    await n.表示されている(n.送料無料までの金額().first(), "カートの「送料無料まで」の欄");
    文 = await n.テキスト(n.送料無料までの金額().first());
  });
  await expected(async () => {
    expect.soft(文, "送料無料までの金額の表示（合計3,500円との差額の6,500円）").toContain("6,500");
  });
});

caseTest("IT-F02-01-028", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  note("送料無料条件（金額）は共有の設定なので書き換えていない。シードがいまの値（10,000円）を確かめている");
  await ログインしておく(page, "028");
  let 一覧が出た = false;
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.マウスオーバーする(n.カート());
    await n.表示されている(n.カートの合計点数(), "カートの合計の点数");
    一覧が出た = await n.見えている(n.カートの一覧());
  });
  await expected(async () => {
    expect.soft(一覧が出た, "カートの商品一覧が表示されている（送料無料までの欄を判定できる状態）").toBe(true);
    await expect.soft(n.送料無料までの金額(), "送料無料までの金額の欄（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-01-072", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const 名 = カートの商品名("カート商品A-072");
  note("カード商品は、カードを作り、グッズ商品CSVで取り込んでカード指定する作り方（カード商品CSV登録は使っていない）。Foilなしのカード（Foilは「なし」）");
  await ログインしておく(page, "072");
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { await n.マウスオーバーする(n.カート()); await n.表示されている(n.カートの商品の行(名), `カートの「${名}」`); });
  await step(3, async () => { await n.表示されている(n.カートの商品の行(名).locator(".p-hareruya-header__cart-item-name-text"), `「${名}」の商品名`); });
  await expected(async () => {
    await expect.soft(n.カートの商品の行(名).locator(".p-hareruya-header__cart-item-name-text"), "商品名（【Foil】が付かない）").toHaveText(名);
  });
});

caseTest("IT-F02-01-073", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const カード = カートの商品名("カード商品-073"), グッズ = カートの商品名("グッズ商品-073");
  note("カード商品は、カードを作り（Foil「通常」）、グッズ商品CSV（言語は英語）で取り込んでカード指定する作り方（カード商品CSV登録は使っていない）");
  await ログインしておく(page, "073");
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { await n.マウスオーバーする(n.カート()); await n.表示されている(n.カートの商品の行(カード), `カートの「${カード}」`); });
  await step(3, async () => {
    await n.表示されている(n.カートの商品の行(カード), `「${カード}」の表示`);
    await n.表示されている(n.カートの商品の行(グッズ), `「${グッズ}」の表示`);
  });
  await expected(async () => {
    const c = n.カートの商品の行(カード), g = n.カートの商品の行(グッズ);
    await expect.soft(c.locator(".c-hareruya-label--language"), "カード商品の言語").toHaveText("EN");
    await expect.soft(c.locator(".p-hareruya-header__cart-item-condition"), "カード商品の状態").toHaveText("NM");
    await expect.soft(c.locator(".p-hareruya-header__cart-item-name-text"), "カード商品の商品名（【Foil】付き）").toHaveText(`【Foil】${カード}`);
    await expect.soft(g.locator(".c-hareruya-label--language"), "グッズ商品の言語（表示されない）").toHaveCount(0);
    await expect.soft(g.locator(".p-hareruya-header__cart-item-condition"), "グッズ商品の状態（表示されない）").toHaveCount(0);
    await expect.soft(g.locator(".p-hareruya-header__cart-item-name-text"), "グッズ商品の商品名（【Foil】が付かない）").toHaveText(グッズ);
  });
});

// ---------------------------------------------------------------------------
// 039〜042 カテゴリバー（カテゴリ・最新セット・フォーマット・その他）
// ---------------------------------------------------------------------------

const 木の注記 = "カテゴリは、固定の試験用の名称で作ったカテゴリ（正本のカテゴリID・名称はDBシードで画面から指定できないため。名称は「〇〇(E2E試験-F0201)」）で代えた";

caseTest("IT-F02-01-039", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  note(木の注記);
  let 第一階層の列: string[] = [], 子の列: string[] = [];
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.マウスオーバーする(n.カテゴリバーのボタン("カテゴリ").first());
    await expect.poll(() => n.カテゴリの列の項目名("カテゴリ", 1), { timeout: 30_000, message: "カテゴリの木の第1列に項目が並ぶ" }).toContain(試験カテゴリ.第一階層);
    第一階層の列 = await n.カテゴリの列の項目名("カテゴリ", 1);
    await n.マウスオーバーする(n.カテゴリの項目("カテゴリ", 1, 試験カテゴリ.第一階層));
    await expect.poll(() => n.カテゴリの列の項目名("カテゴリ", 2), { timeout: 30_000, message: "第2列に配下のカテゴリが並ぶ" }).toContain(試験カテゴリ.第一階層の子[0]);
    子の列 = await n.カテゴリの列の項目名("カテゴリ", 2);
  });
  await expected(async () => {
    expect.soft(第一階層の列, "第1列（カテゴリの第一階層）に試験カテゴリ第一階層がある").toContain(試験カテゴリ.第一階層);
    for (const 名 of 試験カテゴリ.第一階層の子) expect.soft(子の列, `配下のカテゴリ「${名}」が第2列にある`).toContain(名);
  });
});

caseTest("IT-F02-01-040", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  note(木の注記);
  note("最新セットは、既存のカテゴリ「最新セット」の下に作った試験用の子カテゴリ（最新セットA）とその子で代えた");
  let 最新セットの列: string[] = [], 子の列: string[] = [];
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.マウスオーバーする(n.カテゴリバーのボタン("最新セット").first());
    await expect.poll(() => n.カテゴリの列の項目名("最新セット", 2), { timeout: 30_000, message: "最新セットの木の第2列に最新セットのカテゴリが並ぶ" }).toContain(試験カテゴリ.最新セットA);
    最新セットの列 = await n.カテゴリの列の項目名("最新セット", 2);
    await n.マウスオーバーする(n.カテゴリの項目("最新セット", 2, 試験カテゴリ.最新セットA));
    await expect.poll(() => n.カテゴリの列の項目名("最新セット", 3), { timeout: 30_000, message: "第3列に配下のカテゴリが並ぶ" }).toContain(試験カテゴリ.最新セットAの子[0]);
    子の列 = await n.カテゴリの列の項目名("最新セット", 3);
  });
  await expected(async () => {
    expect.soft(最新セットの列, "最新セットのカテゴリ（最新セットA）が第2列にある").toContain(試験カテゴリ.最新セットA);
    for (const 名 of 試験カテゴリ.最新セットAの子) expect.soft(子の列, `配下のカテゴリ「${名}」が第3列にある`).toContain(名);
  });
});

caseTest("IT-F02-01-041", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const フォーマット = ["スタンダード", "パイオニア", "モダン", "レガシー", "統率者", "その他"];
  note("アプリのカテゴリバーには「フォーマット」というメニューが無く、スタンダード・パイオニア・モダン・レガシー・統率者のボタンが別々にある（正本の手順2「フォーマットへマウスオーバー」ができるかを、「フォーマット」のボタンの有無で確かめた）。フォーマット配下の子カテゴリは作っていない");
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await expect(n.カテゴリバーのボタン("フォーマット"), "カテゴリバーの「フォーマット」のメニュー").toHaveCount(1);
    await n.マウスオーバーする(n.カテゴリバーのボタン("フォーマット").first());
  });
  await expected(async () => {
    for (const 名 of フォーマット) expect.soft(await n.カテゴリの列の項目名("フォーマット", 1), `フォーマットの木に「${名}」がある`).toContain(名);
  });
});

caseTest("IT-F02-01-042", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const 名前 = ["その他カード", "Secret Lairシリーズ一覧", "その他商品", "セット詰め合わせ", "サプライ・グッズ", "BOX/パック/未開封製品"];
  const 空白なし = (t: string) => t.replace(/\s+/g, "");
  note("「その他」配下の6カテゴリは、新しく作らず、既存のナビに出ている名称で確かめた（共有のナビへ正本の名称のカテゴリを足さない）。名称の比べ方は空白を除いたもの（「Secret Lair シリーズ一覧」の空白の有無の違いを問わない）");
  let 列: string[] = [];
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.マウスオーバーする(n.カテゴリバーのボタン("その他").first());
    await expect.poll(async () => (await n.カテゴリの列の項目名("その他", 1)).length, { timeout: 30_000, message: "その他の木の第1列に項目が並ぶ" }).toBeGreaterThan(0);
    列 = await n.カテゴリの列の項目名("その他", 1);
  });
  await expected(async () => {
    for (const 名 of 名前) expect.soft(列.map(空白なし), `その他の木に「${名}」がある`).toContain(空白なし(名));
  });
});

// ---------------------------------------------------------------------------
// 060 カードセットの表示用HTML
// ---------------------------------------------------------------------------

caseTest("IT-F02-01-060", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  note("カードセット・商品の名称には実行の印を付けた（「連携試験セット001」「連携商品001」の後ろに印）。商品は画面で作ったが外部の検索索引へは反映していない（ケースは商品一覧より上の領域だけを確かめる）。カードセットの表示用HTMLは、画面で指定できないため DB で設定した（シードの注記）");
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.カードセット選択メニュー().click();
    await n.カードセットの選択肢の名前(連携セット()).click();
  });
  await step(3, async () => { await n.商品検索テキストボックス().fill(連携商品()); });
  await step(4, async () => {
    await Promise.all([page.waitForURL((u) => /\/products\/search/.test(u.pathname), { waitUntil: "domcontentloaded", timeout: 30_000 }), n.検索ボタン().click()]);
    await page.waitForLoadState("load");
  });
  await step(5, async () => { await page.waitForTimeout(1000); });
  await expected(async () => {
    const 欄 = page.locator(".p-hareruya-product-list__free-content");
    await expect.soft(欄.filter({ hasText: 連携バナー }), "商品一覧より上の領域（説明の欄）にカードセットの表示用HTMLがある").toHaveCount(1);
    await expect.soft(page.getByText(連携バナー).first(), `表示用HTML「${連携バナー}」が画面に表示されている`).toBeVisible();
  });
});
