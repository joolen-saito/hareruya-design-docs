/**
 * F06-05 マイページの続き（-b）。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケース。
 * 正本: cases/F06-05_test_cases.tsv。シードでの解釈は seeds/f06-05-b.ts と記録 review/F06-05_progress_2026-11-11_dev.md。
 * 事前準備の会員（S-F06-05-BASIC）は共有。各ケースは新しいブラウザのセッションで会員ログイン画面からログインしてから始める。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { 会員のプレイヤー, 会員のポイント履歴 } from "../../db/f06_05_b";
import { LoginPage } from "../../pages/front/f06_03_login";
import { MypagePage, メニューの行き先, 言語を除いたパス } from "../../pages/front/f06_05_mypage";
import { 基本会員, 基本会員の姓 } from "../../seeds/f06-05-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const ECTOP = /^\/(ja\/?)?$/;

/** 事前準備の会員で、新しいブラウザのセッションの会員ログイン画面からログインする */
async function ログインして(ctx: CaseCtx): Promise<MypagePage> {
  const l = new LoginPage(ctx.page);
  await l.ログイン画面を開く();
  await l.ログインする(基本会員.メール, 基本会員.パスワード);
  expect(await l.ログイン画面である(), `事前準備の会員 ${基本会員.メール} でログインできた（実際 ${l.path()}）`).toBe(false);
  note(`ログインした会員: ${基本会員.メール}`);
  return new MypagePage(ctx.page);
}

/** マイページのメニューを押す（表示名が正本の名前と違えば、行き先が同じメニューを押して注記する） */
async function メニューを押す(m: MypagePage, 名前: string): Promise<void> {
  const x = await m.メニューを探す(名前);
  if (!x.名前どおり) supplement(`マイページに「${名前}」という表示名のメニューが無く、行き先が同じ「${x.表示名}」を押した`);
  await m.押す(x.link);
  note(`押したメニュー: 「${x.表示名}」・移った先: ${m.path}`);
}

caseTest("IT-F06-05-001", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  await step(1, async () => { await m.開く(); });
  await expected(async () => {
    expect.soft(m.path, "マイページのアドレス（戻り先へ移らない）").toMatch(/^\/ja\/mypage\/?$/);
    expect.soft(await m.マイページか(), "マイページが表示される").toBe(true);
  });
});
caseTest("IT-F06-05-005", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  let 前 = "";
  await step(1, async () => { await m.開く(); 前 = m.path; });
  await step(2, async () => {
    await expect(m.パンくず現在地, "パンくずリストの現在表示中のマイページ").toBeVisible({ timeout: 30_000 });
    await m.パンくず現在地.click({ timeout: 10_000 }).catch((e) => note(`押せなかった: ${String(e).split("\n")[0].slice(0, 80)}`));
    await m.page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(m.path, "マイページから遷移しない").toBe(前);
    expect.soft(await m.マイページか(), "マイページのまま").toBe(true);
  });
});
caseTest("IT-F06-05-006", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { await m.押す(m.パンくずホーム); });
  await expected(async () => { expect.soft(m.path, "遷移した画面（本店ECTOP）").toMatch(ECTOP); });
});
caseTest("IT-F06-05-007", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  let 名前: string[] = [];
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { 名前 = await m.メニューの名前(); note(`メニュー: ${名前.join("、")}`); });
  await expected(async () => {
    expect.soft(名前.includes("チーム情報変更"), "「チーム情報変更」のメニューが表示されない").toBe(false);
    expect.soft(名前.includes("大会デッキ登録"), "単独の「大会デッキ登録」のメニューが表示されない").toBe(false);
    expect.soft(名前.includes("マイイベント・デッキ登録"), "「マイイベント・デッキ登録」のメニューが表示される").toBe(true);
  });
});

// 008: 各メニューの先の画面の上部（共通ヘッダー）にログイン会員の姓が出ないこと
const 巡るメニュー = ["購入履歴", "入荷待ち商品一覧", "お気に入り登録商品一覧", "購入手続きへ", "ポイント履歴", "買取一覧", "オンライン本人確認",
  "マイイベント・デッキ登録", "マイデッキ", "会員情報変更", "配送先の新規登録・変更", "退会", "お問い合わせ", "お問い合わせ履歴"];
caseTest("IT-F06-05-008", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  const 姓が出た: string[] = [];
  supplement("「画面上部」は共通ヘッダーの表示で確かめた");
  await step(1, async () => { await m.開く(); });
  for (const [i, 名前] of 巡るメニュー.entries()) {
    await step(i + 2, async () => {
      await メニューを押す(m, 名前);
      const 上部 = ((await m.ヘッダー.innerText().catch(() => "")) ?? "");
      if (上部.includes(基本会員の姓)) 姓が出た.push(名前);
      if (i < 巡るメニュー.length - 1) { await m.戻る(); expect(await m.マイページか(), `ブラウザの戻るでマイページへ戻った（${名前} のあと）`).toBe(true); }
    });
  }
  await expected(async () => { expect.soft(姓が出た, `遷移した各画面の上部にログイン会員の姓「${基本会員の姓}」が表示されない`).toEqual([]); });
});
caseTest("IT-F06-05-009", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  let 名前 = "";
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { 名前 = ((await m.名前.innerText()) ?? "").trim(); note(`表示された名前: ${名前}`); });
  await expected(async () => { expect.soft(名前.startsWith(基本会員の姓), `名前(姓)としてログイン会員の姓「${基本会員の姓}」が表示される`).toBe(true); });
});
caseTest("IT-F06-05-010", async (ctx) => {
  const { step, expected, notes } = ctx;
  const m = await ログインして(ctx);
  const 番号 = notes.get("〔スマレジ側会員番号-F0605-共有-BASIC〕");
  let 表示 = "";
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { 表示 = ((await m.会員番号.innerText()) ?? "").replace(/\s+/g, " ").trim(); note(`表示された会員番号の行: ${表示}`); });
  await expected(async () => { expect.soft(表示.replace(/^会員番号\s*/, ""), "会員番号としてスマレジ側の会員番号が表示される").toBe(番号); });
});
caseTest("IT-F06-05-014", async (ctx) => {
  const { step, expected, notes } = ctx;
  const m = await ログインして(ctx);
  const 会員ID = notes.get("〔会員ID-F0605-共有-BASIC〕");
  let 前: unknown, 後: unknown;
  const 読む = () => ({ 保有ポイント: 会員のプレイヤー(会員ID)?.保有ポイント ?? null, 履歴: 会員のポイント履歴(会員ID) });
  await step(1, async () => { 前 = 読む(); note(`表示前: ${JSON.stringify(前)}`); });
  await step(2, async () => { await m.開く(); expect(await m.マイページか(), "マイページが表示された").toBe(true); });
  await step(3, async () => { 後 = 読む(); note(`表示後: ${JSON.stringify(後)}`); });
  await expected(async () => {
    expect.soft((前 as { 保有ポイント: number }).保有ポイント, "表示前の保有ポイント").toBe(500);
    expect.soft((前 as { 履歴: unknown[] }).履歴.length, "表示前のポイント履歴の件数").toBe(3);
    expect.soft(後, "マイページの表示前後で保有ポイントとポイント履歴が更新されない").toEqual(前);
  });
});
caseTest("IT-F06-05-015", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  let 描かれた = false, タイマー = "";
  await step(1, async () => { await m.開く(); });
  await step(2, async () => {
    await m.page.waitForTimeout(2_000);
    描かれた = await m.バーコードが描かれているか(); タイマー = await m.タイマーの文();
    note(`タイマーの表示: ${タイマー || "なし"}`);
  });
  await expected(async () => {
    expect.soft(描かれた, "バーコードが表示される").toBe(true);
    expect.soft(タイマー, "5分間をカウントするタイマーが表示される（4分台または5:00）").toMatch(/^0?[45]\s*[:：]\s*\d{2}/);
  });
});
async function 五分待つ(m: MypagePage): Promise<void> {
  note("タイマーが0になるまで5分10秒待った");
  await m.page.waitForTimeout(310_000);
}
caseTest("IT-F06-05-016", async (ctx) => {
  const { step, expected } = ctx;
  test.setTimeout(15 * 60_000);
  const m = await ログインして(ctx);
  let 前 = "";
  await step(1, async () => { await m.開く(); 前 = m.path; });
  await step(2, async () => { await 五分待つ(m); });
  await step(3, async () => { note(`保有ポイントの欄: ${((await m.保有ポイント.innerText().catch(() => "")) ?? "").trim()}`); });
  await expected(async () => {
    expect.soft(await m.バーコードが描かれているか(), "バーコードが消える").toBe(false);
    expect.soft(await m.再表示する.count(), "再表示リンクが表示される").toBe(1);
    expect.soft(((await m.保有ポイント.innerText().catch(() => "")) ?? "").trim().length > 0, "期限切れの案内が表示される").toBe(true);
    expect.soft(m.path, "マイページに留まる").toBe(前);
  });
});
caseTest("IT-F06-05-017", async (ctx) => {
  const { step, expected } = ctx;
  test.setTimeout(15 * 60_000);
  const m = await ログインして(ctx);
  let タイマー = "";
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { await 五分待つ(m); });
  await step(3, async () => {
    await expect(m.再表示する, "「再表示する」").toHaveCount(1, { timeout: 30_000 });
    await Promise.all([m.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }).catch(() => undefined), m.再表示する.click()]);
    await m.page.waitForTimeout(2_000);
    タイマー = await m.タイマーの文(); note(`押したあとのタイマー: ${タイマー || "なし"}`);
  });
  await expected(async () => {
    expect.soft(await m.バーコードが描かれているか(), "バーコードが再度表示される").toBe(true);
    expect.soft(タイマー, "新しい5分間のタイマーが表示される（4分台または5:00）").toMatch(/^0?[45]\s*[:：]\s*\d{2}/);
  });
});

/** マイページのメニューを押して、行き先の画面へ移ることを確かめる */
function メニューの遷移(名前: string, 画面: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { step, expected } = ctx;
    const m = await ログインして(ctx);
    await step(1, async () => { await m.開く(); });
    await step(2, async () => { await メニューを押す(m, 名前); });
    await expected(async () => { expect.soft(言語を除いたパス(m.path), `${画面}へ遷移する`).toMatch(メニューの行き先[名前]); });
  };
}
caseTest("IT-F06-05-020", メニューの遷移("購入履歴", "購入履歴画面"));
caseTest("IT-F06-05-021", メニューの遷移("入荷待ち商品一覧", "入荷待ち商品一覧画面"));
caseTest("IT-F06-05-022", メニューの遷移("お気に入り登録商品一覧", "お気に入り商品一覧画面"));
caseTest("IT-F06-05-023", メニューの遷移("購入手続きへ", "カート画面"));
caseTest("IT-F06-05-024", メニューの遷移("ポイント履歴", "ポイント履歴画面"));
caseTest("IT-F06-05-025", メニューの遷移("買取一覧", "買取一覧画面"));
caseTest("IT-F06-05-026", メニューの遷移("オンライン本人確認", "オンライン本人確認画面"));
caseTest("IT-F06-05-027", メニューの遷移("マイイベント・デッキ登録", "マイイベント・デッキ登録画面"));
caseTest("IT-F06-05-028", メニューの遷移("マイデッキ", "マイデッキ画面"));
caseTest("IT-F06-05-029", メニューの遷移("会員情報変更", "会員情報変更画面"));
caseTest("IT-F06-05-030", メニューの遷移("配送先の新規登録・変更", "配送先の新規登録・変更画面"));
caseTest("IT-F06-05-031", メニューの遷移("退会", "退会画面"));
caseTest("IT-F06-05-032", メニューの遷移("お問い合わせ", "お問い合わせ画面"));
caseTest("IT-F06-05-033", メニューの遷移("お問い合わせ履歴", "お問い合わせ履歴画面"));

caseTest("IT-F06-05-034", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { await メニューを押す(m, "ログアウト"); });
  let ログイン画面 = false;
  await expected(async () => {
    expect.soft(m.path, "ECTOP画面へ遷移する").toMatch(ECTOP);
    await m.開く();
    ログイン画面 = (await m.page.locator("form#login_mypage").count()) > 0;
    expect.soft(ログイン画面, "ログアウトしている（マイページを開くと会員ログイン画面になる）").toBe(true);
  });
});
caseTest("IT-F06-05-035", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  await step(1, async () => { await m.開く(); });
  await step(2, async () => { note(`押したボタン: 「${((await m.TOPページへ戻る.innerText()) ?? "").trim()}」`); await m.押す(m.TOPページへ戻る); });
  await expected(async () => { expect.soft(m.path, "ECTOP画面へ遷移する").toMatch(ECTOP); });
});
caseTest("IT-F06-05-041", async (ctx) => {
  const { step, expected } = ctx;
  const m = await ログインして(ctx);
  let ヘッダー = "", 状態 = 0, 本文 = "";
  await step(1, async () => { await m.トップを開く(); ヘッダー = ((await m.ヘッダーの保有ポイント.innerText().catch(() => "")) ?? "").trim(); note(`共通ヘッダーの保有ポイント: ${ヘッダー || "表示なし"}`); });
  await step(2, async () => {
    状態 = await m.URLを開く("/ja/mypage/point_in_header");
    本文 = ((await m.page.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    note(`ヘッダー用のポイント表示のURLの応答: ${状態}・画面の文の先頭「${本文.slice(0, 120)}」`);
  });
  await expected(async () => {
    expect.soft(ヘッダー.replace(/[,\s]/g, ""), "共通ヘッダーに保有ポイント500が表示される").toBe("500");
    expect.soft(状態, "ヘッダー用のポイント表示のURLが開ける").toBe(200);
    expect.soft(/(^|\D)500(\D|$)/.test(本文), "ヘッダー用のポイント表示のURLで保有ポイント500が表示される").toBe(true);
    expect.soft(await m.会員番号.count() + await m.バーコード.count(), "会員番号やバーコードなどのマイページ本体を含まない").toBe(0);
  });
});
