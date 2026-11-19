/**
 * B16-09 サイトマップ生成処理（フロントのサイトマップの XML）。正本: cases/B16-09_test_cases.tsv
 * 2026-11-20 は、サイトマップを読むだけで確かめられるケースを書いた。どのケースも、データを作らない。
 * 実装したケースと解釈は、記録 review/B16-09_progress_2026-11-20_dev.md にある。
 *
 * - サイトマップの XML は、ブラウザでアドレスを開いて読む。エビデンスの画面には XML が写る。
 * - 転送（恒久的な転送）の応答と転送先、HEAD の応答は、ブラウザの表示では読めない。そのため、同じアドレスへ HTTP の要求を送って読む。
 *   転送はたどらず、最初の応答を見る（手順の注記に残す）。
 * - 「ページを開き、アドレスを控える」は、試験用サイトのヘッダのリンク先と同じアドレスを開いて、開いたあとのアドレスを控える。
 *   開いた先は、デッキ検索＝/deck/、イベント情報＝/events、商品検索＝/products/search、カードリスト購入＝/deck/bulk。
 *   カードリスト購入は、画面の見出しが「カードリストで購入」のページ。
 */
import { Page, test } from "@playwright/test";
import { ADMIN_ROUTE, BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import "../../seeds/b16-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

type サイトマップ = { ステータス: number; 種類: string; 本文: string; 掲載: string[] };

/** サイトマップのアドレスをブラウザで開き、掲載の URL（loc）を上から順に読む */
async function サイトマップを開く(page: Page, パス: string): Promise<サイトマップ> {
  const url = `${BASE_URL}${パス}`;
  const res = await page.goto(url, { timeout: 120_000 });
  if (!res) throw new Error(`${パス} の応答が無い`);
  const 本文 = await res.text();
  const 掲載 = [...本文.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const 種類 = res.headers()["content-type"] ?? "";
  note(`開いたアドレス: ${new URL(url).pathname}・応答: HTTP ${res.status()}・応答の種類: ${種類}・掲載 ${掲載.length}件`);
  return { ステータス: res.status(), 種類, 本文, 掲載 };
}

/** 試験用サイトのページを開き、開いたあとのアドレスを控える */
async function ページを開いて控える(page: Page, パス: string, 名前: string): Promise<string> {
  await page.goto(`${BASE_URL}${パス}`, { timeout: 120_000 });
  const u = page.url();
  note(`${名前}を開き、アドレス ${new URL(u).pathname}${new URL(u).search} を控えた`);
  return u;
}

/** アドレスを比べる形にそろえる（末尾の / と、ホストの大文字小文字の違いだけをならす） */
const そろえる = (u: string): string => { const x = new URL(u); return `${x.protocol}//${x.host.toLowerCase()}${x.pathname.replace(/\/+$/, "")}${x.search}`; };
const 掲載の数 = (s: サイトマップ, アドレス: string): number => s.掲載.filter((l) => そろえる(l) === そろえる(アドレス)).length;

/** 転送をたどらずに、最初の応答のステータスと転送先を読む */
async function 転送を読む(ctx: CaseCtx, パス: string): Promise<{ ステータス: number; 転送先: string }> {
  const res = await ctx.page.request.get(`${BASE_URL}${パス}`, { maxRedirects: 0, timeout: 120_000 });
  const 転送先 = res.headers()["location"] ?? "";
  note(`アドレス ${パス} へ要求を送り、転送をたどらずに最初の応答を読んだ（ブラウザの表示では転送の応答を読めないため）。応答: HTTP ${res.status()}・転送先: ${転送先 || "（無し）"}`);
  return { ステータス: res.status(), 転送先 };
}

// ── 003 トップページが、ページのサイトマップに1件ある ──
caseTest("IT-B16-09-003", async (ctx) => {
  let top = ""; let s!: サイトマップ;
  await ctx.step(1, async () => { top = await ページを開いて控える(ctx.page, "/ja/", "トップページ（日本語表示）"); });
  await ctx.step(2, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); });
  await ctx.step(3, async () => { note(`控えたトップページのアドレスの掲載: ${掲載の数(s, top)}件`); });
  await ctx.expected(async () => {
    expect.soft(掲載の数(s, top), "控えたトップページのアドレスの掲載の数").toBe(1);
  });
});

// ── 005 管理画面の入口のパスを含む掲載が無い ──
caseTest("IT-B16-09-005", async (ctx) => {
  let 入口 = ""; let s!: サイトマップ;
  await ctx.step(1, async () => {
    await ctx.page.goto(`${BASE_URL}/${ADMIN_ROUTE}/login`, { timeout: 120_000 });
    入口 = new URL(ctx.page.url()).pathname.split("/").filter(Boolean)[0] ?? "";
    note(`管理画面のログイン画面を開き、ドメインの直後の部分「/${入口}」を管理画面の入口のパスとして控えた`);
    if (!入口) throw new Error("管理画面の入口のパスを控えられない");
  });
  await ctx.step(2, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); });
  let 含む: string[] = [];
  await ctx.step(3, async () => {
    含む = s.掲載.filter((l) => { const p = new URL(l).pathname; return p.includes(`/${入口}/`) || p.endsWith(`/${入口}`); });
    note(`管理画面の入口のパス「/${入口}」を含む掲載: ${含む.length}件${含む.length ? `（${含む.slice(0, 5).join("・")}）` : ""}`);
  });
  await ctx.expected(async () => {
    expect.soft(s.掲載.length > 0, "ページのサイトマップに掲載がある（以下の確かめの前提）").toBe(true);
    expect.soft(含む.length, "管理画面の入口のパスを含む掲載の数").toBe(0);
  });
});

// ── 006〜009 除くページ（日本語・英語）が、ページのサイトマップに無い ──
function 除くページ(名前: string, パス: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    let ja = ""; let en = ""; let sj!: サイトマップ; let se!: サイトマップ;
    await ctx.step(1, async () => { ja = await ページを開いて控える(ctx.page, `/ja${パス}`, `${名前}（日本語表示）`); });
    await ctx.step(2, async () => { en = await ページを開いて控える(ctx.page, `/en${パス}`, `${名前}（英語表示）`); });
    await ctx.step(3, async () => { sj = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); note(`日本語表示のアドレスの掲載: ${掲載の数(sj, ja)}件`); });
    await ctx.step(4, async () => { se = await サイトマップを開く(ctx.page, "/en/sitemap_page.xml"); note(`英語表示のアドレスの掲載: ${掲載の数(se, en)}件`); });
    await ctx.expected(async () => {
      expect.soft(sj.掲載.length > 0 && se.掲載.length > 0, "言語区分ja・enのページのサイトマップに掲載がある（以下の確かめの前提）").toBe(true);
      expect.soft(掲載の数(sj, ja), `言語区分jaのページのサイトマップの、${名前}（日本語表示）のアドレスの掲載の数`).toBe(0);
      expect.soft(掲載の数(se, en), `言語区分enのページのサイトマップの、${名前}（英語表示）のアドレスの掲載の数`).toBe(0);
    });
  };
}
caseTest("IT-B16-09-006", 除くページ("商品検索ページ", "/products/search"));
caseTest("IT-B16-09-007", 除くページ("カードリスト購入ページ", "/deck/bulk"));
caseTest("IT-B16-09-008", 除くページ("デッキ検索ページ", "/deck/"));
caseTest("IT-B16-09-009", 除くページ("イベント情報", "/events"));

// ── 012 索引の応答の種類 ──
caseTest("IT-B16-09-012", async (ctx) => {
  let s!: サイトマップ;
  await ctx.step(1, async () => { note("開発者ツールのネットワーク表示の代わりに、ブラウザが受けた応答の見出しから、応答の種類（Content-Type）を読んだ"); });
  await ctx.step(2, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap.xml"); });
  await ctx.step(3, async () => { note(`索引の応答の種類: ${s.種類}`); });
  await ctx.expected(async () => {
    expect.soft(s.種類.split(";")[0].trim().toLowerCase(), "索引の応答の種類").toBe("application/xml");
  });
});

// ── 013 HEAD の応答のステータスが GET と同じ ──
caseTest("IT-B16-09-013", async (ctx) => {
  let get = 0; let head = 0;
  await ctx.step(1, async () => {
    const r = await ctx.page.request.get(`${BASE_URL}/ja/sitemap.xml`, { maxRedirects: 0, timeout: 120_000 });
    get = r.status(); note(`GET /ja/sitemap.xml の応答: HTTP ${get}`);
  });
  await ctx.step(2, async () => {
    const r = await ctx.page.request.head(`${BASE_URL}/ja/sitemap.xml`, { maxRedirects: 0, timeout: 120_000 });
    head = r.status(); note(`HEAD /ja/sitemap.xml の応答: HTTP ${head}`);
  });
  await ctx.expected(async () => {
    expect.soft(head, `HEAD の応答のステータス（GET は ${get}）`).toBe(get);
  });
});

// ── 036〜038 ページ番号 99999 は見つからない（404） ──
function 無いページ番号(名前: string, パス: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    let s!: サイトマップ;
    await ctx.step(1, async () => { s = await サイトマップを開く(ctx.page, パス); });
    await ctx.expected(async () => { expect.soft(s.ステータス, `${名前}のサイトマップのページ番号99999の応答のステータス`).toBe(404); });
  };
}
caseTest("IT-B16-09-036", 無いページ番号("商品", "/ja/sitemap_product_99999.xml"));
caseTest("IT-B16-09-037", 無いページ番号("買取商品", "/ja/sitemap_purchase_99999.xml"));
caseTest("IT-B16-09-038", 無いページ番号("デッキ詳細", "/ja/sitemap_deck_show_99999.xml"));

// ── 061〜063 言語区分の無いアドレスの転送 ──
caseTest("IT-B16-09-061", async (ctx) => {
  let r!: { ステータス: number; 転送先: string };
  await ctx.step(1, async () => { r = await 転送を読む(ctx, "/sitemap.xml"); });
  await ctx.step(2, async () => { note(`転送のステータス ${r.ステータス}・転送先 ${r.転送先}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "応答のステータス（恒久的な転送）").toBe(301);
    expect.soft(r.転送先, "転送先のアドレス").toBe(`${BASE_URL}/ja/sitemap.xml`);
  });
});

caseTest("IT-B16-09-062", async (ctx) => {
  let r!: { ステータス: number; 転送先: string };
  await ctx.step(1, async () => { r = await 転送を読む(ctx, "/sitemap_page.xml?qb1609-062=x"); });
  await ctx.step(2, async () => { note(`転送先 ${r.転送先}`); });
  await ctx.expected(async () => {
    expect.soft(r.転送先 !== "", "転送された（転送先がある。以下の確かめの前提）").toBe(true);
    expect.soft(new URL(r.転送先 || BASE_URL, BASE_URL).searchParams.get("qb1609-062"), "転送先のアドレスの検索条件 qb1609-062 の値").toBe("x");
  });
});

caseTest("IT-B16-09-063", async (ctx) => {
  let r!: { ステータス: number; 転送先: string };
  await ctx.step(1, async () => { r = await 転送を読む(ctx, "/sitemap-b1609-063.xml"); });
  await ctx.step(2, async () => { note(`転送のステータス ${r.ステータス}・転送先 ${r.転送先}`); });
  await ctx.expected(async () => {
    expect.soft(r.ステータス, "応答のステータス（恒久的な転送）").toBe(301);
    expect.soft(r.転送先, "転送先のアドレス").toBe(`${BASE_URL}/ja/sitemap-b1609-063.xml`);
  });
});

// ── 066・087 掲載のパスの先頭が言語区分 ja ──
function 先頭がja(名前: string, パス: string) {
  return async (ctx: CaseCtx): Promise<void> => {
    let s!: サイトマップ; let 外れ: string[] = [];
    await ctx.step(1, async () => { s = await サイトマップを開く(ctx.page, パス); });
    await ctx.step(2, async () => {
      外れ = s.掲載.filter((l) => !/^\/ja(\/|$)/.test(new URL(l).pathname));
      note(`${名前}の掲載 ${s.掲載.length}件のうち、パスの先頭が /ja でないもの: ${外れ.length}件${外れ.length ? `（${外れ.slice(0, 5).join("・")}）` : ""}`);
    });
    await ctx.expected(async () => {
      expect.soft(s.掲載.length > 0, `${名前}に掲載がある（以下の確かめの前提）`).toBe(true);
      expect.soft(外れ.length, `${名前}の掲載のうち、URLのパスの先頭が言語区分jaでないものの数`).toBe(0);
    });
  };
}
caseTest("IT-B16-09-066", 先頭がja("索引の案内", "/ja/sitemap.xml"));
caseTest("IT-B16-09-087", 先頭がja("デッキ一覧のサイトマップ", "/ja/sitemap_deck.xml"));
