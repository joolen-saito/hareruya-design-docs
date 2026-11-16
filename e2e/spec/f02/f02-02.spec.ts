/**
 * F02-02 本店のスマホ版ナビゲーション。正本: cases/F02-02_test_cases.tsv
 * 2026-11-12 に 004〜008・036〜039・062 を足した（商品は検索サービスの索引に載せて作る。062 の表示用HTMLは印つきのカードセットに DB で設定）。
 * そのほかの実装しないケースは記録 review/F02-02_progress_2026-11-10_dev.md。
 * スマートフォン表示は、画面 390×844・スマホの端末の印（isMobile・hasTouch・iPhone の UserAgent）のブラウザで開く（seeds/f02-02.ts の スマホ）。
 * 外部のサイトへのリンクは、新しいタブで開いた先のアドレスを確かめる（外部のサイトの中身は確かめない）。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseBody, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { SpNavPage, 行き先, アドレスの本体, 言語 } from "../../pages/front/f02_02_sp_nav";
import { カードセット名, スマホ } from "../../seeds/f02-02";

test.use({ ...スマホ });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 行き先の文 = (r: 行き先) => `${r.新しいタブ ? "新しいタブ" : "同じタブ"}: ${r.url}（リンク先 ${r.リンク先}）`;

const ECTOP = { ja: "/ja/", en: "/en/" } as const;
const 買取TOP = "/ja/purchase";
const デッキ検索 = "/ja/deck/";
const デッキTOP = "/decks";
const イベントTOP = "/ja/events";
const 店舗一覧 = "/ja/user_data/store_menu";
const ヘルプ = "/ja/help/guide";
const お問い合わせ = "/ja/contact";
const FAQ = "/ja/user_data/hareruya_faq";
const 利用規約 = "/ja/user_data/rules";
const 特商標 = "/ja/user_data/transaction_notation";
const 記事のサイト = "https://article.hareruyamtg.com";
const 選手一覧のサイト = "https://pros.hareruyamtg.com";
/** 設計書（0302 スマホ版ナビゲーション 20・24-3・24-6）のURL。設計書のURLの「?_gl=…&_ga=…」は計測の受け渡しの値で、比べるのは問い合わせの前まで */
const 採用ページ = "https://corp.hareruyamtg.com/recruit";
const 企業TOP = "https://corp.hareruyamtg.com/";
const 計測の値の注記 = "設計書のURLの「?_gl=…&_ga=…」は計測サービスの受け渡しの値（開くたびに変わる）なので、問い合わせの部分を除いたアドレス（末尾の / はそろえる）で比べた";

const nav = (ctx: CaseCtx) => new SpNavPage(ctx.page);

// ---- ナビの表示 ----
caseTest("IT-F02-02-001", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await expect(n.下部のナビ(), "下部固定のナビ").toBeVisible(); });
  await ctx.expected(async () => {
    await expect.soft(n.カードセット選択メニュー(), "カードセット選択メニュー").toBeVisible();
    await expect.soft(n.詳細検索アイコン(), "詳細検索アイコン").toBeVisible();
    await expect.soft(n.お気に入り(), "お気に入りアイコン").toBeVisible();
  });
});

caseTest("IT-F02-02-002", async (ctx) => {
  const n = nav(ctx);
  let names: string[] = [];
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await n.押す(n.カードセット選択メニュー(), "カードセット選択メニュー"); names = await n.選択肢に出ているカードセット(); });
  await ctx.expected(async () => {
    for (const k of ["A", "B"]) {
      const 名前 = カードセット名(`テストセット${k}-002-F0202`);
      expect.soft(names.includes(名前), `選択肢に「${名前}」がある`).toBe(true);
      await expect.soft(n.カードセットの選択肢の(名前), `「${名前}」を選べる（表示されている）`).toBeVisible();
    }
  });
});

caseTest("IT-F02-02-003", async (ctx) => {
  const n = nav(ctx);
  const A = カードセット名("テストセットA-003-F0202"), B = カードセット名("テストセットB-003-F0202");
  const 選ぶ = async (名前: string) => {
    await n.押す(n.カードセット選択メニュー(), "カードセット選択メニュー");
    await n.押す(n.カードセットの選択肢の(名前), `カードセット「${名前}」`);
  };
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await 選ぶ(A); });
  await ctx.step(3, async () => { await 選ぶ(B); });
  await ctx.expected(async () => {
    expect.soft((await n.カードセットの選択中の名前().innerText()).trim(), "カードセット選択メニューの選択中の表示").toBe(B);
    expect.soft(await n.カードセットの選択中の値().inputValue(), "選択中のカードセット（テストセットBのカードセットID だけ）").toBe(ctx.notes.get("〔カードセットID-F0202-003B〕"));
  });
});

caseTest("IT-F02-02-013", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.トップを開く(); });
  let 開いた = false;
  await ctx.step(2, async () => {
    await n.押す(n.お気に入り(), "お気に入り");
    for (let i = 0; i < 20 && !開いた; i++) { 開いた = await n.モーダルが開いているか(n.お気に入りのログインモーダル()); if (!開いた) await ctx.page.waitForTimeout(500); }
  });
  await ctx.expected(async () => {
    expect.soft(開いた, "ログインまたは会員登録を促すモーダルが開いている").toBe(true);
    await expect.soft(n.お気に入りのログインモーダル(), "ログインまたは会員登録を促すモーダル").toBeVisible();
    expect.soft(n.path(), "画面は本店ECTOPのまま").toBe(ECTOP.ja);
  });
});

caseTest("IT-F02-02-014", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await n.押す(n.詳細検索アイコン(), "詳細検索アイコン"); });
  await ctx.expected(async () => {
    await expect.soft(n.詳細検索モーダル(), "詳細検索モーダル").toBeVisible({ timeout: 10_000 });
  });
});

function 日英切替(元: 言語, 先: 言語) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    let r!: 行き先;
    await ctx.step(1, async () => { await n.トップを開く(元); });
    await ctx.step(2, async () => { r = await n.押して行き先を読む(n.日英切替(), "日英切替"); note(行き先の文(r)); });
    await ctx.expected(async () => {
      expect.soft(r.path, `${先 === "en" ? "英語版" : "日本語版"}サイト（/${先}/ 配下）へ遷移した`).toMatch(new RegExp(`^/${先}(/|$)`));
    });
  };
}
caseTest("IT-F02-02-018", 日英切替("ja", "en"));
caseTest("IT-F02-02-019", 日英切替("en", "ja"));

caseTest("IT-F02-02-020", async (ctx) => {
  const n = nav(ctx);
  let r!: 行き先;
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { r = await n.押して行き先を読む(n.ログインマイページ(), "ログイン/マイページ"); });
  await ctx.expected(async () => {
    expect.soft(r.path, "ログイン画面へ遷移した").toBe("/ja/mypage/login");
    await expect.soft(ctx.page.locator("form#login_mypage"), "ログインの入力欄").toBeVisible();
  });
});

// ---- 商品一覧から、ナビ・メニュー・フッタで各画面へ ----
type 押し方 = { 何: string; 押す: (n: SpNavPage) => Promise<行き先> };
const ヘッダ = (名前: string): 押し方 => ({ 何: `ヘッダの${名前}`, 押す: (n) => n.押して行き先を読む(n.ヘッダのリンク(名前), `ヘッダの${名前}`) });
const メニュー = (名前: string): 押し方 => ({ 何: `メニューの${名前}`, 押す: async (n) => { await n.押す(n.メニュー表示ボタン(), "メニュー表示ボタン"); return n.押して行き先を読む(n.メニューの項目(名前), `メニューの${名前}`); } });
const デッキメニュー = (名前: string): 押し方 => ({ 何: `デッキメニューの${名前}`, 押す: async (n) => { await n.押す(n.デッキメニュー表示ボタン(), "デッキメニュー表示ボタン"); return n.押して行き先を読む(n.デッキメニューの項目(名前), `デッキメニューの${名前}`); } });
const サイトマップ = (名前: string): 押し方 => ({ 何: `サイトマップの${名前}`, 押す: async (n) => { await n.最下部までスクロールする(); await n.押す(n.開閉ボタン("サイトマップ"), "サイトマップ開閉ボタン"); return n.押して行き先を読む(n.フッタの項目("サイトマップ", 名前), `サイトマップの${名前}`); } });
const 上部のロゴ: 押し方 = { 何: "画面上部のHARERUYA", 押す: (n) => n.押して行き先を読む(n.上部のロゴ(), "画面上部のHARERUYA") };
const 最下部のロゴ: 押し方 = { 何: "画面最下部のHARERUYA", 押す: async (n) => { await n.最下部までスクロールする(); return n.押して行き先を読む(n.最下部のロゴ(), "画面最下部のHARERUYA"); } };

/** 商品一覧を開いて押す、を手順の数だけ繰り返し、どれも同じ画面へ移ることを確かめる */
function 各操作で(説明: string, 押し方: 押し方[], 合う: (r: 行き先) => boolean, 期待の文: string, 注記?: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    const 結果: { 何: string; r: 行き先 }[] = [];
    if (注記) note(注記);
    for (let i = 0; i < 押し方.length; i++) {
      await ctx.step(i + 1, async () => {
        await n.商品一覧を開く();
        const r = await 押し方[i].押す(n);
        結果.push({ 何: 押し方[i].何, r });
        note(`手順${i + 1}（${押し方[i].何}）→ ${行き先の文(r)}`);
      });
    }
    await ctx.expected(async () => {
      for (const { 何, r } of 結果) expect.soft(合う(r) ? "合う" : `${r.url}`, `${何}を押して${説明}へ遷移した（${期待の文}）`).toBe("合う");
    });
  };
}
const 同じタブの = (path: string) => (r: 行き先) => !r.新しいタブ && r.path === path;
const 外部サイトの = (origin: string) => (r: 行き先) => r.url.startsWith(origin);

caseTest("IT-F02-02-022", 各操作で("ECTOP画面", [上部のロゴ, ヘッダ("ショップ"), メニュー("ショップ"), 最下部のロゴ, サイトマップ("オンラインショップ")], 同じタブの(ECTOP.ja), ECTOP.ja));
caseTest("IT-F02-02-023", 各操作で("買取TOP画面", [ヘッダ("買取"), メニュー("買取"), サイトマップ("買取")], 同じタブの(買取TOP), 買取TOP));
caseTest("IT-F02-02-024", 各操作で("記事一覧画面", [ヘッダ("記事"), メニュー("記事"), サイトマップ("記事")], 外部サイトの(記事のサイト), `${記事のサイト} の記事のサイト`,
  "記事一覧画面は、アプリのリンク先の外部の記事のサイトとして確かめた（リンクは新しいタブで開く。外部のサイトの中身は確かめない）"));
caseTest("IT-F02-02-025", 各操作で("イベントTOP画面", [ヘッダ("イベント"), メニュー("イベント"), サイトマップ("イベント・大会")], 同じタブの(イベントTOP), イベントTOP));
caseTest("IT-F02-02-026", 各操作で("店舗一覧画面", [ヘッダ("店舗一覧"), メニュー("店舗一覧"), サイトマップ("店舗のご案内")], 同じタブの(店舗一覧), 店舗一覧));
caseTest("IT-F02-02-029", 各操作で("デッキ検索画面", [メニュー("デッキ検索"), デッキメニュー("デッキ検索"), サイトマップ("デッキ検索")], 同じタブの(デッキ検索), デッキ検索));
caseTest("IT-F02-02-030", 各操作で("デッキTOP画面", [メニュー("デッキ構築"), デッキメニュー("デッキ構築"), サイトマップ("デッキ構築")], 同じタブの(デッキTOP), デッキTOP));
caseTest("IT-F02-02-031", 各操作で("選手一覧画面", [メニュー("選手一覧"), サイトマップ("選手一覧")], 外部サイトの(選手一覧のサイト), `${選手一覧のサイト} の選手一覧のサイト`,
  "選手一覧画面は、アプリのリンク先の外部の選手一覧のサイトとして確かめた（リンクは新しいタブで開く。外部のサイトの中身は確かめない）"));
caseTest("IT-F02-02-032", 各操作で("ヘルプ画面", [メニュー("ヘルプ"), サイトマップ("ヘルプ")], 同じタブの(ヘルプ), ヘルプ));
caseTest("IT-F02-02-033", 各操作で("お問い合わせ画面", [メニュー("お問い合わせ"), サイトマップ("お問い合わせ")], 同じタブの(お問い合わせ), お問い合わせ));

// ---- メニュー・デッキメニュー・フッタの開閉 ----
const メニューの項目名 = ["ショップ", "買取", "記事", "デッキ検索", "デッキ構築", "選手一覧", "店舗一覧", "イベント", "ヘルプ", "お問い合わせ"]; // 設計書 4-2〜4-11
const デッキの項目名 = ["デッキ構築", "デッキ検索"]; // 8-2・8-3
const サイトマップの項目名 = ["オンラインショップ", "買取", "記事", "選手一覧", "デッキ検索", "デッキ構築", "イベント・大会", "店舗のご案内", "お問い合わせ", "ヘルプ", "FAQ"]; // 23-2〜23-12
const 会社情報の項目名 = ["利用規約", "スタッフ募集", "特定商取引法表示", "個人情報保護指針", "企業情報"]; // 24-2〜24-6
const お得な情報の項目名 = ["晴れる屋X", "晴れる屋Channel", "「イベント開催の手引き」請求フォーム"]; // 25-2〜25-4

function 開閉(欄: "メニュー" | "デッキメニュー" | "サイトマップ" | "会社情報" | "お得な情報", 押す回数: 1 | 2, 最下部へ: boolean) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    const 項目 = { メニュー: メニューの項目名, デッキメニュー: デッキの項目名, サイトマップ: サイトマップの項目名, 会社情報: 会社情報の項目名, お得な情報: お得な情報の項目名 }[欄];
    const 要素 = (名前: string) => 欄 === "メニュー" ? n.メニューの項目(名前) : 欄 === "デッキメニュー" ? n.デッキメニューの項目(名前) : n.フッタの項目(欄, 名前);
    const ボタン = () => 欄 === "メニュー" ? n.メニュー表示ボタン() : 欄 === "デッキメニュー" ? n.デッキメニュー表示ボタン() : n.開閉ボタン(欄);
    const ボタン名 = 欄 === "メニュー" ? "メニュー表示ボタン" : 欄 === "デッキメニュー" ? "デッキメニュー表示ボタン" : `${欄}開閉ボタン`;
    const フッタ = 欄 === "サイトマップ" || 欄 === "会社情報" || 欄 === "お得な情報";
    let s = 1;
    await ctx.step(s++, async () => { await n.トップを開く(); });
    if (最下部へ) await ctx.step(s++, async () => { await n.最下部までスクロールする(); });
    await ctx.step(s++, async () => { await n.押す(ボタン(), ボタン名); await ctx.page.waitForTimeout(800); });
    if (押す回数 === 2) {
      await ctx.step(s++, async () => {
        for (const 名前 of 項目) {
          if (フッタ) expect(await n.欄の中で見えているか(欄, 名前), `1回目に押したあと「${名前}」が表示されている（2回目を押す前の状態）`).toBe(true);
          else await expect(要素(名前), `1回目に押したあと「${名前}」が表示されている（2回目を押す前の状態）`).toBeVisible({ timeout: 10_000 });
        }
        await n.押す(ボタン(), ボタン名); await ctx.page.waitForTimeout(800);
      });
    }
    await ctx.expected(async () => {
      for (const 名前 of 項目) {
        if (フッタ) expect.soft(await n.欄の中で見えているか(欄, 名前), 押す回数 === 1 ? `「${名前}」が表示される（欄の見えている範囲の中）` : `「${名前}」が非表示になる（欄の見えている範囲の外）`).toBe(押す回数 === 1);
        else if (押す回数 === 1) await expect.soft(要素(名前), `「${名前}」が表示される`).toBeVisible({ timeout: 10_000 });
        else await expect.soft(要素(名前), `「${名前}」が非表示になる`).toBeHidden({ timeout: 10_000 });
      }
    });
  };
}
caseTest("IT-F02-02-027", 開閉("メニュー", 1, false));
caseTest("IT-F02-02-028", 開閉("メニュー", 2, false));
caseTest("IT-F02-02-034", 開閉("デッキメニュー", 1, false));
caseTest("IT-F02-02-035", 開閉("デッキメニュー", 2, false));
caseTest("IT-F02-02-040", 開閉("サイトマップ", 1, true));
caseTest("IT-F02-02-041", 開閉("サイトマップ", 2, true));
caseTest("IT-F02-02-043", 開閉("会社情報", 1, true));
caseTest("IT-F02-02-044", 開閉("会社情報", 2, true));
caseTest("IT-F02-02-050", 開閉("お得な情報", 1, true));
caseTest("IT-F02-02-051", 開閉("お得な情報", 2, true));

// ---- フッタの開閉欄から各画面へ ----
function フッタから(欄: "サイトマップ" | "会社情報" | "お得な情報", 項目: string, 最下部へ: boolean, 合う: (r: 行き先) => boolean, 期待の文: string, 新しいタブ?: boolean, 注記?: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    let r!: 行き先;
    if (注記) supplement(注記);
    let s = 1;
    await ctx.step(s++, async () => { await n.トップを開く(); });
    if (最下部へ) await ctx.step(s++, async () => { await n.最下部までスクロールする(); });
    await ctx.step(s++, async () => { await n.押す(n.開閉ボタン(欄), `${欄}開閉ボタン`); await ctx.page.waitForTimeout(800); });
    await ctx.step(s++, async () => { r = await n.押して行き先を読む(n.フッタの項目(欄, 項目), 項目); note(行き先の文(r)); });
    await ctx.expected(async () => {
      expect.soft(合う(r) ? "合う" : r.url, `「${項目}」を押して開いた先（${期待の文}）`).toBe("合う");
      if (新しいタブ) expect.soft(r.新しいタブ, "新しいタブで開いた").toBe(true);
    });
  };
}
const アドレスが = (want: string) => (r: 行き先) => アドレスの本体(r.url) === アドレスの本体(want);

caseTest("IT-F02-02-042", フッタから("サイトマップ", "FAQ", true, 同じタブの(FAQ), FAQ));
caseTest("IT-F02-02-045", フッタから("会社情報", "利用規約", false, 同じタブの(利用規約), 利用規約));
caseTest("IT-F02-02-046", フッタから("会社情報", "スタッフ募集", false, アドレスが(採用ページ), 採用ページ, false, 計測の値の注記));
caseTest("IT-F02-02-047", フッタから("会社情報", "特定商取引法表示", false, 同じタブの(特商標), 特商標));
caseTest("IT-F02-02-049", フッタから("会社情報", "企業情報", false, アドレスが(企業TOP), 企業TOP, false, 計測の値の注記));
caseTest("IT-F02-02-052", フッタから("お得な情報", "晴れる屋X", false, アドレスが("https://x.com/hareruya_mtg"), "https://x.com/hareruya_mtg", true));
/** リンク先が正本のアドレスで、開いた先がその同じページか、YouTube がスマホ向け（m.youtube.com）へ転送した同じページ */
const YouTubeの = (want: string) => (r: 行き先) => アドレスの本体(r.リンク先) === アドレスの本体(want)
  && (アドレスの本体(r.url) === アドレスの本体(want) || アドレスの本体(r.url.replace("://m.youtube.com/", "://www.youtube.com/")) === アドレスの本体(want));
caseTest("IT-F02-02-053", フッタから("お得な情報", "晴れる屋Channel", false, YouTubeの("https://www.youtube.com/channel/UC1l7GtlvAmCOXRlxjImbWvw"), "https://www.youtube.com/channel/UC1l7GtlvAmCOXRlxjImbWvw", true,
  "リンク先は正本のアドレス。新しいタブで開いた直後に YouTube 側がスマホの端末の印を見てスマホ向け（m.youtube.com）の同じチャンネルへ転送するので、転送先が同じチャンネルなら開いたとみなした"));
caseTest("IT-F02-02-054", フッタから("お得な情報", "「イベント開催の手引き」請求フォーム", false,
  アドレスが("https://docs.google.com/forms/d/e/1FAIpQLSfadm2WyMncxBYUMmujbvD9mCKyJLolR5ITH-v8BKjhERTuhg/viewform"),
  "https://docs.google.com/forms/d/e/1FAIpQLSfadm2WyMncxBYUMmujbvD9mCKyJLolR5ITH-v8BKjhERTuhg/viewform", true,
  "開いた先のアドレスは、転送されたあとのアドレスの問い合わせの部分（?usp=… など）を除いて比べた"));

// 048: 個人情報保護指針 → 会員規約画面。会員規約画面のアドレスは正本・設計書に無いので、開いた画面の見出しで確かめる
caseTest("IT-F02-02-048", async (ctx) => {
  const n = nav(ctx);
  let r!: 行き先; let 見出し = "";
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await n.押す(n.開閉ボタン("会社情報"), "会社情報開閉ボタン"); await ctx.page.waitForTimeout(800); });
  await ctx.step(3, async () => {
    r = await n.押して行き先を読む(n.フッタの項目("会社情報", "個人情報保護指針"), "個人情報保護指針");
    見出し = ((await ctx.page.locator("main h1, .l-hareruya-main h1, h1:not(.p-hareruya-header__logo)").first().innerText().catch(() => "")) ?? "").trim();
    note(`${行き先の文(r)}・画面の見出し「${見出し}」`);
  });
  await ctx.expected(async () => {
    expect.soft(!r.新しいタブ, "同じタブで移った").toBe(true);
    expect.soft(見出し, "会員規約画面へ遷移した（画面の見出し）").toContain("会員規約");
  });
});

// ---- バナー ----
function バナーから(何: string, 取る: (n: SpNavPage) => ReturnType<SpNavPage["働こうの画像"]>, want: string, 注記?: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    let r!: 行き先;
    if (注記) supplement(注記);
    await ctx.step(1, async () => { await n.トップを開く(); });
    await ctx.step(2, async () => { await n.最下部までスクロールする(); });
    await ctx.step(3, async () => { r = await n.押して行き先を読む(取る(n), 何); note(行き先の文(r)); });
    await ctx.expected(async () => {
      expect.soft(r.新しいタブ, "新しいタブで開いた").toBe(true);
      expect.soft(アドレスの本体(r.url), `開いた先のアドレス（${want}）`).toBe(アドレスの本体(want));
    });
  };
}
caseTest("IT-F02-02-055", バナーから("晴れる屋で働こう!の画像", (n) => n.働こうの画像(), 採用ページ, 計測の値の注記));
caseTest("IT-F02-02-056", バナーから("HARERUYA2バナー", (n) => n.バナー("hareruya2"), "https://www.hareruya2.com/"));
caseTest("IT-F02-02-057", バナーから("HARERUYA3バナー", (n) => n.バナー("hareruya3"), "https://www.hareruya3.com/"));

// ---- 英語版 ----
caseTest("IT-F02-02-059", async (ctx) => {
  const n = nav(ctx);
  let 見える: string[] = [];
  await ctx.step(1, async () => { await n.トップを開く("en"); });
  await ctx.step(2, async () => {
    note("メニューの項目を確かめるため、メニュー表示ボタンを押してメニューを開いた");
    await n.押す(n.メニュー表示ボタン(), "メニュー表示ボタン");
    await ctx.page.waitForTimeout(800);
    // メニューが開いていないと「買取・デッキ構築の導線が表示されない」は確かめにならないため、開いたことを確かめてから読む
    await expect(n.メニューの欄(), "メニュー表示ボタンで開いたメニュー").toBeVisible();
    見える = await ctx.page.locator("header a:visible, header button:visible, nav.p-hareruya-bottom-nav a:visible").evaluateAll((els) =>
      els.map((e) => `${(e.textContent ?? "").replace(/\s+/g, " ").trim()} ${(e as HTMLAnchorElement).getAttribute("href") ?? ""}`));
    note(`表示されているナビ・メニューの項目: ${見える.join(" / ")}`);
  });
  await ctx.expected(async () => {
    expect.soft(見える.filter((t) => /\/purchase(\/|$|\?)/.test(t)), "買取の導線（買取TOPへのリンク）が表示されない").toEqual([]);
    expect.soft(見える.filter((t) => /(^|\s)\/decks(\/|$|\?)|Deck Builder/.test(t)), "デッキ構築の導線が表示されない").toEqual([]);
  });
});

function 英語の外部(項目名: string, 何: string, origin: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    const n = nav(ctx);
    let r!: 行き先;
    await ctx.step(1, async () => { await n.トップを開く("en"); });
    await ctx.step(2, async () => { await n.押す(n.メニュー表示ボタン(), "メニュー表示ボタン"); });
    await ctx.step(3, async () => { r = await n.押して行き先を読む(n.メニューの項目(項目名), `メニューの${項目名}`); note(行き先の文(r)); });
    await ctx.expected(async () => {
      expect.soft(r.url.startsWith(origin) ? "合う" : r.url, `${何}のサイト（${origin}）が開いた`).toBe("合う");
      expect.soft(/[?&]lang=en(&|$)|\/en(\/|$)/.test(r.url) ? "英語" : r.url, `英語表示の${何}（開いた先のアドレスが英語の指定を持つ）`).toBe("英語");
    });
  };
}
caseTest("IT-F02-02-060", 英語の外部("Article", "外部の記事ページ", 記事のサイト));
caseTest("IT-F02-02-061", 英語の外部("Sponsored Player", "外部の選手一覧ページ", 選手一覧のサイト));

// ---- 未ログインのナビの表示 ----
caseTest("IT-F02-02-070", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await expect(n.下部のナビ(), "下部固定のナビ").toBeVisible(); });
  await ctx.expected(async () => {
    expect.soft(await n.ポイント().count(), "ポイントが表示されない（ポイントの欄が無い）").toBe(0);
    expect.soft((await n.ログインマイページ().innerText()).replace(/\s+/g, " ").trim(), "ログイン/マイページの表示").toBe("ログイン");
    expect.soft(await n.お気に入りの商品数().count(), "お気に入りに商品数が表示されない").toBe(0);
  });
});

// =====================================================================================
// 004〜008・036〜039・062（2026-11-12 追加）。商品は検索サービスの索引に載せて作る（seeds/f02-02.ts）
// =====================================================================================

/** 商品一覧の商品カードの商品名（見えているもの）。読み込みが済んだ（カードが1件以上出た、または0件の表示が出た）あとで読む */
async function 一覧の商品名(n: SpNavPage): Promise<string[]> {
  await n.page.waitForLoadState("load");
  await n.商品カードたち().first().waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
  return (await n.商品カードたち().evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim())));
}

caseTest("IT-F02-02-004", async (ctx) => {
  const n = nav(ctx);
  const A = カードセット名("テストセットA-004-F0202");
  const 火 = rc("火の試験カード-004"), 別 = rc("火の別セットカード-004"), 水 = rc("水の試験カード-004");
  let names: string[] = [];
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => {
    await n.押す(n.カードセット選択メニュー(), "カードセット選択メニュー");
    await n.押す(n.カードセットの選択肢の(A), `カードセット「${A}」`);
  });
  await ctx.step(3, async () => { await n.検索欄に入れる("火"); });
  await ctx.step(4, async () => {
    await n.検索を押す();
    names = await 一覧の商品名(n);
    note(`移った先 ${n.page.url()}／商品カード ${names.length} 件: ${names.slice(0, 10).join(" ／ ")}`);
  });
  await ctx.expected(async () => {
    const u = new URL(n.page.url());
    expect.soft(u.searchParams.get("cardset"), "絞り込みのカードセット（テストセットA のカードセットID）").toBe(ctx.notes.get("〔カードセットID-F0202-004A〕"));
    expect.soft(u.searchParams.get("product"), "絞り込みのキーワード").toBe("火");
    expect.soft(names.filter((t) => t.includes(火)).length, `「${火}」が表示される`).toBe(1);
    expect.soft(names.length, "商品一覧に表示される商品は「火の試験カード-004」だけ（件数）").toBe(1);
    expect.soft(names.some((t) => t.includes(別) || t.includes(水)), "別セットの「火」の商品・カードセットAの「水」の商品は表示されない").toBe(false);
  });
});

caseTest("IT-F02-02-005", async (ctx) => {
  const n = nav(ctx);
  const 名 = rc("火の試験カード-005");
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await n.検索欄に入れる(名); });
  await ctx.step(3, async () => { await n.検索を押す(); note(`移った先 ${n.page.url()}`); });
  await ctx.step(4, async () => { await expect(n.商品検索テキストボックス(), "遷移後のスマホ版ナビの商品検索テキストボックス").toBeVisible(); });
  await ctx.expected(async () => {
    expect.soft(n.path(), "商品一覧画面へ遷移した").toMatch(/\/ja\/products\/search\/?$/);
    await expect.soft(n.商品検索テキストボックス(), "商品検索テキストボックスに入力したキーワードが表示されている").toHaveValue(名);
  });
});

/** 006・007: 候補リストの取得先（/products/search/unisuggest_api）だけを通信遮断する */
async function 候補の取得を止める(ctx: CaseCtx): Promise<{ 止めた: () => number }> {
  let k = 0;
  await ctx.page.route(/\/products\/search\/unisuggest_api(\?|$)/, async (route) => { k++; await route.abort("failed"); });
  note("通信遮断の対象は、商品検索の候補リストの取得先（/products/search/unisuggest_api）だけにした。通常の商品検索（/products/search）は通す");
  return { 止めた: () => k };
}

caseTest("IT-F02-02-006", async (ctx) => {
  const n = nav(ctx);
  const 遮断 = await 候補の取得を止める(ctx);
  let 見えた = true;
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await n.検索欄に入れる(rc("火の試験カード-006")); });
  await ctx.step(3, async () => {
    for (let i = 0; i < 20 && 遮断.止めた() === 0; i++) await ctx.page.waitForTimeout(250);
    await ctx.page.waitForTimeout(1500);
    見えた = await n.候補リストが見えているか();
    note(`候補リストの取得要求を ${遮断.止めた()} 回遮断した（取得要求は失敗で完了）`);
  });
  await ctx.expected(async () => {
    expect.soft(遮断.止めた(), `候補リストの取得要求が送られた（遮断した回数 ${遮断.止めた()} 回）`).toBeGreaterThan(0);
    expect.soft(!見えた, "商品検索の候補リストが表示されない").toBe(true);
    expect.soft((await n.候補の文()).length, "候補リストの項目の数").toBe(0);
  });
});

caseTest("IT-F02-02-007", async (ctx) => {
  const n = nav(ctx);
  const 遮断 = await 候補の取得を止める(ctx);
  const 名 = rc("火の試験カード-007");
  let names: string[] = [];
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => { await n.検索欄に入れる(名); });
  await ctx.step(3, async () => { await n.検索を押す(); names = await 一覧の商品名(n); note(`候補の取得要求を ${遮断.止めた()} 回遮断した／移った先 ${n.page.url()}／商品カード ${names.length} 件`); });
  await ctx.expected(async () => {
    expect.soft(遮断.止めた(), "候補リストの取得要求が送られて遮断された（回数）").toBeGreaterThan(0);
    expect.soft(n.path(), "商品一覧画面へ遷移した").toMatch(/\/ja\/products\/search\/?$/);
    expect.soft(new URL(n.page.url()).searchParams.get("product"), "入力したキーワードで絞り込まれた").toBe(名);
    expect.soft(names.filter((t) => t.includes(名)).length, `「${名}」が表示される`).toBeGreaterThan(0);
  });
});

caseTest("IT-F02-02-008", async (ctx) => {
  const n = nav(ctx);
  const 名 = rc("火の試験カード-008");
  let 候補: string[] = [];
  await ctx.step(1, async () => { await n.トップを開く(); await n.検索欄に入れる("火"); });
  await ctx.step(2, async () => {
    for (let i = 0; i < 20 && !候補.some((t) => t.includes(名)); i++) { await ctx.page.waitForTimeout(500); 候補 = await n.候補の文(); }
    note(`候補リストの項目（${候補.length}件）: ${候補.join(" / ")}`);
  });
  await ctx.expected(async () => {
    expect.soft(await n.候補リストが見えているか(), "候補リストが表示されている").toBe(true);
    expect.soft(候補.some((t) => t.includes(名)), `候補リストの商品名サジェストに「${名}」が表示される`).toBe(true);
  });
});

// ---- 036〜039 カテゴリアイコン ----

async function カテゴリを開く(ctx: CaseCtx, n: SpNavPage): Promise<void> {
  await n.押す(n.カテゴリアイコン(), "カテゴリアイコン");
  for (let i = 0; i < 20 && !(await n.カテゴリモーダルが開いているか()); i++) await ctx.page.waitForTimeout(250);
}

caseTest("IT-F02-02-036", async (ctx) => {
  const n = nav(ctx);
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => {
    await カテゴリを開く(ctx, n);
    await n.カテゴリの第一階層の項目().first().waitFor({ state: "visible", timeout: 30_000 }).catch(() => undefined);
  });
  await ctx.expected(async () => {
    expect.soft(await n.カテゴリモーダルが開いているか(), "カテゴリのモーダルが開いている").toBe(true);
    await expect.soft(n.カテゴリモーダル(), "カテゴリのモーダル").toBeVisible();
    expect.soft(await n.カテゴリの第一階層の項目().count(), "モーダルにカテゴリ第一階層の項目が表示されている（数）").toBeGreaterThan(0);
  });
});

/** 037〜039: 開いたことを確かめてから閉じる */
function 閉じるケース(閉じ方: "アイコン" | "閉じるボタン" | "枠外"): CaseBody {
  return async (ctx) => {
    const n = nav(ctx);
    let 開いた = false;
    await ctx.step(1, async () => { await n.トップを開く(); });
    await ctx.step(2, async () => {
      await カテゴリを開く(ctx, n);
      開いた = await n.カテゴリモーダルが開いているか();
      expect(開いた, "カテゴリのモーダルが開いた").toBe(true);
    });
    await ctx.step(3, async () => {
      if (閉じ方 === "アイコン") await n.押す(n.カテゴリアイコン(), "開いているモーダルのカテゴリアイコン");
      else if (閉じ方 === "閉じるボタン") await n.押す(n.カテゴリモーダルの閉じるボタン(), "カテゴリモーダルの閉じるボタン");
      else {
        const box = await n.カテゴリモーダル().boundingBox();
        const vp = ctx.page.viewportSize()!;
        // モーダルの中身の外側（画面の端）を押す
        const x = 3, y = Math.min(vp.height - 3, (box?.y ?? 0) + (box?.height ?? vp.height) - 3);
        note(`枠外として、画面の座標 (${x}, ${Math.round(y)}) を押した（モーダルの範囲 ${box ? `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}×${Math.round(box.height)}` : "読めない"}）`);
        await ctx.page.mouse.click(x, y);
      }
      await ctx.page.waitForTimeout(800);
    });
    await ctx.expected(async () => {
      expect.soft(開いた, "閉じる前にモーダルが開いていた").toBe(true);
      expect.soft(!(await n.カテゴリモーダルが開いているか()), "カテゴリのモーダルが閉じている").toBe(true);
    });
  };
}
caseTest("IT-F02-02-037", 閉じるケース("アイコン"));
caseTest("IT-F02-02-038", 閉じるケース("閉じるボタン"));
caseTest("IT-F02-02-039", 閉じるケース("枠外"));

caseTest("IT-F02-02-062", async (ctx) => {
  const n = nav(ctx);
  const セット = カードセット名("連携試験セット001");
  const 名 = rc("連携商品001");
  let names: string[] = [];
  await ctx.step(1, async () => { await n.トップを開く(); });
  await ctx.step(2, async () => {
    await n.押す(n.カードセット選択メニュー(), "カードセット選択メニュー");
    await n.押す(n.カードセットの選択肢の(セット), `カードセット「${セット}」`);
  });
  await ctx.step(3, async () => { await n.検索欄に入れる(名); });
  await ctx.step(4, async () => { await n.検索を押す(); names = await 一覧の商品名(n); });
  await ctx.step(5, async () => { note(`移った先 ${n.page.url()}／商品カード ${names.length} 件`); });
  await ctx.expected(async () => {
    const banner = ctx.page.getByText("LINK-BANNER-001F0202n062");
    expect.soft(names.some((t) => t.includes(名)), `商品一覧に「${名}」が表示されている（絞り込みの結果が出た）`).toBe(true);
    await expect.soft(banner.first(), "カードセットの表示用HTML「LINK-BANNER-001F0202n062」が表示されている").toBeVisible();
    const b = await banner.first().boundingBox().catch(() => null);
    const c = await n.商品カードたち().first().boundingBox().catch(() => null);
    expect.soft(!!b && !!c && b.y < c.y, `表示用HTMLが商品一覧より上にある（表示用HTML ${b ? Math.round(b.y) : "なし"}・先頭の商品 ${c ? Math.round(c.y) : "なし"}）`).toBe(true);
  });
});
