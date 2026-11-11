/**
 * F03-02 商品詳細（フロント）の続き。2026-11-10 の方針（既存データ・画面で作ったデータへの読み替え）で実装した分。正本: cases/F03-02_test_cases.tsv
 * 読み替えの内容は、シードの注記（seeds/f03-02.ts の「読み替え」）と、各ケースの「手順の注記」に残す。
 * 状態EXは手元の環境に無いので、正本の「EX」は2番目の状態「SP」に読み替えている。
 */
import { Locator, Page, Response, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { お気に入り件数 } from "../../db/f03_08";
import { CaseBody, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { FrontCart, FrontDetail, 店 } from "../../pages/front/f03_02_detail";
import { FRONT_BRANCH, FrontFavorite } from "../../pages/front/f03_08_favorite";
import { classIdOf, memberOf, 長い商品名 } from "../../seeds/f03-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const status = (r: Response | null) => r?.status() ?? 0;

const BASE = "S-F03-02-BASE-CARD";
const BASE_ID = "〔商品ID-F0302-共有-BASE-CARD〕";
const BASE_NAME = "結合試験カード";
const EX注記 = "正本の状態「EX」は、手元の環境に状態EXが無いので、2番目の状態「SP」に読み替えた（シードの注記）";

type 開いた結果 = { 応答: number; 商品名: string };
async function 開く(d: FrontDetail, 入口: string, 商品ID: string, query: Record<string, string> = {}): Promise<開いた結果> {
  const res = await d.open(入口, 商品ID, query);
  const got = { 応答: status(res), 商品名: await d.商品名の文() };
  note(`${入口}/products/detail/${商品ID}${Object.keys(query).length ? `?${new URLSearchParams(query)}` : ""} を開いた: 応答 ${got.応答}・商品名の見出し「${got.商品名}」`);
  return got;
}
/** 開いて、商品名の見出しが出たことを確かめる（以降の「表示される・されない」を数える前に、画面が出ていることを確かめる） */
async function 開いて確かめる(d: FrontDetail, 入口: string, 商品ID: string, 商品名: string, query: Record<string, string> = {}): Promise<void> {
  const got = await 開く(d, 入口, 商品ID, query);
  expect(got.応答, "商品詳細画面の応答").toBe(200);
  expect(got.商品名, "商品詳細画面が表示された（商品名の見出し）").toBe(rc(商品名));
}
const 数字 = (s: string) => Number(s.replace(/[^\d]/g, ""));
const 行の状態 = (s: string) => s.split(" ")[0];

// ---- 店舗・パンくず・検索エンジン向けの設定 ----

caseTest("IT-F03-02-002", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get(BASE_ID);
  let hq: 開いた結果 = { 応答: 0, 商品名: "" };
  let branch: 開いた結果 = { 応答: 0, 商品名: "" };
  await step(1, async () => { hq = await 開く(d, 店.本店, id); });
  await step(2, async () => { branch = await 開く(d, 店.TC大阪支店, id); });
  await expected(async () => {
    expect.soft(hq.応答, "本店: 商品詳細画面の応答").toBe(200);
    expect.soft(hq.商品名, "本店: 商品名の見出し").toBe(rc(BASE_NAME));
    expect.soft(branch.応答, "TC大阪支店: 商品詳細画面の応答").toBe(200);
    expect.soft(branch.商品名, "TC大阪支店: 商品名の見出し").toBe(rc(BASE_NAME));
  });
});

caseTest("IT-F03-02-004", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get(BASE_ID);
  const got = { 本店: "", 支店: "" };
  const ホームを押す = async (入口: string): Promise<string> => {
    await 開いて確かめる(d, 入口, id, BASE_NAME);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), d.パンくずのホーム.click()]);
    const path = new URL(page.url()).pathname.replace(/\/$/, "");
    note(`ホームアイコンを押したあとのアドレスのパス: ${path}`);
    return path;
  };
  await step(1, async () => { got.本店 = await ホームを押す(店.本店); });
  await step(2, async () => { got.支店 = await ホームを押す(店.TC大阪支店); });
  await expected(async () => {
    expect.soft(got.本店, "本店の商品詳細からホームアイコンを押した先（本店TOP）").toBe("/ja");
    expect.soft(got.支店, "支店の商品詳細からホームアイコンを押した先（現在の支店のTOP）").toBe("/ja/osaka");
  });
});

caseTest("IT-F03-02-005", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const catName = rc("テストセット");
  let href = "";
  let res: Response | null = null;
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
  await step(2, async () => {
    note("パンくずの商品カテゴリ「テストセット」は、シードが新しく作った最上位のカテゴリ（正本のカードセットのカテゴリの読み替え）");
    const link = d.パンくずのリンク(catName);
    await expect(link, "パンくずの「テストセット」のリンク").toHaveCount(1);
    href = (await link.getAttribute("href")) ?? "";
    [res] = await Promise.all([page.waitForNavigation({ waitUntil: "load" }), link.click()]);
    note(`パンくずのリンク先: ${href} → ${page.url()}（応答 ${status(res)}）`);
  });
  await expected(async () => {
    const categoryId = /(\d+)(?:[/?#].*)?$/.exec(href)?.[1] ?? "";
    expect.soft(categoryId, "パンくずのリンク先からカテゴリIDを読めた").not.toBe("");
    expect.soft(status(res), "商品一覧画面の応答").toBeLessThan(400);
    expect.soft(page.url(), "商品一覧画面のアドレス（商品の一覧）").toContain("/products/");
    expect.soft(page.url(), "商品一覧画面のアドレスにカテゴリIDがある").toContain(categoryId);
    expect.soft(await d.本文(), "商品一覧画面に、カテゴリ「テストセット」の表示がある").toContain(catName);
  });
});

caseTest("IT-F03-02-006", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let robots: string[] = [];
  await step(1, async () => { await 開いて確かめる(d, 店.TC大阪支店, notes.get(BASE_ID), BASE_NAME); });
  await step(2, async () => {
    // 開発者ツールで見る検索エンジン向け設定にあたる、head の robots の指定
    robots = await page.locator('meta[name="robots"]').evaluateAll((ms) => ms.map((m) => m.getAttribute("content") ?? ""));
    note(`head の robots の指定: ${JSON.stringify(robots)}`);
  });
  await expected(async () => { expect(robots, "支店の商品詳細の robots の指定").toContain("noindex"); });
});

caseTest("IT-F03-02-068", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let n = -1;
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
  await step(2, async () => {
    n = await d.英語版の対応付け.count();
    note(`ページの言語の対応付け: ${JSON.stringify(await d.言語の対応付け())}。商品の販売制限は取込の「日本語英語両サイト」（英語向けの表示を含む）`);
  });
  await expected(async () => { expect(n, "英語版ページとの対応付けの数").toBe(1); });
});

// ---- 会員の表示 ----

caseTest("IT-F03-02-007", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const fav = new FrontFavorite(page);
  const m = memberOf("f0302-member-007");
  await step(1, async () => { await fav.login(m.mail, m.password); });
  await step(2, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
  await expected(async () => {
    note("「入荷通知/通知待ち」は、在庫0の状態（シードが足した MP）の行の通知ボタンで見る。在庫のある状態には通知ボタンが出ない");
    await expect.soft(d.価格表.locator("button.notifyme, button.notifyme-cancel").first(), "入荷通知/通知待ち").toBeVisible();
    await expect.soft(d.お気に入り, "お気に入り").toBeVisible();
    await expect.soft(d.まとめて入荷通知, "まとめて入荷通知").toBeVisible();
    await expect.soft(d.SNSでシェア, "SNSでシェアする").toBeVisible();
  });
});

caseTest("IT-F03-02-008", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const fav = new FrontFavorite(page, FRONT_BRANCH);
  const m = memberOf("f0302-member-008");
  await step(1, async () => { await fav.login(m.mail, m.password); });
  await step(2, async () => { await 開いて確かめる(d, 店.TC大阪支店, notes.get(BASE_ID), BASE_NAME); });
  await expected(async () => {
    expect.soft(d.入荷通知のボタン, "入荷通知/通知待ち").toHaveCount(0);
    expect.soft(d.お気に入り, "お気に入り").toHaveCount(0);
    expect.soft(d.まとめて入荷通知, "まとめて入荷通知").toHaveCount(0);
    expect.soft(d.SNSでシェア, "SNSでシェアする").toHaveCount(0);
  });
});

caseTest("IT-F03-02-009", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
  await expected(async () => {
    await expect.soft(d.言語切替, "カード専用の言語切替").toBeVisible();
    expect.soft(await d.状態の列.count(), "状態の欄（見出し・行）の数").toBeGreaterThan(0);
    await expect.soft(d.まとめて入荷通知, "まとめて入荷通知").toBeVisible();
    await expect.soft(d.使われているデッキのボタン, "使われているデッキのボタン").toBeVisible();
    await expect.soft(d.デッキの欄, "使われているデッキの欄").toBeVisible();
    await expect.soft(d.他のバージョンのボタン, "他のバージョンのボタン").toBeVisible();
    await expect.soft(d.他のバージョンの欄, "他のバージョンの欄").toBeVisible();
    await expect.soft(d.掲載記事一覧, "掲載記事一覧のリンク").toBeVisible();
    await expect.soft(d.カード情報, "カード情報").toBeVisible();
  });
});

caseTest("IT-F03-02-020", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const fav = new FrontFavorite(page);
  const m = memberOf("f0302-member-020");
  let 文言 = "";
  let 選択中 = false;
  await step(1, async () => { await fav.login(m.mail, m.password); });
  await step(2, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME);
    note("入荷通知の依頼は、シードが会員でログインして「まとめて入荷通知」を押して作った日本語の依頼（正本はJPのNM規格の依頼。NMは在庫があり規格ごとの通知ボタンが出ないので読み替えた）");
    await expect(d.まとめて入荷通知, "まとめて入荷通知のボタン").toBeVisible();
    文言 = await d.見えている文言(d.まとめて入荷通知);
    選択中 = /\bis-selected\b/.test((await d.まとめて入荷通知.getAttribute("class")) ?? "");
    note(`日本語のまとめて入荷通知のボタン: 文言「${文言}」・選択中=${選択中}`);
  });
  await expected(async () => {
    expect.soft(選択中, "日本語の入荷通知設定済みの表示（選択中）").toBe(true);
    expect.soft(文言, "ボタンの文言（通知待ち）").toContain("通知待ち");
  });
});

caseTest("IT-F03-02-120", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const fav = new FrontFavorite(page);
  const m = memberOf("dpf0302-120");
  let 文言 = "";
  let 選択中 = true;
  await step(1, async () => { await fav.login(m.mail, m.password); });
  await step(2, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
  await step(3, async () => {
    note("入荷通知の依頼は、シードが会員でログインして日本語の「まとめて入荷通知」を押して作った（正本はJPのNM規格の依頼。NMは在庫があり規格ごとの通知ボタンが出ないので読み替えた）。ENの操作部は、ENのまとめて入荷通知のボタンで見る");
    await d.言語ボタン("EN").click();
    await expect(d.価格表.first(), "ENの価格・在庫の表").toBeVisible();
    await expect(d.まとめて入荷通知, "まとめて入荷通知のボタン").toBeVisible();
    文言 = await d.見えている文言(d.まとめて入荷通知);
    選択中 = /\bis-selected\b/.test((await d.まとめて入荷通知.getAttribute("class")) ?? "");
    note(`ENのまとめて入荷通知のボタン: 文言「${文言}」・選択中=${選択中}`);
  });
  await expected(async () => {
    expect.soft(選択中, "ENの操作部が通知待ちの表示（選択中）でない").toBe(false);
    expect.soft(文言, "ENの操作部の文言（入荷通知）").toContain("入荷通知");
    expect.soft(文言, "ENの操作部の文言（通知待ちでない）").not.toContain("通知待ち");
  });
});

// ---- お気に入り ----

const 登録中の文言 = "お気に入りに登録中";

caseTest("IT-F03-02-024", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const fav = new FrontFavorite(page);
  const m = memberOf("f0302-member-024");
  const got = { JP: false, EN: true };
  await step(1, async () => { await fav.login(m.mail, m.password); });
  await step(2, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME);
    got.JP = await fav.登録済みの表示か(d.お気に入り);
    note(`JPのお気に入りボタン: 登録済み=${got.JP}・文言「${await fav.ボタンの文言(d.お気に入り)}」`);
  });
  await step(3, async () => {
    await d.言語ボタン("EN").click();
    await expect(d.言語ボタン("EN"), "ENへ切り替わった（選択中）").toBeDisabled();
    got.EN = await fav.登録済みの表示か(d.お気に入り);
    note(`ENのお気に入りボタン: 登録済み=${got.EN}・文言「${await fav.ボタンの文言(d.お気に入り)}」`);
  });
  await expected(async () => {
    expect.soft(got.JP, "JPのお気に入りの表示（登録済み）").toBe(true);
    expect.soft(got.EN, "ENのお気に入りの表示（登録済みでない）").toBe(false);
  });
});

function お気に入りを押す(a: { 会員: string; 会員ID: string; 前: number; 後: number }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    const fav = new FrontFavorite(page);
    const m = memberOf(a.会員);
    const id = notes.get(BASE_ID);
    const got = { 前: -1, 後: -1 };
    await step(1, async () => { await fav.login(m.mail, m.password); });
    await step(2, async () => {
      await 開いて確かめる(d, 店.本店, id, BASE_NAME, { lang: "JP" });
      got.前 = お気に入り件数(m.id, id, "JP");
      note(`押す前の、会員と商品のJPのお気に入りの件数: ${got.前}`);
    });
    await step(3, async () => {
      const r = await fav.押す(d.お気に入り);
      note(`お気に入りのボタンを押した: 通知=${r.通知が出た ? `出た「${r.通知の文}」` : "出ない"}`);
    });
    await step(4, async () => {
      await expect.poll(() => お気に入り件数(m.id, id, "JP"), { message: "お気に入りの件数が変わる", timeout: 15_000 }).toBe(a.後);
      got.後 = お気に入り件数(m.id, id, "JP");
      note(`DBで確かめた、会員 ${a.会員ID} と商品のJPのお気に入りの件数: ${got.後}`);
    });
    await expected(async () => {
      expect.soft(got.前, "押す前の件数").toBe(a.前);
      expect.soft(got.後, "押したあとの件数").toBe(a.後);
    });
  };
}
caseTest("IT-F03-02-025", お気に入りを押す({ 会員: "f0302-member-025", 会員ID: "〔会員ID-F0302-025〕", 前: 0, 後: 1 }));
caseTest("IT-F03-02-026", お気に入りを押す({ 会員: "f0302-member-026", 会員ID: "〔会員ID-F0302-026〕", 前: 1, 後: 0 }));

caseTest("IT-F03-02-119", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const fav = new FrontFavorite(page);
  let 文言 = "";
  let 選択中 = true;
  await step(1, async () => {
    note("お気に入りに登録済みの商品は、シードが会員でJPのお気に入りを作ったもの。このケースはログインしないまま開く（ブラウザは新しい状態で始まる）");
    const res = await page.goto(`${BASE_URL}/ja`, { waitUntil: "domcontentloaded" });
    expect(status(res), "ログインしないまま本店を開く").toBeLessThan(400);
  });
  await step(2, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" });
    await expect(d.お気に入り, "お気に入りのボタン").toBeVisible();
    選択中 = await fav.登録済みの表示か(d.お気に入り);
    文言 = await fav.ボタンの文言(d.お気に入り);
    note(`お気に入りのボタン: 選択中=${選択中}・文言「${文言}」`);
  });
  await expected(async () => {
    expect.soft(選択中, "お気に入りのボタンが登録済みの表示でない").toBe(false);
    expect.soft(文言, "ボタンの文言（登録中でない）").not.toContain(登録中の文言);
  });
});

// ---- 状態・数量・カート ----

caseTest("IT-F03-02-011", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let rows: { 状態: string; 価格: string; 在庫: string }[] = [];
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" }); });
  await step(2, async () => {
    rows = await d.行の文();
    note(`JPの状態別の表（上から）: ${JSON.stringify(rows)}。${EX注記}。SPの価格は200（正本は900）`);
  });
  await expected(async () => {
    const prices = rows.map((r) => 数字(r.価格));
    expect.soft(rows.length, "状態別の表の行（表示されたうえで数える）").toBeGreaterThan(1);
    expect.soft(prices[0], "先頭の行（NM）の価格").toBe(1500);
    expect.soft(行の状態(rows[1]?.状態 ?? ""), "2行目の状態（EXの読み替えのSP）").toBe("SP");
    expect.soft(prices[1], "2行目（SP）の価格").toBe(200);
    expect.soft(prices, "状態別の価格が降順").toEqual([...prices].sort((x, y) => y - x));
  });
});

caseTest("IT-F03-02-017", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const got = { NM: "", SP: "" };
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" });
    got.NM = await d.商品数の欄("NM").inputValue();
    got.SP = await d.商品数の欄("SP").inputValue();
    note(`初期表示の商品数: NM=${got.NM}・SP=${got.SP}。${EX注記}。在庫がある状態のうち最大価格はNM（1,500円）`);
  });
  await expected(async () => {
    expect.soft(got.NM, "NMの商品数").toBe("1");
    expect.soft(got.SP, "EX（SP）の商品数").toBe("0");
  });
});

/** 商品数を指定にして「カートに追加」を押し、カートを開く（NM・SP の目標の商品数） */
function カートに入れる(a: { NM: number; SP: number }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    const id = notes.get(BASE_ID);
    let rows: { 商品名: string; 数量: string }[] = [];
    await step(1, async () => { await 開いて確かめる(d, 店.本店, id, BASE_NAME, { lang: "JP" }); });
    await step(2, async () => {
      // 初期の商品数は NM=1・SP=0。プラスを押して目標にする
      for (const [状態, 目標] of [["NM", a.NM], ["SP", a.SP]] as const) {
        let 今 = Number(await d.商品数の欄(状態).inputValue());
        while (今 < 目標) {
          await d.プラス(状態).click();
          await expect(d.商品数の欄(状態), `${状態}の商品数`).toHaveValue(String(今 + 1));
          今 += 1;
        }
      }
      note(`商品数: NM=${await d.商品数の欄("NM").inputValue()}・SP=${await d.商品数の欄("SP").inputValue()}。${EX注記}`);
    });
    await step(3, async () => {
      const [res] = await Promise.all([
        page.waitForResponse((r) => r.url().includes(`/products/add_cart/${id}`) && r.request().method() === "POST", { timeout: 60_000 }),
        d.カートに追加.click(),
      ]);
      note(`カートに追加の応答: ${res.status()}`);
    });
    await step(4, async () => {
      const cart = new FrontCart(page);
      await cart.open(店.本店);
      rows = await cart.行();
      note(`ショッピングカートの行: ${JSON.stringify(rows)}`);
    });
    await expected(async () => {
      const name = rc(BASE_NAME);
      const 語: Record<string, string[]> = { NM: ["NM", "ニアミント"], SP: ["SP", "スライトリープレイド"] };
      const 行 = (状態: string) => rows.filter((r) => r.商品名.includes(name) && 語[状態].some((w) => r.商品名.replace(name, "").includes(w)));
      const nm = 行("NM");
      const sp = 行("SP");
      expect.soft(nm.map((r) => r.数量), "カートの NM の行の数量").toEqual(a.NM > 0 ? [String(a.NM)] : []);
      expect.soft(sp.map((r) => r.数量), `カートの EX（SP）の行の数量${a.SP > 0 ? "" : "（入っていない）"}`).toEqual(a.SP > 0 ? [String(a.SP)] : []);
    });
  };
}
caseTest("IT-F03-02-018", カートに入れる({ NM: 2, SP: 1 }));
caseTest("IT-F03-02-083", カートに入れる({ NM: 2, SP: 0 }));

caseTest("IT-F03-02-091", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let 前 = "";
  let 後 = "";
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" });
    前 = await d.商品数の欄("SP").inputValue();
    note(`EX（SP）の商品数（押す前）: ${前}。${EX注記}`);
  });
  await step(2, async () => {
    await d.マイナス("SP").click();
    await expect(d.商品数の欄("SP"), "EX（SP）の商品数が変わる").not.toHaveValue(前);
    後 = await d.商品数の欄("SP").inputValue();
  });
  await expected(async () => {
    expect.soft(前, "押す前のEX（SP）の商品数").toBe("0");
    expect.soft(後, "押したあとのEX（SP）の商品数（在庫の数）").toBe("3");
  });
});

caseTest("IT-F03-02-093", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const got = { 初期: "", 在庫と同じ: "", 最後: "" };
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" });
    got.初期 = await d.商品数の欄("NM").inputValue();
  });
  await step(2, async () => {
    await d.プラス("NM").click();
    await expect(d.商品数の欄("NM"), "NMの商品数が変わる").not.toHaveValue(got.初期);
    got.在庫と同じ = await d.商品数の欄("NM").inputValue();
  });
  await step(3, async () => {
    await d.プラス("NM").click();
    await expect(d.商品数の欄("NM"), "NMの商品数が変わる").not.toHaveValue(got.在庫と同じ);
    got.最後 = await d.商品数の欄("NM").inputValue();
  });
  await expected(async () => {
    expect.soft(got.在庫と同じ, "プラスを1回押したNMの商品数（在庫と同じ）").toBe("2");
    expect.soft(got.最後, "もう1回押したNMの商品数").toBe("0");
  });
});

caseTest("IT-F03-02-044", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME);
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  });
  await expected(async () => {
    expect(await d.価格表の行.count(), "状態別の表が表示されている（表示されたうえで数える）").toBeGreaterThan(0);
    await expect(d.週間販売数, "週間販売数の表示").toHaveCount(0);
  });
});

// ---- 初期表示の言語・規格 ----

function 初期表示ケース(a: {
  入口: string; ヘッダ: string; ロケール名: string; lang?: string; 規格?: { 言語: string; 状態: string } | "DAMAGED"; 期待: { 言語: string; 状態: string };
  seed?: string; 商品ID?: string; 商品名?: string; 手順数: number; 注記?: string;
}): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    const seed = a.seed ?? BASE;
    const label = a.商品ID ?? BASE_ID;
    const query: Record<string, string> = {};
    if (a.lang) query.lang = a.lang;
    if (a.規格 === "DAMAGED") query.class = "DAMAGED";
    else if (a.規格) query.class = classIdOf(seed, a.規格.言語, a.規格.状態);
    let got = { 言語: "", 状態: "" };
    let 応答 = 0;
    const setLocale = async () => {
      // 事前準備「ブラウザのロケールを〜にする」: ブラウザが送る言語の指定を変える
      await page.setExtraHTTPHeaders({ "Accept-Language": a.ヘッダ });
      note(`ブラウザのロケールは、ブラウザが送る言語の指定（Accept-Language: ${a.ヘッダ}）で設定した。${a.ロケール名}。アプリは言語をアドレスの ${a.入口} で決める`);
    };
    const open = async () => {
      const r = await d.open(a.入口, notes.get(label), query);
      応答 = status(r);
      got = await d.初期表示();
      note(`${a.入口}/products/detail/… を ${JSON.stringify(query)} で開いた: 応答 ${応答}・初期表示 ${JSON.stringify(got)}。${a.注記 ?? EX注記}`);
    };
    if (a.手順数 === 2) {
      await step(1, async () => { await setLocale(); });
      await step(2, async () => { await open(); });
    } else {
      await step(1, async () => { await setLocale(); await open(); });
    }
    await expected(async () => {
      expect.soft(応答, "商品詳細画面の応答").toBe(200);
      expect.soft(got.言語, "初期表示の言語").toBe(a.期待.言語);
      expect.soft(got.状態, "初期表示の規格（状態）").toBe(a.期待.状態);
    });
  };
}
const JA = { 入口: 店.本店, ヘッダ: "ja-JP,ja", ロケール名: "ロケールは日本語" };
const EN = { 入口: 店.本店英語版, ヘッダ: "en-US,en", ロケール名: "ロケールは英語" };
caseTest("IT-F03-02-034", 初期表示ケース({ ...JA, lang: "EN", 期待: { 言語: "EN", 状態: "NM" }, 手順数: 2 }));
caseTest("IT-F03-02-035", 初期表示ケース({ ...JA, 期待: { 言語: "JP", 状態: "NM" }, 手順数: 2 }));
caseTest("IT-F03-02-036", 初期表示ケース({ ...EN, 期待: { 言語: "EN", 状態: "NM" }, 手順数: 2 }));
caseTest("IT-F03-02-038", 初期表示ケース({ 入口: 店.本店, ヘッダ: "zh-CN,zh", ロケール名: "ロケールは取扱外のzh-CN", 期待: { 言語: "JP", 状態: "NM" }, 手順数: 2 }));
caseTest("IT-F03-02-039", 初期表示ケース({ ...JA, lang: "EN", 規格: { 言語: "EN", 状態: "SP" }, 期待: { 言語: "EN", 状態: "SP" }, 手順数: 1 }));
caseTest("IT-F03-02-040", 初期表示ケース({ ...JA, lang: "EN", 規格: "DAMAGED", 期待: { 言語: "EN", 状態: "NM" }, 手順数: 1 }));
caseTest("IT-F03-02-137", 初期表示ケース({ ...JA, 規格: { 言語: "JP", 状態: "SP" }, 期待: { 言語: "JP", 状態: "SP" }, 手順数: 2 }));
caseTest("IT-F03-02-138", 初期表示ケース({ ...JA, 規格: "DAMAGED", 期待: { 言語: "JP", 状態: "NM" }, 手順数: 2 }));
caseTest("IT-F03-02-139", 初期表示ケース({ ...EN, 規格: { 言語: "EN", 状態: "SP" }, 期待: { 言語: "EN", 状態: "SP" }, 手順数: 2 }));
caseTest("IT-F03-02-140", 初期表示ケース({ ...EN, 規格: "DAMAGED", 期待: { 言語: "EN", 状態: "NM" }, 手順数: 2 }));
caseTest("IT-F03-02-141", 初期表示ケース({
  ...JA, lang: "DE", 規格: { 言語: "EN", 状態: "SP" }, 期待: { 言語: "EN", 状態: "SP" }, 手順数: 2,
  seed: "S-F03-02-CBLANG-141", 商品ID: "〔商品ID-F0302-141〕", 注記: `${EX注記}。FRはNMだけ足した（シードの注記）`,
}));
caseTest("IT-F03-02-142", 初期表示ケース({
  ...JA, lang: "DE", 期待: { 言語: "EN", 状態: "NM" }, 手順数: 2,
  seed: "S-F03-02-CBLANG-142", 商品ID: "〔商品ID-F0302-142〕", 注記: `${EX注記}。FRはNMだけ足した（シードの注記）`,
}));

caseTest("IT-F03-02-041", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let got = { 言語: "", 状態: "" };
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" }); });
  await step(2, async () => {
    await d.言語ボタン("EN").click();
    await expect(d.言語ボタン("EN"), "言語切替のENが選択中になる").toBeDisabled();
    got = await d.初期表示();
    note(`ENへ切り替えたあとの表示: ${JSON.stringify(got)}・アドレス ${page.url()}（言語の切替は同じ画面の中で表を切り替える作りで、アドレスの引数だけが変わる）`);
  });
  await expected(async () => {
    await expect.soft(page.locator("table#priceTable-EN"), "ENの価格・在庫の表").toBeVisible();
    expect.soft(got.言語, "言語の表示").toBe("EN");
    expect.soft(await d.商品名の文(), "商品名の見出し").toBe(rc(BASE_NAME));
    expect.soft(page.url(), "アドレスの言語の引数").toContain("lang=EN");
  });
});

caseTest("IT-F03-02-042", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" }); });
  await step(2, async () => { await expect(d.言語ボタン("JP"), "言語切替のJPのボタン").toBeVisible(); });
  await expected(async () => {
    await expect.soft(d.言語ボタン("JP"), "表示中のJPの言語切替ボタンが押せない").toBeDisabled();
    await expect.soft(d.言語ボタン("JP"), "表示中のJPの言語切替ボタンが選択中").toHaveAttribute("aria-pressed", "true");
    await expect.soft(d.言語ボタン("EN"), "ENの言語切替ボタンは押せる").toBeEnabled();
  });
});

caseTest("IT-F03-02-045", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const spId = classIdOf(BASE, "EN", "SP");
  let 前 = { 言語: "", 状態: "" };
  let 後 = { 言語: "", 状態: "" };
  await step(1, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "EN" });
    前 = await d.初期表示();
    note(`初期表示: ${JSON.stringify(前)}。${EX注記}`);
  });
  await step(2, async () => {
    await d.状態のリンク("SP").click();
    await expect(d.価格表.locator("td[data-status-current]").first(), "現在地の状態がSPになる").toContainText("SP");
    後 = await d.初期表示();
    note(`SPのリンクを押したあとの表示: ${JSON.stringify(後)}・アドレス ${page.url()}`);
  });
  await expected(async () => {
    expect.soft(前, "押す前の表示（EN・NM）").toEqual({ 言語: "EN", 状態: "NM" });
    expect.soft(後.言語, "押したあとの言語（ENを保持）").toBe("EN");
    expect.soft(後.状態, "押したあとの状態（EX＝SP）").toBe("SP");
    expect.soft(page.url(), "アドレスの言語の引数").toContain("lang=EN");
    expect.soft(page.url(), "アドレスの規格の引数").toContain(`class=${spId}`);
    expect.soft(await d.商品名の文(), "商品名の見出し").toBe(rc(BASE_NAME));
  });
});

// ---- リンク ----

/** 新しいタブで開くリンクを押し、開いた先を返す */
async function 新しいタブで開く(page: Page, link: Locator): Promise<Page> {
  const [popup] = await Promise.all([page.context().waitForEvent("page"), link.click()]);
  await popup.waitForLoadState("domcontentloaded").catch(() => {});
  await popup.waitForLoadState("load").catch(() => {});
  return popup;
}
const 外のページが無い = (text: string) => !/404|Not Found|お探しのページ/.test(text);

function 新しいタブのリンク(a: { 押す: (d: FrontDetail) => Locator; 名前: string; 確かめ: (popup: Page) => Promise<void> }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let popup: Page | null = null;
    await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
    await step(2, async () => {
      const link = a.押す(d);
      await expect(link, `「${a.名前}」のリンク`).toBeVisible();
      popup = await 新しいタブで開く(page, link);
      note(`「${a.名前}」のリンクは新しいタブで開く。開いた先: ${popup.url()}`);
    });
    await expected(async () => {
      expect(popup, `「${a.名前}」のリンクが新しいタブを開いた`).not.toBeNull();
      await a.確かめ(popup!);
    });
  };
}
caseTest("IT-F03-02-046", 新しいタブのリンク({
  押す: (d) => d.状態表記のリンク.first(), 名前: "状態",
  確かめ: async (p) => {
    expect.soft(new URL(p.url()).pathname, "状態表記画面のアドレス").toContain("card_condition");
    expect.soft(外のページが無い(await p.locator("body").innerText()), "状態表記画面が表示される（ページが無いの表示でない）").toBe(true);
  },
}));
caseTest("IT-F03-02-048", 新しいタブのリンク({
  押す: (d) => d.商品画像についてのリンク, 名前: "商品画像について",
  確かめ: async (p) => {
    const u = new URL(p.url());
    expect.soft(u.pathname, "ヘルプ画面のアドレス").toContain("help_onlineshop");
    expect.soft(u.hash, "ヘルプ画面の位置の指定（3.商品の画像について）").toBe("#block3");
    await expect.soft(p.locator("#block3"), "「3.商品の画像について」が表示された位置").toBeInViewport();
  },
}));
caseTest("IT-F03-02-049", 新しいタブのリンク({
  押す: (d) => d.返品特約のリンク, 名前: "返品特約に関する重要事項について",
  確かめ: async (p) => {
    expect.soft(new URL(p.url()).pathname, "返品特約画面のアドレス").toContain("return-policy");
    expect.soft(外のページが無い(await p.locator("body").innerText()), "返品特約画面が表示される（ページが無いの表示でない）").toBe(true);
  },
}));

caseTest("IT-F03-02-033", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get(BASE_ID);
  let res: Response | null = null;
  await step(1, async () => { await 開いて確かめる(d, 店.本店, id, BASE_NAME); });
  await step(2, async () => {
    await expect(d.買取情報を見る, "買取情報を見るリンク").toBeVisible();
    [res] = await Promise.all([page.waitForNavigation({ waitUntil: "load" }), d.買取情報を見る.click()]);
    note(`買取情報を見るを押した先: ${page.url()}（応答 ${status(res)}）`);
  });
  await expected(async () => {
    expect.soft(status(res), "買取商品詳細画面の応答").toBeLessThan(400);
    expect.soft(new URL(page.url()).pathname, "買取商品詳細画面のアドレス").toContain(`/purchase/detail/${id}`);
    expect.soft(await d.本文(), "買取商品詳細画面に商品名がある").toContain(rc(BASE_NAME));
  });
});

/** 外部のサイトへ向かう要求を、外へ出さずに空の応答に差し替える（宛先のアドレスだけを読む） */
async function 外部をふさぐ(page: Page, host: RegExp): Promise<void> {
  await page.context().route(host, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html><body>stub</body></html>" }));
}

caseTest("IT-F03-02-047", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  await 外部をふさぐ(page, /^https:\/\/article\.hareruyamtg\.com\//);
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
  await step(2, async () => {
    note("記事サイト（外部）へは接続せず、移動先のアドレスだけを読んだ（外部への要求は空の応答に差し替えた）");
    await Promise.all([page.waitForURL(/article\.hareruyamtg\.com/), d.掲載記事一覧.click()]);
    note(`移動先: ${page.url()}`);
  });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.host, "移動先のサイト").toBe("article.hareruyamtg.com");
    expect.soft(u.searchParams.get("s"), "記事サイトの検索語（カード名）").toBe(`《${rc(BASE_NAME)}》`);
  });
});

caseTest("IT-F03-02-056", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let 項目: Record<string, string> = {};
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME, { lang: "JP" }); });
  await step(2, async () => { 項目 = await d.カード情報の項目(); note(`カード情報の項目: ${JSON.stringify(項目)}`); });
  await expected(async () => {
    expect.soft(Object.keys(項目).length, "カード情報の欄が表示されている（項目の数）").toBeGreaterThan(0);
    expect.soft((項目["使用可能フォーマット"] ?? "").replace(/\s+/g, ""), "使用可能フォーマット（マスタの並び順・日本語）").toBe("スタンダード,モダン");
  });
});

// ---- 閲覧履歴・画面の幅・見出しへの移動 ----

caseTest("IT-F03-02-074", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  let shown: string[] = [];
  await step(1, async () => {
    const res = await d.open(店.本店, notes.get("〔商品ID-F0302-共有-HISTORY-01〕"));
    expect(status(res), "履歴商品01の商品詳細画面の応答").toBe(200);
    await d.閲覧履歴の書き込みを待つ();
  });
  await step(2, async () => {
    await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME);
    await d.閲覧履歴の書き込みを待つ();
  });
  await step(3, async () => { shown = await d.最近チェックした商品(); note(`最近チェックした商品の欄: ${JSON.stringify(shown)}`); });
  await expected(async () => {
    expect.soft(shown.length, "最近チェックした商品の欄に商品が表示されている（表示されたうえで数える）").toBeGreaterThan(0);
    expect.soft(shown[0], "閲覧履歴の先頭").toBe(rc(BASE_NAME));
    expect.soft(shown, "履歴商品01も履歴にある").toContain(rc("履歴商品01"));
  });
});

caseTest("IT-F03-02-080", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  await page.setViewportSize({ width: 375, height: 812 });
  note("SP版は、画面の幅 375px で開いた");
  await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME); });
  await step(2, async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });
  await expected(async () => { await expect(d.カテゴリ一覧, "カテゴリ一覧").toBeHidden(); });
});

function 見出しへ移動(a: { リンク: (d: FrontDetail) => Locator; 見出し: (d: FrontDetail) => Locator; 名前: string }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    note("PC版は、画面の幅 1280px で開いた");
    let 押す前 = true;
    await step(1, async () => {
      await 開いて確かめる(d, 店.本店, notes.get(BASE_ID), BASE_NAME);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      押す前 = await a.見出し(d).evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
      note(`最上部で、「${a.名前}」の欄の見出しが表示領域に入っているか: ${押す前}`);
    });
    await step(2, async () => {
      await a.リンク(d).click();
      await page.waitForTimeout(800);
    });
    await expected(async () => {
      expect.soft(押す前, "押す前は見出しが表示領域に入っていない").toBe(false);
      await expect.soft(a.見出し(d), `「${a.名前}」の欄の見出しが表示領域に入る`).toBeInViewport();
    });
  };
}
caseTest("IT-F03-02-094", 見出しへ移動({ リンク: (d) => d.使われているデッキのボタン, 見出し: (d) => d.デッキの欄.locator("h2").first(), 名前: "使われているデッキ" }));
caseTest("IT-F03-02-095", 見出しへ移動({ リンク: (d) => d.他のバージョンのボタン, 見出し: (d) => d.他のバージョンの欄.locator("h2").first(), 名前: "他のバージョンも見る" }));

// ---- 使われているデッキ（5件） ----

function デッキ5件(a: { 幅: { width: number; height: number }; 幅の名: string; 件数: number; 手順で並びを見る: boolean }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    await page.setViewportSize(a.幅);
    note(`${a.幅の名}で開いた（画面の幅 ${a.幅.width}px）。デッキの登録日の新しい順は、デッキIDの大きい順（試験デッキ5〜1の順に登録して、1が最も新しい）`);
    let texts: string[] = [];
    let 部品: { 画像: number; 名称: number; 項目: number }[] = [];
    let もっと見る = -1;
    let 全部 = -1;
    await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get("〔商品ID-F0302-共有-DECKS〕"), "デッキ使用カード"); });
    await step(2, async () => {
      await expect(d.フォーマットのブロック("スタンダード"), "スタンダード欄").toHaveCount(1);
      texts = await d.見えているデッキの文("スタンダード");
      部品 = await d.デッキの部品("スタンダード");
      もっと見る = await d.もっと見る("スタンダード").count();
      全部 = await d.デッキ("スタンダード").count();
      note(`スタンダード欄: 取得${全部}件・表示${texts.length}件・もっと見る${もっと見る}・デッキの文 ${JSON.stringify(texts)}`);
    });
    await expected(async () => {
      expect.soft(texts.length, "スタンダード欄に表示されたデッキの数").toBe(a.件数);
      // デッキはイベント名（デッキごとの印つき）で見分ける。新しい順に 試験デッキ1 から
      for (let i = 0; i < a.件数; i += 1) expect.soft(texts[i] ?? "", `${i + 1}件目のデッキ（試験デッキ${i + 1}）`).toContain(rc(`F0302-試験デッキ${i + 1}`));
      for (let n = a.件数 + 1; n <= 5; n += 1) expect.soft(texts.join(" "), `表示されないデッキ（試験デッキ${n}）`).not.toContain(rc(`F0302-試験デッキ${n}`));
      expect.soft(もっと見る, "スタンダード欄のもっと見るリンクの数（デッキが5件ある）").toBe(1);
      if (a.手順で並びを見る) {
        expect.soft(部品.slice(0, a.件数).every((p) => p.画像 === 1 && p.名称 === 1 && p.項目 === 5), "各デッキの画像・名称・プレイヤー・大会名・成績・参加人数・開催日の欄").toBe(true);
        expect.soft(texts.every((t) => t.includes("2026/01/15")), "各デッキの開催日").toBe(true);
      }
    });
  };
}
caseTest("IT-F03-02-065", デッキ5件({ 幅: { width: 1280, height: 900 }, 幅の名: "PC版", 件数: 4, 手順で並びを見る: true }));
caseTest("IT-F03-02-066", デッキ5件({ 幅: { width: 375, height: 812 }, 幅の名: "SP版", 件数: 3, 手順で並びを見る: false }));
caseTest("IT-F03-02-128", デッキ5件({ 幅: { width: 1280, height: 900 }, 幅の名: "PC版", 件数: 4, 手順で並びを見る: false }));

// ---- 状態の価格・在庫の組み合わせ ----

function 状態の表(a: { 商品ID: string; 商品名: string; 確かめ: (rows: { 状態: string; 価格: string; 在庫: string }[], d: FrontDetail) => Promise<void> }): CaseBody {
  return async ({ page, notes, step, expected }) => {
    const d = new FrontDetail(page);
    let rows: { 状態: string; 価格: string; 在庫: string }[] = [];
    await step(1, async () => { await 開いて確かめる(d, 店.本店, notes.get(a.商品ID), a.商品名, { lang: "JP" }); });
    await step(2, async () => { rows = await d.行の文(); note(`JPの状態別の表: ${JSON.stringify(rows)}。${EX注記}`); });
    await expected(async () => {
      expect.soft(rows.length, "状態別の表の行（表示されたうえで数える）").toBeGreaterThan(0);
      await a.確かめ(rows, d);
    });
  };
}
caseTest("IT-F03-02-088", 状態の表({
  商品ID: "〔商品ID-F0302-088〕", 商品名: "状態価格カード F0302-088-A",
  確かめ: async (rows) => {
    expect.soft(rows.map((r) => 行の状態(r.状態)), "状態の欄の状態（価格99円のEX＝SPが表示されない）").toEqual(["NM"]);
  },
}));
caseTest("IT-F03-02-089", 状態の表({
  商品ID: "〔商品ID-F0302-089〕", 商品名: "状態価格カード F0302-089-A",
  確かめ: async (rows) => {
    expect.soft(rows.map((r) => 行の状態(r.状態)), "状態の欄の状態（NMとEX＝SP）").toEqual(["NM", "SP"]);
    expect.soft(rows.map((r) => 数字(r.価格)), "状態の欄の価格（NM 99円・SP 100円）").toEqual([99, 100]);
  },
}));
caseTest("IT-F03-02-113", 状態の表({
  商品ID: "〔商品ID-F0302-113〕", 商品名: "最大価格在庫なしカード F0302-113-A",
  確かめ: async (rows, d) => {
    expect.soft(rows.map((r) => 行の状態(r.状態)), "状態別の表の状態").toEqual(["NM", "SP"]);
    await expect.soft(d.商品数の欄("SP"), "在庫がある状態のうち最大価格のEX（SP）の商品数").toHaveValue("1");
    await expect.soft(d.商品数の欄("NM"), "在庫0のNMの商品数の欄（表示されない）").toHaveCount(0);
  },
}));
caseTest("IT-F03-02-114", 状態の表({
  商品ID: "〔商品ID-F0302-114〕", 商品名: "在庫混在カード F0302-114-A",
  確かめ: async (rows, d) => {
    expect.soft(rows.map((r) => 行の状態(r.状態)), "状態別の表の状態").toEqual(["NM", "SP"]);
    await expect.soft(d.商品数の欄("NM"), "在庫2のNMの商品数").toHaveValue("1");
    await expect.soft(d.商品数の欄("SP"), "在庫0のEX（SP）の商品数の欄（表示されない）").toHaveCount(0);
  },
}));

// ---- SNS で共有する（宛先のアドレスだけを読む。X・LINE へはログインしない） ----

const 共有先 = /^https:\/\/(twitter\.com|x\.com|line\.me)\//;
const 共有の注記 = "X・LINE（外部）へは接続せず、共有ボタンが新しいタブで開く宛先のアドレスだけを読んだ（外部への要求は空の応答に差し替えた）。「短縮URL」は、アプリが共有文に入れる商品詳細のアドレス（商品IDと言語の引数）として読んだ";

async function 共有を押す(page: Page, link: Locator): Promise<string> {
  const popup = await 新しいタブで開く(page, link);
  const url = popup.url();
  await popup.close();
  return url;
}
const Xの文 = (url: string) => new URL(url).searchParams.get("text") ?? "";
const LINEの文 = (url: string) => decodeURIComponent(new URL(url).pathname.replace(/^\/R\/msg\/text\//, ""));

caseTest("IT-F03-02-012", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get(BASE_ID);
  let url = "";
  await 外部をふさぐ(page, 共有先);
  await step(1, async () => { await 開いて確かめる(d, 店.本店, id, BASE_NAME, { lang: "JP" }); });
  await step(2, async () => { url = await 共有を押す(page, d.Xでシェア); note(`${共有の注記}。Xの宛先: ${url}`); });
  await expected(async () => {
    const text = Xの文(url);
    expect.soft(new URL(url).host, "共有先（X）").toMatch(/twitter\.com|x\.com/);
    expect.soft(text.startsWith("【JP】 "), "共有文の先頭の言語（JP）").toBe(true);
    expect.soft(text, "共有文の商品名").toContain(` ${rc(BASE_NAME)} `);
    expect.soft(text, "共有文の商品詳細のアドレス（商品IDとJP）").toContain(`/products/detail/${id}?lang=JP`);
    expect.soft(text, "共有文のハッシュタグ").toContain("#晴れる屋通販");
    expect.soft(text, "共有文のメンション").toContain("@hareruya_mtg");
  });
});

caseTest("IT-F03-02-013", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get("〔商品ID-F0302-共有-SHARE-LONG〕");
  const name = 長い商品名();
  let url = "";
  await 外部をふさぐ(page, 共有先);
  await step(1, async () => {
    const got = await 開く(d, 店.本店, id, { lang: "JP" });
    expect(got.商品名, "商品詳細画面の商品名の見出し（全角90文字）").toBe(name);
  });
  await step(2, async () => { url = await 共有を押す(page, d.Xでシェア); note(`${共有の注記}。Xの宛先: ${url}`); });
  await expected(async () => {
    const text = Xの文(url);
    expect.soft(text.startsWith(`【JP】 ${name.slice(0, 89)}… `), "共有文の商品名が先頭89文字と「…」").toBe(true);
    expect.soft(text, "共有文に90文字の商品名がそのままは入らない").not.toContain(name);
  });
});

caseTest("IT-F03-02-015", async ({ page, notes, step, expected }) => {
  const d = new FrontDetail(page);
  const id = notes.get(BASE_ID);
  let line = "";
  let x = "";
  await 外部をふさぐ(page, 共有先);
  await step(1, async () => { await 開いて確かめる(d, 店.本店, id, BASE_NAME, { lang: "JP" }); });
  await step(2, async () => {
    x = Xの文(new URL((await d.Xでシェア.getAttribute("href")) ?? "").toString());
    const url = await 共有を押す(page, d.LINEでシェア);
    line = LINEの文(url);
    note(`${共有の注記}。LINEの宛先: ${url}`);
  });
  await expected(async () => {
    expect.soft(x, "Xの共有文が読めた").not.toBe("");
    expect.soft(line, "LINEに渡された共有文（Xと同じ内容）").toBe(x);
    expect.soft(line.startsWith("【JP】 "), "共有文の先頭の言語（JP）").toBe(true);
    expect.soft(line, "共有文の商品名").toContain(` ${rc(BASE_NAME)} `);
    expect.soft(line, "共有文の商品詳細のアドレス（商品IDとJP）").toContain(`/products/detail/${id}?lang=JP`);
  });
});
