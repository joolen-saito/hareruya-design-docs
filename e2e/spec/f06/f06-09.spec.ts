/**
 * F06-09 お気に入り商品一覧（フロント・マイページ）。正本: cases/F06-09_test_cases.tsv
 *
 * 実装しないケース: 002・003・034・037。シード表の投入方法が DB シードで、固定の番号の会員・百件前後の商品とお気に入りを作る
 * （画面で代えると共有の開発環境に百件前後の商品・在庫・お気に入りを残す。判断待ち）。
 *
 * 画面の作りから決めた読み方（各ケースの注記にも出す）:
 * - 商品数の欄は選択肢の一覧ではなく＋・－で増減する作り。「商品数で n を選択する」は＋・－で n にすること、「選べる値」は＋・－で届く値として読む。
 * - 価格は「¥1,000」のように桁区切り・記号つきで出るので、数字だけを取り出して比べる。
 * - 状態別の明細は、シードが明細ごとに違う販売価格にしているので、販売価格で明細を見分ける。
 * - 商品名の比べ方は、空白を除いた文で比べる（【Foil】と商品名の間に改行・空白が入る作り）。
 */
import { test } from "@playwright/test";
import { CaseCtx, caseTest, expect } from "../../lib/case";
import { お気に入り件数 } from "../../db/f03_08";
import { 会員のカートの商品の数量 } from "../../db/f02_01";
import { FrontCart } from "../../pages/front/f03_02_detail";
import { FavoriteListPage } from "../../pages/front/f06_09_favorite_list";
import { memberOf, productOf, 商品名, 高額商品コード } from "../../seeds/f06-09";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 事前準備③: ケース専用ブラウザ（日本語表示）で会員としてログインする */
async function ログイン(list: FavoriteListPage, 前半: string): Promise<void> {
  const m = memberOf(前半);
  await list.ログインする(m.mail, m.password);
}

/** 事前準備③の「本店カートが空であることを確認する」 */
async function カートが空か(list: FavoriteListPage): Promise<void> {
  const cart = new FrontCart(list.page);
  await cart.open();
  const rows = await cart.行();
  if (rows.length) throw new Error(`事前準備: 本店のカートが空でない（${rows.map((r) => r.商品名).join(" / ")}）`);
}

const 商品数の注記 = "商品数の欄は選択肢の一覧ではなく＋・－で増減する作りなので、＋・－を押して値を合わせた（届く値を「選べる値」として読んだ）";

// ---- 画面上部・件数・遷移 ----

caseTest("IT-F06-09-001", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-001");
  let text = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { text = await list.画面の文(); });
  await expected(async () => {
    expect.soft(await list.一覧画面か(), "お気に入り商品一覧画面が表示されている").toBe(true);
    expect.soft(text, "画面にログイン会員の名前「結合試験 会員」が出ない").not.toContain("結合試験");
  });
});

caseTest("IT-F06-09-004", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-004");
  let shown = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { shown = await list.商品件数の表示(); });
  await expected(async () => {
    note(`商品件数の表示は「${shown}」。数字を取り出して比べた`);
    expect.soft(Number(/(\d+)/.exec(shown)?.[1] ?? NaN), `商品件数の表示（${shown}）の数`).toBe(3);
  });
});

function 名前の並び(前半: string, 番号: string, 表示順: "高い順" | "低い順", 期待: string[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const list = new FavoriteListPage(page);
    await ログイン(list, 前半);
    await step(1, async () => { await list.開く(); });
    await step(2, async () => { note(`表示順は「${await list.並び順を選ぶ(表示順)}」を選んだ`); });
    await expected(async () => {
      expect.soft(await list.表示中の並び順の名前(), "画面の再読込み後の表示中の並び順").toContain(表示順);
      expect.soft(await list.商品名の並び(), `一覧の商品の並び（${番号}）`).toEqual(期待.map(商品名));
    });
  };
}
caseTest("IT-F06-09-006", 名前の並び("f0609-006", "006", "高い順", ["SORT-A-006", "SORT-B-006", "SORT-C-006"]));
caseTest("IT-F06-09-007", 名前の並び("f0609-007", "007", "低い順", ["SORT-C-007", "SORT-B-007", "SORT-A-007"]));

caseTest("IT-F06-09-005", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-005");
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.セール対象のみを切り替える(true); });
  await expected(async () => {
    expect.soft(await list.セール対象のみ.isChecked(), "画面の再読込み後、セール対象のみにチェックが入っている").toBe(true);
    expect.soft(await list.カードの商品(商品名("SALE-001-005")).count(), "SALE-001-005 が表示される").toBe(1);
    expect.soft(await list.カードの商品(商品名("REG-001-005")).count(), "REG-001-005 が表示されない").toBe(0);
    expect.soft(await list.商品名の並び(), "表示された商品").toEqual([商品名("SALE-001-005")]);
  });
});

caseTest("IT-F06-09-009", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-009");
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.押して遷移する(list.パンくずホーム); });
  await expected(async () => {
    expect.soft(list.path, "遷移した画面（本店のECTOP）").toMatch(/^\/ja\/?$/);
  });
});

caseTest("IT-F06-09-010", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-010");
  let moved = true;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { moved = await list.押して移るかを見る(list.パンくず現在地); });
  await expected(async () => {
    expect.soft(moved, "パンくずの現在地を押しても画面が移らない").toBe(false);
    expect.soft(await list.一覧画面か(), "お気に入り商品一覧画面のまま").toBe(true);
  });
});

function 詳細へ(前半: string, code: string, 押すもの: "画像" | "商品名") {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const list = new FavoriteListPage(page);
    await ログイン(list, 前半);
    const card = list.カードの商品(商品名(code));
    await step(1, async () => { await list.開く(); });
    await step(2, async () => {
      await expect(card, `${code} のカード`).toHaveCount(1);
      await list.押して遷移する(押すもの === "画像" ? list.画像のリンク(card) : list.商品名のリンク(card));
    });
    await expected(async () => {
      expect.soft(list.path, `遷移した画面（${code} の商品詳細）`).toBe(`/ja/products/detail/${productOf(code).productId}`);
    });
  };
}
caseTest("IT-F06-09-011", 詳細へ("f0609-011", "LINK-CARD-011", "画像"));
caseTest("IT-F06-09-012", 詳細へ("f0609-012", "LINK-CARD-012", "商品名"));

caseTest("IT-F06-09-013", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-013");
  const sale = list.カードの商品(商品名("SALE-001-013"));
  const reg = list.カードの商品(商品名("REG-001-013"));
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(sale, "SALE-001-013 のカード").toHaveCount(1);
    await expect(reg, "REG-001-013 のカード").toHaveCount(1);
  });
  await expected(async () => {
    expect.soft(await list.セールのラベル(sale).count(), "SALE-001-013 にセールのラベルが出る").toBe(1);
    expect.soft(await list.セールのラベル(reg).count(), "REG-001-013 にセールのラベルが出ない").toBe(0);
  });
});

caseTest("IT-F06-09-014", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-014");
  let shown: string[] = [];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    shown = [];
    for (const card of await list.カード.all()) shown.push(`${await list.商品名の文(card)}（${await list.言語(card)}）`);
    note(`表示された商品と言語: ${shown.join("、") || "なし"}`);
  });
  await expected(async () => {
    expect.soft(await list.一覧画面か(), "お気に入り商品一覧画面が表示されている").toBe(true);
    const 期待 = [["PUB-NORMAL-014", "JP"], ["PUB-HIGH-STOCK-014", "JP"], ["LANG-001-014", "JP"], ["LANG-001-014", "EN"]].map(([c, l]) => `${商品名(c)}（${l}）`);
    for (const e of 期待) expect.soft(shown, `${e} が表示される`).toContain(e);
    for (const c of ["PRIVATE-001-014", "PUB-HIGH-ZERO-014", "OTHER-001-014"]) {
      expect.soft(shown.filter((s) => s.startsWith(`${商品名(c)}（`)), `${c} が表示されない`).toEqual([]);
    }
    expect.soft([...shown].sort(), "表示された商品と言語がこの4行だけ").toEqual([...期待].sort());
  });
});

// ---- 状態別の明細 ----

caseTest("IT-F06-09-015", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-015");
  const card = list.カードの商品(商品名("DETAIL-001-015"));
  let rows: Awaited<ReturnType<FavoriteListPage["明細の表示"]>> = [];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "DETAIL-001-015 のカード").toHaveCount(1);
    rows = await list.明細の表示(card);
    note(`表示された明細: ${rows.map((r) => `状態「${r.状態 ?? "表示なし"}」・価格「${r.価格の文}」・在庫「${r.在庫の文}」`).join(" / ")}`);
  });
  await expected(async () => {
    expect.soft(rows.length, "表示対象の明細がある").toBeGreaterThan(0);
    for (const r of rows) {
      const what = `価格「${r.価格の文}」の明細`;
      expect.soft(r.状態 ?? "", `${what}に状態が表示される`).not.toBe("");
      expect.soft(r.価格, `${what}に価格が表示される`).not.toBeNull();
      expect.soft(r.在庫の文, `${what}に在庫が表示される`).toMatch(/\d/);
      expect.soft(r.商品数が見える, `${what}に商品数が表示される`).toBe(true);
    }
    await expect.soft(list.カートに入れるボタン(card), "カートに追加する操作が表示される").toBeVisible();
  });
});

/** 状態別の明細を販売価格で見分け、出る価格・出ない価格を確かめる */
function 明細の価格(前半: string, code: string, 出る: number[], 出ない: number[]) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const list = new FavoriteListPage(page);
    await ログイン(list, 前半);
    const card = list.カードの商品(商品名(code));
    let rows: Awaited<ReturnType<FavoriteListPage["明細の表示"]>> = [];
    await step(1, async () => { await list.開く(); });
    await step(2, async () => {
      await expect(card, `${code} のカード`).toHaveCount(1);
      rows = await list.明細の表示(card);
      note(`表示された明細: ${rows.map((r) => `状態「${r.状態 ?? "表示なし"}」・価格「${r.価格の文}」`).join(" / ")}。明細はシードが付けた販売価格で見分けた`);
    });
    await expected(async () => {
      const prices = rows.map((r) => r.価格);
      for (const p of 出る) expect.soft(prices, `販売価格${p}円の明細が表示される`).toContain(p);
      for (const p of 出ない) expect.soft(prices, `販売価格${p}円の明細が表示されない`).not.toContain(p);
    });
  };
}
caseTest("IT-F06-09-016", 明細の価格("f0609-016", "DETAIL-001-016", [50, 100], [99]));
caseTest("IT-F06-09-050", 明細の価格("cbf0609-050", "F0609-CB050-A", [200], []));
caseTest("IT-F06-09-051", 明細の価格("cbf0609-051", "F0609-CB051-A", [50], []));
caseTest("IT-F06-09-052", 明細の価格("cbf0609-052", "F0609-CB052-A", [200, 300], []));
caseTest("IT-F06-09-053", 明細の価格("cbf0609-053", "F0609-CB053-A", [200], [50]));

caseTest("IT-F06-09-017", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-017");
  const card = list.カードの商品(商品名("DETAIL-HIGH-001-017"));
  let 状態: string | null = null;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "DETAIL-HIGH-001-017 のカード").toHaveCount(1);
    const rows = (await list.明細の表示(card)).filter((r) => r.価格 === 200);
    expect(rows.length, "販売価格200円の明細").toBe(1);
    状態 = rows[0].状態;
  });
  await expected(async () => {
    const code = 高額商品コード("HIGH-0609-017");
    expect.soft(状態 ?? "（状態の表示なし）", `状態に続けて高額商品コード「${code}」が表示される`).toMatch(new RegExp(`^\\S+\\s*\\(${code}\\)$`));
  });
});

caseTest("IT-F06-09-043", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-043");
  const card = list.カードの商品(商品名("F0609-043-A"));
  let 状態: string | null = null;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "F0609-043-A のカード").toHaveCount(1);
    const rows = (await list.明細の表示(card)).filter((r) => r.価格 === 200);
    expect(rows.length, "販売価格200円の明細").toBe(1);
    状態 = rows[0].状態;
    note(`販売価格200円の明細の状態表示は「${状態 ?? "表示なし"}」`);
  });
  await expected(async () => {
    expect.soft(状態, "販売価格200円の明細の状態表示がある").not.toBeNull();
    expect.soft(状態 ?? "", "状態表示に高額商品コードが続かない").not.toContain("(");
    expect.soft(状態 ?? "", "状態表示に EX の明細の高額商品コードが出ない").not.toContain(高額商品コード("F0609-043-HIGH"));
  });
});

// ---- 商品数・カート ----

caseTest("IT-F06-09-018", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-018");
  const card = list.カードの商品(商品名("QTY-001-018"));
  let values: number[] = [];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "QTY-001-018 のカード").toHaveCount(1);
    values = await list.選べる商品数(list.明細(card).first());
    note(`${商品数の注記}。届いた値: ${values.join("・")}`);
  });
  await expected(async () => {
    expect.soft(Math.max(...values), "商品数で選べる最大の値（在庫数3）").toBe(3);
    for (const v of [1, 2, 3]) expect.soft(values, `商品数で${v}を選べる`).toContain(v);
  });
});

caseTest("IT-F06-09-041", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-041");
  const card = list.カードの商品(商品名("F0609-041-A"));
  let values: number[] = [];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "F0609-041-A のカード").toHaveCount(1);
    values = await list.選べる商品数(list.明細(card).first());
    note(`${商品数の注記}。届いた値: ${values.join("・")}`);
  });
  await expected(async () => {
    expect.soft(values, "商品数で選べる値が1・2・3の3つ").toEqual([1, 2, 3]);
  });
});

caseTest("IT-F06-09-019", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-019");
  const card = list.カードの商品(商品名("QTY-ZERO-001-019"));
  let rows: Awaited<ReturnType<FavoriteListPage["明細の表示"]>> = [];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "QTY-ZERO-001-019 のカード").toHaveCount(1);
    rows = await list.明細の表示(card);
    note(`明細: ${rows.map((r) => `価格「${r.価格の文}」・商品数の欄が見える=${r.商品数が見える}・＋を押せる=${r.商品数を変えられる}`).join(" / ")}`);
  });
  await expected(async () => {
    for (const r of rows) expect.soft(r.商品数が見える, `価格「${r.価格の文}」の明細に商品数が表示されない`).toBe(false);
    expect.soft(await list.カートに入れるボタン(card).count(), "カートに入れる操作が表示されない").toBe(0);
  });
});

caseTest("IT-F06-09-042", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-042");
  const card = list.カードの商品(商品名("F0609-042-A"));
  type R = Awaited<ReturnType<FavoriteListPage["明細の表示"]>>[number];
  let nm: R | undefined;
  let ex: R | undefined;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "F0609-042-A のカード").toHaveCount(1);
    nm = (await list.明細の表示(card)).find((r) => r.価格 === 200);
    note(`NM・200円の明細: ${nm ? `商品数の欄が見える=${nm.商品数が見える}・＋を押せる=${nm.商品数を変えられる}` : "見つからない"}`);
  });
  await step(3, async () => {
    ex = (await list.明細の表示(card)).find((r) => r.価格 === 300);
    note(`EX・300円の明細: ${ex ? `商品数の欄が見える=${ex.商品数が見える}・＋を押せる=${ex.商品数を変えられる}` : "見つからない"}。カートに入れるボタンは明細ごとでなく商品に1つの作りなので、明細の商品数の欄で明細ごとの操作の有無を見た`);
  });
  await expected(async () => {
    expect.soft(nm, "NM・200円の明細が表示されている").toBeDefined();
    expect.soft(nm?.商品数が見える, "NM・200円の明細に商品数（カートに入れる操作）が表示されない").toBe(false);
    expect.soft(ex, "EX・300円の明細が表示されている").toBeDefined();
    expect.soft(ex?.商品数が見える, "EX・300円の明細に商品数が表示される").toBe(true);
    expect.soft(ex?.商品数を変えられる, "EX・300円の明細の商品数を変えられる").toBe(true);
    await expect.soft(list.カートに入れるボタン(card), "カートに入れる操作が表示される").toBeVisible();
  });
});

caseTest("IT-F06-09-020", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-020");
  await カートが空か(list);
  const card = list.カードの商品(商品名("CART-001-020"));
  let qty: number[] = [];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "CART-001-020 のカード").toHaveCount(1);
    await list.商品数を合わせる(list.明細(card).first(), 2);
    note(商品数の注記);
  });
  await step(3, async () => {
    const r = await list.カートに入れる(card);
    note(`カートに入れたあとの表示: 通知「${r.通知}」${r.モーダル ? `・モーダル「${r.モーダル}」` : ""}`);
  });
  await step(4, async () => { qty = 会員のカートの商品の数量(memberOf("f0609-020").mail, 商品名("CART-001-020")); });
  await expected(async () => {
    expect.soft(qty, "カートの CART-001-020 の明細の数量").toEqual([2]);
  });
});

caseTest("IT-F06-09-021", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-021");
  await カートが空か(list);
  const card = list.カードの商品(商品名("CART-001-021"));
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "CART-001-021 のカード").toHaveCount(1);
    await list.商品数を合わせる(list.明細(card).first(), 1);
    note(商品数の注記);
  });
  await step(3, async () => {
    const r = await list.カートに入れる(card);
    note(`カートに入れたあとの表示: 通知「${r.通知}」${r.モーダル ? `・モーダル「${r.モーダル}」` : ""}`);
  });
  await expected(async () => {
    expect.soft(await list.一覧画面か(), "商品追加後もお気に入り商品一覧画面に留まる").toBe(true);
    expect.soft(list.path, "画面のアドレス").toMatch(/^\/ja\/mypage\/favorite\/?$/);
  });
});

/** 「表示されたモーダルが閉じる前に Yes を押す」。Yes が無ければ注記に残して押さない。押せたかを返す */
async function Yesを押す(list: FavoriteListPage, 通知: string): Promise<boolean> {
  const yes = list.Yesのボタン;
  if ((await yes.count()) === 0) {
    note(`画面に「Yes」のボタンが無い（カートに入れたあとに出たのは「${通知 || "表示なし"}」）。「Yes」は押せなかった`);
    return false;
  }
  await list.押して遷移する(yes.first());
  return true;
}

caseTest("IT-F06-09-022", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-022");
  await カートが空か(list);
  const card = list.カードの商品(商品名("CART-001-022"));
  let 通知 = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "CART-001-022 のカード").toHaveCount(1);
    const r = await list.カートに入れる(card);
    通知 = [r.通知, r.モーダル].filter(Boolean).join(" / ");
  });
  await step(3, async () => { await Yesを押す(list, 通知); });
  await expected(async () => {
    expect.soft(list.path, "遷移した画面（カート画面）").toMatch(/^\/ja\/cart\/?$/);
    const rows = list.path.startsWith("/ja/cart") ? await new FrontCart(page).行() : [];
    expect.soft(rows.map((r) => r.商品名).join(" / "), "カートに CART-001-022 が入っている").toContain(商品名("CART-001-022"));
  });
});

caseTest("IT-F06-09-038", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-038");
  await カートが空か(list);
  const card = list.カードの商品(商品名("F0609-038-A"));
  let 通知 = "";
  let rows: { 商品名: string; 数量: string }[] = [];
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "F0609-038-A のカード").toHaveCount(1);
    await list.商品数を合わせる(list.明細(card).first(), 1);
    note(商品数の注記);
  });
  await step(3, async () => {
    const r = await list.カートに入れる(card);
    通知 = [r.通知, r.モーダル].filter(Boolean).join(" / ");
  });
  await step(4, async () => { await Yesを押す(list, 通知); });
  await step(5, async () => {
    if (!list.path.startsWith("/ja/cart")) {
      note("カート画面へ移っていないので、カート画面を開いて数量を見た（期待結果はカートの数量だけを見る）");
      await new FrontCart(page).open();
    }
    rows = await new FrontCart(page).行();
  });
  await expected(async () => {
    const hit = rows.filter((r) => r.商品名.includes(商品名("F0609-038-A")));
    expect.soft(hit.map((r) => r.数量), "カート画面の F0609-038-A の数量").toEqual(["1"]);
  });
});

// ---- 0件・同名商品検索・削除・マイページ・未ログイン ----

caseTest("IT-F06-09-023", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-023");
  await step(1, async () => { await list.開く(); });
  await expected(async () => {
    expect.soft(list.path, "お気に入り商品一覧画面に留まる").toMatch(/^\/ja\/mypage\/favorite\/?$/);
    expect.soft(await list.一覧画面か(), "お気に入り商品一覧の見出しが表示される").toBe(true);
    expect.soft(await list.カード.count(), "お気に入り商品が0件").toBe(0);
    await expect.soft(list.商品なしの案内, "お気に入りが無いことの案内").toBeVisible();
  });
});

caseTest("IT-F06-09-024", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-024");
  const cardC = list.カードの商品(商品名("LINK-CARD-024"));
  const cardN = list.カードの商品(商品名("LINK-NONCARD-024"));
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(cardC, "LINK-CARD-024 のカード").toHaveCount(1);
    await expect(cardN, "LINK-NONCARD-024 のカード").toHaveCount(1);
  });
  await expected(async () => {
    expect.soft(await list.同名商品検索(cardC).count(), "カード商品 LINK-CARD-024 に同名商品検索が出る").toBe(1);
    expect.soft(await list.同名商品検索(cardN).count(), "非カード商品 LINK-NONCARD-024 に同名商品検索が出ない").toBe(0);
  });
});

caseTest("IT-F06-09-025", async ({ page, notes, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-025");
  const card = list.カードの商品(商品名("LINK-CARD-025"));
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "LINK-CARD-025 のカード").toHaveCount(1);
    await list.押して遷移する(list.同名商品検索(card));
  });
  await expected(async () => {
    const u = new URL(page.url());
    expect.soft(u.pathname, "遷移した画面（商品一覧）").toMatch(/^\/ja\/products\/search\/?$/);
    expect.soft(u.searchParams.get("card_id"), "検索に使ったカードID").toBe(notes.get("〔カードID-F0609-025〕"));
  });
});

caseTest("IT-F06-09-026", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-026");
  const card = list.カードの商品(商品名("DELETE-001-026"));
  let n = -1;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "DELETE-001-026 のカード").toHaveCount(1);
    await list.削除する(card);
  });
  await step(3, async () => { n = お気に入り件数(memberOf("f0609-026").id, productOf("DELETE-001-026").productId, "JP"); });
  await expected(async () => {
    expect.soft(n, "結合試験会員と DELETE-001-026 のお気に入り登録の件数").toBe(0);
  });
});

caseTest("IT-F06-09-027", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-027");
  const card = list.カードの商品(商品名("DELETE-001-027"));
  let 印 = false;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "DELETE-001-027 のカード").toHaveCount(1);
    await list.再読込みの印を置く();
    await list.削除する(card);
  });
  await step(3, async () => {
    印 = await list.再読込みの印が残っているか();
    note("再読込みの有無は、押す前に画面に置いた印が押したあとも残っているかで見た（再読込みすると印は消える）");
  });
  await expected(async () => {
    expect.soft(印, "画面が再読込みされていない").toBe(true);
    expect.soft(await list.カードの商品(商品名("DELETE-001-027")).count(), "DELETE-001-027 が画面から消える").toBe(0);
  });
});

caseTest("IT-F06-09-044", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-044");
  const [A, B, C] = ["F0609-044-A", "F0609-044-B", "F0609-044-C"];
  let 印 = false;
  let names: string[] = [];
  const db: Record<string, number> = {};
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(list.カードの商品(商品名(B)), `${B} のカード`).toHaveCount(1);
    await list.再読込みの印を置く();
    await list.削除する(list.カードの商品(商品名(B)));
  });
  await step(3, async () => {
    印 = await list.再読込みの印が残っているか();
    names = await list.商品名の並び();
  });
  await step(4, async () => {
    for (const c of [A, B, C]) db[c] = お気に入り件数(memberOf("f0609-044").id, productOf(c).productId, "JP");
  });
  await expected(async () => {
    expect.soft(印, "画面が再読込みされていない").toBe(true);
    expect.soft(names, `${B} が一覧から消える`).not.toContain(商品名(B));
    expect.soft(names, `${A} が一覧に残る`).toContain(商品名(A));
    expect.soft(names, `${C} が一覧に残る`).toContain(商品名(C));
    expect.soft(db[B], `${B} のお気に入り登録の件数（削除される）`).toBe(0);
    expect.soft(db[A], `${A} のお気に入り登録の件数（残る）`).toBe(1);
    expect.soft(db[C], `${C} のお気に入り登録の件数（残る）`).toBe(1);
  });
});

caseTest("IT-F06-09-028", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-028");
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.押して遷移する(list.マイページボタン); });
  await expected(async () => {
    expect.soft(list.path, "遷移した画面（マイページ）").toMatch(/^\/ja\/mypage\/?$/);
  });
});

caseTest("IT-F06-09-029", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  // 事前準備②: 保存済みのログイン状態・カート状態を持たない新しいブラウザ（このケースのブラウザ）。ログアウト状態であることを確かめる
  expect(await page.context().cookies(), "新しいブラウザにクッキーが無い").toEqual([]);
  await step(1, async () => { await list.開く(); });
  await expected(async () => {
    expect.soft(list.path, "遷移した画面（会員ログイン画面）").toMatch(/^\/ja\/mypage\/login\/?$/);
    expect.soft(await list.カード.count(), "お気に入り商品一覧が表示されない").toBe(0);
    expect.soft(await list.一覧画面か(), "お気に入り商品一覧画面でない").toBe(false);
  });
});

// ---- 絞り込み・並び順の組み合わせ ----

caseTest("IT-F06-09-030", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-030");
  let label = "";
  let weight = 0;
  let isLink = true;
  let moved = true;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { note(`表示順は「${await list.並び順を選ぶ("高い順")}」を選んだ`); });
  await step(3, async () => {
    const active = list.表示中の並び順;
    await expect(active, "表示中の並び順").toHaveCount(1);
    label = await list.表示中の並び順の名前();
    weight = Number(await active.evaluate((e) => window.getComputedStyle(e).fontWeight));
    isLink = await active.evaluate((e) => e.tagName === "A" || e.hasAttribute("href") || !!e.closest("a"));
    moved = await list.押して移るかを見る(active);
  });
  await expected(async () => {
    expect.soft(label, "表示中の並び順").toContain("高い順");
    expect.soft(weight, "表示中の並び順の文字の太さ（太字は600以上）").toBeGreaterThanOrEqual(600);
    expect.soft(isLink, "表示中の並び順はリンクでない").toBe(false);
    expect.soft(moved, "表示中の並び順を押しても画面が移らない").toBe(false);
  });
});

caseTest("IT-F06-09-031", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-031");
  let names: string[] = [];
  let sort = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { note(`表示順は「${await list.並び順を選ぶ("低い順")}」を選んだ`); });
  await step(3, async () => { await list.セール対象のみを切り替える(true); });
  await step(4, async () => { sort = await list.表示中の並び順の名前(); names = await list.商品名の並び(); });
  await expected(async () => {
    expect.soft(sort, "表示順").toContain("低い順");
    expect.soft(names, "表示された商品の並び").toEqual(["F0609-031-C", "F0609-031-A"].map(商品名));
  });
});

caseTest("IT-F06-09-032", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-032");
  let names: string[] = [];
  let checked = false;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.セール対象のみを切り替える(true); });
  await step(3, async () => { note(`表示順は「${await list.並び順を選ぶ("高い順")}」を選んだ`); });
  await step(4, async () => { checked = await list.セール対象のみ.isChecked(); names = await list.商品名の並び(); });
  await expected(async () => {
    expect.soft(checked, "セール対象のみにチェックが入ったまま").toBe(true);
    expect.soft(names, "表示された商品の並び").toEqual(["F0609-032-A", "F0609-032-C"].map(商品名));
  });
});

caseTest("IT-F06-09-033", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-033");
  let names: string[] = [];
  let checked = false;
  let sort = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await list.セール対象のみを切り替える(true); });
  await step(3, async () => { note(`表示順は「${await list.並び順を選ぶ("高い順")}」を選んだ`); });
  await step(4, async () => { await list.再読込みする(); });
  await step(5, async () => { checked = await list.セール対象のみ.isChecked(); sort = await list.表示中の並び順の名前(); names = await list.商品名の並び(); });
  await expected(async () => {
    expect.soft(checked, "ブラウザの再読込み後もセール対象のみにチェックが入っている").toBe(true);
    expect.soft(sort, "ブラウザの再読込み後の表示順").toContain("高い順");
    expect.soft(names, "表示された商品の並び").toEqual(["F0609-033-A", "F0609-033-C"].map(商品名));
  });
});

caseTest("IT-F06-09-035", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-035");
  const urls: string[] = [];
  await step(1, async () => { await list.開く(); urls[1] = list.url; note(`手順1のURL: ${urls[1]}`); });
  await step(2, async () => { await list.セール対象のみを切り替える(true); urls[2] = list.url; note(`手順2のURL: ${urls[2]}`); });
  await step(3, async () => { note(`表示順は「${await list.並び順を選ぶ("高い順")}」を選んだ`); urls[3] = list.url; note(`手順3のURL: ${urls[3]}`); });
  await step(4, async () => { await list.再読込みする(); urls[4] = list.url; note(`手順4のURL: ${urls[4]}`); });
  await expected(async () => {
    expect.soft(urls[2], "手順2のURLが手順1のURLと異なる").not.toBe(urls[1]);
    expect.soft(urls[3], "手順3のURLが手順2のURLと異なる").not.toBe(urls[2]);
    expect.soft(urls[4], "手順4（再読込み後）のURLが手順3のURLと同じ").toBe(urls[3]);
  });
});

caseTest("IT-F06-09-036", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-036");
  let names: string[] = [];
  let sort = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { note(`表示順は「${await list.並び順を選ぶ("低い順")}」を選んだ`); });
  await step(3, async () => { await list.セール対象のみを切り替える(true); });
  await step(4, async () => { await list.セール対象のみを切り替える(false); });
  await step(5, async () => { sort = await list.表示中の並び順の名前(); names = await list.商品名の並び(); });
  await expected(async () => {
    expect.soft(sort, "表示順").toContain("低い順");
    expect.soft(names, "表示された商品の並び（4件すべて）").toEqual(["F0609-036-D", "F0609-036-C", "F0609-036-B", "F0609-036-A"].map(商品名));
  });
});

// ---- 商品名の【Foil】・同名商品検索 ----

caseTest("IT-F06-09-039", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-039");
  const card = list.カードの商品(商品名("F0609-039-A"));
  let name = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await expect(card, "F0609-039-A のカード").toHaveCount(1); name = await list.商品名の文(card); });
  await expected(async () => {
    expect.soft(name, "商品名の表示（空白を除いた文）").toBe(`【Foil】${商品名("F0609-039-A")}`);
  });
});

caseTest("IT-F06-09-040", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "f0609-040");
  const card = list.カードの商品(商品名("F0609-040-A"));
  let name = "";
  await step(1, async () => { await list.開く(); });
  await step(2, async () => { await expect(card, "F0609-040-A のカード").toHaveCount(1); name = await list.商品名の文(card); });
  await expected(async () => {
    expect.soft(name, "商品名の表示（空白を除いた文）").toBe(商品名("F0609-040-A"));
    expect.soft(name.startsWith("【Foil】"), "先頭に【Foil】が付かない").toBe(false);
  });
});

caseTest("IT-F06-09-055", async ({ page, step, expected }) => {
  const list = new FavoriteListPage(page);
  await ログイン(list, "cbf0609-055");
  const card = list.カードの商品(商品名("F0609-CB055-A"));
  let name = "";
  let same = -1;
  await step(1, async () => { await list.開く(); });
  await step(2, async () => {
    await expect(card, "F0609-CB055-A のカード").toHaveCount(1);
    name = await list.商品名の文(card);
    same = await list.同名商品検索(card).count();
  });
  await expected(async () => {
    expect.soft(name, "商品名の表示（空白を除いた文）").toBe(商品名("F0609-CB055-A"));
    expect.soft(name.startsWith("【Foil】"), "先頭に【Foil】が付かない").toBe(false);
    expect.soft(same, "同名商品検索が表示されない").toBe(0);
  });
});

// ---- 一覧に出る・出ない（高額商品コード・在庫・公開） ----

function 行の有無(前半: string, code: string, 出る: boolean) {
  return async ({ page, step, expected }: CaseCtx): Promise<void> => {
    const list = new FavoriteListPage(page);
    await ログイン(list, 前半);
    let n = -1;
    await step(1, async () => { await list.開く(); });
    await step(2, async () => { n = await list.カードの商品(商品名(code)).count(); });
    await expected(async () => {
      expect.soft(await list.一覧画面か(), "お気に入り商品一覧画面が表示されている").toBe(true);
      expect.soft(n, `${code} の商品行が${出る ? "表示される" : "表示されない"}`).toBe(出る ? 1 : 0);
    });
  };
}
caseTest("IT-F06-09-045", 行の有無("cbf0609-045", "F0609-CB045-A", true));
caseTest("IT-F06-09-046", 行の有無("cbf0609-046", "F0609-CB046-A", true));
caseTest("IT-F06-09-047", 行の有無("cbf0609-047", "F0609-CB047-A", false));
caseTest("IT-F06-09-048", 行の有無("cbf0609-048", "F0609-CB048-A", true));
caseTest("IT-F06-09-049", 行の有無("cbf0609-049", "F0609-CB049-A", false));
