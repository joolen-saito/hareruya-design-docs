/**
 * F03-01 商品一覧のうち、検索サービスの索引に載せた商品で一覧の結果を確かめるケース（001・014・089〜104）。
 * 正本: cases/F03-01_test_cases.tsv。シード: seeds/f03-01-index.ts（索引用の商品をまとめて作り、フィードを1回送って反映を待つ）。
 *
 * 画面に合わせて読んだこと（手順の注記に残す）:
 * - 正本の検索語（検索ワード）・商品コードには実行の印が付いている。検索に入れる語も印つきの値。
 * - 「TOP画面から商品一覧画面を開き、キーワード欄に入れて検索する」は、店のTOP画面を開き、画面上部の検索欄に入れて検索ボタンを押す（商品一覧が開く）。
 * - 「在庫ありのみを選択して指定する」は、商品一覧の絞り込みの並びの「在庫ありのみ」を押す。
 */
import { test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { FrontProductList, 店舗の入口 } from "../../pages/front/f03_01_product_list";
import { FrontDetailSearch } from "../../pages/front/f03_03_detail_search";
import "../../seeds/f03-01";
import { F0301の商品ID } from "../../seeds/f03-01-index";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 並べる = (ids: string[]) => [...ids].sort();
type 店 = keyof typeof 店舗の入口;

/** 店のTOP画面を開く */
async function TOPを開く(page: CaseCtx["page"], shop: 店): Promise<void> {
  const res = await page.goto(`${BASE_URL}${店舗の入口[shop]}/`, { waitUntil: "domcontentloaded" });
  expect(res?.status() ?? 0, `${shop}のTOP画面の応答`).toBeLessThan(400);
  await page.waitForLoadState("load");
}

/** 店のTOP画面から、画面上部の検索欄に検索語を入れて商品一覧を開く。一覧の商品カードの商品IDとリンク先を返す */
async function TOPから検索する(list: FrontProductList, shop: 店, 検索語: string): Promise<void> {
  await TOPを開く(list.page, shop);
  await list.ヘッダーで検索する(検索語);
  expect(new URL(list.page.url()).pathname, `${shop}の商品一覧が開いた`).toBe(`${店舗の入口[shop]}/products/search`);
}

/** TOP画面から商品一覧を開く（画面上部の検索欄を空のまま検索ボタンを押す。一覧へ移らなければ、商品一覧のアドレスを開いて注記に残す） */
async function TOPから一覧を開く(list: FrontProductList, shop: 店): Promise<void> {
  await TOPを開く(list.page, shop);
  try {
    await list.ヘッダーで検索する("");
    note(`${shop}: TOP画面から商品一覧は、画面上部の検索欄を空のまま検索ボタンを押して開いた`);
  } catch (e) {
    note(`${shop}: TOP画面の検索欄を空のまま押しても商品一覧へ移らなかった（${String(e).slice(0, 120)}）ので、商品一覧のアドレスを開いた`);
    await list.open(店舗の入口[shop]);
    await list.結果を待つ();
  }
  expect(new URL(list.page.url()).pathname, `${shop}の商品一覧が開いた`).toBe(`${店舗の入口[shop]}/products/search`);
}

const 商品IDの = (list: FrontProductList) => list.カードのリンク先().then((xs) => 並べる(xs.map((x) => x.商品ID)));

caseTest("IT-F03-01-001", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const 語 = rc("店舗確認商品-001");
  const 結果: Record<string, { 商品ID: string; href: string }[]> = {};
  await step(1, async () => { await TOPから一覧を開く(list, "本店"); });
  await step(2, async () => { await list.ヘッダーで検索する(語); 結果["本店"] = await list.カードのリンク先(); });
  await step(3, async () => { await TOPから一覧を開く(list, "TC大阪支店"); });
  await step(4, async () => { await list.ヘッダーで検索する(語); 結果["TC大阪支店"] = await list.カードのリンク先(); });
  await expected(async () => {
    const host = new URL(BASE_URL).host;
    note(`正本のドメイン www.hareruyamtg.com は、この試験環境の公開側のドメイン（${host}）として確かめた`);
    const at = (xs: { href: string }[]) => xs.map((x) => `${new URL(x.href).host}${new URL(x.href).pathname}`);
    expect.soft(結果["本店"].map((x) => x.商品ID), "本店の検索結果は本店公開の商品HQ-001-F0301-001だけ").toEqual([notes.get("〔商品レコードID-F0301-001A〕")]);
    expect.soft(at(結果["本店"]).every((h) => h.startsWith(`${host}/ja/products/detail/`)), `本店の商品のリンク先が ${host} の /ja/ 配下`).toBe(true);
    expect.soft(結果["TC大阪支店"].map((x) => x.商品ID), "TC大阪支店の検索結果は大阪公開の商品OSA-001-001だけ").toEqual([notes.get("〔商品レコードID-F0301-001B〕")]);
    expect.soft(at(結果["TC大阪支店"]).every((h) => h.startsWith(`${host}/ja/osaka/products/detail/`)), "TC大阪支店の商品のリンク先が同じドメインの /ja/osaka/ 配下").toBe(true);
  });
});

caseTest("IT-F03-01-014", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const 語 = rc("店舗確認商品-014");
  const 結果: Record<string, string[]> = {};
  for (const [n, shop] of [[1, "本店"], [2, "TC大阪支店"]] as const) {
    await step(n, async () => {
      expect(await list.openKeyword(店舗の入口[shop], 語), `${shop}の商品一覧の応答`).toBeLessThan(400);
      await list.在庫ありのみを選ぶ();
      expect(await list.在庫ありのみが選ばれている(), `${shop}で「在庫ありのみ」が選ばれた`).toBe(true);
      結果[shop] = await 商品IDの(list);
    });
  }
  note("正本の手順は検索語を入れないが、事前準備の「店舗確認商品-014の検索結果はこの2件だけ」に合わせ、各店の商品一覧は検索語（印つき）で絞り込んで開いてから「在庫ありのみ」を押した（店の全商品の中から2件を見分けるため）");
  await expected(async () => {
    expect.soft(結果["本店"], "本店では本店在庫がある HQ-001-014 だけ").toEqual([notes.get("〔商品レコードID-F0301-014A〕")]);
    expect.soft(結果["TC大阪支店"], "TC大阪支店では大阪支店在庫がある OSA-001-014 だけ").toEqual([notes.get("〔商品レコードID-F0301-014B〕")]);
  });
});

/**
 * 089〜103: 店のTOPから検索語で商品一覧を開き、「在庫ありのみ」を選ぶ（または選ばない）。出る商品・出ない商品を確かめる。
 * 103 は本店とTC大阪支店で同じことを2回する。
 */
function 組合せ(o: { n: string; 店: 店[]; 在庫ありのみ: boolean; 出る: string[]; 出ない: string[] }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const list = new FrontProductList(page);
    const seedId = `S-F03-01-CBSTORE-${o.n}`;
    const 語 = rc(`組合せ確認商品-F0301-CB${o.n}`);
    const 結果: Record<string, string[]> = {};
    let k = 0;
    for (const shop of o.店) {
      await step(++k, async () => { await TOPから検索する(list, shop, 語); });
      await step(++k, async () => {
        if (o.在庫ありのみ) {
          await list.在庫ありのみを選ぶ();
          expect(await list.在庫ありのみが選ばれている(), `${shop}で「在庫ありのみ」が選ばれた`).toBe(true);
        } else {
          await list.描画を待つ();
          expect(await list.在庫ありのみが選ばれている(), `${shop}で「在庫ありのみ」は選ばれていない（指定しない）`).toBe(false);
        }
        結果[shop] = await 商品IDの(list);
      });
    }
    await expected(async () => {
      for (const shop of o.店) {
        const id = (c: string) => F0301の商品ID(seedId, `F0301-CB${o.n}-${c}`);
        expect.soft(結果[shop], `${shop}の商品一覧に出るのは ${o.出る.map((c) => `F0301-CB${o.n}-${c}`).join("・")} だけ`).toEqual(並べる(o.出る.map(id)));
        for (const c of o.出ない) expect.soft(結果[shop], `${shop}の商品一覧に F0301-CB${o.n}-${c} は出ない`).not.toContain(id(c));
      }
    });
  };
}

caseTest("IT-F03-01-089", 組合せ({ n: "089", 店: ["本店"], 在庫ありのみ: true, 出る: ["B"], 出ない: ["A"] }));
caseTest("IT-F03-01-090", 組合せ({ n: "090", 店: ["TC大阪支店"], 在庫ありのみ: true, 出る: ["B"], 出ない: ["A"] }));
caseTest("IT-F03-01-091", 組合せ({ n: "091", 店: ["本店"], 在庫ありのみ: true, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-092", 組合せ({ n: "092", 店: ["本店"], 在庫ありのみ: false, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-093", 組合せ({ n: "093", 店: ["本店"], 在庫ありのみ: true, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-094", 組合せ({ n: "094", 店: ["本店"], 在庫ありのみ: false, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-095", 組合せ({ n: "095", 店: ["TC大阪支店"], 在庫ありのみ: true, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-096", 組合せ({ n: "096", 店: ["TC大阪支店"], 在庫ありのみ: false, 出る: ["B"], 出ない: ["A"] }));
caseTest("IT-F03-01-097", 組合せ({ n: "097", 店: ["TC大阪支店"], 在庫ありのみ: false, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-098", 組合せ({ n: "098", 店: ["TC大阪支店"], 在庫ありのみ: false, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-099", 組合せ({ n: "099", 店: ["TC大阪支店"], 在庫ありのみ: false, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-100", 組合せ({ n: "100", 店: ["本店"], 在庫ありのみ: false, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-101", 組合せ({ n: "101", 店: ["本店"], 在庫ありのみ: true, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-102", 組合せ({ n: "102", 店: ["本店"], 在庫ありのみ: false, 出る: ["A"], 出ない: [] }));
caseTest("IT-F03-01-103", 組合せ({ n: "103", 店: ["本店", "TC大阪支店"], 在庫ありのみ: true, 出る: ["B"], 出ない: ["A"] }));

caseTest("IT-F03-01-104", async ({ page, step, expected }) => {
  const list = new FrontProductList(page);
  const seedId = "S-F03-01-CBCATEGORY-104";
  let 結果: string[] = [];
  let 開いた: string[] = [];
  await step(1, async () => { await TOPを開く(page, "本店"); });
  await step(2, async () => {
    開いた = await list.左メニューのカテゴリを名前で押す(rc("組合せ確認カテゴリ-F0301-CB104"));
    if (開いた.length) note(`左メニューで「${開いた.join("」「")}」の階層を開いてからカテゴリを押した（カテゴリはサプライ・グッズの下に作った）`);
    結果 = await 商品IDの(list);
  });
  await expected(async () => {
    expect.soft(結果, "商品一覧に出るのは F0301-CB104-A だけ").toEqual([F0301の商品ID(seedId, "F0301-CB104-A")]);
    expect.soft(結果, "カテゴリに属さない F0301-CB104-B は出ない").not.toContain(F0301の商品ID(seedId, "F0301-CB104-B"));
  });
});

caseTest("IT-F03-01-013", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  let 結果: string[] = [];
  await step(1, async () => {
    expect(await list.openCategory(店舗の入口.本店, notes.get("〔カテゴリレコードID-F0301-013〕")), "絞り込み確認カテゴリ-013の商品一覧の応答").toBeLessThan(400);
  });
  await step(2, async () => {
    for (const [row, label, 正本] of [["language", "JP", "JP"], ["foilFlg", "特殊Foil", "特殊"], ["rarity", "神話レア", "神話レア"], ["colors", "赤", "赤"], ["cardtypes", "クリーチャー", "クリーチャー"]] as const) {
      await list.絞り込みを押す(list.絞り込みボタン(row, label));
      if (label !== 正本) note(`Foilの「${正本}」は、絞り込みの並びのボタン「${label}」を押した`);
    }
    結果 = await 商品IDの(list);
  });
  await expected(async () => {
    expect(結果, "指定した5条件をすべて持つ FILTER-ALL-013 だけが出る（1条件だけ違う比較商品5件は出ない）").toEqual([notes.get("〔商品レコードID-F0301-013〕")]);
  });
});

caseTest("IT-F03-01-009", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const search = new FrontDetailSearch(page);
  let 結果: string[] = [];
  await step(1, async () => {
    await search.openProductList(店舗の入口.本店);
    const 押したもの = await search.詳細検索を押す();
    if (押したもの !== "商品一覧の詳細検索ボタン") note("固定のヘッダーが商品一覧の中の「詳細検索」ボタンを覆って押せなかったため、画面上部の「詳細検索」ボタンを押した");
    await expect(search.モーダル, "商品詳細検索モーダル（開いた状態）").toHaveClass(/is-visible/);
  });
  await step(2, async () => {
    const 欄 = search.項目("カードセット");
    if ((await 欄.count()) === 0) {
      throw new Error("商品詳細検索のモーダルにカードセットの入力欄が無く、カードセット「SET-F0301-009」を指定できない（手順を画面で行えない）");
    }
    await search.選択欄で選ぶ(欄.locator("select").first(), rc("SET-F0301-009"), "カードセット");
    await search.選択肢を選ぶ("レアリティ", "神話レア");
    await search.検索する();
    await list.結果を待つ();
    結果 = await 商品IDの(list);
  });
  await expected(async () => {
    expect(結果, "カードセット SET-F0301-009 かつ神話レアの商品 FILTER-ALL-009 だけが出る").toEqual([notes.get("〔商品レコードID-F0301-009〕")]);
  });
});

caseTest("IT-F03-01-015", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  let 結果: string[] = [];
  await step(1, async () => {
    expect(await list.openCategory(店舗の入口.本店, notes.get("〔カテゴリレコードID-F0301-015B〕")), "レアリティカテゴリ「神話レア」の商品一覧の応答").toBeLessThan(400);
    結果 = await 商品IDの(list);
  });
  await expected(async () => {
    expect.soft(結果, "親カテゴリ SET-F0301-015 と神話レアの両方に当たる FILTER-ALL-015 だけが出る").toEqual([notes.get("〔商品レコードID-F0301-015〕")]);
    expect.soft(結果, "親カテゴリの神話レアでない FILTER-ALL-015-C1 は出ない").not.toContain(F0301の商品ID("S-F03-01-FILTER-015", "FILTER-ALL-015-C1"));
    expect.soft(結果, "親カテゴリに属さない神話レアの FILTER-ALL-015-C2 は出ない").not.toContain(F0301の商品ID("S-F03-01-FILTER-015", "FILTER-ALL-015-C2"));
  });
});

caseTest("IT-F03-01-030", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const seedId = "S-F03-01-SORT-030";
  let 並び: string[] = [];
  await step(1, async () => {
    expect(await list.openCategory(店舗の入口.本店, notes.get("〔カテゴリレコードID-F0301-030〕")), "発売日順確認カテゴリの商品一覧の応答").toBeLessThan(400);
    await list.並び順を選ぶ("発売日順");
    await list.描画を待つ();
    await list.結果を待つ();
    expect(await list.選ばれている並び順(), "選ばれている並び順").toContain("発売日順");
    const OLD1 = F0301の商品ID(seedId, "F0301-030-OLD1");
    並び = (await list.カードを読む()).map((c) => (c.商品ID === OLD1 ? `${c.商品ID}:${c.言語 || "JP"}` : c.商品ID));
    note("カテゴリの商品一覧を開いてから、並び順のタブの「発売日順」を押した");
  });
  await expected(async () => {
    const id = (c: string) => F0301の商品ID(seedId, c);
    const 旧 = [{ c: "F0301-030-OLD1", id: id("F0301-030-OLD1") }, { c: "F0301-030-OLD2", id: id("F0301-030-OLD2") }].sort((a, b) => Number(b.id) - Number(a.id));
    const 期待 = [id("F0301-030-NEW"), ...旧.flatMap((o) => (o.c === "F0301-030-OLD1" ? [`${o.id}:JP`, `${o.id}:EN`] : [o.id])), id("F0301-030-NONE")];
    expect(並び, "リリース日の新しいカードセットの商品が先、同じリリース日は商品IDの降順で同じ商品はJP・ENの順、カードセット未指定の商品が最後").toEqual(期待);
  });
});

caseTest("IT-F03-01-049", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const seedId = "S-F03-01-GROUP-049";
  let グループ: string[] = [];
  await step(1, async () => {
    expect(await list.openCategory(店舗の入口.本店, notes.get("〔カテゴリレコードID-F0301-049〕")), "グルーピング確認カテゴリの商品一覧の応答").toBeLessThan(400);
  });
  await step(2, async () => {
    グループ = (await list.カードを読む()).map((c) => `${c.商品ID}:${c.言語}:${c.行.map((r) => r.状態).join("/")}`);
    note(`表示された商品グループ（商品ID:言語:状態）: ${グループ.join("、")}`);
  });
  await expected(async () => {
    const p1 = F0301の商品ID(seedId, "F0301-049-P1-NM");
    const p2 = F0301の商品ID(seedId, "F0301-049-P2-NM");
    expect.soft(グループ.length, "商品グループは合計4組").toBe(4);
    expect.soft(グループ.filter((g) => g.startsWith(`${p1}:`)).length, "F0301-049-P1 は、同じ組の2規格が1つにまとまり、言語だけ・高額商品コードだけが違う規格が別の組で、合計3組").toBe(3);
    expect.soft(グループ.filter((g) => g.startsWith(`${p2}:`)).length, "商品IDだけが違う F0301-049-P2 は別の1組").toBe(1);
  });
});
