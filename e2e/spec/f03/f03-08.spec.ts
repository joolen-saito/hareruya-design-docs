/** F03-08 お気に入り商品。正本: cases/F03-08_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { rc } from "../../lib/run_marker";
import { hideDebugToolbar } from "../../lib/session";
import { お気に入り件数, 言語別のお気に入り件数 } from "../../db/f03_08";
import { FRONT, FRONT_BRANCH, FrontFavorite, 押した結果 } from "../../pages/front/f03_08_favorite";
import { memberOf, productOf } from "../../seeds/f03-08";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
/** 正本の外の補い（合否が補いの上に成り立つ。記録で条件付きに分ける） */
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };

/** ケースの文の「会員A」（メールアドレスの前半＝正本の値）でログイン */
async function loginAs(front: FrontFavorite, local: string): Promise<void> {
  const m = memberOf(local);
  if (!(await front.login(m.mail, m.password))) {
    note("ログイン画面を開くと、すでにログイン済みの状態でログイン画面は出ず、マイページが開いた（本店と支店でログインの状態が共通）");
  }
}
const pathOf = (page: Page) => new URL(page.url()).pathname;
/** 押した結果を注記に残す */
const noteResult = (what: string, r: 押した結果) => note(
  `${what}: 完了の通知=${r.通知が出た ? `出た「${r.通知の文}」` : "出ない"}／ログインモーダル=${r.ログインモーダルが開いた ? "開いた" : "開かない"}`
  + `／ほかのモーダル=${r.開いたモーダルの文.length ? r.開いたモーダルの文.map((t) => `「${t}」`).join("") : "開かない"}`
  + (r.警告の文.length ? `／警告=${r.警告の文.join("」「")}` : ""),
);

/**
 * 正本が「完了モーダルの「OK」を押す」と書く手順。アプリには完了のモーダルが無く画面右下の通知が出るだけなので、
 * モーダルの閉じるボタン、無ければ通知の閉じるボタンで閉じる（後者は正本の外の補い）。
 */
async function closeCompletion(front: FrontFavorite, what: string): Promise<void> {
  const modalOk = front.開いているモーダルの閉じるボタン;
  if ((await modalOk.count()) > 0) { await modalOk.click(); return; }
  supplement(`${what}: 完了のモーダルが無く、「OK」ボタンも無い（画面右下の通知が出るだけ）。通知の閉じるボタンで閉じて続けた`);
  await front.通知を閉じる();
}

/** 別のブラウザ（ブラウザB）。ブラウザAのセッションと分けた新しいコンテキスト */
async function newBrowserB(browser: import("@playwright/test").Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  return { page: await context.newPage(), close: () => context.close() };
}

// ---- 001 本店と支店の表示差 ----

/** 画面に見えている、お気に入り機能の入口（ヘッダーのお気に入り・商品のお気に入りボタン・マイページのお気に入りの入口・一覧そのもの）の数 */
const ENTRANCE = (
    '.p-hareruya-header__nav-right-item--favorite a:visible, .js-product-list-favorite:visible, #add_favorite:visible, '
    + 'a.p-hareruya-mypage__menu-link[href*="/mypage/favorite"]:visible, .p-hareruya-favorite-list:visible, .ec-navlistRole__item a[href$="/mypage/favorite"]:visible'
);
async function お気に入り機能の表示(page: Page): Promise<number> {
  const found = await page.locator(ENTRANCE).evaluateAll((es) => es.map((e) => `${e.tagName.toLowerCase()}[${(e.getAttribute("href") ?? e.id ?? "").slice(0, 60)}]「${((e as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 30)}」`));
  if (found.length) note(`${page.url()} で見えたお気に入り機能の入口: ${found.join(" / ")}`);
  return page.locator(
    '.p-hareruya-header__nav-right-item--favorite a:visible, .js-product-list-favorite:visible, #add_favorite:visible, '
    + 'a.p-hareruya-mypage__menu-link[href*="/mypage/favorite"]:visible, .p-hareruya-favorite-list:visible, .ec-navlistRole__item a[href$="/mypage/favorite"]:visible',
  ).count();
}

caseTest("IT-F03-08-001", async ({ page, step, expected, capture }) => {
  const { productId } = productOf("STORE-001-001");
  const main = new FrontFavorite(page, FRONT);
  const branch = new FrontFavorite(page, FRONT_BRANCH);
  const seen = { 本店: { ECTOP: -1, 商品一覧: -1, 商品詳細: -1, お気に入り登録商品一覧: -1 }, 支店: { ECTOP: -1, 商品一覧: -1, 商品詳細: -1, マイページ: -1 } };
  const visit = async (url: string): Promise<number> => {
    await page.goto(url);
    await page.waitForLoadState("load");
    return お気に入り機能の表示(page);
  };
  await step(1, async () => { await loginAs(main, "f0308-a-001"); });
  await step(2, async () => {
    seen.本店.ECTOP = await visit(`${FRONT}`);
    await capture("本店ECTOP");
    seen.本店.商品一覧 = await visit(`${FRONT}/products/search?product=${encodeURIComponent(rc("STORE-001-001"))}`);
    await capture("本店商品一覧");
    seen.本店.商品詳細 = await visit(`${FRONT}/products/detail/${productId}`);
    await capture("本店商品詳細");
    seen.本店.お気に入り登録商品一覧 = await visit(`${FRONT}/mypage/favorite`);
  });
  await step(3, async () => { await loginAs(branch, "f0308-a-001"); });
  await step(4, async () => {
    seen.支店.ECTOP = await visit(`${FRONT_BRANCH}`);
    await capture("支店ECTOP");
    seen.支店.商品一覧 = await visit(`${FRONT_BRANCH}/products/search?product=${encodeURIComponent(rc("STORE-001-001"))}`);
    await capture("支店商品一覧");
    seen.支店.商品詳細 = await visit(`${FRONT_BRANCH}/products/detail/${productId}`);
    await capture("支店商品詳細");
    seen.支店.マイページ = await visit(`${FRONT_BRANCH}/mypage`);
  });
  await expected(async () => {
    expect.soft(seen.本店.ECTOP, "本店ECTOPのお気に入り機能の入口の数").toBeGreaterThan(0);
    expect.soft(seen.本店.商品一覧, "本店商品一覧のお気に入り機能の入口の数").toBeGreaterThan(0);
    expect.soft(seen.本店.商品詳細, "本店商品詳細のお気に入り機能の入口の数").toBeGreaterThan(0);
    expect.soft(seen.本店.お気に入り登録商品一覧, "本店マイページ＞お気に入り登録商品一覧のお気に入り機能の表示の数").toBeGreaterThan(0);
    expect.soft(seen.支店.ECTOP, "支店ECTOPのお気に入り機能の入口の数（表示されない）").toBe(0);
    expect.soft(seen.支店.商品一覧, "支店商品一覧のお気に入り機能の入口の数（表示されない）").toBe(0);
    expect.soft(seen.支店.商品詳細, "支店商品詳細のお気に入り機能の入口の数（表示されない）").toBe(0);
    expect.soft(seen.支店.マイページ, "支店マイページのお気に入り機能の入口の数（表示されない）").toBe(0);
  });
});

// ---- 002・024相当 未ログインで追加を押す ----

caseTest("IT-F03-08-002", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("ADD-001-002");
  let r!: 押した結果;
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { r = await front.押す(); noteResult("未ログインでお気に入りボタンを押した", r); });
  await expected(async () => {
    expect.soft(r.確認のモーダルが開いた, "お気に入り登録確認モーダルを経由した").toBe(false);
    expect.soft(r.ログインモーダルが開いた, "ログインモーダルが表示された").toBe(true);
  });
});

// ---- 003〜007 登録・解除 ----

caseTest("IT-F03-08-003", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const m = memberOf("f0308-a-003");
  const { productId } = productOf("ADD-001-003");
  let n = -1;
  await step(1, async () => { await loginAs(front, "f0308-a-003"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("お気に入りボタンを押した", await front.押す()); });
  await step(4, async () => { n = お気に入り件数(m.id, productId, "JP"); });
  await expected(async () => {
    expect.soft(n, "会員A・商品ADD-001-003・日本語を対応付けたお気に入りの件数").toBe(1);
  });
});

caseTest("IT-F03-08-004", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("ADD-001-004");
  let r!: 押した結果;
  await step(1, async () => { await loginAs(front, "f0308-a-004"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { r = await front.押す(); noteResult("お気に入りボタンを押した", r); });
  await expected(async () => {
    expect.soft(r.確認のモーダルが開いた, "お気に入り登録確認モーダルを経由した").toBe(false);
    expect.soft(r.完了のモーダルが開いた, "お気に入り登録完了モーダルが表示された（開いたモーダルの文）").toBe(true);
  });
});

caseTest("IT-F03-08-005", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("ADD-001-005");
  let names: string[] = [];
  await step(1, async () => { await loginAs(front, "f0308-a-005"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("お気に入りボタンを押した", await front.押す()); });
  await step(4, async () => { await closeCompletion(front, "手順4"); });
  await step(5, async () => { await front.openFavoriteList(); names = await front.一覧の商品名(); });
  await expected(async () => {
    expect.soft(names, "お気に入り登録商品一覧の商品名").toContain(rc("ADD-001-005"));
  });
});

caseTest("IT-F03-08-006", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const m = memberOf("f0308-a-006");
  const { productId } = productOf("EXIST-001-006");
  let n = -1;
  await step(1, async () => { await loginAs(front, "f0308-a-006"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => {
    expect(await front.登録済みの表示か(), "押す前のお気に入りボタンが登録済み状態").toBe(true);
    noteResult("登録済み状態のお気に入りボタンを押した", await front.押す());
  });
  await step(4, async () => { n = お気に入り件数(m.id, productId, "JP"); });
  await expected(async () => {
    expect.soft(n, "会員A・商品EXIST-001-006・日本語のお気に入りの件数（削除される）").toBe(0);
  });
});

caseTest("IT-F03-08-007", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("EXIST-001-007");
  let r!: 押した結果;
  await step(1, async () => { await loginAs(front, "f0308-a-007"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { r = await front.押す(); noteResult("登録済み状態のお気に入りボタンを押した", r); });
  await expected(async () => {
    expect.soft(r.確認のモーダルが開いた, "お気に入り登録キャンセル確認モーダルを経由した").toBe(false);
    expect.soft(r.完了のモーダルが開いた, "お気に入り登録キャンセル完了モーダルが表示された（開いたモーダルの文）").toBe(true);
  });
});

// ---- 008〜013 お気に入り登録商品一覧 ----

caseTest("IT-F03-08-008", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  let names: string[] = [];
  await step(1, async () => { await loginAs(front, "f0308-a-008"); });
  await step(2, async () => { await front.openFavoriteList(); names = await front.一覧の商品名(); });
  await expected(async () => {
    expect.soft(names, "会員Aの一覧にOWN-A-001-008がある").toContain(rc("OWN-A-001-008"));
    expect.soft(names, "会員Aの一覧にOWN-A-002-008がある").toContain(rc("OWN-A-002-008"));
    expect.soft(names, "会員Aの一覧に会員BだけのOWN-B-001-008が無い").not.toContain(rc("OWN-B-001-008"));
  });
});

caseTest("IT-F03-08-009", async ({ page, step, expected }) => {
  await step(1, async () => {
    await page.goto(`${FRONT}/mypage/favorite`);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(pathOf(page), "遷移先の画面のパス（会員ログイン画面）").toMatch(/\/mypage\/login$/);
  });
});

caseTest("IT-F03-08-010", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  let names: string[] = [];
  await step(1, async () => { await loginAs(front, "f0308-a-010"); });
  await step(2, async () => { await front.openFavoriteList(); names = await front.一覧の商品名(); });
  await expected(async () => {
    expect.soft(names, "一覧に公開中のPUB-001-010がある").toContain(rc("PUB-001-010"));
    expect.soft(names, "一覧に非公開のPRIVATE-001-010が無い").not.toContain(rc("PRIVATE-001-010"));
  });
});

caseTest("IT-F03-08-011", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  let names: string[] = [];
  await step(1, async () => { await loginAs(front, "f0308-a-011"); });
  await step(2, async () => { await front.openFavoriteList(); names = await front.一覧の商品名(); });
  await expected(async () => {
    expect.soft(names, "一覧に在庫がある高額商品HP-STOCK-001-011がある").toContain(rc("HP-STOCK-001-011"));
    expect.soft(names, "一覧に在庫がない高額商品HP-OUT-001-011が無い").not.toContain(rc("HP-OUT-001-011"));
  });
});

caseTest("IT-F03-08-012", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const name = rc("LANG-LIST-001-012");
  let languages: string[] = [];
  await step(1, async () => { await loginAs(front, "f0308-a-012"); });
  await step(2, async () => { await front.openFavoriteList(); });
  await step(3, async () => {
    const cards = front.一覧のカードの商品(name);
    languages = [];
    for (const c of await cards.all()) languages.push(await front.一覧の言語(c));
  });
  await expected(async () => {
    expect.soft(languages.length, "多言語商品LANG-LIST-001-012の行の数").toBe(2);
    expect.soft([...languages].sort(), "多言語商品の行の言語（日本語と英語）").toEqual(["EN", "JP"]);
  });
});

caseTest("IT-F03-08-013", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("LANG-STATE-001-013");
  const state = { 日本語: false, 英語: false };
  await step(1, async () => { await loginAs(front, "f0308-a-013"); });
  await step(2, async () => { await front.openDetail(productId, "JP"); state.日本語 = await front.登録済みの表示か(); });
  await step(3, async () => { await front.openDetail(productId, "EN"); state.英語 = await front.登録済みの表示か(); });
  await expected(async () => {
    expect.soft(state.日本語, "日本語の商品詳細のお気に入りボタンが登録済み状態").toBe(true);
    expect.soft(state.英語, "英語の商品詳細のお気に入りボタンが登録済み状態（未登録のはず）").toBe(false);
  });
});

// ---- 018〜023 同時操作・認証切れ ----

caseTest("IT-F03-08-018", async ({ page, browser, step, expected }) => {
  const a = new FrontFavorite(page);
  const m = memberOf("f0308-a-018");
  const { productId } = productOf("ADD-001-018");
  const b = await newBrowserB(browser);
  let n = -1;
  try {
    const fb = new FrontFavorite(b.page);
    await step(1, async () => { await loginAs(a, "f0308-a-018"); await a.openDetail(productId); });
    await step(2, async () => {
      await loginAs(fb, "f0308-a-018");
      await fb.openDetail(productId);
      noteResult("ブラウザBでお気に入りに追加した", await fb.押す());
    });
    await step(3, async () => { noteResult("ブラウザAで表示済みのボタンを押した", await a.押す()); });
    await step(4, async () => { n = お気に入り件数(m.id, productId, "JP"); });
    await expected(async () => {
      expect.soft(n, "会員A・商品ADD-001-018・日本語のお気に入りの件数（二重に作られない）").toBe(1);
    });
  } finally {
    await b.close();
  }
});

caseTest("IT-F03-08-019", async ({ page, browser, step, expected }) => {
  const a = new FrontFavorite(page);
  const { productId } = productOf("ADD-001-019");
  const b = await newBrowserB(browser);
  let r!: 押した結果;
  try {
    const fb = new FrontFavorite(b.page);
    await step(1, async () => { await loginAs(a, "f0308-a-019"); await a.openDetail(productId); });
    await step(2, async () => {
      await loginAs(fb, "f0308-a-019");
      await fb.openDetail(productId);
      noteResult("ブラウザBでお気に入りに追加した", await fb.押す());
    });
    await step(3, async () => { r = await a.押す(); noteResult("ブラウザAで表示済みのボタンを押した", r); });
    await expected(async () => {
      expect.soft(r.完了のモーダルが開いた, "再登録に対してお気に入り登録完了モーダルが表示された（開いたモーダルの文）").toBe(true);
    });
  } finally {
    await b.close();
  }
});

caseTest("IT-F03-08-021", async ({ page, browser, step, expected }) => {
  const a = new FrontFavorite(page);
  const m = memberOf("f0308-a-021");
  const exist = productOf("EXIST-001-021");
  const other = productOf("OTHER-001-021");
  const b = await newBrowserB(browser);
  const got = { 対象: -1, 対象外: -1 };
  try {
    const fb = new FrontFavorite(b.page);
    // 事前準備の④〜⑥: ブラウザAとBで会員Aとしてログインして対象の商品詳細を開き、ブラウザBで解除してDBで確かめる
    await loginAs(a, "f0308-a-021");
    await loginAs(fb, "f0308-a-021");
    await a.openDetail(exist.productId);
    await fb.openDetail(exist.productId);
    noteResult("事前準備: ブラウザBで解除した", await fb.押す());
    expect(お気に入り件数(m.id, exist.productId, "JP"), "事前準備: ブラウザBの解除のあとのEXIST-001-021のお気に入りの件数").toBe(0);
    expect(お気に入り件数(m.id, other.productId, "JP"), "事前準備: OTHER-001-021のお気に入りの件数").toBe(1);
    await step(1, async () => { noteResult("ブラウザAで表示済みの登録済み状態のボタンを押した", await a.押す()); });
    await step(2, async () => {
      got.対象 = お気に入り件数(m.id, exist.productId, "JP");
      got.対象外 = お気に入り件数(m.id, other.productId, "JP");
    });
    await expected(async () => {
      expect.soft(got.対象, "商品EXIST-001-021のお気に入りの件数（0件のまま）").toBe(0);
      expect.soft(got.対象外, "対象外の商品OTHER-001-021のお気に入りの件数（1件残る）").toBe(1);
    });
  } finally {
    await b.close();
  }
});

caseTest("IT-F03-08-022", async ({ page, browser, step, expected }) => {
  const a = new FrontFavorite(page);
  const { productId } = productOf("EXIST-001-022");
  const b = await newBrowserB(browser);
  let r!: 押した結果;
  try {
    const fb = new FrontFavorite(b.page);
    await step(1, async () => {
      await loginAs(a, "f0308-a-022");
      await loginAs(fb, "f0308-a-022");
      await a.openDetail(productId);
      await fb.openDetail(productId);
    });
    await step(2, async () => { noteResult("ブラウザBで解除した", await fb.押す()); });
    await step(3, async () => { r = await a.押す(); noteResult("ブラウザAで表示済みの登録済み状態のボタンを押した", r); });
    await expected(async () => {
      expect.soft(r.完了のモーダルが開いた, "登録されていない商品・言語の解除に対してお気に入り登録キャンセル完了モーダルが表示された（開いたモーダルの文）").toBe(true);
    });
  } finally {
    await b.close();
  }
});

caseTest("IT-F03-08-023", async ({ page, step, expected, capture }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("EXIST-001-023");
  const resp = { 状態: -1, 本文: "(未取得)", 見た: false };
  await step(1, async () => { await loginAs(front, "f0308-a-023"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => {
    const cookies = await page.context().cookies();
    note(`ブラウザが持っているCookie: ${cookies.map((c) => c.name).join("、")}`);
    // 会員のログイン状態を持つセッションのCookie（eccube）とログインの記憶のCookie（eccube_remember_me）を消す
    await page.context().clearCookies({ name: "eccube" });
    await page.context().clearCookies({ name: "eccube_remember_me" });
    note(`消したあとのCookie: ${(await page.context().cookies()).map((c) => c.name).join("、")}`);
  });
  await step(4, async () => {
    const wait = page.waitForResponse((r) => /\/products\/remove_favorite\//.test(r.url()), { timeout: 15_000 }).catch(() => null);
    noteResult("Cookieを消したあとに登録済み状態のボタンを押した", await front.押す());
    const r = await wait;
    if (r) { resp.状態 = r.status(); resp.本文 = await r.text().catch(() => "(読めない)"); resp.見た = true; }
  });
  await step(5, async () => {
    note(`解除通信の応答: ${resp.見た ? `HTTP${resp.状態}・本文「${resp.本文}」` : "解除通信が見つからない"}`);
    await capture("解除通信の応答（確かめた値は注記）");
  });
  await expected(async () => {
    expect.soft(resp.状態, "解除通信の応答のHTTPステータス").toBe(400);
    expect.soft(resp.本文, "解除通信の応答本文（空）").toBe("");
  });
});

// ---- 025 新規会員登録へ ----

caseTest("IT-F03-08-025", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("ADD-001-025");
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { noteResult("未ログインでお気に入りボタンを押した", await front.押す()); });
  await step(3, async () => {
    const link = front.ログインモーダル.locator('a[href$="/entry"]');
    await expect(link, "ログインモーダルの「新規会員登録」").toBeVisible();
    await Promise.all([page.waitForURL(/\/entry/, { timeout: 10_000 }), link.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(pathOf(page), "遷移先の画面のパス（会員登録画面）").toMatch(/\/entry$/);
  });
});

// ---- 026〜029 通信の失敗・一覧からの解除 ----

caseTest("IT-F03-08-026", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("ADD-001-026");
  let r!: 押した結果;
  await step(1, async () => { await loginAs(front, "f0308-a-026"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { await page.route("**/products/add_favorite/**", (route) => route.abort()); });
  await step(4, async () => { r = await front.押す(); noteResult("通信を遮断してお気に入りボタンを押した", r); });
  await expected(async () => {
    expect.soft(await front.登録済みの表示か(), "お気に入りボタンが登録済み状態（未登録状態に戻っているはず）").toBe(false);
    expect.soft(pathOf(page), "いまの画面のパス（商品詳細画面に留まる）").toBe(`/ja/products/detail/${productId}`);
  });
});

caseTest("IT-F03-08-027", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("EXIST-001-027");
  let r!: 押した結果;
  await step(1, async () => { await loginAs(front, "f0308-a-027"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { await page.route("**/products/remove_favorite/**", (route) => route.abort()); });
  await step(4, async () => { r = await front.押す(); noteResult("通信を遮断して登録済み状態のボタンを押した", r); });
  await expected(async () => {
    expect.soft(await front.登録済みの表示か(), "お気に入りボタンが登録済み状態").toBe(true);
    expect.soft(pathOf(page), "いまの画面のパス（商品詳細画面に留まる）").toBe(`/ja/products/detail/${productId}`);
  });
});

caseTest("IT-F03-08-028", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const name = rc("EXIST-001-028");
  let names: string[] = [];
  await step(1, async () => { await loginAs(front, "f0308-a-028"); });
  await step(2, async () => { await front.openFavoriteList(); });
  await step(3, async () => {
    // 開発者ツールのローカルオーバーライドの代わりに、解除通信の応答を失敗状態（HTTP500）に差し替える
    await page.route("**/mypage/favorite/*/delete/*", (route) => route.fulfill({ status: 500, contentType: "application/json", body: "{}" }));
    supplement("ローカルオーバーライドは使わず、同じ効果のネットワークの差し替え（解除通信の応答をHTTP500にする）で行った");
  });
  await step(4, async () => {
    await front.解除ボタン(front.一覧のカードの商品(name)).click();
    await page.waitForTimeout(1500);
    note(`警告ダイアログ: ${front.dialogs.length ? front.dialogs.join(" / ") : "出ない"}`);
  });
  await expected(async () => {
    names = await front.一覧の商品名();
    expect.soft(pathOf(page), "いまの画面のパス（お気に入り登録商品一覧に留まる）").toBe("/ja/mypage/favorite");
    expect.soft(names, "一覧に商品EXIST-001-028が残っている").toContain(name);
  });
});

caseTest("IT-F03-08-029", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const name = rc("EXIST-001-029");
  let names: string[] = [];
  await step(1, async () => { await loginAs(front, "f0308-a-029"); });
  await step(2, async () => { await front.openFavoriteList(); });
  await step(3, async () => {
    await front.解除ボタン(front.一覧のカードの商品(name)).click();
    await expect(front.一覧のカードの商品(name), "解除した商品のカードが一覧から消える").toHaveCount(0);
  });
  await expected(async () => {
    names = await front.一覧の商品名();
    expect.soft(pathOf(page), "いまの画面のパス（お気に入り登録商品一覧に留まる）").toBe("/ja/mypage/favorite");
    expect.soft(names, "一覧から商品EXIST-001-029が除かれている").not.toContain(name);
  });
});

// ---- 030・031 完了モーダルを閉じたあと ----

async function 一覧へのリンクの数(page: Page): Promise<number> {
  return page.locator('a[href$="/mypage/favorite"]:visible').count();
}

caseTest("IT-F03-08-030", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("ADD-001-030");
  await step(1, async () => { await loginAs(front, "f0308-a-030"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("お気に入りボタンを押した", await front.押す()); });
  await step(4, async () => { await closeCompletion(front, "手順4"); });
  await expected(async () => {
    expect.soft(pathOf(page), "いまの画面のパス（追加確認商品ADD-001-030の商品詳細画面に留まる）").toBe(`/ja/products/detail/${productId}`);
    expect.soft(await 一覧へのリンクの数(page), "お気に入り登録商品一覧へのリンクの表示数").toBeGreaterThan(0);
  });
});

caseTest("IT-F03-08-031", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("EXIST-001-031");
  await step(1, async () => { await loginAs(front, "f0308-a-031"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("登録済み状態のお気に入りボタンを押した", await front.押す()); });
  await step(4, async () => { await closeCompletion(front, "手順4"); });
  await expected(async () => {
    expect.soft(pathOf(page), "いまの画面のパス（解除確認商品EXIST-001-031の商品詳細画面に留まる）").toBe(`/ja/products/detail/${productId}`);
    expect.soft(await 一覧へのリンクの数(page), "お気に入り登録商品一覧へのリンクの表示数").toBeGreaterThan(0);
  });
});

// ---- 034 言語を足して登録 ----

caseTest("IT-F03-08-034", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const m = memberOf("f0308-034-a");
  const { productId } = productOf("F0308-034-P1");
  let n = { JP: -1, EN: -1, そのほか: -1 };
  await step(1, async () => { await loginAs(front, "f0308-034-a"); });
  await step(2, async () => { await front.openDetail(productId, "EN"); });
  await step(3, async () => { noteResult("英語の商品詳細でお気に入りボタンを押した", await front.押す()); });
  await step(4, async () => { n = 言語別のお気に入り件数(m.id, productId); });
  await expected(async () => {
    expect.soft(n.EN, "会員A・多言語商品F0308-034-P1・英語のお気に入りの件数（新たに1件）").toBe(1);
    expect.soft(n.JP, "日本語のお気に入りの件数（残る）").toBe(1);
    expect.soft(n.JP + n.EN + n.そのほか, "会員Aの多言語商品F0308-034-P1のお気に入りの合計（日本語と英語の2件）").toBe(2);
  });
});

// ---- 035〜040 ログインモーダル・完了モーダルの閉じる ----

caseTest("IT-F03-08-035", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("F0308-035-P1");
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { noteResult("未ログインでお気に入りボタンを押した", await front.押す()); });
  await step(3, async () => {
    await expect(front.ログインモーダルの閉じるボタン, "ログインモーダルの閉じるボタン").toBeVisible();
    await front.ログインモーダルの閉じるボタン.click();
  });
  await expected(async () => {
    expect.soft(await front.ログインモーダルが開いているか(), "ログインモーダルが開いている（閉じて表示されなくなるはず）").toBe(false);
    await expect.soft(front.ログインモーダル, "ログインモーダルの表示").toBeHidden();
  });
});

caseTest("IT-F03-08-036", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("F0308-036-P1");
  const m = memberOf("f0308-036-a");
  let names: string[] = [];
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { noteResult("未ログインでお気に入りボタンを押した", await front.押す()); });
  await step(3, async () => {
    // 同じ ID のログインフォームが画面に2つある（ヘッダーと商品詳細）。開いたモーダルの中のもの（先頭）に入れる
    const form = page.locator("#favorite-login-form").first();
    await expect(form, "ログインモーダルの入力欄").toBeVisible();
    await form.locator('input[name="login_email"]').fill(m.mail);
    await form.locator('input[name="login_pass"]').fill(m.password);
  });
  await step(4, async () => {
    await page.locator("#favorite-login-form").first().locator("button[type=submit]").click();
    await expect(front.ログインモーダル, "ログイン後にログインモーダルが閉じる").toBeHidden({ timeout: 15_000 }).catch(() => note("ログインを押しても、ログインモーダルが閉じなかった"));
    await page.waitForLoadState("load");
  });
  await step(5, async () => { await front.openFavoriteList(); names = await front.一覧の商品名(); });
  await expected(async () => {
    expect.soft(pathOf(page), "いまの画面のパス（会員ログイン画面へ誘導されず、お気に入り登録商品一覧）").toBe("/ja/mypage/favorite");
    expect.soft(names, "一覧に商品F0308-036-P2の行が含まれる").toContain(rc("F0308-036-P2"));
  });
});

caseTest("IT-F03-08-037", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("F0308-037-P1");
  await step(1, async () => { await loginAs(front, "f0308-037-a"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("お気に入りボタンを押した", await front.押す()); });
  await step(4, async () => {
    // 完了のモーダルの閉じるボタン。画面に完了のモーダルが無ければ、押す相手が無く、ここで落ちる
    await expect(front.開いているモーダルの閉じるボタン, "お気に入り登録完了モーダルの閉じるボタン").toBeVisible({ timeout: 5000 });
    await front.開いているモーダルの閉じるボタン.click();
  });
  await expected(async () => {
    expect.soft((await front.開いているモーダルの文()).length, "開いているモーダルの数（閉じて表示されなくなるはず）").toBe(0);
    expect.soft(await front.通知が出ているか(), "完了の通知が出ている（閉じているはず）").toBe(false);
  });
});

caseTest("IT-F03-08-038", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("F0308-038-P1");
  await step(1, async () => { await loginAs(front, "f0308-038-a"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => { noteResult("登録済み状態のお気に入りボタンを押した", await front.押す()); });
  await step(4, async () => {
    await expect(front.開いているモーダルの閉じるボタン, "お気に入り登録キャンセル完了モーダルの閉じるボタン").toBeVisible({ timeout: 5000 });
    await front.開いているモーダルの閉じるボタン.click();
  });
  await expected(async () => {
    expect.soft((await front.開いているモーダルの文()).length, "開いているモーダルの数（閉じて表示されなくなるはず）").toBe(0);
    expect.soft(await front.通知が出ているか(), "キャンセル完了の通知が出ている（閉じているはず）").toBe(false);
  });
});

caseTest("IT-F03-08-039", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const m = memberOf("dpf0308-039");
  const { productId } = productOf("RE-ADD-F0308-039");
  let n = -1;
  await step(1, async () => { await loginAs(front, "dpf0308-039"); });
  await step(2, async () => { await front.openDetail(productId); });
  await step(3, async () => {
    noteResult("1回目: お気に入りボタンを押した", await front.押す());
    await closeCompletion(front, "手順3");
  });
  await step(4, async () => {
    noteResult("登録済み状態のお気に入りボタンを押した", await front.押す());
    await closeCompletion(front, "手順4");
  });
  await step(5, async () => { noteResult("2回目: お気に入りボタンを押した", await front.押す()); });
  await step(6, async () => { n = お気に入り件数(m.id, productId, "JP"); });
  await expected(async () => {
    expect.soft(n, "会員A・商品RE-ADD-F0308-039・日本語のお気に入りの件数").toBe(1);
  });
});

caseTest("IT-F03-08-040", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const { productId } = productOf("CBF0308-040-P1");
  const m = memberOf("cbf0308-040");
  let names: string[] = [];
  await step(1, async () => { await front.openDetail(productId); });
  await step(2, async () => { noteResult("未ログインでお気に入りボタンを押した", await front.押す()); });
  await step(3, async () => {
    await expect(front.ログインモーダルの閉じるボタン, "ログインモーダルの閉じるボタン").toBeVisible();
    await front.ログインモーダルの閉じるボタン.click();
  });
  await step(4, async () => { await front.login(m.mail, m.password); });
  await step(5, async () => { await front.openFavoriteList(); names = await front.一覧の商品名(); });
  await expected(async () => {
    expect.soft(names, "一覧に商品CBF0308-040-P1が表示されていない").not.toContain(rc("CBF0308-040-P1"));
  });
});

// ---- 041・042 コードなし・在庫あり/なし ----

caseTest("IT-F03-08-041", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const name = rc("CBF0308-041-P1");
  let n = -1;
  await step(1, async () => { await loginAs(front, "cbf0308-041"); });
  await step(2, async () => { await front.openFavoriteList(); n = await front.一覧のカードの商品(name).count(); });
  await expected(async () => {
    expect.soft(n, "一覧に表示された商品CBF0308-041-P1の件数").toBe(1);
  });
});

caseTest("IT-F03-08-042", async ({ page, step, expected }) => {
  const front = new FrontFavorite(page);
  const name = rc("CBF0308-042-P1");
  let n = -1;
  await step(1, async () => { await loginAs(front, "cbf0308-042"); });
  await step(2, async () => { await front.openFavoriteList(); n = await front.一覧のカードの商品(name).count(); });
  await expected(async () => {
    expect.soft(n, "一覧に表示された商品CBF0308-042-P1の件数").toBe(1);
  });
});
