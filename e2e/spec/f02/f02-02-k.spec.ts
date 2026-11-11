// 取り込み注記: 同じ機能を main 側（別の方）も実装していたため、栗野側の版を別ファイルにした。main に無いケースだけを残している（main にあるケースは main を優先して除いた）。
/**
 * F02-02 本店のスマホ版ナビゲーション。正本: cases/F02-02_test_cases.tsv
 * スマートフォン表示は、iPhone の利用者エージェント・画面の大きさ・タッチの設定のブラウザで代える（F10-01 の前例）。
 * 実装していないケース: カードセットを登録するもの（002・003・006）・カテゴリを登録するもの（036〜039）・ユニサーチの試験環境へ商品を送るもの（004・005・007・008・062）。
 */
import { Page, devices, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { CaseBody, expect, caseTest } from "../../lib/case";
import { LoginPage } from "../../pages/front/f06_03_login";
import { SpNavPage, 移った先, 開閉 } from "../../pages/front/f02_02_sp_nav_k";
import { カートのブラウザたち, 会員, 会員識別子の注記 } from "../../seeds/f02-02-k";
import "../../seeds/f02-02"; // 取り込みで抜けた登録を戻す: main 側が作り方を登録している seeds を読み込む（二重定義ではない）

const { userAgent, viewport, deviceScaleFactor, isMobile, hasTouch } = devices["iPhone 13"];
test.use({ userAgent, viewport, deviceScaleFactor, isMobile, hasTouch });

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const スマホの注記 = () => note("スマートフォン表示は、iPhone の利用者エージェント・画面の大きさ・タッチの設定のブラウザで代えた");
const パス = (u: string) => { try { return new URL(u).pathname; } catch { return u; } };
const ホスト = (u: string) => { try { return new URL(u).host; } catch { return u; } };
const 末尾の斜線なし = (u: string) => u.replace(/\/+$/, "");
/** 設計書のアドレスとの照合（場所とパスだけ。末尾の「/」と、アクセス解析の受け渡しの値（?_gl=…&_ga=…）は見ない） */
const 場所とパス = (u: string) => { try { const x = new URL(u); return 末尾の斜線なし(`${x.origin}${x.pathname}`); } catch { return u; } };

/** 本店の画面のアドレス（パス） */
const 画面 = {
  ECTOP: /^\/ja\/?$/, 買取TOP: /^\/ja\/purchase\/?$/, イベントTOP: /^\/ja\/events\/?$/, 店舗一覧: /^\/ja\/.*\/store_menu\/?$/,
  デッキ検索: /^\/ja\/deck\/?$/, ヘルプ: /^\/ja\/help\/guide\/?$/, お問い合わせ: /^\/ja\/contact\/?$/, FAQ: /^\/ja\/.*\/hareruya_faq\/?$/,
  利用規約: /^\/ja\/.*\/rules\/?$/, 特商標: /^\/ja\/.*\/transaction_notation\/?$/, 会員規約: /^\/ja\/help\/agreement\/?$/,
  ログイン: /^\/ja\/mypage\/login\/?$/, マイページ: /^\/ja\/mypage\/?$/, お気に入り一覧: /^\/ja\/mypage\/favorite\/?$/, カート: /^\/ja\/cart\/?$/,
} as const;

/** 事前準備の会員でログインする（手順の「S-F02-02-MEMBER-… の会員でログインする」） */
async function ログインする(page: Page, n: string): Promise<void> {
  const l = new LoginPage(page);
  await l.ログイン画面を開く("本店");
  await l.ログインする(会員[n].メール, 会員[n].パスワード);
  if (await l.ログイン画面である()) throw new Error(`会員 ${会員[n].メール} でログインできない（${await l.認証エラー()}）`);
}

/** カートのシードが作ったブラウザの状態（クッキー）を、このケースのブラウザへ移す */
async function カートのブラウザにする(page: Page, seedId: string): Promise<void> {
  const cart = カートのブラウザたち.get(seedId);
  if (!cart) throw new Error(`${seedId} のブラウザの状態が無い`);
  await page.context().addCookies(cart.cookies);
  note(`「${seedId} のカート状態が設定されたブラウザ」は、シードがカートへ入れたブラウザのクッキーをこのケースのブラウザへ移して代えた`);
}

// ---- 会員のポイント・お気に入り ----

caseTest("IT-F02-02-015", async ({ page, step, expected }) => {
  const n = new SpNavPage(page);
  スマホの注記();
  let 見えている = false, 値 = "";
  await step(1, async () => { await ログインする(page, "015"); });
  await step(2, async () => { await n.ECTOPを開く(); });
  await step(3, async () => { 見えている = await n.見えているか(n.ポイントの数字()); 値 = await n.テキスト(n.ポイントの数字()); });
  await expected(async () => {
    note(会員識別子の注記("015"));
    expect.soft(見えている, "ポイントの数字が見えている").toBe(true);
    expect.soft(値, "ポイントの数字").toBe("500");
  });
});

caseTest("IT-F02-02-017", async ({ page, step, expected }) => {
  const n = new SpNavPage(page);
  スマホの注記();
  let r: 移った先 | undefined;
  await step(1, async () => { await ログインする(page, "017"); });
  await step(2, async () => { await n.ECTOPを開く(); });
  await step(3, async () => { r = await n.押して移った先(n.ポイントの導線(), "ポイント"); });
  await expected(async () => {
    note(会員識別子の注記("017"));
    expect.soft(パス(r!.アドレス), "移った先の画面（マイページ）").toMatch(画面.マイページ);
  });
});

/** お気に入りの商品数の表示を確かめる（011・067・068） */
function お気に入りの商品数(n: string, 期待: string | null): CaseBody {
  return async ({ page, step, expected }) => {
    const nav = new SpNavPage(page);
    スマホの注記();
    let 見えている = false, 値 = "";
    await step(1, async () => { await ログインする(page, n); });
    await step(2, async () => { await nav.ECTOPを開く(); });
    await step(3, async () => {
      見えている = await nav.見えているか(nav.お気に入りの商品数());
      if (見えている) 値 = await nav.テキスト(nav.お気に入りの商品数());
    });
    await expected(async () => {
      note(会員識別子の注記(n));
      if (期待 === null) {
        expect.soft(見えている, "お気に入りの商品数が見えていない").toBe(false);
      } else {
        expect.soft(見えている, "お気に入りの商品数が見えている").toBe(true);
        expect.soft(値, "お気に入りの商品数").toBe(期待);
      }
    });
  };
}
caseTest("IT-F02-02-011", お気に入りの商品数("011", "2"));
caseTest("IT-F02-02-067", お気に入りの商品数("067", "1"));
caseTest("IT-F02-02-068", お気に入りの商品数("068", null));

caseTest("IT-F02-02-012", async ({ page, step, expected }) => {
  const n = new SpNavPage(page);
  スマホの注記();
  let r: 移った先 | undefined;
  await step(1, async () => { await ログインする(page, "012"); });
  await step(2, async () => { await n.ECTOPを開く(); });
  await step(3, async () => { r = await n.押して移った先(n.お気に入り(), "画面下部のお気に入り"); });
  await expected(async () => {
    note(会員識別子の注記("012"));
    expect.soft(パス(r!.アドレス), "移った先の画面（お気に入り商品一覧）").toMatch(画面.お気に入り一覧);
  });
});

// ---- カート ----

function カートの商品数(n: string, 期待: string | null): CaseBody {
  return async ({ page, step, expected }) => {
    const nav = new SpNavPage(page);
    スマホの注記();
    let 見えている = false, 値 = "";
    await カートのブラウザにする(page, `S-F02-02-CART-${n}`);
    await step(1, async () => { await nav.ECTOPを開く(); });
    await step(2, async () => {
      見えている = await nav.見えているか(nav.カートの商品数());
      if (見えている) 値 = await nav.テキスト(nav.カートの商品数());
    });
    await expected(async () => {
      if (期待 === null) {
        expect.soft(見えている, "カートの商品数が見えていない").toBe(false);
      } else {
        expect.soft(見えている, "カートの商品数が見えている").toBe(true);
        expect.soft(値, "カートの商品数").toBe(期待);
      }
    });
  };
}
caseTest("IT-F02-02-009", カートの商品数("009", "2"));
caseTest("IT-F02-02-065", カートの商品数("065", "1"));
caseTest("IT-F02-02-066", カートの商品数("066", null));

caseTest("IT-F02-02-010", async ({ page, step, expected }) => {
  const n = new SpNavPage(page);
  スマホの注記();
  let r: 移った先 | undefined;
  await カートのブラウザにする(page, "S-F02-02-CART-010");
  await step(1, async () => { await n.ECTOPを開く(); });
  await step(2, async () => { r = await n.押して移った先(n.カート(), "画面下部のカート"); });
  await expected(async () => {
    expect.soft(パス(r!.アドレス), "移った先の画面（カート）").toMatch(画面.カート);
  });
});

caseTest("IT-F02-02-021", async ({ page, step, expected }) => {
  const n = new SpNavPage(page);
  スマホの注記();
  let r: 移った先 | undefined;
  await step(1, async () => { await ログインする(page, "021"); });
  await step(2, async () => { await n.ECTOPを開く(); });
  await step(3, async () => { r = await n.押して移った先(n.ログインマイページ(), "ログイン/マイページ"); });
  await expected(async () => {
    note(会員識別子の注記("021"));
    expect.soft(パス(r!.アドレス), "移った先の画面（マイページ画面）").toMatch(画面.マイページ);
  });
});

// ---- 商品一覧からの遷移（各操作で同じ画面へ） ----

type 前の操作 = "メニュー" | "デッキメニュー" | 開閉 | null;
type 操作 = { 前: 前の操作; 押す: (n: SpNavPage) => import("@playwright/test").Locator; 名前: string };
const 前の操作の名前: Record<string, string> = { メニュー: "メニュー表示ボタン", デッキメニュー: "デッキメニュー表示ボタン", サイトマップ: "サイトマップ開閉ボタン", 会社情報: "会社情報開閉ボタン", お得な情報: "お得な情報開閉ボタン" };

async function 前の操作をする(n: SpNavPage, 前: 前の操作): Promise<void> {
  if (前 === "メニュー") await n.押す(n.メニュー表示ボタン(), "メニュー表示ボタン");
  else if (前 === "デッキメニュー") await n.押す(n.デッキメニュー表示ボタン(), "デッキメニュー表示ボタン");
  else if (前) await n.押す(n.開閉ボタン(前), `${前}開閉ボタン`);
}

type 照合 = { 種類: "本店の画面"; パス: RegExp; 名前: string } | { 種類: "外部"; ホスト: string; 名前: string } | { 種類: "デッキTOP"; 名前: string };

/** 本店の商品一覧画面を開いて操作し、移った先を読む。手順1つ＝操作1つ */
function 各操作で同じ画面へ(先: 照合, ops: 操作[]): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new SpNavPage(page);
    スマホの注記();
    const rs: 移った先[] = [];
    for (let i = 0; i < ops.length; i++) {
      await step(i + 1, async () => {
        await n.商品一覧を開く();
        await 前の操作をする(n, ops[i].前);
        rs.push(await n.押して移った先(ops[i].押す(n), ops[i].名前));
      });
    }
    if (先.種類 === "デッキTOP") note("デッキTOP画面のアドレスは設計書・正本に無い。移った先が開けた（応答が400未満）ことと、デッキ検索画面（F09-01 デッキ検索TOP）ではないことで確かめた");
    if (先.種類 === "外部") note(`${先.名前}は外部のページ。新しいタブ・同じタブのどちらで開いても、開いた画面のアドレスの場所（${先.ホスト}）で確かめた`);
    await expected(async () => {
      rs.forEach((r, i) => {
        const 何 = `手順${i + 1}（${ops[i].前 ? `${前の操作の名前[ops[i].前!]}→` : ""}${ops[i].名前}）で移った先`;
        if (先.種類 === "本店の画面") {
          expect.soft(ホスト(r.アドレス), `${何}の場所（本店）`).toBe(ホスト(BASE_URL));
          expect.soft(パス(r.アドレス), `${何}（${先.名前}）`).toMatch(先.パス);
        } else if (先.種類 === "外部") {
          const u = r.アドレス.startsWith("http") ? r.アドレス : (r.要求したアドレス ?? r.アドレス);
          expect.soft(ホスト(u), `${何}（${先.名前}）の場所`).toBe(先.ホスト);
        } else {
          if (!r.新しいタブ) expect.soft(r.応答 ?? 0, `${何}の応答（400未満で開けた。0は応答なし）`).toBeLessThan(400);
          if (!r.新しいタブ) expect.soft(r.応答 ?? 0, `${何}の応答（応答があった）`).toBeGreaterThan(0);
          expect.soft(パス(r.アドレス), `${何}がデッキ検索画面ではない`).not.toMatch(画面.デッキ検索);
        }
      });
    });
  };
}

const ナビ = (名前: string): 操作 => ({ 前: null, 押す: (n) => n.ナビの項目(名前), 名前: `画面上部の${名前}` });
const メニュー = (名前: string): 操作 => ({ 前: "メニュー", 押す: (n) => n.メニューの項目(名前), 名前: `メニューの${名前}` });
const デッキ = (名前: string): 操作 => ({ 前: "デッキメニュー", 押す: (n) => n.デッキメニューの項目(名前), 名前: `デッキメニューの${名前}` });
const サイトマップ = (名前: string): 操作 => ({ 前: "サイトマップ", 押す: (n) => n.開閉の項目("サイトマップ", 名前), 名前: `サイトマップの${名前}` });

// ---- メニュー・デッキメニュー・画面下部エリアの開閉 ----

const メニューの項目 = ["ショップ", "買取", "記事", "デッキ検索", "デッキ構築", "選手一覧", "店舗一覧", "イベント", "ヘルプ", "お問い合わせ"]; // 識別ID 4-2〜4-11
const デッキメニューの項目 = ["デッキ構築", "デッキ検索"]; // 識別ID 8-2・8-3
const 開閉の項目: Record<開閉, string[]> = {
  サイトマップ: ["オンラインショップ", "買取", "記事", "選手一覧", "デッキ検索", "デッキ構築", "イベント・大会", "店舗のご案内", "お問い合わせ", "ヘルプ", "FAQ"], // 23-2〜23-12
  会社情報: ["利用規約", "スタッフ募集", "特定商取引法表示", "個人情報保護指針", "企業情報"], // 24-2〜24-6
  お得な情報: ["晴れる屋X", "晴れる屋Channel", "「イベント開催の手引き」請求フォーム"], // 25-2〜25-4
};

type 開閉の対象 = { 種類: "メニュー" | "デッキメニュー" } | { 種類: 開閉 };
function 項目のロケータ(n: SpNavPage, t: 開閉の対象, 名前: string) {
  if (t.種類 === "メニュー") return n.メニューの項目(名前);
  if (t.種類 === "デッキメニュー") return n.デッキメニューの項目(名前);
  return n.開閉の項目(t.種類, 名前);
}
function 開閉ボタン(n: SpNavPage, t: 開閉の対象) {
  if (t.種類 === "メニュー") return n.メニュー表示ボタン();
  if (t.種類 === "デッキメニュー") return n.デッキメニュー表示ボタン();
  return n.開閉ボタン(t.種類);
}

/** ECTOP を開き、（最下部までスクロールして）開閉ボタンを押す回数だけ押して、項目が見えているかを確かめる */
function 開閉して確かめる(t: 開閉の対象, 項目: string[], 押す回数: 1 | 2, スクロール: boolean): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new SpNavPage(page);
    スマホの注記();
    const v: Record<string, boolean> = {};
    const 名 = t.種類 === "メニュー" ? "メニュー表示ボタン" : t.種類 === "デッキメニュー" ? "デッキメニュー表示ボタン" : `${t.種類}開閉ボタン`;
    let s = 1;
    await step(s++, async () => { await n.ECTOPを開く(); });
    if (スクロール) await step(s++, async () => { await n.最下部までスクロールする(); });
    await step(s++, async () => { await n.押す(開閉ボタン(n, t), 名); });
    if (押す回数 === 2) await step(s++, async () => { await n.押す(開閉ボタン(n, t), `${名}（再度）`); });
    await expected(async () => {
      for (const 名前 of 項目) v[名前] = await n.見えているか(項目のロケータ(n, t, 名前));
      for (const 名前 of 項目) {
        expect.soft(v[名前], `「${名前}」が${押す回数 === 1 ? "見えている" : "見えていない"}`).toBe(押す回数 === 1);
      }
    });
  };
}

// ---- 画面下部エリアのリンク ----

type 先の照合 = { 種類: "本店の画面"; パス: RegExp; 名前: string } | { 種類: "設計書のアドレス"; アドレス: string; 新しいタブ: boolean; 名前: string };

/** ECTOP を開き、（最下部までスクロールして）開閉ボタンを押してから、項目（またはバナー）を押して移った先を確かめる */
function 下部のリンク(区画: 開閉 | null, 押す: (n: SpNavPage) => import("@playwright/test").Locator, 何: string, 先: 先の照合, スクロール: boolean, 注記?: string): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new SpNavPage(page);
    スマホの注記();
    if (注記) note(注記);
    let r: 移った先 | undefined;
    let s = 1;
    await step(s++, async () => { await n.ECTOPを開く(); });
    if (スクロール) await step(s++, async () => { await n.最下部までスクロールする(); });
    if (区画) await step(s++, async () => { await n.押す(n.開閉ボタン(区画), `${区画}開閉ボタン`); });
    await step(s++, async () => { r = await n.押して移った先(押す(n), 何); });
    await expected(async () => {
      if (先.種類 === "本店の画面") {
        expect.soft(パス(r!.アドレス), `移った先の画面（${先.名前}）`).toMatch(先.パス);
        return;
      }
      if (先.新しいタブ) {
        expect.soft(r!.新しいタブ, "新しいタブで開いた").toBe(true);
        // 開いたタブが求めたアドレスか、転送のあとのアドレスのどちらかが、正本のアドレスであること
        const 開いた = [r!.要求したアドレス ?? "", r!.アドレス];
        const hit = 開いた.some((u) => 末尾の斜線なし(u) === 末尾の斜線なし(先.アドレス));
        expect.soft(hit ? 先.アドレス : 開いた.filter(Boolean).join(" → "), `新しいタブで開いたアドレス（${先.名前}）`).toBe(先.アドレス);
        note("新しいタブのアドレスは、タブが最初に求めたアドレスと、転送のあとのアドレスのどちらかが正本のアドレスと同じかで確かめた（末尾の「/」は見ない）");
      } else {
        const 開いた = [r!.要求したアドレス ?? "", r!.アドレス];
        const hit = 開いた.some((u) => 場所とパス(u) === 場所とパス(先.アドレス));
        expect.soft(hit ? 場所とパス(先.アドレス) : 開いた.filter(Boolean).join(" → "), `移った先のアドレス（${先.名前}。場所とパス）`).toBe(場所とパス(先.アドレス));
        note(`設計書のアドレスには、アクセス解析の受け渡しの値（?_gl=…&_ga=…）が付いている。移った先は、場所とパス（${場所とパス(先.アドレス)}）で確かめた（末尾の「/」は見ない）`);
      }
    });
  };
}
const 採用 = "https://corp.hareruyamtg.com/recruit?_gl=1*1ux4xhx*_gcl_au*MTI0NDE3NTEzMy4xNzQ5NDMwNTEyLjgzNTU5NjgyNC4xNzUyMjAxODYwLjE3NTIyMDE4NjA.&_ga=2.260857677.1172469098.1753661096-601237003.1741567009";
const 企業TOP = "https://corp.hareruyamtg.com/?_gl=1*jqhpnx*_gcl_au*MTI0NDE3NTEzMy4xNzQ5NDMwNTEyLjgzNTU5NjgyNC4xNzUyMjAxODYwLjE3NTIyMDE4NjA.&_ga=2.224703322.1172469098.1753661096-601237003.1741567009";
const 会社 = (名前: string) => (n: SpNavPage) => n.開閉の項目("会社情報", 名前);
const お得 = (名前: string) => (n: SpNavPage) => n.開閉の項目("お得な情報", 名前);

/** 英語版のメニューの項目を押して、英語表示の外部のページが開くことを確かめる */
function 英語の外部ページ(押す: (n: SpNavPage) => Promise<import("@playwright/test").Locator>, 何: string): CaseBody {
  return async ({ page, step, expected }) => {
    const n = new SpNavPage(page);
    スマホの注記();
    let r: 移った先 | undefined;
    let 言語 = "";
    await step(1, async () => { await n.ECTOPを開く("en"); });
    await step(2, async () => { await n.押す(n.メニュー表示ボタン(), "メニュー表示ボタン"); });
    await step(3, async () => { r = await n.押して移った先(await 押す(n), 何); 言語 = await n.表示言語(r.画面); });
    await expected(async () => {
      note("英語表示は、開いたページの 画面の言語の指定が英語（en）で始まるかで確かめた");
      expect.soft(ホスト(r!.アドレス), "開いたページが本店の外").not.toBe(ホスト(BASE_URL));
      expect.soft(言語, `開いたページの言語の指定（${r!.アドレス}）`).toMatch(/^en/i);
    });
  };
}

// ---- 候補リストの取得先への要求（会員を識別するハッシュ値） ----

caseTest("IT-F02-02-063", async ({ page, notes, step, expected }) => {
  const n = new SpNavPage(page);
  スマホの注記();
  let rec: ReturnType<SpNavPage["候補の要求を記録する"]> | undefined;
  let 値: string[] = [];
  await step(1, async () => { await ログインする(page, "063"); });
  await step(2, async () => { await n.ECTOPを開く(); });
  await step(3, async () => { rec = n.候補の要求を記録する(); });
  await step(4, async () => {
    await n.商品検索に入れる("火");
    await expect.poll(() => rec!.要求.length, { message: "候補リストの取得先への要求が送られる", timeout: 15_000 }).toBeGreaterThan(0);
  });
  await step(5, async () => { rec!.止める(); 値 = rec!.要求.map((u) => n.会員を識別する値(u)); });
  await expected(async () => {
    note("「開発者ツールの通信記録」は、ブラウザが送った要求を試験の基盤で記録して代えた");
    note(会員識別子の注記("063"));
    const id = notes.get("〔会員レコードID-F0202-063〕");
    expect.soft(値.length, "候補リストの取得先への要求の数").toBeGreaterThan(0);
    expect.soft(値.filter((v) => v === "").length, "会員を識別する値が無い要求の数").toBe(0);
    expect.soft(値.filter((v) => v === id || v === 会員["063"].メール).length, "会員を識別する値が、会員IDやメールアドレスそのまま（ハッシュ値でない）の要求の数").toBe(0);
  });
});

caseTest("IT-F02-02-069", async ({ page, step, expected }) => {
  const n = new SpNavPage(page);
  スマホの注記();
  let rec: ReturnType<SpNavPage["候補の要求を記録する"]> | undefined;
  let 値: string[] = [];
  await step(1, async () => { await n.ECTOPを開く(); });
  await step(2, async () => { rec = n.候補の要求を記録する(); });
  await step(3, async () => {
    await n.商品検索に入れる("火");
    await expect.poll(() => rec!.要求.length, { message: "候補リストの取得先への要求が送られる", timeout: 15_000 }).toBeGreaterThan(0);
  });
  await step(4, async () => { rec!.止める(); 値 = rec!.要求.map((u) => n.会員を識別する値(u)); });
  await expected(async () => {
    note("「開発者ツールの通信記録」は、ブラウザが送った要求を試験の基盤で記録して代えた");
    note(会員識別子の注記("069"));
    expect.soft(値.length, "候補リストの取得先への要求の数（読めている）").toBeGreaterThan(0);
    expect.soft(値.filter((v) => v !== "").length, "会員を識別する値が付いた要求の数").toBe(0);
  });
});
