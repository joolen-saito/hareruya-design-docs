/** F04-02 ご注文方法指定（共有の設定に触れないケース）。正本: cases/F04-02_test_cases.tsv */
import { test, Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { unrc } from "../../lib/run_marker";
import { 受注の配送先 } from "../../db/f04_02";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { ShippingEditPage, ShoppingPage } from "../../pages/front/f04_shopping";
import { 勤務先, 状態 } from "../../seeds/f04-02";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const login = async (page: Page, seedId: string) => { await frontLogin(page, 状態(seedId).会員); };
const WORK = (n: string) => `S-F04-02-EC-${n}`;

caseTest("IT-F04-02-001", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-NO-CART-001");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.直接開く(); });
  await expected(async () => {
    expect(sp.パス, "遷移先の画面（買い物かご）").toBe("/ja/cart");
  });
});

caseTest("IT-F04-02-003", async ({ page, browser, step, expected }) => {
  // 事前準備: 未ログインの匿名カートに商品を保持（シードが匿名のカートを作った。新しいブラウザではカートが無いので、同じ手順でカートに入れ直す）
  const s = 状態("S-F04-02-GUEST-UNREGISTERED-003");
  const { addToCart } = await import("../../pages/admin/m04_19_order_shortage");
  await addToCart(page, s.商品[0].productId, 1, "匿名のカート");
  note("シードは終わりに匿名のブラウザを閉じるため、ケースの開始時に、未ログインのこのブラウザで同じ商品を数量1でカートに入れ直した（事前準備のとおりの状態）");
  void browser;
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.直接開く(); });
  await expected(async () => {
    expect(sp.パス, "遷移先の画面（ログイン画面）").toMatch(/\/shopping\/login$/);
  });
});

caseTest("IT-F04-02-012", async ({ page, step, expected }) => {
  await login(page, WORK("012"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("勤務先"); });
  let text = "";
  await step(3, async () => { text = await sp.行の文("勤務先"); });
  await expected(async () => {
    expect.soft(text, "配送先名称").toContain("勤務先");
    expect.soft(text, "郵便番号").toContain("1500001");
    expect.soft(text, "都道府県と住所1").toContain("東京都渋谷区神宮前");
    expect.soft(text, "住所2").toContain("2-2");
    expect.soft(text, "住所3").toContain("第3ビル");
    expect.soft(text, "氏名").toContain("晴 太郎");
    expect.soft(text, "電話番号").toContain("0311112222");
  });
});

caseTest("IT-F04-02-014", async ({ page, step, expected }) => {
  await login(page, WORK("014"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("会員情報住所"); });
  await expected(async () => {
    expect(await sp.選択中のお届け先名(), "選択中のお届け先").toBe("会員情報住所");
    expect(sp.お届け先情報を変更するボタン, "お届け先情報を変更するボタン").toHaveCount(0);
  });
});

caseTest("IT-F04-02-015", async ({ page, step, expected }) => {
  await login(page, WORK("015"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("勤務先"); });
  await expected(async () => {
    expect(await sp.選択中のお届け先名(), "選択中のお届け先").toBe("勤務先");
    await expect(sp.お届け先情報を変更するボタン, "お届け先情報を変更するボタン").toBeVisible();
  });
});

caseTest("IT-F04-02-016", async ({ page, step, expected }) => {
  await login(page, WORK("016"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("勤務先"); });
  await step(3, async () => { await sp.押して配送先画面へ(sp.お届け先情報を変更するボタン); });
  const ed = new ShippingEditPage(page);
  await expected(async () => {
    expect(new URL(page.url()).pathname, "配送先の新規登録・変更画面").toMatch(/\/shopping\/shipping_edit\//);
    expect.soft(await ed.値(ed.配送先名称), "配送先名称").toBe("勤務先");
    expect.soft(await ed.値(ed.姓), "お名前（姓）").toBe(勤務先.姓);
    expect.soft(await ed.値(ed.名), "お名前（名）").toBe(勤務先.名);
    expect.soft(await ed.値(ed.郵便番号1) + (await ed.値(ed.郵便番号2)), "郵便番号").toBe("1500001");
    expect.soft(await ed.値(ed.都道府県), "都道府県").toBe("東京都");
    expect.soft(await ed.値(ed.住所1), "住所1").toBe(勤務先.住所1);
    expect.soft(await ed.値(ed.住所2), "住所2").toBe(勤務先.住所2);
    expect.soft(await ed.値(ed.住所3), "住所3").toBe(勤務先.住所3 ?? "");
    expect.soft(await ed.値(ed.電話1) + (await ed.値(ed.電話2)) + (await ed.値(ed.電話3)), "電話番号").toBe(勤務先.電話);
  });
});

caseTest("IT-F04-02-017", async ({ page, step, expected }) => {
  await login(page, WORK("017"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.押して配送先画面へ(sp.新しいお届け先を登録するボタン); });
  await expected(async () => {
    expect(new URL(page.url()).pathname, "遷移先の画面（配送先の新規登録・変更）").toMatch(/\/shopping\/shipping_edit\/\d+$/);
    await expect(new ShippingEditPage(page).配送先名称, "配送先名称の入力欄").toBeVisible();
  });
});

caseTest("IT-F04-02-018", async ({ page, step, expected }) => {
  await login(page, WORK("018"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("勤務先"); });
  await expected(async () => {
    expect(sp.パス, "再読み込みされたご注文方法指定画面").toBe("/ja/shopping");
    expect(await sp.選択中のお届け先名(), "選択中の配送先名称").toBe("勤務先");
  });
});

caseTest("IT-F04-02-027", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-BUNDLE-NONE-027");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  let names: string[] = [];
  await step(2, async () => { names = await sp.配送方法の名前(); });
  await expected(async () => {
    expect(names.length, "配送方法の選択肢の数（表示されている）").toBeGreaterThan(0);
    expect(names, "配送方法の選択肢に「同梱」が含まれない").not.toContain("同梱");
  });
});

caseTest("IT-F04-02-030", async ({ page, step, expected }) => {
  await login(page, WORK("030"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.配送についてリンクを押す(); });
  await expected(async () => {
    await expect(sp.配送についてモーダル, "配送についてのモーダル").toBeVisible();
  });
});

caseTest("IT-F04-02-066", async ({ page, step, expected }) => {
  await login(page, WORK("066"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お支払いについてリンクを押す(); });
  await expected(async () => {
    await expect(sp.お支払いについてモーダル, "お支払いについてのモーダル").toBeVisible();
  });
});

caseTest("IT-F04-02-044", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-02-OVERSEAS-044");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await sp.お届け先を選ぶ("海外倉庫"); });
  let ship = 受注の配送先(notes.get("〔受注ID-F0402-044〕"));
  await step(3, async () => { ship = 受注の配送先(notes.get("〔受注ID-F0402-044〕")); });
  await expected(async () => {
    expect.soft(ship.海外郵便番号 + ship.郵便番号, "保存された郵便番号（連結や分割をされない）").toBe("SW1A 1AA");
    expect.soft(ship.住所3, "保存された住所3（海外倉庫の配送先）").toBe("Floor 3");
  });
});

caseTest("IT-F04-02-045", async ({ page, notes, step, expected }) => {
  await login(page, WORK("045"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => {
    // 開発者ツールで、お届け先の選択をすべて解除して、お届け先変更の要求として送信する
    // 新しいブラウザセッションではお届け先の選択が会員情報住所に戻るので、配送の番号は「新しいお届け先」のボタンから読む（どの配送にも付いている）
    const action = await sp.新しいお届け先を登録するボタン.first().getAttribute("data-id", { timeout: 20_000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      page.evaluate((id) => {
        document.querySelectorAll<HTMLInputElement>('input[name="address_id"]').forEach((i) => { i.checked = false; });
        const f = document.getElementById("shopping-form") as HTMLFormElement;
        f.action = `${location.origin}/ja/shopping/shipping_change/${id}`;
        f.submit();
      }, action),
    ]);
    await page.waitForLoadState("load");
  });
  let ship = 受注の配送先(notes.get("〔受注ID-F0402-045〕"));
  await step(3, async () => { ship = 受注の配送先(notes.get("〔受注ID-F0402-045〕")); });
  await expected(async () => {
    expect(sp.パス, "お届け先選択画面に留まる").toBe("/ja/shopping");
    expect.soft(ship.住所1, "配送先の住所1（勤務先のまま）").toBe(勤務先.住所1);
    expect.soft(ship.住所2, "配送先の住所2（勤務先のまま）").toBe(勤務先.住所2);
  });
});

caseTest("IT-F04-02-072", async ({ page, step, expected }) => {
  await login(page, WORK("072"));
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await page.goto(`${new URL(page.url()).origin}/ja/shopping/confirm`, { timeout: 60_000 }); await page.waitForLoadState("load"); });
  await expected(async () => {
    expect(sp.パス, "遷移先の画面（買い物かご）").toBe("/ja/cart");
  });
});

caseTest("IT-F04-02-083", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-ITEMS-083");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  let rows: Awaited<ReturnType<ShoppingPage["商品の行"]>> = [];
  let total = "";
  await step(2, async () => { rows = await sp.商品の行(); total = await sp.商品金額合計(); });
  await expected(async () => {
    expect(rows.length, "ご注文の商品欄の行数").toBe(2);
    const a = rows.find((r) => unrc(r.商品名).includes("F0402-083-NAMEA"));
    const b = rows.find((r) => unrc(r.商品名).includes("F0402-083-NAMEB"));
    expect.soft(a?.言語, "商品Aの言語").toBe("日本語");
    expect.soft(a?.数量, "商品Aの数量").toBe("2");
    expect.soft(a?.合計.replace(/[^0-9]/g, ""), "商品Aの合計（税込）").toBe("2200");
    expect.soft(b?.言語, "商品Bの言語").toBe("英語");
    expect.soft(b?.数量, "商品Bの数量").toBe("3");
    expect.soft(b?.合計.replace(/[^0-9]/g, ""), "商品Bの合計（税込）").toBe("1650");
    expect.soft(total.replace(/[^0-9]/g, ""), "商品金額合計").toBe("3850");
  });
});

caseTest("IT-F04-02-098", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-02-ORDER-EXIST-098");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  const { 処理中受注ID一覧 } = await import("../../db/f04_02");
  let ids: string[] = [];
  await step(2, async () => { ids = 処理中受注ID一覧(notes.get("〔会員ID-F0402-098〕")); });
  await expected(async () => {
    expect(ids, "会員の処理中受注（ID）").toEqual([notes.get("〔処理中受注ID-F0402-098〕")]);
  });
});
