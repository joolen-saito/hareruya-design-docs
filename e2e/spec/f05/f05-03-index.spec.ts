/**
 * F05-03 ネット買取商品一覧（フロント）のうち、検索結果にその商品が出ること（検索サービスの索引）を確かめるケース。正本: cases/F05-03_test_cases.tsv
 * （ほかのケースは f05-03.spec.ts）
 *
 * 商品は seeds/f05-03-index.ts が画面で作り、ユニサーチフィード作成で1回だけ送って、公開側の一覧に出るまで待つ。
 * カテゴリ・タグ・検索語は実行の印つきの新しいものなので、一覧に出るのは自分の作った商品だけになる。
 * 実装しないケース（理由は PM への報告）: 003・052・067（9999件以上の商品）、038（買取TOPの新着タグ＝共有の設定に商品を載せる）。
 */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { NetBuyCartPage } from "../../pages/front/f05_04_net_detail";
import { ネット買取の検索結果, 一覧の行 } from "../../pages/front/f05_purchase_results";
import { F0503ページングの商品名, F0503作った, F0503販促バナーの文, f0503商品 } from "../../seeds/f05-03-index";
import "../../seeds/f05-03"; // ENV・MASTER

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 一覧 = "/ja/purchase/search";
const 印の注記 = "カテゴリ名・タグ名・商品名・検索語の末尾の「-印」は実行ごとの印（シードが付けた値で開き、入れた）";

async function 開く(r: ネット買取の検索結果, path: string): Promise<void> {
  expect(await r.開く(path), "ネット買取商品一覧の応答").toBeLessThan(400);
  await expect(r.page.locator("body.purchase_search"), "ネット買取商品一覧の画面").toHaveCount(1);
  await r.結果を待つ();
}
const カテゴリで = (正本の名: string) => `${一覧}/cate/${F0503作った.カテゴリ.get(正本の名) ?? (() => { throw new Error(`カテゴリ ${正本の名} を作っていない`); })()}`;
async function 読む(r: ネット買取の検索結果, what: string): Promise<一覧の行[]> {
  const rows = await r.行を読む();
  note(`${what}: ${rows.map((x) => `${x.商品名}${x.言語 ? `（${x.言語}）` : ""}`).join("、") || "なし"}`);
  return rows;
}
const 名 = (rows: 一覧の行[]) => rows.map((x) => x.商品名);
const 行の名 = (rows: 一覧の行[], 正本: string) => rows.find((x) => x.商品名 === rc(正本));

/** ページ送りの項目を押して、そのページへ移るのを待つ */
async function ページを押す(r: ネット買取の検索結果, item: Locator, 先: string): Promise<void> {
  await item.scrollIntoViewIfNeeded();
  await Promise.all([
    r.page.waitForURL((u) => (u.searchParams.get("pageno") ?? "1") === 先, { timeout: 60_000 }),
    item.locator("a").first().click(),
  ]);
  await r.page.waitForTimeout(500);
  await r.結果を待つ();
}
/** ページ送りの表記の、番号と省略の印だけ（前へ・次へを除く。省略の印は「...」に揃える） */
const 番号の表記 = (items: string[]) => items.map((t) => t.replace(/…/g, "...")).filter((t) => /^\d+$|^\.\.\.$/.test(t));

// ---- 002（0件） ----
caseTest("IT-F05-03-002", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  note("ヘッダのキーワード検索は、ネット買取商品一覧の画面のヘッダの検索欄で行った。検索語は正本の値のまま（印を付けない）");
  await step(1, async () => { await 開く(r, 一覧); await r.ヘッダで検索する("F0503-ZERO-002"); await r.結果を待つ(); });
  await expected(async () => {
    expect.soft(await r.行.count(), "商品内容（一覧の行）が表示されない").toBe(0);
    await expect.soft(r.案内, "検索結果が0件であることを示す案内").toContainText("お探しの商品は見つかりませんでした");
  });
});

// ---- 007・008（121件のページ送り） ----
async function 全ページを読む(r: ネット買取の検索結果): Promise<string[][]> {
  const pages: string[][] = [];
  for (let n = 1; n <= 20; n++) {
    pages.push(名(await r.行を読む()));
    const next = r.上部のページ送り.locator(".p-hareruya-pagination__item--next");
    if ((await next.count()) === 0) break;
    await ページを押す(r, next, String(n + 1));
  }
  return pages;
}

caseTest("IT-F05-03-007", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let pages: string[][] = [];
  let 件数: string | null = null;
  note(印の注記);
  note("各ページの商品は商品名（商品IDの文字列。シードが作った121商品は名前が重ならない）で記録した。ページは上部のページ送りの「次へ」で移った");
  await step(1, async () => { await 開く(r, カテゴリで("ページング確認カテゴリ-007")); 件数 = await r.商品数の値(); });
  await step(2, async () => { pages = await 全ページを読む(r); note(`各ページの商品数: ${pages.map((p) => p.length).join("、")}`); });
  await expected(async () => {
    const all = pages.flat();
    expect.soft(件数, "総件数（商品数の表示）").toBe("121");
    expect.soft(pages.map((p) => p.length), "ページ数と各ページの商品数（60・60・1）").toEqual([60, 60, 1]);
    expect.soft(new Set(all).size, "重複なく表示された商品の数").toBe(all.length);
    expect.soft([...all].sort(), "121商品が欠落なく表示された").toEqual([...F0503ページングの商品名].sort());
  });
});

caseTest("IT-F05-03-008", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let pages: string[][] = [];
  let 既定 = 0;
  note(印の注記);
  note("アドレスの引数 pageSize は、カテゴリの一覧のアドレスの後ろに「?pageSize=50」「?pageSize=0」として付けた");
  await step(1, async () => { await 開く(r, `${カテゴリで("ページング確認カテゴリ-008")}?pageSize=50`); });
  await step(2, async () => { pages = await 全ページを読む(r); note(`pageSize=50 の各ページの商品数: ${pages.map((p) => p.length).join("、")}`); });
  await step(3, async () => { await 開く(r, `${カテゴリで("ページング確認カテゴリ-008")}?pageSize=0`); 既定 = await r.行.count(); note(`pageSize=0 の1ページ目の商品数: ${既定}`); });
  await expected(async () => {
    expect.soft(pages.map((p) => p.length), "pageSize=50 の各ページの商品数（50・50・21）").toEqual([50, 50, 21]);
    expect.soft(既定, "pageSize=0 の1ページ目の商品数（既定の60）").toBe(60);
  });
});

// ---- 013（まとめて買取） ----
caseTest("IT-F05-03-013", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  const id = notes.get("〔商品レコードID-F0503-共有〕");
  note(`まとめて買取の遷移先の商品は、追加システム設定の今の値（${id}）。シード（MASTER）は共有の設定を書き換えず、今の値を控えただけ`);
  await step(1, async () => { await 開く(r, 一覧); });
  await step(2, async () => {
    await expect(r.まとめて買取, "「まとめて買取」のリンク").toHaveCount(1);
    await r.まとめて買取.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL((u) => u.pathname.includes("/purchase/detail/"), { timeout: 60_000 }), r.まとめて買取.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "遷移先がまとめて買取商品の詳細画面").toBe(`/ja/purchase/detail/${id}`);
  });
});

// ---- 015〜017（一覧の絞り込み） ----
async function 絞り込む(r: ネット買取の検索結果, 行: "language" | "foilFlg" | "rarity" | "colors" | "cardtypes", 当たる: RegExp, what: string): Promise<void> {
  const opts = await r.絞り込みの選択肢(行);
  const hit = opts.filter((o) => 当たる.test(o.名));
  if (hit.length !== 1) throw new Error(`一覧の絞り込みに${what}が ${hit.length} 件（選択肢: ${opts.map((o) => o.名).join("、")}）`);
  await r.絞り込みを押す(r.絞り込みのボタン(行, hit[0].値));
  note(`${what}（「${hit[0].名}」）を押した。アドレス: ${decodeURIComponent(r.page.url())}`);
}

caseTest("IT-F05-03-015", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("絞り込み確認カテゴリ-015")); });
  await step(2, async () => {
    await 絞り込む(r, "language", /^(JP|日本語)$/, "カード言語のJP");
    await 絞り込む(r, "foilFlg", /特殊/, "Foilの特殊");
    await 絞り込む(r, "rarity", /^神話レア$/, "レアリティの神話レア");
    await 絞り込む(r, "colors", /^赤$/, "カラーの赤");
    await 絞り込む(r, "cardtypes", /^クリーチャー$/, "カードタイプのクリーチャー");
    rows = await 読む(r, "絞り込みのあとの一覧");
  });
  await expected(async () => {
    expect.soft(rows.map((x) => x.商品ID), "5条件をすべて持つ FILTER-ALL だけが表示された").toEqual([f0503商品("FILTER-ALL").商品ID]);
  });
});

caseTest("IT-F05-03-016", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("マナコスト確認カテゴリ-016")); });
  await step(2, async () => {
    const mana = page.locator('#purchase-search-form [data-qf-row="cmc"], #purchase-search-form [data-qf-row="manaCost"], #purchase-search-form [data-filter="mana-cost"]').filter({ hasText: /^\s*3\s*$/ });
    const n = await mana.count();
    if (n === 0) throw new Error(`一覧の絞り込みにマナコストの選択肢が無い（絞り込みの行: ${(await page.locator("#purchase-search-form [data-filter-row]").evaluateAll((es) => es.map((e) => e.getAttribute("data-filter-row")))).join("、")}）`);
    await r.絞り込みを押す(mana.first());
    rows = await 読む(r, "絞り込みのあとの一覧");
  });
  await expected(async () => {
    expect.soft(rows.map((x) => x.商品ID), "マナコスト3の MANA-3-016 だけが表示された（MANA-4-016 は表示されない）").toEqual([f0503商品("MANA-3-016").商品ID]);
  });
});

caseTest("IT-F05-03-017", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  note("手順3の「色の選択をすべて解除」は、カラーの並びの「全色」のボタンを押すことと読んだ");
  await step(1, async () => { await 開く(r, カテゴリで("カラー確認カテゴリ-017")); });
  await step(2, async () => { await 絞り込む(r, "colors", /^赤$/, "カラーの赤"); await 読む(r, "赤を選んだあとの一覧"); });
  await step(3, async () => { await r.絞り込みを押す(r.全色); rows = await 読む(r, "全色を押したあとの一覧"); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.商品ID).sort(), "赤の COLOR-R-017 と青の COLOR-U-017 がともに表示された").toEqual([f0503商品("COLOR-R-017").商品ID, f0503商品("COLOR-U-017").商品ID].sort());
  });
});

// ---- 018（発売日順） ----
caseTest("IT-F05-03-018", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  note("表示された商品は、商品名のリンクの商品IDと言語（lang）で記録した。REL-NEW-200-JP-018・REL-NEW-200-EN-018 は同じ商品（〔商品レコードID-F0503-018A〕）の日本語と英語の規格");
  await step(1, async () => { await 開く(r, 一覧); await r.ヘッダで検索する(rc("F0503-SORT-018")); await r.結果を待つ(); });
  await step(2, async () => { rows = await 読む(r, "検索結果"); note(`選ばれている並び順: ${(await r.選ばれている並び順()).join("、")}`); });
  await expected(async () => {
    const A = notes.get("〔商品レコードID-F0503-018A〕");
    const B = notes.get("〔商品レコードID-F0503-018B〕");
    expect.soft(rows.map((x) => `${x.商品ID}:${x.言語}`), "発売日順で REL-NEW-200-JP・REL-NEW-200-EN・REL-NEW-100-JP・REL-OLD-300-JP・REL-SUPPLY-400 の順に表示された").toEqual([
      `${A}:JP`, `${A}:EN`, `${B}:JP`, `${f0503商品("REL-OLD-300-JP-018").商品ID}:JP`, `${f0503商品("REL-SUPPLY-400-018").商品ID}:JP`,
    ]);
  });
});

// ---- 019（カテゴリツリーから開いたときの並び順） ----
caseTest("IT-F05-03-019", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  let 並び順: string[] = [];
  note(印の注記);
  note("左メニューのカテゴリツリーは、ネット買取商品一覧の左の欄のカテゴリ一覧。カテゴリ「F0503色順カテゴリ-019」はサプライ・グッズの子として作った");
  await step(1, async () => {
    await 開く(r, 一覧);
    const link = page.locator(".p-hareruya-product-list__sidebar a").filter({ hasText: new RegExp(`^\\s*${rc("F0503色順カテゴリ-019")}\\s*$`) });
    if ((await link.count()) === 0) throw new Error(`左メニューのカテゴリツリーに「${rc("F0503色順カテゴリ-019")}」が無い`);
    await link.first().scrollIntoViewIfNeeded().catch(() => undefined);
    await Promise.all([page.waitForURL((u) => u.pathname.includes("/cate/"), { timeout: 60_000 }), link.first().click()]);
    await r.結果を待つ();
  });
  await step(2, async () => { rows = await 読む(r, "カテゴリの一覧"); 並び順 = await r.選ばれている並び順(); note(`選ばれている並び順: ${並び順.join("、")}`); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.商品ID).sort(), "ユニサーチによるカテゴリ検索結果が表示された（カテゴリの3商品）").toEqual(["SORT-COLOR-W-019", "SORT-COLOR-U-019", "SORT-COLOR-R-019"].map((c) => f0503商品(c).商品ID).sort());
    expect.soft(並び順, "初期の並び順として色順が選ばれている").toEqual(["色順"]);
  });
});

// ---- 020（同名商品検索） ----
caseTest("IT-F05-03-020", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let url = new URL("about:blank");
  let rows: 一覧の行[] = [];
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("表示属性確認カテゴリ-020")); });
  await step(2, async () => {
    const row = r.行の要素(f0503商品("CARD-001-020").商品ID);
    await expect(row, "CARD-001-020 の行").toHaveCount(1);
    await r.同名商品検索を押す(row);
    await r.結果を待つ();
    url = new URL(page.url());
    rows = await 読む(r, `同名商品検索のあとの一覧（${decodeURIComponent(url.pathname + url.search)}）`);
  });
  await expected(async () => {
    expect.soft(url.searchParams.get("cardId"), "検索条件のカードIDが CARD-001-020 のカードID").toBe(notes.get("〔カードレコードID-F0503-020〕"));
    expect.soft(rows.map((x) => x.商品ID).sort(), "同じカードIDの CARD-001-020 と CARD-002-020 が表示された").toEqual([f0503商品("CARD-001-020").商品ID, f0503商品("CARD-002-020").商品ID].sort());
  });
});

// ---- 024（検索対象） ----
caseTest("IT-F05-03-024", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  await step(1, async () => { await 開く(r, 一覧); await r.ヘッダで検索する(rc("F0503-ELIGIBILITY-024")); await r.結果を待つ(); });
  await step(2, async () => { rows = await 読む(r, "検索結果"); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.商品ID).sort(), "ELIGIBLE-NOSTOCK-024 と ELIGIBLE-STOCK-024 だけが表示された").toEqual([f0503商品("ELIGIBLE-NOSTOCK-024").商品ID, f0503商品("ELIGIBLE-STOCK-024").商品ID].sort());
  });
});

// ---- 025（買取価格は画面の値） ----
caseTest("IT-F05-03-025", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let price = "";
  note(印の注記);
  note("買取価格は「¥900」の形（円の記号と桁区切り）で表示されるので、記号と桁区切りを外した数で比べた");
  await step(1, async () => { await 開く(r, 一覧); await r.ヘッダで検索する(rc("F0503-PRICE-025")); await r.結果を待つ(); });
  await step(2, async () => { const row = 行の名(await 読む(r, "検索結果"), "PRICE-001-025"); price = row?.買取価格 ?? ""; note(`PRICE-001-025 の買取価格の表示: ${price || "（行が無い）"}`); });
  await expected(async () => {
    expect.soft(price.replace(/[¥,]/g, ""), "PRICE-001-025 に、ECCUBE に登録されている今の買取価格900円が表示された").toBe("900");
  });
});

// ---- 026（価格の高い順） ----
caseTest("IT-F05-03-026", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("買取価格順確認カテゴリ-026")); note(`押した並べ替え: ${await r.並べ替える("3")}`); });
  await step(2, async () => { rows = await 読む(r, "並べ替えのあとの一覧"); });
  await expected(async () => {
    expect.soft(rows.map((x) => x.商品ID), "PRICE-HIGH-026・PRICE-MID-026・PRICE-LOW-026 の順に表示された").toEqual(["PRICE-HIGH-026", "PRICE-MID-026", "PRICE-LOW-026"].map((c) => f0503商品(c).商品ID));
  });
});

// ---- 028・029・031（ページ送り） ----
caseTest("IT-F05-03-028", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("ページング確認カテゴリ-028")); });
  await step(2, async () => { await ページを押す(r, r.ページ送りの項目("上部", "3"), "3"); });
  await expected(async () => {
    expect.soft(await r.現在のページ(), "表示中のページが3ページ目").toBe("3");
    expect.soft(new URL(page.url()).searchParams.get("pageno"), "アドレスのページ番号").toBe("3");
    expect.soft(await r.行.count(), "3ページ目の商品（121件の3ページ目は1件）").toBe(1);
  });
});

caseTest("IT-F05-03-029", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  note(印の注記);
  note("手順1の「3ページ目を開く」は、カテゴリの一覧のアドレスに ?pageno=3 を付けて開いた。「<」は上部のページ送りの前へ");
  await step(1, async () => { await 開く(r, `${カテゴリで("ページング確認カテゴリ-029")}?pageno=3`); expect(await r.現在のページ(), "開いたのは3ページ目").toBe("3"); });
  await step(2, async () => { await ページを押す(r, r.上部のページ送り.locator(".p-hareruya-pagination__item--prev"), "2"); });
  await expected(async () => {
    expect.soft(await r.現在のページ(), "表示中のページが2ページ目").toBe("2");
    expect.soft(new URL(page.url()).searchParams.get("pageno"), "アドレスのページ番号").toBe("2");
  });
});

caseTest("IT-F05-03-031", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("ページング確認カテゴリ-031")); });
  await step(2, async () => { await ページを押す(r, r.ページ送りの項目("下部", "2"), "2"); });
  await expected(async () => {
    expect.soft(await r.現在のページ(), "表示中のページが2ページ目").toBe("2");
    expect.soft(new URL(page.url()).searchParams.get("pageno"), "アドレスのページ番号").toBe("2");
  });
});

// ---- 032（カード商品とサプライ商品の表示） ----
caseTest("IT-F05-03-032", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("表示属性確認カテゴリ-032")); });
  await step(2, async () => { rows = await 読む(r, "カテゴリの一覧"); });
  await expected(async () => {
    const card = rows.find((x) => x.商品ID === f0503商品("CARD-001-032").商品ID);
    const supply = rows.find((x) => x.商品ID === f0503商品("SUPPLY-001-032").商品ID);
    expect.soft(card?.言語ラベル ?? "（行が無い）", "CARD-001-032 に言語コードJPが表示された").toBe("JP");
    expect.soft(card ? card.同名商品検索 !== null : "（行が無い）", "CARD-001-032 に同名商品検索が表示された").toBe(true);
    expect.soft(supply ? supply.言語ラベル : "（行が無い）", "SUPPLY-001-032 にカード言語が表示されない").toBe("");
    expect.soft(supply ? supply.同名商品検索 : "（行が無い）", "SUPPLY-001-032 に同名商品検索が表示されない").toBeNull();
  });
});

// ---- 033〜037・050・054（数量とカート） ----
async function 行(r: ネット買取の検索結果, 正本: string): Promise<Locator> {
  const row = r.行の要素(f0503商品(正本).商品ID);
  await expect(row, `${正本} の行`).toHaveCount(1);
  return row;
}

caseTest("IT-F05-03-033", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let row: Locator | null = null;
  note(印の注記);
  await step(1, async () => { await 開く(r, カテゴリで("カート確認カテゴリ-033")); });
  await step(2, async () => { row = await 行(r, "CART-499-033"); await row.scrollIntoViewIfNeeded(); });
  await expected(async () => {
    const x = row!;
    expect.soft(await r.数量の欄(x).count(), "CART-499-033 の商品数が表示されない").toBe(0);
    expect.soft(await x.locator(".btn-minus").count(), "マイナスが表示されない").toBe(0);
    expect.soft(await x.locator(".btn-plus").count(), "プラスが表示されない").toBe(0);
    expect.soft(await x.locator("button.addCart").count(), "カートに追加が表示されない").toBe(0);
  });
});

function 数量のケース(no: "034" | "035" | "036" | "050", 期待: string) {
  return async ({ page, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const r = new ネット買取の検索結果(page);
    const カテゴリ = no === "050" ? "数量確認カテゴリ-F0503-050" : `カート確認カテゴリ-${no}`;
    const 商品 = no === "050" ? "F0503-050-001" : `CART-500-${no}`;
    let row: Locator | null = null;
    note(印の注記);
    await step(1, async () => { await 開く(r, カテゴリで(カテゴリ)); row = await 行(r, 商品); await row.scrollIntoViewIfNeeded(); });
    if (no === "034") await step(2, async () => { note(`${商品} の商品数: ${await r.数量の欄(row!).inputValue()}`); });
    if (no === "035") await step(2, async () => { await r.プラスを押す(row!, 1); });
    if (no === "036") await step(2, async () => { const d = await r.マイナスを押す(row!, 1); if (d) note("数量1のときマイナスは無効になっていた（その位置を押した）"); });
    if (no === "050") {
      await step(2, async () => { await r.プラスを押す(row!, 2); });
      await step(3, async () => { await r.マイナスを押す(row!, 1); });
    }
    await expected(async () => {
      expect.soft(await r.数量の欄(row!).inputValue(), `${商品} の商品数`).toBe(期待);
    });
  };
}
caseTest("IT-F05-03-034", 数量のケース("034", "1"));
caseTest("IT-F05-03-035", 数量のケース("035", "2"));
caseTest("IT-F05-03-036", 数量のケース("036", "20"));
caseTest("IT-F05-03-050", 数量のケース("050", "2"));

async function カートの数量(page: Page, 商品ID: string): Promise<string[]> {
  const cart = new NetBuyCartPage(page);
  await cart.開く();
  return cart.数量(商品ID);
}

caseTest("IT-F05-03-037", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let row: Locator | null = null;
  let q: string[] = [];
  note(印の注記);
  note("ケースのブラウザは新しいセッションなので、開始時のネット買取カートは空");
  await step(1, async () => { await 開く(r, カテゴリで("カート確認カテゴリ-037")); row = await 行(r, "CART-500-037"); await row.scrollIntoViewIfNeeded(); });
  await step(2, async () => { await r.プラスを押す(row!, 1); });
  await step(3, async () => { note(`「カートに追加」の応答: ${await r.カートに追加を押す(row!)}`); });
  await step(4, async () => { q = await カートの数量(page, f0503商品("CART-500-037").商品ID); });
  await expected(async () => { expect.soft(q, "ネット買取カートの CART-500-037 の行と数量（2点）").toEqual(["2"]); });
});

caseTest("IT-F05-03-054", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let row: Locator | null = null;
  let q: string[] = [];
  note(印の注記);
  note("ケースのブラウザは新しいセッションなので、開始時のネット買取カートは空");
  await step(1, async () => { await 開く(r, カテゴリで("カート確認カテゴリ-054")); row = await 行(r, "F0503-CART-500-054"); await row.scrollIntoViewIfNeeded(); });
  await step(2, async () => { note(`「カートに追加」の応答: ${await r.カートに追加を押す(row!)}`); });
  await step(3, async () => { q = await カートの数量(page, f0503商品("F0503-CART-500-054").商品ID); });
  await expected(async () => { expect.soft(q, "ネット買取カートの F0503-CART-500-054 の行と数量（1点）").toEqual(["1"]); });
});

// ---- 045〜048・053（ページ送りの表記） ----
const pageSize1 = (カテゴリ: string) => `${カテゴリで(カテゴリ)}?pageSize=1`;
const pageSize1の注記 = "アドレスの引数 pageSize は、カテゴリの一覧のアドレスの後ろに「?pageSize=1」として付けた。ページ送りの表記は、番号と省略の印（「…」は「...」と読む）だけを並べた（前へ・次へは除く）";

caseTest("IT-F05-03-045", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let 前 = "";
  let 後 = "";
  let 前の行: string[] = [];
  let 後の行: string[] = [];
  let 押せた = true;
  note(印の注記);
  note(pageSize1の注記);
  await step(1, async () => { await 開く(r, pageSize1("ページング確認カテゴリ-F0503-045")); });
  await step(2, async () => { await ページを押す(r, r.ページ送りの項目("上部", "2"), "2"); 前 = page.url(); 前の行 = 名(await r.行を読む()); });
  await step(3, async () => {
    const item = r.ページ送りの項目("上部", "2");
    await expect(item, "上部のページ送りの2").toHaveCount(1);
    押せた = (await item.locator("a").count()) > 0;
    await item.click();
    await page.waitForTimeout(1500);
    await r.結果を待つ();
    後 = page.url(); 後の行 = 名(await r.行を読む());
  });
  await expected(async () => {
    expect.soft(押せた, "表示中のページ番号2はリンクでない（押しても反応しない）").toBe(false);
    expect.soft(後, "ブラウザのアドレスが手順2の直後から変わらない").toBe(前);
    expect.soft(後の行, "2ページ目の表示が変わらない").toEqual(前の行);
    expect.soft(await r.現在のページ(), "表示中のページ").toBe("2");
  });
});

async function 表記を読む(r: ネット買取の検索結果, what: string): Promise<string[]> {
  const t = 番号の表記(await r.ページ送りの表記("上部"));
  note(`${what}の上部のページ送りの表記: ${t.join(" ")}`);
  return t;
}

caseTest("IT-F05-03-046", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let t: string[] = [];
  note(印の注記);
  note(pageSize1の注記);
  await step(1, async () => { await 開く(r, pageSize1("ページング確認カテゴリ-F0503-046")); });
  await step(2, async () => { t = await 表記を読む(r, "1ページ目"); });
  await expected(async () => { expect.soft(t.join(" "), "1ページ目の上部のページ送りの表記").toBe("1 2 3 4 5 ... 17"); });
  void page;
});

caseTest("IT-F05-03-047", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let t: string[] = [];
  note(印の注記);
  note(pageSize1の注記);
  await step(1, async () => { await 開く(r, pageSize1("ページング確認カテゴリ-F0503-047")); });
  await step(2, async () => { await ページを押す(r, r.ページ送りの項目("上部", "17"), "17"); });
  await step(3, async () => { t = await 表記を読む(r, "17ページ目"); });
  await expected(async () => { expect.soft(t.join(" "), "17ページ目の上部のページ送りの表記").toBe("1 ... 13 14 15 16 17"); });
});

caseTest("IT-F05-03-048", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let 前 = "";
  let 前の行: string[] = [];
  note(印の注記);
  note(pageSize1の注記);
  await step(1, async () => { await 開く(r, pageSize1("ページング確認カテゴリ-F0503-048")); 前 = page.url(); 前の行 = 名(await r.行を読む()); await 表記を読む(r, "1ページ目"); });
  await step(2, async () => {
    const dots = r.上部のページ送り.locator(".p-hareruya-pagination__item--ellipsis").first();
    await expect(dots, "上部のページ送りの「...」").toHaveCount(1);
    await dots.click({ force: true });
    await page.waitForTimeout(1500);
  });
  await expected(async () => {
    expect.soft(page.url(), "ブラウザのアドレスが変わらない").toBe(前);
    expect.soft(名(await r.行を読む()), "1ページ目の表示が変わらない").toEqual(前の行);
    expect.soft(await r.現在のページ(), "表示中のページ").toBe("1");
  });
});

caseTest("IT-F05-03-053", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let t: string[] = [];
  note(印の注記);
  note(pageSize1の注記);
  await step(1, async () => { await 開く(r, pageSize1("ページング確認カテゴリ-F0503-053")); });
  await step(2, async () => {
    for (let i = 0; i < 10; i++) {
      const nums = 番号の表記(await r.ページ送りの表記("上部")).filter((x) => /^\d+$/.test(x)).map(Number);
      if (nums.includes(9)) { await ページを押す(r, r.ページ送りの項目("上部", "9"), "9"); break; }
      const 次 = Math.max(...nums.filter((n) => n !== 17));
      await ページを押す(r, r.ページ送りの項目("上部", String(次)), String(次));
    }
    expect(await r.現在のページ(), "9ページ目へ移った").toBe("9");
  });
  await step(3, async () => { t = await 表記を読む(r, "9ページ目"); });
  await expected(async () => { expect.soft(t.join(" "), "9ページ目の上部のページ送りの表記").toBe("1 ... 2 3 4 5 6 7 8 9 10 ... 17"); });
  void page;
});

// ---- 051（販促バナー） ----
caseTest("IT-F05-03-051", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let 買取側 = "";
  note("販促バナーは、フッターの4種の案内の文（シード表の文）で確かめた。手順2の「カテゴリ一覧の周辺」は、ネット買取商品一覧の画面全体（左の欄のカテゴリ一覧とフッターを含む）と読んだ");
  await step(1, async () => {
    const res = await page.goto(`${BASE_URL}/ja/products/search`, { waitUntil: "load" });
    expect(res?.status() ?? 0, "販売側の商品一覧の応答").toBeLessThan(400);
    const text = ((await page.locator("body").textContent()) ?? "").replace(/\s+/g, " ");
    for (const t of F0503販促バナーの文) expect.soft(text, `販売側の商品一覧に「${t}」が表示されている`).toContain(t.replace(/\s+/g, " "));
  });
  await step(2, async () => { await 開く(r, 一覧); 買取側 = ((await page.locator("body").textContent()) ?? "").replace(/\s+/g, " "); });
  await expected(async () => {
    for (const t of F0503販促バナーの文) expect.soft(買取側, `ネット買取商品一覧に「${t}」が表示されない`).not.toContain(t.replace(/\s+/g, " "));
  });
});

// ---- 057〜066・068（タグの説明文と、買取の対象でない商品） ----
function タグのケース(no: string, タグ数: 1 | 2, TARGET: boolean) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const r = new ネット買取の検索結果(page);
    const tags = (タグ数 === 1 ? ["A"] : ["A", "B"]).map((s) => notes.get(`〔タグレコードID-F0503-${no}${s}〕`));
    let 説明 = "";
    let rows: 一覧の行[] = [];
    note(印の注記);
    note(`タグを検索条件に指定した一覧は、タグのIDで指定するアドレス（/ja/purchase/search/tag/${タグ数 === 1 ? "タグID" : "タグID-タグID"}）で開いた。一覧の上部の説明文は、一覧の上の説明の欄（タグに登録したフリーエリア）で読んだ`);
    await step(1, async () => { await 開く(r, `${一覧}/tag/${tags.join("-")}`); });
    await step(2, async () => {
      説明 = (await r.説明の欄.count()) ? ((await r.説明の欄.first().textContent()) ?? "").replace(/\s+/g, " ").trim() : "";
      rows = await 読む(r, "商品一覧");
      note(`一覧の上部の説明の欄: ${説明 || "（無い）"}`);
    });
    await expected(async () => {
      if (タグ数 === 1) expect.soft(説明, `一覧の上部に説明文「F0503-CB${no}-DESC-A」が表示された`).toContain(`F0503-CB${no}-DESC-A`);
      else {
        expect.soft(説明, `説明文「F0503-CB${no}-DESC-A」が表示されない`).not.toContain(`F0503-CB${no}-DESC-A`);
        expect.soft(説明, `説明文「F0503-CB${no}-DESC-B」が表示されない`).not.toContain(`F0503-CB${no}-DESC-B`);
      }
      expect.soft(名(rows), `商品一覧に「F0503-CB${no}-BASE」が表示された`).toContain(rc(`F0503-CB${no}-BASE`));
      if (TARGET) expect.soft(名(rows), `商品一覧に「F0503-CB${no}-TARGET」が表示されない`).not.toContain(rc(`F0503-CB${no}-TARGET`));
    });
  };
}
caseTest("IT-F05-03-057", タグのケース("057", 1, true));
caseTest("IT-F05-03-058", タグのケース("058", 2, true));
caseTest("IT-F05-03-059", タグのケース("059", 1, true));
caseTest("IT-F05-03-060", タグのケース("060", 1, true));
caseTest("IT-F05-03-061", タグのケース("061", 1, true));
caseTest("IT-F05-03-062", タグのケース("062", 2, true));
caseTest("IT-F05-03-063", タグのケース("063", 2, true));
caseTest("IT-F05-03-064", タグのケース("064", 2, true));
caseTest("IT-F05-03-066", タグのケース("066", 1, false));
caseTest("IT-F05-03-068", タグのケース("068", 2, false));

caseTest("IT-F05-03-065", async ({ page, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  note(印の注記);
  note("検索条件が無いときは、アプリが検索サービスへ問い合わせない（一覧本文は読み込み中の表示のまま）。読み込みが落ち着くのを待ってから数えた");
  await step(1, async () => {
    expect(await r.開く(一覧), "ネット買取商品一覧の応答").toBeLessThan(400);
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
  });
  await expected(async () => {
    await expect.soft(page.locator("#purchase-search-form"), "検索フォームが表示されている").toBeVisible();
    expect.soft(await r.行.count(), "商品一覧（行）が表示されない").toBe(0);
    expect.soft(((await page.locator("body").textContent()) ?? ""), `商品「F0503-CB065-BASE」が表示されない`).not.toContain(rc("F0503-CB065-BASE"));
    expect.soft(((await page.locator("body").textContent()) ?? ""), "説明文「F0503-CB065-DESC-A」が表示されない").not.toContain("F0503-CB065-DESC-A");
  });
});
