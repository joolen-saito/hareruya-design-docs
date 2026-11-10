/**
 * F04-01 買い物かご。正本: cases/F04-01_test_cases.tsv
 * 実装したケースと実装しないケースの理由は記録 review/F04-01_progress_2026-11-11_dev.md。
 * どのケースも共有の設定（本店の送料無料条件・入荷通知最大数。≪共有の設定≫）を開始時に正本の値にし、終わるたびに元の値へ戻す（基盤が1本だけで流す）。
 * 事前準備の「ケース専用ブラウザで会員Aにログインする」は、ケースのブラウザで手順1の前にログインする。
 */
import { test } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { BASE_URL } from "../../config/env";
import { 在庫と購入上限, 在庫数を変える, 購入上限を変える } from "../../db/f04_01";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { CartPage } from "../../pages/front/f04_01_cart";
import { ケースの定め, 会員の, 共有の設定を整える, 共有の設定を戻す, 作ったものの, 支店のページ } from "../../seeds/f04-01";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const yen = (n: number) => n.toLocaleString("ja-JP");

type 設定 = { 金額: string; 数量: string; 入荷通知上限: string };
const 既定: 設定 = { 金額: "5000", 数量: "", 入荷通知上限: "100" };
const 設定の例外: Record<string, 設定> = {
  "027": { 金額: "", 数量: "", 入荷通知上限: "100" },
  "029": { 金額: "10000", 数量: "3", 入荷通知上限: "100" },
  "054": { 金額: "10000", 数量: "3", 入荷通知上限: "100" },
  "056": { 金額: "5000", 数量: "3", 入荷通知上限: "100" },
  "060": { 金額: "", 数量: "", 入荷通知上限: "100" },
  "061": { 金額: "", 数量: "3", 入荷通知上限: "100" },
  "062": { 金額: "5000", 数量: "3", 入荷通知上限: "100" },
  "063": { 金額: "5000", 数量: "10", 入荷通知上限: "100" },
};

/** ケースの共通の流れ: 共有の設定を整える → 会員でログイン → 本体 → 共有の設定を戻す */
function ケース(番号: string, 本体: (ctx: CaseCtx, c: CartPage, x: ReturnType<typeof 作ったものの>) => Promise<void>) {
  return async (ctx: CaseCtx): Promise<void> => {
    try {
      await 共有の設定を整える(ctx.browser, 設定の例外[番号] ?? 既定);
      const d = ケースの定め[番号].d;
      await frontLogin(ctx.page, 会員の(d));
      await 本体(ctx, new CartPage(ctx.page), 作ったものの(番号));
    } finally {
      expect(await 共有の設定を戻す(ctx.browser), "共有の設定（送料無料条件・入荷通知最大数）を元の値へ戻せた").toBe("");
    }
  };
}
const 規格 = (x: ReturnType<typeof 作ったものの>, 字: string) => {
  const p = x.品.get(字);
  if (!p) throw new Error(`商品${字}をシードで作っていない`);
  return p.商品規格ID;
};
async function 表示中の字(c: CartPage, x: ReturnType<typeof 作ったものの>): Promise<string[]> {
  const ids = await c.行の商品規格ID();
  return [...x.品.entries()].filter(([, p]) => ids.includes(p.商品規格ID)).map(([k]) => k).sort();
}

// ---- 店舗ごとのカート（001・014・025 は本店・支店A・支店B、ほかは支店A） ----
caseTest("IT-F04-01-001", (ctx) => ケース("001", async ({ step, expected }, c, x) => {
  const 見えた: Record<string, string[]> = {};
  await step(1, async () => { await c.開く(); 見えた.本店 = await 表示中の字(c, x); });
  await step(2, async () => { await c.開く(支店のページ("A")); 見えた.支店A = await 表示中の字(c, x); });
  await step(3, async () => { await c.開く(支店のページ("B")); 見えた.支店B = await 表示中の字(c, x); });
  await expected(async () => {
    expect.soft(見えた.本店, "本店の買い物かごの商品（商品A・商品Bだけ）").toEqual(["A", "B"]);
    expect.soft(見えた.支店A, "支店Aの買い物かごの商品（商品C・商品Dだけ）").toEqual(["C", "D"]);
    expect.soft(見えた.支店B, "支店Bの買い物かごの商品（商品E・商品Fだけ）").toEqual(["E", "F"]);
  });
})(ctx));

caseTest("IT-F04-01-002", (ctx) => ケース("002", async ({ step, expected }, c) => {
  let 文 = "";
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await expect(c.集計欄, "カート集計欄").toBeVisible(); 文 = await c.集計欄の文(); note(`カート集計欄: ${文}`); });
  await expected(async () => {
    expect.soft(文.includes("送料"), "カート集計欄に送料が表示されない（店舗受取のみの支店A）").toBe(false);
  });
})(ctx));

caseTest("IT-F04-01-060", (ctx) => ケース("060", async ({ step, expected }, c) => {
  let 文 = "";
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await expect(c.集計欄, "カート集計欄").toBeVisible(); 文 = await c.集計欄の文(); note(`カート集計欄: ${文}`); });
  await expected(async () => {
    expect.soft(文.includes("送料"), "カート集計欄に送料・送料無料の案内が表示されない").toBe(false);
    await expect.soft(c.送料無料の案内, "送料無料までの不足額の案内が表示されない").toHaveCount(0);
  });
})(ctx));

caseTest("IT-F04-01-066", (ctx) => ケース("066", async ({ step, expected }, c, x) => {
  let 見えた: string[] = [];
  await step(1, async () => { await c.開く(支店のページ("A")); 見えた = await 表示中の字(c, x); });
  await expected(async () => { expect.soft(見えた, "支店Aの買い物かごの商品（商品C・商品D）").toEqual(["C", "D"]); });
})(ctx));

caseTest("IT-F04-01-013", (ctx) => ケース("013", async ({ step, expected }, c, x) => {
  let 見えた: string[] = [];
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await c.押して移る(c.削除(規格(x, "C"))); 見えた = await 表示中の字(c, x); });
  await expected(async () => {
    expect.soft(c.パス, "買い物かご画面のまま（再読み込みされた）").toBe(`/ja${支店のページ("A")}/cart`);
    expect.soft(見えた, "支店Aのカートの商品（商品Cだけ消え、商品Dが残る）").toEqual(["D"]);
  });
})(ctx));

caseTest("IT-F04-01-014", (ctx) => ケース("014", async ({ step, expected }, c, x) => {
  const 見えた: Record<string, string[]> = {};
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await c.押して移る(c.削除(規格(x, "C"))); });
  await step(3, async () => { await c.開く(); 見えた.本店 = await 表示中の字(c, x); });
  await step(4, async () => { await c.開く(支店のページ("B")); 見えた.支店B = await 表示中の字(c, x); });
  await expected(async () => {
    expect.soft(見えた.本店, "本店のカートに商品A・商品Bが残る").toEqual(["A", "B"]);
    expect.soft(見えた.支店B, "支店Bのカートに商品E・商品Fが残る").toEqual(["E", "F"]);
  });
})(ctx));

caseTest("IT-F04-01-018", (ctx) => ケース("018", async ({ page, step, expected }, c) => {
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await c.押して移る(c.他の商品を見る); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "支店AのTOP画面（支店のページの先頭）").toMatch(new RegExp(`^/ja${支店のページ("A")}/?$`));
  });
})(ctx));

caseTest("IT-F04-01-024", (ctx) => ケース("024", async ({ step, expected }, c) => {
  let 確認 = "";
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await expect(c.一括削除, "カート一括削除").toBeVisible(); });
  await step(3, async () => { 確認 = await c.一括削除を押す(true); note(`確認ダイアログ: ${確認}`); });
  await expected(async () => {
    expect.soft(c.パス, "買い物かご画面のまま（再読み込みされた）").toBe(`/ja${支店のページ("A")}/cart`);
    expect.soft(await c.商品の行.count(), "支店Aのカートの商品（空）").toBe(0);
  });
})(ctx));

caseTest("IT-F04-01-025", (ctx) => ケース("025", async ({ step, expected }, c, x) => {
  const 見えた: Record<string, string[]> = {};
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await expect(c.一括削除, "カート一括削除").toBeVisible(); });
  await step(3, async () => { note(`確認ダイアログ: ${await c.一括削除を押す(true)}`); });
  await step(4, async () => { await c.開く(); 見えた.本店 = await 表示中の字(c, x); });
  await step(5, async () => { await c.開く(支店のページ("B")); 見えた.支店B = await 表示中の字(c, x); });
  await expected(async () => {
    expect.soft(見えた.本店, "本店のカートに商品A・商品Bが残る").toEqual(["A", "B"]);
    expect.soft(見えた.支店B, "支店Bのカートに商品E・商品Fが残る").toEqual(["E", "F"]);
  });
})(ctx));

caseTest("IT-F04-01-026", (ctx) => ケース("026", async ({ step, expected }, c, x) => {
  let 見えた: string[] = [];
  await step(1, async () => { await c.開く(支店のページ("A")); });
  await step(2, async () => { await expect(c.一括削除, "カート一括削除").toBeVisible(); });
  await step(3, async () => { note(`確認ダイアログ: ${await c.一括削除を押す(false)}`); 見えた = await 表示中の字(c, x); });
  await expected(async () => {
    expect.soft(c.パス, "支店Aの買い物かご画面に留まる").toBe(`/ja${支店のページ("A")}/cart`);
    expect.soft(見えた, "商品C・商品Dが表示されたまま").toEqual(["C", "D"]);
  });
})(ctx));

// ---- 本店の数量の操作 ----
function 数量を変える(番号: string, 操作: "加算" | "減算" | "入力", 値: string, 期待数量: number, 単価: number) {
  return ケース(番号, async ({ step, expected }, c, x) => {
    const id = 規格(x, "A");
    await step(1, async () => { await c.開く(); });
    await step(2, async () => {
      if (操作 === "入力") note(`数量の更新の応答: ${await c.数量を入れる(id, 値)}`);
      else { const r = await c.増減を押す(操作 === "加算" ? c.加算(id) : c.減算(id)); note(`押せた=${r.押せた}・更新の応答=${r.応答}`); }
    });
    await expected(async () => {
      const 合計 = 期待数量 * 単価;
      expect.soft(await c.読み込み直していない(), "画面全体を再読み込みしていない").toBe(true);
      expect.soft(await c.数量(id), "商品Aの数量").toBe(String(期待数量));
      expect.soft(await c.小計(id), "商品Aの小計").toContain(yen(合計));
      expect.soft(await c.テキスト(c.送料無料の案内), "送料無料までの残り金額（送料無料金額5,000円から）").toContain(yen(5000 - 合計));
      expect.soft(await c.テキスト(c.合計金額), "合計金額").toBe(yen(合計));
    });
  });
}
caseTest("IT-F04-01-003", 数量を変える("003", "加算", "", 2, 1000));
caseTest("IT-F04-01-004", 数量を変える("004", "減算", "", 1, 1000));
caseTest("IT-F04-01-005", 数量を変える("005", "入力", "3", 3, 1000));

function 上限を超えない(番号: string, 字: string, 上限: number, 入れる値: string, 何の上限: string) {
  return ケース(番号, async ({ step, expected }, c, x) => {
    const id = 規格(x, 字);
    await step(1, async () => { await c.開く(); });
    await step(2, async () => { const r = await c.増減を押す(c.加算(id)); note(`加算ボタン: 押せた=${r.押せた}・更新の応答=${r.応答}`); });
    await step(3, async () => { note(`数量の更新の応答: ${await c.数量を入れる(id, 入れる値)}`); });
    await expected(async () => {
      expect.soft(await c.数量(id), `商品${字}の数量（${何の上限}${上限}を超えない）`).toBe(String(上限));
    });
  });
}
caseTest("IT-F04-01-006", 上限を超えない("006", "S", 2, "3", "在庫数"));
caseTest("IT-F04-01-007", 上限を超えない("007", "L", 4, "5", "購入上限数"));

caseTest("IT-F04-01-008", (ctx) => ケース("008", async ({ step, expected }, c, x) => {
  const id = 規格(x, "A");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { const r = await c.増減を押す(c.減算(id)); note(`減算ボタン: 押せた=${r.押せた}・更新の応答=${r.応答}`); });
  await expected(async () => { expect.soft(await c.数量(id), "商品Aの数量（0にならず1のまま）").toBe("1"); });
})(ctx));
caseTest("IT-F04-01-009", (ctx) => ケース("009", async ({ step, expected }, c, x) => {
  const id = 規格(x, "A");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { note(`数量の更新の応答: ${await c.数量を入れる(id, "0")}`); });
  await expected(async () => { expect.soft(await c.数量(id), "商品Aの数量（0にならず1のまま）").toBe("1"); });
})(ctx));

function 開いた時点のまま(番号: string, 変える: "在庫数" | "購入上限") {
  return ケース(番号, async ({ step, expected }, c, x) => {
    const p = x.品.get("T")!;
    let 前 = { max: "", up: false }; let 後 = { max: "", up: false };
    const 状態 = async () => ({ max: (await c.数量欄(p.商品規格ID).getAttribute("max")) ?? "", up: await c.加算(p.商品規格ID).isEnabled() });
    await step(1, async () => { await c.開く(); 前 = await 状態(); note(`開いた時点: 数量の上限=${前.max}・加算ボタン=${前.up ? "押せる" : "押せない"}`); });
    await step(2, async () => {
      if (変える === "在庫数") 在庫数を変える(`IT-F04-01-${番号}`, p.商品コード, p.在庫ID, 2);
      else 購入上限を変える(`IT-F04-01-${番号}`, p.商品コード, p.商品規格ID, 2);
      const v = 在庫と購入上限(p.商品規格ID, p.在庫ID);
      note(`DBで変えたあと: 在庫数=${v.在庫}・購入上限=${v.上限}（E2E が作った商品の行だけを書き換えた）`);
    });
    await step(3, async () => { 後 = await 状態(); });
    await expected(async () => {
      expect.soft(await c.読み込み直していない(), "画面を再読み込みしていない").toBe(true);
      expect.soft(後.max, `数量入力の上限（開いた時点の${変える}5のまま）`).toBe("5");
      expect.soft(後.up, "数量-加算ボタン（開いた時点と同じく押せる）").toBe(true);
      expect.soft(await c.数量(p.商品規格ID), "商品Tの数量").toBe("1");
    });
  });
}
caseTest("IT-F04-01-011", 開いた時点のまま("011", "在庫数"));
caseTest("IT-F04-01-012", 開いた時点のまま("012", "購入上限"));

caseTest("IT-F04-01-049", (ctx) => ケース("049", async ({ step, expected }, c, x) => {
  const id = 規格(x, "A");
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.数量欄(id).fill("999"); });
  await step(3, async () => {
    const wait = c.page.waitForResponse((r) => /\/cart\/set\/\d+/.test(r.url()), { timeout: 15_000 }).catch(() => null);
    await c.数量欄(id).blur(); await c.数量欄(id).dispatchEvent("change");
    note(`数量の更新の応答: ${(await wait)?.status() ?? "なし"}`);
    await c.page.waitForTimeout(500);
  });
  await step(4, async () => { await c.開く(); });
  await expected(async () => { expect.soft(await c.数量(id), "開き直したあとの商品Aの数量").toBe("999"); });
})(ctx));

// ---- 削除・一括削除（本店） ----
caseTest("IT-F04-01-064", (ctx) => ケース("064", async ({ step, expected }, c, x) => {
  let 見えた: string[] = [];
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押して移る(c.削除(規格(x, "A"))); 見えた = await 表示中の字(c, x); });
  await expected(async () => {
    expect.soft(c.パス, "買い物かご画面のまま（再読み込みされた）").toBe("/ja/cart");
    expect.soft(見えた, "本店のカートの商品（商品Aだけ消え、商品Bが残る）").toEqual(["B"]);
  });
})(ctx));
caseTest("IT-F04-01-065", (ctx) => ケース("065", async ({ step, expected }, c) => {
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await expect(c.一括削除, "カート一括削除").toBeVisible(); });
  await step(3, async () => { note(`確認ダイアログ: ${await c.一括削除を押す(true)}`); });
  await expected(async () => {
    expect.soft(c.パス, "買い物かご画面のまま（再読み込みされた）").toBe("/ja/cart");
    expect.soft(await c.商品の行.count(), "本店のカートの商品（空）").toBe(0);
  });
})(ctx));

// ---- 購入手続きへ ----
function 購入手続きへが出る(番号: string) {
  return ケース(番号, async ({ step, expected }, c) => {
    await step(1, async () => { await c.開く(); });
    await expected(async () => { await expect.soft(c.購入手続きへ, "購入手続きへボタンが表示される").toBeVisible(); });
  });
}
caseTest("IT-F04-01-019", 購入手続きへが出る("019"));
caseTest("IT-F04-01-055", 購入手続きへが出る("055"));
caseTest("IT-F04-01-020", (ctx) => ケース("020", async ({ page, step, expected }, c) => {
  await step(1, async () => { await c.開く(); });
  await step(2, async () => { await c.押して移る(c.購入手続きへ); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "ご注文方法の指定画面").toMatch(/^\/ja\/shopping\/?$/);
  });
})(ctx));

// ---- 送料無料の案内 ----
function 集計欄(番号: string, 確かめ: (c: CartPage, 文: string) => Promise<void>) {
  return ケース(番号, async ({ page, step, expected }, c) => {
    let 文 = "";
    await step(1, async () => { await c.開く(); });
    const 二つ目 = ["027", "054", "056", "061", "062", "063"].includes(番号);
    if (二つ目) await step(2, async () => { await expect(c.集計欄, "カート集計欄").toBeVisible(); });
    await expected(async () => {
      文 = await c.集計欄の文(); note(`カート集計欄: ${文}`);
      expect.soft(new URL(page.url()).pathname, "買い物かご画面に留まる").toBe("/ja/cart");
      await 確かめ(c, 文);
    });
  });
}
const 送料無料です = "現在送料無料です。";
caseTest("IT-F04-01-027", 集計欄("027", async (c) => {
  await expect.soft(c.送料無料の案内, "送料無料の案内・不足額の案内が表示されない").toHaveCount(0);
}));
caseTest("IT-F04-01-028", 集計欄("028", async (c) => { expect.soft(await c.テキスト(c.送料無料の案内), "金額条件で送料無料の状態").toBe(送料無料です); }));
caseTest("IT-F04-01-029", 集計欄("029", async (c) => { expect.soft(await c.テキスト(c.送料無料の案内), "個数条件で送料無料の状態").toBe(送料無料です); }));
caseTest("IT-F04-01-030", 集計欄("030", async (c) => { expect.soft(await c.テキスト(c.送料無料の案内), "送料無料までの不足額（4,000円）").toContain("4,000"); }));
caseTest("IT-F04-01-054", 集計欄("054", async (c) => { expect.soft(await c.テキスト(c.送料無料の案内), "「現在送料無料です。」").toBe(送料無料です); }));
caseTest("IT-F04-01-056", 集計欄("056", async (c) => { expect.soft(await c.テキスト(c.送料無料の案内), "送料無料までの不足額（4,000円）").toContain("4,000"); }));
caseTest("IT-F04-01-061", 集計欄("061", async (c) => {
  await expect.soft(c.送料無料の案内, "送料無料の案内・不足額の案内が表示されない").toHaveCount(0);
}));
const 送料無料で不足額なし = async (c: CartPage): Promise<void> => {
  const t = await c.テキスト(c.送料無料の案内);
  expect.soft(t, "「現在送料無料です。」").toBe(送料無料です);
  expect.soft(/あと/.test(t), "送料無料までの不足額が表示されない").toBe(false);
};
caseTest("IT-F04-01-062", 集計欄("062", 送料無料で不足額なし));
caseTest("IT-F04-01-063", 集計欄("063", 送料無料で不足額なし));

// ---- 空のカート・画像・追加通知 ----
caseTest("IT-F04-01-031", (ctx) => ケース("031", async ({ step, expected }, c) => {
  await step(1, async () => { await c.開く(); });
  await expected(async () => {
    await expect.soft(c.空の案内, "空である案内").toBeVisible();
    await expect.soft(c.他の商品を見る, "他の商品を見るボタン").toBeVisible();
    expect.soft(await c.商品の行.count(), "商品行（表示されない）").toBe(0);
    await expect.soft(c.集計欄, "集計欄（表示されない）").toHaveCount(0);
    await expect.soft(c.購入手続きへ, "購入手続きへボタン（表示されない）").toHaveCount(0);
    await expect.soft(c.一括削除, "カート一括削除（表示されない）").toHaveCount(0);
  });
})(ctx));
caseTest("IT-F04-01-048", (ctx) => ケース("048", async ({ step, expected }, c, x) => {
  const id = 規格(x, "A");
  let src = ""; let 読めた = false;
  await step(1, async () => { await c.開く(); });
  await step(2, async () => {
    src = (await c.画像(id).getAttribute("src")) ?? "";
    読めた = await c.画像(id).evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0);
    note(`商品画像の表示欄: ${src}`);
  });
  await expected(async () => {
    expect.soft(src, "商品画像の表示欄の画像（ノーイメージ画像）").toMatch(/noimg/);
    expect.soft(読めた, "ノーイメージ画像が表示されている（読み込めた）").toBe(true);
  });
})(ctx));
caseTest("IT-F04-01-053", (ctx) => ケース("053", async ({ page, step, expected }, c, x) => {
  const p = x.品.get("A")!;
  const popup = page.locator("#hareruya-app-cart-popup");
  await step(1, async () => {
    await page.goto(`${BASE_URL}/ja/products/detail/${p.商品ID}`, { timeout: 60_000 });
    await page.waitForLoadState("load");
  });
  await step(2, async () => {
    const form = page.locator(`form#productForm${p.商品ID}`);
    const table = form.locator('[id^="priceTable-"]:visible');
    const qty = table.locator("tbody tr .qty-label");
    await qty.fill("1"); await qty.blur();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/products/add_cart/${p.商品ID}`) && r.request().method() === "POST", { timeout: 60_000 }),
      form.locator("button.add-cart").dispatchEvent("click"),
    ]);
    await expect(popup, "追加通知").toHaveClass(/is-visible/, { timeout: 15_000 }).catch(() => undefined);
  });
  await expected(async () => {
    const link = popup.locator(".p-hareruya-cart-popup__link:not([hidden])");
    await expect.soft(link, "追加通知のカート画面へのリンクが表示される").toBeVisible();
    expect.soft(await link.getAttribute("href").catch(() => ""), "リンク先（カート画面）").toMatch(/\/cart\/?$/);
  });
})(ctx));

