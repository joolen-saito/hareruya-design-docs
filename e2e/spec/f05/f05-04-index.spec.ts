/**
 * F05-04 ネット買取商品詳細（フロント）のうち、検索サービスの索引から出る一覧（他のバージョン商品・カテゴリやセット名で検索した一覧）を
 * 確かめるケース（PC版）。正本: cases/F05-04_test_cases.tsv（SP版の 004 は f05-04-index-sp.spec.ts、ほかのケースは f05-04.spec.ts など）
 *
 * 商品は seeds/f05-04-index.ts が画面で作り、ユニサーチフィード作成で1回だけ送って、公開側に出るまで待つ。
 * 他のバージョン商品は、同じカードIDの商品の一覧（ネット買取商品詳細の下の区画）。行は商品名のリンクの商品IDで見分ける。
 */
import { CDPSession, Page, test } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { NetBuyDetailPage, カテゴリ一覧の描画を待つ } from "../../pages/front/f05_04_net_detail";
import { ネット買取の検索結果, 他のバージョン商品, 一覧の行 } from "../../pages/front/f05_purchase_results";
import { F0504カテゴリ } from "../../seeds/f05-04";
import { F0504セット021, f0504索引の商品 } from "../../seeds/f05-04-index";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 印の注記 = "商品名・カテゴリ名・カードセット名の末尾の「-印」は実行ごとの印";

async function 詳細を開く(page: Page, 商品ID: string, 指定?: { 言語?: string; 商品クラス?: string }): Promise<NetBuyDetailPage> {
  const d = new NetBuyDetailPage(page);
  expect(await d.開く(商品ID, 指定), `商品ID ${商品ID} のネット買取商品詳細の応答`).toBeLessThan(400);
  await expect(d.商品名, "ネット買取商品詳細の商品名の見出し").toBeVisible();
  return d;
}
async function 他のバージョンを読む(v: 他のバージョン商品, what: string): Promise<一覧の行[]> {
  await v.枠.scrollIntoViewIfNeeded();
  await v.読み込みを待つ();
  const rows = await v.見えている行();
  note(`${what}: ${rows.map((x) => `${x.商品名}（商品ID ${x.商品ID}）`).join("、") || "なし"}`);
  return rows;
}
const 名 = (rows: 一覧の行[]) => rows.map((x) => x.商品名);
const VER = (no: string, ns: number[]) => ns.map((n) => rc(`VER-${String(n).padStart(3, "0")}-${no}`));

// ---- 021（セット名から一覧へ） ----
caseTest("IT-F05-04-021", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  note(`セット名「タルキール：龍嵐録」は、実行の印つきのカードセット「${F0504セット021}」で代えた（シードの注記）`);
  await step(1, async () => { await 詳細を開く(page, notes.get("〔商品ID-F0504-021A〕")); });
  await step(2, async () => {
    const link = page.locator("a.p-hareruya-product-detail__specs-link").filter({ hasText: F0504セット021 });
    await expect(link, "カード説明のセット名のリンク").toHaveCount(1);
    await Promise.all([page.waitForURL((u) => u.pathname.includes("/purchase/search"), { timeout: 60_000 }), link.click()]);
    await r.結果を待つ();
    rows = await r.行を読む();
    note(`遷移先: ${decodeURIComponent(page.url())}。一覧: ${名(rows).join("、")}`);
  });
  await expected(async () => {
    await expect.soft(page.locator("body.purchase_search"), "ネット買取商品一覧の画面へ遷移した").toHaveCount(1);
    expect.soft(rows.map((x) => x.商品ID).sort(), "商品ID 〔商品ID-F0504-021A〕と〔商品ID-F0504-021B〕が表示された").toEqual([notes.get("〔商品ID-F0504-021A〕"), notes.get("〔商品ID-F0504-021B〕")].sort());
  });
});

// ---- 022（他のバージョンボタン） ----
caseTest("IT-F05-04-022", async ({ page, notes, step, expected }) => {
  const v = new 他のバージョン商品(page);
  let d!: NetBuyDetailPage;
  let rows: 一覧の行[] = [];
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-022A〕")); });
  await step(2, async () => {
    await expect(d.他のバージョンボタン, "他のバージョンボタン").toHaveCount(1);
    await d.他のバージョンボタン.click();
    rows = await 他のバージョンを読む(v, "他のバージョン商品");
  });
  await expected(async () => {
    expect.soft(rows.map((x) => x.商品ID).sort(), "同じカードIDの〔商品ID-F0504-022A〕と〔商品ID-F0504-022B〕だけが表示された").toEqual([notes.get("〔商品ID-F0504-022A〕"), notes.get("〔商品ID-F0504-022B〕")].sort());
  });
});

// ---- 024・025（9件と、ページ送り） ----
caseTest("IT-F05-04-024", async ({ page, notes, step, expected }) => {
  const v = new 他のバージョン商品(page);
  let rows: 一覧の行[] = [];
  let 件数 = "";
  note(印の注記);
  await step(1, async () => { await 詳細を開く(page, notes.get("〔商品ID-F0504-024〕")); rows = await 他のバージョンを読む(v, "他のバージョン商品の1ページ目"); 件数 = ((await v.件数.textContent()) ?? "").trim(); });
  await expected(async () => {
    expect.soft(件数, "同じカードIDの商品数").toBe("9");
    expect.soft(名(rows), "1ページ目に VER-001-024〜VER-008-024 の8件").toEqual(VER("024", [1, 2, 3, 4, 5, 6, 7, 8]));
  });
});

caseTest("IT-F05-04-025", async ({ page, notes, step, expected }) => {
  const v = new 他のバージョン商品(page);
  let rows: 一覧の行[] = [];
  note(印の注記);
  await step(1, async () => { await 詳細を開く(page, notes.get("〔商品ID-F0504-025〕")); await 他のバージョンを読む(v, "他のバージョン商品の1ページ目"); });
  await step(2, async () => { await v.ページを選ぶ(2); rows = await 他のバージョンを読む(v, "他のバージョン商品の2ページ目"); });
  await expected(async () => {
    expect.soft(await v.現在のページ(), "他のバージョン商品の表示中のページ").toBe("2");
    expect.soft(名(rows), "2ページ目に VER-009-025").toEqual(VER("025", [9]));
  });
});

// ---- 026（一覧と同じ商品情報） ----
caseTest("IT-F05-04-026", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  const v = new 他のバージョン商品(page);
  let 一覧側: 一覧の行 | undefined;
  let 詳細側: 一覧の行 | undefined;
  const p = f0504索引の商品("VER-001-026");
  note(印の注記);
  note("手順1の「VER-001-026を表示したネット買取商品一覧画面」は、商品名で検索した一覧（/ja/purchase/search?product=商品名）で開いた。商品情報は、商品名・言語ラベル・買取価格・画像・数量の欄・カートに追加・同名商品検索の有無で比べた（週間販売数は一覧にも他のバージョン商品にも出ない）");
  await step(1, async () => {
    expect(await r.開く(`/ja/purchase/search?product=${encodeURIComponent(rc("VER-001-026"))}`), "ネット買取商品一覧の応答").toBeLessThan(400);
    await r.結果を待つ();
    一覧側 = (await r.行を読む()).find((x) => x.商品ID === p.商品ID);
    note(`一覧の VER-001-026: ${JSON.stringify(一覧側 ?? null)}`);
  });
  await step(2, async () => {
    await 詳細を開く(page, notes.get("〔商品ID-F0504-026〕"));
    詳細側 = (await 他のバージョンを読む(v, "他のバージョン商品")).find((x) => x.商品ID === p.商品ID);
    note(`他のバージョン商品の VER-001-026: ${JSON.stringify(詳細側 ?? null)}`);
  });
  await expected(async () => {
    const 情報 = (x?: 一覧の行) => x ? { 商品名: x.商品名, 言語ラベル: x.言語ラベル, 買取価格: x.買取価格, 画像: x.画像, 数量欄: x.数量欄, カートに追加: x.カートに追加, 同名商品検索: x.同名商品検索 !== null } : null;
    expect.soft(情報(一覧側), "一覧に VER-001-026 が表示された").not.toBeNull();
    expect.soft(情報(詳細側), "他のバージョン商品の VER-001-026 に、一覧と同じ商品情報が表示された").toEqual(情報(一覧側));
    expect.soft(詳細側?.画像 ?? "", "他のバージョン商品の VER-001-026 の画像は、追加した試験画像").toContain(p.画像 ?? "（画像なし）");
  });
});

// ---- 027・028・050・051（絞り込み） ----
caseTest("IT-F05-04-027", async ({ page, notes, step, expected }) => {
  const v = new 他のバージョン商品(page);
  const 出た: Record<string, string[]> = {};
  note(印の注記);
  note("手順3・4の「ENを選択」「Otherを選択」は、前の手順で選んだ言語のボタンを押して外してから、その言語のボタンを押すことと読んだ（言語の絞り込みのボタンは押すたびに選ぶ・外すが切り替わる）");
  await step(1, async () => { await 詳細を開く(page, notes.get("〔商品ID-F0504-027〕")); await 他のバージョンを読む(v, "絞り込む前"); });
  await step(2, async () => { await v.絞り込む("jp"); 出た["JP"] = 名(await v.見えている行()); note(`JP: ${出た["JP"].join("、")}`); });
  await step(3, async () => { await v.絞り込む("jp"); await v.絞り込む("en"); 出た["EN"] = 名(await v.見えている行()); note(`EN: ${出た["EN"].join("、")}`); });
  await step(4, async () => { await v.絞り込む("en"); await v.絞り込む("other"); 出た["Other"] = 名(await v.見えている行()); note(`Other: ${出た["Other"].join("、")}`); });
  await expected(async () => {
    expect.soft([...出た["JP"]].sort(), "JP: VER-001・VER-004・VER-007").toEqual(VER("027", [1, 4, 7]));
    expect.soft([...出た["EN"]].sort(), "EN: VER-002・VER-005・VER-008").toEqual(VER("027", [2, 5, 8]));
    expect.soft([...出た["Other"]].sort(), "Other: VER-003・VER-006・VER-009").toEqual(VER("027", [3, 6, 9]));
  });
});

function Foilの絞り込み(no: "028" | "050" | "051", key: "foilSpecial" | "nonFoil" | "foil", 期待: string[], 見出し: string) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const v = new 他のバージョン商品(page);
    let rows: string[] = [];
    note(印の注記);
    note(`検索-Foil の「${key === "foilSpecial" ? "特殊" : key === "nonFoil" ? "通常（Normal）" : "Foil"}」は、他のバージョン商品の絞り込みのボタン`);
    await step(1, async () => { await 詳細を開く(page, notes.get(`〔商品ID-F0504-${no}〕`)); await 他のバージョンを読む(v, "絞り込む前"); });
    await step(2, async () => { await v.絞り込む(key); rows = 名(await v.見えている行()); note(`絞り込んだあと: ${rows.join("、")}`); });
    await expected(async () => { expect.soft([...rows].sort(), 見出し).toEqual(期待.map((x) => rc(x)).sort()); });
  };
}
caseTest("IT-F05-04-028", Foilの絞り込み("028", "foilSpecial", ["VER-003-028", "VER-006-028", "VER-009-028"], "特殊の VER-003・VER-006・VER-009 だけが表示された"));
caseTest("IT-F05-04-050", Foilの絞り込み("050", "nonFoil", ["F0504-050-V1", "F0504-050-V2"], "Foil区分が通常の F0504-050-V1・V2 だけが表示された"));
caseTest("IT-F05-04-051", Foilの絞り込み("051", "foil", ["F0504-051-V3", "F0504-051-V4"], "Foil区分がFoilの F0504-051-V3・V4 だけが表示された"));

// ---- 029・030（並べ替え） ----
function 並べ替え(no: "029" | "030", key: "buy_price_desc" | "buy_price_asc", 期待: number[], 見出し: string) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const v = new 他のバージョン商品(page);
    let rows: string[] = [];
    note(印の注記);
    await step(1, async () => { await 詳細を開く(page, notes.get(`〔商品ID-F0504-${no}〕`)); await 他のバージョンを読む(v, "並べ替える前"); });
    await step(2, async () => { await v.並べ替える(key); rows = 名(await v.見えている行()); note(`並べ替えたあとの1ページ目: ${rows.join("、")}`); });
    await expected(async () => { expect.soft(rows, 見出し).toEqual(VER(no, 期待)); });
  };
}
caseTest("IT-F05-04-029", 並べ替え("029", "buy_price_desc", [1, 2, 3, 4, 5, 6, 7, 8], "価格（高い順）で VER-001〜VER-008 の順に1ページ目へ表示された"));
caseTest("IT-F05-04-030", 並べ替え("030", "buy_price_asc", [9, 8, 7, 6, 5, 4, 3, 2], "価格（低い順）で VER-009〜VER-002 の順に1ページ目へ表示された"));

// ---- 042（低速通信での画像の差し替え） ----
caseTest("IT-F05-04-042", async ({ page, notes, step, expected }) => {
  const v = new 他のバージョン商品(page);
  let cdp: CDPSession | null = null;
  const 様子: { 読み込み中: boolean; 行: number }[] = [];
  let rows: 一覧の行[] = [];
  note(印の注記);
  note("手順1の低速通信は、ブラウザの開発者ツールの通信の制限（遅延400ミリ秒・下り上り 100KB/秒）で設定した。読み込み中の画像は、他のバージョン商品の区画の読み込み中の印（読み込み中の画像）で見た。実画像は、各商品に追加した試験画像のファイル名で照らし合わせた");
  await step(1, async () => {
    cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: 100 * 1024, uploadThroughput: 100 * 1024 });
  });
  await step(2, async () => {
    const d = new NetBuyDetailPage(page);
    await d.開く(notes.get("〔商品ID-F0504-042〕"));
    await expect(d.商品名, "ネット買取商品詳細の商品名の見出し").toBeVisible({ timeout: 120_000 });
  });
  await step(3, async () => {
    await v.枠.scrollIntoViewIfNeeded();
    const t0 = Date.now();
    while (Date.now() - t0 < 120_000) {
      const s = await page.evaluate(() => ({
        読み込み中: !!document.querySelector("#purchaseSameNameProducts .purchase-same-name-loading"),
        行: document.querySelectorAll("#purchaseSameNameProducts .purchaseSameNameProduct:not(.purchase-same-name-loading)").length,
      }));
      if (!様子.length || 様子[様子.length - 1].読み込み中 !== s.読み込み中 || 様子[様子.length - 1].行 !== s.行) 様子.push(s);
      if (s.行 > 0 && !s.読み込み中) break;
      await page.waitForTimeout(150);
    }
    await v.読み込みを待つ();
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);
    rows = await v.見えている行();
    note(`他のバージョン商品の区画の移り変わり: ${様子.map((s) => `${s.読み込み中 ? "読み込み中の画像" : "読み込み中なし"}・行${s.行}`).join(" → ")}`);
    await cdp!.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  });
  await expected(async () => {
    expect.soft(様子[0]?.読み込み中 ?? false, "商品が出る前に、読み込み中の画像が先に表示された").toBe(true);
    expect.soft(様子.length > 0 && 様子[様子.length - 1].行 > 0 && !様子[様子.length - 1].読み込み中, "商品が一覧に表示された時点で、読み込み中の画像が消えた").toBe(true);
    for (const x of rows) {
      const 正本 = ["VER-001", "VER-002", "VER-003", "VER-004", "VER-005", "VER-006", "VER-007", "VER-008", "VER-009"].map((n) => `${n}-042`).find((n) => rc(n) === x.商品名);
      const 画像 = 正本 ? f0504索引の商品(正本).画像 ?? "" : "";
      expect.soft(x.画像, `${x.商品名} の画像が、その商品の実画像（${画像 || "不明"}）に差し替わった`).toContain(画像 || "（対応する商品が無い）");
    }
  });
});

// ---- 054（PC版のカテゴリ一覧から一覧へ） ----
caseTest("IT-F05-04-054", async ({ page, notes, step, expected }) => {
  const r = new ネット買取の検索結果(page);
  let d!: NetBuyDetailPage;
  let rows: 一覧の行[] = [];
  note(印の注記);
  note(`カテゴリ「タルキール：龍嵐録」は、カテゴリ一覧（サイドバー）から押せる実行の印つきのカテゴリ（最新セットの下の「${rc(F0504カテゴリ.最新セットの親)}」の子「${rc(F0504カテゴリ.最新セットの子)}」）で代えた。子のカテゴリを押した`);
  await step(1, async () => { d = await 詳細を開く(page, notes.get("〔商品ID-F0504-054A〕")); await カテゴリ一覧の描画を待つ(page); });
  await step(2, async () => {
    await d.サイドバーの子カテゴリを押す(rc(F0504カテゴリ.最新セットの親), rc(F0504カテゴリ.最新セットの子));
    await r.結果を待つ();
    rows = await r.行を読む();
    note(`遷移先: ${decodeURIComponent(page.url())}。一覧: ${名(rows).join("、")}`);
  });
  await expected(async () => {
    await expect.soft(page.locator("body.purchase_search"), "ネット買取商品一覧（買取商品検索）の画面へ遷移した").toHaveCount(1);
    expect.soft(new URL(page.url()).pathname, "遷移先はカテゴリで検索した一覧").toMatch(/\/purchase\/search\/cate\/\d+/);
    expect.soft(rows.map((x) => x.商品ID).sort(), "商品ID 〔商品ID-F0504-054A〕と〔商品ID-F0504-054B〕が表示された").toEqual([notes.get("〔商品ID-F0504-054A〕"), notes.get("〔商品ID-F0504-054B〕")].sort());
  });
});

// ---- 062・065（組合せ） ----
const 詰める = (s: string | undefined) => (s ?? "").replace(/\s+/g, "");
function 組合せ(no: "062" | "065", 指定: (規格: Record<string, string>) => { 言語: string; 商品クラス?: string }, 言語: "JP" | "EN", クラス: string, 説明の期待: { パワー・タフネス?: string; 忠誠度: string }) {
  return async ({ page, notes, step, expected }: Parameters<Parameters<typeof caseTest>[1]>[0]) => {
    const p = f0504索引の商品(`F0504-CB${no}-A`);
    const v = new 他のバージョン商品(page);
    let d!: NetBuyDetailPage;
    let rows: 一覧の行[] = [];
    note(`同名カードの一覧は、ネット買取商品詳細の他のバージョン商品の区画（同じカードIDの商品の一覧）と読んだ。${印の注記}`);
    await step(1, async () => {
      d = await 詳細を開く(page, notes.get(`〔商品ID-F0504-${no}A〕`), 指定(p.規格));
      await expect(d.カード説明, "カード説明").toBeVisible();
      note(`開いたアドレス: ${page.url()}`);
    });
    await expected(async () => {
      const 説明 = await d.カード説明の値();
      expect.soft(await d.言語ボタンは選択状態(言語), `言語${言語}が選択状態`).toBe(true);
      expect.soft(await d.選ばれている商品クラス(), `選択状態の商品クラス（${クラス}の商品規格ID）`).toBe(p.規格[クラス]);
      if (説明の期待.パワー・タフネス) expect.soft(詰める(説明["パワー・タフネス"]), "カード説明のパワー・タフネス").toBe(説明の期待.パワー・タフネス);
      else expect.soft(Object.keys(説明), "カード説明にパワー・タフネスが表示されない").not.toContain("パワー・タフネス");
      expect.soft(詰める(説明["忠誠度"]), "カード説明の忠誠度").toBe(説明の期待.忠誠度);
      expect.soft(await d.数量.count(), "商品数の欄の数").toBe(0);
      expect.soft(await d.マイナス.count(), "マイナスボタンの数").toBe(0);
      expect.soft(await d.プラス.count(), "プラスボタンの数").toBe(0);
      expect.soft(await d.カートに追加ボタン.count(), "カートに入れるボタンの数").toBe(0);
      rows = await 他のバージョンを読む(v, "同名カードの一覧");
      expect.soft(rows.map((x) => x.商品ID), `同名カードの一覧に商品ID 〔商品ID-F0504-${no}B〕が表示された`).toContain(notes.get(`〔商品ID-F0504-${no}B〕`));
    });
  };
}
caseTest("IT-F05-04-062", 組合せ("062", (k) => ({ 言語: "ZZ", 商品クラス: k["JP-EX"] }), "JP", "JP-EX", { 忠誠度: "5" }));
caseTest("IT-F05-04-065", 組合せ("065", () => ({ 言語: "EN" }), "EN", "EN-NM", { パワー・タフネス: "3/4", 忠誠度: "5" }));
