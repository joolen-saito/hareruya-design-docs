/**
 * F02-03 支店のグローバルナビ（PC版）。正本: cases/F02-03_test_cases.tsv
 * 実装していないケース（理由）:
 * - 020・021: 共有の送料無料条件（モール共通の設定）を10000円へ書き換えて戻す作りで、共有の設定は書き換えない。
 * - 050: 共有のカードセットの表示用HTMLの登録と、シード表の「連携試験支店」が要る（共有のマスタへ足す・書き換える）。
 * カードセット（003〜006）・カテゴリ（034〜038）は、共有のマスタへ足さず、環境にある既存のカードセット・カテゴリ・商品で代える（各ケースの注記）。
 */
import { Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { expect, caseTest } from "../../lib/case";
import { SETUP_ADMIN } from "../../config/env";
import { withAdminSession } from "../../lib/session";
import { 登録済みのカードセットの名前 } from "../../pages/admin/f02_03_cart_setup";
import { FrontProductList } from "../../pages/front/f03_01_product_list";
import { LoginPage } from "../../pages/front/f06_03_login";
import { BranchNavPage } from "../../pages/front/f02_03_nav";
import { FIXTURES, カートのブラウザたち, 会員055パスワード, 会員055メール, 会員パスワード, 会員メール, 支店A, 支店B, 支店B056 } from "../../seeds/f02-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 画像の注記 = () => note("ご当地晴れる屋くんの画像は、正本がファイル名（branch-a.png・branch-b.png）だけを定めるため、色の違う小さな画像を試験用に作って使った（正本の外の補い）");

/** 試験会員でログインする（事前準備の「ログイン済みの状態」） */
async function ログインしておく(page: import("@playwright/test").Page, メール: string, パスワード: string): Promise<void> {
  const login = new LoginPage(page);
  await login.ログイン画面を開く("本店");
  await login.ログインする(メール, パスワード);
}

caseTest("IT-F02-03-001", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  const r: Record<string, string> = {};
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { r.A上 = await n.テキスト(n.ヘッダの支店名()); r.A下 = await n.テキスト(n.フッタの支店名()); });
  await step(3, async () => { await n.支店トップを開く(支店B.支店URL); });
  await step(4, async () => { r.B上 = await n.テキスト(n.ヘッダの支店名()); r.B下 = await n.テキスト(n.フッタの支店名()); });
  await expected(async () => {
    expect.soft(r.A上, "支店Aの画面上部の支店名").toBe("試験支店A");
    expect.soft(r.A下, "支店Aの画面下部の支店名").toBe("試験支店A");
    expect.soft(r.B上, "支店Bの画面上部の支店名").toBe("試験支店B");
    expect.soft(r.B下, "支店Bの画面下部の支店名").toBe("試験支店B");
  });
});

caseTest("IT-F02-03-002", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  const bytes: Record<string, Buffer | null> = {};
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); bytes.A = await n.ご当地晴れる屋くんのバイト列(); });
  await step(2, async () => { await n.支店トップを開く(支店B.支店URL); bytes.B = await n.ご当地晴れる屋くんのバイト列(); });
  await expected(async () => {
    const a = fs.readFileSync(path.join(FIXTURES, "branch-a.png")), b = fs.readFileSync(path.join(FIXTURES, "branch-b.png"));
    expect.soft(bytes.A !== null && bytes.A.equals(a), "支店Aに表示された画像が、支店A用の画像（branch-a.png）と同じか").toBe(true);
    expect.soft(bytes.B !== null && bytes.B.equals(b), "支店Bに表示された画像が、支店B用の画像（branch-b.png）と同じか").toBe(true);
  });
  画像の注記();
});

caseTest("IT-F02-03-007", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.詳細検索ボタン().click({ timeout: 30_000 }); await page.waitForTimeout(1000); });
  await expected(async () => {
    await expect.soft(n.詳細検索モーダル(), "詳細検索モーダル").toHaveClass(/is-visible/);
  });
});

caseTest("IT-F02-03-008", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await expect(n.ヘッダの支店名(), "画面上部").toBeVisible(); });
  await expected(async () => {
    await expect.soft(n.ポイントの数字(), "ポイントの表示（表示されない）").toHaveCount(0);
    await expect.soft(n.ポイントの導線(), "ポイントの導線（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-03-009", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  const v: string[] = [];
  await step(2, async () => { for (const t of await n.ポイントの数字().allInnerTexts()) v.push(t.replace(/\s+/g, " ").trim()); });
  await expected(async () => {
    expect.soft(v.length, "ポイント欄の数").toBeGreaterThan(0);
    expect.soft(v.every((t) => t === "1,200"), "ポイント欄の数字（すべて1,200）").toBe(true);
  });
});

caseTest("IT-F02-03-010", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.ポイントの導線()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（マイページ）").toMatch(/\/mypage\/?$/);
  });
});

caseTest("IT-F02-03-011", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.ログインの導線()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（ログイン画面）").toMatch(/\/mypage\/login$/);
  });
});

caseTest("IT-F02-03-012", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.マイページの導線()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（マイページ）").toMatch(/\/mypage\/?$/);
  });
});

caseTest("IT-F02-03-013", async ({ page, browser, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員メール(), 会員パスワード);
  let ログイン済み = 0, 未ログイン = 0;
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); ログイン済み = (await n.ログアウトの導線().first().isVisible()) ? 1 : 0; });
  await step(2, async () => {
    const ctx = await browser.newContext({ baseURL: page.url(), ignoreHTTPSErrors: true });
    try {
      const p2 = await ctx.newPage();
      const n2 = new BranchNavPage(p2);
      await n2.支店トップを開く(支店A.支店URL);
      未ログイン = await n2.ログアウトの導線().count();
    } finally { await ctx.close(); }
  });
  await expected(async () => {
    expect.soft(ログイン済み, "会員ログイン済みの画面のログアウトの導線の数").toBeGreaterThan(0);
    expect.soft(未ログイン, "会員未ログインの画面のログアウトの導線の数").toBe(0);
  });
});

caseTest("IT-F02-03-014", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店のログイン画面を開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.ヘッダのロゴ()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.replace(/\/$/, ""), "移った先の画面（支店ECTOP）").toBe(`/ja/${支店A.支店URL}`);
  });
});

caseTest("IT-F02-03-015", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店のログイン画面を開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.フッタのロゴ()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname.replace(/\/$/, ""), "移った先の画面（支店ECTOP）").toBe(`/ja/${支店A.支店URL}`);
  });
});

caseTest("IT-F02-03-039", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  const r: Record<string, string> = {};
  const 読む = async (k: string) => {
    r[`${k}郵便`] = await n.テキスト(n.店舗情報の郵便番号()); r[`${k}住所`] = await n.テキスト(n.店舗情報の住所());
    r[`${k}電話`] = await n.テキスト(n.店舗情報の電話()); r[`${k}営業`] = await n.テキスト(n.店舗情報の営業時間());
  };
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); await 読む("A"); });
  await step(2, async () => { await n.支店トップを開く(支店B.支店URL); await 読む("B"); });
  await expected(async () => {
    for (const [k, s] of [["A", 支店A], ["B", 支店B]] as const) {
      expect.soft(r[`${k}郵便`], `支店${k}の郵便番号`).toContain(s.郵便番号);
      expect.soft(r[`${k}住所`], `支店${k}の住所`).toContain(`${s.都道府県}${s.住所1}${s.住所2}`);
      expect.soft(r[`${k}電話`], `支店${k}の電話番号`).toContain(s.電話番号);
      expect.soft(r[`${k}営業`], `支店${k}の営業時間`).toContain(s.営業時間);
    }
  });
});

caseTest("IT-F02-03-040", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  let tab: import("@playwright/test").Page | null = null;
  await step(2, async () => { tab = await n.押して新しいタブを開く(n.地図のリンク()); });
  await expected(async () => {
    expect.soft(tab?.url() ?? "", "新しいタブで開いたアドレス").toBe(支店A.地図URL);
  });
});

/** 支店ECTOPのフッタのリンクを押して、移った先の画面のアドレスを確かめる */
function フッタのリンク先(名前: string, 先: RegExp): import("../../lib/case").CaseBody {
  return async ({ page, step, expected }) => {
    const n = new BranchNavPage(page);
    await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
    await step(2, async () => { await n.押して遷移する(n.フッタのリンク(名前)); });
    await expected(async () => {
      expect.soft(new URL(page.url()).pathname, `移った先の画面（${名前}）のアドレス`).toMatch(先);
    });
  };
}
caseTest("IT-F02-03-041", フッタのリンク先("当サイトについて", /\/rules$/));
caseTest("IT-F02-03-042", フッタのリンク先("プライバシーポリシー", /privacy/));
caseTest("IT-F02-03-043", フッタのリンク先("特定商取引法に基づく表記", /transaction_notation$/));
caseTest("IT-F02-03-044", フッタのリンク先("お問い合わせ", /\/contact$/));

caseTest("IT-F02-03-052", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await expect(n.カートのリンク(), "カートの導線").toBeVisible(); });
  await step(3, async () => { await n.マウスオーバーする(n.カートのリンク()); await page.waitForTimeout(800); });
  await expected(async () => {
    await expect.soft(n.カートの商品数(), "カートの商品数（表示されない）").toHaveCount(0);
    await expect.soft(n.カートの商品概要(), "マウスオーバーで表示される商品概要（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-03-055", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await ログインしておく(page, 会員055メール(), 会員055パスワード);
  const v: string[] = [];
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { for (const t of await n.ポイントの数字().allInnerTexts()) v.push(t.replace(/\s+/g, " ").trim()); });
  await expected(async () => {
    expect.soft(v.length, "ポイント欄の数（非表示にならない）").toBeGreaterThan(0);
    expect.soft(v.every((t) => t === "0"), "ポイント欄の数字（すべて0）").toBe(true);
  });
});

caseTest("IT-F02-03-056", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await step(1, async () => { await n.支店トップを開く(支店B056.支店URL); });
  let tab: import("@playwright/test").Page | null = null;
  await step(2, async () => { tab = await n.押して新しいタブを開く(n.地図のリンク()); });
  await expected(async () => {
    expect.soft(tab?.url() ?? "", "新しいタブで開いたアドレス").toBe(支店B056.地図URL);
  });
});

// =====================================================================
// 以下、2026-11-10 の方針（既存データ・画面で作ったデータへの読み替え）で足したケース
// =====================================================================

const T = 15_000;

/** カートのシードが作ったブラウザの状態（クッキー）を、このケースのブラウザへ移す（事前準備の「ブラウザセッションを…へ関連付ける」の代え） */
async function カートのブラウザにする(page: Page, seedId: string): Promise<void> {
  const cart = カートのブラウザたち.get(seedId);
  if (!cart) throw new Error(`${seedId} のブラウザの状態が無い`);
  await page.context().addCookies(cart.cookies);
  note(`「ブラウザセッションを${seedId.replace("S-F02-03-", "")}へ関連付ける」は、シードがカートへ入れたブラウザのクッキーをこのケースのブラウザへ移して代えた（セッション識別子はDBで直接設定する作業のため）`);
}
const 追加順の注記 = () => note("カート明細の追加日時（正本はDBで2026-09-01 10:00・10:05に設定）は、シードがカートへ入れた順で代えた。カートの一覧はカート明細の番号順（＝入れた順）に並ぶ");

// ---- カードセット選択（003・004）: 共有のマスタ（カードセット）へ試験セットを足さず、既存のカードセットで代える ----

const カードセットの注記 = () => note("カードセットは共有のマスタなので「試験セットA・B」を登録せず、環境にある既存のカードセットで代えた（メニューの先頭の2件を試験セットA・Bに読み替える。登録済みのカードセットは管理画面の商品マスターの選択肢で確かめる）");

caseTest("IT-F02-03-003", async ({ page, browser, step, expected }) => {
  const n = new BranchNavPage(page);
  カードセットの注記();
  let 選択肢: { 名前: string; 値: string }[] = [];
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カードセットメニューを開く(); 選択肢 = await n.カードセットの選択肢(); });
  await expected(async () => {
    const 登録済み = await withAdminSession(browser, SETUP_ADMIN, (p) => 登録済みのカードセットの名前(p));
    expect.soft(選択肢.length, "カードセット選択メニューの選択肢の数（2件以上）").toBeGreaterThanOrEqual(2);
    for (const o of 選択肢.slice(0, 2)) expect.soft(登録済み.includes(o.名前), `選択肢「${o.名前}」がカードセット管理に登録されている`).toBe(true);
  });
});

caseTest("IT-F02-03-004", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  カードセットの注記();
  await n.支店トップを開く(支店A.支店URL);
  const 選択肢 = await n.カードセットの選択肢();
  if (選択肢.length < 2) throw new Error(`カードセット選択メニューの選択肢が ${選択肢.length} 件しかない（2件以上必要）`);
  const [A, B] = 選択肢;
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カードセットを選ぶ(A.値); });
  await step(3, async () => { await n.カードセットを選ぶ(B.値); });
  await expected(async () => {
    await expect.soft(n.カードセットの表示(), `選択中のカードセットの表示（「${B.名前}」）`).toHaveText(B.名前, { timeout: T });
    await expect.soft(n.カードセットの値(), `選択中のカードセットの値（「${B.名前}」のID）`).toHaveValue(B.値, { timeout: T });
    expect.soft(A.値 === (await n.カードセットの値().inputValue()), `「${A.名前}」は選択されていない`).toBe(false);
  });
});

// ---- 商品検索（005・006）: ユニサーチは画面で作った商品がすぐ出ないので、すでに出ている既存の商品で代える ----

const 検索の注記 = () => note("検索は外部の検索索引（ユニサーチ）から出る。画面で作った商品はすぐには出ないので「検索対象カード」などを登録せず、支店Aの商品一覧にすでに出ている既存の商品・カードセットで代えた");

/** 支店Aの商品一覧（カードセット指定は任意）の先頭の商品の表示名（既存の商品。ユニサーチにすでに載っているもの） */
async function 既存の商品名(page: Page, カードセットID?: string): Promise<string> {
  const list = new FrontProductList(page);
  await list.open(`/ja/${支店A.支店URL}`, `/products/search${カードセットID ? `?cardset=${カードセットID}` : ""}`);
  await list.結果を待つ();
  const cards = await list.カードを読む();
  const name = cards.map((c) => c.表示名).find((t) => t !== "" && t.length <= 40);
  if (!name) throw new Error(`支店Aの商品一覧${カードセットID ? `（カードセット ${カードセットID}）` : ""}に、検索語に使える既存の商品が出ていない`);
  return name;
}

caseTest("IT-F02-03-005", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  検索の注記();
  const 商品名 = await 既存の商品名(page);
  note(`検索語（商品名）は既存の商品「${商品名}」で代えた`);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.商品検索に入れる(商品名); });
  await expected(async () => {
    await expect.soft(n.検索の候補(), `商品名サジェストに「${商品名}」が表示される`).toContainText(商品名, { timeout: 30_000 });
  });
});

caseTest("IT-F02-03-006", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  検索の注記();
  await n.支店トップを開く(支店A.支店URL);
  const セット = (await n.カードセットの選択肢())[0];
  if (!セット) throw new Error("カードセット選択メニューに選択肢が無い");
  const 商品名 = await 既存の商品名(page, セット.値);
  note(`カードセットは既存の「${セット.名前}」、検索語は、そのカードセットで支店Aの商品一覧に出ている既存の商品「${商品名}」で代えた`);
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カードセットを選ぶ(セット.値); });
  await step(3, async () => { await n.商品検索に入れる(商品名); });
  const list = new FrontProductList(page);
  await step(4, async () => { await n.押して遷移する(n.検索ボタン()); await list.結果を待つ(); });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.searchParams.get("cardset"), "絞り込みのカードセット").toBe(セット.値);
    expect.soft(u.searchParams.get("product"), "絞り込みの検索語").toBe(商品名);
    const cards = await list.カードを読む();
    expect.soft(cards.length, "商品一覧に出た商品の数（1件以上）").toBeGreaterThan(0);
    expect.soft(cards.every((c) => c.表示名.includes(商品名) || c.商品名.includes(商品名)), "出た商品がすべて検索語を商品名に含む（ほかの商品が出ない）").toBe(true);
  });
});

// ---- カート（016〜019・022〜031・051・053・054・058） ----

caseTest("IT-F02-03-016", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await expected(async () => {
    await expect.soft(n.カートのドロップダウン(), "カート内の商品一覧").toBeVisible({ timeout: T });
    await expect.soft(n.カートの商品概要(), "カート内の商品の数（2商品）").toHaveCount(2, { timeout: T });
    await expect.soft(n.カートの商品("試験Foilカード"), "「試験Foilカード」").toBeVisible({ timeout: T });
    await expect.soft(n.カートの商品("試験サプライ"), "「試験サプライ」").toBeVisible({ timeout: T });
  });
});

caseTest("IT-F02-03-017", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await page.mouse.move(100, 700, { steps: 5 }); await page.waitForTimeout(800); });
  await expected(async () => {
    await expect.soft(n.カートのドロップダウン(), "カートの商品一覧が開いていない（非表示）").not.toHaveClass(/is-active/, { timeout: T });
  });
});

caseTest("IT-F02-03-018", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  追加順の注記();
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  let 並び: string[] = [];
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { 並び = await n.カートの商品名の並び(); });
  await expected(async () => {
    expect.soft(並び, "カート内の商品の表示順（追加日時の昇順）").toEqual(["【Foil】試験Foilカード", "試験サプライ"]);
  });
});

caseTest("IT-F02-03-019", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  let バッジ = "", 合計 = "";
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { バッジ = await n.テキスト(n.カートの商品数()); });
  await step(3, async () => { await n.カートを開く(); 合計 = await n.テキスト(n.カートの合計数の表示()); });
  await expected(async () => {
    expect.soft(バッジ, "カートの商品数").toBe("4");
    expect.soft(合計, "商品一覧内の合計商品数").toBe("4");
  });
});

caseTest("IT-F02-03-022", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await expect(n.カートの商品("試験Foilカード"), "「試験Foilカード」の商品概要").toBeVisible({ timeout: T }); });
  await expected(async () => {
    const item = n.カートの商品("試験Foilカード");
    await expect.soft(item.locator(".c-hareruya-label--language"), "カード商品の言語コード").toHaveText("JP", { timeout: T });
    await expect.soft(item.locator(".p-hareruya-header__cart-item-condition"), "カード商品の状態").toHaveText("NM", { timeout: T });
    await expect.soft(item.locator(".p-hareruya-header__cart-item-name-text"), "商品名").toHaveText("【Foil】試験Foilカード", { timeout: T });
  });
});

caseTest("IT-F02-03-023", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await expect(n.カートの商品("試験サプライ"), "「試験サプライ」の商品概要").toBeVisible({ timeout: T }); });
  await expected(async () => {
    const item = n.カートの商品("試験サプライ");
    await expect.soft(item.locator(".c-hareruya-label--language"), "カード言語（表示されない）").toHaveCount(0);
    await expect.soft(item.locator(".p-hareruya-header__cart-item-condition"), "状態（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-03-024", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  追加順の注記();
  await カートのブラウザにする(page, "S-F02-03-CART-BASE-024");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await n.カートの商品("試験Foilカード-024").locator("[data-cart-item-delete]").click({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.カートの商品("試験Foilカード-024"), "「試験Foilカード-024」（カート内から削除）").toHaveCount(0, { timeout: T });
    await expect.soft(n.カートの商品("試験サプライ-024"), "「試験サプライ-024」（残る）").toHaveCount(1, { timeout: T });
    await expect.soft(n.カートの商品概要(), "カート内の商品の数").toHaveCount(1, { timeout: T });
  });
});

caseTest("IT-F02-03-025", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE-025");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await n.カートの商品("試験Foilカード-025").locator("[data-cart-item-decrement]").click({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.カートの商品("試験Foilカード-025").locator(".p-hareruya-header__cart-item-quantity-input"), "「試験Foilカード-025」の商品数").toHaveValue("1", { timeout: T });
  });
});

caseTest("IT-F02-03-026", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-ONE");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await expect(n.カートの商品("数量下限商品").locator("[data-cart-item-decrement]"), "「数量下限商品」のマイナスボタン").toBeVisible({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.カートの商品("数量下限商品").locator("[data-cart-item-decrement]"), "「数量下限商品」のマイナスボタン（押せない）").toBeDisabled({ timeout: T });
  });
});

caseTest("IT-F02-03-028", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE-028");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await n.カートの商品("試験Foilカード-028").locator("[data-cart-item-increment]").click({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.カートの商品("試験Foilカード-028").locator(".p-hareruya-header__cart-item-quantity-input"), "「試験Foilカード-028」の商品数").toHaveValue("3", { timeout: T });
  });
});

caseTest("IT-F02-03-029", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-FULL");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await expect(n.カートの商品("在庫上限商品").locator("[data-cart-item-increment]"), "「在庫上限商品」のプラスボタン").toBeVisible({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.カートの商品("在庫上限商品").locator("[data-cart-item-increment]"), "「在庫上限商品」のプラスボタン（押せない）").toBeDisabled({ timeout: T });
  });
});

caseTest("IT-F02-03-030", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.押して遷移する(n.カートのリンク()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（カート）").toMatch(/\/cart\/?$/);
  });
});

caseTest("IT-F02-03-031", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await n.押して遷移する(n.カートページへの導線()); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "移った先の画面（カート）").toMatch(/\/cart\/?$/);
  });
});

caseTest("IT-F02-03-051", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-BASE-051");
  let バッジ = "", 合計 = "";
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { バッジ = await n.テキスト(n.カートの商品数()); });
  await step(3, async () => { await n.カートを開く(); 合計 = await n.テキスト(n.カートの合計数の表示()); });
  await expected(async () => {
    expect.soft(バッジ, "カートの商品数").toBe("1");
    expect.soft(合計, "商品一覧内の合計商品数").toBe("1");
  });
});

caseTest("IT-F02-03-053", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  追加順の注記();
  await カートのブラウザにする(page, "S-F02-03-CART-MIX-053");
  note("「在庫なし商品-053」の在庫0は、カートへ入れたあとにDBで、この実行で作った商品の在庫の行だけを0にして作った（シード表は出庫-1の承認）");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => {
    await expect(n.カートの商品("在庫なし商品-053"), "「在庫なし商品-053」の商品概要").toBeVisible({ timeout: T });
    await expect(n.カートの商品("在庫あり商品-053"), "「在庫あり商品-053」の商品概要").toBeVisible({ timeout: T });
  });
  await expected(async () => {
    const 無 = n.カートの商品("在庫なし商品-053"), 有 = n.カートの商品("在庫あり商品-053");
    await expect.soft(無.locator("[data-cart-item-decrement]"), "在庫なしのマイナスボタン（表示されない）").toHaveCount(0);
    await expect.soft(無.locator(".p-hareruya-header__cart-item-quantity-input"), "在庫なしの商品数（表示されない）").toHaveCount(0);
    await expect.soft(無.locator("[data-cart-item-increment]"), "在庫なしのプラスボタン（表示されない）").toHaveCount(0);
    await expect.soft(有.locator("[data-cart-item-decrement]"), "在庫ありのマイナスボタン").toBeVisible({ timeout: T });
    await expect.soft(有.locator(".p-hareruya-header__cart-item-quantity-input"), "在庫ありの商品数").toHaveValue("2", { timeout: T });
    await expect.soft(有.locator("[data-cart-item-increment]"), "在庫ありのプラスボタン").toBeVisible({ timeout: T });
  });
});

caseTest("IT-F02-03-054", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CART-NOFOIL-054");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await expect(n.カートの商品("試験カード-054"), "「試験カード-054」の商品概要").toBeVisible({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.カートの商品("試験カード-054").locator(".p-hareruya-header__cart-item-name-text"), "商品名（【Foil】を付けない）").toHaveText("試験カード-054", { timeout: T });
  });
});

caseTest("IT-F02-03-058", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  await カートのブラウザにする(page, "S-F02-03-CBCART-058");
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await n.カートを開く(); });
  await step(3, async () => { await expect(n.カートの商品("カート商品F0203-CB058-A"), "「カート商品F0203-CB058-A」の商品概要").toBeVisible({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.カートの商品("カート商品F0203-CB058-A").locator(".p-hareruya-header__cart-item-name-text"), "商品名（【Foil】が付かない）").toHaveText("カート商品F0203-CB058-A", { timeout: T });
  });
});

// ---- 外部サイトへのリンク（045・046） ----

function 外部リンク(名前: string, 先: string): import("../../lib/case").CaseBody {
  return async ({ page, step, expected }) => {
    const n = new BranchNavPage(page);
    let 開いた先 = "";
    await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
    await step(2, async () => { 開いた先 = await n.押して新しいタブのアドレスを読む(n.フッタのリンク(名前)); });
    await expected(async () => {
      expect.soft(開いた先.replace(/[?#].*$/, "").replace(/\/+$/, ""), `新しいタブで開いたアドレス（${名前}）`).toBe(先);
    });
  };
}
caseTest("IT-F02-03-045", 外部リンク("晴れる屋X", "https://x.com/hareruya_mtg"));
caseTest("IT-F02-03-046", 外部リンク("晴れる屋Channel", "https://www.youtube.com/channel/UC1l7GtlvAmCOXRlxjImbWvw"));

// ---- カテゴリ（034〜038）: 共有のカテゴリへ子を足さず、環境にある既存のカテゴリで代える ----

const カテゴリの注記 = () => note("カテゴリは共有のマスタ（最新セット・スタンダードなどの既存カテゴリ）へ試験用の子カテゴリを足さず、環境にある既存のカテゴリのツリーで代えた（表示されているカテゴリが、メニューのツリーに出ることを確かめる）");

/** カテゴリバーのボタンにマウスを乗せ、ドロップダウンの1列目の項目が出るのを待つ */
async function カテゴリを開く(n: BranchNavPage, type: string): Promise<void> {
  await n.マウスオーバーする(n.カテゴリバーのボタン(type));
  await expect(n.カテゴリの項目(type, 1).first(), `「${type}」のカテゴリの1列目`).toBeVisible({ timeout: 30_000 });
}

caseTest("IT-F02-03-034", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  カテゴリの注記();
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  let 一列目: string[] = [], 二列目: string[] = [];
  await step(2, async () => {
    await カテゴリを開く(n, "all");
    一列目 = await n.カテゴリの項目の名前("all", 1);
    // 子を持つ最初の第一階層にマウスを乗せて、子のツリーを出す
    await n.マウスオーバーする(n.カテゴリの項目("all", 1).locator('a[data-has-children="true"]').first());
    await expect(n.カテゴリの項目("all", 2).first(), "子カテゴリの列").toBeVisible({ timeout: 30_000 });
    二列目 = await n.カテゴリの項目の名前("all", 2);
  });
  await expected(async () => {
    expect.soft(一列目.length, "カテゴリツリーの第一階層の項目数（1件以上）").toBeGreaterThan(0);
    expect.soft(二列目.length, "第一階層にマウスを乗せて出る子カテゴリの数（1件以上）").toBeGreaterThan(0);
  });
});

caseTest("IT-F02-03-035", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  カテゴリの注記();
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  let 一列目: string[] = [], 二列目: string[] = [];
  await step(2, async () => {
    await カテゴリを開く(n, "latest-set");
    一列目 = await n.カテゴリの項目の名前("latest-set", 1);
    await expect(n.カテゴリの項目("latest-set", 2).first(), "最新セットの子カテゴリの列").toBeVisible({ timeout: 30_000 });
    二列目 = await n.カテゴリの項目の名前("latest-set", 2);
  });
  await expected(async () => {
    expect.soft(一列目.length, "最新セットのカテゴリ（1件）").toBe(1);
    expect.soft(二列目.length, "最新セットの子カテゴリの数（1件以上）").toBeGreaterThan(0);
    const 孫あり = n.カテゴリの項目("latest-set", 2).locator('a[data-has-children="true"]').first();
    if (await 孫あり.count()) {
      await n.マウスオーバーする(孫あり);
      await expect.soft(n.カテゴリの項目("latest-set", 3).first(), "子カテゴリの子カテゴリ（ツリーの3列目）").toBeVisible({ timeout: 30_000 });
    }
  });
});

caseTest("IT-F02-03-036", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  カテゴリの注記();
  let 名前: string[] = [];
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { 名前 = (await n.カテゴリバーの全ボタン().allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()); });
  await expected(async () => {
    for (const f of ["スタンダード", "パイオニア", "モダン", "レガシー", "統率者", "その他"]) {
      expect.soft(名前.includes(f), `フォーマットメニューの項目「${f}」`).toBe(true);
    }
    for (const type of ["standard", "pioneer", "modern", "legacy", "commander", "others"]) {
      await expect.soft(n.カテゴリバーのボタン(type), `カテゴリバーの項目（${type}）が見える`).toBeVisible();
    }
  });
});

caseTest("IT-F02-03-037", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  カテゴリの注記();
  const 子: Record<string, string[]> = {};
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => {
    for (const type of ["standard", "pioneer", "modern", "legacy", "commander"]) {
      await カテゴリを開く(n, type);
      await expect(n.カテゴリの項目(type, 2).first(), `「${type}」の子カテゴリの列`).toBeVisible({ timeout: 30_000 });
      子[type] = await n.カテゴリの項目の名前(type, 2);
    }
  });
  await expected(async () => {
    for (const [type, 名前] of Object.entries(子)) expect.soft(名前.length, `フォーマット（${type}）にツリー表示される子カテゴリの数（1件以上）`).toBeGreaterThan(0);
  });
});

caseTest("IT-F02-03-038", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  カテゴリの注記();
  let 名前: string[] = [];
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await カテゴリを開く(n, "others"); 名前 = await n.カテゴリの項目の名前("others", 1); });
  await expected(async () => {
    for (const c of ["その他カード", "Secret Lair シリーズ一覧", "その他商品", "セット詰め合わせ", "サプライ・グッズ", "BOX/パック/未開封製品"]) {
      expect.soft(名前.some((t) => t.replace(/\s+/g, "") === c.replace(/\s+/g, "")), `その他のツリーのカテゴリ「${c}」`).toBe(true);
    }
  });
});

// ---- 画面幅390px（059・060）: ブラウザの表示領域を幅390pxにして代える ----

const 狭い画面の注記 = () => note("専用ブラウザプロファイル（画面幅390px）は、ブラウザの表示領域を幅390pxにして代えた");

caseTest("IT-F02-03-059", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  狭い画面の注記();
  await page.setViewportSize({ width: 390, height: 844 });
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await expect(n.下のナビ(), "画面下部へ固定された並び").toBeVisible({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.商品検索の入力(), "ヘッダのキーワード検索").toBeVisible();
    await expect.soft(n.ヘッダのリンク("ログイン").locator("visible=true"), "ヘッダのログイン（表示されない）").toHaveCount(0);
    await expect.soft(n.ポイントの数字().locator("visible=true"), "ヘッダのポイント（表示されない）").toHaveCount(0);
    await expect.soft(n.下のナビのリンク("ログイン").locator("visible=true"), "画面下部の並びの「ログイン」").toHaveCount(1);
    await expect.soft(n.下のナビ().getByText(/ポイント|\d\s*pt/).locator("visible=true"), "画面下部の並びのポイント（表示されない）").toHaveCount(0);
    await expect.soft(n.下のナビのリンク("ログアウト").locator("visible=true"), "画面下部の並びのログアウト（表示されない）").toHaveCount(0);
  });
});

caseTest("IT-F02-03-060", async ({ page, step, expected }) => {
  const n = new BranchNavPage(page);
  狭い画面の注記();
  await ログインしておく(page, 会員メール(), 会員パスワード);
  await page.setViewportSize({ width: 390, height: 844 });
  await step(1, async () => { await n.支店トップを開く(支店A.支店URL); });
  await step(2, async () => { await expect(n.下のナビ(), "画面下部へ固定された並び").toBeVisible({ timeout: T }); });
  await expected(async () => {
    await expect.soft(n.商品検索の入力(), "ヘッダのキーワード検索").toBeVisible();
    await expect.soft(n.ポイントの数字().locator("visible=true"), "ヘッダのポイント（表示されない）").toHaveCount(0);
    await expect.soft(n.下のナビのリンク("マイページ").locator("visible=true"), "画面下部の並びの「マイページ」").toHaveCount(1);
    await expect.soft(n.下のナビ().getByText("1,200").locator("visible=true"), "画面下部の並びの保有ポイント1,200").toHaveCount(1);
    await expect.soft(n.下のナビのリンク("ログアウト").locator("visible=true"), "画面下部の並びのログアウトの導線").toHaveCount(1);
  });
});
