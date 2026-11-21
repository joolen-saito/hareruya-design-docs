/**
 * B16-09 サイトマップ生成処理（2026-11-21 に書いたケース）。正本: cases/B16-09_test_cases.tsv
 * 判定済みのケース（spec/b16/b16-09.spec.ts）のテストの指紋を変えないよう、別のファイルに書いた。記録 review/B16-09_progress_2026-11-20_dev.md。
 *
 * - サイトマップの XML は、ブラウザでアドレスを開いて読む。
 * - 「案内のサイトマップを上から順にすべて開く」は、索引の案内の順に開く。「無いこと」を確かめるケースは全部開き、
 *   「掲載の URL を確かめる」ケースは、見つけたところで止める（手順の注記に開いた数を残す）。
 * - 支店（店舗コード b1609031s など）は、店舗を作らない決まり（2026-11-13 依頼者決定）で、試験支店（店舗ID 1574）に読み替える。
 *   URL の店舗の部分は、試験支店の店舗コードを DB で読んで使う。
 * - 名前・ページの URL 欄には実行の印が付いている（seeds/b16-09-b.ts）。ケースが探す名前と URL の末尾も、同じ値で読む。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { caseTest, CaseCtx, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { 公開中の商品を1つ, 店舗コードを読む } from "../../db/b16_09_b";
import { 試験支店ID } from "../../pages/admin/test_store";
import { サイトマップ, サイトマップを開く, XMLで応答, 案内, 案内の種類, 案内を順に開いて探す, 末尾, 部分を含む } from "../../pages/front/b16_09_sitemap";
import "../../seeds/b16-09";
import "../../seeds/b16-09-b";
import { ページURL } from "../../seeds/b16-09-b";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 補い = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const パス = (loc: string) => new URL(loc).pathname.replace(/\/+$/, "");

/** 試験支店の店舗コード（支店の読み替え） */
function 支店コード(シード表の店舗コード: string): string {
  const c = 店舗コードを読む(試験支店ID);
  補い(`支店（店舗コード ${シード表の店舗コード}）は、店舗を作らない決まり（2026-11-13 依頼者決定）で、試験支店（店舗ID ${試験支店ID}・店舗コード ${c}）に読み替えた`);
  return c;
}

// ── 014 7つの要求先がすべてサイトマップの XML で応答される ──
caseTest("IT-B16-09-014", async (ctx) => {
  const 開く = ["/ja/sitemap.xml", "/ja/sitemap_page.xml", "/ja/sitemap_category.xml", "/ja/sitemap_product_1.xml", "/ja/sitemap_purchase_1.xml", "/ja/sitemap_deck.xml", "/ja/sitemap_deck_show_1.xml"];
  const 結果: サイトマップ[] = [];
  for (const [i, p] of 開く.entries()) await ctx.step(i + 1, async () => { 結果.push(await サイトマップを開く(ctx.page, p)); });
  await ctx.expected(async () => {
    for (const s of 結果) expect.soft(XMLで応答(s), `${s.パス} がサイトマップの XML で応答された（応答 HTTP ${s.ステータス}・${s.種類}）`).toBe(true);
    expect.soft(結果.filter((s) => s.ステータス === 404).length, "見つからない旨の応答（404）の数").toBe(0);
  });
});

// ── 031 本店の索引と支店の索引の案内の種類 ──
caseTest("IT-B16-09-031", async (ctx) => {
  let 本店!: サイトマップ; let 支店!: サイトマップ; let code = "";
  const 種類 = (s: サイトマップ) => [...new Set(s.掲載.map(案内の種類))];
  await ctx.step(1, async () => { 本店 = await サイトマップを開く(ctx.page, "/ja/sitemap.xml"); note(`本店の索引の案内の種類: ${種類(本店).join("・")}`); });
  await ctx.step(2, async () => { code = 支店コード("b1609031s"); 支店 = await サイトマップを開く(ctx.page, `/ja/${code}/sitemap.xml`); });
  await ctx.step(3, async () => { note(`支店の索引の案内の種類: ${種類(支店).join("・")}`); });
  await ctx.expected(async () => {
    for (const k of ["買取商品", "デッキ一覧", "デッキ詳細"] as const) expect.soft(案内(本店, k).length > 0, `本店の索引に${k}の案内がある`).toBe(true);
    for (const k of ["ページ", "カテゴリ", "商品"] as const) expect.soft(案内(支店, k).length > 0, `支店の索引に${k}の案内がある`).toBe(true);
    for (const k of ["買取商品", "デッキ一覧", "デッキ詳細"] as const) expect.soft(案内(支店, k).length, `支店の索引の${k}の案内の数`).toBe(0);
  });
});

// ── 032 買取価格0円の商品は買取商品のサイトマップに無い ──
caseTest("IT-B16-09-032", async (ctx) => {
  const K = ctx.notes.get("〔商品ID-B1609-032K〕"); const L = ctx.notes.get("〔商品ID-B1609-032L〕");
  let 索引!: サイトマップ; let r!: { 掲載: string[] };
  await ctx.step(1, async () => { note(`控えた商品ID: 〔商品ID-B1609-032K〕=${K}・〔商品ID-B1609-032L〕=${L}（シードの取込のあとに商品登録編集画面で読んだ番号）`); });
  await ctx.step(2, async () => { 索引 = await サイトマップを開く(ctx.page, "/ja/sitemap.xml"); note(`買取商品の案内: ${案内(索引, "買取商品").length}件`); });
  await ctx.step(3, async () => { r = await 案内を順に開いて探す(ctx.page, 案内(索引, "買取商品"), (l) => 末尾(l) === K || 末尾(l) === L, false); });
  await ctx.expected(async () => {
    expect.soft(r.掲載.filter((l) => 末尾(l) === L).length, `URLの末尾が〔商品ID-B1609-032L〕=${L} の掲載の数`).toBe(1);
    expect.soft(r.掲載.filter((l) => 末尾(l) === K).length, `URLの末尾が〔商品ID-B1609-032K〕=${K} の掲載の数`).toBe(0);
  });
});

// ── 034 ユーザー作成のデッキはデッキ詳細のサイトマップに無い ──
caseTest("IT-B16-09-034", async (ctx) => {
  const D1 = ctx.notes.get("〔デッキID-B1609-034D1〕"); const D2 = ctx.notes.get("〔デッキID-B1609-034D2〕");
  let 索引!: サイトマップ; let r!: { 掲載: string[] };
  await ctx.step(1, async () => { note(`控えたデッキID: 〔デッキID-B1609-034D1〕=${D1}・〔デッキID-B1609-034D2〕=${D2}（シードで登録したときの編集画面のアドレスの番号）`); });
  await ctx.step(2, async () => { 索引 = await サイトマップを開く(ctx.page, "/ja/sitemap.xml"); note(`デッキ詳細の案内: ${案内(索引, "デッキ詳細").length}件`); });
  await ctx.step(3, async () => { r = await 案内を順に開いて探す(ctx.page, 案内(索引, "デッキ詳細"), (l) => 部分を含む(l, D1) || 部分を含む(l, D2), false); });
  await ctx.expected(async () => {
    expect.soft(r.掲載.filter((l) => 部分を含む(l, D1)).length, `デッキID〔デッキID-B1609-034D1〕=${D1} を含む掲載の数`).toBe(1);
    expect.soft(r.掲載.filter((l) => 部分を含む(l, D2)).length, `デッキID〔デッキID-B1609-034D2〕=${D2} を含む掲載の数`).toBe(0);
  });
});

// ── 035 支店の買取商品・デッキ一覧・デッキ詳細のサイトマップは 404 ──
caseTest("IT-B16-09-035", async (ctx) => {
  const 結果: サイトマップ[] = []; let code = "";
  await ctx.step(1, async () => { code = 支店コード("b1609035s"); 結果.push(await サイトマップを開く(ctx.page, `/ja/${code}/sitemap_purchase_1.xml`)); });
  await ctx.step(2, async () => { 結果.push(await サイトマップを開く(ctx.page, `/ja/${code}/sitemap_deck.xml`)); });
  await ctx.step(3, async () => { 結果.push(await サイトマップを開く(ctx.page, `/ja/${code}/sitemap_deck_show_1.xml`)); });
  await ctx.expected(async () => {
    for (const s of 結果) expect.soft(s.ステータス, `${s.パス} の応答のステータス`).toBe(404);
  });
});

// ── ページのサイトマップの掲載を URL の末尾で探す ──
const ページの掲載 = (s: サイトマップ, URL欄: string): string[] => s.掲載.filter((l) => 末尾(l) === ページURL(URL欄));

caseTest("IT-B16-09-039", async (ctx) => {
  let s!: サイトマップ;
  await ctx.step(1, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); });
  await ctx.step(2, async () => { note(`URLの末尾 ${["a", "b", "c"].map((x) => `${ページURL(`b1609-039-${x}`)}: ${ページの掲載(s, `b1609-039-${x}`).length}件`).join("・")}`); });
  await ctx.expected(async () => {
    expect.soft(ページの掲載(s, "b1609-039-a").length, `URLの末尾が ${ページURL("b1609-039-a")}（検索避け指定なし）の掲載の数`).toBe(1);
    expect.soft(ページの掲載(s, "b1609-039-b").length, `URLの末尾が ${ページURL("b1609-039-b")}（noindex）の掲載の数`).toBe(0);
    expect.soft(ページの掲載(s, "b1609-039-c").length, `URLの末尾が ${ページURL("b1609-039-c")}（none）の掲載の数`).toBe(0);
  });
});

caseTest("IT-B16-09-041", async (ctx) => {
  let s!: サイトマップ; let 並び: string[] = [];
  await ctx.step(1, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); });
  await ctx.step(2, async () => {
    const 目当て = ["c", "a", "b"].map((x) => ページURL(`b1609-041-${x}`));
    並び = s.掲載.map(末尾).filter((t) => 目当て.includes(t));
    note(`URLの末尾が b1609-041-a・b・c の掲載の並び: ${並び.join(" → ") || "（無い）"}`);
  });
  await ctx.expected(async () => {
    expect.soft(並び, "URLの末尾が b1609-041-c・a・b の掲載の並び").toEqual(["c", "a", "b"].map((x) => ページURL(`b1609-041-${x}`)));
  });
});

caseTest("IT-B16-09-042", async (ctx) => {
  let s!: サイトマップ; let 掲載: string[] = []; let 表示 = ""; let 応答 = 0;
  const 名 = rc("B1609-042-U");
  await ctx.step(1, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); 掲載 = ページの掲載(s, "b1609-042-u"); });
  await ctx.step(2, async () => {
    if (!掲載.length) throw new Error(`URLの末尾が ${ページURL("b1609-042-u")} の掲載が無い`);
    const res = await ctx.page.goto(掲載[0], { timeout: 120_000 });
    応答 = res?.status() ?? 0;
    表示 = (await ctx.page.locator("body").innerText()).replace(/\s+/g, " ");
    note(`掲載の URL ${パス(掲載[0])} を開いた（応答 HTTP ${応答}）。ページに「${名}」の文字が${表示.includes(名) ? "ある" : "無い"}`);
  });
  await ctx.expected(async () => {
    expect.soft(掲載.length === 1 && 末尾(掲載[0]) === ページURL("b1609-042-u"), `掲載の URL の末尾が URL 欄の値 ${ページURL("b1609-042-u")}`).toBe(true);
    expect.soft(応答, "掲載の URL を開いた応答").toBe(200);
    expect.soft(表示.includes(名), `ユーザーページ ${名} が表示された（本文にページ名がある）`).toBe(true);
  });
});

caseTest("IT-B16-09-043", async (ctx) => {
  let 詳細 = ""; let 一覧 = ""; let s!: サイトマップ;
  await ctx.step(1, async () => {
    const id = 公開中の商品を1つ();
    await ctx.page.goto(`${BASE_URL}/ja/products/detail/${id}`, { timeout: 120_000 }); 詳細 = ctx.page.url();
    await ctx.page.goto(`${BASE_URL}/ja/products/list`, { timeout: 120_000 }); 一覧 = ctx.page.url();
    補い(`商品詳細ページは、公開中の商品（商品ID ${id}。DB で読んだ）の詳細を開いた`);
    note(`商品詳細ページのアドレス ${パス(詳細)}・商品一覧ページのアドレス ${パス(一覧)} を控えた`);
  });
  await ctx.step(2, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); });
  const 同じ = (l: string, u: string) => パス(l) === パス(u);
  await ctx.step(3, async () => { note(`商品詳細ページの掲載 ${s.掲載.filter((l) => 同じ(l, 詳細)).length}件・商品一覧ページの掲載 ${s.掲載.filter((l) => 同じ(l, 一覧)).length}件・URLの末尾が ${ページURL("b1609-043-u")} の掲載 ${ページの掲載(s, "b1609-043-u").length}件`); });
  await ctx.expected(async () => {
    expect.soft(ページの掲載(s, "b1609-043-u").length, `URLの末尾が ${ページURL("b1609-043-u")} の掲載の数`).toBe(1);
    expect.soft(s.掲載.filter((l) => 同じ(l, 詳細)).length, "商品詳細ページのアドレスの掲載の数").toBe(0);
    expect.soft(s.掲載.filter((l) => 同じ(l, 一覧)).length, "商品一覧ページのアドレスの掲載の数").toBe(0);
  });
});

// ── 057 デッキ詳細のサイトマップに載る条件 ──
caseTest("IT-B16-09-057", async (ctx) => {
  const id = (n: number) => ctx.notes.get(`〔デッキID-B1609-057D${n}〕`);
  let 索引!: サイトマップ; let r!: { 掲載: string[] }; let 表示 = "";
  await ctx.step(1, async () => { note(`控えたデッキの番号: D1=${id(1)}・D2=${id(2)}・D3=${id(3)}・D4=${id(4)}（シードで登録したときの編集画面のアドレスの番号。D4 は削除の前に控えた）`); });
  await ctx.step(2, async () => { 索引 = await サイトマップを開く(ctx.page, "/ja/sitemap.xml"); r = await 案内を順に開いて探す(ctx.page, 案内(索引, "デッキ詳細"), (l) => [1, 2, 3, 4].some((n) => 部分を含む(l, id(n))), false); });
  await ctx.step(3, async () => { note([1, 2, 3, 4].map((n) => `D${n}: ${r.掲載.filter((l) => 部分を含む(l, id(n))).length}件`).join("・")); });
  await ctx.step(4, async () => {
    const l = r.掲載.find((x) => 部分を含む(x, id(1)));
    if (!l) throw new Error("デッキ B1609-057-D1 の掲載が無い");
    await ctx.page.goto(l, { timeout: 120_000 });
    表示 = (await ctx.page.locator("body").innerText()).replace(/\s+/g, " ");
    note(`D1 の掲載の URL ${パス(l)} を開いた。デッキ名「${rc("B1609-057-D1")}」の文字が${表示.includes(rc("B1609-057-D1")) ? "ある" : "無い"}`);
  });
  await ctx.expected(async () => {
    expect.soft(r.掲載.filter((l) => 部分を含む(l, id(1))).length, "デッキ B1609-057-D1 の掲載の数").toBe(1);
    expect.soft(表示.includes(rc("B1609-057-D1")), "D1 の掲載の URL を開くとデッキ B1609-057-D1 が表示された").toBe(true);
    for (const n of [2, 3, 4]) expect.soft(r.掲載.filter((l) => 部分を含む(l, id(n))).length, `デッキ B1609-057-D${n} の掲載の数`).toBe(0);
  });
});

// ── 059・081 デッキ一覧のサイトマップのフォーマット ──
const デッキのトップ = (s: サイトマップ) => s.掲載.filter((l) => パス(l) === "/ja/deck");
const メタ = (l: string, f: string) => 部分を含む(l, f) && /\/metagame\/?$/.test(new URL(l).pathname);
const 使用率 = (l: string, f: string) => 部分を含む(l, f) && /\/usage_ranking\/?$/.test(new URL(l).pathname);

caseTest("IT-B16-09-059", async (ctx) => {
  const f = (n: number) => ctx.notes.get(`〔フォーマットID-B1609-059F${n}〕`);
  let s!: サイトマップ;
  await ctx.step(1, async () => { note(`控えたフォーマットの番号: F1=${f(1)}・F2=${f(2)}・F3=${f(3)}（シードで登録したときの編集画面のアドレスの番号）`); });
  await ctx.step(2, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_deck.xml"); });
  await ctx.step(3, async () => { note([1, 2, 3].map((n) => `F${n}: ${s.掲載.filter((l) => 部分を含む(l, f(n))).length}件`).join("・") + `・デッキのトップページ: ${デッキのトップ(s).length}件`); });
  await ctx.expected(async () => {
    for (const n of [1, 2]) expect.soft(s.掲載.filter((l) => メタ(l, f(n)) || 使用率(l, f(n))).length, `F${n} の識別番号を含む掲載（メタゲームと使用率ランキング）の数`).toBe(2);
    expect.soft(s.掲載.filter((l) => 部分を含む(l, f(3))).length, "F3 の識別番号を含む掲載の数").toBe(0);
    expect.soft(デッキのトップ(s).length, "デッキのトップページの掲載の数").toBe(1);
  });
});

caseTest("IT-B16-09-081", async (ctx) => {
  const f = (n: number) => ctx.notes.get(`〔フォーマットID-B1609-081F${n}〕`);
  let s!: サイトマップ; let 位置: number[] = [];
  await ctx.step(1, async () => { note(`控えたフォーマットの番号: F1=${f(1)}・F2=${f(2)}・F3=${f(3)}（シードで登録したときの編集画面のアドレスの番号）`); });
  await ctx.step(2, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_deck.xml"); });
  await ctx.step(3, async () => {
    const at = (p: (l: string) => boolean) => s.掲載.findIndex(p);
    位置 = [at((l) => パス(l) === "/ja/deck"), at((l) => メタ(l, f(1))), at((l) => 使用率(l, f(1))), at((l) => メタ(l, f(2))), at((l) => 使用率(l, f(2)))];
    note(`現れた位置（上から0番目始まり）: トップ ${位置[0]}・F1 メタゲーム ${位置[1]}・F1 使用率ランキング ${位置[2]}・F2 メタゲーム ${位置[3]}・F2 使用率ランキング ${位置[4]}`);
  });
  await ctx.expected(async () => {
    expect.soft(位置.every((p) => p >= 0), "デッキのトップページ・F1・F2 のメタゲームと使用率ランキングの掲載がすべてある").toBe(true);
    expect.soft(位置.every((p, i) => i === 0 || p > 位置[i - 1]), "デッキのトップページ、F1 のメタゲーム、F1 の使用率ランキング、F2 のメタゲーム、F2 の使用率ランキングの順に現れる").toBe(true);
    expect.soft(s.掲載.filter((l) => 部分を含む(l, f(3))).length, "B1609-081-F3 の掲載の数").toBe(0);
  });
});

// ── 067・068・083〜088 掲載の URL のパスの先頭 ──
caseTest("IT-B16-09-067", async (ctx) => {
  let s!: サイトマップ; let code = ""; let 外れ: string[] = [];
  await ctx.step(1, async () => { code = 支店コード("B1609067S"); s = await サイトマップを開く(ctx.page, `/ja/${code}/sitemap.xml`); });
  await ctx.step(2, async () => { 外れ = s.掲載.filter((l) => !new URL(l).pathname.startsWith(`/ja/${code}/`)); note(`案内 ${s.掲載.length}件のうち、パスが /ja/${code}/ で始まらないもの: ${外れ.length}件`); });
  await ctx.expected(async () => {
    expect.soft(s.掲載.length > 0, "支店の索引に案内がある（以下の確かめの前提）").toBe(true);
    expect.soft(外れ.length, `案内のうち、パスが言語区分 ja・続けて店舗コード ${code} で始まらないものの数`).toBe(0);
  });
});

/** 索引の商品の案内を順に開き、その商品IDの商品詳細の掲載を探す（見つけたら止める） */
async function 商品の掲載を探す(ctx: CaseCtx, 先頭: string, 商品ID: string): Promise<string[]> {
  const 索引 = await サイトマップを開く(ctx.page, `${先頭}/sitemap.xml`);
  return (await 案内を順に開いて探す(ctx.page, 案内(索引, "商品"), (l) => 末尾(l) === 商品ID, true)).掲載;
}

caseTest("IT-B16-09-068", async (ctx) => {
  const p = ctx.notes.get("〔商品ID-B1609-068P〕"); let code = ""; let 掲載: string[] = [];
  await ctx.step(1, async () => { note(`控えた商品ID: ${p}（シードの取込のあとに読んだ番号）`); });
  await ctx.step(2, async () => { code = 支店コード("B1609068S"); 掲載 = await 商品の掲載を探す(ctx, `/ja/${code}`, p); });
  await ctx.step(3, async () => { note(`商品詳細の掲載のパス: ${掲載.map(パス).join("・") || "（無い）"}`); });
  await ctx.expected(async () => {
    expect.soft(掲載.length, "控えた商品IDの商品詳細の掲載の数（以下の確かめの前提）").toBe(1);
    expect.soft(掲載.every((l) => new URL(l).pathname.startsWith(`/ja/${code}/`)), `商品詳細の URL のパスが言語区分 ja・続けて店舗コード ${code} で始まる`).toBe(true);
  });
});

caseTest("IT-B16-09-083", async (ctx) => {
  let s!: サイトマップ; let 掲載: string[] = [];
  await ctx.step(1, async () => { s = await サイトマップを開く(ctx.page, "/ja/sitemap_page.xml"); });
  await ctx.step(2, async () => { 掲載 = ページの掲載(s, "b1609-083-u"); note(`URLの末尾が ${ページURL("b1609-083-u")} の掲載のパス: ${掲載.map(パス).join("・") || "（無い）"}`); });
  await ctx.expected(async () => {
    expect.soft(掲載.length, "掲載の数（以下の確かめの前提）").toBe(1);
    expect.soft(掲載.every((l) => /^\/ja\//.test(new URL(l).pathname)), "掲載の URL のパスの先頭が言語区分 ja").toBe(true);
  });
});

caseTest("IT-B16-09-084", async (ctx) => {
  let s!: サイトマップ; let 掲載: string[] = []; let code = "";
  await ctx.step(1, async () => { code = 支店コード("B1609084S"); s = await サイトマップを開く(ctx.page, `/ja/${code}/sitemap_page.xml`); });
  await ctx.step(2, async () => { 掲載 = ページの掲載(s, "b1609-084-u"); note(`URLの末尾が ${ページURL("b1609-084-u")} の掲載のパス: ${掲載.map(パス).join("・") || "（無い）"}`); });
  await ctx.expected(async () => {
    expect.soft(掲載.length, "掲載の数（以下の確かめの前提）").toBe(1);
    expect.soft(掲載.every((l) => new URL(l).pathname.startsWith(`/ja/${code}/`)), `掲載の URL のパスが言語区分 ja・続けて店舗コード ${code} で始まる`).toBe(true);
  });
});

caseTest("IT-B16-09-085", async (ctx) => {
  const p = ctx.notes.get("〔商品ID-B1609-085P〕"); let 掲載: string[] = [];
  await ctx.step(1, async () => { note(`控えた商品ID: ${p}（シードの取込のあとに読んだ番号）`); });
  await ctx.step(2, async () => { 掲載 = await 商品の掲載を探す(ctx, "/ja", p); });
  await ctx.step(3, async () => { note(`商品詳細の掲載のパス: ${掲載.map(パス).join("・") || "（無い）"}`); });
  await ctx.expected(async () => {
    expect.soft(掲載.length, "控えた商品IDの商品詳細の掲載の数（以下の確かめの前提）").toBe(1);
    expect.soft(掲載.every((l) => /^\/ja\//.test(new URL(l).pathname)), "商品詳細の URL のパスの先頭が言語区分 ja").toBe(true);
  });
});

caseTest("IT-B16-09-088", async (ctx) => {
  const d = ctx.notes.get("〔デッキID-B1609-088D〕"); let 掲載: string[] = [];
  await ctx.step(1, async () => { note(`控えたデッキの番号: ${d}（シードで登録したときの編集画面のアドレスの番号）`); });
  await ctx.step(2, async () => {
    const 索引 = await サイトマップを開く(ctx.page, "/ja/sitemap.xml");
    掲載 = (await 案内を順に開いて探す(ctx.page, 案内(索引, "デッキ詳細"), (l) => 部分を含む(l, d), true)).掲載;
  });
  await ctx.step(3, async () => { note(`デッキ詳細の掲載のパス: ${掲載.map(パス).join("・") || "（無い）"}`); });
  await ctx.expected(async () => {
    expect.soft(掲載.length, "控えた番号のデッキ詳細の掲載の数（以下の確かめの前提）").toBe(1);
    expect.soft(掲載.every((l) => /^\/ja\//.test(new URL(l).pathname)), "掲載の URL のパスの先頭が言語区分 ja").toBe(true);
  });
});
