/**
 * F06-08 入荷待ち商品一覧の続き。正本: cases/F06-08_test_cases.tsv
 * 先の spec（f06-08.spec.ts）が外した、カード商品・まとめて入荷通知・多数の商品を使うケースのうち、画面だけで用意できるもの。
 * 入荷通知登録上限数（共有の設定）を20にするシードを使うので、基盤が1本だけで流し、終わったら控えた値へ戻して画面で確かめる。
 * 記録 review/F06-08_progress_2026-11-08.md
 */
import { Browser, Page, test } from "@playwright/test";
import { 商品単位の依頼件数, 有効な依頼件数 } from "../../db/f03_07";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { FrontRestock } from "../../pages/front/f03_07_restock_notify";
import { NotifyListB } from "../../pages/front/f06_08_notifylist_b";
import { 上限を20にする, 上限を戻す } from "../../seeds/f06-08";
import { 結果 } from "../../seeds/f06-08-b";

const supplement = (m: string) => { test.info().annotations.push({ type: "正本の外の補い", description: m }); };
const 上限の補い = "入荷通知登録上限数（共有の設定）をシードの定めどおりケースの開始時に20にし、終わったら控えた値へ戻した";

/** 共有の設定（入荷通知登録上限数）を20にし、会員でログインして、一覧の操作部品を返す。終わりは 終了() で控えた値へ戻す */
async function 開始(page: Page, browser: Browser, 番号: string): Promise<NotifyListB> {
  supplement(上限の補い);
  await 上限を20にする(browser);
  const r = 結果(番号);
  const n = new NotifyListB(page);
  await n.ログインする(r.mail, r.password);
  return n;
}
async function 終了(browser: Browser): Promise<void> {
  expect(await 上限を戻す(browser), "共有の設定（入荷通知登録上限数）を控えた値へ戻せた").toBe("");
}

// ---- 005・006: 一覧の件数と商品 ----

function 件数の確認(番号: string, 商品コード: string[], 件数: number) {
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    const n = await 開始(page, browser, 番号);
    try {
    let 名前: string[] = [];
    let 表示 = "";
    let 案内の数 = -1;
    await step(1, async () => { await n.開く(); });
    await step(2, async () => {
      await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 });
      名前 = await n.商品名一覧();
      表示 = await n.商品件数の表示();
      案内の数 = await n.案内文.count();
    });
    await expected(async () => {
      expect.soft([...名前].sort(), "表示された商品名").toEqual(商品コード.map((c) => rc(c)).sort());
      expect.soft(表示, "商品件数の表示").toMatch(new RegExp(`${件数}\\s*件`));
      expect.soft(案内の数, "入荷通知の案内が表示される").toBe(1);
    });
    } finally { await 終了(browser); }
  };
}
caseTest("IT-F06-08-005", 件数の確認("005", ["F0608-005A", "F0608-005B", "F0608-005C"], 3));
caseTest("IT-F06-08-006", 件数の確認("006", "ABCDEFGHIJKLMNOPQRST".split("").map((c) => `F0608-006${c}`), 20));

// ---- 007・008: 登録上限 ----

caseTest("IT-F06-08-007", async ({ browser, page, step, expected }) => {
  const n = await 開始(page, browser, "007");
  try {
  const r = 結果("007");
  const 名 = rc("CARD-LIMIT19-007");
  let 通知が出た = false;
  let 通知の文 = "";
  const got = { 商品単位: -1, 有効: -1 };
  await step(1, async () => { await n.開く(); });
  await step(2, async () => {
    const cards = await n.カード(名);
    expect(cards.length, "一覧にCARD-LIMIT19-007の商品がある").toBe(1);
    await n.名前を押す(cards[0].番号);
  });
  await step(3, async () => {
    const front = new FrontRestock(page);
    const p = await front.press(front.bulkButton);
    通知が出た = p.通知が出た;
    通知の文 = p.通知の文;
  });
  await step(4, async () => {
    got.商品単位 = 商品単位の依頼件数(r.会員ID, r.商品ID[0]).有効;
    got.有効 = 有効な依頼件数(r.会員ID);
  });
  await expected(async () => {
    expect.soft(通知が出た, `まとめて入荷通知の完了の通知が出る（${通知の文}）`).toBe(true);
    expect.soft(got.商品単位, "CARD-LIMIT19-007の商品・JPに対するまとめて入荷通知の件数").toBe(1);
    expect.soft(got.有効, "当該会員の有効な入荷通知の件数").toBe(20);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-008", async ({ browser, page, step, expected }) => {
  const n = await 開始(page, browser, "008");
  try {
  const r = 結果("008");
  const 名 = rc("CARD-LIMIT20-008");
  let 通知の文 = "";
  let 通知が出た = false;
  await step(1, async () => { await n.開く(); });
  await step(2, async () => {
    const cards = await n.カード(名);
    expect(cards.length, "一覧にCARD-LIMIT20-008の商品がある").toBe(1);
    await n.名前を押す(cards[0].番号);
  });
  await step(3, async () => {
    const front = new FrontRestock(page);
    const p = await front.press(front.classButton(r.規格ID[0][1]));
    通知が出た = p.通知が出た;
    通知の文 = p.通知の文;
  });
  await expected(async () => {
    expect.soft(通知が出た, "画面に通知（エラー）が表示される").toBe(true);
    expect.soft(通知の文, "上限超過のエラーの文（入荷通知依頼が上限の20件までであることを示す）").toMatch(/上限|20件まで/);
  });
  } finally { await 終了(browser); }
});

// ---- 012〜017: 一覧の表示 ----

caseTest("IT-F06-08-012", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "012");
  try {
  const 名 = rc("CARD-LANG-012");
  let cards: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); cards = await n.カード(名); });
  await expected(async () => {
    expect.soft(cards.length, "CARD-LANG-012の表示の数（JPとENに分かれる）").toBe(2);
    expect.soft(cards.map((c) => c.言語).sort(), "各表示の言語コード").toEqual(["EN", "JP"]);
    expect.soft(cards.map((c) => c.規格.some((x) => x.解除ボタン)), "各表示に登録済みの入荷通知の状態（解除ボタン）が表示される").toEqual([true, true]);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-013", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "013");
  try {
  const 名 = rc("CARD-GROUP-013");
  let cards: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); cards = await n.カード(名); });
  await expected(async () => {
    expect.soft(cards.length, "CARD-GROUP-013の商品表示の数（HP-Aの束とHP-Bの別表示）").toBe(2);
    expect.soft(cards.map((c) => c.規格.length).sort(), "各表示に束ねられた状態の明細の数（HP-AはNMとSP・HP-Bは1つ）").toEqual([1, 2]);
    const 束 = cards.find((c) => c.規格.length === 2);
    expect.soft(束?.規格.map((x) => x.状態).sort(), "束ねられた表示の状態").toEqual(["NM", "SP"]);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-014", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "014");
  try {
  const 名 = rc("CARD-FILTER-014");
  let cards: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); cards = await n.カード(名); });
  await expected(async () => {
    expect.soft(cards.length, "CARD-FILTER-014の表示の数").toBe(1);
    const rows = cards[0]?.規格 ?? [];
    expect.soft(rows.map((x) => x.状態), "表示された状態（NMだけ）").toEqual(["NM"]);
    expect.soft(rows[0]?.価格 ?? "", "NM規格の価格").toContain("1,111");
    expect.soft(rows[0]?.解除ボタン ?? false, "NM規格の解除ボタンが表示される").toBe(true);
    expect.soft(rows.some((x) => x.価格.includes("2,222")), "通知を設定していないSP規格の価格（2,222）が表示される").toBe(false);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-015", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "015");
  try {
  const 名 = rc("CARD-GROUP-015");
  let cards: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); cards = await n.カード(名); });
  await expected(async () => {
    expect.soft(cards.length, "CARD-GROUP-015の表示の数（HP-A-015でひとまとめ）").toBe(1);
    const 状態 = (cards[0]?.規格 ?? []).map((x) => x.状態);
    expect.soft(状態, "状態欄（個別メモがあるNMは「特記A」・個別メモがないSPは「SP」）").toEqual(["特記A", "SP"]);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-016", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "016");
  try {
  const 名 = rc("CARD-GROUP-016");
  let cards: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); cards = await n.カード(名); });
  await expected(async () => {
    expect.soft(cards.length, "CARD-GROUP-016の表示の数").toBe(1);
    expect.soft(cards[0]?.規格[0]?.価格 ?? "", "NM規格の価格（桁区切り）").toBe("¥123,456");
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-017", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "017");
  try {
  const 名 = rc("NOIMAGE-PRODUCT-017");
  let cards: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); cards = await n.カード(名); });
  await expected(async () => {
    expect.soft(cards.length, "NOIMAGE-PRODUCT-017の表示の数").toBe(1);
    expect.soft(cards[0]?.画像のsrc ?? "", "商品画像（画像がないことを示す代替画像）").toContain("no_image_product");
  });
  } finally { await 終了(browser); }
});

// ---- 019〜022: 画面遷移 ----

function 画像の補い(番号: string): void {
  if (!結果(番号).画像を付けられた[0]) supplement("商品画像を画面で追加できなかったため、画像なしの商品で続けた（画像は代替画像になる）");
}

caseTest("IT-F06-08-019", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "019");
  try {
  const r = 結果("019");
  画像の補い("019");
  await step(1, async () => { await n.開く(); });
  await step(2, async () => {
    const cards = await n.カード(rc("CARD-LANG-019"));
    expect(cards.length, "一覧にCARD-LANG-019の商品がある").toBe(1);
    await n.画像を押す(cards[0].番号);
  });
  await expected(async () => {
    expect.soft(n.path, "遷移した画面（CARD-LANG-019の商品詳細）").toBe(`/ja/products/detail/${r.商品ID[0]}`);
    expect.soft(n.クエリ.get("lang"), "商品詳細に指定された言語").toBe("JP");
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-020", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "020");
  try {
  const r = 結果("020");
  画像の補い("020");
  await step(1, async () => { await n.開く(); });
  await step(2, async () => {
    const cards = await n.カード(rc("HIGH-PRODUCT-020"));
    expect(cards.length, "一覧にHIGH-PRODUCT-020の商品がある").toBe(1);
    await n.画像を押す(cards[0].番号);
  });
  await expected(async () => {
    expect.soft(n.path, "遷移した画面（HIGH-PRODUCT-020の商品詳細）").toBe(`/ja/products/detail/${r.商品ID[0]}`);
    expect.soft(n.クエリ.get("lang"), "商品詳細に指定された言語").toBe("JP");
    expect.soft(n.クエリ.get("class"), "商品詳細に指定された規格（高額商品コードHP-Z-020の規格）").toBe(r.規格ID[0][0]);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-021", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "021");
  try {
  const r = 結果("021");
  await step(1, async () => { await n.開く(); });
  await step(2, async () => {
    const cards = await n.カード(rc("CARD-LANG-021"));
    expect(cards.length, "一覧にCARD-LANG-021の商品がある").toBe(1);
    expect(cards[0].言語, "一覧の言語の表示（EN）").toBe("EN");
    await n.名前を押す(cards[0].番号);
  });
  await expected(async () => {
    expect.soft(n.path, "遷移した画面（CARD-LANG-021の商品詳細）").toBe(`/ja/products/detail/${r.商品ID[0]}`);
    expect.soft(n.クエリ.get("lang"), "商品詳細に指定された言語").toBe("EN");
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-022", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "022");
  try {
  const r = 結果("022");
  await step(1, async () => { await n.開く(); });
  await step(2, async () => {
    const cards = await n.カード(rc("CARD-LANG-022"));
    expect(cards.length, "一覧にCARD-LANG-022の商品がある").toBe(1);
    await n.同名検索を押す(cards[0].番号);
  });
  await expected(async () => {
    expect.soft(n.path, "遷移した画面（商品一覧。商品の検索結果の画面）").toMatch(/\/products\/search$/);
    expect.soft(n.クエリ.get("cardId"), "検索条件のカードID").toBe(r.カードID);
  });
  } finally { await 終了(browser); }
});

// ---- 023・025〜027: 操作部品の有無 ----

caseTest("IT-F06-08-023", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "023");
  try {
  const 名 = rc("NONCARD-PRODUCT-023");
  let cards: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); cards = await n.カード(名); });
  await expected(async () => {
    expect.soft(cards.length, "NONCARD-PRODUCT-023の表示の数").toBe(1);
    expect.soft(cards[0]?.言語 ?? "x", "カード言語の表示が無い").toBe("");
    expect.soft(cards[0]?.同名検索 ?? true, "同名カード検索が表示されない").toBe(false);
    expect.soft(cards[0]?.まとめて枠 ?? true, "まとめて入荷通知の操作部品が表示されない").toBe(false);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-025", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "025");
  try {
  let a: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  let b: Awaited<ReturnType<NotifyListB["カード"]>> = [];
  await step(1, async () => { await n.開く(); });
  await step(2, async () => {
    await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 });
    a = await n.カード(rc("CARD-LANG-025"));
    b = await n.カード(rc("CARD-BULK-025"));
  });
  await expected(async () => {
    expect.soft(a.length, "CARD-LANG-025の表示の数").toBe(1);
    expect.soft(a[0]?.規格.some((x) => x.解除ボタン) ?? false, "CARD-LANG-025・JP規格に解除ボタンが表示される").toBe(true);
    expect.soft(b.length, "CARD-BULK-025の表示の数").toBe(1);
    expect.soft(b[0]?.まとめて解除 ?? false, "CARD-BULK-025・JPの商品単位の通知に解除ボタンが表示される").toBe(true);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-026", async ({ browser, page, step, expected }) => {
  const n = await 開始(page, browser, "026");
  try {
  const r = 結果("026");
  const sp = page.locator(`button[data-productclass="${r.規格ID[0][1]}"]`);
  const got = { 前: -1, 後: -1, NM前: false, NM後: false };
  const 読む = async (): Promise<{ sp: number; nm: boolean }> => {
    await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 });
    const cards = await n.カード(rc("CARD-FILTER-026"));
    return { sp: await sp.count(), nm: cards[0]?.規格.some((x) => x.規格ID === r.規格ID[0][0] && x.解除ボタン) ?? false };
  };
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { const v = await 読む(); got.前 = v.sp; got.NM前 = v.nm; });
  await step(3, async () => { await n.再読み込みする(); });
  await step(4, async () => { const v = await 読む(); got.後 = v.sp; got.NM後 = v.nm; });
  await expected(async () => {
    expect.soft(got.NM前 && got.NM後, "通知済みのNM規格の解除ボタンは、開いたときも再読み込み後も表示されている（一覧が読み込まれている）").toBe(true);
    expect.soft(got.前, "画面を開いたときの未登録SP規格の入荷通知ボタンの数").toBe(0);
    expect.soft(got.後, "再読み込み後の未登録SP規格の入荷通知ボタンの数").toBe(0);
  });
  } finally { await 終了(browser); }
});

caseTest("IT-F06-08-027", async ({ page, browser, step, expected }) => {
  const n = await 開始(page, browser, "027");
  try {
  const got = { 前: true, 後: true, 表示前: false, 表示後: false };
  const 読む = async (): Promise<{ 枠: boolean; 表示: boolean }> => {
    await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 });
    const cards = await n.カード(rc("CARD-LANG-027"));
    return { 枠: (cards[0]?.まとめて枠 ?? true) || (cards[0]?.まとめて解除 ?? true), 表示: cards.length === 1 };
  };
  await step(1, async () => { await n.開く(); });
  await step(2, async () => { const v = await 読む(); got.前 = v.枠; got.表示前 = v.表示; });
  await step(3, async () => { await n.再読み込みする(); });
  await step(4, async () => { const v = await 読む(); got.後 = v.枠; got.表示後 = v.表示; });
  await expected(async () => {
    expect.soft(got.表示前 && got.表示後, "CARD-LANG-027・JPの表示は、開いたときも再読み込み後もある（一覧が読み込まれている）").toBe(true);
    expect.soft(got.前, "画面を開いたときのまとめて入荷通知ボタンの表示").toBe(false);
    expect.soft(got.後, "再読み込み後のまとめて入荷通知ボタンの表示").toBe(false);
  });
  } finally { await 終了(browser); }
});

// ---- 034〜037: Foil × まとめて入荷通知 ----

function 組合せ(番号: string, foil: boolean, まとめて: boolean) {
  const code = `CARD-F0608-CB${番号}`;
  return async ({ page, browser, step, expected }: CaseCtx): Promise<void> => {
    const n = await 開始(page, browser, 番号);
    try {
    let row: Awaited<ReturnType<NotifyListB["カード"]>> = [];
    let 操作: Awaited<ReturnType<NotifyListB["カード"]>> = [];
    await step(1, async () => { await n.開く(); });
    await step(2, async () => { await n.商品カード.first().waitFor({ state: "visible", timeout: 60_000 }); row = await n.カード(rc(code)); });
    await step(3, async () => { 操作 = await n.カード(rc(code)); });
    await expected(async () => {
      expect.soft(row.length, `${code}の行の数`).toBe(1);
      expect.soft(row[0]?.名前 ?? "", "行の商品名").toBe(foil ? `【Foil】${rc(code)}` : rc(code));
      if (まとめて) {
        expect.soft(操作[0]?.まとめて解除 ?? false, "まとめて入荷通知の解除ボタンが表示される").toBe(true);
      } else {
        expect.soft(操作[0]?.まとめて解除 ?? true, "まとめて入荷通知の解除ボタンが表示されない").toBe(false);
        expect.soft(操作[0]?.まとめて枠 ?? true, "まとめて入荷通知ボタンが表示されない").toBe(false);
      }
    });
    } finally { await 終了(browser); }
  };
}
caseTest("IT-F06-08-034", 組合せ("034", true, true));
caseTest("IT-F06-08-035", 組合せ("035", true, false));
caseTest("IT-F06-08-036", 組合せ("036", false, true));
caseTest("IT-F06-08-037", 組合せ("037", false, false));
