// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * F02-01 本店のグローバルナビ（PC版）。正本: cases/F02-01_test_cases.tsv
 * 実装しないケース（ユニサーチの外部の試験環境・DBでの準備・共有の設定・カテゴリのDBシード・カード商品）は、PMへの報告を参照。
 */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 会員のカートの商品の数量 } from "../../db/f02_01";
import { expect, caseTest, type CaseBody } from "../../lib/case";
import { Notes } from "../../lib/notes";
import { MainNavPage, 通信記録, 送信内容の指定を読む, 文字を打つ, 言語 } from "../../pages/front/f02_01_nav";
import { LoginPage } from "../../pages/front/f06_03_login";
import { カートの商品名, 会員, 支店CB078, 日本語限定商品, 日英対応商品, 試験セットA, 試験セットB } from "../../seeds/f02-01-k";
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
// 遷移の記録と確かめ
// ---------------------------------------------------------------------------

/** アドレスの「?」以降（アクセス解析の計測用の値など。設計書のアドレスは計測用の値つきで載っている）を除く */
const クエリなし = (u: string): string => u.split(/[?#]/)[0];

type 遷移 = { 名前: string; 新しいタブ: boolean; アドレス: string[]; 状態: number; 題名: string };

/** リンクを押し、移った先（同じタブならアドレス・応答・題名、新しいタブならそのタブが移ったアドレスの並び）を控える */
async function 押して遷移先を控える(n: MainNavPage, 名前: string, l0: Locator): Promise<遷移> {
  await expect(l0.first(), `「${名前}」のリンク`).toBeVisible();
  // 同じ名前の見えているリンクが複数あっても（パソコン用とスマートフォン用の並び など）、移り先が同じなら先頭を押す。移り先が違うときは止める
  const 移り先 = [...new Set(await l0.evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? "")))];
  expect(移り先.length, `「${名前}」のリンクの移り先が1つに定まる（${移り先.join(" / ")}）`).toBe(1);
  const l = l0.first();
  if ((await l.getAttribute("target")) === "_blank") {
    const r = await n.押して新しいタブのアドレスを読む(l);
    return { 名前, 新しいタブ: true, アドレス: r.アドレス, 状態: 0, 題名: "" };
  }
  const [res] = await Promise.all([n.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), l.click({ timeout: 30_000 })]);
  await n.page.waitForLoadState("load");
  return { 名前, 新しいタブ: false, アドレス: [n.page.url()], 状態: res?.status() ?? 0, 題名: (await n.page.title()).trim() };
}

/** 移る先の画面。同じタブの画面はアドレスの道筋、外のページはアドレス、アドレスの決まらない画面は題名で見分ける */
type 先 = { 画面: string } & ({ 道筋: RegExp } | { アドレス: string } | { 先頭: string } | { 題名: RegExp });
const ja = (re: string) => new RegExp(`^/ja${re}$`);
const 画面: Record<string, 先> = {
  ECTOP: { 画面: "ECTOP画面", 道筋: /^\/ja\/?$/ },
  買取TOP: { 画面: "買取TOP画面", 道筋: ja("/purchase/?") },
  記事一覧: { 画面: "記事一覧画面", 先頭: "https://article.hareruyamtg.com/" },
  デッキ検索: { 画面: "デッキ検索画面", 道筋: ja("/deck/?") },
  デッキTOP: { 画面: "デッキTOP画面", 道筋: /^(\/ja)?\/decks\/?$/ },
  イベントTOP: { 画面: "イベントTOP画面", 道筋: ja("/events/?") },
  店舗一覧: { 画面: "店舗一覧画面", 道筋: /^\/ja\/.*\/store_menu$/ },
  選手一覧: { 画面: "選手一覧画面", 先頭: "https://pros.hareruyamtg.com/" },
  ヘルプ: { 画面: "ヘルプ画面", 道筋: ja("/help/guide") },
  お問い合わせ: { 画面: "お問い合わせ画面", 道筋: ja("/contact") },
  FAQ: { 画面: "FAQ画面", 道筋: /^\/ja\/.*\/hareruya_faq$/ },
  利用規約: { 画面: "利用規約画面", 道筋: /^\/ja\/.*\/rules$/ },
  特商標: { 画面: "特商標画面", 道筋: /^\/ja\/.*\/transaction_notation$/ },
  会員規約: { 画面: "会員規約画面", 題名: /会員規約/ },
  // 設計書 F02-01 L0356・L0360 が定めるアドレス
  採用: { 画面: "設計書記載の採用ページ", アドレス: "https://corp.hareruyamtg.com/recruit?_gl=1*1ux4xhx*_gcl_au*MTI0NDE3NTEzMy4xNzQ5NDMwNTEyLjgzNTU5NjgyNC4xNzUyMjAxODYwLjE3NTIyMDE4NjA.&_ga=2.260857677.1172469098.1753661096-601237003.1741567009" },
  企業TOP: { 画面: "設計書記載の企業TOPページ", アドレス: "https://corp.hareruyamtg.com/?_gl=1*jqhpnx*_gcl_au*MTI0NDE3NTEzMy4xNzQ5NDMwNTEyLjgzNTU5NjgyNC4xNzUyMjAxODYwLjE3NTIyMDE4NjA.&_ga=2.224703322.1172469098.1753661096-601237003.1741567009" },
};
const 先の注記 = () => note("移り先の見分け方: 記事一覧画面は https://article.hareruyamtg.com/、選手一覧画面は https://pros.hareruyamtg.com/ で始まるアドレス（アプリの外のサイトで、正本・設計書にアドレスが無いため）。会員規約画面は画面の題名に「会員規約」を含むこと（アドレスが決まらないため）。採用・企業TOPは設計書 L0356・L0360 のアドレス。新しいタブで開くリンクは、そのタブが移ったアドレス（リダイレクトを含む）のどれかで見た");

function 遷移を確かめる(t: 遷移 | undefined, s: 先): void {
  const what = `「${t?.名前 ?? "?"}」を押した移り先（${s.画面}）`;
  if (!t) { expect.soft(t, `${what}: 押せていない`).toBeDefined(); return; }
  if ("道筋" in s) {
    expect.soft(t.新しいタブ, `${what}: 同じタブで移る`).toBe(false);
    expect.soft(new URL(t.アドレス[0] ?? BASE_URL).pathname, `${what}のアドレス`).toMatch(s.道筋);
    expect.soft(t.状態, `${what}の応答`).toBeLessThan(400);
  } else if ("アドレス" in s) {
    expect.soft(t.アドレス.map(クエリなし), `${what}のアドレス（アクセス解析用の「?」以降は比べない）`).toContain(クエリなし(s.アドレス));
  } else if ("先頭" in s) {
    expect.soft(t.アドレス.some((u) => u.startsWith(s.先頭)), `${what}: ${s.先頭} で始まるアドレスへ移った（${t.アドレス.join(" → ")}）`).toBe(true);
  } else {
    expect.soft(t.題名, `${what}の題名`).toMatch(s.題名);
  }
}

// ---------------------------------------------------------------------------
// 001 カードセット選択メニュー
// ---------------------------------------------------------------------------

caseTest("IT-F02-01-001", async ({ page, notes, step, expected }) => {
  const n = new MainNavPage(page);
  let 選択肢: string[] = [];
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.カードセット選択メニュー().click();
    await n.表示されている(n.カードセットの選択肢の名前(試験セットA()), "カードセットの選択肢");
    選択肢 = (await n.カードセットの選択肢().allInnerTexts()).map((t) => t.trim());
  });
  await step(3, async () => { await n.カードセットの選択肢の名前(試験セットA()).click(); });
  await expected(async () => {
    expect.soft(選択肢.filter((t) => t === 試験セットA()).length, "選択肢の「試験セットA」の数").toBe(1);
    expect.soft(選択肢.filter((t) => t === 試験セットB()).length, "選択肢の「試験セットB」の数").toBe(1);
    await expect.soft(n.選ばれたカードセット(), "選ばれたカードセット（試験セットAのカードセットID）").toHaveValue(notes.get("〔カードセットID-F0201-共有A〕"));
    await expect.soft(n.カードセットの表示(), "カードセット選択メニューの表示").toHaveText(試験セットA());
  });
});

// ---------------------------------------------------------------------------
// 002・012・043・044 リンクの移り先
// ---------------------------------------------------------------------------

caseTest("IT-F02-01-002", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const r: Record<string, 遷移> = {};
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    const 押す先: [string, () => Locator][] = [["HARERUYA", () => n.ロゴ()],
      ...["ショップ", "買取", "記事", "デッキ検索", "デッキ構築", "イベント", "店舗一覧"].map((x): [string, () => Locator] => [x, () => n.ナビのリンク(x)])];
    for (const [名前, l] of 押す先) {
      r[名前] = await 押して遷移先を控える(n, 名前, l());
      await n.ECTOPを開く("ja");
    }
  });
  await step(3, async () => { await n.フッタのロゴ().scrollIntoViewIfNeeded(); r.下 = await 押して遷移先を控える(n, "画面最下部のHARERUYA", n.フッタのロゴ()); });
  await expected(async () => {
    expect.soft(Object.keys(r).length, "押して移り先を控えたリンクの数").toBe(9);
    遷移を確かめる(r.HARERUYA, 画面.ECTOP); 遷移を確かめる(r.ショップ, 画面.ECTOP); 遷移を確かめる(r.下, 画面.ECTOP);
    遷移を確かめる(r.買取, 画面.買取TOP); 遷移を確かめる(r.記事, 画面.記事一覧); 遷移を確かめる(r.デッキ検索, 画面.デッキ検索);
    遷移を確かめる(r.デッキ構築, 画面.デッキTOP); 遷移を確かめる(r.イベント, 画面.イベントTOP); 遷移を確かめる(r.店舗一覧, 画面.店舗一覧);
  });
  先の注記();
});

caseTest("IT-F02-01-012", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const r: Record<string, 遷移> = {};
  const 名前 = ["ショップ", "買取", "記事", "デッキ検索", "デッキ構築", "選手一覧", "店舗一覧", "イベント", "ヘルプ", "お問い合わせ"];
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { await n.マウスオーバーする(n.メニュー表示アイコン()); await n.表示されている(n.メニュー(), "メニュー"); });
  await step(3, async () => {
    for (const [i, x] of 名前.entries()) {
      if (i > 0) { await n.ECTOPを開く("ja"); await n.マウスオーバーする(n.メニュー表示アイコン()); }
      await n.表示されている(n.メニュー(), "メニュー");
      r[x] = await 押して遷移先を控える(n, x, n.メニューのリンク(x));
    }
  });
  await expected(async () => {
    expect.soft(Object.keys(r).length, "押して移り先を控えたメニューの項目の数").toBe(10);
    遷移を確かめる(r.ショップ, 画面.ECTOP); 遷移を確かめる(r.買取, 画面.買取TOP); 遷移を確かめる(r.記事, 画面.記事一覧);
    遷移を確かめる(r.デッキ検索, 画面.デッキ検索); 遷移を確かめる(r.デッキ構築, 画面.デッキTOP); 遷移を確かめる(r.選手一覧, 画面.選手一覧);
    遷移を確かめる(r.店舗一覧, 画面.店舗一覧); 遷移を確かめる(r.イベント, 画面.イベントTOP); 遷移を確かめる(r.ヘルプ, 画面.ヘルプ);
    遷移を確かめる(r.お問い合わせ, 画面.お問い合わせ);
  });
  先の注記();
});

caseTest("IT-F02-01-043", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const r: Record<string, 遷移> = {};
  const 名前 = ["オンラインショップ", "買取", "記事", "選手一覧", "デッキ検索", "デッキ構築", "イベント・大会", "店舗のご案内", "お問い合わせ", "ヘルプ", "FAQ"];
  await step(1, async () => { await n.ECTOPを開く("ja"); await n.フッタの欄まで移動する("サイトマップ"); });
  await step(2, async () => {
    for (const [i, x] of 名前.entries()) {
      if (i > 0 && !r[名前[i - 1]].新しいタブ) { await n.ECTOPを開く("ja"); await n.フッタの欄まで移動する("サイトマップ"); }
      r[x] = await 押して遷移先を控える(n, x, n.フッタの欄のリンク("サイトマップ", x));
    }
  });
  await expected(async () => {
    expect.soft(Object.keys(r).length, "押して移り先を控えたサイトマップのリンクの数").toBe(11);
    遷移を確かめる(r.オンラインショップ, 画面.ECTOP); 遷移を確かめる(r.買取, 画面.買取TOP); 遷移を確かめる(r.記事, 画面.記事一覧);
    遷移を確かめる(r.選手一覧, 画面.選手一覧); 遷移を確かめる(r.デッキ検索, 画面.デッキ検索); 遷移を確かめる(r.デッキ構築, 画面.デッキTOP);
    遷移を確かめる(r["イベント・大会"], 画面.イベントTOP); 遷移を確かめる(r.店舗のご案内, 画面.店舗一覧); 遷移を確かめる(r.お問い合わせ, 画面.お問い合わせ);
    遷移を確かめる(r.ヘルプ, 画面.ヘルプ); 遷移を確かめる(r.FAQ, 画面.FAQ);
  });
  先の注記();
});

caseTest("IT-F02-01-044", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const r: Record<string, 遷移> = {};
  const 名前 = ["利用規約", "スタッフ募集", "特定商取引法表示", "個人情報保護指針", "企業情報"];
  await step(1, async () => { await n.ECTOPを開く("ja"); await n.フッタの欄まで移動する("会社情報"); });
  await step(2, async () => {
    for (const [i, x] of 名前.entries()) {
      if (i > 0 && !r[名前[i - 1]].新しいタブ) { await n.ECTOPを開く("ja"); await n.フッタの欄まで移動する("会社情報"); }
      r[x] = await 押して遷移先を控える(n, x, n.フッタの欄のリンク("会社情報", x));
    }
  });
  await expected(async () => {
    expect.soft(Object.keys(r).length, "押して移り先を控えた会社情報のリンクの数").toBe(5);
    遷移を確かめる(r.利用規約, 画面.利用規約); 遷移を確かめる(r.スタッフ募集, 画面.採用); 遷移を確かめる(r.特定商取引法表示, 画面.特商標);
    遷移を確かめる(r.個人情報保護指針, 画面.会員規約); 遷移を確かめる(r.企業情報, 画面.企業TOP);
  });
  先の注記();
});

// ---------------------------------------------------------------------------
// 003・004・011 グローバルナビとメニューの表示
// ---------------------------------------------------------------------------

function 表示言語ごとの項目(言語: 言語, 出る: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    let ナビの買取 = 0;
    const m = { 表示: false, 買取: 0, デッキ構築: 0 };
    await step(1, async () => { await n.ECTOPを開く(言語); });
    await step(2, async () => { await n.表示されている(n.グローバルナビ(), "グローバルナビ"); ナビの買取 = await n.ナビのリンク先("/purchase").filter({ visible: true }).count(); });
    await step(3, async () => {
      await n.マウスオーバーする(n.メニュー表示アイコン());
      m.表示 = await n.見えている(n.メニュー());
      m.買取 = await n.メニューのリンク先("/purchase").filter({ visible: true }).count();
      m.デッキ構築 = await n.メニューのリンク先("/decks").filter({ visible: true }).count();
    });
    await expected(async () => {
      expect.soft(m.表示, "マウスオーバーで表示されたメニュー").toBe(true);
      if (出る) {
        expect.soft(ナビの買取, "グローバルナビの買取の数").toBeGreaterThan(0);
        expect.soft(m.買取, "メニューの買取の数").toBeGreaterThan(0);
        expect.soft(m.デッキ構築, "メニューのデッキ構築の数").toBeGreaterThan(0);
      } else {
        expect.soft(ナビの買取, "グローバルナビの買取の数（表示されない）").toBe(0);
        expect.soft(m.買取, "メニューの買取の数（表示されない）").toBe(0);
        expect.soft(m.デッキ構築, "メニューのデッキ構築の数（表示されない）").toBe(0);
      }
    });
    note("買取・デッキ構築の項目は、表示言語によらず、移り先のアドレス（買取TOP・デッキTOP）を持つ見えているリンクで数えた");
  };
}
caseTest("IT-F02-01-003", 表示言語ごとの項目("ja", true));
caseTest("IT-F02-01-004", 表示言語ごとの項目("en", false));

caseTest("IT-F02-01-011", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const r = { 中: false, 中の項目: 0, 外: true };
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => {
    await n.マウスオーバーする(n.メニュー表示アイコン());
    r.中 = await n.見えている(n.メニュー());
    r.中の項目 = await n.メニューの項目().filter({ visible: true }).count();
  });
  await step(3, async () => { await n.マウスを外す(); r.外 = await n.見えている(n.メニュー()); });
  await expected(async () => {
    expect.soft(r.中, "マウスオーバー中のメニュー（表示される）").toBe(true);
    expect.soft(r.中の項目, "マウスオーバー中に見えているメニューの項目の数（識別ID 1-2〜1-11 の10項目）").toBe(10);
    expect.soft(r.外, "マウスポインタを外したあとのメニュー（非表示）").toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 005・006・008・009 日英切替
// ---------------------------------------------------------------------------

function 日英切替(開く: (n: MainNavPage, notes: Notes) => Promise<void>, 先: (notes: Notes) => { 画面: string; 道筋: RegExp }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const n = new MainNavPage(page);
    await step(1, async () => { await 開く(n, notes); });
    await step(2, async () => { await n.押して遷移する(n.日英切替()); });
    await expected(async () => {
      const s = 先(notes);
      expect.soft(n.path(), `移った先（${s.画面}）のアドレス`).toMatch(s.道筋);
    });
  };
}
caseTest("IT-F02-01-005", 日英切替((n) => n.ECTOPを開く("ja"), () => ({ 画面: "英語版ECTOP画面", 道筋: /^\/en\/?$/ })));
caseTest("IT-F02-01-006", 日英切替((n) => n.ECTOPを開く("en"), () => ({ 画面: "日本語版ECTOP画面", 道筋: /^\/ja\/?$/ })));
caseTest("IT-F02-01-008", 日英切替(
  async (n, notes) => { await n.開く(`/ja/products/detail/${notes.get("〔商品ID-F0201-共有A〕")}`); await n.表示されている(n.page.getByText(日本語限定商品()).first(), "日本語限定商品の商品詳細"); },
  () => ({ 画面: "英語版ECTOP画面", 道筋: /^\/en\/?$/ })));
caseTest("IT-F02-01-009", 日英切替(
  async (n, notes) => { await n.開く(`/ja/products/detail/${notes.get("〔商品ID-F0201-共有B〕")}`); await n.表示されている(n.page.getByText(日英対応商品()).first(), "日英対応商品の商品詳細"); },
  (notes) => ({ 画面: "日英対応商品の英語版商品詳細画面", 道筋: new RegExp(`^/en/products/detail/${notes.get("〔商品ID-F0201-共有B〕")}$`) })));

// ---------------------------------------------------------------------------
// 014 詳細検索
// ---------------------------------------------------------------------------

caseTest("IT-F02-01-014", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { await n.詳細検索ボタン().click(); await page.waitForTimeout(1000); });
  await expected(async () => {
    await expect.soft(n.詳細検索モーダル(), "詳細検索モーダル").toHaveClass(/is-visible/);
    await expect.soft(n.詳細検索モーダル(), "詳細検索モーダル（見えている）").toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 016〜022・067〜069・080 ポイント・ログイン・マイページ・お気に入り
// ---------------------------------------------------------------------------

function ポイントの表示(番号: string, 値: string): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    await ログインしておく(page, 番号);
    const v: string[] = [];
    await step(1, async () => { await n.ECTOPを開く("ja"); });
    await step(2, async () => { for (const t of await n.ポイントの数字().allInnerTexts()) v.push(t.replace(/\s+/g, " ").trim()); });
    await expected(async () => {
      expect.soft(v.length, "ポイント欄の数（非表示にならない）").toBeGreaterThan(0);
      expect.soft(v, `ポイント欄の数字（すべて${値}）`).toEqual(v.map(() => 値));
    });
  };
}

caseTest("IT-F02-01-017", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { await n.表示されている(n.ログインの導線(), "未ログインのヘッダ（ログインの導線）"); });
  await expected(async () => {
    await expect.soft(n.ポイントの数字(), "ポイントの表示（表示されない）").toHaveCount(0);
    await expect.soft(n.ポイントの導線(), "ポイントの導線（表示されない）").toHaveCount(0);
  });
});

/** ヘッダの導線を押して移る先のアドレスを確かめる */
function 導線の移り先(番号: string | null, 導線: (n: MainNavPage) => Locator, 先: { 画面: string; 道筋: RegExp }): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    if (番号) await ログインしておく(page, 番号);
    await step(1, async () => { await n.ECTOPを開く("ja"); });
    await step(2, async () => { await n.押して遷移する(導線(n)); });
    await expected(async () => { expect.soft(n.path(), `移った先（${先.画面}）のアドレス`).toMatch(先.道筋); });
  };
}
caseTest("IT-F02-01-019", 導線の移り先(null, (n) => n.ログインの導線(), { 画面: "ログイン画面", 道筋: /^\/ja\/mypage\/login$/ }));

function お気に入りの件数(番号: string, 件数: string | null): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    await ログインしておく(page, 番号);
    let アイコン = false, 件数の表示 = false, 件数の文字 = "";
    await step(1, async () => { await n.ECTOPを開く("ja"); });
    await step(2, async () => {
      アイコン = await n.見えている(n.お気に入りアイコン());
      件数の表示 = (await n.お気に入りの件数().count()) > 0 && await n.見えている(n.お気に入りの件数().first());
      if (件数の表示) 件数の文字 = await n.テキスト(n.お気に入りの件数().first());
    });
    await expected(async () => {
      expect.soft(アイコン, "お気に入りアイコン（表示される）").toBe(true);
      if (件数 === null) expect.soft(件数の表示, "お気に入り登録済み商品数（表示されない）").toBe(false);
      else {
        expect.soft(件数の表示, "お気に入り登録済み商品数（表示される）").toBe(true);
        expect.soft(件数の文字, "お気に入り登録済み商品数").toBe(件数);
      }
    });
  };
}

caseTest("IT-F02-01-080", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  await step(1, async () => { await n.ECTOPを開く("ja"); await n.表示されている(n.ログインの導線(), "未ログインのヘッダ（ログインの導線）"); });
  await step(2, async () => { await n.お気に入りの導線().click(); await page.waitForTimeout(1500); });
  await expected(async () => {
    await expect.soft(n.ログインを促すモーダル(), "ログインまたは会員登録を促すモーダル").toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// カート
// ---------------------------------------------------------------------------

const 数字 = (s: string) => (s.match(/\d[\d,]*/)?.[0] ?? "").replace(/,/g, "");

function カートの点数(番号: string, 点数: string): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    await ログインしておく(page, 番号);
    let バッジ = "", 合計 = "";
    await step(1, async () => { await n.ECTOPを開く("ja"); });
    await step(2, async () => { if (await n.カートの商品数().count()) バッジ = await n.テキスト(n.カートの商品数().first()); });
    await step(3, async () => { await n.マウスオーバーする(n.カート()); 合計 = await n.テキスト(n.カートの合計点数()); });
    await expected(async () => {
      expect.soft(バッジ, "カートの商品数").toBe(点数);
      expect.soft(数字(合計), `カート内の合計の点数（表示「${合計}」）`).toBe(点数);
    });
  };
}

function カートの商品数が出ない(番号: string, 遮断する: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    await ログインしておく(page, 番号);
    let 遮断した = 0;
    const s0 = 遮断する ? 1 : 0;
    if (遮断する) {
      await step(1, async () => {
        await page.route((u) => u.pathname.endsWith("/block/cart"), (r) => { 遮断した++; return r.abort(); });
      });
    }
    await step(s0 + 1, async () => { await n.ECTOPを開く("ja"); });
    let 数 = -1;
    await step(s0 + 2, async () => { await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined); await n.表示されている(n.カート(), "ヘッダのカート"); 数 = await n.カートの商品数().count(); });
    await expected(async () => {
      expect.soft(数, "ヘッダのカートの商品数の表示の数（表示されない）").toBe(0);
    });
    if (遮断する) note(`カート内商品数の取得先（/block/cart）への要求は、ブラウザの要求の遮断で止めた（止めた要求 ${遮断した} 件）`);
  };
}

/** 数量操作のケース。操作を押したあと、DBでカートの明細の数量を読む */
function カートの数量操作(番号: string, 商品名: string, 操作: "削除" | "マイナス" | "プラス", 期待: number[]): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    await ログインしておく(page, 番号);
    const 名 = カートの商品名(商品名);
    let 状態 = 0;
    let 数量: number[] = [];
    await step(1, async () => { await n.ECTOPを開く("ja"); });
    await step(2, async () => { await n.マウスオーバーする(n.カート()); await n.表示されている(n.カートの商品の行(名), `カートの「${名}」`); });
    await step(3, async () => {
      const 行 = n.カートの商品の行(名);
      const b = 操作 === "削除" ? n.行の削除(行) : 操作 === "マイナス" ? n.行のマイナス(行) : n.行のプラス(行);
      状態 = await n.カートの操作を押す(b);
    });
    await step(4, async () => { 数量 = 会員のカートの商品の数量(会員[番号]().メール, 名); });
    await expected(async () => {
      expect.soft(状態, "数量操作の要求の応答").toBeLessThan(400);
      expect.soft(数量, `カートの「${名}」の明細の数量（明細ごと。削除なら明細が無い）`).toEqual(期待);
    });
  };
}

function 押せない(番号: string, 商品名: string, 操作: "マイナス" | "プラス", 商品数: string): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    await ログインしておく(page, 番号);
    const 名 = カートの商品名(商品名);
    let 行: Locator = page.locator("x");
    await step(1, async () => { await n.ECTOPを開く("ja"); });
    await step(2, async () => { await n.マウスオーバーする(n.カート()); 行 = n.カートの商品の行(名); await n.表示されている(行, `カートの「${名}」`); });
    await step(3, async () => { await expect(n.行の商品数(行), `「${名}」の商品数`).toHaveValue(商品数); });
    await expected(async () => {
      const b = 操作 === "マイナス" ? n.行のマイナス(行) : n.行のプラス(行);
      await expect.soft(b, `「${名}」の${操作}（1つ）`).toHaveCount(1);
      await expect.soft(b, `「${名}」の${操作}（押せない）`).toBeDisabled();
    });
  };
}

// ---------------------------------------------------------------------------
// 061〜066 新しいタブで開くバナー・リンク
// ---------------------------------------------------------------------------

function 新しいタブで開く(移動先: "静的コンテンツ" | "お得な情報", 押す: (n: MainNavPage) => Locator, 名前: string, アドレス: string): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new MainNavPage(page);
    let r: { アドレス: string[]; 最後: string } = { アドレス: [], 最後: "" };
    let 元 = "";
    await step(1, async () => { await n.ECTOPを開く("ja"); });
    await step(2, async () => {
      if (移動先 === "お得な情報") await n.フッタの欄まで移動する("お得な情報");
      else await page.locator("footer .p-hareruya-footer__banners").scrollIntoViewIfNeeded().catch(() => undefined);
      await n.表示されている(押す(n), 名前);
    });
    await step(3, async () => { r = await n.押して新しいタブのアドレスを読む(押す(n)); 元 = page.url(); });
    await expected(async () => {
      expect.soft(new URL(元).pathname, "元のタブの画面（ECTOP画面のまま）").toMatch(/^\/ja\/?$/);
      expect.soft(r.アドレス.map(クエリなし), `新しいタブで開いたアドレス（${r.アドレス.join(" → ")}。アクセス解析用の「?」以降は比べない）`).toContain(クエリなし(アドレス));
    });
    note("新しいタブは、そのタブが移ったアドレス（リダイレクトを含む）のどれかが正本のアドレスと一致するかで見た。外のサイトの中身は確かめない");
  };
}
caseTest("IT-F02-01-061", 新しいタブで開く("静的コンテンツ", (n) => n.フッタのバナー("晴れる屋で働こう!"), "晴れる屋で働こう!の画像",
  "https://corp.hareruyamtg.com/recruit?_gl=1*1ux4xhx*_gcl_au*MTI0NDE3NTEzMy4xNzQ5NDMwNTEyLjgzNTU5NjgyNC4xNzUyMjAxODYwLjE3NTIyMDE4NjA.&_ga=2.260857677.1172469098.1753661096-601237003.1741567009"));
caseTest("IT-F02-01-062", 新しいタブで開く("静的コンテンツ", (n) => n.フッタのバナー("HARERUYA2"), "HARERUYA2バナー", "https://www.hareruya2.com/"));
caseTest("IT-F02-01-063", 新しいタブで開く("静的コンテンツ", (n) => n.フッタのバナー("HARERUYA3"), "HARERUYA3バナー", "https://www.hareruya3.com/"));
caseTest("IT-F02-01-064", 新しいタブで開く("お得な情報", (n) => n.フッタの欄のリンク("お得な情報", "晴れる屋X"), "晴れる屋X", "https://x.com/hareruya_mtg"));
caseTest("IT-F02-01-065", 新しいタブで開く("お得な情報", (n) => n.フッタの欄のリンク("お得な情報", "晴れる屋Channel"), "晴れる屋Channel", "https://www.youtube.com/channel/UC1l7GtlvAmCOXRlxjImbWvw"));
caseTest("IT-F02-01-066", 新しいタブで開く("お得な情報", (n) => n.フッタの欄のリンク("お得な情報", "「イベント開催の手引き」請求フォーム"), "「イベント開催の手引き」請求フォーム",
  "https://docs.google.com/forms/d/e/1FAIpQLSfadm2WyMncxBYUMmujbvD9mCKyJLolR5ITH-v8BKjhERTuhg/viewform"));

// ---------------------------------------------------------------------------
// 076〜079 候補リストの取得先への要求
// ---------------------------------------------------------------------------

const 検索語 = "検索商品";
const 要求の注記 = (rec: 通信記録, p: [string, string][] | null) => note(
  `候補リストの取得先（商品名サジェストの取得先）への要求のうち、「${検索語}」を入力し終えたあとの最後の要求の送信内容: ${p ? p.map(([k, v]) => `${k}=${v}`).join(" / ") : "（要求が無い）"}`
  + `。参考: 同じ間の商品の検索の要求 ${rec.検索の要求.length} 件${rec.検索の要求.length ? `（最後: ${new URL(rec.検索の要求[rec.検索の要求.length - 1]).search}）` : ""}`);

caseTest("IT-F02-01-076", async ({ page, notes, step, expected }) => {
  const n = new MainNavPage(page);
  const rec = new 通信記録(page);
  let p: [string, string][] | null = null;
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { rec.開始する(); });
  await step(3, async () => {
    await n.カードセット選択メニュー().click();
    await n.カードセットの選択肢の名前(試験セットA()).click();
    await expect(n.選ばれたカードセット(), "カードセットの指定あり").toHaveValue(notes.get("〔カードセットID-F0201-共有A〕"));
  });
  await step(4, async () => { await 文字を打つ(n.商品検索テキストボックス(), 検索語); });
  await step(5, async () => { rec.止める(); p = rec.入力し終えたあとの要求(検索語); });
  await expected(async () => {
    expect.soft(p, "「検索商品」を入力し終えたあとの、候補リストの取得先への要求").not.toBeNull();
    const s = 送信内容の指定を読む(p ?? []);
    expect.soft(s.カードセット, "要求のカードセットの指定（カードセット名「試験セットA」）").toBe(試験セットA());
  });
  要求の注記(rec, p);
});

caseTest("IT-F02-01-077", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const rec = new 通信記録(page);
  let p: [string, string][] | null = null;
  await step(1, async () => { await n.ECTOPを開く("ja"); });
  await step(2, async () => { rec.開始する(); });
  await step(3, async () => { await expect(n.選ばれたカードセット(), "カードセット未選択").toHaveValue(""); });
  await step(4, async () => { await 文字を打つ(n.商品検索テキストボックス(), 検索語); });
  await step(5, async () => { rec.止める(); p = rec.入力し終えたあとの要求(検索語); });
  await expected(async () => {
    expect.soft(p, "「検索商品」を入力し終えたあとの、候補リストの取得先への要求").not.toBeNull();
    const s = 送信内容の指定を読む(p ?? []);
    expect.soft(s.カードセット, "要求のカードセットの指定（含まれない）").toBeNull();
    expect.soft((p ?? []).some(([, v]) => v === 試験セットA() || v === 試験セットB()), "要求の値にカードセット名が含まれない").toBe(false);
  });
  要求の注記(rec, p);
});

caseTest("IT-F02-01-078", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const rec = new 通信記録(page);
  let p: [string, string][] | null = null;
  await step(1, async () => { await n.開く(`/ja/${支店CB078.支店URL}/`); await n.表示されている(n.商品検索テキストボックス(), "支店ECTOPの商品検索テキストボックス"); });
  await step(2, async () => { rec.開始する(); });
  await step(3, async () => { await 文字を打つ(n.商品検索テキストボックス(), 検索語); });
  await step(4, async () => { rec.止める(); p = rec.入力し終えたあとの要求(検索語); });
  await expected(async () => {
    expect.soft(p, "「検索商品」を入力し終えたあとの、候補リストの取得先への要求").not.toBeNull();
    const s = 送信内容の指定を読む(p ?? []);
    expect.soft(s.支店表示フラグ, "要求の支店表示フラグの指定（含まれる）").not.toBeNull();
    expect.soft(s.カードセット, "要求のカードセットの指定（含まれない）").toBeNull();
  });
  要求の注記(rec, p);
});

caseTest("IT-F02-01-079", async ({ page, step, expected }) => {
  const n = new MainNavPage(page);
  const rec = new 通信記録(page);
  let p: [string, string][] | null = null;
  await step(1, async () => { await n.開く("/ja/purchase"); await n.表示されている(n.商品検索テキストボックス(), "ネット買取トップページの商品検索テキストボックス"); });
  await step(2, async () => { rec.開始する(); });
  await step(3, async () => { await 文字を打つ(n.商品検索テキストボックス(), 検索語); });
  await step(4, async () => { rec.止める(); p = rec.入力し終えたあとの要求(検索語); });
  await expected(async () => {
    expect.soft(p, "「検索商品」を入力し終えたあとの、候補リストの取得先への要求").not.toBeNull();
    const s = 送信内容の指定を読む(p ?? []);
    expect.soft(s.買取価格, "要求の買取価格の指定（1円以上＝1~*）").toBe("1~*");
    expect.soft(s.カード状態, "要求のカード状態の指定（NM＝1）").toBe("1");
    expect.soft(s.高額商品コード, "要求の高額商品コードの指定（なし＝-*）").toBe("-*");
    expect.soft(s.予約商品, "要求の予約商品の指定（予約商品でない＝0）").toBe("0");
    expect.soft(s.カードセット, "要求のカードセットの指定（含まれない）").toBeNull();
  });
  要求の注記(rec, p);
  note("指定の値の読み方は、アプリの商品の検索の要求の作り（買取価格 1~*・カード状態 1・高額商品コード -*・予約商品 0）に合わせた");
});
