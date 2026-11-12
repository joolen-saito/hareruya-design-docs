/**
 * F03-02 商品詳細のうち、検索サービスの索引に載せた商品で確かめるケース（001・096〜099）。
 * 正本: cases/F03-02_test_cases.tsv。シード: seeds/f03-02.ts の末尾（索引用の組をまとめて作り、フィードを1回送って反映を待つ）。
 *
 * 画面に合わせて読んだこと（手順の注記に残す）:
 * - 正本の商品名には実行の印が付いている。
 * - 「他のバージョンも見る」の欄は、規格（状態）ごとに商品カードが並ぶ。状態EXは手元の環境に無いので SP として扱う（シードと同じ）。
 */
import { Dialog, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { 有効な入荷通知依頼の件数 } from "../../db/f03_01";
import { FrontDetail, 店 } from "../../pages/front/f03_02_detail";
import { FrontProductList, カートの中身 } from "../../pages/front/f03_01_product_list";
import { FrontFavorite } from "../../pages/front/f03_08_favorite";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { F0302の他版, memberOf, 他版102の値, 他版102の名前 } from "../../seeds/f03-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

caseTest("IT-F03-02-001", async ({ page, notes, step, expected }) => {
  const list = new FrontProductList(page);
  const detail = new FrontDetail(page);
  const 商品ID = notes.get("〔商品ID-F0302-共有-BASE-CARD〕");
  const 名 = rc("結合試験カード");
  const 開いた: Record<string, { url: string; 商品名: string }> = {};
  for (const [n, shop, 入口] of [[1, "本店", 店.本店], [2, "TC大阪支店", 店.TC大阪支店]] as const) {
    await step(n, async () => {
      expect(await list.openKeyword(入口, 名), `${shop}の商品一覧の応答`).toBeLessThan(400);
      await list.カードの商品名を押す(商品ID);
      開いた[shop] = { url: page.url(), 商品名: await detail.商品名の文() };
    });
  }
  note(`商品一覧は、商品名（印つきの「${名}」）で検索して開き、一覧の商品カードの商品名を押して商品詳細を開いた`);
  await expected(async () => {
    const host = new URL(BASE_URL).host;
    for (const [shop, 入口] of [["本店", 店.本店], ["TC大阪支店", 店.TC大阪支店]] as const) {
      const u = new URL(開いた[shop].url);
      expect.soft(u.host, `${shop}から開いた商品詳細のドメインが同じ（${host}）`).toBe(host);
      expect.soft(u.pathname, `${shop}から開いた商品詳細のコンテキストルートが ${入口}/ のまま`).toBe(`${入口}/products/detail/${商品ID}`);
      expect.soft(開いた[shop].商品名, `${shop}の商品詳細に「結合試験カード」が表示される`).toContain(名);
    }
  });
});

/** 096・097: 会員でログインし、基準カードの商品詳細の他のバージョンの欄で、お気に入りカードの表示を見る */
function 他版のお気に入り(o: { n: "096" | "097"; 入口: string; 店名: string; お気に入り表示: boolean }) {
  return async ({ page, notes, step, expected }: CaseCtx) => {
    const detail = new FrontDetail(page);
    const m = memberOf(`f0302-member-${o.n}`);
    const B = notes.get(`〔商品ID-F0302-${o.n}B〕`);
    let 読んだ: Awaited<ReturnType<FrontDetail["他のバージョンを読む"]>> = [];
    await step(1, async () => {
      const fav = new FrontFavorite(page, `${BASE_URL}${o.入口}`);
      const 入力した = await fav.login(m.mail, m.password);
      if (!入力した) note(`${o.店名}のログイン画面は、ログイン済みのため出なかった`);
    });
    await step(2, async () => {
      expect((await detail.open(o.入口, notes.get(`〔商品ID-F0302-${o.n}A〕`)))?.status() ?? 0, `${o.店名}の基準カードの商品詳細の応答`).toBeLessThan(400);
    });
    await step(3, async () => {
      await detail.他のバージョンのボタン.first().click({ timeout: 10_000 }).catch(() => undefined);
      await detail.他のバージョンを待つ();
      読んだ = (await detail.他のバージョンを読む()).filter((c) => c.商品ID === B);
    });
    await expected(async () => {
      expect(読んだ.length, "他のバージョンの欄に、お気に入りカード（同じカードの別の商品）が出ている").toBeGreaterThan(0);
      if (o.お気に入り表示) {
        expect.soft(読んだ.every((c) => c.お気に入りボタン && c.お気に入り済み), "お気に入りカードが、お気に入り登録中（お気に入りのボタンが選択済み）として表示される").toBe(true);
      } else {
        expect.soft(読んだ.some((c) => c.お気に入り済み), "お気に入りカードに、お気に入り登録中の表示が出ない").toBe(false);
        note(`お気に入りのボタンそのものは ${読んだ.some((c) => c.お気に入りボタン) ? "表示されていた（登録中の印は無い）" : "表示されていなかった"}`);
      }
    });
  };
}

caseTest("IT-F03-02-096", 他版のお気に入り({ n: "096", 入口: 店.本店, 店名: "本店", お気に入り表示: true }));
caseTest("IT-F03-02-097", 他版のお気に入り({ n: "097", 入口: 店.TC大阪支店, 店名: "TC大阪支店", お気に入り表示: false }));

caseTest("IT-F03-02-098", async ({ page, notes, step, expected }) => {
  const detail = new FrontDetail(page);
  const B = notes.get("〔商品ID-F0302-098B〕");
  const 規格: Record<"NM" | "SP", string> = { NM: "", SP: "" };
  const 警告: string[] = [];
  page.on("dialog", (d: Dialog) => { 警告.push(d.message()); d.accept().catch(() => {}); });
  let カート: { 規格ID: string; 数量: number; 名前: string }[] = [];
  await step(1, async () => {
    expect((await detail.open(店.本店, notes.get("〔商品ID-F0302-098A〕")))?.status() ?? 0, "一括基準カードの商品詳細の応答").toBeLessThan(400);
  });
  await step(2, async () => {
    await detail.他のバージョンを待つ();
    for (const [状態, 数] of [["NM", "1"], ["SP", "2"]] as const) {
      const card = detail.他のバージョンの商品(B, 状態);
      await expect(card, `他のバージョンの欄に一括他版カードの ${状態} がある`).toHaveCount(1);
      規格[状態] = (await detail.カードのカートに追加(card).getAttribute("data-productclass")) ?? "";
      await detail.カードの数量(card).fill(数);
    }
    note("EX は手元の環境に無い状態なので、シードで作った SP（2番目の状態）の商品数を2にした");
  });
  await step(3, async () => {
    for (const 状態 of ["NM", "SP"] as const) {
      const card = detail.他のバージョンの商品(B, 状態);
      await Promise.all([
        page.waitForResponse((r) => /\/products\/add_cart\//.test(r.url()), { timeout: 30_000 }),
        detail.カードのカートに追加(card).click(),
      ]);
    }
    note("他のバージョンの欄の「カートに追加」は状態ごとのカードにあるので、NM と SP のカードの「カートに追加」をそれぞれ押した");
    if (警告.length) note(`押したあとに出た警告: ${警告.join(" / ")}`);
  });
  await step(4, async () => { カート = await カートの中身(page, 店.本店); });
  await expected(async () => {
    expect.soft(カート.find((x) => x.規格ID === 規格.NM)?.数量 ?? 0, "一括他版カードの NM が1点カートに入っている").toBe(1);
    expect.soft(カート.find((x) => x.規格ID === 規格.SP)?.数量 ?? 0, "一括他版カードの EX（SP）が2点カートに入っている").toBe(2);
  });
});

caseTest("IT-F03-02-099", async ({ page, notes, step, expected }) => {
  const detail = new FrontDetail(page);
  const front = new FrontRestock(page);
  const m = memberOf("f0302-member-099");
  const B = notes.get("〔商品ID-F0302-099B〕");
  const NM規格 = F0302の他版("S-F03-02-NOTIFYVER-099", "通知他版カード F0302-099-B").商品規格ID;
  const dialogs: Dialog[] = [];
  page.on("dialog", (d: Dialog) => { dialogs.push(d); });
  let 件数 = -1;
  await step(1, async () => { await front.login(m.mail, m.password); });
  await step(2, async () => {
    expect((await detail.open(店.本店, notes.get("〔商品ID-F0302-099A〕")))?.status() ?? 0, "通知基準カードの商品詳細の応答").toBeLessThan(400);
  });
  await step(3, async () => {
    await detail.他のバージョンを待つ();
    const card = detail.他のバージョンの商品(B).first();
    await expect(card, "他のバージョンの欄に通知他版カードがある").toHaveCount(1);
    const button = detail.カードの通知ボタン(card);
    expect(await button.getAttribute("data-productclass"), "押す通知ボタンは、通知他版カードの先頭の商品規格（NM）のもの").toBe(NM規格);
    const r = await front.press(button);
    note(`通知ボタンを押した結果: 画面右下の通知 ${r.通知が出た ? `「${r.通知の文}」` : "なし"}・確認のモーダル ${r.確認のモーダルが開いた ? "あり" : "なし"}・ログインモーダル ${r.ログインモーダルが開いた ? "あり" : "なし"}`);
  });
  await step(4, async () => {
    if (dialogs.length) {
      for (const d of dialogs) await d.accept().catch(() => {});
      note(`確認のポップアップ（${dialogs.map((d) => d.message()).join(" / ")}）で了承した`);
    } else if (await front.通知が出ているか()) {
      await front.通知の閉じるボタン.click().catch(() => {});
      note("通知ボタンを押すと依頼が送られ、確認のポップアップは出ず画面右下に完了の通知が出たので、その通知を閉じた（了承の操作に当たるものはこれだけ）");
    } else {
      note("確認のポップアップも完了の通知も出なかった");
    }
  });
  await step(5, async () => { 件数 = 有効な入荷通知依頼の件数(m.mail, NM規格); });
  await expected(async () => {
    expect(件数, "会員F0302-MEMBER-099に、通知他版カードの先頭の商品規格（NM）の入荷通知依頼が1件登録されている").toBe(1);
  });
});

// ---- 他のバージョンの欄（102件）: 054・055・057〜063・100〜105・112 ----
// 正本の「結合試験カード」（共有の BASE-CARD）の代わりに、S-F03-02-OTHER-VERSIONS が作った、この束専用の基準の商品「結合試験カード 他版確認用」を開く（PM の指示 2026-11-11）。

/** 基準の商品の商品詳細を開き、他のバージョンの欄の読み込みを待つ */
async function 基準を開く(detail: FrontDetail, 入口: string = 店.本店): Promise<ReturnType<typeof 他版102の値>> {
  const v = 他版102の値();
  expect((await detail.open(入口, v.基準ID))?.status() ?? 0, "基準の商品の商品詳細の応答").toBeLessThan(400);
  await detail.他のバージョンを待つ();
  note(`正本の「結合試験カード」は、この束専用に作った基準の商品「${rc(他版102の名前.基準)}」（商品ID ${v.基準ID}。同じカードの商品102件の1つ）として開いた`);
  return v;
}
const 見えている = async (detail: FrontDetail) => (await detail.他版のすべて()).filter((x) => x.見えている);

function カード情報のリンクから(o: { 名: string; 引数: "cardset" | "illustrator" }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const detail = new FrontDetail(page);
    const list = new FrontProductList(page);
    let v!: ReturnType<typeof 他版102の値>;
    let 結果: string[] = [];
    await step(1, async () => { v = await 基準を開く(detail); });
    await step(2, async () => {
      const link = detail.カード情報のリンク(o.名);
      await expect(link, `カード情報の「${o.名}」のリンク`).toHaveCount(1);
      await Promise.all([page.waitForURL(/\/products\/search/, { waitUntil: "domcontentloaded" }), link.click()]);
      await list.結果を待つ();
      結果 = (await list.カードを読む()).map((c) => c.商品ID);
    });
    await expected(async () => {
      const u = new URL(page.url());
      const want = o.引数 === "cardset" ? v.カードセットID : v.イラストレーターID;
      expect.soft(u.pathname, "商品一覧画面が開いた").toBe("/ja/products/search");
      expect.soft(u.searchParams.get(o.引数), `「${o.名}」で検索した商品一覧（検索の条件がその${o.引数 === "cardset" ? "カードセット" : "イラストレーター"}）`).toBe(want);
      expect.soft(結果, `「${o.名}」の商品（基準の商品）が一覧に出る`).toContain(v.基準ID);
    });
  };
}
caseTest("IT-F03-02-054", カード情報のリンクから({ 名: rc("テストセット"), 引数: "cardset" }));
caseTest("IT-F03-02-055", カード情報のリンクから({ 名: "試験太郎", 引数: "illustrator" }));

caseTest("IT-F03-02-057", async ({ page, step, expected }) => {
  const detail = new FrontDetail(page);
  let v!: ReturnType<typeof 他版102の値>;
  let 結果: string[] = [];
  await step(1, async () => { v = await 基準を開く(detail); });
  await step(2, async () => {
    await detail.他版の絞り込みを押す("jp");
    await detail.他版の絞り込みを押す("tokusyu");
    結果 = (await 見えている(detail)).map((x) => x.商品ID);
  });
  await expected(async () => {
    expect(結果, "JPかつFoil「特殊」で同じカードの「特殊Foil版カード」だけが出る").toEqual([v.特殊ID]);
  });
});

caseTest("IT-F03-02-058", async ({ page, step, expected }) => {
  const detail = new FrontDetail(page);
  let v!: ReturnType<typeof 他版102の値>;
  let 件数: number | null = null;
  let 見えた: Awaited<ReturnType<FrontDetail["他版のすべて"]>> = [];
  await step(1, async () => { v = await 基準を開く(detail); });
  await step(2, async () => {
    await detail.他版の絞り込みを押す("soldout");
    件数 = await detail.他版の商品数();
    見えた = await 見えている(detail);
  });
  await expected(async () => {
    expect.soft(件数, "「在庫ありのみ」の商品数は在庫1以上の51件").toBe(v.在庫ありID.length);
    expect.soft(見えた.length, "表示された商品がある").toBeGreaterThan(0);
    expect.soft(見えた.filter((x) => !v.在庫ありID.includes(x.商品ID)).map((x) => x.商品ID), "表示された商品に在庫0の商品が無い").toEqual([]);
  });
});

caseTest("IT-F03-02-059", async ({ page, step, expected }) => {
  const detail = new FrontDetail(page);
  let v!: ReturnType<typeof 他版102の値>;
  let 件数: number | null = null;
  let 全部: string[] = [];
  await step(1, async () => { v = await 基準を開く(detail, 店.TC大阪支店); });
  await step(2, async () => { 件数 = await detail.他版の商品数(); 全部 = (await detail.他版のすべて()).map((x) => x.商品ID); });
  await expected(async () => {
    expect.soft(全部.filter((id) => v.非公開ID.includes(id)), "TC大阪支店で非公開の商品が欄に無い").toEqual([]);
    expect.soft(件数, "欄の商品数は TC大阪支店で公開の60件").toBe(102 - v.非公開ID.length);
  });
});

caseTest("IT-F03-02-060", async ({ page, step, expected }) => {
  const detail = new FrontDetail(page);
  const 価格: Record<string, number[]> = {};
  await step(1, async () => { await 基準を開く(detail); });
  await step(2, async () => {
    const 読み込み = await detail.他版の並び順を押す("price_asc");
    if (!読み込み) note("「価格(低い順)」は初めから選ばれていて、押しても読み込み直さなかった（初めの並びのまま）");
    価格.低い順 = (await detail.他版のすべて()).map((x) => x.価格 ?? NaN);
  });
  await step(3, async () => {
    await detail.他版の並び順を押す("price_desc");
    価格.高い順 = (await detail.他版のすべて()).map((x) => x.価格 ?? NaN);
  });
  await expected(async () => {
    expect.soft(価格.低い順.length, "価格(低い順)で商品が並んでいる").toBeGreaterThan(0);
    expect.soft(価格.低い順, "価格(低い順)は価格の昇順").toEqual([...価格.低い順].sort((a, b) => a - b));
    expect.soft(価格.高い順, "価格(高い順)は価格の降順").toEqual([...価格.高い順].sort((a, b) => b - a));
  });
});

/** 061〜063: ページ番号3を押し、続けて前へ・次へ（または何もしない） */
function ページ送り(o: { 次: "なし" | "前へ" | "次へ"; 期待: string }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const detail = new FrontDetail(page);
    let 表示中 = "";
    await step(1, async () => { await 基準を開く(detail); });
    await step(2, async () => { await detail.他版の項目を押す(detail.他版のページ番号(3)); 表示中 = await detail.他版の表示中のページ(); });
    if (o.次 !== "なし") {
      await step(3, async () => {
        await detail.他版の項目を押す(o.次 === "前へ" ? detail.他版の前へ : detail.他版の次へ);
        表示中 = await detail.他版の表示中のページ();
      });
    }
    await expected(async () => {
      expect(表示中, `他のバージョンの欄の表示中のページは ${o.期待}`).toBe(o.期待);
    });
  };
}
caseTest("IT-F03-02-061", ページ送り({ 次: "なし", 期待: "3" }));
caseTest("IT-F03-02-062", ページ送り({ 次: "前へ", 期待: "2" }));
caseTest("IT-F03-02-063", ページ送り({ 次: "次へ", 期待: "2" }));

caseTest("IT-F03-02-100", async ({ page, step, expected }) => {
  const detail = new FrontDetail(page);
  const 件数: (number | null)[] = [];
  await step(1, async () => { await 基準を開く(detail); });
  await step(2, async () => { 件数.push(await detail.他版の商品数()); });
  await step(3, async () => { await detail.他版の絞り込みを押す("jp"); await detail.他版の絞り込みを押す("tokusyu"); });
  await step(4, async () => { 件数.push(await detail.他版の商品数()); });
  await expected(async () => {
    expect.soft(件数[0], "絞り込み前の商品数は102").toBe(102);
    expect.soft(件数[1], "JPかつFoil「特殊」で絞り込んだあとの商品数は1").toBe(1);
  });
});

caseTest("IT-F03-02-101", async ({ page, step, expected }) => {
  const detail = new FrontDetail(page);
  let 前: number[] = [];
  let 後: number[] = [];
  let 読み込んだ = true;
  await step(1, async () => { await 基準を開く(detail); });
  await step(2, async () => { await detail.他版の並び順を押す("price_asc"); 前 = (await detail.他版のすべて()).map((x) => x.価格 ?? NaN); });
  await step(3, async () => { 読み込んだ = await detail.他版の並び順を押す("price_asc"); 後 = (await detail.他版のすべて()).map((x) => x.価格 ?? NaN); });
  await expected(async () => {
    expect.soft(読み込んだ, "表示中の「価格(低い順)」を押しても読み込み直さない（押下できない）").toBe(false);
    await expect.soft(detail.他版の並び順("price_asc"), "「価格(低い順)」が表示中のまま").toHaveClass(/is-active/);
    expect.soft(後, "押したあとも並びは変わらない").toEqual(前);
    expect.soft(後, "並びは価格の昇順").toEqual([...後].sort((a, b) => a - b));
  });
});

caseTest("IT-F03-02-102", async ({ page, step, expected }) => {
  const detail = new FrontDetail(page);
  let リンク = true;
  let 表示中 = "";
  await step(1, async () => { await 基準を開く(detail); });
  await step(2, async () => { await detail.他版の項目を押す(detail.他版のページ番号(3)); });
  await step(3, async () => {
    リンク = await detail.他版の項目がリンクか(detail.他版のページ番号(3));
    await detail.他版の項目を押す(detail.他版のページ番号(3));
    表示中 = await detail.他版の表示中のページ();
  });
  await expected(async () => {
    expect.soft(リンク, "表示中のページ番号3はページ遷移のリンクでない（押下できない）").toBe(false);
    expect.soft(表示中, "押しても3ページ目のまま").toBe("3");
  });
});

function ページの並び(o: { ページ: number; 期待: string[] }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const detail = new FrontDetail(page);
    let 並び: string[] = [];
    await step(1, async () => { await 基準を開く(detail); });
    await step(2, async () => { await detail.他版の項目を押す(detail.他版のページ番号(o.ページ)); });
    await step(3, async () => { 並び = await detail.他版のページの並び(); });
    await expected(async () => {
      expect(並び.join(" "), `ページ番号の並びが「${o.期待.join(" ")}」`).toBe(o.期待.join(" "));
    });
  };
}
caseTest("IT-F03-02-103", ページの並び({ ページ: 3, 期待: ["1", "2", "3", "4", "5", "...", "17"] }));
caseTest("IT-F03-02-104", ページの並び({ ページ: 17, 期待: ["1", "...", "13", "14", "15", "16", "17"] }));

function 省略を押す(o: { 先に: number | null; 期待: string }) {
  return async ({ page, step, expected }: CaseCtx) => {
    const detail = new FrontDetail(page);
    let リンク = true;
    let 表示中 = "";
    let k = 0;
    await step(++k, async () => { await 基準を開く(detail); });
    if (o.先に !== null) await step(++k, async () => { await detail.他版の項目を押す(detail.他版のページ番号(o.先に!)); });
    await step(++k, async () => {
      const item = detail.他版の省略.first();
      await expect(item, "ページ番号の「...」").toHaveCount(1);
      リンク = await detail.他版の項目がリンクか(item);
      await detail.他版の項目を押す(item);
      表示中 = await detail.他版の表示中のページ();
    });
    await expected(async () => {
      expect.soft(リンク, "「...」はページ遷移のリンクでない").toBe(false);
      expect.soft(表示中, `押しても ${o.期待} ページ目のまま`).toBe(o.期待);
    });
  };
}
caseTest("IT-F03-02-105", 省略を押す({ 先に: null, 期待: "1" }));
caseTest("IT-F03-02-112", 省略を押す({ 先に: 17, 期待: "17" }));
