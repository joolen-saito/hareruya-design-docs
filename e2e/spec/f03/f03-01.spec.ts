/**
 * F03-01 商品一覧。正本: cases/F03-01_test_cases.tsv
 *
 * 2026-10-30: 商品を作らず索引へ反映しなくても成り立つケース（003・008・012・018・019）。
 * 2026-11-10: 依頼者の方針（テストデータは既存データ、または画面から作ったデータに読み替えてよい）で、
 *   シードが既存のカテゴリ・商品を公開側の画面で探して使うケースと、会員・お気に入り・入荷通知・バナー確認のカテゴリを画面で作るケースを足した。
 *   読み替えはシードが「シード作成時の問題」としてエビデンスの注記に残す。手順・期待結果の読み替えは、ケースの「手順の注記」に残す。
 * 実装しないケース（索引への反映・DBでの準備が要り、既存データでも前提を満たせないもの）は記録 e2e/review/F03-01_progress_2026-11-10.md。
 */
import { Locator, Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { お気に入りの件数, 有効な入荷通知依頼の件数 } from "../../db/f03_01";
import { FrontDetailSearch } from "../../pages/front/f03_03_detail_search";
import { FrontProductList, カード情報, カートの中身, 通信の記録, 店舗の入口 } from "../../pages/front/f03_01_product_list";
import { FrontRecent } from "../../pages/front/f03_06_recent";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import { 会員のパスワード, 見つけた } from "../../seeds/f03-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const pathOf = (url: string) => new URL(url).pathname;

caseTest("IT-F03-01-003", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const 遷移先: Record<string, string> = {};
  await step(1, async () => {
    expect(await list.open(店舗の入口.本店), "本店の商品一覧の応答").toBeLessThan(400);
    await list.パンくずのホームを押す();
    遷移先["本店"] = pathOf(page.url());
  });
  await step(2, async () => {
    expect(await list.open(店舗の入口.TC大阪支店), "TC大阪支店の商品一覧の応答").toBeLessThan(400);
    await list.パンくずのホームを押す();
    遷移先["TC大阪支店"] = pathOf(page.url());
  });
  await expected(async () => {
    expect.soft(遷移先["本店"], "本店でパンくずの🏠を押したあとの画面（本店TOP）").toBe("/ja/");
    expect.soft(遷移先["TC大阪支店"], "TC大阪支店でパンくずの🏠を押したあとの画面（TC大阪支店TOP）").toBe("/ja/osaka/");
  });
});

caseTest("IT-F03-01-008", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const search = new FrontDetailSearch(page);
  const 開いた: Record<string, boolean> = {};
  await step(1, async () => { expect(await list.open(店舗の入口.本店), "商品一覧の応答").toBeLessThan(400); });
  await step(2, async () => {
    await list.画面上部の商品詳細検索().click({ timeout: 30_000 });
    await expect(search.モーダル, "画面上部の商品詳細検索を押したあとのモーダル").toHaveClass(/is-visible/);
    開いた["画面上部の商品詳細検索ボタン"] = await search.モーダルが開いている();
  });
  await step(3, async () => {
    await search.閉じるボタン.click({ timeout: 30_000 });
    expect(await search.開閉後のモーダル(), "商品詳細検索を閉じたあと").toBe(false);
  });
  await step(4, async () => {
    const 押したもの = await list.絞り込み領域の詳細検索を押す();
    if (押したもの !== "絞り込み領域の詳細検索ボタン") note("固定のヘッダーが絞り込み領域の「詳細検索」ボタンを覆って押せなかったため、画面上部の「詳細検索」ボタンを押した");
    await expect(search.モーダル, "絞り込み領域の詳細検索を押したあとのモーダル").toHaveClass(/is-visible/);
    開いた["絞り込み領域の詳細検索ボタン"] = await search.モーダルが開いている();
  });
  await expected(async () => {
    expect.soft(開いた["画面上部の商品詳細検索ボタン"], "画面上部の商品詳細検索ボタンで、商品詳細検索がモーダルで表示された").toBe(true);
    expect.soft(開いた["絞り込み領域の詳細検索ボタン"], "絞り込み領域の詳細検索ボタンで、商品詳細検索がモーダルで表示された").toBe(true);
  });
});

caseTest("IT-F03-01-012", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const 指定: Record<string, string[]> = {};
  await step(1, async () => {
    expect(await list.open(店舗の入口.本店), "本店の商品一覧の応答").toBeLessThan(400);
    await list.描画を待つ();
    指定["本店"] = await list.ロボット向け指定();
  });
  await step(2, async () => {
    expect(await list.open(店舗の入口.TC大阪支店), "TC大阪支店の商品一覧の応答").toBeLessThan(400);
    await list.描画を待つ();
    指定["TC大阪支店"] = await list.ロボット向け指定();
  });
  await expected(async () => {
    note(`headのロボット向け指定: 本店=[${指定["本店"].join(",")}]、TC大阪支店=[${指定["TC大阪支店"].join(",")}]`);
    expect.soft(指定["TC大阪支店"].some((c) => /noindex/i.test(c)), "TC大阪支店の商品一覧にnoindexの指定がある").toBe(true);
    expect.soft(指定["本店"].some((c) => /noindex/i.test(c)), "本店の商品一覧にnoindexの指定がある（無いはず）").toBe(false);
  });
});

caseTest("IT-F03-01-018", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  await step(1, async () => {
    expect(await list.open(店舗の入口.本店), "商品一覧の応答").toBeLessThan(400);
    await list.描画を待つ();
  });
  await expected(async () => {
    await expect.soft(list.検索フォーム, "検索フォーム").toBeVisible();
    expect.soft(await list.ログイン用フォーム.count(), "ログイン用フォームの数").toBeGreaterThan(0);
    expect.soft(await list.商品カード.count(), "表示されている商品（商品カードの数）").toBe(0);
    await expect.soft(list.商品の一覧, "商品の一覧").toHaveCount(0);
    await expect.soft(list.商品数, "商品数の表示").toHaveCount(0);
    await expect.soft(list.ページ送り, "ページ送り").toHaveCount(0);
  });
});

caseTest("IT-F03-01-019", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  let 応答 = 0;
  await step(1, async () => {
    応答 = await list.open(店舗の入口.本店, "/products/search/cate/999");
    await list.描画を待つ();
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "表示している画面（商品一覧画面に留まる）").toMatch(/^\/ja\/products\/search/);
    expect.soft(応答, "画面の応答（エラー画面でなく商品一覧画面が開く）").toBeLessThan(400);
    expect.soft(await list.商品カード.count(), "表示されている商品（商品カードの数）").toBe(0);
    await expect.soft(list.商品の一覧, "商品の一覧").toHaveCount(0);
  });
});

// ==================== 2026-11-10 に足したケース ====================

const 本店 = 店舗の入口.本店;
const 支店 = 店舗の入口.TC大阪支店;
/** シードが控えた「商品ID|言語」を分ける */
const 分ける = (v: string) => { const [id, lang] = v.split("|"); return { id, lang: lang ?? "" }; };
/** 設計の1ページ最大件数（設計書 L0188「ページングの1ページあたり最大60件」） */
const 一ページの件数 = 60;

/** カードを読んで、無ければ落とす（シードが見つけた商品が、ケースの時点でも一覧の1ページ目に出ていること） */
async function カードを引く(list: FrontProductList, 商品ID: string, 言語 = ""): Promise<{ card: Locator; info: カード情報 }> {
  const info = await list.カード1枚を読む(商品ID, 言語);
  if (!info) throw new Error(`商品ID ${商品ID}${言語 ? `（${言語}）` : ""} のカードが商品一覧の1ページ目に無い（シードで見つけたあとに並びが変わった）`);
  return { card: list.カード(商品ID, 言語), info };
}

/** 状態の行が閉じた「他の状態」の中にあれば、「他の状態」を押して開く（開いたら注記を残す） */
async function 行を見えるようにする(list: FrontProductList, card: Locator, row: Locator, what: string): Promise<void> {
  if (await list.行が見えている(row)) return;
  const toggle = list.カードの他の状態ボタン(card);
  if ((await toggle.count()) > 0 && (await toggle.isVisible())) {
    await toggle.click();
    await list.page.waitForTimeout(800);
    note(`${what}の行は閉じた「他の状態」の中にあったため、「他の状態」を押して開いてから操作した`);
  }
}

/** 状態の行の数量を、プラス・マイナスを押して target にする（押した回数を返す） */
async function 数量をそろえる(list: FrontProductList, card: Locator, row: Locator, target: number, what: string): Promise<number> {
  // 状態が1つだけのカードは、行に規格IDの印が無い（先頭の行がその状態）
  if ((await row.count()) === 0) row = list.カードの先頭の行(card);
  await 行を見えるようにする(list, card, row, what);
  let n = 0;
  for (; n < 40; n++) {
    const cur = await list.行の数量の値(row);
    if (cur === target) return n;
    await (cur < target ? list.行のプラス(row) : list.行のマイナス(row)).click();
  }
  throw new Error(`${what}の数量を ${target} にできない（いま ${await list.行の数量の値(row)}）`);
}

// ---- 検索語 ----

caseTest("IT-F03-01-020", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-UNISEARCH-ZERO-020");
  await step(1, async () => {
    await list.open(本店);
    await list.ヘッダーで検索する(f.検索語);
    note(`商品名「F0301-ZERO-020」は、実行ごとの印を付けた「${f.検索語}」で検索した（商品一覧画面のヘッダーの商品検索）`);
  });
  await expected(async () => {
    expect.soft(await list.本表示のカード.count(), "表示された商品の内容（商品カードの数）").toBe(0);
    await expect.soft(list.該当なしの案内, "該当商品がないことを示す案内（お探しの商品は見つかりませんでした）").toBeVisible();
  });
});

caseTest("IT-F03-01-021", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-UNISEARCH-MANY-021");
  let 件数: number | null = null;
  await step(1, async () => {
    await list.open(本店);
    await list.ヘッダーで検索する(f.検索語);
    件数 = await list.商品数の値();
    note(`商品名「F0301-MANY-021」（4001件）は、既存の商品で4000件を超えて当たる検索語「${f.検索語}」で検索した（商品数の表示: ${件数 ?? "読めない"}点）`);
  });
  await expected(async () => {
    expect.soft(件数 ?? 0, "検索語に一致する商品数（上限4000件を超えている前提の確認）").toBeGreaterThan(4000);
    expect.soft(await list.本表示のカード.count(), "表示された商品の内容（商品カードの数）").toBe(0);
    await expect.soft(list.多すぎるの案内, "検索条件の追加を案内する領域（ご指定の条件に一致する商品が多すぎます…）").toBeVisible();
  });
});

// ---- ページ送り ----

/** ページ送りの番号を押して、そのページへ移ったか */
function ページへ移る(seedId: string, label: string, where: "上部" | "下部", 開くページ: number, 押す: "3" | "前へ", 移る先: number) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const list = new FrontProductList(page);
    const id = notes.get(label);
    const f = 見つけた(seedId);
    await step(1, async () => {
      await list.openCategory(本店, id, 開くページ > 1 ? `pageno=${開くページ}` : "");
      note(`カテゴリは既存のカテゴリ（カテゴリID ${id}・商品数 ${f.件数}点）。1ページ最大件数は設計の60件のまま（${Math.ceil(Number(f.件数) / 一ページの件数)}ページ）`);
    });
    await step(2, async () => {
      const item = 押す === "前へ" ? list.前へ(where) : list.ページ番号の項目(where, 3);
      await expect(item, `${where}のページ送りの「${押す === "前へ" ? "<" : "3"}」`).toBeVisible();
      if (押す === "前へ") { await item.scrollIntoViewIfNeeded(); await item.locator("a").first().click(); await list.結果を待つ(); }
      else await list.ページ送りを押す(item);
    });
    await expected(async () => {
      expect.soft(list.アドレスのページ(), "アドレスのページ番号").toBe(移る先);
      expect.soft(await list.表示中のページ("上部"), "ページ送りの表示中のページ").toBe(String(移る先));
      expect.soft(await list.本表示のカード.count(), `${移る先}ページ目の商品（商品カードの数）`).toBeGreaterThan(0);
    });
  };
}
caseTest("IT-F03-01-025", ページへ移る("S-F03-01-PAGING-025", "〔カテゴリレコードID-F0301-025〕", "上部", 1, "3", 3));
caseTest("IT-F03-01-026", ページへ移る("S-F03-01-PAGING-026", "〔カテゴリレコードID-F0301-026〕", "上部", 3, "前へ", 2));
caseTest("IT-F03-01-074", ページへ移る("S-F03-01-PAGEBTM-074", "〔カテゴリレコードID-F0301-074〕", "下部", 1, "3", 3));
caseTest("IT-F03-01-075", ページへ移る("S-F03-01-PAGEBTMPREV-075", "〔カテゴリレコードID-F0301-075〕", "下部", 3, "前へ", 2));

caseTest("IT-F03-01-068", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const id = notes.get("〔カテゴリレコードID-F0301-068〕");
  let 状態 = { リンク: true, 指先の形: "" };
  await step(1, async () => {
    await list.openCategory(本店, id);
    note("1ページ最大件数5・商品11件（3ページ）は、既存のカテゴリ（設計の1ページ最大60件で3ページ以上）に読み替えた");
  });
  await step(2, async () => { await list.ページ送りを押す(list.ページ番号の項目("上部", 2)); });
  await step(3, async () => { await list.ページ番号の項目("上部", 2).hover(); });
  await step(4, async () => { 状態 = await list.リンクか(list.ページ番号の項目("上部", 2)); });
  await expected(async () => {
    expect.soft(await list.表示中のページ("上部"), "上部のページ送りの表示中のページ").toBe("2");
    expect.soft(状態.リンク, "表示中の2がページ遷移のリンクになっている").toBe(false);
    expect.soft(状態.指先の形, "表示中の2にマウスを重ねたときの指先の形（押せる形でない）").not.toBe("pointer");
  });
});

caseTest("IT-F03-01-071", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const id = notes.get("〔カテゴリレコードID-F0301-071〕");
  let 状態 = { リンク: true, 指先の形: "" };
  await step(1, async () => {
    await list.openCategory(本店, id);
    note("1ページ最大件数5・商品81件（17ページ）は、既存のカテゴリ（設計の1ページ最大60件で3ページ以上）に読み替えた");
  });
  await step(2, async () => {
    await expect(list.省略の項目("上部"), "上部のページ送りの「...」").toBeVisible();
    await list.省略の項目("上部").hover();
  });
  await step(3, async () => { 状態 = await list.リンクか(list.省略の項目("上部")); });
  await expected(async () => {
    expect.soft(状態.リンク, "「...」がページ遷移のリンクになっている").toBe(false);
    expect.soft(状態.指先の形, "「...」にマウスを重ねたときの指先の形（押せる形でない）").not.toBe("pointer");
  });
});

function 省略の形(seedId: string, label: string, 最後のページで開く: boolean) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const list = new FrontProductList(page);
    const id = notes.get(label);
    const 件数 = Number(見つけた(seedId).件数);
    const last = Math.ceil(Math.min(件数, 4000) / 一ページの件数);
    let 並び: string[] = [];
    await step(1, async () => {
      await list.openCategory(本店, id, 最後のページで開く ? `pageno=${last}` : "");
      note(`1ページ最大件数5・商品81件（17ページ）は、既存のカテゴリ（商品数 ${件数}点・設計の1ページ最大60件で${last}ページ）に読み替えた。期待結果の「17」は${last}として確かめる`);
    });
    await step(2, async () => { 並び = await list.ページ送りの並び("上部"); });
    await expected(async () => {
      const want = 最後のページで開く
        ? ["1", "...", ...[4, 3, 2, 1, 0].map((d) => String(last - d))]
        : ["1", "2", "3", "4", "5", "...", String(last)];
      expect.soft(並び.join(" "), "上部のページ送りの並び").toBe(want.join(" "));
    });
  };
}
caseTest("IT-F03-01-069", 省略の形("S-F03-01-PAGEMORE-069", "〔カテゴリレコードID-F0301-069〕", false));
caseTest("IT-F03-01-070", 省略の形("S-F03-01-PAGEMORE-070", "〔カテゴリレコードID-F0301-070〕", true));

caseTest("IT-F03-01-054", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const id = notes.get("〔カテゴリレコードID-F0301-054〕");
  const rec = new 通信の記録(page);
  const 手順の記録: Record<number, { 文書: number; 検索: number; url: string }> = {};
  const 記録する = async (n: number, body: () => Promise<void>) => {
    const from = rec.位置;
    await body();
    手順の記録[n] = { 文書: rec.件数("画面の文書", from), 検索: rec.件数("商品検索", from), url: page.url() };
  };
  await step(1, async () => { rec.開始(); });
  await step(2, async () => { await list.openCategory(本店, id); note("ページング確認カテゴリ-054（神話レアの商品121件）は、既存のカテゴリに読み替えた"); });
  await step(3, async () => { await 記録する(3, () => list.ページ送りを押す(list.ページ番号の項目("上部", 2))); });
  await step(4, async () => {
    const names = (await list.並び順の名前()).filter((n) => n !== "おすすめ順");
    const pick = names.includes("価格(高い順)") ? "価格(高い順)" : names[0];
    await 記録する(4, () => list.並び順を選ぶ(pick));
    note(`おすすめ順以外の並び順として「${pick}」を選んだ`);
  });
  await step(5, async () => { await 記録する(5, () => list.絞り込みを押す(list.絞り込みボタン("rarity", "神話レア"))); });
  await step(6, async () => {
    rec.終了();
    note(`手順ごとの通信: ${[3, 4, 5].map((n) => `手順${n}=画面の文書${手順の記録[n]?.文書}件・商品検索${手順の記録[n]?.検索}件`).join("／")}`);
  });
  await expected(async () => {
    for (const n of [3, 4, 5]) {
      expect.soft(手順の記録[n]?.文書 ?? -1, `手順${n}で画面の文書の再取得が発生した件数`).toBe(0);
      expect.soft(手順の記録[n]?.検索 ?? 0, `手順${n}で商品一覧の結果部分を取り直した（商品検索の問い合わせの件数）`).toBeGreaterThan(0);
    }
    expect.soft(手順の記録[3]?.url ?? "", "手順3のあとのアドレス（2ページ目）").toMatch(/[?&]pageno=2\b/);
  });
});

caseTest("IT-F03-01-059", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const id = notes.get("〔カテゴリレコードID-F0301-059〕");
  const rec = new 通信の記録(page);
  await step(1, async () => { rec.開始(); });
  await step(2, async () => { await list.openCategory(本店, id); note("ページング確認カテゴリ-059（商品61件）は、既存のカテゴリに読み替えた"); });
  await step(3, async () => { await page.waitForTimeout(2000); rec.終了(); });
  await expected(async () => {
    expect.soft(rec.件数("関連ワード検索"), "関連ワード検索API（/products/search/unisearch_rword_api）への通信の件数").toBe(0);
    await expect.soft(list.関連キーワード, "関連ワード（関連キーワードの領域）").toBeHidden();
    expect.soft(rec.件数("商品検索"), "商品一覧の検索（商品検索の問い合わせ）が行われた").toBeGreaterThan(0);
  });
});

// ---- 並び順 ----

caseTest("IT-F03-01-028", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-SORT-028");
  const 選ばれた: Record<string, string> = {};
  await step(1, async () => {
    await list.open(本店);
    await list.ヘッダーで検索する(f.検索語);
    選ばれた["キーワード検索"] = await list.選ばれている並び順();
    note(`商品名「F0301-SORT-028」は、既存の商品名「${f.検索語}」で検索した`);
  });
  await step(2, async () => {
    await list.左メニューのカテゴリを押す(f.リンク);
    選ばれた["左メニューのカテゴリ"] = await list.選ばれている並び順();
    note(`カテゴリ「SORT-CATEGORY」は、左メニューの既存のカテゴリ「${f.カテゴリ名}」（並び順の指定なし）を押した`);
  });
  await expected(async () => {
    expect.soft(選ばれた["キーワード検索"], "キーワード検索の初期の並び順").toBe("おすすめ順");
    expect.soft(選ばれた["左メニューのカテゴリ"], "左メニューのカテゴリ検索の初期の並び順").toBe("色順");
  });
});

caseTest("IT-F03-01-029", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const id = notes.get("〔カテゴリレコードID-F0301-029〕");
  const f = 見つけた("S-F03-01-SORT-029");
  const 高 = 分ける(f.高), 中 = 分ける(f.中), 低 = 分ける(f.低);
  const 並び: Record<string, { key: string; 価格: number | null }[]> = {};
  const 読む = async () => (await list.カードを読む()).map((c) => ({ key: `${c.商品ID}|${c.言語}`, 価格: c.行[0]?.価格 ?? null }));
  await step(1, async () => {
    await list.openCategory(本店, id);
    await list.並び順を選ぶ("価格(高い順)");
    並び["高い順"] = await 読む();
    note("SORT-HIGH-029・SORT-MID-029・SORT-LOW-029 は、既存のカテゴリの最も高い・中ほど・最も安い商品に読み替えた（カテゴリにはほかの商品もある）");
  });
  await step(2, async () => { await list.並び順を選ぶ("価格(低い順)"); 並び["低い順"] = await 読む(); });
  await expected(async () => {
    const pos = (k: string, which: string) => 並び[which].findIndex((x) => x.key === k);
    const keys = [`${高.id}|${高.lang}`, `${中.id}|${中.lang}`, `${低.id}|${低.lang}`];
    const 高い順の位置 = keys.map((k) => pos(k, "高い順"));
    const 低い順の位置 = keys.map((k) => pos(k, "低い順"));
    expect.soft(高い順の位置.every((p) => p >= 0) && 高い順の位置[0] < 高い順の位置[1] && 高い順の位置[1] < 高い順の位置[2],
      `価格(高い順)で最も高い・中ほど・最も安い商品がこの順に並ぶ（並びの位置 ${高い順の位置.join("・")}）`).toBe(true);
    expect.soft(低い順の位置.every((p) => p >= 0) && 低い順の位置[2] < 低い順の位置[1] && 低い順の位置[1] < 低い順の位置[0],
      `価格(低い順)で最も安い・中ほど・最も高い商品がこの順に並ぶ（並びの位置 ${低い順の位置.join("・")}）`).toBe(true);
    const prices = (which: string) => 並び[which].map((x) => x.価格).filter((p): p is number => p !== null);
    const 高い順 = prices("高い順"), 低い順 = prices("低い順");
    expect.soft(高い順.join(","), "価格(高い順)の表示価格の並び（高い順にそろう）").toBe([...高い順].sort((a, b) => b - a).join(","));
    expect.soft(低い順.join(","), "価格(低い順)の表示価格の並び（安い順にそろう）").toBe([...低い順].sort((a, b) => a - b).join(","));
  });
});

// ---- 商品カード ----

caseTest("IT-F03-01-034", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const cat = notes.get("〔カテゴリレコードID-F0301-034〕");
  const pid = notes.get("〔商品レコードID-F0301-034〕");
  const ex = notes.get("〔規格レコードID-F0301-034B〕");
  const f = 見つけた("S-F03-01-STATES-034");
  let 状態名 = "";
  await step(1, async () => { await list.openCategory(本店, cat); });
  await step(2, async () => {
    const { card } = await カードを引く(list, pid, f.言語);
    const row = list.カードの状態の行(card, ex);
    await 行を見えるようにする(list, card, row, "他の状態");
    const link = row.locator("a.p-hareruya-product-card__condition").first();
    状態名 = ((await link.innerText()) ?? "").trim();
    note(`EX は、この商品の他の状態「${状態名}」（規格ID ${ex}）のリンクを押した`);
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await page.waitForLoadState("load");
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "移った先の画面（商品詳細画面）").toBe(`/ja/products/detail/${pid}`);
    await expect.soft(page.locator('[id^="priceTable-"]:visible').first(), `商品詳細画面に状態「${状態名}」が表示される`).toContainText(状態名);
  });
});

caseTest("IT-F03-01-035", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const cat = notes.get("〔カテゴリレコードID-F0301-035〕");
  const pid = notes.get("〔商品レコードID-F0301-035〕");
  const f = 見つけた("S-F03-01-STATES-035");
  let カードID = "";
  await step(1, async () => { await list.openCategory(本店, cat); });
  await step(2, async () => {
    const { card } = await カードを引く(list, pid, f.言語);
    const link = list.カードの同名商品(card);
    カードID = new URL((await link.getAttribute("href")) ?? "", page.url()).searchParams.get("cardId") ?? "";
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await list.結果を待つ();
    note(`同名商品検索のリンクが指すカードID: ${カードID || "（読めない）"}`);
  });
  await expected(async () => {
    expect.soft(カードID, "同名商品検索が指すカードID（商品のカードID）").not.toBe("");
    expect.soft(pathOf(page.url()), "移った先の画面（商品一覧画面）").toMatch(/^\/ja\/products\/search/);
    expect.soft(new URL(page.url()).searchParams.get("cardId"), "移った先の検索条件のカードID").toBe(カードID);
    expect.soft(await list.本表示のカード.count(), "同じカードIDの商品が一覧に表示される").toBeGreaterThan(0);
  });
});

caseTest("IT-F03-01-037", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const pid = notes.get("〔商品レコードID-F0301-037〕");
  const f = 見つけた("S-F03-01-STATES-037");
  let info: カード情報 | undefined;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-037〕")); });
  await step(2, async () => {
    info = (await カードを引く(list, pid, f.言語)).info;
    note(`状態: ${info.行.map((x) => `${x.状態} 在庫${x.在庫}`).join("／")}`);
  });
  await expected(async () => {
    expect.soft(info?.行[0]?.在庫, "表示中の状態（NMに読み替え）の在庫").toBe(0);
    expect.soft(info?.他の状態があります, "他の状態が存在することを示す表示（他の状態があります）").toBe(true);
  });
});

caseTest("IT-F03-01-038", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const pid = notes.get("〔商品レコードID-F0301-038〕");
  const a = notes.get("〔規格レコードID-F0301-038A〕"), b = notes.get("〔規格レコードID-F0301-038B〕");
  const f = 見つけた("S-F03-01-QTY-038");
  let info: カード情報 | undefined;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-038〕")); });
  await step(2, async () => {
    info = (await カードを引く(list, pid, f.言語)).info;
    note(`NM は表示中の状態（規格ID ${a}）、EX は在庫のある状態のうち最も高い状態（規格ID ${b}）に読み替えた。状態: ${info.行.map((x) => `${x.状態} ${x.価格}円 在庫${x.在庫} 数量${x.数量}`).join("／")}`);
  });
  await expected(async () => {
    const q = (id: string) => info?.行.find((x) => x.規格ID === id)?.数量;
    expect.soft(q(b), "在庫のある状態のうち最大価格の状態（EXに読み替え）の商品数").toBe(1);
    expect.soft(q(a), "表示中の状態（NMに読み替え）の商品数").toBe(0);
  });
});

caseTest("IT-F03-01-040", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const pid = notes.get("〔商品レコードID-F0301-040〕");
  const f = 見つけた("S-F03-01-QTY-040");
  let row!: Locator; let 在庫 = 0; let 押したあと = -1; let 戻したあと = -1; let 初め = -1;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-040〕")); });
  await step(2, async () => {
    const { card, info } = await カードを引く(list, pid, f.言語);
    const target = info.行.find((x) => x.増減あり && x.見えている && x.数量 === 0 && (x.在庫 ?? 0) >= 1);
    if (!target) throw new Error("数量0で在庫のある状態の行が無い（シードで見つけたあとに変わった）");
    row = list.カードの状態の行(card, target.規格ID);
    if ((await row.count()) === 0) row = list.カードの先頭の行(card);
    在庫 = target.在庫 ?? 0;
    初め = await list.行の数量の値(row);
    note(`NM（在庫3）は、表示の初めの数量が0の状態「${target.状態}」（在庫${在庫}）に読み替えた`);
    await list.行のマイナス(row).click();
  });
  await step(3, async () => { 押したあと = await list.行の数量の値(row); });
  await step(4, async () => { await list.行のプラス(row).click(); 戻したあと = await list.行の数量の値(row); });
  await expected(async () => {
    expect.soft(初め, "表示の初めの商品数").toBe(0);
    expect.soft(押したあと, `商品数0でマイナスを押したあとの商品数（在庫数 ${在庫}）`).toBe(在庫);
    expect.soft(戻したあと, "在庫数の商品数でプラスを押したあとの商品数").toBe(0);
  });
});

caseTest("IT-F03-01-041", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-QTY-041");
  let info: カード情報 | undefined;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-041〕")); });
  await step(2, async () => { info = (await カードを引く(list, notes.get("〔商品レコードID-F0301-041〕"), f.言語)).info; });
  await expected(async () => {
    expect.soft(info?.行.every((x) => x.在庫 === 0), "すべての状態の在庫が0（前提の確認）").toBe(true);
    expect.soft(info?.増減の部品, "表示されたマイナス・商品数・プラスの数").toBe(0);
    expect.soft(info?.カートボタン, "カートに入れるが表示されている").toBe(false);
  });
});

function カートへ入れる(o: { seedId: string; n: string; 数量: (info: カード情報, notes: { get(l: string): string }) => { id: string; 数量: number; 名: string }[]; 期待: (info: カード情報, notes: { get(l: string): string }) => { id: string; 数量: number; 名: string }[]; 手順: 3 | 4 }) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const list = new FrontProductList(page);
    const pid = notes.get(`〔商品レコードID-F0301-${o.n}〕`);
    const f = 見つけた(o.seedId);
    let info!: カード情報; let card!: Locator;
    let 応答 = { status: 0, body: "", 警告: [] as string[] };
    let cart: { 規格ID: string; 数量: number; 名前: string }[] = [];
    await step(1, async () => {
      await list.openCategory(本店, notes.get(`〔カテゴリレコードID-F0301-${o.n}〕`));
      ({ card, info } = await カードを引く(list, pid, f.言語));
      note(`状態: ${info.行.map((x) => `${x.状態}（規格ID ${x.規格ID}）${x.価格}円 在庫${x.在庫} 数量${x.数量}`).join("／")}`);
    });
    const 押す = async () => {
      応答 = await list.カートに入れるを押す(card);
      note(`カートに入れるの応答: ${応答.status}${応答.警告.length ? `／警告「${応答.警告.join(" / ")}」` : ""}`);
    };
    if (o.手順 === 4) {
      await step(2, async () => {
        for (const s of o.数量(info, notes)) await 数量をそろえる(list, card, list.カードの状態の行(card, s.id), s.数量, s.名);
      });
      await step(3, async () => { await 押す(); });
      await step(4, async () => { cart = await カートの中身(page); });
    } else {
      await step(2, async () => { await 押す(); });
      await step(3, async () => { cart = await カートの中身(page); });
    }
    await expected(async () => {
      const want = o.期待(info, notes);
      for (const w of want) {
        expect.soft(cart.find((c) => c.規格ID === w.id)?.数量 ?? 0, `カートの${w.名}（規格ID ${w.id}）の数量`).toBe(w.数量);
      }
      const others = cart.filter((c) => !want.some((w) => w.id === c.規格ID && w.数量 > 0));
      expect.soft(others.map((c) => `${c.名前}×${c.数量}`).join("／"), "カートに入った、ほかの商品・状態").toBe("");
    });
  };
}
const 最高価格の在庫あり = (info: カード情報) => info.行.filter((x) => (x.在庫 ?? 0) > 0).reduce((m, x) => ((x.価格 ?? 0) > (m.価格 ?? 0) ? x : m));

caseTest("IT-F03-01-042", カートへ入れる({
  seedId: "S-F03-01-QTY-042", n: "042", 手順: 4,
  数量: (_i, n) => [{ id: n.get("〔規格レコードID-F0301-042A〕"), 数量: 2, 名: "表示中の状態（NMに読み替え）" }, { id: n.get("〔規格レコードID-F0301-042B〕"), 数量: 1, 名: "他の状態（EXに読み替え）" }],
  期待: (_i, n) => [{ id: n.get("〔規格レコードID-F0301-042A〕"), 数量: 2, 名: "表示中の状態（NMに読み替え）" }, { id: n.get("〔規格レコードID-F0301-042B〕"), 数量: 1, 名: "他の状態（EXに読み替え）" }],
}));
caseTest("IT-F03-01-066", カートへ入れる({
  seedId: "S-F03-01-ZEROQTY-066", n: "066", 手順: 4,
  数量: (_i, n) => [{ id: n.get("〔規格レコードID-F0301-066A〕"), 数量: 0, 名: "表示中の状態（NMに読み替え）" }, { id: n.get("〔規格レコードID-F0301-066B〕"), 数量: 2, 名: "他の状態（EXに読み替え）" }],
  期待: (_i, n) => [{ id: n.get("〔規格レコードID-F0301-066A〕"), 数量: 0, 名: "表示中の状態（NMに読み替え）" }, { id: n.get("〔規格レコードID-F0301-066B〕"), 数量: 2, 名: "他の状態（EXに読み替え）" }],
}));
caseTest("IT-F03-01-079", カートへ入れる({
  seedId: "S-F03-01-QTY-079", n: "079", 手順: 3,
  数量: () => [],
  期待: (info) => [{ id: 最高価格の在庫あり(info).規格ID, 数量: 1, 名: "在庫のある状態のうち最も高い状態（EXに読み替え）" }, { id: info.行[0].規格ID, 数量: 0, 名: "表示中の状態（NMに読み替え）" }],
}));
caseTest("IT-F03-01-080", カートへ入れる({
  seedId: "S-F03-01-QTY-080", n: "080", 手順: 4,
  数量: (info) => [{ id: info.行[0].規格ID, 数量: info.行[0].在庫 ?? 0, 名: `状態「${info.行[0].状態}」（NMに読み替え・在庫${info.行[0].在庫}）` }],
  期待: (info) => [{ id: info.行[0].規格ID, 数量: info.行[0].在庫 ?? 0, 名: `状態「${info.行[0].状態}」（NMに読み替え）` }],
}));

caseTest("IT-F03-01-064", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const pid = notes.get("〔商品レコードID-F0301-064〕");
  const f = 見つけた("S-F03-01-OTHERBTN-064");
  let card!: Locator; let info!: カード情報; let 押す前 = true; let 押したあと = false; let 文 = "";
  let 他 !: カード情報["行"][number];
  await step(1, async () => {
    await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-064〕"));
    ({ card, info } = await カードを引く(list, pid, f.言語));
    他 = info.行.slice(1).find((x) => (x.在庫 ?? 0) > 0)!;
    note(`NM は表示中の状態「${info.行[0].状態}」、EX（500円）は在庫のある他の状態「${他.状態}」（${他.価格}円）に読み替えた`);
  });
  await step(2, async () => { 押す前 = await list.行が見えている(list.カードの状態の行(card, 他.規格ID)); });
  await step(3, async () => {
    const notice = list.カードの他の状態があります(card);
    await expect(notice, "「他の状態があります」").toBeVisible();
    await notice.click();
    await page.waitForTimeout(1000);
    押したあと = await list.行が見えている(list.カードの状態の行(card, 他.規格ID));
    文 = await list.行の文(list.カードの状態の行(card, 他.規格ID));
  });
  await expected(async () => {
    expect.soft(押す前, "「他の状態があります」を押す前に、他の状態（EXに読み替え）が見えている").toBe(false);
    expect.soft(押したあと, "「他の状態があります」を押したあとに、他の状態（EXに読み替え）が見えている").toBe(true);
    expect.soft(文, `他の状態の表示に販売価格（${他.価格}円）が出ている`).toContain((他.価格 ?? 0).toLocaleString("ja-JP"));
  });
});

caseTest("IT-F03-01-065", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-GOODSLINK-065");
  let info: カード情報 | undefined;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-065〕")); });
  await step(2, async () => { info = (await カードを引く(list, notes.get("〔商品レコードID-F0301-065〕"), f.言語)).info; note(`グッズ商品F0301-065-Gは、既存のグッズ商品「${info.表示名}」に読み替えた`); });
  await expected(async () => {
    expect.soft(info?.カード商品, "カード商品の状態の表示がある（グッズ商品の確認）").toBe(false);
    expect.soft(info?.同名商品, "同名商品検索が表示されている").toBe(false);
  });
});

caseTest("IT-F03-01-072", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-IMGZOOM-072");
  let 画像 = "";
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-072〕")); });
  await step(2, async () => {
    const { card, info } = await カードを引く(list, notes.get("〔商品レコードID-F0301-072〕"), f.言語);
    画像 = info.画像;
    await list.カードの画像(card).click();
    await page.waitForTimeout(800);
  });
  await expected(async () => {
    const file = 画像.split("/").pop() ?? "";
    await expect.soft(list.拡大画像, "商品画像の拡大画像").toBeVisible();
    expect.soft((await list.拡大画像.getAttribute("src").catch(() => "")) ?? "", `拡大画像が商品の画像（${file}）`).toContain(file);
  });
});

caseTest("IT-F03-01-081", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-MIXSTOCK-081");
  const A = 分ける(f.A), B = 分ける(f.B);
  let a: カード情報 | undefined, b: カード情報 | undefined;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-081〕")); });
  await step(2, async () => {
    a = (await カードを引く(list, A.id, A.lang)).info;
    b = (await カードを引く(list, B.id, B.lang)).info;
    note(`F0301-081-A は在庫のある「${a.表示名}」（在庫${a.行[0]?.在庫}）、F0301-081-B は在庫0の「${b.表示名}」に読み替えた`);
  });
  await expected(async () => {
    expect.soft(a?.増減の部品, "在庫のある商品のマイナス・商品数・プラスの数").toBe(3);
    expect.soft(a?.カートボタン, "在庫のある商品のカートに追加").toBe(true);
    expect.soft(b?.増減の部品, "在庫0の商品のマイナス・商品数・プラスの数").toBe(0);
    expect.soft(b?.カートボタン, "在庫0の商品のカートに追加").toBe(false);
  });
});

// ---- スマートフォン幅 ----

function スマホ幅(seedId: string, n: string, 見る: "カテゴリ一覧" | "カードタイプ") {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const list = new FrontProductList(page);
    const f = 見つけた(seedId);
    await page.setViewportSize({ width: 375, height: 812 });
    await step(1, async () => { await list.openCategory(本店, notes.get(`〔カテゴリレコードID-F0301-${n}〕`)); });
    await step(2, async () => { note(`F0301-${n}-A は、既存のカテゴリの商品「${f.商品名}」（商品ID ${f.商品ID}）に読み替えた（カテゴリにはほかの商品もある）`); });
    await expected(async () => {
      await expect.soft(list.カード(f.商品ID, f.言語), `商品「${f.商品名}」が表示されている`).toBeVisible();
      if (見る === "カテゴリ一覧") await expect.soft(list.カテゴリ一覧.first(), "カテゴリ一覧").toBeHidden();
      else await expect.soft(list.カードタイプの絞り込み.first(), "絞り込み領域のカードタイプ").toBeHidden();
    });
  };
}
caseTest("IT-F03-01-062", スマホ幅("S-F03-01-SPCAT-062", "062", "カテゴリ一覧"));
caseTest("IT-F03-01-063", スマホ幅("S-F03-01-SPTYPE-063", "063", "カードタイプ"));

// ---- 絞り込み・タグ・ヘッダー検索・最近チェックした商品 ----

caseTest("IT-F03-01-053", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const 欄: { name: string; value: string }[] = [];
  let url = ""; let パンくず = "";
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-053〕")); note("絞り込み確認カテゴリ-053 は既存のカテゴリに読み替えた"); });
  await step(2, async () => {
    for (const [row, label] of [["rarity", "レア"], ["colors", "赤"]] as const) {
      const btn = list.絞り込みボタン(row, label);
      欄.push(await list.絞り込みの欄(btn));
      await list.絞り込みを押す(btn);
    }
  });
  await step(3, async () => { url = page.url(); パンくず = await list.パンくずの文(); note(`アドレス: ${url}／パンくず: ${パンくず}`); });
  await expected(async () => {
    const params = new URL(url).searchParams;
    expect.soft(params.getAll(欄[0].name).includes(欄[0].value), `アドレスにレアの検索条件（${欄[0].name}=${欄[0].value}）`).toBe(true);
    expect.soft(params.getAll(欄[1].name).includes(欄[1].value), `アドレスに赤の検索条件（${欄[1].name}=${欄[1].value}）`).toBe(true);
    expect.soft(パンくず, "パンくずリストにレアの検索条件").toContain("レア");
    expect.soft(パンくず, "パンくずリストに赤の検索条件").toContain("赤");
  });
});

caseTest("IT-F03-01-050", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-TAGS-050");
  let tagId = "";
  await step(1, async () => {
    await list.open(本店);
    await expect(list.おすすめ商品から探す, "おすすめ商品から探す").toBeVisible();
    tagId = (await list.おすすめタグのリンク()).find((t) => t.name === "最新入荷アイテム")?.id ?? "";
  });
  await step(2, async () => { await list.おすすめタグを押す("最新入荷アイテム"); });
  await expected(async () => {
    expect.soft(tagId, "おすすめ商品から探すの「最新入荷アイテム」のタグ").not.toBe("");
    expect.soft(pathOf(page.url()), "移った先（最新入荷アイテムのタグで検索した商品一覧画面）").toBe(`/ja/products/search/tags/${tagId}`);
    expect.soft(await list.パンくずの文(), "パンくずに検索したタグ").toContain("最新入荷アイテム");
    await expect.soft(list.カード(notes.get("〔商品レコードID-F0301-050〕"), f.言語), `商品「${f.商品名}」（TAG-NEW-001-050 に読み替え）が表示されている`).toBeVisible();
  });
});

caseTest("IT-F03-01-076", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const 正本 = ["最新入荷アイテム", "最新値下げ品", "在庫復活商品", "スタンダード特集", "パイオニア特集", "モダン特集", "レガシー特集", "統率者特集", "プロモ特集", "パウパー特集", "ドキドキ商品", "初心者オススメ品", "超高額", "委託販売商品", "BOX", "パック", "サプライ", "晴れる屋オリジナル品", "テーマデッキ構築済み", "セット詰め合わせ", "Foilコーナー", "デッキセット"];
  let 名前: string[] = [];
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-076〕")); note("商品一覧確認カテゴリ-076 は既存のカテゴリに読み替えた"); });
  await step(2, async () => { await list.おすすめ商品から探す.scrollIntoViewIfNeeded(); 名前 = await list.おすすめタグの名前(); note(`表示されたタグ（${名前.length}件）: ${名前.join("、")}`); });
  await expected(async () => {
    expect.soft(名前.length, "おすすめ商品から探すのタグの数").toBe(22);
    expect.soft(正本.filter((n) => !名前.includes(n)).join("、"), "表示されていないタグ").toBe("");
    expect.soft(名前.filter((n) => !正本.includes(n)).join("、"), "22種のほかに表示されたタグ").toBe("");
  });
});

caseTest("IT-F03-01-052", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-UNISEARCH-NORMAL-052");
  await step(1, async () => {
    await list.open(本店, "/");
    await list.ヘッダーで検索する(f.検索語);
    note(`「F0301-NORMAL-052」は、既存の商品の商品名「${f.検索語}」で検索した`);
  });
  await expected(async () => {
    expect.soft(pathOf(page.url()), "移った先（商品一覧画面）").toMatch(/^\/ja\/products\/search/);
    await expect.soft(list.カード(notes.get("〔商品レコードID-F0301-052〕"), f.言語), `検索結果に対応する商品「${f.検索語}」（U-001-052 に読み替え）が表示されている`).toBeVisible();
  });
});

caseTest("IT-F03-01-007", async ({ page, notes, step, expected }) => {
  const r = new FrontRecent(page);
  const f = 見つけた("S-F03-01-RECENT-007");
  const 並び: Record<string, string[]> = {};
  await step(1, async () => { await r.商品詳細を開く(本店, notes.get("〔商品レコードID-F0301-007A〕")); });
  await step(2, async () => { await r.商品一覧を開く(本店); 並び["本店"] = await r.商品名の並び(); });
  await step(3, async () => { await r.商品詳細を開く(支店, notes.get("〔商品レコードID-F0301-007B〕")); });
  await step(4, async () => { await r.商品一覧を開く(支店); 並び["支店"] = await r.商品名の並び(); });
  await expected(async () => {
    note(`最近チェックした商品: 本店=[${並び["本店"].join("、")}]／TC大阪支店=[${並び["支店"].join("、")}]`);
    expect.soft(並び["本店"].some((n) => n.includes(f.本店の商品名)), `本店の最近チェックした商品に「${f.本店の商品名}」（REC-HQ-001-007 に読み替え）`).toBe(true);
    expect.soft(並び["支店"].some((n) => n.includes(f.支店の商品名)), `TC大阪支店の最近チェックした商品に「${f.支店の商品名}」（REC-OSA-001-007 に読み替え）`).toBe(true);
  });
});

// ---- バナー ----

caseTest("IT-F03-01-004", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-HTML-004");
  let パンくず: number | null = null, バナー: number | null = null;
  await step(1, async () => { await list.openCategory(本店, f.カテゴリID); note(`カテゴリID 2 は、画面で作ったカテゴリ（カテゴリID ${f.カテゴリID}・埋め込みHTML(日)「${f.カテゴリのバナー}」）に読み替えた`); });
  await step(2, async () => { パンくず = await list.上端の位置(list.パンくずの欄); バナー = await list.上端の位置(list.パンくず下のバナー); });
  await expected(async () => {
    await expect.soft(list.パンくず下のバナー.first(), "パンくずリストの下のバナー").toContainText(f.カテゴリのバナー);
    expect.soft(バナー !== null && パンくず !== null && バナー > パンくず, `バナーがパンくずリストより下にある（パンくず ${パンくず}・バナー ${バナー}）`).toBe(true);
  });
});

caseTest("IT-F03-01-005", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-HTML-005");
  await step(1, async () => {
    await list.open(本店, `/products/search/tags/${f.タグID}/cate/${f.カテゴリID}`);
    await list.結果を待つ();
    note(`タグID 1・カテゴリID 2 は、画面で作ったタグ（タグID ${f.タグID}・「${f.タグのバナー}」）とカテゴリ（カテゴリID ${f.カテゴリID}・「${f.カテゴリのバナー}」）に読み替え、タグとカテゴリを同時に指定するアドレスで開いた`);
  });
  await step(2, async () => { await list.パンくず下のバナー.first().scrollIntoViewIfNeeded().catch(() => {}); });
  await expected(async () => {
    await expect.soft(list.パンくず下のバナー.first(), "パンくずリストの下のバナー（タグの表示用HTML）").toContainText(f.タグのバナー);
    await expect.soft(list.パンくず下のバナー.first(), "パンくずリストの下のバナー（カテゴリの表示用HTMLは出ない）").not.toContainText(f.カテゴリのバナー);
  });
});

caseTest("IT-F03-01-087", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  let 文 = "";
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-087〕")); });
  await step(2, async () => { 文 = ((await list.パンくず下のバナー.first().innerText().catch(() => "")) ?? "").trim(); });
  await expected(async () => {
    await expect.soft(list.パンくずの欄, "パンくずリスト（確かめる場所がある）").toBeVisible();
    expect.soft(await list.パンくず下のバナー.count(), "パンくずリストの下のバナーの欄の数").toBe(0);
    expect.soft(文, "パンくずリストの下のバナーの文").toBe("");
  });
});

// ---- 会員（お気に入り・入荷通知） ----

async function ログイン(page: Page, メール: string): Promise<void> {
  await new FrontFavorite(page).login(メール, 会員のパスワード);
}

function お気に入りを押す(seedId: string, n: string, 押したあと: boolean, 期待の件数: number) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const list = new FrontProductList(page);
    const f = 見つけた(seedId);
    const pid = notes.get(`〔商品レコードID-F0301-${n}〕`);
    let 印 = !押したあと;
    await step(1, async () => { await ログイン(page, f.メール); });
    await step(2, async () => {
      await list.openCategory(本店, f.カテゴリID);
      const { card } = await カードを引く(list, pid, f.言語);
      const btn = list.カードのお気に入り(card);
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      // 押した結果の表示（選択中の印）が変わるのを待つ（変わらなくても進み、期待結果はDBで確かめる）
      for (let i = 0; i < 40; i++) {
        印 = /\bis-selected\b/.test((await btn.getAttribute("class")) ?? "");
        if (印 === 押したあと) break;
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(1000);
      note(`FAV-001-${n} は既存の商品（商品ID ${pid}・${f.言語 || "言語なし"}）に読み替えた。押したあとの表示: ${印 ? "登録済み" : "未登録"}`);
    });
    let 件数 = -1;
    await step(3, async () => { 件数 = お気に入りの件数(f.メール, pid, f.言語 || "JP"); });
    await expected(async () => {
      expect.soft(件数, `会員 ${f.メール} と商品ID ${pid}（${f.言語 || "JP"}）のお気に入りの件数`).toBe(期待の件数);
    });
  };
}
caseTest("IT-F03-01-043", お気に入りを押す("S-F03-01-FAV-043", "043", true, 1));
caseTest("IT-F03-01-044", お気に入りを押す("S-F03-01-FAV-044", "044", false, 0));

caseTest("IT-F03-01-045", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-FAV-045");
  const pid = notes.get("〔商品レコードID-F0301-045〕");
  const ボタン: Record<string, boolean | undefined> = {};
  await step(1, async () => {
    await list.openCategory(本店, f.カテゴリID);
    ボタン["本店（ログアウト）"] = (await カードを引く(list, pid, f.言語)).info.お気に入りボタン;
  });
  await step(2, async () => { await ログイン(page, f.メール); });
  await step(3, async () => {
    await list.openCategory(支店, f.カテゴリID);
    ボタン["TC大阪支店（ログイン済み）"] = (await カードを引く(list, pid, f.言語)).info.お気に入りボタン;
  });
  await expected(async () => {
    expect.soft(ボタン["本店（ログアウト）"], "未ログインの本店で、お気に入りへ追加/解除が表示されている").toBe(false);
    expect.soft(ボタン["TC大阪支店（ログイン済み）"], "ログイン済みのTC大阪支店で、お気に入りへ追加/解除が表示されている").toBe(false);
  });
});

caseTest("IT-F03-01-086", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-FAVMIX-086");
  const A = 分ける(f.A), B = 分ける(f.B);
  let a: カード情報 | undefined, b: カード情報 | undefined;
  await step(1, async () => { await ログイン(page, f.メール); });
  await step(2, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-086〕")); });
  await step(3, async () => { a = (await カードを引く(list, A.id, A.lang)).info; b = (await カードを引く(list, B.id, B.lang)).info; });
  await expected(async () => {
    expect.soft(a?.お気に入り済み, `お気に入り登録済みの「${a?.表示名}」（F0301-086-A に読み替え）の♡が塗りつぶし（登録済みの表示）`).toBe(true);
    expect.soft(b?.お気に入りボタン, `未登録の「${b?.表示名}」（F0301-086-B に読み替え）の♡が表示されている`).toBe(true);
    expect.soft(b?.お気に入り済み, `未登録の「${b?.表示名}」の♡が白（未登録の表示）`).toBe(false);
  });
});

function 入荷通知を押す(seedId: string, n: string, 期待の件数: number) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const list = new FrontProductList(page);
    const front = new FrontRestock(page);
    const f = 見つけた(seedId);
    const pid = notes.get(`〔商品レコードID-F0301-${n}〕`);
    let 確認のモーダル = false;
    await step(1, async () => { await ログイン(page, f.メール); });
    await step(2, async () => {
      await list.openCategory(本店, f.カテゴリID);
      const { card } = await カードを引く(list, pid, f.言語);
      const r = await front.press(list.カードの通知ボタン(card, f.規格ID));
      確認のモーダル = r.確認のモーダルが開いた;
      note(`NOTIFY-001-${n} は既存の商品（商品ID ${pid}・規格ID ${f.規格ID}）に読み替えた。押した結果: 完了の通知=${r.通知が出た ? `「${r.通知の文}」` : "出ない"}／ログインモーダル=${r.ログインモーダルが開いた ? "開いた" : "開かない"}／確認のポップアップ=${r.確認のモーダルが開いた ? "開いた" : "開かない"}`);
    });
    await step(3, async () => {
      const ok = page.locator(".p-hareruya-modal.is-active:not(#notify-login-modal) .c-hareruya-btn--primary").first();
      if (確認のモーダル && (await ok.count()) > 0) {
        await ok.click();
        await page.waitForTimeout(1500);
      } else {
        note(`入荷通知依頼/解除確認のポップアップは出ず、手順2でボタンを押しただけで${期待の件数 === 1 ? "登録" : "解除"}の処理が行われた（期待結果はDBで確かめる）`);
      }
    });
    let 件数 = -1;
    await step(4, async () => { 件数 = 有効な入荷通知依頼の件数(f.メール, f.規格ID); });
    await expected(async () => {
      expect.soft(件数, `会員 ${f.メール} と規格ID ${f.規格ID} の有効な入荷通知依頼の件数`).toBe(期待の件数);
    });
  };
}
caseTest("IT-F03-01-046", 入荷通知を押す("S-F03-01-NOTIFY-046", "046", 1));
caseTest("IT-F03-01-047", 入荷通知を押す("S-F03-01-NOTIFY-047", "047", 0));

// ==================== 2026-11-10（続き）: 未着手だった11件 ====================

caseTest("IT-F03-01-002", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-BREADCRUMB-002");
  const 階層 = f.階層.split("|");
  const 項目: Record<string, string[]> = {};
  await step(1, async () => {
    await list.openCategory(本店, f.カテゴリID);
    const レア = await list.絞り込みの欄(list.絞り込みボタン("rarity", "レア"));
    const 神話 = await list.絞り込みの欄(list.絞り込みボタン("rarity", "神話レア"));
    const q = new URLSearchParams();
    q.append("product", f.検索語);
    q.append(レア.name, レア.value);
    q.append(神話.name, 神話.value);
    await list.openCategory(本店, f.カテゴリID, q.toString());
    項目["商品名あり"] = await list.パンくずの項目();
    note(`条件はアドレスで指定した（カテゴリ「${階層.join("＞")}」・商品名「${f.検索語}」・レアリティ レア・神話レア）。パンくず: ${項目["商品名あり"].join(" / ")}`);
  });
  await step(2, async () => {
    await list.open(本店, `/products/search/tags/${f.タグID}`);
    await list.結果を待つ();
    項目["タグだけ"] = await list.パンくずの項目();
    note(`タグ「デッキセット」（タグID ${f.タグID}）をアドレスで指定した。パンくず: ${項目["タグだけ"].join(" / ")}`);
  });
  await expected(async () => {
    const a = 項目["商品名あり"];
    expect.soft(a[0], "商品名パラメータありのパンくずの1番目（🏠）").toBe("🏠");
    expect.soft(a[1], "商品名パラメータありのパンくずの2番目（詳細検索）").toBe("詳細検索");
    expect.soft(a.slice(2, 2 + 階層.length).join(" > "), "商品名パラメータありのパンくずの3番目からのカテゴリ階層").toBe(階層.join(" > "));
    const rest = a.slice(2 + 階層.length).join(" ");
    expect.soft(rest, "カテゴリ階層のあとのレアリティ・言語等（レア）").toContain("レア");
    expect.soft(rest, "カテゴリ階層のあとのレアリティ・言語等（神話レア）").toContain("神話レア");
    expect.soft(項目["タグだけ"].join(" / "), "商品名パラメータなし・タグ指定のパンくず").toBe("🏠 / デッキセット");
  });
});

/** 検索条件をアドレスの引数に書いて直接開く（画面に条件を指定する入口が無いため。依頼者の了承 2026-11-10） */
async function 引数で開く(list: FrontProductList, 引数: [string, string][]): Promise<void> {
  await list.open(本店);
  const q = new URLSearchParams();
  for (const [k, v] of 引数) q.append(k === "category" || k === "format" ? await list.検索の欄の名前(k) : k, v);
  const p = `/products/search?${q.toString()}`;
  await list.open(本店, p);
  await list.結果を待つ();
  note(`検索条件は、商品一覧の検索の欄の名前でアドレスの引数に書いて直接開いた（${p}）。画面に条件を指定する入口が無いため（依頼者の了承 2026-11-10）`);
}
caseTest("IT-F03-01-010", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  let u!: URL;
  await step(1, async () => { await 引数で開く(list, [["tags[]", "1"], ["category", "2"], ["format", "3"]]); });
  await step(2, async () => { u = new URL(page.url()); note(`アドレス欄: ${u.href}`); });
  await expected(async () => {
    expect.soft(u.pathname, "アドレスのパスにタグID 1").toMatch(/\/tags\/1(\/|$)/);
    expect.soft(u.pathname, "アドレスのパスにカテゴリID 2").toMatch(/\/cate\/2(\/|$)/);
    expect.soft([...u.searchParams.entries()].some(([k, v]) => /format/.test(k) && v === "3"), "GETパラメータにフォーマットID 3").toBe(true);
  });
});
caseTest("IT-F03-01-011", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  let u!: URL;
  await step(1, async () => { await 引数で開く(list, [["tags[]", "1"], ["tags[]", "2"], ["tags[]", "3"]]); });
  await step(2, async () => { u = new URL(page.url()); note(`アドレス欄: ${u.href}`); });
  await expected(async () => {
    expect.soft(u.pathname, "アドレスのパスに tags/1-2-3").toMatch(/\/tags\/1-2-3(\/|$)/);
  });
});

caseTest("IT-F03-01-024", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const N = Number(見つけた("S-F03-01-PAGING-024").件数);
  let 件数: number | null = null; let 総ページ = 0;
  const ページ: string[][] = [];
  await step(1, async () => {
    await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-024〕"));
    件数 = await list.商品数の値();
    総ページ = Math.max(1, ...(await list.ページ送りの並び("上部")).filter((t) => /^\d+$/.test(t)).map(Number));
    note(`121件は既存のカテゴリの商品数（シードの時点 ${N}点・いま ${件数}点）に読み替えた。1ページ最大件数は設計の60件`);
  });
  await step(2, async () => {
    for (let p = 1; p <= Math.max(総ページ, 1) && p <= 10; p++) {
      if (p > 1) await list.ページ送りを押す(list.ページ番号の項目("上部", p));
      ページ.push((await list.カードを読む()).map((c) => `${c.商品ID}|${c.言語}|${c.表示名}`));
    }
    note(`各ページの表示件数: ${ページ.map((x) => x.length).join("・")}`);
  });
  await expected(async () => {
    const n = 件数 ?? N;
    const all = ページ.flat();
    expect.soft(総ページ, `総ページ数（商品数 ${n}点）`).toBe(Math.ceil(n / 一ページの件数));
    expect.soft(ページ.map((x) => x.length).join(","), "各ページの表示件数").toBe([60, 60, n - 120].join(","));
    expect.soft(all.length - new Set(all).size, "ページをまたいで重複した商品の数").toBe(0);
    expect.soft(new Set(all).size, "表示された商品の数（欠落なし）").toBe(n);
  });
});

caseTest("IT-F03-01-033", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-VIEW-033");
  const H = 分ける(f.高額), G = 分ける(f.グッズ);
  let high: カード情報 | undefined, goods: カード情報 | undefined;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-033〕")); });
  await step(2, async () => {
    high = (await カードを引く(list, H.id, H.lang)).info;
    await list.openCategory(本店, f.グッズのカテゴリID);
    goods = (await カードを引く(list, G.id, G.lang)).info;
    note(`VIEW-HIGH-033 は「${high.表示名}」、VIEW-GOODS-033 は別のカテゴリ（カテゴリID ${f.グッズのカテゴリID}）のグッズ商品「${goods.表示名}」に読み替えた（同じカテゴリに無いため、グッズ商品のカテゴリも開いた）`);
  });
  await expected(async () => {
    expect.soft(high?.言語ラベル, "カード商品に表示された言語コード（登録は日本語）").toBe("JP");
    expect.soft(high?.表示名 ?? "", `カード商品の商品名の末尾の高額商品コード（登録は ${f.高額商品コード}）`).toMatch(new RegExp(`#\\s*${f.高額商品コード.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    expect.soft(goods?.言語ラベル, "グッズ商品のカード言語の表示").toBe("");
  });
});

caseTest("IT-F03-01-084", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-NOSALE-084");
  let info: カード情報 | undefined;
  await step(1, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-084〕")); });
  await step(2, async () => { info = (await カードを引く(list, notes.get("〔商品レコードID-F0301-084〕"), f.言語)).info; note(`F0301-084-A は既存の「${info.表示名}」（セールフラグなしを管理画面で確かめた）に読み替えた`); });
  await expected(async () => {
    expect.soft(info?.セール, "Sale の表示").toBe(false);
  });
});

function 状態一つ(seedId: string, n: string, NMだけ: boolean) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const list = new FrontProductList(page);
    const f = 見つけた(seedId);
    let info: カード情報 | undefined;
    await step(1, async () => { await list.openCategory(本店, notes.get(`〔カテゴリレコードID-F0301-${n}〕`)); });
    await step(2, async () => {
      info = (await カードを引く(list, notes.get(`〔商品レコードID-F0301-${n}〕`), f.言語)).info;
      note(`F0301-${n}-A は、商品規格が状態「${f.状態}」の1件だけの既存の「${info.表示名}」に読み替えた（価格・在庫は正本と違う）`);
    });
    await expected(async () => {
      if (NMだけ) expect.soft(info?.他の状態ボタン, "他の状態の表示").toBe(false);
      expect.soft(info?.他の状態があります, "他の状態がありますの表示").toBe(false);
    });
  };
}
caseTest("IT-F03-01-073", 状態一つ("S-F03-01-ONESTATE-073", "073", true));
caseTest("IT-F03-01-078", 状態一つ("S-F03-01-ONESTATE-078", "078", false));

caseTest("IT-F03-01-048", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-NOTIFY-048");
  const A = 分ける(f.A), B = 分ける(f.B);
  let a: カード情報 | undefined, b: カード情報 | undefined;
  await step(1, async () => {
    await list.openCategory(本店, f.本店のカテゴリID);
    a = (await カードを引く(list, A.id, A.lang)).info;
    note(`NOTIFY-HIGH-048 は本店のカテゴリID ${f.本店のカテゴリID} の在庫0・高額商品コード付きの「${a.表示名}」に読み替えた（ログアウトのまま）`);
  });
  await step(2, async () => {
    await list.openCategory(支店, f.支店のカテゴリID);
    b = (await カードを引く(list, B.id, B.lang)).info;
    note(`NOTIFY-001-048 はTC大阪支店のカテゴリID ${f.支店のカテゴリID} の在庫0・高額商品コードなしの「${b.表示名}」に読み替えた`);
  });
  await expected(async () => {
    expect.soft(a?.通知ボタン.length, "本店の高額商品コード付きの商品の、入荷時に通知/通知待ちのボタンの数").toBe(0);
    expect.soft(b?.通知ボタン.length, "TC大阪支店の商品の、入荷時に通知/通知待ちのボタンの数").toBe(0);
  });
});

caseTest("IT-F03-01-085", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-NOTIFYMIX-085");
  const A = 分ける(f.A), B = 分ける(f.B), C = 分ける(f.C);
  const 読んだ: Record<string, カード情報 | undefined> = {};
  await step(1, async () => { await ログイン(page, f.メール); });
  await step(2, async () => { await list.openCategory(本店, notes.get("〔カテゴリレコードID-F0301-085〕")); });
  await step(3, async () => {
    for (const [k, v] of [["A", A], ["B", B], ["C", C]] as const) 読んだ[k] = (await カードを引く(list, v.id, v.lang)).info;
    note(`F0301-085-A=「${読んだ.A?.表示名}」・B=「${読んだ.B?.表示名}」・C=「${読んだ.C?.表示名}」に読み替えた`);
  });
  await expected(async () => {
    expect.soft(読んだ.A?.通知ボタン.some((x) => x.依頼済み), "依頼済みの商品（F0301-085-A に読み替え）に通知待ちの表示").toBe(true);
    expect.soft((読んだ.B?.通知ボタン.length ?? 0) > 0 && 読んだ.B!.通知ボタン.every((x) => !x.依頼済み), "依頼なしの商品（F0301-085-B に読み替え）に入荷時に通知の表示").toBe(true);
    expect.soft(読んだ.C?.通知ボタン.length, "高額商品コード付きの商品（F0301-085-C に読み替え）の入荷通知のボタンの数").toBe(0);
  });
});

caseTest("IT-F03-01-088", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const f = 見つけた("S-F03-01-CATSORT-088");
  let 並び順 = ""; let 価格: number[] = [];
  await step(1, async () => {
    await list.open(本店);
    const 開いた = await list.左メニューのカテゴリを名前で押す(f.カテゴリ名);
    note(`カテゴリ「ソート順設定カテゴリ-088」は、印を付けて作った「${f.カテゴリ名}」を押した${開いた.length ? `（左メニューの「${開いた.join("」「")}」を開いてから押した）` : ""}`);
  });
  await step(2, async () => {
    並び順 = await list.選ばれている並び順();
    価格 = (await list.カードを読む()).map((c) => c.行[0]?.価格).filter((p): p is number => typeof p === "number");
    note(`F0301-088-LOW・MID・HIGH は、親カテゴリの既存の商品に読み替え、表示価格の並びで確かめる: ${価格.join(",")}`);
  });
  await expected(async () => {
    expect.soft(並び順, "選ばれている並び順（カテゴリの検索パラメータの価格(低い順)）").toBe("価格(低い順)");
    expect.soft(価格.length, "表示された商品の数").toBeGreaterThan(1);
    expect.soft(価格.join(","), "商品の表示価格の並び（安い順にそろう）").toBe([...価格].sort((x, y) => x - y).join(","));
  });
});
