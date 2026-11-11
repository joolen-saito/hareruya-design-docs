/**
 * F02-04 支店のスマホ版ナビゲーション。正本: cases/F02-04_test_cases.tsv
 * - 007・031: 検索結果は外部の検索サービス（ユニサーチ）の索引から出る。シードが印つきの商品を作り、商品管理「ユニサーチフィード作成」で送って
 *   支店Aの商品一覧に出るまで待つ（seeds/f02-04.ts。依頼者 2026-11-11「ユニサーチのフィード連携はしてもいい」）。
 * スマートフォン表示は、画面 390×844・スマホの端末の印（isMobile・hasTouch・iPhone の UserAgent）のブラウザで開く（seeds/f02-04.ts の スマホ）。
 * 専用ブラウザ（サイトデータ消去・ログアウト・カート0個）は、ケースの新しいブラウザで代える。
 */
import { Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BranchSpPage, 数字 } from "../../pages/front/f02_04_branch_sp";
import { アドレスの本体 } from "../../pages/front/f02_02_sp_nav";
import { LoginPage } from "../../pages/front/f06_03_login";
import { FrontProductList } from "../../pages/front/f03_01_product_list";
import { FIXTURES, カートのブラウザたち, カテゴリ名, カードセット名, スマホ, 会員, 会員036, 支店A, 支店B, 支店CDA, 番号, 検索の商品名, 連携の値, 索引の商品 } from "../../seeds/f02-04";

test.use({ ...スマホ });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

const nav = (ctx: CaseCtx) => new BranchSpPage(ctx.page);
const 支店トップ = `/ja/${支店A.支店URL}`;

/** 試験会員でログインする（本店のログイン画面から。ログインは本店・支店で共通のセッション） */
async function ログインする(page: Page, メール: string, パスワード: string): Promise<void> {
  const login = new LoginPage(page);
  await login.ログイン画面を開く("本店");
  await login.ログインする(メール, パスワード);
}

/** カートのシードが作ったブラウザの状態（クッキー）を、このケースのブラウザへ移す（事前準備の「商品を投入したカート」の代え） */
async function カートのブラウザにする(page: Page, seedId: string): Promise<void> {
  const cart = カートのブラウザたち.get(seedId);
  if (!cart) throw new Error(`${seedId} のブラウザの状態が無い`);
  await page.context().addCookies(cart.cookies);
  note(`「専用ブラウザへ商品を投入したカート」は、シードが支店Aの商品画面から数量を入れてカートへ入れたブラウザのクッキーを、このケースのブラウザへ移して代えた`);
}

const 上部のカートの注記 = () => note("画面上部の帯のカートの商品数は、アプリの作りでは画面幅が狭いと表示されない欄（ヘッダ右の並び）にある。画面の文字（札の数字）を読んで比べた");

// ---- ナビゲーションとフッタの表示（001） ----
caseTest("IT-F02-04-001", async (ctx) => {
  const n = nav(ctx);
  const r: Record<string, string> = {};
  const bytes: Record<string, Buffer | null> = {};
  const 読む = async (k: string) => {
    r[`${k}上`] = await n.文(n.上部の店名()); r[`${k}下`] = await n.文(n.下部の店名());
    bytes[k] = await n.ご当地晴れる屋くんのバイト列();
    r[`${k}郵便`] = await n.文(n.郵便番号()); r[`${k}住所`] = await n.文(n.住所());
    r[`${k}電話`] = await n.文(n.電話番号()); r[`${k}営業`] = await n.文(n.営業時間());
    r[`${k}著作権`] = await n.文(n.著作権表示());
  };
  note("ご当地晴れる屋くんの画像は、正本がファイル名（branch-a-hareruya.png・branch-b-hareruya.png）だけを定めるため、色の違う小さな画像を試験用に作って使った（正本の外の補い）");
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); await 読む("A"); });
  await ctx.step(2, async () => { await n.支店トップを開く(支店B.支店URL); await 読む("B"); });
  await ctx.expected(async () => {
    for (const [k, s, f] of [["A", 支店A, "branch-a-hareruya.png"], ["B", 支店B, "branch-b-hareruya.png"]] as const) {
      expect.soft(r[`${k}上`], `支店${k}の画面上部の店舗名`).toBe(s.店名);
      expect.soft(r[`${k}下`], `支店${k}のフッタの店舗名`).toBe(s.店名);
      expect.soft(bytes[k] !== null && bytes[k]!.equals(fs.readFileSync(path.join(FIXTURES, f))), `支店${k}に表示されたご当地晴れる屋くんの画像が、登録した画像（${f}）と同じか`).toBe(true);
      expect.soft(r[`${k}郵便`], `支店${k}の郵便番号`).toContain(s.郵便番号);
      expect.soft(r[`${k}住所`], `支店${k}の住所`).toContain(`${s.都道府県}${s.住所1}${s.住所2}`);
      expect.soft(数字(r[`${k}電話`]), `支店${k}の電話番号（数字）`).toContain(数字(s.電話番号));
      expect.soft(r[`${k}営業`], `支店${k}の営業時間`).toContain(s.営業時間);
      expect.soft(r[`${k}著作権`], `支店${k}の店舗名を用いた著作権表示`).toContain(s.店名);
    }
  });
});

// ---- 店舗名・総合TOP・通販サイトのリンク（002・003・009） ----
caseTest("IT-F02-04-002", async (ctx) => {
  const n = nav(ctx);
  const 先: string[] = [];
  note("「支店ECTOP画面以外の画面」は、支店のログイン画面で代えた");
  await ctx.step(1, async () => { await n.支店の画面を開く(支店A.支店URL, "ログイン"); });
  await ctx.step(2, async () => { await n.押して移る(n.上部の店名(), "画面上部の店舗名"); 先.push(n.パス()); });
  await ctx.step(3, async () => { await n.支店の画面を開く(支店A.支店URL, "ログイン"); });
  await ctx.step(4, async () => { await n.最下部までスクロールする(); await n.押して移る(n.下部の店名(), "フッタの店舗名"); 先.push(n.パス()); });
  await ctx.expected(async () => {
    expect.soft(先[0], "画面上部の店舗名を押して移った先（支店ECTOP）").toBe(支店トップ);
    expect.soft(先[1], "フッタの店舗名を押して移った先（支店ECTOP）").toBe(支店トップ);
  });
});

caseTest("IT-F02-04-003", async (ctx) => {
  const n = nav(ctx);
  note("「総合TOPアイコン」は、画面下部の固定ナビの先頭の「通販サイト」（本店のTOPへ戻る項目）として押した");
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.押して移る(n.通販サイトの導線(), "総合TOPアイコン（通販サイト）"); });
  await ctx.expected(async () => {
    expect.soft(n.パス(), "移った先（本店ECページ）").toBe("/ja");
  });
});

caseTest("IT-F02-04-009", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.押して移る(n.通販サイトの導線(), "画面下部の通販サイト"); });
  await ctx.expected(async () => {
    expect.soft(n.パス(), "移った先（本店ECTOP）").toBe("/ja");
  });
});

// ---- カードセット選択・詳細検索（004・005・008） ----
caseTest("IT-F02-04-004", async (ctx) => {
  const n = nav(ctx);
  let names: string[] = [];
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.押す(n.カードセット選択メニュー(), "カードセット選択メニュー"); names = await n.選択肢に出ているカードセット(); });
  await ctx.expected(async () => {
    for (const 名前 of [カードセット名("テストセットA"), カードセット名("テストセットB")]) {
      expect.soft(names.includes(名前), `選択肢に「${名前}」がある`).toBe(true);
      await expect.soft(n.カードセットの選択肢の(名前), `「${名前}」が表示されている`).toBeVisible();
    }
  });
});

caseTest("IT-F02-04-005", async (ctx) => {
  const n = nav(ctx);
  const A = カードセット名("テストセットA"), B = カードセット名("テストセットB");
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.カードセットを選ぶ(A); });
  await ctx.step(3, async () => { await n.カードセットを選ぶ(B); });
  await ctx.expected(async () => {
    expect.soft((await n.カードセットの選択中の名前().innerText()).trim(), "カードセット選択メニューの選択中の表示（テストセットBだけ）").toBe(B);
    expect.soft(await n.カードセットの選択中の値().inputValue(), "選択中のカードセット（テストセットBのカードセットIDだけ）").toBe(番号.get("〔カードセットID-F0204-B〕"));
  });
});

// ---- カードセットとキーワードの検索（007・031。検索サービスの索引） ----
caseTest("IT-F02-04-007", async (ctx) => {
  const n = nav(ctx);
  const list = new FrontProductList(ctx.page);
  const r = 索引の商品();
  const A = カードセット名("テストセットA");
  let 出た: { 商品ID: string; 商品名: string }[] = [];
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => {
    await n.カードセットを選ぶ(A);
    await n.商品検索テキストボックス().fill("検索対象");
  });
  await ctx.step(3, async () => {
    await n.検索する();
    await list.結果を待つ();
    出た = (await list.カードを読む()).map((c) => ({ 商品ID: c.商品ID, 商品名: c.商品名 }));
    note(`商品一覧に出た商品: ${出た.map((c) => `${c.商品名}（${c.商品ID}）`).join("、") || "なし"}`);
  });
  await ctx.expected(async () => {
    const u = new URL(ctx.page.url());
    expect.soft(u.pathname.replace(/\/+$/, ""), "移った先（支店Aの商品一覧）").toBe(`/ja/${支店A.支店URL}/products/search`);
    expect.soft(u.searchParams.get("cardset"), "移った先の検索条件のカードセット（テストセットAのカードセットID）").toBe(r.カードセットA);
    expect.soft(u.searchParams.get("product"), "移った先の検索条件のキーワード").toBe("検索対象");
    const ids = 出た.map((c) => c.商品ID);
    expect.soft(ids.includes(r.商品A), `「${検索の商品名.A}」（商品ID ${r.商品A}）が表示される`).toBe(true);
    expect.soft(ids.includes(r.商品B), `カードセットの違う「${検索の商品名.B}」（商品ID ${r.商品B}）が表示されない`).toBe(false);
    expect.soft(ids.includes(r.商品C), `キーワードを含まない「${検索の商品名.C}」（商品ID ${r.商品C}）が表示されない`).toBe(false);
  });
});

caseTest("IT-F02-04-031", async (ctx) => {
  const n = nav(ctx);
  const list = new FrontProductList(ctx.page);
  const r = 索引の商品();
  let 位置: { html: number | null; 一覧: number | null; 見える: boolean } = { html: null, 一覧: null, 見える: false };
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.カードセットを選ぶ(連携の値.カードセット名); });
  await ctx.step(3, async () => { await n.商品検索テキストボックス().fill(連携の値.商品名); });
  await ctx.step(4, async () => {
    await n.検索する();
    await list.結果を待つ();
    note(`商品一覧に出た商品: ${(await list.カードを読む()).map((c) => `${c.商品名}（${c.商品ID}）`).join("、") || "なし"}（連携支店商品001 は商品ID ${r.商品031}）`);
  });
  await ctx.step(5, async () => {
    const html = ctx.page.getByText(連携の値.表示用HTML, { exact: false }).first();
    位置 = { html: await list.上端の位置(html), 一覧: await list.上端の位置(list.結果領域), 見える: (await html.count()) > 0 && await html.isVisible() };
    note(`表示用HTML「${連携の値.表示用HTML}」の上端 ${位置.html ?? "（画面に無い）"}・商品一覧の上端 ${位置.一覧 ?? "（無い）"}（ページの上端からの位置）`);
  });
  await ctx.expected(async () => {
    expect.soft(位置.見える, `カードセットの表示用HTML「${連携の値.表示用HTML}」が表示されている`).toBe(true);
    expect.soft(位置.html !== null && 位置.一覧 !== null && 位置.html < 位置.一覧, "表示用HTMLが商品一覧より上にある").toBe(true);
  });
});

caseTest("IT-F02-04-008", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.押す(n.詳細検索アイコン(), "詳細検索アイコン"); await ctx.page.waitForTimeout(1000); });
  await ctx.expected(async () => {
    await expect.soft(n.詳細検索モーダル(), "商品詳細検索のモーダル").toHaveClass(/is-visible/);
  });
});

// ---- カート個数（010・011・012・035） ----
function カート個数(seedId: string, 個数: string, 遮断: boolean) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    await カートのブラウザにする(ctx.page, seedId);
    上部のカートの注記();
    let 遮断数: () => number = () => 0;
    const r: Record<string, string> = {};
    let s = 1;
    if (遮断) await ctx.step(s++, async () => { 遮断数 = await n.カート個数の再取得を遮断する(); });
    await ctx.step(s++, async () => { await n.支店トップを開く(支店A.支店URL); });
    await ctx.step(s++, async () => {
      await ctx.page.waitForTimeout(2000);
      await expect(n.下部のナビのカートの商品数(), "画面下部の固定ナビのカートの商品数").toBeVisible({ timeout: 30_000 });
      r.上 = (await n.上部のカートの商品数().textContent({ timeout: 30_000 }).catch(() => null)) ?? "";
      r.下 = (await n.下部のナビのカートの商品数().innerText()).trim();
      if (遮断) note(`遮断した通信（カート個数の再取得）: ${遮断数()} 回`);
    });
    await ctx.expected(async () => {
      expect.soft(数字(r.上), "画面上部の帯のカートの商品数").toBe(個数);
      expect.soft(数字(r.下), "画面下部の固定ナビのカートの商品数").toBe(個数);
      expect.soft(数字(r.上), "上部と下部の商品数が同じ").toBe(数字(r.下));
    });
  };
}
caseTest("IT-F02-04-010", カート個数("S-F02-04-CART-010", "3", false));
caseTest("IT-F02-04-011", カート個数("S-F02-04-CART-011", "3", true));
caseTest("IT-F02-04-035", カート個数("S-F02-04-CART-035", "1", false));

caseTest("IT-F02-04-012", async (ctx) => {
  const n = nav(ctx);
  await カートのブラウザにする(ctx.page, "S-F02-04-CART-012");
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.押して移る(n.下部のナビのカート(), "画面下部の固定ナビのカート"); });
  await ctx.expected(async () => {
    expect.soft(n.パス(), "移った先（カート画面）").toBe(`${支店トップ}/cart`);
  });
});

// ---- ポイント（013・014・015・036） ----
caseTest("IT-F02-04-013", async (ctx) => {
  const n = nav(ctx);
  let 値 = "";
  await ctx.step(1, async () => { await ログインする(ctx.page, 会員("013").メール(), 会員("013").パスワード); });
  await ctx.step(2, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(3, async () => { await expect(n.上部のポイントの数字(), "ポイント欄").toBeVisible({ timeout: 30_000 }); 値 = await n.文(n.上部のポイントの数字()); });
  await ctx.expected(async () => {
    expect.soft(数字(値), "ポイント欄の保有ポイント").toBe("1234");
  });
});

caseTest("IT-F02-04-014", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await ログインする(ctx.page, 会員("014").メール(), 会員("014").パスワード); });
  await ctx.step(2, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(3, async () => { await n.押して移る(n.上部のポイントの導線(), "ポイント欄"); });
  await ctx.expected(async () => {
    expect.soft(n.パス(), "移った先（マイページ）").toBe(`${支店トップ}/mypage`);
  });
});

caseTest("IT-F02-04-015", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await expect(n.上部の店名(), "画面上部").toBeVisible({ timeout: 30_000 }); });
  await ctx.expected(async () => {
    await expect.soft(n.見えているポイント表示(), "ポイント欄（表示されない）").toHaveCount(0);
    await expect.soft(n.上部のポイント欄(), "ポイント欄（画面に存在しない）").toHaveCount(0);
  });
});

caseTest("IT-F02-04-036", async (ctx) => {
  const n = nav(ctx);
  let 値 = "";
  await ctx.step(1, async () => { await ログインする(ctx.page, 会員036.メール(), 会員036.パスワード); });
  await ctx.step(2, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(3, async () => { await expect(n.上部のポイント欄(), "ポイント欄").toBeVisible({ timeout: 30_000 }); 値 = await n.文(n.上部のポイントの数字()); });
  await ctx.expected(async () => {
    await expect.soft(n.上部のポイント欄(), "ポイント欄（非表示にならない）").toBeVisible();
    expect.soft(値, "ポイント欄の保有ポイント（0）").toBe("0");
  });
});

// ---- 画面下部の固定ナビ（016〜020） ----
caseTest("IT-F02-04-016", async (ctx) => {
  const n = nav(ctx);
  let 項目: string[] = [];
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await expect(n.下部のナビ(), "画面下部の固定ナビ").toBeVisible({ timeout: 30_000 }); 項目 = await n.下部のナビの全項目名(); note(`画面下部の固定ナビの項目: ${項目.join("・")}`); });
  await ctx.expected(async () => {
    expect.soft(項目.filter((t) => t === "ログイン").length, "会員ログインへの導線の数").toBe(1);
    expect.soft(項目.includes("マイページ"), "マイページの導線（表示されない）").toBe(false);
    expect.soft(項目.includes("ログアウト"), "ログアウトの導線（表示されない）").toBe(false);
  });
});

caseTest("IT-F02-04-017", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.押して移る(n.下部のナビの項目("ログイン"), "画面下部の固定ナビのログイン"); });
  await ctx.expected(async () => {
    expect.soft(n.パス(), "移った先（ログイン画面）").toBe(`${支店トップ}/mypage/login`);
  });
});

caseTest("IT-F02-04-018", async (ctx) => {
  const n = nav(ctx);
  let 項目: string[] = [];
  await ctx.step(1, async () => { await ログインする(ctx.page, 会員("018").メール(), 会員("018").パスワード); });
  await ctx.step(2, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(3, async () => { await expect(n.下部のナビ(), "画面下部の固定ナビ").toBeVisible({ timeout: 30_000 }); 項目 = await n.下部のナビの全項目名(); note(`画面下部の固定ナビの項目: ${項目.join("・")}`); });
  await ctx.expected(async () => {
    expect.soft(項目.filter((t) => t === "マイページ").length, "マイページの導線の数").toBe(1);
    expect.soft(項目.filter((t) => t === "ログアウト").length, "ログアウトの導線の数").toBe(1);
    expect.soft(項目.includes("ログイン"), "会員ログインへの導線（表示されない）").toBe(false);
  });
});

caseTest("IT-F02-04-019", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await ログインする(ctx.page, 会員("019").メール(), 会員("019").パスワード); });
  await ctx.step(2, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(3, async () => { await n.押して移る(n.下部のナビの項目("マイページ"), "画面下部の固定ナビのマイページ"); });
  await ctx.expected(async () => {
    expect.soft(n.パス(), "移った先（マイページ）").toBe(`${支店トップ}/mypage`);
  });
});

caseTest("IT-F02-04-020", async (ctx) => {
  const n = nav(ctx);
  let 項目: string[] = [];
  note("「支店ECTOP画面以外の画面」は、支店のマイページで代えた");
  await ctx.step(1, async () => { await ログインする(ctx.page, 会員("020").メール(), 会員("020").パスワード); });
  await ctx.step(2, async () => { await n.支店の画面を開く(支店A.支店URL, "マイページ"); });
  await ctx.step(3, async () => { await n.押して移る(n.下部のナビの項目("ログアウト"), "画面下部の固定ナビのログアウト", 30_000); await ctx.page.waitForLoadState("load"); 項目 = await n.下部のナビの全項目名(); });
  await ctx.expected(async () => {
    expect.soft(n.パス(), "ログアウト後に移った先（支店ECTOP）").toBe(支店トップ);
    expect.soft(項目.filter((t) => t === "ログイン").length, "会員ログインへの導線の数").toBe(1);
    expect.soft(項目.includes("マイページ") || 項目.includes("ログアウト"), "マイページ・ログアウトの導線（表示されない）").toBe(false);
  });
});

// ---- カテゴリ（021・022） ----
caseTest("IT-F02-04-021", async (ctx) => {
  const n = nav(ctx);
  const 親 = カテゴリ名("テストカテゴリA");
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.カテゴリモーダルを開く(); await n.カテゴリモーダルに出るまで待つ(親, 30_000); });
  await ctx.expected(async () => {
    expect.soft(await n.カテゴリモーダルが開いているか(), "カテゴリモーダルが開いている").toBe(true);
    expect.soft((await n.カテゴリモーダル().innerText()).includes(親), `カテゴリツリーに第一階層の「${親}」がある`).toBe(true);
  });
});

caseTest("IT-F02-04-022", async (ctx) => {
  const n = nav(ctx);
  let 開いていた = false;
  await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await ctx.step(2, async () => { await n.カテゴリモーダルを開く(); await ctx.page.waitForTimeout(800); 開いていた = await n.カテゴリモーダルが開いているか(); });
  await ctx.step(3, async () => { await n.押す(n.カテゴリモーダルの閉じる(), "カテゴリモーダルの閉じるボタン"); await ctx.page.waitForTimeout(800); });
  await ctx.expected(async () => {
    expect.soft(開いていた, "閉じる前はカテゴリモーダルが開いている").toBe(true);
    expect.soft(await n.カテゴリモーダルが開いているか(), "カテゴリモーダルが開いている（閉じている）").toBe(false);
  });
});

// ---- フッタの開閉欄（023・025・037） ----
const サイトマップの項目 = ["当サイトについて", "プライバシーポリシー", "特定商取引法に基づく表記", "お問い合わせ"];
const お得な情報の項目 = ["晴れる屋X", "晴れる屋Channel"];

function 開閉(欄: "サイトマップ" | "お得な情報", 項目: string[]) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    const 見え = async () => Promise.all(項目.map((t) => n.支店の欄の中で見えているか(欄, t)));
    let 開 = [] as boolean[], 閉 = [] as boolean[];
    const ボタン名 = `${欄}開閉ボタン`;
    await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
    await ctx.step(2, async () => { await n.最下部までスクロールする(); await n.押す(n.開閉ボタン支店(欄), ボタン名); await ctx.page.waitForTimeout(800); });
    await ctx.step(3, async () => { 開 = await 見え(); });
    await ctx.step(4, async () => { await n.押す(n.開閉ボタン支店(欄), ボタン名); await ctx.page.waitForTimeout(800); 閉 = await 見え(); });
    await ctx.expected(async () => {
      項目.forEach((t, i) => {
        expect.soft(開[i], `1回目の押下のあと「${t}」が表示される（欄の見えている範囲の中）`).toBe(true);
        expect.soft(閉[i], `2回目の押下のあと「${t}」が非表示になる（欄の見えている範囲の外）`).toBe(false);
      });
    });
  };
}
caseTest("IT-F02-04-023", 開閉("サイトマップ", サイトマップの項目));
caseTest("IT-F02-04-025", 開閉("お得な情報", お得な情報の項目));

caseTest("IT-F02-04-037", async (ctx) => {
  const n = nav(ctx);
  let 見え: boolean[] = [];
  await ctx.step(1, async () => { await n.支店トップを開く(支店CDA.支店URL); });
  await ctx.step(2, async () => {
    await n.最下部までスクロールする(); await n.押す(n.開閉ボタン支店("サイトマップ"), "サイトマップ開閉ボタン"); await ctx.page.waitForTimeout(800);
    見え = await Promise.all(サイトマップの項目.map((t) => n.支店の欄の中で見えているか("サイトマップ", t)));
  });
  await ctx.step(3, async () => { await n.押して移る(n.支店フッタの項目("サイトマップ", "お問い合わせ"), "サイトマップのお問い合わせ"); });
  await ctx.expected(async () => {
    expect.soft(見え.every((v) => v), "サイトマップの4つの導線が表示された").toBe(true);
    expect.soft(n.パス(), "移った先（支店サイト内ではなく、本店サイトのお問い合わせ画面）").toBe("/ja/contact");
  });
});

// ---- 外部サイトへのリンク（032・033） ----
function 外部リンク(名前: string, 先: string, 転送を許す?: (url: string) => string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    let 開いた先 = "", リンク先 = "", タブ数 = 0, 元の先 = "";
    await ctx.step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
    await ctx.step(2, async () => { await n.最下部までスクロールする(); await n.押す(n.開閉ボタン支店("お得な情報"), "お得な情報開閉ボタン"); await ctx.page.waitForTimeout(800); });
    await ctx.step(3, async () => {
      const l = n.支店フッタの項目("お得な情報", 名前);
      リンク先 = (await l.getAttribute("href")) ?? "";
      const r = await n.押して新しいタブを開く(l, 名前);
      開いた先 = r.開いた先;
      supplementTab.push(r.タブ);
    });
    await ctx.step(4, async () => {
      const pages = ctx.page.context().pages();
      タブ数 = pages.length;
      元の先 = ctx.page.url();
      note(`開いているタブ: ${pages.map((p) => p.url()).join(" ／ ")}`);
    });
    await ctx.expected(async () => {
      const 正規 = 転送を許す ? 転送を許す(開いた先) : 開いた先;
      expect.soft(タブ数, "開いているタブの数").toBe(2);
      expect.soft(アドレスの本体(リンク先), `リンク先（${名前}）`).toBe(アドレスの本体(先));
      expect.soft(アドレスの本体(正規), `新しく開いたタブのアドレス（${名前}）`).toBe(アドレスの本体(先));
      expect.soft(new URL(元の先).pathname.replace(/\/+$/, ""), "元のタブの画面（テスト支店Aの支店ECTOP）").toBe(支店トップ);
    });
    for (const t of supplementTab) await t.close().catch(() => undefined);
    supplementTab.length = 0;
  };
}
const supplementTab: Page[] = [];
caseTest("IT-F02-04-032", 外部リンク("晴れる屋X", "https://x.com/hareruya_mtg"));
caseTest("IT-F02-04-033", 外部リンク("晴れる屋Channel", "https://www.youtube.com/channel/UC1l7GtlvAmCOXRlxjImbWvw",
  (url) => url.replace("://m.youtube.com/", "://www.youtube.com/")));

